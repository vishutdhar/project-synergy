// WCAG AA contrast for the color tokens in styles.css, in light and dark mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../site/styles.css", import.meta.url), "utf8");
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
}
const light = tokens(css.slice(css.indexOf(":root {"), css.indexOf("@media (prefers-color-scheme: dark)")));
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const dark = { ...light, ...tokens(css.slice(darkStart, css.indexOf("/* ---------- Base", darkStart))) };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [foreground, background, minimum]. 4.5 for text, 3 for borders, focus rings and large text.
const PAIRS = [
  ["ink", "bg", 4.5], ["ink", "surface", 4.5], ["ink", "surface-2", 4.5],
  ["muted", "bg", 4.5], ["muted", "surface", 4.5], ["muted", "surface-2", 4.5],
  ["accent", "surface", 4.5], ["accent", "bg", 4.5], ["accent", "accent-soft", 4.5], ["accent-ink", "accent", 4.5], ["accent-ink", "accent-hover", 4.5],
  ["ink", "accent-soft", 4.5],
  ["bad", "bad-soft", 4.5], ["warn", "warn-soft", 4.5], ["good", "good-soft", 4.5], ["ink", "bad-soft", 4.5], ["ink", "warn-soft", 4.5],
  ["warn", "surface", 4.5],
  ["x-ink", "x-bg", 4.5],
  ["line-strong", "surface", 3], ["line-strong", "bg", 3], ["line-strong", "surface-2", 3],
  ["focus", "surface", 3], ["focus", "bg", 3], ["focus", "surface-2", 3],
];

for (const [mode, t] of [["light", light], ["dark", dark]]) {
  test(`contrast meets WCAG AA in ${mode} mode`, () => {
    for (const [fg, bg, min] of PAIRS) {
      assert.ok(t[fg] && t[bg], `missing token ${fg} or ${bg}`);
      const r = ratio(t[fg], t[bg]);
      assert.ok(r >= min, `${mode}: --${fg} ${t[fg]} on --${bg} ${t[bg]} is ${r.toFixed(2)}, needs ${min}`);
    }
  });
}

test("type scale and tap target tokens exist", () => {
  for (const name of ["fs-xs", "fs-sm", "fs-md", "fs-lg", "fs-xl", "fs-2xl"]) assert.match(css, new RegExp(`--${name}:\\s*[\\d.]+rem`));
  assert.match(css, /--tap:\s*44px/);
});
