// Adds Instant + hybrid to a model jsonl. Usage: node hybrid.mjs IN.jsonl OUT.jsonl
import fs from "node:fs";
import { toCorporateDetailed } from "../../site/engine.js";
import { pickRewrite } from "../../site/pick.js";
const rows = fs.readFileSync(process.argv[2], "utf8").trim().split("\n").map((l) => JSON.parse(l));
const stats = { model: [0, 0, 0], gate: {} };
for (const r of rows) {
  r.instant = [1, 2, 3].map((level) => toCorporateDetailed(r.input, { level, seed: 1 }).text);
  r.pick = [1, 2, 3].map((level) => pickRewrite(r.input, r.instant[level - 1], r.model[level - 1], { level }));
  r.hybrid = r.pick.map((p) => p.text);
  r.pick.forEach((p, i) => { if (p.engine === "model") stats.model[i]++; stats.gate[p.reason] = (stats.gate[p.reason] ?? 0) + 1; });
}
fs.writeFileSync(process.argv[3], rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
console.log(rows.length, "rows; model picked per level", stats.model, stats.gate);
