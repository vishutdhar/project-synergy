# Project Synergy

Corporate Speak Translator, a free Freedom Terminal web app.

Paste a CEO memo or a LinkedIn post and get a one-line "What they really mean:" summary plus a sentence-by-sentence plain-English decode. It also works the other way: type or dictate something blunt and get it back in corporate speak at three levels (Mild, Middle Manager, Full C-Suite).

It costs nothing to run. There is no server, no API key, no account and no analytics. Text stays in the browser. The only network requests are the site's own static files and, after the user agrees, the AI model files from Hugging Face plus Transformers.js and the ONNX Runtime WebAssembly files from jsDelivr.

## How it works

The site is plain HTML, CSS and ES modules in `site/`. There is no build step.

| File | What it does |
| --- | --- |
| `site/index.html`, `site/styles.css`, `site/app.js` | Page, layout and UI logic |
| `site/engine.js` | Instant mode engine for both directions (pure functions, also runs in Node) |
| `site/phrasebook.js` | Word and phrase swaps, openers, closers, decode swaps, theme rules |
| `site/ai-prompts.js` | AI prompts and output parsing, shared by the browser worker and the Node prompt tests |
| `site/ai-worker.js` | Web Worker that runs the model with Transformers.js |
| `site/config.js` | App link used in Share to X posts, and the soft character cap |
| `site/samples.js` | Fictional example memos and messages (no real company or person) |
| `site/_headers` | Cloudflare Pages headers: CSP, security headers, cache rules |

### Instant mode (default)

Corporate to normal splits the text into sentences, skips greetings and signatures, and checks each sentence against theme rules (layoffs, return to office, no raises, record year, reorg, cost cuts, hiring freeze, AI, performance pressure, leadership exits, benefit cuts, mergers). Each sentence gets a blunt translation from the theme it matches, a stock line if it is filler, or a phrase-by-phrase swap. The summary combines the top themes, with special cases such as "Record profits. No raises." Bluntness has three levels: Polite, Honest and Blunt.

Normal to corporate swaps words and phrases from a phrasebook of about 440 entries, each with options per level (common casual words always swap, even at Mild), then adds openers, closers and (at Full C-Suite) random asides. Output is deterministic for a given text, level and seed. Reroll changes the seed. The engine fixes a/an after swaps, keeps ALL CAPS, capitalizes every sentence start and standalone "i" (but not URLs, emails, code or words like iPhone) and normalizes curly quotes and dashes.

Input over 20,000 characters is trimmed at a sentence boundary, and the page says so.

### AI mode (optional)

AI mode runs [onnx-community/Qwen2.5-0.5B-Instruct](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct) (Apache 2.0) in a Web Worker with Transformers.js 4.3.1, loaded from `cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1` only when AI mode starts.

| Browser | Device | dtype | Model file | Download |
| --- | --- | --- | --- | --- |
| WebGPU with `shader-f16` | `webgpu` | `q4f16` | `onnx/model_q4f16.onnx` | about 483 MB |
| WebGPU without `shader-f16` | `webgpu` | `q4` | `onnx/model_q4.onnx` | about 786 MB |
| No WebGPU | `wasm` | `q4` | `onnx/model_q4.onnx` | about 786 MB |

Every path also loads `config.json`, `generation_config.json`, `tokenizer.json` (7 MB) and `tokenizer_config.json`, and ONNX Runtime Web loads its WebAssembly files (about 27 MB) from `cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0`. The `q8` file (`model_quantized.onnx`, 512 MB) is smaller but gave much worse answers in testing, so the WebAssembly path uses `q4`.

Nothing downloads until the user agrees in a dialog that states the size. A progress bar shows the download. Transformers.js keeps the files in the browser's Cache Storage (`transformers-cache`), and the page skips the dialog when the model is already cached.

Decoding runs one sentence per model call (with up to 60 sentences per memo; the rest use Instant lines), then one short summary call. Each sentence prompt includes a hint from the Instant theme rules, which keeps the 0.5B model on topic. If the AI summary does not mention the top theme, the page uses the Instant summary and says so. Any model error falls back to Instant mode.

### Voice

The mic button uses the Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`) in Chrome and Safari. It is hidden when the API is missing and on Firefox and Edge. Browsers usually send dictation audio to their own speech service (Google for Chrome, Apple for Safari), and the page says this next to the mic while it records.

## Run it locally

```sh
npm install            # dev tools only: Transformers.js (for Node prompt tests) and puppeteer-core
node scripts/serve.mjs site 8787   # static server that also applies site/_headers
# or: python3 -m http.server 8787 --directory site   (no headers)
```

Open http://localhost:8787.

## Tests

```sh
npm test                          # unit tests for the engine, share text and UI copy rules (node --test)
node scripts/e2e.mjs              # Instant mode end to end in headless Chrome, writes screenshots to preview/
node scripts/e2e-ai.mjs           # AI mode in headless Chrome (downloads the model into .chrome-profile/)
node scripts/prompt-test.mjs 2 q4f16   # runs the AI prompts on the four sample memos in Node, writes preview/prompt-test-*.md
```

The end-to-end scripts expect Chrome at `/usr/bin/google-chrome` and the preview server on port 8787.

## Deploy to Cloudflare Pages

There is no build step. The output directory is `site`.

With Git: create a Pages project from the repo, leave the build command empty (or use `exit 0`), and set the build output directory to `site`.

With Wrangler, from this folder:

```sh
npx wrangler pages deploy site --project-name project-synergy
```

Then add the custom domain (for example `synergy.freedom-terminal.com`) in the Pages project. freedom-terminal.com DNS is on Vercel, so that needs a CNAME record pointing the subdomain at `<project>.pages.dev`.

Before deploying to a different address, update `appUrl` in `site/config.js` and the canonical and `og:` URLs in `site/index.html`.

`site/_headers` sets a Content Security Policy that allows only the site itself, Hugging Face (`huggingface.co`, `*.huggingface.co`, `*.hf.co`) and `cdn.jsdelivr.net`, plus `wasm-unsafe-eval` and `blob:` for ONNX Runtime. It also sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`, which lets Chrome and Firefox run the WebAssembly model with multiple threads. Every file is under Cloudflare's 25 MiB limit.

## Licenses

Project Synergy is MIT licensed (`LICENSE`). Transformers.js is Apache 2.0. Qwen2.5 0.5B Instruct is Apache 2.0. The sample memos are fictional.
