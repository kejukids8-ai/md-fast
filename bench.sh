#!/bin/bash
# interleave A/B: A=vendor marked direct (baseline), B=repo parse.js
set -e
IN=/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice/input
EXP=/home/agentuser/makefun/kit/markdown-render-speed-02-kit/practice/reference/expected.json
cat > /tmp/bA.ts <<'EOT'
import { readFileSync } from 'node:fs';
const cases = JSON.parse(readFileSync(process.env.MF_CASES!, 'utf8')) as {id:string;markdown:string}[];
const { marked } = await import('/home/agentuser/makefun/md-fast/vendor/marked/marked.esm.js');
for (const c of cases) marked.parse(c.markdown);
const c0 = process.cpuUsage();
for (let r=0;r<3;r++) for(const c of cases) marked.parse(c.markdown);
const d = process.cpuUsage(c0);
console.log(((d.user+d.system)/1000/3).toFixed(1));
EOT
cat > /tmp/bB.ts <<'EOT'
import { readFileSync } from 'node:fs';
const cases = JSON.parse(readFileSync(process.env.MF_CASES!, 'utf8')) as {id:string;markdown:string}[];
const { parse } = await import('/home/agentuser/makefun/md-fast/parse.js');
for (const c of cases) parse(c.markdown);
const c0 = process.cpuUsage();
for (let r=0;r<3;r++) for(const c of cases) parse(c.markdown);
const d = process.cpuUsage(c0);
console.log(((d.user+d.system)/1000/3).toFixed(1));
EOT
A=(); B=()
for i in 1 2 3 4 5 6 7; do
  MF_CASES=$IN/cases.json node /tmp/bA.ts > /tmp/a$i
  MF_CASES=$IN/cases.json node /tmp/bB.ts > /tmp/b$i
  A+=($(cat /tmp/a$i)); B+=($(cat /tmp/b$i))
done
echo "A(baseline): ${A[@]}"
echo "B(entry):    ${B[@]}"
printf "%s\n" "${A[@]}" "${B[@]}" | python3 -c "
import sys
vals=list(map(float,sys.stdin.read().split()))
a,b=vals[:7],vals[7:14]
med=lambda x:sorted(x)[len(x)//2]
print('medianA',med(a),'medianB',med(b),'speedup',round(med(a)/med(b),3))
"
