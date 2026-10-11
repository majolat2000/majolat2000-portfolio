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
    res.status(401).json({ error: "invalid_token", message: userError?.message });
    return;
  }

  const userId = userData.user.id;
  const { account_bank, account_number, amount } = req.body ?? {};

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

  // Unique transfer reference to prevent duplicate payout attempts
  const transferRef = `wth_${Date.now()}_${userId.slice(0, 8)}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 1. SECURE PRE-DEDUCTION:
    // Deduct the amount FIRST atomically via row-level locked RPC to eliminate race conditions / double spending.
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

    // 2. Insert PENDING record in withdrawals table
    const { error: insertError } = await admin.from("withdrawals").insert({
      user_id: userId,
      amount: numAmount,
      account_bank: String(account_bank).trim(),
      account_number: String(account_number).trim(),
      transfer_ref: transferRef,
      status: "PENDING",
    });

    if (insertError) {
      // Refund wallet balance immediately if record cannot be created
      await admin.rpc("refund_failed_withdrawal", {
        p_transfer_ref: transferRef,
        p_reason: "Failed to record withdrawal transaction",
      });
      res.status(500).json({ error: "db_error", message: insertError.message });
      return;
    }

    // 3. Initiate Transfer via Flutterwave v3 Transfers API
    const flwResponse = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${flwSecret}`,
      },
      body: JSON.stringify({
        account_bank: String(account_bank).trim(),
        account_number: String(account_number).trim(),
        amount: numAmount,
        narration: "Affiliate Payout",
        currency: "NGN",
        reference: transferRef,
        debit_currency: "NGN",
      }),
    });

    const flwResult = (await flwResponse.json()) as {
      status?: string;
      message?: string;
      data?: {
        id?: number;
        status?: string;
        reference?: string;
        complete_message?: string;
      };
    };

    if (!flwResponse.ok || flwResult.status !== "success" || !flwResult.data) {
      // Transfer initiation rejected by Flutterwave — refund wallet balance immediately
      const reason = flwResult.message || "Flutterwave transfer initiation rejected";
      await admin.rpc("refund_failed_withdrawal", {
        p_transfer_ref: transferRef,
        p_reason: reason,
      });

      res.status(400).json({
        error: "transfer_failed",
        message: reason,
        refunded: true,
      });
      return;
    }

    const transferData = flwResult.data;
    const transferId = transferData.id ? String(transferData.id) : null;

    if (transferData.status === "FAILED") {
      // Immediate failure
      await admin.rpc("refund_failed_withdrawal", {
        p_transfer_ref: transferRef,
        p_reason: transferData.complete_message || "Transfer failed at destination bank",
      });

      res.status(400).json({
        error: "transfer_failed",
        message: transferData.complete_message || "Transfer was declined by the bank.",
        refunded: true,
      });
      return;
    }

    // Update withdrawal record with Flutterwave transfer ID
    await admin
      .from("withdrawals")
      .update({
        transfer_id: transferId,
        updated_at: new Date().toISOString(),
      })
      .eq("transfer_ref", transferRef);

    res.status(200).json({
      success: true,
      message: "Withdrawal initiated successfully.",
      reference: transferRef,
      transfer_id: transferId,
      new_balance: newBalance,
      status: transferData.status ?? "PENDING",
    });
  } catch (error) {
    // Attempt automatic refund on unexpected failure
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
