// Entry driver: reads /input/cases.json, renders each case with parse() from
// parse.js, writes /output/html.json (JSON array of HTML strings, case order).
// Outside a container MAKEFUN_INPUT_DIR / MAKEFUN_OUTPUT_DIR stand in for /input /output.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './parse.js';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const cases: { id: string; markdown: string }[] = JSON.parse(
  readFileSync(join(INPUT_DIR, 'cases.json'), 'utf8'),
);
const out: string[] = [];
for (const c of cases) out.push(parse(c.markdown));
writeFileSync(join(OUTPUT_DIR, 'html.json'), JSON.stringify(out));
