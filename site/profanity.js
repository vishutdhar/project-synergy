// Profanity, insults, slurs and crude phrases for Normal to corporate.
// Corporate output has to be safe to say at work, so crude wording is rewritten, never echoed.
// Pure functions, used by the Instant engine, the AI path and the tests.

// Slurs are stored in ROT13 so the source doesn't spell them out. They are never shown, only removed.
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode(((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26) + (c === c.toLowerCase() ? 97 : 65)));
const SLURS = "avttre avttref avttn avttnf fcvp fcvpf puvax puvaxf xvxr xvxrf jrgonpx jrgonpxf tbbx tbbxf enturnq enturnqf gbjryurnq gbjryurnqf pbba pbbaf ornare ornaref cnxv cnxvf snttbg snttbgf snt sntf qlxr qlxrf genaal genaavrf ergneq ergneqf ergneqrq fcnm fcnfgvp zbatbybvq furznyr tlcfl".split(" ").map(rot13);
const SLUR_RE = new RegExp(`\\b(?:${SLURS.join("|")})\\b`, "gi");

// Obfuscated spellings, turned into one plain form before anything else runs.
const FUCK_STEM = String.raw`(?:f[\W_]{0,2}(?:u|v|\*|@|#|%)[\W_]{0,2}(?:c|\*|#)[\W_]{0,2}k|f\*\*k|f\*\*\*|fck|fuk|fuq|phuck|fvck|feck)`;
const CANON = [
  [new RegExp(`\\b${FUCK_STEM}(ing|in'?|n|ed|er|ers|s)?\\b`, "gi"), (_m, suf = "") => "fuck" + ({ in: "ing", "in'": "ing", n: "ing" }[suf.toLowerCase()] ?? suf.toLowerCase())],
  [/\bf+k+(?:i?n'?g?|n)\b/gi, "fucking"],
  [/\b(?:effing|effin|freaking|freakin|frickin|fricking|friggin|frigging)\b/gi, "fucking"],
  [/\bmotherf[\w*@#$]*/gi, (m) => "motherfuck" + (/ing$/i.test(m) ? "ing" : /s$/i.test(m) ? "ers" : "er")],
  [/\b(?:mofos?|mfers?)\b/gi, "motherfucker"],
  [/\bsh(?:\*|!|1)t(ty|s)?\b|\bs\*\*t\b|\bshyt\b/gi, (_m, suf = "") => "shit" + (suf ?? "").toLowerCase()],
  [/\bb(?:\*|!)tch(es|ing|y)?\b|\bbiatch\b/gi, (_m, suf = "") => "bitch" + (suf ?? "").toLowerCase()],
  [/\ba(?:\*\*|\$\$|-)hole(s)?\b|\bahole(s)?\b/gi, (_m, s1, s2) => "asshole" + (s1 ?? s2 ?? "")],
  [/\bd(?:\*|@)mn(it)?\b|\bdammit\b|\bgoddamn ?it\b/gi, "damn it"],
  [/\bcr(?:\*|@)p(py)?\b/gi, (_m, suf = "") => "crap" + (suf ?? "")],
  [/\bb\.?s\.?\b(?=\s*[.!?]?\s*$)|\b(?:is|that's|thats|such|total|complete|pure|absolute|utter) (?:bs|b\.s\.)\b/gi, (m) => m.replace(/bs|b\.s\./i, "bullshit")],
  [/\bwtf\b/gi, "what the fuck"],
  [/\bstfu\b/gi, "shut the fuck up"],
  [/\bgtfo\b/gi, "get the fuck out"],
  [/\bffs\b/gi, "for fuck's sake"],
  [/\bfml\b/gi, "fuck my life"],
  [/\b(?:omfg|omg)\b/gi, "oh my god"],
  [/\b(?:lmfao|lmao)\b[,.!]*\s*/gi, ""],
  // "tired af", "busy as hell" -> "really tired"
  [/\b([a-z]+) (?:af|as fuck|as hell|as shit|as heck)\b/g, "really $1"],
  // "who the fuck", "what the hell" -> "who", "what"
  [/\b(what|who|where|why|how|when) the (?:fuck|hell|heck|shit)\b(?! is going on\b)/gi, "$1"],
  // Intensifiers in front of another word just go away: "the fucking printer" -> "the printer".
  [/\b(?:fucking|fuckin|bloody|goddamn|goddamned|damned|damn)\s+(?!(?:it|you|him|her|them|off|up|over|around|with|me|this|that|us)\b)(?=[a-z])/gi, ""],
];

export function canonicalizeCrude(text) {
  let t = String(text ?? "");
  for (const [re, rep] of CANON) t = t.replace(re, rep);
  return t;
}

// Phrase rewrites: "crude phrase = mild = middle manager = c-suite". All of them always apply.
export const CRUDE_SWAPS = `
!fuck off all day = slack off all day = take a low-output recharge day = deprioritize all deliverables for a full-day recharge
!fuck off all day today = take it easy all day today = take a low-output recharge day today = deprioritize all deliverables today for a full-day recharge
!fuck off = take it easy = go low-output = enter a strategic recharge window
!fucking off = taking it easy = going low-output = entering a strategic recharge window
!fucked off = took it easy = went low-output = entered a strategic recharge window
!fuck this = I want to step back from this = I'd like to revisit this approach = I'd like to sunset this approach
!fuck that = I don't want to go that way = I'd like to revisit that approach = that approach isn't aligned with our north star
!fuck you = I disagree with you = I strongly disagree with you = I'm fundamentally misaligned with you
!fuck him = I'm frustrated with him = I have serious concerns about him = he and I are deeply misaligned
!fuck her = I'm frustrated with her = I have serious concerns about her = she and I are deeply misaligned
!fuck them = I'm frustrated with them = I have serious concerns about them = they're not aligned with our north star
!fuck it = let's just go ahead = let's move forward as is = let's bias for action and ship it
!fuck up = mess up = drop the ball = create an unplanned learning moment
!fucked up = messed up = dropped the ball = created an unplanned learning moment
!is fucked up = isn't right = is a serious problem = is fundamentally misaligned
!fucked = in trouble = in a tough spot = facing significant headwinds
!fuck no = no = absolutely not = that's a hard no from a strategic standpoint
!fuck yes = yes = absolutely = that's a strong yes from me
!fuck yeah = yes = absolutely = that's a strong yes from me
!what the fuck = what = what exactly = help me understand
!what the fuck is going on = what's going on = what exactly is going on = help me understand what's going on
!shut the fuck up = please stop talking = let's pause the discussion = let's table your input for now
!get the fuck out = please leave = please step out = let's take some space
!for fuck's sake = come on = honestly = with respect
!fuck my life = this is rough = I'm having a hard day = my personal KPIs are trending down
!^fuck = oh no = that's frustrating = that's a suboptimal outcome
!fuck = mess = problem = misalignment
!don't give a fuck = don't care about this = don't see this as a priority = don't see this as a strategic priority
!i don't give a fuck = I'm not invested in this = this isn't a priority for me = this isn't on my priority roadmap
!don't give a shit = don't care about this = don't see this as a priority = don't see this as a strategic priority
!i don't give a shit = I'm not invested in this = this isn't a priority for me = this isn't on my priority roadmap
!don't give a damn = don't care about this = don't see this as a priority = don't see this as a strategic priority
!i don't give a damn = I'm not invested in this = this isn't a priority for me = this isn't on my priority roadmap
!this is bullshit = I don't think this is right = I have concerns about this = I have strategic reservations about this
!that's bullshit = I don't think that's right = I have concerns about that = that doesn't align with the data
!bullshit = nonsense = not credible = not data-backed
!no shit = obviously = clearly = that's table stakes
!holy shit = wow = wow, that's big = this is a paradigm shift
!is shit = is not good = is low quality = is underperforming
!is a piece of shit = is in bad shape = is low quality = is a value-negative asset
!piece of shit = mess = low-quality deliverable = value-negative asset
!shitshow = mess = chaotic situation = cross-functional misalignment event
!shit show = mess = chaotic situation = cross-functional misalignment event
!shitty = bad = low-quality = suboptimal
!^shit = oops = oh no = we have an unplanned learning moment
!shit = stuff = stuff = deliverables
!this sucks = this isn't great = this is frustrating = this underindexes on value
!is crap = is not great = is low quality = is underperforming
!crappy = poor = low-quality = suboptimal
!damn it = oh no = that's frustrating = that's a suboptimal outcome
!damn = oh no = that's frustrating = that's a suboptimal outcome
!hell no = no way = that's a firm no = that's a hard no from a strategic standpoint
!hell yes = yes = absolutely = that's a strong yes from me
!go to hell = please leave me alone = I need some space = let's pause this relationship
!bloody hell = oh no = that's frustrating = that's a suboptimal outcome
!hell = a rough time = a very difficult time = a high-friction environment
!pissed off = annoyed = frustrated = frustrated with the current alignment
!pissed = annoyed = frustrated = frustrated with the current alignment
!piss off = please leave me alone = please give me some space = let's take a step back
!pisses me off = annoys me = frustrates me = creates friction for me
!screw this = I want to step back from this = I'd like to revisit this approach = I'd like to sunset this approach
!screw that = let's skip that = I'd like to revisit that approach = that approach isn't on the roadmap
!screw it = let's just go ahead = let's move forward as is = let's bias for action
!screw you = I disagree with you = I strongly disagree with you = I'm fundamentally misaligned with you
!screw up = mess up = drop the ball = create an unplanned learning moment
!screwed up = messed up = dropped the ball = created an unplanned learning moment
!screwed = in trouble = in a tough spot = facing significant headwinds
!he's an idiot = he's still learning = there's an opportunity for him to upskill = he has significant growth areas
!she's an idiot = she's still learning = there's an opportunity for her to upskill = she has significant growth areas
!you're an idiot = I think you missed something = there's an opportunity for you to upskill = you have significant growth areas
!they're idiots = they're still learning = there's an opportunity for them to upskill = they have significant growth areas
!i'm an idiot = I made a mistake = I own that miss = I'm treating this as a learning opportunity
!is an idiot = is still learning = has an opportunity to upskill = has significant growth areas
!is a moron = is still learning = has an opportunity to upskill = has significant growth areas
!are idiots = are still learning = have room to upskill = have significant growth areas
!are morons = are still learning = have room to upskill = have significant growth areas
!idiot = beginner = colleague with growth areas = stakeholder with growth areas
!idiots = beginners = colleagues with growth areas = stakeholders with growth areas
!moron = beginner = colleague with growth areas = stakeholder with growth areas
!morons = beginners = colleagues with growth areas = stakeholders with growth areas
!idiotic = not well thought out = not well thought through = not grounded in first principles
!dumbass = beginner = colleague with growth areas = stakeholder with growth areas
!jackass = difficult person = challenging colleague = low-collaboration stakeholder
!is an asshole = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a jerk = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a dick = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a prick = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a bitch = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a bastard = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!is a douche = is hard to work with = is a challenging collaborator = has low collaboration KPIs
!asshole = difficult person = challenging colleague = low-collaboration stakeholder
!assholes = difficult people = challenging colleagues = low-collaboration stakeholders
!jerk = difficult person = challenging colleague = low-collaboration stakeholder
!jerks = difficult people = challenging colleagues = low-collaboration stakeholders
!dick = difficult person = challenging colleague = low-collaboration stakeholder
!prick = difficult person = challenging colleague = low-collaboration stakeholder
!douche = difficult person = challenging colleague = low-collaboration stakeholder
!douchebag = difficult person = challenging colleague = low-collaboration stakeholder
!bastard = difficult person = challenging colleague = low-collaboration stakeholder
!bastards = difficult people = challenging colleagues = low-collaboration stakeholders
!son of a bitch = difficult person = challenging colleague = low-collaboration stakeholder
!motherfucker = difficult person = challenging colleague = low-collaboration stakeholder
!motherfuckers = difficult people = challenging colleagues = low-collaboration stakeholders
!motherfucking = difficult = challenging = misaligned
!bitch = difficult person = challenging colleague = low-collaboration stakeholder
!bitch about = complain about = raise concerns about = escalate feedback on
!bitching about = complaining about = raising concerns about = escalating feedback on
!bitching = complaining = raising concerns = escalating feedback
!bitchy = short-tempered = curt = low on collaboration energy
!cunt = difficult person = challenging colleague = low-collaboration stakeholder
!twat = difficult person = challenging colleague = low-collaboration stakeholder
!wanker = difficult person = challenging colleague = low-collaboration stakeholder
!bollocks = nonsense = not credible = not data-backed
!kiss my ass = no thanks = I'll pass = that's a hard pass
!kick ass = do great = deliver strong results = drive best-in-class outcomes
!kicked ass = did great = delivered strong results = drove best-in-class outcomes
!kicking ass = doing great = delivering strong results = driving best-in-class outcomes
!badass = impressive = high-impact = best-in-class
!half-assed = rushed = incomplete = MVP-grade
!cover my ass = protect myself = document my position = build a robust paper trail
!pain in the ass = hassle = real hassle = high-friction dependency
!ass = behind = behind = behind
!sucks ass = isn't great = is suboptimal = underindexes on value
!this blows = this isn't great = this is frustrating = this underindexes on value
!it blows = it isn't great = it's frustrating = it underindexes on value
!that blows = that isn't great = that's frustrating = that underindexes on value
!i don't give a fuck about = I don't care about = I'm not invested in = I'm not prioritizing
!i don't give a shit about = I don't care about = I'm not invested in = I'm not prioritizing
!i don't give a damn about = I don't care about = I'm not invested in = I'm not prioritizing
!i don't give a crap about = I don't care about = I'm not invested in = I'm not prioritizing
!don't give a fuck about = don't care about = am not invested in = am not prioritizing
!don't give a shit about = don't care about = am not invested in = am not prioritizing
!don't give a damn about = don't care about = am not invested in = am not prioritizing
!don't give a crap about = don't care about = am not invested in = am not prioritizing
!who gives a fuck about = who cares about = who is actually prioritizing = who owns the value case for
!who gives a shit about = who cares about = who is actually prioritizing = who owns the value case for
!who gives a crap about = who cares about = who is actually prioritizing = who owns the value case for
!who gives a damn about = who cares about = who is actually prioritizing = who owns the value case for
!who gives a fuck = who cares = who is prioritizing this = what's the value-add here
!who gives a shit = who cares = who is prioritizing this = what's the value-add here
!who gives a crap = who cares = who is prioritizing this = what's the value-add here
!clusterfuck = mess = chaotic situation = cross-functional misalignment event
!what a clusterfuck = what a mess = this is chaotic = this is a cross-functional misalignment event
!what a shitshow = what a mess = this is chaotic = this is a cross-functional misalignment event
!get the fuck out of = please leave = please step out of = I'd appreciate some space in
!are shit = are bad = are disappointing = are underperforming
!are crap = are bad = are disappointing = are underperforming
!this shit = this = this thing = this deliverable
!that shit = that = that thing = that deliverable
!being a total bitch = being very difficult = being really demanding = escalating aggressively
!being a bitch = being difficult = being demanding = escalating aggressively
!being a dick = being difficult = being unhelpful = showing low collaboration energy
!being a total dick = being very difficult = being really unhelpful = showing low collaboration energy
!a dumb = a weak = a less-than-ideal = a suboptimal
!a stupid = a weak = a less-than-ideal = a suboptimal
!the dumbest = the weakest = the least viable = the most strategically misaligned
!the stupidest = the weakest = the least viable = the most strategically misaligned
!screwed up the = messed up the = dropped the ball on the = under-delivered on the
!fucked up the = messed up the = dropped the ball on the = under-delivered on the
!oh my god = wow = wow = this is a paradigm shift
`;

// Anything left after the rewrite is crude. Matching is whole word.
const CRUDE_WORDS = [
  String.raw`fuck\w*`, String.raw`\w*fuck(?:er|ers|ing|ed)?`, FUCK_STEM + String.raw`\w*`, String.raw`shit\w*`, String.raw`\w+shit`, String.raw`bullshit\w*`,
  String.raw`crap(?:py|s)?`, String.raw`damn\w*`, String.raw`goddamn\w*`, "dammit", "hell", String.raw`ass(?:es)?`, String.raw`asshole\w*`, "dumbass", "jackass", "badass", String.raw`half-assed`,
  String.raw`bitch\w*`, String.raw`bastard\w*`, String.raw`dick(?:s|head|heads)?`, "prick", "pricks", "cock", "cocks", String.raw`cunt\w*`, "twat", "twats", String.raw`wanker\w*`, "bollocks",
  String.raw`piss\w*`, String.raw`douche\w*`, String.raw`motherf\w*`, String.raw`idiot\w*`, String.raw`moron\w*`, String.raw`(?<!knee-)jerks?`, "stupid", "dumb", "sucks?", String.raw`(?<=\b(?:this|it|that) )blows`,
  "wtf", "stfu", "gtfo", "ffs", "fml", "omfg", "lmfao", String.raw`screw(?:ed|ing|s)?(?= (?:this|that|it|you|him|her|them|up|over)\b)`, String.raw`screwed(?=[.!?,]|$)`,
  String.raw`f+k+(?:i?n'?g?|n)`, "effing", String.raw`fr[ei]+(?:ak|ck|gg)in[g']?`,
];
const CRUDE_RE = new RegExp(`(?<![\\w'*])(?:${CRUDE_WORDS.join("|")})(?![\\w'*])|${SLUR_RE.source}`, "gi");

// Every crude word or slur in the text, with where it is.
export function findCrude(text) {
  const t = String(text ?? "");
  const out = [];
  for (const m of t.matchAll(new RegExp(CRUDE_RE.source, "gi"))) {
    // "Dick" with a capital D is usually a name.
    if (/^Dick$/.test(m[0])) continue;
    out.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export const hasCrude = (text) => findCrude(text).length > 0;
export const isSlur = (word) => new RegExp(`^(?:${SLURS.join("|")})$`, "i").test(word);

// Slurs are replaced with a plain word (person, people) so the sentence still reads.
export function neutralizeSlurs(text) {
  return String(text ?? "").replace(SLUR_RE, (m) => (/s$/i.test(m) && !/ss$/i.test(m) ? "people" : "person"));
}

// Last resort for anything still crude: swap each word for a neutral one, or drop it.
const NEUTRAL = [
  [/^(?:idiot|moron|dumbass|jackass|asshole|jerk|dick|prick|douche\w*|bastard|bitch|cunt|twat|wanker|motherf\w*|cock)s?$/i, (w) => (/s$/i.test(w) ? "people" : "person")],
  [/^(?:bullshit|bollocks|crap|shit)$/i, () => "stuff"],
  [/^(?:shitty|crappy)$/i, () => "poor"],
  [/^(?:stupid|dumb|idiotic)$/i, () => "not ideal"],
  [/^(?:sucks?|blows)$/i, () => "isn't great"],
  [/^(?:pissed)$/i, () => "annoyed"],
];
export function scrubCrude(text) {
  let t = neutralizeSlurs(text);
  for (let guard = 0; guard < 20; guard++) {
    const [hit] = findCrude(t);
    if (!hit) break;
    const rule = NEUTRAL.find(([re]) => re.test(hit.word));
    // A dropped word after "a" or "the" needs a stand-in, or the sentence reads "give a about".
    const rep = rule ? rule[1](hit.word) : /\b(?:a|an|the|this|that)\s+$/i.test(t.slice(0, hit.start)) ? "thing" : "";
    let end = hit.end;
    // "fuck off", "screw up": the small word after it goes too.
    if (!rule) {
      const tail = t.slice(end).match(/^\s+(?:off|up|around|over)\b/i);
      if (tail) end += tail[0].length;
    }
    t = t.slice(0, hit.start) + rep + t.slice(end);
  }
  return t.replace(/[ \t]{2,}/g, " ").replace(/ +([,.;:!?])/g, "$1").replace(/^[\s,;:]+/, "").replace(/,\s*([.!?])/g, "$1").trim();
}

// True when the output has a crude word the input didn't have. Decoding can be blunt, but it shouldn't start swearing.
export function addsCrude(input, output) {
  const stem = (w) => w.toLowerCase().replace(/(?:ing|in'|ed|er|ers|s|es|y)$/, "");
  const raw = String(input ?? "");
  const had = new Set([...findCrude(raw), ...findCrude(canonicalizeCrude(raw))].map((h) => stem(h.word)));
  return findCrude(String(output ?? "")).some((h) => !had.has(stem(h.word)));
}
