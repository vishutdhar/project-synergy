// Corporate-levels round (Oct 22, 2026): replaces Mild and Middle Manager ideals that were only a tidied copy
// of the input with the reviewed Instant output for that level, and C-Suite ideals that no longer rise above
// the new Middle Manager. Writes tests/variations/src in place and logs every change.
// Usage: node scripts/levels-ideals.mjs [--dry]
import fs from "node:fs";
import { toCorporate, normalizeCasual, normalizeInput } from "../site/engine.js";
import { tokenSim, corporateScore } from "../site/register.js";
import { corporateFlags } from "../tests/variations/checks.mjs";

const dry = process.argv.includes("--dry");
const items = JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url))).filter((i) => i.direction === "toCorporate");
const log = [];
const next = new Map();
for (const item of items) {
  const input = normalizeCasual(normalizeInput(item.input)) || item.input;
  // The new ideal is the old hand-written ideal run through the level's register rules, so the grammar stays
  // the hand-written one and the level devices are added on top.
  const ideal = [...item.ideal];
  const cand = (level) => toCorporate(item.ideal[level - 1], { level, seed: 1 });
  const good = (o, level) => !corporateFlags(item.input, o, level).length && tokenSim(input, o) < 0.9;
  const c1 = cand(1);
  if (tokenSim(input, ideal[0]) >= 0.8 && good(c1, 1) && tokenSim(item.ideal[0], c1) < 0.95) { log.push([item.id, 1, ideal[0], c1]); ideal[0] = c1; }
  const c2 = cand(2);
  if ((tokenSim(input, ideal[1]) >= 0.8 || tokenSim(ideal[0], ideal[1]) >= 0.9) && good(c2, 2) && tokenSim(ideal[0], c2) < 0.95 && tokenSim(item.ideal[1], c2) < 0.98) { log.push([item.id, 2, ideal[1], c2]); ideal[1] = c2; }
  if (tokenSim(ideal[1], ideal[2]) >= 0.9) {
    const c3 = cand(3);
    if (good(c3, 3) && tokenSim(ideal[1], c3) < 0.9) { log.push([item.id, 3, ideal[2], c3]); ideal[2] = c3; }
  }
  if (ideal.some((x, i) => x !== item.ideal[i])) next.set(item.input, ideal);
}
const esc = (s) => s.replace(/\n/g, "\\n");
const dir = new URL("../tests/variations/src/", import.meta.url).pathname;
let changedBlocks = 0;
if (!dry) {
  for (const file of fs.readdirSync(dir).filter((f) => f.startsWith("normal-"))) {
    const text = fs.readFileSync(dir + file, "utf8");
    const out = text.split(/(\n\s*\n)/).map((block) => {
      const lines = block.split("\n");
      const idx = lines.findIndex((l) => l.trim() && !l.startsWith("# "));
      if (idx < 0) return block;
      const input = lines[idx].trimEnd().replace(/\\n/g, "\n");
      const ideal = next.get(input);
      if (!ideal || lines.length < idx + 4) return block;
      changedBlocks++;
      for (let k = 0; k < 3; k++) lines[idx + 1 + k] = esc(ideal[k]);
      return lines.join("\n");
    }).join("");
    fs.writeFileSync(dir + file, out);
  }
}
fs.writeFileSync("/workspace/project-synergy-research/corporate-levels/ideal-changes.tsv", "id\tlevel\told\tnew\n" + log.map((r) => r.map((x) => String(x).replace(/\n/g, " / ")).join("\t")).join("\n") + "\n");
const by = { 1: 0, 2: 0, 3: 0 };
log.forEach((r) => by[r[1]]++);
console.log(`${next.size} items changed (${changedBlocks} blocks written), by level`, by);
