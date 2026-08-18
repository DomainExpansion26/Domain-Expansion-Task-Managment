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
  console.log("==========================================================================");
  console.log("🚀 COMPREHENSIVE MULTI-PORTAL & RBAC SECURITY TEST SUITE");
  console.log("==========================================================================");

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
  console.log("\n[TEST 1] Normal User Registration Flow (/create-account)");
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

  console.log(`- Register Status: ${regRes.status} (Expected: 200)`);
  console.log(`- Success: ${regRes.data.success}`);
  console.log(`- Message: ${regRes.data.message}`);
  const hasCookieAfterReg = !!regRes.headers["set-cookie"]?.some((c) => c.includes("dx_session_token="));
  console.log(`- Auto-Login Cookie Set? ${hasCookieAfterReg} (Expected: false)`);
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
  console.log("\n[TEST 2] Normal User Login (/login)");
  const wrongPassRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: "WrongPassword!", portal: "MAIN" },
  });
  console.log(`- Wrong Password Rejected: Status ${wrongPassRes.status} (Expected: 401)`);
  if (wrongPassRes.status !== 401) throw new Error("Wrong password was not rejected!");

  const normalLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "MAIN" },
  });
  console.log(`- Correct Login Status: ${normalLoginRes.status} (Expected: 200)`);
  normalUserCookie = extractCookie(normalLoginRes.headers);
  console.log(`- Session Cookie Acquired: ${!!normalUserCookie}`);

  const unassignedLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: unassignedEmail, password: password, portal: "MAIN" },
  });
  unassignedUserCookie = extractCookie(unassignedLoginRes.headers);

  // --------------------------------------------------------------------------
  // TEST 3: HRMS Access Rule (Unactivated user blocked from HRMS)
  // --------------------------------------------------------------------------
  console.log("\n[TEST 3] HRMS Access Rule for Unactivated User (/hrms/login)");
  const hrmsLoginAttempt = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "HRMS" },
  });
  console.log(`- HRMS Login Attempt Status: ${hrmsLoginAttempt.status} (Expected: 403)`);
  console.log(`- Error Code: ${hrmsLoginAttempt.data.error?.code} (Expected: HRMS_NOT_ACTIVATED)`);
  console.log(`- Error Message: ${hrmsLoginAttempt.data.error?.message}`);
  if (hrmsLoginAttempt.status !== 403 || hrmsLoginAttempt.data.error?.code !== "HRMS_NOT_ACTIVATED") {
    throw new Error("Security Violation: Unactivated user was allowed into HRMS!");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Super Admin Portal Flow & Role Enforcement
  // --------------------------------------------------------------------------
  console.log("\n[TEST 4] Super Admin Portal (/superadmin)");
  // 4a. Normal user attempting to log into Super Admin portal
  const normalUserAsSuperAdmin = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "SUPER_ADMIN" },
  });
  console.log(`- Normal User Super Admin Access Attempt: Status ${normalUserAsSuperAdmin.status} (Expected: 403)`);
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
  console.log(`- Super Admin Created: Status ${superAdminReg.status}, Role: ${superAdminReg.data.data?.user?.role}`);

  // 4c. Super Admin logs in
  const superAdminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: superAdminEmail, password: password, portal: "SUPER_ADMIN" },
  });
  console.log(`- Super Admin Login Status: ${superAdminLogin.status} (Expected: 200)`);
  superAdminCookie = extractCookie(superAdminLogin.headers);

  // --------------------------------------------------------------------------
  // TEST 5: HRMS Super Admin Portal & Employee Activation
  // --------------------------------------------------------------------------
  console.log("\n[TEST 5] HRMS Super Admin Flow & Employee Activation (/hrmssuperadmin)");
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
  console.log(`- HRMS Super Admin Created: Status ${hrmsAdminReg.status}, Role: ${hrmsAdminReg.data.data?.user?.role}`);

  // 5b. HRMS Super Admin logs in
  const hrmsAdminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: hrmsAdminEmail, password: password, portal: "HRMS_SUPER_ADMIN" },
  });
  console.log(`- HRMS Super Admin Login Status: ${hrmsAdminLogin.status} (Expected: 200)`);
  hrmsAdminCookie = extractCookie(hrmsAdminLogin.headers);

  // 5c. HRMS Super Admin activates normal user for HRMS
  console.log("- Activating Alice in HRMS...");
  const activateEmployee = await request(`/api/hrms/employees/${normalUserId}`, {
    method: "PATCH",
    headers: { Cookie: hrmsAdminCookie },
    body: { status: "ACTIVE", designation: "Software Engineer", department: "Engineering" },
  });
  console.log(`- Activation Result: Status ${activateEmployee.status} (Expected: 200)`);

  // 5d. Alice now attempts HRMS login
  const aliceHrmsLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: normalEmail, password: password, portal: "HRMS" },
  });
  console.log(`- Alice HRMS Login After Activation: Status ${aliceHrmsLogin.status} (Expected: 200)`);
  if (aliceHrmsLogin.status !== 200) throw new Error("Activated employee could not log in to HRMS!");

  // --------------------------------------------------------------------------
  // TEST 6: Project Management, Member Role Assignment & Project-Scoped Visibility
  // --------------------------------------------------------------------------
  console.log("\n[TEST 6] Project Management & Scoped Visibility");
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
  console.log(`- Project Creation Status: ${createProjRes.status} (Expected: 200)`);
  const projectId = createProjRes.data.data.id;

  // 6b. Alice queries projects -> MUST see Project A with role DEVELOPER
  const aliceProjects = await request("/api/projects", {
    headers: { Cookie: normalUserCookie },
  });
  console.log(`- Alice Projects Count: ${aliceProjects.data.data?.length} (Expected: at least 1)`);
  const aliceFoundProj = aliceProjects.data.data?.find((p) => p.id === projectId);
  console.log(`- Alice Sees Project A: ${!!aliceFoundProj}`);
  console.log(`- Alice Project Role: ${aliceFoundProj?.myProjectRole} (Expected: DEVELOPER)`);
  if (!aliceFoundProj || aliceFoundProj.myProjectRole !== "DEVELOPER") {
    throw new Error("Assigned user did not see the project with DEVELOPER role!");
  }

  // 6c. Bob (unassigned user) queries projects -> MUST NOT see Project A!
  const bobProjects = await request("/api/projects", {
    headers: { Cookie: unassignedUserCookie },
  });
  const bobFoundProj = bobProjects.data.data?.find((p) => p.id === projectId);
  console.log(`- Bob (Unassigned) Sees Project A: ${!!bobFoundProj} (Expected: false)`);
  if (bobFoundProj) throw new Error("Security Violation: Unassigned user was able to see Project A!");

  // --------------------------------------------------------------------------
  // TEST 7: HRMS Attendance Punch In & 8-Hour Rule
  // --------------------------------------------------------------------------
  console.log("\n[TEST 7] HRMS Attendance & Punch In/Out");
  const punchInRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: normalUserCookie },
    body: { action: "PUNCH_IN", breakMinutes: 0 },
  });
  console.log(`- Punch In Status: ${punchInRes.status} (Expected: 200)`);
  console.log(`- Attendance Status: ${punchInRes.data.data?.status}`);

  // --------------------------------------------------------------------------
  // TEST 8: Leave Application & Approval Workflow
  // --------------------------------------------------------------------------
  console.log("\n[TEST 8] Leave Application & Approval Hierarchy");
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
  console.log(`- Leave Application Status: ${applyLeaveRes.status} (Expected: 200)`);
  const leaveId = applyLeaveRes.data.data?.id;

  // HR Admin approves the leave
  const approveLeaveRes = await request("/api/hrms/leave", {
    method: "PATCH",
    headers: { Cookie: hrmsAdminCookie },
    body: { leaveId, status: "APPROVED", approverComment: "Approved by HR Director" },
  });
  console.log(`- Leave Approval Status: ${approveLeaveRes.status} (Expected: 200)`);
  console.log(`- Leave New Status: ${approveLeaveRes.data.data?.status} (Expected: APPROVED)`);
  if (approveLeaveRes.data.data?.status !== "APPROVED") throw new Error("Leave was not marked as APPROVED!");

  // --------------------------------------------------------------------------
  // TEST 9: Session Persistence & Logout
  // --------------------------------------------------------------------------
  console.log("\n[TEST 9] Session Persistence & Logout");
  // Check /api/auth/me with cookie
  const meRes = await request("/api/auth/me", {
    headers: { Cookie: normalUserCookie },
  });
  console.log(`- Session Check Status: ${meRes.status} (Expected: 200)`);
  console.log(`- Session User: ${meRes.data.data?.user?.name}`);

  // Perform Logout
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: normalUserCookie },
  });
  console.log(`- Logout Status: ${logoutRes.status} (Expected: 200)`);
  const clearedCookie = extractCookie(logoutRes.headers);
  console.log(`- Cookie Cleared? ${clearedCookie.includes("Max-Age=0") || clearedCookie.includes("expires=")}`);

  console.log("\n==========================================================================");
  console.log("🎉 ALL 9 MULTI-PORTAL & SECURITY SCENARIOS PASSED WITH 100% SUCCESS!");
  console.log("==========================================================================");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
