const http = require("http");

http.get("http://localhost:3000/login", (res) => {
  console.log("Login page HTTP status:", res.statusCode);
  console.log("Headers:", res.headers["x-frame-options"], res.headers["x-content-type-options"]);
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on("error", (e) => {
  console.error("HTTP error:", e.message);
  process.exit(1);
});
