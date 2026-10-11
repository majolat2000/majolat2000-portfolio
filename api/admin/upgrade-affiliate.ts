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
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  // Admin verification: check email or app_metadata role
  const isAdmin =
    userData.user.email === "info@majolat2000.com.ng" ||
    userData.user.app_metadata?.role === "admin";

  if (!isAdmin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required." });
    return;
  }

  const { userId, customCode } = req.body ?? {};
  if (!userId) {
    res.status(400).json({ error: "missing_user_id" });
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // Generate unique code if not provided
    let code = customCode ? String(customCode).trim().toLowerCase() : null;
    if (!code) {
      code = `ref_${String(userId).slice(0, 6)}_${Math.random().toString(36).substring(2, 6)}`;
    }

    // Check existing profile
    const { data: existing, error: fetchError } = await admin
      .from("affiliate_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError && (fetchError.code === "42P01" || fetchError.message.includes("does not exist"))) {
      res.status(400).json({
        error: "Table 'affiliate_profiles' does not exist yet. Please run the SQL migration in your Supabase dashboard.",
      });
      return;
    }

    const assignedCode = customCode ? code : (existing?.referral_code || code);

    // Direct upsert using service role client (bypasses RLS issues)
    const { data: profile, error: saveError } = await admin
      .from("affiliate_profiles")
      .upsert(
        {
          user_id: userId,
          role: "AFFILIATE",
          referral_code: assignedCode,
          wallet_balance: existing?.wallet_balance ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (saveError) {
      res.status(400).json({ error: saveError.message });
      return;
    }

    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "upgrade_failed",
    });
  }
}
