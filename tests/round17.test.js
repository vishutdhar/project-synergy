// Round 17 regression tests: decode reads good news as good, catches soft layoffs, RTO and no's,
// and the corporate direction fixes broken grammar and keeps crude lines work-safe.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const sig = (s) => toNormal(s).signal.id;

test("round 17: decode families read the real news", () => {
  const cases = [
    ["We are moving from two office days to four office days starting March 1.", "rto"],
    ["Starting in May, required in-office days will increase from two to three.", "rto"],
    ["Base pay will be held at current levels for the coming year.", "no-raises"],
    ["The Basic plan is no longer offered to new customers.", "shutdown"],
    ["After careful consideration, we have decided to keep our current policy.", "rejection"],
    ["We have decided to pass on the acquisition.", "rejection"],
    ["Bonuses normally paid in March will be paid in June this year.", "delay"],
    ["Carla is leaving to pursue her next adventure.", "departure"],
    ["We will monitor conditions and changes may be necessary.", "hedge"],
    ["There will be a new $15 fee on paper statements starting November 1.", "cost-increase"],
    ["The learning budget doubles to $2,000 per person next year.", "good-news"],
    ["The cafeteria will now offer free lunch on Fridays.", "good-news"],
  ];
  for (const [s, id] of cases) assert.equal(sig(s), id, s);
});

test("round 17: negated or neutral lines are never good news and never invent bad news", () => {
  for (const s of ["Merit increases have been deferred to next year.", "There will be no salary increases this year."]) assert.notEqual(sig(s), "good-news", s);
  for (const s of ["Holiday decorations go up in the lobby on Monday.", "The team meeting is at 3 PM in Room 4.", "The new dry cleaning service opens in the lobby on Tuesday."]) assert.equal(sig(s), "none", s);
});

test("round 17: decode wording has no broken grammar", () => {
  for (const s of ["We have decided to pass on the acquisition.", "We are running late on the launch.", "The parking fee at headquarters will cost more next year."]) {
    const r = toNormal(s); const t = [r.summary, ...r.lines.map((l) => l.plain)].join(" ");
    assert.doesNotMatch(t, /\bWe is\b|\bwill cost more\b|\bfee at headquarters are\b|\bThey'll not\b/, t);
  }
});

test("round 17: corporate direction keeps meaning and fixes grammar", () => {
  const cases = [
    ["the printer is being a little bitch again", /printer|print/i, /being a bit\b|bitch/i],
    ["we sat on our asses for a month", /sat on our hands|watchful waiting/i, /sat on our\.|asses/i],
    ["stop screwing with the config", /config/i, /screwing/i],
    ["cut the crap, what's the deadline", /\?/, /junk|crap/i],
    ["does anyone want coffee", /coffee\?/i, /would like|Could anyone would/i],
    ["wow, a whole 2% raise, I'm overwhelmed", /2% raise/i, /I'm overwhelmed/i],
    ["my brain is done", /exhausted|cognitive|bandwidth/i, /brain is completed/i],
  ];
  for (const [s, keep, bad] of cases) all(s).forEach((o, i) => {
    assert.ok(!hasCrude(o), `L${i + 1} crude: ${o}`);
    assert.match(o, keep, `L${i + 1}: ${o}`);
    if (!/would like/.test(bad.source) || /Could anyone would/.test(o)) assert.doesNotMatch(o, bad, `L${i + 1}: ${o}`);
  });
});

test("round 17: Full C-Suite inflates the mundane body, keeping numbers", () => {
  const l3 = (s) => toCorporate(s, { level: 3, seed: 1 });
  assert.match(l3("I worked 14 hours yesterday"), /14 hours of discretionary passion/);
  assert.match(l3("the VPN died again"), /VPN entered an unscheduled rest period/);
  assert.match(l3("What a surprise, the meeting ran over"), /nsurprisingly/);
});

test("round 17: list layout survives the round 17 cleanup", () => {
  const o = toCorporate("todo:\n- fix login\n- email finance\n- book flights", { level: 3, seed: 1 });
  assert.match(o, /- Book flights\n/);
});

test("round 17: exclamations are not questions, and deferred raises are not good news", () => {
  for (const o of all("how wonderful, mandatory fun on a saturday")) assert.doesNotMatch(o, /\?/, o);
  assert.equal(sig("Despite our strong results, we've made the prudent decision to defer merit increases until mid-year."), "no-raises");
});

test("round 17: 'quick q' yes/no questions stay questions without a stray 'quick query'", () => {
  for (const o of all("quick q, are we still doing the offsite in march")) { assert.match(o, /are we still doing the offsite in March\?/, o); assert.doesNotMatch(o, /quick query/i, o); }
  assert.match(toCorporate("quit bitching about the parking and carpool", { level: 2, seed: 1 }), /: stop complaining/);
});

test("round 17b: plain-spoken bad news is read, not 'nothing hidden'", () => {
  const cases = [
    ["We are making changes that will result in fewer roles in our customer support organization.", "layoffs"],
    ["Departing team members will not be replaced at this time.", "hiring-freeze"],
    ["Remote employees will be asked to relocate to one of our three hubs by June.", "rto"],
    ["A service charge of $5 will now be added to orders under $50.", "cost-increase"],
    ["Your proposal was carefully reviewed, but we will be going in a different direction.", "rejection"],
    ["Our cash position is tighter than we projected.", "problem"],
    ["Your probation period has been extended by 60 days.", "performance"],
    ["We are aware of the rumors and will address them at the appropriate time.", "hedge"],
    ["Please join me in congratulating Wei on her retirement after 22 years.", "departure"],
    ["We are offering early retirement packages to eligible employees.", "layoffs"],
    ["Your role may be at risk if things don't improve.", "performance"],
  ];
  for (const [s, id] of cases) assert.equal(sig(s), id, s);
  for (const s of ["Please lock your screen when you step away.", "Your order will now ship in 10 to 14 days."]) assert.notEqual(sig(s), "departure", s);
  assert.notEqual(sig("Your order is taking longer than expected and will now ship in 10 to 14 days."), "rto");
});

test("round 17b: corporate direction fixes broken requests, causality, party frames and violent idioms", () => {
  const cases = [
    ["open rate on the newsletter fell from 41% to 22%", /open rate on the newsletter fell from 41% to 22%/i, /Could you open|go ahead and open/],
    ["every time I fix something, someone breaks it in the next release", /someone breaks it/, /Could someone breaks/],
    ["I'm going to Japan for two weeks in december, already approved", /already approved/, /the already/],
    ["no, I'm not going to rewrite the whole thing two days before launch", /rewrite/, /won't be going to rewrite/],
    ["I'll be offline from noon, flying to Denver for the conference", /Denver/, /, so I'm flying/],
    ["these quarterly goals are pulled straight out of someone's ass", /thin air/, /someone's\./],
    ["whoever wrote this legacy code should be shot, it's unreadable", /explaining to do/, /shot/],
    ["the offshore team shipped garbage and we have to clean it up", /clean it up/, /garbage|happy to share|Quick win|Kudos|celebrate/i],
  ];
  for (const [s, keep, bad] of cases) all(s).forEach((o, i) => {
    assert.ok(!hasCrude(o), `L${i + 1} crude: ${o}`);
    assert.match(o, keep, `L${i + 1}: ${o}`);
    assert.doesNotMatch(o, bad, `L${i + 1}: ${o}`);
  });
  assert.match(toCorporate("the power is out, on a hotspot", { level: 1, seed: 1 }), /so I'm on a hotspot/);
});
