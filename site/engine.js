// Project Synergy rewrite engine. Pure functions, no network, runs in the browser and in Node.
import {
  CORPORATE_SWAPS, OPENERS, CLOSERS, INTERJECTIONS,
  DECODE_SWAPS, THEMES, NEGATIVE_CUES, FLUFF_PATTERNS, FLUFF_LINES, PLAIN_LINES, SPECIAL_LINES,
} from "./phrasebook.js";

export const SOFT_CAP = 20000;
export const LEVELS = {
  toCorporate: ["Mild", "Middle Manager", "Full C-Suite"],
  toNormal: ["Polite", "Honest", "Blunt"],
};

// ---------- helpers ----------

// Small, fast, seedable PRNG.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const clampLevel = (l) => Math.min(3, Math.max(1, Math.round(Number(l) || 2)));

// Straight quotes, no fancy dashes or ellipsis characters, tidy whitespace.
export function normalizeInput(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\u00A0/g, " ");
}

// Parse "from = t1|t1b = t2 = t3" lines into entries.
function parseSwaps(block) {
  const entries = [];
  for (const raw of block.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const parts = line.split(" = ");
    if (parts.length < 2) continue;
    // Prefix flags: ^ only as a standalone clause, > only when a word follows, ! always swap.
    const [, flags, rawFrom] = parts[0].trim().match(/^([\^>!]*)(.*)$/);
    const from = rawFrom.trim();
    const clauseOnly = flags.includes("^");
    const beforeWord = flags.includes(">");
    const always = flags.includes("!");
    const tiers = [];
    for (let i = 1; i <= 3; i++) {
      const opts = (parts[i] ?? "").split("|").map((s) => s.trim()).filter(Boolean);
      tiers.push(opts.length ? opts : tiers[i - 2] ?? [from]);
    }
    entries.push({ from: from.toLowerCase(), clauseOnly, beforeWord, always, tiers });
  }
  return entries;
}

function buildMatcher(entries) {
  // A key can have several entries with different conditions (for example "can't." and "can't go").
  const byKey = new Map();
  for (const e of entries) byKey.set(e.from, [...(byKey.get(e.from) ?? []), e]);
  const keys = [...byKey.keys()].sort((a, b) => b.length - a.length);
  // Whole-word match. Apostrophes count as word characters so "don't" is one unit.
  // Apostrophes are optional so "dont" matches "don't".
  const pattern = keys.map((k) => escapeRe(k).replace(/'/g, "'?").replace(/ /g, "\\s+")).join("|");
  const re = new RegExp(`(?<![\\w'-])(${pattern})(?![\\w'-])`, "gi");
  const lookup = (m) => byKey.get(m.toLowerCase().replace(/\s+/g, " ")) ?? byKey.get(apostropheIndex.get(m.toLowerCase().replace(/\s+/g, " ").replace(/'/g, "")));
  const apostropheIndex = new Map(keys.map((k) => [k.replace(/'/g, ""), k]));
  return { re, lookup };
}

export const corporateEntries = parseSwaps(CORPORATE_SWAPS);
export const decodeEntries = parseSwaps(DECODE_SWAPS);
const corporateMatcher = buildMatcher(corporateEntries);
const decodeMatcher = buildMatcher(decodeEntries);

// Copy the capitalization style of `source` onto `replacement`.
export function matchCase(source, replacement) {
  const letters = source.replace(/[^A-Za-z]/g, "");
  // Shouting is copied. Short all-caps words like ASAP, OK or NO read as acronyms, so they are not.
  if (letters.length > 4 && letters === letters.toUpperCase()) return replacement.toUpperCase();
  // Otherwise keep the replacement as written (I, I'm, PTO, AI stay capitalized).
  // Sentence starts are capitalized later by capFirst.
  return replacement;
}

// Is the match a standalone clause (start or punctuation before, punctuation or end after)?
function isClause(text, start, end) {
  const before = text.slice(0, start).trimEnd();
  const after = text.slice(end).trimStart();
  const okBefore = before === "" || /[.!?,;:]$/.test(before);
  const okAfter = after === "" || /^[.!?,;:]/.test(after);
  return okBefore && okAfter;
}

// Swap phrases in one pass so replacements are never swapped again.
// If the longest match at a spot fails its conditions, shorter matches inside it still get a chance.
function swapPhrases(text, matcher, level, rng, swapChance) {
  let changed = 0;
  let out = "";
  let last = 0;
  const re = new RegExp(matcher.re.source, "gi");
  let m;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    const entry = (matcher.lookup(m[0]) ?? []).find((e) => {
      if (e.clauseOnly && !isClause(text, start, end)) return false;
      if (e.beforeWord && !/^\s+[A-Za-z]/.test(text.slice(end))) return false;
      return true;
    });
    if (!entry) {
      re.lastIndex = start + 1;
      continue;
    }
    let replacement = m[0];
    if (entry.always || rng() <= swapChance) {
      // Mostly pick from this level's tier, sometimes from the one below for variety.
      const tierIdx = level > 1 && rng() < 0.2 ? level - 2 : level - 1;
      const choice = pick(rng, entry.tiers[tierIdx]);
      if (choice.toLowerCase() !== m[0].toLowerCase()) {
        changed++;
        replacement = "\u0000" + matchCase(m[0], choice) + "\u0001";
      }
    }
    out += text.slice(last, start) + replacement;
    last = end;
  }
  return { text: out + text.slice(last), changed };
}

// Fix a/an before the next word, drop articles before mass-noun markers (~), clean spacing.
export function tidy(text) {
  let t = text;
  // "~" marks a replacement that should not take a/an in front of it.
  t = t.replace(/\b([Aa]n?)\s+\u0000~/g, (_m, art) => (art[0] === "A" ? "\u0000^" : "\u0000"));
  t = t.replace(/\u0000\^(\S)/g, (_m, c) => "\u0000" + c.toUpperCase());
  t = t.replace(/~/g, "");
  t = t.replace(/[\u0000\u0001]/g, "");
  t = t.replace(/\b(a|an|A|An)\s+([A-Za-z][\w'-]*)/g, (m, art, word) => {
    const wantsAn = startsWithVowelSound(word);
    const cap = art[0] === "A";
    const fixed = wantsAn ? (cap ? "An" : "an") : cap ? "A" : "a";
    return `${fixed} ${word}`;
  });
  t = t
    .replace(/[ \t]+/g, " ")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/([,;:])(?=[A-Za-z])/g, "$1 ")
    .replace(/,\s*,/g, ",")
    .replace(/([.!?])\s*\.(?!\.)/g, "$1")
    .replace(/:\s*\./g, ".")
    .replace(/ *\n */g, "\n")
    .trim();
  return t;
}

function startsWithVowelSound(word) {
  const w = word.toLowerCase();
  if (/^(hour|honest|honor|honour|heir)/.test(w)) return true;
  if (/^(uni|use|usu|ur|eu|one|once|ewe)/.test(w)) return false;
  if (/^[A-Z]{2,}$/.test(word)) return /^[AEFHILMNORSX]/.test(word); // acronyms: "an RTO", "a KPI"
  return /^[aeiou]/.test(w);
}

const endsWithPunct = (s) => /[.!?]["')\]]*$/.test(s.trim());

// Split text into paragraphs, then sentences. Keeps the original wording.
export function splitParagraphs(text) {
  return text.split(/\n\s*\n+|\n(?=\s*[-*\u2022]\s)/).map((p) => p.trim()).filter(Boolean);
}
export function splitSentences(paragraph) {
  const parts = paragraph
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?]["')\]]?)\s+(?=\S)/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Re-join tiny fragments like "U.S." splits.
  const out = [];
  for (const s of parts) {
    if (out.length && /\b(?:[A-Z]\.){1,3}$|\b(?:Mr|Ms|Mrs|Dr|Inc|Co|Jr|Sr|vs|etc|e\.g|i\.e)\.$/.test(out[out.length - 1])) {
      out[out.length - 1] += " " + s;
    } else out.push(s);
  }
  return out;
}

export function capFirst(s) {
  return s.replace(/^(\s*["'(]?)([a-z])/, (_m, p, c) => p + c.toUpperCase());
}

// Soft cap: very long input is trimmed at a sentence boundary with a note.
export function applySoftCap(text, cap = SOFT_CAP) {
  if (text.length <= cap) return { text, truncated: false };
  let cut = text.slice(0, cap);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("\n"), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (lastStop > cap * 0.8) cut = cut.slice(0, lastStop + 1);
  return { text: cut, truncated: true };
}

// Tokens that must keep their exact case: URLs, emails, paths, code, handles, camelCase like iPhone.
const LITERAL_TOKEN = /:\/\/|^www\.|@|[\\/`_={}<>#]|\.[a-z]{2,}(?:[/?#]|$)|[a-z][A-Z]|^[a-z]+\d/;

// Capitalize standalone "i" and its contractions, and the first letter of every sentence.
export function polishCase(text) {
  const parts = String(text).split(/(\s+)/);
  let sentenceStart = true;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || /^\s+$/.test(part)) continue;
    const literal = LITERAL_TOKEN.test(part.replace(/^["'(\[]+|["')\].,!?;:]+$/g, ""));
    let tok = part;
    if (!literal) {
      // i, i'm, i've, i'll, i'd with straight or curly apostrophes.
      tok = tok.replace(/^(["'(\[\u2018\u201C]*)i(?=(?:['\u2019](?:m|ve|ll|d))?[^A-Za-z0-9'\u2019]*$)/, "$1I");
      if (sentenceStart) {
        tok = tok.replace(/^(["'(\[\u2018\u201C]*)([a-z])/, (_m, p, c) => p + c.toUpperCase());
      }
    }
    parts[i] = tok;
    // Next token starts a sentence after . ! ? (not after "..", "e.g." style abbreviations, or decimals).
    const abbrev = /^(?:e\.g\.|i\.e\.|etc\.|vs\.|mr\.|mrs\.|ms\.|dr\.)$/i.test(part.replace(/^["'(]+/, ""));
    sentenceStart = /[.!?]["')\]\u2019\u201D]*$/.test(part) && !/\.\.["')\]]*$/.test(part) && !abbrev;
  }
  return parts.join("");
}

// ---------- Normal to Corporate ----------

const SWAP_CHANCE = { 1: 0.5, 2: 0.85, 3: 1 };
const OPENER_CHANCE = { 1: 0.35, 2: 0.75, 3: 1 };
const CLOSER_CHANCE = { 1: 0.4, 2: 0.8, 3: 1 };

export function toCorporate(input, { level = 2, seed = 1 } = {}) {
  const lvl = clampLevel(level);
  const clean = normalizeInput(input).trim();
  if (!clean) return "";
  const rng = mulberry32(hashString(clean) ^ Math.imul(seed >>> 0, 2654435761) ^ (lvl * 97));

  const paragraphs = splitParagraphs(clean).map((p) => {
    const sentences = splitSentences(p).map((s) => {
      const { text } = swapPhrases(s, corporateMatcher, lvl, rng, SWAP_CHANCE[lvl]);
      let t = capFirst(tidy(text));
      if (!endsWithPunct(t) && !/[,:;]$/.test(t)) t += ".";
      return t;
    });
    // C-suite: sprinkle an aside between sentences.
    if (lvl === 3 && sentences.length > 1) {
      for (let i = sentences.length - 1; i > 0; i--) {
        if (rng() < 0.35) sentences.splice(i, 0, pick(rng, INTERJECTIONS));
      }
    }
    return sentences.join(" ");
  });

  let result = paragraphs.join("\n\n");
  if (rng() < OPENER_CHANCE[lvl]) {
    let pool = OPENERS[lvl === 1 ? 1 : rng() < 0.25 ? lvl - 1 : lvl];
    // Don't stack a greeting opener on a message that already starts with one.
    if (/^(?:hi|hey|hello|greetings|hope)\b/i.test(result)) pool = pool.filter((o) => !/^(?:hi|hey|hello|hope)\b/i.test(o));
    result = `${pick(rng, pool)} ${result}`;
  }
  if (rng() < CLOSER_CHANCE[lvl]) {
    const pool = lvl === 1 ? CLOSERS[1] : rng() < 0.25 ? CLOSERS[lvl - 1] : CLOSERS[lvl];
    result = `${result} ${pick(rng, pool)}`;
  }
  return polishCase(tidy(result));
}

// ---------- Corporate to Normal ----------

export function detectThemes(sentence) {
  const found = [];
  for (const theme of THEMES) {
    if (!theme.patterns.some((p) => p.test(sentence))) continue;
    if (theme.requiresNegative && !NEGATIVE_CUES.test(sentence)) continue;
    found.push(theme.id);
  }
  return found;
}

const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));

function combineSummary(themeIds, lvl, fluffShare) {
  const i = lvl - 1;
  const has = (id) => themeIds.includes(id);
  // Combos that read better as one sentence.
  if (has("record-year") && has("no-raises")) {
    return ["The company had a great year, but raises are on hold.", "Record profits. No raises.", "They made record money and you get nothing."][i];
  }
  if (has("record-year") && has("layoffs")) {
    return ["The company is doing well and still cutting jobs.", "Record results, and they're laying people off anyway.", "They made a fortune and are firing people anyway."][i];
  }
  if (has("acquisition") && has("layoffs")) {
    return ["After the merger, some jobs are being cut.", "We got bought, and people are being laid off.", "New owners, fewer jobs."][i];
  }
  if (!themeIds.length) {
    if (fluffShare > 0.5) return ["Lots of kind words, not much news.", "A lot of words that don't say much.", "Nothing. This is a lot of words for nothing."][i];
    return ["Nothing hidden here.", "It mostly says what it says.", "Nothing to decode. Rare."][i];
  }
  const top = themeIds.slice(0, 3).map((id) => themeById[id].summary[i]);
  return top.join(" ");
}

// "Team,", "Hi everyone,", "Pat Ellery CEO, Corvane Systems" and similar lines carry no meaning.
export function isGreetingOrSignature(sentence) {
  const s = sentence.trim();
  if (/^(?:hi|hey|hello|dear|good morning|good afternoon)?\s*(?:team|all|everyone|folks|colleagues|friends|y'all|everybody)?[,!:]$/i.test(s)) return true;
  if (/^(?:hi|hey|hello|dear)\b[^.!?]{0,30}[,!:]$/i.test(s)) return true;
  if (/^(?:best|thanks|cheers|regards|warmly|sincerely|onward)[^.!?]{0,40}$/i.test(s)) return true;
  const words = s.split(/\s+/).length;
  return !/[.!?]["')\]]*$/.test(s) && words <= 8 && !/\b(?:we|will|are|is|our|you)\b/i.test(s);
}

export function toNormal(input, { level = 2, seed = 1 } = {}) {
  const lvl = clampLevel(level);
  const clean = normalizeInput(input).trim();
  if (!clean) return { summary: "", lines: [], themes: [] };
  const rng = mulberry32(hashString(clean) ^ Math.imul(seed >>> 0, 2654435761) ^ (lvl * 131));
  const scores = new Map();
  const lines = [];
  let fluff = 0;
  let total = 0;

  for (const paragraph of splitParagraphs(clean)) {
    for (const sentence of splitSentences(paragraph)) {
      if (isGreetingOrSignature(sentence)) continue;
      total++;
      const themes = detectThemes(sentence);
      for (const id of themes) scores.set(id, (scores.get(id) ?? 0) + themeById[id].weight);
      const { text: swapped, changed } = swapPhrases(sentence, decodeMatcher, lvl, rng, 1);
      const isFluff = FLUFF_PATTERNS.some((p) => p.test(sentence));
      let plain;
      const special = SPECIAL_LINES.find((s) => s.pattern.test(sentence) && !(s.weak && themes.length));
      if (special) {
        plain = special.lines[lvl - 1];
      } else if (themes.length) {
        plain = themes.slice(0, 2).map((id) => themeById[id].line[lvl - 1]).join(" ");
      } else if (isFluff) {
        fluff++;
        plain = pick(rng, FLUFF_LINES)[lvl - 1];
      } else if (changed > 0) {
        plain = capFirst(tidy(swapped));
        if (!endsWithPunct(plain)) plain += ".";
      } else {
        plain = pick(rng, PLAIN_LINES)[lvl - 1];
      }
      lines.push({ original: sentence, plain });
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const summary = combineSummary(ranked, lvl, total ? fluff / total : 0);
  return { summary, lines, themes: ranked };
}

// Plain-text version of a decode, for copy and share.
export function formatDecode(result, { withLines = true } = {}) {
  if (!result || !result.summary) return "";
  const head = `What they really mean: ${result.summary}`;
  if (!withLines || !result.lines.length) return head;
  const body = result.lines.map((l) => `"${l.original}"\n= ${l.plain}`).join("\n\n");
  return `${head}\n\n${body}`;
}
