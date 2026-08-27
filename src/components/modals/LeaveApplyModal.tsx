"use client";

import React, { useState } from "react";
import { X, Calendar, AlertCircle } from "lucide-react";

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveApplied: () => void;
}

export function LeaveApplyModal({
  isOpen,
  onClose,
  onLeaveApplied,
}: LeaveApplyModalProps) {
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      setError("Please fill in all leave details and a valid reason.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hrms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        onLeaveApplied();
        onClose();
        setReason("");
      } else {
        setError(json.error?.message || "Failed to submit leave request");
      }
    } catch (err) {
      setError("Network error submitting leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden text-gray-900 dark:text-[#F3F4F6]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2E2E2E] bg-gray-50/70 dark:bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Apply for Leave</h2>
              <p className="text-[11px] text-gray-500 dark:text-[#888898]">Submit time-off request for HR approval</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Leave Category *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="SICK">Sick Leave (SL)</option>
              <option value="PAID">Privilege / Paid Leave (PL)</option>
              <option value="UNPAID">Leave Without Pay (LWP)</option>
              <option value="EMERGENCY">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-500 dark:text-[#888898] font-semibold mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              placeholder="Provide reason for time-off..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-[#2E2E2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-[#888898]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
