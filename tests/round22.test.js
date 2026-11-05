// Round 22: more Full C-Suite body jokes (sandwich ↓ / funny ↑), blunt/sarcasm cleanup, decode soft-news shapes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const L = (s, level) => toCorporate(s, { level, seed: 1 });
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 22: fuck-off-day regression stays a strategic offline day", () => {
  const out = L("I'd like to fuck off the whole day today", 3);
  assert.doesNotMatch(out, /slack off|Clarity is our north star/i);
  assert.match(out, /strategic offline day|recharge my bandwidth|fully aligned/i);
  assert.ok(!hasCrude(out));
});

test("round 22: Full C-Suite body jokes on everyday office shapes", () => {
  assert.match(L("someone parked in my reserved spot again, it's a red jeep", 3), /reassigned my reserved spot|bold interpretation of shared resources/i);
  assert.match(L("there's a bird in the warehouse again", 3), /unscheduled bird stakeholder/i);
  assert.match(L("bug reproduced, fix in review", 3), /successfully reproduced|peer-review sabbatical/i);
  assert.doesNotMatch(L("bug reproduced, fix in review", 3), /The the|fix is review[^a-z]/i);
  assert.match(L("the microwave on 2 beeps forever after every burrito, please stop reheating fish", 3), /infinite audio retrospective|retire fish|thermal-reheating/i);
  assert.doesNotMatch(L("this backlog is a dumpster fire and nobody will admit it", 3), /dumpster fire/i);
});

test("round 22: blunt and sarcasm stay work-safe", () => {
  for (const s of [
    "stop breathing down my neck about the typo, I'll fix it",
    "whoever designed this form should be ashamed of themselves",
    "the new dashboard is garbage and half the charts are wrong",
    "yay, the mandatory fun event is on a Saturday",
  ]) {
    for (const lvl of [1, 2, 3]) {
      const out = L(s, lvl);
      assert.ok(!hasCrude(out), out);
      assert.doesNotMatch(out, /\b(?:neck|ashamed|garbage|yay|dumpster)\b/i, out);
    }
  }
});

test("round 22: decode soft shapes — delays, free→paid, keep-as-is, soft layoffs, PIP, price hikes", () => {
  assert.equal(sig("The yearly pay banding exercise that typically lands in August will run in November instead."), "delay");
  assert.equal(sig("The warehouse go-live planned for January is now looking like March."), "delay");
  assert.equal(sig("Work on the analytics rebuild will pick up again when the platform squad has bandwidth."), "delay");
  assert.equal(sig("Starting Monday, the break-room espresso that was previously free will have a $2 charge."), "cost-increase");
  assert.equal(sig("Pro plan increases to $29/user/month on renewals after May 1."), "cost-increase");
  assert.equal(sig("Following feedback, we're keeping the flexible Friday policy unchanged."), "good-news");
  assert.equal(sig("We're asking a small number of colleagues to leave the business this month."), "layoffs");
  assert.equal(sig("Going forward I'll need you to send me end-of-day updates on your tickets."), "performance");
  assert.equal(sig("Please have Jordan review client emails before they go out."), "performance");
  assert.equal(sig("Any new freelance agreement now needs sign-off from Finance leadership."), "budget-freeze");
  assert.equal(sig("Country teams in LATAM and Canada will report to one Americas lead."), "reorg");
  assert.equal(sig("Julia will transition out of her role over the coming weeks."), "departure");
  assert.equal(sig("We are working through what the new tariffs mean for our pricing."), "hedge");
  assert.notEqual(sig("Reminder: weekly status notes are due by 3 PM on Thursdays."), "delay");
});
