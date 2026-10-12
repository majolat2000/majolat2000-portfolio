import React, { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ForgotPasswordModalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  onSuccess,
  onCancel,
  defaultEmail = "",
}) => {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/forgot-password", { email: cleanEmail });
      setSuccessMessage(
        res.data?.message || "If an account exists, a 6-digit verification code has been sent.",
      );
      setStep("reset");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to send reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanOtp = otp.trim().replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
      });

      setSuccessMessage(
        res.data?.message || "Password successfully reset! You can now log in.",
      );
      setTimeout(() => {
        onSuccess?.();
      }, 1800);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to reset password. Please check the code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          {step === "reset" ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("request");
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-md"
              aria-label="Back to email input"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <Key className="size-4 text-primary" />
          )}
          <h3 className="font-semibold text-foreground text-sm sm:text-base">
            {step === "request" ? "Reset Password" : "Enter Verification Code"}
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 text-xs sm:text-sm rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 p-3 text-xs sm:text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Enter your registered email address and we will send a 6-digit OTP verification code to reset your password.
          </p>

          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="text-xs font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full font-semibold text-xs sm:text-sm py-2.5 h-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-2" />
                Sending 6-Digit Code...
              </>
            ) : (
              "Send Reset Code"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it below along with your new password.
          </p>

          <div className="space-y-2">
            <Label htmlFor="forgot-otp" className="text-xs font-medium">
              6-Digit Code
            </Label>
            <Input
              id="forgot-otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center text-lg sm:text-xl font-bold tracking-[0.3em] font-mono"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-new-password" className="text-xs font-medium">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="forgot-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pl-9 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forgot-confirm-password" className="text-xs font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                id="forgot-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="pl-9 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full font-semibold text-xs sm:text-sm py-2.5 h-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              "Save New Password"
            )}
          </Button>

          <div className="pt-1 text-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError(null);
                setStep("request");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Didn't receive the email? Request another code
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordModal;
