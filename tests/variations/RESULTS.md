# Project Synergy variation round, final summary (Oct 22, 2026, ~7:10 PM ET)

Dataset: 1,003 inputs (652 plain-to-corporate, 351 corporate-to-plain), 3 levels each, 3,009 outputs per engine, every level has an ideal_output.
Production: deployment 4a66a68c, live check 60/60 pass (Instant both directions plus 15 AI-mode runs; on N>C the AI text often falls back to Instant, labeled).

## Corporate levels round (Oct 22, 2026, evening)
Mild and Middle Manager used to read like tidied copies of the input. They now follow the level spec in the research notes: Mild is a polished work email (indirect asks, hedged opinions, softer refusals), and Middle Manager adds labels, nominalization and mid-tier jargon. Every level still keeps every no, question, number, name and date, and adds no facts.
- Hand reads of Mild and Middle Manager (150 rows, 300 outputs each, graded strictly for sense, meaning, work safety, level register and nothing invented): 87.3%, 89.3%, 84.3%, 86.7%, 90.3%. Round 3 used a stricter reader than rounds 1 and 2. Round 5 used the last 52 unread rows plus 98 earlier rows at reroll seed 3, because the fresh rows ran out. The 95% target was not reached.
- After each round, the failure classes were fixed and covered by tests in tests/levels.test.js.
- Spot checks: 50 Full C-Suite outputs had no regressions, and 0 of 1,053 decode outputs changed.
- Production: deployment 34d5bf20, live check 60/60.

## Instant
- Before, hand-read sample: 41.8% of 423 outputs. Automated checks on all rows: 51.3% of 3,009.
- After (run r20): automated checks 100% of 3,009. Every flagged/hand-failed row was fixed and re-read.
- Independent random audits of the after runs: 146/150 (r12) and 148/150 (r16); all 6 misses fixed since.

## AI mode (Qwen2.5-0.5B, what the page shows = AI if it passes the gates, else Instant)
- Plain to corporate, before: raw automated 76.0% (no hand reads). After: raw model hand-read 40.2% of 743; page shows 96.5% of 743 hand-read rows pass; AI text shown on 13.4% of rows, 77.8% of shown AI text passes.
- With retrieval (closest examples from the set): raw hand-read 49.0% of 261, page 93.9%. Paired comparison 66.7% vs 54.1% (135 rows): kept.
- Corporate to plain, before: shown pass ~38% (23/60 hand-read sample), raw automated 60.3%. After: raw hand-read 75.6% of 180, page 90.6% of 180 (page now always uses the Instant summary; AI lines only when they pass checks).
- Qwen3-0.6B: 44.4% vs Qwen2.5 54.1% on 135 paired rows, ~2.2x slower: kept Qwen2.5. SmolLM 30% vs 55%. Qwen3 decode run stopped at 264 of the subset outputs, automated 49.6%.

## Weakest categories
- Instant before: decode pip, rejection, departure, benefits, press (0/3 each); corporate feedback, it-tech, one-liners.
- AI raw after: vent 26.7%, one-liner 31.6%, sarcasm 33.3%, late-sick-pto 38.3%.
- Page after: decode pip 80%, rejection 80%; corporate one-liner 93.1%, polite 93.3%.

Full breakdown follows.

Variation round grades. Generated Thu Oct 22 2026 18:58:30 GMT-0400 (Eastern Daylight Time)
Dataset: 652 plain-to-corporate and 351 corporate-to-plain inputs, 3 levels each (3009 outputs per engine).
A row passes when the automated checks (crude words, meaning check, idioms, garbling, added sentences at Mild/Middle, lost numbers/names/dates/question marks, decode signal and echo) find nothing and the hand label is not a fail.

== Instant, hand-read rows (headline numbers) ==
Instant BEFORE (hand-read sample): 41.8% of 423 outputs (L1 46.8%, L2 26.2%, L3 52.5%)
  by direction: N>C 67/246 27.2%, C>N 110/177 62.1%
  C>N acquisition                     3/3    100.0%
  C>N ai                              3/3    100.0%
  C>N atlas                           0/3    0.0%
  C>N benefits                        0/3    0.0%
  C>N budget-freeze                   3/3    100.0%
  C>N cost-cuts                       3/3    100.0%
  C>N deflection                      3/6    50.0%
  C>N delay                           3/6    50.0%
  C>N departure                       0/3    0.0%
  C>N email                           9/18   50.0%
  C>N fluff                           3/6    50.0%
  C>N hiring-freeze                   6/6    100.0%
  C>N layoff-you                      6/6    100.0%
  C>N layoffs                         3/9    33.3%
  C>N linkedin                        3/3    100.0%
  C>N memo                            9/12   75.0%
  C>N mixed                           3/15   20.0%
  C>N new-chapter                     3/3    100.0%
  C>N no-raises                       2/3    66.7%
  C>N none                           12/12   100.0%
  C>N outsourcing                     6/6    100.0%
  C>N performance                     6/6    100.0%
  C>N pip                             0/3    0.0%
  C>N press                           0/3    0.0%
  C>N record-year                     3/3    100.0%
  C>N rejection                       0/3    0.0%
  C>N reorg                           3/6    50.0%
  C>N rto                             3/3    100.0%
  C>N shutdown                        3/6    50.0%
  C>N slack                           3/6    50.0%
  C>N stack-rank                      6/6    100.0%
  N>C announcement                    2/3    66.7%
  N>C apology                         1/3    33.3%
  N>C coordination                    1/3    33.3%
  N>C crude                           5/27   18.5%
  N>C customer                        2/6    33.3%
  N>C customer-sales                  1/3    33.3%
  N>C deadline-blocker                3/9    33.3%
  N>C decline                         4/6    66.7%
  N>C feedback                        0/6    0.0%
  N>C hr-people                       1/3    33.3%
  N>C it-tech                         0/3    0.0%
  N>C late-sick-pto                   2/6    33.3%
  N>C list                            1/6    16.7%
  N>C misc-work                       5/12   41.7%
  N>C money                           1/3    33.3%
  N>C numbers-names-dates             3/9    33.3%
  N>C one-liner                       7/27   25.9%
  N>C polite                          4/6    66.7%
  N>C pushback                        4/12   33.3%
  N>C question                        1/15   6.7%
  N>C rant                            1/3    33.3%
  N>C remote-office                   0/3    0.0%
  N>C request                         3/12   25.0%
  N>C sarcasm                         5/12   41.7%
  N>C scheduling                      0/6    0.0%
  N>C status                          5/12   41.7%
  N>C typos-slang-emoji               0/18   0.0%
  N>C vent                            3/6    50.0%
  N>C vent-multi                      2/6    33.3%
Instant AFTER (hand-read rows): 100.0% of 2775 outputs (L1 100.0%, L2 100.0%, L3 100.0%)
  by direction: N>C 1956/1956 100.0%, C>N 819/819 100.0%
  C>N acquisition                    11/11   100.0%
  C>N ai                             18/18   100.0%
  C>N atlas                          11/11   100.0%
  C>N benefits                       17/17   100.0%
  C>N budget-freeze                  21/21   100.0%
  C>N cost-cuts                      21/21   100.0%
  C>N deflection                     24/24   100.0%
  C>N delay                          22/22   100.0%
  C>N departure                      14/14   100.0%
  C>N email                          74/74   100.0%
  C>N fluff                          22/22   100.0%
  C>N hiring-freeze                  20/20   100.0%
  C>N layoff-you                     28/28   100.0%
  C>N layoffs                        31/31   100.0%
  C>N linkedin                       25/25   100.0%
  C>N memo                           63/63   100.0%
  C>N mixed                          70/70   100.0%
  C>N new-chapter                    21/21   100.0%
  C>N no-raises                      17/17   100.0%
  C>N none                           58/58   100.0%
  C>N outsourcing                    24/24   100.0%
  C>N performance                    17/17   100.0%
  C>N pip                            24/24   100.0%
  C>N press                          10/10   100.0%
  C>N record-year                    11/11   100.0%
  C>N rejection                      25/25   100.0%
  C>N reorg                          21/21   100.0%
  C>N rto                            21/21   100.0%
  C>N shutdown                       22/22   100.0%
  C>N slack                          35/35   100.0%
  C>N stack-rank                     21/21   100.0%
  N>C announcement                   21/21   100.0%
  N>C apology                        18/18   100.0%
  N>C coordination                   24/24   100.0%
  N>C crude                         228/228  100.0%
  N>C customer                       57/57   100.0%
  N>C customer-sales                 24/24   100.0%
  N>C deadline-blocker               57/57   100.0%
  N>C decline                        60/60   100.0%
  N>C feedback                       45/45   100.0%
  N>C hr-people                      42/42   100.0%
  N>C it-tech                        30/30   100.0%
  N>C late-sick-pto                  60/60   100.0%
  N>C list                           42/42   100.0%
  N>C misc-work                      90/90   100.0%
  N>C money                          21/21   100.0%
  N>C numbers-names-dates            75/75   100.0%
  N>C one-liner                     198/198  100.0%
  N>C polite                         60/60   100.0%
  N>C praise                         15/15   100.0%
  N>C pushback                       81/81   100.0%
  N>C question                      111/111  100.0%
  N>C rant                           24/24   100.0%
  N>C remote-office                  24/24   100.0%
  N>C request                        84/84   100.0%
  N>C run-on                         24/24   100.0%
  N>C sarcasm                        78/78   100.0%
  N>C scheduling                     30/30   100.0%
  N>C status                        102/102  100.0%
  N>C typos-slang-emoji             135/135  100.0%
  N>C vent                           60/60   100.0%
  N>C vent-multi                     36/36   100.0%

== Instant, automated checks on every row ==
Instant BEFORE automated: 51.3% of 3009 outputs (L1 54.8%, L2 22.9%, L3 76.1%)
  by direction: N>C 925/1956 47.3%, C>N 618/1053 58.7%
  C>N acquisition                    12/15   80.0%
  C>N ai                             24/24   100.0%
  C>N atlas                          12/15   80.0%
  C>N benefits                        0/21   0.0%
  C>N budget-freeze                   3/27   11.1%
  C>N cost-cuts                       9/27   33.3%
  C>N deflection                     24/30   80.0%
  C>N delay                          15/30   50.0%
  C>N departure                      12/18   66.7%
  C>N email                          33/96   34.4%
  C>N fluff                          30/30   100.0%
  C>N hiring-freeze                   9/24   37.5%
  C>N layoff-you                     30/36   83.3%
  C>N layoffs                        21/39   53.8%
  C>N linkedin                       15/33   45.5%
  C>N memo                           48/81   59.3%
  C>N mixed                          51/90   56.7%
  C>N new-chapter                    27/27   100.0%
  C>N no-raises                      15/21   71.4%
  C>N none                           66/72   91.7%
  C>N outsourcing                    15/30   50.0%
  C>N performance                    15/21   71.4%
  C>N pip                            12/30   40.0%
  C>N press                           3/12   25.0%
  C>N record-year                    15/15   100.0%
  C>N rejection                      15/33   45.5%
  C>N reorg                          15/27   55.6%
  C>N rto                            15/27   55.6%
  C>N shutdown                       15/30   50.0%
  C>N slack                          24/45   53.3%
  C>N stack-rank                     18/27   66.7%
  N>C announcement                   11/21   52.4%
  N>C apology                        10/18   55.6%
  N>C coordination                    9/24   37.5%
  N>C crude                         107/228  46.9%
  N>C customer                       30/57   52.6%
  N>C customer-sales                 12/24   50.0%
  N>C deadline-blocker               30/57   52.6%
  N>C decline                        36/60   60.0%
  N>C feedback                       21/45   46.7%
  N>C hr-people                      20/42   47.6%
  N>C it-tech                        11/30   36.7%
  N>C late-sick-pto                  32/60   53.3%
  N>C list                           22/42   52.4%
  N>C misc-work                      44/90   48.9%
  N>C money                           7/21   33.3%
  N>C numbers-names-dates            36/75   48.0%
  N>C one-liner                     100/198  50.5%
  N>C polite                         34/60   56.7%
  N>C praise                          9/15   60.0%
  N>C pushback                       43/81   53.1%
  N>C question                        9/111  8.1%
  N>C rant                           15/24   62.5%
  N>C remote-office                  10/24   41.7%
  N>C request                        29/84   34.5%
  N>C run-on                         15/24   62.5%
  N>C sarcasm                        44/78   56.4%
  N>C scheduling                      7/30   23.3%
  N>C status                         54/102  52.9%
  N>C typos-slang-emoji              59/135  43.7%
  N>C vent                           36/60   60.0%
  N>C vent-multi                     23/36   63.9%
Instant AFTER automated: 100.0% of 3009 outputs (L1 100.0%, L2 100.0%, L3 100.0%)
  by direction: N>C 1956/1956 100.0%, C>N 1053/1053 100.0%
  C>N acquisition                    15/15   100.0%
  C>N ai                             24/24   100.0%
  C>N atlas                          15/15   100.0%
  C>N benefits                       21/21   100.0%
  C>N budget-freeze                  27/27   100.0%
  C>N cost-cuts                      27/27   100.0%
  C>N deflection                     30/30   100.0%
  C>N delay                          30/30   100.0%
  C>N departure                      18/18   100.0%
  C>N email                          96/96   100.0%
  C>N fluff                          30/30   100.0%
  C>N hiring-freeze                  24/24   100.0%
  C>N layoff-you                     36/36   100.0%
  C>N layoffs                        39/39   100.0%
  C>N linkedin                       33/33   100.0%
  C>N memo                           81/81   100.0%
  C>N mixed                          90/90   100.0%
  C>N new-chapter                    27/27   100.0%
  C>N no-raises                      21/21   100.0%
  C>N none                           72/72   100.0%
  C>N outsourcing                    30/30   100.0%
  C>N performance                    21/21   100.0%
  C>N pip                            30/30   100.0%
  C>N press                          12/12   100.0%
  C>N record-year                    15/15   100.0%
  C>N rejection                      33/33   100.0%
  C>N reorg                          27/27   100.0%
  C>N rto                            27/27   100.0%
  C>N shutdown                       30/30   100.0%
  C>N slack                          45/45   100.0%
  C>N stack-rank                     27/27   100.0%
  N>C announcement                   21/21   100.0%
  N>C apology                        18/18   100.0%
  N>C coordination                   24/24   100.0%
  N>C crude                         228/228  100.0%
  N>C customer                       57/57   100.0%
  N>C customer-sales                 24/24   100.0%
  N>C deadline-blocker               57/57   100.0%
  N>C decline                        60/60   100.0%
  N>C feedback                       45/45   100.0%
  N>C hr-people                      42/42   100.0%
  N>C it-tech                        30/30   100.0%
  N>C late-sick-pto                  60/60   100.0%
  N>C list                           42/42   100.0%
  N>C misc-work                      90/90   100.0%
  N>C money                          21/21   100.0%
  N>C numbers-names-dates            75/75   100.0%
  N>C one-liner                     198/198  100.0%
  N>C polite                         60/60   100.0%
  N>C praise                         15/15   100.0%
  N>C pushback                       81/81   100.0%
  N>C question                      111/111  100.0%
  N>C rant                           24/24   100.0%
  N>C remote-office                  24/24   100.0%
  N>C request                        84/84   100.0%
  N>C run-on                         24/24   100.0%
  N>C sarcasm                        78/78   100.0%
  N>C scheduling                     30/30   100.0%
  N>C status                        102/102  100.0%
  N>C typos-slang-emoji             135/135  100.0%
  N>C vent                           60/60   100.0%
  N>C vent-multi                     36/36   100.0%
Mean word overlap with ideal_output: before 0.259, after 0.368
Hand-read: before 423 outputs, after 2775 outputs.

== AI run q25-corp-before: 1956 outputs, 0 hand-read ==
q25-corp-before raw model output, hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
q25-corp-before raw model output, automated only, all rows: 76.0% of 1956 outputs (L1 81.6%, L2 81.6%, L3 64.7%)
  by direction: N>C 1486/1956 76.0%
  N>C announcement                   12/21   57.1%
  N>C apology                        17/18   94.4%
  N>C coordination                   20/24   83.3%
  N>C crude                         171/228  75.0%
  N>C customer                       49/57   86.0%
  N>C customer-sales                 19/24   79.2%
  N>C deadline-blocker               47/57   82.5%
  N>C decline                        39/60   65.0%
  N>C feedback                       43/45   95.6%
  N>C hr-people                      40/42   95.2%
  N>C it-tech                        29/30   96.7%
  N>C late-sick-pto                  46/60   76.7%
  N>C list                           11/42   26.2%
  N>C misc-work                      79/90   87.8%
  N>C money                          16/21   76.2%
  N>C numbers-names-dates            39/75   52.0%
  N>C one-liner                     113/198  57.1%
  N>C polite                         56/60   93.3%
  N>C praise                         13/15   86.7%
  N>C pushback                       72/81   88.9%
  N>C question                       81/111  73.0%
  N>C rant                           17/24   70.8%
  N>C remote-office                  15/24   62.5%
  N>C request                        63/84   75.0%
  N>C run-on                         19/24   79.2%
  N>C sarcasm                        65/78   83.3%
  N>C scheduling                     23/30   76.7%
  N>C status                         83/102  81.4%
  N>C typos-slang-emoji             113/135  83.7%
  N>C vent                           53/60   88.3%
  N>C vent-multi                     23/36   63.9%
q25-corp-before what the page shows (AI if it passes the gates, else Instant), hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
  gates: empty=65 drift=1050 ok=248 flat=103 crude=11 meaning=319 idiom=160
  AI shown on 12.7% of rows; hand-read pass rate of the AI text that gets shown: n/a (0 rows)
  mean overlap with ideal_output 0.363

== AI run q25-corp-after: 1956 outputs, 743 hand-read ==
q25-corp-after raw model output, hand-read rows: 40.2% of 743 outputs (L1 50.4%, L2 47.2%, L3 23.1%)
  by direction: N>C 299/743 40.2%
  N>C crude                          28/66   42.4%
  N>C decline                        18/45   40.0%
  N>C late-sick-pto                  23/60   38.3%
  N>C one-liner                      55/174  31.6%
  N>C polite                          8/15   53.3%
  N>C pushback                       33/60   55.0%
  N>C question                       29/75   38.7%
  N>C request                        28/60   46.7%
  N>C sarcasm                        13/39   33.3%
  N>C status                         43/81   53.1%
  N>C typos-slang-emoji               9/23   39.1%
  N>C vent                           12/45   26.7%
q25-corp-after raw model output, automated only, all rows: 76.7% of 1956 outputs (L1 83.1%, L2 81.3%, L3 65.8%)
  by direction: N>C 1501/1956 76.7%
  N>C announcement                   11/21   52.4%
  N>C apology                        17/18   94.4%
  N>C coordination                   20/24   83.3%
  N>C crude                         185/228  81.1%
  N>C customer                       49/57   86.0%
  N>C customer-sales                 20/24   83.3%
  N>C deadline-blocker               44/57   77.2%
  N>C decline                        41/60   68.3%
  N>C feedback                       42/45   93.3%
  N>C hr-people                      41/42   97.6%
  N>C it-tech                        29/30   96.7%
  N>C late-sick-pto                  49/60   81.7%
  N>C list                           11/42   26.2%
  N>C misc-work                      77/90   85.6%
  N>C money                          18/21   85.7%
  N>C numbers-names-dates            36/75   48.0%
  N>C one-liner                     127/198  64.1%
  N>C polite                         55/60   91.7%
  N>C praise                         13/15   86.7%
  N>C pushback                       72/81   88.9%
  N>C question                       73/111  65.8%
  N>C rant                           16/24   66.7%
  N>C remote-office                  16/24   66.7%
  N>C request                        58/84   69.0%
  N>C run-on                         18/24   75.0%
  N>C sarcasm                        64/78   82.1%
  N>C scheduling                     24/30   80.0%
  N>C status                         82/102  80.4%
  N>C typos-slang-emoji             118/135  87.4%
  N>C vent                           52/60   86.7%
  N>C vent-multi                     23/36   63.9%
q25-corp-after what the page shows (AI if it passes the gates, else Instant), hand-read rows: 96.5% of 743 outputs (L1 96.0%, L2 97.6%, L3 96.0%)
  by direction: N>C 717/743 96.5%
  N>C crude                          64/66   97.0%
  N>C decline                        45/45   100.0%
  N>C late-sick-pto                  59/60   98.3%
  N>C one-liner                     162/174  93.1%
  N>C polite                         14/15   93.3%
  N>C pushback                       59/60   98.3%
  N>C question                       72/75   96.0%
  N>C request                        59/60   98.3%
  N>C sarcasm                        37/39   94.9%
  N>C status                         79/81   97.5%
  N>C typos-slang-emoji              22/23   95.7%
  N>C vent                           45/45   100.0%
  gates: empty=49 ok=263 drift=1040 meaning=320 crude=12 flat=108 idiom=164
  AI shown on 13.4% of rows; hand-read pass rate of the AI text that gets shown: 77.8% (117 rows)
  mean overlap with ideal_output 0.370

== AI run q3-corp: 489 outputs, 156 hand-read ==
q3-corp raw model output, hand-read rows: 32.1% of 156 outputs (L1 44.2%, L2 36.5%, L3 15.4%)
  by direction: N>C 50/156 32.1%
  N>C crude                           5/21   23.8%
  N>C deadline-blocker                0/3    0.0%
  N>C decline                         3/9    33.3%
  N>C late-sick-pto                   3/9    33.3%
  N>C one-liner                       6/30   20.0%
  N>C polite                          3/9    33.3%
  N>C pushback                        3/12   25.0%
  N>C question                        6/12   50.0%
  N>C request                         4/12   33.3%
  N>C sarcasm                         2/6    33.3%
  N>C status                          6/12   50.0%
  N>C typos-slang-emoji               8/15   53.3%
  N>C vent                            1/6    16.7%
q3-corp raw model output, automated only, all rows: 74.0% of 489 outputs (L1 79.8%, L2 78.5%, L3 63.8%)
  by direction: N>C 362/489 74.0%
  N>C announcement                    3/6    50.0%
  N>C apology                         3/3    100.0%
  N>C coordination                    5/6    83.3%
  N>C crude                          43/57   75.4%
  N>C customer                       12/15   80.0%
  N>C customer-sales                  6/6    100.0%
  N>C deadline-blocker                7/15   46.7%
  N>C decline                         8/15   53.3%
  N>C feedback                       12/12   100.0%
  N>C hr-people                       7/9    77.8%
  N>C it-tech                         8/9    88.9%
  N>C late-sick-pto                  14/15   93.3%
  N>C list                            4/9    44.4%
  N>C misc-work                      20/24   83.3%
  N>C money                           2/3    66.7%
  N>C numbers-names-dates            11/18   61.1%
  N>C one-liner                      41/51   80.4%
  N>C polite                         12/15   80.0%
  N>C praise                          2/3    66.7%
  N>C pushback                       16/21   76.2%
  N>C question                       12/27   44.4%
  N>C rant                            4/6    66.7%
  N>C remote-office                   5/6    83.3%
  N>C request                         7/21   33.3%
  N>C run-on                          3/3    100.0%
  N>C sarcasm                        16/21   76.2%
  N>C scheduling                      7/9    77.8%
  N>C status                         21/27   77.8%
  N>C typos-slang-emoji              34/36   94.4%
  N>C vent                           10/12   83.3%
  N>C vent-multi                      7/9    77.8%
q3-corp what the page shows (AI if it passes the gates, else Instant), hand-read rows: 95.5% of 156 outputs (L1 94.2%, L2 96.2%, L3 96.2%)
  by direction: N>C 149/156 95.5%
  N>C crude                          18/21   85.7%
  N>C deadline-blocker                3/3    100.0%
  N>C decline                         9/9    100.0%
  N>C late-sick-pto                   9/9    100.0%
  N>C one-liner                      29/30   96.7%
  N>C polite                          9/9    100.0%
  N>C pushback                       11/12   91.7%
  N>C question                       12/12   100.0%
  N>C request                        12/12   100.0%
  N>C sarcasm                         6/6    100.0%
  N>C status                         12/12   100.0%
  N>C typos-slang-emoji              15/15   100.0%
  N>C vent                            4/6    66.7%
  gates: meaning=95 empty=15 drift=230 ok=95 flat=24 idiom=30
  AI shown on 19.4% of rows; hand-read pass rate of the AI text that gets shown: 76.7% (30 rows)
  mean overlap with ideal_output 0.365

== AI run q25rag-corp: 1956 outputs, 261 hand-read ==
q25rag-corp raw model output, hand-read rows: 49.0% of 261 outputs (L1 69.0%, L2 51.7%, L3 26.4%)
  by direction: N>C 128/261 49.0%
  N>C crude                          12/30   40.0%
  N>C customer                        2/3    66.7%
  N>C deadline-blocker                1/6    16.7%
  N>C decline                         8/12   66.7%
  N>C feedback                        3/6    50.0%
  N>C hr-people                       2/3    66.7%
  N>C late-sick-pto                  11/15   73.3%
  N>C list                            0/3    0.0%
  N>C numbers-names-dates             2/6    33.3%
  N>C one-liner                      11/45   24.4%
  N>C polite                          6/12   50.0%
  N>C pushback                       11/15   73.3%
  N>C question                        8/18   44.4%
  N>C rant                            0/3    0.0%
  N>C request                        11/15   73.3%
  N>C sarcasm                         5/12   41.7%
  N>C scheduling                      2/3    66.7%
  N>C status                         16/21   76.2%
  N>C typos-slang-emoji              12/24   50.0%
  N>C vent                            5/9    55.6%
q25rag-corp raw model output, automated only, all rows: 78.2% of 1956 outputs (L1 89.6%, L2 86.5%, L3 58.6%)
  by direction: N>C 1530/1956 78.2%
  N>C announcement                   14/21   66.7%
  N>C apology                        17/18   94.4%
  N>C coordination                   22/24   91.7%
  N>C crude                         204/228  89.5%
  N>C customer                       47/57   82.5%
  N>C customer-sales                 19/24   79.2%
  N>C deadline-blocker               46/57   80.7%
  N>C decline                        45/60   75.0%
  N>C feedback                       40/45   88.9%
  N>C hr-people                      36/42   85.7%
  N>C it-tech                        27/30   90.0%
  N>C late-sick-pto                  47/60   78.3%
  N>C list                           12/42   28.6%
  N>C misc-work                      77/90   85.6%
  N>C money                          18/21   85.7%
  N>C numbers-names-dates            45/75   60.0%
  N>C one-liner                     132/198  66.7%
  N>C polite                         46/60   76.7%
  N>C praise                         12/15   80.0%
  N>C pushback                       69/81   85.2%
  N>C question                       81/111  73.0%
  N>C rant                           11/24   45.8%
  N>C remote-office                  16/24   66.7%
  N>C request                        69/84   82.1%
  N>C run-on                         18/24   75.0%
  N>C sarcasm                        63/78   80.8%
  N>C scheduling                     22/30   73.3%
  N>C status                         83/102  81.4%
  N>C typos-slang-emoji             114/135  84.4%
  N>C vent                           51/60   85.0%
  N>C vent-multi                     27/36   75.0%
q25rag-corp what the page shows (AI if it passes the gates, else Instant), hand-read rows: 93.9% of 261 outputs (L1 96.6%, L2 93.1%, L3 92.0%)
  by direction: N>C 245/261 93.9%
  N>C crude                          27/30   90.0%
  N>C customer                        3/3    100.0%
  N>C deadline-blocker                6/6    100.0%
  N>C decline                        12/12   100.0%
  N>C feedback                        5/6    83.3%
  N>C hr-people                       3/3    100.0%
  N>C late-sick-pto                  15/15   100.0%
  N>C list                            3/3    100.0%
  N>C numbers-names-dates             6/6    100.0%
  N>C one-liner                      40/45   88.9%
  N>C polite                         11/12   91.7%
  N>C pushback                       15/15   100.0%
  N>C question                       18/18   100.0%
  N>C rant                            2/3    66.7%
  N>C request                        15/15   100.0%
  N>C sarcasm                        11/12   91.7%
  N>C scheduling                      3/3    100.0%
  N>C status                         19/21   90.5%
  N>C typos-slang-emoji              22/24   91.7%
  N>C vent                            9/9    100.0%
  gates: empty=48 ok=613 drift=678 flat=284 meaning=216 idiom=111 crude=4 rude=2
  AI shown on 31.3% of rows; hand-read pass rate of the AI text that gets shown: 80.2% (81 rows)
  mean overlap with ideal_output 0.503

== AI run q25-dec-before: 1053 outputs, 0 hand-read ==
q25-dec-before raw model output, hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
q25-dec-before raw model output, automated only, all rows: 60.3% of 1053 outputs (L1 61.8%, L2 59.0%, L3 60.1%)
  by direction: C>N 635/1053 60.3%
  C>N acquisition                     9/15   60.0%
  C>N ai                             23/24   95.8%
  C>N atlas                           5/15   33.3%
  C>N benefits                        2/21   9.5%
  C>N budget-freeze                   4/27   14.8%
  C>N cost-cuts                      15/27   55.6%
  C>N deflection                      9/30   30.0%
  C>N delay                          19/30   63.3%
  C>N departure                      11/18   61.1%
  C>N email                          42/96   43.8%
  C>N fluff                          30/30   100.0%
  C>N hiring-freeze                   7/24   29.2%
  C>N layoff-you                     20/36   55.6%
  C>N layoffs                        34/39   87.2%
  C>N linkedin                       19/33   57.6%
  C>N memo                           54/81   66.7%
  C>N mixed                          45/90   50.0%
  C>N new-chapter                    18/27   66.7%
  C>N no-raises                      19/21   90.5%
  C>N none                           64/72   88.9%
  C>N outsourcing                    14/30   46.7%
  C>N performance                    16/21   76.2%
  C>N pip                            14/30   46.7%
  C>N press                           3/12   25.0%
  C>N record-year                    12/15   80.0%
  C>N rejection                      23/33   69.7%
  C>N reorg                          20/27   74.1%
  C>N rto                            13/27   48.1%
  C>N shutdown                       19/30   63.3%
  C>N slack                          32/45   71.1%
  C>N stack-rank                     20/27   74.1%
q25-dec-before what the page shows (AI if it passes the gates, else Instant), hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
  gates: lines-only=784 fallback=269
  AI shown on 0.0% of rows; hand-read pass rate of the AI text that gets shown: n/a (0 rows)
  mean overlap with ideal_output 0.107

== AI run q25-dec-after: 1053 outputs, 180 hand-read ==
q25-dec-after raw model output, hand-read rows: 75.6% of 180 outputs (L1 78.3%, L2 73.3%, L3 75.0%)
  by direction: C>N 136/180 75.6%
  C>N layoff-you                     20/36   55.6%
  C>N layoffs                        36/39   92.3%
  C>N outsourcing                    22/30   73.3%
  C>N pip                            23/30   76.7%
  C>N rejection                      12/15   80.0%
  C>N shutdown                       23/30   76.7%
q25-dec-after raw model output, automated only, all rows: 81.0% of 1053 outputs (L1 81.2%, L2 79.5%, L3 82.3%)
  by direction: C>N 853/1053 81.0%
  C>N acquisition                    10/15   66.7%
  C>N ai                             23/24   95.8%
  C>N atlas                           8/15   53.3%
  C>N benefits                       20/21   95.2%
  C>N budget-freeze                  17/27   63.0%
  C>N cost-cuts                      25/27   92.6%
  C>N deflection                     15/30   50.0%
  C>N delay                          23/30   76.7%
  C>N departure                      13/18   72.2%
  C>N email                          72/96   75.0%
  C>N fluff                          30/30   100.0%
  C>N hiring-freeze                  19/24   79.2%
  C>N layoff-you                     22/36   61.1%
  C>N layoffs                        38/39   97.4%
  C>N linkedin                       27/33   81.8%
  C>N memo                           65/81   80.2%
  C>N mixed                          68/90   75.6%
  C>N new-chapter                    17/27   63.0%
  C>N no-raises                      21/21   100.0%
  C>N none                           64/72   88.9%
  C>N outsourcing                    23/30   76.7%
  C>N performance                    19/21   90.5%
  C>N pip                            27/30   90.0%
  C>N press                          11/12   91.7%
  C>N record-year                    12/15   80.0%
  C>N rejection                      29/33   87.9%
  C>N reorg                          26/27   96.3%
  C>N rto                            21/27   77.8%
  C>N shutdown                       25/30   83.3%
  C>N slack                          38/45   84.4%
  C>N stack-rank                     25/27   92.6%
q25-dec-after what the page shows (AI if it passes the gates, else Instant), hand-read rows: 90.6% of 180 outputs (L1 91.7%, L2 90.0%, L3 90.0%)
  by direction: C>N 163/180 90.6%
  C>N layoff-you                     34/36   94.4%
  C>N layoffs                        37/39   94.9%
  C>N outsourcing                    28/30   93.3%
  C>N pip                            24/30   80.0%
  C>N rejection                      12/15   80.0%
  C>N shutdown                       28/30   93.3%
  gates: lines-only=780 fallback=273
  AI shown on 0.0% of rows; hand-read pass rate of the AI text that gets shown: n/a (0 rows)
  mean overlap with ideal_output 0.107

== AI run q3-dec: 264 outputs, 0 hand-read ==
q3-dec raw model output, hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
q3-dec raw model output, automated only, all rows: 49.6% of 264 outputs (L1 55.7%, L2 42.0%, L3 51.1%)
  by direction: C>N 131/264 49.6%
  C>N acquisition                     3/6    50.0%
  C>N ai                              2/6    33.3%
  C>N atlas                           1/3    33.3%
  C>N benefits                        3/3    100.0%
  C>N budget-freeze                   5/6    83.3%
  C>N cost-cuts                       6/6    100.0%
  C>N deflection                      1/9    11.1%
  C>N delay                           1/6    16.7%
  C>N departure                       1/6    16.7%
  C>N email                          13/24   54.2%
  C>N fluff                           9/9    100.0%
  C>N hiring-freeze                   6/6    100.0%
  C>N layoff-you                      3/9    33.3%
  C>N layoffs                         6/12   50.0%
  C>N linkedin                        1/6    16.7%
  C>N memo                            9/21   42.9%
  C>N mixed                          11/21   52.4%
  C>N new-chapter                     1/9    11.1%
  C>N no-raises                       5/6    83.3%
  C>N none                           12/18   66.7%
  C>N outsourcing                     1/6    16.7%
  C>N performance                     4/6    66.7%
  C>N pip                             1/6    16.7%
  C>N press                           0/3    0.0%
  C>N record-year                     2/3    66.7%
  C>N rejection                       8/9    88.9%
  C>N reorg                           1/6    16.7%
  C>N rto                             5/6    83.3%
  C>N shutdown                        1/9    11.1%
  C>N slack                           6/12   50.0%
  C>N stack-rank                      3/6    50.0%
q3-dec what the page shows (AI if it passes the gates, else Instant), hand-read rows: n/a of 0 outputs (L1 n/a, L2 n/a, L3 n/a)
  by direction: 
  gates: lines-only=235 fallback=29
  AI shown on 0.0% of rows; hand-read pass rate of the AI text that gets shown: n/a (0 rows)
  mean overlap with ideal_output 0.125

## r21, after the level fix (October 2026)

Instant on all 1,003 items (3,009 outputs): 0 meaning, safety or crude flags. The corporate ideals were revised (see README). Mean token similarity to the input for plain-to-corporate went from 0.87 / 0.80 / 0.40 (Mild / Middle Manager / Full C-Suite) to 0.68 / 0.59 / 0.39. Mild and Middle Manager were identical on 370 of 652 items before and are within 7% on 35 now.

## Round 16 (Oct 30, 2026): shipped rounds 14-15 plus fixes, deploy e473a815

Baseline is round 13 (52649a7, deploy fe79b062). Instant engine only (the in-browser AI engine can't run in node).

- Clean held-out fresh47, written and hashed before any engine run: 207 plain-to-corporate inputs x 3 levels, 208 decode memos (31 neutral, 24 good). Round 15's hold set (234 + 201) was also scored, but round 15 edited rules after first running it, so it is not clean for those changes.
- Plain to corporate, fresh47: 11 of 207 items changed vs round 13. Round 13 came back empty on 2 crude lines ("our ticketing tool is absolute dogshit", "this client is a pain in my ass every single week"); now 0 empty. 0 swear words in any output, either version.
- Decode, fresh47: 74.0% to 74.5% auto, false alarms on neutral and good 3/55 both. Hold-decode: 71.6% to 75.6%, false alarms 2/41 to 1/41.
- Dataset (items.json, 5,694 outputs): 41 flagged before and after, 0 new flags. All 69 changed rows were read by hand. That found 4 grammar regressions from the round 14-15 sarcasm and fragment code ("them decided", "Flagging that mandatory fun at 4pm", "that so we're", "the halfway is done") plus one decode regression (an access cut-off at 5 PM today read as a performance warning). All 5 were fixed with general rules and have tests.
- npm test 411/0, e2e 26/0, live-check 60/0.
