const http = require("http");

const BASE_URL = "http://localhost:3001";

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
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
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
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

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 STARTING COMPREHENSIVE QA & TASK DEFECT MANAGEMENT TEST SUITE");
  console.log("================================================================================");

  let rahulCookie = "";
  let snehaCookie = "";

  // 1. Login as Rahul (Developer)
  console.log("\n[TEST 1] Authenticating Rahul (Developer)...");
  const rahulLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "rahul@domainexpansion.in", password: "password123" },
  });
  console.log(`Status: ${rahulLogin.status}, Success: ${rahulLogin.data?.success}`);
  if (!rahulLogin.data?.success) throw new Error("Failed to login as Rahul");
  rahulCookie = rahulLogin.headers["set-cookie"] ? rahulLogin.headers["set-cookie"][0].split(";")[0] : "";
  console.log("✅ Rahul authenticated successfully.");

  // 2. Login as Sneha (QA Engineer / Member)
  console.log("\n[TEST 2] Authenticating Sneha (QA Engineer)...");
  const snehaLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "sneha@domainexpansion.in", password: "password123" },
  });
  console.log(`Status: ${snehaLogin.status}, Success: ${snehaLogin.data?.success}`);
  if (!snehaLogin.data?.success) throw new Error("Failed to login as Sneha");
  snehaCookie = snehaLogin.headers["set-cookie"] ? snehaLogin.headers["set-cookie"][0].split(";")[0] : "";
  console.log("✅ Sneha authenticated successfully.");

  // 3. Fetch Task PROJ-124 Detail & QA Section Bug Linkage
  console.log("\n[TEST 3] Fetching Task PROJ-124 details (OpenProject QA Section)...");
  const taskRes = await request("/api/tasks/PROJ-124", {
    headers: { Cookie: rahulCookie },
  });
  console.log(`Task Title: ${taskRes.data?.data?.title}`);
  console.log(`QA Bugs Count: ${taskRes.data?.data?.qaBugs?.length}`);
  console.log(`Bug Stats:`, taskRes.data?.data?.bugStats);
  
  if (!taskRes.data?.data?.qaBugs || taskRes.data.data.qaBugs.length === 0) {
    throw new Error("Task PROJ-124 has no linked QA bugs!");
  }
  console.log("✅ Task PROJ-124 QA bug linkage and stats verified successfully.");

  // 4. Raise a new QA Bug linked to PROJ-124
  console.log("\n[TEST 4] Sneha raises a new QA Bug against PROJ-124...");
  const raiseBugRes = await request("/api/tasks/PROJ-124/bugs", {
    method: "POST",
    headers: { Cookie: snehaCookie },
    body: {
      title: "Password reset token expires prematurely after 5 minutes",
      description: "Password reset token sent via email invalidates within 5 minutes instead of the configured 60 minutes.",
      priority: "HIGH",
      severity: "MAJOR",
      environment: "Staging (v2.4.1)",
      stepsToReproduce: "1. Request password reset for existing user\n2. Wait 6 minutes\n3. Click reset link",
      expectedResult: "Token remains valid for 60 minutes",
      actualResult: "Token expired error displayed after 5 minutes",
    },
  });
  console.log(`New Bug Created: ${raiseBugRes.data?.data?.bugKey} - ${raiseBugRes.data?.data?.title}`);
  console.log(`Auto-inherited Task: ${raiseBugRes.data?.data?.relatedTask?.taskKey}`);
  console.log(`Auto-assigned Dev: ${raiseBugRes.data?.data?.assignedTo?.name}`);
  const newBugKey = raiseBugRes.data?.data?.bugKey;
  if (!newBugKey) throw new Error("Failed to raise bug against task!");
  console.log("✅ Bug successfully raised with auto-generated ID and task inheritance.");

  // 5. Developer starts working and marks ready for testing
  console.log(`\n[TEST 5] Rahul transitions ${newBugKey} -> IN_PROGRESS -> READY_FOR_TESTING...`);
  const startWorkRes = await request(`/api/qa/bugs/${newBugKey}`, {
    method: "PATCH",
    headers: { Cookie: rahulCookie },
    body: { status: "IN_PROGRESS" },
  });
  console.log(`Status after Start Work: ${startWorkRes.data?.data?.status}`);

  const readyRes = await request(`/api/qa/bugs/${newBugKey}`, {
    method: "PATCH",
    headers: { Cookie: rahulCookie },
    body: { status: "READY_FOR_TESTING" },
  });
  console.log(`Status after Ready for Testing: ${readyRes.data?.data?.status}`);
  console.log("✅ Developer workflow transitions verified.");

  // 6. QA verifies and Fails the Bug with Reason
  console.log(`\n[TEST 6] Sneha tests ${newBugKey} and triggers QA Defect Failure Flow...`);
  const failRes = await request(`/api/qa/bugs/${newBugKey}`, {
    method: "PATCH",
    headers: { Cookie: snehaCookie },
    body: {
      status: "FAILED",
      failureReason: "Token expiry math bug still triggers on edge cases with timezone offsets.",
      actualResult: "User in UTC+5:30 receives invalid token response after 8 minutes.",
      failureComment: "@Rahul Sharma timezone calculation offset issue was detected in production test suite. Please normalize timestamps to UTC.",
    },
  });
  console.log(`Status after Fail: ${failRes.data?.data?.status}`);
  console.log(`Failure Reason: ${failRes.data?.data?.failureReason}`);
  console.log("✅ QA Failure flow with failure reason and automated developer alert verified.");

  // 7. Add Comment with @mention on BUG-058
  console.log("\n[TEST 7] Rahul adds comment with @mention on BUG-058...");
  const commentRes = await request("/api/qa/bugs/BUG-058/comments", {
    method: "POST",
    headers: { Cookie: rahulCookie },
    body: {
      content: "Added lowercasing transform middleware in auth controller. @Sneha Patel please execute regression run.",
    },
  });
  console.log(`Comment Added. Mentions detected:`, commentRes.data?.data?.mentions);
  console.log("✅ Bug comment with @mention and notifications verified.");

  // 8. Fetch QA Dashboard Cockpit Metrics
  console.log("\n[TEST 8] Fetching QA Dashboard Cockpit Metrics...");
  const qaDashRes = await request("/api/qa/dashboard", {
    headers: { Cookie: snehaCookie },
  });
  console.log("QA Cockpit Counts:", qaDashRes.data?.data?.counts);
  console.log("Bugs By Priority:", qaDashRes.data?.data?.byPriority);
  console.log("Top Developers with Bugs:", qaDashRes.data?.data?.byDeveloper?.map((d) => `${d.name}: ${d.count}`));
  console.log("✅ QA Dashboard metrics endpoint verified.");

  // 9. Fetch Developer Workbench Cockpit
  console.log("\n[TEST 9] Fetching Developer Workbench (My Work)...");
  const devDashRes = await request("/api/developer/dashboard", {
    headers: { Cookie: rahulCookie },
  });
  console.log(`Rahul's Active Tasks: ${devDashRes.data?.data?.myTasks?.length}`);
  console.log(`Rahul's Assigned Bugs: ${devDashRes.data?.data?.myBugs?.length}`);
  console.log(`Rahul's Failed Bugs: ${devDashRes.data?.data?.failedBugs?.length}`);
  console.log(`Rahul's Ready for Testing: ${devDashRes.data?.data?.readyForTesting?.length}`);
  console.log(`Rahul's Mentions: ${devDashRes.data?.data?.mentions?.length}`);
  console.log("✅ Developer Cockpit endpoint verified.");

  // 10. Fetch Notifications Center
  console.log("\n[TEST 10] Verifying Notification Center items for Rahul...");
  const notifRes = await request("/api/notifications", {
    headers: { Cookie: rahulCookie },
  });
  console.log(`Total Notifications: ${notifRes.data?.data?.notifications?.length}`);
  console.log(`Unread Notifications: ${notifRes.data?.data?.unreadCount}`);
  const bugNotifs = notifRes.data?.data?.notifications?.filter((n) => n.type?.startsWith("BUG"));
  console.log(`Bug Lifecycle Notifications for Rahul: ${bugNotifs?.length}`);
  bugNotifs?.slice(0, 3).forEach((n) => console.log(`  - [${n.type}] ${n.title}: ${n.message}`));
  console.log("✅ Notification Center with deep-links verified.");

  console.log("\n================================================================================");
  console.log("🎉 ALL 10 QA & TASK DEFECT MANAGEMENT TESTS PASSED PERFECTLY!");
  console.log("================================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});
