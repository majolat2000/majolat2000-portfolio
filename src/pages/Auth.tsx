import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import {
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  Smartphone,
  Tag,
  UserX,
  Key,
  X,
} from "lucide-react";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { apiClient } from "@/lib/api-client";
import {
  getOrCreateDeviceSessionId,
  setSessionConflictPending,
  setSessionVerified,
} from "@/hooks/use-single-session";
import { getStoredReferralCode } from "@/hooks/use-referral-tracker";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const {
    isLoading: authLoading,
    isAuthenticated,
    signIn,
    signUp,
    signInAnonymously,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflictPrompt, setConflictPrompt] = useState<{
    message: string;
    email: string;
  } | null>(null);
  const [signupRefCode, setSignupRefCode] = useState(() => getStoredReferralCode() || "");
  const [showResetPasswordPrompt, setShowResetPasswordPrompt] = useState(false);

  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored && !signupRefCode) {
      setSignupRefCode(stored);
    }
  }, [signupRefCode]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !conflictPrompt) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, conflictPrompt, navigate, redirect]);

  const handleForceLogoutOtherDevice = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const sessionId = getOrCreateDeviceSessionId();

      let token = "";
      if (typeof window !== "undefined") {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { data: sData } = await supabase.auth.getSession();
          token = sData.session?.access_token || "";
          if (!token) {
            const { data: rData } = await supabase.auth.refreshSession();
            token = rData.session?.access_token || "";
          }
        }
      }

      const res = await apiClient.post(
        "/session",
        {
          sessionId,
          force: true,
          token: token || undefined,
          deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (res.data?.status === "ok") {
        setSessionConflictPending(false);
        setSessionVerified(sessionId);
        setConflictPrompt(null);
        navigate(redirect);
      } else {
        setError(res.data?.message || "Failed to switch device.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to override session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConflict = async () => {
    setSessionConflictPending(false);
    setSessionVerified(null);
    setConflictPrompt(null);
    try {
      await signOut();
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    setError(null);
    setNotice(null);
    setConflictPrompt(null);

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        setSessionConflictPending(true);
        await signIn({ email, password });

        const sessionId = getOrCreateDeviceSessionId();
        const storedRef = getStoredReferralCode();

        let token = "";
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { data: sData } = await supabase.auth.getSession();
          token = sData.session?.access_token || "";
        }

        try {
          const checkRes = await apiClient.post(
            "/session",
            {
              sessionId,
              force: false,
              token: token || undefined,
              deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : null,
            },
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            },
          );

          if (checkRes.data?.status === "conflict") {
            setSessionConflictPending(true);
            setConflictPrompt({
              message: checkRes.data.message || "You are currently logged in on another device.",
              email,
            });
            return;
          } else {
            setSessionConflictPending(false);
            setSessionVerified(sessionId);
          }
        } catch (sessionErr) {
          console.warn("Session validation error, proceeding:", sessionErr);
          setSessionConflictPending(false);
          setSessionVerified(sessionId);
        }

        navigate(redirect);
      } else {
        const formRefCode =
          String(formData.get("referralCode") ?? "").trim() ||
          signupRefCode.trim() ||
          getStoredReferralCode() ||
          "";
        const cleanRefCode = formRefCode ? formRefCode.toLowerCase() : undefined;
        if (cleanRefCode) {
          localStorage.setItem("affiliate_ref", cleanRefCode);
        }

        const { needsConfirmation } = await signUp({
          email,
          password,
          referralCode: cleanRefCode,
        });
        if (needsConfirmation) {
          setNotice(
            "Account created. Check your inbox to confirm your email, then sign in.",
          );
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSessionConflictPending(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await signInAnonymously();
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <Card className="w-full border-border/60 shadow-xl rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Logo"
                width={56}
                height={56}
                className="rounded-xl mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate("/")}
              />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold font-display">Get Started</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {mode === "signin"
                ? "Sign in to your account"
                : "Create an account to get started"}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6">
            {conflictPrompt && (
              <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 sm:p-4 text-xs sm:text-sm text-foreground shadow-sm space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="size-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-tight">
                      Active Session On Another Device
                    </h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      {conflictPrompt.message}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed sm:pl-9">
                  To keep your account secure, only one active device or browser is allowed at a time.
                  Would you like to force log out the former device and continue on this device?
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1 sm:pl-9">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:flex-1 rounded-full bg-foreground text-background font-semibold text-xs py-2.5 sm:py-2 h-auto"
                    disabled={isSubmitting}
                    onClick={handleForceLogoutOtherDevice}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Smartphone className="size-3.5 mr-1.5" />
                    )}
                    Force Logout & Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto rounded-full text-xs py-2.5 sm:py-2 h-auto"
                    disabled={isSubmitting}
                    onClick={handleCancelConflict}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
              <Tabs
                value={mode}
                onValueChange={(value) => {
                  setMode(value as "signin" | "signup");
                  setError(null);
                  setNotice(null);
                }}
                className="mb-4"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="signin" className="flex-1">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">
                    Create account
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {showResetPasswordPrompt ? (
                <div className="mb-4 rounded-2xl border border-primary/20 bg-card p-4 text-xs sm:text-sm text-foreground shadow-sm">
                  <ForgotPasswordModal
                    onCancel={() => setShowResetPasswordPrompt(false)}
                    onSuccess={() => {
                      setShowResetPasswordPrompt(false);
                      setNotice("Password successfully updated. You can now sign in.");
                    }}
                  />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="auth-email"
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      className="pl-9"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password">Password</Label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setShowResetPasswordPrompt((prev) => !prev)}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="auth-password"
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      placeholder="••••••••"
                      className="pl-9"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="auth-confirm">Confirm password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="auth-confirm"
                          name="confirm"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                          className="pl-9"
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-referralCode" className="flex items-center gap-1.5 text-xs font-medium">
                          <Tag className="size-3.5 text-primary" />
                          Referral Code (Optional)
                        </Label>
                        {signupRefCode && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Check className="size-3" /> Link Applied
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="auth-referralCode"
                          name="referralCode"
                          type="text"
                          placeholder="e.g. promo123 or leave blank"
                          value={signupRefCode}
                          onChange={(e) => setSignupRefCode(e.target.value)}
                          className="pl-9 font-mono text-xs sm:text-sm"
                          disabled={isSubmitting}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Invited by an affiliate? Enter their referral code here to link your account.
                      </p>
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {notice && (
                  <p className="text-sm font-medium text-emerald-600">
                    {notice}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full rounded-full py-3 sm:py-2.5 font-semibold text-sm sm:text-base shadow-md transition-all active:scale-[0.98] mt-2 shrink-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {mode === "signin" ? "Sign in" : "Create account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Continue as Guest
                </Button>
              </div>
            </CardContent>

            <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
              Secured by{" "}
              <a
                href="https://freebuff.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary transition-colors"
              >
                freebuff.com
              </a>
            </div>
          </Card>
        </div>
      </div>
    );
  }

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
