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
           ai: { model, output, grade, hand_read, flags, note, gate } or null }]
```

- `grade` is `pass` or `fail` when a person read the output, `auto-pass` when only the automated checks ran and found nothing, and `fail` when a check fired.
- For decode, `output` is the summary, then ` | `, then the per-sentence lines joined with ` || `.
- `ai.gate` says whether the page would show the AI text (`ok`) or fall back to Instant, and why (`meaning`, `drift`, `idiom`, `crude`, `empty`).

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
node scripts/variations-grade.mjs --instant <tag> --ai <ai-tags> --dec <decode-ai-tags>
```

The eval and AI scripts write to `/workspace/project-synergy-research/variations/`, outside the repo.
