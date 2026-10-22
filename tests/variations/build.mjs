// Builds tests/variations/items.json from the hand-written source files in tests/variations/src.
// normal-*.txt: "# cat=X" header, then blocks of 4 lines: input, then the ideal output at levels 1, 2 and 3.
// decode-*.txt: "# cat=X signal=Y" header, then blocks of 4 lines: memo, then the ideal summary at levels 1, 2 and 3.
// A literal \n inside a line stands for a line break.
import fs from "node:fs";

const dir = new URL("./src/", import.meta.url).pathname;
const items = [];
const seen = new Map();
const problems = [];
const unescape = (s) => s.replace(/\\n/g, "\n");

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort()) {
  const direction = file.startsWith("decode") ? "toNormal" : "toCorporate";
  let cat = "";
  let signal = null;
  const blocks = fs.readFileSync(dir + file, "utf8").split(/\n\s*\n/);
  for (let raw of blocks) {
    let lines = raw.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    while (lines[0]?.startsWith("# ")) {
      cat = lines[0].match(/cat=(\S+)/)?.[1] ?? cat;
      const sig = lines[0].match(/signal=(\S+)/)?.[1];
      signal = sig === undefined ? (direction === "toNormal" ? signal : null) : sig;
      if (lines[0].includes("cat=") && !lines[0].includes("signal=") && direction === "toNormal") signal = null;
      lines = lines.slice(1);
    }
    if (!lines.length) continue;
    if (lines.length !== 4) { problems.push(`${file}: block with ${lines.length} lines: ${lines[0]}`); continue; }
    const input = unescape(lines[0]);
    const key = input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) { problems.push(`${file}: duplicate of ${seen.get(key)}: ${lines[0]}`); continue; }
    const id = `${direction === "toCorporate" ? "n" : "d"}${String(items.filter((i) => i.direction === direction).length + 1).padStart(4, "0")}`;
    seen.set(key, id);
    items.push({ id, direction, category: cat, signal: direction === "toNormal" ? signal : undefined, input, ideal: lines.slice(1).map(unescape), source: file });
  }
}
fs.writeFileSync(new URL("./items.json", import.meta.url), JSON.stringify(items, null, 1));
const count = (d) => items.filter((i) => i.direction === d).length;
console.log(`toCorporate ${count("toCorporate")}, toNormal ${count("toNormal")}`);
const cats = {};
for (const i of items) cats[`${i.direction}:${i.category}`] = (cats[`${i.direction}:${i.category}`] ?? 0) + 1;
console.log(Object.entries(cats).map(([k, v]) => `${k}=${v}`).join("  "));
if (problems.length) { console.log(problems.join("\n")); process.exitCode = 1; }
