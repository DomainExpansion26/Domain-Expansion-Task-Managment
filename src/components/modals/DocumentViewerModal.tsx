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
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code,
  FileCode,
  FileSpreadsheet,
  FileImage,
  Loader2,
} from "lucide-react";
import { formatDate, formatDateTime, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

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
  const canManage = superAdmin || isManager(currentUser?.role || currentUser) || isTeamLead(currentUser?.role || currentUser);

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
        setWarningMessage("🔒 Content is protected under enterprise document security policies.");
        setTimeout(() => setWarningMessage(""), 3000);
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const watermarkText = `${currentUser?.email || "team"} • INTERNAL ONLY • ${new Date().toLocaleDateString()}`;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setWarningMessage("🔒 Right-click context menu is disabled on confidential documents.");
        setTimeout(() => setWarningMessage(""), 3000);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-slate-900/40 backdrop-blur-md animate-fade-in select-none overflow-y-auto"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
      }}
    >
      <div
        className={`relative bg-slate-50 border border-slate-200 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 my-auto ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-5xl h-[88vh] max-h-[850px]"
        }`}
      >
        {/* Security Warning Toast */}
        {warningMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-[#18181B] z-20 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200] flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[280px] sm:max-w-md">
                  {document.title}
                </h2>
                {document.phaseNumber && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200] flex-shrink-0">
                    Phase {document.phaseNumber}
                  </span>
                )}
                {document.department && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                    {document.department}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB
                {document.phaseName && ` &bull; ${document.phaseName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Zoom Controls for Images */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-[#252528] border border-slate-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-white px-1 font-bold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Read-Only Badge */}
            {!superAdmin && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <Shield className="w-3 h-3" />
                <span>Protected</span>
              </span>
            )}

            {/* Management & Admin Download Option */}
            {canManage && (
              <a
                href={document.fileUrl}
                download={document.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#252528] hover:bg-slate-100 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                title="Download Document"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6200]" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#252528] transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="relative flex-1 w-full min-h-0 bg-[#09090B] overflow-hidden flex flex-col">
          {/* Subtle Security Watermark Header */}
          <div className="px-4 py-1.5 bg-white border-b border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 select-none">
            <span className="truncate">🔒 CONFIDENTIAL &bull; {watermarkText}</span>
            <span className="hidden sm:inline uppercase text-slate-500">Domain Expansion Vault</span>
          </div>

          {/* Document Content Frame */}
          <div className="relative flex-1 w-full min-h-0 overflow-hidden flex flex-col p-3 sm:p-5">
            {/* 1. Image Viewer */}
            {isImage && (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  draggable={false}
                  style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
                  className="max-w-full max-h-[72vh] object-contain rounded-xl border border-slate-200 shadow-2xl pointer-events-none"
                />
              </div>
            )}

            {/* 2. PDF Viewer */}
            {isPDF && (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-2xl">
                <iframe
                  src={`${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={document.title}
                  className="w-full h-full bg-white rounded-2xl border-none"
                />
              </div>
            )}

            {/* 3. Text / Markdown / Code / JSON Viewer */}
            {isTextOrCode && (
              <div className="w-full h-full flex flex-col rounded-2xl border border-slate-200 bg-[#111114] overflow-hidden shadow-2xl">
                {/* Code Top Header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
                  <div className="flex items-center gap-2 font-mono truncate">
                    <Code className="w-4 h-4 text-[#FF6200]" />
                    <span className="text-white font-bold truncate">{document.fileName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#252528] uppercase text-[#FF8C42] flex-shrink-0">
                      {fileExt}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono text-slate-500">
                      {textContent ? `${textContent.split("\n").length} lines` : "Loading..."}
                    </span>
                  </div>
                </div>

                {/* Content Stream */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed text-slate-200 bg-[#0A0A0D]">
                  {loadingContent ? (
                    <div className="h-full flex items-center justify-center gap-2 text-slate-500 py-16">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF6200]" />
                      <span>Reading secure document stream...</span>
                    </div>
                  ) : contentError ? (
                    <div className="p-6 text-center text-amber-400 space-y-2">
                      <AlertTriangle className="w-6 h-6 mx-auto" />
                      <p>{contentError}</p>
                      <p className="text-xs text-slate-500">{document.description}</p>
                    </div>
                  ) : textContent !== null ? (
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs sm:text-sm text-slate-200 leading-relaxed select-text">
                      {textContent}
                    </pre>
                  ) : (
                    <div className="p-8 text-center text-slate-500">No text content available.</div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Other Binary / Generic Files */}
            {!isImage && !isPDF && !isTextOrCode && (
              <div className="max-w-xl w-full m-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-5 text-center shadow-2xl">
                <div className="p-4 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] w-16 h-16 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{document.title}</h3>
                  <p className="text-xs text-slate-500">
                    {document.fileName} &bull; {(document.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>

                {document.description && (
                  <div className="text-left bg-[#1A1A1E] p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Description & Notes:</span>
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
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs text-slate-500 z-20 gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF8C42]" />
              <span className="text-white font-medium">{document.phaseName || `Phase ${document.phaseNumber}`}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-medium">{document.department}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
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
              <span className="truncate max-w-[150px]">Uploaded by {document.uploadedBy?.name || "Super Admin"}</span>
            </div>
            <span>&bull;</span>
            <span>{formatDate(document.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
