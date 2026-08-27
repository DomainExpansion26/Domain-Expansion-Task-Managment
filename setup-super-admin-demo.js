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

async function main() {
  await request("/api/auth/register", {
    method: "POST",
    body: { name: "Super Administrator", email: "admin@domainexpansion.in", password: "AdminPassword123!", portal: "SUPER_ADMIN", jobTitle: "Chief Executive Officer" },
  });

  const loginSuper = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "AdminPassword123!", portal: "SUPER_ADMIN" },
  });
  const cookie = extractCookie(loginSuper.headers);

  // Add 3 sample members with different roles
  await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: cookie },
    body: { name: "Arjun Verma", email: "arjun@domainexpansion.in", password: "Password123!", role: "MANAGER", jobTitle: "Project Manager", department: "Engineering" },
  });

  await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: cookie },
    body: { name: "Sneha Patel", email: "sneha@domainexpansion.in", password: "Password123!", role: "TEAM_LEAD", jobTitle: "Frontend Lead", department: "Frontend" },
  });

  await request("/api/admin/members", {
    method: "POST",
    headers: { Cookie: cookie },
    body: { name: "Rohan Gupta", email: "rohan@domainexpansion.in", password: "Password123!", role: "MEMBER", jobTitle: "UI Developer", department: "Frontend" },
  });
}

main().catch(console.error);
