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
const dir = (p) => p.$eval("#form", (f) => f.dataset.direction);
const setLevel = (p, v) => p.click(`label[for=level-${v}]`);
const toDirection = async (p, want) => {
  if ((await dir(p)) === want) return;
  await p.click("#clear");
  await p.click("#swap");
};

await check("page loads as Normal to Corporate with Middle Manager picked and an empty result", async () => {
  assert.match(await page.title(), /Project Synergy/);
  assert.equal(await text(page, "#run"), "Corporatize");
  assert.equal(await dir(page), "toCorporate");
  assert.deepEqual([await text(page, "#src-lang"), await text(page, "#dst-lang")], ["Normal", "Corporate"]);
  assert.equal(await page.$eval("#level-2", (el) => el.checked), true);
  assert.deepEqual(await page.$$eval(".chip-row label", (ls) => ls.map((l) => l.textContent.trim())), ["Mild", "Middle Manager", "Full C-Suite"]);
  assert.equal(await page.$eval("#empty", (el) => el.hidden), false);
  assert.equal(await page.$eval("#result-tools", (el) => el.hidden), true);
  // Engine choice lives in Settings, closed by default.
  assert.equal(await page.$eval("#settings", (el) => el.open), false);
  assert.equal(await text(page, "#engine-badge"), "Instant");
});

await check("desktop: input and result panes sit side by side", async () => {
  const [a, b] = await page.$$eval(".pane", (ps) => ps.map((p) => p.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y })));
  assert.ok(b.x > a.x + 300 && Math.abs(a.y - b.y) < 2, JSON.stringify([a, b]));
});

await check("example on load is a plain sentence that comes back in corporate speak", async () => {
  await page.click("#example");
  await page.waitForSelector(".corporate-out");
  const input = await page.$eval("#input", (el) => el.value);
  assert.match(input, /meeting/);
  assert.notEqual(await text(page, ".corporate-out"), input);
  assert.equal(await page.$eval("#empty", (el) => el.hidden), true);
});

await check("normal to corporate: type, Ctrl+Enter, level chips and reroll", async () => {
  await setLevel(page, 2);
  await page.click("#clear");
  await page.type("#input", "hey, i can't make the meeting, i'm swamped. this idea is dumb and we have no time");
  await page.keyboard.down("Control");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Control");
  await page.waitForSelector(".corporate-out");
  const first = await text(page, ".corporate-out");
  assert.match(first, /^[A-Z]/);
  assert.ok(!/ {2}/.test(first));
  const outs = new Set([first]);
  for (let i = 0; i < 4; i++) {
    await page.click("#reroll");
    outs.add(await text(page, ".corporate-out"));
  }
  assert.ok(outs.size >= 3, `reroll variety: ${outs.size}`);
  // Picking a chip re-runs right away.
  await setLevel(page, 3);
  await page.waitForFunction((f) => document.querySelector(".corporate-out").textContent !== f, {}, first);
  const top = await text(page, ".corporate-out");
  assert.ok(top.length > first.length * 0.9, top);
});

await check("won't stays a firm no, and numbers, names, dates and the question survive", async () => {
  await page.click("#clear");
  await page.type("#input", "I won't make the 3pm meeting with Dana. Can we move it to Friday?");
  for (const lvl of [1, 2, 3]) {
    await setLevel(page, lvl);
    await page.click("#run");
    const out = await text(page, ".corporate-out");
    assert.doesNotMatch(out, /rather not/);
    for (const k of ["3pm", "Dana", "Friday", "?"]) assert.ok(out.includes(k), `L${lvl} lost ${k}: ${out}`);
    assert.match(out, /won't|will not|will definitely not/);
  }
});

await check("lists keep one item per line", async () => {
  await page.click("#clear");
  await page.$eval("#input", (el) => { el.value = "Before launch we need to:\n- fix the login bug\n- update the pricing page\n- email the 12 beta users"; el.dispatchEvent(new Event("input")); });
  await setLevel(page, 3);
  await page.click("#run");
  const out = await page.$eval(".corporate-out", (el) => el.textContent);
  assert.equal(out.split("\n").filter((l) => /^- /.test(l)).length, 3, out);
  assert.match(out, /12/);
});

await page.screenshot({ path: shots + "desktop-corporate.png", fullPage: true });

await check("swap button flips the direction and translates the result back", async () => {
  await setLevel(page, 2);
  await page.click("#clear");
  await page.type("#input", "i can't make the meeting, i'm swamped");
  await page.click("#run");
  await page.waitForSelector(".corporate-out");
  const corporate = await text(page, ".corporate-out");
  assert.equal(await page.$eval("#swap", (b) => b.tagName), "BUTTON");
  assert.match(await page.$eval("#swap", (b) => b.getAttribute("aria-label")), /^Swap direction\. Now Normal to corporate/);
  // Keyboard: focus the button and press Enter.
  await page.focus("#swap");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".summary");
  assert.equal(await dir(page), "toNormal");
  assert.deepEqual([await text(page, "#src-lang"), await text(page, "#dst-lang")], ["Corporate", "Normal"]);
  assert.match(await text(page, "#dir-status"), /Corporate to normal/);
  assert.equal(await text(page, "#run"), "Decode");
  assert.equal(await page.$eval("#input", (el) => el.value), corporate);
  const plain = await page.$$eval("ol.decode li p", (ps) => ps.map((p) => p.textContent).join(" "));
  await page.click("#swap");
  await page.waitForSelector(".corporate-out");
  assert.equal(await dir(page), "toCorporate");
  assert.equal(await page.$eval("#input", (el) => el.value), plain);
});

await check("swap with no result only flips the direction", async () => {
  await page.click("#clear");
  await page.click("#swap");
  assert.equal(await dir(page), "toNormal");
  assert.equal(await page.$eval("#empty", (el) => el.hidden), false);
  await page.click("#swap");
  assert.equal(await dir(page), "toCorporate");
});

await check("example memo decodes with a Layoffs headline, and the summary leads with it", async () => {
  await toDirection(page, "toNormal");
  await setLevel(page, 2);
  await page.click("#example");
  await page.waitForSelector(".summary");
  assert.equal(await text(page, ".signal-label"), "Layoffs");
  assert.equal(await page.$eval(".signal", (el) => el.dataset.tone), "bad");
  assert.match(await text(page, ".summary"), /^What they really mean: We're laying people off/);
  const items = await page.$$eval("ol.decode li", (lis) => lis.length);
  assert.ok(items >= 8, `lines: ${items}`);
  assert.match(await page.$eval("#input", (el) => el.value), /Corvane/);
});

await page.screenshot({ path: shots + "desktop-decode.png", fullPage: true });

await check("signals: rejection, delay, PIP, outsourcing and a LinkedIn post get the right headline", async () => {
  const cases = [
    ["After careful consideration, we have decided to move forward with other candidates.", "It's a no"],
    ["Due to unforeseen dependencies, the launch has been moved to Q3.", "Delay"],
    ["You are being placed on a 60-day performance improvement plan.", "PIP"],
    ["Payroll processing will be outsourced to a managed service provider.", "Outsourcing"],
    ["After 6 amazing years at Northwind, today is my last day. Excited for my next chapter!", "New chapter post"],
    ["Great question. We're still evaluating our options and it's too early to say.", "Non-answer"],
    ["Unfortunately, your role has been eliminated. Your last day is Friday.", "You're being laid off"],
  ];
  for (const [memo, label] of cases) {
    await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, memo);
    await page.click("#run");
    assert.equal(await text(page, ".signal-label"), label, memo);
  }
});

await check("Blunt chip re-runs with blunt wording", async () => {
  const memo = await page.evaluate(async () => (await import("/samples.js")).MEMOS[0]);
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, memo);
  await page.click("#level-2");
  await page.click("#run");
  await page.waitForSelector(".summary");
  await page.focus("#level-2");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector("#level-3").checked);
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

await check("copy puts the signal and the full decode on the clipboard", async () => {
  await page.click("#copy");
  await page.waitForFunction(() => document.querySelector("#copy").textContent.trim() === "Copied");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(clip, /^Signal: Layoffs\nWhat they really mean: /);
  assert.match(clip, /\n= /);
});

await check("long paste shows the soft cap note and still decodes", async () => {
  const memo = await page.evaluate(async () => (await import("/samples.js")).MEMOS.join("\n\n"));
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, memo.repeat(12));
  assert.match(await text(page, "#cap-note"), /first 20,000 characters/);
  await page.click("#run");
  await page.waitForSelector(".summary");
  assert.match(await text(page, "#result-note"), /20,000/);
});

await check("empty input asks for text instead of running", async () => {
  await page.click("#clear");
  await page.click("#run");
  assert.match(await text(page, "#cap-note"), /Type or paste something first/);
});

await check("every button, chip and link in the app is at least 44px tall", async () => {
  await page.click("#settings summary");
  await page.$eval("#input", (el) => { el.value = "I quit."; el.dispatchEvent(new Event("input")); });
  await page.click("#run");
  const small = await page.$$eval("button:not([hidden]), .chip-row label, .settings summary, .choice, .site-footer a, .brand, a.btn", (els) =>
    els.filter((e) => e.offsetParent !== null).map((e) => ({ id: e.id || e.textContent.trim().slice(0, 20), h: e.getBoundingClientRect().height })).filter((x) => x.h < 44));
  assert.deepEqual(small, []);
  await page.click("#settings summary");
});

await check("AI consent dialog appears before any download, and Not now downloads nothing", async () => {
  const before = offsite.length;
  await page.click("#settings summary");
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
await check("keyboard: Tab reaches the swap button, level chips, settings, text box and the run button", async () => {
  const p = await browser.newPage();
  await p.goto(BASE, { waitUntil: "networkidle0" });
  const seen = [];
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => document.activeElement.id || document.activeElement.name || document.activeElement.tagName));
  }
  for (const id of ["swap", "level-2", "SUMMARY", "input", "run"]) assert.ok(seen.includes(id), `${id} not reachable: ${seen}`);
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
await check("mobile: the run button is on the first screen, before any scrolling", async () => {
  const r = await m.page.$eval("#run", (b) => { const x = b.getBoundingClientRect(); return { top: x.top, bottom: x.bottom, h: x.height, w: x.width }; });
  assert.ok(r.bottom <= 844 && r.h >= 44, JSON.stringify(r));
  assert.ok(r.w >= 300, `run button should be full width on mobile: ${r.w}`);
});
await check("mobile: panes stack, example decodes, and nothing overflows sideways", async () => {
  await m.page.click("#swap");
  await m.page.click("#example");
  await m.page.waitForSelector(".summary");
  const [a, b] = await m.page.$$eval(".pane", (ps) => ps.map((p) => p.getBoundingClientRect().y));
  assert.ok(b > a);
  const swapBox = await m.page.$eval("#swap", (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  assert.ok(swapBox.h >= 44 && swapBox.w >= 44, JSON.stringify(swapBox));
  const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
});
await m.page.screenshot({ path: shots + "mobile-decode.png", fullPage: true });
await m.page.evaluate(() => window.scrollTo(0, 0));
await m.page.screenshot({ path: shots + "mobile-top.png" });

// Dark mode screenshot
const d = await openPage({ width: 1280, height: 900 });
await d.page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
await d.page.click("#swap");
await d.page.click("#example");
await d.page.waitForSelector(".summary");
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
