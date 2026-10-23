import { toCorporateDetailed, toNormal, formatDecode, applySoftCap, LEVELS } from "./engine.js";
import { describeProblems } from "./meaning.js";
import { hasCrude, cleanCrude } from "./profanity.js";
import { aiCorporateGate } from "./faithful.js";
import { chooseEngine, detectBrowser, micErrorMessage, toMono16k, appendTranscript, SPEECH_FALLBACK_ERRORS, MAX_SECONDS } from "./dictation.js";
import { xIntentUrl } from "./share.js";
import { CONFIG } from "./config.js";
import { MEMOS, PLAIN } from "./samples.js";
import { MODEL_ID } from "./ai-prompts.js";

const $ = (id) => document.getElementById(id);
const els = {
  form: $("form"), input: $("input"), inputLabel: $("input-label"), lede: $("lede"), count: $("count"), capNote: $("cap-note"),
  levelLabel: $("level-label"), ticks: [1, 2, 3].map((i) => $(`tick-${i}`)), srcLang: $("src-lang"), dstLang: $("dst-lang"), dirStatus: $("dir-status"),
  run: $("run"), reroll: $("reroll"), example: $("example"), clear: $("clear"), mic: $("mic"), micNote: $("mic-note"), dictConsent: $("dictation-consent"), dictSize: $("dictation-size"),
  result: $("result"), resultTitle: $("result-title"), empty: $("empty"), resultTools: $("result-tools"), engineUsed: $("engine-used"),
  swap: $("swap"), output: $("output"), resultNote: $("result-note"), copy: $("copy"), copyText: $("copy-text"), share: $("share"),
  settings: $("settings"), engineBadge: $("engine-badge"),
  aiStatus: $("ai-status"), aiProgress: $("ai-progress"), aiStatusText: $("ai-status-text"), aiDesc: $("ai-desc"),
  consent: $("consent"), consentSize: $("consent-size"), consentTech: $("consent-tech"),
};

const state = {
  direction: "toCorporate",
  seed: 1,
  last: null, // { direction, text, level, plain (copy text), shareText }
  exampleIndex: { toNormal: 0, toCorporate: 0 },
  linesOpen: true,
  ai: { status: "off", worker: null, backend: null, pending: new Map(), nextId: 1 },
};

const COPY = {
  toNormal: {
    lede: "Paste a memo or a LinkedIn post. See the bad news first.",
    src: "Corporate", dst: "Normal",
    label: "Corporate text",
    resultTitle: "What it really means",
    empty: "The bad news, if there is any, shows up here.",
    placeholder: "Paste a CEO memo, a LinkedIn post or an all-hands email.",
    run: "Decode",
    levelLabel: "Bluntness",
  },
  toCorporate: {
    lede: "Type what you mean. Get it back in fluent corporate.",
    src: "Normal", dst: "Corporate",
    label: "What you really mean",
    resultTitle: "In corporate",
    empty: "Your rewrite shows up here.",
    placeholder: "Type or dictate something blunt, like: I can't make the meeting, I'm swamped.",
    run: "Corporatize",
    levelLabel: "How corporate",
  },
};

// ---------- direction, level, counter ----------

function setDirection(dir) {
  state.direction = dir;
  const c = COPY[dir];
  els.form.dataset.direction = dir;
  els.lede.textContent = c.lede;
  els.srcLang.textContent = c.src;
  els.dstLang.textContent = c.dst;
  els.dirStatus.textContent = `Now: ${c.src} to ${c.dst.toLowerCase()}.`;
  els.swap.setAttribute("aria-label", `Swap direction. Now ${c.src} to ${c.dst.toLowerCase()}.`);
  els.inputLabel.textContent = c.label;
  els.resultTitle.textContent = c.resultTitle;
  els.empty.textContent = c.empty;
  els.input.placeholder = c.placeholder;
  els.run.textContent = c.run;
  els.levelLabel.textContent = c.levelLabel;
  LEVELS[dir].forEach((name, i) => (els.ticks[i].textContent = name));
  els.reroll.disabled = true;
}

const getLevel = () => Number(els.form.elements.level.value || 3);

function updateCount() {
  const n = els.input.value.length;
  els.count.textContent = `${n.toLocaleString()} ${n === 1 ? "character" : "characters"}`;
  if (n > CONFIG.softCap) {
    els.capNote.hidden = false;
    els.capNote.textContent = `That's a long one. Only the first ${CONFIG.softCap.toLocaleString()} characters get translated.`;
  } else {
    els.capNote.hidden = true;
  }
}

// ---------- rendering ----------

function renderSignal(signal) {
  const box = document.createElement("p");
  box.className = "signal";
  box.dataset.tone = signal?.tone ?? "none";
  const kicker = document.createElement("span");
  kicker.className = "signal-kicker";
  kicker.textContent = signal?.tone === "good" ? "Signal" : signal?.tone === "none" ? "Signal" : "Bad news";
  const strong = document.createElement("strong");
  strong.className = "signal-label";
  strong.textContent = signal?.label ?? "Reading...";
  box.append(kicker, " ", strong);
  if (signal?.also?.length) {
    const also = document.createElement("span");
    also.className = "also";
    also.textContent = `Also: ${signal.also.join(", ")}`;
    box.append(" ", also);
  }
  return box;
}

function renderDecode(result, { pendingFrom = null } = {}) {
  els.output.replaceChildren();
  els.output.append(renderSignal(result.signal));
  const p = document.createElement("p");
  p.className = "summary";
  const kicker = document.createElement("span");
  kicker.className = "summary-kicker";
  kicker.textContent = "What they really mean:";
  p.append(kicker, " ", result.summary || "Reading the memo...");
  els.output.append(p);
  const details = document.createElement("details");
  details.className = "lines";
  details.open = state.linesOpen;
  details.addEventListener("toggle", () => (state.linesOpen = details.open));
  const sum = document.createElement("summary");
  sum.textContent = `Line by line (${result.lines.length})`;
  const ol = document.createElement("ol");
  ol.className = "decode";
  result.lines.forEach((line, i) => {
    const li = document.createElement("li");
    const q = document.createElement("blockquote");
    q.textContent = line.original;
    const m = document.createElement("p");
    if (pendingFrom !== null && i >= pendingFrom) {
      m.className = "pending";
      m.textContent = "Thinking...";
    } else {
      m.textContent = line.plain;
    }
    li.append(q, m);
    ol.append(li);
  });
  details.append(sum, ol);
  if (result.lines.length) els.output.append(details);
  showOutput();
}

function showOutput() {
  els.empty.hidden = true;
}

function renderCorporate(text) {
  // Last line of defense: corporate output never shows crude wording, from any engine.
  if (hasCrude(text)) text = cleanCrude(text).text;
  const p = document.createElement("p");
  p.className = "corporate-out";
  p.textContent = text;
  els.output.replaceChildren(p);
  showOutput();
}

// swapText is what the swap button moves into the input: the corporate rewrite, or the plain decode lines.
function setResult({ direction, copyText, shareText, swapText = copyText, note = "", engine = "Instant" }) {
  state.last = { direction, copyText, shareText, swapText };
  els.result.hidden = false;
  els.resultTools.hidden = false;
  els.engineUsed.hidden = false;
  els.engineUsed.textContent = engine;
  els.share.href = xIntentUrl(shareText, CONFIG.appUrl);
  els.resultNote.hidden = !note;
  els.resultNote.textContent = note;
  // A fallback from AI mode gets a visible callout, so nobody mistakes it for an AI answer.
  els.resultNote.classList.toggle("callout", /fallback/.test(engine));
  els.reroll.disabled = false;
}

const plainOf = (decoded) => decoded.lines.map((l) => l.plain).join(" ");

// Flip the direction. If there is a result, it becomes the new input and runs the other way.
function swapDirection() {
  const text = state.last?.swapText;
  const next = state.direction === "toNormal" ? "toCorporate" : "toNormal";
  setDirection(next);
  els.swap.classList.toggle("spin");
  if (text) {
    els.input.value = text;
    updateCount();
    run();
  } else {
    hideResult();
  }
}

// ---------- run ----------

async function run({ reroll = false } = {}) {
  const raw = els.input.value;
  if (!raw.trim()) {
    els.input.focus();
    els.capNote.hidden = false;
    els.capNote.textContent = "Type or paste something first.";
    return;
  }
  if (reroll) state.seed += 1;
  else state.seed = 1;
  const { text, truncated } = applySoftCap(raw, CONFIG.softCap);
  const level = getLevel();
  const capNote = truncated ? `Only the first ${CONFIG.softCap.toLocaleString()} characters were translated.` : "";
  const useAI = getEngine() === "ai" && state.ai.status === "ready";

  if (state.direction === "toNormal") {
    const instant = toNormal(text, { level, seed: state.seed });
    if (!useAI) {
      renderDecode(instant);
      setResult({ direction: "toNormal", copyText: formatDecode(instant), shareText: `What they really mean: ${instant.summary}`, swapText: plainOf(instant), note: capNote });
      return;
    }
    await runAIDecode(text, level, instant, capNote, reroll);
  } else {
    const instant = toCorporateDetailed(text, { level, seed: state.seed });
    const out = instant.text;
    const unsafeNote = !instant.unsafe?.length ? ""
      : !out ? "There's no work-safe way to say this as written. Try rewording it."
      : `I left out ${instant.unsafe.length === 1 ? "a sentence" : `${instant.unsafe.length} sentences`} that had no work-safe rewrite. Try rewording ${instant.unsafe.length === 1 ? "it" : "them"}.`;
    const instantNote = [instant.fallback === "plain" && !instant.unsafe?.length ? "Kept close to your wording so the meaning stays the same." : "", unsafeNote].filter(Boolean).join(" ");
    if (!useAI) {
      renderCorporate(out);
      setResult({ direction: "toCorporate", copyText: out, shareText: out, note: [instantNote, capNote].filter(Boolean).join(" ") });
      return;
    }
    renderCorporate("Rewriting with AI...");
    setBusy(true);
    try {
      const res = await askWorker({ type: "toCorporate", text, level, seed: state.seed });
      // The AI reply has to keep the meaning and be safe to say at work. If it fails either check, Instant wins.
      // The AI reply has to keep the meaning and be safe to say at work. If it fails any check, Instant wins.
      const gate = aiCorporateGate(text, res.text, { level });
      const useIt = gate.ok && !instant.unsafe?.length;
      const final = useIt ? res.text : out;
      const why = !res.text
        ? res.rejected ? "AI mode ran, but its reply didn't make sense, so this is the Instant version." : "AI mode ran, but its reply came back empty, so this is the Instant version."
        : gate.reason === "crude" ? "AI mode ran, but its reply had wording you can't use at work, so this is the Instant version."
        : gate.reason === "meaning" ? `AI mode ran, but its reply ${describeProblems(gate.check) || "changed the meaning"}, so this is the Instant version.`
        : gate.reason === "idiom" || gate.reason === "drift" ? "AI mode ran, but its reply changed what you meant, so this is the Instant version."
        : instant.unsafe?.length ? "AI mode ran, but part of your message has no work-safe rewrite, so this is the Instant version." : "";
      renderCorporate(final);
      setResult({ direction: "toCorporate", copyText: final, shareText: final, engine: useIt ? "AI" : "Instant (AI fallback)", note: [why, useIt ? "" : unsafeNote, capNote].filter(Boolean).join(" ") });
    } catch (err) {
      renderCorporate(out);
      setResult({ direction: "toCorporate", copyText: out, shareText: out, engine: "Instant (AI fallback)", note: `AI mode hit an error, so this is the Instant version. (${err.message})` });
    } finally {
      setBusy(false);
    }
  }
}

async function runAIDecode(text, level, instant, capNote, reroll) {
  // Show the sentences right away and fill in AI lines as they arrive.
  const view = { summary: instant.summary, signal: instant.signal, lines: instant.lines.map((l) => ({ original: l.original, plain: l.plain })) };
  renderDecode(view, { pendingFrom: 0 });
  setBusy(true);
  try {
    const res = await askWorker(
      { type: "toNormal", text, level, themes: instant.themes, seed: state.seed },
      (msg) => {
        if (msg.type !== "line") return;
        if (view.lines[msg.index]) view.lines[msg.index].plain = msg.plain || view.lines[msg.index].plain;
        renderDecode(view, { pendingFrom: msg.index + 1 });
      },
    );
    // Missing or empty AI lines fall back to the Instant line for that sentence.
    const lines = res.lines.map((l, i) => ({ original: l.original, plain: l.plain || instant.lines[i]?.plain || "" }));
    lines.push(...instant.lines.slice(lines.length));
    const summary = res.summaryOk && res.summary ? res.summary : instant.summary;
    const final = { summary, lines, signal: instant.signal };
    renderDecode(final);
    const notes = [];
    const aiLines = res.lines.filter((l) => l.plain).length;
    notes.push(aiLines ? "The summary is from Instant mode. AI wrote the sentence lines that passed its checks." : "None of the AI lines passed its checks, so this is the Instant version.");
    if (res.skipped > 0) notes.push(`AI decoded the first ${res.lines.length} sentences. The rest use Instant mode.`);
    if (capNote) notes.push(capNote);
    setResult({ direction: "toNormal", copyText: formatDecode(final), shareText: `What they really mean: ${summary}`, swapText: plainOf(final), note: notes.join(" "), engine: aiLines ? "AI" : "Instant (AI fallback)" });
  } catch (err) {
    renderDecode(instant);
    setResult({ direction: "toNormal", copyText: formatDecode(instant), shareText: `What they really mean: ${instant.summary}`, swapText: plainOf(instant), engine: "Instant (AI fallback)", note: `AI mode hit an error, so this is the Instant version. (${err.message})` });
  } finally {
    setBusy(false);
  }
}

function setBusy(busy) {
  els.run.disabled = busy;
  els.reroll.disabled = busy || !state.last;
  els.run.setAttribute("aria-busy", String(busy));
}

// ---------- AI mode ----------

function getEngine() {
  return els.form.elements.engine.value;
}

function setEngine(value) {
  els.form.elements.engine.value = value;
  els.engineBadge.textContent = value === "ai" ? "AI" : "Instant";
}

async function detectBackend() {
  if (state.ai.backend) return state.ai.backend;
  let backend = { device: "wasm", dtype: "q4", file: "onnx/model_q4.onnx", size: "800 MB", note: "Your browser will run it on the CPU (WebAssembly), which is slower." };
  try {
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter?.features?.has("shader-f16")) {
        backend = { device: "webgpu", dtype: "q4f16", file: "onnx/model_q4f16.onnx", size: "500 MB", note: "Your browser will run it on the GPU (WebGPU)." };
      } else if (adapter) {
        backend = { device: "webgpu", dtype: "q4", file: "onnx/model_q4.onnx", size: "800 MB", note: "Your browser will run it on the GPU (WebGPU)." };
      }
    }
  } catch {
    // Fall through to WebAssembly.
  }
  state.ai.backend = backend;
  return backend;
}

async function isModelCached(backend) {
  try {
    if (!("caches" in self)) return false;
    const cache = await caches.open("transformers-cache");
    const hit = await cache.match(`https://huggingface.co/${MODEL_ID}/resolve/main/${backend.file}`);
    return Boolean(hit);
  } catch {
    return false;
  }
}

function showAIStatus(text, progress = null) {
  els.aiStatus.hidden = false;
  els.settings.open = true;
  els.aiStatusText.textContent = text;
  if (progress === null) els.aiProgress.hidden = true;
  else {
    els.aiProgress.hidden = false;
    els.aiProgress.value = progress;
  }
}

async function enableAI() {
  if (state.ai.status === "ready" || state.ai.status === "loading") return;
  const backend = await detectBackend();
  const cached = await isModelCached(backend);
  if (!cached) {
    els.consentSize.textContent = backend.size;
    els.consentTech.textContent = backend.note;
    els.consent.returnValue = "";
    els.consent.showModal();
    const answer = await new Promise((resolve) => els.consent.addEventListener("close", () => resolve(els.consent.returnValue), { once: true }));
    if (answer !== "ok") {
      setEngine("instant");
      showAIStatus("AI mode is off. Nothing was downloaded.");
      return;
    }
  }
  startWorker(backend, cached);
}

function startWorker(backend, cached) {
  state.ai.status = "loading";
  showAIStatus(cached ? "Loading the model from your browser cache..." : "Starting download...", cached ? null : 0);
  const worker = new Worker(new URL("./ai-worker.js", import.meta.url), { type: "module" });
  state.ai.worker = worker;
  worker.onmessage = (e) => {
    const msg = e.data;
    if (msg.type === "progress") {
      const mb = (n) => Math.round(n / 1e6).toLocaleString();
      showAIStatus(`Downloading the model: ${mb(msg.loaded)} of ${mb(msg.total)} MB`, Math.min(100, msg.progress || 0));
    } else if (msg.type === "ready") {
      state.ai.status = "ready";
      showAIStatus(`AI mode is ready (${backend.device === "webgpu" ? "WebGPU" : "WebAssembly"}, ${backend.dtype}).`);
    } else if (msg.type === "error" && msg.id === undefined) {
      failAI(msg.message);
    } else if (msg.id !== undefined) {
      const pending = state.ai.pending.get(msg.id);
      if (!pending) return;
      if (msg.type === "line") pending.onLine?.(msg);
      else {
        state.ai.pending.delete(msg.id);
        if (msg.type === "error") pending.reject(new Error(msg.message));
        else pending.resolve(msg);
      }
    }
  };
  worker.onerror = (e) => failAI(e.message || "The AI worker crashed.");
  worker.postMessage({ type: "load", device: backend.device, dtype: backend.dtype });
}

function failAI(message) {
  state.ai.status = "error";
  state.ai.worker?.terminate();
  state.ai.worker = null;
  for (const p of state.ai.pending.values()) p.reject(new Error(message));
  state.ai.pending.clear();
  setEngine("instant");
  showAIStatus(`AI mode couldn't start, so Instant mode is on. (${message})`);
}

function askWorker(payload, onLine) {
  return new Promise((resolve, reject) => {
    const id = state.ai.nextId++;
    state.ai.pending.set(id, { resolve, reject, onLine });
    state.ai.worker.postMessage({ ...payload, id });
  });
}

// ---------- voice ----------

const mic = { engine: null, busy: false, rec: null, recorder: null, stream: null, timer: 0, worker: null, ready: false, nextId: 1, pending: new Map() };

function micState(text, { error = false } = {}) {
  els.micNote.hidden = !text;
  els.micNote.textContent = text;
  els.micNote.classList.toggle("callout", error);
}

function micPressed(on) {
  els.mic.setAttribute("aria-pressed", on ? "true" : "false");
  els.mic.setAttribute("aria-label", on ? "Stop dictation" : "Start dictation");
}

function setupMic() {
  const b = detectBrowser();
  mic.engine = chooseEngine(b);
  if (!mic.engine) return;
  els.mic.hidden = false;
  els.mic.addEventListener("click", () => {
    if (mic.busy) return;
    if (mic.rec) return mic.rec.stop();
    if (mic.recorder) return stopRecording();
    return mic.engine === "speech" ? startSpeech() : startLocal();
  });
}

function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  mic.rec = rec;
  rec.lang = navigator.language || "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  const base = els.input.value ? els.input.value.replace(/\s*$/, " ") : "";
  let finalText = "";
  let failed = "";
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interim += t;
    }
    els.input.value = (base + finalText + interim).replace(/\s+/g, " ").trimStart();
    updateCount();
  };
  rec.onerror = (e) => { failed = e.error || "error"; };
  rec.onend = () => {
    mic.rec = null;
    micPressed(false);
    if (SPEECH_FALLBACK_ERRORS.has(failed) && detectBrowser().canRecord) {
      // The browser has the API but no speech service behind it (Brave does this). Switch to on-device.
      mic.engine = "local";
      micState("Your browser's speech service isn't available, so dictation will run on your device instead.");
      startLocal();
    } else if (failed && failed !== "aborted") {
      micState(micErrorMessage(failed), { error: true });
    } else {
      micState("");
    }
  };
  try {
    rec.start();
  } catch (e) {
    mic.rec = null;
    micState(micErrorMessage(e), { error: true });
    return;
  }
  micPressed(true);
  micState("Listening. Click the mic again to stop. Dictation uses your browser's speech service, which may process audio on Google or Apple servers.");
}

async function askWhisperConsent() {
  try { if (localStorage.getItem("synergy.whisper") === "ok") return true; } catch {}
  els.dictConsent.returnValue = "";
  els.dictConsent.showModal();
  const answer = await new Promise((resolve) => els.dictConsent.addEventListener("close", () => resolve(els.dictConsent.returnValue), { once: true }));
  if (answer !== "ok") return false;
  try { localStorage.setItem("synergy.whisper", "ok"); } catch {}
  return true;
}

function whisperWorker() {
  if (mic.worker) return mic.worker;
  mic.worker = new Worker(new URL("./whisper-worker.js", import.meta.url), { type: "module" });
  mic.worker.onmessage = ({ data }) => {
    if (data.type === "ready") mic.ready = true;
    else if (data.type === "progress") mic.progress = data.pct;
    if (data.type === "progress" && mic.transcribing) micState(`Downloading the speech model (${data.pct}%). This only happens once.`);
    if (data.type === "ready" && mic.transcribing) micState("Transcribing on your device...");
    const job = mic.pending.get(data.id);
    if (!job) {
      if (data.type === "error") { mic.loadError = true; for (const j of mic.pending.values()) j.reject(new Error(data.message)); mic.pending.clear(); }
      return;
    }
    if (data.type === "text") { mic.pending.delete(data.id); job.resolve(data.text); }
    if (data.type === "error") { mic.pending.delete(data.id); job.reject(new Error(data.message)); }
  };
  mic.worker.onerror = () => { for (const j of mic.pending.values()) j.reject(new Error("worker")); mic.pending.clear(); mic.worker = null; };
  mic.worker.postMessage({ type: "load" });
  return mic.worker;
}

function transcribe(audio) {
  return new Promise((resolve, reject) => {
    const id = mic.nextId++;
    mic.pending.set(id, { resolve, reject });
    whisperWorker().postMessage({ type: "transcribe", id, audio }, [audio.buffer]);
  });
}

async function startLocal() {
  mic.busy = true;
  try {
    if (!(await askWhisperConsent())) { micState(""); return; }
    whisperWorker();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      micState(micErrorMessage(e), { error: true });
      return;
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => finishRecording(chunks, recorder.mimeType);
    mic.stream = stream;
    mic.recorder = recorder;
    recorder.start();
    micPressed(true);
    micState(`Listening. Click the mic again to stop (up to ${MAX_SECONDS} seconds). Audio stays on your device.`);
    mic.timer = setTimeout(stopRecording, MAX_SECONDS * 1000);
  } finally {
    mic.busy = false;
  }
}

function stopRecording() {
  clearTimeout(mic.timer);
  if (mic.recorder?.state === "recording") mic.recorder.stop();
  mic.stream?.getTracks().forEach((t) => t.stop());
  micPressed(false);
}

async function finishRecording(chunks, mimeType) {
  mic.recorder = null;
  mic.stream = null;
  mic.busy = true;
  mic.transcribing = true;
  els.mic.setAttribute("aria-busy", "true");
  micState(mic.ready ? "Transcribing on your device..." : `Downloading the speech model${mic.progress ? ` (${mic.progress}%)` : ""}. This only happens once.`);
  try {
    const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
    if (!blob.size) throw Object.assign(new Error("empty"), { name: "empty" });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    let decoded;
    try { decoded = await ctx.decodeAudioData(await blob.arrayBuffer()); } finally { ctx.close?.(); }
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
    const audio = toMono16k(channels, decoded.sampleRate);
    let text;
    try { text = await transcribe(audio); } catch { throw Object.assign(new Error("model"), { name: "model" }); }
    const before = els.input.value;
    els.input.value = appendTranscript(before, text);
    updateCount();
    micState(els.input.value === before ? micErrorMessage("no-speech") : "", { error: els.input.value === before });
  } catch (e) {
    micState(micErrorMessage(e), { error: true });
  } finally {
    mic.busy = false;
    mic.transcribing = false;
    els.mic.removeAttribute("aria-busy");
  }
}

// ---------- copy ----------

async function copyResult() {
  if (!state.last) return;
  const text = state.last.copyText;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  els.copyText.textContent = "Copied";
  setTimeout(() => (els.copyText.textContent = "Copy"), 1600);
}

// ---------- wire up ----------

// On phones the result sits under the input, so bring it into view after a run.
function revealResult() {
  if (window.matchMedia("(min-width: 861px)").matches) return;
  const top = els.result.getBoundingClientRect().top;
  if (top > window.innerHeight * 0.6) {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.result.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
  }
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await run();
  if (state.last) revealResult();
});
els.reroll.addEventListener("click", () => run({ reroll: true }));
els.input.addEventListener("input", updateCount);
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    run();
  }
});
for (const radio of els.form.elements.level) {
  radio.addEventListener("change", () => state.last && getEngine() === "instant" && run());
}
for (const radio of els.form.elements.engine) {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    setEngine(radio.value);
    if (radio.value === "ai") enableAI();
  });
}
els.example.addEventListener("click", () => {
  const list = state.direction === "toNormal" ? MEMOS : PLAIN;
  const i = state.exampleIndex[state.direction]++ % list.length;
  els.input.value = list[i];
  updateCount();
  run();
});
els.clear.addEventListener("click", () => {
  els.input.value = "";
  updateCount();
  hideResult();
  els.reroll.disabled = true;
  els.input.focus();
});
els.copy.addEventListener("click", copyResult);
els.swap.addEventListener("click", swapDirection);

function hideResult() {
  els.output.replaceChildren();
  els.empty.hidden = false;
  els.resultTools.hidden = true;
  els.engineUsed.hidden = true;
  els.resultNote.hidden = true;
  state.last = null;
}

// Browsers can restore old form state on reload, so reset the direction, level and engine together.
// Full C-Suite is the default: the product is maximum corporate.
els.form.elements.level.value = "3";
setEngine("instant");
setDirection("toCorporate");
updateCount();
setupMic();
detectBackend().then((b) => {
  els.aiDesc.textContent = `A small open model that runs in your browser. One-time download of about ${b.size}.`;
});
