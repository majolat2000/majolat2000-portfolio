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
import logo from "@/assets/logo.svg";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  PackageSearch,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

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

function AuthPanel() {
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
          setError(
            signInError.message === "Invalid login credentials"
              ? "Wrong email or password."
              : signInError.message,
          );
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
          setError(signUpError.message);
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
      <CardHeader className="text-center">
        <img src={logo} alt="" className="mx-auto mb-2 size-10" />
        <CardTitle className="text-xl">Majolat Storefront</CardTitle>
        <CardDescription>
          Sign in or create an account to start shopping.
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
              <p className="text-sm font-medium text-emerald-600">{notice}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        <ShieldCheck className="mr-1.5 size-3.5" />
        Accounts are secured by Supabase Auth
      </CardFooter>
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
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!supabase) return;
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    onSignedOut();
  };

  const created = session.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString()
    : null;

  return (
    <div className="w-full max-w-lg space-y-4">
      <Card>
        <CardHeader className="text-center">
          <img src={logo} alt="" className="mx-auto mb-2 size-10" />
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <span>Account status</span>
            <span className="font-medium text-emerald-600">
              {session.user.email_confirmed_at ? "Confirmed" : "Pending"}
            </span>
          </div>
          {created && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <span>Member since</span>
              <span className="font-medium text-foreground">{created}</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
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

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <PackageSearch className="size-8 text-muted-foreground" />
          <p className="font-medium">Products are on the way</p>
          <p className="text-sm text-muted-foreground">
            The catalog lands here next. Your account is ready for it.
          </p>
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
          <div className="flex items-center gap-2 font-semibold">
            <span className="size-2.5 rounded-full bg-violet-500" />
            Storefront
          </div>
          <Button variant="ghost" asChild>
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
