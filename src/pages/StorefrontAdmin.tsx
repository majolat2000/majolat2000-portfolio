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
  type ProductType,
} from "@/lib/store";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Key,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  Pencil,
  Wallet,
  UserMinus,
  Building2,
  RefreshCw,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { AuthPanel } from "./Storefront";
import {
  adminUpgradeUserToAffiliate,
  adminDemoteAffiliateToUser,
  adminResetUserPassword,
  adminListWithdrawals,
  adminUpdateWithdrawalStatus,
  type AffiliateProfile,
  type AdminWithdrawalItem,
} from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

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
  const [editType, setEditType] = useState<ProductType>("course");
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsLifetime, setEditIsLifetime] = useState(false);
  const [editDays, setEditDays] = useState("30");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateProfile | null>(null);
  const [customRefCode, setCustomRefCode] = useState("");
  const [upgradingAffiliate, setUpgradingAffiliate] = useState(false);
  const [demotingAffiliate, setDemotingAffiliate] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
  const [copiedResetPassword, setCopiedResetPassword] = useState(false);

  // Withdrawals management state
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalItem[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsFilter, setWithdrawalsFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    item: AdminWithdrawalItem;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const loadWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const res = await adminListWithdrawals();
      if (res.success && Array.isArray(res.withdrawals)) {
        setWithdrawals(res.withdrawals);
      }
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleConfirmWithdrawalAction = async () => {
    if (!actionModal) return;
    const { item, action } = actionModal;
    try {
      setProcessingWithdrawalId(item.id);
      setError(null);
      setMessage(null);
      const res = await adminUpdateWithdrawalStatus({
        withdrawalId: item.id,
        action,
        reason: action === "reject" ? rejectReason : undefined,
      });
      setMessage(res.message);
      setActionModal(null);
      setRejectReason("");
      await loadWithdrawals();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    Promise.all([adminListUsers(), listProducts(), adminListWithdrawals()])
      .then(([nextUsers, nextProducts, withdrawalsRes]) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setProducts(nextProducts);
        setGrantProductId(nextProducts[0]?.id ?? "");
        if (withdrawalsRes?.success && Array.isArray(withdrawalsRes.withdrawals)) {
          setWithdrawals(withdrawalsRes.withdrawals);
        }
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
    if (!selected) {
      setAffiliateInfo(null);
      return;
    }
    let cancelled = false;
    listAccessFor(selected.id)
      .then((rows) => {
        if (!cancelled) setGrants(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err));
      });

    if (supabase) {
      supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", selected.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled) setAffiliateInfo(data);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pendingWithdrawalsCount = withdrawals.filter(
    (w) => w.status === "PENDING",
  ).length;

  const filteredWithdrawals = withdrawals.filter((w) => {
    const normStatus =
      w.status === "SUCCESSFUL"
        ? "APPROVED"
        : w.status === "FAILED"
        ? "REJECTED"
        : w.status;
    if (withdrawalsFilter !== "ALL" && normStatus !== withdrawalsFilter) {
      return false;
    }
    if (!withdrawalSearch.trim()) return true;
    const q = withdrawalSearch.toLowerCase().trim();
    return Boolean(
      (w.user_email && w.user_email.toLowerCase().includes(q)) ||
      (w.account_number && w.account_number.includes(q)) ||
      (w.account_name && w.account_name.toLowerCase().includes(q)) ||
      (w.bank_name && w.bank_name.toLowerCase().includes(q))
    );
  });

  
  const handleUpgradeAffiliate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setUpgradingAffiliate(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminUpgradeUserToAffiliate({
        userId: selected.id,
        customCode: customRefCode.trim() || undefined,
      });
      setAffiliateInfo(res.profile);
      setMessage(`User upgraded to AFFILIATE! Referral code: ${res.profile.referral_code}`);
      setCustomRefCode("");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to upgrade user.";
      setError(msg);
    } finally {
      setUpgradingAffiliate(false);
    }
  };

  const handleDemoteAffiliate = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        `Are you sure you want to demote ${selected.email} from Affiliate back to regular User?`
      )
    ) {
      return;
    }
    setDemotingAffiliate(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminDemoteAffiliateToUser({ userId: selected.id });
      setAffiliateInfo(res.profile);
      setMessage(`User ${selected.email} has been demoted back to regular USER.`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to demote user.";
      setError(msg);
    } finally {
      setDemotingAffiliate(false);
    }
  };

  const handleAdminResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setResettingPassword(true);
    setError(null);
    setMessage(null);
    setResetPasswordSuccess(null);
    try {
      const res = await adminResetUserPassword({
        userId: selected.id,
        newPassword: resetPasswordInput.trim() || undefined,
      });
      if (res.password) {
        setResetPasswordSuccess(res.password);
        setMessage(`Password for ${selected.email} has been updated.`);
        setResetPasswordInput("");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to reset user password.";
      setError(msg);
    } finally {
      setResettingPassword(false);
    }
  };

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
    setEditType((product.type as ProductType) || "course");
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
        type: editType,
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
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="withdrawals" className="relative gap-1.5" onClick={() => loadWithdrawals()}>
                <span>Withdrawals</span>
                {pendingWithdrawalsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold leading-none animate-pulse">
                    {pendingWithdrawalsCount}
                  </span>
                )}
              </TabsTrigger>
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

                        {/* Affiliate Management */}
                        <div className="pt-4 border-t border-border/60 space-y-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
                            <Wallet className="size-3.5 text-primary" />
                            Affiliate Status
                          </p>
                          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Role:</span>
                              <span className="font-semibold uppercase px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                                {affiliateInfo?.role || "USER"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Referral Code:</span>
                              <span className="font-mono font-semibold text-foreground">
                                {affiliateInfo?.referral_code || "None"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Wallet Balance:</span>
                              <span className="font-bold text-foreground">
                                {formatNaira((affiliateInfo?.wallet_balance || 0) * 100)}
                              </span>
                            </div>
                          </div>

                          <form onSubmit={handleUpgradeAffiliate} className="space-y-3 pt-1">
                            <div className="space-y-1.5">
                              <Label htmlFor="custom-ref-code" className="text-xs">
                                Custom Referral Code (optional)
                              </Label>
                              <Input
                                id="custom-ref-code"
                                placeholder="e.g. promo2026 or leave blank for auto"
                                value={customRefCode}
                                onChange={(e) => setCustomRefCode(e.target.value)}
                              />
                            </div>
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="w-full rounded-full border-primary/40 hover:bg-primary/10 font-semibold text-xs"
                              disabled={upgradingAffiliate || demotingAffiliate}
                            >
                              {upgradingAffiliate ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Wallet className="size-3.5 mr-1.5 text-primary" />
                              )}
                              {affiliateInfo?.role === "AFFILIATE"
                                ? "Update Referral Code"
                                : "Upgrade to Affiliate"}
                            </Button>
                            {affiliateInfo?.role === "AFFILIATE" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleDemoteAffiliate}
                                disabled={demotingAffiliate || upgradingAffiliate}
                                className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs gap-1.5"
                              >
                                {demotingAffiliate ? (
                                  <Loader2 className="size-3.5 animate-spin mr-1" />
                                ) : (
                                  <UserMinus className="size-3.5 text-destructive" />
                                )}
                                Demote to Regular User
                              </Button>
                            )}
                          </form>
                        </div>

                        {/* Admin Password Reset Section */}
                        <div className="pt-4 border-t border-border/60 space-y-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
                              <Key className="size-3.5 text-primary" />
                              Reset User Password
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Directly set a new password or auto-generate a secure temporary password for this user or affiliate.
                            </p>
                          </div>

                          {resetPasswordSuccess && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                  <Check className="size-3.5" /> Password reset successful!
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px] text-emerald-700 dark:text-emerald-300"
                                  onClick={() => {
                                    navigator.clipboard.writeText(resetPasswordSuccess);
                                    setCopiedResetPassword(true);
                                    setTimeout(() => setCopiedResetPassword(false), 2000);
                                  }}
                                >
                                  {copiedResetPassword ? (
                                    <>
                                      <Check className="size-3 mr-1" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="size-3 mr-1" /> Copy Password
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="p-2 bg-background/80 rounded-lg font-mono text-xs font-bold text-foreground break-all border border-emerald-500/20">
                                {resetPasswordSuccess}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Give this new password to the user. They can log in immediately and change it in their dashboard.
                              </p>
                            </div>
                          )}

                          <form onSubmit={handleAdminResetPassword} className="space-y-2.5">
                            <div className="space-y-1">
                              <Label htmlFor="admin-new-password" className="text-xs font-medium">
                                New Password (optional)
                              </Label>
                              <Input
                                id="admin-new-password"
                                type="text"
                                placeholder="Leave blank to auto-generate"
                                value={resetPasswordInput}
                                onChange={(e) => setResetPasswordInput(e.target.value)}
                                className="font-mono text-xs"
                                disabled={resettingPassword}
                              />
                            </div>
                            <Button
                              type="submit"
                              size="sm"
                              variant="secondary"
                              className="w-full rounded-full font-semibold text-xs py-2 h-auto"
                              disabled={resettingPassword}
                            >
                              {resettingPassword ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Key className="size-3.5 mr-1.5" />
                              )}
                              {resetPasswordInput.trim() ? "Reset to Specified Password" : "Generate & Reset Password"}
                            </Button>
                          </form>
                        </div>
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="block font-medium text-foreground text-sm sm:text-base">
                                  {product.name}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  product.type === "toolkit"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                    : product.type === "product"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                }`}>
                                  {product.type || "course"}
                                </span>
                              </div>
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
            <TabsContent value="withdrawals" className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Pending Review
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      {pendingWithdrawalsCount} Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground font-medium">
                      Total:{" "}
                      <span className="font-bold text-foreground">
                        {formatNaira(
                          withdrawals
                            .filter((w) => w.status === "PENDING")
                            .reduce((acc, curr) => acc + curr.amount, 0) * 100,
                        )}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-emerald-500/5">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Approved &amp; Paid
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      {
                        withdrawals.filter(
                          (w) => w.status === "APPROVED" || w.status === "SUCCESSFUL",
                        ).length
                      }{" "}
                      Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground font-medium">
                      Total:{" "}
                      <span className="font-bold text-foreground">
                        {formatNaira(
                          withdrawals
                            .filter(
                              (w) => w.status === "APPROVED" || w.status === "SUCCESSFUL",
                            )
                            .reduce((acc, curr) => acc + curr.amount, 0) * 100,
                        )}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-muted-foreground">
                      Rejected &amp; Refunded
                    </CardDescription>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      {
                        withdrawals.filter(
                          (w) => w.status === "REJECTED" || w.status === "FAILED",
                        ).length
                      }{" "}
                      Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Wallet balances automatically restored.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filter and Search Bar */}
              <Card className="border-border/60">
                <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Affiliate Withdrawal Requests
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify beneficiary bank details, transfer funds manually, and confirm approval.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadWithdrawals()}
                    disabled={withdrawalsLoading}
                    className="gap-1.5 text-xs h-8"
                  >
                    <RefreshCw className={`size-3.5 ${withdrawalsLoading ? "animate-spin" : ""}`} />
                    <span>Refresh</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        value={withdrawalSearch}
                        onChange={(e) => setWithdrawalSearch(e.target.value)}
                        placeholder="Search by email, name, account #..."
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setWithdrawalsFilter(tab)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            withdrawalsFilter === tab
                              ? "bg-foreground text-background"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab === "ALL" ? "All Requests" : tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List / Table */}
                  {withdrawalsLoading && withdrawals.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      <span className="text-sm">Loading withdrawal requests...</span>
                    </div>
                  ) : filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground space-y-1">
                      <p className="text-sm font-semibold text-foreground">No withdrawal requests found</p>
                      <p className="text-xs">
                        {withdrawals.length === 0
                          ? "No affiliate has requested a withdrawal yet."
                          : "No requests match your search or filter."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60 -my-2">
                      {filteredWithdrawals.map((w) => {
                        const isPending = w.status === "PENDING";
                        const isApproved = w.status === "APPROVED" || w.status === "SUCCESSFUL";
                        const isRejected = w.status === "REJECTED" || w.status === "FAILED";

                        return (
                          <div
                            key={w.id}
                            className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base text-foreground">
                                  {formatNaira(w.amount * 100)}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isApproved
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                      : isRejected
                                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse"
                                  }`}
                                >
                                  {isApproved ? "APPROVED" : isPending ? "PENDING REVIEW" : "REJECTED"}
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-foreground font-medium">
                                  Affiliate: {w.user_email || w.user_id}
                                </span>
                                <span>•</span>
                                <span>Requested: {formatDate(w.created_at)}</span>
                              </div>

                              {/* Bank and Beneficiary details card */}
                              <div className="mt-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                                    Bank Name
                                  </span>
                                  <span className="font-medium text-foreground truncate block">
                                    {w.bank_name || `Bank Code: ${w.account_bank}`}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                                    Account Number
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-semibold text-foreground">
                                      {w.account_number}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(w.account_number);
                                        setCopiedAccount(w.id);
                                        setTimeout(() => setCopiedAccount(null), 2000);
                                      }}
                                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                      title="Copy Account Number"
                                    >
                                      {copiedAccount === w.id ? (
                                        <Check className="size-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="size-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-semibold">
                                    Verified Account Name
                                  </span>
                                  <span className="font-semibold text-foreground truncate block text-emerald-600 dark:text-emerald-400">
                                    {w.account_name || "Account name not provided"}
                                  </span>
                                </div>
                              </div>

                              {w.failure_reason && (
                                <p className="text-xs text-destructive mt-1 font-medium">
                                  Rejection Reason: {w.failure_reason} (Refunded)
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0">
                              {isPending ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={processingWithdrawalId === w.id}
                                    onClick={() => setActionModal({ item: w, action: "approve" })}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3 gap-1.5 shadow-sm"
                                  >
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Confirm Paid &amp; Approve</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={processingWithdrawalId === w.id}
                                    onClick={() => {
                                      setRejectReason("");
                                      setActionModal({ item: w, action: "reject" });
                                    }}
                                    className="text-xs h-9 px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <XCircle className="size-3.5 mr-1" />
                                    <span>Reject</span>
                                  </Button>
                                </>
                              ) : isApproved ? (
                                <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                                  <CheckCircle2 className="size-4" />
                                  <span>Paid &amp; Approved</span>
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                  <XCircle className="size-4" />
                                  <span>Refunded</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Withdrawal Action Modal (Approve or Reject) */}
          <Dialog
            open={!!actionModal}
            onOpenChange={(open) => {
              if (!open) setActionModal(null);
            }}
          >
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-4 sm:p-6 rounded-2xl">
              {actionModal && (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      {actionModal.action === "approve"
                        ? "Confirm Manual Bank Transfer"
                        : "Reject Withdrawal Request"}
                    </DialogTitle>
                    <DialogDescription>
                      {actionModal.action === "approve"
                        ? "Ensure you have transferred the funds to this account before confirming."
                        : "The requested amount will be immediately refunded back to the affiliate's wallet."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Amount to Pay:</span>
                        <span className="font-bold text-sm text-foreground">
                          {formatNaira(actionModal.item.amount * 100)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Destination Bank:</span>
                        <span className="font-semibold text-foreground">
                          {actionModal.item.bank_name || actionModal.item.account_bank}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-mono font-bold text-foreground">
                          {actionModal.item.account_number}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {actionModal.item.account_name || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Affiliate Email:</span>
                        <span className="text-foreground">{actionModal.item.user_email}</span>
                      </div>
                    </div>

                    {actionModal.action === "reject" && (
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="reject-reason">Reason for rejection (Optional):</Label>
                        <Input
                          id="reject-reason"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Invalid account details, please check and retry"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActionModal(null)}
                      disabled={!!processingWithdrawalId}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmWithdrawalAction}
                      disabled={!!processingWithdrawalId}
                      className={
                        actionModal.action === "approve"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          : "bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
                      }
                    >
                      {processingWithdrawalId ? (
                        <Loader2 className="size-4 animate-spin mr-1" />
                      ) : null}
                      {actionModal.action === "approve"
                        ? "Yes, I have paid — Approve"
                        : "Reject & Refund"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
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
                  <Label htmlFor="edit-type">Product Type</Label>
                  <select
                    id="edit-type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ProductType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="course">Course</option>
                    <option value="toolkit">Toolkit</option>
                    <option value="product">Product</option>
                  </select>
                </div>
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
