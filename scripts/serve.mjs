// Tiny static server for local previews. Applies site/_headers the way Cloudflare Pages does
// (simple * patterns), so the CSP and security headers get tested locally too.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? new URL("../site", import.meta.url).pathname);
const port = Number(process.argv[3] ?? 8787);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
};

function parseHeaders() {
  const file = path.join(root, "_headers");
  if (!fs.existsSync(file)) return [];
  const rules = [];
  let cur = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      cur = { re: new RegExp("^" + line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"), headers: {} };
      rules.push(cur);
    } else if (cur) {
      const i = line.indexOf(":");
      cur.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root) || path.basename(file) === "_headers" || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain" });
    return res.end("Not found");
  }
  const headers = { "content-type": types[path.extname(file)] ?? "application/octet-stream" };
  for (const rule of parseHeaders()) {
    if (rule.re.test(url.pathname)) Object.assign(headers, rule.headers);
  }
  // Local preview runs on plain http, so skip the https upgrade.
  if (headers["Content-Security-Policy"]) headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(/;\s*upgrade-insecure-requests/, "");
  delete headers["Strict-Transport-Security"];
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}).listen(port, "0.0.0.0", () => console.log(`Serving ${root} on http://localhost:${port}`));
