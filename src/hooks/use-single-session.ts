import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { apiClient } from "@/lib/api-client";

const SESSION_KEY = "device_session_id";
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours sliding timeout

export function getOrCreateDeviceSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useSingleSession(userId: string | undefined | null) {
  const lastActivityRef = useRef<number>(Date.now());
  const heartbeatTimerRef = useRef<any>(null);

  const handleTimeout = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore error
      }
    }
    if (typeof window !== "undefined") {
      window.location.href = "/storefront?reason=timeout";
    }
  }, []);

  const touchSession = useCallback(async () => {
    if (!userId) return;
    const sessionId = getOrCreateDeviceSessionId();

    // Check client-side sliding inactivity
    const now = Date.now();
    if (now - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
      handleTimeout();
      return;
    }

    try {
      const res = await apiClient.put<{ valid: boolean }>("/session", { sessionId });
      if (res.data?.valid === false) {
        // Session was superseded by another login on another device or expired
        handleTimeout();
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleTimeout();
      }
    }
  }, [userId, handleTimeout]);

  // Setup user activity listeners
  useEffect(() => {
    if (!userId) return;

    const onUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", onUserActivity, { passive: true });
    window.addEventListener("keydown", onUserActivity, { passive: true });
    window.addEventListener("click", onUserActivity, { passive: true });
    window.addEventListener("touchstart", onUserActivity, { passive: true });

    // Periodic heartbeat every 5 minutes
    heartbeatTimerRef.current = setInterval(() => {
      touchSession();
    }, 5 * 60 * 1000);

    // Initial touch on mount
    touchSession();

    return () => {
      window.removeEventListener("mousemove", onUserActivity);
      window.removeEventListener("keydown", onUserActivity);
      window.removeEventListener("click", onUserActivity);
      window.removeEventListener("touchstart", onUserActivity);
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [userId, touchSession]);

  return { touchSession, handleTimeout };
}
