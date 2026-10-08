import { Background } from "@/components/portfolio/Background";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { portfolio } from "@/lib/portfolio";
import {
  adminAddProduct,
  adminGrantAccess,
  adminListUsers,
  formatDate,
  formatNaira,
  listAccessFor,
  listProducts,
  type AccessGrantWithProduct,
  type AdminUser,
  type StoreProduct,
} from "@/lib/store";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function StorefrontAdmin() {
  const { session, loading } = useSupabaseSession();
  const isAdmin = session?.user.app_metadata?.role === "admin";

  const [initialLoading, setInitialLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [grants, setGrants] = useState<AccessGrantWithProduct[]>([]);
  const [grantProductId, setGrantProductId] = useState<string>("");
  const [grantDays, setGrantDays] = useState<string>("30");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([adminListUsers(), listProducts()])
      .then(([nextUsers, nextProducts]) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setProducts(nextProducts);
        setGrantProductId(nextProducts[0]?.id ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err));
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    listAccessFor(selected.id)
      .then((rows) => {
        if (!cancelled) setGrants(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleGrant = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !grantProductId) return;
    const days = Number(grantDays);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      setError("Days must be between 1 and 3650.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const grant = await adminGrantAccess(selected.id, grantProductId, days);
      const product = products.find((p) => p.id === grantProductId);
      setMessage(
        `${product?.name ?? "Product"} granted to ${selected.email} — active until ${formatDate(grant.expires_at)}`,
      );
      setGrants(await listAccessFor(selected.id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddProduct = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const price = Number(data.get("price"));
    const days = Number(data.get("duration_days"));

    if (!name) {
      setError("Give the product a name.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a price in naira.");
      return;
    }
    if (!Number.isFinite(days) || days < 1) {
      setError("Access duration must be at least 1 day.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const created = await adminAddProduct({
        name,
        description,
        priceNaira: price,
        durationDays: Math.round(days),
      });
      setMessage(`${created.name} added to the catalog.`);
      setProducts(await listProducts());
      form.reset();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading || (isAdmin && initialLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/storefront" replace />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Background />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
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
            <Link to="/storefront">
              <ArrowLeft className="size-4" />
              Storefront
            </Link>
          </Button>
        </header>

        <main className="mt-8">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Customers &amp; access
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick a customer, choose a product and the number of days. Grants
            stack: extending adds to whatever is left.
          </p>

          {(message || error) && (
            <div
              className={`mt-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
                error
                  ? "border-destructive/50 text-destructive"
                  : "border-border bg-muted/40 text-foreground"
              }`}
            >
              {message && !error && (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              <span>{error ?? message}</span>
            </div>
          )}

          <Tabs defaultValue="users" className="mt-6">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All users</CardTitle>
                    <CardDescription>
                      {filteredUsers.length} of {users.length}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by email"
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelected(user);
                            setGrants([]);
                            setMessage(null);
                            setError(null);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                            selected?.id === user.id
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{user.email}</span>
                          <span className="shrink-0 text-xs">
                            {user.last_sign_in_at
                              ? formatDate(user.last_sign_in_at)
                              : "never signed in"}
                          </span>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No users match.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="size-4" />
                      {selected ? selected.email : "Select a user"}
                    </CardTitle>
                    <CardDescription>
                      {selected
                        ? `Joined ${formatDate(selected.created_at)}${selected.confirmed ? "" : " · email unconfirmed"}`
                        : "Choose someone from the list to grant access."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selected ? null : (
                      <div className="space-y-6">
                        <div>
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Current access
                          </p>
                          {grants.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No products yet.
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {grants.map((grant) => (
                                <li
                                  key={grant.id}
                                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm"
                                >
                                  <span className="truncate">
                                    {grant.product?.name ?? "Unknown product"}
                                  </span>
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    until {formatDate(grant.expires_at)}
                                    {grant.source === "flutterwave"
                                      ? " · paid"
                                      : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <form onSubmit={handleGrant} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Product</Label>
                              <Select
                                value={grantProductId}
                                onValueChange={setGrantProductId}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Choose a product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.name} ·{" "}
                                      {formatNaira(product.price_kobo)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="grant-days">Days of access</Label>
                              <Input
                                id="grant-days"
                                type="number"
                                min={1}
                                max={3650}
                                value={grantDays}
                                onChange={(event) =>
                                  setGrantDays(event.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                            disabled={busy || products.length === 0}
                          >
                            {busy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <UserPlus className="size-4" />
                            )}
                            Grant access
                          </Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Catalog</CardTitle>
                    <CardDescription>
                      {products.length} product{products.length === 1 ? "" : "s"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {products.map((product) => (
                        <li
                          key={product.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-3 py-2.5 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">
                              {product.name}
                            </span>
                            {product.description && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {product.description}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-right text-xs text-muted-foreground">
                            {formatNaira(product.price_kobo)}
                            <br />
                            {product.duration_days} days
                          </span>
                        </li>
                      ))}
                      {products.length === 0 && (
                        <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                          No products yet — add one on the right.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add a product</CardTitle>
                    <CardDescription>
                      Price is in naira; access length is in days.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-name">Name</Label>
                        <Input
                          id="product-name"
                          name="name"
                          placeholder="e.g. Design Starter Pack"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description">
                          Description
                        </Label>
                        <Input
                          id="product-description"
                          name="description"
                          placeholder="Short line shown to customers"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Price (₦)</Label>
                          <Input
                            id="product-price"
                            name="price"
                            type="number"
                            min={1}
                            step="any"
                            placeholder="5000"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-days">Access (days)</Label>
                          <Input
                            id="product-days"
                            name="duration_days"
                            type="number"
                            min={1}
                            defaultValue={30}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-full bg-foreground font-semibold text-background hover:bg-foreground/90"
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <UserPlus className="size-4" />
                        )}
                        Add product
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
