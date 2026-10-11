import { useState, useEffect } from "react";
import {
  fetchAffiliateData,
  requestWithdrawal,
  type AffiliateDataResponse,
  type BankOption,
} from "@/lib/api-client";
import { formatNaira, formatDate } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Copy,
  Check,
  Wallet,
  Users,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function AffiliateDashboardView({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const [data, setData] = useState<AffiliateDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Withdrawal form state
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAffiliateData();
      setData(res);
      if (res.banks.length > 0 && !bankCode) {
        setBankCode(res.banks[0].code);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load affiliate details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const referralCode = data?.profile?.referral_code;
  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : null;

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawMessage(null);

    const numAmount = Number(amount);
    if (!bankCode) {
      setWithdrawError("Please select your bank.");
      return;
    }
    if (!accountNumber || accountNumber.length < 10) {
      setWithdrawError("Please enter a valid 10-digit account number.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setWithdrawError("Please enter a valid payout amount.");
      return;
    }
    if (data?.stats && numAmount > data.stats.wallet_balance) {
      setWithdrawError("Requested amount exceeds your available wallet balance.");
      return;
    }

    try {
      setWithdrawing(true);
      const res = await requestWithdrawal({
        account_bank: bankCode,
        account_number: accountNumber.trim(),
        amount: numAmount,
      });

      setWithdrawMessage(res.message || "Withdrawal initiated successfully!");
      setAmount("");
      // Reload stats and transactions
      loadData();
      onRefresh?.();
    } catch (err: any) {
      setWithdrawError(
        err.response?.data?.message ||
          err.message ||
          "Failed to process withdrawal.",
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        <span>Loading affiliate portal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-destructive/20 rounded-xl bg-destructive/5 text-destructive space-y-3">
        <AlertCircle className="size-8 mx-auto" />
        <p className="font-medium">{error}</p>
        <Button variant="outline" size="sm" onClick={loadData}>
          Try Again
        </Button>
      </div>
    );
  }

  const isAffiliate =
    data?.profile?.role === "AFFILIATE" || data?.profile?.role === "ADMIN";

  if (!isAffiliate) {
    return (
      <Card className="border-border/60 shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Affiliate Program</CardTitle>
          <CardDescription>
            Earn 30% commission on every product purchase made through your unique referral link.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account is currently a regular member. An administrator can upgrade your account to an affiliate partner.
          </p>
          <div className="p-4 bg-muted/40 rounded-lg text-xs text-muted-foreground">
            Contact support or the administrator to activate your affiliate link.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <Wallet className="size-4 text-primary" />
              Available Wallet Balance
            </CardDescription>
            <CardTitle className="text-3xl font-bold font-display text-primary">
              {formatNaira((data?.stats?.wallet_balance ?? 0) * 100)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Instant payouts via Flutterwave Transfers API. 30% commission per referral.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <Users className="size-4 text-emerald-500" />
              Referred Members
            </CardDescription>
            <CardTitle className="text-3xl font-bold font-display">
              {data?.stats?.referred_count ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Attributed automatically upon account creation with your link.
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Your Referral Link</CardTitle>
          <CardDescription className="text-xs">
            Share this link. Anyone who registers with it is automatically linked to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={referralLink ?? "Generating referral link..."}
              className="font-mono text-xs sm:text-sm bg-muted/30"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Code:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
              {referralCode}
            </code>
            <span>• Commission rate: 30% per purchase</span>
          </div>
        </CardContent>
      </Card>

      {/* Payout / Withdrawal Section */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowUpRight className="size-5 text-primary" />
            Instant Bank Withdrawal
          </CardTitle>
          <CardDescription className="text-xs">
            Withdraw funds directly into your Nigerian bank account. Funds are deducted securely and transferred instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-4">
            {withdrawMessage && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{withdrawMessage}</span>
              </div>
            )}
            {withdrawError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank" className="text-xs">Destination Bank</Label>
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger id="bank">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {data?.banks?.map((b: BankOption) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account_num" className="text-xs">10-Digit NUBAN Account Number</Label>
                <Input
                  id="account_num"
                  placeholder="0123456789"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="payout_amount" className="text-xs">Amount (NGN ₦)</Label>
                <button
                  type="button"
                  onClick={() => setAmount(String(data?.stats?.wallet_balance ?? 0))}
                  className="text-[11px] text-primary hover:underline"
                >
                  Max: {formatNaira((data?.stats?.wallet_balance ?? 0) * 100)}
                </button>
              </div>
              <Input
                id="payout_amount"
                type="number"
                min="100"
                step="any"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={withdrawing || (data?.stats?.wallet_balance ?? 0) <= 0}
              className="w-full font-semibold gap-2"
            >
              {withdrawing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing Payout...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4" />
                  <span>Withdraw Funds</span>
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payout History Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Withdrawal History</CardTitle>
          <CardDescription className="text-xs">
            Past payout transactions and bank settlement records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!data?.withdrawals || data.withdrawals.length === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No withdrawals requested yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60 -my-2 text-xs">
              {data.withdrawals.map((w) => (
                <div key={w.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">
                      {formatNaira(w.amount * 100)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {w.account_number} • {formatDate(w.created_at)}
                    </div>
                    {w.failure_reason && (
                      <div className="text-[10px] text-destructive">
                        Reason: {w.failure_reason}
                      </div>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        w.status === "SUCCESSFUL"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : w.status === "FAILED"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
