import { readFileSync } from 'node:fs';
import { parse } from './parse.js';

const KIT = '/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice';
const cases = JSON.parse(readFileSync(`${KIT}/input/cases.json`, 'utf8'));
const expected = JSON.parse(readFileSync(`${KIT}/reference/expected.json`, 'utf8'));

const byId = new Map(expected.cases.map((c) => [c.id, c.html]));

let passed = 0;
const failures = [];
const only = process.argv[2]; // optional: run a single case id

for (const c of cases) {
  if (only && c.id !== only) continue;
  const got = parse(c.markdown);
  const want = byId.get(c.id);
  if (got === want) {
    passed++;
    continue;
  }
  let i = 0;
  while (i < got.length && i < want.length && got[i] === want[i]) i++;
  failures.push({
    id: c.id,
    at: i,
    got: got.slice(Math.max(0, i - 40), i + 80),
    want: String(want).slice(Math.max(0, i - 40), i + 80),
  });
}

for (const f of failures.slice(0, 10)) {
  console.log(`FAIL ${f.id} @${f.at}`);
  console.log('  got :', JSON.stringify(f.got));
  console.log('  want:', JSON.stringify(f.want));
}

console.log(`${passed}/${cases.length} passed`);
if (passed !== cases.length) process.exit(1);
