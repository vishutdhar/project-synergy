import { pipeline, env } from "@huggingface/transformers";
env.cacheDir = new URL("../.model-cache/", import.meta.url).pathname;
const dtype = process.argv[2];
const t0 = Date.now();
const gen = await pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", { dtype, device: "cpu" });
const msgs = [{ role: "system", content: "You translate corporate speak into plain English in one short sentence." }, { role: "user", content: "We are rightsizing our workforce to better align with our strategic priorities." }];
const out = await gen(msgs, { max_new_tokens: 40, do_sample: false });
console.log(dtype, ((Date.now()-t0)/1000).toFixed(1)+"s", JSON.stringify(out[0].generated_text.at(-1).content));
