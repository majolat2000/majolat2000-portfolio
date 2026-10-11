import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function generateSecureTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pass = "Majo!";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const authHeader = req.headers.authorization || (req.headers["x-access-token"] as string | undefined);
  let token = "";
  if (authHeader && typeof authHeader === "string") {
    token = authHeader.replace(/^Bearer\s+/i, "").trim();
  }
  if (!token && req.body?.token && typeof req.body.token === "string") {
    token = req.body.token.trim();
  }

  if (!token) {
    res.status(401).json({ error: "missing_authorization", message: "Admin authorization required." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    res.status(503).json({ error: "server_not_configured" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  // Admin verification
  const isAdmin =
    userData.user.email === "info@majolat2000.com.ng" ||
    userData.user.app_metadata?.role === "admin";

  if (!isAdmin) {
    res.status(403).json({ error: "forbidden", message: "Admin privileges required." });
    return;
  }

  const { userId, newPassword } = req.body ?? {};
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "missing_user_id" });
    return;
  }

  let targetPassword = "";
  if (newPassword && typeof newPassword === "string" && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      res.status(400).json({ error: "password_too_short", message: "Password must be at least 6 characters." });
      return;
    }
    targetPassword = newPassword.trim();
  } else {
    targetPassword = generateSecureTempPassword();
  }

  try {
    const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      { password: targetPassword },
    );

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    res.status(200).json({
      success: true,
      userId,
      email: updatedUser.user?.email,
      password: targetPassword,
      message: "Password reset successfully.",
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "password_reset_failed",
    });
  }
}
