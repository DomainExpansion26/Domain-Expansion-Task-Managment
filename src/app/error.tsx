"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Client Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6 text-[#0F172A]">
      <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF6200]/30 bg-[#FF6200]/15 text-[#FF6200]">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-[#0F172A]">Something went wrong</h2>
        <p className="mb-6 text-xs text-[#64748B]">
          {error?.message || "An unexpected client-side error occurred. Your workspace data and session are safe."}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6200]/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] px-5 py-2.5 text-xs font-semibold text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
