// parse(markdown) returns the HTML marked 18.1.3 renders with its default options (GFM on, async off).
// Strategy: keep the vendored marked byte-exact, but add cheap first-char dispatch guards on
// Tokenizer.prototype so anchored regexes that cannot possibly match are never executed.
// Every guard is a necessary condition of the corresponding ^-anchored regex, so behavior is identical.

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
  const c = e.charCodeAt(0);
  // bull: * + - or digit 1-9 followed by . or )
  if (c !== 42 && c !== 43 && c !== 45) {
    if (c < 49 || c > 57) return;
    // list regex needs ^( {0,3}\d{1,9}[.)])([ \t][^\n]*?)?(\n|$) — src starts at pos 0 here,
    // so require: 1-9 digits then '.' or ')' then end/space/tab/newline. Exact necessary condition.
    let i = 0;
    while (i < 9 && e.charCodeAt(i) >= 48 && e.charCodeAt(i) <= 57) i++;
    const c2 = e.charCodeAt(i);
    if (c2 !== 46 && c2 !== 41) return; // . or )
    const c3 = e.charCodeAt(i + 1);
    if (!(c3 === 32 || c3 === 9 || c3 === 10 || Number.isNaN(c3))) return;
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
  // setext: line1 (non-empty), then a line starting (after <=3 spaces) with = or -
  const nl = e.indexOf('\n');
  if (nl < 1) return;
  let i = nl + 1;
  while (i < nl + 4 && e.charCodeAt(i) === 32) i++;
  const c = e.charCodeAt(i);
  if (c !== 61 && c !== 45) return;
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
  const c = e.charCodeAt(0); // inline.link: ^!?\[
  if (c !== 91 && c !== 33) return;
  return _link.call(this, e);
};

const _reflink = proto.reflink;
proto.reflink = function (e, links) {
  const c = e.charCodeAt(0); // reflink/nolink: ^!?\[
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
  if (e.charCodeAt(0) !== 126) return; // ~
  return _del.call(this, e, t, n);
};

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}
