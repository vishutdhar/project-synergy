import { hasCrude } from "./profanity.js";

// Input pre-pass for Normal to corporate (see shortfalls/research.md).
// Runs on the cleaned input before the level rules, so every level starts from a sincere, well-formed message:
// 1. sarcasm becomes the sincere complaint underneath it ("great, another meeting" -> "I'm concerned about another meeting"),
// 2. run-on apologies become apology + reason + request sentences,
// 3. a dropped article on a bare singular subject comes back ("support queue is at 450" -> "The support queue is at 450").

const POS = "(?:I )?love that for us|(?:I )?love that for me|(?:I )?love this for us|great|awesome|wonderful|fantastic|brilliant|perfect|cool|nice|yay|lovely|amazing|super|excellent|classic|fun|sweet|wow|oh joy|oh good|oh cool|oh great|oh wonderful|oh perfect|oh nice|oh fun|joy";
const SARC_LEAD = new RegExp(`^(?:oh,? |ah,? |well,? )?(?:${POS})(?:[,.!:]+|\\s*-)\\s+(.+)$`, "i");
const NEG_CUE = /\b(?:died|dead|froze|frozen|stopped|missed|wrong|delayed|leaked|jammed|crashed|another|more|again|broke|broken|down|fail\w*|cancel\w*|ghost\w*|mandatory|nobody|no one|never|ate|lost|crash\w*|late|reorg|survey|paperwork|deadline|changed|instead|weekend|overtime|friday|saturday|sunday|\d+\s?(?:am|pm)|now (?:they|the|he|she)|wants?|found out|on (?:twitter|linkedin|the news|reddit)|from (?:the news|a reporter|twitter|linkedin|reddit)|the hard way|after the fact|layoffs?|laid off|out of date|outdated|always|stale|empty|broken|nobody)\b/i;
const IRREGULAR_PAST = { tell: "told", give: "gave", send: "sent", let: "let", make: "made", schedule: "scheduled", book: "booked", cancel: "cancelled", move: "moved", change: "changed", ask: "asked", add: "added", warn: "warned", invite: "invited", email: "emailed" };

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function lowFirst(s) {
  return /^(?:I|I'm|I've|I'll|I'd)\b/.test(s) || /^[A-Z]{2,}/.test(s) || /^[A-Z][a-z]+(?=\s)/.test(s) && /^(?:[A-Z][a-z]+)$/.test(s.split(/\s/)[0]) && !/^(?:The|A|An|This|That|These|Those|My|Our|Your|Their|His|Her|We|They|He|She|It|There|Now|Nobody|No|Prod|Another|More)\b/.test(s) ? s : s[0].toLowerCase() + s.slice(1);
}
const end = (s) => (/[.!?]$/.test(s) ? s : s + ".");
const strip = (s) => s.replace(/[.!?]+$/, "").trim();


// Round 4: common first names and tool names written in lowercase ("priya", "jira").
// Words that are also ordinary English (will, may, mark, bill, grace...) are left out on purpose.
const NAMES = new Set("aaron abby adam adrian ahmed aisha alex alexa alice amir amit amy ana andre andrea andrew andy angela anil anita ankit anna anne anthony anya arjun ashley ava ben beth bob brad brandon brian bruno carla carlos carmen chen chloe chris claire clara craig dan dana daniel dave david deepa derek diana diego dmitri emily emma eric erik ethan farah fatima felix fiona gabe gary george greg hana hannah hassan helen ian igor isaac jake james jamal jamie jane jason javier jeff jen jenny jess jessica jim joe john jon jonas jordan jose josh juan julia julie kai karen kate katie kayla keith kelly ken kenji kevin kim kyle lara laura lauren leah lena leo liam lily lin linda lisa liz lucas lucy luis luke maria marco marcus maria mario marta matt maya megan mei mia michael mike miguel mohammed nadia nathan neha nina noah nora olga oliver omar oscar paul pedro peter phil priya rachel rahul raj ravi rebecca ria robert ryan sam samir sara sarah scott sean sergei shreya simon sofia sophie steve sunil tara tom tomas tony olu jun kwame kofi ngozi chidi tunde femi aditi rohan sanjay anjali pooja deepak kiran arun hiroshi takeshi yusuf mehmet elif ines joao thiago camila valentina mateo santiago sven lars ingrid astrid freya niamh siobhan aoife connor declan nkechi rafael jorge mohamed hamza layla noor yara rania ivan pavel alexei natasha oksana xin ming jin hao priyanka nikhil sunita meera kenta haruto sakura dario luca giulia chiara tyler vanessa vikram vishut wei yuki zach zara zoe".split(" "));
const TOOLS = { jira: "Jira", jenkins: "Jenkins", api: "API", apis: "APIs", aws: "AWS", gcp: "GCP", ci: "CI", sql: "SQL", ui: "UI", ux: "UX", css: "CSS", html: "HTML", json: "JSON", url: "URL", crm: "CRM", sso: "SSO", okrs: "OKRs", okr: "OKR", kpi: "KPI", kpis: "KPIs", figma: "Figma", salesforce: "Salesforce", hubspot: "HubSpot", confluence: "Confluence", docker: "Docker", kubernetes: "Kubernetes", linux: "Linux", python: "Python", outlook: "Outlook", gmail: "Gmail", stripe: "Stripe", shopify: "Shopify", zendesk: "Zendesk", tableau: "Tableau", sap: "SAP", seo: "SEO", pdf: "PDF", csv: "CSV", qa: "QA", pr: "PR", prs: "PRs", pto: "PTO", vp: "VP", vps: "VPs", svp: "SVP", evp: "EVP", eta: "ETA", eod: "EOD", hr: "HR", ceo: "CEO", cfo: "CFO", cto: "CTO", coo: "COO", sla: "SLA", slas: "SLAs", roi: "ROI", faq: "FAQ", mvp: "MVP", nda: "NDA", ndas: "NDAs", saas: "SaaS", ssh: "SSH", gpu: "GPU", cpu: "CPU", ssd: "SSD", ac: "AC", hvac: "HVAC", safari: "Safari", firefox: "Firefox", gitlab: "GitLab", asana: "Asana", trello: "Trello", airtable: "Airtable", datadog: "Datadog", pagerduty: "PagerDuty", grafana: "Grafana", iphone: "iPhone", ipad: "iPad", macos: "macOS", thanksgiving: "Thanksgiving", christmas: "Christmas", easter: "Easter", halloween: "Halloween", hanukkah: "Hanukkah", diwali: "Diwali", ramadan: "Ramadan", juneteenth: "Juneteenth", tv: "TV", tvs: "TVs", ok: "OK", tbd: "TBD", tba: "TBA" };
const COMMON_SLOT = /^(?:everyone|everybody|someone|somebody|anyone|anybody|nobody|them|him|her|his|hers|you|your|yours|me|us|our|ours|it|its|this|that|these|those|the|their|there|here|team|teams|legal|finance|sales|marketing|support|security|design|ops|engineering|product|leadership|management|devops|data|analytics|procurement|facilities|payroll|accounting|billing|recruiting|around|questions|question|people|folks|guys|customers|customer|clients|client|users|user|vendors|vendor|partners|partner|manager|managers|boss|lead|leads|admin|admins|devs|engineers|reviewers|recruiter|office|again|too|also|please|later|now|today|tomorrow|back|more|help|ahead|all|both|each|other|others|staff|yourself|myself|who|what|why|how|when|where|which|whether|about|for|and|but|then|than|everything|anything|something|nothing|whoever|first|before|after|soon|why|any|some|every|one|two|three|few|many|much|well|thanks|thank|great|good|nice|working|work|being|sure|not|now|out|over|up|down|off|with|without|into|onto|away|instead|directly|quickly|politely|nicely|again|once|twice|regularly|fast|hard|kindly|security|it|interns|intern|hiring|qa|infra|platform|backend|frontend|mobile|web|ios|android|board|investors|investor|press|media|god|dad|mom|mum|family|friends|friend|neighbors|alexa|siri|chatgpt|google|everyone's|monday|tuesday|wednesday|thursday|friday|saturday|sunday|ops|crew|squad|group|panel|committee|council|union|it's|i'm|i've|i'd|i'll|we|they|he|she|i|my|tickets|ticket|issues|issue|bugs|bug|cookies|coffee|lunch|dinner|pizza|snacks|drinks|cake|food|water|rain|traffic|weather|money|time|budget|scope|quality|speed|process|plan|feedback|input|review|approval|access|permission|context|details|detail|info|information|notes|docs|doc|deck|slides|files|file|link|links|code|data|numbers|metrics|status|update|updates|news|progress|leave|days|day|hours|week|weeks|month|months|year|years|ages|while|bit|lot|ton|lots|tons|sales|vacation|holiday|holidays|anymore|yet|already|still|either|neither|tonight|asap|anyway|anyways|eventually|personally|separately|offline|live|later|right|exactly|honestly|frankly|seriously|literally|basically|actually|really|truly|maybe|perhaps|probably|definitely|everywhere|somewhere|nowhere|online|internally|externally|upstairs|downstairs|home|together|alone|first|last|next|asap|properly|correctly|nicely|clearly)$/;
export const isKnownName = (w) => NAMES.has(String(w).toLowerCase()) || Boolean(TOOLS[String(w).toLowerCase()]);
export function fixNamesAndTools(t) {
  t = t.replace(/\b(january|february|april|june|july|august|september|october|november|december)\b/g, (w) => w[0].toUpperCase() + w.slice(1))
    .replace(/\b(labor|memorial|presidents|veterans|independence|columbus|boxing|new year's) day\b/g, (m) => m.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/'S\b/, "'s"))
    .replace(/\b(\d+) ?(gb|mb|tb|kb)\b/g, (_m, n, u) => `${n}${u.toUpperCase()}`)
    .replace(/\b(for|in|by|since|until|of|from|on|through|end of|early|late|mid) (march|may)\b/g, (_m, p, w) => `${p} ${w[0].toUpperCase()}${w.slice(1)}`)
    .replace(/\b(march|may) (?=\d{1,2}(?:st|nd|rd|th)?\b)/g, (w) => w[0].toUpperCase() + w.slice(1));
  // Round 6 (fresh8): a lowercase word in a slot that only takes a person or company
  // ("thanks to bilal for", "loop in zainab", "ask acme for", "Kwame and liu") is a name.
  const cap = (w) => (COMMON_SLOT.test(w) ? w : w[0].toUpperCase() + w.slice(1));
  t = t
    .replace(/\b(thanks to|thank you to|thank-you to|kudos to|shout-?out to|props to|loop in|looping in|cc|ping|ask|tell|email|message|dm|cover for) ([a-z]{3,12})(?=( (?:for|on|about|if|to|and|when|whether|the|again)\b|[,.!?]|$))/g, (m, v, w, after) => (!after && /^(?:tell|email|message|dm|ask)$/.test(v) ? m : `${v} ${cap(w)}`))
    .replace(/\b([a-z]{3,10}) and ([a-z]{3,10})\b/g, (m, a, b) => (NAMES.has(a) && !COMMON_SLOT.test(b) ? `${a} and ${cap(b)}` : NAMES.has(b) && !COMMON_SLOT.test(a) && !/^(?:me|him|her)$/.test(a) ? `${cap(a)} and ${b}` : m));
  return t.replace(/\b[a-z][a-z']*\b/g, (w, i, str) => {
    if (NAMES.has(w)) return w[0].toUpperCase() + w.slice(1);
    const poss = w.match(/^([a-z]+)'s$/);
    if (poss && NAMES.has(poss[1])) return w[0].toUpperCase() + w.slice(1);
    // "ci" and "ui" only as standalone words, never inside paths or code.
    if (TOOLS[w] && !/[\/.@_]$/.test(str.slice(0, i)) && !/^[\/.@_]\w/.test(str.slice(i + w.length))) return TOOLS[w];
    return w;
  });
}
const ing = (v) => (/ee$/.test(v) ? v + "ing" : /ie$/.test(v) ? v.slice(0, -2) + "ying" : /[^aeiou]e$/.test(v) ? v.slice(0, -1) + "ing" : v + "ing");

// Round 4: a second clause glued on with no punctuation ("sorry for the delay been slammed",
// "wrong channel ignore that", "upgraded Node to 22 everything still works").
const GLUE = /\s(?=(?:been (?:slammed|busy|swamped|buried|underwater|sick|out|offline|traveling|travelling|heads-down)\b|ignore (?:that|this|it|the last one|my last)\b|please ignore\b|here'?s\b|heres\b|here is\b|everything (?:still )?(?:works|is|looks|seems|went)\b|nothing (?:to|else to) (?:discuss|report|share|cover|add)\b|took (?:forever|ages|all day|all week|all morning|hours|days)\b|check (?:your|my) (?:email|inbox|messages|DMs|dms|texts)\b|no (?:issues|problems|errors|downtime)\b|nothing (?:new|else|urgent)\b|(?:(?:the|my|our) )?(?:train|bus|flight|traffic|car|ride|uber|subway|tram) (?:is|was|got|has been|broke|died|[a-z]+ed)\b))/i;
export function splitGlued(sentence) {
  const s = strip(sentence);
  if (/[.!?;]\s/.test(s) || s.split(/\s+/).length < 4) return null;
  const m = GLUE.exec(s);
  if (/^(?:sorry|oops|my bad),? wrong\b/i.test(s)) return null;
  if (!m || m.index < 6 || /\b(?:there's|there is|I've|I have|here's|so|and|but|then|or|just|to|please|because|since|as)$/i.test(s.slice(0, m.index))) return null;
  const left = s.slice(0, m.index).replace(/,$/, "").trim();
  let right = s.slice(m.index + 1).trim();
  // Round 7: "the AC in here is broken", "the parking situation here is a nightmare": "here" belongs to the
  // subject. Only split before "here's" when the left side is a full clause or a greeting/apology/thanks.
  if (/^here(?:'?s| is)\b/i.test(right) && (/\b(?:in|out|over|around|up|down|from|back|near|right)$/i.test(left) || !/^(?:sorry|apologies|thanks|thank you|hi|hey|hello|ok|okay|done|update|fyi|as promised|per your request)\b/i.test(left) && !/\b(?:is|was|are|were|am|has|had|have|got|did|do|does|can|could|will|would|should|need|needs|want|wants|sent|made|took|fixed|updated|finished|attached)\b|'(?:m|s|re|ll|ve|d)\b|n't\b|\b[a-z]{3,}ed\b/i.test(left))) return null;
  right = right
    .replace(/^been\b/i, "I've been")
    .replace(/^(?:please )?ignore\b/i, "Please ignore")
    .replace(/^here'?s\b|^heres\b/i, "Here's")
    .replace(/^(train|bus|flight|car|ride|uber|subway|tram|traffic)\b/i, (w) => (/^traffic$/i.test(w) ? "traffic" : `my ${w.toLowerCase()}`))
    .replace(/^nothing (else )?to\b/i, (_m, e) => `There's nothing ${e ?? ""}to`)
    .replace(/^took (?:forever|ages)\b/i, "It took a long time").replace(/^took (all day|all week|all morning|hours|days)\b/i, "It took $1")
    .replace(/^check\b/i, "Please check").replace(/^no (issues|problems|errors|downtime)\b(?=.*\b(?:so far|yet|since)\b)/i, "There have been no $1").replace(/^no (issues|problems|errors|downtime)\b/i, "There were no $1").replace(/^nothing (new|else|urgent)\b/i, "There's nothing $1");
  return `${end(left)} ${end(cap(right))}`;
}

/** Sarcasm -> sincere meaning. Returns the rewritten sentence or null. */
export function desarcasm(sentence) {
  const s = strip(sentence);
  let m;
  if (/^love that for (?:us|me|you)$/i.test(s)) return "That's not ideal for us.";
  // Round 8: "love getting meeting invites at 6pm on a friday" is a complaint about the timing.
  if ((m = s.match(/^(?:I )?(?:just |really |totally |absolutely |sure do )?(?:love|adore|enjoy) (getting|having|being|doing|working|receiving|answering|joining|sitting through|fixing|reading) (.+\b(?:through lunch|every (?:single )?(?:day|night|weekend)|overtime|unpaid|for free|(?:[5-9]|1[01]) ?pm|(?:[4-6]|5:30) ?am|midnight|friday (?:night|evening|afternoon)|on a (?:friday|saturday|sunday)|on (?:the )?weekends?|on (?:a |my )?(?:saturday|sunday|day off|vacation|PTO|holiday)|last[- ]minute|at the last minute|after hours|again)\b.*)$/i))) return `I'm not thrilled about ${m[1].toLowerCase()} ${m[2]}.`;
  // Round 8: "wow, a pizza party instead of raises, thanks": the tail "thanks" is part of the sarcasm.
  if ((m = s.match(/^(.+?),?\s+(?:thanks|thank you|thx|cheers)(?: (?:a lot|so much|guys|team|everyone))?$/i)) && /^(?:wow|oh|gee|great|cool|awesome|amazing|fantastic|lovely|nice|perfect|oh great|oh good|yay)\b/i.test(m[1])) {
    const inner = desarcasm(m[1]);
    if (inner) return inner;
  }
  // Round 4 sarcasm forms.
  if ((m = s.match(/^(?:I )?(?:just )?(?:love|adore) (?:how|that(?! for\b)|it when) (.+)$/i)) && NEG_CUE.test(m[1])) return `I'm frustrated that ${lowFirst(m[1])}.`;
  if ((m = s.match(/^(?:oh,? )?(?:cool|great|nice|awesome|perfect|ok|okay|wonderful|fantastic|lovely),? so (now )?(we're|they're|you're|he's|she's|I'm|we are|they are) (?:now )?(?:just )?(.+)$/i))) return `It seems ${m[2]} ${m[1] ? "now " : ""}${m[3]}.`;
  if ((m = s.match(/^(?:wow,? |oh,? )?(?:super|so|very|really|soo+) helpful,? (?:thanks|thank you|thx)$/i))) return "That didn't really help.";
  if ((m = s.match(/^guess who (forgot|lost|broke|missed|left|spilled|dropped|deleted) (?:the |my )?(.+)$/i))) return `I ${m[1].toLowerCase()} ${/^(?:charger|laptop|badge|keys|lunch|notes|headphones|phone|wallet|umbrella|password)\b/i.test(m[2]) ? "my" : "the"} ${m[2]}.`;
  if ((m = s.match(/^(?:thanks|thank you)(?: (?:a lot|so much))? for the (\d+\s?(?:am|pm)(?: on)?(?: a)? (?:friday|saturday|sunday)|(?:friday|saturday|sunday)(?: night| evening)?|last[- ]minute|weekend) (request|ask|email|meeting|invite|task|change)$/i))) return `A ${m[1]} ${m[2]} is hard to fit in.`;
  if ((m = s.match(/^(?:sorry|oops|my bad)(?:,? sorry)?,? wrong (channel|chat|thread|person|window|room|link|file)$/i))) return `Sorry, that was meant for a different ${m[1]}.`;
  if (/^(?:perfect|great) timing(?: as usual| again)?$/i.test(s)) return "The timing isn't ideal.";
  if ((m = s.match(/^(?:cool,? )+(?:I )?guess I'll (?:just )?(.+?)(?: myself)?$/i)) || (m = s.match(/^(?:cool cool cool|cool cool|great|fine),? (?:I )?guess I'll (?:just )?(.+?)(?: myself)?$/i))) {
    const v = m[1].replace(/^do it$/i, "take care of it");
    return `Understood. I'll ${v} myself.`;
  }
  if ((m = s.match(/^(?:I )?can't wait for (?:the |a |an )?(.+)$/i))) return `I'm not thrilled about the ${m[1]}.`;
  if ((m = s.match(/^nothing says (?:teamwork|team spirit|culture|work-life balance|fun) like (?:a |an |the )?(.+)$/i))) return `I'm not thrilled about a ${m[1]}.`;
  if ((m = s.match(/^sure,? (?:I'll|I will) just (.+?)(?:,? (?:no problem|no worries|fine|sure|great|then|easy))*$/i))) return `I'm not happy about having to ${m[1]}.`;
  if ((m = s.match(/^(?:(?:sure|yeah|yes|yep|great|ok|okay|cool)[,!]? )?let'?s (?:just )?(.+?)[,.]? what could (?:possibly )?go wrong\??$/i))) return `I'm concerned about the risk if we ${m[1]}.`;
  // Round 7: "sure, let's add five more features two days before launch" is a worry, not a plan.
  if ((m = s.match(/^(?:oh,? )?(?:sure|yeah|yes|yep|great|ok|okay|cool|perfect|awesome|fantastic|brilliant|sounds good|totally|right),? (?:let'?s|we should|why don't we) (?:just )?([a-z]+) (.*?\b(?:(?:\w+ )?(?:days?|hours?|minutes?|weeks?) before|right before|the (?:day|night|week) before|at the last minute|last[- ]minute|on a friday|at \d+\s?(?:am|pm)|over the weekend|this weekend|during the freeze|in the middle of)\b.*)$/i)) && !/^(?:do|meet|talk|sync|chat|grab|celebrate)$/i.test(m[1])) return `I'm concerned about ${ing(m[1].toLowerCase())} ${m[2]}.`;
  // "sure, let's add another approval step, that'll speed things up" means it won't.
  if ((m = s.match(/^(?:oh,? )?(?:(?:sure|yeah|yes|yep|great|ok|okay|cool|perfect|awesome|brilliant|right)[,!]? )?(?:let'?s|we should) (?:just )?([a-z]+) (.+?),? (?:that'?ll|that will|that'?s going to|this will|because that'?ll) (?:totally |definitely |really |surely |certainly |obviously )?(.+)$/i)) && /^(?:help|fix|speed|solve|make|improve|work|go|boost|save|sort|end|calm|cheer)/i.test(m[3])) return `I don't think ${ing(m[1].toLowerCase())} ${m[2]} will ${m[3]}.`;
  // Round 6 sarcasm forms.
  if ((m = s.match(/^(?:wow,? |gee,? |oh,? )?(?:thanks|thank you) (?:so much |a lot )?for the (heads[- ]?up|notice|warning|invite|update|reminder) (\d+ (?:minutes?|mins?|hours?|hrs?|seconds?)|an hour|a day|a minute) before (?:the )?(.+)$/i))) return `I only got the ${m[1].toLowerCase().replace(/^heads[- ]?up$/, "heads-up")} ${m[2]} before the ${m[3]}.`;
  if ((m = s.match(/^(?:how )?nice of (legal|finance|sales|marketing|engineering|security|procurement|IT|HR|ops|management|leadership|the (?:vendor|client|customer|team|board|agency|contractor)) to finally (\w+)(?: (.+))?$/i))) {
    const v = IRREGULAR_PAST[m[2].toLowerCase()] ?? m[2].replace(/y$/, "ie").replace(/e?$/, "ed");
    return `${cap(m[1])} only ${v}${m[3] ? " " + m[3] : ""}.`;
  }
  if ((m = s.match(/^(?:yeah|yes|sure|right|oh yeah|ah yes),? because (another|more|one more|a new|a|an) (.+?) (?:will|is going to|are going to) (?:totally |definitely |really |surely |obviously |for sure |absolutely )?(fix|solve|help|change|sort out) (.+)$/i))) return `I don't think ${m[1].toLowerCase()} ${m[2]} will ${m[3].toLowerCase()} ${m[4]}.`;
  if ((m = s.match(/^(?:(?:cool|great|awesome|perfect|fantastic|wonderful|nice|super|lovely)[,!.]? ?){1,3}so (?:now )?(.+)$/i)) && NEG_CUE.test(m[1]) && !/^(?:we're|they're|you're|he's|she's|I'm|we are|they are)\b/i.test(m[1])) return `Unfortunately, ${lowFirst(m[1])}.`;
  if ((m = s.match(/^just what I needed,? (.+)$/i))) return `I have ${m[1].replace(/^(?:a|an|the) /i, (a) => a.toLowerCase())}, which isn't ideal.`;
  if ((m = s.match(/^(?:how )?nice of (them|him|her|you|leadership|management|IT|HR) to (\w+) (.+)$/i))) {
    const who = /^(?:them|him|her|you)$/i.test(m[1]) ? { them: "they", him: "he", her: "she", you: "you" }[m[1].toLowerCase()] : m[1];
    const v = IRREGULAR_PAST[m[2].toLowerCase()] ?? m[2].replace(/e?$/, "ed");
    return `Unfortunately, ${who} only ${v} ${m[3]}.`;
  }
  if ((m = s.match(/^(?:thanks|thank you) (?:a lot|so much) for (?:the |a |an )?(.+?\b(?:friday|saturday|sunday|weekend|\d+\s?(?:am|pm)|late|last[- ]minute)\b.*)$/i))) return `I'm not thrilled about the ${m[1]}.`;
  if ((m = s.match(/^so glad (we|they|I) (.+\b(?:nobody|no one|never|nothing|wasted)\b.*)$/i))) return `Unfortunately, ${m[1] === "I" ? "I" : m[1]} ${m[2]}.`;
  if ((m = s.match(/^(?:wow,? |oh,? )?(.+?),? (?:what a miracle|for once|shocking|who knew|imagine that)$/i))) return `${cap(m[1])}.`;
  if ((m = s.match(SARC_LEAD))) {
    let rest = m[1].trim();
    if (/^(?:thanks|thank|that works|sounds|see you|I'll|let's|we can|you|nice|great|good|job|work|news|idea|point|question|catch|call|team)\b/i.test(rest)) return null;
    if (!NEG_CUE.test(rest)) return null;
    rest = rest.replace(/^just /i, "").replace(/^now,? (the|they|he|she|we) (\w+) (\w+)/i, (_m, a, b, c) => (a.toLowerCase() === "the" ? `the ${b} now ${c}` : `${a} now ${b} ${c}`));
    const am = rest.match(/^(?:another|more|yet another) (.+)$/i);
    if (am) return `I'm concerned about ${/^more\b/i.test(rest) ? "the extra" : "yet another"} ${am[1]}.`;
    // A clause (has a verb) is a complaint; a bare noun phrase is something they're not keen on.
    if (/^(?:nobody|no one)\b/i.test(rest)) return `It looks like ${rest}.`;
    if (/'s (?:broken|down|dead|out|late|gone|stuck|jammed|empty|full|offline|cancel\w*)\b/i.test(rest) || /\b(?:is|are|was|were|has|have|had|got|went|moved|changed|broke|failed|cancel\w*|ghosted|ate|lost|crashed|wants?|needs?|read|said|did|didn't|won't|can't|doesn't|isn't|aren't|keeps?|missed|forgot|left|added|dropped|pushed|shipped|took|died|stopped|deleted|[a-z]{3,}ed)\b/i.test(rest)) {
      return `Unfortunately, ${lowFirst(rest)}.`;
    }
    return `I'm not thrilled about the ${rest.replace(/^(?:the|a|an) /i, "")}.`;
  }
  return null;
}

// Apology run-on: "sorry I'm late traffic was awful can you send me the notes".
const APOLOGY = /^(?:so |very |really )?(?:sorry|apologies|my bad|my apologies|oops)\b/i;
// First clause start after position 0 (the lookbehind needs the full string, so no slicing).
const nextClause = (str) => {
  const re = new RegExp(CLAUSE_START.source, "gi");
  let m;
  while ((m = re.exec(str))) { if (m.index > 0) return m.index; re.lastIndex = m.index + 1; }
  return -1;
};
const CLAUSE_START = /(?<!\b(?:I'm|am|are|we're|is|was|I|in|on|at|of|the|my|a|an|to|for|because|since|cause|as))\s(?=(?:traffic\b|(?:the|my) (?:train|bus|traffic|wifi|internet|kid|son|daughter|car|flight|laptop|power)\b|I was\b|I'm\b|I am\b|I got\b|I overslept\b|I forgot\b|I didn't\b|I did not\b|I missed\b|I'll\b|I will\b|something\b|can you\b|could you\b|can we\b|could we\b|can I\b|could I\b|please\b|what do you\b|should be\b|it's\b|it was\b|was out\b|we need\b|kid\b|but\b|was (?:driving|in a|on a|on the|at the|at a|busy|sick|stuck|asleep|away|offline|travel\w*|out)\b|(?:the|my|our|this|that) [\w-]+ (?:is|was|are|were|has|had|didn't|isn't|wasn't|got|ran|went|took|broke|died|crashed|started|ended)\b|here's\b|here is\b|(?:restoring|fixing|working on|looking into|rolling back|reverting|redoing|resending|updating|sending|on it)\b|it should\b|it says\b|that should\b|did you\b|do you\b|have you\b|are you\b|is it\b|is there\b))/i;
export function splitApology(sentence) {
  const s = strip(sentence);
  if (!APOLOGY.test(s) || /[.!?]\s/.test(s)) return null;
  const words = s.split(/\s+/).length;
  if (words < 5) return null;
  // Split at clause starts after the apology head.
  const head = s.match(/^(?:so |very |really )?(?:sorry|apologies|my bad|my apologies|oops)(?: sorry)?(?: (?:for|about) (?:the |my |a |being )?[\w'-]+(?: (?!I\b)[\w'-]+)?(?= I\b| I'm\b| was\b| can\b| could\b| what\b| but\b|,|$)| to (?:be a pain|bother you|interrupt|bug you|nag)(?: again)?(?= but\b|,|$| did\b| do\b| have\b| can\b| could\b| are\b| is\b))?/i)?.[0] ?? "";
  let rest = s.slice(head.length).replace(/^,?\s*/, "");
  let apology = head.trim().replace(/,$/, "");
  const cm = s.match(/^((?:so |very |really )?(?:sorry|apologies|my bad|my apologies) (?:for|about) [^,]{3,60}),\s*(.+)$/i);
  if (cm) { apology = cm[1]; rest = cm[2]; }
  rest = rest.replace(/^(?:but|and|so),?\s+/i, "");
  // "sorry for the typo in the email it should say ..." -> the apology runs up to the next clause.
  if (/^(?:for|about)\s/i.test(rest) && !cm) {
    const k = nextClause(rest);
    if (k > 0) { apology = `${apology} ${rest.slice(0, k).trim()}`; rest = rest.slice(k + 1); }
  }
  if (!rest) return null;
  const parts = [];
  let cur = rest;
  for (let guard = 0; guard < 4; guard++) {
    const idx = nextClause(cur);
    if (idx < 0) break;
    parts.push(cur.slice(0, idx).trim());
    cur = cur.slice(idx + 1);
  }
  parts.push(cur.trim());
  // A piece with no verb ("the train", "what") belongs to the next piece.
  const VERB = /\b(?:is|was|are|were|am|has|had|have|got|get|did|do|does|can|could|will|would|should|need|needs|want|wants|see|say|says|think|know|missed|forgot|overslept|deleted|broke|sent|lost|left|made|took|ran)\b|'(?:m|s|re|ll|ve|d)\b|n't\b|\b[a-z]{3,}ed\b|\b[a-z]{3,}ing\b/i;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!VERB.test(parts[i])) { parts.splice(i, 2, `${parts[i]} ${parts[i + 1]}`); i--; }
  }
  const clauses = parts.map((p) => p.replace(/^(?:but|and|so),?\s+/i, "").replace(/,$/, "").replace(/^(?:was|got|am|missed|forgot|overslept|misread) /i, "I $&").replace(/^should be /i, "It should be ").replace(/^(?:restoring|fixing|working on|looking into|rolling back|reverting|redoing|resending|updating|sending) /i, (m) => `I'm ${m.toLowerCase()}`).replace(/^on it\b/i, "I'm on it")).filter((p) => p && !/^(?:but|and|so)$/i.test(p));
  if (!clauses.length) return null;
  if (clauses.length === 1 && !/^I\b|^I'/.test(clauses[0]) && !/\b(?:for|about|to)\b/i.test(apology)) return null;
  apology = apology.replace(/^my bad\b/i, "sorry");
  const out = [];
  const isQ = (c) => /^(?:can|could|would|will|what|when|where|who|how|is|are|do|does|did|have)\b(?!')/i.test(c);
  const clauseLike = (c) => /^(?:I\b|I'|(?:the|my|our|this|that) [\w-]+ (?:is|was|are|were|has|had|didn't|isn't|wasn't|got)\b)/i.test(c);
  if (clauseLike(clauses[0]) && !isQ(clauses[0]) && /^(?:so |very |really )?(?:sorry|apologies)$/i.test(apology)) {
    out.push(`${cap(apology)}, ${clauses.shift()}.`);
  } else out.push(`${cap(apology)}.`);
  if (out.length === 1 && !clauses.length && !/,/.test(out[0])) return null;
  for (const c of clauses) out.push(isQ(c) ? `${cap(c)}?` : `${cap(c)}.`);
  return out.join(" ");
}

// Bare singular subject: "support queue is at 450" -> "The support queue is at 450".
const FINITE = "didn't|doesn't|hasn't|haven't|signed|quit|handled|approved|rejected|found|joined|fixed|shipped|launched|landed|ordered|booked|moved|pushed|lost|left|won|hit|sold|bought|flagged|reported|emailed|cancelled|canceled|sent|delivered|missed|caught|passed|died|ran|reopens|restored|replied|went|comes|come|goes|paid|works|worked|asked|replied|is|changed|arrived|arrives|arrive|expires|expired|opened|closed|ended|ends|leaked|is|was|isn't|wasn't|has|hasn't|had|got|keeps|kept|looks|looked|went|ran|runs|shows|showed|needs|wants|says|said|finished|failed|starts|started|broke|crashed|died|smells|takes|took|cost|costs|seems|loves|loved|called|calls|hates|doubled|tripled|dropped|went|came|will|won't|can't|should|still|just|keeps|refuses|is still|has been|got moved|is out|is down";
const BARE_SUBJECT = new RegExp(`^((?:[a-z][a-z0-9-]+ ){0,2}[a-z][a-z-]+(?<!s)|(?:[a-z][a-z0-9-]+ ){1,2}[A-Z]{2,4})(?: (?:on|in|at|from|for|of|with|about|to) (?:the |a |an )?(?:\\d+\\w* )?[a-z][a-z-]+(?: [a-z][a-z-]+)?)? (?=(?:${FINITE})\\b)`);
const NOT_HEAD = /^(?:sorry|apologies|oops|my bad|i|we|you|they|he|she|it|this|that|these|those|there|here|everything|everyone|everybody|nobody|nothing|someone|something|anyone|anything|what|who|whose|whom|why|how|where|when|which|my|our|your|their|his|her|its|the|a|an|no|any|some|each|every|all|both|traffic|weather|money|payroll|lunch|dinner|breakfast|coffee|internet|prod|production|staging|email|slack|jira|github|google|everything|stuff|life|work|time|it|today|tonight|tomorrow|yesterday|mom|dad|management|leadership|legal|finance|hr|marketing|sales|engineering|support|security|design|ops|it|qa|sarcasm|food|parking|attendance|morale|pay|rent|tax|stock|revenue|churn|demand|velocity)$/i;
export function restoreArticle(sentence) {
  const m = sentence.match(BARE_SUBJECT);
  if (!m) return sentence;
  // Round 8: "legal still hasn't reviewed it": "still" is an adverb, so the head is "legal".
  const words = m[1].split(" ").filter((w, i, a) => i === 0 || !/^(?:still|just|already|never|always|also|finally|really|now|totally|basically|apparently|literally|actually)$/i.test(w));
  if (NOT_HEAD.test(words[0]) && words.length === 1) return sentence;
  if (/^(?:half|most|both|none|several|many|few|each|either|neither|two|three|four|five|\d+)$/i.test(words[0])) return sentence;
  // A bare metric ("conversion dropped", "uptime was 99.2%") reads fine with no article.
  if (words.length === 1 && /^(?:conversion|conversions|revenue|churn|retention|engagement|usage|attendance|morale|latency|uptime|growth|demand|headcount|turnover|adoption|productivity|velocity|throughput|spend|signups)$/i.test(words[0])) return sentence;
  if (/^(?:is|are|was|were|do|does|did|can|could|will|would|should|has|have|had|am|i|we|you|they|he|she|it|this|that|there|my|our|your|their|the|a|an|no|any|some|every|all|what|who|whose|whom|why|how|where|when|which|just|so|and|but|also|still|maybe|please|let's|lets|pls)$/i.test(words[0])) return sentence;
  // Gerunds and adverbs are not count nouns ("testing is slow", "really is").
  if (/ing$|ly$/i.test(words[words.length - 1]) && words.length === 1) return sentence;
  // A head that is a known mass noun or team name keeps no article.
  if (NOT_HEAD.test(words[words.length - 1])) return sentence;
  if (/^(?:kid|son|daughter|wife|husband|partner|dog|cat|car|laptop|phone|flight|train|mom|dad|internet|power)$/i.test(words[words.length - 1]) && words.length === 1) return `my ${sentence}`;
  return `the ${sentence}`;
}

// Round 6 (fresh7): general fixes that run on each line before anything else.
function round6(t) {
  return t
    // "yo can someone grab the pizza" -> "can someone grab the pizza".
    .replace(/^(?:yo|oi|sup|ayy|aye)\b,?\s+(?=\S+\s+\S+\s+\S+)/i, "")
    // "ok cool ill take a look" -> "OK, I'll take a look".
    .replace(/^(?:ok|okay|k|kk)\b,?(?: (?:cool|great|sure|got it))?,? (?=(?:i|i'll|ill|i'm|im|will|sounds|thanks|ty|we)\b)/i, "OK, ")
    // "hotfix is live, errors dropped to zero" -> "..., and errors dropped to zero".
    .replace(/^(.{3,60}?\b(?:is|are) (?:live|done|fixed|up|back up|back|deployed|out|merged|shipped|resolved)), ((?:the |our )?[a-z]+ (?:dropped|fell|went|are|is|rose|jumped|look|looks|dipped|spiked|doubled|halved|recovered)\b[^,]*)$/i, "$1, and $2")
    // "that demo was a disaster, holy shit" -> drop the interjection.
    .replace(/([^\s,]),?\s+(?:holy (?:shit|crap|cow|moly|hell|fuck)|omfg|omg|jfc|jeez|yikes|smh)[.!]*$/i, "$1")
    // "sure thing, will do" -> "sure thing, I'll take care of it".
    .replace(/, will do[.!]*$/i, ", I'll take care of it")
    // "cant do thursday, im out" -> "..., I'll be out".
    .replace(/\b((?:can't|cant|can not|cannot|won't make|can't make|cant make|unable to)\b[^,]{2,40}), (?:i'm|im|i am|I'm) (out|off|away|ooo)[.!]*$/i, (_m, a, w) => `${a}, since I'll be ${w.toLowerCase() === "ooo" ? "out of office" : w.toLowerCase()}`)
    // "me and kwame are out" -> "Kwame and I are out".
    .replace(/^me and ([a-z]+) (are|were|will|have|can't|cannot|won't|need|both)\b/i, (_m, n, v) => `${n} and I ${v}`)
    // "this spreadsheet is pure garbage", "this release is a hot mess".
    .replace(/\b(is|are|was|were) (?:an? )?(?:total |complete |absolute )?hot mess\b/gi, "$1 in rough shape")
    // "sales promised the client some bullshit feature" -> "some questionable feature".
    .replace(/\b(some|a|this|that|the|another|more) (?:bullshit|bs|b\.s\.) (feature|features|deadline|policy|rule|request|excuse|excuses|metric|metrics|process|report|number|numbers|promise|promises|plan|idea|requirement|requirements|ticket|task|claim|claims|estimate|estimates|timeline|reason|story)\b/gi, "$1 questionable $2")
    // "stop screwing around with the config" -> "please stop tinkering with the config".
    .replace(/^stop (?:screwing|messing|fucking|dicking|farting|goofing) (?:around )?with\b/i, "please stop tinkering with")
    // "is down since lunch" -> "has been down since lunch".
    .replace(/\b(is|are) (down|out|offline|broken|red|stuck|closed|unavailable|unreachable|flaky|failing) since\b/gi, (_m, v, s) => `${v.toLowerCase() === "is" ? "has" : "have"} been ${s} since`)
    // "off by like 40" -> "off by about 40". Not "I'd like 3".
    .replace(/(?<!\b(?:I'd|we'd|you'd|they'd|would|I|we|you|they|'d|feel|feels|looks|look|seems|seem|sounds|sound)\s)\blike (?=\d)/gi, "about ")
    // "I got the flu, out today" -> "I got the flu, so I'm out today".
    .replace(/^((?:I(?:'ve)? (?:got|have|caught)|I'm|I am|feeling|sick|got)\b[^,]{2,40}),\s*(out|off|offline|working from home|logging off|taking the day off)\b( today| tomorrow| this week| for the day| for the rest of the day)?[.!]*$/i, (_m, a, b, c) => `${a}, so I'm ${b.toLowerCase()}${c ?? ""}`)
    // "out of office tomorrow, dentist" -> "for a dentist appointment".
    .replace(/,\s*(dentist|doctor|vet|physio|therapist|therapy|optometrist|eye doctor)[.!]*$/i, (_m, w) => `, ${w.toLowerCase().replace("therapist", "therapy")} appointment`)
    // "sorry missed your message" -> "sorry, I missed your message".
    .replace(/^(sorry|apologies),?\s+(missed|forgot|sent|deleted|broke|overslept|lost|misread|double-booked|didn't|haven't)\b/i, (_m, a, v) => `${a}, I ${v}`)
    // ", been slammed" after an apology -> "I've been slammed".
    .replace(/([,.;]\s*|\s-\s)been (slammed|busy|swamped|buried|underwater|sick|out|offline|traveling|travelling|heads-down|heads down|in meetings|on calls)\b/gi, (_m, p, w) => `. I've been ${w}`)
    // "this code is a steaming pile of crap" -> "this code is in really poor shape".
    .replace(/\b(is|was|are|were) (?:a |an )?(?:total |complete |absolute |steaming |hot |giant |big )*(?:pile|heap|load|bucket)s? of (?:crap|shit|garbage|junk|trash|rubbish|poo|dogshit)\b/gi, (_m, v) => `${v} in really poor shape`)
    // "a waste of my damn time" keeps "my time" once.
    .replace(/\ba waste of (my|our|your|everyone's) (?:damn |damned |goddamn |fucking |freaking |bloody )?time\b/gi, (_m, w) => `not a good use of ${w.toLowerCase()} time`);
}

// Round 8 (fresh13): general fixes that run on each line before round7().
const PLAN_NOUN = { prod: "the production release", production: "the production release", deploy: "the deploy", release: "the release", launch: "the launch", ship: "shipping", rollout: "the rollout", "go-live": "the go-live", demo: "the demo", merge: "the merge", cutover: "the cutover" };
function round8(t) {
  return t
    .replace(/(\S),\s+(?=(?:and )?I'm (?:so |totally |completely |really |absolutely )?(?:screwed|toast|done for|dead|in trouble|fucked|stuffed|cooked|hosed)\b)/i, "$1. ")
    // "dude, the demo crashed": a vocative, not a word to translate.
    .replace(/^(?:dude|bro|man|guys|mate|fam|yo|dawg|buddy),?\s+(?=\S)/i, "")
    // "rolling back now", "might need help", "two tickets left", "swamped" after a comma read as their own clause.
    .replace(/(\S),\s+((?:rolling back|reverting|restarting|redeploying|retrying|investigating|monitoring|escalating|debugging|patching|digging in|on it)\b[^,.!?]*)[.!]*$/i, (_m, a, r) => `${a}, and I'm ${r.toLowerCase().replace(/^on it$/, "on it")}`)
    .replace(/(\S),\s+(?:might|may|will probably|probably) need (help|a hand|some help|backup|a second pair of eyes|support)\b/i, (_m, a, h) => `${a}, and I might need ${h.toLowerCase()}`)
    .replace(/(\S),\s+((?:just |only )?(?:one|two|three|four|five|a few|a couple of|\d+) (?:tickets?|items?|bugs?|tasks?|stories|issues|pages?|slides?|tests?|PRs?) (?:left|remaining|to go))[.!]*$/i, (_m, a, r) => `${a}, with ${r.replace(/^(?:just|only) /i, "only ")}`)
    .replace(/(\S),\s+(?:I'm |im )?(swamped|slammed|buried|underwater|drowning|maxed out)(?: today| this week)?[.!]*$/i, (_m, a) => `${a}, since I'm at capacity`)
    // "finished the draft, sending it over after lunch": the "-ing" clause is what I'll do next.
    .replace(/(\S),\s+(sending|emailing|sharing|posting|forwarding|uploading|circulating|dropping) (it|them|that|those|this) ((?:over|out|along|across|in|here) )?((?:after|before|by|at|in|around|tonight|today|tomorrow|later|shortly|soon|this|first thing|EOD|end of day)\b[^,.!?]*)[.!]*$/i, (_m, a, v, o, adv, when) => `${a}, and I'll ${({ sending: "send", emailing: "email", sharing: "share", posting: "post", forwarding: "forward", uploading: "upload", circulating: "circulate", dropping: "drop" })[v.toLowerCase()]} ${o} ${/^over $/i.test(adv ?? "") ? "" : adv ?? ""}${when}`)
    // "gonna be late, train's delayed" -> "because my train is delayed".
    .replace(/(\S),\s+(?:the |my )?(train|bus|flight|ride|uber|lyft|car|subway|tram|ferry)(?:'s| is) (delayed|late|stuck|cancelled|canceled|running late|broken down)\b/gi, (m0, a, v, st, off, all) => !/\b(?:late|behind|running|be there|make it|miss\w*|on my way)\b/i.test(all.slice(0, off + 1)) ? m0 : `${a} because my ${v.toLowerCase().replace(/^(uber|lyft)$/, (x) => x[0].toUpperCase() + x.slice(1))} is ${st.toLowerCase()}`)
    // "ya that works for me": the "yes" just repeats the agreement.
    .replace(/^(?:yes|yeah|ya|yep|yup|yea),?\s+(?=(?:that|this|it) (?:works|sounds|is fine|'s fine|should work)|works for me|sounds good|fine by me)/i, "")
    // "lol yeah that's on me, my bad": the "yes" agrees with the blame, it doesn't approve anything.
    .replace(/^((?:yes|yeah|yep|yup|ya|yea),?\s+)?((?:that's|that is|that was|it's|it is|it was) (?:on me|all on me|my (?:fault|mistake|miss|error)|me))[,.!]?\s+(?:my bad|sorry|oops|apologies|my mistake)[.!]*$/i, (_m, _y, a) => `Sorry, ${a.toLowerCase()}`)
    .replace(/^(?:yes|yeah|yep|yup|ya|yea),?\s+(?=(?:that's|that is|that was|it's|it is|it was) (?:on me|all on me|my (?:fault|bad|mistake|miss|error|call)|me)\b)/i, "")
    // "db is at 92% disk, need to clean up logs today": the bare "need to" after a comma is mine.
    .replace(/(\S),\s+(?:still )?(?:need to|have to|gotta|got to|gonna have to)\s+(?=\w)/gi, "$1, so I need to ")
    // "pushed it to staging, prod tomorrow if nothing breaks" -> "and the production release is planned for tomorrow".
    .replace(/(\S),\s+(prod|production|deploy|release|launch|ship|rollout|go-live|demo|merge|cutover) ((?:on )?(?:tomorrow|today|tonight|this afternoon|this evening|next week|this week|EOD|end of day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?: (?:morning|afternoon|evening|night))?)((?: if| unless| assuming| once)\b[^,.!?]+)?[.!]*$/i, (_m, a, n, when, cond) => `${a}, and ${PLAN_NOUN[n.toLowerCase()]} is planned for ${when.replace(/^on /i, "")}${cond ?? ""}`)
    // "db" in a status line is the database.
    .replace(/^db(?=\s+(?:is|was|has|keeps|went|got|died|crashed|needs|ran|at)\b)/i, "the database").replace(/(?<=\b[a-z]+ )db(?=\s+(?:is|was|has|keeps|went|got|died|crashed|needs|ran|at)\b)/gi, "database")
    // "the new dashboard looks sick" is praise, not illness.
    .replace(/\b(looks?|looked|sounds?|sounded)((?: so| really| pretty| super| kinda| kind of| absolutely))? (?:sick|siiick|dope|fire|lit|insane|unreal|fire af|sick af)\b(?! (?:of|and tired|to my|today))/gi, (_m, v, adv) => `${v}${adv ?? ""} great`)
    .replace(/\b(is|are|was|were)((?: so| really| pretty| super| absolutely))? (?:dope|fire|lit)\b(?! (?:alarm|drill|exit|code|hazard|marshal|department|safety))/gi, (_m, v, adv) => `${v}${adv ?? ""} great`)
    .replace(/\b(this|that|it|the [\w-]+) slaps\b/gi, "$1 is great")
    // "the wifi in the conference room is useless" -> "isn't working well". People are left to the crude rules.
    .replace(/^((?:the|this|that|these|those|our|my|your) (?!guy|man|woman|person|manager|boss|team|lead|intern|contractor|vendor|client|customer)[^,]{2,50}?) (is|are) (?:completely |totally |pretty |so |kinda |basically |just )?useless\b/i, (_m, a, v) => `${a} ${v.toLowerCase() === "is" ? "isn't" : "aren't"} much help`);
}

// Round 7 (fresh10): general fixes that run on each line before round6().
function round7(t) {
  return t
    // "the slides look cheap" is about quality, not price.
    .replace(/\b(look|looks|looked|feel|feels|felt|seem|seems|seemed)((?: a bit| kinda| kind of| really| so| pretty| very| super)?) cheap\b/gi, "$1$2 unpolished")
    // "wait who's running the offsite" -> "who's running the offsite". "Wait" is a filler, not advice.
    .replace(/^(?:wait|hold on|hang on)\b[,.!]*\s+(?=\S+\s+\S+\s+\S+)(?=(?:so |but )?(?:who|what|when|where|why|how|is|are|was|were|do|does|did|can|could|didn't|don't|isn't|aren't)\b)(.*?)[.!?]*$/i, "$1?")
    // "we just changed this last month, why again" -> "... Why are we revisiting it?"
    .replace(/,?\s+(?:so )?why (?:again|are we doing this again|is this happening again)\??$/i, ". Why are we revisiting it?")
    // "these numbers are off, someone double check them" -> its own request sentence.
    .replace(/^(.{8,}?),\s+(?:can |could )?(someone|somebody|anyone|anybody)(?: please| pls)? (?!(?:is|was|has|had|did|does|knows?|said|says|else|who|will|would|should|already|just|still|keeps|stole|took|ate|broke|left|got|made|sent|told|forgot|lost|found|put|ran|never|always|really|probably)\b|[a-z]+ed\b)([a-z]+\b.*?)\??$/i, (_m, a, who, rest) => `${a}. Could ${who.toLowerCase()} ${rest}?`)
    // "check slack", "on twitter": the product names, not the words.
    .replace(/\b(on|in|check|via|over|through|the|from|a|my|your|our) slack\b(?! off\b)/gi, (_m, p) => `${p} Slack`)
    .replace(/\bslack (me|channel|channels|thread|threads|message|messages|dm|dms|huddle|post)\b/gi, (_m, w) => `Slack ${w}`)
    .replace(/\b(twitter|linkedin|instagram|facebook|youtube|tiktok|reddit|whatsapp|github|zoom(?= (?:call|meeting|link|room)\b)|teams(?= (?:call|meeting|chat|channel)\b))\b/gi, (w) => ({ linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok", whatsapp: "WhatsApp", github: "GitHub" })[w.toLowerCase()] ?? w[0].toUpperCase() + w.slice(1).toLowerCase())
    // "doc appt" is the doctor, not a document.
    .replace(/\b(?:doc|dr\.?|doctors?|doctor's) (?:appt|appointment)s?\b/gi, "doctor's appointment")
    // "the printer's broken. shocking." The trailing "shocking" is sarcasm with nothing to keep.
    .replace(/([.!?])\s+(?:shocking|what a surprise|who knew|imagine that|colou?r me surprised|big surprise|go figure)[.!]*$/i, "$1")
    // "marketing changed the copy again without asking, wtf": the tail is frustration, not a question.
    .replace(/^(.{12,}?),\s*(?:what|wtf|wth|what the (?:fuck|hell|heck)|seriously|really|come on|ffs|for fuck's sake|smh|ugh)[?!.]*$/i, (m, a) => (/\b(?:is|are|was|were|did|does|do|has|have|had|keeps?|changed|moved|cancel\w*|broke|deleted|missed|forgot|again|without)\b|'s\b|\b[a-z]{3,}ed\b/i.test(a) ? `${a}, which is frustrating` : m))
    // "nvm figured it out" -> "never mind, I figured it out".
    .replace(/^(?:nvm|nevermind|never mind|nm)\b,?\s*(?:i )?(figured|found|got|fixed|sorted|solved|worked)\b/i, (_m, v) => `Never mind, I ${v.toLowerCase()}`)
    .replace(/^(?:nvm|nevermind|nm)\b[,.!]*/i, "Never mind,")
    // "that vendor can kiss my ass": the writer is done accommodating them.
    .replace(/^(.{2,40}?) can (?:go )?(?:kiss my (?:ass|arse|butt)|bite me|get stuffed|shove it|stuff it)[.!]*$/i, (_m, who) => `I'm no longer willing to accommodate ${who.replace(/^(?:The|That|This|These|Those|Our|My|Your|Their)\b/, (d) => d.toLowerCase())}`)
    // "thanks for letting me know the deadline moved, said nobody" -> nobody told me.
    .replace(/^(?:thanks|thank you|thx) (?:so much )?for (?:letting me know|telling me|warning me|the heads[- ]up|giving me a heads[- ]up)(?: that| about)? (.+?),? said (?:nobody|no one)(?: ever)?[.!]*$/i, (_m, x) => `Nobody told me ${x}`)
    .replace(/^(.+?),? said (?:nobody|no one) ever[.!]*$/i, "I don't think anyone would say $1")
    // "wow great planning, the venue is double booked": praise in front of a problem is sarcasm.
    .replace(/^(?:wow,? |oh,? )?(?:great|nice|good|excellent|brilliant|stellar|amazing|awesome) (?:planning|job|work|call|communication|timing|coordination|organi[sz]ation|idea)(?: guys| team| everyone)?[,.!]+\s+(.+)$/i, (m, rest) => (NEG_CUE.test(rest) || /\b(?:double[- ]booked|overbooked|missing|forgot|nobody|no one|wrong|broken|late|gone|empty|cancel\w*)\b/i.test(rest) ? `Unfortunately, ${rest}` : m))
    // "room b" -> "Room B".
    .replace(/\b(room|conference room|floor|building|gate|suite|lab) ([a-z]|\d{1,4}[a-z]?)\b(?![\w'])/gi, (_m, w, x) => `${w} ${x.toUpperCase()}`)
    // "i'm done with this bullshit approval process" means fed up, not finished.
    .replace(/\b(I'm|I am|im|we're) (?:so |totally |completely )?done with (this|that|these|those|all this|all the|the) (?=(?:[\w-]+ )?(?:bullshit|crap|shit|nonsense|garbage|bs)\b)/gi, (_m, w, d) => `${w.toLowerCase() === "we're" ? "we're" : "I'm"} fed up with ${d} `)
    // "whoever wrote this code should be fired lol" is a complaint about the work, not a firing request.
    .replace(/^(?:whoever|the (?:person|guy|dev|developer|one|people|team) (?:who|that)) (wrote|built|designed|approved|made|signed off on|scheduled|planned|picked|chose) (.+?) should (?:be fired|get fired|lose their job|be sacked)(?: lol| lmao| haha| tbh)*[.!]*$/i, (_m, v, x) => `I have serious concerns about ${x.replace(/^(?:this|that|the) /i, (d) => d.toLowerCase())}`)
    // "the deck has too many words, cut half" -> a suggestion, not a comma splice.
    .replace(/^(.{6,}?\b(?:has|have|is|are|looks|feels|seems|runs)\b[^,]{2,50}), (cut|trim|drop|lose|remove|shorten|simplify|split|merge) (half|most|some|a few|a third)(?: of (it|them))?[.!]*$/i, (_m, a, v, q, o) => `${a}. I'd suggest we ${/^half$/i.test(q) && !o && /^(?:cut|trim|shorten|split)$/i.test(v) ? v.toLowerCase() + " it in half" : v.toLowerCase() + " " + q.toLowerCase() + " of " + (o ?? "it").toLowerCase()}`)
    // "sry missed ur call, whats up" -> the tail is a question.
    .replace(/,\s*(what's up|whats up|what's going on|what happened|what's the issue|what do you need|what's new)[.!]*$/i, (_m, q) => `. ${q.replace(/^whats/i, "What's").replace(/^w/, "W")}?`)
    // "the readme is confusing, add examples" -> a suggestion after the observation.
    .replace(/^((?:the|this|that|our|your|my) [^,]{2,40}\b(?:is|are|looks|seems|feels)\b[^,]{2,40}), (add|include|use|try|remove|drop|rename|split|rewrite|simplify|shorten|update|fix|move) ((?:a |an |the |some |more |less |fewer )?[a-z][^,]{1,40})[.!]*$/i, (_m, a, v, rest) => `${a}. I'd suggest we ${v.toLowerCase()} ${rest}`)
    .replace(/\breadme\b/gi, "README")
    .replace(/\b(saved|save|saving) (our|my) (?:butts?|bacon|skins?|hides?|necks?)\b/gi, (_m, v, w) => `really ${v.toLowerCase()} ${w.toLowerCase() === "our" ? "us" : "me"}`)
    // "what a waste of time" after a clause becomes its own sentence the levels can rephrase.
    .replace(/,?\s+what a (?:complete |total |huge |massive )?waste of (?:my |our |everyone's )?(?:damn |freaking |fucking )?time[.!]*$/i, ". It wasn't a good use of time.")
    // "jesus christ, the client changed it again": exasperation, so the levels read it as bad news.
    .replace(/^(?:jesus(?: h\.?)? christ|for (?:god's|fuck's|pete's|christ's) sake|oh my god|good god|ugh+)[,.!]*\s+(?=\S)(.*)$/i, (m, rest) => (NEG_CUE.test(rest) || /\b(?:again|changed|moved|still|why)\b/i.test(rest) ? `Unfortunately, ${rest}` : m));
}

// Round 9: bare status fragments become full sentences before anything else reads them.
const cap1 = (x) => x[0].toUpperCase() + x.slice(1);
// Round 10: more work-chat fragments and run-ons, so every level starts from a full sentence.
// Round 11: sarcasm read literally, bare fragments, and chat shorthand (fresh24 leftovers, tested on fresh25).
const R11_THING = String.raw`(?:printer|scanner|copier|wifi|wi-fi|vpn|projector|laptop|monitor|headset|elevator|badge reader|badge system|coffee machine|microwave|dishwasher|ice machine|build|server|dashboard|app|tool|tablet|phone|keyboard|mouse|website|site|intranet|portal|calendar|shared drive|wiki|jira|jenkins|slack|zoom|teams|outlook|AC|heater|fridge|vending machine|door|toilet|sink)`;
const BAD_PLAN = /\b(?:another|yet another|more|back-to-back|\d+\s?(?:am|pm)|\d+\s?(?:a\.m\.|p\.m\.)|early|on call|weekend|saturday|sunday|all-hands|all hands|budget review|redo|re-do|whole|again|twice|same|paperwork|password reset|form|overtime|late|night|flight|commute|meeting|meetings|calls?|review)\b/i;
const MON = { mon: "Monday", tues: "Tuesday", tue: "Tuesday", weds: "Wednesday", wed: "Wednesday", thurs: "Thursday", thu: "Thursday", fri: "Friday" };
export function round11(line) {
  line = String(line).replace(/\b(?!thank you\b)(\w+ \w+(?: \w+)?) \1\b/gi, "$1");
  let t = line.trim(), m;
  const end = (x) => x.replace(/\s+([,.])/g, "$1").replace(/[.]*$/, ".");
  // Shorthand that normalizeCasual leaves as a lead-in.
  if ((m = t.match(/^I know, right\?,?\s*(.*)$/i))) { if (!m[1]) return "I completely agree."; const r = round11(m[1]); const x = r !== m[1] ? r : m[1]; return `I know, right? ${cap1(x)}${/[.!?]$/.test(x) ? "" : "."}`; }
  if ((m = t.match(/^be right there,?\s*(.*?)[.!]*$/i))) return m[1] ? `I'll be right there. I'm ${m[1].replace(/^(?:I'm |just )/i, "")}.`.replace(/I'm (grabbing|getting|finishing|parking|wrapping)/, "I'm just $1") : "I'll be right there.";
  if ((m = t.match(/^be back in a (bit|sec|second|minute|few)[.!]*$/i))) return `I'll be back in a ${m[1].toLowerCase()}.`;
  if ((m = t.match(/^take your time,?\s*(?:there's |there is )?no rush(?: on (.+?))?[.!]*$/i))) return `There's no rush${m[1] ? ` on ${m[1]}` : ""}, so feel free to take your time.`;
  if ((m = t.match(/^for the record,?\s+I (?:said|told you|called it|predicted)(?: (?:this|that|it) would happen)?[.!]*$/i))) return "For the record, I did warn about this.";
  if ((m = t.match(/^for the record,?\s+(.+?)[.!]*$/i))) return `For the record, ${m[1]}.`;
  if ((m = t.match(/^(?:ack|acknowledged)[,.]?\s*(?:will|I'll) (fix|do|update|handle|check|look)( it| that| this)?[.!]*$/i))) return `Got it. I'll ${m[1].toLowerCase()} ${(m[2] || " it").trim()}.`;
  if (/^(?:ack|acked)[.!]*$/i.test(t)) return "Got it.";
  if ((m = t.match(/^(?:ty|thank you|thanks),? (?:ty|thank you|thanks),? (?:you're a )?lifesaver[.!]*$/i))) return "Thank you so much. You're a lifesaver!";
  if ((m = t.match(/^(?:I'm )?(?:out of office|ooo) (?:till|until|til) (\w+)[.!]*$/i))) return `I'm out of office until ${MON[m[1].toLowerCase()] ?? cap1(m[1])}.`;
  if ((m = t.match(/^dm'?d you (?:the )?(.+?)[.!]*$/i))) return `I sent you the ${m[1]} in a direct message.`;
  if ((m = t.match(/^dm me (?:the )?(.+?)[.!]*$/i))) return `Could you send me the ${m[1]} in a direct message?`;
  if ((m = t.match(/^sounds good to me[.!]*$/i))) return "Sounds good to me.";
  // Sarcasm read literally.
  if ((m = t.match(new RegExp(String.raw`^(?:wow|whoa|oh wow|omg),?\s+(?:the |our |my )?(${R11_THING}) (?:actually |finally )?(works|is working|loaded|connected|is up|is back)(.*?)[.!]*$`, "i")))) {
    const tail = m[3].replace(/^ today$/i, " today");
    return /^(?:works|is working)$/i.test(m[2]) ? `The ${m[1]} is actually working${tail}, which doesn't happen often.` : `The ${m[1]} ${m[2]}${tail}, which doesn't happen often.`;
  }
  if ((m = t.match(/^(?:I'm )?(?:so |really |super |just |soo+ )?(?:thrilled|excited|pumped|stoked|happy|glad|delighted) (?:about|for) (.+?)[.!]*$/i)) && BAD_PLAN.test(m[1])) return `I'm not excited about ${m[1].replace(/^(?:the|a|an) /i, (x) => x.toLowerCase())}.`;
  if ((m = t.match(/^(?:I'm )?(?:so |really |super |just )?(?:thrilled|excited|pumped|stoked|happy|delighted) to (be|redo|re-do|fill out|sit through|work|do|attend|join|start|spend) (.+?)[.!]*$/i)) && BAD_PLAN.test(m[2])) return `I'm not thrilled to ${m[1].toLowerCase()} ${m[2]}.`;
  if (/^so glad I came in (?:for|today for) this[.!]*$/i.test(t)) return "I'm not sure this was worth coming in for.";
  if ((m = t.match(/^(?:so |really )?glad (?:that )?(the .+?)[.!]*$/i)) && NEG_CUE.test(m[1])) return `Unfortunately, ${m[1]}.`;
  if ((m = t.match(/^(?:great|good|fantastic|awesome) news,?\s+(.+?)[.!]*$/i)) && !/\bbad news\b/i.test(m[1]) && /\b(?:updated itself|mid-meeting|mid-call|again|logged (?:me|us) out|crashed|broke|down|deleted|lost)\b/i.test(m[1])) return `Unfortunately, ${m[1]}.`;
  if ((m = t.match(/^(?:I )?can'?t wait to (\w+) (.+?)[.!]*$/i)) && BAD_PLAN.test(m[2])) return `I'm not excited about ${ing(m[1].toLowerCase())} ${m[2]}.`;
  if ((m = t.match(/^(?:I )?can'?t wait for (another|more|my|our|yet another|one more) (.+?)[.!]*$/i))) return `I'm not excited about ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^just what (?:I|we) needed,?\s+(another|more|yet another|a) (.+?)[.!]*$/i))) return `I'm not thrilled about ${m[1].toLowerCase() === "a" ? "a" : m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^(?:I )?love that we have (.+?)[.!]*$/i)) && /\b(?:three|four|five|\d+|too many|more) \w*\s?meetings\b/i.test(m[1])) return `I think we have too many meetings: ${m[1]}.`;
  // "the line for the microwave is ridiculous" is about length, not credibility.
  if ((m = t.match(/^(?:the )?(line|queue|wait) (for|at) (?:the )?(.+?) is (?:so |really |absolutely )?(ridiculous|insane|crazy|absurd|nuts|wild|out the door|endless)( today| again| right now)?[.!]*$/i))) return `The ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${/^(?:IT|HR|legal|finance|security|support|[A-Z]{2,})$/.test(m[3]) ? "" : "the "}${m[3]} is really long${m[5] ?? ""}.`;
  if ((m = t.match(/^(?:the )?(coffee|microwave|elevator|lunch|cafeteria|bathroom|restroom) (line|queue) (on \d+ )?is (?:so |really )?(ridiculous|insane|crazy|absurd|nuts|wild|out the door|endless)( today| again| right now)?[.!]*$/i))) return `The ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3] ?? ""}is really long${m[5] ?? ""}.`;
  if ((m = t.match(/^(?:I )?overslept,? (?:I'll |will )?be there in (\d+)(?: ?(?:min|mins|minutes))?[.!]*$/i))) return `I overslept, but I'll be there in ${m[1]} minutes.`;
  if ((m = t.match(/^(?:wfh|working from home|I'm working from home) (today|tomorrow|monday|tuesday|wednesday|thursday|friday),? (?:a |the )?(plumber|electrician|repair person|technician|delivery|contractor|cable guy) (?:is )?coming[.!]*$/i))) return `I'm working from home ${m[1]} because ${/^delivery$/i.test(m[2]) ? "a delivery is" : `a ${m[2].toLowerCase()} is`} coming.`;
  if ((m = t.match(/^(?:I don't know|I'm not sure|idk)(?: yet)?,? (?:ask|check with) (\w+) maybe[.!?]*$/i))) return `I'm not sure. It might be worth asking ${m[1]}.`;
  // Fragments become sentences.
  if ((m = t.match(new RegExp(String.raw`^(?:the|this|my|our) (${R11_THING})(?: again)[.!]*$`, "i")))) return `The ${m[1]} is acting up again.`;
  if ((m = t.match(new RegExp(String.raw`^(this|that|the) (${R11_THING})[.!]*$`, "i")))) return `${cap1(m[1].toLowerCase())} ${m[2]} is giving me trouble.`;
  if ((m = t.match(/^ASAP,? ?(?:please|pls|if (?:possible|you can))[.!]*$|^(?:please|pls),? ASAP[.!]*$/i))) return "Could you take care of this ASAP?";
  if ((m = t.match(/^urgent,? (?:please )?(call|ping|text) me[.!]*$/i))) return `This is urgent. Please ${m[1].toLowerCase()} me.`;
  if ((m = t.match(/^back online (at|in|by) ([\w:]+)[.!]*$/i))) return `I'll be back online ${m[1].toLowerCase()} ${m[2]}${/^in$/i.test(m[1]) && /^\d+$/.test(m[2]) ? " minutes" : ""}.`;
  if ((m = t.match(/^offline (?:till|until|til) ([\w:]+)[.!]*$/i))) return `I'll be offline until ${m[1]}.`;
  if ((m = t.match(/^heads[- ]down (?:till|until|til) ([\w:]+)[.!]*$/i))) return `I'm heads-down until ${m[1]}.`;
  if ((m = t.match(/^(prod deploy|deploy|release|launch|demo|standup|retro|all-hands|huddle|sync|go-live|cutover) (at|in) ([\w:]+)[.!]*$/i))) return `The ${m[1].toLowerCase()} is ${m[2].toLowerCase()} ${m[3]}${/^in$/i.test(m[2]) && /^\d+$/.test(m[3]) ? " minutes" : ""}.`;
  if ((m = t.match(/^(snacks|bagels|donuts|doughnuts|cookies|leftovers|cupcakes|cake|pizza|coffee|lunch|fruit) (on \d+|on the \w+ floor|in the [\w ]+?)(?:,? anyone\??)?[.!]*$/i))) return `There ${/s$/i.test(m[1]) ? "are" : "is"} ${m[1].toLowerCase()} ${m[2]} for anyone who wants some.`;
  if (/^done and done[.!]*$/i.test(t)) return "All done.";
  if ((m = t.match(/^done,? (merged|shipped|deployed|sent|submitted|pushed)[.!]*$/i))) return `It's done and ${m[1].toLowerCase()}.`;
  if ((m = t.match(/^free (now|in \d+|in a bit|after \w+)( if (?:you are|you're free|you want to chat))?[.!]*$/i))) return `I'm free ${m[1]}${/^in \d+$/i.test(m[1]) ? " minutes" : ""} ${/chat/i.test(m[2] ?? "") ? "if you want to chat" : "if you are"}.`;
  if ((m = t.match(/^still (on it|working on it|on this|looking into it)[.!]*$/i))) return `I'm still ${m[1]}.`;
  if ((m = t.match(/^(quick (?:sync|call|chat)|huddle|sync|call)( at [\w:]+| now| later| today| tomorrow)?\?$/i))) return `Do you have time for a ${m[1].toLowerCase()}${m[2] ?? ""}?`;
  if ((m = t.match(/^(coffee|drinks|tea)\?$/i))) return `Is anyone up for ${m[1].toLowerCase()}?`;
  if ((m = t.match(/^half day (today|tomorrow|friday|monday|on \w+)[.!]*$/i))) return `I'm working a half day ${m[1]}.`;
  if ((m = t.match(/^(out|off) ((?:today|tomorrow|monday|tuesday|wednesday|thursday|friday)(?: and (?:monday|tuesday|wednesday|thursday|friday))?|this afternoon|next week)(?:,| for| because of)? (?:for )?(?!and\b)(.+?)[.!]*$/i))) return /^(?:\w+ing)\b/i.test(m[3]) ? `I'm ${m[1].toLowerCase()} ${m[2]} because I'm ${m[3]}.` : `I'm ${m[1].toLowerCase()} ${m[2]} for ${m[3].replace(/^for /i, "")}.`;
  if ((m = t.match(/^on (parental|medical|sick|maternity|paternity|family) leave (.+?)[.!]*$/i))) return `I'm on ${m[1].toLowerCase()} leave ${m[2]}.`;
  if ((m = t.match(/^(blocked|stuck) (until|on|by) (.+?)[.!]*$/i))) return `I'm ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3]}.`;
  if ((m = t.match(/^(?:my )?(flight|train|bus) (?:is )?(delayed|cancell?ed|late|stuck)[,;]? (?:so )?(joining|dialing in|calling in) (remotely|from the airport|by phone)[.!]*$/i))) return `My ${m[1].toLowerCase()} is ${m[2].toLowerCase()}, so I'll ${m[3].toLowerCase().replace(/ing$/, "").replace(/^join$/, "join").replace(/^dial$/, "dial").replace(/^call$/, "call")} ${m[4]}.`.replace(/I'll joining/, "I'll join");
  if ((m = t.match(/^(?:I'm )?running (?:a bit |a little )?(late|behind)(?: schedule)?,? (train|bus|subway|traffic|transit) (delays|issues|problems|is late|is stuck)[.!]*$/i))) return /^is /i.test(m[3]) ? `I'm running ${m[1].toLowerCase()} because my ${m[2].toLowerCase()} ${m[3].toLowerCase()}.` : `I'm running ${m[1].toLowerCase()} because of ${m[2].toLowerCase()} ${m[3]}.`;
  if ((m = t.match(/^(?:my )?(train|bus) is (stuck|late|delayed),? (\d+) ?(?:min|mins|minutes) late[.!]*$/i))) return `My ${m[1].toLowerCase()} is ${m[2].toLowerCase()}, so I'll be ${m[3]} minutes late.`;
  if ((m = t.match(/^(?:I )?missed the (bus|train|shuttle),? (\d+) (?:min |mins |minutes )?(?:out|away)[.!]*$/i))) return `I missed the ${m[1].toLowerCase()}. I'm ${m[2]} minutes away.`;
  if ((m = t.match(/^whoever (\w+ed) (.+?),? (?:please|pls) (stop|don't|clean it up)[.!]*$/i))) return `To whoever ${m[1]} ${m[2]}: please ${m[3]}.`;
  if ((m = t.match(/^mind ((?:\w+ )?\w+ing\b.*?)\??$/i))) return `Would you mind ${m[1]}?`;
  if ((m = t.match(/^anyone (?:want|wanna) (?:to )?(?:grab|get) (drinks|lunch|coffee|dinner|a coffee|food|tacos|pizza)(.*?)\??$/i))) return `Is anyone up for ${m[1].replace(/^a /, "")}${m[2]}?`;
  if ((m = t.match(/^anyone (?:want|wanna) to (.+?)\??$/i)) || (m = t.match(/^anyone (?:want|wanna) (grab|get|go|join) (.+?)\??$/i))) return m[2] ? `Does anyone want to ${m[1]} ${m[2]}?` : `Does anyone want to ${m[1]}?`;
  if ((m = t.match(/^(?:who's|who is) up for (.+?)\??$/i))) return `Who's up for ${m[1]}?`;
  if ((m = t.match(/^happy (anniversary|birthday) to the team[.!]*$/i))) return `Happy ${m[1].toLowerCase()}, team!`;
  if ((m = t.match(/^(?:going|heading) on vacation (.+?)[.!]*$/i))) return `I'll be on vacation ${m[1]}.`;
  if ((m = t.match(/^off on vacation (until|till|til) (.+?)[.!]*$/i))) return `I'm on vacation until ${m[1] && m[2]}.`;
  // ---- Round 11b (tuned on fresh26) ----
  // Sarcasm: a happy opener plus something nobody enjoys.
  const SARC = /\b(?:again|another|mandatory|redo|re-do|rewrite|wiped|deleted|broke|crashed|restarted|unplugged|no agenda|only works|fifth time|third time|\d+ pages|\d+ ?am|mid-call|mid-meeting|fire drill|reply-all|for one|one receipt|same slide|expense (?:forms?|reports?)|paperwork|survey|overtime|on a (?:saturday|sunday)|for updates|from scratch|redo\w*|re-?doing|(?:third|fourth|fifth|sixth|\d+th) time|mid-(?:demo|call|meeting|presentation|sentence|sprint)|double[- ]booked|disconnect\w*|is full|full by|just "?updates"?|every (?:ten|five|two|\d+|few) minutes|explain this to|got canceled|got cancelled|for nothing|back-to-back|(?:two|three|four|five|\d+)-hour|minutes before|last[- ]minute|timesheet|reorg|went out|died)\b/i;
  if ((m = t.match(/^(?:I'm )?(?:so |really |super |just )?(?:glad|thrilled|happy|delighted|pumped|excited) (?:that )?((?:the|my|our|this|we|they|it|someone) .+?)[.!]*$/i)) && SARC.test(m[1])) return `I'm not thrilled that ${m[1].replace(/^(?:The|My|Our|This)\b/, (x) => x.toLowerCase())}.`;
  if ((m = t.match(/^(?:I'm )?(?:so |really |super |just )?(?:thrilled|excited|pumped|stoked|happy|delighted) to (\w+) (.+?)[.!]*$/i)) && SARC.test(`${m[1]} ${m[2]}`)) return `I'm not thrilled to ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^(?:I'm )?(?:so |really |super |just )?(?:thrilled|excited|pumped|stoked) (?:for|about) (.+?)[.!]*$/i)) && SARC.test(m[1])) return `I'm not excited about ${m[1].replace(/^(?:the|a|an) /i, (x) => x.toLowerCase())}.`;
  if ((m = t.match(/^(?:I )?love (?:that|how) (.+?)[.!]*$/i)) && (SARC.test(m[1]) || /\b(?:only|never|always|every time|dies|runs over|nobody|no one)\b/i.test(m[1]))) return `I'm frustrated that ${m[1]}.`;
  if ((m = t.match(/^(?:I )?love (getting|having|being|sitting through|doing) (.+?)[.!]*$/i)) && (SARC.test(m[2]) || /\b(?:no|without|late|last-minute|surprise)\b/i.test(m[2]))) return `I'm not a fan of ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^just what (?:I|we) (?:wanted|needed),?\s+(.+?)[.!]*$/i))) return `I'm not thrilled about ${m[1].replace(/^(?:A|An|The)\b/, (x) => x.toLowerCase())}.`;
  if ((m = t.match(/^(?:awesome|great|perfect|fantastic|wonderful|nice|lovely),\s+(the|my|our) (.+?)[.!]*$/i)) && SARC.test(m[2])) return `Unfortunately, ${m[1].toLowerCase()} ${m[2]}.`.replace(/^Unfortunately, the (laptop|monitor|phone|computer|headset)\b/i, "Unfortunately, my $1");
  // Fragments and slang.
  if ((m = t.match(/^(?:going|heading) on (PTO|holiday|leave|parental leave|paternity leave|maternity leave|medical leave|sabbatical|vacation) (.+?)[.!]*$/i))) return `I'll be on ${/^pto$/i.test(m[1]) ? "PTO" : m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^starting (parental|medical|maternity|paternity|family|sick) leave (.+?)[.!]*$/i))) return `I'm starting ${m[1].toLowerCase()} leave ${m[2]}.`;
  if ((m = t.match(/^(?:at|stuck at) the (dentist|doctor|vet|DMV|bank|hospital|school|airport) (?:till|until|til) ([\w:]+)[.!]*$/i))) return `I'm at the ${m[1]} until ${m[2]}.`;
  if ((m = t.match(/^(?:I'm )?((?:stuck|at) (?:at )?the (?:dentist|doctor|vet|DMV|bank|airport|school)|(?:dentist|doctor) at \d+),? in by ([\w:]+)[.!]*$/i))) return `${/^\w+ at \d/i.test(m[1]) ? `I have a ${m[1].replace(/ at /, " appointment at ")}` : `I'm ${m[1].replace(/^at /i, "at ")}`}, so I'll be in by ${m[2]}.`;
  if ((m = t.match(/^(?:I )?missed (?:my|the) (train|bus|shuttle|flight),? (?:I'll be )?there in (\d+)(?: ?(?:min|mins|minutes))?[.!]*$/i))) return `I missed my ${m[1].toLowerCase()}, so I'll be there in ${m[2]} minutes.`;
  if ((m = t.match(/^(?:my )?(flight|train) (?:got |was )?(cancell?ed|delayed),? joining (?:remote|remotely)[.!]*$/i))) return `My ${m[1].toLowerCase()} got ${m[2].toLowerCase()}, so I'll join remotely.`;
  if ((m = t.match(/^(moving offices|on jury duty|in training|at a conference|at an offsite|on a site visit|traveling|in back-to-back meetings) (today|tomorrow|this week|next week|all day|on \w+)[.!]*$/i))) return `I'm ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^(lunch|dinner|breakfast|happy hour) (at|is at) ([\w:]+(?: ?[ap]m)?)[.!]*$/i))) return `${cap1(m[1].toLowerCase())} is at ${m[3]}.`;
  if ((m = t.match(/^(deck|slides|doc|draft|report|invoice|agenda|notes|contract|file|spreadsheet|proposal)s? attached[.!]*$/i))) return `I've attached the ${m[1].toLowerCase()}.`;
  if ((m = t.match(/^(pastries|bagels|donuts|doughnuts|cookies|leftovers|cupcakes|cake|pizza|fruit|snacks|tacos|sandwiches|muffins) (by|near|next to|in|on|at) (the [\w ]+?|\d+)[.!]*$/i))) return `There ${/s$/i.test(m[1]) ? "are" : "is"} ${m[1].toLowerCase()} ${m[2].toLowerCase()} ${m[3]} for anyone who wants some.`;
  if ((m = t.match(/^(interview|call|meeting|appointment|dentist) at ([\w:]+),? offline (?:till|until|til) ([\w:]+)[.!]*$/i))) return `I have ${/^[aeiou]/i.test(m[1]) ? "an" : "a"} ${m[1].toLowerCase()} at ${m[2]}, so I'll be offline until ${m[3]}.`;
  if ((m = t.match(/^(hotfix|fix|patch|release|update|build|deploy|newsletter|invoice) (?:is )?going out (at|in|by|today|tonight|tomorrow)(?: ([\w:]+))?[.!]*$/i))) return `The ${m[1].toLowerCase()} is going out ${m[2].toLowerCase()}${m[3] ? ` ${m[3]}` : ""}.`;
  if ((m = t.match(/^(retro|standup|stand-up|sync|demo|review|all-hands|1:1|one-on-one|offsite|kickoff|planning) (?:moved|is moved|got moved|pushed) to ([\w: ]+?)[.!]*$/i))) return `The ${m[1].toLowerCase()} moved to ${m[2]}.`;
  if ((m = t.match(/^(payroll|budget|billing|quick|benefits|expense|HR|legal|IT|design) question for you[.!?]*$/i))) return `I have ${/^[aeiou]/i.test(m[1]) && m[1] !== "HR" ? "an" : "a"} ${m[1].length <= 2 ? m[1] : m[1].toLowerCase()} question for you.`;
  if ((m = t.match(/^(client call|meeting|call|interview|standup|review) ran (?:long|over),? (\w+) more (?:min|mins|minutes)[.!]*$/i))) return `My ${m[1].toLowerCase()} ran long, so I need ${m[2]} more minutes.`;
  if ((m = t.match(/^((?:board |sales |client )?(?:deck|slides|draft|report|invoice|contract|proposal)(?: draft)?) (?:is )?in your inbox[.!]*$/i))) return `The ${m[1].toLowerCase()} is in your inbox.`;
  if (/^shipped!*$/i.test(t)) return "We shipped it!";
  if ((m = t.match(/^kid'?s (school|daycare|teacher|nurse) called,? (?:I )?(have to|need to|gotta|must) (.+?)[.!]*$/i))) return `My kid's ${m[1].toLowerCase()} called, so I need to ${m[3]}.`;
  if ((m = t.match(/^off to ([A-Z][\w ]+?) for (a week|two weeks|\d+ days|the week|a few days),? back (on |by )?(.+?)[.!]*$/))) return `I'm off to ${m[1]} for ${m[2]}, and I'll be back ${m[3] ?? ""}${m[4]}.`;
  if ((m = t.match(/^(?:I'm )?free after ([\w:]+)[.!]*$/i))) return `I'm free after ${m[1]}.`;
  if ((m = t.match(/^(?:thank you|thanks|ty),? (?:thank you|thanks|ty),? (?:I )?owe you (?:a|one|lunch|coffee|a coffee|a drink|big)\b(.*?)[.!]*$/i))) return `I really appreciate it. I owe you ${t.match(/owe you (.+?)[.!]*$/i)[1]}.`;
  if ((m = t.match(/^(?:I'm not sure(?: yet)?|I don't know|idk),? (?:maybe|possibly) (ping|ask|check with|talk to) (.+?)[.!?]*$/i))) return `I'm not sure. It might be worth ${ing(m[1].toLowerCase().split(" ")[0])}${m[1].includes(" ") ? " " + m[1].split(" ").slice(1).join(" ") : ""} ${m[2]}.`;
  if ((m = t.match(/^(.*\b)by like (\w+ (?:years?|months?|weeks?|days?))(.*)$/i))) return round11(`${m[1]}by about ${m[2]}${m[3]}`);
  if ((m = t.match(/^(that|the|this) (pitch|demo|presentation|talk|design|keynote|launch|deck) was (?:so |pretty |really )?(sick|fire|lit|killer)[.!]*$/i))) return `${cap1(m[1].toLowerCase())} ${m[2]} was excellent.`;
  if ((m = t.match(/^(?:the |our )?(new hire|new intern|intern|new guy|new engineer|new designer|[A-Z][a-z]+) is (?:an absolute |a total |a )?(beast|machine|monster|rockstar)[.!]*$/))) return `${/^[A-Z][a-z]+$/.test(m[1]) && !/^(?:New|The|Our)$/.test(m[1]) ? m[1] : `The ${m[1]}`} is incredibly productive.`;
  if ((m = t.match(/^(this|that|the) (spreadsheet|doc|document|deck|report|file|PR|pull request|ticket|migration|backlog) is (?:a |an absolute |a total )?(monster|beast|nightmare)[.!]*$/i))) return /nightmare/i.test(m[3]) ? t : `${cap1(m[1].toLowerCase())} ${m[2]} is huge.`;
  if ((m = t.match(/^(?:really |so |kind of |kinda |a little |a bit |honestly |super |pretty )?(frustrated|stressed|anxious|nervous|worried) (with|about|by) (.+?)[.!]*$/i))) return `I'm ${t.replace(/[.!]*$/, "").replace(/^kinda /i, "kind of ").replace(/^(\w)/, (c) => c.toLowerCase())}.`;
  if ((m = t.match(/^(?:really |so |I'm (?:really |so )?)?looking forward to (another|more|yet another) (.+?)[.!]*$/i))) return `I'm not excited about ${m[1].toLowerCase()} ${m[2]}.`;
  if (/^(?:I )?fixed!*\.?$/i.test(t)) return "It's fixed!";
  if ((m = t.match(/^(slides|deck|doc|docs|ticket|notes|tracker|wiki|readme|roadmap|dashboard|spreadsheet|agenda) (?:are |is |have been |has been )?updated[.!]*$/i))) return `I've updated the ${m[1].toLowerCase()}.`;
  if ((m = t.match(/^(?:my )?(mic|camera|headset|webcam|mouse|keyboard|charger|monitor)(?:'s| is)? (?:not working|isn't working|dead|broken|acting up)[.!]*$/i))) return `My ${m[1].toLowerCase()} isn't working.`;
  if ((m = t.match(new RegExp(String.raw`^(?:the )?(${R11_THING})(?:'s| is)? (down|broken|out|dead|offline) (in|on) ([\w ]+?)[.!]*$`, "i")))) return `The ${m[1].toLowerCase()} ${m[3].toLowerCase()} ${m[4]} is ${m[2].toLowerCase()}.`;
  if ((m = t.match(/^back (at|by|in) ([\w:]+)[.!]*$/i))) return `I'll be back ${m[1].toLowerCase()} ${m[2]}${/^in$/i.test(m[1]) && /^\d+$/.test(m[2]) ? " minutes" : ""}.`;
  if (/^almost there[.!]*$/i.test(t)) return "I'm almost there.";
  if ((m = t.match(/^(?:brb|be right back),?\s+((?:someone|somebody|the|my|need|have|phone|door|kid|dog|delivery|package)\b.+?)[.!]*$/i))) return `I'll be right back. ${cap1(m[1])}.`;
  if ((m = t.match(/^(coffee|lunch|snack|donut|boba) run\?*$/i))) return `Is anyone up for a ${m[1].toLowerCase()} run?`;
  if ((m = t.match(/^(?:wfh|working from home|I'm working from home) (today|tomorrow|monday|tuesday|wednesday|thursday|friday),? (?:the |a |an )?(internet guy|cable guy|plumber|electrician|repair person|technician|contractor|delivery|handyman) (?:is )?coming[.!]*$/i))) return `I'm working from home ${m[1]} because ${/^delivery$/i.test(m[2]) ? "a delivery is" : `${/^[aeiou]/i.test(m[2]) ? "an" : "a"} ${m[2].toLowerCase().replace(/ guy$/, " technician")} is`} coming.`;
  if ((m = t.match(/^(?:I'm )?running (\d+) ?(?:min|mins|minutes) (?:behind|late),? (parking|walking in|on my way|almost there)[.!]*$/i))) return `I'm running ${m[1]} minutes behind. I'm ${m[2].toLowerCase()} now.`;
  if ((m = t.match(/^(?:I'm )?at the ([\w ]+?) (?:till|until|til) ([\w:]+)[.!]*$/i))) return `I'm at the ${m[1]} until ${m[2]}.`;
  if ((m = t.match(/^my (internet|wifi|power|laptop) (?:is |went )?(down|out),? (?:so )?switching to (?:my )?(hotspot|phone|backup)[.!]*$/i))) return `My ${m[1].toLowerCase()} is ${m[2].toLowerCase()}, so I'm switching to my ${m[3].toLowerCase()}.`;
  if ((m = t.match(/^(?:my )?(internet|wifi|power) (?:is )?out at home,? (?:so )?coming (?:in)?to the office[.!]*$/i))) return `My ${m[1].toLowerCase()} is out at home, so I'm coming into the office.`;
  if ((m = t.match(/^on a (plane|flight|train) (.+?)[.!]*$/i))) return `I'll be on a ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^(?:pretty |really |so |a bit |kind of |kinda |super |totally )?(overwhelmed|swamped|slammed|exhausted|wiped out|burnt out|stressed|bored|tired) (today|this week|right now|lately|this month)[.!]*$/i))) return `I'm ${t.replace(/[.!]*$/, "").replace(/^kinda /i, "kind of ").replace(/^(\w)/, (c) => c.toLowerCase())}.`;
  if ((m = t.match(/^(?:the |that |this )?(meeting|call|day|week|workout|commute|workshop|offsite) (?:really |totally )?killed me[.!]*$/i))) return `${cap1(t.replace(/(?:really |totally )?killed me[.!]*$/i, "").trim())} wore me out.`;
  if ((m = t.match(/^off on (holiday|PTO|leave|vacation) (?:until|till|til) (.+?)[.!]*$/i))) return `I'm on ${/^pto$/i.test(m[1]) ? "PTO" : m[1].toLowerCase()} until ${m[2]}.`;
  if ((m = t.match(/^(pizza|cake|bagels|donuts|cookies|snacks|leftovers|tacos) in (\w+),? (?:come )?(?:grab|get|help yourself to) (?:some|one|it)[.!]*$/i))) return `There ${/s$/i.test(m[1]) ? "are" : "is"} ${m[1].toLowerCase()} in ${m[2]} for anyone who wants some.`;
  if ((m = t.match(/^signing off,? (?:I'll be )?back (monday|tuesday|wednesday|thursday|friday|tomorrow|next week|on [\w ]+?)[.!]*$/i))) return `I'm signing off now, and I'll be back ${m[1]}.`;
  if ((m = t.match(/^dropping (?:my )?(kid|kids|son|daughter) (?:off )?at (daycare|school|camp),? (?:online|in|back) by ([\w:]+)[.!]*$/i))) return `I'm dropping my ${m[1].toLowerCase()} off at ${m[2].toLowerCase()}, so I'll be online by ${m[3]}.`;
  if ((m = t.match(/^How about you\?,?\s+(.+?)[.?]*$/i))) return `How about you? ${cap1(m[1])}${/^(?:still|are|is|do|did|any|have)\b/i.test(m[1]) ? "?" : "."}`.replace(/^How about you\? Still /, "How about you? Are you still ");
  if ((m = t.match(/^because (.+?),? (we|I|you|they) (need|should|have to|must|will|can't|cannot)\b(.*?)[.!]*$/i))) return `Because ${m[1]}, ${m[2] === "I" ? "I" : m[2].toLowerCase()} ${m[3]}${m[4]}.`;
  if ((m = t.match(/^going on ((?:[\w-]+ )?(?:time off|pto|vacation|holiday|leave|sabbatical))\b,?\s*(.*?)[.!]*$/i))) { const what = /time off/i.test(m[1]) ? "taking time off" : `going on ${m[1].replace(/\bpto\b/i, "PTO")}`; const rest = m[2].replace(/^(from|on|next|this|until|till|for|starting|friday|monday|tuesday|wednesday|thursday)\b/i, (w) => w.toLowerCase()); const parts = rest.split(/,\s*/); const head = parts[0] && /^(?:from|on|next|this|until|till|for|starting|in|monday|tuesday|wednesday|thursday|friday|the)\b/i.test(parts[0]) ? ` ${parts.shift().replace(/\b(monday|tuesday|wednesday|thursday|friday)\b/gi, (d) => d[0].toUpperCase() + d.slice(1).toLowerCase()).replace(/\btill\b/i, "until")}` : ""; const tail = parts.map((p) => p.replace(/^back (\w+)$/i, (_x, d) => `I'll be back ${d[0].toUpperCase()}${d.slice(1).toLowerCase()}`)).map((p) => cap1(p)).join(". "); return `I'll be ${what}${head}.${tail ? ` ${tail}.` : ""}`; }
  if ((m = t.match(/^(?:I'm )?(?:out )?(?:on|off on) ((?:[\w-]+ )?(?:vacation|leave|pto|holiday|time off))\s+(?:till|until|til|through) ([\w ]+?)[.!]*$/i))) return `I'm on ${m[1].replace(/\bpto\b/i, "PTO").toLowerCase().replace(/pto/, "PTO")} until ${m[2].replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday)\b/gi, (d) => d[0].toUpperCase() + d.slice(1).toLowerCase())}.`;
  if ((m = t.match(/^off the grid ([\w ]+?),? (?:my )?phone (?:off|will be off)[.!]*$/i))) return `I'll be off the grid ${m[1]}, and my phone will be off.`;
  if ((m = t.match(/^(?:my )?(kid|son|daughter|dog|cat|partner|wife|husband|mom|dad)('s| has| is) ([\w ]+?),\s*(leaving early|logging off|heading out|working from home|wfh|signing off|stepping out)( today| now| early)?[.!]*$/i))) return `My ${m[1].toLowerCase()}${m[2] === "'s" ? " is" : m[2]} ${m[3]}, so I'm ${m[4].toLowerCase().replace(/^wfh$/, "working from home")}${m[5] ?? ""}.`;
  if ((m = t.match(/^(.+?),\s*(?:might be |may be |will be |I'll be )?slow to (reply|respond)[.!]*$/i))) return `${/^(?:moving|traveling|travelling|driving|packing|commuting|presenting|interviewing|onsite|on site)\b/i.test(m[1]) ? `I'm ${m[1]}` : cap1(m[1])}, so I may be slow to ${m[2].toLowerCase()}.`;
  if ((m = t.match(/^(?:I )?(got a flat(?: tire)?|missed my (?:bus|train)|car broke down[\w ]*|my car broke down[\w ]*|overslept),\s*(?:running|gonna be|going to be) (\d+) ?(?:min|mins|minutes) (?:late|behind)[.!]*$/i))) return `${/^(?:car|my car)/i.test(m[1]) ? `My ${m[1].replace(/^my /i, "")}` : `I ${m[1].replace(/^got a flat$/i, "got a flat tire")}`}, so I'm running ${m[2]} minutes late.`;
  if ((m = t.match(/^(snowed in|stuck at home|sick|under the weather|locked out|my [\w ]+? (?:flooded|is flooded|burst|broke|broke down|is broken|died|is out)|(?:the )?power(?:'s| is) out|my (?:car|heat) (?:broke|is broken))[.,]?\s*(?:wfh|working from home|remote|working remotely|online from home) ?(today|tomorrow|this week)?[.!]*$/i))) return `${/^my |^(?:the )?power/i.test(m[1]) ? cap1(m[1].replace(/^the /i, "")).replace(/^Power/, "The power") : `I'm ${m[1].toLowerCase()}`}, so I'm working from home${m[2] ? ` ${m[2].toLowerCase()}` : ""}.`;
  if ((m = t.match(/^locked out of ([\w ]+?)[.!]*$/i))) return `I'm locked out of ${m[1]}.`;
  if ((m = t.match(/^((?:doc|docs|deck|notes?|slides|file|files|link|invite|agenda|recording|summary|minutes|report|draft|proposal|contract)(?: from (?:the |today'?s? |this )?[\w ]+?)?) (shared|attached|sent|uploaded|posted|sent over)[.!]*$/i))) return `I've ${m[2].toLowerCase()} the ${m[1].charAt(0).toLowerCase() + m[1].slice(1)}.`;
  if ((m = t.match(/^(?:the )?(PR|branch|fix|patch|change|hotfix) (?:is )?merged,?\s*(deploying|testing|shipping|releasing)( now)?[.!]*$/i))) return `The ${/^pr$/i.test(m[1]) ? "PR" : m[1].toLowerCase()} is merged, and I'm ${m[2].toLowerCase()} it now.`;
  if ((m = t.match(new RegExp(String.raw`^(?:the )?(${R11_THING}) in (\w+) (?:is )?(busted|broken|down|dead|out)[.!]*$`, "i")))) return `The ${m[1].toLowerCase()} in ${m[2]} is ${/busted|dead/i.test(m[3]) ? "broken" : m[3].toLowerCase()}.`;
  if ((m = t.match(/^(?:my )?(shuttle|bus|train|flight|ride|uber|lyft|carpool)(?:'s| is)? (late|delayed|running late),?\s*(?:I'll be )?(?:in|there|here|online) by ([\w:]+)[.!]*$/i))) return `My ${m[1].toLowerCase().replace(/^uber$/, "Uber").replace(/^lyft$/, "Lyft")} is running late. I'll be in by ${m[3]}.`;
  if ((m = t.match(/^(?:the )?(coffee machine|printer|projector|wifi|vpn|elevator|dishwasher|fridge|microwave|ac|heat|badge reader|toilet|sink) (?:is )?(fixed|back up|working again)[.!]*$/i))) return `The ${m[1].toLowerCase().replace(/^ac$/, "AC").replace(/^vpn$/, "VPN")} is ${m[2].toLowerCase()}!`;
  if ((m = t.match(/^(?:my )?(meeting|call|standup|1:1|interview|workshop|class|appointment|dentist|doctor)(?: appointment)? ran (?:over|long),?\s*(?:joining |there |in )?(?:in )?(\d+)(?: ?(?:min|mins|minutes))?[.!]*$/i))) return `My ${/dentist|doctor/i.test(m[1]) ? `${m[1].toLowerCase()} appointment` : m[1].toLowerCase()} ran long. I'll be there in ${m[2]} minutes.`;
  if ((m = t.match(/^(?:I'm )?in a (meeting|call|session|workshop),?\s*(?:will |I'll )?(call|ping|text|message) you (after|later|back|in a bit)[.!]*$/i))) return `I'm in a ${m[1].toLowerCase()}. I'll ${m[2].toLowerCase()} you ${m[3].toLowerCase()}.`;
  if ((m = t.match(/^(free|around|available|online|reachable) (at|after|from|in|until|till) (.+?)[.!]*$/i))) return `I'm ${m[1].toLowerCase()} ${m[2].toLowerCase().replace(/^till$/, "until")} ${m[3]}.`;
  if ((m = t.match(/^(.+?),\s*(?:so )?(might|may) (lose you|drop off|drop|cut out|be late|be noisy|be loud|be slow|miss the start)[.!]*$/i)) && !/\b(?:so|and|but)\b/i.test(m[1])) return `${/^(?:internet|wifi|connection|power|signal)\b/i.test(m[1]) ? `My ${m[1]}` : cap1(m[1])}, so ${/^(?:be noisy|be loud)$/i.test(m[3]) ? "it" : "I"} ${m[2].toLowerCase()} ${m[3].toLowerCase()}.`;
  if ((m = t.match(/^(?:the |my )?(babysitter|nanny|sitter|daycare)(?:'s| is)? (canceled|cancelled|is closed|closed|fell through|sick|out sick),?\s*(?:on |I'm )?camera[- ]off today[.!]*$/i))) return `My ${m[1].toLowerCase()} ${/^(?:sick|closed|out sick)$/i.test(m[2]) ? `is ${m[2].toLowerCase()}` : m[2].toLowerCase()}, so I'll be off camera today.`;
  if ((m = t.match(/^(jury duty|training|onsite|travel|offsite|conference) ([\w ]+?),?\s*limited (availability|access)[.!]*$/i))) return `I have ${m[1].toLowerCase()} ${m[2]}, so my availability will be limited.`;
  if ((m = t.match(/^(.+?),\s*needs? (cleanup|work|a cleanup|a review|fixing|attention|more work|refactoring)[.!]*$/i)) && !/^(?:I|we)\b/i.test(m[1])) return `${cap1(m[1])}, and it needs ${m[2].toLowerCase()}.`;
  if ((m = t.match(/^(?:I'm )?stuck at the (airport|station|gate),?\s*(?:my )?(flight|train) (?:is )?delayed (\d+) ?(hrs?|hours?|mins?|minutes)[.!]*$/i))) return `I'm stuck at the ${m[1].toLowerCase()}. My ${m[2].toLowerCase()} is delayed ${m[3]} ${/^h/i.test(m[4]) ? (m[3] === "1" ? "hour" : "hours") : "minutes"}.`;
  if ((m = t.match(/^(?:I )?can't wait to (explain|tell|present|justify|walk) (.+?)[.!]*$/i)) && /\b(?:finance|legal|the ceo|the board|leadership|hr|my manager|the client|this|that)\b/i.test(m[2])) return `I'm not excited about ${m[1].toLowerCase()}ing ${m[2]}.`.replace(/explaining|explainng/, "explaining").replace(/presenting|presenting/, "presenting");
  if ((m = t.match(/^(?:so |super |really |such )?fun,? ((?:re)?\w+ing) (.+?)[.!]*$/i)) && SARC.test(t)) return `It's not fun ${m[1].toLowerCase()} ${m[2]}.`;
  if (!SARC.test(t) && (m = t.match(/^(honestly,? |tbh,? |to be honest,? )?((?:kinda |kind of |pretty |really |so |a bit |a little |weirdly |super |slightly |very )?)(burnt out|burned out|anxious|nervous|stoked|proud|frustrated|excited|stressed|worried|thrilled|grateful|relieved|annoyed)\b(.*?)[.!]*$/i))) return `${m[1] ? "Honestly, " : ""}I'm ${m[2].toLowerCase().replace(/^kinda /, "kind of ")}${m[3].toLowerCase().replace(/^stoked$/, "really excited")}${m[4]}.`.replace(/^Honestly, I'm/, "Honestly, I'm").replace(/I'm really really excited/, "I'm really excited").replace(/I'm so really excited/, "I'm so excited");
  if (/^I know, right\?$/.test(t)) return "I completely agree.";
  if ((m = t.match(/^(?:so |really |super )?glad I (came in|stayed late|showed up|drove in|got up early|woke up early|stayed up) (.+?)[.!]*$/i)) && SARC.test(m[2])) return `Unfortunately, I ${m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^thank you,? thank you\b,?\s*(.*)$/i))) return m[1] ? `Thanks so much, ${m[1]}` : "Thanks so much!";
  if ((m = t.match(/^(dinner|drinks|tea|boba|snacks|a walk|happy hour)\?$/i))) return `Is anyone up for ${m[1].toLowerCase()}?`;
  if ((m = t.match(/^(?:I )?(fixed|done|deployed|shipped|merged|sorted),?\s*finally[.!]*$/i))) return `It's ${m[1].toLowerCase()}, finally!`;
  if ((m = t.match(/^(deployed|shipped|merged|done|sent|submitted|published|live|released)!+$/i))) return `It's ${m[1].toLowerCase()}!`;
  if ((m = t.match(/^(?:I )?(shipped|deployed|pushed|released) to (prod|production|staging|main),?\s*(?:with )?no (errors|issues|problems)[.!]*$/i))) return `I ${m[1].toLowerCase()} to ${m[2].toLowerCase()} with no ${m[3].toLowerCase()}.`;
  if ((m = t.match(/^(rolled back|signed off on|wrapped up|closed out|filed|booked|submitted|reverted|patched|cleaned up) (.+?)(?:,\s*(investigating|monitoring|testing|looking into it)( now)?)?[.!]*$/i))) return `I ${m[1].toLowerCase()} ${m[2]}${m[3] ? `, and I'm ${m[3].toLowerCase()} now` : ""}.`;
  if ((m = t.match(/^(all )?(tests|checks|builds?) (green|passing|red|failing)\b(.*?)[.!]*$/i))) return `${m[1] ? "All " : "The "}${m[2].toLowerCase()} ${/s$/i.test(m[2]) ? "are" : "is"} ${m[3].toLowerCase()}${m[4]}.`;
  if ((m = t.match(/^(?:I'm )?(dealing with|handling) (.+?),\s*(?:so )?(?:I )?need to (step away|step out|log off|go|head out)[.!]*$/i))) return `I'm dealing with ${m[2].replace(/\bthing\b/, "matter")}, so I need to ${m[3].toLowerCase()}.`;
  if ((m = t.match(/^(.+?),\s*(?:I'll be )?in by ([\w:]+)[.!]*$/i)) && !/^(?:I|my shuttle|my bus|my train)\b/i.test(m[1])) { const c = m[1]; const appt = c.match(/^(?:I have (?:an? )?)?((?:eye )?doctor|dentist|vet|physio|therapy|appointment)(?: appointment)? at ([\w:]+)$/i); const veh = c.match(/^(?:my |the )?(bus|train|shuttle|car|ride) (?:broke down|is late|is delayed|delayed|got a flat)$/i); if (appt) return `I have ${/^appointment$/i.test(appt[1]) ? "an appointment" : `${/^eye/i.test(appt[1]) ? "an" : "a"} ${appt[1].toLowerCase()} appointment`} at ${appt[2]}. I'll be in by ${m[2]}.`; if (veh) return `My ${c.replace(/^(?:my |the )/i, "").replace(/^(\w)/, (x) => x.toLowerCase())}. I'll be in by ${m[2]}.`; }
  if ((m = t.match(/^new (laptop|monitor|phone|chair|desk|badge|keyboard|headset) (arrived|is here|came)[.!]*$/i))) return `My new ${m[1].toLowerCase()} arrived.`;
  if ((m = t.match(new RegExp(String.raw`^(?:the )?(${R11_THING})(?:'s| is)? (down|out|broken|dead|offline|busted)( again)?[.!]*$`, "i")))) return `The ${/^vpn$/i.test(m[1]) ? "VPN" : /^[A-Z]{2,}$/.test(m[1]) ? m[1] : m[1].toLowerCase()} is ${/busted|dead/i.test(m[2]) ? "broken" : m[2].toLowerCase()}${m[3] ?? ""}.`;
  if ((m = t.match(/^(launch|demo|meeting|sync|standup|call|review|retro|deadline|release|kickoff|offsite|interview|presentation|workshop|training)(?: has| got| is)? (moved|pushed|rescheduled|bumped) to (.+?)[.!]*$/i))) return `The ${m[1].toLowerCase()} has moved to ${m[3]}.`;
  if ((m = t.match(/^(doc|deck|file|notes|slides|recording|report|draft|spreadsheet)(?:'s| is| are) in (?:the )?(.+?)[.!]*$/i))) return `The ${m[1].toLowerCase()} ${/s$/i.test(m[1]) ? "are" : "is"} in the ${m[2]}.`;
  if ((m = t.match(/^(?:the )?(power|internet|wifi)(?:'s| is) out at home,?\s*(?:so )?(?:I'm )?on (mobile data|my phone|a hotspot|hotspot|my hotspot)[.!]*$/i))) return `${/^power$/i.test(m[1]) ? "The power" : `My ${m[1].toLowerCase()}`} is out at home, so I'm on ${m[2].replace(/^(?:a |my )?hotspot$/i, "my hotspot")}.`;
  if ((m = t.match(/^(?:sure|oh sure|sure thing),?\s*let's (have|schedule|book) (?:another|one more) ((?:meeting|sync|call|standup|offsite|review|retro|workshop)\b[^,]*?)[.!]*$/i))) return `I'm not sure we need another ${m[2].replace(/,\s*that'll .+$/i, "")}.`;
  if ((m = t.match(/^nothing says ([\w ]+?) like (.+?)[.!]*$/i))) return `${cap1(m[2])} doesn't really say ${m[1]}.`;
  if ((m = t.match(/^talk to you later,?\s*(?:so )?(?:I )?(?:gotta|got to|have to|need to|must) (.+?)[.!]*$/i))) return `I need to ${m[1].replace(/^run to pickup$/i, "run to school pickup")}, so I'll talk to you later.`;
  if (!SARC.test(t) && (m = t.match(/^((?:so |really |pretty |kinda |kind of |a bit |a little |super |very )?)(drained|sleepy|exhausted|wiped|bummed|swamped|happy|sad|tired|stressed|overwhelmed)\b(?! (?:\d|birthday|anniversary|holidays?|new year|friday|monday|hour|path|to help|to|work|new|belated|thanksgiving|halloween|easter|diwali|eid|hanukkah|valentine'?s?|mother'?s|father'?s)\b)(.*?)[.!]*$/i))) return `I'm ${m[1].toLowerCase().replace(/^kinda /, "kind of ")}${m[2].toLowerCase()}${m[3]}.`;
  if ((m = t.match(/^(honestly|frankly|tbh|to be honest),?\s+((?:so |really |pretty |kinda |kind of |a bit |a little |super |very )?)(drained|sleepy|exhausted|wiped|bummed|swamped|tired|stressed|overwhelmed)\b(.*?)[.!]*$/i))) return `Honestly, I'm ${m[2].toLowerCase().replace(/^kinda /, "kind of ")}${m[3].toLowerCase()}${m[4]}.`;
  return t;
}
export function round10(line) {
  let t = line, m;
  if ((m = t.match(/^(\d+) ?(?:min|mins|minutes)[.!]*$/i))) return `Give me ${m[1]} minutes.`;
  if (/^quick question[.!?]*$/i.test(t)) return "I have a quick question.";
  // Round 10b: one-word chat fragments get a full sentence.
  if ((m = t.match(/^(?:one|a|1) (?:sec|second|moment|min|minute)[.!]*$/i))) return /min/i.test(m[0]) ? "I'll be with you in a minute." : "I'll be with you in a second.";
  if ((m = t.match(/^(\d+) ?(?:sec|secs|seconds)[.!]*$/i))) return `I'll be with you in ${m[1]} seconds.`;
  if (/^(?:all set|all good|good to go)[.!]*$/i.test(t)) return "I'm all set.";
  // Round 10c: more chat fragments (fresh22 leftovers).
  if (/^(?:have a (?:good|great|nice) one|have a good (?:day|night|evening))[.!]*$/i.test(t)) return `${t.replace(/[.!]*$/, "")[0].toUpperCase() + t.replace(/[.!]*$/, "").slice(1)}!`;
  if ((m = t.match(/^(?:I'll |I will |will )?circle back (?:by |at |before )?(eod|end of day|tomorrow|today|this afternoon|monday|tuesday|wednesday|thursday|friday|later)[.!]*$/i))) return `I'll circle back ${/^eod$/i.test(m[1]) ? "by EOD" : /^(?:today|tomorrow|later|this afternoon)$/i.test(m[1]) ? m[1].toLowerCase() : `on ${m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()}`}.`;
  if ((m = t.match(/^(?:I'm )?(logging off|signing off|heading out|off) now,?\s*(see you|talk to you|ttyl|back) (tomorrow|monday|later|after the weekend)[.!]*$/i))) return `I'm ${m[1].toLowerCase() === "off" ? "heading out" : m[1].toLowerCase()} now. See you ${m[3].toLowerCase().replace(/^monday$/, "Monday")}.`;
  if ((m = t.match(/^cc'?ing ([A-Z][\w-]*)(.*?)[.!]*$/))) return `I'm copying ${m[1]}${m[2]}.`;
  if ((m = t.match(/^(?:just kidding|jk|kidding),?\s+(.+?)[.!]*$/i))) return `I was joking. ${m[1][0].toUpperCase() + m[1].slice(1)}.`;
  if ((m = t.match(/^(?:offline|away|afk),?\s*(\d+)\s*(?:min|mins|minutes)[.!]*$/i))) return `I'll be away for ${m[1]} minutes.`;
  if ((m = t.match(/^(?:out of office|ooo|out)\s+(.+?),\s*back (?:on |in )?(.+?)[.!]*$/i))) return `I'm out of office ${m[1]}, and I'll be back ${/^(?:the |on |in |next |monday|tuesday|wednesday|thursday|friday)/i.test(m[2]) ? "" : "on "}${m[2]}.`;
  if ((m = t.match(/^(?:brb|be right back),?\s*(?:grabbing |getting )?(?:a )?(coffee|water|lunch|snack|tea|phone call|call|bathroom|restroom)[.!]*$/i))) return `I'll be right back. ${/call/i.test(m[1]) ? "I'm taking a phone call" : /bathroom|restroom/i.test(m[1]) ? "I'm stepping away for a moment" : `I'm grabbing ${/lunch|water|tea/i.test(m[1]) ? m[1].toLowerCase() : `a ${m[1].toLowerCase()}`}`}.`;
  if ((m = t.match(/^(?:gonna|going to) grab (?:a )?(coffee|tea|water|snack|lunch),?\s*(?:brb|be right back)[.!]*$/i))) return `I'm going to grab ${/lunch|water|tea/i.test(m[1]) ? m[1].toLowerCase() : `a ${m[1].toLowerCase()}`}. I'll be right back.`;
  if ((m = t.match(/^(?:idc|I don't care),?\s+(which|what|where|when|who|if|whether|how)\b(.*?)[.!]*$/i))) return `I don't mind ${m[1].toLowerCase()}${m[2]}.`;
  if ((m = t.match(/^(?:idc|I don't care),?\s*(either works|either way|whatever works|up to you)[.!]*$/i))) return `I don't mind. ${m[1][0].toUpperCase() + m[1].slice(1)}.`;
  if ((m = t.match(/^(parking|boarding|landing|driving|walking over|in the elevator|coming up|logging in|joining)( now)?[.!]*$/i))) return `I'm ${m[1].toLowerCase()}${m[2] ?? ""}.`;
  if ((m = t.match(/^(?:I'm |I am )?(?:on my way|omw|heading over|leaving now|stuck (?:in traffic|on (?:another|a) call)|in traffic|running late|wrapping up(?: a call)?),?\s*(\d+)\s*(?:min|mins|minutes)[.!]*$/i))) { const what = t.replace(/,?\s*\d+\s*(?:min|mins|minutes)[.!]*$/i, "").replace(/^(?:I'm |I am )/i, "").replace(/^omw$/i, "on my way").toLowerCase(); return `I'm ${what}. I'll be there in ${m[1]} minutes.`; }
  if ((m = t.match(/^(?:I )?missed my (train|bus|flight|ride),?\s*(?:I'll |will )?be (?:there|in) (?:by|at|around) ([\w:]+)[.!]*$/i))) return `I missed my ${m[1].toLowerCase()}, so I'll be there by ${m[2]}.`;
  if ((m = t.match(/^(.+?),\s*(migraine|headache|fever|the flu|flu|a cold|cold|stomach bug|sick kid|kid is sick|food poisoning|back pain)[.!]*$/i)) && /\b(?:home|early|out|off|sick|leaving|logging off|skip\w*)\b/i.test(m[1])) return `${m[1]} because of ${/^(?:the |a |sick kid|kid is sick|back pain|food poisoning)/i.test(m[2]) ? (/^kid is sick$/i.test(m[2]) ? "a sick kid" : m[2].toLowerCase()) : `a ${m[2].toLowerCase()}`}.`;
  t = t.replace(/,\s*(?:anyone|anybody) (?:want|wanna|up for) (lunch|coffee|food|pizza|tacos|a coffee|a walk)\??[.!]*$/i, (_x, f) => `. Is anyone up for ${f.toLowerCase()}?`);
  if ((m = t.match(/^(?:I )?(?:just |really |absolutely )?love (working|being|spending|doing|having|getting|starting|staying) (.+?)[.!]*$/i)) && /\b(?:saturday|sunday|weekend|midnight|night|7am|6am|8am|holiday|vacation|pto|late|again|another)\b/i.test(m[2])) return `I'm not thrilled about ${m[1].toLowerCase() === "working" ? "having to work" : m[1].toLowerCase()} ${m[2]}.`;
  if ((m = t.match(/^(?:hi|hey|hello),?\s*(team|all|everyone|folks|y'all|guys|people)[.!]*$/i))) return `Hi, ${/^(?:team|all|everyone)$/i.test(m[1]) ? m[1].toLowerCase() : "everyone"}!`;
  if ((m = t.match(/^(?:good )?(morning|afternoon|evening),?\s*(team|all|everyone|folks|y'all|guys|people)?[.!]*$/i))) return `Good ${m[1].toLowerCase()}, ${m[2] && !/^(?:guys|y'all|folks|people)$/i.test(m[2]) ? m[2].toLowerCase() : "everyone"}!`;
  if ((m = t.match(/^(?:brb|be right back),?\s*(\d+)(?: ?(?:min|mins|minutes))?[.!]*$/i))) return `I'll be back in ${m[1]} minutes.`;
  if ((m = t.match(/^(?:I'm )?(?:on )?(?:pto|ooo|off)\s+((?:next |this )?(?:monday|tuesday|wednesday|thursday|friday|week|today|tomorrow))(?:,?\s*(?:fyi|btw))?[.!]*$/i))) return `I'm ${/pto/i.test(m[0]) ? "on PTO" : /ooo/i.test(m[0]) ? "out of office" : "off"} ${m[1].toLowerCase().replace(/\b(monday|tuesday|wednesday|thursday|friday)\b/, (d) => d[0].toUpperCase() + d.slice(1))}.`;
  if (/^(?:so,? )?what do you think[.!?]*$/i.test(t)) return "What do you think?";
  if ((m = t.match(/^(?:what do you think|wdyt)(?:\?)?,?\s+(about|of|on) (.+?)[.!?]*$/i))) return `What are your thoughts on ${m[2]}?`;
  if ((m = t.match(/^(?:my )?(train|bus|flight|subway|ferry|car|uber|cab|ride)(?:'s| is)? (delayed|late|stuck|broke down|is broken down|canceled|cancelled)[.,]?\s*(?:so )?(?:I'm |I'll be )?(?:(\d+) ?(?:min|mins|minutes) (?:late|behind(?: schedule)?)|landing at ([\w:]+)(?: now)?|(?:arriving|getting in|there) (?:at|by) ([\w:]+)(?: now)?)[.!]*$/i))) {
    const v = m[2].toLowerCase().replace(/^is broken down$/, "broke down");
    const head = `My ${m[1].toLowerCase()} ${/broke/.test(v) ? "broke down" : `is ${v}`}`;
    if (m[3]) return `${head}, so I'll be ${m[3]} minutes late.`;
    if (m[4]) return `${head}. I'm now landing at ${m[4]}.`;
    return `${head}. I'm now arriving at ${m[5]}.`;
  }
  // Sarcastic "love when the wifi drops": only when the event is clearly bad.
  if ((m = t.match(/^(?:I |gotta |just |don't you just )*love (?:it )?(when|that) (.+?)[.!]*$/i)) && /\b(?:drops?|dropped|breaks?|broke|crash\w*|is off|are off|down|dies|died|freez\w*|lag\w*|cancel\w*|late|again|fails?|failed|stuck|broken|mid-call|mid-meeting|at 8|at 7|at 6|on a (?:friday|saturday|sunday)|weekend|no one|nobody|ignores?|forgot)\b/i.test(m[2])) return m[1].toLowerCase() === "that" ? `I'm not thrilled that ${m[2]}.` : `I'm not thrilled ${m[1].toLowerCase()} ${m[2]}.`;
  t = t.replace(/\bcrapp(?:ed|ing) out\b/gi, (x) => (/ing/i.test(x) ? "dying" : "died")).replace(/\bcraps out\b/gi, "dies").replace(/^(train|bus|flight|car|laptop|phone|wifi|internet|vpn|server|printer|build)\b(?= (?:is|was|broke|died|crashed|delayed|keeps))/i, (x) => `The ${/^(?:vpn)$/i.test(x) ? x.toUpperCase() : x.toLowerCase()}`);
  // Sarcasm openers that say the opposite.
  if ((m = t.match(/^(?:I'm )?(?:so|really|just|absolutely|super) (?:thrilled|excited|happy|delighted|glad|pumped) to (?:be on|be in|have|do|sit through|attend|get|go through|start) (?:another|yet another|one more) (.+?)[.!]*$/i))) return `I'm not thrilled about another ${m[1]}.`;
  if ((m = t.match(/^(?:wow|whoa|oh wow)?,?\s*(the [\w-]+(?: [\w-]+)?) (?:actually |finally )?(works?|worked|is working|loaded|started)\b,?\s*(?:mark the calendar|alert the press|call the press|stop the presses|someone mark the calendar|it's a miracle|a miracle|miracles happen)[.!]*$/i))) return `${m[1][0].toUpperCase() + m[1].slice(1)} finally ${/^work|is working/i.test(m[2]) ? "works" : m[2].toLowerCase()}, which is rare.`;
  t = t.replace(/^I'm (?:so |totally |completely )?done for (?:today|the day)\b/i, "I'm done for the day").replace(/^I'm (?:so|totally|completely) done for the week\b/i, "I'm done for the week");
  if ((m = t.match(/^(?:my )?(train|bus|flight|subway|ferry|uber|cab|ride)(?:'s| is)? (?:delayed|late|stuck)(?:,|\.)?\s*(?:I'm |I'll be |will be |so )?(\d+) ?(?:min|mins|minutes) (?:late|behind schedule|behind)[.!]*$/i))) return `My ${m[1].toLowerCase()} is delayed, so I'll be ${m[2]} minutes late.`;
  if ((m = t.match(/^good news,?:?\s+(.+?),\s*(?:but )?(?:the )?bad news,?:?\s+(.+?)[.!]*$/i))) return `Good news: ${m[1]}. Bad news: ${m[2]}.`;
  if ((m = t.match(/^((?:could|can|would) you (?:please )?[^,?]+?),\s*(it|it's|that|this|the \w+|they|I|we) ([^?]+?)\??$/i)) && !/^(?:please|thanks|thank you)$/i.test(m[3])) return `${m[1]}? ${m[2] === "I" ? "I" : m[2][0].toUpperCase() + m[2].slice(1)} ${m[3]}.`;
  t = t
    .replace(/^I give up on\b/i, "I'm giving up on")
    .replace(/\bbored out of (?:my|his|her|their|our) (?:skull|mind|head|brains|gourd)\b/gi, "extremely bored")
    .replace(/\b(is|are|was|were) (?:totally |completely )?useless (?:crap|garbage|junk|shit|trash)\b/gi, "$1 useless")
    .replace(/^still (\w+ing)\b/i, "I'm still $1")
    .replace(/^(debugging|investigating|looking into|fixing|testing|reviewing|writing|drafting|finishing|wrapping up|cleaning up|refactoring|deploying|rebasing)\b/i, (x) => `I'm ${x.toLowerCase()}`)
    .replace(/^not (joining|coming|going|attending|making it|presenting|doing)\b/i, "I'm not $1")
    .replace(/,\s*(?:a |it was a |what a )?(?:total|complete|absolute|utter) (shitshow|shit show|mess|disaster|clusterfuck|dumpster fire|train wreck|trainwreck|circus)\s*[.!]*$/i, ". It was a total $1.")
    .replace(/\bslack(?:ing)? off\b/gi, (x) => (/ing/i.test(x) ? "taking it easy" : "take it easy"))
    .replace(/\bmess(?:ing)? around\b/gi, (x) => (/ing/i.test(x) ? "killing time" : "kill time"));
  return t;
}

export function round9(line) {
  let t = line, m;
  if ((m = t.match(/^have an? (good|great|nice|lovely|restful) (weekend|evening|holiday|break)(?:,? (?:all|everyone|team|folks|y'all|guys))?[.!]*$/i))) return `Have a ${m[1].toLowerCase()} ${m[2].toLowerCase()}, everyone!`;
  // Subjectless chat fragments get their "I" back so every level reads as a sentence.
  t = t
    .replace(/^(?:gonna|going to) (?=[a-z])/i, "I'm going to ")
    .replace(/^thinking (of|about) /i, "I'm thinking $1 ")
    .replace(/^(?:might|may) just /i, (x) => `I ${x.toLowerCase()}`)
    .replace(/^((?:sorry|apologies|my bad|oops),?\s+)(totally |completely |just )?forgot\b/i, "$1I $2forgot")
    .replace(/^(?:pretty much |basically )?done for (the day|the week|today)\b/i, (x) => `I'm ${x.toLowerCase()}`)
    .replace(/^(no|nope|nah),?\s+not (\w+ing)\b/i, (_x, n, g) => `${n === "nah" ? "No" : cap1(n)}, I'm not ${g}`)
    .replace(/^(slacking off|coasting|disappearing|chilling|phoning it in|pretending)\b/i, "I'm $1")
    .replace(/^(no|nope|nah|sorry|unfortunately),?\s+(can't|won't|cannot|will not)\b/i, (_x, n, v) => `${/^n/i.test(n) ? "No" : cap1(n.toLowerCase())}, I ${v}`)
    .replace(/^(.*\b(?:is|was|got|are|were|'s)\b[^,]*),\s*(will not|won't|can't|cannot) (make|be|join|attend)\b/i, "$1, so I $2 $3")
    .replace(/,\s*no energy\b/i, ", and I have no energy")
    .replace(/,\s*didn't (sleep|eat)\b/i, " because I didn't $1")
    .replace(/,\s*(kid|son|daughter|dog|wife|husband|partner) (is|has)\b/i, " because my $1 $2")
    .replace(/,\s*(?:have|got) (a|an) (flight|appointment|dentist appointment|doctor's appointment|train to catch)\b/i, " because I have $1 $2")
    .replace(/\bbeing a (?:total |real |complete |huge )?pain(?: in the (?:ass|butt|neck))?\b/i, "being very difficult")
    .replace(/\bcringe as (?:fuck|hell|shit)\b/i, "really awkward").replace(/\b(really|so|super) cringe\b/i, "$1 awkward")
    .replace(/\s+like you wouldn't believe\b/i, " so badly");
  const end = (x) => (/[.!?]$/.test(x) ? x : `${x}.`);
  if ((m = t.match(/^(?:the )?(contract|deal|PO|invoice|SOW|NDA|offer|PR|budget)(?: with ([A-Z][\w&.-]*))? (signed|paid|approved|closed|sent|merged|done)(?: with ([A-Z][\w&.-]*))?[.!]*$/i))) {
    const n = /^(?:po|sow|nda|pr)$/i.test(m[1]) ? m[1].toUpperCase() : m[1].toLowerCase();
    const w = m[2] ?? m[4];
    return `The ${n}${w ? ` with ${w}` : ""} is ${m[3].toLowerCase()}.`;
  }
  if ((m = t.match(/^(slides|deck|report|draft|notes|tests|docs|deploy|release|migration|backlog)\s+(done|finished|ready|shipped)[.!]*$/i))) return `The ${m[1].toLowerCase()} ${/s$/.test(m[1]) && !/ss$/.test(m[1]) ? "are" : "is"} ${m[2].toLowerCase()}.`;
  if ((m = t.match(/^(?:my )?pr (?:is )?up for review[.!]*$/i))) return "My PR is up for review.";
  if ((m = t.match(/^(?:the |my |our )?((?:[A-Za-z][\w-]* ){0,2}[A-Za-z][\w-]*) (sent|fixed|merged|deployed|shipped|done|updated|uploaded|booked|submitted|approved|closed|resolved|filed|scheduled|signed|paid|cancell?ed|canceled|published|posted|delivered|finished|completed|renewed|reverted|rolled back)[.!]*$/i)) && !/^(?:i|we|you|they|he|she|it|this|that|all|everything|nothing|just|got|get|been|be|is|are|was|were|has|have|had)$/i.test(m[1].split(" ")[0]) && !/\b(?:is|are|was|were|has|have|had|got|not|never)\b/i.test(m[1])) {
    const n = /^(?:pr|po|sow|nda|qa|api|ui|ux)$/i.test(m[1]) ? m[1].toUpperCase() : m[1];
    const pl = /s$/i.test(n) && !/(?:ss|us|is)$/i.test(n) && !/^(?:status|news|analysis)$/i.test(n);
    if (/^done$/i.test(m[2])) return `The ${n} ${pl ? "are" : "is"} done.`;
    return `The ${n} ${pl ? "have" : "has"} been ${m[2].toLowerCase()}.`;
  }
  if ((m = t.match(/^(?:i'll |i will |will )?be (there|back|online|on|in|out|over) in (\d+)(?: ?(min(?:ute)?s?|mins|sec(?:ond)?s?|hours?|hrs?))?,\s*(parking|driving|walking over|on my way|in the elevator|grabbing coffee)[.!]*$/i))) return `I'll be ${m[1].toLowerCase()} in ${m[2]} minutes. ${/^on my way$/i.test(m[4]) ? "I'm on my way" : `I'm ${m[4].toLowerCase()}`}.`;
  if ((m = t.match(/^(?:i'll |i will |will )?be (there|back|online|on|in|out|over) in (\d+)(?: ?(min(?:ute)?s?|mins|sec(?:ond)?s?|hours?|hrs?))?[.!]*$/i))) return `I'll be ${m[1].toLowerCase()} in ${m[2]} ${/^h/i.test(m[3] ?? "") ? "hours" : /^s/i.test(m[3] ?? "") ? "seconds" : "minutes"}.`.replace(/in 1 (hours|minutes|seconds)/, (x, u) => `in 1 ${u.slice(0, -1)}`);
  if ((m = t.match(/^back in (\d+)(?: ?(min(?:ute)?s?|mins))?[.!]*$/i))) return `I'll be back in ${m[1]} minutes.`;
  if ((m = t.match(/^(?:i'm |i am )?not feeling it( today| this morning| this week)?(?:,\s*|\.\s+|$)(.*)$/i))) return `I'm low on energy${m[1] ?? ""}.${m[2] ? ` ${m[2].replace(/^working from bed/i, "I'm working from bed")}` : ""}`;
  if ((m = t.match(/^(?:i )?can't be bothered (?:with|to do) (.+?)(?: (today|tomorrow|this week))?[.!]*$/i))) return `I don't have the energy for ${m[1]}${m[2] ? ` ${m[2]}` : ""}.`;
  if ((m = t.match(/^(skipping|going home|heading out|heading home|leaving|logging off|signing off|stepping away|stepping out|grabbing|working from|taking|bailing on)\b(.*)$/i))) return `I'm ${m[1].toLowerCase()}${m[2]}`;
  if ((m = t.match(/^call in (\d+)(?: ?min(?:ute)?s?)?[.!]*$/i))) return `The call starts in ${m[1]} minutes.`;
  if ((m = t.match(/^(meeting|standup|sync|call) (?:moved|pushed) to (\S+?)[.!]*$/i))) return `The ${m[1].toLowerCase()} moved to ${m[2]}.`;
  if ((m = t.match(/^out (today|tomorrow|this afternoon|monday|tuesday|wednesday|thursday|friday|next week)[.!]*$/i))) return `I'm out ${m[1]}.`;
  if (/^all good now[.!]*$/i.test(t)) return "Everything is good now.";
  if ((m = t.match(/^(?:my )?(train|bus|flight|subway|ferry)(?:'s| is) (?:delayed|late|stuck),? (?:I'll |will )?be there in (\d+)(?: ?min(?:ute)?s?)?[.!]*$/i))) return `My ${m[1].toLowerCase()} is delayed. I'll be there in ${m[2]} minutes.`;
  if ((m = t.match(/^(?:gonna|going to|I'm gonna|I'm going to|I'll) be late (?:to|for) (.+?)[.!]*$/i))) return `I'm going to be late for ${m[1]}.`;
  if (/^on it[.!]*$/i.test(t)) return "I'm on it.";
  if (/^lunch\?+$/i.test(t)) return "Does anyone want lunch?";
  if ((m = t.match(/^(?:does )?any ?(?:one|body) want (lunch|coffee|pizza|tacos|food|a coffee)\?*$/i))) return `Does anyone want ${m[1].toLowerCase()}?`;
  if ((m = t.match(/^accepting the offer from ([A-Z][\w&.-]*)(.*)$/))) return `I'm accepting the offer from ${m[1]}${m[2]}`;
  t = t.replace(/\bwith no (errors|issues|problems|downtime)\b/gi, "with zero $1");
  return t;
}

export function prepass(clean, nested = false) {
  // Line by line so lists keep their shape. Only prose lines are touched.
  return clean.split("\n").map((line) => {
    if (/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/.test(line) || !line.trim()) return line;
    const lead = line.match(/^\s*/)[0];
    let t = round6(round7(round8(round9(round10(round11(fixNamesAndTools(line.trim()))))))).replace(/\bbug (you|me|him|her|them)\b/gi, "bother $1").replace(/^(fun|classic|great|awesome|perfect|lovely|wonderful|cool|nice|brilliant)[.!]+\s+(?=[a-z])/i, "$1, ");
    const sents = t.split(/(?<=[.!?])\s+(?=[A-Za-z])/);
    t = sents.map((s, i) => {
      const sar = desarcasm(s);
      if (sar) return sar;
      const ap = splitApology(s);
      if (ap) return ap;
      s = s.replace(/^(?:heads up|heads-up|fyi|psa)[,:-]?\s+/i, "");
      let mm;
      const glued = nested ? null : splitGlued(s);
      if (glued) return prepass(glued, true);
      // Round 4 general forms.
      // "no (fucking) way we ship friday" means it won't happen, not amazement.
      if ((mm = s.match(/^no (?:\w+ )?way,? (we|I|they|you|he|she|it|this|that) (?!(?:won|got|did|made|hit|closed|finished|actually)\b)([a-z]+)\b(.*?)[.!]*$/i)) && !/ed$/i.test(mm[2])) {
        const aux = /^(?:is|are|am|was|were|will|would|can|could|should|'s|'re)$/i.test(mm[2]);
        return `I don't think ${mm[1] === "I" ? "I" : mm[1].toLowerCase()} ${aux ? mm[2] : `can ${mm[2]}`}${mm[3]}.`;
      }
      // "X is garbage" for any subject.
      if ((mm = s.match(/^(.{3,60}?) (is|are|was|were) (?:total |complete |absolute |utter |pure )?(?:garbage|trash|rubbish|junk|crap|shite?)[.!]*$/i)) && !/^(?:this|that|the)(?: new| old| latest| current)? (?:meeting|call|sync|plan|process|policy|idea|decision|code|doc|deck|report|design|email|update|review|rule|strategy|spreadsheet)$/i.test(mm[1])) {
        const pl = /^(?:are|were)$/i.test(mm[2]);
        return `I think ${lowFirst(mm[1])} ${pl ? "need" : "needs"} significant work.`;
      }
      if ((mm = s.match(/^no (?:\w+ )?way,? (I'm|we're|they're|he's|she's|it's) (.+?)[.!]*$/i))) return /^I'm$/i.test(mm[1]) ? `I won't be ${mm[2]}.` : `I don't think ${mm[1].toLowerCase()} ${mm[2]}.`;
      // Subject dropped before a first-person verb: "finally got the cert renewed", "nope, can't approve that".
      if ((mm = s.match(/^((?:no|nope|sorry|yeah|yep|ok|okay),? )?(?:just |finally |already )?(can't|cannot|couldn't|won't|don't|didn't)\s+(approve|sign|do|make|help|support|attend|join|commit|find|access|open|reproduce|see|log|get)\b(.*)$/i))) {
        const lead = mm[1] ? `${cap(mm[1].replace(/,?\s*$/, "").replace(/^nope$/i, "no").replace(/^yep$/i, "yes"))}, ` : "";
        return `${lead}${lead ? "I" : "I"} ${mm[2].toLowerCase() === "cannot" ? "can't" : mm[2].toLowerCase()} ${mm[3]}${mm[4]}`;
      }
      if ((mm = s.match(/^(finally |just |already )?(got|upgraded|updated|fixed|finished|renewed|merged|deployed|submitted|booked|filed|sent|wrapped up|cleaned up|migrated|rebuilt|restarted|rebooted)\s+(.+)$/i)) && !/^got (?:it|this|that|you)\b/i.test(mm[2] + " " + mm[3])) {
        s = `I ${(mm[1] ?? "").toLowerCase()}${mm[2].toLowerCase()} ${mm[3]}`.replace(/, took (?:forever|ages)$/i, ". It took a long time").replace(/, (?:took|it took) (a while|all day|all week|all morning|hours|days)$/i, ". It took $1");
      }
      // "someone order more coffee" / "need someone to cover my shift" -> a request to someone.
      if ((mm = s.match(/^(someone|somebody|anyone|anybody)(?: please)? ([a-z]+)\b(.*?)[.!?]*$/i)) && !/(?:ed|s)$/i.test(mm[2]) && !/^(?:is|was|has|had|did|does|know|knows|else|here|there|who|from|in|on|at|can|could|will|would|should|have|already|just|still|keeps|broke|took|left|got|ate|stole|drank|threw|wrote|made|sent|said|told|knew|forgot|lost|found|put|hit|ran|spilled|spilt|unplugged|swiped|borrowed|stole|won|sold|bought|brought|keyed|parked|did|never|always|really|actually|probably|definitely)$/i.test(mm[2])) return `Could someone ${mm[2].toLowerCase()}${mm[3]}?`;
      if ((mm = s.match(/^(?:I )?(?:need|want) (someone|somebody|a volunteer|a hand|help) (?:to )?(cover|take|run|handle|watch|review|grab|check|look at|pick up|join)\b(.*?)[.!]*$/i))) return `Could someone ${mm[2]}${mm[3]}?`;
      // "quit leaving dishes" means stop.
      s = s.replace(/^(?:please )?quit ([a-z']+ing)\b/i, "stop $1");
      // Bare "pass on X" is a decline.
      if ((mm = s.match(/^(?:I'll |gonna |going to |I'm going to |I'm gonna )?pass on (?:the )?(.+?)[.!]*$/i))) return /^\w+ing\b/i.test(mm[1]) ? `I'll pass on ${mm[1]}.` : `I'll pass on the ${mm[1].replace(/^the /i, "")}.`;
      // "refund approved, let the customer know" -> status + request.
      if ((mm = s.match(/^(?:the )?([a-z][\w -]{2,30}?) (approved|done|merged|shipped|fixed|sent|signed|confirmed|booked|ready),\s*(let|tell|ping|email|update|notify|ask|loop in|cc) (.+?)[.!]*$/i))) return `The ${mm[1]} is ${mm[2].toLowerCase()}. Could you ${mm[3].toLowerCase()} ${mm[4]}?`;
      // "office closed monday for the holiday": a place closed on a day is a schedule, not past news.
      s = s.replace(/^(?:the )?((?:[a-z]+ )?(?:office|store|building|warehouse|site|kitchen|gym|cafeteria|canteen|lab|lot|garage|floor|lobby|elevator)) (?:is )?closed (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week)\b/i, (_m, place, day) => `the ${place.toLowerCase()} is closed ${day}`);
      if (/^(?:no clue|no idea|dunno|idk|not a clue)[.!]*$/i.test(s)) return "I'm not sure.";
      s = s.replace(/^(thinking|considering|planning|hoping|looking|trying|working|heading|waiting) (about|to|on|for|into|out|over|home)\b/i, (m) => `I'm ${m.toLowerCase()}`);
      // "no clue why" -> "I'm not sure why".
      s = s.replace(/^(?:no clue|no idea|not a clue|dunno|idk),? (why|how|what|when|where|who|if|whether)\b/i, "I'm not sure $1");
      // "no budget for new hires this year" -> full sentence.
      if ((mm = s.match(/^no (budget|headcount|funding|money) for (.+?)[.!]*$/i))) return `There's no ${mm[1].toLowerCase()} for ${mm[2]}.`;
      // "I'm quitting, last day is the 30th" -> two sentences with an owner.
      s = s.replace(/^I'm (quitting|resigning|leaving|out|moving on),\s*(?:my )?last day (is|will be)\b/i, (_m, v, b) => `I'm ${v === "quitting" ? "resigning" : v}. My last day ${b}`);
      // "running 15 late" -> minutes.
      s = s.replace(/\brunning (\d{1,2}) (late|behind)\b/i, "running $1 minutes $2");
      // "good job everyone, great quarter" -> one praise sentence.
      if ((mm = s.match(/^(?:good|great|nice|awesome) (job|work),? (everyone|all|team|folks|y'all|guys)(?:,|!| on)? (?:a |the )?(?:great|good|awesome|amazing|strong|solid|record) ([a-z]+)[.!]*$/i))) return `Great ${mm[1].toLowerCase()}, everyone, on a great ${mm[3].toLowerCase()}!`;
      // "X handled the outage like pros" and "killer job" are praise.
      s = s.replace(/\blike (?:a )?(?:pros?|champs?|bosses|a boss|rock ?stars?|legends?)\b/i, "really well").replace(/\b(?:killer|bang-up|cracking) job\b/i, "great job");
      if ((mm = s.match(/^(this|that|the) (meeting|call|sync|plan|process|policy|idea|decision|code|doc|deck|report|design|email|update|review) is (?:total |complete |absolute |pure )?(?:bullshit|bs|garbage|trash|junk|rubbish|crap|pointless|useless)[.!]*$/i))) {
        const n = mm[2].toLowerCase();
        return /^(?:meeting|call|sync|review)$/.test(n) ? `I don't think ${mm[1].toLowerCase()} ${n} is a good use of our time.` : `I think ${mm[1].toLowerCase()} ${n} needs significant work.`;
      }
      if ((mm = s.match(/^(?:screw it|fuck it|whatever|eh),? (ship|send|merge|launch|post|push|publish|release) it[.!]*$/i))) return `Let's go ahead and ${mm[1].toLowerCase()} it.`;
      if ((mm = s.match(/^no idea,? ask ([A-Z][a-z]+)[.!]*$/))) return `I'm not sure. ${mm[1]} may know.`;
      s = s.replace(/,\s*no idea[.!]*$/i, ". I'm not sure.").replace(/^(that's a (?:great|good) question)[.!]?$/i, "$1.");
      if ((mm = s.match(/^(?:I'll )?hard pass on (.+?)[.!]?$/i))) return `I'll have to pass on ${mm[1]}.`;
      if ((mm = s.match(/^no (raises|bonuses|hiring|offsite|budget|merit increases|promotions) (this|next) (year|quarter|month|cycle)[.!]?$/i))) return `There won't be ${mm[1].toLowerCase() === "hiring" ? "any hiring" : mm[1].toLowerCase()} ${mm[2].toLowerCase()} ${mm[3].toLowerCase()}.`;
      if ((mm = s.match(/^(?:oops|whoops|my bad),? (?:I )?(sent|forgot|missed|deleted|broke|posted|replied|forwarded) (.+)$/i))) return `Sorry, I ${mm[1].toLowerCase()} ${mm[2].replace(/[.!]+$/, "")}.`;
      if ((mm = s.match(/^thanks,? ([A-Z][a-z]+),? you're (?:a |an )?(lifesaver|legend|star|hero|the best)[.!]*$/))) return `Thanks, ${mm[1]}. You're a ${mm[2] === "the best" ? "star" : mm[2]}.`;
      s = s.replace(/(?<!\b(?:a|an|my|the|his|her|their|our)),? (doctor's|dentist|dental|doctor) appointment$/i, (_m, w) => ` for a ${w.toLowerCase()} appointment`).replace(/\bbudget's gone\b/i, "the budget is gone");
      if ((mm = s.match(/^(fun|classic|great|awesome|perfect|lovely|wonderful|cool|nice|brilliant)[.!]+\s+(.+)$/i))) s = `${mm[1]}, ${mm[2]}`;
      if (/^(?:sorry,? )?(?:I )?can't talk,? (?:I'm )?(?:in a meeting|driving|on a call)$/i.test(s)) return `Sorry, I can't talk right now. I'm ${s.match(/(in a meeting|driving|on a call)$/i)[1]}.`;
      if ((mm = s.match(/^(?:I'm )?stuck (in traffic|on (?:a|the) (?:bus|train|tram|subway|plane|tarmac|highway)|at (?:the )?[a-z]+),? (\d+) ?min(?:s|utes)?(?: late| behind)?$/i))) return `I'm stuck ${mm[1].toLowerCase()} and running about ${mm[2]} minutes late.`;
      if ((mm = s.match(/^(?:hell|heck|fuck|fucking|god) no,? (.+)$/i))) s = `no, ${mm[1]}`;
      if ((mm = s.match(/^(migraine|headache|fever|cold|flu|sick|food poisoning|stomach bug|sore throat),? (logging off|signing off|heading out|leaving|going offline|heading home)( early| for the day| now| today)?$/i))) {
        const ill = mm[1].toLowerCase();
        const have = ill === "sick" ? "I'm sick" : /^(?:flu|stomach bug)$/.test(ill) ? `I have the ${ill}` : /^food poisoning$/.test(ill) ? "I have food poisoning" : `I have a ${ill}`;
        return `${have}, so I'm ${mm[2].toLowerCase()}${(mm[3] ?? "").toLowerCase()}.`;
      }
      if ((mm = s.match(/^why is (this|that|it) my (problem|job|responsibility|issue|fault)[?!.]*$/i))) return `Could you clarify why ${mm[1].toLowerCase()} falls to me?`;
      s = s.replace(/\b(thank you|thanks|ty|thx) sm\b/i, "$1 so much");
      if (/^(?:is|are|was|were|do|does|did|can|could|will|would|should|has|have) (?:the|a|an|this|that|it|we|you|they|he|she|there|anyone|someone|parking|lunch|[a-z]+) [^?]*[^?.!]$/i.test(s) && !/\?/.test(s)) s = `${s}?`;
      // Round 8: "running 10 late, start without me" ends in a request, not something I'm doing.
      if ((mm = s.match(/^(?:I'm )?running (\d+) ?(?:min(?:s|utes)? )?(?:late|behind),? (?:pls |please )?((?:start|go ahead(?: and (?:start|begin|kick off))?|begin|kick (?:it )?off|get started)(?: without me)?|don't wait(?: for me)?)[.!]*$/i))) return `I'm running about ${mm[1]} minutes late. Please ${mm[2].toLowerCase().replace(/^don't wait$/, "don't wait for me")}.`;
      if ((mm = s.match(/^(?:I'm )?running (\d+) late,? (.+?)[.!]*$/i))) s = `running ${mm[1]} min late, ${mm[2]}`;
      if ((mm = s.match(/^(?:I'm )?running (\d+) ?min(?:s|utes)? late,? (.+?)[.!]*$/i))) return `I'm running about ${mm[1]} minutes late. I'm ${mm[2].replace(/^(parking|walking in|on my way|almost there|grabbing coffee)$/i, (x) => x.toLowerCase())} now.`.replace(/ now now\./, " now.").replace(/on my way now\./, "on my way.").replace(/almost there now\./, "almost there.");
      s = s.replace(/^traffic is (?:insane|crazy|nuts|wild|awful|horrible)\b/i, "traffic is really heavy").replace(/\bthe new (guy|girl|dude)\b/gi, "the new hire");
      if ((mm = s.match(/^(?:I'm )?running late,? (?:my )?(car|bus|train|flight|alarm|babysitter|kid|dog|ride|uber|taxi) (.+?)[.!]*$/i))) return `I'm running late because my ${mm[1].toLowerCase()} ${mm[2]}.`;
      if ((mm = s.match(/^(?:I )?(can't|cannot) (make|do|join|attend) (.+?),? too (busy|swamped|slammed)[.!]*$/i))) return `I can't ${mm[2].toLowerCase()} ${mm[3]}. I'm too busy.`;
      if ((mm = s.match(/^(this|that|the)( new| old| latest| current)? (meeting|call|sync|plan|process|policy|idea|decision|code|doc|deck|report|design|email|update|review|rule|strategy|spreadsheet) is (?:total |complete |absolute |pure )?(?:bullshit|bs|garbage|trash|junk|rubbish|crap)[.!]*$/i))) return `I think ${mm[1].toLowerCase()}${mm[2] ?? ""} ${mm[3].toLowerCase()} needs significant work.`;
      if ((mm = s.match(/^(?:sorry|oops|my bad),? wrong (file|link|doc|version|attachment|one)(?: attached| sent| linked| shared)?,? (here's|heres|here is|this is) (.+?)[.!]*$/i))) return `Sorry, that was the wrong ${mm[1].toLowerCase()}. ${mm[2].toLowerCase() === "heres" ? "Here's" : mm[2][0].toUpperCase() + mm[2].slice(1)} ${mm[3]}.`;
      if (/^(?:give me|gimme) (\d+)$/i.test(s)) return `Could you give me ${s.match(/(\d+)/)[1]} minutes?`;
      // "closed the Acme deal!!!" -> "We closed the Acme deal!!!" (a team win with the subject dropped).
      if (/^(?:closed|shipped|launched|signed|landed|won|hit|crushed|nailed) (?:the|a|an|our|\d)/i.test(s)) return `we ${s}`;
      const startsLower = /^[a-z]/.test(s) && !hasCrude(s) && !/\b(?:shit|fuck\w*|crap|damn|hell)\b/i.test(s);
      if (startsLower) {
        const r = restoreArticle(s);
        if (r !== s) return r;
      }
      return s;
    }).join(" ");
    return lead + t;
  }).join("\n");
}

// Collocation and slot checks after the phrase swaps (shortfalls/research.md, item 4).
// A swap is only right if it fits its neighbors: "smells rough", "the design is too tied up",
// "400 end-user ecosystem" and "incrementally differently" are swaps that landed in the wrong slot.
const PERSON = /^(?:I|I'm|we|we're|you|you're|he|she|they|they're|the team|everyone|[A-Z][a-z]+)$/;
const COLLOCATIONS = [
  [/\bsmells? (?:rough|suboptimal|challenging|not great)\b/g, (m) => m.replace(/\S+$/, "unpleasant")],
  [/\b(\d[\d,.]*k?) (?:end-user ecosystem|end-user base|user ecosystem)\b/g, "$1 users"],
  [/\b(\d[\d,.]*k?) end users\b/g, "$1 users"],
  [/\b(?:incrementally|slightly|materially) differently\b/g, "differently"],
  [/\bsee (the [\w-]+|it|this|that) (?:incrementally|materially) differently\b/g, "see $1 differently"],
  [/\bstrategic pathway ([A-Z])\b/g, "option $1"],
  [/\b(wrap up|close out|button up) (it|this|that|them)\b/g, (_m, v, o) => `${v.split(" ")[0]} ${o} ${v.split(" ")[1]}`],
  [/\bdo a discount\b/g, "offer a discount"],
  [/\b(good|best|better|great|poor|wise|effective) leverage of\b/g, "$1 use of"],
  [/\bon (\d+(?:st|nd|rd|th)) floor\b/g, "on the $1 floor"],
  [/\b(?:excel)\b/g, "Excel"], [/\bsvg\b/g, "SVG"], [/\bpostgres\b/g, "Postgres"], [/\bandroid\b/g, "Android"], [/\bvpn\b/g, "VPN"], [/\bios\b/g, "iOS"], [/\bq([1-4])\b/g, "Q$1"], [/\btypescript\b/g, "TypeScript"], [/\bjavascript\b/g, "JavaScript"], [/\bgithub\b/g, "GitHub"],
  [/\blost track of (the|my) (attachment|file|link|slides|deck|invite|charger|laptop|badge|keys|lunch|notes|headphones|adapter)\b/g, "forgot $1 $2"],
  [/\b(upgrad|updat|install|downgrad)(e|ed|ing) node\b/g, "$1$2 Node"],
  [/\bgo ahead and not ([a-z]+)\b/g, (_m, v) => `avoid ${ing(v)}`],
  [/\b(surface|flag) that (current |key |open |our )?(blockers|action items|next steps|risks|open questions|questions|agenda items)(?=:)/g, "$1 the $2$3"],
  [/\bpoor use of time of (an?|the) /g, "poor use of $1 "], [/\ban inefficiency of (an?|the) /g, "an inefficient use of $1 "],
  [/\bextra hands on deck with\b/g, "extra support with"], [/\bstart (\d+ ?\w+) behind schedule\b/g, "start $1 late"], [/\b(upgrade|update|install|downgrade) node\b/g, "$1 Node"], [/\bnode (\d+)\b/g, "Node $1"], [/\bdouble booked\b/g, "double-booked"],
  [/^(Could you) (.+?) please\?$/, "$1 please $2?"],
  [/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s\b/g, (m) => m[0].toUpperCase() + m.slice(1)],
  [/\b(Congratulations|Congrats|Thanks|Thank you|Happy [\w ]+?) ([A-Z][a-z]+)([.!?]|$)/g, "$1, $2$3"],
];
export function fixCollocations(text) {
  let t = text;
  for (const [re, rep] of COLLOCATIONS) t = t.replace(re, rep);
  // "busy" means "occupied" only for people: "the design is too tied up" -> "the design is too busy".
  t = t.replace(/\b((?:the|this|that|your|our|my) [\w-]+|it|this|that) (is|looks|feels|seems) (too |very |really |so |a bit )?(?:tied up|at capacity|fully leveraged|swamped|slammed|underwater)\b/gi, (m, subj, v, adv) => (PERSON.test(subj) || /\b(?:team|squad|pod|manager|lead|engineer|designer|person|folks|staff|crew|group|department|everyone|people)\b/i.test(subj) ? m : `${subj} ${v} ${adv ?? ""}busy`.replace(/\s{2,}/g, " ")));
  return t;
}
