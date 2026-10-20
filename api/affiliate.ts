import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const POPULAR_NG_BANKS: Array<{ code: string; name: string }> = [
  { code: "044", name: "Access Bank" },
  { code: "063", name: "Access Bank (Diamond)" },
  { code: "035A", name: "ALAT by Wema" },
  { code: "565", name: "Carbon" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "51318", name: "FairMoney Microfinance Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "00103", name: "Globus Bank" },
  { code: "058", name: "Guaranty Trust Bank (GTBank)" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "50211", name: "Kuda Microfinance Bank" },
  { code: "303", name: "Lotus Bank" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999992", name: "OPay Digital Services (Paycom)" },
  { code: "100033", name: "PalmPay" },
  { code: "104", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "105", name: "PremiumTrust Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "125", name: "Rubies MFB" },
  { code: "106", name: "Signature Bank" },
  { code: "51310", name: "Sparkle Microfinance Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "SunTrust Bank" },
  { code: "302", name: "TAJ Bank" },
  { code: "102", name: "Titan Trust Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "215", name: "Unity Bank" },
  { code: "566", name: "VFD Microfinance Bank" },
  { code: "035", name: "Wema Bank" },
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

      // 2. Count distinct referred members
      let referredCount = 0;
      try {
        const { data: rpcCount, error: rpcErr } = await admin.rpc(
          "get_affiliate_referral_count",
          { p_affiliate_id: userId },
        );
        if (!rpcErr && typeof rpcCount === "number") {
          referredCount = rpcCount;
        } else {
          // Fallback: select user_ids and deduplicate by real user email
          const { data: referredRows } = await admin
            .from("affiliate_profiles")
            .select("user_id")
            .eq("referred_by_id", userId);

          if (referredRows && referredRows.length > 0) {
            const userIds = new Set(referredRows.map((r) => r.user_id));
            const { data: userList } = await admin.auth.admin.listUsers({
              perPage: 1000,
            });
            const uniqueEmails = new Set<string>();
            if (userList?.users) {
              for (const u of userList.users) {
                const registeredWithRef = u.user_metadata?.referral_code;
                if (
                  userIds.has(u.id) &&
                  u.email &&
                  !u.is_anonymous &&
                  registeredWithRef &&
                  typeof registeredWithRef === "string" &&
                  registeredWithRef.trim()
                ) {
                  uniqueEmails.add(u.email.toLowerCase().trim());
                }
              }
            }
            referredCount = uniqueEmails.size;
          }
        }
      } catch {
        const { count } = await admin
          .from("affiliate_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("referred_by_id", userId);
        referredCount = count ?? 0;
      }

      // 3. Get user's withdrawals
      const { data: withdrawals } = await admin
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      // 4. Fetch bank list from Paystack and merge with curated banks
      const bankMap = new Map<string, { code: string; name: string }>();

      // Seed with curated popular banks
      for (const b of POPULAR_NG_BANKS) {
        bankMap.set(b.code, { code: b.code, name: b.name });
      }

      const paystackSecret =
        process.env.PAYSTACK_SECRET_KEY ||
        "";

      if (paystackSecret) {
        try {
          const psBanks = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          });
          if (psBanks.ok) {
            const banksData = (await psBanks.json()) as {
              data?: Array<{ code: string; name: string }>;
            };
            if (Array.isArray(banksData.data)) {
              for (const b of banksData.data) {
                if (b.code && b.name) {
                  if (!bankMap.has(b.code)) {
                    bankMap.set(b.code, { code: b.code, name: b.name.trim() });
                  }
                }
              }
            }
          }
        } catch {
          // Keep curated list
        }
      }

      // Convert to array and sort strictly alphabetically A to Z
      const banks = Array.from(bankMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
      );

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

  if (req.method === "POST") {
    try {
      const { referralCode } = req.body ?? {};
      const code = String(referralCode ?? "").trim();
      if (!code) {
        res.status(400).json({ error: "missing_referral_code" });
        return;
      }

      const { data: linked, error: linkErr } = await admin.rpc("link_referral", {
        p_user_id: userId,
        p_referral_code: code,
      });

      if (linkErr) {
        res.status(500).json({ error: linkErr.message });
        return;
      }

      res.status(200).json({ success: true, linked: Boolean(linked) });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "link_referral_failed",
      });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
