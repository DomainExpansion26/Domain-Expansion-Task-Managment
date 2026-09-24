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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily Attendance Details</h2>
              <p className="text-[11px] text-slate-500">{new Date(dateStr).toDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">Status</span>
                  <span className="font-bold text-slate-900 uppercase tracking-wider">{record?.status || "NOT RECORDED"}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">Total Hours</span>
                  <span className="font-bold text-cyan-600 font-mono">{record?.totalWorkingHours || 0} hrs</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Punch In:</span>
                  <span className="text-slate-900 font-mono">{record?.punchIn ? formatDateTime(record.punchIn) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Punch Out:</span>
                  <span className="text-slate-900 font-mono">{record?.punchOut ? formatDateTime(record.punchOut) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Break Duration:</span>
                  <span className="text-slate-900 font-mono">{record?.breakDurationMinutes || 0} mins</span>
                </div>
              </div>

              {record?.notes && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="text-slate-500 block mb-1 font-semibold">Notes:</span>
                  <p>{record.notes}</p>
                </div>
              )}

              {isHRAdmin && (
                <div className="pt-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-700 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                <label className="block text-slate-700 font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-cyan-500 font-semibold"
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
                  <label className="block text-slate-700 font-semibold mb-1">Punch In (HH:MM)</label>
                  <input
                    type="time"
                    value={punchIn}
                    onChange={(e) => setPunchIn(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Punch Out (HH:MM)</label>
                  <input
                    type="time"
                    value={punchOut}
                    onChange={(e) => setPunchOut(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Break Duration (Mins)</label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Correction Reason / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Biometric delay correction"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-all disabled:opacity-50"
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
