/* ==========================================================================
   Interaction layer for the company pages, held to the same standard as the
   price chart and the model slider: things respond to the pointer, read out
   what is under it, and move rather than jump.

     modelSliderHTML / modelGaugeHTML   the DCF / peer multiples control,
                                        used in the header, the menu and on
                                        every company page, always in sync
     twCapture / twPlay                 when the model changes, bars slide
                                        and numbers count to their new value
     projChartHTML / mountProjCharts    the ten-year forecast as an
                                        interactive chart, tied to its table
     grid, football field, regression   hover read-outs (delegated, below)
   ========================================================================== */

const FF_REDUCED = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------- model controls -- */
function modelSliderHTML(variant = 'co') {
  const on = MODEL.cur === 'mx';
  const long = variant === 'co';
  return `
  <div class="mtog mtog-${variant}" data-mtog role="group" aria-label="Valuation model">
    <button type="button" class="mtog-l ${on ? '' : 'on'}" data-model="dcf" aria-pressed="${!on}">DCF</button>
    <button type="button" class="mtog-sw" role="switch" aria-checked="${on}" data-model="${on ? 'dcf' : 'mx'}"
      aria-label="Value companies at peer multiples instead of the DCF"><i></i></button>
    <button type="button" class="mtog-l ${on ? 'on' : ''}" data-model="mx" aria-pressed="${on}">${long ? 'Peer multiples' : 'Multiples'}</button>
  </div>`;
}

/* Bring every slider on the page into line with the current model. */
function syncModelControls() {
  const on = MODEL.cur === 'mx';
  document.querySelectorAll('[data-mtog]').forEach(t => {
    t.classList.remove('flip');
    const sw = t.querySelector('.mtog-sw');
    if (sw) { sw.setAttribute('aria-checked', String(on)); sw.dataset.model = on ? 'dcf' : 'mx'; }
    t.querySelectorAll('.mtog-l').forEach(l => l.classList.toggle('on', l.dataset.model === MODEL.cur));
  });
}

/* Both models and the price on one line. Each dot is a button: click the
   other model's dot to switch to it. */
function modelGaugeHTML(c) {
  const d = dcfOf(c).fv, m = c.mx ? c.mx.fv : 0, p = c.price;
  const pts = [d, m, p].filter(v => v > 0);
  if (!(p > 0) || pts.length < 2) return '';
  const lo = Math.min(...pts), hi = Math.max(...pts);
  const pad = (hi - lo) * 0.14 || hi * 0.1;
  const P = v => ((v - lo + pad) / (hi - lo + 2 * pad) * 100).toFixed(2);
  const both = d > 0 && m > 0;
  const dot = (k, v, name) => v > 0 ? `
    <button type="button" class="mg-dot ${k} ${both && v === Math.max(d, m) ? 'r' : 'l'}" data-model="${k}"
      aria-pressed="${MODEL.cur === k}" style="left:${P(v)}%" aria-label="${name}: ${FMT.usd(v)}. Show this model.">
      <em>${name} <b>${FMT.usd(v, 0)}</b></em></button>` : '';
  const gap = both ? m / d - 1 : null;
  const cap = gap == null ? (d > 0 ? 'Peer multiples give no usable value here.' : 'The DCF gives no usable value here.')
    : Math.abs(gap) < 0.1 ? 'The two models broadly agree.'
    : `Peer multiples come out ${Math.abs(gap * 100).toFixed(0)}% ${gap > 0 ? 'above' : 'below'} the DCF.`;
  return `
  <div class="mg" role="group" aria-label="The two models against the price">
    <div class="mg-track">
      ${both ? `<span class="mg-span" style="left:${Math.min(P(d), P(m))}%;width:${Math.abs(P(m) - P(d)).toFixed(2)}%"></span>` : ''}
      <span class="mg-price" style="left:${P(p)}%"><em>Price ${FMT.usd(p, 0)}</em></span>
      ${dot('dcf', d, 'DCF')}${dot('mx', m, 'Multiples')}
    </div>
    <div class="mg-cap">${cap}</div>
  </div>`;
}

function modelBarHTML(c) {
  return `<div class="co-modelbar">${modelSliderHTML('co')}${modelGaugeHTML(c)}</div>`;
}

let toastTimer = null;
function modelToast() {
  let t = document.getElementById('mtoast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'mtoast'; t.className = 'mtoast'; t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.innerHTML = MODEL.cur === 'mx'
    ? '<b>Peer multiples</b> Every fair value, rating and screen now uses the peers’ multiples.'
    : '<b>DCF</b> Every fair value, rating and screen is back on the discounted cash flow.';
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ------------------------------------------- slide and count on a switch --
   Anything marked data-tw="key" keeps its key across a redraw: its inline
   left/width/right are captured before, then animated to the new values.
   Anything marked data-num="key" data-val="123.4" data-fmt="usd|pct" counts
   from its old value to its new one. data-swap="key" pops when its text
   changes (a rating moving from Hold to Buy). */
function twCapture(root) {
  const s = { pos: {}, num: {}, txt: {} };
  root.querySelectorAll('[data-tw]').forEach(el => {
    s.pos[el.dataset.tw] = { left: el.style.left, width: el.style.width, right: el.style.right };
  });
  root.querySelectorAll('[data-num]').forEach(el => { s.num[el.dataset.num] = parseFloat(el.dataset.val); });
  root.querySelectorAll('[data-swap]').forEach(el => { s.txt[el.dataset.swap] = el.textContent.trim(); });
  return s;
}

function twPlay(root, s) {
  if (!s || FF_REDUCED()) return;
  const els = [...root.querySelectorAll('[data-tw]')].filter(el => s.pos[el.dataset.tw]);
  const now = els.map(el => ({ left: el.style.left, width: el.style.width, right: el.style.right }));
  els.forEach(el => { el.style.transition = 'none'; Object.assign(el.style, s.pos[el.dataset.tw]); });
  void root.offsetWidth;
  els.forEach((el, i) => {
    el.style.transition = 'left .6s var(--fluid), width .6s var(--fluid), right .6s var(--fluid)';
    Object.assign(el.style, now[i]);
  });
  root.querySelectorAll('[data-num]').forEach(el => {
    const a = s.num[el.dataset.num], b = parseFloat(el.dataset.val), fmt = el.dataset.fmt;
    if (!isFinite(a) || !isFinite(b) || a === b) return;
    if (fmt === 'usd' && !(a > 0 && b > 0)) return;
    const final = el.textContent, t0 = performance.now(), D = 520;
    const show = v => fmt === 'usd' ? FMT.usd(v) : fmt === 'x' ? FMT.x(v) : FMT.pct(v);
    const step = t => {
      if (!el.isConnected) return;
      const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      if (k < 1) { el.textContent = show(a + (b - a) * e); requestAnimationFrame(step); }
      else el.textContent = final;
    };
    requestAnimationFrame(step);
  });
  root.querySelectorAll('[data-swap]').forEach(el => {
    const was = s.txt[el.dataset.swap];
    if (was != null && was !== el.textContent.trim()) el.classList.add('swapped');
  });
}

/* --------------------------------------------- ten-year forecast chart -- */
const PJ_METRICS = [['rev', 'Revenue'], ['fcf', 'Free cash flow'], ['margin', 'Margin']];

function pjRows(c) {
  const rows = [{ i: 0, lab: 'TTM', name: 'Last twelve months', rev: c.rev, fcf: c.ttm_fcf,
                  margin: c.rev ? c.ttm_fcf / c.rev : 0, growth: null, pv: null, stage: 0 }];
  (c.model || []).forEach((r, k) => rows.push({ i: k + 1, lab: 'Y' + r.y, name: 'Year ' + r.y, rev: r.rev, fcf: r.fcf,
    margin: r.margin, growth: r.growth, pv: r.pv, stage: r.stage }));
  return rows;
}

function projChartHTML(c) {
  if (!c.model || !c.model.length) return '';
  const btns = PJ_METRICS.map(([k, l], i) =>
    `<button type="button" class="pc-range${i === 0 ? ' on' : ''}" data-pjm="${k}" aria-pressed="${i === 0}">${l}</button>`).join('');
  return `
  <figure class="pjc" data-pj="${c.t}">
    <div class="pc-head">
      <div class="pc-readout" aria-live="polite">
        <div class="pc-price pj-big"></div>
        <div class="pc-meta"><span class="pc-when pj-sub"></span></div>
      </div>
      <div class="pc-ranges" role="group" aria-label="What to chart">${btns}</div>
    </div>
    <div class="pc-plot pj-plot" tabindex="0" role="img"
      aria-label="Ten-year forecast for ${escapeHtml(c.n)}. Use the left and right arrow keys to step through the years."></div>
    <figcaption class="pc-key pj-key"></figcaption>
  </figure>`;
}

function pjRender(fig) {
  const plot = fig.querySelector('.pj-plot');
  const W = Math.round(plot.clientWidth);
  if (W < 60) return;
  const st = fig._pj, rows = st.rows, metric = st.metric;
  const H = W < 520 ? 210 : 250, padL = 50, padR = 10, padT = 22, padB = 26;
  const n = rows.length, slot = (W - padL - padR) / n, bw = Math.max(6, Math.min(34, slot * 0.58));
  const vals = rows.map(r => r[metric]);
  let lo = Math.min(0, ...vals), hi = Math.max(...vals, 0);
  if (metric === 'fcf') lo = Math.min(lo, ...rows.map(r => r.pv || 0));
  if (metric === 'margin' && lo >= 0) {
    const mn = Math.min(...vals), mxv = Math.max(...vals);
    lo = Math.max(0, mn - Math.max(0.04, (mxv - mn) * 1.2));
  }
  if (hi === lo) hi = lo + 1;
  const ticks = pcNiceTicks(lo, hi, 4);
  lo = Math.min(lo, ticks[0] != null ? ticks[0] : lo); hi = Math.max(hi * 1.04, ticks[ticks.length - 1]);
  const Y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const X = i => padL + slot * (i + 0.5);
  const fmtTick = v => metric === 'margin' ? (v * 100).toFixed(0) + '%' : FMT.usdB(v).replace(/\.0B$/, 'B');
  const anim = st.anim && !FF_REDUCED();
  st.anim = false;
  const fadeX = n > 6 ? padL + slot * 6 : null;
  let body = '';
  if (metric === 'margin') {
    const pts = rows.map(r => `${X(r.i).toFixed(1)},${Y(r.margin).toFixed(1)}`);
    body = `
      <path class="pj-area" fill="url(#pjA${st.uid})" d="M${X(0)},${Y(lo)} L${pts.join(' L')} L${X(n - 1)},${Y(lo)} Z"/>
      <path class="pj-line${anim ? ' draw' : ''}" d="M${pts.join(' L')}" pathLength="1"/>
      ${rows.map(r => `<circle class="pj-pt${r.i === 0 ? ' ttm' : ''}" data-i="${r.i}" cx="${X(r.i)}" cy="${Y(r.margin)}" r="4"/>`).join('')}`;
  } else {
    const zero = Y(0);
    body = rows.map(r => {
      const v = r[metric], y = Y(Math.max(v, 0)), h = Math.abs(Y(v) - zero);
      const pv = metric === 'fcf' && r.pv != null
        ? `<rect class="pj-pv" x="${(X(r.i) - bw * 0.28).toFixed(1)}" y="${Y(Math.max(r.pv, 0)).toFixed(1)}" width="${(bw * 0.56).toFixed(1)}" height="${Math.abs(Y(r.pv) - zero).toFixed(1)}" rx="2"/>` : '';
      return `<g class="pj-col${r.i === 0 ? ' ttm' : ''}${r.stage === 2 ? ' s2' : ''}" data-i="${r.i}"${anim ? ` style="animation-delay:${(r.i * 0.035).toFixed(3)}s"` : ''}>
        <rect class="pj-bar ${metric}${v < 0 ? ' neg' : ''}${anim ? ' grow' : ''}" fill="url(#pj${metric === 'rev' ? (r.stage === 2 ? 'R2' : 'R') : 'F'}${st.uid})" x="${(X(r.i) - bw / 2).toFixed(1)}" y="${(v < 0 ? zero : y).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="3"/>
        ${pv}</g>`;
    }).join('');
  }
  const svg = `
  <svg class="pc-svg pj-svg${anim ? ' anim' : ''}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="pjR${st.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7b5f7" stop-opacity=".95"/><stop offset="1" stop-color="#6d3fc0" stop-opacity=".55"/></linearGradient>
      <linearGradient id="pjR2${st.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a3f5" stop-opacity=".55"/><stop offset="1" stop-color="#52349a" stop-opacity=".35"/></linearGradient>
      <linearGradient id="pjF${st.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4c97a" stop-opacity=".5"/><stop offset="1" stop-color="#c9a227" stop-opacity=".18"/></linearGradient>
      <linearGradient id="pjA${st.uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a3f5" stop-opacity=".22"/><stop offset="1" stop-color="#b9a3f5" stop-opacity="0"/></linearGradient>
    </defs>
    ${fadeX ? `<rect class="pj-fade" x="${fadeX}" y="${padT - 14}" width="${W - padR - fadeX}" height="${H - padB - padT + 14}" rx="8"/>
      <text class="pj-fade-lab" x="${fadeX + 8}" y="${padT - 3}">fade to terminal growth</text>` : ''}
    ${ticks.map(v => `<line class="pc-grid" x1="${padL}" x2="${W - padR}" y1="${Y(v)}" y2="${Y(v)}"/>
      <text class="pc-axis" x="${padL - 8}" y="${Y(v) + 3.5}" text-anchor="end">${fmtTick(v)}</text>`).join('')}
    ${lo < 0 ? `<line class="pj-zero" x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}"/>` : ''}
    <line class="pc-cross pj-cross" x1="0" x2="0" y1="${padT - 6}" y2="${H - padB}" style="display:none"/>
    ${body}
    ${rows.map(r => `<text class="pc-axis pj-xl" data-i="${r.i}" x="${X(r.i)}" y="${H - 8}" text-anchor="middle">${r.lab}</text>`).join('')}
  </svg>`;
  plot.innerHTML = svg;
  st.geo = { X, slot, padL, n };
  fig.querySelector('.pj-key').innerHTML = metric === 'fcf'
    ? `<span><i class="k-bar fcf"></i>Free cash flow that year</span><span><i class="k-bar pv"></i>What it is worth today, discounted at ${FMT.pctPlain(st.c.wacc)}</span>`
    : metric === 'rev'
      ? `<span><i class="k-bar rev"></i>Revenue</span><span class="dim">Years 6 to 10 fade toward ${FMT.pctPlain(st.c.tg)} growth</span>`
      : `<span><i class="k-line"></i>Free cash flow margin</span><span class="dim">Target by year 5: ${FMT.pctPlain(st.c.m1)}</span>`;
  pjHover(fig, st.hover);
}

function pjReadout(fig, i) {
  const st = fig._pj, c = st.c, rows = st.rows, m = st.metric;
  const big = fig.querySelector('.pj-big'), sub = fig.querySelector('.pj-sub');
  const last = rows[rows.length - 1];
  if (i == null) {
    if (m === 'rev') { big.textContent = FMT.usdB(last.rev); sub.textContent = `revenue in year ${last.i}, ${(last.rev / c.rev).toFixed(1)}x today's ${FMT.usdB(c.rev)}`; }
    else if (m === 'fcf') { big.textContent = FMT.usdB(c.dcf.pv_explicit); sub.textContent = `ten years of free cash flow, worth this much today`; }
    else { big.textContent = FMT.pctPlain(last.margin); sub.textContent = `margin by year ${last.i}, from ${FMT.pctPlain(rows[0].margin)} today`; }
    return;
  }
  const r = rows[i];
  big.textContent = m === 'margin' ? FMT.pctPlain(r.margin) : FMT.usdB(r[m]);
  const bits = [r.name];
  if (m !== 'rev') bits.push(`revenue ${FMT.usdB(r.rev)}`);
  if (r.growth != null) bits.push(`growth ${FMT.pct(r.growth)}`);
  if (m !== 'margin') bits.push(`margin ${FMT.pctPlain(r.margin)}`);
  if (m === 'fcf' && r.pv != null) bits.push(`worth ${FMT.usdB(r.pv)} today`);
  if (m === 'margin') bits.push(`free cash flow ${FMT.usdB(r.fcf)}`);
  sub.textContent = bits.join(' · ');
}

function pjHover(fig, i) {
  const st = fig._pj, g = st.geo, svg = fig.querySelector('.pj-svg');
  if (!g || !svg) return;
  if (i != null) i = Math.max(0, Math.min(g.n - 1, i));
  st.hover = i;
  svg.classList.toggle('scrubbing', i != null);
  svg.querySelectorAll('[data-i]').forEach(el => el.classList.toggle('on', i != null && +el.dataset.i === i));
  const cross = svg.querySelector('.pj-cross');
  if (i == null) cross.style.display = 'none';
  else { cross.style.display = ''; cross.setAttribute('x1', g.X(i)); cross.setAttribute('x2', g.X(i)); }
  pjReadout(fig, i);
  const table = fig.parentElement && fig.parentElement.querySelector('.model-table');
  if (table) table.querySelectorAll('tr[data-pj-i]').forEach(tr => tr.classList.toggle('pj-hl', i != null && +tr.dataset.pjI === i));
}

let pjUid = 0;
function mountProjCharts(root) {
  (root || document).querySelectorAll('.pjc').forEach(fig => {
    if (fig._pj) return;
    const c = byT(fig.dataset.pj);
    if (!c) return;
    fig._pj = { c, rows: pjRows(c), metric: 'rev', hover: null, anim: true, uid: ++pjUid };
    const plot = fig.querySelector('.pj-plot');
    if ('ResizeObserver' in window) {
      let lastW = 0;
      new ResizeObserver(() => {
        const w = Math.round(plot.clientWidth);
        if (w && w !== lastW) { if (!lastW) fig._pj.anim = true; lastW = w; pjRender(fig); }
      }).observe(plot);
    } else window.addEventListener('resize', () => pjRender(fig));
    pjRender(fig);
    fig.querySelector('.pc-ranges').addEventListener('click', e => {
      const b = e.target.closest('[data-pjm]');
      if (!b || b.dataset.pjm === fig._pj.metric) return;
      fig.querySelectorAll('[data-pjm]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      fig._pj.metric = b.dataset.pjm; fig._pj.anim = true;
      pjRender(fig);
    });
    const idxAt = ev => {
      const g = fig._pj.geo;
      if (!g) return null;
      return Math.floor((ev.clientX - plot.getBoundingClientRect().left - g.padL) / g.slot);
    };
    plot.addEventListener('pointermove', ev => pjHover(fig, idxAt(ev)));
    plot.addEventListener('pointerdown', ev => pjHover(fig, idxAt(ev)));
    plot.addEventListener('pointerleave', () => pjHover(fig, null));
    plot.addEventListener('keydown', ev => {
      const g = fig._pj.geo; if (!g) return;
      const cur = fig._pj.hover == null ? -1 : fig._pj.hover;
      const k = { ArrowLeft: Math.max(0, cur - 1), ArrowRight: Math.min(g.n - 1, cur + 1), Home: 0, End: g.n - 1 }[ev.key];
      if (k != null) { ev.preventDefault(); pjHover(fig, k); }
      else if (ev.key === 'Escape') pjHover(fig, null);
    });
    plot.addEventListener('blur', () => pjHover(fig, null));
    const table = fig.parentElement && fig.parentElement.querySelector('.model-table');
    if (table) {
      table.addEventListener('pointerover', e => { const tr = e.target.closest('tr[data-pj-i]'); if (tr) pjHover(fig, +tr.dataset.pjI); });
      table.addEventListener('pointerleave', () => pjHover(fig, null));
    }
  });
}

/* ------------------------------------------------- hover read-outs -------- */
function gridRead(table, td) {
  const out = table.parentElement.querySelector('.grid-read');
  table.querySelectorAll('.hl, .hl-r, .hl-c').forEach(x => x.classList.remove('hl', 'hl-r', 'hl-c'));
  if (!td) { if (out) out.innerHTML = out.dataset.idle; return; }
  const r = td.dataset.r, c = td.dataset.c;
  table.querySelectorAll(`[data-r="${r}"]`).forEach(x => x.classList.add('hl-r'));
  table.querySelectorAll(`[data-c="${c}"]`).forEach(x => x.classList.add('hl-c'));
  td.classList.add('hl');
  if (!out) return;
  const v = +td.dataset.v, price = +table.dataset.price;
  const rh = table.querySelector(`th[data-r="${r}"], td.axis[data-r="${r}"]`), ch = table.querySelector(`th[data-c="${c}"]`);
  const gap = price > 0 && v > 0 ? v / price - 1 : null;
  out.innerHTML = `${table.dataset.rn} <b>${rh ? rh.textContent : ''}</b>, ${table.dataset.cn} <b>${ch ? ch.textContent : ''}</b>: `
    + (v > 0 ? `<b class="gv">${FMT.usd(v)}</b> a share${gap != null ? `, <span class="${upClass(gap)}">${Math.abs(gap * 100).toFixed(0)}% ${gap >= 0 ? 'above' : 'below'}</span> today's price` : ''}.`
             : `no positive value per share.`);
}

function ffRead(chart, row) {
  const out = chart.parentElement.querySelector('.ff-read');
  if (!out) return;
  if (!row) { out.innerHTML = out.dataset.idle; return; }
  const lo = +row.dataset.lo, mid = +row.dataset.mid, hi = +row.dataset.hi, price = +chart.dataset.price;
  const gap = mid > 0 ? mid / price - 1 : null;
  out.innerHTML = `<b>${row.querySelector('.ff-lab').textContent}</b>: ${FMT.usd(Math.max(lo, 0), 0)} to ${FMT.usd(hi, 0)}`
    + (mid > 0 ? `, middle <b class="gv">${FMT.usd(mid, 0)}</b>, <span class="${upClass(gap)}">${Math.abs(gap * 100).toFixed(0)}% ${gap >= 0 ? 'above' : 'below'}</span> the price.` : '.');
}

document.addEventListener('pointerover', e => {
  const td = e.target.closest && e.target.closest('.grid-table td[data-v]');
  if (td) gridRead(td.closest('.grid-table'), td);
  const row = e.target.closest && e.target.closest('.ff-row');
  if (row) ffRead(row.closest('.ff-chart'), row);
  const dot = e.target.closest && e.target.closest('.mx-reg [data-tip]');
  if (dot) { const out = dot.closest('.card').querySelector('.mx-reg-read'); if (out) out.innerHTML = dot.dataset.tip; }
});
document.addEventListener('pointerout', e => {
  const leaving = (sel, fn) => {
    const from = e.target.closest && e.target.closest(sel);
    if (from && !(e.relatedTarget && from.contains(e.relatedTarget))) fn(from);
  };
  leaving('.grid-table', t => gridRead(t, null));
  leaving('.ff-chart', c => ffRead(c, null));
  leaving('.mx-reg', s => { const out = s.closest('.card').querySelector('.mx-reg-read'); if (out) out.innerHTML = out.dataset.idle; });
});
