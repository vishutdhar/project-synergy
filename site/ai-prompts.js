// Prompts and parsing for AI mode. Shared by the browser worker and the Node prompt tests.
import { splitParagraphs, splitSentences, isGreetingOrSignature, normalizeInput } from "./engine.js";

export const MAX_AI_SENTENCES = 60;

export const MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";

const DECODE_TONE = {
  1: "Be polite but honest, like a kind friend explaining it.",
  2: "Be honest and plain, like a coworker who tells it straight.",
  3: "Be blunt and a little cynical, like a jaded coworker. Short and punchy.",
};

const CORPORATE_TONE = {
  1: "Make it a polite work email: reword it, don't just fix spelling. Turn orders into requests like \"Could you...\", soften opinions with \"I think\", and say sorry as \"Apologies,\". Keep it short.",
  2: "Make it sound like a middle manager: open with a label like \"Quick flag:\" or \"Heads-up:\", turn verbs into nouns, and use buzzwords like bandwidth, alignment, action items.",
  3: "Make it sound like an over-the-top CEO on LinkedIn: north star, paradigm shift, leverage, unlock value, at scale. Be ridiculous.",
};

// Sentences to decode, in order, without greetings and signatures.
export function sentencesForDecode(text) {
  return chunkForDecode(text).flat();
}

// Group sentences into small chunks (kept for callers that batch).
export function chunkForDecode(text, { maxSentences = 5, maxChars = 900 } = {}) {
  const sentences = [];
  for (const p of splitParagraphs(normalizeInput(text).trim())) {
    for (const s of splitSentences(p)) if (!isGreetingOrSignature(s)) sentences.push(s);
  }
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const s of sentences) {
    if (cur.length && (cur.length >= maxSentences || len + s.length > maxChars)) {
      chunks.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(s);
    len += s.length;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

// Few-shot pairs teach the small model the format and the attitude.
const DECODE_SHOTS = [
  ["We are realigning resources to focus on our core priorities.", "Some projects are being cut, and maybe some jobs too."],
  ["We are deeply grateful for your hard work and dedication.", "A polite thank-you. No news here."],
  ["Given current conditions, compensation adjustments will be deferred.", "No raises for now."],
];

const HINT_TEXT = {
  layoffs: "people are being laid off",
  rto: "employees must come back to the office",
  "no-raises": "there will be no raises or smaller bonuses",
  "record-year": "the company made a lot of money",
  reorg: "teams and managers are being reorganized",
  "cost-cuts": "the company is cutting costs",
  "hiring-freeze": "no new hiring, so others cover the work",
  ai: "AI will do work people used to do",
  performance: "employees are expected to work harder",
  departure: "a leader is leaving, maybe pushed out",
  benefits: "benefits are being cut",
  acquisition: "the company is merging or being bought",
  "layoff-you": "the reader is being laid off",
  pip: "the reader is on a performance improvement plan, often a step toward firing",
  shutdown: "a product, office or team is being shut down",
  outsourcing: "work is moving to an outside company or a cheaper location",
  rejection: "the answer is no",
  "stack-rank": "people are being ranked so some get low ratings on purpose",
  "budget-freeze": "spending is frozen",
  "new-chapter": "the writer left or lost their job",
  delay: "the project is late and the date moved",
  deflection: "they are avoiding the question",
};

export function hintFor(themeIds = []) {
  const parts = themeIds.map((id) => HINT_TEXT[id]).filter(Boolean);
  return parts.length ? parts.slice(0, 2).join("; ") : "";
}

// One sentence per call. Small models stay aligned this way, and long memos are just more calls.
export function buildDecodeMessages(sentence, level = 2, themeIds = []) {
  const shots = DECODE_SHOTS.flatMap(([q, a]) => [
    { role: "user", content: q },
    { role: "assistant", content: a },
  ]);
  const hint = hintFor(themeIds);
  return [
    {
      role: "system",
      content:
        "You decode corporate speak from company memos into plain English for employees. " +
        "Given one sentence, reply with one short sentence (under 20 words) saying what it really means. " +
        "Use everyday words. Name the real news (layoffs, no raises, office mandate, cuts, reorg) if the sentence hints at it. " +
        "If it is only filler, praise or feel-good talk, say that. Never repeat the corporate wording. " +
        (DECODE_TONE[level] ?? DECODE_TONE[2]),
    },
    ...shots,
    { role: "user", content: hint ? `${sentence}\n(Context: ${hint}.)` : sentence },
  ];
}

export function buildSummaryMessages(plainLines, level = 2, themeIds = []) {
  const hint = hintFor(themeIds.slice(0, 3));
  const notes = plainLines.slice(0, 12).map((l) => `- ${l}`).join("\n");
  const ask = (main, list) => (main ? `Main news: ${main}.\nNotes:\n${list}` : `Notes:\n${list}`);
  return [
    {
      role: "system",
      content:
        "You sum up what a company memo really means for employees, in one short plain sentence under 25 words. " +
        "Start with the main news if one is given. Do not thank anyone and do not praise the company. " +
        `${DECODE_TONE[level] ?? DECODE_TONE[2]} No preamble, no quotes.`,
    },
    { role: "user", content: ask("the company is cutting costs; there will be no raises or smaller bonuses", "- Spending is being cut.\n- A polite thank-you.\n- No raises this year.") },
    { role: "assistant", content: "Money is tight, so no raises this year, whatever the thank-yous say." },
    { role: "user", content: ask(hint, notes) },
  ];
}

// Words that show a summary actually mentions the top theme. Used to reject weak AI summaries.
export const THEME_KEYWORDS = {
  layoffs: /lay|laid|fir(e|ed|ing)|job|cut|let go|losing|reduc/i,
  rto: /office|remote|in person|commute|desk/i,
  "no-raises": /raise|pay|bonus|salar|compensation/i,
  "record-year": /money|profit|record|revenue|year|great/i,
  reorg: /reorg|team|manager|boss|structure|shuffl/i,
  "cost-cuts": /cut|cost|spend|budget|money|cheap/i,
  "hiring-freeze": /hir|backfill|help/i,
  ai: /\bAI\b|automat|robot|machine/i,
  performance: /work harder|perform|expect|next/i,
  departure: /leav|left|step|pushed|quit/i,
  benefits: /benefit|perk|insurance|health/i,
  acquisition: /merg|bought|acqui|buy/i,
  "layoff-you": /you|your job|laid off|fired|out\b/i,
  pip: /PIP|plan|fire|perform|review/i,
  shutdown: /shut|clos|dead|end|kill|plug|gone/i,
  outsourcing: /outsourc|cheap|vendor|outside|contract|offshore|elsewhere/i,
  rejection: /\bno\b|reject|not|won't|turned down|declin/i,
  "stack-rank": /rank|rat|curve|bottom|fire|low/i,
  "budget-freeze": /budget|spend|money|freez/i,
  "new-chapter": /job|left|leav|laid off|quit|new/i,
  delay: /late|delay|slip|moved|push|date/i,
  deflection: /answer|dodg|avoid|nothing|know|vague/i,
};

export function summaryCoversThemes(summary, themeIds = []) {
  if (!summary) return false;
  if (!themeIds.length) return true;
  const re = THEME_KEYWORDS[themeIds[0]];
  return re ? re.test(summary) : true;
}

// Few-shot pairs. Topics differ from the app's examples so the model can't just copy an answer.
// Answers keep the facts and add no new plans, meetings or promises.
// The last pair shows a sweary message turned into wording you could say at work.
const CORPORATE_SHOTS = {
  1: [["I can't come to lunch, I'm busy.", "I'm a bit tied up, so I can't make lunch."],
      ["The printer is broken again.", "Heads up, the printer is out of order again."],
      ["I don't like the new logo.", "I have a few concerns about the new logo."],
      ["This damn spreadsheet is a shitshow, I'm not fixing it again.", "This spreadsheet is a real mess, and I'm not fixing it again."],
      ["send me the deck by friday", "Could you send me the deck by Friday?"]],
  2: [["I can't come to lunch, I'm busy.", "I don't have the bandwidth for lunch, so I can't make it."],
      ["The printer is broken again.", "Flagging that our print capability is down again."],
      ["I don't like the new logo.", "I have some concerns about the new logo direction."],
      ["This damn spreadsheet is a shitshow, I'm not fixing it again.", "This spreadsheet has some serious quality gaps, and I'm not able to fix it again."],
      ["send me the deck by friday", "Quick ask: could you please send me the deck by Friday?"]],
  3: [["I can't come to lunch, I'm busy.", "Due to unprecedented demand on my bandwidth, I'm unable to join the nourishment alignment initiative."],
      ["The printer is broken again.", "Our document output infrastructure is once again in a strategic pause."],
      ["I don't like the new logo.", "I'm not yet bought in on the new brand identity's ability to unlock value at scale."],
      ["This damn spreadsheet is a shitshow, I'm not fixing it again.", "This spreadsheet is a value-negative asset, and I'm not in a position to own another remediation cycle."],
      ["send me the deck by friday", "As a top priority, could you kindly surface the deck to me by Friday?"]],
};
export const CORPORATE_EXAMPLE_ANSWERS = Object.values(CORPORATE_SHOTS).flat().map(([, a]) => a);

export function buildCorporateMessages(text, level = 2) {
  const lvl = CORPORATE_SHOTS[level] ? level : 2;
  const wrap = (t) => `Rewrite in corporate speak:\n${t}`;
  return [
    {
      role: "system",
      content:
        "You rewrite plain messages into corporate speak as a joke. Keep the same meaning and the same speaker. " +
        `${CORPORATE_TONE[lvl]} ` +
        "Do not add plans, meetings, promises, people or facts that are not in the message. " +
        "Keep every no and not as a clear no, keep questions as questions, and keep all numbers, names and dates exactly. " +
        "The reply must be professional and safe for work: no swearing, slurs, insults or crude words, even if the message has them. " +
        "Turn rude wording into polite workplace wording that keeps the point. " +
        "Reply with only the rewritten message, no quotes and no explanation.",
    },
    ...CORPORATE_SHOTS[lvl].flatMap(([q, a]) => [
      { role: "user", content: wrap(q) },
      { role: "assistant", content: a },
    ]),
    { role: "user", content: wrap(text) },
  ];
}

// Strip quotes, preambles and fancy punctuation from model output.
export function cleanModelText(text) {
  return normalizeInput(String(text ?? ""))
    .replace(/^\s*(?:sure|certainly|of course|here(?:'s| is)[^:\n]*)[:!.,]\s*/i, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\*\*/g, "")
    .trim();
}

// Parse "1. ..." lines. Returns an array of length n with null where a line is missing.
export function parseNumbered(text, n) {
  const out = new Array(n).fill(null);
  for (const raw of cleanModelText(text).split("\n")) {
    const m = raw.match(/^\s*(\d{1,2})[.):]\s*(.+)$/);
    if (!m) continue;
    const idx = Number(m[1]) - 1;
    if (idx >= 0 && idx < n && !out[idx]) {
      let line = cleanModelText(m[2]).replace(/^(?:translation|meaning|plain)\s*:\s*/i, "");
      if (line && !/[.!?]$/.test(line)) line += ".";
      out[idx] = line || null;
    }
  }
  return out;
}

// First sentence-ish line of a model reply, cleaned up.
export function firstLine(text) {
  // Skip preamble lines like "Here's the short sentence:".
  let line = cleanModelText(text).split("\n").map((l) => l.trim()).find((l) => l && !/:$/.test(l)) ?? "";
  line = line.replace(/^\d{1,2}[.)]\s*/, "").replace(/^(?:translation|meaning|plain english|plain)\s*:\s*/i, "");
  if (line && !/[.!?]$/.test(line)) line += ".";
  return line;
}

// Retrieval few-shot: the hand-written examples closest to the input replace the fixed ones.
// Similarity is word overlap (Jaccard on lowercased word sets), cheap enough to run in the browser.
// pool entries are [input, mild, middle, csuite] or { id, input, ideal }.
const wordSet = (s) => new Set(String(s).toLowerCase().match(/[a-z']+/g) ?? []);
const poolWords = new WeakMap();
export function nearestExamples(text, pool, { level = 2, k = 4, exclude = "" } = {}) {
  const w = wordSet(text);
  const scored = [];
  for (const e of pool) {
    const input = Array.isArray(e) ? e[0] : e.input;
    if ((!Array.isArray(e) && e.id === exclude) || input.includes("\n")) continue;
    let ew = poolWords.get(e);
    if (!ew) { ew = wordSet(input); poolWords.set(e, ew); }
    let inter = 0;
    for (const x of w) if (ew.has(x)) inter++;
    scored.push([inter / (w.size + ew.size - inter || 1), e]);
  }
  // Closest example goes last, right before the real input.
  return scored.sort((a, b) => b[0] - a[0]).slice(0, k).reverse()
    .map(([, e]) => (Array.isArray(e) ? [e[0], e[level]] : [e.input, e.ideal[level - 1]]));
}

// The system prompt and the crude-wording example stay. The other fixed examples become the nearest ones.
export function buildRetrievalCorporateMessages(text, level, pool, { k = 4, exclude = "" } = {}) {
  const base = buildCorporateMessages(text, level);
  if (!pool?.length) return base;
  const wrap = (t) => `Rewrite in corporate speak:\n${t}`;
  const shots = nearestExamples(text, pool, { level: CORPORATE_SHOTS[level] ? level : 2, k, exclude });
  return [base[0], ...shots.flatMap(([q, a]) => [{ role: "user", content: wrap(q) }, { role: "assistant", content: a }]), ...base.slice(-3, -1), base.at(-1)];
}
