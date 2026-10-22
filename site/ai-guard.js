// Checks on AI output so a looping or broken reply never reaches the screen.
// Pure functions. Used by the AI worker and by the unit tests.

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

// Words with their character offsets, so we can cut the original text.
function words(text) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) out.push({ raw: m[0], key: norm(m[0]), start: m.index, end: m.index + m[0].length });
  return out.filter((w) => w.key);
}

// Find the first run where the same 1 to 6 word phrase repeats `minRepeats` times in a row.
// Returns the character offset where the repeats start (after the first copy), or -1.
export function findRepeatRun(text, minRepeats = 3) {
  const w = words(text);
  for (let i = 0; i < w.length; i++) {
    for (let n = 1; n <= 6; n++) {
      if (i + n * minRepeats > w.length) break;
      const phrase = w.slice(i, i + n).map((x) => x.key).join(" ");
      let reps = 1;
      while (i + (reps + 1) * n <= w.length && w.slice(i + reps * n, i + (reps + 1) * n).map((x) => x.key).join(" ") === phrase) reps++;
      if (reps >= minRepeats) return w[i + n].start;
    }
  }
  return -1;
}

// Share of words that are repeats. "a b a b a b" is high, normal prose is low.
export function repetitionRatio(text) {
  const w = words(text).map((x) => x.key);
  if (w.length < 12) return 0;
  const grams = new Map();
  let repeated = 0;
  for (let i = 0; i + 3 <= w.length; i++) {
    const g = w.slice(i, i + 3).join(" ");
    if (grams.has(g)) repeated++;
    grams.set(g, true);
  }
  return repeated / Math.max(1, w.length - 2);
}

// Cut to the last complete sentence. If there is none, close the text with a period.
export function trimToSentence(text) {
  let t = text.trim().replace(/[\s,;:]+$/, "");
  if (!t) return "";
  if (/[.!?]["')\]]*$/.test(t)) return t;
  const last = Math.max(t.lastIndexOf(". "), t.lastIndexOf("! "), t.lastIndexOf("? "));
  if (last > 0) return t.slice(0, last + 1);
  return t.replace(/[\s,;:\-]+$/, "") + ".";
}

// Long shared word runs mean the model copied an example instead of rewriting the input.
export function echoesExample(text, examples = [], minWords = 8) {
  const w = words(text).map((x) => x.key);
  for (const ex of examples) {
    const e = ` ${words(ex).map((x) => x.key).join(" ")} `;
    for (let i = 0; i + minWords <= w.length; i++) {
      if (e.includes(` ${w.slice(i, i + minWords).join(" ")} `)) return true;
    }
  }
  return false;
}

// Clean a reply. Returns { text, ok, trimmed }. ok is false when the reply should not be shown.
export function guardOutput(text, { examples = [], maxWords = 120 } = {}) {
  let t = String(text ?? "").replace(/\s+/g, " ").trim();
  let trimmed = false;
  // Cut repeat runs, keeping one copy, until none are left.
  for (let guard = 0; guard < 5; guard++) {
    const cut = findRepeatRun(t);
    if (cut < 0) break;
    t = t.slice(0, cut);
    trimmed = true;
  }
  const w = words(t);
  if (w.length > maxWords) {
    t = t.slice(0, w[maxWords - 1].end);
    trimmed = true;
  }
  const before = t;
  t = trimToSentence(t);
  if (t !== before.trim()) trimmed = true;
  const ok = words(t).length >= 2 && repetitionRatio(t) < 0.25 && !echoesExample(t, examples);
  return { text: ok ? t : "", ok, trimmed };
}

// Token-level loop check for a stopping rule: the last tokens are one short pattern repeated.
export function tokensLoop(ids, minRepeats = 4, maxPeriod = 8) {
  const a = ids.map(Number);
  for (let p = 1; p <= maxPeriod; p++) {
    const span = p * minRepeats;
    if (a.length < span) break;
    const tail = a.slice(-span);
    let same = true;
    for (let i = p; i < span && same; i++) same = tail[i] === tail[i - p];
    if (same) return true;
  }
  return false;
}

// Generation settings shared by the browser worker and the Node prompt test.
// Sampling follows Qwen2.5's own generation_config (temperature 0.7, top_p 0.8, top_k 20).
// Greedy decoding is what let the model loop, so it is not used. Reroll changes the seed instead.
// The token budget scales with the input and has a hard ceiling.
// Repeat control runs in makeRepeatGuard on generated tokens only. The built-in options also
// count the prompt, which punishes the buzzwords in the examples, so they stay off.
export const GEN_LIMITS = { corporate: { perToken: 4, min: 48, max: 200 }, line: { perToken: 3, min: 24, max: 60 }, summary: { perToken: 0, min: 60, max: 60 } };
export const REPEAT_PENALTY = 1.15;
export const NO_REPEAT_NGRAM = 3;

export function generationOptions(kind, inputTokens = 0) {
  const lim = GEN_LIMITS[kind] ?? GEN_LIMITS.corporate;
  const max_new_tokens = Math.min(lim.max, Math.max(lim.min, Math.ceil(inputTokens * lim.perToken)));
  // Decoding a memo is a factual job, so it samples cooler than the joke rewrites.
  const temperature = kind === "corporate" ? 0.7 : 0.3;
  return { max_new_tokens, do_sample: true, temperature, top_p: 0.8, top_k: 20, repetition_penalty: 1.0, no_repeat_ngram_size: 0 };
}

// Penalty for every request. The 3-gram ban only for short line rewrites, where it can't hurt fluency.
export function repeatSettings(kind) {
  return { penalty: REPEAT_PENALTY, ngram: kind === "line" ? NO_REPEAT_NGRAM : 0 };
}

// Same text, same level and same seed give the same reply. Reroll bumps the seed.
export function sampleSeed(text, level, seed, part = 0) {
  let h = 2166136261 >>> 0;
  const key = `${level}|${seed}|${part}|${text}`;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return h;
}

// Pure part of the repeat guard: which tokens to penalize and which to ban, given generated ids.
export function repeatControls(generated, ngram = NO_REPEAT_NGRAM) {
  const gen = generated.map(Number);
  const banned = new Set();
  if (ngram > 1 && gen.length >= ngram - 1) {
    const prefix = gen.slice(gen.length - (ngram - 1)).join(",");
    for (let j = 0; j + ngram <= gen.length; j++) {
      if (gen.slice(j, j + ngram - 1).join(",") === prefix) banned.add(gen[j + ngram - 1]);
    }
  }
  return { penalize: new Set(gen), banned };
}

// Builds a logits processor from Transformers.js's LogitsProcessor base class. Use one instance per request.
export function makeRepeatGuard(LogitsProcessor) {
  return class RepeatGuard extends LogitsProcessor {
    constructor({ penalty = REPEAT_PENALTY, ngram = NO_REPEAT_NGRAM } = {}) {
      super();
      this.penalty = penalty;
      this.ngram = ngram;
      this.promptLen = [];
    }
    _call(inputIds, logits) {
      for (let i = 0; i < inputIds.length; i++) {
        const ids = inputIds[i];
        // The first call sees only the prompt, so its length marks where generation starts.
        this.promptLen[i] ??= ids.length;
        const { penalize, banned } = repeatControls(Array.from(ids).slice(this.promptLen[i]), this.ngram);
        const data = logits[i].data;
        for (const t of penalize) data[t] = data[t] < 0 ? data[t] * this.penalty : data[t] / this.penalty;
        for (const t of banned) data[t] = -Infinity;
      }
      return logits;
    }
  };
}

// Builds a stopping rule class from Transformers.js's StoppingCriteria base class.
// Stops a sequence when its last tokens are a short pattern on repeat.
export function makeLoopStop(StoppingCriteria) {
  return class LoopStop extends StoppingCriteria {
    _call(inputIds) {
      return inputIds.map((ids) => tokensLoop(Array.from(ids).slice(-64)));
    }
  };
}

// A decode that denies the memo's main news ("No layoffs." for a layoff memo) is wrong, not blunt.
const DENIALS = {
  layoffs: /\bno (?:layoffs?|job cuts|one (?:is )?(?:losing|getting fired))\b|\bnot (?:laying|cutting|firing)\b|\bno one will lose\b/i,
  "no-raises": /\b(?:raises|bonuses) (?:are|will be) (?:coming|bigger|higher)\b/i,
  rto: /\bstay (?:fully )?remote\b|\bno (?:need|one needs) to come (?:in|back)\b/i,
};
export function contradictsThemes(text, themeIds = []) {
  return themeIds.some((id) => DENIALS[id]?.test(text));
}

// Lines that talk about the task instead of doing it.
export function isMetaReply(text) {
  return /\b(?:here(?:'s| is) (?:the|a|my)|short sentence|plain english|translation|rewritten|as an ai)\b|:\s*\.?$/i.test(text);
}
