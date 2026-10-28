/* ==========================================================================
   Peer multiples: the company pages for the second model.

   When the switch on a company page is set to "Peer multiples", the tabs keep
   the same shape as the DCF ones but carry this model's numbers:

     Financial Model   ->  Peer Set               who the peers are, and why
     DCF & Valuation   ->  Multiples & Valuation  football field, the three
                                                  readings, bridge, grid,
                                                  growth line, range
     Your Case         ->  Your Case (multiples)  pick the peers, the
                                                  multiple and the cash flow

   FF_MX repeats multiples.py's arithmetic so "Your case" can recalculate in
   the browser. pipeline_test.py checks the two agree for every company.
   ========================================================================== */

const FF_MX = (() => {
  const BANDS = { fcf: [0, 150], sales: [0, 60] };
  const EQUITY = new Set(['financials']);
  const W = { ttm: 0.35, fwd: 0.35, reg: 0.30 };

  function quant(vals, q) {
    const v = [...vals].sort((a, b) => a - b);
    if (!v.length) return null;
    const pos = (v.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    return v[lo] + (v[hi] - v[lo]) * (pos - lo);
  }
  const fwd = (p, kind) => {
    const m = p.model && p.model[0];
    if (m) return kind === 'fcf' ? m.fcf : m.rev;
    const g = (p.growth || [0])[0];
    return (kind === 'fcf' ? p.ttm_fcf : p.rev) * (1 + g);
  };
  const metric = (p, kind, when) => when === 'ttm' ? (kind === 'fcf' ? p.ttm_fcf : p.rev) : fwd(p, kind);
  function multiple(p, kind, when, equity) {
    const base = equity ? p.mcap : p.ev_now;
    const d = metric(p, kind, when);
    if (!(d > 0) || !(base > 0)) return null;
    const x = base / d, [lo, hi] = BANDS[kind];
    return x > lo && x < hi ? x : null;
  }
  const r2 = v => Math.round(v * 100) / 100;

  /* opts.peers: tickers to use (default: the published peers)
     opts.cash:  change applied to the company's cash flow, e.g. 0.1 = +10%
     opts.mult:  an effective multiple to use instead of the peers' blend */
  function value(c, opts = {}) {
    const equity = EQUITY.has(c.sec);
    const kind = c.ttm_fcf > 0 ? 'fcf' : 'sales';
    const peers = (opts.peers || c.peers).map(byT).filter(Boolean);
    const sector = FF_DATA.companies.filter(p => p.sec === c.sec && p.t !== c.t);
    const methods = [];
    for (const when of ['ttm', 'fwd']) {
      const own = metric(c, kind, when);
      if (!(own > 0)) continue;
      let vals = peers.map(p => multiple(p, kind, when, equity)).filter(v => v != null);
      let from = 'peers';
      if (vals.length < (opts.peers ? 1 : 3)) {
        vals = sector.map(p => multiple(p, kind, when, equity)).filter(v => v != null);
        from = 'sector';
      }
      if (vals.length < (opts.peers ? 1 : 3)) continue;
      methods.push({ id: when, w: W[when], own: r2(own), from, n: vals.length,
        med: r2(quant(vals, .5)), q25: r2(quant(vals, .25)), q75: r2(quant(vals, .75)) });
    }
    const reg = c.mx && c.mx.reg;
    if (reg && reg.usable && c.ttm_fcf > 0)
      methods.push({ id: 'reg', w: W.reg, own: r2(c.ttm_fcf), from: 'sector', n: reg.n, med: reg.pred, q25: reg.lo, q75: reg.hi });
    if (!methods.length) return null;
    const tw = methods.reduce((a, m) => a + m.w, 0);
    methods.forEach(m => { m.w = Math.round(m.w / tw * 1e4) / 1e4; });
    const cash = 1 + (opts.cash || 0);
    const blend = q => methods.reduce((a, m) => a + m.w * m[q] * m.own, 0);
    const baseMetric = methods[0].own;
    let whole = blend('med');
    const eff = baseMetric ? whole / baseMetric : 0;
    if (opts.mult != null) whole = opts.mult * baseMetric;
    whole *= cash;
    const toShare = x => { const eq = equity ? x : x - c.netdebt; return c.shares > 0 && eq > 0 ? eq / c.shares : 0; };
    const fv = toShare(whole);
    return { fv, eff, effUsed: whole / (baseMetric * cash), whole, methods, equity,
             upside: fv > 0 && c.price ? fv / c.price - 1 : 0,
             bear: toShare(blend('q25') * cash), bull: toShare(blend('q75') * cash) };
  }
  return { value, multiple, metric, quant, EQUITY };
})();

/* ---------------------------------------------------------- shared bits -- */
const mxPre = c => FF_MX.EQUITY.has(c.sec) ? 'P' : 'EV';
const mxUnit = c => (c.mx && c.mx.kind === 'sales') ? 'Sales' : 'FCF';
const mxName = c => `${mxPre(c)}/${mxUnit(c)}`;
const mxH4 = t => `<h4 class="mx-h">${t}</h4>`;

/* ------------------------------------------------------------- Peer Set -- */
function panelPeerSet(c) {
  const m = c.mx;
  if (!m) return `<div class="empty-state">There isn't a usable peer valuation for ${c.n}.</div>`;
  const kind = m.kind, eq = FF_MX.EQUITY.has(c.sec);
  const rowsFor = list => list.map(p => {
    const me = p.t === c.t;
    const ttm = FF_MX.multiple(p, kind, 'ttm', eq), fwd = FF_MX.multiple(p, kind, 'fwd', eq);
    const close = me ? null : (m.close || {})[p.t];
    return `
      <tr ${me ? 'class="mx-me"' : `data-route="company" data-ticker="${p.t}"`}>
        <td class="tk">${p.t}</td>
        <td>${p.n}</td>
        <td>${close == null ? '<span class="mx-tag">this company</span>' : `<span class="mx-close"><i class="grow" style="width:${close}%"></i></span><span class="mx-close-n">${close}</span>`}</td>
        <td class="num">${FMT.usdB(p.mcap)}</td>
        <td class="num">${FMT.pct(p.cagr5)}</td>
        <td class="num">${FMT.pctPlain(p.m0)}</td>
        <td class="num">${FMT.pctPlain(p.nd_ev, 0)}</td>
        <td class="num">${ttm ? FMT.x(ttm) : '—'}</td>
        <td class="num">${fwd ? FMT.x(fwd) : '—'}</td>
      </tr>`;
  }).join('');
  const peers = c.peers.map(byT).filter(Boolean);
  const vals = when => peers.map(p => FF_MX.multiple(p, kind, when, eq)).filter(v => v != null);
  const stat = (when, q) => { const v = vals(when); return v.length ? FMT.x(FF_MX.quant(v, q)) : '—'; };
  const sumRow = (label, q) => `<tr class="mx-sum"><td></td><td>${label}</td><td></td><td></td><td></td><td></td><td></td>
      <td class="num">${stat('ttm', q)}</td><td class="num">${stat('fwd', q)}</td></tr>`;
  const t0 = m.methods[0];
  const prem = m.prem;
  return `
  <div class="mx-stack">
    <div class="mx-row2">
      <div class="card mx-side">
        <div class="mx-k">${c.t} today</div>
        <div class="mx-big">${m.cur ? FMT.x(m.cur) : '—'}</div>
        <div class="mx-s">${mxName(c)}, trailing, at ${FMT.usd(c.price)}</div>
        ${prem != null ? `<div class="mx-prem ${prem > 0 ? 'hi' : 'lo'}">${Math.abs(prem * 100).toFixed(0)}% ${prem > 0 ? 'above' : 'below'} the peers' median of ${FMT.x(t0.med)}</div>` : ''}
      </div>
      <div class="card mx-side">
        <div class="mx-k">How peers are chosen</div>
        <p class="mx-p" style="margin:8px 0 0;font-size:13px">Only companies in the same sector are eligible. Within it, the eight closest on <b>size</b> (market value on a log scale, so $50B and $500B are as far apart as $500B and $5T), <b>growth</b> (the model's five-year revenue growth), <b>margin</b> (free cash flow over revenue) and <b>leverage</b> (net debt over enterprise value).</p>
      </div>
    </div>
    <div>
      ${mxH4('The peer set')}
      <p class="mx-p">The eight ${fmtSector(c.sec)} companies most like ${c.n} on size, five-year growth, free cash flow margin and leverage. Closeness runs from 0 to 100; click any row to open that company.</p>
      <div class="table-wrap">
        <table class="ff-table mx-peers">
          <thead><tr><th>Ticker</th><th>Company</th><th>Closeness</th><th class="num">Mkt cap</th><th class="num">5-yr growth</th><th class="num">FCF margin</th><th class="num">Net debt / EV</th><th class="num">${mxName(c)}, trailing</th><th class="num">${mxName(c)}, forward</th></tr></thead>
          <tbody>${rowsFor([c])}${rowsFor(peers)}${sumRow('Peers, 25th percentile', .25)}${sumRow('Peers, median', .5)}${sumRow('Peers, 75th percentile', .75)}</tbody>
        </table>
      </div>
      <p class="mx-note">Forward multiples divide today's value by next year's ${kind === 'fcf' ? 'free cash flow' : 'sales'}, using each company's own year-one forecast from the model. Multiples outside a sensible band (negative, or ${kind === 'fcf' ? 'above 150x' : 'above 60x'}) are left out.${t0.from === 'sector' ? ' Fewer than three of these peers had a usable multiple, so the valuation uses the whole sector instead.' : ''}</p>
    </div>
  </div>`;
}

/* ------------------------------------------------- Multiples & Valuation -- */
function mxFootballHTML(c) {
  const m = c.mx;
  const rows = m.methods.map(x => ({ k: x.k, lo: x.ps_lo, mid: x.ps, hi: x.ps_hi, cls: '' }));
  rows.push({ k: 'Peer multiples, blended', lo: m.fv_bear, mid: m.fv, hi: m.fv_bull, cls: 'blend' });
  const d = dcfOf(c);
  const dd = c._dcf ? { lo: c._dcf.fv_bear, mid: c._dcf.fv, hi: c._dcf.fv_bull } : { lo: c.fv_bear, mid: c.fv, hi: c.fv_bull };
  if (dd.mid > 0) rows.push({ k: 'DCF, bear to bull', ...dd, cls: 'dcf' });
  const s = typeof pcSeries === 'function' ? pcSeries(c.t) : null;
  if (s && s.closes.length > 20) {
    const last = s.closes.slice(-252);
    rows.push({ k: '52-week price range', lo: Math.min(...last), mid: null, hi: Math.max(...last), cls: 'px' });
  }
  const vals = rows.flatMap(r => [r.lo, r.hi, r.mid]).filter(v => v > 0).concat([c.price]);
  const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.06;
  const P = v => ((Math.max(v, lo) - lo) / (hi - lo) * 100).toFixed(2) + '%';
  const ffIdle = `Blended, <b class='gv'>${fvStr(m.fv)}</b> a share. Hover a bar to read it.`;
  const body = rows.map(r => `
    <div class="ff-row ${r.cls}" data-lo="${r.lo}" data-mid="${r.mid || 0}" data-hi="${r.hi}">
      <div class="ff-lab">${r.k}</div>
      <div class="ff-track">
        ${r.hi > 0 ? `<span class="ff-bar grow" style="left:${P(Math.max(r.lo, lo))};width:calc(${P(r.hi)} - ${P(Math.max(r.lo, lo))})"></span>` : ''}
        ${r.mid > 0 ? `<span class="ff-mid" style="left:${P(r.mid)}"></span>` : ''}
      </div>
      <div class="ff-val">${r.hi > 0 ? `${FMT.usd(Math.max(r.lo, 0), 0)} to ${FMT.usd(r.hi, 0)}` : 'N/M'}</div>
    </div>`).join('');
  return `
    <div class="ff-read" aria-live="polite" data-idle="${ffIdle}">${ffIdle}</div>
    <div class="ff-chart" data-price="${c.price}" role="img" aria-label="Value per share from each method against the price of ${FMT.usd(c.price)}">
      <div class="ff-price" style="left:calc(var(--ff-lab) + (100% - var(--ff-lab) - var(--ff-val)) * ${((c.price - lo) / (hi - lo)).toFixed(4)})"><span>Price ${FMT.usd(c.price, 0)}</span></div>
      ${body}
    </div>
    <p class="mx-note">Each bar runs from the peers' 25th to 75th percentile multiple; the tick is the median. The dashed line is today's price.</p>`;
}

function mxRegressionSVG(c) {
  const g = c.mx.reg;
  if (!g) return '';
  const eq = FF_MX.EQUITY.has(c.sec);
  const pts = FF_DATA.companies.filter(p => p.sec === c.sec)
    .map(p => ({ t: p.t, g: p.cagr5, y: FF_MX.multiple(p, 'fcf', 'ttm', eq), me: p.t === c.t, peer: c.peers.includes(p.t) }))
    .filter(p => p.y != null);
  if (pts.length < 4) return '';
  const w = 340, h = 220, pl = 38, pr = 10, pt = 12, pb = 30;
  const gx = pts.map(p => p.g).concat([g.g]), gy = pts.map(p => p.y).concat([g.pred]);
  const x0 = Math.min(...gx) - .01, x1 = Math.max(...gx) + .01;
  const y0 = 0, y1 = Math.min(150, Math.max(...gy) * 1.08);
  const X = v => pl + (v - x0) / (x1 - x0) * (w - pl - pr);
  const Y = v => pt + (1 - (Math.min(v, y1) - y0) / (y1 - y0)) * (h - pt - pb);
  const yt = pcNiceTicks(y0, y1, 4), xt = pcNiceTicks(x0 * 100, x1 * 100, 4);
  const line = `M${X(x0).toFixed(1)},${Y(g.a + g.b * x0).toFixed(1)}L${X(x1).toFixed(1)},${Y(g.a + g.b * x1).toFixed(1)}`;
  return `
  <svg class="mx-reg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${fmtSector(c.sec)} companies: ${mxName(c)} against five-year growth, with the fitted line">
    ${yt.map(v => `<line x1="${pl}" x2="${w - pr}" y1="${Y(v)}" y2="${Y(v)}" class="r-grid"/><text x="${pl - 6}" y="${Y(v) + 3.5}" class="r-ax" text-anchor="end">${v}x</text>`).join('')}
    ${xt.map(v => `<text x="${X(v / 100)}" y="${h - 10}" class="r-ax" text-anchor="middle">${v}%</text>`).join('')}
    <clipPath id="rclip"><rect x="${pl}" y="${pt}" width="${w - pl - pr}" height="${h - pt - pb}"/></clipPath>
    <path d="${line}" class="r-line" clip-path="url(#rclip)"/>
    ${pts.filter(p => !p.me).map(p => `<circle cx="${X(p.g).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.peer ? 3.6 : 2.6}" class="r-dot${p.peer ? ' peer' : ''}" data-route="company" data-ticker="${p.t}" data-tip="<b>${p.t}</b>${p.peer ? ' (peer)' : ''}: ${FMT.x(p.y)} at ${FMT.pct(p.g)} growth. Click to open."><title>${p.t}: ${FMT.x(p.y)} at ${FMT.pct(p.g)} growth</title></circle>`).join('')}
    <circle cx="${X(g.g).toFixed(1)}" cy="${Y(g.pred).toFixed(1)}" r="5.5" class="r-me"/>
    <text x="${X(g.g).toFixed(1)}" y="${(Y(g.pred) - 10).toFixed(1)}" class="r-me-lab" text-anchor="middle">${c.t} ${FMT.x(g.pred)}</text>
  </svg>`;
}

function panelMxValuation(c) {
  const m = c.mx;
  if (!m) return `<div class="empty-state">There isn't a usable peer valuation for ${c.n}.</div>`;
  const eq = m.basis === 'equity';
  const meth = m.methods.map(x => `
    <tr>
      <td>${x.k}</td>
      <td class="num" style="color:var(--gold-soft)">${FMT.x(x.med)}</td>
      <td class="num">${FMT.usdB(x.own)}</td>
      <td class="num">${FMT.usdB(x.implied)}</td>
      <td class="num">${(x.w * 100).toFixed(0)}%</td>
      <td class="num">${fvStr(x.ps)}</td>
    </tr>`).join('');
  const regM = m.methods.find(x => x.id === 'reg');
  const bridge = `
    <div class="mx-bridge">
      <div><span>Blended ${eq ? 'equity value' : 'enterprise value'}</span><b>${FMT.usdB(m.whole)}</b></div>
      ${eq ? '' : `<div class="sub"><span>${m.netdebt >= 0 ? 'Less: net debt' : 'Plus: net cash'}</span><b>${m.netdebt >= 0 ? '−' : '+'}${FMT.usdB(Math.abs(m.netdebt))}</b></div>
      <div><span>Equity value</span><b>${FMT.usdB(m.equity)}</b></div>`}
      <div class="sub"><span>÷ Shares outstanding</span><b>${FMT.num(c.shares, 3)}B</b></div>
      <div class="tot"><span>Value per share</span><b>${fvStr(m.fv)}</b></div>
      ${m.equity <= 0 ? `<p class="mx-note" style="color:var(--red)">At its peers' multiples the business is worth less than its net debt, so a per-share value isn't meaningful.</p>` : ''}
    </div>`;
  const grid = { waccs: m.grid.mults, tgs: m.grid.cash, values: m.grid.values };
  return `
  <div class="mx-stack">
    <div class="two-col mx-cols">
      <div>
        ${mxH4('Football field')}
        <div class="card">${mxFootballHTML(c)}</div>
      </div>
      <div>
        <div class="card mx-side">
          <div class="mx-k">Value at peer multiples</div>
          <div class="mx-big gold">${fvStr(m.fv)}</div>
          <div style="margin-top:10px;"><span class="rating-pill ${ratingClass(m.rating)}">${m.rating}</span> <span class="mono ${upClass(m.upside)}" style="margin-left:10px;font-size:13px;">${FMT.pct(m.upside)} vs current price</span></div>
          <div class="mx-vs" style="margin-top:16px"><div><span>DCF</span><b>${fvStr(dcfOf(c).fv)}</b></div><div class="cur"><span>Peer multiples</span><b>${fvStr(m.fv)}</b></div></div>
        </div>
        ${mxH4('From value to a price')}
        <div class="card">${bridge}</div>
      </div>
    </div>
    <div>
      ${mxH4('Three readings of the peers')}
      <div class="table-wrap">
        <table class="ff-table mx-meth">
          <thead><tr><th>Method</th><th class="num">Multiple</th><th class="num">${c.t}'s ${m.kind === 'fcf' ? 'cash flow' : 'sales'}</th><th class="num">Implied ${eq ? 'equity' : 'EV'}</th><th class="num">Weight</th><th class="num">Per share</th></tr></thead>
          <tbody>${meth}</tbody>
        </table>
      </div>
      <p class="mx-note">Trailing uses the last twelve months; forward uses next year's forecast, the reading research finds most accurate. Growth-adjusted reads the sector's line of multiple against growth at ${c.t}'s own growth rate${regM ? '' : ', and is left out here because that line explains too little for this sector'}.${m.sales_only ? ' Free cash flow is not positive yet, so this company is valued on sales, which flatters a business whose peers earn higher margins.' : ''}</p>
    </div>
    <div class="two-col mx-cols">
      <div>
        ${mxH4(`Sensitivity: value by multiple and ${m.kind === 'fcf' ? 'cash flow' : 'sales'}`)}
        <div class="table-wrap" style="padding:18px;">${sensitivityGridHTML(grid, c.price, { corner: `${mxName(c)} ↓ / ${m.kind === 'fcf' ? 'cash flow' : 'sales'} →`, row: v => v.toFixed(1) + 'x', col: v => (v > 0 ? '+' : '') + v + '%', rn: mxName(c), cn: m.kind === 'fcf' ? 'cash flow' : 'sales', base: "the model: the peers' blended multiple on today's figure" })}</div>
        <p class="mx-note">The middle row is the blended multiple, ${FMT.x(m.eff)}. Green cells sit above today's price of ${FMT.usd(c.price)}, red below.</p>
      </div>
      <div>
        ${mxH4('Low, median and high')}
        <div class="card">
          ${m.fv > 0 ? rangeBarHTML(m.fv_bear, m.fv, m.fv_bull, c.price) : ''}
          <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:4px;">
            <div class="stat-cell" style="padding:14px;"><div class="label">25th pct.</div><div class="value" style="font-size:16px;">${fvStr(m.fv_bear)}</div><div class="sub ${upClass(m.up_bear)}">${FMT.pct(m.up_bear)}</div></div>
            <div class="stat-cell" style="padding:14px;"><div class="label">Median</div><div class="value" style="font-size:16px;color:var(--gold-soft);">${fvStr(m.fv)}</div><div class="sub ${upClass(m.upside)}">${FMT.pct(m.upside)}</div></div>
            <div class="stat-cell" style="padding:14px;"><div class="label">75th pct.</div><div class="value" style="font-size:16px;">${fvStr(m.fv_bull)}</div><div class="sub ${upClass(m.up_bull)}">${FMT.pct(m.up_bull)}</div></div>
          </div>
        </div>
        ${m.reg ? `${mxH4('Multiple against growth')}
        <div class="card">
          ${mxRegressionSVG(c)}
          <p class="mx-reg-read" aria-live="polite" data-idle="Hover a dot to see the company; click to open it.">Hover a dot to see the company; click to open it.</p>
        <p class="mx-note" style="margin-top:8px">Every ${fmtSector(c.sec)} company (peers brighter). The line explains ${(m.reg.r2 * 100).toFixed(0)}% of the spread in multiples; at ${c.t}'s ${FMT.pct(m.reg.g)} growth it reads ${FMT.x(m.reg.pred)}${m.reg.usable ? '' : ', too weak to use, so it carries no weight here'}.</p>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

/* ---------------------------------------------------- Your case (peers) -- */
function panelMxCase(c) {
  const m = c.mx;
  if (!m) return `<div class="empty-state">There isn't a usable peer valuation for ${c.n}.</div>`;
  const peers = c.peers.map(byT).filter(Boolean);
  const eq = FF_MX.EQUITY.has(c.sec);
  const chips = peers.map(p => {
    const x = FF_MX.multiple(p, m.kind, 'fwd', eq);
    return `<label class="mxc-peer"><input type="checkbox" data-mxc-peer="${p.t}" checked>
      <span class="tk">${p.t}</span><span class="x">${x ? FMT.x(x) : '—'}</span></label>`;
  }).join('');
  return `
  <div style="margin-bottom:18px">${priceChartSVG(c.t, c.fv, c.price)}</div>
  <section class="mxc card" data-mxc="${c.t}">
    <div class="mxc-grid">
      <div>
        ${mxH4('Your case, on peer multiples')}
        <p class="mx-p">Choose which companies count as peers, the multiple you think ${c.t} deserves and how much cash it really generates. The value follows as you go.</p>
        <div class="mxc-block">
          <div class="mxc-lab">Peers <small>forward ${mxName(c)} beside each</small></div>
          <div class="mxc-peers">${chips}</div>
        </div>
        <div class="mxc-block">
          <div class="mxc-lab">Multiple <b class="mxc-mult-v"></b> <button type="button" class="mxc-reset-mult" hidden>use the peers' blend</button></div>
          <input type="range" class="mxc-mult" min="2" max="80" step="0.5">
          <div class="mxc-hint">Blended ${mxName(c)} from the peers you picked: <b class="mxc-peer-mult"></b></div>
        </div>
        <div class="mxc-block">
          <div class="mxc-lab">${m.kind === 'fcf' ? 'Free cash flow' : 'Sales'} <b class="mxc-cash-v"></b></div>
          <input type="range" class="mxc-cash" min="-50" max="50" step="5" value="0">
          <div class="mxc-hint">Today ${FMT.usdB(m.methods[0].own)}. Move it if this year's figure is unusually high or low.</div>
        </div>
      </div>
      <div class="mxc-out">
        <div class="mx-k">Your value</div>
        <div class="mx-big gold mxc-fv"></div>
        <div class="mxc-up"></div>
        <div class="mx-vs" style="margin-top:16px"><div><span>Model, peer multiples</span><b>${fvStr(m.fv)}</b></div><div><span>DCF</span><b>${fvStr(dcfOf(c).fv)}</b></div></div>
        <p class="mxc-why mx-note"></p>
        <button type="button" class="btn btn-ghost mxc-reset">Reset to the model</button>
      </div>
    </div>
  </section>`;
}

function mountMxCase(root) {
  (root || document).querySelectorAll('[data-mxc]').forEach(sec => {
    if (sec._mxc) return; sec._mxc = true;
    const c = byT(sec.dataset.mxc);
    if (!c || !c.mx) return;
    const st = { mult: null, cash: 0 };
    const multIn = sec.querySelector('.mxc-mult'), cashIn = sec.querySelector('.mxc-cash');
    const chosen = () => [...sec.querySelectorAll('[data-mxc-peer]')].filter(b => b.checked).map(b => b.dataset.mxcPeer);
    function update() {
      const picks = chosen();
      const base = FF_MX.value(c, { peers: picks.length ? picks : c.peers, cash: 0 });
      const r = FF_MX.value(c, { peers: picks.length ? picks : c.peers, cash: st.cash / 100, mult: st.mult });
      if (!r) return;
      if (st.mult == null) multIn.value = base.eff.toFixed(1);
      sec.querySelector('.mxc-mult-v').textContent = FMT.x(r.effUsed);
      sec.querySelector('.mxc-peer-mult').textContent = FMT.x(base.eff);
      sec.querySelector('.mxc-reset-mult').hidden = st.mult == null;
      sec.querySelector('.mxc-cash-v').textContent = st.cash ? `${st.cash > 0 ? '+' : ''}${st.cash}%` : 'as reported';
      sec.querySelector('.mxc-fv').textContent = fvStr(r.fv);
      const up = sec.querySelector('.mxc-up');
      up.className = 'mxc-up mono ' + upClass(r.upside);
      up.textContent = r.fv > 0 ? `${FMT.pct(r.upside)} vs ${FMT.usd(c.price)}` : 'Worth less than its net debt at this multiple';
      const bits = [];
      if (picks.length < c.peers.length) bits.push(`${picks.length} of ${c.peers.length} peers`);
      if (st.mult != null) bits.push(`a ${FMT.x(st.mult)} multiple instead of the peers' ${FMT.x(base.eff)}`);
      if (st.cash) bits.push(`cash flow ${st.cash > 0 ? 'up' : 'down'} ${Math.abs(st.cash)}%`);
      sec.querySelector('.mxc-why').textContent = bits.length
        ? `With ${bits.join(', ')}, the value moves ${r.fv >= c.mx.fv ? 'up' : 'down'} ${FMT.usd(Math.abs(r.fv - c.mx.fv))} a share from the model's.`
        : 'This is the model: all eight peers, their blended multiple, cash flow as reported.';
      const fig = sec.parentElement.querySelector('.pchart');
      if (fig && typeof pcSetFV === 'function') pcSetFV(fig, r.fv, c.mx.fv, bits.length > 0);
    }
    sec.addEventListener('change', e => { if (e.target.matches('[data-mxc-peer]')) { st.mult = null; update(); } });
    multIn.addEventListener('input', () => { st.mult = +multIn.value; update(); });
    cashIn.addEventListener('input', () => { st.cash = +cashIn.value; update(); });
    sec.querySelector('.mxc-reset-mult').addEventListener('click', () => { st.mult = null; update(); });
    sec.querySelector('.mxc-reset').addEventListener('click', () => {
      st.mult = null; st.cash = 0; cashIn.value = 0;
      sec.querySelectorAll('[data-mxc-peer]').forEach(b => { b.checked = true; });
      update();
    });
    update();
  });
}
