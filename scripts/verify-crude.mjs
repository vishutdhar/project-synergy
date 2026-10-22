// Live check for crude input, Instant and AI mode, all three levels. Saves screenshots for the first two sentences.
// Usage: BASE_URL=... OUT=dir node scripts/verify-crude.mjs
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import { findCrude, lostIdioms } from "../site/profanity.js";
import { checkMeaning } from "../site/meaning.js";
import { CRUDE } from "../tests/crude-corpus.js";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const OUT = process.env.OUT ?? "/tmp/verify-crude/";
fs.mkdirSync(OUT, { recursive: true });
const SHOT = ["fuck all was done in that meeting", "the plan is to fuck off all day today"];
const OTHERS = [
  "We got fuck all done this sprint.", "Don't fuck this up, the board is watching.", "If the audit finds this we're fucked.",
  "Honestly, nobody gives a shit about the new logo.", "That's bullshit and you know it.", "Marketing did jack shit on the launch.",
  "He's full of shit about the timeline.", "I worked my ass off on this proposal.", "Stop bitching about the parking situation.",
  "Fuck it, let's ship it on Friday.", "The release shit the bed at 2am.", "Who gives a crap about synergy?",
];
const LEVEL_NAME = { 1: "mild", 2: "middle", 3: "csuite" };
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"], userDataDir: new URL("../.chrome-profile/", import.meta.url).pathname, protocolTimeout: 1_800_000 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.setCacheEnabled(false);
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "networkidle0" });

const setEngine = async (v) => {
  await page.click("#settings summary");
  await page.click(`input[name=engine][value=${v}]`);
  if (v === "ai") {
    if (await page.waitForSelector("dialog#consent[open]", { timeout: 4000 }).then(() => true, () => false)) await page.click("#consent-ok");
    await page.waitForFunction(() => /ready|couldn't start/.test(document.querySelector("#ai-status-text").textContent), { timeout: 1_500_000, polling: 1000 });
  }
  await page.click("#settings summary");
};
const run = async (text, level) => {
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, text);
  await page.$eval(`#level-${level}`, (el) => { el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.$eval("#output", (el) => el.replaceChildren());
  await page.click("#run");
  await page.waitForFunction(() => {
    const busy = document.querySelector("#run").getAttribute("aria-busy") === "true";
    const o = document.querySelector(".corporate-out");
    return !busy && o && o.textContent.trim() && !document.querySelector("#output .pending") && !/Rewriting with AI/.test(document.querySelector("#output").textContent);
  }, { timeout: 600_000, polling: 300 });
  return page.evaluate(() => ({
    out: document.querySelector(".corporate-out").textContent,
    engine: document.querySelector("#engine-used").hidden ? "" : document.querySelector("#engine-used").textContent,
    note: document.querySelector("#result-note").hidden ? "" : document.querySelector("#result-note").textContent,
  }));
};
const fails = [];
const lines = [];
for (const mode of ["instant", "ai"]) {
  await setEngine(mode);
  for (const text of [...SHOT, ...OTHERS]) for (const level of [1, 2, 3]) {
    const r = await run(text, level);
    const c = CRUDE.find((x) => x.in === text);
    const why = [];
    if (findCrude(r.out).length || findCrude(r.note).length) why.push("crude");
    if (!checkMeaning(text, r.out).ok) why.push("meaning");
    if (lostIdioms(text, r.out).length) why.push("idiom");
    if (c?.must && !c.must.test(r.out)) why.push("expected meaning missing");
    if (c?.mustNot && c.mustNot.test(r.out)) why.push("says the opposite");
    const line = `${mode.toUpperCase()} L${level} [${r.engine}] ${text} -> ${r.out}${r.note ? `  {note: ${r.note}}` : ""}${why.length ? `  FAIL(${why.join(", ")})` : ""}`;
    lines.push(line);
    console.log(line);
    if (why.length) fails.push(line);
    const i = SHOT.indexOf(text);
    if (i >= 0) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${OUT}${i === 0 ? "fuckall" : "fuckoff"}-${mode}-${level}-${LEVEL_NAME[level]}.png` });
    }
  }
}
fs.writeFileSync(`${OUT}results.txt`, lines.join("\n") + "\n");
console.log(`\n${lines.length} runs, ${fails.length} failed checks, page errors: ${errors.length ? errors.join(" | ") : "none"}`);
await browser.close();
process.exit(fails.length || errors.length ? 1 : 0);
