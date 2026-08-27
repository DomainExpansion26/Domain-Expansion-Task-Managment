const http = require("http");

http.get("http://localhost:3000/login", (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on("error", (e) => {
  console.error("HTTP error:", e.message);
  process.exit(1);
});
