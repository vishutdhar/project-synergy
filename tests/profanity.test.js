// Profanity tests. Corporate output must never be crude, at any level, and must keep the meaning.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporateDetailed, toNormal, formatDecode, mulberry32 } from "../site/engine.js";
import { checkMeaning } from "../site/meaning.js";
import { canonicalizeCrude, findCrude, hasCrude, scrubCrude, addsCrude, neutralizeSlurs, isSlur } from "../site/profanity.js";
import { CORPORATE, DECODE } from "./golden.js";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LEVELS = [1, 2, 3];
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + (c === c.toLowerCase() ? 97 : 65)));

// Sweary, rude and crude inputs. "has" lists what must survive: names, numbers, dates, no's and questions.
export const CRUDE = [
  { in: "the plan is to fuck off all day today", has: ["today"] },
  { in: "This is bullshit.", has: [] },
  { in: "He's an idiot.", has: [] },
  { in: "Screw this.", has: [] },
  { in: "I don't give a shit.", has: [] },
  { in: "I don't give a fuck about the offsite.", has: [] },
  { in: "wtf is this?", has: ["?"] },
  { in: "stfu Dana", has: ["Dana"] },
  { in: "This f*cking printer is a piece of shit.", has: [] },
  { in: "fkn idiot broke the build again", has: [] },
  { in: "I'm tired af and I'm not coming in tomorrow.", has: ["tomorrow", "not"] },
  { in: "Hell no, I won't work Saturday.", has: ["Saturday"] },
  { in: "This meeting is a total waste of fucking time.", has: [] },
  { in: "Kevin is an asshole.", has: ["Kevin"] },
  { in: "Who the fuck approved a 3% raise?", has: ["3%", "?"] },
  { in: "This sucks and I hate it.", has: [] },
  { in: "That's a dumb idea, Mark.", has: ["Mark"] },
  { in: "Our numbers are shit this quarter, down 12%.", has: ["12%"] },
  { in: "Get the fuck out of my office.", has: [] },
  { in: "I'm so pissed about the Q3 budget.", has: ["Q3"] },
  { in: "FFS, the deploy failed again at 5pm.", has: ["5pm"] },
  { in: "fml, another all hands on Friday", has: ["Friday"] },
  { in: "This shit is broken, fix it by Monday.", has: ["Monday"] },
  { in: "Don't be a dick about the deadline.", has: ["Don't"] },
  { in: "Who gives a crap about synergy?", has: ["?"] },
  { in: "The client is being a total bitch about the invoice.", has: [] },
  { in: "What a clusterfuck.", has: [] },
  { in: "Damn it, the server is down again.", has: [] },
  { in: "I'm not doing this shit for free.", has: ["not"] },
  { in: "You screwed up the launch.", has: [] },
  { in: "Fuck no, we're not moving the deadline to June 3.", has: ["June 3", "not"] },
  { in: "This is the dumbest fucking plan I've ever seen.", has: [] },
  { in: "Tell Priya her deck is crap.", has: ["Priya"] },
  { in: "That motherf*cker took my parking spot.", has: [] },
  { in: "lmao this roadmap is bs", has: [] },
  { in: "I fucking quit.", has: [] },
  { in: "Are you fucking kidding me?", has: ["?"] },
  { in: "This is effing ridiculous, 4 reorgs in one year.", has: ["4"] },
];

const runs = (input) => LEVELS.flatMap((level) => SEEDS.map((seed) => ({ level, seed, ...toCorporateDetailed(input, { level, seed }) })));

test("crude corpus has at least 30 inputs and includes Vishut's sentence", () => {
  assert.ok(CRUDE.length >= 30, `${CRUDE.length}`);
  assert.ok(CRUDE.some((c) => c.in === "the plan is to fuck off all day today"));
});

for (const c of CRUDE) {
  test(`no crude words at any level: ${c.in}`, () => {
    for (const r of runs(c.in)) {
      const where = `L${r.level} seed ${r.seed}: ${r.text}`;
      assert.equal(findCrude(r.text).length, 0, where);
      assert.ok(r.text.trim().length > 3, where);
      assert.ok(checkMeaning(c.in, r.text).ok, `${where} (${JSON.stringify(checkMeaning(c.in, r.text))})`);
      for (const w of c.has) assert.ok(r.text.toLowerCase().includes(w.toLowerCase()) || (w === "not" && /n't|\bno\b|\bnot\b|unable/i.test(r.text)), `${where} lost "${w}"`);
      // Scrubbed leftovers like "to all day" or "shut the up" mean the phrase layer missed.
      assert.doesNotMatch(r.text, /\bto all day\b|\bthe up\b|\s{2,}|\ba [aeiou]\w|\b(?:an?|the) (?:about|of|to|for|the|a)(?![\w-])/i, where);
    }
  });
}

test("Vishut's sentence keeps the point at every level", () => {
  for (const r of runs("the plan is to fuck off all day today")) {
    assert.match(r.text, /today/i, r.text);
    assert.match(r.text, /slack|recharge|deliverables|low-output|off the clock|step back|downtime|light/i, r.text);
  }
});

test("slurs are never echoed", () => {
  for (const word of ["ergneq", "snttbg", "fcnm"].map(rot13)) {
    assert.ok(isSlur(word));
    const input = `Don't be such a ${word} about the 2pm call.`;
    for (const r of runs(input)) {
      assert.ok(!r.text.toLowerCase().includes(word), r.text);
      assert.equal(findCrude(r.text).length, 0, r.text);
      assert.match(r.text, /2pm/);
    }
    assert.ok(!neutralizeSlurs(input).toLowerCase().includes(word));
  }
});

test("censored spellings are recognized", () => {
  const cases = {
    "f*ck this": "fuck this", "fkn": "fucking", "wtf is this": "what is this", "stfu": "shut the fuck up",
    "sh*t": "shit", "a**hole": "asshole", "tired af": "really tired", "f u c k off": "fuck off", "gtfo": "get the fuck out",
  };
  for (const [a, b] of Object.entries(cases)) assert.equal(canonicalizeCrude(a), b, a);
});

test("ordinary words are not flagged", () => {
  for (const ok of ["Please assess the class schedule.", "Dick Smith joins Monday.", "The shell script passed.", "A knee-jerk reaction.", "Grab a cocktail at the Scunthorpe office.", "Hello, therapist.", "Pass the screwdriver.", "Hit the ground running."]) {
    assert.deepEqual(findCrude(ok), [], ok);
  }
});

test("scrubCrude always leaves clean text", () => {
  for (const c of CRUDE) assert.equal(findCrude(scrubCrude(canonicalizeCrude(c.in))).length, 0, c.in);
});

test("dropping swearing doesn't count as losing meaning", () => {
  assert.ok(checkMeaning("Fuck, the build is broken again.", "The build is broken again.").ok);
  assert.ok(checkMeaning("No shit, the build is broken.", "Yes, the build is broken.").ok);
  assert.ok(checkMeaning("Kevin is a dick.", "Kevin has room to grow.").ok);
});

test("property: crude words dropped into clean messages never reach the output", () => {
  const rng = mulberry32(4242);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const bits = [["fucking ", "before"], ["damn it, ", "start"], ["wtf, ", "start"], [" ffs", "end"], [" this is bullshit.", "end"], ["shit, ", "start"], ["f*cking ", "before"], [" what a clusterfuck.", "end"], ["screw this, ", "start"]];
  const base = CORPORATE.map((c) => c.input);
  for (let i = 0; i < 250; i++) {
    let s = pick(base);
    const [bit, where] = pick(bits);
    if (where === "start") s = bit + s[0].toLowerCase() + s.slice(1);
    else if (where === "end") s = s.replace(/[.!?]?$/, (p) => (p || ".") + bit);
    else {
      const words = s.split(" ");
      const at = 1 + Math.floor(rng() * Math.max(1, words.length - 1));
      words.splice(at, 0, bit.trim());
      s = words.join(" ");
    }
    const level = 1 + (i % 3);
    const r = toCorporateDetailed(s, { level, seed: i });
    assert.equal(findCrude(r.text).length, 0, `${s} -> ${r.text}`);
  }
});

test("Corporate to normal doesn't invent swearing", () => {
  const inputs = [...DECODE.map((d) => d.input), ...CRUDE.map((c) => c.in)];
  for (const input of inputs) for (const level of LEVELS) for (const seed of [1, 2, 3]) {
    const out = formatDecode(toNormal(input, { level, seed }));
    assert.ok(!addsCrude(input, out), `${input} -> ${out}`);
  }
});

test("addsCrude spots new swearing only", () => {
  assert.equal(addsCrude("The budget is frozen.", "No money. This sucks."), true);
  assert.equal(addsCrude("This shit is broken.", "The shit is broken."), false);
  assert.equal(addsCrude("We're restructuring.", "People are losing jobs."), false);
});
