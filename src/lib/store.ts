import { supabase } from "@/lib/supabase";

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_kobo: number;
  duration_days: number;
  active: boolean;
  created_at: string;
}

export interface AccessGrant {
  id: string;
  user_id: string;
  product_id: string;
  source: "manual" | "flutterwave";
  payment_reference: string | null;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export interface AccessGrantWithProduct extends AccessGrant {
  product: StoreProduct | null;
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

export interface NewProductInput {
  name: string;
  description: string;
  priceNaira: number;
  durationDays: number;
}

function unwrap<T>(data: T, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data;
}

export async function listProducts(): Promise<StoreProduct[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });
  return unwrap(data ?? [], error);
}

export async function listMyAccess(): Promise<AccessGrantWithProduct[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("product_access")
    .select("*, product:products(*)")
    .gte("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  return unwrap(data ?? [], error) as AccessGrantWithProduct[];
}

export async function listAccessFor(
  userId: string,
): Promise<AccessGrantWithProduct[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("product_access")
    .select("*, product:products(*)")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false });
  return unwrap(data ?? [], error) as AccessGrantWithProduct[];
}

export async function adminListUsers(): Promise<AdminUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_list_users");
  return unwrap((data ?? []) as AdminUser[], error);
}

export async function adminGrantAccess(
  userId: string,
  productId: string,
  days: number,
): Promise<AccessGrant> {
  if (!supabase) throw new Error("Storefront is not configured.");
  const { data, error } = await supabase.rpc("admin_grant_access", {
    p_user_id: userId,
    p_product_id: productId,
    p_days: days,
  });
  return unwrap(data as AccessGrant, error);
}

export async function adminAddProduct(
  input: NewProductInput,
): Promise<StoreProduct> {
  if (!supabase) throw new Error("Storefront is not configured.");
  const slug =
    input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `product-${Date.now()}`;
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description.trim() || null,
      price_kobo: Math.round(input.priceNaira * 100),
      duration_days: input.durationDays,
    })
    .select("*")
    .single();
  return unwrap(data as StoreProduct, error);
}

export function formatNaira(priceKobo: number): string {
  return `₦${(priceKobo / 100).toLocaleString("en-NG")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
