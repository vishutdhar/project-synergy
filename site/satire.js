// Round 9: satire scenes for Normal to corporate. Vishut: "It has to have a funny aspect to it."
// The joke is the gap between a plain workplace message and the grand corporate way of saying it.
// Each scene keeps the exact meaning (who, what, when, any no, number, day or question) and only
// inflates the wording: Mild is a polished email, Middle Manager is manager-speak, Full C-Suite is the
// deadpan LinkedIn / earnings-call version. Scenes never add people, dates, numbers or promises.

const DAY = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
const capDay = (s) => s.replace(new RegExp(`\\b(${DAY})\\b`, "gi"), (d) => d[0].toUpperCase() + d.slice(1).toLowerCase());
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// The time phrase in a message, normalized ("the whole day today" -> { when: "today", unit: "day" }).
function timeOf(t) {
  const s = t.toLowerCase();
  let m;
  if ((m = s.match(new RegExp(`\\b(?:from )?(${DAY}) (?:through|thru|to|-) (${DAY})\\b`)))) return { when: capDay(`${m[1]} through ${m[2]}`), unit: "days" };
  if ((m = s.match(/\bmost of (?:the|my) (day|afternoon|morning|week)\b/))) return { when: `for most of the ${m[1]}`, unit: m[1] };
  if ((m = s.match(/\b(?:the )?rest of (?:the|my) (day|afternoon|morning|week)\b/))) return { when: `for the rest of the ${m[1]}`, unit: m[1] === "week" ? "week" : m[1] };
  if ((m = s.match(/\b(?:until|till|til) (lunch|noon|\d{1,2}(?::\d\d)?\s?(?:am|pm)?|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/))) return { when: capDay(`until ${m[1]}`), unit: "morning" };
  if ((m = s.match(/\bafter (lunch|\d{1,2}(?::\d\d)?\s?(?:am|pm)?)\b/))) return { when: `after ${m[1]}`, unit: "afternoon" };
  if ((m = s.match(/\b(this|tomorrow) (morning|afternoon|evening)\b/))) return { when: `${m[1]} ${m[2]}`, unit: m[2] };
  if ((m = s.match(/\ball (day|afternoon|morning)(?: (today|tomorrow))?\b/))) return { when: m[2] ?? "today", unit: m[1] };
  if ((m = s.match(/\bthe whole (day|afternoon|morning|week)(?: (today|tomorrow))?\b/))) return { when: m[2] ?? (m[1] === "week" ? "this week" : "today"), unit: m[1] };
  if ((m = s.match(/\b(?:a |this )?long weekend\b/))) return { when: "this long weekend", unit: "long weekend" };
  if ((m = s.match(new RegExp(`\\b(?:this |on )?(${DAY})\\b`)))) return { when: capDay(m[0].replace(/^on /, "")), unit: "day" };
  if ((m = s.match(/\b(today|tomorrow|tonight|this week|next week|this weekend)\b/))) return { when: m[1], unit: /week/.test(m[1]) ? (m[1] === "this weekend" ? "weekend" : "week") : "day" };
  return { when: "today", unit: "day", implied: true };
}
const offlineNoun = (u) => ({ day: "day", days: "stretch", afternoon: "afternoon", morning: "morning", evening: "evening", week: "week", weekend: "weekend", "long weekend": "long weekend" }[u] ?? "day");

// Short tails people add after the main point. Each has a Mild, Middle and C-Suite reading.
const TAILS = [
  [/,?\s*(?:there's |there is |it's )?nothing (?:urgent|pressing) (?:anyway|going on)?\.?$/i, ["There's nothing urgent anyway.", "Nothing time-sensitive is on my plate anyway.", "There are no time-critical deliverables in my pipeline anyway."]],
  [/,?\s*(?:please )?don't expect much (?:from me)?\.?$/i, ["Please don't expect much from me.", "Please don't expect much output from me.", "Please do not expect much output; I am calibrating to a strategically modest level."]],
  [/,?\s*(?:i'm |im )?not feeling it\.?$/i, ["I'm not feeling up to it.", "Candidly, my energy isn't there.", "Candidly, my energy levels are not currently aligned with the workday."]],
  [/,?\s*(?:please )?don't wait (?:on|for) me\.?$/i, ["Please don't wait on me.", "Please don't block on me.", "Please do not let my absence become a blocker."]],
  [/,?\s*(?:then |and then )(?:going|head(?:ing)?|go) home\.?$/i, ["Then I'm heading home.", "After that, I'll be heading home.", "After that, I'll be transitioning to a home-based recharge posture."]],
  [/,?\s*peace(?: out)?\.?$/i, ["", "", "Peace and alignment."]],
  [/,?\s*it's been (?:real|fun|a ride|great)\.?$/i, ["It's been great.", "It's been a real pleasure.", "Truly, what a journey."]],
  [/,?\s*(?:please )?don't (?:call|ping|message|bother) me\.?$/i, ["Please don't call me.", "Please don't ping me.", "Please do not route inbound requests my way; my future self will circle back."]],
  // Round 12: short reasons and plans tacked on the end.
  [/,?\s*(?:and|to) (?:sleep|sleep in|rest|nap|catch up on sleep)\.?$/i, ["I'll use the time to rest.", "I'll use the time to recharge.", "The time will be reinvested in a strategic sleep initiative."]],
  [/,\s*(?:at the )?doctor(?:'s)?\.?$/i, ["I have a doctor's appointment.", "I have a doctor's appointment.", "I'll be attending a personal health-optimization engagement."]],
  [/,\s*(?:at the )?vet\.?$/i, ["I have a vet appointment.", "I have a vet appointment.", "I'll be supporting a key family stakeholder at the vet."]],
  [/,?\s*(?:my )?kids? (?:has|have) (?:a|her|his|their) (recital|game|play|concert|appointment|show)\.?$/i, null],
];
function splitTail(text) {
  for (const [re, lines] of TAILS) if (lines && re.test(text)) return { body: text.replace(re, "").trim(), tail: lines };
  return { body: text, tail: null };
}
const join = (...xs) => xs.filter(Boolean).join(" ").replace(/\s{2,}/g, " ").trim();

// Every scene: test(lowerText) and build(text, time) -> [mild, middle, csuite].
// Round 14: common idioms, read by meaning. {S} is the subject as written ("We're", "He's", "She's").
const IDIOMS = [
  [/^(we're|we are|i'm|i am|they're|they are) back to square one$/, ["{S} starting over from scratch.", "{S} back at the starting line on this.", "{S} executing a full strategic reset to day zero, with all prior learnings lovingly preserved."]],
  [/^(we're|we are|they're|they are|you're|you are) trying to boil the ocean(?: here)?$/, ["{S} trying to do too much at once.", "{S} trying to tackle everything at once.", "{S} pursuing an ocean-scale scope in a single initiative, which remains an aggressive thermal target."]],
  [/^(he's|she's|they're|he is|she is|they are) moving the goalposts(?: again)?$/, ["{S} changing the targets{A}.", "{S} shifting the success criteria{A}.", "{S} piloting a dynamic, continuously evolving definition of success{A}."]],
  [/^let's not throw good money after bad$/, ["Let's not spend more on something that isn't working.", "Let's not put more budget into something that isn't working.", "I'd recommend we pause our ongoing reinvestment in a value-destruction initiative, however consistent it has been."]],
  [/^(this|that|it) is (?:just |only )?the tip of the iceberg$|^(this|that|it)'s (?:just |only )?the tip of the iceberg$/, ["This is just the start of a bigger problem.", "This is only the visible part of a bigger issue.", "What we're seeing is only the above-water portion of a much larger strategic iceberg."]],
  [/^(we're|we are|i'm|i am|they're|they are) (?:stuck |caught )?between a rock and a hard place$/, ["{S} in a tough spot with no good options.", "{S} facing two difficult options.", "{S} navigating a dual-headwind scenario in which every available option is a learning opportunity."]],
  [/^(it's|this is|that's|it is|that is) (?:just )?a drop in the bucket$/, ["It's too small to make a real difference.", "It's a marginal impact at best.", "It's a rounding error with excellent intentions."]],
  [/^(he's|she's|they're|you're|we're|he is|she is|they are) barking up the wrong tree$/, ["{S} looking in the wrong place.", "{S} focused on the wrong area.", "{S} directing a high-energy initiative at the wrong tree."]],
  [/^the ball'?s in their court(?: now)?$|^the ball is in their court(?: now)?$/, ["It's their move now, and we're waiting on them.", "The next step is with them now.", "We have formally transferred ownership of the next move to them and await their response."]],
  [/^(that's|that is|this is|it's) (?:a|such a|a real|a whole) can of worms$/, ["That could create a lot of new problems.", "That could open up a lot of complications.", "That would unlock a self-replicating portfolio of new problems."]],
  [/^(she's|he's|they're|i'm|she is|he is|they are|i am) burning the candle at both ends$/, ["{S} working too hard without enough rest.", "{S} stretched very thin.", "{S} running a dual-shift personal capacity model that is not sustainable."]],
  [/^(we're|we are|they're|they are|i'm|i am) (?:just )?spinning (?:our|their|my) wheels$/, ["{S} putting in effort without making progress.", "{S} busy but not moving forward.", "{S} generating significant activity with zero forward motion, which is impressive in its own way."]],
  [/^(that's|that is|this is|it's) the elephant in the room$/, ["That's the obvious issue nobody is talking about.", "That's the big issue we haven't discussed yet.", "That is the largest unaddressed stakeholder in the room, and it has not been invited to speak."]],
  [/^(we|i|they) bit off more than (?:we|i|they) can chew$/, ["{W} took on more than {w} can handle.", "{W} overcommitted on this.", "{W} strategically over-indexed on ambition relative to capacity."]],
  [/^(that's|that is|this is|it's) a (?:hard|tough|bitter) pill to swallow$/, ["That's hard to accept.", "That's a tough one to accept.", "That is a high-friction truth that will require significant organizational digestion."]],
  [/^(he's|she's|they're|he is|she is|they are) (?:going to|gonna) hit the roof$/, ["{S} going to be very angry.", "{S} going to be very upset about this.", "{S} about to experience a significant escalation in emotional altitude."]],
  [/^(we're|we are|i'm|i am|they're|they are) running on fumes$/, ["{S} nearly out of energy.", "{S} running very low on energy.", "{S} operating on reserve capacity only, with the fuel light very much on."]],
  [/^that train has (?:already )?left the station$/, ["It's too late for that now.", "That window has closed.", "That opportunity has already departed, and there are no further scheduled services."]],
  [/^(?:we|i) (?:need|have|had|will have) to cut corners( to .+)?$/, ["We need to skip some steps{T}.", "We'll need to take some shortcuts{T}.", "We'll need to activate a streamlined, corner-optional delivery model{T}."]],
  [/^(we're|we are|they're|they are) putting lipstick on a pig$/, ["{S} making something look better without fixing it.", "{S} polishing something that still isn't working.", "{S} applying a premium cosmetic layer to a fundamentally unchanged asset."]],
];
const ISUBJ = { "we're": "We're", "we are": "We're", "i'm": "I'm", "i am": "I'm", "they're": "They're", "they are": "They're", "you're": "You're", "you are": "You're", "he's": "He's", "he is": "He's", "she's": "She's", "she is": "She's" };
const ISUBJ3 = { "We're": "We are", "I'm": "I am", "They're": "They are", "You're": "You are", "He's": "He is", "She's": "She is" };
function idiomScene(text) {
  const t = text.toLowerCase().replace(/[’]/g, "'").replace(/[.!]+$/, "").trim();
  for (const [re, outs] of IDIOMS) {
    const m = t.match(re);
    if (!m) continue;
    const S = ISUBJ[m[1]] ?? "";
    const W = m[1] && /^(?:we|i|they)$/.test(m[1]) ? (m[1] === "i" ? "I" : m[1][0].toUpperCase() + m[1].slice(1)) : "";
    const again = /\bagain\b/.test(t) ? " again" : "";
    const T = re.source.includes("cut corners") && m[1] ? m[1].replace(/\bmake the date\b/, "hit the date").replace(/\bmake the deadline\b/, "hit the deadline") : "";
    if (re.source.includes("cut corners")) return outs.map((o) => o.replace("{T}", T));
    return outs.map((o, i) => o.replace("{S}", i === 2 && ISUBJ3[S] ? ISUBJ3[S] : S).replace("{W}", W).replace("{w}", W === "I" ? "I" : W.toLowerCase()).replace("{A}", again));
  }
  return null;
}
const SCENES = [
  // Round 14: "I want to take the afternoon off and do absolutely nothing" / "I want to call in tomorrow and just
  // play video games" / "I'm going to bail early and go to the beach" / "I really want to blow off work today".
  // Unknown activities are kept word for word.
  {
    id: "hooky",
    re: /^(?:honestly,? |ngl,? |ok so |so )?(i(?:'d| would) (?:really )?(?:like|love) to|i (?:really )?want to|i wanna|i(?:'m| am) (?:gonna|going to)|gonna|i'll|i will)\s+(?:just )?(take (?:the|this) (?:whole |entire )?(?:day|afternoon|morning) off|take (?:today|tomorrow|monday|tuesday|wednesday|thursday|friday) off|call in(?: sick)?(?: today| tomorrow)?|blow off work(?: today| tomorrow)?|bail early(?: today)?|duck out early(?: today)?|leave early(?: today)?|duck out at \d{1,2}(?::\d\d)?(?: ?[ap]m)?|skip work(?: today| tomorrow)?|bail)(?: (to the beach))?(?:,? (?:and|to) (?:just |literally |absolutely )?(.+?))?[.!]*$/i,
    build(t, time, m) {
      const lower = t.toLowerCase();
      const want = /^(?:\S+ )?i(?:'d| would) (?:really )?(?:like|love) to|i (?:really )?want to|i wanna/i.test(m[1]);
      const lead1 = want ? "I'd like to" : "I'm going to";
      const lead3 = want ? "I'd like to designate" : "I'll be designating";
      const leave = m[2].toLowerCase();
      let act = (m[4] ?? "").trim();
      const dest = (lower.match(/\bto the (beach)\b/) ?? [])[1];
      if (!act && dest) act = `go to the ${dest}`;
      const early = /early|duck out at/.test(leave);
      const at = (leave.match(/at (\d{1,2}(?::\d\d)?(?: ?[ap]m)?)/) ?? [])[1];
      const half = (leave.match(/(?:the|this) (?:whole |entire )?(afternoon|morning|day)/) ?? [])[1];
      const lw = false;
      const hw = (leave.match(/(the|this) (?:whole |entire )?(?:afternoon|morning|day)/) ?? [])[1];
      const when = lw ? "this long weekend" : half ? (half === "day" && hw === "the" ? "the whole day" : `${hw} ${half}`) : time.when;
      const noBack = /not come back|not coming back/.test(act);
      if (noBack) act = "";
      const dflt3 = noBack ? "" : " to restore my bandwidth and return fully aligned";
      const A = [
        [/^(?:do )?(?:absolutely |literally )?nothing$/, "and do nothing work-related", " in which I will deliver absolutely nothing, with excellence"],
        [/^sleep(?: in)?$|^nap$|^take a nap$/, "to get some extra sleep", " anchored by an extended sleep initiative"],
        [/^play video ?games$|^game$|^play games$/, "to play video games", " dedicated to hands-on video game research"],
        [/^go to the (beach)$/, "to go to the $1", " at a $1side offsite with a team of one"],
        [/^go (fishing|golfing|hiking|skiing|surfing|bowling|kayaking)$/, "to go $1", " dedicated to hands-on $1 research"],
      ];
      let a1 = act ? ` to ${act}` : "", a3 = act ? `, dedicated to the following initiative: ${act}` : dflt3;
      for (const [re, x1, x3] of A) { const mm = act.toLowerCase().match(re); if (mm) { a1 = " " + x1.replace("$1", mm[1] ?? ""); a3 = x3.replace("$1", (mm[1] ?? "").replace(/^mountains$/, "mountain")); break; } }
      if (/\b(?:fuck|shit|damn|ass|crap|hell)\b/i.test(act)) return null;
      if (early) {
        const from = at ? `at ${at}` : /today/.test(leave) ? "early today" : "early";
        return [
          `${lead1} head out ${from}${noBack ? " and won't be back" : ""}${a1}.`,
          `Heads-up: ${lead1} sign off ${from}${noBack ? " and won't be back" : ""}${a1}.`,
          `After a thoughtful review of my personal roadmap, ${lead3} ${at ? `everything after ${at}` : "an early exit and everything after it"} as a strategic recharge window${a3}${noBack ? ", and I won't be back" : ""}. Rest is a deliverable.`,
        ];
      }
      const off = when === "today" && !half ? "today" : when;
      return [
        `${lead1} take ${off} off${a1}.`,
        `Heads-up: ${lead1} be out of office ${/^the /.test(off) ? "for " : ""}${off}${a1}.`,
        `After a thoughtful review of my personal roadmap, ${lead3} ${off} as a strategic recharge window${a3}. Rest is a deliverable.`,
      ];
    },
  },
  // "I'd like to fuck off the whole day today" / "I'm slacking off this afternoon" / "I'm phoning it in today"
  {
    id: "goof-off",
    re: /^(?:honestly,? |ngl,? |ok so |so )?(?:(?:the|my|today's) plan(?: for today| today)? is to|i(?:'d| would) (?:like|love) to|i want to|i(?:'m| am) (?:gonna|going to)|gonna|i plan to|(?:i(?:'m| am) )?planning to|i(?:'m| am)(?: totally| just)?|i'll be|i will)\s+(?:fuck(?:ing)? off(?! early)|check(?:ing)? out|f\*+k(?:ing)? off|slack(?:ing)? off|goof(?:ing)? off|screw(?:ing)? around|fuck(?:ing)? around|mess(?:ing)? around|dick(?:ing)? around|phon(?:e|ing) it in|pretend(?:ing)? to work|coast(?:ing)?|do(?:ing)? (?:absolutely |literally )?nothing|chill(?:ing)?|tak(?:e|ing) it easy)\b(.*)$/i,
    build(t, time) {
      const want = /^(?:\S+ )?i(?:'d| would) (?:like|love) to|i want to/i.test(t);
      const plan = /\bplan(?:ning)? to\b/i.test(t);
      const nothing = /\bdo(?:ing)? (?:absolutely |literally )?nothing\b/i.test(t);
      const whole = /\b(?:the whole|all) (day|afternoon|morning)\b/i.exec(t);
      const explicit = /\b(?:today|tomorrow|tonight|this (?:morning|afternoon|evening|week)|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(t);
      const w = whole && !explicit ? `the full ${whole[1]}` : time.when;
      const w1 = whole ? `all ${whole[1]}${/today|tomorrow/.test(w) ? " " + w : ""}` : w;
      const planIs = /\bplan(?: for today| today)? is to\b/i.test(t);
      const onm = t.match(/\bon (youtube|reddit|tiktok|instagram|my phone)\b/i); const On = onm ? ({ youtube: "YouTube", reddit: "Reddit", tiktok: "TikTok", instagram: "Instagram", "my phone": "my phone" })[onm[1].toLowerCase()] : "";
      const lead1 = planIs ? "The plan is to" : want ? "I'd like to" : plan ? "I plan to" : "I'm going to";
      const lead3 = planIs ? "The plan is to designate" : want ? "I'd like to designate" : plan ? "I'm planning to designate" : "I'll be designating";
      return [
        nothing ? `${lead1} do nothing work-related ${whole && !explicit ? w1 : w}.` : `${lead1} take it easy ${w1}${On ? `, mostly on ${On}` : ""}.`,
        nothing ? `Heads-up: ${lead1} accomplish nothing ${whole && !explicit ? w1 : w}, intentionally.` : `Heads-up: ${planIs ? "the plan is to run" : want ? "I'd like to run" : plan ? "I plan to run" : "I'll be running"} at intentionally low bandwidth ${w1}${On ? `, mostly on ${On}` : ""}.`,
        `After a thoughtful review of my personal roadmap, ${planIs ? lead3.replace(/^The/, "the") : lead3} ${w.replace(/^for /, "").replace(/^after /, "everything after ").replace(/^until /, "the stretch until ").replace(/^most of /, "most of ")} as a strategic recharge window${nothing ? " in which I will deliver absolutely nothing, with excellence" : On ? ` dedicated to deep-dive market research on ${On}` : " to restore my bandwidth and return fully aligned"}. Rest is a deliverable.`,
      ];
    },
  },
  // "gonna skip work tomorrow" / "not coming in today, car won't start" / "won't be online tomorrow, moving apartments"
  {
    id: "skip",
    re: /^(?:i(?:'m| am) )?(?:gonna |going to |i'll |i will )?(?:skip(?:ping)? work|not (?:coming|going) in(?:to work)?|won't be (?:in|online|around|coming in)|will not be (?:in|online)|call(?:ing)? out|bail(?:ing)? on work|not (?:gonna|going to) make it in|won't make it in)\b(.*)$/i,
    build(t, time) {
      const w = time.implied ? "today" : time.when;
      const skip = /skip|bail/i.test(t);
      const online = /online/i.test(t);
      let rest = t.replace(this.re, "$1").replace(new RegExp(`^\\s*(?:the whole day )?(?:${w.replace(/ /g, "\\s")})\\b`, "i"), "").replace(/^[\s,.;-]+/, "").trim();
      const reason = rest.replace(/[.!]+$/, "");
      const ill = /^(?:i )?feel(?:ing)? (?:like )?(?:garbage|crap|shit|death|hell|trash|awful|terrible|rough|sick)\b/i.test(reason);
      if (ill) return [`I won't be coming in ${w}. I'm feeling unwell.`, `Heads-up: I won't be in the office ${w}. I'm feeling under the weather.`, `I will not be physically present in the office ${w}. My body has issued an unplanned service-degradation notice, and recovery is my number-one deliverable.`];
      const r1 = reason ? ` ${cap(reason.replace(/\bcar won't start\b/i, "my car won't start").replace(/^moving\b/i, "I'm moving"))}.` : "";
      const r3 = reason ? ` ${cap(reason.replace(/\b(?:my )?car won't start\b/i, "my car won't start, which I am treating as a hard ignition blocker").replace(/^moving apartments\b/i, "I'm executing a full residential relocation"))}.` : "";
      const verb1 = skip ? `I'm going to take ${w} off.` : online ? `I won't be online ${w}.` : `I won't be coming in ${w}.`;
      const verb2 = skip ? `Heads-up: I'll be out of office ${w}.` : online ? `Heads-up: I won't be online ${w}.` : `Heads-up: I won't be in the office ${w}.`;
      const verb3 = skip ? `I'll be strategically out of office ${w} to protect my long-term bandwidth.` : online ? `I will not be online ${w}, and I'll be fully unavailable on all channels.` : `I will not be physically present in the office ${w}.`;
      return [join(verb1, r1), join(verb2, r1), join(verb3, r3)];
    },
  },
  // "calling in sick, my head is killing me" / "I'm sick as a dog, staying in bed"
  {
    id: "sick",
    re: /^(?:i(?:'m| am) )?(?:calling in sick|call(?:ing)? out sick|out sick|off sick|sick as a dog|sick today|feeling (?:really |super )?sick)\b(.*)$/i,
    build(t, time) {
      const w = time.implied ? "" : " " + time.when;
      const head = /\bhead(?:ache)?\b/i.test(t), bed = /\bin bed\b/i.test(t);
      return [
        join(`I'm calling in sick${w}.`, head ? "I have a terrible headache." : "", bed ? "I'll be resting in bed." : ""),
        join(`Heads-up: I'm out sick${w}.`, head ? "I'm dealing with a brutal headache." : "", bed ? "I'll be resting in bed." : ""),
        join(`I'm calling in sick${w}.`, head ? "My head is currently experiencing significant headwinds." : "My immune system has escalated a critical incident.", bed ? "I'll be prioritizing horizontal recovery as my number-one deliverable." : "Recovery is my number-one deliverable."),
      ];
    },
  },
  // "screw it, I'm logging off at 3" / "gonna ghost slack for the rest of the day" / "going to hide from my inbox until lunch"
  {
    id: "log-off",
    re: /^(?:screw it,? |f(?:uc)?k it,? |ok,? |welp,? )?(?:i(?:'m| am) )?(?:gonna |going to |i'll )?(?:log(?:ging)? off|sign(?:ing)? off|ghost(?:ing)? (?:slack|teams|email|everyone)|hid(?:e|ing) from (?:my )?(?:inbox|email|slack))\b(.*)$/i,
    build(t) {
      const at = t.match(/\bat (\d{1,2}(?::\d\d)?\s?(?:am|pm)?)\b/i)?.[1];
      const time = timeOf(t);
      const chan = t.match(/\b(slack|teams|email|inbox)\b/i)?.[1];
      const back = t.match(/\bback (?:on )?(monday|tuesday|wednesday|thursday|friday|tomorrow|next week)\b/i)?.[1];
      if (back && !chan && !at) {
        const d = /^(?:tomorrow|next week)$/i.test(back) ? back.toLowerCase() : back[0].toUpperCase() + back.slice(1).toLowerCase();
        return [`I'm signing off now, and I'll be back ${d}.`, `Heads-up: I'm signing off now, and I'll be back ${d}.`, `I'm concluding my operating cycle now and will re-enter the ecosystem ${d}. Rest is a deliverable.`];
      }
      const ch = chan ? (/slack/i.test(chan) ? "Slack" : /teams/i.test(chan) ? "Teams" : "email") : "";
      const resigned = /^(?:screw|f(?:uc)?k) it/i.test(t);
      if (at) return [`I'm going to log off at ${at}.`, `Heads-up: I'll be wrapping up and logging off at ${at}.`, `${resigned ? "After carefully weighing the trade-offs, I've made the executive decision" : "I've made the strategic decision"} to log off at ${at}. Protecting my bandwidth is a leadership choice.`];
      if (/\bearly\b/i.test(t) && !ch) {
        const d = t.match(/\b(today|tonight|tomorrow|on (?:monday|tuesday|wednesday|thursday|friday))\b/i)?.[1]?.toLowerCase();
        const dd = d ? ` ${d}` : "";
        return [`I'm logging off early${dd}.`, `Heads-up: I'll be signing off early${dd}.`, `I'll be concluding my operating day ahead of schedule${dd}. Protecting my bandwidth is a leadership choice.`];
      }
      const w = time.implied ? "for the rest of the day" : time.when;
      const what = ch ? `${ch}` : "messages";
      return [`I'll be away from ${what} ${w}.`, `Heads-up: I'm going heads-down and stepping away from ${what} ${w}.`, `I'll be entering deep-focus mode and going dark on ${what} ${w}. Silence is a strategy.`];
    },
  },
  // "I need a vacation so bad"
  {
    id: "vacation",
    re: /^(?:god,? |man,? |ugh,? )?i (?:really |so |badly )?(?:need|could use|want) (?:a |some )?(?:vacation|holiday|break|time off|pto|mental health day|day off|personal day|long weekend|nap)(?: from (?:this place|work|this job|all this))?(?: so bad(?:ly)?| badly| right now| asap| like you wouldn't believe)?[.!]*$/i,
    build(t) {
      const d = t.match(/\b(mental health day|day off|personal day|long weekend|nap)\b/i)?.[1]?.toLowerCase();
      const from = t.match(/\bfrom (this place|work|this job|all this)\b/i)?.[1]?.toLowerCase();
      if (from) return [`I really need a break from ${from}.`, `Candidly, I'm running on empty and need a break from ${from}.`, `Candidly, I've identified an urgent need for strategic distance from ${from}. Rest is a deliverable.`];
      if (d === "nap") return ["I really need a nap.", "Candidly, I'm running on empty and could use a quick recharge.", "I've identified an urgent, business-critical need for a strategic rest cycle. Rest is a deliverable."];
      if (d) return [`I could really use a ${d}.`, `Candidly, I'm running on empty and overdue for a ${d}.`, `Candidly, my bandwidth is fully depleted, and I've identified an urgent need for a strategic recharge, also known as a ${d}.`];
      return ["I could really use some time off.", "Candidly, I'm running on empty and overdue for some PTO.", "Candidly, my bandwidth is fully depleted, and I've identified an urgent need for a strategic recharge, also known as a vacation."];
    },
  },
  // "honestly just want to sleep in and not log on"
  {
    id: "sleep-in",
    re: /^(?:honestly,? |ngl,? )?(?:i )?(?:just )?(?:want|wanna|would love) to sleep in(?: and not log on| and stay offline)?[.!]*$/i,
    build(t) {
      const off = /not log on|offline/i.test(t);
      return [`Honestly, I'd like to sleep in${off ? " and not log on" : ""}.`, `Candidly, I'd love to extend my rest window${off ? " and not log on at all" : ""}.`, `In the spirit of radical candor, my preference would be to extend my overnight recovery window${off ? " and not log on, as a matter of strategy" : ""}.`];
    },
  },
  // "overslept, logging on in 10"
  {
    id: "overslept",
    re: /^(?:i )?overslept,?\s*(?:(?:i'm |i'll be )?(?:logging on|online|on|there)(?: in (\d+)(?: ?min(?:ute)?s?)?)?)?[.!]*$/i,
    build(t) {
      const n = t.match(/\bin (\d+)/)?.[1];
      const eta = n ? ` I'll be online in ${n} minutes.` : "";
      return [`I overslept, sorry.${eta}`, `Apologies, I overslept.${eta}`, `I experienced an unplanned extension of my overnight recovery window.${eta.replace("I'll be online", "I'll be fully online and aligned")}`];
    },
  },
  // "I quit" / "I'm done with this place"
  {
    id: "quit",
    re: /^(?:(?:i(?:'m| am) out of here,? )?i quit|i(?:'m| am) (?:so |totally |completely )?done with this (?:place|job|company)|i(?:'m| am) quitting)[.!]*$/i,
    build(t) {
      if (/done with/i.test(t)) return ["I'm ready to move on from this company.", "Candidly, I'm ready to explore opportunities outside the company.", "After deep reflection, I've concluded that my journey with this organization has reached its natural conclusion."];
      return ["I've decided to resign.", "Heads-up: I've decided to move on from my role.", "After much reflection, I'm humbled to announce that I am resigning to embark on my next chapter."];
    },
  },
  // "this should've been an email"
  {
    id: "email",
    re: /^(?:this|that|the) (?:meeting|call|sync)? ?(?:should(?:'ve| have) been|could(?:'ve| have) been) an email[.!]*$/i,
    build() {
      return ["I think this could have been an email.", "My two cents: this could have been handled async over email.", "On reflection, this had strong potential to be an asynchronous email. Respecting each other's time is a core value."];
    },
  },
  // "the meeting was pointless and I want my hour back"
  {
    id: "want-hour-back",
    re: /^(?:the|that|this) (meeting|call|sync|standup|training) was (?:pointless|useless|a waste of time|a waste)(?: and i want my (hour|time|afternoon|morning) back)?[.!]*$/i,
    build(t, _time, m) {
      const thing = m[1].toLowerCase(), back = m[2];
      const s3 = { meeting: "alignment session", call: "alignment call", sync: "sync", standup: "daily alignment ritual", training: "enablement session" }[thing];
      return [
        join(`I don't think that ${thing} was a good use of our time.`, back ? `I'd like my ${back} back.` : ""),
        join(`Candidly, that ${thing} didn't move the needle.`, back ? `I'd love my ${back} back.` : ""),
        join(`That ${s3} did not generate measurable value.`, back ? `I'd like to formally request a refund on the ${back} I invested in it.` : "Time is our scarcest resource."),
      ];
    },
  },
];

SCENES.push(
  // "can I leave early today? kid has a recital"
  { id: "leave-early", q: true, re: /^(?:can|could|may) i (?:leave|head out|duck out|bounce) early(?: (today|tomorrow|on \w+))?\??(?:\s*(?:my )?(kid|son|daughter)(?:'s)? (?:has|have) (?:a |her |his )?([\w ]+?))?[.!?]*$/i,
    build(t, _time, m) {
      const w = m[1] ? ` ${m[1].replace(/^on /, "")}` : "";
      const why = m[3] ? ` My ${m[2].toLowerCase()} has a ${m[3].toLowerCase()}.` : "";
      return [`Could I leave early${w}?${why}`, `Would it be OK if I head out early${w}?${why}`, `Would it be possible for me to transition out of the office early${w}?${why.replace(/\.$/, ", which is a non-negotiable stakeholder commitment.")}`];
    } },
  // "he's an idiot for promising that date"
  { id: "idiot-for", re: /^(he|she|they)(?:'s|'re| is| are) (?:an? )?(?:total |complete |fucking |absolute )?(?:idiot|moron|dumbass|clown|idiots|morons|stupid|dumb)s? for ([a-z]+ing)\b(.*?)[.!]*$/i,
    build(t, _time, m) {
      const who = { he: "his", she: "her", they: "their" }[m[1].toLowerCase()];
      const act = `${m[2]}${m[3]}`;
      return [`It was careless of ${{ he: "him", she: "her", they: "them" }[m[1].toLowerCase()]} to ${base(m[2])}${m[3]}.`, `Candidly, ${act} was a questionable decision on ${who} part.`, `${cap(act)} was, respectfully, a bold strategic choice on ${who} part, and not one I can endorse.`];
    } },
  // "whoever wrote this spec was high"
  { id: "spec-high", re: /^whoever (wrote|designed|made|built|approved) (this|that|the) ([\w ]+?) (?:was|must have been|must've been) (?:high|drunk|smoking something|on something)[.!]*$/i,
    build(t, _time, m) {
      const n = m[3];
      return [`This ${n} doesn't make much sense.`, `Candidly, this ${n} is hard to follow.`, `This ${n} reflects a bold, unconventional mindset that I'm still working to align with.`];
    } },
  // "I'm bored out of my mind"
  { id: "bored", re: /^(?:i(?:'m| am) )?(?:so |super |really )?bored(?: out of my mind| to death| af)?[.!]*$/i,
    build() { return ["I'm really bored right now.", "Candidly, I have more bandwidth than work right now.", "I'm currently operating with significant untapped bandwidth and would welcome a more stimulating challenge."]; } },
  // "we got our asses kicked in that pitch"
  { id: "lost-badly", re: /^we (?:got|were) (?:our asses kicked|our ass kicked|destroyed|crushed|smoked|wrecked|demolished|killed|steamrolled) (?:in|at|on) (that|the|this) (pitch|demo|deal|meeting|review|game|negotiation|presentation)[.!]*$/i,
    build(t, _time, m) { const n = `${m[1].toLowerCase()} ${m[2].toLowerCase()}`; return [`We lost ${n} badly.`, `Candidly, ${n} did not go our way at all.`, `${cap(n)} was a powerful learning opportunity: the other side won decisively.`]; } },
  // "I'm handing in my notice today" / "I got another offer and I'm taking it" / "friday is my last day" / "accepting the offer from Stripe, my last day is the 30th"
  { id: "notice", re: /^(?:i(?:'m| am) )?(?:handing in|giving|putting in|submitting) my (?:notice|two weeks|resignation)(?: (today|tomorrow|this week))?[.!]*$/i,
    build(t, _time, m) { const w = m[1] ? ` ${m[1]}` : ""; return [`I'm handing in my notice${w}.`, `Heads-up: I'm handing in my notice${w}.`, `After deep reflection, I'm formally handing in my notice${w} to embark on my next chapter.`]; } },
  { id: "other-offer", re: /^i (?:got|received|have) (?:another|a new|an outside|a better) offer and (?:i'm|i am|i'll be) (?:taking|accepting) it[.!]*$/i,
    build() { return ["I received another offer, and I've decided to accept it.", "Heads-up: I've accepted an outside offer.", "I've received an external offer and have made the decision to accept it. Grateful for the journey."]; } },
  { id: "last-day", re: new RegExp(`^(${DAY}|today|tomorrow|next \\w+|the \\d{1,2}(?:st|nd|rd|th))(?: is|'s) my last day(?: here)?[.!]*$`, "i"),
    build(t, _time, m) { const d = capDay(m[1]); return [`${cap(d)} is my last day.`, `Heads-up: ${d} is my last day.`, `${cap(d)} marks the final chapter of my journey here. It's been a privilege.`]; } },
  { id: "accept-offer", re: /^(?:i(?:'m| am) )?accepting the offer from ([A-Za-z][\w&.-]*),? (?:and )?my last day (?:is|will be) (.+?)[.!]*$/i,
    build(t) { const m = t.match(/accepting the offer from ([A-Za-z][\w&.-]*),? (?:and )?my last day (?:is|will be) (.+?)[.!]*$/i); const co = cap(m[1]); return [`I'm accepting the offer from ${co}. My last day is ${m[2]}.`, `Heads-up: I'm accepting an offer from ${co}. My last day is ${m[2]}.`, `After much reflection, I'm humbled to share that I'm accepting an offer from ${co}. My last day is ${m[2]}, and it's been a privilege.`]; } },
);
SCENES.push(
  { id: "time-off", re: new RegExp(`^(?:i'm |i am |i'll be |i will be |gonna be |going to be )?taking (a long weekend|the day off|a personal day|tomorrow off|today off|next week off|the afternoon off|(?:${DAY}) off)[.!]*$`, "i"),
    build(t, _time, m) { const x = capDay(m[1].toLowerCase()); return [`I'm taking ${x}.`, `Heads-up: I'll be taking ${x}.`, `I'll be taking ${x} to recharge and return with renewed strategic clarity. Rest is a deliverable.`]; } },
);
SCENES.push(
  { id: "nothing-done", re: /^(?:(?:fuck|fucking|bugger|sod) all|jack(?: ?shit)?|squat|diddly(?: ?squat)?|nothing|zero|zilch) (?:was|got|has been) (?:done|accomplished|achieved|decided) (?:in|at|during) (that|the|this|today's) (meeting|call|sync|standup|workshop|offsite|session|review)[.!]*$/i,
    build(t, _time, m) { const n = `${m[1].toLowerCase()} ${m[2].toLowerCase()}`; return [`Nothing got done in ${n}.`, `Candidly, nothing came out of ${n}.`, `${cap(n)} achieved a bold, minimalist outcome: nothing. Respecting each other's time is a core value.`]; } },
  { id: "nothing-done-we", re: /^we (?:got|did|have done|accomplished) (?:(?:fuck|fucking|bugger|sod) all|jack(?: ?shit)?|squat|nothing|zilch)(?: done)? (this|last|all) (sprint|week|quarter|month|day)[.!]*$/i,
    build(t, _time, m) { const n = `${m[1].toLowerCase()} ${m[2].toLowerCase()}`; return [`We got nothing done ${n}.`, `Candidly, we didn't deliver anything ${n}.`, `We closed ${n} with a lean, minimalist output of zero deliverables. Every setback is a setup for a comeback.`]; } },
);
// Sarcasm: say the complaint, deadpan.
const BAD2 = /\b(?:the (?:day|night|hour) before|last[- ]minute|at [5-7] ?am|at 7|before launch|during (?:the|a|my) (?:board|client|customer|demo|all-hands|exec)|on (?:a )?(?:friday|saturday|sunday)|down|broken|broke|died|crashed|jammed|again|late)\b/i;
SCENES.push(
  { id: "nap", re: /^(?:i'm |i am )?(?:gonna|going to|i'll|i will|about to) (?:take|grab) a (?:quick |little |power )?nap(?: (after lunch|this afternoon|at \d{1,2}(?::\d\d)?(?: ?[ap]m)?))?[.!]*$/i,
    build(t, _time, m) { const w = m[1] ? ` ${m[1]}` : ""; return [`I'm going to take a short nap${w}.`, `Heads-up: I'll be taking a quick recharge break${w}.`, `I'll be executing a strategic rest cycle${w} to optimize afternoon throughput.`]; } },
  { id: "so-happy", re: /^(?:i'm |i am )?(?:so|really|super|just so) (?:happy|glad|thrilled|excited|pleased) (?:that )?(.{6,100}?)[.!]*$/i,
    build(t) { const m = t.match(/(?:happy|glad|thrilled|excited|pleased) (?:that )?(.{6,100}?)[.!]*$/i); if (!m || !(BADX.test(m[1]) || BAD2.test(m[1])) || /^we (?:spent|burned|wasted)\b/i.test(m[1])) return null; const x = m[1];
      return [`I'm frustrated that ${x}.`, `Candidly, I'm frustrated that ${x}.`, `In the spirit of radical candor, I'm frustrated that ${x}. The timing is, strategically speaking, impeccable.`]; } },
  { id: "thanks-sarcasm", re: /^thanks? (?:you )?for (.{4,80}?),? (?:really|super|very|so) (?:thoughtful|considerate|helpful|kind|great|discreet|subtle|professional)[.!]*$/i,
    build(t) { const m = t.match(/^thanks? (?:you )?for (.{4,80}?),? (?:really|super|very|so) (?:thoughtful|considerate|helpful|kind|great|discreet|subtle|professional)[.!]*$/i); const x = m[1]; if (!(BADX.test(x) || BAD2.test(x) || /\b(?:the whole (?:company|org|team)|everyone|all-staff|reply[- ]all)\b/i.test(x))) return null;
      return [`I'm not happy about ${x.replace(/^([\w']+ing)\b/i, "you $1")}.`, `Candidly, ${x.replace(/^(\w+ing)\b/i, (g) => g.toLowerCase())} ${/s$/.test(x.split(" ").pop()) && !/^\w+ing\b/i.test(x) ? "weren't" : "wasn't"} ideal.`, `Thank you for ${x}. A bold choice, and one I'd gently suggest we rethink.`]; } },
  { id: "cant-wait-another", re: /^(?:i )?can't wait for (?:yet )?another (.{3,80}?)[.!]*$/i,
    build(t) { const x = t.match(/another (.{3,80}?)[.!]*$/i)[1].replace(/\b(\d+) (hour|minute|day|week)\b/i, "$1-$2"); return [`I'm not looking forward to another ${x}.`, `Candidly, I'm not excited about another ${x}.`, `Thrilled to share that we've unlocked yet another ${x}. Candidly, I'm not looking forward to it.`]; } },
);
const BADX = /\b(?:dies|died|breaks|broke|crash\w*|down|fails?|failed|again|every (?:time|single)|always|never|late|after the fact|last minute|on a (?:friday|weekend)|at \d|no one|nobody|without (?:asking|telling))\b/i;
SCENES.push(
  { id: "love-how", re: /^(?:i )?(?:just |really |totally |gotta |got to )?love (?:how|that|it when) (.{6,120}?)[.!]*$/i,
    build(t) {
      const m = t.match(/love (?:how|that|it when) (.{6,120}?)[.!]*$/i);
      if (!m || !(BADX.test(m[1]) || BAD2.test(m[1]))) return null;
      const x = m[1];
      return [`I'm frustrated that ${x}.`, `Candidly, I'm frustrated that ${x}.`, `In the spirit of radical candor, I'm frustrated that ${x}, and I'd like to recognize the remarkable consistency involved. Consistency is a core value, just not this kind.`];
    } },
  { id: "another", re: /^(?:wow|great|oh great|cool|awesome|yay|fantastic|perfect|amazing),? (?:yet )?another (.{3,80}?)[.!]*$/i,
    build(t) {
      const m = t.match(/another (.{3,80}?)[.!]*$/i);
      const x = m[1];
      return [`Not another ${x}.`, `Candidly, I'm not excited about another ${x}.`, `Thrilled to share that we've unlocked yet another ${x}. I'd like to flag some gentle fatigue.`];
    } },
  { id: "late-heads-up", re: /^thanks for (?:the )?(heads[- ]up|update|warning|notice|info)s?,? (?:really|super|very|so) (?:helpful|useful) (?:after the fact|now|at this point)[.!]*$/i,
    build() { return ["It would have helped to hear this sooner.", "Thanks for the heads-up, though it would have been more useful before the fact.", "Thank you for this retrospective heads-up. Going forward, a proactive one would be even more impactful."]; } },
  { id: "so-glad-spent", re: /^(?:i'm |i am )?(?:so|really|sooo*|very) glad (?:that )?we (?:spent|burned|wasted) (.{2,40}?) (?:on|in) (.{2,60}?)[.!]*$/i,
    build(t) {
      const m = t.match(/we (?:spent|burned|wasted) (.{2,40}?) (?:on|in) (.{2,60}?)[.!]*$/i); const p = /we (?:spent|burned|wasted) .{2,40}? in /i.test(t) ? "in" : "on";
      return [`I don't think we needed to spend ${m[1]} ${p} ${m[2]}.`, `Candidly, ${m[1]} ${p} ${m[2]} feels like a lot.`, `${/^(?:\d+ (?:hour|day|week|minute|month)s?|all (?:day|week|morning|afternoon)|an? (?:hour|day|week|minute|month)|half an? (?:hour|day))$/i.test(m[1]) ? `Proud of our deep, ${m[1].replace(/^(\d+) (hour|day|week|minute|month)s?$/i, "$1-$2").replace(/^all (day|week|morning|afternoon)$/i, "all-$1").replace(/^an? (hour|day|week|minute|month)$/i, "$1-long").replace(/^half an? (hour|day)$/i, "half-$1")} strategic investment in ${m[2]}. ` : `Proud of our bold decision to allocate ${m[1]} to ${m[2]}. `}I'd gently suggest we right-size that next time.`];
    } },
);
// Round 9c: more everyday crude and time-off phrasings (found on held-out batch 18).
SCENES.push(
  // "honestly I just want to fuck off early today"
  { id: "want-leave-early", re: /^(honestly,? |ngl,? )?(?:i )?(?:just |really )?(?:want|wanna|would like|'d like|would love) to (?:fuck off|bail|bounce|leave|head out|duck out|skip out|sneak out|peace out|dip) early(?: (today|tomorrow|on \w+))?[.!]*$/i,
    build(t, _time, m) { const h = m[1] ? "Honestly, " : ""; const w = m[2] ? ` ${m[2].replace(/^on /, "")}` : ""; return [`${h}I'd like to leave early${w}.`, `${h ? "Candidly" : "Heads-up"}, I'd like to head out early${w}.`, `${h ? "In the spirit of radical candor" : "After careful consideration"}, I'd like to transition out of the office early${w} to protect my long-term bandwidth. Sustainable performance is a long game.`]; } },
  // "gonna bail on the 3pm and head home"
  { id: "bail-meeting", re: /^(?:i(?:'m| am) )?(?:gonna|going to|i'll|i will|i'm going to) (?:bail on|skip|ditch|duck out of|miss) (the|my|today's|this) (\d{1,2}(?::\d\d)?\s?(?:am|pm)?(?: (?:meeting|call|sync))?|standup|sync|all-hands|all hands|team meeting|meeting|call|offsite|training)(?: and (?:head|go) home)?[.!]*$/i,
    build(t, _time, m) { const n = `${m[1].toLowerCase()} ${m[2]}`; const home = /\bhome\b/i.test(t); return [`I'm going to skip ${n}${home ? " and head home" : ""}.`, `Heads-up: I'll be skipping ${n}${home ? " and heading home" : ""}.`, `I'll be strategically declining ${n}${home ? " and transitioning to a home-based recharge posture, also known as going home" : " to protect deep-focus time"}. Every no is a yes to focus.`]; } },
  // "marketing screwed the pooch on this one" / "we dropped the ball again"
  { id: "blew-it", re: /^((?:the )?[a-z]+(?: team)?|we|i|he|she|they) (?:totally |really |completely )?(?:screwed the pooch|dropped the ball|fucked (?:it|this) up|fucked up|screwed (?:it )?up|botched it|blew it|messed (?:it )?up)(?: (on (?:this one|this|that|the [\w ]{2,30})))?( again)?[.!]*$/i,
    build(t, _time, m) {
      const who = m[1].toLowerCase(); const S = who === "i" ? "I" : cap(who); const on = m[2] ? ` ${m[2]}` : ""; const again = m[3] ? " again" : "";
      const self = who === "i" || who === "we";
      return [`${S} made a mistake${on}${again}.`, `Candidly, ${who === "i" ? "I" : who} dropped the ball${on}${again}.`, `${S} ${self ? "proudly delivered" : "delivered"} a powerful learning opportunity${on}${again}, and ${self ? "I" : "we"} will be unpacking it in the retro for some time.`];
    } },
  // "he's a total dick in meetings"
  { id: "difficult-person", re: /^(he|she|they)(?:'s|'re| is| are) (?:a |an )?(?:total |complete |real |absolute |such a |such an )?(?:dick|jerk|ass|asshole|prick|tool|pain in the ass|piece of work|nightmare to work with)s?(?: (in|during|on|at|with) ([\w ]{2,30}))?[.!]*$/i,
    build(t, _time, m) { const p = m[1].toLowerCase(); const verb = p === "they" ? "are" : "is"; const P = cap(p); const where = m[2] ? ` ${m[2].toLowerCase()} ${m[3]}` : ""; return [`${P} can be difficult to work with${where}.`, `Candidly, ${p} ${verb} challenging to collaborate with${where}.`, `${P} ${p === "they" ? "bring" : "brings"} a uniquely high-friction collaboration style${where}, and I see real upside in a reset.`]; } },
  // "cover for me in standup"
  { id: "cover-me", q: true, re: /^(?:can you |could you |pls |please )?cover for me (in|at|during|on) (standup|the standup|the meeting|the call|the sync|[\w ]{2,25}?)(?: (today|tomorrow))?\??[.!]*$/i,
    build(t, _time, m) { const w = m[3] ? ` ${m[3]}` : ""; const n = m[2]; return [`Could you cover for me ${m[1]} ${n}${w}?`, `Would you be able to cover for me ${m[1]} ${n}${w}?`, `Would you be open to covering for me ${m[1]} ${n}${w}? I see it as a high-visibility stretch opportunity.`]; } },
  // "sorry, I was on mute the whole time"
  { id: "mute", re: /^(?:(?:sorry|oops|whoops|my bad),? )?i was on mute (?:the whole time|this whole time|the entire time|all along)[.!]*$/i,
    build() { return ["Sorry, I was on mute the whole time.", "Apologies, I was on mute the whole time.", "Apologies: I was on mute the whole time, so my contributions were delivered in a strictly internal capacity."]; } },
  // "my calendar is a nightmare this week"
  { id: "calendar", re: /^my (calendar|inbox|week|schedule) is (?:a |an )?(?:total |complete |absolute )?(?:nightmare|disaster|mess|shitshow|shit ?show|dumpster fire|zoo|circus|hell)(?: (this week|today|right now|lately|again))?[.!]*$/i,
    build(t, _time, m) { const n = m[1].toLowerCase(); const w = m[2] ? ` ${m[2]}` : ""; return [`My ${n} is really packed${w}.`, `Candidly, my ${n} is completely overloaded${w}.`, `My ${n} has achieved full utilization${w}, a masterclass in back-to-back alignment. Bandwidth is a finite resource.`]; } },
);
// Round 9c (fresh19 classes)
SCENES.push(
  { id: "kind-wish", re: /^(safe travels|safe flight|travel safe|have a safe (?:trip|flight|drive)|enjoy your (?:trip|vacation|time off|holiday|break|leave|weekend)|get well (?:soon|shortly)|feel better (?:soon|shortly)|feel better|welcome back)(?:,? (\S+?))?[.!]*$/i,
    build(t, _time, m) { const w = m[1].toLowerCase().replace(/shortly$/, "soon"); const nm = m[2] ? ((t.match(new RegExp(`\\b${m[2].replace(/[^\w'-]/g, "")}\\b`, "i")) ?? [m[2]])[0]) : ""; const who = m[2] ? (/^(?:everyone|all|team)$/i.test(m[2]) ? ", everyone" : `, ${nm[0].toUpperCase() + nm.slice(1)}`) : ""; const sep = who ? ", " : " "; const base = w[0].toUpperCase() + w.slice(1); const l3 = /travel|flight|trip|drive/.test(w) ? "and a frictionless itinerary. Your boarding group has been strategically prioritized." : /well|better/.test(w) ? "and a full return to peak operational wellness. Rest is a deliverable." : /welcome/.test(w) ? "to the alignment. Your inbox has been expecting you, strategically." : "and a fully optimized recharge cycle. Rest is a deliverable."; const wish = /^welcome/.test(w) ? `Welcome back${who}!` : `${base}${who}!`; const mid = /^welcome/.test(w) ? `Great to have you back${who}!` : /^(?:get well|feel better)/.test(w) ? `Wishing you a speedy recovery${who}!` : /^enjoy/.test(w) ? `Hope you ${w}${who}!` : `Wishing you safe travels${who}!`; const top = /^welcome/.test(w) ? `Welcome back${who}${sep}${l3}` : /^(?:get well|feel better)/.test(w) ? `Wishing you a speedy recovery${who}${sep}${l3}` : /^enjoy/.test(w) ? `Wishing you a wonderful ${w.replace(/^enjoy your /, "")}${who}${sep}${l3}` : `Wishing you safe travels${who}${sep}${l3}`; return [wish, mid, top]; } },
  { id: "good-weekend", re: /^have an? (good|great|nice|lovely|restful) (weekend|evening|holiday|break)(?:,? (?:all|everyone|team|folks|y'all|guys))?[.!]*$/i,
    build(t, _time, m) { const a = m[1].toLowerCase(), n = m[2].toLowerCase(); return [`Have a ${a} ${n}, everyone.`, `Wishing everyone a ${a} ${n}.`, `Wishing everyone a ${a} ${n} and a fully optimized recharge cycle. Rest is a deliverable.`]; } },
  { id: "had-it", re: /^i(?:'ve| have) had (?:enough|it) (?:of|with) (this|my) (job|place|company|team|project|role)[.!]*$/i,
    build(t, _time, m) { const n = `${m[1].toLowerCase()} ${m[2].toLowerCase()}`; return [`I'm really frustrated with ${n}.`, `Candidly, I'm at my limit with ${n}.`, `Candidly, my engagement with ${n} has reached a strategic inflection point, and not the good kind.`]; } },
  { id: "bail-early", re: /^(?:i(?:'m| am) )?(?:bailing|bouncing|ducking out|heading out|leaving|dipping|cutting out|sneaking out) early(?: (today|tomorrow))?(?:,? (?:because |since )?(?:i )?(?:have|got) (a|an) (flight|appointment|dentist appointment|doctor's appointment|train to catch|game|recital))?[.!]*$/i,
    build(t, _time, m) { const w = m[1] ? ` ${m[1]}` : ""; const why = m[3] ? ` I have ${m[2]} ${m[3]}.` : ""; return [`I'm leaving early${w}.${why}`, `Heads-up: I'll be heading out early${w}.${why}`, `I'll be transitioning out of the office early${w}.${why ? why.replace(/\.$/, ", which is a non-negotiable stakeholder commitment.") : " Protecting my bandwidth is a leadership choice."}`]; } },
  { id: "vacation-mode", re: /^(?:i(?:'m| am) )?(?:going|switching to|in) (?:full )?(vacation|holiday|weekend|beach|out-of-office) mode(?: (starting \w+|from \w+|today|tomorrow|now))?[.!]*$/i,
    build(t, _time, m) { const n = m[1].toLowerCase(); const w = m[2] ? ` ${m[2].toLowerCase()}` : ""; return [`I'm switching to ${n} mode${w}.`, `Heads-up: I'll be operating in ${n} mode${w}.`, `I'll be transitioning to a full ${n}-mode operating model${w}, with all deliverables strategically deprioritized. Rest is a deliverable.`]; } },
  { id: "thinking-skip", re: /^(?:i(?:'m| am) )?(thinking (?:of|about)|considering|tempted to) (?:ditching|skipping|bailing on|blowing off|ditch|skip|blow off) work (today|tomorrow|on \w+|\w+day)(?: (?:and|to) (?:go(?:ing)? )?(hiking|fishing|skiing|surfing|to the beach|to the lake|camping))?[.!]*$/i,
    build(t, _time, m) { const lead = /^tempted/i.test(m[1]) ? "I'm tempted to take" : /^considering/i.test(m[1]) ? "I'm considering taking" : `I'm ${m[1].toLowerCase()} taking`; const w = m[2].replace(/^on /, ""); const go = m[3] ? ` to go ${m[3]}` : ""; return [`${lead} ${w} off${go}.`, `Heads-up: ${lead} ${w} off${go}.`, `${lead} ${w} off${go.replace(/to go (\w+)/, "for an offsite with nature, also known as $1")}. Rest is a deliverable.`]; } },
);
SCENES.push(
  { id: "long-lunch", re: /^(?:i'm |i am )?(?:gonna|going to|i'll|i will|i'm going to|i'm gonna) take an? (\d+|two|three)[- ]?(?:hour|hr) lunch(?: (today|tomorrow))?[.!]*$/i,
    build(t, _time, m) { const n = m[1]; const w = m[2] ? ` ${m[2]}` : ""; return [`I'm going to take a ${n}-hour lunch${w}.`, `Heads-up: I'll be taking an extended ${n}-hour lunch${w}.`, `I'll be hosting a ${n}-hour strategic nourishment offsite at lunch${w}. Fuel is a deliverable.`]; } },
);
const base = (g) => g.replace(/ising$/, "ise").replace(/aking$/, "ake").replace(/ating$/, "ate").replace(/([^aeiou])\1ing$/, "$1").replace(/ing$/, "");

// "X is a total shitshow" / "this code is a dumpster fire" / "the new dashboard sucks" / "this policy is batshit crazy"
const SUBJ = String.raw`((?:this|that|the|our|these|those|his|her|their|my|your) [a-z0-9'’ -]{1,40}?|this|that|it|everything)`;
const ASSESS = [
  { kind: "mess", re: new RegExp(String.raw`^${SUBJ} (is|are|was|were) (?:a |an )?(?:total |complete |absolute |fucking |freaking |massive |huge |a total )?(?:shit ?show|shitshow|clusterfuck|cluster ?f\*+k|dumpster fire|train ?wreck|disaster|mess|circus|hot mess|nightmare)[.!]*$`, "i") },
  { kind: "bad", re: new RegExp(String.raw`^${SUBJ} (?:(is|are|was|were) (?:a |an )?(?:total |complete |absolute |fucking |freaking |pure |utter )?(?:corporate |hot |absolute )?(?:garbage|trash|crap|crappy|shit|shitty|awful|terrible|horrible|rubbish|junk|a piece of (?:shit|crap|junk|garbage))|(sucks?|sucked|blows|blew)(?: ass| balls| hard)?)[.!]*$`, "i") },
  { kind: "nonsense", re: new RegExp(String.raw`^${SUBJ} (is|are|was|were) (?:a |an )?(?:total |complete |absolute |fucking |utter |pure )?(?:bull ?shit|bs|horse ?shit|a joke|joke|a crock(?: of shit)?|batshit(?: crazy)?|insane|crazy|nonsense|ridiculous|absurd)(?: (dressed up in [\w ]{2,30}))?[.!]*$`, "i") },
  { kind: "boring", re: new RegExp(String.raw`^${SUBJ} (is|are|was|were) (?:so |really |super |incredibly |painfully )?(?:boring|dull|a snooze(?:fest)?|snoozefest)[.!]*$`, "i") },
];
const NOUNS3 = [
  [/\bmeeting\b/, "alignment session"], [/\bcode\b/, "codebase"], [/\bdashboard\b/, "dashboard experience"], [/\bpolicy\b/, "policy framework"],
  [/\bspreadsheet\b/, "mission-critical spreadsheet"], [/\bprinter\b/, "print infrastructure"], [/\bonboarding docs\b/, "onboarding knowledge assets"],
  [/\bplan\b/, "roadmap"], [/\bdemo\b/, "demo experience"], [/\bagenda\b/, "agenda architecture"], [/\bdeadline\b/, "delivery timeline"],
  [/\bproject\b/, "initiative"], [/\bprocess\b/, "process architecture"], [/\bwifi\b/, "connectivity infrastructure"], [/\blaunch\b/, "go-to-market motion"],
];
function assess(text) {
  let t = text.trim().replace(/^(?:honestly|frankly|man|ugh|god|dude|ok),?\s+/i, "");
  const wa = t.match(/^what an? (?:total |complete |absolute |fucking )?(?:clusterfuck|shit ?show|mess|disaster|dumpster fire|train ?wreck|circus|nightmare) (?:of an? |that )?((?:\w+ ){0,2}\w+?)(?: (?:was|is))?[.!]*$/i);
  if (wa) t = `the ${wa[1]} ${/ was$/i.test(text.replace(/[.!]+$/, "")) ? "was" : "is"} a mess`;
  // Round 11: "the line for the microwave is ridiculous" means it's long, not that a claim is false.
  if (/^(?:the )?(?:line|queue|wait)\b|\b(?:line|queue) (?:for|at|on)\b/i.test(t)) return null;
  for (const a of ASSESS) {
    const m = t.match(a.re);
    if (!m) continue;
    let subj = m[1].replace(/\s+(?:new|whole)$/i, (x) => x);
    const v = m[2] && /^(?:is|are|was|were)$/i.test(m[2]) ? m[2].toLowerCase() : /sucked|blew/i.test(`${m[2] ?? ""} ${m[3] ?? ""}`) ? "was" : /^(?:these|those)\b/i.test(subj) || /s$/.test(subj.split(" ").pop()) && !/(?:ss|ess|us|is)$/.test(subj) ? "are" : "is";
    const past = /^(?:was|were)$/.test(v);
    subj = subj.replace(/\bOKRs\b/i, "OKRs");
    let subj3 = subj;
    for (const [re, rep] of NOUNS3) if (re.test(subj3)) { subj3 = subj3.replace(re, rep); break; }
    const low = (x) => x.replace(/^(?:This|That|The|Our|These|Those|His|Her|Their|My|Your|It|Everything)\b/, (w) => w.toLowerCase());
    const S = cap(subj), S3 = cap(subj3), s1 = low(subj), s3 = low(subj3);
    const been = past ? (v === "was" ? "was" : "were") : v;
    if (a.kind === "boring") return [`${S} ${been === "is" || been === "was" ? (past ? "wasn't" : "isn't") : past ? "weren't" : "aren't"} very engaging.`, `Candidly, ${s1} ${been} hard to stay engaged with.`, `${S3} ${been} a bold experiment in minimalist engagement, and I believe there is meaningful upside in adding energy.`];
    if (a.kind === "mess") return [`${S} ${been} a mess.`, `Candidly, ${s1} ${been} pretty chaotic.`, `${S3} ${been}, to put it strategically, a masterclass in misalignment.`];
    if (a.kind === "bad") return [`${S} ${been} not good.`, `Candidly, ${s1} ${past ? "underperformed" : `${been} underperforming`}.`, past ? `${S3} significantly underindexed on quality versus the bar we aspire to as an organization.` : `${S3} ${been} significantly underindexing on quality versus the bar we aspire to as an organization.`];
    const dress = m[3] ? `, however polished the ${m[3].replace(/^dressed up in /i, "")}` : "";
    return [`${S} ${been === "is" || been === "was" ? (past ? "wasn't" : "isn't") : past ? "weren't" : "aren't"} credible${dress}.`, `Candidly, ${s1} ${past ? "didn't" : v === "are" ? "don't" : "doesn't"} hold up, and I have real doubts.`, `With the utmost respect, ${s3} ${been} not grounded in observable reality. I'd like to lean into some healthy skepticism here.`];
  }
  return null;
}

/**
 * The satire scene for a message, or null. Returns [mild, middle, csuite].
 * Only whole messages that are one of the scenes get a scene. Anything else goes through the normal engine.
 */
export function satireScene(input) {
  const text = String(input ?? "").trim().replace(/\s+/g, " ");
  if (!text || text.length > 160 || /\n/.test(text)) return null;
  const hasQ = /\?/.test(text);
  const hooky = SCENES[0].re.test(text.toLowerCase().replace(/[’]/g, "'"));
  const { body, tail } = hooky ? { body: text, tail: null } : splitTail(text);
  const lower = body.toLowerCase().replace(/[’]/g, "'").replace(/^(slacking off|goofing off|coasting|chilling|phoning it in|fucking off|dicking around|messing around|screwing around)\b/, "i'm $1");
  if (!hasQ) { const id = idiomScene(text); if (id) return id; }
  for (const s of SCENES) {
    if (hasQ && !s.q) continue;
    const m = lower.match(s.re) ?? (s.q ? body.replace(/[’]/g, "'").match(s.re) : null);
    if (!m) continue;
    const out = s.build(body.replace(/[’]/g, "'"), timeOf(body), m);
    if (!out) continue;
    return out.map((x, i) => capDay(join(x, tail ? tail[i] : ""))).map((x) => x.replace(/\s+([.,])/g, "$1").replace(/\b(vpn|api|qa|pr|ceo|cfo|cto|hr|it support|okrs?|kpis?)\b/g, (w) => w.toUpperCase().replace(/S$/, "s").replace("IT SUPPORT", "IT support")).replace(/\bslack\b/g, "Slack").replace(/\bzoom\b/g, "Zoom"));
  }
  if (!tail && !hasQ) {
    const a = assess(text.replace(/[’]/g, "'"));
    if (a) return a;
  }
  return null;
}
