// Round 11 regression tests: every r11j leftover from fresh31 (project-synergy-research/round11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCorporate, toNormal } from "../site/engine.js";
import { hasCrude } from "../site/profanity.js";

const all = (s) => [1, 2, 3].map((level) => toCorporate(s, { level, seed: 1 }));
const every = (s, re) => all(s).forEach((o, i) => assert.match(o, re, `L${i + 1}: ${o}`));
const none = (s, re) => all(s).forEach((o, i) => assert.doesNotMatch(o, re, `L${i + 1}: ${o}`));
const L1 = (s) => toCorporate(s, { level: 1, seed: 1 });
const dec = (s) => toNormal(s, { level: 1 });
const sig = (s) => toNormal(s, { level: 1 }).signal.id;

test("round 11f: comma fragments become whole sentences", () => {
  every("Stuck on the bridge, 15 min late.", /I'm stuck on the bridge, and I'll be 15 minutes late/);
  every("Nanny's out, camera off this morning.", /my nanny is out, so I'll be off camera this morning/i);
  every("Laptop died, rejoining on my phone.", /my (?:laptop|endpoint device) (?:died|stopped working|is out of commission), so I'm rejoining on my phone/i);
  every("Power's out, on hotspot.", /the power is out, so I'm on a hotspot/i);
  every("Router's down again.", /the router is/i);
  every("Calls till 3.", /I'm on calls until 3/);
  every("Finishing an email, one min.", /I'm finishing an email, and I'll be with you in a minute/);
  every("Fire drill, back in 15.", /there's a fire drill, and I'll be back in 15/i);
  every("car's in the shop, taking the train", /my car is in the shop, so I'm taking the train/i);
  every("water leak in my apartment, joining late", /there's a water leak in my apartment, so I'm joining late/i);
  every("physical therapy at 2, back by 3:30", /I have physical therapy at 2, and I'll be back by 3:30/);
  every("kid's recital tonight, logging off at 5", /I have my kid's recital tonight, so I'm logging off at 5/);
  every("landlord is showing the apartment, on mute", /the landlord is showing the apartment, so I'm on mute/i);
  every("at the airport, spotty wifi", /I'm at the airport, and (?:the wifi|our connectivity infrastructure) is spotty/);
  every("Doctor's at 8, online by 10.", /I have a doctor's appointment at 8, and I'll be online by 10/);
  every("ttyl, heading to the airport", /heading to the airport\. Talk to you later!/);
  every("In the parking lot, someone let me in.", /Could someone let me in\?/);
  none("In the parking lot, someone let me in.", /\.\?/);
  every("Approved, finally.", /it's approved, finally!/i);
  every("Sprint review moved to Wednesday.", /the sprint review has been/i);
  every("Budget doc shared in the thread.", /I've shared the budget (?:doc|document) in the thread/);
  every("out on PTO till Wednesday, ping Lee for urgent stuff", /I'm out on PTO until Wednesday\. Please reach out to Lee for anything (?:urgent|time-sensitive)/);
  every("honestly a bit lost on the new process", /I'm a bit lost on the new/);
  every("reserved the big room for the offsite", /I reserved the big room/);
  every("are we still meeting at 10", /are we still on for our [\w -]+ at 10\?/);
  every("not today, buried in tickets", /take this on today, since I'm buried in tickets/);
  // Things the completer must leave alone.
  every("Parking garage closed Friday for repairs.", /garage/);
  none("Parking garage closed Friday for repairs.", /I'm parking/);
});

test("round 11f: sarcasm is read as a complaint", () => {
  every("thanks for telling me about the launch two hours before it happened", /I'd appreciate more notice next time\. I only heard about the (?:launch|go-live) two hours before it happened/);
  every("super useful that the doc has no owner", /the (?:doc|document) has no owner/);
  none("super useful that the doc has no owner", /useful/i);
  every("perfect timing, the wifi died during my demo", /died during my demo/);
  assert.match(L1("perfect timing, the wifi died during my demo"), /^Unfortunately/);
  every("nothing says teamwork like taking credit for my slides", /it isn't really teamwork when someone is taking credit for my slides/i);
  none("nothing says teamwork like taking credit for my slides", /I'll be taking credit/);
});

test("round 11f: meaning breaks are fixed", () => {
  every("can you have a look look at the contract", /(?:take a look at|review) the contract/);
  none("can you have a look look at the contract", /have a take|have a review|look look/);
  none("can you send over the signed NDA", /over over/);
  every("closed all P1 bugs this week", /closed all P1/);
  none("closed all P1 bugs this week", /Unfortunately|headwind|growth opportunity/);
  every("the lobby plants look sad", /plants look a bit droopy/);
  none("the lobby plants look sad", /look (?:down|low)/);
  every("she knocked the presentation out of the park", /she did (?:an amazing|a really good|a great) job on the presentation/i);
  none("she knocked the presentation out of the park", /Thank you, She|Adversity|headwind/);
});

test("round 11f: sign-offs and Level 1 fit the message type", () => {
  assert.doesNotMatch(L1("the survey response rate is great but the scores dropped"), /Great work/);
  assert.equal(L1("safe travels!"), "Safe travels!");
  none("safe travels!", /Just so you know|heads-up/i);
  for (const s of ["safe travels!", "she knocked the presentation out of the park", "not today, buried in tickets"]) for (const o of all(s)) assert.ok(!hasCrude(o), o);
});

test("round 11f: decode names the news for new wording", () => {
  assert.match(dec("Some roles in customer support will be affected by this change.").summary, /jobs in customer support are being cut/);
  assert.match(dec("We're scaling back the snack program.").summary, /snack program is being cut back/);
  assert.match(dec("Summer Fridays are not returning this year.").summary, /not coming back/);
  assert.match(dec("You'll now need to cover your own conference fees.").summary, /pay for your own conference fees/);
  assert.match(dec("Expense payouts are running behind this cycle.").summary, /late/);
  assert.match(dec("Hybrid work is being replaced by full-time office attendance.").summary, /office full time/);
  assert.match(dec("Several teams will have new managers starting next week.").summary, /new bosses/);
  assert.match(dec("Our podcast is ending after this season.").summary, /podcast is ending/);
  assert.match(dec("Some paychecks were issued with the wrong amount.").summary, /Something went wrong/);
  assert.match(dec("We'll be setting up a formal plan to address your performance.").summary, /formal warning/);
  assert.match(dec("We're taking a hard look at our cost structure.").summary, /cut costs/);
  assert.match(dec("Ana will be moving on at the end of the quarter.").summary, /Ana is leaving/);
  assert.match(dec("Desks will be reassigned to people who come in regularly.").summary, /lose your desk/);
  assert.match(dec("The two regional sales teams are being combined.").summary, /merged into one/);
  // Neutral memos stay calm.
  assert.doesNotMatch(dec("The new parking garage opens in June.").summary, /going away|losing their jobs/);
  assert.doesNotMatch(dec("We're adding more snacks to the kitchen.").summary, /cut back|going away/);
});

test("round 11g: more fragment families become sentences", () => {
  every("Bus missed, next one in 20.", /I missed my bus, and the next one is in 20 minutes/);
  every("Babysitter canceled, working from home.", /my babysitter canceled, so I'm working (?:from home|remotely)/);
  assert.match(L1("Headset dead, switching to laptop audio."), /my headset is dead, so I'm switching to laptop audio/);
  every("Dog's at the vet, offline till 2.", /my dog is at the vet,.* so I'll be offline until 2/);
  every("Kid home sick, camera off.", /my kid is home sick, so I'll be off camera/);
  every("On a plane, back online tonight.", /I'm on a plane, and I'll be back online tonight/);
  every("Construction next door, sorry for the noise.", /There's construction next door\. (?:Sorry|Apologies|My apologies) for the noise/i);
  every("plumber coming between 1 and 3, might step away", /a plumber is coming between 1 and 3, so I may step away/);
  every("home with a migraine, offline today", /I'm home with a migraine, so I'll be offline today/);
  every("Toddler's sick, half day.", /my toddler is sick, so I'm taking a half day/);
  every("Train stuck outside the station, running 20 late.", /my train is stuck outside the station, so I'm running 20 minutes (?:late|behind)/);
  every("car won't start, joining remote", /so I'm joining remotely/);
  every("off till Monday, Priya has my stuff", /(?:I'm off|I'll be out) until Monday, and Priya is covering for me/);
  every("pto friday, ping Omar if anything breaks", /I'll be on PTO Friday\. Please reach out to Omar if anything breaks/);
  assert.match(L1("brb, doorbell"), /I'll be right back\. Someone's at the door/);
  every("Keyboard arrived, finally.", /my keyboard finally arrived!/i);
  every("revenue up 12% month over month", /revenue is up 12% month over month/i);
  every("3 of 5 tests still failing", /3 of 5 tests are still failing/);
  every("wrapped the user interviews", /I wrapped up the user interviews/);
});

test("round 11g: more sarcasm families read as complaints", () => {
  every("so helpful that the wiki page is three years old", /the wiki page is three years old/);
  none("so helpful that the wiki page is three years old", /helpful|Kudos/i);
  every("love that the meeting about fewer meetings ran long", /frustrated that/);
  assert.match(L1("really appreciate the reply-all storm this morning"), /I wasn't a fan of the reply-all storm/);
  every("wow, the coffee machine broke on Monday morning, amazing", /broke on Monday morning/);
  none("wow, the coffee machine broke on Monday morning, amazing", /amazing|really good|best-in-class|Kudos/i);
  assert.match(L1("thanks for scheduling the retro during my lunch"), /(?:rather|prefer to) not have the retro scheduled during my lunch/);
  every("loving the 7am calls with the west coast team", /not a fan of these 7am calls/);
  every("perfect, the vpn logged me out mid-deploy", /the VPN logged me out mid-deploy/);
  assert.match(L1("perfect, the vpn logged me out mid-deploy"), /^Unfortunately/);
  assert.doesNotMatch(L1("the client loved the demo but wants a discount"), /happy to share/);
});

test("round 11h: fresh33 fragments become whole sentences", () => {
  assert.match(L1("Daycare closed, kids with me today."), /the daycare is closed, so my kids are with me today/i);
  assert.match(L1("Car battery dead, getting a jump."), /my car battery is dead, so I'm getting a jump/i);
  every("Workshops till 3.", /I'm in workshops until 3/);
  assert.match(L1("In an Uber, there in 15."), /I'm in an Uber, and I'll be there in 15/);
  assert.match(L1("Son home sick, off camera."), /my son is home sick, so I'll be off camera/i);
  assert.match(L1("Charger died, on 5%."), /my charger died, and my battery is at 5%/i);
  assert.match(L1("Leaf blowers outside, sorry for the noise."), /There are leaf blowers outside\. Apologies for the noise/);
  assert.match(L1("Hotel wifi down, on hotspot."), /the hotel wifi is down, so I'm on a hotspot/i);
  assert.match(L1("Lunch delivered, eating at my desk."), /my lunch just arrived, so I'm eating at my desk/i);
  assert.match(L1("Toddler awake, back in 10."), /my toddler is awake, and I'll be back in 10/i);
  assert.match(L1("Wifi spotty at the airport, may drop."), /the wifi is spotty at the airport, so I may drop/i);
  assert.match(L1("electrician coming at 11, might drop off"), /an electrician is coming at 11, so I may drop off/i);
  assert.match(L1("nephew's graduation today, offline after 2"), /I have my nephew's graduation today, so I'll be offline after 2/);
  assert.match(L1("In the garage, can someone open the gate."), /I'm in the garage\. Could someone open the gate\?$/);
  assert.match(L1("bc of the outage we pushed the release"), /^Because of the outage, we pushed the release\.$/);
  assert.match(L1("on PTO the rest of the week, back Monday"), /on PTO for the rest of the week, and I'll be back Monday/);
  assert.match(L1("out till Wednesday, Jo has my tickets"), /out until Wednesday\. Jo is covering my tickets/);
  assert.match(L1("off till Monday, Priya has my stuff"), /Priya is covering for me/);
  assert.match(L1("gm, coffee first then standup"), /^Good morning! I'm grabbing coffee first, then I'll join standup\.$/);
  assert.match(L1("brb, oven timer"), /right back\. I(?:'ll)? need to check the oven timer/);
  assert.match(L1("internet's flaky, may drop"), /my internet is flaky/i);
  every("wfh today, roof guys are here", /the roofers are here/);
});

test("round 11h: fresh33 sarcasm reads as the real complaint", () => {
  assert.match(L1("thanks for telling me the meeting moved after I drove in"), /more notice next time\. I only found out the .+ moved after I drove in/);
  every("so glad we spent the morning renaming folders", /not sure spending the morning renaming folders was the/);
  assert.match(L1("so helpful that the error message just says error"), /^Unfortunately, the error message just says error\.$/);
  assert.match(L1("really great that the onboarding doc links to a dead page"), /^Unfortunately, the onboarding doc links to a dead page\.$/);
  every("love that the all-hands about transparency was off the record", /frustrated that the all-hands about transparency was off the record/);
  every("really appreciate the 6am calendar invite", /wasn't a fan of the 6am calendar invite/);
  assert.match(L1("perfect, the printer is out of toner before the board meeting"), /^Unfortunately, the printer is out of toner/);
});

test("round 11h: good news never reads as bad news", () => {
  assert.match(L1("fixed the broken link in the footer"), /^I'm happy to share that we fixed the broken link/);
  none("fixed the broken link in the footer", /Unfortunately|Flagging|Raising a flag/);
  assert.doesNotMatch(L1("churn down 3% this quarter"), /It looks like|Churn/);
  assert.doesNotMatch(toCorporate("churn down 3% this quarter", { level: 2, seed: 1 }), /Flagging|Raising/);
  every("locked out of the building, late to the sync", /locked out of the building/);
  assert.doesNotMatch(toCorporate("traffic is up but conversions are down", { level: 3, seed: 1 }), /availability headwind/);
  every("feel better soon, Ella", /Ella/);
  none("get well soon, Marco", /shortly|near term|marco/);
  assert.match(toCorporate("get well soon, Marco", { level: 3, seed: 1 }), /speedy recovery, Marco, and/);
});

test("round 11h: decode reads more new wordings", () => {
  assert.match(dec("The overnight support team will be disbanded.").summary, /overnight support team are losing their jobs/);
  assert.match(dec("This decision affects about 8% of our workforce.").summary, /losing their jobs/);
  assert.match(dec("Payroll will be a day late this cycle.").summary, /Payroll will be a day late this cycle/);
  assert.match(dec("The new chairs won't arrive until January.").summary, /new chairs are late and won't come until January/);
  assert.match(dec("The 401(k) match is dropping to 2%.").summary, /401\(k\) match is being cut/);
  assert.match(dec("You'll need to buy your own monitors going forward.").summary, /pay for your own monitors/);
  assert.match(dec("All staff are expected on-site Tuesday through Thursday.").summary, /in the office Tuesday through Thursday/);
  assert.match(dec("Some customers were billed twice this month.").summary, /^Something went wrong/);
  assert.match(dec("We've received several complaints about your communication.").summary, /concerns about your work/);
  assert.match(dec("We're evaluating our office footprint.").summary, /shrink or close offices\. Nothing is decided/);
  assert.match(dec("Please join me in thanking Sam as he moves on to a new role.").summary, /Sam is leaving/);
  assert.equal(dec("The garage will be closed Sunday for power washing.").themes.length, 0);
  assert.equal(dec("We're opening a new office in Lisbon.").themes.filter((t) => t.tone === "bad").length, 0);
});

test("round 11i: fresh34 fragments become whole sentences", () => {
  every("Offline 10, grabbing water.", /I'll be away for 10 minutes\. I'm grabbing water\./);
  every("Wifi out, tethering to my phone.", /(?:the|our) (?:wifi|connectivity infrastructure) is out, so I'm tethering to my phone/i);
  every("Headset dying, switching to speaker.", /my (?:headset|audio-collaboration hardware) is dying, so I'm switching to speaker/i);
  every("Doctor ran late, in by 11.", /my doctor's appointment ran late, and I'll be in by 11/i);
  every("Coffee spilled on my keyboard, give me five.", /I spilled coffee on my keyboard, and I need five minutes/);
  every("Babysitter running behind, starting at 10.", /my babysitter is (?:running behind|slightly delayed)[\w ]*, so I'll be starting at 10/i);
  every("Power flickered, rejoining.", /the power flickered, so I'm rejoining/i);
  every("Noisy cafe, staying on mute.", /I'm in a noisy cafe, so I'm staying on mute/);
  every("Furnace guy here, might be in and out.", /the furnace technician is here, so I may be in and out/i);
  every("Phone at 3%, call me on Slack.", /is at 3%\. Could you please (?:call|ping) me on Slack\?/);
  every("I'm out sick, Lee has the standup.", /and Lee is covering the/);
  every("Car in the shop, remote today.", /my car is in the shop, so I'm working remotely today/i);
  every("Interviews all morning.", /I'm in interviews all morning/);
  every("kid's soccer game at 4, leaving at 3:30", /I have my kid's soccer game at 4, so I'm heading out at 3:30/i);
  every("I have parent-teacher conference at 3", /I have a parent-teacher conference at 3/);
  every("Headache today, slow replies.", /I have a headache today, so my replies may be slow/i);
  every("moving apartments this weekend, offline Saturday", /moving apartments|residential migration/);
  every("moving apartments this weekend, offline Saturday", /and I'll be offline Saturday/);
  every("partner's birthday, logging off early", /it's my partner's birthday, so I'm logging off early/i);
  every("water heater broke, plumber coming at 2", /the water heater broke, and a plumber is coming at 2/i);
  every("Neighbor mowing, on mute.", /my neighbor is mowing, so I'm on mute/i);
  every("In the lobby, can someone buzz me up", /I'm in the (?:lobby|first-impression zone)\. Could someone buzz me up\?/);
  none("In the lobby, can someone buzz me up", /\.\?/);
  every("Deck updated with the new figures.", /I've updated the deck with the new/);
  every("Somebody left their badge in room 4.", /^(?:[^:]+: )?[Ss]omebody left their badge in room 4/);
  none("Somebody left their badge in room 4.", /the somebody/i);
});

test("round 11i: out-of-office lines keep the day, the backup and the ask", () => {
  every("out Monday, back Tuesday", /I'll be out Monday, and I'll be back Tuesday/);
  every("out of office Monday, reach out to Priya", /I'll be out of office Monday\. Please reach out to Priya if you need anything/);
  assert.match(toCorporate("I'm out tomorrow, ping Dev if urgent", { level: 3, seed: 1 }), /reach out to Dev if anything becomes mission-critical/);
});

test("round 11i: refusals and sarcasm keep the no and the reason", () => {
  every("not this sprint, full plate", /(?:unable|won't be able) to take this on this sprint, since my plate/);
  every("no can do today, back to back", /(?:unable|won't be able) to take this on today, since I'm in back-to-back/);
  every("happy friday all", /[Hh]appy Friday, everyone!|Wishing everyone a happy Friday/);
  none("happy friday all", /the all/);
  assert.equal(toCorporate("happy holidays everyone", { level: 1 }), "Happy holidays, everyone!");
});

test("round 11i: objects and fixes read as good news, not praise of people or problems", () => {
  none("The new coffee machine is great.", /Great work|Kudos|Outstanding impact/);
  every("Login fixed, finally.", /the login is fixed, finally!/i);
  none("Login fixed, finally.", /[Uu]nfortunately|headwind/);
  every("Issues down 40% since the fix.", /(?:issues|bugs) are (?:currently )?down 40% since the fix/i);
  none("costs down 12% this quarter", /headwind/);
  none("Huge props to ops for the migration.", /^Just a quick update/);
});

test("round 11i: decode reads fresh34 wordings and does not cross families", () => {
  assert.equal(sig("We're ending remote Fridays starting next month."), "rto");
  assert.equal(sig("The remote stipend ends as we return to the office."), "rto");
  assert.equal(sig("The remote work stipend continues, and we're moving to three office days."), "rto");
  assert.doesNotMatch(dec("The remote work stipend continues, and we're moving to three office days.").summary, /stipend/);
  assert.equal(sig("The team offsite has been postponed until later this year."), "delay");
  assert.match(dec("The wellness stipend is being phased out.").summary, /wellness stipend is going away/);
  assert.match(dec("Each team must now fund its own software licenses.").summary, /pay for your own software licenses/);
  assert.equal(sig("Most new headcount requests will be denied this quarter."), "budget-freeze");
  assert.equal(sig("Conference travel won't be approved this half."), "budget-freeze");
  assert.equal(sig("We aren't approving any new software purchases right now."), "budget-freeze");
  assert.match(dec("A misconfiguration exposed some internal documents.").summary, /^Something went wrong/);
  assert.match(dec("Ravi will depart the company at the end of the month.").summary, /Ravi is leaving/);
  assert.equal(sig("The beta program is being retired."), "shutdown");
  assert.equal(sig("The HR portal goes offline next weekend for maintenance."), "none");
  assert.equal(sig("Your request was approved."), "none");
});

test("round 11j: thing plus state plus a bare action becomes one sentence", () => {
  every("Router rebooting, back in five.", /my router is rebooting, so I'll be back in five/i);
  every("Car battery died, getting a jump.", /my car battery died, so I'm getting a jump/i);
  every("Headphones dead, on speaker.", /my headphones are dead, so I'm on speaker/i);
  every("Internet back, rejoining.", /my (?:internet|network) is back, so I'm rejoining/i);
  every("Parking lot full, circling.", /is full|reached full capacity/);
  every("Parking lot full, circling.", /so I'm circling for a spot/);
  every("Water main broke on my street, no water.", /the water main on my street broke, so I have no water/i);
  none("Water main broke on my street, no water.", /Could you|If you could/);
  every("Power out at my place, working from a cafe.", /the power at my place is out, so I'm working from a cafe/i);
  every("Battery at 5%, finding a charger.", /my battery is at 5%, so I'm finding a charger/i);
  every("Doorbell, one sec.", /someone is at the door, so I'll be (?:right back|stepping away briefly)/i);
  every("Bad connection, turning off video.", /my connection is (?:bad|not ideal), so I'm turning off my video/i);
  every("Toddler teething, rough night.", /my toddler is teething, so I had a rough night/i);
  every("Movers coming at 8, late start.", /the movers are coming at 8, so I'll be starting late/i);
  every("Kid's field trip, chaperoning till 2.", /I'm chaperoning my kid's field trip, so I'll be out until 2/);
  every("Mechanic has my car, remote tomorrow.", /my car is at the mechanic, so I'll be working remotely tomorrow/i);
  none("Mechanic has my car, remote tomorrow.", /Mechanic is covering/);
  every("Knee surgery Friday, out next week.", /I have knee surgery Friday, so I'll be out next week/);
  every("Moving desks today, slow to reply.", /I'm moving desks today/);
});

test("round 11j: cover lines, bare first-person lines and feelings", () => {
  every("off next week, Sam is covering", /I'll be off next week, and Sam is covering for me/);
  every("PTO thursday, Kim has the release", /I'll be on PTO Thursday, and Kim is covering the release/);
  every("away all of august, Leo is point", /I'll be away all of August, and Leo is the point person/);
  every("talked to legal, they need two more days", /I talked to legal, and they need two more days/);
  every("locked myself out of the house", /I locked myself out of the house/);
  every("running a 10k on saturday, wish me luck", /I'm running a 10k on Saturday\. Wish me luck!/);
  every("pretty bummed the offsite got cancelled", /I'm disappointed that the offsite got cancelled/);
  none("so thrilled the quarterly planning doc is 40 pages", /^(?:[^:]+: )?I'm thrilled/);
  every("I have parent-teacher conference at 3", /I have a parent-teacher conference at 3/);
  every("I have eye appointment tomorrow", /I have an eye appointment tomorrow/);
});

test("round 11j: decode reads fresh35 families and keeps neutral memos neutral", () => {
  assert.equal(sig("The warehouse night crew will be phased out by spring."), "layoffs");
  assert.equal(sig("We're reducing our engineering headcount by about one in ten."), "layoffs");
  assert.equal(sig("This restructuring will result in the elimination of the training team."), "layoffs");
  assert.equal(sig("Expense reimbursements will take an extra week this month."), "delay");
  assert.match(dec("The vendor has informed us that the new desks will arrive in March.").summary, /new desks will be late and won't come until March/);
  assert.equal(sig("Phone reimbursements are being capped at $25 per month."), "benefits");
  assert.equal(sig("We are lowering the annual PTO carryover limit to three days."), "benefits");
  assert.equal(sig("Starting next month, employees will cover the cost of their own parking."), "cost-increase");
  assert.equal(sig("Open requisitions are on hold until further notice."), "hiring-freeze");
  assert.equal(sig("Remote work will only be approved in exceptional circumstances."), "rto");
  assert.equal(sig("The work-from-anywhere program will end in June."), "rto");
  assert.equal(sig("Our partnership program is being discontinued."), "shutdown");
  assert.equal(sig("A payroll error resulted in some employees being underpaid this month."), "problem");
  assert.equal(sig("There have been several missed deadlines on your projects."), "performance");
  assert.equal(sig("We're assessing whether to continue the pilot."), "hedge");
  assert.match(dec("We thank Elena for her years of service as she retires next month.").summary, /Elena is retiring/);
  assert.equal(sig("After review, we won't be approving the new tool.") === "budget-freeze", false);
  assert.equal(dec("Our outage last week has been fully resolved and no data was lost.").themes.filter((t) => t.tone === "bad").length, 0);
  assert.equal(sig("The finance team is hosting office hours for budget questions on Wednesdays."), "none");
});

test("round 11j: metric nouns stay lowercase after a frame", () => {
  for (const s of ["errors are up 3x since the deploy", "bugs are up 20% this week", "complaints are up since the change"]) none(s, /(?:like|that|Heads-up:|update:) [A-Z][a-z]+ are up/);
});
