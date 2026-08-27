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
  const normalEmail = `emp_${timestamp}@company.com`;
  const unassignedEmail = `unassigned_${timestamp}@company.com`;
  const superAdminEmail = `superadmin_${timestamp}@company.com`;
  const hrmsAdminEmail = `hrmsadmin_${timestamp}@company.com`;
  const password = "Password123!";

  let superAdminCookie = "";
  let normalUserCookie = "";
  let unassignedUserCookie = "";
  let hrmsAdminCookie = "";
  let normalUserId = "";
  let unassignedUserId = "";

  // --------------------------------------------------------------------------
  // TEST 1: Normal User Registration (NO Auto-Login, NO Auto-HRMS, NO Auto-Project)
  // --------------------------------------------------------------------------
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Alice Developer",
      email: normalEmail,
      password: password,
      confirmPassword: password,
      jobTitle: "Software Developer",
      department: "Engineering",
      portal: "MAIN",
    },
  });

  const hasCookieAfterReg = !!regRes.headers["set-cookie"]?.some((c) => c.includes("dx_session_token="));
  if (hasCookieAfterReg) throw new Error("Security Violation: User was automatically logged in after registration!");
  normalUserId = regRes.data.data.user.id;

  // Also register an unassigned member
  const unassignedReg = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Bob Unassigned",
      email: unassignedEmail,
      password: password,
      confirmPassword: password,
      jobTitle: "Junior Analyst",
      department: "Analytics",
      portal: "MAIN",
    },
  });
  unassignedUserId = unassignedReg.data.data.user.id;

  // --------------------------------------------------------------------------
  // TEST 2: Normal User Login & Wrong Password Rejection
  // --------------------------------------------------------------------------
  const wrongPassRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: "WrongPassword!", portal: "MAIN" },
  });
  if (wrongPassRes.status !== 401) throw new Error("Wrong password was not rejected!");

  const normalLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "MAIN" },
  });
  normalUserCookie = extractCookie(normalLoginRes.headers);

  const unassignedLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: unassignedEmail, password: password, portal: "MAIN" },
  });
  unassignedUserCookie = extractCookie(unassignedLoginRes.headers);

  // --------------------------------------------------------------------------
  // TEST 3: HRMS Access Rule (Unactivated user blocked from HRMS)
  // --------------------------------------------------------------------------
  const hrmsLoginAttempt = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "HRMS" },
  });
  if (hrmsLoginAttempt.status !== 403 || hrmsLoginAttempt.data.error?.code !== "HRMS_NOT_ACTIVATED") {
    throw new Error("Security Violation: Unactivated user was allowed into HRMS!");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Super Admin Portal Flow & Role Enforcement
  // --------------------------------------------------------------------------
  // 4a. Normal user attempting to log into Super Admin portal
  const normalUserAsSuperAdmin = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "SUPER_ADMIN" },
  });
  if (normalUserAsSuperAdmin.status !== 403) throw new Error("Security Violation: Normal user was allowed into Super Admin portal!");

  // 4b. Super Admin creates account
  const superAdminReg = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Master Super Admin",
      email: superAdminEmail,
      password: password,
      confirmPassword: password,
      jobTitle: "Founder & Lead",
      department: "Executive",
      portal: "SUPER_ADMIN",
    },
  });

  // 4c. Super Admin logs in
  const superAdminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: superAdminEmail, password: password, portal: "SUPER_ADMIN" },
  });
  superAdminCookie = extractCookie(superAdminLogin.headers);

  // --------------------------------------------------------------------------
  // TEST 5: HRMS Super Admin Portal & Employee Activation
  // --------------------------------------------------------------------------
  // 5a. Create HRMS Super Admin
  const hrmsAdminReg = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "HR Super Director",
      email: hrmsAdminEmail,
      password: password,
      confirmPassword: password,
      jobTitle: "HR Director",
      department: "Human Resources",
      portal: "HRMS_SUPER_ADMIN",
    },
  });

  // 5b. HRMS Super Admin logs in
  const hrmsAdminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: hrmsAdminEmail, password: password, portal: "HRMS_SUPER_ADMIN" },
  });
  hrmsAdminCookie = extractCookie(hrmsAdminLogin.headers);

  // 5c. HRMS Super Admin activates normal user for HRMS
  const activateEmployee = await request(`/api/hrms/employees/${normalUserId}`, {
    method: "PATCH",
    headers: { Cookie: hrmsAdminCookie },
    body: { status: "ACTIVE", designation: "Software Engineer", department: "Engineering" },
  });

  // 5d. Alice now attempts HRMS login
  const aliceHrmsLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "HRMS" },
  });
  if (aliceHrmsLogin.status !== 200) throw new Error("Activated employee could not log in to HRMS!");

  // --------------------------------------------------------------------------
  // TEST 6: Project Management, Member Role Assignment & Project-Scoped Visibility
  // --------------------------------------------------------------------------
  // 6a. Super Admin creates Project A and assigns Alice as DEVELOPER (NOT Bob)
  const createProjRes = await request("/api/projects", {
    method: "POST",
    headers: { Cookie: superAdminCookie },
    body: {
      name: `Core API Platform ${timestamp}`,
      key: `API${String(timestamp).slice(-3)}`,
      description: "Next-gen backend microservices platform",
      members: [{ userId: normalUserId, role: "DEVELOPER" }],
    },
  });
  const projectId = createProjRes.data.data.id;

  // 6b. Alice queries projects -> MUST see Project A with role DEVELOPER
  const aliceProjects = await request("/api/projects", {
    headers: { Cookie: normalUserCookie },
  });
  const aliceFoundProj = aliceProjects.data.data?.find((p) => p.id === projectId);
  if (!aliceFoundProj || aliceFoundProj.myProjectRole !== "DEVELOPER") {
    throw new Error("Assigned user did not see the project with DEVELOPER role!");
  }

  // 6c. Bob (unassigned user) queries projects -> MUST NOT see Project A!
  const bobProjects = await request("/api/projects", {
    headers: { Cookie: unassignedUserCookie },
  });
  const bobFoundProj = bobProjects.data.data?.find((p) => p.id === projectId);
  if (bobFoundProj) throw new Error("Security Violation: Unassigned user was able to see Project A!");

  // --------------------------------------------------------------------------
  // TEST 7: HRMS Attendance Punch In & 8-Hour Rule
  // --------------------------------------------------------------------------
  const punchInRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: normalUserCookie },
    body: { action: "PUNCH_IN", breakMinutes: 0 },
  });

  // --------------------------------------------------------------------------
  // TEST 8: Leave Application & Approval Workflow
  // --------------------------------------------------------------------------
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const applyLeaveRes = await request("/api/hrms/leave", {
    method: "POST",
    headers: { Cookie: normalUserCookie },
    body: {
      leaveType: "CASUAL",
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      reason: "Family event",
    },
  });
  const leaveId = applyLeaveRes.data.data?.id;

  // HR Admin approves the leave
  const approveLeaveRes = await request("/api/hrms/leave", {
    method: "PATCH",
    headers: { Cookie: hrmsAdminCookie },
    body: { leaveId, status: "APPROVED", approverComment: "Approved by HR Director" },
  });
  if (approveLeaveRes.data.data?.status !== "APPROVED") throw new Error("Leave was not marked as APPROVED!");

  // --------------------------------------------------------------------------
  // TEST 9: Session Persistence & Logout
  // --------------------------------------------------------------------------
  // Check /api/auth/me with cookie
  const meRes = await request("/api/auth/me", {
    headers: { Cookie: normalUserCookie },
  });

  // Perform Logout
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: normalUserCookie },
  });
  const clearedCookie = extractCookie(logoutRes.headers);

}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
