"use strict";
/* ===========================================================
   store.js — ortak veri katmanı + GitHub Gist senkronizasyonu
   Web (desktop.js) ve telefon (mobile.js) aynı veriyi kullanır.
   =========================================================== */
var Store = (function () {

  const LS_DATA = 'ajanda_data_v3';
  const LS_CFG = 'ajanda_cfg_v1';
  const OLD_KEYS = ['ajanda_2026_v1', 'ajanda_2027_v1', 'ajanda_2028_v1'];
  const GIST_FILE = 'ajanda.json';

  /* ---------- sabitler ---------- */
  const PALETTE = [
    { id: 'kirmizi', name: 'Kırmızı', color: '#c0392f' },
    { id: 'turuncu', name: 'Turuncu', color: '#dd7a3f' },
    { id: 'kehribar', name: 'Kehribar', color: '#d99b28' },
    { id: 'sari', name: 'Sarı', color: '#d9bf3a' },
    { id: 'fistik', name: 'Fıstık', color: '#8aae4a' },
    { id: 'yesil', name: 'Yeşil', color: '#4aa060' },
    { id: 'zumrut', name: 'Zümrüt', color: '#2f9276' },
    { id: 'turkuaz', name: 'Turkuaz', color: '#2a9aa0' },
    { id: 'camgobegi', name: 'Camgöbeği', color: '#3f9fd0' },
    { id: 'mavi', name: 'Mavi', color: '#4a7fc1' },
    { id: 'lacivert', name: 'Lacivert', color: '#3c4f9e' },
    { id: 'mor', name: 'Mor', color: '#8f5fc0' },
    { id: 'erguvan', name: 'Erguvan', color: '#b348b3' },
    { id: 'pembe', name: 'Pembe', color: '#e0578f' },
    { id: 'bordo', name: 'Bordo', color: '#8e2a4a' },
    { id: 'kahve', name: 'Kahve', color: '#8a5a3c' },
    { id: 'kum', name: 'Kum', color: '#c4a678' },
    { id: 'komur', name: 'Kömür', color: '#5a5a5a' }
  ];

  const DEFAULT_HABITS = [
    { id: 'h_spor', name: 'Spor', icon: '🏋️', color: '#dd7a3f', pinned: true, hidden: false },
    { id: 'h_yuruyus', name: 'Yürüyüş', icon: '🚶', color: '#8aae4a', pinned: true, hidden: false },
    { id: 'h_yemek', name: 'Yemek yapmak', icon: '🍳', color: '#d9bf3a', pinned: true, hidden: false },
    { id: 'h_yuzme', name: 'Yüzme', icon: '🏊', color: '#3f9fd0', pinned: true, hidden: false },
    { id: 'h_okuma', name: 'Okuma', icon: '📖', color: '#4a7fc1', pinned: true, hidden: false }
  ];

  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const WD_FULL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const WD_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const WD_MINI = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const ICONS = ['🏋️', '🚶', '🍳', '📖', '💧', '🧘', '🏊', '🚴', '🛏️', '🎧', '✍️', '🧹', '🌿', '☕', '🎸', '🎬', '🍽️', '🧑‍🤝‍🧑', '🇩🇪', '🧺'];

  /* ---------- yardımcılar ---------- */
  const now = () => Date.now();
  const uid = p => (p || 'e') + now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const dkey = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);
  const todayKey = () => { const d = new Date(); return dkey(d.getFullYear(), d.getMonth(), d.getDate()); };
  function shiftKey(k, delta) { const p = k.split('-').map(Number); const dt = new Date(p[0], p[1] - 1, p[2] + delta); return dkey(dt.getFullYear(), dt.getMonth(), dt.getDate()); }
  function parseKey(k) { const p = k.split('-').map(Number); return { y: p[0], m: p[1] - 1, d: p[2] }; }
  function weekday(k) { const p = parseKey(k); return (new Date(p.y, p.m, p.d).getDay() + 6) % 7; }
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escAttr = s => esc(s).replace(/'/g, '&#39;');
  function rgba(hex, a) { const h = String(hex || '#888').replace('#', ''); return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')'; }
  function money(v) { const n = Number(v) || 0; return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }

  /* ---------- boş veri ---------- */
  function blank() {
    return {
      v: 3,
      cats: PALETTE.map((p, i) => ({ id: p.id, name: p.name, color: p.color, o: i, mt: 0 })),
      events: [],
      habits: DEFAULT_HABITS.map(h => Object.assign({}, h)),
      habitsMt: 0,
      habitLog: {},
      countdown: { v: '', mt: 0 },
      deleted: {}
    };
  }

  /* ---------- eski (tek dosyalık ajanda) formatından taşıma ---------- */
  const OLD_CAT_MAP = { genel: 'mavi', is: 'turuncu', yuzme: 'camgobegi', turkishnight: 'sari', maas: 'fistik', tatil: 'zumrut', seyahat: 'mor', sosyal: 'pembe' };

  function fromLegacy(raw, into) {
    const D = into || blank();
    if (!raw || typeof raw !== 'object') return D;
    const catIdx = {}; D.cats.forEach(c => catIdx[c.id] = c);

    (raw.categories || []).forEach(c => {
      const target = OLD_CAT_MAP[c.id];
      if (target && catIdx[target]) { catIdx[target].name = c.name; catIdx[target].mt = now(); }
      else if (!catIdx[c.id]) {
        const nc = { id: c.id, name: c.name, color: c.color || '#5a5a5a', o: D.cats.length, mt: now() };
        D.cats.push(nc); catIdx[c.id] = nc;
      }
    });

    const have = {}; D.events.forEach(e => have[e.id] = 1);
    (raw.events || []).forEach(e => {
      if (have[e.id]) return;
      D.events.push({
        id: e.id || uid(), date: e.date, time: e.time || '', text: e.text || '',
        cat: OLD_CAT_MAP[e.cat] || e.cat || 'mavi',
        amtType: 'none', amt: 0, mt: e.mt || 1
      });
    });

    if (Array.isArray(raw.habits) && raw.habits.length) {
      const hh = {}; D.habits.forEach(h => hh[h.id] = 1);
      raw.habits.forEach(h => { if (!hh[h.id]) D.habits.push(Object.assign({ pinned: true, hidden: false }, h)); });
      D.habitsMt = now();
    }
    if (raw.habitLog && typeof raw.habitLog === 'object') {
      Object.keys(raw.habitLog).forEach(k => {
        const val = raw.habitLog[k];
        const ids = Array.isArray(val) ? val : (val && val.i) || [];
        if (!ids.length) return;
        const cur = D.habitLog[k] && D.habitLog[k].i || [];
        D.habitLog[k] = { i: Array.from(new Set(cur.concat(ids))), mt: now() };
      });
    }
    if (typeof raw.countdown === 'string' && raw.countdown) D.countdown = { v: raw.countdown, mt: now() };
    return D;
  }

  function normalize(d) {
    const D = Object.assign(blank(), d || {});
    if (!Array.isArray(D.cats) || !D.cats.length) D.cats = blank().cats;
    if (!Array.isArray(D.events)) D.events = [];
    if (!Array.isArray(D.habits) || !D.habits.length) D.habits = blank().habits;
    if (!D.habitLog || typeof D.habitLog !== 'object') D.habitLog = {};
    if (!D.deleted || typeof D.deleted !== 'object') D.deleted = {};
    if (!D.countdown || typeof D.countdown !== 'object') D.countdown = { v: '', mt: 0 };
    D.events = D.events.map(e => Object.assign({ time: '', amtType: 'none', amt: 0, mt: 1 }, e));
    // eksik palet renklerini tamamla
    const has = {}; D.cats.forEach(c => has[c.id] = 1);
    PALETTE.forEach((p, i) => { if (!has[p.id]) D.cats.push({ id: p.id, name: p.name, color: p.color, o: i, mt: 0 }); });
    return D;
  }

  /* ---------- yükle / kaydet ---------- */
  function load() {
    let d = null;
    try { const raw = localStorage.getItem(LS_DATA); if (raw) d = JSON.parse(raw); } catch (e) { }
    if (d) return normalize(d);
    // ilk açılış: aynı tarayıcıda eski ajanda verisi varsa devral
    let D = blank();
    OLD_KEYS.forEach(k => {
      try { const raw = localStorage.getItem(k); if (raw) D = fromLegacy(JSON.parse(raw), D); } catch (e) { }
    });
    return normalize(D);
  }

  let D = load();

  function persist() { try { localStorage.setItem(LS_DATA, JSON.stringify(D)); } catch (e) { } }
  persist(); // eski formattan taşınan veriyi hemen yeni anahtara yaz

  /* ---------- olaylar ---------- */
  const listeners = { change: [], status: [] };
  function on(ev, fn) { (listeners[ev] || (listeners[ev] = [])).push(fn); }
  function emit(ev, arg) { (listeners[ev] || []).forEach(f => { try { f(arg); } catch (e) { console.error(e); } }); }

  let statusState = { kind: 'idle', text: 'Yerel' };
  function status(kind, text) { statusState = { kind: kind, text: text }; emit('status', statusState); }

  function commit() { pruneDeleted(); persist(); emit('change'); schedulePush(); }

  /* ---------- birleştirme (son yazan kazanır, kayıt bazında) ---------- */
  function mergeData(a, b) {
    a = normalize(a); b = normalize(b);
    const out = blank();

    out.deleted = Object.assign({}, a.deleted);
    Object.keys(b.deleted || {}).forEach(k => { if (!out.deleted[k] || b.deleted[k] > out.deleted[k]) out.deleted[k] = b.deleted[k]; });

    const em = {};
    a.events.forEach(e => em[e.id] = e);
    b.events.forEach(e => { const c = em[e.id]; if (!c || (e.mt || 0) > (c.mt || 0)) em[e.id] = e; });
    out.events = Object.keys(em).map(k => em[k]).filter(e => !(out.deleted[e.id] && out.deleted[e.id] >= (e.mt || 0)));

    const cm = {};
    a.cats.forEach(c => cm[c.id] = c);
    b.cats.forEach(c => { const x = cm[c.id]; if (!x || (c.mt || 0) > (x.mt || 0)) cm[c.id] = c; });
    out.cats = Object.keys(cm).map(k => cm[k]).sort((x, y) => (x.o || 0) - (y.o || 0));

    if ((b.habitsMt || 0) > (a.habitsMt || 0)) { out.habits = b.habits; out.habitsMt = b.habitsMt || 0; }
    else { out.habits = a.habits; out.habitsMt = a.habitsMt || 0; }

    out.habitLog = {};
    const keys = new Set(Object.keys(a.habitLog).concat(Object.keys(b.habitLog)));
    keys.forEach(k => {
      const x = a.habitLog[k], y = b.habitLog[k];
      if (!x) { out.habitLog[k] = y; return; }
      if (!y) { out.habitLog[k] = x; return; }
      out.habitLog[k] = (y.mt || 0) > (x.mt || 0) ? y : x;
    });
    Object.keys(out.habitLog).forEach(k => { if (!out.habitLog[k] || !out.habitLog[k].i || !out.habitLog[k].i.length) delete out.habitLog[k]; });

    out.countdown = ((b.countdown || {}).mt || 0) > ((a.countdown || {}).mt || 0) ? b.countdown : a.countdown;
    return normalize(out);
  }

  function pruneDeleted() {
    const cut = now() - 120 * 86400000;
    Object.keys(D.deleted).forEach(k => { if (D.deleted[k] < cut) delete D.deleted[k]; });
  }

  /* ---------- veri işlemleri ---------- */
  const catMap = () => { const m = {}; D.cats.forEach(c => m[c.id] = c); return m; };
  const habitMap = () => { const m = {}; D.habits.forEach(h => m[h.id] = h); return m; };
  function cat(id) { return catMap()[id] || { id: id, name: 'Diğer', color: '#5a5a5a' }; }
  function eventsByDate() { const m = {}; D.events.forEach(e => (m[e.date] = m[e.date] || []).push(e)); Object.keys(m).forEach(k => m[k].sort(byTime)); return m; }
  function byTime(a, b) { return (a.time || '99:99') < (b.time || '99:99') ? -1 : (a.time || '99:99') > (b.time || '99:99') ? 1 : 0; }
  function eventsOn(k) { return D.events.filter(e => e.date === k).sort(byTime); }

  function addEvent(ev) {
    const e = Object.assign({ id: uid('e'), date: todayKey(), time: '', text: '', cat: 'mavi', amtType: 'none', amt: 0 }, ev);
    e.mt = now(); D.events.push(e); commit(); return e;
  }
  function updateEvent(id, patch) {
    D.events = D.events.map(e => e.id === id ? Object.assign({}, e, patch, { mt: now() }) : e);
    commit();
  }
  function deleteEvent(id) {
    D.events = D.events.filter(e => e.id !== id);
    D.deleted[id] = now(); commit();
  }
  function updateCat(id, patch) {
    D.cats = D.cats.map(c => c.id === id ? Object.assign({}, c, patch, { mt: now() }) : c);
    commit();
  }
  function addCat(name, color) {
    D.cats.push({ id: uid('c'), name: name || 'Yeni', color: color || '#5a5a5a', o: D.cats.length, mt: now() });
    commit();
  }
  function setCountdown(v) { D.countdown = { v: v, mt: now() }; commit(); }

  /* aktiviteler (yalnızca web görünümünde kullanılıyor) */
  const doneOn = k => (D.habitLog[k] && D.habitLog[k].i) || [];
  function setDone(k, hid, on) {
    const cur = doneOn(k).slice();
    const i = cur.indexOf(hid);
    if (on && i < 0) cur.push(hid);
    if (!on && i >= 0) cur.splice(i, 1);
    if (cur.length) D.habitLog[k] = { i: cur, mt: now() }; else D.habitLog[k] = { i: [], mt: now() };
  }
  function toggleHabit(k, hid) { setDone(k, hid, doneOn(k).indexOf(hid) < 0); commit(); }
  function habitStreak(hid) {
    let n = 0, k = todayKey();
    if (doneOn(k).indexOf(hid) < 0) k = shiftKey(k, -1);
    while (doneOn(k).indexOf(hid) >= 0) { n++; k = shiftKey(k, -1); }
    return n;
  }
  function updateHabit(id, patch) { D.habits = D.habits.map(h => h.id === id ? Object.assign({}, h, patch) : h); D.habitsMt = now(); commit(); }
  function addHabit(name) {
    const nm = (name || '').trim(); if (!nm) return null;
    const ex = D.habits.filter(h => h.name.toLocaleLowerCase('tr') === nm.toLocaleLowerCase('tr'))[0];
    if (ex) { if (ex.hidden) updateHabit(ex.id, { hidden: false }); return ex; }
    const h = { id: uid('h'), name: nm, icon: ICONS[D.habits.length % ICONS.length], color: PALETTE[(D.habits.length + 2) % PALETTE.length].color, pinned: false, hidden: false };
    D.habits.push(h); D.habitsMt = now(); commit(); return h;
  }
  function deleteHabit(id) {
    D.habits = D.habits.filter(h => h.id !== id);
    Object.keys(D.habitLog).forEach(k => {
      const v = (D.habitLog[k].i || []).filter(x => x !== id);
      D.habitLog[k] = { i: v, mt: now() };
    });
    D.habitsMt = now(); commit();
  }

  /* ---------- P&L ---------- */
  function totals(filterFn) {
    let inc = 0, exp = 0;
    D.events.forEach(e => {
      if (e.amtType !== 'inc' && e.amtType !== 'exp') return;
      if (filterFn && !filterFn(e)) return;
      if (e.amtType === 'inc') inc += Number(e.amt) || 0; else exp += Number(e.amt) || 0;
    });
    return { inc: inc, exp: exp, net: inc - exp };
  }

  /* ---------- yedek ---------- */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ajanda-yedek-' + todayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importJSON(text) {
    const raw = JSON.parse(text);
    const incoming = (raw && raw.v === 3) ? normalize(raw) : fromLegacy(raw, blank());
    D = mergeData(D, incoming);
    // içe aktarılan kayıtları uzağa da taşı
    D.events = D.events.map(e => Object.assign({}, e, { mt: Math.max(e.mt || 1, now()) }));
    commit();
    return D.events.length;
  }

  /* =========================================================
     GitHub Gist senkronizasyonu
     ========================================================= */
  function cfg() {
    let c = { token: '', gist: '', last: 0, auto: true };
    try { const raw = localStorage.getItem(LS_CFG); if (raw) c = Object.assign(c, JSON.parse(raw)); } catch (e) { }
    return c;
  }
  function setCfg(patch) {
    const c = Object.assign(cfg(), patch);
    try { localStorage.setItem(LS_CFG, JSON.stringify(c)); } catch (e) { }
    emit('status', statusState);
    return c;
  }

  async function api(path, opts) {
    const c = cfg();
    const r = await fetch('https://api.github.com' + path, Object.assign({
      headers: {
        'Authorization': 'Bearer ' + c.token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }, opts || {}));
    if (r.status === 401) throw new Error('Token geçersiz (401). Ayarlardan yeni token girin.');
    if (r.status === 404) throw new Error('Gist bulunamadı (404). Gist ID yanlış olabilir.');
    if (!r.ok) throw new Error('GitHub hatası ' + r.status);
    return r.json();
  }

  async function createGist() {
    const g = await api('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Ajanda verisi (otomatik)',
        public: false,
        files: { [GIST_FILE]: { content: JSON.stringify(D) } }
      })
    });
    setCfg({ gist: g.id });
    return g.id;
  }

  let syncing = false, pushTimer = null, dirty = false;

  function schedulePush() {
    dirty = true;
    if (!cfg().token) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { sync(); }, 2500);
  }

  async function sync(silent) {
    const c = cfg();
    if (!c.token) { status('idle', 'Yerel'); return false; }
    if (syncing) return false;
    syncing = true;
    if (!silent) status('sync', 'Eşitleniyor…');
    try {
      if (!c.gist) await createGist();
      const id = cfg().gist;
      const g = await api('/gists/' + id);
      const f = g.files && g.files[GIST_FILE];
      let remote = null;
      if (f) {
        let content = f.content;
        if (f.truncated && f.raw_url) content = await (await fetch(f.raw_url)).text();
        try { remote = JSON.parse(content); } catch (e) { remote = null; }
      }
      const before = JSON.stringify(D);
      if (remote) { D = mergeData(D, remote); persist(); }
      const after = JSON.stringify(D);
      if (before !== after) emit('change');
      if (!remote || JSON.stringify(remote) !== after) {
        await api('/gists/' + id, { method: 'PATCH', body: JSON.stringify({ files: { [GIST_FILE]: { content: after } } }) });
      }
      dirty = false;
      setCfg({ last: now() });
      status('ok', 'Eşitlendi ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
      return true;
    } catch (e) {
      status('err', e.message || 'Eşitleme hatası');
      return false;
    } finally { syncing = false; }
  }

  function startAuto() {
    if (cfg().token) setTimeout(() => sync(true), 400);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && cfg().token) sync(true); });
    window.addEventListener('online', () => { if (cfg().token) sync(true); });
    setInterval(() => { if (!document.hidden && cfg().token) sync(true); }, 60000);
  }

  /* ---------- dışa açılan arayüz ---------- */
  return {
    PALETTE, MONTHS, MONTHS_SHORT, WD_FULL, WD_SHORT, WD_MINI, ICONS, DEFAULT_HABITS,
    get data() { return D; },
    on, emit, commit, persist,
    dkey, todayKey, shiftKey, parseKey, weekday, esc, escAttr, rgba, money, uid, pad,
    catMap, habitMap, cat, eventsByDate, eventsOn, byTime,
    addEvent, updateEvent, deleteEvent, updateCat, addCat, setCountdown,
    doneOn, toggleHabit, habitStreak, updateHabit, addHabit, deleteHabit,
    totals, exportJSON, importJSON,
    cfg, setCfg, sync, createGist, startAuto,
    get status() { return statusState; }
  };
})();
