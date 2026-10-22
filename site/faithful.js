// Faithfulness check for AI replies to crude input. A small model can turn "nothing was done in that
// meeting" into something that sounds fine and means something else. For crude input we only accept a
// reply that keeps every content word of the work-safe version and adds almost nothing new.
// Words the Instant engine itself would use for this input count as kept, so "meeting" can become "sync".
import { softenCrude, toCorporateDetailed } from "./engine.js";
import { hasCrude } from "./profanity.js";

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

export const needsFaithCheck = (input) => hasCrude(input) || softenCrude(input) !== String(input);
