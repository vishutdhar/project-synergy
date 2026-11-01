// Round 17 (Oct 31, 2026): general fixes from the fresh49 read-through.
// preclean17 rewrites a few input shapes that later steps garble (a reason clause glued to "off tomorrow",
// a crude insult that loses its noun, a wh-question with no question mark). postfix17 repairs output shapes
// that are never grammatical ("Could anyone would like", "the numbersed change", "network explorer").
// Every rewrite keeps the message's meaning; none adds a fact.

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function preclean17(raw) {
  let t = String(raw ?? "");
  const lone = !/[\n]/.test(t) && t.length < 160;
  // "the printer is being a little bitch again" -> "the printer is acting up again" (the noun used to vanish).
  // A person "being a bitch about the invoice" is being difficult; a printer is acting up.
  t = t.replace(/\bbeing an? (?:little |total |absolute |real )?bitch\b(?! about)(?=[\s,.!]*(?:again|today|lately|this morning)?[.!]*$)/gi, "acting up");
  // "we sat on our asses" -> "we sat on our hands" (the noun used to vanish: "we sat on our.").
  t = t.replace(/\b(sat|sit|sitting|sits) (?:on|around on) (our|my|their|his|her|your) (?:asses|ass|butts?|behinds?|rear ends?)\b/gi, "$1 on $2 hands");
  t = t.replace(/\bscrewing (?:around )?with\b/gi, "messing with");
  // "cut the crap, what's the real timeline" is a blunt ask for a straight answer.
  t = t.replace(/^(?:ok(?:ay)?,? )?cut the (?:crap|bs|bullshit)[,.!]?\s*(what|when|where|who|why|how)\b([^?]*?)[.!]*$/i, (_m, w, r) => `${cap(w.toLowerCase())}${r}? A straight answer would help.`);
  // "pissed that my PTO got denied" has no subject; give it one so frames don't produce "surface that annoyed that".
  t = t.replace(/^(pissed|annoyed|frustrated|bummed|gutted|livid|furious|salty) (that|about|because)\b/i, (_m, a, b) => `I'm ${a.toLowerCase()} ${b.toLowerCase()}`);
  // "my brain is done" is about being tired, not a finished task.
  t = t.replace(/\b(my|our) (brain|brains|head) (?:is|are) (?:done|toast|mush|gone|cooked)\b/gi, (_m, p) => (p.toLowerCase() === "our" ? "we're mentally exhausted" : "I'm mentally exhausted"));
  // "off tomorrow, hungover is not a business strategy": the reason is its own sentence.
  t = t.replace(/^((?:I'm |im |I am )?(?:off|out|ooo) (?:tomorrow|today|this afternoon|monday|tuesday|wednesday|thursday|friday)),\s+([a-z][^,]*?\b(?:is|are|was|isn't|aren't)\b[^,]*)$/i, (_m, a, b) => `${/^(?:I'm|im|I am)\b/i.test(a) ? a.replace(/^im\b/i, "I'm") : `I'm ${a}`}. ${cap(b)}.`);
  // "paternity leave starts november 18": whose leave is clear.
  t = t.replace(/^(paternity|maternity|parental|medical|family) leave (starts|begins|ends)\b/i, (_m, a, b) => `My ${a.toLowerCase()} leave ${b.toLowerCase()}`);
  // "wow, a whole 2% raise, I'm overwhelmed" is sarcasm about a small number.
  t = t.replace(/^(?:wow|oh wow|gee|whoa)[,!]? (?:a|an) whole (\S+) (raise|bonus|increase|day off|dollars?|percent)(?:[,!.]+ ?(?:I'm|im|we're) (?:so )?(?:overwhelmed|speechless|touched|honored|blown away|thrilled|spoiled))?[.!]*$/i, (_m, n, w) => `I only got a ${n} ${w.toLowerCase()}, which is underwhelming.`);
  // Crude or violent idioms that the word filter only half-cleans.
  t = t.replace(/\b(?:pulled|made up|came) (?:straight |right )?out of (?:someone's|somebody's|their|his|her|my|your|thin) (?:ass|butt|backside|behind|rear)\b/gi, "made up out of thin air")
    .replace(/\bshould be (?:shot|fired out of a cannon|strung up|hanged)\b/gi, "has some explaining to do")
    .replace(/\ba (?:steaming|stinking|hot|flaming) pile(?: of (?:garbage|trash|crap|junk|poo))?\b/gi, "a mess")
    .replace(/\bshipped (?:garbage|trash|junk|crap)\b/gi, "shipped poor-quality work");
  // Metric names that start with a verb ("open rate fell") are not requests.
  t = t.replace(/^(open|click|bounce|churn|run|close|win|burn|response|conversion) (rate|rates)\b/i, (_m, a, b) => `The ${a.toLowerCase()} ${b}`);
  // "..., already approved" is a status, not a subject.
  t = t.replace(/,\s*(?:already|all) (approved|booked|signed off|cleared|confirmed)\s*$/i, ", and it's already $1");
  // "ok who took my charger from the conference room" is a question.
  if (lone && !/\?/.test(t)) t = t.replace(/^((?:ok(?:ay)?|so|hey|um|uh|quick q)[,!]?\s+)?((?:who|what|where|when|why|how|which) (?!a lot\b|much I\b|many times\b|I\b|an? \b|a surprise\b|(?:wonderful|nice|great|lovely|fun|cool|exciting|fantastic|convenient|thoughtful|kind|sweet|perfect|typical|delightful|fun)\b|\w+,)[^.!]{3,})[.!]*$/i, (_m, lead, q) => `${q}?`);
  // "quick q, are we still doing the offsite in march" is a yes/no question; the "quick q" is the frame's job.
  if (lone) t = t.replace(/^quick q(?:uestion)?[,:-]?\s+((?:are|is|do|does|did|can|could|will|would|should|have|has|was|were|any) \w[^.!?]{3,}?)[.!?]*$/i, (_m, q) => `${q}?`);
  return t;
}

const VERB_D = { change: "changed", shift: "shifted", drop: "dropped", move: "moved", jump: "jumped", spike: "spiked", fall: "fell", rise: "rose", go: "went", break: "broke", disappear: "disappeared" };
export function postfix17(input, text, lvl) {
  let t = String(text ?? "");
  const src = String(input ?? "");
  t = t.replace(/\b(Could|Can|Will) (anyone|anybody|someone|somebody|you|we) would like\b/g, (_m, _c, w) => `Would ${w} like`)
    .replace(/\bCould (anyone|anybody) want\b/g, "Would $1 like")
    .replace(/\b([a-z]+s)ed (change|shift|drop|move|jump|spike|fall|rise|go|break|disappear)\b/g, (_m, n, v) => `${n} ${VERB_D[v]}`)
    .replace(/\b(?:network|connectivity) explorer\b/gi, "Internet Explorer")
    .replace(/\b(?:initiative|program) (tool|management tool|tracker)\b/g, (m, x) => (/\bproject (?:tool|management tool|tracker)\b/i.test(src) ? `project ${x}` : m))
    .replace(/\b(?:top )?(?:top-)?priority one\b/gi, "priority one").replace(/\btop priority one\b/gi, "priority one")
    .replace(/\bthe aroma of something (died|rotted|crawled)\b/g, "the aroma of something that $1")
    .replace(/\bit's (?:my|your|our) (?:tasks|deliverables)\b/g, (m) => m.replace(/(?:tasks|deliverables)$/, "work"))
    .replace(/\bout of (?:thoughts|initiatives|concepts)\b/g, "out of ideas")
    .replace(/\bto (learn|find out) that about\b/g, "to $1 about").replace(/\bto get up to speed on that about\b/g, "to get up to speed on")
    .replace(/^(?:Quick heads-up|Heads-up|For visibility|Looping you in): quick (?:ask|query|question)[.:,]\s+/i, "Quick question: ")
    .replace(/^(Quick heads-up|Heads-up|For visibility|Looping you in|Sharing for awareness): (Stop|Quit|Keep|Make|Fix|Check|Send) /, (_m, f, w) => `${f}: ${w.toLowerCase()} `)
    .replace(/^Quick question: ([A-Z])(?=[a-z])/, (_m, c) => `Quick question: ${c.toLowerCase()}`)
    .replace(/\bwhich means\b([^.]*?)\btop priority\b/g, "which means$1priority");
  // "every time I fix something, someone breaks it" is a complaint, not a request.
  t = t.replace(/([a-z]+)\. Could (someone|somebody|anyone|everyone) ([a-z]+s) ([^?]*)\?/g, (_m, w, who, v, rest) => `${w}, ${who} ${v} ${rest}.`);
  // "not going to rewrite" is a refusal, not travel.
  t = t.replace(/\bwon't be going to (?!the\b|a\b|an\b|my\b|our\b|your\b|his\b|her\b|their\b|this\b|that\b|these\b|those\b|any\b|every\b|work\b|school\b|lunch\b|dinner\b|bed\b|church\b|class\b|it\b|[A-Z\d])(?=[a-z]+\b)/g, "won't ");
  // The reason comes after the comma: "I'll be offline from noon, flying to Denver" means because, not so.
  if (!/\bso\b/i.test(src)) t = t.replace(/(\bI(?:'m| am|'ll| will|'ll be| won't| can't)? (?:[\w-]+ ){0,4}?(?:late|offline|out|away|off|leaving|logging off|stepping out|not going|going|unavailable|skipping|missing)\b[^.,;]*), so (I'm|I am|it's|it is) (?=(?:finishing|flying|heading|driving|dealing|waiting|stuck|picking|dropping|taking|recovering|attending|at|in|on|not worth|traveling|travelling)\b)/g, "$1, because $2 ");
  // A greeting stays in front of the frame, and the frame does not restart the sentence.
  t = t.replace(/^(Hey all|Hi all|Hey team|Hi team|Hey everyone|Hi everyone), ([A-Z][a-z]+ )/, (_m, g, w) => `${g}, ${w.toLowerCase()}`)
    .replace(/^Quick question: hey,? /i, "Quick question: ")
    .replace(/^(Quick heads-up|Heads-up|For visibility): quick reminder that /i, "Quick reminder: ")
    .replace(/\bsend over ([a-z]+) my way\b/g, "send $1 my way")
    .replace(/\bI would really value to\b/g, "I would really like to");
  // Bad news never gets a party frame: "the offshore team shipped garbage" is not a win.
  if (/\b(?:garbage|trash|poor-quality|low-quality|clean (?:it|this|that|them) up|[0-2](?:\.\d)? ?stars?\b|broke|broken|failed|crash\w*|worst|terrible|awful|horrible|start over|deleted)\b/i.test(src) && !/\b(?:fix\w*|resolv\w*|solv\w*|recover\w*|back up|restored|finally|caught)\b/i.test(src)) {
    const before = t;
    t = t.replace(/^(?:Kudos:|Quick win(?: to share)?:|I'm happy to share that|Good news on this front:|Pausing the roadmap to celebrate greatness:|Celebrating [^:]{3,60}:|Thrilled to (?:announce|share) [^:]{0,60}:|Humbled and honored to share that|In the spirit of a recognition-first culture:|Excited to share [^:]{0,60}:|Calling out best-in-class execution:)\s*/, () => [null, "Just so you know, ", "Flagging for visibility: ", "Surfacing a quality-related headwind: "][lvl] ?? "");
    if (t !== before) t = t.replace(/\s*(?:Well deserved\.|Love to see it\.|Great momentum\.|Great to see\.|Somebody alert the culture deck\.|Legends are being written in real time\.|This is what happens when vision meets execution\.|History, and the quarterly scorecard, will remember this moment\.|Absolute rockstar energy\.|Operational excellence, delivered\.|Please hold your applause until the end of the quarter\.)/g, "").replace(/\s*$/, lvl === 3 ? " Every setback is a setup for a comeback, presumably." : "");
  }
  // A crude word the user never typed in this form must not survive: "stop screwing with" -> "stop messing with" upstream; belt and braces here.
  t = t.replace(/\bscrewing (?:around )?with\b/gi, "messing with");
  return t.replace(/[ \t]{2,}/g, " ");
}
