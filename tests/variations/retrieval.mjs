// Nearest hand-written examples from the variations dataset, for retrieval few-shot prompts.
// The page uses the same code (site/ai-prompts.js) with site/examples.js as the pool.
import fs from "node:fs";
import { nearestExamples as nearest } from "../../site/ai-prompts.js";

let pool = null;
export function examplePool() {
  pool ??= JSON.parse(fs.readFileSync(new URL("./items.json", import.meta.url))).filter((i) => i.direction === "toCorporate").map((i) => ({ id: i.id, input: i.input, ideal: i.ideal }));
  return pool;
}
export const nearestExamples = (text, opts = {}) => nearest(text, examplePool(), opts);
