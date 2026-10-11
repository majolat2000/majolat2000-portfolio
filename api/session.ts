import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // 1. Extract token from Authorization header, x-access-token header, or request body
  const authHeader = req.headers.authorization || (req.headers["x-access-token"] as string | undefined);
  let token = "";
  if (authHeader && typeof authHeader === "string") {
    token = authHeader.replace(/^Bearer\s+/i, "").trim();
  }
  if (!token && req.body?.token && typeof req.body.token === "string") {
    token = req.body.token.trim();
  }

  if (!token) {
    res.status(401).json({
      error: "missing_authorization",
      message: "Authentication token is missing. Please sign in again.",
    });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Authoritatively verify user token using service role admin client first
  let { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    // Fallback: try anon client if anonKey exists and is distinct
    if (anonKey && anonKey !== serviceKey) {
      try {
        const client = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const clientResult = await client.auth.getUser(token);
        if (clientResult.data?.user) {
          userData = clientResult.data;
          userError = null;
        }
      } catch {
        // Ignore fallback error
      }
    }
  }

  if (userError || !userData?.user) {
    console.warn("Session token verification failed:", userError?.message);
    res.status(401).json({
      error: "invalid_token",
      message: "Your session could not be authenticated. Please sign in again.",
    });
    return;
  }

  const userId = userData.user.id;

  const { sessionId, force, deviceInfo } = req.body ?? {};

  if (!sessionId) {
    res.status(400).json({ error: "missing_session_id" });
    return;
  }

  if (req.method === "POST") {
    // Auto-link referral ONLY during new account registration, NEVER on regular sign-in
    if (req.body?.isRegistration) {
      const refCode = (req.body?.referralCode || userData.user.user_metadata?.referral_code) as string | undefined;
      if (refCode && typeof refCode === "string" && refCode.trim()) {
        try {
          await admin.rpc("link_referral", {
            p_user_id: userId,
            p_referral_code: refCode.trim(),
          });
        } catch (err) {
          console.warn("Auto-link referral in session:", err);
        }
      }
    }

    // Register or check session with conflict resolution
    try {
      const { data, error } = await admin.rpc("validate_or_register_session", {
        p_user_id: userId,
        p_session_id: String(sessionId),
        p_force: Boolean(force),
        p_device_info: deviceInfo ? String(deviceInfo) : null,
      });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "session_registration_failed",
      });
    }
    return;
  }

  if (req.method === "PUT") {
    // Heartbeat / touch session
    try {
      const { data: isValid, error } = await admin.rpc("touch_session", {
        p_user_id: userId,
        p_session_id: String(sessionId),
      });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ valid: Boolean(isValid) });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "session_touch_failed",
      });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
