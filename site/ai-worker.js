// AI mode worker. Loads Qwen2.5 0.5B Instruct with Transformers.js and runs it off the main thread.
// Pinned Transformers.js build from jsDelivr. It only loads after the user turns on AI mode.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";
import { detectThemes } from "./engine.js";
import {
  MODEL_ID, MAX_AI_SENTENCES, sentencesForDecode, buildDecodeMessages, buildSummaryMessages,
  buildCorporateMessages, firstLine, summaryCoversThemes,
} from "./ai-prompts.js";

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

async function ask(messages, maxNew, sample) {
  const out = await generator(messages, {
    max_new_tokens: maxNew,
    do_sample: sample,
    temperature: sample ? 0.8 : undefined,
    top_p: sample ? 0.9 : undefined,
    repetition_penalty: 1.05,
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
      await ask([{ role: "user", content: "Hi" }], 1, false);
      self.postMessage({ type: "ready", ms: Math.round(performance.now() - t0) });
      return;
    }
    if (!generator) throw new Error("Model not loaded");

    if (msg.type === "toCorporate") {
      const text = firstLineBlock(await ask(buildCorporateMessages(msg.text, msg.level), 200, msg.sample));
      self.postMessage({ type: "corporate", id: msg.id, text });
      return;
    }

    if (msg.type === "toNormal") {
      const all = sentencesForDecode(msg.text);
      const sentences = all.slice(0, MAX_AI_SENTENCES);
      const lines = [];
      for (let i = 0; i < sentences.length; i++) {
        const themes = detectThemes(sentences[i]);
        const plain = firstLine(await ask(buildDecodeMessages(sentences[i], msg.level, themes), 50, msg.sample));
        lines.push({ original: sentences[i], plain });
        self.postMessage({ type: "line", id: msg.id, index: i, total: sentences.length, original: sentences[i], plain });
      }
      const tagged = lines.filter((l) => detectThemes(l.original).length).map((l) => l.plain);
      const summary = firstLine(
        await ask(buildSummaryMessages(tagged.length ? tagged : lines.map((l) => l.plain), msg.level, msg.themes ?? []), 60, msg.sample),
      );
      const summaryOk = summaryCoversThemes(summary, msg.themes ?? []);
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
