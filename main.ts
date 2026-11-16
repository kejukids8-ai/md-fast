// Entry driver: /bot/main.ts — reads /input/cases.json, renders each case with
// parse() from parse.js, writes /output/html.json (array of HTML strings, case order).

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const cases: { id: string; markdown: string }[] = JSON.parse(
  readFileSync(join('/input', 'cases.json'), 'utf8'),
);
const out: string[] = [];
for (const c of cases) out.push(parse(c.markdown));
writeFileSync(join('/output', 'html.json'), JSON.stringify(out));
