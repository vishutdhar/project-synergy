// Runs Normal to corporate AI prompts in Node with the same generation settings and output checks as the browser.
// Usage: node scripts/ai-corporate-test.mjs [dtype] "text" ["text" ...]
import { pipeline, env, random, StoppingCriteria, LogitsProcessor } from "@huggingface/transformers";
import { MODEL_ID, buildCorporateMessages, firstLine, CORPORATE_EXAMPLE_ANSWERS } from "../site/ai-prompts.js";
import { guardOutput, generationOptions, repeatSettings, sampleSeed, makeLoopStop, makeRepeatGuard } from "../site/ai-guard.js";
import { toCorporate } from "../site/engine.js";

env.cacheDir = new URL("../.model-cache/", import.meta.url).pathname;
const [dtype = "q4f16", ...texts] = process.argv.slice(2);
const gen = await pipeline("text-generation", MODEL_ID, { dtype, device: "cpu" });
const LoopStop = makeLoopStop(StoppingCriteria);
const RepeatGuard = makeRepeatGuard(LogitsProcessor);

for (const text of texts) {
  for (const level of [1, 2, 3]) {
    random.seed(sampleSeed(text, level, Number(process.env.SEED ?? 1)));
    const opts = { ...generationOptions("corporate", gen.tokenizer.encode(text).length), ...JSON.parse(process.env.GEN_OVERRIDE ?? "{}") };
    const guard = process.env.NO_GUARD ? [] : [new RepeatGuard(repeatSettings("corporate"))];
    const t0 = Date.now();
    const raw = (await gen(buildCorporateMessages(text, level), { ...opts, logits_processor: guard, stopping_criteria: [new LoopStop()] }))[0].generated_text.at(-1).content;
    const checked = guardOutput(firstLine(raw.replace(/\n{2,}[\s\S]*$/, "").replace(/\n/g, " ")), { examples: CORPORATE_EXAMPLE_ANSWERS });
    console.log(`L${level} (${Date.now() - t0}ms, max ${opts.max_new_tokens}) ${checked.ok ? "AI" : "REJECTED, Instant"}: ${checked.ok ? checked.text : toCorporate(text, { level })}${checked.trimmed ? " [trimmed]" : ""}`);
    if (!checked.ok) console.log(`   raw: ${raw.slice(0, 200)}`);
  }
}
