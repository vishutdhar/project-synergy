// Runs the AI-mode prompts against the real model in Node (onnxruntime-node, q8, CPU).
// Usage: node scripts/prompt-test.mjs [level]
import { pipeline, env } from "@huggingface/transformers";
import fs from "node:fs";
import { sentencesForDecode, buildDecodeMessages, buildSummaryMessages, firstLine, summaryCoversThemes, MODEL_ID, buildCorporateMessages, MAX_AI_SENTENCES } from "../site/ai-prompts.js";
import { toNormal, formatDecode, toCorporate, detectThemes } from "../site/engine.js";

env.cacheDir = new URL("../.model-cache/", import.meta.url).pathname;
const level = Number(process.argv[2] ?? 2);
const dtype = process.argv[3] ?? "q4f16";
const gen = await pipeline("text-generation", MODEL_ID, { dtype, device: "cpu" });
const opts = { max_new_tokens: 220, do_sample: false, repetition_penalty: 1.05 };
const ask = async (messages, max = 220) => (await gen(messages, { ...opts, max_new_tokens: max }))[0].generated_text.at(-1).content;

const samples = ["layoff", "rto", "record-year", "reorg"];
let report = "";
for (const name of samples) {
  const text = fs.readFileSync(new URL(`../samples/${name}.txt`, import.meta.url), "utf8");
  const instant = toNormal(text, { level });
  const t0 = Date.now();
  const lines = [];
  for (const sentence of sentencesForDecode(text).slice(0, MAX_AI_SENTENCES)) {
    const themes = detectThemes(sentence);
    const plain = firstLine(await ask(buildDecodeMessages(sentence, level, themes), 50));
    lines.push({ original: sentence, plain: plain || "(empty, Instant fallback)" });
  }
  const tagged = lines.filter((l) => detectThemes(l.original).length).map((l) => l.plain);
  const aiSummary = firstLine(await ask(buildSummaryMessages(tagged.length ? tagged : lines.map((l) => l.plain), level, instant.themes), 60));
  const ok = summaryCoversThemes(aiSummary, instant.themes);
  const summary = ok ? aiSummary : instant.summary;
  console.log(name, "raw AI summary:", aiSummary, ok ? "(kept)" : "(rejected, Instant summary used)");
  report += `\n[raw AI summary: "${aiSummary}" ${ok ? "kept" : "rejected by theme check, Instant summary used"}]`;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  report += `\n\n##### ${name} (level ${level})\n\n--- AI mode, ${dtype} (${secs}s on CPU) ---\n${formatDecode({ summary, lines })}\n\n--- Instant mode ---\n${formatDecode(instant)}\n`;
  console.log(`done ${name} in ${secs}s`);
}
const plain = ["I can't make it today, I'm sick.", "This plan is bad and we're out of money.", "Stop scheduling meetings that could have been an email."];
for (const p of plain) {
  report += `\n##### to corporate (level ${level}): ${p}\nAI: ${firstLine(await ask(buildCorporateMessages(p, level), 120))}\nInstant: ${toCorporate(p, { level })}\n`;
}
fs.mkdirSync(new URL("../preview/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`../preview/prompt-test-${dtype}-level${level}.md`, import.meta.url), report);
console.log(report);
