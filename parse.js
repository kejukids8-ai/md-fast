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

/** The HTML marked renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  return marked.parse(markdown);
}
