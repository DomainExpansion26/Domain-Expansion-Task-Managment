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
  Palette,
  Code2,
  CheckSquare,
  Megaphone,
  Users,
  Briefcase,
} from "lucide-react";
import { DocumentUploadModal } from "@/components/modals/DocumentUploadModal";
import { DocumentViewerModal } from "@/components/modals/DocumentViewerModal";
import { formatDate, getInitials, getAvatarGradient } from "@/lib/utils";
import { isSuperAdmin, isManager, isTeamLead } from "@/lib/permissions";

interface DocumentsViewProps {
  currentUser: any;
  onRefreshData?: () => void;
}

const DEPARTMENTS = [
  { id: "ALL_DEPTS", label: "All Departments" },
  { id: "UI_UX", label: "UI / UX Design" },
  { id: "DEVELOPMENT", label: "Development & Engineering" },
  { id: "QA", label: "QA & Testing" },
  { id: "MARKETING", label: "Marketing & Growth" },
  { id: "ALL", label: "Company-Wide (General)" },
  { id: "HR", label: "Human Resources" },
  { id: "FINANCE", label: "Finance & Legal" },
  { id: "OPERATIONS", label: "Business Operations" },
];

const DEPARTMENT_SECTIONS = [
  {
    id: "UI_UX",
    label: "UI / UX Design",
    badge: "Figma & Design Systems",
    icon: Palette,
    accentBorder: "border-pink-500/30 hover:border-pink-500/60",
    badgeColor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    iconBg: "bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-slate-900",
    defaultCategories: ["Figma", "Design System", "User Research", "Project Designs", "Components", "Wireframes"],
  },
  {
    id: "DEVELOPMENT",
    label: "Development & Engineering",
    badge: "Architecture & Code",
    icon: Code2,
    accentBorder: "border-[#FF6200]/30 hover:border-[#FF6200]/60",
    badgeColor: "bg-[#FF6200]/15 text-[#FF8C42] border-[#FF6200]/30",
    iconBg: "bg-[#FF6200]/10 text-[#FF8C42] group-hover:bg-[#FF6200] group-hover:text-slate-900",
    defaultCategories: ["Backend", "Frontend", "Mobile", "DevOps", "Database", "Architecture", "API"],
  },
  {
    id: "QA",
    label: "QA & Testing",
    badge: "Automation & Quality",
    icon: CheckSquare,
    accentBorder: "border-emerald-500/30 hover:border-emerald-500/60",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    iconBg: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900",
    defaultCategories: ["Testing Guidelines", "Automation", "Release Checklist", "Test Cases"],
  },
  {
    id: "MARKETING",
    label: "Marketing & Growth",
    badge: "Brand & Content",
    icon: Megaphone,
    accentBorder: "border-purple-500/30 hover:border-purple-500/60",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    iconBg: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-900",
    defaultCategories: ["Brand Guidelines", "SEO & Content", "Social Media", "Campaigns"],
  },
  {
    id: "ALL",
    label: "Company-Wide & Standards",
    badge: "Policies & Standards",
    icon: Building,
    accentBorder: "border-blue-500/30 hover:border-blue-500/60",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    iconBg: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900",
    defaultCategories: ["Company Policies", "Engineering Standards", "General Guidelines"],
  },
];

export function DocumentsView({ currentUser, onRefreshData }: DocumentsViewProps) {
  const superAdmin = isSuperAdmin(currentUser);
  const canManageDocs = superAdmin || isManager(currentUser) || isTeamLead(currentUser?.role);

  // Default to all departments so all published documentation is immediately visible
  const getUserDefaultDept = () => {
    return "ALL_DEPTS";
  };

  // State
  const [documents, setDocuments] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("ALL_DEPTS");
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

  // Unique categories in the current view (from DocCategory definitions + uploaded documents)
  const categoryNamesFromDb = categories
    .filter((c) => selectedDept === "ALL_DEPTS" || c.department === selectedDept || c.department === "ALL")
    .map((c) => c.name);

  const categoryNamesFromDocs = documents
    .filter((d) => selectedDept === "ALL_DEPTS" || d.department === selectedDept || d.department === "ALL")
    .map((d) => d.category)
    .filter(Boolean);

  const visibleCategories = Array.from(new Set([...categoryNamesFromDb, ...categoryNamesFromDocs]));

  // Group documents by phase if inside a specific category
  const phasesInCurrentCategory = Array.from(
    new Set(
      documents
        .filter((d) => selectedCategory === "ALL_CATEGORIES" || d.category === selectedCategory)
        .map((d) => d.phaseNumber)
    )
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12 text-gray-900">
      {/* Top Header & Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#FF6200] to-[#FF8C42] text-white shadow-lg shadow-[#FF6200]/25 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Company Documentation Portal</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30 font-mono text-[10px] font-bold uppercase">
                {superAdmin ? "Super Admin Control" : canManageDocs ? `${currentUser?.role?.replace("_", " ") || "Lead"} Access` : `${currentUser?.department || "Team"} Access`}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Official technical specifications, architecture blueprints, UI/UX guidelines, QA standards, and team milestone phases
            </p>
          </div>
        </div>

        {/* Manager, Team Lead & Super Admin Actions */}
        {canManageDocs && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsNewCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-white border border-slate-200 text-slate-200 hover:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>+ Category</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewPhaseModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-white border border-slate-200 text-slate-200 hover:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>+ Phase</span>
            </button>

            <button
              type="button"
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
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setSelectedDept(superAdmin ? "ALL_DEPTS" : getUserDefaultDept());
            setSelectedCategory("ALL_CATEGORIES");
            setSelectedPhase("ALL_PHASES");
          }}
          className="hover:text-[#FF8C42] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
        >
          <Building className="w-3.5 h-3.5 text-[#FF6200]" />
          <span>Documentation</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

        <button
          type="button"
          onClick={() => {
            setSelectedCategory("ALL_CATEGORIES");
            setSelectedPhase("ALL_PHASES");
          }}
          className={`font-semibold transition-colors cursor-pointer flex-shrink-0 ${
            selectedCategory === "ALL_CATEGORIES" ? "text-[#FF8C42]" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {selectedDept === "ALL_DEPTS" ? "All Departments" : selectedDept}
        </button>

        {selectedCategory !== "ALL_CATEGORIES" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <button
              type="button"
              onClick={() => setSelectedPhase("ALL_PHASES")}
              className={`font-semibold transition-colors cursor-pointer flex-shrink-0 ${
                selectedPhase === "ALL_PHASES" ? "text-[#FF8C42]" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {selectedCategory}
            </button>
          </>
        )}

        {selectedPhase !== "ALL_PHASES" && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-emerald-400 font-bold font-mono flex-shrink-0">
              Phase {selectedPhase}
            </span>
          </>
        )}
      </div>

      {/* Department Tabs (for Super Admin or multi-dept access) */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-slate-200 overflow-x-auto no-scrollbar">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.id}
            type="button"
            onClick={() => {
              setSelectedDept(dept.id);
              setSelectedCategory("ALL_CATEGORIES");
              setSelectedPhase("ALL_PHASES");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDept === dept.id
                ? "bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-bold shadow-md shadow-[#FF6200]/25"
                : "text-slate-600 bg-white hover:bg-white hover:text-slate-900 border border-slate-200"
            }`}
          >
            {dept.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documentation by title, description, category, phase..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#777] focus:outline-none focus:border-[#FF6200]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedPhase("ALL_PHASES");
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
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
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6200]"
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
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#FF8C42] font-semibold focus:outline-none"
            >
              <option value="ALL_STATUSES">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Drafts</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          )}
        </div>
      </div>

      {/* Category Summary Cards grouped by Department */}
      {selectedCategory === "ALL_CATEGORIES" && (
        <div className="space-y-6">
          {DEPARTMENT_SECTIONS.filter(
            (dept) => selectedDept === "ALL_DEPTS" || dept.id === selectedDept
          ).map((dept) => {
            const deptCategoriesFromDb = categories
              .filter((c) => c.department === dept.id)
              .map((c) => c.name);
            const deptCategoriesFromDocs = documents
              .filter((d) => d.department === dept.id)
              .map((d) => d.category)
              .filter(Boolean);
            const deptCategories = Array.from(
              new Set([...deptCategoriesFromDb, ...deptCategoriesFromDocs, ...dept.defaultCategories])
            );
            const deptTotalDocs = documents.filter((d) => d.department === dept.id).length;
            const DeptIcon = dept.icon;

            return (
              <div key={dept.id} className="space-y-3 p-5 rounded-3xl bg-white border border-slate-200 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#22222A]">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${dept.badgeColor}`}>
                      <DeptIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {dept.label}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${dept.badgeColor}`}>
                          {dept.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Browse official specifications, assets, and design guidelines for {dept.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-600 font-semibold px-2.5 py-1 rounded-xl bg-white border border-slate-200">
                      {deptTotalDocs} Document{deptTotalDocs === 1 ? "" : "s"}
                    </span>
                    {selectedDept === "ALL_DEPTS" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setSelectedCategory("ALL_CATEGORIES");
                          setSelectedPhase("ALL_PHASES");
                        }}
                        className="px-3 py-1 rounded-xl bg-white hover:bg-white text-[11px] font-semibold text-[#FF8C42] border border-slate-200 transition-colors cursor-pointer"
                      >
                        View Section &rarr;
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                  {deptCategories.map((cat) => {
                    const catDocs = documents.filter(
                      (d) => (d.department === dept.id || dept.id === "ALL") && d.category === cat
                    );
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setSelectedDept(dept.id);
                          setSelectedCategory(cat);
                          setSelectedPhase("ALL_PHASES");
                        }}
                        className={`p-4 rounded-2xl bg-white border border-[#2E2E38] ${dept.accentBorder} transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md hover:translate-y-[-2px]`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl border border-transparent transition-colors ${dept.iconBg}`}>
                            <Folder className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            catDocs.length > 0
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-[#22222A] text-slate-500"
                          }`}>
                            {catDocs.length} Docs
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-[#FF8C42] transition-colors">
                            {cat}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {dept.id === "UI_UX" && cat === "Figma" ? "Figma libraries, assets & screens" : `Explore ${cat} specifications`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
              type="button"
              onClick={() => setSelectedCategory("ALL_CATEGORIES")}
              className="text-[11px] text-[#FF8C42] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to all categories</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {phasesInCurrentCategory.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-600 col-span-full">
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
                    className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FF6200]/50 transition-all flex flex-col justify-between space-y-4 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Phase {phNum}
                        </span>
                        <span className="text-xs font-mono text-slate-600">{phaseDocs.length} Document(s)</span>
                      </div>

                      <h4 className="font-bold text-white text-sm mt-2">
                        {phaseDocs[0]?.phaseName || `Phase ${phNum}: Milestone Specifications`}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPhase(phNum.toString())}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FF6200] text-slate-200 hover:text-slate-900 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                    >
                      View Phase {phNum} Documents &rarr;
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}      {/* Documents Grid - Always shown so all team members can see all published documents */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF6200]" />
              <span>
                {selectedCategory !== "ALL_CATEGORIES"
                  ? `${selectedCategory} Documents (${documents.length})`
                  : searchQuery.trim() !== ""
                  ? `Search Results for "${searchQuery}" (${documents.length})`
                  : `All Organization Documents (${documents.length})`}
              </span>
            </h3>
            {selectedCategory !== "ALL_CATEGORIES" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL_CATEGORIES");
                  setSelectedPhase("ALL_PHASES");
                }}
                className="text-[11px] text-[#FF8C42] hover:underline px-2 py-0.5 rounded-lg bg-[#FF6200]/10 border border-[#FF6200]/20 font-semibold"
              >
                Clear Category Filter &times;
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-600 font-mono">
            {superAdmin ? "Super Admin Full Access" : canManageDocs ? "Management Access" : "Read-Only Protected"}
          </span>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-600">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-500 mx-auto" />
            <div className="font-bold text-white text-sm">No documentation available in this view</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no documents matching your selected department or category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setViewingDoc(doc)}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#FF6200]/50 transition-all flex flex-col justify-between space-y-4 cursor-pointer group shadow-md hover:translate-y-[-2px]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 flex-shrink-0">
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
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{doc.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium text-white">{doc.category || "General"}</span>
                    <span className="font-mono">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDoc(doc);
                      }}
                      className="flex items-center gap-1 text-xs text-[#FF8C42] font-semibold hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Document</span>
                    </button>

                    {canManageDocs && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
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
          initialDepartment={selectedDept === "ALL_DEPTS" ? (currentUser?.department?.toUpperCase()?.includes("UI") ? "UI_UX" : "DEVELOPMENT") : selectedDept}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-700">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-white">Create Documentation Category / Team</h3>
              <button onClick={() => setIsNewCategoryModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={newCatDept}
                  onChange={(e) => setNewCatDept(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {DEPARTMENTS.filter((d) => d.id !== "ALL_DEPTS").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category / Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microservices, AI Copilot, Store Deployment"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of category documentation..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-500 hover:text-slate-900"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in text-slate-700">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-white">Create Documentation Phase Milestone</h3>
              <button onClick={() => setIsNewPhaseModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={newPhaseDept}
                  onChange={(e) => setNewPhaseDept(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {DEPARTMENTS.filter((d) => d.id !== "ALL_DEPTS").map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phase Number (Unbounded)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newPhaseNum}
                  onChange={(e) => setNewPhaseNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phase Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 7: Real-Time WebSockets & Scalability"
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPhaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-500 hover:text-slate-900"
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
