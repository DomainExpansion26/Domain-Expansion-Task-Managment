"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, Layers, Building, Tag, AlertCircle, CheckCircle2, Shield } from "lucide-react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const DEPARTMENTS = [
  { id: "ALL", label: "All Departments (Company-Wide)", color: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
  { id: "FRONTEND", label: "Frontend Team", color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" },
  { id: "UI_UX", label: "UI / UX Design Team", color: "border-pink-500/30 text-pink-400 bg-pink-500/10" },
  { id: "BACKEND", label: "Backend & API Team", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
  { id: "MARKETING", label: "Marketing & Growth Team", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
];

export function DocumentUploadModal({ isOpen, onClose, onUploaded }: DocumentUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [phaseNumber, setPhaseNumber] = useState(1);
  const [phaseName, setPhaseName] = useState("Phase 1: Architecture & Requirements");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhaseNumberChange = (num: number) => {
    setPhaseNumber(num);
    const defaults: Record<number, string> = {
      1: "Phase 1: Architecture & Requirements",
      2: "Phase 2: UI/UX Wireframing & Design",
      3: "Phase 3: Core API & Database Implementation",
      4: "Phase 4: Frontend Component Integration",
      5: "Phase 5: Quality Assurance & Security Audit",
      6: "Phase 6: Deployment & Performance Tuning",
      7: "Phase 7: Marketing Launch & User Growth",
    };
    setPhaseName(defaults[num] || `Phase ${num}: Milestone Documentation`);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !department) {
      setErrorMsg("Please provide a Title, select a Department, and attach a file.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("department", department);
      formData.append("phaseNumber", phaseNumber.toString());
      if (phaseName.trim()) formData.append("phaseName", phaseName.trim());

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setTitle("");
        setDescription("");
        setFile(null);
        onUploaded();
        onClose();
      } else {
        setErrorMsg(json.error?.message || "Failed to upload document");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#141414] border border-[#2E2E2E] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF6200]/15 border border-[#FF6200]/30 text-[#FF6200]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Upload Organization Document</h2>
              <p className="text-xs text-[#888898]">Assign department visibility and phase milestone</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold">
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master Backend API Specifications & Data Models"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold">
              Description / Summary (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief overview of the document contents and key takeaways..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]"
            />
          </div>

          {/* Department Visibility Picker */}
          <div>
            <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#FF6200]" />
              <span>Target Department Visibility *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setDepartment(dept.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    department === dept.id
                      ? "border-[#FF6200] bg-[#FF6200]/15 text-white font-bold shadow-md shadow-[#FF6200]/10"
                      : "border-[#2E2E2E] bg-[#1A1A1A] text-[#888898] hover:text-white hover:bg-[#252525]"
                  }`}
                >
                  <span className="truncate">{dept.label}</span>
                  {department === dept.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6200] flex-shrink-0" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#888898] mt-1.5 italic">
              Members outside the chosen department will not be able to view or access this document.
            </p>
          </div>

          {/* Phase Number & Custom Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#FF8C42]" />
                <span>Phase Number *</span>
              </label>
              <select
                value={phaseNumber}
                onChange={(e) => handlePhaseNumberChange(parseInt(e.target.value) || 1)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#FF6200] font-mono font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <option key={num} value={num}>
                    Phase {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold">
                Phase Milestone Title
              </label>
              <input
                type="text"
                placeholder="e.g. Phase 1: Architecture & Requirements"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF6200]"
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-[#888898] font-mono text-[10px] uppercase tracking-wider mb-1.5 font-bold">
              Document File (Any Format: PDF, Images, Code, Docs, ZIP) *
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#FF6200] bg-[#FF6200]/10"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-[#2E2E2E] bg-[#1A1A1A] hover:border-[#FF6200]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3 text-emerald-400 font-bold">
                  <FileText className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs text-white">{file.name}</div>
                    <div className="text-[10px] text-[#888898] font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-[#888898] mx-auto" />
                  <div className="text-xs font-bold text-white">Click or drag file here to upload</div>
                  <div className="text-[10px] text-[#888898]">Files are stored securely in Supabase Cloud Storage</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center gap-2 text-[#888898] text-[11px]">
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Documents are protected with in-portal anti-copy, anti-selection, and security watermarks.</span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2E2E2E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888898] hover:text-white hover:bg-[#252525] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#FF6200]/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Uploading..." : "Save to Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
