"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-md rounded-3xl border border-[#2E2E2E] bg-[#141414] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF6200]/30 bg-[#FF6200]/15 text-[#FF8C42]">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-white">Application Error</h2>
          <p className="mb-6 text-xs text-[#888898]">
            {error?.message || "A critical error occurred while loading the application."}
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6200]/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
