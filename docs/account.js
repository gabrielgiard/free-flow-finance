/* FreeFlow Finance — optional accounts, the watchlist and saved cases.

   Nothing here is required. Every page works signed out, exactly as before:
   the portfolio, the Monte Carlo settings, the Daily Ten streak, the
   watchlist and saved "Your case" scenarios all live in this browser's
   storage. Signing in only copies them to one private record per person
   (Google Firebase) and keeps every device that signs in up to date.

   How it fits together
     FF_SYNCCORE   pure merge rules, no browser needed (tested in node by
                   account_test.js). Two copies of the same data, one on this
                   device and one in the account, go in; one merged copy
                   comes out. The same inputs always give the same output on
                   every device, so two devices can never argue forever.
     the rest      the browser side: notices when the site saves one of the
                   synced keys, the sign-in window, the watchlist star and
                   sidebar list, saved cases, and the privacy page.

   The sign-in window and the Firebase scripts are only loaded when someone
   clicks "Sign in" (or comes back already signed in), so visitors who never
   sign in download nothing extra. With no settings in auth-config.js the
   sign-in button never appears; the watchlist and saved cases still work. */

/* ---------------------------------------------------------- sync core --- */

const FF_SYNCCORE = (function () {
  'use strict';
  const UNITS = ['portfolio', 'mc', 'play', 'watch', 'cases'];
  const FIELDS = ['portfolio', 'example', 'mc', 'play', 'watch', 'cases'];
  const FIELD_UNIT = { portfolio: 'portfolio', example: 'portfolio', mc: 'mc', play: 'play', watch: 'watch', cases: 'cases' };
  const DAYS_KEPT = 60, WATCH_MAX = 400, CASES_MAX = 300;

  function parse(s) {
    if (typeof s !== 'string' || !s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  // one spelling per value, whatever order the keys were written in
  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (isObj(v)) {
      return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined)
        .map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    }
    return JSON.stringify(v === undefined ? null : v);
  }
  function canon(s) { const v = parse(s); return v == null ? '' : stable(v); }
  function same(field, a, b) {
    if (field === 'example') return (a === '1') === (b === '1');
    return canon(a) === canon(b);
  }
  // tie-breaks have to come out the same on both devices: compare the text
  function pickStable(a, b) { return stable(a) >= stable(b) ? a : b; }
  function prevDay(d) {
    const p = d.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] - 1)).toISOString().slice(0, 10);
  }
  function hasPositions(s) { const v = parse(s); return Array.isArray(v) && v.length > 0; }

  /* Whole values (the portfolio, the Monte Carlo settings): the most
     recently changed copy wins. A copy that has never been touched loses to
     one that has; equal times fall back to the text so both devices agree. */
  function newest(lv, lt, rv, rt) {
    if (canon(lv) === canon(rv)) return 'same';
    lt = +lt || 0; rt = +rt || 0;
    if (!rv && !rt) return 'L';
    if (!lv && !lt) return 'R';
    if (lt !== rt) return lt > rt ? 'L' : 'R';
    return canon(lv) >= canon(rv) ? 'L' : 'R';
  }

  /* The Daily Ten: every day played on any device counts. The streak is
     recounted from the merged days (or kept, if one copy already knows a
     longer run ending on the same day: only two months of days are kept). */
  function playOf(s) {
    const v = parse(s);
    if (!isObj(v) || !isObj(v.days)) return null;
    const days = {};
    Object.keys(v.days).forEach(k => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(v.days[k])) days[k] = v.days[k];
    });
    return { last: String(v.last || ''), streak: +v.streak || 0, best: +v.best || 0, played: +v.played || 0, days };
  }
  function score(marks) { return marks.filter(Boolean).length; }
  function mergePlay(la, ra) {
    const a = playOf(la), b = playOf(ra);
    if (!a && !b) return '';
    if (!a) return stable(b);
    if (!b) return stable(a);
    const days = {};
    new Set(Object.keys(a.days).concat(Object.keys(b.days))).forEach(k => {
      const x = a.days[k], y = b.days[k];
      days[k] = !x ? y : !y ? x : score(x) !== score(y) ? (score(x) > score(y) ? x : y) : pickStable(x, y);
    });
    const keys = Object.keys(days).sort();
    const keep = keys.slice(-DAYS_KEPT);
    const last = keys.length ? keys[keys.length - 1] : '';
    let run = 0;
    for (let d = last; d && days[d]; d = prevDay(d)) run++;
    const streak = last ? Math.max(run, a.last === last ? a.streak : 0, b.last === last ? b.streak : 0) : 0;
    const onlyA = keep.filter(k => a.days[k] && !b.days[k]).length;
    const onlyB = keep.filter(k => b.days[k] && !a.days[k]).length;
    const played = Math.max(a.played + onlyB, b.played + onlyA, keep.length);
    const best = Math.max(a.best, b.best, streak);
    const out = {};
    keep.forEach(k => { out[k] = days[k]; });
    return stable({ last, streak, best, played, days: out });
  }

  /* Watchlist and saved cases: merged company by company. Each entry
     carries the time it was last changed ("at"); removing one leaves a
     marker behind, so a removal on the phone also removes it on the laptop.
     The watchlist's "last seen rating" has its own time ("sa"), so opening
     a page on one device never undoes a star added on another. */
  function cap(m, n) {
    const ks = Object.keys(m);
    if (ks.length <= n) return m;
    ks.sort((p, q) => ((+m[q].at || 0) - (+m[p].at || 0)) || (p < q ? -1 : 1));
    const out = {};
    ks.slice(0, n).forEach(k => { out[k] = m[k]; });
    return out;
  }
  function mergeEntries(la, ra, withSeen, max) {
    const a = parse(la), b = parse(ra);
    const A = isObj(a) ? a : null, B = isObj(b) ? b : null;
    if (!A && !B) return '';
    const out = {};
    new Set(Object.keys(A || {}).concat(Object.keys(B || {}))).forEach(t => {
      const x = A && isObj(A[t]) ? A[t] : null, y = B && isObj(B[t]) ? B[t] : null;
      if (!x && !y) return;
      if (!x || !y) { out[t] = x || y; return; }
      const xa = +x.at || 0, ya = +y.at || 0;
      const main = xa !== ya ? (xa > ya ? x : y) : pickStable(x, y);
      const e = Object.assign({}, main);
      if (withSeen) {
        const xs = +x.sa || 0, ys = +y.sa || 0;
        const src = xs !== ys ? (xs > ys ? x : y) : main;
        if (src.seen !== undefined) { e.seen = src.seen; e.sa = src.sa; }
      }
      out[t] = e;
    });
    return stable(cap(out, max));
  }

  function emptySide() {
    return { exists: false, d: { portfolio: '', example: '', mc: '', play: '', watch: '', cases: '' }, t: {} };
  }

  /* L is this device, R is the account. opts.first is true the first time
     this device syncs with this account: if both then hold a different
     real portfolio, nobody can know which one is right, so the result keeps
     the account's copy and flags a conflict for the person to decide. */
  function mergeAll(L, R, opts) {
    opts = opts || {};
    const ld = L.d || {}, rd = R.d || {}, lt = L.t || {}, rt = R.t || {};
    const d = {}, t = {};
    let conflict = false;

    const lp = ld.portfolio || '', rp = rd.portfolio || '';
    const lEx = ld.example === '1', rEx = rd.example === '1';
    const lHas = hasPositions(lp), rHas = hasPositions(rp);
    let win;
    if (canon(lp) === canon(rp) && lEx === rEx) win = 'same';
    else if (!rHas && !(+rt.portfolio > 0)) win = 'L';          // the account has never held one
    else if (!lHas && !(+lt.portfolio > 0)) win = 'R';          // this device has never held one
    else if (lHas && rHas && lEx !== rEx) win = lEx ? 'R' : 'L'; // the example never replaces a real portfolio
    else if (opts.first && lHas && rHas) { win = 'R'; conflict = true; }
    else {
      const a = +lt.portfolio || 0, b = +rt.portfolio || 0;
      win = a !== b ? (a > b ? 'L' : 'R') : (canon(lp) + lEx >= canon(rp) + rEx ? 'L' : 'R');
    }
    if (win === 'R') { d.portfolio = canon(rp); d.example = rEx ? '1' : ''; t.portfolio = +rt.portfolio || 0; }
    else { d.portfolio = canon(lp); d.example = lEx ? '1' : ''; t.portfolio = win === 'same' ? Math.max(+lt.portfolio || 0, +rt.portfolio || 0) : (+lt.portfolio || 0); }

    const mw = newest(ld.mc || '', lt.mc, rd.mc || '', rt.mc);
    d.mc = canon(mw === 'R' ? rd.mc : ld.mc);
    t.mc = mw === 'R' ? (+rt.mc || 0) : mw === 'L' ? (+lt.mc || 0) : Math.max(+lt.mc || 0, +rt.mc || 0);

    d.play = mergePlay(ld.play || '', rd.play || '');
    d.watch = mergeEntries(ld.watch || '', rd.watch || '', true, WATCH_MAX);
    d.cases = mergeEntries(ld.cases || '', rd.cases || '', false, CASES_MAX);
    ['play', 'watch', 'cases'].forEach(u => { t[u] = Math.max(+lt[u] || 0, +rt[u] || 0); });
    return { d, t, conflict };
  }

  // fields where a merged copy differs from one side
  function diff(m, side) { return FIELDS.filter(f => !same(f, m.d[f], (side.d || {})[f] || '')); }

  const api = { UNITS, FIELDS, FIELD_UNIT, parse, stable, canon, same, prevDay, newest, mergePlay, mergeEntries, mergeAll, diff, emptySide, hasPositions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();

/* ------------------------------------------------------- browser side --- */

if (typeof window !== 'undefined' && typeof document !== 'undefined') (function () {
  'use strict';
  const CORE = FF_SYNCCORE;
  const CFG = (typeof firebaseConfig !== 'undefined' && firebaseConfig && typeof firebaseConfig === 'object' &&
               firebaseConfig.apiKey && firebaseConfig.projectId) ? firebaseConfig : null;
  // sign-in needs a real web address: the single-file copy opened from disk
  // keeps the watchlist and saved cases but shows no sign-in button
  const ON = !!CFG && /^https?:$/.test(location.protocol);
  const SDK_V = '10.14.1';
  const sdkUrl = n => `https://www.gstatic.com/firebasejs/${SDK_V}/firebase-${n}-compat.js`;
  const INAPP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|TikTok|musical_ly|Bytedance|Snapchat|LinkedInApp|Twitter for/i.test(navigator.userAgent || '');

  const KEYS = {
    portfolio: 'freeflow.portfolio.v1', example: 'freeflow.portfolio.example', mc: 'freeflow.mc.v1',
    play: 'freeflow.play.v1', watch: 'freeflow.watch.v1', cases: 'freeflow.cases.v1',
  };
  const T_KEY = 'freeflow.sync.t';     // when each synced thing last changed on this device
  const U_KEY = 'freeflow.sync.u';     // which account this device last synced with
  const FLAG = 'freeflow.acct';        // "was signed in": load the sign-in scripts on the next visit
  const KEY_FIELD = {};
  Object.keys(KEYS).forEach(f => { KEY_FIELD[KEYS[f]] = f; });

  let ls = null;
  try { ls = window.localStorage; ls.getItem('freeflow.model'); } catch (e) { ls = null; }
  const get = k => { try { return ls ? ls.getItem(k) : null; } catch (e) { return null; } };
  let applying = false;
  function rawSet(k, v) { if (!ls) return; applying = true; try { ls.setItem(k, v); } catch (e) { /* full or blocked */ } finally { applying = false; } }
  function rawDel(k) { if (!ls) return; applying = true; try { ls.removeItem(k); } catch (e) { /* blocked */ } finally { applying = false; } }
  const parse = CORE.parse;

  const S = {
    user: null, auth: null, db: null, ready: null, unsub: null, restoring: false,
    pushTimer: 0, pushing: false, again: false, deleting: false,
    st: 'idle', err: '', syncedAt: 0, conflict: null, conflictShown: false,
    modal: null, view: 'signin', opener: null, msg: '', msgOk: false, busy: false, pending: false,
  };

  /* --------------------------------------- notice saves of synced keys --- */
  // The pages save with plain localStorage calls. Rather than touching every
  // one of them, the two storage methods note when a synced key changes.
  function stamps() { const v = parse(get(T_KEY)); return v && typeof v === 'object' ? v : {}; }
  function stamp(unit, at) { const t = stamps(); t[unit] = at; rawSet(T_KEY, JSON.stringify(t)); }
  function touched(field) {
    stamp(CORE.FIELD_UNIT[field], Date.now());
    if (S.user) schedulePush();
  }
  if (ls && typeof Storage !== 'undefined' && Storage.prototype) {
    const P = Storage.prototype, oSet = P.setItem, oDel = P.removeItem;
    P.setItem = function (k, v) {
      const f = !applying && this === ls ? KEY_FIELD[k] : undefined;
      const before = f ? this.getItem(k) : null;
      oSet.call(this, k, v);
      if (f && before !== String(v)) touched(f);
    };
    P.removeItem = function (k) {
      const f = !applying && this === ls ? KEY_FIELD[k] : undefined;
      const before = f ? this.getItem(k) : null;
      oDel.call(this, k);
      if (f && before !== null) touched(f);
    };
  }

  function playNoCur(s) {
    const v = parse(s);
    if (!v || typeof v !== 'object') return '';
    delete v.cur;                       // a half-played game stays on its own device
    return JSON.stringify(v);
  }
  function readLocal() {
    const d = {}, t = stamps(), tt = {};
    Object.keys(KEYS).forEach(f => { d[f] = get(KEYS[f]) || ''; });
    d.example = d.example === '1' ? '1' : '';
    d.play = playNoCur(d.play);
    CORE.UNITS.forEach(u => { tt[u] = +t[u] || 0; });
    // saved before accounts existed: real, but older than anything stamped
    if (d.portfolio && !tt.portfolio) tt.portfolio = 1;
    ['mc', 'play', 'watch', 'cases'].forEach(u => { if (d[u] && !tt[u]) tt[u] = 1; });
    return { exists: true, d, t: tt };
  }
  function fromDoc(data) {
    const side = CORE.emptySide();
    S.lastRemote = side;                // the conflict window shows what the account holds
    if (!data || typeof data !== 'object') return side;
    side.exists = true;
    const dd = data.data && typeof data.data === 'object' ? data.data : {};
    CORE.FIELDS.forEach(f => { side.d[f] = typeof dd[f] === 'string' ? dd[f] : ''; });
    const tt = data.t && typeof data.t === 'object' ? data.t : {};
    CORE.UNITS.forEach(u => { side.t[u] = +tt[u] || 0; });
    return side;
  }
  function toDoc(m) {
    const data = {}, t = {};
    CORE.FIELDS.forEach(f => { data[f] = m.d[f] || ''; });
    CORE.UNITS.forEach(u => { t[u] = +m.t[u] || 0; });
    return { v: 1, data, t, updated: firebase.firestore.FieldValue.serverTimestamp() };
  }
  // write the merged copy into this device, skipping anything that changed
  // here while the merge was running (that newer edit wins and goes up next)
  function applyMerge(L, m) {
    const now = readLocal(), changed = new Set(), t = stamps();
    CORE.FIELDS.forEach(f => {
      const unit = CORE.FIELD_UNIT[f];
      if (m.conflict && unit === 'portfolio') return;
      if (!CORE.same(f, now.d[f], L.d[f])) return;
      if (CORE.same(f, m.d[f], now.d[f])) return;
      let v = m.d[f];
      if (f === 'play' && v) {
        const o = parse(v), mine = parse(get(KEYS.play));
        if (o && mine && mine.cur) o.cur = mine.cur;
        v = JSON.stringify(o);
      }
      if (v) rawSet(KEYS[f], v); else rawDel(KEYS[f]);
      changed.add(unit);
    });
    changed.forEach(u => { t[u] = +m.t[u] || 0; });
    if (changed.size) rawSet(T_KEY, JSON.stringify(t));
    return Array.from(changed);
  }
  function needsPush(m, R) { return !R.exists || CORE.diff(m, R).length > 0; }
  function firstSync() { return !S.user || get(U_KEY) !== S.user.uid; }

  /* ------------------------------------------------------- the cloud --- */
  function docRef() { return S.db.collection('users').doc(S.user.uid); }
  function schedulePush(ms) {
    clearTimeout(S.pushTimer);
    S.pushTimer = setTimeout(push, ms == null ? 1200 : ms);
  }
  async function push() {
    S.pushTimer = 0;
    if (!S.user || !S.db || S.deleting) return;
    if (S.pushing) { S.again = true; return; }
    S.pushing = true;
    status('busy');
    const ref = docRef();
    try {
      let out = null;
      // read, merge and write in one step, so two devices saving at the same
      // moment cannot overwrite each other
      await S.db.runTransaction(tx => tx.get(ref).then(snap => {
        const R = fromDoc(snap.exists ? snap.data() : null);
        const L = readLocal();
        const m = CORE.mergeAll(L, R, { first: firstSync() });
        out = { L, m };
        if (needsPush(m, R)) tx.set(ref, toDoc(m));
      }));
      if (S.deleting || !S.user) return;
      afterMerge(out.m, applyMerge(out.L, out.m));
      status('ok');
    } catch (e) {
      status('err', e);
    } finally {
      S.pushing = false;
      if (S.again) { S.again = false; schedulePush(300); }
    }
  }
  function listen() {
    stopListen();
    const uid = S.user.uid;
    status('busy');
    S.unsub = docRef().onSnapshot(snap => {
      if (snap.metadata && snap.metadata.hasPendingWrites) return;
      if (S.deleting || !S.user || S.user.uid !== uid) return;
      const R = fromDoc(snap.exists ? snap.data() : null);
      const L = readLocal();
      const m = CORE.mergeAll(L, R, { first: firstSync() });
      afterMerge(m, applyMerge(L, m));
      if (needsPush(m, R)) schedulePush(250); else status('ok');
    }, e => status('err', e));
  }
  function stopListen() { if (S.unsub) { try { S.unsub(); } catch (e) { /* already gone */ } } S.unsub = null; }
  function afterMerge(m, changed) {
    if (m.conflict) {
      S.conflict = true;
      if (!S.conflictShown) { S.conflictShown = true; open('conflict'); }
    } else {
      S.conflict = null;
      if (S.user && get(U_KEY) !== S.user.uid) rawSet(U_KEY, S.user.uid);
    }
    refreshUI(changed);
    hdrBtn();
  }

  const FRIENDLY = {
    'auth/invalid-email': "That email address doesn't look right.",
    'auth/missing-email': 'Type your email address.',
    'auth/missing-password': 'Type your password.',
    'auth/weak-password': 'Use a longer password: at least 8 characters.',
    'auth/email-already-in-use': 'There is already an account with that email. Sign in instead.',
    'auth/invalid-credential': "That email and password don't match.",
    'auth/invalid-login-credentials': "That email and password don't match.",
    'auth/wrong-password': "That email and password don't match.",
    'auth/user-not-found': "That email and password don't match.",
    'auth/too-many-requests': 'Too many tries. Wait a few minutes, or reset your password.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site, or sign in with email.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/unauthorized-domain': "Sign-in isn't switched on for this web address yet.",
    'auth/operation-not-allowed': "That way of signing in isn't switched on yet. Try the other one.",
    'auth/account-exists-with-different-credential': 'That email already has an account. Sign in with email and password.',
    'auth/user-disabled': 'This account has been switched off.',
    'auth/requires-recent-login': 'For safety, sign out and back in, then try again.',
    'auth/user-mismatch': 'That was a different account. Use the one you are signed in with.',
    'permission-denied': "The account's database refused the change.",
    'unavailable': "You're offline. Your changes are kept here and will sync when you're back.",
  };
  function friendly(e) {
    const code = (e && e.code) || '';
    return FRIENDLY[code] || FRIENDLY[code.replace(/^firestore\//, '')] || 'Something went wrong' + (code ? ` (${code})` : '') + '. Try again.';
  }
  function status(st, e) {
    S.st = st;
    if (st === 'ok') { S.syncedAt = Date.now(); S.err = ''; }
    if (st === 'err') S.err = friendly(e);
    hdrBtn();
    const line = document.getElementById('acct-sync');
    if (line) line.outerHTML = syncLineHTML();
  }

  /* --------------------------------------------- loading the sign-in kit --- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      const to = setTimeout(() => rej(new Error('timeout')), 20000);
      s.onload = () => { clearTimeout(to); res(); };
      s.onerror = () => { clearTimeout(to); rej(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  function ready() {
    if (!ON) return Promise.reject(new Error('off'));
    if (S.ready) return S.ready;
    S.ready = (async () => {
      if (typeof firebase === 'undefined' || !firebase.initializeApp) await loadScript(sdkUrl('app'));
      await Promise.all([
        firebase.auth ? null : loadScript(sdkUrl('auth')),
        firebase.firestore ? null : loadScript(sdkUrl('firestore')),
      ]);
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      S.auth = firebase.auth();
      S.db = firebase.firestore();
      await new Promise(res => {
        let first = true;
        S.auth.onAuthStateChanged(u => { onUser(u); if (first) { first = false; res(); } });
      });
    })();
    S.ready.catch(() => { S.ready = null; S.restoring = false; hdrBtn(); if (S.modal) render(); });
    return S.ready;
  }

  function initialOf(u) {
    const s = String((u && (u.displayName || u.email)) || '?').trim();
    return (s[0] || '?').toUpperCase();
  }
  function onUser(user) {
    const was = S.user;
    S.user = user || null;
    S.restoring = false;
    if (user) {
      rawSet(FLAG, JSON.stringify({ i: initialOf(user) }));
      if (!was || was.uid !== user.uid) { S.conflict = null; S.conflictShown = false; listen(); }
      if (S.modal) {
        if (['signin', 'create', 'reset'].includes(S.view)) { S.view = 'account'; S.welcome = true; S.msg = ''; }
        if (S.view === 'account') render();
      }
    } else {
      stopListen();
      clearTimeout(S.pushTimer);
      rawDel(FLAG);
      S.st = 'idle';
      if (S.modal && (S.view === 'account' || S.view === 'conflict')) { S.view = 'signin'; render(); }
    }
    hdrBtn();
    refreshLede();
  }

  /* --------------------------------------------------- header button --- */
  const ICN_USER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.2" r="3.6"/><path d="M4.8 20c1.1-3.9 3.9-5.9 7.2-5.9s6.1 2 7.2 5.9"/></svg>';
  const ICN_STAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7.9l5-.7z" fill="currentColor" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  const ICN_G = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0012 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 010-4.6V6.6H1.3a12 12 0 000 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0012 0 12 12 0 001.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';

  function hdrBtn() {
    if (!ON) return;
    let b = document.getElementById('hdr-acct');
    if (!b) {
      const right = document.querySelector('.header-right');
      if (!right) return;
      b = document.createElement('button');
      b.type = 'button'; b.id = 'hdr-acct'; b.className = 'hdr-acct';
      right.insertBefore(b, document.getElementById('mobile-toggle-btn'));
      right.classList.add('has-acct');
    }
    const cached = parse(get(FLAG));
    if (S.user || S.restoring) {
      const i = S.user ? initialOf(S.user) : (cached && cached.i) || '';
      const dot = S.conflict ? 'warn' : S.st === 'err' ? 'err' : S.st === 'busy' ? 'busy' : '';
      b.className = 'hdr-acct in' + (S.user ? '' : ' wait');
      b.innerHTML = `<span class="ha-av">${escapeHtml(i)}</span>${dot ? `<i class="ha-dot ${dot}"></i>` : ''}`;
      b.setAttribute('aria-label', S.user ? 'Your account' + (S.conflict ? ': a decision is waiting' : '') : 'Your account (connecting)');
      b.title = S.user ? (S.user.email || 'Your account') : 'Connecting…';
    } else {
      b.className = 'hdr-acct';
      b.innerHTML = `${ICN_USER}<span class="ha-t">Sign in</span>`;
      b.setAttribute('aria-label', 'Sign in (optional): sync your portfolio and watchlist across devices');
      b.title = 'Optional: keep your portfolio, watchlist and streak on every device';
    }
  }

  /* ---------------------------------------------------------- the window --- */
  function open(view, opener) {
    if (!ON) return;
    S.view = view;
    S.msg = ''; S.msgOk = false; S.welcome = false;
    if (!S.modal) {
      S.opener = opener || document.activeElement;
      const back = document.createElement('div');
      back.className = 'acct-back';
      back.innerHTML = '<div class="acct-box" role="dialog" aria-modal="true" aria-labelledby="acct-h"></div>';
      back.addEventListener('mousedown', e => { if (e.target === back) close(); });
      document.body.appendChild(back);
      document.documentElement.classList.add('acct-open');
      S.modal = back;
      requestAnimationFrame(() => back.classList.add('show'));
    }
    render();
    const f = S.modal.querySelector('input:not([type=checkbox]), .acct-google:not([disabled]), button.btn');
    if (f) f.focus({ preventScroll: true });
    // the kit starts loading the moment the window opens, so it is ready by
    // the time the Google button is pressed (a pop-up must open straight away)
    if (!S.auth) ready().then(() => { if (S.modal) render(true); }, () => {});
  }
  function close() {
    if (!S.modal) return;
    const m = S.modal;
    S.modal = null;
    document.documentElement.classList.remove('acct-open');
    m.classList.remove('show');
    setTimeout(() => m.remove(), 180);
    if (S.opener && document.contains(S.opener)) S.opener.focus({ preventScroll: true });
    S.opener = null;
  }
  function render(keepFocus) {
    if (!S.modal) return;
    const box = S.modal.querySelector('.acct-box');
    // keep what was typed when the view redraws itself
    const keep = {};
    box.querySelectorAll('input[name]').forEach(i => { if (i.type !== 'checkbox') keep[i.name] = i.value; });
    const had = document.activeElement && box.contains(document.activeElement) ? document.activeElement.name : null;
    const V = VIEWS[S.view] || VIEWS.signin;
    box.innerHTML = `<button type="button" class="acct-x" data-acct="close" aria-label="Close">×</button>${V()}`;
    box.querySelectorAll('input[name]').forEach(i => { if (keep[i.name] != null && i.type !== 'checkbox') i.value = keep[i.name]; });
    if (keepFocus && had) { const el = box.querySelector(`[name="${had}"]`); if (el) el.focus({ preventScroll: true }); }
    if (typeof markDecorativeSvgs === 'function') markDecorativeSvgs(box);
  }
  function msgHTML() { return `<p class="acct-msg${S.msgOk ? ' ok' : ''}" role="alert">${S.msg ? escapeHtml(S.msg) : ''}</p>`; }
  function setMsg(text, ok) {
    S.msg = text || ''; S.msgOk = !!ok;
    const el = S.modal && S.modal.querySelector('.acct-msg');
    if (el) { el.textContent = S.msg; el.className = 'acct-msg' + (ok ? ' ok' : ''); }
  }
  function setBusy(on) {
    S.busy = on;
    if (!S.modal) return;
    S.modal.querySelectorAll('button, input').forEach(el => {
      if (el.dataset.acct === 'close') return;
      if (on) { el.dataset.wasDis = el.disabled ? '1' : ''; el.disabled = true; }
      else if (el.dataset.wasDis !== undefined) { el.disabled = el.dataset.wasDis === '1'; delete el.dataset.wasDis; }
    });
    S.modal.querySelector('.acct-box').classList.toggle('busy', on);
  }

  function kitNote() {
    if (S.auth) return '';
    if (S.ready) return '<p class="acct-fine acct-wait">Connecting to the sign-in service…</p>';
    return `<p class="acct-msg">Couldn't reach the sign-in service. An ad or tracker blocker can stop it; so can a weak connection.
      <button type="button" class="acct-link" data-acct="retry">Try again</button></p>`;
  }
  const VIEWS = {
    signin() { return authView('signin'); },
    create() { return authView('create'); },
    reset() {
      return `<h2 id="acct-h" class="acct-h">Reset your password</h2>
      <p class="acct-lede">Type the email you signed up with and we'll send a link to choose a new password.</p>
      <form class="acct-form" data-acct-form="reset" novalidate>
        <label class="acct-field"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" required></label>
        ${msgHTML()}
        <button type="submit" class="btn btn-violet acct-go"${S.auth ? '' : ' disabled'}>Send the link</button>
      </form>
      ${kitNote()}
      <p class="acct-switch"><button type="button" class="acct-link" data-acct="mode-signin">Back to sign in</button></p>`;
    },
    account() {
      const u = S.user;
      if (!u) return authView('signin');
      const n = counts();
      return `<h2 id="acct-h" class="acct-h">${S.welcome ? "You're signed in" : 'Your account'}</h2>
      <p class="acct-who">${escapeHtml(u.email || u.displayName || 'Signed in')}</p>
      ${syncLineHTML()}
      ${S.conflict ? `<div class="acct-decide"><b>One thing to decide.</b> This device and your account hold different portfolios.
        <button type="button" class="acct-link" data-acct="conflict">Choose which to keep</button></div>` : ''}
      <ul class="acct-what">
        <li><span>Portfolio</span><b>${n.pf}</b></li>
        <li><span>Watchlist</span><b>${n.watch}</b></li>
        <li><span>Daily Ten streak</span><b>${n.streak}</b></li>
        <li><span>Saved cases</span><b>${n.cases}</b></li>
      </ul>
      <p class="acct-fine">These follow you to any device you sign in on. Changes sync in a second or two.</p>
      ${msgHTML()}
      <div class="acct-row">
        <button type="button" class="btn btn-ghost" data-acct="signout">Sign out</button>
        <button type="button" class="acct-link" data-acct="signout-clear">Sign out and clear this device</button>
      </div>
      <div class="acct-foot">
        <a href="#/privacy" data-acct="close">What we store</a>
        <button type="button" class="acct-link acct-danger" data-acct="delete">Delete my account</button>
      </div>`;
    },
    conflict() {
      const L = readLocal(), mine = parse(L.d.portfolio) || [];
      const theirs = parse((S.lastRemote && S.lastRemote.d.portfolio) || '') || [];
      const list = a => a.slice(0, 5).map(p => escapeHtml(p.t)).join(', ') + (a.length > 5 ? '…' : '');
      return `<h2 id="acct-h" class="acct-h">Which portfolio should we keep?</h2>
      <p class="acct-lede">This device already had a portfolio before you signed in, and it isn't the same as the one in your account. Pick one; the other is replaced everywhere.</p>
      <div class="acct-choices">
        <button type="button" class="acct-choice" data-acct="keep-account">
          <b>The one in my account</b><span>${theirs.length} holding${theirs.length === 1 ? '' : 's'}${theirs.length ? ': ' + list(theirs) : ''}</span></button>
        <button type="button" class="acct-choice" data-acct="keep-device">
          <b>The one on this device</b><span>${mine.length} holding${mine.length === 1 ? '' : 's'}${mine.length ? ': ' + list(mine) : ''}</span></button>
      </div>
      <p class="acct-fine">Your watchlist, streak and saved cases don't need a choice: those were combined.</p>
      ${msgHTML()}`;
    },
    delete() {
      const u = S.user;
      if (!u) return authView('signin');
      const pw = provider(u) === 'password';
      return `<h2 id="acct-h" class="acct-h">Delete your account?</h2>
      <p class="acct-lede">This removes your login and everything synced to it from our database, straight away. It can't be undone.</p>
      <form class="acct-form" data-acct-form="delete" novalidate>
        ${pw ? '<label class="acct-field"><span>Your password, to confirm</span><input name="pw" type="password" autocomplete="current-password" required></label>'
             : '<p class="acct-fine">Google will ask you to confirm it\'s you.</p>'}
        <label class="acct-check"><input type="checkbox" name="clear"> Also clear the portfolio, watchlist and streak saved on this device</label>
        ${msgHTML()}
        <div class="acct-row">
          <button type="submit" class="btn acct-btn-danger">Delete my account</button>
          <button type="button" class="acct-link" data-acct="back">Keep it</button>
        </div>
      </form>`;
    },
    deleted() {
      return `<h2 id="acct-h" class="acct-h">Account deleted</h2>
      <p class="acct-lede">Your login and your synced data are gone. The site keeps working exactly the same without an account.</p>
      <div class="acct-row"><button type="button" class="btn btn-ghost" data-acct="close">Close</button></div>`;
    },
  };
  function authView(mode) {
    const create = mode === 'create';
    return `<h2 id="acct-h" class="acct-h">${create ? 'Create your free account' : 'Sign in to FreeFlow'}</h2>
      <p class="acct-lede">Optional. Everything on the site works without an account. Signing in keeps your portfolio, watchlist, Daily Ten streak and saved cases on every device you use.</p>
      ${INAPP ? `<p class="acct-note">Google sign-in doesn't work inside Instagram and other in-app browsers. Tap <b>•••</b> and choose <b>Open in browser</b>, or use email below.</p>` : ''}
      <button type="button" class="acct-google" data-acct="google"${S.auth && !INAPP ? '' : ' disabled'}>${ICN_G}<span>Continue with Google</span></button>
      <div class="acct-or"><span>or with email</span></div>
      <form class="acct-form" data-acct-form="${mode}" novalidate>
        <label class="acct-field"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" required></label>
        <label class="acct-field"><span>Password${create ? ' <small>at least 8 characters</small>' : ''}</span>
          <input name="pw" type="password" autocomplete="${create ? 'new-password' : 'current-password'}" required${create ? ' minlength="8"' : ''}></label>
        ${create ? '' : '<button type="button" class="acct-link acct-forgot" data-acct="mode-reset">Forgot your password?</button>'}
        ${msgHTML()}
        <button type="submit" class="btn btn-violet acct-go"${S.auth ? '' : ' disabled'}>${create ? 'Create account' : 'Sign in'}</button>
      </form>
      ${kitNote()}
      <p class="acct-switch">${create
        ? 'Already have an account? <button type="button" class="acct-link" data-acct="mode-signin">Sign in</button>'
        : 'New here? <button type="button" class="acct-link" data-acct="mode-create">Create an account</button>'}</p>
      <p class="acct-fine">Accounts are for ages 13 and up. <a href="#/privacy" data-acct="close">What we store, and what we don't</a>.</p>`;
  }
  function provider(u) {
    const p = (u && u.providerData || []).map(x => x && x.providerId);
    return p.includes('password') ? 'password' : p.includes('google.com') ? 'google.com' : (p[0] || '');
  }
  function ago(ms) {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function syncLineHTML() {
    let cls = '', txt;
    if (S.st === 'busy') { cls = 'busy'; txt = 'Syncing…'; }
    else if (S.st === 'err') { cls = 'err'; txt = S.err || "Couldn't sync. Your changes are safe on this device."; }
    else if (S.st === 'ok') { cls = 'ok'; txt = `Synced ${ago(S.syncedAt)}`; }
    else txt = 'Connecting…';
    return `<p class="acct-sync ${cls}" id="acct-sync" aria-live="polite"><i></i>${escapeHtml(txt)}</p>`;
  }
  function counts() {
    const pf = parse(get(KEYS.portfolio)), ex = get(KEYS.example) === '1';
    const play = parse(get(KEYS.play));
    let streak = 0;
    if (play && typeof FF_PLAY !== 'undefined') streak = FF_PLAY.streakNow(Object.assign(FF_PLAY.emptyStore(), play), FF_PLAY.day());
    const n = Array.isArray(pf) ? pf.length : 0;
    return {
      pf: n ? `${n} holding${n === 1 ? '' : 's'}${ex ? ' (example)' : ''}` : 'empty',
      watch: watched().length || 'none yet',
      streak: streak ? `${streak} day${streak === 1 ? '' : 's'}` : '—',
      cases: savedCases().length || 'none yet',
    };
  }

  /* ---------------------------------------------------------- actions --- */
  function act(what, el) {
    if (S.busy && what !== 'close') return;
    switch (what) {
      case 'close': close(); break;
      case 'retry': S.ready = null; render(); ready().then(() => render(true), () => render()); break;
      case 'mode-signin': S.view = 'signin'; S.msg = ''; render(true); break;
      case 'mode-create': S.view = 'create'; S.msg = ''; render(true); break;
      case 'mode-reset': S.view = 'reset'; S.msg = ''; render(true); break;
      case 'back': S.view = 'account'; S.msg = ''; render(); break;
      case 'delete': S.view = 'delete'; S.msg = ''; render(); break;
      case 'conflict': S.view = 'conflict'; S.msg = ''; render(); break;
      case 'google': google(); break;
      case 'signout': signOut(false); break;
      case 'signout-clear': signOut(true); break;
      case 'keep-account': resolve('account'); break;
      case 'keep-device': resolve('device'); break;
    }
  }
  function google() {
    if (!S.auth || INAPP) return;
    setMsg('');
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    // called straight from the click, so the browser lets the pop-up open
    S.auth.signInWithPopup(p).catch(e => {
      if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
      setMsg(friendly(e));
    });
  }
  async function submit(form) {
    const mode = form.dataset.acctForm;
    if (mode === 'delete') return deleteAccount(form);
    const email = (form.elements.email && form.elements.email.value || '').trim();
    const pw = form.elements.pw ? form.elements.pw.value : '';
    if (!email) return setMsg('Type your email address.');
    if (mode !== 'reset' && !pw) return setMsg('Type your password.');
    if (mode === 'create' && pw.length < 8) return setMsg('Use a longer password: at least 8 characters.');
    setMsg(''); setBusy(true);
    try {
      await ready();
      if (mode === 'signin') await S.auth.signInWithEmailAndPassword(email, pw);
      else if (mode === 'create') await S.auth.createUserWithEmailAndPassword(email, pw);
      else if (mode === 'reset') {
        await S.auth.sendPasswordResetEmail(email);
        setBusy(false);
        setMsg('If there is an account for that email, a reset link is on its way. Check your spam folder too.', true);
        return;
      }
    } catch (e) {
      setBusy(false);
      setMsg(e && e.code === 'auth/user-not-found' && mode === 'reset'
        ? 'If there is an account for that email, a reset link is on its way.' : friendly(e), e && e.code === 'auth/user-not-found' && mode === 'reset');
      return;
    }
    setBusy(false);   // onUser has already switched the window to the account view
  }
  const SYNCED = Object.keys(KEYS).map(f => KEYS[f]);
  function clearDevice() {
    SYNCED.concat([T_KEY, U_KEY]).forEach(rawDel);
    refreshUI(CORE.UNITS.slice(), true);
  }
  async function signOut(clear) {
    if (!S.auth || !S.user) return;
    setBusy(true);
    try {
      if (S.pushTimer) { clearTimeout(S.pushTimer); await push(); }   // send the last change first
      stopListen();
      await S.auth.signOut();
      if (clear) clearDevice();
      close();
      toast(clear ? '<b>Signed out</b> and this device is cleared.' : '<b>Signed out.</b> Everything stays on this device too.');
    } catch (e) { setMsg(friendly(e)); }
    finally { setBusy(false); }
  }
  function deleteAccount(form) {
    const u = S.user;
    if (!u || !S.auth) return;
    const clear = !!(form.elements.clear && form.elements.clear.checked);
    const prov = provider(u);
    const pw = form.elements.pw ? form.elements.pw.value : '';
    if (prov === 'password' && !pw) { setMsg('Type your password to confirm.'); return; }
    setMsg('');
    // Google's confirmation is a pop-up, so it has to start right here in the click
    const check = prov === 'password'
      ? u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw))
      : prov === 'google.com' ? u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider()) : Promise.resolve();
    setBusy(true);
    check.then(async () => {
      S.deleting = true;
      stopListen();
      clearTimeout(S.pushTimer);
      await docRef().delete();
      await u.delete();
      rawDel(U_KEY); rawDel(FLAG);
      if (clear) clearDevice();
      S.deleting = false;
      setBusy(false);
      S.view = 'deleted'; render();
    }).catch(e => {
      const wasDeleting = S.deleting;
      S.deleting = false;
      setBusy(false);
      if (wasDeleting && S.user) listen();
      if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
      setMsg(friendly(e));
    });
  }
  function resolve(which) {
    const R = S.lastRemote;
    if (which === 'account' && R) {
      rawSet(KEYS.portfolio, R.d.portfolio || '[]');
      if (R.d.example === '1') rawSet(KEYS.example, '1'); else rawDel(KEYS.example);
      if (!R.d.portfolio) rawDel(KEYS.portfolio);
      stamp('portfolio', +R.t.portfolio || 0);
      refreshUI(['portfolio']);
    } else {
      stamp('portfolio', Date.now());     // this device's copy is now the newest
    }
    if (S.user) rawSet(U_KEY, S.user.uid);
    S.conflict = null;
    schedulePush(0);
    S.view = 'account'; render();
    hdrBtn();
  }

  /* ------------------------------------------- redraw after a sync --- */
  function route() { return location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0]; }
  function typing() {
    const a = document.activeElement;
    return !!(a && typeof APP !== 'undefined' && APP.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName));
  }
  function refreshUI(units, force) {
    if (!units || !units.length) return;
    const has = u => units.includes(u);
    if (has('portfolio') && typeof PF !== 'undefined') { PF.loaded = false; PF.positions = []; PF.example = false; }
    if (has('mc') && typeof MCUI !== 'undefined') { MCUI.loaded = false; MCUI.out = null; MCUI.key = ''; }
    if (has('play') && typeof PLAY !== 'undefined') {
      PLAY.loaded = false;
      if (force) { PLAY.store = FF_PLAY.emptyStore(); PLAY.cur = null; }
      if (typeof playLoad === 'function') playLoad();
    }
    if (has('watch') || force) refreshWatch();
    const r = route();
    const redraw = (r === 'portfolio' && (has('portfolio') || has('mc') || has('watch') || has('cases'))) ||
      (r === 'play' && has('play') && (force || !PLAY.run || !PLAY.run.marks.length || PLAY.run.marks.length >= PLAY.run.picks.length)) ||
      (r === 'company' && force);
    if (!redraw || typeof renderRoute !== 'function') return;
    if (typing()) { S.pending = true; return; }
    redrawRoute();
  }
  function redrawRoute() {
    S.pending = false;
    const y = window.scrollY;
    renderRoute({ keepScroll: true, swap: true });
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }
  document.addEventListener('focusout', () => setTimeout(() => { if (S.pending && !typing()) redrawRoute(); }, 50));
  window.addEventListener('hashchange', () => { S.pending = false; close(); });
  window.addEventListener('online', () => { if (S.user) schedulePush(0); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && S.pushTimer && S.user) { clearTimeout(S.pushTimer); push(); }
  });

  /* ------------------------------------------------------- watchlist --- */
  function loadMap(key) { const v = parse(get(key)); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function saveMap(key, m) { try { localStorage.setItem(key, JSON.stringify(m)); } catch (e) { /* blocked: in-session only */ } }
  const co = t => (typeof byT === 'function' ? byT(t) : FF_DATA.companies.find(c => c.t === t));
  function ratingsOf(c) { const d = (c._dcf || c).rating; return { d, m: c.mx ? c.mx.rating : d }; }
  function seenRating(e) {
    if (!e || !e.seen) return null;
    return typeof MODEL !== 'undefined' && MODEL.cur === 'mx' ? e.seen.m : e.seen.d;
  }
  function isWatched(t) { const e = loadMap(KEYS.watch)[t]; return !!(e && e.on); }
  function watched() {
    const m = loadMap(KEYS.watch);
    return Object.keys(m).filter(t => m[t] && m[t].on && co(t))
      .sort((a, b) => (+m[b].at || 0) - (+m[a].at || 0))
      .map(t => ({ c: co(t), e: m[t] }));
  }
  function toggleWatch(t) {
    const c = co(t);
    if (!c) return;
    const m = loadMap(KEYS.watch), now = Date.now(), on = !(m[t] && m[t].on);
    m[t] = on ? { on: 1, at: now, p: c.price, seen: ratingsOf(c), sa: now }
              : Object.assign({}, m[t], { on: 0, at: now });
    saveMap(KEYS.watch, m);
    refreshWatch();
    if (route() === 'portfolio' && typeof pfRefresh === 'function') pfRefresh();
    toast(on ? `<b>${escapeHtml(c.t)} added</b> to your watchlist${ON && !S.user ? '. Sign in to see it on your other devices.' : '.'}`
             : `<b>${escapeHtml(c.t)} removed</b> from your watchlist.`);
  }
  function markSeen(t) {
    const m = loadMap(KEYS.watch), e = m[t], c = co(t);
    if (!e || !e.on || !c) return;
    const r = ratingsOf(c);
    if (e.seen && e.seen.d === r.d && e.seen.m === r.m) return;
    e.seen = r; e.sa = Date.now();
    saveMap(KEYS.watch, m);
    refreshWatch();
  }
  // under the buttons, once: the rating moved since this person last looked
  function watchNoteHTML(c) {
    const e = loadMap(KEYS.watch)[c.t];
    const was = e && e.on ? seenRating(e) : null;
    if (!was || was === c.rating) return '';
    setTimeout(() => markSeen(c.t), 0);
    return `<p class="co-wnote">Since your last visit the rating moved from <b>${escapeHtml(was)}</b> to <b>${escapeHtml(c.rating)}</b>.</p>`;
  }
  function watchBtnHTML(c) {
    const e = loadMap(KEYS.watch)[c.t], on = !!(e && e.on);
    return `<button type="button" class="co-share co-watch" data-watch="${escapeHtml(c.t)}" aria-pressed="${on}"
      aria-label="${on ? 'Remove ' : 'Add '}${escapeHtml(c.n)} ${on ? 'from' : 'to'} your watchlist">${ICN_STAR}<span>${on ? 'Watching' : 'Watch'}</span></button>`;
  }
  function sidebarInner() {
    const list = watched();
    if (!list.length) {
      return `<div class="sb-head">Watchlist</div><p class="sb-wempty">Tap <b>Watch</b> on any company to keep it here.</p>`;
    }
    return `<div class="sb-head">Watchlist <span class="sb-wn">${list.length}</span></div>` + list.map(({ c, e }) => {
      const was = seenRating(e), moved = was && was !== c.rating;
      return `<div class="sb-co sb-wco" data-route="company" data-ticker="${escapeHtml(c.t)}" data-co="${escapeHtml(c.t)}"
           title="${escapeHtml(c.n)} — ${escapeHtml(c.rating)}${moved ? ` (was ${escapeHtml(was)})` : ''}">
          <span class="dot" style="background:${ratingColor(c.rating)}"></span>
          <span class="tk">${escapeHtml(c.t)}</span>
          <span class="nm">${escapeHtml(c.n)}</span>
          ${moved ? `<span class="sb-was">was ${escapeHtml(was)}</span>` : ''}
        </div>`;
    }).join('');
  }
  function sidebarHTML() { return `<div class="sb-watch" id="sb-watch">${sidebarInner()}</div>`; }
  function refreshWatch() {
    const el = document.getElementById('sb-watch');
    if (el) {
      el.innerHTML = sidebarInner();
      const h = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
      if (h[0] === 'company' && h[1]) {
        const t = decodeURIComponent(h[1]);
        el.querySelectorAll('.sb-co').forEach(r => r.classList.toggle('active', r.dataset.co === t));
      }
    }
    document.querySelectorAll('[data-watch]').forEach(b => {
      const c = co(b.dataset.watch);
      if (!c) return;
      const on = isWatched(c.t);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Remove ' : 'Add '}${c.n} ${on ? 'from' : 'to'} your watchlist`);
      const s = b.querySelector('span');
      if (s) s.textContent = on ? 'Watching' : 'Watch';
    });
  }

  /* ------------------------------------------------------ saved cases --- */
  function getCase(t) { const e = loadMap(KEYS.cases)[t]; return e && !e.del && e.s ? e : null; }
  function saveCase(t, s, fv) {
    const m = loadMap(KEYS.cases), r6 = v => Math.round(+v * 1e6) / 1e6;
    m[t] = { s: { dg: r6(s.dg), m1: r6(s.m1), wacc: r6(s.wacc), tg: r6(s.tg) }, at: Date.now(), fv: fv > 0 ? Math.round(fv * 100) / 100 : null };
    saveMap(KEYS.cases, m);
    return m[t];
  }
  function deleteCase(t) {
    const m = loadMap(KEYS.cases);
    if (!m[t]) return;
    m[t] = { del: 1, at: Date.now() };
    saveMap(KEYS.cases, m);
  }
  function savedCases() {
    const m = loadMap(KEYS.cases);
    return Object.keys(m).filter(t => m[t] && !m[t].del && m[t].s && co(t))
      .sort((a, b) => (+m[b].at || 0) - (+m[a].at || 0))
      .map(t => ({ c: co(t), e: m[t] }));
  }
  function dateLabel(ms) { return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

  /* ------------------------------------------- the portfolio page bits --- */
  function ledeText() {
    const base = 'Add what you own, see it against our fair values, then stress-test it with a Monte Carlo simulation. ';
    if (!ON) return base + 'Saved on this device only: no account, nothing sent anywhere.';
    if (S.user || S.restoring) return base + 'Synced to your account, so it follows you to every device you sign in on.';
    return base + 'Saved on this device. <button type="button" class="pf-link pf-signin" data-acct-open>Sign in</button> if you want it on your other devices too; it\'s optional.';
  }
  function refreshLede() {
    const el = document.querySelector('.pf-lede');
    if (el) el.innerHTML = ledeText();
  }
  function mineHTML() {
    const w = watched(), cs = savedCases();
    const pct = v => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
    const wRows = w.map(({ c, e }) => {
      const since = e.p > 0 && c.price > 0 ? c.price / e.p - 1 : null;
      const er = c.earn && c.earn.next && typeof earnDay === 'function' ? `<small class="mr-earn">reports ${earnDay(c.earn.next.d)}</small>` : '';
      return `<a class="mine-row" href="#/company/${encodeURIComponent(c.t)}">
        <span class="mr-co"><span class="tk">${escapeHtml(c.t)}</span><span class="nm">${escapeHtml(c.n)}</span>${er}</span>
        <span class="mr-px">${FMT.usd(c.price)}</span>
        <span class="mr-since ${since == null ? '' : since >= 0 ? 'up' : 'down'}">${since == null ? '' : `${pct(since)} <small>since you starred</small>`}</span>
        <span class="mr-fv">${fvStr(c.fv)} <small class="${upClass(c.upside)}">${FMT.pct(c.upside)}</small></span>
        <span class="rating-pill ${ratingClass(c.rating)}">${escapeHtml(c.rating)}</span>
      </a>`;
    }).join('');
    const cRows = cs.map(({ c, e }) => {
      let v = null;
      try { if (typeof caseValue === 'function') v = caseValue(c, e.s).perShare; } catch (err) { v = null; }
      const model = dcfOf(c).fv;
      return `<a class="mine-row" href="#/company/${encodeURIComponent(c.t)}">
        <span class="mr-co"><span class="tk">${escapeHtml(c.t)}</span><span class="nm">${escapeHtml(c.n)}</span></span>
        <span class="mr-px"><small>yours</small> ${v > 0 ? FMT.usd(v) : 'N/M'}</span>
        <span class="mr-since"><small>model</small> ${fvStr(model)}</span>
        <span class="mr-fv">${v > 0 && c.price > 0 ? `<small class="${upClass(v / c.price - 1)}">${FMT.pct(v / c.price - 1)}</small> <small>vs price</small>` : ''}</span>
        <span class="mr-date">saved ${dateLabel(e.at)}</span>
      </a>`;
    }).join('');
    const invite = ON && !S.user && !S.restoring
      ? `<p class="mine-invite">Want these on your phone too? <button type="button" class="pf-link" data-acct-open>Sign in</button>. It's optional and free.</p>` : '';
    if (!w.length && !cs.length) {
      return `<div class="mine mine-empty"><p><b>Watchlist and saved cases.</b> Tap <b>Watch</b> on any company page to follow it here, and use <b>Save my case</b> under “Your case” to keep your own assumptions.</p>${invite}</div>`;
    }
    return `<div class="mine">
      ${w.length ? `<div class="mine-card"><div class="pf-h3">Your watchlist <span class="mine-n">${w.length}</span></div>${wRows}</div>` : ''}
      ${cs.length ? `<div class="mine-card"><div class="pf-h3">Your saved cases <span class="mine-n">${cs.length}</span></div>${cRows}</div>` : ''}
      ${invite}
    </div>`;
  }

  /* ----------------------------------------------------- privacy page --- */
  window.viewPrivacy = function viewPrivacy() {
    const crumb = typeof crumbs === 'function' ? crumbs({ href: '#/', label: 'Home' }, { label: 'Privacy' }) : '';
    return `
    <section class="co-hero">
      <div class="wrap">
        ${crumb}
        <h1 class="pf-title">Privacy</h1>
        <p class="pf-lede">The short version: you don't need an account, nothing is sold, and if you make an account you can delete it yourself at any time.</p>
      </div>
    </section>
    <section style="padding-top:6px"><div class="wrap prose-wrap">
      <div class="privacy">
        <h2>Without an account</h2>
        <p>Every page, tool and model on FreeFlow Finance works without signing in. Your portfolio, Monte Carlo settings, watchlist, Daily Ten results and saved “Your case” scenarios are kept in your own browser's storage on this device. They are not sent to us. Clearing your browser data removes them.</p>
        <p>The site also remembers two display choices in the same place: which valuation model you picked, and whether glossary hints are on.</p>

        <h2>If you create an account</h2>
        <p>Accounts are optional and only exist to copy the items above between your devices. Sign-in and storage are run by Google Firebase (Firebase Authentication and Cloud Firestore). We store:</p>
        <ul>
          <li>your email address, and if you use Google to sign in, the name Google shares with Firebase;</li>
          <li>your portfolio (tickers, share counts and prices paid), your Monte Carlo settings, your watchlist, your Daily Ten results for about the last two months, and your saved cases;</li>
          <li>when each of those last changed, so your devices know which copy is newest.</li>
        </ul>
        <p>That's all. No browsing history, no tracking, no ads, and nothing is sold or shared. Your password is handled by Firebase and never seen by us.</p>

        <h2>Who can see it</h2>
        <p>Each account can only read and write its own record; the database rules refuse everything else. The person who runs the site can technically open the database, as with any website that has accounts, and won't look at individual records except to fix a problem you report.</p>

        <h2>Deleting it</h2>
        <p>Open your account (the circle at the top right) and choose <b>Delete my account</b>. Your login and your synced data are removed immediately. Signing out does not delete anything.</p>

        <h2>Other services</h2>
        <p>The site is hosted on Cloudflare Pages, which keeps standard technical logs. Sign-in pages and scripts come from Google; see <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Firebase's privacy information</a>.</p>

        <h2>Age</h2>
        <p>Accounts are for people aged 13 and over.</p>

        <h2>Questions</h2>
        <p>Message us through the links on the <a href="#/about">About page</a>.</p>
        <p class="privacy-date">Last updated November 2026.</p>
      </div>
    </div></section>`;
  };

  /* -------------------------------------------------------------- toast --- */
  let toastT = 0;
  function toast(html) {
    let t = document.getElementById('mtoast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'mtoast'; t.className = 'mtoast'; t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.innerHTML = html;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ----------------------------------------------------------- events --- */
  document.addEventListener('click', e => {
    const w = e.target.closest('[data-watch]');
    if (w) { e.preventDefault(); toggleWatch(w.dataset.watch); return; }
    const o = e.target.closest('#hdr-acct, [data-acct-open]');
    if (o) { e.preventDefault(); if (!ON) return; open(S.user ? 'account' : S.restoring ? 'account' : 'signin', o); return; }
    const a = e.target.closest('[data-acct]');
    if (a && S.modal && S.modal.contains(a)) {
      if (a.tagName !== 'A') e.preventDefault();
      act(a.dataset.acct, a);
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('[data-acct-form]');
    if (!f) return;
    e.preventDefault();
    submit(f);
  });
  document.addEventListener('keydown', e => {
    if (!S.modal) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const els = Array.from(S.modal.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]'));
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* -------------------------------------------------------------- boot --- */
  if (ON) {
    if (get(FLAG)) {
      // signed in last time: show the circle straight away, connect when idle
      S.restoring = true;
      const go = () => ready().catch(() => {});
      if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 900);
    }
    hdrBtn();
  }

  window.FF_ACCT = {
    enabled: ON,
    core: CORE,
    open: v => open(v || (S.user ? 'account' : 'signin')),
    isWatched, toggleWatch, watched, watchBtnHTML, watchNoteHTML, sidebarHTML, refreshWatch,
    getCase, saveCase, deleteCase, savedCases,
    mineHTML, ledeText,
    get user() { return S.user; },
    get status() { return S.st; },
  };
})();
