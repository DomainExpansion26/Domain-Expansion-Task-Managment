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
import { BugDetailModal } from "@/components/qa/BugDetailModal";
import { RaiseBugModal } from "@/components/modals/RaiseBugModal";
import { DashboardView } from "@/components/views/DashboardView";
import { WorkPackagesView } from "@/components/views/WorkPackagesView";
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
import { DocumentsView } from "@/components/views/DocumentsView";
import { isSuperAdmin, isHRAdmin } from "@/lib/permissions";

import { useAppDispatch, useAppSelector, useAuth, useUI, useTasks, useNotifications } from "@/store/hooks";
import { setCredentials, logout as reduxLogout } from "@/store/slices/authSlice";
import { setActiveTab as setReduxTab } from "@/store/slices/uiSlice";
import { setTasks as setReduxTasks, updateTaskStatus as updateReduxTaskStatus } from "@/store/slices/tasksSlice";
import { setNotifications as setReduxNotifications, markAsRead as markReduxRead, markAllAsRead as markReduxAllRead } from "@/store/slices/notificationsSlice";
import { clearAllDXStorage } from "@/store/localStorage";

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authState = useAuth();
  const uiState = useUI();
  const tasksState = useTasks();
  const notificationsState = useNotifications();

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(authState.user || null);
  const [permissions, setPermissions] = useState<string[]>(authState.permissions || []);
  const [authLoading, setAuthLoading] = useState(!authState.user);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const taskParam = params.get("task");
      const tabParam = params.get("tab");
      if (taskParam) {
        setSelectedTaskKey(taskParam);
      }
      if (tabParam) {
        dispatch(setReduxTab(tabParam));
      }
    }
  }, [dispatch]);

  // App Data (Ensure 'overview' or undefined cleanly normalizes to 'dashboard')
  const currentTab = !uiState.activeTab || uiState.activeTab === "overview" ? "dashboard" : uiState.activeTab;
  const setCurrentTab = (tab: string) => dispatch(setReduxTab(tab));

  const tasks = tasksState.items || [];
  const setTasks = (val: any) => {
    if (typeof val === "function") {
      const updated = val(tasksState.items);
      dispatch(setReduxTasks(updated));
    } else {
      dispatch(setReduxTasks(val));
    }
  };

  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  
  const notifications = notificationsState.items || [];
  const unreadCount = notificationsState.unreadCount || 0;

  // Modals & Panels
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null);
  const [selectedBugKey, setSelectedBugKey] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateBugOpen, setIsCreateBugOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState("TODO");
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDevMailboxOpen, setIsDevMailboxOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // 1. Fetch Workspace Data (Consolidated Bootstrap for 5x Performance)
  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/bootstrap");
      const json = await res.json();

      if (json.success && json.data) {
        const { user, permissions: perms, tasks: tList, projects: pList, users: uList, sprints: sList, notifications: nList } = json.data;
        if (user) {
          setCurrentUser(user);
          setPermissions(perms || []);
          dispatch(setCredentials({ user, token: "active-session", permissions: perms || [] }));
        }
        if (tList) dispatch(setReduxTasks(tList));
        if (pList) setProjects(pList);
        if (uList) setUsers(uList);
        if (sList) setSprints(sList);
        if (nList) dispatch(setReduxNotifications(nList));
        setAuthLoading(false);
        return;
      } else if (res.status === 401) {
        window.location.replace("/login");
        return;
      }
    } catch {
      // Fallback to individual endpoints if bootstrap encounters network error
      try {
        const [authRes, tasksRes, projectsRes, usersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/tasks"),
          fetch("/api/projects"),
          fetch("/api/users"),
        ]);
        const [authJson, tasksJson, projectsJson, usersJson] = await Promise.all([
          authRes.json(),
          tasksRes.json(),
          projectsRes.json(),
          usersRes.json(),
        ]);
        if (authJson.success && authJson.data?.user) {
          setCurrentUser(authJson.data.user);
          setPermissions(authJson.data.permissions || []);
        }
        if (tasksJson.success) dispatch(setReduxTasks(tasksJson.data));
        if (projectsJson.success) setProjects(projectsJson.data);
        if (usersJson.success) setUsers(usersJson.data);
      } catch (e) {
        console.error("Fallback load failed:", e);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

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
    dispatch(updateReduxTaskStatus({ id: taskKey, status: newStatus }));

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
    if (markAll) {
      dispatch(markReduxAllRead());
    } else if (id) {
      dispatch(markReduxRead(id));
    }
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network failure on logout
    }
    dispatch(reduxLogout());
    clearAllDXStorage();
    window.location.replace("/login");
  };

  if (!mounted || authLoading || !currentUser) {
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
        } else if (tab === "superadmin" || tab === "admin") {
          if (isSuperAdmin(currentUser?.role)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab("dashboard");
          }
        } else if (tab === "hradmin") {
          if (isHRAdmin(currentUser?.role)) {
            setCurrentTab(tab);
          } else {
            setCurrentTab("dashboard");
          }
        } else if (tab === "hrms") {
          if (isHRAdmin(currentUser?.role) || currentUser?.isHRMSActive) {
            setCurrentTab(tab);
          } else {
            setCurrentTab("dashboard");
          }
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
      {(currentTab === "dashboard" || currentTab === "overview" || !currentTab) && (
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

      {currentTab === "work-packages" && (
        <WorkPackagesView
          tasks={tasks}
          projects={projects}
          users={users}
          currentUser={currentUser}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onOpenCreateTask={(projId, defaultStatus) => {
            setCreateTaskProjectId(projId);
            setCreateTaskStatus(defaultStatus || "TODO");
            setIsCreateTaskOpen(true);
          }}
          onRefreshData={fetchAppData}
        />
      )}

      {currentTab === "my-work" && (
        <MyWorkView
          tasks={tasks}
          currentUser={currentUser}
          users={users}
          onSelectTask={(key) => setSelectedTaskKey(key)}
          onSelectBug={(key) => setSelectedBugKey(key)}
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
          onRefreshData={fetchAppData}
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
          onSelectTask={(key) => setSelectedTaskKey(key)}
        />
      )}

      {currentTab === "hrms" && (
        <HRMSView
          currentUser={currentUser}
        />
      )}

      {currentTab === "documents" && (
        <DocumentsView
          currentUser={currentUser}
          onRefreshData={fetchAppData}
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
                  if (n.bugId) {
                    setSelectedBugKey(n.bugId);
                  } else if (n.link) {
                    const matchBug = n.link.match(/bug=([^&]+)/);
                    if (matchBug && matchBug[1]) {
                      setSelectedBugKey(matchBug[1]);
                      return;
                    }
                    const match = n.link.match(/tasks\/([^?]+)/);
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
        onSelectBug={(key) => setSelectedBugKey(key)}
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
        currentUser={currentUser}
        defaultProjectId={createTaskProjectId}
        defaultStatus={createTaskStatus}
        onTaskCreated={() => fetchAppData()}
      />

      <RaiseBugModal
        isOpen={isCreateBugOpen}
        onClose={() => setIsCreateBugOpen(false)}
        projects={projects}
        users={users}
        currentUser={currentUser}
        onBugCreated={() => fetchAppData()}
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

      {selectedBugKey && (
        <BugDetailModal
          bugKey={selectedBugKey}
          isOpen={Boolean(selectedBugKey)}
          onClose={() => setSelectedBugKey(null)}
          onSelectTask={(key) => {
            setSelectedBugKey(null);
            setSelectedTaskKey(key);
          }}
          onBugUpdated={() => fetchAppData()}
          users={users}
          currentUser={currentUser}
        />
      )}
    </AppShell>
  );
}
