// Round 7 regression tests (project-synergy-research/round7): general classes found on fresh batch 10.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));

test("a crude noun after a verb never empties the output", () => {
  for (const s of ["the sales team keeps promising shit we can't build", "he never fixes his shit", "they keep asking for random crap", "i'm tired of doing all this shit", "stop dumping last minute crap on my team"]) {
    all(s).forEach((o, i) => { assert.ok(o.trim().length > 10, `L${i + 1} empty for ${s}`); assert.ok(!hasCrude(o), `L${i + 1}: ${o}`); });
  }
  every("the sales team keeps promising shit we can't build", /promising things we (?:can't|cannot) build/);
  every("stop dumping last minute crap on my team", /last-minute requests/);
});

test("sarcasm with 'love that' and 'sure, let's' reads as the worry underneath", () => {
  every("love that we found out about the layoffs on twitter", /frustrated that we found out about the layoffs on Twitter/);
  every("sure, let's add five more features two days before launch", /concern\w* about adding five more features two days before launch/);
  every("sure, let's add another approval step, that'll speed things up", /(?:don't think|don't believe) adding another approval step will speed things up/);
  none("love that we shipped on time", /frustrat|concern/);
});

test("fillers, follow-up questions and requests after a comma come out as proper sentences", () => {
  every("wait who's running the offsite this year", /who's running the offsite this year\?/);
  none("wait who's running the offsite this year", /\bwait\b/i);
  every("we literally just changed this last month, why again", /Why are we revisiting it\?|why we are revisiting it\?/);
  every("these numbers are fucked, someone double check them", /[Cc]ould someone double-check them\?/);
  every("honestly this meeting could've been an email, what a waste of time", /wasn't a good use of time/);
  none("honestly this meeting could've been an email, what a waste of time", /what not/);
});

test("product names, doctor's appointments and appearance words keep their meaning", () => {
  every("out sick today, will check slack later", /Slack/);
  every("heading out early today, doc appt", /doctor's appointment/);
  every("the slides look cheap, use the new template", /unpolished/);
  none("the slides look cheap, use the new template", /affordable|cost-effective/);
  every("huge shoutout to maria for saving the launch", /Maria/);
  none("huge shoutout to maria for saving the launch", /huge a big/i);
  none("jesus christ, the client changed the requirements again", /\bwin\b|excited/i);
});

test("Middle Manager uses manager words without adding meetings", () => {
  assert.match(toCorporate("that's not my job, ask ops", { level: 2 }), /loop in ops/);
  assert.match(toCorporate("that's not my job, ask ops", { level: 1 }), /check with ops/);
  assert.match(toCorporate("sounds good, talk later", { level: 1 }), /let's touch base later/);
  assert.match(toCorporate("can you look at my pr", { level: 2 }), /review my PR/);
  assert.doesNotMatch(toCorporate("my team is slammed", { level: 2 }), /squad/);
});

test("decode keeps who said no and what the no is about", () => {
  const legal = "Legal has advised that we are not able to use the customer's logo in our marketing materials.";
  assert.equal(toNormal(legal, { level: 1 }).summary, "Legal said we can't use the customer's logo in our marketing materials.");
  for (const l of [1, 2, 3]) assert.doesNotMatch(toNormal(legal, { level: l }).summary, /kindly|polite/i);
  assert.match(toNormal("According to compliance, we can't include the client's name in the case study.", { level: 2 }).summary, /^Compliance said no\. We can't include the client's name/);
  const perk = toNormal("After careful review, we will be sunsetting the annual wellness stipend effective January 1.", { level: 2 });
  assert.equal(perk.signal.id, "benefits");
  assert.match(perk.summary, /annual wellness stipend/);
  assert.equal(toNormal("We are sunsetting the legacy reporting dashboard in March.", { level: 2 }).signal.id, "shutdown");
  assert.match(toNormal("I'd like to set up some time to discuss some opportunities for growth in your role.", { level: 1 }).summary, /problems with your work/);
  assert.equal(toNormal("We are pausing all external hiring for the remainder of the fiscal year.", { level: 1 }).signal.id, "hiring-freeze");
  const idea = toNormal("That's an interesting idea. Let's take it offline and revisit when we have more bandwidth.", { level: 1 });
  assert.ok(idea.lines.every((l) => !/No hidden meaning/.test(l.plain)), JSON.stringify(idea.lines));
});

test("fresh11 classes: adverb 'here', trailing wtf, nvm, kiss-my-ass, said nobody, praise-then-problem", () => {
  every("the AC in here is broken as fuck", /the AC in here is (?:really |truly )?broken/);
  every("the parking situation here is a nightmare", /parking situation here is/);
  every("updated the doc here's the link", /Here's the link/);
  every("marketing changed the copy again without asking, wtf", /without asking, which is frustrating/);
  none("marketing changed the copy again without asking, wtf", /replicate|, what\b/);
  every("nvm figured it out", /never mind, I figured it out/i);
  every("that vendor can kiss my ass", /no longer willing to accommodate that (?:vendor|supplier|partner)/);
  every("thanks for letting me know the deadline moved, said nobody", /[Nn]obody (?:told|informed) me the (?:delivery )?deadline moved/);
  every("wow great planning, the venue is double booked", /the venue is double-booked/);
  none("wow great planning, the venue is double booked", /great planning|key win/i);
  every("could someone grab the projector from room b", /room B/);
  every("i'm done with this bullshit approval process", /fed up with/);
  every("whoever wrote this code should be fired lol", /serious concerns about this code/);
  none("whoever wrote this code should be fired lol", /fired/);
  every("the deck has too many words, cut half", /I'd suggest we cut it in half/);
  none("damn, i forgot the standup again", /that oh no/);
  assert.match(toCorporate("we finally closed the acme renewal", { level: 2 }), /win/i);
  assert.match(toCorporate("lmk when you're free to chat", { level: 2 }), /^Quick ask: let me know/);
  assert.doesNotMatch(toCorporate("can you resend the invite, i can't find it", { level: 2 }), /won't be able/);
});

test("fresh11 decode classes: new target quarter, more ownership, teams combined, bonuses after a miss", () => {
  assert.equal(toNormal("Due to unforeseen dependencies, the Q1 launch will now target a late Q2 release.", { level: 1 }).signal.id, "delay");
  assert.equal(toNormal("Moving forward, I'd like to see more ownership and urgency on your deliverables.", { level: 1 }).signal.id, "performance");
  assert.equal(toNormal("As part of our evolution, the support and success teams will be combined under one leader.", { level: 1 }).signal.id, "reorg");
  assert.match(toNormal("Bonuses this year will reflect company performance, which fell short of targets.", { level: 1 }).summary, /Bonuses will be smaller/);
});

test("fresh12 classes: quit + apostrophe, what's up, wiki sarcasm, skip testing, README, saved our butts", () => {
  every("quit cc'ing the whole damn company", /stop cc'ing the whole/);
  none("quit cc'ing the whole damn company", /left|moved on/);
  every("sry missed ur call, whats up", /What's up\?|what's up\?/);
  every("love how the wiki is always out of date", /frustrated that the wiki is always out of date/);
  every("yeah let's just skip testing, what could go wrong", /concern\w* about the risk if we skip testing/);
  every("the readme is confusing, add examples", /README (?:is confusing|lacks clarity)\. I.d suggest we add examples/);
  none("the ops team saved our butts last night", /butts/);
  assert.equal(toNormal("We're making changes that will result in the departure of some team members.", { level: 1 }).signal.id, "layoffs");
  assert.equal(toNormal("The company will no longer cover the cost of mobile phone plans.", { level: 1 }).signal.id, "benefits");
  assert.equal(toNormal("Effective Monday, the analytics team will report to the CFO.", { level: 1 }).signal.id, "reorg");
  assert.equal(toNormal("Thanks for raising this. We'll take it under advisement.", { level: 1 }).signal.id, "deflection");
});
