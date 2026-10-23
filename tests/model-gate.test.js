import { test } from "node:test";
import assert from "node:assert/strict";
import { modelGate } from "../site/faithful.js";
import { polarityFlip, unitChanged, dayChanged, requestBroken } from "../site/meaning.js";

const bad = [
  ["the vendor screwed us on pricing", "The vendor did a great job on pricing.", "polarity"],
  ["nadia nailed the keynote", "Unfortunately, nadia nailed the keynote.", "polarity"],
  ["running 20 late bus broke down", "I'm running 20 miles late.", "units"],
  ["no damn way i'm working sunday", "I'm not working Saturday.", "meaning"],
  ["send the contract to tomas today", "Send the contract to Tom today.", "meaning"],
  ["move standup to 10 tomorrow", "Quick heads-up: I'll move standup to 10 tomorrow.", "request"],
  ["quit replying all to the whole company", "Let's keep replying all to the whole company.", "request"],
  ["pass on the bowling night", "Please pass on the bowling night.", "decline"],
  ["migraine, going offline", "I'm going offline.", "dropped"],
  ["no clue how this got approved", "Flagging that this got approved.", "dropped"],
  ["sorry missed your call was driving", "Apologies for missing your call. It was driving.", "subject"],
];
const good = [
  ["running 20 late bus broke down", "I'm running 20 minutes late because my bus broke down."],
  ["finally fixed the memory leak, took all week", "Quick win: we finally fixed the memory leak. It took all week."],
  ["oh perfect, the client wants another revision", "I'm concerned that the client wants another revision."],
  ["nope, can't sign off on that", "I'm not able to sign off on that."],
  ["thinking about going part time", "I'm thinking about going part-time."],
  ["send the contract to tomas today", "Please send the contract to Tomás today."],
  ["move standup to 10 tomorrow", "Could you move standup to 10 tomorrow?"],
  ["nightly backup didnt run", "Unfortunately, the overnight backup didn't run."],
];
test("modelGate rejects meaning changes", () => {
  for (const [i, o, why] of bad) assert.equal(modelGate(i, o).reason, why, `${i} -> ${o}`);
});
test("modelGate keeps faithful rewrites", () => {
  for (const [i, o] of good) assert.equal(modelGate(i, o).ok, true, `${i} -> ${o}: ${JSON.stringify(modelGate(i, o))}`);
});
test("helpers", () => {
  assert.equal(polarityFlip("love that the meeting got moved again", "Unfortunately, the meeting moved again."), "");
  assert.deepEqual(unitChanged("budget is $40k", "The budget is $40k."), []);
  assert.ok(unitChanged("took 3 hours", "took 3 days").length);
  assert.equal(dayChanged("off sat", "I'm off Sunday."), true);
  assert.equal(requestBroken("can someone grab lunch", "Could someone grab lunch?"), "");
});
