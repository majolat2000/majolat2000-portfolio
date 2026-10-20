import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing_authorization" });
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

  // Verify caller identity & admin privileges
  const client = createClient(supabaseUrl, anonKey ?? serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  const adminUser = userData.user;
  const isAdmin =
    adminUser.app_metadata?.role === "admin" ||
    adminUser.user_metadata?.role === "admin";

  if (!isAdmin) {
    res.status(403).json({ error: "forbidden_admin_only" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // GET: List all withdrawal requests
  if (req.method === "GET") {
    try {
      const { data: withdrawals, error: fetchErr } = await admin
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchErr) {
        res.status(500).json({ error: fetchErr.message });
        return;
      }

      // Fetch users list to map user_id -> email
      const { data: userList } = await admin.auth.admin.listUsers({
        perPage: 1000,
      });

      const userEmailMap = new Map<string, string>();
      if (userList?.users) {
        for (const u of userList.users) {
          if (u.id && u.email) {
            userEmailMap.set(u.id, u.email);
          }
        }
      }

      const enriched = (withdrawals || []).map((w) => ({
        ...w,
        user_email: userEmailMap.get(w.user_id) || "Unknown User",
      }));

      res.status(200).json({
        success: true,
        withdrawals: enriched,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "fetch_withdrawals_failed",
      });
    }
    return;
  }

  // POST: Approve or Reject a withdrawal
  if (req.method === "POST") {
    try {
      const { withdrawalId, action, reason } = req.body ?? {};
      if (!withdrawalId || !action) {
        res.status(400).json({ error: "missing_parameters", message: "withdrawalId and action ('approve' | 'reject') are required." });
        return;
      }

      // Get target withdrawal
      const { data: withdrawal, error: findErr } = await admin
        .from("withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .maybeSingle();

      if (findErr || !withdrawal) {
        res.status(404).json({ error: "withdrawal_not_found" });
        return;
      }

      if (withdrawal.status !== "PENDING") {
        res.status(400).json({
          error: "already_processed",
          message: `This withdrawal request is already marked as ${withdrawal.status}.`,
        });
        return;
      }

      if (action === "approve") {
        // Update status to APPROVED (or SUCCESSFUL if check constraint restricts)
        let updateRes = await admin
          .from("withdrawals")
          .update({
            status: "APPROVED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawalId);

        if (updateRes.error && updateRes.error.message.includes("withdrawals_status_check")) {
          // If the DB check constraint hasn't been migrated yet, fallback to SUCCESSFUL
          updateRes = await admin
            .from("withdrawals")
            .update({
              status: "SUCCESSFUL",
              updated_at: new Date().toISOString(),
            })
            .eq("id", withdrawalId);
        }

        if (updateRes.error) {
          res.status(500).json({ error: updateRes.error.message });
          return;
        }

        res.status(200).json({
          success: true,
          message: "Withdrawal approved successfully. Status updated on affiliate dashboard.",
          status: "APPROVED",
        });
        return;
      }

      if (action === "reject") {
        const rejectReason = reason || "Declined by administrator.";
        const { error: refundErr } = await admin.rpc("refund_failed_withdrawal", {
          p_transfer_ref: withdrawal.transfer_ref,
          p_reason: rejectReason,
        });

        if (refundErr) {
          res.status(500).json({ error: refundErr.message });
          return;
        }

        res.status(200).json({
          success: true,
          message: "Withdrawal rejected. Funds have been refunded to the affiliate's wallet.",
          status: "REJECTED",
        });
        return;
      }

      res.status(400).json({ error: "invalid_action", message: "Action must be 'approve' or 'reject'." });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "withdrawal_action_failed",
      });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
