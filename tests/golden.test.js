// Golden corpus and property tests. Part of npm test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toNormal, toCorporate, toCorporateDetailed, mulberry32 } from "../site/engine.js";
import { THEMES } from "../site/phrasebook.js";
import { checkMeaning, negations, numbers, names, listLines } from "../site/meaning.js";
import { DECODE, CORPORATE } from "./golden.js";

const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const HEDGES = /\b(?:would rather not|'d rather not|prefer not|might not|may not|probably not|maybe not|not right now|not in the near term|for now)\b/i;

test("golden corpus has at least 60 inputs across both directions and all 3 levels", () => {
  assert.ok(DECODE.length + CORPORATE.length >= 60, `${DECODE.length + CORPORATE.length}`);
  for (const set of [DECODE, CORPORATE]) assert.deepEqual([...new Set(set.map((x) => x.level))].sort(), [1, 2, 3]);
  // Every signal the detector knows about has at least two examples.
  for (const id of ["layoff-you", "layoffs", "budget-freeze", "hiring-freeze", "rejection", "delay", "outsourcing", "shutdown", "deflection", "new-chapter", "pip", "stack-rank", "reorg"]) {
    assert.ok(DECODE.filter((d) => d.signal === id).length >= 2, id);
  }
});

// ---------- Corporate to normal ----------
for (const [i, d] of DECODE.entries()) {
  test(`decode ${i + 1}: ${d.signal} at level ${d.level}`, () => {
    const r = toNormal(d.input, { level: d.level });
    assert.equal(r.signal.id, d.signal, `${r.signal.id} (${r.themes.join(", ")}): ${d.input}`);
    assert.ok(r.signal.label.length > 2);
    if (d.label) assert.equal(r.signal.label, d.label);
    for (const id of d.also ?? []) assert.ok(r.themes.includes(id), `missing ${id}`);
    // The summary leads with the signal: the top theme's own summary, or a combo line about it.
    // Round 9: a sentence with a plain news line (news.js) leads with that line, which names the actual change.
    const newsLead = r.lines.some((l) => l.news && r.summary.startsWith(l.plain));
    if (themeById[d.signal] && !d.also) assert.ok(newsLead || r.summary.startsWith(themeById[d.signal].summary[d.level - 1]), r.summary);
    if (d.signal === "none" || d.signal === "fluff") assert.equal(r.themes.length, 0);
    else assert.doesNotMatch(r.summary, /says what it says|Nothing hidden|Nothing to decode/);
  });
}

test("decode property: same signal at every level, and the wording changes with the level", () => {
  for (const d of DECODE) {
    const runs = [1, 2, 3].map((level) => toNormal(d.input, { level }));
    assert.equal(new Set(runs.map((r) => r.signal.id)).size, 1, d.input);
    if (d.signal !== "none") assert.equal(new Set(runs.map((r) => r.summary)).size, 3, d.input);
  }
});

test("decode property: 'new chapter' in a CEO memo is not a LinkedIn post", () => {
  const r = toNormal("We will come out stronger and win in this next chapter for Corvane.");
  assert.ok(!r.themes.includes("new-chapter"));
});

test("decode property: the personal layoff headline wins over the general one", () => {
  const r = toNormal("Unfortunately, your position has been eliminated as part of the reduction in force.", { level: 2 });
  assert.equal(r.signal.id, "layoff-you");
  assert.equal(r.summary, "You're being laid off.");
});

// ---------- Normal to corporate ----------
for (const [i, c] of CORPORATE.entries()) {
  test(`corporate ${i + 1} keeps its meaning at every level and seed: ${c.input.split("\n")[0].slice(0, 48)}`, () => {
    for (const level of [1, 2, 3]) {
      for (const seed of SEEDS) {
        const r = toCorporateDetailed(c.input, { level, seed });
        const where = `L${level} seed ${seed}: ${JSON.stringify(r.text)}`;
        assert.ok(r.check.ok, `${JSON.stringify(r.check)} ${where}`);
        for (const k of c.keep ?? []) assert.ok(r.text.includes(k), `lost "${k}" ${where}`);
        if (c.list) assert.equal(listLines(r.text), c.list, where);
        assert.doesNotMatch(r.text, HEDGES, where);
        assert.ok(negations(r.text) >= negations(c.input), where);
      }
    }
    // The level the corpus names gives a real rewrite, not the input back.
    if (!/^(?:Who approved this\?|I'm not going to work this weekend\.)$/.test(c.input)) {
      const outs = SEEDS.map((seed) => toCorporate(c.input, { level: Math.max(c.level, 2), seed }));
      assert.ok(outs.some((o) => o !== c.input), c.input);
    }
  });
}

test("won't never turns into 'would rather not'", () => {
  for (const level of [1, 2, 3]) {
    for (const seed of SEEDS) {
      for (const input of ["I won't make the meeting.", "I won't do it.", "We won't ship on Friday.", "No.", "Nope, never."]) {
        const out = toCorporate(input, { level, seed });
        assert.doesNotMatch(out, HEDGES, out);
        assert.ok(negations(out) >= negations(input), out);
      }
    }
  }
});

// Random sentences built from parts. Each one must keep its no, its question, its numbers, names and list.
const PARTS = {
  who: ["I", "We", "Dana", "The team", "Marcus and Priya", "My boss"],
  neg: ["won't", "can't", "don't", "will never", "did not", "aren't going to"],
  verb: ["ship", "fix", "approve", "review", "send", "finish", "pay"],
  obj: ["the report", "the 3 bugs", "the $1,200 invoice", "the Q2 plan", "the new logo", "this idea", "the API"],
  when: ["", " by Friday", " today", " before 5pm", " on March 3", " this week", " next week"],
};
function randomInput(rng) {
  const p = (arr) => arr[Math.floor(rng() * arr.length)];
  const sentence = () => {
    const who = p(PARTS.who);
    let neg = p(PARTS.neg);
    if (/^(?:Dana|The team|My boss)$/.test(who) && neg === "don't") neg = "doesn't";
    if (/^(?:Dana|The team|My boss)$/.test(who) && neg === "aren't going to") neg = "isn't going to";
    if (who === "I" && neg === "aren't going to") neg = "am not going to";
    return `${who} ${neg} ${p(PARTS.verb)} ${p(PARTS.obj)}${p(PARTS.when)}.`;
  };
  const kind = rng();
  if (kind < 0.25) return `${sentence()} Can you ${p(PARTS.verb)} ${p(PARTS.obj)}${p(PARTS.when)}?`;
  if (kind < 0.45) return `Notes:\n- ${sentence()}\n- ${sentence()}\n- ${sentence()}`;
  if (kind < 0.55) return `1. ${sentence()}\n2. ${sentence()}`;
  return `${sentence()} ${sentence()}`;
}

test("property: 300 random inputs keep negation, questions, numbers, names, dates and lists", () => {
  const rng = mulberry32(20261022);
  for (let i = 0; i < 300; i++) {
    const input = randomInput(rng);
    for (const level of [1, 2, 3]) {
      const seed = 1 + (i % 5);
      const r = toCorporateDetailed(input, { level, seed });
      const where = `L${level} seed ${seed}: ${JSON.stringify(input)} -> ${JSON.stringify(r.text)}`;
      assert.ok(r.check.ok, `${JSON.stringify(r.check)} ${where}`);
      assert.ok(negations(r.text) >= negations(input), where);
      assert.ok((r.text.match(/\?/g) ?? []).length >= (input.match(/\?/g) ?? []).length, where);
      for (const n of numbers(input)) assert.ok(numbers(r.text).includes(n), `${n} ${where}`);
      for (const n of names(input)) assert.ok(r.text.includes(n), `${n} ${where}`);
      assert.equal(listLines(r.text), listLines(input), where);
      assert.doesNotMatch(r.text, HEDGES, where);
    }
  }
});

// ---------- The check itself ----------
test("meaning check catches each kind of loss", () => {
  const base = "I won't make the 3pm meeting with Dana. Can we move it to Friday?\n- item one\n- item two";
  const cases = [
    ["I would rather not make the 3pm meeting with Dana. Can we move it to Friday?\n- item one\n- item two", "added", "hedge"],
    ["I will make the 3pm meeting with Dana. Can we move it to Friday?\n- item one\n- item two", "lost", "negation"],
    ["I won't make the 3pm meeting with Dana. We can move it to Friday.\n- item one\n- item two", "lost", "question"],
    ["I won't make the meeting with Dana. Can we move it to Friday?\n- item one\n- item two", "lost", "numbers"],
    ["I won't make the 3pm meeting. Can we move it to Friday?\n- item one\n- item two", "lost", "names"],
    ["I won't make the 3pm meeting with Dana. Can we move it?\n- item one\n- item two", "lost", "dates"],
    ["I won't make the 3pm meeting with Dana. Can we move it to Friday? - item one - item two", "lost", "list"],
    ["I won't make the 3pm meeting with Dana or Kim. Can we move it to Friday?\n- item one\n- item two", "added", "name"],
    ["I won't make the 3pm meeting with Dana. Can we move it to Friday by EOD?\n- item one\n- item two", "added", "date"],
  ];
  assert.equal(checkMeaning(base, base).ok, true);
  for (const [out, kind, what] of cases) {
    const r = checkMeaning(base, out);
    assert.equal(r.ok, false, out);
    assert.ok(r[kind].includes(what), `${what} not in ${JSON.stringify(r)}`);
  }
  // A rewrite may not book a meeting the user never mentioned.
  assert.ok(checkMeaning("I'm swamped.", "I'm at capacity. Let's sync offline.").added.includes("meeting"));
  // Idioms can lose their "no" without changing the meaning.
  assert.equal(checkMeaning("No problem, I don't mind.", "Happy to help, I'm flexible.").ok, true);
});

test("the page note names the problem in plain words", async () => {
  const { describeProblems } = await import("../site/meaning.js");
  assert.equal(describeProblems(checkMeaning("I can't go.", "I'm going.")), "dropped a no");
  assert.equal(describeProblems(checkMeaning("I won't go.", "I would rather not go.")), "softened a no");
  assert.equal(describeProblems(checkMeaning("Is it 5?", "It is.")), "dropped a question and dropped a number");
});
