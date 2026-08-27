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

async function testUpload() {
  const email = `uploader_${Date.now()}@company.com`;
  const password = "Password123!";

  await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { name: "Test Uploader", email, password },
  });

  const loginRes = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email, password },
  });

  const cookie = extractCookie(loginRes.headers);

  // Build multipart form data
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  const fileContent = "Supabase Cloud Storage Integration Test: Success!";
  
  let body = "";
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="supabase_test_report.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += fileContent + `\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="folder"\r\n\r\n`;
  body += `tasks\r\n`;
  body += `--${boundary}--\r\n`;

  const uploadRes = await request("/api/storage/upload", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Cookie": cookie,
    },
    body: Buffer.from(body),
  });

}

testUpload().catch(console.error);
