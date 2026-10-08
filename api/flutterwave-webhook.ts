import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

function parseTxRef(
  txRef: string,
): { productId: string; userId: string } | null {
  const parts = txRef.split(":");
  if (parts.length !== 3 || parts[0] !== "sf") return null;
  const [, productId, userId] = parts;
  if (!productId || !userId) return null;
  return { productId, userId };
}

interface FlutterwaveEvent {
  event?: string;
  type?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
}

interface ProductRow {
  id: string;
  name: string;
  price_kobo: number;
  duration_days: number;
}

function signatureMatches(
  received: string | string[] | undefined,
  secret: string,
): boolean {
  if (typeof received !== "string") return false;
  const a = Buffer.from(received);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    res.status(503).json({ error: "webhook_secret_not_configured" });
    return;
  }
  if (!signatureMatches(req.headers["verif-hash"], secret)) {
    res.status(401).json({ error: "bad_signature" });
    return;
  }
  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "supabase_not_configured" });
    return;
  }

  const event = (req.body ?? {}) as FlutterwaveEvent;
  const data = event.data;
  const eventName = event.event ?? event.type;

  if (
    eventName !== "charge.completed" ||
    !data ||
    !["successful", "succeeded"].includes(data.status ?? "")
  ) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const txRefValue = data.tx_ref ?? data.reference;
  if (!txRefValue || data.id === undefined) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  let checkTxRef = txRefValue;
  let checkAmount = data.amount;
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (secretKey) {
    try {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
          String(data.id),
        )}/verify`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      const body = (await response.json()) as {
        message?: string;
        data?: { status?: string; tx_ref?: string; amount?: number };
      };
      const verified = body.data;
      if (!response.ok || !verified) {
        res
          .status(502)
          .json({ error: "verification_failed", message: body.message });
        return;
      }
      if (!["successful", "succeeded"].includes(verified.status ?? "")) {
        res.status(200).json({ received: true, ignored: "not_successful" });
        return;
      }
      if (verified.tx_ref) checkTxRef = verified.tx_ref;
      if (typeof verified.amount === "number") checkAmount = verified.amount;
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : "verification_error",
      });
      return;
    }
  }

  const parsed = parseTxRef(checkTxRef);
  if (!parsed) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  if (data.currency && data.currency !== "NGN") {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id, name, price_kobo, duration_days")
      .eq("id", parsed.productId)
      .maybeSingle<ProductRow>();

    if (productError) {
      res.status(500).json({ error: productError.message });
      return;
    }
    if (!product) {
      res.status(200).json({ received: true, ignored: "unknown_product" });
      return;
    }

    if (
      typeof checkAmount === "number" &&
      checkAmount + 0.001 < product.price_kobo / 100
    ) {
      res.status(200).json({ received: true, ignored: "amount_mismatch" });
      return;
    }

    const reference = String(data.id);
    const { data: existing } = await admin
      .from("product_access")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    const { data: current } = await admin
      .from("product_access")
      .select("expires_at")
      .eq("user_id", parsed.userId)
      .eq("product_id", product.id)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ expires_at: string }>();

    const base =
      current && new Date(current.expires_at).getTime() > Date.now()
        ? new Date(current.expires_at)
        : new Date();
    const expiresAt = new Date(
      base.getTime() + product.duration_days * 24 * 60 * 60 * 1000,
    );

    const { error: insertError } = await admin.from("product_access").insert({
      user_id: parsed.userId,
      product_id: product.id,
      source: "flutterwave",
      payment_reference: reference,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    res.status(200).json({ received: true, granted: product.name });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "webhook_failed",
    });
  }
}
