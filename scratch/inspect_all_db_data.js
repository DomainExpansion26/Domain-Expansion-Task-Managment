const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectDatabase() {
  console.log("==================================================");
  console.log("       POSTGRESQL DATABASE DATA AUDIT REPORT      ");
  console.log("==================================================\n");

  try {
    // 1. Users
    const users = await prisma.user.findMany({
      include: { hrProfile: true },
    });
    console.log(`📌 USERS (Total: ${users.length})`);
    if (users.length === 0) {
      console.log("   (No users found in database)");
    } else {
      users.forEach((u, i) => {
        console.log(`   [${i + 1}] ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive} | HRMS: ${u.hrProfile?.status || "None"}`);
      });
    }

    // 2. Projects
    const projects = await prisma.project.findMany();
    console.log(`\n📌 PROJECTS (Total: ${projects.length})`);
    if (projects.length === 0) {
      console.log("   (No projects found in database)");
    } else {
      projects.forEach((p, i) => {
        console.log(`   [${i + 1}] ID: ${p.id} | Key: ${p.key} | Name: ${p.name} | Status: ${p.status}`);
      });
    }

    // 3. Tasks
    const tasks = await prisma.task.findMany({
      include: {
        assignees: { include: { user: true } },
        project: true,
      },
    });
    console.log(`\n📌 TASKS (Total: ${tasks.length})`);
    if (tasks.length === 0) {
      console.log("   (No tasks found in database)");
    } else {
      tasks.forEach((t, i) => {
        const assignees = t.assignees.map((a) => a.user?.name).filter(Boolean).join(", ");
        console.log(`   [${i + 1}] Key: ${t.taskKey} | Title: ${t.title} | Status: ${t.status} | Priority: ${t.priority} | Project: ${t.project?.name || "N/A"} | Assignee: ${assignees || "Unassigned"}`);
      });
    }

    // 4. QA Bugs
    const bugs = await prisma.qABug.findMany({
      include: {
        assignedTo: true,
        createdBy: true,
        project: true,
      },
    });
    console.log(`\n📌 QA BUGS (Total: ${bugs.length})`);
    if (bugs.length === 0) {
      console.log("   (No QA bugs found in database)");
    } else {
      bugs.forEach((b, i) => {
        console.log(`   [${i + 1}] Key: ${b.bugKey} | Title: ${b.title} | Status: ${b.status} | Severity: ${b.severity} | Dev: ${b.assignedTo?.name || "Unassigned"}`);
      });
    }

    // 5. QA Tickets
    const tickets = await prisma.qATicket.findMany();
    console.log(`\n📌 QA TICKETS (Total: ${tickets.length})`);
    if (tickets.length === 0) {
      console.log("   (No QA tickets found in database)");
    } else {
      tickets.forEach((tk, i) => {
        console.log(`   [${i + 1}] Key: ${tk.ticketKey} | Title: ${tk.title} | Status: ${tk.status}`);
      });
    }

    // 6. HRMS Attendance & Leaves
    const attendanceCount = await prisma.attendance.count().catch(() => 0);
    const leaveCount = await prisma.leave.count().catch(() => 0);
    console.log(`\n📌 HRMS DATA`);
    console.log(`   Attendance Records: ${attendanceCount}`);
    console.log(`   Leave Records: ${leaveCount}`);

    // 7. Audit Logs & Notifications
    const auditLogsCount = await prisma.auditLog.count().catch(() => 0);
    const notificationCount = await prisma.notification.count().catch(() => 0);
    console.log(`\n📌 PLATFORM ACTIVITY`);
    console.log(`   Audit Logs: ${auditLogsCount}`);
    console.log(`   Notifications: ${notificationCount}`);

    console.log("\n==================================================");
  } catch (err) {
    console.error("Database Inspection Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
