// Faithfulness check for AI replies to crude input. A small model can turn "nothing was done in that
// meeting" into something that sounds fine and means something else. For crude input we only accept a
// reply that keeps every content word of the work-safe version and adds almost nothing new.
// Words the Instant engine itself would use for this input count as kept, so "meeting" can become "sync".
import { softenCrude, toCorporateDetailed, mayBeCrude, normalizeInput, normalizeCasual } from "./engine.js";
import { hasCrude, lostIdioms } from "./profanity.js";
import { checkMeaning, polarityFlip, unitChanged, dayChanged, requestBroken, declineBroken } from "./meaning.js";

const STOP = new Set(("a an the and or but so if then than that this these those it its it's is are was were be been being am " +
  "i i'm i've i'll i'd me my we we're we've we'll our us you you're your he he's him his she she's her they they're them their " +
  "to of in on at for from by with about as into over up out off just really very also too all any some no not n't don't " +
  "do does did done can can't could would should will won't let's let there here what who which when where why how " +
  "have has had get got go going went like one more most much many such own same other now today still yet again ever even " +
  "thanks thank cheers hi hey hello please appreciate team folks " +
  "honestly actually basically literally frankly").split(" "));
const SYN = [
  ["done", "did", "accomplished", "achieved", "completed", "finished", "delivered", "actioned", "progress", "made"],
  ["meeting", "sync", "call", "catch-up", "session"],
  ["launch", "rollout", "release", "go-live", "ship", "deliver", "deploy"],
  ["nothing", "zero", "none", "anything"],
  ["trouble", "problem", "problems", "risk", "headwinds", "jeopardy"],
  ["care", "cares", "caring", "prioritizing", "priority", "matters", "interested"],
  ["hard", "effort", "intense", "maximum"],
  ["complaining", "complain", "complaints", "concerns", "griping"],
  ["failed", "fail", "broke", "crashed", "disaster", "down"],
  ["mess", "mistake", "error", "ball", "slip", "botch", "ruin"],
];
const words = (s) => (String(s).toLowerCase().match(/[a-z][a-z'-]*/g) ?? []).map((w) => w.replace(/'s$/, ""));
const content = (s) => words(s).filter((w) => w.length > 2 && !STOP.has(w) && !/n't$/.test(w));
const stem = (w) => w.replace(/-/g, "").slice(0, 5);
const group = (w) => SYN.findIndex((g) => g.some((x) => stem(x) === stem(w)));

export function faithfulToCrude(input, reply, { level = 2 } = {}) {
  const soft = softenCrude(input);
  const instant = [];
  for (const lvl of [1, 2, 3]) for (const seed of [1, 2, 3, 4]) instant.push(toCorporateDetailed(input, { level: lvl, seed }).text);
  const outStems = new Set(content(reply).map(stem));
  const outGroups = new Set(content(reply).map(group).filter((g) => g >= 0));
  const need = [...new Set(content(soft))];
  const missing = need.filter((w) => !outStems.has(stem(w)) && !(group(w) >= 0 && outGroups.has(group(w))));
  const allowed = new Set([...need, ...instant.flatMap(content)].map(stem));
  const allowedGroups = new Set([...need, ...instant.flatMap(content)].map(group).filter((g) => g >= 0));
  const novel = [...new Set(content(reply))].filter((w) => !allowed.has(stem(w)) && !(group(w) >= 0 && allowedGroups.has(group(w))));
  const ok = missing.length === 0 && novel.length <= (level === 3 ? 2 : 0);
  return { ok, missing, novel };
}

// Only crude input needs this strict check. Casual shorthand ("idk", "omw") is cleaned up before the model
// sees it, and that cleanup alone should not hold the reply to the crude-input standard.
export const needsFaithCheck = (input) => hasCrude(input) || mayBeCrude(normalizeInput(input));

// Meaning drift check for every AI reply, not only crude ones. Small models swap the point of a message
// ("i can't make the meeting, i'm swamped" became "I'm not fully aligned"). The reply has to keep most
// content words of the input (or a word the Instant engine would use for them), keep a no as a no,
// and add only a few new content words.
const NEG = /\b(?:no|not|never|nothing|nobody|none|cannot|unable|without|nor)\b|n't\b/i;
export function driftCheck(input, reply, { level = 2 } = {}) {
  const soft = softenCrude(input);
  const instant = [];
  for (const lvl of [1, 2, 3]) for (const seed of [1, 2]) instant.push(toCorporateDetailed(input, { level: lvl, seed }).text);
  const need = [...new Set(content(soft))];
  const outStems = new Set(content(reply).map(stem));
  const outGroups = new Set(content(reply).map(group).filter((g) => g >= 0));
  const instStems = new Set(instant.flatMap(content).map(stem));
  const missing = need.filter((w) => !outStems.has(stem(w)) && !(group(w) >= 0 && outGroups.has(group(w))));
  const allowed = new Set([...need.map(stem), ...instStems]);
  const novel = [...new Set(content(reply))].filter((w) => !allowed.has(stem(w)) && !(group(w) >= 0 && outGroups.has(group(w)) && need.some((n) => group(n) === group(w))));
  const negFlip = NEG.test(soft) !== NEG.test(reply);
  const maxMissing = Math.floor(need.length * DRIFT.missing);
  const ok = !negFlip && missing.length <= maxMissing && novel.length <= DRIFT.novel[level - 1];
  return { ok, missing, novel, negFlip };
}
export const DRIFT = { missing: 0.2, novel: [0, 0, 1] };

// Every check an AI rewrite has to pass before the page shows it. Shared by the page, the Node harness and the grader.
// Meaning is checked against the input with texting shorthand spelled out, so "tonite" matches "tonight".
const FLAT_L3 = 0.75;
function sameWords(a, b) {
  const wa = new Set(String(a).toLowerCase().match(/[a-z0-9']+/g) ?? []);
  const wb = new Set(String(b).toLowerCase().match(/[a-z0-9']+/g) ?? []);
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter || 1);
}

// True when a reply is close to word for word the input (texting shorthand spelled out).
export const isFlat = (input, reply) => sameWords(normalizeCasual(normalizeInput(input)) || input, reply) >= FLAT_L3;

const RUDE = /\bshut up\b|\bgo to hell\b|\bscrew (?:you|this|that|off)\b|\b(?:idiot|moron|stupid|dumb|loser|pathetic|useless)\b|\bget lost\b|\bbite me\b/i;

export function aiCorporateGate(input, reply, { level = 2 } = {}) {
  if (!reply) return { ok: false, reason: "empty", check: null };
  if (hasCrude(reply)) return { ok: false, reason: "crude", check: null };
  const basis = normalizeCasual(normalizeInput(input)) || input;
  const check = checkMeaning(basis, reply);
  if (!check.ok) return { ok: false, reason: "meaning", check };
  // Round 5: the stricter meaning checks built for the fine-tuned model apply to AI mode too.
  if (polarityFlip(basis, reply)) return { ok: false, reason: "polarity", check };
  // Round 9: "Who cares about X?" can't come back as "Why do you care about X?".
  const wh = basis.trim().match(/^(who|what|when|where|why|how|which)\b/i)?.[1]?.toLowerCase();
  if (wh && !new RegExp(`\\b${wh}\\b`, "i").test(reply)) return { ok: false, reason: "meaning", check: { ...check, ok: false, lost: [...(check.lost ?? []), "question"] } };
  if (unitChanged(basis, reply).length || dayChanged(basis, reply)) return { ok: false, reason: "meaning", check };
  if (requestBroken(basis, reply) || declineBroken(basis, reply)) return { ok: false, reason: "request", check };
  if (lostIdioms(input, reply).length > 0 || (needsFaithCheck(input) && !faithfulToCrude(input, reply, { level }).ok)) return { ok: false, reason: "idiom", check };
  if (!driftCheck(input, reply, { level }).ok) return { ok: false, reason: "drift", check };
  // Full C-Suite has to sound like it. A reply that is the input with a comma moved loses to Instant.
  if (level === 3 && isFlat(input, reply)) return { ok: false, reason: "flat", check };
  // Middle Manager that is the input word for word ("Oh great, another reorg.") did no work. Instant rewrites it.
  if (level === 2 && sameWords(basis, reply) >= 0.999) return { ok: false, reason: "flat", check };
  // Rude but not crude: "Shut up about synergy" is not something to send at work.
  if (RUDE.test(reply)) return { ok: false, reason: "rude", check };
  // Round 13: "you saved my butt" can't come back as "Your butt was saved", and slang body words aren't work-safe.
  if (/\b(?:butt|butts|arse|booty|tush)\b/i.test(reply)) return { ok: false, reason: "rude", check };
  // Round 13: a statement can't come back as a question or a request ("quote approved by procurement" -> "Could you please approve the quote?").
  const asks = (t) => /\?\s*$/.test(t.trim()) || /^(?:please|could you|can you|would you|kindly|can someone|could someone|would someone)\b/i.test(t.trim());
  const inAsks = asks(basis) || /^(?:hey,? )?(?:can|could|would|will|is|are|do|does|did|who|what|when|where|why|how|which|any|anyone|should|shall|may|mind|wanna|want)\b/i.test(basis.trim()) || /\b(?:pls|plz|please|can you|could you|lmk|let me know)\b/i.test(basis);
  if (!inAsks && asks(reply.replace(/^[^:]{0,40}:\s*/, ""))) return { ok: false, reason: "meaning", check: { ...check, ok: false, lost: [...(check.lost ?? []), "statement"] } };
  // Mild that only fixes spelling ("I'm going to be late sorry.") is a tidy copy, not a rewrite. Instant does it.
  if (level === 1 && sameWords(basis, reply) >= 0.999) return { ok: false, reason: "flat", check };
  return { ok: true, reason: "ok", check };
}

// ---- Gate for the fine-tuned rewrite model. Meaning only: style and "is it corporate enough" are judged by pickRewrite. ----
// Extra word families a rewrite may swap without changing the point.
const SYN2 = [
  ["fix", "fixed", "repair", "repaired", "resolve", "resolved", "patch", "patched", "sorted", "address", "addressed"],
  ["proofread", "review", "check", "look", "edit"], ["send", "sent", "sending"], ["env", "environment"], ["db", "database"], ["repo", "repository"],
  ["migrate", "migrated", "move", "moved", "transition"], ["nightly", "overnight", "daily"], ["sick", "unwell", "ill", "under the weather", "illness"],
  ["want", "wants", "seeking", "requesting", "asking", "request", "requested", "looking"], ["big", "large", "main"],
  ["need", "needs", "require", "requires", "looking", "seeking", "could"], ["grab", "collect", "pick", "get", "fetch"],
  ["quit", "stop", "cease", "refrain", "avoid"], ["reply", "replying", "respond", "responding"], ["whole", "entire", "all"],
  ["company", "organization", "org", "everyone"], ["sorry", "apologies", "apologize"], ["missed", "missing", "miss"],
  ["thinking", "considering", "exploring"], ["boss", "manager", "leadership"], ["mail", "post", "package", "packages"],
  ["changed", "updated", "change", "updates", "new"], ["closed", "shut", "unavailable", "offline"], ["broke", "broken", "failed", "down", "outage"],
  ["bug", "issue", "defect"], ["deadline", "timeline", "date"], ["numbers", "figures", "data", "metrics"], ["ok", "okay", "fine"],
];
const group2 = (w) => SYN2.findIndex((g) => g.some((x) => stem(x) === stem(w)));
const KEEP_SKIP = new Set(("guess oh perfect love great nice really finally again lol ok okay yeah yep nope maybe kinda sorta gonna wanna gotta pls please thing stuff " +
  "need someone somebody anyone anybody everyone people guys bad wrong total totally whole doing being make made getting").split(" "));
const stem2 = (w) => w.replace(/-/g, "").replace(/(?:ing|ed|es|e|s)$/, "").slice(0, 5);
function keyMissing(input, reply) {
  const basis = normalizeCasual(normalizeInput(input)) || input;
  const inst = [1, 2, 3].map((level) => toCorporateDetailed(input, { level, seed: 1 }).text);
  const instStems = new Set(inst.flatMap(content).map(stem));
  const outText = fold(reply).toLowerCase().replace(/-/g, " ");
  const outW = content(fold(reply)), outStems = new Set(outW.map(stem2));
  const outG = new Set([...outW.map(group), ...outW.map((w) => group2(w) + 100)].filter((g) => g >= 0 && g !== 99));
  const need = [...new Set(content(basis))].filter((w) => !KEEP_SKIP.has(w) && instStems.has(stem(w)) && !hasCrude(w) && !isSentiment(w));
  return need.filter((w) => !outStems.has(stem2(w)) && !new RegExp(`\\b${w.replace(/-/g, " ")}`).test(outText) && !(group(w) >= 0 && outG.has(group(w))) && !(group2(w) >= 0 && outG.has(group2(w) + 100)));
}
const FACT_WORD = /^(?:sick|ill|late|down|broke|broken|jammed|leak|cancel|delay|outage|crash|bug|stuck|lost|again|behind|overdue|blocked|quit|leaving|layoff|cut|issue|problem|miss|fail|slow|thank|shout|champ|win|milestone)/;
const isSentiment = (w) => !FACT_WORD.test(w) && polarityFlip(w, "great") === "praise" || polarityFlip(w, "unfortunately") === "bad-news";
const fold = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function modelGate(input, reply, { level = 2 } = {}) {
  const r = String(reply ?? "").trim();
  if (!r) return { ok: false, reason: "empty" };
  if (hasCrude(r)) return { ok: false, reason: "crude" };
  if (RUDE.test(r) && !RUDE.test(input)) return { ok: false, reason: "rude" };
  const basis = normalizeCasual(normalizeInput(input)) || input;
  // "nope, can't do that" has two no's for one refusal. One no in the reply keeps it.
  const basisNeg = basis.replace(/^\s*(?:no|nope|nah)\b[,.!]?\s+(?=.*(?:n't|\bnot\b|\bcannot\b|\bnever\b))/i, "");
  const check = checkMeaning(fold(basisNeg), fold(r));
  if (!check.ok) return { ok: false, reason: "meaning", detail: [...check.lost, ...check.added].join("/") };
  if (lostIdioms(input, r).length) return { ok: false, reason: "idiom" };
  const pol = polarityFlip(basis, r);
  if (pol) return { ok: false, reason: "polarity", detail: pol };
  const units = unitChanged(basis, r);
  if (units.length) return { ok: false, reason: "units", detail: units.join(",") };
  if (dayChanged(basis, r)) return { ok: false, reason: "day" };
  const req = requestBroken(basis, r);
  if (req) return { ok: false, reason: "request", detail: req };
  if (declineBroken(basis, r)) return { ok: false, reason: "decline" };
  // "no clue how this got approved" has to keep the not-knowing.
  if (/\b(?:no (?:clue|idea)|not sure|don't know|dunno|idk|unclear|who knows)\b/i.test(basis) && !/\b(?:clue|idea|sure|know|unclear|uncertain|insight|visibility|unknown|clarity|understand|why|how)\b/i.test(r.replace(/\bknow that\b/gi, ""))) return { ok: false, reason: "dropped", detail: "unsure" };
  // A subjectless "was driving" must not become "It was driving".
  if (/\bit (?:was|is|'s) \w+ing\b/i.test(r) && !/\bit\b/i.test(basis)) return { ok: false, reason: "subject" };
  const miss = keyMissing(input, r);
  if (miss.length > (miss.length && content(basis).length >= 8 ? 1 : 0)) return { ok: false, reason: "dropped", detail: miss.join(",") };
  return { ok: true, reason: "ok" };
}
