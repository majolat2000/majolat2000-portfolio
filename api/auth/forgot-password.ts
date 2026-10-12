import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// In-memory rate limiting for serverless instance (protects against high-frequency flooding)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 3, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

const EMAILBUMP_API_KEY =
  process.env.EMAILBUMP_API_KEY ||
  "ebk_8c2094a600934c3d8a807c4bf4d4e7c7adf18765e8534ad3b5390d4fe4481db1";
const EMAILBUMP_FROM_EMAIL = process.env.EMAILBUMP_FROM_EMAIL || "info@majolat2000.com.ng";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const email = String(req.body?.email ?? "").toLowerCase().trim();

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  // Rate Limiting by Email and IP
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const emailRateKey = `email:${email}`;
  const ipRateKey = `ip:${clientIp}`;

  if (!checkRateLimit(emailRateKey, 3, 15 * 60 * 1000)) {
    res.status(429).json({
      error: "Too many password reset requests for this email. Please try again after 15 minutes.",
    });
    return;
  }

  if (!checkRateLimit(ipRateKey, 5, 15 * 60 * 1000)) {
    res.status(429).json({
      error: "Too many requests from this network. Please try again after 15 minutes.",
    });
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

  try {
    // 1. Find user in Supabase auth
    const { data: userList, error: listError } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      console.error("List users error in forgot-password:", listError);
      res.status(500).json({ error: "Internal server error." });
      return;
    }

    const matchedUser = userList?.users?.find(
      (u) => u.email?.toLowerCase().trim() === email && !u.is_anonymous,
    );

    // Account enumeration prevention: Return success message even if email doesn't exist
    if (!matchedUser) {
      res.json({
        message: "If an account exists with this email, a 6-digit reset code has been sent.",
      });
      return;
    }

    // 2. Ensure affiliate profile exists to store OTP metadata
    await admin.rpc("get_or_create_affiliate_profile", { p_user_id: matchedUser.id });

    // 3. Check if account is currently locked due to too many failed OTP attempts
    const { data: profile } = await admin
      .from("affiliate_profiles")
      .select("account_locked_until, failed_otp_attempts")
      .eq("user_id", matchedUser.id)
      .maybeSingle();

    if (profile?.account_locked_until) {
      const lockUntil = new Date(profile.account_locked_until);
      if (lockUntil > new Date()) {
        const remainingMinutes = Math.max(
          1,
          Math.ceil((lockUntil.getTime() - Date.now()) / (60 * 1000)),
        );
        res.status(403).json({
          error: `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
        });
        return;
      }
    }

    // 4. Generate random 6-digit OTP (100000 - 999999)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 5. Save hashed OTP and expiration time in PostgreSQL
    await admin
      .from("affiliate_profiles")
      .update({
        reset_otp: hashedOtp,
        reset_otp_expires_at: expiresAt,
        failed_otp_attempts: 0,
      })
      .eq("user_id", matchedUser.id);

    // 6. Send the 6-digit OTP email via EmailBump API
    try {
      const emailPayload = {
        from: EMAILBUMP_FROM_EMAIL,
        to: matchedUser.email,
        subject: "Your 6-Digit Password Reset Code",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #111827; margin-bottom: 8px;">Password Reset Verification</h2>
            <p>You requested to reset your password for <strong>majolat2000.com.ng</strong>. Use the 6-digit verification code below to complete the reset. This code will expire in <strong>15 minutes</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #2563eb; background-color: #eff6ff; padding: 12px 28px; border-radius: 8px; border: 1px solid #bfdbfe;">
                ${rawOtp}
              </span>
            </div>
            <p style="font-size: 13px; color: #6b7280;">If you did not request this password reset, please ignore this email or review your account security immediately.</p>
          </div>
        `,
      };

      const flwRes = await fetch("https://api.emailbump.com/v1/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EMAILBUMP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!flwRes.ok) {
        const errorText = await flwRes.text();
        console.warn("EmailBump API response status:", flwRes.status, errorText);
      }
    } catch (emailErr: any) {
      console.error("EmailBump API request failed:", emailErr?.message);
    }

    res.json({
      message: "If an account exists with this email, a 6-digit reset code has been sent.",
    });
  } catch (err: any) {
    console.error("Forgot password handler error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
