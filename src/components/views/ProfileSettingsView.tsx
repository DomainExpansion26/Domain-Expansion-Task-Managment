"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Mail,
  Shield,
  Check,
  Save,
  Key,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  UserCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Clock,
  CheckCircle2,
  Users,
  ChevronDown,
} from "lucide-react";
import { getInitials, getAvatarGradient, formatDate } from "@/lib/utils";

interface ProfileSettingsViewProps {
  currentUser: any;
  onUserUpdated: (updatedUser: any) => void;
}

export function ProfileSettingsView({ currentUser, onUserUpdated }: ProfileSettingsViewProps) {
  const [name, setName] = useState(currentUser?.name || "");
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || "");
  const [department, setDepartment] = useState(currentUser?.department || "");
  const [phone, setPhone] = useState(currentUser?.hrProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [managerId, setManagerId] = useState(currentUser?.managerId || currentUser?.manager?.id || "");
  const [teamLeadId, setTeamLeadId] = useState(currentUser?.teamLeadId || currentUser?.teamLead?.id || "");

  // Available colleagues for assignment if not assigned yet
  const [colleagues, setColleagues] = useState<any[]>([]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification Preferences
  const [prefs, setPrefs] = useState<any>({
    emailTaskAssigned: true,
    emailTaskUpdated: true,
    emailMention: true,
    emailComment: true,
    emailDueDate: true,
    emailOverdue: true,
    inAppTaskAssigned: true,
    inAppTaskUpdated: true,
    inAppMention: true,
    inAppComment: true,
    inAppDueDate: true,
    inAppOverdue: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setJobTitle(currentUser.jobTitle || "");
      setDepartment(currentUser.department || "");
      setPhone(currentUser.hrProfile?.phone || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setManagerId(currentUser.managerId || currentUser.manager?.id || "");
      setTeamLeadId(currentUser.teamLeadId || currentUser.teamLead?.id || "");
    }
  }, [currentUser]);

  useEffect(() => {
    // Fetch users to populate reporting manager & team lead dropdowns if unassigned
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          // Exclude self from candidate list to enforce: member cannot assign themselves
          const others = json.data.filter((u: any) => u.id !== currentUser?.id);
          setColleagues(others);
        }
      })
      .catch(console.error);

    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setPrefs(json.data);
      })
      .catch(console.error);
  }, [currentUser?.id]);

  const hasAssignedManager = Boolean(currentUser?.managerId || currentUser?.manager?.id);
  const hasAssignedLead = Boolean(currentUser?.teamLeadId || currentUser?.teamLead?.id);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSavedMsg(null);

    // Validate password change if attempted
    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg("New password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("New passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        name: name.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        avatarUrl: avatarUrl.trim() || null,
        phone: phone.trim() || undefined,
      };

      // Only allow setting managerId / teamLeadId if not already locked or if user is super admin
      if (!hasAssignedManager && managerId) {
        payload.managerId = managerId;
      }
      if (!hasAssignedLead && teamLeadId) {
        payload.teamLeadId = teamLeadId;
      }

      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }

      const [userRes, prefRes] = await Promise.all([
        fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prefs),
        }),
      ]);

      const userJson = await userRes.json();
      if (userJson.success) {
        onUserUpdated(userJson.data);
        setSavedMsg("Profile and settings updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSavedMsg(null), 4000);
      } else {
        setErrorMsg(userJson.error?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMsg("Network error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  const joiningDateFormatted = currentUser?.joiningDate
    ? formatDate(currentUser.joiningDate)
    : currentUser?.createdAt
    ? formatDate(currentUser.createdAt)
    : "Not specified";

  const accountStatus = currentUser?.accountStatus || (currentUser?.isActive ? "ACTIVE" : "SUSPENDED");

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-800 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 border border-orange-200 text-[#FF6200]">
              Member Profile
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <User className="w-6 h-6 text-[#FF6200]" />
            <span>My Profile & Account Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View your organizational hierarchy, reporting structure, personal details, and compliance status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Account Status:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              accountStatus === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : accountStatus === "PENDING_VERIFICATION"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                accountStatus === "ACTIVE" ? "bg-emerald-500" : accountStatus === "PENDING_VERIFICATION" ? "bg-amber-500" : "bg-red-500"
              }`}
            />
            <span>{accountStatus}</span>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card & Overview */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#FF6200]" />
              <span>Identity & Organization Overview</span>
            </h3>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              Role: <span className="font-bold text-[#FF6200]">{currentUser?.role?.replace("_", " ")}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  name || currentUser?.name
                )} flex items-center justify-center text-2xl font-black text-white uppercase border border-slate-200 shadow-sm flex-shrink-0`}
              >
                {getInitials(name || currentUser?.name)}
              </div>
            )}
            <div className="space-y-1">
              <div className="text-lg font-bold text-slate-900">{name || currentUser?.name}</div>
              <div className="text-xs text-slate-500 font-mono">{currentUser?.email}</div>
              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 pt-1">
                {(jobTitle || currentUser?.jobTitle) && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                    {jobTitle || currentUser?.jobTitle}
                  </span>
                )}
                {(department || currentUser?.department) && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-medium">
                    Dept: {department || currentUser?.department}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#FF6200] font-mono font-bold">
                  {currentUser?.role?.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Organizational Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {/* Reporting Manager */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Reporting Manager</span>
              {hasAssignedManager ? (
                <div className="mt-1">
                  <span className="font-bold text-slate-900 text-sm block truncate">
                    {currentUser?.manager?.name || "Assigned"}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {currentUser?.manager?.email || "Managed by Super Admin"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
                    ✓ Verified & Assigned
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 space-y-1">
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">-- Select Reporting Manager --</option>
                    {colleagues.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.jobTitle || u.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-600">
                    Not assigned yet. Select your manager to request assignment.
                  </p>
                </div>
              )}
            </div>

            {/* Team Lead */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Team Lead</span>
              {hasAssignedLead ? (
                <div className="mt-1">
                  <span className="font-bold text-slate-900 text-sm block truncate">
                    {currentUser?.teamLead?.name || "Assigned"}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {currentUser?.teamLead?.email || "Managed by Super Admin"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
                    ✓ Verified & Assigned
                  </span>
                </div>
              ) : (
                <div className="mt-1.5 space-y-1">
                  <select
                    value={teamLeadId}
                    onChange={(e) => setTeamLeadId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF6200]"
                  >
                    <option value="">-- Select Team Lead --</option>
                    {colleagues.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.jobTitle || u.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-amber-600">
                    Not assigned yet. Select your lead to request assignment.
                  </p>
                </div>
              )}
            </div>

            {/* Department */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Department</span>
              <span className="font-bold text-slate-900 text-sm mt-1 block truncate">
                {department || currentUser?.department || "Unassigned"}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Role: {currentUser?.role?.replace("_", " ")}
              </span>
            </div>

            {/* Role / Designation */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Role / Designation</span>
              <span className="font-bold text-slate-900 text-sm mt-1 block truncate">
                {jobTitle || currentUser?.jobTitle || "Team Member"}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                System Role: {currentUser?.role?.replace("_", " ")}
              </span>
            </div>

            {/* Joining Date */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Joining Date</span>
              <span className="font-bold text-slate-900 text-sm mt-1 block">
                {joiningDateFormatted}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Official start record
              </span>
            </div>

            {/* NDA / Terms & Conditions Status */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">NDA & Compliance</span>
              <div className="mt-1 flex items-center gap-1.5">
                {currentUser?.ndaAccepted ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-700 text-xs">
                      Accepted ({currentUser?.ndaVersionAccepted || "v1.0"})
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold text-amber-700 text-xs">Pending Signature</span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {currentUser?.ndaAcceptedAt ? `Accepted on ${formatDate(currentUser.ndaAcceptedAt)}` : "Mandatory agreement"}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#FF6200]" />
            <span>Edit Personal & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Designation / Role Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1.5">Avatar Image URL</label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or leave blank for automatic monogram"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF6200]" />
            <span>Change Account Password (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Verify existing password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>
          </div>
        </div>

        {/* Notification Delivery Channels */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FF6200]" />
            <span>Notification Delivery Channels</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {[
              { key: "TaskAssigned", label: "Task Assigned", desc: "When someone assigns a new task to you" },
              { key: "TaskUpdated", label: "Task Updated", desc: "When status or metadata changes on your tasks" },
              { key: "Mention", label: "Mention in Comment", desc: "When someone tags you with @Name" },
              { key: "Comment", label: "Comments", desc: "When new comments are posted on your tasks" },
              { key: "DueDate", label: "Due Soon Reminder", desc: "When a deadline approaches in 24 hours" },
              { key: "Overdue", label: "Task Overdue Alert", desc: "When an assigned task passes its due date" },
            ].map((item) => (
              <div key={item.key} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>

                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={prefs[`email${item.key}`] ?? true}
                      onChange={(e) => setPrefs({ ...prefs, [`email${item.key}`]: e.target.checked })}
                      className="w-4 h-4 accent-[#FF6200] rounded"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={prefs[`inApp${item.key}`] ?? true}
                      onChange={(e) => setPrefs({ ...prefs, [`inApp${item.key}`]: e.target.checked })}
                      className="w-4 h-4 accent-[#FF6200] rounded"
                    />
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    <span>In-App</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold shadow-md shadow-[#FF6200]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Changes..." : "Save Profile & Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
