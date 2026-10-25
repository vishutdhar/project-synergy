// Round 8: concept rules for Corporate to Normal.
// The theme patterns in phrasebook.js match whole phrases, so a memo that says the same thing in new words
// ("a number of roles will be impacted", "we said goodbye to some talented colleagues") slipped through.
// Each rule here needs one word from every group in the same sentence, in any order. The groups are
// small vocabularies (who or what, and what happens to it), so new phrasings of the same idea still match.
// `unless` stops a rule when the sentence is about something else (an outage, a party, a customer).

const w = (s) => new RegExp(String.raw`\b(?:${s})\b`, "i");

const PEOPLE = w(String.raw`roles?|positions?|jobs?|colleagues|team ?members|teammates|employees|people|staff|headcount|workforce|members of (?:our|the) team|talented (?:people|folks|individuals)|friends`);
const STAFF = w(String.raw`roles?|positions?|jobs?|colleagues|team ?members|teammates|employees|staff|headcount|workforce|members of (?:our|the) team`);
const PRODUCT = w(String.raw`(?:new |billing |payroll |HR |CRM |ERP )?system|tool|launch|release|rollout|roll-out|go-live|go live|ship date|delivery|migration|upgrade|feature|version|v\d[\w.]*|beta|update|project|program|product|app|portal|platform|cutover|deadline|milestone|integration|redesign`);
const TIMELINE = w(String.raw`timelines?|schedules?|roadmap|dates?|plan|timing|sequencing`);
const LATER = w(String.raw`(?:early|mid|late)[- ](?:spring|summer|fall|autumn|winter)|rather than (?:in )?(?:January|February|March|April|May|June|July|August|September|October|November|December|Q[1-4])|(?:second|back|latter) half|later (?:in|this|next)|next (?:quarter|year|fiscal year|half|month|sprint|release)|Q[1-4]|(?:early|mid|late)[- ](?:next )?\w+|end of (?:the )?(?:year|quarter)|additional time|more time|a later date|until further notice`);
const SHIFTING = w(String.raw`now expect\w*|now (?:plan|anticipate|target)\w*|rather than|instead of (?:the )?(?:planned|original|previous)|reschedul\w*|postpon\w*|revisit\w*|re-?evaluat\w*|re-?assess\w*|re-?plan\w*|re-?sequenc\w*|adjust\w*|recalibrat\w*|refin\w*|updat\w* (?:the|our)|now (?:take place|happen|occur|land|arrive|ship|go live|launch|be available|begin|start|roll out)|move[sd]?|moving|shift\w*|push\w*|later than`);
const HEALTH = w(String.raw`health (?:insurance|care|plan|coverage|benefits?)|healthcare|medical|dental|vision|insurance|premiums?|deductibles?|copays?|benefits? costs?`);
const PAY_MORE = w(String.raw`(?:larger|greater|bigger|higher|increased) (?:share|portion|percentage|part)|pay more|contribute more|cost[- ]shar\w*|share (?:more|a greater|a larger) (?:of )?(?:the )?costs?|(?:increase|rise|go up|higher)`);
const LEAVE = w(String.raw`PTO|paid time off|vacation|leave|time off|holidays?(?! (?:party|parties|lunch|event|celebration)s?)|sick days`);
const LEAVE_WORSE = w(String.raw`replac\w*|instead of|no longer (?:accru\w*|roll\w*|carry\w*|pa\w*)|accru\w*|carry(?:over| over)|roll(?:over| over)|payout|cap(?:ped)?|use it or lose it|expir\w*`);
const TOGETHER = w(String.raw`together|in[- ]person|face[- ]to[- ]face|side by side|in the same room|on[- ]site|onsite|in the office|connection|collaborat\w*`);
const WORK_POLICY = w(String.raw`workplace (?:policy|policies|model|strategy|expectations|guidelines)|work(?:ing)? (?:model|policy|arrangements?|location)|ways of working|hybrid|remote|flexib\w* (?:work|policy|arrangements?)|attendance|office (?:policy|expectations|presence)`);
const NO_OFFER = /\b(?:not|unable|won't|cannot|can't|can not)\b(?: be)?(?: able)?(?: to)? (?:extend|make|offer|approve|accommodate|support|fund|grant|accept|honor|pursue|proceed|move forward|go ahead|green-?light|sign off|prioritize)\b/i;
const NO_FIT = /\b(?:doesn't|does not|don't|do not|isn't|is not|aren't|are not|won't|will not|no longer|not)\b (?:quite |fully |really |currently )?(?:align|fit|match|map|line up|a (?:priority|fit|match))\b|\b(?:not|isn't|is not) (?:a )?(?:priority|focus) (?:right now|at the moment|for us|this (?:year|quarter|half))\b|\boutside (?:of )?(?:our|the) (?:current )?(?:scope|priorities|focus|roadmap)\b/i;
const PARK = /\b(?:put|putting|stick|place) a pin in\b|\b(?:table|tabling|park|parking|shelve|shelving) (?:that|this|it|the (?:idea|topic|discussion|request|proposal))\b|\b(?:take|bring|run) (?:that|this|it|your (?:idea|feedback|suggestion|request|concern)s?) back to (?:the |my )?(?:team|group|leadership|stakeholders)\b|\b(?:add|put) (?:that|this|it) (?:to|on) (?:the |our )?(?:backlog|list|wishlist|roadmap discussion)\b|\b(?:keep|bear) (?:that|this|it) in mind\b|\bnoted, thanks\b|\b(?:something|one) (?:we can|we'll|to) (?:consider|explore|think about|look at) (?:down the road|in the future|later|next (?:year|quarter))\b|\brevisit (?:this |that |it )?(?:next|in|later|down the road|at a later|once|after)\b|\bon (?:our|my) radar\b|\bwe'll (?:see|think about it)\b|\blet me (?:think about it|noodle on (?:it|that))\b/i;
const TEAM = w(String.raw`team|teams|group|groups|org|orgs|organization|organizations|function|functions|department|departments|unit|units|division|pod|squad|practice`);
const MOVES_UNDER = /\b(?:will (?:now )?(?:be|become|join|sit|roll up|move|fold|transition)|(?:is|are) (?:now )?(?:joining|moving|becoming|folding)|(?:moved|folded|merged|integrated|brought|combined) (?:in)?to|join(?:s|ing)?|now (?:part of|sits? (?:in|under|within)|reports? (?:in)?to))\b[^.]{0,30}\b(?:part of|under|into|within|in) (?:the |our |a |an )?(?:[\w-]+ ){0,3}(?:org|organization|team|group|function|department|unit|division|leadership|umbrella)\b/i;
const CHECKINS = w(String.raw`check-?ins?|1:1s?|one-on-ones?|touchpoints?|touch points?|regular (?:syncs|reviews|meetings)|weekly (?:reviews?|syncs?|meetings?)`);
const YOU_SUCCEED = /\b(?:you|your)\b[^.]{0,60}\b(?:succeed|success|successful|on track|support you need|expectations|improv\w*|progress|back on track|meeting the bar|clarity on (?:what|expectations))\b/i;
const HANDOFF = /\b(?:transition\w*|mov\w*|shift\w*|transfer\w*|migrat\w*|hand\w* (?:off|over)|consolidat\w*)\b/i;
const WORK = w(String.raw`support|help ?desk|service desk|customer (?:service|care|support)|operations|ops|processing|payroll|billing|accounts payable|QA|testing|moderation|data entry|first[- ]line|tier[- ]?[12]|level[- ][12]|L[12] support|work|functions?|tasks|activities|responsibilities|services?`);
const ELSEWHERE = /\bto (?:our |a |an |the )?(?:(?:new |trusted |strategic |external |global |preferred )?(?:partners?|vendors?|providers?|contractors?|agency|firm)|(?:team|center|centre|hub|office|site) (?:in|based in)|(?:[\w-]+ )?(?:hub|center|centre) in) ?\b|\b(?:partner|vendor|provider|team) (?:in|based in) [A-Z][a-z]+/i;
const CAREFUL = w(String.raw`thoughtful|careful|cautious|disciplined|deliberate|intentional|prudent|judicious|selective|conservative|measured|mindful`);
const HIRING = w(String.raw`headcount|hiring|new roles|adding roles|opening roles|new hires|backfills?|team growth|growing the team|open reqs|requisitions`);
const GOODBYE = w(String.raw`said goodbye|say(?:ing)? goodbye|bid(?:ding)? farewell|farewell|said farewell|part(?:ed|ing)? ways|depart\w*|leaving us|no longer with (?:us|the company)|transition\w* out|exit\w*|impacted|affected|eliminat\w*|reduc\w*|cuts?|separat\w*|let go|released`);
const RESHAPE = w(String.raw`reshap\w*|restructur\w*|reorganiz\w*|resiz\w*|right-?siz\w*|streamlin\w*|realign\w*|strategic priorities|resources|focus areas|evolve the organization|operating model|organizational changes|changes to (?:our|the) (?:team|organization|structure)|leaner|efficien\w*|business needs|as part of`);

export const CONCEPTS = [
  // "Today we said goodbye to some talented colleagues as we reshape the organization."
  { id: "layoffs", all: [STAFF, GOODBYE, RESHAPE], unless: /\b(?:outage|incident|storm|weather|bug|customers?|users?|retir\w*|promot\w*|welcome)\b/i },
  { id: "layoffs", all: [PEOPLE, /\b(?:said|say|saying|bid|bidding) (?:goodbye|farewell)\b/i], unless: /\b(?:retir\w*|promot\w*|interns?|summer|party|lunch|welcome)\b/i },
  // "The launch will now take place in the second half of the year." / "we are revisiting the release schedule"
  { id: "delay", all: [PRODUCT, /./, SHIFTING], any: [LATER, TIMELINE], unless: /\b(?:ahead of schedule|earlier than|on track|on schedule|accelerat\w*|pull(?:ed|ing)? (?:in|forward)|budget|hiring|headcount)\b/i },
  // "employees will contribute a larger share of health insurance costs"
  { id: "benefits", all: [HEALTH, PAY_MORE], unless: /\b(?:company|we) will (?:cover|pay|contribute) (?:more|a larger)\b|\bno change\b/i },
  // "the company match on 401(k) contributions will be capped at 3%"
  { id: "benefits", all: [/\b(?:401\(?k\)?|retirement (?:plan|match|contributions?)|pension|company match|employer match)/i, /\b(?:capped|cap|caps|reduc\w*|lower\w*|cut|cuts|suspend\w*|paus\w*|eliminat\w*|ending|will end|smaller|decreas\w*)\b/i] },
  // "a more flexible PTO approach, replacing accrued vacation"
  { id: "benefits", all: [LEAVE, LEAVE_WORSE], unless: /\b(?:additional|extra|more|increase\w*) (?:PTO|vacation|days|holidays?)\b|\bremind\w*\b/i },
  // "our best work happens when we are together, so we are updating our workplace policy"
  { id: "rto", all: [TOGETHER, WORK_POLICY] },
  // "we will not be able to extend an offer at this time" / "it doesn't align with our current priorities"
  { id: "rejection", all: [NO_OFFER], unless: /\b(?:anyone|everyone|you can|feel free|happy to|if you need)\b|\?$/i },
  { id: "rejection", all: [NO_FIT, w(String.raw`priorit\w*|strategy|roadmap|direction|focus|needs|goals|plans|requirements|scope|budget|proposal|idea|request|application|candidacy|profile|background|experience`)] },
  // "Let's put a pin in that and revisit next quarter." / "I'll take that back to the team."
  { id: "deflection", all: [PARK] },
  // "We have made the difficult decision to reduce the size of our sales organization."
  { id: "layoffs", all: [/\b(?:reduc\w*|shrink\w*|downsiz\w*|scal\w* back|trim\w*|cut\w*)\b[^.]{0,25}\b(?:the )?(?:size of (?:our|the|its) [\w ]{0,20}(?:team|organization|org|workforce|staff|department|group|function)s?|(?:our|the) (?:\w+ )?(?:team|organization|org|workforce|staff|department|group|function)s? (?:by|size))/i], unless: /\b(?:meeting|meetings|calls?|slack|channels?|backlog|tickets|scope|budget|costs?|spend)\b/i },
  // "We're asking everyone to be in the office on Tuesdays, Wednesdays, and Thursdays."
  { id: "rto", all: [/\b(?:be|work|working|come|coming|spend\w*|present) (?:in(?:to)?|at|from) (?:the|our) (?:office|offices|workplace|site|campus|hub)\b/i, /\b(?:everyone|all (?:employees|staff|team members)|we're asking|we are asking|we ask|required|requiring|expected|expectation|expect|mandatory|must|need you)\b|\b(?:mondays|tuesdays|wednesdays|thursdays|fridays)\b|\b(?:\d|two|three|four|five) days\b/i], unless: /\b(?:closed|holiday|party|lunch|celebration|offsite|visit\w*|tour|fire drill|maintenance|welcome|optional|feel free|your choice|if (?:you|they) (?:like|want|prefer|wish)|if you'd like)\b/i },
  // "We need to see meaningful improvement in your communication over the next 60 days."
  { id: "pip", all: [/\b(?:improv\w*|progress|turnaround|change|consisten\w*)\b/i, /\byour\b/i, /\b(?:next|within|over the next|in the next) (?:\d+|thirty|forty-five|sixty|ninety) days\b|\b(?:need|expect|want|must) to see\b/i], unless: /\b(?:customers?|users?|product|app|service|platform|onboarding|we'll|we will)\b[^.]{0,20}\b(?:improv\w*|progress)\b|\bthank/i },
  // "We have selected an external partner to manage our payroll processing going forward."
  { id: "outsourcing", all: [/\b(?:selected|chosen|chose|engaged|hired|contracted|retained|brought on|signed with|partner(?:ing|ed)? with|onboard\w*)\b/i, /\b(?:external|outside|third[- ]party|offshore|global|managed service) (?:partner|vendor|provider|firm|company|agency|team)\b|\b(?:vendor|provider|agency|firm)\b/i, /\b(?:to|will) (?:manage|handle|run|provide|take over|perform|operate|own|deliver)\b/i, WORK], unless: /\b(?:event|party|catering|offsite|venue|swag|lunch|holiday)\b/i },
  // "We'll take it under consideration."
  { id: "deflection", all: [/\b(?:take|taking|keep|keeping) (?:it|this|that|them|your (?:feedback|input|suggestions?|ideas?)) (?:under|into) (?:consideration|advisement|account)\b|\bwill (?:certainly |definitely )?(?:consider|look at) (?:it|this|that|your (?:feedback|input|suggestion|idea)s?)\b|\bcome back to (?:it|this|that) (?:when|once|later|after)\b/i] },
  // "We are targeting a revised launch window in Q3."
  { id: "delay", all: [PRODUCT, /\b(?:revised|new|updated|adjusted|later) (?:\w+ )?(?:window|date|timeline|target|ETA|timeframe)\b/i], unless: /\b(?:ahead of schedule|earlier|on track|pull(?:ed|ing)? (?:in|forward))\b/i },
  // "the monthly gym subsidy will no longer be offered" is a benefit cut, not a product shutdown.
  { id: "benefits", all: [/\b(?:stipends?|subsid(?:y|ies)|reimbursements?|allowances?|perks?|benefits?|wellness|gym|commuter|tuition|childcare|meal|lunch(?:es)?|snacks?)\b/i, /\bno longer (?:be )?(?:offered|provided|available|covered|reimbursed|funded|included|supported)\b|\b(?:will|is going to) (?:end|go away|be (?:removed|retired|phased out|sunset))\b|\bphas\w* out\b/i], unless: /\b(?:during|temporar\w*|renovation|maintenance|while|until|for (?:the )?(?:day|week|holiday))\b/i },
  // "Employees will now need to use PTO for the week between Christmas and New Year's."
  { id: "benefits", all: [/\b(?:need|required|have|must|expected) to (?:use|take|spend)\b[^.]{0,20}\b(?:PTO|vacation|paid time off|leave|personal days)\b/i, /\b(?:will now|now|going forward|from now on|starting|this year|no longer)\b|\b(?:week|days?) between\b|\bshutdown\b/i] },
  // "we won't be moving ahead with your proposal" / "the timing isn't right this cycle"
  { id: "rejection", all: [/\b(?:not|won't|will not|unable to|cannot|can't)\b (?:be )?(?:mov\w*|go\w*|proceed\w*) (?:ahead|forward|on)\b(?! (?:of|schedule))/i] },
  { id: "rejection", all: [/\b(?:the )?timing (?:isn't|is not|wasn't|was not|doesn't feel|does not feel|isn't quite|is not quite) (?:right|ideal|there)\b|\bnot the right (?:time|moment)\b|\bnot (?:the right|a good) time\b/i] },
  // "I'll be documenting our weekly conversations so we're aligned on expectations."
  { id: "pip", all: [/\b(?:document\w*|written summar\w*|follow up in writing|put (?:this|it|things) in writing|recap\w* in writing|keep a record)\b/i, /\b(?:our|your|these|weekly|1:1|one-on-one) (?:\w+ )?(?:conversations|discussions|check-?ins|meetings|1:1s)\b|\bexpectations\b|\byour (?:performance|progress|work)\b/i] },
  // "be mindful of discretionary spend for the remainder of the year"
  { id: "budget-freeze", all: [/\b(?:mindful|careful|cautious|thoughtful|prudent|judicious|conservative|disciplined)\b[^.]{0,20}\b(?:discretionary |non-essential |all |any |travel |team )?(?:spend(?:ing)?|expenses?|purchases|costs?|budgets?)\b/i] },
  // "Effective Monday, the platform team will be part of the infrastructure organization."
  { id: "reorg", all: [TEAM, MOVES_UNDER], unless: /\b(?:join(?:ing)? (?:us|the call|the meeting)|welcome)\b/i },
  // "weekly check-ins to make sure you have the support you need to succeed"
  { id: "pip", all: [CHECKINS, YOU_SUCCEED], unless: /\b(?:onboarding|new hire|first (?:week|month|90 days)|welcome)\b/i },
  // "transitioning first-line support to our partner in Manila"
  { id: "outsourcing", all: [HANDOFF, WORK, ELSEWHERE], unless: /\b(?:new (?:tool|system|platform|ticketing)|Slack|Jira|Zendesk|ServiceNow)\b/i },
  // "We are being thoughtful about headcount for the rest of the year."
  { id: "hiring-freeze", all: [new RegExp(String.raw`${CAREFUL.source} (?:about|with|on|around|in) (?:our |any |new |further |future )?${HIRING.source}(?!'|\w)`, "i")] },
];

export function conceptThemes(sentence) {
  const s = String(sentence);
  const ids = [];
  for (const c of CONCEPTS) {
    if (ids.includes(c.id)) continue;
    if (c.all.every((re) => re.test(s)) && (!c.any || c.any.some((re) => re.test(s))) && !(c.unless && c.unless.test(s))) ids.push(c.id);
  }
  return ids;
}

// Round 8: decode lines that carry the specific news for the concept rules above.
export const CONCEPT_LINES = [
  // "replacing accrued vacation" with "flexible PTO" usually means no more banked days and no payout.
  { pattern: /\b(?:flexible|unlimited|discretionary|open)\b[^.]{0,30}\b(?:PTO|time off|vacation)\b[^.]{0,60}\b(?:replac\w*|instead of)\b[^.]{0,20}\baccru\w*|\breplac\w*\b[^.]{0,20}\baccru\w* (?:vacation|PTO|time off)\b[^.]{0,60}\b(?:flexible|unlimited|discretionary)\b/i,
    lines: ["You'll stop banking vacation days, so there's nothing to cash out if you leave.", "No more banked vacation. Unused days won't be paid out.", "Your saved-up vacation is gone. \"Flexible\" means no payout."], asSummary: true },
  { pattern: /\b(?:employees|you|staff|team members|everyone)\b[^.]{0,30}\b(?:contribute|pay|cover)\b[^.]{0,20}\b(?:a )?(?:larger|greater|bigger|higher) (?:share|portion|percentage|part)\b[^.]{0,30}\b(?:health|medical|insurance|benefits?|premiums?)\b/i,
    lines: ["You'll pay more of your health insurance cost.", "Your health insurance will cost you more.", "Same insurance, bigger bill for you."], asSummary: true },
  // "weekly check-ins to make sure you have the support you need to succeed" is closer watching, not yet a PIP.
  { pattern: /\b(?:check-?ins?|1:1s?|one-on-ones?|touchpoints?)\b[^.]{0,80}\b(?:you|your)\b[^.]{0,60}\b(?:succeed|success|successful|on track|support you need|expectations)\b/i,
    lines: ["Your manager wants to watch your work more closely.", "They're watching your work closely. This is often how a PIP starts.", "You're being watched. This is the step before a PIP."], asSummary: true },
  // "Let's put a pin in that and revisit next quarter."
  { pattern: /\b(?:put|putting|stick|place) a pin in\b|\b(?:table|tabling|shelve|shelving) (?:that|this|it|the (?:idea|topic|discussion|request|proposal))\b/i,
    lines: ["They're setting this aside for now.", "They're shelving it. Don't expect it back soon.", "It's shelved. That usually means never."], asSummary: true },
  { pattern: /\b(?:take|bring|run) (?:that|this|it|your (?:idea|feedback|suggestion|request|concern)s?) back to (?:the |my )?(?:team|group|leadership|stakeholders)\b/i,
    lines: ["They won't decide now. They'll ask others first.", "No answer today. They're passing it up the chain.", "Not their call, or they don't want it to be. Don't wait up."], asSummary: true },
  { pattern: /\b(?:being|be|stay|remain)\b[^.]{0,10}\b(?:thoughtful|careful|cautious|disciplined|deliberate|intentional|prudent|judicious|selective|conservative|measured|mindful) (?:about|with|on|in|around) (?:\w+ )?(?:headcount|hiring|new roles|adding roles|backfills?|new hires)\b/i,
    lines: ["Hiring will be very limited.", "Hardly anyone new is getting hired.", "No new people. You'll cover the gaps."], asSummary: true },
  // "I'll be documenting our weekly conversations so we're aligned on expectations" is a paper trail, not yet a PIP.
  { pattern: /\b(?:document\w*|put (?:this|it|things) in writing|keep a record)\b[^.]{0,40}\b(?:conversations|discussions|check-?ins|meetings|1:1s|expectations|performance|progress)\b/i,
    lines: ["Your manager will keep written notes on your talks.", "They're building a paper trail. That's often how a PIP starts.", "They're building the paper trail to manage you out."], asSummary: true },
  // "be mindful of discretionary spend" is a soft spending squeeze, not a hard freeze.
  { pattern: /\b(?:mindful|careful|cautious|thoughtful|prudent|judicious|conservative|disciplined)\b[^.]{0,20}\b(?:discretionary |non-essential |all |any |travel |team )?(?:spend(?:ing)?|expenses?|purchases|costs?)\b/i,
    lines: ["They want everyone to spend as little as possible.", "Spend as little as you can. Big asks will get a no.", "Don't spend money. Seriously."], asSummary: true },
];
