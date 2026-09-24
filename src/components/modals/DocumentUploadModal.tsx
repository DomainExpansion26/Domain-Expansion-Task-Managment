"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, Layers, Building, Tag, AlertCircle, CheckCircle2, Shield, FolderGit2 } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
  initialDepartment?: string;
  initialCategory?: string;
  initialPhase?: number;
}

const DEPARTMENTS = [
  { id: "ALL", label: "All Departments (Company-Wide)" },
  { id: "DEVELOPMENT", label: "Development & Engineering" },
  { id: "UI_UX", label: "UI / UX Design" },
  { id: "QA", label: "QA & Testing" },
  { id: "MARKETING", label: "Marketing & Growth" },
  { id: "HR", label: "Human Resources" },
  { id: "FINANCE", label: "Finance & Legal" },
  { id: "OPERATIONS", label: "Business Operations" },
];

const CATEGORY_DEFAULTS: Record<string, string[]> = {
  DEVELOPMENT: ["Backend", "Frontend", "Mobile", "DevOps", "Database", "API", "Architecture", "General"],
  UI_UX: ["Design System", "Figma", "Components", "User Research", "Wireframes", "Project Designs", "General"],
  QA: ["Testing Guidelines", "Test Cases", "Bug Reporting", "Automation", "Regression", "Release Checklist"],
  MARKETING: ["Brand Guidelines", "Social Media", "Content", "SEO", "Campaigns", "General"],
  ALL: ["Company Policies", "Engineering Standards", "General Guidelines", "Architecture Overview"],
};

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUploaded,
  initialDepartment = "ALL",
  initialCategory = "General",
  initialPhase = 1,
}: DocumentUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState(initialDepartment);
  const [category, setCategory] = useState(initialCategory);
  const [customCategory, setCustomCategory] = useState("");
  const [phaseNumber, setPhaseNumber] = useState(initialPhase);
  const [phaseName, setPhaseName] = useState(`Phase ${initialPhase}: Specifications & Standards`);
  const [version, setVersion] = useState("1.0");
  const [status, setStatus] = useState("PUBLISHED");
  const [visibility, setVisibility] = useState("DEPARTMENT");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentCategoryList = CATEGORY_DEFAULTS[department] || ["General", "Technical", "Guidelines", "Architecture"];

  const handleDeptChange = (dept: string) => {
    setDepartment(dept);
    const available = CATEGORY_DEFAULTS[dept] || ["General"];
    setCategory(available[0]);
  };

  const handlePhaseChange = (num: number) => {
    const val = Math.max(1, num);
    setPhaseNumber(val);
    setPhaseName(`Phase ${val}: Specifications & Standards`);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...dropped]);
      if (!title && dropped[0]) {
        setTitle(dropped[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
      if (!title && selected[0]) {
        setTitle(selected[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !title.trim() || !department) {
      setErrorMsg("Please provide a Title, select a Department, and attach at least one file.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const activeCategory = category === "CUSTOM" ? customCategory.trim() || "General" : category;

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("department", department);
      formData.append("category", activeCategory);
      formData.append("team", activeCategory);
      formData.append("phaseNumber", phaseNumber.toString());
      if (phaseName.trim()) formData.append("phaseName", phaseName.trim());
      formData.append("version", version.trim() || "1.0");
      formData.append("status", status);
      formData.append("visibility", visibility);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setTitle("");
        setDescription("");
        setFiles([]);
        onUploaded();
        onClose();
      } else {
        setErrorMsg(json.error?.message || "Failed to upload document(s)");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF6200]/10 border border-[#FF6200]/20 text-[#FF6200]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Super Admin — Upload Documentation</h2>
              <p className="text-xs text-slate-500">Publish official team guidelines, architecture, and phase documentation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Title */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Backend Architecture & API Specifications"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
            />
          </div>

          {/* Row 2: Department & Category / Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Department *</span>
              </label>
              <select
                value={department}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Team / Category *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              >
                {currentCategoryList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="CUSTOM">+ Custom Category</option>
              </select>
            </div>
          </div>

          {category === "CUSTOM" && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase">
                Custom Category / Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. Microservices, AI Copilot, Cloud Infra"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>
          )}

          {/* Row 3: Phase Number & Phase Name (Unbounded) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FF6200]" />
                <span>Phase Number</span>
              </label>
              <input
                type="number"
                min="1"
                value={phaseNumber}
                onChange={(e) => handlePhaseChange(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase">
                Phase Title / Milestone Name
              </label>
              <input
                type="text"
                placeholder="e.g. Phase 1: Architecture & API Specifications"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
              />
            </div>
          </div>

          {/* Row 4: Version, Status, Visibility */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 font-mono text-[10px] uppercase">Version</label>
              <input
                type="text"
                placeholder="1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-[#FF6200]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 font-mono text-[10px] uppercase">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#FF6200]"
              >
                <option value="PUBLISHED">Published (Active)</option>
                <option value="DRAFT">Draft (Admin Only)</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 font-mono text-[10px] uppercase">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#FF6200]"
              >
                <option value="DEPARTMENT">Department Only</option>
                <option value="COMPANY_WIDE">Company-Wide</option>
                <option value="ADMIN_ONLY">Super Admin Only</option>
              </select>
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase">
              Summary / Scope
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of what this document covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6200] focus:ring-1 focus:ring-[#FF6200]"
            />
          </div>

          {/* Row 6: File Upload Area */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 font-mono text-[11px] uppercase">
              File Attachment(s) * (PDF, DOCX, XLSX, TXT, JSON, Markdown, Images, ZIP)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 ${
                dragOver
                  ? "border-[#FF6200] bg-[#FF6200]/10"
                  : files.length > 0
                  ? "border-emerald-500/50 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-[#FF6200]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex justify-center">
                {files.length > 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  {files.length > 0 ? `${files.length} file(s) selected - click or drop to add more` : "Click to browse multiple files or drop them here"}
                </div>
                <div className="text-[10px] text-slate-500">Supported: PDF, DOC, DOCX, XLSX, TXT, JSON, MD, PNG, ZIP</div>
              </div>
            </div>

            {/* List of Selected Files */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#FF6200] flex-shrink-0" />
                      <span className="text-slate-800 truncate font-medium">{f.name}</span>
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        ({(f.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold shadow-sm shadow-[#FF6200]/25 transition-all"
            >
              {loading ? "Publishing Document..." : "Publish to Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
