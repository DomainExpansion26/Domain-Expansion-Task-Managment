const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Domain Expansion Task Management Platform...");

  // Clean existing data
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIProviderConfig.deleteMany({});
  await prisma.automationRule.deleteMany({});
  await prisma.sentEmailLog.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Ishwar Mule",
      email: "admin@domainexpansion.in",
      passwordHash,
      role: "SUPER_ADMIN",
      jobTitle: "Founder & CEO",
      department: "Leadership",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
          inAppTaskAssigned: true,
          inAppTaskUpdated: true,
          inAppMention: true,
          inAppComment: true,
          inAppDueDate: true,
          inAppOverdue: true,
        },
      },
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@domainexpansion.in",
      passwordHash,
      role: "PROJECT_MANAGER",
      jobTitle: "Engineering Lead",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
        },
      },
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "priya@domainexpansion.in",
      passwordHash,
      role: "PROJECT_MANAGER",
      jobTitle: "Product Manager",
      department: "Product",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
        },
      },
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: "Amit Verma",
      email: "amit@domainexpansion.in",
      passwordHash,
      role: "TEAM_MEMBER",
      jobTitle: "Frontend Architect",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
        },
      },
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: "Sneha Patel",
      email: "sneha@domainexpansion.in",
      passwordHash,
      role: "TEAM_MEMBER",
      jobTitle: "UI/UX Designer",
      department: "Design",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
        },
      },
    },
  });

  const vikram = await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "vikram@domainexpansion.in",
      passwordHash,
      role: "TEAM_MEMBER",
      jobTitle: "Backend Engineer",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      notificationPref: {
        create: {
          emailTaskAssigned: true,
          emailTaskUpdated: true,
          emailMention: true,
          emailComment: true,
          emailDueDate: true,
          emailOverdue: true,
        },
      },
    },
  });

  console.log("✅ Users created (password: password123)");

  // 2. Create Projects
  const projectWeb = await prisma.project.create({
    data: {
      name: "Website Development Platform",
      key: "WEB",
      description: "Core high-performance web platform architecture, customer portal, and responsive design system.",
      leadId: rahul.id,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-09-30"),
      status: "ACTIVE",
      members: {
        create: [
          { userId: admin.id, role: "LEAD" },
          { userId: rahul.id, role: "LEAD" },
          { userId: amit.id, role: "MEMBER" },
          { userId: sneha.id, role: "MEMBER" },
          { userId: vikram.id, role: "MEMBER" },
        ],
      },
      labels: {
        create: [
          { name: "Frontend", color: "#FF6200" },
          { name: "Backend", color: "#6D28D9" },
          { name: "UI/UX", color: "#EC4899" },
          { name: "Security", color: "#EF4444" },
          { name: "Performance", color: "#10B981" },
        ],
      },
    },
  });

  const projectDXAI = await prisma.project.create({
    data: {
      name: "DX AI Expansion Engine",
      key: "DXAI",
      description: "Intelligent autonomous task assistant, tool calling engine, multi-provider gateway, and workflow automation.",
      leadId: rahul.id,
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-10-15"),
      status: "ACTIVE",
      members: {
        create: [
          { userId: admin.id, role: "LEAD" },
          { userId: rahul.id, role: "LEAD" },
          { userId: amit.id, role: "MEMBER" },
          { userId: sneha.id, role: "MEMBER" },
        ],
      },
      labels: {
        create: [
          { name: "AI Core", color: "#8B5CF6" },
          { name: "LLM Gateway", color: "#3B82F6" },
          { name: "Tool Calling", color: "#06B6D4" },
        ],
      },
    },
  });

  const projectMobile = await prisma.project.create({
    data: {
      name: "Mobile Native Experience",
      key: "APP",
      description: "Cross-platform mobile companion app for team task tracking, real-time push alerts, and quick comments.",
      leadId: priya.id,
      startDate: new Date("2026-08-15"),
      endDate: new Date("2026-11-01"),
      status: "ACTIVE",
      members: {
        create: [
          { userId: admin.id, role: "LEAD" },
          { userId: priya.id, role: "LEAD" },
          { userId: amit.id, role: "MEMBER" },
          { userId: vikram.id, role: "MEMBER" },
        ],
      },
      labels: {
        create: [
          { name: "React Native", color: "#06B6D4" },
          { name: "Push Notifications", color: "#F59E0B" },
        ],
      },
    },
  });

  console.log("✅ Projects created: WEB, DXAI, APP");

  // 3. Create Sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: projectWeb.id,
      name: "Sprint 1 - Core MVP & Workflow",
      goal: "Complete authentication, interactive Kanban board, and task assignment notifications.",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-08-24"),
      status: "ACTIVE",
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: projectWeb.id,
      name: "Sprint 2 - AI Integration & Automation",
      goal: "Integrate multi-provider DX AI assistant, requirements breakdown, and custom status automations.",
      startDate: new Date("2026-08-25"),
      endDate: new Date("2026-09-08"),
      status: "PLANNED",
    },
  });

  // 4. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      taskKey: "WEB-101",
      title: "Design and implement OAuth & JWT Authentication",
      description: "Implement secure session tokens, password hashing with bcrypt, email verification tokens, and role-based permissions for Super Admin, Project Manager, and Team Members.",
      acceptanceCriteria: "- Secure bcrypt password hashing\n- JWT token rotation and secure session cookies\n- Invitation token redemption\n- RBAC middleware protection",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "FEATURE",
      status: "DONE",
      priority: "HIGH",
      reporterId: admin.id,
      dueDate: new Date("2026-08-14"),
      estimatedHours: 12,
      loggedHours: 12,
      position: 0,
      assignees: {
        create: [{ userId: rahul.id }],
      },
      subtasks: {
        create: [
          { title: "Define JWT payload schema", completed: true, assigneeId: rahul.id },
          { title: "Implement bcrypt password validator", completed: true, assigneeId: rahul.id },
          { title: "Add invitation token acceptance endpoint", completed: true, assigneeId: rahul.id },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskKey: "WEB-102",
      title: "Build Jira-Style Kanban Drag and Drop Board",
      description: "Create an interactive drag-and-drop board supporting To Do, In Progress, In Review, Blocked, and Done columns with immediate backend synchronization and activity tracking.",
      acceptanceCriteria: "- Drag card smoothly between columns\n- Instant optimistic update with rollback on failure\n- Record activity log on status change\n- Live column card counters and quick filters",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "TASK",
      status: "IN_PROGRESS",
      priority: "HIGH",
      reporterId: rahul.id,
      dueDate: new Date("2026-08-16"),
      estimatedHours: 16,
      loggedHours: 8,
      position: 1,
      assignees: {
        create: [{ userId: amit.id }],
      },
      subtasks: {
        create: [
          { title: "Configure Drag and Drop wrapper", completed: true, assigneeId: amit.id },
          { title: "Connect status update API endpoint", completed: true, assigneeId: amit.id },
          { title: "Add micro-animations and drop target highlight", completed: false, assigneeId: amit.id },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      taskKey: "WEB-103",
      title: "Implement Domain Expansion Dark Futuristic Design Tokens",
      description: "Craft bespoke Tailwind tokens incorporating Obsidian dark tones (#0D0D0D), Brand Orange (#FF6200), Purple accents (#6D28D9), and glassmorphism borders for maximum visual polish.",
      acceptanceCriteria: "- Harmonious dark palette matching domainexpansion.in\n- Crisp typography using Inter and Outfit\n- Subtle glow effects on active elements\n- Accessible contrast ratios",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "STORY",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      reporterId: rahul.id,
      dueDate: new Date("2026-08-15"),
      estimatedHours: 10,
      loggedHours: 9,
      position: 2,
      assignees: {
        create: [{ userId: sneha.id }],
      },
      subtasks: {
        create: [
          { title: "Define color variables in CSS", completed: true, assigneeId: sneha.id },
          { title: "Create glassmorphic card component", completed: true, assigneeId: sneha.id },
          { title: "Review contrast with accessibility team", completed: true, assigneeId: sneha.id },
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      taskKey: "WEB-104",
      title: "Setup Transactional Email Templates & Notification Center",
      description: "Implement abstracted EmailService with pluggable providers (Resend, SendGrid, Dev Mailbox) and dispatch automated HTML notifications for task assignments, mentions, due dates, and status updates.",
      acceptanceCriteria: "- Transactional email templates for 7 event types\n- Interactive dev mailbox viewer\n- In-app notification bell with unread badge counter\n- Mark all read support",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "TASK",
      status: "TODO",
      priority: "HIGH",
      reporterId: admin.id,
      dueDate: new Date("2026-08-18"),
      estimatedHours: 14,
      loggedHours: 0,
      position: 3,
      assignees: {
        create: [{ userId: rahul.id }, { userId: vikram.id }],
      },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      taskKey: "WEB-105",
      title: "Fix search index latency during full-text query",
      description: "Investigate database query execution plan during Ctrl+K global search when matching across tasks, projects, comments, and members.",
      acceptanceCriteria: "- Query execution under 50ms\n- Proper composite indexing on task title and keys\n- Fuzzy search tolerance",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "BUG",
      status: "BLOCKED",
      priority: "CRITICAL",
      reporterId: rahul.id,
      dueDate: new Date("2026-08-14"), // Overdue task!
      estimatedHours: 8,
      loggedHours: 4,
      position: 4,
      assignees: {
        create: [{ userId: vikram.id }],
      },
    },
  });

  const taskDX1 = await prisma.task.create({
    data: {
      taskKey: "DXAI-301",
      title: "Multi-Provider AI Gateway (OpenAI, Claude, Gemini, OpenRouter)",
      description: "Build unified AI gateway capable of seamlessly routing prompts, tool definitions, and token streaming across OpenAI, Anthropic, Google Gemini, and OpenRouter.",
      acceptanceCriteria: "- Pluggable provider architecture\n- Admin key configuration & test connection modal\n- Token usage and cost tracker per query",
      projectId: projectDXAI.id,
      taskType: "FEATURE",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      reporterId: admin.id,
      dueDate: new Date("2026-08-19"),
      estimatedHours: 20,
      loggedHours: 10,
      position: 0,
      assignees: {
        create: [{ userId: amit.id }],
      },
    },
  });

  const taskDX2 = await prisma.task.create({
    data: {
      taskKey: "DXAI-302",
      title: "Interactive AI Action Confirmation & Tool Calling Safety",
      description: "Implement controlled tool calling where AI generates structured task creation/update proposals with preview cards, requiring explicit user approval before execution.",
      acceptanceCriteria: "- AI tool calling for get_tasks, create_task, update_task\n- UI preview card with [Confirm Action] and [Cancel] buttons\n- Backend permission check and audit log recording",
      projectId: projectDXAI.id,
      taskType: "STORY",
      status: "IN_REVIEW",
      priority: "HIGH",
      reporterId: rahul.id,
      dueDate: new Date("2026-08-20"),
      estimatedHours: 15,
      loggedHours: 13,
      position: 1,
      assignees: {
        create: [{ userId: sneha.id }],
      },
    },
  });

  console.log("✅ Seeded Tasks with Subtasks, Assignees, and Priorities");

  // 5. Create Comments & Mentions
  await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: rahul.id,
      content: "@Amit Verma Please ensure the Kanban cards display priority badges, avatar chips, and subtask progress bars clearly.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: amit.id,
      content: "Done! Implemented smooth drag animations with brand orange glow and column counter indicators.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task5.id,
      authorId: vikram.id,
      content: "Waiting on database index profiling. Currently blocked until we benchmark the SQLite/Postgres query plan.",
    },
  });

  // 6. Create Activities
  await prisma.activity.create({
    data: {
      taskId: task2.id,
      projectId: projectWeb.id,
      userId: rahul.id,
      action: "CREATED",
      description: "Rahul Sharma created WEB-102: Build Jira-Style Kanban Drag and Drop Board",
    },
  });

  await prisma.activity.create({
    data: {
      taskId: task2.id,
      projectId: projectWeb.id,
      userId: rahul.id,
      action: "ASSIGNED",
      fieldChanged: "assignee",
      oldValue: "Unassigned",
      newValue: "Amit Verma",
      description: "Rahul Sharma assigned WEB-102 to Amit Verma",
    },
  });

  await prisma.activity.create({
    data: {
      taskId: task2.id,
      projectId: projectWeb.id,
      userId: amit.id,
      action: "STATUS_CHANGED",
      fieldChanged: "status",
      oldValue: "TODO",
      newValue: "IN_PROGRESS",
      description: "Amit Verma moved WEB-102 from To Do to In Progress",
    },
  });

  // 7. Create Notifications
  await prisma.notification.create({
    data: {
      userId: amit.id,
      title: "New Task Assigned",
      message: "Rahul Sharma assigned WEB-102: Build Jira-Style Kanban Drag and Drop Board to you",
      type: "TASK_ASSIGNED",
      link: "/tasks/WEB-102",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: amit.id,
      title: "Mentioned in Comment",
      message: "Rahul Sharma mentioned you in a comment on WEB-102",
      type: "MENTION",
      link: "/tasks/WEB-102",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: vikram.id,
      title: "Task Overdue Alert",
      message: "WEB-105: Fix search index latency is overdue (was due yesterday)",
      type: "OVERDUE",
      link: "/tasks/WEB-105",
      isRead: false,
    },
  });

  // 8. Create Automation Rules
  await prisma.automationRule.create({
    data: {
      name: "Notify Assignee on Task Assignment",
      triggerType: "TASK_ASSIGNED",
      conditionsJson: JSON.stringify({ isAssigned: true }),
      actionType: "SEND_EMAIL_AND_NOTIFICATION",
      actionPayloadJson: JSON.stringify({ template: "TASK_ASSIGNED" }),
      isEnabled: true,
      createdById: admin.id,
    },
  });

  await prisma.automationRule.create({
    data: {
      name: "Alert Project Lead when Task is Moved to Done",
      triggerType: "STATUS_CHANGED",
      conditionsJson: JSON.stringify({ toStatus: "DONE" }),
      actionType: "NOTIFY_PM",
      actionPayloadJson: JSON.stringify({ template: "TASK_COMPLETED" }),
      isEnabled: true,
      createdById: admin.id,
    },
  });

  await prisma.automationRule.create({
    data: {
      name: "Flag Overdue Tasks Automatically",
      triggerType: "TASK_OVERDUE",
      conditionsJson: JSON.stringify({ overdueDays: 1 }),
      actionType: "NOTIFY_USER",
      actionPayloadJson: JSON.stringify({ priority: "CRITICAL" }),
      isEnabled: true,
      createdById: admin.id,
    },
  });

  // 9. Create AI Provider Configurations
  await prisma.aIProviderConfig.createMany({
    data: [
      {
        provider: "OPENAI",
        defaultModel: "gpt-4o",
        isEnabled: true,
        monthlyBudget: 150.0,
        requestLimit: 2500,
        currentUsageCost: 14.25,
      },
      {
        provider: "ANTHROPIC",
        defaultModel: "claude-3-5-sonnet-20241022",
        isEnabled: true,
        monthlyBudget: 200.0,
        requestLimit: 3000,
        currentUsageCost: 28.5,
      },
      {
        provider: "GEMINI",
        defaultModel: "gemini-1.5-pro-latest",
        isEnabled: true,
        monthlyBudget: 100.0,
        requestLimit: 5000,
        currentUsageCost: 6.8,
      },
      {
        provider: "OPENROUTER",
        defaultModel: "meta-llama/llama-3.3-70b-instruct",
        isEnabled: true,
        monthlyBudget: 50.0,
        requestLimit: 1000,
        currentUsageCost: 2.1,
      },
    ],
  });

  // 10. Sample Sent Email Log
  await prisma.sentEmailLog.create({
    data: {
      toEmail: "amit@domainexpansion.in",
      subject: "You have been assigned WEB-102: Build Jira-Style Kanban Drag and Drop Board",
      template: "TASK_ASSIGNED",
      htmlBody: "<div style='font-family:sans-serif; background:#0D0D0D; color:#fff; padding:20px;'><h2 style='color:#FF6200;'>Domain Expansion Task Assignment</h2><p>You have been assigned to <strong>WEB-102: Build Jira-Style Kanban Drag and Drop Board</strong> by Rahul Sharma.</p><p>Priority: High | Due: Tomorrow</p></div>",
      status: "SENT",
    },
  });

  console.log("🚀 Database seeded successfully with complete enterprise demo data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
