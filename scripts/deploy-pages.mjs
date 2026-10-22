// Cloudflare Pages direct upload helper for Project Synergy (static site, no Functions).
//
// Commands:
//   node scripts/deploy-pages.mjs manifest   Print the deployment manifest (path -> hash). Needs no key.
//   node scripts/deploy-pages.mjs upload     Upload any missing files to the Pages asset store.
//
// The upload step needs the project's short-lived upload token (a JWT from
// GET /accounts/{account_id}/pages/projects/project-synergy/upload-token).
// It is read at runtime from the file named in CF_PAGES_UPLOAD_JWT_FILE (or from
// CF_PAGES_UPLOAD_JWT). This script never prints, logs or stores the token.
//
// Full redeploy:
//   1. Get the upload token through the Cloudflare connector and save it to a chmod 600 temp file.
//   2. CF_PAGES_UPLOAD_JWT_FILE=/path/to/tmpfile node scripts/deploy-pages.mjs upload
//   3. node scripts/deploy-pages.mjs manifest > /tmp/manifest.json
//   4. Through the connector, POST /accounts/{account_id}/pages/projects/project-synergy/deployments
//      as multipart/form-data with fields: manifest (the JSON), branch=main, _headers (site/_headers).
//   5. Delete the token file.
//
// Hashing follows wrangler: blake3(base64(content) + extension), first 32 hex characters.
import fs from "node:fs";
import path from "node:path";
import { blake3 } from "@noble/hashes/blake3";
import { bytesToHex } from "@noble/hashes/utils";

const SITE = path.resolve(new URL("../site", import.meta.url).pathname);
const API = "https://api.cloudflare.com/client/v4";
// Files Pages treats as config. They are not assets.
const SKIP = new Set(["_headers", "_redirects", "_routes.json", "_worker.js"]);
const MAX_BYTES = 25 * 1024 * 1024;
const TYPES = {
  html: "text/html", js: "application/javascript", mjs: "application/javascript", css: "text/css", svg: "image/svg+xml",
  png: "image/png", ico: "image/x-icon", txt: "text/plain", json: "application/json", webmanifest: "application/manifest+json",
};

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (!SKIP.has(path.relative(base, full))) out.push(full);
  }
  return out.sort();
}

function hashFile(file) {
  const base64 = fs.readFileSync(file).toString("base64");
  const ext = path.extname(file).slice(1);
  return bytesToHex(blake3(new TextEncoder().encode(base64 + ext))).slice(0, 32);
}

export function buildManifest() {
  const files = listFiles(SITE).map((full) => {
    const size = fs.statSync(full).size;
    if (size > MAX_BYTES) throw new Error(`${full} is over the 25 MiB Pages limit`);
    return { full, key: "/" + path.relative(SITE, full).split(path.sep).join("/"), hash: hashFile(full), size };
  });
  return files;
}

function readToken() {
  const file = process.env.CF_PAGES_UPLOAD_JWT_FILE;
  const token = (file ? fs.readFileSync(file, "utf8") : process.env.CF_PAGES_UPLOAD_JWT ?? "").trim();
  if (!token) throw new Error("No upload token. Set CF_PAGES_UPLOAD_JWT_FILE or CF_PAGES_UPLOAD_JWT.");
  return token;
}

async function call(token, endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const msg = (json.errors ?? []).map((e) => `${e.code} ${e.message}`).join("; ");
    if (res.status === 401) throw new Error(`${endpoint}: HTTP 401, the upload token probably expired. Fetch a new one. ${msg}`);
    throw new Error(`${endpoint}: HTTP ${res.status} ${msg}`);
  }
  return json.result;
}

async function upload() {
  const token = readToken();
  const files = buildManifest();
  const missing = new Set(await call(token, "/pages/assets/check-missing", { hashes: files.map((f) => f.hash) }));
  const todo = files.filter((f) => missing.has(f.hash));
  // Batches stay well under the request size limit.
  let batch = [];
  let bytes = 0;
  const flush = async () => {
    if (!batch.length) return;
    await call(token, "/pages/assets/upload", batch);
    batch = [];
    bytes = 0;
  };
  for (const f of todo) {
    const value = fs.readFileSync(f.full).toString("base64");
    if (bytes + value.length > 20 * 1024 * 1024) await flush();
    batch.push({ key: f.hash, value, metadata: { contentType: TYPES[path.extname(f.full).slice(1)] ?? "application/octet-stream" }, base64: true });
    bytes += value.length;
  }
  await flush();
  await call(token, "/pages/assets/upsert-hashes", { hashes: files.map((f) => f.hash) });
  console.log(`Files: ${files.length}. Uploaded: ${todo.length}. Already stored: ${files.length - todo.length}.`);
}

const cmd = process.argv[2];
if (cmd === "manifest") {
  console.log(JSON.stringify(Object.fromEntries(buildManifest().map((f) => [f.key, f.hash])), null, 2));
} else if (cmd === "upload") {
  upload().catch((err) => {
    console.error(String(err.message ?? err));
    process.exit(1);
  });
} else {
  console.error("Usage: node scripts/deploy-pages.mjs manifest|upload");
  process.exit(2);
}
