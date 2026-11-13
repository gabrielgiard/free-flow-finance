/* Checks for the glossary (docs/glossary.js): the terms themselves and how
   they are found in text.

       node glossary_test.js                                             */

const G = require('./docs/glossary.js');
let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok    ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
const keys = (txt) => G.find(txt).map(h => h.k);
const words = (txt) => G.find(txt).map(h => txt.slice(h.start, h.end));

console.log('the terms');
{
  const T = G.GLOSSARY;
  check('at least twenty terms', T.length >= 20, T.length);
  check('every key is unique', new Set(T.map(t => t.k)).size === T.length);
  const spell = T.flatMap(t => [t.t, ...(t.also || [])].map(s => s.toLowerCase()));
  check('no spelling points at two different terms', new Set(spell).size === spell.length, spell.filter((s, i) => spell.indexOf(s) !== i).join(','));
  check('every term has a meaning, a reason and a group', T.every(t => t.d && t.w && t.g && t.t));
  check('meanings are one or two short sentences (under 260 characters)', T.every(t => t.d.length < 260), T.filter(t => t.d.length >= 260).map(t => t.k + ':' + t.d.length).join(','));
  check('no definition leans on another undefined acronym in capitals', T.every(t => !/\b(EBITDA|NOPAT|ROIC|CAPM|EPS)\b/.test(t.d + t.w)));
  check('keys are safe to put in a web address', T.every(t => /^[a-z0-9-]+$/.test(t.k)));
}

console.log('finding terms in text');
{
  check('finds a plain term', keys('The WACC is 9.5%.').join() === 'wacc');
  check('reports exactly where it is', (() => { const s = 'Our DCF says so'; const h = G.find(s)[0]; return s.slice(h.start, h.end) === 'DCF'; })());
  check('case does not matter', keys('free cash flow and Free Cash Flow').join() === 'fcf,fcf');
  check('the longer term wins over the shorter one inside it', keys('Free cash flow yield is 4%').join() === 'fcf-yield' && keys('free cash flow margin').join() === 'fcf-margin' && keys('Terminal growth of 3%').join() === 'terminal-growth');
  check('other spellings trigger the same card', keys('the discount rate').join() === 'wacc' && keys('EV/Sales').join() === 'ev-sales' && keys('EV / Sales').join() === 'ev-sales' && keys('net cash').join() === 'net-debt');
  check('several terms in one sentence, left to right', keys('Fair value comes from the DCF, using a WACC and a terminal value.').join() === 'fair-value,dcf,wacc,terminal-value');
  check('never matches inside a longer word', keys('The WACCY idea, upsides, DCFs and prefcf').length === 0, words('The WACCY idea, upsides, DCFs and prefcf').join('|'));
  check('"EV" on its own is left alone (it also means electric vehicle)', keys('Tesla sells every EV it makes').length === 0);
  check('a term at the very start and very end of the text', keys('Upside').join() === 'upside' && keys('see the upside').join() === 'upside');
  check('matches never overlap', (() => { const h = G.find('free cash flow yield, free cash flow margin, free cash flow'); return h.every((x, i) => i === 0 || x.start >= h[i - 1].end) && h.length === 3; })());
  check('text with nothing in it', keys('Founded in 1993 in Santa Clara.').length === 0 && keys('').length === 0);
  check('terms across a line break or double space still match', keys('free  cash\nflow').join() === 'fcf');
  check('running it twice gives the same answer (no leftover state)', keys('WACC and DCF').join() === keys('WACC and DCF').join());
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
