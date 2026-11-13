/* Checks for the Daily Ten's rules (docs/play.js): which ten get picked,
   how streaks count, what the share text says.

       node play_test.js

   The promise of a daily game is that everyone gets the same ten and that a
   streak means what it says. Both are easy to break quietly, so both are pinned
   down here, on the real library. */

const PLAY = require('./docs/play.js');
const fs = require('fs');

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok    ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}

const raw = fs.readFileSync('./docs/data.js', 'utf8');
const data = JSON.parse(raw.slice(raw.indexOf('{')).trim().replace(/;$/, ''));
const pool = data.companies.map(c => ({ t: c.t, mcap: c.mcap, up: c.fv > 0 && c.price > 0 ? c.upside : null }));
const byT = Object.fromEntries(pool.map(c => [c.t, c]));

console.log('picking the ten');
{
  const a = PLAY.pick(pool, 'daily-2026-11-09'), b = PLAY.pick(pool, 'daily-2026-11-09');
  check('ten companies', a.length === 10, a.length);
  check('the same day gives everyone the same ten, in the same order', a.join() === b.join());
  check('the order of the data file does not change the set', PLAY.pick(pool.slice().reverse(), 'daily-2026-11-09').join() === a.join());
  check('a different day gives a different ten', PLAY.pick(pool, 'daily-2026-11-10').join() !== a.join());
  check('no company twice', new Set(a).size === 10);

  let okGap = true, okMix = true, okKnown = true, fam = 0, all = new Set(), minU = 10, maxU = 0;
  const famous = new Set(pool.filter(c => c.up != null && Math.abs(c.up) >= 0.10).sort((x, y) => y.mcap - x.mcap).slice(0, 120).map(c => c.t));
  const DAYS = 365;
  for (let d = 0; d < DAYS; d++) {
    const day = PLAY.day(new Date(2026, 10, 9 + d));
    const p = PLAY.pick(pool, 'daily-' + day);
    if (p.length !== 10 || new Set(p).size !== 10) okKnown = false;
    const u = p.filter(t => byT[t].up > 0).length;
    minU = Math.min(minU, u); maxU = Math.max(maxU, u);
    if (u < 3 || u > 7) okMix = false;
    for (const t of p) { if (!byT[t] || byT[t].up == null || Math.abs(byT[t].up) < 0.10) okGap = false; all.add(t); if (famous.has(t)) fam++; }
  }
  check('a year of days: always ten distinct, real companies', okKnown);
  check('never a company within 10% of fair value, never one without a fair value', okGap);
  check(`between 3 and 7 undervalued every day, so one-note guessing loses (saw ${minU} to ${maxU})`, okMix && minU === 3 && maxU === 7);
  check('about six in ten are large, familiar names', Math.abs(fam / (DAYS * 10) - 0.6) < 0.06, (fam / (DAYS * 10)).toFixed(3));
  check('over a year the game reaches most of the library', all.size > 200, all.size);
  const alwaysOver = (() => { let s = 0; for (let d = 0; d < DAYS; d++) { const p = PLAY.pick(pool, 'daily-' + PLAY.day(new Date(2026, 10, 9 + d))); s += p.filter(t => byT[t].up <= 0).length; } return s / (DAYS * 10); })();
  check('always answering "overvalued" scores about 50%, not more', Math.abs(alwaysOver - 0.5) < 0.05, alwaysOver.toFixed(3));

  // awkward pools
  const few = pool.filter(c => c.up != null && Math.abs(c.up) >= 0.10).slice(0, 4);
  check('a pool of four gives four, not a crash', PLAY.pick(few, 'x').length === 4);
  check('an empty pool gives an empty set', PLAY.pick([], 'x').length === 0);
  const allOver = pool.filter(c => c.up != null && c.up <= -0.10).slice(0, 30);
  check('if nothing is undervalued it still fills ten', PLAY.pick(allOver, 'x').length === 10);
}

console.log('days and streaks');
{
  check('day is local YYYY-MM-DD', PLAY.day(new Date(2026, 10, 9, 23, 59)) === '2026-11-09' && PLAY.day(new Date(2026, 0, 5)) === '2026-01-05');
  check('the day before, across a month and a year', PLAY.prevDay('2026-11-01') === '2026-10-31' && PLAY.prevDay('2027-01-01') === '2026-12-31' && PLAY.prevDay('2028-03-01') === '2028-02-29');
  const m = [1, 0, 1, 1, 1, 1, 1, 0, 1, 1];
  let s = PLAY.emptyStore();
  s = PLAY.finish(s, '2026-11-09', m);
  check('first day played: streak 1', s.streak === 1 && s.best === 1 && s.played === 1 && s.last === '2026-11-09');
  s = PLAY.finish(s, '2026-11-10', m);
  s = PLAY.finish(s, '2026-11-11', m);
  check('three days running: streak 3', s.streak === 3 && s.best === 3 && s.played === 3);
  const again = PLAY.finish(s, '2026-11-11', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  check('finishing the same day twice changes nothing', again.streak === 3 && again.played === 3 && again.days['2026-11-11'].join() === m.join());
  check('streak still shows the next morning, before playing', PLAY.streakNow(s, '2026-11-12') === 3);
  check('miss a day and the streak shows 0', PLAY.streakNow(s, '2026-11-13') === 0);
  const back = PLAY.finish(s, '2026-11-14', m);
  check('coming back after a gap restarts at 1 and keeps the best', back.streak === 1 && back.best === 3 && back.played === 4);
  check('finish does not mutate the store it was given', s.streak === 3 && !s.days['2026-11-14']);
  let long = PLAY.emptyStore();
  for (let d = 0; d < 90; d++) long = PLAY.finish(long, PLAY.day(new Date(2026, 0, 1 + d)), m);
  check('ninety days in a row: streak 90, only the last 60 days kept on the device', long.streak === 90 && long.best === 90 && Object.keys(long.days).length === 60);
}

console.log('share text');
{
  const txt = PLAY.shareText('2026-11-09', [1, 1, 0, 1, 1, 1, 0, 1, 0, 1], 'https://example.test/#/play');
  const lines = txt.split('\n');
  check('four lines: title, score, hook, link', lines.length === 4 && lines[3] === 'https://example.test/#/play');
  check('the date is readable', lines[0] === 'FreeFlow Daily Ten · Nov 9');
  check('score and squares agree', lines[1].startsWith('7/10 ') && [...lines[1].slice(5)].join('') === '🟩🟩🟥🟩🟩🟩🟥🟩🟥🟩');
  check('it never names the companies (no spoilers)', !/[A-Z]{3,5}\b.*valued/.test(txt));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
