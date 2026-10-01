/* FreeFlow Finance — chart helpers. Hand-built SVG, no chart library:
   keeps the palette exact and the file dependency-free for offline use. */

const FMT = {
  usd(v, d = 2) {
    if (v == null || isNaN(v)) return '—';
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    return (v < 0 ? '-$' : '$') + s;
  },
  usdB(v) { // v already in $B
    if (v == null || isNaN(v)) return '—';
    const a = Math.abs(v);
    if (a >= 1000) return (v < 0 ? '-$' : '$') + (a / 1000).toFixed(2) + 'T';
    return (v < 0 ? '-$' : '$') + a.toFixed(a >= 100 ? 0 : 1) + 'B';
  },
  pct(v, d = 1) {
    if (v == null || isNaN(v)) return '—';
    return (v > 0 ? '+' : '') + (v * 100).toFixed(d) + '%';
  },
  pctPlain(v, d = 1) { if (v == null || isNaN(v)) return '—'; return (v * 100).toFixed(d) + '%'; },
  x(v, d = 1) { if (v == null || isNaN(v)) return '—'; return v.toFixed(d) + 'x'; },
  num(v, d = 1) { if (v == null || isNaN(v)) return '—'; return v.toLocaleString('en-US', { maximumFractionDigits: d }); }
};

/* Escapes text before it goes into innerHTML. Only needed for the one place
   this site echoes back something the visitor typed rather than content we
   wrote ourselves — the search box's "no matches" message. */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function ratingClass(r) {
  return { 'Strong Buy': 'r-strongbuy', 'Buy': 'r-buy', 'Hold': 'r-hold', 'Reduce': 'r-reduce', 'Sell': 'r-sell' }[r] || 'r-hold';
}
function ratingColor(r) {
  return { 'Strong Buy': 'var(--green)', 'Buy': 'var(--green)', 'Hold': 'var(--amber)', 'Reduce': 'var(--red)', 'Sell': 'var(--red)' }[r] || 'var(--amber)';
}
function upClass(v) { return v >= 0 ? 'upside-pos' : 'upside-neg'; }
/* Headline dollar figures use this instead of raw FMT.usd: when the modeled
   equity value is at or below zero (net debt exceeds the operating business —
   see MSTR), a negative "target price" is real DCF output but reads as broken
   in a bold headline, so we show the standard sell-side "N/M" (not meaningful)
   and let the DCF tab's build-up explain the actual negative number in context. */
function fvStr(v) { return (v != null && v > 0) ? FMT.usd(v) : 'N/M'; }

const SEG_COLORS = ['#6d3fc0', '#b9a3f5', '#c9a227', '#4fb787', '#8a63d6', '#e4c97a', '#52349a', '#dd6b7f'];

/* Revenue-mix composition bar + legend --------------------------------- */
function segBarHTML(segs) {
  const total = segs.reduce((a, s) => a + s[1], 0) || 1;
  const bars = segs.map((s, i) => {
    const w = (s[1] / total * 100).toFixed(1);
    return `<div style="width:${w}%;background:${SEG_COLORS[i % SEG_COLORS.length]}">${w > 7 ? s[1] + '%' : ''}</div>`;
  }).join('');
  const legend = segs.map((s, i) =>
    `<div class="li"><span class="sw" style="background:${SEG_COLORS[i % SEG_COLORS.length]}"></span>${s[0]} — ${s[1]}%</div>`
  ).join('');
  return `<div class="seg-bar">${bars}</div><div class="seg-legend">${legend}</div>`;
}

/* Four-axis score chart (Business Quality / Growth / Balance Sheet / Moat) */
function scoreRowsHTML(scores) {
  const labels = ['Business Quality', 'Growth Outlook', 'Balance Sheet', 'Moat & Durability'];
  return scores.map((s, i) => `
    <div class="score-row">
      <span class="label">${labels[i]}</span>
      <div class="track"><div class="fill" style="width:${s / 5 * 100}%"></div></div>
      <span class="n">${s}/5</span>
    </div>`).join('');
}

/* Bear / Base / Bull target-price range bar ----------------------------- */
function rangeBarHTML(bear, base, bull, price) {
  /* Scenario range as SVG rather than absolutely-positioned labels.

     The previous version placed four labels at percentage offsets, which
     collided badly whenever two values landed close together — with bull at
     $196.00 and the price at $194.83 the text overlapped into nonsense. It
     also repeated the numbers shown in the table directly beneath it.

     This draws the span from bear to bull, marks the base case, and shows
     where the market currently sits. The figures live in the table below,
     so the chart only has to answer one question: is the price inside the
     range, or outside it? */
  const w = 300, h = 92;
  const padX = 34, axisY = 48;
  const lo = Math.min(bear, price), hi = Math.max(bull, price);
  const span = (hi - lo) || 1;
  const pad = span * 0.12;
  const min = lo - pad, max = hi + pad;
  const X = v => padX + ((v - min) / (max - min)) * (w - padX * 2);

  // Hide an end label when the price marker would sit on top of it. The
  // table beneath repeats every figure, so losing a tick label costs nothing
  // while two labels printed over each other costs legibility.
  const CLEAR = 34;
  const showBear = Math.abs(X(price) - X(bear)) > CLEAR;
  const showBull = Math.abs(X(price) - X(bull)) > CLEAR;

  const inside = price >= bear && price <= bull;
  const verdict = inside
    ? 'The market price sits inside the range this model produces.'
    : price > bull
      ? 'The market price sits above even the bull case.'
      : 'The market price sits below even the bear case.';

  return `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block"
         role="img" aria-label="Scenario range from ${fvStr(bear)} to ${fvStr(bull)}, base case ${fvStr(base)}, current price ${FMT.usd(price, 0)}. ${verdict}">
      <defs>
        <linearGradient id="rng" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#6d3fc0" stop-opacity=".22"/>
          <stop offset="50%" stop-color="#b9a3f5" stop-opacity=".40"/>
          <stop offset="100%" stop-color="#6d3fc0" stop-opacity=".22"/>
        </linearGradient>
      </defs>

      <rect x="${X(bear)}" y="${axisY - 9}" width="${Math.max(2, X(bull) - X(bear))}"
            height="18" rx="9" fill="url(#rng)"/>
      <line x1="${X(bear)}" y1="${axisY - 13}" x2="${X(bear)}" y2="${axisY + 13}"
            stroke="#9483c4" stroke-width="1.5"/>
      <line x1="${X(bull)}" y1="${axisY - 13}" x2="${X(bull)}" y2="${axisY + 13}"
            stroke="#9483c4" stroke-width="1.5"/>

      ${showBear ? `<text x="${Math.max(16, X(bear))}" y="${axisY + 30}" fill="#736c8c"
            font-size="12" font-family="var(--font-mono)" text-anchor="middle">bear</text>` : ''}
      ${showBull ? `<text x="${Math.min(w - 16, X(bull))}" y="${axisY + 30}" fill="#736c8c"
            font-size="12" font-family="var(--font-mono)" text-anchor="middle">bull</text>` : ''}

      <circle cx="${X(base)}" cy="${axisY}" r="6" fill="#c9a227"/>
      <text x="${Math.min(w - 30, Math.max(30, X(base)))}" y="${axisY - 20}" fill="#e4c97a" font-size="12"
            font-family="var(--font-mono)" text-anchor="middle">fair value</text>

      <line x1="${X(price)}" y1="${axisY - 22}" x2="${X(price)}" y2="${axisY + 16}"
            stroke="#f1eef8" stroke-width="2" stroke-dasharray="3 3"/>
      <text x="${Math.min(w - 22, Math.max(22, X(price)))}" y="${axisY + 30}" fill="#f1eef8" font-size="12.5" font-weight="600"
            font-family="var(--font-mono)" text-anchor="middle">${FMT.usd(price, 0)}</text>
    </svg>
    <p style="font-size:11.5px;color:var(--text-dim);margin:10px 0 16px;">${verdict}</p>`;
}

/* Revenue + FCF sparkline (10-yr model) --------------------------------- */
function sparklineSVG(model, key, color, h = 60, w = 400) {
  const vals = model.map(m => m[key]);
  const lo = Math.min(...vals, 0), hi = Math.max(...vals);
  const span = (hi - lo) || 1;
  const stepX = w / (vals.length - 1);
  const pts = vals.map((v, i) => [i * stepX, h - ((v - lo) / span) * (h - 8) - 4]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dividerX = 4.5 * stepX;
  const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 4 || i === 9 ? 3 : 0}" fill="${color}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <line x1="${dividerX}" y1="0" x2="${dividerX}" y2="${h}" stroke="var(--line)" stroke-dasharray="3,3"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    ${dots}
  </svg>`;
}

/* WACC x terminal-growth sensitivity heatmap ---------------------------- */
function sensitivityGridHTML(grid, price) {
  const flat = grid.values.flat();
  const lo = Math.min(...flat), hi = Math.max(...flat);
  function shade(v) {
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    // interpolate red(221,107,127) -> ink surface -> green(79,183,135), centered near current price
    const mid = hi === lo ? 0.5 : (price - lo) / (hi - lo);
    if (t < mid) {
      const k = mid === 0 ? 0 : t / mid;
      return mixColor([221, 107, 127], [36, 32, 51], k);
    } else {
      const k = mid === 1 ? 1 : (t - mid) / (1 - mid);
      return mixColor([36, 32, 51], [79, 183, 135], k);
    }
  }
  function mixColor(a, b, k) {
    const r = Math.round(a[0] + (b[0] - a[0]) * k);
    const g = Math.round(a[1] + (b[1] - a[1]) * k);
    const bl = Math.round(a[2] + (b[2] - a[2]) * k);
    return `rgba(${r},${g},${bl},.55)`;
  }
  let head = `<tr><th class="corner">WACC ↓ / g →</th>` + grid.tgs.map(t => `<th>${t.toFixed(2)}%</th>`).join('') + `</tr>`;
  let rows = grid.values.map((row, i) => {
    const cells = row.map(v => `<td style="background:${shade(v)}">${FMT.usd(v, 0)}</td>`).join('');
    return `<tr><td class="axis">${grid.waccs[i].toFixed(2)}%</td>${cells}</tr>`;
  }).join('');
  return `<table class="grid-table">${head}${rows}</table>`;
}

/* DCF build-up waterfall (PV explicit + PV terminal = EV, - debt = equity) */
function dcfWaterfallHTML(dcf, shares) {
  const items = [
    { label: 'PV of Stage 1–2 Free Cash Flow (Yrs 1–10)', val: dcf.pv_explicit, color: 'var(--violet-500)' },
    { label: 'PV of Terminal Value', val: dcf.pv_tv, color: 'var(--lilac)' },
  ];
  const max = dcf.ev;
  const bars = items.map(it => {
    const w = (it.val / max * 100).toFixed(1);
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:5px">
        <span>${it.label}</span><span class="mono">${FMT.usdB(it.val)}</span>
      </div>
      <div style="height:10px;background:var(--surface-3);border-radius:5px;overflow:hidden">
        <div style="width:${w}%;height:100%;background:${it.color}"></div>
      </div>
    </div>`;
  }).join('');
  return `
    ${bars}
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line);margin-top:8px;font-size:13px">
      <span style="color:var(--text)">Enterprise Value</span><span class="mono" style="color:var(--text)">${FMT.usdB(dcf.ev)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px">
      <span style="color:var(--text-muted)">${dcf.netdebt >= 0 ? 'Less: Net Debt' : 'Plus: Net Cash'}</span>
      <span class="mono" style="color:var(--text-muted)">${dcf.netdebt >= 0 ? '-' : '+'}${FMT.usdB(Math.abs(dcf.netdebt))}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line);font-size:13px">
      <span style="color:var(--text)">Equity Value</span><span class="mono" style="color:var(--text)">${FMT.usdB(dcf.equity)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:12px;color:var(--text-dim)">
      <span>÷ Diluted Shares Outstanding</span><span class="mono">${FMT.num(shares, 2)}B</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:14px 0 0;margin-top:6px;border-top:2px solid var(--gold);font-size:15px">
      <span style="color:var(--gold-soft)">Fair Value per Share</span>
      <span class="mono" style="color:var(--gold-soft);font-weight:600">${fvStr(dcf.equity / shares)}</span>
    </div>
    ${dcf.equity <= 0
      ? `<p style="font-size:11.5px;color:var(--red);margin-top:14px">Equity value comes out negative: the enterprise value here (${FMT.usdB(dcf.ev)}) is smaller than net debt (${FMT.usdB(Math.abs(dcf.netdebt))}). That's a real DCF result, not an error — it means the modeled operating business alone doesn't cover what's owed, so a per-share "fair value" isn't a meaningful number to quote. We show it as N/M rather than a negative price target.</p>`
      : `<p style="font-size:11px;color:var(--text-dim);margin-top:14px">${
          (dcf.tv_share > 1 || dcf.tv_share < 0)
            ? `Because near-term free cash flow is negative here, the terminal value alone is larger than the whole enterprise value — a sign this business is being valued almost entirely on a distant, uncertain future. Treat this fair value as a rough, low-confidence estimate.`
            : `Terminal value represents ${(dcf.tv_share*100).toFixed(0)}% of enterprise value — typical for a growth or quality compounder; read alongside the sensitivity grid rather than as a standalone number.`
        }</p>`}
  `;
}

/* Hero "flow" signature — layered animated cash-flow ribbons ------------ */
function heroFlowSVG() {
  const paths = [
    { d: "M-50,180 C150,120 300,240 500,150 C700,60 850,200 1050,120 C1150,80 1250,140 1350,110", c: 'var(--violet-500)', w: 2, o: .55, dur: '26s' },
    { d: "M-50,240 C180,300 320,160 520,230 C720,300 880,140 1080,220 C1200,265 1260,200 1350,230", c: 'var(--lilac)', w: 1.6, o: .4, dur: '32s' },
    { d: "M-50,120 C160,60 340,150 540,80 C740,10 900,110 1080,50 C1180,20 1260,60 1350,30", c: 'var(--gold)', w: 1.4, o: .3, dur: '38s' },
  ];
  const strokes = paths.map((p, i) => `
    <path d="${p.d}" fill="none" stroke="${p.c}" stroke-width="${p.w}" opacity="${p.o}"
      stroke-dasharray="6 10" vector-effect="non-scaling-stroke">
      <animate attributeName="stroke-dashoffset" from="0" to="-320" dur="${p.dur}" repeatCount="indefinite"/>
    </path>`).join('');
  return `<svg class="hero-flow" viewBox="0 0 1300 420" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="fadeMask" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="white" stop-opacity="0"/>
        <stop offset="18%" stop-color="white" stop-opacity="1"/>
        <stop offset="82%" stop-color="white" stop-opacity="1"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <mask id="fadeMaskH"><rect x="0" y="0" width="1300" height="420" fill="url(#fadeMask)"/></mask>
    </defs>
    <g mask="url(#fadeMaskH)">${strokes}</g>
  </svg>`;
}

/* ======================= PRICE HISTORY CHARTS =========================
   The signature chart on this site is a price history with the DCF fair
   value drawn across it. Everything else on a company page argues about
   what a share is worth; this shows that argument against what the market
   actually paid, over a year. Price line in lilac, fair value in gold —
   the same convention the rest of the site uses for "the number that
   matters most".
   ====================================================================== */

function hasHistory(key) {
  return typeof FF_HISTORY !== 'undefined'
    && FF_HISTORY[key]
    && Array.isArray(FF_HISTORY[key].c)
    && FF_HISTORY[key].c.length >= 1;
}

function historyEmptyState(key) {
  // Show how far along we actually are. "Still gathering data" reads like a
  // fault; "1 of 3 days recorded" reads like a system that's working.
  const days = (typeof FF_HISTORY !== 'undefined' && FF_HISTORY[key]
                && Array.isArray(FF_HISTORY[key].c)) ? FF_HISTORY[key].c.length : 0;
  const detail = `No closing prices recorded yet. The first one arrives the next
       time your daily update runs, and the chart appears with it.`;
  return `<div style="border:1px dashed var(--line);border-radius:var(--radius);
      padding:26px 24px;text-align:center;color:var(--text-dim);font-size:12.5px;line-height:1.7">
      <div style="color:var(--text-muted);margin-bottom:6px">Price chart is building up.</div>
      ${detail}<br>
      Nothing to do — it fills in on its own. Every valuation on this page already works.
    </div>`;
}

/* Shown once a chart has real points but not yet a meaningful span. */
function historyThinNote(n) {
  return `<p style="font-size:11px;color:var(--text-dim);margin-top:8px">
    ${n === 1 ? 'One daily close recorded' : n + ' daily closes recorded'} so far —
    the chart fills out as the daily update keeps running.</p>`;
}

/* Main company chart ---------------------------------------------------
   A year of daily closes, today's fair value as a gold reference line, and
   one deliberate flourish: a bracket at the right edge joining the latest
   price to the fair value, green for upside and red for downside. The gap
   between what the market pays and what the model says is the whole point
   of this site, so the chart draws it rather than leaving it to arithmetic.

   The gap is NOT shaded across the past year. Only today's fair value
   exists; shading March against it would invent a history the model never
   produced.

   Built in two steps. priceChartSVG() returns the frame as HTML (the router
   renders pages as strings). mountPriceCharts() then draws the SVG at the
   element's real pixel width -- the old chart stretched one fixed-size
   drawing to fit, which squashed or smeared its text on every screen that
   wasn't exactly 720px wide -- and wires up scrubbing, ranges and keys. */

const PC_RANGES = [['1M', 1], ['3M', 3], ['6M', 6], ['YTD', 'ytd'], ['1Y', 12]];
const PC_LINE = '#b9a3f5', PC_FV = '#c9a227', PC_UP = '#4fb787', PC_DOWN = '#dd6b7f';

function pcParseISO(s) {
  if (typeof s !== 'string' || s.length < 10) return null;
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}
function pcFmtDate(d, withYear = true) {
  return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}) });
}

/* {dates, closes} for a ticker, oldest first. Files written before per-point
   dates existed get their dates rebuilt from the last date, one weekday at a
   time -- off by a day or two around holidays, never more. */
function pcSeries(key) {
  if (!hasHistory(key)) return null;
  const s = FF_HISTORY[key];
  const n = s.c.length;
  let dates = null;
  const start = pcParseISO(s.from);
  if (start && Array.isArray(s.d) && s.d.length === n) {
    dates = s.d.map(o => new Date(start.getTime() + o * 86400000));
  } else {
    let d = pcParseISO(s.to) || new Date();
    dates = [];
    for (let i = 0; i < n; i++) {
      dates.push(d);
      do { d = new Date(d.getTime() - 86400000); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
    }
    dates.reverse();
  }
  const out = { dates: [], closes: [] };
  for (let i = 0; i < n; i++) {
    const v = s.c[i];
    if (typeof v === 'number' && isFinite(v) && v > 0 && dates[i] && !isNaN(dates[i])) {
      out.dates.push(dates[i]); out.closes.push(v);
    }
  }
  return out.closes.length ? out : null;
}

function pcSlice(series, range) {
  const { dates, closes } = series;
  const last = dates[dates.length - 1];
  let from;
  if (range === 'ytd') from = new Date(Date.UTC(last.getUTCFullYear(), 0, 1));
  else { from = new Date(last); from.setUTCMonth(from.getUTCMonth() - range); }
  let i = dates.findIndex(d => d >= from);
  if (i < 0) i = 0;
  if (dates.length - i < 2) i = Math.max(0, dates.length - 2);
  return { dates: dates.slice(i), closes: closes.slice(i) };
}

function pcNiceTicks(lo, hi, count) {
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= raw) || 10 * mag;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

function pcMoney(v) { return FMT.usd(v, v >= 10000 ? 0 : 2); }
function pcTick(v) {
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: Number.isInteger(v) ? 0 : 2 });
}

function priceChartSVG(key, fv, price) {
  const series = pcSeries(key);
  if (!series) return historyEmptyState(key);
  const last = series.closes[series.closes.length - 1];
  const lastDate = series.dates[series.dates.length - 1];
  const ranges = PC_RANGES.map(([label, r]) =>
    `<button type="button" class="pc-range${label === '1Y' ? ' on' : ''}" data-r="${r}"
       aria-pressed="${label === '1Y'}">${label}</button>`).join('');
  return `
  <figure class="pchart" data-key="${escapeHtml(key)}" data-fv="${fv > 0 ? fv : ''}">
    <div class="pc-head">
      <div class="pc-readout" aria-live="polite">
        <div class="pc-price">${pcMoney(last)}</div>
        <div class="pc-meta"><span class="pc-chg"></span><span class="pc-when"></span></div>
      </div>
      <div class="pc-ranges" role="group" aria-label="Chart time range">${ranges}</div>
    </div>
    <div class="pc-plot" tabindex="0" role="img"
         aria-label="Share price chart for ${escapeHtml(key)}. Latest close ${FMT.usd(last)} on ${pcFmtDate(lastDate)}${fv > 0 ? `, against a fair value of ${FMT.usd(fv)}` : ''}. Use the left and right arrow keys to step through daily closes."></div>
    <figcaption class="pc-key">
      <span><i class="k-line"></i>Daily close</span>
      ${fv > 0 ? `<span><i class="k-fv"></i>Today's fair value</span>` : ''}
      <span class="pc-note"></span>
    </figcaption>
    ${series.closes.length < 8 ? historyThinNote(series.closes.length) : ''}
  </figure>`;
}

/* Draw (or redraw) one chart at its current width. */
function pcRender(fig) {
  const plot = fig.querySelector('.pc-plot');
  const W = Math.round(plot.clientWidth);
  if (W < 40) return;                                   // hidden tab: wait for resize
  const st = fig._pc;
  const { dates, closes } = pcSlice(st.series, st.range);
  const n = closes.length;
  const H = W < 560 ? 230 : 290;
  const fv = st.fv;

  const pLo = Math.min(...closes), pHi = Math.max(...closes);
  // Only plot the fair value when it is close enough to read; a target five
  // times the price would crush the price line flat.
  const showFV = fv > 0 && fv > pLo * 0.45 && fv < pHi * 2.2;
  let lo = showFV ? Math.min(pLo, fv) : pLo, hi = showFV ? Math.max(pHi, fv) : pHi;
  const pad = (hi - lo) * 0.1 || hi * 0.05 || 1;
  lo -= pad; hi += pad;

  const padT = 26, padB = 28, padR = showFV ? 84 : 14;
  const padL = Math.max(40, 12 + 7 * Math.max(...pcNiceTicks(lo, hi, 4).map(t => pcTick(t).length)));
  const plotR = W - padR;
  const X = i => n === 1 ? plotR : padL + (i / (n - 1)) * (plotR - padL);
  const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  st.geo = { n, X, Y, padL, plotR, padT, H, padB, dates, closes, showFV };

  // gridlines + axis labels (left, sitting just above each line)
  const ticks = pcNiceTicks(lo, hi, W < 560 ? 3 : 4);
  const grid = ticks.filter(t => Y(t) > padT - 4 && Y(t) < H - padB).map(t => `
    <line x1="${padL}" x2="${plotR}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="pc-grid"/>
    <text x="${padL - 10}" y="${(Y(t) + 3.5).toFixed(1)}" class="pc-axis" text-anchor="end">${pcTick(t)}</text>`).join('');

  // Month (or, on 1M, week) labels. Thinned at a uniform step -- every
  // month, or every 2nd/3rd on a phone -- so the gaps are always even. Skipping
  // whichever label happened to fall too close made short months vanish.
  const weekly = st.range === 1;
  const bounds = [];
  for (let i = 1; i < n; i++) {
    const d = dates[i], prev = dates[i - 1];
    if (weekly ? d.getUTCDay() < prev.getUTCDay() : d.getUTCMonth() !== prev.getUTCMonth())
      bounds.push(i);
  }
  const avg = bounds.length > 1 ? (X(bounds[bounds.length - 1]) - X(bounds[0])) / (bounds.length - 1) : 1e9;
  const step = Math.max(1, Math.ceil((weekly ? 58 : 44) / avg));
  const xl = bounds.filter((i, k) => {
    const d = dates[i];
    const slot = weekly ? k : d.getUTCFullYear() * 12 + d.getUTCMonth();
    return slot % step === 0 && X(i) > padL + 16 && X(i) < plotR - 16;
  }).map(i => {
    const d = dates[i];
    const label = weekly ? pcFmtDate(d, false)
      : d.getUTCMonth() === 0 ? String(d.getUTCFullYear())
      : d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
    return `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="pc-axis" text-anchor="middle">${label}</text>`;
  });

  const line = closes.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
  const area = n > 1 ? `${line}L${X(n - 1).toFixed(1)},${H - padB}L${X(0).toFixed(1)},${H - padB}Z` : '';
  const lastV = closes[n - 1], lx = X(n - 1), ly = Y(lastV);
  const uid = 'pc' + st.uid;

  let fvLayer = '';
  if (showFV) {
    const fy = Y(fv);
    const up = fv >= lastV;
    const gap = fv / lastV - 1;
    const bx = plotR + 18;
    const midY = (fy + ly) / 2;
    const labelAbove = fy > padT + 22;
    fvLayer = `
      <line x1="${padL}" x2="${plotR}" y1="${fy.toFixed(1)}" y2="${fy.toFixed(1)}" class="pc-fvline"/>
      <text x="${(plotR - 6).toFixed(1)}" y="${(labelAbove ? fy - 8 : fy + 16).toFixed(1)}"
            class="pc-fvlabel" text-anchor="end">Fair value ${FMT.usd(fv)}</text>
      <g class="pc-gap">
        <line x1="${lx.toFixed(1)}" x2="${bx}" y1="${ly.toFixed(1)}" y2="${ly.toFixed(1)}" class="pc-gap-lead"/>
        <line x1="${plotR}" x2="${bx}" y1="${fy.toFixed(1)}" y2="${fy.toFixed(1)}" class="pc-gap-lead"/>
        <line x1="${bx}" x2="${bx}" y1="${ly.toFixed(1)}" y2="${fy.toFixed(1)}"
              stroke="${up ? PC_UP : PC_DOWN}" stroke-width="2.5" stroke-linecap="round"/>
        <text x="${bx + 9}" y="${(midY - 1).toFixed(1)}" class="pc-gap-pct">${FMT.pct(gap, 0)}</text>
        <text x="${bx + 9}" y="${(midY + 12).toFixed(1)}" class="pc-gap-sub">${up ? 'upside' : 'downside'}</text>
      </g>`;
  }

  const firstDraw = !st.drawn;
  plot.innerHTML = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="pc-svg${firstDraw ? ' pc-intro' : ''}">
    <defs>
      <linearGradient id="${uid}a" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${PC_LINE}" stop-opacity=".20"/>
        <stop offset="100%" stop-color="${PC_LINE}" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="${uid}l"><rect class="pc-clip-l" x="0" y="0" width="${W}" height="${H}"/></clipPath>
      <clipPath id="${uid}r"><rect class="pc-clip-r" x="${W}" y="0" width="0" height="${H}"/></clipPath>
    </defs>
    ${grid}
    ${xl.join('')}
    ${area ? `<path d="${area}" fill="url(#${uid}a)" class="pc-area" clip-path="url(#${uid}l)"/>` : ''}
    ${fvLayer}
    ${n > 1 ? `<path d="${line}" class="pc-line" clip-path="url(#${uid}l)" pathLength="1"/>
               <path d="${line}" class="pc-line pc-line-dim" clip-path="url(#${uid}r)"/>` : ''}
    ${n <= 8 ? closes.map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="${PC_LINE}"/>`).join('') : ''}
    <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5" class="pc-end"/>
    <g class="pc-hover" style="display:none">
      <line class="pc-cross" x1="0" x2="0" y1="${padT - 8}" y2="${H - padB}"/>
      <text class="pc-cross-date" y="${padT - 12}" text-anchor="middle"></text>
      <circle class="pc-dot" r="5"/>
    </g>
  </svg>`;
  st.drawn = true;

  const note = fig.querySelector('.pc-note');
  if (note) note.textContent = (fv > 0 && !showFV)
    ? `Fair value is ${FMT.pct(fv / lastV - 1, 0)} from the price — too far to draw on the same scale. The gap is the finding; see the DCF tab.`
    : '';
  pcReadout(fig, null);
}

/* Header text: the latest close, or the hovered day while scrubbing. */
function pcReadout(fig, i) {
  const st = fig._pc, g = st.geo;
  if (!g) return;
  const idx = i == null ? g.n - 1 : i;
  const v = g.closes[idx], d = g.dates[idx], first = g.closes[0];
  const chg = v / first - 1;
  const rangeName = { 1: 'past month', 3: 'past 3 months', 6: 'past 6 months', ytd: 'year to date', 12: 'past year' }[st.range];
  fig.querySelector('.pc-price').textContent = pcMoney(v);
  const c = fig.querySelector('.pc-chg');
  c.textContent = `${chg >= 0 ? '▲' : '▼'} ${FMT.pct(chg)}`;
  c.className = 'pc-chg ' + (chg >= 0 ? 'up' : 'down');
  let when = i == null
    ? `${rangeName} · close ${pcFmtDate(d)}`
    : `since ${pcFmtDate(g.dates[0])}`;
  if (i != null && st.fv > 0) {
    const gap = st.fv / v - 1;
    when += ` · fair value ${Math.abs(gap * 100).toFixed(0)}% ${gap >= 0 ? 'above' : 'below'}`;
  }
  fig.querySelector('.pc-when').textContent = when;
}

function pcHover(fig, i) {
  const st = fig._pc, g = st.geo;
  const svg = fig.querySelector('.pc-svg');
  if (!g || !svg) return;
  const hov = svg.querySelector('.pc-hover');
  const clipL = svg.querySelector('.pc-clip-l'), clipR = svg.querySelector('.pc-clip-r');
  const W = +svg.getAttribute('width');
  if (i == null) {
    hov.style.display = 'none';
    clipL.setAttribute('width', W); clipR.setAttribute('x', W); clipR.setAttribute('width', 0);
    svg.classList.remove('scrubbing');
    st.hover = null;
    pcReadout(fig, null);
    return;
  }
  i = Math.max(0, Math.min(g.n - 1, i));
  st.hover = i;
  const x = g.X(i), y = g.Y(g.closes[i]);
  hov.style.display = '';
  hov.querySelector('.pc-cross').setAttribute('x1', x);
  hov.querySelector('.pc-cross').setAttribute('x2', x);
  const dot = hov.querySelector('.pc-dot');
  dot.setAttribute('cx', x); dot.setAttribute('cy', y);
  const lab = hov.querySelector('.pc-cross-date');
  lab.textContent = pcFmtDate(g.dates[i]);
  lab.setAttribute('x', Math.max(g.padL + 40, Math.min(g.plotR - 40, x)));
  clipL.setAttribute('width', x); clipR.setAttribute('x', x); clipR.setAttribute('width', W - x);
  svg.classList.add('scrubbing');
  pcReadout(fig, i);
}

let pcUid = 0;
function mountPriceCharts(root) {
  (root || document).querySelectorAll('.pchart').forEach(fig => {
    if (fig._pc) return;
    const series = pcSeries(fig.dataset.key);
    if (!series) return;
    fig._pc = { series, range: 12, fv: parseFloat(fig.dataset.fv) || 0, uid: ++pcUid, drawn: false };
    const plot = fig.querySelector('.pc-plot');

    // Redraw at the new width whenever the box changes size -- including the
    // moment a hidden tab becomes visible.
    if ('ResizeObserver' in window) {
      let lastW = 0;
      new ResizeObserver(() => {
        const w = Math.round(plot.clientWidth);
        if (w && w !== lastW) { lastW = w; pcRender(fig); }
      }).observe(plot);
    } else {
      window.addEventListener('resize', () => pcRender(fig));
    }
    pcRender(fig);

    fig.querySelector('.pc-ranges').addEventListener('click', e => {
      const b = e.target.closest('.pc-range');
      if (!b) return;
      fig.querySelectorAll('.pc-range').forEach(x => {
        x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b);
      });
      const r = b.dataset.r;
      fig._pc.range = r === 'ytd' ? 'ytd' : +r;
      pcRender(fig);
    });

    const idxAt = ev => {
      const g = fig._pc.geo;
      if (!g) return null;
      const rect = plot.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      return Math.round(((x - g.padL) / (g.plotR - g.padL)) * (g.n - 1));
    };
    plot.addEventListener('pointermove', ev => pcHover(fig, idxAt(ev)));
    plot.addEventListener('pointerdown', ev => pcHover(fig, idxAt(ev)));
    plot.addEventListener('pointerleave', () => pcHover(fig, null));
    plot.addEventListener('pointercancel', () => pcHover(fig, null));
    plot.addEventListener('pointerup', ev => { if (ev.pointerType !== 'mouse') pcHover(fig, null); });

    plot.addEventListener('keydown', ev => {
      const g = fig._pc.geo;
      if (!g) return;
      const cur = fig._pc.hover == null ? g.n - 1 : fig._pc.hover;
      const step = ev.shiftKey ? 5 : 1;
      const k = { ArrowLeft: cur - step, ArrowRight: cur + step, Home: 0, End: g.n - 1 }[ev.key];
      if (k != null) { ev.preventDefault(); pcHover(fig, k); }
      else if (ev.key === 'Escape') pcHover(fig, null);
    });
    plot.addEventListener('blur', () => pcHover(fig, null));
  });
}

/* Compact sparkline used in the homepage market strip. */
function marketSparkSVG(key, w = 120, h = 30) {
  if (!hasHistory(key)) return '';
  const closes = FF_HISTORY[key].c.slice(-90);
  const lo = Math.min(...closes), hi = Math.max(...closes);
  const span = (hi - lo) || 1;
  const X = i => closes.length === 1 ? w / 2 : (i / (closes.length - 1)) * w;
  const Y = v => h - 2 - ((v - lo) / span) * (h - 5);
  const d = closes.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const up = closes[closes.length - 1] >= closes[0];
  const color = up ? '#4fb787' : '#dd6b7f';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"
    style="width:100%;height:${h}px;display:block;margin-top:8px" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

/* sector glyphs — minimal line icons, one visual idiom per sector -------- */
const SECTOR_ICONS = {
  semis: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/></svg>`,
  software: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 9h18M8 20h8"/></svg>`,
  health: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>`,
  financials: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V9l4-3 4 3v12M13 21V4l4-1v18"/></svg>`,
  consumer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>`,
  energy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,
  industrials: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>`,
  autos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16l1.5-5A2 2 0 017.4 9.5h9.2A2 2 0 0118.5 11L20 16"/><path d="M3 16h18v3H3z"/><circle cx="7.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg>`,
  global: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.8 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.8-4-9s1.5-6.5 4-9z"/></svg>`,
  telecom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v11"/><circle cx="12" cy="17" r="3"/><path d="M7.5 7a6 6 0 019 0M4.8 4.2a10 10 0 0114.4 0"/></svg>`,
  frontier: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2c2 2.5 3 6 3 10l-3 3-3-3c0-4 1-7.5 3-10z"/><path d="M9 15l-3 3 1 3 3-1M15 15l3 3-1 3-3-1"/><circle cx="12" cy="10" r="1.3"/></svg>`,
};

/* small inline icon set (stroke-based, currentColor) --------------------- */
const ICN = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  caret: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V6M6 11l6-6 6 6"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.83-2.1 3.77-2.1 4.03 0 4.78 2.66 4.78 6.1V21h-4v-5.7c0-1.35-.02-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V9z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>`,
};
