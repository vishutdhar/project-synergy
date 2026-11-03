// Round 19 (Nov 2, 2026): Full C-Suite puts the joke in the body.
// The fresh54 read-through showed most Full C-Suite lines were a stock opener, the message almost word for word,
// and a stock closer ("Circling back on this strategic update, as promised to no one: my internet is spotty today.
// This message has been optimized for maximum alignment."). Comparable joke tools do exactly that, and it isn't funny.
// inflate3 rewrites the message itself into deadpan corporate euphemism ("my connectivity is operating on a flexible
// availability model today") and adds one closer that fits the topic, chosen per message so the same closer doesn't
// repeat. Every rule keeps the facts: names, numbers, dates and every "no" stay, and the result is meaning-checked.
// preclean19 / postfix19 fix input and output shapes that came out ungrammatical in fresh54.

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (arr, key) => arr[hash(key) % arr.length];
const SENSITIVE = /\b(?:funeral|passed away|bereavement|hospital\w*|surgery|emergency|chemo\w*|cancer|diagnos\w*|treatment|miscarriage|memorial|grief|grieving|sick|ill\b|illness|flu\b|covid|migraine|fever|labou?r|injur\w*|therapy|rehab|divorce|lost my|died|death|dying|laid off|fired|harass\w*|assault\w*|discriminat\w*|unsafe|safety|racist|sexist|threat\w*)\b/i;

export function preclean19(raw) {
  let t = String(raw ?? "");
  if (/\n/.test(t) || t.length > 200) return t;
  // Chatty lead-ins that the engine reads as part of the message.
  const lead = /^(?:hey|hi|yo)[,!]?\s+quick (?:one|q|question)[,:]?\s+(?=(?:did|do|does|can|could|is|are|have|has|will|would|should|who|when|where|why|how)\b(?!'))/i;
  if (lead.test(t)) { t = t.replace(lead, ""); if (!/[?]\s*$/.test(t) && !/[.!]\s*\S/.test(t)) t = t.replace(/[.!]*\s*$/, "?"); }
  // Crude idioms that used to come out half-cleaned ("procurement can no thanks with these forms").
  t = t.replace(/^([\w ]{2,30}?) can kiss my (?:ass|butt|arse)(?: with (?:these|this|their|the) ([\w ]{2,30}))[.!]*$/i, (_m, who, what) => what ? `I have serious concerns about ${who}'s approach to ${/^(?:these|this|their|the)\b/i.test(what) ? what : `these ${what}`}.` : `I have serious concerns about ${who}.`);
  t = t.replace(/^([\w ]{2,30}?) can kiss my (?:ass|butt|arse) with (these|this|their|the) ([\w ]{2,30})[.!]*$/i, (_m, who, d, what) => `I have serious concerns about ${who}'s approach to ${d} ${what}.`);
  t = t.replace(/\bpulled (that|the|this|a|their|our) ([\w -]{2,30}?) out of (?:their|his|her|your|my|thin) (?:ass(?:es)?|butts?|arse|air)\b/gi, (_m, d, x) => `made up ${d} ${x} with no data behind it`);
  t = t.replace(/\bnobody knew (?:shit|crap|jack(?: shit)?|squat)\b/gi, "nobody knew anything").replace(/\b(?:don't|didn't) know (?:shit|crap|jack(?: shit)?|squat)\b/gi, (m) => m.replace(/(?:shit|crap|jack(?: shit)?|squat)$/i, "anything"));
  t = t.replace(/\b(?:absolute|total|complete|pure)?\s*dogwater\b/gi, "really poor quality").replace(/\b(?:busted|bust|worked) my (?:butt|ass|tail) off\b|\bbusted my (?:butt|ass|tail)\b/gi, "worked really hard").replace(/\bcut the (?:crap|bullshit|BS)\b/gi, "cut to the chase").replace(/(cut to the chase[,.]\s*(?:what|when|where|who|why|how|which)\b[^.?!]*?)[.!]?$/i, "$1?");
  t = t.replace(/\b(?:is|are) a (?:fucking |freaking |goddamn )?novel\b/gi, (m) => m.replace(/a (?:fucking |freaking |goddamn )?novel/i, "far too long"));
  // Fragments the parser split badly.
  t = t.replace(/^(offer letter|contract|NDA|SOW|lease|agreement|paperwork) signed,\s*start date (.+?)[.!]*$/i, (_m, a, d) => `The ${a.toLowerCase().replace(/^nda$|^sow$/, (x) => x.toUpperCase())} is signed, and the start date is ${d}.`);
  t = t.replace(/^([\w -]{2,25}?) due (today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|EOD|next week|[A-Z][a-z]+ \d+),\s*(half|mostly|almost|barely|not even|about half) (done|finished|started)[.!]*$/i, (_m, x, d, a, b) => `The ${x} is due ${d}, and it's ${a === "half" ? "half" : a} ${b}.`);
  t = t.replace(/^not interested in (\w+ing\b.*?)[.!]*$/i, (_m, x) => `I'm not interested in ${x}.`);
  return t;
}

export function postfix19(input, text) {
  let t = String(text ?? "");
  // "our intern, an emerging talent,'s code" -> "our intern's code"
  t = t.replace(/\b(\w+), an? [\w -]+,'s\b/g, "$1's");
  t = t.replace(/\bout of their\.\s*/g, "out of thin air. ");
  t = t.replace(/\bthe half is done\b/g, "it's half done");
  // A frame followed by a second, smaller frame: "In the interest of X, quick check: were you able..."
  t = t.replace(/([,:]) (?:quick (?:check|question|ask)|just checking|quick one): (\w)/gi, (_m, p, c) => `${p} ${c.toLowerCase()}`);
  return t;
}

// Topic closers. Several per topic, so a run of messages doesn't repeat the same line.
const CLOSE = {
  broken: ["We are exploring a turn-it-off-and-on-again recovery strategy.", "Facilities has been invited to align on next steps.", "We remain cautiously optimistic about a full recovery.", "A cross-functional tiger team of one is monitoring the situation."],
  tech: ["IT has been looped in, spiritually.", "Innovation is a journey, and this is a detour.", "Our digital transformation continues, in its own way.", "We are treating this as a learning opportunity for the hardware."],
  late: ["My arrival is now a strategic surprise.", "Punctuality remains a core aspiration.", "My schedule has been notified, and it is disappointed.", "Please hold my spot in the agenda."],
  people: ["We are all on the same team, structurally.", "I remain committed to radical empathy.", "Feedback has been gift-wrapped accordingly.", "I'm choosing to see this as a growth opportunity, for them."],
  process: ["Process is our most scalable product.", "Bureaucracy is a feature, not a bug.", "I'd like to propose a working group to streamline the working groups.", "Efficiency remains on the roadmap."],
  docs: ["Knowledge is a shared asset, in theory.", "The documentation remains our most ambitious long-term vision.", "Reading is a stretch goal."],
  me: ["My bandwidth has submitted its resignation.", "I'm practicing radical self-transparency.", "Resilience is a muscle, and mine is cramping.", "Vulnerability is a leadership competency."],
  money: ["Every dollar is a stakeholder, and several have left the building.", "Finance has been looped in, and is breathing into a paper bag.", "We are reframing this as an investment in learning.", "Fiscal discipline is a journey."],
  win: ["Somebody alert the culture deck.", "Please hold your applause until the end of the quarter.", "History, and the quarterly scorecard, will remember this.", "The flywheel is spinning."],
  loss: ["We wish them every success in their new journey.", "We remain cautiously optimistic about everything.", "Every setback is a setup for a comeback, presumably.", "Our pipeline is now refreshingly uncluttered."],
  food: ["A well-fueled team is a high-performing team.", "Snacks remain a core pillar of our culture.", "Facilities has been looped in, spiritually."],
  place: ["Our physical ecosystem remains a work in progress.", "The workplace experience remains a journey, not a destination.", "Facilities has been invited to align on next steps."],
  time: ["Time remains our scarcest resource.", "The clock remains undefeated.", "Time is a flat circle, and it is fully booked."],
  done: ["Another deliverable has crossed the finish line.", "Execution remains our love language.", "Momentum is a choice, and I chose it."],
  pet: ["The dog has been added to the stakeholder map.", "We value diverse perspectives.", "The dog has strong opinions on the roadmap."],
  quiet: ["Consider this a strategic pause.", "The silence has been noted for the record."],
};

// Each rule: [regex on the Mild text, replacement, topic]. The Mild text is already clean, grammatical and checked.
const R = [
  // Things that are broken, down, dead or acting up.
  [/^(the|my|our) ([\w' -]{2,40}?) (?:has been|have been) (?:broken|down|out|out of order|out of service|in a degraded state)( for (?:a |two |three |\d+ )?(?:day|days|week|weeks|month|months)| since \w+| all week| all day)\b/i, (m) => `${cap(m[1])} ${m[2]} has been on an unscheduled sabbatical${m[3]}`, "broken"],
  [/^(the|my|our) ([\w' -]{2,40}?) (?:is|are) (?:broken|down(?! to\b)|dead(?! in the water)|not working|out of order|in a degraded state)( again)?\b/i, (m) => `${/^prod(?:uction)?$/i.test(m[2]) ? "" : cap(m[1]) + " "}${m[2]} ${((h) => /s$/.test(h) && !/ss$/.test(h))(m[2].replace(/ (?:in|on|at|for|of) .*$/, "")) ? "have" : "has"} entered an unplanned maintenance window${m[3] ?? ""}`, "broken"],
  [/^(the|my|our) ([\w' -]{2,40}?) (froze|crashed(?: and burned)?|died)(?! \d)( mid[- ]\w+| halfway through [\w -]+| during [\w -]+| right as [\w -]+| overnight| again)?\b/i, (m) => `${cap(m[1])} ${m[2]} ${m[3] = m[3].replace(/ and burned$/, ""), m[3] === "froze" ? "entered an unplanned stillness phase" : "executed an unscheduled exit"}${m[4] ?? ""}`, "tech"],
  [/^(the|my|our) ([\w' -]{2,40}?) keeps (flickering|beeping|crashing|freezing|dropping|disconnecting|restarting|buzzing)\b/i, (m) => `${cap(m[1])} ${m[2]} remains deeply committed to ${m[3]}`, "tech"],
  [/^(my|our|the) (internet|wifi|connection|signal|VPN)(?: connection)? is (?:spotty|patchy|flaky|unstable|terrible|slow)( today| this morning| again)?\b/i, (m) => `${cap(m[1])} ${m[2]} is operating on a flexible availability model${m[3] ?? ""}`, "tech"],
  [/^(the|my|our) ([\w' -]{2,30}?) takes (\d+|ten|twenty|thirty|fifteen|five) (minutes|hours|days) to (boot|load|start|open|sync|run)\b/i, (m) => `${cap(m[1])} ${m[2]} takes ${m[3]} ${m[4]} to ${m[5]}, a deliberate investment in mindfulness`, "tech"],
  // Late, delayed, behind.
  [/^I'm running (\d+ ?(?:min|minutes?|mins)|a few minutes|a bit|a little)( late| behind(?: schedule)?) (to|for) ([\w -]{2,30})\b/i, (m) => `My arrival ${m[3]} ${m[4]} is being strategically re-baselined by ${m[1]}`, "late"],
  [/^(my|the|our) (train|bus|flight|ferry|shuttle|ride|uber) is (?:delayed|late|running late)( again)?\b/i, (m) => `${cap(m[1])} ${m[2]} is pursuing a non-linear timeline${m[3] ?? ""}`, "late"],
  [/^I'll be in late(?:,|\.| because of| due to) (?:I have )?car trouble\b/i, () => "My arrival is being re-baselined due to an unplanned event involving my personal mobility asset", "late"],
  [/^we missed the ([\w -]{2,30}?) by (\w+ (?:days?|weeks?|hours?))\b/i, (m) => `We delivered ${m[2]} after the ${m[1]}, a bold reinterpretation of the timeline`, "time"],
  [/^we're (\w+ (?:days?|weeks?|months?)) behind schedule\b/i, (m) => `We're ${m[1]} behind schedule, which I'm framing as extra time for reflection`, "time"],
  // People and process complaints.
  [/^(?:I don't believe )?(?:anyone|nobody|no one) (?:ever )?reads? (the|our|my) (documentation|docs|wiki|newsletter|updates|reports?|emails?)\b/i, (m) => `${/^prod(?:uction)?$/i.test(m[2]) ? "" : cap(m[1]) + " "}${m[2]} ${/s$/.test(m[2]) ? "are" : "is"} currently enjoying a zero-reader engagement model`, "docs"],
  [/^(?:nobody|no one) (?:ever )?(?:replies|responds) to my (emails|messages)\b/i, (m) => `My ${m[1]} are achieving a consistent zero-response rate`, "people"],
  [/^(?:nobody|no one) showed up (?:to|for) my ([\w -]{2,30})\b/i, (m) => `My ${m[1]} achieved an exclusive attendance of zero`, "people"],
  [/^(?:nobody|no one) (?:told|informed) me about (the|our) ([\w -]{2,30})\b/i, (m) => `${cap(m[1])} ${m[2]} was shared with me on a strict need-to-not-know basis`, "people"],
  [/^(?:nobody|no one) cleaned (?:out )?(the|our) ([\w -]{2,30}?) and something is growing in (?:there|it)\b/i, (m) => `Nobody cleaned ${m[1]} ${m[2]}, and something in there is now scaling organically`, "food"],
  [/^(my|our|the) (manager|boss|leadership partner|lead|director|VP) micromanages (everything|every\w*)( I do| we do)?\b/i, (m) => `${cap(m[1])} ${m[2]} provides deeply granular, high-touch oversight of ${m[3]}${m[4] ?? ""}`, "people"],
  [/^(this|the|our) ([\w -]{2,30}?) has no (?:clear )?owner\b/i, (m) => `${cap(m[1])} ${m[2]} is piloting a bold, ownership-agnostic operating model`, "process"],
  [/^we never get any feedback on (our|my) work\b/i, (m) => `Feedback on ${m[1]} work remains a never-before-seen limited release`, "people"],
  [/^every (decision|change|request|purchase|post|email) needs (\w+) approvals\b/i, (m) => `Every ${m[1]} now enjoys a robust ${m[2]}-signature approval journey`, "process"],
  [/^we have (\w+) (?:people|team members|folks) approving every ([\w -]{2,20})\b/i, (m) => `Every ${m[2]} now passes through a robust ${m[1]}-person approval journey`, "process"],
  [/^half (?:the|our) team ignores (the|our) ([\w -]{2,30})\b/i, (m) => `${cap(m[1])} ${m[2]} is currently enjoying 50% voluntary adoption`, "process"],
  [/^(the|our) ([\w -]{2,30}?) (?:changes?|shifts?|pivots?) every (week|day|time [\w ]+|sprint|month)\b/i, (m) => `${/^prod(?:uction)?$/i.test(m[2]) ? "" : cap(m[1]) + " "}${m[2]} ${/s$/.test(m[2]) ? "are" : "is"} on an agile, ever-evolving cadence, refreshed every ${m[3]}`, "process"],
  [/^(?:I (?:think|believe) )?(the|that|this|our) ([\w -]{2,30}?) was (?:a (?:complete |giant |total |huge )?(?:waste|poor use|inefficient use|very poor use) of (?:time|a day|an hour|my time)|pointless|a waste)\b/i, (m) => `${cap(m[1])} ${m[2]} was a significant investment of time with a return we are still working to identify`, "time"],
  [/^(the|our) (?:new )?(open office|office|floor|room) is (?:way |far |really |so )?too (loud|noisy)\b/i, (m) => `${cap(m[1])} ${m[2]} is delivering an aggressively immersive soundscape`, "place"],
  [/^(the|our|this) ([\w -]{2,30}?) is (?:impossible|hard|really hard|very hard|not realistic) to (use|leverage|navigate|understand)\b/i, (m) => `${cap(m[1])} ${m[2]} offers a uniquely challenging user journey`, "tech"],
  [/^(?:I believe )?(the|our|this) (?:new )?([\w -]{2,30}?) (?:lacks clarity|is (?:very |really )?confusing|makes no sense)\b/i, (m) => `${cap(m[1])} ${/new/.test(m[0]) ? "new " : ""}${m[2]} is open to a wide range of interpretations`, "process"],
  [/^(the|our) (client|customer|stakeholder|vendor|supplier) keeps moving the goalposts\b/i, (m) => `${cap(m[1])} ${m[2]} keeps pursuing a dynamic, goalpost-agnostic strategy`, "people"],
  [/^(the|our) (client|customer|vendor|supplier|valued client partner) changed (?:their|its) mind again\b/i, (m) => `${cap(m[1])} ${m[2]} has pivoted again, demonstrating exceptional strategic agility`, "people"],
  [/^(the|our|this) (supplier|vendor|client|contractor) keeps misleading us about (the|our) ([\w -]{2,30})\b/i, (m) => `${cap(m[1])} ${m[2]} keeps offering creative interpretations of ${m[3]} ${m[4]}`, "people"],
  [/^(the|our) new (VP|director|manager|boss|CEO|lead) has no (?:real )?clue what we do\b/i, (m) => `${cap(m[1])} new ${m[2]} is still in an early discovery phase regarding what we do`, "people"],
  [/^I'm (?:really |so |very )?(?:fed up|frustrated|annoyed) with (covering for )?(this|the|that|our) ([\w -]{2,30})\b/i, (m) => `I've reached the end of my enthusiasm runway with ${m[1] ?? ""}${m[2]} ${m[3]}`, "me"],
  [/^I'm (?:really |so |very )?(?:tired|exhausted|wiped out|wiped|burnt out|burned out|fried|drained)\b(?!\s+of)/i, () => "My energy reserves are operating at a strategic deficit", "me"],
  [/^(this|the|our) ([\w -]{2,30}?) is (?:annoying|frustrating|irritating) me\b/i, (m) => `${cap(m[1])} ${m[2]} is testing the outer limits of my emotional bandwidth`, "me"],
  [/^I'm (?:about to|going to) throw (this|the|my) ([\w -]{2,20}) out the window\b/i, (m) => `I'm evaluating a window-based exit strategy for ${m[1]} ${m[2]}`, "tech"],
  // Money and business losses.
  [/^we lost the ([A-Z][\w-]+(?: [A-Z][\w-]+)?) account\b/, (m) => `The ${m[1]} account has decided to explore other partnerships`, "loss"],
  [/^the ([A-Z][\w-]+(?: [A-Z][\w-]+)?) deal fell through\b/, (m) => `The ${m[1]} deal has exited our pipeline in an unplanned fashion`, "loss"],
  [/^(the|our) (supplier|vendor|partner|client|caterer|contractor) went out of business\b/i, (m) => `${cap(m[1])} ${m[2]} has transitioned to a zero-revenue operating model`, "loss"],
  [/^the data is wrong and we don't (?:yet )?know why\b/i, () => "The data is currently expressing an alternative version of reality, and we don't yet know why", "tech"],
  [/^we burned (\$[\d,.]+k?) on ([\w -]{2,20}) with nothing to show(?: for it)?\b/i, (m) => `We invested ${m[1]} in ${m[2]}, and the returns remain theoretical, with nothing to show so far`, "money"],
  [/^(the|our) ([\w -]{2,20}?) (?:bill|spend|costs?) (?:doubled|tripled|jumped|spiked)(?: out of control| through the roof| off a cliff)?( to \$[\d,.]+k?| by \d+%| \d+%| from \$[\d,.]+k? to \$[\d,.]+k?)?( this \w+| last \w+| in (?:one|a|a single) \w+| after the [\w-]+| overnight)?\b/i, (m) => `${cap(m[1])} ${m[2]} bill achieved record-breaking growth${(m[3] ?? "").replace(/^ (\d)/, " of $1").replace(/^ by /, " of ")}${m[4] ?? ""}, which is the wrong kind of growth`, "money"],
  [/^wow, the ([\w -]{2,20}) bill is huge\b/i, (m) => `The ${m[1]} bill has achieved an ambitious scale`, "money"],
  // Numbers with a joke that fits.
  [/^(?:the|our) team is down to (\w+) (engineers|people|designers|agents|developers|nurses|folks)\b/i, (m) => `The team is now an aggressively lean ${m[1]}-${m[2].replace(/s$/, "")} operating model`, "process"],
  [/^we have (\d+|\w+) days to (?:finish|complete|deliver) (\w+ (?:months?|weeks?)) of work\b/i, (m) => `We have ${m[1]} days to deliver ${m[2]} of work, an ambitious compression of the space-time continuum`, "time"],
  [/^we're running at (\d+)% capacity\b/i, (m) => `We're running at ${m[1]}% capacity§, a bold challenge to the laws of mathematics`, "me"],
  [/^I have (\d+) (tasks|tickets|items|requests|emails) in my (queue|inbox|backlog)\b/i, (m) => `My ${m[3]} now holds a robust portfolio of ${m[1]} ${m[2]}`, "me"],
  [/^the (?:opportunity )?backlog is at (\d+) items\b/i, (m) => `The backlog now holds a robust pipeline of ${m[1]} future opportunities`, "process"],
  [/^((?:the |our |my )?[\w -]{2,20}?) got (\d+|one|two|three|a few) clicks\b/i, (m) => `${cap(m[1])} generated an exclusive ${m[2]} clicks`, "money"],
  [/^only (\d+%) of the team finished the ([\w -]{2,30})\b/i, (m) => `Only ${m[1]} of the team finished the ${m[2]}, leaving a generous runway for future completion`, "process"],
  [/^the (app|site|website|server|system|build) crashed (\d[\d,]*) times\b/i, (m) => `The ${m[1]} crashed ${m[2]} times§, a remarkably consistent commitment to failure`, "tech"],
  [/^our response time went from ([\w ]+?) to ([\w ]+?)\b(?=[.,]|$)/i, (m) => `Our response time went from ${m[1]} to ${m[2]}, §, a deliberate shift to a more thoughtful cadence`, "time"],
  [/^the warehouse shipped ([\d,]+) orders late\b/i, (m) => `The warehouse shipped ${m[1]} orders late§, a bold reinterpretation of "on time"`, "time"],
  [/^the average deal size dropped from (\$[\d,.]+k?) to (\$[\d,.]+k?)\b/i, (m) => `The average deal size has been right-sized from ${m[1]} to ${m[2]}`, "money"],
  [/^the event cost (\$[\d,.]+k?) and we (?:got|generated) (?:a highly exclusive )?(\d+|one|two|three) leads\b/i, (m) => `The event cost ${m[1]} and generated an exclusive ${m[2]} leads, roughly a luxury price per lead`, "money"],
  // Everyday status.
  [/^I left my (badge|laptop|charger|keys|lunch|wallet) at home\b/i, (m) => `My ${m[1]} is working from home, without me`, "me"],
  [/^I accidentally (?:replied all|over-delivered on transparency with a reply-all) to the whole ([\w -]{2,20})\b/i, (m) => `I accidentally over-delivered on transparency with a reply-all to the whole ${m[1]}`, "people"],
  [/^(?:it's|it is) pouring outside(?:,|\.) (?:please )?bring an umbrella\b/i, () => "The weather is pursuing an aggressive precipitation strategy, so please bring an umbrella", "place"],
  [/^the fire alarm keeps beeping\b/i, () => "The fire alarm remains deeply committed to beeping", "place"],
  [/^my dog is barking\b/i, () => "My dog has joined as an unscheduled stakeholder", "pet"],
  [/^I'll be on mute\. My dog is barking\b/i, () => "I'll be on mute, as my dog has joined as an unscheduled stakeholder", "pet"],
  [/^someone microwaved ([\w -]{2,20}) again and the whole floor smells\b/i, (m) => `Someone microwaved ${m[1]} again, and the whole floor is now part of the experience`, "food"],
  // Messes and failures, said with a straight face.
  [/^(?:I (?:think|believe) )?(that|the|this|our) ([\w -]{2,30}?) (?:was|is) (?:a (?:total |complete |real |absolute )?(?:trainwreck|train wreck|mess|disaster|circus|catastrophe)|(?:pretty |really |very )?chaotic)\b/i, (m) => `${cap(m[1])} ${m[2]} ${/ was /.test(m[0]) ? "was" : "is"} an unplanned stress test of our organizational resilience`, "process"],
  [/^(?:I (?:think|believe) )?this is a (?:mess|disaster|trainwreck) of a ([\w -]{2,20})\b/i, (m) => `This ${m[1]} is, to put it strategically, a masterclass in misalignment`, "process"],
  [/^(the|our) ([\w -]{2,30}?) (?:mishandled|messed up|botched|ruined) (the|our) ([\w -]{2,30}?)( for the (?:second|third|fourth|fifth|\w+) time| again)?(?=[.,!]|$| again| for the| this| last| today| yesterday)/i, (m) => `${cap(m[1])} ${m[2]} took a bold, creative approach to ${m[3]} ${m[4]}${m[5] ?? ""}`, "people"],
  [/^(the|our) ([\w-]+(?: [\w-]+)?) missed the ([\w -]{2,20}?)( again| deadline)\b/i, (m) => `${cap(m[1])} ${m[2]} has ${m[4] === " again" ? "once again " : ""}pursued a flexible relationship with the ${m[3]}${m[4] === " deadline" ? " deadline" : ""}`, "people"],
  [/^(?:our |the )?(manager|boss|VP|director|client|lead) is being difficult about (the|our) ([\w -]{2,30})\b/i, (m) => `${/^(?:our|the)/i.test(m[0]) ? cap(m[0].split(" ")[0]) + " " : "The "}${m[1]} is bringing a demanding level of passion to ${m[2]} ${m[3]}`, "people"],
  [/^stop complaining about (the|our) ([\w -]{2,30})\b/i, (m) => `Let's pivot from complaining about ${m[1]} ${m[2]} to embracing ${m[1]} ${m[2]}`, "people"],
  [/^we're still waiting on ([\w -]{2,20}?) to ([\w -]{2,30})\b/i, (m) => `We remain in a patient, value-neutral holding pattern while we wait on ${m[1]} to ${m[2]}`, "time"],
  [/^the feature is done but not tested\b/i, () => "The feature is done, but it has not yet been introduced to testing", "tech"],
  [/^(the|our) ([\w -]{2,20}?) found (the|our) ([\w -]{2,20}?) confusing\b/i, (m) => `${cap(m[1])} ${m[2]} found ${m[3]} ${m[4]} to be a uniquely challenging journey, and confusing`, "people"],
  // Small wins, delivered like an earnings call.
  [/^(?:we|I) (?:got|won|secured|landed) (the|a|our) (?!(?:bad|raw|poor|terrible|lousy|worse)\b)([\w -]{2,30}?)(?= certification| grant| contract| deal| award| account|$)( certification| grant| contract| deal| award| account)?\b/i, (m) => `We have successfully secured ${m[1]} ${m[2]}${m[3] ?? ""}, a milestone I will reference at every all-hands for the next fiscal year`, "win"],
  [/^the event sold out\b/i, () => "The event achieved full capacity, as demand meaningfully outpaced supply", "win"],
  [/^the audit came back clean\b/i, () => "The audit came back clean, a rare moment of total alignment between us and reality", "win"],
  [/^(signups|revenue|sales|traffic|bookings|users|usage|downloads) (?:are|is) up (\d+%)( week over week| month over month| this \w+| since (?:the )?\w+)?\b/i, (m) => `${cap(m[1])} ${/s$/.test(m[1]) ? "are" : "is"} up ${m[2]}${m[3] ?? ""}, a growth story I intend to tell at every offsite`, "win"],
  // Fragments of finished work.
  [/^(?:I've sent|we sent|I sent|sent) the (?![\w -]*\bwrong\b)([\w -]{2,30}?)(?: to (the [\w -]{2,30}?|[A-Z][\w&]*(?: [A-Z][\w&]*)?|finance|legal|HR|IT|procurement))?(?=[.,]|$)/i, (m) => `The ${m[1]} ${/s$/.test(m[1]) && !/ss$/.test(m[1]) ? "have" : "has"} been successfully deployed to ${m[2] ? `the intended recipient, ${m[2]}` : "the intended recipient"}`, "done"],
  [/^the (new )?ticket has been filed\b/i, (m) => `A ${m[1] ?? ""}ticket has been formally onboarded into the queue`, "done"],
  [/^(?:the )?release notes (?:have been |are )?drafted\b/i, () => "The release notes have reached a first-draft milestone", "done"],
  [/^the interview loop is booked for (\w+)\b/i, (m) => `The interview loop has been fully calendarized for ${m[1]}`, "done"],
  [/^draft (v\d+) (?:is )?attached, (?:and )?feedback (?:is )?welcome\b/i, (m) => `Draft ${m[1]} is attached, and I'm actively soliciting feedback in a psychologically safe container`, "done"],
  // Small everyday moves.
  [/^I'm going to step out for a quick walk\b/i, () => "I'm stepping out for a quick ambulatory ideation session", "me"],
  [/^the office is (?:so |really |very )?quiet today\b/i, () => "The office is operating at a strategically low decibel level today", "quiet"],
  [/^(?:I'm|I am) stuck in another (?:meeting|alignment session|catch-up|sync|call)\b/i, (m) => `${m[0].replace(/^(?:I'm|I am) stuck in another/i, "I'm currently held in another").replace(/catch-up|sync|alignment session/i, "meeting")}`, "time"],
];

// General shapes, used only when Full C-Suite came out as a stock frame around the plain message.
const G = [
  [/,? and (?:nobody|no one) (?:even )?(?:noticed|cared|read it|replied|responded|came|showed up|said anything)\b/i, () => ", and it achieved an exclusive audience of zero", "me"],
  [/\bI worked (?:really |very |so )?hard on (this|that|it|the [\w-]+|my [\w-]+)\b/i, (m) => `I invested maximum discretionary effort in ${m[1]}`, "me"],
  [/\b(a|an) ([\w -]{3,25}?) instead of (raises|a raise|bonuses|a bonus|pay increases|a pay increase)\b/i, (m) => `${m[1]} ${m[2]} in lieu of ${m[3]}, a bold new total-rewards strategy`, "money"],
  [/\bcould have been (an email|a Slack message|a message|a memo|a quick note)\b/i, (m) => `could have been ${m[1]}, a learning I'm passionate about sharing`, "time"],
  [/^I'm (?:really |very |so )?(?:frustrated|annoyed|irritated|upset) that\b/i, () => "I'm still searching for the strategic upside in the fact that", "me"],
  [/^I'm not (?:thrilled|happy|excited|energized|looking forward to|a fan of)(?: about)?\b/i, () => "I have not yet located the strategic upside in", "me"],
  [/^I was (?:disappointed|frustrated|annoyed|upset) to (learn|hear|find out|discover)\b/i, (m) => `I have been invited to grow from having to ${m[1]}`, "me"],
  [/\bdoing the bare minimum on\b/i, () => "delivering a minimum viable effort on", "people"],
  [/\bhas been pending since (\w+)\b/i, (m) => `has been in a patient holding pattern since ${m[1]}`, "time"],
  [/^I can't find (the|my) ([\w -]{2,25}?)(?=[.,]|$)/i, (m) => `${cap(m[1])} ${m[2]} is currently operating in stealth mode, and I can't find it`, "tech"],
  [/^(the|our) ([\w -]{2,25}?) (?:changed|shifted|moved) again\b/i, (m) => `${cap(m[1])} ${m[2]} pivoted again, demonstrating exceptional strategic agility`, "process"],
  [/\b(has been|was|is) (?:a )?(?:total |complete |absolute )?(?:mess|disaster|trainwreck|circus)\b/i, (m) => `${m[1]} an unplanned stress test of our organizational resilience`, "process"],
  [/\b(he|she|they|[A-Z][a-z]+|(?:the|our|my) [\w-]+(?: [\w-]+)?|sales|marketing|legal|finance|procurement|IT|HR|leadership|management) keeps ([a-z]+ing)\b/i, (m) => `${m[1].replace(/^the (procurement|legal|finance|marketing|sales|HR|IT|leadership|management)$/i, "$1")} remains deeply committed to ${m[2]}`, "auto"],
  [/\bwe sat on our hands\b/i, () => "we pursued a bold strategy of watchful waiting", "process"],
  [/\b(?:just )?pushed the fix, fingers crossed it holds\b/i, () => "pushed the fix, and our resilience strategy is now officially hope", "tech"],
];
const UPSIDE = [
  "I have not yet located the strategic upside in",
  "I can't yet see the long-term value in",
  "I have not yet found the synergy in",
  "I have not yet unlocked the growth opportunity in",
];
const TOPIC_GUESS = [
  ["tech", /\b(?:headset|internet|phone|camera|mic|laptop|build|server|app|site|website|laptop|wifi|printer|monitor|screen|VPN|system|tool|portal|database|API|deploy|bug|code|PR|release|migration|ticket|password|login|file)\b/i],
  ["money", /\b(?:budget|cost|costs|\$|invoice|bill|price|revenue|raise|raises|bonus|pay|refund|quota)\b/i],
  ["time", /\b(?:late|deadline|delay\w*|hours?|minutes?|weeks?|days?|schedule|timeline)\b/i],
  ["people", /\b(?:he|she|they|[A-Z][a-z]+|client|customer|vendor|supplier|manager|boss|team|sales|marketing|legal|finance)\b/i],
];
export function isSandwich19(l3, l1) {
  const tok = (x) => new Set(String(x).toLowerCase().match(/[a-z0-9']+/g) ?? []);
  const parts = String(l3).split(/(?<=[.!?])\s+/);
  let body = parts.length > 1 ? parts.slice(0, -1).join(" ") : String(l3);
  body = body.replace(/^[^:]{8,90}:\s+/, "").replace(/^(?:In the spirit of|In the interest of|Having|After|From a|Strong|Pursuant)[^,]{3,90},\s+/, "");
  const a = tok(String(l1).replace(L1_OPEN, "")), b = tok(body);
  let i = 0; for (const x of a) if (b.has(x)) i++;
  return i / Math.max(1, a.size + b.size - i) >= 0.55;
}

function tidy19(body) {
  body = body.replace(/\. ((?:Since|Every|Twice|Once|From|Right before|Right after|Just before|During|After|Before|In front of|At the|On the|For the)\b[^.]{0,40})$/, (m0, f) => (/\b(?:I|we|is|are|was|were|will|has|have|I'm|we're)\b/.test(f) ? m0 : ` ${f[0].toLowerCase()}${f.slice(1)}`));
  return body.replace(/\. To me$/, ", at least to me").replace(/ and so am I$/, " and so have I").replace(/(strategic deficit) and (need|needs) /, "$1, and I need ");
}
const L1_OPEN = /^(?:I'm (?:happy|excited|thrilled|pleased) to share that|Just a heads-up that|Just a quick heads-up that|Just a quick update|Quick update|Just so you know|Just to let you know|It looks like|I wanted to flag that|Unfortunately|Heads-up|FYI)[:,]?\s*/i;
export function inflate3(l1, raw, opts = {}) {
  const src = String(raw ?? "");
  if (!src.trim() || SENSITIVE.test(src) || /\?/.test(src) || src.length > 180 || /\n/.test(src)) return null;
  let t = String(l1 ?? "").trim().replace(L1_OPEN, "").replace(/\s*(?:Thanks!?|Thank you!?)$/i, "");
  if (!t || t.split(/(?<=[.!])\s+/).length > 2) return null;
  t = t[0].toLowerCase() === t[0] ? t : (/^(?:I|I'm|I'll|I've|[A-Z]{2,}|[A-Z][a-z]+'s)\b/.test(t) ? t : t[0].toLowerCase() + t.slice(1));
  for (const [re, f, topic] of R) {
    const m = t.match(re);
    if (!m) continue;
    let head = f(m);
    let rest = t.slice(m.index + m[0].length).replace(/^[.!]+/, "").trim();
    if (head.includes("§")) { const tail = rest.match(/^((?:(?:last|this|next) \w+|in \d+ (?:hours?|days?|minutes?)|on the [\w -]+?|today|yesterday|overnight|since (?:the )?\w+)(?=[.,]|$))/i); head = head.replace("§", tail ? ` ${tail[1]}` : ""); if (tail) rest = rest.slice(tail[1].length).replace(/^[.!]+/, "").trim(); }
    let topicX = topic;
    if (topic === "broken") topicX = /\b(?:pipeline|build|server|app|site|website|laptop|wifi|wi-fi|printer|reports?|wiki|link|drive|env|environment|page|spreadsheet|calendar|router|internet|mic|camera|tablet|headset|headphones|earbuds|mouse|projector|badge system|phone|monitor|screen|VPN|system|tool|portal|database|API|deploy|staging|prod|CI|network|email|login|SSO|dashboard)\b/i.test(m[0]) ? "tech" : "place";
    let body = cap(head) + (rest ? (/^[,;]/.test(rest) || /^(?:and|but|so|because|which|after|before|when|while|during|right|just before|with|for|on|in|at|this|today|again)\b/i.test(rest) ? (/^[,;]/.test(rest) ? "" : " ") + rest : ". " + cap(rest)) : "");
    body = tidy19(body.replace(/\s+([.,!])/g, "$1").replace(/[.!]+$/, ""));
    return `${body}. ${pick(CLOSE[topicX] ?? CLOSE[topic], src)}`;
  }
  if (!opts.generic) return null;
  for (const [re, f, topic0] of G) {
    const m = t.match(re);
    if (!m) continue;
    let body = (t.slice(0, m.index) + f(m) + t.slice(m.index + m[0].length)).replace(/[.!]+$/, "").replace(/\s+([.,!])/g, "$1");
    body = body.replace(/\b(upside in|value of) to\b/, "$1 having to").replace(/\b(upside in|value of) that\b/, "$1 the fact that")
      /*x*/.replace(/\b(upside in) (?!the fact that)((?:the|my|our|this|these|my) [\w -]+? (?:is|are|was|were|has|have|had|returns|keeps|went|broke|crashed|logs|takes|took|changed|moved|got)\b)/, "$1 the fact that $2");
    if (/upside in /.test(body)) body = body.replace("I have not yet located the strategic upside in", pick(UPSIDE, src));
    if (/\b(?:doesn't|does not|nothing says)\b/i.test(body) && /in lieu of/.test(body)) return null;
    body = tidy19(cap(body));
    const topic = topic0 === "auto" ? (TOPIC_GUESS.find(([, re2]) => re2.test(m[0]))?.[0] ?? "process") : topic0;
    return `${body}. ${pick(CLOSE[topic], src)}`;
  }
  return null;
}

// Personal news the round-18 list missed. The joke is a closer that fits.
const MILESTONES19 = [
  [/\b(?:had|welcomed) (?:twins|triplets)\b/i, "Our family headcount plan exceeded forecast by 100%."],
  [/\b(?:got into|accepted (?:in)?to|admitted to) (?:his|her|their) (?:first[- ]choice )?(?:college|university|school)\b/i, "The family talent pipeline is performing ahead of plan."],
  [/\bgot my (?:citizenship|green card)\b/i, "My personal compliance journey is now complete."],
  [/\bgot my (?:driver's|drivers|driving) licen[cs]e\b/i, "My personal mobility roadmap is now fully unblocked."],
  [/\bback from my honeymoon\b/i, "The merger integration offsite went well."],
  [/\b(?:finished|completed|got) my (?:MBA|master's|masters|PhD|degree)\b/i, "I'm now formally accredited to use the word synergy."],
  [/\bstarting night classes\b/i, "My growth mindset is going after hours."],
  [/\badopted a (?:rescue )?(?:dog|cat|puppy|kitten)\b/i, "Our household headcount plan has been fully approved."],
];
export function milestone19(raw, l1) {
  const src = String(raw ?? "");
  if (SENSITIVE.test(src) || /\?/.test(src) || /\b(?:not|didn't|failed|can't|won't)\b/i.test(src)) return null;
  const hit = MILESTONES19.find(([re]) => re.test(src));
  if (!hit) return null;
  let t = String(l1 ?? "").trim().replace(L1_OPEN, "").replace(/\s*(?:Thanks!?)$/i, "");
  if (!t) return null;
  if (!/[.!?]$/.test(t)) t += ".";
  const body = /^(?:I|I'm|I've|I'll|[A-Z]{2,}|[A-Z][a-z]+'s)\b/.test(t) ? t : t[0].toLowerCase() + t.slice(1);
  return `Excited to share a personal milestone with the broader ecosystem: ${body} ${hit[1]}`;
}

// Time-off reasons the round-18 list missed, applied on top of timeOff3's output.
export const REASONS19 = [
  [/\bto go fishing\b/i, "to go fishing, an offsite focused on patience-based outcomes"],
  [/\bto go camping\b/i, "to go camping, a fully off-grid offsite"],
  [/\bmy (?:kid|son|daughter|child) has a school (?:thing|event)\b/i, (m) => `${m}, a high-priority family stakeholder engagement`],
  [/\bfor (?:a|the|our) family reunion(?: in [A-Z][a-z]+)?\b/i, (m) => `${m}, a cross-generational all-hands`],
  [/\bfor my parents' anniversary\b/i, "for my parents' anniversary, a key legacy partnership milestone"],
  [/\bfor the plumber\b/i, "for the plumber, a critical home-infrastructure vendor engagement"],
  [/\bfor a car inspection\b/i, "for a car inspection, a mandatory compliance review of my personal mobility asset"],
  [/\bfor (?:the )?dentist(?: again)?\b/i, (m) => `for ${/again/.test(m) ? "another" : "a"} scheduled oral-wellness audit`],
  [/\bfor my (?:son|daughter|kid|child)'s (?:soccer|baseball|basketball|hockey|football|softball|volleyball) game\b/i, (m) => `${m}, where a key family stakeholder is competing`],
  [/\bmy basement flooded\b/i, "my basement has launched an unplanned water-feature initiative"],
  [/\btaking a personal day( tomorrow| today| on \w+| this \w+| next \w+)?\b/i, (m) => `${m}, a strategic reinvestment in my individual operating model`],
];

// Time off the round-18 detector missed: personal days, leaving early, PTO weeks, "out the 3rd through the 7th".
const TIMEOFF19 = /\b(?:taking a (?:personal|mental health|wellness) day|personal day (?:tomorrow|today|on \w+|friday|monday)|leaving early (?:today|tomorrow|on \w+)|heading out early|taking PTO|PTO (?:the week|next week|on)|(?:I'm|I am|I'll be) out (?:the \d+(?:st|nd|rd|th)?|on the \d+)|need (?:the )?(?:afternoon|morning|day) off)\b/i;
export function isTimeOff19(raw) {
  const t = String(raw ?? "");
  return t.length < 160 && !/\n|\?/.test(t) && TIMEOFF19.test(t) && !SENSITIVE.test(t);
}
