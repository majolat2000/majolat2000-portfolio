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
    res.status(401).json({ error: "missing_authorization" });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey || !flwSecret) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const client = createClient(supabaseUrl, anonKey ?? serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  const { account_number, account_bank } = req.body ?? {};
  const cleanAccount = String(account_number ?? "").trim().replace(/\D/g, "");
  const cleanBank = String(account_bank ?? "").trim();

  if (!cleanAccount || cleanAccount.length !== 10) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid 10-digit NUBAN account number.",
    });
    return;
  }

  if (!cleanBank) {
    res.status(400).json({
      success: false,
      message: "Please select a destination bank.",
    });
    return;
  }

  try {
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

    res.status(400).json({
      success: false,
      message:
        flwData.message ||
        "Account not found or invalid account details for this bank. Please check and try again.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Unable to verify account details at this time.",
    });
  }
}
