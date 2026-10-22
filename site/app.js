import { toCorporate, toNormal, formatDecode, applySoftCap, LEVELS } from "./engine.js";
import { xIntentUrl } from "./share.js";
import { CONFIG } from "./config.js";
import { MEMOS, PLAIN } from "./samples.js";
import { MODEL_ID } from "./ai-prompts.js";

const $ = (id) => document.getElementById(id);
const els = {
  form: $("form"), input: $("input"), inputLabel: $("input-label"), lede: $("lede"), count: $("count"), capNote: $("cap-note"),
  level: $("level"), levelLabel: $("level-label"), levelName: $("level-name"), ticks: [1, 2, 3].map((i) => $(`tick-${i}`)),
  run: $("run"), reroll: $("reroll"), example: $("example"), clear: $("clear"), mic: $("mic"), micNote: $("mic-note"),
  result: $("result"), output: $("output"), resultNote: $("result-note"), copy: $("copy"), share: $("share"),
  aiStatus: $("ai-status"), aiProgress: $("ai-progress"), aiStatusText: $("ai-status-text"), aiDesc: $("ai-desc"),
  consent: $("consent"), consentSize: $("consent-size"), consentTech: $("consent-tech"),
};

const state = {
  direction: "toNormal",
  seed: 1,
  last: null, // { direction, text, level, plain (copy text), shareText }
  exampleIndex: { toNormal: 0, toCorporate: 0 },
  ai: { status: "off", worker: null, backend: null, pending: new Map(), nextId: 1 },
};

const COPY = {
  toNormal: {
    lede: "Paste a memo or a LinkedIn post and see what it really says.",
    label: "Corporate text",
    placeholder: "Paste a CEO memo, a LinkedIn post or an all-hands email.",
    run: "Decode",
    levelLabel: "Bluntness",
  },
  toCorporate: {
    lede: "Type what you mean. Get it back in fluent corporate.",
    label: "What you really mean",
    placeholder: "Type or dictate something blunt, like: I can't make the meeting, I'm swamped.",
    run: "Corporatize",
    levelLabel: "How corporate",
  },
};

// ---------- direction, level, counter ----------

function setDirection(dir) {
  state.direction = dir;
  const c = COPY[dir];
  els.lede.textContent = c.lede;
  els.inputLabel.textContent = c.label;
  els.input.placeholder = c.placeholder;
  els.run.textContent = c.run;
  els.levelLabel.textContent = c.levelLabel;
  LEVELS[dir].forEach((name, i) => (els.ticks[i].textContent = name));
  updateLevel();
  els.reroll.disabled = true;
}

function updateLevel() {
  const lvl = Number(els.level.value);
  const name = LEVELS[state.direction][lvl - 1];
  els.levelName.textContent = name;
  els.level.setAttribute("aria-valuetext", name);
  els.ticks.forEach((t, i) => t.classList.toggle("on", i === lvl - 1));
}

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

function renderDecode(result, { pendingFrom = null } = {}) {
  els.output.replaceChildren();
  const p = document.createElement("p");
  p.className = "summary";
  const strong = document.createElement("strong");
  strong.textContent = "What they really mean:";
  p.append(strong, " ", result.summary || "Reading the memo...");
  els.output.append(p);
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
  els.output.append(ol);
}

function renderCorporate(text) {
  const p = document.createElement("p");
  p.className = "corporate-out";
  p.textContent = text;
  els.output.replaceChildren(p);
}

function setResult({ direction, copyText, shareText, note = "" }) {
  state.last = { direction, copyText, shareText };
  els.result.hidden = false;
  els.share.href = xIntentUrl(shareText, CONFIG.appUrl);
  els.resultNote.hidden = !note;
  els.resultNote.textContent = note;
  els.reroll.disabled = false;
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
  const level = Number(els.level.value);
  const capNote = truncated ? `Only the first ${CONFIG.softCap.toLocaleString()} characters were translated.` : "";
  const useAI = getEngine() === "ai" && state.ai.status === "ready";

  if (state.direction === "toNormal") {
    const instant = toNormal(text, { level, seed: state.seed });
    if (!useAI) {
      renderDecode(instant);
      setResult({ direction: "toNormal", copyText: formatDecode(instant), shareText: `What they really mean: ${instant.summary}`, note: capNote });
      return;
    }
    await runAIDecode(text, level, instant, capNote, reroll);
  } else {
    const out = toCorporate(text, { level, seed: state.seed });
    if (!useAI) {
      renderCorporate(out);
      setResult({ direction: "toCorporate", copyText: out, shareText: out, note: capNote });
      return;
    }
    renderCorporate("Rewriting with AI...");
    els.result.hidden = false;
    setBusy(true);
    try {
      const res = await askWorker({ type: "toCorporate", text, level, sample: reroll });
      const final = res.text || out;
      renderCorporate(final);
      setResult({ direction: "toCorporate", copyText: final, shareText: final, note: [res.text ? "" : "The AI came back empty, so this is the Instant version.", capNote].filter(Boolean).join(" ") });
    } catch (err) {
      renderCorporate(out);
      setResult({ direction: "toCorporate", copyText: out, shareText: out, note: `AI mode hit an error, so this is the Instant version. (${err.message})` });
    } finally {
      setBusy(false);
    }
  }
}

async function runAIDecode(text, level, instant, capNote, reroll) {
  // Show the sentences right away and fill in AI lines as they arrive.
  const view = { summary: "", lines: instant.lines.map((l) => ({ original: l.original, plain: l.plain })) };
  renderDecode(view, { pendingFrom: 0 });
  els.result.hidden = false;
  setBusy(true);
  try {
    const res = await askWorker(
      { type: "toNormal", text, level, themes: instant.themes, sample: reroll },
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
    const final = { summary, lines };
    renderDecode(final);
    const notes = [];
    if (!res.summaryOk) notes.push("The AI summary missed the main point, so the summary is from Instant mode.");
    if (res.skipped > 0) notes.push(`AI decoded the first ${res.lines.length} sentences. The rest use Instant mode.`);
    if (capNote) notes.push(capNote);
    setResult({ direction: "toNormal", copyText: formatDecode(final), shareText: `What they really mean: ${summary}`, note: notes.join(" ") });
  } catch (err) {
    renderDecode(instant);
    setResult({ direction: "toNormal", copyText: formatDecode(instant), shareText: `What they really mean: ${instant.summary}`, note: `AI mode hit an error, so this is the Instant version. (${err.message})` });
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
      els.form.elements.engine.value = "instant";
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
  els.form.elements.engine.value = "instant";
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

function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ua = navigator.userAgent;
  const isEdge = /\bEdg(?:e|A|iOS)?\//.test(ua);
  const isFirefox = /\b(?:Firefox|FxiOS)\//.test(ua);
  if (!SR || isEdge || isFirefox) return;
  els.mic.hidden = false;
  let rec = null;
  let base = "";
  const stop = () => {
    rec?.stop();
  };
  els.mic.addEventListener("click", () => {
    if (rec) return stop();
    rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    base = els.input.value ? els.input.value.replace(/\s*$/, " ") : "";
    let finalText = "";
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
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        els.capNote.hidden = false;
        els.capNote.textContent = "Microphone access was blocked. You can still type.";
      }
    };
    rec.onend = () => {
      rec = null;
      els.mic.setAttribute("aria-pressed", "false");
      els.mic.setAttribute("aria-label", "Start dictation");
      els.micNote.hidden = true;
    };
    rec.start();
    els.mic.setAttribute("aria-pressed", "true");
    els.mic.setAttribute("aria-label", "Stop dictation");
    els.micNote.hidden = false;
  });
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
  els.copy.textContent = "Copied";
  setTimeout(() => (els.copy.textContent = "Copy"), 1600);
}

// ---------- wire up ----------

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  run();
});
els.reroll.addEventListener("click", () => run({ reroll: true }));
els.input.addEventListener("input", updateCount);
els.input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    run();
  }
});
els.level.addEventListener("input", updateLevel);
els.level.addEventListener("change", () => state.last && getEngine() === "instant" && run());
for (const radio of els.form.elements.direction) {
  radio.addEventListener("change", () => {
    setDirection(radio.value);
    els.result.hidden = true;
    state.last = null;
  });
}
for (const radio of els.form.elements.engine) {
  radio.addEventListener("change", () => {
    if (radio.checked && radio.value === "ai") enableAI();
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
  els.result.hidden = true;
  state.last = null;
  els.reroll.disabled = true;
  els.input.focus();
});
els.copy.addEventListener("click", copyResult);

setDirection("toNormal");
updateCount();
setupMic();
detectBackend().then((b) => {
  els.aiDesc.textContent = `Small open model that runs in your browser. One-time download, about ${b.size}.`;
});
