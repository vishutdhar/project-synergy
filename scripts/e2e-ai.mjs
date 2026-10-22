// AI mode test in headless Chrome: consent, download with progress, load, decode, corporate rewrite.
// Usage: node scripts/e2e-ai.mjs [--webgpu-swiftshader]
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const shots = new URL("../preview/", import.meta.url).pathname;
const swiftshader = process.argv.includes("--webgpu-swiftshader");
const args = ["--no-sandbox"];
if (swiftshader) args.push("--enable-unsafe-webgpu", "--use-angle=swiftshader", "--use-webgpu-adapter=swiftshader");
const userDataDir = new URL("../.chrome-profile/", import.meta.url).pathname; // keeps the model cache between runs
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args, userDataDir, protocolTimeout: 1_800_000 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const log = [];
const hosts = new Set();
const say = (s) => { const line = `[${new Date().toISOString().slice(11, 19)}Z] ${s}`; log.push(line); console.log(line); };
page.on("console", (m) => (m.type() === "error" || m.type() === "warn") && say(`console.${m.type()}: ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => say(`pageerror: ${e}`));
page.on("request", (r) => hosts.add(new URL(r.url()).host));
page.on("workercreated", (w) => say(`worker created: ${w.url().slice(0, 80)}`));

await page.goto(BASE, { waitUntil: "networkidle0" });
say(`backend guess: ${await page.evaluate(() => document.querySelector("#ai-desc").textContent)}`);
await page.click("input[name=engine][value=ai]");
const dialogShown = await page.waitForSelector("dialog#consent[open]", { timeout: 5000 }).then(() => true, () => false);
say(`consent dialog shown: ${dialogShown}${dialogShown ? `, size: ${await page.$eval("#consent-size", (e) => e.textContent)}, tech: ${await page.$eval("#consent-tech", (e) => e.textContent)}` : " (model already cached)"}`);
const hostsBeforeConsent = [...hosts];
if (dialogShown) await page.click("#consent-ok");

const t0 = Date.now();
let shotTaken = false;
let last = "";
for (;;) {
  const status = await page.$eval("#ai-status-text", (e) => e.textContent);
  if (status !== last && (!status.startsWith("Downloading") || Date.now() % 15 === 0)) say(`status: ${status}`);
  last = status;
  if (!shotTaken && /Downloading the model: [1-9]\d\d/.test(status)) {
    await page.screenshot({ path: shots + "ai-downloading.png" });
    shotTaken = true;
  }
  if (/ready|couldn't start/.test(status)) break;
  if (Date.now() - t0 > 25 * 60_000) { say("timed out waiting for the model"); break; }
  await new Promise((r) => setTimeout(r, 2000));
}
say(`load finished after ${((Date.now() - t0) / 1000).toFixed(0)}s: ${await page.$eval("#ai-status-text", (e) => e.textContent)}`);
await page.screenshot({ path: shots + "ai-ready.png" });

const ready = /ready/.test(await page.$eval("#ai-status-text", (e) => e.textContent));
const outputs = {};
if (ready) {
  await page.click("label[for=dir-normal]");
  for (const [i, name] of [[0, "layoff"], [2, "record-year"]]) {
    await page.evaluate(async (i) => {
      const { MEMOS } = await import("/samples.js");
      const el = document.querySelector("#input");
      el.value = MEMOS[i];
      el.dispatchEvent(new Event("input"));
    }, i);
    const t1 = Date.now();
    await page.click("#run");
    await page.waitForFunction(() => document.querySelector("#run").getAttribute("aria-busy") === "false", { timeout: 1_200_000 });
    const out = await page.evaluate(() => ({
      summary: document.querySelector(".summary")?.textContent,
      lines: [...document.querySelectorAll("ol.decode li")].map((li) => ({ original: li.querySelector("blockquote").textContent, plain: li.querySelector("p").textContent })),
      note: document.querySelector("#result-note").hidden ? "" : document.querySelector("#result-note").textContent,
    }));
    out.seconds = ((Date.now() - t1) / 1000).toFixed(1);
    outputs[name] = out;
    say(`${name}: ${out.seconds}s, summary: ${out.summary}, note: ${out.note}`);
    await page.screenshot({ path: shots + `ai-decode-${name}.png`, fullPage: true });
  }
  await page.click("label[for=dir-corporate]");
  await page.$eval("#input", (el) => { el.value = "I can't make the meeting, I'm swamped. This plan is bad."; el.dispatchEvent(new Event("input")); });
  const t2 = Date.now();
  await page.click("#run");
  await page.waitForFunction(() => document.querySelector("#run").getAttribute("aria-busy") === "false", { timeout: 600_000 });
  outputs.corporate = { text: await page.$eval(".corporate-out", (e) => e.textContent), seconds: ((Date.now() - t2) / 1000).toFixed(1) };
  say(`corporate: ${outputs.corporate.seconds}s: ${outputs.corporate.text}`);
}
const cache = await page.evaluate(async () => {
  const c = await caches.open("transformers-cache");
  return (await c.keys()).map((r) => r.url);
});
say(`hosts contacted before consent: ${hostsBeforeConsent.join(", ")}`);
say(`hosts contacted overall: ${[...hosts].join(", ")}`);
say(`transformers-cache entries: ${cache.join(", ")}`);
fs.writeFileSync(shots + `ai-browser-test${swiftshader ? "-webgpu-swiftshader" : ""}.json`, JSON.stringify({ log, outputs, cache, hosts: [...hosts] }, null, 2));
await browser.close();
