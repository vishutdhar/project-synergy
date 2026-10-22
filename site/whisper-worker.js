// Dictation worker. Transcribes recorded audio on the device with Whisper through Transformers.js.
// It only loads after the user agrees to the download, and only in browsers without a working speech service.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";
import { WHISPER_MODEL, WHISPER_DTYPE } from "./dictation.js";

env.allowLocalModels = false;
env.useBrowserCache = true;

let asr = null;
let loading = null;
const files = new Map();

function load() {
  if (asr) return Promise.resolve(asr);
  if (!loading) {
    loading = pipeline("automatic-speech-recognition", WHISPER_MODEL, {
      dtype: WHISPER_DTYPE,
      device: "wasm",
      progress_callback: (p) => {
        if (p.status !== "progress" || !p.file) return;
        files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
        let loaded = 0, total = 0;
        for (const f of files.values()) { loaded += f.loaded; total += f.total; }
        if (total) self.postMessage({ type: "progress", pct: Math.min(99, Math.round((loaded / total) * 100)) });
      },
    }).then((p) => { asr = p; self.postMessage({ type: "ready" }); return p; }, (e) => { loading = null; throw e; });
  }
  return loading;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") { await load(); return; }
    if (data.type === "transcribe") {
      const p = await load();
      const out = await p(data.audio, { chunk_length_s: 30, stride_length_s: 5 });
      self.postMessage({ type: "text", id: data.id, text: out?.text ?? "" });
    }
  } catch (e) {
    self.postMessage({ type: "error", id: data.id, message: String(e?.message ?? e) });
  }
};
