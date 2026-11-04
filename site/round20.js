// Round 20 (Nov 3, 2026): Full C-Suite satire in the body, for messages no specific rule fits.
// The fresh55 held-out read showed round 19's body jokes were too specific: 75% of Full C-Suite lines were still a
// stock opener + the message nearly word for word + a stock closer. satire20 is general: it rewrites the ordinary
// office words inside the message itself into deadpan corporate euphemism ("we're out of oat milk" -> "our oat milk
// inventory has reached zero", "the printer jammed" -> "the printer staged an unscheduled work stoppage",
// "three different project tools" -> "a diversified portfolio of three project tools"), drops the stock opener,
// and ends with one closer that fits the topic. It only speaks when at least one joke-bearing rewrite applied, and
// the engine still meaning-checks the result (no's, numbers, names, dates, questions kept).
// fix20 repairs Mild/Middle Manager shapes that came out ungrammatical in fresh55/fresh56.

import { REASONS19 } from "./round19.js";
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (arr, key) => arr[hash(key) % arr.length];
const SENSITIVE20 = /\b(?:funeral|passed|bereavement|hospital\w*|surgery|emergency|chemo\w*|cancer|diagnos\w*|treatment|miscarriage|memorial|grief|grieving|sick(?! of| and tired)|ill\b|illness|flu\b|covid|migraine|fever|labou?r|injur\w*|therapy|rehab|divorce|lost my|died|death|dying|laid off|fired|harass\w*|assault\w*|discriminat\w*|unsafe|safety|racist|sexist|threat\w*|screamed|yelled|abus\w*|pregnan\w*|mental health|burn(?:ed|t) out)\b/i;
const pl = (w) => /s$/i.test(w) && !/(?:ss|us|is)$/i.test(w);

// [pattern, replacement, topic, weight]. weight 2 = carries a joke; 1 = corporate vocabulary only.
export const LEX = [
  // Supplies and the office itself.
  [/\bwe(?:'re| are) (?:all )?out of ((?:[\w-]+ ){0,2}(?:milk|coffee|creamer|paper|toner|snacks|cups|water|tea|sugar|forks|napkins|bagels|ice|soap|towels|pens|filters|pods|chargers|badges|sparkling water|la croix))(?=[.,!]|$| again| on| in| at)/i, (m) => `our ${m[1].replace(/(\w{3,}[^s])s$/, "$1")} inventory has reached zero`, "food", 2],
  [/\bthere(?:'s| is| are) (?:some )?leftover (\w+)\b/i, (m) => `there is a surplus ${m[1].replace(/s$/, "")} inventory`, "food", 2],
  [/\bleftover (\w+)(?= (?:in|from|on|at)\b|[.,]|$)/i, (m) => `surplus ${m[1].replace(/s$/, "")} inventory`, "food", 2],
  [/\b(the |this |our |my )?(printer|copier|scanner)( on \w+)? jammed\b/i, (m) => `${m[1] ?? ""}${m[2]}${m[3] ?? ""} staged an unscheduled work stoppage`, "tech", 2],
  [/\bis eating (dollar bills|coins|quarters|money|cards|badges)\b/i, (m) => `is aggressively monetizing our ${m[1]}`, "food", 2],
  [/\b(the|our) elevator(?:'s| is) out\b(?! of)/i, (m) => `${m[1]} elevator is on an unplanned vertical sabbatical`, "place", 2],
  [/\b(the|our) (AC|air conditioning|heat|heating)( on our floor| on \w+ floor| upstairs)? has been (?:broken|down|out)\b/i, (m) => `${m[1]} ${m[2]}${m[3] ?? ""} has been on an unscheduled sabbatical`, "place", 2],
  [/\b(the|our|this|my) (office|floor|hallway|room|conference room|kitchen|coffee|tea|building|lobby|[\w-]+ floor)( in here| on \w+)? is (?:so |really |very |absolutely )?(?:freezing|cold)(?=[.,!]|$| again| today| in here| this)/i, (m) => `${m[1]} ${m[2]}${m[3] ?? ""} is optimized for thermal resilience`, "place", 2],
  [/\b(the|our) (open office|office|floor) is (?:so |really |very )?(?:loud|noisy)\b/i, (m) => `${m[1]} ${m[2]} delivers an aggressively immersive soundscape`, "place", 2],
  [/\bdelivers an aggressively immersive soundscape (?=I |I'm |I've |I'll |we |we're |you |nobody |no one |it |everyone )/i, () => "delivers such an immersive soundscape that ", "place", 0],
  [/\bis a maze\b/i, () => "offers an immersive, exploratory navigation experience", "docs", 2],
  [/\bnobody can find anything\b/i, () => "findability remains a stretch goal", "docs", 2],
  [/\bnobody(?:'s| has) fixed it\b/i, () => "a fix remains on the long-term roadmap", "place", 2],
  [/\b(the|our) (standing desks|chairs|monitors|laptops|hoodies|badges|headsets) (?:arrived|came in)\b/i, (m) => `${m[1]} ${m[2]} have been successfully onboarded`, "place", 2],
  [/\b(?:the )?new hoodies came in\b/i, () => "the new hoodies have been successfully onboarded", "place", 2],
  [/\bbrought (her|his|their|my) dog in\b/i, (m) => `onboarded ${m[1]} dog as a visiting stakeholder`, "pet", 2],
  // Tech.
  [/\b(my|our|the) (VPN|wifi|wi-fi|internet|connection) keeps dropping\b/i, (m) => `${m[1]} ${m[2]} remains deeply committed to dropping`, "tech", 2],
  [/\b(the|our|my) wifi dies\b/i, (m) => `${m[1]} wifi pursues an unscheduled exit`, "tech", 2],
  [/\bIT locked my account\b/, () => "IT proactively secured my account from me", "tech", 2],
  [/\bI lost half the (morning|afternoon|day)\b/i, (m) => `I donated half the ${m[1]} to the cause`, "time", 2],
  [/\bbroke prod\b/i, () => "ran an unscheduled resilience test on prod", "tech", 2],
  [/\b(code|codebase|repo) is (?:spaghetti|a mess)\b/i, (m) => `${m[1]} embraces a bold, non-linear architecture`, "tech", 2],
  [/\bis (?:screaming|roaring|whining) after the update\b/i, () => "is vocalizing strong feedback about the update", "tech", 2],
  [/\bscreaming\b(?= after| during| since)/i, () => "vocalizing strong feedback", "tech", 2],
  [/\b(?:the )?(?:issue|bug) is fixed but we still don't (?:yet )?know what caused it\b/i, () => "the issue is fixed, and its origin story remains an open mystery", "tech", 2],
  [/\bis (?:terrible|delivering a below-baseline experience)\b/i, () => "is delivering a below-baseline experience", "tech", 1],
  [/\btheir docs are worse\b/i, () => "their docs are even more aspirational", "docs", 2],
  // People and process.
  [/\bkeep (?:having|holding|scheduling) (?:catch-ups|syncs|meetings|alignment sessions) to plan the next (?:sync|meeting|catch-up)\b/i, () => "remain deeply committed to holding meetings to plan the next meeting", "process", 2],
  [/\ba feature that doesn't exist\b/i, () => "a feature that doesn't exist outside our shared vision", "people", 2],
  [/\b(the |our )?(client|customer|stakeholder|boss|manager|VP|leadership) changed (the|their|its) (scope|requirements|mind|priorities|brief)\b/i, (m) => `${m[1] ?? ""}${m[2]} exercised strategic agility on ${m[3]} ${m[4]}`, "people", 2],
  [/\bpet project\b/i, () => "personally championed strategic priority", "money", 2],
  [/\b(?:is|are) being discontinued\b/i, (m) => `${/^are/i.test(m[0]) ? "are" : "is"} being strategically sunset`, "tech", 2],
  [/\bthe free lunch is now\b/i, () => "the complimentary lunch program has evolved into", "food", 2],
  [/^tell (legal|finance|IT|HR|procurement|sales|marketing|ops) to get moving and\b/i, (m) => `Please encourage our ${m[1]} partners to accelerate their journey and`, "people", 2],
  [/\bdoes all the (?:work|tasks|deliverables) and (\w+(?: team)?) takes the credit\b/i, (m) => `delivers all the value and ${m[1]} takes full ownership of the applause`, "people", 2],
  [/\bwas given zero training\b/i, () => "received a fully self-directed onboarding experience", "people", 2],
  [/\b(?:and )?thrown on the (client|customer) account\b/i, (m) => `and was accelerated directly onto the ${m[1]} account`, "people", 2],
  [/\bdrops (?:a|an) urgent request at\b/i, () => "gifts the team an urgent request at", "time", 2],
  [/\b(?:keep|keeps) getting cancell?ed by\b/i, (m) => (/keeps/.test(m[0]) ? "keeps getting strategically deprioritized by" : "keep getting strategically deprioritized by"), "people", 2],
  [/\bwe were (?:told|informed) about (the [\w -]{2,30}?) the same day (customers|clients) were\b/i, (m) => `we were looped in on ${m[1]} at the same time as ${m[2]}, a bold experiment in flat communication`, "people", 2],
  [/\btakes (\w+ (?:weeks|days|months)) for a (\$\d[\d,]*) purchase\b/i, (m) => `takes ${m[1]} for a ${m[2]} purchase, a rigorous return on our time`, "process", 2],
  [/\bI'm (?:really |so |very )?(?:tired|frustrated|sick|fed up) (?:of|with) (\w+ing)\b/i, (m) => `I've reached the end of my enthusiasm runway for ${m[1]}`, "me", 2],
  [/\bbabysitting the contractors\b/i, () => "providing white-glove supervision to our external talent partners", "people", 2],
  [/\bsomeone changed their mind\b/i, () => "someone exercised strategic agility", "people", 2],
  [/\b(?:hated|disliked) it\b/i, () => "had strong feedback about it", "people", 2],
  [/\bhates it\b/i, () => "has strong feedback about it", "people", 2],
  [/\bmade us look (?:foolish|bad|silly)\b/i, () => "created a high-visibility learning moment for our brand", "people", 2],
  [/\b(\w+) hours of icebreakers\b/i, (m) => `${m[1]} hours of mandatory vulnerability exercises`, "process", 2],
  [/\bis nonsense\b/i, () => "is, respectfully, more fiction than data", "process", 2],
  [/\bnobody knows who their (?:manager|boss|leadership partner) is\b/i, () => "reporting lines are now a choose-your-own-adventure", "process", 2],
  [/\b(?:a|the) rebrand nobody noticed\b/i, (m) => `${m[0].split(" ")[0]} rebrand that achieved an exclusive audience of zero`, "money", 2],
  [/\b(two|three|four|five|six|\d+) different ([\w-]+ )?(tools|apps|systems|platforms|vendors|dashboards|trackers|calendars)\b/i, (m) => `a diversified portfolio of ${m[1]} ${m[2] ?? ""}${m[3]}`, "process", 2],
  [/\bwho approved (a|an|the) /i, (m) => `who sponsored ${m[1]} `, "process", 1],
  [/\bshould I just buy my own\b/i, () => "should I just self-fund", "money", 2],
  [/\bwho's on point for\b/i, () => "who owns", "people", 1],
  [/\brestock the printer paper\b/i, () => "replenish our printer paper inventory", "place", 2],
  [/\breply all\b/i, () => "broadcast to the entire ecosystem", "people", 2],
  [/\bwe keep getting (pulled|dragged|looped|added) into\b/i, (m) => `we remain deeply committed to being ${m[1]} into`, "process", 2],
  [/\bfor no reason\b/i, () => "for reasons known only to the system", "tech", 2],
  [/\bstart (\w+ minutes) late because (?:folks|people|team members) don't show up\b/i, (m) => `start ${m[1]} late because attendance remains aspirational`, "time", 2],
  [/\b(?:our|the) team is always the last to hear about\b/i, () => "our team enjoys a last-to-know communication tier for", "people", 2],
  [/\bI've asked (\w+) (three|two|four|five|\d+) times for (a|an) ([\w -]{2,20}?) and nothing\b/i, (m) => `I've submitted ${m[2]} requests to ${m[1]} for ${m[3]} ${m[4]}, and the response remains in a patient holding pattern`, "people", 2],
  [/\bkeeps emailing me directly instead of using\b/i, () => "remains deeply committed to emailing me directly instead of using", "people", 2],
  // Numbers.
  [/\b(?:we lost|we released) (\d+|two|three|four|five) (clients|customers|accounts)(?: to ([A-Z][\w&-]*))?\b/i, (m) => `we released ${m[1]} ${m[2]} to pursue other opportunities${m[3] ? ` with ${m[3]}` : ""}`, "loss", 2],
  [/\b(?:NPS|score|rating|conversion rate|retention|engagement) dropped from ([\d.]+) to ([\d.]+)\b/i, (m) => `${m[0].split(" dropped")[0]} has been right-sized from ${m[1]} to ${m[2]}`, "money", 2],
  [/\b(bill|spend|costs?) went from (\$[\d,.]+k?) to (\$[\d,.]+k?)\b/i, (m) => `${m[1]} achieved record-breaking growth from ${m[2]} to ${m[3]}`, "money", 2],
  [/\bworst since (\d{4})\b/i, (m) => `our most memorable result since ${m[1]}`, "money", 2],
  [/\b(\d[\d,]*) (?:unread|unanswered|open) (support tickets|tickets|emails)(?=[.!]|$)/i, (m) => `${m[1]} ${m[0].match(/unread|unanswered|open/i)[0].toLowerCase()} ${m[2]}, currently in a patient holding pattern`, "time", 2],
  [/\b(\d+) late shipments\b/i, (m) => `${m[1]} shipments on a non-linear timeline`, "time", 2],
  [/\bis (\d+ (?:weeks|days|months)) behind\b/i, (m) => `is ${m[1]} into a non-linear timeline`, "time", 2],
  [/\bthe target was (\d[\d.]*%?)\b/i, (m) => `the target was an aspirational ${m[1]}`, "money", 2],
  [/\b(\d[\d.]*%) under target\b/i, (m) => `${m[1]} short of an aspirational target`, "money", 2],
  [/\bwe (shipped|delivered|finished|launched|closed) (\d+) of the (\d+) ([\w ]{2,20}?) we (promised|planned|committed to)( this \w+| last \w+)?\b/i, (m) => `we ${m[1]} ${m[2]} of the ${m[3]} ${m[4]} we ${m[5]}${m[6] ?? ""}, a highly selective delivery strategy`, "money", 2],
  [/\bonly (\d+) of the (\d+) ([\w ]{2,20}?) came back\b/i, (m) => `only ${m[1]} of the ${m[2]} ${m[3]} chose to continue the journey`, "money", 2],
  [/\b(?:spent|invested) (\$[\d,.]+k?) on swag nobody wanted\b/i, (m) => `invested ${m[1]} in swag with an exclusive audience of zero`, "money", 2],
  [/\bat (\d+)% capacity\b/i, (m) => `at a robust ${m[1]}% capacity`, "place", 1],
  [/\baveraging (\d+ days)\b/i, (m) => `averaging a thoughtful ${m[1]}`, "time", 2],
  [/\btook (\d+ hours) instead of the (\d+) we planned\b/i, (m) => `took ${m[1]} instead of the ${m[2]} we planned, a bold reinterpretation of the plan`, "time", 2],
  [/\bfrom (\$\d+) to (\$\d+) since (\w+)\b/i, (m) => `from ${m[1]} to ${m[2]} since ${m[3]}, the wrong kind of growth`, "money", 2],
  // Status and fragments, said like an earnings call.
  [/\b(so )?I'm waiting on (the |a |an )?([\w -]{1,20}?)(?=[.,]|$)/i, (m) => `${m[1] ?? ""}I'm in a patient holding pattern awaiting ${m[2] ?? ""}${m[3]}`, "time", 2],
  [/\bwe're still blocked on\b/i, () => "we remain in a patient holding pattern on", "time", 2],
  [/\b(?:hiring|recruiting|the project|the launch|the rollout) is paused\b/i, (m) => `${m[0].replace(/ is paused$/i, "")} is in a strategic hibernation`, "process", 2],
  [/\bwith a (\d+%) cut\b/i, (m) => `with a ${m[1]} right-sizing`, "money", 2],
  [/\b(launch|release|go-live|demo|rollout|deadline) slipped to\b/i, (m) => `${m[1]} has been re-baselined to`, "time", 2],
  [/\bQA found a (crash|bug|defect)\b/i, () => "QA discovered an undocumented feature", "tech", 2],
  [/\bis unhappy with\b/i, () => "has strong feedback on", "people", 2],
  [/\bwent down for (\d+|two|three|four|five|six) hours\b/i, (m) => `took an unscheduled ${m[1]}-hour wellness break`, "tech", 2],
  [/\bwe rolled back the release\b/i, () => "we strategically un-released the release", "tech", 2],
  [/\bwe lost (\w+) (senior |junior |key |great )?(engineers|designers|people|folks|team members|salespeople|reps|developers|nurses)(?=(?: this \w+| last \w+)?(?:[.,!]|$))/i, (m) => `${m[1]} ${m[2] ?? ""}${m[3]} chose to explore other journeys`, "talent", 2],
  [/\bno blockers\b/i, () => "no blockers, a state of affairs I'm documenting for posterity", "win", 2],
  [/\bneed your eyes\b/i, () => "would value a set of eyes, ideally yours", "process", 2],
  [/\b(v\d+)(?=[.!]|$|, | is | has been | attached| uploaded| ready| for review)(?![^?]*\?)/, (m, i, str) => `${m[1]}, our most evolved version yet`, "process", 2],
  [/(our most evolved version yet) (is|has been|attached|uploaded|ready|for review)\b/, (m) => `${m[1]}, ${/^(?:attached|uploaded|ready|for review)$/.test(m[2]) ? "is " : ""}${m[2]}`, "process", 0],
  [/\breboot tonight\b/i, () => "restorative reboot tonight", "tech", 2],
  [/\bneed one more panelist\b/i, () => "we have one open seat on the panel, a high-impact volunteer opportunity", "people", 2],
  [/\bthe build isn't stable\b/i, () => "the build is still finding itself", "tech", 2],
  [/\bsecret santa\b/i, () => "the anonymous gift-exchange initiative", "people", 1],
  [/\b(?:the |our )holiday party\b/i, (m) => `${m[0].match(/^\w+/)[0]} end-of-year culture activation`, "people", 1],
  // No's, with the no kept.
  [/\bI'm already on (two|three|four|five|\d+)\b/i, (m) => `my plate is already at full strategic capacity with ${m[1]}`, "me", 2],
  [/(?:\. |, )?\b[Ii]t's a tax thing\b/, () => ", for reasons our tax partners describe as non-negotiable", "no", 2],
  [/\bI just don't have time (?:right now|at the moment)\b/i, () => "my bandwidth is fully allocated at the moment", "me", 2],
  [/\bthey used the product for (\d+ months)\b/i, (m) => `they enjoyed ${m[1]} of the product`, "money", 2],
  [/\bit's been fixed twice\b/i, () => "it has been fixed twice, which is two more times than most things", "tech", 2],
  [/\bI'm not comfortable signing off on (figures|numbers|metrics) I haven't seen\b/i, (m) => `I'm not comfortable signing off on ${m[1]} I haven't been introduced to`, "money", 2],
  [/\bfor a client in another time zone\b/i, () => "for a client in a time zone that does not respect mine", "time", 2],
  // Small wins.
  [/\bwe got the (\w+) renewal\b/i, (m) => `we secured the ${m[1]} renewal`, "win", 1],
  [/\btraffic is up (\d+%)\b/i, (m) => `traffic is up ${m[1]}, a growth story I intend to tell at every offsite`, "win", 2],
  [/\beverything looks clean\b/i, () => "everything looks clean, a rare moment of alignment between us and reality", "win", 2],
  [/\b(?:the )?pilot (?:customers|clients) (?:really like|love)\b/i, (m) => `${/^the/i.test(m[0]) ? "the " : ""}pilot customers are deeply aligned with`, "win", 2],
  // Everyday status.
  [/\b(the|my|our) (shuttle|bus|driver|uber|ride|delivery|courier|plumber|contractor|technician|internet guy|cable guy) (?:didn't|did not|never) show(?: up)?\b/i, (m) => `${m[1]} ${m[2]} pursued an unscheduled absence`, "late", 2],
  [/\b(the|my|our) (train|bus|subway|tram|ferry|flight|plane) (?:stopped|is stuck|got stuck|is sitting)( in a tunnel| on the tracks| on the runway| at [\w ]{2,20}?)?(?=[.,]|$| again| for)/i, (m) => `${m[1]} ${m[2]} has paused${m[3] ?? ""} for some strategic reflection`, "late", 2],
  [/\b(?:so|and) (our|my|the) ([\w -]{2,25}?) (?:is|are) (?:gone|lost|wiped)\b/i, (m) => `, so ${m[1]} ${m[2]} ${pl(m[2].split(" ").pop()) ? "have" : "has"} been strategically sunset`, "process", 2],
  [/\bsounds like a (jet engine|freight train|lawnmower|blender|chainsaw|leaf blower|helicopter)\b/i, (m) => `is operating at ${m[1]} decibel levels`, "place", 2],
  [/\b(?:dialing|calling|joining) in from my (car|kitchen|closet|garage|parked car|bathroom)\b/i, (m) => `joining from my mobile office, also known as my ${m[1]}`, "tech", 2],
  [/\b(?:nobody|no one) has (?:the right |a |an |the )([\w -]{2,20}?)(?=[.,]|$)/i, (m) => `${/^(?:right )/.test(m[0]) ? "" : ""}the ${/the right /i.test(m[0]) ? "right " : ""}${m[1]} remains an unfilled position`, "place", 2],
  [/\bthe ([\w ]{2,25}?) is officially dead\b/i, (m) => `the ${m[1]} has officially reached end of life`, "place", 2],
  [/\b(the|our|my) ([\w -]{2,25}?) (?:changed|shifted|moved) again\b/i, (m) => `${m[1]} ${m[2]} has pivoted again`, "process", 2],
  // Round 20b: broader, general body jokes (structure-level, not one-off lines).
  [/\bthank you for (covering|stepping in|jumping in|filling in|picking (?:this|that) up|the quick turnaround|the help|helping)([^.,!?;]*)/i, (m) => `thank you for ${m[1]}${m[2]}, a true act of cross-functional heroism`, "win", 2],
  [/^happy birthday,? ([A-Z][a-z]+)!?$/i, (m) => `Happy birthday, ${m[1]}! Another year of compounding experience`, "bday", 2],
  [/\bcake is in the ([\w ]{2,25}?) at (\d{1,2}(?::\d\d)?(?: ?[ap]m)?)\b/i, (m) => `cake will be deployed to the ${m[1]} at ${m[2]}`, "food", 2],
  [/^congratulations on (the|your) ([\w -]{2,30}?)([.!]?)$/i, (m) => `congratulations on ${m[1]} ${m[2]}, a milestone the culture deck will be hearing about${m[3]}`, "win", 2],
  [/\bthe client loved the (pitch|demo|deck|proposal|prototype|design|idea)\b/i, (m) => `the client was deeply aligned with the ${m[1]}`, "win", 2],
  [/\bI'm double-booked((?: (?:at|on|from|for|tomorrow|today|this|all)\b[^.,!?;]*)?)/i, (m) => `I'm double-booked${m[1]}, a scheduling outcome I can only describe as popular`, "time", 2],
  [/\bthe (demo|launch|pitch|offsite|workshop|presentation|call|review|interview|rollout) went (?:really |super )?well\b/i, (m) => `the ${m[1]} went well, a rare moment of alignment between our plans and reality`, "win", 2],
  [/\bthe printer ate my ([\w -]{2,25}?)(?=[.,!]|$| again| and)/i, (m) => `the printer has acquired my ${m[1]} in a hostile takeover`, "tech", 2],
  [/\b(the [\w -]{2,25}?|it) is out of (?:space|storage|room)\b/i, (m) => `${m[1]} has achieved full capacity`, "tech", 2],
  [/\b(the [\w -]{2,20}?|my [\w -]{2,20}?) keeps (crashing|freezing|dropping|failing|disconnecting|timing out|logging me out|restarting|rebooting)\b/i, (m) => `${m[1]} remains deeply committed to ${m[2]}`, "tech", 2],
  [/\bI'm on my (second|third|fourth|fifth|sixth|\d+(?:st|nd|rd|th)) (coffee|espresso|cup of coffee|energy drink)((?: and it's [\w:]+(?: ?[ap]m)?)?)(?=[.,!]|$)/i, (m) => `I'm on my ${m[1]} ${/coffee|espresso/.test(m[2]) ? "caffeine intervention" : m[2]}${m[3]}; my productivity remains a key performance input`, "food", 2],
  [/\bI'm stuck in traffic(?=[.!]|$|, and |, so )/i, () => "I'm stuck in traffic, which is moving at the speed of procurement", "late", 2],
  [/\b(the supplier|the vendor|the contractor|the agency|they) missed the deadline\b/i, (m) => `${m[1]} has embraced a non-linear relationship with the deadline`, "late", 2],
  [/\btakes (\d+) (minutes|hours|days|weeks)((?: now| again| today| every time| each time)?)(?=[.,!]|$)/i, (m) => `takes a leisurely ${m[1]} ${m[2]}${m[3]}, a velocity we are choosing to celebrate`, "time", 2],
  [/\b(\d+) (outages|incidents|bugs|complaints|escalations|errors|crashes|support tickets) (this \w+), up from (\d+) (last \w+)/i, (m) => `${m[1]} ${m[2]} ${m[3]}, up from ${m[4]} ${m[5]}, the wrong kind of growth`, "tech", 2],
  [/\b(NPS|revenue|signups|sign-ups|conversion|retention|traffic|usage|engagement) went from (\$?\d[\d,]*(?:\.\d+)?%?) to (\$?\d[\d,]*(?:\.\d+)?%?)(?=[.,!]|$)/i, (m) => parseFloat(m[3].replace(/[$,%]/g, "")) > parseFloat(m[2].replace(/[$,%]/g, "")) ? `${m[1]} went from ${m[2]} to ${m[3]}, a growth story I intend to tell at every offsite` : m[0], "win", 2],
  [/\b(marketing|sales|legal|IT|finance|ops|engineering|the vendor|the agency|someone|he|she|they) (?:messed up|mishandled|botched|screwed up) (the|our|my) ([\w -]{2,25}?)(?=[.,!]|$| for| on| in)/i, (m) => `${m[1]} took a bold, non-traditional approach to ${m[2]} ${m[3]}`, "process", 2],
  [/\b(my|the|our) (basement|roof|ceiling|sink|pipe|kitchen|bathroom|dishwasher|washing machine|fridge) is leaking( again)?\b/i, (m) => `${m[1]} ${m[2]} has launched an unplanned water feature${m[3] ? ", again" : ""}`, "place", 2],
  [/, no rush\b/i, () => ", no rush; consider this a low-urgency, high-affection request", "ask", 2],
  [/\bthe (speaker|presenter|vendor|candidate|client|caterer) no-showed\b/i, (m) => `the ${m[1]} was a no-show, a bold format choice`, "people", 2],
  [/\b(?:the )?(event|session|room|webinar|workshop|talk) was packed\b/i, (m) => `${/^the/i.test(m[0]) ? "the " : ""}${m[1]} was operating at full capacity`, "win", 1],
  [/\bto (\d|1\d)% of (users|customers|traffic)\b/i, (m) => `to a carefully curated ${m[1]}% of ${m[2]}`, "tech", 2],
  [/\bis used by ([1-9])% of (users|customers|the team|employees)\b/i, (m) => `enjoys an exclusive audience of ${m[1]}% of ${m[2]}`, "loss", 2],
  [/\bwe're on track for the ([\w -]{2,25}?)((?: next \w+| this \w+| on \w+| by \w+)?)(?=[.!]|$)/i, (m) => `we're on track for the ${m[1]}${m[2]}, pending final stakeholder approval from the universe`, "win", 2],
  [/\b(legal|finance|procurement|security|compliance|the board|the client|marketing|HR) approved the ([\w -]{2,25}?)(?= with|[.,!]|$)/i, (m) => `${m[1]} has formally blessed the ${m[2]}`, "win", 2],
  [/\b(my|the) in-laws are visiting((?: all week| this week| this weekend| next week| until \w+)?)/i, (m) => `${m[1]} in-laws are onsite${m[2]} for an extended stakeholder visit`, "home", 2],
  [/\bI'll be moving (this weekend|next week|this week|on \w+|tomorrow)\b/i, (m) => `I'll be relocating my home headquarters ${m[1]}`, "home", 2],
  [/\bbroke (email|the build|login|checkout|search|the website|the site|the app|the dashboard|payroll|the wifi)( again)?( for [\w ]{2,25}?)?(?=[.,!]|$)/i, (m) => `broke ${m[1]}${m[2] ?? ""}${m[3] ?? ""}, an unscheduled resilience test`, "tech", 2],
  [/\bthey moved the (delivery )?deadline again\b/i, (m) => `the ${m[1] ?? ""}deadline has been re-baselined again, as is tradition`, "time", 2],
  [/\b(the [\w -]{2,20}?) (?:has been|is) (?:broken|down|out of order|not working) (for (?:a|two|three|\d+) (?:days?|weeks?|months?|hours?))\b/i, (m) => `${m[1]} has been on an unscheduled sabbatical ${m[2]}`, "place", 2],
  // Round 20c: more general structures.
  [/\b(\w+) has been failing since (the [\w -]{2,20}?)(?=[.,!]|$)/i, (m) => `${m[1]} has been on a losing streak since ${m[2]}`, "tech", 2],
  [/\b(conversion|revenue|signups|sign-ups|retention|traffic|usage|engagement|NPS|bookings|sales) (jumped|rose|grew|climbed) from (\$?\d[\d,]*(?:\.\d+)?%?) to (\$?\d[\d,]*(?:\.\d+)?%?)(?=[.,!]|$)/i, (m) => `${m[1]} ${m[2]} from ${m[3]} to ${m[4]}, a growth story I intend to tell at every offsite`, "win", 2],
  [/\b(our [\w ]{2,20}?|the [\w ]{2,20}?) (fell|dropped|slipped|sank) to (\$?\d[\d,]*(?:\.\d+)?%?(?: stars?| points?)?)(?=[.,!]|$| this| last)/i, (m) => `${m[1]} has been right-sized to ${m[3]}`, "dip", 2],
  [/\bthe (hotfix|fix|patch|update|new build|release) is live(?=[.!]|$)/i, (m) => `the ${m[1]} is live and thriving in production, for now`, "win", 2],
  [/\bhalf the team has (finished|completed|done) ([\w -]{2,30}?)(?=[.!]|$)/i, (m) => `half the team has ${m[1]} ${m[2]}, a strong start on our journey to the other half`, "win", 2],
  [/\bwe shipped the wrong (\w+) to (\d[\d,]*) (customers|clients|users|stores)\b/i, (m) => `we shipped the wrong ${m[1]} to ${m[2]} ${m[3]}, a bold, unrequested personalization initiative`, "loss", 2],
  [/\b(the [\w ]{2,25}?) got wiped( again)?\b/i, (m) => `${m[1]} was strategically sunset${m[2] ?? ""}`, "tech", 2],
  [/\bsomeone actually refilled the (coffee|snacks|printer|paper|fridge|water)\b/i, (m) => `someone actually refilled the ${m[1]}, a rare moment of alignment between us and reality`, "food", 2],
  [/\bthe (deck|doc|document|report|slide|proposal|email) has too many (words|slides|bullets|pages)\b/i, (m) => `the ${m[1]} is aggressively ${m[2].replace(/s$/, "")}-forward`, "docs", 2],
  [/\b(the client|the customer|the vendor|the supplier|they|legal|finance|the board) moved the (call|meeting|demo|review|sync|deadline|kickoff|presentation) to\b/i, (m) => `${m[1].replace(/^the client$/i, "our valued client partner").replace(/^the customer$/i, "our valued customer partner")} strategically re-baselined the ${m[2]} to`, "time", 2],
  [/\b(isn't much help|is useless|is worthless)(?=[.,!]|$)/i, () => "isn't much help, operating in a purely decorative capacity", "tech", 2],
  [/\b(the supplier|the vendor|legal|finance|procurement|the client|the customer|they|IT|HR) still hasn't ([\w -]{2,40}?)(?=[.!]|$)/i, (m) => `${m[1]} still hasn't ${m[2]}, a bold display of strategic patience`, "time", 2],
  [/^apologies, I forgot to ([\w -]{2,30}?)(?=[.!]|$)/i, (m) => `apologies, I forgot to ${m[1]}; my memory has been placed on a performance improvement plan`, "me", 2],
  [/\bcomments were (?:somewhat |a bit |really |pretty |quite )?harsh\b/i, () => "comments were refreshingly candid", "people", 2],
  [/\bis off by about (\d+) (units|dollars|items|people|records|rows)\b/i, (m) => `is off by a creative ${m[1]} ${m[2]}`, "money", 2],
  [/\bis taking forever(?:, oh no)?/i, () => "is unfolding on a non-linear timeline", "time", 2],
  [/\b(I'd prefer to not|I'd rather not|I'm unable to) take (that|this|it|another [\w ]{2,15}?) on( at the moment| right now)?(?=[.!]|$)/i, (m) => `${m[1]} take ${m[2]} on${m[3] ?? ""}; my plate is at full strategic capacity`, "me", 2],
  [/\b(I'd prefer to not|I'd rather not) take on (another [\w ]{2,15}?)(?=[.!]|$)/i, (m) => `${m[1]} take on ${m[2]}; my plate is at full strategic capacity`, "me", 2],
  [/\bI'm not available for the ([5-7](?::\d\d)?\s?am) (call|meeting|sync|standup)\b/i, (m) => `I'm not available for the ${m[1]} ${m[2]}, an hour my brain has not yet onboarded to`, "time", 2],
  [/\bmy (train|bus|flight|ferry|subway) is delayed(?=[.!]|$)/i, (m) => `my ${m[1]} is delayed, exploring a flexible relationship with the timetable`, "late", 2],
  [/\bI missed my (train|bus|flight|ferry|shuttle)(?=[.!]|$)/i, (m) => `I missed my ${m[1]}, following a brief strategic misalignment with the timetable`, "late", 2],
  [/^happy holidays,? everyone!?$/i, () => "Happy holidays, everyone! May your out-of-office replies be strong", "bday", 2],
  [/\b(was fun|was great|was good), but too long\b|\b(was fun|was great|was good) but too long\b/i, (m) => `${m[1] ?? m[2]}, but generously long`, "time", 2],
  [/\bis in really poor shape\b/i, () => "is in a deeply aspirational state", "process", 2],
  [/\b(legal|finance|IT|HR|procurement|the vendor|the client) only replied after (two|three|four|five|six|\d+) (days|weeks|months)\b/i, (m) => `${m[1]} replied after a thoughtful ${m[2]} ${m[3]}`, "time", 2],
  // Round 20d: more general structures from the older sandwich pool.
  [/\b(the|our|this) (air conditioning|AC|office|conference room|meeting room|room|floor|kitchen|building|heat|heating) is (?:too|way too|so|really|very) (cold|freezing|hot|warm)\b/i, (m) => `${m[1]} ${m[2]} is running an aggressively ${/cold|freezing/i.test(m[3]) ? "arctic" : "tropical"} climate strategy`, "place", 2],
  [/\b(the|this|our) ([\w -]{2,25}?) smells (?:awful|terrible|bad|weird|horrible)\b/i, (m) => `${m[1]} ${m[2]} has launched a bold new fragrance strategy`, "place", 2],
  [/\bI'm going to lose my mind\b/i, () => "my remaining composure is at serious strategic risk", "me", 2],
  [/\bI'm not sure who owns (that|the|this) ([\w -]{2,25}?)(?=[.!?]|$)/i, (m) => `I'm not sure who owns ${m[1]} ${m[2]}, which appears to be self-governing`, "process", 2],
  [/\bmy (kids|kid|son|daughter|toddler|twins) (?:is|are) with me today\b/i, (m) => `my ${m[1]} ${/^(?:kids|twins)$/.test(m[1]) ? "are" : "is"} joining me today as unpaid junior associates`, "home", 2],
  [/\b(page load|load time|build time|response time|latency|the build|the build time|query time|boot time) went from (\d+(?:\.\d+)?) ?(s|ms|sec|seconds|minutes|min) to (\d+(?:\.\d+)?) ?(s|ms|sec|seconds|minutes|min)\b/i, (m) => (parseFloat(m[4]) < parseFloat(m[2]) && m[3] === m[5]) ? `${m[1]} went from ${m[2]}${/^(?:s|ms)$/.test(m[3]) ? "" : " "}${m[3]} to ${m[4]}${/^(?:s|ms)$/.test(m[5]) ? "" : " "}${m[5]}, a speed story I intend to tell at every offsite` : m[0], "win", 2],
  [/\btakes (\d+) (clicks|steps|forms|approvals|signatures|screens|logins)\b/i, (m) => `takes a leisurely ${m[1]} ${m[2]}`, "process", 2],
  [/\ba feature we don't (even )?have\b/i, (m) => `a feature we don't ${m[1] ?? ""}have, currently available only in our shared vision`, "people", 2],
  [/^happy (monday|tuesday|wednesday|thursday|friday)(, everyone)?(, and good morning)?!?$/i, (m) => `Happy ${cap(m[1].toLowerCase())}${m[2] ?? ""}${m[3] ?? ""}! ${/friday/i.test(m[1]) ? "The weekend is now within strategic reach" : "The weekend remains on the roadmap"}`, "people", 2],
  [/\bI'm doing (two|three|\d+) people's jobs\b/i, (m) => `I'm doing ${m[1]} people's jobs, a bold experiment in headcount efficiency`, "me", 2],
  [/\bcc'd (their|his|her|my|our|the) (CEO|boss|manager|VP|CFO|lawyer|legal team|director|board)\b/i, (m) => `cc'd ${m[1]} ${m[2]}, a bold expansion of the stakeholder map`, "people", 2],
];

const CLOSE20 = {
  food: ["A well-fueled team is a high-performing team.", "Snacks remain a core pillar of our culture.", "The kitchen roadmap is under review."],
  place: ["Facilities has been invited to align on next steps.", "Our physical ecosystem remains a work in progress.", "The workplace experience remains a journey, not a destination."],
  tech: ["IT has been looped in, spiritually.", "Our digital transformation continues, in its own way.", "Our technical debt has been promoted to technical equity.", "Innovation is a journey, and this is a detour."],
  time: ["Time remains our scarcest resource.", "The clock remains undefeated.", "Time is a flat circle, and it is fully booked."],
  late: ["My arrival is now a strategic surprise.", "Please hold my spot in the agenda.", "Punctuality remains a core aspiration."],
  people: ["We are all on the same team, structurally.", "I remain committed to radical empathy.", "Feedback has been gift-wrapped accordingly."],
  process: ["Process is our most scalable product.", "I'd like to propose a working group to streamline the working groups.", "Efficiency remains on the roadmap.", "Bureaucracy is a feature, not a bug."],
  docs: ["Knowledge is a shared asset, in theory.", "The documentation remains our most ambitious long-term vision."],
  me: ["My bandwidth has submitted its resignation.", "Resilience is a muscle, and mine is cramping.", "Vulnerability is a leadership competency."],
  money: ["Finance has been looped in, and is breathing into a paper bag.", "We are reframing this as an investment in learning.", "Fiscal discipline is a journey.", "Every dollar is a stakeholder, and several have left the building."],
  talent: ["We wish them every success in their new journey.", "Their institutional knowledge has been transitioned to the cloud, by which I mean nowhere."],
  dip: ["Every setback is a setup for a comeback, presumably.", "We are reframing this as an investment in learning.", "The only way from here is up, statistically."],
  bday: ["Cake has been pre-approved by all relevant stakeholders.", "Legends are being written in real time.", "Please celebrate responsibly and within budget."],
  home: ["Work-life integration remains a journey.", "My home office is now a shared workspace.", "Boundaries are a leadership competency."],
  loss: ["We wish them every success in their new journey.", "Our pipeline is now refreshingly uncluttered.", "Every setback is a setup for a comeback, presumably."],
  win: ["Somebody alert the culture deck.", "Please hold your applause until the end of the quarter.", "The flywheel is spinning."],
  pet: ["The dog has been added to the stakeholder map.", "We value diverse perspectives."],
  no: ["My bandwidth has spoken, and it said no.", "Every no is a strategic yes to focus.", "This decision has been pressure-tested by my bandwidth."],
  ask: ["Your inbox has been strategically pre-thanked.", "Gratitude has been pre-approved by all relevant stakeholders."],
};
const L1_OPEN20 = /^(?:just a heads[- ]up(?: that)?,?|heads[- ]up(?: that)?,?|I'm (?:happy|excited|thrilled|pleased) to share that|Just a heads-up that|Just a quick heads-up that|Just a quick update|Quick update|Just so you know|Just to let you know|Just to check|It looks like|I wanted to flag that|Unfortunately|Heads-up|FYI|Frankly|Honestly)[:,]?\s*/i;

export function satire20(l1, raw) {
  const src = String(raw ?? "");
  if (!src.trim() || SENSITIVE20.test(src) || src.length > 200 || /\n/.test(src)) return null;
  let t = String(l1 ?? "").trim().replace(L1_OPEN20, "").replace(/\s*(?:Thanks!?|Thank you!?)$/i, "");
  if (!t) return null;
  if (!/^(?:I|I'm|I'll|I've|I'd|[A-Z]{2,}|[A-Z][a-z]+(?:'s)?)\b/.test(t) || /^(?:The|This|That|Our|My|We|There|It|Every|Half|Only)\b/.test(t)) t = t[0].toLowerCase() + t.slice(1);
  let w = 0; const topics = [];
  for (const [re, f, topic, weight] of LEX) {
    const m = t.match(re);
    if (!m) continue;
    t = t.slice(0, m.index) + f(m) + t.slice(m.index + m[0].length);
    w += weight; topics.push(topic);
  }
  if (w < 2) return null;
  t = cap(t.replace(/\s+([.,!?])/g, "$1").replace(/\.\./g, ".").trim());
  if (!/[.!?]$/.test(t)) t += ".";
  t = t.replace(/(?<!\b(?:nothing|all|anything|not only|everything))([a-z]) but (?!also\b)/, "$1, but ").replace(/([a-z]{3,}) so (I|we|I'll|I'm|we're|we'll|our|my|the)\b/, "$1, so $2").replace(/(\bclient [^,.]{3,60}), wants\b/, "$1, and wants").replace(/ (so|because) if I\b/, ", $1 if I").replace(/\b(sabbatical|window|exit|stoppage|reflection|soundscape that) so /, (m0, a) => (/that$/.test(a) ? `${a} ` : `${a}, so `)).replace(/(soundscape that) that\b/, "$1").replace(/\bin (?:the )?(\w+) keeps\b/, "in the $1 keeps");
  const isQ = /\?$/.test(t);
  const isNo = /\b(?:can't(?! (?:think|hear|focus|sleep|find|believe|wait|see|tell|concentrate|log in|access|stand|get))|cannot(?! (?:think|hear|focus|find|see|log in|access|concentrate|backfill))|won't|not doing|no to|not comfortable|say no|not going to|not reopening|not refunding|nope|unable|not adding|rather not|prefer not|prefer to not|not available)\b|^no\b/i.test(src) && !isQ;
  const topic = isNo ? "no" : isQ && !topics.includes("money") && !topics.includes("tech") ? "ask" : topics.find((x) => x !== "win" || !/\b(?:behind|late|lost|down|short|cut|missed|worse|worst|but)\b/i.test(src)) ?? "process";
  const pool = CLOSE20[topic] ?? CLOSE20.process;
  const words = new Set((t.toLowerCase().match(/[a-z]{5,}/g) ?? []).filter((x) => !/^(?:strategic\w*|their|there|about|which)$/.test(x)));
  const start = hash(src) % pool.length;
  let closer = pool[start];
  for (let k = 0; k < pool.length; k++) { const c = pool[(start + k) % pool.length]; if (!(c.toLowerCase().match(/[a-z]{5,}/g) ?? []).some((x) => words.has(x))) { closer = c; break; } }
  return `${t} ${closer}`;
}

// Shapes that came out ungrammatical at every level in fresh55/fresh56.
export function preclean20(raw) {
  let t = String(raw ?? "");
  if (/\n/.test(t) || t.length > 220) return t;
  // "slides 80% done" -> "The slides are 80% done."
  t = t.replace(/^((?![\w -]*\b(?:is|are|was|were|about|almost|nearly|roughly|around|only|maybe)\b)[\w -]{2,25}?) (\d{1,3}%) (done|complete|finished|there)[.!]*$/i, (_m, x, p, d) => `The ${x.toLowerCase()} ${pl(x.trim().split(" ").pop()) ? "are" : "is"} ${p} ${d}.`);
  // "call notes in the doc, action items at the bottom" is a note, not an order to "call".
  t = t.replace(/^call notes (?:are )?in the (doc|document|folder|thread|drive)\b,?\s*(?:and )?action items (?:are )?at the bottom[.!]*$/i, (_m, d) => `The call notes are in the ${d}, and the action items are at the bottom.`);
  // "or do I need a ticket?" kept as a question, not "do I could use".
  t = t.replace(/,? or do I need (a|an|the) ([\w -]{2,20}?)\?/i, (_m, a, x) => `, or is ${a} ${x} required?`);
  // "wow, love being told about X" sarcasm -> plain frustration.
  t = t.replace(/^(?:wow|oh|great|amazing|cool|wonderful)[,!]?\s+(?:I )?love being (told|informed|asked|added|invited|scheduled) (.+?)[.!]*$/i, (_m, v, x) => `I'm not thrilled about being ${v} ${x}.`);
  // "love how we X" sarcasm -> "I'm not thrilled that we X"
  t = t.replace(/^(?:I )?love how (we|they|the company|leadership|management|our company) (.+?)[.!]*$/i, (m0, s, x) => (/\b(?:pizza party|instead of|rather than|again|another|right before|the day|same day|without|nobody|no one|still|ran long|cancel\w*|cut\w*|with a)\b/i.test(x) ? `I'm frustrated that ${s} ${x}.` : m0));
  // "oh good/great/fantastic/perfect timing, <bad thing>" sarcasm -> "Unfortunately, <bad thing>"
  t = t.replace(/^(?:oh )?(?:wonderful|fantastic|perfect timing|great|amazing|oh good|nice|super|yay|cool cool|cool)[,!]+\s+(?=(?:the|our|my|we|they)\b)/i, "Unfortunately, ");
  // "amazing how the budget appears right before X" -> "I've noticed that the budget appears right before X."
  // "nothing like finding out about X from Y" -> plain
  t = t.replace(/^nothing like finding out about (.+?) from (.+?)[.!]*$/i, (_m, x, y) => `I wasn't thrilled to find out about ${x} from ${y}.`);
  // "total asshole move" -> was cleaned to "total unfair move"
  t = t.replace(/,\s*(?:a |what a |total |such an? )?(?:asshole|dick|jerk|douche|prick) move\b/gi, ", which was really unprofessional");
  // "jerking (us )?around" -> "going back and forth"
  t = t.replace(/\bstop jerking (?:us )?around\b/gi, "stop going back and forth").replace(/\bjerking (?:us )?around\b/gi, "going back and forth");
  // "dumping his crap work on me" -> "dumping his work on me"
  t = t.replace(/\b(his|her|their|your|my) (?:crap|crappy|shit|shitty|garbage|bullshit) (work|tasks|tickets|projects)\b/gi, "$1 $2");
  // "the offer goes out tomorrow" fragment after a comma
  t = t.replace(/,\s*offer goes out (today|tomorrow|on \w+|\w+day)\b/i, (_m, d) => `, and the offer goes out ${d}`);
  // "for my kid's dentist appointment" kept intact (was split into "for my kid's for a dentist appointment")
  t = t.replace(/\bheads up,? I need to leave at (\d{1,2}(?::\d\d)?(?: ?[ap]m)?) today for my (kid|son|daughter)'s (dentist|doctor|orthodontist|school) appointment\b/i, (_m, h, k, a) => `I need to leave at ${h} today to take my ${k} to a ${a} appointment`);
  return t;
}

export function fix20(text) {
  let t = String(text ?? "");
  t = t.replace(/\ba (urgent|important|unplanned|unscheduled|early|internal|external|open|update|offline|annual|hourly|optional|eight|11|18|80)\b/gi, (m, w) => `${m[0] === "A" ? "An" : "an"} ${w}`);
  t = t.replace(/\bfor my (kid|son|daughter)'s for an? /gi, "for my $1's ");
  t = t.replace(/\bdo I could use\b/g, "will I need").replace(/\bdo I'd like\b/g, "will I need");
  t = t.replace(/\bI'm seeking a thought partner who could from (\w+) join\b/g, "I'm seeking a thought partner from $1 who could join");
  t = t.replace(/\bhis things work\b/g, "his work").replace(/\btotal unfair move\b/g, "which was really unprofessional");
  return t;
}

// Time-off reasons fresh56 showed without a joke. Appended to round 19's list, which timeOff3 (round18.js) applies.
REASONS19.push(
  [/\bmy car's (?:getting fixed|in the shop|being repaired)\b/i, "my personal mobility asset is in for scheduled maintenance"],
  [/\bmy (water heater|furnace|dishwasher|washing machine|fridge|AC) (?:exploded|broke|died|flooded the [\w ]+|stopped working)\b/i, (m) => `my ${m.match(/water heater|furnace|dishwasher|washing machine|fridge|AC/i)[0]} has executed an unplanned exit`],
  [/\bfor the holidays\b/i, "for the holidays, my annual end-of-year recharge cycle"],
  [/\bto watch my (?:kid|son|daughter|child)'s (?:soccer|baseball|basketball|hockey|football|softball|volleyball)? ?(?:final|game|match|tournament)\b/i, (m) => `${m}, where a key family stakeholder is competing`],
  [/\b(?:to )?wait for the (internet|cable|cable guy|internet guy|plumber|electrician|repair|delivery)(?: guy)? all day\b/i, (m) => `${m.replace(/ all day$/i, "")} all day, a critical home-infrastructure vendor engagement`],
  [/\bgoing to (Japan|Mexico|Italy|France|Spain|Portugal|Greece|Iceland|Hawaii|Europe|Asia|[A-Z][a-z]+)\b(?! for)/, (m) => `${m}, an international offsite of one`],
);
