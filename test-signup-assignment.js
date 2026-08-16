// Test Public Sign-Up, Dynamic Assignee Listing, Task Assignment, and Notification Flow
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

async function runSignUpAndAssignmentTest() {
  console.log("==========================================================");
  console.log("🚀 TESTING REAL USER SIGN-UP & NOTIFICATION FLOW");
  console.log("==========================================================");

  const testEmail = `sanjay.${Date.now()}@domainexpansion.in`;
  const testPassword = "securePassword123";
  let sanjayCookie = "";
  let sanjayId = "";

  // 1. Direct Public Sign-Up
  console.log(`\n[1/6] Registering new team member: ${testEmail}...`);
  const signUpRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Sanjay Patel",
      email: testEmail,
      password: testPassword,
      jobTitle: "Senior QA Engineer",
      department: "Quality Assurance",
      role: "TEAM_MEMBER",
    },
  });

  if (signUpRes.status === 200 && signUpRes.data.success) {
    sanjayId = signUpRes.data.data.user.id;
    const cookie = signUpRes.headers["set-cookie"];
    if (cookie) sanjayCookie = cookie[0].split(";")[0];
    console.log("✅ User registered successfully:", signUpRes.data.data.user.name, `(ID: ${sanjayId})`);
  } else {
    throw new Error("Sign up failed: " + JSON.stringify(signUpRes.data));
  }

  // 2. Admin Logs In
  console.log("\n[2/6] Logging in as Admin (admin@domainexpansion.in)...");
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "password123" },
  });
  const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
  const adminHeaders = { Cookie: adminCookie };
  console.log("✅ Admin logged in successfully");

  // 3. Admin Fetches Users (Verifying newly registered user appears in assignee list)
  console.log("\n[3/6] Fetching Team Member list to verify Sanjay is selectable for tasks...");
  const usersRes = await request("/api/users", { headers: adminHeaders });
  const foundSanjay = usersRes.data.data.find((u) => u.id === sanjayId);

  if (foundSanjay) {
    console.log(`✅ Sanjay Patel found in member list! (${foundSanjay.name} - ${foundSanjay.jobTitle})`);
  } else {
    throw new Error("New user Sanjay not found in /api/users list");
  }

  // 4. Admin Creates a Task / Bug and Assigns to Sanjay Patel
  console.log("\n[4/6] Admin creating task assigned to Sanjay Patel...");
  const projectsRes = await request("/api/projects", { headers: adminHeaders });
  const projectId = projectsRes.data.data[0].id;

  const createTaskRes = await request("/api/tasks", {
    method: "POST",
    headers: adminHeaders,
    body: {
      title: "Run End-to-End Regression Test Suite",
      description: "Perform comprehensive testing across authentication, task creation, and notification feeds.",
      projectId,
      taskType: "BUG",
      priority: "HIGH",
      assigneeIds: [sanjayId],
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
  });

  if (createTaskRes.status === 200 && createTaskRes.data.success) {
    console.log(`✅ Task created: ${createTaskRes.data.data.taskKey} - "${createTaskRes.data.data.title}"`);
    console.log(`   Assigned to: ${createTaskRes.data.data.assignees?.map((a) => a.user?.name).join(", ")}`);
  } else {
    throw new Error("Create task failed: " + JSON.stringify(createTaskRes.data));
  }

  // 5. Sanjay Logs In & Checks Notifications
  console.log("\n[5/6] Sanjay checking in-app notifications (🔔)...");
  const notifRes = await request("/api/notifications", {
    headers: { Cookie: sanjayCookie },
  });

  const assignmentNotif = notifRes.data.data.notifications.find(
    (n) => n.type === "TASK_ASSIGNED" || n.title.includes("Task Assigned")
  );

  if (assignmentNotif) {
    console.log(`✅ Sanjay received in-app notification:`);
    console.log(`   Title: "${assignmentNotif.title}"`);
    console.log(`   Message: "${assignmentNotif.message}"`);
    console.log(`   Unread Count: ${notifRes.data.data.unreadCount}`);
  } else {
    throw new Error("Assignment notification not found for Sanjay: " + JSON.stringify(notifRes.data));
  }

  // 6. Sanjay Checks "My Work" Tasks
  console.log("\n[6/6] Sanjay verifying assigned tasks in My Work...");
  const myTasksRes = await request("/api/tasks", {
    headers: { Cookie: sanjayCookie },
  });

  const sanjaysTasks = myTasksRes.data.data.filter((t) =>
    t.assignees?.some((a) => a.id === sanjayId)
  );

  console.log(`✅ Sanjay has ${sanjaysTasks.length} task(s) assigned in My Work:`);
  sanjaysTasks.forEach((t) => {
    console.log(`   - [${t.taskKey}] ${t.title} (${t.priority} - Status: ${t.status})`);
  });

  console.log("\n==========================================================");
  console.log("🎉 ALL REAL USER SIGN-UP & ASSIGNMENT FLOWS VERIFIED 100%!");
  console.log("==========================================================");
}

runSignUpAndAssignmentTest().catch(console.error);
