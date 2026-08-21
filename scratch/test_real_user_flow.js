const BASE_URL = "http://localhost:3001";

async function main() {
  console.log("==================================================");
  console.log("🧪 TESTING MANUAL REAL USER CREATION & LOGIN FLOW");
  console.log("==================================================");

  const testUser = {
    name: "Suraj Admin",
    email: "suraj@mycompany.com",
    password: "MySecurePassword123!",
    confirmPassword: "MySecurePassword123!",
    jobTitle: "Chief Architect",
    department: "Executive Management",
    portal: "MAIN",
  };

  console.log(`\n1. Registering user [${testUser.email}]...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });

  const regData = await regRes.json();
  console.log(`Registration Status: ${regRes.status}, Success: ${regData.success}`);
  if (!regData.success) {
    console.error("❌ Registration failed:", regData.error);
    process.exit(1);
  }
  console.log(`✅ User registered successfully! Role: ${regData.data.user.role}`);

  console.log(`\n2. Logging in with registered user [${testUser.email}]...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
      portal: "MAIN",
    }),
  });

  const loginData = await loginRes.json();
  console.log(`Login Status: ${loginRes.status}, Success: ${loginData.success}`);
  if (!loginData.success) {
    console.error("❌ Login failed:", loginData.error);
    process.exit(1);
  }

  console.log(`✅ Login succeeded! User: ${loginData.data.user.name}, Role: ${loginData.data.user.role}`);

  console.log(`\n3. Verifying Session via /api/auth/me with Token...`);
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${loginData.data.token}`,
    },
  });

  const meData = await meRes.json();
  console.log(`/api/auth/me Status: ${meRes.status}, Success: ${meData.success}`);
  if (!meData.success) {
    console.error("❌ /api/auth/me failed:", meData.error);
    process.exit(1);
  }

  console.log(`✅ Authenticated Session: ${meData.data.user.name} (${meData.data.user.email}) - Permissions: ${meData.data.permissions.length}`);

  console.log("\n==================================================");
  console.log("🎉 ALL REAL USER REGISTRATION & LOGIN CHECKS PASSED!");
  console.log("==================================================");
}

main().catch(console.error);
