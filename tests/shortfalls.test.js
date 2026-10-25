// Regression tests for the shortfall classes researched in project-synergy-research/shortfalls/research.md:
// missing articles, near-copies at Mild (sarcasm, praise), run-on apologies, slot-fitting swaps,
// and the Full C-Suite composer (frames and closers that match the content).
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate } from "../site/engine.js";
import { prepass, desarcasm, splitApology } from "../site/prepass.js";
import { intentOf } from "../site/csuite.js";

import { stripQuip } from "../site/composer.js";
const L = (s, level) => stripQuip(toCorporate(s, { level }));
const all = (s) => [1, 2, 3].map((l) => L(s, l));

test("dropped articles come back", () => {
  assert.match(L("printer on 2nd floor is jammed", 1), /^.*\bthe printer on the 2nd floor\b/i);
  assert.match(L("website is loading slow", 1), /the website is loading slowly/);
  assert.match(L("backup job failed last night", 1), /the backup job failed/);
});

test("sarcasm becomes its sincere meaning at every level", () => {
  for (const s of ["fun. the build broke again", "wonderful, they changed the requirements again", "oh joy, another survey", "nothing says teamwork like a 6am call"]) {
    for (const out of all(s)) assert.doesNotMatch(out, /^(?:Fun|Wonderful|Oh joy|Nothing says)\b|\bnothing says teamwork\b/i, `${s} -> ${out}`);
  }
  assert.ok(desarcasm("love that for us"));
});

test("praise gets recognition language, not a heads-up label", () => {
  assert.equal(L("the deck looks really good", 1), "The deck looks really good. Great work.");
  assert.match(L("the deck looks really good", 2), /^Kudos:/);
  assert.match(L("great presentation today", 2), /^Kudos on a great presentation today/);
  assert.equal(L("nice work everyone", 1), "Great work, everyone. Thank you.");
});

test("names addressed directly get a comma", () => {
  for (const out of all("happy work anniversary Tom!")) assert.match(out, /anniversary, Tom!/);
  for (const out of all("congrats on the promotion Sam!")) assert.match(out, /promotion, Sam\b/);
  assert.match(L("happy friday everyone", 1), /Friday/);
  assert.doesNotMatch(L("happy friday everyone", 1), /Happy, Friday/);
});

test("run-on apologies split into clean sentences", () => {
  assert.equal(L("sorry I messed up the dates in the invite it's the 12th not the 11th", 1), "Apologies, I made a mess of the dates in the invite. It's the 12th, not the 11th.");
  assert.match(L("sorry for the late reply was out yesterday what do you need", 1), /^Apologies for the late reply\. I was out yesterday\. .*what you need\?$/);
  assert.ok(splitApology("sorry I didn't finish it I got pulled into the outage"));
  assert.match(L("the onboarding has 7 steps, it should have 3", 1), /7 steps\. It should have 3\./);
});

test("Mild hedges opinions instead of copying them", () => {
  assert.equal(L("I disagree with the plan", 1), "I'm not sure I agree with the plan.");
  assert.equal(L("that idea won't work", 1), "I don't think that idea will work.");
  assert.equal(L("I prefer option B", 1), "I'd prefer option B.");
});

test("Middle Manager labels fit the content", () => {
  assert.equal(L("that deadline is impossible", 2), "Flagging that the deadline isn't realistic.");
  assert.match(L("no, the answer is still no", 2), /^That's a no from me: the answer is still no\.(?: Thanks for understanding\.| Appreciate the understanding\.)?$/);
  assert.match(L("cool cool cool, guess I'll do it myself", 2), /^Understood, and noted\./);
  assert.match(L("update the ticket please", 2), /could you please update the ticket\?(?: Appreciate it\.| Appreciate the help\.| Thanks in advance, appreciate it\.)?$/);
  assert.doesNotMatch(L("this needs more work", 2), /heads-up/i);
});

test("Full C-Suite never puts an upbeat closer on bad news", () => {
  const upbeat = /Onward|momentum|flywheel|value creation/;
  for (const s of ["dashboard shows 0 signups since 2pm", "elevator is out again", "wonderful, they changed the requirements again", "website is loading slow", "the vendor fucked up the order", "nope, budget's gone"]) {
    assert.doesNotMatch(L(s, 3), upbeat, s);
  }
});

test("Full C-Suite frames and closers match the intent", () => {
  assert.match(L("thanks Raj, you're a lifesaver", 3), /gratitude/i);
  assert.doesNotMatch(L("ok", 3), /Gratitude/);
  assert.doesNotMatch(L("nvm", 3), /Gratitude/);
  assert.match(L("Lena's dashboard is a game changer", 3), /: Lena's dashboard/);
  assert.doesNotMatch(L("stuck in traffic, 15 min", 3), /\b(\w+) \1\b/);
  assert.doesNotMatch(L("agenda: budget, hiring, offsite", 3), /:[^:]*:/);
  assert.match(L("please send me the deck before 3", 3), /^If you could go ahead and send me the deck before 3, that would be greatly appreciated\./);
  assert.equal(intentOf("love the new logo", "I really like the new logo."), "praise");
});

test("prepass rewrites crude and sarcastic lines to their sincere meaning", () => {
  assert.equal(prepass("this meeting is bullshit"), "I don't think this meeting is a good use of our time.");
  assert.equal(prepass("screw it, ship it"), "Let's go ahead and ship it.");
  assert.equal(prepass("no idea, ask Mia"), "I'm not sure. Mia may know.");
});
