"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, RefreshCw, Send, CheckCircle2, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface DevMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevMailboxModal({ isOpen, onClose }: DevMailboxModalProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/emails");
      const json = await res.json();
      if (json.success) {
        setEmails(json.data);
        if (json.data.length > 0 && !selectedEmail) {
          setSelectedEmail(json.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Transactional Email Log & Dev Mailbox</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Dispatch Stream
                </span>
              </div>
              <p className="text-xs text-[#888898]">
                Inspect real-time HTML transactional emails dispatched by Domain Expansion
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] border border-[#2E2E2E] text-xs text-[#ACACB8] hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Email List */}
          <div className="w-80 border-r border-[#2E2E2E] overflow-y-auto bg-[#0D0D0D]/50 divide-y divide-[#2E2E2E]/60">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#888898]">No sent emails yet.</div>
            ) : (
              emails.map((mail) => {
                const isSelected = selectedEmail?.id === mail.id;
                return (
                  <button
                    key={mail.id}
                    onClick={() => setSelectedEmail(mail)}
                    className={`w-full text-left p-3.5 transition-all ${
                      isSelected
                        ? "bg-[#1A1A1A] border-l-2 border-l-[#FF6200]"
                        : "hover:bg-[#1A1A1A]/50 text-[#888898]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-mono text-[#FF8C42] truncate max-w-[170px]">{mail.toEmail}</span>
                      <span className="text-[10px] text-[#888898]">{formatDateTime(mail.sentAt)}</span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1 line-clamp-1">{mail.subject}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#252525] text-slate-300">
                        {mail.template}
                      </span>
                      <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right HTML Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0D0D0D]">
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Meta details bar */}
                <div className="px-6 py-3 border-b border-[#2E2E2E] bg-[#141414] text-xs flex items-center justify-between">
                  <div>
                    <div>
                      <span className="text-[#888898]">To: </span>
                      <span className="font-mono text-white">{selectedEmail.toEmail}</span>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-[#888898]">Subject: </span>
                      <span className="font-bold text-white">{selectedEmail.subject}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[#888898]">
                    <div>Template: <span className="font-mono text-[#FF8C42]">{selectedEmail.template}</span></div>
                    <div>{formatDateTime(selectedEmail.sentAt)}</div>
                  </div>
                </div>

                {/* Rendered HTML iframe */}
                <div className="flex-1 p-4 overflow-auto">
                  <iframe
                    title="Email Preview"
                    srcDoc={selectedEmail.htmlBody}
                    className="w-full h-full rounded-xl border border-[#2E2E2E] bg-[#0D0D0D]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[#888898]">
                Select an email from the list to preview HTML payload
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
