import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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
  const otp = String(req.body?.otp ?? "").trim();
  const newPassword = String(req.body?.newPassword ?? "");

  if (!email || !otp || !newPassword) {
    res.status(400).json({ error: "Email, 6-digit OTP, and new password are required." });
    return;
  }

  if (otp.length !== 6) {
    res.status(400).json({ error: "Verification code must be 6 digits." });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters long." });
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
    // 1. Locate user
    const { data: userList, error: listError } = await admin.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      console.error("List users error in reset-password:", listError);
      res.status(500).json({ error: "Internal server error." });
      return;
    }

    const matchedUser = userList?.users?.find(
      (u) => u.email?.toLowerCase().trim() === email && !u.is_anonymous,
    );

    if (!matchedUser) {
      res.status(400).json({ error: "Invalid password reset request." });
      return;
    }

    // 2. Fetch profile security fields
    const { data: profile } = await admin
      .from("affiliate_profiles")
      .select("reset_otp, reset_otp_expires_at, failed_otp_attempts, account_locked_until")
      .eq("user_id", matchedUser.id)
      .maybeSingle();

    if (!profile) {
      res.status(400).json({ error: "No reset request found for this account." });
      return;
    }

    // 3. Check if account is locked
    if (profile.account_locked_until) {
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

    // 4. Verify OTP exists and has not expired
    if (!profile.reset_otp || !profile.reset_otp_expires_at) {
      res.status(400).json({
        error: "No active reset code found. Please request a new code.",
      });
      return;
    }

    if (new Date(profile.reset_otp_expires_at) < new Date()) {
      // Clear expired OTP
      await admin
        .from("affiliate_profiles")
        .update({ reset_otp: null, reset_otp_expires_at: null })
        .eq("user_id", matchedUser.id);

      res.status(400).json({
        error: "The 6-digit reset code has expired. Please request a new code.",
      });
      return;
    }

    // 5. Compare OTP hashes securely
    const providedOtpHashed = crypto.createHash("sha256").update(otp).digest("hex");
    const isOtpValid = crypto.timingSafeEqual(
      Buffer.from(providedOtpHashed, "hex"),
      Buffer.from(profile.reset_otp, "hex"),
    );

    if (!isOtpValid) {
      const MAX_ATTEMPTS = 5;
      const newAttempts = (profile.failed_otp_attempts || 0) + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock for 30 minutes and wipe the OTP
        const lockTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        await admin
          .from("affiliate_profiles")
          .update({
            failed_otp_attempts: 0,
            account_locked_until: lockTime,
            reset_otp: null,
            reset_otp_expires_at: null,
          })
          .eq("user_id", matchedUser.id);

        // Send EmailBump Security Alert
        try {
          await fetch("https://api.emailbump.com/v1/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${EMAILBUMP_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: EMAILBUMP_FROM_EMAIL,
              to: matchedUser.email,
              subject: "Security Alert: Account Temporarily Locked",
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 8px;">
                  <h3 style="color: #b91c1c; margin-top: 0;">Security Alert: Account Temporarily Locked</h3>
                  <p>Your account on <strong>majolat2000.com.ng</strong> has been temporarily locked for 30 minutes due to 5 consecutive failed reset code attempts.</p>
                  <p><strong>If this was you:</strong> You may request a new code after the 30-minute lock expires.</p>
                  <p><strong>If this was NOT you:</strong> Someone may be attempting unauthorized access. Your password has not been changed, but you may contact <a href="mailto:info@majolat2000.com.ng">info@majolat2000.com.ng</a> if you notice suspicious activity.</p>
                </div>
              `,
            }),
          });
        } catch (emailErr: any) {
          console.error("Lockout email dispatch failed:", emailErr?.message);
        }

        res.status(403).json({
          error: "Too many failed attempts. Your account has been temporarily locked for 30 minutes.",
        });
        return;
      } else {
        await admin
          .from("affiliate_profiles")
          .update({ failed_otp_attempts: newAttempts })
          .eq("user_id", matchedUser.id);

        res.status(400).json({
          error: `Invalid verification code. You have ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
        });
        return;
      }
    }

    // 6. Success: Update user's password in auth
    const { error: updateError } = await admin.auth.admin.updateUserById(matchedUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Update password error:", updateError);
      res.status(500).json({ error: "Failed to update password. Please try again." });
      return;
    }

    // 7. Clear OTP and reset lock status
    await admin
      .from("affiliate_profiles")
      .update({
        reset_otp: null,
        reset_otp_expires_at: null,
        failed_otp_attempts: 0,
        account_locked_until: null,
      })
      .eq("user_id", matchedUser.id);

    res.json({
      message: "Your password has been successfully reset. You can now log in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password handler error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
}
