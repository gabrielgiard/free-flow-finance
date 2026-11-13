/* Checks for the compare page's page-free parts (docs/compare.js).

       node compare_test.js                                              */

const CMP = require('./docs/compare.js');
const fs = require('fs');
let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok    ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

console.log('rebasing two price series');
{
  const a = { dates: [1, 2, 3, 4, 5], closes: [50, 55, 60, 45, 75] };
  const b = { dates: [1, 2, 3, 4, 5], closes: [200, 200, 220, 180, 300] };
  const r = CMP.rebase(a, b);
  check('both start at exactly 100', r.a[0] === 100 && r.b[0] === 100);
  check('a move of +50% reads 150', near(r.a[4], 150) && near(r.b[4], 150));
  check('same length as the calendar', r.d.length === 5 && r.a.length === 5 && r.b.length === 5);

  // b lists later than a starts: the comparison begins when both exist
  const late = CMP.rebase(a, { dates: [3, 4, 5], closes: [10, 20, 30] });
  check('a newer listing: starts on the first day both trade', late.d[0] === 3 && late.d.length === 3 && late.a[0] === 100 && late.b[0] === 100);
  check('... and a is rebased to that day, not to its own first day', near(late.a[2], 75 / 60 * 100));

  // b misses a day (holiday on another exchange): its last close carries forward
  const gap = CMP.rebase(a, { dates: [1, 2, 4, 5], closes: [10, 11, 12, 13] });
  check('a missing day carries the last close forward', gap.d.length === 5 && near(gap.b[2], 110) && near(gap.b[3], 120));
  // b has days a does not: ignored
  const extra = CMP.rebase(a, { dates: [0, 1, 1.5, 2, 3, 4, 5, 6], closes: [9, 10, 99, 11, 12, 13, 14, 15] });
  check('extra days on the other calendar are ignored', extra.d.length === 5 && near(extra.b[1], 110));
  check('b that started earlier is still rebased to the common first day', near(extra.b[0], 100));
  check('nothing in common gives an empty result, not a crash', CMP.rebase(a, { dates: [9, 10], closes: [1, 2] }).d.length === 0 && CMP.rebase(null, b).d.length === 0 && CMP.rebase(a, { dates: [], closes: [] }).d.length === 0);
}

console.log('choosing an opponent');
{
  const raw = fs.readFileSync('./docs/data.js', 'utf8');
  const data = JSON.parse(raw.slice(raw.indexOf('{')).trim().replace(/;$/, ''));
  const cs = data.companies;
  const all = cs.map(c => [c, CMP.opponent(c, cs)]);
  check('every one of the companies gets an opponent', all.every(([, o]) => o));
  check('nobody is compared with themselves', all.every(([c, o]) => o.t !== c.t));
  const withPeers = all.filter(([c]) => (c.peers || []).some(t => cs.find(x => x.t === t)));
  check('when the model has a peer list, the opponent is the first peer on it', withPeers.length > 100 && withPeers.every(([c, o]) => o.t === c.peers.find(t => cs.find(x => x.t === t && x.t !== c.t))));
  const lone = { t: 'ZZZ', sec: cs[0].sec, peers: ['NOPE'], mcap: 1 };
  const o = CMP.opponent(lone, cs);
  check('no usable peers: the largest company in the same sector', o.sec === lone.sec && cs.filter(x => x.sec === lone.sec).every(x => x.mcap <= o.mcap));
  check('unknown sector: the largest company overall', CMP.opponent({ t: 'ZZZ', sec: 'nowhere' }, cs).t === cs.slice().sort((x, y) => y.mcap - x.mcap)[0].t);
  check('a library of one has no opponent', CMP.opponent(cs[0], [cs[0]]) === null);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
