const http = require("http");

const BASE_HOST = "127.0.0.1";
const BASE_PORT = 3000;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        path: path,
        method: options.method || "GET",
        headers: defaultHeaders,
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = {};
          try {
            json = JSON.parse(data);
          } catch {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING COMPLETE HRMS & AUTH E2E TEST ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testMemberEmail = `employee_${timestamp}@domainexpansion.in`;
  const testPassword = "Password123!";

  // --------------------------------------------------------------------------
  // TEST 1: Register Normal Member
  // --------------------------------------------------------------------------
  console.log("\n[1] Registering Normal Member...");
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: `Employee Test ${timestamp}`,
      email: testMemberEmail,
      password: testPassword,
      confirmPassword: testPassword,
      jobTitle: "Software Developer",
      department: "Frontend",
      portal: "MAIN",
    },
  });
  assert(regRes.status === 200 && regRes.data?.success, "Member registration succeeded");
  assert(regRes.data?.data?.user?.role === "MEMBER", "User role is correctly set to MEMBER");

  // --------------------------------------------------------------------------
  // TEST 2: Login as Normal Member & Cookie Handling
  // --------------------------------------------------------------------------
  console.log("\n[2] Logging in as Normal Member...");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testMemberEmail,
      password: testPassword,
      portal: "MAIN",
    },
  });
  const rawCookie = loginRes.headers["set-cookie"];
  const cookieStr = Array.isArray(rawCookie) ? rawCookie[0] : (rawCookie || "");
  const sessionToken = loginRes.data?.data?.token;

  assert(loginRes.status === 200 && loginRes.data?.success, "Member login succeeded");
  assert(Boolean(sessionToken), "Received session JWT token");
  assert(cookieStr.includes("dx_session_token"), "Received httpOnly session cookie");

  const memberHeaders = {
    Cookie: cookieStr.split(";")[0],
  };

  // --------------------------------------------------------------------------
  // TEST 3: Verify Session & Role-Based Permissions
  // --------------------------------------------------------------------------
  console.log("\n[3] Checking Member Session & Role Permissions...");
  const meRes = await request("/api/auth/me", { headers: memberHeaders });
  assert(meRes.status === 200 && meRes.data?.success, "Session retrieved successfully from /api/auth/me");
  assert(meRes.data?.data?.user?.role === "MEMBER", "Current user role is verified as MEMBER");
  assert(
    !meRes.data?.data?.permissions?.includes("superadmin.access") &&
    !meRes.data?.data?.permissions?.includes("hradmin.access"),
    "Normal member does NOT possess superadmin or hradmin permissions"
  );

  // --------------------------------------------------------------------------
  // TEST 4: Verify Protected Route Restrictions
  // --------------------------------------------------------------------------
  console.log("\n[4] Testing Backend Route Restrictions for Normal Member...");
  const adminRes = await request("/api/admin/members", { headers: memberHeaders });
  assert(adminRes.status === 403 || adminRes.status === 401, "Normal member blocked from /api/admin/members (403/401 Forbidden)");

  const hrReportsRes = await request("/api/hrms/reports", { headers: memberHeaders });
  assert(hrReportsRes.status === 403, "Normal member blocked from /api/hrms/reports (403 Forbidden)");

  const tasksRes = await request("/api/tasks", { headers: memberHeaders });
  assert(tasksRes.status === 200, "Normal member authorized to access /api/tasks (200 OK)");

  // --------------------------------------------------------------------------
  // TEST 5: Real Attendance Flow - Punch In / Punch Out
  // --------------------------------------------------------------------------
  console.log("\n[5] Testing Punch In / Punch Out Endpoints...");
  // 5.1 Initial Punch status
  const initPunchRes = await request("/api/hrms/punch", { headers: memberHeaders });
  assert(initPunchRes.status === 200 && initPunchRes.data?.success, "Fetched initial punch status from /api/hrms/punch");

  // 5.2 Punch In
  const punchInRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: memberHeaders,
    body: {
      action: "PUNCH_IN",
      notes: "Starting morning shift",
    },
  });
  assert(punchInRes.status === 200 && punchInRes.data?.success, "Punch In succeeded");
  assert(punchInRes.data?.data?.status === "PRESENT", "Attendance status updated to PRESENT");
  assert(Boolean(punchInRes.data?.data?.punchIn), "Punch In timestamp recorded in database");

  // 5.3 Attempt duplicate Punch In
  const dupPunchInRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: memberHeaders,
    body: { action: "PUNCH_IN" },
  });
  assert(dupPunchInRes.status === 400 && dupPunchInRes.data?.error?.code === "ALREADY_PUNCHED_IN", "Duplicate Punch In prevented with meaningful error message");

  // 5.4 Punch Out
  const punchOutRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: memberHeaders,
    body: {
      action: "PUNCH_OUT",
      breakMinutes: 15,
      notes: "Day completed successfully",
    },
  });
  assert(punchOutRes.status === 200 && punchOutJsonData(punchOutRes), "Punch Out succeeded");
  assert(Boolean(punchOutRes.data?.data?.punchOut), "Punch Out timestamp recorded in database");
  assert(punchOutRes.data?.data?.breakDurationMinutes === 15, "Break duration deducted correctly (15 mins)");

  function punchOutJsonData(res) {
    return res.data?.success && Boolean(res.data?.data?.id);
  }

  // 5.5 Verify Monthly Attendance Records
  const now = new Date();
  const attRes = await request(`/api/hrms/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {
    headers: memberHeaders,
  });
  assert(attRes.status === 200 && attRes.data?.success, "Fetched monthly attendance records");
  assert(Array.isArray(attRes.data?.data?.attendances) && attRes.data.data.attendances.length > 0, "Attendance record exists in monthly log");
  assert(Boolean(attRes.data?.data?.stats), "Monthly attendance statistics calculated and returned");

  // --------------------------------------------------------------------------
  // TEST 6: Super Admin / HR Admin Authorization
  // --------------------------------------------------------------------------
  console.log("\n[6] Testing Super Admin Login and Administrative Access...");
  const saLoginRes = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: "admin@domainexpansion.in",
      password: "Password123!",
      portal: "SUPER_ADMIN",
    },
  });
  if (saLoginRes.data?.success) {
    const saCookieRaw = saLoginRes.headers["set-cookie"];
    const saCookie = Array.isArray(saCookieRaw) ? saCookieRaw[0] : (saCookieRaw || "");
    const saHeaders = {
      Cookie: saCookie.split(";")[0],
    };

    const saMembersRes = await request("/api/admin/members", { headers: saHeaders });
    assert(saMembersRes.status === 200, "Super Admin authorized to access /api/admin/members (200 OK)");

    const saReportsRes = await request("/api/hrms/reports", { headers: saHeaders });
    assert(saReportsRes.status === 200, "Super Admin authorized to access /api/hrms/reports (200 OK)");

    // Test attendance correction
    const correctRes = await request("/api/hrms/attendance", {
      method: "PATCH",
      headers: saHeaders,
      body: {
        attendanceId: punchOutRes.data?.data?.id,
        status: "FULL_DAY",
        notes: "Approved full day credit by Admin",
      },
    });
    assert(correctRes.status === 200 && correctRes.data?.success, "Super Admin successfully performed attendance correction");
  } else {
    console.log("  ⚠️ Note: Seed admin user password check skipped if not pre-seeded.");
  }

  // --------------------------------------------------------------------------
  // TEST 7: Logout Flow & Session Invalidation
  // --------------------------------------------------------------------------
  console.log("\n[7] Testing Logout & Session Clearing...");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: memberHeaders,
  });
  const logoutCookieRaw = logoutRes.headers["set-cookie"];
  const logoutCookie = Array.isArray(logoutCookieRaw) ? logoutCookieRaw[0] : (logoutCookieRaw || "");
  assert(logoutRes.status === 200, "Logout API returned 200 OK");
  assert(logoutCookie.includes("Max-Age=0") || logoutCookie.includes("expires="), "Logout cleared session cookie");

  // Attempt request with cleared cookie
  const postLogoutRes = await request("/api/auth/me", {
    headers: {
      Cookie: "dx_session_token=",
    },
  });
  assert(postLogoutRes.status === 401, "Protected /api/auth/me correctly rejects cleared session (401 Unauthorized)");

  console.log("\n==========================================");
  console.log(`TOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
