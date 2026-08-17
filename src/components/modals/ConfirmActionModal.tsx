"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  onConfirm,
  onClose,
  loading = false,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDestructive ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30"}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-[#ACACB8] leading-relaxed">
          <p>{message}</p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2E2E2E]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300 hover:text-white transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md ${
                isDestructive
                  ? "bg-red-600 hover:bg-red-500 shadow-red-900/40"
                  : "bg-[#FF6200] hover:bg-[#FF8C42] shadow-[0_0_15px_rgba(255,98,0,0.3)]"
              }`}
            >
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
