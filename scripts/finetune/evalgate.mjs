// P/R of the gate on round4 model outputs vs labels-r4.json. Usage: node evalgate.mjs [gateName]
import fs from "node:fs";
const R4 = new URL("../../tests/variations/round5", import.meta.url).pathname;
const { aiCorporateGate } = await import("../../site/faithful.js");
const mod = await import("../../site/faithful.js");
const gate = mod[process.argv[2] ?? "aiCorporateGate"];
const lab = JSON.parse(fs.readFileSync(`${R4}/labels-r4.json`));
let tp = 0, fp = 0, fn = 0, tn = 0; const miss = [], fr = [];
for (const [f, t] of [["exp-t5small.jsonl", "T"], ["exp-smol135-lora.jsonl", "S"]]) {
  for (const l of fs.readFileSync(`${R4}/${f}`, "utf8").trim().split("\n")) {
    const r = JSON.parse(l);
    r.outs.forEach((o, i) => {
      const key = `${r.id.slice(-2)}.${i + 1}`; const bad = lab[t].includes(key);
      const g = gate(r.input, o, { level: i + 1 }); const rej = !g.ok;
      if (rej && bad) tp++; else if (rej) { fp++; fr.push(`${t}${key} ${g.reason}${g.detail ? ":" + g.detail : ""} | ${o}`); } else if (bad) { fn++; miss.push(`${t}${key} | ${r.input} -> ${o}`); } else tn++;
    });
  }
}
console.log(`reject: TP ${tp} FP ${fp} FN ${fn} TN ${tn}  precision ${(tp / (tp + fp) * 100).toFixed(1)}%  recall ${(tp / (tp + fn) * 100).toFixed(1)}%  falseRejectRate ${(fp / (fp + tn) * 100).toFixed(1)}%`);
if (!process.env.QUIET) { console.log("MISSED:"); miss.forEach((m) => console.log(" ", m)); console.log("FALSE REJECTS:"); fr.forEach((m) => console.log(" ", m)); }
