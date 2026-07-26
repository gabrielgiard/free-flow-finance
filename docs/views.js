/* FreeFlow Finance — view renderers. Each function returns an HTML string
   for the #app outlet. Company/sector pages carry their own light client
   state (active tab, table sort) via the STATE object below. */

const STATE = {
  sectorSort: {},          // { [sectorKey]: {col, dir} }
  sectorFilter: {},        // { [sectorKey]: rating|'all' }
  activeTab: {},           // { [ticker]: tabId }
};

function byT(t) { return FF_DATA.companies.find(c => c.t === t); }
function sectorMeta(k) { return FF_DATA.sectors.find(s => s.k === k); }
function inSector(k) { return FF_DATA.companies.filter(c => c.sec === k); }
function fmtSector(k) { const s = sectorMeta(k); return s ? s.n : k; }

function crumbs(...parts) {
  return `<div class="co-crumb">` + parts.map((p, i) =>
    i === parts.length - 1
      ? `<span style="color:var(--text-muted)">${p.label}</span>`
      : `<a href="${p.href}">${p.label}</a><span>/</span>`
  ).join('') + `</div>`;
}

/* ============================== HOME ================================= */
/* Homepage strip figures, computed from the loaded data rather than baked in
   at build time. Keeps the strip working regardless of what build.py emits,
   and it recalculates itself the moment a company is added. */
function coverageStats() {
  const cs = FF_DATA.companies;
  const ups = cs.map(c => c.upside).sort((a, b) => a - b);
  const mid = Math.floor(ups.length / 2);
  const medianUpside = ups.length % 2 ? ups[mid] : (ups[mid - 1] + ups[mid]) / 2;
  return {
    n: cs.length,
    sectors: FF_DATA.sectors.length,
    mcap: (cs.reduce((a, c) => a + c.mcap, 0) / 1000).toFixed(1),
    medianUpside,
    strongBuys: cs.filter(c => c.rating === 'Strong Buy').length,
    buys: cs.filter(c => c.rating === 'Strong Buy' || c.rating === 'Buy').length,
    sells: cs.filter(c => c.rating === 'Sell' || c.rating === 'Reduce').length,
  };
}

function viewHome() {
  const m = FF_DATA.meta;
  const cov = coverageStats();
  const all = FF_DATA.companies;
  const ratingOrder = ['Strong Buy', 'Buy', 'Hold', 'Reduce', 'Sell'];
  const counts = {}; ratingOrder.forEach(r => counts[r] = 0);
  all.forEach(c => counts[c.rating]++);
  const total = all.length;

  const topUp = [...all].sort((a, b) => b.upside - a.upside).slice(0, 8);
  const topDown = [...all].sort((a, b) => a.upside - b.upside).slice(0, 6);

  const sectorCards = FF_DATA.sectors.map(s => `
    <div class="sector-card" data-route="sector" data-key="${s.k}">
      <div class="sc-top"><span class="sc-icon">${SECTOR_ICONS[s.k] || ''}</span><span class="sc-count">${s.count} COS</span></div>
      <h3>${s.n}</h3>
      <p>${s.d}</p>
      <div class="sc-stats">
        <div class="sc-stat"><b>$${s.mcap}T</b><span>Combined Mkt Cap</span></div>
        <div class="sc-stat"><b>${s.med_ev_sales}x</b><span>Median EV / Sales</span></div>
      </div>
    </div>`).join('');

  const ratingBar = ratingOrder.map(r => `
    <div style="flex:${counts[r] || 0.001}; background:${ratingColor(r)}; opacity:.75" title="${r}: ${counts[r]}"></div>
  `).join('');
  const ratingLegend = ratingOrder.map(r => `
    <div class="li"><span class="sw" style="background:${ratingColor(r)}"></span>${r} — ${counts[r]} <span style="color:var(--text-dim)">(${(counts[r]/total*100).toFixed(0)}%)</span></div>
  `).join('');

  const upRows = topUp.map(c => `
    <tr data-route="company" data-ticker="${c.t}">
      <td class="tk">${c.t}</td>
      <td>${c.n}<div class="row-name">${fmtSector(c.sec)}</div></td>
      <td class="num">${FMT.usd(c.price)}</td>
      <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      <td class="num ${upClass(c.upside)}">${FMT.pct(c.upside)}</td>
      <td><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span></td>
    </tr>`).join('');

  const downRows = topDown.map(c => `
    <tr data-route="company" data-ticker="${c.t}">
      <td class="tk">${c.t}</td>
      <td>${c.n}<div class="row-name">${fmtSector(c.sec)}</div></td>
      <td class="num">${FMT.usd(c.price)}</td>
      <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      <td class="num ${upClass(c.upside)}">${FMT.pct(c.upside)}</td>
      <td><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span></td>
    </tr>`).join('');

  return `
  <section class="hero">
    ${heroFlowSVG()}
    <div class="wrap">
      <div class="hero-inner">
        <div class="eyebrow">FreeFlow Finance · Independent Equity Research</div>
        <h1>One model. <em>100</em> companies. Every fair value built the same way.</h1>
        <p class="lede">A discounted cash flow, comparable-company set, investment thesis and target price for 100 of the world's largest and most-talked-about public companies — built with a single consistent methodology so you can actually compare them, not just read about them.</p>
        <div class="hero-cta">
          <button class="btn btn-violet" data-route="sector" data-key="semis">${ICN.arrow.replace('currentColor','#fff')} Explore the coverage</button>
          <button class="btn btn-ghost" data-route="methodology">How the model works</button>
        </div>
      </div>
      <div class="snapshot-strip">
        <div class="snap-item"><div class="snap-label">Companies Covered</div><div class="snap-value">${cov.n}</div></div>
        <div class="snap-item"><div class="snap-label">Sectors</div><div class="snap-value">${cov.sectors}</div></div>
        <div class="snap-item"><div class="snap-label">Market Cap Covered</div><div class="snap-value">$${cov.mcap}T</div></div>
        <div class="snap-item"><div class="snap-label">Median Upside</div><div class="snap-value ${cov.medianUpside >= 0 ? 'up' : 'down'}">${FMT.pct(cov.medianUpside)}</div></div>
        <div class="snap-item"><div class="snap-label">Buy Rated</div><div class="snap-value up">${cov.buys}</div></div>
        <div class="snap-item"><div class="snap-label">Sell Rated</div><div class="snap-value down">${cov.sells}</div></div>
        <div class="snap-item"><div class="snap-label">Strong Buy</div><div class="snap-value up">${cov.strongBuys}</div></div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head">
        <div><h2>Coverage by sector</h2><p class="sub">Ten sectors, from AI silicon to frontier technology. Each card links to the full sortable list and every company inside has its own research page.</p></div>
      </div>
      <div class="sector-grid">${sectorCards}</div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head">
        <div><h2>Where the model sees the most upside</h2><p class="sub">Ranked by upside to our discounted cash flow fair value versus the current share price.</p></div>
        <span class="section-link" data-route="screener">Screen all 100 companies ${ICN.arrow}</span>
      </div>
      <div class="two-col" style="grid-template-columns: 1fr 1fr;">
        <div class="table-wrap">
          <table class="ff-table">
            <thead><tr><th>Ticker</th><th>Company</th><th class="num">Price</th><th class="num">Fair Value</th><th class="num">Upside</th><th>Rating</th></tr></thead>
            <tbody>${upRows}</tbody>
          </table>
        </div>
        <div class="table-wrap">
          <table class="ff-table">
            <thead><tr><th>Ticker</th><th>Company</th><th class="num">Price</th><th class="num">Fair Value</th><th class="num">Downside</th><th>Rating</th></tr></thead>
            <tbody>${downRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="card">
        <div class="section-head" style="margin-bottom:20px;">
          <div><h2 style="font-size:20px;">Ratings across the library</h2><p class="sub">All ${total} companies, rated on the same five-point scale from our DCF upside.</p></div>
        </div>
        <div class="seg-bar" style="height:26px;">${ratingBar}</div>
        <div class="seg-legend">${ratingLegend}</div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="two-col">
        <div class="card">
          <span class="tag tag-lilac" style="margin-bottom:14px;">About the analyst</span>
          <h2 style="font-size:22px;">Built by a 17-year-old who got a couple of stocks for Christmas.</h2>
          <p>I'm Gabriel Giard, an incoming high school senior. FreeFlow Finance is my attempt to build the kind of coverage a junior analyst at a bank would produce — for anyone to read, whether you know what a discount rate is or you're about to learn.</p>
          <button class="btn btn-ghost" data-route="about">Read the full story ${ICN.arrow}</button>
        </div>
        <div class="card">
          <span class="tag tag-lilac" style="margin-bottom:14px;">Methodology</span>
          <h2 style="font-size:22px;">Same model, every time. On purpose.</h2>
          <p>Every company runs through the identical two-stage discounted cash flow: five years of explicit forecasts, five years fading to a terminal growth rate, then a Gordon Growth terminal value. No cherry-picked assumptions to hit a target — the model decides, then we explain what it decided.</p>
          <button class="btn btn-ghost" data-route="methodology">See how it works ${ICN.arrow}</button>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================== SECTOR ================================ */
function viewSector(key) {
  const s = sectorMeta(key);
  if (!s) return view404();
  if (!STATE.sectorSort[key]) STATE.sectorSort[key] = { col: 'mcap', dir: -1 };
  if (!STATE.sectorFilter[key]) STATE.sectorFilter[key] = 'all';

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: s.n })}
      <div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:10px;">
        <span style="color:var(--lilac);width:40px;height:40px;flex:none;">${SECTOR_ICONS[key]||''}</span>
        <div>
          <h1 style="font-size:32px;margin-bottom:8px;">${s.n}</h1>
          <p style="max-width:640px;font-size:14.5px;">${s.d}</p>
        </div>
      </div>
      ${s.note ? `<div class="comp-note">${s.note}</div>` : ''}
      <div class="stat-grid" style="margin:26px 0 32px;">
        <div class="stat-cell"><div class="label">Companies Covered</div><div class="value">${s.count}</div></div>
        <div class="stat-cell"><div class="label">Combined Market Cap</div><div class="value">$${s.mcap}T</div></div>
        <div class="stat-cell"><div class="label">Median EV / Sales</div><div class="value">${s.med_ev_sales}x</div></div>
        <div class="stat-cell"><div class="label">Median EV / FCF</div><div class="value">${s.med_ev_fcf}x</div></div>
      </div>
    </div>
  </section>
  <section style="padding-top:0;">
    <div class="wrap">
      <div class="pill-row" id="sector-filters" style="margin-bottom:18px;">
        ${['all','Strong Buy','Buy','Hold','Reduce','Sell'].map(r => `<span class="filter-pill ${STATE.sectorFilter[key]===r?'active':''}" data-filter="${r}">${r === 'all' ? 'All ratings' : r}</span>`).join('')}
      </div>
      <div id="sector-table-wrap">${sectorTableHTML(key)}</div>
    </div>
  </section>`;
}

function sectorTableHTML(key) {
  const sort = STATE.sectorSort[key];
  const filter = STATE.sectorFilter[key];
  let rows = inSector(key);
  if (filter !== 'all') rows = rows.filter(c => c.rating === filter);
  const colMap = {
    t: c => c.t, n: c => c.n, price: c => c.price, fv: c => c.fv,
    upside: c => c.upside, mcap: c => c.mcap, ev_sales: c => c.ev_sales, ev_fcf: c => c.ev_fcf,
  };
  rows.sort((a, b) => (colMap[sort.col](a) > colMap[sort.col](b) ? 1 : -1) * sort.dir);
  const cols = [
    ['t', 'Ticker', ''], ['n', 'Company', ''], ['price', 'Price', 'num'],
    ['fv', 'Fair Value', 'num'], ['upside', 'Upside', 'num'], ['mcap', 'Mkt Cap', 'num'],
    ['ev_sales', 'EV/Sales', 'num'], ['ev_fcf', 'EV/FCF', 'num'],
  ];
  const head = cols.map(([k, label, cls]) =>
    `<th class="${cls} ${sort.col === k ? 'sorted' : ''}" data-sort-col="${k}">${label} ${sort.col === k ? (sort.dir === 1 ? '↑' : '↓') : ''}</th>`
  ).join('');
  const body = rows.map(c => `
    <tr data-route="company" data-ticker="${c.t}">
      <td class="tk">${c.t}</td>
      <td>${c.n}</td>
      <td class="num">${FMT.usd(c.price)}</td>
      <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      <td class="num ${upClass(c.upside)}">${FMT.pct(c.upside)}</td>
      <td class="num">${FMT.usdB(c.mcap)}</td>
      <td class="num">${FMT.x(c.ev_sales)}</td>
      <td class="num">${c.ev_fcf > 0 && c.ev_fcf < 999 ? FMT.x(c.ev_fcf) : '—'}</td>
    </tr>`).join('');
  if (!rows.length) return `<div class="empty-state">No companies match that filter in this sector.</div>`;
  return `<div class="table-wrap"><table class="ff-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/* ============================== COMPANY ================================ */
const TABS = [
  ['overview', 'Overview'],
  ['model', 'Financial Model'],
  ['financials', 'Financial Analysis'],
  ['dcf', 'DCF & Valuation'],
  ['comps', 'Comparables'],
  ['thesis', 'Thesis & Ratings'],
];

function viewCompany(ticker) {
  const c = byT(ticker);
  if (!c) return view404();
  if (!STATE.activeTab[ticker]) STATE.activeTab[ticker] = 'overview';
  const active = STATE.activeTab[ticker];

  const tabsHTML = TABS.map(([id, label]) =>
    `<div class="co-tab ${active === id ? 'active' : ''}" data-tab="${id}" data-ticker="${ticker}">${label}</div>`
  ).join('');

  const panels = {
    overview: panelOverview(c),
    model: panelModel(c),
    financials: panelFinancials(c),
    dcf: panelDCF(c),
    comps: panelComps(c),
    thesis: panelThesis(c),
  };
  const panelsHTML = TABS.map(([id]) =>
    `<div class="co-panel ${active === id ? 'active' : ''}" data-panel="${id}">${panels[id]}</div>`
  ).join('');

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { href: '#/sector/' + c.sec, label: fmtSector(c.sec) }, { label: c.t })}
      <div class="co-top">
        <div class="co-id">
          <div class="co-mono">${c.t.length > 5 ? c.t.slice(0,4) : c.t}</div>
          <div>
            <h1 class="co-name">${c.n}</h1>
            <div class="co-sub">
              <span class="mono">${c.exch}</span><span>·</span><span>${c.hq}</span><span>·</span><span>Founded ${c.founded}</span>
            </div>
          </div>
        </div>
        <div class="co-price-block">
          <div class="co-price">${FMT.usd(c.price)}<span class="cur"> current</span></div>
          <div class="co-fv-row">
            <span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span>
            <span class="co-fv">FV ${fvStr(c.fv)}</span>
            <span class="co-up ${upClass(c.upside)}">${FMT.pct(c.upside)}</span>
          </div>
        </div>
      </div>
      <div class="co-tabs">${tabsHTML}</div>
    </div>
  </section>
  <section style="padding-top:34px;">
    <div class="wrap">${panelsHTML}</div>
  </section>`;
}

function panelOverview(c) {
  return `
  <div style="margin-bottom:32px">${priceChartSVG(c.t, c.fv, c.price)}</div>
  <div class="two-col">
    <div class="prose">
      <h4>Company Overview</h4>
      <p>${c.desc}</p>
      <h4>Revenue Mix</h4>
      ${segBarHTML(c.segs)}
      <h4>Key People &amp; Facts</h4>
      <ul class="bullets cat">
        <li>Chief Executive: <strong style="color:var(--text)">${c.ceo}</strong></li>
        <li>Headquarters: ${c.hq}</li>
        <li>Founded: ${c.founded}</li>
        <li>Primary listing: ${c.exch}</li>
      </ul>
    </div>
    <div>
      <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
        <div class="stat-cell"><div class="label">Market Cap</div><div class="value">${FMT.usdB(c.mcap)}</div></div>
        <div class="stat-cell"><div class="label">Enterprise Value</div><div class="value">${FMT.usdB(c.ev_now)}</div></div>
        <div class="stat-cell"><div class="label">TTM Revenue</div><div class="value">${FMT.usdB(c.rev)}</div></div>
        <div class="stat-cell"><div class="label">TTM Free Cash Flow</div><div class="value">${FMT.usdB(c.ttm_fcf)}</div></div>
        <div class="stat-cell"><div class="label">FCF Yield</div><div class="value">${FMT.pctPlain(c.fcf_yield)}</div></div>
        <div class="stat-cell"><div class="label">Net ${c.netdebt>=0?'Debt':'Cash'}</div><div class="value">${FMT.usdB(Math.abs(c.netdebt))}</div></div>
        <div class="stat-cell"><div class="label">Shares Out.</div><div class="value">${FMT.num(c.shares,2)}B</div></div>
        <div class="stat-cell"><div class="label">EV / Sales</div><div class="value">${FMT.x(c.ev_sales)}</div></div>
      </div>
    </div>
  </div>`;
}

function panelModel(c) {
  const rows = c.model.map((r, i) => `
    ${i === 5 ? `<tr class="stage-divider"><td colspan="6" style="text-align:center;color:var(--text-dim);font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Fade to terminal growth — Years 6–10</td></tr>` : ''}
    <tr class="${r.stage === 2 ? 'stage2' : ''}">
      <td>Year ${r.y}</td>
      <td>${FMT.usdB(r.rev)}</td>
      <td>${FMT.pct(r.growth)}</td>
      <td>${FMT.pctPlain(r.margin)}</td>
      <td>${FMT.usdB(r.fcf)}</td>
      <td>${FMT.usdB(r.pv)}</td>
    </tr>`).join('');
  return `
  <div class="two-col">
    <div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:12px;">Revenue &amp; Free Cash Flow Projection</h4>
      ${sparklineSVG(c.model, 'rev', 'var(--lilac)')}
      <div class="table-wrap" style="margin-top:18px;">
        <table class="ff-table model-table">
          <thead><tr><th>Period</th><th>Revenue</th><th>Growth</th><th>FCF Margin</th><th>Free Cash Flow</th><th>PV of FCF</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:14px;">Years 1–5 use our explicit growth and margin assumptions for ${c.n}. Years 6–10 fade growth in a straight line toward the ${FMT.pctPlain(c.tg)} terminal rate — this is standard analyst practice and avoids the common mistake of jumping straight from a high growth rate to a low perpetual one.</p>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px;">
        <div class="label" style="font-size:10.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:14px;">Model Assumptions</div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">Discount rate (WACC)</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.pctPlain(c.wacc)}</span></div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">Terminal growth rate</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.pctPlain(c.tg)}</span></div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">5-yr revenue CAGR</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.pct(c.cagr5)}</span></div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">Yr-1 FCF margin</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.pctPlain(c.m0)}</span></div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">Yr-5 FCF margin target</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.pctPlain(c.m1)}</span></div>
        <div class="score-row" style="grid-template-columns:1fr auto;"><span class="label">Implied Year-5 revenue</span><span class="n" style="font-size:14px;color:var(--text)">${FMT.usdB(c.rev5)}</span></div>
      </div>
      <p style="font-size:12px;color:var(--text-dim);">The discount rate approximates ${c.n}'s weighted average cost of capital — higher for smaller, riskier, or more cyclical businesses, lower for stable cash generators. It is the single most sensitive input in any DCF; see the sensitivity grid on the DCF tab.</p>
    </div>
  </div>`;
}

function panelDCF(c) {
  return `
  <div class="two-col">
    <div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Discounted Cash Flow Build-Up</h4>
      <div class="card">${dcfWaterfallHTML(c.dcf, c.shares)}</div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin:28px 0 14px;">Sensitivity: Fair Value by WACC &amp; Terminal Growth</h4>
      <div class="table-wrap" style="padding:18px;">${sensitivityGridHTML(c.grid, c.price)}</div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:12px;">Green cells sit above the current share price of ${FMT.usd(c.price)}; red cells sit below it. Small changes to either input move the fair value a lot — that sensitivity is the honest reason no DCF should be read as a precise number.</p>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px;">
        <div class="label" style="font-size:10.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:16px;">Target Price</div>
        <div style="font-family:var(--font-mono);font-size:38px;color:var(--gold-soft);line-height:1;">${fvStr(c.fv)}</div>
        <div style="margin-top:10px;"><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span> <span class="mono ${upClass(c.upside)}" style="margin-left:10px;font-size:13px;">${FMT.pct(c.upside)} vs current price</span></div>
      </div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:14px;">Bear / Base / Bull Range</h4>
      <div class="card">
        ${(c.fv_bear <= 0 && c.fv <= 0 && c.fv_bull <= 0)
          ? `<p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Every scenario here — bear, base, and even bull — comes out at or below zero, so a visual range bar against the ${FMT.usd(c.price)} current price would just be three overlapping points miles from the mark. That's the finding: on a conventional cash-flow basis, we can't construct a scenario where the operating business justifies the current price.</p>`
          : rangeBarHTML(c.fv_bear, c.fv, c.fv_bull, c.price)}
        <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:4px;">
          <div class="stat-cell" style="padding:14px;"><div class="label">Bear</div><div class="value" style="font-size:16px;">${fvStr(c.fv_bear)}</div><div class="sub ${upClass(c.up_bear)}">${FMT.pct(c.up_bear)}</div></div>
          <div class="stat-cell" style="padding:14px;"><div class="label">Base</div><div class="value" style="font-size:16px;color:var(--gold-soft);">${fvStr(c.fv)}</div><div class="sub ${upClass(c.upside)}">${FMT.pct(c.upside)}</div></div>
          <div class="stat-cell" style="padding:14px;"><div class="label">Bull</div><div class="value" style="font-size:16px;">${fvStr(c.fv_bull)}</div><div class="sub ${upClass(c.up_bull)}">${FMT.pct(c.up_bull)}</div></div>
        </div>
      </div>
    </div>
  </div>`;
}

function panelComps(c) {
  const s = sectorMeta(c.sec);
  const peers = c.peers.map(t => byT(t)).filter(Boolean);
  const rows = [c, ...peers].map(p => `
    <tr ${p.t !== c.t ? `data-route="company" data-ticker="${p.t}"` : ''} style="${p.t === c.t ? 'background:var(--surface-2)' : ''}">
      <td class="tk">${p.t}${p.t === c.t ? ' <span class="tag tag-lilac" style="margin-left:6px;">this page</span>' : ''}</td>
      <td>${p.n}</td>
      <td class="num">${FMT.usd(p.price)}</td>
      <td class="num">${FMT.x(p.ev_sales)}</td>
      <td class="num">${p.ev_fcf>0 && p.ev_fcf<999 ? FMT.x(p.ev_fcf) : '—'}</td>
      <td class="num ${p.prem_sales>=0?'upside-neg':'upside-pos'}">${FMT.pct(p.prem_sales)}</td>
    </tr>`).join('');
  return `
  <div class="prose">
    <h4>Comparable Companies — ${s.n}</h4>
    <p>How ${c.n} trades against its closest sector peers, using enterprise value multiples of sales and free cash flow. The premium/discount column compares each company's EV/Sales to the ${s.n} sector median of ${s.med_ev_sales}x.</p>
    ${s.note ? `<div class="comp-note">${s.note}</div>` : ''}
    <div class="table-wrap">
      <table class="ff-table">
        <thead><tr><th>Ticker</th><th>Company</th><th class="num">Price</th><th class="num">EV/Sales</th><th class="num">EV/FCF</th><th class="num">Prem. to Sector Median</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

function panelThesis(c) {
  return `
  <div class="two-col">
    <div class="prose">
      <h4>Investment Thesis</h4>
      <ul class="bullets bull">${c.bull.map(b => `<li>${b}</li>`).join('')}</ul>
      <h4>Key Risks</h4>
      <ul class="bullets risk">${c.risks.map(r => `<li>${r}</li>`).join('')}</ul>
      <h4>Street View</h4>
      <p>${c.street}</p>
      <h4>Catalysts to Watch</h4>
      <ul class="bullets cat">${c.cat.split(/,\s*/).map(x => `<li>${x.replace(/\.$/,'')}</li>`).join('')}</ul>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px;">
        <div class="label" style="font-size:10.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:16px;">FreeFlow Score</div>
        ${scoreRowsHTML(c.scores)}
      </div>
      <div class="card">
        <div class="label" style="font-size:10.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px;">Rating &amp; Target</div>
        <span class="rating-pill ${ratingClass(c.rating)}" style="font-size:14px;padding:8px 16px;">${c.rating}</span>
        <div style="margin-top:14px;font-family:var(--font-mono);font-size:26px;color:var(--gold-soft)">${fvStr(c.fv)}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">12-month DCF fair value · ${FMT.pct(c.upside)} vs. ${FMT.usd(c.price)} current</div>
      </div>
      <p style="font-size:11px;color:var(--text-dim);margin-top:16px;">This page is educational research produced for FreeFlow Finance and is not investment advice. Ratings are generated mechanically from DCF upside, not analyst discretion — see the Methodology page for the exact thresholds.</p>
    </div>
  </div>`;
}

/* ============================== ABOUT ================================== */
function viewAbout() {
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'About' })}
      <div class="about-hero">
        <svg class="avatar" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="avgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#422a7a"/><stop offset="100%" stop-color="#0d0c16"/>
          </linearGradient></defs>
          <rect width="200" height="200" rx="28" fill="url(#avgrad)"/>
          <circle cx="100" cy="100" r="72" fill="none" stroke="#b9a3f5" stroke-width="1" opacity=".5"/>
          <text x="100" y="122" font-family="Newsreader, serif" font-size="72" fill="#f1eef8" text-anchor="middle">GG</text>
        </svg>
        <div>
          <div class="eyebrow">About the Analyst</div>
          <h1 style="font-size:36px;">Gabriel Giard</h1>
          <p style="max-width:520px;font-size:15px;">Incoming high school senior, and the person behind every model in this library. FreeFlow Finance started because a couple of stocks I was given for Christmas in 2022 turned into a genuine obsession with figuring out what companies are actually worth.</p>
          <div class="social-row">
            <a class="social-btn" href="https://www.linkedin.com/in/gabriel-giard-95694a406" target="_blank" rel="noopener">${ICN.linkedin} Connect on LinkedIn</a>
            <a class="social-btn" href="https://www.instagram.com/gab.giard" target="_blank" rel="noopener">${ICN.instagram} @gab.giard</a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section style="padding-top:10px;">
    <div class="wrap">
      <div class="two-col">
        <div class="prose">
          <h4>The Story</h4>
          <p>It started at Christmas in 2022, with a couple of stocks unwrapped without much fanfare. Most people would have let them sit in a brokerage account. Instead they turned into the question that built this entire site: what makes a company actually worth what the market says it's worth?</p>
          <p>Since then I've taken every finance, economics and sociology class my high school offers, and gone looking well beyond the classroom — including Yale's Financial Markets course on Coursera, taught by Nobel laureate Robert Shiller, which is where a lot of the thinking behind the discounted cash flow model on this site was sharpened.</p>
          <p>FreeFlow Finance is the result: a self-built equity research shop covering 100 companies, using the same rigor I'd want to apply if I were a junior analyst at a bank, explained clearly enough that a friend with zero finance background could open any page and actually follow it.</p>
          <h4>Why "FreeFlow"</h4>
          <p>Free cash flow is the number at the center of almost every serious valuation — what's left over after a business pays for everything it needs to keep running and growing. The name is a small nod to that idea, and to the goal of making financial analysis flow more freely to anyone curious enough to look.</p>
        </div>
        <div>
          <div class="timeline">
            <div class="tl-item"><h4>The spark</h4><p>Given a couple of stocks as a Christmas gift in 2022, and started asking why they were priced the way they were.</p></div>
            <div class="tl-item"><h4>The classroom</h4><p>Took finance, economics and sociology courses in high school to build a foundation across markets and human behavior.</p></div>
            <div class="tl-item"><h4>Yale Financial Markets</h4><p>Completed the online course taught by Nobel Prize–winning economist Robert Shiller.</p></div>
            <div class="tl-item"><h4>FreeFlow Finance</h4><p>Built a 100-company DCF library to apply everything learned, one ticker at a time.</p></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================== METHODOLOGY ============================ */
function viewMethodology() {
  const steps = [
    ['1', 'Project revenue and free cash flow, five years out', 'For each company we set a five-year revenue growth path and a free cash flow margin that glides from where it is today toward a realistic year-5 target. Free cash flow is the cash a business generates after paying for operations and reinvesting in itself — the number that actually belongs to shareholders.'],
    ['2', 'Fade growth toward a terminal rate, five more years', 'Jumping straight from a high growth rate to a low permanent one is the most common shortcut in a bad DCF. We add a second five-year stage where growth glides down in a straight line to the terminal rate, so the model does not overstate value by assuming a sudden slowdown.'],
    ['3', 'Discount every year of cash flow back to today', 'A dollar of cash flow five years from now is worth less than a dollar today — partly for inflation, mostly because the future is uncertain. We discount each year\'s free cash flow using the company\'s weighted average cost of capital (WACC), and use the mid-year convention because businesses generate cash all year, not in a lump on December 31st.'],
    ['4', 'Add a terminal value for everything after year 10', 'No company can be forecast forever, so after year 10 we assume cash flow grows at a modest, permanent rate (the "terminal growth rate," typically close to long-run GDP growth) and capitalize it into a single terminal value using the Gordon Growth formula.'],
    ['5', 'Subtract net debt, divide by shares outstanding', 'Enterprise value belongs to both lenders and shareholders. We subtract net debt (or add back net cash) to isolate the equity value, then divide by diluted shares outstanding to get a fair value per share we can compare to the market price.'],
    ['6', 'Stress-test it — and rate it mechanically', 'We rebuild the entire model with more optimistic (bull) and more pessimistic (bear) assumptions, and generate a 5×5 grid showing fair value across a range of discount rates and terminal growth rates. The rating itself is not a judgment call: it is assigned purely from the upside or downside the base-case fair value implies versus the current price.'],
  ];
  const stepsHTML = steps.map(([n, t, p]) => `
    <div class="method-step"><div class="method-num">${n}</div><div><h3>${t}</h3><p>${p}</p></div></div>`).join('');

  const ratingRows = [
    ['Strong Buy', '+30% or more', 'var(--green)'],
    ['Buy', '+12% to +30%', 'var(--green)'],
    ['Hold', '-12% to +12%', 'var(--amber)'],
    ['Reduce', '-30% to -12%', 'var(--red)'],
    ['Sell', 'below -30%', 'var(--red)'],
  ].map(([r, range]) => `
    <tr><td><span class="rating-pill ${ratingClass(r)}">${r}</span></td><td class="num mono">${range}</td></tr>`).join('');

  const faqs = [
    ['What is a discounted cash flow (DCF), in plain English?', 'It\'s a way of estimating what a company is worth today by adding up all the cash it\'s expected to generate in the future, and discounting each future dollar back to a present-day value — because a dollar next year is worth less than a dollar right now.'],
    ['What is WACC?', 'The Weighted Average Cost of Capital: roughly, the return a company needs to generate to satisfy both its lenders and its shareholders. It\'s the discount rate we use to bring future cash flow back to today\'s value. Riskier or smaller companies get a higher WACC; stable, large companies get a lower one.'],
    ['Why does the "terminal value" matter so much?', 'For most companies here, more than 70% of the calculated value comes from the terminal value — the estimate of everything that happens after year 10. That is completely normal in a DCF, but it also means the model rests heavily on a single assumption (the terminal growth rate), which is exactly why we show a sensitivity grid on every company page.'],
    ['Why do banks and payment networks get modeled differently?', 'A standard free cash flow DCF assumes debt is financing. For a bank, deposits and lending are the actual business, so a conventional DCF breaks. We use total net revenue and a distributable net income margin instead — a simplification we flag directly on the Financials sector page and every bank\'s Comparables tab.'],
    ['Are the ratings real investment advice?', 'No. FreeFlow Finance is an educational project built by a high school student. The ratings are generated mechanically from one model\'s output, not from proprietary research, management access, or professional judgment a licensed analyst would apply. Treat every page here as a way to learn how valuation works, not as a signal to trade on.'],
    ['Where does the company and market data come from?', 'Company financials, share counts, and prices are sourced from public filings and financial data providers as of the date noted on the homepage; figures for early-stage or recently listed companies (like the frontier sector) can be especially rough given limited history. Every projection beyond that is our own assumption, built the same way for every company.'],
    ['How carefully is the company information checked?', 'Share prices update automatically. The written material — leadership, history, segments, analyst views — is checked by hand, and priority goes to the claims most likely to be wrong or most damaging if they were: named analysts with specific price targets, recent corporate events, and current CEOs, since leadership changes and a written profile can quietly go stale. That is triage, not a guarantee. If you spot something out of date, it probably is, and I would rather hear about it than not.'],
  ];
  const faqHTML = faqs.map(([q, a], i) => `
    <div class="faq-item" data-faq="${i}">
      <div class="faq-q">${q}<span class="faq-plus">+</span></div>
      <div class="faq-a">${a}</div>
    </div>`).join('');

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Methodology' })}
      <div class="eyebrow">Methodology</div>
      <h1 style="font-size:36px;max-width:680px;">How every fair value on this site gets built.</h1>
      <p style="max-width:600px;font-size:15px;">The same six-step process, applied identically whether the company is a 150-year-old oil major or a rocket company that IPO'd five weeks ago. Consistency is the entire point — it's what makes 100 companies actually comparable.</p>
    </div>
  </section>
  <section style="padding-top:10px;">
    <div class="wrap">
      <div class="two-col">
        <div>${stepsHTML}</div>
        <div>
          <div class="card" style="margin-bottom:20px;">
            <div class="label" style="font-size:10.5px;text-transform:uppercase;color:var(--text-dim);margin-bottom:14px;">Rating Scale</div>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tbody>${ratingRows}</tbody>
            </table>
            <p style="font-size:11px;color:var(--text-dim);margin-top:14px;margin-bottom:0;">Thresholds are fixed and mechanical — applied identically to every company, every sector.</p>
          </div>
          <div class="formula">FV = Σ [FCFₜ ÷ (1+WACC)^(t-0.5)] + [TV ÷ (1+WACC)^(n-0.5)]</div>
          <p style="font-size:12px;color:var(--text-dim);">Where TV = FCF₁₀ × (1 + g) ÷ (WACC − g), and g is the terminal growth rate.</p>
        </div>
      </div>
      <div style="margin-top:50px;">
        <h2 style="font-size:22px;margin-bottom:20px;">Frequently asked questions</h2>
        <div class="faq-list">${faqHTML}</div>
      </div>
    </div>
  </section>`;
}

/* ============================== 404 ===================================== */
function view404() {
  return `<section><div class="wrap"><div class="empty-state">
    <h2 style="color:var(--text);">Page not found</h2>
    <p>That ticker or section doesn't exist in the FreeFlow Finance library.</p>
    <button class="btn btn-violet" data-route="home" style="margin-top:16px;">Back to home</button>
  </div></div></section>`;
}

/* ============================== SCREENER ==============================
   Filter the whole 100-company universe on the metrics the model already
   computes. Everything is client-side over FF_DATA — no server, no lag. */

const SCREEN = {
  sectors: new Set(),
  ratings: new Set(),
  upsideMin: null,
  mcapMin: null,
  evsMax: null,
  fcfyMin: null,
  netCashOnly: false,
  sort: { col: 'upside', dir: -1 },
};

function screenerMatches(c) {
  if (SCREEN.sectors.size && !SCREEN.sectors.has(c.sec)) return false;
  if (SCREEN.ratings.size && !SCREEN.ratings.has(c.rating)) return false;
  if (SCREEN.upsideMin !== null && c.upside * 100 < SCREEN.upsideMin) return false;
  if (SCREEN.mcapMin !== null && c.mcap < SCREEN.mcapMin) return false;
  if (SCREEN.evsMax !== null && c.ev_sales > SCREEN.evsMax) return false;
  if (SCREEN.fcfyMin !== null && c.fcf_yield * 100 < SCREEN.fcfyMin) return false;
  if (SCREEN.netCashOnly && c.netdebt >= 0) return false;
  return true;
}

function screenerResults() {
  const rows = FF_DATA.companies.filter(screenerMatches);
  const k = SCREEN.sort.col, dir = SCREEN.sort.dir;
  rows.sort((a, b) => {
    const av = a[k], bv = b[k];
    if (typeof av === 'string') return av.localeCompare(bv) * dir;
    return ((av ?? -Infinity) > (bv ?? -Infinity) ? 1 : -1) * dir;
  });
  return rows;
}

function screenerTableHTML() {
  const rows = screenerResults();
  if (!rows.length) {
    return `<div class="empty-state">
      <h3 style="color:var(--text);font-size:18px;">No companies match those filters</h3>
      <p>Try loosening one — the whole universe is only 100 names.</p>
    </div>`;
  }
  const cols = [
    ['t', 'Ticker', ''], ['n', 'Company', ''], ['sec', 'Sector', ''],
    ['price', 'Price', 'num'], ['fv', 'Fair Value', 'num'], ['upside', 'Upside', 'num'],
    ['mcap', 'Mkt Cap', 'num'], ['ev_sales', 'EV/Sales', 'num'],
    ['fcf_yield', 'FCF Yield', 'num'], ['rule40', 'Rule of 40', 'num'],
  ];
  const head = cols.map(([k, label, cls]) =>
    `<th class="${cls} ${SCREEN.sort.col === k ? 'sorted' : ''}" data-screen-sort="${k}">${label} ${SCREEN.sort.col === k ? (SCREEN.sort.dir === 1 ? '↑' : '↓') : ''}</th>`
  ).join('');
  const body = rows.map(c => `
    <tr data-route="company" data-ticker="${c.t}">
      <td class="tk">${c.t}</td>
      <td>${c.n}</td>
      <td style="color:var(--text-dim);font-size:12px">${fmtSector(c.sec)}</td>
      <td class="num">${FMT.usd(c.price)}</td>
      <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      <td class="num ${upClass(c.upside)}">${FMT.pct(c.upside)}</td>
      <td class="num">${FMT.usdB(c.mcap)}</td>
      <td class="num">${FMT.x(c.ev_sales)}</td>
      <td class="num">${FMT.pctPlain(c.fcf_yield)}</td>
      <td class="num">${c.rule40.toFixed(0)}</td>
    </tr>`).join('');
  return `<div class="table-wrap"><table class="ff-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function viewScreener() {
  const sectorPills = FF_DATA.sectors.map(s =>
    `<span class="filter-pill ${SCREEN.sectors.has(s.k) ? 'active' : ''}" data-screen-sector="${s.k}">${s.n} <span style="opacity:.6">${s.count}</span></span>`).join('');
  const ratingPills = ['Strong Buy', 'Buy', 'Hold', 'Reduce', 'Sell'].map(r =>
    `<span class="filter-pill ${SCREEN.ratings.has(r) ? 'active' : ''}" data-screen-rating="${r}">${r}</span>`).join('');

  const num = (id, label, val, ph, hint) => `
    <div class="scr-field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="number" class="scr-input" placeholder="${ph}" value="${val ?? ''}" data-screen-num="${id}">
      <span class="scr-hint">${hint}</span>
    </div>`;

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Screener' })}
      <div class="eyebrow">Stock Screener</div>
      <h1 style="font-size:32px;max-width:680px;">Filter all 100 companies on the model's own output.</h1>
      <p style="max-width:600px;font-size:14.5px;">Every number here comes from the same DCF, so the comparisons hold. Combine filters to find, say, every net-cash company trading below 5x sales with upside to fair value.</p>
    </div>
  </section>
  <section style="padding-top:8px;">
    <div class="wrap">
      <div class="card" style="margin-bottom:22px;">
        <div class="scr-label">Sector <span class="scr-sub">click to include; none selected means all</span></div>
        <div class="pill-row" style="margin-bottom:20px;">${sectorPills}</div>
        <div class="scr-label">Rating</div>
        <div class="pill-row" style="margin-bottom:20px;">${ratingPills}</div>
        <div class="scr-grid">
          ${num('upsideMin', 'Min upside %', SCREEN.upsideMin, 'e.g. 15', 'vs our fair value')}
          ${num('mcapMin', 'Min market cap ($B)', SCREEN.mcapMin, 'e.g. 500', 'in billions')}
          ${num('evsMax', 'Max EV / Sales', SCREEN.evsMax, 'e.g. 8', 'lower is cheaper')}
          ${num('fcfyMin', 'Min FCF yield %', SCREEN.fcfyMin, 'e.g. 3', 'cash return on price')}
        </div>
        <div style="display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap;">
          <span class="filter-pill ${SCREEN.netCashOnly ? 'active' : ''}" data-screen-toggle="netCashOnly">Net cash only</span>
          <button class="btn btn-ghost" data-screen-reset style="padding:8px 16px;font-size:12.5px;">Reset all filters</button>
          <span id="screen-count" style="font-size:12.5px;color:var(--text-dim);margin-left:auto;font-family:var(--font-mono);"></span>
        </div>
      </div>
      <div id="screen-results">${screenerTableHTML()}</div>
    </div>
  </section>`;
}

/* ============================== PORTFOLIO ==============================
   Positions live in the visitor's own browser (localStorage). Nothing is
   sent anywhere — there is no server to send it to. The distinctive bit is
   the second table: the portfolio valued against our own DCF fair values
   rather than just against cost. */

const PF = { positions: [], loaded: false };
const PF_KEY = 'freeflow.portfolio.v1';

function pfLoad() {
  if (PF.loaded) return;
  PF.loaded = true;
  try {
    const raw = localStorage.getItem(PF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        PF.positions = parsed.filter(p =>
          p && typeof p.t === 'string' && byT(p.t) &&
          typeof p.sh === 'number' && p.sh > 0 &&
          typeof p.cost === 'number' && p.cost >= 0);
      }
    }
  } catch (e) {
    // Private browsing, disabled storage, or corrupted JSON. The portfolio
    // still works for this session; it just won't persist.
    console.info('Portfolio storage unavailable — running in-session only.');
  }
}

function pfSave() {
  try {
    localStorage.setItem(PF_KEY, JSON.stringify(PF.positions));
    return true;
  } catch (e) {
    return false;
  }
}

function pfAdd(ticker, shares, cost) {
  const c = byT(ticker);
  if (!c || !(shares > 0) || !(cost >= 0)) return false;
  const existing = PF.positions.find(p => p.t === ticker);
  if (existing) {
    // average the cost basis across the combined position
    const totalSh = existing.sh + shares;
    existing.cost = (existing.cost * existing.sh + cost * shares) / totalSh;
    existing.sh = totalSh;
  } else {
    PF.positions.push({ t: ticker, sh: shares, cost });
  }
  pfSave();
  return true;
}

function pfRemove(ticker) {
  PF.positions = PF.positions.filter(p => p.t !== ticker);
  pfSave();
}

function pfStats() {
  let value = 0, cost = 0, fvValue = 0;
  const bySector = {};
  for (const p of PF.positions) {
    const c = byT(p.t);
    if (!c) continue;
    const v = c.price * p.sh;
    value += v;
    cost += p.cost * p.sh;
    fvValue += (c.fv > 0 ? c.fv : c.price) * p.sh;
    bySector[c.sec] = (bySector[c.sec] || 0) + v;
  }
  return { value, cost, fvValue, bySector };
}

function viewPortfolio() {
  pfLoad();
  const st = pfStats();
  const gain = st.value - st.cost;
  const gainPct = st.cost > 0 ? gain / st.cost : 0;
  const modelUpside = st.value > 0 ? st.fvValue / st.value - 1 : 0;

  const rows = PF.positions.map(p => {
    const c = byT(p.t);
    const v = c.price * p.sh;
    const cst = p.cost * p.sh;
    const g = v - cst;
    const gp = cst > 0 ? g / cst : 0;
    const w = st.value > 0 ? v / st.value : 0;
    return `
      <tr>
        <td class="tk" data-route="company" data-ticker="${c.t}" style="cursor:pointer">${c.t}</td>
        <td data-route="company" data-ticker="${c.t}" style="cursor:pointer">${c.n}
          <div class="row-name">${fmtSector(c.sec)}</div></td>
        <td class="num">${FMT.num(p.sh, 4)}</td>
        <td class="num">${FMT.usd(p.cost)}</td>
        <td class="num">${FMT.usd(c.price)}</td>
        <td class="num">${FMT.usd(v, 0)}</td>
        <td class="num ${upClass(g)}">${FMT.usd(g, 0)}<div style="font-size:11px;opacity:.8">${FMT.pct(gp)}</div></td>
        <td class="num">${FMT.pctPlain(w)}</td>
        <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
        <td class="num ${upClass(c.upside)}">${FMT.pct(c.upside)}</td>
        <td><span class="pf-remove" data-pf-remove="${c.t}" title="Remove position">×</span></td>
      </tr>`;
  }).join('');

  const alloc = Object.entries(st.bySector)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v], i) => {
      const pct = st.value > 0 ? v / st.value * 100 : 0;
      return { name: fmtSector(k), pct, color: SEG_COLORS[i % SEG_COLORS.length] };
    });
  const allocBar = alloc.map(a =>
    `<div style="width:${a.pct.toFixed(1)}%;background:${a.color}">${a.pct > 8 ? a.pct.toFixed(0) + '%' : ''}</div>`).join('');
  const allocLegend = alloc.map(a =>
    `<div class="li"><span class="sw" style="background:${a.color}"></span>${a.name} — ${a.pct.toFixed(1)}%</div>`).join('');

  const options = FF_DATA.companies
    .slice().sort((a, b) => a.t.localeCompare(b.t))
    .map(c => `<option value="${c.t}">${c.t} — ${c.n}</option>`).join('');

  const empty = PF.positions.length === 0;

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Portfolio' })}
      <div class="eyebrow">Portfolio Tracker</div>
      <h1 style="font-size:32px;max-width:700px;">Your holdings, measured against your own fair values.</h1>
      <p style="max-width:620px;font-size:14.5px;">Add what you own and see it two ways: the usual profit-and-loss against what you paid, and — more interestingly — what the DCF model thinks the whole portfolio is worth.</p>
      <div class="comp-note" style="margin-top:18px;">Positions are saved in your own browser and never leave this device. There's no account and no server. Clearing your browser data will clear them, so treat this as a scratchpad rather than a record.</div>
    </div>
  </section>
  <section style="padding-top:6px;">
    <div class="wrap">
      <div class="card" style="margin-bottom:22px;">
        <div class="scr-label">Add a position</div>
        <div class="pf-add">
          <div class="scr-field" style="flex:2;min-width:220px;">
            <label for="pf-ticker">Company</label>
            <select id="pf-ticker" class="scr-input">${options}</select>
          </div>
          <div class="scr-field">
            <label for="pf-shares">Shares</label>
            <input id="pf-shares" type="number" class="scr-input" placeholder="e.g. 10" min="0" step="any">
          </div>
          <div class="scr-field">
            <label for="pf-cost">Cost per share ($)</label>
            <input id="pf-cost" type="number" class="scr-input" placeholder="e.g. 180.50" min="0" step="any">
          </div>
          <button class="btn btn-violet" id="pf-add-btn" style="align-self:flex-end;">Add holding</button>
        </div>
        <div id="pf-msg" style="font-size:12.5px;margin-top:10px;min-height:18px;"></div>
      </div>

      ${empty ? `
        <div class="empty-state">
          <h3 style="color:var(--text);font-size:18px;">No positions yet</h3>
          <p>Add a holding above and this fills with your live profit-and-loss,<br>sector weights, and the portfolio's upside to our fair values.</p>
        </div>` : `
        <div class="stat-grid" style="margin-bottom:22px;">
          <div class="stat-cell"><div class="label">Market Value</div><div class="value">${FMT.usd(st.value, 0)}</div></div>
          <div class="stat-cell"><div class="label">Total Cost</div><div class="value">${FMT.usd(st.cost, 0)}</div></div>
          <div class="stat-cell"><div class="label">Unrealised P&amp;L</div>
            <div class="value ${gain >= 0 ? '' : ''}" style="color:${gain >= 0 ? 'var(--green)' : 'var(--red)'}">${FMT.usd(gain, 0)}</div>
            <div class="sub" style="color:${gain >= 0 ? 'var(--green)' : 'var(--red)'}">${FMT.pct(gainPct)}</div></div>
          <div class="stat-cell"><div class="label">Positions</div><div class="value">${PF.positions.length}</div></div>
          <div class="stat-cell"><div class="label">Model Value</div>
            <div class="value gold">${FMT.usd(st.fvValue, 0)}</div>
            <div class="sub">at our fair values</div></div>
          <div class="stat-cell"><div class="label">Upside to Fair Value</div>
            <div class="value" style="color:${modelUpside >= 0 ? 'var(--green)' : 'var(--red)'}">${FMT.pct(modelUpside)}</div>
            <div class="sub">portfolio-weighted</div></div>
        </div>

        <div class="table-wrap" style="margin-bottom:26px;">
          <table class="ff-table">
            <thead><tr>
              <th>Ticker</th><th>Company</th><th class="num">Shares</th><th class="num">Cost</th>
              <th class="num">Price</th><th class="num">Value</th><th class="num">P&amp;L</th>
              <th class="num">Weight</th><th class="num">Fair Value</th><th class="num">Upside</th><th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="card">
          <div class="scr-label" style="margin-bottom:14px;">Sector allocation</div>
          <div class="seg-bar">${allocBar}</div>
          <div class="seg-legend">${allocLegend}</div>
        </div>`}
    </div>
  </section>`;
}

/* ======================= FINANCIAL ANALYSIS TAB =======================
   Deliberately NOT a fabricated three-statement model. We don't hold filed
   income statements or balance sheets for 100 companies, and inventing them
   on a valuation site would be worse than useless. What this does instead is
   analyse the figures we genuinely have — revenue, free cash flow, net
   debt/cash, share count — the way an analyst reads a company: margin
   quality, leverage, capital returns, and where each metric sits against
   its own sector. Every number here traces back to a model input or a
   published market price. */

function pctlBar(label, value, pctl, hint) {
  const p = Math.max(0, Math.min(100, pctl ?? 50));
  return `
    <div class="fin-metric">
      <div class="fin-metric-top">
        <span class="fin-metric-label">${label}</span>
        <span class="fin-metric-value">${value}</span>
      </div>
      <div class="fin-track"><div class="fin-fill" style="width:${p}%"></div>
        <div class="fin-marker" style="left:${p}%"></div></div>
      <div class="fin-metric-hint">${p}th percentile in sector · ${hint}</div>
    </div>`;
}

function panelFinancials(c) {
  const s = sectorMeta(c.sec);
  const isBank = c.sec === 'financials' && c.netdebt === 0;
  const y1 = c.model[0], y5 = c.model[4];
  const marginDelta = (c.m1 - c.m0) * 100;

  // Common-size revenue: each segment as a share of the total.
  const segRows = c.segs.map((sg, i) => `
    <tr>
      <td>${sg[0]}</td>
      <td class="num">${FMT.usdB(c.rev * sg[1] / 100)}</td>
      <td class="num">${sg[1]}%</td>
      <td style="width:34%">
        <div style="height:7px;background:var(--surface-3);border-radius:4px;overflow:hidden">
          <div style="width:${sg[1]}%;height:100%;background:${SEG_COLORS[i % SEG_COLORS.length]}"></div>
        </div>
      </td>
    </tr>`).join('');

  const leverage = c.nd_fcf === null ? '—'
    : c.netdebt < 0 ? `Net cash` : `${c.nd_fcf.toFixed(1)}x FCF`;
  const leverageNote = c.netdebt < 0
    ? `Holds ${FMT.usdB(Math.abs(c.netdebt))} more cash than debt — no solvency question here.`
    : c.nd_fcf === null ? 'Free cash flow is negative, so this ratio is not meaningful.'
    : c.nd_fcf > 5 ? `Would take about ${c.nd_fcf.toFixed(0)} years of current free cash flow to clear the debt. That's high, and it constrains what management can do next.`
    : `About ${c.nd_fcf.toFixed(1)} years of free cash flow would clear the debt — comfortable.`;

  return `
  <div class="comp-note" style="margin-bottom:26px;">
    This is an analysis of the figures behind the valuation — revenue, free cash flow, leverage and capital structure — not a reproduction of the company's filed income statement and balance sheet. Everything below traces to a model input or a market price, and each metric is ranked against the ${s.n} companies in this library.
  </div>

  <div class="two-col">
    <div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Earnings Quality &amp; Margins</h4>
      <div class="card" style="margin-bottom:20px;">
        ${pctlBar('Free cash flow margin', FMT.pctPlain(c.m0), c.pctl.m0,
          'share of revenue that becomes free cash')}
        ${pctlBar('Free cash flow yield', FMT.pctPlain(c.fcf_yield), c.pctl.fcf_yield,
          'cash generated per dollar of market cap')}
        ${pctlBar('Rule of 40', c.rule40.toFixed(0), c.pctl.rule40,
          'growth plus margin; above 40 is the usual bar')}
        <p style="font-size:11.5px;color:var(--text-dim);margin:14px 0 0;">
          ${marginDelta >= 0
            ? `Our model assumes the margin expands by about ${marginDelta.toFixed(1)} points by year five, from ${FMT.pctPlain(c.m0)} to ${FMT.pctPlain(c.m1)}. That expansion is an assumption, not a fact — if it doesn't happen, the fair value falls.`
            : `Our model assumes the margin compresses by about ${Math.abs(marginDelta).toFixed(1)} points by year five, from ${FMT.pctPlain(c.m0)} to ${FMT.pctPlain(c.m1)}.`}
          ${isBank ? ' For banks we treat net revenue as the top line and distributable net income as the margin, so these are not directly comparable to an industrial company.' : ''}
        </p>
      </div>

      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Revenue Composition</h4>
      <div class="table-wrap" style="margin-bottom:20px;">
        <table class="ff-table" style="font-size:13px;">
          <thead><tr><th>Segment</th><th class="num">Revenue</th><th class="num">Share</th><th></th></tr></thead>
          <tbody>${segRows}</tbody>
          <tfoot><tr style="border-top:1px solid var(--line)">
            <td style="padding:12px 16px;color:var(--text)">Total</td>
            <td class="num" style="padding:12px 16px;color:var(--text)">${FMT.usdB(c.rev)}</td>
            <td class="num" style="padding:12px 16px;color:var(--text)">100%</td><td></td>
          </tr></tfoot>
        </table>
      </div>

      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Valuation vs Sector</h4>
      <div class="card">
        ${pctlBar('EV / Sales', FMT.x(c.ev_sales), c.pctl.ev_sales,
          `sector median ${s.med_ev_sales}x`)}
        ${c.ev_fcf > 0 && c.ev_fcf < 999
          ? pctlBar('EV / Free Cash Flow', FMT.x(c.ev_fcf), c.pctl.ev_fcf, `sector median ${s.med_ev_fcf}x`)
          : ''}
        ${pctlBar('5-yr revenue CAGR', FMT.pct(c.cagr5), c.pctl.cagr5,
          'our forecast, years one to five')}
        <p style="font-size:11.5px;color:var(--text-dim);margin:14px 0 0;">
          ${c.prem_sales >= 0
            ? `Trades at a ${FMT.pctPlain(c.prem_sales)} premium to the ${s.n} median on sales. A premium is only a problem if the growth or margin doesn't justify it.`
            : `Trades at a ${FMT.pctPlain(Math.abs(c.prem_sales))} discount to the ${s.n} median on sales. Cheap relative to peers — the question is always why.`}
        </p>
      </div>
    </div>

    <div>
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Balance Sheet</h4>
      <div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px;">
        <div class="stat-cell"><div class="label">Net ${c.netdebt >= 0 ? 'Debt' : 'Cash'}</div>
          <div class="value" style="color:${c.netdebt >= 0 ? 'var(--text)' : 'var(--green)'}">${FMT.usdB(Math.abs(c.netdebt))}</div></div>
        <div class="stat-cell"><div class="label">Leverage</div><div class="value">${leverage}</div></div>
        <div class="stat-cell"><div class="label">Net Debt / EV</div><div class="value">${FMT.pctPlain(c.nd_ev)}</div></div>
        <div class="stat-cell"><div class="label">Shares Out.</div><div class="value">${FMT.num(c.shares, 2)}B</div></div>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:26px;">${leverageNote}</p>

      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Cash Flow Bridge</h4>
      <div class="card" style="margin-bottom:20px;">
        <div class="fin-row"><span>Trailing revenue</span><span class="mono">${FMT.usdB(c.rev)}</span></div>
        <div class="fin-row"><span>× Free cash flow margin</span><span class="mono">${FMT.pctPlain(c.m0)}</span></div>
        <div class="fin-row fin-row-total"><span>Trailing free cash flow</span><span class="mono">${FMT.usdB(c.ttm_fcf)}</span></div>
        <div class="fin-row" style="margin-top:12px"><span>Year-5 forecast revenue</span><span class="mono">${FMT.usdB(y5.rev)}</span></div>
        <div class="fin-row"><span>× Year-5 margin</span><span class="mono">${FMT.pctPlain(c.m1)}</span></div>
        <div class="fin-row fin-row-total"><span>Year-5 free cash flow</span><span class="mono">${FMT.usdB(y5.fcf)}</span></div>
        <div class="fin-row" style="margin-top:12px;color:var(--text-dim)">
          <span>Implied growth in cash flow</span>
          <span class="mono">${FMT.pct(c.ttm_fcf > 0 ? y5.fcf / c.ttm_fcf - 1 : 0)}</span></div>
      </div>

      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--lilac);margin-bottom:16px;">Where the Value Sits</h4>
      <div class="card">
        <div class="fin-row"><span>Next 10 years of cash flow</span><span class="mono">${(100 - c.tv_pct).toFixed(0)}%</span></div>
        <div class="fin-row"><span>Everything after year 10</span><span class="mono">${c.tv_pct.toFixed(0)}%</span></div>
        <div style="height:8px;background:var(--surface-3);border-radius:4px;overflow:hidden;margin:12px 0;display:flex">
          <div style="width:${100 - c.tv_pct}%;background:var(--violet-500)"></div>
          <div style="width:${c.tv_pct}%;background:var(--lilac)"></div>
        </div>
        <p style="font-size:11.5px;color:var(--text-dim);margin:0;">
          ${c.tv_pct > 75
            ? 'Most of the value depends on what happens beyond the forecast window, which makes this valuation especially sensitive to the terminal growth rate.'
            : c.tv_pct > 55
            ? 'A normal split for a mature, cash-generative company — the near term matters, but the long tail matters more.'
            : 'Unusually front-loaded: a large share of the value comes from cash flows we forecast explicitly, which makes this less dependent on distant assumptions.'}
        </p>
      </div>
    </div>
  </div>`;
}
