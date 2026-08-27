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

function extractCookie(headers) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return "";
  if (Array.isArray(setCookie)) {
    return setCookie.map((c) => c.split(";")[0]).join("; ");
  }
  return setCookie.split(";")[0];
}

async function runTests() {

  const timestamp = Date.now();
  const superAdminEmail = `superadmin_${timestamp}@domainexpansion.in`;
  const hrAdminEmail = `hradmin_${timestamp}@domainexpansion.in`;
  const devEmail = `frontend_dev_${timestamp}@domainexpansion.in`;
  const password = "Password123!";

  let superAdminCookie = "";
  let hrAdminCookie = "";
  let devCookie = "";

  // --------------------------------------------------------------------------
  // STEP 1: Register Super Admin, HR Admin & Frontend Developer
  // --------------------------------------------------------------------------

  // 1. Super Admin
  const regSuper = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Alex Super Admin",
      email: superAdminEmail,
      password,
      confirmPassword: password,
      portal: "SUPER_ADMIN",
      jobTitle: "Executive Controller",
      department: "Executive Management",
    },
  });

  const loginSuper = await request("/api/auth/login", {
    method: "POST",
    body: { email: superAdminEmail, password, portal: "SUPER_ADMIN" },
  });
  superAdminCookie = extractCookie(loginSuper.headers);

  // 2. HR Admin
  const regHR = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Helen HR Admin",
      email: hrAdminEmail,
      password,
      confirmPassword: password,
      portal: "HRMS_SUPER_ADMIN",
      jobTitle: "HR Director",
      department: "Human Resources",
    },
  });

  const loginHR = await request("/api/auth/login", {
    method: "POST",
    body: { email: hrAdminEmail, password, portal: "HRMS_SUPER_ADMIN" },
  });
  hrAdminCookie = extractCookie(loginHR.headers);

  // 3. Frontend Developer
  const regDev = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "David Frontend Dev",
      email: devEmail,
      password,
      confirmPassword: password,
      portal: "MAIN",
      jobTitle: "Senior Frontend Engineer",
      department: "Frontend",
    },
  });

  // Activate Dev in HRMS
  const devId = regDev.data.data?.user?.id;
  await request(`/api/hrms/employees/${devId}`, {
    method: "PATCH",
    headers: { Cookie: hrAdminCookie },
    body: { status: "ACTIVE" },
  });

  const loginDev = await request("/api/auth/login", {
    method: "POST",
    body: { email: devEmail, password, portal: "MAIN" },
  });
  devCookie = extractCookie(loginDev.headers);

  // --------------------------------------------------------------------------
  // TEST A: Super Admin Punch Clock Exemption
  // --------------------------------------------------------------------------
  const superPunch = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: superAdminCookie },
    body: { action: "PUNCH_IN" },
  });
  if (superPunch.status !== 400 || superPunch.data.error?.code !== "SUPER_ADMIN_EXEMPT") {
    throw new Error("Super Admin was not exempted from punch logs!");
  }

  // --------------------------------------------------------------------------
  // TEST B: Super Admin Project Creation & Task Assignment
  // --------------------------------------------------------------------------
  const createProj = await request("/api/projects", {
    method: "POST",
    headers: { Cookie: superAdminCookie },
    body: {
      name: "Client Portal 2026",
      key: `CP${timestamp.toString().slice(-4)}`,
      description: "Unified Client Portal application for all departments",
      memberIds: [devId],
    },
  });
  const projectId = createProj.data.data?.id;

  // Create Task
  const createTask = await request("/api/tasks", {
    method: "POST",
    headers: { Cookie: superAdminCookie },
    body: {
      projectId,
      title: "Build Responsive Navigation & Department Cards",
      description: "Implement unified clean structure for Frontend, Backend, UI/UX, and QA",
      priority: "HIGH",
      taskType: "FEATURE",
      status: "TODO",
      assigneeIds: [devId],
      estimatedHours: 6.5,
    },
  });
  const taskKey = createTask.data.data?.taskKey;

  // Move Task Through Kanban Workflow: TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
  const moveInProgress = await request(`/api/tasks/${taskKey}`, {
    method: "PATCH",
    headers: { Cookie: devCookie },
    body: { status: "IN_PROGRESS" },
  });

  const moveInReview = await request(`/api/tasks/${taskKey}`, {
    method: "PATCH",
    headers: { Cookie: devCookie },
    body: { status: "IN_REVIEW" },
  });

  const moveDone = await request(`/api/tasks/${taskKey}`, {
    method: "PATCH",
    headers: { Cookie: devCookie },
    body: { status: "DONE" },
  });

  // --------------------------------------------------------------------------
  // TEST C: Document Vault Upload & Department Phase-wise Scoping
  // --------------------------------------------------------------------------

  // Fetch documents as Frontend Dev
  const devDocs = await request("/api/documents", {
    method: "GET",
    headers: { Cookie: devCookie },
  });
  if (devDocs.status !== 200) {
    throw new Error("Failed to query documents as frontend developer!");
  }

}

runTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
