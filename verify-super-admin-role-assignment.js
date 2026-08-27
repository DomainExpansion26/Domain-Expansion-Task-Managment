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

async function verify() {

  // 1. Super Admin Login
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "AdminPassword123!", portal: "SUPER_ADMIN" },
  });
  const cookie = extractCookie(loginRes.headers);

  // 2. Fetch all members
  const membersRes = await request("/api/admin/members", {
    method: "GET",
    headers: { Cookie: cookie },
  });
  const members = membersRes.data.data || [];
  members.forEach((m) => {
  });

  const rohan = members.find((m) => m.email === "rohan@domainexpansion.in");
  const arjun = members.find((m) => m.email === "arjun@domainexpansion.in");

  if (!rohan || !arjun) {
    throw new Error("Required test members not found");
  }

  // 3. Super Admin changes Rohan from MEMBER to TEAM_LEAD
  const changeToLead = await request(`/api/admin/members/${rohan.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: { role: "TEAM_LEAD" },
  });

  // 4. Super Admin assigns Reporting Hierarchy (Rohan reports to Arjun as Manager)
  const assignHierarchy = await request(`/api/admin/members/${rohan.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: { managerId: arjun.id },
  });

  // 5. Verify updated member details
  const updatedMember = await request(`/api/admin/members/${rohan.id}`, {
    method: "GET",
    headers: { Cookie: cookie },
  });

}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
