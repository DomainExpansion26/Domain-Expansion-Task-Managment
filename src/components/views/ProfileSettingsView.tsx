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
    }
  }, [currentUser]);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setPrefs(json.data);
      })
      .catch(console.error);
  }, []);

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
        setSavedMsg("Profile & preferences updated successfully.");
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-[#F3F4F6]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
          <User className="w-5 h-5 text-[#FF6200]" />
          <span>My Profile & Account Settings</span>
        </h1>
        <p className="text-xs text-[#888898] mt-1">
          View your organizational hierarchy, update personal details, and configure real-time notifications
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {savedMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card & Overview */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-5">
          <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Account Overview</h3>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300">
              Role: <span className="font-bold text-[#FF8C42]">{currentUser?.role?.replace("_", " ")}</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border border-[#2E2E2E] shadow-sm"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  name || currentUser?.name
                )} flex items-center justify-center text-xl font-black text-white uppercase border border-[#2E2E2E] shadow-sm flex-shrink-0`}
              >
                {getInitials(name || currentUser?.name)}
              </div>
            )}
            <div className="space-y-0.5">
              <div className="text-base font-bold text-white">{name || currentUser?.name}</div>
              <div className="text-xs text-[#888898] font-mono">{currentUser?.email}</div>
              <div className="text-xs text-[#ACACB8]">
                {jobTitle || currentUser?.jobTitle || "Team Member"} &bull; {department || currentUser?.department || "General"}
              </div>
            </div>
          </div>

          {/* Readonly Organization Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Employee ID</span>
              <span className="font-bold text-white font-mono mt-0.5 block">
                {currentUser?.hrProfile?.employeeId || "EMP-" + currentUser?.id?.substring(0, 4)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Reports to Manager</span>
              <span className="font-bold text-white mt-0.5 block truncate">
                {currentUser?.manager?.name || "Direct (None)"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Team Lead</span>
              <span className="font-bold text-white mt-0.5 block truncate">
                {currentUser?.teamLead?.name || "Direct (None)"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E]">
              <span className="text-[10px] text-[#888898] uppercase font-mono block">Account Status</span>
              <span className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Edit Profile Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Job Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Avatar Image URL</label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or leave blank for initials"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF8C42]" />
            <span>Change Account Password (Optional)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Verify existing password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888898] hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888898] hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1.5">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
              />
            </div>
          </div>
        </div>

        {/* Notification Delivery Channels */}
        <div className="p-6 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Notification Delivery Channels
          </h3>

          <div className="divide-y divide-[#2E2E2E]/60 text-xs">
            {[
              { key: "TaskAssigned", label: "Task Assigned", desc: "When someone assigns a new task to you" },
              { key: "TaskUpdated", label: "Task Updated", desc: "When status or metadata changes on your tasks" },
              { key: "Mention", label: "Mention in Comment", desc: "When someone tags you with @Name" },
              { key: "Comment", label: "Comments", desc: "When new comments are posted on your tasks" },
              { key: "DueDate", label: "Due Soon Reminder", desc: "When a deadline approaches in 24 hours" },
              { key: "Overdue", label: "Task Overdue Alert", desc: "When an assigned task passes its due date" },
            ].map((item) => (
              <div key={item.key} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-[#888898]">{item.desc}</div>
                </div>

                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#ACACB8] hover:text-white">
                    <input
                      type="checkbox"
                      checked={prefs[`email${item.key}`] ?? true}
                      onChange={(e) => setPrefs({ ...prefs, [`email${item.key}`]: e.target.checked })}
                      className="w-4 h-4 accent-[#FF6200] rounded"
                    />
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#ACACB8] hover:text-white">
                    <input
                      type="checkbox"
                      checked={prefs[`inApp${item.key}`] ?? true}
                      onChange={(e) => setPrefs({ ...prefs, [`inApp${item.key}`]: e.target.checked })}
                      className="w-4 h-4 accent-[#FF6200] rounded"
                    />
                    <Bell className="w-3.5 h-3.5" />
                    <span>In-App</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#FF6200]/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Changes..." : "Save Profile Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
