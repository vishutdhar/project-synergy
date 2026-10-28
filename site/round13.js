// Round 13: general sentence shapes from fresh40 (Oct 27). Each rule is a shape, not a single phrase.
// 1. Status fragments with a dropped subject or verb ("server rebooted, all good", "migration 80% done",
//    "revenue flat vs last quarter", "jury duty all next week", "started on the Q1 plan").
// 2. Sarcasm with no trigger word ("perfect timing for X", "clearly the best use of my time is X",
//    "good thing nobody reads X anyway", "oh sure, let's X again", "love a surprise X on a Tuesday").
// 3. Slang read word by word ("no way we hit friday", "crushing it, damn", "repro'd", "another reorg").

const cap1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const capDays = (s) => s.replace(new RegExp(`\\b(${DAYS})\\b`, "gi"), (d) => d[0].toUpperCase() + d.slice(1).toLowerCase());
const PRON = { our: "us", my: "me", their: "them", your: "you", his: "him", her: "her" };
// Things that read as a team/system subject, so "X 80% done" and "X backed up" get "The".
const THING = String.raw`(?:migration|rollout|refactor|backfill|upload|download|import|export|deploy|deployment|release|build|review|audit|launch|onboarding|setup|install|integration|test suite|tests|sprint|project|report|deck|draft|doc|spec|backlog|queue|inbox|pipeline|ticket queue|support queue|server|database|cache|index|sync|transfer|upgrade|update|survey|analysis|forecast|budget|plan|campaign|hiring|training|cleanup|move|redesign|rebrand|translation|backup)`;

function lines13(t) {
  let m;
  const s = t.replace(/[.!]+$/, "").trim();
  // "no fucking way we hit friday": doubt about a deadline, not amazement.
  if ((m = s.match(new RegExp(String.raw`^no (?:\w+ )?way,? (we|I|they|he|she|you) (?:will |'ll |can )?(hit|make|finish|ship|meet|launch|close|deliver|get this done by|get it done by) (${DAYS}|the deadline|the date|eod|EOD|tomorrow|tonight|today|this week|next week|the target|the quarter|Q[1-4]|the launch date|on time|in time)$`, "i")))) {
    const who = m[1] === "I" ? "I" : m[1].toLowerCase();
    return `I don't think ${who} can ${m[2].toLowerCase()} ${capDays(m[3]).replace(/^eod$/i, "EOD")}.`;
  }
  // "jesus christ, another reorg" / "ugh, another all-hands"
  if ((m = s.match(/^(?:ugh|sigh|great|wow|oh no|oh great|omg|oh my god|jesus(?: christ)?|christ|seriously|again|lovely|cool),? (another|yet another|one more) ([a-z][\w' -]{1,40})$/i))) return `Unfortunately, there's ${m[1].toLowerCase()} ${m[2]}.`;
  // Sarcasm with no trigger word.
  if ((m = s.match(/^(?:oh,? )?(?:perfect|great|amazing|excellent|fantastic|wonderful|brilliant|impeccable) timing (?:for|on) (?:the |our |my )?(.+?) to (crash|die|break|go down|fail|freeze|lag|reboot|update|act up|stop working|run out)$/i))) return `The timing of the ${m[1].toLowerCase()} ${m[2].replace(/^(\w+)/, (v) => ({ crash: "crashing", die: "dying", break: "breaking", go: "going", fail: "failing", freeze: "freezing", lag: "lagging", reboot: "rebooting", update: "updating", act: "acting", stop: "stopping", run: "running" })[v.toLowerCase()] ?? v)} wasn't ideal.`;
  if ((m = s.match(/^(?:clearly|obviously|definitely|surely|of course),? the (?:best|most valuable|smartest|highest-impact) use of (my|our|your|the team's) time is (.+)$/i))) return `I'm not sure ${m[2]} is the best use of ${m[1].toLowerCase()} time.`;
  if ((m = s.match(/^(?:good thing|lucky|glad|thank god|thankfully),? (?:nobody|no one|no-one) (reads|uses|opens|checks|looks at|watches|cares about|tests) (.+?)(?: anyway| anyways)?$/i))) return `I'm not sure anyone ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = s.match(/^(?:oh |yeah |sure |great |cool )*(?:sure|great|yeah|cool|ok|okay|right|perfect),? let'?s (?:just )?(reinvent the wheel|start over|redo it|redo everything|rewrite it|rebuild it|change it|move it|add another meeting|have another meeting|do it again|scrap it)(?: again| one more time| from scratch)?$/i))) return `Let's not ${m[1].toLowerCase()} again.`;
  if ((m = s.match(/^(?:I )?(?:just |really |totally |gotta |got to |do )?(?:love|adore|enjoy) (?:a|an|the) (surprise|last-minute|late-night|friday|monday|4:59(?: ?pm)?|5pm|weekend|mystery|unannounced|8am|7am) (.+)$/i))) return `I'm not a fan of a ${m[1].toLowerCase()} ${capDays(m[2])}.`;
  // Praise with a trailing "damn": "the new hire is crushing it, damn".
  if ((m = s.match(/^(.+? (?:is|are|was|were) (?:absolutely |totally |really )?(?:crushing|killing|nailing|smashing|acing|owning|rocking) it),?\s*(?:damn|dang|holy shit|holy crap|wow|sheesh|geez)$/i))) return `${cap1(m[1])}.`;
  // Fragments with the subject or verb dropped.
  if ((m = s.match(new RegExp(String.raw`^(?:the |our )?(${THING}) (?:is )?(\d{1,3})% (done|complete|finished|through|there)$`, "i")))) return `The ${m[1].toLowerCase()} is ${m[2]}% ${m[3].toLowerCase() === "there" ? "of the way there" : m[3].toLowerCase()}.`;
  if ((m = s.match(new RegExp(String.raw`^(?:the |our )?(${THING})(?:'s| is) (backed up|full|empty|stuck|slow|down|frozen|jammed|clogged|flooded)$`, "i")))) return `The ${m[1].toLowerCase()} is ${m[2].toLowerCase()}.`;
  if ((m = s.match(/^(revenue|sales|traffic|signups|sign-ups|costs|spend|churn|retention|usage|engagement|margins?|bookings|pipeline|conversion|growth|headcount|NPS|downloads) (?:is |are |was |were )?(flat|up|down|steady|even) (?:(\d+(?:\.\d+)?%) )?(?:vs\.?|versus|compared to|compared with|from|over|on) (?!.*\bto \d)(.+)$/i))) {
    const pl = /^(?:sales|signups|sign-ups|costs|margins|bookings|downloads)$/i.test(m[1]);
    const subj = /^NPS$/i.test(m[1]) ? "NPS" : cap1(m[1].toLowerCase());
    return `${subj} ${pl ? "are" : "is"} ${m[2].toLowerCase()}${m[3] ? ` ${m[3]}` : ""} compared with ${m[4].replace(/^the /i, "")}.`;
  }
  if ((m = s.match(/^(costs|spend|revenue|sales|traffic|signups|sign-ups|churn|refunds|returns|tickets|support tickets|prices|expenses|bookings|downloads|installs|usage|latency|errors|complaints) (went|have gone|are|is|were|was) (up|down) (?:by )?(\d+(?:\.\d+)?%|\d+x|\$[\d,.]+[kmb]?)(.*)$/i))) return `${cap1(m[1].toLowerCase())} ${m[2].toLowerCase()} ${m[3].toLowerCase()} ${m[4]}${m[5]}.`;
  if ((m = s.match(/^(jury duty|jury service|a dentist appointment|dentist|physio|therapy|a doctor's appointment|training|a training|an offsite|the offsite|a conference|a workshop|parent-teacher conferences?|a funeral|a wedding) (all (?:day|morning|afternoon|week)(?: \w+)?|all next week|all this week|next week|this week|today|tomorrow|this afternoon|this morning|on \w+day|\w+day|until \w+day|till \w+day|through \w+day)$/i))) return `I have ${m[1].toLowerCase().replace(/^dentist$/, "a dentist appointment").replace(/^physio$/, "physio").replace(/^training$/, "training")} ${capDays(m[2]).replace(/^till /, "until ")}.`;
  if ((m = s.match(/^(started|finished|wrapped up|kicked off|lost|forgot|misplaced|found|broke|spilled coffee on|dropped|cracked) (?:on )?(the|my|our|a|an) (.+)$/i)) && !/\b(?:is|are|was|were|and|but)\b/i.test(m[3]) && m[3].split(" ").length <= 5) {
    const v = m[1].toLowerCase();
    return `I ${v}${/^started$/.test(v) && /^started on/i.test(s) ? " on" : ""} ${m[2].toLowerCase()} ${m[3]}.`;
  }
  if ((m = s.match(/^best (sprint|quarter|launch|demo|week|month|year|meeting|offsite|release|retro|pitch|day) (we've|I've|we have|I have|the team has) (ever )?(had|done|run|shipped|seen)$/i))) return `This was the best ${m[1].toLowerCase()} ${m[2].replace(/^we have$/i, "we've").replace(/^I have$/, "I've")} ${m[3] ?? ""}${m[4].toLowerCase()}.`.replace(/ {2,}/g, " ");
  if ((m = s.match(/^(?:way |far |so )?too many (meetings|calls|syncs|emails|messages|pings|tickets|tabs|tools|approvals|approval steps|reviews|reviewers|cooks|dashboards|channels) (on|in|for) (my|the|our|this) (.+)$/i))) return `There are too many ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3].toLowerCase()} ${m[4]}.`;
  if ((m = s.match(/^no (updates|news|word|reply|replies|response|responses|change|changes|progress|movement|decision|feedback|ETA|eta) (?:yet|so far|from (.+?)(?: yet)?)$/i))) return `There's no ${m[1].toLowerCase().replace(/^eta$/, "ETA")} ${m[2] ? `from ${m[2]} ` : ""}yet.`.replace("There's no updates", "There are no updates").replace("There's no replies", "There are no replies").replace("There's no responses", "There are no responses").replace("There's no changes", "There are no changes");
  if ((m = s.match(/^(?:the )?([a-z][\w-]*(?: [a-z][\w-]*)?) (packed up|set up|cleaned up|wrapped up|torn down|shipped|printed|booked|sorted|signed off|rebooted|restarted|patched|unblocked|cleared)(?:,\s*(all good|all set|looks good|we're good|good to go|done))?$/i)) && !/^(?:I|we|you|he|she|they|it|just|still|all|everything|nothing|it's|that|this|i'm|i've)$/i.test(m[1].split(" ")[0]) && !/^(?:my|our)$/i.test(m[1])) {
    const pl = /s$/i.test(m[1]) && !/(?:ss|us|is)$/i.test(m[1]);
    const tail = m[3] ? ", and it's back to normal" : "";
    return `The ${m[1].toLowerCase()} ${pl ? "have" : "has"} been ${m[2].toLowerCase()}${tail}.`;
  }
  if ((m = s.match(/^(?:headed|heading) (out|home|offline|to the airport|to lunch),? (?:but )?(?:laptop|slack|phone) (on|open|nearby|with me)$/i))) return `I'm heading ${m[1].toLowerCase()}, but I'll have my ${/slack/i.test(s) ? "Slack" : /phone/i.test(s) ? "phone" : "laptop"} ${m[2].toLowerCase() === "with me" ? "with me" : m[2].toLowerCase()}.`;
  if ((m = s.match(/^(pairing|syncing|meeting|working|on a call|in a meeting|heads down|presenting|interviewing) with ([A-Z][a-z]+(?: and [A-Z][a-z]+)?|the (?:team|client|vendor|designers?|engineers?)) (?:till|til|until|to) (\d{1,2}(?::\d\d)?(?: ?[ap]m)?|noon|lunch|EOD|eod)$/i))) return `I'm ${m[1].toLowerCase()} with ${m[2]} until ${m[3].replace(/^eod$/i, "EOD")}.`;
  if ((m = s.match(/^(?:running|going|heading|popping out|stepping out) to (?:grab|get|pick up) (a |an |some )?(sandwich|coffee|lunch|food|tea|snacks|bagels|donuts|pizza|tacos|boba),? (?:does anyone |anyone |you |u )?(?:want|need) (?:anything|something|one)\??$/i))) return `I'm heading out to grab ${m[1] ?? ""}${m[2].toLowerCase()}. Would anyone like anything?`;
  if ((m = s.match(/^(?:hey|hi|yo|hello),? (can|could|would|will) (someone|anyone|somebody|anybody|you|one of you) (.+?)\??$/i))) return `${cap1(m[1].toLowerCase())} ${m[2].toLowerCase()} ${m[3]}?`;
  return null;
}

// Word fixes for texting shorthand that older rules read as names or verbs.
function words13(t) {
  return t
    .replace(/\brepro'?d\b/gi, "reproduced")
    .replace(/\b(going to|gonna|about to|will|might|is going to|are going to) rip (us|them|me|him|her|you) a new one\b/gi, (_m, v, p) => `${v.replace(/^gonna$/i, "going to")} be very critical of ${p.toLowerCase()}`)
    .replace(/\b(ripped|rips) (us|them|me|him|her|you) a new one\b/gi, (_m, v, p) => `${/ped$/i.test(v) ? "came" : "comes"} down hard on ${p.toLowerCase()}`)
    .replace(/^(bug|issue|crash|error) reproduced,\s*(fixing|on it|working on it|patching)$/i, (_m, b, v) => `I've reproduced the ${b.toLowerCase()}, and I'm ${/^on it$/i.test(v) ? "on it" : /^working/i.test(v) ? "working on it" : `${v.toLowerCase()} it`}`)
    .replace(/(?<!\b(?:is|are) )\b(?:was |were )?(useless|pointless)\b(?=[.!]*$)/i, (m, w) => `${/^(?:is|are|was|were) /i.test(m) ? m.split(" ")[0] + " " : ""}not very useful`);
}

export function round13(line) {
  const t0 = String(line ?? "").trim();
  if (!t0 || /\n/.test(t0)) return line;
  const t = words13(t0);
  return lines13(t) ?? t;
}
