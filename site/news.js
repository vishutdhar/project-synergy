// Round 9: the plain news in a corporate sentence, with the facts kept.
// Decode used to say "Some benefits are getting smaller" for "the home office stipend is being reduced from
// $100 to $50". Vishut's intent: tell the reader the real news plainly and name the actual change.
// Each rule matches one sentence and builds [mild, middle, c-suite-reader] lines from the sentence itself
// (the thing, the number, the date). Good news and temporary closures are read first so they never
// turn into false alarms. Nothing here invents a layoff, a cut or a shutdown the sentence doesn't state.

const MONTH = "January|February|March|April|May|June|July|August|September|October|November|December";
const DAYS = "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday";
const DATE = String.raw`(?:(?:the )?end of Q[1-4]|(?:${MONTH})(?: \d{1,2}(?:st|nd|rd|th)?)?|(?:early |mid |late |end of )?Q[1-4]|(?:${DAYS})|the end of (?:the |this |next )?(?:year|quarter|month|fiscal year|day|week)|end of (?:the |this |next )?(?:year|quarter|month|fiscal year|day|week)|next (?:week|month|quarter|year|release)|this (?:week|month|quarter|year)|the (?:\d{1,2}(?:st|nd|rd|th))|(?:the )?(?:spring|summer|fall|autumn|winter)|the remainder of the (?:year|quarter)|the rest of the (?:year|quarter|fiscal year))`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lc = (s) => (s && /^(?:We|We're|We've|We'll|Our|The|All|Everyone|This|These|Those|Free|Your|A|An|It|It's|Its|There|Bonuses|Parental|Customer|Customers|Shipping|Parking|Delivery|Payments|Commuter|Unused|Merit|Equity|Hiring|Prices|Open|Team|Teams|Remote|Office|Support|Some|Several|Each|Every|Starting|Going|Effective)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const clean = (s) => String(s).replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
const end = (s) => (/[.!?]["”')]?$/.test(s) ? s : s + ".");
const fixIt = (x) => x.replace(/^It is /, "It's ").replace(/^(\w)/, (c) => c.toUpperCase()).replace(/\b(\w+s) (is|has|needs) (?=being|been|now|going|shutting|harder|frozen|cut|dead|on|basically|still|in|delayed|running|late|stopping|gone)/g, (m, n, v) => (/(?:ss|us|is|news|series)$/i.test(n) ? m : `${n} ${v === "is" ? "are" : v === "has" ? "have" : "need"} `));
const L = (a, b = a, c = b) => [a, b, c].map((x) => end(fixIt(clean(x))));

// "Starting January 1", "on June 30", "by the end of the quarter", "next month"
function whenOf(s) {
  const m = s.match(new RegExp(String.raw`\b(?:starting|beginning|effective|on|by|from|in|at|through|until|as of|after|for)\s+(${DATE}(?:,? \d{4})?)`, "i")) ?? s.match(new RegExp(String.raw`\b(${DATE})\b`));
  if (!m) return "";
  const raw = m[0];
  const lead = raw.split(/\s+/)[0].toLowerCase();
  const d = m[1];
  if (/^(?:starting|beginning|effective|as of)$/.test(lead)) return `starting ${d}`;
  if (/^(?:by|through|until|after|on|in|at|for)$/.test(lead)) return `${lead} ${/^next (?:release|version)/i.test(d) ? "the " : ""}${d}`;
  if (/^next /i.test(d)) return `in the ${d}`.replace(/the next (week|month|quarter|year)$/, "next $1");
  return d;
}
const withWhen = (s, base) => { const w = whenOf(s); return w && !base.toLowerCase().includes(w.toLowerCase().replace(/^(?:starting|on|in|by|at|through|until) /, "")) ? `${base.replace(/[.]$/, "")} ${w}` : base; };
// The thing a sentence is about: "Our tuition reimbursement program is being discontinued" -> "the tuition reimbursement program"
function subjectOf(s) {
  const s2 = s.replace(/^(?:(?:after careful consideration|going forward|effective immediately|starting [^,]+|unfortunately|as of [^,]+|due to [^,]+|given [^,]+|because of [^,]+|to [^,]+|while [^,]+|as [^,]+),\s*)/i, "");
  const m = s2.match(/^(?:(our|the|your|this|all|a|an)\s+)?(.+?)\s+(?:will|is|are|has|have|was|were|goes|go|must|may|can|now|did|didn't|identified|found|came|missed|surfaced)\b/i);
  if (!m) return "";
  const det = (m[1] ?? "").toLowerCase();
  const noun = m[2].replace(/^(?:new|current|existing)\s+/i, (x) => x);
  if (/^(?:we|they|you|it|this|there|i|he|she)$/i.test(noun) || noun.split(" ").length > 6) return "";
  const art = det === "your" ? "your" : det === "all" ? "all" : det === "this" ? "this" : det ? "the" : "";
  return `${art} ${art ? lc(noun) : noun.replace(/^(?:We|Our|The|Free|Shipping|Parking|Delivery|Payments|Commuter|Unused|Merit|Equity|Hiring|Prices|Customer|Remote|Support|Overtime|Promotions|Wellness)\b/, (w) => w.toLowerCase())}`.trim();
}
const numsOf = (s) => (s.match(/\$?\d[\d,]*(?:\.\d+)?%?(?:\s?(?:k|K|m|M|million|billion))?/g) ?? []).map((x) => x.trim());
const toNum = (x) => parseFloat(String(x).replace(/[$,%]/g, ""));
// "from $100 to $50", "from 16 weeks to 12 weeks", "from March to May"
function fromTo(s) {
  const m = s.match(/\bfrom\s+(\$?[\d,.]+%?(?:\s\w+)?|[A-Z]\w+(?: \d{1,2})?|Q[1-4]|\w+ (?:day|week|month)s?)\s+to\s+(\$?[\d,.]+%?(?:\s\w+)?|[A-Z]\w+(?: \d{1,2})?|Q[1-4]|\w+ (?:day|week|month)s?)/i);
  if (!m) return null;
  let [a, b] = [m[1], m[2]].map((x) => x.replace(/\s+(?:per|a|each|every|in|on|at|for|starting|effective)$/i, ""));
  // "$100 to $50 per month": the unit after the second number counts for both.
  return { a, b, down: !Number.isNaN(toNum(a)) && !Number.isNaN(toNum(b)) ? toNum(b) < toNum(a) : null };
}

// The main thing a schedule sentence is about.
const thingOf = (s) => { const m = s.match(/\b(go-?live|launch|release|rollout|roll-out|delivery|migration|project|deal|feature|shipments?|renovation|office move|cutover|upgrade)\b/i); return m ? `the ${m[1].toLowerCase()}` : ""; };
const BENEFIT_THINGS = /\b(stipend|allowance|reimbursement|match|bonus(?:es)?|leave|PTO|vacation|holidays?|days off|benefits?|perks?|subsidy|equity|refreshers?|raises?|merit|lunch|lunches|meals|catering|snacks|commuter|tuition|learning budget|education budget|training budget|wellness|401\(k\)|pension|parental)\b/i;
const COST_THINGS = /\b(price|prices|pricing|fee|fees|rate|premiums?|deductibles?|cost|costs|parking|subscription|charge)\b/i;

const RULES = [
  // ---- Round 9c: phrasings found on fresh batch 19 (checked first, narrow patterns) ----
  { id: "layoffs", tone: "bad", re: /\baffected (?:team members|employees|colleagues|staff|individuals)\b[^.]*\b(?:HR|invite|package|notified|contacted|hear)\b/i,
    build: () => L("Some people are losing their jobs. If HR contacts you, you're one of them.", "Layoffs. Watch for the HR invite.", "Layoffs. The HR invite is the pink slip.") },
  { id: "layoffs", tone: "bad", re: /\b(?:team|group|department|function|org(?:anization)?|division|office)\b[^.]*\b(?:will be|is being|are being) (?:resized|right-?sized|wound down|reduced in size)\b/i,
    build: (s) => { const t = subjectOf(s) || "a team"; return L(`${cap(t)} is being cut, so some people will lose their jobs.`, `${cap(t)}: fewer jobs.`, `${cap(t)} is getting cut. That means layoffs.`); } },
  { id: "delay", tone: "warn", re: /\bpostponed (?:until further notice|indefinitely)\b|\btimeline has been (?:revised|updated|adjusted)\b|\bmoved out to a later\b|\bpushed (?:out|back) to\b/i,
    build: (s) => { const t = subjectOf(s) || "it"; return /further notice|indefinitely/i.test(s) ? L(`${cap(t)} is postponed with no new date.`, `${cap(t)}: delayed, no new date.`, `${cap(t)} is on ice. No date.`) : L(`${cap(t)} is delayed.`, `${cap(t)} slipped.`, `${cap(t)} is late.`); } },
  { id: "delay", tone: "warn", re: /\bin (January|February|March|April|May|June|July|August|September|October|November|December) instead of (January|February|March|April|May|June|July|August|September|October|November|December)\b/,
    build: (s, m) => { const t = subjectOf(s) || "it"; return L(`${cap(t)} moves from ${m[2]} to ${m[1]}.`, `${cap(t)} slipped to ${m[1]}.`, `${cap(t)}: ${m[1]}, not ${m[2]}.`); } },
  { id: "benefits", tone: "bad", re: /\b(?:party|parties|offsite|celebration|outing|retreat)\b[^.]*\bwill not (?:take place|happen|be held)\b|\b(?:bonus|bonuses|raise|raises|merit|stipend|allowance)\b[^.]*\b(?:revised|adjusted) downward\b|\b(?:snacks|lunches|meals|coffee|catering|perks?)\b[^.]*\b(?:limited|reduced) to\b/i,
    build: (s) => /limited to|reduced to/i.test(s) ? L(`${cap(subjectOf(s) || "the perk")} ${/s\b/.test(subjectOf(s) || "") ? "are" : "is"} being cut back: ${s.match(/(?:limited|reduced) to ([^.]+)/i)[1]} only.`, `Fewer ${(subjectOf(s) || "perks").replace(/^the /i, "").toLowerCase()}.`, `${cap(subjectOf(s) || "the perk")}: cut back.`) : /bonus/i.test(s) ? L("Bonuses will be smaller.", "Smaller bonuses.", "Expect a smaller bonus.") : L(`${cap(subjectOf(s) || "the event")} is cancelled this year.`, `No ${(subjectOf(s) || "event").replace(/^the /i, "")} this year.`, `${cap(subjectOf(s) || "the event")}: cancelled.`) },
  { id: "rto", tone: "warn", re: /\bremote days?\b[^.]*\b(?:limited|capped|reduced)\b|\b(?:office )?attendance will be (?:tracked|monitored)\b|\b(?:flexible|remote|hybrid) work (?:pilot|program|experiment)\b[^.]*\b(?:concluded|ended|ending|over)\b|\b(?:sunsetting|ending|eliminating|discontinuing) (?:our |the )?(?:fully )?remote\b/i,
    build: (s) => /tracked|monitored/i.test(s) ? L("They'll be checking who comes into the office.", "Office attendance is being tracked.", "Badge swipes are being counted.") : /pilot|program|experiment/i.test(s) ? L("The flexible work trial is over.", "Flexible work is ending.", "Back to the office.") : /fully remote|remote option/i.test(s) && !/days?/i.test(s) ? L("Fully remote work is ending.", "No more fully remote.", "Remote is over.") : L("You'll get fewer remote days.", "Less remote work.", "More office days.") },
  { id: "budget-freeze", tone: "bad", re: /\b(?:conference|travel|training|offsite)\b[^.]*\bwill not be approved\b|\brequire\w* (?:sign-?off|approval) from (?:the |a )?(CFO|VP|CEO|finance)\b/i,
    build: (s, m) => m[1] ? L(`This spending now needs ${/^[aeiou]/i.test(m[1]) ? "an" : "a"} ${m[1]}'s approval, so expect less of it.`, `${m[1]} sign-off only. Basically frozen.`, `Frozen unless the ${m[1]} says yes.`) : L("Conference and travel spending is frozen.", "No conferences.", "No conferences for you.") },
  { id: "reorg", tone: "warn", unless: /\b(?:no longer needed|eliminat\w*|roles? (?:will|are) (?:be )?(?:impacted|affected))\b/i, re: /\bwill (?:now )?lead both\b|\bnew (?:\w+ )?(?:matrixed |reporting |org(?:anizational)? )?structure\b|\bmatrixed\b/i,
    build: (s) => L("The org chart is changing.", "Reorg.", "Reorg. Check who your boss is.") },
  { id: "shutdown", tone: "bad", re: /\bsupport for ([\w .]+?) ends\b|\b(?:program|beta|pilot|product|service|partnership)\b[^.]*\b(?:being wound down|will be wound down|will conclude|is concluding|is ending)\b/i,
    build: (s) => { const t = subjectOf(s) || "it"; return L(`${cap(t)} is ending.`, `${cap(t)}: ending.`, `${cap(t)} is over.`); } },
  { id: "cost-increase", tone: "bad", re: /\b(?:price|cost|rate) of\b[^.]*\bwill (?:increase|rise|go up) to (\$[\d,.]+)|\bpassed (?:through|on) to (?:customers|clients|you)\b|\brenew at the (?:updated|new|current list) rate\b/i,
    build: (s, m) => m[1] ? L(`The price is going up to ${m[1]}.`, `Price increase: ${m[1]}.`, `You'll pay ${m[1]}.`) : L("You'll pay more.", "Price increase.", "It costs more now.") },
  { id: "problem", tone: "bad", re: /\bmay have experienced\b[^.]*\b(?:failures?|errors?|issues|outages?|problems)\b|\b(?:billing|data|sync|pricing) (?:error|issue|bug)\b[^.]*\b(?:caused|resulted|led)\b|\bmissed (?:our |the )?[\w ]{0,20}target\b|\bcan no longer meet\b|\bran into (?:unexpected )?(?:issues|problems)\b/i,
    build: (s) => L(`Something went wrong: ${s.replace(/[.!]+$/, "").replace(/^We /, "we ")}.`, "Something broke.", "It went wrong.") },
  { id: "performance", tone: "warn", re: /\bnot met (?:the )?(?:expected )?(?:quality )?(?:bar|standard|expectations)\b|\bplan to support your growth over the next \d+ days\b|\breassessed\b[^.]*\bexpectations\b/i,
    build: (s) => /plan to support/i.test(s) ? L("This is a performance improvement plan. Improve in the time given or your job is at risk.", "You're going on a PIP.", "PIP. Your job is at risk.") : L("Your work isn't good enough, according to your manager.", "Your performance is a problem.", "This is a warning about your performance.") },
  { id: "hedge", tone: "warn", unless: /\btimeline\b|\bdate\b/i, re: /\bcontinuing to evaluate\b|\bnothing is final\b|\bexploring a range of (?:scenarios|options)\b|\bonce we have more clarity\b|\bcarefully reviewing our options\b/i,
    build: () => L("They haven't decided yet, and something may change.", "Undecided. Change may be coming.", "Nothing decided. Brace anyway.") },
  // ---- Not bad news: read first so they never become false alarms ----
  { id: "fyi", tone: "none", re: /\b(?:closed|close|unavailable|no longer (?:be )?available|out of service|not available|shut|down|paused?)\b[^.]{0,60}\b(?:during|while|until|for) (?:the )?(?:lobby |kitchen |office |floor |building )?(?:renovation|remodel|maintenance|repairs?|construction|upgrade|holiday|move|cleaning|inspection|weekend)\b/i,
    build: (s) => { const t = subjectOf(s) || "it"; const why = s.match(/\b(?:during|while|until|for) ((?:the )?[^.,;]+)/i)?.[1] ?? "the work"; if (/\bdown\b/i.test(s)) return L(`${cap(t)} will be down only during ${why.replace(/^(?!the )/, "the ")}. Routine maintenance.`, `Planned downtime: ${t} is down during ${why.replace(/^(?!the )/, "the ")}.`, `${cap(t)} is down for ${why.replace(/^(?:the )?/, "")}. That's all. Nothing sinister.`); return L(`${cap(t)} is closed only during ${why.replace(/^(?!the )/, "the ")}. Nothing permanent.`, `Temporary: ${t} is closed during ${why.replace(/^(?!the )/, "the ")}. It's not going away.`, `${cap(t)} is closed during ${why.replace(/^(?!the )/, "the ")}. That's it. Not a conspiracy.`); } },
  { id: "good-news", tone: "good", re: /\bno (?:roles|jobs|positions|employees|one|people) (?:are|will be|is) (?:affected|impacted|cut|eliminated)\b|\bno (?:layoffs|job cuts)\b/i,
    build: (s) => L(`Good news: ${lc(s.replace(/[.]$/, ""))}. No jobs are being cut.`, `Good news. No jobs are being cut.`, `Genuinely good news: no jobs are being cut. Read it twice, it's real.`) },
  { id: "good-news", tone: "good", re: /\b(?:bonus(?:es)?|payouts?)\b[^.]*\b(1\d\d|[2-9]\d\d)% of target\b/i,
    build: (s, m) => L(`Good news: bonuses pay out at ${m[1]}% of target, which is above normal.`, `Bonuses are above target: ${m[1]}%. That's good.`, `Bonuses at ${m[1]}% of target. That's more than promised. Enjoy it.`) },
  { id: "good-news", tone: "good", re: /\bclose (?:at (?:noon|\d{1,2}(?::\d\d)?\s?(?:am|pm)?)|early)\b[^.]*\b(?:so (?:everyone|you|we|people) can|head home|go home|early)\b/i,
    build: (s) => L(`Good news: ${lc(s.replace(/[.]$/, ""))}.`, `You get to go home early. That's it.`, `Early dismissal. Actual good news, no catch.`) },
  { id: "good-news", tone: "good", re: /\b(?:exceeded|beat|surpassed|hit (?:an |our |a |the )?(?:all-time|record|\d|target|goal|milestone)|filled all|record|all-time high|won(?!')|award|promoted|closed our [\w ]*(?:funding|round)|series [a-f]\b|raising (?:the |our |your )?[\w ]{0,25}(?:stipend|salar\w*|pay|wages?|match|allowance|bonus\w*|minimum)|increas\w* to|extended to|is increasing|are increasing|adding|welcome \d+|hiring for \d+|opening (?:a )?new|back this year|now available every|open and free|cost-of-living|went smoothly|zero downtime|extra day off|head home early)\b/i,
    unless: /\bno (?:merit|raises?|increases?|bonus\w*)\b|\bcaps? (?:the|on)\b|\bcapped\b|\bbefore adding headcount\b|\bbringing [\w ]*back to the office\b|\b(?:fee|fees|price|prices|premiums?|deductibles?|cost(?:s)? (?:will|are|is)|contribution|parking will now cost|churn|attrition|errors?|complaints|tickets|outage|delay|late|slip\w*|complexity|layoffs?|cut\w*|reduc\w*|eliminat\w*|won't|not|no longer|unable|move there|will move|relocat\w*|offshor\w*|transition\w*)\b/i,
    build: (s) => { const wel = s.match(/\bwelcome (\d+) new (?:team members|colleagues|people|hires|employees)( [^.]+)?/i); if (wel) return L(`Good news: ${wel[1]} new people are joining${wel[2] ?? ""}.`, `Good news, no catch: ${wel[1]} new people are joining${wel[2] ?? ""}.`, `Real good news, and we checked for a catch: ${wel[1]} new people are joining${wel[2] ?? ""}.`);
      const t = s.replace(/^(?:we(?:'re| are) (?:excited|thrilled|pleased|happy|proud) to (?:share|announce)(?: that)?|we(?:'re| are) (?:excited|thrilled|pleased|happy|proud) to|great news[:,!]?|good news[:,!]?)\s*/i, "").replace(/[.!]$/, ""); return L(`Good news: ${lc(t)}.`, `Good news, no catch: ${lc(t)}.`, `Real good news, and we checked for a catch: ${lc(t)}.`); } },

  // ---- Layoffs ----
  { id: "layoff-you", tone: "bad", re: /\byour (?:position|role|job) (?:has been|is being|will be) (?:impacted|affected|eliminated)\b|\byour last (?:working )?day will be\b/i,
    build: (s) => { const d = s.match(new RegExp(`last (?:working )?day will be (${DATE}|${DAYS})`, "i"))?.[1]; return L(`You're losing your job${d ? `. Your last day is ${d}` : ""}.`, `You're being laid off${d ? `. Last day: ${d}` : ""}.`, `You've been laid off${d ? `. ${d} is your last day` : ""}. The attachment is the severance.`.replace(/\. The attachment is the severance\.$/, /severance/i.test(s) ? ". The attachment is the severance." : ".")); } },
  { id: "layoffs", tone: "bad", re: /\b(?:reduc\w*|cut\w*|shrink\w*)\b[^.]{0,40}\b(?:size of (?:our|the) (?:team|workforce|company|organization|org)|(?:global |our |the )?(?:headcount|workforce|staff|team))\b[^.]{0,20}\bby (?:approximately |about |roughly |around |nearly )?(\d+(?:\.\d+)?%|\d[\d,]*)/i,
    build: (s, m) => L(`Layoffs: about ${m[1]} of the ${/%/.test(m[1]) ? "company" : "staff"} is losing their jobs.`.replace(/(\d[\d,]*) of the staff is/, "$1 people are"), `About ${m[1]} ${/%/.test(m[1]) ? "of the company is" : "people are"} getting laid off.`, `They're laying off about ${m[1]}${/%/.test(m[1]) ? " of the company" : " people"}. "Difficult decision" is the corporate word for layoffs.`) },
  { id: "layoffs", tone: "bad", re: /\b(?:impact|affect|eliminat)\w*\b[^.]{0,20}\b(?:approximately |about |roughly |around |nearly )?(\d[\d,]*) (?:roles|positions|jobs|employees|people)\b|\b(?:part(?:ing)? ways with|say(?:ing)? goodbye to|farewell to) (?:approximately |about |roughly |around |nearly )?(\d[\d,]*) (?:colleagues|employees|people|team members)\b/i,
    build: (s, m) => { const n = m[1] ?? m[2]; return L(`Layoffs: about ${n} people are losing their jobs.`, `About ${n} people are getting laid off.`, `About ${n} people are being laid off. The memo calls it "evolving."`.replace(/ The memo calls it "evolving\."$/, /evolv/i.test(s) ? ` The memo calls it "evolving."` : "")); } },
  { id: "layoffs", tone: "bad", re: /\bvoluntary (?:separation|exit|departure|buyout)s? (?:program|package|offer)\b|\bbuyouts?\b/i,
    build: () => L("They're offering people money to quit (a buyout). It's a way to cut staff.", "They're paying people to leave. It's a soft layoff.", "Buyouts: they'd like you to leave, and they'll pay a bit for it.") },
  { id: "layoffs", tone: "bad", re: /\b(?:reduc\w*|cut\w*|trim\w*)\b[^.]{0,20}\bcontractors?\b|\bcontractor (?:headcount|roles?) (?:will be |is being )?(?:reduc|cut)/i,
    build: () => L("Contractors are being cut.", "Some contractors are losing their jobs.", "Contractors go first. They're being let go.") },
  { id: "layoffs", tone: "bad", re: /\bmanager (?:roles|jobs|positions) (?:are |will be )?(?:going away|eliminated|cut)\b/i,
    build: () => L("Some manager jobs are being cut.", "Fewer managers. Some manager roles are being eliminated.", "Middle managers are being laid off. \"Fewer layers\" means fewer people.") },
  { id: "reorg", tone: "warn", re: /\b(?:flatten\w*|reduc\w* layers|fewer layers|removing layers|delayer\w*)\b/i,
    build: () => L("Reorg: fewer layers of managers. Some manager roles will change or go away.", "Fewer management layers. Some managers will lose their manager jobs.", "Fewer bosses. If you manage managers, update your resume.") },
  { id: "layoffs", tone: "bad", re: /\b(?:roles?|positions?|jobs?)\b[^.]{0,60}\b(?:eliminated|redundant|will not continue|won't continue|not (?:all )?(?:current )?(?:roles )?(?:will )?carry over|no longer needed|no longer exist|going away|transitioned out|be cut)\b|\bnot all (?:current )?roles will carry over\b/i,
    build: (s) => { const where = s.match(/\b((?:regional )?sales|support|engineering|marketing|customer success|finance|HR|operations|[A-Z][a-z]+ office)\b/)?.[1]; const w = where ? ` in ${/office$/.test(where) ? "the " : ""}${where}` : ""; return L(`Layoffs: some jobs${w} are being cut.`, `People${w} are getting laid off.`, `Jobs${w} are being cut. "Will not carry over" is a polite way to say laid off.`.replace(/ "Will not carry over" is a polite way to say laid off\.$/, /carry over/i.test(s) ? ` "Will not carry over" is a polite way to say laid off.` : /redundant/i.test(s) ? ` "Redundant" means laid off.` : /transitioned out/i.test(s) ? ` "Transitioned out" means laid off.` : "")); } },
  { id: "layoffs", tone: "bad", re: /\b(?:say(?:ing)?|said|bid(?:ding)?) (?:goodbye|farewell) to (?:some|a number of|several|many)\b|\b(?:some|several) (?:of our )?(?:colleagues|team members|people)\b[^.]{0,40}\b(?:will be )?leaving (?:us|the company)\b|\bimpacted (?:employees|team members|colleagues)\b|\baffect a number of roles\b|\brebalanc\w* (?:our|the) workforce\b|\b(?:optimiz\w*|reduc\w*|lower\w*) (?:our )?people costs\b|\bsmaller,? (?:more )?(?:focused|leaner) team\b|\bleaner organization\b|\bpositions? (?:have|has) been (?:impacted|affected)\b/i,
    build: (s) => { const where = s.match(/\b(?:in|of our|from) (support|sales|engineering|marketing|customer success|our engineering org|the [\w ]+ team)\b/i)?.[1]; const w = where ? ` in ${where.replace(/^our /, "")}` : ""; return L(`Layoffs: some people${w} are losing their jobs.`, `People${w} are getting laid off.`, `Layoffs${w}. "${cap((s.match(/saying goodbye|say goodbye|farewell|leaving us|rebalancing our workforce|people costs|smaller, more focused team|leaner organization|impacted employees|affect a number of roles|transition/i) ?? ["Changes"])[0])}" is how they say it.`).map((x, i) => /people costs/i.test(s) ? ["They plan to spend less on staff. That usually means layoffs or smaller raises.", "Staff costs are getting cut: layoffs or smaller raises.", "\"Optimizing people costs\" means spending less on people. Layoffs, smaller raises, or both."][i] : x); } },

  // ---- Delays ----
  { id: "delay", tone: "warn", re: /\b(?:moved|pushed|slipp\w*|shifted|postponed|delayed|rescheduled)\b[^.]*\bfrom (\S+(?: \d{1,2})?) to (\S+(?: \d{1,2})?)/i,
    build: (s, m) => { const t = subjectOf(s) || thingOf(s) || "it"; return L(`${cap(t)} is delayed from ${m[1]} to ${m[2].replace(/[.]$/, "")}.`, `${cap(t)} slipped: ${m[2].replace(/[.]$/, "")} now, not ${m[1]}.`, `${cap(t)} is late. ${m[1]} became ${m[2].replace(/[.]$/, "")}.`); } },
  { id: "delay", tone: "warn", re: new RegExp(String.raw`\b(?:now (?:expect\w*|looking at|target\w*|plan\w*)|is now expected|expected) [^.]*?\b(?:in |for |a )?(${DATE}|(?:a )?(?:spring|summer|fall|autumn|winter)(?: release)?)\b[^.]*\b(?:rather than|instead of) (?:the )?(?:original )?(${DATE}|this one|(?:end of )?(?:the )?(?:year|quarter)|\w+ date)|\b(?:rather than|instead of) (?:the )?(?:original )?(\w+(?: \w+)?) (?:date|release|launch|timeline),? [^.]*\b(?:looking at|expect\w*|target\w*) (?:a |an )?(\w+(?: \w+)?)`, "i"),
    build: (s, m) => { const now = (m[1] ?? m[4] ?? "later").replace(/ release$/, ""), was = (m[2] ?? m[3] ?? "the original date").replace(/^this one$/, "this quarter"); const t = subjectOf(s).replace(/^the (?:new |revised )?$/, "") || (/deal/i.test(s) ? "the deal" : /release/i.test(s) ? "the release" : /deliver/i.test(s) ? "delivery" : "it"); return L(`Delayed: ${t} is now ${now} instead of ${was}.`, `${cap(t)} slipped from ${was} to ${now}.`, `${cap(t)} is late. ${cap(was)} became ${now}, and that's the optimistic version.`); } },
  { id: "delay", tone: "warn", re: /\b(?:slip|slips|slipping)\b[^.]*\bby (?:a few|several|\d+|two|three|a couple of) (?:days|weeks|months)\b|\bpush\w* (?:the )?(?:go-?live|launch|release|deadline|date)\b|\btaking (?:a little |a bit |some )?more time\b|\bre-?baselin\w*|\brecalibrat\w* (?:our )?timelines?\b|\btake (?:longer|more time) than (?:originally )?(?:planned|expected)\b|\blater than (?:expected|planned)\b|\bnew timeline will be shared\b|\bin phases over the coming\b|\bon hold until further notice\b|\btiming is (?:TBD|to be determined|still being finalized)\b|\bnext quarter instead of this\b|\bmay take up to \d+ (?:business )?days\b/i, unless: /\b(?:spending|spend|purchases|hiring|expenses)\b/i,
    build: (s) => { const t = (/re-?baselin|recalibrat|push\w* (?:the )?|more time|later than|longer than/i.test(s) ? thingOf(s) || (/schedule|timeline/i.test(s) ? "the project" : "") : "") || subjectOf(s) || thingOf(s) || "it"; const by = s.match(/\bby ((?:a few|several|\d+|two|three|a couple of) (?:days|weeks|months))\b/i)?.[1]; const upto = s.match(/\bup to (\d+ (?:business )?days)\b/i)?.[1];
      if (upto) return L(`${cap(t)} will be slower: it can take up to ${upto}.`, `Expect delays: up to ${upto}.`, `It's going to be slow. Up to ${upto}.`);
      if (/on hold until further notice/i.test(s)) return L(`${cap(t)} is on hold, with no new date.`, `${cap(t)} is paused indefinitely.`, `${cap(t)} is frozen. "Until further notice" means nobody knows when.`);
      if (/TBD|to be determined|finalized/i.test(s)) return L(`${cap(t)} is still planned, but there's no date.`, `No date yet for ${t}.`, `${cap(t)} has no date. Don't hold your breath.`);
      if (/in phases/i.test(s)) return L(`${cap(t)} won't arrive all at once. It'll come in pieces over the next few quarters.`, `${cap(t)} is spread out over the coming quarters, so most of it comes later.`, `${cap(t)} is now a slow trickle over several quarters.`);
      if (/new timeline will be shared/i.test(s)) return L("It's delayed, and they don't have a new date yet.", "Delayed. No new date yet.", "It's late, and nobody knows the new date.");
      return L(`${cap(t)} is delayed${by ? ` by ${by}` : ""}.`, `${cap(t)} is running late${by ? ` by ${by}` : ""}.`, `${cap(t)} is late${by ? ` by ${by}` : ""}.${(() => { const w = s.match(/re-?baselin\w*|recalibrat\w*|more time|longer than|later than|additional testing|unexpected complexity/i)?.[0]; return w ? ` "${cap(w)}" means late.` : ""; })()}`); } },

  // ---- Benefits and pay ----
  { id: "benefits", tone: "bad", re: /\b(?:employee )?contributions? to (?:medical |health |dental )?(?:premiums|insurance|coverage)\b[^.]*\bincrease\b|\bpremiums? (?:will )?(?:increase|go up|rise)\b/i,
    build: (s) => L(withWhen(s, "You'll pay more for health insurance."), withWhen(s, "Your health insurance costs are going up."), withWhen(s, "Same health plan, bigger bill.")) },
  { id: "benefits", tone: "bad", re: /\bhigh[- ]deductible\b/i,
    build: () => L("Your health plan is switching to a high deductible, so you'll pay more before insurance kicks in.", "Higher deductible: you pay more out of pocket.", "Cheaper plan for them, bigger bills for you.") },
  { id: "benefits", tone: "bad", re: /\b(?:no longer|not|stop) match\w* (?:contributions )?above (\d+%)|\bmatch\w*\b[^.]*\bcapped at (\d+%)/i,
    build: (s, m) => L(`The 401(k) match now stops at ${m[1] ?? m[2]}.`, `Smaller 401(k) match: it stops at ${m[1] ?? m[2]}.`, `Your retirement match got cut to ${m[1] ?? m[2]}.`) },
  { id: "benefits", tone: "bad", re: /\b(?:pausing|suspending|pause|suspend)\b[^.]*\b(?:401\(k\)|retirement|pension) match\b|\b(?:401\(k\)|retirement) match\b[^.]*\b(?:paused|suspended)\b/i,
    build: (s) => L(withWhen(s, "The 401(k) match is stopping"), withWhen(s, "No 401(k) match"), withWhen(s, "Your free retirement money is paused")) },
  { id: "no-raises", tone: "bad", re: /\bbonus(?:es)?\b[^.]*\b(?:funded|paid(?: out)?) at (\d{1,2})% of target\b/i,
    build: (s, m) => L(`Bonuses will be about ${m[1]}% of the normal amount.`, `Smaller bonuses: ${m[1]}% of target.`, `You're getting ${m[1]}% of your bonus. The rest is "funding."`) },
  { id: "no-raises", tone: "bad", re: /\bmerit (?:increases?|raises?)\b[^.]*\b(?:modest|smaller|lower|limited)\b/i,
    build: () => L("Raises will be smaller this year.", "Small or no raises this cycle.", "Don't expect much of a raise.") },
  { id: "no-raises", tone: "bad", re: /\bnot in a position to (?:offer|give) (?:you )?a raise\b/i, build: () => L("No raise for now.", "The answer on a raise is no.", "No raise. \"Not in a position\" means no.") },
  { id: "benefits", tone: "bad", re: /\bunused (?:vacation|PTO|leave) (?:days )?(?:will )?no longer (?:roll|carry)/i,
    build: () => L("Unused vacation days now expire at the end of the year.", "Use your vacation or lose it.", "Use it or lose it. Untaken vacation now disappears.") },
  { id: "benefits", tone: "bad", re: /\bflights? must (?:now )?be booked in economy\b|\btravel policy\b[^.]*\beconomy\b/i,
    build: () => L("Travel is getting cheaper for the company: all flights must be economy now.", "No more premium seats. Economy only.", "Enjoy the middle seat. Economy only.") },
  { id: "benefits", tone: "bad", re: /\b(?:will )?(?:now )?(?:require|need)s? (?:manager|VP|finance|director) approval\b/i, unless: /\bspend\w*|purchas\w*|discretionary|contractor\b/i,
    build: (s) => { const t = subjectOf(s) || "it"; return L(`${cap(t)} is harder to get now: it needs approval first.`, `${cap(t)} now needs sign-off, so expect fewer approvals.`, `${cap(t)} now comes with paperwork and a gatekeeper.`); } },
  { id: "benefits", tone: "bad", re: /\b(?:granted|offered|given|awarded) on a (?:more )?selective basis\b|\bmore selective\b/i,
    build: (s) => { const t = subjectOf(s) || "it"; return L(`Fewer people will get ${t.replace(/^the /, "")}.`, `${cap(t.replace(/^the /, ""))}: fewer people will get them.`, `Most people won't get ${t.replace(/^the /, "")} anymore.`); } },
  { id: "benefits", tone: "bad", re: /\bwill (?:now )?(?:only )?be (?:offered|available|served|provided) (?:on )?(\w+(?:days?)?(?: and \w+days)?) only\b|\bonly (?:on )?(\w+days and \w+days)\b/i,
    build: (s, m) => { const t = subjectOf(s) || "it"; const d = m[1] ?? m[2]; return L(`${cap(t)} is being cut back to ${d} only.`, `Less ${t.replace(/^the /, "")}: ${d} only.`, `${cap(t)} got cut to ${d}.`); } },
  // from X to Y with numbers: smaller for a benefit = cut, bigger for a cost = increase
  { id: "benefits", tone: "bad", re: /\bfrom\s+\$?[\d,.]+/i, when: (s) => { const f = fromTo(s); return f && f.down === true && BENEFIT_THINGS.test(s); },
    build: (s) => { const f = fromTo(s); const t = subjectOf(s) || "it"; return L(`${cap(t)} is being cut from ${f.a} to ${f.b}.`, `${cap(t)} got cut: ${f.a} down to ${f.b}.`, `${cap(t)} went from ${f.a} to ${f.b}. That's a cut.`); } },
  { id: "benefits", tone: "bad", re: /\b(?:capped|cap) at (\$?[\d,]+)[^.]*\bdown from (\$?[\d,]+)/i,
    build: (s, m) => { const t = subjectOf(s) || "it"; return L(`${cap(t)} is being cut from ${m[2]} to ${m[1]}.`, `${cap(t)}: ${m[2]} down to ${m[1]}.`, `${cap(t)} got cut to ${m[1]}, from ${m[2]}.`); } },
  { id: "hiring-freeze", tone: "bad", re: /\bpromotions?\b[^.]*\b(?:limited|fewer|paused|on hold|restricted)\b/i,
    build: () => L("Fewer promotions this cycle.", "Promotions are limited this cycle.", "Promotions are mostly off this cycle.") },

  // ---- Costs and prices ----
  { id: "cost-increase", tone: "bad", re: /\bprices?\b[^.]*\b(?:increase|go up|rise)\b[^.]*\bby (\d+(?:\.\d+)?%)/i,
    build: (s, m) => L(withWhen(s, `Prices are going up ${m[1]}`), withWhen(s, `Price increase: ${m[1]}`), withWhen(s, `Everything costs ${m[1]} more`)) },
  { id: "cost-increase", tone: "bad", re: /\badjust\w* (?:our )?pric\w*|\bupdat\w* (?:our )?pricing\b|\bpric\w* (?:adjustment|update|change)s?\b/i,
    build: () => L("Prices are going up.", "Price increase.", "Prices are going up. \"Adjusting\" always means up.") },
  { id: "cost-increase", tone: "bad", re: /\brenew\w* at (?:the|a) new (?:rate|price) of (\$[\d,.]+(?: per \w+| a \w+|\/\w+)?)/i,
    build: (s, m) => L(`Your price is going up to ${m[1]}.`, `Price increase: ${m[1]}.`, `It now costs ${m[1]}. "New rate" means higher.`) },
  { id: "cost-increase", tone: "bad", re: /\bwill (?:now )?cost (\$[\d,.]+(?: per \w+| a \w+)?)|\b(?:introduc\w*|add\w*) (?:a )?(\$[\d,.]+ )?(?:small |new )?(?:convenience |processing |service )?fee\b|\b(?:convenience|processing|service|admin\w*|handling) fee will (?:be )?(?:added|applied|charged|apply)\b|\bsurcharge\b|\bwill now charge for\b|\bno longer (?:be )?free\b|\bcharged back for\b|\b(?:free (?:tier|plan)) will be limited to (\d+ \w+)/i,
    build: (s, m) => { const t = subjectOf(s) || "it";
      if (m[1]) return L(`${cap(t)} isn't free anymore: it's ${m[1]}.`, `${cap(t)} now costs ${m[1]}.`, `${cap(t)} costs ${m[1]} now. Budget accordingly.`);
      if (/\bfee\b/i.test(s)) { const what = s.match(/fee (?:for|to|on) ([^.]+?)(?:\.|$)/i)?.[1] ?? s.match(/added to ([^.]+?)(?:\.|$)/i)?.[1] ?? "this"; const cs = /\b(?:all|payments|orders|purchases|transactions|bookings|tickets)\b/i.test(what) && /s$/i.test(what) ? "cost" : "costs"; return L(`New fee${m[2] ? ` of ${m[2].trim()}` : ""}: ${what} now ${cs} extra.`, `${cap(what)} now ${cs} extra${m[2] ? `: ${m[2].trim()}` : ""}.`, `You'll pay extra for ${what}${m[2] ? ` (${m[2].trim()})` : ""}. "Convenience" is for them.`.replace(/ "Convenience" is for them\.$/, /convenience/i.test(s) ? ` "Convenience" is for them.` : "")); }
      if (/charge for/i.test(s)) { const what = s.match(/charge for ([^.]+?)(?:\.|$)/i)[1]; return L(`${cap(what)} isn't free anymore.`, `You'll pay for ${what} now.`, `Free ${what} is over.`); }
      if (/charged back/i.test(s)) return L("Teams will now pay for their own cloud usage out of their budgets.", "Cloud costs now come out of your team's budget.", "Your team now pays for its own cloud bill. Expect budget fights.");
      if (m[3]) return L(`The free plan now only allows ${m[3]}.`, `Less free stuff: ${m[3]} max on the free plan.`, `The free plan shrank to ${m[3]}. Upgrade, they hope.`);
      const cond = s.match(/\bon ([^.]+?)(?:\.|$)/i)?.[1]; return L(`${cap(t)} isn't free anymore${cond ? ` on ${cond}` : ""}.`, `You'll pay for ${t.replace(/^the /, "")}${cond ? ` on ${cond}` : ""} now.`, `Free ${t.replace(/^the /, "")} is over${cond ? ` for ${cond}` : ""}.`); } },
  { id: "budget-freeze", tone: "bad", re: /\bovertime\b[^.]*\bpre-?approv/i,
    build: () => L("Overtime now needs approval first, so expect less of it.", "Overtime needs sign-off now.", "Overtime is now a permission slip.") },

  // ---- Freezes ----
  { id: "hiring-freeze", tone: "bad", re: /\bpaus\w* (?:all )?(?:non-critical |non-essential )?hiring\b|\bhiring (?:is )?(?:paused|frozen|on hold)\b|\b(?:open )?req(?:uisition)?s? (?:are )?on hold\b|\bdisciplined about headcount\b|\bheadcount growth\b|\bbackfills? will be (?:evaluated|reviewed|considered) on a case-by-case\b/i,
    build: (s) => /backfill/i.test(s) ? L("If someone leaves, they may not be replaced.", "People who leave might not be replaced.", "Someone quits, you do their job.") : L("Hiring is frozen. No new people for now.", "Hiring freeze.", "No help is coming. Nobody new is being hired."), },
  { id: "budget-freeze", tone: "bad", re: /\bdiscretionary (?:spend\w*|purchases)\b[^.]*\b(?:approval|frozen|paused|suspended)\b|\bhold off on (?:any )?new [\w ]*purchases\b|\b(?:budget|travel|offsites?|conferences?)\b[^.]*\b(?:eliminated|suspended|paused|cut|frozen)\b|\bnon-essential travel\b|\bcontractor engagements?\b[^.]*\bapprov/i,
    build: (s) => { const w = whenOf(s); const what = /travel/i.test(s) ? "work travel" : /offsite/i.test(s) ? "team offsites" : /conference/i.test(s) ? "conference budget" : /software/i.test(s) ? "new software purchases" : /contractor/i.test(s) ? "new contractors" : "optional spending";
      if (/approv/i.test(s)) return L(`${cap(what)} now needs sign-off, so expect a lot less of it.`, `${cap(what)} is basically frozen. Everything needs approval.`, `${cap(what)} is frozen with extra steps.`);
      return L(`No ${what.replace(/^new /, "new ")}${w ? ` ${w.replace(/^(?:starting|on) /, "")}` : " for now"}.`.replace(/No conference budget/, "No conference budget"), `${cap(what)} is frozen${w ? ` ${w}` : ""}.`, `${cap(what)}: cancelled${w ? ` ${w}` : ""}. Money is tight.`); } },

  // ---- Return to office ----
  { id: "rto", tone: "warn", re: /\b(?:in the office|in office|on-?site|in person) (\w+|\d) days? (?:a|per) week\b|\b(\w+|\d) days? (?:a|per) week in the office\b/i,
    build: (s, m) => { const n = m[1] ?? m[2]; return L(withWhen(s, `You have to be in the office ${n} days a week`), withWhen(s, `Back to the office ${n} days a week`), withWhen(s, `Return to office: ${n} days a week. Mandatory`)); } },
  { id: "rto", tone: "warn", re: /\b(?:work|be|come in|working) (?:from|in|at|to) (?:our|the) offices? (\w+|\d) days? (?:a|per) week\b/i,
    build: (s, m) => L(withWhen(s, `You have to work from the office ${m[1]} days a week`), withWhen(s, `Back to the office ${m[1]} days a week`), withWhen(s, `Return to office: ${m[1]} days a week. Mandatory`)) },
  { id: "rto", tone: "warn", re: /\b(?:Mondays|Tuesdays|Wednesdays|Thursdays|Fridays)\b[^.]*\b(?:in the office|anchor|on-?site)\b/i,
    build: (s) => { const d = (s.match(/\b(?:Mondays|Tuesdays|Wednesdays|Thursdays|Fridays)\b/g) ?? []).map((x) => x.replace(/s$/, "")); if (!d.length) return null; const days = d.length > 1 ? `${d.slice(0, -1).join(", ")} and ${d.at(-1)}` : d[0]; return L(`You're expected in the office on ${days}.`, `Office days are now ${days}.`, `${days}: be at your desk. That's the policy.`); } },
  { id: "rto", tone: "warn", re: /\bhub-based\b|\bwork from (?:your|their) nearest office\b|\bwithin (\d+) miles of an office\b|\bremote (?:work|arrangements?)\b[^.]*\b(?:require|reviewed|may not continue|exception|no longer)\b|\bfully remote\b[^.]*\b(?:reviewed|end|may not)\b|\battendance\b[^.]*\bperformance\b|\bhybrid flexibility\b[^.]*\breduc\w* to (\w+|\d) remote days?\b|\bconsolidat\w* to fewer offices\b|\bbadge (?:data|swipes)\b/i,
    build: (s, m) => { if (m[1]) return L(`If you live within ${m[1]} miles of an office, you have to come back in.`, `Within ${m[1]} miles? You're back in the office.`, `Live within ${m[1]} miles? Pack a lunch.`);
      if (m[2]) return L(`You only get ${m[2]} remote day a week now.`, `Remote days cut to ${m[2]} a week.`, `${cap(m[2])} remote day a week. The rest is office.`);
      if (/fewer offices/i.test(s)) return L("Some offices are closing, and some people will have to move.", "Office closures. Some of you will have to relocate.", "Move to another city or find another job.");
      if (/badge/i.test(s)) return L("They'll track badge swipes to see who comes in.", "Office attendance is being tracked.", "They're counting your badge swipes.");
      if (/attendance/i.test(s)) return L("Coming to the office now affects your performance review.", "Office attendance now counts in your review.", "Skip the office, hurt your review.");
      if (/hub|nearest office/i.test(s)) return L("You'll have to work from your nearest office.", "Back to the office: your nearest one.", "Remote is over. Find your nearest office.");
      return L("Remote work is no longer the default. You may need approval to stay remote.", "Fully remote is being rolled back.", "Remote work is ending for most people."); } },

  // ---- Reorgs and leaders leaving ----
  { id: "departure", tone: "warn", re: /\b([A-Z][a-z]+|[Oo]ur (?:VP|CEO|CTO|CFO|COO|head|director)[\w ]*?) (?:has decided to step down|will be stepping down|is stepping down|will be transitioning out(?: of (?:his|her|their) role)?|is transitioning out(?: of (?:his|her|their) role)?|will be pursuing other opportunities|is leaving|will be leaving)\b(?: (?:from her role |from his role |from their role )?as ([A-Z]{2,4}|[\w ]+?))?(?: (?:of|at|outside) the company)?(?: at (the end of the month|the end of the quarter|[^.]+))?[.]/,
    build: (s, m) => { const who = m[1].replace(/^Our /, "The "); const role = m[2] ? ` as ${m[2]}` : ""; const when = m[3] ? ` at ${m[3]}` : ""; const forced = /pursuing other opportunities|transitioning out/i.test(s);
      return L(`${who} is ${/step/i.test(s) ? "stepping down" : "leaving"}${role}${when}.`, `${who} is out${role}${when}.`, `${who} is leaving${role}${when}.${forced ? ` "${/pursuing/i.test(s) ? "Pursuing other opportunities" : "Transitioning out"}" usually means it wasn't their idea.` : ""}`); } },
  { id: "departure", tone: "warn", re: /\binterim (?:CFO|CEO|CTO|COO|head|leader|director)\b/i,
    build: (s) => { const r = s.match(/\binterim (CFO|CEO|CTO|COO|head of \w+|leader|director)\b/i)[1]; return L(`The ${r} is gone. A temporary ${r} is filling in while they hire.`, `No permanent ${r} right now.`, `The ${r} left. Somebody is holding the seat warm.`); } },
  { id: "reorg", tone: "warn", re: /\b(?:will (?:now )?report|now reports?|is moving under|are moving under|will move under|reporting) (?:in)?to\b|\bmoving under\b|\bwill be leading the combined\b|\bcentraliz\w*\b|\brealign\w* (?:our )?teams around\b|\bwill (?:now )?go through\b|\bteams will be combined\b/i,
    build: (s) => { const lead = s.match(/\b([A-Z][a-z]+) will be leading the combined ([\w ]+?) team\b/);
      if (lead) return L(`${lead[2].replace(/^\w/, (c) => c.toUpperCase())} are merging into one team under ${lead[1]}.`, `${lead[1]} now runs ${lead[2]}.`, `${lead[1]} got the merged ${lead[2]} team. Someone else didn't.`);
      const under = s.match(/^(?:Effective \w+,\s*)?(?:The |Our )?([\w ]+? (?:team|org|group))\b[^.]*?\b(?:report (?:in)?to|reports (?:in)?to|under|into) (?:the )?([\w ]+? (?:org|organization|team|group)|engineering|product|sales|finance|marketing)\b/i);
      const tgt = (x) => (/^(?:engineering|product|sales|finance|marketing)$/i.test(x) ? x : x.replace(/^(?!the )/, "the "));
      if (under) return L(`The ${under[1].toLowerCase()} now reports to ${tgt(under[2])}.`, `Reorg: the ${under[1].toLowerCase()} moves under ${tgt(under[2])}.`, `The ${under[1].toLowerCase()} lost its independence. It now sits under ${tgt(under[2])}.`);
      if (/go through/i.test(s)) { const w = s.match(/go through (?:the )?([\w ]+)/i)[1]; const what = subjectOf(s) || "these decisions"; return L(`${cap(what)} now need the ${w}'s sign-off.`, `${cap(what)} now go through the ${w}.`, `You can't make ${what.replace(/^all /, "")} on your own anymore. A committee does.`); }
      if (/centraliz/i.test(s)) { const w = s.match(/centraliz\w* ([\w ]+?) into/i)?.[1] ?? "it"; return L(`${cap(w)} is being merged into one central team.`, `${cap(w)} is being consolidated.`, `${cap(w)} is being centralized. Local teams may shrink.`); }
      return L("Teams are being reorganized.", "Reorg. Teams are being reshuffled.", "Reorg. New boxes on the org chart."); } },

  // ---- Shutdowns and sunsets ----
  { id: "shutdown", tone: "bad", re: /\b(?:retir(?:e|es|ing|ed) (?:the|our|support|version|v\d|[A-Z])|discontinu\w*|sunset\w*|deprecat\w*|winding down|wind down|shut\w* down|close permanently|closing permanently|will close|going away|no longer be published|no longer be offered|no longer be available|stop supporting|support for [\w .]+ will end|moving off|phas\w* out)\b/i,
    unless: /\b(?:during|while|until) (?:the )?(?:renovation|maintenance|repairs?|construction|upgrade|holiday)\b|\bfor (?:the|this) (?:weekend|holiday)\b|\bclose (?:at|early)\b/i,
    build: (s) => { const w = whenOf(s); let t = subjectOf(s);
      const off = s.match(/\bmoving off ([A-Z][\w]+|the [\w ]+)/i)?.[1]; if (off) return L(`We're dropping ${off}.`, `Goodbye, ${off}.`, `${off} is getting replaced. Learn the new tool.`);
      const sup = s.match(/\bstop supporting ([A-Z][\w ]+?)(?: on| by| at|\.|$)/i)?.[1] ?? s.match(/\bsupport for ([\w .]+?) will end/i)?.[1]; if (sup) return L(`${sup} won't be supported${w ? ` ${w.replace(/^on /, "after ")}` : " anymore"}.`, `${cap(sup)}: no more support${w ? ` ${w.replace(/^on /, "after ")}` : ""}.`, `${cap(sup)} is on its own${w ? ` ${w.replace(/^on /, "after ")}` : ""}.`);
      const disc = s.match(/\bdiscontinue (?:the |our )?([\w ]+?)(?:\.|,| on| by| starting|$)/i)?.[1]; if (disc) t = `the ${disc}`;
      const sun = s.match(/\bsunset\w* (?:the |our )?([\w ]+?)(?:\.|,| on| by| at| effective| starting| in|$)/i)?.[1]; if (sun && !/^(?:the|our)$/i.test(sun)) t = `the ${sun}`;
      const ret = s.match(/\bretir\w* (?:the |our )?([\w ]+?)(?:\.|,| on| by| at|$)/i)?.[1]; if (ret) t = `the ${ret}`;
      if (/\bthe ([\w ]+?) (?:plan|tier) is going away/i.test(s)) t = `the ${s.match(/\bthe ([\w ]+? (?:plan|tier)) is going away/i)[1]}`;
      t = (t || "it").replace(/ and (?:\w+ing|our|the)\b.*$/i, ""); const perm = /permanent/i.test(s) ? " for good" : "";
      if ((t === "it" || !t) && /, and (?:the |our )?([\w ]+?) (?:will|is|are)\b/i.test(s)) t = `the ${s.match(/, and (?:the |our )?([\w ]+?) (?:will|is|are)\b/i)[1]}`;
      if (BENEFIT_THINGS.test(t) || (BENEFIT_THINGS.test(s) && !/\b(?:office|app|product|plan|tier|version|feature|dashboard|tool|service)\b/i.test(t))) return { id: "benefits", lines: L(`${cap(t)} ${/s$/.test(t) ? "are" : "is"} going away${w ? ` ${w}` : ""}.`, `${cap(t)}: ending${w ? ` ${w}` : ""}.`, `${cap(t)} ${/s$/.test(t) ? "are" : "is"} gone${w ? ` ${w}` : ""}. Another perk bites the dust.`) };
      return L(`${cap(t)} is shutting down${perm}${w ? ` ${w}` : ""}.`, `${cap(t)} is going away${perm}${w ? ` ${w}` : ""}.`, `${cap(t)} is dead${w ? ` ${w}` : ""}. ${/winding down/i.test(s) ? "\"Winding down\" is a slow goodbye." : /deprecat/i.test(s) ? "\"Deprecated\" means gone soon." : /sunset/i.test(s) ? "\"Sunsetting\" means shutting down." : "They're pulling the plug."}`); } },

  // ---- Problems ----
  { id: "problem", tone: "bad", re: /\bservice (?:disruption|interruption)\b|\bsecurity incident\b|\b(?:issue|problem|incident) (?:impacting|affecting) ([\w ]+?)(?: and|\.|,|$)/i,
    build: (s, m) => { const what = m[1] ? m[1].replace(/^(?:some )?/, "") : ""; return what ? L(`${cap(what)} ${/s$/.test(what) && !/ss$/.test(what) ? "are" : "is"} broken right now, and they're working on it.`, `${cap(what)} ${/s$/.test(what) ? "are" : "is"} down.`, `${cap(what)} broke. They're on it.`) : L(withWhen(s, "There was an outage that hit some customers").replace(/ (?:the )?last night$/, " last night"), "Something broke and customers noticed.", "It went down. Customers noticed."); } },
  { id: "problem", tone: "bad", re: /\b(?:results?|numbers|revenue|sales) (?:came in |were |was )?(?:below|under|short of) (?:expectations|target|plan|forecast)\b|\bmissed (?:our )?(?:revenue |sales |quarterly )?(?:target|goal|forecast|numbers)\b/i,
    build: (s) => { const q = s.match(/\b(Q[1-4])\b/)?.[1]; const what = /revenue/i.test(s) ? "revenue" : "results"; return L(`${q ? `${q} ${what}` : cap(what)} came in below target.`, `We missed our ${what === "revenue" ? "revenue target" : "numbers"}${q ? ` in ${q}` : ""}.`, `Bad ${q ?? "quarter"}. We missed the number.`); } },
  { id: "problem", tone: "bad", re: /\bunauthorized (?:party|access|third party)\b|\bdata (?:breach|incident)\b/i,
    build: () => L("There was a data breach. Customer data may have been exposed.", "Data breach: someone got into customer data.", "We got hacked.") },
  { id: "problem", tone: "bad", re: /\btracking (?:red|behind|off track)\b|\boff track\b|\bat risk\b/i,
    build: (s) => { const t = subjectOf(s) || "the project"; return L(`${cap(t)} is in trouble.`, `${cap(t)} is off track.`, `${cap(t)} is on fire. "Red" means behind and over.`); } },
  { id: "problem", tone: "bad", re: /\b(?:identified|found|surfaced) (?:several |some |a number of |multiple )?(?:areas for improvement|gaps|findings|issues|deficiencies)\b/i,
    build: (s) => { const t = subjectOf(s) || "the review"; return L(`${cap(t)} found problems.`, `${cap(t)} found issues we have to fix.`, `${cap(t)} failed us on several points.`); } },
  { id: "no-raises", tone: "bad", re: /\bbonus(?:es)?\b[^.]*\b(?:reflect|tied to|based on)\b[^.]*\b(?:fell short|missed|below|short of)\b/i,
    build: () => L("Bonuses will be smaller because the company missed its targets.", "Bonuses will be smaller this year.", "Smaller bonuses. The company missed, so you pay.") },
  { id: "problem", tone: "bad", re: /^[^?]*\b(?:arrived|came|showed up|was delivered|were delivered) (?:damaged|broken|defective|faulty)\b[^?]*$/i,
    build: (s) => { const t = (s.match(/^(.*?)\s+(?:arrived|came|showed up|was delivered|were delivered) /i)?.[1] || "it").replace(/^(?:unfortunately|sadly),?\s+/i, "").replace(/^The /, "the ").replace(/^(?!the |our |your |a |an )/i, "the "); const rep = /replac/i.test(s); return L(`${cap(t)} arrived damaged${rep ? " and has to be replaced" : ""}.`, `${cap(t)} came in damaged${rep ? ", so it needs replacing" : ""}.`, `${cap(t)} showed up broken.${rep ? " Expect a delay while it's replaced." : ""}`); } },
  { id: "problem", tone: "bad", unless: /\b(?:address|addressing|manage|managing|tackle|tackling) underperform\w*|\bexpect (?:leaders|managers|everyone|you|all)\b/i, re: /\bchurn\b[^.]*\bhigher than\b|\bheadwinds in\b|\bdid not deliver the (?:expected )?(?:results|outcomes)\b|\bdidn't deliver the (?:expected )?(?:results|outcomes)\b|\bfell short\b|\bunderperform\w*/i,
    build: (s) => { if (/churn/i.test(s)) return L("Too many customers are leaving.", "Customers are leaving faster than we'd like.", "Customers are leaving. A lot of them."); const seg = s.match(/headwinds in (?:the )?([\w ]+?)(?: segment| market|\.|$)/i)?.[1]; if (seg) return L(`${cap(seg)} sales are struggling.`, `${cap(seg)} is having a hard time.`, `${cap(seg)} is losing. "Headwinds" means losing.`); const t = subjectOf(s) || "it"; return L(`${cap(t)} didn't work.`, `${cap(t)} failed.`, `${cap(t)} flopped.`); } },

  // ---- Performance ----
  { id: "pip", tone: "bad", re: /\bdevelopment plan to help you meet expectations\b|\bincreased visibility over the next (\d+) days\b|\bneed to see (?:significant |meaningful )?improvement\b|\bneed to see more consistent\b|\bimprovement plan\b/i,
    build: (s, m) => m[1] ? L(`You'll be watched closely for the next ${m[1]} days. This is a performance warning.`, `${m[1]}-day performance watch.`, `This is a performance plan. You have ${m[1]} days.`) : /development plan/i.test(s) ? L("You're not meeting expectations, and they're putting you on a formal plan.", "You're being put on a performance plan.", "It's a PIP. Start updating your resume.") : L("Your work needs to get noticeably better before your next review.", "Improve before your next review, or it'll be a bad one.", "This is a warning. Improve fast.") },
  { id: "performance", tone: "warn", re: /\b(?:discuss|talk about|review) your (?:recent )?performance\b|\bconcerns (?:have been |were )?raised about your\b/i,
    build: (s) => /concerns/i.test(s) ? L(`People have complained about your ${s.match(/about your ([\w ]+?)(?:\.|$)/i)?.[1] ?? "work"}.`, `There have been complaints about your ${s.match(/about your ([\w ]+?)(?:\.|$)/i)?.[1] ?? "work"}.`, `People are complaining about your ${s.match(/about your ([\w ]+?)(?:\.|$)/i)?.[1] ?? "work"}. This is going in your file.`) : L("Your manager has concerns about your work and wants to talk.", "Your performance is a problem. Expect a hard conversation.", "This is a warning meeting about your performance.") },

  // ---- Hedges: no concrete news, but something is coming ----
  { id: "delay", tone: "warn", re: new RegExp(String.raw`\b(?:will now|now) (?:complete|launch|ship|happen|land|arrive|close|finish|go live) (?:in|on|by) (${DATE}) instead of (${DATE})`, "i"),
    build: (s, m) => { const t = thingOf(s) || subjectOf(s) || "it"; return L(`${cap(t)} is delayed from ${m[2]} to ${m[1]}.`, `${cap(t)} slipped to ${m[1]}.`, `${cap(t)}: ${m[1]} now, not ${m[2]}.`); } },
  { id: "delay", tone: "warn", re: /\b(one|two|three|a few|\d+) (days?|weeks?) later than (?:usual|planned|expected|normal)\b/i,
    build: (s, m) => { const t = subjectOf(s) || "it"; return L(`${cap(t)} will be ${m[1]} ${m[2]} late.`, `${cap(t)} is ${m[1]} ${m[2]} late.`, `${cap(t)} is late by ${m[1]} ${m[2]}.`); } },
  { id: "benefits", tone: "bad", re: /\b(\w+) days? a week instead of (\w+)\b/i, when: (s) => BENEFIT_THINGS.test(s),
    build: (s, m) => { const t = subjectOf(s) || "it"; return L(`${cap(t)}: ${m[1]} days a week now, down from ${m[2]}.`, `${cap(t)} cut to ${m[1]} days a week.`, `${cap(t)}, now only ${m[1]} days a week.`); } },
  { id: "budget-freeze", tone: "bad", re: /\b(?:must (?:now )?be approved by|require\w* (?:a )?(?:CFO|VP|CEO|exec\w*|finance) (?:sign-?off|approval))\b|\blimited to (?:customer-critical|business-critical|essential)\b/i,
    build: (s) => { const what = /travel/i.test(s) ? "Work travel" : /software/i.test(s) ? "New software purchases" : "Spending"; const who = s.match(/\b(CFO|VP|CEO|finance|director)\b/i)?.[1] ?? "a senior leader"; return L(`${what} now needs ${/^[aeiou]/i.test(who) ? "an" : "a"} ${who}'s approval, so expect a lot less of it.`, `${what} is being clamped down: ${who} approval only.`, `${what} is basically frozen. Good luck getting ${who} sign-off.`); } },
  { id: "reorg", tone: "warn", re: /\b(?:combining|merging|consolidating) (?:the )?([\w ]+?) (?:and|with) (?:the )?([\w ]+?) (?:teams? )?into (?:one|a single)\b|\brouted through a central\b/i,
    build: (s, m) => m && m[1] ? L(`${cap(m[1])} and ${m[2]} are being merged into one team.`, `Reorg: ${m[1]} and ${m[2]} are merging.`, `${cap(m[1])} and ${m[2]} are merging. Fewer seats, probably.`) : L("Requests now have to go through a central team.", "There's a new central gatekeeper for requests.", "More process: everything goes through one team now.") },
  // ---- Round 9b: broader phrasings found on fresh batch 18 ----
  { id: "layoffs", tone: "bad", re: /\b(?:letting go|let go)(?: of)? (?:some |a number of |several |our |the )?([\w -]{3,60}?)(?: (?:effective|starting|on|by|this|next|at)\b|[.,]|$)/i,
    unless: /\blet go of (?:the|this|that) (?:idea|plan|project|feature|tool)\b|\b(?:habits?|ideas?|assumptions?|the past|grudges?|old ways|ego|control|perfection)\b/i,
    build: (s, m) => { const who = m[1].replace(/^(?:of )/, ""); const w = whenOf(s); return L(`Layoffs: ${who} ${/s\b/.test(who) ? "are" : "is"} being let go${w ? ` ${w}` : ""}.`, `${cap(who)} ${/s\b/.test(who) ? "are" : "is"} getting cut${w ? ` ${w}` : ""}.`, `${cap(who)}: laid off${w ? ` ${w}` : ""}. "Letting go" means laid off.`); } },
  { id: "delay", tone: "warn", re: /\b(?:take|takes|taking|need|needs) (?:an )?(?:additional|extra|more|another) (\d+|a few|several|two|three) (?:more )?((?:business |working )?(?:days|weeks|months))\b|\b(?:additional|extra) (\d+) ((?:business |working )?(?:days|weeks)) to (?:process|complete|arrive)\b/i,
    build: (s, m) => { const n = `${m[1] ?? m[3]} ${m[2] ?? m[4]}`; const t = subjectOf(s) || "it"; return L(`${cap(t)} will take ${n} longer than planned.`, `${cap(t)} is delayed by ${n}.`, `${cap(t)}: another ${n}. Keep waiting.`); } },
  { id: "benefits", tone: "bad", re: /\b(?:cut|reduced|slashed) (?:in half|by half|by (\d+%))\b|\bhalved\b/i,
    build: (s, m) => { const t = subjectOf(s) || "a benefit"; const by = m[1] ? `by ${m[1]}` : "in half"; return L(`${cap(t)} is being cut ${by}.`, `${cap(t)}: cut ${by}.`, `${cap(t)} got cut ${by}. Plan around it.`); } },
  { id: "budget-freeze", tone: "bad", re: /\b(?:non-essential|non-critical|discretionary|all) (?:spending|spend|purchases|expenses)\b[^.]*\b(?:on hold|paused|frozen|suspended|halted)\b|\bsuspend\w* (?:all )?(?:conference |business |work |non-essential )?travel\b|\btravel (?:is |will be )?(?:suspended|paused|on hold)\b/i,
    build: (s) => { const w = whenOf(s) || (/until further notice/i.test(s) ? "until further notice" : /rest of the year/i.test(s) ? "for the rest of the year" : ""); const what = /travel/i.test(s) ? (/conference/i.test(s) ? "Conference travel" : "Work travel") : "Optional spending"; return L(`${what} is frozen${w ? ` ${w}` : ""}.`, `${what}: frozen${w ? ` ${w}` : ""}.`, `${what} is frozen${w ? ` ${w}` : ""}. Money is tight.`); } },
  { id: "hiring-freeze", tone: "bad", re: /\bpromotions?\b[^.]*\b(?:deferred|delayed|postponed|pushed)\b/i,
    build: (s) => { const w = s.match(/until (?:the )?([\w ]+?)(?:\.|$)/i)?.[1]; return L(`Promotions are on hold${w ? ` until the ${w}` : ""}.`, `No promotions for now${w ? `, not until the ${w}` : ""}.`, `Promotions are delayed${w ? ` until the ${w}` : ""}. Don't hold your breath.`); } },
  { id: "rto", tone: "warn", re: /\b(?:ending|end|eliminating|discontinuing|sunsetting) (?:our |the )?(?:fully )?remote(?: work| first)? (?:policy|program|option|arrangements?)\b|\bno longer (?:offer|support|allow) (?:fully )?remote\b|\b(?:need|required|have) to relocate\b/i,
    build: (s) => /relocate/i.test(s) ? L("If you don't live near an office, you'll have to move or work something out with HR.", "Live far from an office? Move, or talk to HR.", "Move near an office or start looking.") : L("Fully remote work is ending.", "No more fully remote.", "Remote is over.") },
  { id: "cost-increase", tone: "bad", re: /\b(?:fee|fees|price|prices|rate|subscription|plan|cost)\b[^.]*\b(?:increas\w*|go(?:es|ing)? up|ris\w*)\b[^.]*\bfrom (\$[\d,.]+) to (\$[\d,.]+)|\braising (?:our |the )?prices?\b(?:[^.]*\bby (\d+(?:\.\d+)?%))?/i,
    build: (s, m) => { if (m[1]) { const t = subjectOf(s) || "the price"; return L(`${cap(t)} is going up from ${m[1]} to ${m[2]}.`, `${cap(t)}: ${m[1]} now ${m[2]}.`, `You'll pay ${m[2]} instead of ${m[1]}.`); } const on = s.match(/prices? on ([^.]+?)(?: by|\.|$)/i)?.[1]; return L(`Prices are going up${m[3] ? ` ${m[3]}` : ""}${on ? ` on ${on}` : ""}.`, `Price increase${m[3] ? `: ${m[3]}` : ""}${on ? ` on ${on}` : ""}.`, `It costs more now${m[3] ? `, ${m[3]} more` : ""}.`); } },
  { id: "cost-increase", tone: "bad", re: /\b(?:a |an )?(\$[\d,.]+) (?:charge|fee|surcharge) for ([^.]+?)(?:\.|$)|\b(late|processing|service|admin\w*|handling|convenience) fee of (\$[\d,.]+) will be (?:applied|charged|added)(?: to ([^.]+?))?(?:\.|$)/i,
    build: (s, m) => m[1] ? L(`${cap(m[2])} now cost ${m[1]}.`, `New ${m[1]} charge for ${m[2]}.`, `${cap(m[2])} aren't free anymore: ${m[1]}.`) : L(`New ${m[3]} fee: ${m[4]}${m[5] ? ` on ${m[5]}` : ""}.`, `Pay ${m[4]} extra${m[5] ? ` on ${m[5]}` : ""}.`, `${m[4]} ${m[3]} fee${m[5] ? ` on ${m[5]}` : ""}. Pay on time.`) },
  { id: "problem", tone: "bad", re: /\b(?:experiencing|having|had) an? (?:outage|service outage|incident|disruption)\b(?: affecting ([^.]+?))?(?:\.|$)|\bencountered (?:unexpected |some |several )?(?:issues|problems|errors)\b|\bhas been rolled back\b|\b(?:decided not to renew|will not renew|won't renew|not renewing)\b|\b(?:scores?|engagement|satisfaction|NPS|morale)\b[^.]*\b(?:dropped|declined|fell|decreased)\b|\buncovered (?:several |some |a number of |multiple )?(?:issues|gaps|findings|problems|deficiencies)\b/i,
    build: (s, m) => { if (/outage|incident|disruption/i.test(s) && m[1]) return L(`It's broken right now: ${m[1]}.`, `Outage: ${m[1]}.`, `It's down. ${cap(m[1])}.`); if (/rolled back|encountered/i.test(s)) { const t = subjectOf(s) || "it"; return L(`${cap(t)} failed${/rolled back/i.test(s) ? " and was undone" : ""}.`, `${cap(t)} broke${/rolled back/i.test(s) ? ", so they undid it" : ""}.`, `${cap(t)} failed. Back to square one.`); } if (/renew/i.test(s)) { const t = subjectOf(s) || "a customer"; return L(`${cap(t)} is leaving.`, `We lost ${t.replace(/^the /, "our ")}.`, `${cap(t)} quit us. That hurts.`); } if (/uncovered/i.test(s)) { const t = subjectOf(s) || "the review"; return L(`${cap(t)} found problems${/expense/i.test(s) ? " with expense controls" : ""}.`, `${cap(t)} found issues we have to fix.`, `${cap(t)} failed us on several points.`); } const t = subjectOf(s) || "scores"; return L(`${cap(t)} went down${/significantly/i.test(s) ? " a lot" : ""}.`, `${cap(t)} fell.`, `${cap(t)} dropped. People are unhappy.`); } },
  { id: "performance", tone: "warn", re: /\b(?:fallen|fell|falls) (?:below|short of) (?:the )?(?:standard|bar|expectations?)\b|\bhas not met (?:the )?expectations\b|\bbelow (?:the )?(?:standard|expectations?) (?:we|for)\b/i,
    build: () => L("Your work isn't good enough, according to your manager.", "Your performance is a problem.", "This is a warning about your performance.") },
  { id: "hedge", tone: "warn", unless: /\b(?:specifics|can.t (?:share|comment|discuss|go into|get into))\b/i, re: /\blooking at (?:all |our |every |several )?options\b|\bno decisions? (?:have|has) been made\b|\breviewing (?:our )?(?:organizational |org |team )?structure\b|\bthere may be (?:some )?changes\b|\bwill share more (?:information |details )?(?:as|when)\b|\bas (?:it|more|information) becomes available\b|\bevaluating (?:our )?real estate\b|\ball options (?:remain|are) on the table\b|\bcontinue to evaluate\b/i,
    build: (s) => { const what = /real estate/i.test(s) ? "Offices may be closed or shrunk" : /structure/i.test(s) ? "A reorg may be coming" : /changes to the team|team changes/i.test(s) ? "Team changes, maybe cuts, may be coming" : "Something is being decided"; return L(`${what}, but nothing is decided or announced yet.`, `${what}. No details yet.`, `${what}. They're not saying what.`); } },
  { id: "hedge", tone: "warn", re: /\b(?:optimiz\w*|rethink\w*|right-?siz\w*) (?:our )?(?:real estate |office )?footprint\b|\btaking a (?:hard|close|careful) look at where we invest\b|\bexploring (?:a range of |all |several )?options\b|\bevaluating the long-term direction\b|\bchanges may be coming\b|\breviewing (?:our )?vendor relationships\b|\bthinking carefully about how we structure\b|\bnothing is final yet\b|\bmore details will be shared\b|\bleadership is aligning on next steps\b|\bassessing the impact\b|\bcommitted to being transparent as decisions are made\b/i,
    build: (s) => { const what = /footprint/i.test(s) ? "Offices may be closed or shrunk" : /where we invest/i.test(s) ? "Budgets may get cut" : /long-term direction/i.test(s) ? `The future of ${(s.match(/direction of (?:the |our )?([\w ]+?)(?:\.|$)/i)?.[1] ?? "this").replace(/^(?=\w)/, (s.match(/direction of (the |our )/i) ? "the " : ""))} is uncertain. It could be scaled back` : /how teams are organized|how we structure/i.test(s) ? "A reorg may be coming" : /vendor/i.test(s) ? "Some vendors may be dropped" : "Something is changing";
      return L(`${what}, but nothing is decided or announced yet.`, `${what}. No details yet.`, `${what}. Details "in the coming weeks," as they say.`); } },
  { id: "rto", tone: "warn", re: /\bbest work happens when we(?:'re| are) together\b|\bvalue of (?:being )?together in person\b/i,
    build: () => L("This sounds like the lead-in to a return-to-office push. No rule is announced yet.", "Probably a return-to-office push coming. No rule yet.", "This is how a return-to-office memo starts. The rule comes next.") },
];

/** The plain news in one sentence, or null. Returns { id, tone, lines: [mild, middle, csuite] }. */
export function readNews(sentence) {
  const s = String(sentence ?? "").trim();
  if (!s || s.length > 400) return null;
  for (const r of RULES) {
    const m = s.match(r.re);
    if (!m) continue;
    if (r.unless && r.unless.test(s)) continue;
    if (r.when && !r.when(s)) continue;
    let out;
    try { out = r.build(s, m); } catch { out = null; }
    const lines = Array.isArray(out) ? out : out?.lines;
    if (!lines || lines.some((x) => !x || /undefined|null/.test(x))) continue;
    return { id: out?.id ?? r.id, tone: out?.id && out.id !== r.id ? (NEWS_TONE[out.id] ?? r.tone) : r.tone, lines };
  }
  return null;
}

const NEWS_TONE = { benefits: "bad" };
export const NEWS_SIGNALS = {
  "good-news": { label: "Good news", tone: "good" },
  fyi: { label: "Just an FYI", tone: "none" },
  "cost-increase": { label: "It costs more", tone: "bad" },
  problem: { label: "Something went wrong", tone: "bad" },
  hedge: { label: "Vague on purpose", tone: "warn" },
};
// Bad news outranks a hedge, and both outrank good news when one memo has several.
export const NEWS_RANK = { "layoff-you": 10, layoffs: 9, pip: 8, shutdown: 7, "cost-increase": 6, benefits: 6, "no-raises": 6, "hiring-freeze": 5, "budget-freeze": 5, rto: 5, delay: 5, problem: 5, departure: 4, reorg: 4, performance: 4, hedge: 2, "good-news": 1, fyi: 0 };
