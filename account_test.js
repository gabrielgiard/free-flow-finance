/* Checks the account sync merge rules (docs/account.js, FF_SYNCCORE).
   Run: node account_test.js */
const C = require('./docs/account.js');
let pass = 0, fail = 0;
function check(name, ok) { if (ok) pass++; else { fail++; console.log('FAIL ' + name); } }
const J = JSON.stringify;
const side = (d, t, exists = true) => ({ exists, d: Object.assign({ portfolio: '', example: '', mc: '', play: '', watch: '', cases: '' }, d), t: t || {} });
const P1 = J([{ t: 'AAPL', sh: 10, cost: 150 }]), P2 = J([{ t: 'NVDA', sh: 5, cost: 100 }]);

// portfolio
let m = C.mergeAll(side({ portfolio: P1 }, { portfolio: 1 }), side({}, {}, false));
check('a new account takes the device portfolio', C.canon(m.d.portfolio) === C.canon(P1) && !m.conflict);
m = C.mergeAll(side({}, {}), side({ portfolio: P2 }, { portfolio: 500 }));
check('an empty device takes the account portfolio', C.canon(m.d.portfolio) === C.canon(P2));
m = C.mergeAll(side({ portfolio: P1 }, { portfolio: 1 }), side({ portfolio: P2 }, { portfolio: 500 }), { first: true });
check('first sync with two real portfolios is a conflict that keeps the account copy', m.conflict && C.canon(m.d.portfolio) === C.canon(P2));
m = C.mergeAll(side({ portfolio: P1 }, { portfolio: 900 }), side({ portfolio: P2 }, { portfolio: 500 }));
check('later syncs: the newer portfolio wins', !m.conflict && C.canon(m.d.portfolio) === C.canon(P1));
m = C.mergeAll(side({ portfolio: P1, example: '1' }, { portfolio: 9e12 }), side({ portfolio: P2 }, { portfolio: 5 }));
check('the example portfolio never replaces a real one', C.canon(m.d.portfolio) === C.canon(P2) && m.d.example === '');
m = C.mergeAll(side({ portfolio: '[]' }, { portfolio: 900 }), side({ portfolio: P2 }, { portfolio: 500 }));
check('clearing the portfolio on a device (newer) clears it everywhere', C.canon(m.d.portfolio) === '[]');
m = C.mergeAll(side({ portfolio: J([{ cost: 150, sh: 10, t: 'AAPL' }]) }, { portfolio: 3 }), side({ portfolio: P1 }, { portfolio: 9 }));
check('key order alone is not a difference', C.diff(m, side({ portfolio: P1 })).length === 0);

// play
const play = (days, extra) => J(Object.assign({ last: Object.keys(days).sort().pop() || '', streak: 0, best: 0, played: Object.keys(days).length, days }, extra || {}));
const A = play({ '2026-11-10': [1, 0], '2026-11-11': [1, 1] }, { streak: 2, best: 2 });
const B = play({ '2026-11-12': [0, 1], '2026-11-13': [1, 1] }, { streak: 2, best: 4 });
let p = JSON.parse(C.mergePlay(A, B));
check('days played on two devices join into one streak', p.streak === 4 && p.last === '2026-11-13' && p.played === 4 && p.best === 4);
check('the play merge gives the same answer both ways round', C.mergePlay(A, B) === C.mergePlay(B, A));
check('the play merge is stable when repeated', C.mergePlay(C.mergePlay(A, B), C.mergePlay(A, B)) === C.mergePlay(A, B));
const long = play({ '2026-11-13': [1] }, { streak: 120, best: 120, played: 300 });
p = JSON.parse(C.mergePlay(long, B));
check('a long streak survives even though only two months of days are kept', p.streak === 120 && p.played >= 300);
const sameDayA = play({ '2026-11-13': [1, 0, 0] }), sameDayB = play({ '2026-11-13': [1, 1, 0] });
check('the same day played twice keeps the better score, either way round',
  JSON.parse(C.mergePlay(sameDayA, sameDayB)).days['2026-11-13'].join() === '1,1,0' && C.mergePlay(sameDayA, sameDayB) === C.mergePlay(sameDayB, sameDayA));
const many = {}; for (let i = 0; i < 90; i++) { const d = new Date(Date.UTC(2026, 0, 1 + i)); many[d.toISOString().slice(0, 10)] = [1]; }
p = JSON.parse(C.mergePlay(play(many, { streak: 90, best: 90, played: 90 }), B));
check('history is trimmed to 60 days', Object.keys(p.days).length === 60);
check('broken JSON on one side is ignored', C.mergePlay('{oops', B) === C.stable(JSON.parse(B)));

// watchlist
const W1 = J({ NVDA: { on: 1, at: 100, p: 120, seen: { d: 'Buy', m: 'Hold' }, sa: 100 }, KO: { on: 1, at: 50 } });
const W2 = J({ NVDA: { on: 0, at: 200 }, AAPL: { on: 1, at: 150 } });
let w = JSON.parse(C.mergeEntries(W1, W2, true, 400));
check('watchlist: removal on another device (newer) wins', w.NVDA.on === 0);
check('watchlist: entries from both devices are kept', w.KO.on === 1 && w.AAPL.on === 1);
check('watchlist merge is the same both ways round', C.mergeEntries(W1, W2, true, 400) === C.mergeEntries(W2, W1, true, 400));
const W3 = J({ NVDA: { on: 1, at: 100, p: 120, seen: { d: 'Hold', m: 'Hold' }, sa: 900 } });
w = JSON.parse(C.mergeEntries(W1, W3, true, 400));
check('a newer "seen" rating does not undo the star itself', w.NVDA.on === 1 && w.NVDA.seen.d === 'Hold' && w.NVDA.p === 120);
const big = {}; for (let i = 0; i < 450; i++) big['T' + i] = { on: 1, at: i };
check('the watchlist is capped', Object.keys(JSON.parse(C.mergeEntries(J(big), '', true, 400))).length === 400);

// cases
const K1 = J({ AAPL: { s: { dg: 0.01, m1: 0.3, wacc: 0.09, tg: 0.03 }, at: 100 } });
const K2 = J({ AAPL: { del: 1, at: 300 }, MSFT: { s: { dg: 0, m1: 0.4, wacc: 0.08, tg: 0.03 }, at: 50 } });
const k = JSON.parse(C.mergeEntries(K1, K2, false, 300));
check('saved cases: a newer delete wins and other cases stay', k.AAPL.del === 1 && k.MSFT.s.m1 === 0.4);

// mc and the whole merge
m = C.mergeAll(side({ mc: J({ years: 5, method: 'normal' }) }, { mc: 10 }), side({ mc: J({ years: 1, method: 'bootstrap' }) }, { mc: 20 }));
check('Monte Carlo settings: newest wins', JSON.parse(m.d.mc).years === 1);
const L = side({ portfolio: P1, watch: W1, play: A, cases: K1 }, { portfolio: 5, watch: 5, play: 5, cases: 5 });
const R = side({ portfolio: P2, watch: W2, play: B, cases: K2 }, { portfolio: 9, watch: 9, play: 9, cases: 9 });
const m1 = C.mergeAll(L, R), m2 = C.mergeAll(R, L);
check('two devices merging each other agree on everything',
  C.FIELDS.every(f => C.same(f, m1.d[f], m2.d[f])));
const again = C.mergeAll(side(m1.d, m1.t), side(m1.d, m1.t));
check('merging the result with itself changes nothing', C.diff(again, side(m1.d)).length === 0);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
