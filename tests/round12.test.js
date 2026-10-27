// Round 12 regression tests: fresh38 general families and the regressions found in the fresh24-37 sweep.
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
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 12: bare noun-phrase fragments get a subject and a verb", () => {
  every("Staging wiped, redeploying", /the staging environment has been wiped, so I'm redeploying/);
  every("VPN down for everyone?", /is the VPN down for everyone\?/i);
  every("Ticket closed, customer happy", /the (?:ticket|work item) has been closed, and the (?:customer|client)(?:, our north star,)? is happy/);
  every("offline til noon, dentist", /I'll be offline until noon for a dentist appointment/);
  every("open bugs fell to 6", /the number of open (?:bugs|issues|defects) fell to 6/i);
});

test("round 12: the fragment rule leaves things it can't read alone", () => {
  for (const [s, bad] of [["eta on the fix?", /is the ETA/i], ["ping me when it's merged", /the ping/i], ["fyi I'm out Friday", /the FYI/i], ["All done.", /the all/i],
    ["Heads up, fire drill at 11.", /the heads/i], ["revenue's up, morale's down", /revenue's are/i], ["can't make it, double booked", /the double/i],
    ["Snowed in, working from home.", /the snowed/i], ["Subway stuck in a tunnel, running 10 late.", /the running/i], ["crash rate fell under 0.5%", /Crash rate/]]) none(s, bad);
  every("dentist ran long, joining in 10", /dentist appointment ran long/);
  every("Leaving early, dentist.", /leaving early for a dentist appointment/);
  none("Leaving early, dentist.", /dental-wellness/);
});

test("round 12: no preference stays a lack of preference, never a priority call", () => {
  every("I don't give a damn which font we use", /I have no strong preference on which font/);
  none("I don't give a damn which font we use", /see this as a priority|damn/i);
  assert.doesNotMatch(L3("I don't give a damn which font we use"), /headwind/);
});

test("round 12: Full C-Suite inflates the mundane and keeps the fact", () => {
  assert.match(L3("my car got towed"), /involuntarily relocated/);
  assert.match(L3("I locked my keys in the car"), /keys inside my personal mobility asset/);
  assert.match(L3("my dog just joined the zoom call"), /my dog has joined the Zoom call as an unscheduled stakeholder/i);
  assert.match(L3("I'm on my fourth coffee and it's 10am"), /fourth caffeine intervention/);
  assert.match(L3("the intern totally crushed it, damn"), /our intern, an emerging talent, did a fantastic job/);
  assert.match(L3("quit cc'ing the whole damn company"), /stop cc'ing the whole company/);
  // The original noun survives so the reader still knows what happened.
  assert.match(L3("Shit, I forgot to send the invoice to Acme."), /invoice/);
  assert.match(L3("anyone know where the HDMI adapters went"), /HDMI adapters/);
  assert.match(L3("wonderful, my 1:1 got moved for the fourth time"), /my 1:1/);
  for (const s of ["my car got towed", "I locked my keys in the car", "the intern totally crushed it, damn", "I don't give a damn which font we use"]) all(s).forEach((o) => assert.equal(hasCrude(o), false, o));
});

test("round 12: frames fit the news", () => {
  assert.match(L3("crash rate fell under 0.5%"), /^(?!Surfacing)/);
  assert.doesNotMatch(L3("Ticket closed, customer happy"), /vulnerability/);
  assert.doesNotMatch(L3("anyone know where the HDMI adapters went"), /: Anyone/);
});

test("round 12 decode: the change itself, typed by what changed", () => {
  const cases = [
    ["Expect the new laptops to arrive closer to March than December.", "delay", /late: now around March, not December/],
    ["Our new pricing will take effect in Q3, not Q1 as previously communicated.", "delay", /now around Q3, not Q1/],
    ["Beginning January 1, the company match on 401(k) contributions will be 3% instead of 5%.", "benefits", /drops to 3% \(was 5%\)/],
    ["Sabbatical eligibility now begins after seven years rather than five.", "benefits", /after seven years instead of five/],
    ["The holiday gift card program will not run this year.", "benefits", /going away/],
    ["Parking at the headquarters garage will be $8 per day starting in March.", "cost-increase", /will cost \$8 per day starting in March/],
    ["The cafeteria is moving to a paid model starting January 6.", "cost-increase", /won't be free anymore/],
    ["We will be releasing approximately 1 in 10 contractors at the end of the month.", "layoffs", /1 in 10 contractors are being let go/],
    ["We have made the difficult decision to sunset the Austin engineering hub and the roles within it.", "layoffs", /Austin engineering hub is closing, and the people who work there are losing their jobs/],
    ["Starting next month, Fridays are no longer a remote day.", "rto", /Fridays are now office days/],
    ["Your rating this cycle is Partially Meets.", "performance", /below standard/],
    ["Some employees' October paychecks were calculated incorrectly.", "problem", /paychecks were wrong/],
    ["We'll have more to share at the next town hall.", "hedge", /aren't ready to say/],
    ["After a decade with us, our Chief People Officer will retire in January.", "departure", /Chief People Officer is retiring in January/],
    ["Let's wish Omar the best as he departs.", "departure", /Omar is leaving/],
  ];
  for (const [s, want, line] of cases) { const d = dec(s); assert.equal(d.signal.id, want, `${s} -> ${d.signal.id}`); assert.match(d.summary, line, d.summary); }
});

test("round 12 decode: good news and logistics stay calm", () => {
  assert.ok(["none", "fyi"].includes(sig("We'll be closing the office early on Wednesday at 3pm for the holiday.")));
  assert.match(dec("We'll be closing the office early on Wednesday at 3pm for the holiday.").summary, /office closes early on Wednesday at 3pm for the holiday/);
  for (const s of ["We closed our largest deal in company history this week.", "The commute stipend is doubling starting next month.", "Our audit came back clean with no findings.", "Health premiums will stay flat next year while coverage improves."]) assert.match(dec(s).summary, /^Good news/, s);
  for (const s of ["The team said goodbye to Priya, who is retiring after 30 years.", "The snack bar will be closed Friday for restocking.", "The fourth-floor snack bar will reopen Monday after renovations."]) assert.ok(["none", "fluff", "fyi"].includes(sig(s)), `${s} -> ${sig(s)}`);
  assert.doesNotMatch(dec("Health premiums will stay flat next year while coverage improves.").summary, /cost|pay more/i);
});
