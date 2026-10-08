import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function parseTxRef(txRef: string): { productId: string; userId: string } | null {
  const parts = txRef.split(":");
  if (parts.length !== 3 || parts[0] !== "sf") return null;
  const [, productId, userId] = parts;
  if (!productId || !userId) return null;
  return { productId, userId };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { transactionId, txRef } = req.body;
  if (!transactionId || !txRef) {
    res.status(400).json({ error: "missing_parameters" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey || !secretKey) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const parsed = parseTxRef(txRef);
  if (!parsed) {
    res.status(400).json({ error: "invalid_tx_ref" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 1. Verify with Flutterwave
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    const body = (await response.json()) as any;
    
    if (!response.ok || !body.data) {
      res.status(400).json({ error: "verification_failed", message: body.message });
      return;
    }

    const verified = body.data;
    if (!["successful", "succeeded"].includes(verified.status ?? "")) {
      res.status(400).json({ error: "payment_not_successful" });
      return;
    }

    // 2. Verify amount
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id, name, price_kobo, duration_days")
      .eq("id", parsed.productId)
      .maybeSingle();

    if (productError || !product) {
      res.status(404).json({ error: "product_not_found" });
      return;
    }

    if (verified.amount + 0.001 < product.price_kobo / 100) {
      res.status(400).json({ error: "amount_mismatch" });
      return;
    }

    // 3. Check if already granted
    const { data: existing } = await admin
      .from("product_access")
      .select("id")
      .eq("payment_reference", String(transactionId))
      .maybeSingle();

    if (existing) {
      res.status(200).json({ success: true, already_granted: true });
      return;
    }

    // 4. Grant access
    const { data: current } = await admin
      .from("product_access")
      .select("expires_at")
      .eq("user_id", parsed.userId)
      .eq("product_id", product.id)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const base = current && new Date(current.expires_at).getTime() > Date.now()
        ? new Date(current.expires_at)
        : new Date();
    const expiresAt = new Date(base.getTime() + product.duration_days * 24 * 60 * 60 * 1000);

    const { error: insertError } = await admin.from("product_access").insert({
      user_id: parsed.userId,
      product_id: product.id,
      source: "flutterwave",
      payment_reference: String(transactionId),
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "verification_error" });
  }
}
