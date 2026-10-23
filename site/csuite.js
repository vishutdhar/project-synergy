// Full C-Suite composer (see shortfalls/max-corporate.md).
// Shape: [strategic frame] + [the user's point, nominalized and buzzworded] + [a closer that fits the intent].
// The point comes from the Mild rewrite, which already keeps every no, number, name, date and question.
// Frames and closers carry tone only: no new people, numbers, dates, meetings or promises.

const pick = (rng, xs) => xs[Math.floor(rng() * xs.length)];
let srcWords = new Set();
const FUNCTION_START = /^(?:The|A|An|This|That|These|Those|My|Our|Your|Their|We|We're|We've|We'll|They|They're|He|She|It|It's|There|There's|Here's|Nothing|Nobody|Everyone|Someone|Anyone|Unfortunately|Could|Would|Can|Will|Is|Are|Do|Does|Did|What|What's|Who|Who's|When|Where|Why|How|Which|Whose|Please|Thank|Thanks|Great|Huge|Sorry|Apologies|Not|No|Yes|Hard|Sounds|Understood|You|You're|Today|Tomorrow|Happy|Outstanding|Congratulations|Lunch|Payroll|Traffic|Just|So|Very|Let's|Let|Here|If|To|Is|In|On|At|For|By|With|Some|All|Any|Every|Each|Both|Over|Under|After|Before|Server|Printer|Invoice|Closed|New)$/;
const lowerFirst = (s) => {
  const w = (s.match(/^[A-Za-z][\w'-]*/) ?? [""])[0];
  if (!w || /^I(?:'|$)/.test(w) || /^[A-Z0-9]{2,}$/.test(w) || /^[a-z]/.test(w)) return s;
  if (FUNCTION_START.test(w) || srcWords.has(w.toLowerCase())) return w.toLowerCase() + s.slice(w.length);
  return s;
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Mild frames that the composer replaces with its own.
const MILD_FRAMES = /^(?:Just to let you know,|Just so you know,|It looks like|I'm happy to share that|Just to check,|Unfortunately,|I wanted to let you know that|For visibility:)\s*/;
const L2_LABEL = /^(?:Quick (?:heads-up|question|ask|flag|win|update)|Heads-up|Kudos|For visibility|My two cents|Status update|Blocker|Huge win|Proposal|My recommendation|Some candid feedback|Candidly|Quick heads-up, [a-z]+):\s*/;

// Phrase upgrades. Each one keeps its grammatical slot (verb phrase for verb phrase, noun for noun).
const UPGRADES = [
  [/\b(is|are) down\b/g, (_m, v) => `${v} experiencing ${v === "is" ? "an availability headwind" : "availability headwinds"}`],
  [/\b(is|are) (?:broken|not working)\b/g, (_m, v) => `${v} experiencing ${v === "is" ? "a reliability headwind" : "reliability headwinds"}`],
  [/\b(is|are) (?:slow|loading slowly|really slow)\b/g, (_m, v) => `${v} experiencing latency headwinds`],
  [/\bis too slow to\b/g, "lacks the velocity to"],
  [/\b(?:got|was|has been) cut by\b/g, "has been strategically right-sized by"],
  [/\b(?:got|was|has been) cut\b/g, "has been strategically right-sized"],
  [/\b(?:got|was|has been) moved to\b/g, "has been strategically realigned to"],
  [/\b(?:failed)(?= (?:last night|again|overnight|today|this morning|yesterday)|[.!]|$)/g, "did not land as planned"],
  [/\bwent (?:really )?(?:great|well)\b/g, "landed incredibly well"],
  [/\b(the [a-z]+(?: [a-z]+)?) finished(?= overnight| today| yesterday| last night| this morning|[.!]|$)/gi, "$1 landed successfully"],
  [/\bis (?:loading|running) slow(?:ly)?\b/g, "is experiencing latency headwinds"],
  [/\b(?:is |was )?a waste of (?:our |my )?time\b/g, (m) => `${/^is|^was/.test(m) ? m.split(" ")[0] + " " : ""}not the highest-leverage use of our time`],
  [/\bis impossible\b/g, "is not realistic"],
  [/\bwe already tried that\b/gi, (m) => (m[0] === "W" ? "We" : "we") + " have already explored that path"],
  [/\bneeds more work\b/g, "has meaningful runway for further iteration"],
  [/\bis due\b/g, "is due to land"],
  [/\bthe customer\b/g, "the customer"],
  [/\bwants a discount\b/g, "is seeking a pricing realignment"],
  [/\bwe hit\b/gi, "we have achieved"],
  [/\bcatch-ups\b/g, "alignment sessions"],
  [/\bcatch-up\b/g, "alignment session"],
  [/\b(?:back to back|back-to-back) (?:meetings|catch-ups|alignment sessions)\b/g, "back-to-back alignment sessions"],
  [/(?<!alignment |-)\bmeetings\b/g, "alignment sessions"],
  [/(?<!alignment |-)\bmeeting\b(?! room| rooms)/g, "alignment session"],
  [/\b(?:problems|issues)\b/g, "headwinds"],
  [/\b(?:a problem|an issue)\b/g, "a headwind"],
  [/\bI think\b/g, "I believe"],
  [/\bI don't think\b/g, "I don't believe"],
  [/\bI disagree with\b/g, "I'm not yet aligned with"],
  [/\bI don't agree with\b/g, "I'm not yet aligned with"],
  [/\bthe plan\b/g, "the roadmap"],
  [/\b(we|I|to|let's|Let's) use\b/g, "$1 leverage"],
  [/\b(?:talk about|discuss)\b/g, "drive alignment on"],
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
  [/\bbusy\b/g, "at capacity"],
  [/\b(?:a good|the best) use of (?:our|my|your) time\b/g, (m) => m.replace(/a good|the best/, "the highest-leverage")],
  [/\bGreat (?:work|job)\b/g, "Outstanding impact"],
  [/\bNice (?:work|job)\b/g, "Outstanding execution"],
  [/\bis leaving\b/g, "is embarking on a new chapter"],
  [/\bI've decided to resign\b/g, "I've decided to embark on my next chapter"],
  [/\bgoals\b/g, "strategic objectives"],
  [/\bideas\b/g, "strategic proposals"],
  [/\bcustomer(s)? (?:says?|reports?)\b/g, "customer$1 surfaced"],
  [/\bdeadline\b(?! is)/g, "delivery deadline"],
];

export function upgrade(text) {
  let t = text;
  for (const [re, rep] of UPGRADES) t = t.replace(re, rep);
  return t.replace(/\bdelivery delivery\b/g, "delivery").replace(/\balignment alignment\b/g, "alignment");
}

const NEG = /\b(?:not|no|never|nothing|nobody|can't|won't|don't|didn't|isn't|aren't|wasn't|unable|unfortunately)\b|n't\b/i;
const PROBLEM = /\b(?:down|broken|broke|fail\w*|late|behind|slow|stuck|wrong|error\w*|bug\w*|blocked|blocker|cut|over budget|short|lost|missed|jammed|outage|crash\w*|concern\w*|not thrilled|not ideal|not happy|not looking forward|frustrat\w*|exhausted|burnt out|burned out|headwind\w*|risk\w*|flaky|out of date|smells|ghost\w*|rejected|unread|double[- ]booked|thin|expired|dropping|red|impossible|unrealistic|annoyed|difficult|waste|too long|too busy|too much|out of service|sick|over our|right-sized|rough shape|freeze|stuck|ghosted|nobody|no one|keeps? dropping|can't log in|locked out|upset|mad|angry|confus\w*|mess\w*|worse|declin\w*|dropped|doubled|garbage|halt\w*|delay\w*|stopped responding|gone quiet|no budget|no designer|nothing (?:got|was))\b/i;
const WIN = /\b(?:closed (?:the|a|an|our) [\w-]+ (?:deal|round|sale|contract)|closed the [\w-]+ deal|shipped|launched|landed|achieved|reached|hit|record|signed|won|went (?:great|well|really well)|loved|finished|done|fixed|saved|passed|approved|resolved|milestone|congrat\w*|promotion|anniversary|kudos|great work|great job|outstanding|excellent|game changer|awesome|lifesaver|shoutout|shout-out|thank)\b/i;
const PERSONAL = /^(?:I'm|I am|I'll|I will|I've|I have|I was|My)\b.*\b(?:late|behind|sick|PTO|out|off|leaving|back|working remotely|working from home|on my way|dentist|doctor|appointment|free|booked|available|burnt out|exhausted|break|online)\b/i;

export function intentOf(clean, core) {
  const c = clean.trim();
  if (/^(?:sorry|apologies|my bad|oops|so sorry|my apologies)\b/i.test(c) || /^(?:Sorry|Apologies|Very sorry|So sorry)\b/.test(core)) return "apology";
  if (/^(?:can|could|would|will) (?:you|someone|anyone|somebody|we|I get)\b/i.test(c) && !/^can I\b/i.test(c) || /^(?:Could|Would|Can) (?:you|someone|I get|we)\b/.test(core) || /^Please\b/.test(core)) return "request";
  if (/\?\s*$/.test(c) || /\?$/.test(core) && /^(?:Who|What|When|Where|Why|How|Which|Is|Are|Does|Do|Did|Can I|Has|Have|Could you let me know|Could you help me understand)\b/.test(core)) return "question";
  if (/^(?:I'm concerned|I'm not thrilled|I'm not looking forward|I'm not happy|That's not ideal|The timing isn't ideal|Unfortunately|I have \d+)\b/.test(core)) return "problem";
  if (/^(?:no|nope|not interested|hard pass|not this)\b/i.test(c) || /^(?:I|we)(?:'m| am|'re| are)? (?:not|can't|won't|cannot|will not)\b/i.test(c) && !/\b(?:not sure|no idea)\b/i.test(c) || /^(?:I'll have to pass|I won't|We won't|We can't|I can't|We're not|I'm not)\b/.test(core)) return "decline";
  if (/^(?:You|Your)\b/.test(core) && !/\?/.test(core) && !WIN.test(core)) return "feedback";
  if (/^I've noticed\b/.test(core)) return "feedback";
  if (PERSONAL.test(core) || /^My (?:kid|son|daughter|child)\b/.test(core)) return "personal";
  if (/^(?:I believe|I think|I don't (?:think|believe|agree)|I disagree|I'd prefer|I prefer|I'd rather|I'd suggest|I see|I'm not (?:yet )?aligned)\b/.test(core) || /\bshould\b/.test(core) && !NEG.test(core)) return "opinion";
  if (/^(?:Great|Outstanding|Huge|Thank|Thanks|Congrat|Happy|Nice|Kudos|Shoutout|A big thank|Well done)/i.test(core) || /^[A-Z][a-z]+(?:'s [a-z]+)? (?:saved|crushed|nailed|rocked|is a game changer|is a lifesaver)\b/.test(core) || /\b(?:is|are|looks|was) (?:awesome|excellent|great|amazing|fantastic|truly best-in-class|really good|really clear)\b/.test(core) && !NEG.test(core)) return "praise";
  if (PROBLEM.test(core) || NEG.test(core)) return "problem";
  if (WIN.test(core)) return "win";
  return "status";
}

const FRAMES = {
  problem: [
    (s) => `In the spirit of radical transparency, I want to surface that ${lowerFirst(s)}`,
    (s) => `Surfacing a key learning from our journey: ${lowerFirst(s)}`,
    (s) => `Zooming out to the 30,000-foot view, ${lowerFirst(s)}`,
    (s) => `As we navigate a dynamic landscape, I want to flag that ${lowerFirst(s)}`,
  ],
  win: [
    (s) => `Humbled and thrilled to share that ${lowerFirst(s)}`,
    (s) => `Excited to share a key win for the ecosystem: ${lowerFirst(s)}`,
    (s) => `Taking a moment to celebrate a north-star win: ${lowerFirst(s)}`,
  ],
  praise: [
    (s) => `Taking a beat to recognize exceptional impact: ${lowerFirst(s)}`,
    (s) => `In the spirit of a recognition-first culture: ${lowerFirst(s)}`,
    (s) => `Calling out best-in-class execution: ${lowerFirst(s)}`,
  ],
  request: [
    (s) => s,
  ],
  question: [
    (s) => `Seeking clarity on a key alignment point: ${lowerFirst(s)}`,
    (s) => `To drive alignment across the ecosystem, a quick question: ${lowerFirst(s)}`,
    (s) => `Double-clicking on this for strategic clarity: ${lowerFirst(s)}`,
  ],
  decline: [
    (s) => `After careful consideration and with our north star in mind, ${lowerFirst(s)}`,
    (s) => `In the spirit of radical candor and strategic focus, ${lowerFirst(s)}`,
    (s) => `Having pressure-tested this against our core priorities, ${lowerFirst(s)}`,
  ],
  apology: [
    (s) => `In the spirit of radical accountability, I want to own this. ${cap(s)}`,
    (s) => `Leaning into ownership and transparency: ${lowerFirst(s)}`,
  ],
  opinion: [
    (s) => `From a strategic lens, ${lowerFirst(s)}`,
    (s) => `Zooming out to the 30,000-foot view, ${lowerFirst(s)}`,
    (s) => `In the spirit of healthy debate and diversity of thought, ${lowerFirst(s)}`,
  ],
  personal: [
    (s) => `For full visibility and alignment, ${lowerFirst(s)}`,
    (s) => `In the spirit of radical transparency, ${lowerFirst(s)}`,
  ],
  feedback: [
    (s) => `In the spirit of radical candor and growth, I want to surface an observation: ${lowerFirst(s)}`,
    (s) => `Leaning into a feedback-rich culture, one development opportunity: ${lowerFirst(s)}`,
  ],
  status: [
    (s) => `For full visibility across the ecosystem, ${lowerFirst(s)}`,
    (s) => `Quick strategic download to drive alignment: ${lowerFirst(s)}`,
    (s) => `In the spirit of radical transparency, ${lowerFirst(s)}`,
  ],
};

const CLOSERS = {
  problem: ["We remain laser-focused on the path forward.", "Every headwind is a learning opportunity on this journey.", "We remain committed to operational excellence as we navigate this.", "Resilience is our north star."],
  win: ["This is what value creation looks like.", "This is the flywheel in action.", "Let's keep this momentum going.", "Onward and upward."],
  praise: ["This is what excellence looks like.", "This is exactly the kind of impact that defines us.", "This is what a high-performing culture looks like."],
  request: ["Grateful for your partnership on this.", "Appreciate you leaning in on this.", "Thanks for driving value with me on this."],
  question: ["Keen to hear your perspective.", "Grateful for any clarity here.", "Appreciate your thought partnership."],
  decline: ["Protecting our focus is how we win.", "Focus is a strategic choice.", "Grateful for your understanding."],
  apology: ["Owning this is part of the journey.", "Grateful for your patience and grace.", "Continuous improvement is our north star."],
  opinion: ["Healthy debate is how we win.", "Diversity of thought is our competitive advantage.", "Keen to align on the path forward."],
  personal: ["Grateful for your patience.", "Sustainable performance is how we win.", "Wellbeing is our north star."],
  feedback: ["Growth is a journey we're on together.", "Psychological safety and high standards go hand in hand.", "Feedback is a gift."],
  status: ["Let's keep the momentum going.", "Clarity is our north star.", "Onward."],
};

// "Could you send me the deck before 3?" -> "If you could go ahead and send me the deck before 3, that would be greatly appreciated."
function lumbergh(core, keepQuestion) {
  const m = core.match(/^(?:Could|Would|Can) you (?:please )?(.+?)\?$/);
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
export function composeCSuite({ clean, mild, middle, rng }) {
  // Words the writer typed in lower case may be lowered after a frame; names they capitalized stay.
  srcWords = new Set((clean.match(/(?<![\w'])[a-z][\w'-]*/g) ?? []));
  if (!mild || !/[A-Za-z]/.test(mild)) return null;
  const isList = /\n/.test(mild);
  const sents = mild.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let first = sents[0].replace(MILD_FRAMES, "");
  first = cap(first);
  let core = [first, ...sents.slice(1)].join(" ");
  const intent = isList ? "list" : intentOf(clean, core);
  if (isList) {
    const lines = mild.split("\n");
    const head = lines[0].replace(/:$/, "");
    const body = lines.slice(1).join("\n");
    const hasHead = !/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s/.test(lines[0]);
    const lead = pick(rng, ["To drive alignment on our key deliverables", "In the spirit of radical transparency and focus", "Zooming out to the strategic big picture"]);
    const out = hasHead ? `${lead}, ${lowerFirst(head)}:\n${body}` : `${lead}:\n${mild}`;
    return `${out}\n\n${pick(rng, ["Focus is how we win.", "Let's keep the momentum going.", "Grateful for your partnership on this."])}`;
  }
  // Questions keep the direct question from Middle Manager ("Who owns this?").
  if (intent === "question" && middle) {
    const m = middle.replace(L2_LABEL, "");
    if (/\?$/.test(m) && !/\n/.test(m)) core = cap(m);
  }
  const keepQ = /\?/.test(clean);
  if (intent === "request") core = lumbergh(core, keepQ);
  core = upgrade(core);
  // Short one-word answers ("Sounds good.") read as a strategic stance.
  const frame = pick(rng, FRAMES[intent] ?? FRAMES.status);
  const parts = core.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let head = frame(parts[0]);
  let text = [head, ...parts.slice(1)].join(" ");
  if (!/[.!?]$/.test(text)) text += ".";
  const closers = (CLOSERS[intent] ?? CLOSERS.status).filter((c) => !c.toLowerCase().split(/\W+/).some((w) => w.length > 4 && text.toLowerCase().includes(w)));
  if (closers.length) text += " " + pick(rng, closers);
  return text.replace(/\s{2,}/g, " ").replace(/\.\./g, ".").replace(/!\./g, "!");
}
