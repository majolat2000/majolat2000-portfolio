import { useState, useEffect, useRef, useMemo } from "react";
import {
  fetchAffiliateData,
  requestWithdrawal,
  resolveBankAccount,
  type AffiliateDataResponse,
  type BankOption,
} from "@/lib/api-client";
import { formatNaira, formatDate } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Check,
  Wallet,
  Users,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  Building2,
  UserCheck,
  X,
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

  // Bank selection & search state
  const [bankCode, setBankCode] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Account details & verification state
  const [accountNumber, setAccountNumber] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountVerificationError, setAccountVerificationError] = useState<string | null>(null);
  const verificationTimerRef = useRef<any>(null);

  // Withdrawal form state
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

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sorted and filtered banks (Alphabetically A to Z)
  const sortedBanks = useMemo(() => {
    if (!data?.banks) return [];
    return [...data.banks].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
  }, [data?.banks]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return sortedBanks;
    const query = bankSearch.toLowerCase().trim();
    return sortedBanks.filter((b) => b.name.toLowerCase().includes(query));
  }, [sortedBanks, bankSearch]);

  const selectedBankObj = useMemo(() => {
    return sortedBanks.find((b) => b.code === bankCode) || null;
  }, [sortedBanks, bankCode]);

  // Account verification handler
  const verifyAccount = async (acctNum: string, bCode: string) => {
    if (acctNum.length !== 10 || !bCode) {
      setAccountName(null);
      setAccountVerificationError(null);
      return;
    }

    setVerifyingAccount(true);
    setAccountName(null);
    setAccountVerificationError(null);

    try {
      const res = await resolveBankAccount({
        account_number: acctNum,
        account_bank: bCode,
      });

      if (res.success && res.account_name) {
        setAccountName(res.account_name);
        setAccountVerificationError(null);
      } else {
        setAccountName(null);
        setAccountVerificationError(
          res.message || "Account not found or invalid account details for this bank.",
        );
      }
    } catch (err: any) {
      setAccountName(null);
      setAccountVerificationError(
        err.response?.data?.message ||
          err.message ||
          "Account not found or invalid account details for this bank.",
      );
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleAccountNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 10);
    setAccountNumber(cleaned);
    setAccountName(null);
    setAccountVerificationError(null);

    if (verificationTimerRef.current) {
      clearTimeout(verificationTimerRef.current);
    }

    if (cleaned.length === 10 && bankCode) {
      verificationTimerRef.current = setTimeout(() => {
        verifyAccount(cleaned, bankCode);
      }, 350);
    }
  };

  const handleSelectBank = (code: string) => {
    setBankCode(code);
    setBankDropdownOpen(false);
    setBankSearch("");
    setAccountName(null);
    setAccountVerificationError(null);

    if (accountNumber.length === 10) {
      if (verificationTimerRef.current) {
        clearTimeout(verificationTimerRef.current);
      }
      verificationTimerRef.current = setTimeout(() => {
        verifyAccount(accountNumber, code);
      }, 300);
    }
  };

  const referralCode = data?.profile?.referral_code;
  const referralLink = referralCode
    ? `${window.location.origin}/storefront?ref=${referralCode}`
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
      setWithdrawError("Please select your destination bank.");
      return;
    }
    if (!accountNumber || accountNumber.length !== 10) {
      setWithdrawError("Please enter a valid 10-digit NUBAN account number.");
      return;
    }
    if (!accountName) {
      setWithdrawError("Please wait for your account to be verified before withdrawing.");
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
        bank_name: selectedBankObj?.name,
        account_number: accountNumber.trim(),
        account_name: accountName,
        amount: numAmount,
      });

      setWithdrawMessage(
        res.message ||
          `Withdrawal request of ${formatNaira(numAmount * 100)} submitted successfully to ${accountName}! An administrator will review and pay your account manually.`,
      );
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
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowUpRight className="size-5 text-primary" />
            Bank Withdrawal Request
          </CardTitle>
          <CardDescription className="text-xs">
            Select your bank, enter your 10-digit account number, and verify the account name. An administrator will review your request, transfer the funds manually, and approve the payout.
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
              {/* Destination Bank with Search (A to Z) */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <Label htmlFor="bank-selector" className="text-xs font-medium">
                  Destination Bank (A to Z)
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    id="bank-selector"
                    onClick={() => setBankDropdownOpen(!bankDropdownOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate flex items-center gap-2">
                      <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                      {selectedBankObj ? selectedBankObj.name : "Select Destination Bank"}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-50" />
                  </button>

                  {/* Dropdown Menu */}
                  {bankDropdownOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full min-w-[280px] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl">
                      {/* Search Input */}
                      <div className="p-2 border-b border-border/60 bg-muted/30 sticky top-0 z-10 flex items-center gap-2">
                        <Search className="size-3.5 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          placeholder="Search bank (e.g. OPay, GTBank, Kuda)..."
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          autoFocus
                          className="w-full bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none"
                        />
                        {bankSearch && (
                          <button
                            type="button"
                            onClick={() => setBankSearch("")}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Bank List */}
                      <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/20">
                        {filteredBanks.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No banks found matching "{bankSearch}"
                          </div>
                        ) : (
                          filteredBanks.map((b) => (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => handleSelectBank(b.code)}
                              className={`w-full text-left px-3 py-2 text-xs rounded-sm transition-colors flex items-center justify-between ${
                                b.code === bankCode
                                  ? "bg-primary text-primary-foreground font-semibold"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <span className="truncate">{b.name}</span>
                              {b.code === bankCode && (
                                <Check className="size-3.5 shrink-0 ml-2" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 10-Digit NUBAN Account Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="account_num" className="text-xs font-medium">
                    10-Digit NUBAN Account Number
                  </Label>
                  {verifyingAccount ? (
                    <span className="text-[11px] text-primary flex items-center gap-1 font-medium">
                      <Loader2 className="size-3 animate-spin text-primary" />
                      Checking bank...
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="account_num"
                    placeholder="e.g. 0123456789"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => handleAccountNumberChange(e.target.value)}
                    onBlur={() => {
                      if (accountNumber.length === 10 && bankCode && !accountName && !verifyingAccount) {
                        verifyAccount(accountNumber, bankCode);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && accountNumber.length === 10 && bankCode) {
                        e.preventDefault();
                        verifyAccount(accountNumber, bankCode);
                      }
                    }}
                    className="font-mono flex-1 text-sm tracking-wider"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={accountNumber.length !== 10 || !bankCode || verifyingAccount}
                    onClick={() => verifyAccount(accountNumber, bankCode)}
                    className="shrink-0 text-xs gap-1.5 border-primary/40 hover:bg-primary/10 h-10 px-3 font-semibold"
                  >
                    {verifyingAccount ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-primary" />
                    )}
                    <span>Verify</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Verification Feedback */}
            {accountName && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                <UserCheck className="size-5 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 block">
                    Verified Account Name
                  </span>
                  <span className="font-bold text-sm tracking-wide text-foreground block truncate">
                    {accountName}
                  </span>
                </div>
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
              </div>
            )}

            {accountVerificationError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{accountVerificationError}</span>
              </div>
            )}

            {/* Amount Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="payout_amount" className="text-xs font-medium">
                  Amount (NGN ₦)
                </Label>
                <button
                  type="button"
                  onClick={() => setAmount(String(data?.stats?.wallet_balance ?? 0))}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Max Available: {formatNaira((data?.stats?.wallet_balance ?? 0) * 100)}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                withdrawing ||
                verifyingAccount ||
                !accountName ||
                (data?.stats?.wallet_balance ?? 0) <= 0
              }
              className="w-full font-semibold gap-2 py-5 text-sm"
            >
              {withdrawing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="size-4" />
                  <span>
                    {accountName
                      ? `Request Payout to ${accountName.split(" ")[0]}`
                      : "Request Withdrawal"}
                  </span>
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
            Past payout requests, manual settlements, and approval statuses.
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
                      {w.account_name ? `${w.account_name} • ` : ""}
                      {w.bank_name ? `${w.bank_name} • ` : ""}
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
                        w.status === "APPROVED" || w.status === "SUCCESSFUL"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : w.status === "FAILED" || w.status === "REJECTED"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {w.status === "SUCCESSFUL" ? "APPROVED" : w.status === "PENDING" ? "PENDING APPROVAL" : w.status}
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
