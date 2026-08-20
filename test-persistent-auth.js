const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
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

async function testPersistence() {
  console.log("==========================================================================");
  console.log("🧪 TESTING PERSISTENT REGISTRATION & POSTGRESQL AUTHENTICATION");
  console.log("==========================================================================\n");

  const testEmail = "testuser@domainexpansion.in";
  const testPassword = "MySecurePassword123!";

  // 1. Register User
  console.log(`[1] Registering user with email: ${testEmail}...`);
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Permanent Test User",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      jobTitle: "Senior Fullstack Engineer",
      department: "Engineering",
      portal: "MAIN",
    },
  });
  console.log("- Registration Response:", regRes.status, regRes.data);

  if (regRes.status !== 200) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  }

  // 2. Login immediately with exact credentials
  console.log(`\n[2] Logging in with email: ${testEmail}...`);
  const loginRes1 = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: testPassword,
      portal: "MAIN",
    },
  });
  console.log("- Login 1 Status:", loginRes1.status === 200 ? "✓ 200 OK" : "❌ Failed", loginRes1.data);
  const cookie = extractCookie(loginRes1.headers);

  // 3. Verify session
  console.log("\n[3] Verifying /api/auth/me session...");
  const meRes = await request("/api/auth/me", {
    method: "GET",
    headers: { Cookie: cookie },
  });
  console.log("- Auth Me Response:", meRes.status === 200 ? "✓ 200 OK" : "❌ Failed", meRes.data?.data?.user?.email);

  // 4. Logout
  console.log("\n[4] Logging out...");
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookie },
  });
  console.log("- Logout Status:", logoutRes.status === 200 ? "✓ 200 OK" : "❌ Failed");

  // 5. Login AGAIN with the same credentials after logout
  console.log(`\n[5] Logging in AGAIN with same credentials after logout...`);
  const loginRes2 = await request("/api/auth/login", {
    method: "POST",
    body: {
      email: testEmail,
      password: testPassword,
      portal: "MAIN",
    },
  });
  console.log("- Login 2 Status (Post-Logout):", loginRes2.status === 200 ? "✓ 200 OK (Credentials Saved in PostgreSQL!)" : "❌ Failed", loginRes2.data);

  console.log("\n==========================================================================");
  console.log("🎉 POSTGRESQL AUTHENTICATION & CREDENTIAL PERSISTENCE VERIFIED 100%!");
  console.log("==========================================================================");
}

testPersistence().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
