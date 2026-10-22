// UI copy rules from the humanizer skill: no em or en dashes, no curly quotes, no ellipsis characters.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const files = ["index.html", "app.js", "engine.js", "phrasebook.js", "samples.js", "ai-prompts.js", "share.js", "config.js", "ai-worker.js", "styles.css"];

test("site files have no em dashes, en dashes, curly quotes or ellipsis characters", () => {
  for (const f of files) {
    const src = fs.readFileSync(new URL(`../site/${f}`, import.meta.url), "utf8");
    const bad = src.match(/[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]/);
    assert.equal(bad, null, `${f} contains ${bad && bad[0]}`);
  }
});

test("no analytics or third-party trackers in the page", () => {
  const html = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  assert.ok(!/googletagmanager|google-analytics|plausible|segment|gtag\(|fbq\(/i.test(html));
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(scripts.every((s) => s.startsWith("/")), `external script: ${scripts}`);
});

test("footer links to the four Freedom Terminal apps", () => {
  const html = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  for (const url of ["https://vishutdhar.github.io/runwalk-site/", "https://smarthomeqr.vishutdhar.com/", "https://dosepop.vishutdhar.com/", "https://habitflame.vishutdhar.com/"]) {
    assert.ok(html.includes(`href="${url}"`), url);
  }
  assert.ok(html.includes("A Freedom Terminal app"));
});
