import { test } from "node:test";
import assert from "node:assert/strict";
import { faithfulToCrude, needsFaithCheck } from "../site/faithful.js";

test("AI replies to crude input must keep the point", () => {
  const keep = [
    ["fuck all was done in that meeting", "Nothing was accomplished in that meeting."],
    ["the plan is to fuck off all day today", "The plan is to slack off all day today."],
    ["We got fuck all done this sprint.", "We've hit zero progress this sprint."],
  ];
  for (const [i, o] of keep) assert.ok(faithfulToCrude(i, o, { level: 3 }).ok, o);
  const drift = [
    ["Who gives a crap about synergy?", "Who's the point?"],
    ["If the audit finds this we're fucked.", "If there's an audit, we're in trouble."],
    ["Honestly, nobody gives a shit about the new logo.", "Honestly, I don't need to care about the new logo."],
    ["Stop bitching about the parking situation.", "Stop fretting about the parking situation."],
    ["I worked my ass off on this proposal.", "This proposal was a significant effort, and I am not yet ready to implement it."],
    ["That's bullshit and you know it.", "I don't think that's the right option, and you're not aware of it."],
    ["Marketing did jack shit on the launch.", "Marketing wasn't on the radar during launch time."],
  ];
  for (const [i, o] of drift) assert.equal(faithfulToCrude(i, o, { level: 2 }).ok, false, o);
});

test("only crude input gets the extra check", () => {
  assert.equal(needsFaithCheck("Can we move the 3pm to Friday?"), false);
  assert.equal(needsFaithCheck("fuck all was done in that meeting"), true);
});
