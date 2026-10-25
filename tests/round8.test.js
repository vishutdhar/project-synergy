// Round 8 regression tests (project-synergy-research/round8): general classes found on fresh batches 13 to 15.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { conceptThemes } from "../site/decode-concepts.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));
const sig = (s) => toNormal(s, { level: 2 }).signal.id;

test("decode: new wordings of the same news get the right signal", () => {
  const cases = [
    ["As part of our efforts to align resources with strategic priorities, a number of roles will be impacted.", "layoffs"],
    ["Today we said goodbye to some talented colleagues as we reshape the organization.", "layoffs"],
    ["We have made the difficult decision to reduce the size of our sales organization.", "layoffs"],
    ["We'll be saying farewell to a number of valued team members this week.", "layoffs"],
    ["The launch will now take place in the second half of the year.", "delay"],
    ["To ensure a high-quality experience, we are revisiting the release schedule.", "delay"],
    ["We now expect the new billing system to go live in early spring rather than January.", "delay"],
    ["We are targeting a revised launch window in Q3.", "delay"],
    ["Beginning in March, employees will contribute a larger share of health insurance costs.", "benefits"],
    ["We are moving to a more flexible PTO approach, replacing accrued vacation.", "benefits"],
    ["Starting next year, the company match on 401(k) contributions will be capped at 3%.", "benefits"],
    ["We are evolving our wellness program, and the monthly gym subsidy will no longer be offered.", "benefits"],
    ["Employees will now need to use PTO for the week between Christmas and New Year's.", "benefits"],
    ["We believe our best work happens when we are together, so we are updating our workplace policy.", "rto"],
    ["We're asking everyone to be in the office on Tuesdays, Wednesdays, and Thursdays.", "rto"],
    ["After careful consideration, we will not be able to extend an offer at this time.", "rejection"],
    ["We appreciate the proposal, but it doesn't align with our current priorities.", "rejection"],
    ["Unfortunately, we won't be moving ahead with your proposal at this stage.", "rejection"],
    ["We've reviewed your promotion case, and the timing isn't right this cycle.", "rejection"],
    ["While we were impressed with your background, we have decided to pursue other candidates.", "rejection"],
    ["Let's put a pin in that and revisit next quarter.", "deflection"],
    ["I'll take that back to the team.", "deflection"],
    ["Thanks for the feedback, we'll take it under consideration.", "deflection"],
    ["Effective Monday, the platform team will be part of the infrastructure organization.", "reorg"],
    ["As of next week, the design team will roll up under the product organization.", "reorg"],
    ["I'd like to set up weekly check-ins to make sure you have the support you need to succeed.", "pip"],
    ["We need to see meaningful improvement in your communication over the next 60 days.", "pip"],
    ["Going forward, I'll be documenting our weekly conversations so we're aligned on expectations.", "pip"],
    ["We will be transitioning first-line support to our partner in Manila.", "outsourcing"],
    ["We have selected an external partner to manage our payroll processing going forward.", "outsourcing"],
    ["We are being thoughtful about headcount for the rest of the year.", "hiring-freeze"],
    ["We're asking teams to be mindful of discretionary spend for the remainder of the year.", "budget-freeze"],
  ];
  for (const [s, want] of cases) assert.equal(sig(s), want, s);
});

test("decode: plain notes that share words with the news stay plain", () => {
  for (const s of [
    "The launch is on track for March 3.", "We shipped the release ahead of schedule.", "Please submit your PTO requests for December by Friday.",
    "Reminder that the holiday party is on the 18th.", "Welcome to the team! Your onboarding check-ins will help you succeed in your first 90 days.",
    "The support team will move to the 4th floor next month.", "Let's revisit the agenda before the meeting.", "Our customers were affected by the outage last night.",
    "The team said goodbye to Priya, who is retiring after 30 years.", "We'll move the migration to the new cluster this weekend.", "I'll take that back to my desk and finish it.",
    "We'll be careful with the new hires' laptops.", "Please be in the office by 9 on Thursday for the fire drill.", "Everyone is welcome to work from the office on Fridays if they like.",
    "We'll reduce the size of the weekly meeting to just leads.", "We've chosen a vendor to cater the holiday party.", "The new billing system goes live in January as planned.",
    "We're moving ahead with the new logo next week.", "Let's document the API before the handoff.", "Please be mindful of noise in the quiet zone.",
  ]) assert.ok(["none", "fluff"].includes(sig(s)), `${s} -> ${sig(s)} ${JSON.stringify(conceptThemes(s))}`);
});

test("decode: concept lines carry the specific news without overclaiming", () => {
  assert.match(toNormal("We are moving to a more flexible PTO approach, replacing accrued vacation.", { level: 2 }).summary, /banked vacation/);
  assert.match(toNormal("Beginning in March, employees will contribute a larger share of health insurance costs.", { level: 1 }).summary, /pay more of your health insurance/);
  // Weekly check-ins are closer watching, not a PIP yet.
  assert.doesNotMatch(toNormal("I'd like to set up weekly check-ins to make sure you have the support you need to succeed.", { level: 2 }).summary, /You're on a PIP/);
  assert.match(toNormal("Let's put a pin in that and revisit next quarter.", { level: 3 }).summary, /shelved/);
  // A polite no that also says "keep it in mind" is a no, not a non-answer.
  assert.equal(sig("Thanks for the pitch. It's not quite the right fit for our roadmap, but we'll keep it in mind."), "rejection");
});

test("comma fragments in status lines become full clauses", () => {
  every("db is at 92% disk, need to clean up logs today", /the database is at 92% disk, so I (?:need|have) to clean up logs today/);
  every("pushed the migration to staging, prod tomorrow if nothing breaks", /and the production release is planned for tomorrow if nothing breaks/);
  every("finished the first draft, sending it over after lunch", /and I'll send it (?:over )?after lunch/);
  none("finished the first draft, sending it over after lunch", /over over/);
  every("the payment service is throwing 500s, rolling back now", /and I'm rolling back now/);
  every("I'm stuck on the auth bug, might need help", /and I might need/);
  every("the sprint is basically done, two tickets left", /with two tickets left/);
  every("gonna be late, train's delayed", /behind(?: schedule)? because my train is delayed/);
  every("bloody hell, the train is cancelled again", /the train is cancelled again/);
  every("running 10 late, start without me", /10 minutes (?:late|behind schedule)\. (?:Please|Could you please) start without me/);
  none("running 10 late, start without me", /I'm start/);
});

test("slang praise, useless things, and blame admissions read right", () => {
  every("the new dashboard looks sick", /looks great/);
  every("this writeup is fire", /is great/);
  every("the wifi in the conference room is useless", /isn't much help/);
  every("lol yeah that's on me, my bad", /(?:Sorry|Apologies|apologies), that's on me/);
  none("lol yeah that's on me, my bad", /Sounds good/);
  every("ya that works for me", /That works for me/i);
  none("ya that works for me", /Sounds good|status update/i);
  every("you guys killed it on the launch", /killed it on the (?:launch|go-live)/);
  none("you guys killed it on the launch", /I've noticed/);
  none("dude, the demo crashed in front of the client, I'm so screwed", /\bFriend\b|, I'm in/);
});

test("sarcasm with a thanks tail or 'love doing X' at a bad time", () => {
  every("wow, a pizza party instead of raises, thanks", /not thrilled about the pizza party instead of raises\./);
  every("love getting meeting invites at 6pm on a friday", /not thrilled about getting .* at 6pm on a Friday/);
  every("love working through lunch every day", /not thrilled about working through lunch every day/);
});

test("small grammar fixes from fresh batches", () => {
  assert.equal(toCorporate("what's the plan if the vendor doesn't deliver", { level: 1 }), "Could you let me know what the plan is if the supplier doesn't deliver? Thanks!");
  every("can't make the 4pm, I have a dentist appointment", /I have a dentist appointment/);
  every("legal still hasn't reviewed the NDA", /\b[Ll]egal still hasn't reviewed the NDA/);
  none("legal still hasn't reviewed the NDA", /the legal/);
  every("the release went out last night, no issues so far", /There have been no issues so far/);
  assert.doesNotMatch(toCorporate("send me the final numbers when you have them", { level: 2 }), /^When you get a chance/);
  assert.doesNotMatch(toCorporate("these slides have way too much text", { level: 2 }), /much too much/);
});
