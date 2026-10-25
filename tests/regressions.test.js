// Regression tests for issues found in live testing on Oct 22, 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal, keyWords } from "../site/engine.js";
import { OPENERS, CLOSERS, INTERJECTIONS } from "../site/phrasebook.js";
import { guardOutput, contradictsThemes, isMetaReply, findRepeatRun, repetitionRatio, tokensLoop, repeatControls, echoesExample, generationOptions, repeatSettings } from "../site/ai-guard.js";
import { CORPORATE_EXAMPLE_ANSWERS } from "../site/ai-prompts.js";
import { CASUAL } from "./fixtures-casual.js";

const LAYOFF_MEMO = "We are making the difficult decision to right-size our organization to better align resources with our strategic priorities. This will allow us to unlock synergies and drive sustainable growth.";
const SWAMPED = "i can't make the meeting, i'm swamped";
const COMMITMENT = /\b(?:I'll|I will|we'll|we will|let's (?:take|circle|touch|park|set up|sync|put)|next week|tomorrow|today|EOD|close of business|calendar|invite|standup|offline|looping|stakeholders|the board|touch base|circle back|follow(?:ing)? up|per my last)\b/i;

// ---------- 2. layoff memo ----------
test("layoff memo: summary says plainly that people are being laid off, at every level", () => {
  assert.equal(toNormal(LAYOFF_MEMO, { level: 2 }).summary, "We're laying people off.");
  for (const level of [1, 2, 3]) {
    const r = toNormal(LAYOFF_MEMO, { level });
    assert.equal(r.themes[0], "layoffs");
    assert.match(r.summary, /laying people off|losing their jobs|firing people/);
    assert.doesNotMatch(r.summary, /says what it says|Nothing hidden|Nothing to decode/);
  }
});

test("layoff memo: no awkward word swaps", () => {
  for (const level of [1, 2, 3]) {
    const text = toNormal(LAYOFF_MEMO, { level }).lines.map((l) => l.plain).join(" ");
    assert.doesNotMatch(text, /planned priorities/);
  }
  // The second sentence is translated, with synergies read as layoffs because the memo is about layoffs.
  assert.match(toNormal(LAYOFF_MEMO, { level: 2 }).lines[1].plain, /cutting jobs/i);
});

test("soft layoff signals: two or more in one memo count as layoffs, one alone does not", () => {
  const soft = "After a difficult decision, we are restructuring to streamline how we work.";
  assert.equal(toNormal(soft).themes[0], "layoffs");
  for (const s of [
    "We will right-size the Platform team.", "This is a reduction in force.", "We will eliminate 40 roles.",
    "We are parting ways with some colleagues.", "Several people will transition out of the company.",
    "This workforce optimization affects Sales.", "Our headcount will be lower next year.",
  ]) assert.equal(toNormal(s).themes[0], "layoffs", s);
  assert.notEqual(toNormal("We will streamline the expense report form.").themes[0], "layoffs");
});

test("synergies are not job cuts outside a layoff memo", () => {
  const plain = toNormal("Our two design teams found real synergies this quarter.", { level: 3 }).lines.map((l) => l.plain).join(" ");
  assert.doesNotMatch(plain, /job cuts|cut jobs/);
  const letGo = toNormal("We need to let go of old habits and try new tools.", { level: 3 });
  assert.notEqual(letGo.themes[0], "layoffs");
});

// ---------- 3. Normal to corporate ----------
test("swamped sentence: no duplicate 'capacity' and no added commitments, any level or seed", () => {
  for (const level of [1, 2, 3]) {
    for (let seed = 1; seed <= 25; seed++) {
      const out = toCorporate(SWAMPED, { level, seed });
      assert.ok((out.match(/capacit/gi) ?? []).length <= 1, `L${level} seed ${seed}: ${out}`);
      assert.doesNotMatch(out, COMMITMENT, `L${level} seed ${seed}: ${out}`);
      assert.doesNotMatch(out, /touch base after the standup/i);
    }
  }
});

test("Mild adds no strategic opener, only professional framing of the user's own sentence", () => {
  for (let seed = 1; seed <= 25; seed++) {
    const out = toCorporate(SWAMPED, { level: 1, seed });
    assert.match(out, /^(?:Unfortunately, |Apologies, |I think |It looks like )?I(?:'m| am| can| don't| won't)\b/, out);
  }
});

test("openers, closers and asides are tone only: no meetings, plans, deadlines or promises", () => {
  for (const line of [...Object.values(OPENERS).flat(), ...Object.values(CLOSERS).flat(), ...INTERJECTIONS]) {
    assert.doesNotMatch(line, COMMITMENT, line);
    assert.doesNotMatch(line, /data supports|we've decided|as discussed/i, line);
  }
});

test("no key word repeats that the input didn't have", () => {
  for (const sentence of CASUAL) {
    for (const level of [1, 2, 3]) {
      for (const seed of [1, 2, 3]) {
        const out = toCorporate(sentence, { level, seed });
        const count = (words) => words.reduce((m, w) => m.set(w, (m.get(w) ?? 0) + 1), new Map());
        const inCount = count(keyWords(sentence));
        for (const [stem, n] of count(keyWords(out))) {
          if (n > 1) assert.ok(n <= (inCount.get(stem) ?? 0), `"${stem}" x${n} in: ${out}`);
        }
      }
    }
  }
});

test("questions keep their question mark, and no deadline escalations", () => {
  for (const level of [1, 2, 3]) {
    const out = toCorporate("can you fix this bug by tomorrow?", { level });
    assert.match(out, /\?/);
    assert.doesNotMatch(out, /EOD|close of business/);
  }
});

// ---------- AI output checks ----------
const LOOP = "While I love the energy, this initiative isn't yet aligned with our north star, so let's pivot and unlock more value, " + "more value, ".repeat(80) + "more value,.";

test("AI guard: Vishut's looping reply is trimmed to one clean sentence", () => {
  const r = guardOutput(LOOP);
  assert.equal(r.text, "While I love the energy, this initiative isn't yet aligned with our north star, so let's pivot and unlock more value.");
  assert.equal(r.trimmed, true);
  assert.ok((r.text.match(/more value/g) ?? []).length === 1);
});

test("AI guard: the same reply is rejected when it copies a prompt example", () => {
  const copied = "I'm not yet bought in on the new brand identity's ability to unlock value at scale, " + "at scale, ".repeat(30);
  const r = guardOutput(copied, { examples: CORPORATE_EXAMPLE_ANSWERS });
  assert.equal(r.ok, false);
  assert.equal(r.text, "");
  assert.ok(echoesExample(CORPORATE_EXAMPLE_ANSWERS[0], CORPORATE_EXAMPLE_ANSWERS));
});

test("AI guard: other loop shapes", () => {
  // One word on repeat.
  assert.equal(guardOutput("Let us leverage synergies synergies synergies synergies synergies").text, "Let us leverage synergies.");
  // A whole sentence on repeat.
  assert.equal(guardOutput("We need to align. We need to align. We need to align. We need to align.").text, "We need to align.");
  // A four-word phrase with no punctuation.
  assert.equal(guardOutput("Going forward we will " + "move the needle together ".repeat(10)).text, "Going forward we will move the needle together.");
  // Pure garbage is rejected.
  assert.equal(guardOutput("value value value value value value").ok, false);
  assert.equal(guardOutput("").ok, false);
  // Scattered repeats with no run still count.
  const scattered = "we unlock value at scale and then we unlock value at scale so we unlock value at scale while we unlock value at scale";
  assert.ok(repetitionRatio(scattered) >= 0.25);
  assert.equal(guardOutput(scattered).ok, false);
  // Unfinished last sentence is cut back to the last full one.
  assert.equal(guardOutput("I'm at capacity today. Due to the strategic realignment of my").text, "I'm at capacity today.");
});

test("AI guard: normal replies pass through untouched", () => {
  const ok = "I can't attend today's sync, my bandwidth is fully allocated. I remain bought in on the outcomes.";
  assert.deepEqual(guardOutput(ok), { text: ok, ok: true, trimmed: false });
  assert.equal(findRepeatRun(ok), -1);
});

test("AI generation: sampling like Qwen's config, capped budget, repeat controls on generated tokens", () => {
  const o = generationOptions("corporate", 12);
  assert.equal(o.do_sample, true);
  assert.equal(o.temperature, 0.7);
  assert.equal(o.top_p, 0.8);
  assert.equal(o.top_k, 20);
  assert.equal(o.max_new_tokens, 48);
  assert.equal(generationOptions("corporate", 5000).max_new_tokens, 200);
  assert.equal(generationOptions("line", 10).max_new_tokens, 30);
  assert.ok(repeatSettings("corporate").penalty >= 1.1 && repeatSettings("corporate").penalty <= 1.2);
  assert.equal(repeatSettings("line").ngram, 3);
  assert.equal(repeatSettings("corporate").ngram, 0);
  // After "a b c ... a b", generating "c" again would repeat the 3-gram, so it is banned.
  assert.deepEqual([...repeatControls([1, 2, 3, 4, 1, 2]).banned], [3]);
  assert.equal(tokensLoop([5, 9, 7, 8, 7, 8, 7, 8, 7, 8]), true);
  assert.equal(tokensLoop([1, 2, 3, 4, 5, 6, 7, 8, 9]), false);
});

test("AI decode checks: denials of the main news and meta replies are caught", () => {
  assert.equal(contradictsThemes("No layoffs.", ["layoffs"]), true);
  assert.equal(contradictsThemes("People are being dismissed, so no layoffs or reorganization this year.", ["layoffs"]), true);
  assert.equal(contradictsThemes("We're laying people off.", ["layoffs"]), false);
  assert.equal(isMetaReply("here's the short sentence:."), true);
  assert.equal(isMetaReply("We're cutting jobs."), false);
});

test("Decode: 'per my last email' keeps what the email actually says", () => {
  for (const level of [1, 2, 3]) {
    const d = toNormal("Per my last email, the deadline is Friday.", { level });
    assert.match(d.summary, /deadline is Friday/);
    assert.match(d.summary, /^(?:As I said before|I already told you|Read my email)/);
  }
  assert.equal(toNormal("Per my last email, let's take this offline.", { level: 3 }).summary, "I already told you. Drop it.");
});

test("Decode: a bonus delay is not read as no raises, and a coworker leaving is not called a leader", () => {
  assert.match(toNormal("Bonus payouts will be delayed until Q2 while we finalize results.", { level: 2 }).summary, /^Bonus(?:es| payouts)(?: are|:) (?:delayed|late)\.$/);
  const d = toNormal("Hi all, I'm writing to let you know that Tomas will be leaving us at the end of the week.", { level: 3 });
  assert.doesNotMatch(d.summary, /leader/i);
});

test("AI decode checks: made-up offices, numbers, denials and lost 'you' are caught", async () => {
  const { decodeTextFails } = await import("../site/ai-guard.js");
  assert.equal(decodeTextFails("The office is closing down.", "We are discontinuing the Basic plan.", ["shutdown"]), true);
  assert.equal(decodeTextFails("Severance goes to people with 10 years.", "Severance packages will include 8 weeks of pay.", ["layoffs"]), true);
  assert.equal(decodeTextFails("No changes here.", "Please use the new dashboard going forward.", []), true);
  assert.equal(decodeTextFails("Lumen Labs is being eliminated.", "Your role at Lumen Labs is being eliminated.", ["layoff-you"]), true);
  assert.equal(decodeTextFails("No layoffs this month.", "We no longer require your services.", ["layoff-you"]), true);
  assert.equal(decodeTextFails("Your performance is improving, so you're not about to be fired.", "This plan is a formal step.", ["pip"]), true);
  assert.equal(decodeTextFails("12% of the staff will be cut.", "We are reducing our workforce by approximately 12%.", ["layoffs"]), false);
  assert.equal(decodeTextFails("Data entry work is moving to a cheaper location.", "We are moving data entry work to lower-cost locations.", ["outsourcing"]), false);
});

test("AI decode checks: filler and made-up congratulations are caught", async () => {
  const { decodeTextFails } = await import("../site/ai-guard.js");
  assert.equal(decodeTextFails("Congratulations on your job offer.", "We have decided to move forward with other candidates.", ["rejection"]), true);
  assert.equal(decodeTextFails("A polite thank-you.", "Thank you for your service.", []), true);
  assert.equal(decodeTextFails("Yes, that's possible.", "Employees can relocate or work remotely.", []), true);
  assert.equal(decodeTextFails("Sorry, I'm not sure what you're talking about.", "Your role is among those impacted.", ["layoff-you"]), true);
});
