// Dictation end to end test with a fake microphone that plays tests/fixtures/dictation-sample.wav.
// Covers Brave (on-device Whisper), a speech service that fails with "network", a blocked mic and no mic.
// Usage: BASE_URL=... node scripts/e2e-dictation.mjs   (first run downloads the speech model, about 80 MB)
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const wav = new URL("../tests/fixtures/dictation-sample.wav", import.meta.url).pathname;
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  userDataDir: new URL("../.chrome-profile-dictation/", import.meta.url).pathname,
  args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-audio-capture=${wav}`, "--autoplay-policy=no-user-gesture-required"],
  protocolTimeout: 900_000,
});
let passed = 0, failed = 0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
};
const open = async (setup) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCacheEnabled(false);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  if (setup) await page.evaluateOnNewDocument(setup);
  await page.goto(BASE, { waitUntil: "networkidle0" });
  return { page, errors };
};
const note = (page) => page.$eval("#mic-note", (e) => (e.hidden ? "" : e.textContent));
const BRAVE = () => { Object.defineProperty(navigator, "brave", { value: { isBrave: async () => true } }); };

async function dictate(page, shot) {
  const before = await page.$eval("#input", (e) => e.value);
  await page.click("#mic");
  if (await page.waitForSelector("dialog#dictation-consent[open]", { timeout: 3000 }).then(() => true, () => false)) await page.click("#dictation-ok");
  await page.waitForFunction(() => /Listening/.test(document.querySelector("#mic-note").textContent), { timeout: 15000 });
  assert.equal(await page.$eval("#mic", (e) => e.getAttribute("aria-pressed")), "true");
  if (shot) await page.screenshot({ path: `${shot}-listening.png` });
  await new Promise((r) => setTimeout(r, 4500));
  await page.click("#mic");
  await page.waitForFunction(() => /Transcribing|Downloading/.test(document.querySelector("#mic-note").textContent), { timeout: 10000 });
  if (shot) await page.screenshot({ path: `${shot}-transcribing.png` });
  await page.waitForFunction((b) => document.querySelector("#input").value !== b || document.querySelector("#mic-note").classList.contains("callout"), { timeout: 600_000, polling: 500 }, before);
  if (shot) await page.screenshot({ path: `${shot}-done.png` });
  return page.$eval("#input", (e) => e.value);
}

const SHOTS = process.env.SHOTS ?? "";

await check("Brave: the mic records and transcribes on the device", async () => {
  const { page, errors } = await open(BRAVE);
  assert.equal(await page.$eval("#mic", (e) => e.hidden), false, "mic button hidden");
  const text = await dictate(page, SHOTS && `${SHOTS}brave`);
  assert.match(text, /make the meeting/i, `transcript: ${text} / note: ${await note(page)}`);
  assert.equal(await note(page), "");
  assert.deepEqual(errors, []);
  console.log(`     transcript: ${text}`);
  await page.close();
});

await check("a speech service that fails with \"network\" switches to on-device dictation", async () => {
  const { page, errors } = await open(() => {
    // What Brave does: the API is there, but start() fails with "network".
    window.SpeechRecognition = window.webkitSpeechRecognition = class {
      start() { setTimeout(() => { this.onerror?.({ error: "network" }); this.onend?.(); }, 50); }
      stop() {}
    };
  });
  await page.$eval("#input", (el) => { el.value = "Kept text."; el.dispatchEvent(new Event("input")); });
  const text = await dictate(page);
  assert.match(text, /^Kept text\. .*meeting/i, text);
  assert.deepEqual(errors, []);
  await page.close();
});

await check("a blocked mic says so", async () => {
  const { page } = await open(() => {
    Object.defineProperty(navigator, "brave", { value: { isBrave: async () => true } });
    localStorage.setItem("synergy.whisper", "ok");
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });
  await page.click("#mic");
  await page.waitForFunction(() => document.querySelector("#mic-note").classList.contains("callout"), { timeout: 10000 });
  assert.match(await note(page), /Microphone access is blocked/);
  assert.equal(await page.$eval("#mic", (e) => e.getAttribute("aria-pressed")), "false");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}blocked.png` });
  await page.close();
});

await check("no microphone says so", async () => {
  const { page } = await open(() => {
    Object.defineProperty(navigator, "brave", { value: { isBrave: async () => true } });
    localStorage.setItem("synergy.whisper", "ok");
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("Requested device not found", "NotFoundError"));
  });
  await page.click("#mic");
  await page.waitForFunction(() => document.querySelector("#mic-note").classList.contains("callout"), { timeout: 10000 });
  assert.match(await note(page), /No microphone/);
  await page.close();
});

await check("saying no to the download leaves the mic off", async () => {
  const { page } = await open(BRAVE);
  await page.evaluate(() => localStorage.removeItem("synergy.whisper"));
  await page.click("#mic");
  await page.waitForSelector("dialog#dictation-consent[open]", { timeout: 3000 });
  await page.click("#dictation-consent button[value=cancel]");
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await page.$eval("#mic", (e) => e.getAttribute("aria-pressed")), "false");
  assert.equal(await note(page), "");
  await page.close();
});

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
