// parse(markdown) returns the HTML marked 18.1.3 renders with its default options (GFM on, async off).
// Strategy: keep the vendored marked byte-exact, but add cheap necessary-condition guards on
// Tokenizer.prototype so anchored regexes that cannot possibly match are never executed.
// A guard may only return early when its condition is strictly necessary for the underlying
// regex to match — otherwise marked's behavior changes and cases fail byte-exactness.

import { marked, Tokenizer } from './vendor/marked/marked.esm.js';

const proto = Tokenizer.prototype;

// --- block tokenizer guards (called from Lexer#blockTokens in order) ---
const _space = proto.space;
proto.space = function (e) {
  const c = e.charCodeAt(0);
  if (c !== 32 && c !== 9 && c !== 10) return; // space regex: ^[ \t]*(\n|$)+
  return _space.call(this, e);
};

const _code = proto.code;
proto.code = function (e) {
  const c = e.charCodeAt(0);
  if (c !== 32 && c !== 9) return; // indented code: ^((?: {4}| {0,3}\t)...)
  return _code.call(this, e);
};

const _fences = proto.fences;
proto.fences = function (e) {
  // ^ {0,3}(```|~~~): skip up to 3 leading spaces, then must be ` or ~
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  const c = e.charCodeAt(i);
  if (c !== 96 && c !== 126) return;
  return _fences.call(this, e);
};

const _heading = proto.heading;
proto.heading = function (e) {
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  if (e.charCodeAt(i) !== 35) return; // ^ {0,3}(#{1,6})
  return _heading.call(this, e);
};

const _hr = proto.hr;
proto.hr = function (e) {
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  const c = e.charCodeAt(i);
  if (c !== 45 && c !== 95 && c !== 42) return; // -, _, *
  return _hr.call(this, e);
};

const _blockquote = proto.blockquote;
proto.blockquote = function (e) {
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  if (e.charCodeAt(i) !== 62) return; // >
  return _blockquote.call(this, e);
};

const _list = proto.list;
proto.list = function (e) {
  // block list regex: ^( {0,3})(bull)([ \t][^\n]*?)?(?:\n|$) where bull = [*+-]|\d{1,9}[.)]
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  const c = e.charCodeAt(i);
  if (c !== 42 && c !== 43 && c !== 45) {
    if (c < 48 || c > 57) return; // bull needs a digit here
    let j = i;
    while (j < i + 9 && e.charCodeAt(j) >= 48 && e.charCodeAt(j) <= 57) j++;
    const c2 = e.charCodeAt(j);
    if (c2 !== 46 && c2 !== 41) return; // . or )
  }
  return _list.call(this, e);
};

const _html = proto.html;
proto.html = function (e) {
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  if (e.charCodeAt(i) !== 60) return; // <
  return _html.call(this, e);
};

const _def = proto.def;
proto.def = function (e) {
  let i = 0;
  while (i < 3 && e.charCodeAt(i) === 32) i++;
  if (e.charCodeAt(i) !== 91) return; // [
  return _def.call(this, e);
};

const _lheading = proto.lheading;
proto.lheading = function (e) {
  // lheading (Ge) accepts any non-blank lines as its body, so the only sound necessary
  // condition is: the normalized source contains "\n", up to 3 spaces, then = or -.
  // One anchored scan (module-level regex) is equivalent to prefix-testing every line,
  // and far cheaper than running the backtracking lheading regex blind.
  if (!LHEAD_HINT.test(e)) return;
  return _lheading.call(this, e);
};

// --- inline tokenizer guards (called from Lexer#inlineTokens in order) ---
const _escape = proto.escape;
proto.escape = function (e) {
  if (e.charCodeAt(0) !== 92) return; // backslash
  return _escape.call(this, e);
};

const _tag = proto.tag;
proto.tag = function (e) {
  if (e.charCodeAt(0) !== 60) return; // <
  return _tag.call(this, e);
};

const _link = proto.link;
proto.link = function (e) {
  if (this.lexer.state.linkParenPossible === false) return;
  const c = e.charCodeAt(0); // inline.link: ^!? \[
  if (c !== 91 && c !== 33) return;
  return _link.call(this, e);
};

const _reflink = proto.reflink;
proto.reflink = function (e, links) {
  const c = e.charCodeAt(0); // reflink/nolink: ^!? \[
  if (c !== 91 && c !== 33) return;
  return _reflink.call(this, e, links);
};

const _emStrong = proto.emStrong;
proto.emStrong = function (e, maskedSrc, prevChar) {
  const c = e.charCodeAt(0); // emStrong regex: ^\*+... or ^_+...
  if (c !== 42 && c !== 95) return;
  return _emStrong.call(this, e, maskedSrc, prevChar);
};

const _codespan = proto.codespan;
proto.codespan = function (e) {
  if (e.charCodeAt(0) !== 96) return; // backtick
  return _codespan.call(this, e);
};

const _br = proto.br;
proto.br = function (e) {
  const c = e.charCodeAt(0); // ^( {2,}|\\)\n
  if (c !== 32 && c !== 92) return;
  return _br.call(this, e);
};

const _del = proto.del;
proto.del = function (e, t, n) {
  if (e.charCodeAt(0) !== 126) return; // delLDelim: ^~~?...
  return _del.call(this, e, t, n);
};

const _url = proto.url;
proto.url = function (e) {
  // inline url regex alternatives all begin ^(?:mailto:|xmpp:|[hH][tT]...|www.|email-local)
  // so the first char must be an ASCII letter, digit, '.', '_' or '-' (verified: of the
  // srcs marked feeds url(), the regex never matches when this fails).
  const c = e.charCodeAt(0);
  if (
    !((c > 64 && c < 91) || (c > 96 && c < 123) || (c > 47 && c < 58) || c === 45 || c === 46 || c === 95)
  )
    return;
  return _url.call(this, e);
};

const _autolink = proto.autolink;
proto.autolink = function (e) {
  if (e.charCodeAt(0) !== 60) return; // ^<([a-zA-Z]...:|local@domain)
  return _autolink.call(this, e);
};

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}

// block lheading (Ge) can match any run of non-blank lines followed by a {0,3}-indented
// = / - underline. One scan for "\n", up to 3 spaces, then = or - is exactly the
// necessary condition (equivalent to testing every line's prefix).
const LHEAD_HINT = /\n {0,3}[=-]/;
