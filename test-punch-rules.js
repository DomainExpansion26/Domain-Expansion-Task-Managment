const BASE_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

async function runPunchTests() {
  console.log("==========================================================================");
  console.log("⏱️ TESTING PUNCH IN / PUNCH OUT STRICT CONSTRAINTS & DURATION RULES");
  console.log("==========================================================================\n");

  // 1. Create a dedicated test user and activate for HRMS
  const testEmail = `punchtest_${Date.now()}@domainexpansion.in`;
  const testPassword = "Password@123";

  console.log("[STEP 1] Registering & setting up test user...");
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Punch Test Employee",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      jobTitle: "Software Engineer",
      department: "Engineering",
      portal: "HRMS",
    },
  });

  if (!regRes.data.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  }

  // Create HR Admin to activate this user
  const adminEmail = `punchadmin_${Date.now()}@domainexpansion.in`;
  await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Punch HR Admin",
      email: adminEmail,
      password: testPassword,
      confirmPassword: testPassword,
      portal: "HRMS_SUPER_ADMIN",
    },
  });

  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: testPassword },
  });
  const adminCookie = adminLogin.headers.get("set-cookie").split(";")[0];

  // Activate employee in HRMS
  await request("/api/hrms/employees", {
    method: "PATCH",
    headers: { Cookie: adminCookie },
    body: {
      userId: regRes.data.data.id,
      status: "ACTIVE",
      department: "Engineering",
      designation: "Software Engineer",
    },
  });

  // Login as the employee
  const empLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: testEmail, password: testPassword },
  });
  const empCookie = empLogin.headers.get("set-cookie").split(";")[0];
  console.log("✓ Employee created, activated in HRMS, and logged in.\n");

  // [TEST A] Try Punch Out before Punch In (Should Fail)
  console.log("[TEST A] Punch Out before Punch In");
  const prematurePunchOut = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT" },
  });
  console.log("- Status:", prematurePunchOut.status, "(Expected: 400)");
  console.log("- Error Code:", prematurePunchOut.data.error?.code, "(Expected: NOT_PUNCHED_IN)");
  if (prematurePunchOut.status !== 400 || prematurePunchOut.data.error?.code !== "NOT_PUNCHED_IN") {
    throw new Error("Premature punch out was not rejected!");
  }
  console.log("✓ Test A Passed.\n");

  // [TEST B] First Punch In (Should Succeed)
  console.log("[TEST B] First Punch In of the Day");
  const firstPunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN", breakMinutes: 30, notes: "Morning start" },
  });
  console.log("- Status:", firstPunchIn.status, "(Expected: 200)");
  console.log("- Status Field:", firstPunchIn.data.data?.status, "(Expected: PRESENT)");
  if (firstPunchIn.status !== 200 || firstPunchIn.data.data?.status !== "PRESENT") {
    throw new Error("First punch in failed!");
  }
  console.log("✓ Test B Passed.\n");

  // [TEST C] Duplicate Punch In while already punched in (Should Fail)
  console.log("[TEST C] Duplicate Punch In Attempt (Single-Action Rule)");
  const duplicatePunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN" },
  });
  console.log("- Status:", duplicatePunchIn.status, "(Expected: 400)");
  console.log("- Error Code:", duplicatePunchIn.data.error?.code, "(Expected: ALREADY_PUNCHED_IN)");
  if (duplicatePunchIn.status !== 400 || duplicatePunchIn.data.error?.code !== "ALREADY_PUNCHED_IN") {
    throw new Error("Duplicate punch in was not rejected!");
  }
  console.log("✓ Test C Passed.\n");

  // [TEST D] Punch Out to Complete the Day (Should Succeed & Apply 8-Hour Rule)
  console.log("[TEST D] Punch Out to Complete the Day");
  const punchOutRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT", breakMinutes: 45, notes: "End of shift" },
  });
  console.log("- Status:", punchOutRes.status, "(Expected: 200)");
  console.log("- Total Working Hours:", punchOutRes.data.data?.totalWorkingHours, "hrs");
  console.log("- Status Field:", punchOutRes.data.data?.status);
  console.log("- Break Minutes:", punchOutRes.data.data?.breakDurationMinutes, "mins");
  if (punchOutRes.status !== 200 || !punchOutRes.data.data?.punchOut) {
    throw new Error("Punch out failed!");
  }
  console.log("✓ Test D Passed.\n");

  // [TEST E] Punch In Again after Punch Out (Should Fail - Shift Already Completed)
  console.log("[TEST E] Punch In After Completing Day (Single-Action Rule)");
  const latePunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN" },
  });
  console.log("- Status:", latePunchIn.status, "(Expected: 400)");
  console.log("- Error Code:", latePunchIn.data.error?.code, "(Expected: ALREADY_COMPLETED)");
  if (latePunchIn.status !== 400 || latePunchIn.data.error?.code !== "ALREADY_COMPLETED") {
    throw new Error("Punch in after punch out was not rejected!");
  }
  console.log("✓ Test E Passed.\n");

  // [TEST F] Duplicate Punch Out after already Punched Out (Should Fail)
  console.log("[TEST F] Duplicate Punch Out Attempt (Single-Action Rule)");
  const duplicatePunchOut = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT" },
  });
  console.log("- Status:", duplicatePunchOut.status, "(Expected: 400)");
  console.log("- Error Code:", duplicatePunchOut.data.error?.code, "(Expected: ALREADY_PUNCHED_OUT)");
  if (duplicatePunchOut.status !== 400 || duplicatePunchOut.data.error?.code !== "ALREADY_PUNCHED_OUT") {
    throw new Error("Duplicate punch out was not rejected!");
  }
  console.log("✓ Test F Passed.\n");

  // [TEST G] Verify GET /api/hrms/punch returns finalized state
  console.log("[TEST G] Checking GET /api/hrms/punch State");
  const getPunchRes = await request("/api/hrms/punch", {
    method: "GET",
    headers: { Cookie: empCookie },
  });
  console.log("- Punch In:", getPunchRes.data.data?.punchIn);
  console.log("- Punch Out:", getPunchRes.data.data?.punchOut);
  console.log("- Total Working Hours:", getPunchRes.data.data?.totalWorkingHours);
  console.log("- Status:", getPunchRes.data.data?.status);
  if (!getPunchRes.data.data?.punchIn || !getPunchRes.data.data?.punchOut) {
    throw new Error("Punched state not properly retained!");
  }
  console.log("✓ Test G Passed.\n");

  console.log("==========================================================================");
  console.log("🎉 ALL PUNCH IN / PUNCH OUT CONSTRAINT TESTS PASSED 100%!");
  console.log("==========================================================================");
}

runPunchTests().catch((err) => {
  console.error("❌ PUNCH TEST FAILED:", err);
  process.exit(1);
});
