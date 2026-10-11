import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_NG_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "058", name: "Guaranty Trust Bank (GTBank)" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "999991", name: "Kuda Microfinance Bank" },
  { code: "50515", name: "Moniepoint MFB" },
  { code: "999992", name: "OPay Digital Services (Paycom)" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "SunTrust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank (ALAT)" },
  { code: "057", name: "Zenith Bank" },
];

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

  const client = createClient(supabaseUrl, anonKey ?? serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === "GET") {
    try {
      // 1. Get or create affiliate profile
      const { data: profile, error: profileError } = await admin.rpc(
        "get_or_create_affiliate_profile",
        { p_user_id: userId },
      );

      if (profileError) {
        res.status(500).json({ error: profileError.message });
        return;
      }

      // 2. Count referrals
      const { count: referredCount } = await admin
        .from("affiliate_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("referred_by_id", userId);

      // 3. Get user's withdrawals
      const { data: withdrawals, error: withError } = await admin
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      // 4. Fetch bank list from Flutterwave or fallback
      let banks = DEFAULT_NG_BANKS;
      const flwSecret = process.env.FLUTTERWAVE_SECRET_KEY;
      if (flwSecret) {
        try {
          const flwBanks = await fetch("https://api.flutterwave.com/v3/banks/NG", {
            headers: { Authorization: `Bearer ${flwSecret}` },
          });
          if (flwBanks.ok) {
            const banksData = (await flwBanks.json()) as {
              data?: Array<{ code: string; name: string }>;
            };
            if (Array.isArray(banksData.data) && banksData.data.length > 0) {
              banks = banksData.data.map((b) => ({ code: b.code, name: b.name }));
            }
          }
        } catch {
          // Keep default banks fallback
        }
      }

      res.status(200).json({
        profile,
        stats: {
          referred_count: referredCount ?? 0,
          wallet_balance: profile?.wallet_balance ?? 0,
        },
        withdrawals: withdrawals ?? [],
        banks,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "affiliate_fetch_failed",
      });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
