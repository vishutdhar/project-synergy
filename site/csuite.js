import { isKnownName } from "./prepass.js";
import { topicOf, groupOf, inflate, topicFrame, topicCloser, topicClosers, setSource } from "./composer.js";
// Full C-Suite composer (see shortfalls/max-corporate.md).
// Shape: [strategic frame] + [the user's point, nominalized and buzzworded] + [a closer that fits the intent].
// The point comes from the Mild rewrite, which already keeps every no, number, name, date and question.
// Frames and closers carry tone only: no new people, numbers, dates, meetings or promises.

const STOP = new Set(["looks", "there", "about", "which", "would", "could", "their", "thing", "thanks", "going"]);
const pick = (rng, xs) => xs[Math.floor(rng() * xs.length)];
let srcWords = new Set();
const FUNCTION_START = /^(?:Lunch|Dinner|Breakfast|Pastries|Pizza|Cake|Bagels|Donuts|Snacks|Payroll|Hotfix|Retro|Interview|Deck|Board|Client|Shipped|Merged|Reviewing|Pushed|Fixed|Sent|Starting|Going|Heading|Moving|Working|Taking|Leaving|Out|Off|At|On|In|The|A|An|This|That|These|Those|My|Our|Your|Their|We|We're|We've|We'll|They|They're|He|She|It|It's|There|There's|Here's|Nothing|Nobody|Everyone|Someone|Anyone|Unfortunately|Could|Would|Can|Will|Is|Are|Do|Does|Did|What|What's|Who|Who's|When|Where|Why|How|Which|Whose|Please|Thank|Thanks|Great|Huge|Sorry|Apologies|Not|No|Yes|Hard|Sounds|Understood|You|You're|Today|Tomorrow|Happy|Outstanding|Congratulations|Lunch|Payroll|Traffic|Just|So|Very|Let's|Let|Here|If|To|Is|In|On|At|For|By|With|Some|All|Any|Every|Each|Both|Over|Under|After|Before|Server|Printer|Invoice|Closed|New|Deploy|Release|Launch|Demo|Coffee|Quick|Still|Done|Free|Snacks|Urgent|Back|Offline|Heads|Huddle|Running|Out|Off|Half|Pizza|Bagels|Donuts|Cake|Standup|Meeting|Almost|Working|Waiting|Blocked|Stuck|Need|Welcome|Congrats|Nice|Also|Going|Heading|Taking|Starting|Off|Fixed|Sent|Pushed|Shipped|Finished|Merged|Approved|Signed|Booked|Moved|Running|Grabbing|Ok|Okay|Got|Sure|Yep|Yeah|Nope|Maybe|Probably|Honestly|Frankly|Btw|Fyi|Ugh|Wow|Oh|Hey|Hi|Hello|Morning|Afternoon|Evening|Tonight|Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday|Next|Last|One|Two|Three|Big|Small|Kudos|Shoutout|Love|Hate|Agreed|Agree|Disagree|Feels|Seems|Looks|Same|Ditto|Again|Lol|Haha|Status|Update|Reminder|Note|Heads-up|Blocker|Question|Ask|Request|FYI)$/;
let capsKeep = new Set();
const lowerFirst = (s) => {
  const w = (s.match(/^[A-Za-z][\w'-]*/) ?? [""])[0];
  if (!w || /^I(?:'|$)/.test(w) || /^[A-Z0-9]{2,}$/.test(w) || /^[a-z]/.test(w)) return s;
  // Names the writer capitalized stay capitalized; anything else is a sentence start and gets lowered.
  const base = w.replace(/'s$/, "");
  if ((capsKeep.has(base) || isKnownName(base)) && !FUNCTION_START.test(base)) return s;
  return w.toLowerCase() + s.slice(w.length);
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Mild frames that the composer replaces with its own.
const MILD_FRAMES = /^(?:Just to let you know,|Just so you know,|It looks like|I'm happy to share that|Just to check,|Unfortunately,|I wanted to let you know that|For visibility:)\s*/;
const L2_LABEL = /^(?:Quick (?:heads-up|question|ask|flag|win|update)|Heads-up|Kudos|For visibility|My two cents|Status update|Blocker|Huge win|Proposal|My recommendation|Some candid feedback|Candidly|Quick heads-up, [a-z]+):\s*/;

// Phrase upgrades. Each one keeps its grammatical slot (verb phrase for verb phrase, noun for noun).
const UPGRADES = [
  [/\b(sales|revenue|signups|bookings|traffic|conversion|margins?|numbers) (?:are|is) down (\d+(?:\.\d+)?%)/gi, "$1 have realigned downward by $2"],
  [/(?<!\b(?:churn|latency|costs?|bugs|errors|tickets|crashes|downtime|complaints|incidents|spend|load times?|wait times?|bounce rate)\s)\b(is|are) down\b(?! \d| by| to\b)/g, (_m, v) => `${v} experiencing ${v === "is" ? "an availability headwind" : "availability headwinds"}`],
  [/\b(is|are) (?:broken|not working)\b/g, (_m, v) => `${v} experiencing ${v === "is" ? "a reliability headwind" : "reliability headwinds"}`],
  [/\b(is|are) (?:slow|loading slowly|really slow)\b/g, (_m, v) => `${v} experiencing latency headwinds`],
  [/\bis too slow to\b/g, "lacks the velocity to"],
  [/\b(?:got|was|has been) cut in half\b/g, "has been strategically halved"],
  [/\b(?:got|was|has been) cut by\b/g, "has been strategically right-sized by"],
  [/\b(?:got|was|has been) cut\b/g, "has been strategically right-sized"],
  [/\b(?:got|was|has been) moved to\b/g, "has been strategically realigned to"],
  [/\b(?:failed)(?= (?:last night|again|overnight|today|this morning|yesterday)|[.!]|$)/g, "did not land as planned"],
  [/\bwent really (?:great|well)\b/g, "landed incredibly well"], [/\bwent (?:great|well)\b/g, "landed well"],
  [/\b(the [a-z]+(?: [a-z]+)?) finished(?= overnight| today| yesterday| last night| this morning|[.!]|$)/gi, "$1 landed successfully"],
  [/\bis (?:loading|running) slow(?:ly)?\b/g, "is experiencing latency headwinds"],
  [/\b(?:is |was )?a waste of (?:our |my )?time\b/g, (m) => `${/^is|^was/.test(m) ? m.split(" ")[0] + " " : ""}not the highest-leverage use of our time`],
  [/\bis impossible\b/g, "is not realistic"],
  [/\bwe already tried that\b/gi, (m) => (m[0] === "W" ? "We" : "we") + " have already explored that path"],
  [/\bneeds more work\b/g, "has meaningful runway for further iteration"],
  [/\bis due\b/g, "is due to land"],
  [/\bI'm not sure(?=[.!])/g, "I don't yet have full visibility on this"], [/\bI'm not sure I agree\b/g, "I'm not yet fully aligned"],
  [/\bneeds significant work\b/g, "has substantial runway for improvement"],
  [/\bdiscuss (tomorrow|later|next week|on [A-Z]\w+)\b/g, "drive alignment on this $1"],
  [/\bwent up (\d+%)/g, "increased by $1"],
  [/\bthe customer\b/g, "the customer"],
  [/\bwants a discount\b/g, "is seeking a pricing realignment"],
  [/\bwe hit\b/gi, "we have achieved"],
  [/\bcatch-ups\b/g, "alignment sessions"],
  [/\bcatch-up\b/g, "alignment session"],
  [/\b(?:back to back|back-to-back) (?:meetings|catch-ups|alignment sessions)\b/g, "back-to-back alignment sessions"],
  [/(?<!alignment |-)\bmeetings\b/g, "alignment sessions"],
  [/(?<!alignment |-)\bmeeting\b(?! room| rooms)/g, "alignment session"],
  [/\bproblems\b/g, "headwinds"],
  [/\ba problem\b/g, "a headwind"],
  [/\bI think\b/g, "I believe"],
  [/\bI don't think\b/g, "I don't believe"],
  [/\bI disagree with\b/g, "I'm not yet aligned with"],
  [/\bI don't agree with\b/g, "I'm not yet aligned with"],
  [/\bthe plan\b/g, "the roadmap"],
  [/\b([Ww]e|I|to|[Ll]et's) use\b/g, "$1 leverage"],
  [/\b(?:talk about|discuss)(?= (?:the|this|that|it|my|our|your|a|an)\b)/g, "drive alignment on"],
  [/\bI'm fixing\b/g, "I'm actively remediating"],
  [/\bfix the\b/g, "remediate the"],
  [/\bwe(?:'ll| will)? need (\d+) more (days|weeks|months|people|engineers)\b/gi, (_m, n, u) => `we will require an additional ${n} ${u}${/days|weeks|months/.test(u) ? " of runway" : " of capacity"}`],
  [/\bover budget\b/g, "over our investment envelope"],
  [/\b(?:really|very) (?:good|great)\b/g, "truly best-in-class"],
  [/\b(?:running|about) (\d+ (?:min|mins|minutes)) (?:late|behind)\b/g, "running $1 behind schedule"],
  [/\brunning (?:a bit |a little )?(?:late|behind)\b(?! schedule)/g, "running behind schedule"],
  [/\b(?:out sick|off sick)\b/g, "out navigating a health headwind"],
  [/\bI was sick\b/g, "I was navigating a health headwind"],
  [/\bstuck in traffic\b/g, "navigating a traffic headwind"],
  [/\bTraffic was (?:awful|bad|terrible|a nightmare|rough)\b/g, "Traffic was a significant headwind"],
  [/\bworking from home\b/g, "working remotely"],
  [/\bfolks\b/g, "team members"],
  [/\bI'm (?:really |very |so )?busy\b/g, "I'm at capacity"],
  [/\bI'm quitting\b/g, "I've decided to embark on my next chapter"],
  [/\b(?:is|was) (?:garbage|trash|junk|rubbish)\b/g, (m) => `${m.split(" ")[0]} not yet at the quality bar we hold ourselves to`],
  [/\bmessed up\b/g, "mishandled"],
  [/\b(?:a good|the best) use of (?:our|my|your) time\b/g, (m) => m.replace(/a good|the best/, "the highest-leverage")],
  [/\bGreat (?:work|job)\b/g, "Outstanding impact"],
  [/\bNice (?:work|job)\b/g, "Outstanding execution"],
  [/\bis leaving\b/g, "is embarking on a new chapter"],
  [/\bI've decided to resign\b/g, "I've decided to embark on my next chapter"],
  [/\bgoals\b/g, "strategic objectives"],
  [/\bideas\b/g, "strategic proposals"],
  [/\bdeadline\b(?! is)/g, "delivery deadline"],
  // Round 6: more of the sentence gets the C-Suite treatment, not just the frame. Same slot, same meaning.
  [/\b(nobody|no one) (?:has )?(?:fixed|addressed|resolved) (it|this|that)\b/g, "$1 has remediated $2"],
  [/\b(isn't|aren't|is not|are not) working\b(?! (?:for|with) )/g, (_m, v) => `${/^(?:isn't|is not)$/.test(v) ? "is" : "are"} not performing as designed`],
  [/\bis loading (?:really |very |super |so )?slow(?:ly)?\b/g, "is experiencing latency headwinds"],
  [/\bis (?:far |much |way |really )?too slow to\b/g, "lacks the velocity to"],
  [/\bwe shipped\b/gi, (m) => (m[0] === "W" ? "We" : "we") + " successfully shipped"],
  [/\bI finished\b/g, "I closed out"],
  [/\bis useless\b/g, "is not delivering meaningful value"],
  [/\bget organized\b/g, "tighten up their operational rigor"],
  [/\bthreatening to walk\b/g, "signaling meaningful churn risk"],
  [/\bI'll be right back\b/g, "I'll be stepping away briefly"], [/\b[Bb]e right back\b/g, (m) => (m[0] === "B" ? "Stepping away briefly" : "stepping away briefly")],
  [/\btakes forever\b/g, "carries significant cycle-time headwinds"],
  [/\bran (\d+ (?:minutes|mins|min|hours?)) over\b/g, "exceeded its timebox by $1"],
  [/\bhas gotten worse\b/g, "has been trending in the wrong direction"],
  [/\bis too long\b/g, "would benefit from tightening"],
  [/\bis (?:really |very |so )?confusing\b/g, "lacks clarity"],
  [/\bneeds more data\b/g, "would benefit from a more data-driven foundation"],
  [/\b(tickets|requests|costs|errors|signups|sales|complaints) doubled\b/g, "$1 have increased 2x"],
  [/\bwent up (\d+ (?:points?|percent|basis points))/g, "increased by $1"],
  [/\bwe lost the deal\b/gi, (m) => (m[0] === "W" ? "We" : "we") + " did not close the deal"],
  [/\bwent with a cheaper\b/g, "selected a lower-cost"],
  [/(^|[.!?]\s+)Moving on\./g, "$1We're moving forward."],
  [/\bthe build broke\b/gi, (m) => (m[0] === "T" ? "The" : "the") + " build experienced a failure"],
  [/\bis always full by\b/g, "consistently reaches full capacity by"],
  [/\bis not being straight with us\b/g, "is not being fully transparent with us"],
  [/\bis leading the\b/g, "is spearheading the"],
  [/\bwill take about (\d+ (?:hours?|minutes|days|weeks))\b/g, "has an estimated duration of about $1"],
  [/\b(is|has been) moved to\b/g, (_m, v) => `${v === "is" ? "has been" : v} realigned to`],
  [/\b(?:is|are) (?:annoyed|frustrated)\b(?= and\b)/g, (m) => `${m.split(" ")[0]} experiencing real friction`],
];

// Round 9 satire lexicon: the plain thing, dressed up in the grandest corporate words that still mean it.
const SATIRE = [
  [/\bthe wifi\b(?! password)/gi, "our connectivity infrastructure"], [/\bmy internet died\b/gi, "my connectivity infrastructure experienced an unplanned outage"],
  [/\bI need coffee\b/g, "I need a strategic caffeine intervention"],
  [/\bI took a (?:rest|nap|recharge) at lunch\b/g, "I completed a strategic rest cycle at lunch"],
  [/\bI fell asleep in the call\b/g, "I entered an unplanned low-power mode during the call"],
  [/\bI deleted the\b/g, "I unintentionally sunset the"],
  [/\breinventing the wheel\b/g, "reimagining the wheel from first principles"],
  [/\bthrowing (?:funds|money|budget|cash) at this and nothing is working\b/g, "deploying significant capital against this with no measurable ROI"],
  [/\bgot (\d+) leads\b/g, "generated a highly exclusive $1 leads"], [/\b[Ww]e spent (\$[\d,.]+k?)/g, (m, a) => `${m[0]}e invested ${a}`],
  [/\bbabysitting this project\b/g, "providing round-the-clock stewardship for this initiative"],
  [/\bis eating our lunch\b/g, "is capturing our market share"], [/\bwe're sitting on our hands\b/g, "we're maintaining a strategic holding pattern"],
  [/\bpretend I didn't see that email\b/g, "strategically deprioritize that email"],
  [/\bunread Slack messages\b/g, "unread Slack messages awaiting my thought leadership"],
  [/\bhaven't eaten\b/g, "haven't had a chance to refuel"],
  [/\bthis call is dragging\b/g, "this call has moved past its value curve"],
  [/\bcompletely forgot about\b/g, "completely lost visibility on"], [/\btotally forgot about\b/g, "completely lost visibility on"],
  [/\bI double-booked\b/g, "I accidentally double-committed my calendar"],
  [/\bI snapped at you\b/g, "I communicated with more intensity than intended"],
  [/\b(?:the |this )(delivery deadline|deadline|due date) is unrealistic\b/gi, (m, d) => `${m.split(" ")[0]} ${d} is, respectfully, not anchored in reality`],
  [/\bmakes no sense\b/g, "lacks a coherent through-line"],
  [/\bwill break everything\b/g, "carries enterprise-wide breakage risk"],
  [/\bwe keep changing priorities every week\b/gi, (m) => `${m[0]}e keep pivoting our priorities on a weekly cadence`],
  [/\bis asking for far too much\b/g, "is expanding scope at an impressive velocity"],
  [/\b([Oo])ur standup\b/g, "$1ur daily alignment ritual"], [/\bI'm drowning in (emails|email|work|tickets|meetings|requests|Slack messages)\b/g, "I'm navigating an unprecedented inbound volume of $1"], [/\bsneak out at\b/g, "discreetly transition out of the office at"], [/\b(?:and )?nobody will notice\b/g, "with minimal stakeholder visibility"], [/\bkeeps stealing my ([\w ]+?) from the fridge\b/g, "keeps reallocating my $1 from the shared refrigeration ecosystem without my sign-off"], [/\btake six weeks to buy a mouse\b/g, "require a six-week procurement journey to acquire a single mouse"],
  [/\bI'm hungry\b/g, "I'm running low on fuel"],
  [/\bI have no idea what I'm doing on\b/g, "I'm operating with significant ambiguity on"],
  [/\bwants this yesterday\b/g, "has set a highly aggressive timeline: yesterday"],
  [/\bwhoops, wrong channel\b/gi, "Apologies, this message was deployed to the wrong channel"],
  [/\bfar too much work for one person\b/g, "a workload that would challenge a team of three, scoped for one person"],
];

export function upgrade(text) {
  let t = text;
  for (const [re, rep] of UPGRADES) t = t.replace(re, rep);
  for (const [re, rep] of SATIRE) t = t.replace(re, rep);
  return t.replace(/\bdelivery delivery\b/g, "delivery").replace(/\balignment alignment\b/g, "alignment");
}

const NEG = /\b(?:not|no|never|nothing|nobody|can't|won't|don't|didn't|isn't|aren't|wasn't|unable|unfortunately)\b|n't\b/i;
const PROBLEM = /\b(?:down|broken|broke|fail\w*|late|behind|slow\w*|stuck|wrong|error\w*|bug\w*|blocked|blocker|cut|over budget|short|lost|missed|jammed|outage|crash\w*|concern\w*|not thrilled|not ideal|not happy|not looking forward|frustrat\w*|exhausted|burnt out|burned out|headwind\w*|risk\w*|flaky|out of date|smells|ghost\w*|rejected|unread|double[- ]booked|thin|expired|dropping|red|impossible|unrealistic|annoyed|difficult|waste|too long|too busy|too much|out of service|sick|over our|right-sized|rough shape|freeze|stuck|ghosted|nobody|no one|keeps? dropping|can't log in|locked out|upset|mad|angry|confus\w*|mess\w*|worse|declin\w*|dropped|doubled|garbage|halt\w*|delay\w*|stopped responding|gone quiet|no budget|no designer|nothing (?:got|was)|out again|out of \w+|full|overdue|freez\w*|threaten\w*|longer than|flopp\w*|didn't work|halved|cancel\w*|overspent|rais\w+ prices|swamped|buried|at capacity|disconnect\w*|outdated|out of date|typos?|quit|hassle|nonsense|never repl\w*|pain|not credible|disorganized)\b|\b0 [a-z]+/i;
const WIN = /\b(?:paid|renewed|under budget|ahead of schedule|closed (?:the|a|an|our) (?:deal|round|sale|contract)|closed (?:the|a|an|our) [\w-]+ (?:deal|round|sale|contract)|closed the [\w-]+ (?:deal|renewal)|shipped|launched|landed|achieved|reached|hit|(?<!for the )record(?! straight)|signed|won|went (?:great|well|really well)|loved|finished|done|fixed|saved|passed|approved|resolved|milestone|congrat\w*|promotion|anniversary|kudos|great work|great job|outstanding|excellent|game changer|awesome|lifesaver|shoutout|shout-out|thank)\b/i;
const PERSONAL = /^(?:I'm|I am|I'll|I will|I've|I have|I was|My)\b.*\b(?:going home|heading (?:out|home)|done for (?:today|the day|the week)|logging off|late|behind|sick|PTO|out|(?<!sign )off|leaving|back|working remotely|working from home|on my way|dentist|doctor|appointment|free|booked|available|burnt out|exhausted|break|online)\b/i;

export function intentOf(clean, core) {
  const c = clean.trim();
  core = String(core ?? "").replace(/^In short, /, "");
  // Round 10: "no problem" agrees, and status-of-me lines are personal, not problems.
  if (/^(?:no problem|no worries|np)\b/i.test(c) && !/\?/.test(c)) return "social";
  if (/^(?:looks good to me|LGTM|sounds good|works for me|approved|ship it)\b/i.test(c) && !/\b(?:but|except)\b|\?/.test(c)) return "approve";
  if (/^(?:out of office|OOO|working from home|WFH|I'm working (?:from home|remotely)|offline for|afk|I have to go|be right back|brb|logging off|signing off)\b/i.test(c) && !/\?/.test(c)) return "personal";
  // Grief and illness get a plain, kind frame. No jokes about funerals.
  if (/\b(?:funeral|passed away|bereavement|hospital|hospitali[sz]ed|surgery|emergency room|ER visit|threw up|throwing up|miscarriage|memorial service|lost my (?:mom|dad|mother|father|grandma|grandpa|grandmother|grandfather|brother|sister|wife|husband|partner|son|daughter|dog|cat))\b/i.test(c)) return "sensitive";
  if (/^(?:cheers|thx|ty|many thanks|much appreciated)\b/i.test(c) && !/\?/.test(c)) return "thanks";
  if (/^Thanks, but I'll (?:have to )?pass\b/.test(core)) return "decline";
  if (/^(?:sorry|apologies|my bad|oops|so sorry|my apologies)\b/i.test(c) || /^(?:Sorry|Apologies|Very sorry|So sorry)\b/.test(core)) return "apology";
  if (/^what an? /i.test(c) && !/\?/.test(c)) return PROBLEM.test(core) || /\b(?:rough|bad|awful|terrible|long|tough|challenging|difficult)\b/i.test(core) ? "problem" : "win";
  if (/^have an? (?:good|great|nice|lovely|wonderful|restful) (?:weekend|day|evening|night|holiday|break|one)\b/i.test(c)) return "social";
  if (/^(?:who|who's|whose|what|what's|when|where|why|how|which)\b/i.test(c)) return "question";
  if (/^(?:can|could|would|will) (?:you|someone|anyone|somebody|we|I get)\b/i.test(c) && !/^can I\b/i.test(c) || /^(?:Could|Would|Can) (?:you|someone|I get|we)\b/.test(core) || /^Please\b/.test(core)) return "request";
  if (/\?\s*$/.test(c) || /\?$/.test(core) && /^(?:Who|What|When|Where|Why|How|Which|Is|Are|Does|Do|Did|Can I|Has|Have|Could you let me know|Could you help me understand)\b/.test(core)) return "question";
  // Round 11: cutting a cost is a win, and "no rush" is a kindness, not a problem.
  if (/\b(?:cut|reduced|lowered|trimmed|slashed) (?:our |the )?(?:[\w-]+ )?(?:costs?|spend|spending|latency|churn|load times?|bills?|build times?)\b/i.test(c) && !/\b(?:budget|benefits?|perks?|jobs?|roles?|salar\w+)\b/i.test(c)) return "win";
  if (/\bno rush\b/i.test(c) && !/\?/.test(c)) return "status";
  if (/\b(?:load times?|latency|churn|bugs|errors|tickets|crashes|downtime|complaints|incidents|wait times?|bounce rate|response times?)\b[^.]*\b(?:dropped|fell|decreased|halved|went down|is down|are down|down \d+%)\b/i.test(c) && !/\bbut\b/i.test(c)) return "win";
  // "we hit the deadline but skipped the testing": a win with a catch is a problem update, not a celebration.
  if (/\bbut\b/i.test(c) && PROBLEM.test(c.split(/\bbut\b/i).slice(1).join(" ")) && !/\?/.test(c)) return "problem";
  if (/\bbut\b/i.test(c) && /\b(?:skipped|missed|over budget|blown|struggling|broke|lost|cost(?:s)? more|late)\b/i.test(c.split(/\bbut\b/i).slice(1).join(" ")) && !/\?/.test(c)) return "problem";
  if (/^(?:I'm concerned|I'm not thrilled|I'm not looking forward|I'm not happy|That's not ideal|The timing isn't ideal|Unfortunately|I have \d+)\b/.test(core)) return "problem";
  const DOING = /\b(?:make|do|doing|take|attend|join|help|commit|support|offer|be at|be there|sign|signing|cover|go|come|work|working|approve|approving|give|giving|move|fit|present|presenting|host|hosting|speak|speaking|rewrite|rewriting|hire|hiring|joining|attending|making|taking|coming|going|covering|helping)\b/i;
  if (/^(?:absolutely not|hell no|no way|nope|not happening)\b/i.test(c) || /^(?:that's|that is) a (?:hard |firm |big )?no\b/i.test(c)) return "decline";
  if (/^(?:no|nope|not interested|hard pass|not this)\b/i.test(c) || /^(?:I|we)(?:'m| am|'re| are)? (?:not|can't|won't|cannot|will not)\b/i.test(c) && DOING.test(c) && !/\b(?:not sure|no idea)\b/i.test(c) || /^(?:I'll have to pass|I won't|We won't|We can't|I can't|We're not|I'm not|I'm unable|We're unable)\b/.test(core) && DOING.test(core)) return "decline";
  if (/^(?:Welcome|A warm welcome)\b(?! back)/.test(core)) return "welcome";
  if (/^[A-Z][a-z]+ (?:fixed|caught|solved|rescued|unblocked)\b/.test(core) && !/^(?:The|This|That|We|They|It|There|Our|My|Your|I)\b/.test(core) || /^(?:The|Our) [\w ]*team (?:caught|fixed|solved|shipped)\b/.test(core) || /\b(?:really|so) sharp\b/.test(core)) return "praise";
  if (/^Welcome back\b/.test(core)) return "thanks";
  if (/^(?:Huge )?[Cc]ongratulations on (?:the|your) (?:new baby|wedding|engagement|new home|retirement)\b/.test(core)) return "thanks";
  if (/\b(?:did an? (?:great|fantastic|excellent|outstanding) job|great catch|handled [\w' -]{1,30} (?:really |very |so )?well|(?:really|super|very|so) (?:helpful|useful)|[Ww]elcome (?:to|aboard)|nailed|crushed|killed it|smashed it|knocked it out|saved (?:us|our|the|me|my)|shout-?out|big thank-you)\b/.test(core) && !NEG.test(core)) return "praise";
  if (/^(?:You|Your)\b/.test(core) && /\b(?:is|are|was|were|looks|look) (?:always |consistently |)(?:really |very |so |super |incredibly )?(?:clear|great|good|excellent|amazing|fantastic|awesome|helpful|thoughtful|thorough|detailed|solid|clean|insightful|kind|sharp|fast)\b/.test(core) && !NEG.test(core)) return "praise";
  if (/^(?:You|Your)\b/.test(core) && !/\?/.test(core) && !WIN.test(core)) return "feedback";
  if (/^I(?:'ve)? noticed\b/.test(core)) return "feedback";
  if (/^(?:Okay, thank you|Thank you|Thanks|Noted|Never mind|Please disregard|That makes sense|That sounds|Sounds good|Got it)\b/.test(core) && core.split(/\s+/).length <= 6) return "social";
  if (/\bI'm not sure\b/.test(core)) return "opinion";
  if (PERSONAL.test(core) || /^My (?:kid|son|daughter|child)\b/.test(core)) return "personal";
  if (/^(?:I believe|I think|I don't (?:think|believe|agree)|I disagree|I'd prefer|I prefer|I'd rather|I'd suggest|I see|I'm not (?:yet )?aligned)\b/.test(core) || /\bshould\b/.test(core) && !NEG.test(core)) return "opinion";
  if (/^I (?:really |absolutely )?(?:like|love|appreciate)\b/.test(core) && !NEG.test(core)) return "praise";
  if (/^(?:Great|Outstanding|Huge|Big thanks|Big thank|Really (?:good|great|strong|nice) (?:work|job)|Amazing (?:work|job)|Awesome (?:work|job)|Excellent (?:work|job)|Fantastic (?:work|job)|Thank|Thanks|Congrat|Happy|Nice|Kudos|Shoutout|A big thank|Well done|Good (?:job|work))/i.test(core) || /^[A-Z][a-z]+(?:'s [a-z]+)? (?:saved|crushed|nailed|rocked|is a game changer|is a lifesaver)\b/.test(core) || /\b(?:is|are|looks|was) (?:awesome|excellent|great|amazing|fantastic|truly best-in-class|really good|really clear)\b/.test(core) && !NEG.test(core) || /\b(?:was|is) an? (?:great|fantastic|excellent|amazing|awesome) \w+/.test(core) && !NEG.test(core)) return "praise";
  if (/\b(?:bill|bills|costs?|spend|expenses?|prices?|churn|latency|errors?|complaints?|tickets|bugs|outages?|turnover|rent|fees?|response times?|load times?|wait times?|build times?|downtime|defects?|incidents?|crashes|cost)\b[\w ]{0,20}\b(?:doubled|tripled|quadrupled|went up|increased|spiked)\b/i.test(core)) return "problem";
  if (/\b(?:wrecked|derailed|misleading|crashed|giving up on|broke|is broken|messed up|mishandled)\b/.test(core) && !/\b(?:fixed|resolved)\b/.test(core)) return "problem";
  if (/\b(?:doubled|tripled|quadrupled)\b|\bno (?:issues|errors|problems|downtime|incidents)\b|\bwith zero (?:errors|issues|problems|downtime)\b|\bbeat (?:the |our )?(?:forecast|target|goal|estimate|plan)\b/.test(core) && !/\b(?:not|still|but)\b|n't\b/.test(core)) return "win";
  if (/\b(?:is live|went live|is back up|(?:dropped|down|fell) to (?:zero|0)|\b(?:backlog|bug count|defect count|ticket count|issue count|open bugs|open tickets|churn|latency|error rate|response time|load time|queue)\b[\w ]{0,20}\b(?:is |was )?(?:down|dropped|fell) to \d+)\b/.test(core) && !/\b(?:not|still|again|but)\b|n't\b/.test(core)) return "win";
  if (PROBLEM.test(core) || NEG.test(core)) return "problem";
  if (WIN.test(core)) return "win";
  return "status";
}

const FRAMES = {
  problem: [
    (s) => `In the spirit of radical transparency, I want to surface that ${lowerFirst(s)}`,
    (s) => `Flagging a growth opportunity in real time: ${lowerFirst(s)}`,
    (s) => `Not every chapter is a highlight reel: ${lowerFirst(s)}`,
    (s) => `Leaning into the discomfort here: ${lowerFirst(s)}`,
  ],
  win: [
    (s) => `Humbled and honored to share that ${lowerFirst(s)}`,
    (s) => `I'm not crying, you're crying: ${lowerFirst(s)}`,
    (s) => `Thrilled to announce a milestone moment: ${lowerFirst(s)}`,
  ],
  welcome: [
    (s) => `In the spirit of our people-first culture: ${lowerFirst(s)}`,
    (s) => `Thrilled to grow our ecosystem of talent: ${lowerFirst(s)}`,
  ],
  thanks: [
    (s) => `Leading with gratitude: ${lowerFirst(s)}`,
    (s) => `In the spirit of a gratitude-first culture: ${lowerFirst(s)}`,
  ],
  praise: [
    (s) => `Taking a beat to recognize exceptional impact: ${lowerFirst(s)}`,
    (s) => `In the spirit of a recognition-first culture: ${lowerFirst(s)}`,
    (s) => `Pausing the roadmap to celebrate greatness: ${lowerFirst(s)}`,
  ],
  request: [
    (s) => `To unlock velocity on our shared priorities, a quick ask: ${lowerFirst(s)}`,
    (s) => `In the spirit of cross-functional partnership: ${lowerFirst(s)}`,
  ],
  question: [
    (s) => `Seeking clarity on a key alignment point: ${lowerFirst(s)}`,
    (s) => `Asking for a friend, and for the roadmap: ${lowerFirst(s)}`,
    (s) => `Double-clicking on this for strategic clarity: ${lowerFirst(s)}`,
  ],
  decline: [
    (s) => `After careful consideration and with our north star in mind, ${lowerFirst(s)}`,
    (s) => `In the spirit of radical candor and strategic focus, ${lowerFirst(s)}`,
    (s) => `Having pressure-tested this against our core priorities, ${lowerFirst(s)}`,
  ],
  apology: [
    (s) => `In the spirit of radical accountability, I want to own this. ${cap(s)}`,
    (s) => `Owning my growth journey in public: ${lowerFirst(s)}`,
  ],
  opinion: [
    (s) => `From a strategic lens, ${lowerFirst(s)}`,
    (s) => `Strong opinions, loosely held: ${lowerFirst(s)}`,
    (s) => `In the spirit of healthy debate and diversity of thought, ${lowerFirst(s)}`,
  ],
  sensitive: [
    (s) => `For awareness, ${lowerFirst(s)}`,
    (s) => `For your awareness, ${lowerFirst(s)}`,
    (s) => `Just so everyone is aware, ${lowerFirst(s)}`,
  ],
  personal: [
    (s) => `In the spirit of bringing my whole self to work, ${lowerFirst(s)}`,
    (s) => `Practicing radical transparency about my bandwidth: ${lowerFirst(s)}`,
  ],
  feedback: [
    (s) => `In the spirit of radical candor and growth, I want to surface an observation: ${lowerFirst(s)}`,
    (s) => `Leaning into a feedback-rich culture, one development opportunity: ${lowerFirst(s)}`,
  ],
  approve: [
    (s) => `After rigorous strategic review and deep reflection: ${lowerFirst(s)}`,
    (s) => `Having pressure-tested this against our north star: ${lowerFirst(s)}`,
  ],
  status: [
    (s) => `Circling back on this strategic update, as promised to no one: ${lowerFirst(s)}`,
    (s) => `Cascading this down from the 30,000-foot view: ${lowerFirst(s)}`,
    (s) => `In the spirit of radical transparency, ${lowerFirst(s)}`,
    (s) => `Cascading a mission-critical update to the broader organization: ${lowerFirst(s)}`,
    (s) => `Pursuant to our ongoing commitment to stakeholder over-communication: ${lowerFirst(s)}`,
  ],
};

const CLOSERS = {
  problem: ["Every setback is a setup for a comeback.", "Resilience is a muscle, and we are training it.", "Every problem is an opportunity in disguise.", "We move forward, with humility."],
  win: ["Teamwork makes the dream work.", "This is what happens when vision meets execution.", "The flywheel is spinning.", "Grateful for this incredible team. Onward."],
  praise: ["This is what a high-performing culture looks like.", "Absolute rockstar energy.", "Teamwork makes the dream work."],
  request: ["Grateful for your partnership on this.", "Appreciate you leaning in on this.", "Thanks for driving value with me on this.", "Your partnership is our competitive advantage."],
  question: ["No wrong answers, only learning opportunities.", "Curious to hear the collective wisdom here.", "Grateful for any thought leadership on this."],
  decline: ["Every no is a yes to focus.", "Focus is a strategic choice.", "Grateful for your understanding."],
  apology: ["Failing forward, as always.", "Growth happens outside the comfort zone.", "Grateful for your patience and grace."],
  opinion: ["Iron sharpens iron.", "Healthy debate is how we win.", "Diversity of thought is our competitive advantage."],
  sensitive: ["Thank you for understanding.", "Thank you for your understanding.", "Thanks for understanding."],
  personal: ["Sustainable performance is a long game.", "You can't pour from an empty cup.", "Wellbeing is our north star."],
  feedback: ["Feedback is a gift, and this one comes gift-wrapped.", "Growth is a journey we're on together.", "Feedback is a gift."],
  approve: ["Decisiveness is a leadership competency.", "Velocity is a choice."],
  social: ["Fully aligned.", "Appreciate the alignment.", "Onward."],
  welcome: ["Excited for the journey ahead.", "The future is bright."],
  thanks: ["Deeply grateful for the partnership.", "Gratitude is a core value.", "Appreciate you."],
  status: ["More to come as this journey unfolds.", "No synergies were harmed in the making of this strategic update.", "Please treat this update as a strategic asset.", "This has been a thought leadership moment."],
};

// "Could you send me the deck before 3?" -> "If you could go ahead and send me the deck before 3, that would be greatly appreciated."
function lumbergh(core, keepQuestion) {
  const m = core.match(/^(?:Could|Would|Can) you (?:please )?(.+?)\?$/);
  if (m && /^mind \w/.test(m[1])) return `Would you be open to ${m[1].slice(5)}?`;
  if (m && !keepQuestion) return `If you could go ahead and ${m[1]}, that would be greatly appreciated.`;
  if (m) return `Would you be able to go ahead and ${m[1]}?`;
  const p = core.match(/^Please (don't|do not|stop|avoid) (.+?)[.!]?$/i);
  if (p) return `To protect our collective focus, I'd ask that we ${/^(?:don't|do not)$/i.test(p[1]) ? "not" : p[1].toLowerCase()} ${p[2]} .`;
  const pl = core.match(/^Please (.+?)[.!]?$/);
  if (pl && !keepQuestion) return `If you could go ahead and ${pl[1].replace(/^(?:could you |kindly )/i, "")}, that would be greatly appreciated.`;
  const q = core.match(/^Could I (?:get|have) (.+?)\?$/);
  if (q && !keepQuestion) return `To unlock velocity on our shared priorities, I'd appreciate ${q[1]}.`;
  const w = core.match(/^Could we (.+?)\?$/);
  if (w) return `Is there an opportunity to ${w[1]}?`;
  const s = core.match(/^Could someone (.+?)\?$/);
  if (s) return `I'm seeking a thought partner who could ${s[1]}.${keepQuestion ? " Any takers?" : ""}`;
  return core;
}

/**
 * Compose Full C-Suite from the Mild and Middle Manager rewrites.
 * Returns the text, or null when the input is a list or there is nothing to frame.
 */
export function composeCSuite({ clean, mild, middle, rng, raw = clean }) {
  // Words the writer typed in lower case may be lowered after a frame; names they capitalized stay.
  srcWords = new Set((clean.match(/(?<![\w'])[a-z][\w'-]*/g) ?? []));
  capsKeep = new Set();
  clean.split(/\n/).forEach((line) => line.replace(/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/, "").split(/(?<=[.!?:])\s+/).forEach((sent) => sent.split(/\s+/).forEach((tok, i) => {
    const w = tok.replace(/^[^A-Za-z]+|[^\w'-]+$/g, "").replace(/'s$/, "");
    if (/^[A-Z][a-z]/.test(w) && (i > 0 || !FUNCTION_START.test(w)) && new RegExp(`(?<![A-Za-z])${w}(?![a-z])`).test(raw)) capsKeep.add(w);
  })));
  if (!mild || !/[A-Za-z]/.test(mild)) return null;
  const isList = /\n/.test(mild);
  const sents = mild.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let first = sents[0].replace(MILD_FRAMES, "");
  first = cap(first);
  let core = [first, ...sents.slice(1)].join(" ");
  let intent = isList ? "list" : intentOf(clean, core);
  // Mild already judged it a problem ("Unfortunately, ..."), so no upbeat closer.
  if (/^Unfortunately,/.test(sents[0]) && /^(?:status|win|social)$/.test(intent)) intent = "problem";
  if (/^(?:social|praise|status)$/.test(intent) && (/^(?:Okay, thank you|Thank you|Thanks)\b(?!,? but)/.test(core) || /\b(?:thanks|thank you)(?: all| everyone| team)?[.!]$/i.test(core) && core.split(/\s+/).length <= 8)) intent = "thanks";
  if (isList) {
    const lines = mild.split("\n");
    const head = lines[0].replace(/:$/, "");
    const body = lines.slice(1).join("\n");
    const hasHead = !/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s/.test(lines[0]);
    const lead = pick(rng, ["To drive alignment on our key deliverables", "In the spirit of radical transparency and focus", "Zooming out to the strategic big picture"]);
    const out = hasHead ? `${lead}, ${lowerFirst(head)}:\n${body}` : `${lead}:\n${mild}`;
    const closer = /block|issue|risk|broken|problem|concern|bug/i.test(head) ? ["We remain laser-focused on the path forward.", "Every headwind is a learning opportunity."]
      : /need|ask|request|from you|question/i.test(head) ? ["Grateful for your partnership on this.", "Appreciate you leaning in on this."]
      : /done|complete|shipped|win/i.test(head) ? ["This is what velocity looks like.", "Onward and upward."]
      : ["Focus is how we win.", "Let's keep the momentum going."];
    return `${out}\n\n${pick(rng, closer)}`;
  }
  // A bare greeting gets a grand wish, not a status frame.
  if (/^(?:Good (?:morning|afternoon|evening)|Morning|Hi|Hey|Hello)(?:,? (?:all|everyone|team|folks))?[.!]*$/.test(core)) return `${core.replace(/[.!]*$/, "").replace(/ (all|everyone|team|folks)$/, ", $1")}! Wishing the full stakeholder ecosystem a high-impact, synergy-rich day.`;
  // Questions keep the direct question from Middle Manager ("Who owns this?").
  if (intent === "question" && middle) {
    const m = middle.replace(L2_LABEL, "");
    if (/\?$/.test(m) && !/\n/.test(m)) core = cap(m);
  }
  const keepQ = /\?/.test(clean);
  let framedRequest = false;
  if (intent === "request") {
    const parts0 = core.split(/(?<=[.!?])\s+(?=[A-Z])/);
    const l = lumbergh(parts0[0].replace(/\bplease /, ""), keepQ && /\?/.test(parts0[0]));
    framedRequest = l !== parts0[0].replace(/\bplease /, "");
    core = [framedRequest ? l : parts0[0], ...parts0.slice(1)].join(" ");
  }
  // "Wow, we hit our target" -> the frame already carries the excitement.
  core = core.replace(/^(?:Oh|Ha|Good news),\s+(?=[a-z])/, "");
  // The frame already says "in the spirit of radical transparency", so "Frankly," doesn't stack on it.
  core = core.replace(/^(?:Frankly|Candidly|Honestly|To be honest|Truthfully),\s+(?=[a-z]|I\b|I')/, "");
  core = core[0].toUpperCase() + core.slice(1);
  // A statement followed by a question ("I finished the draft. Could you review it?") is framed as the statement.
  let closerIntent = intent;
  const firstS = core.split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
  if (/^(?:question|request)$/.test(intent) && !/\?$/.test(firstS) && /\?$/.test(core) && !framedRequest) {
    const i2 = intentOf(firstS, firstS);
    intent = /^(?:question|request)$/.test(i2) ? "status" : i2;
    closerIntent = "request";
  }
  core = inflate(upgrade(core));
  // Round 10: frame and closer keyed to topic as well as intent, so the joke fits the message.
  const topic = topicOf(clean);
  setSource(clean);
  const topical = /^(?:problem|win|status|personal|request|question|opinion)$/.test(intent);
  const group = /^Good news: .+ Bad news: /.test(core) ? "bad" : groupOf(intent);
  // Short one-word answers ("Sounds good.") read as a strategic stance.
  const lowCore = core.toLowerCase();
  const framePool = (FRAMES[intent] ?? FRAMES.status).filter((f) => !f("x").toLowerCase().split(/\W+/).some((w) => w.length >= 5 && !STOP.has(w) && lowCore.includes(w)));
  let pool = framePool.length ? framePool : FRAMES[intent] ?? FRAMES.status;
  // "flag that that call was" and "surface that stop messing around" don't parse: drop the "that" frames.
  if (/^(?:That|Those|Stop|Please|Let's|Don't|Quit|Keep|Make|Get|Go|Send|Fix|Check|Ask|Tell)\b/.test(core) && pool.some((f) => !/that x$/.test(f("x")))) pool = pool.filter((f) => !/that x$/.test(f("x")));
  // An exclamation ("Wow, ...") only follows a colon, never "share that".
  if (/^(?:Wow|Whoa),/.test(core)) pool = pool.filter((f) => /: x$/.test(f("x"))).concat([(x) => `Excited to share a key win: ${lowerFirst(x)}`]).slice(0, 3);
  // "Good news: X. Bad news: Y." is a balanced scorecard, not a win.
  const mixed = /^Good news: .+ Bad news: /.test(core);
  if (mixed) pool = [(x) => `Presenting a balanced scorecard, in the spirit of radical transparency. ${x}`];
  let frame = pick(rng, pool);
  const tf = topical && !mixed && !/^(?:Wow|Whoa),/.test(core) ? topicFrame(topic, group, rng) : null;
  if (tf) frame = (x) => tf(lowerFirst(x));
  if (framedRequest) frame = (x) => x;
  const firstWords = core.split(/(?<=[.!?])\s+/)[0].split(/\s+/).length;
  if (intent !== "thanks" && (firstWords <= 2 || /^(?:Okay|OK|Sure|Understood|Noted|Got it|Sounds good|No problem|Never mind|That works for me\.?$)/.test(core))) frame = pick(rng, [(x) => `Net-net: ${lowerFirst(x)}`, (x) => `Bottom line, from a strategic lens: ${lowerFirst(x)}`, (x) => `Level-setting for full alignment: ${lowerFirst(x)}`]);
  // A greeting stays first: "Hi team, <frame> ...".
  let greeting = "";
  const gm = core.match(/^((?:Hi|Hey|Hello|Good morning|Good afternoon)(?: [A-Za-z]+(?: [a-z]+)?)?,)\s+(?=\S)/);
  if (gm) { greeting = gm[1].replace(/ team members,$/, " team,") + " "; core = core.slice(gm[0].length); }
  const parts = core.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let head = greeting + frame(parts[0]);
  // A frame ending in a colon never stacks on a core that has its own ("agenda: here's the agenda:").
  if (/:\s/.test(parts[0]) && /:\s/.test(head.slice(0, head.length - parts[0].length + 2))) head = head.replace(/:\s/, ", ");
  let text = [head, ...parts.slice(1)].join(" ");
  if (!/[.!?]$/.test(text)) text += ".";
  const tc = topical && closerIntent !== "request" ? topicClosers(topic, group) : [];
  const closers = (tc.length ? tc.filter((c) => !c.toLowerCase().split(/\W+/).some((w) => w.length >= 6 && text.toLowerCase().includes(w.slice(0, 6)))) : CLOSERS[closerIntent === "request" ? "request" : intent] ?? CLOSERS.status).filter((c) => !c.toLowerCase().split(/\W+/).some((w) => w.length >= 5 && !STOP.has(w) && text.toLowerCase().includes(w)));
  const fresh = (c) => !c.toLowerCase().split(/\W+/).some((w) => w.length >= 5 && !STOP.has(w) && text.toLowerCase().includes(w.slice(0, 6)));
  if (!closers.length && tc.length) closers.push(...topicClosers("general", group).filter(fresh));
  if (closers.length) text += " " + pick(rng, closers);
  return dejargon(text.replace(/\bthat that\b/g, "that").replace(/\b([a-z]{3,}) \1\b/g, (m, w) => (w === "had" ? m : w)).replace(/\s{2,}/g, " ").replace(/\.\./g, ".").replace(/!\./g, "!"));
}
// Round 11: one buzzword per output. A second "headwind" or "journey" reads as a glitch, not a joke,
// so the later one is swapped for a sibling word with the same grammar.
const JARGON = [
  [/headwinds?/gi, (w) => (/s$/i.test(w) ? "speed bumps" : "speed bump")], [/ecosystem/gi, () => "landscape"], [/journey/gi, () => "marathon"],
  [/alignment/gi, () => "consensus"], [/aligned/gi, () => "in sync"], [/transparency/gi, () => "candor"], [/transparent(?!ly)/gi, () => "candid"],
  [/infrastructure/gi, () => "apparatus"], [/stakeholders?/gi, (w) => (/s$/i.test(w) ? "partners" : "partner")], [/bandwidth/gi, () => "capacity"],
  [/strategic/gi, () => "visionary"], [/radical/gi, () => "bold"], [/excellence/gi, () => "greatness"], [/flywheel/gi, () => "momentum engine"],
];
export function dejargon(text) {
  let t = String(text);
  for (const [re, alt] of JARGON) {
    const hits = [...t.matchAll(new RegExp(`\\b${re.source}\\b`, "gi"))];
    if (hits.length < 2) continue;
    const h = hits[hits.length - 1];
    let rep = alt(h[0]);
    if (/^[A-Z]/.test(h[0])) rep = rep[0].toUpperCase() + rep.slice(1);
    t = t.slice(0, h.index) + rep + t.slice(h.index + h[0].length);
  }
  return t.replace(/\b(a|A) (apparatus|ecosystem|alignment|update|odyssey)\b/g, (m, a, w) => `${a}n ${w}`.replace(/^(a|A)n (apparatus)/, "$1n $2")).replace(/\ba (apparatus)\b/g, "an $1");
}
