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
  Calendar,
  Eye,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const superAdmin = isSuperAdmin(currentUser?.role || currentUser);

  const fileExt = document?.fileName?.split(".").pop()?.toLowerCase() || "";
  const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp"].includes(fileExt);
  const isPDF = fileExt === "pdf";
  const isTextOrCode = [
    "txt",
    "md",
    "markdown",
    "json",
    "js",
    "ts",
    "tsx",
    "jsx",
    "py",
    "sql",
    "html",
    "css",
    "scss",
    "yaml",
    "yml",
    "csv",
    "env",
    "log",
    "xml",
    "sh",
  ].includes(fileExt);

  // Fetch readable text content for text/code/json/markdown documents
  useEffect(() => {
    if (!isOpen || !document || !document.fileUrl) {
      setTextContent(null);
      return;
    }

    if (isTextOrCode) {
      setLoadingContent(true);
      setContentError(null);
      fetch(document.fileUrl)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          const text = await res.text();
          setTextContent(text);
        })
        .catch((err) => {
          console.error("Failed to load text content:", err);
          setContentError("Unable to fetch readable document stream directly. Displaying metadata view.");
        })
        .finally(() => {
          setLoadingContent(false);
        });
    } else {
      setTextContent(null);
    }
  }, [isOpen, document?.id, document?.fileUrl, isTextOrCode]);

  // Content Protection: Prevent Keyboard Copying, Inspect, Print, Save shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+X, Ctrl+S, Ctrl+P, Ctrl+U, F12, DevTools
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

      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          (e.key === "I" ||
            e.key === "i" ||
            e.key === "J" ||
            e.key === "j" ||
            e.key === "C" ||
            e.key === "c"))
      ) {
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
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-6xl h-[90vh]"
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200]">
                  Phase {document.phaseNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  {document.department}
                </span>
              </div>
              <p className="text-[11px] text-[#888898] truncate">
                {document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB
                {document.phaseName && ` &bull; ${document.phaseName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom Controls for Images */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-[#252525] border border-[#2E2E2E] rounded-xl p-1">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#333] transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-white px-1 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                  className="p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#333] transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg text-[#888898] hover:text-white hover:bg-[#333] transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Read-Only Badge for Team Members */}
            {!superAdmin && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <Shield className="w-3.5 h-3.5" />
                <span>Read-Only Protected</span>
              </span>
            )}

            {/* Super Admin Download Option */}
            {superAdmin && (
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
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors cursor-pointer"
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
              <div
                key={idx}
                className="p-8 text-[11px] font-mono font-black text-slate-300 tracking-widest uppercase whitespace-nowrap"
              >
                {watermarkText}
              </div>
            ))}
          </div>

          {/* Document Content Frame */}
          <div className="relative w-full h-full flex items-center justify-center p-4 overflow-auto z-0 select-none">
            {/* 1. Image Viewer */}
            {isImage && (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  draggable={false}
                  style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-[#2E2E2E] shadow-2xl pointer-events-none"
                />
              </div>
            )}

            {/* 2. PDF Viewer */}
            {isPDF && (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-[#2E2E2E] bg-[#1A1A1A] shadow-2xl">
                <iframe
                  src={`${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={document.title}
                  className="w-full h-full bg-white rounded-2xl"
                />
              </div>
            )}

            {/* 3. Text / Markdown / Code / JSON Viewer */}
            {isTextOrCode && (
              <div className="w-full h-full max-w-5xl flex flex-col rounded-2xl border border-[#2E2E2E] bg-[#111111] overflow-hidden shadow-2xl">
                {/* Code Top Header */}
                <div className="px-4 py-2.5 bg-[#181818] border-b border-[#2E2E2E] flex items-center justify-between text-xs text-[#888898]">
                  <div className="flex items-center gap-2 font-mono">
                    <Code className="w-4 h-4 text-[#FF6200]" />
                    <span className="text-white font-bold">{document.fileName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252525] uppercase text-[#FF8C42]">
                      {fileExt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono">
                      {textContent ? `${textContent.split("\n").length} lines` : "Loading..."}
                    </span>
                  </div>
                </div>

                {/* Content Stream */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 bg-[#0E0E0E]">
                  {loadingContent ? (
                    <div className="h-full flex items-center justify-center gap-2 text-[#888898]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF6200]" />
                      <span>Reading secure document stream...</span>
                    </div>
                  ) : contentError ? (
                    <div className="p-6 text-center text-amber-400 space-y-2">
                      <AlertTriangle className="w-6 h-6 mx-auto" />
                      <p>{contentError}</p>
                      <p className="text-xs text-[#888898]">{document.description}</p>
                    </div>
                  ) : textContent !== null ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-200">
                      {textContent}
                    </pre>
                  ) : (
                    <div className="p-8 text-center text-[#888898]">No text content available.</div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Other Binary / Generic Files */}
            {!isImage && !isPDF && !isTextOrCode && (
              <div className="max-w-xl w-full p-8 rounded-3xl bg-[#141414] border border-[#2E2E2E] space-y-5 text-center shadow-2xl">
                <div className="p-4 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] w-16 h-16 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{document.title}</h3>
                  <p className="text-xs text-[#888898]">
                    {document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>

                {document.description && (
                  <div className="text-left bg-[#1A1A1A] p-4 rounded-2xl border border-[#2E2E2E] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#888898] block">Description & Notes:</span>
                    <p className="text-xs text-slate-200 leading-relaxed">{document.description}</p>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">Confidential Organization Document (Read-Only)</span>
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
                <div
                  className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    document.uploadedBy?.name
                  )} text-[7px] font-bold text-white flex items-center justify-center uppercase`}
                >
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
