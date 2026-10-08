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
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

function NotConfigured() {
  return (
    <Card className="w-full max-w-md">
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

export function AuthPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        const { error: signInError } = await supabase.auth.signInWithPassword(
          { email, password },
        );
        if (signInError) {
          setError(friendlyAuthError(signInError.message));
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/storefront`,
          },
        });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
        } else if (!data.session) {
          setNotice(
            "Account created. Check your inbox to confirm your email, then sign in.",
          );
          form.reset();
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center justify-items-center text-center">
        <span className="grid size-12 place-items-center overflow-hidden rounded-full ring-1 ring-border">
          <img
            src={portfolio.avatar}
            alt={portfolio.name}
            className="h-full w-full object-cover"
          />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          Majesty&apos;s Digital Storefront
        </CardTitle>
        <CardDescription>
          Sign in or create an account to explore.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AccountPanel({
  session,
  onSignedOut,
}: {
  session: Session;
  onSignedOut: () => void;
}) {
  const navigate = useNavigate();
  const [access, setAccess] = useState<AccessGrantWithProduct[]>([]);
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isAdmin = session.user.email === "info@majolat2000.com.ng";

  const [view, setView] = useState<"storefront" | "preview">("storefront");
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMyAccess(session.user.id), listProducts()])
      .then(([nextAccess, nextCatalog]) => {
        if (cancelled) return;
        setAccess(nextAccess);
        setCatalog(nextCatalog);
      })
      .catch((err) => {
        if (!cancelled) {
          setNotice(
            err instanceof Error ? err.message : "Could not load the store.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeByProduct = new Map(access.map((grant) => [grant.product_id, grant]));
  const primaryProduct = catalog[0];
  const hasAccess = primaryProduct ? activeByProduct.has(primaryProduct.id) : false;

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    onSignedOut();
  };

  const handleBuy = async () => {
    if (!primaryProduct) return;
    setNotice(null);
    try {
      await startCheckout({
        productId: primaryProduct.id,
        userId: session.user.id,
        email: session.user.email ?? "",
        amountKobo: primaryProduct.price_kobo,
        productName: primaryProduct.name,
        durationDays: primaryProduct.duration_days,
      }, async (result) => {
        console.log("[Storefront] Checkout result:", JSON.stringify(result));
        const isSuccess = ["successful", "completed", "succeeded"].includes(result.status?.toLowerCase?.() ?? "");
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
            navigate(`/storefront/product/${primaryProduct.id}`);
          } catch (e) {
            console.error("[Storefront] Verify error:", e);
            setNotice(e instanceof Error ? e.message : "Failed to verify payment");
            alert("Error: " + (e instanceof Error ? e.message : "Failed to verify"));
          }
        } else {
          console.warn("[Storefront] Payment not successful or no transactionId:", result);
          setNotice("Payment was not completed. Status: " + result.status + ", TX ID: " + result.transactionId);
          alert("Payment callback received but status=" + result.status + " transactionId=" + result.transactionId);
        }
      });
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Checkout could not start.",
      );
    }
  };

  const created = session.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString()
    : null;

  if (view === "preview") {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => setView("storefront")} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Back to Dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold leading-tight">
              HIDDEN SECRETS TO LAND YOUR FIRST REMOTE JOB: The Exact Strategy I Used to Get Hired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-muted-foreground">
              <p>
                Landing my first remote job felt impossible until I stopped playing by the standard rules. When you're competing against a global talent pool, sending out 100 identical resumes a day is a recipe for burnout. I had to completely engineer a new approach to get noticed.
              </p>
              <p>
                In this video course, I break down the exact strategy that finally got me hired. From optimizing my online presence to running targeted outreach that hiring managers actually respond to, this is the completely transparent breakdown of what works right now. If you're ready to ditch the daily commute and land a role that gives you your time back, this is your starting line.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
              <h4 className="font-semibold">Before purchasing, please agree to the following terms:</h4>
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="term1" 
                  checked={agreed1} 
                  onChange={(e) => setAgreed1(e.target.checked)} 
                  className="mt-1 size-4 rounded border-border text-foreground focus:ring-foreground"
                />
                <label htmlFor="term1" className="text-sm">I understand this is a digital product and all sales are final.</label>
              </div>
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="term2" 
                  checked={agreed2} 
                  onChange={(e) => setAgreed2(e.target.checked)} 
                  className="mt-1 size-4 rounded border-border text-foreground focus:ring-foreground"
                />
                <label htmlFor="term2" className="text-sm">I agree that this material is for personal use only and cannot be resold or distributed.</label>
              </div>
            </div>

            <Button
              className="w-full rounded-full bg-foreground py-6 text-lg font-bold text-background hover:bg-foreground/90"
              disabled={!agreed1 || !agreed2 || !primaryProduct}
              onClick={handleBuy}
            >
              Buy Course for {primaryProduct ? formatNaira(primaryProduct.price_kobo) : "..."}
            </Button>
            {notice && (
              <p className="text-center text-sm text-red-500">{notice}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <Card>
        <CardHeader className="items-center justify-items-center text-center">
          <span className="grid size-14 place-items-center overflow-hidden rounded-full ring-1 ring-border">
            <img
              src={portfolio.avatar}
              alt={portfolio.name}
              className="h-full w-full object-cover"
            />
          </span>
          <CardTitle className="font-display text-3xl font-extrabold tracking-tight">
            Dashboard
          </CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        {created && (
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <span>Member since</span>
              <span className="font-medium text-foreground">{created}</span>
            </div>
          </CardContent>
        )}
        <CardFooter className="gap-2">
          {isAdmin && (
            <Button
              variant="default"
              className="flex-1 rounded-full font-semibold bg-foreground text-background"
              asChild
            >
              <Link to="/storefront/admin">
                Admin Panel
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 rounded-full font-semibold"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="px-6 py-5">
          <p className="eyebrow mb-4">Available Products</p>
          {!primaryProduct ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <p className="text-sm">Course coming soon...</p>
              {isAdmin && (
                <p className="mt-2 text-xs">
                  (Admin: Please add the course product in the Admin panel for it to show up here.)
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/10">
              <div className="p-5">
                <h3 className="mb-2 font-display text-lg font-bold leading-snug">
                  HIDDEN SECRETS TO LAND YOUR FIRST REMOTE JOB: The Exact Strategy I Used to Get Hired
                </h3>
                <div className="mb-4 text-sm text-muted-foreground">
                  Video Course
                </div>
                {hasAccess ? (
                  <Button 
                    className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                    asChild
                  >
                    <Link to={`/storefront/product/${primaryProduct.id}`}>
                      View Course
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full font-semibold"
                    onClick={() => setView("preview")}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function Storefront() {
  const { session, loading } = useSupabaseSession();

  return (
    <div className="relative min-h-screen text-foreground">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-8">
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
            asChild
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to portfolio
            </Link>
          </Button>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : !supabaseConfigured ? (
            <NotConfigured />
          ) : session ? (
            <AccountPanel session={session} onSignedOut={() => {}} />
          ) : (
            <AuthPanel />
          )}
        </main>
      </div>
    </div>
  );
}
