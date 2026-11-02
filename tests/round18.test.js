// Round 18 regression tests: decode reads plain-spoken news (denials, cuts, reversals, delays),
// and Full C-Suite gives time off and personal milestones a joke that fits instead of a stock frame.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toCorporateDetailed, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const sig = (s) => toNormal(s).signal.id;
const l3 = (s) => toCorporateDetailed(s, { level: 3, seed: 1 }).text;
const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));

test("round 18: plain-spoken decode lines name the real news", () => {
  const cases = [
    ["There are no plans for layoffs at this time.", "hedge"],
    ["We have no updates to share on the merger right now.", "hedge"],
    ["We are cutting 200 jobs across the company.", "layoffs"],
    ["Today will be the last day for about 200 people.", "layoffs"],
    ["After feedback, we are rolling back the parking fee increase.", "good-news"],
    ["Medical premiums will stay flat next year because the company is covering the increase.", "good-news"],
    ["We are adding dental coverage at no extra cost to employees.", "good-news"],
    ["Our software licenses will renew at a higher rate next year.", "cost-increase"],
    ["We cannot offer a salary increase this cycle.", "rejection"],
    ["Remote work will end on February 1.", "rto"],
    ["The new payroll system will not be ready until March.", "delay"],
  ];
  for (const [s, id] of cases) assert.equal(sig(s), id, s);
});

test("round 18: neutral logistics never turn into bad news", () => {
  const bad = new Set(["layoffs", "shutdown", "reorg", "no-raises", "problem", "acquisition", "budget-freeze", "rto", "cost-increase"]);
  for (const s of ["Room bookings go through the new app now.", "Pay dates stay the same.", "The team lunch is on Friday at noon.",
    "The office will close at 2 PM on Wednesday ahead of the holiday.", "We have no updates to share on the merger right now."]) {
    assert.ok(!bad.has(sig(s)), `${s} -> ${sig(s)}`);
  }
});

test("round 18: corporate grammar fixes stay work-safe", () => {
  const cases = [
    ["tell marketing to quit spamming the whole company", /ask marketing to stop spamming/i],
    ["anyone want the leftover bagels in the kitchen", /would anyone like the leftover bagels/i],
    ["I'm so fed up with this crap project", /this (?:frustrating )?project/i],
  ];
  for (const [s, re] of cases) {
    const outs = all(s);
    for (const o of outs) assert.ok(!hasCrude(o), o);
    assert.match(outs[0], re, outs[0]);
  }
  for (const o of all("anyone want to grab drinks after work")) assert.doesNotMatch(o, /like to pick up happy hour|like to grab/i, o);
});

test("round 18: Full C-Suite time off gets a fitting joke, sensitive reasons do not", () => {
  assert.match(l3("going on vacation next week"), /strategic recharge sabbatical next week/i);
  assert.match(l3("out Thursday and Friday for a wedding"), /cross-family merger/i);
  assert.match(l3("I'm leaving at 4 for a doctor appointment"), /wellness audit/i);
  for (const s of ["my partner just went into labor, I'm out", "daughter home with a fever, taking a half day", "out tomorrow for my grandma's funeral"]) {
    assert.doesNotMatch(l3(s), /recharge|Rest is a deliverable/i, s);
  }
  for (const s of ["I'm out of PTO for the year", "have a great long weekend", "I'm out at the end of the month"]) {
    assert.doesNotMatch(l3(s), /to recharge and return/i, s);
  }
});

test("round 18: personal milestones get a closer that fits", () => {
  assert.match(l3("I just bought a house"), /real-estate portfolio/i);
  assert.match(l3("I just got engaged"), /Both boards have approved/i);
  assert.match(l3("we just had a baby!"), /headcount plan/i);
});

test("round 18: keeps the 'fuck off the whole day' regression", () => {
  const t = l3("I'd like to fuck off the whole day today");
  assert.ok(!hasCrude(t), t);
  assert.match(t, /recharge|offline/i, t);
  assert.doesNotMatch(t, /slack off/i, t);
});

test("round 18b: a paused raise is never good news, even next to a bonus", () => {
  const r = toNormal("Given the uncertain macro environment, we have made the decision to pause merit increases for this cycle and to keep our bonus pool at a modest level.", { level: 2 });
  assert.notEqual(r.signal.id, "good-news", r.summary);
});

test("round 18b: time-off reasons land in the right place", () => {
  assert.match(l3("going to need monday off, my flight back got cancelled"), /airline-led reprioritization/);
  assert.match(l3("I'm moving apartments Saturday so I'm off Friday afternoon"), /executing a residential relocation initiative Saturday/);
  assert.doesNotMatch(l3("I'm off tomorrow and will not be checking slack"), /slack to recharge/i);
});
