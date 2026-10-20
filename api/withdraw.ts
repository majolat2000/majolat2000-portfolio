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
    res.status(401).json({ error: "missing_or_invalid_authorization_header" });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const client = createClient(supabaseUrl, anonKey ?? serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "invalid_token", message: userError?.message });
    return;
  }

  const userId = userData.user.id;
  const { account_bank, account_number, account_name, bank_name, amount } = req.body ?? {};

  const numAmount = Number(amount);
  if (!account_bank || !account_number || isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({
      error: "invalid_parameters",
      message: "account_bank, account_number, and a positive amount are required.",
    });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Unique reference for tracking this withdrawal request
  const transferRef = `wth_${Date.now()}_${userId.slice(0, 8)}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 1. SECURE PRE-DEDUCTION:
    // Deduct the requested amount atomically via row-level locked RPC so the user cannot double-spend.
    const { data: newBalance, error: deductError } = await admin.rpc(
      "deduct_wallet_balance_for_withdrawal",
      {
        p_user_id: userId,
        p_amount: numAmount,
      },
    );

    if (deductError) {
      if (deductError.message.includes("insufficient_balance")) {
        res.status(400).json({
          error: "insufficient_balance",
          message: "Your affiliate wallet balance is insufficient for this withdrawal.",
        });
        return;
      }
      res.status(400).json({ error: "deduction_failed", message: deductError.message });
      return;
    }

    // 2. Insert PENDING manual withdrawal request
    const insertPayload: Record<string, any> = {
      user_id: userId,
      amount: numAmount,
      account_bank: String(account_bank).trim(),
      account_number: String(account_number).trim(),
      transfer_ref: transferRef,
      status: "PENDING",
    };

    if (account_name && typeof account_name === "string") {
      insertPayload.account_name = account_name.trim();
    }
    if (bank_name && typeof bank_name === "string") {
      insertPayload.bank_name = bank_name.trim();
    }

    let { error: insertError } = await admin.from("withdrawals").insert(insertPayload);

    // Gracefully handle if account_name or bank_name columns are pending migration
    if (insertError && (insertError.message.includes("account_name") || insertError.message.includes("bank_name"))) {
      delete insertPayload.account_name;
      delete insertPayload.bank_name;
      const retry = await admin.from("withdrawals").insert(insertPayload);
      insertError = retry.error;
    }

    if (insertError) {
      // Refund wallet balance immediately if insertion fails
      await admin.rpc("refund_failed_withdrawal", {
        p_transfer_ref: transferRef,
        p_reason: "Failed to record withdrawal transaction",
      });
      res.status(500).json({ error: "db_error", message: insertError.message });
      return;
    }

    // 3. Return pending status (Admin will manually transfer and approve)
    res.status(200).json({
      success: true,
      message:
        "Withdrawal request submitted successfully! An administrator will verify your bank details, send the payment manually, and approve the request.",
      reference: transferRef,
      new_balance: newBalance,
      status: "PENDING",
    });
  } catch (error) {
    try {
      await admin.rpc("refund_failed_withdrawal", {
        p_transfer_ref: transferRef,
        p_reason: error instanceof Error ? error.message : "Unexpected exception during withdrawal",
      });
    } catch {
      // Ignore secondary refund errors
    }

    res.status(500).json({
      error: "server_error",
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
