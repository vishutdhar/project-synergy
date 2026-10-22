// Dictation helpers. The browser's own speech service (Web Speech API) is used where it works.
// Brave ships the API but has no speech service behind it, so start() fails with a "network" error.
// There, and in Firefox and Edge, dictation records audio and transcribes it on the device with Whisper.

export const WHISPER_MODEL = "onnx-community/whisper-base.en";
export const WHISPER_DTYPE = "q8";
export const WHISPER_SIZE = "about 80 MB";
export const MAX_SECONDS = 60;
export const SAMPLE_RATE = 16000;

// Speech service errors that mean "this browser can't do it", not "the user said no".
export const SPEECH_FALLBACK_ERRORS = new Set(["network", "service-not-allowed", "language-not-supported"]);

export function chooseEngine({ hasSpeech, isBrave, isEdge, isFirefox, canRecord }) {
  if (hasSpeech && !isBrave && !isEdge && !isFirefox) return "speech";
  return canRecord ? "local" : null;
}

export function detectBrowser(nav = globalThis.navigator, win = globalThis) {
  const ua = nav?.userAgent ?? "";
  return {
    hasSpeech: Boolean(win.SpeechRecognition || win.webkitSpeechRecognition),
    isBrave: Boolean(nav?.brave && typeof nav.brave.isBrave === "function"),
    isEdge: /\bEdg(?:e|A|iOS)?\//.test(ua),
    isFirefox: /\b(?:Firefox|FxiOS)\//.test(ua),
    canRecord: Boolean(nav?.mediaDevices?.getUserMedia && win.MediaRecorder && (win.AudioContext || win.webkitAudioContext)),
  };
}

// Turns a getUserMedia DOMException name or a speech service error code into a short message.
export function micErrorMessage(err) {
  const code = typeof err === "string" ? err : err?.name ?? "";
  switch (code) {
    case "NotAllowedError": case "SecurityError": case "PermissionDeniedError": case "not-allowed":
      return "Microphone access is blocked. Allow the mic for this site in your browser's site settings, then try again. You can still type.";
    case "NotFoundError": case "DevicesNotFoundError": case "OverconstrainedError": case "audio-capture":
      return "No microphone was found. Plug one in or type instead.";
    case "NotReadableError": case "TrackStartError": case "AbortError":
      return "The microphone is busy or unavailable. Close other apps using it and try again.";
    case "no-speech": case "empty":
      return "I didn't catch anything. Try again a little closer to the mic.";
    case "model":
      return "The speech model couldn't download. Check your connection and try again.";
    default:
      return "Dictation stopped because of an error. You can still type.";
  }
}

// Mixes any number of channels down to mono and resamples to 16 kHz, which is what Whisper expects.
export function toMono16k(channels, sampleRate, target = SAMPLE_RATE) {
  if (!channels.length) return new Float32Array(0);
  const len = channels[0].length;
  const mono = new Float32Array(len);
  for (const ch of channels) for (let i = 0; i < len; i++) mono[i] += ch[i] / channels.length;
  if (sampleRate === target) return mono;
  const ratio = sampleRate / target;
  const out = new Float32Array(Math.floor(len / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio;
    const j = Math.floor(x);
    const f = x - j;
    out[i] = mono[j] * (1 - f) + (mono[j + 1] ?? mono[j]) * f;
  }
  return out;
}

// Whisper marks silence and noise with tags like [BLANK_AUDIO] or (music). Those never go into the box.
export function cleanTranscript(text) {
  return String(text ?? "")
    .replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function appendTranscript(existing, text) {
  const t = cleanTranscript(text);
  if (!t) return existing;
  const base = String(existing ?? "").replace(/\s+$/, "");
  return base ? `${base} ${t}` : t;
}
