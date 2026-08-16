"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  X,
  Sparkles,
} from "lucide-react";

interface TeamViewProps {
  users: any[];
  currentUser: any;
  onSelectTask: (key: string) => void;
  onRefreshData: () => void;
}

export function TeamView({ users, currentUser, onSelectTask, onRefreshData }: TeamViewProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("TEAM_MEMBER");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setStatusMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: `Invitation sent to ${inviteEmail}. Email logged in Dev Mailbox!` });
        setInviteName("");
        setInviteEmail("");
        onRefreshData();
      } else {
        setStatusMsg({ type: "error", text: json.error?.message || "Failed to send invitation" });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Network error sending invite" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#FF6200]" />
            <span>Team Directory & Capacity</span>
          </h1>
          <p className="text-xs text-[#888898] mt-1">
            Manage organization members, assign roles, monitor workloads, and invite new colleagues
          </p>
        </div>

        <button
          onClick={() => {
            setStatusMsg(null);
            setShowInviteModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.map((user) => {
          const stats = user.stats || { active: 0, completed: 0, overdue: 0, inReview: 0 };

          return (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 hover:shadow-[0_0_20px_rgba(255,98,0,0.08)] transition-all cursor-pointer space-y-4 group"
            >
              {/* Member Profile */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-[#2E2E2E] shadow-sm"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#FF8C42] transition-colors">
                      {user.name}
                    </h3>
                    <div className="text-xs text-[#888898]">{user.jobTitle}</div>
                    <div className="text-[11px] font-mono text-[#666]">{user.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300">
                  {user.role.replace("_", " ")}
                </span>
              </div>

              {/* Workload Stats Bar */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#2E2E2E]/60 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] text-[#888898]">Active</div>
                  <div className="font-bold text-white mt-0.5">{stats.active}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] text-blue-400">Review</div>
                  <div className="font-bold text-blue-400 mt-0.5">{stats.inReview}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] text-red-400">Overdue</div>
                  <div className="font-bold text-red-400 mt-0.5">{stats.overdue}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E]">
                  <div className="text-[10px] text-emerald-400">Done</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{stats.completed}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Assigned Tasks Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={selectedUser.name}
                  className="w-9 h-9 rounded-xl object-cover"
                />
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedUser.name}</h2>
                  <p className="text-xs text-[#888898]">{selectedUser.jobTitle} &bull; {selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Assigned Tasks ({selectedUser.tasks?.length || 0})
              </div>

              {selectedUser.tasks?.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#888898]">No tasks assigned currently.</div>
              ) : (
                selectedUser.tasks?.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onSelectTask(task.taskKey);
                      setSelectedUser(null);
                    }}
                    className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#FF8C42]">{task.taskKey}</span>
                      <span className="text-xs font-semibold text-white truncate max-w-md">{task.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252525] text-slate-300">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#FF6200]" />
                <h2 className="text-sm font-bold text-white">Invite Team Member</h2>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
              {statusMsg && (
                <div
                  className={`p-3 rounded-lg border leading-relaxed ${
                    statusMsg.type === "success"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/15 border-red-500/30 text-red-400"
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="TEAM_MEMBER">Team Member (Task execution & updates)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Task creation & project leads)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full organization control)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-[11px] text-[#888898]">
                An invitation email containing a secure account setup link will be dispatched immediately.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg text-[#888898] hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? "Sending..." : "Send Invitation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
