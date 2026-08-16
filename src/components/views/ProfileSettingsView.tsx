"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Mail, Shield, Check, Save } from "lucide-react";

interface ProfileSettingsViewProps {
  currentUser: any;
  onUserUpdated: (updatedUser: any) => void;
}

export function ProfileSettingsView({ currentUser, onUserUpdated }: ProfileSettingsViewProps) {
  const [name, setName] = useState(currentUser?.name || "");
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || "");
  const [department, setDepartment] = useState(currentUser?.department || "");
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
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setPrefs(json.data);
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const [userRes, prefRes] = await Promise.all([
        fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, jobTitle, department }),
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
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
          <User className="w-5 h-5 text-[#FF6200]" />
          <span>User Profile & Notification Preferences</span>
        </h1>
        <p className="text-xs text-[#888898] mt-1">
          Customize your profile identity and control real-time alerts and email subscriptions
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Account Details</h3>

          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-2xl object-cover border border-[#2E2E2E]"
            />
            <div>
              <div className="text-sm font-bold text-white">{currentUser?.name}</div>
              <div className="text-xs text-[#888898] font-mono">{currentUser?.email}</div>
              <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] text-slate-300 mt-1.5">
                Role: {currentUser?.role?.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-[#ACACB8] font-semibold mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FF6200]"
              />
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
        </div>

        {/* Notification Preferences */}
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Notification Delivery Channels
          </h3>

          <div className="divide-y divide-[#2E2E2E]/60 text-xs">
            {[
              { key: "TaskAssigned", label: "Task Assigned", desc: "When someone assigns a new issue to you" },
              { key: "TaskUpdated", label: "Task Updated", desc: "When status or metadata changes on your tasks" },
              { key: "Mention", label: "Mention in Comment", desc: "When someone tags you with @Name" },
              { key: "Comment", label: "Comments", desc: "When new comments are posted on your tasks" },
              { key: "DueDate", label: "Due Soon Reminder", desc: "When a deadline approaches in 24 hours" },
              { key: "Overdue", label: "Task Overdue Alert", desc: "When an assigned task passes its due date" },
            ].map((item) => (
              <div key={item.key} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{item.label}</div>
                  <div className="text-[11px] text-[#888898]">{item.desc}</div>
                </div>

                <div className="flex items-center gap-4">
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

        {/* Submit */}
        <div className="flex items-center justify-between">
          {savedMsg ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences saved successfully
            </span>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
