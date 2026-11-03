// Round 19: decode reads number direction and plain policy changes; Full C-Suite puts the joke in the body.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const L3 = (s) => toCorporate(s, { level: 3, seed: 1 });
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 19: decode reads perk numbers going down and prices going up", () => {
  assert.match(sig("Your HSA contribution will be $500 this year instead of $1,000."), /^benefits/);
  assert.match(sig("The rate for parking is increasing to $90 a month."), /^cost-increase/);
});

test("round 19: Full C-Suite says the joke in the body, not a stock sandwich", () => {
  const off = L3("I'd like to fuck off the whole day today");
  assert.match(off, /strategic recharge|recharge|bandwidth/i);
  assert.doesNotMatch(off, /slack off|ecosystem, I'd like|Clarity is our north star|fuck/i);
  assert.match(L3("the audit was a shitstorm from start to finish"), /unplanned stress test of our organizational resilience/);
  assert.match(L3("I passed my CPA exam, finally"), /CPA exam/);
  for (const s of ["I'd like to fuck off the whole day today", "the audit was a shitstorm from start to finish", "kiss my ass, I'm not redoing the deck"])
    for (const level of [1, 2, 3]) assert.ok(!hasCrude(toCorporate(s, { level, seed: 1 })), `${s} L${level}`);
});

test("round 19: kiss my ass stays a no without the crude words", () => {
  for (const level of [1, 2, 3]) assert.match(toCorporate("kiss my ass, I'm not redoing the deck", { level, seed: 1 }), /not redoing the deck/);
});
