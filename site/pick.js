// Hybrid picker for Normal to corporate: the Instant rules always run, the fine-tuned model runs when loaded.
// The model's rewrite is shown only if it passes modelGate (meaning) and is clearly more corporate for the level
// than the Instant one. Otherwise Instant wins. Pure function, shared by the page and the test harness.
import { modelGate, isFlat } from "./faithful.js";
import { CORP_LEXICON } from "./corp-lexicon.js";

const grams = (s) => {
  const w = String(s).toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
  return new Set([...w, ...w.slice(1).map((x, i) => `${w[i]} ${x}`)]);
};
export function corpScore(input, text, level) {
  const inG = grams(input), outG = grams(text);
  return (CORP_LEXICON[level] ?? []).filter((g) => outG.has(g) && !inG.has(g)).length;
}
export function pickRewrite(input, instant, model, { level = 2 } = {}) {
  if (!model) return { text: instant, engine: "instant", reason: "no-model" };
  const gate = modelGate(input, model, { level });
  if (!gate.ok) return { text: instant, engine: "instant", reason: `gate:${gate.reason}` };
  if (level >= 2 && isFlat(input, model)) return { text: instant, engine: "instant", reason: "model-flat" };
  const sm = corpScore(input, model, level), si = corpScore(input, instant, level);
  if (sm > si) return { text: model, engine: "model", reason: "more-corporate" };
  if (sm === si && isFlat(input, instant) && !isFlat(input, model)) return { text: model, engine: "model", reason: "instant-flat" };
  return { text: instant, engine: "instant", reason: "instant-as-good" };
}
