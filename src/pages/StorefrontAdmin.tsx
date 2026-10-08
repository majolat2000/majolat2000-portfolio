import { Background } from "@/components/portfolio/Background";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  adminUpdateProduct,
  adminDeleteProduct,
  adminRevokeAccess,
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
  Pencil,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { AuthPanel } from "./Storefront";

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
  const [isLifetimeGrant, setIsLifetimeGrant] = useState(false);
  const [isLifetimeProduct, setIsLifetimeProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsLifetime, setEditIsLifetime] = useState(false);
  const [editDays, setEditDays] = useState("30");
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

  
  const handleRevokeAccess = async (grantId: string) => {
    if (!window.confirm("Are you sure you want to revoke this user's access?")) return;
    setBusy(true);
    setError(null);
    try {
      await adminRevokeAccess(grantId);
      setMessage("Access revoked.");
      if (selected) {
        setGrants(await listAccessFor(selected.id));
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGrant = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !grantProductId) return;
    const days = isLifetimeGrant ? 3650 : Number(grantDays);
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

  
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setBusy(true);
    setError(null);
    try {
      await adminDeleteProduct(productId);
      setMessage("Product deleted.");
      setProducts(await listProducts());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const startEditProduct = (product: StoreProduct) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description ?? "");
    setEditPrice(String(product.price_kobo / 100));
    const isLife = product.duration_days >= 3650;
    setEditIsLifetime(isLife);
    setEditDays(isLife ? "3650" : String(product.duration_days));
    setError(null);
    setMessage(null);
  };

  const handleUpdateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;
    const price = Number(editPrice);
    const days = editIsLifetime ? 3650 : Number(editDays);

    if (!editName.trim()) {
      setError("Give the product a name.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price in naira.");
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
      const updated = await adminUpdateProduct({
        id: editingProduct.id,
        name: editName.trim(),
        description: editDescription.trim(),
        priceNaira: price,
        durationDays: Math.round(days),
      });
      setMessage(`Updated "${updated.name}" successfully.`);
      setProducts(await listProducts());
      setEditingProduct(null);
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
    const days = isLifetimeProduct ? 3650 : Number(data.get("duration_days"));

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
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-border/40 backdrop-blur-md bg-background/50 sticky top-0 z-20">
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
          <h1 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Customers &amp; access
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
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
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border bg-muted/40 p-3 sm:px-4 sm:py-3 text-sm"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate font-medium text-foreground text-sm sm:text-base">
                                      {grant.product?.name ?? "Unknown product"}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      Active until {formatDate(grant.expires_at)}
                                      {grant.source === "flutterwave" ? " · Paid via Flutterwave" : " · Manual grant"}
                                    </span>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full sm:w-auto shrink-0 self-end sm:self-center"
                                    onClick={() => handleRevokeAccess(grant.id)}
                                    disabled={busy}
                                  >
                                    Revoke
                                  </Button>
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
                              <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" id="life-grant" checked={isLifetimeGrant} onChange={(e) => setIsLifetimeGrant(e.target.checked)} className="rounded border-border text-foreground focus:ring-foreground" />
                                <Label htmlFor="life-grant">Lifetime Access</Label>
                              </div>
                              {!isLifetimeGrant && (
                                <div className="space-y-2">
                                  <Label htmlFor="grant-days">Days of access</Label>
                                  <Input
                                    id="grant-days"
                                    type="number"
                                    min={1}
                                    max={36500}
                                    value={grantDays}
                                    onChange={(event) => setGrantDays(event.target.value)}
                                  />
                                </div>
                              )}
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-3.5 sm:px-4 sm:py-3 text-sm transition-colors hover:border-border/80"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="block font-medium text-foreground text-sm sm:text-base">
                                {product.name}
                              </span>
                              <span className="sm:hidden shrink-0 text-right text-xs font-bold text-foreground">
                                {formatNaira(product.price_kobo)}
                              </span>
                            </div>
                            {product.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-foreground text-[11px]">
                                {product.duration_days >= 3650 ? "Lifetime access" : `${product.duration_days} days access`}
                              </span>
                            </div>
                          </div>

                          <div className="hidden sm:block shrink-0 text-right text-xs text-muted-foreground">
                            <div className="font-bold text-sm text-foreground">{formatNaira(product.price_kobo)}</div>
                            <div className="mt-0.5">{product.duration_days >= 3650 ? "Lifetime access" : `${product.duration_days} days`}</div>
                          </div>

                          <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-border/40 sm:border-0 justify-end shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditProduct(product)}
                              disabled={busy}
                              className="flex-1 sm:flex-none text-xs sm:text-sm font-medium"
                            >
                              <Pencil className="size-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={busy}
                              className="flex-1 sm:flex-none text-xs sm:text-sm font-medium"
                            >
                              Delete
                            </Button>
                          </div>
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
                          <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="life-prod" checked={isLifetimeProduct} onChange={(e) => setIsLifetimeProduct(e.target.checked)} className="rounded border-border text-foreground focus:ring-foreground" />
                            <Label htmlFor="life-prod">Lifetime Access</Label>
                          </div>
                          {!isLifetimeProduct && (
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
                          )}
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
          <Dialog
            open={!!editingProduct}
            onOpenChange={(open) => {
              if (!open) setEditingProduct(null);
            }}
          >
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
              <DialogHeader>
                <DialogTitle>Edit Course / Product</DialogTitle>
                <DialogDescription>
                  Update the name, description, price, and access duration.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Course / Product Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Design Starter Pack"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Short line or overview shown to customers"
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (₦)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min={1}
                      step="any"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2 pt-1">
                      <input
                        type="checkbox"
                        id="edit-life"
                        checked={editIsLifetime}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditIsLifetime(checked);
                          if (checked) setEditDays("3650");
                        }}
                        className="rounded border-border text-foreground focus:ring-foreground"
                      />
                      <Label htmlFor="edit-life">Lifetime Access</Label>
                    </div>
                    {!editIsLifetime && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-days">Access (days)</Label>
                        <Input
                          id="edit-days"
                          type="number"
                          min={1}
                          value={editDays}
                          onChange={(e) => setEditDays(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-foreground text-background font-semibold hover:bg-foreground/90"
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : null}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
