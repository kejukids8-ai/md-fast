import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse } from './parse.js';

interface Case {
  id: string;
  markdown: string;
}

const INPUT = '/input/cases.json';
const OUTPUT = '/output/html.json';

const cases: Case[] = JSON.parse(readFileSync(INPUT, 'utf8'));

if (!Array.isArray(cases)) {
  throw new TypeError(`${INPUT} must contain a JSON array of {id, markdown}`);
}

// Output is a plain JSON array of HTML strings, in input order.
const out: string[] = cases.map((c) => parse(c.markdown ?? ''));

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(out));

console.log(`rendered ${out.length} cases -> ${OUTPUT}`);
