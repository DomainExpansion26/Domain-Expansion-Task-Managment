"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shield, UserCheck, AlertCircle, ArrowRight, LogOut, CheckCircle2, Building2 } from "lucide-react";
import { getInitials, getAvatarGradient } from "@/lib/utils";

interface MandatoryHierarchyModalProps {
  isOpen: boolean;
  currentUser: any;
  allUsers: any[];
  onSaved: (updatedUser: any) => void;
  onLogout?: () => void;
}

export function MandatoryHierarchyModal({
  isOpen,
  currentUser,
  allUsers = [],
  onSaved,
  onLogout,
}: MandatoryHierarchyModalProps) {
  const [mounted, setMounted] = useState(false);
  const [internalUsers, setInternalUsers] = useState<any[]>(allUsers || []);
  const [managerId, setManagerId] = useState("");
  const [teamLeadId, setTeamLeadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch all active company members to ensure dropdowns always have the full employee list
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setInternalUsers(json.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      setInternalUsers(allUsers);
    }
  }, [allUsers]);

  if (!isOpen || !mounted || !currentUser) return null;

  // Filter out the current user so they cannot select themselves
  const availableUsers = internalUsers.filter((u) => u.id !== currentUser.id);

  // Group managers: Leadership & Managers first, then all other company members
  const leadershipManagers = availableUsers.filter(
    (u) =>
      u.role === "SUPER_ADMIN" ||
      u.role === "MANAGER" ||
      u.role === "PROJECT_MANAGER" ||
      u.role === "HR_ADMIN"
  );
  const otherMembersForManager = availableUsers.filter(
    (u) =>
      !(
        u.role === "SUPER_ADMIN" ||
        u.role === "MANAGER" ||
        u.role === "PROJECT_MANAGER" ||
        u.role === "HR_ADMIN"
      )
  );

  // Group team leads: Leads & seniors first, then all company employees
  const leadsAndSeniors = availableUsers.filter(
    (u) =>
      u.role === "TEAM_LEAD" ||
      (u.jobTitle && /lead|senior|architect|manager|head/i.test(u.jobTitle)) ||
      u.role === "MANAGER" ||
      u.role === "SUPER_ADMIN"
  );
  const otherEmployeesForTeamLead = availableUsers.filter(
    (u) => !leadsAndSeniors.some((ls) => ls.id === u.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerId && !teamLeadId) {
      setError("Please select at least one: a Reporting Manager or a Reporting Team Lead.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users/hierarchy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: managerId || null,
          teamLeadId: teamLeadId || null,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        onSaved(json.data.user);
      } else {
        setError(json.error?.message || "Failed to update reporting line. Please try again.");
      }
    } catch {
      setError("Network error while updating reporting line. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        {/* Top Header Banner */}
        <div className="p-6 border-b border-[#2E2E2E] bg-gradient-to-r from-[#1A1A1A] via-[#161616] to-[#121212]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF8C42]">
              <UserCheck className="w-5 h-5 text-[#FF6200]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Assign Your Reporting Line
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30 font-bold">
                Mandatory Setup (One-Time)
              </span>
            </div>
          </div>
          <p className="text-xs text-[#888898] leading-relaxed mt-2">
            Every team member must have an assigned <strong>Reporting Manager</strong> or{" "}
            <strong>Reporting Team Lead</strong> to establish your approval workflow and enable task collaboration.
          </p>

          {/* Current User Card */}
          <div className="mt-4 p-3 rounded-2xl bg-[#111] border border-[#262626] flex items-center gap-3">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#2E2E2E]"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                  currentUser.name
                )} flex items-center justify-center text-xs font-bold text-white uppercase border border-[#2E2E2E]`}
              >
                {getInitials(currentUser.name)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-[#888898] truncate">
                {currentUser.jobTitle || "Team Member"} &bull; {currentUser.email}
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reporting Manager Select */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              1. Reporting Manager
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] hover:border-[#FF6200]/50 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#FF6200] transition-colors"
            >
              <option value="">-- Select Reporting Manager --</option>
              {leadershipManagers.length > 0 && (
                <optgroup label="🏢 Executive & Managers">
                  {leadershipManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role.replace("_", " ")} &bull; {m.jobTitle || m.department || "Manager"})
                    </option>
                  ))}
                </optgroup>
              )}
              {otherMembersForManager.length > 0 && (
                <optgroup label="👥 All Company Employees">
                  {otherMembersForManager.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.jobTitle || m.department || "Member"})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-[10px] text-[#666]">
              Handles overall project assignments, leave approvals, and organization hierarchy.
            </p>
          </div>

          {/* Reporting Team Lead Select */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-slate-300 font-bold">
              2. Reporting Team Lead
            </label>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] hover:border-[#FF6200]/50 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#FF6200] transition-colors"
            >
              <option value="">-- Select Reporting Team Lead --</option>
              {leadsAndSeniors.length > 0 && (
                <optgroup label="⚡ Team Leads & Seniors">
                  {leadsAndSeniors.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.jobTitle || tl.role.replace("_", " ") || "Lead"})
                    </option>
                  ))}
                </optgroup>
              )}
              {otherEmployeesForTeamLead.length > 0 && (
                <optgroup label="👥 All Company Employees">
                  {otherEmployeesForTeamLead.map((tl) => (
                    <option key={tl.id} value={tl.id}>
                      {tl.name} ({tl.jobTitle || tl.department || "Member"})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-[10px] text-[#666]">
              Coordinates daily sprint backlog, code reviews, and technical tasks.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#181818] border border-[#282828] text-[11px] text-[#888898] leading-relaxed">
            💡 <strong>Requirement:</strong> You can choose your Reporting Manager, Reporting Team Lead, or both from any company member. Once submitted, this configuration is saved to your permanent profile and you will not be prompted again.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading || (!managerId && !teamLeadId)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-bold text-xs uppercase tracking-wide hover:opacity-95 shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Configuring Profile..." : "Confirm & Enter Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="text-[11px] text-[#666] hover:text-red-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign in with a different account</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
