// Profanity tests. Corporate output must never be crude, must read as a real sentence,
// and must keep the meaning, at every level. Crude idioms are checked by what they mean.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporateDetailed, toNormal, formatDecode, mulberry32, softenCrude } from "../site/engine.js";
import { checkMeaning } from "../site/meaning.js";
import { canonicalizeCrude, findCrude, cleanCrude, addsCrude, isSlur, lostIdioms, CRUDE_SWAPS } from "../site/profanity.js";
import { CORPORATE, DECODE } from "./golden.js";
import { CRUDE } from "./crude-corpus.js";
import { EVERYDAY } from "./everyday-corpus.js";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LEVELS = [1, 2, 3];
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + (c === c.toLowerCase() ? 97 : 65)));
// Leftovers that mean a word was swapped or dropped without regard to the sentence.
const GARBLED = /\bto all day\b|\bthe up\b|[ \t]{2,}|\ba [aeiou]\w|\b(?:an?|the) (?:about|of|to|for|the|a)(?![\w-])|\b(?:mess|stuff|thing|person|someone) all\b/i;

const runs = (input) => LEVELS.flatMap((level) => SEEDS.map((seed) => ({ level, seed, ...toCorporateDetailed(input, { level, seed }) })));

test("crude corpus has 100+ inputs, Vishut's two sentences among them", () => {
  assert.ok(CRUDE.length >= 100, `${CRUDE.length}`);
  for (const s of ["the plan is to fuck off all day today", "fuck all was done in that meeting"]) assert.ok(CRUDE.some((c) => c.in === s), s);
});

for (const c of CRUDE) {
  test(`work-safe, readable and same meaning at every level: ${c.in}`, () => {
    for (const r of runs(c.in)) {
      const where = `L${r.level} seed ${r.seed}: ${r.text}`;
      assert.equal(findCrude(r.text).length, 0, where);
      assert.deepEqual(r.unsafe, [], `${where} (left out a sentence)`);
      assert.ok(r.text.trim().length > 3, where);
      assert.ok(checkMeaning(c.in, r.text).ok, `${where} ${JSON.stringify(checkMeaning(c.in, r.text))}`);
      assert.deepEqual(lostIdioms(c.in, r.text), [], `${where} (idiom meaning lost)`);
      if (c.must) assert.ok(c.must.test(r.text), `${where} (expected meaning missing)`);
      if (c.mustNot) assert.ok(!c.mustNot.test(r.text), `${where} (says the opposite)`);
      for (const w of c.has) assert.ok(r.text.includes(w) || (/^(?:not|n't)$/.test(w) && /n't|\bnot\b|\bno\b/i.test(r.text)), `${where} lost "${w}"`);
      assert.doesNotMatch(r.text, GARBLED, where);
    }
  });
}

test("Vishut's sentences say what he meant", () => {
  for (const r of runs("fuck all was done in that meeting")) {
    assert.match(r.text, /\bnothing\b/i, r.text);
    assert.doesNotMatch(r.text, /\bmess\b/i, r.text);
  }
  for (const r of runs("the plan is to fuck off all day today")) {
    assert.match(r.text, /today/i, r.text);
    assert.match(r.text, /slack|recharge|low-output|deprioritize/i, r.text);
  }
});

test("AI mode gets the meaning, not the swearing", () => {
  assert.equal(softenCrude("fuck all was done in that meeting"), "nothing was done in that meeting");
  assert.equal(softenCrude("the plan is to fuck off all day today"), "the plan is to slack off all day today");
  for (const c of CRUDE) {
    const soft = softenCrude(c.in);
    assert.equal(findCrude(soft).length, 0, `${c.in} -> ${soft}`);
    assert.deepEqual(lostIdioms(c.in, soft), [], `${c.in} -> ${soft}`);
  }
});

test("idiom meaning check catches a reversed rewrite", () => {
  assert.deepEqual(lostIdioms("fuck all was done in that meeting", "Mess all was completed in that catch-up."), ["nothing"]);
  assert.deepEqual(lostIdioms("fuck all was done in that meeting", "Nothing was completed in that catch-up."), []);
  assert.deepEqual(lostIdioms("We're fucked.", "We're doing great."), ["in-trouble"]);
});

test("no crude rewrite has an option that is itself crude or empty", () => {
  for (const line of CRUDE_SWAPS.split("\n")) {
    const [, ...opts] = line.split(" = ");
    assert.equal(opts.length, 3, line);
    for (const o of opts) {
      assert.ok(o.trim(), line);
      assert.equal(findCrude(o).length, 0, line);
      assert.doesNotMatch(o, /[{}$]/, line);
    }
  }
});

test("slurs are never echoed", () => {
  for (const word of ["ergneq", "snttbg", "fcnm"].map(rot13)) {
    assert.ok(isSlur(word));
    for (const r of runs(`Don't be such a ${word} about the 2pm call.`)) {
      assert.ok(!r.text.toLowerCase().includes(word), r.text);
      assert.equal(findCrude(r.text).length, 0, r.text);
      assert.match(r.text, /2pm/);
      assert.doesNotMatch(r.text, GARBLED, r.text);
    }
  }
});

test("censored spellings are recognized", () => {
  const cases = {
    "f*ck this": "fuck this", "fkn": "fucking", "wtf is this": "what is this", "stfu": "shut the fuck up",
    "sh*t": "shit", "a**hole": "asshole", "tired af": "really tired", "f u c k off": "fuck off", "gtfo": "get the fuck out",
    "sweet FA": "fuck all", "Fuck it": "Fuck it", "a fuck-up": "a fuckup",
  };
  for (const [a, b] of Object.entries(cases)) assert.equal(canonicalizeCrude(a), b, a);
});

test("ordinary words are not flagged", () => {
  for (const ok of ["Please assess the class schedule.", "Dick Smith joins Monday.", "The shell script passed.", "A knee-jerk reaction.", "Grab a cocktail at the Scunthorpe office.", "Hello, therapist.", "Pass the screwdriver.", "Hit the ground running."]) {
    assert.deepEqual(findCrude(ok), [], ok);
  }
  assert.ok(findCrude("For fuck's sake.").length, "possessive still counts");
});

test("the last resort drops emphasis or a whole sentence, never swaps a word into nonsense", () => {
  assert.deepEqual(cleanCrude("This is fucking great."), { text: "This is great.", dropped: [] });
  assert.deepEqual(cleanCrude("Shit, the build broke."), { text: "The build broke.", dropped: [] });
  const r = cleanCrude("The build broke. He's a total cunt-faced weirdo.");
  assert.equal(r.text, "The build broke.");
  assert.equal(r.dropped.length, 1);
});

test("a sentence with no safe rewrite is left out and reported", () => {
  const r = toCorporateDetailed("The build is green. Kevin is a total cockwomble.", { level: 2, seed: 1 });
  assert.equal(findCrude(r.text).length, 0, r.text);
  assert.match(r.text, /green/);
  assert.equal(r.unsafe.length, 1);
});

test("dropping swearing doesn't count as losing meaning", () => {
  assert.ok(checkMeaning("Fuck, the build is broken again.", "The build is broken again.").ok);
  assert.ok(checkMeaning("No shit, the build is broken.", "Yes, the build is broken.").ok);
  assert.ok(checkMeaning("Kevin is a dick.", "Kevin has room to grow.").ok);
});

test("property: crude words dropped into clean messages never reach the output", () => {
  const rng = mulberry32(4242);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const bits = [["fucking ", "before"], ["damn it, ", "start"], ["wtf, ", "start"], [" ffs", "end"], [" this is bullshit.", "end"], ["shit, ", "start"], ["f*cking ", "before"], [" what a clusterfuck.", "end"], ["screw this, ", "start"], [" fuck all got done.", "end"]];
  const base = [...CORPORATE.map((c) => c.input), ...EVERYDAY];
  for (let i = 0; i < 300; i++) {
    let s = pick(base);
    const [bit, where] = pick(bits);
    if (where === "start") s = bit + s[0].toLowerCase() + s.slice(1);
    else if (where === "end") s = s.replace(/[.!?]?$/, (p) => (p || ".") + bit);
    else {
      const words = s.split(" ");
      words.splice(1 + Math.floor(rng() * Math.max(1, words.length - 1)), 0, bit.trim());
      s = words.join(" ");
    }
    const r = toCorporateDetailed(s, { level: 1 + (i % 3), seed: i });
    assert.equal(findCrude(r.text).length, 0, `${s} -> ${r.text}`);
    assert.doesNotMatch(r.text, GARBLED, `${s} -> ${r.text}`);
  }
});

test("everyday messages keep their meaning and read cleanly at every level", () => {
  for (const t of EVERYDAY) for (const level of LEVELS) for (const seed of [1, 2, 3]) {
    const r = toCorporateDetailed(t, { level, seed });
    assert.ok(checkMeaning(t, r.text).ok, `${t} -> ${r.text}`);
    assert.doesNotMatch(r.text, GARBLED, `${t} -> ${r.text}`);
    assert.doesNotMatch(r.text, /memory infrastructure to|taking key learnings|(?:solid|best-in-class) morning|action updates to|was streamline\b|signing off out|risk-aware we/i, `${t} -> ${r.text}`);
  }
});

test("Corporate to normal doesn't invent swearing", () => {
  const inputs = [...DECODE.map((d) => d.input), ...CRUDE.map((c) => c.in)];
  for (const input of inputs) for (const level of LEVELS) {
    const out = formatDecode(toNormal(input, { level, seed: 1 }));
    assert.ok(!addsCrude(input, out), `${input} -> ${out}`);
  }
});

test("addsCrude spots new swearing only", () => {
  assert.equal(addsCrude("The budget is frozen.", "No money. This sucks."), true);
  assert.equal(addsCrude("This shit is broken.", "The shit is broken."), false);
  assert.equal(addsCrude("We're restructuring.", "People are losing jobs."), false);
});
