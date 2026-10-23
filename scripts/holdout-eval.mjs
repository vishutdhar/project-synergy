// Runs Instant on a held-out file at all three levels and writes a reading sheet.
// Usage: node scripts/holdout-eval.mjs <file.jsonl> <tag> [seed]
import fs from "node:fs";
import { toCorporateDetailed } from "../site/engine.js";
import { corporateFlags } from "../tests/variations/checks.mjs";

const [file, tag = "now", seed = "1"] = process.argv.slice(2);
const rows = fs.readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const dir = process.env.EVAL_DIR || "/workspace/project-synergy-research/shortfalls/";
const sheet = [];
const out = [];
let flagged = 0;
for (const r of rows) {
  const outs = [1, 2, 3].map((level) => toCorporateDetailed(r.input, { level, seed: Number(seed) }).text);
  const flags = outs.map((o, i) => corporateFlags(r.input, o, i + 1));
  if (flags.some((f) => f.length)) flagged++;
  out.push({ id: r.id, input: r.input, outs, flags });
  sheet.push(`#${r.id} [${r.category}] IN: ${r.input.replace(/\n/g, " / ")}`);
  outs.forEach((o, i) => sheet.push(` ${i + 1}: ${o.replace(/\n/g, " / ")}${flags[i].length ? `   <<${flags[i].join(",")}>>` : ""}`));
}
fs.writeFileSync(`${dir}eval-${tag}.txt`, sheet.join("\n") + "\n");
fs.writeFileSync(`${dir}eval-${tag}.jsonl`, out.map((o) => JSON.stringify(o)).join("\n") + "\n");
console.log(`${rows.length} rows, ${flagged} with automated flags -> eval-${tag}.txt`);
