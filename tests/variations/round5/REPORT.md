# Round 5: stricter meaning checks, flan-t5-base fine-tune, hybrid test

Decision: the model is not deployed. On the fair batch, the hybrid beat Instant by about 3 points at Mild and Middle, came out 1.6 points behind at C-Suite, and showed one meaning change. The new checks and this research are committed.

## 1. Meaning checks for model output (`site/faithful.js` modelGate, `site/meaning.js`)
New checks: polarity flip (a complaint turned into praise, or praise turned into bad news, with sarcasm cues exempt), numbers with units (20 late can become 20 minutes, never 20 miles), weekdays including sat/sun, a request turned into "I'll ...", "quit X" turned into "keep X", "pass on" turned into "please pass on", lost uncertainty ("no clue how"), "It was driving" style subject swaps, and dropped key content words (the words both the input and Instant keep, with a synonym list). These run on top of the existing checkMeaning, crude and idiom checks. AI mode's aiCorporateGate now runs the polarity, unit, day and request checks too.

Hand labels: 294 round-4 outputs (flan-t5-small and SmolLM2-135M on fresh5), 51 of them with wrong or unsafe meaning (`labels-r4.json`).

| gate | precision (rejects that were bad) | recall (bad caught) | good outputs rejected |
|---|---|---|---|
| old aiCorporateGate | 19.6% | 88.2% | 76.1% |
| new modelGate | 75.0% | 94.1% | 6.6% |

Still missed: "like champs" became "as well", "garbage" became "very low", and "Jira" became "the Jira team". Caveats: one grader, and the checks were developed on these same labels, so recall is optimistic. On the unseen fresh6 batch, about 23 model outputs with wrong meaning still passed (roughly 80% recall there). The gate also rejects 25.9% of the hand-written ideals, mostly as "dropped" (the ideals paraphrase), so it is strict about paraphrasing.

## 2. Training
flan-t5-base (248M, Apache-2.0), full fine-tune on CPU (8 cores), AdamW lr 3e-4 with linear decay, batch 16, 3 epochs = 785 steps. That took about 23 minutes, with resumable checkpoints every 60 steps (`scripts/finetune/train_base.py`). Data: all 1,396 Normal to Corporate inputs in items.json (dataset ideals plus fresh1 to fresh5) x 3 levels = 4,188 pairs. Input format: `Rewrite as {mild|middle manager|full c-suite} corporate speak: ...`. Export: `scripts/finetune/pipeline.sh` (needs tie_word_embeddings=false, or the export comes out as garbage). Then dynamic uint8 and chunks of 24 MiB or less, so every file fits the Pages limit of 25 MiB per file. Result: 264 MB in 14 files, and Transformers.js 4.3.1 loads it (use_external_data_format chunks), at about 125 ms per output in Node on 8 threads.

## 3. Fair batch fresh6 (128 unseen messages, written and deduplicated before any model output was seen)
Instant was graded before the model existed, then the model and the hybrid were graded (strict, one grader). The hybrid rule was fixed before grading (`site/pick.js`): model output only if modelGate passes, it isn't flat at Middle or C-Suite, and it scores higher than Instant on the level's corporate word list.

| level | Instant | model alone | hybrid | model picked | best of both (upper bound) |
|---|---|---|---|---|---|
| Mild | 64.8% | 68.0% | 68.0% | 30 | 83.6% |
| Middle | 61.7% | 50.0% | 64.8% | 14 | 75.0% |
| C-Suite | 63.3% | 10.9% | 61.7% | 8 | 65.6% |

The model writes clean, polite Mild text. It fixes Instant's comma splices, casing and dropped subjects. But it collapses the three levels into one: its C-Suite is almost never C-Suite. Its risky errors are invented or misspelled names (DVD for NDA, Benn, Ravael, Gimbio), meaning flips ("so done with this client" became "fully committed to this client"), "Unfortunately" on good news, and invented facts ("last day at work", "re-writing the postmortem"). The gate caught the names and most of the inventions. Of the outputs the hybrid actually picked, one changed the meaning ("need a mental health day" became "I'd suggest we take a mental health day"), and two had the wrong tone ("recognize" framing on a budget cut, and "nothing says teamwork" sarcasm kept).

Keep fresh6 out of training so the next model can be measured on it.

## 4. Next step
Use the model for Mild only, as a grammar and tone fixer. Instant keeps the C-Suite framing: run the model at Mild, then let Instant add the Middle and C-Suite frames to the model's clean sentence. That targets Instant's biggest unseen failure class (splices, casing, missing subjects), which the model handles well. Before showing any model text, add a sentiment check for neutral numeric news (4s to 1.2s) and an "I need" vs "we should" check. Then measure on a fresh batch 7 written after the change.
