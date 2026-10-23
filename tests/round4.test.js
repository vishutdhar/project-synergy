// Round 4 regression tests (project-synergy-research/round4): general classes found on fresh batches 4 and 5.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate } from "../site/engine.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));

test("glued clauses are split into sentences", () => {
  every("sorry for the delay been slammed", /delay\. I've been/);
  every("running 15 late train is delayed", /15 minutes (?:late|behind schedule)\. My train is delayed/);
  every("cancel the friday sync nothing to discuss", /There's nothing to discuss/);
  every("upgraded node to 22 everything still works", /I upgraded Node to 22\. Everything still works/);
  every("wifi password changed check your email", /the wifi password changed\. Could you please check your email\?/i);
  // A conjunction keeps the clause attached.
  every("the fire alarm test is at 2 so ignore it", /at 2 so ignore it/);
  none("can you check the numbers again", /Could you\?|\. Could/);
});

test("lowercase first names and tool names are capitalized, and never get an article", () => {
  every("sarah is now leading the design team", /\bSarah is now leading/);
  none("jamal is out so i'll run the demo", /\bthe jamal\b/i);
  every("does anyone know how to export from jira", /\bJira\b/);
  every("the api returns 500 on login", /\bAPI\b/);
  every("customer wants a refund for march", /\bMarch\b/);
  // Names that are also words stay words.
  every("Marketing did jack shit on the launch.", /^(?!.*\bJack\b)/);
});

test("crude idioms are translated by meaning", () => {
  every("marco saved our ass on the migration", /Marco (?:really )?saved us/);
  every("we got screwed on the contract", /(?:bad deal|unfavorable terms)/);
  every("no fucking way we ship friday", /don't (?:think|believe) we can ship Friday/);
  every("no damn way i'm working sunday", /I (?:won't|will not) be working Sunday/);
  every("the onboarding docs are garbage", /need significant work/);
});

test("sarcasm forms become the sincere complaint", () => {
  every("love how nobody read my email", /it seems (?:no one|nobody) (?:read|reviewed) my email/i);
  every("cool so we're just ignoring the deadline", /it seems we're ignoring/i);
  every("great so now we're doing weekend releases", /it seems we're now doing weekend releases/i);
  every("guess who broke the build", /I broke the build/);
  every("thanks for the 5pm friday request", /hard to fit in/);
  every("love that for us, the server is down again", /the server is/);
});

test("dropped subjects come back and requests to 'someone' become questions", () => {
  every("finally got the cert renewed, took forever", /I finally got the cert renewed\. It took a long time/);
  every("nope, can't approve that spend", /\bno\b.*\bI(?:'m unable| won't be able| can't)/i);
  every("thinking about going part time", /I'm thinking about going part time/);
  all("someone order more coffee").forEach((o) => assert.match(o, /could order more coffee|could someone order more coffee\?/i));
  all("quit leaving dishes in the sink").forEach((o) => assert.match(o, /stop leaving dishes/));
  all("pass on the happy hour").forEach((o) => assert.match(o, /I'll (?:have to )?pass on the happy hour/));
});

test("praise is framed as praise", () => {
  for (const s of ["support team handled the outage like pros", "finance handled the audit like champs", "good job everyone, great quarter"]) {
    const [, l2, l3] = all(s);
    assert.doesNotMatch(l2, /heads-up|Flagging/i, l2);
    assert.doesNotMatch(l3, /strategic download|key learning|headwind/i, l3);
  }
});

test("closures on a day are a schedule, not past news", () => {
  every("office closed monday for the holiday", /office is closed Monday/);
  every("parking garage closed friday for repairs", /garage is closed Friday/);
});
