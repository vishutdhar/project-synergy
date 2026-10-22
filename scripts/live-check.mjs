// Live check of the deployed site in headless Chrome: Instant on 44 varied inputs across levels and both
// directions, compared with the local engine, plus AI mode on a few inputs.
// Usage: BASE_URL=https://project-synergy.pages.dev/ node scripts/live-check.mjs [--no-ai]
import puppeteer from "puppeteer-core";
import { toCorporateDetailed, toNormal } from "../site/engine.js";
import { aiCorporateGate } from "../site/faithful.js";
import { decodeTextFails } from "../site/ai-guard.js";
import { findCrude } from "../site/profanity.js";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const withAI = !process.argv.includes("--no-ai");
const userDataDir = new URL("../.chrome-profile/", import.meta.url).pathname;
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"], ...(withAI ? { userDataDir } : {}), protocolTimeout: 1_800_000 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.setCacheEnabled(false);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(BASE, { waitUntil: "networkidle0" });

const corp = [
  "lol ok", "on it", "running 15 minutes late", "can't make the 3pm with Dana, can we do Friday?", "i'm swamped this week",
  "this idea is dumb and we have no time", "our competitors are kicking our ass", "fuck all was done in that meeting",
  "the plan is to fuck off all day today", "my boss is such a hardass", "Kevin can go to hell", "who the hell scheduled this at 6am",
  "y'all the build is green", "ngl the new pricing is kinda sus", "thx for the help today ur the best 🙏", "srry wrong chat",
  "ok but why", "wow thanks for telling me at 4:55 on a friday", "blockers:\n- no test data\n- waiting on legal\n- Ravi is out sick",
  "options: a) ship friday b) slip a week", "we spent $12,400 on cloud last month, double what we planned",
  "I've been here 6 years and the new guy makes more than me. I'm not okay with this.", "stop cc'ing me on everything",
  "is there any way we can push the deadline", "nice catch on that bug", "the wifi is trash today", "finna grab lunch, want anything",
  "sure, I'll just work 3 jobs, no problem", "I'd love to help", "we're so cooked",
];
const dec = [
  "Per my last email, let's circle back offline and take this to the parking lot.",
  "We are making the difficult decision to right-size our organization to better align resources with our strategic priorities. This will allow us to unlock synergies and drive sustainable growth.",
  "Merit increases will be capped at 1% this cycle.",
  "The Austin office is moving to a new building.",
  "Just a friendly reminder that timesheets are due Friday.",
  "We will be leaving the Austin office as we move to a smaller footprint.",
  "Your recent performance has not met expectations in several key areas, which we have documented.",
  "We believe in-person collaboration is essential to our culture, so we're moving to four days a week in office.",
  "Hi all, I'm writing to let you know that Tomas will be leaving us at the end of the week.",
  "We're sunsetting the Atlas product line and redeploying the team to our core platform. Some roles will not continue.",
  "We remain deeply committed to our values of integrity, curiosity and care.",
  "Thanks for the pitch. It's not quite the right fit for our roadmap, but we'll keep it in mind.",
  "Spending is frozen through Q1, and we won't be filling open roles until it lifts.",
  "Today we're joining forces with Kestrel to create a combined company with greater scale.",
];

const dir = () => page.$eval("#form", (f) => f.dataset.direction);
const toDirection = async (want) => { if ((await dir()) !== want) { await page.click("#clear"); await page.click("#swap"); } };
const setLevel = (v) => page.$eval(`#level-${v}`, (el) => { el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); });
const run = async (text) => {
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, text);
  await page.$eval("#output", (el) => el.replaceChildren());
  await page.click("#run");
  await page.waitForFunction(() => {
    const busy = document.querySelector("#run").getAttribute("aria-busy") === "true";
    const out = document.querySelector("#output");
    const done = out.querySelector(".corporate-out:not(:empty)") || out.querySelector(".summary");
    return !busy && done && !out.querySelector(".pending") && !/Rewriting with AI|Reading the memo/.test(out.textContent);
  }, { timeout: 1_200_000, polling: 300 });
};

let pass = 0;
const fails = [];
const log = (ok, msg) => { console.log(`${ok ? "ok  " : "FAIL"} ${msg}`); ok ? pass++ : fails.push(msg); };

await toDirection("toCorporate");
for (const [i, text] of corp.entries()) {
  const level = (i % 3) + 1;
  await setLevel(level);
  await run(text);
  const got = await page.$eval(".corporate-out", (e) => e.textContent);
  const want = toCorporateDetailed(text, { level, seed: 1 }).text;
  log(got === want && !findCrude(got).length, `N>C L${level} ${JSON.stringify(text)} => ${JSON.stringify(got)}${got === want ? "" : ` (local: ${JSON.stringify(want)})`}`);
}
await toDirection("toNormal");
for (const [i, text] of dec.entries()) {
  const level = (i % 3) + 1;
  await setLevel(level);
  await run(text);
  const got = await page.$eval(".summary", (e) => e.textContent);
  const want = toNormal(text, { level, seed: 1 }).summary;
  log(got.includes(want), `C>N L${level} ${JSON.stringify(text.slice(0, 60))} => ${JSON.stringify(got)}`);
}

if (withAI) {
  await page.click("#settings summary");
  await page.click("input[name=engine][value=ai]");
  if (await page.waitForSelector("dialog#consent[open]", { timeout: 5000 }).then(() => true, () => false)) await page.click("#consent-ok");
  await page.waitForFunction(() => /ready|couldn't start/.test(document.querySelector("#ai-status-text").textContent), { timeout: 1_500_000, polling: 2000 });
  const status = await page.$eval("#ai-status-text", (e) => e.textContent);
  log(/ready/.test(status), `AI status: ${status}`);
  await toDirection("toCorporate");
  for (const [text, level] of [["i can't make the meeting, i'm swamped", 2], ["fuck all was done in that meeting", 1], ["the build is broken again", 3], ["recieved the contract, will reveiw tonite", 1], ["we lost the Hooli deal", 2], ["I need the numbers by Thursday", 3], ["the plan is to fuck off all day today", 2], ["is the 2pm still happening", 1], ["Ops fucked up the migration", 3], ["can you review my PR before lunch?", 2]]) {
    await setLevel(level);
    await run(text);
    const got = await page.$eval(".corporate-out", (e) => e.textContent);
    const engine = await page.$eval("#engine-used", (e) => e.textContent);
    const instant = toCorporateDetailed(text, { level, seed: 1 }).text;
    const ok = !findCrude(got).length && (/fallback/i.test(engine) ? got === instant : aiCorporateGate(text, got, { level }).ok);
    log(ok, `AI N>C L${level} ${JSON.stringify(text)} [${engine}] => ${JSON.stringify(got)}`);
  }
  await toDirection("toNormal");
  // AI decode: the summary comes from Instant mode, and every shown line passes the decode checks.
  for (const [text, level] of [[dec[1], 2], [dec[6], 3], [dec[9], 1], ["We are discontinuing the Basic plan. Existing customers will move to the Plus plan at the same price until renewal.", 2]]) {
    await setLevel(level);
    await run(text);
    const summary = await page.$eval(".summary", (e) => e.textContent);
    const lines = await page.$$eval("ol.decode li > p", (els) => els.map((e) => e.textContent));
    const want = toNormal(text, { level, seed: 1 });
    const badLine = lines.find((l, i) => findCrude(l).length || (l !== want.lines[i]?.plain && decodeTextFails(l, want.lines[i]?.original ?? text, want.themes)));
    log(summary.includes(want.summary) && !badLine, `AI C>N L${level} ${JSON.stringify(text.slice(0, 50))} => ${JSON.stringify(summary)}${badLine ? ` bad line ${JSON.stringify(badLine)}` : ""} (${lines.length} lines)`);
  }
}
log(errors.length === 0, `no page or console errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
console.log(`\n${pass} passed, ${fails.length} failed`);
await browser.close();
process.exit(fails.length ? 1 : 0);
