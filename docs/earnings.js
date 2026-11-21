/* FreeFlow Finance — the earnings calendar.

   Dates come from earnings.json (fetch_earnings.py, Finnhub's free earnings
   calendar, refreshed by the daily update) and arrive on each company as
   c.earn = { next: {...}, last: {...} }:
     d      date, YYYY-MM-DD          h      'bmo' before the open, 'amc' after the close
     q, y   fiscal quarter and year   eps_e / eps_a   EPS estimate / actual
     rev_e / rev_a   revenue estimate / actual, $ billions

   Two things use it: a line on each company page ("Reports Thu, Jan 29,
   after the close") and the calendar page, #/earnings. */

const EARN = { filter: 'all' };

function earnDate(iso) {
  const p = String(iso || '').split('-').map(Number);
  return p.length === 3 ? new Date(p[0], p[1] - 1, p[2]) : null;
}
function earnToday() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function earnDays(iso) { const d = earnDate(iso); return d ? Math.round((d - earnToday()) / 86400000) : null; }
function earnDay(iso, long) {
  const d = earnDate(iso);
  return d ? d.toLocaleDateString('en-US', long ? { weekday: 'long', month: 'long', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }) : '';
}
function earnWhen(h) { return h === 'bmo' ? 'before the open' : h === 'amc' ? 'after the close' : h === 'dmh' ? 'during the day' : ''; }
function earnRel(iso) {
  const n = earnDays(iso);
  if (n == null) return '';
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  if (n > 1 && n < 7) return `in ${n} days`;
  if (n < 0 && n > -7) return `${-n} days ago`;
  return '';
}
function earnQ(e) { return e && e.q && e.y ? `Q${e.q} ${e.y}` : ''; }
function earnSurprise(a, e) {
  if (!(typeof a === 'number' && typeof e === 'number') || e === 0) return null;
  return (a - e) / Math.abs(e);
}
function earnBeatHTML(a, e, fmt) {
  const s = earnSurprise(a, e);
  if (s == null) return typeof a === 'number' ? fmt(a) : '—';
  const cls = s > 0.005 ? 'beat' : s < -0.005 ? 'miss' : 'inline';
  const word = cls === 'beat' ? 'beat' : cls === 'miss' ? 'miss' : 'in line';
  return `${fmt(a)} <span class="ec-${cls}">${word}${cls === 'inline' ? '' : ` ${s > 0 ? '+' : '−'}${Math.abs(s * 100).toFixed(Math.abs(s) < 0.1 ? 1 : 0)}%`}</span>`;
}
const earnEps = v => (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(2);
const earnRev = v => FMT.usdB(v);

/* The line on a company page. */
function earnChipHTML(c) {
  const e = c.earn;
  if (!e) return '';
  const icon = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 2.8v3.4M13 2.8v3.4"/></svg>';
  if (e.next) {
    const rel = earnRel(e.next.d), when = earnWhen(e.next.h);
    return `<a class="co-earn" href="#/earnings">${icon}<span>Reports ${earnQ(e.next) ? earnQ(e.next) + ' ' : ''}results <b>${earnDay(e.next.d)}</b>${when ? ', ' + when : ''}${rel ? ` · ${rel}` : ''}${typeof e.next.eps_e === 'number' ? ` · EPS est. ${earnEps(e.next.eps_e)}` : ''}</span></a>`;
  }
  if (e.last && typeof e.last.eps_a === 'number') {
    return `<a class="co-earn" href="#/earnings">${icon}<span>Reported ${earnDay(e.last.d)}: EPS ${earnBeatHTML(e.last.eps_a, e.last.eps_e, earnEps)}</span></a>`;
  }
  return '';
}

function earnRows(filter) {
  let list = FF_DATA.companies.filter(c => c.earn);
  if (filter === 'watch' && typeof FF_ACCT !== 'undefined') {
    const on = new Set(FF_ACCT.watched().map(x => x.c.t));
    list = list.filter(c => on.has(c.t));
  } else if (filter === 'own') {
    let held = [];
    try { held = (JSON.parse(localStorage.getItem('freeflow.portfolio.v1') || '[]') || []).map(p => p.t); } catch (e) { held = []; }
    const on = new Set(held);
    list = list.filter(c => on.has(c.t));
  }
  return list;
}

function earnCoCell(c) {
  return `<a class="ec-co" href="#/company/${encodeURIComponent(c.t)}"><span class="tk">${escapeHtml(c.t)}</span><span class="nm">${escapeHtml(c.n)}</span></a>`;
}
function earnRatingCell(c) {
  return `<span class="rating-pill ${ratingClass(c.rating)}">${escapeHtml(c.rating)}</span> <span class="mono ${upClass(c.upside)} ec-up">${FMT.pct(c.upside)}</span>`;
}

function earnUpcomingHTML(list) {
  const rows = list.filter(c => c.earn.next).sort((a, b) => a.earn.next.d.localeCompare(b.earn.next.d) || b.mcap - a.mcap);
  if (!rows.length) return '';
  // group by week (Monday start)
  const weekOf = iso => { const d = earnDate(iso); const k = new Date(d); k.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return k; };
  const t0 = earnToday(), thisWeek = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - ((t0.getDay() + 6) % 7)).getTime();
  const groups = new Map();
  for (const c of rows) {
    const w = weekOf(c.earn.next.d).getTime();
    if (!groups.has(w)) groups.set(w, []);
    groups.get(w).push(c);
  }
  const label = w => {
    const n = Math.round((w - thisWeek) / (7 * 86400000));
    const span = new Date(w).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return n === 0 ? `This week <small>from ${span}</small>` : n === 1 ? `Next week <small>from ${span}</small>` : `Week of ${span}`;
  };
  return Array.from(groups.entries()).map(([w, cs]) => `
    <div class="ec-week">
      <h3 class="ec-wh">${label(w)} <span class="ec-n">${cs.length}</span></h3>
      <div class="table-wrap"><table class="ff-table ec-table">
        <thead><tr><th>Day</th><th>Company</th><th>When</th><th>EPS est.</th><th>Revenue est.</th><th>Our view</th></tr></thead>
        <tbody>${cs.map(c => {
          const e = c.earn.next;
          return `<tr>
            <td class="ec-day">${earnDay(e.d)}${earnRel(e.d) ? `<small>${earnRel(e.d)}</small>` : ''}</td>
            <td>${earnCoCell(c)}</td>
            <td class="ec-when">${earnWhen(e.h) || '—'}</td>
            <td class="mono">${typeof e.eps_e === 'number' ? earnEps(e.eps_e) : '—'}</td>
            <td class="mono">${typeof e.rev_e === 'number' ? earnRev(e.rev_e) : '—'}</td>
            <td>${earnRatingCell(c)}</td>
          </tr>`;
        }).join('')}</tbody></table></div>
    </div>`).join('');
}

function earnRecentHTML(list) {
  const rows = list.filter(c => c.earn.last && (typeof c.earn.last.eps_a === 'number' || typeof c.earn.last.rev_a === 'number'))
    .sort((a, b) => b.earn.last.d.localeCompare(a.earn.last.d) || b.mcap - a.mcap);
  if (!rows.length) return '';
  const beats = rows.filter(c => (earnSurprise(c.earn.last.eps_a, c.earn.last.eps_e) || 0) > 0.005).length;
  return `
    <div class="ec-week ec-recent">
      <h3 class="ec-wh">Just reported <span class="ec-n">${rows.length}</span></h3>
      <p class="ec-sum">${beats} of ${rows.length} beat the consensus estimate for earnings per share.</p>
      <div class="table-wrap"><table class="ff-table ec-table">
        <thead><tr><th>Reported</th><th>Company</th><th>EPS vs estimate</th><th>Revenue vs estimate</th><th>Our view</th></tr></thead>
        <tbody>${rows.map(c => {
          const e = c.earn.last;
          return `<tr>
            <td class="ec-day">${earnDay(e.d)}${earnQ(e) ? `<small>${earnQ(e)}</small>` : ''}</td>
            <td>${earnCoCell(c)}</td>
            <td class="mono">${earnBeatHTML(e.eps_a, e.eps_e, earnEps)}</td>
            <td class="mono">${earnBeatHTML(e.rev_a, e.rev_e, earnRev)}</td>
            <td>${earnRatingCell(c)}</td>
          </tr>`;
        }).join('')}</tbody></table></div>
    </div>`;
}

function viewEarnings() {
  const all = FF_DATA.companies.filter(c => c.earn);
  const f = EARN.filter;
  const list = earnRows(f);
  const hasWatch = typeof FF_ACCT !== 'undefined' && FF_ACCT.watched().length > 0;
  const btn = (k, l) => `<button type="button" class="pc-range${f === k ? ' on' : ''}" data-earn-filter="${k}" aria-pressed="${f === k}">${l}</button>`;
  const at = FF_DATA.meta && FF_DATA.meta.earn_at;
  const crumb = typeof crumbs === 'function' ? crumbs({ href: '#/', label: 'Home' }, { label: 'Earnings calendar' }) : '';
  const empty = !all.length
    ? `<div class="empty-state ec-empty"><b>The calendar fills in with the next daily update.</b>
        Dates come from Finnhub's earnings calendar each evening, so the first ones appear after the update runs.</div>`
    : !list.length
      ? `<div class="empty-state ec-empty">${f === 'watch' ? 'None of your watchlist reports in the next three months, or none have dates yet.' : 'None of your holdings report in the next three months, or none have dates yet.'}</div>`
      : '';
  return `
  <section class="co-hero">
    <div class="wrap">
      ${crumb}
      <h1 class="pf-title">Earnings calendar</h1>
      <p class="pf-lede">When the companies we cover report next, what the market expects, and how the latest reports went against expectations. Earnings days are when fair values and ratings move most, because the inputs behind them get updated.</p>
    </div>
  </section>
  <section style="padding-top:4px"><div class="wrap">
    <div class="ec-bar" role="group" aria-label="Show">
      ${btn('all', 'All companies')}${btn('own', 'My portfolio')}${hasWatch ? btn('watch', 'My watchlist') : ''}
    </div>
    ${empty}
    ${list.length ? earnUpcomingHTML(list) + earnRecentHTML(list) : ''}
    <p class="ec-foot">Dates and consensus estimates from Finnhub${at ? `, updated ${escapeHtml(at)}` : ''}. Companies are sometimes late to confirm a date, and dates move. Companies priced from a stock exchange outside the US are not covered by the free calendar. EPS is earnings per share as the company reports it, usually adjusted.</p>
  </div></section>`;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-earn-filter]');
  if (!b) return;
  EARN.filter = b.dataset.earnFilter;
  if (typeof renderRoute === 'function') renderRoute({ keepScroll: true, swap: true });
});
