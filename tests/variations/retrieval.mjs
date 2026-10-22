// Nearest hand-written examples from the variations dataset, for retrieval few-shot prompts.
// Similarity is word overlap (Jaccard on lowercased word sets), which is cheap enough for the browser.
import fs from "node:fs";

let pool = null;
const words = (s) => new Set(String(s).toLowerCase().match(/[a-z']+/g) ?? []);
function load() {
  if (pool) return pool;
  const items = JSON.parse(fs.readFileSync(new URL("./items.json", import.meta.url)));
  pool = items.filter((i) => i.direction === "toCorporate").map((i) => ({ id: i.id, input: i.input, ideal: i.ideal, w: words(i.input) }));
  return pool;
}
export function nearestExamples(text, { level = 2, k = 4, exclude = "" } = {}) {
  const w = words(text);
  const score = (e) => { let inter = 0; for (const x of w) if (e.w.has(x)) inter++; return inter / (w.size + e.w.size - inter || 1); };
  return load().filter((e) => e.id !== exclude && !e.input.includes("\n")).map((e) => [score(e), e]).sort((a, b) => b[0] - a[0]).slice(0, k).reverse().map(([, e]) => [e.input, e.ideal[level - 1]]);
}
