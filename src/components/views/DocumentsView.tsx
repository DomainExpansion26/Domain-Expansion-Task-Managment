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
  ChevronRight,
  Folder,
  FolderPlus,
  Tag,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Archive,
  BookOpen,
  ArrowLeft,
  X,
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
  { id: "DEVELOPMENT", label: "Development & Engineering" },
  { id: "UI_UX", label: "UI / UX Design" },
  { id: "QA", label: "QA & Testing" },
  { id: "MARKETING", label: "Marketing & Growth" },
  { id: "HR", label: "Human Resources" },
  { id: "FINANCE", label: "Finance & Legal" },
  { id: "OPERATIONS", label: "Business Operations" },
];

export function DocumentsView({ currentUser, onRefreshData }: DocumentsViewProps) {
  const superAdmin = isSuperAdmin(currentUser);

  // Determine user's native department
  const getUserDefaultDept = () => {
    if (superAdmin) return "ALL_DEPTS";
    const dept = (currentUser?.department || currentUser?.jobTitle || "").toUpperCase();
    if (dept.includes("FRONTEND") || dept.includes("BACKEND") || dept.includes("DEV") || dept.includes("ENGINEER")) return "DEVELOPMENT";
    if (dept.includes("UI") || dept.includes("UX") || dept.includes("DESIGN")) return "UI_UX";
    if (dept.includes("QA") || dept.includes("TEST")) return "QA";
    if (dept.includes("MARKET")) return "MARKETING";
    return "DEVELOPMENT";
  };

  // State
  const [documents, setDocuments] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>(getUserDefaultDept());
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL_CATEGORIES");
  const [selectedPhase, setSelectedPhase] = useState<string>("ALL_PHASES");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL_STATUSES");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & View States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  // New Category / Phase creation modal states (Super Admin only)
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDept, setNewCatDept] = useState("DEVELOPMENT");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [isNewPhaseModalOpen, setIsNewPhaseModalOpen] = useState(false);
  const [newPhaseDept, setNewPhaseDept] = useState("DEVELOPMENT");
  const [newPhaseCategory, setNewPhaseCategory] = useState("Backend");
  const [newPhaseNum, setNewPhaseNum] = useState(1);
  const [newPhaseTitle, setNewPhaseTitle] = useState("");

  // Fetch Documents
  const fetchDocuments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let url = `/api/documents?`;
      if (selectedDept !== "ALL_DEPTS") url += `department=${selectedDept}&`;
      if (selectedCategory !== "ALL_CATEGORIES") url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedPhase !== "ALL_PHASES") url += `phase=${selectedPhase}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (superAdmin && statusFilter !== "ALL_STATUSES") url += `status=${statusFilter}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents || []);
        setPhases(json.data.phases || []);
        setCategories(json.data.categories || []);
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
  }, [selectedDept, selectedCategory, selectedPhase, searchQuery, statusFilter]);

  // Handle Delete Document
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

  // Handle Create Category (Super Admin)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatDept) return;
    try {
      const res = await fetch("/api/documents/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, department: newCatDept, description: newCatDesc }),
      });
      const json = await res.json();
      if (json.success) {
        setIsNewCategoryModalOpen(false);
        setNewCatName("");
        setNewCatDesc("");
        fetchDocuments();
      } else {
        alert(json.error?.message || "Failed to create category");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create Phase (Super Admin)
  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseDept || !newPhaseNum || !newPhaseTitle.trim()) return;
    try {
      const res = await fetch("/api/documents/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: newPhaseDept,
          category: newPhaseCategory,
          phaseNumber: newPhaseNum,
          phaseName: newPhaseTitle,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsNewPhaseModalOpen(false);
        setNewPhaseTitle("");
        fetchDocuments();
      } else {
        alert(json.error?.message || "Failed to create phase");
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
    if (["js", "ts", "tsx", "py", "json", "html", "css", "sql", "sh"].includes(ext)) {
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

  // Unique categories in the current view
  const visibleCategories = Array.from(
    new Set(
      categories
        .filter((c) => selectedDept === "ALL_DEPTS" || c.department === selectedDept || c.department === "ALL")
        .map((c) => c.name)
    )
  );

  // Group documents by phase if inside a specific category
  const phasesInCurrentCategory = Array.from(
    new Set(
      documents
        .filter((d) => selectedCategory === "ALL_CATEGORIES" || d.category === selectedCategory)
        .map((d) => d.phaseNumber)
    )
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12 text-gray-900 dark:text-[#F3F4F6]">
      {/* Top Header & Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-orange-50/60 via-white to-orange-50/40 dark:from-[#141414] dark:to-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-lg shadow-[#FF6200]/25 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Company Documentation Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF6200] dark:text-[#FF8C42] border border-[#FF6200]/30 font-mono text-[10px] font-bold uppercase">
                {superAdmin ? "Super Admin Control" : `${currentUser?.department || "Team"} Access`}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-[#888898] mt-0.5">
              Official technical specifications, architecture blueprints, UI/UX guidelines, QA standards, and team milestone phases
            </p>
          </div>
        </div>

        {/* Super Admin Actions */}
        {superAdmin && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-[#ACACB8] hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>+ Category</span>
            </button>

            <button
              onClick={() => setIsNewPhaseModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-[#ACACB8] hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>+ Phase</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#FF6200]/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-xs text-[#888898] overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setSelectedDept(superAdmin ? "ALL_DEPTS" : getUserDefaultDept());
            setSelectedCategory("ALL_CATEGORIES");
            setSelectedPhase("ALL_PHASES");
          }}
          className="hover:text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
        >
          <Building className="w-3.5 h-3.5 text-[#FF6200]" />
          <span>Documentation</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-[#444] flex-shrink-0" />

        <button
          onClick={() => {
            setSelectedCategory("ALL_CATEGORIES");
            setSelectedPhase("ALL_PHASES");
          }}
          className={`font-semibold transition-colors cursor-pointer flex-shrink-0 ${
            selectedCategory === "ALL_CATEGORIES" ? "text-white" : "hover:text-white"
          }`}
        >
          {selectedDept === "ALL_DEPTS" ? "All Departments" : selectedDept}
        </button>

        {selectedCategory !== "ALL_CATEGORIES" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#444] flex-shrink-0" />
            <button
              onClick={() => setSelectedPhase("ALL_PHASES")}
              className={`font-semibold transition-colors cursor-pointer flex-shrink-0 ${
                selectedPhase === "ALL_PHASES" ? "text-[#FF8C42]" : "hover:text-white"
              }`}
            >
              {selectedCategory}
            </button>
          </>
        )}

        {selectedPhase !== "ALL_PHASES" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#444] flex-shrink-0" />
            <span className="text-emerald-400 font-bold font-mono flex-shrink-0">
              Phase {selectedPhase}
            </span>
          </>
        )}
      </div>

      {/* Department Tabs (for Super Admin or multi-dept access) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-x-auto no-scrollbar">
        {DEPARTMENTS.filter((d) => superAdmin || d.id === "ALL" || d.id === getUserDefaultDept()).map((dept) => (
          <button
            key={dept.id}
            onClick={() => {
              setSelectedDept(dept.id);
              setSelectedCategory("ALL_CATEGORIES");
              setSelectedPhase("ALL_PHASES");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDept === dept.id
                ? "bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/20"
                : "text-[#ACACB8] hover:text-white hover:bg-[#1A1A1A]"
            }`}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#141414] border border-[#2E2E2E]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888898] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documentation by title, description, category, phase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#FF6200]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedPhase("ALL_PHASES");
            }}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL_CATEGORIES">All Teams & Categories</option>
            {visibleCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Phase Filter */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
          >
            <option value="ALL_PHASES">All Phases</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={(i + 1).toString()}>
                Phase {i + 1}
              </option>
            ))}
          </select>

          {/* Status Filter (Super Admin Only) */}
          {superAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-xs text-[#FF8C42] font-semibold focus:outline-none"
            >
              <option value="ALL_STATUSES">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          )}
        </div>
      </div>

      {/* Category Summary Cards (when at root of department) */}
      {selectedCategory === "ALL_CATEGORIES" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#FF6200]" />
            <span>Teams & Categories ({visibleCategories.length})</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleCategories.map((cat) => {
              const catDocs = documents.filter((d) => d.category === cat);
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="p-4 rounded-2xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-[#FF6200]/10 text-[#FF8C42] border border-[#FF6200]/20 group-hover:bg-[#FF6200] group-hover:text-white transition-colors">
                      <Folder className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-[#888898]">
                      {catDocs.length} Docs
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs group-hover:text-[#FF8C42] transition-colors">
                      {cat}
                    </h4>
                    <p className="text-[10px] text-[#888898] line-clamp-1 mt-0.5">
                      Explore {cat} phase specifications
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase Cards View (when category is selected) */}
      {selectedCategory !== "ALL_CATEGORIES" && selectedPhase === "ALL_PHASES" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF6200]" />
              <span>{selectedCategory} — Phase Milestones</span>
            </h3>
            <button
              onClick={() => setSelectedCategory("ALL_CATEGORIES")}
              className="text-[11px] text-[#FF8C42] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to all categories</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {phasesInCurrentCategory.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#2E2E2E] text-center text-xs text-[#888898] col-span-full">
                No phase documents uploaded yet for {selectedCategory}.
              </div>
            ) : (
              phasesInCurrentCategory.map((phNum) => {
                const phaseDocs = documents.filter(
                  (d) => (d.category === selectedCategory || selectedCategory === "ALL_CATEGORIES") && d.phaseNumber === phNum
                );
                return (
                  <div
                    key={phNum}
                    className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Phase {phNum}
                        </span>
                        <span className="text-xs font-mono text-[#888898]">{phaseDocs.length} Document(s)</span>
                      </div>

                      <h4 className="font-bold text-white text-sm mt-2">
                        {phaseDocs[0]?.phaseName || `Phase ${phNum}: Milestone Specifications`}
                      </h4>
                    </div>

                    <button
                      onClick={() => setSelectedPhase(phNum.toString())}
                      className="w-full py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#FF6200] text-[#ACACB8] hover:text-white text-xs font-bold border border-[#2E2E2E] transition-all cursor-pointer"
                    >
                      View Phase {phNum} Documents &rarr;
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Documents Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF6200]" />
            <span>Documents Vault ({documents.length})</span>
          </h3>
          <span className="text-[10px] text-[#888898] font-mono">
            {superAdmin ? "Super Admin Full Access" : "Read-Only Protected"}
          </span>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-[#888898]">Loading company documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#141414] border border-[#2E2E2E] text-center space-y-3">
            <FileText className="w-10 h-10 text-[#666] mx-auto" />
            <div className="font-bold text-white text-sm">No documentation available</div>
            <p className="text-xs text-[#888898] max-w-sm mx-auto">
              There are currently no documents matching your selected filters or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="p-5 rounded-3xl bg-[#141414] border border-[#2E2E2E] hover:border-[#FF6200]/40 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex-shrink-0">
                      {getFileIcon(doc.fileName)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="px-2 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 text-[10px] font-mono font-bold">
                        v{doc.version || "1.0"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        Phase {doc.phaseNumber}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-[#FF8C42] transition-colors line-clamp-2">
                      {doc.title}
                    </h4>
                    {doc.description && (
                      <p className="text-xs text-[#888898] line-clamp-2 mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#2E2E2E]/60 text-[11px]">
                  <div className="flex items-center justify-between text-[#888898]">
                    <span>{doc.category || "General"}</span>
                    <span className="font-mono">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDoc(doc);
                      }}
                      className="flex items-center gap-1 text-xs text-[#FF8C42] font-semibold hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Document</span>
                    </button>

                    {superAdmin && (
                      <button
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="p-1.5 rounded-lg text-[#666] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={fetchDocuments}
          initialDepartment={selectedDept === "ALL_DEPTS" ? "DEVELOPMENT" : selectedDept}
          initialCategory={selectedCategory === "ALL_CATEGORIES" ? "General" : selectedCategory}
          initialPhase={selectedPhase === "ALL_PHASES" ? 1 : parseInt(selectedPhase) || 1}
        />
      )}

      {/* In-Browser Document Viewer Modal (No download button for regular members) */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={Boolean(viewingDoc)}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          currentUser={currentUser}
        />
      )}

      {/* New Category Modal (Super Admin Only) */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-[#F3F4F6]">
          <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
              <h3 className="text-sm font-bold text-white">Create Documentation Category / Team</h3>
              <button onClick={() => setIsNewCategoryModalOpen(false)} className="text-[#888898] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                <select
                  value={newCatDept}
                  onChange={(e) => setNewCatDept(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {DEPARTMENTS.filter((d) => d.id !== "ALL_DEPTS").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Category / Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microservices, AI Copilot, Store Deployment"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of category documentation..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Phase Modal (Super Admin Only - Unbounded Phases) */}
      {isNewPhaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-[#F3F4F6]">
          <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
              <h3 className="text-sm font-bold text-white">Create Documentation Phase Milestone</h3>
              <button onClick={() => setIsNewPhaseModalOpen(false)} className="text-[#888898] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Department</label>
                <select
                  value={newPhaseDept}
                  onChange={(e) => setNewPhaseDept(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {DEPARTMENTS.filter((d) => d.id !== "ALL_DEPTS").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Phase Number (Unbounded)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newPhaseNum}
                  onChange={(e) => setNewPhaseNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Phase Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 7: Real-Time WebSockets & Scalability"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPhaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold"
                >
                  Create Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
