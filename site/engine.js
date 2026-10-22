// Project Synergy rewrite engine. Pure functions, no network, runs in the browser and in Node.
import {
  CORPORATE_SWAPS, OPENERS, CLOSERS, INTERJECTIONS,
  DECODE_SWAPS, THEMES, NEGATIVE_CUES, FLUFF_PATTERNS, FLUFF_LINES, PLAIN_LINES, SPECIAL_LINES,
  LAYOFF_HINTS, LAYOFF_CONTEXT_SWAPS, SIGNALS,
} from "./phrasebook.js";
import { checkMeaning, setAllowedCaps, isShouting } from "./meaning.js";

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
// In a layoff memo, the layoff readings of words like "synergies" come first.
const layoffDecodeMatcher = buildMatcher([...parseSwaps(LAYOFF_CONTEXT_SWAPS), ...decodeEntries]);

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
function swapPhrases(text, matcher, level, rng, swapChance, used = null, protect = []) {
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
    // After "don't" or "did not", a swap that starts with a helper verb would read "don't would like".
    const negAux = /\b(?:don't|doesn't|didn't|dont|do not|does not|did not)\s*$/i.test(text.slice(0, start));
    if (entry && negAux && entry.tiers.flat().some((o) => /^(?:would|will|am|is|are|have|has|can|could)\b/i.test(o))) {
      re.lastIndex = start + 1;
      continue;
    }
    if (!entry || protect.some(([a, b]) => start < b && end > a)) {
      re.lastIndex = start + 1;
      continue;
    }
    let replacement = m[0];
    if (entry.always || rng() <= swapChance) {
      // Mostly pick from this level's tier, sometimes from the one below for variety.
      const tierIdx = level > 1 && rng() < 0.2 ? level - 2 : level - 1;
      let choice = pick(rng, entry.tiers[tierIdx]);
      // Avoid repeating a key word already in the output ("capacity" twice).
      if (used && repeatsKeyWord(choice, used)) {
        // Same tier first, then milder tiers, then stronger ones.
        const others = [entry.tiers[tierIdx], entry.tiers[level - 1], ...entry.tiers.slice(0, level - 1).reverse(), ...entry.tiers.slice(level)].flat();
        choice = others.find((c) => !repeatsKeyWord(c, used)) ?? m[0];
      }
      if (choice.toLowerCase() !== m[0].toLowerCase()) {
        changed++;
        if (used) for (const k of keyWords(choice)) used.add(k);
        replacement = "\u0000" + matchCase(m[0], choice) + "\u0001";
      }
    }
    out += text.slice(last, start) + replacement;
    last = end;
  }
  return { text: out + text.slice(last), changed };
}

// Key words for duplicate checks: longer words, cut to a short stem so "capacity" and "capacities" match.
const COMMON = new Set("about after again being could doing every going have having just more other really should still their there these thing think those want what when where which while would your yours with this that from them they then than been were will some into over very much need".split(" "));
export function keyWords(text) {
  return String(text).toLowerCase().replace(/[~^]/g, "").match(/[a-z][a-z']{4,}/g)?.filter((w) => !COMMON.has(w)).map((w) => w.slice(0, 6)) ?? [];
}
const repeatsKeyWord = (text, used) => keyWords(text).some((k) => used.has(k));

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
// Mild never adds an opener. Openers and closers are tone only (see phrasebook.js).
const OPENER_CHANCE = { 1: 0, 2: 0.75, 3: 1 };
const CLOSER_CHANCE = { 1: 0.4, 2: 0.8, 3: 1 };
const LIST_MARK = /^(\s*(?:[-*\u2022]|\d{1,2}[.)])\s+)/;

// Capitalized words the phrasebook may add on its own (KPI, OKRs, AI). The meaning check allows them.
const CAPS_SOURCES = [CORPORATE_SWAPS, ...Object.values(OPENERS).flat(), ...Object.values(CLOSERS).flat(), ...INTERJECTIONS].join(" ");
setAllowedCaps(CAPS_SOURCES.match(/\b[A-Z][\w'&-]*/g) ?? []);

// Spans a swap must not touch: numbers, dates, times and names.
function protectedSpans(sentence) {
  const spans = [];
  const add = (re) => {
    for (const m of sentence.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  };
  add(/\d[\d,.:]*\s?(?:%|k|m|am|pm)?/gi);
  add(/\b(?:today|tonight|tomorrow|yesterday|(?:this|next|last) (?:week|month|quarter|year)|EOD|EOW|COB|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)\b/gi);
  // Capitalized words after the first word of the sentence, unless the whole thing is shouted.
  if (!isShouting(sentence)) for (const m of sentence.matchAll(/(?<=\S\s+)[A-Z][\w'&-]*/g)) {
    if (!/^I(?:'m|'ve|'ll|'d)?$/.test(m[0])) spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

// Break the input into units: prose paragraphs and list items, with the line break that came before each.
export function splitUnits(text) {
  const units = [];
  let prose = [];
  let sep = "";
  let pendingSep = "";
  const flush = () => {
    if (prose.length) units.push({ kind: "prose", text: prose.join(" "), sep });
    prose = [];
  };
  for (const line of text.split("\n")) {
    if (!line.trim()) {
      flush();
      pendingSep = "\n\n";
      continue;
    }
    const brk = units.length || prose.length ? pendingSep || "\n" : "";
    if (LIST_MARK.test(line)) {
      flush();
      const [, mark] = line.match(LIST_MARK);
      units.push({ kind: "item", mark: mark.trimStart(), text: line.slice(mark.length).trim(), sep: brk });
    } else {
      if (!prose.length) sep = brk;
      prose.push(line.trim());
    }
    pendingSep = "";
  }
  flush();
  return units;
}

// Rewrite one sentence. Tries a few random draws and keeps the first one that passes the meaning check.
// If none pass, the sentence stays as the user wrote it.
function rewriteSentence(sentence, lvl, rng, used, { addPeriod = true } = {}) {
  const protect = protectedSpans(sentence);
  for (let attempt = 0; attempt < 4; attempt++) {
    const trial = new Set(used);
    const { text } = swapPhrases(sentence, corporateMatcher, lvl, rng, SWAP_CHANCE[lvl], trial, protect);
    let t = capFirst(tidy(text));
    if (addPeriod && !endsWithPunct(t) && !/[,:;]$/.test(t)) t += ".";
    if (checkMeaning(sentence, t).ok) {
      for (const k of trial) used.add(k);
      return t;
    }
  }
  let t = capFirst(tidy(sentence));
  if (addPeriod && !endsWithPunct(t) && !/[,:;]$/.test(t)) t += ".";
  return t;
}

function corporateOnce(clean, lvl, rng, { extras = true } = {}) {
  // Key words already in the input, plus every one we add, so nothing important repeats.
  const used = new Set(keyWords(clean.replace(corporateMatcher.re, " ")));
  const units = splitUnits(clean);
  const parts = units.map((u) => {
    if (u.kind === "item") {
      // List items keep their marker and their own line. No added period, no asides.
      const body = splitSentences(u.text).map((s) => rewriteSentence(s, lvl, rng, used, { addPeriod: false })).join(" ");
      return u.sep + u.mark + body;
    }
    const sentences = splitSentences(u.text).map((s) => rewriteSentence(s, lvl, rng, used));
    // C-suite: sprinkle an aside between sentences.
    if (extras && lvl === 3 && sentences.length > 1) {
      for (let i = sentences.length - 1; i > 0; i--) {
        const pool = INTERJECTIONS.filter((x) => !repeatsKeyWord(x, used));
        if (pool.length && rng() < 0.35) {
          const aside = pick(rng, pool);
          keyWords(aside).forEach((k) => used.add(k));
          sentences.splice(i, 0, aside);
        }
      }
    }
    return u.sep + sentences.join(" ");
  });

  let result = parts.join("");
  // Openers and closers go on their own line when the message has a list, so the list stays intact.
  const first = units[0];
  const last = units[units.length - 1];
  const openJoin = first?.kind === "item" ? "\n" : " ";
  const closeJoin = last?.kind === "item" ? "\n\n" : " ";
  if (extras && rng() < OPENER_CHANCE[lvl]) {
    let pool = OPENERS[rng() < 0.25 ? lvl - 1 : lvl].filter((o) => !repeatsKeyWord(o, used));
    // A message that already starts with a greeting gets no opener in front of it.
    if (/^(?:hi|hey|hello|greetings|hope|dear|good (?:morning|afternoon))\b/i.test(result)) pool = [];
    if (pool.length) {
      const opener = pick(rng, pool);
      keyWords(opener).forEach((k) => used.add(k));
      result = `${opener}${openJoin}${result}`;
    }
  }
  if (extras && rng() < CLOSER_CHANCE[lvl]) {
    const pool = (lvl === 1 ? CLOSERS[1] : rng() < 0.25 ? CLOSERS[lvl - 1] : CLOSERS[lvl]).filter((c) => !repeatsKeyWord(c, used));
    if (pool.length) result = `${result}${closeJoin}${pick(rng, pool)}`;
  }
  return polishCase(tidy(result));
}

/**
 * Normal to corporate with the meaning check. Returns { text, check, fallback }.
 * fallback is "" when the first try passed, "reseed" when a later try passed,
 * and "plain" when only the version without openers, closers and asides passed.
 */
export function toCorporateDetailed(input, { level = 2, seed = 1 } = {}) {
  const lvl = clampLevel(level);
  const clean = normalizeInput(input).trim();
  if (!clean) return { text: "", check: { ok: true, lost: [], added: [] }, fallback: "" };
  for (let k = 0; k < 6; k++) {
    const rng = mulberry32(hashString(clean) ^ Math.imul((seed + k * 7919) >>> 0, 2654435761) ^ (lvl * 97));
    const text = corporateOnce(clean, lvl, rng);
    const check = checkMeaning(clean, text);
    if (check.ok) return { text, check, fallback: k ? "reseed" : "" };
  }
  const rng = mulberry32(hashString(clean) ^ Math.imul(seed >>> 0, 2654435761) ^ (lvl * 97));
  const text = corporateOnce(clean, lvl, rng, { extras: false });
  return { text, check: checkMeaning(clean, text), fallback: "plain" };
}

export function toCorporate(input, opts = {}) {
  return toCorporateDetailed(input, opts).text;
}

// ---------- Corporate to Normal ----------

export function detectThemes(sentence) {
  const found = [];
  for (const theme of THEMES) {
    if (!theme.patterns.some((p) => p.test(sentence))) continue;
    if (theme.requiresNegative && !NEGATIVE_CUES.test(sentence)) continue;
    // LinkedIn posts are about the writer, so "new chapter" in a CEO memo does not count.
    if (theme.firstPerson && !/\b(?:I|I'm|I've|I'll|I'd)\b|\b(?:my|me)\b/i.test(sentence.replace(/\bI\b(?=\.)/g, ""))) continue;
    found.push(theme.id);
  }
  return found;
}

const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// Themes that say the same thing as a stronger one are left out of the summary.
const COVERED_BY = { "layoff-you": ["layoffs", "new-chapter"], pip: ["performance"], "stack-rank": ["performance"] };

function summaryThemes(themeIds) {
  const drop = new Set(themeIds.flatMap((id) => COVERED_BY[id] ?? []));
  return themeIds.filter((id) => !drop.has(id));
}

// Combos that read better as one sentence. Each one leads with the bad news.
const COMBOS = [
  { id: "new-chapter", all: ["new-chapter", "layoffs"], signal: "Laid off, new chapter post",
    text: ["They were laid off and are looking for their next job.", "They got laid off and are job hunting.", "Laid off, and spinning it as a fresh start."] },
  { all: ["no-raises", "record-year"],
    text: ["Raises are on hold, even after a great year.", "No raises, even after a record year.", "No raises. They made record money and you get nothing."] },
  { all: ["layoffs", "record-year"],
    text: ["Jobs are being cut, even though the company is doing well.", "They're laying people off, even after record results.", "They're firing people right after making a fortune."] },
  { all: ["layoffs", "acquisition"],
    text: ["Jobs are being cut after the merger.", "We're laying people off after getting bought.", "New owners, fewer jobs. People are getting fired."] },
];

function combineSummary(themeIds, lvl, fluffShare) {
  const i = lvl - 1;
  const ids = summaryThemes(themeIds);
  const top = ids[0];
  const combo = COMBOS.find((c) => c.all.includes(top) && c.all.every((id) => ids.includes(id)));
  if (combo) return combo.text[i];
  if (!ids.length) {
    if (fluffShare >= 0.5) return ["Lots of kind words, not much news.", "A lot of words that don't say much.", "Nothing. This is a lot of words for nothing."][i];
    return ["Nothing hidden here.", "It mostly says what it says.", "Nothing to decode. Rare."][i];
  }
  return ids.slice(0, 3).map((id) => themeById[id].summary[i]).join(" ");
}

// The headline for a decode: the strongest signal, or a note that there is none.
export function pickSignal(themeIds, fluffShare = 0) {
  const ids = summaryThemes(themeIds);
  const top = ids[0];
  if (!top) {
    return fluffShare >= 0.5 ? { id: "fluff", label: "All fluff", tone: "none" } : { id: "none", label: "No bad news found", tone: "none" };
  }
  const combo = COMBOS.find((c) => c.signal && c.all.includes(top) && c.all.every((id) => ids.includes(id)));
  const base = SIGNALS[top] ?? { label: top, tone: "warn" };
  return { id: combo?.id ?? top, label: combo?.signal ?? base.label, tone: base.tone, also: ids.slice(1).filter((id) => SIGNALS[id]?.tone !== "good").slice(0, 2).map((id) => SIGNALS[id]?.label ?? id) };
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
  if (!clean) return { summary: "", lines: [], themes: [], signal: pickSignal([]) };
  const rng = mulberry32(hashString(clean) ^ Math.imul(seed >>> 0, 2654435761) ^ (lvl * 131));
  const scores = new Map();
  const lines = [];
  let fluff = 0;
  let total = 0;

  // Two or more soft layoff signals in one memo count as a layoff, even without the word.
  const hints = LAYOFF_HINTS.filter((re) => re.test(clean)).length;
  const strongLayoff = splitParagraphs(clean).flatMap(splitSentences).some((s) => detectThemes(s).some((id) => id === "layoffs" || id === "layoff-you"));
  const layoffContext = strongLayoff || hints >= 2;
  if (layoffContext && !strongLayoff) scores.set("layoffs", themeById.layoffs.weight);
  const matcher = layoffContext ? layoffDecodeMatcher : decodeMatcher;

  for (const paragraph of splitParagraphs(clean)) {
    for (const sentence of splitSentences(paragraph)) {
      if (isGreetingOrSignature(sentence)) continue;
      total++;
      const themes = detectThemes(sentence);
      for (const id of themes) scores.set(id, (scores.get(id) ?? 0) + themeById[id].weight);
      const { text: swapped, changed } = swapPhrases(sentence, matcher, lvl, rng, 1);
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
  const fluffShare = total ? fluff / total : 0;
  const summary = combineSummary(ranked, lvl, fluffShare);
  return { summary, lines, themes: ranked, signal: pickSignal(ranked, fluffShare) };
}

// Plain-text version of a decode, for copy and share.
export function formatDecode(result, { withLines = true } = {}) {
  if (!result || !result.summary) return "";
  const signal = result.signal && !["none", "fluff"].includes(result.signal.id) ? `Signal: ${result.signal.label}\n` : "";
  const head = `${signal}What they really mean: ${result.summary}`;
  if (!withLines || !result.lines.length) return head;
  const body = result.lines.map((l) => `"${l.original}"\n= ${l.plain}`).join("\n\n");
  return `${head}\n\n${body}`;
}
