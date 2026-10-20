import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing authorization token." });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const paystackSecret = (
    process.env.PAYSTACK_SECRET_KEY ||
    ""
  ).trim();
  const flwSecret = (process.env.FLUTTERWAVE_SECRET_KEY ?? "").trim();

  if (supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser(token);
    if (userError || !userData?.user) {
      res.status(401).json({ success: false, message: "Invalid or expired session token." });
      return;
    }
  }

  const { account_number, account_bank } = req.body ?? {};
  const cleanAccount = String(account_number ?? "").trim().replace(/\D/g, "");
  const cleanBank = String(account_bank ?? "").trim();

  if (!cleanAccount || cleanAccount.length !== 10) {
    res.status(200).json({
      success: false,
      message: "Please enter a complete 10-digit NUBAN account number.",
    });
    return;
  }

  if (!cleanBank) {
    res.status(200).json({
      success: false,
      message: "Please select a destination bank.",
    });
    return;
  }

  try {
    // 1. Resolve using Paystack Bank Resolve API
    if (paystackSecret) {
      const psRes = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
          cleanAccount,
        )}&bank_code=${encodeURIComponent(cleanBank)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
        },
      );

      const psData = (await psRes.json()) as {
        status?: boolean;
        message?: string;
        data?: {
          account_number?: string;
          account_name?: string;
        };
      };

      if (psRes.ok && psData.status && psData.data?.account_name) {
        res.status(200).json({
          success: true,
          account_name: psData.data.account_name,
          account_number: psData.data.account_number || cleanAccount,
        });
        return;
      }

      // If Paystack specifically returned an error message, let's keep it
      if (!psRes.ok && psData.message && !flwSecret) {
        res.status(200).json({
          success: false,
          message: psData.message,
        });
        return;
      }
    }

    // 2. Fallback to Flutterwave if configured
    if (flwSecret) {
      const flwResponse = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${flwSecret}`,
        },
        body: JSON.stringify({
          account_number: cleanAccount,
          account_bank: cleanBank,
        }),
      });

      const flwData = (await flwResponse.json()) as {
        status?: string;
        message?: string;
        data?: {
          account_number?: string;
          account_name?: string;
        };
      };

      if (flwResponse.ok && flwData.status === "success" && flwData.data?.account_name) {
        res.status(200).json({
          success: true,
          account_name: flwData.data.account_name,
          account_number: flwData.data.account_number,
        });
        return;
      }

      res.status(200).json({
        success: false,
        message: flwData.message || "Account not found or invalid account details for this bank. Please check and try again.",
      });
      return;
    }

    res.status(200).json({
      success: false,
      message: "Account not found or invalid account details for this bank. Please check and try again.",
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Unable to verify account details at this time.",
    });
  }
}
