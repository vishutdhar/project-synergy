// Round 9 regression tests (project-synergy-research/round9): satire scenes, plain news in decode.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const clean = (s) => all(s).forEach((o, i) => { assert.ok(o.trim().length > 10, `L${i + 1} empty for ${s}`); assert.ok(!hasCrude(o), `L${i + 1}: ${o}`); });
const L3 = (s) => toCorporate(s, { level: 3, seed: 1 });
const dec = (s, level = 1) => toNormal(s, { level });

test("crude day-off lines become a work-safe euphemism with the same meaning", () => {
  for (const s of ["I'd like to fuck off the whole day today", "I'm slacking off this afternoon", "gonna skip work tomorrow", "calling in sick", "I'm taking the day off", "taking friday off", "I plan to do absolutely nothing this friday", "screw it, I'm logging off at 3"]) clean(s);
  const out = L3("I'd like to fuck off the whole day today");
  assert.match(out, /today/);
  assert.match(out, /recharge|rest/i);
  assert.doesNotMatch(out, /slack off|For full visibility across the ecosystem/);
  every("gonna skip work tomorrow", /tomorrow/);
  every("calling in sick", /sick/i);
  every("taking friday off", /Friday off/);
  every("screw it, I'm logging off at 3", /\b3\b/);
});

test("crude assessments keep the judgment and gain deadpan satire at Full C-Suite", () => {
  for (const s of ["this meeting is a total shitshow", "the new dashboard sucks", "these OKRs are total bs", "we got our asses kicked in that pitch", "whoever wrote this spec was high", "he's an idiot for promising that date", "the CFO's new rule is complete horseshit"]) clean(s);
  assert.match(L3("the new dashboard sucks"), /underindex/);
  assert.match(L3("these OKRs are total bs"), /not grounded in observable reality/);
  every("we got our asses kicked in that pitch", /pitch/);
  assert.match(L3("he's an idiot for promising that date"), /not one I can endorse/);
});

test("sarcasm states the complaint, never praise", () => {
  every("love how the wifi dies every time we have a client call", /frustrated that the wifi dies every time/);
  every("wow another meeting about meetings", /another meeting about meetings/);
  assert.doesNotMatch(L3("wow another meeting about meetings"), /^Pausing the roadmap|rockstar/);
  every("thanks for the heads up, really helpful after the fact", /sooner|before the fact|proactive/);
  every("so glad we spent 3 hours on the font", /3[- ]hours?/);
  assert.match(L3("love how clean the new UI is"), /like how clean the new UI is/);
});

test("quitting and leaving keep dates and names", () => {
  every("accepting the offer from Stripe, my last day is the 30th", /Stripe.*the 30th/);
  every("friday is my last day", /Friday/);
  every("I'm handing in my notice today", /notice today/);
  every("can I leave early today? kid has a recital", /early today\?.*recital/);
});

test("bare fragments become whole sentences", () => {
  every("contract signed with Acme", /the contract with Acme is signed/i);
  every("call in 5", /starts in 5 minutes/);
  every("lunch?", /does anyone want lunch\?/i);
  every("anyone want lunch?", /does anyone want lunch\?/i);
  every("train's delayed, be there in 20", /train is delayed\. I'll be there in 20 minutes/);
  every("the migration finished overnight with no errors", /zero errors/);
  assert.doesNotMatch(L3("the migration finished overnight with no errors"), /radical transparency|setback/);
});

test("Full C-Suite frames fit the intent", () => {
  assert.doesNotMatch(L3("waiting for legal to sign off on the contract"), /bandwidth|empty cup/);
  assert.match(L3("you saved my ass today, thanks"), /gratitude|grateful|Appreciate/i);
  assert.doesNotMatch(L3("you saved my ass today, thanks"), /I've noticed/);
  assert.match(L3("I'm not presenting at the all hands"), /won't be presenting/);
});

test("decode names the plain news and never invents a shutdown", () => {
  const snack = dec("Team, the snack bar on 3 will be closed for restocking on Friday. Normal service resumes Monday.");
  assert.notEqual(snack.signal.id, "shutdown");
  assert.match(snack.summary, /snack bar on 3 will be closed for restocking on Friday/);
  const maint = dec("The cafeteria will be closed during the kitchen renovation.");
  assert.doesNotMatch(maint.summary, /shut ?down|for good|permanently/i);
  const fee = dec("A small convenience fee will be added to all card payments.");
  assert.equal(fee.signal.id, "cost-increase");
  assert.match(fee.summary, /card payments now cost extra/);
  assert.equal(dec("The shipment arrived damaged and will need to be replaced.").signal.id, "problem");
  const good = dec("Great news: we closed our Series B and no roles are affected by the new structure.");
  assert.notEqual(good.signal.tone, "bad");
  assert.equal(dec("Priya is retiring at the end of the month after 20 great years.").signal.id === "shutdown", false);
});

test("round 9c: more crude and time-off phrasings stay work-safe, keep meaning, never go empty", () => {
  for (const s of ["going to half-ass it today, no energy", "he talks out of his ass in every meeting", "pricing page looks like ass", "that pitch deck sucked ass", "marketing screwed the pooch on this one", "he's a total dick in meetings", "honestly I just want to fuck off early today", "I'm gonna dick around on youtube most of the afternoon"]) clean(s);
  every("he's a total dick in meetings", /meetings/);
  every("I've had it with this job", /this job/);
  assert.doesNotMatch(all("I've had it with this job").join(" "), /resign/i);
  every("I'm bailing early today, have a flight", /early today/);
  every("thinking of ditching work tomorrow and going hiking", /thinking of taking tomorrow off/);
  every("gonna bail on the 3pm and head home", /3pm/);
  every("cover for me in standup", /\?/);
  every("have a good weekend all", /good weekend/);
  assert.doesNotMatch(all("have a good weekend all").join(" "), /\?/);
  assert.match(L3("I need a nap like you wouldn't believe"), /rest cycle/);
});

test("round 9c: fragments get their subject back and no-news memos stay calm", () => {
  assert.equal(toCorporate("no, can't make the 4pm", { level: 1, seed: 1 }), "No, I'm unable to make the 4pm.");
  assert.match(toCorporate("I won't be in tomorrow, kid is sick", { level: 1, seed: 1 }), /because my kid is sick/);
  assert.match(toCorporate("be there in 10, parking", { level: 1, seed: 1 }), /^I'll be there in 10 minutes\. I'm parking\.$/);
  assert.doesNotMatch(L3("the backlog is down to 40 tickets"), /headwind|outage/);
  assert.match(dec("Free snacks will be limited to Mondays and Wednesdays.").summary, /cut back/);
  assert.doesNotMatch(dec("The parking lot will be repaved this weekend.").summary, /deflect|losing their jobs/i);
  assert.doesNotMatch(dec("Sam will be transitioning out of his role as Head of Product.").summary, /losing their jobs/);
  assert.match(dec("Affected team members will receive a calendar invite from HR later today.").summary, /losing their jobs/);
});
