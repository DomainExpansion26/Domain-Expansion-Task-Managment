"use client";

import React, { useState, useEffect } from "react";
import {
  Network,
  X,
  Plus,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Bug,
  ListTodo,
  ExternalLink,
} from "lucide-react";
import { getPriorityColor, getStatusColor } from "@/lib/utils";

interface TaskRelationsModalProps {
  taskKey: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (key: string) => void;
}

export function TaskRelationsModal({
  taskKey,
  isOpen,
  onClose,
  onSelectTask,
}: TaskRelationsModalProps) {
  const [relationsData, setRelationsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && taskKey) {
      setLoading(true);
      fetch(`/api/tasks/${taskKey}/relations`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setRelationsData(json.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, taskKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6200]/15 text-[#FF8C42] border border-[#FF6200]/30">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Task Relations & Lineage</h2>
              <p className="text-[11px] text-[#888898]">Parent, child, related user stories, and QA bugs for {taskKey}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 text-center text-[#888898]">Loading relations for {taskKey}...</div>
          ) : (
            <>
              {/* 1. Parent Task */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[#888898] uppercase tracking-wider">Parent Task</h3>
                {relationsData?.parent ? (
                  <div
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(relationsData.parent.taskKey);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#FF8C42]">{relationsData.parent.taskKey}</span>
                      <span className="text-white group-hover:text-[#FF8C42] transition-colors">{relationsData.parent.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
                      {relationsData.parent.status}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#1A1A1A]/40 border border-[#2E2E2E]/60 text-[#888898] italic">
                    No parent task (This is a root task)
                  </div>
                )}
              </div>

              {/* 2. Child Tasks */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[#888898] uppercase tracking-wider">
                  Child Tasks ({relationsData?.children?.length || 0})
                </h3>
                {relationsData?.children?.length > 0 ? (
                  <div className="space-y-2">
                    {relationsData.children.map((child: any) => (
                      <div
                        key={child.id}
                        onClick={() => {
                          if (onSelectTask) {
                            onSelectTask(child.taskKey);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF6200]/50 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#FF8C42]">{child.taskKey}</span>
                          <span className="text-white group-hover:text-[#FF8C42] transition-colors">{child.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
                          {child.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#1A1A1A]/40 border border-[#2E2E2E]/60 text-[#888898] italic">
                    No child tasks linked.
                  </div>
                )}
              </div>

              {/* 3. Related QA Tickets */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[#888898] uppercase tracking-wider">
                  Linked QA Tickets ({relationsData?.qaTickets?.length || 0})
                </h3>
                {relationsData?.qaTickets?.length > 0 ? (
                  <div className="space-y-2">
                    {relationsData.qaTickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="p-3 rounded-xl bg-[#1A1A1A] border border-blue-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-blue-400">{ticket.ticketKey}</span>
                          <span className="text-white font-medium">{ticket.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#1A1A1A]/40 border border-[#2E2E2E]/60 text-[#888898] italic">
                    No QA tickets currently attached to this task.
                  </div>
                )}
              </div>

              {/* 4. Related QA Bugs */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[#888898] uppercase tracking-wider">
                  Linked QA Bugs ({relationsData?.qaBugs?.length || 0})
                </h3>
                {relationsData?.qaBugs?.length > 0 ? (
                  <div className="space-y-2">
                    {relationsData.qaBugs.map((bug: any) => (
                      <div
                        key={bug.id}
                        className="p-3 rounded-xl bg-[#1A1A1A] border border-red-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bug className="w-3.5 h-3.5 text-red-400" />
                          <span className="font-mono font-bold text-red-400">{bug.bugKey}</span>
                          <span className="text-white font-medium">{bug.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                            {bug.severity}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
                            {bug.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#1A1A1A]/40 border border-[#2E2E2E]/60 text-[#888898] italic">
                    No open QA bugs linked to this task.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#2E2E2E] bg-[#1A1A1A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#252525] hover:bg-[#303030] text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
