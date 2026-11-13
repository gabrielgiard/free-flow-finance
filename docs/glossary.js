/* ============================================================================
   GLOSSARY: the jargon, in plain English
   ----------------------------------------------------------------------------
   The site is written for two readers at once: someone who prices companies
   for a living, and someone who has never heard of a discount rate. This file
   is how one page serves both. The first time a term of art appears in a
   section it gets a faint dotted underline; hover, focus or tap it and a small
   card says what it means and why it matters here. Nothing changes for a
   reader who already knows.

   Three parts:
     GLOSSARY      the terms. One sentence of meaning, one of "why it matters".
     FF_GLOSS      finding terms in a piece of text (page-free; glossary_test.js)
     the view      underlining terms after each page draws, the pop-up card,
                   and the glossary page itself (#/learn).

   To add a term, add an entry to GLOSSARY. `also` lists other spellings that
   should trigger the same card.
   ========================================================================== */

const GLOSSARY = [
  // ---- the idea
  { k: 'fair-value', g: 'The idea', t: 'Fair value', also: ['fair values'],
    d: 'What we estimate one share is actually worth, worked out from the cash the company should produce, not from what the market happens to be paying today.',
    w: 'Every rating on the site is just the gap between this number and the share price.' },
  { k: 'upside', g: 'The idea', t: 'Upside', also: ['downside'],
    d: 'How far the share price would have to move to reach our fair value. +25% means fair value is a quarter above today’s price; a negative number means the price is already above it.',
    w: 'It is the single number the ratings are built from.' },
  { k: 'rating', g: 'The idea', t: 'Rating', also: ['ratings'],
    d: 'A label for the upside: Strong Buy at +30% or more, Buy from +12%, Hold between −12% and +12%, Reduce down to −30%, Sell below that.',
    w: 'The same cut-offs apply to all companies, so a Buy here always means the same thing.' },
  { k: 'dcf', g: 'The idea', t: 'DCF', also: ['discounted cash flow'],
    d: 'Discounted cash flow. Forecast the cash a company will produce each year, shrink each future dollar to what it is worth today, and add them up. That total is what the business is worth.',
    w: 'It is the site’s main model, and every company goes through the identical version of it.' },
  { k: 'multiples', g: 'The idea', t: 'Peer multiples', also: ['peer-multiples', 'multiples model'],
    d: 'A second way to value a company: look at what investors pay for its closest rivals per dollar of sales or cash flow, and apply that price tag to this company.',
    w: 'It answers a different question from the DCF: not "what is it worth?" but "what would the market pay for something like it?"' },
  { k: 'bear-bull', g: 'The idea', t: 'Bear and bull case', also: ['bear case', 'bull case', 'bear to bull'],
    d: 'The fair value if things go worse than we expect (bear) or better (bull): slower or faster growth, thinner or fatter margins, a higher or lower discount rate.',
    w: 'One number hides the uncertainty. The range shows how much the answer moves when the assumptions do.' },

  // ---- cash
  { k: 'fcf', g: 'Cash', t: 'Free cash flow', also: ['FCF'],
    d: 'The cash a business has left after paying its running costs and the investments it needs to keep going. It is what could be handed to the owners without shrinking the company.',
    w: 'A DCF values a company on this, not on accounting profit, because cash is what an owner can actually take out.' },
  { k: 'fcf-margin', g: 'Cash', t: 'Free cash flow margin', also: ['FCF margin', 'cash margin'],
    d: 'Free cash flow as a share of sales. A 25% margin means 25 cents of every dollar sold ends up as free cash.',
    w: 'Two companies with the same sales can be worth very different amounts; this is usually why.' },
  { k: 'fcf-yield', g: 'Cash', t: 'Free cash flow yield', also: ['FCF yield'],
    d: 'Free cash flow divided by the company’s market value. A 4% yield means that for every $100 the market pays, the business throws off $4 of cash a year.',
    w: 'It is the closest thing a stock has to an interest rate, so it can be compared with a bond.' },
  { k: 'ttm', g: 'Cash', t: 'TTM', also: ['trailing twelve months', 'past 12 months'],
    d: 'Trailing twelve months: the last four quarters added together, whatever the calendar year.',
    w: 'It is the most recent full year of real results, which is where every forecast here starts.' },

  // ---- the dials of the DCF
  { k: 'wacc', g: 'The dials of the DCF', t: 'WACC', also: ['discount rate', 'discount rates'],
    d: 'The discount rate: the yearly return investors demand for holding this company instead of something safe. Riskier companies get a higher one.',
    w: 'It is how future cash is shrunk to today’s value. Raise it by one point and most fair values fall by 10 to 20%.' },
  { k: 'terminal-value', g: 'The dials of the DCF', t: 'Terminal value',
    d: 'Everything the company is worth after the ten years we forecast in detail, rolled into a single number.',
    w: 'It is often more than half of the total, which is why the page tells you its share: the further out the value sits, the less certain it is.' },
  { k: 'terminal-growth', g: 'The dials of the DCF', t: 'Terminal growth',
    d: 'The slow, steady rate we assume the company grows at forever once the forecast ends, usually close to long-run inflation plus a little.',
    w: 'No company outgrows the economy forever, so this is kept low on purpose.' },
  { k: 'cagr', g: 'The dials of the DCF', t: 'CAGR', also: ['compound annual growth'],
    d: 'Compound annual growth rate: the single yearly growth rate that would take a number from its start to its end over a period.',
    w: 'It lets you compare a company that grows unevenly with one that grows steadily.' },

  // ---- price tags
  { k: 'mcap', g: 'Price tags', t: 'Market cap', also: ['market capitalisation', 'market capitalization', 'market value'],
    d: 'What it would cost to buy every share at today’s price: the share price times the number of shares.',
    w: 'It is the size of the company as the market sees it today.' },
  { k: 'ev', g: 'Price tags', t: 'Enterprise value',
    d: 'Market cap plus the company’s debt, minus its cash. It is the price of the whole business, as if you bought it and inherited both its loans and its bank account.',
    w: 'It lets you compare a company with lots of debt against one with none.' },
  { k: 'ev-sales', g: 'Price tags', t: 'EV / Sales', also: ['EV/Sales'],
    d: 'Enterprise value divided by a year of sales: how many dollars the market pays for each dollar the company sells.',
    w: 'It works even for companies that make no profit yet. High means investors expect a lot of growth, or fat margins, or both.' },
  { k: 'ev-fcf', g: 'Price tags', t: 'EV / FCF', also: ['EV/FCF', 'EV / Free cash flow'],
    d: 'Enterprise value divided by a year of free cash flow: how many years of today’s cash it would take to pay back the price.',
    w: 'Lower is cheaper, but a fast grower deserves a higher number than a slow one.' },
  { k: 'net-debt', g: 'Price tags', t: 'Net debt', also: ['net cash'],
    d: 'Debt minus cash. When a company holds more cash than it owes, the number is negative and is called net cash.',
    w: 'The DCF values the whole business, then subtracts net debt to find what is left for shareholders.' },
  { k: 'rule40', g: 'Price tags', t: 'Rule of 40',
    d: 'Growth rate plus free cash flow margin, in points. A company growing 25% with a 20% margin scores 45.',
    w: 'A rough test of quality: above 40, a company is growing fast, or very profitable, or a healthy mix.' },

  // ---- risk
  { k: 'volatility', g: 'Risk', t: 'Volatility',
    d: 'How much a price bounces around. 25% volatility means that in roughly two years out of three, the price finishes the year within 25% of where it was expected to, up or down.',
    w: 'It is the raw material of risk: the bumpier the ride, the wider the range of places you can end up.' },
  { k: 'monte-carlo', g: 'Risk', t: 'Monte Carlo simulation', also: ['Monte Carlo'],
    d: 'Instead of one forecast, run thousands of random but realistic futures and look at the whole spread of results.',
    w: 'The Portfolio page uses it to show the range your holdings could land in, not a single guess.' },
  { k: 'diversification', g: 'Risk', t: 'Diversification',
    d: 'Owning things that do not all move together, so a bad day for one is cushioned by the others.',
    w: 'It is the one reliable way to lower risk without giving up the return you expect.' },
  { k: 'bp', g: 'Risk', t: 'Basis point', also: ['basis points'],
    d: 'One hundredth of a percentage point. 50 basis points is 0.5%.',
    w: 'Interest rates move in small steps, so they get a small unit.' },
];

const FF_GLOSS = (() => {
  'use strict';
  const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&').replace(/\s+/g, '\\s+');
  let index = null;                                     // lower-cased spelling -> key
  let rx = null;
  function build(terms) {
    index = new Map();
    const all = [];
    terms.forEach(t => [t.t, ...(t.also || [])].forEach(a => { index.set(a.toLowerCase().replace(/\s+/g, ' '), t.k); all.push(a); }));
    all.sort((a, b) => b.length - a.length);            // "free cash flow yield" before "free cash flow"
    rx = new RegExp('(^|[^A-Za-z0-9])(' + all.map(esc).join('|') + ')(?![A-Za-z0-9])', 'gi');
  }
  /* Every term in a piece of text: [{ k, start, end }], left to right, never overlapping. */
  function find(text, terms) {
    if (!rx || terms) build(terms || GLOSSARY);
    const out = [];
    rx.lastIndex = 0;
    let m;
    while ((m = rx.exec(text))) {
      const start = m.index + m[1].length, k = index.get(m[2].toLowerCase().replace(/\s+/g, ' '));
      if (k) out.push({ k, start, end: start + m[2].length });
      rx.lastIndex = start + m[2].length;
    }
    return out;
  }
  const api = { find, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = Object.assign(api, { GLOSSARY });
  return api;
})();

/* ------------------------------------------------------------------ view --- */

const GLOSS_KEY = 'freeflow.gloss';
const GLOSS = { on: true, loaded: false, pop: null, cur: null, timer: 0 };
function glossTerm(k) { return GLOSSARY.find(t => t.k === k); }
function glossLoad() {
  if (GLOSS.loaded) return; GLOSS.loaded = true;
  try { GLOSS.on = localStorage.getItem(GLOSS_KEY) !== 'off'; } catch (e) { /* default on */ }
}

/* Where a term must never be underlined: anything that already does something
   when clicked, headings, charts, form fields, table bodies (too many rows). */
const GLOSS_SKIP = 'a, button, input, textarea, select, label, svg, h1, h2, tbody, script, style, .gl-term, .gl-pop, [data-route], [data-tab], [data-sort-col], [data-screen-sort], [data-faq], [data-nogloss], [role="button"], [role="tab"], [role="link"], [contenteditable], [hidden], figure, figcaption, .sr-only, .rating-pill, .tag, .mm, .eyebrow, .co-crumb';

/* Underline the first appearance of each term in each section of the page.
   Safe to call again on the same content: it never touches what it has done. */
function glossAnnotate(root) {
  glossLoad();
  if (!GLOSS.on || !root) return;
  const scopeOf = n => n.closest('.co-panel') || root;
  const seen = new Map();                               // scope -> Set of keys already underlined
  const used = scope => {
    if (!seen.has(scope)) seen.set(scope, new Set([...scope.querySelectorAll('.gl-term')].filter(e => scopeOf(e) === scope).map(e => e.dataset.gl)));
    return seen.get(scope);
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue || n.nodeValue.length < 3 || !/[A-Za-z]{3}/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
      const p = n.parentElement;
      return !p || p.closest(GLOSS_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  const jobs = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const hits = FF_GLOSS.find(n.nodeValue);
    if (!hits.length) continue;
    const u = used(scopeOf(n.parentElement));
    let keep = hits.filter(h => !u.has(h.k));
    // Inside a flex or grid box, splitting a sentence would turn it into several
    // boxes and wreck the layout. There, only a label that IS the term is marked.
    if (keep.length && /flex|grid/.test(getComputedStyle(n.parentElement).display)) {
      const lead = n.nodeValue.length - n.nodeValue.trimStart().length, body = n.nodeValue.trim();
      keep = keep.filter(h => h.start === lead && h.end === lead + body.length);
    }
    keep = keep.filter(h => !u.has(h.k) && (u.add(h.k), true));
    if (keep.length) jobs.push([n, keep]);
  }
  jobs.forEach(([node, hits]) => {
    const text = node.nodeValue, frag = document.createDocumentFragment();
    let at = 0;
    hits.forEach(h => {
      if (h.start > at) frag.appendChild(document.createTextNode(text.slice(at, h.start)));
      const s = document.createElement('span');
      s.className = 'gl-term'; s.dataset.gl = h.k; s.tabIndex = 0;
      s.setAttribute('role', 'button'); s.setAttribute('aria-label', text.slice(h.start, h.end) + ': what this means');
      s.textContent = text.slice(h.start, h.end);
      frag.appendChild(s);
      at = h.end;
    });
    if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
    node.parentNode.replaceChild(frag, node);
  });
}

function glossPop() {
  if (GLOSS.pop) return GLOSS.pop;
  const p = document.createElement('div');
  p.className = 'gl-pop'; p.hidden = true; p.setAttribute('role', 'tooltip'); p.id = 'gl-pop';
  document.body.appendChild(p);
  p.addEventListener('mouseenter', () => clearTimeout(GLOSS.timer));
  p.addEventListener('mouseleave', () => glossHide(160));
  return (GLOSS.pop = p);
}
function glossShow(el) {
  const t = glossTerm(el.dataset.gl);
  if (!t) return;
  clearTimeout(GLOSS.timer);
  const p = glossPop();
  p.innerHTML = `<div class="gl-pop-t">${escapeHtml(t.t)}</div><p>${escapeHtml(t.d)}</p><p class="gl-pop-w">${escapeHtml(t.w)}</p><a href="#/learn?t=${t.k}">All the jargon, explained</a>`;
  p.hidden = false;
  const r = el.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight, vw = document.documentElement.clientWidth;
  let x = r.left + r.width / 2 - pw / 2, y = r.bottom + 10;
  x = Math.max(10, Math.min(vw - pw - 10, x));
  if (y + ph > window.innerHeight - 8 && r.top - ph - 10 > 8) y = r.top - ph - 10;
  p.style.left = (x + window.scrollX) + 'px'; p.style.top = (y + window.scrollY) + 'px';
  if (GLOSS.cur && GLOSS.cur !== el) GLOSS.cur.removeAttribute('aria-describedby');
  if (GLOSS.cur !== el) GLOSS.at = Date.now();
  GLOSS.cur = el; el.setAttribute('aria-describedby', 'gl-pop');
}
function glossHide(delay = 0) {
  clearTimeout(GLOSS.timer);
  GLOSS.timer = setTimeout(() => {
    if (GLOSS.pop) GLOSS.pop.hidden = true;
    if (GLOSS.cur) { GLOSS.cur.removeAttribute('aria-describedby'); GLOSS.cur = null; }
  }, delay);
}

/* One set of listeners for the whole site. */
(function glossWire() {
  if (typeof document === 'undefined') return;
  const term = e => e.target && e.target.closest ? e.target.closest('.gl-term') : null;
  document.addEventListener('mouseover', e => { const t = term(e); if (t) { clearTimeout(GLOSS.timer); GLOSS.timer = setTimeout(() => glossShow(t), 140); } });
  document.addEventListener('mouseout', e => { if (term(e)) glossHide(220); });
  document.addEventListener('focusin', e => { const t = term(e); if (t) glossShow(t); });
  document.addEventListener('focusout', e => { if (term(e)) glossHide(120); });
  document.addEventListener('click', e => {
    const t = term(e);
    if (t) {
      e.stopPropagation();
      // A tap focuses the word (which opens the card) and then clicks it. Only a
      // click on a card that has been open for a moment is a request to close it.
      if (GLOSS.cur === t && GLOSS.pop && !GLOSS.pop.hidden && Date.now() - (GLOSS.at || 0) > 450) glossHide(); else glossShow(t);
      return;
    }
    if (GLOSS.pop && !GLOSS.pop.hidden && !e.target.closest('.gl-pop')) glossHide();
    else if (e.target.closest('.gl-pop a')) glossHide();
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') glossHide();
    else if ((e.key === 'Enter' || e.key === ' ') && term(e)) { e.preventDefault(); glossShow(term(e)); }
  });
  window.addEventListener('hashchange', () => glossHide());
})();

/* The glossary page. */
function viewLearn() {
  glossLoad();
  const want = (location.hash.split('?t=')[1] || '').replace(/[^a-z0-9-]/g, '');
  const groups = [];
  GLOSSARY.forEach(t => { let g = groups.find(x => x.g === t.g); if (!g) groups.push(g = { g: t.g, items: [] }); g.items.push(t); });
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'Glossary' })}
      <div class="eyebrow">Glossary</div>
      <h1 style="font-size:32px;max-width:680px;">The jargon, in plain English.</h1>
      <p style="max-width:620px;font-size:14.5px;">Finance has a word for everything and explains none of them. Here are the ${GLOSSARY.length} that matter on this site: what each one means, and why it changes what a company is worth.</p>
      <div class="gl-switch" data-nogloss>
        <button type="button" class="gl-toggle" data-gl-toggle aria-pressed="${GLOSS.on}"><i></i></button>
        <span>Underline these words across the site, so a tap explains them where you meet them</span>
      </div>
    </div>
  </section>
  <section style="padding-top:8px;">
    <div class="wrap" data-nogloss>
      ${groups.map(g => `
      <div class="gl-group">
        <h2 class="gl-gh">${g.g}</h2>
        <div class="gl-grid">${g.items.map(t => `
          <article class="gl-card${t.k === want ? ' hit' : ''}" id="gl-${t.k}">
            <h3>${escapeHtml(t.t)}</h3>
            <p>${escapeHtml(t.d)}</p>
            <p class="gl-why"><b>Why it matters here.</b> ${escapeHtml(t.w)}</p>
          </article>`).join('')}</div>
      </div>`).join('')}
      <p class="gl-foot">Want to see them at work? <a href="#/methodology">How the models work</a> walks through a valuation step by step, and the "Your Case" tab on any company page lets you move the dials yourself.</p>
    </div>
  </section>`;
}
function mountLearn(root) {
  const r = root || document, tg = r.querySelector('[data-gl-toggle]');
  if (!tg || tg._gl) return; tg._gl = true;
  tg.addEventListener('click', () => {
    GLOSS.on = !GLOSS.on;
    tg.setAttribute('aria-pressed', GLOSS.on);
    try { localStorage.setItem(GLOSS_KEY, GLOSS.on ? 'on' : 'off'); } catch (e) { /* this visit only */ }
  });
  const hit = r.querySelector('.gl-card.hit');
  if (hit) setTimeout(() => hit.scrollIntoView({ block: 'center', behavior: 'instant' }), 60);
}
