"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Layers,
  Building,
  Shield,
  Lock,
  Eye,
  Trash2,
  AlertCircle,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  Calendar,
  Sparkles,
  Download,
  Filter,
} from "lucide-react";
import { DocumentUploadModal } from "@/components/modals/DocumentUploadModal";
import { DocumentViewerModal } from "@/components/modals/DocumentViewerModal";
import { formatDate, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/permissions";

interface DocumentsViewProps {
  currentUser: any;
  onRefreshData?: () => void;
}

const DEPARTMENTS = [
  { id: "ALL_DEPTS", label: "All Departments" },
  { id: "ALL", label: "Company-Wide (General)" },
  { id: "FRONTEND", label: "Frontend" },
  { id: "UI_UX", label: "UI / UX Design" },
  { id: "BACKEND", label: "Backend & APIs" },
  { id: "MARKETING", label: "Marketing" },
];

export function DocumentsView({ currentUser, onRefreshData }: DocumentsViewProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("ALL_DEPTS");
  const [selectedPhase, setSelectedPhase] = useState("ALL_PHASES");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  const superAdmin = isSuperAdmin(currentUser);

  const fetchDocuments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let url = `/api/documents?`;
      if (selectedDept !== "ALL_DEPTS") url += `department=${selectedDept}&`;
      if (selectedPhase !== "ALL_PHASES") url += `phase=${selectedPhase}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents || []);
        setPhases(json.data.phases || []);
      } else {
        setErrorMsg(json.error?.message || "Failed to load documents");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedDept, selectedPhase, searchQuery]);

  const handleDelete = async (docId: string, docTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to permanently delete "${docTitle}" from the vault?`)) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchDocuments();
      } else {
        alert(json.error?.message || "Failed to delete document");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for file format icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
      return <FileImage className="w-5 h-5 text-pink-400" />;
    }
    if (["js", "ts", "tsx", "py", "json", "html", "css", "sql"].includes(ext)) {
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
    if (["xlsx", "xls", "csv"].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    if (["zip", "tar", "gz", "rar"].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    }
    return <FileText className="w-5 h-5 text-[#FF6200]" />;
  };

  // Distinct phase list
  const availablePhaseNumbers = Array.from(
    new Set([1, 2, 3, 4, 5, 6, 7, ...phases.map((p) => p.phaseNumber)])
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-lg shadow-[#FF6200]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Organization Document Vault</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  Anti-Copy Protected
                </span>
              </h1>
              <p className="text-xs text-[#888898] mt-0.5">
                Phase-wise milestone documentation & department-scoped knowledge repository
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* User Department Indicator */}
          <div className="px-3 py-1.5 rounded-xl bg-[#141414] border border-[#2E2E2E] flex items-center gap-2 text-xs">
            <Building className="w-3.5 h-3.5 text-[#FF6200]" />
            <span className="text-[#888898]">Your Department:</span>
            <span className="font-bold text-white font-mono">
              {superAdmin ? "ALL (Super Admin)" : currentUser?.department || "General"}
            </span>
          </div>

          {/* Super Admin Upload Button */}
          {superAdmin && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#FF6200]/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#888898] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by title, phase, file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]"
            />
          </div>

          {/* Department Filter (Only for Super Admin; for members it defaults to their department) */}
          {superAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888898] flex items-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5" />
                <span>Department:</span>
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#FF6200]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Phase Filter Pills (Phase 1, 2, 3, 4, 5, 6, 7...) */}
        <div className="pt-2 border-t border-[#2E2E2E]/60 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-mono uppercase text-[#888898] flex-shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#FF8C42]" />
            <span>Phases:</span>
          </span>

          <button
            onClick={() => setSelectedPhase("ALL_PHASES")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              selectedPhase === "ALL_PHASES"
                ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20"
                : "bg-[#1A1A1A] text-[#888898] hover:text-white border border-[#2E2E2E]"
            }`}
          >
            All Phases
          </button>

          {availablePhaseNumbers.map((num) => {
            const count = documents.filter((d) => d.phaseNumber === num).length;
            return (
              <button
                key={num}
                onClick={() => setSelectedPhase(num.toString())}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  selectedPhase === num.toString()
                    ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20"
                    : "bg-[#1A1A1A] text-[#888898] hover:text-white border border-[#2E2E2E]"
                }`}
              >
                <span>Phase {num}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#888898]">Loading organization document vault...</div>
      ) : documents.length === 0 ? (
        <div className="p-16 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6200]/10 border border-[#FF6200]/30 text-[#FF6200] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Documents Found</h3>
            <p className="text-xs text-[#888898] max-w-md mx-auto">
              {superAdmin
                ? "No documents uploaded yet for this department or phase. Click '+ Upload Document' above to add files."
                : "No documents available for your department in this phase yet."}
            </p>
          </div>
          {superAdmin && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF6200] text-white text-xs font-bold hover:bg-[#FF8C42] transition-colors"
            >
              + Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => {
            return (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/50 hover:shadow-[0_0_25px_rgba(255,98,0,0.12)] transition-all cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200]">
                        Phase {doc.phaseNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                        {doc.department}
                      </span>
                    </div>

                    {superAdmin && (
                      <button
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="p-1.5 rounded-lg text-[#888898] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Document (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & File Icon */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] group-hover:border-[#FF6200]/40 transition-colors flex-shrink-0">
                      {getFileIcon(doc.fileName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-white group-hover:text-[#FF8C42] transition-colors line-clamp-2">
                        {doc.title}
                      </h3>
                      {doc.phaseName && (
                        <span className="text-[11px] text-[#888898] block mt-0.5 truncate">{doc.phaseName}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 bg-[#1A1A1A]/60 p-2.5 rounded-xl border border-[#2E2E2E]/60 leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>

                {/* Bottom Metadata & Secure Action */}
                <div className="pt-3 border-t border-[#2E2E2E]/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#888898]">
                    <span className="font-mono">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                    <div className="flex items-center gap-1.5">
                      {doc.uploadedBy?.avatarUrl ? (
                        <img src={doc.uploadedBy.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${getAvatarGradient(doc.uploadedBy?.name)} text-[7px] font-bold text-white flex items-center justify-center uppercase`}>
                          {getInitials(doc.uploadedBy?.name)}
                        </div>
                      )}
                      <span>{doc.uploadedBy?.name || "Super Admin"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>In-Portal Protected</span>
                    </span>

                    <button className="text-xs text-[#FF8C42] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={fetchDocuments}
        />
      )}

      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
