// validate.mjs — compare our output against the reference expected.json.
// Usage: node validate.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const KIT = "/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice";
const input = JSON.parse(readFileSync(`${KIT}/input/cases.json`, "utf8"));
const expected = JSON.parse(
  readFileSync(`${KIT}/reference/expected.json`, "utf8")
);

// Build our own output the same way main.ts does.
import { parse } from "./parse.js";
const ours = (Array.isArray(input) ? input : input.cases).map((c) => ({ id: c.id, html: parse(c.markdown) }));

const expById = new Map(expected.cases.map((c) => [c.id, c.html]));
let passed = 0;
const failures = [];
for (const c of ours) {
  if (expById.get(c.id) === c.html) {
    passed++;
  } else {
    failures.push(c.id);
  }
}
console.log(`${passed}/${ours.length} passed`);
if (failures.length) {
  console.log("failing ids:", failures.slice(0, 20).join(", "));
  for (const id of failures.slice(0, 5)) {
    const c = ours.find((x) => x.id === id);
    console.log("---", id, "---\nGOT :", JSON.stringify(c.html).slice(0, 400), "\nWANT:", JSON.stringify(expById.get(id)).slice(0, 400));
  }
}
process.exit(failures.length ? 1 : 0);
