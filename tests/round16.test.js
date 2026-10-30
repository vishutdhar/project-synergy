// Round 16 regression tests: "a pain in my ass" never leaves a dangling "pain in my".
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));

test("round 16: pain-in-the-X idiom keeps its meaning for any determiner", () => {
  for (const s of ["this client is a pain in my ass every single week", "the new tool is a real pain in the ass", "legal is a pain in our butt lately", "the audit is a pain in their backside"]) {
    all(s).forEach((o, i) => {
      assert.ok(o.trim().length > 5, `L${i + 1} empty for ${s}`);
      assert.ok(!hasCrude(o), `L${i + 1} crude: ${o}`);
      assert.doesNotMatch(o, /\bpain in (?:my|the|our|their)\b|\bin the mess\b|\bbutt\b|\bbackside\b/i, `L${i + 1}: ${o}`);
    });
  }
});

test("round 16: Vishut's day-off line stays a funny recharge, never slacking", () => {
  const [l1, l2, l3] = all("I'd like to fuck off the whole day today");
  for (const o of [l1, l2, l3]) { assert.ok(!hasCrude(o), o); assert.doesNotMatch(o, /slack(?:ing)? off/i, o); }
  assert.match(l3, /recharge|bandwidth/i, l3);
});

test("round 16: access cut off today is an exit, not a performance warning; maintenance is not news", () => {
  const sig = (s) => toNormal(s, { level: 1 }).signal.id;
  assert.equal(sig("We have made the difficult decision to let you go. Your access will be removed at 5 PM today."), "layoff-you");
  assert.doesNotMatch(toNormal("We have made the difficult decision to let you go. Your access will be removed at 5 PM today.", { level: 1 }).summary, /unhappy with your work/);
  assert.equal(sig("Your VPN access will be removed today for scheduled maintenance."), "none");
  assert.equal(sig("Your guest Wi-Fi access ends today; please request a new code at the desk."), "none");
});
