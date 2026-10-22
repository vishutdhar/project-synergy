// Instant engine over the whole variations dataset at all three levels. Writes JSONL plus a readable sheet.
// Usage: node scripts/variations-eval.mjs <tag>
import fs from "node:fs";
import { toCorporateDetailed, toNormal } from "../site/engine.js";
import { corporateFlags, decodeFlags, overlap } from "../tests/variations/checks.mjs";

const tag = process.argv[2] ?? "now";
const items = JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url)));
const dir = "/workspace/project-synergy-research/variations/";
const rows = [];
const sheet = [];
for (const item of items) {
  sheet.push(`[${item.id}] (${item.category}${item.signal ? `, ${item.signal}` : ""}) ${item.input.replace(/\n/g, " / ")}`);
  for (const level of [1, 2, 3]) {
    if (item.direction === "toCorporate") {
      const r = toCorporateDetailed(item.input, { level, seed: 1 });
      const flags = corporateFlags(item.input, r.text, level);
      rows.push({ id: item.id, level, output: r.text, flags, sim: +overlap(r.text, item.ideal[level - 1]).toFixed(2) });
      sheet.push(`  L${level}: ${r.text.replace(/\n/g, " / ")}${flags.length ? `   <<${flags.join(",")}>>` : ""}`);
    } else {
      const r = toNormal(item.input, { level, seed: 1 });
      const flags = decodeFlags(item, r);
      rows.push({ id: item.id, level, summary: r.summary, signal: r.signal.id, lines: r.lines.map((l) => l.plain), flags, sim: +overlap(r.summary, item.ideal[level - 1]).toFixed(2) });
      sheet.push(`  L${level} [${r.signal.id}] S: ${r.summary}${flags.length ? `   <<${flags.join(",")}>>` : ""}`);
      r.lines.forEach((l, i) => sheet.push(`     ${i + 1}. ${l.plain}`));
    }
  }
}
fs.writeFileSync(`${dir}instant-${tag}.jsonl`, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
fs.writeFileSync(`${dir}instant-${tag}.txt`, sheet.join("\n") + "\n");
const flagged = rows.filter((r) => r.flags.length);
const by = {};
for (const r of flagged) for (const f of r.flags) by[f.split(":")[0]] = (by[f.split(":")[0]] ?? 0) + 1;
console.log(`${rows.length} outputs, ${flagged.length} flagged`, by);
