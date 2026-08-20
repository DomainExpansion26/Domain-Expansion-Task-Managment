"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { QAView } from "@/components/views/QAView";

export default function QAPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
    ])
      .then(([meJson, projJson, userJson, taskJson]) => {
        if (meJson.success && meJson.data?.user) {
          setCurrentUser(meJson.data.user);
        } else {
          router.replace("/login");
        }
        if (projJson.success) setProjects(projJson.data);
        if (userJson.success) setUsers(userJson.data);
        if (taskJson.success) setTasks(taskJson.data);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to Quality Assurance Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      currentTab="qa"
      onSelectTab={(tab) => {
        if (tab !== "qa") router.push(`/dashboard?tab=${tab}`);
      }}
      currentUser={currentUser}
      unreadCount={0}
      onOpenCreateTask={() => router.push("/dashboard?create=true")}
      onOpenSearch={() => {}}
      onOpenNotifications={() => {}}
      onOpenDevMailbox={() => {}}
      onToggleAI={() => {}}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.replace("/login");
      }}
    >
      <QAView
        currentUser={currentUser}
        projects={projects}
        users={users}
        tasks={tasks}
      />
    </AppShell>
  );
}
