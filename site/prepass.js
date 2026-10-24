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
  if (!m || m.index < 6 || /\b(?:there's|there is|I've|I have|here's|so|and|but|then|or|just|to|please)$/i.test(s.slice(0, m.index))) return null;
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
    .replace(/^check\b/i, "Please check").replace(/^no (issues|problems|errors|downtime)\b/i, "There were no $1").replace(/^nothing (new|else|urgent)\b/i, "There's nothing $1");
  return `${end(left)} ${end(cap(right))}`;
}

/** Sarcasm -> sincere meaning. Returns the rewritten sentence or null. */
export function desarcasm(sentence) {
  const s = strip(sentence);
  let m;
  if (/^love that for (?:us|me|you)$/i.test(s)) return "That's not ideal for us.";
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
const CLAUSE_START = /(?<!\b(?:I'm|am|are|we're|is|was|I|in|on|at|of|the|my|a|an|to|for))\s(?=(?:traffic\b|(?:the|my) (?:train|bus|traffic|wifi|internet|kid|son|daughter|car|flight|laptop|power)\b|I was\b|I'm\b|I am\b|I got\b|I overslept\b|I forgot\b|I didn't\b|I did not\b|I missed\b|I'll\b|I will\b|something\b|can you\b|could you\b|can we\b|could we\b|can I\b|could I\b|please\b|what do you\b|should be\b|it's\b|it was\b|was out\b|we need\b|kid\b|but\b|was (?:driving|in a|on a|on the|at the|at a|busy|sick|stuck|asleep|away|offline|travel\w*|out)\b|(?:the|my|our|this|that) [\w-]+ (?:is|was|are|were|has|had|didn't|isn't|wasn't|got|ran|went|took|broke|died|crashed|started|ended)\b|here's\b|here is\b|(?:restoring|fixing|working on|looking into|rolling back|reverting|redoing|resending|updating|sending|on it)\b|it should\b|it says\b|that should\b|did you\b|do you\b|have you\b|are you\b|is it\b|is there\b))/i;
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
  const words = m[1].split(" ");
  if (NOT_HEAD.test(words[0]) && words.length === 1) return sentence;
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

export function prepass(clean, nested = false) {
  // Line by line so lists keep their shape. Only prose lines are touched.
  return clean.split("\n").map((line) => {
    if (/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/.test(line) || !line.trim()) return line;
    const lead = line.match(/^\s*/)[0];
    let t = round6(round7(fixNamesAndTools(line.trim()))).replace(/\bbug (you|me|him|her|them)\b/gi, "bother $1").replace(/^(fun|classic|great|awesome|perfect|lovely|wonderful|cool|nice|brilliant)[.!]+\s+(?=[a-z])/i, "$1, ");
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
      if ((mm = s.match(/^(?:I'll |gonna |going to |I'm going to |I'm gonna )?pass on (?:the )?(.+?)[.!]*$/i))) return `I'll pass on the ${mm[1].replace(/^the /i, "")}.`;
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
      s = s.replace(/,? (doctor's|dentist|dental|doctor) appointment$/i, (_m, w) => ` for a ${w.toLowerCase()} appointment`).replace(/\bbudget's gone\b/i, "the budget is gone");
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
