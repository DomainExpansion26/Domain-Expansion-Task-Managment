"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ListTodo,
  Layers,
  Wand2,
} from "lucide-react";

interface ProposedAction {
  id: string;
  type: "CREATE_TASK" | "UPDATE_TASK" | "ASSIGN_TASK" | "CHANGE_STATUS" | "BREAKDOWN_PLAN";
  title: string;
  details: Record<string, any>;
  confirmLabel: string;
}

interface Message {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  toolsCalled?: string[];
  proposedAction?: ProposedAction;
  actionExecuted?: boolean;
}

interface DXAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onTaskCreated?: (taskKey: string) => void;
}

export function DXAIAssistant({ isOpen, onClose, currentUser, onTaskCreated }: DXAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ASSISTANT",
      content: `Hello **${currentUser?.name || "Team Member"}**! I am **DX AI**, your Domain Expansion project copilot.\n\nI have direct, permission-checked access to your live tasks, projects, sprints, and team workload.\n\nTry clicking a prompt below or type your request:`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What should I work on today?",
    "What tasks are overdue?",
    "Which tasks are blocked?",
    "Summarize Website Development",
    "Create a task for Rahul to build login page by Monday with high priority",
    "Build Google login",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMessage: Message = {
      id: "msg_" + Date.now(),
      sender: "USER",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (json.success) {
        const assistantMessage: Message = {
          id: "msg_" + (Date.now() + 1),
          sender: "ASSISTANT",
          content: json.data.message,
          toolsCalled: json.data.toolsCalled,
          proposedAction: json.data.proposedAction,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_err_" + Date.now(),
            sender: "ASSISTANT",
            content: "⚠️ I encountered an issue accessing the task database. Please try again.",
          },
        ]);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_err_" + Date.now(),
          sender: "ASSISTANT",
          content: "⚠️ Network connectivity issue with DX AI service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: ProposedAction) => {
    setExecutingActionId(action.id);
    try {
      const res = await fetch("/api/ai/execute-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: action.type,
          details: action.details,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, actionExecuted: true } : m))
        );

        // Add confirmation message
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_confirm_" + Date.now(),
            sender: "ASSISTANT",
            content: `✅ **Action Confirmed & Executed!**\n\n${json.message}\n\n- Entity Key: **[${
              json.data.taskKey
            }]**\n- Title: *${json.data.title}*\n- Activity & audit records updated.`,
          },
        ]);

        if (onTaskCreated && json.data.taskKey) {
          onTaskCreated(json.data.taskKey);
        }
      }
    } catch (err) {
      console.error("Execute action error:", err);
    } finally {
      setExecutingActionId(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#141414] border-l border-[#2E2E2E] shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">DX AI Assistant</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Connected to DB
              </span>
            </div>
            <p className="text-xs text-[#888898]">Jira-aware autonomous project copilot</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 border-b border-[#2E2E2E] bg-[#0D0D0D]/60 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] text-[#ACACB8] hover:text-white hover:border-[#FF6200]/50 hover:bg-[#222] transition-all flex items-center gap-1.5"
          >
            <Wand2 className="w-3 h-3 text-[#FF8C42]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isAssistant = msg.sender === "ASSISTANT";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-[0_0_10px_rgba(109,40,217,0.3)]">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isAssistant
                    ? "bg-[#1A1A1A] border border-[#2E2E2E] text-[#F3F4F6]"
                    : "bg-gradient-to-r from-[#FF6200] to-[#FF8C42] text-white font-medium"
                }`}
              >
                {/* Tools Badge */}
                {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {msg.toolsCalled.map((tool, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        ⚡ Tool: {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Content formatted */}
                <div className="whitespace-pre-line prose prose-invert prose-xs">
                  {msg.content}
                </div>

                {/* Proposed Action Preview Card (Task Creation / Requirement Breakdown) */}
                {msg.proposedAction && (
                  <div className="mt-4 p-3.5 rounded-xl bg-[#141414] border border-[#FF6200]/40 shadow-[0_0_20px_rgba(255,98,0,0.1)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#FF8C42] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Action Preview & Proposal</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#252525] text-slate-300 font-mono">
                        {msg.proposedAction.type}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white mb-2">
                      {msg.proposedAction.title}
                    </div>

                    {msg.proposedAction.details.subtasks ? (
                      <div className="space-y-1 my-2 border-t border-[#2E2E2E] pt-2">
                        <div className="text-[10px] text-[#888898] font-semibold">Subtasks to generate:</div>
                        {msg.proposedAction.details.subtasks.map((st: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#ACACB8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#888898] my-2 bg-[#0D0D0D] p-2.5 rounded-lg border border-[#2E2E2E]">
                        <div>
                          Project: <span className="text-white font-medium">{msg.proposedAction.details.projectName || "WEB"}</span>
                        </div>
                        <div>
                          Assignee: <span className="text-white font-medium">{msg.proposedAction.details.assigneeName || "Rahul"}</span>
                        </div>
                        <div>
                          Priority: <span className="text-[#FF8C42] font-medium">{msg.proposedAction.details.priority}</span>
                        </div>
                        <div>
                          Due: <span className="text-white font-medium">{msg.proposedAction.details.dueDateFormatted || "Next Week"}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Confirmation Buttons */}
                    <div className="mt-3 flex items-center gap-2">
                      {msg.actionExecuted ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold py-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Action Completed</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleExecuteAction(msg.id, msg.proposedAction!)}
                            disabled={executingActionId === msg.proposedAction.id}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all hover:scale-[1.01]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {executingActionId === msg.proposedAction.id
                                ? "Creating..."
                                : msg.proposedAction.confirmLabel}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-lg bg-[#252525] border border-[#2E2E2E] flex items-center justify-center text-white flex-shrink-0">
                  <User className="w-4 h-4 text-[#888898]" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-purple-400 py-2">
            <Bot className="w-5 h-5 animate-spin" />
            <span>DX AI is querying project data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-[#2E2E2E] bg-[#1A1A1A]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask DX AI or write 'Create task for Rahul'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#0D0D0D] border border-[#2E2E2E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#888898] focus:outline-none focus:border-[#FF6200]/60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-[#FF6200] hover:bg-[#FF8C42] text-white disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(255,98,0,0.2)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
