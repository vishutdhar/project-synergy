import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseEngine, detectBrowser, micErrorMessage, toMono16k, cleanTranscript, appendTranscript, SPEECH_FALLBACK_ERRORS } from "../site/dictation.js";

const BRAVE_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const rec = { mediaDevices: { getUserMedia() {} } };
const win = { webkitSpeechRecognition: function () {}, MediaRecorder: function () {}, AudioContext: function () {} };

test("Brave on a Mac gets on-device dictation even though it exposes the speech API", () => {
  const b = detectBrowser({ userAgent: BRAVE_UA, brave: { isBrave: async () => true }, ...rec }, win);
  assert.equal(b.hasSpeech, true);
  assert.equal(b.isBrave, true);
  assert.equal(chooseEngine(b), "local");
});

test("Chrome and Safari keep the browser speech service", () => {
  assert.equal(chooseEngine(detectBrowser({ userAgent: BRAVE_UA, ...rec }, win)), "speech");
});

test("Firefox and Edge use on-device dictation, and no mic support hides the button", () => {
  assert.equal(chooseEngine(detectBrowser({ userAgent: "Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/131.0", ...rec }, { MediaRecorder() {}, AudioContext() {} })), "local");
  assert.equal(chooseEngine(detectBrowser({ userAgent: BRAVE_UA + " Edg/141.0", ...rec }, win)), "local");
  assert.equal(chooseEngine(detectBrowser({ userAgent: "old" }, {})), null);
});

test("the speech errors Brave gives switch to on-device, but a user's no does not", () => {
  assert.ok(SPEECH_FALLBACK_ERRORS.has("network"));
  assert.ok(!SPEECH_FALLBACK_ERRORS.has("not-allowed"));
});

test("mic errors get clear messages", () => {
  assert.match(micErrorMessage({ name: "NotAllowedError" }), /Microphone access is blocked/);
  assert.match(micErrorMessage("not-allowed"), /Microphone access is blocked/);
  assert.match(micErrorMessage({ name: "NotFoundError" }), /No microphone/);
  assert.match(micErrorMessage({ name: "NotReadableError" }), /busy/);
  assert.match(micErrorMessage("no-speech"), /didn't catch/);
  assert.match(micErrorMessage({ name: "model" }), /couldn't download/);
  assert.match(micErrorMessage({ name: "Weird" }), /You can still type/);
});

test("audio is mixed to mono and resampled to 16 kHz", () => {
  const n = 48000;
  const l = new Float32Array(n).fill(0.5), r = new Float32Array(n).fill(-0.1);
  const out = toMono16k([l, r], 48000);
  assert.equal(out.length, 16000);
  assert.ok(Math.abs(out[100] - 0.2) < 1e-6);
  assert.equal(toMono16k([new Float32Array(160)], 16000).length, 160);
  assert.equal(toMono16k([], 44100).length, 0);
});

test("Whisper's noise tags never reach the text box", () => {
  assert.equal(cleanTranscript(" [BLANK_AUDIO] "), "");
  assert.equal(cleanTranscript("(music) I can't make it."), "I can't make it.");
  assert.equal(appendTranscript("Hi team.  ", " I'm swamped."), "Hi team. I'm swamped.");
  assert.equal(appendTranscript("", "Hello"), "Hello");
  assert.equal(appendTranscript("Keep", "[BLANK_AUDIO]"), "Keep");
});
