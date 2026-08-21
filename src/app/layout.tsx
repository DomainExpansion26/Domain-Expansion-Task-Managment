import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Expansion | Team Project & Task Management Platform",
  description:
    "Production-ready Jira-inspired internal team management platform for Domain Expansion. Assign tasks, track sprints, Kanban boards, notifications, and AI assistance.",
  keywords: ["Jira", "Task Management", "Domain Expansion", "Kanban", "Sprints", "AI Assistant"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D0D0D",
};

import { StoreProvider } from "@/store/StoreProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] antialiased selection:bg-[#FF6200] selection:text-white">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
