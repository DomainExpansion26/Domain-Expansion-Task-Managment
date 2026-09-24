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
  Trash2,
  Copy,
  Unlink,
  Loader2,
} from "lucide-react";
import { getPriorityColor, getStatusColor } from "@/lib/utils";

interface TaskRelationsModalProps {
  taskKey: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (key: string) => void;
  onTaskDeleted?: () => void;
}

export function TaskRelationsModal({
  taskKey,
  isOpen,
  onClose,
  onSelectTask,
  onTaskDeleted,
}: TaskRelationsModalProps) {
  const [relationsData, setRelationsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const fetchRelations = () => {
    if (!taskKey) return;
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
  };

  useEffect(() => {
    if (isOpen && taskKey) {
      fetchRelations();
    }
  }, [isOpen, taskKey]);

  const handleDeleteDuplicateTask = async (targetTaskKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete duplicate task ${targetTaskKey}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(targetTaskKey);
    try {
      const res = await fetch(`/api/tasks/${targetTaskKey}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchRelations();
        if (onTaskDeleted) onTaskDeleted();
      } else {
        alert(json.error?.message || "Failed to delete task");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting task");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUnlinkRelation = async (relationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remove relation link between these tasks?")) return;

    setUnlinkingId(relationId);
    try {
      const res = await fetch(`/api/tasks/${taskKey}/relations?relationId=${relationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchRelations();
      } else {
        alert(json.error?.message || "Failed to unlink relation");
      }
    } catch (err) {
      console.error(err);
      alert("Error unlinking relation");
    } finally {
      setUnlinkingId(null);
    }
  };

  if (!isOpen) return null;

  const duplicates = relationsData?.relatedTasks?.filter((r: any) => r.type === "DUPLICATES" || r.type === "DUPLICATE") || [];
  const otherRelations = relationsData?.relatedTasks?.filter((r: any) => r.type !== "DUPLICATES" && r.type !== "DUPLICATE") || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6200]/10 text-[#FF6200] border border-[#FF6200]/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Task Relations & Lineage</h2>
              <p className="text-[11px] text-slate-500">Parent, children, duplicates, and QA bugs for {taskKey}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF6200]" />
              <span>Loading relations for {taskKey}...</span>
            </div>
          ) : (
            <>
              {/* 1. Duplicate Tasks Section */}
              {duplicates.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-amber-600" /> Duplicate Tasks ({duplicates.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {duplicates.map((rel: any) => (
                      <div
                        key={rel.relationId}
                        onClick={() => {
                          if (onSelectTask && rel.task?.taskKey) {
                            onSelectTask(rel.task.taskKey);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-lg bg-white border border-amber-200 hover:border-amber-400 shadow-xs transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="font-mono font-bold text-amber-700 shrink-0">{rel.task?.taskKey}</span>
                          <span className="text-slate-900 truncate group-hover:text-amber-700 transition-colors font-medium">
                            {rel.task?.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {rel.task?.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleUnlinkRelation(rel.relationId, e)}
                            disabled={unlinkingId === rel.relationId}
                            title="Unlink duplicate relation"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDuplicateTask(rel.task?.taskKey, e)}
                            disabled={deletingId === rel.task?.taskKey}
                            title="Delete this duplicate task"
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {deletingId === rel.task?.taskKey ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Delete Duplicate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Parent Task */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parent Task</h3>
                {relationsData?.parent ? (
                  <div
                    onClick={() => {
                      if (onSelectTask) {
                        onSelectTask(relationsData.parent.taskKey);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF6200]/50 shadow-xs transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#FF6200]">{relationsData.parent.taskKey}</span>
                      <span className="text-slate-900 group-hover:text-[#FF6200] transition-colors">{relationsData.parent.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {relationsData.parent.status}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    No parent task (This is a root task)
                  </div>
                )}
              </div>

              {/* 3. Child Tasks */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF6200]/50 shadow-xs transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-[#FF6200]">{child.taskKey}</span>
                          <span className="text-slate-900 group-hover:text-[#FF6200] transition-colors">{child.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {child.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDuplicateTask(child.taskKey, e)}
                            disabled={deletingId === child.taskKey}
                            title="Delete this child task"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    No child tasks linked.
                  </div>
                )}
              </div>

              {/* 4. Other Relations */}
              {otherRelations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Linked Related Tasks ({otherRelations.length})
                  </h3>
                  <div className="space-y-2">
                    {otherRelations.map((rel: any) => (
                      <div
                        key={rel.relationId}
                        onClick={() => {
                          if (onSelectTask && rel.task?.taskKey) {
                            onSelectTask(rel.task.taskKey);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#FF6200]/50 shadow-xs transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold uppercase">
                            {rel.type}
                          </span>
                          <span className="font-mono font-bold text-slate-900 group-hover:text-[#FF6200]">{rel.task?.taskKey}</span>
                          <span className="text-slate-500">{rel.task?.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleUnlinkRelation(rel.relationId, e)}
                            disabled={unlinkingId === rel.relationId}
                            title="Unlink relation"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Unlink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Related QA Tickets */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Linked QA Tickets ({relationsData?.qaTickets?.length || 0})
                </h3>
                {relationsData?.qaTickets?.length > 0 ? (
                  <div className="space-y-2">
                    {relationsData.qaTickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-blue-700">{ticket.ticketKey}</span>
                          <span className="text-slate-900 font-medium">{ticket.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    No QA tickets currently attached to this task.
                  </div>
                )}
              </div>

              {/* 6. Related QA Bugs */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Linked QA Bugs / Defects ({relationsData?.qaBugs?.length || 0})
                </h3>
                {relationsData?.qaBugs?.length > 0 ? (
                  <div className="space-y-2">
                    {relationsData.qaBugs.map((bug: any) => (
                      <div
                        key={bug.id}
                        className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bug className="w-3.5 h-3.5 text-red-500" />
                          <span className="font-mono font-bold text-red-600">{bug.bugKey}</span>
                          <span className="text-slate-900 font-medium">{bug.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono">
                            {bug.severity}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {bug.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 italic">
                    No open QA bugs linked to this task.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

