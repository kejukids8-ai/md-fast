// validate.mjs — compare parse.js output vs practice/reference/expected.json, byte-exact.
import { readFileSync } from 'node:fs';
import { parse } from './parse.js';

const cases = JSON.parse(readFileSync('/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice/input/cases.json', 'utf8'));
const expected = JSON.parse(readFileSync('/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice/reference/expected.json', 'utf8'));
const exp = new Map(expected.cases.map((c) => [c.id, c.html]));

let pass = 0;
const fails = [];
for (const c of cases) {
  const e = exp.get(c.id);
  if (e === undefined) { fails.push([c.id, 'no-expected']); continue; }
  let got;
  try { got = parse(c.markdown); } catch (err) { fails.push([c.id, 'throw: ' + err.message]); continue; }
  if (got === e) pass++;
  else {
    let i = 0;
    while (i < Math.min(got.length, e.length) && got[i] === e[i]) i++;
    fails.push([c.id, `diff@${i} got=${JSON.stringify(got.slice(Math.max(0, i - 30), i + 30))} exp=${JSON.stringify(e.slice(Math.max(0, i - 30), i + 30))}`]);
  }
}
console.log(`passed: ${pass}/${cases.length}`);
for (const [id, msg] of fails.slice(0, 5)) console.log(`FAIL ${id}: ${msg}`);
if (fails.length > 5) console.log(`... and ${fails.length - 5} more fails`);
process.exit(pass === cases.length && cases.length === exp.size ? 0 : 1);
