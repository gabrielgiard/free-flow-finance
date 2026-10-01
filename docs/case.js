/* FreeFlow Finance — "Your case": the DCF, live, in the visitor's hands.

   Two parts:

   1. FF_ENGINE — a line-for-line port of engine.py. It must produce exactly
      the fair values build.py publishes (pipeline check: case_parity_test.js
      runs it over every company), so when the sliders sit on the model's
      own assumptions the number shown is the site's number, to the cent.

   2. The panel — four sliders over the assumptions that drive value, Bear /
      Model / Bull presets, a sentence explaining what moved the number, the
      growth today's price implies ("market's bet"), and a share link that
      carries the visitor's assumptions in the URL.

   Nothing here touches the official rating. The visitor's case lives only
   in memory and resets when they leave the page. */

const FF_ENGINE = (() => {
  const STAGE1 = 5, STAGE2 = 5, NYEARS = 10;

  function project(rev, growth, m0, m1, tg) {
    const rows = [];
    let r = rev;
    const g5 = growth[growth.length - 1];
    for (let i = 0; i < NYEARS; i++) {
      let g, m;
      if (i < STAGE1) {
        g = growth[i];
        m = m0 + (m1 - m0) * ((i + 1) / STAGE1);
      } else {
        const step = (i - STAGE1 + 1) / STAGE2;
        g = g5 + (tg - g5) * step;
        m = m1;
      }
      r = r * (1 + g);
      rows.push({ year: i + 1, rev: r, growth: g, margin: m, fcf: r * m });
    }
    return rows;
  }

  function dcf(rev, growth, m0, m1, wacc, tg, netdebt, shares) {
    if (wacc <= tg + 0.010) wacc = tg + 0.010;
    const rows = project(rev, growth, m0, m1, tg);
    let pvExplicit = 0;
    for (const row of rows) {
      const df = 1 / Math.pow(1 + wacc, row.year - 0.5);
      pvExplicit += row.fcf * df;
    }
    const fcfN = rows[rows.length - 1].fcf;
    const tv = fcfN * (1 + tg) / (wacc - tg);
    const pvTv = tv / Math.pow(1 + wacc, NYEARS - 0.5);
    const ev = pvExplicit + pvTv;
    const equity = ev - netdebt;
    return {
      ev, equity, pvTv,
      perShare: shares ? equity / shares : 0,
      tvShare: ev ? pvTv / ev : 0,
    };
  }

  // Same scenario rules as engine.scenarios(), including the guarantee
  // that bear never prints above base nor bull below it.
  function scenarios(c) {
    const base = dcf(c.rev, c.growth, c.m0, c.m1, c.wacc, c.tg, c.netdebt, c.shares);
    const bearM1 = Math.min(c.m1, Math.max(c.m1 - 0.020, 0.0));
    const bullWacc = c.wacc - 0.005;
    const bullTg = Math.min(c.tg + 0.0025, bullWacc - 0.005);
    const bull = dcf(c.rev, c.growth.map(g => g + 0.030), c.m0, c.m1 + 0.020,
                     bullWacc, bullTg, c.netdebt, c.shares);
    const bear = dcf(c.rev, c.growth.map(g => g - 0.030), c.m0, bearM1,
                     c.wacc + 0.005, Math.max(c.tg - 0.0050, 0.0), c.netdebt, c.shares);
    const b = base.perShare;
    return {
      base: b,
      bull: Math.max(bull.perShare, b),
      bear: Math.min(bear.perShare, b),
      // the inputs each preset button sets
      bearInputs: { dg: -0.030, m1: bearM1, wacc: c.wacc + 0.005, tg: Math.max(c.tg - 0.005, 0) },
      bullInputs: { dg: 0.030, m1: c.m1 + 0.020, wacc: bullWacc, tg: bullTg },
    };
  }

  function rate(upside) {
    if (upside >= 0.30) return 'Strong Buy';
    if (upside >= 0.12) return 'Buy';
    if (upside >= -0.12) return 'Hold';
    if (upside >= -0.30) return 'Reduce';
    return 'Sell';
  }

  return { project, dcf, scenarios, rate };
})();

/* ------------------------------------------------------------- panel --- */

const CASE_SITE = 'https://free-flow-finance.pages.dev/';
const CASE_STATE = new WeakMap();

function caseAvg(a) { return a.reduce((s, x) => s + x, 0) / a.length; }
function casePts(x, d = 1) { return (x * 100).toFixed(d); }
function caseClamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

/* Slider definitions for one company. Ranges are wide enough to express a
   real disagreement, narrow enough that the far ends are still a business. */
function caseSliders(c) {
  const avgG = caseAvg(c.growth);
  const minG = Math.min(...c.growth);
  const g = {
    k: 'dg', label: 'Revenue growth', note: 'average a year, years 1–5',
    min: Math.max(-0.20, -0.55 - minG), max: 0.20, step: 0.0025, model: 0,
    fmt: v => casePts(avgG + v) + '%', modelFmt: casePts(avgG) + '%',
  };
  const m = {
    k: 'm1', label: c.sec === 'financials' ? 'Cash margin by year 5' : 'Free cash flow margin by year 5',
    note: c.sec === 'financials' ? `today ${casePts(c.m0, 0)}% · net income for banks` : `today ${casePts(c.m0, 0)}%`,
    min: Math.max(-0.30, Math.round((c.m1 - 0.25) * 200) / 200),
    max: Math.min(0.75, Math.round((c.m1 + 0.25) * 200) / 200),
    step: 0.0025, model: c.m1, fmt: v => casePts(v) + '%', modelFmt: casePts(c.m1) + '%',
  };
  const w = {
    k: 'wacc', label: 'Discount rate', note: 'WACC — your required return',
    min: Math.min(0.05, c.wacc - 0.02), max: Math.max(0.16, c.wacc + 0.03),
    step: 0.001, model: c.wacc, fmt: v => casePts(v) + '%', modelFmt: casePts(c.wacc) + '%',
  };
  const t = {
    k: 'tg', label: 'Long-term growth', note: 'forever, after year 10',
    min: 0, max: Math.max(0.05, c.tg + 0.01), step: 0.001, model: c.tg,
    fmt: v => casePts(v) + '%', modelFmt: casePts(c.tg) + '%',
  };
  return [g, m, w, t];
}

function caseHTML(c) {
  if (!(c.shares > 0) || !Array.isArray(c.growth) || !c.growth.length) return '';
  const id = 'cs-' + c.t.replace(/[^a-z0-9]/gi, '');
  const rows = caseSliders(c).map(s => `
    <div class="cs-row" data-k="${s.k}">
      <div class="cs-top">
        <label for="${id}-${s.k}">${s.label} <small>${s.note}</small></label>
        <output class="cs-val" for="${id}-${s.k}">${s.modelFmt}</output>
      </div>
      <div class="cs-track">
        <input type="range" id="${id}-${s.k}" data-k="${s.k}"
               min="${s.min}" max="${s.max}" step="${s.step}" value="${s.model}">
        <span class="cs-tick cs-tick-model" aria-hidden="true"></span>
        ${s.k === 'dg' ? '<span class="cs-tick cs-tick-market" aria-hidden="true" hidden></span>' : ''}
      </div>
      <div class="cs-foot">
        <span><i class="cs-key-model"></i>model ${s.modelFmt}</span>
        ${s.k === 'dg' ? '<span class="cs-market-label" hidden><i class="cs-key-market"></i><span></span></span>' : ''}
      </div>
    </div>`).join('');

  return `
  <section class="case" data-key="${escapeHtml(c.t)}" aria-labelledby="${id}-title">
    <div class="case-head">
      <div>
        <h3 class="case-title" id="${id}-title">Your case</h3>
        <p class="case-sub">Disagree with the model? Move its assumptions and watch the fair value and the chart above change.</p>
      </div>
      <div class="case-presets" role="group" aria-label="Preset scenarios">
        <button type="button" data-preset="bear">Bear</button>
        <button type="button" data-preset="model" class="on" aria-pressed="true">Model</button>
        <button type="button" data-preset="bull">Bull</button>
      </div>
    </div>
    <div class="case-shared" hidden></div>
    <div class="case-body">
      <div class="case-sliders">${rows}
        <p class="case-hint" hidden></p>
        <div class="case-mini" aria-hidden="true">
          <span>Your fair value</span><b class="case-mini-fv"></b><span class="case-mini-up"></span>
        </div>
      </div>
      <div class="case-result" aria-live="polite">
        <div class="case-fv-label">Your fair value</div>
        <div class="case-fv">${fvStr(c.fv)}</div>
        <div class="case-verdict">
          <span class="rating-pill ${ratingClass(c.rating)} case-rating">${c.rating}</span>
          <span class="case-up ${upClass(c.upside)}">${FMT.pct(c.upside)}</span>
          <span class="case-vsprice">vs ${FMT.usd(c.price)}</span>
        </div>
        <div class="case-model">Model's fair value <b>${fvStr(c.fv)}</b> · official rating <b>${c.rating}</b></div>
        <p class="case-why"></p>
        <p class="case-market"></p>
        <p class="case-warn" hidden></p>
        <div class="case-actions">
          <button type="button" class="btn btn-violet case-share">Share my case</button>
          <button type="button" class="btn btn-ghost case-reset" hidden>Reset to model</button>
        </div>
        <div class="case-copy" hidden>
          <textarea readonly rows="4" aria-label="Your case, ready to copy"></textarea>
          <p>Copy this and paste it anywhere.</p>
        </div>
      </div>
    </div>
  </section>`;
}

/* Inputs for the engine from the slider state. */
function caseInputs(c, s) {
  return {
    growth: c.growth.map(g => g + s.dg), m1: s.m1, wacc: s.wacc, tg: s.tg,
  };
}
function caseValue(c, s) {
  const i = caseInputs(c, s);
  return FF_ENGINE.dcf(c.rev, i.growth, c.m0, i.m1, i.wacc, i.tg, c.netdebt, c.shares);
}

/* The growth shift at which the model's value equals today's price, with
   the visitor's other assumptions held. Bisection: the value is monotonic
   in growth whenever the margin has one sign, which is every real case. */
function caseImpliedShift(c, s, lo = -0.5, hi = 1.0) {
  const f = dg => caseValue(c, { ...s, dg }).perShare - c.price;
  let flo = f(lo), fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (fm * flo <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

/* Which assumptions moved the value, and by how much. Changes are applied
   one at a time in a fixed order, so the pieces add up exactly to the total. */
function caseAttribution(c, s, model) {
  const order = [
    ['dg', d => `${casePts(Math.abs(d))} pts ${d > 0 ? 'more' : 'less'} revenue growth a year`],
    ['m1', d => `a year-5 margin ${casePts(Math.abs(d))} pts ${d > 0 ? 'higher' : 'lower'}`],
    ['wacc', d => `a discount rate ${casePts(Math.abs(d), 2)} pts ${d > 0 ? 'higher' : 'lower'}`],
    ['tg', d => `long-term growth ${casePts(Math.abs(d), 2)} pts ${d > 0 ? 'higher' : 'lower'}`],
  ];
  let cur = { ...model };
  let prev = caseValue(c, cur).perShare;
  const parts = [];
  for (const [k, phrase] of order) {
    const d = s[k] - model[k];
    if (Math.abs(d) < 1e-9) continue;
    cur = { ...cur, [k]: s[k] };
    const v = caseValue(c, cur).perShare;
    parts.push({ k, text: phrase(d), dv: v - prev });
    prev = v;
  }
  return parts;
}

function caseUpdate(sec) {
  const st = CASE_STATE.get(sec);
  if (!st) return;
  const { c, s, model, sliders } = st;

  // keep the one hard rule: discount rate stays a point above long-term growth
  const hint = sec.querySelector('.case-hint');
  hint.hidden = true;
  if (s.wacc < s.tg + 0.01) {
    if (st.last === 'tg') s.tg = Math.max(0, s.wacc - 0.01);
    else s.wacc = s.tg + 0.01;
    hint.textContent = 'The discount rate has to stay at least 1 point above long-term growth — otherwise the company would be worth infinity.';
    hint.hidden = false;
  }

  // sliders: values, model ticks, the stretch between model and yours
  for (const sl of sliders) {
    const input = sec.querySelector(`input[data-k="${sl.k}"]`);
    const v = s[sl.k];
    if (Math.abs(+input.value - v) > 1e-9) input.value = v;
    const span = sl.max - sl.min;
    const pv = (v - sl.min) / span, pm = (sl.model - sl.min) / span;
    const row = input.closest('.cs-row');
    row.querySelector('.cs-val').textContent = sl.fmt(v);
    input.setAttribute('aria-valuetext', sl.fmt(v));
    row.style.setProperty('--pv', pv);
    row.style.setProperty('--pm', pm);
    row.style.setProperty('--lo', Math.min(pv, pm));
    row.style.setProperty('--hi', Math.max(pv, pm));
    row.classList.toggle('changed', Math.abs(v - sl.model) > 1e-9);
  }

  const val = caseValue(c, s);
  const fv = val.perShare;
  const meaningful = fv > 0 && isFinite(fv);
  const up = meaningful ? fv / c.price - 1 : null;
  const rating = meaningful ? FF_ENGINE.rate(up) : 'N/M';

  sec.querySelector('.case-fv').textContent = meaningful ? FMT.usd(fv) : 'N/M';
  sec.querySelector('.case-mini-fv').textContent = meaningful ? FMT.usd(fv) : 'N/M';
  const miniUp = sec.querySelector('.case-mini-up');
  miniUp.textContent = meaningful ? `${rating} · ${FMT.pct(up)}` : '';
  miniUp.className = 'case-mini-up ' + (meaningful ? upClass(up) : '');
  const pill = sec.querySelector('.case-rating');
  pill.textContent = rating;
  pill.className = 'rating-pill case-rating ' + (meaningful ? ratingClass(rating) : 'r-hold');
  const upEl = sec.querySelector('.case-up');
  upEl.textContent = meaningful ? FMT.pct(up) : '—';
  upEl.className = 'case-up ' + (meaningful ? upClass(up) : '');

  const custom = ['dg', 'm1', 'wacc', 'tg'].some(k => Math.abs(s[k] - model[k]) > 1e-9);
  sec.classList.toggle('is-custom', custom);
  sec.querySelector('.case-reset').hidden = !custom;
  sec.querySelectorAll('.case-presets button').forEach(b => {
    const on = b.dataset.preset === st.preset;
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  });

  // why the number moved
  const why = sec.querySelector('.case-why');
  if (!custom) {
    why.textContent = 'These are the model\'s own assumptions — the same numbers behind the site\'s rating.';
  } else {
    const parts = caseAttribution(c, s, model)
      .filter(p => Math.abs(p.dv) >= Math.max(0.005, Math.abs(fv - c.fv) * 0.08))
      .sort((a, b) => Math.abs(b.dv) - Math.abs(a.dv)).slice(0, 3);
    const total = fv - c.fv;
    why.textContent = parts.length
      ? `Versus the model, you assume ${parts.map(p =>
          `${p.text} (${p.dv >= 0 ? '+' : '−'}${FMT.usd(Math.abs(p.dv), 0)} a share)`).join(', ')
          .replace(/, ([^,]*)$/, ' and $1')}. Net: ${total >= 0 ? '+' : '−'}${FMT.usd(Math.abs(total))}.`
      : 'Your changes barely move the value.';
  }

  // the market's bet
  const shift = caseImpliedShift(c, s);
  const mk = sec.querySelector('.case-market');
  const tick = sec.querySelector('.cs-tick-market');
  const mlabel = sec.querySelector('.cs-market-label');
  const gs = sliders[0];
  const avgG = caseAvg(c.growth);
  if (shift == null) {
    mk.textContent = `No growth rate gets this model to today's ${FMT.usd(c.price)} with your other settings — the price is being justified by something else (margins, a lower discount rate, or optimism).`;
    tick.hidden = true; mlabel.hidden = true;
  } else {
    const implied = avgG + shift;
    mk.innerHTML = `<b>Market's bet:</b> at ${FMT.usd(c.price)}, the price implies about
      <b>${casePts(implied)}% revenue growth a year</b> for five years, with your margin and discount rate.
      ${Math.abs(shift - s.dg) < 0.0025 ? 'Your growth assumption matches it.'
        : `That's ${casePts(Math.abs(implied - (avgG + s.dg)))} pts ${implied > avgG + s.dg ? 'more' : 'less'} than yours.`}`;
    const p = (shift - gs.min) / (gs.max - gs.min);
    const inRange = p >= 0 && p <= 1;
    tick.hidden = !inRange;
    sec.querySelector('.cs-row[data-k="dg"]').style.setProperty('--pk', caseClamp(p, 0, 1));
    mlabel.hidden = false;
    mlabel.querySelector('span').textContent = inRange
      ? `market's bet ${casePts(implied)}%`
      : `market's bet ${casePts(implied)}% (off the scale)`;
  }

  // honesty notes
  const warn = sec.querySelector('.case-warn');
  if (!meaningful) {
    warn.textContent = 'With these assumptions the business is worth less than its debt, so a per-share value isn\'t meaningful.';
    warn.hidden = false;
  } else if (val.tvShare > 1) {
    warn.textContent = 'All of this value comes from after year 10 — the next ten years burn cash. Treat it as a long-range bet rather than a measurement.';
    warn.hidden = false;
  } else if (val.tvShare > 0.85) {
    warn.textContent = `${Math.round(val.tvShare * 100)}% of this value comes from after year 10. Treat it as a long-range bet rather than a measurement.`;
    warn.hidden = false;
  } else {
    warn.hidden = true;
  }

  // the chart above follows along
  // Only the chart in this tab follows the sliders; the Overview chart keeps
  // showing the model's own fair value.
  const scope = sec.closest('.co-panel') || document;
  const fig = scope.querySelector(`.pchart[data-key="${CSS.escape(c.t)}"]`);
  if (fig && typeof pcSetFV === 'function') pcSetFV(fig, meaningful ? fv : 0, c.fv, custom);

  st.result = { fv, up, rating, meaningful };
}

/* ------------------------------------------------------- share links --- */

function caseEncode(s) {
  return ['g' + (s.dg * 100).toFixed(2), 'm' + (s.m1 * 100).toFixed(2),
          'w' + (s.wacc * 100).toFixed(2), 't' + (s.tg * 100).toFixed(2)].join(',');
}
function caseDecode(str) {
  if (typeof str !== 'string') return null;
  const out = {};
  const map = { g: 'dg', m: 'm1', w: 'wacc', t: 'tg' };
  for (const part of str.split(',')) {
    const k = map[part[0]], v = parseFloat(part.slice(1));
    if (!k || !isFinite(v)) return null;
    out[k] = v / 100;
  }
  return Object.keys(out).length === 4 ? out : null;
}
function caseQuery() {
  const q = location.hash.split('?')[1] || '';
  const m = q.match(/(?:^|&)case=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function caseShareText(st) {
  const { c, s, result } = st;
  const link = `${CASE_SITE}#/company/${encodeURIComponent(c.t)}?case=${caseEncode(s)}`;
  const g = casePts(caseAvg(c.growth) + s.dg, 0);
  const fvTxt = result.meaningful ? FMT.usd(result.fv) : 'N/M';
  const upTxt = result.meaningful ? ` (${FMT.pct(result.up, 0)} vs ${FMT.usd(c.price)})` : '';
  return {
    link,
    text: `My ${c.t} case: ${g}% growth, ${casePts(s.m1, 0)}% margin, ${casePts(s.wacc)}% WACC → ${fvTxt} fair value${upTxt}. ` +
          `FreeFlow Finance's model says ${fvStr(c.fv)}. Who's right?\n${link}`,
  };
}

async function caseCopy(sec, text) {
  const box = sec.querySelector('.case-copy');
  const btn = sec.querySelector('.case-share');
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied — paste it anywhere';
    setTimeout(() => { btn.textContent = 'Share my case'; }, 2200);
    box.hidden = true;
  } catch (e) {
    // Clipboard blocked (some in-app browsers): show the text to copy by hand.
    box.hidden = false;
    const ta = box.querySelector('textarea');
    ta.value = text;
    ta.focus(); ta.select();
  }
}

/* --------------------------------------------------------------- mount --- */

function mountCasePanels(root) {
  (root || document).querySelectorAll('.case').forEach(sec => {
    if (CASE_STATE.has(sec)) return;
    const c = FF_DATA.companies.find(x => x.t === sec.dataset.key);
    if (!c) return;
    const sliders = caseSliders(c);
    const model = { dg: 0, m1: c.m1, wacc: c.wacc, tg: c.tg };
    const sc = FF_ENGINE.scenarios(c);
    const st = { c, sliders, model, s: { ...model }, preset: 'model', last: null, sc };
    CASE_STATE.set(sec, st);

    // a shared link opens with the sender's assumptions
    const shared = caseDecode(caseQuery());
    if (shared) {
      for (const sl of sliders) shared[sl.k] = caseClamp(shared[sl.k], sl.min, sl.max);
      st.s = shared;
      st.preset = null;
      const banner = sec.querySelector('.case-shared');
      const v = caseValue(c, shared).perShare;
      banner.innerHTML = `You're looking at a shared case: fair value <b>${v > 0 ? FMT.usd(v) : 'N/M'}</b>
        against the model's <b>${fvStr(c.fv)}</b>. <button type="button" class="case-linkbtn" data-preset="model">Reset to the model</button>`;
      banner.hidden = false;
      requestAnimationFrame(() => sec.scrollIntoView({ block: 'center' }));
    }

    let raf = 0;
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => caseUpdate(sec)); };

    sec.addEventListener('input', e => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      st.s[k] = parseFloat(e.target.value);
      st.last = k;
      st.preset = null;
      schedule();
    });

    sec.addEventListener('click', e => {
      const b = e.target.closest('[data-preset], .case-reset, .case-share');
      if (!b) return;
      if (b.classList.contains('case-share')) {
        caseUpdate(sec);
        caseCopy(sec, caseShareText(st).text);
        return;
      }
      const p = b.classList.contains('case-reset') ? 'model' : b.dataset.preset;
      st.s = p === 'bear' ? { ...sc.bearInputs } : p === 'bull' ? { ...sc.bullInputs } : { ...model };
      for (const sl of sliders) st.s[sl.k] = caseClamp(st.s[sl.k], sl.min, sl.max);
      st.preset = p;
      st.last = null;
      if (p === 'model') sec.querySelector('.case-shared').hidden = true;
      caseUpdate(sec);
    });

    caseUpdate(sec);
  });
}
