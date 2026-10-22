// Tunes the AI drift gate against hand labels. Usage: node scripts/tune-drift.mjs q25-corp-after
import fs from "node:fs";
import { aiCorporateGate, DRIFT } from "../site/faithful.js";
import { toCorporateDetailed } from "../site/engine.js";
const R = "/workspace/project-synergy-research/variations/";
const tags = (process.argv[2] ?? "q25-corp-after").split(",");
const items = Object.fromEntries(JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url))).map((i) => [i.id, i]));
const lab = fs.readFileSync(`${R}labels-ai.tsv`, "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t"));
const rows = [];
for (const tag of tags) {
  const F = new Set(lab.filter((p) => p[2] === "F").map((p) => p[0].includes(":") ? p[0] + "|" + p[1] : `${tags.length && tag.startsWith("q25-") && !tag.includes("rag") ? "" : "x:"}${p[0]}|${p[1]}`));
  for (const [k, f, a, b] of lab.filter((p) => p[0] === "READ" && p[1].startsWith(tag + ".s"))) {
    const rs = fs.readFileSync(`${R}runs/${f}.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l)).slice(+a, +b);
    for (const r of rs) if (items[r.id].direction === "toCorporate") rows.push({ ...r, bad: F.has(`${r.id}|${r.level}`) || F.has(`${tag}:${r.id}|${r.level}`) });
  }
}
const pre = rows.filter((r) => { const save = { ...DRIFT }; DRIFT.missing = 1; DRIFT.novel = [99, 99, 99]; const g = aiCorporateGate(items[r.id].input, r.ai_text, { level: r.level }); Object.assign(DRIFT, save); return g.ok; });
const unsafe = (r) => toCorporateDetailed(items[r.id].input, { level: r.level, seed: 1 }).unsafe?.length;
const cands = pre.filter((r) => !unsafe(r));
console.log(`read ${rows.length}, pass other gates ${cands.length}, of which bad ${cands.filter((r) => r.bad).length}`);
for (const m of (process.argv[3] ?? "0,0.2,0.34,0.5").split(",").map(Number)) for (const nv of [[0, 0, 0], [0, 0, 1], [0, 1, 2], [1, 1, 2], [1, 2, 3], [2, 3, 5]]) {
  DRIFT.missing = m; DRIFT.novel = nv;
  const kept = cands.filter((r) => aiCorporateGate(items[r.id].input, r.ai_text, { level: r.level }).ok);
  const good = kept.filter((r) => !r.bad).length;
  console.log(`missing<=${m} novel<=${nv}: shown ${kept.length}/${rows.length}, precision ${(100 * good / Math.max(1, kept.length)).toFixed(1)}%, good kept ${good}`);
}
