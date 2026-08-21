const BASE_URL = "http://localhost:3001";

async function testLogin(email, password, portal = "MAIN", expectedRole) {
  console.log(`\nTesting Login for [${email}] with portal [${portal}]...`);
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal }),
    });

    const data = await res.json();
    console.log(`Status: ${res.status}, Success: ${data.success}`);
    if (!data.success) {
      console.error(`❌ Failed:`, data.error);
      return false;
    }

    console.log(`✅ Success! User: ${data.data.user.name}, Role: ${data.data.user.role}, Token: ${data.data.token.substring(0, 20)}...`);
    return true;
  } catch (err) {
    console.error(`❌ Network error:`, err.message);
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("🔐 TESTING ALL USER LOGINS & PORTAL ACCESS");
  console.log("==================================================");

  const usersToTest = [
    { email: "admin@domainexpansion.in", pass: "password123", portal: "SUPER_ADMIN", role: "SUPER_ADMIN" },
    { email: "admin@domainexpansion.in", pass: "password123", portal: "MAIN", role: "SUPER_ADMIN" },
    { email: "pooja@domainexpansion.in", pass: "password123", portal: "HRMS", role: "HR_ADMIN" },
    { email: "rahul@domainexpansion.in", pass: "password123", portal: "MAIN", role: "MANAGER" },
    { email: "priya@domainexpansion.in", pass: "password123", portal: "MAIN", role: "TEAM_LEAD" },
    { email: "neha@domainexpansion.in", pass: "password123", portal: "MAIN", role: "QA" },
    { email: "sneha@domainexpansion.in", pass: "password123", portal: "MAIN", role: "MEMBER" },
    { email: "amit@domainexpansion.in", pass: "password123", portal: "MAIN", role: "MEMBER" },
  ];

  let passed = 0;
  for (const u of usersToTest) {
    const ok = await testLogin(u.email, u.pass, u.portal, u.role);
    if (ok) passed++;
  }

  console.log("\n==================================================");
  console.log(`Summary: ${passed}/${usersToTest.length} logins succeeded!`);
  console.log("==================================================");

  if (passed === usersToTest.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run();
