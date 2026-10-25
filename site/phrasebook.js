// Project Synergy phrasebook.
// Swap format: "plain phrase = mild options = middle manager options = c-suite options".
// Options are separated by "|". An empty tier falls back to the tier below it.
// Matching is case insensitive and whole word. Longer phrases win over shorter ones.

export const CORPORATE_SWAPS = `
!cool cool cool = sounds good = sounds good, I'm aligned = fully aligned, let's operationalize
!i can't tell anymore = I can't tell anymore = I can no longer tell = I can no longer assess
!like actually = seriously = genuinely = in all candor
!for like = for about = for roughly = for approximately
!amazing how = it's remarkable how = it's truly remarkable how = it's a masterclass in agility how
!so glad we = really glad we = thrilled that we = truly energized that we
!oh look, = well, look: = interesting development: = a fun development:
!my brain is fried = I'm mentally drained = I'm running low on bandwidth = my cognitive bandwidth is fully depleted
!^no thanks = no, thank you = no, but thank you so much = no, but I sincerely appreciate it
!happy friday everyone = happy Friday, everyone = wishing everyone a happy Friday = wishing the whole team a high-impact Friday
!jesus christ = wow = yikes = what a development
i don't understand = I'm not sure I understand = I'm not fully clear on = I lack clarity on
i don't agree with = I don't agree with = I'm not aligned with = I'm not aligned with the strategic direction of
i'm free = I'm available = I have availability = I have open bandwidth
if you want to = if you'd like to = if you'd like to = if there's appetite to
nice catch = good catch = great catch = high-impact catch
welcome to the team = welcome aboard = welcome to the squad = welcome to the pod
you're a lifesaver = you're a lifesaver = you really saved the day = you're a force multiplier
!^i don't know = I'm not sure yet = I don't have visibility into that yet = that's outside my current line of sight
i have no idea = I'm not sure yet = I don't have the full picture yet = I lack the data granularity to opine
!no idea = no clear answer yet = limited visibility = zero line of sight
i don't care = I'm flexible on this = I'm agnostic on that = I'm fully outcome-agnostic here
i don't have time = my plate is full = I don't have the bandwidth = I'm at full capacity across all verticals
no time = no spare time = zero bandwidth = no available capacity
!i'm busy = I'm tied up = I'm heads down = I'm in deep execution mode
!i'm tired of = I'm frustrated with = I'm worn out by = I'm fatigued by
!i'm so tired of = I'm really frustrated with = I'm truly worn out by = I'm deeply fatigued by
!i'm sick and tired of = I'm really frustrated with = I'm truly worn out by = I'm deeply fatigued by
!i'm tired = I'm worn out = I'm at reduced capacity = my personal battery KPIs are trending down
i'm hungry = I could use something to eat = I need to refuel = I need to optimize my caloric pipeline
i'm bored = I'm looking for a new challenge = I'm seeking more strategic stretch = I'm under-leveraged
!i'm sorry = I apologize = I acknowledge the miss = I take full ownership of the learning opportunity
!^sorry = apologies = apologies for the friction = I own that misalignment
my bad = my mistake = I own that = that's a learning I'm taking forward
!^i quit = I'm moving on = I'm transitioning to my next chapter = I'm exploring opportunities outside the org
i'm leaving = I'm heading out = I'll be heading out = I'm sunsetting my presence
out sick = out sick = out sick = offline for health reasons
!so done with = really fed up with = at my limit with = fully at capacity on
!crushed it = did a fantastic job = knocked it out of the park = delivered outsized impact
!crushed the = did a great job on the = knocked it out of the park on the = delivered outsized impact on the
!huge shoutout to = a huge thank-you to = huge kudos to = a massive shoutout to
!huge shout-out to = a huge thank-you to = huge kudos to = a massive shoutout to
!huge shout out to = a huge thank-you to = huge kudos to = a massive shoutout to
!big shoutout to = a huge thank-you to = huge kudos to = a massive shoutout to
!big shout-out to = a huge thank-you to = huge kudos to = a massive shoutout to
!big shout out to = a huge thank-you to = huge kudos to = a massive shoutout to
!massive shoutout to = a huge thank-you to = huge kudos to = a massive shoutout to
!massive shout-out to = a huge thank-you to = huge kudos to = a massive shoutout to
!massive shout out to = a huge thank-you to = huge kudos to = a massive shoutout to
!major shoutout to = a huge thank-you to = huge kudos to = a massive shoutout to
!major shout-out to = a huge thank-you to = huge kudos to = a massive shoutout to
!major shout out to = a huge thank-you to = huge kudos to = a massive shoutout to
!shoutout to = a big thank-you to = huge kudos to = a massive shoutout to
!shout-out to = a big thank-you to = huge kudos to = a massive shoutout to
!my laptop died = my laptop stopped working = my laptop is out of commission = my hardware endpoint is offline
!are ugly = aren't working for me = aren't landing for me = are off-brand
!is a joke and a rushed one = is rushed and isn't working = is under-baked and isn't landing = is an MVP-grade experience with room to grow
!is a joke and an under-baked one = is rushed and isn't working = is under-baked and isn't landing = is an MVP-grade experience with room to grow
!i'm going to be honest = I'll be candid = I'll be fully transparent = in the spirit of radical candor, I'll be transparent
!no, i'm not doing = no, I won't be doing = no, I won't be taking on = no, I'm not resourced to take on
!a joke and a half-assed one = rushed and not working = under-baked and not landing = an MVP-grade experience with significant room to grow
!is a joke = isn't working = isn't landing = has significant room to grow
!is ugly = isn't working for me = isn't landing for me = is off-brand
!^you keep = I've noticed you keep = I've noticed a pattern where you keep = I've observed a recurring pattern where you keep
!new rule: = new policy: = new team norm: = new operating principle:
!talk, driving = talk right now because I'm driving = talk at the moment because I'm driving = engage on comms while in transit
^i'm out = I'm signing off = I'm stepping back = I'm exiting this workstream
!i'm going to be late = I'm running a bit behind = I'm running behind schedule = I'm operating on a dynamic timeline
!i'll be late = I'll be running a bit behind = I'll be running behind schedule = I'll be operating on a dynamic timeline
!i'm running late = I'm running a bit behind = I'm running behind schedule = I'm operating on a dynamic timeline
i'm late = I'm running behind = I'm slightly off schedule = I'm operating on a dynamic timeline
i forgot about = I forgot about = I lost track of = I lost track of
i forgot to = I forgot to = I neglected to = I inadvertently failed to
^i forgot = it slipped my mind = it fell through the cracks = it was deprioritized by my memory infrastructure
i forgot = I lost track of = I lost track of = I lost track of
^i messed up = I made a mistake = I dropped the ball = I generated an unplanned learning moment
^i screwed up = I made an error = I dropped the ball = I created a growth opportunity for everyone
i need help = I could use some support = I need some extra hands on deck = I'm seeking cross-functional resourcing
i agree = I'm on board = I'm aligned = I'm fully aligned and bought in
i disagree with = I disagree with = I'd like to push back a bit on = I'd like to offer a different strategic lens on
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
!^no = no = that's a no from me = that's a hard no from a strategic standpoint
^nope = no = that's a no from me = that's a hard no
maybe = possibly = potentially = potentially
probably = likely = likely = directionally
right now = at the moment = at the moment = at this time
!asap = soon = at your earliest convenience = with maximum urgency
later = later = a bit later = in a later phase
soon = shortly = in the near term = in the coming cycles
this week = this week = this sprint = within the current execution window
eventually = in time = down the road = at some point on the long-term roadmap
again = again = again = yet again
!happen again = happen again = recur = recur in any future iteration
!it won't = it will not = it is not going to = it categorically will not
!this won't = this will not = this is not going to = this categorically will not
!that won't = that will not = that is not going to = that categorically will not
idea = idea = proposal = proposal
ideas = thoughts = initiatives = strategic initiatives
goal = goal = objective = north star
goals = goals = objectives = north star metrics
!problem = issue = challenge = pain point
!problems = issues = challenges = pain points
issue = issue = issue = pain point
issues = issues = issues = pain points
made a mistake = made an error = made an error = had an unplanned learning moment
a mistake = a mistake = an error = a learning opportunity
mistake = mistake = error = learning opportunity
mistakes = slips = misses = learning opportunities
bug = issue = defect = defect
bugs = issues = defects = defects
a simple fix = a simple fix = a straightforward fix = a low-lift remediation
a quick fix = a quick fix = a fast fix = a rapid remediation
!fixed = fixed = addressed = remediated
terrible = pretty rough = deeply suboptimal = a significant value leak
awful = rough = suboptimal = a value-destroying event
!sucks = isn't great = is suboptimal = underindexes on value
crap = not great = low quality = low-value output
good morning = good morning = good morning = good morning
good afternoon = good afternoon = good afternoon = good afternoon
oh great = oh great = oh, wonderful = how exciting
!^great = nice = excellent = world-class
!awesome = great = excellent = a total game changer
amazing = really good = outstanding = transformational
!smells weird = smells odd = smells off = is emitting an unplanned aroma
!weird = unusual = unexpected = non-standard
!cheap = affordable = cost-effective = capital efficient
!expensive = pricey = costly = capital intensive
!money = funds = budget = capital
cash = money = budget = liquidity
salary = pay = compensation = total rewards package
!boss = manager = leadership = executive sponsor
!bosses = managers = managers = executive sponsors
my manager = my manager = my manager = my people leader
team = team = team = pod
teams = teams = teams = cross-functional pods
coworker = colleague = teammate = valued stakeholder
coworkers = colleagues = teammates = valued stakeholders
people = folks = folks = team members
customer = customer = client = end user
customers = customers = clients = end users
users = users = end users = end-user ecosystem
my job = my job = my role = my role
your job = your job = your role = your role
working on = working on = driving = spearheading
job title = title = role = brand identity
check email = check email = check my inbox = triage my inbox
check my email = check my email = check my inbox = triage my inbox
meeting room = meeting room = meeting room = huddle space
!meeting = catch-up = sync = alignment session
!meetings = catch-ups = syncs = alignment sessions
a chat = a conversation = a sync = a huddle
quick chat = quick conversation = quick sync = quick huddle
talk about = discuss = unpack = double-click on
talked about = discussed = unpacked = aligned on
talk later = talk later = circle back = reconnect offline
think about = consider = noodle on = ideate around
i think = I believe = my sense is = my strategic read is
i feel like = I feel = my gut says = my intuition is signaling
i guess = I suppose = I'd assume = my working hypothesis is
honestly = frankly = candidly = candidly
basically = essentially = at a high level = from a thirty-thousand-foot view
^anyway = anyway = moving on = pivoting
^actually = in fact = to clarify = for full transparency
actually = actually = genuinely = genuinely
obviously = clearly = as we all know = as the data clearly shows
seriously = really = truly = with full intentionality
really = really = truly = genuinely
very = very = highly = highly
>super = really = very = extremely
totally = completely = fully = fully
kind of = somewhat = a bit = directionally
sort of = somewhat = loosely = directionally
lots of = plenty of = a significant amount of = a robust volume of
a little = a bit = slightly = incrementally
!the wrong problem = the wrong problem = the wrong problem = the wrong problem space
!don't use = don't use = don't rely on = don't leverage
use = use = leverage = leverage
using = using = leveraging = leveraging
done with = done with = finished with = wrapped up with
halfway done = halfway done = halfway through = halfway through
done for today = done for today = wrapping up for today = concluding my operating day
done for the day = done for the day = wrapping up for the day = concluding my operating day
done = done = completed = fully actioned
start to finish = start to finish = start to finish = start to finish
finish = complete = wrap up = close out
finished = finished = wrapped up = closed out
stop = stop = stop = put a pause on
!quit = left = moved on = transitioned out
keep the change = keep the change = keep the change = keep the change
rolled back the change = rolled back the change = rolled back the update = strategically unwound the change
the change = the change = the update = the change
change = change = shift = pivot
changed = changed = shifted = pivoted
double check = double-check = double-check = validate
check in = check in = touch base = sync up
take a quick look at = take a quick look at = give a quick review to = do a quick deep dive into
take a look at = take a look at = review = take a deep dive into
look at = take a look at = review = take a deep dive into
looked at = looked at = reviewed = reviewed
look into = look into = dig into = investigate holistically
!told you this = told you this = flagged this to you = surfaced this to you
!told you that = told you that = flagged that to you = surfaced that to you
told = told = informed = advised
tell me = let me know = let me know = let me know
let me know = let me know = keep me posted = keep me in the loop
send it = send it = send it over = circulate it
send them = send them = send them over = circulate them
send = send = send over = circulate
send me = send me = please send me = kindly send over
send you = send you = send over = circulate
share this = share this = share this = socialize this
share the = share the = share the = socialize the
learn = learn = get up to speed on = upskill on
learned = learned = took away = captured key learnings
improve = improve = optimize = transform
improved = improved = optimized = transformed
was cut = was cut = was reduced = was streamlined
were cut = were cut = were reduced = were streamlined
cuts = cuts = reductions = efficiencies
copy paste = copy-paste = copy-paste = manually copy-paste
steal you = borrow you = borrow you = borrow you
!steal = take = take = appropriate
!stole = took = took = appropriated
guess = guess = estimate = forecast
guessed = guessed = estimated = forecasted
waiting on = waiting on = waiting on = in a holding pattern on
waiting for = waiting for = waiting for = in a holding pattern for
waiting = waiting = waiting = in a holding pattern
waste = poor use of time = inefficiency = value leakage
wasted = wasted = spent = inefficiently allocated
!lazy = low energy = under-engaged = optimizing for rest
slow = slow = slow = high-latency
fast = fast = quick = high-velocity
quick = quick = quick = rapid
quickly = quickly = rapidly = at velocity
the late = the late = the delayed = the timeline-challenged
is late = is late = is running behind = is on a dynamic timeline
are late = are late = are running behind = are on a dynamic timeline
be late = be late = be running behind = be on a dynamic timeline
stay late = stay late = stay late = stay after hours
stayed late = stayed late = stayed late = stayed after hours
staying late = staying late = staying late = staying after hours
work late = work late = work late = work after hours
worked late = worked late = worked late = worked after hours
working late = working late = working late = working after hours
a late = a late = a delayed = a timeline-challenged
!busy = tied up = at capacity = fully leveraged
^hi = hi = hi team = hi all
^hello = hello = hello team = greetings, stakeholders
^hey = hi = hi team = hi all
^bye = bye = talk soon = let's reconnect soon
grab coffee = get coffee = grab a coffee chat = schedule a caffeinated alignment session
on vacation = on vacation = on PTO = on a strategic recharge
vacation = vacation = PTO = strategic recharge
nap = rest = recharge = strategic recharge
sleep = rest = recharge = restorative downtime
^fun = fun = engaging = culture-additive
drinks = drinks = happy hour = team bonding initiative
phone call = phone call = phone call = phone call
phone = phone = device = mobile endpoint
computer = computer = laptop = workstation
internet = internet = network = connectivity layer
spreadsheet = spreadsheet = tracker = single source of truth
to-do list = to-do list = backlog = prioritized backlog
the notes = the notes = the takeaways = the key learnings
my notes = my notes = my takeaways = my key learnings
reason = reason = rationale = strategic rationale
because of = because of = due to = as a downstream effect of
we need to = we need to = we should = we have a strategic imperative to
i want = I'd like = I'd love = I'm seeking
we need = we need = we require = we require
you need to = you should = you'll want to = you're empowered to
can you = could you = would you be able to = do you have the bandwidth to
could you = could you = would you be able to = do you have the bandwidth to
!>i can't = I'm unable to = I won't be able to = I'm not resourced to
can't afford = cannot afford = can't afford = cannot afford
!>can't = cannot = cannot = won't be able to
^i won't = I won't = I'm not going to commit to that = I'm declining to operationalize that
not my job = not my area = outside my scope = outside my core competency
not my problem = not my area = outside my scope = not in my swim lane
who cares = it's not a priority = that's low impact = that's not needle-moving
whatever works = whatever works = I'm flexible = I'm aligned with any value-driving outcome
let's do it = let's do it = let's move forward = let's operationalize this
^let's go = let's go = let's get started = let's activate
go with = go with = go with = align on
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
!mad = upset = frustrated = misaligned
sad = down = low = experiencing a dip in morale
excited = excited = energized = deeply energized
i'm scared = I'm worried = I'm concerned = I'm apprehensive
we're scared = we're worried = we're concerned = we're apprehensive
they're scared = they're worried = they're concerned = they're apprehensive
he's scared = he's worried = he's concerned = he's apprehensive
she's scared = she's worried = she's concerned = she's apprehensive
am scared = am worried = am concerned = am apprehensive
is scared = is worried = is concerned = is apprehensive
are scared = are worried = are concerned = are apprehensive
was scared = was worried = was concerned = was apprehensive
were scared = were worried = were concerned = were apprehensive
scared of = worried about = concerned about = risk-aware about
worried = concerned = cautious = risk-aware
confused = unclear = seeking clarity = seeking alignment
!hate = dislike = have concerns about = have strategic reservations about
i'd love to = I'd love to = I'd be glad to = I'd be thrilled to
we'd love to = we'd love to = we'd be glad to = we'd be thrilled to
!love = really like = really value = deeply value
>want = want = would like = would like
understand = understand = get = have alignment on
remember = remember = recall = have institutional memory of
forget = forget = drop = deprioritize
forgot about = forgot about = lost track of = lost track of
forgot = forgot = forgot = lost track of
fixing = fixing = addressing = remediating
building = building = developing = architecting
build the = build the = develop the = architect the
build a = build a = develop a = architect a
built = built = developed = architected
write = write = draft = author
wrote it down = wrote it down = documented it = documented it
wrote = wrote = drafted = authored
plan for = plan for = prepare for = future-proof for
deadline = deadline = due date = hard stop
deadlines = deadlines = due dates = hard stops
behind schedule = behind schedule = behind schedule = behind the target timeline
priority = priority = top priority = mission-critical priority
important = important = a priority = mission-critical
urgent = urgent = time-sensitive = a P0
project = project = initiative = strategic initiative
projects = projects = initiatives = strategic initiatives
job done = job done = deliverable shipped = value fully realized
company = company = organization = enterprise
in the office = in the office = in the office = in the collaboration hub
the office = the office = the office = the workplace
help desk = help desk = help desk = support desk
front desk = front desk = front desk = front desk
desk = desk = workspace = productivity station
chair = chair = seat = ergonomic asset
book the room = book the room = book the space = book the collaboration zone
conference room = conference room = conference room = conference room
kitchen = kitchen = break room = nourishment hub
bathroom = bathroom = restroom = wellness break facility
car = car = car = mobility asset
traffic = traffic = traffic = mobility headwinds
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
no problem at all = no problem at all = happy to help = happy to unlock value
no problem = no problem = happy to help = happy to unlock value
a raise = a raise = a compensation adjustment = a total rewards recalibration
make sure = make sure = make sure = ensure
work from home = work from home = work remotely = drive outcomes from my home office hub
working from home = working from home = working remotely = driving outcomes from my home office hub
^i'm done = I'm finished = I'm at my limit = I'm at full capacity
i'm done with = I'm done with = I've finished = I've wrapped up
i'm fine = I'm good = I'm doing well = I'm operating at full capacity
i'm happy = I'm glad = I'm energized = I'm deeply energized
i'm on it = I'm on it = I'm driving this = I'm owning this end to end
^on it = on it = driving it = owning it end to end
^got it = understood = understood = fully aligned
!ok boomer energy from = a slightly dated tone from = a somewhat dated tone from = a legacy-mindset tone from
i've got it = I've got it covered = I've got this handled = I'm owning this end to end
^makes sense = makes sense = that tracks = that resonates strategically
good idea = good idea = solid initiative = best-in-class strategic initiative
!bad idea = questionable idea = risky initiative = value-destroying initiative
no way we = I can't believe we = I can't believe we = I can't believe we
^no way = definitely not = that's a firm no = that's a hard no from a roadmap standpoint
sounds good = sounds good = I'm aligned = love the alignment here
i'm sick of = I'm tired of = I'm tired of = I'm fatigued by
sick of = tired of = tired of = fatigued by
i'm sick = I'm sick = I'm out sick = I'm operating at reduced capacity
call me = call me = ping me = let's set up a touchbase
call you = call you = ping you = set up a touchbase with you
giving up on = giving up on = stepping back from = strategically sunsetting my involvement in
give up = step back = pause = strategically sunset
gave up = stepped back = paused = strategically sunsetted
figure it out = figure it out = sort it out = solution it
figure out = figure out = work out = unpack
deal with = handle = manage = action
dealing with = handling = managing = actioning
on the same page = on the same page = aligned = fully aligned
big deal = big deal = significant = needle-moving
worth it = worth it = a good investment = high ROI
a total waste of time = a total waste of time = a real waste of time = a value-negative use of bandwidth
waste of time = waste of time = poor use of time = value-negative use of bandwidth
for real = really = genuinely = with full intentionality
!swamped = very busy = at capacity = operating at maximum bandwidth utilization
!slammed = very busy = at capacity = at max capacity across all verticals
!i'm swamped = I'm buried = I'm at capacity = I'm operating at maximum bandwidth utilization
!i'm slammed = I'm buried = I'm underwater = I'm at max capacity across all verticals
!^can't = cannot = cannot commit to that = cannot commit bandwidth to that
!^i can't = I'm unable to make that work = I'm not able to commit to that = I'm unable to commit bandwidth to that
won't work = won't work = isn't going to work = isn't going to deliver
i won't work = I won't be working = I won't be working = I will not be working
we won't work = we won't be working = we won't be working = we will not be working
!>won't = will not = will not = will not
!^won't = will not = will not be doing that = will not be prioritizing that
!^don't know = don't know just yet = don't have visibility into that yet = lack line of sight on that
!>don't know if = don't know if = don't have clarity on whether = lack visibility into whether
!>don't know = don't yet know = don't have clarity on = lack visibility into
!>i don't know if = I'm not sure if = I don't have clarity on whether = I lack visibility into whether
!>i don't know = I'm not sure = I don't have clarity on = I lack visibility into
!tired = worn out = low on bandwidth = running on a depleted energy budget
!tired of = fed up with = worn out by = fatigued by
!i'm broke = I'm short on cash = I'm budget constrained = I'm in a pre-revenue posture
!we're broke = we're short on cash = we're budget constrained = we're in a pre-revenue posture
!i am broke = I am short on cash = I am budget constrained = I am in a pre-revenue posture
!we are broke = we are short on cash = we are budget constrained = we are in a pre-revenue posture
!^broke = stopped working = went down = experienced an unplanned outage
!got fired = got let go = was let go = was exited from the organization
!^help = I need a hand = I need support = I'm escalating for cross-functional support
!^help me = give me a hand = lend me some bandwidth = partner with me on this
!>help me = give me a hand and = lend me some bandwidth to = partner with me to
!help me with = give me a hand with = lend me some bandwidth on = partner with me on
!help with = help with = support with = support with
!help you = give you a hand = support you = empower you
!help us = give us a hand = support us = partner with us
!need help = need a hand = need support = need cross-functional resourcing
!your help = your assistance = your support = your partnership
!the help = the assist = the support = the cross-functional partnership
!for help = for a hand = for support = for cross-functional resourcing
!sorry for = apologies for = my apologies for = I take full ownership of
!sorry about = apologies for = my apologies for = I take full ownership of
!so sorry = very sorry = sincere apologies = our sincere apologies
!^sure = of course = happy to = absolutely, let's operationalize that
!^nah = no thanks = I'll pass = that's a hard pass from a roadmap standpoint
!guys = folks = team = valued stakeholders
!you guys = you all = the team = our valued stakeholders
!hey guys = hi folks = hi team = greetings, valued stakeholders
!hi guys = hi folks = hi team = greetings, valued stakeholders
!dude = friend = teammate = valued partner
!pissed = annoyed = frustrated = experiencing strong feedback
!pissed off = annoyed = frustrated = experiencing strong feedback
!hungry = hungry = ready for a break = in need of caloric realignment
!bored = bored = under-stretched = under-leveraged
credit for my work = credit for my work = credit for my work = credit for my contributions
!my work = my tasks = my deliverables = my value-creation pipeline
!his work = his tasks = his deliverables = his legacy workstreams
!her work = her tasks = her deliverables = her legacy workstreams
!their work = their tasks = their deliverables = their legacy workstreams
!the work = the tasks = the deliverables = the value-creation workstream
!with work = with tasks = with deliverables = with cross-functional workstreams
!push = move = shift = re-baseline
!push back = disagree = offer some pushback = introduce strategic friction
!running late = running behind = slightly delayed = operating on a dynamic timeline
!pointless = not very useful = low value = value-negative
grab me a = get me a = get me a = secure me a
grab me = get me = get me = secure me
!>grab = get = pick up = secure
!option = option = option = strategic pathway
!vendor = supplier = partner = strategic partner
!way too = far too = far too = far too
!works for me = works for me, thanks = aligns with my priorities = is fully aligned with my priorities
!that plan = that approach = that roadmap = that strategic roadmap
!this plan = this approach = this roadmap = this strategic roadmap
!our plan = our approach = our roadmap = our strategic roadmap
new hire = new hire = new team member = incoming talent
disagree with = disagree with = push back a bit on = offer a different strategic lens on
love that for us = love that for us = love that for us = love that for us
!process = workflow = workflow = operating model
!numbers = figures = metrics = KPIs
!add up = make sense = reconcile = tie out
!client = client = client = key account
wants to = wants to = would like to = is looking to
wants me to = wants me to = would like me to = is asking me to
wants you to = wants you to = would like you to = is asking you to
wants us to = wants us to = would like us to = is asking us to
wants him to = wants him to = would like him to = is asking him to
wants her to = wants her to = would like her to = is asking her to
wants them to = wants them to = would like them to = is asking them to
!wants = wants = would like = is requesting
!>messed up = made a mess of = dropped the ball on = had a learning moment with
!lost customers = lost some customers = saw customer churn = experienced customer attrition headwinds
!sending = sending = circulating = cascading
!>i need a = I could use a = I'd like a = I have a critical need for a
!doc = doc = document = working doc
quick update = quick update = quick refresh = rapid status download
!i need a raise = I could use a pay bump = I'd like a compensation adjustment = I'm seeking a total rewards recalibration
!won't be able to = won't manage to = won't have the bandwidth to = won't be resourced to
!quick question = quick query = quick ask = quick alignment ask
!nobody read = no one read = nobody reviewed = zero stakeholders consumed
!the build = the build = the build = the deployment pipeline
!great job = great work = outstanding work = best-in-class value delivery
!a great job = a great job = an outstanding job = a best-in-class job
!let's get drinks = let's grab drinks = let's do happy hour = let's activate a team bonding initiative
!too lazy = not motivated enough = too under-engaged = too deep in rest-optimization mode

happy to help = happy to help = happy to help = happy to support
happy friday = happy Friday = happy Friday = happy Friday
happy hour = happy hour = happy hour = happy hour
on fire = on fire = on fire = on fire
thanks for = thanks for = thank you for = thank you for
thank you for = thank you for = thank you for = thank you for
thanks = thanks = thank you = thank you
the launch = the launch = the go-live = the go-to-market motion
a launch = a launch = a go-live = a go-to-market motion
our launch = our launch = our go-live = our go-to-market motion
can we talk about = can we talk about = can we discuss = can we discuss
can we talk = can we talk = can we connect = can we sync
is bad = isn't great = is not ideal = is suboptimal
was bad = wasn't great = was not ideal = was suboptimal
so bad = not great at all = really not ideal = deeply suboptimal
is stupid = isn't ideal = isn't optimal = isn't best-in-class
is dumb = isn't ideal = isn't optimal = isn't best-in-class
fix it = fix it = address it = remediate it
to fix = to fix = to address = to remediate
please fix = please fix = please address = please remediate
can someone fix = can someone fix = could someone fix = could someone remediate
sick today = sick today = out sick today = out sick today
more people = more people = more people = additional team members
the emails = the emails = the emails = the emails
!stupid = silly = misguided = suboptimal
!dumb = silly = misguided = suboptimal
never = never = never = at no point
crazy week = hectic week = hectic week = high-velocity week
crazy day = hectic day = hectic day = high-velocity day
crazy = intense = aggressive = extremely ambitious
the fix = the fix = the fix = the remediation
a fix = a fix = a fix = a remediation
fix this = fix this = address this = remediate this
fix that = fix that = address that = remediate that
fix my = fix my = address my = remediate my
fix our = fix our = address our = remediate our
fix your = fix your = address your = remediate your
fix the = fix the = address the = remediate the
!was fired = was let go = was let go = was exited from the organization
a refund = a refund = a reimbursement = a reimbursement
the refund = the refund = the reimbursement = the reimbursement
will not be ready = will not be ready = will not be available = will not be production-ready
won't be ready = won't be ready = won't be available = won't be production-ready
i'm not interested = I'm not interested = this isn't a fit for me = this isn't a strategic fit for me
i can't find = I can't find = I'm unable to find = I'm unable to locate
i can't see = I can't see = I'm unable to see = I'm unable to see
i can't access = I can't access = I'm unable to access = I'm unable to access
i can't open = I can't open = I'm unable to open = I'm unable to open
i can't log in = I can't log in = I'm unable to log in = I'm unable to log in
i can't hear = I can't hear = I'm unable to hear = I'm unable to hear
i can't wait for = I can't wait for = I'm really looking forward to = I'm deeply excited about
i can't wait to = I can't wait to = I'm eager to = I'm deeply excited to
can't wait for = can't wait for = am really looking forward to = am deeply excited about
can't wait to = can't wait to = am eager to = am deeply excited to
cannot wait for = cannot wait for = am really looking forward to = am deeply excited about
you can't just = you shouldn't just = you shouldn't just = you shouldn't just
you can't = you shouldn't = you shouldn't = you shouldn't
!we can't = we cannot = we're unable to = we're not in a position to
!shut up about = stop talking about = please stop bringing up = let's pause the discussion on
is broken = is down = is in a degraded state = is experiencing suboptimal uptime
been broken = been down = been in a degraded state = been in a degraded state
borked = broken = broken = broken
i don't think = I don't think = I don't believe = I'm not convinced
!a pain in the butt = a real hassle = a major friction point = a significant source of organizational friction
!is trash = is terrible = is unreliable = is underperforming
!is garbage = is terrible = is unreliable = is underperforming
!was garbage = was terrible = was unreliable = was underperforming
!was trash = was terrible = was unreliable = was underperforming
!are trash = are terrible = are unreliable = are underperforming
can shove = can keep = can keep = can keep
return to office = return to office = return to office = return-to-office
crushing it = doing great = doing great work = delivering outsized impact
i have no idea what = I have no idea what = I'm not sure what = I lack clarity on what
no idea why = no idea why = no clear idea why = no line of sight on why
i think you're wrong = I think you're mistaken = I see it differently = I'd offer a different perspective
i don't have time for this = I don't have time for this = I don't have the bandwidth for this = I don't have the bandwidth for this right now
zero thanks = zero thanks = zero recognition = zero recognition
i swear to god = honestly, = honestly, = in all candor,
ship this = ship this = release this = release this
showing up late = showing up late = arriving late = arriving after the start time
show up late = show up late = arrive late = arrive after the start time
is driving me crazy = is really frustrating me = is creating real friction for me = is a significant source of friction for me
driving me crazy = really frustrating me = creating real friction for me = a significant source of friction for me
is driving me insane = is driving me crazy = is really frustrating me = is creating real friction for me
is killing me = is wearing me down = is really wearing on me = is taking a real toll on me
!is insane = is too much = is excessive = is not a scalable process
!was mid = was underwhelming = was underwhelming = was underwhelming
!is mid = is underwhelming = is underwhelming = is underwhelming
!a load of bull = nonsense = not credible = not grounded in data
want anything = want anything = want anything = want anything
sounds like a plan = sounds like a plan = sounds like a solid plan = sounds like a solid plan
!feeling like garbage = feeling unwell = feeling unwell = operating at reduced capacity
when you're done = when you're done = when you're finished = when you've wrapped up
is a clown = is out of their depth = is out of their depth = is still ramping into the role
went down = went down = had an outage = experienced an outage
`;

// Openers and closers by level. Openers are full sentences or end with a colon,
// so the user's first word keeps its original capitalization.
export const OPENERS = {
  // Openers and closers set a tone only. They never add facts, plans, meetings or promises.
  // Mild and Middle Manager get none at all (see OPENER_CHANCE in engine.js). Full C-Suite gets a short lead-in.
  1: [],
  2: [],
  3: [
    "From a thirty-thousand-foot view:", "Quick strategic download:", "Big picture:", "Putting on my visionary hat:",
    "In the spirit of radical candor:", "Leaning into radical transparency:", "Speaking as a steward of our north star:",
    "Thinking out loud as a servant leader:", "For full visibility:",
  ],
};

export const CLOSERS = {
  // Full C-Suite only, and only some of the time. Neutral sign-offs, no facts, thanks or promises.
  1: [],
  2: [],
  3: ["Onward and upward.", "Let's lean in.", "Let's move the needle.", "Let's keep the momentum going."],
};

// No longer used: asides between sentences read as added claims. Kept empty so imports still work.
export const INTERJECTIONS = [];

// ---------------------------------------------------------------------------
// Corporate to Normal. Decode swaps: "corporate phrase = polite = honest = blunt".

export const DECODE_SWAPS = `
out of scope for now = not in the plan right now = not happening right now = not happening
rightsizing = reducing staff = layoffs = mass firing
right-sizing = reducing staff = layoffs = mass firing
rightsize = reduce staff = lay off people = fire people
right-size = reduce staff = lay people off = fire people
right size = reduce staff = lay people off = fire people
right-size our organization = cut staff = lay people off = fire people
right-sizing our organization = cutting staff = laying people off = firing people
workforce optimization = staff cuts = layoffs = firing people
optimize our workforce = cut staff = lay people off = fire people
align resources = move money and people around = shift money and jobs = move money away from some of you
better align resources = move money and people around = shift money and jobs = move money away from some of you
aligning resources = moving money and people around = shifting money and jobs = moving money away from some of you
resource allocation = where the money goes = who gets money and people = who gets cut
strategic priorities = what leadership cares about now = what leadership cares about now = whatever the CEO likes this quarter
our strategic priorities = what leadership cares about now = what leadership cares about now = whatever the CEO likes this quarter
core priorities = main goals = what leadership cares about now = whatever the CEO likes this quarter
making the difficult decision = deciding = choosing = deciding
made the difficult decision = decided = chose = decided
made the hard decision = decided = chose = decided
unlock synergies = save money by combining things = save money by combining teams = cut overlapping jobs
drive sustainable growth = grow steadily = make more money = make more money
sustainable growth = steady growth = more profit = more profit
eliminate positions = cut jobs = lay people off = fire people
eliminating positions = cutting jobs = laying people off = firing people
headcount = staff = staff = people
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
impacted = affected = affected = hit
parting ways with = letting go = firing = firing
part ways with = let go = fire = fire
transition out = leave = get laid off = get fired
transitioning out = leaving = being laid off = being fired
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
lean team = small team = understaffed team = understaffed team
lean organization = smaller company = understaffed company = understaffed company
restructuring = reorganizing = reorg with cuts = chaos and cuts
restructure = reorganize = reorg = shake things up and cut
realignment = reorganization = reorg = reorg
realign = reorganize = reorg = shuffle people around
reorganization = reorganization = reorg = reorg
new operating model = new structure = reorg = new boss, same work
strategic pivot = change of plan = we changed course = the old plan failed
pivot = change course = change course = admit the old plan failed
headwinds = problems = problems = trouble
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
connection with colleagues = time together = office time = office time
serendipitous = random = random = imaginary
spontaneous collaboration = hallway chats = hallway chats = being visible to your boss
collaboration = working together = working together = more meetings
synergy = working together = working together = buzzwords
synergies = benefits of combining = cost savings = cost savings
compensation philosophy = pay policy = pay policy = reasons we won't pay more
total rewards = pay and benefits = pay and benefits = pay, plus a pizza party
market-competitive = average = average = below what you'd get elsewhere
merit cycle = raise cycle = raises = raises, or lack of them
pause merit increases = skip raises = no raises = no raises for you
merit increases = raises = raises = raises you won't get
compensation adjustments = raises = raises = raises you won't get
>pause = stop = stop = stop indefinitely
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
strategic = key = key = so-called key
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
    id: "layoff-you",
    weight: 14,
    patterns: [
      /\byour (?:role|position|job|employment)\b[^.]{0,80}\b(?:eliminat|impacted|affected|end(?:s|ed|ing)?\b|terminat|no longer)/i,
      /\b(?:eliminat|impact|affect)\w* your (?:role|position|job)/i, /\byour last day\b/i, /\blet(?:ting)? you go\b/i,
      /\byou(?:'ve| have| are|'re)? (?:been )?(?:impacted|affected) by (?:this|today's|the|our|these)\b/i,
      /\byour (?:separation|severance)\b/i, /no longer (?:require|need) your (?:services|role)/i, /\byour (?:role|position) (?:is|was) (?:one of those|among those)/i,
    ],
    summary: ["You're losing your job.", "You're being laid off.", "You're fired. This is the exit email."],
    line: ["Your job is being cut.", "You're being laid off.", "You're out."],
  },
  {
    id: "pip",
    weight: 11,
    patterns: [/performance improvement plan/i, /\bPIP\b/, /\bimprovement plan\b/i, /\b(?:30|60|90|thirty|sixty|ninety)[- ]day (?:plan|period|review|window)\b/i, /\b(?:your|you)\b[^.]{0,50}\b(?:below|did not meet|does not meet|not meeting|not met) (?:the )?expectations/i, /\bdocumented (?:concerns|gaps)\b/i],
    summary: ["Your performance is under formal review, with a deadline.", "You're on a PIP. That often ends in an exit.", "This is the paper trail before they fire you."],
    line: ["You're on a formal improvement plan.", "You're on a PIP.", "They're building the case to fire you."],
  },
  {
    id: "shutdown",
    weight: 9,
    patterns: [
      /\bsunset(?:ting|ted|s)?\b(?![^.]{0,40}\b(?:stipend|perk|reimbursement|allowance|subsid|benefit|match)\w*)/i, /\bwind(?:ing)? down\b/i, /\bdiscontinu\w*(?![^.]{0,40}\b(?:stipend|perk|reimbursement|allowance|subsid|benefit|match)\w*)/i, /end[- ]of[- ](?:life|sale|support)\b/i, /\bEOL\b/, /\bshut(?:ting)? down\b/i,
      /\bcease (?:operations|development|support|production)/i, /\bdeprecat/i, /no longer (?:be )?(?:supported|available|offered|maintained)\b/i,
      /\bclos(?:e|ing) (?:the|our|its) (?:\w+ )?(?:office|site|plant|store|location|facility|business|product|studio|division)/i,
    ],
    summary: ["Something is being shut down.", "They're shutting it down.", "It's dead. They're pulling the plug."],
    line: ["This is being shut down.", "It's being shut down.", "It's dead."],
  },
  {
    id: "outsourcing",
    weight: 9,
    patterns: [
      /\boutsourc/i, /\boffshor/i, /\bnearshor/i, /managed service provider/i, /global (?:capability|delivery|service|shared services|business services) cent(?:er|re)/i,
      /cent(?:er|re) of excellence in/i, /lower[- ]cost (?:locations?|regions?|markets|geograph)/i, /\bBPO\b/,
      /\bwill (?:transition|move|shift|transfer) to (?:the |an? |our )?(?:provider|partner|vendor)\b/i,
      /partner(?:ing)? with (?:an? )?(?:trusted |strategic |leading )?(?:global |external |third[- ]party )?(?:provider|vendor|partner) to (?:deliver|handle|run|provide|support|manage)/i,
      /(?:transition|mov|shift|migrat|transfer)\w* (?:this |the |some |these |certain |our )?(?:work|functions?|operations|support|roles|activities|responsibilities|services) to (?:an? |our )?(?:external|third[- ]party|partner|vendor|provider|global|offshore|lower[- ]cost|trusted)/i,
    ],
    summary: ["Some work is moving to an outside company or a cheaper location.", "They're outsourcing the work.", "Your job is moving somewhere cheaper."],
    line: ["Work is moving to an outside company.", "They're outsourcing this.", "Cheaper people elsewhere will do this."],
  },
  {
    id: "rejection",
    weight: 8,
    patterns: [
      /(?:decided|decision|chosen|chose) (?:to )?(?:move|go|proceed) (?:forward )?with (?:other|another|a different)/i, /(?:other|another) candidates?/i,
      /(?:will not|won't|not be|are not|aren't|unable to|not able to) (?:be )?(?:moving|move) forward/i, /not (?:a|the right) (?:fit|match)\b/i,
      /(?:decided|decision) (?:not to|against) (?:pursu|fund|approv|proceed|mov|green ?light)/i, /\bdeprioritiz/i, /\bon hold indefinitely\b/i,
      /\bunable to (?:approve|accommodate|support|offer|fund)/i, /(?:will|would|could) not be (?:approved|funded|pursued|prioritized)/i, /we regret to inform/i,
      /keep your (?:resume|application|details|information) on file/i, /wish you (?:the best|success|luck) (?:in|with) your (?:search|future|job)/i,
      /\bnot (?:something we can|in a position to) (?:approve|support|fund|prioritize)/i, /\bnot (?:at|right) (?:this time|now)\b/i,
      // Round 6: "Legal has advised that we are not in a position to use the customer's logo".
      /\bnot in a position to (?:use|move forward|proceed|offer|include|publish|run|launch|go ahead|accept|sign|grant|extend|provide|share (?:the|their|this|that|our)|feature|mention|reference)\b/i,
      /\b(?:legal|compliance|counsel|our lawyers)\b[^.]{0,30}\badvised\b[^.]{0,40}\b(?:not|cannot|can't|unable|against)\b/i,
    ],
    summary: ["The answer is no, said kindly.", "It's a no.", "No. They're just being polite about it."],
    line: ["This is a no.", "It's a no.", "No."],
  },
  {
    id: "stack-rank",
    weight: 8,
    patterns: [/stack[- ]?rank/i, /forced (?:ranking|distribution|curve)/i, /bottom \d+\s?(?:%|percent)/i, /\bcalibrat/i, /(?:meets|met) (?:most|some) expectations/i, /\b(?:unregretted|non-?regrettable) attrition/i, /\blow(?:est)?[- ]performers?\b/i, /\bperformance (?:curve|distribution)\b/i],
    summary: ["Some people will be rated low no matter what.", "Stack ranking. Someone has to be at the bottom.", "They're picking who to fire and calling it calibration."],
    line: ["Ratings are being forced onto a curve.", "Stack ranking. Someone has to lose.", "They're picking who to fire."],
  },
  {
    id: "budget-freeze",
    weight: 7,
    patterns: [
      /budget freeze/i, /spend(?:ing)? freeze/i, /freez\w* (?:all |on |our )*(?:discretionary|non-essential|travel|budgets?|spend)/i,
      /(?:discretionary|non-essential) (?:spend(?:ing)?|expenses?|purchases) (?:is|are|will be|has been|have been) (?:paused|frozen|on hold|suspended)/i,
      /(?:travel|training|conference|offsite|event) (?:and \w+ )?budgets? (?:is|are|has been|have been|will be) (?:paused|frozen|cut|suspended|on hold)/i,
      /additional (?:approval|scrutiny) (?:for|on) (?:all )?(?:spend|purchases|expenses)/i, /\bpaus\w* (?:all )?(?:non-essential|discretionary) spend/i,
    ],
    summary: ["Spending is frozen for now.", "The budget is frozen. Don't ask for money.", "The money tap is off. Don't even ask."],
    line: ["Spending is on hold.", "Budgets are frozen.", "No money for anything."],
  },
  {
    // Round 6: a post that announces a new job is not a layoff post.
    id: "new-job",
    weight: 8,
    firstPerson: true,
    patterns: [
      /\bI(?:'m| am)? (?:excited|thrilled|happy|proud|delighted) to (?:share|announce) (?:that )?I(?:'m| am| have|'ve)? (?:joining|joined|accepted (?:a|an|the) (?:role|position|offer))\b/i,
      /\bI(?:'m| am| have|'ve) (?:officially )?(?:joining|joined|accepted (?:a|an|the) (?:role|position|offer))\b/i, /\bmy new role as\b/i, /\bstarting (?:a |my )?new (?:role|position|job) (?:as|at)\b/i,
    ],
    summary: ["They're moving to a new job.", "They're leaving for a new job and want you to see it.", "New job. This post is the victory lap."],
    line: ["They're starting a new job.", "They're leaving for a new job.", "New job, new title, big post."],
  },
  {
    id: "new-chapter",
    weight: 7,
    firstPerson: true,
    patterns: [
      /\b(?:new|next) chapter\b/i, /\bnext adventure\b/i, /\bopen to (?:work|new opportunities|new roles)\b|#opentowork/i, /\bbittersweet\b/i,
      /after \w+ (?:amazing|incredible|wonderful|great|fantastic|unforgettable|rewarding) years/i, /excited to (?:announce|share) (?:that )?I/i,
      /\bmy (?:last day|time at)\b/i, /\bI (?:was|got) (?:impacted|affected|laid off|let go)\b/i, /\bI(?:'m| am) (?:officially )?(?:moving on|leaving)\b/i,
    ],
    summary: ["They're changing jobs and putting it nicely.", "They left their job, maybe not by choice, and want the next one.", "Job's gone. The inspirational post is the cover story."],
    line: ["They're changing jobs.", "They left or lost their job.", "Job gone. Spin on."],
  },
  {
    id: "delay",
    weight: 6,
    patterns: [
      /\bdelay(?:ed|ing|s)?\b/i, /\bslip(?:ped|ping|s)?\b/i, /\bpush(?:ed|ing)? (?:out|back)\b/i, /\breschedul/i, /\bbehind schedule\b/i,
      /(?:moved|pushed|shifted|moving|pushing|shifting) (?:the \w+ )?(?:to|into) (?:Q[1-4]|next (?:quarter|year|month|sprint)|(?:early|mid|late)[ -]\w+|the (?:second|back) half)/i,
      /(?:revised|updated|new|adjusted|realistic) (?:timeline|target date|launch date|ETA|delivery date|go-live)/i, /timelines? (?:has |have )?(?:shifted|moved|changed|slipped)/i,
      /\bre-?baselin/i, /later than (?:planned|expected|originally|anticipated)/i, /\b(?:will )?now (?:target|aim for|be targeting|land in|ship in|arrive in|be expected in)\b[^.]{0,30}\b(?:Q[1-4]|(?:early|mid|late)[ -]\w+|next (?:quarter|year|month)|the (?:second|back) half|[A-Z][a-z]+ \d{4})\b/i, /(?:no longer|not) (?:on track|going to make|hitting)/i, /\bre-?phas/i,
    ],
    summary: ["It's going to be late.", "It's late. The date moved.", "It's late, and the new date will slip too."],
    line: ["This is running late.", "It's delayed.", "It's late. Again."],
  },
  {
    id: "deflection",
    weight: 4,
    patterns: [
      /\bgreat question\b/i, /\btake (?:this|that|it) offline\b/i, /\bcircle back\b/i, /not in a position to (?:comment|share|discuss|say|speculate)/i,
      /(?:too early|premature) to (?:say|tell|comment|speculate|share)/i, /(?:still|currently|actively) (?:evaluating|assessing|exploring|reviewing) (?:our |all |the |a |several |many )?(?:options|paths?|situation|next steps|alternatives)/i,
      /(?:can't|cannot|won't|don't) (?:get into|go into|speak to|comment on) (?:the )?(?:specifics|details|individual|rumors|speculation)/i,
      /\bpark (?:that|this)\b/i, /let me get back to you/i, /\bno (?:final )?decisions? (?:has|have) been made\b/i, /nothing to (?:share|announce) (?:at this time|right now|yet)/i,
      /(?:a lot of|many) moving (?:parts|pieces)/i, /\bwe hear you\b/i, /\bunder advisement\b/i, /\bthanks for (?:raising|flagging|sharing) (?:this|that)\b[^.]{0,20}$/i,
      /\b(?:share|tell you|update you|provide) more (?:details |information |context )?(?:when|once|as soon as) (?:we're|we are|we can|we're able|able|possible|appropriate|we have)/i,
    ],
    summary: ["They didn't really answer.", "That's a non-answer.", "They dodged it. Assume the worst."],
    line: ["They're avoiding a direct answer.", "Non-answer.", "Dodged."],
  },
  {
    id: "layoffs",
    weight: 10,
    patterns: [
      /\blay ?offs?\b/i, /\blaid off\b/i, /\bright[- ]?siz/i, /workforce optimi[sz]ation/i, /optimi[sz]e (?:our|the) workforce/i, /transition(?:ing)? (?:\w+ )?out\b(?! of (?:his|her|their|my) role)/i, /\bdownsiz/i, /reduction in force/i, /\bRIF\b/,
      /workforce reduction/i, /reduc\w* (?:our |the )?(?:global )?(?:workforce|headcount|team)/i, /headcount (?:will be |is |will )?(?:lower|reduc\w*|cut|smaller|down)/i,
      /eliminat\w* (?:\w+ )?(?:roles|positions|jobs)/i, /part(?:ing)? ways/i, /impacted (?:employees|colleagues|team members|roles)/i,
      /\bseverance\b/i, /\bseparation\b/i, /(?:roles|positions) (?:are|will be) (?:impacted|affected)/i,
      /saying goodbye to/i, /\blet(?:ting)? go\b(?! of)/i,
      /\b(?:departure|exit|transition) of (?:some|several|a number of|many|certain|\d+) (?:team members|colleagues|employees|roles|people|teammates)\b/i,
    ],
    summary: ["Some people are losing their jobs.", "We're laying people off.", "We're firing people to save money."],
    line: ["Some jobs are being cut.", "People are getting laid off.", "We're firing people."],
  },
  {
    id: "rto",
    weight: 8,
    patterns: [
      /return(?:ing)?[ -]to[ -](?:the )?office/i, /\bRTO\b/, /in[ -]person collaboration/i, /\bin[ -]office\b/i,
      /days? (?:a|per) week in/i, /back (?:to|in) the office/i, /\bour offices\b/i, /badge (?:data|swipes?)\b|\bbadging\b|\bbadge in (?:at least|\w+ days|on)\b/i, /\b(?:office|in-person|collaboration) hubs?\b|\bhub days?\b|\bour hubs\b/i,
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
    summary: ["Don't expect much of a raise this year.", "Raises are small or zero.", "Little or no raise for you."],
    line: ["Raises are small or on hold.", "Small raises or none.", "Little or no raise for you."],
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
    patterns: [/\breorg/i, /restructur/i, /realign/i, /new (?:operating model|structure|org)/i, /reporting (?:line|structure)/i, /will now report/i, /\b(?:team|teams|org|organization|group|function|department)s? will (?:now )?report (?:in)?to\b/i, /consolidat/i, /combin\w* (?:the|our) \w+ (?:teams|orgs|organizations)/i, /\b(?:teams|orgs|organizations|departments|functions|groups) will (?:be )?(?:combined|merged|consolidated|unified|brought together)\b/i, /\bunder (?:one|a single) (?:leader|head|manager|org|organization|VP)\b/i, /merg\w* (?:the|our|two)/i],
    summary: ["Teams and managers are being reshuffled.", "It's a reorg. Expect new bosses and confusion.", "It's a reorg, which usually means cuts come next."],
    line: ["Teams are being reorganized.", "Your boss or team may change.", "Reorg. Brace for chaos."],
  },
  {
    id: "cost-cuts",
    weight: 5,
    patterns: [/cost (?:discipline|optimization|reduction|savings|cutting)/i, /\bcut(?:ting)? costs?\b/i, /efficienc/i, /streamlin/i, /do more with less/i, /\bleaner\b/i, /spend(?:ing)? (?:less|wisely|discipline)/i, /(?<!\b(?:bigger|larger|higher|increased|expanded|new) )(?<!\b(?:doubling|increasing|raising|expanding|boosting|doubled|tripling) (?:the |our |your |a )?(?:[\w-]+ )?)\bbudget(?!s? (?:has|have) been (?:doubled|increased|raised|expanded))(?! is now \$)/i, /prudent/i],
    summary: ["The company is cutting spending.", "They're cutting costs.", "They're cutting costs, and you are a cost."],
    line: ["Spending is being cut.", "They want to spend less money.", "They're cutting costs."],
  },
  {
    id: "hiring-freeze",
    weight: 5,
    patterns: [/hiring freeze/i, /paus\w* (?:on |all |new |external |outside |further |most |non-critical )*(?:hiring|backfill)/i, /\bbackfills?\b/i, /not (?:be )?(?:hiring|backfilling)/i, /open (?:roles|reqs)/i, /freez\w* (?:on )?(?:hiring|headcount)/i, /(?:hiring|headcount) (?:is |will be |has been )?(?:paused|frozen|on hold)/i, /headcount (?:is |will (?:be |stay |remain )?)?flat/i],
    summary: ["No new hires for a while.", "No one new is being hired, so you'll cover the gaps.", "No help is coming. You'll do the extra work."],
    line: ["Hiring is on hold.", "No new hires.", "No help is coming."],
  },
  {
    id: "ai",
    weight: 4,
    patterns: [/\bAI\b/, /artificial intelligence/i, /\bautomat(?:ion|ions|ed|ing|e|es)\b/i, /agentic/i, /machine learning/i],
    summary: ["They want AI to do more of the work.", "They plan to use AI to need fewer people.", "They'd like a robot to do your job."],
    line: ["They want to use AI more.", "AI will do some of this work.", "AI is coming for these jobs."],
  },
  {
    id: "performance",
    weight: 4,
    patterns: [/high[ -]perform/i, /performance (?:bar|standards|expectations|management)/i, /raise the bar/i, /accountab/i, /\bintensity\b/i, /hardcore/i],
    summary: ["They expect more from you.", "Work harder or you might be next.", "Work harder, or you're next."],
    line: ["They expect more from everyone.", "Work harder.", "Work harder or you're next."],
  },
  {
    id: "departure",
    weight: 4,
    patterns: [/stepping (?:down|away|back)/i, /(?:has|have) decided to (?:leave|step|pursue(?! other candidates| another candidate| a different candidate| candidates))/i, /pursue other opportunities/i, /spend more time with (?:his|her|their) family/i],
    summary: ["Someone is leaving.", "Someone is leaving, maybe not by choice.", "Someone is out, maybe not by choice."],
    line: ["Someone is leaving.", "They're leaving, maybe not by choice.", "They're out, maybe not by choice."],
  },
  {
    id: "benefits",
    weight: 5,
    patterns: [/benefits? (?:changes|update|plan)/i, /perks/i, /\b(?:no longer|will not|won't|will stop) (?:cover|pay for|reimburse|fund|subsidi[sz]e|provide|offer)\w*\b[^.]{0,40}\b(?:plans?|costs?|phones?|internet|gym|meals?|lunch|parking|commut\w*|stipends?|tuition|childcare|insurance|memberships?)\b/i, /\b(?:sunset|discontinu|eliminat)\w*\b[^.]{0,40}\b(?:stipend|perk|reimbursement|allowance|subsid|match)\w*/i, /(?:401\(?k\)?|retirement) match/i, /stipend/i, /health (?:plan|insurance|coverage)/i, /premiums?/i],
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

// More ways memos say the same things. Found by the variations dataset (tests/variations).
const MORE_PATTERNS = {
  "layoff-you": [/\b(?:your )?contract will not be renewed\b|\bnot (?:be )?renew(?:ing)? your contract\b/i, /\brelieved of (?:your|his|her|their) duties\b/i],
  pip: [/\bfurther (?:disciplinary )?action (?:may|will|could) be taken\b/i, /\bperformance plan\b/i, /\breview progress against the goals\b/i, /\bmay result in (?:further|disciplinary|additional) action\b/i, /\bformal step in (?:our|the) performance process\b/i,
    /\btargets outlined in the attached plan\b/i, /\bconsistent improvement by\b/i, /\bgaps? between your performance and\b/i, /\breset expectations and demonstrate\b/i,
    /\bnext (?:30|45|60|90) days (?:are|will be) (?:important|critical)\b/i,
    // Round 6: "a structured development plan with clear expectations and check-ins over the next 30 days".
    /\bstructured (?:development|performance|improvement|success|growth) plan\b/i, /\bclear expectations and (?:regular |weekly |frequent )?check-?ins\b/i],
  shutdown: [/\b(?:office|site|plant|store|location|facility|studio|branch|warehouse) will close\b/i, /\bceas\w* (?:development|operations|production|support)\b/i,
    /\bretir(?:e|ing|ed) the (?:\w+ )?(?:portal|product|app|tool|system|platform|service|site|program|wiki|dashboard)\b/i, /\b(?:indefinite )?hiatus\b/i,
    /\bbring(?:ing)? (?:the |our )?[\w -]{0,30} to a close\b/i, /\bgoes read-only\b|\bwill be (?:deleted|decommissioned|turned off)\b|\bdecommission/i,
    /\b(?:beta|pilot|program|service|product|route) will end\b/i, /\bsuspend (?:operations|service)\b/i],
  outsourcing: [/\bpartner\w* with (?:a |an )?(?:global |external |third[- ]party )?(?:services? )?(?:firm|provider|company|vendor)\b/i,
    /\bleverage (?:a |an )?(?:trusted |external |third[- ]party )?(?:vendor|partner|provider)\b/i,
    /\b(?:managed|handled|run|operated|provided|performed) by (?:an? )?(?:external|third[- ]party|outside) (?:\w+ )?(?:provider|vendor|firm|company|partner)\b/i,
    /\bmanaged service partner\b/i, /\bthird[- ]party (?:\w+ )?provider\b/i, /\bsigned with [A-Z]\w*(?: [A-Z]\w*)? to (?:run|handle|manage|provide)\b/,
    /\bpartnership with [A-Z][^.]{0,80}(?:take on|take over|will handle|will run)\b/, /\bwill be provided by [A-Z]/],
  rejection: [/\b(?:per|according to) (?:legal|compliance|counsel|our lawyers)\b[^.]{0,30}\b(?:unable|can't|cannot|not able|not permitted|not allowed)\b/i, /\b(?:legal|compliance|counsel) (?:says|said|has said|confirmed|has confirmed)\b[^.]{0,30}\b(?:can't|cannot|unable|not)\b/i, /\bnot (?:able|in a position) to (?:support|approve|accommodate) (?:it|this|that|your)\b/i, /\bposition has been filled\b/i, /\boriginal decision will stand\b|\bdecision will stand\b/i,
    /\bnot quite (?:a|the right) (?:fit|match)\b/i, /\b(?:cannot|can't|can not) be approved\b|\bcan(?:'t|not) approve\b/i, /\bbetter match your background\b/i,
    /\bdoes(?:n't| not) fit our (?:current )?\w+(?: needs)?\b/i, /\bcan(?:'t|not) offer\b/i, /\b(?:legal|finance|they|she|he) said no\b/i, /\bfalls outside (?:current |our )?(?:guidelines|policy)\b/i],
  "stack-rank": [/\b(?:\d+%|percent) of (?:each|every|the) team will be rated\b/i, /\bnot everyone can be (?:exceeding|rated)\b/i, /\bcaps? the number of (?:top )?ratings\b/i,
    /\bguided distribution\b/i, /\bteam rankings?\b|\brank(?:ing)? your team\b/i, /\bbottom tier\b/i],
  "budget-freeze": [/\brequires? (?:VP|director|executive|CFO|additional) approval\b/i, /\bpausing (?:all )?non-essential (?:travel|spend|purchases)\b/i,
    /\bhold off on (?:new |any )?(?:\w+ )?(?:purchases|spend)\b/i, /\b(?:purchase orders|purchases|spend) (?:above|over) \$[\d,]+/i, /\bdefer (?:any |all )?spend\b/i,
    /\bstipends? (?:are|is) paused\b/i, /\bfreeze on \w+ spend\b/i, /\bon hold until (?:budgets?|the new budget)\b/i, /\bspending is frozen\b/i, /\bno new spend\b/i,
    /\bhold (?:any|all) (?:\w+ )?purchases\b/i, /\bput a hold on (?:all )?(?:non-critical |new )?purchases\b/i],
  "cost-cuts": [/\breduc\w* (?:our )?spend(?:ing)? on\b/i, /\bin savings\b|\blook for savings\b/i, /\breal estate footprint\b/i, /\bdoing more with less\b/i,
    /\b(?:snacks|catered lunches|perks|swag)\b[^.]{0,40}\b(?:reduced|cut|scaled back)\b/i, /\bROI targets\b/i, /\blimit travel\b|\bpause new vendor contracts\b/i, /\breduce costs\b/i, /\bsmaller footprint\b/i],
  deflection: [/\bdon't want to speculate\b|\brather not (?:speculate|commit)\b/i, /\bsomething we'll look into\b|\bwe'll look into (?:it|that|this)\b/i,
    /\bdon't have anything (?:more )?to share\b|\bnothing (?:more )?to share\b/i, /\bwhen there is something to share\b/i, /\bstill working through\b/i,
    /\bas previously mentioned\b|\bper my last email\b/i, /\bout of scope for now\b/i, /\baware of the concerns\b/i, /\brest assured\b/i, /\b(?:in|into|to|on) the parking lot\b|\bparking[- ]lot (?:it|this|that)\b/i],
  delay: [/\b(?:revised|updated|adjusted|moved|pushed|shifted|changed) the (?:[\w-]+ )?(?:go-live|launch|target|delivery|release|ship|completion) (?:date|timeline)\b[^.]{0,60}\bto (?:late|early|mid|Q[1-4]|next|the (?:second|back) half|a later)\b/i, /\btaking longer than (?:anticipated|expected|planned)\b/i, /\bno longer (?:tracking|realistic|feasible)\b/i, /\bmoved from \w+ to \w+\b/i, /\bin a later (?:sprint|release|phase)\b/i,
    /\bnow targeting\b/i, /\bdelivery will move\b/i, /\bmove (?:our |the )?(?:\w+ )?date from\b/i, /\bwill now take effect in\b/i, /\badjust\w* the timeline\b/i],
  departure: [/\bno longer with the company\b/i, /\btransitions? to an advisory role\b|\btransitioning to the role of\b/i, /\b(?:[A-Z][a-z]+|he|she) will be leaving (?:us|the company)\b/,
    /\bwill be departing\b/i, /\bsearch for (?:our|a) next (?:CEO|CFO|COO|CTO|leader)\b/i],
  "hiring-freeze": [/\bheadcount (?:will be )?held flat\b/i, /\breviewing all open requisitions\b|\brequisitions?\b[^.]{0,40}\b(?:closed|on hold|paused)\b/i, /\bfreeze on (?:external )?hiring\b/i,
    /\bheadcount requests? (?:won't|will not) be\b/i, /\binternship program is cancell?ed\b/i, /\bwon't be able to open the \w+ role\b|\bwon't be filling open roles\b/i],
  "new-chapter": [/\bI(?:'ve| have) (?:made the decision|decided) to leave\b/i, /\bI was one of the [\d,]+ (?:people |employees )?impacted\b/i, /\bI(?:'ve| have) accepted a (?:new )?role\b/i,
    /\bmy role (?:at \w+ )?was eliminated\b/i, /\bmy last (?:week|day)\b/i, /\bopen to conversations\b/i, /\bmy DMs are open\b/i],
  "no-raises": [/\b(?:annual|salary|pay|comp|merit) increases?\b/i, /\bbonus pool\b/i],
  benefits: [/\ballowance\b/i, /\breimbursement\b/i, /\bcommuter benefit\b/i, /\bunlimited PTO\b/i, /\bhigh-deductible\b/i, /\bstop covering\b/i, /\bmatch for the 401/i],
  layoffs: [/\broles will not continue\b/i, /\bteams? will be smaller\b|\bsmaller teams\b/i, /\boptimi[sz]\w* (?:our|the) workforce\b/i, /\beliminat\w* (?:[\w%,]+ ){0,4}(?:roles|positions|jobs)\b/i, /\b(?:roles|positions|jobs) will be (?:eliminated|cut)\b/i, /\breduction affects\b/i,
    /\b(?:removing|eliminating|cutting) (?:a|one|two) layers? of (?:\w+ )?management\b/i, /\bsaid goodbye to \d+/i,
    /\breduc\w* the size of (?:our|the) (?:team|workforce|company)\b/i, /\breduce its workforce\b/i, /\btransitioning (?:approximately |about |around )?\d+ roles out\b/i,
    /\bcuts in the\b/i, /\bsome colleagues will be leaving\b/i, /\boverlapping (?:roles|functions|positions)\b/i, /\baffected (?:staff|employees) will be notified\b/i],
  rto: [/\bexpected in the office\b/i, /\bin the office (?:Mon|Tue|Wed|Thu|Fri)\w* (?:through|and|to)\b/i, /\bending the fully remote\b/i, /\bmoving everyone to hybrid\b/i,
    /\battendance will be a factor\b/i, /\bremote (?:work )?exceptions\b/i, /\beveryone in the office\b/i, /\bhybrid model is changing\b/i],
  reorg: [/\bchanges to (?:our|the) (?:org(?:anizational)? )?structure\b/i, /\bfewer layers of management\b/i, /\bunder a single leader\b/i, /\borganized around\b/i, /\bmatrix model\b|\bdual reporting\b/i, /\bwill be merged into\b/i, /\boperate as a single organization\b/i,
    /\bwill move under\b/i, /\breporting to [A-Z]\w+/, /\bevolving our structure\b/i],
  performance: [/\b(?:I'd like to|I want to|we need to|I need to|I'm hoping to|I expect to|I'll need to) see (?:more|greater|better|stronger|increased|a lot more) (?:ownership|urgency|accountability|focus|initiative|attention to detail|follow-through|proactivity|consistency)\b/i, /\b(?:opportunities|areas) (?:for|of) (?:growth|improvement|development)\b[^.]{0,30}\byour\b|\byour\b[^.]{0,40}\b(?:opportunities|areas) (?:for|of) (?:growth|improvement)\b/i, /\bset a high bar\b|\baddress underperformance\b|\bunderperform/i, /\bbring (?:their|your|our) A-game\b/i, /\bwork-life integration\b|\bwinning takes sacrifice\b/i,
    /\breviewing results closely\b|\bconsistently miss targets\b|\bimprove or move on\b/i, /\bthe bar is going up\b|\braising the bar\b/i],
  "record-year": [/\brecord bookings\b/i, /\bahead of plan\b|\bbest result in our history\b/i],
  acquisition: [/\bas part of the integration\b/i],
};
// Extra cues that make a raise or benefits sentence bad news.
const MORE_NEGATIVE = {
  "no-raises": /\b(?:smaller|capped|postpone\w*|of target|on hold)\b/i,
  // Round 6: "keep our benefits sustainable ... match from 6% to 3%" is a cut too.
  benefits: { test: (s) => /\b(?:replac\w*|lower\w*|no longer|will end|stop covering|high-deductible|instead of|sustainab\w*)\b|\b(?:premiums?|contributions?|deductibles?|copays?)\b[^.]{0,50}\b(?:increase|rise|go up|higher)\b/i.test(s) || [...s.matchAll(/\bfrom (\d+(?:\.\d+)?)% to (\d+(?:\.\d+)?)%/g)].some((m) => +m[2] < +m[1]) },
};
for (const t of THEMES) {
  t.patterns.push(...(MORE_PATTERNS[t.id] ?? []));
  if (MORE_NEGATIVE[t.id]) t.negative = MORE_NEGATIVE[t.id];
}
// A narrower pattern wins: "10% will be rated as not meeting expectations" is stack ranking, not a PIP,
// "45 days" is not "5 days a week", and a stipend being discontinued is a benefit cut, not a shutdown.
{
  const pip = THEMES.find((t) => t.id === "pip");
  pip.patterns = pip.patterns.map((p) => (/not meeting/.test(p.source) ? /(?<!rated as )(?:below|did not meet|does not meet|not meeting|not met) (?:the )?expectations/i : p));
  const rto = THEMES.find((t) => t.id === "rto");
  rto.patterns = rto.patterns.map((p) => (p.source.startsWith("(?:three|four|five") ? /\b(?:three|four|five|3|4|5) days\b(?! (?:to|for) review)/i : p));
  const shutdown = THEMES.find((t) => t.id === "shutdown");
  const BENEFIT_WORDS = "(?! (?:the |our |its )?(?:[\\w-]+ ){0,2}(?:stipend|allowance|benefit|perk|reimbursement|match|subsidy))";
  shutdown.patterns = shutdown.patterns.map((p) => (p.source === "\\bdiscontinu" ? new RegExp(`\\bdiscontinu\\w*${BENEFIT_WORDS}`, "i") : p));
  const reorg = THEMES.find((t) => t.id === "reorg");
  reorg.patterns = reorg.patterns.map((p) => (p.source === "consolidat" ? /consolidat(?:e|es|ed|ing|ion)?\b(?! (?:our |two |three |\w+ )?(?:offices?|real estate|space|vendors|tools|licenses))/i : p));
  const doMore = THEMES.find((t) => t.id === "cost-cuts");
  doMore.patterns = doMore.patterns.map((p) => (p.source === "do more with less" ? /\bdo(?:ing)? more with less\b/i : p));
}

// The headline for each signal, shown at the top of a decode. Ordered by how bad the news is.
export const SIGNALS = {
  "layoff-you": { label: "You're being laid off", tone: "bad" },
  layoffs: { label: "Layoffs", tone: "bad" },
  pip: { label: "PIP", tone: "bad" },
  shutdown: { label: "Shutdown", tone: "bad" },
  outsourcing: { label: "Outsourcing", tone: "bad" },
  rejection: { label: "It's a no", tone: "bad" },
  "stack-rank": { label: "Stack ranking", tone: "bad" },
  "no-raises": { label: "No raises", tone: "bad" },
  rto: { label: "Back to the office", tone: "warn" },
  "budget-freeze": { label: "Budget freeze", tone: "warn" },
  "hiring-freeze": { label: "Hiring freeze", tone: "warn" },
  "new-job": { label: "New job post", tone: "warn" },
  "new-chapter": { label: "New chapter post", tone: "warn" },
  delay: { label: "Delay", tone: "warn" },
  reorg: { label: "Reorg", tone: "warn" },
  "cost-cuts": { label: "Cost cuts", tone: "warn" },
  benefits: { label: "Benefit cuts", tone: "bad" },
  acquisition: { label: "Merger", tone: "warn" },
  departure: { label: "Exec exit", tone: "warn" },
  ai: { label: "AI push", tone: "warn" },
  performance: { label: "Pressure to perform", tone: "warn" },
  deflection: { label: "Non-answer", tone: "warn" },
  "record-year": { label: "Good year", tone: "good" },
};

// Softer signals. One alone proves nothing, but two or more in the same memo mean layoffs.
export const LAYOFF_HINTS = [
  /restructur/i, /streamlin/i, /align(?:ing)? (?:our )?resources/i, /(?:difficult|hard|tough|painful) decisions?/i,
  /\bsynergies\b/i, /\bleaner\b|\blean (?:team|organization|company)/i, /operational efficienc/i,
  /\bheadcount\b/i, /\bpart(?:ing)? ways\b/i, /transition(?:ing)? (?:\w+ )?out\b/i, /eliminat\w* (?:\w+ )?(?:roles|positions|jobs)/i,
  /\bright[- ]?siz/i, /reduction in force|\bRIF\b/, /workforce/i, /fewer layers of management/i, /smaller footprint/i, /impacted (?:employees|colleagues|team members|roles)/i,
];

// Decode swaps that only apply when the memo is about layoffs. They win over DECODE_SWAPS.
export const LAYOFF_CONTEXT_SWAPS = `
synergies = cost savings = job cuts = job cuts
unlock synergies = save money by combining teams = save money by cutting jobs = cut jobs
impacted = affected = laid off = fired
let go = laid off = fired = fired
separation = exit = layoff = firing
efficiencies = savings = job cuts = job cuts
streamline = simplify = cut jobs = cut jobs
streamlining = simplifying = cutting jobs = cutting jobs
`;

// Words that flip a raise or benefits theme into the bad news version.
export const NEGATIVE_CUES = /\b(?:sunset\w*|no longer|will stop|fell short|falls short|short of (?:our )?(?:targets?|goals?|plan|expectations)|below (?:target|plan|expectations)|missed (?:our )?(?:targets?|goals?|plan)|pause|paused|pausing|freeze|frozen|hold|not|no|won't|will not|unable|suspend|suspended|defer|deferred|delay|delayed|reduc\w*|eliminat\w*|discontinu\w*|lower|cap|capped|caps|limited|modest|evolv\w*)\b/i;

// Sentences that are pure fluff. Decoded with a stock line.
export const FLUFF_PATTERNS = [
  /\bgrateful\b/i, /^(?:a big |a huge )?thank(?:s| you)?\b|\bthank you (?:all|everyone|to)\b/i, /\bproud\b/i, /\bjourney\b/i, /\bfamily\b/i, /\bheart\b/i,
  /\bmission\b/i, /\bvalues\b/i, /\bexcit\w*/i, /\bthrilled\b/i, /\binspir\w*/i, /\bpassion\w*/i,
  /\bbright future\b/i, /\bbest is yet to come\b/i, /\btogether\b/i, /\bcommitted\b/i, /\bcare deeply\b/i,
  /\bpeople are our\b/i, /\bevery (?:single )?one of you\b/i, /\bincredible\b/i, /\bamazing\b/i, /\bhumbled\b/i,
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

const WHO_SAID = "legal|compliance|counsel|our lawyers|the lawyers|security|procurement|finance|HR|the board|leadership";
const LEGAL_NO = new RegExp(String.raw`\b(?:(?:per|according to) (${WHO_SAID})\b(?: team)?,? |(${WHO_SAID})(?: team)? (?:has |have )?(?:advised|said|confirmed|determined|told us|let us know|flagged)(?: that)? )(?:we(?:'re| are| will be)? (?:not able|unable|not permitted|not allowed|not in a position) to|we (?:can't|cannot|can not|shouldn't|should not|must not|may not|won't be able to)) (\w+)([^.]{0,80})`, "i");
function legalNoLine(sentence, lvl) {
  const m = sentence.match(LEGAL_NO);
  const who0 = (m[1] ?? m[2]).replace(/^(?:the |our )/i, "");
  const who = /^hr$/i.test(who0) ? "HR" : /^(?:lawyers|counsel)$/i.test(who0) ? "Legal" : who0[0].toUpperCase() + who0.slice(1).toLowerCase();
  const verb = m[3].toLowerCase();
  const rest = m[4].replace(/[.!\s]+$/, "");
  const ing = /ee$/.test(verb) ? verb + "ing" : /[^aeiou]e$/.test(verb) ? verb.slice(0, -1) + "ing" : verb + "ing";
  return [`${who} said we can't ${verb}${rest}.`, `${who} said no. We can't ${verb}${rest}.`, `${who} killed it. No ${ing}${rest}.`][lvl];
}
const PERK_NOUN = "stipends?|perks?|reimbursements?|allowances?|subsid(?:y|ies)|match|benefits?|bonus(?:es)?|budget for (?:\\w+ )?(?:snacks|lunches|food|travel|training)";
const PERK_CUT = new RegExp(String.raw`\b(?:sunset(?:ting|ted|s)?|discontinu\w*|eliminat\w*|remov\w*|end(?:ing)?|retir\w*|no longer (?:offer|provid|fund|cover)\w*) (?:the |our |your |all )?((?:[\w-]+ ){0,3}(?:${PERK_NOUN}))\b`, "i");
function perkCutLine(sentence, lvl) {
  const thing = sentence.match(PERK_CUT)[1].replace(/\s+/g, " ").trim();
  const pl = /s$/i.test(thing) && !/(?:bonus|allowance)$/i.test(thing) || /ies$/i.test(thing);
  return [`The ${thing} ${pl ? "are" : "is"} going away.`, `They're cutting the ${thing}.`, `No more ${thing}. That's a pay cut.`][lvl];
}

// Sentence-level decodes that beat theme lines. Checked in order, first match wins.
export const SPECIAL_LINES = [
  // Round 7 (fresh10): "Legal has advised that we are not able to use the customer's logo in our marketing
  // materials" is a firm no from legal about one specific thing. Say who said no and to what.
  { pattern: LEGAL_NO,
    lines: [0, 1, 2].map((lvl) => (sentence) => legalNoLine(sentence, lvl)), asSummary: true },
  // "we will be sunsetting the annual wellness stipend" is a perk going away, not a product shutdown.
  { pattern: PERK_CUT,
    lines: [0, 1, 2].map((lvl) => (sentence) => perkCutLine(sentence, lvl)), asSummary: true },
  // "opportunities for growth in your role" is how a manager opens a talk about problems with your work.
  { pattern: /\b(?:discuss|talk about|go over|review|share|explore)\b[^.]{0,30}\b(?:some )?(?:opportunities|areas) (?:for|of) (?:growth|improvement|development)\b[^.]{0,30}\byour\b|\byour\b[^.]{0,40}\b(?:opportunities|areas) (?:for|of) (?:growth|improvement)\b/i,
    lines: ["They want to talk about problems with your work.", "You're about to hear criticism of your work.", "Your work isn't where they want it. Brace for it."], asSummary: true },
  // "That's an interesting idea." before a brush-off is lukewarm, not praise.
  { pattern: /^(?:that's|that is|what) an? (?:interesting|intriguing|bold|novel) (?:idea|thought|take|suggestion|perspective|proposal)[.!]?$/i,
    lines: ["They're not sold on the idea.", "They don't like the idea.", "They don't like it."] },
  // "Bonuses this year will reflect company performance, which fell short of targets" -> smaller bonuses.
  { pattern: /\bbonus(?:es)?\b[^.]{0,60}\b(?:fell short|falls short|short of|below (?:target|plan|expectations)|missed (?:our )?(?:targets?|goals?|plan))\b/i,
    lines: ["Bonuses will be smaller because the company missed its targets.", "Smaller bonuses. The company missed its numbers.", "Your bonus is shrinking because the company missed."], asSummary: true },
  // Round 6 (fresh7): lines that carry the specific fact instead of repeating the theme line.
  { pattern: /\b(?:premiums?|contributions?|deductibles?|copays?)\b[^.]{0,50}\b(?:will )?(?:increase|rise|go up)\b/i,
    lines: ["You'll pay more for your health plan.", "Your health plan will cost you more.", "Same health plan, bigger bill."], asSummary: true },
  { pattern: /\b(?:per|according to) compliance\b[^.]{0,30}\b(?:unable|can't|cannot|not able|not permitted|not allowed)\b/i,
    lines: ["Compliance said no.", "Compliance blocked it.", "Compliance said no. That's the end of it."], asSummary: true },
  { pattern: /\b(?:per|according to) (?:legal|counsel|our lawyers)\b[^.]{0,30}\b(?:unable|can't|cannot|not able|not permitted|not allowed)\b/i,
    lines: ["Legal said no.", "Legal blocked it.", "Legal said no. That's the end of it."], asSummary: true },
  { pattern: /\b(?:impacted|affected) (?:team members|employees|colleagues|staff|people|individuals)\b[^.]{0,30}\b(?:will be|are being|have been) (?:notified|informed|contacted)\b/i,
    lines: ["The people affected will be told {when}.", "The people being cut will hear {when}.", "The people being fired find out {when}."] },
  { pattern: /\b(?:we'll|we will) (?:share|provide|have) more (?:details |information |to share )?(?:when|once|as soon as) (?:we're|we are|we can|we're able|able|possible|appropriate)\b/i,
    lines: ["They'll share more later.", "They'll tell you when they decide to.", "Don't hold your breath."] },
  { pattern: /\bI(?:'ve| have)? decided (?:that )?it's time for (?:my )?(?:next|a new) chapter\b/i,
    lines: ["They decided to leave.", "They're leaving, and they say it's their choice.", "They're out, by their own telling."] },
  { pattern: /\bbonus(?:es)?(?: payouts?| payments?)?\b[^.]{0,40}\b(?:delayed|pushed|postponed|deferred|moved)\b|\b(?:delay|postpon|defer)\w* (?:the |all |your |our )?(?:annual )?bonus/i,
    lines: ["Bonuses are coming later.", "Bonuses are delayed.", "Your bonus is late. Maybe smaller."], asSummary: true },
  { pattern: /\bper my last email\b[^.]*\b(?:circle back|offline|parking lot)\b/i,
    lines: ["As I said before, let's talk about this later.", "I already told you. Let's drop this for now.", "I already told you. Drop it."], asSummary: true },
  { pattern: /\b(?:per my last email|as (?:previously|already) (?:mentioned|stated|discussed))\b/i,
    lines: ["As I said before.", "I already told you this.", "Read my email."], asSummary: true,
    // "Per my last email, the deadline is Friday" still says the deadline. Keep what follows the phrase.
    keepRest: /^(?:per my last email|as (?:previously|already) (?:mentioned|stated|discussed))\b[,:]?\s*/i },
  { pattern: /\b(?:take (?:this|that|it) to the parking lot|circle back (?:on this )?offline|park (?:this|that)(?: for now)?|take (?:this|that|it) offline)\b/i,
    lines: ["Let's talk about this later.", "Let's drop this for now.", "Drop it."], asSummary: /^(?:let's|happy to|i'm happy to|can we|we can|i'll|i will|i'd like to)\b/i },
  { pattern: /\bunlock(?:ing)? synergies\b|\bdrive sustainable growth\b/i,
    layoffLines: ["Cutting jobs should save money.", "Cutting jobs saves them money.", "Firing people saves them money."],
    lines: ["They expect to save money by combining things.", "Combining things should save them money.", "Merging things to save money."] },
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
