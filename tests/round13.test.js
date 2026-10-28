// Round 13 regression tests: fresh40 general families, decode readers, and the regressions found in the fresh24-39 sweep.
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
const sig = (s) => dec(s).signal.id;

test("round 13: Vishut's fuck-off regression stays fixed at Full C-Suite", () => {
  const out = L3("I'd like to fuck off the whole day today");
  assert.doesNotMatch(out, /slack off|fuck|For full visibility across the ecosystem|Clarity is our north star/i);
  assert.match(out, /strategic|recharge|offline|bandwidth/i);
  assert.match(L3("I'd like to fuck off early today"), /strategic early departure today/);
});

test("round 13: crude phrases never leak and never come back empty", () => {
  for (const s of ["honestly the QA team is half-assing it", "legal is dragging their asses on the contract", "tell legal to get off their asses and sign it", "I'm fucking done with this ticket", "the board is going to rip us a new one"]) {
    for (const o of all(s)) { assert.ok(o.trim().length > 0, `empty for ${s}`); assert.ok(!hasCrude(o), `${s} -> ${o}`); }
  }
  every("legal is dragging their asses on the contract", /legal is (?:moving slowly on|slow-walking) the contract/i);
  assert.match(L1("I'm fucking done with this ticket"), /fed up with this ticket/);
  every("the board is going to rip us a new one", /critical of us/);
});

test("round 13: chat fragments and sarcasm read right", () => {
  assert.equal(L1("no fucking way we hit friday"), "I don't think we can hit Friday.");
  every("jesus christ, another reorg", /there's another reorg/);
  every("perfect timing for the server to crash", /timing of the server crashing,?(?: while bold,)? wasn't ideal/);
  every("clearly the best use of my time is updating slides", /I'm not sure updating slides is the (?:best|highest-leverage) use of my time/);
  every("good thing nobody reads the docs anyway", /I'm not sure anyone reads the/);
  every("love a surprise reorg on a tuesday", /I'm not a fan of a surprise reorg on a Tuesday/);
  every("the new hire is crushing it, damn", /doing great/); none("the new hire is crushing it, damn", /oh no|unfortunately/i);
  every("migration 80% done", /the migration is 80% done/);
  every("costs went up 18%", /costs (?:went up|increased by) 18%/); none("costs went up 18%", /went is/);
  every("revenue flat vs last quarter", /revenue is flat compared with last quarter/i);
  every("conversion is up from 3% to 4.5%", /up from 3% to 4\.5%/);
  every("jury duty all next week", /jury duty/);
  every("server rebooted, all good", /rebooted, and it's back to normal/);
  every("bug repro'd, fixing", /I've reproduced the/);
  every("pairing with Leo till 3", /with Leo until 3/);
  every("running to grab a sandwich, want anything", /Would anyone like anything\?/);
  every("anyone want to split a pizza", /(?:would anyone like|does anyone want) to split a pizza\?/i); none("anyone want to split a pizza", /does anyone would/i);
  every("doctor's appointment this afternoon", /I have a doctor's appointment this afternoon/);
  assert.match(L1("the onboarding was useless"), /I don't think the onboarding was very useful/);
  assert.match(L1("the wifi in the conference room is useless"), /isn't much help/);
});

test("round 13: Full C-Suite spins stay grammatical", () => {
  assert.match(L3("I double booked the room"), /I accidentally double-allocated the room\./);
  assert.match(L3("so glad we spent the budget on new logos"), /Proud of our bold decision to allocate the budget to new logos/);
  assert.match(L3("our onboarding docs are crap"), /onboarding knowledge assets are/);
  assert.match(L3("I sprained my ankle at soccer"), /I sprained my ankle at soccer, so my mobility infrastructure/);
  assert.doesNotMatch(L3("my flight got canceled, joining remote"), /descoped, so I'll join remotely.*so|so .* so my air-travel/);
  assert.match(L3("my basement flooded overnight"), /flooded overnight, an unplanned/);
});

test("round 13: decode names the real change", () => {
  assert.match(dec("The tuition reimbursement cap is being lowered to $2,500.").summary, /\$2,500/);
  assert.match(dec("The fertility benefit lifetime maximum is being lowered to $10,000.").summary, /\$10,000/);
  assert.match(dec("Annual bonus targets will be adjusted from 15% to 10% of base salary.").summary, /from 15% to 10% of base salary\./);
  const cases = [
    ["Floating holidays are going from four to two.", "benefits", /four to two/],
    ["Catered breakfast will move from daily to Mondays only.", "benefits", /daily to Mondays only/],
    ["The home office allowance will only be available to new hires.", "benefits", /only for new hires/],
    ["Wellness days will now count against your PTO balance.", "benefits", /use up your PTO/],
    ["Dependent care accounts will be capped at $2,000 per year.", "benefits", /\$2,000 per year/],
    ["The summer Fridays program will not return this year.", "benefits", /summer Fridays/],
    ["We are discontinuing the pet insurance benefit.", "benefits", /pet insurance/],
    ["Bonuses are being cut.", "benefits", /bonuses are being cut/],
    ["The data labeling work will move to a vendor, and the in-house labeling team will be released.", "layoffs", /losing their jobs/],
    ["We are removing two management levels.", "layoffs", /manager/],
    ["Your equipment order is backordered and should arrive in six to eight weeks.", "delay", /six to eight weeks/],
    ["The annual pay review will take place in the summer instead of the spring.", "delay", /summer instead of the spring/],
    ["New vendor contracts are on hold until January.", "budget-freeze", /until January/],
    ["We're not opening any new roles this quarter.", "hiring-freeze", /Hiring is frozen/],
    ["Employees who prefer not to return may be eligible for a voluntary buyout.", "rto", /buyout/],
    ["Core collaboration days are now Monday through Thursday in the office.", "rto", /Monday through Thursday/],
    ["Each region will now be led by a single general manager.", "reorg", /one leader/],
    ["Free shipping now requires a minimum order of $50.", "cost-increase", /\$50/],
    ["Your plan will now include 3 seats instead of 5 at the same price.", "cost-increase", /3 seats instead of 5/],
    ["The education discount will no longer apply to renewals.", "cost-increase", /renewals/],
    ["To keep investing in the product, the Team plan will move from $10 to $14 per user per month starting December 1.", "cost-increase", /\$10 to \$14/],
    ["After this season, the company softball league will come to an end.", "shutdown", /softball league is ending/],
    ["The legacy intranet will go read-only on December 1 and then be shut off.", "shutdown", /read-only/],
    ["The new feature caused a spike in support tickets.", "problem", /Something went wrong/],
    ["Moving forward, I'll need to approve your work before it goes to the client.", "performance", /concerns about your work/],
    ["Your bonus this year will be below target based on your rating.", "performance", /bonus is smaller/],
    ["We're reviewing our portfolio to make sure we focus on the highest-impact work.", "hedge", /may be cut/],
    ["After 12 years, Linda will be retiring in December.", "departure", /Linda is retiring/],
  ];
  for (const [s, id, re] of cases) { const d = dec(s); assert.equal(d.signal.id, id, `${s} -> ${d.signal.id}: ${d.summary}`); assert.match(d.summary, re, `${s} -> ${d.summary}`); }
});

test("round 13: decode false alarms stay quiet", () => {
  for (const s of ["The office will close at noon on Christmas Eve.", "The office will close at 2pm on New Year's Eve.", "The office will close early on Friday for the holiday."]) assert.ok(["none", "fyi", "fluff"].includes(sig(s)), `${s} -> ${sig(s)}`);
  for (const s of ["We're closing the office the week between Christmas and New Year's, fully paid.", "We're giving everyone a learning budget of $1,000 a year.", "Thanks to strong results, merit increases will average 4.5%.", "We're adding a new paid holiday."]) assert.equal(sig(s), "good-news", `${s} -> ${sig(s)}`);
  for (const s of ["We will be retiring the desktop app on March 1.", "We are sunsetting the legacy reporting dashboard in March."]) assert.equal(sig(s), "shutdown", s);
  assert.doesNotMatch(dec("We're closing the office the week between Christmas and New Year's, fully paid.").summary, /fully paid, and you still get paid/);
  const snack = dec("Team, the snack bar on 3 will be closed for restocking on Friday. Normal service resumes Monday.");
  assert.notEqual(snack.signal.id, "shutdown");
  assert.equal(sig("The new HR system will launch in March rather than January."), "delay");
  assert.match(dec("The new HR system will launch in March rather than January.").summary, /March, not January/);
});
