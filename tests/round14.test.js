// Round 14 regression tests: time-off scenes, idioms by meaning, fragments, sarcasm, crude traps, decode readers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));
const L1 = (s) => toCorporate(s, { level: 1, seed: 1 });
const L3 = (s) => toCorporate(s, { level: 3, seed: 1 });
const dec = (s) => toNormal(s, { level: 1 });

test("round 14: Vishut's day-off line stays fixed", () => {
  const out = L3("I'd like to fuck off the whole day today");
  assert.doesNotMatch(out, /slack off|Clarity is our north star|For full visibility across the ecosystem/);
  assert.ok(!hasCrude(out), out);
});

test("round 14: time-off wishes become satire, not a bolted-on opener", () => {
  assert.match(L3("I want to call in tomorrow and just play video games"), /strategic recharge window .*video game/);
  assert.match(L1("I want to skip work tomorrow and sleep in"), /take tomorrow off to get some extra sleep/);
  assert.match(L1("I'm going to duck out at 2 and not come back"), /head out at 2 and won't be back/);
  none("I'm going to duck out at 2 and not come back", /return fully aligned/);
  every("I really want to blow off work today", /today/);
});

test("round 14: idioms are translated by meaning", () => {
  assert.equal(L1("we're back to square one"), "We're starting over from scratch.");
  assert.equal(L1("he's moving the goalposts again"), "He's changing the targets again.");
  assert.match(L1("we need to cut corners to make the date"), /skip some steps to hit the date/);
  none("we're stuck between a rock and a hard place", /Kudos|Great to see|rock and a hard place/);
  none("the ball's in their court now", /ball/);
  assert.match(L3("he's going to hit the roof"), /escalation/);
});

test("round 14: fragments get a subject and a verb", () => {
  assert.equal(L1("at capacity this sprint"), "I'm at capacity this sprint.");
  assert.match(L1("Priya out, Dev covering"), /Priya is out, and Dev is covering/);
  assert.match(L1("results tomorrow"), /the results are coming tomorrow/);
  assert.match(L1("room 3B double booked"), /room 3B is double-booked/);
  assert.match(L1("keys at front desk"), /the keys are at the front desk/);
  assert.match(L1("2 approvals left"), /there are 2 approvals left/);
  none("customer escalated, joining call", /has been escalated|joining call\b/);
});

test("round 14: sarcasm reads as the complaint it is", () => {
  assert.match(L1("love that the all-hands about wellbeing was scheduled during lunch"), /^I'm frustrated that/);
  assert.match(L1("so excited to rebuild the deck because the logo changed color"), /^I'm not excited/);
  assert.match(L1("what a surprise, the meeting ran over"), /^Unsurprisingly/);
  assert.match(L1("really appreciate being cc'd on every single email"), /not be cc'd/);
  assert.match(L1("really feeling the synergy with four managers on one ticket"), /it's a lot to have four managers/);
});

test("round 14: crude lines get a work-safe rewrite with the meaning kept", () => {
  const cases = [
    ["the coffee here tastes like ass", /tastes rough/],
    ["I can't be arsed to update the wiki", /can't find the motivation/],
    ["tell Greg to quit screwing around", /stop killing time/],
    ["the client's legal team is busting our balls over one comma", /giving us a hard time/],
    ["the new intern is a badass at SQL", /really impressive at SQL/],
    ["the Jira migration fucked every ticket link we had", /broke every ticket link/],
    ["the Q3 forecast was pulled out of someone's ass", /made up/],
    ["Kevin's spreadsheet macros are absolute dogshit", /really bad/],
    ["I swear to god if procurement asks for another form", /frustrated if procurement/],
  ];
  for (const [s, re] of cases) { assert.match(L1(s), re, s); for (const o of all(s)) { assert.ok(o.length > 0, s); assert.ok(!hasCrude(o), `${s} -> ${o}`); } }
  assert.ok(hasCrude("they keep busting my balls"));
});

test("round 14: small replies and no-news lines", () => {
  assert.equal(L1("sounds good to me"), "That sounds good to me.");
  assert.doesNotMatch(L3("no update yet"), /bandwidth has spoken|said no/);
  assert.equal(L1("QA signed off").replace(/^.*?: |^Just to let you know, /, ""), "QA has given the sign-off.");
});

test("round 14: decode names the real change", () => {
  const cases = [
    ["The app update will ship in the second quarter instead of the first.", "delay", /later than planned/],
    ["Bonus payouts are moving from March to June.", "delay", /March to June/],
    ["The wellness app subscription will not be renewed.", "benefits", /getting less/],
    ["Promotions are on pause this cycle.", "budget-freeze", /on hold/],
    ["Employees hired as remote will be asked to come into a hub office twice a week.", "rto", /office/],
    ["The monthly plan is increasing to $15.", "cost-increase", /costs you more/],
    ["The family plan now costs $24 a month, up from $18.", "cost-increase", /\$24/],
    ["The Windows version of the app will stop receiving updates after March.", "shutdown", /going away/],
    ["Some customers received another customer's invoice.", "problem", /went wrong/],
    ["Your recent work needs significant improvement.", "performance", /concerns/],
    ["We're taking a close look at how our teams are structured.", "hedge", /nothing is decided/],
    ["Two layers of management are being removed in the sales organization.", "reorg", /org chart/],
    ["Nina is heading off to start her own company.", "departure", /leaving/],
    ["Departing employees will receive 16 weeks of pay and can keep their laptops.", "layoffs", /16 weeks/],
  ];
  for (const [s, id, re] of cases) { const d = dec(s); assert.equal(d.signal.id, id, `${s} -> ${d.signal.id}: ${d.summary}`); assert.match(d.summary, re, `${s} -> ${d.summary}`); }
});

test("round 14: decode does not invent bad news", () => {
  assert.equal(dec("The merger closed, and there are no planned job cuts.").signal.id, "good-news");
  for (const s of ["Snacks are restocked every Monday.", "The parking lot will be repaved this weekend."]) assert.ok(["none", "fyi", "fluff"].includes(dec(s).signal.id), s);
});
