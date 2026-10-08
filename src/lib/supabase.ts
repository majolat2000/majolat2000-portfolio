import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export function friendlyAuthError(message: string): string {
  if (message === "Invalid login credentials") {
    return "Wrong email or password.";
  }
  if (message === "Email not confirmed") {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many attempts right now — please wait about an hour and try again.";
  }
  return message;
}
