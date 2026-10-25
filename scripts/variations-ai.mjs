// Runs the AI model over the variations dataset in Node on CPU, with the same prompts, sampling settings,
// output guards and page-side checks as the site. Writes one JSON line per item and level, and resumes.
// Usage: node scripts/variations-ai.mjs --dir toCorporate|toNormal --out file.jsonl [--items holdout.jsonl] [--model id] [--dtype q4]
//        [--shard 0/3] [--threads 2] [--fewshot fixed] [--ids n0001,n0002] [--levels 1,2,3]
import fs from "node:fs";
import { pipeline, env, random, StoppingCriteria, LogitsProcessor } from "@huggingface/transformers";
import * as P from "../site/ai-prompts.js";
import { guardOutput, echoesExample, contradictsThemes, isMetaReply, addsClaims, decodeTextFails, generationOptions, repeatSettings, sampleSeed, makeLoopStop, makeRepeatGuard } from "../site/ai-guard.js";
import { softenCrude, toCorporateDetailed, toNormal, detectThemes } from "../site/engine.js";
import { checkMeaning } from "../site/meaning.js";
import { hasCrude, addsCrude, lostIdioms } from "../site/profanity.js";
import { aiCorporateGate } from "../site/faithful.js";
import { examplePool } from "../tests/variations/retrieval.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dir = arg("dir", "toCorporate");
const out = arg("out");
const model = arg("model", P.MODEL_ID);
const dtype = arg("dtype", "q4");
const [shard, shards] = arg("shard", "0/1").split("/").map(Number);
const threads = Number(arg("threads", "0"));
const fewshot = arg("fewshot", "retrieval");
const levels = arg("levels", "1,2,3").split(",").map(Number);
const onlyIds = arg("ids", "") ? new Set(arg("ids").split(",")) : null;
const isQwen3 = /qwen3/i.test(model);

env.cacheDir = new URL("../.model-cache/", import.meta.url).pathname;
const itemsFile = arg("items", "");
const items = (itemsFile ? fs.readFileSync(itemsFile, "utf8").trim().split("\n").map((l) => JSON.parse(l)) : JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url)))).filter((i) => i.direction === dir && (!onlyIds || onlyIds.has(i.id)));
const mine = items.filter((_, i) => i % shards === shard);
const done = new Set(fs.existsSync(out) ? fs.readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.id}|${r.level}`; }) : []);

const opts = { dtype, device: "cpu" };
if (threads) opts.session_options = { intraOpNumThreads: threads, interOpNumThreads: 1 };
const gen = await pipeline("text-generation", model, opts);
const LoopStop = makeLoopStop(StoppingCriteria);
const RepeatGuard = makeRepeatGuard(LogitsProcessor);
const countTokens = (t) => gen.tokenizer.encode(String(t ?? "")).length;

// Qwen3 thinks out loud unless told not to. "/no_think" turns that off, and any empty think block is removed.
const adapt = (messages) => isQwen3 ? messages.map((m, i) => (i === messages.length - 1 ? { ...m, content: `${m.content} /no_think` } : m)) : messages;
const unthink = (t) => String(t).replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^[\s\S]*<\/think>/, "").trim();

async function ask(messages, kind, inputText, seed) {
  random.seed(seed);
  const o = generationOptions(kind, countTokens(inputText));
  if (isQwen3) o.max_new_tokens += 8;
  const res = await gen(adapt(messages), { ...o, logits_processor: [new RepeatGuard(repeatSettings(kind))], stopping_criteria: [new LoopStop()] });
  return unthink(res[0].generated_text.at(-1).content);
}
const firstLineBlock = (t) => P.firstLine(t.replace(/\n{2,}[\s\S]*$/, "").replace(/\n/g, " "));

// Same as the page: the nearest hand-written examples, minus the item itself. --fewshot fixed uses the old fixed examples.
function corporateMessages(text, level, item) {
  if (fewshot === "fixed") return P.buildCorporateMessages(text, level);
  return P.buildRetrievalCorporateMessages(text, level, examplePool(), { exclude: item.id });
}

const stream = fs.createWriteStream(out, { flags: "a" });
const t0 = Date.now();
let n = 0;
for (const item of mine) for (const level of levels) {
  if (done.has(`${item.id}|${level}`)) continue;
  const t1 = Date.now();
  let row;
  if (dir === "toCorporate") {
    const text = item.input;
    const input = softenCrude(text);
    // Mirrors the site: a built-in satire scene is shown as is, and the AI model is not asked.
    const pre = toCorporateDetailed(text, { level, seed: 1 });
    if (pre.scene && pre.text) {
      stream.write(JSON.stringify({ id: item.id, level, model, fewshot, ai_raw: "", ai_text: "", gate: "scene", shown_engine: "Instant (scene)", shown: pre.text, ms: 0 }) + "\n");
      n++;
      continue;
    }
    const raw = firstLineBlock(await ask(corporateMessages(input, level, item), "corporate", input, sampleSeed(text, level, 1)));
    const checked = guardOutput(raw, { examples: P.CORPORATE_EXAMPLE_ANSWERS, maxWords: 120 });
    const ai = checked.text;
    const instant = toCorporateDetailed(text, { level, seed: 1 });
    const g = aiCorporateGate(text, ai, { level });
    const shownAI = g.ok && !instant.unsafe?.length;
    const gate = !ai ? (checked.ok ? "empty" : "guard") : g.reason === "meaning" ? `meaning:${[...(g.check.lost ?? []), ...(g.check.added ?? [])].join("+")}` : !g.ok ? g.reason : instant.unsafe?.length ? "unsafe" : "ok";
    row = { id: item.id, level, model, fewshot, ai_raw: raw, ai_text: ai, gate, shown_engine: shownAI ? "AI" : "Instant (AI fallback)", shown: shownAI ? ai : instant.text };
  } else {
    const instant = toNormal(item.input, { level, seed: 1 });
    const sentences = P.sentencesForDecode(item.input).slice(0, P.MAX_AI_SENTENCES);
    const lines = [];
    for (let i = 0; i < sentences.length; i++) {
      const themes = detectThemes(sentences[i]);
      let plain = guardOutput(P.firstLine(await ask(P.buildDecodeMessages(sentences[i], level, themes), "line", sentences[i], sampleSeed(sentences[i], level, 1, i + 1))), { maxWords: 40 }).text;
      if (isMetaReply(plain) || contradictsThemes(plain, themes) || echoesExample(plain, [sentences[i]], 8) || addsCrude(sentences[i], plain) || decodeTextFails(plain, sentences[i], [...themes, ...(instant.themes ?? [])])) plain = "";
      lines.push({ original: sentences[i], ai: plain, shown: instant.lines[i]?.news ? instant.lines[i].plain : plain || instant.lines[i]?.plain || "" });
    }
    const tagged = lines.filter((l) => detectThemes(l.original).length).map((l) => l.shown);
    const summary = guardOutput(P.firstLine(await ask(P.buildSummaryMessages(tagged.length ? tagged : lines.map((l) => l.shown), level, instant.themes ?? []), "summary", "", sampleSeed(item.input, level, 1, -1))), { maxWords: 40 }).text;
    const summaryOk = P.summaryCoversThemes(summary, instant.themes ?? []) && !contradictsThemes(summary, instant.themes ?? []) && !isMetaReply(summary) && !addsCrude(item.input, summary) && !decodeTextFails(summary, item.input, instant.themes ?? []);
    // The site always shows the Instant summary in AI mode (ai-worker summaryOk = false).
    row = { id: item.id, level, model, ai_summary: summary, summary_ok: summaryOk, shown_summary: instant.summary, lines };
  }
  row.ms = Date.now() - t1;
  stream.write(JSON.stringify(row) + "\n");
  n++;
  if (n % 25 === 0) console.log(`${n} done, ${((Date.now() - t0) / n / 1000).toFixed(1)}s each`);
}
stream.end();
console.log(`finished ${n} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
