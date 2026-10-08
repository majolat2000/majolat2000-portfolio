import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

function mapUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  return {
    id: user.id,
    email: user.email ?? "",
    name: meta.full_name ?? user.email?.split("@")[0],
  };
}

function toError(error: { message: string }): Error {
  const message =
    error.message === "Invalid login credentials"
      ? "Wrong email or password."
      : error.message === "Email not confirmed"
        ? "Confirm your email first — check your inbox for the link."
        : error.message;
  return new Error(message);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async ({ email, password }: AuthCredentials) => {
    if (!supabase) throw new Error("Sign-in is not configured yet.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw toError(error);
  }, []);

  const signUp = useCallback(
    async ({ email, password }: AuthCredentials) => {
      if (!supabase) throw new Error("Sign-up is not configured yet.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw toError(error);
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signInAnonymously = useCallback(async () => {
    if (!supabase) throw new Error("Sign-in is not configured yet.");
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw new Error(
        "Guest sign-in is disabled. Create an account instead.",
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const user = session?.user ? mapUser(session.user) : null;

  return {
    isLoading,
    isAuthenticated: Boolean(session),
    user,
    signIn,
    signUp,
    signInAnonymously,
    signOut,
  };
}
