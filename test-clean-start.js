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
  console.log("==========================================================");
  console.log("🚀 TESTING CLEAN SLATE DYNAMIC WORKFLOW (ZERO DUMMY DATA)");
  console.log("==========================================================");

  let adminCookie = "";
  let memberCookie = "";
  let memberId = "";
  let projectId = "";

  // 1. Super Admin Signs Up
  console.log("\n[1/7] First User Signs Up as Super Admin (suraj@domainexpansion.in)...");
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
    console.log("✅ Super Admin registered & session active:", adminSignUp.data.data.user.name, `(${adminSignUp.data.data.user.role})`);
  } else {
    throw new Error("Admin registration failed: " + JSON.stringify(adminSignUp.data));
  }

  const adminHeaders = { Cookie: adminCookie };

  // 2. Verify 0 initial projects & 0 initial tasks
  console.log("\n[2/7] Checking that workspace is 100% clean (0 dummy projects, 0 dummy tasks)...");
  const projectsRes = await request("/api/projects", { headers: adminHeaders });
  const tasksRes = await request("/api/tasks", { headers: adminHeaders });
  console.log(`✅ Current Projects Count: ${projectsRes.data.data.length} (Expected: 0)`);
  console.log(`✅ Current Tasks Count: ${tasksRes.data.data.length} (Expected: 0)`);

  if (projectsRes.data.data.length !== 0 || tasksRes.data.data.length !== 0) {
    throw new Error("Database is not clean!");
  }

  // 3. Super Admin Creates First Real Project
  console.log("\n[3/7] Super Admin creates real project: 'Customer Mobile Experience' (Key: CME)...");
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
    console.log(`✅ Project created: ${createProjRes.data.data.name} (Key: ${createProjRes.data.data.key})`);
  } else {
    throw new Error("Failed to create project: " + JSON.stringify(createProjRes.data));
  }

  // 4. Team Member Signs Up
  console.log("\n[4/7] Team Member signs up: 'Sneha Patel' (Designer)...");
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
    console.log(`✅ Team member registered: ${memberSignUp.data.data.user.name} (${memberSignUp.data.data.user.jobTitle})`);
  } else {
    throw new Error("Member registration failed: " + JSON.stringify(memberSignUp.data));
  }

  // 5. Super Admin Creates Real Task Assigned to Sneha
  console.log("\n[5/7] Admin creates task 'Design Figma Mockups for Onboarding' assigned to Sneha...");
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
    console.log(`✅ Task created: ${createTaskRes.data.data.taskKey} - "${createTaskRes.data.data.title}"`);
    console.log(`   Assigned To: ${createTaskRes.data.data.assignees?.map((a) => a.user?.name).join(", ")}`);
  } else {
    throw new Error("Failed to create task: " + JSON.stringify(createTaskRes.data));
  }

  // 6. Sneha Checks In-App Notifications
  console.log("\n[6/7] Sneha logs in and checks in-app notification bell (🔔)...");
  const notifsRes = await request("/api/notifications", {
    headers: { Cookie: memberCookie },
  });

  console.log(`✅ Total Notifications: ${notifsRes.data.data.notifications.length}`);
  const assignNotif = notifsRes.data.data.notifications.find((n) => n.type === "TASK_ASSIGNED");
  if (assignNotif) {
    console.log(`✅ In-App Alert: "${assignNotif.title}" - "${assignNotif.message}"`);
  } else {
    throw new Error("Notification not found for Sneha!");
  }

  // 7. Sneha Moves Task from TO DO -> IN PROGRESS
  console.log("\n[7/7] Sneha updates task CME-101 status from TODO to IN_PROGRESS...");
  const updateTask = await request("/api/tasks/CME-101", {
    method: "PATCH",
    headers: { Cookie: memberCookie },
    body: { status: "IN_PROGRESS" },
  });

  if (updateTask.status === 200 && updateTask.data.success) {
    console.log(`✅ Task ${updateTask.data.data.taskKey} status is now: ${updateTask.data.data.status}`);
  } else {
    throw new Error("Failed to update task: " + JSON.stringify(updateTask.data));
  }

  console.log("\n==========================================================");
  console.log("🎉 100% CLEAN DYNAMIC WORKFLOW VERIFIED SUCCESSFULLY!");
  console.log("==========================================================");
}

runCleanStartTest().catch(console.error);
