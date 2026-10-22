// Regression tests from the 1,000+ variation round. Each one is a failure found by reading outputs by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { aiCorporateGate } from "../site/faithful.js";

const corp = (text, level) => toCorporate(text, { level, seed: 1 });
const dec = (text, level) => toNormal(text, { level, seed: 1 });

test("Mild and Middle Manager add no sentences of their own", () => {
  for (const t of ["any updates?", "running 15 minutes late", "sounds like a plan", "we're so cooked"]) {
    for (const level of [1, 2]) assert.equal(corp(t, level).split(/[.!?](?:\s|$)/).filter(Boolean).length, 1, `${t} L${level}: ${corp(t, level)}`);
  }
});

test("pronouns survive idiom swaps", () => {
  assert.equal(corp("our competitors are kicking our ass", 1), "Our competitors are beating us.");
  assert.match(corp("our competitors are kicking our ass", 2), /outperforming us\./);
});

test("late with a number keeps the number", () => {
  assert.match(corp("running 15 minutes late", 1), /^(?:Unfortunately, )?I'm running 15 minutes behind\.$/);
});

test("casual openers and tails get cleaned up", () => {
  assert.equal(corp("y'all the build is green", 1), "Everyone, the build is green.");
  assert.equal(corp("the new pricing is weird tbh", 1), "The new pricing is unusual, to be honest.");
  assert.equal(corp("brb grabbing coffee", 1), "Be right back, grabbing coffee.");
  assert.equal(corp("no I didn't get it", 1), "No, I didn't get it.");
  assert.equal(corp("we're so cooked", 2), "Flagging that we're in trouble.");
});

test("questions keep their question mark", () => {
  assert.equal(corp("Can we move standup, we're slammed today", 1), "Could we move standup? We're buried today.");
  assert.equal(corp("finna grab lunch, want anything", 1), "I'm about to get lunch, want anything?");
  assert.equal(corp("is there any way we can push the deadline", 1), "Is there any way we can move the deadline?");
});

test("lettered lists stay lists", () => {
  assert.equal(corp("options: a) ship friday b) slip a week", 1), "Here are the options: a) ship Friday b) slip a week.");
});

test("crude idioms keep their meaning", () => {
  assert.equal(corp("my boss is such a hardass", 1), "My manager is so strict.");
  assert.equal(corp("Kevin can go to hell", 1), "Kevin has really frustrated me.");
  assert.equal(corp("screw the process, just ship it", 1), "Forget the workflow, just ship it.");
  assert.equal(corp("fuck it, let's ship", 1), "Let's go ahead and ship.");
});

test("phrase fixes from the read-through", () => {
  assert.equal(corp("I'd love to help", 2), "I'd be glad to help.");
  assert.equal(corp("she wants me to redo the deck", 2), "Quick heads-up: she would like me to redo the deck.");
  assert.equal(corp("i won't be in tomorrow", 1), "I will not be in tomorrow.");
});

test("Atlas note: per my last email plus parking lot decodes to a plain brush-off", () => {
  const r = dec("Per my last email, let's circle back offline and take this to the parking lot.", 2);
  assert.equal(r.summary, "I already told you. Let's drop this for now.");
});

test("decode: raises capped, reorg, smaller footprint", () => {
  assert.equal(dec("Merit increases will be capped at 1% this cycle.", 1).summary, "Don't expect much of a raise this year.");
  assert.match(dec("We are making changes to our organizational structure to reduce costs.", 1).summary, /reshuffled.*cutting spending/);
  assert.match(dec("We will be leaving the Austin office as we move to a smaller footprint.", 2).summary, /cutting costs/);
});

test("decode: plain lines are not read as bad news", () => {
  assert.equal(dec("The Austin office is moving to a new building.", 1).themes.length, 0);
  assert.equal(dec("Just a friendly reminder that timesheets are due Friday.", 1).themes.length, 0);
});

test("AI gate: drift and lost facts fall back to Instant", () => {
  // The swamped example: a reply that changes the reason has to be rejected.
  assert.equal(aiCorporateGate("i can't make the meeting, i'm swamped", "I'm not fully aligned with the meeting.", { level: 2 }).ok, false);
  assert.equal(aiCorporateGate("running 10 min late", "I'm running a few minutes behind.", { level: 1 }).ok, false);
  assert.equal(aiCorporateGate("recieved the contract, will reveiw tonite", "Received the contract, I'll review it tonight.", { level: 1 }).ok, true);
  assert.equal(aiCorporateGate("the build is broken again", "The assembly line is malfunctioning again.", { level: 3 }).ok, false);
});

test("interjections and tags get their comma", () => {
  assert.equal(corp("srry wrong chat", 1), "Apologies, wrong chat.");
  assert.equal(corp("the new laptop is great btw", 1), "The new laptop is great, by the way.");
  assert.equal(corp("btw the deploy is done", 1), "By the way, the deploy is done.");
  assert.equal(corp("wow thanks for telling me at 4:55 on a friday", 1), "Wow, thanks for telling me at 4:55 on a Friday.");
  assert.equal(corp("ok but why", 1), "Okay, but could you help me understand why?");
  assert.equal(corp("ok so the api is borked again", 1), "It looks like the api is down again.");
  assert.match(corp("sure, I'll just work 3 jobs, no problem", 3), /operationalize that\. I'll just work 3 jobs/);
});

test("slang found in the live check gets swapped at every level", () => {
  assert.equal(corp("the wifi is trash today", 1), "The wifi is terrible today.");
  assert.equal(corp("that meeting was mid", 1), "That catch-up was underwhelming.");
  assert.equal(corp("thx for the help today ur the best 🙏", 1), "Thank you for the assist today, you're the best.");
  assert.match(corp("this bug is driving me insane", 2), /^This (?:bug|issue|defect) is really frustrating me\.$/);
});

test("second audit: wait comma and a rude dismissal", () => {
  assert.equal(corp("wait are we launching tomorrow??", 1), "Just to check, are we launching tomorrow?");
  for (const level of [1, 2, 3]) assert.doesNotMatch(corp("they can shove their return to office policy", level), /shove/);
});

test("AI mode retrieval: site/examples.js matches the dataset and builds the prompt", async () => {
  const fs = await import("node:fs");
  const { EXAMPLES } = await import("../site/examples.js");
  const { buildRetrievalCorporateMessages } = await import("../site/ai-prompts.js");
  const items = JSON.parse(fs.readFileSync(new URL("./variations/items.json", import.meta.url)));
  const want = items.filter((i) => i.direction === "toCorporate" && !i.input.includes("\n")).map((i) => [i.input, ...i.ideal]);
  assert.deepEqual(EXAMPLES, want, "run node scripts/build-examples.mjs");
  const m = buildRetrievalCorporateMessages("can't make the meeting, swamped", 2, EXAMPLES);
  assert.equal(m[0].role, "system");
  assert.equal(m.at(-1).content, "Rewrite in corporate speak:\ncan't make the meeting, swamped");
  assert.equal(m.length, 1 + 2 * 4 + 2 + 1);
  assert.match(m.at(-4).content, /meeting/i, "closest example sits right before the crude example and the input");
});

test("AI gate: Full C-Suite that reads like the input falls back to Instant", () => {
  assert.equal(aiCorporateGate("no more meetings this week please", "No more meetings this week, please!", { level: 3 }).reason, "flat");
  assert.equal(aiCorporateGate("no more meetings this week please", "No more meetings this week, please.", { level: 1 }).reason, "flat");
});
