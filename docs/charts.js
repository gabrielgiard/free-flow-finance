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
  const vals = [bear, base, bull, price];
  const min = Math.min(...vals), max = Math.max(...vals), pad = (max - min) * 0.08 || Math.abs(min) * 0.1 || 1;
  const lo = min - pad, hi = max + pad;
  const pos = v => ((v - lo) / (hi - lo) * 100).toFixed(2);
  const pts = [
    { v: bear, lbl: 'Bear', cls: '' },
    { v: base, lbl: 'Base', cls: '' },
    { v: bull, lbl: 'Bull', cls: '' },
    { v: price, lbl: 'Current', cls: 'price' }
  ].sort((a, b) => a.v - b.v);
  const fillL = pos(Math.min(bear, base, bull)), fillR = pos(Math.max(bear, base, bull));
  const markers = pts.map(p => `
    <div class="range-pt ${p.cls}" style="left:${pos(p.v)}%">
      <div class="dot" style="background:${p.cls === 'price' ? 'var(--gold)' : 'var(--lilac)'}"></div>
      <div class="lbl">${p.lbl}</div>
      <div class="val">${p.cls === 'price' ? FMT.usd(p.v, 0) : fvStr(p.v)}</div>
    </div>`).join('');
  return `
    <div class="range-wrap">
      <div class="range-track">
        <div class="range-fill" style="left:${fillL}%;right:${100 - fillR}%"></div>
        ${markers}
      </div>
    </div>`;
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

/* Main company chart: 12 months of closes with the fair value overlaid. */
function priceChartSVG(key, fv, price, h = 240) {
  if (!hasHistory(key)) return historyEmptyState(key);
  const s = FF_HISTORY[key];
  const closes = s.c;
  const w = 720, padL = 4, padR = 58, padT = 16, padB = 26;

  // Include fv in the y-range only when it's close enough to be readable —
  // a target 5x away from the price would flatten the price line into a
  // straight edge and tell you nothing.
  const pLo = Math.min(...closes), pHi = Math.max(...closes);
  const showFV = fv > 0 && fv > pLo * 0.45 && fv < pHi * 2.2;
  let lo = showFV ? Math.min(pLo, fv) : pLo;
  let hi = showFV ? Math.max(pHi, fv) : pHi;
  const pad = (hi - lo) * 0.12 || hi * 0.1 || 1;
  lo -= pad; hi += pad;

  const span = closes.length - 1;
  const X = i => span === 0
    ? (w - padR)                                        // single point: pin to "now"
    : padL + (i / span) * (w - padL - padR);
  const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);

  const line = closes.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const area = span === 0 ? '' : line + ` L${X(span).toFixed(1)},${h - padB} L${padL},${h - padB} Z`;
  // With only a handful of points, mark each one so it reads as recorded data
  // rather than a suspiciously straight line.
  const dots = closes.length <= 8
    ? closes.map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.6" fill="#b9a3f5" opacity=".85"/>`).join('')
    : '';

  const first = closes[0], last = closes[closes.length - 1];
  const chg = (last / first - 1);
  const chgColor = chg >= 0 ? 'var(--green)' : 'var(--red)';

  const fvY = showFV ? Y(fv) : null;
  const uid = 'g' + key.replace(/[^a-z0-9]/gi, '');

  return `
  <div style="position:relative">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim)">
        Share price · ${s.from} to ${s.to}
      </div>
      <div class="mono" style="font-size:12.5px;color:${span === 0 ? 'var(--text-dim)' : chgColor}">
        ${span === 0 ? 'first close recorded' : FMT.pct(chg) + ' over period'}
      </div>
    </div>
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Share price from ${s.from} to ${s.to}. Latest close ${FMT.usd(last,0)}${showFV ? `, against a fair value of ${FMT.usd(fv,0)}` : ''}. Change over the period ${FMT.pct(chg)}." style="width:100%;height:${h}px;display:block">
      <defs>
        <linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6d3fc0" stop-opacity=".38"/>
          <stop offset="100%" stop-color="#6d3fc0" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${area ? `<path d="${area}" fill="url(#${uid})"/>` : ''}
      ${span === 0 ? '' : `<path d="${line}" fill="none" stroke="#b9a3f5" stroke-width="1.8" vector-effect="non-scaling-stroke"/>`}
      ${dots}
      ${showFV ? `
        <line x1="${padL}" y1="${fvY.toFixed(1)}" x2="${(w - padR).toFixed(1)}" y2="${fvY.toFixed(1)}"
              stroke="#c9a227" stroke-width="1.3" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
        <text x="${w - padR + 6}" y="${(fvY + 3.5).toFixed(1)}" fill="#e4c97a"
              font-family="IBM Plex Mono, monospace" font-size="11">FV ${FMT.usd(fv, 0)}</text>` : ''}
      <circle cx="${X(span).toFixed(1)}" cy="${Y(last).toFixed(1)}" r="3.5" fill="#b9a3f5"/>
      <text x="${w - padR + 6}" y="${(Y(last) + 3.5).toFixed(1)}" fill="#f1eef8"
            font-family="IBM Plex Mono, monospace" font-size="11">${FMT.usd(last, 0)}</text>
    </svg>
    ${showFV ? '' : `<p style="font-size:11px;color:var(--text-dim);margin-top:8px">
      Fair value of ${fvStr(fv)} sits too far outside the traded range to plot on the same axis —
      the gap itself is the finding. See the DCF tab.</p>`}
    ${closes.length < 8 ? historyThinNote(closes.length) : ''}
  </div>`;
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
