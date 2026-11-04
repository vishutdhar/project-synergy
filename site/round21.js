// Round 21 (Nov 4, 2026): fixes from the fresh57 read. Grief and illness stay sincere at every level, imperative
// "just" lines that are really news ("just found out ...") stay news, telegraphic fragments get a verb, greetings
// stay in front of the frame, and a few crude or blunt words that slipped through get work-safe wording.

// Grief, illness and medical news. No joke frames or closers on these, at any level.
export const SENSITIVE21 = /\b(?:funeral|passed away|bereavement|(?:mom|dad|mother|father|grandma|grandpa|grandmother|grandfather|nan|brother|sister|wife|husband|partner|son|daughter|uncle|aunt|cousin|friend|baby|kid|child) (?:passed|died)|passed (?:last night|this morning|yesterday|over the weekend|suddenly)|(?:in|at|to|into|from|left|admitted to) (?:the )?hospital|hospitali[sz]ed|surgery|emergency room|\bER\b|chemo\w*|cancer|diagnos\w*|miscarriage|memorial|grief|grieving|injur\w*|broke (?:my|his|her) (?:arm|leg|wrist|ankle|foot|hand)|in labou?r|went into labou?r|stillborn|hospice|palliative)\b/i;

export function isSensitive21(raw) {
  const s = String(raw ?? "");
  return SENSITIVE21.test(s) && !/\b(?:sick of|sick and tired|sick burn|sick demo|bug (?:is|was) (?:sick|fixed)|died down|server died|laptop died|battery died|phone died|deal died|project died|it died|idea died)\b/i.test(s);
}

// A plain, kind version for each level: L1 as is, L2 with a soft heads-up, L3 framed formally but sincerely.
export function sincere21(l1, lvl) {
  let t = String(l1 ?? "").trim();
  if (!t || lvl === 1) return t;
  t = t.replace(/^(?:Unfortunately|Just so you know|Just to let you know|Quick update|Just a quick update|It looks like|Heads-up|For visibility|I'm happy to share that|Happy to share that|I wanted to let you know that|Just a heads-up that|I wanted to flag that)[:,]?\s+/i, "");
  t = t[0].toUpperCase() + t.slice(1);
  const greet = t.match(/^((?:Hey|Hi|Hello) (?:team|all|everyone)|Morning all|Good morning)[.,!]\s*/i);
  if (greet) t = t.slice(greet[0].length);
  t = t[0].toUpperCase() + t.slice(1);
  const g = greet ? `${greet[1][0].toUpperCase()}${greet[1].slice(1)}, ` : "";
  const body = /[.!?]$/.test(t) ? t : `${t}.`;
  if (lvl === 2) return greet ? `${g}${body[0].toLowerCase() === body[0] ? body : body.replace(/^(?!I\b|I'm\b|I'll\b|I've\b|I'd\b)([A-Z])(?=[a-z]+ )/, (c) => c.toLowerCase())}` : `Just a heads-up for the team: ${body}`;
  return `${greet ? g.replace(/, $/, ". ") : ""}A personal update, shared in the interest of transparency: ${body}${/thank/i.test(body) ? "" : " I appreciate everyone's understanding and flexibility during this time."}`;
}

// Input shapes that came out ungrammatical (fresh57 read).
export function preclean21(raw) {
  let t = String(raw ?? "");
  if (/\n/.test(t) || t.length > 240) return t;
  // "just found out X" / "just heard back from X" is news about me, not "let's just".
  t = t.replace(/^just (found out|heard back|heard|learned|realized|noticed|got back|got word|got off|finished|signed|wrapped|saw)\b/i, (_m, v) => `I just ${v.toLowerCase()}`);
  // "we found the leak, patch going out tonight" -> "..., and the patch is going out tonight"
  t = t.replace(/,\s*(?:the )?(patch|fix|update|release|build|hotfix|email|invoice|newsletter|order|shipment) (going out|going live|shipping|landing|deploying) (tonight|today|tomorrow|this afternoon|this morning|on \w+day|\w+day)\b/i, (_m, n, v, d) => `, and the ${n.toLowerCase()} is ${v} ${d}`);
  // "offsite: venue booked, catering TBD" -> full sentence
  t = t.replace(/^([\w -]{2,25}): ([\w -]{2,20}?) (booked|confirmed|done|sorted|sent|signed|approved), ([\w -]{2,20}?) (TBD|pending|still open|in progress)[.!]*$/i, (_m, a, x, v, y, s) => `For the ${a.toLowerCase()}, the ${x.toLowerCase()} is ${v.toLowerCase()}, and the ${y.toLowerCase()} is ${/TBD/i.test(s) ? "still TBD" : "still " + s.toLowerCase().replace(/^still /, "")}.`);
  // "wow, can't wait for X" is sarcasm: not looking forward to it.
  t = t.replace(/^(?:wow|oh|yay|great|awesome|oh great|oh boy|ugh)[,!.]+\s+(?:I )?(?:can't wait|cannot wait) (for|to) (.+?)[.!]*$/i, (_m, p, x) => `I'm not thrilled about ${p.toLowerCase() === "to" ? "having to " + x : x}.`);
  // "I swear to god if X, I'm going to lose it" -> composed version
  t = t.replace(/^I swear(?: to (?:god|god|God))?,? if (.+?),? I(?:'m| am) (?:going to|gonna) lose it[.!]*$/i, (_m, x) => `If ${x}, I may lose my composure.`);
  // "sat there like an idiot for 20 min" -> "sat there alone for 20 min"
  t = t.replace(/\bsat (?:there )?like an? (?:idiot|fool|moron|clown|dummy|loser)\b/gi, "sat there alone").replace(/\blooking like an? (?:idiot|fool|moron|clown)\b/gi, "looking unprepared");
  // "doesn't know shit about" -> "doesn't know much about"
  t = t.replace(/\b(doesn't|don't|didn't|does not|do not) know (?:shit|jack|squat|crap|jack ?shit|a damn thing) about\b/gi, "$1 know much about");
  // "X is a scam" -> work-safe, meaning kept: it's unfair
  t = t.replace(/\b(is|are|seems|feels) (?:a |such a |a total |a complete )?(?:scam|ripoff|rip-off|con)\b/gi, (_m, v) => `${v} deeply unfair`);
  // "the sad sandwich" = the plain default
  t = t.replace(/\bthe sad (sandwich|salad|wrap|option|plate|meal)\b/gi, "the default $1");
  // "drop your order in the thread by 3" after a statement is a request to everyone
  t = t.replace(/,\s*(drop|put|add|post|leave) your (orders?|names?|votes?|questions?|ideas?|picks?|sizes?|availability) (in|on|into) the (thread|doc|sheet|channel|form|list)\b/i, (_m, v, o, p, d) => `, so please ${v.toLowerCase()} your ${o} ${p} the ${d}`);
  // Round 21b (fresh58 read): blunt idioms and fragments.
  t = t.replace(/\b(?:is|are) breathing down my neck\b/gi, (m) => `${/^are/i.test(m) ? "are" : "is"} following up with me closely and often`).replace(/\bbreathing down (?:my|our) necks?\b/gi, "following up closely and often");
  t = t.replace(/\b(is|are|was|were) (?:total |complete |absolute )?garbage(?= and )/gi, "$1 low quality");
  t = t.replace(/^whoever (wrote|built|made|designed) (this|that|the) ([\w -]{2,25}?) should be ashamed\b/i, (_m, v, d, x) => `whoever ${v} ${d} ${x} should revisit it carefully`);
  t = t.replace(/^((?:new hire |new )?[\w -]{2,25}?) (ordered|shipped|booked|requested|submitted), (?:it )?(arrives|lands|ships|starts|due) ([\w ]{2,20}?)[.!]*$/i, (_m, x, v, a, d) => `The ${x.toLowerCase()} has been ${v.toLowerCase()}, and it ${a.toLowerCase() === "due" ? "is due" : a.toLowerCase()} ${d}.`);
  t = t.replace(/^(?:the )?(quote|estimate|invoice|bid|proposal) (?:received|came in|is in|came back), (\$?[\d.,]+k?) over (budget|estimate|plan)[.!]*$/i, (_m, x, n, b) => `The ${x.toLowerCase()} came in, and it's ${n} over ${b.toLowerCase()}.`);
  t = t.replace(/^(?:the )?([\w -]{2,30}?) (resolved|fixed|approved|closed|merged|shipped), ([\w -]{2,25}?) (issued|sent|scheduled|filed|booked|processed)[.!]*$/i, (_m, a, v, b, w) => `The ${a.toLowerCase()} has been ${v.toLowerCase()}, and the ${b.toLowerCase()} has been ${w.toLowerCase()}.`);
  // "awesome, the printer is printing everything in pink now" is a complaint.
  t = t.replace(/^(?:awesome|amazing|brilliant|lovely|perfect|excellent)[,!]+\s+(?=(?:the|our|my|we|they)\b[^.]*\b(?:again|now|another|broke\w*|down|cancel\w*|crash\w*|stopped|wrong|late|missed|died|in pink|jammed)\b)/i, "Unfortunately, ");
  // "nothing makes me feel valued like X" is sarcasm: X doesn't.
  t = t.replace(/^nothing (?:makes me feel|says (?:I'm|we're|you're)) (?:so )?(valued|appreciated|seen|valued here) like (an? |the )?(.+?)[.!]*$/i, (_m, v, a, x) => `${(a ?? "A ").trim()[0].toUpperCase()}${(a ?? "a ").trim().slice(1)} ${x} doesn't really make me feel ${v.replace(/ here$/, "")}.`);
  // A trailing "where/when/why ... " clause without its question mark is still a question.
  if (!/\?/.test(t)) t = t.replace(/([,.]\s*)((?:where|when|why|how|what|who) (?:did|do|does|am|is|are|was|were|should|can|could|would|will) [^,.!?]{3,80}?)[.!]*$/i, (_m, sep, q) => `${sep}${q}?`);
  return t;
}

const FRAMEWORDS = /^(?:In|Leaning|Pursuant|Cascading|Circling|Flagging|Surfacing|Escalating|Bottom|Level-setting|Raising|Double-clicking|A|After|Practicing|Proactively|Transparently|Owning|Celebrating|Excited|Humbled|Thrilled|Not|Bringing|Seeking|Asking|For|Quick|Sharing|Looping|Heads-up|Just|Candidly)\b/;

// Output fixes after every level is built.
export function fix21(text, raw) {
  let t = String(text ?? "");
  const src = String(raw ?? "");
  // "The his feedback" -> "His feedback"
  t = t.replace(/\b([Tt])he (his|her|their|my|our|your) /g, (_m, c, p) => `${c === "T" ? p[0].toUpperCase() + p.slice(1) : p} `);
  // "our newest talent investment laptop" -> "the laptop for our newest talent investment"
  t = t.replace(/\b[Oo]ur newest talent investment (laptop|badge|desk|account|monitor|phone|equipment|setup)\b/g, (m0, x) => `${m0[0] === "O" ? "The" : "the"} ${x} for our newest talent investment`);
  // ", and The ETA is Friday" -> lowercase common words after a joining comma
  t = t.replace(/(, (?:and|so|but) )(The|A|An|It|This|That|Our|My|Its)\b/g, (_m, a, w) => `${a}${w.toLowerCase()}`);
  // "with this client. 'S last-minute changes" -> possessive kept
  t = t.replace(/\.\s+'S\b/g, "'s");
  // A name at the start of the input keeps its capital after a frame ("Quick question: marcus," -> "Marcus,")
  { const nm = src.match(/^([A-Z][a-z]{1,15}),/); if (nm) t = t.replace(new RegExp(`([:,] )${nm[1].toLowerCase()},`), `$1${nm[1]},`); }
  // "a thought partner who could from IT come take a look" -> "a thought partner from IT who could come take a look"
  t = t.replace(/\bwho could from (\w+) (come |join |help |take )/g, "from $1 who could $2");
  // "I'll be Out of office" mid-sentence
  t = t.replace(/\b(be|I'm|I am|We're|we're|we are|is|are) Out of office\b/g, "$1 out of office");
  // Greeting, then a frame with a capital: "Hey, In the spirit of" -> "Hey, in the spirit of"
  t = t.replace(/^((?:Hey|Hi|Hello)(?: team| all| everyone)?), ([A-Z][a-z-]+)/, (m0, g, w) => (FRAMEWORDS.test(w) ? `${g}, ${w.toLowerCase()}` : m0));
  // Frame before a greeting: "Quick heads-up: morning all! Reminder ..." -> "Morning all! Quick heads-up: reminder ..."
  { const m = t.match(/^([^:!?]{3,70}?)[:,] (morning all|good morning(?: all| team| everyone)?|hi all|hey all|hi team|hey team|hi everyone|hey everyone|morning team|hello all|hello everyone)([!,.])\s+(\S)/i); if (m && FRAMEWORDS.test(m[1])) { const g = m[2][0].toUpperCase() + m[2].slice(1); t = `${g}${m[3] === "!" ? "!" : ","} ${m[3] === "!" ? m[1] : m[1][0].toLowerCase() + m[1].slice(1)}: ${m[4].toLowerCase()}${t.slice(m.index + m[0].length)}`; t = t.replace(/^([^:]+): (i|i'm|i'll|i've|i'd)\b/, (x, a, b) => `${a}: ${b[0].toUpperCase()}${b.slice(1)}`); } }
  // "could have been an email, a learning I'm passionate about sharing and frankly" -> comma before the and
  t = t.replace(/(a learning I'm passionate about sharing) and\b/g, "$1, and");
  // "to move, a residential relocation initiative into the new place" -> keep the place with the move
  t = t.replace(/\bto move, (a residential relocation initiative) (into (?:the|my|our) new [\w]+|to [A-Z][a-z]+)\b/g, "to move $2, $1");
  // "Unfortunately, can't wait" / "Flagging that am" (sarcasm leftovers)
  t = t.replace(/\b(Unfortunately|Flagging that|Just so you know),? (am|can't wait|cannot wait) /g, (_m, a) => `${a}${a === "Flagging that" ? "" : ","} I'm not looking forward to `).replace(/\bI'm not looking forward to really looking forward to /g, "I'm not looking forward to ");
  // A statement after a question must not end with "?" ("is the offsite mandatory? I have a wedding that weekend?")
  if (/\?/.test(src) && !/\?\s*$/.test(src)) t = t.replace(/(\?\s+)((?!(?:Who|What|When|Where|Why|How|Which|Is|Are|Do|Does|Did|Can|Could|Would|Will|Should|Has|Have|Any)\b)[A-Z][^?.!]{2,120})\?/g, (m0, a, b) => (/(?:^|[:,]\s)(?:who|what|when|where|why|how|which|is|are|am|do|does|did|can|could|would|will|should|has|have|any)\b/i.test(b) ? m0 : `${a}${b}.`));
  return t;
}

// Full C-Suite body-level jokes that are general office shapes (fresh57 read: 74% of L3 lines were still a
// stock opener + the plain sentence + a stock closer). Appended to round 20's lexicon, so satire20 applies them
// with its meaning check, topic closers and grammar guards. Each keeps the subject, numbers and names.
import { LEX } from "./round20.js";
import { MILESTONES19 } from "./round19.js";
LEX.push(
  // Broken things.
  [/\b(?:is|are|has been|have been) (?:broken|down|out) (?:again )?since (\d{1,2}(?::\d\d)? ?(?:am|pm)?|this morning|yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|lunch)\b/i, (m) => `${/^(?:are|have)/i.test(m[0]) ? "have" : "has"} been in an unplanned maintenance window since ${m[1]}`, "tech", 2],
  [/^(dashboard|build|site|app|server|VPN|wifi|printer|staging|prod|login|checkout|portal|elevator) broken since (\d{1,2}(?::\d\d)? ?(?:am|pm)?|this morning|yesterday)\b/i, (m) => `the ${/^[A-Z]{2,}$/.test(m[1]) ? m[1] : m[1].toLowerCase()} has been in an unplanned maintenance window since ${m[2]}`, "tech", 2],
  [/\b(?:is|are) held together (?:with|by) duct tape and (?:prayers?|hope|luck|vibes)\b/i, (m) => `${/^are/i.test(m[0]) ? "are" : "is"} held together by a resilient patchwork of duct tape and optimism`, "tech", 2],
  [/\bit lost my (request|ticket|order|form|submission|file|application) (twice|three times|again)\b/i, (m) => `it lost my ${m[1]} ${m[2]}, a bold commitment to consistency`, "tech", 2],
  [/\b(?:is|are) (?:complete |total |utter )?nonsense\b/i, (m) => `${/^are/i.test(m[0]) ? "are" : "is"}, respectfully, more fiction than data`, "process", 2],
  [/\b(?:the|this|our) ([\w-]+ )?(system|tool|process|spreadsheet|tracker|portal|board|wiki|backlog) is a mess\b/i, (m) => `${m[0].split(" ")[0].toLowerCase()} ${m[1] ?? ""}${m[2]} is in a state of creative disorder`, "process", 2],
  // Nobody does the thing.
  [/\bnobody (reads|updates|uses|checks|answers|opens|follows|fills out|looks at) (the |our |my )?([\w -]{2,30}?)(?= and |[.,!]|$)/i, (m) => `${m[1].toLowerCase() === "reads" ? "reading" : m[1].toLowerCase() === "updates" ? "updating" : m[1].toLowerCase() === "uses" ? "using" : m[1].toLowerCase() === "checks" ? "checking" : m[1].toLowerCase() === "answers" ? "answering" : m[1].toLowerCase() === "opens" ? "opening" : m[1].toLowerCase() === "follows" ? "following" : m[1].toLowerCase() === "fills out" ? "filling out" : "looking at"} ${m[2] ?? ""}${m[3]} remains a stretch goal for the organization`, "docs", 2],
  [/\bnobody told me\b/i, () => "I was strategically excluded from the loop when", "people", 2],
  [/\bI was strategically excluded from the loop when (the|that|our|my)\b/i, (m) => `I was strategically excluded from the loop when ${m[1]}`, "people", 0],
  [/\b(?:they|leadership|management|HR|finance|IT) changed (the [\w -]{2,25}?) and didn't tell anyone\b/i, (m) => `${m[0].split(" ")[0]} changed ${m[1]} and opted for a surprise-first communication strategy`, "people", 2],
  [/\bwe keep getting blamed for\b/i, () => "we remain the preferred destination for blame on", "people", 2],
  [/\bI've been asking for ([\w -]{2,40}?) for (two|three|four|five|six|\d+|a few|several) (days|weeks|months)\b/i, (m) => `I've been in a patient holding pattern on ${m[1]} for ${m[2]} ${m[3]}`, "time", 2],
  [/\bevery single comma\b/i, () => "every single comma, a level of punctuation governance I respect from a distance", "process", 2],
  // Numbers going the wrong way.
  [/\bwe had (\d+) (outages|incidents|escalations|complaints|bugs|defects|sev1s|outages this quarter) ([\w ]{0,20}?)compared to (\d+) (last \w+|the year before|in Q\d)\b/i, (m) => `we had ${m[1]} ${m[2]} ${m[3]}compared to ${m[4]} ${m[5]}, the wrong kind of growth`, "tech", 2],
  [/\b(average [\w ]{2,25}?|[\w-]+ time) went from (\d+ (?:days?|hours?|minutes?|weeks?)) to (\d+ (?:days?|hours?|minutes?|weeks?))\b/i, (m) => `${m[1]} embarked on a bold journey from ${m[2]} to ${m[3]}`, "time", 2],
  [/\b(rating|score|NPS|conversion|retention|engagement|CSAT|traffic|revenue|margin) dropped from ([\d.%$]+) to ([\d.%$]+)\b/i, (m) => `${m[1]} has been right-sized from ${m[2]} to ${m[3]}`, "money", 2],
  [/\bwe burned through (\d+%) of (?:the |our )?([\w ]{2,25}?budget)( by \w+)?\b/i, (m) => `we front-loaded ${m[1]} of the ${m[2]}${m[3] ?? ""}, an aggressively ahead-of-schedule investment strategy`, "money", 2],
  [/\bwe're (\d+|two|three|four|five|six) (weeks|days|months) behind on\b/i, (m) => `we're ${m[1]} ${m[2]} into a non-linear timeline on`, "time", 2],
  [/\bthe deal fell through\b/i, () => "the deal has exited our pipeline to pursue other opportunities", "loss", 2],
  [/\b(\d+%) faster\b/i, (m) => `${m[1]} faster, a velocity story I intend to tell at every offsite`, "win", 2],
  [/\b(?:the )?root cause (?:is )?(?:still )?pending\b/i, () => "the root cause remains at large", "tech", 2],
  [/\bwhich is terrifying\b/i, () => "which is a concentration of risk I'd describe as character-building", "money", 2],
  [/\b(\d+) open roles and (\d+) recruiters\b/i, (m) => `${m[1]} open roles and ${m[2]} recruiters, an ambitious talent-to-recruiter ratio`, "process", 2],
);
MILESTONES19.push(
  [/\b(?:I'm |I am )?(?:officially )?a homeowner\b|\bclosed on (?:our|my) (?:first )?(?:house|home|condo|place)\b/i, "My personal real-estate portfolio has officially closed its first acquisition."],
  [/\bgot into the [\w -]{2,30}program\b/i, "My leadership journey has been formally green-lit."],
  [/\bgoing to be an? (?:aunt|uncle|grandma|grandpa|big sister|big brother)\b/i, "My family org chart is expanding ahead of plan."],
  [/\bfirst steps\b/i, "Our youngest stakeholder has reached a key mobility milestone."],
);
