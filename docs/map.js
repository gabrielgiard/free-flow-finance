/* ============================================================================
   MARKET MAP
   ----------------------------------------------------------------------------
   The whole library in one picture: every company is a tile, its area is its
   market value, its colour is how far the price sits from our fair value.
   Sectors are grouped, so you can see at a glance where the market looks
   stretched and where it looks cheap.

   Two parts:
     FF_MAP   the layout and colour maths. No page code in it, so map_test.js
              can check it under Node (areas add up, nothing overlaps, ...).
     the view the map page (#/map), the homepage band, hover and tap details.

   Colour follows the DCF / Multiples switch like every other number on the
   site, and can also show plain price moves (day, month, year).

   The green and red here are deliberately a little more teal and a little more
   coral than the site's rating colours: about one man in twelve cannot tell
   the standard green from the standard red, and on a map colour is carrying
   the whole message. Every tile big enough also prints its signed percentage.
   ========================================================================== */

const FF_MAP = (() => {
  'use strict';

  /* Squarified treemap (Bruls, Huizing, van Wijk). Returns one rect per value,
     in the order the values were given. Values need not be sorted. */
  function squarify(values, x, y, w, h) {
    const n = values.length, out = new Array(n);
    const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
    const total = values.reduce((s, v) => s + Math.max(0, v), 0);
    if (!(total > 0) || !(w > 0) || !(h > 0)) {
      for (let i = 0; i < n; i++) out[i] = { x, y, w: 0, h: 0 };
      return out;
    }
    const scale = w * h / total;
    const area = order.map(i => Math.max(0, values[i]) * scale);
    const worst = (lo, hi, sum, side) => {           // worst aspect ratio in a row
      const s2 = side * side, q = sum * sum;
      return Math.max(s2 * area[lo] / q, q / (s2 * area[hi]));
    };
    let i = 0;
    while (i < n) {
      const side = Math.min(w, h);
      let j = i, sum = area[i];
      while (j + 1 < n && area[j + 1] > 0 &&
             worst(i, j + 1, sum + area[j + 1], side) <= worst(i, j, sum, side)) { j++; sum += area[j]; }
      if (w >= h) {                                   // a column down the left edge
        const rw = h > 0 ? sum / h : 0;
        let yy = y;
        for (let k = i; k <= j; k++) { const rh = rw > 0 ? area[k] / rw : 0; out[order[k]] = { x, y: yy, w: rw, h: rh }; yy += rh; }
        x += rw; w -= rw;
      } else {                                        // a row along the top edge
        const rh = w > 0 ? sum / w : 0;
        let xx = x;
        for (let k = i; k <= j; k++) { const rw = rh > 0 ? area[k] / rh : 0; out[order[k]] = { x: xx, y, w: rw, h: rh }; xx += rw; }
        y += rh; h -= rh;
      }
      i = j + 1;
    }
    return out;
  }

  /* groups: [{ k, items: [{ t, v }] }]
     Wide screens: one treemap, sectors packed inside it.
     opts.stacked: one full-width block per sector, stacked (phones).
     Returns { sectors: [{k,x,y,w,h,head}], tiles: [{t,k,x,y,w,h}], height }. */
  function layout(groups, W, H, opts) {
    const o = Object.assign({ head: 18, floor: 0.0003, sectorFloor: 0, stacked: false, stackHead: 28, stackGap: 12, stackMin: 150 }, opts || {});
    const total = groups.reduce((s, g) => s + g.items.reduce((a, it) => a + Math.max(0, it.v), 0), 0);
    // The very smallest companies would be a pixel or two; draw them no smaller
    // than a visible dot. (The page says so.)
    const floorV = total * o.floor;
    const sized = groups.map(g => {
      // on a phone each sector has its own block, so the floor is a share of the sector instead
      const lo = Math.max(floorV, o.sectorFloor * g.items.reduce((a, it) => a + Math.max(0, it.v), 0));
      const vals = g.items.map(it => Math.max(it.v > 0 ? it.v : 0, lo));
      return { g, vals, sum: vals.reduce((a, b) => a + b, 0) };
    }).filter(s => s.g.items.length);
    const sectors = [], tiles = [];
    let rects, height = H;
    if (o.stacked) {
      const roots = sized.map(s => Math.sqrt(s.sum)), rs = roots.reduce((a, b) => a + b, 0);
      let y = 0;
      rects = sized.map((s, i) => {
        const h = Math.max(o.stackMin, Math.round(H * roots[i] / rs));
        const r = { x: 0, y, w: W, h: h + o.stackHead };
        y += h + o.stackHead + o.stackGap;
        return r;
      });
      height = y - o.stackGap;
    } else {
      rects = squarify(sized.map(s => s.sum), 0, 0, W, H);
    }
    sized.forEach((s, i) => {
      const r = rects[i];
      let head = o.stacked ? o.stackHead : o.head;
      if (r.h < head + 14 || r.w < 30) head = 0;
      sectors.push({ k: s.g.k, x: r.x, y: r.y, w: r.w, h: r.h, head });
      const inner = squarify(s.vals, r.x, r.y + head, r.w, Math.max(0, r.h - head));
      s.g.items.forEach((it, j) => tiles.push(Object.assign({ t: it.t, k: s.g.k }, inner[j])));
    });
    return { sectors, tiles, height };
  }

  /* Diverging colour: two hues and a neutral middle. v is a signed fraction
     (+0.25 = 25% upside); clamp is where the colour stops getting stronger. */
  const POS = [63, 179, 154], NEG = [224, 112, 95], MID = [44, 42, 58];
  function fill(v, clamp) {
    if (v == null || !isFinite(v)) return null;
    const t = Math.pow(Math.min(1, Math.abs(v) / clamp), 0.8);
    const p = v >= 0 ? POS : NEG;
    const c = MID.map((m, i) => Math.round(m + (p[i] - m) * t));
    return { css: 'rgb(' + c.join(',') + ')', dark: t > 0.62, t };
  }

  const api = { squarify, layout, fill, POS, NEG, MID };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();

/* ------------------------------------------------------------------ view --- */

const MAP_MODES = {
  gap: { label: 'vs fair value', clamp: 0.5, lo: 'Price above fair value', hi: 'Price below fair value' },
  d1:  { label: '1 day',   clamp: 0.03, lo: 'Fell', hi: 'Rose' },
  m1:  { label: '1 month', clamp: 0.15, lo: 'Fell', hi: 'Rose' },
  y1:  { label: '1 year',  clamp: 0.60, lo: 'Fell', hi: 'Rose' },
};
const MAPUI = { color: 'gap', size: 'mcap', moves: null };

/* Price change over the last 1 / 21 / 252 sessions, from history.js. */
function mapMoves() {
  if (MAPUI.moves) return MAPUI.moves;
  const m = { d1: {}, m1: {}, y1: {}, any: false };
  FF_DATA.companies.forEach(c => {
    const s = typeof hasHistory === 'function' && hasHistory(c.t) ? pcSeries(c.t) : null;
    if (!s || s.closes.length < 2) return;
    const n = s.closes.length, last = s.closes[n - 1];
    m.d1[c.t] = last / s.closes[n - 2] - 1;
    if (n > 21) m.m1[c.t] = last / s.closes[n - 22] - 1;
    if (n > 120) m.y1[c.t] = last / s.closes[0] - 1;
    m.any = true;
  });
  return (MAPUI.moves = m);
}
function mapValue(c, mode) {
  if (mode === 'gap') return c.fv > 0 ? c.upside : null;
  const v = mapMoves()[mode][c.t];
  return v == null ? null : v;
}

/* The library as if it were one company: total fair value against total market value. */
function mapLibraryGap() {
  let mv = 0, fv = 0, below = 0, n = 0;
  FF_DATA.companies.forEach(c => {
    if (!(c.fv > 0) || !(c.mcap > 0)) return;
    mv += c.mcap; fv += c.mcap * (1 + c.upside); n++;
    if (c.upside > 0) below++;
  });
  return { gap: mv ? fv / mv - 1 : 0, below, n };
}

function mapLegendHTML(mode) {
  const M = MAP_MODES[mode], steps = [-1, -0.5, 0, 0.5, 1];
  const lab = f => f === 0 ? (mode === 'gap' ? 'fair' : '0') : (Math.abs(f) === 1 ? (f < 0 ? '≤ −' : '≥ +') : (f < 0 ? '−' : '+')) + +(Math.abs(f) * M.clamp * 100).toFixed(1) + '%';
  return `<span class="mm-lg-end">${M.lo}</span>` + steps.map(f => {
    const c = FF_MAP.fill(f * M.clamp, M.clamp);
    return `<i style="background:${c.css};color:${c.dark ? '#0a0718' : 'var(--text)'}">${lab(f)}</i>`;
  }).join('') + `<span class="mm-lg-end">${M.hi}</span><span class="mm-lg-nm"><i class="mm-nm"></i>no ${mode === 'gap' ? 'meaningful fair value' : 'price history'}</span>`;
}

function mapShellHTML(variant) {
  return `
  <div class="mm" data-mm="${variant}">
    <div class="mm-stage" role="group" aria-label="Market map: every company as a tile. The same data is in the screener as a table."></div>
    <div class="mm-info" aria-live="polite" hidden></div>
    <div class="mm-tip" hidden></div>
  </div>`;
}

function viewMap() {
  const lib = mapLibraryGap(), hasMoves = mapMoves().any;
  if (!hasMoves && MAPUI.color !== 'gap') MAPUI.color = 'gap';
  const modelWord = MODEL.cur === 'mx' ? 'peer-multiples' : 'DCF';
  const seg = (attr, cur, opts) => opts.map(([v, l]) =>
    `<button type="button" class="pc-range${cur === v ? ' on' : ''}" ${attr}="${v}" aria-pressed="${cur === v}">${l}</button>`).join('');
  const colorOpts = Object.keys(MAP_MODES).filter(k => k === 'gap' || hasMoves).map(k => [k, MAP_MODES[k].label]);
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Market map' })}
      <div class="mm-head">
        <div>
          <div class="eyebrow">Market map</div>
          <h1 style="font-size:32px;max-width:680px;">The whole library in one picture.</h1>
          <p style="max-width:540px;font-size:14.5px;">Every company is one tile. The bigger the tile, the bigger the company. The colour says how far today's price sits from our ${modelWord} fair value.</p>
        </div>
        <div class="mm-stats">
          <div><b class="${lib.gap >= 0 ? 'upside-pos' : 'upside-neg'}" data-num="mm-lib" data-val="${lib.gap}" data-fmt="pct">${FMT.pct(lib.gap)}</b><span>the whole library against fair value, weighted by size</span></div>
          <div><b>${lib.below}<small> of ${lib.n}</small></b><span>companies priced below our fair value</span></div>
        </div>
      </div>
    </div>
  </section>
  <section class="mm-page" style="padding-top:8px;">
    <div class="wrap">
      <div class="mm-ctl">
        <div class="mm-ctl-g"><span>Colour</span><div class="pc-ranges" role="group" aria-label="What the colour shows">${seg('data-mm-color', MAPUI.color, colorOpts)}</div></div>
        <div class="mm-ctl-g"><span>Size</span><div class="pc-ranges" role="group" aria-label="What the tile size shows">${seg('data-mm-size', MAPUI.size, [['mcap', 'Market value'], ['equal', 'Equal']])}</div></div>
        <div class="mm-ctl-g mm-ctl-model"><span>Model</span>${modelSliderHTML('hdr')}</div>
      </div>
      ${mapShellHTML('page')}
      <div class="mm-legend" data-mm-legend>${mapLegendHTML(MAPUI.color)}</div>
      <p class="mm-foot">Hover or tap a tile for the numbers, click to open the company. The smallest companies are drawn a touch larger than scale so they stay visible. Prefer a table? <a href="#/screener">The screener</a> has the same data, sortable.</p>
    </div>
  </section>`;
}

/* The homepage band: the same map, fixed to "market value, vs fair value". */
function homeMapHTML() {
  const lib = mapLibraryGap();
  const modelWord = MODEL.cur === 'mx' ? 'peer multiples' : 'the DCF';
  return `
  <section class="home-band mm-home">
    <div class="wrap">
      <div class="hb-head">
        <div><div class="eyebrow">Market map</div><h2>The whole library in one picture</h2>
          <p class="sub"><span class="mm-cap-co">Each tile is a company, sized by market value.</span><span class="mm-cap-sec">Each tile is a sector, sized by market value.</span> Green is priced below our fair value under ${modelWord}, red is above. Taken together, the library trades <b class="${lib.gap >= 0 ? 'upside-pos' : 'upside-neg'}">${FMT.pct(Math.abs(lib.gap), 0).replace(/^[+-]/, '')} ${lib.gap >= 0 ? 'below' : 'above'}</b> fair value.</p></div>
        <span class="section-link" data-route="map">Open the full map</span>
      </div>
      ${mapShellHTML('home')}
      <div class="mm-legend">${mapLegendHTML('gap')}</div>
    </div>
  </section>`;
}

function mapTipHTML(c, mode) {
  const v = mapValue(c, mode);
  const row = (k, val, cls = '') => `<div class="mm-row"><span>${k}</span><b class="${cls}">${val}</b></div>`;
  return `
    <div class="mm-tip-h"><b>${escapeHtml(c.t)}</b><span>${escapeHtml(c.n)}</span></div>
    <div class="mm-tip-s">${escapeHtml(fmtSector(c.sec))} · ${FMT.usdB(c.mcap)}</div>
    ${row('Price', FMT.usd(c.price))}
    ${row(modelName() + ' fair value', fvStr(c.fv), 'gold')}
    ${row('Upside', c.fv > 0 ? FMT.pct(c.upside) : 'N/M', c.fv > 0 ? upClass(c.upside) : '')}
    ${mode !== 'gap' ? row(MAP_MODES[mode].label + ' move', v == null ? 'n/a' : FMT.pct(v), v == null ? '' : upClass(v)) : ''}
    ${row('Rating', c.rating)}`;
}

function mountMap(root) {
  (root || document).querySelectorAll('[data-mm]').forEach(box => {
    if (box._mm) return; box._mm = true;
    const variant = box.dataset.mm, stage = box.querySelector('.mm-stage'), tip = box.querySelector('.mm-tip'), info = box.querySelector('.mm-info');
    const page = box.closest('.mm-page');
    const SHORT = typeof SHORT_SECTOR !== 'undefined' ? SHORT_SECTOR : {};
    let built = '', selected = null;

    const mode = () => variant === 'page' ? MAPUI.color : 'gap';
    const pct = v => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(Math.abs(v) < 0.0995 ? 1 : 0) + '%';

    /* Sector-level tiles for the homepage on a phone: 300 tiles do not fit in
       a thumb's width, eleven do. */
    const sectorRows = () => FF_DATA.sectors.map(s => {
      let mv = 0, fv = 0;
      inSector(s.k).forEach(c => { if (c.fv > 0) { mv += c.mcap; fv += c.mcap * (1 + c.upside); } });
      return { k: s.k, n: SHORT[s.k] || s.n, mcap: inSector(s.k).reduce((a, c) => a + c.mcap, 0), gap: mv ? fv / mv - 1 : null, count: s.count };
    });

    function draw() {
      const W = Math.round(stage.clientWidth);
      if (W < 120) return;
      const narrow = W < 640;
      const kind = variant === 'home' && narrow ? 'sectors' : narrow ? 'stacked' : 'wide';
      const m = mode(), M = MAP_MODES[m];

      const band = box.closest('.mm-home');
      if (band) band.classList.toggle('mm-secs', kind === 'sectors');
      if (kind === 'sectors') {
        const rows = sectorRows();
        const H = Math.round(Math.min(420, Math.max(300, W * 0.95)));
        const rects = FF_MAP.squarify(rows.map(r => r.mcap), 0, 0, W, H);
        stage.style.height = H + 'px';
        stage.innerHTML = rows.map((r, i) => {
          const c = FF_MAP.fill(r.gap, 0.4), b = rects[i];
          return `<a class="mm-t mm-big${c && c.dark ? ' ink' : ''}${b.w < 80 ? ' sm' : ''}" href="#/map" data-sec="${r.k}" aria-label="${escapeHtml(r.n)}: ${r.gap == null ? 'no fair value' : pct(r.gap) + ' against fair value'}"
            style="left:${(b.x + 1).toFixed(1)}px;top:${(b.y + 1).toFixed(1)}px;width:${Math.max(1, b.w - 2).toFixed(1)}px;height:${Math.max(1, b.h - 2).toFixed(1)}px;background:${c ? c.css : ''}">
            ${b.w > 46 && b.h > 30 ? `<b>${escapeHtml(b.w < 118 ? r.n.split(/[ ,&]/)[0] : r.n)}</b>` : ''}${b.w > 44 && b.h > 50 && r.gap != null ? `<i>${pct(r.gap)}</i>` : ''}</a>`;
        }).join('');
        built = 'sectors'; box.classList.add('ready');
        return;
      }

      const groups = FF_DATA.sectors.map(s => ({ k: s.k, items: inSector(s.k).map(c => ({ t: c.t, v: MAPUI.size === 'equal' && variant === 'page' ? 1 : c.mcap })) }));
      const H = kind === 'stacked' ? 2300 : Math.round(variant === 'home' ? Math.min(520, Math.max(380, W * 0.46)) : Math.min(Math.max(460, window.innerHeight - 250), W * 0.66));
      const L = FF_MAP.layout(groups, W, H, { stacked: kind === 'stacked', floor: MAPUI.size === 'equal' ? 0 : (kind === 'stacked' ? 0 : 0.0003), sectorFloor: kind === 'stacked' && MAPUI.size !== 'equal' ? 0.004 : 0 });
      stage.style.height = Math.round(L.height) + 'px';

      if (built !== 'tiles') {                         // build the nodes once; afterwards they only move and recolour
        stage.innerHTML = FF_DATA.sectors.map(s => `<a class="mm-sec" href="#/sector/${s.k}" data-sec="${s.k}"><span>${escapeHtml(SHORT[s.k] || s.n)}</span></a>`).join('') +
          FF_DATA.companies.map(c => `<a class="mm-t" href="#/company/${encodeURIComponent(c.t)}" data-t="${escapeHtml(c.t)}" tabindex="-1"><b></b><i></i></a>`).join('');
        built = 'tiles';
      }
      const nodes = {}; stage.querySelectorAll('.mm-t').forEach(n => { nodes[n.dataset.t] = n; });
      const secs = {}; stage.querySelectorAll('.mm-sec').forEach(n => { secs[n.dataset.sec] = n; });
      box.classList.toggle('stacked', kind === 'stacked');

      L.sectors.forEach(s => {
        const n = secs[s.k]; if (!n) return;
        n.style.cssText = `left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;width:${Math.max(0, s.w - 2).toFixed(1)}px;height:${s.head}px;${s.head ? '' : 'display:none'}`;
      });
      L.tiles.forEach(tl => {
        const n = nodes[tl.t], c = byT(tl.t); if (!n || !c) return;
        const w = Math.max(1, tl.w - 2), h = Math.max(1, tl.h - 2);
        const v = mapValue(c, m), col = FF_MAP.fill(v, M.clamp);
        n.style.left = (tl.x + 1).toFixed(1) + 'px'; n.style.top = (tl.y + 1).toFixed(1) + 'px';
        n.style.width = w.toFixed(1) + 'px'; n.style.height = h.toFixed(1) + 'px';
        n.style.background = col ? col.css : '';
        n.classList.toggle('nm', !col);
        n.classList.toggle('ink', !!(col && col.dark));
        // the ticker as large as the tile allows; the number under it when there is room
        const fs = Math.max(0, Math.min(30, (w - 8) / (c.t.length * 0.66), (h - 6) / 1.25));
        const showT = fs >= 8.5, showV = showT && h >= fs * 2.15 + 8 && w >= 40;
        const tEl = n.firstChild, vEl = n.lastChild;
        tEl.textContent = showT ? c.t : ''; tEl.style.fontSize = Math.min(fs, 26).toFixed(1) + 'px';
        vEl.textContent = showV ? (v == null ? 'N/M' : pct(v)) : '';
        vEl.style.fontSize = Math.max(9.5, Math.min(13, fs * 0.6)).toFixed(1) + 'px';
        n.setAttribute('aria-label', `${c.n}: ${v == null ? 'no value' : pct(v) + (m === 'gap' ? ' against fair value' : '')}`);
      });
      box.classList.add('ready');
    }

    // ---- hover: a floating card (mouse)
    const place = ev => {
      const r = box.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = ev.clientX - r.left + 16, y = ev.clientY - r.top + 16;
      if (x + tw > r.width - 4) x = ev.clientX - r.left - tw - 14;
      if (ev.clientY + th + 24 > window.innerHeight) y = ev.clientY - r.top - th - 14;
      tip.style.transform = `translate(${Math.max(4, x).toFixed(0)}px, ${y.toFixed(0)}px)`;
    };
    stage.addEventListener('pointermove', ev => {
      if (ev.pointerType === 'touch') return;
      const t = ev.target.closest('.mm-t[data-t]');
      if (!t) { tip.hidden = true; return; }
      if (tip.dataset.t !== t.dataset.t) { tip.innerHTML = mapTipHTML(byT(t.dataset.t), mode()); tip.dataset.t = t.dataset.t; }
      tip.hidden = false; place(ev);
    });
    stage.addEventListener('pointerleave', () => { tip.hidden = true; });

    // ---- touch: first tap shows the numbers under the map, second tap opens the page
    let lastTouch = 0;
    stage.addEventListener('pointerdown', ev => { if (ev.pointerType === 'touch') lastTouch = Date.now(); });
    stage.addEventListener('click', ev => {
      const t = ev.target.closest('.mm-t[data-t]');
      if (!t || Date.now() - lastTouch > 700) return;      // mouse click: the link just works
      if (selected === t.dataset.t) return;                // second tap: follow the link
      ev.preventDefault();
      selected = t.dataset.t;
      stage.querySelectorAll('.mm-t.sel').forEach(n => n.classList.remove('sel'));
      t.classList.add('sel');
      const c = byT(selected);
      info.innerHTML = `<div class="mm-info-in">${mapTipHTML(c, mode())}</div><a class="btn btn-violet" href="#/company/${encodeURIComponent(c.t)}">Open ${escapeHtml(c.t)}</a>`;
      info.hidden = false;
    });

    // ---- controls (map page only)
    if (page) page.addEventListener('click', ev => {
      const b = ev.target.closest('[data-mm-color],[data-mm-size]');
      if (!b) return;
      if (b.dataset.mmColor) MAPUI.color = b.dataset.mmColor; else MAPUI.size = b.dataset.mmSize;
      page.querySelectorAll('[data-mm-color]').forEach(x => { const on = x.dataset.mmColor === MAPUI.color; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      page.querySelectorAll('[data-mm-size]').forEach(x => { const on = x.dataset.mmSize === MAPUI.size; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      page.querySelector('[data-mm-legend]').innerHTML = mapLegendHTML(MAPUI.color);
      tip.dataset.t = ''; info.hidden = true; selected = null;
      draw();
    });

    draw();
    if ('ResizeObserver' in window) {
      let last = Math.round(stage.clientWidth);
      new ResizeObserver(() => { const w = Math.round(stage.clientWidth); if (w && w !== last) { last = w; draw(); } }).observe(stage);
    } else window.addEventListener('resize', draw);
  });
}
