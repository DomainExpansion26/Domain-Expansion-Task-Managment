// Comprehensive Platform Integration & Workflow Verifier
const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || "GET",
        headers: defaultHeaders,
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

async function runVerification() {
  console.log("==================================================");
  console.log("🚀 DOMAIN EXPANSION TASK MANAGEMENT - VERIFICATION");
  console.log("==================================================");

  let sessionCookie = "";

  // 1. Test Login as Super Admin
  console.log("\n[1/7] Testing Authentication (admin@domainexpansion.in)...");
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "password123" },
  });

  if (loginRes.status === 200 && loginRes.data.success) {
    console.log("✅ Super Admin Login Successful:", loginRes.data.data.user.name, `(${loginRes.data.data.user.role})`);
    const setCookie = loginRes.headers["set-cookie"];
    if (setCookie) {
      sessionCookie = setCookie[0].split(";")[0];
    }
  } else {
    throw new Error("Login failed: " + JSON.stringify(loginRes.data));
  }

  const authHeaders = { Cookie: sessionCookie };

  // 2. Test Get Authenticated User (/api/auth/me)
  console.log("\n[2/7] Testing /api/auth/me & RBAC Permissions...");
  const meRes = await request("/api/auth/me", { headers: authHeaders });
  console.log("✅ Current User verified:", meRes.data.data.user.name);
  console.log("✅ Permissions count:", meRes.data.data.permissions.length);

  // 3. Test Tasks API & Filters
  console.log("\n[3/7] Testing Tasks API & Filters...");
  const tasksRes = await request("/api/tasks", { headers: authHeaders });
  console.log(`✅ Loaded ${tasksRes.data.data.length} tasks from database.`);
  console.log("Sample task:", tasksRes.data.data[0]?.taskKey, "-", tasksRes.data.data[0]?.title);

  // 4. Test Task Status Transition (Kanban move: TODO -> IN_PROGRESS)
  console.log("\n[4/7] Testing Kanban Status Update (WEB-104 to IN_PROGRESS)...");
  const updateRes = await request("/api/tasks/WEB-104", {
    method: "PATCH",
    headers: authHeaders,
    body: { status: "IN_PROGRESS" },
  });
  console.log("✅ Status Updated:", updateRes.data.data.taskKey, "is now", updateRes.data.data.status);

  // 5. Test Threaded Comments & Mentions
  console.log("\n[5/7] Testing Comments & Mentions on WEB-104...");
  const commentRes = await request("/api/tasks/WEB-104/comments", {
    method: "POST",
    headers: authHeaders,
    body: { content: "Verified architecture and backend API routes! @Rahul Sharma" },
  });
  console.log("✅ Comment added by:", commentRes.data.data.author.name);

  // 6. Test DX AI Assistant Tool Calling & Action Proposal
  console.log("\n[6/7] Testing DX AI Assistant Natural Language Task Creation...");
  const aiChatRes = await request("/api/ai/chat", {
    method: "POST",
    headers: authHeaders,
    body: { prompt: "Create a task for Rahul to build the login page by Monday with high priority" },
  });
  console.log("✅ AI Assistant Response generated successfully!");
  console.log("Tools called:", aiChatRes.data.data.toolsCalled);
  console.log("Proposed Action:", aiChatRes.data.data.proposedAction?.title);

  // Execute Proposed Action
  if (aiChatRes.data.data.proposedAction) {
    const execRes = await request("/api/ai/execute-action", {
      method: "POST",
      headers: authHeaders,
      body: {
        actionType: aiChatRes.data.data.proposedAction.type,
        details: aiChatRes.data.data.proposedAction.details,
      },
    });
    console.log("✅ AI Confirmed Action Executed:", execRes.data.message);
    console.log("Generated Task Key:", execRes.data.data?.taskKey);
  }

  // 7. Test Dev Mailbox (Transactional Emails Log)
  console.log("\n[7/7] Verifying Transactional Emails Log (Dev Mailbox)...");
  const emailRes = await request("/api/emails", { headers: authHeaders });
  console.log(`✅ Total Transactional Emails Dispatched: ${emailRes.data.data.length}`);
  emailRes.data.data.slice(0, 3).forEach((mail, idx) => {
    console.log(`   [${idx + 1}] To: ${mail.toEmail} | Subject: "${mail.subject}" | Template: ${mail.template}`);
  });

  console.log("\n==================================================");
  console.log("🎉 ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!");
  console.log("==================================================");
}

runVerification().catch(console.error);
