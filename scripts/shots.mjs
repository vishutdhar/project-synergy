// Desktop and mobile screenshots for the redesign record.
// Usage: OUT=dir TAG=after BASE_URL=http://localhost:8787/ node scripts/shots.mjs
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL ?? "http://localhost:8787/";
const OUT = process.env.OUT ?? new URL("../preview/", import.meta.url).pathname;
const TAG = process.env.TAG ?? "after";
const MEMO = "We are making the difficult decision to right-size our organization to better align resources with our strategic priorities. This will allow us to unlock synergies and drive sustainable growth.";
const PLAIN = "I won't make the 3pm meeting with Dana. Can we move it to Friday?";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const views = [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]];
for (const [name, vp] of views) {
  for (const scheme of process.env.DARK ? ["light", "dark"] : ["light"]) {
    const suffix = scheme === "dark" ? "-dark" : "";
    const p = await browser.newPage();
    await p.setViewport(vp);
    await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    await p.goto(BASE, { waitUntil: "networkidle0" });
    await p.screenshot({ path: `${OUT}/${TAG}-${name}${suffix}-empty.png` });
    await p.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, PLAIN);
    await p.click("#run");
    await new Promise((r) => setTimeout(r, 300));
    await p.screenshot({ path: `${OUT}/${TAG}-${name}${suffix}-corporate.png`, fullPage: true });
    // Old layout has radio tabs, the new one has the swap button.
    if (await p.$("label[for=dir-normal]")) await p.click("label[for=dir-normal]");
    else {
      await p.$eval("#input", (el) => { el.value = ""; el.dispatchEvent(new Event("input")); });
      await p.click("#clear");
      await p.click("#swap");
    }
    await p.$eval("#input", (el, v) => { el.value = v; el.dispatchEvent(new Event("input")); }, MEMO);
    await p.click("#run");
    await new Promise((r) => setTimeout(r, 300));
    await p.screenshot({ path: `${OUT}/${TAG}-${name}${suffix}-decode.png`, fullPage: true });
    await p.close();
  }
}
await browser.close();
