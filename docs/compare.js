/* ============================================================================
   COMPARE  (#/compare/NVDA/AMD)
   ----------------------------------------------------------------------------
   Two companies, side by side, on the same model. The page answers the
   question people actually ask ("which one?") in sentences first, then shows
   the numbers behind each sentence, then the two share prices over the past
   year from a common start.

   Because every company in the library runs through the identical model, the
   comparison is fair in a way two separate research notes never are.

   The address carries both tickers, so a comparison can be shared as a link.
   One ticker (#/compare/NVDA) picks its closest peer as the opponent.

   FF_CMP holds the page-free parts (rebasing two price series to a common
   start, choosing the opponent), checked by compare_test.js.
   ========================================================================== */

const FF_CMP = (() => {
  'use strict';

  /* a, b: { dates: [numbers, ascending], closes: [...] }.
     Returns both on a's calendar from the first day both exist, each starting
     at 100. A day b did not trade carries b's last close forward. */
  function rebase(a, b) {
    const out = { d: [], a: [], b: [] };
    if (!a || !b || !a.dates.length || !b.dates.length) return out;
    const mb = new Map();
    b.dates.forEach((d, i) => mb.set(d, b.closes[i]));
    let lastB = null, j = 0;
    for (let i = 0; i < a.dates.length; i++) {
      const d = a.dates[i];
      while (j < b.dates.length && b.dates[j] <= d) { lastB = b.closes[j]; j++; }
      if (lastB == null || !(a.closes[i] > 0)) continue;
      out.d.push(d); out.a.push(a.closes[i]); out.b.push(lastB);
    }
    if (!out.d.length) return out;
    const a0 = out.a[0], b0 = out.b[0];
    out.a = out.a.map(v => v / a0 * 100);
    out.b = out.b.map(v => v / b0 * 100);
    return out;
  }

  /* Who to put a company up against when only one is named: its closest peer
     by the model's own peer list, else the next-largest company in its sector,
     else the largest company that is not itself. */
  function opponent(c, companies) {
    const has = t => companies.find(x => x.t === t && x.t !== c.t);
    for (const t of (c.peers || [])) { const p = has(t); if (p) return p; }
    const bySize = companies.filter(x => x.t !== c.t).sort((x, y) => y.mcap - x.mcap);
    return bySize.find(x => x.sec === c.sec) || bySize[0] || null;
  }

  const api = { rebase, opponent };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();

/* ------------------------------------------------------------------ view --- */

const CMP = { a: '', b: '' };
const CMP_COL = { a: '#b9a3f5', b: '#f0a068' };          // checked for colour-blind separation

function cmpFind(t) {
  if (!t) return null;
  const u = String(t).toUpperCase();
  return FF_DATA.companies.find(c => c.t.toUpperCase() === u) || null;
}
function cmpPair() {
  const parts = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
  const dec = x => { try { return decodeURIComponent(x || ''); } catch (e) { return ''; } };
  let a = cmpFind(dec(parts[1])) || cmpFind(CMP.a) || cmpFind('NVDA') || [...FF_DATA.companies].sort((x, y) => y.mcap - x.mcap)[0];
  let b = cmpFind(dec(parts[2]));
  if (!b && !parts[1]) b = cmpFind(CMP.b);
  if (!b || b.t === a.t) b = FF_CMP.opponent(a, FF_DATA.companies);
  CMP.a = a.t; CMP.b = b ? b.t : '';
  return [a, b];
}
/* "The Coca-Cola Company" -> "Coca-Cola": the name people actually say. */
function cmpShort(c) {
  const n = c.n.replace(/^The /, '').split(/,| Inc\b| Corp| plc\b| Ltd\b| Co\b| Company\b| Holdings?\b| Group\b| N\.V\.| S\.A\.| SE\b| AG\b/)[0].trim();
  return n.length >= 2 ? n : c.n;
}
const cmpHref = (a, b) => `#/compare/${encodeURIComponent(a)}/${encodeURIComponent(b)}`;

/* The answer in sentences. Each one names the company it favours. */
function cmpVerdict(a, b) {
  const T = c => `<b class="cp-${c === a ? 'a' : 'b'}">${escapeHtml(c.t)}</b>`;
  const pc = (v, d = 0) => (Math.abs(v) * 100).toFixed(d) + '%';
  const m = MODEL.cur === 'mx' ? 'peer-multiples model' : 'DCF';
  const out = [];
  const ua = a.fv > 0 ? a.upside : null, ub = b.fv > 0 ? b.upside : null;

  if (ua != null && ub != null) {
    const [w, l] = ua >= ub ? [a, b] : [b, a];
    if (Math.abs(ua - ub) < 0.03) out.push(`Our ${m} barely separates them: ${T(a)} is ${FMT.pct(ua, 0)} from fair value and ${T(b)} ${FMT.pct(ub, 0)}.`);
    else if (l.upside > 0) out.push(`Both trade below our ${m} fair value, ${T(w)} by more: ${pc(w.upside)} upside against ${pc(l.upside)}.`);
    else if (w.upside > 0) out.push(`Our ${m} prefers ${T(w)}: it trades ${pc(w.upside)} below fair value, while ${T(l)} trades ${pc(l.upside)} above its own.`);
    else out.push(`Both trade above our ${m} fair value. ${T(w)} is the less stretched: ${pc(w.upside)} above, against ${pc(l.upside)} for ${T(l)}.`);
    // does the other model agree?
    const o = c => (MODEL.cur === 'mx' ? c._dcf : c.mx);
    const oa = o(a), ob = o(b);
    if (oa && ob && oa.fv > 0 && ob.fv > 0 && Math.abs(ua - ub) >= 0.03 && Math.abs(oa.upside - ob.upside) >= 0.03 && (oa.upside > ob.upside) !== (ua > ub))
      out.push(`The ${MODEL.cur === 'mx' ? 'DCF' : 'peer-multiples model'} disagrees and leans to ${T(oa.upside > ob.upside ? a : b)}, so this one depends on which model you trust.`);
  } else {
    const nm = ua == null ? a : b;
    out.push(`${T(nm)} has no meaningful fair value under our ${m}, so there is no verdict to compare. The business comparison below still holds.`);
  }

  if (a.cagr5 != null && b.cagr5 != null) {
    const [f, s] = a.cagr5 >= b.cagr5 ? [a, b] : [b, a];
    out.push(Math.abs(a.cagr5 - b.cagr5) < 0.02
      ? `Growth is a draw: we model sales rising about ${pc((a.cagr5 + b.cagr5) / 2)} a year for both over five years.`
      : `${T(f)} is the faster grower: we model sales rising ${pc(f.cagr5)} a year for five years, against ${pc(s.cagr5)} for ${T(s)}.`);
  }
  {
    const [h, l] = a.m0 >= b.m0 ? [a, b] : [b, a];
    const keep = c => c.m0 >= 0 ? `keeps ${pc(c.m0)} of every sales dollar as free cash` : `burns cash, about ${pc(c.m0)} of sales`;
    out.push(Math.abs(a.m0 - b.m0) < 0.02 ? `They are about equally profitable: each ${keep(a)}.`
      : l.m0 >= 0 ? `${T(h)} ${keep(h)}; ${T(l)} keeps ${pc(l.m0)}.`
      : `${T(h)} ${keep(h)}; ${T(l)} ${keep(l)}.`);
  }
  if (a.ev_sales > 0 && b.ev_sales > 0) {
    const [e, c] = a.ev_sales >= b.ev_sales ? [a, b] : [b, a];
    const gd = (e.cagr5 || 0) - (c.cagr5 || 0);
    const tail = e.ev_sales / c.ev_sales < 1.15 ? 'That is close to the same price tag.'
      : Math.abs(gd) < 0.02 ? 'That is a real premium for similar growth.'
      : gd > 0 ? 'The premium is the price of the faster growth.'
      : 'The cheaper one is also the faster grower, which is unusual.';
    out.push(`You pay ${e.ev_sales.toFixed(1)}x sales for ${T(e)} and ${c.ev_sales.toFixed(1)}x for ${T(c)}. ${tail}`);
  }
  {
    const cash = c => c.netdebt < 0 ? `holds ${FMT.usdB(Math.abs(c.netdebt))} more cash than debt` : c.netdebt > 0 ? `carries ${FMT.usdB(c.netdebt)} of net debt` : 'has no net debt';
    out.push(a.netdebt < 0 && b.netdebt < 0 ? `Both hold more cash than debt: ${T(a)} by ${FMT.usdB(Math.abs(a.netdebt))}, ${T(b)} by ${FMT.usdB(Math.abs(b.netdebt))}.`
      : a.netdebt > 0 && b.netdebt > 0 ? `Both carry net debt: ${T(a)} ${FMT.usdB(a.netdebt)}, ${T(b)} ${FMT.usdB(b.netdebt)}.`
      : `On the balance sheet, ${T(a)} ${cash(a)} and ${T(b)} ${cash(b)}.`);
  }
  return out;
}

function cmpSideHTML(c, side) {
  return `
  <a class="cp-side cp-side-${side}" href="#/company/${encodeURIComponent(c.t)}">
    <div class="cp-side-top"><span class="cp-tk">${escapeHtml(c.t)}</span><span class="rating-pill ${ratingClass(c.rating)}">${c.rating}</span></div>
    <div class="cp-nm">${escapeHtml(c.n)}</div>
    <div class="cp-sec">${escapeHtml(fmtSector(c.sec))}</div>
    <div class="cp-nums">
      <div><span>Price</span><b>${FMT.usd(c.price)}</b></div>
      <div><span>${modelName()} fair value</span><b class="gold" data-num="cp-fv-${side}" data-val="${c.fv}" data-fmt="usd">${fvStr(c.fv)}</b></div>
      <div><span>Upside</span><b class="${c.fv > 0 ? upClass(c.upside) : ''}" data-num="cp-up-${side}" data-val="${c.upside}" data-fmt="pct">${c.fv > 0 ? FMT.pct(c.upside) : 'N/M'}</b></div>
    </div>
    <span class="cp-open">Open the full valuation</span>
  </a>`;
}

function cmpTableHTML(a, b) {
  const pct = (v, d = 1) => v == null ? '—' : (v * 100).toFixed(d) + '%';
  const x = v => v > 0 ? v.toFixed(1) + 'x' : 'N/M';
  const other = c => (MODEL.cur === 'mx' ? c._dcf : c.mx);
  const otherName = MODEL.cur === 'mx' ? 'DCF' : 'Multiples';
  // [label, value(c) for the bar (null = no bar), text(c), plain-English note]
  const groups = [
    ['Size', [
      ['Market value', c => c.mcap, c => FMT.usdB(c.mcap)],
      ['Sales, past 12 months', c => c.rev, c => FMT.usdB(c.rev)],
    ]],
    ['Growth', [
      ['Sales growth next year', c => c.growth[0], c => pct(c.growth[0], 0)],
      ['Sales growth, 5-year average', c => c.cagr5, c => pct(c.cagr5)],
    ]],
    ['Profitability', [
      ['Free cash flow margin today', c => c.m0, c => pct(c.m0, 0)],
      ['Margin we model in year 5', c => c.m1, c => pct(c.m1, 0)],
      ['Free cash flow, past 12 months', c => c.ttm_fcf, c => FMT.usdB(c.ttm_fcf)],
    ]],
    ['Price tag', [
      ['EV / Sales', c => c.ev_sales, c => x(c.ev_sales)],
      ['EV / Free cash flow', c => c.ev_fcf, c => x(c.ev_fcf)],
      ['Free cash flow yield', c => c.fcf_yield, c => pct(c.fcf_yield)],
    ]],
    ['Model inputs', [
      ['Discount rate (WACC)', c => c.wacc, c => pct(c.wacc)],
      ['Net debt (negative is net cash)', null, c => FMT.usdB(c.netdebt)],
      ['Value that comes after year 10', c => c.tv_pct, c => c.tv_pct != null ? c.tv_pct.toFixed(0) + '%' : '—'],
    ]],
    ['Verdict', [
      [`Upside, ${modelName()}`, null, c => c.fv > 0 ? FMT.pct(c.upside) : 'N/M', c => c.fv > 0 ? upClass(c.upside) : ''],
      [`Upside, ${otherName}`, null, c => { const o = other(c); return o && o.fv > 0 ? FMT.pct(o.upside) : 'N/M'; }, c => { const o = other(c); return o && o.fv > 0 ? upClass(o.upside) : ''; }],
      ['Bear to bull fair value', null, c => c.fv_bear > 0 && c.fv_bull > 0 ? `${FMT.usd(c.fv_bear, 0)} to ${FMT.usd(c.fv_bull, 0)}` : 'N/M'],
    ]],
  ];
  return groups.map(([g, rows]) => `
    <div class="cp-group"><div class="cp-gh">${g}</div>
    ${rows.map(([label, val, txt, cls]) => {
      let bars = '';
      if (val) {
        const va = val(a), vb = val(b), mx = Math.max(Math.abs(va) || 0, Math.abs(vb) || 0);
        const w = v => (v > 0 && mx > 0 ? Math.max(2, v / mx * 100) : 0).toFixed(1);
        bars = `<div class="cp-bars" aria-hidden="true"><span><i class="a" style="width:${w(va)}%"></i></span><span><i class="b" style="width:${w(vb)}%"></i></span></div>`;
      }
      return `<div class="cp-row${val ? '' : ' nobar'}"><b class="va ${cls ? cls(a) : ''}">${txt(a)}</b><div class="cp-mid"><span>${label}</span>${bars}</div><b class="vb ${cls ? cls(b) : ''}">${txt(b)}</b></div>`;
    }).join('')}</div>`).join('');
}

function cmpSeries(c) {
  const s = typeof hasHistory === 'function' && hasHistory(c.t) ? pcSeries(c.t) : null;
  return s && s.closes.length > 20 ? { dates: s.dates.map(d => Math.round(d.getTime() / 86400000)), closes: s.closes } : null;
}

function cmpChartSVG(R, a, b, W, geo) {
  const narrow = W < 520, H = narrow ? 230 : 300;
  const n = R.d.length;
  let lo = 100, hi = 100;
  for (let i = 0; i < n; i++) { lo = Math.min(lo, R.a[i], R.b[i]); hi = Math.max(hi, R.a[i], R.b[i]); }
  const pad = (hi - lo) * 0.08 || 5; lo -= pad; hi += pad;
  const ticks = pcNiceTicks(lo, hi, narrow ? 3 : 4);
  const padL = 40, padR = narrow ? 62 : 76, padT = 12, padB = 26;
  const X = i => padL + (i / (n - 1)) * (W - padL - padR), Y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  Object.assign(geo, { X, Y, n, W, H, padL, padR });
  const line = arr => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
  const grid = ticks.filter(t => Y(t) > padT - 2 && Y(t) < H - padB + 1).map(t => `
    <line x1="${padL}" x2="${W - padR}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="pc-grid"/>
    <text x="${padL - 8}" y="${(Y(t) + 3.5).toFixed(1)}" class="pc-axis" text-anchor="end">${Math.round(t)}</text>`).join('');
  // month labels along the bottom
  const xl = []; let lastM = -1, lastX = -99;
  for (let i = 0; i < n; i++) {
    const d = new Date(R.d[i] * 86400000), mth = d.getUTCMonth();
    if (mth !== lastM) { lastM = mth; if (i > 0 && X(i) - lastX > (narrow ? 54 : 46) && X(i) < W - padR - 14) { xl.push(`<text x="${X(i).toFixed(1)}" y="${H - 8}" class="pc-axis" text-anchor="middle">${d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' })}</text>`); lastX = X(i); } }
  }
  let ya = Y(R.a[n - 1]), yb = Y(R.b[n - 1]);
  if (Math.abs(ya - yb) < 26) { const push = (26 - Math.abs(ya - yb)) / 2; if (ya <= yb) { ya -= push; yb += push; } else { ya += push; yb -= push; } }
  const end = (t, v, y, col) => `<text x="${(W - padR + 8).toFixed(1)}" y="${(y - 1).toFixed(1)}" class="cp-end" fill="${col}">${escapeHtml(t.length > 6 ? t.slice(0, 6) : t)}</text>
    <text x="${(W - padR + 8).toFixed(1)}" y="${(y + 11).toFixed(1)}" class="cp-end sub">${(v >= 100 ? '+' : '−') + Math.abs(v - 100).toFixed(0)}%</text>`;
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="pc-svg cp-svg" aria-hidden="true">
    ${grid}
    <line x1="${padL}" x2="${W - padR}" y1="${Y(100).toFixed(1)}" y2="${Y(100).toFixed(1)}" class="mc-today"/>
    <path d="${line(R.b)}" fill="none" stroke="${CMP_COL.b}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${line(R.a)}" fill="none" stroke="${CMP_COL.a}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${X(n - 1).toFixed(1)}" cy="${Y(R.b[n - 1]).toFixed(1)}" r="4" fill="${CMP_COL.b}" stroke="var(--ink)" stroke-width="2"/>
    <circle cx="${X(n - 1).toFixed(1)}" cy="${Y(R.a[n - 1]).toFixed(1)}" r="4" fill="${CMP_COL.a}" stroke="var(--ink)" stroke-width="2"/>
    ${end(a.t, R.a[n - 1], ya, CMP_COL.a)}${end(b.t, R.b[n - 1], yb, CMP_COL.b)}
    ${xl.join('')}
    <g class="cp-cross" style="display:none"><line class="mc-cross-line" y1="${padT}" y2="${H - padB}"/><circle r="4" fill="${CMP_COL.a}" stroke="var(--ink)" stroke-width="2"/><circle r="4" fill="${CMP_COL.b}" stroke="var(--ink)" stroke-width="2"/></g>
  </svg>`;
}

function cmpSlotHTML(c, side) {
  return `
  <div class="cp-slot" data-cp-slot="${side}">
    <i class="cp-dot" style="background:${CMP_COL[side]}"></i>
    <input type="text" autocomplete="off" spellcheck="false" aria-label="${side === 'a' ? 'First' : 'Second'} company: type a ticker or name" placeholder="Ticker or name" value="${escapeHtml(c.t)}">
    <span class="cp-slot-n">${escapeHtml(c.n)}</span>
    <div class="cp-sug" hidden></div>
  </div>`;
}

function viewCompare() {
  const [a, b] = cmpPair();
  if (!b) return view404();
  const verdict = cmpVerdict(a, b);
  const rivals = (a.peers || []).map(cmpFind).filter(p => p && p.t !== b.t && p.t !== a.t).slice(0, 5);
  const sa = cmpSeries(a), sb = cmpSeries(b);
  const R = sa && sb ? FF_CMP.rebase(sa, sb) : null;
  const hasChart = R && R.d.length > 20;
  const fmtD = d => new Date(d * 86400000).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Compare' })}
      <div class="eyebrow">Compare</div>
      <h1 style="font-size:32px;max-width:720px;">${escapeHtml(cmpShort(a))} or ${escapeHtml(cmpShort(b))}?</h1>
      <p style="max-width:600px;font-size:14.5px;">Two companies through the identical model, so the difference you see is the companies, not the method.</p>
      <div class="cp-pick" data-cp>
        ${cmpSlotHTML(a, 'a')}
        <a class="cp-swap" href="${cmpHref(b.t, a.t)}" aria-label="Swap the two companies" title="Swap">⇄</a>
        ${cmpSlotHTML(b, 'b')}
      </div>
      ${rivals.length ? `<div class="cp-rivals"><span>Other matchups for ${escapeHtml(a.t)}:</span>${rivals.map(p => `<a href="${cmpHref(a.t, p.t)}">${escapeHtml(p.t)}</a>`).join('')}</div>` : ''}
    </div>
  </section>
  <section style="padding-top:8px;">
    <div class="wrap">
      <div class="cp-duel">${cmpSideHTML(a, 'a')}<div class="cp-vs" aria-hidden="true">vs</div>${cmpSideHTML(b, 'b')}</div>

      <div class="cp-card">
        <div class="pf-h3">The short answer</div>
        <ul class="cp-verdict">${verdict.map(v => `<li>${v}</li>`).join('')}</ul>
      </div>

      ${hasChart ? `
      <div class="cp-card">
        <div class="cp-ch-head"><div class="pf-h3">Share price, from a common start of 100</div>
          <div class="cp-read" id="cp-read"></div></div>
        <figure class="cp-chart" id="cp-chart" role="img" tabindex="0" aria-label="Share prices since ${fmtD(R.d[0])}, both starting at 100. ${escapeHtml(a.t)} ends at ${R.a[R.a.length - 1].toFixed(0)}, ${escapeHtml(b.t)} at ${R.b[R.b.length - 1].toFixed(0)}."></figure>
        <p class="cp-note">Both lines start at 100 on ${fmtD(R.d[0])}, so 130 means up 30% since then. Past performance says nothing about which is cheaper today; that is what the model is for.</p>
      </div>` : ''}

      <div class="cp-card">
        <div class="cp-th"><span class="cp-a">${escapeHtml(a.t)}</span><div class="pf-h3">The numbers behind it</div><span class="cp-b">${escapeHtml(b.t)}</span></div>
        ${cmpTableHTML(a, b)}
        <p class="cp-note">Bars compare the two companies with each other on that line only. Every figure comes from the same model that produces the company pages.</p>
      </div>
    </div>
  </section>`;
}

function mountCompare(root) {
  const r = root || document;
  // ---- the two pickers
  r.querySelectorAll('[data-cp]').forEach(box => {
    if (box._cp) return; box._cp = true;
    box.querySelectorAll('[data-cp-slot]').forEach(slot => {
      const side = slot.dataset.cpSlot, inp = slot.querySelector('input'), sug = slot.querySelector('.cp-sug'), start = inp.value;
      const choose = t => {
        const pair = { a: CMP.a, b: CMP.b }; pair[side] = t;
        if (pair.a === pair.b) pair[side === 'a' ? 'b' : 'a'] = start;       // picked the other one: swap
        go(cmpHref(pair.a, pair.b));
      };
      const show = () => {
        const hits = searchCompanies(inp.value, 6);
        sug.innerHTML = hits.map(c => `<button type="button" data-cp-t="${escapeHtml(c.t)}"><b>${escapeHtml(c.t)}</b><span>${escapeHtml(c.n)}</span></button>`).join('');
        sug.hidden = !hits.length || !inp.value.trim();
      };
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('input', show);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { const first = sug.querySelector('[data-cp-t]'); if (first && !sug.hidden) { e.preventDefault(); choose(first.dataset.cpT); } }
        else if (e.key === 'Escape') { sug.hidden = true; inp.value = start; inp.blur(); }
        else if (e.key === 'ArrowDown') { const first = sug.querySelector('[data-cp-t]'); if (first) { e.preventDefault(); first.focus(); } }
      });
      sug.addEventListener('keydown', e => {
        const items = [...sug.querySelectorAll('[data-cp-t]')], i = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' && items[i + 1]) { e.preventDefault(); items[i + 1].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || inp).focus(); }
        else if (e.key === 'Escape') { sug.hidden = true; inp.value = start; }
      });
      sug.addEventListener('click', e => { const b = e.target.closest('[data-cp-t]'); if (b) choose(b.dataset.cpT); });
      slot.addEventListener('focusout', () => setTimeout(() => { if (!slot.contains(document.activeElement)) { sug.hidden = true; inp.value = start; } }, 120));
    });
  });

  // ---- the chart
  const fig = r.querySelector('#cp-chart');
  if (!fig || fig._cp) return; fig._cp = true;
  const [a, b] = [cmpFind(CMP.a), cmpFind(CMP.b)];
  const R = FF_CMP.rebase(cmpSeries(a), cmpSeries(b)), read = r.querySelector('#cp-read'), geo = {};
  const fmtD = d => new Date(d * 86400000).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  const sign = v => (v >= 100 ? '+' : '−') + Math.abs(v - 100).toFixed(1) + '%';
  const readout = i => { read.innerHTML = `<span>${fmtD(R.d[i])}</span><span><i style="background:${CMP_COL.a}"></i>${escapeHtml(a.t)} <b>${sign(R.a[i])}</b></span><span><i style="background:${CMP_COL.b}"></i>${escapeHtml(b.t)} <b>${sign(R.b[i])}</b></span>`; };
  const draw = () => { const W = Math.round(fig.clientWidth); if (W < 200) return; fig.innerHTML = cmpChartSVG(R, a, b, W, geo); };
  const n = R.d.length;
  let cur = n - 1;
  const show = i => {
    const g = fig.querySelector('.cp-cross'); if (!g || !geo.X) return;
    g.style.display = i === n - 1 && !fig.matches(':hover, :focus') ? 'none' : '';
    const x = geo.X(i), ln = g.querySelector('line'), cs = g.querySelectorAll('circle');
    ln.setAttribute('x1', x); ln.setAttribute('x2', x);
    cs[0].setAttribute('cx', x); cs[0].setAttribute('cy', geo.Y(R.a[i]));
    cs[1].setAttribute('cx', x); cs[1].setAttribute('cy', geo.Y(R.b[i]));
    readout(i);
  };
  draw(); readout(cur);
  if ('ResizeObserver' in window) { let last = 0; new ResizeObserver(() => { const w = Math.round(fig.clientWidth); if (w && w !== last) { last = w; draw(); } }).observe(fig); }
  else window.addEventListener('resize', draw);
  fig.addEventListener('pointermove', ev => {
    const rect = fig.getBoundingClientRect(), f = (ev.clientX - rect.left - geo.padL) / (geo.W - geo.padL - geo.padR);
    cur = Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))); show(cur);
  });
  fig.addEventListener('pointerleave', () => { cur = n - 1; show(cur); });
  fig.addEventListener('blur', () => { cur = n - 1; show(cur); });
  fig.addEventListener('keydown', ev => {
    const step = ev.shiftKey ? 21 : 1;
    if (ev.key === 'ArrowLeft') { cur = Math.max(0, cur - step); show(cur); ev.preventDefault(); }
    else if (ev.key === 'ArrowRight') { cur = Math.min(n - 1, cur + step); show(cur); ev.preventDefault(); }
  });
}
