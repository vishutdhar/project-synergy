// Golden corpus: realistic inputs with the signal or the properties each one must keep.
// Fictional companies and people. Levels: 1 = Polite / Mild, 2 = Honest / Middle Manager, 3 = Blunt / Full C-Suite.

// Corporate to normal. `signal` is the expected headline id. `also` lists other themes that must be found.
export const DECODE = [
  // Personal layoff
  { level: 2, signal: "layoff-you", input: "Hi Jordan, I'm reaching out with difficult news. As part of the restructuring announced today, your role has been eliminated. Your last day will be March 6, and HR will send details about your severance package." },
  { level: 1, signal: "layoff-you", input: "Thank you for your contributions to Brightwell. Unfortunately, you have been impacted by today's workforce reduction. Your access to company systems will end at 5 PM." },
  { level: 3, signal: "layoff-you", input: "We've made the decision to part ways. Your position is among those affected by the reorganization, and your separation agreement is attached." },
  // Layoffs
  { level: 2, signal: "layoffs", input: "To position Orbix for the next phase, we are reducing our global workforce by about 8%. Impacted employees will hear from their manager by noon." },
  { level: 1, signal: "layoffs", input: "Today we said goodbye to some talented colleagues as part of a broader effort to right-size the business." },
  { level: 3, signal: "layoffs", input: "We are streamlining the organization and making difficult decisions about where we invest. Headcount in Sales will be lower going forward." },
  // Budget freeze
  { level: 2, signal: "budget-freeze", input: "Effective immediately, all discretionary spending is paused through the end of Q4. Travel and training budgets have been frozen, and any purchase over $500 needs CFO approval." },
  { level: 1, signal: "budget-freeze", input: "Given the current environment, we are implementing a spend freeze on non-essential vendors and offsites." },
  { level: 3, signal: "budget-freeze", input: "Please note there will be additional scrutiny on all expenses until further notice." },
  // Hiring freeze
  { level: 2, signal: "hiring-freeze", input: "We are pausing all new hiring for the rest of the year and will not backfill departures." },
  { level: 3, signal: "hiring-freeze", input: "Headcount will stay flat in 2027, so open reqs are on hold." },
  // Rejection or no-go
  { level: 2, signal: "rejection", input: "Thank you for taking the time to interview with us. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our needs. We'll keep your resume on file." },
  { level: 1, signal: "rejection", input: "We really appreciate the proposal. At this time we won't be moving forward, but we'd love to stay in touch." },
  { level: 3, signal: "rejection", input: "Leadership reviewed the request and decided not to fund the project this year." },
  { level: 2, signal: "rejection", input: "Your request for a remote exception is not something we can approve right now." },
  // Delay or slip
  { level: 2, signal: "delay", input: "Due to some unforeseen dependencies, the launch has been moved to Q3. We'll share a revised timeline next week." },
  { level: 1, signal: "delay", input: "To ensure quality, we are rebaselining the migration plan and targeting a later go-live." },
  { level: 3, signal: "delay", input: "The feature slipped again and is no longer on track for the holiday release." },
  // Outsourcing
  { level: 2, signal: "outsourcing", input: "We are partnering with a trusted global provider to deliver Tier 1 support, and the current team's responsibilities will transition to the provider by June." },
  { level: 1, signal: "outsourcing", input: "We are opening a new global capability center in Hyderabad, and some engineering work will move there over the next two quarters." },
  { level: 3, signal: "outsourcing", input: "Payroll processing will be outsourced to a managed service provider starting in April." },
  // Shutdown or sunset
  { level: 2, signal: "shutdown", input: "After much reflection, we have decided to sunset the Lumen app on December 31. Existing customers can export their data until then." },
  { level: 3, signal: "shutdown", input: "We are winding down our hardware division and will cease production at the Austin plant." },
  { level: 1, signal: "shutdown", input: "The legacy API will be deprecated and will no longer be supported after June 30." },
  // Non-answers
  { level: 2, signal: "deflection", input: "Great question. We're still evaluating our options, and it's too early to say what that means for individual teams. We'll circle back when we have more to share." },
  { level: 3, signal: "deflection", input: "I can't get into specifics right now, but no decisions have been made." },
  { level: 1, signal: "deflection", input: "There are a lot of moving parts here, so let's take this offline." },
  // LinkedIn new chapter posts
  { level: 2, signal: "new-chapter", input: "After 6 amazing years at Northwind, today is my last day. I'm so grateful for the journey and excited for my next chapter! #OpenToWork" },
  { level: 1, signal: "new-chapter", also: ["layoffs"], label: "Laid off, new chapter post", input: "Some personal news: I was impacted by the layoffs at Fabrikam last week. I'm now open to new opportunities in product design." },
  { level: 3, signal: "new-chapter", input: "Excited to share that I'm starting a new chapter as Head of Growth at Contoso!" },
  // PIP
  { level: 2, signal: "pip", input: "This letter confirms that you are being placed on a 60-day performance improvement plan. Your recent work has not met expectations in the areas below." },
  { level: 3, signal: "pip", input: "Over the next 30 days, we'll check in weekly on the documented gaps in your deliverables." },
  { level: 1, signal: "pip", input: "Let's put a formal improvement plan in place so we can support your growth." },
  // Stack ranking
  { level: 2, signal: "stack-rank", input: "As part of calibration, managers will place the bottom 10% of performers into the lowest rating band." },
  { level: 1, signal: "stack-rank", input: "We are introducing a performance distribution to ensure we reward our top talent and address unregretted attrition." },
  { level: 3, signal: "stack-rank", input: "Ratings will follow a forced curve this cycle, and most people should expect a meets most expectations rating." },
  // Reorgs
  { level: 2, signal: "reorg", input: "Effective Monday, the Design and Research teams will be combined, and both will now report to Alex Kim." },
  { level: 1, signal: "reorg", input: "We're realigning our go-to-market organization around three new business units." },
  { level: 3, signal: "reorg", input: "To simplify our structure, we're moving to a new operating model with fewer layers of management." },
  // Older themes still work
  { level: 2, signal: "rto", input: "Starting January 5, all employees are expected to be in the office four days a week." },
  { level: 3, signal: "no-raises", input: "Given the uncertain macro environment, merit increases will be deferred until further notice." },
  // Nothing to find
  { level: 2, signal: "none", input: "The cafeteria will be closed on Friday for maintenance. Lunch will be served in the atrium." },
  { level: 1, signal: "fluff", input: "We are so grateful for this amazing team and proud of everything we've built together. Thank you for your passion!" },
];

// Normal to corporate. `keep` lists exact strings that must survive at every level and seed.
export const CORPORATE = [
  { level: 2, keep: ["3pm", "Dana", "Friday", "?"], input: "I won't make the 3pm meeting with Dana. Can we move it to Friday?" },
  { level: 3, keep: ["$4,500"], input: "I can't approve the $4,500 budget for the offsite." },
  { level: 2, input: "We will never ship this without tests." },
  { level: 1, keep: ["Q3", "Thursday", "?"], input: "Can you send me the Q3 numbers by Thursday?" },
  { level: 3, keep: ["Tuesday"], input: "No, I don't want to join the Tuesday call." },
  { level: 2, keep: ["12"], list: 3, input: "Before launch we need to:\n- fix the login bug\n- update the pricing page\n- email the 12 beta users" },
  { level: 3, keep: ["Monday", "1.", "2.", "3."], list: 3, input: "Agenda for Monday:\n1. budget review\n2. hiring plan\n3. questions" },
  { level: 1, input: "I'm not going to work this weekend." },
  { level: 3, keep: ["Priya", "Marcus"], input: "Priya and Marcus did a great job on the launch." },
  { level: 2, keep: ["yesterday"], input: "The server went down twice yesterday and nobody noticed." },
  { level: 3, keep: ["?"], input: "Why is the build broken again?" },
  { level: 2, input: "I don't think we should hire another contractor." },
  { level: 1, keep: ["Friday", "10am", "Monday", "?"], input: "Sorry, I can't do Friday at 10am. Does Monday work?" },
  { level: 3, keep: ["3"], input: "We lost 3 customers this month because of the outage." },
  { level: 2, input: "I need two more weeks to finish the report." },
  { level: 3, keep: ["Kevin"], input: "That's not my job, ask Kevin." },
  { level: 2, input: "I quit." },
  { level: 3, keep: ["8am"], input: "Stop scheduling meetings at 8am." },
  { level: 2, input: "The client hates the new logo and won't pay the invoice." },
  { level: 1, keep: ["October 15", "?"], input: "Is the deadline still October 15?" },
  { level: 3, keep: ["$20k", "$50k"], input: "Our budget is $20k, not $50k." },
  { level: 2, keep: ["today"], input: "I'm sick today and won't be online." },
  { level: 3, input: "Please don't reply-all to this email." },
  { level: 2, keep: ["?"], input: "Who approved this?" },
  { level: 3, keep: ["2"], input: "We missed the deadline by 2 days. It won't happen again." },
  { level: 2, keep: ["Friday", "10am"], list: 3, input: "- no more Friday deploys\n- no meetings before 10am\n- don't merge without review" },
  { level: 3, keep: ["3", "?"], input: "Can we talk about my raise? I haven't had one in 3 years." },
  { level: 1, input: "The vendor is late again and I'm annoyed." },
  { level: 2, input: "Thanks, but I'm not interested." },
  { level: 3, keep: ["?"], input: "I have no idea who owns this. Can someone tell me?" },
  { level: 2, keep: ["Mark", "API", "June"], input: "Mark said the API will not be ready until June." },
];
