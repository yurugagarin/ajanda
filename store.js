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
    { id: 'kirmizi', name: 'Kırmızı', color: '#B65449' },
    { id: 'turuncu', name: 'Turuncu', color: '#C97F4E' },
    { id: 'kehribar', name: 'Kehribar', color: '#C1913F' },
    { id: 'sari', name: 'Sarı', color: '#C2AE58' },
    { id: 'fistik', name: 'Fıstık', color: '#8C9B57' },
    { id: 'yesil', name: 'Yeşil', color: '#5F9269' },
    { id: 'zumrut', name: 'Zümrüt', color: '#4A8A75' },
    { id: 'turkuaz', name: 'Turkuaz', color: '#4A8E91' },
    { id: 'camgobegi', name: 'Camgöbeği', color: '#5590AE' },
    { id: 'mavi', name: 'Mavi', color: '#5F81AC' },
    { id: 'lacivert', name: 'Lacivert', color: '#5A6493' },
    { id: 'mor', name: 'Mor', color: '#8672A6' },
    { id: 'erguvan', name: 'Erguvan', color: '#9A6295' },
    { id: 'pembe', name: 'Pembe', color: '#C0768F' },
    { id: 'bordo', name: 'Bordo', color: '#8D5566' },
    { id: 'kahve', name: 'Kahve', color: '#8A6754' },
    { id: 'kum', name: 'Kum', color: '#AD9877' },
    { id: 'komur', name: 'Kömür', color: '#6F6B67' }
  ];
  const PALETTE_VERSION = 4;

  const DEFAULT_HABITS = [
    { id: 'h_spor', name: 'Spor', icon: '🏋️', color: '#E5813C', pinned: true, hidden: false },
    { id: 'h_yuruyus', name: 'Yürüyüş', icon: '🚶', color: '#8FA834', pinned: true, hidden: false },
    { id: 'h_yemek', name: 'Yemek yapmak', icon: '🍳', color: '#E0B22C', pinned: true, hidden: false },
    { id: 'h_yuzme', name: 'Yüzme', icon: '🏊', color: '#2E9BC4', pinned: true, hidden: false },
    { id: 'h_okuma', name: 'Okuma', icon: '📖', color: '#3B7DC7', pinned: true, hidden: false }
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
  function money(v) {
    const n = Number(v) || 0;
    const a = Math.round(Math.abs(n) * 100) / 100;
    const s = a.toLocaleString('tr-TR', { minimumFractionDigits: a % 1 ? 2 : 0, maximumFractionDigits: 2 });
    return (n < 0 ? '-' : '') + s + ' €';
  }

  /* ---------- boş veri ---------- */
  function blank() {
    return {
      v: 3, pv: PALETTE_VERSION,
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
    D.events = D.events.map(e => Object.assign({ time: '', note: '', amtType: 'none', amt: 0, mt: 1 }, e));
    // eksik palet renklerini tamamla
    const has = {}; D.cats.forEach(c => has[c.id] = 1);
    PALETTE.forEach((p, i) => { if (!has[p.id]) D.cats.push({ id: p.id, name: p.name, color: p.color, o: i, mt: 0 }); });
    // palet sürümü: renk tonları güncellendiyse adları koruyup renkleri yenile
    if (D.pv !== PALETTE_VERSION) {
      const pm = {}; PALETTE.forEach(p => pm[p.id] = p.color);
      D.cats = D.cats.map(c => pm[c.id] ? Object.assign({}, c, { color: pm[c.id] }) : c);
      D.pv = PALETTE_VERSION;
    }
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
    const e = Object.assign({ id: uid('e'), date: todayKey(), time: '', note: '', text: '', cat: 'mavi', amtType: 'none', amt: 0 }, ev);
    e.mt = now(); D.events.push(e); commit(); return e;
  }
  /* birden çok güne aynı kaydı ekler (seri = gid) */
  function addEvents(dates, base) {
    const gid = uid('g'), t = now();
    (dates || []).forEach(d => {
      D.events.push(Object.assign(
        { id: uid('e'), time: '', note: '', text: '', cat: 'mavi', amtType: 'none', amt: 0 },
        base || {}, { date: d, gid: gid, mt: t }));
    });
    commit();
    return gid;
  }
  function groupCount(gid) { return gid ? D.events.filter(e => e.gid === gid).length : 0; }
  function deleteGroup(gid) {
    if (!gid) return 0;
    const arr = D.events.filter(e => e.gid === gid);
    undoBin = { events: arr, at: now() };
    const ids = arr.map(e => e.id);
    D.events = D.events.filter(e => e.gid !== gid);
    const t = now(); ids.forEach(id => D.deleted[id] = t);
    commit();
    return ids.length;
  }

  function updateEvent(id, patch) {
    D.events = D.events.map(e => e.id === id ? Object.assign({}, e, patch, { mt: now() }) : e);
    commit();
  }
  let undoBin = null;
  function deleteEvent(id) {
    const ev = D.events.filter(e => e.id === id)[0];
    if (ev) undoBin = { events: [ev], at: now() };
    D.events = D.events.filter(e => e.id !== id);
    D.deleted[id] = now(); commit();
  }
  function canUndo() { return !!(undoBin && undoBin.events.length); }
  function undo() {
    if (!canUndo()) return 0;
    const t = now(), list = undoBin.events;
    list.forEach(e => { delete D.deleted[e.id]; D.events.push(Object.assign({}, e, { mt: t })); });
    undoBin = null; commit();
    return list.length;
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

  /* seri kayıtları tek satırda topla (listelerde 5 kez tekrar etmesin) */
  function collapse(list) {
    const out = [], seen = {};
    (list || []).forEach(e => {
      if (e.gid) {
        if (seen[e.gid]) return;
        seen[e.gid] = 1;
        const all = D.events.filter(x => x.gid === e.gid).map(x => x.date).sort();
        const first = all[0], last = all[all.length - 1];
        const a = parseKey(first), b = parseKey(last);
        const span = Math.round((new Date(b.y, b.m, b.d) - new Date(a.y, a.m, a.d)) / 86400000) + 1;
        out.push({ ev: e, first: first, last: last, count: all.length, contiguous: span === all.length });
      } else out.push({ ev: e, first: e.date, last: e.date, count: 1, contiguous: true });
    });
    return out;
  }
  function spanLabel(it) {
    const a = parseKey(it.first), b = parseKey(it.last);
    if (it.count === 1) return a.d + ' ' + MONTHS_SHORT[a.m];
    if (it.contiguous) {
      return a.m === b.m ? a.d + '–' + b.d + ' ' + MONTHS_SHORT[b.m]
        : a.d + ' ' + MONTHS_SHORT[a.m] + ' – ' + b.d + ' ' + MONTHS_SHORT[b.m];
    }
    return a.d + ' ' + MONTHS_SHORT[a.m] + ' · ' + it.count + ' gün';
  }

  /* ---------- renk kullanımı (sık kullanılan sırası) ---------- */
  function colorUsage() {
    const n = {};
    D.events.forEach(e => n[e.cat] = (n[e.cat] || 0) + 1);
    return D.cats.map(c => ({ id: c.id, name: c.name, color: c.color, n: n[c.id] || 0 }))
      .sort((a, b) => b.n - a.n);
  }
  /* seri (gid) günlerinin kümesi — bitişik gün şeridi çizmek için */
  function groupDays() {
    const m = {};
    D.events.forEach(e => { if (e.gid) (m[e.gid] = m[e.gid] || {})[e.date] = 1; });
    return m;
  }

  /* ---------- takvim dışa aktarma (.ics) ---------- */
  function icsEsc(v) { return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) {
    if (line.length <= 73) return line;
    let out = line.slice(0, 73), rest = line.slice(73);
    while (rest.length > 72) { out += '\r\n ' + rest.slice(0, 72); rest = rest.slice(72); }
    return out + '\r\n ' + rest;
  }
  function stamp() {
    const d = new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function toICS(events) {
    const list = events || D.events;
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ajanda//TR', 'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH', 'X-WR-CALNAME:Ajanda', 'X-WR-TIMEZONE:Europe/Berlin'];
    const ts = stamp();
    list.forEach(e => {
      const p = parseKey(e.date);
      const ymd = e.date.replace(/-/g, '');
      L.push('BEGIN:VEVENT');
      /* UID kayıt kimliğinden üretilir: aynı dosyayı tekrar aktarınca */
      /* takvim yeni kopya oluşturmaz, mevcut kaydı günceller.        */
      L.push('UID:' + e.id + '@ajanda.local');
      L.push('DTSTAMP:' + ts);
      L.push('SEQUENCE:' + Math.floor((e.mt || 1) / 1000 % 2000000000));
      if (e.time && /^\d{2}:\d{2}$/.test(e.time)) {
        const hh = Number(e.time.slice(0, 2)), mm = Number(e.time.slice(3, 5));
        const end = new Date(p.y, p.m, p.d, hh + 1, mm);
        L.push('DTSTART:' + ymd + 'T' + pad(hh) + pad(mm) + '00');
        L.push('DTEND:' + dkey(end.getFullYear(), end.getMonth(), end.getDate()).replace(/-/g, '') +
          'T' + pad(end.getHours()) + pad(end.getMinutes()) + '00');
      } else {
        const nx = new Date(p.y, p.m, p.d + 1);
        L.push('DTSTART;VALUE=DATE:' + ymd);
        L.push('DTEND;VALUE=DATE:' + dkey(nx.getFullYear(), nx.getMonth(), nx.getDate()).replace(/-/g, ''));
      }
      L.push(fold('SUMMARY:' + icsEsc(e.text)));
      if (e.note) L.push(fold('DESCRIPTION:' + icsEsc(e.note)));
      L.push(fold('CATEGORIES:' + icsEsc(cat(e.cat).name)));
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }
  function downloadICS(events, name) {
    const blob = new Blob([toICS(events)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (name || 'ajanda') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /* ---------- arama ---------- */
  function search(q, limit) {
    const s = (q || '').trim().toLocaleLowerCase('tr');
    if (s.length < 2) return [];
    return D.events
      .filter(e => (e.text || '').toLocaleLowerCase('tr').indexOf(s) >= 0 ||
        (e.note || '').toLocaleLowerCase('tr').indexOf(s) >= 0)
      .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
      .slice(0, limit || 40);
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
    addEvent, addEvents, groupCount, deleteGroup, updateEvent, deleteEvent, updateCat, addCat, setCountdown,
    doneOn, toggleHabit, habitStreak, updateHabit, addHabit, deleteHabit,
    totals, exportJSON, importJSON, collapse, spanLabel, colorUsage, groupDays, toICS, downloadICS, search, canUndo, undo,
    cfg, setCfg, sync, createGist, startAuto,
    get status() { return statusState; }
  };
})();
