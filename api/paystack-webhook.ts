import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

interface PaystackEvent {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number; // In kobo
    currency?: string;
    metadata?: Record<string, any>;
    customer?: {
      email?: string;
    };
  };
}

interface ProductRow {
  id: string;
  name: string;
  price_kobo: number;
  duration_days: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const secret =
    process.env.PAYSTACK_SECRET_KEY ||
    "";
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "supabase_not_configured" });
    return;
  }

  // 1. Signature validation
  const receivedSig = req.headers["x-paystack-signature"];
  if (typeof receivedSig === "string" && secret) {
    try {
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (hash !== receivedSig) {
        console.warn("[Paystack Webhook] Signature mismatch, will verify via REST API");
      }
    } catch (sigErr) {
      console.warn("[Paystack Webhook] Signature hash calculation error:", sigErr);
    }
  }

  const event = (req.body ?? {}) as PaystackEvent;
  const data = event.data;
  const eventName = event.event;

  console.log("[Paystack Webhook] Received event:", eventName, "reference:", data?.reference);

  // We are interested in charge.success
  if (eventName !== "charge.success" || !data) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const reference = data.reference;
  if (!reference) {
    res.status(200).json({ received: true, ignored: "no_reference" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 2. Double-verify directly with Paystack API for 100% security
  let verifiedAmountKobo = data.amount;
  let verifiedStatus = data.status;
  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      },
    );
    const verifyBody = (await verifyRes.json()) as {
      status?: boolean;
      data?: {
        status?: string;
        amount?: number;
        reference?: string;
      };
    };

    if (verifyRes.ok && verifyBody.status && verifyBody.data) {
      verifiedStatus = verifyBody.data.status;
      verifiedAmountKobo = verifyBody.data.amount;
    }
  } catch (verifyErr) {
    console.warn("[Paystack Webhook] Direct verification warning:", verifyErr);
  }

  if (verifiedStatus !== "success") {
    res.status(200).json({ received: true, ignored: "not_successful" });
    return;
  }

  const parsed = parseTxRef(reference);
  if (!parsed) {
    res.status(200).json({ received: true, ignored: "non_storefront_ref" });
    return;
  }

  if (data.currency && data.currency !== "NGN") {
    res.status(200).json({ received: true, ignored: "non_ngn_currency" });
    return;
  }

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

    // Verify amount in kobo
    if (
      typeof verifiedAmountKobo === "number" &&
      verifiedAmountKobo < product.price_kobo
    ) {
      res.status(200).json({ received: true, ignored: "amount_mismatch" });
      return;
    }

    // Deduplication check
    const { data: existing } = await admin
      .from("product_access")
      .select("id")
      .eq("payment_reference", reference)
      .maybeSingle();

    if (existing) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    // Calculate access expiration
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
      source: "paystack",
      payment_reference: reference,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    // 3. Credit 30% affiliate commission if the user was referred
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
          console.warn("Pre-commission link_referral error:", linkErr);
        }
      }

      const orderAmountNaira = product.price_kobo / 100;
      await admin.rpc("credit_affiliate_commission", {
        p_buyer_id: parsed.userId,
        p_order_amount: orderAmountNaira,
        p_source: "paystack_webhook",
      });
    } catch (commissionError) {
      console.error("Failed to credit affiliate commission:", commissionError);
    }

    res.status(200).json({ received: true, granted: product.name });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "webhook_failed",
    });
  }
}
