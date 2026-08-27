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

async function runRoleTests() {

  const ts = Date.now();
  const superEmail = `super_${ts}@domainexpansion.in`;
  const pmEmail = `pm_${ts}@domainexpansion.in`;
  const leadEmail = `lead_${ts}@domainexpansion.in`;
  const devEmail = `dev_${ts}@domainexpansion.in`;
  const pwd = "Password123!";

  // 1. Create Super Admin
  const t0 = Date.now();
  const regSuper = await request("/api/auth/register", {
    method: "POST",
    body: { name: "Sarah SuperAdmin", email: superEmail, password: pwd, portal: "SUPER_ADMIN", jobTitle: "Director" },
  });

  const loginSuper = await request("/api/auth/login", {
    method: "POST",
    body: { email: superEmail, password: pwd, portal: "SUPER_ADMIN" },
  });
  const superCookie = extractCookie(loginSuper.headers);

  // 2. Super Admin creates Project Manager, Team Lead, and Developer via Member Administration
  
  // Create PM
  const regPM = await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: superCookie },
    body: { name: "Paul PM", email: pmEmail, password: pwd, role: "MANAGER", jobTitle: "Engineering Manager", department: "Engineering" },
  });
  const pmId = regPM.data.data?.id;

  // Create Team Lead with Manager hierarchy
  const regLead = await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: superCookie },
    body: { name: "Tina TeamLead", email: leadEmail, password: pwd, role: "TEAM_LEAD", jobTitle: "Frontend Lead", department: "Frontend", managerId: pmId },
  });
  const leadId = regLead.data.data?.id;

  // Create Dev with Team Lead & Manager hierarchy
  const regDev = await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: superCookie },
    body: { name: "Dan Developer", email: devEmail, password: pwd, role: "MEMBER", jobTitle: "Frontend Engineer", department: "Frontend", managerId: pmId, teamLeadId: leadId },
  });
  const devId = regDev.data.data?.id;

  // 3. PM Login & Project Scoping
  const loginPM = await request("/api/auth/login", {
    method: "POST",
    body: { email: pmEmail, password: pwd, portal: "MAIN" },
  });
  const pmCookie = extractCookie(loginPM.headers);

  // PM creates project assigning Team Lead and Dev
  const createProj = await request("/api/projects", {
    method: "POST",
    headers: { Cookie: pmCookie },
    body: {
      name: "E-Commerce App 2026",
      key: `EC${ts.toString().slice(-4)}`,
      description: "Scoped project for PM, Lead and Dev",
      managerId: pmId,
      teamLeadId: leadId,
      members: [
        { userId: devId, role: "DEVELOPER" },
      ],
    },
  });
  const projId = createProj.data.data?.id;

  // 4. Team Lead Login & Task Assignment
  const loginLead = await request("/api/auth/login", {
    method: "POST",
    body: { email: leadEmail, password: pwd, portal: "MAIN" },
  });
  const leadCookie = extractCookie(loginLead.headers);

  // Team lead creates task for Developer
  const leadTask = await request("/api/tasks", {
    method: "POST",
    headers: { Cookie: leadCookie },
    body: {
      projectId: projId,
      title: "Develop Cart & Checkout Components",
      priority: "HIGH",
      taskType: "FEATURE",
      status: "TODO",
      assigneeIds: [devId],
      estimatedHours: 8,
    },
  });
  const taskKey = leadTask.data.data?.taskKey;

  // 5. Developer Login & Execution (Fast query validation)
  const loginDev = await request("/api/auth/login", {
    method: "POST",
    body: { email: devEmail, password: pwd, portal: "MAIN" },
  });
  const devCookie = extractCookie(loginDev.headers);

  // Measure Dev Task Query speed
  const tStart = Date.now();
  const devTasks = await request("/api/tasks?myWork=true", {
    method: "GET",
    headers: { Cookie: devCookie },
  });
  const tElapsed = Date.now() - tStart;

  // Dev updates task status to IN_PROGRESS
  const updateTask = await request(`/api/tasks/${taskKey}`, {
    method: "PATCH",
    headers: { Cookie: devCookie },
    body: { status: "IN_PROGRESS" },
  });

}

runRoleTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
