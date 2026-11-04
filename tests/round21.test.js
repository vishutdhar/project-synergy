// Round 21: grief stays sincere, "just found out" stays news, fragments get verbs, greetings lead, no "happy to share" on bad news,
// decode reads held pay, regulator letters, phased-out roles, smaller contributions, caps and kept dates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const L = (s, level) => toCorporate(s, { level, seed: 1 });
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 21: grief and medical news stay sincere at every level", () => {
  for (const s of ["I'm stepping away for a bit, my dad passed last night", "my grandma passed away", "my wife is having surgery tomorrow", "I broke my wrist"]) {
    for (const lvl of [1, 2, 3]) {
      const out = L(s, lvl);
      assert.doesNotMatch(out, /crying|scorecard|win|synerg|stakeholder|strategic|legends|celebrat|flywheel|optimistic/i, `${s} L${lvl} -> ${out}`);
    }
  }
  assert.doesNotMatch(L("the pilot with the hospital went great", 3), /understanding and flexibility/);
});

test("round 21: news lines keep their grammar", () => {
  assert.match(L("just found out I'm going to be an aunt", 1), /^I just found out I'm going to be an aunt\.$/);
  assert.match(L("we found the memory leak, patch going out tonight", 1), /and the patch is going out tonight/);
  assert.match(L("offsite: venue booked, catering TBD", 1), /the venue is booked, and the catering is still TBD/);
  assert.match(L("we finished the migration", 1), /\bwe finished the migration/);
  assert.doesNotMatch(L("I'm so fucking done with this client's last-minute changes", 3), /\. 'S/);
  assert.match(L("could someone from IT come look at the conference room mic, nobody can hear us", 3), /thought partner from IT who could/);
  assert.match(L("wait, is the offsite mandatory? I have a wedding that weekend", 1), /wedding that weekend\.$/);
  assert.match(L("my calendar has 34 meetings this week, when am I supposed to do actual work", 2), /actual work\?/);
  assert.match(L("morning all! reminder that the plumbers are in till lunch", 2), /^Morning all! /);
  assert.match(L("hey, whoever's been microwaving popcorn at 4pm every day, knock it the hell off", 3), /^Hey, in the spirit/);
});

test("round 21: bad news never gets a happy frame, and crude stays out", () => {
  for (const s of ["only 18% of the team finished the mandatory training", "the agency's creative is shit and we paid them 60 grand for it"]) {
    assert.doesNotMatch(L(s, 1), /happy to share/i);
    assert.doesNotMatch(L(s, 2), /Quick win/);
  }
  for (const s of ["the bonus formula is a scam and everyone knows it", "the new VP doesn't know shit about our product", "I sat there like an idiot for 20 min"]) {
    for (const lvl of [1, 2, 3]) { const out = L(s, lvl); assert.ok(!hasCrude(out)); assert.doesNotMatch(out, /\b(?:scam|idiot|shit|stuff)\b/i, out); }
  }
});

test("round 21: Full C-Suite body jokes on general office shapes", () => {
  assert.match(L("dashboard broken since 9, eng on it", 3), /unplanned maintenance window since 9/);
  assert.match(L("we had 14 outages this quarter compared to 2 last year", 3), /the wrong kind of growth/);
  assert.match(L("we burned through 70% of the annual marketing budget by August", 3), /front-loaded 70% of the annual marketing budget by August/);
  assert.match(L("I've been asking for edit access to the budget sheet for two weeks", 3), /patient holding pattern on edit access/);
  assert.doesNotMatch(L("rollback complete, root cause pending", 3), /the the/);
});

test("round 21: decode reads held pay, regulator letters and smaller contributions", () => {
  assert.equal(sig("Merit increases will be held this year while we focus on profitability."), "no-raises");
  assert.equal(sig("We received a warning letter from the regulator about our record-keeping."), "problem");
  assert.equal(sig("We will be phasing out a number of roles in our support centers."), "layoffs");
  assert.equal(sig("The company's contribution to HSAs will be $500 next year, compared to $1,000 this year."), "benefits");
  assert.equal(sig("We considered moving the offsite but have decided to keep the original venue."), "rejection");
  assert.notEqual(sig("We passed the regulator's review with no findings."), "problem");
});

test("round 21b: fresh58 read fixes", () => {
  assert.match(L("draft contract sent to legal, ETA Friday", 1), /, and the ETA is Friday/);
  assert.match(L("quote received, 12k over budget", 1), /the quote came in, and it's 12k over budget/);
  assert.doesNotMatch(L("the onboarding docs are garbage and out of date", 2), /garbage/);
  assert.doesNotMatch(L("the audit team is breathing down my neck about receipts", 1), /neck/);
  assert.doesNotMatch(L("thanks but I'll pass on speaking at the conference", 3), /recognize exceptional impact/);
  assert.doesNotMatch(L("the new onboarding flow cut support tickets in half", 3), /discomfort|headwind|optimistic/i);
  assert.doesNotMatch(L("awesome, the printer is printing everything in pink now", 3), /Legends|recognition-first/);
  assert.equal(sig("Following feedback, we're keeping the current remote work policy unchanged for 2027."), "good-news");
  assert.equal(sig("We need a bit more time on the rollout. The new target is the 30th."), "delay");
  assert.equal(sig("Breakfast in the cafeteria, which was previously free, will now cost $4."), "cost-increase");
  assert.equal(sig("Remote employees will be asked to relocate to a hub city by the summer."), "rto");
});
