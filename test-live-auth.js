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

async function testLiveAuth() {

  const email = `employee_${Date.now()}@domainexpansion.in`;
  const password = "ProductionPass123!";

  // 1. Create Account via /api/auth/register
  const regRes = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Live Test Engineer",
      email: email,
      password: password,
      confirmPassword: password,
      jobTitle: "Cloud Engineer",
      department: "Infrastructure",
      portal: "MAIN",
    },
  });

  // 2. Login
  const login1 = await request("/api/auth/login", {
    method: "POST",
    body: { email, password, portal: "MAIN" },
  });
  const cookie = extractCookie(login1.headers);

  // 3. Verify session
  const meRes = await request("/api/auth/me", {
    method: "GET",
    headers: { Cookie: cookie },
  });

  // 4. Logout
  const logoutRes = await request("/api/auth/logout", {
    method: "POST",
    headers: { Cookie: cookie },
  });

  // 5. Subsequent Login after logout
  const login2 = await request("/api/auth/login", {
    method: "POST",
    body: { email, password, portal: "MAIN" },
  });

}

testLiveAuth().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
