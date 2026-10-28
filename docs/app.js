/* FreeFlow Finance — app shell: router + all delegated interactivity.
   Deliberately dependency-free and non-module so the site opens straight
   from disk (file://) with no build step and no CORS issues. */

const APP = document.getElementById('app');

// Browsers restore your previous scroll position on reload by default. In a
// single-page site that means reopening the homepage two screens down — which
// looks like it loaded the wrong page. We manage scrolling ourselves instead.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function renderRoute(opts) {
  // Anything after "?" is options for the page (a shared "Your case" link
  // carries ?case=...), not part of which page to show.
  const hash = location.hash.replace(/^#\/?/, '').split('?')[0];
  const [route, arg] = hash.split('/');
  let html, navKey = 'home';

  if (!route || route === '') { html = viewHome(); navKey = 'home'; }
  else if (route === 'sector' && arg) { html = viewSector(arg); navKey = 'sector'; }
  else if (route === 'company' && arg) { html = viewCompany(decodeURIComponent(arg)); navKey = 'company'; }
  else if (route === 'screener') { html = viewScreener(); navKey = 'screener'; }
  else if (route === 'portfolio') { html = viewPortfolio(); navKey = 'portfolio'; }
  else if (route === 'about') { html = viewAbout(); navKey = 'about'; }
  else if (route === 'methodology') { html = viewMethodology(); navKey = 'methodology'; }
  else if (route === 'track-record') { html = viewTrackRecord(); navKey = 'track-record'; }
  else { html = view404(); }

  APP.innerHTML = html;
  APP.classList.remove('route-enter');
  if (opts && opts.swap) {
    // a model switch redraws the same page: no entrance, the values slide instead
    APP.classList.add('swapping'); clearTimeout(APP._sw); APP._sw = setTimeout(() => APP.classList.remove('swapping'), 900);
  } else { void APP.offsetWidth; APP.classList.add('route-enter'); }
  // 'instant' overrides the CSS smooth-scroll, which would otherwise animate
  // on every navigation and look sluggish.
  if (!(opts && opts.keepScroll)) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  updateNavActive(navKey, arg);
  updateSidebarActive(navKey, arg ? decodeURIComponent(arg) : null);
  markDecorativeSvgs();
  mountPriceCharts(APP);
  mountCasePanels(APP);
  mountPortfolio(APP);
  mountHomeHero(APP);
  mountTabInk(APP);
  mountMxCase(APP);
  mountProjCharts(APP);
  mountMarkets(APP);
  mountHomeIdeas(APP);
  mountHeroFind(APP);
  updateCanonical(navKey, arg);
  closeSectorMenu(); closeSearch(); closeMobileNav(); closeSidebar();
}

/* Nearly every SVG here is a decorative icon sitting next to its own text
   label, so a screen reader announcing it adds noise rather than meaning.
   Anything genuinely informative carries its own aria-label and is skipped. */
function markDecorativeSvgs(root) {
  (root || document).querySelectorAll('svg').forEach(svg => {
    if (svg.getAttribute('aria-label') || svg.querySelector('title')) return;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');   // IE/Edge legacy: keeps SVGs out of tab order
  });
}

function go(hash) { location.hash = hash; }

function currentSectorKey() {
  // strip a leading "#" or "#/" the same way renderRoute does, so this always
  // agrees with which sector view is actually on screen
  return location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[1];
}

/* ---------------------------------- sidebar ------------------------------
   Built once at boot from FF_DATA, then only the active-state classes change
   on navigation — rebuilding 100 rows on every route change would be wasteful
   and would lose the user's expanded/collapsed groups. */
function buildSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const groups = FF_DATA.sectors.map(s => {
    const cos = FF_DATA.companies
      .filter(c => c.sec === s.k)
      .sort((a, b) => b.mcap - a.mcap)
      .map(c => `
        <div class="sb-co" data-route="company" data-ticker="${c.t}" data-co="${c.t}"
             title="${c.n} — ${c.rating}">
          <span class="dot" style="background:${ratingColor(c.rating)}"></span>
          <span class="tk">${c.t}</span>
          <span class="nm">${c.n}</span>
        </div>`).join('');
    return `
      <div class="sb-group" data-group="${s.k}">
        <button class="sb-group-head" data-toggle-group="${s.k}" aria-expanded="false">
          <span class="sb-ico">${SECTOR_ICONS[s.k] || ''}</span>
          <span class="sb-name">${s.n}</span>
          <span class="sb-n">${s.count}</span>
          <svg class="sb-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <div class="sb-list"><div class="sb-inner">
          <div class="sb-co sb-all" data-route="sector" data-key="${s.k}" data-co="sector:${s.k}">
            <span class="nm">Sector overview</span>
          </div>
          ${cos}
        </div></div>
      </div>`;
  }).join('');

  // Page links live in the top bar; the drawer repeats them only on phones,
  // where the top bar has no room. The rest of the sidebar is the coverage.
  el.innerHTML = `
    <div class="sb-pad">
      <div class="sb-modelbox">
        <div class="sb-mk">Valuation model</div>
        ${modelSliderHTML('sb')}
        <p class="sb-mnote">Every fair value, rating and screen on the site follows this.</p>
      </div>
      <nav class="sb-pages" aria-label="Pages">
      <div class="sb-link" data-route="home" data-navlink="home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
        Home
      </div>
      <div class="sb-link" data-route="screener" data-navlink="screener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>
        Screener
      </div>
      <div class="sb-link" data-route="portfolio" data-navlink="portfolio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7M3 12h18"/></svg>
        Portfolio
      </div>
      <div class="sb-link" data-route="track-record" data-navlink="track-record">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h4l3 9 4-18 3 9h4"/></svg>
        Track record
      </div>
      <div class="sb-link" data-route="methodology" data-navlink="methodology">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16M4 12h16M4 19h10"/></svg>
        Methodology
      </div>
      <div class="sb-link" data-route="about" data-navlink="about">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"/></svg>
        About
      </div>
      </nav>
      <div class="sb-head">Sectors</div>
      ${groups}
    </div>`;
}

/* Highlight where you are, and open the group containing it. */
function updateSidebarActive(route, arg) {
  document.querySelectorAll('.sb-link').forEach(l =>
    l.classList.toggle('active', l.dataset.navlink === route));
  document.querySelectorAll('.sb-co').forEach(c =>
    c.classList.toggle('active', !!arg && (c.dataset.co === arg || (route === 'sector' && c.dataset.co === 'sector:' + arg))));

  let openKey = null;
  if (route === 'company' && arg) {
    const co = FF_DATA.companies.find(c => c.t === arg);
    openKey = co && co.sec;
  } else if (route === 'sector') {
    openKey = arg;
  }
  if (openKey) {
    const g = document.querySelector(`.sb-group[data-group="${openKey}"]`);
    document.querySelectorAll('.sb-group.open').forEach(o => {
      if (o !== g) { o.classList.remove('open'); o.querySelector('.sb-group-head')?.setAttribute('aria-expanded', 'false'); }
    });
    if (g && !g.classList.contains('open')) {
      g.classList.add('open');
      g.querySelector('.sb-group-head')?.setAttribute('aria-expanded', 'true');
    }
    // bring the active row into view without yanking the whole page
    // after the group has finished opening, so the row's position is final
    setTimeout(() => {
      const active = document.querySelector('.sb-co.active');
      const sb = document.getElementById('sidebar');
      if (!active || !sb) return;
      const r = active.getBoundingClientRect(), box = sb.getBoundingClientRect();
      if (r.top < box.top + 40 || r.bottom > box.bottom - 40)
        sb.scrollBy({ top: r.top - box.top - sb.clientHeight / 2, behavior: 'smooth' });
    }, 360);
  }
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sb-backdrop')?.classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sb-backdrop')?.classList.remove('show');
}
function toggleSidebar() {
  const open = document.getElementById('sidebar')?.classList.contains('open');
  open ? closeSidebar() : openSidebar();
}

/* ---------------------------------- nav population ---------------------- */
function buildSectorMenu() {
  const menu = document.getElementById('sector-menu');
  menu.innerHTML = FF_DATA.sectors.map(s =>
    `<a href="#/sector/${s.k}"><span class="sm-name">${s.n}</span><span class="sm-meta">${s.count} companies · $${s.mcap}T</span></a>`
  ).join('');
}
function updateNavActive(navKey) {
  document.querySelectorAll('.main-nav a[data-nav]').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === navKey);
  });
}

/* ---------------------------------- sector dropdown ---------------------- */
function toggleSectorMenu(e) {
  e.stopPropagation();
  document.getElementById('sector-menu').classList.toggle('open');
}
function closeSectorMenu() { document.getElementById('sector-menu')?.classList.remove('open'); }

/* ---------------------------------- mobile nav ---------------------------- */
function toggleMobileNav(e) {
  e.stopPropagation();
  document.querySelector('.main-nav').classList.toggle('mobile-open');
}
function closeMobileNav() { document.querySelector('.main-nav')?.classList.remove('mobile-open'); }

/* ---------------------------------- search --------------------------------- */
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

function runSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { closeSearch(); return; }
  const hits = searchCompanies(q, 8);
  if (!hits.length) {
    searchResults.innerHTML = `<div class="sr-item" style="color:var(--text-dim);cursor:default;">No matches for "${escapeHtml(q)}"</div>`;
  } else {
    searchResults.innerHTML = hits.map(c => `
      <div class="sr-item" data-route="company" data-ticker="${c.t}">
        <span class="sr-tick">${c.t}</span><span class="sr-name">${c.n}</span>
        <span class="sr-rating rating-pill ${ratingClass(c.rating)}">${c.rating}</span>
      </div>`).join('');
  }
  searchResults.classList.add('open');
}
function closeSearch() { searchResults?.classList.remove('open'); }

searchInput?.addEventListener('input', e => runSearch(e.target.value));
searchInput?.addEventListener('focus', e => { if (e.target.value) runSearch(e.target.value); });

/* ---------------------------------- global delegated clicks ---------------- */
document.addEventListener('click', (e) => {
  // Switch the valuation model: every fair value, upside and rating on the
  // site changes, so redraw in place (same page, same tab, same scroll).
  const modelBtn = e.target.closest('button[data-model]');
  if (modelBtn) {
    if (modelBtn.dataset.model === MODEL.cur) return;
    const want = modelBtn.dataset.model;
    const go = () => {
      const y = window.scrollY;
      const snap = twCapture(APP);
      const open = [...document.querySelectorAll('.sb-group.open')].map(g => g.dataset.group);
      applyModel(want);
      buildSidebar();
      open.forEach(k => { const g = document.querySelector(`.sb-group[data-group="${k}"]`); if (g) { g.classList.add('open'); const b = g.querySelector('[data-toggle-group]'); if (b) b.setAttribute('aria-expanded', 'true'); } });
      renderRoute({ keepScroll: true, swap: true });
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      twPlay(APP, snap);
      modelToast();
    };
    if (!FF_REDUCED()) {
      // every slider on the page moves together, then the numbers follow
      document.querySelectorAll('[data-mtog]').forEach(t => t.classList.add('flip'));
      setTimeout(go, 230);
    } else go();
    return;
  }
  // A rating on the homepage opens the screener filtered to it.
  const rateEl = e.target.closest('[data-screen-rating]');
  if (rateEl) {
    SCREEN.sectors.clear(); SCREEN.ratings.clear();
    SCREEN.ratings.add(rateEl.dataset.screenRating);
    go('#/screener');
    return;
  }
  const navEl = e.target.closest('[data-route]');
  if (navEl) {
    const r = navEl.dataset.route;
    // Parameterised routes need their argument; everything else is just the
    // route name. Written generically on purpose: an earlier hardcoded
    // if-chain silently did nothing for routes nobody remembered to add.
    if (r === 'home') go('#/');
    else if (r === 'sector') go('#/sector/' + navEl.dataset.key);
    else if (r === 'company') go('#/company/' + encodeURIComponent(navEl.dataset.ticker));
    else if (r) go('#/' + r);
    return;
  }
  const tabEl = e.target.closest('[data-tab]');
  if (tabEl) {
    const ticker = tabEl.dataset.ticker, tab = tabEl.dataset.tab;
    STATE.activeTab[ticker] = tab;
    document.querySelectorAll('.co-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.co-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    moveTabInk(tabEl.closest('.co-tabs'));
    return;
  }
  const sortEl = e.target.closest('[data-sort-col]');
  if (sortEl) {
    const key = currentSectorKey();
    const col = sortEl.dataset.sortCol;
    const cur = STATE.sectorSort[key];
    cur.dir = (cur.col === col) ? -cur.dir : -1;
    cur.col = col;
    document.getElementById('sector-table-wrap').innerHTML = sectorTableHTML(key);
    return;
  }
  const filterEl = e.target.closest('[data-filter]');
  if (filterEl) {
    const key = currentSectorKey();
    STATE.sectorFilter[key] = filterEl.dataset.filter;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === filterEl.dataset.filter));
    document.getElementById('sector-table-wrap').innerHTML = sectorTableHTML(key);
    return;
  }
  const faqEl = e.target.closest('[data-faq]');
  if (faqEl) { faqEl.classList.toggle('open'); return; }

  // ---- screener -------------------------------------------------------
  const scrSec = e.target.closest('[data-screen-sector]');
  if (scrSec) {
    const k = scrSec.dataset.screenSector;
    SCREEN.sectors.has(k) ? SCREEN.sectors.delete(k) : SCREEN.sectors.add(k);
    scrSec.classList.toggle('active');
    refreshScreener();
    return;
  }
  const scrRat = e.target.closest('[data-screen-rating]');
  if (scrRat) {
    const r = scrRat.dataset.screenRating;
    SCREEN.ratings.has(r) ? SCREEN.ratings.delete(r) : SCREEN.ratings.add(r);
    scrRat.classList.toggle('active');
    refreshScreener();
    return;
  }
  const scrTog = e.target.closest('[data-screen-toggle]');
  if (scrTog) {
    SCREEN.netCashOnly = !SCREEN.netCashOnly;
    scrTog.classList.toggle('active');
    refreshScreener();
    return;
  }
  const scrSort = e.target.closest('[data-screen-sort]');
  if (scrSort) {
    const col = scrSort.dataset.screenSort;
    SCREEN.sort.dir = (SCREEN.sort.col === col) ? -SCREEN.sort.dir : -1;
    SCREEN.sort.col = col;
    refreshScreener();
    return;
  }
  if (e.target.closest('[data-screen-reset]')) {
    SCREEN.sectors.clear(); SCREEN.ratings.clear();
    SCREEN.upsideMin = SCREEN.mcapMin = SCREEN.evsMax = SCREEN.fcfyMin = null;
    SCREEN.netCashOnly = false;
    renderRoute();
    return;
  }

  // expand/collapse a sector group in the sidebar
  const grpEl = e.target.closest('[data-toggle-group]');
  if (grpEl) {
    const g = grpEl.closest('.sb-group');
    const nowOpen = !g.classList.contains('open');
    if (nowOpen) document.querySelectorAll('.sb-group.open').forEach(o => {
      if (o !== g) { o.classList.remove('open'); o.querySelector('.sb-group-head')?.setAttribute('aria-expanded', 'false'); }
    });
    g.classList.toggle('open', nowOpen);
    grpEl.setAttribute('aria-expanded', String(nowOpen));
    return;
  }

  if (e.target.closest('#sector-menu-btn')) { toggleSectorMenu(e); return; }
  if (e.target.closest('#mobile-toggle-btn')) { toggleSidebar(); return; }
  if (e.target.closest('#sb-backdrop')) { closeSidebar(); return; }
  if (e.target.closest('.search-box')) { return; }
  if (e.target.closest('#sidebar')) { closeSectorMenu(); closeSearch(); return; }

  closeSectorMenu(); closeSearch(); closeMobileNav();
});

// Escape closes the mobile drawer
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeSidebar(); closeSearch(); closeSectorMenu(); }
  // tiles that act as links open on Enter, like a real link
  if (e.key === 'Enter' && e.target.matches && e.target.matches('[role="link"][data-route]')) e.target.click();
});

/* ---------------------------------- back-to-top ----------------------------- */
const backTop = document.getElementById('back-top');
window.addEventListener('scroll', () => {
  backTop?.classList.toggle('show', window.scrollY > 900);
});
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------------------------------- boot -------------------------------------- */
// Any visible count comes from the data, never a hardcoded number.
(function labelCounts() {
  const n = FF_DATA.companies.length;
  const search = document.getElementById('search-input');
  if (search) search.placeholder = `Search ${n} companies…`;
  const foot = document.getElementById('footer-count');
  if (foot) foot.textContent =
    `An independent, educational equity research library covering ${n} global ` +
    `companies — two consistent models, DCF and peer multiples, built and maintained by a high school student.`;
})();

applyModel(savedModel());
{ const h = document.getElementById('hdr-model'); if (h) h.innerHTML = modelSliderHTML('hdr'); }
buildSectorMenu();
buildSidebar();
markDecorativeSvgs();   // header, sidebar and footer icons on first paint
window.addEventListener('hashchange', renderRoute);
renderRoute();

/* Point search engines at the static version of whatever is on screen.
   Without this the app route and the indexable page look like duplicate
   content, and Google picks one arbitrarily. */
function updateCanonical(navKey, arg) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  const base = location.origin + location.pathname.replace(/index\.html$/, '');
  if (navKey === 'company' && arg) {
    link.href = base + 'company/' + decodeURIComponent(arg) + '/';
  } else if (navKey === 'sector' && arg) {
    link.href = base + 'sector/' + arg + '/';
  } else {
    link.href = base;
  }
}

/* ---------------------------------- screener helpers -------------------- */
function refreshScreener() {
  const wrap = document.getElementById('screen-results');
  if (wrap) wrap.innerHTML = screenerTableHTML();
  const count = document.getElementById('screen-count');
  if (count) {
    const n = screenerResults().length;
    count.textContent = `${n} of ${FF_DATA.companies.length} companies match`;
  }
}

// Numeric filter inputs: debounced so typing "150" doesn't re-render at "1".
let screenTimer = null;
document.addEventListener('input', e => {
  const el = e.target.closest('[data-screen-num]');
  if (!el) return;
  const key = el.dataset.screenNum;
  const raw = el.value.trim();
  SCREEN[key] = raw === '' ? null : (isNaN(parseFloat(raw)) ? null : parseFloat(raw));
  clearTimeout(screenTimer);
  screenTimer = setTimeout(refreshScreener, 220);
});

/* Portfolio behaviour lives with the view, in views.js (mountPortfolio). */



/* Share a company. The link is the company's own page (/company/NVDA/), not
   the #/ address: apps can't see anything after a #, so only the real page
   gives the link its preview card. People who tap it land on that page, which
   links straight into the full model. */
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-share]');
  if (!btn) return;
  const c = byT(btn.dataset.share);
  if (!c) return;
  const url = `${CASE_SITE}company/${encodeURIComponent(c.t)}/`;
  const label = btn.querySelector('span');
  const say = (txt) => {
    label.textContent = txt;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { label.textContent = 'Share'; }, 2200);
  };
  // Phones: the system share sheet (Messages, WhatsApp, Instagram DMs...).
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: `${c.n} (${c.t}) | FreeFlow Finance`, url });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;   // they closed the sheet
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    say('Link copied');
  } catch (err) {
    window.prompt('Copy this link:', url);
  }
});


/* The gold marker under the company tabs slides to the chosen tab. */
function moveTabInk(tabs) {
  if (!tabs) return;
  let ink = tabs.querySelector('.co-ink');
  if (!ink) { ink = document.createElement('span'); ink.className = 'co-ink'; tabs.appendChild(ink); }
  const on = tabs.querySelector('.co-tab.active');
  if (!on) { ink.style.width = '0'; return; }
  ink.style.width = on.offsetWidth + 'px';
  ink.style.transform = `translateX(${on.offsetLeft}px)`;
}
function mountTabInk(root) {
  (root || document).querySelectorAll('.co-tabs').forEach(tabs => {
    const ink = document.createElement('span');
    ink.className = 'co-ink';
    ink.style.transition = 'none';             // land in place on first paint
    tabs.appendChild(ink);
    moveTabInk(tabs);
    requestAnimationFrame(() => { ink.style.transition = ''; });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveTabInk(tabs));
  });
}
window.addEventListener('resize', () => document.querySelectorAll('.co-tabs').forEach(moveTabInk));
