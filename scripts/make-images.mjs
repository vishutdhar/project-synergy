// Renders favicon PNGs and the Open Graph image with headless Chrome.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const site = new URL("../site/", import.meta.url).pathname;
const svg = fs.readFileSync(site + "favicon.svg", "utf8");
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const page = await browser.newPage();

for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
  await page.setViewport({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({ path: site + name, omitBackground: true });
}

await page.setViewport({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><style>
  body{margin:0;width:1200px;height:630px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
    background:#14213d;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 80px;box-sizing:border-box}
  .brand{display:flex;align-items:center;gap:20px;font-size:40px;font-weight:800}
  .brand svg{width:84px;height:84px}
  .sub{font-size:26px;color:#c9d3f5;margin-top:4px;font-weight:500}
  .quote{margin-top:48px;font-size:30px;color:#c9d3f5}
  .mean{margin-top:18px;font-size:46px;font-weight:800;background:#2346d8;padding:22px 28px;border-radius:18px;display:inline-block}
  .mean b{color:#fca311}
</style>
<div class="brand">${svg}<div>Project Synergy<div class="sub">Corporate Speak Translator</div></div></div>
<div class="quote">"We have made the decision to pause merit increases this cycle."</div>
<div><div class="mean"><b>What they really mean:</b> No raises.</div></div>`);
await page.screenshot({ path: site + "og-image.png" });
await browser.close();
console.log("images written");
