"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { DevMailboxModal } from "@/components/layout/DevMailboxModal";
import { DXAIAssistant } from "@/components/ai/DXAIAssistant";
import { TaskCreateModal } from "@/components/tasks/TaskCreateModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { DashboardView } from "@/components/views/DashboardView";
import { MyWorkView } from "@/components/views/MyWorkView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { KanbanView } from "@/components/views/KanbanView";
import { BacklogView } from "@/components/views/BacklogView";
import { TeamView } from "@/components/views/TeamView";
import { QAView } from "@/components/views/QAView";
import { HRMSView } from "@/components/views/HRMSView";
import { HRAdminView } from "@/components/views/HRAdminView";
import { SuperAdminView } from "@/components/views/SuperAdminView";
import { AdminSettingsView } from "@/components/views/AdminSettingsView";
import { ProfileSettingsView } from "@/components/views/ProfileSettingsView";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Modals & Panels
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState("TODO");
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDevMailboxOpen, setIsDevMailboxOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // 1. Check Authentication
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.data.user);
        setPermissions(json.data.permissions || []);
        return json.data.user;
      } else {
        router.push("/login");
        return null;
      }
    } catch {
      router.push("/login");
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // 2. Fetch App Data
  const fetchAppData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, usersRes, sprintsRes, notifsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/users"),
        fetch("/api/sprints"),
        fetch("/api/notifications"),
      ]);

      const [tasksJson, projectsJson, usersJson, sprintsJson, notifsJson] = await Promise.all([
        tasksRes.json(),
        projectsRes.json(),
        usersRes.json(),
        sprintsRes.json(),
        notifsRes.json(),
      ]);

      if (tasksJson.success) setTasks(tasksJson.data);
      if (projectsJson.success) setProjects(projectsJson.data);
      if (usersJson.success) setUsers(usersJson.data);
      if (sprintsJson.success) setSprints(sprintsJson.data);
      if (notifsJson.success) {
        setNotifications(notifsJson.data.notifications || []);
        setUnreadCount(notifsJson.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    }
  }, []);

  useEffect(() => {
    checkAuth().then((user) => {
      if (user) {
        fetchAppData();
      }
    });
  }, [checkAuth, fetchAppData]);

  // 3. Setup SSE for live real-time sync
  useEffect(() => {
    if (!currentUser) return;
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (
          data.event === "task_status_changed" ||
          data.event === "task_created" ||
          data.event === "task_comment_added" ||
          data.event === "notification" ||
          data.event === "qa_ticket_created" ||
          data.event === "qa_bug_created" ||
          data.event === "leave_applied"
        ) {
          fetchAppData();
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser, fetchAppData]);

  // 4. Quick Actions
  const handleStatusChange = async (taskKey: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.taskKey === taskKey ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        fetchAppData(); // Rollback
      }
    } catch {
      fetchAppData();
    }
  };

  const handleMarkNotificationsRead = async (id?: string, markAll?: boolean) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, markAllRead: markAll }),
      });
      fetchAppData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (authLoading || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF6200] border-t-transparent rounded-full animate-spin" />
          <span>Connecting to Domain Expansion workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={(tab) => {
        if (tab === "ai") {
          setIsAIOpen(true);
        } else {
          setCurrentTab(tab);
        }
      }}
      currentUser={currentUser}
      unreadCount={unreadCount}
      onOpenCreateTask={() => {
        setCreateTaskStatus("TODO");
        setCreateTaskProjectId(undefined);
        setIsCreateTaskOpen(true);
      }}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenNotifications={() => setIsNotificationsOpen(true)}
      onOpenDevMailbox={() => setIsDevMailboxOpen(true)}
      onToggleAI={() => setIsAIOpen(!isAIOpen)}
      onLogout={handleLogout}
    >
      {/* Dynamic Views */}
      {currentTab === "dashboard" && (
        <DashboardView
          tasks={tasks}
          projects={projects}
          users={users}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onSelectProject={(id) => setCurrentTab("kanban")}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onToggleAI={() => setIsAIOpen(true)}
        />
      )}

      {currentTab === "my-work" && (
        <MyWorkView
          tasks={tasks}
          currentUser={currentUser}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onStatusChange={handleStatusChange}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onToggleAI={() => setIsAIOpen(true)}
        />
      )}

      {currentTab === "projects" && (
        <ProjectsView
          projects={projects}
          users={users}
          currentUser={currentUser}
          onSelectProject={(id) => setCurrentTab("kanban")}
          onRefreshData={fetchAppData}
        />
      )}

      {currentTab === "kanban" && (
        <KanbanView
          tasks={tasks}
          projects={projects}
          currentUser={currentUser}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onStatusChange={handleStatusChange}
          onOpenCreateTask={(defaultStatus) => {
            setCreateTaskStatus(defaultStatus || "TODO");
            setIsCreateTaskOpen(true);
          }}
        />
      )}

      {currentTab === "backlog" && (
        <BacklogView
          tasks={tasks}
          projects={projects}
          sprints={sprints}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onOpenCreateTask={(projId, sprintId) => {
            setCreateTaskProjectId(projId);
            setIsCreateTaskOpen(true);
          }}
          onRefreshData={fetchAppData}
        />
      )}

      {currentTab === "qa" && (
        <QAView
          currentUser={currentUser}
          projects={projects}
          users={users}
          tasks={tasks}
        />
      )}

      {currentTab === "hrms" && (
        <HRMSView
          currentUser={currentUser}
        />
      )}

      {currentTab === "team" && (
        <TeamView
          users={users}
          currentUser={currentUser}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onRefreshData={fetchAppData}
        />
      )}

      {currentTab === "hradmin" && (
        <HRAdminView
          currentUser={currentUser}
        />
      )}

      {currentTab === "superadmin" && (
        <SuperAdminView
          currentUser={currentUser}
        />
      )}

      {currentTab === "notifications" && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Notifications Feed</h1>
            <button
              onClick={() => handleMarkNotificationsRead(undefined, true)}
              className="text-xs text-[#FF8C42] hover:underline font-bold"
            >
              Mark all as read
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) handleMarkNotificationsRead(n.id);
                  if (n.link) {
                    const match = n.link.match(/tasks\/(.+)/);
                    if (match && match[1]) setSelectedTaskKey(match[1]);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  n.isRead ? "bg-[#141414] border-[#2E2E2E]" : "bg-[#1A1A1A] border-[#FF6200]/40 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{n.title}</span>
                  <span className="text-[10px] text-[#888898]">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-[#ACACB8] mt-1">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentTab === "admin" && <AdminSettingsView currentUser={currentUser} />}

      {currentTab === "profile" && (
        <ProfileSettingsView
          currentUser={currentUser}
          onUserUpdated={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* Global Modals */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTask={(key) => setSelectedTaskKey(key)}
        onSelectProject={() => setCurrentTab("kanban")}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationsRead}
        onSelectTask={(key) => setSelectedTaskKey(key)}
      />

      <DevMailboxModal
        isOpen={isDevMailboxOpen}
        onClose={() => setIsDevMailboxOpen(false)}
      />

      <DXAIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        currentUser={currentUser}
        onTaskCreated={(taskKey) => {
          fetchAppData();
          setSelectedTaskKey(taskKey);
        }}
      />

      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projects={projects}
        users={users}
        defaultProjectId={createTaskProjectId}
        defaultStatus={createTaskStatus}
        onTaskCreated={() => fetchAppData()}
      />

      {selectedTaskKey && (
        <TaskDetailModal
          taskKey={selectedTaskKey}
          isOpen={Boolean(selectedTaskKey)}
          onClose={() => setSelectedTaskKey(null)}
          onTaskUpdated={() => fetchAppData()}
          users={users}
          currentUser={currentUser}
        />
      )}
    </AppShell>
  );
}
