"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  FileText,
  BookOpen,
  CheckCircle2,
  Lock,
  LogOut,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface MandatoryNdaModalProps {
  isOpen: boolean;
  currentUser: any;
  onAccepted: (updatedUser: any) => void;
  onLogout: () => void;
}

export function MandatoryNdaModal({
  isOpen,
  currentUser,
  onAccepted,
  onLogout,
}: MandatoryNdaModalProps) {
  const [activeTab, setActiveTab] = useState<"nda" | "policies" | "sign">("nda");
  const [template, setTemplate] = useState<any>(null);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadComplianceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [templateRes, policiesRes] = await Promise.all([
          fetch("/api/nda/template"),
          fetch("/api/company-policies"),
        ]);

        const templateJson = await templateRes.json();
        const policiesJson = await policiesRes.json();

        if (isMounted) {
          if (templateJson.success && templateJson.data) {
            setTemplate(templateJson.data);
          }
          if (policiesJson.success) {
            const list = Array.isArray(policiesJson.data)
              ? policiesJson.data
              : Array.isArray(policiesJson.data?.policies)
              ? policiesJson.data.policies
              : [];
            setPolicies(list);
            if (list.length > 0) {
              setExpandedPolicyId(list[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load compliance details:", err);
        if (isMounted) {
          setError("Failed to load official compliance agreements. Please check connection.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadComplianceData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkboxConfirmed) {
      setError("Please check the confirmation box acknowledging you agree to all terms.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/nda/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkboxConfirmed: true }),
      });

      const json = await res.json();
      if (json.success && json.data?.user) {
        onAccepted(json.data.user);
      } else {
        setError(json.error?.message || "Failed to record compliance acceptance.");
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError("Network error while submitting agreement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-800">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF6200] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900">
                  Domain Expansion Compliance & NDA Agreement
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Mandatory Required
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                All members must read and accept the Non-Disclosure Agreement and Company Policies to access the workspace.
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Log Out if you do not wish to agree right now"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Member Identity Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FF6200]" />
            <span className="font-bold text-slate-900">{currentUser?.name || "Authorized Member"}</span>
            <span className="text-slate-400 font-mono">({currentUser?.email})</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser?.department || "Department: General"}</span>
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
              Role: {currentUser?.role || "MEMBER"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab("nda")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "nda"
                ? "border-[#FF6200] text-[#FF6200]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Non-Disclosure Agreement ({template?.version || "v1.0"})</span>
          </button>

          <button
            onClick={() => setActiveTab("policies")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "policies"
                ? "border-[#FF6200] text-[#FF6200]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Corporate Policies ({policies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("sign")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "sign"
                ? "border-[#FF6200] text-[#FF6200]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>3. Review & Sign</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-[#FF6200] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading official legal documentation & policies...</p>
            </div>
          ) : error && !template && policies.length === 0 ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: NDA DETAILS */}
              {activeTab === "nda" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {template?.title || "Domain Expansion Proprietary Non-Disclosure Agreement"}
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Effective Version: <span className="font-mono font-bold text-[#FF6200]">{template?.version || "v1.0"}</span> • Published: {template?.publishedAt ? formatDateTime(template.publishedAt) : "Active"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-orange-200 font-mono text-[10px] font-bold text-[#FF6200]">
                      Binding Legal Contract
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap text-slate-800 max-h-[380px] overflow-y-auto shadow-inner">
                    {template?.content || `NON-DISCLOSURE AND PROPRIETARY INFORMATION AGREEMENT

1. PURPOSE & SCOPE
This Non-Disclosure Agreement ("Agreement") is entered into by Domain Expansion and the undersigned member ("Recipient"). The purpose of this Agreement is to protect Domain Expansion's proprietary code, database records, client communications, system architecture, and strategic confidential business materials.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" shall include, without limitation:
(a) All source code, Git repositories, API secrets, database credentials, server connection strings, and architecture designs.
(b) All proprietary client documents, project milestones, financial estimates, customer records, and personnel information.
(c) Any non-public technical, trade secret, business, or operational data accessed via the Domain Expansion workspace or affiliated portals.

3. RECIPIENT OBLIGATIONS & RESTRICTIONS
(a) Strict Confidentiality: The Recipient shall maintain all Confidential Information in the strictest confidence and take all reasonable precautions to prevent unauthorized disclosure, leakage, or copying.
(b) Use Limitation: Confidential Information shall be used solely for the authorized purpose of fulfilling legitimate job responsibilities at Domain Expansion.
(c) Non-Dissemination: The Recipient shall not disclose, transmit, publish, or copy any Confidential Information to any external third party, personal email, or unauthorized communication channel without prior written authorization from the Super Admin.

4. INTELLECTUAL PROPERTY OWNERSHIP
All inventions, software features, bugs resolved, documentation created, and intellectual property developed by the Recipient during their engagement with Domain Expansion remain the exclusive and absolute property of Domain Expansion.

5. BREACH & REMEDIES
Recipient acknowledges that any breach of this Agreement may result in irreparable harm to Domain Expansion for which monetary damages alone would be inadequate. Domain Expansion reserves the right to seek immediate injunctive relief, account termination, and all remedies available under applicable law.

6. TERM
This Agreement remains binding throughout the Recipient's association with Domain Expansion and endures indefinitely regarding all trade secrets and proprietary data.`}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveTab("policies")}
                      className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer"
                    >
                      Proceed to Corporate Policies &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: COMPANY POLICIES */}
              {activeTab === "policies" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Official Company Policies & Protocols</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please review all published organizational guidelines and operational standards.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#FF6200] px-3 py-1 rounded-full bg-orange-50 border border-orange-200">
                      {policies.length} Policies Active
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {policies.map((p) => {
                      const isExpanded = expandedPolicyId === p.id;
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedPolicyId(isExpanded ? null : p.id)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-[#FF6200] border border-orange-200">
                                {p.category}
                              </span>
                              <div>
                                <h3 className="text-xs font-bold text-slate-900">{p.title}</h3>
                                {p.summary && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.summary}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-mono text-slate-400">v{p.version}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {p.content}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setActiveTab("nda")}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      &larr; Back to NDA Terms
                    </button>
                    <button
                      onClick={() => setActiveTab("sign")}
                      className="px-5 py-2.5 rounded-xl bg-[#FF6200] hover:bg-[#e05600] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 cursor-pointer"
                    >
                      Proceed to Review & Sign &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: REVIEW & DIGITAL SIGNATURE */}
              {activeTab === "sign" && (
                <form onSubmit={handleSubmitAgreement} className="space-y-5">
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                      <Lock className="w-4 h-4 text-[#FF6200]" />
                      <span>Legal Compliance Acknowledgement & Digital Signing</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      By submitting this form, you affirm that you have received, thoroughly reviewed, and understood the Domain Expansion Non-Disclosure Agreement ({template?.version || "v1.0"}) and all {policies.length} Corporate Policies. Your digital timestamp, IP address, and identity will be securely logged in the audit registry.
                    </p>
                  </div>

                  {/* Summary Check Table */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Signatory Full Name</span>
                      <span className="font-bold text-slate-900">{currentUser?.name}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Corporate Email</span>
                      <span className="font-mono text-slate-700">{currentUser?.email}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Assigned Department / Designation</span>
                      <span className="text-slate-800">{currentUser?.department || "General"} • {currentUser?.jobTitle || currentUser?.role}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Governing NDA Agreement</span>
                      <span className="font-mono font-bold text-[#FF6200]">{template?.title || "Domain Expansion NDA"} ({template?.version || "v1.0"})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Signing Date & Verification</span>
                      <span className="font-mono text-slate-700">{formatDateTime(new Date())}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Mandatory Confirmation Checkbox */}
                  <div className="p-4 rounded-2xl bg-slate-50 border-2 border-orange-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkboxConfirmed}
                        onChange={(e) => setCheckboxConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-[#FF6200] rounded border-slate-300 focus:ring-[#FF6200] cursor-pointer"
                        id="mandatory-nda-checkbox"
                      />
                      <span className="text-xs text-slate-800 font-semibold leading-relaxed">
                        I confirm that I have read, understood, and voluntarily agree to be legally bound by the Domain Expansion Non-Disclosure Agreement (NDA) and all associated Corporate Compliance Policies. I understand that compliance is a mandatory condition of accessing and using the portal.
                      </span>
                    </label>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("policies")}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                    >
                      &larr; Back to Policies
                    </button>

                    <button
                      type="submit"
                      disabled={!checkboxConfirmed || submitting}
                      className="px-6 py-3 rounded-xl bg-[#FF6200] hover:bg-[#e05600] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-xs font-bold transition-all shadow-md shadow-[#FF6200]/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Recording Digital Signature...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Unlock Portal Workspace</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
