/* Checks for docs/montecarlo.js against cases with known answers.

       node montecarlo_test.js

   A simulator that draws a plausible-looking chart is easy to write and easy
   to get subtly wrong (a drift that is a little off, correlations that don't
   carry through, a tail that is too thin). So every test here compares the
   engine with something we can work out on paper. Exits non-zero on failure. */

const MC = require('./docs/montecarlo.js');

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('  ok    ' + name); }
  else { failed++; console.log('  FAIL  ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const rel = (a, b) => Math.abs(a / b - 1);

/* ------------------------------------------------------------ test data --- */

function gauss(seed) { return MC.normalSource(MC.mulberry32(seed)); }

/* A one-factor world: every stock = vol * (sqrt(rho)*market + sqrt(1-rho)*own noise). */
function makeWorld({ n, T, vols, rho, seed = 7, drift = 0.0003 }) {
  const g = gauss(seed);
  const closes = Array.from({ length: n }, () => [100]);
  for (let t = 0; t < T; t++) {
    const f = g();
    for (let i = 0; i < n; i++) {
      const r = drift + vols[i % vols.length] * (Math.sqrt(rho) * f + Math.sqrt(1 - rho) * g());
      closes[i].push(closes[i][t] * Math.exp(r));
    }
  }
  const dates = Array.from({ length: T + 1 }, (_, k) => 20000 + k);
  return { dates, closes };
}
function holdingsFrom(world, values, extra = {}) {
  return world.closes.map((c, i) => ({ t: 'S' + i, dates: world.dates, closes: c, value: values[i], price: 100, fv: 0, ...extra }));
}
function prepOf(h, market) { return MC.prepare(h, market || null); }
const norm = z => 0.5 * (1 + erf(z / Math.SQRT2));
function erf(x) {                                       // Abramowitz-Stegun 7.1.26, error < 1.5e-7
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

/* ------------------------------------------------------- random numbers --- */
console.log('random numbers');
{
  const a = MC.mulberry32(42), b = MC.mulberry32(42), c = MC.mulberry32(43);
  const xa = Array.from({ length: 20 }, a), xb = Array.from({ length: 20 }, b), xc = Array.from({ length: 20 }, c);
  check('same seed gives the same sequence', xa.every((v, i) => v === xb[i]));
  check('a different seed gives a different one', xa.some((v, i) => v !== xc[i]));
  const N = 200000, u = MC.mulberry32(5);
  let s = 0, s2 = 0;
  for (let i = 0; i < N; i++) { const v = u(); s += v; s2 += v * v; }
  check('uniform mean is 1/2', near(s / N, 0.5, 0.004), s / N);
  check('uniform variance is 1/12', near(s2 / N - (s / N) ** 2, 1 / 12, 0.002), s2 / N - (s / N) ** 2);
  const z = gauss(9);
  let m1 = 0, m2 = 0, m4 = 0, lag = 0, prev = 0;
  for (let i = 0; i < N; i++) { const v = z(); m1 += v; m2 += v * v; m4 += v ** 4; lag += v * prev; prev = v; }
  check('normal mean is 0', near(m1 / N, 0, 0.012), m1 / N);
  check('normal variance is 1', near(m2 / N, 1, 0.02), m2 / N);
  check('normal kurtosis is 3 (no thin tails)', near(m4 / N, 3, 0.1), m4 / N);
  check('successive normals are uncorrelated', near(lag / N, 0, 0.01), lag / N);
  check('hashSeed is stable and spreads', MC.hashSeed('AAPL,MSFT') === MC.hashSeed('AAPL,MSFT') && MC.hashSeed('AAPL,MSFT') !== MC.hashSeed('AAPL,MSFU'));
}

/* ------------------------------------------------------ linear algebra --- */
console.log('linear algebra');
{
  const n = 6, g = gauss(3);
  const X = Float64Array.from({ length: n * n }, g);
  const A = new Float64Array(n * n);                        // X X' + I is positive definite
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = i === j ? 1 : 0; for (let k = 0; k < n; k++) s += X[i * n + k] * X[j * n + k]; A[i * n + j] = s; }
  const L = MC.cholesky(A, n);
  let worst = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) s += L[i * n + k] * L[j * n + k]; worst = Math.max(worst, Math.abs(s - A[i * n + j])); }
  check('Cholesky: L times L-transpose gives A back', worst < 1e-9, worst);
  check('Cholesky: refuses a matrix that is not positive definite', MC.cholesky(Float64Array.from([1, 2, 2, 1]), 2) === null);
  const sing = Float64Array.from([1, 1, 1, 1]);              // two identical stocks
  check('robust Cholesky copes with a singular matrix', MC.choleskyRobust(sing, 2) !== null);
  const q = Float64Array.from([1, 2, 3, 4, 5]);
  check('quantile: median and interpolation', MC.quantileSorted(q, 0.5) === 3 && near(MC.quantileSorted(q, 0.125), 1.5, 1e-12) && MC.quantileSorted(q, 0) === 1 && MC.quantileSorted(q, 1) === 5);
}

/* --------------------------------------------------- shrinkage estimator --- */
console.log('covariance shrinkage');
{
  // truth: 30 stocks, vols 15-45%, correlation 0.35; 60 days of data is far too few to learn that
  const n = 30, T = 60;
  const sd = Array.from({ length: n }, (_, i) => (0.15 + 0.30 * (i / (n - 1))) / Math.sqrt(252));
  const truth = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) truth[i * n + j] = i === j ? sd[i] ** 2 : 0.35 * sd[i] * sd[j];
  const L = MC.cholesky(truth, n);
  const frob = (A) => { let s = 0; for (let k = 0; k < n * n; k++) s += (A[k] - truth[k]) ** 2; return Math.sqrt(s); };
  let errSample = 0, errShrunk = 0, allPD = true, allDelta = true, diagOK = true;
  const trials = 12, g = gauss(11);
  for (let tr = 0; tr < trials; tr++) {
    const R = new Float64Array(T * n), z = new Float64Array(n);
    for (let t = 0; t < T; t++) {
      for (let i = 0; i < n; i++) z[i] = g();
      for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j <= i; j++) s += L[i * n + j] * z[j]; R[t * n + i] = s; }
    }
    const sample = MC.sampleCov(R, T, n).S;
    const sh = MC.shrunkCov(R, T, n);
    errSample += frob(sample); errShrunk += frob(sh.cov);
    if (!MC.cholesky(sh.cov, n)) allPD = false;
    if (!(sh.delta >= 0 && sh.delta <= 1)) allDelta = false;
    for (let i = 0; i < n; i++) if (Math.abs(sh.cov[i * n + i] - sample[i * n + i]) > 1e-15) diagOK = false;
  }
  check('shrunk estimate is much closer to the truth than the raw one (60 days, 30 stocks)', errShrunk < 0.75 * errSample, (errShrunk / errSample).toFixed(2));
  check('shrunk matrix is always positive definite', allPD);
  check('shrinkage intensity stays between 0 and 1', allDelta);
  check("each stock keeps its own measured volatility", diagOK);

  // more stocks than days: the raw matrix is singular, the shrunk one must still work
  const n2 = 40, T2 = 30, R2 = Float64Array.from({ length: n2 * T2 }, () => 0.01 * g());
  const raw = MC.sampleCov(R2, T2, n2).S;
  check('with more stocks than days the raw matrix is unusable', MC.cholesky(raw, n2) === null);
  check('... and the shrunk one still works', MC.cholesky(MC.shrunkCov(R2, T2, n2).cov, n2) !== null);

  // plenty of data and real structure (two sectors that move apart): leave it alone
  const gb = gauss(23), nb = 6, Tb = 5000, Rb = new Float64Array(Tb * nb);
  for (let t = 0; t < Tb; t++) {
    const f = [gb(), gb()];
    for (let i = 0; i < nb; i++) Rb[t * nb + i] = 0.01 * (Math.sqrt(0.7) * f[i < 3 ? 0 : 1] + Math.sqrt(0.3) * gb());
  }
  const shBlock = MC.shrunkCov(Rb, Tb, nb);
  check('with lots of data and a clear sector structure the shrinkage is small', shBlock.delta < 0.15, shBlock.delta.toFixed(3));
  // when the truth really is one common correlation, leaning on that target is the right call
  const wc = makeWorld({ n: 4, T: 5000, vols: [0.01], rho: 0.5, seed: 21 });
  const Rc = new Float64Array(5000 * 4);
  for (let t = 0; t < 5000; t++) for (let i = 0; i < 4; i++) Rc[t * 4 + i] = Math.log(wc.closes[i][t + 1] / wc.closes[i][t]);
  const shC = MC.shrunkCov(Rc, 5000, 4);
  check('when the true correlation is constant, shrinkage rightly goes (nearly) all the way', shC.delta > 0.5 && near(shC.rBar, 0.5, 0.03), shC.delta.toFixed(3) + ' / ' + shC.rBar.toFixed(3));
  check('single stock: nothing to shrink', MC.shrunkCov(Float64Array.from([0.01, -0.01, 0.02, 0.0]), 4, 1).delta === 0);
}

/* ---------------------------------------------------- matching the days --- */
console.log('turning prices into returns');
{
  const w = makeWorld({ n: 3, T: 200, vols: [0.012], rho: 0.4, seed: 2 });
  const h = holdingsFrom(w, [1000, 1000, 1000]);
  const p = prepOf(h);
  check('clean data: every day is used, every holding modelled on its own', p.ok && p.T === 200 && p.kinds.every(k => k === 'own'), JSON.stringify(p.kinds));
  const expect = Math.log(w.closes[1][50] / w.closes[1][49]);
  check('returns are log price changes', p.ok && near(p.R[49 * 3 + 1], expect, 1e-12));

  // a new listing: 30 days of history
  const mk = { dates: w.dates, closes: w.closes[0].map((c, i) => c * (1 + 0.0001 * i)) };
  const h2 = holdingsFrom(w, [1000, 1000, 1000]);
  h2[2] = { ...h2[2], dates: h2[2].dates.slice(-31), closes: h2[2].closes.slice(-31) };
  const p2 = prepOf(h2, mk);
  check('a holding with 30 days of history is stood in for by the market', p2.ok && p2.kinds[2] === 'proxy' && p2.kinds[0] === 'own' && p2.active.length === 3);
  const p3 = prepOf(h2, null);
  check('... and with no market series it is held flat', p3.ok && p3.kinds[2] === 'flat' && p3.active.length === 2);

  // a bad print: 10x on one day is dropped, not simulated
  const h3 = holdingsFrom(w, [1000, 1000, 1000]);
  h3[0] = { ...h3[0], closes: h3[0].closes.map((c, i) => i === 100 ? c * 10 : c) };
  const p4 = prepOf(h3);
  check('a bad price print is discarded (both days around it)', p4.ok && p4.T === 198 && Math.max(...p4.R.map(Math.abs)) < MC.prepare.length + 1, p4.T);

  // different trading calendars: holiday on another exchange
  const h4 = holdingsFrom(w, [1000, 1000, 1000]);
  const drop = new Set([40, 41, 90, 150]);
  h4[1] = { ...h4[1], dates: h4[1].dates.filter((_, i) => !drop.has(i)), closes: h4[1].closes.filter((_, i) => !drop.has(i)) };
  const p5 = prepOf(h4);
  check('missing days on one listing: matched, not mixed up', p5.ok && p5.kinds[1] === 'own' && p5.T < 200 && p5.T > 190, p5.T);
  check('too little data in total is refused', prepOf(holdingsFrom(makeWorld({ n: 1, T: 30, vols: [0.01], rho: 0 }), [1000])).ok === false);
  check('nothing to model is refused', MC.prepare([], null).ok === false);
}

/* ------------------------------------------------------ the simulation --- */
console.log('simulation: one stock, known answer');
{
  const w = makeWorld({ n: 1, T: 252, vols: [0.0125], rho: 0, seed: 31 });
  const h = holdingsFrom(w, [10000]);
  const prep = prepOf(h);
  const years = 3, base = 0.08;
  const res = MC.run(prep, h, { months: 36, paths: 40000, seed: 5, baseDrift: base });
  const vol = res.risk.holdings[0].vol;
  check('month 0 is exactly what you hold today', res.neutral.bands.every(b => b[0] === 10000));
  check('average outcome equals the assumed return (1.08^3)', rel(res.neutral.mean / 10000, Math.pow(1 + base, years)) < 0.006, (res.neutral.mean / 10000).toFixed(4) + ' vs ' + Math.pow(1 + base, years).toFixed(4));
  const mu = years * Math.log(1 + base) - years * vol * vol / 2, sd = vol * Math.sqrt(years);
  check('median is where a lognormal with this volatility puts it', rel(res.neutral.median / 10000, Math.exp(mu)) < 0.008, (res.neutral.median / 10000).toFixed(4) + ' vs ' + Math.exp(mu).toFixed(4));
  check('5th and 95th percentiles match the lognormal', rel(res.neutral.p05 / 10000, Math.exp(mu - 1.6449 * sd)) < 0.015 && rel(res.neutral.p95 / 10000, Math.exp(mu + 1.6449 * sd)) < 0.015);
  check('chance of ending lower matches the normal formula', near(res.neutral.probLoss, norm(-mu / sd), 0.01), res.neutral.probLoss.toFixed(4) + ' vs ' + norm(-mu / sd).toFixed(4));
  check('the average of the worst 5% is below the 5th percentile', res.neutral.avgWorst5 < res.neutral.p05);
  const ordered = res.neutral.bands[0].every((_, m) => res.neutral.bands.every((b, k, all) => k === 0 || b[m] >= all[k - 1][m] - 1e-9));
  check('percentile bands never cross', ordered);
  check('chance of a 20% fall at some point is at least the chance of ending 20% down', res.neutral.probDrop20 >= res.neutral.probLoss20);
  check('every number is finite', [res.neutral.median, res.neutral.mean, res.neutral.p05, res.neutral.p95, res.neutral.avgWorst5, res.neutral.probLoss, res.risk.portVol].every(Number.isFinite));
  check('single stock: it is 100% of the risk', near(res.risk.holdings[0].share, 1, 1e-12));
}

console.log('simulation: how stocks move together');
{
  const vol = 0.0125;
  const run = (rho, weights, extra) => {
    const w = makeWorld({ n: 2, T: 4000, vols: [vol], rho, seed: 41 });
    const h = holdingsFrom(w, weights);
    const prep = MC.prepare(h, null, { maxRows: 4000 });   // use the whole sample: this test checks the engine, not one year's luck
    return MC.run(prep, h, { months: 12, paths: 30000, seed: 8, ...(extra || {}) });
  };
  const annual = vol * Math.sqrt(252);
  const indep = run(0, [5000, 5000]);
  check('two independent equal stocks: portfolio volatility is vol / sqrt(2)', rel(indep.risk.portVol, annual / Math.SQRT2) < 0.06, indep.risk.portVol.toFixed(4) + ' vs ' + (annual / Math.SQRT2).toFixed(4));
  const tied = run(0.8, [5000, 5000]);
  check('highly correlated stocks: volatility is close to a single stock', tied.risk.portVol > 0.93 * annual * Math.sqrt((1 + 0.8) / 2) && tied.risk.portVol < 1.07 * annual * Math.sqrt((1 + 0.8) / 2), tied.risk.portVol.toFixed(4));
  check('diversification shows up in the simulated spread, not just the formula',
    (indep.neutral.p95 - indep.neutral.p05) < 0.85 * (tied.neutral.p95 - tied.neutral.p05));
  const spread = r => Math.log(r.neutral.p95 / r.neutral.p05) / (2 * 1.6449);
  check('simulated one-year spread matches the portfolio volatility (independent)', rel(spread(indep), indep.risk.portVol) < 0.06, spread(indep).toFixed(4) + ' vs ' + indep.risk.portVol.toFixed(4));
  check('simulated one-year spread matches the portfolio volatility (correlated)', rel(spread(tied), tied.risk.portVol) < 0.06, spread(tied).toFixed(4) + ' vs ' + tied.risk.portVol.toFixed(4));
  check('equal weights, same volatility: equal share of the risk', near(indep.risk.holdings[0].share, 0.5, 0.06));
  const lopsided = run(0.3, [9000, 1000]);
  const shares = lopsided.risk.holdings.reduce((s, x) => s + x.share, 0);
  check('shares of risk add up to 100%', near(shares, 1, 1e-9), shares);
  const big = lopsided.risk.holdings.find(x => x.t === 'S0');
  check('the 90% holding is well over 90% of the risk when the volatilities match', big.share > 0.9 && big.share < 1, big.share.toFixed(3));
}

console.log('simulation: bootstrap and our view');
{
  const w = makeWorld({ n: 3, T: 252, vols: [0.011, 0.016, 0.022], rho: 0.4, seed: 51 });
  const h = holdingsFrom(w, [4000, 3000, 3000]);
  const prep = prepOf(h);
  const nrm = MC.run(prep, h, { months: 36, paths: 20000, seed: 3, method: 'normal' });
  const bs = MC.run(prep, h, { months: 36, paths: 20000, seed: 3, method: 'bootstrap' });
  check('bootstrap: average outcome equals the assumed return too', rel(bs.neutral.mean / 10000, Math.pow(1.08, 3)) < 0.01, (bs.neutral.mean / 10000).toFixed(4));

  // With a long history the two methods describe the same bell-shaped world and must agree.
  const wl = makeWorld({ n: 3, T: 5000, vols: [0.011, 0.016, 0.022], rho: 0.4, seed: 52 });
  const hl = holdingsFrom(wl, [4000, 3000, 3000]);
  const pl = MC.prepare(hl, null, { maxRows: 5000 });
  const nl = MC.run(pl, hl, { months: 36, paths: 20000, seed: 3, method: 'normal' });
  const bl = MC.run(pl, hl, { months: 36, paths: 20000, seed: 3, method: 'bootstrap' });
  const sp = r => r.neutral.p95 - r.neutral.p05;
  check('bootstrap and bell-curve agree on a long, bell-shaped history (spread within 5%)', rel(sp(bl), sp(nl)) < 0.05, (sp(bl) / sp(nl)).toFixed(3));
  check('... and on the bad case', rel(bl.neutral.p05, nl.neutral.p05) < 0.05);

  // On one year of data the month-long windows lose 1 - 21/252 of their variance to the mean being removed;
  // the engine puts it back. Averaged over many independent years, the bootstrap must not run low.
  let acc = 0, worlds = 80;
  for (let k = 0; k < worlds; k++) {
    const w1 = makeWorld({ n: 1, T: 252, vols: [0.012], rho: 0, seed: 1000 + k });
    const h1 = holdingsFrom(w1, [10000]);
    const r1 = MC.run(prepOf(h1), h1, { months: 12, paths: 4000, seed: 9 + k, method: 'bootstrap' });
    acc += Math.log(r1.neutral.p95 / r1.neutral.p05) / (2 * 1.6449);
  }
  const trueAnnual = 0.012 * Math.sqrt(252);
  check('bootstrap on a year of data is not biased low (mean of 80 years within 3% of the true volatility)', rel(acc / worlds, trueAnnual) < 0.03, (acc / worlds).toFixed(4) + ' vs ' + trueAnnual.toFixed(4));

  // fat tails: the same history plus a handful of -9% days. The bootstrap must see the crash; the bell curve under-reacts.
  const wf = makeWorld({ n: 3, T: 252, vols: [0.011, 0.016, 0.022], rho: 0.4, seed: 51 });
  const shock = [30, 31, 120, 200];
  for (const c of wf.closes) for (const d of shock) for (let k = d; k < c.length; k++) c[k] *= 0.91;
  const hf = holdingsFrom(wf, [4000, 3000, 3000]);
  const pf = prepOf(hf);
  const nf = MC.run(pf, hf, { months: 12, paths: 20000, seed: 3, method: 'normal' });
  const bf = MC.run(pf, hf, { months: 12, paths: 20000, seed: 3, method: 'bootstrap' });
  check('bootstrap keeps the crash days: its bad case is worse than the bell curve fitted to the same data', bf.neutral.p05 < nf.neutral.p05, bf.neutral.p05.toFixed(0) + ' vs ' + nf.neutral.p05.toFixed(0));

  // our view, one stock, known multiplier
  const w1 = makeWorld({ n: 1, T: 252, vols: [0.012], rho: 0, seed: 61 });
  const mk = (fv, price) => holdingsFrom(w1, [10000], { fv, price });
  const ratio = (fv, price, months = 36) => {
    const hh = mk(fv, price);
    const r = MC.run(prepOf(hh), hh, { months, paths: 6000, seed: 4 });
    return r;
  };
  let r = ratio(150, 100);
  check('fair value 50% above price: our view adds exp(half the log gap)', rel(r.view.median / r.neutral.median, Math.exp(0.5 * Math.log(1.5))) < 1e-9, (r.view.median / r.neutral.median).toFixed(4));
  r = ratio(500, 100);
  check('a huge gap is capped at 10% a year (3 years: exp(0.30))', rel(r.view.median / r.neutral.median, Math.exp(0.30)) < 1e-9, (r.view.median / r.neutral.median).toFixed(4));
  r = ratio(60, 100);
  check('fair value below price pulls the view down', r.view.median < r.neutral.median && rel(r.view.median / r.neutral.median, Math.exp(0.5 * Math.log(0.6))) < 1e-9);
  r = ratio(0, 100);
  check('no fair value: the view is identical to the neutral run', r.view.median === r.neutral.median && r.tilted.length === 0);
  r = ratio(150, 100, 60);
  const m36 = r.view.bands[2][36] / r.neutral.bands[2][36], m60 = r.view.bands[2][60] / r.neutral.bands[2][60];
  check('the pull toward fair value stops after three years', rel(m60, m36) < 1e-9, m36.toFixed(5) + ' vs ' + m60.toFixed(5));
  r = ratio(150, 100, 12);
  check('over one year only a third of the pull has happened', rel(r.view.median / r.neutral.median, Math.exp(0.5 * Math.log(1.5) / 3)) < 1e-9);
  const h1 = mk(150, 100);
  const a = MC.run(prepOf(h1), h1, { months: 24, paths: 3000, seed: 77 }), b = MC.run(prepOf(h1), h1, { months: 24, paths: 3000, seed: 77 });
  const c = MC.run(prepOf(h1), h1, { months: 24, paths: 3000, seed: 78 });
  check('same seed, same answer, to the last digit', a.neutral.median === b.neutral.median && a.neutral.p05 === b.neutral.p05 && a.view.avgWorst5 === b.view.avgWorst5);
  check('different seed: different draw, same story (medians within 2%)', a.neutral.median !== c.neutral.median && rel(a.neutral.median, c.neutral.median) < 0.02);
}

console.log('edge cases and speed');
{
  const w = makeWorld({ n: 2, T: 252, vols: [0.012], rho: 0.3, seed: 71 });
  const h = holdingsFrom(w, [5000, 5000]);
  const hf = h.map((x, i) => i === 1 ? { ...x, dates: x.dates.slice(-20), closes: x.closes.slice(-20) } : x);
  const pf = prepOf(hf, null);
  const rf = MC.run(pf, hf, { months: 12, paths: 8000, seed: 1 });
  const rn = MC.run(prepOf(h), h, { months: 12, paths: 8000, seed: 1 });
  check('a held-flat position keeps its value in every path (and still counts toward the total)', rf.start === 10000 && rf.flat === 5000 && rf.neutral.p05 > 5000 * 0.3 + 5000);
  check('... which makes the portfolio less volatile than the same two live stocks', (rf.neutral.p95 - rf.neutral.p05) < 0.75 * (rn.neutral.p95 - rn.neutral.p05));

  const twin = makeWorld({ n: 1, T: 252, vols: [0.012], rho: 0, seed: 72 });
  const ht = [0, 1].map(i => ({ t: 'X' + i, dates: twin.dates, closes: twin.closes[0], value: 5000, price: 100, fv: 0 }));
  let threw = false, rt = null;
  try { rt = MC.run(prepOf(ht), ht, { months: 12, paths: 3000, seed: 1 }); } catch (e) { threw = true; }
  check('two identical stocks (singular covariance) do not break it', !threw && Number.isFinite(rt.neutral.median));

  threw = false;
  try { MC.run(prepOf(h), h.map(x => ({ ...x, value: 0 })), { months: 12, paths: 100 }); } catch (e) { threw = true; }
  check('a worthless portfolio is refused cleanly', threw);

  check('path count scales down for big portfolios and stays within 2000-5000',
    MC.pathsFor(1, 12) === 5000 && MC.pathsFor(30, 60) < 5000 && MC.pathsFor(200, 60) === 2000);

  const big = makeWorld({ n: 30, T: 252, vols: [0.01, 0.015, 0.02, 0.03], rho: 0.35, seed: 81 });
  const hb = holdingsFrom(big, Array.from({ length: 30 }, (_, i) => 1000 + 100 * i), { fv: 120, price: 100 });
  const t0 = Date.now();
  const rb = MC.run(prepOf(hb), hb, { months: 60, seed: 2 });
  const ms = Date.now() - t0;
  check('30 holdings over 5 years runs in a few seconds even in Node (' + ms + ' ms, ' + rb.paths + ' paths)', ms < 4000);
  check('... and the risk list covers all 30', rb.risk.holdings.length === 30 && near(rb.risk.holdings.reduce((s, x) => s + x.share, 0), 1, 1e-9));
  check('... with a portfolio volatility below the average holding (diversification)', rb.risk.portVol < rb.risk.avgVol);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
