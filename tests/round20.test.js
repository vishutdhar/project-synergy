// Round 20: decode reads layoffs, RTO, endings, no's, logistics and benefit cuts in plain policy language;
// Full C-Suite puts a general, meaning-keeping joke in the body (satire20) instead of an opener/closer sandwich.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const L1 = (s) => toCorporate(s, { level: 1, seed: 1 });
const L3 = (s) => toCorporate(s, { level: 3, seed: 1 });
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 20: decode reads plain policy language", () => {
  assert.equal(sig("The requirement for some existing roles has greatly diminished."), "layoffs");
  assert.equal(sig("Beginning in February, in-person attendance will be mandatory three days a week."), "rto");
  assert.equal(sig("After careful review, the decision will stand."), "rejection");
  assert.equal(sig("We will cease publication of the quarterly newsletter."), "shutdown");
  assert.equal(sig("The client has chosen not to renew their contract."), "problem");
  assert.equal(sig("Sabbatical eligibility will now begin after ten years instead of seven."), "benefits");
  assert.equal(sig("Effective immediately, all new hires and backfills require VP approval."), "hiring-freeze");
  assert.equal(sig("Ana has decided to move on, and Friday will be her last day."), "departure");
  assert.equal(sig("We have decided to keep the current vendor rather than switch."), "rejection");
});

test("round 20: decode never invents bad news for logistics and flat premiums", () => {
  const a = toNormal("The all-hands is on Thursday at 10 AM in the main room.", { level: 1 });
  assert.equal(a.signal.id, "none");
  assert.match(a.summary, /Nothing hidden here/);
  assert.match(sig("Dental premiums will remain flat next year."), /^(?:good-news|none)$/);
  assert.notEqual(sig("The company HSA contribution will be reduced to $500."), "good-news");
});

test("round 20: Full C-Suite jokes live in the body and keep the facts", () => {
  const cases = [
    ["we're out of coffee filters", /coffee filter inventory has reached zero/],
    ["the printer ate my boarding pass", /acquired my boarding pass in a hostile takeover/],
    ["the vendor still hasn't sent the contract back", /still hasn't sent the contract back, a bold display of strategic patience/],
    ["sorry I forgot to send it", /forgot to send it; my memory has been placed on a performance improvement plan/],
    ["we've had 3 outages this month, up from 1 last month", /3 outages this month, up from 1 last month, the wrong kind of growth/],
    ["NPS went from 31 to 44", /NPS went from 31 to 44, a growth story/],
    ["the export takes 12 minutes", /takes a leisurely 12 minutes/],
    ["thanks for covering my shift yesterday, owe you one", /covering my shift yesterday, a true act of cross-functional heroism/],
    ["the in-laws are visiting all week", /onsite all week for an extended stakeholder visit/],
    ["I can't take that on right now", /unable to take that on at the moment; my plate is at full strategic capacity/],
  ];
  for (const [s, re] of cases) {
    const out = L3(s);
    assert.match(out, re, `${s} -> ${out}`);
    assert.ok(out.split(/(?<=[.!?])\s+/).length <= 3, `too long: ${out}`);
    assert.ok(!hasCrude(out));
  }
});

test("round 20: satire grammar guards", () => {
  assert.doesNotMatch(L3("the migration is about 60% done"), /is about is/);
  assert.doesNotMatch(L3("the client is cold on the idea"), /thermal/);
  assert.doesNotMatch(L3("waiting on Sam"), /awaiting the Sam/);
  assert.doesNotMatch(L3("which version of the contract did the client sign, v6 or v7?"), /evolved version/);
  assert.match(L3("we lost 9 customers to Acme this month"), /other opportunities with Acme this month/);
  assert.match(L3("the event was packed but the speaker no-showed"), /no-show/);
  assert.doesNotMatch(L3("we're on track for the Friday release, no blockers"), /universe, no blockers/);
  assert.match(L3("client loved the demo but wants it cheaper"), /, but wants it cheaper/);
  assert.doesNotMatch(L3("client loved the demo but wants it cheaper"), /flywheel|applause|culture deck/i);
});

test("round 20: the fuck-off-day regression and sensitive lines stay sincere", () => {
  const off = L3("I'd like to fuck off the whole day today");
  assert.doesNotMatch(off, /slack off|Clarity is our north star|fuck/i);
  assert.match(off, /recharge|bandwidth/i);
  assert.doesNotMatch(L3("I'm working half day Friday, leaving at noon for a funeral"), /stakeholder|strategic/i);
  assert.doesNotMatch(L3("my mom is in the hospital, might be distracted"), /hostile takeover|sabbatical|holding pattern/i);
});
