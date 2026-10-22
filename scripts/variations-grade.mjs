// Grades the variation runs and writes graded.txt plus tests/variations/dataset.jsonl.
// A row passes when the automated checks find nothing and, if a person read it, the hand label is not F.
// Usage: node scripts/variations-grade.mjs --instant r12 --before before --ai q25-corp-after,q3-corp,q25rag-corp --dec q25-dec-after,q3-dec
import fs from "node:fs";
import { toCorporateDetailed } from "../site/engine.js";
import { checkMeaning } from "../site/meaning.js";
import { hasCrude, lostIdioms, findCrude } from "../site/profanity.js";
import { aiCorporateGate } from "../site/faithful.js";
import { summaryCoversThemes } from "../site/ai-prompts.js";
import { corporateFlags, overlap, mustKeep } from "../tests/variations/checks.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const R = "/workspace/project-synergy-research/variations/";
const items = JSON.parse(fs.readFileSync(new URL("../tests/variations/items.json", import.meta.url)));
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
const corpIds = items.filter((i) => i.direction === "toCorporate").map((i) => i.id);
const decIds = items.filter((i) => i.direction === "toNormal").map((i) => i.id);
const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const key = (r) => `${r.id}|${r.level}`;

// Labels: "READ file from to" lines (AI), READCORP/READDEC/READDECL2 "tag mod rem" (Instant), and "id level F note".
function loadLabels(file) {
  const out = { fail: new Map(), readRanges: [], readRules: [] };
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const p = line.split("\t");
    if (p[0] === "READ") out.readRanges.push({ file: p[1], from: +p[2], to: +p[3] });
    else if (p[0].startsWith("READ")) out.readRules.push({ kind: p[0], mod: +p[2], rem: +p[3] });
    else if (p[2] === "F") out.fail.set(`${p[0]}|${p[1]}`, p[3] || "fail");
  }
  return out;
}
function instantRead(labels, id, level) {
  const list = id[0] === "n" ? corpIds : decIds;
  const k = list.indexOf(id);
  return labels.readRules.some((r) => (r.kind === "READCORP" && id[0] === "n" && k % r.mod === r.rem) || (r.kind === "READDEC" && id[0] === "d" && k % r.mod === r.rem) || (r.kind === "READDECL2" && id[0] === "d" && level === 2 && k % r.mod === r.rem));
}

function gradeInstant(tag, labelFile) {
  const labels = loadLabels(labelFile);
  const rows = jsonl(`${R}instant-${tag}.jsonl`);
  return rows.map((r) => {
    const item = byId[r.id];
    const auto = item.direction === "toCorporate" ? corporateFlags(item.input, r.output, r.level) : r.flags;
    const read = instantRead(labels, r.id, r.level);
    const hand = labels.fail.get(key(r));
    const text = r.output ?? `${r.summary} | ${(r.lines ?? []).join(" || ")}`;
    return { ...r, text, auto, read, hand, pass: !auto.length && !hand, sim: overlap(r.output ?? r.summary, item.ideal[r.level - 1]) };
  });
}

// The same gate as the page, run again with the current code so a rerun is not needed after a gate change.
function gateCorporate(item, level, ai) {
  return aiCorporateGate(item.input, ai, { level }).reason;
}

function gradeAI(tag, labels, instantRows) {
  const rows = [0, 1, 2].flatMap((s) => jsonl(`${R}runs/${tag}.s${s}.jsonl`).map((r, i) => ({ ...r, shard: s, idx: i })));
  const inst = Object.fromEntries(instantRows.map((r) => [key(r), r]));
  return rows.map((r) => {
    const item = byId[r.id];
    const read = labels.readRanges.some((x) => x.file === `${tag}.s${r.shard}` && r.idx >= x.from && r.idx < x.to);
    const hand = labels.fail.get(`${tag}:${key(r)}`) ?? (tag.startsWith("q25-") && !tag.includes("rag") ? labels.fail.get(key(r)) : undefined);
    if (item.direction === "toCorporate") {
      const ai = r.ai_text ?? "";
      const auto = ai ? corporateFlags(item.input, ai, r.level) : ["empty"];
      const gate = gateCorporate(item, r.level, ai);
      const rawPass = !auto.length && !hand;
      const fallback = inst[key(r)];
      const shownPass = gate === "ok" ? rawPass : fallback.pass;
      return { ...r, text: ai, auto, read, hand, gate, rawPass, shownPass, sim: overlap(ai, item.ideal[r.level - 1]) };
    }
    const summary = r.ai_summary ?? "";
    const auto = [];
    if (!summary) auto.push("empty");
    if (summary && item.signal && !["none", "fluff"].includes(item.signal) && !summaryCoversThemes(summary, [item.signal])) auto.push("signal");
    if (findCrude(summary).length) auto.push("crude");
    for (const l of r.lines) if (l.ai && overlap(l.original, l.ai) > 0.6) auto.push("echo");
    const rawPass = !auto.length && !hand;
    const fallback = inst[key(r)];
    const shownPass = r.summary_ok && summary ? rawPass : fallback.pass;
    return { ...r, text: `${summary} | ${r.lines.map((l) => l.ai || "<fallback>").join(" || ")}`, auto: [...new Set(auto)], read, hand, gate: r.summary_ok ? "ok" : "fallback", rawPass, shownPass, sim: overlap(summary, item.ideal[r.level - 1]) };
  });
}

const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : "n/a");
function table(title, rows, passKey = "pass", { readOnly = false } = {}) {
  const use = readOnly ? rows.filter((r) => r.read) : rows;
  const cats = {};
  for (const r of use) {
    const c = `${byId[r.id].direction === "toCorporate" ? "N>C" : "C>N"} ${byId[r.id].category}`;
    (cats[c] ??= { n: 0, p: 0 }).n++;
    if (r[passKey]) cats[c].p++;
  }
  const lv = [1, 2, 3].map((l) => { const x = use.filter((r) => r.level === l); return `L${l} ${pct(x.filter((r) => r[passKey]).length, x.length)}`; }).join(", ");
  const lines = [`${title}: ${pct(use.filter((r) => r[passKey]).length, use.length)} of ${use.length} outputs (${lv})`];
  for (const [c, v] of Object.entries(cats).sort()) lines.push(`  ${c.padEnd(32)} ${String(v.p).padStart(4)}/${String(v.n).padEnd(4)} ${pct(v.p, v.n)}`);
  return lines.join("\n");
}

const instTag = arg("instant", "r12");
const after = gradeInstant(instTag, `${R}labels-instant-after.tsv`);
const before = gradeInstant(arg("before", "before"), `${R}labels-instant-before.tsv`);
const aiLabels = loadLabels(`${R}labels-ai.tsv`);
const aiTags = arg("ai", "").split(",").filter(Boolean);
const decTags = arg("dec", "").split(",").filter(Boolean);
const ai = Object.fromEntries([...aiTags, ...decTags].map((t) => [t, gradeAI(t, aiLabels, after)]));

const out = [];
out.push(`Variation round grades. Generated ${new Date().toString()}`);
out.push(`Dataset: ${corpIds.length} plain-to-corporate and ${decIds.length} corporate-to-plain inputs, 3 levels each (${3 * items.length} outputs per engine).`);
out.push(`A row passes when the automated checks (crude words, meaning check, idioms, garbling, added sentences at Mild/Middle, lost numbers/names/dates/question marks, decode signal and echo) find nothing and the hand label is not a fail.`);
out.push("");
out.push("== Instant, hand-read rows (headline numbers) ==");
out.push(table("Instant BEFORE (hand-read sample)", before, "pass", { readOnly: true }));
out.push(table("Instant AFTER (hand-read rows)", after, "pass", { readOnly: true }));
out.push("");
out.push("== Instant, automated checks on every row ==");
const autoPass = (rows) => rows.map((r) => ({ ...r, autoPass: !r.auto.length }));
out.push(table("Instant BEFORE automated", autoPass(before), "autoPass"));
out.push(table("Instant AFTER automated", autoPass(after), "autoPass"));
out.push(`Mean word overlap with ideal_output: before ${(before.reduce((a, r) => a + r.sim, 0) / before.length).toFixed(3)}, after ${(after.reduce((a, r) => a + r.sim, 0) / after.length).toFixed(3)}`);
out.push(`Hand-read: before ${before.filter((r) => r.read).length} outputs, after ${after.filter((r) => r.read).length} outputs.`);
for (const [t, rows] of Object.entries(ai)) {
  if (!rows.length) continue;
  out.push("");
  out.push(`== AI run ${t}: ${rows.length} outputs, ${rows.filter((r) => r.read).length} hand-read ==`);
  out.push(table(`${t} raw model output, hand-read rows`, rows, "rawPass", { readOnly: true }));
  out.push(table(`${t} raw model output, automated only, all rows`, rows.map((r) => ({ ...r, a: !r.auto.length })), "a"));
  out.push(table(`${t} what the page shows (AI if it passes the gates, else Instant), hand-read rows`, rows, "shownPass", { readOnly: true }));
  const gates = {};
  for (const r of rows) gates[r.gate] = (gates[r.gate] ?? 0) + 1;
  out.push(`  gates: ${Object.entries(gates).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  const okRead = rows.filter((r) => r.read && r.gate === "ok");
  out.push(`  AI shown on ${pct(rows.filter((r) => r.gate === "ok").length, rows.length)} of rows; hand-read pass rate of the AI text that gets shown: ${pct(okRead.filter((r) => r.rawPass).length, okRead.length)} (${okRead.length} rows)`);
  out.push(`  mean overlap with ideal_output ${(rows.reduce((a, r) => a + r.sim, 0) / rows.length).toFixed(3)}`);
}
fs.writeFileSync(`${R}graded.txt`, out.join("\n") + "\n");
console.log(out.join("\n"));

// Dataset for fine-tuning, few-shot or retrieval: one line per input with the ideal outputs and what each engine produced.
const aiCorp = ai[aiTags[0]] ?? [];
const aiDec = ai[decTags[0]] ?? [];
const ds = items.map((item) => {
  const lv = [1, 2, 3].map((level) => {
    const k = `${item.id}|${level}`;
    const ins = after.find((r) => key(r) === k);
    const a = (item.direction === "toCorporate" ? aiCorp : aiDec).find((r) => key(r) === k);
    return {
      level,
      ideal_output: item.ideal[level - 1],
      instant: { output: ins?.text ?? "", grade: ins?.pass ? "pass" : "fail", hand_read: Boolean(ins?.read), flags: ins?.auto ?? [], note: ins?.hand ?? "" },
      ai: a ? { model: a.model, output: a.text, grade: a.rawPass ? "pass" : "fail", hand_read: a.read, flags: a.auto, note: a.hand ?? "", gate: a.gate } : null,
    };
  });
  return { id: item.id, direction: item.direction, category: item.category, expected_signal: item.signal ?? null, input: item.input, must_keep: item.direction === "toCorporate" ? mustKeep(item.input) : [], levels: lv };
});
fs.writeFileSync(new URL("../tests/variations/dataset.jsonl", import.meta.url), ds.map((d) => JSON.stringify(d)).join("\n") + "\n");
