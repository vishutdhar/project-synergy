// Round 15 (Oct 29): general guards around the whole corporate rewrite.
// 1. Never empty: a crude line the rewriter couldn't clean ("this hotel wifi is ass") used to come back blank.
//    The input is cleaned with general shapes first, and if the result is still blank, crude words are dropped.
// 2. Sad news is never "happy to share" or "thrilled to announce" (a grandmother passing away got that).
// 3. Crude adjectives before a noun ("a shit email") become "bad", never "stuff".
// 4. Sarcastic praise with a sour detail ("so happy to be presenting the bad numbers", "nice of IT to
//    schedule the outage during payroll") is read as the complaint it is.

const GOODCUE = /\b(?:faster|early|earlier|ahead of schedule|saved|free|finally (?:works|fixed|shipped)|record|won|closed the deal|promoted|raise|bonus)\b/i;
const SOUR = /\b(?:bad|worse|worst|never|again|outage|broke|broken|wrong|fifth|fourth|third time|speakerphone|another|late|down|crash\w*|fail\w*|overtime|weekend|midnight|4:5\d|5 ?pm|reply-all|three tools|nobody|no one|zero|lost|hot desk|logins?|\d+ minutes|consultants?|blocked|cancell?ed|mandatory|tight|except|slides?|deck|meetings? about|password reset|\d+ (?:hours?|days?|weeks?) (?:in a row|straight)|in a row|while nobody|stuck|forever|told at|update during|on a friday|at midnight|until midnight|more times)\b/i;

// Round 16: "nice of them to ..." -> "they decided to", and sarcasm over a bare noun phrase ("yay, mandatory fun at 4pm") needs a verb.
const OBJ2SUBJ = { them: "they", him: "he", her: "she", us: "we", me: "I", you: "you" };
const HASVERB = /\b(?:is|are|was|were|be|been|has|have|had|do|does|did|requires?|wants?|needs?|keeps?|will|won't|can't|cannot|doesn't|don't|isn't|aren't|wasn't|got|goes|went|says|said|made|took|ran|broke|left|came|told|gave|\w+'(?:re|s|ve|ll|d))\b|\b\w+(?:ed|es)\b/i;
export function preclean15(input) {
  let s = String(input ?? "");
  // Crude shapes with a clear plain meaning.
  s = s.replace(/\b(chew(?:ed|ing|s)?|ripp?(?:ed|ing|s)?|tore|tear(?:ing|s)?) my ass out\b/gi, (m, v) => `${v} me out`)
    .replace(/\bwhat the (?:actual |bloody |holy )?(?:fuck|hell|heck)\b/gi, "what")
    .replace(/\bwho the (?:fuck|hell)\b/gi, "who").replace(/\bwhy the (?:fuck|hell)\b/gi, "why").replace(/\bhow the (?:fuck|hell)\b/gi, "how")
    .replace(/\b(is|are|was|were) (?:pure |total |absolute )?ass\b(?!\w)/gi, "$1 terrible")
    .replace(/(?<!\b(?:give|giving|gives|gave|lose|losing|lost|loses|losin'|gimme) )\b(a|an) (?:shit|crap) (?!(?:is|was|are|were|and|of|to|for|on|in|at|again|anymore|now|today|here|there|too|already|either|ever|all|you|we|I|it|happens|happened|show|storm|load|ton|lot|pile)\b)([a-z]\w+)/gi, "$1 bad $2")
    .replace(/\bcredit for my shit\b/gi, "credit for my work")
    .replace(/\b(?:fuck|piss|bugger|bounce) off early\b/gi, "leave early")
    .replace(/\bplay(?:ing)? hooky( today| tomorrow)?\b/gi, (m, d) => `skip work${d ?? ""}`)
    .replace(/^(I'm|I am) going to the (beach|lake|mountains|park) instead of working\b/i, "$1 going to skip work today and go to the $2")
    .replace(/\b(and|so),? now (everything|everyone|nothing|nobody|it|the \w+) (is|are|has|was|keeps) /gi, "$1 $2 $3 now ")
    .replace(/\bfor-(?:fucking|freaking|effing|bloody)-ever\b/gi, "forever")
    .replace(/\b(?:shithole|shit ?show|shitstorm)\b/gi, "mess")
    .replace(/\b(pure|total|complete|absolute|utter) (?:horseshit|bullshit)\b/gi, "$1 nonsense").replace(/\bhorseshit\b/gi, "nonsense")
    .replace(/\b(?:stupid|dumb)[- ]?ass (?=[a-z])/gi, "frustrating ")
    .replace(/\bwent (?:batshit|bat shit)(?: crazy| insane)?\b/gi, "spiked out of control")
    .replace(/\b(?:I have|I've got|I got) (?:zero|no) (?:fucks|shits|damns)( left)?(?: to give)?\b/gi, (m, l) => `${m.split(" ").slice(0, m.startsWith("I have") ? 2 : 2).join(" ")} zero patience${l ?? ""}`)
    .replace(/\bno (?:fucking )?way in (?:hell|heck),? (we|they|you|he|she|it|this|that) (?:can |will |could |are going to |'re going to )?/gi, (m, w) => `I don't think ${w.toLowerCase()} will `).replace(/\bno (?:fucking )?way in (?:hell|heck),? I(?: am|'m) (\w+ing)\b/gi, "I won't be $1").replace(/\bno (?:fucking )?way in (?:hell|heck),? I (?:will |am going to |'m going to |can )?/gi, "I won't ")
    .replace(/\b(sucks?) (?:balls|donkey balls)\b/gi, "$1")
    .replace(/\bcrawling up our (?:asses|butts|backsides)\b/gi, "breathing down our necks")
    .replace(/\bcrawling up my (?:ass|butt|backside)\b/gi, "breathing down my neck")
    // Any "pain in the/my/our ass|butt|backside|neck" is a headache, whatever the determiner or adjective.
    .replace(/(?<!\bbeing (?:a |an )?(?:total |real |complete |huge |such a )?)\bpain in (?:the|my|our|your|his|her|their|everyone's|everybody's) (?:ass|arse|asses|butt|butts|backside|rear|neck)\b/gi, "hassle");
  // Sarcastic praise with a sour detail.
  const t = s.trim();
  let m;
  if (SOUR.test(t)) {
    if ((m = t.match(/^(?:oh |wow,? |gee,? )?(?:so |really |just )?(?:nice|kind|great|thoughtful|sweet) of ([\w ]+?) to (\w+)\b(.*)$/i))) s = `I'm frustrated that ${OBJ2SUBJ[m[1].toLowerCase()] ?? m[1]} decided to ${m[2]}${m[3]}`;
    else if ((m = t.match(/^(?:oh |wow,? )?(?:so |really |just |super )?(?:happy|glad|thrilled|excited|delighted) to be (\w+ing)\b(.*)$/i))) s = `I'm dreading ${m[1]}${m[2]}`;
    else if ((m = t.match(/^(?:oh |wow,? )?(?:so |really )?(?:great|nice|good|lovely) to see (?:that )?(.+?) (?:was|were|got|has been|have been) (\w+ed) never\b(.*)$/i))) s = `I'm disappointed that ${m[1]} was never ${m[2]}${m[3]}`;
    else if ((m = t.match(/^(?:oh |wow,? )?(?:really |just |so )?(?:loving|love) (the [\w -]+?), especially (.+)$/i))) s = `I'm struggling with ${m[1]}, especially ${m[2]}`;
    // General shapes: praise opener + a sour fact. Genuine good news ("love that the build is faster") has a good cue and is left alone.
    else if (!GOODCUE.test(t)) {
      if ((m = t.match(/^(?:oh |wow,? )?(?:i )?(?:just |really |so |absolutely )?(?:love|loving|like|adore) (?:that|how) (?!for (?:us|me|you)\b)(.+)$/i))) s = `I'm frustrated that ${m[1]}`;
      else if ((m = t.match(/^(?:oh |wow,? )?(?:i'm |im )?(?:so |really |super )?(?:excited|thrilled|happy|glad|delighted) (?:that|how) (.+)$/i))) s = `I'm not thrilled that ${m[1]}`;
      else if ((m = t.match(/^(?:oh |wow,? )?(?:incredible|amazing|unbelievable|impressive|fascinating) (?:that|how) (.+)$/i))) s = `It's hard to believe that ${m[1]}`;
      else if ((m = t.match(/^(?:oh )?(?:great|wonderful|perfect|fantastic|awesome|excellent|lovely|super|cool|nice|good|oh good|yay)[,!.]+\s+(.+)$/i)) && !/^(?:thanks|thank|job|work|news|a|an|another|more|yet another)\b/i.test(m[1])) { const r = m[1].replace(/^(?:so|and|now),?\s+/i, "").replace(/^my (\w+) (update|reboot|restart|crash)\b/i, "my $1 decided to $2"); s = /^(?:a|an|another|more|yet another)\b/i.test(r) ? `I'm concerned about yet ${r.replace(/^(?:a|an) /i, "another ").replace(/^yet /i, "")}` : HASVERB.test(r) ? `Unfortunately, ${r}` : `I'm not thrilled about ${/^(?:the|my|our|this|that)\b/i.test(r) ? "" : "the "}${r}`; }
      else if ((m = t.match(/^(?:wow,? )?(?:really |just |so )?(?:love|loving|enjoying) (\w+ing)\b(.*)$/i))) s = `I'm not thrilled about ${m[1]}${m[2]}`;
      else if ((m = t.match(/^(?:i )?(?:really |truly |so )?appreciate being (\w+)\b(.*)$/i))) s = `I'd appreciate not being ${m[1]}${m[2]}`;
      else if ((m = t.match(/^(.+?),? how (?:fun|nice|great|lovely|exciting|wonderful)[.!]*$/i))) s = `Unfortunately, ${m[1]}`;
      else if ((m = t.match(/^(?:really |so )?feeling the ("[^"]+"|[\w -]+?) while (.+)$/i))) s = `The ${m[1]} doesn't mean much while ${m[2]}`;
      else if ((m = t.match(/^(?:i'm )?(?:so )?thrilled (?:that )?(?!to\b|about\b)(.+)$/i))) s = `I'm not thrilled that ${m[1]}`;
    }
  }
  return s;
}

const SAD = /\b(?:passed away|died|death|funeral|bereavement|miscarriage|in the hospital|in hospital|hospitali[sz]ed|ER\b|emergency room|diagnosed|cancer|grief|grieving|laid off|lost my (?:dad|mom|father|mother|grand\w+|brother|sister|husband|wife|partner|dog|cat|job))\b/i;
const CHEER_OPEN = /^(?:I'm (?:so )?(?:happy|thrilled|excited|delighted|pleased) to (?:share|announce|report|let you know) that |Thrilled to (?:announce|share)[^:]*: |Celebrating [^:]*: |Pausing the roadmap to celebrate[^:]*: |Big win[^:]*: |Great news[^:,]*[:,] |Good news[^:,]*[:,] )/i;
const CHEER_CLOSE = /\s*(?:This is what happens when vision meets execution\.|Legends are being written in real time\.|Please hold your applause[^.]*\.|Absolute rockstar energy\.|Shareholder value, unlocked\.|Operational excellence, delivered\.)\s*$/i;

export function postfix15(input, text, lvl) {
  let out = String(text ?? "").replace(/\b(sl|st|dr|sh|pl|sk|fl)(i|o|a)ped\b/g, "$1$2pped");
  if (SAD.test(String(input)) && (CHEER_OPEN.test(out) || CHEER_CLOSE.test(out))) {
    out = out.replace(CHEER_OPEN, lvl >= 3 ? "A personal update, shared with care: " : "I wanted to let you know that ").replace(CHEER_CLOSE, lvl >= 3 ? " Thank you for your understanding." : "");
    out = out.replace(/: ([a-z])/, (x, c) => `: ${c}`).trim();
  }
  return out;
}

// Last resort when nothing else produced a clean line: drop crude words and keep the rest.
export function dropCrude15(text, hasCrude) {
  const words = String(text).split(/\s+/);
  const kept = [];
  for (const w of words) {
    if (!hasCrude(w.replace(/[^\w'-]/g, ""))) { kept.push(w); continue; }
    // "is a shithole with" must not become "is a with": a crude noun after a determiner becomes "mess".
    if (/^(?:a|an|the|total|pure|complete|absolute|utter|such)$/i.test(kept[kept.length - 1] ?? "") && (/[,.!?]$/.test(w) || /^(?:with|in|of|for|on|at|and|but|since|that|nobody|$)/i.test(words[words.indexOf(w) + 1] ?? ""))) kept.push("mess" + (w.match(/[,.!?]+$/)?.[0] ?? ""));
  }
  const t = kept.join(" ").replace(/\s+([,.!?])/g, "$1").replace(/^[,.\s]+/, "").trim();
  return t && !hasCrude(t) ? t[0].toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? "" : ".") : "";
}

// Last-resort rescue for lines the main path leaves empty: plain meaning for crude adjectives.
export function rescue15(input) {
  return String(input ?? "").replace(/\b(is|are|was|sounds|seems) (?:totally |completely |absolutely )?(?:batshit|bat shit)(?: crazy| insane)?\b/gi, (m, v) => `${v} not credible`);
}
