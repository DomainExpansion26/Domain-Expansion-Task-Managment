"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, FolderKanban, CheckSquare, Users, ArrowRight } from "lucide-react";
import { getPriorityColor, getStatusColor } from "@/lib/utils";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskKey: string) => void;
  onSelectProject: (projectId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectTask, onSelectProject }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ tasks: any[]; projects: any[]; users: any[] }>({
    tasks: [],
    projects: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({ tasks: [], projects: [], users: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], projects: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E2E2E]">
          <Search className="w-5 h-5 text-[#FF6200]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks (e.g. WEB-102), projects, team members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#888898] focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[#888898] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2E2E2E] text-[#888898]"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-[#888898]">Searching repository...</div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center text-xs text-[#888898]">
              Type to search by task key, title, project name, or person name...
            </div>
          )}

          {!loading && query && results.tasks.length === 0 && results.projects.length === 0 && results.users.length === 0 && (
            <div className="py-8 text-center text-xs text-[#888898]">No matching results found for &ldquo;{query}&rdquo;</div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#888898] px-3 mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3 text-[#FF6200]" />
                <span>Tasks</span>
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => {
                  const priority = getPriorityColor(task.priority);
                  const status = getStatusColor(task.status);
                  return (
                    <button
                      key={task.id}
                      onClick={() => {
                        onSelectTask(task.taskKey);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#1A1A1A] border border-transparent hover:border-[#2E2E2E] transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#FF8C42] bg-[#FF6200]/10 px-2 py-0.5 rounded border border-[#FF6200]/20">
                          {task.taskKey}
                        </span>
                        <span className="text-xs font-medium text-white group-hover:text-[#FF8C42] transition-colors truncate max-w-md">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.bg}`}>
                          {status.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priority.bg}`}>
                          {priority.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#888898] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#888898] px-3 mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3 text-purple-400" />
                <span>Projects</span>
              </div>
              <div className="space-y-1">
                {results.projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#1A1A1A] border border-transparent hover:border-[#2E2E2E] transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {p.key}
                      </span>
                      <span className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#888898] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#888898] px-3 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>People</span>
              </div>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1A1A]/40 border border-transparent"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover border border-[#2E2E2E]"
                      />
                      <div>
                        <div className="text-xs font-medium text-white">{u.name}</div>
                        <div className="text-[10px] text-[#888898]">{u.jobTitle || u.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252525] text-slate-300">
                      {u.role.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
