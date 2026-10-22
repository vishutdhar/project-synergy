// AI mode at every level in both directions, in headless Chrome. Prints each output.
// Usage: BASE_URL=... node scripts/e2e-ai-matrix.mjs [--webgpu]
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const webgpu = process.argv.includes("--webgpu");
const args = ["--no-sandbox"];
if (webgpu) args.push("--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-angle=swiftshader", "--use-webgpu-adapter=swiftshader");
const userDataDir = new URL(`../.chrome-profile${webgpu ? "-webgpu" : ""}/`, import.meta.url).pathname;
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args, userDataDir, protocolTimeout: 1_800_000 });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
// Skip the HTTP cache so a reused profile never runs stale app files. The model stays in Cache Storage.
await page.setCacheEnabled(false);
page.on("pageerror", (e) => console.log(`pageerror: ${e}`));
page.on("console", (m) => m.type() === "error" && console.log(`console: ${m.text()}`));
await page.goto(BASE, { waitUntil: "networkidle0" });
console.log(`backend: ${await page.$eval("#ai-desc", (e) => e.textContent)}`);
await page.click("#settings summary");
await page.click("input[name=engine][value=ai]");
if (await page.waitForSelector("dialog#consent[open]", { timeout: 5000 }).then(() => true, () => false)) {
  console.log(`consent: ${await page.$eval("#consent-tech", (e) => e.textContent)}`);
  await page.click("#consent-ok");
}
await page.waitForFunction(() => /ready|couldn't start/.test(document.querySelector("#ai-status-text").textContent), { timeout: 1_500_000, polling: 2000 });
const status = await page.$eval("#ai-status-text", (e) => e.textContent);
console.log(`status: ${status}`);
if (!/ready/.test(status)) process.exit(1);

const setLevel = (v) => page.$eval(`#level-${v}`, (el) => { el.checked = true; });
const levelName = () => page.$eval("input[name=level]:checked + label", (e) => e.textContent);
const runOnce = async (text) => {
  await page.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, text);
  const t0 = Date.now();
  await page.$eval("#output", (el) => el.replaceChildren());
  await page.click("#run");
  // Wait until a finished result is on screen and the run button is idle again.
  await page.waitForFunction(() => {
    const busy = document.querySelector("#run").getAttribute("aria-busy") === "true";
    const out = document.querySelector("#output");
    const done = out.querySelector(".corporate-out:not(:empty)") || out.querySelector(".summary");
    return !busy && done && !out.querySelector(".pending") && !/Rewriting with AI|Reading the memo/.test(out.textContent);
  }, { timeout: 1_200_000, polling: 500 });
  return { secs: ((Date.now() - t0) / 1000).toFixed(1), note: await page.$eval("#result-note", (e) => (e.hidden ? "" : e.textContent)) };
};

const corporateInputs = [
  "This idea is dumb and we have no time. I need help, honestly.",
  "i can't make the meeting, i'm swamped",
  "I won't make the 3pm meeting with Dana. Can we move it to Friday?",
];
for (const text of corporateInputs) {
  console.log(`\n### Normal to corporate: ${text}`);
  for (const level of [1, 2, 3]) {
    await setLevel(level);
    const r = await runOnce(text);
    const out = await page.$eval("#output", (e) => e.textContent);
    console.log(`${await levelName()} (${r.secs}s, ${await page.$eval("#engine-used", (e) => e.textContent)}): ${out}${r.note ? `  [note: ${r.note}]` : ""}`);
  }
}

const memo = "We are making the difficult decision to right-size our organization to better align resources with our strategic priorities. This will allow us to unlock synergies and drive sustainable growth.";
await page.click("#clear");
await page.click("#swap");
console.log(`\n### Corporate to normal: ${memo}`);
for (const level of [1, 2, 3]) {
  await setLevel(level);
  const r = await runOnce(memo);
  const out = await page.evaluate(() => ({
    summary: document.querySelector(".summary")?.textContent,
    lines: [...document.querySelectorAll("ol.decode li p")].map((p) => p.textContent),
  }));
  console.log(`${await levelName()} (${r.secs}s) [${await page.$eval(".signal-label", (e) => e.textContent)}]: ${out.summary}`);
  out.lines.forEach((l) => console.log(`   Means: ${l}`));
  if (r.note) console.log(`   [note: ${r.note}]`);
}
await browser.close();
