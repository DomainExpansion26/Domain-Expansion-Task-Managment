"use client";

import React, { useState } from "react";
import { X, Shield, Key, UserCheck, AlertCircle, Building2, Briefcase, Trash2 } from "lucide-react";

interface MemberManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  allMembers: any[];
  onMemberUpdated: () => void;
  onDeleteMember?: (id: string, name: string) => void;
}

export function MemberManageModal({
  isOpen,
  onClose,
  member,
  allMembers,
  onMemberUpdated,
  onDeleteMember,
}: MemberManageModalProps) {
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [role, setRole] = useState(member?.role || "MEMBER");
  const [jobTitle, setJobTitle] = useState(member?.jobTitle || "");
  const [department, setDepartment] = useState(member?.department || "");
  const [managerId, setManagerId] = useState(member?.manager?.id || member?.managerId || "");
  const [teamLeadId, setTeamLeadId] = useState(member?.teamLead?.id || member?.teamLeadId || "");
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [hrmsStatus, setHrmsStatus] = useState(member?.hrmsStatus || "ACTIVE");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const potentialManagers = allMembers.filter(
    (m) => m.id !== member.id && (m.role === "SUPER_ADMIN" || m.role === "MANAGER")
  );
  const potentialTeamLeads = allMembers.filter(
    (m) => m.id !== member.id && (m.role === "SUPER_ADMIN" || m.role === "MANAGER" || m.role === "TEAM_LEAD")
  );

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          jobTitle: jobTitle.trim(),
          department: department.trim(),
          managerId: managerId || null,
          teamLeadId: teamLeadId || null,
          isActive,
          status: hrmsStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Member profile & hierarchy updated successfully.");
        onMemberUpdated();
      } else {
        setError(json.error?.message || "Failed to update member");
      }
    } catch (err) {
      setError("Network error updating member");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Password reset successfully for ${member.name}`);
        setNewPassword("");
      } else {
        setError(json.error?.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Super Admin — Manage Member</h2>
              <p className="text-[11px] text-[#888898]">Assign role, configure hierarchy, reset credentials & status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Role Assignment */}
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Assigned Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#FF6200]/50 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="SUPER_ADMIN">👑 Super Admin</option>
                  <option value="HR_ADMIN">🏢 HR Admin</option>
                  <option value="MANAGER">👔 Manager</option>
                  <option value="TEAM_LEAD">⚡ Team Lead</option>
                  <option value="QA">🧪 QA Engineer</option>
                  <option value="MEMBER">💻 Member</option>
                </select>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            {/* Hierarchy Assignment (Master Prompt Section 8 & 9) */}
            <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] space-y-3">
              <h3 className="text-[11px] font-bold text-[#FF8C42] uppercase tracking-wider">
                Organizational Hierarchy Mapping
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Reports to Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">None (Top-Level / No Manager)</option>
                    {potentialManagers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#ACACB8] font-semibold mb-1">Reports to Team Lead</label>
                  <select
                    value={teamLeadId}
                    onChange={(e) => setTeamLeadId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">None (No Team Lead)</option>
                    {potentialTeamLeads.map((tl) => (
                      <option key={tl.id} value={tl.id}>
                        {tl.name} ({tl.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Account Access Status</label>
                <select
                  value={isActive ? "ACTIVE" : "DISABLED"}
                  onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="ACTIVE">Active (Can Login)</option>
                  <option value="DISABLED">Disabled / Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">HRMS Profile Status</label>
                <select
                  value={hrmsStatus}
                  onChange={(e) => setHrmsStatus(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PROBATION">Probation</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
              >
                {loading ? "Saving..." : "Save Member Changes"}
              </button>
            </div>
          </form>

          {/* Password Reset Section */}
          <div className="pt-4 border-t border-[#2E2E2E] space-y-3">
            <h3 className="text-[11px] font-bold text-[#888898] uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#FF8C42]" />
              <span>Administrative Password Reset</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !newPassword}
                className="px-4 py-2 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#FF8C42] font-semibold transition-colors disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2E2E2E] bg-[#1A1A1A] flex items-center justify-between">
          {onDeleteMember && member.role !== "SUPER_ADMIN" ? (
            <button
              onClick={() => {
                onDeleteMember(member.id, member.name);
                onClose();
              }}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deactivate Member</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
