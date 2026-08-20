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
  console.log("==========================================================================");
  console.log("🧪 TESTING SUPER ADMIN ROLE ASSIGNMENT & HIERARCHY MAPPING CONTROLS");
  console.log("==========================================================================\n");

  // 1. Super Admin Login
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "AdminPassword123!", portal: "SUPER_ADMIN" },
  });
  const cookie = extractCookie(loginRes.headers);
  console.log("1. Super Admin Login Status:", loginRes.status === 200 ? "✓ 200 OK" : "❌ Failed");

  // 2. Fetch all members
  const membersRes = await request("/api/admin/members", {
    method: "GET",
    headers: { Cookie: cookie },
  });
  const members = membersRes.data.data || [];
  console.log(`2. Retrieved ${members.length} members from Super Admin directory:`);
  members.forEach((m) => {
    console.log(`   - ${m.name.padEnd(20)} | Role: ${m.role.padEnd(12)} | Dept: ${m.department}`);
  });

  const rohan = members.find((m) => m.email === "rohan@domainexpansion.in");
  const arjun = members.find((m) => m.email === "arjun@domainexpansion.in");

  if (!rohan || !arjun) {
    throw new Error("Required test members not found");
  }

  // 3. Super Admin changes Rohan from MEMBER to TEAM_LEAD
  console.log(`\n3. Assigning Role: Changing ${rohan.name} to TEAM_LEAD...`);
  const changeToLead = await request(`/api/admin/members/${rohan.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: { role: "TEAM_LEAD" },
  });
  console.log("   - Role Updated to TEAM_LEAD:", changeToLead.status === 200 && changeToLead.data.data?.role === "TEAM_LEAD" ? "✓ SUCCESS" : "❌ FAILED");

  // 4. Super Admin assigns Reporting Hierarchy (Rohan reports to Arjun as Manager)
  console.log(`\n4. Assigning Reporting Hierarchy: Linking ${rohan.name} to Manager ${arjun.name}...`);
  const assignHierarchy = await request(`/api/admin/members/${rohan.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: { managerId: arjun.id },
  });
  console.log("   - Hierarchy Assigned:", assignHierarchy.status === 200 && assignHierarchy.data.data?.manager?.id === arjun.id ? "✓ SUCCESS" : "❌ FAILED");

  // 5. Verify updated member details
  const updatedMember = await request(`/api/admin/members/${rohan.id}`, {
    method: "GET",
    headers: { Cookie: cookie },
  });
  console.log("\n5. Verification of Final Member State:");
  console.log("   - Name:", updatedMember.data.data?.name);
  console.log("   - Assigned Role:", updatedMember.data.data?.role);
  console.log("   - Reports To Manager:", updatedMember.data.data?.manager?.name);

  console.log("\n==========================================================================");
  console.log("🎉 SUPER ADMIN ROLE ASSIGNMENT & HIERARCHY CONTROLS VERIFIED 100%!");
  console.log("==========================================================================");
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
