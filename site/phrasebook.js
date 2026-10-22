// Project Synergy phrasebook.
// Swap format: "plain phrase = mild options = middle manager options = c-suite options".
// Options are separated by "|". An empty tier falls back to the tier below it.
// Matching is case insensitive and whole word. Longer phrases win over shorter ones.

export const CORPORATE_SWAPS = `
!^i don't know = I'm not sure yet = I don't have visibility into that yet = that's outside my current line of sight
i have no idea = I'm not sure yet = I don't have the full picture yet = I lack the data granularity to opine
!no idea = no clear answer yet = limited visibility = zero line of sight
i don't care = I'm flexible on this = I'm agnostic on that = I'm fully outcome-agnostic here
i don't have time = my plate is full = I don't have the bandwidth = I'm at full capacity across all verticals
no time = limited time = zero bandwidth = no available capacity
!i'm busy = I'm tied up = I'm heads down = I'm in deep execution mode
!i'm tired = I'm worn out = I'm at reduced capacity = my personal battery KPIs are trending down
i'm hungry = I could use a break = I need to refuel = I need to optimize my caloric pipeline
i'm bored = I'm looking for a new challenge = I'm seeking more strategic stretch = I'm under-leveraged
!i'm sorry = I apologize = I acknowledge the miss = I take full ownership of the learning opportunity
!^sorry = apologies = apologies for the friction = I own that misalignment
my bad = my mistake = I'll own that = that's a learning I'm taking forward
!^i quit = I'm moving on = I'm transitioning to my next chapter = I'm exploring opportunities outside the org
i'm leaving = I'm heading out = I'm transitioning out = I'm sunsetting my presence
i'm out = I'm signing off = I'm stepping back = I'm exiting this workstream
i'm late = I'm running behind = I'm slightly off schedule = I'm operating on a dynamic timeline
i forgot = it slipped through = it fell through the cracks = it was deprioritized by my memory infrastructure
^i messed up = I made a mistake = I dropped the ball = I generated an unplanned learning moment
^i screwed up = I made an error = I dropped the ball = I created a growth opportunity for everyone
i need help = I could use some support = I need some extra hands on deck = I'm seeking cross-functional resourcing
i agree = I'm on board = I'm aligned = I'm fully aligned and bought in
i disagree = I see it differently = I'd like to push back a bit = I'd like to offer a different strategic lens
that's wrong = that's not quite right = that's not aligned with the data = that runs counter to our north star
you're wrong = I see it a little differently = I'm not sure we're aligned = let's realign on the source of truth
shut up = let's pause here = let's take this offline = let's table your input for now
leave me alone = I need some focus time = I'm blocking off deep work time = I'm going dark to drive outcomes
go away = let's reconnect later = let's circle back later = let's sunset this conversation
hurry up = let's pick up the pace = let's move with urgency = let's accelerate our velocity
calm down = let's slow down a bit = let's reset the temperature = let's recalibrate our emotional bandwidth
^huh = could you clarify = can you say more = can you double-click on that
^whatever = sure = I'm flexible = I'm aligned with whatever drives value
^fine = okay = works for me = I'm directionally supportive
!^ok = sounds good = I'm aligned = that's a green light from me
!^okay = sounds good = I'm aligned = that's a green light from me
!^yes = sounds good = absolutely, I'm aligned = that's a strong yes from a strategic standpoint
^yeah = sure = absolutely = affirmative, let's operationalize that
^yep = sure = absolutely = that's a hard yes
!^no = not right now = that's not a priority this quarter = we're going to deprioritize that
^nope = not this time = that's a no for now = that's not on the roadmap
maybe = possibly = potentially = potentially
probably = likely = likely = directionally
never = not in the near term = not on the current roadmap = not in this fiscal lifetime
right now = right away = as a top priority = immediately, with urgency
!asap = soon = at your earliest convenience = with maximum urgency
later = a bit later = in a future sprint = in a later phase
soon = shortly = in the near term = in the coming cycles
tomorrow = tomorrow = tomorrow EOD = tomorrow, close of business
today = today = today EOD = today, close of business
next week = next week = early next sprint = in the next planning horizon
this week = this week = this sprint = within the current execution window
eventually = in time = down the road = at some point on the long-term roadmap
again = once more = one more time = in another iteration
idea = thought = initiative = strategic initiative
ideas = thoughts = initiatives = strategic initiatives
goal = goal = objective = north star
goals = goals = objectives = north star metrics
!problem = issue = challenge = growth opportunity
!problems = issues = challenges = growth opportunities
issue = concern = pain point = opportunity area
issues = concerns = pain points = opportunity areas
mistake = slip = miss = learning opportunity
mistakes = slips = misses = learning opportunities
failure = setback = miss = non-success outcome
failed = fell short = missed the mark = generated valuable learnings
fail = fall short = miss the mark = underdeliver against expectations
bug = issue = defect = unplanned feature
bugs = issues = defects = unplanned features
!fix = repair = address = remediate
!fixed = repaired = addressed = remediated
broken = not working = in a degraded state = experiencing suboptimal uptime
!stupid = not ideal = not best practice = not best-in-class
!dumb = not ideal = not optimal = not best-in-class
bad = not great = suboptimal = misaligned with our values
terrible = pretty rough = deeply suboptimal = a significant value leak
awful = rough = suboptimal = a value-destroying event
!sucks = isn't great = is suboptimal = underindexes on value
crap = not great = low quality = low-value output
good = good = solid = best-in-class
!great = really good = strong = world-class
!awesome = great = excellent = a total game changer
amazing = really good = outstanding = transformational
cool = nice = great = exciting
nice = nice = great = value-additive
!weird = unusual = unexpected = non-standard
crazy = intense = ambitious = disruptive
easy = simple = straightforward = low-hanging fruit
simple = simple = straightforward = frictionless
big = large = significant = enterprise-scale
huge = big = massive = needle-moving
small = small = lean = right-sized
!cheap = affordable = cost-effective = capital efficient
!expensive = pricey = costly = capital intensive
!money = funds = budget = capital
cash = money = budget = liquidity
salary = pay = compensation = total rewards package
!boss = manager = leadership = executive sponsor
!bosses = managers = leadership = executive sponsors
manager = lead = people leader = people leader
team = team = squad = cross-functional pod
teams = teams = squads = cross-functional pods
coworker = colleague = teammate = valued stakeholder
coworkers = colleagues = teammates = valued stakeholders
people = folks = stakeholders = human capital
everyone = everyone = all hands = the entire ecosystem
customer = customer = client = end user
customers = customers = clients = end users
users = users = end users = our user ecosystem
job = role = position = career journey
working = working = executing = driving outcomes
worked = worked = executed = delivered value
working on = working on = driving = spearheading
job title = title = role = brand identity
!email = message = note = ping
!emails = messages = notes = touchpoints
!meeting = catch-up = sync = alignment session
!meetings = catch-ups = syncs = alignment sessions
chat = chat = quick sync = huddle
talk = chat = connect = sync
talk about = discuss = unpack = double-click on
talked about = discussed = unpacked = aligned on
talk later = talk later = circle back = reconnect offline
think about = consider = noodle on = ideate around
think = think = feel = believe
i think = I believe = my sense is = my strategic read is
i feel like = I feel = my gut says = my intuition is signaling
i guess = I suppose = I'd assume = my working hypothesis is
honestly = frankly = transparently = in the spirit of radical candor
basically = essentially = at a high level = from a thirty-thousand-foot view
anyway = anyway = moving forward = pivoting
actually = in fact = to clarify = for full transparency
obviously = clearly = as we all know = as the data clearly shows
seriously = really = truly = with full intentionality
really = really = genuinely = deeply
very = very = highly = mission-critically
super = very = highly = exponentially
totally = completely = fully = holistically
kind of = somewhat = partially = directionally
sort of = somewhat = loosely = directionally
a lot = a lot = significantly = at scale
lots of = plenty of = a significant amount of = a robust volume of
a little = a bit = slightly = incrementally
more = more = additional = incremental
less = less = reduced = right-sized
use = use = leverage = leverage
using = using = leveraging = leveraging
done = done = completed = fully actioned
finish = finish = wrap up = close out
finished = finished = wrapped up = closed out
start = start = kick off = launch
started = started = kicked off = launched
starting = starting = kicking off = launching
stop = stop = pause = sunset
stopped = stopped = paused = sunsetted
!quit = stop = step away from = sunset
change = change = shift = pivot
changed = changed = shifted = pivoted
changes = changes = shifts = transformations
check = check = review = audit
check in = check in = touch base = sync up
checking = checking = reviewing = auditing
look at = look at = review = take a deep dive into
looked at = looked at = reviewed = did a deep dive on
look into = look into = dig into = investigate holistically
ask = ask = request = ask
asked = asked = requested = escalated
tell = tell = inform = socialize this with
told = told = informed = socialized this with
tell me = let me know = keep me posted = keep me in the loop
let me know = let me know = keep me posted = keep me in the loop
send = send = share = circulate
sent = sent = shared = circulated
share = share = socialize = cascade
learn = learn = upskill = upskill
learned = learned = took away = captured key learnings
improve = improve = optimize = transform
improved = improved = optimized = transformed
fire = let go = part ways with = rightsize
!fired = let go = parted ways with = rightsized
cut = cut = reduce = streamline
cuts = cuts = reductions = efficiencies
copy = copy = replicate = leverage existing IP
steal = borrow = repurpose = leverage existing IP
stole = borrowed = repurposed = leveraged existing IP
guess = guess = estimate = forecast
guessed = guessed = estimated = forecasted
wait = wait = hold = pause for alignment
waiting = waiting = on hold = in a holding pattern
waste = waste = inefficiency = value leakage
wasted = wasted = spent = inefficiently allocated
!lazy = low energy = under-engaged = optimizing for rest
slow = slow = behind schedule = on a deliberate timeline
fast = fast = quick = high-velocity
quick = quick = rapid = agile
quickly = quickly = rapidly = at velocity
!late = running behind = delayed = on a dynamic timeline
early = early = ahead of schedule = proactively
!busy = tied up = at capacity = fully leveraged
thanks = thanks = thank you = I appreciate your partnership
thank you = thank you = I appreciate it = I appreciate your partnership
thank you so much = thank you so much = I really appreciate it = I deeply appreciate your partnership
please = please = kindly = at your earliest convenience, please
^hi = hi = hi team = hi all
^hello = hello = hello team = greetings, stakeholders
^hey = hi = hi team = hi all
^bye = bye = talk soon = let's reconnect soon
!lunch = lunch break = team lunch = midday recharge
coffee = coffee = coffee chat = caffeinated alignment session
vacation = time off = PTO = strategic recharge
weekend = weekend = weekend = offline window
sick = sick = out sick = operating at reduced capacity
nap = rest = recharge = strategic recharge
sleep = rest = recharge = restorative downtime
party = get-together = team event = culture-building offsite
fun = fun = engaging = culture-additive
game = game = team activity = gamified engagement initiative
friend = friend = contact = trusted partner
friends = friends = contacts = my network
dog = dog = pet = emotional support stakeholder
cat = cat = pet = remote coworker
pizza = pizza = team lunch = culture initiative
beer = drinks = happy hour = team bonding initiative
drinks = drinks = happy hour = team bonding initiative
phone = phone = device = mobile endpoint
computer = computer = laptop = workstation
internet = internet = network = connectivity layer
spreadsheet = spreadsheet = tracker = single source of truth
list = list = tracker = prioritized backlog
to-do list = to-do list = backlog = prioritized backlog
notes = notes = takeaways = key learnings
!question = query = open item = parking lot item
questions = questions = open items = parking lot items
reason = reason = rationale = strategic rationale
because of = because of = due to = as a downstream effect of
we need to = we need to = we should = we have a strategic imperative to
because = because = given that = as a function of the fact that
i want = I'd like = I'd love = I'm seeking
we need = we need = we require = we have a critical dependency on
you need to = you should = you'll want to = you're empowered to
can you = could you = would you be able to = do you have the bandwidth to
could you = could you = would you be able to = do you have the bandwidth to
!>i can't = I'm unable to = I don't have the capacity to = I'm not resourced to
!>can't = cannot = won't be able to = won't have the bandwidth to
^i won't = I'd rather not = I'm not going to commit to that = I'm declining to operationalize that
not my job = not my area = outside my scope = outside my core competency
not my problem = not my area = outside my scope = not in my swim lane
who cares = it's not a priority = that's low impact = that's not needle-moving
whatever works = whatever works = I'm flexible = I'm aligned with any value-driving outcome
let's do it = let's do it = let's move forward = let's operationalize this
let's go = let's go = let's get started = let's activate
good job = good job = great work = outstanding value delivery
nice work = nice work = great work = exceptional execution
well done = well done = great execution = best-in-class delivery
thanks for nothing = thanks for trying = I appreciate the effort = I appreciate your directional contribution
told you so = as I mentioned = per my last email = as previously socialized
like i said = as I said = as I mentioned = per my last email
as i said = as I mentioned = per my last email = as previously cascaded
reminder = reminder = gentle reminder = friendly nudge per my last email
remind = remind = nudge = gently escalate
!annoying = frustrating = a bit of friction = a misaligned experience
angry = upset = frustrated = experiencing strong feedback
mad = upset = frustrated = misaligned
sad = down = low = experiencing a dip in morale
happy = happy = excited = deeply energized
excited = excited = energized = deeply energized
scared = worried = concerned = risk-aware
worried = concerned = cautious = risk-aware
confused = unclear = seeking clarity = seeking alignment
!hate = dislike = have concerns about = have strategic reservations about
!love = really like = really value = deeply value
want = want = would like = would love
understand = understand = get = have alignment on
remember = remember = recall = have institutional memory of
forget = forget = drop = deprioritize
forgot = forgot = dropped = deprioritized
fixing = fixing = addressing = remediating
building = building = developing = architecting
build = build = develop = architect
built = built = developed = architected
write = write = draft = author
wrote = wrote = drafted = authored
plan for = plan for = prepare for = future-proof for
deadline = deadline = due date = hard stop
deadlines = deadlines = due dates = hard stops
schedule = schedule = timeline = roadmap
priority = priority = top priority = mission-critical priority
important = important = a priority = mission-critical
urgent = urgent = time-sensitive = a P0
everything = everything = the full scope = the entire value chain
nothing = nothing = zero output = a null deliverable
something = something = an item = an initiative
stuff = stuff = items = deliverables
things = things = items = workstreams
thing = thing = item = workstream
project = project = initiative = strategic initiative
projects = projects = initiatives = strategic initiatives
job done = job done = deliverable shipped = value fully realized
company = company = organization = enterprise
office = office = workplace = collaboration hub
desk = desk = workspace = productivity station
chair = chair = seat = ergonomic asset
room = room = space = collaboration zone
kitchen = kitchen = break room = nourishment hub
bathroom = bathroom = restroom = wellness break facility
car = car = commute vehicle = mobility asset
traffic = traffic = commute delays = mobility headwinds
weather = weather = conditions = environmental headwinds
rain = rain = bad weather = environmental headwinds
mess = mess = disorganized situation = unstructured ecosystem
messy = messy = disorganized = unstructured
chaos = chaos = a lot of moving parts = a dynamic environment
drama = drama = friction = interpersonal misalignment
gossip = gossip = chatter = informal knowledge sharing
rumor = rumor = chatter = unofficial narrative
complain = complain = raise concerns = surface feedback
complaining = complaining = raising concerns = surfacing feedback
argue = argue = debate = engage in robust discourse
argument = argument = debate = spirited alignment session
winning = winning = succeeding = crushing our OKRs
money talk = money talk = budget discussion = capital allocation dialogue
the plan = the plan = the roadmap = the strategic roadmap
a plan = a plan = a roadmap = a strategic roadmap
i need to = I need to = I have to = I have a strategic imperative to
no problem = no problem = happy to help = happy to unlock value
a raise = a raise = a compensation adjustment = a total rewards recalibration
make sure = make sure = ensure = ensure alignment that
work from home = work from home = work remotely = drive outcomes from my home office hub
working from home = working from home = working remotely = driving outcomes from my home office hub
i'm done = I'm finished = I'm wrapping up = I've fully actioned everything
i'm fine = I'm good = I'm doing well = I'm operating at full capacity
i'm happy = I'm glad = I'm energized = I'm deeply energized
i'm on it = I'm on it = I'm driving this = I'm owning this end to end
on it = on it = driving it = owning it end to end
^got it = understood = understood, thanks = fully aligned
i've got it = I've got it covered = I've got this handled = I'm owning this end to end
makes sense = makes sense = that tracks = that resonates strategically
good idea = good idea = solid initiative = best-in-class strategic initiative
!bad idea = questionable idea = risky initiative = value-destroying initiative
no way = not likely = that's a tough sell = that's not on the roadmap
sounds good = sounds good = I'm aligned = love the alignment here
i'm sick = I'm sick = I'm out sick = I'm operating at reduced capacity
call me = call me = ping me = let's set up a touchbase
call you = call you = ping you = set up a touchbase with you
give up = step back = pause = strategically sunset
gave up = stepped back = paused = strategically sunsetted
figure it out = figure it out = sort it out = solution it
figure out = figure out = work out = unpack
deal with = handle = manage = action
dealing with = handling = managing = actioning
on the same page = on the same page = aligned = fully aligned
big deal = big deal = significant = needle-moving
worth it = worth it = a good investment = high ROI
waste of time = waste of time = poor use of time = value-negative use of bandwidth
for real = really = genuinely = with full intentionality
too much = too much = a lot = over capacity
!swamped = buried = at capacity = operating at maximum bandwidth utilization
!slammed = buried = underwater = at max capacity across all verticals
!i'm swamped = I'm buried = I'm at capacity = I'm operating at maximum bandwidth utilization
!i'm slammed = I'm buried = I'm underwater = I'm at max capacity across all verticals
!^can't = cannot = cannot commit to that = cannot commit bandwidth to that
!^i can't = I'm unable to make that work = I'm not able to commit to that = I'm unable to commit bandwidth to that
!>won't = will not = would rather not = won't be in a position to
!^won't = will not = will not be doing that = will not be prioritizing that
!^don't know = don't know just yet = don't have visibility into that yet = lack line of sight on that
!>don't know = don't yet know = don't have clarity on = lack visibility into
!>i don't know = I'm not sure = I don't have clarity on = I lack visibility into
!tired = worn out = low on bandwidth = running on a depleted energy budget
!tired of = fed up with = losing bandwidth for = experiencing fatigue around
!i'm broke = I'm short on cash = I'm budget constrained = I'm in a pre-revenue posture
!we're broke = we're short on cash = we're budget constrained = we're in a pre-revenue posture
!i am broke = I am short on cash = I am budget constrained = I am in a pre-revenue posture
!we are broke = we are short on cash = we are budget constrained = we are in a pre-revenue posture
!>broke = accidentally broke = introduced a regression in = disrupted
!^broke = stopped working = went down = experienced an unplanned outage
!got fired = got let go = got rightsized = was strategically transitioned out
!^help = I need a hand = I need support = I'm escalating for cross-functional support
!^help me = give me a hand = lend me some bandwidth = partner with me on this
!>help me = give me a hand and = lend me some bandwidth to = partner with me to
!help me with = give me a hand with = lend me some bandwidth on = partner with me on
!help with = assist with = support on = partner on
!help you = give you a hand = support you = empower you
!help us = give us a hand = support us = partner with us
!need help = need a hand = need support = need cross-functional resourcing
!your help = your assistance = your support = your partnership
!the help = the assist = the support = the cross-functional partnership
!for help = for a hand = for support = for cross-functional resourcing
!sorry for = apologies for = I acknowledge the miss on = I take full ownership of
!sorry about = apologies for = I acknowledge the miss on = I take full ownership of
!so sorry = very sorry = sincerely apologetic = deeply aligned on owning this
!^sure = of course = happy to = absolutely, let's operationalize that
!^nah = not this time = I'll pass for now = that's not on the roadmap
!guys = folks = team = valued stakeholders
!you guys = you all = the team = our valued stakeholders
!hey guys = hi folks = hi team = greetings, valued stakeholders
!hi guys = hi folks = hi team = greetings, valued stakeholders
!dude = friend = teammate = valued partner
!pissed = annoyed = frustrated = experiencing strong feedback
!pissed off = annoyed = frustrated = experiencing strong feedback
!hungry = peckish = ready for a break = in need of caloric realignment
!bored = restless = under-stretched = under-leveraged
!my work = my tasks = my deliverables = my value-creation pipeline
!his work = his tasks = his deliverables = his legacy workstreams
!her work = her tasks = her deliverables = her legacy workstreams
!their work = their tasks = their deliverables = their legacy workstreams
!the work = the tasks = the deliverables = the value-creation workstream
!with work = with tasks = with deliverables = with cross-functional workstreams
!at work = on the job = in the office = at the collaboration hub
!push = move = shift = re-baseline
!push back = disagree = offer some pushback = introduce strategic friction
!running late = running behind = slightly delayed = operating on a dynamic timeline
!pointless = not very useful = low value = value-negative
!grab = get = pick up = secure
!option = choice = path = strategic pathway
!vendor = supplier = partner = strategic partner
!way too = far too = significantly too = exponentially too
!works for me = works for me, thanks = aligns with my priorities = is fully aligned with my priorities
!that plan = that approach = that roadmap = that strategic roadmap
!this plan = this approach = this roadmap = this strategic roadmap
!our plan = our approach = our roadmap = our strategic roadmap
!new = fresh = updated = next-generation
!process = workflow = workflow = operating model
!nobody = no one = zero stakeholders = zero stakeholders across the org
!last week = recently = last sprint = in the prior planning cycle
!numbers = figures = metrics = KPIs
!add up = make sense = reconcile = tie out
!client = customer = account = key account
!wants = would like = is requesting = is escalating for
!refund = money back = reimbursement = value reversal
!>messed up = made a mess of = dropped the ball on = had a learning moment with
!launch = rollout = go-live = go-to-market motion
!lost customers = lost some customers = saw customer churn = experienced customer attrition headwinds
!sending = forwarding = circulating = cascading
!>i need a = I could use a = I'd like a = I have a critical need for a
!doc = document = writeup = strategic narrative
!explain = walk through = unpack = socialize
!update = refresh = refresh = action updates to
!likes = enjoys = is bought into = is aligned with
!i need a raise = I could use a pay bump = I'd like a compensation adjustment = I'm seeking a total rewards recalibration
!won't be able to = won't manage to = won't have the bandwidth to = won't be resourced to
!and now = and so = and as a result = and as a downstream effect
!quick question = quick query = quick ask = quick alignment ask
!nobody read = no one read = nobody reviewed = zero stakeholders consumed
!the build = the latest build = the release = the deployment pipeline
!great job = great work = outstanding work = best-in-class value delivery
!let's get drinks = let's grab drinks = let's do happy hour = let's activate a team bonding initiative
!too lazy = not motivated enough = too under-engaged = too deep in rest-optimization mode
`;

// Openers and closers by level. Openers are full sentences or end with a colon,
// so the user's first word keeps its original capitalization.
export const OPENERS = {
  1: [
    "Quick note:", "Just a thought:", "Hope you're well.", "Quick update:", "Small flag:",
    "Hope your week is going well.", "Hi there.", "Quick question:", "Gentle reminder:",
  ],
  2: [
    "Circling back on this:", "Per my last email:", "Just looping in here:", "Quick sync on this:",
    "Wanted to flag something:", "Following up on our last touchpoint:", "Hope this finds you well.",
    "Not to pile on, but:", "Bubbling this up:", "Putting this on your radar:", "Quick level set:",
    "Adding some color here:",
  ],
  3: [
    "Leaning into radical transparency:", "From a thirty-thousand-foot view:", "Let's level set.",
    "Quick strategic download:", "At the end of the day, it's about synergy.", "Big picture:",
    "Let's double-click on this.", "Putting on my visionary hat:", "In the spirit of radical candor:",
    "As we think about the next fiscal horizon:", "Let's zoom out for a second.",
    "Speaking as a steward of our north star:", "Calling an audible:",
  ],
};

export const CLOSERS = {
  1: [
    "Thanks!", "Let me know your thoughts.", "Happy to chat more.", "Talk soon.", "Thanks in advance.",
    "Let me know if you have questions.",
  ],
  2: [
    "Let's take this offline.", "Let's circle back next week.", "Happy to set up a quick sync.",
    "Let's put a pin in it.", "Looping in the right stakeholders.", "Let's touch base after the standup.",
    "I'll send a calendar invite.", "Let's park the rest for the next sync.",
    "Let's make sure we're all rowing in the same direction.", "Thoughts?",
  ],
  3: [
    "Let's operationalize this at scale.", "This is a north star moment.", "Let's move the needle.",
    "We'll socialize this with the broader org.", "Let's boil the ocean, but in a lean way.",
    "Onward and upward, team.", "Let's build the plane while we fly it.", "This is how we win the quarter.",
    "Let's synergize.", "Let's unlock exponential value.", "Let's take this to the board.",
    "Moving forward, this is our new paradigm.", "Let's lean in.",
  ],
};

// C-suite only: short asides dropped between sentences.
export const INTERJECTIONS = [
  "This is about synergy.", "Let's be bold here.", "The data supports this.", "Think big picture.",
  "This is very on brand for us.", "This aligns with our core values.", "We are a family here.",
  "Let's not reinvent the wheel.", "This is table stakes.", "The opportunity here is massive.",
];

// ---------------------------------------------------------------------------
// Corporate to Normal. Decode swaps: "corporate phrase = polite = honest = blunt".

export const DECODE_SWAPS = `
rightsizing = reducing staff = layoffs = mass firing
right-sizing = reducing staff = layoffs = mass firing
rightsize = reduce staff = lay off people = fire people
downsizing = reducing staff = layoffs = mass firing
reduction in force = staff cuts = layoffs = firing a bunch of people
workforce reduction = staff cuts = layoffs = firing people
reducing our workforce = cutting staff = laying people off = firing people
reduce our workforce = cut staff = lay people off = fire people
headcount reduction = fewer jobs = layoffs = firing people
eliminate roles = cut jobs = lay people off = fire people
eliminating roles = cutting jobs = laying people off = firing people
roles impacted = jobs cut = people laid off = people fired
impacted employees = people losing their jobs = laid-off people = the people we fired
impacted colleagues = coworkers losing their jobs = laid-off coworkers = the coworkers we fired
impacted = affected = laid off = fired
parting ways with = letting go = firing = firing
part ways with = let go = fire = fire
transition out = leave = get laid off = get fired
transitioning out = leaving = being laid off = being fired
let go = laid off = fired = fired
separation = exit = layoff = firing
separation package = severance = severance = the payout so you don't sue
streamline = simplify = cut = cut
streamlining = simplifying = cutting = cutting
streamlined = simpler = smaller = gutted
efficiencies = savings = cuts = cuts
efficiency = savings = cost cutting = cost cutting
operational efficiency = savings = cost cutting = doing more with fewer people
cost discipline = spending less = cost cutting = cheapness
cost optimization = cutting costs = cost cutting = cutting costs, starting with you
optimize costs = cut costs = cut costs = cut costs, including you
do more with less = work harder with fewer people = work more for the same pay = do the laid-off people's jobs too
leaner = smaller = smaller = understaffed
lean = small = understaffed = understaffed
restructuring = reorganizing = reorg with cuts = chaos and cuts
restructure = reorganize = reorg = shake things up and cut
realignment = reorganization = reorg = reorg
realign = reorganize = reorg = shuffle people around
reorganization = reorganization = reorg = reorg
new operating model = new structure = reorg = new boss, same work
strategic pivot = change of plan = we changed course = the old plan failed
pivot = change course = change course = admit the old plan failed
headwinds = problems = problems = things going badly
macroeconomic headwinds = the economy = the economy, which is our excuse = our excuse
challenging macroeconomic environment = tough economy = the economy, our excuse = our excuse
challenging environment = tough times = bad results = bad results
challenging = hard = bad = bad
difficult decision = hard choice = decision we made anyway = decision we made months ago
difficult decisions = hard choices = cuts = cuts
tough decisions = hard choices = cuts = cuts
hard decisions = hard choices = cuts = cuts
with a heavy heart = sadly = we know this is bad news = with a nice-sounding opener
deeply grateful = thankful = thankful, but it doesn't change anything = thankful, but you're still out
incredibly grateful = thankful = thankful = we have to say this
grateful = thankful = thankful = obligated to say thanks
many contributions = work = work = work
contributions = work = work = work we no longer need
journey = time here = time here = job
next chapter = next job = next job = job search
exciting new chapter = big change = change you didn't ask for = change you didn't ask for
exciting = new = new = scary for you
thrilled = happy = happy = required to sound happy
excited to announce = announcing = we're announcing = brace yourselves
pleased to announce = announcing = we're announcing = brace yourselves
proud = happy = pleased with ourselves = pleased with ourselves
family = team = team = company that can fire you
we're a family = we're a team = we expect loyalty = we expect loyalty, not the other way around
in-person collaboration = being in the office = office attendance = mandatory office attendance
in person collaboration = being in the office = office attendance = mandatory office attendance
in-office = in the office = in the office = at your desk where we can see you
return to office = come back to the office = mandatory office attendance = mandatory office attendance
return-to-office = come back to the office = mandatory office attendance = mandatory office attendance
hybrid = part office, part home = mostly office = office with extra steps
flexibility = flexibility = freedom you're about to lose = freedom you're about to lose
culture = how we work = how we want you to work = vibes we can't measure
connection = time together = office time = office time
serendipitous = random = random = imaginary
spontaneous collaboration = hallway chats = hallway chats = being visible to your boss
collaboration = working together = meetings = more meetings
synergy = working together = combining teams = cutting duplicate jobs
synergies = combined savings = job cuts = job cuts
compensation philosophy = pay policy = pay policy = reasons we won't pay more
total rewards = pay and benefits = pay and benefits = pay, plus a pizza party
market-competitive = average = average = below what you'd get elsewhere
merit cycle = raise cycle = raises = raises, or lack of them
pause merit increases = skip raises = no raises = no raises for you
merit increases = raises = raises = raises you won't get
compensation adjustments = raises = raises = raises you won't get
pause = stop = stop = stop indefinitely
paused = stopped = stopped = stopped for good
temporarily = for now = for a while = probably forever
for the time being = for now = for a while = indefinitely
hiring freeze = no new hiring = no new hiring = no help is coming
prudent = careful = cheap = cheap
disciplined = careful = tight-fisted = cheap
record year = best year ever = great year = huge profits
record quarter = best quarter = great quarter = huge profits
record results = best results = great results = big profits
record revenue = best sales ever = huge sales = huge sales
shareholder value = stock price = stock price = executive bonuses
stakeholders = people involved = investors = investors
investing in = spending on = spending on = moving money to
invest in = spend on = spend on = move money to
prioritize = focus on = pick = pick over you
prioritizing = focusing on = choosing = choosing over you
deprioritize = drop = drop = kill
deprioritized = dropped = dropped = killed
sunset = shut down = shut down = kill
sunsetting = shutting down = shutting down = killing
going forward = from now on = from now on = from now on, no take-backs
moving forward = from now on = from now on = from now on
at this time = now = now = now
transparency = honesty = honesty = selective honesty
transparent = honest = open = as open as legal allows
alignment = agreement = agreement = doing what leadership says
aligned = in agreement = on board = obedient
bandwidth = time = time = energy you don't have
circle back = talk later = talk later = never discuss again
take this offline = talk privately = talk later = stop talking about this in public
touch base = talk = check in = check on you
low-hanging fruit = easy wins = easy wins = easy things nobody did yet
move the needle = make a difference = make a difference = make the numbers look better
north star = main goal = main goal = slogan
leverage = use = use = use
leveraging = using = using = using
utilize = use = use = use
empower = let = expect = make
empowered = allowed = expected = expected, with no extra pay
ownership = responsibility = more work = more work, same pay
accountability = responsibility = blame = blame
accountable = responsible = blamed = blamed
high-performing = productive = overworked = overworked
high performance = hard work = more work = longer hours
performance = output = output = numbers
underperforming = not doing well = failing = failing
opportunity = chance = chance to do more work = ~more work
opportunities = chances = more work = more work
growth opportunity = chance to grow = ~more work = ~more work, same title
learning opportunity = mistake = mistake = mistake
stretch assignment = harder job = ~more work = ~more work, no raise
ai-first = using AI more = replacing work with AI = replacing people with AI
ai first = using AI more = replacing work with AI = replacing people with AI
automation = machines doing the work = fewer jobs = fewer jobs
transformation = big change = upheaval = upheaval
transformational = big = disruptive = disruptive
innovative = new = new = new, we hope
innovation = new ideas = new ideas = buzzwords
world-class = very good = good = fine
best-in-class = very good = good = fine
paradigm shift = big change = change = change
holistic = complete = complete = vague
robust = strong = strong = big
scalable = able to grow = able to grow = cheap to run
mission = purpose = slogan = slogan
values = principles = slogans = slogans
passionate = eager = willing to work late = willing to work weekends
fast-paced = busy = chaotic = chaotic
dynamic = changing = unstable = unstable
unlimited pto = time off when allowed = untracked time off = time off you'll feel guilty taking
wellness = health = health perks = a meditation app instead of a raise
resilience = coping = putting up with it = putting up with it
resilient = tough = able to cope = able to put up with it
feedback = criticism = criticism = criticism
constructive feedback = criticism = criticism = criticism
development plan = improvement plan = performance plan = the first step toward firing
performance improvement plan = warning = final warning = the paperwork before firing
strategic = planned = planned = vague
initiatives = projects = projects = projects
initiative = project = project = project
we remain committed to = we still care about = we say we care about = we like to say we care about
committed to = focused on = saying we care about = saying we care about
we will continue to = we will keep = we will keep = we will try to
best path forward = best option = only option we considered = cheapest option
path forward = plan = plan = plan
`;

// Theme rules for Corporate to Normal. Each theme has trigger patterns, a summary
// phrase per bluntness level, and a line used when a sentence clearly belongs to it.
export const THEMES = [
  {
    id: "layoffs",
    weight: 10,
    patterns: [
      /\blay ?offs?\b/i, /\blaid off\b/i, /\brightsiz/i, /\bdownsiz/i, /reduction in force/i, /\bRIF\b/,
      /workforce reduction/i, /reduc\w* (?:our|the) (?:workforce|headcount|team)/i, /headcount/i,
      /eliminat\w* (?:\w+ )?(?:roles|positions|jobs)/i, /part(?:ing)? ways/i, /impacted (?:employees|colleagues|team members|roles)/i,
      /\bseverance\b/i, /\bseparation\b/i, /(?:roles|positions) (?:are|will be) (?:impacted|affected)/i,
      /saying goodbye to/i, /\blet(?:ting)? go\b/i,
    ],
    summary: ["Some people are losing their jobs.", "People are being laid off.", "They're firing people to save money."],
    line: ["Some jobs are being cut.", "People are getting laid off.", "We're firing people."],
  },
  {
    id: "rto",
    weight: 8,
    patterns: [
      /return(?:ing)?[ -]to[ -](?:the )?office/i, /\bRTO\b/, /in[ -]person collaboration/i, /in[ -]office/i,
      /days? (?:a|per) week in/i, /back (?:to|in) the office/i, /\bour offices\b/i, /badge/i, /\bhubs?\b/i,
      /(?:three|four|five|3|4|5) days/i, /serendipit/i, /water ?cooler/i,
    ],
    summary: ["You need to come back to the office.", "Remote work is over. Come back to the office.", "Back to your desk, where we can watch you."],
    line: ["You need to be in the office more.", "Come back to the office.", "Get back to your desk."],
  },
  {
    id: "no-raises",
    weight: 8,
    patterns: [
      /merit/i, /\braises?\b/i, /compensation/i, /salary (?:increase|adjust)/i, /\bbonus(?:es)?\b/i,
      /total rewards/i, /pay (?:freeze|increase|adjustment)/i, /wage/i,
    ],
    requiresNegative: true,
    summary: ["Don't expect a raise this year.", "No raises.", "The company made money. You won't see any of it."],
    line: ["Raises are on hold.", "No raises this year.", "No raise for you."],
  },
  {
    id: "record-year",
    weight: 3,
    patterns: [/record (?:year|quarter|results|revenue|profit|growth)/i, /(?:best|strongest) (?:year|quarter)/i, /exceeded (?:our )?(?:targets|expectations|goals)/i, /all-time high/i],
    summary: ["The company did very well.", "The company had a great year.", "The company made a lot of money."],
    line: ["The company had a good year.", "We made a lot of money.", "We made a ton of money."],
  },
  {
    id: "reorg",
    weight: 6,
    patterns: [/\breorg/i, /restructur/i, /realign/i, /new (?:operating model|structure|org)/i, /reporting (?:line|structure)/i, /will now report/i, /consolidat/i, /combin\w* (?:the|our) \w+ (?:teams|orgs|organizations)/i, /merg\w* (?:the|our|two)/i],
    summary: ["Teams and managers are being reshuffled.", "It's a reorg. Expect new bosses and confusion.", "It's a reorg, which usually means cuts come next."],
    line: ["Teams are being reorganized.", "Your boss or team may change.", "Reorg. Brace for chaos."],
  },
  {
    id: "cost-cuts",
    weight: 5,
    patterns: [/cost (?:discipline|optimization|reduction|savings|cutting)/i, /\bcut(?:ting)? costs?\b/i, /efficienc/i, /streamlin/i, /do more with less/i, /\bleaner\b/i, /spend(?:ing)? (?:less|wisely|discipline)/i, /\bbudget/i, /prudent/i],
    summary: ["The company is cutting spending.", "They're cutting costs.", "They're cutting costs, and you are a cost."],
    line: ["Spending is being cut.", "They want to spend less money.", "They're cutting costs."],
  },
  {
    id: "hiring-freeze",
    weight: 5,
    patterns: [/hiring freeze/i, /pause (?:on )?(?:hiring|backfill)/i, /\bbackfills?\b/i, /not (?:be )?(?:hiring|backfilling)/i, /open (?:roles|reqs)/i],
    summary: ["No new hires for a while.", "No one new is being hired, so you'll cover the gaps.", "No help is coming. You'll do the extra work."],
    line: ["Hiring is on hold.", "No new hires.", "No help is coming."],
  },
  {
    id: "ai",
    weight: 4,
    patterns: [/\bAI\b/, /artificial intelligence/i, /automat/i, /agentic/i, /machine learning/i],
    summary: ["They want AI to do more of the work.", "They plan to use AI to need fewer people.", "They'd like a robot to do your job."],
    line: ["They want to use AI more.", "AI will do some of this work.", "AI is coming for these jobs."],
  },
  {
    id: "performance",
    weight: 4,
    patterns: [/high[ -]perform/i, /performance (?:bar|standards|expectations|management)/i, /raise the bar/i, /accountab/i, /improvement plan/i, /\bPIP\b/, /\bintensity\b/i, /hardcore/i],
    summary: ["They expect more from you.", "Work harder or you might be next.", "Work harder, or you're next."],
    line: ["They expect more from everyone.", "Work harder.", "Work harder or you're next."],
  },
  {
    id: "departure",
    weight: 4,
    patterns: [/stepping (?:down|away|back)/i, /(?:has|have) decided to (?:leave|step|pursue)/i, /pursue other opportunities/i, /spend more time with (?:his|her|their) family/i],
    summary: ["Someone in leadership is leaving.", "A leader is leaving, possibly not by choice.", "A leader got pushed out."],
    line: ["Someone is leaving.", "They're leaving, maybe not by choice.", "They got pushed out."],
  },
  {
    id: "benefits",
    weight: 5,
    patterns: [/benefits? (?:changes|update|plan)/i, /perks/i, /(?:401\(?k\)?|retirement) match/i, /stipend/i, /health (?:plan|insurance|coverage)/i, /premiums?/i],
    requiresNegative: true,
    summary: ["Some benefits are getting smaller.", "Your benefits are being cut.", "Your perks are gone."],
    line: ["Benefits are changing.", "Benefits are being cut.", "Perks are gone."],
  },
  {
    id: "acquisition",
    weight: 5,
    patterns: [/acqui(?:re|red|sition)/i, /merger/i, /joining forces/i, /definitive agreement/i, /combined company/i],
    summary: ["The company is being bought or merged.", "There's a merger. Expect overlap cuts.", "We got bought. Duplicate jobs are next."],
    line: ["A merger or acquisition is happening.", "Someone bought someone.", "We got bought."],
  },
];

// Words that flip a raise or benefits theme into the bad news version.
export const NEGATIVE_CUES = /\b(?:pause|paused|pausing|freeze|frozen|hold|not|no|won't|will not|unable|suspend|suspended|defer|deferred|delay|delayed|reduc\w*|eliminat\w*|discontinu\w*|lower|cap|limited|modest|evolv\w*)\b/i;

// Sentences that are pure fluff. Decoded with a stock line.
export const FLUFF_PATTERNS = [
  /\bgrateful\b/i, /\bthank(?:s| you)?\b/i, /\bproud\b/i, /\bjourney\b/i, /\bfamily\b/i, /\bheart\b/i,
  /\bmission\b/i, /\bvalues\b/i, /\bexcit\w*/i, /\bthrilled\b/i, /\binspir\w*/i, /\bpassion\w*/i,
  /\bbright future\b/i, /\bbest is yet to come\b/i, /\btogether\b/i, /\bcommitted\b/i, /\bcare deeply\b/i,
  /\bpeople are our\b/i, /\bincredible\b/i, /\bamazing\b/i, /\bhumbled\b/i,
];

export const FLUFF_LINES = [
  ["This is a polite way to soften the news.", "Feel-good filler.", "Filler. Means nothing."],
  ["They want to sound kind here.", "Nice words, no information.", "PR fluff."],
  ["This sets a warm tone.", "Softening you up.", "Padding before the bad news."],
  ["This is a thank-you line.", "Required niceness.", "Corporate sympathy card."],
];

export const PLAIN_LINES = [
  ["No hidden meaning here.", "Says what it says.", "Plain enough."],
];

// Sentence-level decodes that beat theme lines. Checked in order, first match wins.
export const SPECIAL_LINES = [
  { pattern: /badge (?:data|swipes?)|track(?:ing)? attendance|attendance (?:data|will be)/i,
    lines: ["They will track when you come in.", "They're tracking your badge swipes.", "Big Brother is counting your badge swipes."] },
  { pattern: /exceptions? (?:will be|are) (?:rare|limited|reviewed)|case[ -]by[ -]case/i,
    lines: ["Exceptions will be hard to get.", "Don't bother asking for an exception.", "No exceptions. Don't ask."] },
  { pattern: /free (?:lunch|snacks|coffee|breakfast|food)|upgrad\w* (?:our )?(?:offices|spaces|hubs)|new (?:collaboration )?spaces/i,
    lines: ["They're adding perks to make this easier.", "Free food to make the commute feel worth it.", "A sandwich in exchange for your commute."] },
  { pattern: /(?:difficult|hard|tough|sad|important|significant) (?:news|update|announcement)|not a decision (?:we|I) made lightly|heavy heart|deeply regret/i,
    lines: ["Bad news is coming.", "Brace yourself.", "Brace yourself. It's bad."] },
  { pattern: /because of (?:all of )?you|thanks to (?:all of )?you|\byour (?:hard work|passion|grit|dedication|effort)/i,
    lines: ["They're giving you credit.", "Credit, but not cash.", "You did the work. They keep the money."] },
  { pattern: /(?:come out (?:of this )?stronger|better positioned|(?:best|future) is (?:yet to come|bright)|never been more (?:excited|optimistic|confident)|bright future)/i,
    lines: ["They're promising it will get better.", "Trust us, it'll be fine.", "Hope is not a plan, but here we are."] },
  { pattern: /\bI know this is (?:hard|difficult|a lot|a change)|\bwe know this is (?:hard|difficult|a lot|a change)/i,
    lines: ["They know this is hard.", "They know you're unhappy.", "They know you're mad. It's happening anyway."] },
  { weak: true, pattern: /(?:will|to) (?:share|provide) more (?:details|information)?|more (?:details|information) (?:to come|soon)|at (?:\w+'s )?all[ -]hands|in your (?:next )?1:1/i,
    lines: ["More details later.", "More details later. Maybe.", "Details later, after the decisions are final."] },
  { pattern: /^what a (?:year|quarter|ride)[!.]?$/i,
    lines: ["They're happy with this year.", "Brag incoming.", "Victory lap incoming."] },
];
