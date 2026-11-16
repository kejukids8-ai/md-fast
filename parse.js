import { Marked, Tokenizer } from './vendor/marked/marked.esm.js';

// Guarded tokenizer: cheap first-character checks that skip the expensive
// regexes when the first character cannot possibly match. Each guard only
// short-circuits when the original method would DEFINITELY return undefined
// (its regex is anchored and cannot match), so output stays byte-identical
// to stock marked (gfm defaults, pedantic off, no extensions).

const originals = Object.create(null);

function guard(name, test) {
  const fn = Tokenizer.prototype[name];
  originals[name] = fn;
  Tokenizer.prototype[name] = function (src, ...rest) {
    if (typeof src !== 'string' || src.length === 0 || !test(src)) {
      return undefined;
    }
    return fn.call(this, src, ...rest);
  };
}

const has = (chars) => (src) => chars.includes(src[0]);

// Block-level tokenizers: every regex is anchored with /^ {0,3}.../ so the
// set of possible first characters is tiny.
// space: gfm newline rule is /^(?:[ \t]*(?:\n|$))+/ — leading spaces/tabs allowed.
guard('space', has(' \t\n'));
guard('code', has(' \t')); // /^(?: {4}| {0,3}\t)/
guard('fences', has(' `~')); // /^ {0,3}(?:`{3,}|~{3,})/
guard('heading', has(' #')); // /^ {0,3}(#{1,6})(?=...)/
guard('hr', has(' -_*')); // /^ {0,3}((?:-[ \t]*){3,}|(?:_[ \t]*){3,}|\*...)/
guard('blockquote', has(' >')); // /^ {0,3}>/
guard('list', has(' *+-0123456789')); // /^ {0,3}(?:[*+-]|\d{1,9}[.)])/
guard('html', has(' <')); // /^ {0,3}(?:<(?:pre|script|style|textarea)/i
guard('def', has(' [')); // /^ {0,3}\[...]:/
guard('table', (src) => src[0] !== '\n' && src.indexOf('\n') !== -1); // /^ *([^\n ].*)\n {0,3}.../ — first line may start with any non-newline char
guard('reflink', has('![')); // /^!?\[.../ — image reflinks also start with '!'
guard('lheading', (src) => src.indexOf('\n') !== -1); // needs a text line + ===/--- underline
// paragraph = /^([^\n]+...)/ cannot match when src starts with a newline
guard('paragraph', (src) => src[0] !== '\n');

// Inline tokenizers.
guard('escape', (src) => src[0] === '\\');
guard('tag', (src) => src[0] === '<');
guard('link', has('![')); // /^!?\[/
guard('emStrong', has('*_')); // all emStrong alternatives start with * or _
guard('codespan', (src) => src[0] === '`');
guard('br', has(' \\')); // /^ {2,}\n|^\\\n/
guard('del', (src) => src[0] === '~');
guard('url', (src) => { // url regex starts with mailto:/xmpp:, scheme URLs, www., or an email-ish prefix
  const c = src[0];
  return /[A-Za-z0-9._+-]/.test(c);
});
guard('autolink', (src) => src[0] === '<');

const markedInstance = new Marked({ gfm: true, breaks: false, pedantic: false });

export function parse(markdown) {
  return markedInstance.parse(markdown, {
    gfm: true,
    breaks: false,
    pedantic: false,
    async: false,
  });
}

export default parse;
