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
  1: "Make it mildly professional, like a polite work email. Keep it short.",
  2: "Make it sound like a middle manager: buzzwords like circle back, bandwidth, alignment, synergy, action items.",
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
};

export function summaryCoversThemes(summary, themeIds = []) {
  if (!summary) return false;
  if (!themeIds.length) return true;
  const re = THEME_KEYWORDS[themeIds[0]];
  return re ? re.test(summary) : true;
}

const CORPORATE_SHOTS = {
  1: [["I can't come to the meeting, I'm swamped.", "I'm a bit swamped today, so I won't be able to make the meeting. Apologies!"],
      ["This idea is bad.", "I have a few concerns about this idea."]],
  2: [["I can't come to the meeting, I'm swamped.", "I don't have the bandwidth for today's sync. Can we circle back offline?"],
      ["This idea is bad.", "I'm not sure this initiative is aligned with our priorities. Let's take it offline."]],
  3: [["I can't come to the meeting, I'm swamped.", "Due to exponential demand on my bandwidth, I'll be unable to join today's alignment session, but I remain fully bought in on the outcomes."],
      ["This idea is bad.", "While I love the energy, this initiative isn't yet aligned with our north star, so let's pivot and unlock more value at scale."]],
};

export function buildCorporateMessages(text, level = 2) {
  const lvl = CORPORATE_SHOTS[level] ? level : 2;
  const wrap = (t) => `Rewrite in corporate speak:\n${t}`;
  return [
    {
      role: "system",
      content:
        "You rewrite plain messages into corporate speak as a joke. Keep the same meaning and the same speaker. " +
        `${CORPORATE_TONE[lvl]} ` +
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
  let line = cleanModelText(text).split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  line = line.replace(/^\d{1,2}[.)]\s*/, "").replace(/^(?:translation|meaning|plain english|plain)\s*:\s*/i, "");
  if (line && !/[.!?]$/.test(line)) line += ".";
  return line;
}
