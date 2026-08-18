"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  FileText,
  Lock,
  Download,
  AlertTriangle,
  Layers,
  Building,
  User,
  Calendar,
  Eye,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { formatDate, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/permissions";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any | null;
  currentUser: any;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  currentUser,
}: DocumentViewerModalProps) {
  const [warningMessage, setWarningMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Content Protection: Prevent Keyboard Copying, Inspect, Print, Save shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+X, Ctrl+S, Ctrl+P, Ctrl+U, F12
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" ||
          e.key === "C" ||
          e.key === "x" ||
          e.key === "X" ||
          e.key === "s" ||
          e.key === "S" ||
          e.key === "p" ||
          e.key === "P" ||
          e.key === "u" ||
          e.key === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("🔒 Content Protected: Copying, saving, and printing are disabled by organization policy.");
        setTimeout(() => setWarningMessage(""), 3500);
      }

      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c"))) {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("🔒 Developer Inspection is disabled for protected vault documents.");
        setTimeout(() => setWarningMessage(""), 3500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !document) return null;

  const superAdmin = isSuperAdmin(currentUser);
  const fileExt = document.fileName?.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(fileExt);
  const isPDF = fileExt === "pdf";
  const isCodeOrText = ["txt", "md", "json", "js", "ts", "tsx", "py", "sql", "html", "css", "yaml", "yml"].includes(fileExt);

  const watermarkText = `${currentUser?.email || "team"} • ${currentUser?.name || "Confidential"} • INTERNAL ONLY • ${new Date().toLocaleDateString()}`;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("🔒 Right-click context menu is disabled on confidential documents.");
        setTimeout(() => setWarningMessage(""), 3000);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div
        className={`relative bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[88vh]"
        }`}
      >
        {/* Security Warning Toast */}
        {warningMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-500/90 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A] z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200] flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white truncate">{document.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#252525] border border-[#2E2E2E] text-[#FF8C42]">
                  Phase {document.phaseNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  {document.department}
                </span>
              </div>
              <p className="text-[11px] text-[#888898] truncate">{document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Super Admin Download Option */}
            {superAdmin ? (
              <a
                href={document.fileUrl}
                download={document.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#333] text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                title="Super Admin Download"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6200]" />
                <span className="hidden sm:inline">Download</span>
              </a>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <Shield className="w-3 h-3" />
                <span>Read-Only Protection</span>
              </span>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas with Repeating Diagonal Watermark */}
        <div className="relative flex-1 bg-[#0A0A0A] overflow-hidden flex flex-col justify-center items-center">
          {/* Security Repeating Watermark Grid */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-15 overflow-hidden flex flex-wrap items-center justify-around select-none"
            style={{ transform: "rotate(-25deg) scale(1.3)" }}
          >
            {Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="p-8 text-[11px] font-mono font-black text-slate-300 tracking-widest uppercase whitespace-nowrap">
                {watermarkText}
              </div>
            ))}
          </div>

          {/* Document Content Frame */}
          <div className="relative w-full h-full flex items-center justify-center p-4 overflow-auto z-0 select-none">
            {isImage && (
              <div className="max-w-full max-h-full flex items-center justify-center">
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  draggable={false}
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-[#2E2E2E] shadow-2xl pointer-events-none"
                />
              </div>
            )}

            {isPDF && (
              <iframe
                src={`${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                title={document.title}
                className="w-full h-full rounded-2xl border border-[#2E2E2E] bg-white shadow-2xl"
              />
            )}

            {!isImage && !isPDF && (
              <div className="max-w-xl w-full p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-5 text-center shadow-2xl">
                <div className="p-4 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] w-16 h-16 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{document.title}</h3>
                  <p className="text-xs text-[#888898]">{document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB</p>
                </div>

                {document.description && (
                  <p className="text-xs text-slate-300 italic bg-[#1A1A1A] p-4 rounded-xl border border-[#2E2E2E] text-left">
                    &ldquo;{document.description}&rdquo;
                  </p>
                )}

                <div className="pt-2 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Secure Document Verification Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Metadata Bar */}
        <div className="px-6 py-3 border-t border-[#2E2E2E] bg-[#141414] flex flex-wrap items-center justify-between text-xs text-[#888898] z-20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF8C42]" />
              <span className="text-white font-medium">{document.phaseName || `Phase ${document.phaseNumber}`}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-medium">{document.department}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {document.uploadedBy?.avatarUrl ? (
                <img src={document.uploadedBy.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(document.uploadedBy?.name)} text-[7px] font-bold text-white flex items-center justify-center uppercase`}>
                  {getInitials(document.uploadedBy?.name)}
                </div>
              )}
              <span>Uploaded by {document.uploadedBy?.name || "Super Admin"}</span>
            </div>
            <span>&bull;</span>
            <span>{formatDate(document.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
