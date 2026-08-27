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

  // 1. Create a dedicated test user and activate for HRMS
  const testEmail = `punchtest_${Date.now()}@domainexpansion.in`;
  const testPassword = "Password@123";

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

  // [TEST A] Try Punch Out before Punch In (Should Fail)
  const prematurePunchOut = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT" },
  });
  if (prematurePunchOut.status !== 400 || prematurePunchOut.data.error?.code !== "NOT_PUNCHED_IN") {
    throw new Error("Premature punch out was not rejected!");
  }

  // [TEST B] First Punch In (Should Succeed)
  const firstPunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN", breakMinutes: 30, notes: "Morning start" },
  });
  if (firstPunchIn.status !== 200 || firstPunchIn.data.data?.status !== "PRESENT") {
    throw new Error("First punch in failed!");
  }

  // [TEST C] Duplicate Punch In while already punched in (Should Fail)
  const duplicatePunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN" },
  });
  if (duplicatePunchIn.status !== 400 || duplicatePunchIn.data.error?.code !== "ALREADY_PUNCHED_IN") {
    throw new Error("Duplicate punch in was not rejected!");
  }

  // [TEST D] Punch Out to Complete the Day (Should Succeed & Apply 8-Hour Rule)
  const punchOutRes = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT", breakMinutes: 45, notes: "End of shift" },
  });
  if (punchOutRes.status !== 200 || !punchOutRes.data.data?.punchOut) {
    throw new Error("Punch out failed!");
  }

  // [TEST E] Punch In Again after Punch Out (Should Fail - Shift Already Completed)
  const latePunchIn = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_IN" },
  });
  if (latePunchIn.status !== 400 || latePunchIn.data.error?.code !== "ALREADY_COMPLETED") {
    throw new Error("Punch in after punch out was not rejected!");
  }

  // [TEST F] Duplicate Punch Out after already Punched Out (Should Fail)
  const duplicatePunchOut = await request("/api/hrms/punch", {
    method: "POST",
    headers: { Cookie: empCookie },
    body: { action: "PUNCH_OUT" },
  });
  if (duplicatePunchOut.status !== 400 || duplicatePunchOut.data.error?.code !== "ALREADY_PUNCHED_OUT") {
    throw new Error("Duplicate punch out was not rejected!");
  }

  // [TEST G] Verify GET /api/hrms/punch returns finalized state
  const getPunchRes = await request("/api/hrms/punch", {
    method: "GET",
    headers: { Cookie: empCookie },
  });
  if (!getPunchRes.data.data?.punchIn || !getPunchRes.data.data?.punchOut) {
    throw new Error("Punched state not properly retained!");
  }

}

runPunchTests().catch((err) => {
  console.error("❌ PUNCH TEST FAILED:", err);
  process.exit(1);
});
