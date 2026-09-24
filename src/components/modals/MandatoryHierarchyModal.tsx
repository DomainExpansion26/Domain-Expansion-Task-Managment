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
      if (json.success) {
        onSaved(json.data);
      } else {
        setError(json.error?.message || "Failed to save hierarchy assignment");
      }
    } catch (err) {
      setError("Network error saving hierarchy assignment");
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-slate-800">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-fade-in">
        {/* Top Header Banner */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6200]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Assign Your Reporting Line
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6200] border border-orange-200 font-bold">
                Mandatory Setup (One-Time)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            Every team member must have an assigned <strong>Reporting Manager</strong> or{" "}
            <strong>Reporting Team Lead</strong> to establish your organizational structure and enable task workflows.
          </p>

          {/* Current User Card */}
          <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                  currentUser.name
                )} flex items-center justify-center text-xs font-bold text-white uppercase border border-slate-200`}
              >
                {getInitials(currentUser.name)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentUser.jobTitle || "Team Member"} &bull; {currentUser.email}
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reporting Manager Select */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">
              1. Reporting Manager
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-[#FF6200]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200] transition-colors"
            >
              <option value="">-- Select Reporting Manager --</option>
              {leadershipManagers.length > 0 && (
                <optgroup label="🏢 Leadership & Managers">
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
            <p className="text-[10px] text-slate-400">
              Handles project oversight, leave approvals, and organizational reviews.
            </p>
          </div>

          {/* Reporting Team Lead Select */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-slate-700 font-bold">
              2. Reporting Team Lead
            </label>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 hover:border-[#FF6200]/50 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200] transition-colors"
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
            <p className="text-[10px] text-slate-400">
              Coordinates daily sprints, ticket reviews, and technical tasks.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-900 leading-relaxed">
            💡 <strong>Requirement:</strong> You can select your Reporting Manager, Reporting Team Lead, or both. Once saved, this hierarchy links your profile for approvals and tasks.
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading || (!managerId && !teamLeadId)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold text-xs uppercase tracking-wide shadow-md shadow-[#FF6200]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Configuring Profile..." : "Confirm & Enter Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="text-[11px] text-slate-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
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
