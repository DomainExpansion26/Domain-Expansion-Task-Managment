"use client";

import React from "react";
import { Clock, ShieldAlert, CheckCircle } from "lucide-react";

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function InactivityWarningModal({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}: InactivityWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-amber-500/40 p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Session Inactivity Warning</h3>
          <p className="text-xs text-[#888898]">
            You have been inactive. For your security, you will be automatically logged out in:
          </p>
          <div className="text-2xl font-black text-amber-400 font-mono py-1">
            00:{String(secondsRemaining).padStart(2, "0")}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onStayLoggedIn}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
          <button
            onClick={onLogoutNow}
            className="w-full py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:bg-[#222] text-[#888898] hover:text-white font-semibold text-xs transition-all"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
