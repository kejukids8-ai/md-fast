// parse(markdown): returns exactly the HTML marked 18.1.3 renders with default options.
// Approach: the vendored marked stays byte-exact; we wrap Tokenizer.prototype methods with
// cheap necessary-condition guards so anchored regexes that cannot match never run. A guard
// may only skip when its condition is strictly necessary for the wrapped regex to match —
// anything stronger changes marked's output and breaks byte-exactness.

import { marked, Tokenizer } from './vendor/marked/marked.esm.js';

const proto = Tokenizer.prototype;

// helper: index of first char after up to 3 leading spaces
function ind3(s) {
  let i = 0;
  while (i < 3 && s.charCodeAt(i) === 32) i++;
  return i;
}

// --- block tokenizer guards (Lexer#blockTokens order) ---

const _space = proto.space;
proto.space = function (src) {
  // space regex: ^[ \t]*(\n|$)+ — needs a space, tab or newline
  const c = src.charCodeAt(0);
  if (c !== 32 && c !== 9 && c !== 10) return;
  return _space.call(this, src);
};

const _code = proto.code;
proto.code = function (src) {
  // indented code needs a leading space or tab
  const c = src.charCodeAt(0);
  if (c !== 32 && c !== 9) return;
  return _code.call(this, src);
};

const _fences = proto.fences;
proto.fences = function (src) {
  // ^ {0,3}(```|~~~)
  const c = src.charCodeAt(ind3(src));
  if (c !== 96 && c !== 126) return; // ` or ~
  return _fences.call(this, src);
};

const _heading = proto.heading;
proto.heading = function (src) {
  // ^ {0,3}(#{1,6})
  if (src.charCodeAt(ind3(src)) !== 35) return;
  return _heading.call(this, src);
};

const _hr = proto.hr;
proto.hr = function (src) {
  const c = src.charCodeAt(ind3(src));
  if (c !== 45 && c !== 95 && c !== 42) return; // -, _, *
  return _hr.call(this, src);
};

const _blockquote = proto.blockquote;
proto.blockquote = function (src) {
  if (src.charCodeAt(ind3(src)) !== 62) return; // >
  return _blockquote.call(this, src);
};

const _list = proto.list;
proto.list = function (src) {
  // block list: ^( {0,3})(bull)... with bull = [*+-] | \d{1,9}[.)]
  const i = ind3(src);
  const c = src.charCodeAt(i);
  if (c !== 42 && c !== 43 && c !== 45) {
    if (c < 48 || c > 57) return; // need a digit
    let j = i;
    while (j < i + 9 && src.charCodeAt(j) >= 48 && src.charCodeAt(j) <= 57) j++;
    const c2 = src.charCodeAt(j);
    if (c2 !== 46 && c2 !== 41) return; // . or )
  }
  return _list.call(this, src);
};

const _html = proto.html;
proto.html = function (src) {
  if (src.charCodeAt(ind3(src)) !== 60) return; // <
  return _html.call(this, src);
};

const _def = proto.def;
proto.def = function (src) {
  if (src.charCodeAt(ind3(src)) !== 91) return; // [
  return _def.call(this, src);
};

// --- inline tokenizer guards (Lexer#inlineTokens order) ---

const _escape = proto.escape;
proto.escape = function (src) {
  if (src.charCodeAt(0) !== 92) return; // backslash
  return _escape.call(this, src);
};

const _tag = proto.tag;
proto.tag = function (src) {
  if (src.charCodeAt(0) !== 60) return; // <
  return _tag.call(this, src);
};

const _link = proto.link;
proto.link = function (src) {
  // inline.link: ^!? \[ — also skip when no link-ref-def can follow (lexer flag)
  if (this.lexer.state.linkParenPossible === false) return;
  const c = src.charCodeAt(0);
  if (c !== 91 && c !== 33) return; // [ or !
  return _link.call(this, src);
};

const _reflink = proto.reflink;
proto.reflink = function (src, links) {
  const c = src.charCodeAt(0); // reflink/nolink: ^!? \[
  if (c !== 91 && c !== 33) return;
  return _reflink.call(this, src, links);
};

const _emStrong = proto.emStrong;
proto.emStrong = function (src, maskedSrc, prevChar) {
  const c = src.charCodeAt(0); // ^\*+... or ^_+...
  if (c !== 42 && c !== 95) return;
  return _emStrong.call(this, src, maskedSrc, prevChar);
};

const _codespan = proto.codespan;
proto.codespan = function (src) {
  if (src.charCodeAt(0) !== 96) return; // backtick
  return _codespan.call(this, src);
};

const _br = proto.br;
proto.br = function (src) {
  const c = src.charCodeAt(0); // ^( {2,}|\\)\n
  if (c !== 32 && c !== 92) return;
  return _br.call(this, src);
};

const _del = proto.del;
proto.del = function (src, t, n) {
  if (src.charCodeAt(0) !== 126) return; // ~~~?...
  return _del.call(this, src, t, n);
};

const _url = proto.url;
proto.url = function (src) {
  // url's alternatives all start ^(?:mailto:|xmpp:|[hH]..|www.|email-local), so the first
  // char must be an ASCII letter, digit, '.', '_' or '-'; the regex never matches otherwise.
  const c = src.charCodeAt(0);
  if (
    !((c > 64 && c < 91) || (c > 96 && c < 123) || (c > 47 && c < 58) || c === 45 || c === 46 || c === 95)
  )
    return;
  return _url.call(this, src);
};

const _autolink = proto.autolink;
proto.autolink = function (src) {
  if (src.charCodeAt(0) !== 60) return; // ^<scheme:|local@domain
  return _autolink.call(this, src);
};

const _lheading = proto.lheading;
proto.lheading = function (src) {
  // lheading (Ge) accepts any run of non-blank lines followed by a {0,3}-indented = / -
  // underline, so the only sound necessary condition is one anchored scan for
  // "\n", up to 3 spaces, then = or - — far cheaper than running the backtracking
  // regex blind on every src fed to it.
  if (!LHEAD_HINT.test(src)) return;
  return _lheading.call(this, src);
};

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}

// One scan for "\n {0,3}[=-]" is exactly the necessary condition for lheading to match
// (equivalent to testing every line's prefix).
const LHEAD_HINT = /\n {0,3}[=-]/;
