"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseInactivityTimeoutOptions {
  timeoutMs?: number; // Total timeout (default: 5 minutes = 300,000 ms)
  warningMs?: number; // Time before timeout to show warning (default: 30 seconds = 30,000 ms)
  enabled?: boolean;
  onLogout?: () => void;
}

export function useInactivityTimeout({
  timeoutMs = 5 * 60 * 1000, // 5 minutes
  warningMs = 30 * 1000, // 30 seconds warning
  enabled = true,
  onLogout,
}: UseInactivityTimeoutOptions = {}) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.round(warningMs / 1000));

  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  }, [showWarning]);

  const handleExpireLogout = useCallback(async () => {
    setShowWarning(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    if (onLogout) {
      onLogout();
    } else {
      router.push("/login?reason=inactivity");
    }
  }, [onLogout, router]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleUserAction = () => {
      resetActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserAction, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeUntilTimeout = timeoutMs - elapsed;

      if (timeUntilTimeout <= 0) {
        handleExpireLogout();
      } else if (timeUntilTimeout <= warningMs) {
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(timeUntilTimeout / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(checkInterval);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserAction);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [enabled, timeoutMs, warningMs, resetActivity, handleExpireLogout]);

  return {
    showWarning,
    secondsRemaining,
    resetActivity,
    handleExpireLogout,
  };
}
