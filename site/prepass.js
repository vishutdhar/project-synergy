import { hasCrude } from "./profanity.js";

// Input pre-pass for Normal to corporate (see shortfalls/research.md).
// Runs on the cleaned input before the level rules, so every level starts from a sincere, well-formed message:
// 1. sarcasm becomes the sincere complaint underneath it ("great, another meeting" -> "I'm concerned about another meeting"),
// 2. run-on apologies become apology + reason + request sentences,
// 3. a dropped article on a bare singular subject comes back ("support queue is at 450" -> "The support queue is at 450").

const POS = "(?:I )?love that for us|(?:I )?love that for me|(?:I )?love this for us|great|awesome|wonderful|fantastic|brilliant|perfect|cool|nice|yay|lovely|amazing|super|excellent|classic|fun|sweet|wow|oh joy|oh good|oh cool|oh great|oh wonderful|oh perfect|oh nice|oh fun|joy";
const SARC_LEAD = new RegExp(`^(?:oh,? |ah,? |well,? )?(?:${POS})(?:[,.!:]+|\\s*-)\\s+(.+)$`, "i");
const NEG_CUE = /\b(?:another|more|again|broke|broken|down|fail\w*|cancel\w*|ghost\w*|mandatory|nobody|no one|never|ate|lost|crash\w*|late|reorg|survey|paperwork|deadline|changed|instead|weekend|overtime|friday|saturday|sunday|\d+\s?(?:am|pm)|now (?:they|the|he|she)|wants?)\b/i;
const IRREGULAR_PAST = { tell: "told", give: "gave", send: "sent", let: "let", make: "made", schedule: "scheduled", book: "booked", cancel: "cancelled", move: "moved", change: "changed", ask: "asked", add: "added", warn: "warned", invite: "invited", email: "emailed" };

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
function lowFirst(s) {
  return /^(?:I|I'm|I've|I'll|I'd)\b/.test(s) || /^[A-Z]{2,}/.test(s) || /^[A-Z][a-z]+(?=\s)/.test(s) && /^(?:[A-Z][a-z]+)$/.test(s.split(/\s/)[0]) && !/^(?:The|A|An|This|That|These|Those|My|Our|Your|Their|His|Her|We|They|He|She|It|There|Now|Nobody|No|Prod|Another|More)\b/.test(s) ? s : s[0].toLowerCase() + s.slice(1);
}
const end = (s) => (/[.!?]$/.test(s) ? s : s + ".");
const strip = (s) => s.replace(/[.!?]+$/, "").trim();

/** Sarcasm -> sincere meaning. Returns the rewritten sentence or null. */
export function desarcasm(sentence) {
  const s = strip(sentence);
  let m;
  if (/^love that for (?:us|me|you)$/i.test(s)) return "That's not ideal for us.";
  if ((m = s.match(/^(?:sorry|oops|my bad)(?:,? sorry)?,? wrong (channel|chat|thread|person|window|room|link|file)$/i))) return `Sorry, that was meant for a different ${m[1]}.`;
  if (/^(?:perfect|great) timing(?: as usual| again)?$/i.test(s)) return "The timing isn't ideal.";
  if ((m = s.match(/^(?:cool,? )+(?:I )?guess I'll (?:just )?(.+?)(?: myself)?$/i)) || (m = s.match(/^(?:cool cool cool|cool cool|great|fine),? (?:I )?guess I'll (?:just )?(.+?)(?: myself)?$/i))) {
    const v = m[1].replace(/^do it$/i, "take care of it");
    return `Understood. I'll ${v} myself.`;
  }
  if ((m = s.match(/^(?:I )?can't wait for (?:the |a |an )?(.+)$/i))) return `I'm not thrilled about the ${m[1]}.`;
  if ((m = s.match(/^nothing says (?:teamwork|team spirit|culture|work-life balance|fun) like (?:a |an |the )?(.+)$/i))) return `I'm not thrilled about a ${m[1]}.`;
  if ((m = s.match(/^sure,? (?:I'll|I will) just (.+?)(?:,? (?:no problem|no worries|fine|sure|great|then|easy))*$/i))) return `I'm not happy about having to ${m[1]}.`;
  if ((m = s.match(/^(?:sure,? )?let's just (.+?),? what could (?:possibly )?go wrong$/i))) return `I'm concerned about the risk if we ${m[1]}.`;
  if ((m = s.match(/^just what I needed,? (.+)$/i))) return `I have ${m[1].replace(/^(?:a|an|the) /i, (a) => a.toLowerCase())}, which isn't ideal.`;
  if ((m = s.match(/^(?:how )?nice of (them|him|her|you|leadership|management|IT|HR) to (\w+) (.+)$/i))) {
    const who = /^(?:them|him|her|you)$/i.test(m[1]) ? { them: "they", him: "he", her: "she", you: "you" }[m[1].toLowerCase()] : m[1];
    const v = IRREGULAR_PAST[m[2].toLowerCase()] ?? m[2].replace(/e?$/, "ed");
    return `Unfortunately, ${who} only ${v} ${m[3]}.`;
  }
  if ((m = s.match(/^(?:thanks|thank you) (?:a lot|so much) for (?:the |a |an )?(.+?\b(?:friday|saturday|sunday|weekend|\d+\s?(?:am|pm)|late|last[- ]minute)\b.*)$/i))) return `I'm not thrilled about the ${m[1]}.`;
  if ((m = s.match(/^so glad (we|they|I) (.+\b(?:nobody|no one|never|nothing|wasted)\b.*)$/i))) return `Unfortunately, ${m[1] === "I" ? "I" : m[1]} ${m[2]}.`;
  if ((m = s.match(/^(?:wow,? |oh,? )?(.+?),? (?:what a miracle|for once|shocking|who knew|imagine that)$/i))) return `${cap(m[1])}.`;
  if ((m = s.match(SARC_LEAD))) {
    let rest = m[1].trim();
    if (/^(?:thanks|thank|that works|sounds|see you|I'll|let's|we can|you|nice|great|good|job|work|news|idea|point|question|catch|call|team)\b/i.test(rest)) return null;
    if (!NEG_CUE.test(rest)) return null;
    rest = rest.replace(/^just /i, "").replace(/^now,? (the|they|he|she|we) (\w+) (\w+)/i, (_m, a, b, c) => (a.toLowerCase() === "the" ? `the ${b} now ${c}` : `${a} now ${b} ${c}`));
    const am = rest.match(/^(?:another|more|yet another) (.+)$/i);
    if (am) return `I'm concerned about ${/^more\b/i.test(rest) ? "the extra" : "yet another"} ${am[1]}.`;
    // A clause (has a verb) is a complaint; a bare noun phrase is something they're not keen on.
    if (/^(?:nobody|no one)\b/i.test(rest)) return `It looks like ${rest}.`;
    if (/\b(?:is|are|was|were|has|have|had|got|went|moved|changed|broke|failed|cancel\w*|ghosted|ate|lost|crashed|wants?|needs?|read|said|did|didn't|won't|can't|doesn't|isn't|aren't|keeps?|missed|forgot|left|added|dropped|pushed|shipped|took|died|stopped|deleted)\b/i.test(rest)) {
      return `Unfortunately, ${lowFirst(rest)}.`;
    }
    return `I'm not thrilled about the ${rest.replace(/^(?:the|a|an) /i, "")}.`;
  }
  return null;
}

// Apology run-on: "sorry I'm late traffic was awful can you send me the notes".
const APOLOGY = /^(?:so |very |really )?(?:sorry|apologies|my bad|my apologies|oops)\b/i;
// First clause start after position 0 (the lookbehind needs the full string, so no slicing).
const nextClause = (str) => {
  const re = new RegExp(CLAUSE_START.source, "gi");
  let m;
  while ((m = re.exec(str))) { if (m.index > 0) return m.index; re.lastIndex = m.index + 1; }
  return -1;
};
const CLAUSE_START = /(?<!\b(?:I'm|am|are|we're|is|was|I|in|on|at|of|the|my|a|an|to|for))\s(?=(?:traffic\b|(?:the|my) (?:train|bus|traffic|wifi|internet|kid|son|daughter|car|flight|laptop|power)\b|I was\b|I'm\b|I am\b|I got\b|I overslept\b|I forgot\b|I didn't\b|I did not\b|I missed\b|I'll\b|I will\b|something\b|can you\b|could you\b|can we\b|could we\b|can I\b|could I\b|please\b|what do you\b|should be\b|it's\b|it was\b|was out\b|we need\b|kid\b|but\b|was (?:driving|in a|on a|on the|at the|at a|busy|sick|stuck|asleep|away|offline|travel\w*|out)\b|(?:the|my|our|this|that) [\w-]+ (?:is|was|are|were|has|had|didn't|isn't|wasn't|got)\b|(?:restoring|fixing|working on|looking into|rolling back|reverting|redoing|resending|updating|sending|on it)\b|it should\b|it says\b|that should\b|did you\b|do you\b|have you\b|are you\b|is it\b|is there\b))/i;
export function splitApology(sentence) {
  const s = strip(sentence);
  if (!APOLOGY.test(s) || /[.!?]\s/.test(s)) return null;
  const words = s.split(/\s+/).length;
  if (words < 5) return null;
  // Split at clause starts after the apology head.
  const head = s.match(/^(?:so |very |really )?(?:sorry|apologies|my bad|my apologies|oops)(?: sorry)?(?: (?:for|about) (?:the |my |a |being )?[\w'-]+(?: (?!I\b)[\w'-]+)?(?= I\b| I'm\b| was\b| can\b| could\b| what\b| but\b|,|$)| to (?:be a pain|bother you|interrupt|bug you|nag)(?: again)?(?= but\b|,|$| did\b| do\b| have\b| can\b| could\b| are\b| is\b))?/i)?.[0] ?? "";
  let rest = s.slice(head.length).replace(/^,?\s*/, "");
  let apology = head.trim().replace(/,$/, "");
  const cm = s.match(/^((?:so |very |really )?(?:sorry|apologies|my bad|my apologies) (?:for|about) [^,]{3,60}),\s*(.+)$/i);
  if (cm) { apology = cm[1]; rest = cm[2]; }
  rest = rest.replace(/^(?:but|and|so),?\s+/i, "");
  // "sorry for the typo in the email it should say ..." -> the apology runs up to the next clause.
  if (/^(?:for|about)\s/i.test(rest) && !cm) {
    const k = nextClause(rest);
    if (k > 0) { apology = `${apology} ${rest.slice(0, k).trim()}`; rest = rest.slice(k + 1); }
  }
  if (!rest) return null;
  const parts = [];
  let cur = rest;
  for (let guard = 0; guard < 4; guard++) {
    const idx = nextClause(cur);
    if (idx < 0) break;
    parts.push(cur.slice(0, idx).trim());
    cur = cur.slice(idx + 1);
  }
  parts.push(cur.trim());
  // A piece with no verb ("the train", "what") belongs to the next piece.
  const VERB = /\b(?:is|was|are|were|am|has|had|have|got|get|did|do|does|can|could|will|would|should|need|needs|want|wants|see|say|says|think|know|missed|forgot|overslept|deleted|broke|sent|lost|left|made|took|ran)\b|'(?:m|s|re|ll|ve|d)\b|n't\b|\b[a-z]{3,}ed\b|\b[a-z]{3,}ing\b/i;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!VERB.test(parts[i])) { parts.splice(i, 2, `${parts[i]} ${parts[i + 1]}`); i--; }
  }
  const clauses = parts.map((p) => p.replace(/^(?:but|and|so),?\s+/i, "").replace(/,$/, "").replace(/^(?:was|got|am) /i, "I $&").replace(/^should be /i, "It should be ").replace(/^(?:restoring|fixing|working on|looking into|rolling back|reverting|redoing|resending|updating|sending) /i, (m) => `I'm ${m.toLowerCase()}`).replace(/^on it\b/i, "I'm on it")).filter((p) => p && !/^(?:but|and|so)$/i.test(p));
  if (!clauses.length) return null;
  if (clauses.length === 1 && !/^I\b|^I'/.test(clauses[0]) && !/\b(?:for|about|to)\b/i.test(apology)) return null;
  apology = apology.replace(/^my bad\b/i, "sorry");
  const out = [];
  const isQ = (c) => /^(?:can|could|would|will|what|when|where|who|how|is|are|do|does|did|have)\b(?!')/i.test(c);
  const clauseLike = (c) => /^(?:I\b|I'|(?:the|my|our|this|that) [\w-]+ (?:is|was|are|were|has|had|didn't|isn't|wasn't|got)\b)/i.test(c);
  if (clauseLike(clauses[0]) && !isQ(clauses[0]) && /^(?:so |very |really )?(?:sorry|apologies)$/i.test(apology)) {
    out.push(`${cap(apology)}, ${clauses.shift()}.`);
  } else out.push(`${cap(apology)}.`);
  if (out.length === 1 && !clauses.length && !/,/.test(out[0])) return null;
  for (const c of clauses) out.push(isQ(c) ? `${cap(c)}?` : `${cap(c)}.`);
  return out.join(" ");
}

// Bare singular subject: "support queue is at 450" -> "The support queue is at 450".
const FINITE = "comes|come|goes|paid|works|worked|asked|replied|is|changed|arrived|arrives|arrive|expires|expired|opened|closed|ended|ends|leaked|is|was|isn't|wasn't|has|hasn't|had|got|keeps|kept|looks|looked|went|ran|runs|shows|showed|needs|wants|says|said|finished|failed|starts|started|broke|crashed|died|smells|takes|took|cost|costs|seems|loves|loved|called|calls|hates|doubled|tripled|dropped|went|came|will|won't|can't|should|still|just|keeps|refuses|is still|has been|got moved|is out|is down";
const BARE_SUBJECT = new RegExp(`^((?:[a-z][a-z0-9-]+ ){0,2}[a-z][a-z-]+(?<!s))(?: (?:on|in|at|from|for|of|with|about|to) (?:the |a |an )?(?:\\d+\\w* )?[a-z][a-z-]+(?: [a-z][a-z-]+)?)? (?=(?:${FINITE})\\b)`);
const NOT_HEAD = /^(?:sorry|apologies|oops|my bad|i|we|you|they|he|she|it|this|that|these|those|there|here|everything|everyone|everybody|nobody|nothing|someone|something|anyone|anything|what|who|whose|whom|why|how|where|when|which|my|our|your|their|his|her|its|the|a|an|no|any|some|each|every|all|both|traffic|weather|money|payroll|lunch|dinner|breakfast|coffee|internet|prod|production|staging|email|slack|jira|github|google|everything|stuff|life|work|time|it|today|tonight|tomorrow|yesterday|mom|dad|management|leadership|legal|finance|hr|marketing|sales|engineering|support|security|design|ops|it|qa|sarcasm|food|parking|attendance|morale|pay|rent|tax|stock|revenue|churn|demand|velocity)$/i;
export function restoreArticle(sentence) {
  const m = sentence.match(BARE_SUBJECT);
  if (!m) return sentence;
  const words = m[1].split(" ");
  if (NOT_HEAD.test(words[0]) && words.length === 1) return sentence;
  if (/^(?:is|are|was|were|do|does|did|can|could|will|would|should|has|have|had|am|i|we|you|they|he|she|it|this|that|there|my|our|your|their|the|a|an|no|any|some|every|all|what|who|whose|whom|why|how|where|when|which|just|so|and|but|also|still|maybe|please|let's|lets|pls)$/i.test(words[0])) return sentence;
  // Gerunds and adverbs are not count nouns ("testing is slow", "really is").
  if (/ing$|ly$/i.test(words[words.length - 1]) && words.length === 1) return sentence;
  // A head that is a known mass noun or team name keeps no article.
  if (NOT_HEAD.test(words[words.length - 1])) return sentence;
  if (/^(?:kid|son|daughter|wife|husband|partner|dog|cat|car|laptop|phone|flight|train|mom|dad|internet|power)$/i.test(words[words.length - 1]) && words.length === 1) return `my ${sentence}`;
  return `the ${sentence}`;
}

export function prepass(clean) {
  // Line by line so lists keep their shape. Only prose lines are touched.
  return clean.split("\n").map((line) => {
    if (/^\s*(?:[-*\u2022]|\d{1,2}[.)])\s+/.test(line) || !line.trim()) return line;
    const lead = line.match(/^\s*/)[0];
    let t = line.trim().replace(/\bbug (you|me|him|her|them)\b/gi, "bother $1").replace(/^(fun|classic|great|awesome|perfect|lovely|wonderful|cool|nice|brilliant)[.!]+\s+(?=[a-z])/i, "$1, ");
    const sents = t.split(/(?<=[.!?])\s+(?=[A-Za-z])/);
    t = sents.map((s, i) => {
      const sar = desarcasm(s);
      if (sar) return sar;
      const ap = splitApology(s);
      if (ap) return ap;
      s = s.replace(/^(?:heads up|heads-up|fyi|psa)[,:-]?\s+/i, "");
      let mm;
      if ((mm = s.match(/^(this|that|the) (meeting|call|sync|plan|process|policy|idea|decision|code|doc|deck|report|design|email|update|review) is (?:total |complete |absolute )?(?:bullshit|bs|garbage|trash|junk|rubbish|crap|pointless|useless)[.!]*$/i))) {
        const n = mm[2].toLowerCase();
        return /^(?:meeting|call|sync|review)$/.test(n) ? `I don't think ${mm[1].toLowerCase()} ${n} is a good use of our time.` : `I think ${mm[1].toLowerCase()} ${n} needs significant work.`;
      }
      if ((mm = s.match(/^(?:screw it|fuck it|whatever|eh),? (ship|send|merge|launch|post|push|publish|release) it[.!]*$/i))) return `Let's go ahead and ${mm[1].toLowerCase()} it.`;
      if ((mm = s.match(/^no idea,? ask ([A-Z][a-z]+)[.!]*$/))) return `I'm not sure. ${mm[1]} may know.`;
      s = s.replace(/,\s*no idea[.!]*$/i, ". I'm not sure.").replace(/^(that's a (?:great|good) question)[.!]?$/i, "$1.");
      if ((mm = s.match(/^(?:I'll )?hard pass on (.+?)[.!]?$/i))) return `I'll have to pass on ${mm[1]}.`;
      if ((mm = s.match(/^no (raises|bonuses|hiring|offsite|budget|merit increases|promotions) (this|next) (year|quarter|month|cycle)[.!]?$/i))) return `There won't be ${mm[1].toLowerCase() === "hiring" ? "any hiring" : mm[1].toLowerCase()} ${mm[2].toLowerCase()} ${mm[3].toLowerCase()}.`;
      if ((mm = s.match(/^(?:oops|whoops|my bad),? (?:I )?(sent|forgot|missed|deleted|broke|posted|replied|forwarded) (.+)$/i))) return `Sorry, I ${mm[1].toLowerCase()} ${mm[2].replace(/[.!]+$/, "")}.`;
      if ((mm = s.match(/^thanks,? ([A-Z][a-z]+),? you're (?:a |an )?(lifesaver|legend|star|hero|the best)[.!]*$/))) return `Thanks, ${mm[1]}. You're a ${mm[2] === "the best" ? "star" : mm[2]}.`;
      s = s.replace(/,? (doctor's|dentist|dental|doctor) appointment$/i, (_m, w) => ` for a ${w.toLowerCase()} appointment`).replace(/\bbudget's gone\b/i, "the budget is gone");
      if ((mm = s.match(/^(fun|classic|great|awesome|perfect|lovely|wonderful|cool|nice|brilliant)[.!]+\s+(.+)$/i))) s = `${mm[1]}, ${mm[2]}`;
      if (/^(?:sorry,? )?(?:I )?can't talk,? (?:I'm )?(?:in a meeting|driving|on a call)$/i.test(s)) return `Sorry, I can't talk right now. I'm ${s.match(/(in a meeting|driving|on a call)$/i)[1]}.`;
      if ((mm = s.match(/^(?:I'm )?stuck (in traffic|on (?:a|the) (?:bus|train|tram|subway|plane|tarmac|highway)|at (?:the )?[a-z]+),? (\d+) ?min(?:s|utes)?(?: late| behind)?$/i))) return `I'm stuck ${mm[1].toLowerCase()} and running about ${mm[2]} minutes late.`;
      if ((mm = s.match(/^(?:hell|heck|fuck|fucking|god) no,? (.+)$/i))) s = `no, ${mm[1]}`;
      if ((mm = s.match(/^(migraine|headache|fever|cold|flu|sick|food poisoning|stomach bug|sore throat),? (logging off|signing off|heading out|leaving|going offline|heading home)( early| for the day| now| today)?$/i))) {
        const ill = mm[1].toLowerCase();
        const have = ill === "sick" ? "I'm sick" : /^(?:flu|stomach bug)$/.test(ill) ? `I have the ${ill}` : /^food poisoning$/.test(ill) ? "I have food poisoning" : `I have a ${ill}`;
        return `${have}, so I'm ${mm[2].toLowerCase()}${(mm[3] ?? "").toLowerCase()}.`;
      }
      if ((mm = s.match(/^why is (this|that|it) my (problem|job|responsibility|issue|fault)[?!.]*$/i))) return `Could you clarify why ${mm[1].toLowerCase()} falls to me?`;
      s = s.replace(/\b(thank you|thanks|ty|thx) sm\b/i, "$1 so much");
      if ((mm = s.match(/^(?:I'm )?running late,? (?:my )?(car|bus|train|flight|alarm|babysitter|kid|dog|ride|uber|taxi) (.+?)[.!]*$/i))) return `I'm running late because my ${mm[1].toLowerCase()} ${mm[2]}.`;
      if ((mm = s.match(/^(?:I )?(can't|cannot) (make|do|join|attend) (.+?),? too (busy|swamped|slammed)[.!]*$/i))) return `I can't ${mm[2].toLowerCase()} ${mm[3]}. I'm too busy.`;
      if ((mm = s.match(/^(this|that|the)( new| old| latest| current)? (meeting|call|sync|plan|process|policy|idea|decision|code|doc|deck|report|design|email|update|review|rule|strategy|spreadsheet) is (?:total |complete |absolute )?(?:bullshit|bs|garbage|trash|junk|rubbish|crap)[.!]*$/i))) return `I think ${mm[1].toLowerCase()}${mm[2] ?? ""} ${mm[3].toLowerCase()} needs significant work.`;
      if ((mm = s.match(/^(?:sorry|oops|my bad),? wrong (file|link|doc|version|attachment|one),? (here's|here is|this is) (.+?)[.!]*$/i))) return `Sorry, that was the wrong ${mm[1].toLowerCase()}. ${mm[2][0].toUpperCase()}${mm[2].slice(1)} ${mm[3]}.`;
      if (/^(?:give me|gimme) (\d+)$/i.test(s)) return `Could you give me ${s.match(/(\d+)/)[1]} minutes?`;
      // "closed the Acme deal!!!" -> "We closed the Acme deal!!!" (a team win with the subject dropped).
      if (/^(?:closed|shipped|launched|signed|landed|won|hit|crushed|nailed) (?:the|a|an|our|\d)/i.test(s)) return `we ${s}`;
      const startsLower = /^[a-z]/.test(s) && !hasCrude(s) && !/\b(?:shit|fuck\w*|crap|damn|hell)\b/i.test(s);
      if (startsLower) {
        const r = restoreArticle(s);
        if (r !== s) return r;
      }
      return s;
    }).join(" ");
    return lead + t;
  }).join("\n");
}

// Collocation and slot checks after the phrase swaps (shortfalls/research.md, item 4).
// A swap is only right if it fits its neighbors: "smells rough", "the design is too tied up",
// "400 end-user ecosystem" and "incrementally differently" are swaps that landed in the wrong slot.
const PERSON = /^(?:I|I'm|we|we're|you|you're|he|she|they|they're|the team|everyone|[A-Z][a-z]+)$/;
const COLLOCATIONS = [
  [/\bsmells? (?:rough|suboptimal|challenging|not great)\b/g, (m) => m.replace(/\S+$/, "unpleasant")],
  [/\b(\d[\d,.]*k?) (?:end-user ecosystem|end-user base|user ecosystem)\b/g, "$1 users"],
  [/\b(\d[\d,.]*k?) end users\b/g, "$1 users"],
  [/\b(?:incrementally|slightly|materially) differently\b/g, "differently"],
  [/\bsee (the [\w-]+|it|this|that) (?:incrementally|materially) differently\b/g, "see $1 differently"],
  [/\bstrategic pathway ([A-Z])\b/g, "option $1"],
  [/\b(wrap up|close out|button up) (it|this|that|them)\b/g, (_m, v, o) => `${v.split(" ")[0]} ${o} ${v.split(" ")[1]}`],
  [/\bdo a discount\b/g, "offer a discount"],
  [/\b(good|best|better|great|poor|wise|effective) leverage of\b/g, "$1 use of"],
  [/\bon (\d+(?:st|nd|rd|th)) floor\b/g, "on the $1 floor"],
  [/\b(?:excel)\b/g, "Excel"], [/\bsvg\b/g, "SVG"], [/\bpostgres\b/g, "Postgres"], [/\bandroid\b/g, "Android"], [/\bvpn\b/g, "VPN"], [/\bios\b/g, "iOS"], [/\bq([1-4])\b/g, "Q$1"], [/\b(upgrade|update|install|downgrade) node\b/g, "$1 Node"], [/\bnode (\d+)\b/g, "Node $1"], [/\bdouble booked\b/g, "double-booked"],
  [/^(Could you) (.+?) please\?$/, "$1 please $2?"],
  [/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s\b/g, (m) => m[0].toUpperCase() + m.slice(1)],
  [/\b(Congratulations|Congrats|Thanks|Thank you|Happy [\w ]+?) ([A-Z][a-z]+)([.!?]|$)/g, "$1, $2$3"],
];
export function fixCollocations(text) {
  let t = text;
  for (const [re, rep] of COLLOCATIONS) t = t.replace(re, rep);
  // "busy" means "occupied" only for people: "the design is too tied up" -> "the design is too busy".
  t = t.replace(/\b((?:the|this|that|your|our|my) [\w-]+|it|this|that) (is|looks|feels|seems) (too |very |really |so |a bit )?(?:tied up|at capacity|fully leveraged|swamped|slammed|underwater)\b/gi, (m, subj, v, adv) => (PERSON.test(subj) || /\b(?:team|squad|pod|manager|lead|engineer|designer|person|folks|staff|crew|group|department|everyone|people)\b/i.test(subj) ? m : `${subj} ${v} ${adv ?? ""}busy`.replace(/\s{2,}/g, " ")));
  return t;
}
