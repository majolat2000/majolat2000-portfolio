import axios from "axios";
import { supabase } from "@/lib/supabase";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Supabase auth token
apiClient.interceptors.request.use(async (config) => {
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore session errors
    }
  }
  return config;
});

// Response interceptor: handle 401 session expirations and timeouts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Do not redirect if conflict resolution is active or requesting /session
      const isConflictPending =
        typeof window !== "undefined" &&
        sessionStorage.getItem("abac_conflict_pending") === "true";
      const isSessionEndpoint = Boolean(error.config?.url?.includes("/session"));

      if (isConflictPending || isSessionEndpoint) {
        return Promise.reject(error);
      }

      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signout error
        }
      }
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("reason=timeout")) {
          window.location.href = `/storefront?reason=timeout`;
        }
      }
    }
    return Promise.reject(error);
  },
);

export interface AffiliateProfile {
  user_id: string;
  role: "USER" | "AFFILIATE" | "ADMIN";
  referral_code: string | null;
  referred_by_id: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRecord {
  id: string;
  user_id: string;
  amount: number;
  account_bank: string;
  account_number: string;
  transfer_ref: string;
  transfer_id: string | null;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankOption {
  code: string;
  name: string;
}

export interface AffiliateDataResponse {
  profile: AffiliateProfile;
  stats: {
    referred_count: number;
    wallet_balance: number;
  };
  withdrawals: WithdrawalRecord[];
  banks: BankOption[];
}

export async function fetchAffiliateData(): Promise<AffiliateDataResponse> {
  const res = await apiClient.get<AffiliateDataResponse>("/affiliate");
  return res.data;
}

export async function linkReferralCode(referralCode: string): Promise<{ success: boolean; linked: boolean }> {
  const res = await apiClient.post<{ success: boolean; linked: boolean }>("/affiliate", {
    action: "link_referral",
    referralCode,
  });
  return res.data;
}

export async function requestWithdrawal(params: {
  account_bank: string;
  account_number: string;
  amount: number;
}): Promise<{
  success: boolean;
  message: string;
  reference: string;
  new_balance: number;
}> {
  const res = await apiClient.post("/withdraw", params);
  return res.data;
}

export async function adminUpgradeUserToAffiliate(params: {
  userId: string;
  customCode?: string;
  action?: "upgrade" | "demote";
}): Promise<{ success: boolean; message?: string; profile: AffiliateProfile }> {
  const res = await apiClient.post("/admin/upgrade-affiliate", {
    ...params,
    action: params.action || "upgrade",
  });
  return res.data;
}

export async function adminDemoteAffiliateToUser(params: {
  userId: string;
}): Promise<{ success: boolean; message?: string; profile: AffiliateProfile }> {
  const res = await apiClient.post("/admin/upgrade-affiliate", {
    userId: params.userId,
    action: "demote",
  });
  return res.data;
}

export async function resolveBankAccount(params: {
  account_number: string;
  account_bank: string;
}): Promise<{
  success: boolean;
  account_name?: string;
  account_number?: string;
  message?: string;
}> {
  const res = await apiClient.post("/resolve-account", params);
  return res.data;
}
