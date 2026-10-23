// Project Synergy rewrite engine. Pure functions, no network, runs in the browser and in Node.
import { restructure, tokenSim, polishRegister, lowerFirst } from "./register.js";
import {
  CORPORATE_SWAPS, OPENERS, CLOSERS, INTERJECTIONS,
  DECODE_SWAPS, THEMES, NEGATIVE_CUES, FLUFF_PATTERNS, FLUFF_LINES, PLAIN_LINES, SPECIAL_LINES,
  LAYOFF_HINTS, LAYOFF_CONTEXT_SWAPS, SIGNALS,
} from "./phrasebook.js";
import { checkMeaning, setAllowedCaps, isShouting } from "./meaning.js";
import { prepass, fixCollocations } from "./prepass.js";
import { composeCSuite } from "./csuite.js";
import { CRUDE_SWAPS, canonicalizeCrude, hasCrude, cleanCrude } from "./profanity.js";

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

// ---------- Casual text cleanup (Normal to Corporate only) ----------
// Texting shorthand and common typos become plain words before any swap, so "pls send tmrw"
// reads "please send tomorrow". Only whole words, never inside URLs, code or names.
const CASUAL_WORDS = {
  u: "you", r: "are", ur: "your", urs: "yours", ya: "you", yall: "you all", "y'all": "you all", rn: "right now",
  tmrw: "tomorrow", tmr: "tomorrow", tmw: "tomorrow", tomorow: "tomorrow", tommorow: "tomorrow", tommorrow: "tomorrow", "2morrow": "tomorrow", "2day": "today", "2nite": "tonight",
  tonite: "tonight", pls: "please", plz: "please", plez: "please", thx: "thanks", thnx: "thanks", thanx: "thanks", ty: "thank you", tysm: "thank you so much",
  np: "no problem", idk: "I don't know", idc: "I don't care", imo: "in my opinion,", imho: "in my opinion,", tbh: "to be honest,", ngl: "honestly,",
  lmk: "let me know", brb: "be right back,", omw: "on my way", lgtm: "looks good to me", btw: "by the way", fyi: "FYI", ooo: "out of office", wfh: "working from home",
  bc: "because", cuz: "because", coz: "because", "'cause": "because", "w/": "with", "w/o": "without", b4: "before", l8: "late", l8r: "later", gr8: "great",
  gonna: "going to", wanna: "want to", gotta: "have to", kinda: "kind of", sorta: "sort of", lemme: "let me", gimme: "give me", dunno: "don't know", finna: "about to",
  yeah: "yes", yea: "yes", yep: "yes", yup: "yes", ya: "yes", nah: "no,", nope: "no", k: "OK", kk: "OK", okk: "OK", okie: "OK", oki: "OK",
  im: "I'm", ive: "I've", ill: "I'll", id: "I'd", dont: "don't", cant: "can't", wont: "won't", didnt: "didn't", doesnt: "doesn't", isnt: "isn't", wasnt: "wasn't",
  arent: "aren't", werent: "weren't", havent: "haven't", hasnt: "hasn't", shouldnt: "shouldn't", couldnt: "couldn't", wouldnt: "wouldn't", thats: "that's", whats: "what's",
  theres: "there's", youre: "you're", theyre: "they're", hes: "he's", shes: "she's", weve: "we've", theyve: "they've", youve: "you've", wouldve: "would've", shouldve: "should've", couldve: "could've",
  sry: "sorry", srry: "sorry", soz: "sorry", msg: "message", mtg: "meeting", mins: "minutes", hrs: "hours", convo: "conversation", rly: "really", srsly: "seriously",
  prob: "probably", prolly: "probably", probs: "probably", obv: "obviously", obvi: "obviously", def: "definitely", defo: "definitely", deffo: "definitely",
  any1: "anyone", some1: "someone", every1: "everyone", no1: "no one", teh: "the", recieved: "received", recieve: "receive", reveiw: "review", definately: "definitely",
  definitly: "definitely", seperate: "separate", wierd: "weird", untill: "until", alot: "a lot", wat: "what", wut: "what", wht: "what", becuase: "because", becasue: "because",
  tho: "though", thru: "through", ppl: "people", pplz: "people", govt: "government", abt: "about", appt: "appointment", asap: "ASAP", eod: "EOD", eow: "EOW",
  amirite: ", right?", afk: "offline", dawg: "", bruh: "", fam: "", sus: "questionable", borked: "broken", yeeted: "scrapped", wanna: "want to", lol: "", lmao: "", lmfao: "", rofl: "", haha: "", hahaha: "", hehe: "", smh: "", fr: "", omg: "wow,", omfg: "wow,", ugh: "", ughh: "", welp: "",
};
const CASUAL_RE = new RegExp(`(?<![\\w'/@.:-])(${Object.keys(CASUAL_WORDS).map(escapeRe).join("|")}|ha(?:ha)+h?|ugh+|lo+l+)(?![\\w'/@-]|\\.\\w)`, "gi");
const DAYS = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|august|september|october|november|december)\b/g;
const EMOJI = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D|\p{Emoji_Modifier}|\p{Extended_Pictographic})*/gu;
const EMOTICON = /(?<=^|\s)(?::\)|:-\)|:\(|:-\(|:D|:P|:p|;\)|;-\)|:\/|:-\/|<3|xD|XD|:\||\^_\^|-_-)(?=\s|$|[.,!?])/g;
// A sentence that starts with one of these and has no subject gets "I" or "I'm" in front.
const NEEDS_I = /^(?!got it\b)(?:overslept|need|can't|cannot|can not|won't|will be|need to|have to|didn't|haven't|forgot|missed|got|hate|love|think|thought|wanted|want|hope|meant|saw|left|made|tried|sent|finished|fixed|pushed|merged|broke|should|might|may need|just (?:sent|saw|got|finished|pushed|merged|realized|noticed)|already|still need|also need|really need|totally forgot)\b/i;
const NEEDS_IM = /^(?:running \d+ min|on a call|back from|in a meeting|in meetings|taking|waiting|running late|running behind|heading|stuck|working on|leaving|feeling|out sick|on my way|almost done|swamped|slammed|exhausted|so tired|tired|sick today|busy|done for|off today|out today|back in|not feeling|going to be|about to)\b/i;
const QUESTION_START = /^(?!what an? |how (?:wonderful|nice|great|exciting|fun|generous|lovely|cool|sweet|thoughtful)\b)(?:so (?:who|what|when|where|why|how)|(?:has|did|does) \w+|wtf|wth|why tf|the (?:hell|fuck) (?:is|are|was|were|do|does|did)|who|what|what's|when|where|why|how|which|whose|is (?:it|this|that|there|anyone|everyone|the|my|our|your|he|she)|are (?:you|we|they|there|the|these|those|any)|am i|was (?:it|that|there|the)|were (?:you|we|they)|(?:do|does|did|can|could|would|will|should|shall|have|has|had|may|might|won't|can't|didn't|don't|doesn't|isn't|aren't) (?:you|we|they|i|he|she|it|this|that|there|anyone|anybody|someone|everyone|people|y'all|you all|the|our|your|my|any)|any (?:update|updates|news|word|chance|idea|ideas|luck|thoughts)|anyone|anybody|you (?:free|around|there|up for|ok|okay|good|coming|joining)|u (?:free|around|there|up for|ok|good|coming))\b/i;

export function normalizeCasual(text) {
  let t = String(text);
  t = t.replace(EMOJI, " ").replace(EMOTICON, " ");
  t = t.replace(CASUAL_RE, (m) => {
    const key = m.toLowerCase();
    let rep = CASUAL_WORDS[key];
    if (rep === undefined) rep = ""; // laughter and "ugh" variants
    if (!rep) return "";
    if (key === "ur") return rep; // fixed below for "you're"
    if (/^[A-Z]/.test(m) && /^[a-z]/.test(rep)) rep = rep[0].toUpperCase() + rep.slice(1);
    return rep;
  });
  // "your late" / "your welcome" / "your right" mean "you're".
  t = t.replace(/\b([Yy])our (late|welcome|right|wrong|going|not|so|still|the best|amazing|awesome|killing|kidding|joking|on mute|muted|up next|good|all set|fine|done|out|back|in charge|correct|always|never|being|a lifesaver|the man|a star)\b/g, "$1ou're $2");
  t = t.replace(/\bb (there|back|right|ready|late|home|in|online|on)\b/gi, "be $1");
  t = t.replace(/^\s*bet\s*[.!]*\s*$/i, "Sounds good.").replace(/^\s*rip\s*[.!]*\s*$/i, "That's unfortunate.");
  t = t.replace(/\bthe vibes (in|at|on|of|during) ([^.!?,]*?) (?:were|are) off\b/gi, "the mood $1 $2 was off").replace(/\bvibes? (?:were|are|was|is) off\b/gi, "mood was off");
  t = t.replace(/\b(is|are|was|were|be|been) (\d+) ?(days?|weeks?|months?) late\b/gi, "$1 $2 $3 overdue");
  t = t.replace(/\b(running|run|ran) (\d+) ?(min|mins|minutes|hours?|hrs?) late\b/gi, "$1 $2 $3 behind");
  t = t.replace(/\b(\d+) ?(min|mins|minutes|hours?|hrs?|days?|weeks?|months?) late\b/gi, "$1 $2 behind schedule");
  t = t.replace(/^(\s*)(?:y'?all|you all)(?=\s+(?:the|we|i|it|this|that|there|guess|check|look|our)\b)/gim, "$1everyone,");
  t = t.replace(/\bdon'?t @ me,? but\b/gi, "unpopular opinion, but");
  t = t.replace(/\blma+o+\b|\blo+l+\b/gi, "");
  t = t.replace(/!{2,}/g, "!");
  t = t.replace(/^(\s*)(?:ok|okay),?\s+so,?\s+(?=[a-z])/gim, "$1");
  t = t.replace(/^(\s*)so,?\s+(?=(?:i|we)\s+(?:was|were|had|tried|thought)\b)/gim, "$1");
  t = t.replace(/^(\s*)([^\n?]+?),?\s+fyi\s*[.!]*\s*$/gim, "$1$2.");
  t = t.replace(/,\s+(?:please\s+)?(don't|do not)\s+(?=[a-z])/gi, ". Please $1 ");
  t = t.replace(/^(\s*)(no|yes|yeah|ok|okay|sure|nope)\s+(?=(?:I|I'm|I'll|we|we're|you|it|it's|that's|that)\b)/gim, "$1$2, ");
  t = t.replace(/^(\s*)(honestly|frankly|basically|seriously|anyway|actually)\s+(?=[a-z])/gim, "$1$2, ");
  t = t.replace(/\b(\w+) (to be honest|tbh),?\s*$/gim, (m, w, p) => (w === "honest" ? m : `${w}, ${p}`));
  t = t.replace(/\b(\w+) (by the way|btw)\s*$/gim, (m, w, p) => (/^(?:the|said|asked)$/i.test(w) ? m : `${w}, ${p}`));
  t = t.replace(/^(\s*)(by the way|btw)\s+(?=[a-z])/gim, "$1$2, ");
  t = t.replace(/^(\s*)(wait|hold on|hang on)\s+(?=(?:are|is|did|do|does|was|were|what|why|who|how|when|where|so|we|i|you|they|he|she)\b)/gim, "$1$2, ");
  t = t.replace(/([a-z]) (you're|you are|ur|u r) (the best|a lifesaver|a star|amazing)\b/gi, "$1, you're $3");
  t = t.replace(/^(\s*)(oops|whoops)\s+(?=(?:my bad|sorry|wrong|typo)\b)/gim, "$1$2, ");
  t = t.replace(/^(\s*)(wow|whoa|oh wow|yikes)\s+(?=(?:thanks|thank|that|this|so|what|ok|okay|i|we|you|the|great|nice|cool|just)\b)/gim, "$1$2, ");
  t = t.replace(/\blowkey\b/gi, "quietly").replace(/\bslapped\b/gi, "was great");
  t = t.replace(/(^|[.!?]\s+)wait,? what\b[?!.]*/gi, (_m, p) => p + "Wait, what?");
  // "honestly," left at the very end of a sentence loses its comma.
  t = t.replace(/,(?=\s*[.!?])/g, "").replace(/,\s*$/, "");
  // "r" left over means "are", and "u" means "you". "i" is fixed later by polishCase.
  t = t.replace(DAYS, (d) => d[0].toUpperCase() + d.slice(1));
  t = t.replace(/\b(since|in|by|until|till|from|before|after|early|mid|late|end of) (march|may)\b/gi, (_m, p, mo) => `${p} ${mo[0].toUpperCase()}${mo.slice(1).toLowerCase()}`);
  t = t.replace(/\b(we're|we are|i'm|i am|they're|you're|we|they) (?:so )?cooked\b/gi, "$1 in trouble");
  // Clean up the gaps left by dropped words.
  t = t.replace(/[ \t]{2,}/g, " ").replace(/ +([,.!?;:])/g, "$1").replace(/^[ \t]*[,.;:]\s*/gm, "").replace(/,\s*([.!?])/g, "$1").replace(/[ \t]+$/gm, "").replace(/^[ \t]+/gm, (m) => m);
  // Per line (keeps lists intact): add a missing subject and a missing question mark.
  t = t.split("\n").map((line) => {
    if (/^\s*(?:[-*\u2022]|\d{1,2}[.)]|[a-hA-H]\))\s/.test(line)) return line;
    return line.replace(/(^|[.!?]\s+)([^.!?]+)([.!?]*)/g, (whole, lead, body, end) => {
      let b = body;
      const trimmed = b.trim();
      if (!trimmed) return whole;
      let tailQuestion = false;
      if (!end && QUESTION_START.test(trimmed) && !/\b(?:I think|let me know|wondering)\b/i.test(trimmed)) end = "?";
      else if (!end && /,\s*(?:(?:can|could|would|will) (?:you|someone|anyone|somebody|we)|should (?:I|we)|which one|any (?:ideas|thoughts)|(?:want|need) anything|anyone want|what (?:did|do|does|is|are|should|can) (?:I|we|you|they)|right|thoughts)\b[^,]*$/i.test(trimmed)) { end = "?"; tailQuestion = true; }
      else if (!end && /^(?:ok|okay|but|and|so)\b.*\bwhy$/i.test(trimmed)) end = "?";
      if (end === "?" && /:\s*$/.test(trimmed)) end = "";
      // "can we get help, we're drowning" asks first, then explains: "Can we get help? We're drowning."
      if (end === "?" && !tailQuestion && QUESTION_START.test(trimmed)) {
        const split = b.match(/^(\s*[^,]+),\s+((?:we're|i'm|it's|they're|this is|that's|we are|i am|everything is|nothing is)\b.*)$/i);
        if (split) return lead + split[1] + "? " + split[2][0].toUpperCase() + split[2].slice(1) + ".";
      }
      else if (end === "." && QUESTION_START.test(trimmed) && /^(?:who|what|when|where|why|how|which)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 8) end = "?";
      if (end !== "?" || tailQuestion) {
        if (NEEDS_IM.test(trimmed)) b = b.replace(/^(\s*)/, "$1I'm ");
        else if (NEEDS_I.test(trimmed)) b = b.replace(/^(\s*)/, "$1I ");
        b = b.replace(/^(\s*)I (I'm|I) /, "$1$2 ");
      }
      if (b !== body && /^\s*I/.test(b)) b = b.replace(/^(\s*I'?m? )([A-Z])(?=[a-z])/, (_m, p, c) => p + c.toLowerCase());
      return lead + b + end;
    });
  }).join("\n");
  return t.trim();
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
  // Shorter keys that also match at the same spot, longest first. Used when the longest match can't be swapped.
  // Keys grouped by first word, so only keys that could start here are tried.
  let byFirst = null;
  const shorterAt = (text, start, len) => {
    if (!byFirst) {
      byFirst = new Map();
      for (const k of keys) {
        const first = k.split(" ")[0].replace(/'/g, "");
        const re = new RegExp(`(?<![\\w'-])(?:${escapeRe(k).replace(/'/g, "'?").replace(/ /g, "\\s+")})(?![\\w'-])`, "iy");
        byFirst.set(first, [...(byFirst.get(first) ?? []), re]);
      }
    }
    const word = text.slice(start).match(/^[\w'-]+/)?.[0].toLowerCase().replace(/'/g, "") ?? "";
    const out = new Set();
    for (const r of byFirst.get(word) ?? []) {
      r.lastIndex = start;
      const hit = r.exec(text);
      if (hit && hit[0].length < len) out.add(hit[0]);
    }
    return [...out].sort((a, b) => b.length - a.length);
  };
  return { re, lookup, shorterAt };
}

export const corporateEntries = parseSwaps(CORPORATE_SWAPS);
// Crude phrases come first, so "is shit" beats any plain swap for "is".
export const crudeEntries = parseSwaps(CRUDE_SWAPS).map((e) => ({ ...e, crude: true }));
export const decodeEntries = parseSwaps(DECODE_SWAPS);
const plainMatcher = buildMatcher(corporateEntries);
// Sentences with no crude word skip the big crude matcher. A few crude idioms are spelled with clean words.
export const mayBeCrude = (text) => hasCrude(text) || /\b(?:squat|knackered|screwed|crapped|shat|hardass|screw the|dick(?:ing|ed)? around|cockblock\w*|dumpster fire|brown-noser|kiss(?:ing|ed|es)? up|can shove|shove it)\b/i.test(text);
const crudeMatcher = buildMatcher(crudeEntries);

// The input with swearing already swapped for plain, mild wording. AI mode rewrites this
// version, so the model never sees "fuck off" and can't copy it into the reply.
export function softenCrude(input) {
  const clean = canonicalizeCrude(normalizeCasual(normalizeInput(input))).replace(/[ \t]{2,}/g, " ").trim();
  if (!mayBeCrude(clean)) return clean;
  let { text } = swapPhrases(clean, crudeMatcher, 1, () => 0, 1);
  if (hasCrude(text)) text = cleanCrude(text).text;
  text = text.replace(/[\u0000\u0001]/g, "").replace(/[ \t]{2,}/g, " ").trim();
  return /^[A-Z]/.test(clean) ? capFirst(text) : text;
}
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
  const before = text.slice(0, start).replace(/[\u0000\u0001]/g, "").trimEnd();
  const after = text.slice(end).replace(/[\u0000\u0001]/g, "").trimStart();
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
    // After "don't" or "did not", a swap that starts with a helper verb would read "don't would like".
    const negAux = /\b(?:don't|doesn't|didn't|dont|do not|does not|did not)\s*$/i.test(text.slice(0, start).replace(/[\u0000\u0001]/g, ""));
    let found = null;
    for (const cand of [m[0], ...matcher.shorterAt(text, start, m[0].length)]) {
      const candEnd = start + cand.length;
      const entry = (matcher.lookup(cand) ?? []).find((e) => {
        if (e.clauseOnly && !isClause(text, start, candEnd)) return false;
        if (e.beforeWord && !/^\s+[A-Za-z]/.test(text.slice(candEnd))) return false;
        return true;
      });
      if (!entry) continue;
      if (negAux && entry.tiers.flat().some((o) => /^(?:would|will|am|is|are|have|has|can|could)\b/i.test(o))) continue;
      if (protect.some(([a, b]) => start < b && candEnd > a)) continue;
      // "don't leverage it" reads oddly in a plain warning; keep "use" after a negation below C-Suite.
      if (negAux && level < 3 && /^use$/i.test(cand)) continue;
      found = { entry, end: candEnd, match: cand };
      break;
    }
    if (!found) {
      re.lastIndex = start + 1;
      continue;
    }
    const { entry, end } = found;
    re.lastIndex = end;
    m = [found.match];
    let replacement = m[0];
    if (entry.always || rng() <= swapChance) {
      // Mostly pick from this level's tier, sometimes from the one below for variety.
      const tierIdx = level > 1 && rng() < 0.2 ? level - 2 : level - 1;
      let choice = pick(rng, entry.tiers[tierIdx]);
      // Avoid repeating a key word already in the output ("capacity" twice).
      // Words kept from the matched phrase itself ("minutes" in "minutes late") are not repeats.
      const own = new Set(keyWords(m[0]));
      const repeats = (c) => keyWords(c).some((k) => used.has(k) && !own.has(k));
      if (used && repeats(choice)) {
        // Same tier first, then milder tiers, then stronger ones.
        const others = [entry.tiers[tierIdx], entry.tiers[level - 1], ...entry.tiers.slice(0, level - 1).reverse(), ...entry.tiers.slice(level)].flat();
        // A crude phrase is never kept as is, even if every option repeats a word.
        choice = others.find((c) => !repeats(c)) ?? (entry.crude ? choice : m[0]);
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
    .replace(/,(\s*[.!?])/g, "$1")
    .replace(/:(\s*[!?])/g, "$1")
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
    const prev = out[out.length - 1];
    // A question or exclamation inside a quote that opened mid-sentence ("any updates?" pings) stays in that sentence.
    const midQuote = prev && /\S\s+"[^"]*[!?]"$/.test(prev) && /^[a-z]/.test(s);
    if (out.length && (midQuote || /\b(?:[A-Z]\.){1,3}$|\b(?:Mr|Ms|Mrs|Dr|Inc|Co|Jr|Sr|vs|etc|e\.g|i\.e)\.$/.test(prev))) {
      out[out.length - 1] += " " + s;
    } else out.push(s);
  }
  return out;
}

export function capFirst(s) {
  if (/^\s*\S*(?::\/\/|^www\.)/.test(s) || /^\s*(?:https?:|www\.)/i.test(s)) return s;
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
  let quoteMid = false;
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
    // A quote opened mid-sentence ("any updates?" pings) does not end the sentence when it closes.
    if (/^["\u201C]/.test(part) && !sentenceStart) quoteMid = true;
    const closesMidQuote = quoteMid && /[!?]["\u201D]$/.test(part);
    if (/["\u201D]$/.test(part)) quoteMid = false;
    sentenceStart = /[.!?]["')\]\u2019\u201D]*$/.test(part) && !/\.\.["')\]]*$/.test(part) && !abbrev && !closesMidQuote;
  }
  return parts.join("");
}

// ---------- Normal to Corporate ----------

const SWAP_CHANCE = { 1: 0.8, 2: 1, 3: 1 };
// Mild never adds an opener. Openers and closers are tone only (see phrasebook.js).
// Mild and Middle Manager add nothing. Full C-Suite gets a lead-in and sometimes a neutral sign-off.
const OPENER_CHANCE = { 1: 0, 2: 0, 3: 1 };
const CLOSER_CHANCE = { 1: 0, 2: 0, 3: 0.5 };
const LIST_MARK = /^(\s*(?:[-*\u2022]|\d{1,2}[.)]|[a-hA-H]\))\s+)/;

// Capitalized words the phrasebook may add on its own (KPI, OKRs, AI). The meaning check allows them.
const CAPS_SOURCES = [CORPORATE_SWAPS, CRUDE_SWAPS, ...Object.values(OPENERS).flat(), ...Object.values(CLOSERS).flat(), ...INTERJECTIONS].join(" ");
setAllowedCaps(CAPS_SOURCES.match(/\b[A-Z][\w'&-]*/g) ?? []);

// Spans a swap must not touch: numbers, dates, times and names.
function protectedSpans(sentence) {
  const spans = [];
  const add = (re) => {
    for (const m of sentence.matchAll(re)) spans.push([m.index, m.index + m[0].length]);
  };
  add(/\d[\d,.:]*\s?(?:%|k|m|am|pm)?/gi);
  // Quoted words are the user's exact words: "quick favor" stays as written.
  add(/"[^"\n]{1,80}"/g);
  add(/\b(?:today|tonight|tomorrow|yesterday|(?:this|next|last) (?:week|month|quarter|year)|EOD|EOW|COB|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)\b/gi);
  // Capitalized words after the first word of the sentence, unless the whole thing is shouted.
  if (!isShouting(sentence)) for (const m of sentence.matchAll(/(?<=\S\s+)[A-Z][\w'&-]*/g)) {
    if (!/^I(?:'m|'ve|'ll|'d)?$/.test(m[0]) && !hasCrude(m[0])) spans.push([m.index, m.index + m[0].length]);
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
function rewriteSentence(sentence, lvl, rng, used, { addPeriod = true, dropped = [], ctx = null } = {}) {
  const protect = protectedSpans(sentence);
  const label = ctx?.label ?? { used: false };
  for (let attempt = 0; attempt < 5; attempt++) {
    const trial = new Set(used);
    const trialLabel = { used: label.used };
    // Crude phrases go first, in their own pass, so a plain swap like "I feel like" can't grab
    // the start of "I feel like shit". Their rewrites are then protected from the plain pass.
    let base = sentence;
    let prot = protect;
    if (mayBeCrude(sentence)) {
      base = swapPhrases(sentence, crudeMatcher, lvl, rng, 1, trial, protect).text;
      prot = [...protectedSpans(base), ...[...base.matchAll(/\u0000[^\u0001]*\u0001/g)].map((m) => [m.index, m.index + m[0].length])];
    }
    // Sentence-level register rules (register.js). The last attempt goes without them.
    if (ctx && attempt < 4) {
      const r = restructure(base, lvl, { ...ctx, label: trialLabel });
      if (r.device) {
        base = r.text;
        for (const m of base.matchAll(/\u0000([^\u0001]*)\u0001/g)) keyWords(m[1]).forEach((k) => trial.add(k));
        prot = [...protectedSpans(base.replace(/\u0000[^\u0001]*\u0001/g, (m) => "x".repeat(m.length))), ...[...base.matchAll(/\u0000[^\u0001]*\u0001/g)].map((m) => [m.index, m.index + m[0].length])];
      }
    }
    const { text } = swapPhrases(base, plainMatcher, lvl, rng, SWAP_CHANCE[lvl], trial, prot);
    let t = capFirst(fixCollocations(polishRegister(tidy(text))));
    if (addPeriod && !endsWithPunct(t) && !/[,:;]$/.test(t) && /[A-Za-z0-9]/.test(t)) t += ".";
    if (checkMeaning(sentence, t).ok && !hasCrude(t)) {
      for (const k of trial) used.add(k);
      label.used = trialLabel.used;
      return t;
    }
  }
  // Nothing passed. Keep the user's words. Swearing that is only emphasis goes. If a crude word is
  // still left there is no safe rewrite, so the sentence is left out and reported, never garbled.
  const safe = cleanCrude(sentence);
  if (safe.dropped.length) dropped.push(...safe.dropped);
  if (!safe.text) return "";
  let t = capFirst(tidy(safe.text));
  if (addPeriod && !endsWithPunct(t) && !/[,:;]$/.test(t)) t += ".";
  return t;
}

function corporateOnce(clean, lvl, rng, { extras = true, dropped = [], forceMild = false, register = true } = {}) {
  // Key words already in the input, plus every one we add, so nothing important repeats.
  const used = new Set(keyWords(clean.replace(crudeMatcher.re, " ").replace(plainMatcher.re, " ")));
  const units = splitUnits(clean);
  const label = { used: false };
  let sentenceNo = 0;
  const firstProse = units.findIndex((u) => u.kind === "prose");
  const parts = units.map((u, ui) => {
    if (u.kind === "item") {
      // List items keep their marker and their own line. No added period, no asides.
      const body = splitSentences(u.text).map((s) => rewriteSentence(s, lvl, rng, used, { addPeriod: false, dropped })).filter(Boolean).join(" ");
      return u.sep + u.mark + body;
    }
    const sents = splitSentences(u.text);
    const sentences = sents.map((s, si) => {
      const ctx = register ? { first: ui === firstProse && si === 0 && sentenceNo++ === 0, solo: units.length === 1 && sents.length === 1, label, forceMild, count: sents.length } : null;
      return rewriteSentence(s, lvl, rng, used, { dropped, ctx });
    }).filter(Boolean);
    return u.sep + sentences.join(" ");
  });

  // "absolutely, let's operationalize that, I'll..." would be a comma splice, so the lead-in becomes its own sentence.
  let result = parts.join("").replace(/\b(operationalize that), (?=I\b|I'|we\b|we'|you\b|you')/g, "$1. ")
    .replace(/(^|[.!?]\s+)(Sorry|Oops) (?=wrong\b|typo\b|ignore\b|meant\b)/g, "$1$2, ")
    .replace(/(^|[.!?]\s+)(Ok|Okay|Yes|Yeah) (?=but\b|because\b|so\b)/g, "$1$2, ");
  // Openers and closers go on their own line when the message has a list, so the list stays intact.
  const first = units[0];
  const last = units[units.length - 1];
  const openJoin = first?.kind === "item" ? "\n" : " ";
  const closeJoin = last?.kind === "item" ? "\n\n" : " ";
  if (extras && /[A-Za-z]/.test(result) && rng() < OPENER_CHANCE[lvl]) {
    let pool = OPENERS[lvl].filter((o) => !repeatsKeyWord(o, used));
    // A message that already starts with a greeting gets no opener in front of it.
    if (/^(?:hi|hey|hello|greetings|hope|dear|good (?:morning|afternoon))\b/i.test(result)) pool = [];
    // Nor one that already opens with a lead-in like "In the spirit of radical candor,".
    if (/^(?:in the spirit of|candidly|frankly|honestly|to be honest|transparently|for (?:full )?visibility|big picture)\b/i.test(result)) pool = [];
    // Nor one that already starts with a level label ("Strategic agenda:", "What a growth opportunity:").
    if (/^[A-Z][^.!?:\n]{0,40}:\s/.test(result) && !/^\S+:\s/.test(clean)) pool = [];
    if (pool.length) {
      const opener = pick(rng, pool);
      keyWords(opener).forEach((k) => used.add(k));
      result = `${opener}${openJoin}${result}`;
    }
  }
  if (extras && /[A-Za-z]/.test(result) && rng() < CLOSER_CHANCE[lvl]) {
    const pool = CLOSERS[lvl].filter((c) => !repeatsKeyWord(c, used));
    if (pool.length) result = `${result}${closeJoin}${pick(rng, pool)}`;
  }
  return polishCase(tidy(result));
}

/**
 * Normal to corporate with the meaning check. Returns { text, check, fallback }.
 * fallback is "" when the first try passed, "reseed" when a later try passed,
 * and "plain" when only the version without openers, closers and asides passed.
 */
export function toCorporateDetailed(input, { level = 2, seed = 1, raw = false } = {}) {
  const lvl = clampLevel(level);
  // Full C-Suite is composed from the Mild and Middle Manager rewrites (csuite.js): frame + point + closer.
  if (lvl === 3 && !raw) {
    const mild = toCorporateDetailed(input, { level: 1, seed });
    const middle = toCorporateDetailed(input, { level: 2, seed });
    if (mild.text && mild.fallback !== "plain") {
      const c0 = canonicalizeCrude(normalizeCasual(normalizeInput(input)) || normalizeInput(input)).replace(/[ \t]{2,}/g, " ").trim();
      const ref = prepass(c0);
      const without = (dropped) => dropped.reduce((t, d) => t.replace(d, " "), ref);
      for (let k = 0; k < 4; k++) {
        const rng = mulberry32(hashString(ref) ^ Math.imul((seed + k * 7919) >>> 0, 2654435761) ^ 0x5eed);
        const text = composeCSuite({ clean: ref, mild: mild.text, middle: middle.text, rng, raw: String(input) });
        if (!text) break;
        const check = checkMeaning(without(mild.unsafe ?? []), text);
        if (check.ok && !hasCrude(text)) return { text: polishCase(tidy(text)), check, fallback: k ? "reseed" : "", unsafe: mild.unsafe ?? [] };
      }
    }
    return toCorporateDetailed(input, { level, seed, raw: true });
  }
  // Censored spellings become plain ones (f*ck, wtf) so the crude rewrites can catch them. Slurs never get through.
  // Texting shorthand becomes plain words first.
  const clean0 = canonicalizeCrude(normalizeCasual(normalizeInput(input)) || normalizeInput(input)).replace(/[ \t]{2,}/g, " ").trim()
    // "Jesus Christ" is an exclamation here, not a name to keep.
    .replace(/\bjesus(?: h\.?)? christ\b/gi, "jesus christ")
    // Run-on "a call with Northwind they want a demo" -> "a call with Northwind. They want a demo".
    .replace(/\b(with|from|to|at|for) ([A-Z][a-z]+) (they|she|he) (?=\w)/g, (_m, p, n, w) => `${p} ${n}. ${w[0].toUpperCase()}${w.slice(1)} `);
  // Sarcasm becomes the sincere complaint, run-on apologies are split, dropped articles come back (prepass.js).
  const clean = prepass(clean0);
  const empty = { text: "", check: { ok: true, lost: [], added: [] }, fallback: "", unsafe: [] };
  if (!clean) return empty;
  // A sentence with no safe rewrite is left out, so the meaning check skips it too.
  const without = (dropped) => dropped.reduce((t, d) => t.replace(d, " "), clean);
  for (let k = 0; k < 6; k++) {
    const rng = mulberry32(hashString(clean) ^ Math.imul((seed + k * 7919) >>> 0, 2654435761) ^ (lvl * 97));
    const dropped = [];
    let text = corporateOnce(clean, lvl, rng, { dropped });
    // Mild must read as professional email, not a tidied copy. If it barely moved, allow the Mild framing.
    if (lvl === 1 && tokenSim(clean, text) >= 0.9) {
      const d2 = [];
      const framed = corporateOnce(clean, lvl, rng, { dropped: d2, forceMild: true });
      if (framed !== text && checkMeaning(without(d2), framed).ok && !hasCrude(framed)) {
        text = framed;
        dropped.length = 0;
        dropped.push(...d2);
      }
    }
    text = levelFloor(input, clean, text, lvl, seed);
    const check = checkMeaning(without(dropped), text);
    if (check.ok && !hasCrude(text)) return { text, check, fallback: k ? "reseed" : "", unsafe: [...new Set(dropped)] };
  }
  const rng = mulberry32(hashString(clean) ^ Math.imul(seed >>> 0, 2654435761) ^ (lvl * 97));
  const dropped = [];
  let text = corporateOnce(clean, lvl, rng, { extras: false, dropped });
  // Hard gate: corporate output is never crude, whatever else happened.
  if (hasCrude(text)) {
    const safe = cleanCrude(text);
    dropped.push(...safe.dropped);
    text = polishCase(tidy(safe.text));
  }
  return { text, check: checkMeaning(without(dropped), text), fallback: "plain", unsafe: [...new Set(dropped)] };
}

// Last resort so each level reads differently. Mild that is still a tidy copy gets a soft opener;
// Middle Manager that reads the same as Mild gets a label. Sarcasm and interjections are left alone at Mild.
const HAS_LABEL = /^[A-Z][\w' ,-]{1,32}:\s/;
const INTERJECTION = /^(?:everyone|team|folks|all|really|truly|wow|oh|ah|yeah|yes|yay|ugh|lol|haha|so glad|love|amazing|sure|great|cool|nice|thanks|thank you|hi|hey|hello|happy|welcome|congrat|hmm|ok|okay|fine|same|no|nope|yep)\b/i;
// Level polish for the shortfall classes (shortfalls/research.md): stacked labels, feedback framing,
// hedging an opinion at Mild, recognition for praise.
function levelPolish(text, lvl, clean) {
  let t = text;
  if (lvl === 1) {
    t = t.replace(/^(That|This|The) ([\w-]+(?: [\w-]+)?) is (?:impossible|unrealistic)\.$/, (_m, d, n) => `I don't think ${d.toLowerCase()} ${n} is realistic.`)
      .replace(/^(?:Just to let you know, )?(this|that|it) needs more work\.$/i, (_m, w) => `I think ${w.toLowerCase()} needs more work.`)
      .replace(/^I see (it|this|that|the [\w-]+) differently\.$/, "I see $1 a bit differently.")
      .replace(/^You (?!could|can|should|might|may|will|would|are welcome)([a-z']+) (.+)\.$/, (m, v, r) => (/\bThank you\b/.test(r) ? m : /\b(?:great|excellent|amazing|fantastic|awesome|well|outstanding|brilliant)\b/.test(r) ? `You ${v} ${r}. Thank you.` : `I've noticed you ${v} ${r}.`))
      .replace(/^Just to let you know, your (.+)\.$/, (m, r) => (/\b(?:clear|great|good|excellent|amazing|helpful|thoughtful|awesome)\b/.test(r) && !/\b(?:not|no|too)\b|n't/.test(r) ? `Your ${r}. Great work.` : `I noticed that your ${r}.`))
      .replace(/^It looks like (the [\w-]+ (?:says|said|reports|reported|mentioned)) /, (_m, r) => `${r[0].toUpperCase()}${r.slice(1)} `)
      .replace(/^Be (on time|there|ready|prepared|careful)\b/, "Please be $1")
      .replace(/^Great (presentation|talk|demo|session|pitch|deck|write-up|meeting|catch-up|call)( today| yesterday)?\.$/i, (_m, n, w) => `That was a great ${n.toLowerCase()}${w ?? ""}.`)
      .replace(/^Just to let you know, ([A-Z][a-z]+)'s ([\w ]+) is a game changer\.$/, "$1's $2 is excellent. Great work, $1.");
    // Praise that names someone gets a thank-you ("Marco saved the demo today. Thank you, Marco.").
    const nm = t.match(/^([A-Z][a-z]+) (saved|crushed|nailed|rescued|fixed|closed|shipped|landed|did) /);
    if (nm && !/\bthank/i.test(t) && !/^(?:The|This|That|We|They|It|There|Our|My|Your|I)$/.test(nm[1])) t = `${t} Thank you, ${nm[1]}.`;
  }
  if (lvl === 2) {
    t = t.replace(/^(?:For visibility|Heads-up|Quick heads-up|Quick flag): Unfortunately, /, "Flagging that ")
      .replace(/^Unfortunately, (?!I |I'm |we can't|we won't)/, "Flagging that ")
      .replace(/^(?:For visibility|Heads-up|Quick heads-up): I'm concerned about /, "Flagging some concern about ")
      .replace(/^(?:For visibility|Heads-up|Quick heads-up): I'm not (thrilled|happy|looking forward)/, "Candidly, I'm not $1")
      .replace(/^(I'm not (?:thrilled|happy|looking forward))/, "Candidly, $1")
      .replace(/^(?:For visibility|Heads-up|Quick heads-up): (?:my apologies|apologies|sorry)\b,?\s*/i, "Apologies ")
      .replace(/^Apologies (for|about)\b/, "Apologies $1").replace(/^Apologies (?!for|about)/, "Apologies, ")
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): you (?!could|can|should)([a-z']+) /, "Some candid feedback: I've noticed you $1 ")
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): your (.+)$/, (m, r) => (/\b(?:clear|great|good|excellent|amazing|helpful|thoughtful|awesome)\b/.test(r) && !/\b(?:not|no|too)\b|n't/.test(r) ? `Kudos, your ${r}` : `Some candid feedback: your ${r}`))
      .replace(/^(?:For visibility|Heads-up): I(?:'m| am) (burnt out|burned out|exhausted|tired|frustrated|stressed|overwhelmed)/, "Candidly, I'm $1")
      .replace(/^(?:For visibility|Heads-up): (I'd rather|I prefer|I'd prefer|I see)\b/, "My two cents: $1")
      .replace(/^(?:For visibility|Quick heads-up): great (presentation|talk|demo|session|pitch|deck|write-up)/i, "Kudos on a great $1")
      .replace(/^I really (?:value|like|love) (the .+)\.$/, "Huge kudos on $1.")
      .replace(/^Quick heads-up: ([A-Z][a-z]+'s .+ is a game changer)/, "Huge kudos: $1")
      .replace(/^When you get a chance, (could you .+ when you(?:'re| are) free\?)$/, (_m, r) => r[0].toUpperCase() + r.slice(1))
      .replace(/^Engaging\. /, "")
      .replace(/^Quick heads-up, and apologies: /, "Apologies, ")
      .replace(/^(?:Quick heads-up|Heads-up): Let's /, "Proposal: let's ")
      .replace(/^Quick question: could you /, "Quick ask: could you ")
      .replace(/^(?:Quick heads-up|Heads-up): be (on time|there|ready|prepared|careful)\b/, "Quick ask: please be $1")
      .replace(/^Heads-up: I won't be able to (log in|access|connect|see|open|find|sign in|get in)\b/, "Flagging that I'm unable to $1");
  }
  return t;
}

function levelFloor(input, clean, text, lvl, seed) {
  return postPolish(levelFloorInner(input, clean, text, lvl, seed), lvl, clean);
}

const NOT_VOCATIVE = /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Q[1-4]|Slack|Excel|Python|Postgres|AWS|SVG)$/;
const vocative = (t) => t.replace(/(^|[.!?]\s+)((?:Huge congratulations|Congratulations|Congrats|Thanks|Thank you|Happy|Great|Nice|Good|Well done|Huge kudos|Kudos|Welcome|Good luck)\b[^.!?,:\n]*?) (everyone|team|folks|[A-Z][a-z]+)([.!?])/g,
  (m, pre, body, who, end) => (NOT_VOCATIVE.test(who) ? m : `${pre}${body}, ${who}${end}`));
// Runs after the level floor on every level, so labels added there get the same cleanup.
function postPolish(text, lvl, clean) {
  let t = levelPolish(text, lvl, clean);
  // Vocative comma: "Happy work anniversary Tom!" -> "Happy work anniversary, Tom!"
  t = vocative(t);
  t = t.replace(/(^|[.!?]\s+)((?:Huge congratulations|Congratulations|Congrats|Thanks|Thank you|Happy|Great|Nice|Good|Well done|Huge kudos|Kudos|Welcome|Good luck)\b[^.!?,\n]*?) (everyone|team|folks|[A-Z][a-z]+)([.!?])/g,
    (m, pre, body, who, end) => (NOT_VOCATIVE.test(who) ? m : `${pre}${body}, ${who}${end}`))
    .replace(/\b(\d+(?:st|nd|rd|th)?) not (the )?(\d+(?:st|nd|rd|th)?)\b/g, "$1, not $2$3")
    .replace(/\bloading slow\b/g, "loading slowly")
    .replace(/\bwork remote\b/g, "work remotely")
    .replace(/, (it|this|that) should (have|be)\b/g, (_m, w, v) => `. ${w === "it" ? "It" : w[0].toUpperCase() + w.slice(1)} should ${v}`)
    .replace(/\b(Could|Would|could|would) you (?!please)([^?]+?),? please\?$/, "$1 you please $2?")
    .replace(/\bnow would like\b/g, "would now like")
    .replace(/^Just to let you know, it looks like /, "It looks like ")
    .replace(/^(?:Quick heads-up|Heads-up): it looks like /, "Flagging that ")
    .replace(/\bthe assist\b/g, "the help")
    .replace(/\b(these|those|the|a|an) not very useful\b/gi, "$1 unproductive")
    .replace(/\bis a disorganized situation\b/g, "is disorganized")
    .replace(/\b(front|help|service|reception) workspace\b/g, "$1 desk")
    .replace(/\bshifted (their|his|her|my|our|your) mind\b/g, "changed $1 mind")
    .replace(/\b(?:pick up|grab) the door\b/g, "get the door")
    .replace(/\btruly clear\b/g, "very clear")
    .replace(/\b(the (?!issue|defect|bug|feedback|ticket|concern|question|comment)[\w-]+) is addressed\b/g, "$1 is fixed")
    .replace(/\btoo (?:tied up|at capacity|swamped|slammed)\b/g, "too busy")
    .replace(/(^|[.!?]\s+)((?:Can|Could|Would|Will|Should|Is|Are|Do|Does|Did) (?:it|we|you|I|this|that|they|someone|anyone)\b[^.!?]*)\.(?=\s|$)/g, "$1$2?")
    .replace(/^When you get a chance, (could you .+\bwhen you (?:can|get a chance|have a (?:sec|second|minute|moment))\b.*)$/, (_m, r) => r[0].toUpperCase() + r.slice(1));
  if (lvl === 1) {
    t = t.replace(/^I disagree with /, "I'm not sure I agree with ")
      .replace(/^Why (is|are|was|were) (the [\w-]+|this|that|it|our [\w-]+|my [\w-]+) (.+)\?$/, "Could you help me understand why $2 $1 $3?")
      .replace(/^([A-Z][a-z]+) (paid|signed|renewed|approved|accepted) (.+)\.$/, (m, n, v, r) => (/^(?:The|This|That|We|They|It|There|Our|My|Your|I)$/.test(n) ? m : `I'm happy to share that ${n} ${v} ${r}.`))
      .replace(/^No, (I'm|we're) not ([a-z]+ing)\b/, (_m, w, v) => `No, ${w === "I'm" ? "I" : "we"} won't be ${v}`)
      .replace(/^I'll pass on (.+)$/, "Thanks, but I'll pass on $1")
      .replace(/^I'm out (next week|tomorrow|today|this (?:week|afternoon)|on [A-Z][a-z]+day|[A-Z][a-z]+day|until [A-Z]?[a-z]+)\.$/, "I'll be out of office $1.")
      .replace(/^I'd like (feedback|some feedback|input|your input|advice|your thoughts)\b/, "I'd welcome $1")
      .replace(/^Unfortunately, (that|this) (idea|plan|approach|proposal) won't work\.$/, "I don't think $1 $2 will work.")
      .replace(/^I prefer /, "I'd prefer ")
      .replace(/^I'd rather ([a-z]+) /, "I'd prefer to $1 ")
      .replace(/^(?:Nice|Great|Good) (?:work|job), (everyone|team)\.$/, "Great work, $1. Thank you.")
      .replace(/^Just to let you know, ((?:the|your|this|that) [^.]*?\b(?:looks|is|was|are) (?:really |very |so )?(?:good|great|excellent|clear|amazing|awesome|fantastic)\b[^.]*)\.$/, (m, r) => (/\b(?:not|no|too)\b|n't/.test(r) ? m : `${r[0].toUpperCase()}${r.slice(1)}. Great work.`))
      .replace(/^((?:The|Your|This|Our) [^.]*\b(?:(?:is|are|was|were|looks|look) (?:really |very |super |so )?(?:helpful|useful|clear|great|excellent|amazing|fantastic|awesome)|handled [\w' -]{1,30} (?:really |very |so )?well))\.$/, (m, r) => (/\b(?:not|too|never)\b|n't/.test(r) ? m : `${r}. Great work.`))
      .replace(/^(They|He|She) (want|wants|need|needs|asked|said|think|thinks) /, (_m, w, v) => `Just to let you know, ${w.toLowerCase()} ${v} `);
  }
  if (lvl === 2) {
    t = t.replace(/^For visibility: Understood\./, "Understood, and noted.")
      .replace(/^For visibility: no, (we're|I'm) not ([a-z]+ing)\b/, (_m, w, v) => `That's a no from ${w === "I'm" ? "me" : "us"}: ${w === "I'm" ? "I" : "we"} won't be ${v}`)
      .replace(/^For visibility: I'll pass on (.+)$/, "Thanks, but I'll have to pass on $1")
      .replace(/^Quick heads-up: ([A-Z][a-z]+ (?:paid|signed|renewed|approved|accepted) )/, "Quick win: $1")
      .replace(/^For visibility: I'd like (feedback|some feedback|input|your input|advice|your thoughts)\b/, "Quick ask: I'd love $1")
      .replace(/^For visibility: no, (the answer is (?:still )?no\b.*)$/, "That's a no from me: $1")
      .replace(/^That's a no from me, (the answer is (?:still )?no\b.*)$/, "That's a no from me: $1")
      .replace(/^(That's a no from (?:me|us)), /, "$1: ")
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): (that|this|the) (deadline|timeline|date|target|estimate) is (?:impossible|unrealistic)\.$/, "Flagging that $1 $2 isn't realistic.")
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): (this|it|that) needs more work/, "My two cents: $1 needs more work")
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): ((?:the|this|that) [^.]*?\b(?:looks|is|was) )(?:really |truly |very |so )?(good|great|excellent|clear|amazing|awesome)\b/, (_m, a, b) => `Kudos: ${a}${b === "good" ? "great" : b}`)
      .replace(/^(?:For visibility|Heads-up|Quick heads-up): (happy|congrat\w*|welcome|huge congrat\w*|sincere apologies|apologies)\b/i, (_m, w) => w[0].toUpperCase() + w.slice(1))
      .replace(/^(?:Quick heads-up|Heads-up|For visibility): that's a great question\. I'm not sure\./i, "Great question. Candidly, I'm not sure.")
      .replace(/^(?:For visibility|Heads-up|Quick heads-up): (I'd rather|I prefer|I'd prefer|I see)\b/, "My two cents: $1");
  }
  return vocative(t.replace(/^Flagging that that /, "Flagging that the "));
}

function levelFloorInner(input, clean, text, lvl, seed) {
  text = levelPolish(text, lvl, clean);
  text = text.replace(/^(That's a no from) me, (?=we\b|we're\b|we are\b|we can|we won't|our\b)/i, "$1 us: ").replace(/^(That's a no from me), (?=I\b|I'm\b)/i, "$1: ");
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 3 || /\n/.test(text) || HAS_LABEL.test(text)) return text;
  if (lvl === 1 && words < 4) return text;
  if (lvl === 1 && tokenSim(clean, text) >= 0.9 && !INTERJECTION.test(text) && !/\bby the way\b|\bplease\b/i.test(text) && !/^(?:Just|Please|Could|Would|Can|Unfortunately|Apologies|Sorry)\b/.test(text)) {
    if (/^(?:Who|What|When|Where|Which|How)\b[^.!?]*\?$/.test(text)) return `Just to check, ${lowerFirst(text, { force: true })}`;
    if (/^[^.!?]*\?/.test(text)) return text;
    const lets = text.match(/^Let's (.+)$/);
    if (lets) return `I'd suggest we ${lets[1]}`;
    // Statements stay as polished statements: "I wanted to let you know that ..." read as a padded copy.
  }
  if (lvl === 2 && /^(?:Candidly|Flagging|Apologies|Some candid|Huge kudos|Kudos|My two cents)\b/.test(text)) return text;
  if (lvl === 2) {
    const mild = toCorporateDetailed(input, { level: 1, seed }).text;
    if (tokenSim(mild, text) >= 0.9 || tokenSim(clean, text) >= 0.9) {
      // Lower the first word when the writer typed it in lower case ("great job" -> "For visibility: great job").
      const w = (text.match(/^[A-Za-z']+/) ?? [""])[0];
      const typedLower = w && new RegExp(`(?:^|[^A-Za-z'])${w.toLowerCase()}\\b`).test(String(input));
      if (/^[^.!?]+\?$/.test(text)) return `Quick question: ${lowerFirst(text, { force: true })}`;
      if (/^(?:Thank you|Thanks)\b/.test(text)) return text.replace(/^(?:Thank you|Thanks)\b,?\s*/, "Huge thanks, ");
      if (/^(?:Good|Best of) luck\b/.test(text)) return text.replace(/^(?:Good|Best of) luck\b/, "Wishing you the best of luck");
      const gw = text.match(/^Great (?:work|job), but please (.+?)\.?$/i);
      if (gw) return `Great work. Quick ask: could you ${gw[1]}?`;
      if (/^(?:Great|Nice) (?:work|job)\b/.test(text)) return text.replace(/^(?:Great|Nice) (?:work|job)\b/, "Huge kudos");
      const st = text.match(/^Sorry to (bother|interrupt|disturb) you\b/);
      if (st) return text.replace(st[0], `Apologies for ${st[1] === "bother" ? "bothering" : st[1] + "ing"} you`);
      if (/^Oh no,\s/.test(text)) return text.replace(/^Oh no,\s*/, "Unfortunately, ");
      if (/^Happy Friday\b/i.test(text)) return text.replace(/^Happy Friday,?\s*(everyone|all|team)?\b/i, (_m, w) => `Wishing ${w ? (w.toLowerCase() === "everyone" ? "everyone" : "the " + w.toLowerCase()) : "you"} a happy Friday`);
      if (/^I(?:'m| am) (?:so|really|very) /.test(text)) return `Candidly, ${text}`;
      if (/^Ah yes\b/i.test(text)) return text.replace(/^Ah yes,?\s*/i, "Love that for us: ");
      return `For visibility: ${typedLower && !/^I(?:'|$)/.test(w) ? w.toLowerCase() + text.slice(w.length) : lowerFirst(text)}`;
    }
  }
  return text;
}

export function toCorporate(input, opts = {}) {
  return toCorporateDetailed(input, opts).text;
}

// ---------- Corporate to Normal ----------

export function detectThemes(sentence) {
  const found = [];
  for (const theme of THEMES) {
    if (!theme.patterns.some((p) => p.test(sentence))) continue;
    if (theme.requiresNegative && !NEGATIVE_CUES.test(sentence) && !theme.negative?.test(sentence)) continue;
    // LinkedIn posts are about the writer, so "new chapter" in a CEO memo does not count.
    if (theme.firstPerson && !/\b(?:I|I'm|I've|I'll|I'd)\b|\b(?:my|me)\b/i.test(sentence.replace(/\bI\b(?=\.)/g, ""))) continue;
    found.push(theme.id);
  }
  // A benefit being discontinued is a benefit cut, not a product shutdown.
  if (found.includes("benefits")) return found.filter((id) => id !== "shutdown");
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
    if (fluffShare > 0.5) return ["Lots of kind words, not much news.", "A lot of words that don't say much.", "Nothing. This is a lot of words for nothing."][i];
    return ["Nothing hidden here.", "It mostly says what it says.", "Nothing to decode. Rare."][i];
  }
  return ids.slice(0, 3).map((id) => themeById[id].summary[i]).join(" ");
}

// The headline for a decode: the strongest signal, or a note that there is none.
export function pickSignal(themeIds, fluffShare = 0) {
  const ids = summaryThemes(themeIds);
  const top = ids[0];
  if (!top) {
    return fluffShare > 0.5 ? { id: "fluff", label: "All fluff", tone: "none" } : { id: "none", label: "No bad news found", tone: "none" };
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

// A decode line that only swapped a word or two just repeats the memo. Say so plainly instead.
const wordSet = (s) => new Set(String(s).toLowerCase().replace(/[\u0000\u0001]/g, "").match(/[a-z']{3,}/g) ?? []);
function echoes(original, swapped) {
  const A = wordSet(original), B = wordSet(swapped);
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return A.size > 5 && shared / (A.size + B.size - shared || 1) > 0.6;
}

// "legal said no on using the customer logo": who said no, when nothing in the message softens it.
const SOFTENERS = /\b(?:unfortunately|regret|appreciate|thank|kindly|at this time|for now|right now|not able|unable|in a position|wish|hope|grateful|sorry|apolog|explore|revisit|future)\w*/i;
export function bluntNo(text) {
  const t = String(text);
  const m = t.match(/\b(legal|finance|hr|security|procurement|compliance|the board|the client|the customer|management|leadership|the ceo|the cfo|my manager|[A-Z][a-z]+)\s+(?:said|says|just said|came back with a|gave (?:us |me )?a (?:hard |flat )?)\s*(?:no|nope|hard no|flat no)\b/i);
  if (!m || SOFTENERS.test(t) || t.length > 200) return null;
  const who = /^(?:hr|ceo|cfo)$/i.test(m[1].replace(/^the /i, "")) ? m[1].replace(/\b(hr|ceo|cfo)\b/i, (x) => x.toUpperCase()) : m[1];
  const Who = /^(?:legal|finance|security|procurement|compliance|management|leadership)$/i.test(who) ? who[0].toUpperCase() + who.slice(1).toLowerCase() : who.replace(/^the /i, "the ");
  const lead = Who[0].toUpperCase() + Who.slice(1);
  return [`It's a no from ${Who}.`, `${lead} said no. It's a flat no.`, `${lead} said no. Not a maybe, a no.`];
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
  const summaryLines = [];

  // Two or more soft layoff signals in one memo count as a layoff, even without the word.
  const hints = LAYOFF_HINTS.filter((re) => re.test(clean)).length;
  const strongLayoff = splitParagraphs(clean).flatMap(splitSentences).some((s) => detectThemes(s).some((id) => id === "layoffs" || id === "layoff-you"));
  const layoffContext = strongLayoff || hints >= 2;
  if (layoffContext && !strongLayoff) scores.set("layoffs", themeById.layoffs.weight);
  const matcher = layoffContext ? layoffDecodeMatcher : decodeMatcher;

  // A short note like "reminder: retro at 4" can look like a sign-off. If every sentence looks like one, decode them all.
  const allSkipped = splitParagraphs(clean).flatMap(splitSentences).every((s) => isGreetingOrSignature(s));
  for (const paragraph of splitParagraphs(clean)) {
    for (const sentence of splitSentences(paragraph)) {
      if (!allSkipped && isGreetingOrSignature(sentence)) continue;
      total++;
      const themes = detectThemes(sentence);
      for (const id of themes) scores.set(id, (scores.get(id) ?? 0) + themeById[id].weight);
      const { text: swapped, changed } = swapPhrases(sentence, matcher, lvl, rng, 1);
      const isFluff = FLUFF_PATTERNS.some((p) => p.test(sentence));
      let plain;
      const special = SPECIAL_LINES.find((s) => s.pattern.test(sentence) && !(s.weak && themes.length));
      if (special) {
        if (isFluff) fluff++;
        plain = ((layoffContext && special.layoffLines) || special.lines)[lvl - 1];
        const rest = special.keepRest && special.keepRest.test(sentence) ? sentence.replace(special.keepRest, "").trim() : "";
        if (rest.split(/\s+/).length >= 3) {
          let tail = capFirst(tidy(swapPhrases(rest, matcher, lvl, rng, 1).text));
          if (!endsWithPunct(tail)) tail += ".";
          plain = `${plain} ${tail}`;
        }
        if (special.asSummary === true || (special.asSummary instanceof RegExp && special.asSummary.test(sentence))) summaryLines.push(plain);
      } else if (themes.length) {
        // "Your job is being cut." already says "Some jobs are being cut.", so the weaker line goes.
        plain = summaryThemes(themes).slice(0, 2).map((id) => themeById[id].line[lvl - 1]).join(" ");
      } else if (isFluff) {
        fluff++;
        plain = pick(rng, FLUFF_LINES)[lvl - 1];
      } else if (changed > 0 && !echoes(sentence, swapped)) {
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
  // A message that is only a phrase like "per my last email, let's take this offline" is summed up by that phrase.
  let summary = summaryLines.length && summaryLines.length === total ? summaryLines.join(" ") : combineSummary(ranked, lvl, fluffShare);
  // A plain "X said no" with nothing soft around it is a blunt no, not a polite one.
  const blunt = bluntNo(clean);
  if (blunt && ranked[0] === "rejection") summary = blunt[lvl - 1];
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
