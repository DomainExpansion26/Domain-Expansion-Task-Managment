"use client";

import React, { useState } from "react";
import { X, Shield, Key, UserCheck, AlertCircle, Building2, Briefcase, Trash2, Eye, EyeOff, Calendar, FileCheck } from "lucide-react";

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
  const [accountStatus, setAccountStatus] = useState(member?.accountStatus || (member?.isActive ? "ACTIVE" : "SUSPENDED"));
  const [joiningDate, setJoiningDate] = useState(
    member?.joiningDate ? new Date(member.joiningDate).toISOString().split("T")[0] : ""
  );
  const [ndaAccepted, setNdaAccepted] = useState<boolean>(member?.ndaAccepted ?? false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
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
          accountStatus,
          joiningDate: joiningDate || null,
          ndaAccepted,
          isActive: accountStatus === "ACTIVE",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-[#FF6200] border border-orange-200">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Super Admin — Manage Member Profile</h2>
              <p className="text-[11px] text-slate-500">
                Full administrative control: role, manager, lead, status, joining date & password reset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateDetails} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="MEMBER">Member (Standard worker)</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="MANAGER">Manager / Project Lead</option>
                  <option value="QA">QA Engineer</option>
                  <option value="HR_ADMIN">HR Administrator</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Dev"
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            {/* Hierarchy Assignment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                Reporting Hierarchy Assignments
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Reporting Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
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
                  <label className="block text-slate-600 font-semibold mb-1">Team Lead</label>
                  <select
                    value={teamLeadId}
                    onChange={(e) => setTeamLeadId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200]"
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

            {/* Status, Joining Date & NDA */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Status</label>
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="ACTIVE">ACTIVE (Authorized)</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">NDA / Compliance</label>
                <select
                  value={ndaAccepted ? "ACCEPTED" : "PENDING"}
                  onChange={(e) => setNdaAccepted(e.target.value === "ACCEPTED")}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FF6200]"
                >
                  <option value="ACCEPTED">Accepted / Compliant</option>
                  <option value="PENDING">Pending Acceptance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Member Changes"}
              </button>
            </div>
          </form>

          {/* Administrative Password Reset */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>Administrative Password Reset</span>
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !newPassword}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-slate-200"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {onDeleteMember && member.role !== "SUPER_ADMIN" ? (
            <button
              onClick={() => {
                onDeleteMember(member.id, member.name);
                onClose();
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deactivate / Remove Member</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
