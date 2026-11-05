/* ============================================================================
   MONTE CARLO PORTFOLIO SIMULATION
   ----------------------------------------------------------------------------
   Answers one question for the Portfolio page: "if I just hold these stocks,
   what range of outcomes is realistic, and how bad is the bad end?"

   This file is plain functions with no page code in it, so the same file runs
   in the browser and under Node (montecarlo_test.js checks the maths against
   cases with known answers). The page code that draws it lives in views.js.

   HOW IT WORKS
   1. Returns. Daily log returns for every holding come from the last year of
      closes in history.js. Days are matched across holdings first (prepare()).
      A holding with too little history is stood in for by the S&P 500, and
      the page says so.
   2. Risk. How much each stock moves, and how the stocks move TOGETHER, is
      estimated from those returns. One year of data is far too little to
      estimate a 20-by-20 table of co-movements reliably, so the sample
      covariance matrix is shrunk toward a constant-correlation matrix with
      the Ledoit-Wolf (2004) intensity. That is the standard fix, and it is
      what makes the result stable when someone holds many stocks.
   3. Drift. The past year's average return is NOT used: one year of luck
      says almost nothing about the next. Every stock is given the same
      long-run expected return (baseDrift), and each month's random shock is
      calibrated so the simulated average outcome equals exactly that.
   4. Paths. Two ways to generate monthly shocks:
        'normal'    correlated bell-curve shocks (Cholesky of the shrunk matrix)
        'bootstrap' month-long windows of what actually happened, drawn at
                    random, so real crashes and rallies can repeat
      Each path is a buy-and-hold: no rebalancing, no dividends, no tax.
   5. Our view. The same shocks are run a second time with an extra drift
      toward each stock's fair value (half the gap, spread over three years,
      capped), so the page can show what our valuations would add IF right.
      It is a scenario, never presented as a forecast.

   Same seed, same answer: the random numbers are a seeded generator, so a
   portfolio looks identical on every visit until someone presses "run again".
   ========================================================================== */
(function (root) {
  'use strict';

  const TRADING_DAYS = 252;
  const MONTH_DAYS = 21;               // trading days per simulated step
  const MIN_RETURNS = 60;              // fewer daily returns than this is not enough to estimate risk
  const MAX_DAILY_MOVE = 0.7;          // |log return| above this is a data glitch, not a market move
  const VAR_FLOOR = 1e-7;              // daily variance floor (~0.5% a year): keeps a flat series from breaking the maths

  const DEFAULTS = {
    months: 36,
    paths: 5000,
    method: 'normal',                  // 'normal' | 'bootstrap'
    seed: 1,
    baseDrift: 0.08,                   // expected return per year, every stock, before our view
    tiltShare: 0.5,                    // our view: share of the gap to fair value that closes ...
    tiltYears: 3,                      // ... over this many years ...
    tiltCap: 0.10,                     // ... but never more than this per year (log terms)
  };

  /* ------------------------------------------------------------- random --- */

  function hashSeed(str) {             // FNV-1a, 32 bit
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normalSource(rng) {         // Box-Muller, both values of each pair used
    let spare = NaN;
    return function () {
      if (spare === spare) { const s = spare; spare = NaN; return s; }
      let u = 0;
      while (u === 0) u = rng();
      const v = rng();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    };
  }

  /* ------------------------------------------------------- linear algebra --- */
  /* Matrices are flat Float64Arrays, row-major. R is T rows (days) by n columns. */

  function sampleCov(R, T, n) {
    const mean = new Float64Array(n);
    for (let t = 0; t < T; t++) for (let i = 0; i < n; i++) mean[i] += R[t * n + i];
    for (let i = 0; i < n; i++) mean[i] /= T;
    const X = new Float64Array(T * n);                 // demeaned
    for (let t = 0; t < T; t++) for (let i = 0; i < n; i++) X[t * n + i] = R[t * n + i] - mean[i];
    const S = new Float64Array(n * n);
    for (let t = 0; t < T; t++) {
      for (let i = 0; i < n; i++) {
        const xi = X[t * n + i];
        for (let j = i; j < n; j++) S[i * n + j] += xi * X[t * n + j];
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        S[i * n + j] /= T;
        S[j * n + i] = S[i * n + j];
      }
    }
    return { S, X, mean };
  }

  /* Ledoit-Wolf (2004) shrinkage toward a constant-correlation matrix.
     Returns { cov, delta, rBar }. delta is how far we pulled toward the target
     (0 = the raw sample matrix, 1 = all target). The diagonal is never changed:
     each stock keeps its own measured volatility. */
  function shrunkCov(R, T, n) {
    const { S, X } = sampleCov(R, T, n);
    for (let i = 0; i < n; i++) if (!(S[i * n + i] > VAR_FLOOR)) S[i * n + i] = VAR_FLOOR;
    if (n === 1) return { cov: S, delta: 0, rBar: 1 };

    const sd = new Float64Array(n);
    for (let i = 0; i < n; i++) sd[i] = Math.sqrt(S[i * n + i]);
    let rSum = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) rSum += S[i * n + j] / (sd[i] * sd[j]);
    const rBar = rSum / (n * (n - 1));

    const F = new Float64Array(n * n);                 // the constant-correlation target
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) F[i * n + j] = i === j ? S[i * n + i] : rBar * sd[i] * sd[j];

    // pi-hat: how noisy each sample covariance entry is
    const phi = new Float64Array(n * n), theta = new Float64Array(n * n);
    for (let t = 0; t < T; t++) {
      for (let i = 0; i < n; i++) {
        const xi = X[t * n + i], xi2 = xi * xi, xi3 = xi2 * xi;
        for (let j = 0; j < n; j++) {
          const xj = X[t * n + j];
          phi[i * n + j] += xi2 * xj * xj;
          theta[i * n + j] += xi3 * xj;
        }
      }
    }
    let pi = 0, rho = 0, gamma = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const s = S[i * n + j];
        const piij = phi[i * n + j] / T - s * s;
        pi += piij;
        if (i === j) rho += piij;
        else {
          const th = theta[i * n + j] / T - S[i * n + i] * s;
          rho += (rBar / 2) * (sd[j] / sd[i] * th + sd[i] / sd[j] * (theta[j * n + i] / T - S[j * n + j] * s));
        }
        const d = F[i * n + j] - s;
        gamma += d * d;
      }
    }
    const kappa = gamma > 0 ? (pi - rho) / gamma : 0;
    const delta = Math.max(0, Math.min(1, kappa / T));
    const cov = new Float64Array(n * n);
    for (let k = 0; k < n * n; k++) cov[k] = delta * F[k] + (1 - delta) * S[k];
    return { cov, delta, rBar };
  }

  /* Lower-triangular L with L * L' = A, or null if A is not positive definite. */
  function cholesky(A, n) {
    const L = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let s = A[i * n + j];
        for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
        if (i === j) {
          if (!(s > 1e-12 * A[i * n + i])) return null;
          L[i * n + i] = Math.sqrt(s);
        } else {
          L[i * n + j] = s / L[j * n + j];
        }
      }
    }
    return L;
  }

  /* If rounding leaves the matrix a hair short of positive definite, nudge the
     diagonal up by the smallest amount that works. */
  function choleskyRobust(A, n) {
    let L = cholesky(A, n);
    if (L) return L;
    let mean = 0;
    for (let i = 0; i < n; i++) mean += A[i * n + i] / n;
    let jitter = mean * 1e-10;
    for (let attempt = 0; attempt < 12; attempt++, jitter *= 10) {
      const B = Float64Array.from(A);
      for (let i = 0; i < n; i++) B[i * n + i] += jitter;
      L = cholesky(B, n);
      if (L) return L;
    }
    return null;
  }

  /* --------------------------------------------------------------- stats --- */

  function quantileSorted(a, p) {      // linear interpolation between order statistics
    const n = a.length;
    if (!n) return NaN;
    const x = p * (n - 1), lo = Math.floor(x), hi = Math.min(n - 1, lo + 1);
    return a[lo] + (a[hi] - a[lo]) * (x - lo);
  }

  /* -------------------------------------------------------- data to returns --- */

  /* Turns raw closes into a matrix of daily log returns, one column per holding.

     holdings: [{ t, dates: [day numbers], closes: [...] }]
     market:   { dates, closes } or null   (stand-in for holdings with short history)

     Days are matched across holdings: a day counts only if every holding that
     is modelled on its own has a clean close on that day and the day before.
     Returns { ok, reason?, T, active, kinds, R, from, to, droppedDays }.
       active  indices (into holdings) of the columns of R
       kinds   per holding: 'own' | 'proxy' | 'flat'
     'proxy' holdings get the market's returns; 'flat' ones (no market series
     either) are held at today's value. */
  function prepare(holdings, market, opts) {
    const o = Object.assign({ maxRows: TRADING_DAYS }, opts || {});
    const series = holdings.map(h => ({ dates: h.dates || [], closes: h.closes || [] }));
    if (market) series.push({ dates: market.dates || [], closes: market.closes || [] });
    const nh = holdings.length;
    if (!nh) return { ok: false, reason: 'empty' };

    // The calendar is that of the longest series.
    let ref = series[0].dates;
    for (const s of series) if (s.dates.length > ref.length) ref = s.dates;
    const R0 = ref.length;
    if (R0 < MIN_RETURNS + 1) return { ok: false, reason: 'short' };
    const pos = new Map();
    ref.forEach((d, i) => pos.set(d, i));

    // returns[k][r]: log return on ref day r (from day r-1), or NaN
    const rets = series.map(s => {
      const c = new Float64Array(R0).fill(NaN);
      for (let i = 0; i < s.dates.length; i++) {
        const r = pos.get(s.dates[i]);
        const v = s.closes[i];
        if (r !== undefined && typeof v === 'number' && v > 0 && isFinite(v)) c[r] = v;
      }
      const out = new Float64Array(R0).fill(NaN);
      for (let r = 1; r < R0; r++) {
        if (c[r] > 0 && c[r - 1] > 0) {
          const x = Math.log(c[r] / c[r - 1]);
          if (Math.abs(x) < MAX_DAILY_MOVE) out[r] = x;
        }
      }
      return out;
    });
    const count = a => { let n = 0; for (let r = 1; r < R0; r++) if (a[r] === a[r]) n++; return n; };
    const cnt = rets.map(count);
    const maxCnt = Math.max(...cnt.slice(0, nh));
    const marketOk = !!market && cnt[nh] >= MIN_RETURNS;

    let own = [];
    for (let k = 0; k < nh; k++) if (cnt[k] >= Math.max(MIN_RETURNS, 0.7 * maxCnt)) own.push(k);

    // Rows where every own holding (and the market, if it is needed) has a return.
    const needMarket = () => marketOk && own.length < nh;
    const completeRows = () => {
      const rows = [];
      for (let r = 1; r < R0; r++) {
        let good = true;
        for (const k of own) if (rets[k][r] !== rets[k][r]) { good = false; break; }
        if (good && needMarket() && rets[nh][r] !== rets[nh][r]) good = false;
        if (good) rows.push(r);
      }
      return rows;
    };
    let rows = completeRows();
    // A holding whose gaps fall on different days than the rest would sink the whole
    // calculation. Move the sparsest one to "stand-in" and try again.
    while (rows.length < MIN_RETURNS && own.length > 1) {
      let worst = own[0];
      for (const k of own) if (cnt[k] < cnt[worst]) worst = k;
      own = own.filter(k => k !== worst);
      rows = completeRows();
    }
    if (!own.length || rows.length < MIN_RETURNS) return { ok: false, reason: 'short' };
    if (rows.length > o.maxRows) rows = rows.slice(rows.length - o.maxRows);

    const kinds = [];
    const active = [];
    for (let k = 0; k < nh; k++) {
      if (own.includes(k)) { kinds.push('own'); active.push(k); }
      else if (marketOk) { kinds.push('proxy'); active.push(k); }
      else kinds.push('flat');
    }
    const T = rows.length, n = active.length;
    const R = new Float64Array(T * n);
    for (let a = 0; a < n; a++) {
      const src = rets[kinds[active[a]] === 'own' ? active[a] : nh];
      for (let t = 0; t < T; t++) R[t * n + a] = src[rows[t]];
    }
    return {
      ok: true, T, active, kinds, R,
      from: ref[rows[0] - 1], to: ref[rows[T - 1]],
      droppedDays: (R0 - 1) - rows.length,
    };
  }

  /* ------------------------------------------------------------ simulation --- */

  /* How many paths the browser can afford for a portfolio of this size. */
  function pathsFor(n, months) {
    const cost = months * (n * n / 2 + 8 * n);
    return Math.max(2000, Math.min(5000, Math.floor(1.5e8 / cost)));
  }

  /* prep:     the result of prepare()
     holdings: [{ t, value, price, fv }] in the same order given to prepare();
               value is today's dollar value of the position
     opts:     see DEFAULTS; also opts.paths
     Returns the percentile bands, the headline numbers for both scenarios, and
     where the portfolio's risk comes from. */
  function run(prep, holdings, opts) {
    if (!prep || !prep.ok) throw new Error('prepare() must succeed first');
    const o = Object.assign({}, DEFAULTS, opts || {});
    const months = Math.max(1, Math.round(o.months));
    const n = prep.active.length, T = prep.T;
    const paths = o.paths || pathsFor(n, months);

    const val = new Float64Array(n);                    // value of each modelled holding
    let flat = 0, total = 0;
    holdings.forEach((h, k) => {
      const v = Math.max(0, h.value || 0);
      total += v;
      if (prep.kinds[k] === 'flat') flat += v;
    });
    prep.active.forEach((k, a) => { val[a] = Math.max(0, holdings[k].value || 0); });
    if (!(total > 0)) throw new Error('portfolio has no value');

    // ---- risk: shrunk daily covariance, scaled to a month
    const sc = shrunkCov(prep.R, T, n);
    const cov = sc.cov;
    const covM = new Float64Array(n * n);
    for (let k = 0; k < n * n; k++) covM[k] = cov[k] * MONTH_DAYS;
    const vol = new Float64Array(n);
    for (let i = 0; i < n; i++) vol[i] = Math.sqrt(cov[i * n + i] * TRADING_DAYS);

    // ---- where today's risk comes from (Euler decomposition of variance)
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = val[i] / total;
    const cw = new Float64Array(n);                     // (Cov * w)_i
    let pv = 0;
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += cov[i * n + j] * w[j];
      cw[i] = s; pv += w[i] * s;
    }
    const portVol = Math.sqrt(Math.max(0, pv) * TRADING_DAYS);
    let avgVol = 0;
    for (let i = 0; i < n; i++) avgVol += w[i] * vol[i];
    const risk = prep.active.map((k, a) => ({
      t: holdings[k].t, weight: w[a], vol: vol[a],
      share: pv > 0 ? w[a] * cw[a] / pv : 0,
      proxy: prep.kinds[k] === 'proxy',
    }));

    // ---- shocks and drift
    const lnBase = Math.log1p(o.baseDrift);
    const lnM = new Float64Array(n);                    // log of E[exp(shock)] per step
    let L = null, B = null;
    if (o.method === 'bootstrap') {
      // Every month-long window of the sample, with the sample mean removed.
      const X = new Float64Array(T * n), mean = new Float64Array(n);
      for (let t = 0; t < T; t++) for (let i = 0; i < n; i++) mean[i] += prep.R[t * n + i] / T;
      for (let t = 0; t < T; t++) for (let i = 0; i < n; i++) X[t * n + i] = prep.R[t * n + i] - mean[i];
      B = new Float64Array(T * n);
      const win = new Float64Array(n);                  // running sum of the current 21-day window
      for (let t = 0; t < MONTH_DAYS; t++) for (let i = 0; i < n; i++) win[i] += X[(t % T) * n + i];
      for (let s = 0; s < T; s++) {
        for (let i = 0; i < n; i++) B[s * n + i] = win[i];
        const out = s % T, inn = (s + MONTH_DAYS) % T;   // slide one day: drop the oldest, add the next
        for (let i = 0; i < n; i++) win[i] += X[inn * n + i] - X[out * n + i];
      }
      // Taking the sample mean out of the days also takes a little out of every
      // month-long window: for a window of k days in a sample of T their variance
      // comes out low by exactly (1 - k/T), about 8% on a year of data. Put it back.
      const fix = 1 / Math.sqrt(1 - MONTH_DAYS / T);
      for (let k = 0; k < B.length; k++) B[k] *= fix;
      for (let i = 0; i < n; i++) {
        let m = 0;
        for (let s = 0; s < T; s++) m += Math.exp(B[s * n + i]);
        lnM[i] = Math.log(m / T);
      }
    } else {
      L = choleskyRobust(covM, n);
      if (!L) throw new Error('covariance matrix is not usable');
      for (let i = 0; i < n; i++) lnM[i] = covM[i * n + i] / 2;
    }

    // Our view: extra log drift toward fair value, spread over tiltYears.
    const tiltMonths = Math.round(o.tiltYears * 12);
    const tiltStep = new Float64Array(n);               // extra log return per month while the tilt runs
    const tilted = [];
    prep.active.forEach((k, a) => {
      const h = holdings[k];
      if (!(h.fv > 0) || !(h.price > 0)) return;     // no usable fair value: left alone
      const cap = o.tiltCap * o.tiltYears;
      const gap = Math.max(-cap, Math.min(cap, o.tiltShare * Math.log(h.fv / h.price)));
      tiltStep[a] = gap / tiltMonths;
      tilted.push(h.t);
    });

    const muN = new Float64Array(n), muV = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      muN[i] = lnBase / 12 - lnM[i];
      muV[i] = muN[i] + tiltStep[i];
    }

    // ---- the paths
    const rng = mulberry32(o.seed);
    const gauss = normalSource(rng);
    const totN = new Float64Array((months + 1) * paths);   // month-major: one month's paths are contiguous
    const totV = new Float64Array((months + 1) * paths);
    const ddN = new Float64Array(paths), ddV = new Float64Array(paths);
    const lvN = new Float64Array(n), lvV = new Float64Array(n);
    const z = new Float64Array(n), e = new Float64Array(n);
    const V0 = total;
    for (let m = 0; m <= months; m++) { totN.fill(V0, m * paths, m * paths + paths); totV.fill(V0, m * paths, m * paths + paths); }

    for (let p = 0; p < paths; p++) {
      lvN.fill(0); lvV.fill(0);
      let peakN = V0, peakV = V0, worstN = 0, worstV = 0;
      for (let m = 1; m <= months; m++) {
        if (L) {
          for (let i = 0; i < n; i++) z[i] = gauss();
          for (let i = 0; i < n; i++) {
            let s = 0;
            const row = i * n;
            for (let j = 0; j <= i; j++) s += L[row + j] * z[j];
            e[i] = s;
          }
        } else {
          const s = Math.floor(rng() * T) * n;
          for (let i = 0; i < n; i++) e[i] = B[s + i];
        }
        const tilt = m <= tiltMonths;
        let tN = flat, tV = flat;
        for (let i = 0; i < n; i++) {
          lvN[i] += e[i] + muN[i];
          lvV[i] += e[i] + (tilt ? muV[i] : muN[i]);
          tN += val[i] * Math.exp(lvN[i]);
          tV += val[i] * Math.exp(lvV[i]);
        }
        totN[m * paths + p] = tN;
        totV[m * paths + p] = tV;
        if (tN > peakN) peakN = tN; else { const d = 1 - tN / peakN; if (d > worstN) worstN = d; }
        if (tV > peakV) peakV = tV; else { const d = 1 - tV / peakV; if (d > worstV) worstV = d; }
      }
      ddN[p] = worstN; ddV[p] = worstV;
    }

    const PCT = [0.05, 0.25, 0.5, 0.75, 0.95];
    const summarize = (tot, dd) => {
      const bands = PCT.map(() => new Float64Array(months + 1));
      const col = new Float64Array(paths);
      let last = null;
      for (let m = 0; m <= months; m++) {
        col.set(tot.subarray(m * paths, (m + 1) * paths));
        col.sort();
        PCT.forEach((q, k) => { bands[k][m] = quantileSorted(col, q); });
        if (m === months) last = col;
      }
      let sum = 0, below = 0, below20 = 0;
      for (let p = 0; p < paths; p++) {
        sum += last[p];
        if (last[p] < V0) below++;
        if (last[p] < 0.8 * V0) below20++;
      }
      const tail = Math.max(1, Math.floor(0.05 * paths));
      let tailSum = 0;
      for (let p = 0; p < tail; p++) tailSum += last[p];
      let dd20 = 0;
      for (let p = 0; p < paths; p++) if (dd[p] >= 0.2) dd20++;
      const ddSorted = Float64Array.from(dd).sort();
      return {
        bands,                                           // 5th, 25th, 50th, 75th, 95th percentile at each month
        median: bands[2][months],
        mean: sum / paths,
        p05: bands[0][months], p25: bands[1][months], p75: bands[3][months], p95: bands[4][months],
        probLoss: below / paths,                         // ends below today's value
        probLoss20: below20 / paths,                     // ends more than 20% below
        avgWorst5: tailSum / tail,                       // average of the worst 1-in-20 outcomes
        probDrop20: dd20 / paths,                        // falls 20% or more from a peak at some month-end
        medianDrawdown: quantileSorted(ddSorted, 0.5),
      };
    };

    return {
      months, paths, method: o.method, start: V0, seed: o.seed,
      baseDrift: o.baseDrift,
      neutral: summarize(totN, ddN),
      view: summarize(totV, ddV),
      risk: { portVol, avgVol, holdings: risk.sort((a, b) => b.share - a.share), delta: sc.delta, rBar: sc.rBar },
      tilted,
      flat, T, from: prep.from, to: prep.to,
      kinds: prep.kinds,
    };
  }

  root.FF_MC = {
    DEFAULTS, TRADING_DAYS, MONTH_DAYS, MIN_RETURNS,
    prepare, run, pathsFor,
    // exposed for the tests
    hashSeed, mulberry32, normalSource, sampleCov, shrunkCov, cholesky, choleskyRobust, quantileSorted,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.FF_MC;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
