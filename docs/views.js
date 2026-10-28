/* FreeFlow Finance — view renderers. Each function returns an HTML string
   for the #app outlet. Company/sector pages carry their own light client
   state (active tab, table sort) via the STATE object below. */

const STATE = {
  sectorSort: {},          // { [sectorKey]: {col, dir} }
  sectorFilter: {},        // { [sectorKey]: rating|'all' }
  activeTab: {},           // { [ticker]: tabId }
};

function byT(t) { return FF_DATA.companies.find(c => c.t === t); }

/* ============================== VALUATION MODEL ========================= */
/* Two models: the DCF (the site's official one) and peer multiples. Every
   page reads c.fv, c.upside, c.rating and the bear/bull values, so switching
   swaps those fields on every company and redraws; the DCF's own numbers are
   kept in c._dcf so pages that are DCF by definition can still read them. */
const MODEL_KEY = 'freeflow.model';
const MODEL_FIELDS = ['fv', 'fv_bear', 'fv_bull', 'upside', 'up_bear', 'up_bull', 'rating'];
const MODEL = { cur: 'dcf' };
function modelName(m = MODEL.cur) { return m === 'mx' ? 'Multiples' : 'DCF'; }
function dcfOf(c) { return c._dcf || c; }
function applyModel(mode) {
  const want = mode === 'mx' && FF_DATA.companies.some(c => c.mx) ? 'mx' : 'dcf';
  FF_DATA.companies.forEach(c => {
    if (!c._dcf) { c._dcf = {}; MODEL_FIELDS.forEach(k => { c._dcf[k] = c[k]; }); }
    const src = want === 'mx' && c.mx ? c.mx : c._dcf;
    MODEL_FIELDS.forEach(k => { c[k] = src[k]; });
  });
  MODEL.cur = want;
  document.documentElement.dataset.model = want;
  document.querySelectorAll('button[data-model]:not(.mtog-sw)').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.model === want)));
  if (typeof syncModelControls === 'function') syncModelControls();
  try { localStorage.setItem(MODEL_KEY, want); } catch (e) { /* private mode: in-session only */ }
}
function savedModel() {
  try { return localStorage.getItem(MODEL_KEY) || 'dcf'; } catch (e) { return 'dcf'; }
}
function modelSwitchHTML(variant = 'sb') { return modelSliderHTML(variant); }   // interact.js
function sectorMeta(k) { return FF_DATA.sectors.find(s => s.k === k); }
function inSector(k) { return FF_DATA.companies.filter(c => c.sec === k); }
function fmtSector(k) { const s = sectorMeta(k); return s ? s.n : k; }

/* "close · Sep 30" next to a price, so a visit at 9am reads as yesterday's
   close rather than as a broken live quote. A company with no market price
   at all is labelled as an estimate. */
function priceDateLabel(c) {
  if (!c.pd) return 'estimate';
  const d = pcParseISO(c.pd);
  return d ? 'close · ' + pcFmtDate(d, false) : 'close';
}

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

/* ============================== HOMEPAGE ==============================
   Top to bottom, one idea per band:
     markets      the indices, oil, gold, the 10-year: what moved today
     hero         what this site is, beside a live company chart
     the library  how the ratings split, under whichever model is selected
     top ideas    most upside / most downside, one table with a switch
     sectors      every sector as a compact tile
     about        who built it and how the model works                    */

/* Keep in step with MARKET in fetch_history.py. */
const MARKETS = [
  { k: '^GSPC',   n: 'S&P 500',        u: 'pts', note: 'The 500 largest US companies, weighted by size.' },
  { k: '^IXIC',   n: 'Nasdaq',         u: 'pts', note: 'Every stock on the Nasdaq exchange; heavy in technology.' },
  { k: '^DJI',    n: 'Dow Jones',      u: 'pts', note: 'Thirty large US companies, weighted by share price.' },
  { k: '^VIX',    n: 'VIX',            u: 'pts', inv: true, note: 'The volatility the options market expects for the S&P 500 over the next 30 days. Higher means more fear.' },
  { k: '^TNX',    n: '10-yr Treasury', u: 'pct', note: 'The ten-year US Treasury yield. Every discount rate in this library starts from it, so when it moves, every fair value moves.' },
  { k: 'BZ=F',    n: 'Brent crude',    u: 'usd', note: 'The global oil benchmark, in dollars a barrel.' },
  { k: 'GC=F',    n: 'Gold',           u: 'usd', note: 'Gold futures, in dollars a troy ounce.' },
  { k: 'BTC-USD', n: 'Bitcoin',        u: 'usd', note: 'Bitcoin in dollars. It trades every day, so its last point can be a weekend.' },
];

function marketRows() {
  const ref = pcParseISO((FF_DATA.meta && FF_DATA.meta.price_date) || '');
  return MARKETS.map(m => {
    const s = typeof hasHistory === 'function' && hasHistory(m.k) ? pcSeries(m.k) : null;
    if (!s || s.closes.length < 2) return null;
    const n = s.closes.length, last = s.closes[n - 1], prev = s.closes[n - 2], when = s.dates[n - 1];
    // a series that stopped updating is hidden rather than shown as today's
    if (ref && (ref - when) / 86400000 > 6) return null;
    return Object.assign({}, m, { s, last, prev, when, chg: last / prev - 1, diff: last - prev });
  }).filter(Boolean);
}

function mktSpark(r) {
  const v = r.s.closes.slice(-23), w = 96, h = 26;
  const lo = Math.min(...v), hi = Math.max(...v), sp = (hi - lo) || 1;
  const pts = v.map((x, i) => `${(i / (v.length - 1) * w).toFixed(1)},${(h - 2 - (x - lo) / sp * (h - 4)).toFixed(1)}`);
  // same colour as the day's change beside it, so a tile never says two things
  const good = (r.chg >= 0) !== !!r.inv;
  return `<svg class="mkt-sp ${good ? 'up' : 'down'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="M${pts.join(' L')}"/></svg>`;
}

function marketStripHTML() {
  const rows = marketRows();
  if (!rows.length) return '';
  const asof = rows.find(r => r.k === '^GSPC') || rows[0];
  const tiles = rows.map(r => {
    const good = (r.chg >= 0) !== !!r.inv;
    const chg = r.u === 'pct' ? `${r.diff >= 0 ? '+' : '−'}${Math.abs(r.diff * 100).toFixed(Math.abs(r.diff * 100) < 10 ? 1 : 0)} bp` : `${r.chg >= 0 ? '+' : '−'}${Math.abs(r.chg * 100).toFixed(2)}%`;
    return `
      <button type="button" class="mkt-tile" data-mkt="${r.k}" aria-pressed="false" aria-label="${r.n}: ${pcFmtUnit(r.last, r.u)}, ${chg} on the day. Show the chart.">
        <span class="mkt-n">${r.n}</span>
        <span class="mkt-v">${pcFmtUnit(r.last, r.u)}</span>
        <span class="mkt-c ${good ? 'up' : 'down'}">${r.chg >= 0 ? '▲' : '▼'} ${chg}</span>
        ${mktSpark(r)}
      </button>`;
  }).join('');
  return `
  <section class="mkt-band" data-markets>
    <div class="wrap">
      <div class="mkt-head"><span class="mkt-k">Markets</span><span class="mkt-when">close · ${pcFmtDate(asof.when, false)} · tap any to chart it</span></div>
      <div class="mkt-row">${tiles}</div>
      <div class="mkt-panel" hidden></div>
    </div>
  </section>`;
}

function mountMarkets(root) {
  (root || document).querySelectorAll('[data-markets]').forEach(band => {
    if (band._mk) return; band._mk = true;
    const panel = band.querySelector('.mkt-panel');
    band.addEventListener('click', e => {
      const t = e.target.closest('[data-mkt]'), x = e.target.closest('.mkt-x');
      if (x || (t && t.getAttribute('aria-pressed') === 'true')) {
        band.querySelectorAll('[data-mkt]').forEach(b => b.setAttribute('aria-pressed', 'false'));
        panel.hidden = true; panel.innerHTML = '';
        return;
      }
      if (!t) return;
      const m = MARKETS.find(r => r.k === t.dataset.mkt);
      const s = pcSeries(m.k);
      band.querySelectorAll('[data-mkt]').forEach(b => b.setAttribute('aria-pressed', String(b === t)));
      panel.innerHTML = `
        <div class="mkt-ph"><div><b>${m.n}</b><span>${m.note}</span></div>
          <button type="button" class="mkt-x" aria-label="Close the chart">×</button></div>
        ${priceChartSVG(m.k, 0, s.closes[s.closes.length - 1], m.u)}`;
      panel.hidden = false;
      mountPriceCharts(panel);
    });
  });
}

const IDEA_TABS = [['up', 'Most upside'], ['down', 'Most downside'], ['big', 'Largest companies']];
function ideaRows(kind) {
  const all = FF_DATA.companies.filter(c => kind === 'big' || c.fv > 0);
  const list = kind === 'up' ? [...all].sort((a, b) => b.upside - a.upside)
    : kind === 'down' ? [...all].sort((a, b) => a.upside - b.upside)
    : [...all].sort((a, b) => b.mcap - a.mcap);
  return list.slice(0, 8).map((c, i) => `
    <tr data-route="company" data-ticker="${c.t}">
      <td class="idx hide-sm">${i + 1}</td>
      <td class="tk">${c.t}</td>
      <td>${c.n}<div class="row-name">${fmtSector(c.sec)}</div></td>
      <td class="num hide-sm">${FMT.usd(c.price)}</td>
      <td class="num hide-sm" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      ${upCellHTML(c)}
      <td class="hide-sm"><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span></td>
    </tr>`).join('');
}

function mountHomeIdeas(root) {
  (root || document).querySelectorAll('[data-ideas]').forEach(box => {
    if (box._id) return; box._id = true;
    box.querySelector('.pc-ranges').addEventListener('click', e => {
      const b = e.target.closest('[data-idea]');
      if (!b) return;
      box.querySelectorAll('[data-idea]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      STATE.homeIdeas = b.dataset.idea;
      const tb = box.querySelector('tbody');
      tb.innerHTML = ideaRows(b.dataset.idea);
      tb.classList.remove('fresh'); void tb.offsetWidth; tb.classList.add('fresh');
    });
  });
}

const RATING_ORDER = ['Strong Buy', 'Buy', 'Hold', 'Reduce', 'Sell'];
function sectorTileHTML(s) {
  const cs = inSector(s.k);
  const ups = cs.filter(c => c.fv > 0).map(c => c.upside).sort((a, b) => a - b);
  const med = ups.length ? (ups.length % 2 ? ups[(ups.length - 1) / 2] : (ups[ups.length / 2 - 1] + ups[ups.length / 2]) / 2) : null;
  const mix = RATING_ORDER.map(r => {
    const n = cs.filter(c => c.rating === r).length;
    return n ? `<i style="flex:${n};background:${ratingColor(r)}" title="${r}: ${n}"></i>` : '';
  }).join('');
  const w = med == null ? 0 : Math.min(1, Math.abs(med) / 0.4) * 50;
  return `
    <div class="st-tile" data-route="sector" data-key="${s.k}" tabindex="0" role="link" aria-label="${escapeHtml(s.n)}: ${s.count} companies">
      <div class="st-top"><span class="st-ico">${SECTOR_ICONS[s.k] || ''}</span><span class="st-n">${s.count}</span></div>
      <h3>${s.n}</h3>
      <div class="st-mix" aria-hidden="true">${mix}</div>
      <div class="st-row">
        <span class="st-k">Median upside</span>
        <span class="st-ub" aria-hidden="true"><i class="${med >= 0 ? 'pos' : 'neg'}" data-tw="st-${s.k}" style="${med >= 0 ? 'left:50%' : 'right:50%'};width:${w.toFixed(1)}%"></i></span>
        <span class="st-v ${med == null ? '' : upClass(med)}" data-num="st-${s.k}" data-val="${med}" data-fmt="pct">${med == null ? '—' : FMT.pct(med)}</span>
      </div>
    </div>`;
}

function viewHome() {
  const m = FF_DATA.meta;
  const cov = coverageStats();
  const all = FF_DATA.companies;
  const counts = {}; RATING_ORDER.forEach(r => counts[r] = 0);
  all.forEach(c => counts[c.rating]++);
  const total = all.length;
  const tab = STATE.homeIdeas || 'up';
  const modelWord = MODEL.cur === 'mx' ? 'peer multiples' : 'the DCF';

  const ratingSegs = RATING_ORDER.map(r => `
    <button type="button" class="rb-seg" data-screen-rating="${r}" style="flex:${counts[r] || 0.001};--c:${ratingColor(r)}"
      aria-label="${r}: ${counts[r]} companies. Open them in the screener.">
      ${counts[r] / total > 0.07 ? `<span>${counts[r]}</span>` : ''}</button>`).join('');
  const ratingKey = RATING_ORDER.map(r => `
    <button type="button" class="rb-key" data-screen-rating="${r}"><i style="background:${ratingColor(r)}"></i>${r}<b>${counts[r]}</b></button>`).join('');

  return `
  ${marketStripHTML()}

  <section class="hero hero-split home-hero">
    ${heroFlowSVG()}
    <div class="wrap">
      ${(m.price_lag ?? ((m.price_age_days ?? 0) > 3 ? 2 : 0)) >= 2 ? `
      <div class="comp-note" style="border-left-color:var(--red);margin-bottom:22px">
        <b>Prices are from the ${m.asof} close.</b> The daily update has missed
        ${m.price_lag ?? 'several'} market sessions since then &mdash; every
        valuation below uses those closing prices rather than the latest ones.
      </div>` : ''}
      <div class="hsplit">
        <div class="hero-inner">
          <div class="eyebrow">FreeFlow Finance · Independent Equity Research</div>
          <h1>Two models. ${cov.n} companies. Every fair value built the same way.</h1>
          <p class="lede">A discounted cash flow and a peer-multiples valuation for ${cov.n} of the world's largest and most-talked-about companies, each with its comparables, thesis and target price. One consistent method, so you can actually compare them.</p>
          <div class="hero-cta">
            <button class="btn btn-violet" data-route="screener">${ICN.arrow.replace('currentColor', '#fff')} Screen all ${cov.n}</button>
            <button class="btn btn-ghost" data-route="methodology">How the models work</button>
          </div>
          <div class="hero-kpis">
            <div><b>${cov.n}</b><span>companies</span></div>
            <div><b>$${cov.mcap}T</b><span>market value covered</span></div>
            <div data-kpi="median"><b class="${cov.medianUpside >= 0 ? 'upside-pos' : 'upside-neg'}" data-num="kpi-med" data-val="${cov.medianUpside}" data-fmt="pct">${FMT.pct(cov.medianUpside)}</b><span>median upside</span></div>
          </div>
        </div>
        ${heroFindHTML()}
      </div>
    </div>
  </section>

  <section class="home-band">
    <div class="wrap">
      <div class="hb-head">
        <div><div class="eyebrow">The library today</div><h2>How ${total} companies are rated</h2>
          <p class="sub">On the same five-point scale, from the upside under ${modelWord}. Click a rating to see those companies.</p></div>
        <div class="hb-model"><span>Rated with</span>${modelSliderHTML('hdr')}</div>
      </div>
      <div class="rb" role="group" aria-label="Ratings across the library">${ratingSegs}</div>
      <div class="rb-keys">${ratingKey}</div>
    </div>
  </section>

  <section class="home-band">
    <div class="wrap">
      <div class="hb-head">
        <div><div class="eyebrow">Ideas</div><h2>Where the model disagrees with the market</h2>
          <p class="sub">Ranked by the gap between the price and the fair value under ${modelWord}.</p></div>
        <span class="section-link" data-route="screener">Screen all ${cov.n} companies</span>
      </div>
      <div class="ideas" data-ideas>
        <div class="pc-ranges" role="group" aria-label="Which list">
          ${IDEA_TABS.map(([k, l]) => `<button type="button" class="pc-range${k === tab ? ' on' : ''}" data-idea="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}
        </div>
        <div class="table-wrap">
          <table class="ff-table ideas-table">
            <thead><tr><th class="hide-sm"></th><th>Ticker</th><th>Company</th><th class="num hide-sm">Price</th><th class="num hide-sm">Fair value</th><th class="num">Upside</th><th class="hide-sm">Rating</th></tr></thead>
            <tbody>${ideaRows(tab)}</tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <section class="home-band">
    <div class="wrap">
      <div class="hb-head">
        <div><div class="eyebrow">Coverage</div><h2>${cov.sectors} sectors</h2>
          <p class="sub">Each bar is the sector's rating mix; open one for the full sortable list.</p></div>
      </div>
      <div class="st-grid">${FF_DATA.sectors.map(sectorTileHTML).join('')}</div>
    </div>
  </section>

  <section class="home-band">
    <div class="wrap">
      <div class="two-col home-about">
        <div class="card">
          <span class="tag tag-lilac" style="margin-bottom:14px;">About the analyst</span>
          <h2 style="font-size:22px;">Built by a 17-year-old who got a couple of stocks for Christmas.</h2>
          <p>I'm Gabriel Giard, a high school senior. FreeFlow Finance is my attempt to build the kind of coverage a junior analyst at a bank would produce — for anyone to read, whether you know what a discount rate is or you're about to learn.</p>
          <button class="btn btn-ghost" data-route="about">Read the full story ${ICN.arrow}</button>
        </div>
        <div class="card">
          <span class="tag tag-lilac" style="margin-bottom:14px;">Methodology</span>
          <h2 style="font-size:22px;">Same models, every time. On purpose.</h2>
          <p>Every company runs through the identical two-stage discounted cash flow, and a second model values it at the multiples of its closest peers. No cherry-picked assumptions to hit a target: the models decide, then the pages explain what they decided. Flip between the two anywhere on the site.</p>
          <button class="btn btn-ghost" data-route="methodology">See how it works ${ICN.arrow}</button>
        </div>
      </div>
    </div>
  </section>`;
}

/* ====================== HOMEPAGE: COMPANY FINDER ======================
   Beside the headline: a search box for the whole library, with the
   largest names one tap away. Light on purpose; the charts live on the
   company pages. */
function heroFindRow(c) {
  return `
    <a class="hfind-row" href="#/company/${encodeURIComponent(c.t)}">
      <span class="tk">${escapeHtml(c.t)}</span>
      <span class="nm">${escapeHtml(c.n)}</span>
      <span class="up ${c.fv > 0 ? upClass(c.upside) : ''}" data-num="hf-${c.t}" data-val="${c.upside}" data-fmt="pct">${c.fv > 0 ? FMT.pct(c.upside) : 'N/M'}</span>
      <span class="dot" style="background:${ratingColor(c.rating)}" title="${c.rating}"></span>
    </a>`;
}
function heroFindDefault() {
  return [...FF_DATA.companies].sort((a, b) => b.mcap - a.mcap).slice(0, 6);
}
function heroFindHTML() {
  return `
  <div class="hfind" data-hfind>
    <label class="hfind-k" for="hfind-q">Look up any of the ${FF_DATA.companies.length} companies</label>
    <div class="hfind-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="hfind-q" type="text" autocomplete="off" spellcheck="false" placeholder="Ticker or name, e.g. Apple" aria-describedby="hfind-cap">
    </div>
    <div class="hfind-head"><span id="hfind-cap">Largest companies</span><span>upside · rating</span></div>
    <div class="hfind-list" role="list">${heroFindDefault().map(heroFindRow).join('')}</div>
  </div>`;
}
function mountHeroFind(root) {
  (root || document).querySelectorAll('[data-hfind]').forEach(box => {
    if (box._hf) return; box._hf = true;
    const q = box.querySelector('input'), list = box.querySelector('.hfind-list'), cap = box.querySelector('#hfind-cap');
    const show = () => {
      const v = q.value.trim().toLowerCase();
      let hits = v
        ? FF_DATA.companies.filter(c => c.t.toLowerCase().startsWith(v) || c.n.toLowerCase().includes(v))
            .sort((a, b) => (b.t.toLowerCase() === v) - (a.t.toLowerCase() === v) || b.mcap - a.mcap).slice(0, 6)
        : heroFindDefault();
      cap.textContent = v ? (hits.length ? `${hits.length === 6 ? 'Top matches' : 'Matches'}` : `Nothing matches "${q.value.trim()}"`) : 'Largest companies';
      list.innerHTML = hits.map(heroFindRow).join('');
    };
    q.addEventListener('input', show);
    q.addEventListener('keydown', e => {
      const rows = [...list.querySelectorAll('.hfind-row')];
      const i = rows.indexOf(document.activeElement);
      if (e.key === 'Enter' && rows[0]) { e.preventDefault(); rows[0].click(); }
      if (e.key === 'ArrowDown' && rows[0]) { e.preventDefault(); rows[0].focus(); }
    });
    list.addEventListener('keydown', e => {
      const rows = [...list.querySelectorAll('.hfind-row')], i = rows.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && rows[i + 1]) { e.preventDefault(); rows[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (rows[i - 1] || q).focus(); }
    });
  });
}

/* ============================ HOMEPAGE HERO ============================ */
/* One company's real price chart against our fair value, beside the
   headline, switchable between the largest names. */

const HF_PICKS = () => [...FF_DATA.companies].filter(c => c.fv > 0)
  .sort((a, b) => b.mcap - a.mcap).slice(0, 6);

function heroFeaturedBody(c) {
  return `
    <div class="hf-head">
      <div class="hf-id">
        <span class="hf-t">${escapeHtml(c.t)}</span>
        <span class="hf-n">${escapeHtml(c.n)}</span>
      </div>
      <div class="hf-nums">
        <span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span>
        <span class="hf-fv">Fair value <b>${fvStr(c.fv)}</b></span>
      </div>
    </div>
    ${priceChartSVG(c.t, c.fv, c.price)}
    <a class="hf-open" href="#/company/${encodeURIComponent(c.t)}">Read the full ${escapeHtml(c.n.split(/[ ,]/)[0])} valuation</a>`;
}

function heroFeaturedHTML() {
  const picks = HF_PICKS();
  const first = picks[0];
  return `
  <div class="hf" data-hf>
    <div class="hf-tabs" role="tablist" aria-label="Featured company">
      ${picks.map((c, i) => `<button type="button" role="tab" data-hf-t="${escapeHtml(c.t)}" aria-selected="${i === 0}">${escapeHtml(c.t)}</button>`).join('')}
    </div>
    <div class="hf-body" role="tabpanel">${heroFeaturedBody(first)}</div>
  </div>`;
}

function mountHomeHero(root) {
  const r = root || document;
  r.querySelectorAll('[data-hf]').forEach(el => {
    if (el._hf) return; el._hf = true;
    el.querySelectorAll('[data-hf-t]').forEach(btn => btn.addEventListener('click', () => {
      const c = byT(btn.dataset.hfT);
      if (!c) return;
      el.querySelectorAll('[data-hf-t]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      const body = el.querySelector('.hf-body');
      body.innerHTML = heroFeaturedBody(c);
      mountPriceCharts(body);
    }));
  });
}

/* Upside with a small bar, for every table: green to the right when the
   price is below fair value, red to the left when it is above. */
function upCellHTML(c) {
  if (!(c.fv > 0)) return `<td class="num up-cell"><span class="ub nm"></span><span class="upside-neg">N/M</span></td>`;
  const w = Math.min(1, Math.abs(c.upside) / 0.6) * 50;
  const side = c.upside >= 0 ? `left:50%;width:${w.toFixed(1)}%` : `right:50%;width:${w.toFixed(1)}%`;
  return `<td class="num up-cell"><span class="ub" aria-hidden="true"><i class="${c.upside >= 0 ? 'pos' : 'neg'}" data-tw="ub-${c.t}" style="${side}"></i></span><span class="${upClass(c.upside)}" data-num="up-${c.t}" data-val="${c.upside}" data-fmt="pct">${FMT.pct(c.upside)}</span></td>`;
}

/* The bear / base / bull range with today's price on it, for the company header. */
function valuationStripHTML(c) {
  const vals = [c.fv_bear, c.fv, c.fv_bull].filter(v => v > 0);
  if (vals.length < 3 || !(c.price > 0)) return '';
  const lo = Math.min(c.fv_bear, c.price) * 0.92, hi = Math.max(c.fv_bull, c.price) * 1.06;
  const P = v => ((v - lo) / (hi - lo) * 100).toFixed(2) + '%';
  const priceInside = c.price >= c.fv_bear && c.price <= c.fv_bull;
  return `
  <div class="vstrip" role="img" aria-label="Fair value range: bear ${FMT.usd(c.fv_bear)}, base ${FMT.usd(c.fv)}, bull ${FMT.usd(c.fv_bull)}; price ${FMT.usd(c.price)}">
    <div class="vs-track">
      <span class="vs-band" data-tw="vs-band" style="left:${P(c.fv_bear)};width:calc(${P(c.fv_bull)} - ${P(c.fv_bear)})"></span>
      <span class="vs-base" data-tw="vs-base" style="left:${P(c.fv)}"></span>
      <span class="vs-price" data-tw="vs-price" style="left:${P(c.price)}"></span>
    </div>
    <div class="vs-cap">${MODEL.cur === 'mx' ? 'At the low to high end of peer multiples' : 'Bear to bull'}: ${FMT.usd(c.fv_bear, 0)} to ${FMT.usd(c.fv_bull, 0)}. The price is ${priceInside ? 'inside' : c.price > c.fv_bull ? 'above' : 'below'} that range.</div>
  </div>`;
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
      ${upCellHTML(c)}
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
  ['case', 'Your Case'],
];

function viewCompany(ticker) {
  const c = byT(ticker);
  if (!c) return view404();
  if (!STATE.activeTab[ticker]) STATE.activeTab[ticker] = 'overview';
  // A shared "Your case" link opens on the tab that shows the sender's numbers.
  if (caseDecode(caseQuery())) STATE.activeTab[ticker] = 'case';
  const active = STATE.activeTab[ticker];

  const mx = MODEL.cur === 'mx' && c.mx;
  const MX_LABEL = { model: 'Peer Set', dcf: 'Multiples & Valuation' };
  const tabsHTML = TABS.map(([id, label0]) => [id, mx && MX_LABEL[id] ? MX_LABEL[id] : label0]).map(([id, label]) =>
    `<div class="co-tab ${active === id ? 'active' : ''}" data-tab="${id}" data-ticker="${ticker}">${label}</div>`
  ).join('');

  const panels = {
    overview: panelOverview(c),
    model: mx ? panelPeerSet(c) : panelModel(c),
    financials: panelFinancials(c),
    dcf: mx ? panelMxValuation(c) : panelDCF(c),
    comps: panelComps(c),
    thesis: panelThesis(c),
    case: mx ? panelMxCase(c) : panelCase(c),
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
              <span>Listed on <span class="mono">${c.exch}</span>. Based in ${c.hq}, founded ${c.founded}.</span>
            </div>
          </div>
        </div>
        <div class="co-price-block">
          <div class="co-price">${FMT.usd(c.price)}<span class="cur"> ${priceDateLabel(c)}</span></div>
          <div class="co-fv-row">
            <span class="rating-pill ${ratingClass(c.rating)}" data-swap="co-rating">${c.rating}</span>
            <span class="co-fv"><small>${MODEL.cur === 'mx' ? 'Multiples' : 'DCF'}</small> <span data-num="co-fv" data-val="${c.fv}" data-fmt="usd">${fvStr(c.fv)}</span></span>
            <span class="co-up ${upClass(c.upside)}" data-num="co-up" data-val="${c.upside}" data-fmt="pct">${FMT.pct(c.upside)}</span>
          </div>
          ${valuationStripHTML(c)}
          <button type="button" class="co-share" data-share="${c.t}" aria-label="Share ${c.n}">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V3M6 7l4-4 4 4M4 11v5h12v-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Share</span>
          </button>
        </div>
      </div>
      ${c.mx ? modelBarHTML(c) : ''}
      <div class="co-tabs">${tabsHTML}</div>
    </div>
  </section>
  <section style="padding-top:34px;">
    <div class="wrap">${panelsHTML}</div>
  </section>`;
}

/* Your Case: the visitor's own DCF. The tab carries its own copy of the
   price chart so the fair-value line and gap bracket can follow the
   sliders, while the Overview chart keeps showing the model's view. */
function panelCase(c) {
  return `
  <div style="margin-bottom:18px">${priceChartSVG(c.t, c.fv, c.price)}</div>
  ${caseHTML(c)}`;
}

/* Where the company sits in its sector on one measure, as a small meter. */
function pmHTML(c, k, verb) {
  const p = c.pctl && c.pctl[k];
  if (p == null) return '';
  const n = inSector(c.sec).length - 1;
  return `<div class="pm" title="${verb} ${p}% of the other ${n} ${escapeHtml(fmtSector(c.sec))} companies">
    <span class="pm-t"><i class="grow" style="width:${Math.max(2, p)}%"></i></span><span class="pm-l">${verb} ${p}% of sector</span></div>`;
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
        <div class="stat-cell"><div class="label">TTM Free Cash Flow</div><div class="value">${FMT.usdB(c.ttm_fcf)}</div>${pmHTML(c, 'm0', 'Margin above')}</div>
        <div class="stat-cell"><div class="label">FCF Yield</div><div class="value">${FMT.pctPlain(c.fcf_yield)}</div>${pmHTML(c, 'fcf_yield', 'Higher than')}</div>
        <div class="stat-cell"><div class="label">Net ${c.netdebt>=0?'Debt':'Cash'}</div><div class="value">${FMT.usdB(Math.abs(c.netdebt))}</div></div>
        <div class="stat-cell"><div class="label">Shares Out.</div><div class="value">${FMT.num(c.shares,2)}B</div></div>
        <div class="stat-cell"><div class="label">EV / Sales</div><div class="value">${FMT.x(c.ev_sales)}</div>${pmHTML(c, 'ev_sales', 'Pricier than')}</div>
      </div>
    </div>
  </div>`;
}

function panelModel(c) {
  const rows = c.model.map((r, i) => `
    ${i === 5 ? `<tr class="stage-divider"><td colspan="6" style="text-align:center;color:var(--text-dim);font-size:11px;text-transform:uppercase;letter-spacing:.08em;">Fade to terminal growth — Years 6–10</td></tr>` : ''}
    <tr class="${r.stage === 2 ? 'stage2' : ''}" data-pj-i="${i + 1}">
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
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:12px;">Revenue &amp; Free Cash Flow Projection</h4>
      ${projChartHTML(c)}
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
        <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:14px;">Model Assumptions</div>
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
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Discounted Cash Flow Build-Up</h4>
      <div class="card">${dcfWaterfallHTML(c.dcf, c.shares)}</div>
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin:28px 0 14px;">Sensitivity: Fair Value by WACC &amp; Terminal Growth</h4>
      <div class="table-wrap" style="padding:18px;">${sensitivityGridHTML(c.grid, c.price)}</div>
      <p style="font-size:11.5px;color:var(--text-dim);margin-top:12px;">Green cells sit above the current share price of ${FMT.usd(c.price)}; red cells sit below it. Small changes to either input move the fair value a lot — that sensitivity is the honest reason no DCF should be read as a precise number.</p>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px;">
        <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:16px;">Target Price</div>
        <div style="font-family:var(--font-mono);font-size:38px;color:var(--gold-soft);line-height:1;" data-num="dcf-fv" data-val="${c.fv}" data-fmt="usd">${fvStr(c.fv)}</div>
        <div style="margin-top:10px;"><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span> <span class="mono ${upClass(c.upside)}" style="margin-left:10px;font-size:13px;">${FMT.pct(c.upside)} vs current price</span></div>
      </div>
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:14px;">Bear / Base / Bull Range</h4>
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

/* A short summary of the multiples value; the full working is on the
   Multiples & Valuation tab when the switch is set to peer multiples. */
function multiplesHTML(c) {
  const m = c.mx;
  if (!m) return '';
  const meaningful = m.fv > 0;
  return `
    <div class="card mx-card">
      <div class="mx-head">
        <div>
          <div class="mx-k">Value at peer multiples</div>
          <div class="mx-v">${meaningful ? FMT.usd(m.fv) : 'N/M'}</div>
          <div class="mx-s">${meaningful ? `${FMT.pct(m.upside)} vs. ${FMT.usd(c.price)} · range ${FMT.usd(m.fv_bear)} to ${FMT.usd(m.fv_bull)}` : ''}</div>
        </div>
        <div class="mx-vs">
          <div><span>DCF</span><b>${fvStr(dcfOf(c).fv)}</b></div>
          <div><span>Peer multiples</span><b>${meaningful ? FMT.usd(m.fv) : 'N/M'}</b></div>
        </div>
      </div>
      <p class="mx-how">${m.methods.map(x => `${x.k} ${FMT.x(x.med)}`).join(', ')}, blended ${m.methods.map(x => Math.round(x.w * 100) + '%').join(' / ')}.
        ${MODEL.cur === 'mx' ? 'The full working is on the Multiples &amp; Valuation tab.' : 'Flip the switch above to peer multiples to see the full working.'}</p>
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
    ${multiplesHTML(c)}
    <h4>Comparable companies</h4>
    <p>The ${s.n} companies most like ${c.n} on size, growth, cash margin and leverage. Their multiples set the value above. The last column compares each company's EV/Sales to the sector median of ${s.med_ev_sales}x.</p>
    ${s.note ? `<div class="comp-note">${s.note}</div>` : ''}
    <div class="table-wrap">
      <table class="ff-table">
        <thead><tr><th>Ticker</th><th>Company</th><th class="num">Price</th><th class="num">EV/Sales</th><th class="num">EV/FCF</th><th class="num">Prem. to Sector Median</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* Dated, sourced headlines from the latest news review. The summary is our
   own wording; the link goes to the source so anyone can check it. */
function newsHTML(c) {
  const items = Array.isArray(c.news) ? c.news : [];
  if (!items.length) return '';
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'source'; } };
  const day = d => {
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  const rows = items.map(n => {
    const safe = /^https?:\/\//.test(n.u) ? n.u : '#';
    return `<li>
      <time datetime="${escapeHtml(n.d)}">${escapeHtml(day(n.d))}</time>
      <div><p>${escapeHtml(n.h)}</p>
      <a href="${escapeHtml(safe)}" target="_blank" rel="noopener nofollow">${escapeHtml(host(n.u))} ↗</a></div>
    </li>`;
  }).join('');
  return `
      <div class="card news-card">
        <div class="label">Recent developments</div>
        <ul class="news-list">${rows}</ul>
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
      <ul class="bullets cat">${c.cat.split(/,\s+/).map(x => `<li>${x.replace(/\.$/,'')}</li>`).join('')}</ul>
    </div>
    <div>
      ${newsHTML(c)}
      <div class="card" style="margin-bottom:16px;">
        <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:16px;">FreeFlow Score</div>
        ${scoreRowsHTML(c.scores)}
      </div>
      <div class="card">
        <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:12px;">Rating &amp; Target</div>
        <span class="rating-pill ${ratingClass(c.rating)}" style="font-size:14px;padding:8px 16px;">${c.rating}</span>
        <div style="margin-top:14px;font-family:var(--font-mono);font-size:26px;color:var(--gold-soft)" data-num="th-fv" data-val="${c.fv}" data-fmt="usd">${fvStr(c.fv)}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:2px;">${MODEL.cur === 'mx' ? 'Value at peer multiples' : '12-month DCF fair value'} · ${FMT.pct(c.upside)} vs. ${FMT.usd(c.price)} current</div>
      </div>
      <p style="font-size:11px;color:var(--text-dim);margin-top:16px;">This page is educational research produced for FreeFlow Finance and is not investment advice. Ratings are generated mechanically from the upside under the model you have selected (${modelName()}), not analyst discretion — see the Methodology page for the exact thresholds.</p>
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
          <p>FreeFlow Finance is the result: a self-built equity research shop covering ${FF_DATA.companies.length} companies, using the same rigor I'd want to apply if I were a junior analyst at a bank, explained clearly enough that a friend with zero finance background could open any page and actually follow it.</p>
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
function viewTrackRecord() {
  const log = (typeof FF_TRACK_RECORD !== 'undefined' && Array.isArray(FF_TRACK_RECORD))
    ? FF_TRACK_RECORD : [];
  const rows = [...log].reverse();

  const body = rows.length ? rows.map(r => {
    const actual = r.fv > 0 ? (r.price_now / r.fv - 1) : null;
    return `
      <tr>
        <td class="mono">${r.date}</td>
        <td class="tk" data-route="company" data-ticker="${r.ticker}" style="cursor:pointer">${r.ticker}</td>
        <td>${r.name}</td>
        <td class="num">${r.from}</td>
        <td class="num">${r.to}</td>
        <td class="num">${FMT.usd(r.price_then)} &rarr; ${FMT.usd(r.price_now)}</td>
        <td class="num ${actual!==null && actual>=0 ? 'up':'down'}">${actual!==null ? FMT.pct(actual) : '—'}</td>
      </tr>`;
  }).join('') : '';

  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Track Record' })}
      <div class="eyebrow">Every rating change, dated</div>
      <h1 style="font-size:32px;max-width:700px;">What the model has changed its mind about, and when.</h1>
      <p style="max-width:640px;font-size:14.5px;">Ratings move when the recalibration engine updates on real data — a
        price move, a margin change, a rate shift. Every change is logged here automatically, with the price at the
        time. There is no backfilled history: this only records what happens from the day it was switched on.</p>
      ${MODEL.cur === 'mx' ? `<p class="mx-trk-note">You are viewing peer multiples. The track record always follows the DCF, the site's official model, so every rating on this page is a DCF rating.</p>` : ''}
    </div>
  </section>
  <section style="padding-top:8px;">
    <div class="wrap">
      ${rows.length ? `
        <div class="table-wrap">
          <table class="ff-table">
            <thead><tr>
              <th>Date</th><th>Ticker</th><th>Company</th><th class="num">From</th>
              <th class="num">To</th><th class="num">Price then &rarr; now</th>
              <th class="num">vs. fair value now</th>
            </tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>` : `
        <div class="empty-state">
          <h3 style="color:var(--text);font-size:18px;">No changes logged yet</h3>
          <p>This page updates automatically the next time a rating changes on real data — nothing to do,
             and nothing here is backfilled. Check back after the model's next recalibration.</p>
        </div>`}
    </div>
  </section>`;
}

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
      <p style="max-width:600px;font-size:15px;">The same six-step process, applied identically whether the company is a 150-year-old oil major or a rocket company that IPO'd five weeks ago. Consistency is the entire point — it's what makes ${FF_DATA.companies.length} companies actually comparable.</p>
    </div>
  </section>
  <section style="padding-top:10px;">
    <div class="wrap">
      <div class="two-col">
        <div>${stepsHTML}</div>
        <div>
          <div class="card" style="margin-bottom:20px;">
            <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:14px;">Rating Scale</div>
            <table style="width:100%;font-size:13px;border-collapse:collapse;">
              <tbody>${ratingRows}</tbody>
            </table>
            <p style="font-size:11px;color:var(--text-dim);margin-top:14px;margin-bottom:0;">Thresholds are fixed and mechanical — applied identically to every company, every sector.</p>
          </div>
          <div class="formula">FV = Σ [FCFₜ ÷ (1+WACC)^(t-0.5)] + [TV ÷ (1+WACC)^(n-0.5)]</div>
          <p style="font-size:12px;color:var(--text-dim);">Where TV = FCF₁₀ × (1 + g) ÷ (WACC − g), and g is the terminal growth rate.</p>
        </div>
      </div>
      <div style="margin-top:50px;" id="multiples">
        <h2 style="font-size:22px;margin-bottom:14px;">The second model: peer multiples</h2>
        <p style="max-width:720px;font-size:14px;">The switch at the top of every page, and the slider on every company page, lets you see each company valued a second way: at the multiples its closest peers trade on. After the DCF, this is the method analysts use most, and it answers a different question. The DCF asks what a company is worth on its own future cash; multiples ask what it would be worth if the market priced it like the companies most similar to it. Flip the slider on a company page and every tab follows: the Financial Model becomes the Peer Set, DCF &amp; Valuation becomes Multiples &amp; Valuation, and Your Case lets you choose the peers and the multiple yourself.</p>
        <div class="card" style="margin:18px 0 10px;">
          <ul class="bullets cat">
            <li><strong style="color:var(--text)">Peers</strong>: within the sector, the eight companies closest on size (market value on a log scale), five-year growth, cash margin and leverage. A sector label alone is too coarse, since a chip designer and a disk-drive maker share one. Each peer gets a closeness score from 0 to 100.</li>
            <li><strong style="color:var(--text)">Three readings, blended</strong>: the peers' median multiple of trailing free cash flow (35%), their median multiple of next year's forecast free cash flow (35%, the single reading research finds most accurate), and a growth-adjusted multiple (30%) read off the line that best fits multiple against five-year growth across the whole sector, at the company's own growth rate. That last reading stops a fast grower being priced like slower peers, or the reverse; when the line explains too little in a sector, its weight goes to the other two.</li>
            <li><strong style="color:var(--text)">Which multiple</strong>: enterprise value to free cash flow. For banks, insurers, exchanges and asset managers, where debt is part of the business, price to free cash flow instead.</li>
            <li><strong style="color:var(--text)">Value</strong>: each multiple times the company's own cash flow, blended by weight, less net debt, divided by shares. The peers' 25th and 75th percentile multiples give the low and high ends, and the valuation tab shows every step, a football field, and a grid of value by multiple and cash flow.</li>
            <li><strong style="color:var(--text)">No cash flow yet</strong>: the few companies without positive free cash flow are valued on sales instead, and their page says so, because a sales multiple borrowed from more profitable peers flatters them.</li>
            <li><strong style="color:var(--text)">Guard rails</strong>: multiples that are negative or above 150 times cash flow are left out, and if fewer than three peers give a usable figure, the whole sector is used.</li>
            <li><strong style="color:var(--text)">Ratings</strong>: the same fixed thresholds, applied to the upside under whichever model you have selected. The DCF stays the site's official model: the track record, link previews and search pages use it.</li>
          </ul>
        </div>
        <p style="max-width:720px;font-size:13px;color:var(--text-dim);">The limit to keep in mind: if a whole sector is expensive, every company in it can look fairly valued next to its peers. When the two models disagree, that gap is usually the most interesting thing on the page.</p>
      </div>
      <div style="margin-top:50px;">
        <h2 style="font-size:22px;margin-bottom:14px;">How the model stays current</h2>
        <p style="max-width:720px;font-size:14px;margin-bottom:22px;">A valuation library that never revises its inputs goes stale. Some of that updating can be done mechanically, and some cannot. This is the line between them.</p>
        <div class="card" style="margin-bottom:26px;">
          <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:14px;">Updated automatically</div>
          <ul class="bullets cat">
            <li><strong style="color:var(--text)">Share prices</strong> — every weekday, from market data.</li>
            <li><strong style="color:var(--text)">Revenue, share count and net debt</strong> — refreshed from reported figures, so the starting point of every model tracks what companies actually report rather than what was assumed when it was written.</li>
            <li><strong style="color:var(--text)">Discount rates</strong> — every WACC here was set against a 4.63% ten-year Treasury yield. When that rate moves, the cost of capital moves for everyone, so each company's WACC shifts by the same amount. Each keeps its own risk premium exactly as written, so the relative ranking between companies is unchanged.</li>
            <li><strong style="color:var(--text)">Starting cash flow margin</strong> — rebased to reported free cash flow divided by reported revenue.</li>
            <li><strong style="color:var(--text)">The five-year growth path</strong> — year one is set to the company's actual trailing revenue growth, then faded geometrically toward the median long-run growth of its sector. Year one is clamped to a &minus;25% to +60% band and may not move more than 20 points in a single run, so one unusual quarter cannot swing a decade of forecast.</li>
            <li><strong style="color:var(--text)">The year-five margin target</strong> — set to the current margin plus one third of the gap to the sector median, capped at 8 points of movement either way. A company earning far below its peers is assumed to close part of that gap; one earning far above is assumed to give some back.</li>
          </ul>
          <p style="font-size:12px;color:var(--text-dim);margin:16px 0 0;">Every automatic change runs through guard rails. A figure that moves more than 15 percentage points, or produces a discount rate below the terminal growth rate, is reported and ignored rather than applied — those are almost always data problems, not real changes.</p>
        </div>
        <div class="card" style="margin-bottom:26px;">
          <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:14px;">Not updated automatically, on purpose</div>
          <ul class="bullets risk">
            <li>The terminal growth rate — the assumption about the very long run, where no recent data point is informative.</li>
            <li>Every word of the thesis, risks, catalysts and street view.</li>
            <li>Which companies are covered at all.</li>
          </ul>
          <p style="font-size:12px;color:var(--text-dim);margin:14px 0 0;">This makes the library systematic rather than hand-tuned, and that is a genuine trade-off worth stating. A rules-based model is consistent and reproducible across every company, and it cannot be quietly nudged toward a conclusion. What it cannot do is capture an insight the numbers do not yet show — a management change, a regulatory shift, a product about to land. That judgement lives in the written sections, which is exactly why they are still written by hand.</p>
        </div>
        <div class="comp-note" style="margin-bottom:34px;">
          <b>One consequence worth stating plainly.</b> Falling interest rates raise every fair value in this library, because a lower discount rate makes future cash flows worth more today. If the ratings here look more positive than they did last quarter, check the risk-free rate before concluding the companies improved. The arithmetic moves before the businesses do.
        </div>

        <h2 style="font-size:22px;margin-bottom:14px;">Market context</h2>
        <p style="max-width:720px;font-size:14px;margin-bottom:22px;">Valuations do not sit in a vacuum. This is the environment these models were built in, updated as it changes.</p>
        <div class="card">
          <div class="label" style="font-size:12px;color:var(--text-muted);letter-spacing:.01em;margin-bottom:14px;">As of late July 2026</div>
          <ul class="bullets cat">
            <li><strong style="color:var(--text)">Rates are not falling.</strong> The Federal Reserve, now chaired by Kevin Warsh, has held its target range at 3.50&ndash;3.75%, and markets have been pricing in the possibility of a <em style="color:var(--gold-soft);font-style:normal">hike</em> rather than cuts. Every discount rate in this library assumes a cost of capital consistent with that, not with the era of near-zero rates.</li>
            <li><strong style="color:var(--text)">The AI capital cycle is being questioned for the first time.</strong> Hyperscalers are on course to spend somewhere between $600bn and $700bn on AI infrastructure in 2026, up sharply on last year. In July, semiconductor stocks fell hard &mdash; more than a trillion dollars of sector value &mdash; not because demand disappointed, but because investors began asking what return that spending will earn. Alphabet fell around 7% in a week after <em style="color:var(--gold-soft);font-style:normal">raising</em> its capex guidance.</li>
            <li><strong style="color:var(--text)">Money is rotating from chipmakers to the companies paying them.</strong> The trade for two years was to own semiconductors on the assumption that cloud spending kept accelerating. Some investors are now doing the opposite &mdash; buying the hyperscalers footing the bill, plus software, financials and healthcare.</li>
            <li><strong style="color:var(--text)">Earnings week put a price on discipline.</strong> On 27 July 2026 Apple reclaimed the title of most valuable company from NVIDIA, on capital restraint rather than AI spending. Two days later Meta beat on revenue &mdash; up 27% to $60.8bn &mdash; and the shares still fell, because earnings per share grew barely 1% while 2026 capex guidance rose again to $125&ndash;145bn. Amazon passed $200bn of quarterly revenue for the first time with AWS growing 37%, and raised its capital plan to roughly $220bn. The pattern across the week was consistent: revenue growth is no longer enough on its own if the spending required to produce it keeps climbing faster.</li>
            <li><strong style="color:var(--text)">Energy is a geopolitical variable again.</strong> Middle East tensions have moved oil prices sharply in both directions this year, which feeds directly into inflation expectations and therefore into rate policy.</li>
          </ul>
          <p style="font-size:12px;color:var(--text-dim);margin:16px 0 0;">Worth saying plainly: this library rated much of the AI complex Reduce or Sell before that selloff, on the basis of cash flows rather than a market call. That is the model working as intended, not a forecast &mdash; and it would have looked equally wrong for a long stretch beforehand.</p>
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

const SHORT_SECTOR = { semis: 'Semis & AI hardware', software: 'Software', health: 'Healthcare', financials: 'Financials',
  consumer: 'Consumer', energy: 'Energy & materials', industrials: 'Industrials', autos: 'Autos',
  global: 'Global', telecom: 'Telecom & media', frontier: 'Frontier' };
function screenerTableHTML() {
  const rows = screenerResults();
  if (!rows.length) {
    return `<div class="empty-state">
      <h3 style="color:var(--text);font-size:18px;">No companies match those filters</h3>
      <p>Try loosening one: the whole library is ${FF_DATA.companies.length} companies.</p>
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
      <td class="sec-cell">${SHORT_SECTOR[c.sec] || fmtSector(c.sec)}</td>
      <td class="num">${FMT.usd(c.price)}</td>
      <td class="num" style="color:var(--gold-soft)">${fvStr(c.fv)}</td>
      ${upCellHTML(c)}
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
      <h1 style="font-size:32px;max-width:680px;">Filter all ${FF_DATA.companies.length} companies on the model's own output.</h1>
      <p style="max-width:600px;font-size:14.5px;">Every number here comes from the same ${MODEL.cur === 'mx' ? 'peer multiples model' : 'DCF'}, so the comparisons hold. Combine filters to find, say, every net-cash company trading below 5x sales with upside to fair value.</p>
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
   sent anywhere — there is no server to send it to.

   The page answers three questions, in this order: what is it worth, am I
   up, and does our model think I'm paying too much? The third is the one
   only this site can answer, so it gets the visual: the same "gap to fair
   value" idea as the company chart, applied to the whole portfolio. */

const PF = { positions: [], loaded: false, example: false, editing: null };
const PF_KEY = 'freeflow.portfolio.v1';           // unchanged: old saves still load
const PF_EXAMPLE_KEY = 'freeflow.portfolio.example';
const PF_EXAMPLE = [
  { t: 'AAPL', sh: 15, cost: 190 },
  { t: 'NVDA', sh: 20, cost: 120 },
  { t: 'KO',   sh: 40, cost: 62 },
  { t: 'JPM',  sh: 10, cost: 210 },
];

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
    PF.example = localStorage.getItem(PF_EXAMPLE_KEY) === '1' && PF.positions.length > 0;
  } catch (e) {
    // Private browsing, disabled storage, or corrupted JSON. The portfolio
    // still works for this session; it just won't persist.
    console.info('Portfolio storage unavailable — running in-session only.');
  }
}

function pfSave() {
  try {
    localStorage.setItem(PF_KEY, JSON.stringify(PF.positions));
    if (PF.example) localStorage.setItem(PF_EXAMPLE_KEY, '1');
    else localStorage.removeItem(PF_EXAMPLE_KEY);
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
    // buying more: average the cost across the combined position
    const totalSh = existing.sh + shares;
    existing.cost = (existing.cost * existing.sh + cost * shares) / totalSh;
    existing.sh = totalSh;
  } else {
    PF.positions.push({ t: ticker, sh: shares, cost });
  }
  pfSave();
  return true;
}

function pfUpdate(ticker, shares, cost) {
  const p = PF.positions.find(x => x.t === ticker);
  if (!p || !(shares > 0) || !(cost >= 0)) return false;
  p.sh = shares; p.cost = cost;
  pfSave();
  return true;
}

function pfRemove(ticker) {
  PF.positions = PF.positions.filter(p => p.t !== ticker);
  if (!PF.positions.length) PF.example = false;
  pfSave();
}

function pfStats() {
  let value = 0, cost = 0, fvValue = 0, nm = 0;
  const bySector = {};
  for (const p of PF.positions) {
    const c = byT(p.t);
    if (!c) continue;
    const v = c.price * p.sh;
    value += v;
    cost += p.cost * p.sh;
    if (c.fv > 0) fvValue += c.fv * p.sh;
    else { fvValue += v; nm += 1; }      // no meaningful fair value: count at market
    bySector[c.sec] = (bySector[c.sec] || 0) + v;
  }
  return { value, cost, fvValue, nm, bySector };
}

const pfMoney = v => FMT.usd(v, Math.abs(v) >= 100 ? 0 : 2);
const pfSigned = v => (v >= 0 ? '+' : '−') + pfMoney(Math.abs(v));

/* The summary card's signature: market value and model value on one scale,
   with the gap between them coloured. Same idea as the bracket on every
   company chart, so the reader already knows how to read it. */
function pfMeterHTML(st) {
  const hi = Math.max(st.value, st.fvValue) * 1.08 || 1;
  const pm = st.value / hi * 100, pf = st.fvValue / hi * 100;
  const lo = Math.min(pm, pf), span = Math.abs(pf - pm);
  const up = st.fvValue >= st.value;
  const near = Math.abs(pf - pm) < 14;   // labels would collide: stack them
  return `
  <div class="pf-meter" role="img" aria-label="Market value ${FMT.usd(st.value, 0)}, our model's value ${FMT.usd(st.fvValue, 0)}">
    <div class="pf-meter-track">
      <div class="pf-meter-gap ${up ? 'up' : 'down'}" style="left:${lo.toFixed(2)}%;width:${span.toFixed(2)}%"></div>
      <div class="pf-meter-mark mkt" style="left:${pm.toFixed(2)}%"></div>
      <div class="pf-meter-mark fv" style="left:${pf.toFixed(2)}%"></div>
    </div>
    <div class="pf-meter-labels${near ? ' near' : ''}">
      <span class="mkt${pm > 55 ? ' r' : ''}" style="left:${pm.toFixed(2)}%"><i></i>Market ${FMT.usd(st.value, 0)}</span>
      <span class="fv${pf > 55 ? ' r' : ''}" style="left:${pf.toFixed(2)}%"><i></i>Our model ${FMT.usd(st.fvValue, 0)}</span>
    </div>
  </div>`;
}

function pfVerdict(st) {
  const gap = st.value > 0 ? st.fvValue / st.value - 1 : 0;
  const pts = Math.abs(gap * 100).toFixed(0);
  if (gap > 0.10) return `Our model values your holdings <b>${pts}% above</b> what they trade for today.`;
  if (gap < -0.10) return `Our model values your holdings <b>${pts}% below</b> what they trade for today.`;
  return `Your holdings trade <b>close to</b> what our model thinks they're worth.`;
}

function pfRowHTML(p, total) {
  const c = byT(p.t);
  const v = c.price * p.sh;
  const g = v - p.cost * p.sh;
  const gp = p.cost > 0 ? c.price / p.cost - 1 : 0;
  const w = total > 0 ? v / total : 0;
  const editing = PF.editing === p.t;
  const id = 'pf-' + c.t.replace(/[^a-z0-9]/gi, '');
  const second = editing ? `
      <div class="pf-edit">
        <label>Shares <input id="${id}-sh" type="number" min="0" step="any" value="${+p.sh.toFixed(6)}"></label>
        <label>Avg. price paid <input id="${id}-cost" type="number" min="0" step="any" value="${+p.cost.toFixed(4)}"></label>
        <button type="button" class="pf-btn primary" data-pf-save="${c.t}">Save</button>
        <button type="button" class="pf-btn" data-pf-cancel>Cancel</button>
      </div>` : `
      <div class="pf-sub">${FMT.num(p.sh, 4)} share${p.sh === 1 ? '' : 's'} · avg. ${FMT.usd(p.cost)} · now ${FMT.usd(c.price)}</div>`;
  return `
  <li class="pf-row${editing ? ' editing' : ''}" style="--w:${(w * 100).toFixed(2)}%">
    <a class="pf-id" href="#/company/${encodeURIComponent(c.t)}">
      <span class="pf-tk">${c.t}</span><span class="pf-nm">${c.n}</span>
    </a>
    <div class="pf-val"><b>${pfMoney(v)}</b><span>${(w * 100).toFixed(0)}% of portfolio</span></div>
    <div class="pf-gain ${g >= 0 ? 'up' : 'down'}"><b>${pfSigned(g)}</b><span>${FMT.pct(gp)}</span></div>
    <a class="pf-model" href="#/company/${encodeURIComponent(c.t)}" title="Our fair value ${fvStr(c.fv)}">
      <span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span>
      <span class="pf-fv">FV ${fvStr(c.fv)}</span>
    </a>
    <div class="pf-actions">
      ${editing ? '' : `<button type="button" class="pf-icon" data-pf-edit="${c.t}" aria-label="Edit ${c.t}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg></button>`}
      <button type="button" class="pf-icon" data-pf-remove="${c.t}" aria-label="Remove ${c.t}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    ${second}
    <div class="pf-weight" aria-hidden="true"></div>
  </li>`;
}

function pfAddFormHTML() {
  return `
  <form class="pf-addform" id="pf-addform" autocomplete="off">
    <div class="pf-field pf-search">
      <label for="pf-q">Company</label>
      <input id="pf-q" type="text" placeholder="Search a ticker or name, e.g. NVDA" aria-autocomplete="list" aria-controls="pf-suggest">
      <ul class="pf-suggest" id="pf-suggest" role="listbox" hidden></ul>
    </div>
    <div class="pf-field">
      <label for="pf-sh">Shares</label>
      <input id="pf-sh" type="number" min="0" step="any" placeholder="10">
    </div>
    <div class="pf-field">
      <label for="pf-cost">Price paid <small>optional</small></label>
      <input id="pf-cost" type="number" min="0" step="any" placeholder="today's price">
    </div>
    <button type="submit" class="btn btn-violet pf-addbtn">Add</button>
    <p class="pf-msg" id="pf-msg" role="status"></p>
  </form>`;
}

function viewPortfolio() {
  pfLoad();
  const st = pfStats();
  const empty = PF.positions.length === 0;
  const gain = st.value - st.cost;
  const gainPct = st.cost > 0 ? gain / st.cost : 0;

  const head = `
  <section class="co-hero pf-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Portfolio' })}
      <h1 class="pf-title">Your portfolio</h1>
      <p class="pf-lede">Add what you own and see it against our fair values. Saved on this device only: no account, nothing sent anywhere.</p>
    </div>
  </section>`;

  if (empty) {
    return head + `
    <section style="padding-top:6px"><div class="wrap" id="pf-root">
      <div class="pf-empty">
        <h2>Start with one stock</h2>
        <p>Type a ticker or company name. You'll see what your holdings are worth, how much you're up, and whether our model thinks they're cheap or expensive.</p>
        ${pfAddFormHTML()}
        <button type="button" class="pf-link" data-pf-example>Or look at an example portfolio first</button>
      </div>
    </div></section>`;
  }

  const rows = PF.positions.slice()
    .sort((a, b) => byT(b.t).price * b.sh - byT(a.t).price * a.sh)
    .map(p => pfRowHTML(p, st.value)).join('');

  const alloc = Object.entries(st.bySector).sort((a, b) => b[1] - a[1]);
  const allocBar = alloc.map(([k, v], i) =>
    `<div style="flex:${v.toFixed(2)};background:${SEG_COLORS[i % SEG_COLORS.length]}" title="${fmtSector(k)} ${(v / st.value * 100).toFixed(0)}%"></div>`).join('');
  const allocKey = alloc.map(([k, v], i) =>
    `<span><i style="background:${SEG_COLORS[i % SEG_COLORS.length]}"></i>${fmtSector(k)} <b>${(v / st.value * 100).toFixed(0)}%</b></span>`).join('');

  return head + `
  <section style="padding-top:6px"><div class="wrap" id="pf-root">
    ${PF.example ? `
    <div class="pf-example">This is an example portfolio, so you can see how it works.
      <button type="button" class="pf-link" data-pf-clear>Clear it and add your own</button></div>` : ''}

    <div class="pf-summary">
      <div class="pf-figs">
        <div><div class="pf-big">${FMT.usd(st.value, 0)}</div><div class="pf-cap">Worth today</div></div>
        <div class="pf-gainbig ${gain >= 0 ? 'up' : 'down'}">
          <div class="pf-big2">${pfSigned(gain)} <span>${FMT.pct(gainPct)}</span></div>
          <div class="pf-cap">Since you bought</div></div>
      </div>
      ${pfMeterHTML(st)}
      <p class="pf-verdict">${pfVerdict(st)}${st.nm ? ` <span>${st.nm} holding${st.nm > 1 ? 's have' : ' has'} no meaningful fair value and ${st.nm > 1 ? 'are' : 'is'} counted at market price.</span>` : ''}</p>
    </div>

    <div class="pf-addcard">
      <div class="pf-h3">Add a stock</div>
      ${pfAddFormHTML()}
    </div>

    <div class="pf-listhead"><span>Holding</span><span>Value</span><span>Gain</span><span>Our view</span><span></span></div>
    <ul class="pf-list">${rows}</ul>

    <div class="pf-alloc">
      <div class="pf-h3">Where your money is</div>
      <div class="pf-allocbar">${allocBar}</div>
      <div class="pf-allockey">${allocKey}</div>
    </div>
    <p class="pf-foot">Fair values come from ${MODEL.cur === 'mx' ? 'the peer multiples model' : 'our DCF model'} and update every market day. Not investment advice.</p>
  </div></section>`;
}

/* ------------------------------------------------------------ behaviour --- */

function pfRefresh(focusSearch) {
  // Re-render the page in place, without the router's jump to the top.
  const y = window.scrollY;
  APP.innerHTML = viewPortfolio();
  mountPortfolio(APP);
  window.scrollTo(0, y);
  if (focusSearch) document.getElementById('pf-q')?.focus({ preventScroll: true });
}

function pfMsg(text, ok) {
  const el = document.getElementById('pf-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'pf-msg ' + (ok ? 'ok' : 'err');
  if (ok) setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, 2600);
}

function pfMatches(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  for (const c of FF_DATA.companies) {
    const t = c.t.toLowerCase(), n = c.n.toLowerCase();
    let s = -1;
    if (t === q) s = 0;
    else if (t.startsWith(q)) s = 1;
    else if (n.startsWith(q)) s = 2;
    else if (n.includes(' ' + q)) s = 3;
    else if (n.includes(q)) s = 4;
    if (s >= 0) scored.push([s, c]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].t.localeCompare(b[1].t)).slice(0, 6).map(x => x[1]);
}

function mountPortfolio(root) {
  const el = (root || document).querySelector('#pf-root');
  if (!el || el.dataset.mounted) return;
  el.dataset.mounted = '1';

  const form = el.querySelector('#pf-addform');
  const q = el.querySelector('#pf-q'), list = el.querySelector('#pf-suggest');
  const shIn = el.querySelector('#pf-sh'), costIn = el.querySelector('#pf-cost');
  let picked = null, hits = [], active = -1;

  const pick = c => {
    picked = c;
    q.value = `${c.t} · ${c.n}`;
    costIn.placeholder = `today ${FMT.usd(c.price)}`;
    list.hidden = true;
    shIn.focus();
  };
  const draw = () => {
    list.innerHTML = hits.map((c, i) => `
      <li role="option" data-i="${i}" class="${i === active ? 'on' : ''}" aria-selected="${i === active}">
        <b>${c.t}</b><span>${c.n}</span><em>${FMT.usd(c.price)}</em></li>`).join('');
    list.hidden = !hits.length;
  };

  q.addEventListener('input', () => {
    picked = null;
    costIn.placeholder = "today's price";
    hits = pfMatches(q.value); active = hits.length ? 0 : -1; draw();
  });
  q.addEventListener('keydown', e => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(hits.length - 1, active + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); draw(); }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); pick(hits[active]); }
    else if (e.key === 'Escape') { list.hidden = true; }
  });
  q.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
  list.addEventListener('mousedown', e => {
    const li = e.target.closest('li');
    if (li) { e.preventDefault(); pick(hits[+li.dataset.i]); }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const c = picked || (hits.length === 1 ? hits[0] : byT(q.value.trim().toUpperCase()));
    const sh = parseFloat(shIn.value);
    const costRaw = costIn.value.trim();
    const cost = costRaw === '' ? (c ? c.price : NaN) : parseFloat(costRaw);
    if (!c) { pfMsg('Pick a company from the list.', false); q.focus(); return; }
    if (!(sh > 0)) { pfMsg('Enter how many shares you own.', false); shIn.focus(); return; }
    if (!(cost >= 0)) { pfMsg('Enter the price you paid per share, or leave it blank.', false); costIn.focus(); return; }
    if (sh > 1e9 || cost > 1e7) { pfMsg('That looks like a typo. Check the numbers.', false); return; }
    if (PF.example) { PF.positions = []; PF.example = false; }
    const had = PF.positions.some(p => p.t === c.t);
    pfAdd(c.t, sh, cost);
    pfRefresh(true);
    pfMsg(had ? `Added to your ${c.t} position. Average price updated.` : `${c.t} added.`, true);
  });

  el.addEventListener('click', e => {
    const t = e.target.closest('[data-pf-edit],[data-pf-remove],[data-pf-save],[data-pf-cancel],[data-pf-example],[data-pf-clear]');
    if (!t) return;
    if (t.dataset.pfEdit) { PF.editing = t.dataset.pfEdit; pfRefresh(); document.querySelector('.pf-edit input')?.focus(); }
    else if (t.dataset.pfRemove) { if (PF.editing === t.dataset.pfRemove) PF.editing = null; pfRemove(t.dataset.pfRemove); pfRefresh(); }
    else if (t.dataset.pfSave) {
      const id = 'pf-' + t.dataset.pfSave.replace(/[^a-z0-9]/gi, '');
      const sh = parseFloat(document.getElementById(id + '-sh').value);
      const cost = parseFloat(document.getElementById(id + '-cost').value);
      if (!(sh > 0) || !(cost >= 0)) { alertRow(t); return; }
      pfUpdate(t.dataset.pfSave, sh, cost); PF.editing = null; pfRefresh();
    }
    else if ('pfCancel' in t.dataset) { PF.editing = null; pfRefresh(); }
    else if ('pfExample' in t.dataset) {
      PF.positions = PF_EXAMPLE.filter(p => byT(p.t)).map(p => ({ ...p }));
      PF.example = true; pfSave(); pfRefresh();
    }
    else if ('pfClear' in t.dataset) { PF.positions = []; PF.example = false; pfSave(); pfRefresh(true); }
  });

  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('.pf-edit')) {
      e.preventDefault();
      e.target.closest('.pf-row').querySelector('[data-pf-save]')?.click();
    } else if (e.key === 'Escape' && e.target.closest('.pf-edit')) {
      PF.editing = null; pfRefresh();
    }
  });

  function alertRow(btn) {
    const box = btn.closest('.pf-edit');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
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
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Earnings Quality &amp; Margins</h4>
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

      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Revenue Composition</h4>
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

      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Valuation vs Sector</h4>
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
      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Balance Sheet</h4>
      <div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-bottom:16px;">
        <div class="stat-cell"><div class="label">Net ${c.netdebt >= 0 ? 'Debt' : 'Cash'}</div>
          <div class="value" style="color:${c.netdebt >= 0 ? 'var(--text)' : 'var(--green)'}">${FMT.usdB(Math.abs(c.netdebt))}</div></div>
        <div class="stat-cell"><div class="label">Leverage</div><div class="value">${leverage}</div></div>
        <div class="stat-cell"><div class="label">Net Debt / EV</div><div class="value">${FMT.pctPlain(c.nd_ev)}</div></div>
        <div class="stat-cell"><div class="label">Shares Out.</div><div class="value">${FMT.num(c.shares, 2)}B</div></div>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin-bottom:26px;">${leverageNote}</p>

      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Cash Flow Bridge</h4>
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

      <h4 style="font-family:var(--font-display);font-size:19px;font-weight:400;color:var(--text);letter-spacing:-.01em;margin-bottom:16px;">Where the Value Sits</h4>
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
