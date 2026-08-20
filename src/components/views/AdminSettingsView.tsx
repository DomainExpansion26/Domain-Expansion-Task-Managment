"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Sparkles,
  Bot,
  Zap,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AdminSettingsViewProps {
  currentUser: any;
}

export function AdminSettingsView({ currentUser }: AdminSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"AI_PROVIDERS" | "AI_USAGE" | "AUTOMATIONS" | "PERMISSIONS">("AI_PROVIDERS");
  const [providers, setProviders] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<{ usages: any[]; metrics: any }>({ usages: [], metrics: {} });
  const [automations, setAutomations] = useState<any[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; message: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit provider modal/state
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelInput, setModelInput] = useState("");
  const [budgetInput, setBudgetInput] = useState(100);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/ai/providers");
      const json = await res.json();
      if (json.success) setProviders(json.data);
    } catch (err) {
      console.error("Failed to load providers:", err);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/ai/usage");
      const json = await res.json();
      if (json.success) setUsageData(json.data);
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  };

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      const json = await res.json();
      if (json.success) setAutomations(json.data);
    } catch (err) {
      console.error("Failed to load automations:", err);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchUsage();
    fetchAutomations();
  }, []);

  const handleTestConnection = async (provider: string, defaultModel: string) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_CONNECTION",
          provider,
          defaultModel,
        }),
      });
      const json = await res.json();
      setTestResult({
        provider,
        message: json.message || "Connection test succeeded",
        success: json.success,
      });
    } catch (err) {
      setTestResult({
        provider,
        message: "Failed to connect to gateway",
        success: false,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      const res = await fetch("/api/ai/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: editingProvider.provider,
          apiKey: apiKeyInput || undefined,
          defaultModel: modelInput,
          monthlyBudget: Number(budgetInput),
          isEnabled: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingProvider(null);
        setApiKeyInput("");
        fetchProviders();
      }
    } catch (err) {
      console.error("Save provider error:", err);
    }
  };

  const handleToggleAutomation = async (id: string, isEnabled: boolean) => {
    try {
      await fetch("/api/automations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isEnabled: !isEnabled }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Toggle automation error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#FF6200]" />
          <span>Platform Administration & Settings</span>
        </h1>
        <p className="text-xs text-[#888898] mt-1">
          Configure Multi-Provider AI models, automation workflows, token budgets, and security permissions
        </p>
      </div>

      {/* Tabs (Responsive scroll on mobile) */}
      <div className="flex items-center gap-2 border-b border-[#2E2E2E] pb-2 text-xs font-semibold overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("AI_PROVIDERS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap ${
            activeTab === "AI_PROVIDERS"
              ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/40"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Gateway Providers</span>
        </button>

        <button
          onClick={() => setActiveTab("AI_USAGE")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap ${
            activeTab === "AI_USAGE"
              ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/40"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>AI Telemetry & Costs</span>
        </button>

        <button
          onClick={() => setActiveTab("AUTOMATIONS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap ${
            activeTab === "AUTOMATIONS"
              ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/40"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Automation Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("PERMISSIONS")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap ${
            activeTab === "PERMISSIONS"
              ? "bg-[#FF6200]/20 text-[#FF8C42] border border-[#FF6200]/40"
              : "text-[#888898] hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>RBAC Matrix</span>
        </button>
      </div>

      {/* Tab 1: AI Providers */}
      {activeTab === "AI_PROVIDERS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold">Multi-Provider Intelligent Router</div>
                <div className="text-[11px] text-purple-300/80 mt-0.5">
                  Connect live API keys for OpenAI, Anthropic, Gemini, or OpenRouter. DX AI automatically falls back to our local smart engine if keys are unset.
                </div>
              </div>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
                testResult.success
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/15 border-red-500/30 text-red-300"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-[#141414] border border-[#2E2E2E] space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-[#FF8C42] font-mono text-xs font-bold">
                        {p.provider}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{p.provider} Gateway</div>
                        <div className="text-[10px] text-[#888898] font-mono">Model: {p.defaultModel}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#888898] mt-4 bg-[#1A1A1A] p-3 rounded-xl border border-[#2E2E2E]">
                    <div>
                      Budget: <span className="text-white font-mono font-bold">${p.monthlyBudget}/mo</span>
                    </div>
                    <div>
                      Spent: <span className="text-[#FF8C42] font-mono font-bold">${p.currentUsageCost}</span>
                    </div>
                    <div className="col-span-2 truncate">
                      API Key: <span className="text-slate-400 font-mono">{p.apiKeyEncrypted || "Configured in Environment"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#2E2E2E]">
                  <button
                    onClick={() => handleTestConnection(p.provider, p.defaultModel)}
                    disabled={testingProvider === p.provider}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#252525] hover:bg-[#303030] text-xs font-semibold text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingProvider === p.provider ? "animate-spin" : ""}`} />
                    <span>{testingProvider === p.provider ? "Testing..." : "Test Connection"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProvider(p);
                      setModelInput(p.defaultModel);
                      setBudgetInput(p.monthlyBudget);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-xs font-bold text-white transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: AI Usage & Telemetry */}
      {activeTab === "AI_USAGE" && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E]">
              <div className="text-[11px] text-[#888898] font-mono uppercase">Total Requests</div>
              <div className="text-2xl font-black text-white mt-1">{usageData.metrics?.totalRequests || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E]">
              <div className="text-[11px] text-[#888898] font-mono uppercase">Tokens Processed</div>
              <div className="text-2xl font-black text-purple-400 mt-1">{usageData.metrics?.totalTokens || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E]">
              <div className="text-[11px] text-[#888898] font-mono uppercase">Total Spend (Est.)</div>
              <div className="text-2xl font-black text-[#FF8C42] mt-1">${usageData.metrics?.totalCost || 0}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#2E2E2E] bg-[#1A1A1A] font-bold text-xs text-white">
              Recent AI Interactions & Tool Executions
            </div>
            <div className="divide-y divide-[#2E2E2E]/60 text-xs">
              {usageData.usages.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-[#1A1A1A]/40">
                  <div className="space-y-1">
                    <div className="font-semibold text-white">{u.promptSummary}</div>
                    <div className="text-[10px] text-[#888898] flex items-center gap-2">
                      <span>User: {u.user?.name}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-purple-400">{u.provider} ({u.model})</span>
                      <span>&bull;</span>
                      <span>Latency: {u.durationMs}ms</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#FF8C42]">{u.totalTokens} tokens</div>
                    <div className="text-[10px] text-[#888898]">{formatDateTime(u.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Automations */}
      {activeTab === "AUTOMATIONS" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] divide-y divide-[#2E2E2E]/60">
            {automations.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{rule.name}</div>
                    <div className="text-[11px] text-[#888898] font-mono mt-0.5">
                      Trigger: <span className="text-[#FF8C42]">{rule.triggerType}</span> &rarr; Action:{" "}
                      <span className="text-emerald-400">{rule.actionType}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAutomation(rule.id, rule.isEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
                    rule.isEnabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-[#252525] text-[#888898]"
                  }`}
                >
                  {rule.isEnabled ? "ACTIVE" : "DISABLED"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: RBAC Matrix */}
      {activeTab === "PERMISSIONS" && (
        <div className="rounded-2xl bg-[#141414] border border-[#2E2E2E] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A1A1A] border-b border-[#2E2E2E] text-[#888898] font-mono text-[10px] uppercase">
              <tr>
                <th className="p-3.5">Permission Scope</th>
                <th className="p-3.5 text-center">Super Admin</th>
                <th className="p-3.5 text-center">Project Manager</th>
                <th className="p-3.5 text-center">Team Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]/60 text-slate-300">
              <tr>
                <td className="p-3.5 font-medium text-white">Create & Delete Projects</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-[#888898]">&mdash;</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-white">Invite & Manage Users</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-[#888898]">&mdash;</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-white">Manage Sprints & Backlog</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-[#888898]">&mdash;</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-white">Create & Update Tasks</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-white">Configure AI Gateways & Keys</td>
                <td className="p-3.5 text-center text-emerald-400 font-bold">&check;</td>
                <td className="p-3.5 text-center text-[#888898]">&mdash;</td>
                <td className="p-3.5 text-center text-[#888898]">&mdash;</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2E2E] bg-[#1A1A1A]">
              <h2 className="text-sm font-bold text-white">Configure {editingProvider.provider}</h2>
              <button
                onClick={() => setEditingProvider(null)}
                className="p-1 rounded-lg hover:bg-[#252525] text-[#888898] hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-... (Leave empty to keep existing)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg pl-3 pr-9 py-2 text-white font-mono focus:outline-none focus:border-[#FF6200]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888898] hover:text-white transition-colors focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showApiKey ? "Hide key" : "Show key"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Default Model</label>
                <input
                  type="text"
                  placeholder="e.g. gpt-4o or claude-3-5-sonnet-20241022"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div>
                <label className="block text-[#ACACB8] font-semibold mb-1">Monthly Budget Limit ($)</label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FF6200]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2E2E2E]">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 rounded-lg text-[#888898] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#FF6200] hover:bg-[#FF8C42] text-white font-bold transition-all shadow-[0_0_15px_rgba(255,98,0,0.3)]"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
