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

async function runInviteHierarchyTests() {

  const ts = Date.now();
  const superEmail = `super_inv_${ts}@domainexpansion.in`;
  const pmEmail = `pm_inv_${ts}@domainexpansion.in`;
  const leadEmail = `lead_inv_${ts}@domainexpansion.in`;
  const devEmail = `dev_inv_${ts}@domainexpansion.in`;
  const pwd = "Password123!";

  // 1. Super Admin Register & Login
  await request("/api/auth/register", {
    method: "POST",
    body: { name: "Executive Super Admin", email: superEmail, password: pwd, portal: "SUPER_ADMIN" },
  });
  const superLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: superEmail, password: pwd, portal: "SUPER_ADMIN" },
  });
  const superCookie = extractCookie(superLogin.headers);

  // 2. Super Admin Invites Project Manager
  const invitePM = await request("/api/auth/invite", {
    method: "POST",
    headers: { Cookie: superCookie },
    body: { name: "Invited PM", email: pmEmail, role: "MANAGER" },
  });
  const pmToken = invitePM.data.data?.invitation?.token;

  // Accept PM invite
  const acceptPM = await request("/api/auth/invite", {
    method: "PUT",
    body: { token: pmToken, password: pwd, jobTitle: "Project Manager", department: "Engineering" },
  });
  const pmCookie = extractCookie(acceptPM.headers);

  // 3. Project Manager Invites Team Lead
  const inviteLead = await request("/api/auth/invite", {
    method: "POST",
    headers: { Cookie: pmCookie },
    body: { name: "Invited Lead", email: leadEmail, role: "TEAM_LEAD" },
  });
  const leadToken = inviteLead.data.data?.invitation?.token;

  // Accept Team Lead invite
  const acceptLead = await request("/api/auth/invite", {
    method: "PUT",
    body: { token: leadToken, password: pwd, jobTitle: "Frontend Lead", department: "Frontend" },
  });
  const leadCookie = extractCookie(acceptLead.headers);

  // 4. Team Lead Invites Developer Member
  const inviteDev = await request("/api/auth/invite", {
    method: "POST",
    headers: { Cookie: leadCookie },
    body: { name: "Invited Dev", email: devEmail, role: "MEMBER" },
  });
  const devToken = inviteDev.data.data?.invitation?.token;

  // Accept Dev invite
  const acceptDev = await request("/api/auth/invite", {
    method: "PUT",
    body: { token: devToken, password: pwd, jobTitle: "UI Engineer", department: "Frontend" },
  });
  const devCookie = extractCookie(acceptDev.headers);

  // 5. Verification of Negative / Forbidden Cases

  // Team Lead attempts to invite Super Admin -> Should FAIL 403
  const badLeadInvite = await request("/api/auth/invite", {
    method: "POST",
    headers: { Cookie: leadCookie },
    body: { name: "Illegal Admin", email: `illegal_${ts}@domainexpansion.in`, role: "SUPER_ADMIN" },
  });

  // Regular Member attempts to invite someone -> Should FAIL 403
  const badDevInvite = await request("/api/auth/invite", {
    method: "POST",
    headers: { Cookie: devCookie },
    body: { name: "Friend", email: `friend_${ts}@domainexpansion.in`, role: "MEMBER" },
  });

}

runInviteHierarchyTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
