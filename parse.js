// parse(markdown) returns the HTML marked 18.1.3 renders with its default options (GFM on, async off).
// Start: vendored marked, byte-for-byte identical output. Optimization target.

import { marked } from './vendor/marked/marked.esm.js';

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}
