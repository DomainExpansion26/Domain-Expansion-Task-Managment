const http = require("http");

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAll() {
  console.log("--- 1. Testing Super Admin Registration ---");
  const testEmail = `admin_${Date.now()}@domainexpansion.in`;
  const testPass = "Admin@12345";

  const regRes = await makeRequest(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      name: "Super Admin User",
      email: testEmail,
      password: testPass,
      confirmPassword: testPass,
      portal: "SUPER_ADMIN",
    }
  );
  console.log("Register Response:", regRes.status, regRes.body);

  console.log("\n--- 2. Testing Super Admin Portal Login ---");
  const loginRes = await makeRequest(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      email: testEmail,
      password: testPass,
      portal: "SUPER_ADMIN",
    }
  );
  console.log("Super Admin Login Response:", loginRes.status, loginRes.body?.message, "User Role:", loginRes.body?.data?.user?.role);

  const cookie = loginRes.headers["set-cookie"]?.[0]?.split(";")[0];
  console.log("Session Cookie:", cookie ? "Obtained" : "Missing");

  console.log("\n--- 3. Testing Normal Portal Login with Same Credentials ---");
  const normalLoginRes = await makeRequest(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      email: `  ${testEmail.toUpperCase()}  `, // Test casing and space resilience
      password: ` ${testPass} `, // Test whitespace resilience
      portal: "MAIN",
    }
  );
  console.log("Normal Login (with spaces/casing) Response:", normalLoginRes.status, normalLoginRes.body?.message);

  console.log("\n--- 4. Testing HRMS Portal Login with Same Credentials ---");
  const hrmsLoginRes = await makeRequest(
    {
      hostname: "localhost",
      port: 3001,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    {
      email: testEmail,
      password: testPass,
      portal: "HRMS",
    }
  );
  console.log("HRMS Login Response:", hrmsLoginRes.status, hrmsLoginRes.body?.message);

  console.log("\n--- 5. Testing Active Session /api/auth/me ---");
  const meRes = await makeRequest({
    hostname: "localhost",
    port: 3001,
    path: "/api/auth/me",
    method: "GET",
    headers: { Cookie: cookie },
  });
  console.log("Me Response:", meRes.status, meRes.body?.data?.user?.name, "Role:", meRes.body?.data?.user?.role);

  console.log("\n--- 6. Testing QA Dashboard /api/qa/dashboard ---");
  const qaRes = await makeRequest({
    hostname: "localhost",
    port: 3001,
    path: "/api/qa/dashboard",
    method: "GET",
    headers: { Cookie: cookie },
  });
  console.log("QA Dashboard Response:", qaRes.status, "Counts:", qaRes.body?.data?.counts);
}

testAll().catch(console.error);
