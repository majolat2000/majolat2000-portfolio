import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function parseTxRef(
  txRef: string,
): { productId: string; userId: string } | null {
  // New format: sf-<uuid>-<uuid>-<timestamp>  (hyphens only, no colons)
  // Legacy format: sf:<uuid>:<uuid>            (colons)
  if (txRef.startsWith("sf:")) {
    const parts = txRef.split(":");
    if (parts.length !== 3) return null;
    const [, productId, userId] = parts;
    if (!productId || !userId) return null;
    return { productId, userId };
  }
  if (!txRef.startsWith("sf-")) return null;
  const rest = txRef.slice(3);
  if (rest.length < 74) return null;
  const productId = rest.slice(0, 36);
  const userId = rest.slice(37, 73);
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

  const { reference, transactionId, txRef } = req.body ?? {};
  const queryRef = reference || txRef || transactionId;

  if (!queryRef) {
    res.status(400).json({ error: "missing_parameters", message: "reference or transactionId is required" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paystackSecret =
    process.env.PAYSTACK_SECRET_KEY ||
    "";
  const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    let verifiedRef: string | null = null;
    let verifiedAmountKobo: number | null = null;
    let paymentSource = "paystack";

    // 1. Try Paystack Verification first
    if (paystackSecret) {
      try {
        const psRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(String(queryRef))}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (psRes.ok) {
          const psBody = (await psRes.json()) as {
            status?: boolean;
            data?: {
              status?: string;
              reference?: string;
              amount?: number; // In kobo
            };
          };

          if (psBody.status && psBody.data?.status === "success") {
            verifiedRef = psBody.data.reference || String(queryRef);
            verifiedAmountKobo = psBody.data.amount ?? null;
            paymentSource = "paystack";
          }
        }
      } catch (psErr) {
        console.warn("[Verify] Paystack error:", psErr);
      }
    }

    // 2. Fallback to Flutterwave if not found on Paystack and FLW secret exists
    if (!verifiedRef && flwSecret) {
      try {
        const flwRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(queryRef))}/verify`,
          { headers: { Authorization: `Bearer ${flwSecret}` } },
        );
        if (flwRes.ok) {
          const flwBody = (await flwRes.json()) as {
            data?: { status?: string; tx_ref?: string; amount?: number };
          };
          if (["successful", "succeeded"].includes(flwBody.data?.status ?? "")) {
            verifiedRef = flwBody.data?.tx_ref || String(queryRef);
            verifiedAmountKobo = flwBody.data?.amount ? Math.round(flwBody.data.amount * 100) : null;
            paymentSource = "flutterwave";
          }
        }
      } catch (flwErr) {
        console.warn("[Verify] FLW fallback error:", flwErr);
      }
    }

    if (!verifiedRef) {
      res.status(400).json({ error: "verification_failed", message: "Transaction could not be verified with payment provider." });
      return;
    }

    // 3. Parse target product and user from txRef
    const parsed = parseTxRef(verifiedRef);
    if (!parsed) {
      console.error("Invalid tx ref:", verifiedRef);
      res.status(400).json({ error: "invalid_tx_ref" });
      return;
    }

    // 4. Validate product
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id, name, price_kobo, duration_days")
      .eq("id", parsed.productId)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product fetch failed:", productError, "product id:", parsed.productId);
      res.status(404).json({ error: "product_not_found" });
      return;
    }

    if (
      typeof verifiedAmountKobo === "number" &&
      verifiedAmountKobo < product.price_kobo
    ) {
      console.error("Amount mismatch:", verifiedAmountKobo, product.price_kobo);
      res.status(400).json({
        error: "amount_mismatch",
        expected_kobo: product.price_kobo,
        received_kobo: verifiedAmountKobo,
      });
      return;
    }

    // 5. Check if already granted
    const { data: existing } = await admin
      .from("product_access")
      .select("id")
      .eq("payment_reference", String(queryRef))
      .maybeSingle();

    if (existing) {
      res.status(200).json({ success: true, already_granted: true });
      return;
    }

    // 6. Grant access
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
      source: paymentSource,
      payment_reference: String(queryRef),
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      res.status(500).json({ error: insertError.message });
      return;
    }

    // 7. Credit affiliate commission if buyer was referred
    try {
      const { data: authUserData } = await admin.auth.admin.getUserById(parsed.userId);
      const metaRef = authUserData?.user?.user_metadata?.referral_code;
      if (metaRef && typeof metaRef === "string" && metaRef.trim()) {
        try {
          await admin.rpc("link_referral", {
            p_user_id: parsed.userId,
            p_referral_code: metaRef.trim(),
          });
        } catch (linkErr) {
          console.warn("Pre-payment link_referral error:", linkErr);
        }
      }

      const orderAmountNaira = product.price_kobo / 100;
      await admin.rpc("credit_affiliate_commission", {
        p_buyer_id: parsed.userId,
        p_order_amount: orderAmountNaira,
        p_source: "verify_payment",
      });
    } catch (commissionError) {
      console.error("Failed to credit affiliate commission:", commissionError);
    }

    res.status(200).json({ success: true, granted: product.name });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "verification_error",
    });
  }
}
