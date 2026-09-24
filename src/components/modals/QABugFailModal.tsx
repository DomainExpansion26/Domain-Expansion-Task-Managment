"use client";

import React, { useState } from "react";
import { X, XCircle, AlertTriangle, MessageSquare, Send, ShieldAlert } from "lucide-react";

interface QABugFailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bugKey: string;
  bugTitle: string;
  developerName?: string;
  onConfirmFail: (data: { failureReason: string; actualResult?: string; failureComment?: string }) => Promise<void>;
}

export function QABugFailModal({
  isOpen,
  onClose,
  bugKey,
  bugTitle,
  developerName = "the responsible developer",
  onConfirmFail,
}: QABugFailModalProps) {
  const [failureReason, setFailureReason] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [failureComment, setFailureComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failureReason.trim()) {
      setError("Please provide a concise failure reason.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirmFail({
        failureReason: failureReason.trim(),
        actualResult: actualResult.trim() || undefined,
        failureComment: failureComment.trim() || undefined,
      });
      onClose();
      setFailureReason("");
      setActualResult("");
      setFailureComment("");
    } catch (err: any) {
      setError(err.message || "Failed to mark defect as failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-red-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-100 border border-red-200 text-red-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest">
                QA Verification Failed
              </span>
              <h2 className="text-base font-bold text-slate-900">{bugKey} &bull; Fail Defect Test</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Defect Summary</div>
            <div className="text-slate-900 font-semibold truncate mt-0.5">{bugTitle}</div>
          </div>

          {/* Failure Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Failure Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              placeholder="e.g. Duplicate email still returns 500 on step 3"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Actual Result observed during testing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Actual Result Observed</label>
            <textarea
              rows={2}
              value={actualResult}
              onChange={(e) => setActualResult(e.target.value)}
              placeholder="e.g. Server returned 500 Internal Server Error with unhandled PrismaUniqueConstraintViolation"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* QA Verification Comment / Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed QA Notes & Repro Details
            </label>
            <textarea
              rows={3}
              value={failureComment}
              onChange={(e) => setFailureComment(e.target.value)}
              placeholder="Provide exact response payloads, curl command, or test environment details for developer..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>
              This will update status to <strong>FAILED</strong>, log an activity record, and immediately alert{" "}
              <strong>{developerName}</strong>.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit QA Failure"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
