import { useEffect } from "react";
import { useLocation } from "react-router";

const REFERRAL_KEY = "affiliate_ref";

export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Captures ?ref= from the URL and saves it to localStorage.
 */
export function useReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref");
      if (ref && ref.trim()) {
        const cleanRef = ref.trim().toLowerCase();
        localStorage.setItem(REFERRAL_KEY, cleanRef);
      }
    } catch {
      // Ignore URL or localStorage access errors
    }
  }, [location.search]);
}
