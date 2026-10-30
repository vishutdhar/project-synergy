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
  [/\bd(?:\*|@)mn(it)?\b|\bdamnit\b|\bdammit\b|\bgoddamn ?it\b|\bgoddam+it\b|\bgod damn it\b/gi, "damn it"],
  [/\bcr(?:\*|@)p(py)?\b/gi, (_m, suf = "") => "crap" + (suf ?? "")],
  [/\bb\.?s\.?\b(?=\s*[.!?]?\s*$)|\b(?:is|that's|thats|such|total|complete|pure|absolute|utter|of) (?:bs|b\.s\.)\b/gi, (m) => m.replace(/bs|b\.s\./i, "bullshit")],
  // Hyphenated forms read the same as spaced ones.
  // "a fuck-up" is a noun, "fucked-up" an adjective.
  [/\b(fuck|screw|cock)-up(s?)\b/gi, "$1up$2"],
  [/\b(fucked|screwed|cocked)-up\b/gi, "$1 up"],
  [/\bhalf assed\b/gi, "half-assed"],
  [/\bsmart-?ass\b/gi, "smartass"],
  [/\bsweet (?:f\.?a\.?|fuck all|fanny adams)(?![\w.])/gi, "fuck all"],
  [/\bwtf\b/gi, "what the fuck"],
  [/\bstfu\b/gi, "shut the fuck up"],
  [/\bgtfo\b/gi, "get the fuck out"],
  [/\bffs\b/gi, "for fuck's sake"],
  [/\bfml\b/gi, "fuck my life"],
  [/\b(?:omfg|omg)\b/gi, "oh my god"],
  [/\b(?:lmfao|lmao)\b[,.!]*\s*/gi, ""],
  // "scared the shit out of me" -> "really scared me"
  [/\b(?!get\b|got\b)([a-z]+) the (?:shit|hell|crap|fuck|living daylights) out of\b/gi, "really $1"],
  // "tired af", "busy as hell" -> "really tired"
  [/\b([a-z]+) (?:af|as fuck|as hell|as shit|as heck)\b/g, "really $1"],
  // "who the fuck", "what the hell" -> "who", "what"
  [/\b(what|who|where|why|how|when) (?:in )?the (?:fuck|hell|heck|shit)\b(?! is going on\b)/gi, "$1"],
  // "hurry the fuck up" -> "hurry up". "shut" and "get" have their own rewrites.
  [/\b(?!(?:shut|get)\b)([a-z]+) the (?:fuck|hell|heck) (?=[a-z])/gi, "$1 "],
  // "the hell is wrong with this" -> "what is wrong with this"
  [/(^|[.!?]\s+)the (?:fuck|hell|heck) (?=(?:is|are|was|were|do|does|did|have|has|happened)\b)/gi, "$1what "],
  // Intensifiers just go away: "the fucking printer" -> "the printer", "damn good" -> "good".
  [/(?<!\bgive an? |\bgives an? |\bgiving an? )\b(?:fucking|fuckin|bloody|goddamn|goddamned|damned|damn|motherfucking)\s+(?!(?:it|you|him|her|them|off|up|over|around|with|me|this|that|us|all|done with)\b)(?=[a-z])/gi, ""],
  // "Fix it, you idiot." -> "Fix it." The insult adds nothing a colleague needs to read.
  [/(^|[.!?]\s+)you (?:idiot|moron|dumbass|asshole|jerk|dick|prick|twat|wanker|bastard|clown)s?\s*[,!.]?\s*/gi, "$1"],
  [/,\s*you (?:idiot|moron|dumbass|asshole|jerk|dick|prick|twat|wanker|bastard|clown)s?\b/gi, ""],
  // Round 7: "stop dumping last minute crap on my team" -> "last-minute requests".
  [/\b(dump\w*|throw\w*|toss\w*|send\w*|pil\w* on|push\w*|drop\w*|lob\w*) (?:all )?(?:this |that |the |more |some |random )?last[- ]minute (?:shit|crap|junk|garbage|stuff|bullshit)\b/gi, "$1 last-minute requests"],
  // "promising shit we can't build", "doing all this crap": the noun means "things", not a judgment.
  [/\b(promis\w*|say|says|saying|said|sell\w*|sold|buy\w*|bought|build\w*|built|break\w*|broke|do|does|doing|did|done|fix\w*|ask\w*|send\w*|sent|ship\w*|post\w*|need|needs|needed|want\w*|handl\w*|make|makes|making|made|order\w*|mov\w*|chang\w*|add\w*|dump\w*|throw\w*|tak\w*|took|forget\w*|forgot|learn\w*|carry\w*|pack\w*|deal\w* with|put up with|clean\w* up|approv\w*|request\w*|merg\w*|deploy\w*|push\w*)((?: (?:for|about|with|on|into|in|up))?) (some |more |random |other |extra |weird |dumb |stupid |all (?:this|that|the|of this|of that) |this |that |the |our |my |your |their |his |her |its )?(?:shit|crap)\b(?! (?:out of|all|ton|load|show|storm|together)\b)/gi, (_m, v0, prep, det = "") => {
    const v = v0 + (prep ?? "");
    const d = (det ?? "").trim().toLowerCase().replace(/^(?:weird|dumb|stupid)$/, "");
    if (/^(?:fix|clean\w* up|deal\w* with|handl|put up with)/i.test(v)) {
      const d2 = d.replace(/^(?:this|that)$/, "these").replace(/^all (?:of )?(?:this|that|the)$/, "all these").replace(/^(?:random|more|some|other|extra)$/, "$& ").trim();
      return `${v} ${d2 ? d2 + " " : ""}issues`;
    }
    if (/^(?:all|this|that|the)\b/.test(d)) return `${v} ${d} stuff`;
    if (/^(?:our|my|your|their|his|her|its)$/.test(d)) return `${v} ${d} things`;
    return `${v} ${d ? d + " " : ""}things`;
  }],
  // "this stupid printer" -> "this printer". "a stupid idea" has its own rewrite.
  [/\b(the|this|that|these|those|my|our|your|his|her|their) (?:stupid|dumb|crappy|shitty) (?!(?:and|or|but|to|of)\b)(?=[a-z])/gi, "$1 "],
];

export function canonicalizeCrude(text) {
  let t = neutralizeSlurs(String(text ?? ""));
  for (const [re, rep] of CANON) {
    // Keep a capital letter at the start: "Fuck it" stays "Fuck it", not "fuck it".
    t = t.replace(re, (...args) => {
      const m = args[0];
      const groups = args.slice(1, args.findIndex((a) => typeof a === "number"));
      let out = typeof rep === "function" ? rep(...args) : rep.replace(/\$(\d)/g, (_x, n) => groups[n - 1] ?? "");
      if (/^[A-Z]/.test(m) && /^[a-z]/.test(out)) out = out[0].toUpperCase() + out.slice(1);
      return out;
    });
  }
  return t.replace(/\b([Aa]) (idiot|asshole)/g, "$1n $2");
}

// Expand "{a|b}" alternatives into separate swap lines. "$1" in an option is the alternative picked
// from the first group, "$2" from the second. A "{x|y}" group in an option runs parallel to the
// first group: "{is|was} shit = {isn't|wasn't} good".
const fixI = (w) => w.replace(/^i\b/, "I");
function expand(block) {
  const out = [];
  for (const raw of block.trim().split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const [lhs, ...opts] = line.split(" = ");
    const groups = [...lhs.matchAll(/\{([^}]*)\}/g)].map((m) => m[1].split("|"));
    if (!groups.length) { out.push(line); continue; }
    const combos = groups.reduce((acc, g) => acc.flatMap((c) => g.map((_, i) => [...c, i])), [[]]);
    for (const idx of combos) {
      let k = 0;
      const key = lhs.replace(/\{[^}]*\}/g, () => groups[k][idx[k++]]).replace(/\s+/g, " ").trim();
      const fill = (o) => o
        .replace(/\{([^}]*)\}/g, (_m, alts) => alts.split("|")[idx[0]])
        .replace(/\$(\d)/g, (_m, n) => fixI(groups[n - 1][idx[n - 1]]))
        .replace(/\s+/g, " ").trim();
      out.push([key, ...opts.map(fill)].join(" = "));
    }
  }
  return out;
}

// Phrase rewrites by meaning: "crude phrase = mild = middle manager = c-suite". All always apply.
// Every option has to fit the same slot in the sentence, so each level reads as a sentence.
// Bare swear words have no entry on purpose: a word-for-word swap is how "fuck all" became "mess all".
const PHRASES = `
!{so fucking|fucking|freaking|effing|bloody} done with = fed up with = at the limit of my patience with = operating at the outer edge of my emotional bandwidth for
!{fuck|shit|jack shit|dick|bugger|naff|sod} all = nothing = nothing at all = nothing of substance
!{a|this|that|the} shit {idea|plan|proposal|design|take|call|decision|approach|deal} = $1 bad $2 = $1 weak $2 = $1 $2 with significant headroom
!useless crap = useless = of little use = delivering minimal measurable value
!{really|totally|completely|royally|seriously} fucked {the|this|that|our|my|his|her|their|your|up the} = $1 wrecked $2 = $1 derailed $2 = $1 materially derailed $2
!fucked {the|this|that|our|my|his|her|their|your} = wrecked $1 = derailed $1 = materially derailed $1
!{bullshitting|bullshit|lying to} {the|our|this|that|your|their} = misleading $2 = misleading $2 = giving $2 inaccurate information
!bored out of {my|his|her|their|our} {skull|mind|head|brains|gourd} = really bored = extremely bored = profoundly under-stimulated
!{half-assing|half assing|halfassing} it = doing the bare minimum on it = putting in minimum viable effort = delivering a strategically minimum viable effort
!{half-assing|half assing|halfassing} = doing the bare minimum on = putting minimum viable effort into = delivering a strategically minimum viable effort on
!dragging {their|his|her|our|my|your} {ass|asses|butt|butts|feet} on = moving slowly on = slow-walking = operating on an extended timeline for
!dragging {their|his|her|our|my|your} {ass|asses|butt|butts} = moving slowly = slow-walking it = operating on an extended timeline
!{get|got|getting} off {their|his|her|your|our} {ass|asses|butt|butts} = $1 moving = $1 moving = $1 into execution mode
!rip {us|them|me|him|her|you} a new one = be very critical of $1 = come down hard on $1 = deliver some deeply candid feedback to $1
!{ripped|rips} {us|them|me|him|her|you} a new one = criticized $2 sharply = came down hard on $2 = delivered some deeply candid feedback to $2
!{half-ass|half ass|halfass} it = do the bare minimum = put in minimum viable effort = deliver a strategically minimum viable effort
!{half-ass|half ass|halfass} = do the bare minimum on = put minimum viable effort into = deliver a strategically minimum viable effort on
!talks out of {his|her|their} ass = makes things up = speaks without data = shares bold, data-free conviction
!talking out of {his|her|their|my|your} ass = making things up = speaking without data = sharing bold, data-free conviction
!{looks|look|looked} like {ass|shit|crap|garbage} = $1 bad = $1 rough = $1 like it has meaningful headroom on visual quality
!being a {total|real|complete|huge} pain = being very difficult = being really challenging = operating as a uniquely high-friction partner
!{is|was} a {total|real|complete|huge} pain = $1 very difficult = $1 really challenging = $1 a uniquely high-friction experience
!cringe as {fuck|hell|shit} = really awkward = deeply awkward = a high-discomfort moment for all stakeholders
!{fuck|shit|jack shit|dick|bugger|naff|sod} all of = none of = none of = none of
!jack shit = nothing = nothing at all = nothing of substance
!saved {our|my} {ass|asses|butt|butts|bacon|skins|hides|necks} = really saved {us|me} = saved {us|me} = saved the day for {us|me}
!saved {our|the team's} {ass|asses|butt|butts|bacon} = really saved us = saved us = rescued us
!saved my {ass|butt|bacon} = really saved me = saved me = rescued me
!saved your {ass|butt|bacon} = really saved you = saved you = rescued you
!{got|get|getting} {screwed|shafted|hosed|fleeced} on = $1 a bad deal on = $1 unfavorable terms on = $1 below-expectation terms on
!{got|get|getting} {screwed|shafted|hosed} = $1 a bad deal = $1 treated unfairly = $1 significantly disadvantaged
!no {fucking|freaking|bloody|damn|frickin|effing} way = there's no way = there's realistically no way = there's no feasible path where
!{is|are|was|were} {total |complete |absolute |utter |pure }{garbage|trash|rubbish|junk} = $1 really not good = $1 in need of significant work = $1 significantly below the bar
!{is|are|was|were} {garbage|trash|rubbish|junk} = $1 not good = $1 in need of significant work = $1 below the bar
!{learned|learnt|learn|know|knew|did|done|do|does|got|get|shipped|delivered|achieved|accomplished|contributed|said|heard|fixed|changed} {fuck all|shit all|jack shit|dick all|bugger all|naff all|sod all} = $1 nothing = $1 nothing at all = $1 nothing of substance
!{diddly |diddly-|jack }squat = nothing = nothing at all = nothing of substance
!{did|does|do|done|doing|know|knows|knew|mean|means|meant|got|get|gets|worth|achieved|accomplished} squat = $1 nothing = $1 nothing at all = $1 nothing of substance
!fuck all of you = I disagree with all of you = I strongly disagree with all of you = I'm fundamentally misaligned with all of you
!fuck all {this|that} = I'm fed up with all $1 = I'm frustrated with all $1 = I'm deeply misaligned with all $1
!fuck off all day = slack off all day = take a low-output recharge day = deprioritize all deliverables for a full-day recharge
!fuck off all day today = slack off all day today = take a low-output recharge day today = deprioritize all deliverables today for a full-day recharge
!{fuck|piss|bugger} off early = leave early = head out early = log off ahead of schedule
!{fucked|pissed|buggered} off early = left early = headed out early = logged off ahead of schedule
!{fuck|bugger} off home = head home = head home early = log off for the day
!{fucked|buggered|pissed} off home = headed home = went home = logged off for the day
!{fucking|buggering} off home = heading home = going home = logging off for the day
!fuck off for the rest of the day = take the rest of the day easy = go low-output for the rest of the day = enter a recharge window for the rest of the day
!^{fuck|piss|bugger|sod} off = please leave me alone = I need some space = let's pause this conversation
!fuck off = slack off = take it easy = enter a strategic recharge window
!fucking off = slacking off = taking it easy = entering a strategic recharge window
!fucked off = slacked off = took it easy = entered a strategic recharge window
!{tell|told|telling|tells} {him|her|them|you|me|kevin|everyone} to {fuck|piss|bugger|sod} off = $1 $2 to leave me alone = $1 $2 I need some space = $1 $2 we need to pause this conversation
!>fuck {this|that} = I'm fed up with $1 = I'm frustrated with $1 = I'm deeply misaligned with $1
!fuck {this|that} = I'm fed up with $1 = I'd like to revisit $1 approach = $1 approach isn't aligned with our north star
!fuck {this|that} shit = I'm fed up with $1 = I'd like to revisit $1 approach = $1 approach isn't aligned with our north star
!>screw {this|that} = I'm fed up with $1 = I'm frustrated with $1 = I'm deeply misaligned with $1
!screw {this|that} = I'm fed up with $1 = I'd like to revisit $1 approach = $1 approach isn't aligned with our north star
!{fuck|screw} you = I disagree with you = I strongly disagree with you = I'm fundamentally misaligned with you
!{fuck|screw} him = I'm frustrated with him = I have serious concerns about him = he and I are deeply misaligned
!{fuck|screw} her = I'm frustrated with her = I have serious concerns about her = she and I are deeply misaligned
!{fuck|screw} them = I'm frustrated with them = I have serious concerns about them = they're not aligned with our north star
!screw the = forget the = let's skip the = let's bypass the
!{fuck|screw} it, let's = let's go ahead and = let's move forward and = let's bias for action and
!{fuck|screw} it = let's just go ahead = let's move forward as is = let's bias for action
!fuck me = wow, that's rough = that's a real setback = that's a significant setback
!{fuck|screw|cock|mess} up = mess up = drop the ball = make an avoidable mistake
!{fucks|screws} up = messes up = drops the ball = makes an avoidable mistake
!{fucked|screwed|cocked} up = messed up = dropped the ball = made an avoidable mistake
!{fucking|screwing} up = messing up = dropping the ball = making an avoidable mistake
!{fuck|screw|cock} up {the|this|that|my|our|your|his|her|their} = mess up $2 = drop the ball on $2 = mishandle $2
!{fucks|screws} up {the|this|that|my|our|your|his|her|their} = messes up $2 = drops the ball on $2 = mishandles $2
!{fucked|screwed|cocked} up {the|this|that|my|our|your|his|her|their} = messed up $2 = dropped the ball on $2 = mishandled $2
!{fucking|screwing} up {the|this|that|my|our|your|his|her|their} = messing up $2 = dropping the ball on $2 = mishandling $2
!{fuck|screw|cock} {it|this|that|everything} up = mess $2 up = drop the ball on $2 = mishandle $2
!{fucked|screwed|cocked} {it|this|that|everything} up = messed $2 up = dropped the ball on $2 = mishandled $2
!{fucking|screwing} {it|this|that|everything} up = messing $2 up = dropping the ball on $2 = mishandling $2
!{a|another|one} {fuck|screw|cock} up = $1 mistake = $1 misstep = $1 unplanned learning moment
!{fuck|screw|cock} ups = mistakes = missteps = unplanned learning moments
!{a|another} {fuckup|screwup|cockup} = $1 mistake = $1 misstep = $1 unplanned learning moment
!{fuckup|screwup|cockup} = mistake = misstep = unplanned learning moment
!{fuckups|screwups|cockups} = mistakes = missteps = unplanned learning moments
!{is|was|that's|it's|this is} fucked up = $1 not right = $1 a serious problem = $1 fundamentally misaligned
!{a|this|that|the} fucked up = $1 broken = $1 seriously flawed = $1 fundamentally misaligned
!{we're|we are|i'm|i am|you're|you are|they're|they are|he's|she's|we|they} {fucked|screwed} = $1 in trouble = $1 in a tough spot = $1 facing significant headwinds
!{we're|we are|i'm|i am|you're|you are|they're|they are|he's|she's|we|they} {totally|completely|so|royally|well and truly} {fucked|screwed} = $1 in serious trouble = $1 in a very tough spot = $1 facing major headwinds
!{it's|it is|is|are|this is|that's|was|were|it was} {fucked|screwed|buggered} = $1 broken = $1 in bad shape = $1 seriously compromised
!{it's|it is|is|are|this is|that's|was|were|it was} {totally|completely|so|royally} {fucked|screwed|buggered} = $1 completely broken = $1 in very bad shape = $1 critically compromised
!{fucked|screwed} over = treated unfairly = treated very unfairly = put at a significant disadvantage
!{fucked|screwed} {us|me|him|her|them|you} over = treated $2 unfairly = treated $2 very unfairly = put $2 at a significant disadvantage
!{fucked|screwed} {us|me|him|her|them|you} = treated $2 unfairly = treated $2 very unfairly = put $2 at a significant disadvantage
!{fuck|screw} {us|me|him|her|them|you} over = treat $2 unfairly = treat $2 very unfairly = put $2 at a significant disadvantage
!{fucking|screwing} {us|me|him|her|them|you} over = treating $2 unfairly = treating $2 very unfairly = putting $2 at a significant disadvantage
!{fuck|mess} with = mess with = interfere with = disrupt
!fucking with = messing with = interfering with = disrupting
!fucked with = messed with = interfered with = disrupted
!{fuck|screw|dick} around = kill time = waste time = engage in low-value activity
!stop {bitching|whining|moaning} and = let's move past the complaints and = let's move from concerns to action and = let's pivot from concerns to execution and
!stop {fucking|screwing|dicking} around and = let's focus and = let's get focused and = let's prioritize execution and
!{fucking|screwing|dicking} around = messing around = wasting time = engaging in low-value activity
!{fucked|screwed|dicked} around = messed around = wasted time = engaged in low-value activity
!{jerk|jerking|jerked|jerks} {us|me|them|him|her|you} around = mess $2 around = string $2 along = not be straight with $2
!fuck no = no = absolutely not = that's a hard no from a strategic standpoint
!{fuck|hell} yes = yes = absolutely = that's a strong yes from me
!fuck yeah = yes = absolutely = that's a strong yes from me
!hell no = no way = that's a firm no = that's a hard no from a strategic standpoint
!what the fuck = what = what exactly = help me understand
!what the fuck is going on = what's going on = what exactly is going on = help me understand what's going on
!shut the fuck up = please stop talking = let's pause the discussion = let's table your input for now
!get the fuck out of = please leave = please step out of = I'd appreciate some space in
!get the fuck out = please leave = please step out = I'd appreciate some space
!for fuck's sake = , please = , please = , please
!fuck my life = this is rough = I'm having a hard day = my personal KPIs are trending down
!{oh|aw|ah} {fuck|shit|crap|hell} = oh no = unfortunately = that's a suboptimal outcome
!holy {fuck|shit|crap|hell} = wow, = wow, big news: = this is a paradigm shift:
!^{fuck|shit|crap|damn|damn it|hell|bugger|bollocks|fuck me|fucking hell|bloody hell|shit shit shit} = oh no = unfortunately = that's a suboptimal outcome
!{i|we|you|they} {don't|do not|didn't|did not} give a {fuck|shit|damn|crap|rat's ass|toss} about = $1 $2 care about = $1 $2 see a priority in = $1 $2 see strategic value in
!{he|she|it} {doesn't|does not|didn't|did not} give a {fuck|shit|damn|crap|rat's ass|toss} about = $1 $2 care about = $1 $2 see a priority in = $1 $2 see strategic value in
!{i|we|you|they} {don't|do not|didn't|did not} give a {fuck|shit|damn|crap|rat's ass|toss} = $1 $2 care = $1 $2 see this as a priority = $1 $2 see this as a strategic priority
!{he|she} {doesn't|does not|didn't|did not} give a {fuck|shit|damn|crap|rat's ass|toss} = $1 $2 care = $1 $2 see this as a priority = $1 $2 see this as a strategic priority
!{don't|doesn't|didn't} give a {fuck|shit|damn|crap|rat's ass|toss} about = $1 care about = $1 see a priority in = $1 see strategic value in
!{don't|doesn't|didn't} give a {fuck|shit|damn|crap|rat's ass|toss} = $1 care = $1 see this as a priority = $1 see this as a strategic priority
!{couldn't|could not} give a {fuck|shit|damn|crap|rat's ass|toss} {about|less about} = $1 care less about = $1 care less about = $1 care less about
!{couldn't|could not} give a {fuck|shit|damn|crap|rat's ass|toss} = $1 care less = $1 care less = $1 care less
!{nobody|no one} gives a {fuck|shit|damn|crap|rat's ass|toss} about = $1 cares about = $1 is prioritizing = $1 sees strategic value in
!{nobody|no one} gives a {fuck|shit|damn|crap|rat's ass|toss} = $1 cares = $1 is prioritizing this = $1 sees strategic value here
!who gives a {fuck|shit|damn|crap|rat's ass|toss} about = who cares about = who is actually prioritizing = who owns the value case for
!who gives a {fuck|shit|damn|crap|rat's ass|toss} = who cares = who is prioritizing this = what's the value-add here
!{zero|no} {fucks|shits} given about = I don't care about = I don't see a priority in = I don't see strategic value in
!{zero|no} {fucks|shits} given = I don't care = I don't see this as a priority = I don't see this as a strategic priority
!{clusterfuck|cluster fuck|shitshow|shit show|shitstorm|shit storm|fuckfest|dumpster fire} = mess = mess = cross-functional misalignment event
!{clusterfucks|shitshows|shitstorms} = messes = chaotic situations = cross-functional misalignment events
!what a {clusterfuck|cluster fuck|shitshow|shit show|shitstorm|fuckfest} = what a mess = this is chaotic = this is a cross-functional misalignment event
!{a|one} {shitshow|shit show|clusterfuck|cluster fuck|dumpster fire} of a = a mess of a = a chaotic = a deeply misaligned
!{a|one} {fuckload|fuckton|fuck ton|fuck load|shitload|shit load|shitton|shit ton|crapload|crap ton|crapton|hell of a lot} of = a lot of = a large amount of = a significant volume of
!{a|one} {fuckload|fuckton|fuck ton|fuck load|shitload|shit load|shitton|shit ton|crapload|crap ton|crapton|hell of a lot} = a lot = a great deal = a significant amount
!{fuckloads|shitloads|craploads|fucktons|shittons} of = lots of = large amounts of = significant volumes of
!{this|that} is bullshit = I don't think $1 is right = I have concerns about $1 = I have strategic reservations about $1
!{this|that}'s bullshit = I don't think $1's right = I have concerns about $1 = $1 doesn't align with the data
!{is|are|was|sounds|seems} {bullshit|bollocks} = $1 nonsense = $1 not credible = $1 not data-backed
!{is|are|was} {total|complete|utter|absolute} {bullshit|bollocks} = $1 complete nonsense = $1 not credible at all = $1 not data-backed in any way
!a load of {bullshit|bollocks|crap|shit} = a load of nonsense = complete nonsense = a set of unsupported claims
!{full of|talking} {shit|crap|bullshit|it} = not being straight with us = not being fully straight with us = not operating with full transparency
!stop {bullshitting|lying to} {me|us} = stop misleading $2 = please stop misleading $2 = please stop giving $2 inaccurate information
!{bullshitting|bullshit} {me|us|you|them} = misleading $2 = misleading $2 = giving $2 inaccurate information
!bullshitting = making things up = exaggerating = overstating the data
!{call|calling|called|calls} bullshit on = {push|pushing|pushed|pushes} back on = {challenge|challenging|challenged|challenges} = {respectfully challenge|respectfully challenging|respectfully challenged|respectfully challenges}
!{bullshit|bollocks} = nonsense = nonsense = nonsense
!no shit = obviously, = clearly, = as expected,
!{this|that} shit = $1 = $1 thing = $1 deliverable
!{this|that} crap = $1 = $1 thing = $1 deliverable
!{shit|crap} is = things are = things are = things are
!{shit's|crap's} = things are = things are = things are
!get {your|our|my|their|his|her} shit together = get organized = get properly organized = align on a structured plan
!{talking|talk|talks|talked} shit about = $1 negatively about = $1 critically about = $1 off-message about
!{shit|shat} the bed = failed badly = broke down badly = experienced a critical failure
!shits the bed = fails badly = breaks down badly = experiences a critical failure
!shitting the bed = failing badly = breaking down badly = experiencing a critical failure
!shit happens = things happen = these things happen = variance is part of the journey
!tough shit = that's how it is = that's the situation = that's the current reality
!deep shit = deep trouble = serious trouble = a critical risk position
!same shit{,|} different day = same problems, different day = same challenges, different day = recurring challenges, new sprint
!{is|was} a piece of {shit|crap} = $1 in bad shape = $1 low quality = $1 a value-negative asset
!{a|this|that} piece of {shit|crap} = $1 mess = $1 low-quality deliverable = $1 value-negative asset
!piece of {shit|crap} = mess = low-quality deliverable = value-negative asset
!{shitty|crappy|sucky} = bad = rough = suboptimal
!{shittier|crappier} = worse = lower-quality = more suboptimal
!{feel|felt|feeling|feels} like {shit|crap} = $1 terrible = $1 unwell = $1 like I'm at reduced capacity
!{look|looks|looked|looking} like {shit|crap} = $1 bad = $1 rough = $1 far from launch-ready
!what a {shitty|crappy|shit|crap} week = what a rough week = what a challenging week = what a week of significant headwinds
!like {shit|crap} = badly = poorly = suboptimally
!{is|are|was|were} shit = $1 bad = $1 disappointing = $1 underperforming
!{is|are|was|were} crap = $1 not great = $1 low quality = $1 underperforming
!{this|that} crap = $1 = $1 = $1
!crap = junk = junk = junk
!damn it = oh no = unfortunately = that's a suboptimal outcome
!can go to hell = has really frustrated me = has really frustrated me = has created significant friction for me
!can shove = can keep = can keep = are welcome to keep
!go to hell = please leave me alone = I need some space = let's pause this relationship
!{a|one} hell of a = quite a = quite a = a truly significant
!from hell = that's been a nightmare = that's been extremely difficult = that's been a sustained source of friction
!{went|gone|go|goes|going} to hell = $1 badly = $1 badly = $1 off track
!{went|gone|go|goes|going} to shit = $1 badly = $1 badly = $1 off track
!kicking our {ass|asses|butt|butts} = beating us = outperforming us = outperforming us in the market
!kicked our {ass|asses|butt|butts} = beat us = outperformed us = decisively outperformed us
!kicking my {ass|asses|butt|butts} = beating me = outperforming me = outperforming me in the market
!kicked my {ass|asses|butt|butts} = beat me = outperformed me = decisively outperformed me
!kicking your {ass|asses|butt|butts} = beating you = outperforming you = outperforming you in the market
!kicked your {ass|asses|butt|butts} = beat you = outperformed you = decisively outperformed you
!kicking their {ass|asses|butt|butts} = beating them = outperforming them = outperforming them in the market
!kicked their {ass|asses|butt|butts} = beat them = outperformed them = decisively outperformed them
!{got|get|getting} {our|my|their|your} {ass|asses} handed to {us|me|them|you} = $1 beaten badly = $1 clearly outperformed = $1 decisively outperformed
!lose {their|his|her|my|your|our} shit = be very upset = be extremely upset = react very strongly
!losing {their|his|her|my|your|our} shit = getting very upset = getting extremely upset = reacting very strongly
!lost {their|his|her|my|your|our} shit = got very upset = got extremely upset = reacted very strongly
!up {our|my|his|her|their|your} {ass|asses|butt|butts} about = on $1 case about = on $1 case about = putting pressure on $1 team about
!up {our|my|his|her|their|your} {ass|asses|butt|butts} = on $1 case = on $1 case = putting pressure on $1 team
!{cockblocking|cock-blocking} = blocking = blocking = blocking
!{cockblocked|cock-blocked} = blocked = blocked = blocked
!can go fuck {themselves|himself|herself|yourself|itself} = can look elsewhere = can look elsewhere = can explore other options
!are you shitting me = are you serious = are you serious = can you confirm that's accurate
!{you're|you are} shitting me = you're kidding = you can't be serious = I want to confirm that's accurate
!{such a|so} hardass = so strict = so strict = so high-accountability
!{a|the} hardass = $1 stickler = $1 real stickler = $1 high-accountability operator
!hardass = strict = very strict = high-accountability
!crapped all over = criticized = harshly criticized = was harshly critical of
!shat all over = criticized = harshly criticized = was harshly critical of
!shit all over = criticized = harshly criticized = was harshly critical of
!{a|such a|this|that} lazy {bastard|ass|asshole|shit|prick} = $1 lazy person = $1 disengaged colleague = $1 low-engagement contributor
!lazy {bastard|ass|asshole|shit|prick} = lazy = disengaged = low-engagement
!like hell = a lot = a great deal = significantly
!{is|was|been|has been} hell = $1 rough = $1 very difficult = $1 a high-friction period
!{pissed|pissed off|pissy} = annoyed = frustrated = deeply frustrated
!{pisses|pissed|pissing} {me|us|him|her|them|everyone|people} off = {annoys|annoyed|annoying} $2 = {frustrates|frustrated|frustrating} $2 = {creates friction for|created friction for|creating friction for} $2
!piss off the = annoy the = frustrate the = create friction with the
!pissing off the = annoying the = frustrating the = creating friction with the
!piss off with = please give it a rest with = I'd ask that we pause = I'd propose we sunset
!piss off = please leave me alone = please give me some space = let's take a step back
!pisses me off = annoys me = frustrates me = creates friction for me
!{taking|take|takes|took} the piss = $1 it too far = $1 an unreasonable position = $1 a position that's not in good faith
!piss{-| }poor = very poor = very weak = severely underperforming
!is an idiot = is careless = has an opportunity to upskill = has significant growth areas
!{he's|she's|you're|i'm} {an idiot|a moron|a dumbass} = $1 careless = $1 still learning = $1 operating with significant growth areas
!{they're|you're|we're} {idiots|morons} = $1 careless = $1 still learning = $1 operating with significant growth areas
!{is|was} {a moron|a dumbass} = $1 careless = $1 still learning = $1 operating with significant growth areas
!{are|were} {idiots|morons} = $1 careless = $1 still learning = $1 operating with significant growth areas
!what {an idiot|a moron|a dumbass} = that was careless = that was a misstep = that was an unplanned learning moment
!{such an idiot|such a moron} = so careless = so careless = so misaligned
!{an idiot|a moron|a dumbass} = someone careless = someone careless = a colleague with growth areas
!{the|that|this|some} {idiot|moron|dumbass} = $1 person = $1 person = $1 stakeholder
!{the|those|these|some} {idiots|morons} = $1 people = $1 people = $1 stakeholders
!{idiot|moron|dumbass} = someone = someone = someone
!{look|looked|looking|looks} like {idiots|morons|fools} = $1 foolish = $1 unprepared = $1 misaligned
!{idiots|morons} = fools = careless people = stakeholders with growth areas
!idiotic = not well thought out = not well thought through = not grounded in first principles
!{is|was} {an asshole|a jerk|a dick|a prick|a douche|a douchebag|a bastard|a dickhead|an asshat|a wanker|a twat|a jackass|a tool} = $1 hard to work with = $1 a challenging collaborator = $1 operating with low collaboration KPIs
!{he's|she's|you're} {an asshole|a jerk|a dick|a prick|a douche|a douchebag|a bastard|a dickhead|an asshat|a wanker|a twat|a jackass} = $1 hard to work with = $1 a challenging collaborator = $1 operating with low collaboration KPIs
!{being|been|be} {a|such a|a total|a complete|a real} {dick|jerk|prick|asshole|bitch|douche|twat|wanker} = $1 difficult = $1 unhelpful = $1 obstructive
!{is|was} {a total|a complete|a real|such a|an absolute} {jerk|asshole|dick|prick|douche|douchebag|bastard|dickhead|asshat|wanker|twat|jackass} = $1 really hard to work with = $1 a very challenging collaborator = $1 operating with very low collaboration KPIs
!{dick|dickish|jerk|asshole|douche|douchey} move = unfair move = unfair move = low-integrity play
!{is|was|that's|that was} a {dick|dickish|jerk|asshole|douche|douchey|shitty|bitch|bastard} move = $1 an unfair move = $1 an unfair move = $1 a low-integrity play
!{asshole|jerk|dick|bastard|bitch|douche} {boss|manager|client|customer|coworker|colleague|neighbor|landlord|vendor} = difficult $2 = challenging $2 = low-collaboration $2
!{asshole|jerk|dick|prick|douche|douchebag|bastard|dickhead|asshat|wanker|twat|cunt|fucker|motherfucker|son of a bitch|jackass|fuckwit|fuckface|knobhead|shithead|bellend} = difficult person = challenging colleague = low-collaboration stakeholder
!{assholes|jerks|dicks|pricks|douches|douchebags|bastards|dickheads|asshats|wankers|twats|fuckers|motherfuckers|jackasses|shitheads} = difficult people = challenging colleagues = low-collaboration stakeholders
!lucky {fucker|bastard|bitch|sod} = lucky person = lucky person = fortunate individual
!{is|was} a bitch = $1 really difficult = $1 very challenging = $1 a significant source of friction
!{bitch|complain} about = complain about = raise concerns about = escalate feedback on
!stop {bitching|complaining|whining|moaning} about = stop complaining about = please stop raising concerns about = let's move on from concerns about
!{bitching|complaining} about = complaining about = raising concerns about = escalating feedback on
!{bitches|complains} about = complains about = raises concerns about = escalates feedback on
!{bitched|complained} about = complained about = raised concerns about = escalated feedback on
!bitching = complaining = raising concerns = escalating feedback
!bitchy = short-tempered = curt = low on collaboration energy
!{kiss|kissing|kissed|kisses} my ass = no thanks = I'll pass = that's a hard pass
!{kiss|kissing|kissed|kisses|kisses up to|kiss up to|kissing up to} {ass|the boss's ass|up} = {flatter|flattering|flattered|flatters|flatters|flatter|flattering} the boss = {curry|currying|curried|curries|curries|curry|currying} favor = {manage|managing|managed|manages|manages|manage|managing} up aggressively
!{ass-kisser|ass kisser|kiss-ass|brown-noser|suck-up} = flatterer = flatterer = aggressive upward manager
!{kick|kicking|kicked|kicks} ass = {do|doing|did|does} great = {deliver|delivering|delivered|delivers} strong results = {drive|driving|drove|drives} best-in-class outcomes
!badass = impressive = high-impact = best-in-class
!is a joke and a half-assed one = is rushed and isn't working = is under-baked and isn't landing = is an MVP-grade experience with room to grow
!he's a lazy bastard = he's not pulling his weight = he isn't pulling his weight = he's under-indexing on contribution
!half-assed = rushed = incomplete = MVP-grade
!cover {my|your|our|his|her|their} {ass|asses|butt} = protect {myself|yourself|ourselves|himself|herself|themselves} = document {my|your|our|his|her|their} position = build a robust paper trail
!{work|working|worked|works|bust|busting|busted|busts} {my|our|your|his|her|their} {ass|asses|butt} off = {work|working|worked|works|work|working|worked|works} really hard = {work|working|worked|works|work|working|worked|works} very hard = {operate|operating|operated|operates|operate|operating|operated|operates} at maximum output
!{bust|busting|busted|busts} {my|our|your|his|her|their} {ass|asses|butt} = {work|working|worked|works} really hard = {work|working|worked|works} very hard = {operate|operating|operated|operates} at maximum output
!pain in {the|my|our|your|his|her|their} {ass|arse|butt|backside|rear} = hassle = real hassle = high-friction dependency
!{smartass|smart ass|wiseass} = know-it-all = know-it-all = overconfident contributor
!lazy ass = lazy = lazy = low-output
!sucks ass = isn't great = is frustrating = underindexes on value
!{this|it|that} {sucks|blows} = $1 isn't great = $1 is frustrating = $1 underindexes on value
!{this|it|that} {sucked|blew} = $1 wasn't great = $1 was frustrating = $1 underindexed on value
!{it|this} sucks that = it's unfortunate that = it's disappointing that = it's suboptimal that
!{suck|sucks|sucked|sucking} at = {struggle|struggles|struggled|struggling} with = {struggle|struggles|struggled|struggling} with = {underindex|underindexes|underindexed|underindexing} on
!{suck|sucks|sucked|sucking} it up = {push|pushes|pushed|pushing} through it = {power|powers|powered|powering} through = {lean|leans|leaned|leaning} into the discomfort
!{suck|sucks|sucked|sucking} up to = {flatter|flatters|flattered|flattering} = {curry|curries|curried|currying} favor with = {manage|manages|managed|managing} up aggressively to
!{i|we|you|they} suck at = $1 struggle with = $1 struggle with = $1 underindex on
!{he|she} sucks at = $1 struggles with = $1 struggles with = $1 underindexes on
!i suck = I'm not doing well = I'm struggling = I'm underperforming
!{we|you|they} suck = $1 aren't doing well = $1 are struggling = $1 are underperforming
!{he|she} sucks = $1 isn't doing well = $1 is struggling = $1 is underperforming
!sucks = isn't great = is frustrating = underindexes on value
!sucked = wasn't great = was frustrating = underindexed on value
!blows = isn't great = is frustrating = underindexes on value
!{a|this|the} stupid = $1 silly = $1 less-than-ideal = $1 suboptimal
!{a|this|the} dumb = $1 silly = $1 less-than-ideal = $1 suboptimal
!{the|this} {dumbest|stupidest} = $1 weakest = $1 least viable = $1 most strategically misaligned
!{is|was|are|sounds|seems} {stupid|dumb} = $1 not a good idea = $1 not well thought out = $1 not grounded in first principles
!{bollocks to|fuck|screw|sod} {that|this} idea = I don't support $2 idea = I have concerns about $2 idea = $2 idea isn't on the roadmap
!bollocks to that = I disagree with that = I strongly disagree with that = that doesn't align with our priorities
!{a|one|another} dick move = $1 unfair move = $1 unfair move = $1 low-integrity play
!oh my god = wow = wow = this is a paradigm shift
!{buggered|knackered} = worn out = exhausted = operating on a depleted energy budget
`;

export const CRUDE_SWAPS = expand(PHRASES).join("\n");

// Anything left after the rewrite is crude. Matching is whole word.
const CRUDE_WORDS = [
  String.raw`fuck\w*`, String.raw`\w*fuck(?:er|ers|ing|ed)?`, FUCK_STEM + String.raw`\w*`, String.raw`shit\w*`, String.raw`\w+shit`, String.raw`bullshit\w*`,
  String.raw`crap(?:py|s|load|ton)?`, String.raw`damn\w*`, String.raw`goddamn\w*`, String.raw`goddam+it`, "dammit", "hell", String.raw`ass(?:es)?`, String.raw`arse\w*`, String.raw`asshole\w*`, String.raw`asshat\w*`, "dumbass", "jackass", "badass", "smartass", String.raw`half-ass\w*`,
  String.raw`bitch\w*`, String.raw`bastard\w*`, String.raw`dick(?:s|head|heads|ish)?`, "prick", "pricks", String.raw`cock(?!tails?\b|pits?\b|roach\w*|atoos?\b|ney\w*|erels?\b|les?\b|y\b|ed\b|ing\b)\w*`, String.raw`cunt\w*`, "twat", "twats", String.raw`wanker\w*`, "bollocks", String.raw`bugger\w*`, "knobhead", "bellend", "tosser",
  String.raw`piss\w*`, String.raw`douche\w*`, String.raw`motherf\w*`, String.raw`idiot\w*`, String.raw`moron\w*`, String.raw`(?<!knee-)jerks?`, "stupid", "dumb", "dumbest", "stupidest", String.raw`suck(?:s|ed|y)?`, String.raw`(?<=\b(?:this|it|that) )blows`,
  "wtf", "stfu", "gtfo", "ffs", "fml", "omfg", "lmfao", String.raw`screw(?:ed|ing|s)?(?= (?:this|that|it|you|him|her|them|us|me|up|over|around)\b)`, String.raw`screwed(?=[.!?,]|$)`,
  String.raw`(?<=\b(?:bust\w*|break\w*|suck\w*|kick\w*|ball-?bust\w*) (?:my |our |your |his |her |their )?)balls`, String.raw`ball-?bust\w*`, String.raw`dogshit\w*`,
  String.raw`f+k+(?:i?n'?g?|n)`, "effing", String.raw`fr[ei]+(?:ak|ck|gg)in[g']?`,
];
// An apostrophe after the word still counts: "fuck's sake", "shit'll".
const CRUDE_RE = new RegExp(`(?<![\\w'*])(?:${CRUDE_WORDS.join("|")})(?![\\w*])|${SLUR_RE.source}`, "gi");

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

// Slurs are treated as the insult they are used as, so the insult rewrites handle them. They are never echoed.
export function neutralizeSlurs(text) {
  return String(text ?? "").replace(SLUR_RE, (m) => (/s$/i.test(m) && !/ss$/i.test(m) ? "idiots" : "idiot"));
}

// Last resort, sentence by sentence. Intensifiers and interjections can go without changing the meaning.
// Any other crude word means there is no safe rewrite, so the sentence is left out and reported,
// never swapped word for word into something that reads wrong.
const DROP_INTENSIFIER = /\b(?:fucking|fuckin'?|bloody|goddamn(?:ed)?|damned|damn|motherfucking|freaking|effing)\b\s*/gi;
const DROP_INTERJECTION = /(^|[.!?]\s+)(?:(?:oh|aw|ah)\s+)?(?:fuck|shit|crap|damn(?: it)?|hell|bugger|bollocks)(?:\s+(?:fuck|shit|crap))*\s*[,!.:]+\s*/gi;
export function cleanCrude(text) {
  const dropped = [];
  const lines = String(text ?? "").split("\n").map((line) => {
    const lead = line.match(/^\s*(?:[-*\u2022]\s+|\d+[.)]\s+)?/)[0];
    const kept = [];
    for (const raw of line.slice(lead.length).split(/(?<=[.!?])\s+/)) {
      let s = neutralizeSlurs(raw).replace(DROP_INTERJECTION, "$1").replace(DROP_INTENSIFIER, "").replace(/[ \t]{2,}/g, " ").trim();
      if (!s) continue;
      if (hasCrude(s)) {
        // Round 7: try plain words for the common crude nouns before giving up on the sentence,
        // so a message never comes back empty just because one word had no rewrite.
        const sub = s.replace(/\b(?:shitty|crappy)\b/gi, "poor").replace(/\b(?:bullshit|shit|crap)\b/gi, "stuff")
          .replace(/\bfucked(?: up)?\b/gi, "broken").replace(/\b(?:fucking|fuckin|freaking|goddamn|damn|bloody)\s+/gi, "").replace(/[ \t]{2,}/g, " ").trim();
        if (sub && !hasCrude(sub)) { kept.push(sub[0].toUpperCase() + sub.slice(1)); continue; }
        dropped.push(raw.trim());
        continue;
      }
      kept.push(s[0].toUpperCase() + s.slice(1));
    }
    return kept.length ? lead + kept.join(" ") : "";
  });
  return { text: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), dropped };
}

// True when the output has a crude word the input didn't have. Decoding can be blunt, but it shouldn't start swearing.
export function addsCrude(input, output) {
  const stem = (w) => w.toLowerCase().replace(/(?:ing|in'|ed|er|ers|s|es|y)$/, "");
  const raw = String(input ?? "");
  const had = new Set([...findCrude(raw), ...findCrude(canonicalizeCrude(raw))].map((h) => stem(h.word)));
  return findCrude(String(output ?? "")).some((h) => !had.has(stem(h.word)));
}

// What a crude idiom means, and words a faithful rewrite has to contain. Used to check AI replies,
// and in the tests for Instant output, so "fuck all was done" can never come back as "was completed".
export const IDIOM_MEANINGS = [
  {
    id: "nothing",
    re: /\b(?:fuck|shit|dick|bugger|naff|sod) all\b(?! (?:of you|this|that)\b)|\bjack shit\b|\b(?:diddly|jack)[ -]?squat\b|\b(?:did|does|do|done|doing|know|knows|knew|mean|means|meant|got|get|gets|worth|achieved|accomplished) squat\b/i,
    must: /\b(?:nothing|none|no|zero|not|never|nil|without)\b|n't/i,
  },
  {
    id: "slack-or-leave",
    re: /\b(?:fuck|fucking|fucked|piss|bugger|sod) off\b(?! (?:the|a|an|our|my|your|their|his|her|people|everyone|him|them|us|me|customers?|clients?)\b)/i,
    must: /slack|easy|relax|\brest\b|recharge|low[- ]?(?:output|key|effort|pressure)|downtime|break|unplug|leave|left|head(?:ed|ing|s)? (?:out|home)|went home|going home|early|log(?:ged|ging)? off|space|alone|pause|step back|wind down|deprioriti|low bandwidth|nothing work-related|accomplish nothing/i,
  },
  {
    id: "dont-care",
    re: /\bgive a (?:fuck|shit|damn|crap|rat's ass|toss)\b|\b(?:zero|no) (?:fucks|shits) given\b/i,
    must: /n't|\bnot\b|\bno\b|nobody|no one|care|priorit|less/i,
  },
  {
    id: "mistake",
    re: /(?<!\bthe )\b(?:fuck|screw|cock)(?:ed|ing|s)? (?:(?!the\b)\w+ )?up\b|\b(?:fuckup|screwup|cockup)s?\b/i,
    must: /mess|mistake|ball|mishandl|wrong|error|misstep|learning|botch|blew|broke|fail/i,
  },
  {
    id: "in-trouble",
    re: /\b(?:we're|we are|i'm|i am|you're|they're|we|they|it's|is|are|was) (?:totally |completely |so |royally )?(?:fucked|screwed)\b(?! (?:up|over|around)\b)/i,
    must: /trouble|tough|headwind|risk|problem|broken|bad shape|compromised|difficult|doomed|lost/i,
  },
  {
    id: "not-true",
    re: /\b(?:bullshit|bollocks)\b|\bfull of (?:shit|crap)\b/i,
    must: /nonsense|credible|right|agree|concern|reservation|data|true|accurate|use of (?:our |my |your )?time|driving (?:meaningful )?value|worthwhile|pointless|wrong|mislead|straight|making things up|exaggerat|push(?:ing|ed|es)? back|challeng|transparen|doubt|skeptic|unsupported|needs significant work|runway for improvement|questionable/i,
  },
  {
    id: "bad",
    re: /(?<!-)\b(?:sucks?|sucked|blows|blew)\b(?! (?:up|it up|up to|at)\b)(?!-)/i,
    must: /great|frustrat|underindex|struggl|poor|bad|weak|not good|disappoint|unfortunate|well|terrible|rough|subpar|underperform|issue|problem|not ideal|suboptimal/i,
  },
];

// The idioms in the input whose meaning the output lost. Empty means the meaning survived.
export function lostIdioms(input, output) {
  const inp = canonicalizeCrude(input);
  const out = String(output ?? "");
  return IDIOM_MEANINGS.filter((m) => m.re.test(inp) && !m.must.test(out)).map((m) => m.id);
}
