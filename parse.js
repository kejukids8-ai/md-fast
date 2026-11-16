// parse(markdown) — byte-identical to marked 18.1.3 with default options (gfm: true).
// Imports the vendored copy of marked and installs cheap first-character guards
// on Tokenizer.prototype methods: when the first character of the source cannot
// possibly match that rule's regex, we skip the expensive exec entirely and
// return undefined — exactly what a failed match would have produced.

import { Marked, Tokenizer } from "./vendor/marked/marked.esm.js";

// First-character sets derived from each rule's regex source.
// A rule is guarded only when its pattern has a small, provably safe first-char set.
const GUARDS = {
  // block rules
  space: new Set([" ", "\t", "\n", "\r"]),
  code: new Set([" ", "\t"]),
  fences: new Set([" ", "\t", "`", "~"]),
  heading: new Set([" ", "\t", "#"]),
  hr: new Set([" ", "\t", "-", "_", "*"]),
  blockquote: new Set([" ", "\t", ">"]),
  list: new Set([" ", "\t", "-", "+", "*",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
  html: new Set([" ", "\t", "<"]),
  def: new Set([" ", "\t", "["]),
  // inline rules
  escape: new Set(["\\"]),
  tag: new Set(["<"]),
  link: new Set(["[", "!", "\\"]), // link tokenizers may consume a leading escape first
  reflink: new Set(["[", "!", "\\"]),
  emStrong: new Set(["*", "_", "~"]),
  del: new Set(["*", "_", "~"]), // del tokenizer starts with em/del delimiters
  codespan: new Set(["`"]),
  br: new Set([" ", "\\"]),
  autolink: new Set(["<"]),
  url: new Set(["m", "M", "x", "X", "h", "H", "f", "F", "w", "W",
    // url() also handles email autolinks reached via inlineText continuation,
    // where the address itself is passed in — so only bail when src begins
    // with a character that can start neither a scheme, www, nor an email
    // local-part. Local-part allows [A-Za-z0-9._+-]; be conservative:
    "a", "b", "c", "d", "e", "g", "i", "j", "k", "l", "n", "o", "p", "q",
    "r", "s", "t", "u", "v", "y", "z",
    "A", "B", "C", "D", "E", "G", "I", "J", "K", "L", "N", "O", "P", "Q",
    "R", "S", "T", "U", "V", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ".", "_", "+", "-"]),
  // paragraph, text, lheading, table, inlineText: unguarded (first char unconstrained)
};

function installGuards() {
  const proto = Tokenizer.prototype;
  for (const [name, chars] of Object.entries(GUARDS)) {
    const original = proto[name];
    if (typeof original !== "function") continue;
    proto[name] = function (src, ...rest) {
      if (typeof src === "string" && src.length > 0 && !chars.has(src[0])) {
        return undefined;
      }
      return original.apply(this, [src, ...rest]);
    };
  }
}

installGuards();

const marked = new Marked({ gfm: true });

export function parse(markdown) {
  return marked.parse(markdown);
}
