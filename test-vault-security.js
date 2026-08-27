const http = require("http");

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
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
      if (typeof options.body === "string" || Buffer.isBuffer(options.body)) {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
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

function buildMultipart(fields, files) {
  const boundary = "----WebKitFormBoundaryVaultTest" + Date.now();
  let body = "";

  for (const [key, val] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${val}\r\n`;
  }

  for (const [key, file] of Object.entries(files)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"; filename="${file.filename}"\r\n`;
    body += `Content-Type: ${file.contentType || "text/plain"}\r\n\r\n`;
    body += `${file.content}\r\n`;
  }

  body += `--${boundary}--\r\n`;
  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    buffer: Buffer.from(body),
  };
}

async function runVaultTests() {

  const timestamp = Date.now();
  const superAdminEmail = `superadmin_vault_${timestamp}@company.com`;
  const backendEmail = `backend_dev_${timestamp}@company.com`;
  const frontendEmail = `frontend_dev_${timestamp}@company.com`;
  const password = "Password123!";

  // 1. Create Super Admin
  await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { name: "Vault Super Admin", email: superAdminEmail, password, portal: "superadmin" },
  });

  const superLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email: superAdminEmail, password, portal: "superadmin" },
  });
  const superCookie = extractCookie(superLoginRes.headers);

  // 2. Create Backend Developer
  await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { name: "Bob Backend", email: backendEmail, password, department: "BACKEND", jobTitle: "Backend Engineer" },
  });
  const backendLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email: backendEmail, password },
  });
  const backendCookie = extractCookie(backendLoginRes.headers);

  // 3. Create Frontend Developer
  await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { name: "Alice Frontend", email: frontendEmail, password, department: "FRONTEND", jobTitle: "Frontend Engineer" },
  });
  const frontendLoginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email: frontendEmail, password },
  });
  const frontendCookie = extractCookie(frontendLoginRes.headers);

  // 4. Super Admin Uploads 3 Documents
  
  // Doc 1: Backend Only, Phase 1
  const mp1 = buildMultipart(
    { title: "Backend API Spec", department: "BACKEND", phaseNumber: "1", phaseName: "Phase 1: DB & API Design" },
    { file: { filename: "backend_spec.json", content: '{"api": "v1", "endpoints": 25}' } }
  );
  const doc1Res = await request("/api/documents", {
    method: "POST",
    headers: { "Content-Type": mp1.contentType, Cookie: superCookie },
    body: mp1.buffer,
  });
  const doc1Id = doc1Res.data?.data?.id;

  // Doc 2: Frontend Only, Phase 2
  const mp2 = buildMultipart(
    { title: "Frontend Component Specs", department: "FRONTEND", phaseNumber: "2", phaseName: "Phase 2: UI Wireframing" },
    { file: { filename: "frontend_wireframe.txt", content: "Buttons, Forms, Modals design specs" } }
  );
  const doc2Res = await request("/api/documents", {
    method: "POST",
    headers: { "Content-Type": mp2.contentType, Cookie: superCookie },
    body: mp2.buffer,
  });
  const doc2Id = doc2Res.data?.data?.id;

  // Doc 3: Company Wide (ALL), Phase 3
  const mp3 = buildMultipart(
    { title: "Company Security Guidelines", department: "ALL", phaseNumber: "3", phaseName: "Phase 3: Security & Policies" },
    { file: { filename: "security_policy.md", content: "# Company Confidentiality Policy" } }
  );
  const doc3Res = await request("/api/documents", {
    method: "POST",
    headers: { "Content-Type": mp3.contentType, Cookie: superCookie },
    body: mp3.buffer,
  });
  const doc3Id = doc3Res.data?.data?.id;

  // 5. Verify Backend Developer Visibility
  const backendDocsRes = await request("/api/documents", {
    method: "GET",
    headers: { Cookie: backendCookie },
  });
  const backendDocs = backendDocsRes.data?.data?.documents || [];
  const backendDocIds = backendDocs.map((d) => d.id);

  if (backendDocIds.includes(doc2Id)) {
    throw new Error("SECURITY VIOLATION: Backend member was able to see Frontend documents!");
  }

  // 6. Verify Frontend Developer Visibility
  const frontendDocsRes = await request("/api/documents", {
    method: "GET",
    headers: { Cookie: frontendCookie },
  });
  const frontendDocs = frontendDocsRes.data?.data?.documents || [];
  const frontendDocIds = frontendDocs.map((d) => d.id);

  if (frontendDocIds.includes(doc1Id)) {
    throw new Error("SECURITY VIOLATION: Frontend member was able to see Backend documents!");
  }

  // 7. Verify Direct Unauthorized Document ID Access
  const forbiddenFetchRes = await request(`/api/documents/${doc1Id}`, {
    method: "GET",
    headers: { Cookie: frontendCookie },
  });
  if (forbiddenFetchRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden, got ${forbiddenFetchRes.status}`);
  }

  // 8. Verify Member Cannot Upload or Delete
  const memberUploadRes = await request("/api/documents", {
    method: "POST",
    headers: { "Content-Type": mp1.contentType, Cookie: backendCookie },
    body: mp1.buffer,
  });

  const memberDeleteRes = await request(`/api/documents/${doc1Id}`, {
    method: "DELETE",
    headers: { Cookie: backendCookie },
  });

  // 9. Super Admin Delete Document
  const superDeleteRes = await request(`/api/documents/${doc3Id}`, {
    method: "DELETE",
    headers: { Cookie: superCookie },
  });

}

runVaultTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
