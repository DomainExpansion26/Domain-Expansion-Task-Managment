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

  let sessionCookie = "";

  // 1. Test Login as Super Admin
  const loginRes = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@domainexpansion.in", password: "password123" },
  });

  if (loginRes.status === 200 && loginRes.data.success) {
    const setCookie = loginRes.headers["set-cookie"];
    if (setCookie) {
      sessionCookie = setCookie[0].split(";")[0];
    }
  } else {
    throw new Error("Login failed: " + JSON.stringify(loginRes.data));
  }

  const authHeaders = { Cookie: sessionCookie };

  // 2. Test Get Authenticated User (/api/auth/me)
  const meRes = await request("/api/auth/me", { headers: authHeaders });

  // 3. Test Tasks API & Filters
  const tasksRes = await request("/api/tasks", { headers: authHeaders });

  // 4. Test Task Status Transition (Kanban move: TODO -> IN_PROGRESS)
  const updateRes = await request("/api/tasks/WEB-104", {
    method: "PATCH",
    headers: authHeaders,
    body: { status: "IN_PROGRESS" },
  });

  // 5. Test Threaded Comments & Mentions
  const commentRes = await request("/api/tasks/WEB-104/comments", {
    method: "POST",
    headers: authHeaders,
    body: { content: "Verified architecture and backend API routes! @Rahul Sharma" },
  });

  // 6. Test DX AI Assistant Tool Calling & Action Proposal
  const aiChatRes = await request("/api/ai/chat", {
    method: "POST",
    headers: authHeaders,
    body: { prompt: "Create a task for Rahul to build the login page by Monday with high priority" },
  });

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
  }

  // 7. Test Dev Mailbox (Transactional Emails Log)
  const emailRes = await request("/api/emails", { headers: authHeaders });
  emailRes.data.data.slice(0, 3).forEach((mail, idx) => {
  });

}

runVerification().catch(console.error);
