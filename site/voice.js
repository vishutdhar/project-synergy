// Level voice for Mild and Middle Manager (round 6).
// The engine's Mild and Middle Manager output used to read as the user's sentence with a tidy label
// ("Quick heads-up: X"). Real workplace writing at these levels has a recognizable voice:
//   Mild: a polished professional email. Varied soft lead-ins, a "Thank you" on direct asks.
//   Middle Manager: manager-speak. Visibility labels, "on the radar", "looping you in", light buzzwords
//   in the sentence ("currently down", "resolved", "EOD"), and a sign-off that fits what was said.
// Everything here only reframes. No rule adds a fact, a person, a date, a meeting or a promise, and the
// engine runs the meaning check on the result and keeps the plain version if it fails.

import { isKnownName } from "./prepass.js";

const pick = (rng, xs) => xs[Math.floor(rng() * xs.length)];
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
// Lower the first word after a new lead-in, unless it is "I", an acronym or a name the writer capitalized.
function low(s, raw) {
  const w = (s.match(/^[A-Za-z][\w'-]*/) ?? [""])[0];
  if (!w || /^I(?:'|$)/.test(w) || /^[A-Z0-9]{2,}/.test(w)) return s;
  const base = w.replace(/'s$/, "");
  if (isKnownName(base)) return s;
  // "Maria and Jun are out": a capitalized word followed by "and <Capitalized>" is a list of names.
  if (/^[A-Z][a-z]+ and [A-Z][a-z]+\b/.test(s)) return s;
  if (/^(?:The|A|An|This|That|These|Those|My|Our|Your|Their|His|Her|We|We're|We've|We'll|They|They're|It|It's|There|There's|Nobody|No|Everyone|Someone|Support|Sales|Marketing|Finance|Legal|Engineering|Churn|Invoices|Inventory|Payroll|Standup|Retro|Ci|Q[1-4])$/.test(base)) return w.toLowerCase() + s.slice(w.length);
  if (new RegExp(`(?<![A-Za-z])${base}(?![a-z])`).test(raw)) return s; // the writer capitalized it: a name
  if (/^[A-Z][a-z]+$/.test(base) && !new RegExp(`(?<![A-Za-z])${base.toLowerCase()}(?![a-z])`).test(raw)) return s; // capitalized by the engine as a name
  return w.toLowerCase() + s.slice(w.length);
}

const L1_FRAME = /^(?:Just to let you know,|Just so you know,)\s+/;
const L2_FRAME = /^(?:Quick heads-up|Heads-up|For visibility|Quick flag|Quick win|Quick question|Quick ask|My two cents):\s+|^Flagging that\s+/;
// A body that can take a new lead-in: it starts with a subject, not a label, an interjection or an instruction.
const SUBJECT_START = /^(?:The|This|That|These|Those|Our|My|Your|Their|His|Her|We|We're|We've|We'll|I|I've|I'm|I'll|It|It's|Its|There|There's|Nobody|No one|Everyone|Someone|Q[1-4]|[A-Z][A-Za-z]+(?:'s)? (?:is|are|was|were|has|have|had|went|got|keeps|moved|starts|said|wants|needs|finished|shipped|signed|doubled|went|will|can't|won't|isn't|aren't|didn't|hasn't)|[A-Z][a-z]+ (?:[a-z]+ ){1,3}(?:is|are|was|were|has|have|had|went|got|keeps|moved|doubled|went up|went down|dropped|passed|takes|ran|will))\b/;
const FEELING = /^(?:I'm|I am|I feel|I'm feeling) (?:so |really |very |a bit |pretty |quite |extremely )?(?:annoyed|frustrated|upset|irritated|disappointed|angry|tired|exhausted|stressed|overwhelmed|worried|concerned|nervous|excited|thrilled|happy|glad|sad|bored)\b/;
const PROBLEM = /\b(?:broke|broken|down|failing|failed|fails|wrong|bug|bugs|error|errors|crash\w*|outage|blocked|stuck|missing|lost|late|behind|delayed|overdue|over budget|ran out|out of (?:ink|paper|stock|space|toner|coffee|budget)|leak\w*|jam\w*|not working|isn't working|doesn't work|won't work|can't|cannot|unable|no longer|incorrect|mistake|problem|issue|issues|risk|expired|red|slow|slowly|latency|headwind|worse|off by|rough|nobody|no one|hasn't|haven't|didn't|won't|not hit|threatening|annoyed|frustrated|cancel+ed|full by|too slow|too long|ran \d+ \w+ over|closed|rejected|expires?|quit|leaving|raising prices)\b/i;
const WIN = /\b(?:shipped|launched|finished|completed|wrapped up|closed (?:the|a|an|our) (?:[\w-]+ )?(?:deal|round|sale|contract|account)|signed|won|passed \d|hit \d|record|approved|resolved|fixed|went live|live now|is live|landed|exceeded|ahead of)\b/i;
const PERSONAL = /\b(?:sick|flu|ill|unwell|out of office|ooo|working remotely|working from home|wfh|mental health|burnt out|burned out|dentist|doctor|appointment|day off|pto|vacation|out today|out tomorrow|out the week|out next week|my kid|my son|my daughter|family|personal)\b/i;
const OPINION = /^(?:I think|I believe|I don't think|I don't believe|I'm not sure|I'd suggest|My recommendation|I'd recommend|I feel|In my view)\b/;

function intentOf(t, l1, l2) {
  if (/\n/.test(t)) return "skip";
  if (/\b(?:hilarious|funny|lol|haha|joke|kidding)\b/i.test(t)) return "skip";
  // Social lines and offers are not status reports: "Wishing everyone a happy Friday", "I'd be glad to help".
  if (/^(?:Wishing|Happy|Welcome|Congrat|Good luck|Hope|Have a|Enjoy|Cheers|Hi|Hey|Hello|Good morning|See you|Sounds good|Got it|Understood|Noted|Will do|On it|Sure|Absolutely|Of course|Yes|No problem|OK|Okay)\b/i.test(t)) return "skip";
  if (/^I(?:'d| would) (?:be (?:glad|happy|delighted)|love|like|prefer|rather)\b|^I(?:'ll| will| can) (?!not\b|be out|be offline|be away|be taking)/.test(t)) return "skip";
  if (FEELING.test(t) || /\b(?:frustrating|annoying|bothering|driving) me\b|\bI (?:hate|love|can't stand)\b/.test(t)) return "feeling";
  if (/^(?:Could|Would|Can|Will) (?:you|someone|anyone|we|I)\b[^?]*\?$|^(?:Is there an opportunity|If you could|When you get a chance|Please)\b/.test(t)) return "request";
  if (/\?\s*$/.test(t)) return "question";
  if (/^(?:Apologies|Sincere apologies|I apologize|Sorry|My apologies)\b/.test(t)) return "apology";
  if (/^(?:Thank you|Thanks|Huge thanks|Huge thank you|Big thanks|Special thanks|Really appreciate|A big thank|A huge thank|Many thanks|Appreciate|Shout-?out|A shout-?out|Props)\b/i.test(t)) return "thanks";
  if (/^(?:Kudos|Huge kudos|Great work|Great job|Outstanding|Excellent work|Nice work|Well done|Congrat)/.test(t) || /\b(?:did a great job|knocked it out of the park|was (?:great|excellent|outstanding|awesome|fantastic)|did great)\b/.test(t)) return "praise";
  if (/^(?:I|We) (?:won't|will not|can't|cannot|am unable|'m unable|'m not able|'ll have to pass|'ll pass)\b|^(?:I'm|We're) (?:unable|not able|not going)\b|^(?:Unfortunately, )?(?:I'm|I) (?:unable|won't|can't)|^That's a no\b|^No,|^I'm (?:going to have to|afraid I) (?:say no|pass|decline)|\bhave to (?:say no|pass|decline)\b/.test(t)) return /^We\b/.test(t) && /\b(?:hit|make|meet|deliver|ship)\b/.test(t) ? "problem" : "decline";
  if (PERSONAL.test(t)) return "personal";
  if (OPINION.test(t) || /^My two cents:/.test(l2) || /^(?:Some candid feedback|I noticed that)\b/.test(t)) return "opinion";
  if (/^(?:Let's|I'd suggest|My recommendation)\b/.test(t)) return "suggest";
  if (/^(?:I'm happy to share|Quick win:)/.test(l1 + " " + l2) || (WIN.test(t) && !PROBLEM.test(t))) return "win";
  if (PROBLEM.test(t) || /^(?:Unfortunately|Flagging that)/.test(l1 + " " + l2)) return "problem";
  return "status";
}

// Middle Manager word upgrades inside the sentence. Each keeps its grammatical slot and its meaning.
const L2_UPGRADES = [
  [/\b(?:nobody|no one) (?:has )?(?:fixed|addressed|resolved) (it|this|that)\b/g, "$1 still hasn't been resolved"],
  [/\b(is|are) (broken|down)\b(?! (?:to|by|from)\b)/g, "$1 currently $2"],
  [/\b(isn't|aren't) working\b/g, "$1 working as expected"],
  [/\bdoesn't work\b/g, "isn't working as expected"],
  [/\b(?:fixed|addressed)\b(?= (?:the|it|this|that|a|an|our|my)\b)/g, "resolved"],
  [/\btakes forever\b/g, "takes much longer than it should"],
  [/\bby (?:eod|end of day|end of the day)\b/gi, "by EOD"],
  [/\bas soon as possible\b/g, "as a priority"],
  [/\bhas gotten worse\b/g, "has been trending down"],
];

const L1_POOLS = {
  status: ["Just a quick update: ", "Just so you know, ", "Just to let you know, ", "Quick update: "],
  problem: ["Just a heads-up that ", "I wanted to flag that ", "Just to let you know, "],
  win: ["Happy to share that ", "Good news: ", "I'm happy to share that "],
};
const L2_POOLS = {
  status: ["Quick status update: ", "Looping you in: ", "For visibility: ", "Sharing for awareness: "],
  problem: ["Flagging for visibility: ", "Raising a flag: ", "Quick heads-up for awareness: ", "Looping you in: "],
  win: ["Quick win to share: ", "Good news on this front: ", "Sharing a quick win: "],
  personal: ["Quick heads-up: ", "Heads-up for the team: ", "For visibility: "],
  opinion: ["My two cents: ", "Sharing a quick perspective: ", "Putting this out there: "],
  question: ["Quick question: ", "Quick one for the group: "],
};
export const L2_CLOSERS = {
  status: ["Just keeping everyone in the loop.", "Sharing for visibility.", "Wanted to keep this on everyone's radar."],
  problem: ["Wanted to make sure this is on everyone's radar.", "Flagging so it stays on the radar.", "Raising it for visibility."],
  win: ["Great momentum.", "Nice progress here.", "Love to see it."],
  opinion: ["Open to other perspectives.", "Happy to discuss.", "Curious what others think."],
  suggest: ["Open to other ideas.", "Happy to discuss."],
  question: [],
  request: ["Appreciate it.", "Appreciate the help.", "Thanks in advance."],
  decline: ["Appreciate the understanding.", "Thanks for understanding."],
  apology: ["Owning this one.", "That's on me."],
  thanks: ["Really appreciate it.", "Much appreciated."],
  praise: ["Well deserved.", "Great to see."],
  personal: [],
  feeling: [],
};

/**
 * Apply the level voice. t is the engine's text at that level; l1/l2 are the frames it chose.
 * Returns the new text (the caller checks meaning and keeps t if the check fails).
 */
export function applyVoice(t, lvl, { raw = "", rng = Math.random } = {}) {
  if (lvl !== 1 && lvl !== 2) return t;
  if (!t || /\n/.test(t) || t.split(/\s+/).length > 40) return t;
  const sentences = t.split(/(?<=[.!?])\s+(?=[A-Z])/).length;
  const l1 = (t.match(L1_FRAME) ?? [""])[0];
  const l2 = (t.match(L2_FRAME) ?? [""])[0];
  const frame = lvl === 1 ? l1 : l2;
  let body = frame ? cap(t.slice(frame.length)) : t;
  const intent = intentOf(body, l1, l2);
  if (intent === "skip") return t;
  // Thanks and praise never sit behind a status label ("Quick heads-up: huge thanks to Dmitri").
  if ((intent === "thanks" || intent === "praise") && frame && !/^(?:Kudos|Quick win)/.test(frame)) {
    if (lvl === 1) return body;
    const c = pick(rng, L2_CLOSERS[intent]);
    return /\b(?:thank|thanks|appreciate)\b/i.test(body) && /\b(?:thank|appreciate)/i.test(c) ? `${body} Great work.` : `${body} ${c}`;
  }
  if (lvl === 1) {
    // Mild: vary the soft lead-in, and thank people on a direct ask.
    const pool = L1_POOLS[intent];
    // Good news gets "Happy to share" only when it clearly is good news.
    if (frame && pool && !(intent === "win" && PROBLEM.test(body))) return pick(rng, pool) + low(body, raw);
    if (intent === "request" && sentences === 1 && /\?$/.test(t) && !/\b(?:thank|thanks|appreciate)\b/i.test(t)) return `${t} Thanks!`;
    return t;
  }
  // Middle Manager.
  for (const [re, rep] of L2_UPGRADES) body = body.replace(re, rep);
  const pool = L2_POOLS[intent];
  let out;
  // "Flagging that" already reads as manager-speak, so it stays; the flat labels get varied.
  const canLead = SUBJECT_START.test(body) && !/^(?:That's|That is|It's|It is|This is|There's) /.test(body) && !/^(?:Quick ask|Kudos|Flagging that|My two cents)/.test(frame);
  const aboutMe0 = /^(?:Unfortunately, )?(?:I|I'm|I've|I'll|I'd|My)\b/.test(body);
  const tail = frame ? t.slice(frame.length) : t;
  if (pool && frame && canLead && !(aboutMe0 && /^(?:status|problem)$/.test(intent)) && !(intent === "question" && sentences > 1)) {
    const lead = (/^(?:Quick question|Quick ask)/.test(frame) && intent === "question") || /^Quick win:/.test(frame) && rng() < 0.3 ? frame : pick(rng, pool);
    out = lead + low(body, raw);
  } else out = frame ? frame + tail : body;
  // A sign-off never repeats a word from the lead-in ("Raising a flag: ... Raising it for visibility.").
  const KEY = /\b(?:radar|visibility|loop\w*|raising|flag\w*|sharing|awareness|heads-up|update)\b/gi;
  const usedKeys = new Set((out.match(KEY) ?? []).map((w) => w.toLowerCase().replace(/^(loop|flag)\w*/, "$1")));
  // Things about the writer ("I left my badge at home", "I'm running late") get no sign-off,
  // and an apology only gets one when it owns a real mistake.
  const aboutMe = /^(?:Unfortunately, )?(?:I|I'm|I've|I'll|I'd|My)\b/.test(body) && /^(?:status|problem|win)$/.test(intent);
  const smallSorry = intent === "apology" && !/\b(?:broke|forgot|missed|sent the wrong|deleted|lost|mistake|error|wrong file|wrong version|neglected|dropped the ball)\b/i.test(body);
  const noLead = /^(?:status|problem|win)$/.test(intent) && (!canLead || !frame);
  const askNoQ = intent === "request" && !/\?$/.test(body);
  const softNo = intent === "decline" && (/^That's a no\b/.test(out) || !/\b(?:won't|will not|can't|cannot|unable|not able)\b/.test(body));
  const excuse = intent === "apology" && sentences > 1;
  const feedback = intent === "opinion" && !OPINION.test(body) && !/^My two cents/.test(frame);
  const closers = aboutMe || smallSorry || noLead || askNoQ || softNo || excuse || feedback ? [] : (L2_CLOSERS[intent] ?? []).filter((c) => !(c.match(KEY) ?? []).some((w) => usedKeys.has(w.toLowerCase().replace(/^(loop|flag)\w*/, "$1"))));
  if (closers.length && sentences <= 3 && !/\b(?:thank|thanks|appreciate)\b/i.test(out) || closers.length && !/^(?:request|question|thanks)$/.test(intent) && sentences <= 3) {
    const c = pick(rng, closers);
    if (!/\b(?:thank|thanks|appreciate)\b/i.test(c) || !/\b(?:thank|thanks|appreciate)\b/i.test(out)) out = `${out} ${c}`;
  }
  return out;
}
