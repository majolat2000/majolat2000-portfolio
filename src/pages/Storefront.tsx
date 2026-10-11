import { Background } from "@/components/portfolio/Background";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { portfolio } from "@/lib/portfolio";
import { startCheckout } from "@/lib/payments/flutterwave";
import {
  formatDate,
  formatNaira,
  listMyAccess,
  listProducts,
  type AccessGrantWithProduct,
  type StoreProduct,
} from "@/lib/store";
import {
  friendlyAuthError,
  supabase,
  supabaseConfigured,
} from "@/lib/supabase";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tag,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  getOrCreateDeviceSessionId,
  useSingleSession,
  setSessionConflictPending,
  setSessionVerified,
} from "@/hooks/use-single-session";
import { getStoredReferralCode } from "@/hooks/use-referral-tracker";
import { apiClient, linkReferralCode } from "@/lib/api-client";
import { AffiliateDashboardView } from "@/components/AffiliateDashboardView";

function NotConfigured() {
  return (
    <Card className="w-full max-w-md rounded-2xl sm:rounded-3xl border-border/60 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-5 text-amber-500" />
          Supabase not configured
        </CardTitle>
        <CardDescription>
          Add your project credentials to the environment to enable storefront
          accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Set <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code>{" "}
          and <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>{" "}
          in <code className="rounded bg-muted px-1">.env</code>, then restart
          the dev server.
        </p>
      </CardContent>
    </Card>
  );
}

export function AuthPanel({
  onSuccess,
  customTitle,
  customSubtitle,
}: {
  onSuccess?: () => void;
  customTitle?: string;
  customSubtitle?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTimeoutAlert, setShowTimeoutAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "timeout") {
      setShowTimeoutAlert(true);
      searchParams.delete("reason");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [conflictPrompt, setConflictPrompt] = useState<{
    message: string;
    email: string;
  } | null>(null);
  const [signupRefCode, setSignupRefCode] = useState(() => getStoredReferralCode() || "");

  useEffect(() => {
    const stored = getStoredReferralCode();
    if (stored && !signupRefCode) {
      setSignupRefCode(stored);
    }
  }, [signupRefCode]);

  const handleForceLogoutOtherDevice = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const sessionId = getOrCreateDeviceSessionId();
      const res = await apiClient.post("/session", {
        sessionId,
        force: true,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });

      if (res.data?.status === "ok") {
        setSessionConflictPending(false);
        setSessionVerified(sessionId);
        setConflictPrompt(null);
        onSuccess?.();
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
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signout error
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
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
        // Mark conflict check pending before signing in so background touchSession won't kick user out
        setSessionConflictPending(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setSessionConflictPending(false);
          setError(friendlyAuthError(signInError.message));
        } else {
          // Single device check
          const sessionId = getOrCreateDeviceSessionId();
          const storedRef = getStoredReferralCode();
          try {
            const checkRes = await apiClient.post("/session", {
              sessionId,
              force: false,
              referralCode: storedRef || undefined,
              deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : null,
            });

            if (checkRes.data?.status === "conflict") {
              // Active session on another device detected: keep pending so user can choose
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

          onSuccess?.();
        }
      } else {
        const formRefCode =
          String(formData.get("referralCode") ?? "").trim() ||
          signupRefCode.trim() ||
          getStoredReferralCode() ||
          "";
        const cleanRefCode = formRefCode ? formRefCode.toLowerCase() : null;
        if (cleanRefCode) {
          localStorage.setItem("affiliate_ref", cleanRefCode);
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              referral_code: cleanRefCode || undefined,
            },
            emailRedirectTo: `${window.location.origin}/storefront`,
          },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
        } else if (!data.session) {
          // If referral code was present and user was created
          if (data.user && cleanRefCode) {
            try {
              await supabase.rpc("link_referral", {
                p_user_id: data.user.id,
                p_referral_code: cleanRefCode,
              });
            } catch (refErr) {
              console.warn("Could not link referral:", refErr);
            }
          }
          setNotice(
            "Account created. Check your inbox to confirm your email, then sign in.",
          );
          form.reset();
          setMode("signin");
        } else {
          if (data.user && cleanRefCode) {
            try {
              await supabase.rpc("link_referral", {
                p_user_id: data.user.id,
                p_referral_code: cleanRefCode,
              });
            } catch (refErr) {
              console.warn("Could not link referral:", refErr);
            }
          }
          // Register session for new user and link referral
          const sessionId = getOrCreateDeviceSessionId();
          try {
            await apiClient.post("/session", {
              sessionId,
              force: true,
              referralCode: cleanRefCode || undefined,
              deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : null,
            });
            setSessionConflictPending(false);
            setSessionVerified(sessionId);
          } catch {
            // Ignore
          }

          onSuccess?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSessionConflictPending(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/60 shadow-2xl rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-md overflow-hidden">
      <CardHeader className="items-center justify-items-center text-center px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
        <span className="grid size-12 place-items-center overflow-hidden rounded-full ring-1 ring-border mb-1">
          <img
            src={portfolio.avatar}
            alt={portfolio.name}
            className="h-full w-full object-cover"
          />
        </span>
        <CardTitle className="font-display text-lg sm:text-2xl font-extrabold tracking-tight">
          {customTitle ?? "Majesty's Digital Storefront"}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground px-2">
          {customSubtitle ?? "Sign in or create an account to purchase and access products."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6 max-h-[75vh] overflow-y-auto">
        {showTimeoutAlert && (
          <div className="mb-4 flex items-start justify-between gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-3.5 text-foreground text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-snug text-muted-foreground">
                Your session expired due to inactivity or was transferred to another device. Please sign in again.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTimeoutAlert(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss alert"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

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
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                required
              />
            </div>
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="referralCode" className="flex items-center gap-1.5 text-xs font-medium">
                      <Tag className="size-3.5 text-primary" />
                      Referral Code (Optional)
                    </Label>
                    {signupRefCode && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Check className="size-3" /> Link Applied
                      </span>
                    )}
                  </div>
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="e.g. promo123 or leave blank"
                    value={signupRefCode}
                    onChange={(e) => setSignupRefCode(e.target.value)}
                    className="font-mono text-xs sm:text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Invited by an affiliate partner? Enter their code here to support them.
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            {notice && (
              <p className="text-sm font-medium text-foreground">{notice}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-1" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ProductTypeBadge({ type }: { type?: string }) {
  const norm = (type ?? "course").toLowerCase();
  if (norm === "toolkit") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
        Toolkit
      </span>
    );
  }
  if (norm === "product") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
        Product
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/30 uppercase tracking-wider">
      Course
    </span>
  );
}

export default function Storefront() {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();

  // Enforce single-device session and 24h sliding inactivity timeout
  useSingleSession(session?.user?.id);

  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const [access, setAccess] = useState<AccessGrantWithProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [view, setView] = useState<"storefront" | "preview">("storefront");
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string>("");
  const [affiliateModalOpen, setAffiliateModalOpen] = useState(false);

  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);

  const isAdmin = session?.user.email === "info@majolat2000.com.ng" || session?.user.app_metadata?.role === "admin";

  // Load products and, if authenticated, access grants
  useEffect(() => {
    let cancelled = false;

    const promises: [Promise<StoreProduct[]>, Promise<AccessGrantWithProduct[]>] = [
      listProducts(),
      session ? listMyAccess(session.user.id) : Promise.resolve([]),
    ];

    Promise.all(promises)
      .then(([nextCatalog, nextAccess]) => {
        if (cancelled) return;
        setCatalog(nextCatalog);
        setAccess(nextAccess);
        if (!selectedProduct && nextCatalog.length > 0) {
          setSelectedProduct(nextCatalog[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("[Storefront] Error loading data:", err);
          setNotice(err instanceof Error ? err.message : "Could not load products.");
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const activeByProduct = new Map(access.map((grant) => [grant.product_id, grant]));

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    setAccess([]);
  };

  const handleOpenAuth = (reason?: string) => {
    setAuthPromptReason(reason ?? "Sign in or create an account to continue.");
    setAuthModalOpen(true);
  };

  const handleBuy = async (targetProduct: StoreProduct) => {
    if (!session) {
      handleOpenAuth("Please sign in or create an account to purchase this product.");
      return;
    }

    setNotice(null);
    try {
      await startCheckout(
        {
          productId: targetProduct.id,
          userId: session.user.id,
          email: session.user.email ?? "",
          amountKobo: targetProduct.price_kobo,
          productName: targetProduct.name,
          durationDays: targetProduct.duration_days,
        },
        async (result) => {
          console.log("[Storefront] Checkout result:", JSON.stringify(result));
          const isSuccess = ["successful", "completed", "succeeded"].includes(
            result.status?.toLowerCase?.() ?? "",
          );
          if (isSuccess && result.transactionId) {
            try {
              setNotice("Verifying payment...");
              const res = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transactionId: result.transactionId,
                  txRef: result.txRef,
                }),
              });
              const responseText = await res.text();
              console.log("[Storefront] Verify response:", res.status, responseText);
              if (!res.ok) {
                throw new Error("Verification failed: " + responseText);
              }
              const accessList = await listMyAccess(session.user.id);
              setAccess(accessList);
              navigate(`/storefront/product/${targetProduct.id}`);
            } catch (e) {
              console.error("[Storefront] Verify error:", e);
              setNotice(e instanceof Error ? e.message : "Failed to verify payment");
              alert("Error: " + (e instanceof Error ? e.message : "Failed to verify"));
            }
          } else {
            console.warn("[Storefront] Payment not completed:", result);
            setNotice(
              "Payment was not completed. Status: " +
                result.status +
                ", TX ID: " +
                result.transactionId,
            );
            alert(
              "Payment callback received but status=" +
                result.status +
                " transactionId=" +
                result.transactionId,
            );
          }
        },
      );
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Checkout could not start.",
      );
    }
  };

  // Preview Mode for a selected product
  if (view === "preview" && selectedProduct) {
    const hasAccess = activeByProduct.has(selectedProduct.id);

    return (
      <div className="relative min-h-screen text-foreground">
        <Background />
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 border-b border-border/40 backdrop-blur-md bg-background/50 sticky top-0 z-20">
            <Link to="/" className="group flex items-center gap-3">
              <span className="grid size-10 place-items-center overflow-hidden rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
                <img
                  src={portfolio.avatar}
                  alt={portfolio.name}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="font-display text-[15px] font-semibold text-foreground">
                {portfolio.brand}
              </span>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setView("storefront")}
              className="rounded-full text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium"
            >
              <ArrowLeft className="size-4 mr-1" />
              Back to Storefront
            </Button>
          </header>

          <main className="flex flex-1 items-center justify-center px-3 sm:px-6 py-6 sm:py-12 pb-16">
            <div className="w-full max-w-2xl space-y-4 sm:space-y-6">
              <Card className="rounded-2xl sm:rounded-3xl border-border/60 shadow-xl overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <ProductTypeBadge type={selectedProduct.type} />
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
                      {selectedProduct.duration_days >= 3650
                        ? "Lifetime Access"
                        : `${selectedProduct.duration_days} Days Access`}
                    </span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                    {selectedProduct.name}
                  </CardTitle>
                  <div className="pt-1 text-base sm:text-lg font-bold text-foreground">
                    {formatNaira(selectedProduct.price_kobo)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {selectedProduct.description ? (
                      <p className="whitespace-pre-line">{selectedProduct.description}</p>
                    ) : (
                      <p>
                        Comprehensive digital training and resources to help you achieve your career goals.
                      </p>
                    )}
                  </div>

                  {!hasAccess && (
                    <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agree1"
                          checked={agreed1}
                          onChange={(e) => setAgreed1(e.target.checked)}
                          className="mt-1 size-4 rounded border-border text-foreground focus:ring-foreground"
                        />
                        <label htmlFor="agree1" className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer">
                          I understand this is a digital purchase. Once access is granted, it is permanently linked to my account and cannot be refunded.
                        </label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="agree2"
                          checked={agreed2}
                          onChange={(e) => setAgreed2(e.target.checked)}
                          className="mt-1 size-4 rounded border-border text-foreground focus:ring-foreground"
                        />
                        <label htmlFor="agree2" className="text-xs sm:text-sm text-muted-foreground leading-snug cursor-pointer">
                          I confirm that my account email is correct and that I will use this account to access the materials.
                        </label>
                      </div>
                    </div>
                  )}

                  {notice && (
                    <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      {notice}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  {hasAccess ? (
                    <Button
                      className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90 py-5 text-sm sm:text-base"
                      asChild
                    >
                      <Link to={`/storefront/product/${selectedProduct.id}`}>
                        <CheckCircle2 className="size-4 mr-2" />
                        You have access — Open Course
                      </Link>
                    </Button>
                  ) : session ? (
                    <Button
                      className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90 py-5 text-sm sm:text-base"
                      disabled={!agreed1 || !agreed2}
                      onClick={() => handleBuy(selectedProduct)}
                    >
                      Pay & Get Access ({formatNaira(selectedProduct.price_kobo)})
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90 py-5 text-sm sm:text-base"
                      onClick={() => handleOpenAuth("Please sign in or create an account to purchase this product.")}
                    >
                      <LogIn className="size-4 mr-2" />
                      Sign in to Purchase ({formatNaira(selectedProduct.price_kobo)})
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </main>
        </div>

        {/* Auth Dialog */}
        <Dialog
          open={authModalOpen}
          onOpenChange={(open) => {
            if (!open) setSessionConflictPending(false);
            setAuthModalOpen(open);
          }}
        >
          <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md max-h-[92vh] flex items-center justify-center p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-transparent shadow-none">
            <AuthPanel
              onSuccess={() => setAuthModalOpen(false)}
              customSubtitle={authPromptReason || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Storefront Catalog View
  return (
    <div className="relative min-h-screen text-foreground">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation Header */}
        <header className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4 border-b border-border/40 backdrop-blur-md bg-background/50 sticky top-0 z-20">
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center overflow-hidden rounded-full ring-1 ring-border transition-transform duration-300 group-hover:scale-105">
              <img
                src={portfolio.avatar}
                alt={portfolio.name}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-display text-[15px] font-semibold text-foreground">
              {portfolio.brand}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-semibold gap-1.5 border-primary/40 hover:bg-primary/10"
                  onClick={() => setAffiliateModalOpen(true)}
                >
                  <Wallet className="size-3.5 text-primary" />
                  <span>Affiliate</span>
                </Button>
                {isAdmin && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full text-xs font-semibold bg-foreground text-background"
                    asChild
                  >
                    <Link to="/storefront/admin">
                      Admin Panel
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-medium"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LogOut className="size-3.5 mr-1" />
                  )}
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="rounded-full text-xs font-semibold bg-foreground text-background"
                onClick={() => handleOpenAuth("Sign in to your account or create one.")}
              >
                <LogIn className="size-3.5 mr-1.5" />
                Sign in
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full text-muted-foreground hover:text-foreground text-xs"
            >
              <Link to="/">
                <ArrowLeft className="size-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Portfolio</span>
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-3 sm:px-6 lg:px-8 py-6 sm:py-12 pb-16">
          <div className="w-full max-w-4xl space-y-6 sm:space-y-8">
            {/* Storefront Hero */}
            <div className="text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Available Products
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Explore courses, toolkits, and digital resources designed to level up your career.
              </p>
            </div>

            {/* User Access Card (if logged in and has access grants) */}
            {session && access.length > 0 && (
              <Card className="rounded-2xl sm:rounded-3xl border-border/80 bg-card/60 shadow-lg backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/20 px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="size-5 text-emerald-500" />
                        Your Purchased Products
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Active access granted to your account ({session.user.email})
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {access.map((grant) => {
                      const prod = grant.product;
                      if (!prod) return null;
                      return (
                        <div
                          key={grant.id}
                          className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:border-border"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <ProductTypeBadge type={prod.type} />
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Active Access
                              </span>
                            </div>
                            <h4 className="font-bold text-sm sm:text-base text-foreground mb-1 line-clamp-1">
                              {prod.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {prod.description || "Digital course and resources."}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90 text-xs"
                            asChild
                          >
                            <Link to={`/storefront/product/${prod.id}`}>
                              Open Course
                              <ExternalLink className="size-3.5 ml-1.5" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Catalog Grid */}
            {catalogLoading || loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="size-5 animate-spin" />
                <span>Loading storefront products...</span>
              </div>
            ) : catalog.length === 0 ? (
              <Card className="rounded-2xl sm:rounded-3xl border-border/60 p-8 text-center text-muted-foreground">
                <p className="text-base font-medium">No products available at the moment.</p>
                {isAdmin && (
                  <p className="mt-2 text-xs">
                    (Admin: You can add new courses, toolkits, or products in the{" "}
                    <Link to="/storefront/admin" className="underline font-semibold text-foreground">
                      Admin Panel
                    </Link>
                    .)
                  </p>
                )}
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                {catalog.map((product) => {
                  const hasAccess = activeByProduct.has(product.id);
                  const isLifetime = product.duration_days >= 3650;

                  return (
                    <Card
                      key={product.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border-border/60 bg-card/50 shadow-md backdrop-blur-sm transition-all hover:border-border hover:shadow-xl"
                    >
                      <CardHeader className="p-5 sm:p-6 pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <ProductTypeBadge type={product.type} />
                          <span className="text-xs font-semibold text-muted-foreground">
                            {isLifetime ? "Lifetime access" : `${product.duration_days} days access`}
                          </span>
                        </div>
                        <CardTitle className="text-lg sm:text-xl font-bold leading-snug">
                          {product.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {product.description || "Video course modules, practical frameworks, and resources."}
                        </p>
                        <div className="pt-2 flex items-baseline justify-between border-t border-border/40">
                          <span className="text-xs text-muted-foreground font-medium">Price</span>
                          <span className="text-base sm:text-lg font-bold text-foreground">
                            {formatNaira(product.price_kobo)}
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="p-5 sm:p-6 pt-0">
                        {hasAccess ? (
                          <Button
                            className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90 text-xs sm:text-sm"
                            asChild
                          >
                            <Link to={`/storefront/product/${product.id}`}>
                              Open Course
                              <ExternalLink className="size-3.5 ml-1.5" />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full rounded-full font-semibold text-xs sm:text-sm border-border hover:bg-muted"
                            onClick={() => {
                              setSelectedProduct(product);
                              setView("preview");
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Auth Dialog */}
      <Dialog
        open={authModalOpen}
        onOpenChange={(open) => {
          if (!open) setSessionConflictPending(false);
          setAuthModalOpen(open);
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md max-h-[92vh] flex items-center justify-center p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-0 bg-transparent shadow-none">
          <AuthPanel
            onSuccess={() => setAuthModalOpen(false)}
            customSubtitle={authPromptReason || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Affiliate Portal Dialog */}
      <Dialog open={affiliateModalOpen} onOpenChange={setAffiliateModalOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl border-border/80 bg-background/95 backdrop-blur-md shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold font-display flex items-center gap-2">
              <Wallet className="size-5 text-primary" />
              Affiliate Partner Portal
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Track your earnings, generate custom referral links, and initiate instant bank payouts.
            </DialogDescription>
          </DialogHeader>
          <AffiliateDashboardView />
        </DialogContent>
      </Dialog>
    </div>
  );
}
