"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HRMSShell } from "@/components/layout/HRMSShell";
import { HRMSView } from "@/components/views/HRMSView";
import { HRAdminView } from "@/components/views/HRAdminView";
import { isHRAdmin, isSuperAdmin } from "@/lib/permissions";
import { Clock } from "lucide-react";

function HRMSDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const [currentTab, setCurrentTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync tab with URL search params
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== currentTab) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setCurrentUser(json.data.user);
        } else {
          router.replace("/hrms/login");
        }
      })
      .catch(() => router.replace("/hrms/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    // Smooth URL update without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  if (loading || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Opening HRMS Portal...</span>
        </div>
      </div>
    );
  }

  const isHR = isHRAdmin(currentUser.role) || isSuperAdmin(currentUser.role);

  return (
    <HRMSShell
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      currentUser={currentUser}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.replace("/hrms/login");
      }}
    >
      {currentTab === "hradmin" && isHR ? (
        <HRAdminView currentUser={currentUser} />
      ) : (
        <HRMSView
          currentUser={currentUser}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
        />
      )}
    </HRMSShell>
  );
}

export default function HRMSDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#0D0D0D] text-white text-xs">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading HRMS Portal...</span>
          </div>
        </div>
      }
    >
      <HRMSDashboardContent />
    </Suspense>
  );
}
