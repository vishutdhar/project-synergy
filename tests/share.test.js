import { test } from "node:test";
import assert from "node:assert/strict";
import { truncateForX, xIntentUrl, X_LIMIT, X_LINK_LENGTH } from "../site/share.js";

const weighted = (text) => text.replace(/https?:\/\/\S+/g, "x".repeat(X_LINK_LENGTH)).length;

test("short text is left alone and gets the link", () => {
  assert.equal(truncateForX("Hello", "https://synergy.example"), "Hello\nhttps://synergy.example");
});

test("long text is cut on a word boundary with three periods and fits 280", () => {
  const long = "synergy ".repeat(100);
  const out = truncateForX(long, "https://synergy.freedom-terminal.com");
  assert.ok(weighted(out) <= X_LIMIT, `weighted length ${weighted(out)}`);
  assert.match(out, /\.\.\.\nhttps/);
  assert.ok(!out.includes("\u2026"));
});

test("works without a link", () => {
  const out = truncateForX("a ".repeat(400), "");
  assert.ok(out.length <= X_LIMIT);
});

test("intent URL is x.com/intent/post with encoded text", () => {
  const url = xIntentUrl("What they really mean: No raises.", "https://s.example");
  assert.ok(url.startsWith("https://x.com/intent/post?text="));
  assert.equal(decodeURIComponent(url.split("text=")[1]), "What they really mean: No raises.\nhttps://s.example");
});
