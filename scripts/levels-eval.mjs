// Normal to corporate levels: runs Instant on every toCorporate item, all levels, with the variation checks
// and the distinctness check. Usage: node scripts/levels-eval.mjs <tag> [--print]
import fs from "node:fs";
import { toCorporateDetailed, normalizeCasual, normalizeInput } from "../site/engine.js";
import { distinctness, tokenSim, corporateScore } from "../site/register.js";
import { corporateFlags } from "../tests/variations/checks.mjs";

const tag = process.argv[2] ?? "now";
const print = process.argv.includes("--print");
const items = JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url))).filter((i) => i.direction === "toCorporate");
const dir = "/workspace/project-synergy-research/corporate-levels/";
const rows = [];
const sheet = [];
const dist = {};
const sims = [[], [], []];
let flaggedN = 0;
for (const item of items) {
  const outs = [1, 2, 3].map((level) => toCorporateDetailed(item.input, { level, seed: 1 }).text);
  const norm = normalizeCasual(normalizeInput(item.input)) || item.input;
  const flags = outs.map((o, i) => corporateFlags(item.input, o, i + 1));
  const d = distinctness(norm, outs);
  d.forEach((x) => (dist[x] = (dist[x] ?? 0) + 1));
  outs.forEach((o, i) => sims[i].push(tokenSim(norm, o)));
  if (flags.some((f) => f.length)) flaggedN++;
  rows.push({ id: item.id, category: item.category, input: item.input, outs, flags, distinct: d, scores: outs.map(corporateScore) });
  sheet.push(`[${item.id}] (${item.category}) ${item.input.replace(/\n/g, " / ")}${d.length ? `   {${d.join(",")}}` : ""}`);
  outs.forEach((o, i) => sheet.push(`  L${i + 1}: ${o.replace(/\n/g, " / ")}${flags[i].length ? `   <<${flags[i].join(",")}>>` : ""}`));
}
fs.writeFileSync(`${dir}levels-${tag}.jsonl`, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.writeFileSync(`${dir}levels-${tag}.txt`, sheet.join("\n") + "\n");
const mean = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
console.log(`${items.length} inputs. flagged rows ${flaggedN}. distinctness`, dist);
console.log(`mean sim to input L1 ${mean(sims[0])} L2 ${mean(sims[1])} L3 ${mean(sims[2])}; L1>=0.9: ${sims[0].filter((x) => x >= 0.9).length}`);
const fl = {};
for (const r of rows) for (const f of r.flags.flat()) fl[f.split(":")[0]] = (fl[f.split(":")[0]] ?? 0) + 1;
console.log("flags", fl);
if (print) console.log(sheet.join("\n"));
