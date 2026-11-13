/* ============================================================================
   THE DAILY TEN
   ----------------------------------------------------------------------------
   Ten companies a day, the same ten for everyone. For each one: is the price
   below or above our DCF fair value? You get the clues an analyst would start
   from (growth, cash margin, how expensive it is against its sector), make the
   call, and see the model's answer and why.

   It is a game, but it teaches the one habit the whole site is about: looking
   at a price and asking what it is assuming.

   Two parts:
     FF_PLAY  picking the ten, streaks and the share text. No page code, so
              play_test.js checks it under Node.
     the view the page (#/play), the homepage card, and the round-by-round UI.

   The answers always come from the DCF, the site's official model, whatever
   the DCF / Multiples switch says. Progress, scores and streaks are saved on
   this device only.
   ========================================================================== */

const FF_PLAY = (() => {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const day = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const prevDay = iso => { const [y, m, d] = iso.split('-').map(Number); return day(new Date(y, m - 1, d - 1)); };

  function hash(str) {                                  // FNV-1a
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function rngFrom(seed) {                              // mulberry32
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* cos: [{ t, mcap, up }] where up is the DCF upside (null when there is no
     meaningful fair value). Returns n tickers.
       - anything within 10% of fair value is left out: too close to call
       - between 3 and 7 of the ten are undervalued, so "always say expensive"
         cannot win
       - six come from the big, familiar names and four from the rest */
  function pick(cos, seedStr, n = 10, minGap = 0.10) {
    const byT = (a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0);
    const el = cos.filter(c => c.up != null && isFinite(c.up) && Math.abs(c.up) >= minGap);
    const rng = rngFrom(hash(String(seedStr)));
    const byCap = el.slice().sort((a, b) => b.mcap - a.mcap || byT(a, b));
    const cut = Math.min(120, Math.ceil(byCap.length * 0.45));
    const fam = shuffle(byCap.slice(0, cut), rng), rest = shuffle(byCap.slice(cut), rng);
    const totU = el.filter(c => c.up > 0).length, totO = el.length - totU;
    n = Math.min(n, el.length);
    let needU = Math.max(n - totO, Math.min(3 + Math.floor(rng() * 5), totU, n)), needO = n - needU;
    const out = [], pattern = 'FFRFFRFRFR';
    for (let i = 0; out.length < n; i++) {
      const pools = pattern[i % 10] === 'F' ? [fam, rest] : [rest, fam];
      let got = null;
      for (const pool of pools) {
        const j = pool.findIndex(c => (c.up > 0 ? needU : needO) > 0);
        if (j >= 0) { got = pool.splice(j, 1)[0]; break; }
      }
      if (!got) break;
      if (got.up > 0) needU--; else needO--;
      out.push(got.t);
    }
    return shuffle(out, rng);
  }

  /* store: { last, streak, best, played, days: { 'YYYY-MM-DD': [1,0,...] } } */
  function emptyStore() { return { last: '', streak: 0, best: 0, played: 0, days: {} }; }
  function streakNow(store, today) {
    return store.last === today || store.last === prevDay(today) ? store.streak : 0;
  }
  function finish(store, today, marks) {
    if (store.days[today]) return store;                 // a day counts once
    const s = Object.assign(emptyStore(), store, { days: Object.assign({}, store.days) });
    s.streak = s.last === prevDay(today) ? s.streak + 1 : 1;
    s.best = Math.max(s.best, s.streak);
    s.last = today; s.played += 1;
    s.days[today] = marks.slice();
    const keep = Object.keys(s.days).sort().slice(-60);  // two months of history is plenty
    s.days = Object.fromEntries(keep.map(k => [k, s.days[k]]));
    return s;
  }
  function shareText(today, marks, url) {
    const [y, m, d] = today.split('-').map(Number);
    const when = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `FreeFlow Daily Ten · ${when}\n${marks.filter(Boolean).length}/${marks.length} ${marks.map(x => (x ? '🟩' : '🟥')).join('')}\nCan you tell cheap from expensive?\n${url}`;
  }

  const api = { day, prevDay, hash, rngFrom, shuffle, pick, emptyStore, streakNow, finish, shareText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();

/* ------------------------------------------------------------------ view --- */

const PLAY_KEY = 'freeflow.play.v1';
const PLAY = { loaded: false, store: FF_PLAY.emptyStore(), run: null };

function playLoad() {
  if (PLAY.loaded) return;
  PLAY.loaded = true;
  try {
    const s = JSON.parse(localStorage.getItem(PLAY_KEY) || 'null');
    if (s && typeof s === 'object' && s.days && typeof s.days === 'object') {
      PLAY.store = Object.assign(FF_PLAY.emptyStore(), { last: String(s.last || ''), streak: +s.streak || 0, best: +s.best || 0, played: +s.played || 0, days: s.days });
      if (s.cur && s.cur.day === FF_PLAY.day() && Array.isArray(s.cur.picks)) PLAY.cur = s.cur;
    }
  } catch (e) { /* storage blocked or corrupt: play without saving */ }
}
function playSave() {
  try { localStorage.setItem(PLAY_KEY, JSON.stringify(Object.assign({}, PLAY.store, { cur: PLAY.cur || null }))); } catch (e) { /* ignore */ }
}

function playPool() {
  return FF_DATA.companies.map(c => { const d = dcfOf(c); return { t: c.t, mcap: c.mcap, up: d.fv > 0 && c.price > 0 ? d.upside : null }; });
}
/* The run on screen: today's ten (resumed if half-played) or a practice set. */
function playStart(practice) {
  const today = FF_PLAY.day();
  if (practice) {
    PLAY.run = { practice: true, day: today, picks: FF_PLAY.pick(playPool(), 'practice-' + Date.now() + Math.random()), marks: [], calls: [], answered: false };
    return;
  }
  const done = PLAY.store.days[today];
  let picks = PLAY.cur && PLAY.cur.day === today ? PLAY.cur.picks.filter(t => byT(t)) : null;
  if (!picks || picks.length < 3) picks = FF_PLAY.pick(playPool(), 'daily-' + today);
  const marks = done ? done.slice() : (PLAY.cur && PLAY.cur.day === today ? (PLAY.cur.marks || []).slice(0, picks.length) : []);
  PLAY.run = { practice: false, day: today, picks, marks, calls: [], answered: false };
  PLAY.cur = { day: today, picks, marks };
  // closed the tab on the last answer, before the score screen: the day still counts
  if (!done && picks.length && marks.length >= picks.length) { PLAY.store = FF_PLAY.finish(PLAY.store, today, marks); playSave(); }
}

function playTruth(c) { return dcfOf(c).upside > 0 ? 'under' : 'over'; }
function playFirstSentence(txt, max = 230) {
  const s = String(txt || '');
  const m = s.match(/^.*?[.!?](?=\s+[A-Z]|$)/);
  let out = m && m[0].length > 40 ? m[0] : s;
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}
function playDots(run, cur) {
  return `<div class="pl-dots" aria-hidden="true">${run.picks.map((_, i) =>
    `<i class="${i < run.marks.length ? (run.marks[i] ? 'ok' : 'no') : i === cur ? 'cur' : ''}"></i>`).join('')}</div>`;
}
function playDateLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function playRoundHTML(run) {
  const i = run.marks.length - (run.answered ? 1 : 0), c = byT(run.picks[i]), d = dcfOf(c);
  const sec = sectorMeta(c.sec);
  const yr = typeof hasHistory === 'function' && hasHistory(c.t) ? (() => { const s = pcSeries(c.t); return s && s.closes.length > 120 ? s.closes[s.closes.length - 1] / s.closes[0] - 1 : null; })() : null;
  const clue = (k, v, s = '') => `<div class="pl-clue"><span>${k}</span><b>${v}</b>${s ? `<small>${s}</small>` : ''}</div>`;
  const evs = c.ev_sales > 0 ? clue('Price tag vs sales', c.ev_sales.toFixed(1) + 'x', c.pctl && c.pctl.ev_sales != null ? `pricier than ${c.pctl.ev_sales}% of its sector` : (sec ? `sector median ${sec.med_ev_sales}x` : '')) : '';
  const clues = [
    clue('Share price', FMT.usd(c.price)),
    clue('Market value', FMT.usdB(c.mcap)),
    clue('Sales growth', FMT.pct(c.growth[0], 0), 'what we model for next year'),
    clue('Cash margin', (c.m0 * 100).toFixed(0) + '%', 'of sales becomes free cash'),
    evs,
    yr != null ? clue('Past year', FMT.pct(yr, 0), 'share price move') : '',
  ].join('');

  let verdict = '';
  if (run.answered) {
    const right = run.marks[i] === 1, truth = playTruth(c), gap = Math.abs(d.upside);
    const lo = Math.min(c.price, d.fv) * 0.9, hi = Math.max(c.price, d.fv) * 1.08, P = v => ((v - lo) / (hi - lo) * 100).toFixed(1) + '%';
    const why = truth === 'under' ? (c.bull && c.bull[0]) : (c.risks && c.risks[0]);
    verdict = `
    <div class="pl-verdict ${right ? 'ok' : 'no'}" role="status">
      <div class="pl-v-h"><span class="pl-v-mark">${right ? '✓' : '✕'}</span><b>${right ? 'Correct.' : 'Not this time.'}</b>
        <span>Our DCF says <em class="${truth === 'under' ? 'upside-pos' : 'upside-neg'}">${truth === 'under' ? 'undervalued' : 'overvalued'}</em>: fair value ${FMT.usd(d.fv)} against a price of ${FMT.usd(c.price)}, a gap of ${(gap * 100).toFixed(0)}%.</span></div>
      <div class="pl-bar" aria-hidden="true">
        <span class="pl-bar-fv" style="left:${P(d.fv)}"><i></i><small>Fair value ${FMT.usd(d.fv, 0)}</small></span>
        <span class="pl-bar-px" style="left:${P(c.price)}"><i></i><small>Price ${FMT.usd(c.price, 0)}</small></span>
      </div>
      ${why ? `<p class="pl-why"><b>${truth === 'under' ? 'What the bulls see' : 'What could go wrong'}:</b> ${escapeHtml(why)}</p>` : ''}
      <div class="pl-next">
        <a class="pl-read" href="#/company/${encodeURIComponent(c.t)}">Read the full ${escapeHtml(c.t)} valuation</a>
        <button type="button" class="btn btn-violet" data-pl-next>${run.marks.length >= run.picks.length ? 'See my score' : 'Next company'} ${ICN.arrow.replace('currentColor', '#fff')}</button>
      </div>
    </div>`;
  }

  return `
  <div class="pl-top"><span>${run.practice ? 'Practice round' : playDateLabel(run.day)}</span><span>${i + 1} of ${run.picks.length}</span></div>
  ${playDots(run, i)}
  <article class="pl-card">
    <div class="pl-id">
      <div class="co-mono">${escapeHtml(c.t.length > 5 ? c.t.slice(0, 4) : c.t)}</div>
      <div><h2>${escapeHtml(c.n)}</h2><div class="pl-sec">${escapeHtml(fmtSector(c.sec))} · ${escapeHtml(c.hq || '')}</div></div>
    </div>
    <p class="pl-desc">${escapeHtml(playFirstSentence(c.desc))}</p>
    <div class="pl-clues">${clues}</div>
    ${run.answered ? verdict : `
    <div class="pl-q">Is the share price below or above what we think ${escapeHtml(c.n.split(/[ ,]/)[0])} is worth?</div>
    <div class="pl-calls">
      <button type="button" class="pl-call under" data-pl-call="under"><b>Undervalued</b><span>price is below our fair value</span></button>
      <button type="button" class="pl-call over" data-pl-call="over"><b>Overvalued</b><span>price is above our fair value</span></button>
    </div>
    <div class="pl-keys">Keyboard: ← undervalued, → overvalued</div>`}
  </article>`;
}

function playResultHTML(run) {
  const n = run.picks.length, score = run.marks.filter(Boolean).length, today = FF_PLAY.day();
  const streak = FF_PLAY.streakNow(PLAY.store, today);
  const line = score === n ? 'Flawless. You read prices like the model does.'
    : score >= n * 0.8 ? 'Sharp. You can smell an expensive stock.'
    : score >= n * 0.6 ? 'Better than a coin flip. The instinct is there.'
    : score >= n * 0.4 ? 'About a coin flip. Tomorrow you take the coin’s lunch money.'
    : 'The market fooled you today. It fools everyone sometimes.';
  const rows = run.picks.map((t, i) => {
    const c = byT(t), d = dcfOf(c), truth = playTruth(c);
    return `<a class="pl-row" href="#/company/${encodeURIComponent(t)}">
      <i class="${run.marks[i] ? 'ok' : 'no'}">${run.marks[i] ? '✓' : '✕'}</i><b>${escapeHtml(t)}</b><span class="nm">${escapeHtml(c.n)}</span>
      <span class="${truth === 'under' ? 'upside-pos' : 'upside-neg'}">${truth === 'under' ? 'undervalued' : 'overvalued'} by ${(Math.abs(d.upside) * 100).toFixed(0)}%</span></a>`;
  }).join('');
  return `
  <div class="pl-result">
    <div class="pl-top"><span>${run.practice ? 'Practice round' : playDateLabel(run.day)}</span><span>${run.practice ? 'does not count toward your streak' : 'come back tomorrow for a new ten'}</span></div>
    <div class="pl-score"><b>${score}</b><span>/ ${n}</span></div>
    <div class="pl-squares" role="img" aria-label="${score} right out of ${n}">${run.marks.map(m => `<i class="${m ? 'ok' : 'no'}"></i>`).join('')}</div>
    <p class="pl-line">${line}</p>
    ${run.practice ? '' : `<div class="pl-streak"><div><b>${streak}</b><span>day streak</span></div><div><b>${PLAY.store.best}</b><span>best streak</span></div><div><b>${PLAY.store.played}</b><span>days played</span></div></div>`}
    <div class="pl-actions">
      ${run.practice ? '' : `<button type="button" class="btn btn-violet" data-pl-share><span>Share my score</span></button>`}
      <button type="button" class="btn ${run.practice ? 'btn-violet' : 'btn-ghost'}" data-pl-practice>Play a practice round</button>
      ${run.practice ? `<button type="button" class="btn btn-ghost" data-pl-daily>Back to today's ten</button>` : ''}
    </div>
    <div class="pl-rows">${rows}</div>
    <p class="pl-fine">Answers come from our DCF as of the latest close. A model's fair value is an opinion with arithmetic behind it, not a fact, and none of this is investment advice.</p>
  </div>`;
}

function viewPlay() {
  playLoad();
  if (!PLAY.run || (!PLAY.run.practice && PLAY.run.day !== FF_PLAY.day())) playStart(false);
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumbs({ href: '#/', label: 'Home' }, { label: 'The Daily Ten' })}
      <div class="eyebrow">The Daily Ten</div>
      <h1 style="font-size:32px;max-width:680px;">Cheap or expensive? Ten companies, one call each.</h1>
      <p style="max-width:600px;font-size:14.5px;">Everyone gets the same ten today. Read the clues, decide whether the price is below or above our DCF fair value, then see what the model says and why.</p>
    </div>
  </section>
  <section style="padding-top:8px;">
    <div class="wrap"><div class="pl" data-play></div></div>
  </section>`;
}

function mountPlay(root) {
  (root || document).querySelectorAll('[data-play]').forEach(box => {
    if (box._pl) return; box._pl = true;
    const render = () => {
      const run = PLAY.run;
      if (!run.picks.length) { box.innerHTML = `<div class="pl-card"><p class="pl-desc">Today's set needs fair values that haven't loaded. Try again after the next daily update.</p></div>`; return; }
      const done = run.marks.length >= run.picks.length && !run.answered;
      box.innerHTML = done ? playResultHTML(run) : playRoundHTML(run);
      box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
      if (typeof glossAnnotate === 'function') glossAnnotate(box);
    };
    const call = side => {
      const run = PLAY.run;
      if (run.answered || run.marks.length >= run.picks.length) return;
      const c = byT(run.picks[run.marks.length]);
      run.marks.push(playTruth(c) === side ? 1 : 0);
      run.answered = true;
      if (!run.practice) { PLAY.cur = { day: run.day, picks: run.picks, marks: run.marks }; playSave(); }
      render();
      const nx = box.querySelector('[data-pl-next]'); if (nx) nx.focus({ preventScroll: true });
    };
    const next = () => {
      const run = PLAY.run;
      if (!run.answered) return;
      run.answered = false;
      if (run.marks.length >= run.picks.length && !run.practice) { PLAY.store = FF_PLAY.finish(PLAY.store, run.day, run.marks); playSave(); }
      render();
      const top = box.getBoundingClientRect().top;
      if (top < 70) window.scrollTo({ top: window.scrollY + top - 90, behavior: 'instant' });
    };
    box.addEventListener('click', async e => {
      const c = e.target.closest('[data-pl-call]');
      if (c) return call(c.dataset.plCall);
      if (e.target.closest('[data-pl-next]')) return next();
      if (e.target.closest('[data-pl-practice]')) { playStart(true); return render(); }
      if (e.target.closest('[data-pl-daily]')) { playStart(false); return render(); }
      const sh = e.target.closest('[data-pl-share]');
      if (sh) {
        const run = PLAY.run, text = FF_PLAY.shareText(run.day, run.marks, CASE_SITE + '#/play');
        const label = sh.querySelector('span'), say = t => { label.textContent = t; clearTimeout(sh._t); sh._t = setTimeout(() => { label.textContent = 'Share my score'; }, 2200); };
        if (navigator.share && matchMedia('(pointer: coarse)').matches) {
          try { await navigator.share({ text }); return; } catch (err) { if (err && err.name === 'AbortError') return; }
        }
        try { await navigator.clipboard.writeText(text); say('Copied. Paste it anywhere'); }
        catch (err) { window.prompt('Copy your score:', text); }
      }
    });
    // one listener for the page's lifetime; it only acts while the game is on screen
    if (!mountPlay._keys) {
      mountPlay._keys = true;
      document.addEventListener('keydown', e => {
        const live = document.querySelector('[data-play]');
        if (!live || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
        const btn = k => live.querySelector(k);
        if (e.key === 'ArrowLeft' && btn('[data-pl-call="under"]')) { e.preventDefault(); btn('[data-pl-call="under"]').click(); }
        else if (e.key === 'ArrowRight' && btn('[data-pl-call="over"]')) { e.preventDefault(); btn('[data-pl-call="over"]').click(); }
      });
    }
    render();
  });
}

/* The homepage card: an invitation before you have played, your score after. */
function homePlayHTML() {
  playLoad();
  const today = FF_PLAY.day(), done = PLAY.store.days[today], streak = FF_PLAY.streakNow(PLAY.store, today);
  const mid = PLAY.cur && PLAY.cur.day === today && PLAY.cur.marks && PLAY.cur.marks.length && !done;
  return `
  <section class="home-band pl-home">
    <div class="wrap">
      <div class="pl-promo" data-route="play" role="link" tabindex="0">
        <div class="pl-promo-l">
          <div class="eyebrow">The Daily Ten</div>
          <h2>${done ? `You scored ${done.filter(Boolean).length} out of ${done.length} today.` : 'Cheap or expensive? Ten companies, one call each.'}</h2>
          <p>${done ? `A new ten arrives tomorrow.${streak > 1 ? ` You are on a ${streak}-day streak.` : ''}` : `Same ten for everyone, new every day. Read the clues, make the call, see what the model says.${streak > 0 ? ` Your streak: ${streak} day${streak === 1 ? '' : 's'}.` : ''}`}</p>
        </div>
        <div class="pl-promo-r">
          <div class="pl-squares sm" aria-hidden="true">${(done || new Array(10).fill(null)).map(m => `<i class="${m == null ? '' : m ? 'ok' : 'no'}"></i>`).join('')}</div>
          <span class="btn btn-violet">${done ? 'See today’s answers' : mid ? 'Carry on' : 'Play today’s ten'} ${ICN.arrow.replace('currentColor', '#fff')}</span>
        </div>
      </div>
    </div>
  </section>`;
}
