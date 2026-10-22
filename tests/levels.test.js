// Corporate levels: Mild, Middle Manager and Full C-Suite must read as three distinct, rising registers
// (see /workspace/project-synergy-research/corporate-levels/research.md for the spec).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { toCorporate, toNormal, normalizeCasual, normalizeInput } from "../site/engine.js";
import { distinctness, tokenSim, corporateScore } from "../site/register.js";
import { checkMeaning } from "../site/meaning.js";

const corp = (text, level) => toCorporate(text, { level, seed: 1 });
const items = JSON.parse(fs.readFileSync(new URL("./variations/items.json", import.meta.url))).filter((i) => i.direction === "toCorporate");

test("the reported examples now read as corporate at Mild and Middle Manager", () => {
  assert.equal(corp("gonna be l8 sry", 1), "Apologies, I'm running a bit behind.");
  assert.equal(corp("gonna be l8 sry", 2), "Quick heads-up, and apologies: I'm running behind schedule.");
  assert.equal(corp("we need more than 2 days to test", 1), "I think we'll need more than 2 days to test.");
  assert.equal(corp("we need more than 2 days to test", 2), "Flagging that testing will need more than 2 days.");
  assert.match(corp("we need more than 2 days to test", 3), /Testing will require a runway of more than 2 days\./);
});

test("requests become indirect, questions get framed, needs get nominalized", () => {
  assert.equal(corp("pls send me the deck", 1), "Could you please send me the deck?");
  assert.equal(corp("who approved this?", 1), "Could you let me know who approved this?");
  assert.equal(corp("why am I on this thread", 1), "Could you help me understand why I'm on this thread?");
  assert.equal(corp("can we push the launch to next month?", 2), "Would it be possible to shift the launch to next month?");
  assert.equal(corp("let's move the retro to after lunch", 1), "I'd suggest we move the retro to after lunch.");
  assert.equal(corp("dont use the dashboard", 1), "Please don't use the dashboard.");
});

test("framing never adds a fact, a meeting, a person or a promise", () => {
  for (const item of items) {
    const input = normalizeCasual(normalizeInput(item.input)) || item.input;
    for (const level of [1, 2]) {
      const out = corp(item.input, level);
      const m = checkMeaning(input, out);
      assert.ok(m.ok, `${item.id} L${level}: ${out} (${[...m.lost, ...m.added].join(",")})`);
      assert.doesNotMatch(out, /\b(?:I'll follow up|let's sync|by EOD|touch base|I'll get back to you|circle back)\b/i.test(item.input) ? /$^/ : /\b(?:I'll follow up|let's sync|touch base|I'll get back to you|circle back)\b/i, `${item.id} L${level}: ${out}`);
    }
  }
});

test("distinctness: Mild moves away from the input and the levels rise", () => {
  let flat = 0, same12 = 0, rising = 0;
  for (const item of items) {
    const input = normalizeCasual(normalizeInput(item.input)) || item.input;
    const outs = [1, 2, 3].map((l) => corp(item.input, l));
    const d = distinctness(input, outs);
    if (d.includes("flat-mild")) flat++;
    if (d.includes("mild=middle")) same12++;
    if (!d.includes("not-rising")) rising++;
  }
  const n = items.length;
  // Floors set from the Oct 22 round (flat 16%, same 5%, rising 97%). Short social replies and sarcasm stay close to the input.
  assert.ok(flat / n <= 0.18, `flat Mild ${flat}/${n}`);
  assert.ok(same12 / n <= 0.07, `Mild equals Middle ${same12}/${n}`);
  assert.ok(rising / n >= 0.95, `rising ${rising}/${n}`);
  assert.ok(tokenSim("same words here", "Same words here.") === 1);
  assert.ok(corporateScore("Flagging that our bandwidth is low") > corporateScore("Our time is short"));
});

test("a blunt no from Legal decodes as a blunt no", () => {
  const t = "legal said no on using the customer logo";
  assert.equal(toNormal(t, { level: 1 }).summary, "It's a no from Legal.");
  assert.equal(toNormal(t, { level: 2 }).summary, "Legal said no. It's a flat no.");
  for (const l of [1, 2, 3]) assert.doesNotMatch(toNormal(t, { level: l }).summary, /kindly|polite/i);
  // A softened no is still read as the polite kind.
  assert.match(toNormal("Unfortunately, legal said no at this time, but we can revisit next quarter", { level: 1 }).summary, /kindly/);
});
