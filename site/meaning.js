import { canonicalizeCrude, hasCrude } from "./profanity.js";

// Meaning checks for Normal to corporate. Compares the input with a rewrite and lists what got lost
// or made up. Pure functions, used by the Instant engine, the AI path and the tests.

// Words that carry a "no". Contractions like won't and can't count through n't.
const NEGATOR = /\b(?:not|no|nope|nah|never|nobody|nothing|none|nowhere|neither|nor|cannot|without|zero|null|unable|lack|lacking|declin\w*|refus\w*)\b|n't\b/gi;
// Phrases where the "no" is part of an idiom and a rewrite can drop it without changing the meaning.
const NEG_IDIOMS = [
  /\bno (?:problem|worries|rush|biggie|clue|idea)\b/gi, /\b(?:don't|do not) (?:care|mind|have (?:time|the time|the bandwidth))\b/gi,
  /\bcan't wait\b/gi, /\bnot bad\b/gi, /\bnot my (?:job|problem)\b/gi, /\bnothing (?:much|new)\b/gi, /\bno one (?:knows|cares)\b/gi,
  /\b(?:i )?have no idea\b/gi, /\bno shit\b/gi, /\b(?:zero|no) (?:fucks|shits) given\b/gi, /\bdon't give a (?:fuck|shit|damn|crap)\b/gi, /\bdon't know\b/gi, /\bdoesn't matter\b/gi, /\bno big deal\b/gi,
];
// Soft versions of a no. A rewrite may not add these, because they turn a refusal into a maybe.
// Words that stretch how long or how often something happens. "all day today" is not "indefinitely".
const SCOPE = /\b(?:indefinitely|forever|permanently|for good|from now on|every day|everyday|all week|all month|always)\b/gi;
const HEDGE = /\b(?:would rather not|'d rather not|prefer not|might not|may not|probably not|maybe not|hopefully not|not likely|unlikely|not right now|not at this time|not in the near term|for now|for the time being)\b/gi;
const QUESTION = /\?+/g;
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
const NOT_NAMES = new Set(["I", "I'm", "I've", "I'll", "I'd", "OK", "Jesus", "Christ"]);
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
  const inp = canonicalizeCrude(String(input ?? ""));
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
  // "ask ops" -> "loop in ops" brings in the same people, so it is not a new meeting.
  const loopOnly = count(out, MEETING) === count(out, /\bloop(?:ing)? in\b/gi) && /\b(?:ask|tell|cc|include|check with)\b/i.test(inp);
  if (count(out, MEETING) > 0 && count(inp, MEETING) === 0 && !loopOnly) added.push("meeting");
  if (count(out, SCOPE) > count(inp, SCOPE)) added.push("scope");
  if (listLines(out) !== listLines(inp)) lost.push("list");
  if (checkNames) {
    const inNames = names(inp);
    const outText = out;
    if (inNames.some((n) => !new RegExp(`(?<![\\w])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`).test(outText))) lost.push("names");
    const inWords = new Set((inp.toLowerCase().match(/[a-z][\w'&-]*/g) ?? []).flatMap((w) => [w, w.replace(/'s$/, "")]));
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
  if (added.includes("scope")) parts.push("changed the time frame");
  if (lost.includes("list")) parts.push("broke the list");
  return parts.join(" and ");
}

// ---- Stricter checks for model rewrites (fine-tuned model and AI mode). Instant never needs these. ----

// Sentiment words. A rewrite of a complaint must not come out as praise, and praise must not come out as bad news.
const NEG_SENT = /\b(?:screw\w*|broke\w*|broken|down|garbage|trash|junk|joke|pain|fuck\w*|suck\w*|sick|ill|late|mess\w*|fail\w*|wrong|miss\w*|vague|unrealistic|bad|worse|worst|terrible|awful|horrible|crap\w*|shit\w*|bullshit|disaster|nightmare|ridiculous|annoy\w*|frustrat\w*|angry|pissed|hate|useless|slow|stuck|crash\w*|bug\w*|outage|problem\w*|issue\w*|delay\w*|behind|overdue|blocked|cancel\w*|lost|lose|losing|can't|cannot|won't|ripped|overcharg\w*|rip-?off|tank\w*|dumpster|tired|exhausted|swamped|burn\w*|quit\w*|leaving|layoff\w*|laid off|cut\w*|over budget|jammed|leak\w*|again)\b/i;
const POS_SENT = /\b(?:great|good|excellent|well|nice|love\w*|lovely|competitive|success\w*|win|wins|winning|thrill\w*|happy|pleased|proud|amazing|fantastic|awesome|best-in-class|outstanding|kudos|congrat\w*|nail\w*|delight\w*|strong|stellar|superb|brilliant|impressive|champ\w*|shout-?out|thank\w*|grateful|appreciat\w*|perfect|smooth\w*|ahead|crushed it|killed it|rock\w*|celebrat\w*|milestone|excit\w*|recogni\w*|excellence|wonderful|terrific|fair|favorable|generous)\b/i;
// "Unfortunately" style markers that frame something as bad news.
const BAD_FRAME = /\b(?:unfortunately|sadly|regrettably|concern\w*|headwind\w*|risk\w*|issue\w*|problem\w*|apolog\w*|sorry|challenge\w*|setback|gap|disappoint\w*|mishandl\w*|not ideal|pain point|friction|flag a concern)\b/i;
const NEGATED = /\b(?:not|no|never|n't|hardly|isn't|wasn't|aren't|weren't)\s+(?:\w+\s+){0,2}$/i;
function sentWords(text, re) {
  const out = [];
  const g = new RegExp(re.source, "gi");
  let m;
  while ((m = g.exec(text))) if (!NEGATED.test(text.slice(Math.max(0, m.index - 30), m.index))) out.push(m[0].toLowerCase());
  return out;
}
/**
 * Polarity flip: complaint input that comes out with new praise words, or praise input that comes out framed as bad news.
 * Sarcasm ("love that the meeting moved again") has both kinds of words in the input, so it is never judged a flip by praise.
 */
export function polarityFlip(input, output) {
  const inp = String(input), out = String(output);
  const inNeg = sentWords(inp, NEG_SENT), inPos = sentWords(inp, POS_SENT);
  const inSet = new Set(inp.toLowerCase().match(/[a-z'-]+/g) ?? []);
  const newPos = sentWords(out, POS_SENT).filter((w) => !inSet.has(w));
  const goodNews = /\b(?:fix\w*|resolv\w*|solv\w*|finally|shipped|recover\w*|back up|back online|patched|closed|done|finished|passed|hit|beat)\b/i.test(inp);
  const sarcasm = /\b(?:another|again|yet|so now|now we're|of course|oh (?:great|perfect|good|nice|wonderful)|love that|just what|thanks a lot|great,? so)\b/i.test(inp);
  if (inNeg.length && !inPos.length && !goodNews && newPos.some((w) => !/^(?:thank|appreciat|recogni|well)/.test(w))) return "praise";
  if (inPos.length && !inNeg.length && !sarcasm && !BAD_FRAME.test(inp) && BAD_FRAME.test(out)) return "bad-news";
  return "";
}

// Units next to numbers. "20 late" may become "20 minutes late" (the only reading), but never "20 miles".
const UNIT = "(?:minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|miles?|mi|km|kilometers?|meters?|feet|ft|kg|kilos?|lbs?|pounds?|grams?|percent|%|dollars?|bucks|euros?|k|thousand|million|m|gb|mb|tb|people|users|tickets|seats|times|x)";
const UNIT_RE = new RegExp(`(\\$?\\d[\\d,.]*)(?:\\s|-)?(${UNIT})\\b`, "gi");
const UNIT_SYN = [["minute", "min", "mins", "minutes"], ["hour", "hours", "hr", "hrs"], ["mile", "miles", "mi"], ["k", "thousand"], ["percent", "%"], ["dollar", "dollars", "bucks", "$"], ["pound", "pounds", "lb", "lbs"]];
const unitKey = (u) => { const l = u.toLowerCase().replace(/s$/, ""); const g = UNIT_SYN.find((s) => s.some((x) => x.replace(/s$/, "") === l)); return g ? g[0] : l; };
function unitPairs(text) {
  const out = [];
  for (const m of String(text).matchAll(UNIT_RE)) out.push(`${m[1].replace(/[$,]/g, "").replace(/\.$/, "")}|${unitKey(m[2])}`);
  if (/\$\d/.test(text)) for (const m of String(text).matchAll(/\$(\d[\d,.]*)/g)) out.push(`${m[1].replace(/,/g, "").replace(/\.$/, "")}|dollar`);
  return out;
}
export function unitChanged(input, output) {
  const a = unitPairs(input), b = unitPairs(output);
  const lostU = a.filter((p) => !b.includes(p));
  const addedU = b.filter((p) => !a.includes(p) && !(/\|minute$/.test(p) && new RegExp(`\\b${p.split("|")[0]}\\s*(?:late|behind|out|away|early)\\b`, "i").test(input)));
  return [...lostU.map((p) => `lost ${p}`), ...addedU.map((p) => `added ${p}`)];
}

// Days of the week, including short forms the main date check skips (sat, sun).
const DAY_FULL = { mon: "monday", tue: "tuesday", tues: "tuesday", wed: "wednesday", thu: "thursday", thur: "thursday", thurs: "thursday", fri: "friday", sat: "saturday", sun: "sunday" };
function days(text) {
  return (String(text).toLowerCase().match(/\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thu(?:rs?)?|fri|sat)\b/g) ?? []).map((d) => DAY_FULL[d] ?? d);
}
export function dayChanged(input, output) {
  const a = new Set(days(input)), b = new Set(days(output));
  return [...a].some((d) => !b.has(d)) || [...b].some((d) => !a.has(d));
}

// Requests have to stay requests. "move standup to 10" is not "I'll move standup to 10".
const IMPERATIVE = /^(?:(?:hey|ok|okay|so|also|and|pls|please|plz|guys|team|folks|everyone|all)[,!]?\s+)*(?:send|move|skip|quit|stop|grab|check|fix|update|review|add|remove|cancel|book|call|email|ping|schedule|push|merge|ship|submit|sign|approve|reply|respond|read|look|take|bring|get|make|put|keep|let|tell|ask|share|post|upload|delete|clean|turn|close|open|join|come|use|try|order|print|file|fill|finish|wrap|drop|loop|cc|forward|resend|restart|reboot|rerun|revert|deploy|test|confirm|double-check|stand|hold|wait|don't|dont|do not|never|someone|somebody|anyone|anybody|need someone|can someone|can somebody|can you|could you|can u|would you|will you)\b/i;
const SELF_FUTURE = /\b(?:i'll|i will|i'm going to|i am going to|i'm gonna|we'll|we will|we're going to|we're moving|we'll be|i'll be|i'm (?:moving|sending|skipping|taking|quitting|stopping))\b/i;
const ASKY = /\?|\b(?:please|could|would|can|kindly|need|needs|ask|request\w*|let's|let us|propos\w*|suggest\w*|recommend\w*|appreciate|seeking|looking for|if someone|if anyone|reminder|remember|make sure|ensure|stop|avoid|refrain|hold off|pause|must|should|encourage|invite|time to)\b/i;
export function requestBroken(input, output) {
  const sents = String(input).split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const req = sents.some((s) => IMPERATIVE.test(s) && !/^pass on\b/i.test(s));
  if (!req) return "";
  if (SELF_FUTURE.test(output) && !SELF_FUTURE.test(input)) return "became-statement";
  if (!ASKY.test(output) && !/^(?:[A-Z][^.:!?]*:\s*)?(?:send|move|skip|grab|check|fix|update|review|add|remove|cancel|book|call|email|ping|schedule|push|merge|ship|submit|sign|approve|reply|respond|read|look|take|bring|get|make|put|keep|tell|share|post|upload|delete|clean|turn|close|open|join|come|use|try|order|print|file|fill|finish|wrap|drop|loop|forward|resend|restart|reboot|rerun|revert|deploy|test|confirm|double-check|hold|wait|don't|do not)\b/i.test(output.replace(/^[^:]{0,60}:\s*/, "").trim()) ) return "lost-ask";
  // "quit doing X" must keep the stop. "Let's keep replying all" is the opposite.
  if (/\b(?:quit|stop|don't|dont|do not|no more|never)\b/i.test(input) && !/(?:\b(?:quit|stop\w*|not|no longer|no more|refrain|avoid|pause|hold off|cease|never|less|fewer|limit|minimi[sz]e|cut back)\b|n't\b)/i.test(output)) return "lost-stop";
  return "";
}
// "pass on X" is a polite no from the writer, not a request to others.
export function declineBroken(input, output) {
  if (!/^\s*(?:i'?ll\s+)?pass on\b/i.test(input)) return false;
  return /\b(?:please|could you|let's|share|go ahead)\b/i.test(output) || !/\b(?:pass|sit\b.*\bout|skip|decline|not|n't|bow out|opt out|join another|another time)\b/i.test(output);
}
