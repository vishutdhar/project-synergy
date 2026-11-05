// Round 22 (Nov 5, 2026): raise Full C-Suite funny-rate and cut stock sandwiches by rewriting more
// everyday office bodies into deadpan corporate euphemism; generalize decode shapes that fresh58/60
 // missed (pay cycle moves, soft freezes, hub relocates, free->paid, keep-as-is good news, soft layoffs,
// performance paper trails, price hikes misread as good).

import { LEX } from "./round20.js";
import { MILESTONES19, REASONS19 } from "./round19.js";

// Input cleanup: blunt leftovers, sarcasm, telegraphic fragments that stayed ungrammatical.
export function preclean22(raw) {
  let t = String(raw ?? "");
  if (/\n/.test(t) || t.length > 240) return t;
  // Blunt leftovers. Do NOT rewrite dumpster fire / shitshow here (existing crude lexicon owns those).
  t = t.replace(/\bstop (?:breathing down my neck|hounding me|nagging me|pestering me) about\b/gi, "please ease up on the follow-ups about");
  t = t.replace(/\bI'm not your personal secretary\b/gi, "I'm not available as an on-demand executive assistant");
  t = t.replace(/\b(is|are|was|were) (?:absolute |total |complete |utter )?garbage(?= and | but )/gi, "$1 low quality");
  t = t.replace(/\bshould be ashamed(?: of (?:themselves|himself|herself))?\b/gi, "should revisit it carefully");
  t = t.replace(/\bI'm so done (?:with )?babysitting grown adults who can't\b/gi, "I've reached the end of my enthusiasm runway for coaching colleagues who cannot");
  t = t.replace(/\bI'm tired of pretending (this|that|the) ([\w -]{2,30}?) isn't broken\b/gi, (_m, d, x) => `I'm done pretending ${d} ${x} is working as designed`);
  t = t.replace(/\bdon't dump (?:your |this )?(?:emergency|mess) on (?:my desk|me) at\b/gi, "please don't escalate last-minute work onto my desk at");
  // Narrow sarcasm (optional→mandatory only; leave yay/nothing-says to older rounds).
  t = t.replace(/^(?:love|loved) that (?:the |our |my )?['"]?optional['"]? (.+?) has a (mandatory|required) (.+?)[.!]*$/i, (_m, a, k, b) => `I'm not thrilled that the supposedly optional ${a} has a ${k} ${b}.`);
  t = t.replace(/^(?:thrilled|excited|delighted) (?:that |the )?(.+?)[.!]*$/i, (m0, x) => (/\b(?:again|broke\w*|died|double-booked|sideways|pink|jammed|cancel\w*|late|missed|reorg|deadline)\b/i.test(x) ? `I'm not thrilled that ${x}.` : m0));
  t = t.replace(/^(?:can't wait|cannot wait) (?:for|to) (?:another |yet another )?(.+?)[.!]*$/i, (_m, x) => `I'm not looking forward to ${x}.`);
  t = t.replace(/^(?:perfect|awesome|amazing|brilliant)[,!]+\s+(?=(?:the|our|my|leadership|wifi|build|printer)\b)/i, "Unfortunately, ");
  // Specific telegraphic status lines.
  t = t.replace(/^(bug|issue|defect) reproduced, fix in review[.!]*$/i, "The bug has been reproduced, and the fix is in review.");
  t = t.replace(/^interviews wrapped, debrief at (\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)[.!]*$/i, (_m, t0) => `The interviews have wrapped, and the debrief is at ${t0}.`);
  t = t.replace(/^server patched, reboot at (midnight|noon|\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)[.!]*$/i, (_m, t0) => `The server has been patched, and the reboot is at ${t0}.`);
  t = t.replace(/^payroll ran, (?:a few )?([\w -]{2,40}?) pending[.!]*$/i, (_m, x) => `Payroll has run, and ${x} ${/s\b/i.test(x.trim().split(" ").pop()) ? "are" : "is"} still pending.`);
  t = t.replace(/^([\w -]{2,30}?) (?:is )?with the (CEO|CFO|CTO|VP|board|legal|finance) for (comments?|review|sign-off|approval)[.!]*$/i, (_m, x, who, act) => `The ${x.toLowerCase()} is with the ${who} for ${act}.`);
  t = t.replace(/\bstop pinging me every ([\w ]{1,20})\b/gi, "please stop messaging me every $1");
  return t;
}

const FRAMEWORDS = /^(?:In|Leaning|Pursuant|Cascading|Circling|Flagging|Surfacing|Escalating|Bottom|Level-setting|Raising|Double-clicking|A|After|Practicing|Proactively|Transparently|Owning|Celebrating|Excited|Humbled|Thrilled|Not|Bringing|Seeking|Asking|For|Quick|Sharing|Looping|Heads-up|Just|Candidly|Having|From)\b/;

export function fix22(text, raw) {
  let t = String(text ?? "");
  const src = String(raw ?? "");
  t = t.replace(/\bThe the\b/g, "The").replace(/\bthe the\b/g, "the");
  t = t.replace(/\bWe've been have been\b/g, "We've been").replace(/\bwe have been have been\b/gi, "we have been");
  t = t.replace(/\b(a highly selective delivery strategy)(, \1)+/gi, "$1");
  t = t.replace(/\babsolute junk because the send it is back\b/gi, "low quality; please send it back");
  t = t.replace(/\bis absolute junk because\b/gi, "is low quality, so");
  t = t.replace(/\ba scheduled wellness audit, a scheduled personal-infrastructure check\b/gi, "a scheduled personal-infrastructure check");
  t = t.replace(/\bstop cc'ing the whole company, a stakeholder ecosystem of considerable size on\b/gi, "stop cc'ing the whole company on");
  // "stop following up closely and often" leftover from breathing-down rewrite without "please"
  t = t.replace(/\bstop following up closely and often about\b/gi, "please ease up on the follow-ups about");
  t = t.replace(/\bplease ease up on the follow-ups about the unplanned creative spelling\b/gi, "please ease up on the follow-ups about the typo");
  // Decline lines should not keep a praise/celebration frame.
  if (/\b(?:pass on|I'll pass|sit this one out|declin\w+|not free to|can't take on|won't be extending|not comfortable|say no)\b/i.test(src)) {
    t = t.replace(/^(?:Taking a beat to recognize exceptional impact|Celebrating a win for our stakeholder ecosystem|Humbled and honored to share that|Excited to cascade that|Thrilled to share that|In the spirit of recognition-first leadership)[:,]?\s+/i, "After careful consideration and with our north star in mind, ");
  }
  // Good-news wins should not keep problem frames.
  if (/\b(?:cut .+ in half|freeze is lifted|resolved|ahead of schedule|bonuses? will be paid|hiring \d+|closed (?:our |the )?(?:largest|biggest)|free lunch|extra day off)\b/i.test(src) && !/\b(?:but|however|unfortunately|still broken|still down)\b/i.test(src)) {
    t = t.replace(/^(?:Raising a flag|Flagging for visibility|Leaning into the discomfort here|Surfacing a (?:[\w-]+ )?headwind|Not every chapter is a highlight reel|Escalating a [\w-]+ headwind)[:,]?\s+/i, "Humbled and honored to share that ");
  }
  // "and The ETA" style already partly fixed; catch "fix in review" mid-sentence caps after frame
  t = t.replace(/(, (?:and|so|but) )(The|A|An|It|This|That|Our|My|Its)\b/g, (_m, a, w) => `${a}${w.toLowerCase()}`);
  // Greeting + frame casing
  t = t.replace(/^((?:Hey|Hi|Hello)(?: team| all| everyone)?), ([A-Z][a-z-]+)/, (m0, g, w) => (FRAMEWORDS.test(w) ? `${g}, ${w.toLowerCase()}` : m0));
  // "I'm still searching for the strategic upside in the fact that" is fine; ensure question marks stay on questions
  if (/\?/.test(src) && !/\?\s*$/.test(src)) t = t.replace(/(\?\s+)((?!(?:Who|What|When|Where|Why|How|Which|Is|Are|Do|Does|Did|Can|Could|Would|Will|Should|Has|Have|Any)\b)[A-Z][^?.!]{2,120})\?/g, (m0, a, b) => (/(?:^|[:,]\s)(?:who|what|when|where|why|how|which|is|are|am|do|does|did|can|could|would|will|should|has|have|any)\b/i.test(b) ? m0 : `${a}${b}.`));
  return t;
}

// Full C-Suite body jokes: everyday office shapes that were still stock sandwiches on fresh58.
LEX.push(
  // Missing / stuck / out-of things around the office.
  [/\b(?:has been |have been |is |are )?missing for (a week|two weeks|three weeks|\d+ days|ages|forever)\b/i, (m) => `has embarked on an unauthorized sabbatical for ${m[1]}`, "place", 2],
  [/\bparked in my (reserved |assigned )?(spot|space|stall) again\b/i, (m) => `has reassigned my ${m[1] ?? ""}${m[2]} to themselves again, a bold interpretation of shared resources`, "place", 2],
  [/\b(?:window )?blinds? (?:in the [\w ]{2,30}? )?(?:are |is )?stuck (halfway|half[- ]open|half[- ]closed|shut|open)\b/i, (m) => `blinds remain committed to a permanent ${m[1]} posture`, "place", 2],
  [/\bthere(?:'s| is) a (bird|bat|raccoon|squirrel|mouse|rat) in the (warehouse|office|attic|ceiling|lobby|kitchen)\b/i, (m) => `we have onboarded an unscheduled ${m[1]} stakeholder in the ${m[2]}`, "place", 2],
  [/\bnobody knows how to (adjust|use|work|open|close|reset) (?:them|it|the [\w -]{2,20})\b/i, (m) => `enablement on how to ${m[1]} them remains a stretch goal`, "docs", 2],
  [/\b(?:is|are) out of (soap|paper towels|toilet paper|hand sanitizer|tissues|cups|forks|spoons|plates)\b/i, (m) => `${/^are/i.test(m[0]) ? "are" : "is"} at zero inventory on ${m[1]}`, "place", 2],
  [/\bbeeps forever after every (burrito|meal|lunch|dinner|fish|leftovers)\b/i, (m) => `delivers an infinite audio retrospective after every ${m[1]}`, "food", 2],
  [/\bplease stop reheating (fish|seafood|salmon|tuna|broccoli|cabbage)\b/i, (m) => `please retire ${m[1]} from the shared thermal-reheating roadmap`, "food", 2],
  [/\b(?:left|leaves|leaving) a (crockpot|slow cooker|toaster|iron|space heater) on overnight\b/i, (m) => `left a ${m[1]} running an unauthorized overnight heat strategy`, "place", 2],
  [/\bglitter everywhere after the (craft hour|party|event|celebration)\b/i, (m) => `glitter has achieved full workplace saturation after the ${m[1]}`, "place", 2],
  [/\b(?:bike rack|parking lot) is full of abandoned (bikes|cars|scooters)\b/i, (m) => `${m[0].split(" ")[0]} ${m[0].split(" ")[1]} now hosts a long-term ${m[2]} archive`, "place", 2],
  [/\b(?:whiteboard )?markers? (?:are|is) (?:all )?dried out\b/i, () => "whiteboard marker inventory has reached a fully dehydrated state", "place", 2],
  [/\b(?:the )?plant by the ([\w ]{2,20}?) is basically a stick\b/i, (m) => `the plant by the ${m[1]} has completed its journey to stickhood`, "place", 2],
  [/\blost my badge again\b/i, () => "my badge has pursued another unauthorized exit", "place", 2],
  [/\bvending machine ate my (dollar|money|card|snack)\b/i, (m) => `vending machine aggressively monetized my ${m[1]}`, "food", 2],
  [/\b(?:sliding )?door (?:on the [\w ]{2,20}?)?(?:sticks|is stuck),? you have to yank it\b/i, () => "door requires a firm stakeholder intervention to open", "place", 2],
  // Status / tickets / process.
  [/\b(?:the )?(?:bug|issue|defect) has been reproduced, and the fix is in review\b/i, () => "the defect has been successfully reproduced, and the fix is enjoying a thorough peer-review sabbatical", "tech", 2],
  [/\bbug reproduced, fix in review\b/i, () => "the defect has been successfully reproduced, and the fix is enjoying a thorough peer-review sabbatical", "tech", 2],
  [/\binterviews have wrapped, and the debrief is at\b/i, () => "interviews have concluded, and the debrief is calendared at", "people", 2],
  [/\bserver has been patched, and the reboot is at\b/i, () => "server has received its scheduled resilience patch, and the reboot is at", "tech", 2],
  [/\bis with the (CEO|CFO|CTO|VP|board) for (comments?|review|sign-off|approval)\b/i, (m) => `is currently in a high-altitude ${m[2]} loop with the ${m[1]}`, "people", 2],
  [/\bgoing back and forth on the (price|pricing|quote|rate|fee) again\b/i, (m) => `is conducting an extended negotiation theater on the ${m[1]} again`, "money", 2],
  [/\bI won't be doing (\w+)(?:'s)? (slides|deck|report|homework|work) for (?:him|her|them) again\b/i, (m) => `I will not be performing ${m[1]}'s ${m[2]} as a recurring courtesy again`, "no", 2],
  [/\blow quality and out of date\b/i, () => "delivering a below-baseline and fully vintage experience", "docs", 2],
  [/\bheld together with (gum|tape|hopes?|prayers?|vibes|string)\b/i, (m) => `held together with a resilient application of ${m[1]} and optimism`, "tech", 2],
  [/\bevery time I fix one (?:issue|bug) two more show up\b/i, () => "every remediated issue onboards two new colleagues into the backlog", "tech", 2],
  [/\bwe were promised ([\w -]{2,30}?) in (\w+) and it(?:'s| is) (\w+)\b/i, (m) => `we were promised ${m[1]} in ${m[2]}, and the calendar has since advanced to ${m[3]}`, "time", 2],
  [/\bkeeps? getting added to projects without anyone asking\b/i, () => "remain a preferred destination for unsolicited project assignments", "people", 2],
  [/\bsends feedback at (\d{1,2}(?::\d{2})?\s*(?:pm|am|PM|AM)) and expects changes by (\d{1,2}(?::\d{2})?\s*(?:pm|am|PM|AM))\b/i, (m) => `gifts feedback at ${m[1]} with a same-morning turnaround aspiration of ${m[2]}`, "time", 2],
  [/\bexpense tool rejects every receipt that isn't a perfect photo\b/i, () => "expense tool maintains museum-grade standards for receipt photography", "money", 2],
  [/\b(?:the )?meeting(?:s)? started (\d+ minutes) (?:late|behind schedule) again because the room was double-booked\b/i, (m) => `the alignment session started ${m[1]} behind schedule again because the room embraced a double-booking strategy`, "time", 2],
  [/\bchurn went up from ([\d.%]+) to ([\d.%]+) after the (price change|increase|reprice)\b/i, (m) => `churn achieved record-breaking growth from ${m[1]} to ${m[2]} after the ${m[3]}, which is the wrong kind of growth`, "money", 2],
  [/\b(?:support )?backlog is at ([\d,]+) tickets?, up from ([\d,]+)\b/i, (m) => `support backlog is holding steady at a robust ${m[1]} tickets, up from ${m[2]}, currently in a patient holding pattern`, "time", 2],
  [/\bwe're at (\d+%) of quota with ([\w ]{2,30}?) left in the (quarter|month|year)\b/i, (m) => `we're at a character-building ${m[1]} of quota with ${m[2]} left in the ${m[3]}`, "money", 2],
  [/\bnot offering refunds on ([\w -]{2,30}?)\b/i, (m) => `are not in a position to offer refunds on ${m[1]}`, "no", 2],
  [/\bcan't move the launch again\b/i, () => "cannot reopen the launch timeline again", "no", 2],
  [/\bI'm not going to sign off on this until I see the actual (numbers|figures|data|metrics)\b/i, (m) => `I will withhold sign-off until the actual ${m[1]} join the conversation`, "no", 2],
  [/\bsorry,? I(?:'m| am) unable to join the ([\w -]{2,40})\b/i, (m) => `I need to decline joining the ${m[1]}`, "no", 2],
  [/\bthanks but I(?:'ll| will) pass on (.+?)[.!]*$/i, (m) => `thanks, but I'll be passing on ${m[1]}`, "no", 2],
  [/\bI don't (?:think|believe) we should hire another (agency|vendor|consultant)\b/i, (m) => `I would advise against hiring another ${m[1]} at this time`, "no", 2],
  [/\bno more scope changes after (\w+)\b/i, (m) => `scope changes are closed after ${m[1]}`, "no", 2],
  [/\bdoes anyone know if (.+?)\?\s*$/i, (m) => `does anyone have line of sight on whether ${m[1]}?`, "ask", 2],
  [/\bare we still doing the ([\w -]{2,40}?) (?:thing |event )?this (year|quarter|month|season)\?/i, (m) => `are we still green-lighting the ${m[1]} this ${m[2]}?`, "ask", 2],
  [/\bis there a template for (?:the )?([\w -]{2,40}?) or do I make one\?/i, (m) => `is there an approved template for the ${m[1]}, or am I inventing one?`, "ask", 2],
  [/\bis it (?:ok|okay|OK) to share (?:the )?([\w -]{2,40}?) with (?:the )?([\w -]{2,30}?) or is it internal only\?/i, (m) => `is sharing the ${m[1]} with the ${m[2]} pre-approved, or is it internal-only?`, "ask", 2],
  // More general complaint/status shapes.
  [/\bopen office is so loud (?:I|that I) can't hear my own calls\b/i, () => "open office delivers an aggressively immersive soundscape such that I can't hear my own calls", "place", 2],
  [/\b(?:I've been |I have been |we've been |we have been )?waiting on (legal|finance|IT|HR|procurement) for (two|three|four|five|six|\d+) weeks? on (?:a |an )?([\w -]{2,40})\b/i, (m) => `we've been in a patient holding pattern with ${m[1]} for ${m[2]} weeks on a ${m[3]}`, "time", 2],
  [/\bstandups? keep starting (\d+ minutes) late because people don't show\b/i, (m) => `standups keep starting ${m[1]} late because attendance remains aspirational`, "time", 2],
  [/\bnobody updates the (wiki|docs|runbook|tracker|board)\b/i, (m) => `updating the ${m[1]} remains a stretch goal for the organization`, "docs", 2],
  [/\bAC on our floor has been (?:broken|down|out) since (\w+)\b/i, (m) => `AC on our floor has been on an unscheduled sabbatical since ${m[1]}`, "place", 2],
  [/\bwe keep getting pulled into meetings that could have been an email\b/i, () => "we remain deeply committed to meetings that could have been an email", "process", 2],
  [/\bfinance takes ([\w ]{2,20}?) to approve (?:a |an )?(?:\$)?([\d,]+) ([\w -]{2,30})\b/i, (m) => `finance takes a leisurely ${m[1]} to approve a $${m[2]} ${m[3]}`, "process", 2],
  [/\b(?:the )?client changed the scope again after we locked the brief\b/i, () => "the client exercised strategic agility on scope again after we locked the brief", "people", 2],
  [/\bour team is always the last to hear about ([\w -]{2,40})\b/i, (m) => `our team enjoys a last-to-know communication tier for ${m[1]}`, "people", 2],
  [/\bI've asked (\w+) (two|three|four|five|\d+) times for (?:the )?([\w -]{2,30}?) and nothing\b/i, (m) => `I've submitted ${m[2]} requests to ${m[1]} for the ${m[3]}, and the response remains in a patient holding pattern`, "people", 2],
  [/\broot cause (?:is )?still pending\b/i, () => "the root cause remains at large", "tech", 2],
  [/\bdeal (?:with [\w -]+ )?fell through\b/i, () => "the deal has exited our pipeline to pursue other opportunities", "loss", 2],
  [/\bwe burned through (\d+%) of (?:the |our )?([\w ]{2,30}?budget)( by \w+)?\b/i, (m) => `we front-loaded ${m[1]} of the ${m[2]}${m[3] ?? ""}, an aggressively ahead-of-schedule investment strategy`, "money", 2],
  [/\bwe shipped (\d+) of the (\d+) (features|items|deliverables|milestones) we promised(?: this (?:quarter|month|year))?\b/i, (m) => `we shipped ${m[1]} of the ${m[2]} ${m[3]} we promised, a highly selective delivery strategy`, "money", 2],
  [/\bthree different ([\w-]+ )?project tools\b/i, (m) => `a diversified portfolio of three ${m[1] ?? ""}project tools`, "process", 2],
  [/\bcode is spaghetti\b/i, () => "code embraces a bold, non-linear architecture", "tech", 2],
  [/\bbabysitting the contractors\b/i, () => "providing white-glove supervision to our external talent partners", "people", 2],
  [/\bspent (\$[\d,.]+k?) on swag nobody wanted\b/i, (m) => `invested ${m[1]} in swag with an exclusive audience of zero`, "money", 2],
  [/\bplease stop (?:cc'ing|ccing|copying) the whole (company|org|team) on routine updates\b/i, (m) => `please reserve company-wide broadcasts for non-routine updates rather than cc'ing the whole ${m[1]}`, "people", 2],
  [/\breheating fish\b/i, () => "deploying fish into the shared thermal-reheating asset", "food", 1],
);

MILESTONES19.push(
  [/\bpassed the bar(?: exam)?\b/i, "My professional credentialing journey has cleared a major gate."],
  [/\bour puppy finally slept through the night\b/i, "Our youngest four-legged stakeholder achieved an overnight uptime milestone."],
  [/\bgot into the (?:executive )?coaching cohort\b/i, "My leadership development journey has been formally green-lit."],
  [/\bhit five years at (?:the )?company\b/i, "My tenure has reached a five-year strategic milestone."],
  [/\bran my first (half marathon|10k|5k|marathon)\b/i, "My personal endurance roadmap just logged a first-of-kind milestone."],
  [/\bwe're expecting our first kid\b/i, "Our family org chart is preparing for a planned headcount increase."],
  [/\bpassed my PMP exam\b/i, "My project-leadership credential is now officially online."],
  [/\bclosed on our condo\b/i, "My personal real-estate portfolio has closed a downtown acquisition."],
);

REASONS19.push(
  [/\bfor a long weekend up north\b/i, "for a long weekend up north, a regional recharge offsite of one"],
  [/\bfor a visa appointment\b/i, "for a visa appointment, a critical mobility-compliance engagement"],
  [/\bfor my kid's school play\b/i, "for my kid's school play, where a key family stakeholder takes the stage"],
  [/\bfor a family thing\b/i, "for a family stakeholder engagement"],
  [/\bthroat is wrecked\b/i, "my vocal infrastructure requires an unplanned maintenance window"],
  [/\bfor a family wedding in (\w+)\b/i, (m) => `for a family wedding in ${m[1]}, a high-priority personal offsite`],
  [/\bfor a dentist appointment\b/i, "for a dentist appointment, a scheduled personal-infrastructure check"],
);
