"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, CheckCircle2, AlertCircle, Edit3 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  dateStr: string;
  isHRAdmin?: boolean;
  onRecordUpdated?: () => void;
}

export function AttendanceDetailModal({
  isOpen,
  onClose,
  record,
  dateStr,
  isHRAdmin = false,
  onRecordUpdated,
}: AttendanceDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(record?.status || "NOT_RECORDED");
  const [punchIn, setPunchIn] = useState(
    record?.punchIn ? new Date(record.punchIn).toISOString().slice(11, 16) : ""
  );
  const [punchOut, setPunchOut] = useState(
    record?.punchOut ? new Date(record.punchOut).toISOString().slice(11, 16) : ""
  );
  const [breakMinutes, setBreakMinutes] = useState(record?.breakDurationMinutes || 0);
  const [notes, setNotes] = useState(record?.notes || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveCorrection = async () => {
    setLoading(true);
    try {
      let fullPunchIn: string | null = null;
      let fullPunchOut: string | null = null;

      if (punchIn) {
        fullPunchIn = `${dateStr}T${punchIn}:00.000Z`;
      }
      if (punchOut) {
        fullPunchOut = `${dateStr}T${punchOut}:00.000Z`;
      }

      const res = await fetch("/api/hrms/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: record?.id,
          date: dateStr,
          userId: record?.userId,
          punchIn: fullPunchIn,
          punchOut: fullPunchOut,
          breakDurationMinutes: Number(breakMinutes),
          status,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (onRecordUpdated) onRecordUpdated();
        setEditing(false);
        onClose();
      }
    } catch (err) {
      console.error("Attendance correction error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Daily Attendance Details</h2>
              <p className="text-[11px] text-[#888898]">{new Date(dateStr).toDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#888898] block mb-1">Status</span>
                  <span className="font-bold text-white uppercase tracking-wider">{record?.status || "NOT RECORDED"}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                  <span className="text-[#888898] block mb-1">Total Hours</span>
                  <span className="font-bold text-[#FF8C42]">{record?.totalWorkingHours || 0} hrs</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E]">
                <div className="flex justify-between">
                  <span className="text-[#888898]">Punch In:</span>
                  <span className="text-white font-mono">{record?.punchIn ? formatDateTime(record.punchIn) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888898]">Punch Out:</span>
                  <span className="text-white font-mono">{record?.punchOut ? formatDateTime(record.punchOut) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888898]">Break Duration:</span>
                  <span className="text-white font-mono">{record?.breakDurationMinutes || 0} mins</span>
                </div>
              </div>

              {record?.notes && (
                <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] text-[#ACACB8]">
                  <span className="text-[#888898] block mb-1">Notes:</span>
                  <p>{record.notes}</p>
                </div>
              )}

              {isHRAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-[#FF8C42] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Correct Attendance (HR / Admin)</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="FULL_DAY">Full Day</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="PRESENT">Present (Punch In Progress)</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LEAVE">Leave</option>
                  <option value="HOLIDAY">Holiday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Punch In (HH:MM)</label>
                  <input
                    type="time"
                    value={punchIn}
                    onChange={(e) => setPunchIn(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Punch Out (HH:MM)</label>
                  <input
                    type="time"
                    value={punchOut}
                    onChange={(e) => setPunchOut(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF6200]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Break Duration (Mins)</label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Correction Reason / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Biometric system delay correction"
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-[#FF6200] text-white font-bold hover:bg-[#FF8C42]"
                >
                  {loading ? "Saving..." : "Save Correction"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
