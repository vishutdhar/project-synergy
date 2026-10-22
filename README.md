# Project Synergy

Corporate Speak Translator, a free Freedom Terminal web app.

Live at https://project-synergy.pages.dev.

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
| `site/ai-guard.js` | Generation settings and checks on AI replies (loops, copied examples, cut-off text) |
| `site/meaning.js` | Meaning check for Normal to corporate: compares input and output for no's, questions, numbers, names, dates, lists and added meetings |
| `site/config.js` | App link used in Share to X posts, and the soft character cap |
| `site/samples.js` | Fictional example memos and messages (no real company or person) |
| `site/_headers` | Cloudflare Pages headers: CSP, security headers, cache rules |

The page opens on Normal to Corporate. The header works like a translator app: the source on the left, the target on the right, and a swap button between them. Pressing swap after a result flips the direction, moves the result into the text box and runs it again, so you can go there and back. Without a result it only flips the direction. The input and result sit side by side on wide screens and stack on phones, with the run button on the first screen. Level chips sit above the panes, and the engine choice (Instant or AI) is under Settings.

Design tokens (colors, type scale, the 44px tap size) are at the top of `site/styles.css`. `tests/contrast.test.js` checks every text and border pair against WCAG AA in light and dark mode.

### Instant mode (default)

Corporate to normal splits the text into sentences, skips greetings and signatures, and checks each sentence against signal rules. The strongest signal becomes the headline at the top of the result, and the summary leads with it. Signals: you're being laid off, layoffs, PIP, shutdown or sunset, outsourcing, rejection or no-go, stack ranking, no raises, return to office, budget freeze, hiring freeze, LinkedIn "new chapter" posts, delay or slip, reorg, cost cuts, benefit cuts, mergers, leadership exits, AI push, pressure to perform and non-answers. A memo with none of them says so ("No bad news found", or "All fluff" when it is mostly thank-yous). "New chapter" only counts when the writer talks about themselves, so a CEO's "next chapter" is not a LinkedIn post. Each sentence gets a blunt translation from the signal it matches, a stock line if it is filler, or a phrase-by-phrase swap. Some pairs read as one line, such as "No raises, even after a record year." Words like right-size, reduction in force, eliminate roles or lower headcount mean layoffs on their own. Softer phrases (restructuring, streamline, align resources, difficult decision, synergies) only count as layoffs when two or more show up in the same memo, and only then do words like "synergies" decode as job cuts. Bluntness has three levels: Polite, Honest and Blunt.

Normal to corporate swaps words and phrases from a phrasebook of about 440 entries, each with options per level (common casual words always swap, even at Mild), then adds openers, closers and (at Full C-Suite) random asides. These set a tone only: they never add meetings, plans, deadlines or promises that weren't in the input, and Mild adds no opener. Key words don't repeat, so you won't get "capacity" twice in one message. Every rewritten sentence goes through `site/meaning.js`: it must keep every no (so "won't" never turns into "would rather not"), every question mark, number, name and date, and it may not add a date, a name or a meeting the input didn't have. Swaps never touch numbers, dates or names in the first place. If a sentence fails after a few tries, it stays as written. Lists keep one item per line, and openers and closers go on their own line around a list. The whole message is checked again at the end. AI replies get the same check, and the page shows the Instant version with a short note when one fails. Output is deterministic for a given text, level and seed. Reroll changes the seed. The engine fixes a/an after swaps, keeps ALL CAPS, capitalizes every sentence start and standalone "i" (but not URLs, emails, code or words like iPhone) and normalizes curly quotes and dashes.

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

Decoding runs one sentence per model call (with up to 60 sentences per memo; the rest use Instant lines), then one short summary call. Each sentence prompt includes a hint from the Instant theme rules, which keeps the 0.5B model on topic. If the AI summary does not mention the top theme, or denies it, the page uses the Instant summary and says so. Any model error falls back to Instant mode.

Generation samples with the model's own settings (temperature 0.7, top_p 0.8, top_k 20; decoding uses temperature 0.3). Each request has a fixed seed, so the same input gives the same answer until you press Reroll. A repetition penalty of 1.15 applies to generated tokens only, and short line rewrites also ban repeated 3-grams. The built-in penalty options also count the prompt, which punished the example buzzwords, so they stay off. The token budget scales with the input and has a hard ceiling of 200. A stopping rule ends generation when the last tokens repeat a short pattern. Every reply then goes through `site/ai-guard.js`: repeated runs of the same 1 to 6 words are cut down to one copy, the text is trimmed to its last full sentence, and a reply that is still repetitive, copies a prompt example, or is empty is dropped. In that case the page shows the Instant version with a short note.

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
npm test                          # unit tests, the golden corpus with property tests, and the contrast check (node --test)
node scripts/e2e.mjs              # Instant mode end to end in headless Chrome, writes screenshots to preview/
node scripts/e2e-ai.mjs           # AI mode in headless Chrome (downloads the model into .chrome-profile/)
node scripts/e2e-ai-matrix.mjs    # AI mode at every level in both directions, prints each output
node scripts/prompt-test.mjs 2 q4f16   # runs the AI prompts on the four sample memos in Node, writes preview/prompt-test-*.md
```

`tests/golden.js` holds 74 realistic inputs (43 memos and posts with their expected signal, 31 plain messages with the strings they must keep) across both directions and all three levels. `tests/golden.test.js` runs each one, then checks 300 random messages at every level for lost no's, questions, numbers, names, dates and list lines. `node scripts/shots.mjs` saves desktop and mobile screenshots.

The end-to-end scripts expect Chrome at `/usr/bin/google-chrome` and the preview server on port 8787.

## Deploy to Cloudflare Pages

There is no build step. The output directory is `site`.

With Git: create a Pages project from the repo, leave the build command empty (or use `exit 0`), and set the build output directory to `site`.

With Wrangler, from this folder:

```sh
npx wrangler pages deploy site --project-name project-synergy
```

How the live site is deployed today: a direct upload with `scripts/deploy-pages.mjs`, using the project's short-lived upload token. No API token is stored anywhere.

1. Get the upload token from `GET /accounts/{account_id}/pages/projects/project-synergy/upload-token` and save it to a temp file only you can read (`chmod 600`).
2. Upload the files: `CF_PAGES_UPLOAD_JWT_FILE=/path/to/that/file node scripts/deploy-pages.mjs upload`
3. Print the manifest: `node scripts/deploy-pages.mjs manifest`
4. Create the deployment with `POST /accounts/{account_id}/pages/projects/project-synergy/deployments` as `multipart/form-data`, with the fields `manifest` (the JSON from step 3), `branch` set to `main`, and `_headers` (the contents of `site/_headers`).
5. Delete the token file.

The token expires after a few minutes. If the upload says 401, get a new one.

The live site is https://project-synergy.pages.dev, with no custom domain. If the address changes, update `appUrl` in `site/config.js` and the canonical, `og:` and `twitter:` URLs in `site/index.html`.

`site/_headers` sets a Content Security Policy that allows only the site itself, Hugging Face (`huggingface.co`, `*.huggingface.co`, `*.hf.co`) and `cdn.jsdelivr.net`, plus `wasm-unsafe-eval` and `blob:` for ONNX Runtime. It also sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`, which lets Chrome and Firefox run the WebAssembly model with multiple threads. Every file is under Cloudflare's 25 MiB limit.

## Licenses

Project Synergy is MIT licensed (`LICENSE`). Transformers.js is Apache 2.0. Qwen2.5 0.5B Instruct is Apache 2.0. The sample memos are fictional.
