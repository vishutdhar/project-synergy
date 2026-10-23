// Model rewrites for a jsonl batch with Transformers.js q8 (what the page runs). Usage: node node-batch.mjs MODEL IN OUT
import fs from "node:fs";
import { pipeline, env } from "@huggingface/transformers";
env.localModelPath = "/workspace/ft/"; env.allowRemoteModels = false;
const LV = { 1: "mild", 2: "middle manager", 3: "full c-suite" };
const gen = await pipeline("text2text-generation", process.argv[2], { dtype: "q8" });
const rows = fs.readFileSync(process.argv[3], "utf8").trim().split("\n").map((l) => JSON.parse(l));
const t0 = Date.now();
for (const r of rows) {
  r.model = [];
  for (const l of [1, 2, 3]) r.model.push((await gen(`Rewrite as ${LV[l]} corporate speak: ${r.input}`, { max_new_tokens: 96, do_sample: false }))[0].generated_text);
}
console.log("ms/output", Math.round((Date.now() - t0) / rows.length / 3));
fs.writeFileSync(process.argv[4], rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
