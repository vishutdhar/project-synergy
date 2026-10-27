// Round 12: general rules from fresh38 (Oct 26). Each rule is a sentence shape, not a single phrase.
// 1. Bare status fragments ("Release frozen until Monday", "Q3 numbers out", "Kitchen flooded, avoid") get a subject and verb.
// 2. Sarcasm with no trigger word ("what a treat, another X", "nothing like a surprise X", "totally normal to X at 11pm").
// 3. Idioms and slang that were read word by word ("ate our lunch", "crushed it, damn", "want to quit", "don't bullshit me").

const cap1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const low1 = (s) => (/^(?:I|I'm|I'll|I've|I'd)\b/.test(s) || /^[A-Z]{2,}/.test(s) || /^Q[1-4]\b/.test(s) ? s : s ? s[0].toLowerCase() + s.slice(1) : s);
const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const capDays = (s) => s.replace(new RegExp(`\\b(${DAYS})\\b`, "gi"), (d) => d[0].toUpperCase() + d.slice(1).toLowerCase());

// Words that can't start a bare noun phrase.
const NOT_NOUN = /^(?:I|I'm|I'll|I've|I'd|we|we're|you|he|she|they|it|it's|this|that|there|here|so|and|but|or|if|when|just|still|also|please|pls|thanks|thank|sorry|ok|okay|yes|no|nope|yeah|hey|hi|hello|not|can't|cannot|won't|don't|didn't|is|are|was|were|be|been|do|does|did|have|has|had|will|would|could|should|can|may|might|must|let's|lets|who|what|why|how|where|which|whose|any|anyone|someone|nobody|everyone|wow|oh|great|love|nice|cool|sure|totally|really|very|super|almost|nearly|about|from|to|for|with|at|in|on|by|of|as|out|off|up|down|back|need|needs|want|wants|going|gonna|got|get|then|now|today|tomorrow|tonight|again)$/i;
// States a bare noun phrase can be in. "has been" for things someone did to it, "is" for conditions.
const DONE_TO = "sent|shipped|submitted|deployed|merged|approved|signed|booked|confirmed|posted|published|uploaded|updated|paid|wiped|moved|rescheduled|postponed|canceled|cancelled|filed|ordered|scheduled|renewed|released|restored|reverted|rolled back|escalated|assigned|reassigned|reviewed|archived|announced|extended|delayed|pushed|bumped";
const STATE_ADJ = "frozen|flooded|jammed|attached|closed|late|ready|done|due|live|out|in|up|down|broken|stuck|full|empty|mandatory|optional|open|locked|missing|overdue|blocked|happy|unhappy|offline|online|slow|fixed|resolved|pending|finished|complete|completed|back|red|green|dead|clean|dirty|cold|hot|freezing|packed|sold out|over budget|on track|on hold|behind|ahead|underway|in progress|in review|ready for review|unreachable|flaky|failing|passing|crashing|leaking|lagging|delayed|canceled|cancelled";
const PAST_VERB = "slipped|went off|went down|went out|went live|crashed|failed|passed|landed|arrived|dropped|spiked|jumped|tanked|grew|shrank|broke|died|ran over|ran long|blew up|came in|came back|fell|rose|doubled|tripled|halved|stalled|froze|leaked|timed out";
const MASS = /^(?:payroll|prod|production|legal|finance|security|IT|HR|marketing|sales|support|engineering|design|ops|traffic|parking|lunch|breakfast|dinner|coffee|training|onboarding|recruiting|billing|checkout|search|login|signup|signups)$/i;
const PLURAL = (np) => { const w = np.split(" ").pop(); return /s$/i.test(w) && !/(?:ss|us|is|news|ops|sales|series|billing)$/i.test(w) && !/^(?:[A-Z]+s|\d+s)$/.test(w) || /^(?:numbers|results|figures|metrics|slides|notes|docs|bagels|donuts|snacks|keys|people|folks)$/i.test(w); };
// Events that happen at a time: team events read "the X is at 10", personal ones "I have a X at 11".
const PERSONAL_EVENT = /^(?:interview|recruiter call|call|appointment|doctor's appointment|dentist|dentist appointment|1:1|one-on-one|physio|therapy|haircut|vet appointment|phone screen|screening call)$/i;
const TEAM_EVENT = /^(?:kickoff|kick-off|demo|standup|stand-up|training|all[- ]hands|offsite|fire drill|retro|review|sync|town hall|launch|go-live|deploy|deployment|release|maintenance|outage window|workshop|lunch-and-learn|board meeting|team lunch|happy hour|party|holiday party|meeting|planning|sprint planning|interviews)$/i;
const TIME = String.raw`(?:today|tomorrow|tonight|this (?:morning|afternoon|evening|week)|next week|(?:on )?(?:${DAYS})|at \d{1,2}(?::\d\d)?(?: ?[ap]m)?|\d{1,2}(?::\d\d)? ?[ap]m|noon|eod|EOD)`;

function np(raw) {
  // A bare noun phrase of 1 to 4 words, with its article.
  const words = raw.trim().split(/\s+/);
  if (words.some((w, i) => /^(?:guess|nvm|who|what|figured|broke|went|got|keeps|kept|said|says|told|thinks|think|knows|know|did|does|made|took|came|ran|found|left|lost|gave|sent|saw|seems|looks|feels|wants|needs)$/i.test(w) || i > 0 && /ed$/i.test(w) && !/^(?:shared|limited|automated|advanced|detailed|red|bed|need|feed|speed|seed|weed)$/i.test(w))) return null;
  if (!words.length || words.length > 4 || NOT_NOUN.test(words[0]) || words.some((w) => /^(?:is|are|was|were|has|have|had|will|can|and|but|so|I|we|you)$/i.test(w))) return null;
  if (/ing$/i.test(words[0]) && words.length === 1 && !MASS.test(words[0]) && !/^(?:building|ceiling|meeting|ring|thing|wing|string|parking|staging|wiring|plumbing|heating|lighting|seating|signage|offering|listing|posting|recording|setting|booking|pricing|staffing|tooling|logging)$/i.test(words[0])) return null;
  if (words.some((w) => /[?!]/.test(w))) return null;
  // Contractions, pure numbers, quantifiers and chat words aren't noun phrases ("revenue's up", "running 10 late", "All done", "fyi I'm out").
  if (words.some((w) => /['’]/.test(w) || /^\d+$/.test(w)) || /^(?:all|fyi|heads|double|eta|everything|nothing|both|each|some|none|ping|running|snowed|rained|iced|stuck|ikr|idk|tbh|imo|imho|lol|btw)$/i.test(words[0]) || /ed$/i.test(words[0]) && words.length === 1 && !/^(?:shed|bed|red|feed|seed|speed)$/i.test(words[0])) return null;
  let t = raw.trim().replace(/^(?:the|my|our) /i, (d) => d.toLowerCase());
  const det = t.match(/^(?:the|my|our) /)?.[0] ?? "";
  t = t.slice(det.length);
  const head = t.split(" ")[0];
  if (/^staging$/i.test(t)) return { s: "the staging environment", plural: false };
  const keepCase = /^(?:[A-Z]{2,}\w*|Q[1-4]|v\d)/.test(head) || /^[A-Z][a-z]+$/.test(head) && /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Jira|Slack|Salesforce|Zoom|Safari|Chrome|Figma|GitHub)$/.test(head);
  const body = keepCase ? t : low1(t);
  const METRIC = /^(?:churn|latency|NPS|revenue|morale|signups|sign-ups|refunds|invoices|response times?|load times?|crash rate|bounce rate|error rate|uptime|conversion|conversions|retention|engagement|open bugs|open issues|open tickets|errors|bugs|crashes|sales|traffic|downloads|installs|leads|bookings|margins?)$/i;
  const art = det || (MASS.test(t) || METRIC.test(t) ? "" : "the ");
  return { s: `${art}${body}`.trim(), plural: PLURAL(t), metric: !det && METRIC.test(t) };
}

// One comma part of a fragment. Returns { s, kind } like prepass fragClause, or null.
export function genericClause(c0, opts = {}) {
  const c = c0.trim().replace(/[.!]+$/, "");
  let m;
  if (!c) return null;
  if (PERSONAL_THING.test(c) && !/^(?:the )?(?:parking|garage|lot)\b/i.test(c)) return null;
  // Short actions after a status: "avoid", "looking", "merging", "almost there", "then free", "label your stuff".
  if (/^(?:avoid|avoid it|avoid the area|steer clear)$/i.test(c)) return { s: "please avoid it for now", kind: "ask" };
  if (!opts.single && !/\bplease\b/i.test(c) && (m = c.match(/^(label|grab|bring|take|clean out|clear out|check|use|save|update|read|sign|submit|join|refresh|restart|reboot|update|drink|eat|help yourself to|come get|come grab) (.+)$/i)) && !/ing$/i.test(m[1])) return { s: `please ${m[1].toLowerCase()} ${m[2]}`, kind: "ask" };
  if ((m = c.match(/^(looking|checking|investigating|digging in|on it)$/i))) return { s: /^on it$/i.test(m[1]) ? "I'm on it" : `I'm ${m[1].toLowerCase()} into it`.replace("digging in into it", "digging in").replace("checking into it", "checking on it"), kind: "effect" };
  if ((m = c.match(/^(merging|deploying|redeploying|rebuilding|retrying|restarting|rolling back|reverting|shipping|publishing|monitoring|watching|testing|fixing|patching)( it| now)?$/i))) return { s: `I'm ${m[1].toLowerCase()}${/^(?:merging|deploying|shipping|publishing|testing|fixing|patching|reverting)$/i.test(m[1]) && !m[2] ? " it" : m[2] ?? ""}`, kind: "effect" };
  if ((m = c.match(/^(almost|nearly) (there|done|finished)$/i))) return { s: `I'm ${m[1].toLowerCase()} ${m[2].toLowerCase()}`, kind: "state" };
  if ((m = c.match(/^then (free|available|out|offline|back|around)$/i))) return { s: `then I'm ${m[1].toLowerCase()}`, kind: "then" };
  if ((m = c.match(/^(free|available) (after|from|at) (.+)$/i))) return { s: `I'm ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3]}`, kind: "back" };
  if ((m = c.match(/^(needs|need) (a pass|a review|a look|eyes|review|sign-off|approval|feedback|a second look)$/i))) return { s: `it needs ${m[2].replace(/^eyes$/, "a review")}`, kind: "ask" };
  if ((m = c.match(/^(worth it|worth a look|worth watching|worth joining|not worth it)$/i))) return { s: `it's ${m[1].toLowerCase()}`, kind: "state" };
  if ((m = c.match(/^(street parking|remote|cash|cards?|badge entry|guests|staff) only$/i))) return { s: `it's ${m[1].toLowerCase()} only`, kind: "state" };
  if ((m = c.match(/^[Aa]pproval from ([A-Z][a-z]+)$/))) return { s: `I have approval from ${m[1]}`, kind: "cause" };
  // "Kickoff tomorrow 10am", "Interview at 11", "Fire drill at 2".
  if ((m = c.match(new RegExp(String.raw`^(?:the |a |an |my )?([a-z][\w' -]*?) (${TIME}(?: (?:at )?\d{1,2}(?::\d\d)?(?: ?[ap]m)?)?)$`, "i")))) {
    const ev = m[1].toLowerCase(); let when = capDays(m[2]).replace(/^(today|tomorrow|tonight) (\d)/i, "$1 at $2").replace(/^(\d)/, "at $1").replace(/\beod\b/i, "EOD");
    if (PERSONAL_EVENT.test(ev) || /^(?:recruiter|client|vendor|customer|investor|candidate) call$/i.test(ev)) return { s: `I have ${/^[aeiou1]/.test(ev) && !/^one/.test(ev) ? "an" : "a"} ${ev} ${when}`, kind: "cause" };
    const generic = ev.split(" ").length <= 3 && !NOT_NOUN.test(ev.split(" ")[0]) && /(?:cleanout|cleanup|clean-up|drill|test|inspection|maintenance|party|lunch|meeting|potluck|photo|event|session|deadline|cutoff|cut-off|freeze|window|presentation|pitch|walkthrough|briefing|onboarding|orientation|celebration|social|bake sale|drive)$/i.test(ev);
    if (generic) return { s: `the ${ev} is ${/^(?:${DAYS})/i.test(when) ? "on " : ""}${when}`, kind: "cause" };
    if (TEAM_EVENT.test(ev) || /^(?:team |client |vendor |product |sales |board |quarterly |weekly |monthly |all-company )?(?:kickoff|demo|training|review|meeting|lunch|sync|offsite|workshop|planning|retro|launch|party|drill)$/i.test(ev)) return { s: `the ${ev} is ${when}`, kind: "cause" };
  }
  // "Release frozen until Monday", "Q3 numbers out", "Roadmap draft attached", "Copier out of toner", "Customer happy".
  if ((m = c.match(new RegExp(String.raw`^(.+?) (${DONE_TO}|${STATE_ADJ}|out of [\w -]+|ready for [\w -]+)( again| finally| for now| for everyone| everywhere| on [\w-]+| in [\w -]+| until [\w ]+| till [\w ]+| through [\w ]+| to [\w ]+| by [\w ]+| this week| today| tomorrow| tonight| next week| ${TIME})*$`, "i")))) {
    const n = np(m[1]);
    if (n && !n.metric) {
      const st = m[2].toLowerCase(); const tail = c.slice(m[1].length + 1 + m[2].length);
      const isDone = new RegExp(`^(?:${DONE_TO})$`, "i").test(st) && !/^(?:delayed|canceled|cancelled|moved|pushed|postponed)$/i.test(st) || /^(?:closed)$/.test(st) && /^(?:the )?(?:ticket|issue|bug|PR|deal|case|sale|round|req|requisition)/i.test(m[1]);
      const verb = isDone ? (n.plural ? "have been" : "has been") : n.plural ? "are" : "is";
      return { s: `${n.s} ${verb} ${st}${tail}`, kind: "cause" };
    }
  }
  // "Forecast slipped again", "Pager went off".
  if ((m = c.match(new RegExp(String.raw`^(.+?) (${PAST_VERB})(\b.*)$`, "i")))) {
    const n = np(m[1]);
    if (n && !n.metric) return { s: `${n.s} ${m[2].toLowerCase()}${m[3]}`, kind: "cause" };
  }
  return null;
}

const PERSONAL_THING = /^(?:the |my )?(?:car |laptop |phone )?(?:dentist(?! appointment$)\b(?=.)|doctor\b(?=.)|vet\b(?=.)|physio\b(?=.)|therapist\b(?=.)|parking|parking lot|lot|garage|laptop|phone|car|battery|bus|train|flight|plane|babysitter|sitter|subway|tram|metro|nanny|kid|kids|son|daughter|dog|cat|internet|wifi|wi-fi|power|mic|camera|webcam|headset|headphones|router|ride|uber|charger|monitor|mouse|keyboard|heat|ac|vpn)\b/i;

// Fragment questions: "VPN down for everyone?" -> "Is the VPN down for everyone?"
function fragQuestion(t) {
  let m;
  if ((m = t.match(/^(?:(.+?),\s*)?([A-Za-z][\w' -]*?) (down|up|out|working|broken|ready|done|live|open|closed|back|fixed|still on|still happening|happening|confirmed|booked|free|available)( [\w' -]+?)?\?$/i))) {
    const n = np(m[2]);
    if (!n || m[2].split(" ").length > 3) return null;
    const pre = m[1] ? completeOne(m[1]) : "";
    if (m[1] && !pre) return null;
    return `${pre ? pre + " " : ""}${n.plural ? "Are" : "Is"} ${n.s} ${m[3].toLowerCase()}${m[4] ?? ""}?`;
  }
  return null;
}
function completeOne(part) {
  const g = genericClause(part) ?? (/^[A-Z]?[a-z][\w' -]+ (?:starts|ends|joins|arrives|leaves|lands|is|are) .+$/.test(part) && np(part.split(/ (?:starts|ends|joins|arrives|leaves|lands|is|are) /)[0]) ? { s: `${np(part.split(/ (?:starts|ends|joins|arrives|leaves|lands|is|are) /)[0]).s} ${part.slice(part.split(/ (?:starts|ends|joins|arrives|leaves|lands|is|are) /)[0].length + 1)}`, kind: "cause" } : null);
  return g ? cap1(capDays(g.s)) + "." : "";
}

// Sarcasm without a trigger word. Each one keeps the complaint and drops the fake praise.
function sarcasm12(t) {
  let m;
  const s = t.replace(/[.!]+$/, "").trim();
  if ((m = s.match(/^(?:oh,? )?(?:what a (?:treat|joy|delight|thrill|surprise)|how (?:fun|lovely|exciting|delightful)|lucky us|yay|woohoo|hooray),? (another|one more|a new|yet another|more) (.+)$/i))) return `I'm not thrilled about ${/^more$/i.test(m[1]) ? "more" : "yet another"} ${m[2]}.`;
  if ((m = s.match(/^(another|yet another|one more) (.+?),? (?:yay|woohoo|hooray|great|fun|lovely|love it|how fun|can't wait)$/i))) return `I'm not thrilled about yet another ${m[2]}.`;
  if ((m = s.match(/^nothing (?:like|beats|says (?:monday|friday|good morning|happy friday)(?: like)?) (a|an|another|the) (.+)$/i))) return `${/^another$/i.test(m[1]) ? "Yet another" : cap1(m[1])} ${m[2]} is not ideal.`;
  if ((m = s.match(/^(?:it's |so |totally |completely |perfectly |very |just )*(?:totally |completely |perfectly )?(normal|fine|reasonable|cool|great|healthy) to (get|have|receive|be asked|be told|work|answer|reply|take|join|ship|deploy|do) (.+)$/i)) && /^(?:totally|completely|perfectly|so|very|just|it's totally|it's completely)\b/i.test(s)) return `It's not ideal to ${m[2]} ${m[3]}.`;
  if ((m = s.match(/^(?:yeah|yes|sure|right|oh yeah),? because (?:a |an |the )?(.+?) (?:is|was|are) (?:exactly|just|totally|definitely) what (we|I|the team|everyone) (?:needed|need|wanted)$/i))) return `I'm not sure ${/^\d/.test(m[1]) ? "a " : "a "}${m[1]} is what ${m[2] === "I" ? "I" : m[2]} ${m[2] === "I" ? "need" : "need"}.`.replace(/^I'm not sure a (an?|the) /, "I'm not sure $1 ");
  if ((m = s.match(/^(?:sure|great|cool|ok|okay|yes|yeah|perfect|awesome),? let'?s (?:just )?add (another|one more|more|yet another) ([^,]+)$/i)) && !/\b(?:that'll|that will|because)\b/i.test(m[2])) return `I'm not sure we need ${/^more$/i.test(m[1]) ? "more" : "another"} ${m[2]}.`;
  if ((m = s.match(/^(?:I )?(?:really |truly |so |just )?(?:appreciate|love|enjoy) (?:being told|hearing|finding out|learning|getting told) about (.+?) (on|after|the day of|during|at) (.+)$/i)) && /\b(?:day|after|already|launch|signed|started|shipped|deadline|meeting|morning of|night before)\b/i.test(m[2] + " " + m[3])) return `I would have appreciated hearing about ${m[1]} sooner than ${m[2].toLowerCase() === "after" ? "after" : m[2].toLowerCase()} ${m[3]}.`.replace(/sooner than on /, "before ").replace(/sooner than after /, "before ");
  if ((m = s.match(/^(?:how |so |very )?nice of ([\w ]+?) to (tell|inform|let) (us|me|the team)(?: know)? about (.+?) (after|once|the day|when|only after) (.+)$/i))) return `Unfortunately, ${/^(?:legal|finance|security|procurement|marketing|sales|leadership|management|engineering|ops)$/i.test(m[1]) ? m[1].toLowerCase() : m[1]} only told ${m[3].toLowerCase()} about ${m[4]} ${m[5].toLowerCase()} ${m[6]}.`;
  if ((m = s.match(/^(?:I )?(?:just |really |totally )?love how (?:the |our |my |a |this )?(.+?) (turned into|became|ended up as|ended up being|turned out to be) (.+)$/i))) return `Unfortunately, the ${m[1].replace(/^"(.+)"$/, "\"$1\"")} ${m[2].toLowerCase().replace("turned out to be", "turned out to be")} ${m[3]}.`;
  if ((m = s.match(/^(?:I'm |so |really |just )*(thrilled|delighted|excited|happy|glad|stoked) to (find out|learn|hear|discover|see) (?:that )?(.+?) (from|via|through|in|on) (a |an |the )?(.+)$/i)) && /\b(?:cancel\w*|cut|killed|dropped|moved|delayed|scrapped|shelved|deprioritized|ended|laid off|let go|replaced|reorg\w*)\b/i.test(m[3])) return `I was disappointed to ${m[2].toLowerCase()} that ${m[3]} ${m[4].toLowerCase()} ${m[5] ?? ""}${m[6]}.`;
  return null;
}

// Idioms and slang read word by word before.
function idioms12(t) {
  let s = t;
  // "I don't give a damn which font we use" is a lack of preference, not a priority call.
  s = s.replace(/\b(I|we|they|you) (?:really |honestly |truly )?(?:don't|do not) give (?:a|two) (?:fuck|fucks|shit|shits|damn|damns|crap|rat's ass|toss|hoot)s? (which|what|who|whether|if|how|where|when) /gi, (_m, w, q) => `${w} ${/^I$/.test(w) ? "have" : "have"} no strong preference on ${q.toLowerCase()} `);
  s = s.replace(/\b(I|we|they|you) (?:really |honestly |truly )?(?:don't|do not) give (?:a|two) (?:fuck|fucks|shit|shits|damn|damns|crap|rat's ass|toss|hoot)s? about /gi, (_m, w) => `${w} don't have strong feelings about `);
  // "the elevator's been out" is "has been", not a possessive.
  s = s.replace(/\b(?!(?:it|that|there|what|who|he|she|where|here)'s)([A-Za-z]+)'s been\b/g, "$1 has been");
  s = s.replace(/\b(just |totally |completely )?ate (our|my|their|your) lunch\b/gi, (_m, adv, p) => `${adv ?? ""}outcompeted ${{ our: "us", my: "me", their: "them", your: "you" }[p.toLowerCase()]}`);
  // A trailing "damn"/"holy shit" after praise is an intensifier, not bad news.
  if (/\b(?:crushed|nailed|killed|smashed|aced|knocked|great|amazing|incredible|awesome|good|record|best|huge|massive|insane|fire)\b/i.test(s)) s = s.replace(/,?\s*(?:damn|dang|daaa*mn|holy (?:shit|crap|cow)|hell yeah|heck yeah|sheesh)[!.]*$/i, "");
  // "want to quit" means leaving the job; "quit" alone became "left" before.
  s = s.replace(/\b(want|wanna|going|gonna|need|plan|planning|thinking about|about|ready|have) to quit(?: (?:this job|my job|the company|here))?\s*(?=[.!]*$)/i, (_m, v) => `${v} to move on from this role`);
  s = s.replace(/^(?:don't|do not|stop|quit) (?:bullshit|bs|bullshitting|lying to|feeding) (?:me|us)(?: about)?\s*(.*?)[.!]*$/i, (_m, x) => `Please be straight with ${/\bus\b/i.test(_m) ? "us" : "me"}${x ? ` about ${x.replace(/^about /i, "")}` : ""}.`);
  s = s.replace(/\b(?:fuck|fucking|screw|screwing|mess|messing|dick|dicking) around with (the|our|my|this|that) (deadline|timeline|schedule|date|plan|scope|roadmap|budget|pricing|specs?)\b/gi, (_m, d, x) => `keep changing ${d.toLowerCase()} ${x}`);
  s = s.replace(/^tell (\w+) to (?:piss|fuck|bugger|sod|back) off with (?:the |their |this )?(.+?)[.!]*$/i, (_m, who, x) => `Please ask ${who} to pause the ${x}.`);
  // Trailing one-word praise: "fixed three bugs, legend".
  { const LEG = /,\s*(?:absolute |total |a )?(?:legend|hero|goat|mvp|king|queen|rockstar|beast|machine|icon)[!.]*$/i; let m2;
    if (LEG.test(s)) { const body = s.replace(LEG, ""); s = (m2 = body.match(/^((?:the|our|my) [a-z]+(?: [a-z]+)?|[A-Z][a-z]+) (already |just |single-handedly |totally )?([a-z]+)ed\b(.*)$/i)) ? `Kudos to ${/^(?:The|Our|My) /.test(m2[1]) ? low1(m2[1]) : m2[1]} for ${m2[2] ?? ""}${m2[3].replace(/i$/, "y")}ing${m2[4]}.` : `${body}. Truly outstanding work!`; } }
  // "jesus christ who approved this" is an exasperated question.
  s = s.replace(/^(?:jesus(?: christ)?|christ|omg|oh my god|good grief|god|geez|jeez),?\s+(who|what|why|how|where|when)\b(.+?)[.!?]*$/i, (_m, w, r) => `${cap1(w.toLowerCase())}${r}?`);
  return s;
}

// Whole-line shapes that need a full rewrite.
function lines12(t) {
  let m;
  // "open bugs fell to 6" is a count, not a request to open something.
  if ((m = t.match(/^open (bugs|issues|tickets|defects|PRs|pull requests|incidents|requests) (fell|dropped|rose|climbed|jumped|went up|went down|are down|are up|are at|hit) (.+?)[.!]*$/i))) return `The number of open ${m[1]} ${m[2].toLowerCase().replace(/^are /, "is ")} ${m[3]}.`;
  // "offline til noon, dentist": the subject comes back and the reason stays.
  if ((m = t.match(/^(offline|out|away|OOO|unavailable|heads-down|in meetings|on calls) (?:til|till|until|to) ([\w: ]+?)(?:,\s*(dentist|doctor|vet|physio)(?: appointment)?)?[.!]*$/i))) return `I'll be ${/^OOO$/i.test(m[1]) ? "out of office" : m[1].toLowerCase()} until ${m[2].replace(/\beod\b/i, "EOD")}${m[3] ? ` for a ${m[3].toLowerCase()} appointment` : ""}.`;
  if ((m = t.match(/^(?:the |my |our )?([a-z][\w-]*(?: [a-z][\w-]*)?)(?:'s| has) been (out|down|broken|closed|dead|offline|stuck|leaking|jammed|flooded|empty|full|missing) (since|for|all) (.+?)[.!]*$/i)) && !NOT_NOUN.test(m[1].split(" ")[0])) return `The ${m[1].toLowerCase()} has been ${m[2].toLowerCase() === "out" && !/^(?:power|internet|wifi|network|electricity)$/i.test(m[1]) ? "out of service" : m[2].toLowerCase()} ${m[3].toLowerCase()} ${capDays(m[4])}.`;
  if ((m = t.match(/^(?:afk|brb|away|offline|back in|stepping away)\s+(\d+)\s*(?:min|mins|minutes|m)?[.!]*$/i))) return `I'll be away for ${m[1]} minutes.`;
  if ((m = t.match(/^(?:bye|goodbye|so long|farewell) (everyone|all|team|folks|y'all|friends),?\s*(?:it's )?(?:my )?last day(?: today| here)?[.!]*$/i))) return `Today is my last day. Goodbye, ${m[1].toLowerCase().replace("y'all", "everyone")}!`;
  if ((m = t.match(/^(?:last day today|today's my last day),?\s*(?:bye|goodbye) (everyone|all|team|folks)[.!]*$/i))) return `Today is my last day. Goodbye, ${m[1].toLowerCase()}!`;
  if ((m = t.match(/^(?:is )?(anyone|anybody|someone|somebody|everyone|who's|whos) (up for|down for|in for|free for|keen for|around for) (.+?)\??$/i))) return `${/^who'?s$/i.test(m[1]) ? "Who is" : "Is anyone"} ${m[2].toLowerCase()} ${m[3]}?`;
  if ((m = t.match(/^(coffee|lunch|snack|donut|bagel|boba|starbucks|food) run,?\s*(?:anyone )?(?:want|need) anything\??$/i))) return `I'm doing a ${m[1].toLowerCase()} run. Would anyone like anything?`;
  if ((m = t.match(/^(?:going to |gonna |I'm going to |I'm gonna |I'll )?skip work (today|tomorrow|this afternoon|on \w+day) (?:and|to) (sleep|rest|nap|recharge|sleep in)[.!]*$/i))) return `I'm going to take ${m[1].toLowerCase()} off to rest.`;
  if ((m = t.match(/^(?:I'm |I am )?(?:(?:pretending|pretend) to work|faking (?:it|work)) (until|till|til) (.+?)[.!]*$/i))) return null;
  // Lunch order placed, arriving soon.
  if ((m = t.match(/^(lunch|the lunch|pizza|the pizza|food|dinner|catering|coffee|the order|lunch order|the lunch order|pizza order|food order) (?:order )?(?:is )?(in|ordered|placed),\s*(\d+) ?(?:min|mins|minutes)[.!]*$/i))) return `The ${m[1].replace(/^the /i, "").toLowerCase()}${/order/.test(m[1]) ? "" : " order"} is in, and it should arrive in about ${m[3]} minutes.`;
  // Subject dropped before a first-person past verb with an object: "drafted the press release, needs a pass".
  if ((m = t.match(/^(drafted|wrote|updated|finished|reviewed|sent|shared|filed|submitted|cleaned up|fixed|closed|pushed|merged|scheduled|booked|ordered|emailed|called|pinged|started|kicked off|set up|uploaded|posted|rewrote|refactored|tested|checked) (the|a|an|my|our|your|both|all) (.+?)(?:,\s*(.+?))?[.!]*$/i))) {
    const tail = m[4] ? genericClause(m[4]) : null;
    if (!m[4] || tail) return `I ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3]}${tail ? `, and ${tail.s}` : ""}.`;
  }
  // "Booking next week off to use my PTO" -> "I'm booking..."
  if ((m = t.match(/^(booking|taking|blocking|requesting|putting in for|using) (next|this|the|my|a|some|two|three|\d+) (.+?)[.!]*$/i)) && /\b(?:off|PTO|leave|vacation|day|days|week|afternoon|morning)\b/i.test(m[3])) return `I'm ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3]}.`;
  // "New hire starts Monday, desk ready?" and other fragment questions.
  if (/\?$/.test(t)) { const q = fragQuestion(t); if (q) return q; }
  return null;
}

// "Staging wiped, redeploying": a status fragment plus short follow-ups, built here so older rules don't half-fix it.
function frag12(t) {
  if (t.length > 90 || /[?]/.test(t) || /[.!]\s+\S/.test(t)) return null;
  const parts = t.replace(/[.!]+$/, "").split(/\s*,\s*/);
  if (parts.length < 2 || parts.length > 3) return null;
  if (PERSONAL_THING.test(parts[0])) return null;
  const first = genericClause(parts[0]);
  if (!first || first.kind !== "cause" || /^(?:I|I'm|I have)\b/.test(first.s)) return null;
  let out = first.s;
  for (const p of parts.slice(1)) {
    let g = genericClause(p);
    if (!g && /^[a-z]+ing(?: [\w' -]+)?$/i.test(p) && !/^(?:nothing|something|anything|everything|morning|evening|thing|king|ring|spring|string|wing|ceiling|building|meeting|ping|bring)$/i.test(p.split(" ")[0])) g = { s: `I'm ${p[0].toLowerCase()}${p.slice(1)}`, kind: "effect" };
    if (!g) return null;
    out += g.kind === "ask" ? `. ${cap1(g.s)}` : g.kind === "effect" || g.kind === "state" && /^I'm/.test(g.s) && !/^I'm (?:almost|nearly)\b/.test(g.s) ? `, so ${g.s}` : `, and ${g.s}`;
  }
  return cap1(capDays(out)) + ".";
}

export function round12(line) {
  const t0 = String(line ?? "").trim();
  if (!t0 || /\n/.test(t0)) return line;
  const t = idioms12(t0);
  const sar = sarcasm12(t);
  if (sar) return sar;
  const l = lines12(t);
  if (l) return l;
  const f = frag12(t);
  if (f) return f;
  return t;
}
