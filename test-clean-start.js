// Test completely clean start from zero dummy data to real dynamic projects, members, tasks, and notifications
const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || "GET",
        headers: defaultHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = {};
          try {
            json = JSON.parse(data);
          } catch {
            json = { text: data };
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runCleanStartTest() {

  let adminCookie = "";
  let memberCookie = "";
  let memberId = "";
  let projectId = "";

  // 1. Super Admin Signs Up
  const adminSignUp = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Suraj Admin",
      email: "suraj@domainexpansion.in",
      password: "password123",
      jobTitle: "Founder & Lead",
      department: "Management",
      role: "SUPER_ADMIN",
    },
  });

  if (adminSignUp.status === 200 && adminSignUp.data.success) {
    adminCookie = adminSignUp.headers["set-cookie"][0].split(";")[0];
  } else {
    throw new Error("Admin registration failed: " + JSON.stringify(adminSignUp.data));
  }

  const adminHeaders = { Cookie: adminCookie };

  // 2. Verify 0 initial projects & 0 initial tasks
  const projectsRes = await request("/api/projects", { headers: adminHeaders });
  const tasksRes = await request("/api/tasks", { headers: adminHeaders });

  if (projectsRes.data.data.length !== 0 || tasksRes.data.data.length !== 0) {
    throw new Error("Database is not clean!");
  }

  // 3. Super Admin Creates First Real Project
  const createProjRes = await request("/api/projects", {
    method: "POST",
    headers: adminHeaders,
    body: {
      name: "Customer Mobile Experience",
      key: "CME",
      description: "Build iOS and Android client applications from scratch.",
    },
  });

  if (createProjRes.status === 200 && createProjRes.data.success) {
    projectId = createProjRes.data.data.id;
  } else {
    throw new Error("Failed to create project: " + JSON.stringify(createProjRes.data));
  }

  // 4. Team Member Signs Up
  const memberSignUp = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Sneha Patel",
      email: "sneha@domainexpansion.in",
      password: "password123",
      jobTitle: "Product Designer",
      department: "Design",
      role: "TEAM_MEMBER",
    },
  });

  if (memberSignUp.status === 200 && memberSignUp.data.success) {
    memberId = memberSignUp.data.data.user.id;
    memberCookie = memberSignUp.headers["set-cookie"][0].split(";")[0];
  } else {
    throw new Error("Member registration failed: " + JSON.stringify(memberSignUp.data));
  }

  // 5. Super Admin Creates Real Task Assigned to Sneha
  const createTaskRes = await request("/api/tasks", {
    method: "POST",
    headers: adminHeaders,
    body: {
      title: "Design Figma Mockups for Onboarding",
      description: "Create high-fidelity wireframes and design tokens for the mobile onboarding flow.",
      projectId,
      taskType: "STORY",
      priority: "HIGH",
      assigneeIds: [memberId],
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
  });

  if (createTaskRes.status === 200 && createTaskRes.data.success) {
  } else {
    throw new Error("Failed to create task: " + JSON.stringify(createTaskRes.data));
  }

  // 6. Sneha Checks In-App Notifications
  const notifsRes = await request("/api/notifications", {
    headers: { Cookie: memberCookie },
  });

  const assignNotif = notifsRes.data.data.notifications.find((n) => n.type === "TASK_ASSIGNED");
  if (assignNotif) {
  } else {
    throw new Error("Notification not found for Sneha!");
  }

  // 7. Sneha Moves Task from TO DO -> IN PROGRESS
  const updateTask = await request("/api/tasks/CME-101", {
    method: "PATCH",
    headers: { Cookie: memberCookie },
    body: { status: "IN_PROGRESS" },
  });

  if (updateTask.status === 200 && updateTask.data.success) {
  } else {
    throw new Error("Failed to update task: " + JSON.stringify(updateTask.data));
  }

}

runCleanStartTest().catch(console.error);
