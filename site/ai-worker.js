// AI mode worker. Loads Qwen2.5 0.5B Instruct with Transformers.js and runs it off the main thread.
// Pinned Transformers.js build from jsDelivr. It only loads after the user turns on AI mode.
import { pipeline, env, random, StoppingCriteria, LogitsProcessor } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";
import { detectThemes } from "./engine.js";
import {
  MODEL_ID, MAX_AI_SENTENCES, sentencesForDecode, buildDecodeMessages, buildSummaryMessages,
  buildCorporateMessages, firstLine, summaryCoversThemes, CORPORATE_EXAMPLE_ANSWERS,
} from "./ai-prompts.js";
import { guardOutput, echoesExample, contradictsThemes, isMetaReply, generationOptions, repeatSettings, sampleSeed, makeLoopStop, makeRepeatGuard } from "./ai-guard.js";

const LoopStop = makeLoopStop(StoppingCriteria);
const RepeatGuard = makeRepeatGuard(LogitsProcessor);

env.allowLocalModels = false;
env.useBrowserCache = true;

let generator = null;
let loading = null;
const files = new Map();

async function load({ device, dtype }) {
  if (generator) return generator;
  if (loading) return loading;
  loading = pipeline("text-generation", MODEL_ID, {
    device,
    dtype,
    progress_callback: (p) => {
      if (p.status !== "progress" || !p.file) return;
      files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
      let loaded = 0;
      let total = 0;
      for (const f of files.values()) {
        loaded += f.loaded;
        total += f.total;
      }
      self.postMessage({ type: "progress", loaded, total, progress: total ? (loaded / total) * 100 : 0 });
    },
  }).then((g) => {
    generator = g;
    return g;
  });
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

const countTokens = (text) => generator.tokenizer.encode(String(text ?? "")).length;

// kind is "corporate", "line" or "summary". The budget depends on the input length.
// seed makes sampling repeatable: the same request gives the same reply until the user rerolls.
async function ask(messages, kind, inputText, seed) {
  random.seed(seed);
  const opts = generationOptions(kind, countTokens(inputText));
  const out = await generator(messages, {
    ...opts,
    logits_processor: [new RepeatGuard(repeatSettings(kind))],
    stopping_criteria: [new LoopStop()],
  });
  return out[0].generated_text.at(-1).content;
}

self.onmessage = async (event) => {
  const msg = event.data;
  try {
    if (msg.type === "load") {
      const t0 = performance.now();
      await load(msg);
      // Tiny warm-up so the first real request is not slow.
      await generator([{ role: "user", content: "Hi" }], { max_new_tokens: 1 });
      self.postMessage({ type: "ready", ms: Math.round(performance.now() - t0) });
      return;
    }
    if (!generator) throw new Error("Model not loaded");

    if (msg.type === "toCorporate") {
      const raw = firstLineBlock(await ask(buildCorporateMessages(msg.text, msg.level), "corporate", msg.text, sampleSeed(msg.text, msg.level, msg.seed)));
      // A looping, empty or copied reply comes back empty, and the page shows the Instant version.
      const checked = guardOutput(raw, { examples: CORPORATE_EXAMPLE_ANSWERS, maxWords: 120 });
      self.postMessage({ type: "corporate", id: msg.id, text: checked.text, rejected: !checked.ok });
      return;
    }

    if (msg.type === "toNormal") {
      const all = sentencesForDecode(msg.text);
      const sentences = all.slice(0, MAX_AI_SENTENCES);
      const lines = [];
      for (let i = 0; i < sentences.length; i++) {
        const themes = detectThemes(sentences[i]);
        let plain = guardOutput(firstLine(await ask(buildDecodeMessages(sentences[i], msg.level, themes), "line", sentences[i], sampleSeed(sentences[i], msg.level, msg.seed, i + 1))), { maxWords: 40 }).text;
        // Empty means the page uses the Instant line for this sentence.
        // Also when it just repeats the original sentence back.
        if (isMetaReply(plain) || contradictsThemes(plain, themes) || echoesExample(plain, [sentences[i]], 8)) plain = "";
        lines.push({ original: sentences[i], plain });
        self.postMessage({ type: "line", id: msg.id, index: i, total: sentences.length, original: sentences[i], plain });
      }
      const tagged = lines.filter((l) => detectThemes(l.original).length).map((l) => l.plain);
      const summary = guardOutput(
        firstLine(await ask(buildSummaryMessages(tagged.length ? tagged : lines.map((l) => l.plain), msg.level, msg.themes ?? []), "summary", "", sampleSeed(msg.text, msg.level, msg.seed, -1))),
        { maxWords: 40 },
      ).text;
      const summaryOk = summaryCoversThemes(summary, msg.themes ?? []) && !contradictsThemes(summary, msg.themes ?? []) && !isMetaReply(summary);
      self.postMessage({ type: "decoded", id: msg.id, summary, summaryOk, lines, skipped: all.length - sentences.length });
    }
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, message: String(err?.message ?? err) });
  }
};

// Corporate rewrites can be a short paragraph. Keep the text, drop chat wrappers.
function firstLineBlock(text) {
  return firstLine(text.replace(/\n{2,}[\s\S]*$/, "").replace(/\n/g, " "));
}
