// Round 18 (Nov 1, 2026): general fixes from the fresh52 read-through, corporate direction.
// preclean18 rewrites input shapes later steps garble ("tell marketing to quit spamming" read "quit" as "left",
// "this crap project" became "this stuff project", "anyone want the bagels" became "Could someone want").
// timeOff3 and milestone3 give Full C-Suite a joke that fits the message: time off and personal news used to get
// a stock frame and closer ("Cascading this down from the 30,000-foot view ... optimized for maximum alignment")
// that had nothing to do with the message. The joke now sits in the body: the reason is dressed up, the closer fits.
// postfix18 repairs output shapes that are never grammatical. Nothing here adds a fact, a person or a date.

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const SENSITIVE = /\b(?:funeral|passed away|bereavement|hospital\w*|surgery|emergency|ER\b|chemo\w*|cancer|diagnos\w*|treatment|miscarriage|memorial|grief|grieving|sick|ill\b|illness|flu\b|covid|migraine|fever|labou?r|contractions|home sick|throwing up|injur\w*|broke my|broken (?:arm|leg|wrist|ankle)|therapy|rehab|divorce|lost my)\b/i;
export function isSensitive18(t) { return SENSITIVE.test(String(t ?? "")); }

export function preclean18(raw) {
  let t = String(raw ?? "");
  const lone = !/\n/.test(t) && t.length < 160;
  if (!lone) return t;
  // "tell marketing to quit spamming the whole company" is a request to ask them to stop.
  t = t.replace(/^(?:can you |could you |pls |please )?(?:tell|ask) ((?:the )?[a-z]+(?: team)?|him|her|them|[A-Z][a-z]+) to (?:quit|stop|knock off) ([a-z]+ing)\b(?! around)([^?!.]*)[.!?]*$/i, (_m, who, v, rest) => `Could we ask ${who.replace(/^(?!the\b|him\b|her\b|them\b|[A-Z])/, "")} to stop ${v.toLowerCase()}${rest}?`);
  // "anyone want the leftover bagels" is an offer.
  t = t.replace(/^(?:does )?any(?:one|body) (?:want|wants)\s+(?!to\b)(\S+(?:\s+\S+){2,}?)[.!]*$/i, (_m, x) => `Would anyone like ${x}?`);
  // "not happening before the holidays" has no subject.
  t = t.replace(/^(?:nope,? |no,? )?not happening (before|until|this|today|tomorrow|next|in|by)\b([^.!?]*)[.!]*$/i, (_m, a, b) => `That's not happening ${a.toLowerCase()}${b}.`);
  // Sarcasm the literal reader takes at face value.
  t = t.replace(/^(?:wow|oh wow|oh great|great|cool|nice|amazing|fantastic|love it|lovely),?\s+(an? [^,.!?]{3,60}?) instead of (an? [^,.!?]{2,40}?)[.!]*$/i, (_m, a, b) => `We're getting ${a} instead of ${b}, which isn't ideal.`);
  t = t.replace(/^(?:i )?(?:love|loving|so glad|really glad|thrilled|glad) (?:that|how) (.{3,80}? (?:got|was|were|is being|are being|has been|have been) (?:replaced|cancell?ed|cut|scrapped|killed|pushed|delayed|moved|shelved|dropped)\b[^.!?]*)[.!]*$/i, (_m, x) => `I'm not thrilled that ${x}.`);
  t = t.replace(/^(?:so |really )?(?:glad|love|thrilled|happy) (?:that )?we have an? (meeting|call|sync|meeting|deck) (?:to|about how to) (plan|prep for|discuss|schedule) the (meeting|call|sync|deck)[.!]*$/i, (_m, a, v, b) => `I'm not sure we need a ${a} to ${v} the ${b}.`);
  // Crude idioms the word filter half-cleans.
  t = t.replace(/\bass[- ]?backwards?\b/gi, "completely backwards");
  t = t.replace(/,\s*(?:total|such a|what a|real) dick move[.!]*$/i, ", which was a really unfair move.").replace(/\b(?:a|such a|what a|total) dick move\b/gi, "a really unfair move");
  t = t.replace(/\b(?:about to|gonna|going to) flip (?:a|the) table\b/gi, "about to lose my patience");
  t = t.replace(/\bthe (?:shit|crap|poop) (?:hit|hits|is hitting|will hit) the fan\b/gi, "things escalated fast");

  // "done with QA pass" is a status about me.
  t = t.replace(/^done with (?!it\b|this\b|that\b|the\b|my\b|our\b)([a-z][\w -]{2,40}?)[.!]*$/i, (_m, x) => `I'm done with the ${x}.`);
  // "the snow is bad" is about the weather being rough, not an opinion.
  t = t.replace(/\b(the )?(snow|rain|weather|storm|roads|ice|fog|wind|heat)(?: out there)? (is|are) (?:so |really |super )?(bad|awful|terrible|horrible|insane|crazy|nuts|brutal|nasty)\b/gi, (_m, d, n, v) => `${d ?? ""}${n} ${v} really rough`);
  return t;
}

// Reasons people give for time off, dressed up in deadpan corporate (Full C-Suite only). Each keeps the plain word.
const REASONS = [
  [/\b(?:for|to attend) (?:a|my|our|his|her|their)? ?(?:friend's |sister's |brother's |cousin's |best friend's )?wedding\b/i, (m) => `${m}, which I'm treating as a high-stakes cross-family merger`],
  [/\b(?:to see|for) my (?:kid|son|daughter|child|kids)'s (?:play|recital|concert|show|performance)\b/i, (m) => `${m}, a front-row seat at a key family stakeholder's premiere`],
  [/\b(?:to see|for) my (?:kid|son|daughter|child|kids)'s (?:game|match|tournament|meet)\b/i, (m) => `${m}, where a key family stakeholder is competing`],
  [/\b(?:to see|for|to attend) my (?:kid|son|daughter|child|kids)'s (?:school thing|school event|parent-teacher conference|graduation|field trip)\b/i, (m) => `${m}, a high-priority family stakeholder engagement`],
  [/\bfor (?:a |my )?(?:doctor's|doctors|dentist|dental|eye|vet) appointment\b/i, (m) => `${m}, a scheduled wellness audit`],
  [/\bjury duty\b/i, () => "civic-engagement duty (jury duty)"],
  [/\bmy flight(?: back| home| out)? (?:got |was )?(?:moved|changed|cancelled|canceled|delayed)\b/i, (m) => `${m}, an airline-led reprioritization I was not consulted on`],
  [/\bmy car broke down\b/i, () => "my personal mobility asset has entered an unplanned maintenance window"],
  [/\bfor my birthday\b/i, (m) => `${m}, a key annual personal milestone`],
  [/\bbe moving (?:apartments|house|houses|offices|desks)\b/i, () => "be executing a residential relocation initiative"],
  [/\b(?:because I'm |to |for (?:a |the )?)(?:move|moving)(?: apartments| house| houses)?\b(?! on)/i, (m) => `${m}, a residential relocation initiative`],
  [/\bfor (?:a |the )?school pick-?up\b/i, (m) => `${m}, a non-negotiable family logistics window`],
  [/\bto recover from the move\b/i, () => "to recover from a residential relocation initiative"],
  [/\b(?:no laptop|without (?:my|a) laptop)\b/i, () => "with no laptop, by strategic design"],
  [/\band (?:will not|won't) be checking (?:email|my email|Slack|slack)\b/i, () => "and my Slack will be operating in read-never mode"],
  [/\b(?:and )?I'm not checking (?:email|my email|Slack)\b/i, (m) => `${/^and/i.test(m) ? "and " : ""}my inbox will be operating in read-never mode`],
];
const TIMEOFF = /\b(?:(?:day|days|week|weeks|afternoon|morning|monday|tuesday|wednesday|thursday|friday|tomorrow|today|the \d+(?:st|nd|rd|th)?|next \w+) off|off (?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|next \w+|this \w+)|(?:I'm|I am|I'll be|I will be) (?:out(?=\s+(?:of office|today|tomorrow|tmrw|mon|tue|wed|thu|fri|sat|sun|next|this|the week|for|all|until|till|through|from|\w+day))|off|ooo|away)\b|on (?:vacation|PTO|holiday|leave)\b|take (?:a |two |three |\d+ )?(?:weeks?|days?) (?:in|off|next)\b|half[- ]day|long weekend|leave at (?:noon|\d)|leaving at (?:noon|\d)|(?:in|to) [A-Z][a-z]+ for (?:two|three|a|\d+) weeks?|^(?:out|off|ooo) (?:for|all|today|tomorrow|this|next|monday|tuesday|wednesday|thursday|friday)|offline (?:the whole day|all day|tomorrow|today|monday|tuesday|wednesday|thursday|friday|next week|this afternoon))\b/i;
export function isTimeOff18(raw) {
  const t = String(raw ?? "");
  return t.length < 160 && !/\n|\?/.test(t) && TIMEOFF.test(t) && !SENSITIVE.test(t) && !/\b(?:they|he|she|you|everyone|the team|we) (?:are|is|'re|will be) (?:out|off)\b|\bswap\b|\bworking\b|\bcamera\b|\bon call\b|\bhave a\b|\bhungover\b|\bdrunk\b/i.test(t);
}
// Builds the Full C-Suite version from the Mild one, so the facts and grammar are the ones Mild already checked.
export function timeOff3(l1, raw) {
  let t = String(l1 ?? "").trim();
  if (!t || /\b(?:for back|from until|be moving day|working|have a)\b/i.test(t)) return null;
  t = t.replace(/^(?:Just to let you know|Just so you know|Quick update|Just a quick update|Unfortunately|Heads-up|FYI)[,:]\s*/i, "").replace(/^\w/, (c) => c.toUpperCase());
  t = t.replace(/\s*(?:Thanks!?|Thank you!?)$/i, "");
  let reasoned = false;
  for (const [re, f] of REASONS) if (re.test(t)) { t = t.replace(re, (m) => f(m)); reasoned = true; }
  t = t.replace(/\bon vacation\b/i, "on a strategic recharge sabbatical").replace(/\bon PTO\b/i, "on pre-approved strategic recharge leave")
    .replace(/\b(tak(?:e|ing)) a half day\b/i, "$1 a half-day strategic recharge window").replace(/\ba long weekend\b/i, "an extended strategic recharge window")
    .replace(/\b(leave|leaving) at (noon|\d{1,2}(?::\d\d)?(?: ?[ap]m)?)\b/i, (_m, v, h) => `${v === "leave" ? "transition" : "transitioning"} out of the office at ${h}`);
  const sentences = t.split(/(?<=[.!])\s+/);
  const first = sentences[0].replace(/[.!]+$/, "");
  const offOnly = !reasoned && !/\b(?:recharge|sabbatical|read-never|transition|leave)\b/i.test(t) && !/\b(?:for (?:a|an|my|the|our|his|her)\b|to [a-z]+\b|because|since|so\b|and\b|,)/i.test(first);
  const body = offOnly ? `${first} to recharge and return with renewed strategic clarity` : first;
  const rest = sentences.slice(1).join(" ");
  const closer = /recharge|sabbatical|read-never/i.test(body + rest) ? "Rest is a deliverable." : "My out-of-office message has been strategically pre-aligned.";
  return `${body}.${rest ? ` ${rest}` : ""} ${closer}`.replace(/\.\./g, ".").replace(/\s{2,}/g, " ").trim();
}

// Personal good news: the joke is a closer that fits the news, never a frame about "headwinds".
const MILESTONES = [
  [/\b(?:got into|accepted (?:in)?to|admitted to) (?:grad school|graduate school|law school|med school|business school|an? (?:MBA|master's|PhD) program|college)\b/i, "My growth mindset is now formally accredited."],
  [/\b(?:passed|aced|cleared) (?:my |the )?[\w -]{0,30}(?:exam|certification|cert|test|boards)\b/i, "My growth mindset is now formally accredited."],
  [/\b(?:had a baby|welcomed a (?:baby|new junior stakeholder)|adopting|adopted|expecting a baby|pregnant|due in)\b/i, "Our family headcount plan has been fully approved."],
  [/\b(?:bought|closed on) (?:my|our|a) (?:first )?(?:house|home|condo|apartment)\b/i, "My personal real-estate portfolio is now fully leveraged."],
  [/\b(?:got promoted|was promoted|I'm being promoted|got the promotion)\b/i, "My title has been upgraded. My bandwidth has not."],
  [/\b(?:getting married|got married|got engaged|finalizing a lifelong partnership merger)\b/i, "Both boards have approved."],
  [/\b(?:ran|finished|running|completed) (?:a|my first|the) (?:marathon|half marathon|5k|10k|triathlon)\b/i, "Endurance is a core competency."],
];
const STOCK_FRAME = /^(?:Cascading this down from the 30,000-foot view|Cascading a mission-critical update to the broader organization|Circling back on this strategic update, as promised to no one|Pursuant to our ongoing commitment to stakeholder over-communication|In the spirit of bringing my whole self to work|I'm not crying, you're crying|Humbled and honored to share that|Thrilled to announce a milestone moment|Not every chapter is a highlight reel|A quick update[^:]{0,40}|Just a quick update|In the spirit of radical transparency)[:,]?\s*/;
const STOCK_CLOSER = /\s*(?:This message has been optimized for maximum alignment\.|Consider yourselves strategically informed\.|No synergies were harmed in the making of this strategic update\.|Please route all urgent synergies elsewhere\.|My wellness metrics have been escalated for executive review\.|Please hold your applause until the end of the quarter\.|History, and the quarterly scorecard, will remember this moment\.|We remain cautiously optimistic about everything\.|This is what happens when vision meets execution\.)\s*$/;
// A Full C-Suite line built from a stock frame or a stock closer, with nothing in the body that is funny.
const STOCK_FRAME2 = /^(?:Practicing radical transparency about my bandwidth|A transparent update on my (?:communications bandwidth|physical availability|calendar ecosystem)|Flagging an unplanned innovation in our technology stack|Surfacing a [\w -]+ headwind[^:]*|Leaning into the discomfort here|Flagging a growth opportunity in real time)[:,]/;
export function isStock18(l3) { const t = String(l3 ?? ""); return STOCK_FRAME.test(t) && !/^A quick update/.test(t) || STOCK_FRAME2.test(t) || STOCK_CLOSER.test(t); }
export function milestone3(l3, raw) {
  const src = String(raw ?? "");
  if (SENSITIVE.test(src) || /\?/.test(src) || /\b(?:not|didn't|failed|can't|won't)\b/i.test(src)) return null;
  const hit = MILESTONES.find(([re]) => re.test(src) || re.test(l3));
  if (!hit) return null;
  let t = String(l3).replace(STOCK_CLOSER, "").replace(STOCK_FRAME, "");
  // Any other stock closer: a last sentence that shares no word with the message.
  { const parts = t.split(/(?<=[.!])\s+/); const words = new Set(src.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    if (parts.length > 1 && !(parts[parts.length - 1].toLowerCase().match(/[a-z]{4,}/g) ?? []).some((w) => words.has(w))) t = parts.slice(0, -1).join(" "); }
  t = t.replace(/^\w/, (c) => c.toUpperCase());
  if (!/[.!?]$/.test(t)) t += ".";
  return `Excited to share a personal milestone with the broader ecosystem: ${t[0].toLowerCase() === t[0] ? t : (/^I\b/.test(t) ? t : t[0].toLowerCase() + t.slice(1))} ${hit[1]}`;
}

export function postfix18(input, text, lvl) {
  let t = String(text ?? "");
  t = t.replace(/\b(a|an) (?:giant|huge|massive|total|complete|colossal|enormous) (poor|inefficient|suboptimal) use\b/gi, (_m, a, w) => `a very ${w} use`)
    .replace(/\b(a|an) ([a-z]+) (?:a|an) ((?:[a-z-]+ )?(?:asset|partner|solution|infrastructure|platform|ecosystem|initiative))\b/g, (_m, a, adj, n) => `${/^[aeiou]/i.test(adj) ? "an" : "a"} ${adj} ${n}`)
    .replace(/\bI won't be happening\b/g, "That won't be happening").replace(/\bI'm not happening\b/g, "That's not happening")
    .replace(/\b(?:Could|Would) (?:someone|anyone) (?:want|wants)\b/g, "Would anyone like")
    .replace(/\bseeking a thought partner who could want\b/g, "seeking a thought partner who would like")
    .replace(/\bthe tell (\w+) to\b/gi, "$1 to")
    // "this crap project" came out as "this stuff project": a crude adjective left as a noun.
    .replace(/\b(this|that|the|our|my|your|their|a) (?:stuff|thing) (?!(?:is|was|are|were|that|which|we|I|you|they|he|she|it|in|on|at|for|to|from|with|and|or|but|again|done|here|there|out|up|off|down|around|over)\b)([a-z]{3,})\b(?=\s+(?:is|was|are|were|keeps?|froze|broke|crashed|again|has|had|will|won't|isn't|doesn't|didn't|[.,!?]|$))/g, (_m, d, n) => `${d} frustrating ${n}`)
    .replace(/\b(fed up with|sick of|tired of|at my limit with|done with|frustrated with) (this|that|the) frustrating\b/gi, "$1 $2")
    .replace(/\b(this|that|the|our|my|your|their|a) (?:stuff|thing) (project|initiative|deck|report|tool|process|workflow|policy|plan|meeting|code|codebase|vendor|laptop|system|app|platform)\b/g, "$1 frustrating $2")
    .replace(/\b(fed up with|sick of|tired of|at my limit with|done with|frustrated with) (this|that|the) frustrating\b/gi, "$1 $2");
  return t.replace(/[ \t]{2,}/g, " ");
}

// Bad numbers at Full C-Suite: keep the figure, then inflate it with a euphemism that fits the kind of number
// (overspend, tiny totals, low conversion, below target, overloaded queue, long hours, a metric moving the wrong way).
const L1_OPEN = /^(?:Just a heads-up that|Just a quick heads-up that|Just a quick update|Quick update|Just so you know|Just to let you know|It looks like|I wanted to flag that|Unfortunately|Heads-up)[:,]?\s*/i;
const NUM_RULES = [
  [/\b(?:went|came in|ran|are|were|is|was) \$?[\d,.]+k?%? over\b|\bover budget by\b/i, ", which I'm classifying as an unplanned strategic investment", "Every dollar is a stakeholder, and several have left the building."],
  [/\bonly (?:\d+|one|two|three|four|five) (?:out )?of (?:the |our )?(?:\d+|ten|twenty)\b.*\b(?:converted|signed|showed up|replied|responded|renewed|passed|opened|clicked|accepted)\b/i, ", a highly selective conversion funnel", "We are prioritizing quality over quantity, aggressively."],
  [/\b(?:got|had|has|have) (?:only )?(?:[1-9]|one|two|three|four|five|a few|a handful of) (?:signups|sign-ups|users|downloads|replies|attendees|sales|leads|customers|registrations|responses|installs)\b(?:,? total)?/i, ", an exclusive early-adopter cohort", "Exclusivity is a growth strategy."],
  [/\b(?:at|hit|reached) (?:[1-6]?\d)% of (?:the |our |my )?(?:target|goal|quota|plan|forecast)\b/i, ", which leaves a generous runway for upside", "Optimism remains our primary forecasting method."],
  [/\b[\d,]{2,} (?:tickets|tasks|requests|emails|bugs|orders|claims|cases|applications)\b.*\b(?:one|two|three|[1-3]) (?:people|person|engineers|agents|of us|folks|team members)\b/i, ", a staffing ratio I'd describe as aggressively lean", "Lean is a mindset, and also a headcount."],
  [/\b(?:logged|worked|been in [\w -]+ for|put in) (?:[3-9]\d|1\d\d) hours\b/i, ", a bold experiment in sustainable performance", "Rest has been deprioritized to Q5."],
  [/\b(?:sales|revenue|NPS|signups|traffic|conversions?|retention|bookings|engagement|pipeline|margins?|usage|attendance)\b (?:dropped|fell|declined|slipped|(?:is|are|was|were) down|went down|have realigned downward)\b/i, ", a bold recalibration of expectations", "We grow through friction, and we are growing a lot."],
  [/\b(?:churn|costs?|bugs?|issue count|defect count|complaints|tickets|refunds|returns|latency)\b (?:hit|rose|jumped|spiked|doubled|tripled|went from|(?:is|are) up)\b/i, ", a record we did not set out to break", "Records were made to be broken, ideally not this one."],
];
export function numbers3(l1, raw) {
  if (!/\d|\b(?:one|two|three|four|five|a few|a handful)\b/i.test(String(raw ?? "")) || SENSITIVE.test(raw) || /\?/.test(raw)) return null;
  let t = String(l1 ?? "").trim().replace(L1_OPEN, "").replace(/\s*(?:Thanks!?)$/i, "");
  if (!t || t.split(/(?<=[.!])\s+/).length > 2) return null;
  for (const [re, clause, closer] of NUM_RULES) {
    if (!re.test(t)) continue;
    const parts = t.split(/(?<=[.!])\s+/);
    const first = parts[0].replace(/[.!]+$/, "");
    const body = first[0].toLowerCase() === first[0] || /^(?:I|I'm|I've|I'll|[A-Z]{2,}|[A-Z][a-z]+'s)\b/.test(first) ? first : first[0].toLowerCase() + first.slice(1);
    const rest = parts.slice(1).join(" ");
    return `In the interest of data-driven transparency, ${body}${clause}.${rest ? ` ${rest}` : ""} ${closer}`;
  }
  return null;
}
