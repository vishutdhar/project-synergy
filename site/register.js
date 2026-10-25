// Sentence-level register rules for Normal to corporate (see research/corporate-levels spec).
// The phrasebook swaps words. These rules change how a sentence is built, by level:
//   Mild (1): polished professional email. Indirect requests, hedged opinions, professional apologies.
//   Middle Manager (2): Mild plus a framing label on what was said (heads-up, flag, ask), nominalized needs.
//   Full C-Suite (3): strategic framing; the engine adds the lead-in.
// Every rule only reframes what the user wrote. No rule adds a fact, a date, a person, a meeting or a promise.
// Added template words are wrapped in \u0000...\u0001 so the phrasebook pass leaves them alone.

const M = (s) => "\u0000" + s + "\u0001";
const strip = (s) => String(s).replace(/[\u0000\u0001]/g, "");

// Words that can start a sentence and still read right in lowercase after a lead-in.
const LOWERABLE = new Set(("wow yes yeah oh so well happy really thrilled truly the a an this that these those there it it's its our my your their his her we we're we've we'll " +
  "you you're they they're he she everyone everybody someone somebody nobody nothing everything all some no not just also still " +
  "so then now today tomorrow tonight yesterday apparently honestly basically one two three half most none each every any " +
  "here what who when where why how which is are was were do does did can could will would should has have had").split(" "));

// Common words that start sentences and are not names: "Conversion dropped", "Ticket #4821 is still open".
const COMMON_NOUN = /^(?:[a-z]+(?:tion|sion|ment|ness|ity|ance|ence|ings?|ed|ure|ery|ory|ship|work|ware|ets|ers|ies)|that's|there's|here's|what's|who's|it's|ticket|errors|bugs|issues|crashes|incidents|outages|complaints|conversions|leads|users|visits|downloads|installs|refunds|returns|churn|revenue|traffic|usage|uptime|latency|retention|signups|sales|spend|costs?|margin|attendance|engagement|report|server|client|customer|vendor|supplier|team|deadline|budget|meeting|project|design|support|website|release|launch|deploy|build|office|company|board|contract|data|dashboard|email|policy|roadmap|product|app|site|demo|slides|deck|printer|wifi|onboarding|new|old|next|last|first|every|refund|order|invoice|payment|prod|production|staging|traffic|engineering|marketing|sales|legal|finance|security|management|leadership|everybody|nobody|holiday|parking|zoom|tests|qa)$/;
export function lowerFirst(marked, { force = false } = {}) {
  return marked.replace(/^(\u0000?)([A-Z])([\w'-]*)/, (m, mk, c, rest) => {
    const w = (c + rest).toLowerCase();
    if (/^I(?:'m|'ve|'ll|'d)?$/.test(c + rest)) return m;
    if (rest && rest === rest.toUpperCase() && /[A-Z]/.test(rest)) return m; // acronyms: API, PTO
    if (force || LOWERABLE.has(w) || COMMON_NOUN.test(w)) return mk + c.toLowerCase() + rest;
    return m;
  });
}

// Verbs a sentence can open with as an instruction to the reader.
const REQUEST_VERBS = "restock|refill|replace|water|empty|unjam|send|call|check|fix|review|look|update|tell|ask|add|share|book|schedule|cancel|delete|remove|push|merge|finish|sign|approve|submit|print|bring|grab|join|help|confirm|double-check|find|write|fill|order|pay|clean|turn|open|close|restart|install|include|invite|reply|respond|answer|forward|email|text|ping|post|upload|download|print|rename|move|reschedule|resend|re-send|give|show|get|read|test|deploy|ship|stop|quit|keep|remember|make|put|set|leave|come|follow|wait|hold|take|label|tag|file|fill out|note|loop|cc|bcc|unmute|mute|mention|explain|clarify|walk|send over|hand|return|start|try|run|pull|use";
const DECISION_VERBS = "pick|choose|go|skip|drop|cut|kill|stick|ditch|scrap|pause|postpone|delay|push back|wait|just";
const REQ_RE0 = new RegExp(`^(?:just )?(?:${REQUEST_VERBS})\\b`, "i");
// "Call with the Tokyo office at 7am" is a noun, not an instruction.
const REQ_RE = { test: (s) => REQ_RE0.test(s) && !/^\w+ [\w-]+ (?:is|are|was|were)\b/i.test(s) && !/^(?:just )?\w+(?:'s)?\s+(?:with|at|is|was|went|for|from|in|on|about|starts|ends|tomorrow|today|moved|got|has|had)\b/i.test(s) };
const DEC_RE = new RegExp(`^(?:${DECISION_VERBS})\\b`, "i");
const REQ_ME = /^(?:skip|drop|count|leave|take|put|keep|add|remove|sign) (?:me|my)\b/i;
// Opening words that are not instructions even though they look like verbs.
const NOT_IMPERATIVE = /^(?:thanks|thank|welcome|congrats|cheers|love|hate|hope|wish|need|want|guess|looks?|sounds?|seems?|feels?|works?|makes sense|note to self|keep up the|nice|good|great|hold up|wait,? what|get well|have a good|enjoy|happy|take care|follow-?up|update:|test(?:ing)? (?:the|this)?\s*$|set up is|turns out|run(?:ning)? (?:late|behind)|come on)\b/i;

const AUX = /^(?:is|are|was|were|do|does|did|can|could|will|would|should|has|have|had|am|may|might|shall|must|isn't|aren't|wasn't|weren't|don't|doesn't|didn't|can't|won't|wouldn't|shouldn't|hasn't|haven't)$/i;

// Good news: "we hit 10k users", "the demo went great", "migration finished overnight".
const WIN_RE = /\b(?:paid|renewed|under budget|ahead of schedule|went (?:great|well|really well)|hit|closed (?:the|a|an|our) [\w-]+ (?:deal|round|sale|contract)|shipped|launched|finished|landed|signed|won(?!')|(?<!for the )record(?! straight)|loved|saved|done|fixed|green|passed|approved|resolved|nailed|crushed)\b/i;
const NOT_WIN = /\bbut\b|\bhowever\b|n't\b|\b(?:not|no|never|nothing|nobody|no one)\b|\bbut\b.*\b(?:skipped|missed|over budget|broke|late|lost|failed|slipped|cut corners)\b|\b(?:pretty|a bit|still|kinda|kind of|very|a little) green\b|\bbut\b.*\b(?:hate|hates|dislike|wiped|lost|broke|broken|outdated|thin|nobody|no one|complain\w*|failed|crash\w*|deleted|missing|cut|skipped|missed|late|over budget|down)\b/i;
// Problem words for "Flagging that" and "It looks like".
const PROBLEM = /\b(?:broke|broken|down|failing|failed|fails|wrong|bug|bugs|issue|issues|error|errors|crash\w*|outage|blocked|blocker|stuck|missing|lost|late|behind|delayed|overdue|over budget|ran out|out of|slipp\w*|leak\w*|corrupt\w*|not working|doesn't work|isn't working|won't work|can't|cannot|no longer|incorrect|inaccurate|mistake|problem|problems|risk|risky|expired|overrun|underwater|drowning|in trouble|exceeded)\b/i;
const OPINION_ADJ = /^(?:this|that|it|(?:this|that) [\w-]+(?= feels)|the [\w-]+(?: [\w-]+)?|our [\w-]+(?: [\w-]+)?|his [\w-]+|her [\w-]+|their [\w-]+)(?:'s| is| was| are| were| feels| seems| looks)\s+(?:so |really |totally |completely |kind of |kinda |pretty |way |super |just |a bit |too )?(?:a |an )?(?:bad|terrible|awful|horrible|useless|pointless|ridiculous|confusing|messy|mess|disaster|joke|waste|unrealistic|impossible|unclear|vague|weak|wrong|off(?! by)|questionable|overkill|overcomplicated|complicated|too \w+|way too \w+|not (?:great|good|ideal|realistic|clear|enough|ready|worth \w+)|risky|dumb|stupid|silly|insane|crazy|nuts|absurd|meh|mid|underwhelming|great|good|amazing|awesome|fantastic|excellent|solid|brilliant|perfect|nice|cool|smart|clever|ugly|slow|expensive|cheap|hard|easy|tight|aggressive|ambitious|idea|plan|call|cluttered|clunky|busy|dated|bland|generic|wordy|rushed|cramped|inconsistent|hard to (?:read|follow|use)|long|dense|flat|stiff|robotic|cold|harsh)\b/i;
const SARCASM_START = /^(?:ah,? yes|ah,? the |oh,? look|oh,? good|so glad|can't wait|i can't wait|oh,? |wow,? |great,? |perfect,? |awesome,? |fantastic,? |wonderful,? |love (?:that|how|it)|cool,? cool|nice,? |sure,? (?!thing)|yeah,? right|amazing,? |thanks a lot|thanks for nothing|how (?:exciting|fun|wonderful|nice)|what a )/i;
const SOCIAL = /^(?:hi|hey|hello|thanks|thank|ty|thx|welcome|congrats|congratulations|cheers|good (?:morning|afternoon|night|luck)|happy|hope|have a|enjoy|get well|bye|see you|sounds good|ok|okay|sure|yes|yeah|yep|no(?! one\b)|nope|got it|noted|lol|haha|great job|nice work|well done|kudos|shoutout|shout-out|welcome back|sorry for the|apologies|my bad|oops)\b/i;

const IRREG_ING = { see: "seeing", be: "being", lie: "lying", die: "dying", tie: "tying", set: "setting", get: "getting", put: "putting", run: "running", stop: "stopping", plan: "planning", ship: "shipping", cut: "cutting", hit: "hitting", begin: "beginning", swap: "swapping", map: "mapping", drop: "dropping", scrap: "scrapping", wrap: "wrapping", chat: "chatting", prep: "prepping", log: "logging", debug: "debugging" };
export function gerund(v) {
  const w = v.toLowerCase();
  if (IRREG_ING[w]) return IRREG_ING[w];
  if (/ie$/.test(w)) return w.slice(0, -2) + "ying";
  if (/[^aeiou]e$/.test(w) && !/(?:ee|ye|oe)$/.test(w)) return w.slice(0, -1) + "ing";
  return w + "ing";
}
// Verbs that read well as a noun subject: "testing will need more than 2 days".
const NOMINAL_VERBS = /^(?:test|review|finish|ship|build|fix|deploy|launch|migrate|onboard|hire|train|plan|prepare|write|design|integrate|run|set up|clean up|debug|document|validate|verify|audit|staff|scope|price|translate|localize|refactor|rebuild|redesign|update|upgrade|install|configure|analy[sz]e|investigate|close|wrap up|get through|process|reconcile|load|import|export|recruit|interview|code|implement|roll out|backfill|complete|do|cover|handle|support|sort out|figure out|catch up on|clear)\b/i;
const TIME_AMOUNT = /\b(?:\d+|a few|a couple of|several|more|another|extra|two|three|four|five)\b.*\b(?:days?|weeks?|months?|hours?|sprints?|quarters?)\b/i;

const wordCount = (s) => (strip(s).match(/[A-Za-z0-9'$%-]+/g) ?? []).length;

/**
 * Restructure one sentence for a level. `marked` may hold \u0000...\u0001 spans from the crude pass.
 * ctx: { first, solo, item, label: { used: bool }, forceMild }
 * Returns { text, device } where device names the rule that fired ("" when none).
 */
export function restructure(marked, lvl, ctx = {}) {
  const plain = strip(marked);
  // A statement and a question run together with a comma become two sentences, each restructured:
  // "Jamal starts Monday, can someone set up his laptop" -> "Jamal starts Monday. Could someone set up his laptop?"
  if (plain === marked && !ctx.item) {
    const parts = splitClauses(fixFragment(marked));
    if (parts.length > 1) {
      const label = ctx.label ?? { used: false };
      let device = "";
      const out = parts.map((p, i) => {
        const r = restructureOne(p, lvl, { ...ctx, label, first: ctx.first && i === 0, solo: false, later: i > 0 });
        if (r.device) device = device || r.device;
        return r.text;
      });
      return { text: out.join(" "), device: device || "split" };
    }
  }
  return restructureOne(marked, lvl, ctx);
}

function restructureOne(marked, lvl, ctx) {
  const fixed = fixFragment(marked);
  const r = restructureAt(fixed, lvl, ctx);
  if (r.device) return r;
  if (lvl === 3) {
    const r2 = restructureAt(fixed, 2, { ...ctx, label: { used: true } });
    if (r2.device) return r2;
  }
  return fixed !== marked ? { text: fixed, device: "fragment" } : { text: marked, device: "" };
}

const SPLICE_START = "(?:let's|start|go ahead|feel free|ping|text|email|nobody|no one|it's|it is|I'm|I am|we're|we are|they're|that's|I've|I have|there's|he's|she's|my|her|his|our|their|can|could|should|which|what|who|where|when|why|how|is|are|do|does|did|will|would|pack|please|send|call|let me know|(?:cut|trim|shorten|fix|move|add|remove|drop|update|change|make|rewrite|review|check|split|push|tighten|simplify|rename|resend|delete|get|skip|focus|keep|use|try|reuse|switch|go with) (?:it|them|this|that|the|our|my|your|a|an|down|back|out|half|to|some|a|more|less|most|all|on))";
export function splitClauses(text) {
  const t = String(text).trim();
  if (/["\n]/.test(t) || t.split(/\s+/).length > 30) return [t];
  const end = (t.match(/[.!?]+$/) ?? [""])[0];
  const body = t.slice(0, t.length - end.length);
  const re = new RegExp(`^(.{8,}?),\\s+(${SPLICE_START}\\b.{4,})$`, "i");
  let m = body.match(re);
  // Round 10: a sentence adverb is not a clause ("Honestly, I'm bored" stays one sentence).
  if (m && /^(?:honestly|frankly|basically|seriously|actually|candidly|truthfully|to be honest|to be fair|for what it's worth|in case you missed it|as far as I (?:know|can tell)|if I remember correctly|by the way|in short|in my opinion|unfortunately|fortunately|luckily|sadly|anyway|personally|ideally|realistically|of course)$/i.test(m[1].trim())) m = null;
  if (!m) {
    // "why are we building this, nobody asked for it?" -> question, then the statement.
    const qs = end.includes("?") && body.match(/^((?:why|what|how|who|when|where|is|are|can|could|do|does|did)\b.{6,}?),\s+((?:nobody|no one|it's|we|we're|I|I'm|they|this|that's|that)\b.{4,})$/i);
    if (qs && !/,/.test(qs[1])) return [`${qs[1]}?`, `${qs[2][0].toUpperCase()}${qs[2].slice(1)}.`];
    return [t];
  }
  const first = m[1];
  const second = m[2];
  // Keep "if X, Y", "when X, Y", lists and "X, which ..." relative clauses together.
  if (/^(?:if|when|once|after|before|since|because|unless|until|while|although|though)\b/i.test(first) || /^which\b(?! one)/i.test(second) || /,/.test(first)) return [t];
  if (/^(?:but|and|so|or)\b/i.test(second)) return [t];
  const isQ = end.includes("?");
  const firstEnd = ".";
  const secondEnd = isQ ? "?" : end || ".";
  // A trailing question mark belongs to the second part only when that part asks something.
  if (isQ && !/^(?:can|could|should|which|what|who|where|when|why|how|is|are|do|does|did|will|would)\b/i.test(second)) {
    if (/^(?:why|what|how|who|when|where|is|are|can|could|do|does|did)\b/i.test(first)) return [`${first}?`, `${second[0].toUpperCase()}${second.slice(1)}.`];
    return [t];
  }
  if (isQ && /^(?:why|what|how|who|when|where|is|are|can|could|do|does|did)\b/i.test(first)) return [t];
  return [`${first}${firstEnd}`, `${second[0].toUpperCase()}${second.slice(1)}${secondEnd}`];
}

// Fragments with the subject left off: "ran out of budget" -> "We've run out of budget".
function fixFragment(marked) {
  if (strip(marked) !== marked) return marked;
  let t = marked;
  t = t.replace(/^(\s*)running (?=\d|a bit|behind|late)/i, "$1I'm running ");
  t = t.replace(/^(\s*)(dentist|doctor|doctor's|vet|physio|therapy|eye doctor)(?: appointment)? at\b/i, (_m, sp, w) => `${sp}I have a ${w.toLowerCase()} appointment at`);
  t = t.replace(/^(\s*)happy to\b/i, "$1I'm happy to");
  t = t.replace(/^(\s*)so (hyped|excited|pumped|stoked|ready|proud|glad|happy) (for|about|to)\b/i, (_m, sp, w, p) => `${sp}I'm so ${/hyped|pumped|stoked/i.test(w) ? "excited" : w.toLowerCase()} ${p.toLowerCase()}`);
  t = t.replace(/^(\s*)ran out of (?=(?:the )?(?:budget|money|funding|time|headcount|credits|seats|licenses|space|stock|runway)\b)/i, "$1We've run out of ");
  t = t.replace(/^(\s*)(still waiting|halfway (?:done|through)|almost done|nearly done|done with|back from|waiting on|waiting for|working on|stuck on|blocked on)\b/i, (_m, sp, w) => `${sp}I'm ${w.toLowerCase()}`);
  t = t.replace(/^(\s*)(received|recieved|shipped|finished|sent|pushed|merged|fixed|booked|submitted|filed|escalated|updated|reviewed|deployed|signed)\b(?=\s+(?:the|a|an|my|your|v?\d|it|them|this|that|our)\b)/i, (_m, sp, w) => `${sp}I ${w.toLowerCase().replace("recieved", "received")}`);
  t = t.replace(/^(\s*)(deadline|server|build|contract|demo|launch|printer|wifi|meeting|client|budget|deploy|release|site|app|database|report)('s|\s+is|\s+was)\b/i, (_m, sp, n, v) => `${sp}The ${n.toLowerCase()}${v}`);
  // Clause fragments after a comma: ", looking into it" -> ", and I'm looking into it".
  t = t.replace(/,\s+(doing it|doing that|looking into|working on|checking|chasing|digging into|fixing|investigating|on it\b|handling|panicking|borrowing|using|going to|gonna|logging|working from)/i, (_m, w) => `, and I'm ${w.toLowerCase()}`);
  t = t.replace(/,\s+will (\w+)/i, ", and I'll $1");
  t = t.replace(/,\s+((?:\d+|some|most|all|none|one|two|three|four|five|half)(?: of (?:us|them|the \w+|\w+))? (?:are|is|were|was|have|had)\b)/i, ", and $1");
  t = t.replace(/,\s+(sent|shipped|pushed|merged|filed|emailed|forwarded|told|cc'd|uploaded|posted|shared)\b/i, (_m, w) => ` and ${w.toLowerCase()}`);
  t = t.replace(/(^|[.!?]\s+)still (broken|down|not working|failing|open|pending|stuck|blocked|missing|wrong|slow|happening)\b/gi, (_m, p, w) => `${p}${p ? "It's" : "It's"} still ${w.toLowerCase()}`);
  t = t.replace(/,\s+back (by|on|at|in|after|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i, (_m, w) => `, and I'll be back ${w}`);
  t = t.replace(/,\s+(on my (?:phone|laptop|way)|at the (?:doctor|dentist|airport))\b/i, ", and I'm $1");
  t = t.replace(/,\s+been (\d+|a few|a couple of|several) (days?|weeks?|months?|hours?)\b/i, ", and it's been $1 $2");
  t = t.replace(/,\s+no idea why\b/i, ", and I'm not sure why");
  t = t.replace(/,\s+(well deserved|so deserved|much deserved)\b/i, ", it's $1");
  t = t.replace(/,\s+not coming in\b/i, " and won't be coming in");
  return t;
}

function restructureAt(marked, lvl, ctx = {}) {
  const none = { text: marked, device: "" };
  const plain = strip(marked).trim();
  if (!plain || ctx.item || !/[A-Za-z]/.test(plain)) return none;
  const letters = plain.replace(/[^A-Za-z]/g, "");
  if (letters.length > 4 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.8) return none; // shouting
  if (/^["'(]/.test(plain) || /https?:|@/.test(plain)) return none;
  const em = plain.match(/([.!?]+)$/);
  const end = em ? em[1] : "";
  const body = plain.slice(0, plain.length - end.length).trim();
  const clean = marked === plain || strip(marked) === marked; // no crude rewrite inside
  const isQ = end.includes("?");
  const words = wordCount(body);
  const label = ctx.label ?? { used: false };
  const had = label.used;
  const useLabel = (s) => { label.used = true; return M(s); };
  const done = (text, device) => ({ text, device });
  const markedBody = marked.trim().replace(/[.!?]+$/, "");

  // Sarcasm stays sarcasm, in the register of the level: "perfect, the deploy broke on a Friday at 5"
  // -> "Wonderful, ..." / "Love that for us: ..." / "What a growth opportunity: ...".
  {
    const sm = markedBody.match(/^(?:oh,? |ah,? |well,? )?(?:perfect|great|wonderful|fantastic|awesome|good|cool|lovely|excellent|how wonderful|how exciting|how fun|amazing|brilliant)[,!:]\s+(.+)$/i);
    if (sm && clean && !/^(?:thanks|thank|that works|sounds|see you|I'll|let's|we can|you|nice|great|good)\b/i.test(sm[1]) && /\b(?:broke|broken|another|more|again|mandatory|instead|friday|saturday|sunday|weekend|at \d|never|nobody|no one|fail\w*|down|cancel\w*|reorg|meeting|meetings|overtime|deadline|late|outage|alignment|tool|process|approval|survey|email)\b|"/i.test(sm[1])) {
      const lead = ["Wonderful,", "Love that for us:", "What a growth opportunity:"][lvl - 1];
      return done(`${M(lead)} ${lowerFirst(sm[1])}${end || "."}`, "sarcasm");
    }
  }
  if (SARCASM_START.test(body)) return none;

  // One-liners. A whole message that is one short reply gets a level-appropriate full sentence.
  if (ctx.solo && clean) {
    const key = body.toLowerCase().replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();
    const hit = ONE_LINERS[key];
    if (hit) return done(M(hit[lvl - 1]), "one-liner");
  }
  {
    const ih = body.match(/^([A-Za-z][\w ]{1,20}):\s+(\S.*)$/);
    const hit = ih && LIST_HEADERS[ih[1].toLowerCase().trim()];
    if (hit && clean) return done(`${M(hit[lvl - 1])}: ${ih[2]}${end}`, "list-header");
  }
  // List headers: "things that are broken:" -> "Here's what's broken:".
  if (/:$/.test(body) || /:\s*$/.test(plain)) {
    const key = body.replace(/:$/, "").toLowerCase().trim();
    const hit = LIST_HEADERS[key] ?? genericHeader(body.replace(/:$/, "").trim());
    if (hit && clean) return done(M(hit[lvl - 1]) + ":", "list-header");
    return none;
  }

  // A. Apology tacked on the end ("gonna be late sorry"), or leading ("sorry I'm late").
  {
    const tail = body.match(/^(.+?),?\s+(?:sorry|sry|soz|apologies)$/i);
    const lead = body.match(/^(?:sorry|sry|soz),?\s+(?!about\b|for\b|to\b|but\b|if\b|guys\b|all\b|everyone\b|team\b)(.{6,})$/i);
    const rest = clean ? tail?.[1] ?? lead?.[1] : null;
    if (rest && !/\?$/.test(rest) && !/^(?:we're|I'm|we are|I am|so|really|very|truly|we|I)$/i.test(rest.trim())) {
      const r = lowerFirst(rest.trim());
      const restEnd = end && end !== "!" ? end : ".";
      if (lvl === 1) return done(`${M("Apologies,")} ${r}${restEnd}`, "apology");
      if (lvl === 2 && !had && lead && /^(?:this|it) (?!is\b|was\b)/i.test(r)) return done(`${M("Sincere apologies that")} ${r}${restEnd}`, "apology");
      if (lvl === 2 && !had && !/^(?:I'm|I am|I'll|I won't|I can't|I'm unable|we're|we'll|we won't|we can't)\b/i.test(r)) return done(`${M("Sincere apologies,")} ${r}${restEnd}`, "apology");
      if (lvl === 2 && !had) return done(`${useLabel("Quick heads-up, and apologies:")} ${r}${restEnd}`, "apology+label");
      if (lvl === 2) return done(`${M("Apologies:")} ${r}${restEnd}`, "apology");
      return done(`${M("Apologies for the disruption.")} ${capWord(r)}${restEnd}`, "apology");
    }
  }

  if (clean && !isQ) {
    let m;
    if ((m = body.match(/^(?:thanks|thank you|thx|ty)( so much| a lot| again)? for (.+)$/i)) && !/\b(?:nothing|super helpful|very helpful|so helpful|real helpful)\b/i.test(body) && words <= 22) {
      const what = m[2];
      if (lvl === 1) return done(`${M(`Thank you${(m[1] ?? "").toLowerCase()} for`)} ${what}.`, "gratitude");
      const obj = /^[a-z]+ing\b/i.test(what) ? `you ${what}` : what;
      if (lvl === 2) return done(`${M("Really appreciate")} ${obj.replace(/\breally\b/i, "truly")}.`, "gratitude");
      return done(`${M("Huge thanks for")} ${what}.`, "gratitude");
    }
    if ((m = body.match(/^(?:really |truly )?appreciate (.+)$/i))) {
      if (lvl === 1) return done(`${M("I really appreciate")} ${m[1]}.`, "gratitude");
      if (lvl === 2) return done(`${M("Really appreciate")} ${m[1]}${M(", truly")}.`, "gratitude");
      return none;
    }
    if ((m = body.match(/^(?:congrats|congratulations) on (.+)$/i))) {
      if (lvl === 1) return done(`${M("Congratulations on")} ${m[1]}.`, "gratitude");
      if (lvl === 2) return done(`${M("Huge congratulations on")} ${m[1]}!`, "gratitude");
      return none;
    }
    if ((m = body.match(/^good luck (on|with|at|for) (.+)$/i))) {
      if (lvl === 1) return done(`${M("Best of luck")} ${m[1]} ${splitSplice(m[2])}.`, "gratitude");
      return none;
    }
    if ((m = body.match(/^thanks,? (everyone|all|team|folks)\b(.*)$/i))) {
      if (lvl === 1) return done(`${M(`Thank you, ${m[1].toLowerCase()}`)}${m[2]}.`, "gratitude");
      return none;
    }
  }
  if (SOCIAL.test(body) && !isQ) return none;

  // B. Needs. "we need more than 2 days to test" -> "testing will need more than 2 days".
  if (clean && !isQ) {
    const needTo = body.match(/^(we|I) (?:really |still |also |definitely )?need (.+?) to ((?:set up|clean up|wrap up|roll out|get through|sort out|figure out|catch up on|[a-z]+))\b(.*)$/i);
    if (needTo && !/^to\b/i.test(needTo[2]) && NOMINAL_VERBS.test(needTo[3]) && words <= 18) {
      const [, subj, amount, verb, rest] = needTo;
      const noun = verb.split(" ").map((w, i) => (i === 0 ? gerund(w) : w)).join(" ");
      const act = `${noun}${rest}`;
      const S = subj.toLowerCase() === "i" ? "I" : "we";
      if (lvl === 1) return done(`${M(S === "I" ? "I'll" : "I think we'll")} need ${amount} to ${verb}${rest}.`, "hedge-need");
      if (lvl === 2) {
        const core = `${act} will need ${amount}`;
        return done(had ? `${capWord(core)}.` : `${useLabel("Flagging that")} ${core}.`, "nominalize");
      }
      const runway = TIME_AMOUNT.test(amount) ? `a runway of ${amount}` : amount;
      return done(`${capWord(act)} will require ${runway === amount ? amount : M("a runway of") + " " + amount}.`, "nominalize");
    }
    const needToV = body.match(/^(we|I) (?:really |still |also |definitely )?need to (.+)$/i);
    if (needToV && words <= 18) {
      const S = needToV[1].toLowerCase() === "i" ? "I" : "we";
      if (lvl === 1) return done(`${M(S === "I" ? "I'll" : "I think we'll")} need to ${needToV[2]}.`, "hedge-need");
      if (lvl === 2) return done(`${had ? "" : useLabel("Heads-up:") + " "}${M(S === "I" ? "I'll" : "we'll")} need to ${needToV[2]}.`, "need-label");
      return none;
    }
    const needX = body.match(/^(we|I) (?:really |still |also |definitely )?need (?!to\b|help\b|a break\b|a minute\b|a sec\b|some air\b|coffee\b|sleep\b|a vacation\b|a drink\b)(.+)$/i);
    if (needX && words <= 16) {
      const S = needX[1].toLowerCase() === "i" ? "I" : "we";
      const obj = needX[2];
      if (S === "I" && /^(?:the|a|an|my|your|some|more|those|that|this|these|\d|access|feedback|sign-?off|approval|input|eyes)\b/i.test(obj) && !/\bor (?:we|I|it|you|they|else)\b/i.test(obj)) {
        if (lvl === 1) return done(`${M("Could I get")} ${obj}?`, "indirect-request");
        if (lvl === 2) return done(`${had ? "" : useLabel("Quick ask:") + " "}${M(had ? "Could I get" : "could I get")} ${obj}?`, "indirect-request");
        return none;
      }
      if (S === "we") {
        if (lvl === 1) return done(`${M("I think we'll need")} ${obj}.`, "hedge-need");
        if (lvl === 2) return done(`${had ? M("We'll need") : useLabel("Flagging that") + " " + M("we'll need")} ${obj}.`, "need-label");
        return none;
      }
    }
  }

  // B2. "I need you to answer my emails" -> "Could you answer my emails?"
  if (clean && !isQ) {
    let m;
    if ((m = body.match(/^I (?:really )?need (you|someone|somebody|everyone|people|a volunteer|one of you) to (.+)$/i)) && words <= 22) {
      const who = m[1].toLowerCase();
      const lead = who === "you" ? "Could you" : who === "a volunteer" || who === "one of you" ? "Could one of you" : `Could ${who}`;
      if (lvl === 1) return done(`${M(lead)} ${m[2]}?`, "indirect-request");
      if (lvl === 2) return done(`${had ? M(lead) : useLabel("Quick ask:") + " " + M(lead.toLowerCase())} ${m[2]}?`, "indirect-request");
      return none;
    }
    if ((m = body.match(/^you (?:really )?(?:need|have) to (.+)$/i)) && words <= 22 && !/\b(?:see|try|check out|hear)\b this\b/i.test(m[1])) {
      if (lvl === 1) return done(`${M("It would help if you could")} ${m[1]}.`, "softened-directive");
      if (lvl === 2) return done(`${M("My recommendation would be to")} ${m[1].replace(/\byour\b/g, "your")}.`, "softened-directive");
      return none;
    }
    if ((m = body.match(/^(no,? )?(?:I'm|I am) not ([a-z]+ing)\b(.*)$/i)) && !/^going$/i.test(m[2]) || (m = body.match(/^(no,? )?(?:I'm|I am) not (going)\b( to (?:the|a|an|my|our|your|this|that|lunch|work|dinner)\b.*)$/i))) {
      const lead = m[1] ? "No, " : "";
      const restM = splitSplice(m[3]);
      if (lvl === 1) return done(`${M(lead + "I won't be")} ${m[2]}${restM}.`, "future-negative");
      if (lvl === 2) return done(`${had ? "" : useLabel("Heads-up:") + " "}${M((had ? lead : lead.toLowerCase()) + "I won't be")} ${m[2]}${restM}.`, "future-negative");
      return none;
    }
    if ((m = body.match(/^not ([a-z]+ing)\b(.*)$/i)) && words <= 20) {
      const restM = splitSplice(m[2]);
      if (lvl === 1) return done(`${M("I won't be")} ${m[1]}${restM}.`, "future-negative");
      if (lvl === 2) return done(`${had ? "" : useLabel("Heads-up:") + " "}${M("I won't be")} ${m[1]}${restM}.`, "future-negative");
      return none;
    }
    if ((m = body.match(/^(?:I'm|I am) taking (.+)$/i)) && /\b(?:off|day|days|PTO|leave|vacation|week|afternoon|morning|break|holiday)\b/i.test(m[1])) {
      if (lvl === 1) return done(`${M("I'll be taking")} ${m[1]}.`, "future-progressive");
      if (lvl === 2) return done(`${had ? "" : useLabel("Heads-up:") + " "}${M("I'll be taking")} ${m[1]}.`, "future-progressive");
      return none;
    }
    if ((m = body.match(/^(?:thanks|thank you|thx|ty)( so much| a lot| again)? for (.+)$/i)) && !/\b(?:nothing|super helpful|very helpful|so helpful|real helpful)\b/i.test(body) && words <= 22) {
      const what = m[2];
      if (lvl === 1) return done(`${M(`Thank you${(m[1] ?? "").toLowerCase()} for`)} ${what}.`, "gratitude");
      const obj = /^[a-z]+ing\b/i.test(what) ? `you ${what}` : what;
      if (lvl === 2) return done(`${M("Really appreciate")} ${obj}.`, "gratitude");
      return none;
    }
    if ((m = body.match(/^(?:no one|nobody) (is going to|will|wants to|wants|cares about|cares|reads|uses|knows|likes|understands|asked for)\b(.*)$/i))) {
      const verb = m[1].replace(/^is going to$/i, "is going to");
      if (lvl === 1) return done(`${M("I don't think anyone")} ${verb}${m[2]}.`, "hedge-opinion");
      if (lvl === 2) return done(`${had ? "" : useLabel("My two cents:") + " "}${M(had ? "I don't think anyone" : "I don't think anyone")} ${verb}${m[2]}.`, "hedge-opinion");
      return none;
    }
    if ((m = body.match(/^(if\s+\S+\s+.+?)\s+(we|I|it|they|you|this|that)\s+(slip|lose|miss|break|fail|ship|launch|blow|go over|run out)\b(.*)$/i)) && !body.includes(",")) {
      const main = `${m[2]} will ${m[3]}${m[4]}`.replace(/^(we|I|it|they|you) will /i, (_x, p) => `${p.toLowerCase() === "i" ? "I" : p.toLowerCase()}'ll `);
      if (lvl === 1) return done(`${capWord(m[1])}, ${main}.`, "conditional");
      if (lvl === 2) return done(`${had ? "" : useLabel("Flagging a risk:") + " "}${had ? capWord(m[1]) : m[1].replace(/^If/, "if")}, ${main}.`, "conditional");
      return none;
    }
  }

  if (clean && !isQ && words <= 24) {
    const it = body.match(/^I think (?!so\b|not\b)(.+)$/i);
    const yw = it && it[1].match(/^you(?:'re| are) wrong about (.+)$/i);
    if (yw && lvl === 2) return done(`${M("My two cents: I see")} ${yw[1]} a little differently.`, "hedge-opinion");
    if (it && lvl === 2 && !/^I\b/.test(it[1])) return done(`${M("My read is that")} ${it[1]}.`, "hedge-opinion");
    const gj = body.match(/^(?:great|nice|good|awesome|amazing) (?:job|work) (on|with) (.+)$/i);
    if (gj) return done(`${M(["Great work", "Huge kudos", "Massive value-add"][lvl - 1])} ${gj[1]} ${gj[2]}${end === "!" ? "!" : "."}`, "praise");
  }
  // B3. Opinions with should, plans as future progressive, regret on negative news.
  if (clean && !isQ && words <= 24) {
    let m;
    if ((m = body.match(/^we (shouldn't|should not) (.+)$/i))) {
      if (lvl === 1) return done(`${M("I don't think we should")} ${m[2]}.`, "hedge-opinion");
      if (lvl === 2) return done(`${had ? "" : useLabel("My two cents:") + " "}${M("we shouldn't")} ${m[2]}.`.replace(/^(\u0000)we/, "$1We"), "label");
      return none;
    }
    if ((m = body.match(/^we should (.+)$/i))) {
      if (lvl === 1) return done(`${M("I think we should")} ${m[1]}.`, "hedge-opinion");
      if (lvl === 2) return done(`${M("My recommendation would be to")} ${m[1]}.`, "suggestion");
      return none;
    }
    const PLAN = "raising|moving|switching|launching|taking|passing|leaving|resigning|hiring|cutting|closing|starting|ending|dropping|adding|pausing|freezing|rolling out|migrating|shipping|heading|stepping|logging|sunsetting|retiring|changing|reducing|increasing|upgrading|replacing|consolidating|restructuring|introducing|offering|extending|delaying|postponing|cancelling|canceling";
    if ((m = body.match(new RegExp(`^(I'm|I am|we're|we are) (${PLAN})\\b(.*)$`, "i"))) && !/\b(?:now|right now|currently|at the moment|today)\b/i.test(body)) {
      const subj = /^I/i.test(m[1]) ? "I'll be" : "We'll be";
      if (lvl === 1) return done(`${M(subj)} ${m[2]}${splitSplice(m[3])}.`, "future-progressive");
      if (lvl === 2) return done(`${had ? M(subj) : useLabel(subj === "I'll be" ? "Heads-up:" : "Quick heads-up:") + " " + M(subj.replace(/^We/, "we"))} ${m[2]}${splitSplice(m[3])}.`, "future-progressive");
      return none;
    }
    if (/^(?:I|we|I'm|we're|we've|I've|it|this|that|the [\w-]+)\b.*\b(?:can't|cannot|won't be able|don't have|not going to make|not able|aren't able|isn't going to|won't make|not taking|not hiring|couldn't|didn't get|haven't (?:heard|received|had|been able)|missed|lost|won't be ready|isn't ready|aren't ready|over budget|behind)\b/i.test(body) && !/^(?:unfortunately|sadly)\b/i.test(body) && !/\bcan't (?:wait|believe|stop|complain|help|thank)\b|\bcouldn't (?:be happier|ask for|have)\b/i.test(body) && ctx.first) {
      if (lvl === 1) return done(`${M("Unfortunately,")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "regret");
    }
  }

  // C. Instructions.
  if (clean && (!isQ || /^please\b/i.test(body))) {
    const neg = body.match(/^(?:please )?(?:don't|do not|dont|never) (.+)$/i);
    if (neg && words <= 20) {
      const r = markedBody.replace(/^\u0000?(?:please )?(?:don't|do not|dont|never)\u0001?\s+/i, "");
      if (lvl === 1) return done(`${M("Please don't")} ${r}.`, "polite-negative");
      if (lvl === 2) return done(`${had ? "" : useLabel("Quick flag:") + " "}${M(had ? "Please don't" : "please don't")} ${r}.`, "polite-negative");
      return done(`${M("Please don't")} ${r}.`, "polite-negative");
    }
    const sbp = body.match(/^(somebody|someone|anyone),? please,? (.+)$/i);
    if (sbp && REQ_RE.test(sbp[2]) && words <= 22 && !/\band (?:I|I'll|we|we'll|then)\b/i.test(sbp[2])) {
      const r = markedBody.replace(/^\u0000?(?:somebody|someone|anyone)\u0001?,?\s+\u0000?please\u0001?,?\s+/i, "");
      if (r !== markedBody) {
        if (lvl === 1) return done(`${M("Could someone please")} ${lowerFirst(r, { force: true })}?`, "indirect-request");
        if (lvl === 2) return done(`${M("Would someone be able to")} ${lowerFirst(r, { force: true })}?`, "indirect-request");
        return none;
      }
    }
    const split = body.match(/^I'll ([^,]{3,40}), you (\w+)([^,]*)$/);
    if (split && lvl === 1 && !isQ) return done(`${M("I'll")} ${split[1]}, ${M("and you can")} ${split[2]}${split[3]}.`, "polite-split");
    const please = body.match(/^(?:please|pls|plz),? (.+)$/i);
    if (please && REQ_RE.test(please[1]) && words <= 22 && !/,\s*(?:I|we|you|it|they)\b/i.test(please[1]) && !/\band (?:I|I'll|we|we'll|then)\b/i.test(please[1])) {
      const r = markedBody.replace(/^\u0000?(?:please|pls|plz)\u0001?,?\s+/i, "");
      if (lvl === 1) return done(`${M("Could you please")} ${lowerFirst(r, { force: true })}?`, "indirect-request");
      if (lvl === 2) return done(`${had ? M("Could you please") : useLabel("Quick ask:") + " " + M("could you please")} ${lowerFirst(r, { force: true })}?`, "indirect-request");
      return done(`${M("Could you please")} ${lowerFirst(r, { force: true })}?`, "indirect-request");
    }
    const lets = body.match(/^(?:let's|lets|let us) (?!(?:be honest|be real|face it|see|go\b))(.+)$/i);
    if (lets && words <= 18 && !isQ) {
      const r = markedBody.replace(/^\u0000?(?:let's|lets|let us)\u0001?\s+/i, "");
      if (lvl === 1) return done(`${M("I'd suggest we")} ${r}.`, "suggestion");
      if (lvl === 2) return done(`${M("My recommendation would be to")} ${r}.`, "suggestion");
      return none;
    }
    if (!isQ && words <= 20 && !NOT_IMPERATIVE.test(body) && !/,\s*(?:I|we|you|it|they|he|she)\b/i.test(body)) {
      if (DEC_RE.test(body) && !/\b(?:me|my|mine)\b/i.test(body) && !/^just (?:a|an|the|wanted|checking|fyi|so)\b/i.test(body) && !/^go (?:home|away|team)\b/i.test(body)) {
        const r = lowerFirst(markedBody, { force: true });
        if (lvl === 1) return done(`${M("I'd suggest we")} ${r}.`, "suggestion");
        if (lvl === 2) return done(`${M("My recommendation would be to")} ${r}.`, "suggestion");
        return none;
      }
      if ((REQ_RE.test(body) || REQ_ME.test(body)) && !/^let me know\b/i.test(body) && /\band (?:I|I'll|we|we'll|then)\b/i.test(body) && !/^stop\b/i.test(body)) {
        // "send me the invoice and I'll pay it today": a question would swallow the promise, so ask with please.
        const r = lowerFirst(markedBody, { force: true });
        if (lvl === 1) return done(`${M("Please")} ${r}.`, "polite-request");
        if (lvl === 2) return done(`${had ? M("Please") : useLabel("Quick ask:") + " " + M("please")} ${r}.`, "polite-request");
        return none;
      }
      if ((REQ_RE.test(body) || REQ_ME.test(body)) && !/^let me know\b/i.test(body) && !/\band (?:I|I'll|we|we'll|then)\b/i.test(body)) {
        const r = lowerFirst(markedBody, { force: true });
        const urgent = /\b(?:asap|now|immediately|right away|urgent\w*|today|tonight|eod|eow|cob|by \w+|deadline|tomorrow)\b/i.test(body);
        if (ctx.later) {
          if (lvl === 1) return done(`${M("Please")} ${r}.`, "polite-request");
          if (lvl === 2) return done(`${M(/^(?:send|share|submit|update|review|fill|pack|complete|finish|file|book|sign|approve|clean)\b/i.test(body) ? "Please make sure to" : "Please")} ${r}.`, "polite-request");
          return done(`${M("Please")} ${r}.`, "polite-request");
        }
        if (lvl === 1) return done(`${M("Could you")} ${r}?`, "indirect-request");
        if (lvl === 2) return done(`${had ? M("Could you") : useLabel(urgent || /^(?:stop|skip|quit|never|don't)\b/i.test(body) ? "Quick ask:" : "When you get a chance,") + " " + M("could you")} ${r}?`, "indirect-request");
        return done(`${M(urgent ? "As a top priority, could you" : "When bandwidth allows, could you")} ${r}?`, "indirect-request");
      }
      if (/^let me know\b/i.test(body)) {
        if (lvl === 1) return done(`${M("Please")} ${lowerFirst(markedBody, { force: true })}.`, "polite-request");
        return none;
      }
    }
  }

  // D. Questions.
  if (isQ && clean && words <= 22) {
    let m;
    // "wait, are we launching tomorrow??" asks the same thing without the filler.
    const q = body.replace(/^(?:wait|so|ok so|okay so|hmm|um|uh|sorry|quick q|question),?\s+(?=\w)/i, "");
    if (q !== body) return restructureAt(q[0].toUpperCase() + q.slice(1) + "?", lvl, ctx);
    if ((m = body.match(/^(who(?:'s| is)) (going to|[a-z]+ing)\b(.*)$/i))) {
      if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[2]}${m[3]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${m[1].toLowerCase()} ${m[2]}${m[3]}?`, "label");
      return none;
    }
    if ((m = body.match(/^(how (?:long|often|soon|late|early|big|bad)) (is|are|was|were) ((?:this|that|the|our|my|your) [\w'-]+(?: [\w'-]+)?) (going to .+|[a-z]+ing\b.*)$/i))) {
      if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[3]} ${m[2].toLowerCase()} ${m[4]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(how (?:many|much)) ([\w'-]+(?: [\w'-]+)?) (is|are|was|were|have|has|do|does|did|will|can|should)\b(.*)$/i)) && !/^(?:do|does|did|can|should|will)$/i.test(m[3]) || (m = null)) {
      if (m) {
        if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[2]} ${m[3]}${m[4]}?`, "embedded-question");
        if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${m[1].toLowerCase()} ${m[2]} ${m[3]}${m[4]}?`, "label");
        return none;
      }
    }
    // De-inversion with a pronoun subject: "why am I on this thread" -> "why I'm on this thread".
    if ((m = body.match(/^(why|what|where|when|how) (am I|are you|are we|are they|is it|is this|is that|is he|is she|is everyone|is anyone) (.+)$/i)) && !body.includes(",") && (!/(?:this|that)$/i.test(m[2]) || /^(?:[a-z]+ing|so|still|not|on|in|at|for|a|an|the|happening|broken|done|ready|here|there|about|going|even|really|actually|always|never)\b/i.test(m[3]))) {
      const [subjAux] = [m[2].split(" ")];
      const subj = subjAux[1];
      const aux = subjAux[0].toLowerCase();
      const emb = subj === "I" && aux === "am" ? "I'm" : `${subj === "I" ? "I" : subj.toLowerCase()} ${aux}`;
      const lead = m[1].toLowerCase() === "why" ? "Could you help me understand" : "Could you let me know";
      if (lvl === 1) return done(`${M(lead)} ${m[1].toLowerCase()} ${emb} ${m[3]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(how|why|what|where|when) do (I|we|you|they) (.+)$/i))) {
      const how = m[1].toLowerCase();
      const emb = how === "how" && /^(?:I|we)$/i.test(m[2]) ? `how to ${m[3]}` : `${how} ${m[2] === "I" ? "I" : m[2].toLowerCase()} ${m[3]}`;
      const lead = how === "why" ? "Could you help me understand" : "Could you let me know";
      if (lvl === 1) return done(`${M(lead)} ${emb}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(what|how|why|where|when) does ((?:the|this|that|our|my|your) [\w'-]+(?: [\w'-]+){0,2}?|it|this|that|he|she) (start|end|begin|close|open|work|run|happen|launch|expire|ship|mean|cost|take|need|want|say|look|apply|stop|finish|arrive|leave|land|kick|renew|reset|matter|break|fail|come|get|change|affect|include|cover|use|require|compare|differ|fit|help|load|sync|update|count|pay|show|end up)\b(.*)$/i)) && !/^(?:have|do|go|be)$/i.test(m[3])) {
      const v3 = /(?:s|sh|ch|x|o)$/.test(m[3]) ? m[3] + "es" : /[^aeiou]y$/.test(m[3]) ? m[3].slice(0, -1) + "ies" : m[3] + "s";
      const lead = m[1].toLowerCase() === "why" ? "Could you help me understand" : "Could you let me know";
      if (lvl === 1) return done(`${M(lead)} ${m[1].toLowerCase()} ${m[2].replace(/^(\w)/, (c) => (/^(?:It|This|That|He|She|The|Our|My|Your)\b/.test(m[2]) ? c.toLowerCase() : c))} ${v3}${m[4]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(why|how|when|where|what) did ((?:the |our |my |your )?[\w'-]+|we|they|you|he|she|I|it) ([a-z]+)\b(.*)$/i)) && !AUX.test(m[3])) {
      const subj = /^(?:We|They|You|He|She|It|The|Our|My|Your)$/.test(m[2].split(" ")[0]) ? m[2].replace(/^\w/, (c) => c.toLowerCase()) : m[2];
      const lead = m[1].toLowerCase() === "why" || m[1].toLowerCase() === "how" ? "Could you help me understand" : "Could you let me know";
      if (lvl === 1) return done(`${M(lead)} ${m[1].toLowerCase()} ${subj} ${past(m[3])}${m[4]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(how much|how long|how often|what time) (is|are|was|will) (this|it|that|we|they) (.+)$/i))) {
      if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[3].toLowerCase()} ${m[2].toLowerCase()} ${m[4]}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(body, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(?:anyone|any1|does anyone|anybody) (know|have|got|seen|free|around|able)\b(.*)$/i))) {
      if (lvl === 1) return done(`${M("Does anyone happen to")} ${m[1].replace(/^(?:got|seen)$/, (x) => (x === "got" ? "have" : "have seen"))}${m[2]}?`, "indirect-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${M("does anyone")} ${m[1]}${m[2]}?`, "label");
      return none;
    }
    if ((m = body.match(/^where are we (on|with) (.+)$/i))) {
      if (lvl === 1) return done(`${M("Could you let me know where we are")} ${m[1]} ${m[2]}?`, "embedded-question");
      if (lvl === 2) return done(`${useLabel("Quick check-in:")} ${M("where are we")} ${m[1]} ${m[2]}?`, "label");
      return none;
    }
    if ((m = body.match(/^can (we|you|I|someone|somebody|anyone|anybody) (.+)$/i))) {
      const who = m[1].toLowerCase();
      const r = m[2];
      if (lvl === 1) return done(`${M(`Could ${who === "i" ? "I" : who}`)} ${r}?`, "indirect-question");
      if (lvl === 2) {
        const lead = /^(?:with|from|in|on|at|who|that|here|there|else)\b/i.test(r) ? `Could ${who === "i" ? "I" : who}` : /^not\b/i.test(r) ? (who === "you" ? "Could you please" : `Could ${who === "i" ? "I" : who} please`) : who === "we" ? "Would it be possible to" : who === "you" ? "Would you be able to" : who === "i" ? "Would it be possible for me to" : `Would ${who} be able to`;
        return done(`${M(lead)} ${r}?`, "indirect-question");
      }
      const lead = who === "we" ? "Is there an opportunity to" : who === "you" ? "Do you have the bandwidth to" : null;
      return lead ? done(`${M(lead)} ${r}?`, "indirect-question") : none;
    }
    if ((m = body.match(/^(?:will|would) you (?!be\b|mind\b|like\b|rather\b)(.+)$/i))) {
      if (lvl === 1) return done(`${M("Would you be able to")} ${m[1]}?`, "indirect-question");
      if (lvl === 2) return done(`${M("Would you have the bandwidth to")} ${m[1]}?`, "indirect-question");
      return none;
    }
    if ((m = body.match(/^did you (?!mean\b|know\b|hear\b|like\b|enjoy\b|want\b|think\b)([a-z]+)\b(.*)$/i))) {
      if (lvl === 1) return done(`${M("Were you able to")} ${m[1]}${m[2]}?`, "indirect-question");
      if (lvl === 2) return done(`${had ? M("Were you able to") : useLabel("Quick check:") + " " + M("were you able to")} ${m[1]}${m[2]}?`, "indirect-question");
      return none;
    }
    if ((m = body.match(/^do you have (.+)$/i))) {
      if (lvl === 1) return done(`${M("Do you happen to have")} ${m[1]}?`, "indirect-question");
      if (lvl === 2) return done(`${had ? "" : useLabel("Quick question:") + " "}${M(had ? "Do you have" : "do you have")} ${m[1]}?`, "label");
      return none;
    }
    if ((m = body.match(/^any (updates?|news|word|progress|eta)\b(.*)$/i))) {
      const rest = m[2].trim() ? m[2] : " on this";
      if (lvl === 1) return done(`${M(`Is there any ${m[1].toLowerCase() === "eta" ? "ETA" : m[1]}`)}${rest}?`, "indirect-question");
      if (lvl === 2) return done(`${useLabel("Quick check-in:")} ${M(`any ${m[1]}`)}${rest}?`, "label");
      return none;
    }
    // "who approved this?" -> "Could you let me know who approved this?"
    if ((m = body.match(/^(who|which (?:one|team|person|version)) ([a-z]+)\b(.*)$/i)) && !AUX.test(m[2]) && !/'/.test(m[2]) && /(?:ed|es|s)$/.test(m[2])) {
      if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[2]}${m[3]}?`, "embedded-question");
      if (lvl === 2) return done(`${had ? "" : useLabel("Quick question:") + " "}${had ? capWord(m[1]) : m[1].toLowerCase()} ${m[2]}${m[3]}?`, "label");
      return none;
    }
    // "when is the demo?" -> "Could you let me know when the demo is?"
    if ((m = body.match(/^(what|when|where|who|what time)(?:'s| is| are) ((?:the|our|my|your|this|that|their|his|her|[A-Z][\w-]*'s) [\w'-]+(?: [\w'-]+){0,6})$/i)) && !/\b(?:going|happening|up|with|deal|point|plan here)\b/i.test(m[2])) {
      const verb = /\bare\b/i.test(body.split(" ").slice(0, 3).join(" ")) ? "are" : "is";
      // Round 8: "what's the plan if the vendor doesn't deliver" -> "what the plan is if the vendor doesn't deliver".
      const cond = m[2].match(/^(.+?) ((?:if|when|once|unless|in case|after|before|assuming) .+)$/i);
      if (lvl === 1 && cond) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${cond[1]} ${verb} ${cond[2]}?`, "embedded-question");
      if (lvl === 1) return done(`${M("Could you let me know")} ${m[1].toLowerCase()} ${m[2].replace(/ again$/i, "")} ${verb}${/ again$/i.test(m[2]) ? " again" : ""}?`, "embedded-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${lowerFirst(markedBody, { force: true })}?`, "label");
      return none;
    }
    if ((m = body.match(/^(is|are|was|were|does|do|has|have|did|should|could|would|will|isn't|aren't|doesn't|don't|didn't|shouldn't) (.+)$/i)) && !/^(?:is there any way|is it possible|would it be possible|could we|could you|would you|could I|would it|would that|could (?:someone|somebody|anyone|anybody)|would (?:someone|somebody|anyone|anybody))\b/i.test(body)) {
      if (lvl === 1) return done(`${M("Just to check,")} ${m[1].toLowerCase()} ${m[2]}?`, "check-question");
      if (lvl === 2 && !had) return done(`${useLabel("Quick question:")} ${m[1].toLowerCase()} ${m[2]}?`, "label");
      return none;
    }
    if (lvl === 2 && !had && /^(?:what|why|how|when|where|who|which)\b/i.test(body)) {
      return done(`${useLabel("Quick question:")} ${lowerFirst(markedBody, { force: true })}?`, "label");
    }
    return none;
  }
  if (isQ) return none;

  // Feelings and praise are not updates or problems to flag.
  const EMOTION = /\b(?:driving me|drives me|frustrat\w*|annoy\w*|killing me|scares? me|stress\w*|exhaust\w*|love|hate|excited|thrilled|proud|happy|glad|sad|upset|worried|nervous|anxious|insane|crazy|great|amazing|awesome|fantastic|excellent|brilliant|by the way|btw|fried|burnt out|burned out|tired|done with this|so done)\b/i;
  if (!isQ && (/\b(?:by the way|btw)\b/i.test(body) || (EMOTION.test(body) && /\b(?:I|I'm|I've|me|my|you|your|you're)\b/.test(body)))) return none;

  // E. Assessments and problem statements.
  const hasNeg = /\b(?:not|no|never|n't|nothing|nobody|none)\b|n't\b/i.test(body);
  const opinion = OPINION_ADJ.test(body) && !/\b(?:think|feel|believe|guess|seems|looks like|imo|imho)\b/i.test(body);
  const problem = PROBLEM.test(body) && !/\b(?:is live|went live|is back up|(?:dropped|down|fell) to (?:zero|0))\b/i.test(body) && !(/\b(?:churn|costs?|spend|latency|errors|bugs|tickets|incidents|complaints|downtime|(?:response|load|wait|build) times?)\b (?:is |are |was |were )?(?:down|dropped|fell)\b/i.test(body) && !/\bbut\b/i.test(body)) && !(/^(?:I|we) (?:fixed|resolved|repaired|patched|squashed|cleared|addressed|sorted out)\b/i.test(body) && !/\bbut\b|\bstill\b|\bagain\b/i.test(body));
  const subjectOk = !/^(?:running|heading|working|going|looking|waiting|leaving|grabbing|feeling|taking|getting|trying|doing|coming|logging|wrapping|finishing|checking)\b/i.test(body) && !/^[\w']+(?: [\w']+)?,/.test(body) && !/:(?:\s|$)/.test(body) && !/^(?:I|I'm|I've|I'll|I'd|you|you're|if|when|because|so|and|but|or|please|let's|just|oh|wow|ah|ugh|yeah|yes|no|not|cool|great|perfect|nice|thanks|lol|haha)\b/i.test(body) && !REQ_RE.test(body) && /^(?:[^\s]+\s+){0,5}?(?:[\w-]+'(?:s|re|ll|ve|d)|is|are|was|were|has|have|had|will|won't|can't|cannot|isn't|aren't|wasn't|weren't|hasn't|haven't|didn't|doesn't|don't|went|got|fell|rose|grew|broke|came|said|says|sent|keeps|wants|needs|looks|seems|means|[a-z]{3,}ed|[a-z]{3,}s)\b/i.test(body);
  const iStatement = /^(?:I|I've)\s+(?:just\s+|already\s+|accidentally\s+|finally\s+|completely\s+)?(?:[a-z]+ed|sent|got|took|made|ran|went|did|told|left|wrote|built|found|broke|forgot|thought|caught|bought|spent|paid|met|heard|saw|gave|have|had)\b/.test(body) || /^I'm (?:going to be|offline|out|off|in|at|on|working|almost|halfway|blocked|waiting|stuck|free|available|back|heading|leaving|running|wrapping)\b/i.test(body);
  if (words <= 24 && words >= 2 && clean) {
    const negOp = body.match(/^((?:this|that|it|the [\w-]+(?: [\w-]+)?|that [\w-]+|this [\w-]+|our [\w-]+(?: [\w-]+)?)) (is|was|are|were) not (.+)$/i) ?? body.match(/^(that|this|it)('s) not (.+)$/i);
    if (negOp && !/\b(?:think|feel|believe)\b/i.test(body)) {
      const aux = negOp[2] === "'s" ? "'s" : ` ${negOp[2]}`;
      const core = `${lowerFirst(negOp[1])}${aux} ${negOp[3]}`;
      if (lvl === 1) return done(`${M("I don't think")} ${core}.`, "hedge-opinion");
      if (lvl === 2) return done(`${had ? "" : useLabel("My two cents:") + " "}${M(had ? "I don't think" : "I don't think")} ${core}.`, "hedge-opinion");
      return none;
    }
  }
  // Praise gets a kudos label at Middle Manager, never a heads-up.
  const PRAISE = /\b(?:loved? how|lifesaver|saved|nailed|crushed|killed it|thoughtful|great job|great work|amazing|awesome|rock|rocks|star|legend|the best|well done|kudos|shout-?out|proud of|impressive|brilliant|fantastic|stellar|great catch|really sharp|so sharp|did a (?:great|fantastic|excellent) job|(?:really|super|very|so) (?:helpful|useful|clear)|handled [\w' -]{1,30} (?:really |very |so )?well)\b/i;
  if (PRAISE.test(body) && !isQ && !(/^(?:the|our) (?:new )?[\w -]*?\b(?:machine|desks?|chairs?|coffee|weather|food|snacks|kitchen|furniture|lounge|view|music|carpet|lights|fridge|plants?|couch|wifi|parking)\b/i.test(body)) && (!/"|^another\b|\bhow\b/i.test(body) || /^I loved? how\b/i.test(body)) && !/\b(?:not|no|never|n't)\b/i.test(body)) {
    if (lvl === 2 && !had && ctx.first) return done(`${useLabel("Kudos:")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}${end === "!" ? "!" : "."}`, "praise");
    return none;
  }

  if (words <= 24 && words >= 2) {
    if (opinion && ctx.first && !hasNeg && /\b(?:bad|terrible|awful|horrible|useless|pointless|ridiculous|confusing|messy|mess|disaster|joke|waste|unrealistic|impossible|unclear|vague|weak|wrong|off(?! by)|questionable|overkill|overcomplicated|complicated|too|risky|dumb|stupid|silly|insane|crazy|nuts|absurd|meh|mid|underwhelming|ugly|slow|expensive|hard|tight|aggressive|ambitious|idea|plan)\b/i.test(body)) {
      if (lvl === 1) return done(`${M("I think")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "hedge-opinion");
      if (lvl === 2 && !had) return done(`${useLabel("My two cents:")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "label");
      return none;
    }
    if (problem && subjectOk && (ctx.first || lvl !== 2) && !/\b(?:hilarious|funny|lol|haha|joke)\b/i.test(body) && !/^(?:it looks like|looks like|fyi|heads up|flagging|(?:huge |big |many |special )?(?:thanks|thank you|kudos|shout-?out|props)\b)/i.test(body)) {
      if (lvl === 1 && ctx.first && /^(?:my|I|I'm|I've|I'll)\b/i.test(marked.trim()) && !hasNeg && !/\b(?:is live|went live|back up|resolved|fixed)\b/i.test(body)) return done(`${M("Unfortunately,")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "frame");
      if (lvl === 1 && ctx.first && !/^(?:we|they)\b/i.test(body) && !hasNeg && !/\b(?:is live|went live|back up|(?:dropped|down|fell) to (?:zero|0)|resolved)\b/i.test(body)) return done(`${M("It looks like")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "hedge-problem");
      if (lvl === 1 && ctx.forceMild && ctx.first && !/\bbe honest\b/i.test(body)) return done(`${M("Unfortunately,")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "frame");
      if (lvl === 2 && !had) return done(`${useLabel(/^that\b/i.test(body) ? "Quick flag:" : "Flagging that")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}.`, "label");
      return none;
    }
  }

  // Vocative: "everyone, the build is green" -> "Quick heads-up, everyone: the build is green."
  {
    const v = markedBody.match(/^(everyone|all|team|folks|y'all),\s+(.+)$/i);
    if (v && clean && ctx.first && lvl === 2 && !had && !/\?$/.test(plain)) return done(`${useLabel(`Quick heads-up, ${v[1].toLowerCase()}:`)} ${lowerFirst(v[2])}${end === "!" ? "!" : "."}`, "label");
  }

  // Feedback about a habit gets an observation frame, not a bare accusation.
  {
    const fk = body.match(/^you keep (.+)$/i);
    if (fk && clean && !isQ && ctx.first) {
      const rest = marked.trim().replace(/^you keep\s+/i, "").replace(/[.!]+$/, "");
      if (lvl === 1) return done(`${M("I've noticed you keep")} ${rest}.`, "feedback");
      if (lvl === 2) return done(`${M("Some candid feedback: I've noticed you keep")} ${rest}.`, "feedback");
    }
  }

  // F. Framing for plain updates (Middle Manager always for the first one; Mild only when nothing else changed).
  const update = ctx.first && words >= 2 && words <= 30 && !SOCIAL.test(body) && !/^(?:sorry to|that's unfortunate|not today|hard pass|whatever)\b/i.test(body) && !/^\d+ ?(?:min|mins|minutes|sec|secs|hours?)\.?$/i.test(body) && !REQ_RE.test(body) && !DEC_RE.test(body) && !/\b(?:to be honest|be honest|honestly)\b/i.test(body) && !/^(?:I think|honestly|frankly|unpopular opinion|imo|I'd|I would|I'm happy|I'm glad|happy to|glad to)\b/i.test(body) && !/^(?:and|but|or|so|because)\b/i.test(body) && !/^[\w']+(?: [\w']+)?,/.test(body) && !/:(?:\s|$)/.test(body) && !/^(?:running|heading|working|going|looking|waiting|leaving|grabbing|feeling|taking|getting|trying|doing|coming|logging|wrapping|finishing|checking)\b/i.test(body);
  if (update) {
    const personal = /^(?:I|I'm|I've|I'll|I'd|my)\b/.test(body);
    if (lvl === 2 && !had) return done(`${useLabel(/^I hope\b/.test(body) ? "Warm wishes:" : WIN_RE.test(body) && !NOT_WIN.test(body) ? "Quick win:" : personal ? "Heads-up:" : "Quick heads-up:")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}${end === "!" ? "!" : "."}`, "label");
    if (lvl === 1 && ctx.forceMild && (ctx.count ?? 1) <= 2 && (subjectOk || iStatement) && !/^that\b/i.test(body) && !/\bbe honest\b/i.test(body)) {
      // Good news gets "I'm happy to share that"; a plain update gets "Just to let you know," (never the padded "I wanted to let you know that").
      const win = WIN_RE.test(body) && !NOT_WIN.test(body);
      if (/^I\b|^I'/.test(body) && !win) return none;
      return done(`${M(win ? "I'm happy to share that" : "Just to let you know,")} ${lowerFirst(marked.trim().replace(/[.!]+$/, ""))}${end === "!" ? "!" : "."}`, "frame");
    }
  }
  return none;
}

// ", it's way too early" after a clause becomes its own sentence: ". It's way too early".
function splitSplice(rest) {
  return rest.replace(/,\s+(it's|it is|I'm|I am|we're|we are|they're|that's|I've|I have|there's)\b/i, (_m, w) => `. ${w[0].toUpperCase()}${w.slice(1)}`);
}

const ONE_LINERS = {
  "i'll take a look": ["I'll take a look.", "I'll take a look and dig in.", "I'll double-click on this."],
  "ok cool": ["Sounds good.", "Sounds good, I'm aligned.", "Fully aligned on this."],
  "ack": ["Acknowledged.", "Acknowledged, noted on my end.", "Acknowledged and fully aligned."],
  "not this quarter": ["Unfortunately, not this quarter.", "Not this quarter, I'm afraid.", "After careful prioritization, not this quarter."],
  "not this week": ["Unfortunately, not this week.", "Not this week, I'm afraid.", "After careful prioritization, not this week."],
  "not this year": ["Unfortunately, not this year.", "Not this year, I'm afraid.", "After careful prioritization, not this year."],
  "not this sprint": ["Not this sprint, unfortunately.", "That won't fit into this sprint.", "This is out of scope for this sprint."],
  "not interested": ["Thanks, but I'm not interested.", "Not interested, so I'll pass on this one.", "This isn't a fit for our current priorities."],
  "back online": ["I'm back online.", "Heads-up: I'm back online.", "I'm back online and ready to add value."],
  "nvm": ["Never mind.", "Please disregard.", "Please disregard my previous message."],
  "never mind": ["Never mind.", "Please disregard.", "Please disregard my previous message."],
  "lol": ["Ha, that's funny.", "Ha, love that.", "Love the energy here."],
  "haha": ["Ha, that's funny.", "Ha, love that.", "Love the energy here."],
  "ugh": ["That's frustrating.", "Candidly, that's frustrating.", "That's a moment of genuine frustration."],
  "ok thanks": ["Okay, thank you.", "Noted, huge thanks.", "Fully aligned, and deeply grateful."],
  "okay thank you": ["Okay, thank you.", "Noted, huge thanks.", "Fully aligned, and deeply grateful."],
  "sure thing": ["Sure, happy to.", "Absolutely, happy to take this on.", "Absolutely, always happy to add value."],
  "done": ["It's done.", "Quick win: it's done.", "This has been delivered end to end."],
  "I fixed it": ["I've fixed it.", "Quick win: I've fixed it.", "I've remediated this end to end."],
  "i fixed it": ["I've fixed it.", "Quick win: I've fixed it.", "I've remediated this end to end."],
  "i'm burnt out": ["I'm feeling burnt out.", "Candidly, I'm running on empty.", "I'm navigating significant burnout."],
  "i'm quitting": ["I've decided to resign.", "Heads-up: I've decided to move on.", "I've decided to embark on my next chapter."],
  "no": ["No, I'm not able to do that.", "I'm going to have to say no on this one.", "That's a hard no from a strategic standpoint."],
  "nope": ["No, I'm not able to do that.", "I'm going to have to say no on this one.", "That's a hard no from a strategic standpoint."],
  "on it": ["I'm on it.", "On it, and taking ownership of this.", "I'm owning this end to end."],
  "will do": ["Will do, thanks.", "Will do, consider it on my plate.", "Consider it prioritized."],
  "done": ["This is done.", "This is complete on my end.", "This has been fully actioned."],
  "agreed": ["I agree.", "Agreed, I'm aligned on this.", "I'm fully aligned and bought in."],
  "same": ["Same here.", "Same on my end.", "Strong plus-one from my side."],
  "not yet": ["Not just yet.", "Not yet on my end.", "That's not yet actioned on my side."],
  "big if true": ["That's big news if it's true.", "If confirmed, that's a big deal.", "If validated, that's a paradigm-level development."],
  "fair": ["That's fair.", "Fair point, well taken.", "That's a valid strategic perspective."],
  "fair enough": ["That's fair.", "Fair point, well taken.", "That's a valid strategic perspective."],
  "asap": ["ASAP, please.", "Flagging this as ASAP.", "This is an ASAP, top-priority ask."],
  "please": ["Please, if you can.", "Would really appreciate it, please.", "Kindly action this, please."],
  "sure thing": ["Of course.", "Absolutely, happy to.", "Absolutely, fully aligned."],
  "noted": ["Noted, thanks.", "Duly noted.", "Noted and fully acknowledged."],
  "on my list": ["It's on my list.", "It's on my radar.", "It's in my backlog and on my radar."],
  "sounds like a plan": ["That sounds like a good plan.", "Sounds like a plan, and I'm aligned.", "That's a strategic plan I can fully get behind."],
  "looks good to me": ["This looks good to me.", "This looks good from my side.", "This has my full sign-off from a strategic standpoint."],
  "can't talk driving": ["I can't talk right now, I'm driving.", "Heads-up: I'm driving, so I'm unable to talk at the moment.", "I'm in transit and offline from comms at the moment."],
  "hard pass": ["I'll have to pass on this one.", "I'm going to have to pass on this one.", "I'll be respectfully declining this one."],
  "whatever works": ["I'm flexible.", "I'm flexible on this.", "I'm fully outcome-agnostic here."],
  "wait what": ["Wait, what?", "Sorry, could you clarify?", "Could you double-click on that for me?"],
  "that's unfortunate": ["That's unfortunate.", "That's a tough break.", "That's a material setback."],
  "no thanks": ["No, thank you.", "I'll pass, but thank you.", "I'll respectfully pass, but thank you."],
  "love that for us": ["Love that for us.", "Love that for us, truly.", "What a win for the team."],
  "got it": ["Got it, thanks.", "Got it, noted on my end.", "Understood, fully aligned."],
  "thanks": ["Thank you so much.", "Thanks, much appreciated.", "Deeply appreciate the partnership."],
  "thank you": ["Thank you so much.", "Thanks, much appreciated.", "Deeply appreciate the partnership."],
  "who's this": ["Could you let me know who this is?", "Quick question: who is this?", "Could you clarify who this stakeholder is?"],
  "i'm on my way": ["I'm on my way.", "I'm en route.", "I'm in transit."],
  "on my way": ["I'm on my way.", "I'm en route.", "I'm in transit."],
  "i'm on a call": ["I'm on a call at the moment.", "I'm currently in a call.", "I'm heads-down in a call."],
  "no worries": ["No worries at all.", "Totally fine on my end.", "Zero concerns from my side."],
  "yes please": ["Yes, please.", "Yes please, that would be great.", "That's a strong yes, please."],
  "so true": ["That's very true.", "Couldn't agree more.", "That's a strong strategic truth."],
  "yikes": ["That's concerning.", "That's a concerning development.", "That's a material headwind."],
  "ok but why": ["Okay, but could you help me understand why?", "Understood, but quick question: why?", "Aligned, but could you walk me through the why?"],
  "maybe": ["Possibly.", "Potentially.", "That's a possibility worth exploring."],
  "same here": ["Same here.", "Same on my end.", "Strong plus-one from my side."],
  "makes sense": ["That makes sense.", "That makes sense, I'm aligned.", "That tracks with our strategic direction."],
  "good idea": ["That's a good idea.", "Love that idea.", "That's a high-value idea."],
  "nice": ["Nice work.", "Love to see it.", "That's a big win."],
  "cool": ["Sounds good.", "Love it.", "That's a strong outcome."],
  "yes": ["Yes, that works for me.", "Absolutely, I'm aligned.", "That's a strong yes from a strategic standpoint."],
  "yep": ["Yes, that works for me.", "Absolutely, I'm aligned.", "That's a strong yes from a strategic standpoint."],
  "yeah": ["Yes, that works for me.", "Absolutely, I'm aligned.", "That's a strong yes from a strategic standpoint."],
  "sounds good": ["That sounds good to me.", "Sounds good, I'm aligned.", "That's a green light from me."],
  "that's hilarious": ["That's hilarious.", "That's hilarious, love it.", "That's genuinely hilarious. Love the energy here."],
  "that's funny": ["That's funny.", "That's funny, love it.", "That's genuinely funny. Love the energy here."],
  "that works for me": ["That works for me.", "That works for me, I'm aligned.", "That's fully aligned with my priorities. Green light from me."],
  "works for me": ["That works for me.", "That works for me, I'm aligned.", "That's fully aligned with my priorities. Green light from me."],
  "that works": ["That works for me.", "That works for me, I'm aligned.", "That's fully aligned with my priorities. Green light from me."],
  "on it boss": ["I'm on it.", "On it, and taking ownership of this.", "I'm owning this end to end."],
  "understood": ["Understood, thanks.", "Understood, fully aligned.", "Understood and fully aligned."],
  "will check": ["I'll take a look.", "I'll take a look on my end.", "I'll do a deep dive on this."],
  "checking": ["I'm checking now.", "Looking into it on my end.", "I'm doing a deep dive on this."],
};

const LIST_HEADERS = {
  "things that are broken": ["Here's what's broken", "Known issues", "Current pain points"],
  "agenda": ["Here's the agenda", "Agenda items", "Strategic agenda"],
  "options": ["Here are the options", "Options on the table", "Strategic options"],
  "done": ["Completed", "Completed on my end", "Fully actioned"],
  "not done": ["Still open", "Still in flight", "Not yet actioned"],
  "to do": ["Still to do", "Action items", "Key deliverables"],
  "todo": ["Still to do", "Action items", "Key deliverables"],
  "blockers": ["Current blockers", "Blockers to flag", "Critical-path blockers"],
  "next steps": ["Next steps", "Action items", "Strategic next steps"],
  "questions": ["A few questions", "Open questions", "Key open questions"],
  "notes": ["A few notes", "Key notes", "Key takeaways"],
};

const IRREG_PAST = { get: "got", go: "went", lose: "lost", make: "made", take: "took", say: "said", tell: "told", give: "gave", come: "came", do: "did", see: "saw", buy: "bought", pay: "paid", leave: "left", send: "sent", break: "broke", choose: "chose", find: "found", hear: "heard", know: "knew", think: "thought", miss: "missed", become: "became", begin: "began", bring: "brought", build: "built", catch: "caught", forget: "forgot", grow: "grew", hold: "held", keep: "kept", lead: "led", let: "let", put: "put", run: "ran", set: "set", spend: "spent", win: "won", write: "wrote", sell: "sold", stop: "stopped", plan: "planned", ship: "shipped", drop: "dropped", happen: "happened", end: "ended", sign: "signed", agree: "agreed", decide: "decided", hire: "hired", approve: "approved", cut: "cut", hit: "hit", read: "read", fall: "fell", mean: "meant", understand: "understood", eat: "ate", wake: "woke", feel: "felt", meet: "met" };
export function past(v) {
  const w = v.toLowerCase();
  if (IRREG_PAST[w]) return IRREG_PAST[w];
  if (/e$/.test(w)) return w + "d";
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ied";
  return w + "ed";
}

function genericHeader(h) {
  if (!h || h.split(/\s+/).length > 4 || /[,.!?]/.test(h)) return null;
  // Headers that are a clause or a to-do label, not a noun: "need from you", "todo today".
  if (/^(?:i )?need from you$/i.test(h)) return ["Here's what I need from you", "Quick ask, here's what I need from you", "Here's what I need from you"];
  const td = h.match(/^(?:todo|to-do|to do)(?: list)?( today| this week| tomorrow)?$/i);
  if (td) { const when = (td[1] ?? "").trim().toLowerCase(); return [`My plan for ${when || "today"}`, `${when ? when[0].toUpperCase() + when.slice(1) + "'s" : "Today's"} action items`.replace("This week's", "This week's"), `${when ? when[0].toUpperCase() + when.slice(1) + "'s" : "Today's"} strategic priorities`]; }
  const low = h.replace(/^\w/, (c) => (/^[A-Z][a-z]/.test(h) ? c.toLowerCase() : c));
  const tw = h.match(/^(this|last|next) (week|month|quarter|sprint)$|^(today|yesterday|tomorrow)$/i);
  if (tw) { const w = h.toLowerCase(); const poss = /^(?:today|yesterday|tomorrow)$/.test(w) ? `${w}'s` : `${w}'s`; return [`Here's ${poss} update`, `${poss[0].toUpperCase()}${poss.slice(1)} highlights`, `Strategic overview of ${poss} progress`]; }
  if (/^my\b/i.test(h)) return [`Here's ${low}`, `${h.replace(/^my/i, "My")} at a glance`, `Strategic overview of ${low}`];
  if (/^(?:for|by|before|after)\b/i.test(h)) return [`Here's the checklist ${low}`, `Action items ${low}`, `Key deliverables ${low}`];
  const dn = h.match(/^(?:done|completed|finished|shipped)( today| this week| yesterday)?$/i);
  if (dn) { const w = (dn[1] ?? "").trim().toLowerCase(); return [`Completed${w ? " " + w : ""}`, `Delivered${w ? " " + w : ""}`, `Wins${w ? " " + w : ""}`]; }
  const headWord = (h.match(/^([\w-]+)(?= (?:for|from|about|on|in|with|to)\b)/) ?? [null, h.split(/\s+/).pop()])[1];
  const plural = /s$/i.test(headWord);
  return [`Here ${plural ? "are" : "is"} the ${low}`, `${h[0].toUpperCase()}${h.slice(1)} at a glance`, `Strategic overview of the ${low}`];
}

function capWord(s) {
  return s.replace(/^(\u0000?)([a-z])/, (_m, mk, c) => mk + c.toUpperCase());
}

// ---------- Distinctness ----------
const toks = (s) => strip(s).toLowerCase().replace(/[^a-z0-9$%' ]/g, " ").split(/\s+/).filter(Boolean);
export function tokenSim(a, b) {
  const A = toks(a), B = toks(b);
  const n = Math.max(A.length, B.length);
  if (!n) return 1;
  let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[B.length] / n;
}

// Corporate markers by strength. Score = sum of weights.
const MARKERS = [
  [1, /\b(?:could you|could we|could I|would you|please|apologies|I think|I'd suggest|just to check|it looks like|I wanted to|running a bit behind|do you happen to|were you able to|I'm not able to|I won't be able to|let me know|thank you|I'm not sure|I see it|I'd prefer|unfortunately|frustrated|issue|appreciate)\b/gi],
  [2, /\b(?:heads-up|flag\w*|bandwidth|aligned?|alignment|circle back|action items?|loop(?:ed)? in|would it be possible|my recommendation|quick ask|quick question|quick check(?:-in)?|my two cents|on my end|capacity|blocker|timeline|deliverables?|status update|sync|ETA|prioriti\w*|per|touch base|on (?:everyone's|the) radar|in the loop|for awareness|plate is full|heads down|offline|take this offline|stakeholders?|resourc\w*|initiative|learning|ownership|visibility|deprioriti\w*|green light|on board|behind schedule|runway|ramp(?:ed)?|squad|pod|underwhelming|questionable|realign|leverage|bandwidth)\b/gi],
  // Round 10 composer vocabulary.
  [3, /\b(?:ecosystem|stakeholders?|transparent(?:ly)?|radical transparency|strategic|infrastructure|mission-critical|shareholder value|vulnerability|leadership competency|over-leveraged|capacity envelope|fiscally|nourishment|caffeine|frontier|landmark|milestone|scorecard|aspiration\w*|enabler|low-power mode|deliverable|enablement|innovation|roadmap|excellence|time-critical|workplace-experience|technology stack|stakeholder-related|knowledge ecosystem|calendar-density|schedule-density|thought leadership|scope-agility|headwind)\b/gi],
  [3, /\b(?:keen|perspective|clarity|partnership|grateful|deeply|headwinds?|landscape|30,000-foot|journey|flywheel|best-in-class|thought partner\w*|runway|high-performing|recogni\w+|pressure-tested|net-net|level-setting|double-clicking|highest-leverage|laser-focused|operational excellence|value creation|diversity of thought|psychological safety|investment envelope|right-sized|realigned|accountability|resilience|excellence|greatly appreciated|go ahead and|ecosystem|healthy debate|growth|celebrate|thrilled|humbled|surface|strategic\w*|north star|synerg\w*|paradigm|thirty-thousand-foot|big picture|visionary|radical candor|radical transparency|steward|servant leader|value-\w+|move the needle|lean in|momentum|onward|velocity|roadmap|holistic\w*|ecosystem|operationaliz\w*|optimi[sz]\w*|KPIs?|OKRs?|deliverable|cross-functional|verticals?|outcome-\w+|bandwidth|growth opportunit\w*|learning opportunit\w*|is there an opportunity|do you have the bandwidth|require|dynamic timeline|full visibility|mission-critical|best-in-class|world-class|scal\w+|unlock\w*|empower\w*|ideat\w*|actioned|end user|endpoint|total rewards|highlight reel|discomfort|opportunit(?:y|ies) in disguise|setup for a comeback|strong opinions|loosely held|iron sharpens iron|whole self|empty cup|sustainable performance|long game|forward, with humility|with humility|dream work|vision meets execution|rockstar|underindex\w*|culture|core priorities|collective focus|driving value|milestone|thought leadership|chapter|failing forward|gift-wrapped|feedback is a gift|stay aligned|recharge|untapped|non-negotiable|stakeholder commitment)\b/gi],
];
export function corporateScore(text) {
  let s = 0;
  for (const [w, re] of MARKERS) s += w * ((String(text).match(re) ?? []).length);
  return s;
}

/**
 * Distinctness of the three levels for one input.
 * input: the user's text after shorthand clean-up. outs: [mild, middle, csuite].
 * Returns a list of problems: "flat-mild", "mild=middle", "middle=csuite", "not-rising".
 */
export function distinctness(input, outs) {
  const [l1, l2, l3] = outs;
  const probs = [];
  if (tokenSim(input, l1) >= 0.9 && corporateScore(l1) <= corporateScore(input)) probs.push("flat-mild");
  if (tokenSim(l1, l2) >= 0.95) probs.push("mild=middle");
  if (tokenSim(l2, l3) >= 0.95) probs.push("middle=csuite");
  const s = outs.map(corporateScore);
  if (!(s[0] <= s[1] && s[1] <= s[2] && s[2] > s[0])) probs.push("not-rising");
  return probs;
}

// Clean-up after the phrasebook pass, for joins the two passes create.
export function polishRegister(text) {
  return String(text)
    .replace(/\b(able to|Could you|could you|Would you|would you) please (please|kindly) /g, "$1 please ")
    .replace(/\bbe able to (?:please|kindly) /g, "be able to ")
    .replace(/\bplease kindly\b/gi, (m) => (m[0] === "P" ? "Please" : "please"));
}
