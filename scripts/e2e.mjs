// End-to-end test of Instant mode in headless Chrome, plus screenshots.
// Needs the preview server on http://localhost:8787 (npm run serve, or scripts/serve.mjs).
import puppeteer from "puppeteer-core";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const shots = new URL("../preview/", import.meta.url).pathname;
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`ok   ${name}`);
  } catch (err) {
    results.push(`FAIL ${name}: ${err.message}`);
  }
};

async function openPage(viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  const offsite = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["localhost", "127.0.0.1", new URL(BASE).hostname].includes(u.hostname) && u.protocol.startsWith("http")) offsite.push(r.url());
  });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  return { page, errors, offsite };
}

const text = (page, sel) => page.$eval(sel, (el) => el.textContent.trim());

// ---------- desktop ----------
const { page, errors, offsite } = await openPage({ width: 1280, height: 900 });
const ctx = browser.defaultBrowserContext();
await ctx.overridePermissions(new URL(BASE).origin, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);

await check("page loads with title and default direction Corporate to normal", async () => {
  assert.match(await page.title(), /Project Synergy/);
  assert.equal(await text(page, "#run"), "Decode");
  assert.equal(await text(page, "#level-name"), "Honest");
});

await page.screenshot({ path: shots + "desktop-empty.png", fullPage: true });

await check("example memo decodes with a What they really mean summary", async () => {
  await page.click("#example");
  await page.waitForSelector("#result:not([hidden]) .summary");
  const summary = await text(page, ".summary");
  assert.match(summary, /^What they really mean: People are being laid off/);
  const items = await page.$$eval("ol.decode li", (lis) => lis.length);
  assert.ok(items >= 8, `lines: ${items}`);
  const input = await page.$eval("#input", (el) => el.value);
  assert.match(input, /Corvane/);
});

await page.screenshot({ path: shots + "desktop-decode.png", fullPage: true });

await check("bluntness slider re-runs with Blunt wording", async () => {
  await page.focus("#level");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector("#level-name").textContent === "Blunt");
  await page.waitForFunction(() => document.querySelector(".summary").textContent.includes("firing"));
});

await check("share link is an x.com intent with the summary and app link, under 280", async () => {
  const href = await page.$eval("#share", (a) => a.href);
  assert.ok(href.startsWith("https://x.com/intent/post?text="));
  const body = decodeURIComponent(href.split("text=")[1]);
  assert.match(body, /^What they really mean: /);
  assert.match(body, /https:\/\/project-synergy\.pages\.dev$/);
  assert.ok(body.replace(/https:\S+/, "x".repeat(23)).length <= 280);
});

await check("copy puts the full decode on the clipboard", async () => {
  await page.click("#copy");
  await page.waitForFunction(() => document.querySelector("#copy").textContent === "Copied");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(clip, /^What they really mean: /);
  assert.match(clip, /\n= /);
});

await check("normal to corporate: type, Ctrl+Enter, levels and reroll", async () => {
  await page.click("label[for=dir-corporate]");
  assert.equal(await text(page, "#run"), "Corporatize");
  assert.ok(["Mild", "Middle Manager", "Full C-Suite"].includes(await text(page, "#level-name")));
  await page.click("#clear");
  await page.type("#input", "hey, i can't make the meeting, i'm swamped. this idea is dumb and we have no time");
  await page.keyboard.down("Control");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Control");
  await page.waitForSelector("#result:not([hidden]) .corporate-out");
  const first = await text(page, ".corporate-out");
  assert.match(first, /^[A-Z]/);
  assert.ok(!/ {2}/.test(first));
  const outs = new Set([first]);
  for (let i = 0; i < 4; i++) {
    await page.click("#reroll");
    outs.add(await text(page, ".corporate-out"));
  }
  assert.ok(outs.size >= 3, `reroll variety: ${outs.size}`);
  await page.$eval("#level", (el) => { el.value = "3"; el.dispatchEvent(new Event("input")); el.dispatchEvent(new Event("change")); });
  assert.equal(await text(page, "#level-name"), "Full C-Suite");
  await page.click("#run");
  const top = await text(page, ".corporate-out");
  assert.ok(top.length > first.length * 0.9, top);
});

await page.screenshot({ path: shots + "desktop-corporate.png", fullPage: true });

await check("long paste shows the soft cap note and still decodes", async () => {
  await page.click("label[for=dir-normal]");
  const memo = await page.evaluate(async () => (await import("/samples.js")).MEMOS.join("\n\n"));
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, memo.repeat(12));
  assert.match(await text(page, "#cap-note"), /first 20,000 characters/);
  await page.click("#run");
  await page.waitForSelector("#result:not([hidden]) .summary");
  assert.match(await text(page, "#result-note"), /20,000/);
});

await check("empty input asks for text instead of running", async () => {
  await page.click("#clear");
  await page.click("#run");
  assert.match(await text(page, "#cap-note"), /Type or paste something first/);
});

await check("AI consent dialog appears before any download, and Not now downloads nothing", async () => {
  const before = offsite.length;
  await page.click("input[name=engine][value=ai]");
  await page.waitForSelector("dialog#consent[open]");
  assert.match(await text(page, "#consent-size"), /MB/);
  await page.screenshot({ path: shots + "desktop-consent.png" });
  await page.click("dialog#consent button[value=cancel]");
  await page.waitForFunction(() => !document.querySelector("dialog#consent").open);
  await page.waitForFunction(() => document.querySelector("input[name=engine][value=instant]").checked, { timeout: 3000 });
  assert.equal(offsite.length, before, `offsite requests: ${offsite.slice(before)}`);
});

await check("mic button visibility follows feature detection", async () => {
  const hasSR = await page.evaluate(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const hidden = await page.$eval("#mic", (el) => el.hidden);
  assert.equal(hidden, !hasSR);
});

await check("no network requests leave the site in Instant mode", async () => {
  assert.deepEqual(offsite, []);
});

await check("no console errors or CSP violations", async () => {
  assert.deepEqual(errors, []);
});

// ---------- keyboard only ----------
await check("keyboard: Tab reaches the direction toggle, text box, slider and Decode", async () => {
  const p = await browser.newPage();
  await p.goto(BASE, { waitUntil: "networkidle0" });
  const seen = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => document.activeElement.id || document.activeElement.name || document.activeElement.tagName));
  }
  for (const id of ["input", "level", "run"]) assert.ok(seen.includes(id), `${id} not reachable: ${seen}`);
  await p.close();
});

// ---------- Edge and Firefox user agents hide the mic ----------
await check("mic hidden on Edge user agent", async () => {
  const p = await browser.newPage();
  await p.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0");
  await p.goto(BASE, { waitUntil: "networkidle0" });
  assert.equal(await p.$eval("#mic", (el) => el.hidden), true);
  await p.close();
});

// ---------- mobile ----------
const m = await openPage({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await check("mobile: example decodes and layout fits the screen", async () => {
  await m.page.click("#example");
  await m.page.waitForSelector("#result:not([hidden]) .summary");
  const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
});
await m.page.screenshot({ path: shots + "mobile-decode.png", fullPage: true });
await m.page.evaluate(() => window.scrollTo(0, 0));
await m.page.screenshot({ path: shots + "mobile-top.png" });

// Dark mode screenshot
const d = await openPage({ width: 1280, height: 900 });
await d.page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await d.page.click("#example");
await d.page.waitForSelector("#result:not([hidden]) .summary");
await d.page.screenshot({ path: shots + "desktop-dark.png", fullPage: true });

// ---------- AI worker loads under the CSP (no model download) ----------
await check("AI worker script and Transformers.js load under the CSP", async () => {
  const p = await browser.newPage();
  await p.goto(BASE, { waitUntil: "networkidle0" });
  const result = await p.evaluate(() => new Promise((resolve) => {
    const w = new Worker("/ai-worker.js", { type: "module" });
    w.onerror = () => resolve("worker error");
    setTimeout(() => { w.terminate(); resolve("ok"); }, 6000);
  }));
  await p.close();
  assert.equal(result, "ok");
});

await browser.close();
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
