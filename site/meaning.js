import { canonicalizeCrude, neutralizeSlurs, hasCrude } from "./profanity.js";

// Meaning checks for Normal to corporate. Compares the input with a rewrite and lists what got lost
// or made up. Pure functions, used by the Instant engine, the AI path and the tests.

// Words that carry a "no". Contractions like won't and can't count through n't.
const NEGATOR = /\b(?:not|no|nope|nah|never|nobody|nothing|none|nowhere|neither|nor|cannot|without|zero|null|unable|lack|lacking|declin\w*|refus\w*)\b|n't\b/gi;
// Phrases where the "no" is part of an idiom and a rewrite can drop it without changing the meaning.
const NEG_IDIOMS = [
  /\bno (?:problem|worries|rush|biggie|clue|idea)\b/gi, /\b(?:don't|do not) (?:care|mind|have (?:time|the time|the bandwidth))\b/gi,
  /\bcan't wait\b/gi, /\bnot bad\b/gi, /\bnot my (?:job|problem)\b/gi, /\bnothing (?:much|new)\b/gi, /\bno one (?:knows|cares)\b/gi,
  /\b(?:i )?have no idea\b/gi, /\bno shit\b/gi, /\bdon't give a (?:fuck|shit|damn|crap)\b/gi, /\bdon't know\b/gi, /\bdoesn't matter\b/gi, /\bno big deal\b/gi,
];
// Soft versions of a no. A rewrite may not add these, because they turn a refusal into a maybe.
const HEDGE = /\b(?:would rather not|'d rather not|prefer not|might not|may not|probably not|maybe not|hopefully not|not likely|unlikely|not right now|not at this time|not in the near term|for now|for the time being)\b/gi;
const QUESTION = /\?/g;
// Numbers, money, percentages and clock times. Compared as digit strings.
const NUMBER = /\d[\d,.:]*/g;
const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri";
// Words that pin a time or a deadline.
const DATE_WORD = new RegExp(
  `\\b(?:today|tonight|tomorrow|yesterday|this (?:week|morning|afternoon|evening|month|quarter|year)|next (?:week|month|quarter|year)|last (?:week|month|quarter|year)|end of (?:day|week|month|quarter)|EOD|EOW|COB|ASAP|by (?:noon|midnight)|(?:${DAYS})|(?:${MONTHS})(?= \\d)|Q[1-4]|\\d{1,2} ?(?:am|pm))\\b`,
  "gi",
);
// Meeting and follow-up words. A rewrite may only use them if the input talks about meeting or talking.
const MEETING = /\b(?:meeting|meetings|meet|sync|syncs|call|calls|standup|stand-up|1:1|one-on-one|catch-up|catch up|huddle|invite|calendar|touch ?base|touchbase|circle back|follow(?:ing)? up|offline|loop(?:ing)? in|alignment session|get back to you|talk|chat|discuss|connect)\b/gi;
// Bullet or numbered list lines.
const LIST_LINE = /^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/;

const count = (text, re) => (String(text).match(re) ?? []).length;
const lower = (s) => s.toLowerCase();

function stripIdioms(text) {
  let t = String(text);
  for (const re of NEG_IDIOMS) t = t.replace(re, " ");
  return t;
}

export function negations(text) {
  return count(stripIdioms(text), NEGATOR);
}

export function numbers(text) {
  return (String(text).match(NUMBER) ?? []).map((n) => n.replace(/[.,:]+$/, "")).filter(Boolean);
}

export function dateWords(text) {
  return (String(text).match(DATE_WORD) ?? []).map((w) => lower(w).replace(/\s+/g, " "));
}

export function listLines(text) {
  return String(text).split("\n").filter((l) => LIST_LINE.test(l)).length;
}

// Capitalized words that are not the first word of a sentence: names, teams, products, acronyms.
const NOT_NAMES = new Set(["I", "I'm", "I've", "I'll", "I'd", "OK"]);
// Mostly capital letters means shouting, not names.
export function isShouting(text) {
  const letters = String(text).replace(/[^A-Za-z]/g, "");
  return letters.length > 4 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.8;
}

export function names(text) {
  const out = [];
  if (isShouting(text)) return out;
  const dateRe = new RegExp(`^(?:${DAYS}|${MONTHS})$`, "i");
  for (const sentence of String(text).split(/(?<=[.!?:;])\s+|\n+/)) {
    const words = sentence.replace(/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/, "").split(/\s+/).filter(Boolean);
    words.forEach((raw, i) => {
      const word = raw.replace(/^["'(\[]+|["')\].,!?;:]+$/g, "").replace(/'s$/, "");
      if (i === 0 || !/^[A-Z]/.test(word) || NOT_NAMES.has(word) || dateRe.test(word) || hasCrude(word)) return;
      out.push(word);
    });
  }
  return out;
}

// Words the phrasebook itself may add with a capital letter (KPI, AI, OKRs). Filled in by the engine.
let allowedCaps = new Set();
export function setAllowedCaps(words) {
  allowedCaps = new Set(words);
}

/**
 * Compare input and rewrite. Returns { ok, lost: [...], added: [...] }.
 * lost: negation, question, numbers, dates, names, list
 * added: hedge, date, meeting, name
 */
export function checkMeaning(input, output, { checkNames = true } = {}) {
  const lost = [];
  const added = [];
  // Swearing is not meaning. Compare against the input with crude spellings made plain and slurs removed,
  // so dropping "fuck" or a slur never counts as a loss.
  const inp = neutralizeSlurs(canonicalizeCrude(String(input ?? "")));
  const out = String(output ?? "");
  if (negations(out) < negations(inp)) lost.push("negation");
  if (count(out, HEDGE) > count(inp, HEDGE) && negations(inp) > 0) added.push("hedge");
  if (count(out, QUESTION) < count(inp, QUESTION)) lost.push("question");
  const outNums = numbers(out);
  if (numbers(inp).some((n) => !outNums.includes(n))) lost.push("numbers");
  const inDates = dateWords(inp);
  const outDates = dateWords(out);
  if (inDates.some((d) => !outDates.includes(d))) lost.push("dates");
  if (outDates.some((d) => !inDates.includes(d))) added.push("date");
  if (count(out, MEETING) > 0 && count(inp, MEETING) === 0) added.push("meeting");
  if (listLines(out) !== listLines(inp)) lost.push("list");
  if (checkNames) {
    const inNames = names(inp);
    const outText = out;
    if (inNames.some((n) => !new RegExp(`(?<![\\w])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`).test(outText))) lost.push("names");
    const inWords = new Set(inp.toLowerCase().match(/[a-z][\w'&-]*/g) ?? []);
    if (names(out).some((n) => !inWords.has(n.toLowerCase()) && !allowedCaps.has(n))) added.push("name");
  }
  return { ok: !lost.length && !added.length, lost, added };
}

// Short reason for the page, for when an AI reply fails the check.
export function describeProblems({ lost = [], added = [] }) {
  const parts = [];
  if (lost.includes("negation")) parts.push("dropped a no");
  else if (added.includes("hedge")) parts.push("softened a no");
  if (lost.includes("question")) parts.push("dropped a question");
  if (lost.includes("numbers")) parts.push("dropped a number");
  if (lost.includes("dates") || added.includes("date")) parts.push("changed a date");
  if (lost.includes("names")) parts.push("dropped a name");
  if (added.includes("name")) parts.push("added a name");
  if (added.includes("meeting")) parts.push("added a meeting");
  if (lost.includes("list")) parts.push("broke the list");
  return parts.join(" and ");
}
