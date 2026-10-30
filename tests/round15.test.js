// Round 15 regression tests: general decode reader, good-news reversals, never-empty crude lines, no cheer on sad news.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));
const sig = (s) => toNormal(s, { level: 1 }).signal.id;
const dec = (s) => toNormal(s, { level: 1 }).summary;

test("round 15: crude lines never come back empty or crude", () => {
  for (const s of ["this hotel wifi is ass, I'll call in from my phone", "what the actual fuck happened to the Q4 numbers", "my manager chewed my ass out in front of the team", "fuck mondays", "that's a dumb ass idea"]) {
    all(s).forEach((o, i) => { assert.ok(o.trim().length > 5, `L${i + 1} empty for ${s}`); assert.ok(!hasCrude(o), `L${i + 1} crude: ${o}`); });
  }
  every("what the actual fuck happened to the Q4 numbers", /what happened to the Q4/i);
  every("sorry, that was a shit email, ignore it", /bad email/);
  none("sorry, that was a shit email, ignore it", /stuff email/);
  none("I don't give a shit what color the button is", /give a bad/);
  none("I'm gonna lose my shit if the build breaks one more time", /lose my (?:mistake|stuff|bad)/);
});

test("round 15: sad news never gets a cheerful frame", () => {
  none("my grandmother passed away, I'll be out the rest of the week", /happy to share|thrilled|celebrat/i);
  none("my grandma passed away", /happy to share|thrilled|celebrat/i);
  assert.match(toCorporate("the build passed, deploying now", { level: 1, seed: 1 }), /happy to share/);
});

test("round 15: sarcastic praise with a sour detail reads as the complaint", () => {
  every("nice of IT to schedule the outage during payroll", /frustrated that IT decided to schedule/);
  every("so happy to be presenting the bad numbers to the board", /(?:dreading|pre-grieving) presenting/);
  every("great to see the feedback I gave last year was implemented never", /was never implemented/);
  none("really loving the new open floor plan, especially the guy on speakerphone", /loving/i);
});

test("round 15: Full C-Suite inflates the complaint itself", () => {
  assert.match(toCorporate("my manager chewed my ass out in front of the team", { level: 3, seed: 1 }), /developmental feedback/);
  assert.match(toCorporate("our competitor is kicking our ass", { level: 3, seed: 1 }), /out-executing us/);
  assert.doesNotMatch(toCorporate("done with the slides, uploading them tonight", { level: 3, seed: 1 }), /saturation/);
  assert.doesNotMatch(toCorporate("I'm sick of this shit", { level: 3, seed: 1 }), /battery capacity of/);
});

test("round 15: general decode reader names the change", () => {
  assert.equal(sig("Paid sick days will be reduced from 10 to 6 per year."), "benefits");
  assert.match(dec("Paid sick days will be reduced from 10 to 6 per year."), /from 10 to 6/);
  assert.equal(sig("About 400 employees will receive notices this week."), "layoffs");
  assert.equal(sig("All contractor engagements in marketing will end on Friday."), "layoffs");
  assert.equal(sig("The old login page will stop working on December 1."), "shutdown");
  assert.equal(sig("Delivery will now be free only on orders over $50, up from $25."), "cost-increase");
  assert.equal(sig("We now expect the new headquarters to open in 2028 rather than late 2027."), "delay");
  assert.match(dec("We now expect the new headquarters to open in 2028 rather than late 2027."), /2028/);
  assert.equal(sig("We are actively evaluating the future of our retail business."), "hedge");
  assert.equal(sig("Our main data center lost power for four hours."), "problem");
  assert.equal(sig("Your manager will change as part of this transition."), "reorg");
  assert.equal(sig("Employees will get two fewer holidays next year."), "benefits");
  assert.doesNotMatch(dec("Employees will get two fewer holidays next year."), /laid off/);
});

test("round 15: no false alarms on reversals and plain notices", () => {
  assert.equal(sig("The hiring freeze is lifted, and teams can post new roles."), "good-news");
  assert.equal(sig("We're reducing required office days from four to two."), "good-news");
  assert.match(sig("We have a new organizational chart available on the intranet, with no changes to reporting lines."), /^(?:none|fyi)$/);
  assert.match(sig("The office will close early on December 31 and reopen January 2."), /^(?:none|fyi|logistics)$/);
  for (const s of ["Health premiums will decrease 5% next year.", "The retirement match is rising to 5%.", "Please complete the benefits survey by the end of the week.", "The team will get Friday off after the launch.", "Customer complaints dropped to their lowest level ever."]) {
    assert.match(sig(s), /^(?:none|fluff|fyi|logistics|good|good-news|record-year)$/, s);
  }
});

test("round 15b: crude idioms keep their meaning and grammar", async () => {
  const { toCorporateDetailed } = await import("../site/engine.js");
  const cases = [
    ["I have zero fucks left for this quarter", /zero patience left/],
    ["Gary's pivot idea is batshit and I'm not on board", /(?:not credible|not grounded in observable reality) and I'm not on board/],
    ["no way in hell we ship by Monday", /don't (?:think|believe) we will ship by Monday/],
    ["our VPN sucks balls today", /not good|isn.t great|underindexing on quality/],
    ["the auditors are crawling up our asses about receipts", /breathing down our necks/],
    ["why did the launch slip?", /slipped|slip\?/],
    ["why the hell is the staging server down again", /why (?:the staging server is down|is the staging server down)/],
  ];
  for (const [t, re] of cases) for (const level of [1, 3]) {
    const out = toCorporateDetailed(t, { level, seed: 1 }).text;
    assert.match(out, re, `${t} L${level}: ${out}`);
    assert.doesNotMatch(out, /\b(?:fuck|shit|ass|hell|balls|batshit)\b|sliped/i, out);
  }
});
