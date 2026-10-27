// Round 10: the general satirical composer for Full C-Suite (and a light touch for Middle Manager).
// Messages without a built-in scene still get the joke: the clause itself is inflated with a grand
// corporate lexicon, and the frame and closer are picked by intent AND topic so they always fit.
// Rules: frames and closers carry tone only. No new people, numbers, dates, meetings or promises,
// and nothing that changes a no, a question or a fact. Every output still goes through checkMeaning.

// What the message is about. First match wins, so specific topics come first.
const TOPICS = [
  ["away", /\b(?:out of office|OOO|working from home|WFH|working remotely|offline|afk|heading out|signing off|logging off|be right back|have to go|kid pickup|school run|on my way|omw)\b/i],
  ["coffee", /\b(?:coffee|espresso|latte|caffeine|tea)\b/i],
  ["food", /\b(?:lunch|hungry|snacks?|pizza|food|microwave|kitchen|fridge|cake|donuts?|breakfast|eat|eaten|starving|peckish)\b/i],
  ["sleep", /\b(?:tired|exhausted|sleep|slept|asleep|nap|fried|burnt out|burned out|drained|wiped(?! out the| clean)|yawn\w*)\b(?<!(?:got|were|was|been) wiped)/i],
  ["feelings", /\b(?:stressed|anxious|nervous|overwhelmed|bored|sad|frustrated|annoyed|scared|scares|worried|excited|proud|happy(?! to\b)(?<!(?:customers?|clients?|users?) (?:is |are |was |were )?(?:\w+ )?happy)|grumpy|can't focus)\b/i],
  ["meetings", /\b(?:meetings?|standup|stand-up|sync|syncs|1:1|all[- ]hands|calls?|retro|sprint planning|offsite|calendar|invites?)\b/i],
  ["inbox", /\b(?:emails?|inbox|reply[- ]all|replied all|slack|channel|messages?|dms?|@-ing|cc'?ing|pinged?)\b/i],
  ["money", /\b(?:budget|bill|invoice|costs?|spend\w*(?! (?:my|the|our|this|all|a|every|another) (?:weekend|evening|time|day|night|holiday|morning|afternoon|week|saturday|sunday))|money|price|pricing|deal|revenue|quota|discount|\$\d|expenses?|payroll|bonus\w*|payday)\b/i],
  ["tech", /\b(?:laptop|wifi|vpn|printer|copier|projector|server|staging|prod|build|bug|tests?|deploy\w*|api|login|password|outage|crash\w*|restart\w*|toner|monitor|computer|keyboard|app|backlog)\b/i],
  ["docs", /\b(?:docs?|document\w*|spreadsheet|deck|slides|tabs|wiki|spec|report|roadmap|notes|ticket|tracker\w*|copy|font)\b/i],
  ["scope", /\b(?:scope|requirements|priorities|revisions?|rewrite|pivot\w*)\b/i],
  ["deadline", /\b(?:deadline|eod|asap|late(?!-night| night)|behind|delayed|commute|(?<!(?:web|site) )traffic(?! (?:dropped|fell|is down|is up|grew|spiked|doubled|tripled|jumped))|train|bus|missed my|running \d+|minutes|mins|waiting|forever|hours?)\b/i],
  ["office", /\b(?:office|desk|chair|ac\b|air conditioning|parking|elevator|plants?|floor|building|fire drill|room)\b/i],
  ["people", /\b(?:client|customer|manager|boss|vendor|legal|finance|marketing|sales|ceo|team|everyone|nobody|someone|intern|new hire)\b/i, /\b(?:IT|HR)\b/],
];
export function topicOf(text) {
  text = String(text).replace(/\beating (?:our|my|their|your) lunch\b/gi, "beating us").replace(/\bno big deal\b/gi, "no issue").replace(/\bhappy (?:hour|birthday|friday|holidays?|anniversary)\b/gi, "social event").replace(/\btired of\b/gi, "frustrated with").replace(/\b(?:after|before|by|until|till|til|at|during|post|pre|over) (?:the )?lunch(?:time)?\b/gi, "midday");
  for (const [id, re, re2] of TOPICS) if (re.test(text) || (re2 && re2.test(text))) return id;
  return "general";
}

// Intent family: which way the message leans.
export function groupOf(intent) {
  if (/^(?:problem|decline|apology|feedback)$/.test(intent)) return "bad";
  if (intent === "approve") return "approve";
  if (/^(?:win|praise|thanks|welcome)$/.test(intent)) return "good";
  if (/^(?:request|question)$/.test(intent)) return "ask";
  if (intent === "opinion") return "opinion";
  if (intent === "personal") return "personal";
  return "neutral";
}

// The clause, inflated. Each swap keeps its grammatical slot and its meaning.
const INFLATE = [
  [/\bthe coffee line\b/gi, "the caffeine waitlist"], [/\bthe line for the (microwave|coffee machine|coffee)\b/gi, (m, x) => `the waitlist for the ${x.toLowerCase() === "microwave" ? "shared thermal-reheating asset" : "caffeine delivery platform"}`],
  [/\bmy laptop\b/gi, "my endpoint device"], [/\bthe laptop\b/gi, "the endpoint device"], [/\bthis laptop\b/gi, "this endpoint device"],
  [/\bthe printer\b/gi, "the print infrastructure"], [/\bthe copier\b/gi, "the document-replication infrastructure"],
  [/\bthe projector\b/gi, "the visual-alignment infrastructure"], [/\bthe coffee machine\b/gi, "the caffeine delivery platform"],
  [/\bthe coffee\b/gi, "the caffeine supply"], [/\ba coffee\b/gi, "a strategic caffeine intervention"],
  [/\bthe microwave\b/gi, "the shared thermal-reheating asset"], [/\bthe kitchen\b/gi, "the nourishment hub"],
  [/\bthe AC\b/g, "the climate-control infrastructure"], [/\bthe parking lot\b/gi, "the vehicle staging area"],
  [/\bthe new chair\b/gi, "the new ergonomic seating solution"], [/\bmy desk\b/gi, "my workstation real estate"],
  [/\bthe office plants\b/gi, "the office biodiversity portfolio"], [/\bthe elevator\b(?! music| pitch| speech)/gi, "the vertical mobility solution"],
  [/\bthe fire drill\b/gi, "the unscheduled evacuation exercise"],
  [/\bmy inbox\b/gi, "my inbound communication pipeline"], [/\bthe HR email\b/g, "the HR broadcast"],
  [/\bour team channel\b/gi, "our team's async collaboration surface"], [/\bthe whole channel\b/gi, "the full channel ecosystem"],
  [/\bthis spreadsheet\b/gi, "this mission-critical spreadsheet"], [/\bthe spreadsheet\b/gi, "the mission-critical spreadsheet"],
  [/\bthe docs\b/gi, "the knowledge assets"], [/\bthe onboarding docs\b/gi, "the onboarding knowledge assets"],
  [/\bthe client\b(?=[.,!?;]|$|\s+(?:is|was|are|were|has|had|have|wants|wanted|needs|needed|keeps|kept|said|says|seemed|seems|hated|loved|liked|asked|approved|rejected|signed|will|would|can|could|just|still|did|does|didn't|doesn't|isn't|wasn't|changed|called|emailed|replied|loves|hates|likes)\b)/g, "our valued client partner"], [/\bthat client\b(?=[.,!?;]|$|\s+(?:is|was|has|wants|keeps|said|seemed)\b)/g, "that valued client partner"],
  [/\bmy manager\b/gi, "my leadership partner"], [/\bmy boss\b/gi, "my leadership partner"],
  [/\bthe vendor\b/gi, "our vendor partner"], [/\bthe new hire\b/gi, "our newest talent investment"], [/\bthe new intern\b/gi, "our newest talent investment"],
  [/\bthe badge reader\b/gi, "the identity-verification checkpoint"], [/\bthe badge system\b/gi, "the identity-verification platform"],
  [/\bthe ice machine\b/gi, "the frozen-hydration platform"], [/\bthe soap dispensers\b/gi, "the hand-hygiene delivery units"],
  [/\bthe meeting room chairs\b/gi, "the meeting room ergonomic seating solutions"], [/\bthe hallway\b/gi, "the main transit corridor"],
  [/\bthe (?:bathroom|restroom)\b/gi, "the wellness facility"], [/\bthe fridge\b/gi, "the shared cold-storage asset"],
  [/\bthe vending machine\b/gi, "the snack-dispensing partner"], [/\bmy headset\b/gi, "my audio-collaboration hardware"],
  [/\bmy (?:second )?monitor\b/gi, "my visual real estate"], [/\bthe scanner\b/gi, "the document-digitization infrastructure"],
  [/\bif urgent\b/gi, "if anything becomes mission-critical"], [/\bthe garage\b/gi, "the vehicle staging area"], [/\bthe lobby\b/gi, "the first-impression zone"], [/\bthe hand dryer\b/gi, "the airflow-based drying solution"],
  [/\bmy charger\b/gi, "my mobile power solution"], [/\bthe logs\b/gi, "the system telemetry"], [/\bthe queue\b/gi, "the demand pipeline"],
  [/\bmy access\b/gi, "my access entitlements"], [/\bmy timesheet\b/gi, "my time-allocation attestation"],
  [/\btrain delays\b/gi, "rail-network latency"], [/\bmoving apartments\b/gi, "executing a residential migration"], [/\bworking a half day\b/gi, "running a half-day operating model"],
  [/\bthere (?:are|is) (snack|bagel|donut|cookie|cupcake|leftover)s\b/gi, "there are strategic $1 reserves"], [/\bthere is cake\b/gi, "there is celebratory cake inventory"],
  [/\bpizza Friday\b/gi, "the Friday pizza-based engagement initiative"], [/\bthe (?:shared )?calendar\b(?= ate| eats| lost| deleted)/gi, "the shared scheduling platform"],
  [/\bthe dashboard\b/gi, "the insights dashboard"], [/\bthe notes\b/gi, "the key learnings"], [/\bthe retro\b/gi, "the retrospective learning ceremony"],
  [/\bthe standup\b/gi, "the daily alignment ritual"], [/\bthe (?:8|7|6|9)am standup\b/gi, (m) => m.replace(/standup$/i, "alignment ritual")],
  [/\ban? (?:mid-?)?meeting\b(?=[.!?,]|$)/gi, (m) => m], [/\bthe whiteboard\b|\ba whiteboard\b/gi, (m) => m.replace(/whiteboard/, "collaborative ideation surface")],
  [/\bthe AC is freezing\b/g, "the AC is freezing"], [/\bthe VPN\b/g, "the secure-access tunnel"],
  [/(?<!(?:fixed|found|caught|squashed|closed|patched|solved) )\bthe bug\b/gi, "the undocumented feature"], [/\bthe build\b/gi, "the build pipeline"],
  [/\bkeeps adding scope\b/g, "keeps generously expanding the scope"], [/\bkeeps restarting\b/g, "keeps proactively rebooting itself"],
  [/\bis (?:so |really |very )?slow\b/g, "is operating at a deliberate pace"], [/\bis full again\b/g, "has reached full capacity again"], [/\bis full\b/g, "has reached full capacity"],
  [/\bis freezing\b/g, "is delivering an aggressively chilled experience"], [/\bsmells like\b/g, "is broadcasting the aroma of"],
  [/\b(laptop|computer|printer|copier|machine|vending machine|app|phone|system|tool|VPN|server|update|scanner|website|it) ate my\b/g, "$1 absorbed my"], [/\bis destroying my back\b/g, "is creating meaningful lumbar headwinds"],
  [/\bout of toner\b/g, "experiencing a toner supply-chain gap"],
  [/\b(\d+) meetings\b/g, "$1 alignment sessions"], [/\bback[- ]to[- ]back meetings\b/g, "back-to-back alignment sessions"],
  [/\b(\d+) tabs\b/g, "$1 tabs of strategic depth"], [/\b(\d+) people deep\b/g, "$1 stakeholders deep"],
  [/\bI'm exhausted\b/g, "I'm operating at reduced capacity"], [/\bI'm fried\b/g, "my bandwidth has been fully depleted"],
  [/\bI'm (?:so |really )?stressed about\b/g, "I'm carrying elevated anticipatory risk around"], [/\bI'm (?:so |really )?stressed\b/g, "I'm carrying elevated pressure"],
  [/\bI'm overwhelmed\b/g, "I'm operating well beyond my capacity envelope"], [/\bI'm nervous about\b/g, "I'm carrying some anticipatory risk around"],
  [/\bI'm (?:so |really |extremely )?bored\b(?! (?:I|that|we|out)\b)/g, "I'm significantly under-leveraged"], [/\bI'm (?:so |really )?hungry\b(?! (?:I|that|we)\b)/g, "I'm running low on fuel"],
  [/\bI'm (?:really |so )?proud of\b/g, "I'm deeply, almost unreasonably proud of"], [/\bI'm (?:actually |genuinely )?excited about\b/g, "I'm cautiously euphoric about"],
  [/\bscares me\b/g, "keeps me up at night, strategically"], [/\btoday was a lot\b/gi, (m) => (m[0] === "T" ? "Today" : "today") + " was a high-intensity, high-learning day"],
  [/\b(\d+) hours of (?:sleep|rest)\b/g, "$1 hours of overnight recovery"],
  [/\bI can't focus\b/g, "I'm unable to achieve deep focus"], [/\bI'm unable to focus\b/g, "I'm unable to achieve deep focus"],
  [/\bhalf asleep\b/g, "running in low-power mode"],
  [/\bon hold with IT for an hour\b/g, "in an hour-long holding pattern with IT"],
  [/\bfinally fixed\b/g, "finally restored to full operational excellence"], [/\bfinally replied\b/g, "finally re-engaged"],
  [/\bfinally finished\b/g, "finally crossed the finish line"], [/\btests are green\b/gi, (m) => (m[0] === "T" ? "Tests" : "tests") + " are green across the board"],
  [/\bran fine\b/g, "executed flawlessly"],
  [/\bI pushed the hotfix\b/g, "I deployed a precision hotfix"], [/\bI booked\b/g, "I secured"],
  [/\bI updated\b/g, "I meaningfully evolved"], [/\bsigned off on\b/g, "formally blessed"],
  [/\bapproved the copy\b/g, "blessed the copy"],
  // Round 11b: more everyday nouns get the deadpan upgrade at Full C-Suite.
  [/\bthe agenda\b/gi, "the strategic agenda framework"], [/\bthe (?:quarterly |annual )?survey\b/gi, (m) => m.replace(/survey/i, "sentiment-harvesting initiative")],
  [/\b(?:the |an )?expense (?:forms?|reports?)\b/gi, (m) => m.replace(/expense (forms?|reports?)/i, (_x, f) => `expense attestation ${/s$/.test(f) ? "packets" : "packet"}`)],
  [/\bthe (?:mandatory )?training\b/gi, (m) => m.replace(/training/i, "upskilling journey")], [/\bmeeting invites\b/gi, "calendar summons"], [/\bcatch-up invites\b|\bsync invites\b|\balignment session invites\b/gi, "calendar summons"],
  [/\bthe heater\b/gi, "the thermal comfort infrastructure"], [/\bthe shuttle\b/gi, "the last-mile mobility solution"], [/\bone taxi\b/gi, "one ground-transportation engagement"],
  [/\bmy settings\b/gi, "my personalization configuration"], [/\bthe commute\b/gi, "the inbound mobility journey"], [/\bthe wifi\b(?! password| network)/gi, "the connectivity infrastructure"],
  [/\ba reply-all storm\b|\breply-all storm\b/gi, (m) => m.replace(/reply-all storm/i, "organization-wide engagement event")], [/\bthe (?:shared )?drive\b/gi, (m) => m.replace(/drive/i, "knowledge repository")],
  [/\bthe plants\b/gi, "the office biodiversity assets"], [/\bmore chairs\b/gi, "additional seating capacity"], [/\ba second microwave\b/gi, "a second thermal-reheating asset"],
  [/\bthe ceiling\b/gi, "the overhead infrastructure"], [/\bthe cafeteria\b/gi, "the on-site nourishment center"], [/\bthe break room\b/gi, "the recharge zone"],
  [/\bthe elevators\b/gi, "the vertical mobility solutions"], [/\bthe mockups\b/gi, "the visual thought-starters"], [/\bthe slides\b/gi, "the narrative assets"],
  [/\bthe board deck draft\b/gi, "the board-level strategic narrative (draft)"], [/\ba payroll question\b/gi, "a compensation-adjacent inquiry"],
  [/\bthe hotfix\b/gi, "the precision hotfix"], [/\bthe server\b(?=[.,!?]|$| is\b| was\b| went\b| crashed\b| keeps\b| died\b| has\b)/gi, "the compute infrastructure"], [/\bthe servers\b/gi, "the server fleet"],
  [/\bthe ticket\b/gi, "the work item"], [/\bjury duty\b/gi, "civic-engagement duty"],
  [/\bthe vet\b(?! with)/gi, "the vet, supporting a key family stakeholder"],
  // Round 12: the joke is a mundane thing described with total sincerity (viral "LinkedIn Speak" style),
  // or a small loss told as a strategic outcome. Each swap keeps the fact; checkMeaning still gates it.
  [/\bI locked my keys in (?:the|my) car\b/gi, "I have securely stored my keys inside my personal mobility asset, with no current path to retrieval"],
  [/\bmy car got towed\b/gi, "my personal mobility asset has been involuntarily relocated"], [/\bmy car broke down\b/gi, "my personal mobility asset has entered an unplanned maintenance window"],
  [/\bI spilled coffee on my keyboard\b/gi, "my keyboard received an unplanned caffeine infusion"], [/\bI spilled coffee on my laptop\b/gi, "my endpoint device received an unplanned caffeine infusion"],
  [/\bI fell asleep in the (?:meeting|catch-up|sync|alignment session|call)\b/gi, "I briefly entered low-power mode during the alignment session"],
  [/\bI accidentally replied all\b/gi, "I accidentally over-delivered on transparency with a reply-all"],
  [/\bI have no idea what I'm doing\b/gi, "I'm currently operating in a high-ambiguity, high-learning environment"],
  [/\bwe have no (?:clear )?idea why it works\b/gi, "the root cause of our success remains under active investigation"],
  [/\bI didn't read the (?:doc|document)\b/gi, "I have not yet engaged with the document"],
  [/\bI googled what our product does\b/gi, "I conducted independent market research into what our own product does"],
  [/\bmy dog (?:just )?joined the (Zoom |Teams |video )?call\b/gi, (_m, k) => `my dog has joined the ${k ?? ""}call as an unscheduled stakeholder`],
  [/\bmy cat (?:just )?(?:walked across|sat on) my keyboard\b/gi, "my cat has made an unsolicited contribution to my keyboard"],
  [/\bI'm on my (first|second|third|fourth|fifth|sixth) coffee\b/gi, "I'm on my $1 caffeine intervention"],
  [/\bsomeone keeps eating my (yogurt|lunch|snacks|food|leftovers|sandwich)\b/gi, "someone keeps reallocating my $1 without consent"],
  [/\bI'm getting married\b/gi, "I'm finalizing a lifelong partnership merger"], [/\bwe just had a baby\b/gi, "we just welcomed a new junior stakeholder to the family"],
  [/\bI'm moving (?:this weekend|next week|tomorrow|on \w+day)\b/gi, (m) => m.replace(/^I'm moving/i, "I'm executing a residential migration")],
  [/\bthe new chairs hurt my back\b/gi, "the new ergonomic seating solutions are creating meaningful lumbar headwinds"],
  [/\bmy back\b(?= hurts| is killing| is sore)/gi, "my lumbar infrastructure"],
  [/\bthe build pipeline takes (\d+) minutes now\b/gi, "the build pipeline now includes a $1-minute reflection window"], [/\bthe build takes (\d+) minutes now\b/gi, "the build pipeline now includes a $1-minute reflection window"],
  [/\bthe (?:ticket |work item )?backlog\b/gi, (m) => m.replace(/(?:ticket |work item )?backlog/i, "opportunity backlog")],
  [/\bthe auditors\b/gi, "the auditors, our compliance partners,"], [/\bthe intern\b/gi, "our intern, an emerging talent,"],
  [/\bthe kickoff\b/gi, "the strategic kickoff"],
  [/\bthe stapler\b|\ba stapler\b/gi, (m) => m.replace(/stapler/i, "stapler-based document-binding solution")],
  [/\bthe happy hour\b/gi, "the happy hour networking activation"], [/\btrivia night\b/gi, "the trivia night knowledge-sharing initiative"],
  [/\bthe hackathon\b/gi, "the hackathon innovation sprint"],
  [/\bthe rebrand\b/gi, "the rebrand journey"], [/\b(?:the|which|this) font\b(?= is| was| looks| we| you|[.!?,]|$)/gi, (m) => m.replace(/font/i, "font strategy")],
  [/\b(?:the|the new) logo\b(?= is| was| looks| has| grew| got|[.!?,]|$)/gi, (m) => m.replace(/logo/i, "logo brand asset")], [/\ba new mouse\b/gi, "a new precision-navigation mouse"],
  [/\bthe all hands\b(?! about)|\bthe all-hands\b(?! about)/gi, "the all-hands alignment summit"],
  [/\bthe offsite\b(?= is| was| has| got| will|[.!?]|$)/gi, "the offsite alignment retreat"], [/\bthe (?:password reset|password) policy\b|\banother password reset policy\b/gi, (m) => m.replace(/password(?: reset)? policy/i, "credential-refresh policy")],
  [/\bthe forecast\b/gi, "the forward-looking projection"], [/\bthe outage\b/gi, "the unplanned downtime experience"],
  [/\bthe shipment\b/gi, "the inbound shipment"], [/\bthe roadmap\b/gi, "the strategic roadmap"],
  [/\ba long weekend\b/gi, "an extended strategic recharge window"],
  [/\bthe pager\b/gi, "the on-call alerting apparatus"], [/\bthe (?:conference room )?TV\b/g, (m) => m.replace("TV", "display ecosystem")],
  [/\bthe whole company\b(?!'s)/gi, "the whole company, a stakeholder ecosystem of considerable size"],
  [/\bthe customer\b(?= is happy| is thrilled| loved)/gi, "the customer, our north star,"],
];
export function inflate(text) {
  let t = text;
  for (const [re, rep] of INFLATE) t = t.replace(re, rep);
  return t.replace(/\s{2,}/g, " ");
}

// Frames by topic and family. Each is a function of the (already lower-cased where needed) clause.
const F = (lead) => (s) => `${lead} ${s}`;
const TOPIC_FRAMES = {
  away: { personal: [F("A transparent update on my physical availability:"), F("Proactively broadcasting my availability footprint:")], neutral: [F("A transparent update on my physical availability:")], bad: [F("A transparent update on my physical availability:")] },
  coffee: { bad: [F("Escalating a critical caffeine supply-chain issue:"), F("Flagging a business-critical caffeine risk:")], neutral: [F("Sharing a caffeine-related strategic update:")], ask: [F("Raising a caffeine-critical ask:")], good: [F("Celebrating a breakthrough in caffeine availability:")], personal: [F("In the spirit of caffeine transparency,")] },
  food: { bad: [F("Escalating a nourishment-related blocker:"), F("Surfacing a critical refueling gap:")], neutral: [F("A quick nourishment-ecosystem update:")], ask: [F("Raising a nourishment-related ask:")], good: [F("Celebrating a win for our nourishment strategy:")], personal: [F("Being transparent about my fuel levels:")] },
  sleep: { bad: [F("Transparently flagging a bandwidth constraint:")], personal: [F("Transparently flagging a bandwidth constraint:"), F("A candid capacity update:")], neutral: [F("A candid capacity update:")], ask: [F("Raising a recovery-related ask:")], good: [F("Sharing a rare win for rest:")] },
  feelings: { bad: [F("Bringing my whole emotional self to work:"), F("Leaning into vulnerability as a leadership competency:")], personal: [F("Bringing my whole emotional self to work:"), F("Leaning into vulnerability as a leadership competency:")], neutral: [F("Leaning into vulnerability as a leadership competency:")], good: [F("Leaning into vulnerability as a leadership competency:")], ask: [F("Asking from a place of emotional transparency:")] },
  meetings: { bad: [F("A transparent update on our calendar ecosystem:"), F("Surfacing a calendar-density headwind:")], neutral: [F("A transparent update on our calendar ecosystem:")], personal: [F("A transparent update on my calendar ecosystem:")], ask: [F("In the interest of calendar sustainability,")], good: [F("Celebrating a win for our calendar ecosystem:")] },
  inbox: { bad: [F("Surfacing a communications-ecosystem headwind:")], neutral: [F("A quick update from the communications ecosystem:")], ask: [F("In the interest of a healthier communications ecosystem,")], good: [F("Celebrating a win for async excellence:")], personal: [F("A transparent update on my communications bandwidth:")] },
  tech: { bad: [F("Flagging an unplanned innovation in our technology stack:"), F("Surfacing a mission-critical technology headwind:")], neutral: [F("A quick update from the technology frontier:")], ask: [F("Raising a technology-enablement ask:")], good: [F("Celebrating a landmark win for our technology stack:"), F("Humbled to report a breakthrough in operational excellence:")], personal: [F("Flagging a technology-related bandwidth constraint:")] },
  money: { bad: [F("Surfacing a financial headwind with radical transparency:")], neutral: [F("A fiscally transparent update:")], ask: [F("Raising a fiscally strategic ask:")], good: [F("Celebrating a win for shareholder value:")], personal: [F("A fiscally transparent personal update:")] },
  docs: { bad: [F("Surfacing a documentation-ecosystem headwind:")], neutral: [F("A quick update from our knowledge-management journey:")], ask: [F("In the interest of documentation excellence,")], good: [F("Celebrating a landmark moment for our knowledge ecosystem:")], personal: [F("A transparent update on my documentation journey:")], opinion: [F("Offering some editorial thought leadership:")] },
  scope: { bad: [F("A transparent update on our ever-evolving scope:"), F("Surfacing a scope-agility headwind:")], neutral: [F("A transparent update on our ever-evolving scope:")], opinion: [F("Offering some scope-related thought leadership:")] },
  deadline: { bad: [F("Surfacing a time-related headwind:")], personal: [F("A transparent update on my time-to-arrival:")], neutral: [F("A time-sensitive strategic update:")], ask: [F("Raising a time-critical ask:")] },
  office: { bad: [F("Raising a facilities-level strategic concern:"), F("Escalating a workplace-experience headwind:")], neutral: [F("A quick update on our physical workplace ecosystem:")], ask: [F("Raising a workplace-experience ask:")], good: [F("Celebrating a win for our workplace experience:")], personal: [F("A transparent update on my physical logistics:")] },
  people: { bad: [F("Surfacing a stakeholder-alignment opportunity:")], neutral: [F("A quick stakeholder-ecosystem update:")], good: [F("Celebrating a win for our stakeholder ecosystem:")], ask: [F("Raising a stakeholder-related ask:")] },
};
const TOPIC_CLOSERS = {
  away: { any: ["Presence is a mindset, not a location.", "Availability is a journey, not a destination.", "My out-of-office reply has been briefed on our north star."] },
  coffee: { any: ["Caffeine is a key enabler of shareholder value.", "Our caffeine strategy remains under active review."] },
  food: { any: ["Nourishment is a strategic priority.", "A well-fueled team is a high-performing team.", "Snacks remain a core pillar of our culture."] },
  sleep: { any: ["My bandwidth is currently running in low-power mode.", "Rest is a deliverable."] },
  feelings: { any: ["Vulnerability is a leadership competency.", "Feelings are data."] },
  meetings: { bad: ["Our calendars remain our most over-leveraged asset.", "Alignment is a journey, and apparently a long one."], any: ["Our calendars remain our most over-leveraged asset.", "Alignment is a journey."] },
  inbox: { bad: ["Async excellence remains an aspiration.", "Every notification is a stakeholder."], any: ["Async excellence remains an aspiration.", "Every notification is a stakeholder."] },
  tech: { bad: ["Our technology roadmap remains, as ever, aspirational.", "Resilience is a muscle, and so, apparently, is patience."], good: ["Operational excellence, delivered.", "The flywheel is spinning."], any: ["Our technology roadmap remains, as ever, aspirational.", "Innovation never sleeps, and neither does this backlog."] },
  money: { bad: ["Every dollar is a stakeholder.", "Fiscal discipline is a journey."], good: ["Shareholder value, unlocked.", "Every dollar is a stakeholder."], any: ["Every dollar is a stakeholder.", "Fiscal discipline is a journey."] },
  docs: { any: ["Documentation remains our most ambitious long-term vision.", "Knowledge is a shared asset, in theory.", "This document is now a living, breathing, slightly confused organism."] },
  scope: { any: ["Scope is a living, breathing, ever-growing organism.", "Agility is a core value, and today it is being tested."] },
  deadline: { any: ["Time remains our scarcest resource.", "Punctuality is a journey, not a destination.", "The clock remains our toughest stakeholder."] },
  office: { any: ["The workplace experience remains a journey, not a destination.", "Our physical ecosystem remains a work in progress.", "Facilities has been looped in, spiritually."] },
  people: { bad: ["Stakeholder alignment is a journey, and we are still in the parking lot.", "We grow through friction, and we are growing a lot."], good: ["Somebody alert the culture deck.", "Legends are being written in real time."], any: ["Stakeholder alignment is a journey.", "We are all on the same team, structurally."] },
};
// Funnier generic closers by family, used when the topic has none.
const GENERIC_CLOSERS = {
  bad: ["Every setback is a setup for a comeback, presumably.", "Adversity is just opportunity in a hard hat.", "We remain cautiously optimistic about everything.", "This is fine, strategically speaking."],
  good: ["The flywheel is spinning.", "This is what happens when vision meets execution.", "History, and the quarterly scorecard, will remember this moment.", "Please hold your applause until the end of the quarter."],
  neutral: ["No synergies were harmed in the making of this strategic update.", "Please treat this update as a strategic asset.", "Consider yourselves strategically informed.", "This message has been optimized for maximum alignment."],
  personal: ["Self-care is a strategic KPI.", "My wellness metrics have been escalated for executive review.", "Please route all urgent synergies elsewhere."],
  ask: ["Gratitude has been pre-approved by all relevant stakeholders.", "Your inbox has been strategically pre-thanked.", "Grateful in advance, and in perpetuity."],
  opinion: ["Iron sharpens iron, and this is me sharpening.", "Strong opinions, loosely held.", "Respectfully, and with maximum thought leadership."],
};

const pick0 = (rng, xs) => xs[Math.floor(rng() * xs.length)];
// The meaning check rejects meeting words the input never used, so "calendar" becomes "schedule" then.
const MEET = /\b(?:meeting|meetings|meet|sync|syncs|call|calls|standup|stand-up|1:1|one-on-one|catch-up|catch up|huddle|invite|invites|calendar|talk|chat|discuss|connect)\b/i;
let srcText = "";
export function setSource(text) { srcText = String(text ?? ""); }
const deMeet = (x) => (typeof x === "string" ? x.replace(/\bcalendars\b/g, "schedules").replace(/\bcalendar\b/g, "schedule").replace(/\bCalendar\b/g, "Schedule") : (s) => deMeet(x(s)));
const pick = (rng, xs) => { const v = pick0(rng, xs); return MEET.test(srcText) ? v : deMeet(v); };
// Frame for this topic and family, or null to keep the intent frame.
export function topicFrame(topic, group, rng) {
  const t = TOPIC_FRAMES[topic];
  if (!t) return null;
  const pool = t[group] ?? (group === "personal" ? t.bad : null);
  return pool ? pick(rng, pool) : null;
}
export function topicClosers(topic, group) {
  const t = TOPIC_CLOSERS[topic];
  const pool = (t && (t[group] ?? (group !== "good" ? t.any : null))) ?? GENERIC_CLOSERS[group] ?? [];
  return MEET.test(srcText) ? pool : pool.map(deMeet);
}
export function topicCloser(topic, group, rng) {
  const pool = topicClosers(topic, group);
  return pool.length ? pick0(rng, pool) : null;
}

// Middle Manager: a light, mildly funny topic aside, appended only to statements.
const L2_QUIPS = {
  coffee: ["Caffeine levels: critical."], food: ["Snack strategy pending."], sleep: ["Running on fumes, professionally."],
  meetings: ["Calendar Tetris continues."], inbox: ["Inbox zero remains a stretch goal."], docs: ["Living document, very much alive."],
  money: ["Every dollar is a stakeholder."],
};
// These only fit when something went wrong.
const L2_BAD = {
  tech: ["Turning it off and on again remains our core strategy."],
  scope: ["Scope creep: confirmed."], office: ["Facilities, we need you."], deadline: ["The clock remains undefeated."],
  people: ["Stakeholder management in action."], feelings: ["Feelings are data."],
};
export function l2Quip(topic, group, rng, intent = "") {
  if (group === "good" || group === "ask" || /^(?:decline|apology|opinion|feedback|social|thanks|sensitive)$/.test(intent)) return null;
  const q = L2_QUIPS[topic] ?? (group === "bad" || group === "personal" ? L2_BAD[topic] : null);
  return q ? pick(rng, q) : null;
}
// For tests and graders: the text without a Middle Manager aside.
const ALL_QUIPS = [...Object.values(L2_QUIPS).flat(), ...Object.values(L2_BAD).flat()];
export function stripQuip(text) {
  let t = String(text);
  for (const q of ALL_QUIPS) for (const v of [q, q.replace(/\bCalendar\b/, "Schedule")]) if (t.endsWith(" " + v)) t = t.slice(0, -v.length - 1);
  return t;
}
