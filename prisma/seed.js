const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Domain Expansion Enterprise Task Management + QA + HRMS Platform...");

  // Clean existing data in dependency order
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.taskRelation.deleteMany({});
  await prisma.qABug.deleteMany({});
  await prisma.qATicket.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.sprint.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.hRProfile.deleteMany({});
  await prisma.aIUsage.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.aIProviderConfig.deleteMany({});
  await prisma.automationRule.deleteMany({});
  await prisma.sentEmailLog.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // Tomorrow's date for birthday demo
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDOB = new Date(Date.UTC(1995, tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0));

  // 1. Create Users with 6 RBAC Roles & Hierarchy
  // Super Admin
  const admin = await prisma.user.create({
    data: {
      name: "Ishwar Mule",
      email: "admin@domainexpansion.in",
      passwordHash,
      role: "SUPER_ADMIN",
      jobTitle: "Founder & Chief Architect",
      department: "Executive Leadership",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      hrProfile: {
        create: {
          employeeId: "EMP-1001",
          dateOfBirth: new Date("1988-04-12"),
          joiningDate: new Date("2024-01-01"),
          phone: "+91 98765 43210",
          designation: "Chief Executive Officer",
          department: "Leadership",
          status: "ACTIVE",
        },
      },
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

  // HR Admin
  const pooja = await prisma.user.create({
    data: {
      name: "Pooja Sharma",
      email: "pooja@domainexpansion.in",
      passwordHash,
      role: "HR_ADMIN",
      jobTitle: "Head of People & HR Operations",
      department: "Human Resources",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: admin.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1002",
          dateOfBirth: new Date("1992-06-18"),
          joiningDate: new Date("2024-03-01"),
          phone: "+91 98765 43211",
          designation: "HR Director",
          department: "Human Resources",
          status: "ACTIVE",
        },
      },
    },
  });

  // Manager
  const rahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "rahul@domainexpansion.in",
      passwordHash,
      role: "MANAGER",
      jobTitle: "Engineering Manager",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: admin.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1003",
          dateOfBirth: new Date("1990-11-25"),
          joiningDate: new Date("2024-02-15"),
          phone: "+91 98765 43212",
          designation: "Engineering Manager",
          department: "Engineering",
          status: "ACTIVE",
        },
      },
    },
  });

  // Team Lead
  const priya = await prisma.user.create({
    data: {
      name: "Priya Nair",
      email: "priya@domainexpansion.in",
      passwordHash,
      role: "TEAM_LEAD",
      jobTitle: "Technical Team Lead",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: rahul.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1004",
          dateOfBirth: new Date("1993-08-30"),
          joiningDate: new Date("2024-04-01"),
          phone: "+91 98765 43213",
          designation: "Team Lead - Development",
          department: "Engineering",
          status: "ACTIVE",
        },
      },
    },
  });

  // QA Engineer (With Birthday Tomorrow for Instant Banner Demonstration!)
  const neha = await prisma.user.create({
    data: {
      name: "Neha Gupta",
      email: "neha@domainexpansion.in",
      passwordHash,
      role: "QA",
      jobTitle: "Lead QA Automation Engineer",
      department: "Quality Assurance",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: rahul.id,
      teamLeadId: priya.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1005",
          dateOfBirth: tomorrowDOB, // 🎉 Tomorrow's Birthday!
          joiningDate: new Date("2024-05-10"),
          phone: "+91 98765 43214",
          designation: "Lead QA Engineer",
          department: "Quality Assurance",
          status: "ACTIVE",
        },
      },
    },
  });

  // Member 1
  const amit = await prisma.user.create({
    data: {
      name: "Amit Verma",
      email: "amit@domainexpansion.in",
      passwordHash,
      role: "MEMBER",
      jobTitle: "Frontend Architect",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: rahul.id,
      teamLeadId: priya.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1006",
          dateOfBirth: new Date("1996-01-15"),
          joiningDate: new Date("2024-06-01"),
          phone: "+91 98765 43215",
          designation: "Frontend Engineer",
          department: "Engineering",
          status: "ACTIVE",
        },
      },
    },
  });

  // Member 2
  const sneha = await prisma.user.create({
    data: {
      name: "Sneha Patel",
      email: "sneha@domainexpansion.in",
      passwordHash,
      role: "MEMBER",
      jobTitle: "UI/UX Designer",
      department: "Design",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: rahul.id,
      teamLeadId: priya.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1007",
          dateOfBirth: new Date("1997-09-20"),
          joiningDate: new Date("2024-06-15"),
          phone: "+91 98765 43216",
          designation: "Product Designer",
          department: "Design",
          status: "ACTIVE",
        },
      },
    },
  });

  // Member 3
  const vikram = await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "vikram@domainexpansion.in",
      passwordHash,
      role: "MEMBER",
      jobTitle: "Backend Engineer",
      department: "Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      isEmailVerified: true,
      isActive: true,
      managerId: rahul.id,
      teamLeadId: priya.id,
      hrProfile: {
        create: {
          employeeId: "EMP-1008",
          dateOfBirth: new Date("1994-12-05"),
          joiningDate: new Date("2024-07-01"),
          phone: "+91 98765 43217",
          designation: "Backend Specialist",
          department: "Engineering",
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("✅ 6 Roles & Users created with Manager & Team Lead hierarchy!");

  // 2. Create Projects
  const projectWeb = await prisma.project.create({
    data: {
      name: "Website Development Platform",
      key: "WEB",
      description: "Core high-performance web platform architecture, customer portal, and responsive design system.",
      leadId: rahul.id,
      managerId: rahul.id,
      teamLeadId: priya.id,
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-09-30"),
      status: "ACTIVE",
      members: {
        create: [
          { userId: admin.id, role: "LEAD" },
          { userId: rahul.id, role: "LEAD" },
          { userId: priya.id, role: "LEAD" },
          { userId: neha.id, role: "MEMBER" },
          { userId: amit.id, role: "MEMBER" },
          { userId: sneha.id, role: "MEMBER" },
          { userId: vikram.id, role: "MEMBER" },
        ],
      },
      labels: {
        create: [
          { name: "Frontend", color: "#FF6200" },
          { name: "Backend", color: "#6D28D9" },
          { name: "QA & Testing", color: "#3B82F6" },
          { name: "Security", color: "#EF4444" },
          { name: "HRMS", color: "#EC4899" },
        ],
      },
    },
  });

  const projectDXAI = await prisma.project.create({
    data: {
      name: "DX AI OpenRouter Copilot",
      key: "DXAI",
      description: "Intelligent OpenRouter-powered task assistant, tool calling engine, and AI requirement breakdown.",
      leadId: rahul.id,
      managerId: rahul.id,
      teamLeadId: priya.id,
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
    },
  });

  // 3. Create Sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: projectWeb.id,
      name: "Sprint 1 - Core RBAC & Enterprise Portal",
      goal: "Complete 6-role RBAC, Super Admin centralized management, QA testing suite, and HRMS 8-hour rule attendance.",
      startDate: new Date("2026-08-10"),
      endDate: new Date("2026-08-24"),
      status: "ACTIVE",
    },
  });

  // 4. Create Core Tasks
  const task1 = await prisma.task.create({
    data: {
      taskKey: "WEB-101",
      title: "Design and implement 6-Role RBAC Authorization Engine",
      description: "Implement strictly validated permissions for Super Admin, HR Admin, Manager, Team Lead, Member, and QA with route-level security.",
      acceptanceCriteria: "- Strict backend route authorization\n- Super Admin global override\n- Public signup limited to Member\n- Hierarchy based access scopes",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "FEATURE",
      status: "DONE",
      priority: "HIGH",
      reporterId: admin.id,
      dueDate: new Date("2026-08-18"),
      estimatedHours: 16,
      loggedHours: 16,
      position: 0,
      assignees: { create: [{ userId: rahul.id }, { userId: amit.id }] },
      subtasks: {
        create: [
          { title: "Define 6-role matrix in permissions.ts", completed: true, assigneeId: rahul.id },
          { title: "Secure backend endpoints with requireRole()", completed: true, assigneeId: rahul.id },
          { title: "Sanitize public /signup endpoint", completed: true, assigneeId: amit.id },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskKey: "WEB-102",
      title: "Build HRMS Daily Attendance with 8-Hour Rule Calculator",
      description: "Compute daily working hours as (Punch Out - Punch In - Break Duration). If >= 8.0h -> FULL_DAY, if < 8.0h -> HALF_DAY.",
      acceptanceCriteria: "- Real-time punch in/out buttons\n- Automatic calculation on server\n- Interactive calendar with details modal\n- Monthly statistics cards",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "FEATURE",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      reporterId: pooja.id,
      dueDate: new Date("2026-08-20"),
      estimatedHours: 20,
      loggedHours: 12,
      position: 1,
      assignees: { create: [{ userId: amit.id }] },
      subtasks: {
        create: [
          { title: "Create Attendance model & 8-hour utility", completed: true, assigneeId: amit.id },
          { title: "Build interactive calendar grid", completed: true, assigneeId: amit.id },
          { title: "Add birthday celebration banner", completed: true, assigneeId: amit.id },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      taskKey: "WEB-103",
      title: "Implement QA Ticket & Multi-Bug Defect Triage Lifecycle",
      description: "Mandatory field validation for QA tickets (Title, Description, Dates, Assignee). Link multiple defects per QA ticket with status progression.",
      acceptanceCriteria: "- Mandatory field checks on submission\n- Open, In Progress, Ready For Testing, Test Failed, Closed transitions\n- OpenRouter AI bug reproduction helper",
      projectId: projectWeb.id,
      sprintId: sprint1.id,
      taskType: "FEATURE",
      status: "READY_FOR_TESTING",
      priority: "HIGH",
      reporterId: priya.id,
      dueDate: new Date("2026-08-22"),
      estimatedHours: 18,
      loggedHours: 14,
      position: 2,
      assignees: { create: [{ userId: neha.id }] },
    },
  });

  // 5. Create Task Relations
  await prisma.taskRelation.create({
    data: {
      sourceTaskId: task1.id,
      targetTaskId: task2.id,
      relationType: "RELATES_TO",
    },
  });

  // 6. Create QA Tickets & Bugs (Master Prompt Section 16-19)
  const qaTicket1 = await prisma.qATicket.create({
    data: {
      ticketKey: "WEB-QA-101",
      title: "Authentication & Role Security Test Plan",
      description: "Verify that public registration rejects privileged role elevation and that /superadmin is completely inaccessible to Member tokens.",
      startDate: new Date("2026-08-16"),
      endDate: new Date("2026-08-22"),
      status: "READY_FOR_TESTING",
      priority: "CRITICAL",
      projectId: projectWeb.id,
      relatedTaskId: task1.id,
      assignedToId: neha.id,
      createdById: priya.id,
    },
  });

  const bug1 = await prisma.qABug.create({
    data: {
      bugKey: "BUG-001",
      title: "Public registration must strictly register MEMBER role only",
      description: "1. Open /signup\n2. Submit account form\nExpected: Created with role MEMBER\nActual: Verified role is MEMBER in backend.",
      priority: "CRITICAL",
      severity: "CRITICAL",
      status: "FIXED",
      ticketId: qaTicket1.id,
      projectId: projectWeb.id,
      assignedToId: amit.id,
      createdById: neha.id,
    },
  });

  const bug2 = await prisma.qABug.create({
    data: {
      bugKey: "BUG-002",
      title: "8-hour calculation logic discrepancy under 15m break window",
      description: "Verify that 8h 15m elapsed with 15m break computes to exact 8.00h Full Day status.",
      priority: "HIGH",
      severity: "MAJOR",
      status: "OPEN",
      ticketId: qaTicket1.id,
      projectId: projectWeb.id,
      assignedToId: amit.id,
      createdById: neha.id,
    },
  });

  const qaTicket2 = await prisma.qATicket.create({
    data: {
      ticketKey: "WEB-QA-102",
      title: "HRMS Daily Attendance 8-Hour Rule Test Suite",
      description: "Comprehensive test matrix for Punch In, Punch Out, Break Duration deduction, and Monthly Calendar stats.",
      startDate: new Date("2026-08-17"),
      endDate: new Date("2026-08-24"),
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: projectWeb.id,
      relatedTaskId: task2.id,
      assignedToId: neha.id,
      createdById: rahul.id,
    },
  });

  // 7. Create Sample Attendance Records (8-Hour Rule Demonstration)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Full Day Demo (>= 8h): 09:00 to 17:30 with 30m break = 8.0h -> FULL_DAY
  const inToday = new Date(today);
  inToday.setUTCHours(9, 0, 0, 0);
  const outToday = new Date(today);
  outToday.setUTCHours(17, 30, 0, 0);

  await prisma.attendance.create({
    data: {
      userId: amit.id,
      date: today,
      punchIn: inToday,
      punchOut: outToday,
      breakDurationMinutes: 30,
      totalWorkingHours: 8.0,
      status: "FULL_DAY",
      notes: "Sprint 1 Feature Implementation",
    },
  });

  // Half Day Demo (< 8h): 09:30 to 14:30 = 5.0h -> HALF_DAY
  const inYest = new Date(yesterday);
  inYest.setUTCHours(9, 30, 0, 0);
  const outYest = new Date(yesterday);
  outYest.setUTCHours(14, 30, 0, 0);

  await prisma.attendance.create({
    data: {
      userId: amit.id,
      date: yesterday,
      punchIn: inYest,
      punchOut: outYest,
      breakDurationMinutes: 0,
      totalWorkingHours: 5.0,
      status: "HALF_DAY",
      notes: "Doctor appointment in afternoon",
    },
  });

  // Full Day for Vikram
  await prisma.attendance.create({
    data: {
      userId: vikram.id,
      date: today,
      punchIn: inToday,
      punchOut: outToday,
      breakDurationMinutes: 30,
      totalWorkingHours: 8.0,
      status: "FULL_DAY",
    },
  });

  // 8. Create Leave Applications & Approvals
  await prisma.leave.create({
    data: {
      userId: amit.id,
      leaveType: "CASUAL",
      startDate: new Date("2026-08-25"),
      endDate: new Date("2026-08-26"),
      daysCount: 2,
      reason: "Family wedding ceremony attendance",
      status: "PENDING",
    },
  });

  await prisma.leave.create({
    data: {
      userId: sneha.id,
      leaveType: "SICK",
      startDate: new Date("2026-08-12"),
      endDate: new Date("2026-08-13"),
      daysCount: 2,
      reason: "Viral flu and doctor advised rest",
      status: "APPROVED",
      approverId: rahul.id,
      approverComment: "Approved. Take care Sneha.",
      actionAt: new Date("2026-08-12"),
    },
  });

  // 9. Create Notifications
  await prisma.notification.create({
    data: {
      userId: amit.id,
      title: "Welcome to Domain Expansion Portal",
      message: "Your enterprise account is ready. Explore tasks, QA defects, and HRMS attendance.",
      type: "SYSTEM",
      link: "/",
    },
  });

  await prisma.notification.create({
    data: {
      userId: neha.id,
      title: "QA Ticket Assigned: WEB-QA-101",
      message: "Priya Nair assigned QA Ticket WEB-QA-101: Authentication & Role Security Test Plan to you.",
      type: "QA_UPDATE",
      link: "/qa?ticket=WEB-QA-101",
    },
  });

  await prisma.notification.create({
    data: {
      userId: rahul.id,
      title: "New Leave Application Pending",
      message: "Amit Verma applied for 2 day(s) CASUAL leave.",
      type: "LEAVE_UPDATE",
      link: "/hradmin",
    },
  });

  // 10. OpenRouter AI Configuration (Exclusive Provider)
  await prisma.aIProviderConfig.upsert({
    where: { provider: "OPENROUTER" },
    create: {
      provider: "OPENROUTER",
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      isEnabled: true,
      monthlyBudget: 100.0,
      requestLimit: 5000,
      currentUsageCost: 0.0,
    },
    update: {
      isEnabled: true,
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
    },
  });

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SYSTEM_INITIALIZED",
      entityType: "SYSTEM",
      detailsJson: JSON.stringify({
        version: "2.0-ENTERPRISE",
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "TEAM_LEAD", "MEMBER", "QA"],
        modules: ["TASKS", "KANBAN", "QA", "HRMS", "SUPER_ADMIN", "HR_ADMIN"],
      }),
    },
  });

  console.log("🚀 Complete Domain Expansion Enterprise Database Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
