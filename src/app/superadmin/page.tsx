"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SuperAdminView } from "@/components/views/SuperAdminView";
import { isSuperAdmin } from "@/lib/permissions";

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && isSuperAdmin(json.data.user?.role)) {
          setCurrentUser(json.data.user);
        } else {
          router.push("/?error=FORBIDDEN");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Super Admin Authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      currentTab="superadmin"
      onSelectTab={(tab) => {
        if (tab !== "superadmin") router.push(`/?tab=${tab}`);
      }}
      currentUser={currentUser}
      unreadCount={0}
      onOpenCreateTask={() => router.push("/?create=true")}
      onOpenSearch={() => {}}
      onOpenNotifications={() => {}}
      onOpenDevMailbox={() => {}}
      onToggleAI={() => {}}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
      }}
    >
      <SuperAdminView currentUser={currentUser} />
    </AppShell>
  );
}
