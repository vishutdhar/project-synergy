// Automated checks for the variations dataset. Used by the eval script and the regression test.
import { findCrude, lostIdioms } from "../../site/profanity.js";
import { checkMeaning } from "../../site/meaning.js";
import { normalizeCasual, normalizeInput } from "../../site/engine.js";

const GARBLED_I = /\bto all day\b|\bthe up\b|[ \t]{2,}|\b(?:an?|the) (?:about|of|to|for|the|a|is|are|was)(?![\w-])|\b(\w{3,}) \1\b|,\s*[.!?]|\b(?:mess|stuff|thing|person|someone) all\b|\bI is\b|\bwe is\b|\bthey is\b/i;
// A lowercase letter right after a full stop, except after abbreviations like e.g. or a version number.
const LOWER_AFTER_STOP = /(?<!\b(?:e\.g|i\.e|etc|vs|v\d+(?:\.\d+)*))[.!?]\s+[a-z]/;
export const GARBLED = { test: (t) => GARBLED_I.test(t) || LOWER_AFTER_STOP.test(t) };
// The openers and closers the engine used to add at Mild and Middle Manager (before this round).
// Round 6 policy change: Mild and Middle Manager may carry the short, content-free sign-offs and labels in
// site/voice.js ("Flagging for visibility:", "Thanks!", "Appreciate it."). Everything else here still counts as added.
const ADDED = [
  "Quick note:", "Hope you're well.", "Hope your week is going well.", "Hi there.", "Small flag:", "Hi all.",
  "Wanted to flag something:", "Hope this finds you well.", "Bubbling this up:", "Putting this on your radar:",
  "Quick level set:", "Adding some color here:", "For awareness:", "Raising this for visibility:",
  "Let me know your thoughts.", "Let me know if you have questions.", "Cheers.",
  "Thoughts?", "Open to thoughts.", "Thanks for your patience.", "Let me know if anything's unclear.", "Appreciate you.",
  "This is about synergy.", "Let's be bold here.", "Think big picture.", "This is very on brand for us.", "We are a family here.", "This is table stakes.",
].map((s) => s.toLowerCase());

// Strings every rewrite must keep: numbers, capitalized names after the first word, weekdays, months, question marks.
export function mustKeep(input) {
  const keep = new Set();
  for (const m of input.matchAll(/\$?\d[\d,.:]*(?:%|k|am|pm)?/gi)) keep.add(m[0].replace(/[.,]$/, ""));
  for (const m of input.matchAll(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi)) keep.add(m[0].toLowerCase());
  for (const m of input.matchAll(/(?<=[a-z,;:]\s+)[A-Z][a-z]+(?:'s)?\b/g)) if (!/^(?:I|I'm|I'll|I've|I'd|Jesus|Christ)$/.test(m[0])) keep.add(m[0].replace(/'s$/, ""));
  if (input.includes("?")) keep.add("?");
  return [...keep];
}

export function corporateFlags(rawInput, out, level) {
  const flags = [];
  // Judge against the input with texting shorthand spelled out ("tmrw" is "tomorrow").
  const input = normalizeCasual(normalizeInput(rawInput)) || rawInput;
  if (!out.trim()) flags.push("empty");
  if (findCrude(out).length) flags.push("crude");
  const m = checkMeaning(input, out);
  if (!m.ok) flags.push(`meaning:${[...m.lost, ...m.added].join("+")}`);
  if (lostIdioms(input, out).length) flags.push("idiom");
  if (GARBLED.test(out) && !GARBLED.test(input)) flags.push("garbled");
  const low = out.toLowerCase();
  if (level < 3 && ADDED.some((a) => low.startsWith(a) || low.endsWith(a)) && !ADDED.some((a) => input.toLowerCase().includes(a))) flags.push("added-sentence");
  for (const k of mustKeep(input)) if (!low.includes(k.toLowerCase())) flags.push(`lost:${k}`);
  return flags;
}

const words = (s) => new Set(String(s).toLowerCase().match(/[a-z']{3,}/g) ?? []);
export function overlap(a, b) {
  const A = words(a), B = words(b);
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i || 1);
}

export function decodeFlags(item, res) {
  const flags = [];
  const want = item.signal;
  const got = res.signal?.id;
  if (want && want !== got && !(want === "fluff" && got === "none") && !(want === "new-chapter" && got === "new-job") && !(item.category === "mixed" && res.themes?.includes(want))) flags.push(`signal:${got}`);
  for (const l of res.lines) if (overlap(l.original, l.plain) > 0.6 && words(l.original).size > 5) flags.push("echo");
  if (findCrude(res.summary).length) flags.push("crude");
  return [...new Set(flags)];
}
