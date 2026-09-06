"use client";

import React, { useState } from "react";
import { X, Calendar, AlertCircle, Info, ShieldCheck, CheckCircle2, HeartHandshake } from "lucide-react";

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
  const [leaveType, setLeaveType] = useState("CL");
  const [durationType, setDurationType] = useState<"FULL_DAY" | "FIRST_HALF" | "SECOND_HALF">("FULL_DAY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isHalfDay = durationType !== "FULL_DAY";

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (isHalfDay || !endDate) {
      setEndDate(val);
    }
  };

  const handleDurationChange = (type: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF") => {
    setDurationType(type);
    if (type !== "FULL_DAY" && startDate) {
      setEndDate(startDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || (!isHalfDay && !endDate) || !reason.trim()) {
      setError("Please fill in all leave details and a valid reason.");
      return;
    }

    setLoading(true);
    setError(null);

    const finalEndDate = isHalfDay ? startDate : endDate;

    try {
      const res = await fetch("/api/hrms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate: finalEndDate,
          isHalfDay,
          halfDaySession: isHalfDay ? durationType : undefined,
          daysCount: isHalfDay ? 0.5 : undefined,
          reason: reason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        onLeaveApplied();
        onClose();
        setReason("");
        setStartDate("");
        setEndDate("");
        setDurationType("FULL_DAY");
      } else {
        setError(json.error?.message || "Failed to submit leave request");
      }
    } catch (err) {
      setError("Network error submitting leave request");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic policy helper notes
  const getPolicyGuidelines = (type: string) => {
    switch (type) {
      case "CL":
        return {
          title: "Casual & Sick Leave (CL / SL)",
          badge: "12 Days / Year • 1 Day / Month Accrual",
          description:
            "Accrues 1 working day on the 1st of every month for personal exigencies and medical recuperation. Unused balance carries forward past December 31st.",
          icon: Calendar,
          color: "text-cyan-600 dark:text-cyan-400",
          bg: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30",
        };
      case "PL":
      case "EL":
      case "PAID":
        return {
          title: "Privilege / Earned Leave (PL / EL)",
          badge: "12 Days / Year • 1 Day / Month Accrual",
          description:
            "Accrues 1 working day on the 1st of every month for planned vacations and personal time. Protected with year-end December carry-forward to the new year.",
          icon: ShieldCheck,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
        };
      case "ML":
      case "MATERNITY":
        return {
          title: "Maternity Benefit",
          badge: "26 Weeks (182 Days) Paid Leave",
          description:
            "Administered per the Maternity Benefit (Amendment) Act, 2017. Fully paid leave for prenatal and postnatal recovery with full salary continuation.",
          icon: HeartHandshake,
          color: "text-pink-600 dark:text-pink-400",
          bg: "bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/30",
        };
      case "PTL":
      case "PATERNITY":
        return {
          title: "Company Paternity Benefit",
          badge: "10 Working Days Paid Leave",
          description:
            "Administered per Company Paternity Policy. 10 paid working days for fathers upon the birth or legal adoption of a child.",
          icon: ShieldCheck,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
        };
      case "UL":
      case "UNPAID":
        return {
          title: "Loss of Pay (LOP / Unpaid Leave)",
          badge: "Unpaid Leave Option",
          description:
            "Applied when regular accrued paid leave quota has been exhausted. Requires supervisor approval.",
          icon: Info,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
        };
      default:
        return {
          title: "Company Leave Policy",
          badge: "Standard Policy",
          description: "All leave requests are subject to approval by your Team Lead or Reporting Manager.",
          icon: Info,
          color: "text-gray-600 dark:text-[#888898]",
          bg: "bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2E2E2E]",
        };
    }
  };

  const policy = getPolicyGuidelines(leaveType);
  const PolicyIcon = policy.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden text-gray-900 dark:text-[#F3F4F6]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2E2E2E] bg-gray-50/70 dark:bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Apply for Leave</h2>
              <p className="text-[11px] text-gray-500 dark:text-[#888898]">24-Day Annual Quota (2 Leaves Credited Monthly on 1st)</p>
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

          {/* Policy Information Box */}
          <div className={`p-3.5 rounded-2xl border ${policy.bg} space-y-1`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                <PolicyIcon className={`w-4 h-4 ${policy.color}`} />
                <span className={policy.color}>{policy.title}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2E2E] text-gray-700 dark:text-gray-300">
                {policy.badge}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-[#ACACB8] leading-relaxed">
              {policy.description}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-[#ACACB8] font-semibold mb-1">Select Leave Category *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="CL">Casual / Sick Leave (CL / SL) — 12 Days/Yr (1 Day/Mo)</option>
              <option value="PL">Privilege / Earned Leave (PL / EL) — 12 Days/Yr (1 Day/Mo)</option>
              <option value="ML">Maternity Benefit (ML) — 26 Weeks (182 Days Paid)</option>
              <option value="PTL">Paternity Benefit (PTL) — 10 Working Days Paid</option>
              <option value="UL">Loss of Pay (LOP / Unpaid)</option>
            </select>
          </div>

          {/* Leave Duration Selector: Full Day vs Half Day */}
          <div>
            <label className="block text-gray-700 dark:text-[#ACACB8] font-semibold mb-1.5">Leave Duration *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange("FULL_DAY")}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  durationType === "FULL_DAY"
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                    : "bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#ACACB8] border-gray-200 dark:border-[#2E2E2E] hover:border-cyan-500/50"
                }`}
              >
                Full Day (1.0)
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange("FIRST_HALF")}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  durationType === "FIRST_HALF"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#ACACB8] border-gray-200 dark:border-[#2E2E2E] hover:border-amber-500/50"
                }`}
              >
                Half Day - 1st Half (0.5)
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange("SECOND_HALF")}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  durationType === "SECOND_HALF"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#ACACB8] border-gray-200 dark:border-[#2E2E2E] hover:border-amber-500/50"
                }`}
              >
                Half Day - 2nd Half (0.5)
              </button>
            </div>
          </div>

          <div className={`grid ${isHalfDay ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
            <div>
              <label className="block text-gray-700 dark:text-[#ACACB8] font-semibold mb-1">
                {isHalfDay ? "Leave Date *" : "Start Date *"}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {!isHalfDay && (
              <div>
                <label className="block text-gray-700 dark:text-[#ACACB8] font-semibold mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 dark:text-[#ACACB8] font-semibold mb-1">Reason for Leave *</label>
            <textarea
              rows={3}
              required
              placeholder="Provide reason for time-off request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-[#2E2E2E]">
            <div className="text-[11px] text-gray-500 dark:text-[#888898] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dec Year-End Carry Forward Enabled</span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-[#888898] hover:bg-gray-100 dark:hover:bg-[#202020]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
