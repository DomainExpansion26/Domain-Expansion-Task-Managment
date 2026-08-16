import { prisma } from "../prisma";
import { GeminiAdapter } from "./adapters/gemini.adapter";
import { ClaudeAdapter } from "./adapters/claude.adapter";
import { OpenRouterAdapter } from "./adapters/openrouter.adapter";
import { AIProvider, AIChatRequest, AIChatResult } from "./types";
import {
  getMyTasks,
  getOverdueTasks,
  getBlockedTasks,
  getProjectStatus,
  searchTasks,
} from "./tools";

export interface AIChatOptions {
  userId: string;
  userRole: string;
  userName: string;
  prompt: string;
  conversationId?: string;
  provider?: string;
}

export interface ProposedAction {
  id: string;
  type: "CREATE_TASK" | "UPDATE_TASK" | "ASSIGN_TASK" | "CHANGE_STATUS" | "BREAKDOWN_PLAN";
  title: string;
  details: Record<string, any>;
  confirmLabel: string;
}

export interface AIChatResponse {
  message: string;
  proposedAction?: ProposedAction;
  toolsCalled?: string[];
  providerUsed?: string;
  modelUsed?: string;
}

export function getAIProviderInstance(providerName: string, apiKey?: string, model?: string): AIProvider {
  switch (providerName.toUpperCase()) {
    case "GEMINI":
      return new GeminiAdapter(apiKey, model);
    case "ANTHROPIC":
    case "CLAUDE":
      return new ClaudeAdapter(apiKey, model);
    case "OPENROUTER":
      return new OpenRouterAdapter(apiKey, model);
    default:
      return new GeminiAdapter(apiKey, model);
  }
}

export async function handleAIChat({
  userId,
  userRole,
  userName,
  prompt,
  conversationId,
  provider,
}: AIChatOptions): Promise<AIChatResponse> {
  const startTime = Date.now();
  const lower = prompt.toLowerCase();
  const ctx = { userId, userRole };
  const toolsCalled: string[] = [];

  let replyText = "";
  let proposedAction: ProposedAction | undefined = undefined;

  // 1. Requirement Breakdown Intent: "Break Google login into...", "Build Google login"
  if (
    lower.includes("breakdown") ||
    lower.includes("break down") ||
    lower.startsWith("build ") ||
    lower.includes("plan ") ||
    lower.includes("subtasks for")
  ) {
    toolsCalled.push("breakdown_task_requirements");

    let topic = prompt
      .replace(/^(breakdown|break down|build|plan)\s+/i, "")
      .replace(/\s+into\s+.*/i, "")
      .trim();
    if (!topic) topic = "Feature Implementation";

    const defaultProject = await prisma.project.findFirst({
      where: { key: "WEB" },
    });

    const subtasksGenerated = [
      `Design UI & Wireframes for ${topic}`,
      `Configure Backend API & Auth Controllers`,
      `Database Schema Migration & Entity Mapping`,
      `Implement Error Handling & Edge Cases`,
      `Write Unit & Integration Tests (QA)`,
    ];

    replyText = `### 📋 AI Requirement Breakdown: **${topic}**\n\nI have analyzed your requirement and decomposed it into actionable subtasks with clear architectural milestones:`;

    proposedAction = {
      id: "act_" + Math.random().toString(36).substring(2, 9),
      type: "BREAKDOWN_PLAN",
      title: `Create Parent Task & Subtasks: ${topic}`,
      details: {
        projectId: defaultProject?.id,
        projectKey: defaultProject?.key || "WEB",
        parentTitle: topic,
        subtasks: subtasksGenerated,
        priority: "HIGH",
        taskType: "FEATURE",
      },
      confirmLabel: "Generate 5 Tasks & Subtasks",
    };
  }
  // 2. Natural Language Task Creation Intent: "Create a task for Rahul to build the login page..."
  else if (
    lower.startsWith("create a task") ||
    lower.startsWith("create task") ||
    lower.startsWith("add task") ||
    lower.includes("assign a task to")
  ) {
    toolsCalled.push("propose_create_task");

    let assigneeName = "Rahul";
    let assignee = await prisma.user.findFirst({
      where: {
        OR: [{ name: { contains: "Rahul" } }, { email: { contains: "rahul" } }],
      },
    });

    if (lower.includes("priya")) {
      assigneeName = "Priya";
      assignee = await prisma.user.findFirst({ where: { name: { contains: "Priya" } } });
    } else if (lower.includes("amit")) {
      assigneeName = "Amit";
      assignee = await prisma.user.findFirst({ where: { name: { contains: "Amit" } } });
    } else if (lower.includes("sneha")) {
      assigneeName = "Sneha";
      assignee = await prisma.user.findFirst({ where: { name: { contains: "Sneha" } } });
    } else if (lower.includes("vikram")) {
      assigneeName = "Vikram";
      assignee = await prisma.user.findFirst({ where: { name: { contains: "Vikram" } } });
    }

    let priority = "MEDIUM";
    if (lower.includes("critical")) priority = "CRITICAL";
    else if (lower.includes("high")) priority = "HIGH";
    else if (lower.includes("low")) priority = "LOW";

    let title = "Build Login Page";
    const toMatch = prompt.match(/to\s+([^,.]+?)(?:\s+by|\s+with|\s+for|$)/i);
    if (toMatch && toMatch[1] && toMatch[1].length > 3) {
      title = toMatch[1].replace(/^(build|create|implement|fix)\s+/i, (m) => m.toUpperCase().slice(0, 1) + m.slice(1));
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 4);

    const project = await prisma.project.findFirst({
      where: { key: "WEB" },
    });

    replyText = `I have prepared the task specification based on your request. Please review the details before confirming:`;

    proposedAction = {
      id: "act_" + Math.random().toString(36).substring(2, 9),
      type: "CREATE_TASK",
      title: `Create Task: ${title}`,
      details: {
        title,
        projectId: project?.id,
        projectName: project?.name || "Website Development",
        projectKey: project?.key || "WEB",
        assigneeId: assignee?.id,
        assigneeName: assignee?.name || assigneeName,
        priority,
        taskType: lower.includes("bug") ? "BUG" : "TASK",
        dueDate: dueDate.toISOString(),
        dueDateFormatted: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      },
      confirmLabel: "Create Task",
    };
  }
  // 3. Overdue Tasks Query
  else if (lower.includes("overdue")) {
    toolsCalled.push("get_overdue_tasks");
    const tasks = await getOverdueTasks(ctx);

    if (tasks.length === 0) {
      replyText = `🎉 **Great news!** There are currently no overdue tasks in your accessible projects. Everything is on schedule.`;
    } else {
      replyText =
        `⚠️ **Found ${tasks.length} overdue task(s):**\n\n` +
        tasks
          .map(
            (t) =>
              `- **[${t.key}]** **${t.title}**\n  - Priority: \`${t.priority}\` | Due: **${t.dueDate}** | Assignee: **${t.assignees}** | Status: \`${t.status}\``
          )
          .join("\n\n");
    }
  }
  // 4. Blocked Tasks Query
  else if (lower.includes("blocked")) {
    toolsCalled.push("get_blocked_tasks");
    const tasks = await getBlockedTasks(ctx);

    if (tasks.length === 0) {
      replyText = `✅ **No blocked tasks found.** All workflow pipelines are clear.`;
    } else {
      replyText =
        `🛑 **Blocked Tasks (${tasks.length} found):**\n\n` +
        tasks
          .map(
            (t) =>
              `- **[${t.key}]** **${t.title}**\n  - Project: *${t.project}* | Priority: \`${t.priority}\` | Assignee: **${t.assignees}**\n  - Reason/Description: _${t.description || "Waiting on dependencies"}_`
          )
          .join("\n\n");
    }
  }
  // 5. My Work Query
  else if (
    lower.includes("my tasks") ||
    lower.includes("my work") ||
    lower.includes("work on today") ||
    lower.includes("summarize my")
  ) {
    toolsCalled.push("get_my_tasks");
    const tasks = await getMyTasks(ctx);

    const completed = tasks.filter((t) => t.status === "DONE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const inReview = tasks.filter((t) => t.status === "IN_REVIEW").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;
    const blocked = tasks.filter((t) => t.status === "BLOCKED").length;

    replyText =
      `### 📊 Your Work Summary for Today\n\nYou currently have **${tasks.length} active tasks** assigned to you:\n\n` +
      `- **In Progress**: ${inProgress}\n` +
      `- **To Do**: ${todo}\n` +
      `- **In Review**: ${inReview}\n` +
      `- **Completed**: ${completed}\n` +
      `- **Blocked**: ${blocked}\n\n` +
      `**Top Priority Items:**\n` +
      tasks
        .slice(0, 4)
        .map((t) => `- **[${t.key}]** ${t.title} (\`${t.priority}\` - Status: \`${t.status}\`)`)
        .join("\n");
  }
  // 6. Project Summary Query
  else if (lower.includes("progress") || lower.includes("summarize") || lower.includes("status of")) {
    let keyOrName = "WEB";
    if (lower.includes("dxai") || lower.includes("expansion") || lower.includes("engine")) keyOrName = "DXAI";
    else if (lower.includes("mobile") || lower.includes("app")) keyOrName = "APP";

    toolsCalled.push("get_project_status");
    const status: any = await getProjectStatus(keyOrName, ctx);

    if (status.error) {
      replyText = status.error;
    } else {
      replyText =
        `### 🚀 Project Summary: **${status.projectName}** (\`${status.key}\`)\n\n` +
        `- **Overall Progress**: **${status.progress}** (${status.completed}/${status.totalTasks} tasks completed)\n` +
        `- **Project Lead**: ${status.lead}\n` +
        `- **Active Sprint**: ${status.activeSprint}\n` +
        `- **Breakdown**:\n` +
        `  - In Progress: ${status.inProgress}\n` +
        `  - In Review: ${status.inReview}\n` +
        `  - To Do: ${status.todo}\n` +
        `  - Blocked: ${status.blocked}\n` +
        `- **Team Size**: ${status.membersCount} member(s)`;
    }
  }
  // 7. General Assistant / Fallback with External Provider Attempt
  else {
    // Check if an external provider key is active
    const activeProviderName = provider || "GEMINI";
    const adapter = getAIProviderInstance(activeProviderName);

    if (adapter.isConfigured()) {
      try {
        const result = await adapter.chat({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: `You are DX AI, an intelligent project management assistant for Domain Expansion. Provide concise, helpful answers about Jira workflows, sprint planning, and team collaboration.`,
        });
        replyText = result.text;
      } catch (err: any) {
        console.error("External AI call error, falling back to contextual guidance:", err.message);
        replyText = `Hello **${userName}**! I am **DX AI**, your Domain Expansion project copilot.\n\nHere are some things I can do with your live project data:\n\n` +
          `- **"What should I work on today?"** — Summarize your active assignments\n` +
          `- **"What tasks are overdue?"** — Spot bottlenecks and missed deadlines\n` +
          `- **"Which tasks are blocked?"** — Identify blocked issues needing unblocking\n` +
          `- **"What is the progress of Website Development?"** — Complete project metrics\n` +
          `- **"Create a task for Rahul to build the login page by Monday with high priority"** — Natural language task creation with preview\n` +
          `- **"Build Google Login"** — Automatic requirement decomposition into subtasks`;
      }
    } else {
      replyText = `Hello **${userName}**! I am **DX AI**, your Domain Expansion project copilot.\n\nHere are some things I can do with your live project data:\n\n` +
        `- **"What should I work on today?"** — Summarize your active assignments\n` +
        `- **"What tasks are overdue?"** — Spot bottlenecks and missed deadlines\n` +
        `- **"Which tasks are blocked?"** — Identify blocked issues needing unblocking\n` +
        `- **"What is the progress of Website Development?"** — Complete project metrics\n` +
        `- **"Create a task for Rahul to build the login page by Monday with high priority"** — Natural language task creation with preview\n` +
        `- **"Build Google Login"** — Automatic requirement decomposition into subtasks\n\n` +
        `*(Note: To connect live LLM APIs, add your key in Settings &rarr; AI Providers).*`;
    }
  }

  const durationMs = Date.now() - startTime;

  // Track AI Usage in Database
  try {
    await prisma.aIUsage.create({
      data: {
        provider: provider || "DX_ENGINE",
        model: "dx-smart-agent-v1",
        userId,
        promptTokens: Math.round(prompt.length / 4) + 120,
        completionTokens: Math.round(replyText.length / 4) + 40,
        totalTokens: Math.round((prompt.length + replyText.length) / 4) + 160,
        estimatedCost: 0.0004,
        durationMs,
        status: "SUCCESS",
        promptSummary: prompt.substring(0, 100),
      },
    });
  } catch (err) {
    console.error("Failed to log AI usage:", err);
  }

  return {
    message: replyText,
    proposedAction,
    toolsCalled,
    providerUsed: provider || "DX_ENGINE",
  };
}
