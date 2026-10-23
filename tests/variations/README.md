# Variation dataset

1,003 unique inputs for the Corporate Speak Translator, each with a hand-written ideal output at all three levels (Mild, Middle Manager, Full C-Suite).

- 652 Normal to Corporate inputs (`n0001` to `n0652`) in 31 categories: one-liners, declines, sick and late notes, crude venting, sarcasm, slang and typos, lists, run-ons, numbers and names, and more.
- 351 Corporate to Normal inputs (`d0001` to `d0351`) in 31 categories: layoff memos, PIPs, reorgs, RTO, no-raise notices, LinkedIn posts, emails, Slack lines, plain notes with nothing hidden, and mixed memos.

## Files

- `src/normal-*.txt`, `src/decode-*.txt`: the hand-written source. Each block has four lines: the input, then the ideal output at levels 1, 2 and 3. A `# cat=X signal=Y` header sets the category and, for decode, the theme a reader should come away with.
- `build.mjs`: builds `items.json` from `src/`. It fails on a duplicate input, so every input is unique after case and punctuation are stripped.
- `items.json`: the built items (`id`, `direction`, `category`, `signal`, `input`, `ideal`).
- `checks.mjs`: the automated checks used by the grader. Corporate side: empty output, crude words left in, meaning check (numbers, names, dates, negation), lost idioms, garbled text, added sentences at Mild and Middle Manager, and `must_keep` items missing. Decode side: wrong or missing theme, a line that echoes the memo, crude words in the summary.
- `retrieval.mjs`: picks the closest dataset examples for an input, for the retrieval few-shot experiment.
- `dataset.jsonl`: one line per input with the ideal outputs and what each engine produced, written by `scripts/variations-grade.mjs`.

## dataset.jsonl fields

```
id, direction ("toCorporate" or "toNormal"), category, expected_signal (decode theme or null),
input, must_keep (numbers, names and dates the output has to keep),
levels: [{ level, ideal_output,
           instant: { output, grade, hand_read, flags, note },
           ai: { model, fewshot, output, shown, shown_grade, grade, hand_read, flags, note, gate } or null }]
```

- `grade` is `pass` or `fail` when a person read the output, `auto-pass` when only the automated checks ran and found nothing, and `fail` when a check fired.
- For decode, `output` is the summary, then ` | `, then the per-sentence lines joined with ` || `.
- `ai.output` is the raw model text. `ai.grade` grades that raw text.
- `ai.shown` is what the page shows in AI mode: the AI text when it passes the checks, the Instant text otherwise. `ai.shown_grade` grades that. For decode, lines marked `[I]` came from Instant.
- `ai.gate` says whether the page would show the AI text (`ok`) or fall back to Instant, and why (`meaning`, `drift`, `idiom`, `crude`, `empty`, `guard`, `unsafe`). For decode it is `lines-only` when some AI lines are shown, or `fallback`.
- `ai.fewshot` is `retrieval` (the nearest hand-written examples, minus the item itself) or `fixed`.
- Decode summaries in AI mode come from Instant. The 0.5B model's summaries made up offices, locations and denials too often in this round, so the page shows only AI lines that pass `decodeTextFails` in `site/ai-guard.js`. The raw AI summary is still in `ai.output` for training.
- The grader re-runs the current gates on the stored model text, so a gate change does not need a new model run. Hand labels live in `labels-ai.tsv`, `labels-instant-before.tsv` and `labels-instant-after.tsv` next to the runs.

## Held-out rows, October 2026

`src/normal-holdout-1.txt` to `src/normal-holdout-4.txt` add 566 Normal to Corporate rows that were first written as held-out test sets (`holdout.jsonl`, `fresh.jsonl`, `fresh2.jsonl`, `fresh3.jsonl`) and hand-graded in `project-synergy-research/shortfalls`. They are in `items.json` and `site/examples.js` now, so they are training data and no longer held out. Write a new batch for the next honest measurement. `dataset.jsonl` still covers the original 1,003 inputs.

## Using it

- Fine-tuning: use `input` plus the level as the prompt and `ideal_output` as the target. Leave out rows whose input you plan to test on.
- Few-shot: pick two or three rows from the same category and level and put `input` and `ideal_output` in the prompt as user and assistant turns.
- Retrieval: `retrieval.mjs` returns the nearest hand-written examples for the new input and level. `scripts/variations-ai.mjs --fewshot retrieval` uses it.
- Evaluation: `ideal_output` is one good answer, not the only one. Word overlap with it is a rough signal. The pass and fail grades come from the checks and a person reading the output.

## Regenerating

```
node tests/variations/build.mjs
node scripts/variations-eval.mjs <tag>
node scripts/variations-ai.mjs --dir toCorporate --out runs/<tag>.s0.jsonl --shard 0/3
node scripts/variations-grade.mjs --instant <tag> --ai <ai-tags> --dec <decode-ai-tags>   # first tag of each is written to dataset.jsonl
```

The eval and AI scripts write to `/workspace/project-synergy-research/variations/`, outside the repo.

## Ideal change, October 2026

The Mild and Middle Manager ideals for plain-to-corporate were too plain. Many were the input with the spelling fixed ("I'm going to be late sorry."). On 448 of the 652 items the hand-written ideal was run through the new level rules (site/register.js) and the result kept if it changed the text, passed the meaning check and was not a tidy copy of the input: 381 Mild, 167 Middle Manager and 69 Full C-Suite ideals. Full C-Suite was only changed where it read the same as Middle Manager. In dataset.jsonl each changed level keeps the old text in `ideal_output_before`. The `instant` and `ai` grades there are still from run r20, before the change. The level spec is in project-synergy-research/corporate-levels/research.md, and every change is listed in corporate-levels/ideal-changes.tsv.
