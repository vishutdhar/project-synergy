// Round 10 regression tests (project-synergy-research/round10): satirical composer, casual phrases, broad decode families.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";
import { topicOf } from "../site/composer.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const L3 = (s) => toCorporate(s, { level: 3, seed: 1 });
const dec = (s, level = 1) => toNormal(s, { level });

test("composer: Full C-Suite inflates the clause and adds a topic frame and closer", () => {
  const o = L3("I have 200 unread emails");
  assert.match(o, /200/);
  assert.ok(o.split(/(?<=[.!?:])\s+/).length >= 3, o);
  assert.match(L3("the printer is jammed again"), /print infrastructure/);
});

test("composer: topic picks ignore look-alike words", () => {
  assert.equal(topicOf("heading to the doctor, back after lunch") === "food", false);
  assert.equal(topicOf("out of office until Monday"), "away");
  assert.notEqual(topicOf("happy to pair on it"), "feelings");
});

test("composer: no food frame for lunch as a time, and no inflation of who ate my food", () => {
  assert.doesNotMatch(L3("merged the PR, deploying after lunch"), /nourishment|refuel/i);
  assert.doesNotMatch(L3("who ate my yogurt"), /absorbed/);
  assert.doesNotMatch(L3("the onboarding docs are out of date"), /ecosystem are/);
});

test("casual: chat fragments become full sentences", () => {
  every("one sec", /second/);
  every("brb 5", /back in 5 minutes/);
  every("all set", /I'm all set/);
  every("pto next friday fyi", /PTO next Friday/);
  every("wdyt about moving the launch", /thoughts on moving the launch/);
  every("nbd, I'll redo it", /I'll redo it/);
  for (const o of all("nbd, I'll redo it")) assert.doesNotMatch(o, /No significant/);
  every("bus broke down, 30 min late", /my bus broke down, so I'll be 30 minutes late/i);
  every("flight delayed, landing at 6 now", /landing at 6/);
  every("logging off early today", /early|ahead of schedule/);
});

test("casual: sarcastic 'love when' reads as a complaint only with a clear bad event", () => {
  every("love when the wifi drops mid-call", /not thrilled/);
  for (const o of all("love that you shipped it")) assert.doesNotMatch(o, /not thrilled/);
});

test("swear check: crapped out is cleaned", () => {
  for (const o of all("the server crapped out again")) { assert.ok(!hasCrude(o), o); assert.doesNotMatch(o, /crap/i); }
});

test("greetings and birthdays stay warm at Middle Manager", () => {
  assert.match(toCorporate("morning team", { level: 2, seed: 1 }), /^Good morning, team!/);
  assert.match(toCorporate("happy birthday Tom", { level: 2, seed: 1 }), /^Happy birthday, Tom!/);
  assert.doesNotMatch(toCorporate("where did the shared Figma link go", { level: 1, seed: 1 }), /Thank you, Where/);
});

test("decode: broad families name the change without inventing more", () => {
  assert.equal(dec("We need a few more weeks to finalize the release.").signal.id, "delay");
  assert.equal(dec("Copay amounts for specialist visits are increasing to $50.").signal.id !== "good-news", true);
  assert.equal(dec("Your manager has raised concerns about your attendance.").signal.id, "performance");
  assert.equal(dec("We are evaluating all options.").signal.id, "hedge");
  const d = dec("Our head of sales is transitioning out of the business.");
  assert.equal(d.signal.id, "departure");
  assert.doesNotMatch(d.summary + d.lines.map((l) => l.plain).join(" "), /losing their jobs|wasn't their idea/);
  const o = dec("Our customers were affected by the outage last night.");
  assert.doesNotMatch(o.lines.map((l) => l.plain).join(" "), /layoff|cut/i);
});

test("decode: the sudden-exit line needs evidence", () => {
  const a = dec("Our CTO is stepping down, effective immediately.").lines.map((l) => l.plain).join(" ");
  assert.match(a, /sudden/);
  const b = dec("Maya is leaving us at the end of the month to start her own company.").lines.map((l) => l.plain).join(" ");
  assert.doesNotMatch(b, /sudden|wasn't their idea/);
});
