// Round 14: general shapes from fresh42 (Oct 28).
// 1. Chat fragments with no verb ("migration paused", "invoice 4471 paid", "Priya out, Dev covering",
//    "keys at front desk", "2 approvals left", "late train, 20 min") become full sentences, part by part.
// 2. Sarcasm that praises something annoying ("love that we have three tools that do the same thing",
//    "really loving this open office", "so thrilled to be the fifth reviewer") becomes the real complaint.
// 3. Small grammar traps ("testing is complete", "sent", "QA signed off", "anyone watching the game tonight").

const cap1 = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const low1 = (s) => (s && !/^(?:I|I'm|I'll|I've|I'd)\b/.test(s) && !/^[A-Z]{2,}\b/.test(s) && !/^[A-Z][a-z]+(?:'s)? [A-Z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const capDays = (s) => s.replace(new RegExp(`\\b(${DAYS})\\b`, "gi"), (d) => d[0].toUpperCase() + d.slice(1).toLowerCase());

// Words that end a noun phrase in a fragment, and which verb they take.
const HAS_BEEN = "moved|skipped|uploaded|posted|sent|shipped|approved|rescheduled|merged|submitted|filed|deployed|paid|groomed|cancelled|canceled|signed|resolved|confirmed|released|published|updated|renewed|restored|refunded|archived|reverted|rolled back|escalated|reassigned|delivered|received|processed|completed|reviewed|tested|scheduled|pushed|postponed|requested";
const IS = "paused|down|green|red|final|ready|back|up|out|broken|blocked|closed|open|done|fixed|attached|booked|double booked|double-booked|delayed|stuck|full|empty|late|offline|online|on hold|in review|in progress|at risk|on track|over budget|under budget|frozen|missing";
const PART_RE = new RegExp(String.raw`^(.+?) ((?:${HAS_BEEN}|${IS}))(?: (again|already|now|today|tonight|tomorrow|this morning|this afternoon|for now|for good))?((?: (?:to|for|from|in|on|at|by|with|until|till|after|before|until|via) .+)?)$`, "i");
const ACTORS = /^(?:the )?(?:customer|client|vendor|supplier|legal|finance|HR|IT|QA|design|marketing|sales|security|ops|procurement|the board|board|boss|manager|CEO|CFO|CTO|team|someone|user|users|recruiter|partner|agency|[A-Z][a-z]+)$/;
const MASS = /^(?:login|sso|checkout|search|signup|sign-up|sign-in|billing|payroll|staging|prod|production|email|wifi|wi-fi|vpn|slack|jira|zoom|support|onboarding|pricing|ci|the build|build|parking|lunch|stand-up|standup|feedback|traffic)$/i;
const DET = /^(?:the|a|an|my|our|your|their|his|her|its|this|that|these|those|all|some|every|no|each|both|another)\b/i;
const VERBISH = /\b(?:is|are|was|were|am|be|been|has|have|had|do|does|did|will|would|can|could|should|must|may|might|i|we|you|he|she|they|it|it's|i'm|we're|there|let's|please|thanks|thank)\b|n't\b/i;

function np(raw) {
  let n = raw.trim().replace(/^all hands\b/i, "all-hands").replace(/\bfinal final\b/i, "final").replace(/\bstand up\b/i, "stand-up");
  if (DET.test(n) || /^[A-Z]{2,}\b/.test(n) || /^[A-Z][a-z]+$/.test(n) || /\b(?:v\d+|#?\d{2,}|\d+[A-Z])\b/i.test(n) || MASS.test(n)) return cap1(n);
  return `The ${n}`;
}
const plural = (n) => { const w = (n.match(/([a-z]+)\b(?:\s+v?\d+)?$/i) ?? [])[1] ?? ""; return /s$/i.test(w) && !/(?:ss|us|is|news)$/i.test(w) || /^(?:the )?(?:people|folks|staff)$/i.test(n); };
const fixRest = (r) => r.replace(/\bat front desk\b/i, "at the front desk");

const GERUND_ME = /^(working|heading|logging|taking|grabbing|joining|running|wrapping|finishing|starting|reviewing|testing|presenting|interviewing|driving|commuting|waiting|covering|traveling|travelling|flying|boarding|walking|stepping|jumping|hopping|sitting|eating|picking|dropping|looking|digging|on my way)\b/i;

function part14(p, prev) {
  const s = p.trim().replace(/[.!]+$/, "");
  let m;
  if (!s) return null;
  if ((m = s.match(/^late (train|bus|flight|subway|ferry|shuttle)$/i))) return { text: `My ${m[1].toLowerCase()} is late`, late: true };
  if ((m = s.match(/^(\d{1,3}) ?(?:min|mins|minutes?)(?: late| out| away)?$/i)) && prev?.late) return { text: `I'll be ${m[1]} minutes late`, join: "so" };
  if ((m = s.match(/^(camera|cam|mic|video) (off|on|muted)$/i))) return { text: `My ${m[1].toLowerCase().replace(/^cam$/, "camera")} is ${m[2].toLowerCase()}` };
  if ((m = s.match(/^(bad hair day|long day|rough night|big day|busy day|crazy day|slow day|rough morning|long week)$/i))) return { text: `it's a ${m[1].toLowerCase()}`, join: "because" };
  if (/^quiet please$/i.test(s)) return { text: "please keep the noise down", join: "so" };
  if ((m = s.match(/^((?:podcast |video |)recording|a call|call|interview|demo|exam|webinar) (at|from|until) (.+)$/i))) return { text: `There's a ${m[1].replace(/^a /i, "").toLowerCase()} ${m[2].toLowerCase()} ${m[3]}` };
  if ((m = s.match(/^ETA (.+)$/i))) return { text: `The ETA is ${capDays(m[1])}` };
  if ((m = s.match(new RegExp(String.raw`^(results|numbers|figures|feedback|decision|answer|update|details|draft|report|slides|notes|offer|contract|invoice|payment|approval) (tomorrow|today|tonight|next week|this week|by eod|by EOD|eod|monday|tuesday|wednesday|thursday|friday|(?:by|on) (?:${DAYS}|\d+(?::\d\d)? ?[ap]m))$`, "i")))) {
    const pl = /s$/i.test(m[1]) && !/^(?:details)$/.test("");
    const n = /^(?:feedback)$/i.test(m[1]) ? "Feedback" : `The ${m[1].toLowerCase()}`;
    return { text: `${n} ${pl ? "are" : "is"} coming ${capDays(m[2]).replace(/^eod$/i, "by EOD")}` };
  }
  if ((m = s.match(/^([A-Z][a-z]+) (out|off|sick|back|in|here|away|covering|driving|leading|presenting|on it|on call|on PTO|on leave|OOO)(?: (today|tomorrow|this week|next week|for (?:the|a) .+))?$/))) return { text: `${m[1]} is ${m[2].replace(/^OOO$/, "out of office")}${m[3] ? " " + m[3] : ""}`, actor: true };
  if ((m = s.match(/^(at capacity|swamped|slammed|underwater|booked solid|heads down|in meetings|on PTO|on leave|offline|online|around|free|available|busy|out|off|in)( (?:this|next|today|tomorrow|until|till|all|for).*)?$/i)) && !prev) return { text: `I'm ${m[1].toLowerCase()}${m[2] ?? ""}`, me: true };
  if ((m = s.match(/^(?:the )?(keys|key|badge|package|parcel|laptop|charger|mail|lunch|food|cake|pizza|donuts|bagels|leftovers|coffee) (at|in|on|by|near) (?:the )?(.+)$/i))) {
    const loc = /\d/.test(m[3]) || /^(?:my|your|our|his|her|their)\b/i.test(m[3]) ? m[3] : `the ${m[3]}`;
    return { text: `The ${m[1].toLowerCase()} ${/s$/i.test(m[1]) && !/^(?:lunch)$/i.test(m[1]) || /^(?:donuts|bagels|leftovers|keys)$/i.test(m[1]) ? "are" : "is"} ${m[2].toLowerCase()} ${loc}` };
  }
  if ((m = s.match(/^(\d+|one|two|three|four|five|a few|few|several) (.+?) (left|remaining|to go|pending|outstanding)$/i))) return { text: `There ${/^(?:1|one)$/i.test(m[1]) ? "is" : "are"} ${m[1]} ${m[2]} ${m[3].toLowerCase()}` };
  if (GERUND_ME.test(s) && !VERBISH.test(s) && s.split(" ").length <= 8) {
    const g = s.replace(/^joining call\b/i, "joining the call");
    return { text: `I'm ${g.toLowerCase().replace(/\b(${DAYS})\b/g, (d) => cap1(d))}`, me: true, join: prev ? "and" : undefined };
  }
  if ((m = s.match(PART_RE)) && !VERBISH.test(m[1]) && !/\b(?:me|him|her|us|them|all|nearly|almost|mostly|back|then|finally|keeps?|kept|never|only|just|also|still|went|came|got|ran|fell|rose|grew|showed|signed|blew|broke|took|gave|made|kept|sold|bought|left|turned|set|shut|picked|backed|logged|locked|checked|spoke|woke|stayed|stood)$|\w+ed$|'s$|\b(?:never|only)\b/i.test(m[1].trim()) && !/\b(?:me|him|her|us|them|all|nearly|almost|mostly|back|then|finally|keeps?|kept|got|gets)\b/i.test(m[1]) && m[1].split(" ").length <= 4 && !/^(?:just|still|already|not|never|also|maybe|probably|really)$/i.test(m[1]) && !/\b(?:and|or|but|so)\b/i.test(m[1])) {
    const head = m[1].trim(), part = m[2].toLowerCase().replace(/^double booked$/, "double-booked"), when = m[3] ? ` ${m[3]}` : "", rest = fixRest(m[4] ?? "");
    if (ACTORS.test(head) && /^(?:escalated|signed|approved|moved|confirmed|delivered|requested|pushed|cancelled|canceled|rejected|replied|paid|reviewed)$/.test(part)) {
      const n = np(head);
      return { text: `${n} ${plural(n) ? "have" : "has"} ${part}${part === "signed" && !/\boff\b/.test(rest) ? "" : ""}${when}${rest}`, actor: true };
    }
    const n = np(head), pl = plural(n);
    const hb = new RegExp(`^(?:${HAS_BEEN})$`).test(part) && !/^(?:scheduled|delayed)$/.test(part);
    return { text: `${n} ${hb ? (pl ? "have been" : "has been") : pl ? "are" : "is"} ${part}${when}${rest}` };
  }
  return null;
}

function fragments14(t) {
  const s = t.replace(/[.!]+$/, "").trim();
  if (!s || s.length > 90 || /[?;:]|\n/.test(s) || s.split(/\s+/).length > 12) return null;
  const parts = s.split(/,\s+/);
  if (parts.length > 3) return null;
  // Whole-line checks first.
  let m;
  if ((m = s.match(new RegExp(String.raw`^((?:${HAS_BEEN}|fixed|done))((?: (?:in|on|to|for|from|at|with|via) .+)?)$`, "i")))) {
    const v = m[1].toLowerCase();
    return v === "fixed" || v === "done" ? `It's ${v}${m[2]}.` : `It's been ${v}${m[2]}.`;
  }
  const out = [];
  let prev = null;
  for (const p of parts) {
    const r = part14(p, prev);
    if (!r) return null;
    out.push(r);
    prev = r;
  }
  let text = cap1(out[0].text);
  for (let i = 1; i < out.length; i++) {
    const j = out[i].join;
    text += j === "so" ? `, so ${out[i].text}` : j === "because" ? ` because ${out[i].text}` : `, and ${/^(?:The|There|It|It's|Feedback)\b/.test(out[i].text) ? low1(out[i].text) : out[i].text}`;
  }
  return `${text}.`;
}

// Sarcasm praising something plainly annoying.
const SARC_CUE = /\b(?:same thing|every single|every|still going|reply-all|cc'?d|copied on|open office|fifth|third|fourth|\d+(?:st|nd|rd|th)|during (?:lunch|my demo|the demo|the audit|deadline|the launch|my vacation)|on deadline day|titled|quick chat|four managers|three tools|redo|re-do|rebuild|rewrite|changed color|changed colour|an hour|\d+-minute|surprise|5 ?pm|nobody needs|never|requires a training|three different|another|again|broke|broken|down|crashed|mandatory|on call|over (?:the )?(?:weekend|holiday|thanksgiving|christmas)|unpaid|at midnight|\d+ (?:people|reviewers|approvals|managers))\b/i;
function sarcasm14(t) {
  const s = t.replace(/[.!]+$/, "").trim();
  let m;
  if (/\?$/.test(s)) {
    if ((m = s.match(/^who (?:doesn't|does not) (?:love|like|enjoy) (a|an|the) (.+?)\?$/i))) return `Nobody enjoys ${m[1].toLowerCase()} ${m[2]}.`;
    return null;
  }
  if ((m = s.match(/^(?:I )?(?:really |just |totally |absolutely |so )?(?:love|loving|adore) (?:that|how) (.+)$/i)) && SARC_CUE.test(m[1])) return `I'm frustrated that ${low1(m[1].replace(/\bjust /, ""))}.`;
  if ((m = s.match(/^(?:I'm |I am )?(?:really |just |so |totally )?(?:loving|enjoying) (this|the|my|our) (.+)$/i)) && SARC_CUE.test(m[2])) return `I'm not a fan of ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = s.match(/^(?:I'm |I am )?(?:so |really |super |just |truly )?(thrilled|excited) (?:(to|that|about|for) )?(.+)$/i)) && SARC_CUE.test(m[3]) && /^(?:so|really|super|just|truly)\b/i.test(s.replace(/^(?:I'm |I am )/i, ""))) {
    const conn = m[2] ? m[2].toLowerCase().replace(/^for$/, "about") : "that";
    return `I'm not ${m[1].toLowerCase()} ${conn} ${m[3]}.`;
  }
  if ((m = s.match(/^(?:it's )?(?:so )?nice to see (.+)$/i)) && SARC_CUE.test(m[1])) return `I'm not thrilled that ${m[1]}.`;
  if ((m = s.match(/^(?:I )?(?:really |truly |just )?appreciate being (cc'?d|copied|looped in|added|tagged|included|mentioned) on (every single|every|all) (.+)$/i))) return `I'd rather not be ${m[1]} on ${m[2]} ${m[3]}.`;
  if ((m = s.match(/^what a (?:surprise|shock|twist),? (.+)$/i))) return `Unsurprisingly, ${low1(m[1])}.`;
  if ((m = s.match(/^(?:oh |ah )?(?:perfect|wonderful|fantastic|awesome|great|amazing|lovely|excellent|brilliant|nice|super|cool),? (the|my|our|this) (.+)$/i)) && SARC_CUE.test(s)) {
    const body = `${m[1]} ${m[2]}`;
    if (/\b(?:is|are|was|were|has|have|had|requires?|wants?|needs?|logged|changed|moved|crashed|died|went|got|broke|ran|says|keeps|will|won't|can't|cannot|doesn't|don't|isn't|aren't|returns|logs|rejects)\b|\w+ed\b/i.test(m[2])) return `Unfortunately, ${low1(body)}.`;
    return `Unfortunately, there's ${body.replace(/^the /i, "a ")}.`;
  }
  if ((m = s.match(/^(?:I )?can'?t believe (.+?),? (?:dream come true|living the dream|what a dream|best day ever)$/i))) return `Unfortunately, ${low1(m[1])}.`;
  if ((m = s.match(/^(?:really |truly )?feeling the (?:synergy|love|alignment|teamwork) with (.+)$/i))) return `It's a lot to have ${low1(m[1])}.`;
  return null;
}

// Grammar traps.
function lines14(t) {
  const s = t.replace(/[.!]+$/, "").trim();
  let m;
  if ((m = s.match(/^(testing|onboarding|training|staffing|hiring|planning|budgeting|shipping|billing|the testing|the training) (is|was) (complete|completed|done|finished|over|on track|behind|blocked)$/i))) return `${cap1(m[1].toLowerCase())} ${m[2]} ${m[3]}.`;
  if ((m = s.match(/^(?:is )?(any ?one|any ?body|someone|somebody) (watching|going to|coming to|heading to|joining|free for|up for|around for|in for) (.+?)\??$/i)) && !/\b(?:could|can|would|will)\b/i.test(s)) return `Is ${m[1].toLowerCase().replace(/^any (one|body)$/, "any$1")} ${m[2].toLowerCase()} ${m[3]}?`;
  if ((m = s.match(/^just (landed|arrived|got in|got back|got here|woke up|got off (?:the|a) (?:call|plane|train|flight)),? (?:will|I'll|gonna) (.+)$/i))) return `I just ${m[1].toLowerCase()}, and I'll ${m[2]}.`;
  if ((m = s.match(/^(?:a )?(?:big |huge |massive )?(?:shout out|shout-out) to (.+?)(?: for (.+))?$/i)) || (m = s.match(/^(?:a )?(?:big |huge |massive )?(?:thanks|thank you) to (whoever .+?)(?: for (.+))?$/i))) return `I'm very grateful to ${m[1]}${m[2] ? ` for ${m[2]}` : ""}.`;
  if ((m = s.match(/^(.+?),? (fully|totally|completely) (offline|unplugged|unreachable|off the grid)$/i))) return `${cap1(m[1])}, and I'll be ${m[2].toLowerCase()} ${m[3].toLowerCase()}.`;
  if ((m = s.match(/^(QA|legal|finance|security|design|HR|IT|the client|the customer|the board|my manager|the CFO|the CEO|[A-Z][a-z]+) (signed off|approved|replied|pushed back|said yes|said no)(?: on (.+))?$/))) return `${cap1(m[1])} ${({ "signed off": "has given the sign-off", approved: "has given the approval", replied: "has sent a reply", "pushed back": "has raised objections", "said yes": "said yes", "said no": "said no" })[m[2]]}${m[3] ? ` on ${m[3]}` : ""}.`;
  if ((m = s.match(/^(?:I )?swear to god,? if (.+)$/i)) || (m = s.match(/^I swear,? if (.+)$/i))) return `I'll be really frustrated if ${m[1]}.`;
  if ((m = s.match(/^(?:I'll|I will) be damned if I (\w+) (.+)$/i))) return `I'm not willing to ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = s.match(/^what (?:kind|sort) of (?:a )?(?:shit ?show|clusterfuck|dumpster fire|mess|disaster|circus|joke) is (this|that|the|our) (.+)$/i))) return `${cap1(m[1].toLowerCase())} ${m[2].replace(/\?$/, "")} is a mess.`;
  if ((m = s.match(/^(?:fuck|screw|sod|bugger|to hell with) (mondays|monday|meetings|this week|this job|traffic|the commute|commuting|winter|deadlines|email|emails|slack|jira|zoom|timesheets|expense reports|performance reviews|surveys|this weather|the weather|this place)$/i))) return `I'm not a fan of ${m[1].toLowerCase().replace(/^monday$/, "Mondays").replace(/^mondays$/, "Mondays").replace(/^slack$/, "Slack").replace(/^jira$/, "Jira").replace(/^zoom$/, "Zoom")}.`;
  if ((m = s.match(/^that's a (?:dumb|stupid) ?-?ass (idea|plan|move|question|decision|call)$/i))) return `That's a bad ${m[1].toLowerCase()}.`;
  if ((m = s.match(/^(.+?) (?:is|are) (?:absolute |total |complete |pure )?dogshit$/i))) return `${cap1(m[1])} ${/s$/i.test(m[1]) ? "are" : "is"} really bad.`;
  if ((m = s.match(/^(the .+?) (?:hate|hates|have it in for|are out to get) (?:my ass|me)$/i))) return `${cap1(m[1])} ${/s$/i.test(m[1].split(" ").pop()) ? "are" : "is"} not on my side.`;
  if ((m = s.match(/^(.+?) (?:was|were) pulled out of (?:someone's|somebody's|his|her|their|thin|your|my) (?:ass|arse|butt)$/i))) return `${cap1(m[1])} ${/were/.test(s) ? "were" : "was"} made up.`;
  if ((m = s.match(/^(.+?) (tastes|taste|tasted|smells|smell|smelled) like (?:ass|shit|crap|garbage|trash|death|feet)$/i))) return `${cap1(m[1])} ${m[2]} awful.`;
  if ((m = s.match(/^I can'?t be (?:arsed|assed) (?:to )?(.+)$/i))) return `I can't find the motivation to ${m[1]}.`;
  if ((m = s.match(/^what kind of (?:shit ?show|shitshow|clusterfuck|dumpster fire|circus) is (this|that|the) (.+?)\??$/i))) return `${cap1(m[1].toLowerCase())} ${m[2]} is a mess.`;
  if ((m = s.match(/^(that|this|the) (?:bitch|beast|son of a bitch|pain in the ass) of an? (.+?) (took|ate|cost|eaten|killed) (.+)$/i))) return `${cap1(m[1].toLowerCase())} ${m[2]} was a nightmare and ${m[3].replace(/^killed$/, "used up").replace(/^ate$/, "took")} ${m[4]}.`;
  if ((m = s.match(/^(.+?) (?:is|are) (?:busting|breaking) (my|our|your|his|her|their) (?:balls|chops|ass) (over|about|on) (.+)$/i))) return `${cap1(m[1])} ${/s$/i.test(m[1].split(" ").pop()) && !/team$/.test(m[1]) ? "are" : "is"} giving ${({ my: "me", our: "us", your: "you", his: "him", her: "her", their: "them" })[m[2].toLowerCase()]} a hard time ${m[3].toLowerCase()} ${m[4]}.`;
  if ((m = s.match(/^(?:tell|ask) ([A-Z][a-z]+|him|her|them|the team|everyone) to (?:quit|stop) (?:screwing|fucking|messing|dicking|farting|goofing) around$/i))) return `Please ask ${m[1]} to stop messing around.`;
  if ((m = s.match(/^(.+?) (?:is|are) (?:a )?(?:badass|beast|boss|rockstar|ninja) at (.+)$/i))) return `${cap1(m[1])} ${/^(?:they|we|you)$/i.test(m[1]) ? "are" : "is"} really impressive at ${m[2]}.`;
  if ((m = s.match(/^(.+?) fucked (every|all|each|half|most of|all of|both) (.+)$/i))) return `${cap1(m[1])} broke ${m[2]} ${m[3]}.`;
  if ((m = s.match(/^sleep in$/i))) return "I'm going to sleep in.";
  return null;
}

// Mid-sentence capitals that the input had in lowercase ("out Today", "email Went") go back to lowercase.
const KEEP_CAP = new RegExp(`^(?:I|${DAYS}|january|february|march|april|may|june|july|august|september|october|november|december|christmas|thanksgiving|halloween|easter|new|eve)$`, "i");
const COMMON = /^(?:today|tomorrow|tonight|yesterday|went|go|goes|going|is|are|was|were|the|and|back|out|up|down|again|now|later|soon|here|there|then|this|that|it|we|you|they|he|she|my|our|your|their|to|for|from|with|in|on|at|by|of|off|not|no|yes|still|just|already|all|some|every|done|fixed|sent|late|early)$/;
export function fixCaps14(orig, out) {
  const lowerIn = new Set((String(orig).match(/\b[a-z][a-z']+\b/g) ?? []));
  const upperIn = new Set((String(orig).match(/\b[A-Z][a-z']+\b/g) ?? []).map((w) => w.toLowerCase()));
  return out.replace(/(?<=[a-z,;] )([A-Z][a-z']+)\b/g, (w) => {
    const l = w.toLowerCase();
    return lowerIn.has(l) && !upperIn.has(l) && !KEEP_CAP.test(l) && COMMON.test(l) ? l : w;
  });
}

// Runs first: grammar traps and crude shapes the older rules mangle.
export function round14(line) {
  const t0 = String(line ?? "").trim();
  if (!t0 || /\n/.test(t0)) return line;
  if (/[.!?]\s+\S/.test(t0)) return line;
  const t1 = t0.replace(/\bdouble booked\b/gi, "double-booked");
  const early = /^(?:the )?(?:customer|client|vendor|supplier|legal|finance|QA|the board|board|recruiter|landlord) (?:escalated|replied|signed off|approved|moved|confirmed|pushed back|cancelled|canceled|rejected|paid)\b(?:,|$)/i.test(t1) ? fragments14(t1) : null;
  return lines14(t1) ?? sarcasm14(t1) ?? early ?? t1;
}
// Runs last, and only when no older rule changed the line: fragments and praise-sarcasm.
const same = (a, b) => String(a).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === String(b).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export function round14late(before, after) {
  const t0 = String(before ?? "").trim();
  if (!t0 || /\n/.test(t0) || /[.!?]\s+\S/.test(t0) || !same(t0, after)) return after;
  return sarcasm14(t0) ?? fragments14(t0) ?? after;
}
