// Entry point for markdown-render-speed-02.
// Reads /input/cases.json, parses each case with parse() from ./parse.js,
// and writes /output/html.json as a JSON array of HTML strings in order.
// Must run under `node main.ts` on Node 22 (TypeScript types are stripped).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parse } from "./parse.js";

interface Case {
  id: string;
  markdown: string;
}

interface OutputCase {
  id: string;
  html: string;
}

function main(): void {
  const raw = readFileSync("/input/cases.json", "utf8");
  const parsed = JSON.parse(raw) as Case[] | { cases: Case[] };
  const cases: Case[] = Array.isArray(parsed) ? parsed : parsed.cases;

  const out: OutputCase[] = new Array(cases.length);
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    out[i] = { id: c.id, html: parse(c.markdown) };
  }

  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/html.json", JSON.stringify(out), "utf8");
  process.stdout.write(`wrote ${out.length} cases to /output/html.json\n`);
}

main();
