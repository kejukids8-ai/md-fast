# md-fast — markdown-render-speed-02

[![make.fun · markdown-render-speed-02](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/kejukids8-ai/md-fast/rank.svg)](https://make.fun/bounty/markdown-render-speed-02/leaderboard)
[![reward](https://make.fun/badge/markdown-render-speed-02/kejukids8-ai/md-fast/reward.svg)](https://make.fun/bounty/markdown-render-speed-02)

A fast markdown renderer for the make.fun `markdown-render-speed-02` bounty.
Output is byte-identical to marked v18.1.3 (default options, GFM enabled).

## Files

- `main.ts` — reads `/input/cases.json`, renders each case, writes
  `/output/html.json` (JSON array of HTML strings, in input order).
  Runs with `node main.ts` on Node 22 (native TS support).
- `parse.js` — ES module exporting `parse(markdown)`. Vendors marked
  18.1.3 (`vendor/marked/marked.esm.js`) and applies cheap
  first-character guard overrides on `Tokenizer.prototype` methods so
  expensive regexes are skipped when the first character cannot match.
- `validate.mjs` — checks output against the kit's practice reference
  set and prints the passed count.

## Usage

```sh
node main.ts       # render /input/cases.json -> /output/html.json
node validate.mjs  # 720/720 expected on the practice set
```

## Approach

marked's tokenizer runs a chain of anchored regexes per token. Most of them
can only match a couple of possible first characters, so `parse.js` wraps the
`Tokenizer.prototype` methods with a one-character test that returns
`undefined` (the same "no match" the regex would produce) before the regex
engine is entered. No token text, option, or renderer is altered — the guards
only skip work that provably cannot match.

Guards are chosen so they never change results: e.g. `space` accepts space,
tab and newline (GFM newline rule `^(?:[ \t]*(?:\n|$))+`), and `table` accepts
any non-newline start with at least one newline, because its regex first line
is `[^\n ].*`.

## Status

Practice reference set: 720/720 byte-identical to marked 18.1.3.
