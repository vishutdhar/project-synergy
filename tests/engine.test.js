import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  toCorporate, toNormal, formatDecode, tidy, matchCase, applySoftCap, splitSentences, normalizeInput,
  corporateEntries, decodeEntries, detectThemes, isGreetingOrSignature, SOFT_CAP, polishCase,
} from "../site/engine.js";
import { CASUAL } from "./fixtures-casual.js";
import { OPENERS, CLOSERS, INTERJECTIONS, THEMES } from "../site/phrasebook.js";
import { MEMOS, PLAIN } from "../site/samples.js";

const sample = "hey, I don't know. this idea is stupid and I have no time. can you fix this bug by tomorrow? thanks";

test("phrasebook is big: a few hundred entries", () => {
  assert.ok(corporateEntries.length >= 300, `corporate swaps: ${corporateEntries.length}`);
  assert.ok(decodeEntries.length >= 150, `decode swaps: ${decodeEntries.length}`);
  const extras = Object.values(OPENERS).flat().length + Object.values(CLOSERS).flat().length + INTERJECTIONS.length;
  // Tone-only lines. Ones that invented meetings, plans or facts were removed.
  assert.ok(extras >= 50, `openers, closers, asides: ${extras}`);
});

test("phrasebook has no duplicate keys and no fancy punctuation", () => {
  for (const entries of [corporateEntries, decodeEntries]) {
    // The same phrase may appear twice with different conditions (standalone vs followed by a word).
    const keys = entries.map((e) => `${e.from}|${e.clauseOnly}|${e.beforeWord}`);
    assert.equal(new Set(keys).size, keys.length, "duplicate key");
  }
  const src = fs.readFileSync(new URL("../site/phrasebook.js", import.meta.url), "utf8");
  assert.ok(!/[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]/.test(src), "em/en dash, curly quote or ellipsis in phrasebook");
});

test("toCorporate is deterministic for the same seed", () => {
  for (const level of [1, 2, 3]) {
    assert.equal(toCorporate(sample, { level, seed: 7 }), toCorporate(sample, { level, seed: 7 }));
  }
});

test("reroll (new seed) gives varied output", () => {
  const outs = new Set();
  for (let seed = 1; seed <= 8; seed++) outs.add(toCorporate(sample, { level: 3, seed }));
  assert.ok(outs.size >= 4, `only ${outs.size} distinct results over 8 seeds`);
});

test("higher levels change more of the text", () => {
  const changed = (level) => {
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const out = toCorporate(sample, { level, seed });
      total += out.length - sample.length;
    }
    return total;
  };
  const [a, b, c] = [changed(1), changed(2), changed(3)];
  assert.ok(a < b && b < c, `growth by level: ${a}, ${b}, ${c}`);
});

test("output is clean: capitalized sentences, tidy spacing, terminal punctuation", () => {
  for (const text of [...PLAIN, sample, "ok", "no.", "i messed up. my bad"]) {
    for (const level of [1, 2, 3]) {
      for (let seed = 1; seed <= 5; seed++) {
        const out = toCorporate(text, { level, seed });
        assert.match(out, /^[A-Z"]/, `starts lowercase: ${out}`);
        assert.match(out, /[.!?"]$/, `no end punctuation: ${out}`);
        assert.ok(!/ {2}| [,.!?;:]|,,|\.\.(?!\.)|[,;:][A-Za-z]/.test(out), `messy spacing: ${out}`);
        assert.ok(!/[\u0000\u0001~]/.test(out), `marker leaked: ${out}`);
        assert.ok(!/[\u2014\u2013]/.test(out), `dash in output: ${out}`);
        for (const s of splitSentences(out)) assert.match(s, /^["'(]?[A-Z0-9]/, `sentence not capitalized: "${s}" in ${out}`);
      }
    }
  }
});

test("question marks, exclamation points and commas survive", () => {
  const out = toCorporate("Can you fix this bug? Thanks, team!", { level: 3, seed: 1 });
  assert.match(out, /\?/);
  assert.match(out, /!|\./);
  assert.match(out, /,/);
});

test("ALL CAPS input stays shouty", () => {
  const out = toCorporate("THIS IS BROKEN", { level: 3, seed: 1 });
  assert.ok(out.includes("EXPERIENCING SUBOPTIMAL UPTIME") || out.includes("IN A DEGRADED STATE") || out.includes("NOT WORKING"), out);
});

test("clause-only swaps do not fire mid-sentence", () => {
  const out = toCorporate("There is no way we ship this.", { level: 3, seed: 1 });
  assert.ok(!/deprioritize that way/i.test(out), out);
  const alone = toCorporate("No.", { level: 3, seed: 1 });
  assert.ok(!/^.*\bNo\.$/.test(alone.replace(/^[^:]*: /, "")) || alone.length > 3, alone);
});

test("apostrophes are optional when matching and curly quotes are normalized", () => {
  const a = toCorporate("I dont know", { level: 3, seed: 2 });
  const b = toCorporate("I don\u2019t know", { level: 3, seed: 2 });
  assert.ok(!/\bdon'?t know\b/i.test(a), a);
  assert.ok(!/\bdon'?t know\b/i.test(b), b);
  assert.ok(!/[\u2019]/.test(b));
});

test("tidy fixes a/an after swaps", () => {
  assert.equal(tidy("This is a \u0000opportunity\u0001."), "This is an opportunity.");
  assert.equal(tidy("It was an \u0000big win\u0001."), "It was a big win.");
  assert.equal(tidy("That is a \u0000~more work\u0001."), "That is more work.");
  assert.equal(tidy("a hour and an user"), "an hour and a user");
});

test("matchCase keeps ALL CAPS and leaves pronoun capitals alone", () => {
  assert.equal(matchCase("BROKEN", "not working"), "NOT WORKING");
  assert.equal(matchCase("broken", "I'm out"), "I'm out");
});

test("empty and whitespace input", () => {
  assert.equal(toCorporate("   "), "");
  assert.deepEqual(toNormal(" \n "), { summary: "", lines: [], themes: [] });
});

test("normalizeInput strips fancy punctuation", () => {
  assert.equal(normalizeInput("Hi \u2014 there\u2026 \u201Cok\u201D"), 'Hi, there... "ok"');
});

test("soft cap trims long input at a sentence boundary", () => {
  const long = "We are rightsizing. ".repeat(2000);
  const { text, truncated } = applySoftCap(long);
  assert.ok(truncated);
  assert.ok(text.length <= SOFT_CAP);
  assert.match(text, /\.$/);
  assert.equal(applySoftCap("short").truncated, false);
});

test("toNormal handles a 20k character paste quickly", () => {
  const memo = MEMOS.join("\n\n");
  let big = "";
  while (big.length < SOFT_CAP) big += memo + "\n\n";
  const t0 = Date.now();
  const r = toNormal(applySoftCap(big).text, { level: 2 });
  assert.ok(Date.now() - t0 < 1500, "too slow");
  assert.ok(r.lines.length > 50);
  assert.ok(r.summary.length > 0);
});

test("decode: sample memos get the right summaries", () => {
  const [layoff, rto, recordYear, reorg] = MEMOS;
  assert.deepEqual(toNormal(layoff).themes.slice(0, 1), ["layoffs"]);
  assert.match(toNormal(layoff, { level: 2 }).summary, /laying people off|laid off/);
  assert.deepEqual(toNormal(rto).themes.slice(0, 1), ["rto"]);
  assert.match(toNormal(rto, { level: 2 }).summary, /office/i);
  const ry = toNormal(recordYear, { level: 2 });
  assert.ok(ry.themes.includes("no-raises") && ry.themes.includes("record-year"));
  assert.equal(ry.summary, "Record profits. No raises.");
  assert.deepEqual(toNormal(reorg).themes.slice(0, 1), ["reorg"]);
});

test("decode: bluntness levels change the wording", () => {
  const [layoff] = MEMOS;
  const s = [1, 2, 3].map((level) => toNormal(layoff, { level }).summary);
  assert.equal(new Set(s).size, 3, s.join(" | "));
});

test("decode: greetings and signatures are skipped", () => {
  assert.ok(isGreetingOrSignature("Team,"));
  assert.ok(isGreetingOrSignature("Hi everyone,"));
  assert.ok(isGreetingOrSignature("Pat Ellery CEO, Corvane Systems"));
  assert.ok(!isGreetingOrSignature("We are reducing our workforce by 10%."));
  const r = toNormal(MEMOS[0]);
  assert.ok(!r.lines.some((l) => l.original === "Team,"));
});

test("decode: one line per sentence, each with a translation", () => {
  const r = toNormal(MEMOS[1], { level: 3 });
  assert.ok(r.lines.length >= 6);
  for (const l of r.lines) {
    assert.ok(l.original && l.plain, JSON.stringify(l));
    assert.ok(!/[\u0000\u0001~]/.test(l.plain));
  }
});

test("decode: raise theme needs a negative cue", () => {
  assert.ok(!detectThemes("Everyone will get a raise this year.").includes("no-raises"));
  assert.ok(detectThemes("We will pause merit increases this year.").includes("no-raises"));
});

test("decode: no themes means a no-news summary", () => {
  const r = toNormal("The cafeteria opens at 8. Parking is in lot B.", { level: 2 });
  assert.deepEqual(r.themes, []);
  assert.match(r.summary, /says what it says/i);
});

test("formatDecode output for copy", () => {
  const out = formatDecode(toNormal(MEMOS[2], { level: 2 }));
  assert.match(out, /^What they really mean: /);
  assert.match(out, /\n\n"/);
});

test("every theme has three levels of summary and line text", () => {
  for (const t of THEMES) {
    assert.equal(t.summary.length, 3, t.id);
    assert.equal(t.line.length, 3, t.id);
  }
});

// ---------- capitalization ----------

test("polishCase capitalizes every sentence start after . ! ? and newlines", () => {
  assert.equal(polishCase("one. two! three? four"), "One. Two! Three? Four");
  assert.equal(polishCase("first line.\nsecond line.\n\nthird."), "First line.\nSecond line.\n\nThird.");
  assert.equal(polishCase('he said "yes." then left.'), 'He said "yes." Then left.');
});

test("polishCase capitalizes standalone i and its contractions, straight and curly", () => {
  assert.equal(polishCase("so i think i'm right, i've checked, i'll go, i'd say."), "So I think I'm right, I've checked, I'll go, I'd say.");
  assert.equal(polishCase("yes i\u2019m sure i\u2019ve done it, (i) agree."), "Yes I\u2019m sure I\u2019ve done it, (I) agree.");
});

test("polishCase leaves URLs, emails, code and camelCase alone", () => {
  const input = "check https://example.com/i/path and i@example.com, my iPhone, iOS, i_count and `i`. ok";
  const out = polishCase(input);
  assert.ok(out.includes("https://example.com/i/path"), out);
  assert.ok(out.includes("i@example.com"), out);
  assert.ok(out.includes("iPhone") && out.includes("iOS") && out.includes("i_count") && out.includes("`i`"), out);
  assert.ok(out.endsWith(". Ok"), out);
  assert.equal(polishCase("e.g. this, i.e. that"), "E.g. this, i.e. that");
});

test("toCorporate capitalizes sentence starts and standalone i at every level", () => {
  const input = "hey, i can't make the meeting, i'm swamped. i think it's fine. ok? i'll check.\nsee you";
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 10; seed++) {
      const out = toCorporate(input, { level, seed });
      assert.ok(!/(?<![\w@/.'-])i(?:'(?:m|ve|ll|d))?(?![\w'@.-])/.test(out), `lowercase i in: ${out}`);
      assert.ok(!/(?:^|[.!?]\s+|\n)[a-z]/.test(out), `lowercase sentence start in: ${out}`);
    }
  }
});

test("the reported sample no longer leaves i'm swamped as-is", () => {
  for (const level of [1, 2, 3]) {
    const out = toCorporate("hey, i can't make the meeting, i'm swamped", { level, seed: 1 });
    assert.ok(!/i'm swamped/i.test(out), out);
  }
});

// ---------- coverage ----------

const swapsAtEveryLevel = (sentence, word) => {
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 10; seed++) {
      const out = toCorporate(sentence, { level, seed });
      assert.ok(!new RegExp(`(?<![\\w'])${word}(?![\\w'])`, "i").test(out), `level ${level} seed ${seed} kept "${word}": ${out}`);
    }
  }
};

test("swamped is transformed at every level", () => swapsAtEveryLevel("I'm swamped this week.", "swamped"));
test("busy is transformed at every level", () => swapsAtEveryLevel("The team is busy right now.", "busy"));
test("can't is transformed at every level", () => {
  swapsAtEveryLevel("We can't ship this on time.", "can'?t");
  swapsAtEveryLevel("Sorry, I can't.", "can'?t");
});
test("dumb is transformed at every level", () => swapsAtEveryLevel("This plan is dumb.", "dumb"));

test("listed casual words all change at Full C-Suite and vary by level", () => {
  const words = ["swamped", "busy", "slammed", "can't", "won't", "don't know", "dumb", "stupid", "bad idea", "lazy", "tired",
    "broke", "fired", "quit", "late", "sorry", "help", "problem", "fix", "asap", "yes", "no", "ok", "okay", "guys", "boss",
    "meeting", "email", "lunch", "money", "cheap", "expensive", "weird", "annoying", "hate", "love", "great", "awesome", "sucks"];
  const keys = new Map();
  for (const e of corporateEntries) keys.set(e.from, [...(keys.get(e.from) ?? []), e]);
  for (const w of words) {
    const entries = keys.get(w);
    assert.ok(entries, `no swap for ${w}`);
    for (const e of entries) {
      assert.ok(e.always, `${w} should always swap`);
      const [t1, t2, t3] = e.tiers.map((t) => t.join("|"));
      assert.ok(t1 !== t2 && t2 !== t3, `${w} does not vary by level`);
      for (const t of e.tiers) assert.ok(t.every((o) => o.toLowerCase() !== w), `${w} has a no-op option`);
    }
  }
});

test("thirty casual sentences come out clean at every level", () => {
  assert.equal(CASUAL.length, 30);
  for (const text of CASUAL) {
    for (const level of [1, 2, 3]) {
      const out = toCorporate(text, { level, seed: 3 });
      assert.match(out, /^[A-Z"]/, out);
      assert.ok(!/ {2}| [,.!?;:]|,,|[\u0000\u0001~]/.test(out), out);
      assert.ok(out !== text, `unchanged at level ${level}: ${text}`);
    }
  }
});
