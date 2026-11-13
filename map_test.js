/* Checks for the market map's layout and colour maths (docs/map.js).

       node map_test.js

   A treemap that looks right can still be lying: tiles that overlap, areas
   that don't match the numbers, a company that silently falls off the canvas.
   These checks run the real layout on awkward inputs and on the live library. */

const MAP = require('./docs/map.js');
const fs = require('fs');

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok    ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const overlap = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1e-6 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1e-6;
const anyOverlap = rs => { for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (rs[i].w > 0 && rs[j].w > 0 && overlap(rs[i], rs[j])) return [i, j]; return null; };
const inside = (r, b) => r.x >= b.x - 1e-6 && r.y >= b.y - 1e-6 && r.x + r.w <= b.x + b.w + 1e-6 && r.y + r.h <= b.y + b.h + 1e-6;

console.log('squarify');
{
  const vals = [6, 6, 4, 3, 2, 2, 1];                    // the example from the original paper
  const rs = MAP.squarify(vals, 0, 0, 6, 4);
  check('one rectangle per value', rs.length === vals.length);
  check('each area matches its value', rs.every((r, i) => near(r.w * r.h, vals[i], 1e-9)), rs.map(r => (r.w * r.h).toFixed(2)).join(','));
  check('areas add up to the canvas', near(rs.reduce((s, r) => s + r.w * r.h, 0), 24, 1e-9));
  check('nothing overlaps', anyOverlap(rs) === null);
  check('everything is inside the canvas', rs.every(r => inside(r, { x: 0, y: 0, w: 6, h: 4 })));
  check('the paper\'s first tile: 6 becomes a 3 x 2 block on the left', near(rs[0].w, 3, 1e-9) && near(rs[0].h, 2, 1e-9) && rs[0].x === 0);

  const shuffled = [1, 6, 2, 3, 6, 2, 4], r2 = MAP.squarify(shuffled, 10, 20, 6, 4);
  check('input order is kept (unsorted input)', r2.every((r, i) => near(r.w * r.h, shuffled[i], 1e-9)));
  check('offset canvas respected', r2.every(r => inside(r, { x: 10, y: 20, w: 6, h: 4 })));

  const eq = MAP.squarify(new Array(36).fill(1), 0, 0, 600, 600);
  const worst = Math.max(...eq.map(r => Math.max(r.w / r.h, r.h / r.w)));
  check('equal values on a square give square tiles', worst < 1.01, worst.toFixed(3));

  // a hostile mix: one giant, many specks, zeros, a negative
  const mix = [5000, 0, 3, 2, 1, -4, 0.5, 900, 40, 40, 7];
  const rm = MAP.squarify(mix, 0, 0, 1000, 600);
  check('zeros and negatives get an empty tile, not NaN', rm.every(r => [r.x, r.y, r.w, r.h].every(Number.isFinite)) && rm[1].w * rm[1].h === 0 && rm[5].w * rm[5].h === 0);
  check('hostile mix: no overlaps, all inside', anyOverlap(rm) === null && rm.every(r => inside(r, { x: 0, y: 0, w: 1000, h: 600 })));
  check('hostile mix: areas still proportional', near(rm[0].w * rm[0].h / (rm[7].w * rm[7].h), 5000 / 900, 1e-6));
  check('empty input and zero-size canvas do not crash', MAP.squarify([], 0, 0, 10, 10).length === 0 && MAP.squarify([1, 2], 0, 0, 0, 10).every(r => r.w === 0));
  check('a single value fills the canvas', (() => { const r = MAP.squarify([3], 0, 0, 8, 5)[0]; return r.w === 8 && r.h === 5; })());
}

console.log('the real library');
{
  const raw = fs.readFileSync('./docs/data.js', 'utf8');
  const data = JSON.parse(raw.slice(raw.indexOf('{')).trim().replace(/;$/, ''));
  const groups = data.sectors.map(s => ({ k: s.k, items: data.companies.filter(c => c.sec === s.k).map(c => ({ t: c.t, v: c.mcap })) }));
  const n = data.companies.length;
  for (const [W, H] of [[1048, 620], [760, 500], [1600, 800]]) {
    const L = MAP.layout(groups, W, H);
    check(`${W}x${H}: every company has a tile`, L.tiles.length === n && new Set(L.tiles.map(t => t.t)).size === n);
    check(`${W}x${H}: no two tiles overlap`, anyOverlap(L.tiles) === null);
    check(`${W}x${H}: no two sectors overlap, and they fill the canvas`, anyOverlap(L.sectors) === null && near(L.sectors.reduce((s, r) => s + r.w * r.h, 0), W * H, 1));
    const secOf = Object.fromEntries(L.sectors.map(s => [s.k, s]));
    check(`${W}x${H}: every tile sits inside its own sector, under the label`, L.tiles.every(t => inside(t, { x: secOf[t.k].x, y: secOf[t.k].y + secOf[t.k].head, w: secOf[t.k].w, h: secOf[t.k].h - secOf[t.k].head })));
    check(`${W}x${H}: every tile is at least a visible dot`, L.tiles.every(t => t.w * t.h > 60), Math.min(...L.tiles.map(t => t.w * t.h)).toFixed(1));
  }
  const L = MAP.layout(groups, 1048, 620);
  const byT = Object.fromEntries(L.tiles.map(t => [t.t, t]));
  const big = data.companies.slice().sort((a, b) => b.mcap - a.mcap);
  check('the largest company has the largest tile', L.tiles.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0].t === big[0].t);
  // within one sector, tile area must be proportional to market value (label strips differ between sectors)
  const sem = data.companies.filter(c => c.sec === big[0].sec).sort((a, b) => b.mcap - a.mcap);
  const ratio = (byT[sem[0].t].w * byT[sem[0].t].h) / (byT[sem[1].t].w * byT[sem[1].t].h);
  check('within a sector, area is proportional to market value', near(ratio, sem[0].mcap / sem[1].mcap, 1e-6), ratio.toFixed(4));

  const eq = MAP.layout(groups.map(g => ({ k: g.k, items: g.items.map(it => ({ t: it.t, v: 1 })) })), 1048, 620, { floor: 0 });
  const areas = eq.tiles.map(t => t.w * t.h);
  check('equal mode: tiles are close to the same size', Math.max(...areas) / Math.min(...areas) < 1.35, (Math.max(...areas) / Math.min(...areas)).toFixed(3));

  const st = MAP.layout(groups, 358, 2300, { stacked: true, floor: 0, sectorFloor: 0.004 });
  check('phone layout: every tile is big enough to see and tap around (over 150 square px)', st.tiles.every(t => t.w * t.h > 150), Math.min(...st.tiles.map(t => t.w * t.h)).toFixed(0));
  check('phone layout: one full-width block per sector, stacked without overlap', st.sectors.every(s => s.x === 0 && s.w === 358) && anyOverlap(st.sectors) === null);
  check('phone layout: blocks are in sector order, top to bottom', st.sectors.every((s, i) => i === 0 || s.y > st.sectors[i - 1].y));
  check('phone layout: every tile inside its block, none overlapping', anyOverlap(st.tiles) === null && st.tiles.every(t => { const s = st.sectors.find(x => x.k === t.k); return inside(t, s); }));
  check('phone layout: reported height covers the last block', near(st.height, Math.max(...st.sectors.map(s => s.y + s.h)), 1e-6));
  check('a sector with no companies is skipped, not drawn empty', MAP.layout([{ k: 'a', items: [] }, { k: 'b', items: [{ t: 'X', v: 5 }] }], 100, 100).sectors.length === 1);
}

console.log('colour');
{
  const f = v => MAP.fill(v, 0.5);
  const dist = (css, to) => { const c = css.match(/\d+/g).map(Number); return Math.hypot(c[0] - to[0], c[1] - to[1], c[2] - to[2]); };
  check('zero is the neutral midpoint', f(0).css === `rgb(${MAP.MID.join(',')})`);
  check('at the clamp it is the full pole colour', f(0.5).css === `rgb(${MAP.POS.join(',')})` && f(-0.5).css === `rgb(${MAP.NEG.join(',')})`);
  check('beyond the clamp it stops changing', f(3).css === f(0.5).css && f(-9).css === f(-0.5).css);
  const steps = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5].map(v => dist(f(v).css, MAP.MID));
  check('colour strengthens steadily with the gap (both arms)', steps.every((d, i) => i === 0 || d > steps[i - 1]) &&
    [0, -0.05, -0.1, -0.2, -0.3, -0.4, -0.5].map(v => dist(f(v).css, MAP.MID)).every((d, i, a) => i === 0 || d > a[i - 1]));
  check('the two arms are equally strong at the same distance', near(f(0.25).t, f(-0.25).t, 1e-12));
  check('a missing value has no colour (drawn hatched)', f(null) === null && f(NaN) === null && f(undefined) === null);
  check('dark text only on the bright tiles', f(0.05).dark === false && f(0.5).dark === true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
