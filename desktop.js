"use strict";
/* ===========================================================
   desktop.js — bilgisayar (web) görünümü
   =========================================================== */
var DesktopView = (function () {
  const S = Store;
  const TILE_ALPHA = 0.58;   /* gün kutucuğu renk yoğunluğu: canlı .70 · soluk .45 */

  const CSS = `
body[data-ui="desktop"]{
  --paper:#ece4d6; --card:#fbf8f2; --ink:#3a342c; --mut:#a8987c;
  --line:#e4dac8; --acc:#b5552e; --gold:#e3a23f;
  font-family:'Karla',system-ui,sans-serif;color:var(--ink)}
.d-app *{box-sizing:border-box}
.d-app{min-height:100vh;background:radial-gradient(140% 100% at 50% 0%,#f1eadd 0%,#ece4d6 55%,#e4dac8 100%);padding:26px 32px 44px}
.fr{font-family:'Fraunces',Georgia,serif}
.d-wrap{max-width:1340px;margin:0 auto}
@keyframes drawerIn{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes toastIn{from{transform:translate(-50%,14px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
body[data-ui="desktop"] button:focus-visible,body[data-ui="desktop"] input:focus-visible,body[data-ui="desktop"] textarea:focus-visible,body[data-ui="desktop"] select:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.yc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media (max-width:1180px){.yc-grid{grid-template-columns:repeat(2,1fr)}}
.d-scrim{position:fixed;inset:0;background:rgba(38,33,26,.5);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.d-drawer{position:fixed;top:0;right:0;height:100vh;width:420px;max-width:94vw;
  background:#fbf8f2;box-shadow:-18px 0 50px rgba(40,35,28,.28);display:flex;flex-direction:column;animation:drawerIn .22s ease}
.d-modal{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);max-height:84vh;overflow-y:auto;
  background:#fbf8f2;border-radius:18px;box-shadow:0 24px 60px rgba(40,35,28,.34);padding:24px}
.d-yr{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.d-yr button{padding:14px 4px;border:1px solid #e2d7c1;border-radius:12px;background:#fff;font-size:16px;font-weight:700;color:#5a5142;cursor:pointer;font-family:inherit}
.d-yr button.on{background:var(--acc);border-color:var(--acc);color:#fff}
.d-yr button.now{box-shadow:inset 0 0 0 1.5px var(--gold)}
.d-in{border:1px solid #d9ccb5;border-radius:10px;padding:9px 12px;font-size:14px;font-family:inherit;background:var(--card);color:var(--ink);outline:none}
.d-in::placeholder{color:#bdae93}
.d-btn{background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:8px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer;font-family:inherit}
.d-btn:hover{background:#fff}
.d-cell{transition:opacity .14s ease}
.d-leg{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;background:rgba(251,248,242,.75);border-radius:20px;padding:5px 12px 5px 9px;font-size:12.5px;font-weight:600;color:#5a5142;cursor:pointer;font-family:inherit}
.d-leg:hover{background:#fff}
.d-leg.on{background:#3a342c;color:#f3ecdf;border-color:#3a342c}
.d-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #ddd0b8;background:#fff;border-radius:18px;padding:6px 12px 6px 9px;font-size:13px;font-weight:600;color:#5a5142;cursor:pointer;font-family:inherit}
.d-chip.on{background:#3a342c;color:#f3ecdf;border-color:#3a342c}
.d-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,0);z-index:80;background:#3a342c;color:#f3ecdf;
  border-radius:12px;padding:11px 14px;display:flex;align-items:center;gap:14px;font-size:13.5px;font-weight:600;
  box-shadow:0 12px 30px rgba(40,35,28,.3);animation:toastIn .18s ease}
.d-toast button{background:rgba(243,236,223,.14);border:1px solid rgba(243,236,223,.28);color:#f3ecdf;border-radius:8px;padding:5px 11px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.d-res{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;background:var(--card);border:1px solid #e2d7c1;
  border-radius:12px;box-shadow:0 14px 34px rgba(40,35,28,.2);max-height:340px;overflow-y:auto;padding:6px}
.d-res button{display:flex;width:100%;align-items:center;gap:10px;background:none;border:none;border-radius:9px;padding:8px 10px;cursor:pointer;text-align:left;font-family:inherit}
.d-res button:hover{background:#f3ecdd}

/* aralık çubuğu */
.d-range{background:var(--card);border:1px solid #e2d7c1;border-radius:16px;padding:16px 18px;margin-bottom:16px;box-shadow:0 4px 16px rgba(60,52,44,.09)}
.d-range .rt{font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#b3a488;font-weight:700;margin-bottom:11px}
.d-range .r1{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.d-range .r2{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:11px;padding-top:12px;border-top:1px dashed #e4dac8}
.d-range .r3{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:12px;padding-top:12px;border-top:1px dashed #e4dac8}
.d-range .lbl{font-size:12.5px;font-weight:700;color:#9a8d76}
.d-wd{display:flex;gap:3px}
.d-wd button{width:32px;height:30px;border-radius:8px;border:1px solid #ddd0b8;background:#fff;color:#a8987c;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}
.d-wd button.on{background:#6b5f4d;border-color:#6b5f4d;color:#fbf8f2}
.d-sum{flex:1;min-width:180px;font-size:13.5px;font-weight:600;color:#5a5142}
.d-sum span{color:#a8987c;font-weight:600}
@media (prefers-reduced-motion:reduce){.d-app *{animation:none!important;transition:none!important}}
`;

  const MONTH_WORDS = {
    oca: 0, ocak: 0, şub: 1, sub: 1, şubat: 1, subat: 1, mar: 2, mart: 2, nis: 3, nisan: 3,
    may: 4, mayıs: 4, mayis: 4, haz: 5, haziran: 5, tem: 6, temmuz: 6, ağu: 7, agu: 7,
    ağustos: 7, agustos: 7, eyl: 8, eylül: 8, eylul: 8, eki: 9, ekim: 9, kas: 10, kasım: 10,
    kasim: 10, ara: 11, aralık: 11, aralik: 11
  };

  let V = null;
  function init() {
    V = {
      year: new Date().getFullYear(), selected: null,
      draft: { text: '', cat: 'genel', time: '', note: '' },
      yearPick: false, setOpen: false, tools: false, catEdit: false,
      multi: null, filter: null, q: '', qFocus: false, toast: null
    };
  }

  /* ---------- hızlı ekleme ---------- */
  function parseQuick(raw) {
    let s = ' ' + (raw || '').trim() + ' ';
    if (!s.trim()) return null;
    const today = new Date();
    let y = null, m = null, d = null, time = '';

    const t = s.match(/\s(\d{1,2})[:.](\d{2})\s/);
    if (t) { time = S.pad(Math.min(23, +t[1])) + ':' + t[2]; s = s.replace(t[0], ' '); }

    let mm = s.match(/\s(bugün|bugun)\s/i);
    if (mm) { d = today.getDate(); m = today.getMonth(); y = today.getFullYear(); s = s.replace(mm[0], ' '); }
    if (d === null && (mm = s.match(/\s(yarın|yarin)\s/i))) {
      const n = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      d = n.getDate(); m = n.getMonth(); y = n.getFullYear(); s = s.replace(mm[0], ' ');
    }
    if (d === null && (mm = s.match(/\s(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\s/))) {
      d = +mm[1]; m = +mm[2] - 1;
      if (mm[3]) y = mm[3].length === 2 ? 2000 + +mm[3] : +mm[3];
      s = s.replace(mm[0], ' ');
    }
    if (d === null && (mm = s.match(/\s(\d{1,2})\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]{3,9})(?:\s+(\d{4}))?\s/))) {
      const key = mm[2].toLocaleLowerCase('tr');
      if (key in MONTH_WORDS) {
        d = +mm[1]; m = MONTH_WORDS[key];
        if (mm[3]) y = +mm[3];
        s = s.replace(mm[0], ' ');
      }
    }
    if (d === null) { d = today.getDate(); m = today.getMonth(); y = today.getFullYear(); }
    if (y === null) {
      y = today.getFullYear();
      if (S.dkey(y, m, d) < S.todayKey()) y++;
    }
    if (m < 0 || m > 11 || d < 1 || d > 31) return null;
    const text = s.replace(/\s+/g, ' ').trim();
    return { date: S.dkey(y, m, d), time: time, text: text || 'Yeni kayıt' };
  }

  /* ---------- bildirim ---------- */
  let toastT = null;
  function toast(msg, undo) {
    V.toast = { msg: msg, undo: !!undo };
    clearTimeout(toastT);
    toastT = setTimeout(() => { V.toast = null; render(); }, undo ? 7000 : 2600);
    render();
  }

  /* ---------- çoklu gün seçimi ---------- */
  function finalDates() {
    const M = V.multi; if (!M) return [];
    const set = {};
    if (M.from && M.to && M.to >= M.from) {
      let k = M.from, guard = 0;
      while (k <= M.to && guard++ < 1500) {
        if (M.wd[S.weekday(k)]) set[k] = 1;
        k = S.shiftKey(k, 1);
      }
    }
    M.extra.forEach(d => set[d] = 1);
    M.removed.forEach(d => delete set[d]);
    return Object.keys(set).sort();
  }

  /* ---------- render ---------- */
  let skipGrab = false;
  function render() {
    if (V.multi && !skipGrab) grabRange();   /* dış kaynaklı çizimlerde alanları koru */
    skipGrab = false;
    const cm = S.catMap(), byDate = S.eventsByDate(), gdays = S.groupDays();
    const tKey = S.todayKey(), tp = S.parseKey(tKey);
    const cd = S.data.countdown.v;
    const picked = V.multi ? finalDates() : [];
    const pickedSet = {}; picked.forEach(d => pickedSet[d] = 1);

    let cdDays = '—', cdUnit = 'gün', cdLabel = 'seçilmedi';
    if (cd) {
      const p = S.parseKey(cd), target = new Date(p.y, p.m, p.d), n = new Date(); n.setHours(0, 0, 0, 0);
      const diff = Math.round((target - n) / 86400000);
      cdLabel = p.d + ' ' + S.MONTHS[p.m] + ' ' + p.y;
      if (diff > 0) { cdDays = diff; cdUnit = 'gün kaldı'; }
      else if (diff === 0) { cdDays = '🎉'; cdUnit = 'BUGÜN'; }
      else { cdDays = Math.abs(diff); cdUnit = 'gün geçti'; }
    }

    /* ---- üst kart ---- */
    const todayEvents = byDate[tKey] || [];
    const todayEvHtml = todayEvents.length ? todayEvents.map(ev => {
      const c = cm[ev.cat] || { color: '#8a7f6f', name: '' };
      return `<div style="display:flex;align-items:center;gap:9px;background:rgba(243,236,223,.08);border-radius:9px;padding:7px 10px">
        <span style="width:3px;height:20px;border-radius:3px;background:${c.color};flex:none"></span>
        <div style="flex:1;min-width:0;font-size:13px;color:#f3ecdf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.esc(ev.text)}
          <span style="color:#8f836f;font-weight:600">· ${S.esc(c.name)}</span></div>
        ${ev.time ? `<span style="font-size:11.5px;color:#bcae97;font-weight:600">${ev.time}</span>` : ''}</div>`;
    }).join('') : '<div style="border:1px dashed rgba(243,236,223,.26);border-radius:9px;padding:10px;text-align:center;color:#bcae97;font-size:12.5px">Bugüne ait kayıt yok.</div>';

    const upcoming = S.collapse(S.data.events.filter(e => e.date > tKey)
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : S.byTime(a, b))).slice(0, 4);
    const upHtml = upcoming.length ? upcoming.map(it => {
      const ev = it.ev, c = cm[ev.cat] || { color: '#8a7f6f', name: '' };
      const when = S.spanLabel(it) + (ev.time ? ' · ' + ev.time : '');
      return `<button onclick="DV.open('${ev.date}')" style="display:flex;align-items:center;gap:9px;background:rgba(243,236,223,.08);border:none;border-radius:9px;padding:7px 10px;cursor:pointer;text-align:left;width:100%;font-family:inherit">
        <span style="width:3px;height:20px;border-radius:3px;background:${c.color};flex:none"></span>
        <span style="flex:1;min-width:0;font-size:13px;color:#f3ecdf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.esc(ev.text)}
          <span style="color:#8f836f;font-weight:600">· ${S.esc(c.name)}</span></span>
        <span style="font-size:11.5px;color:#bcae97;font-weight:600;white-space:nowrap">${when}</span></button>`;
    }).join('') : '<div style="border:1px dashed rgba(243,236,223,.26);border-radius:9px;padding:10px;text-align:center;color:#bcae97;font-size:12.5px">Yaklaşan kayıt yok.</div>';

    const todayCard = `
    <div style="background:#3a342c;border-radius:16px;padding:14px 18px;box-shadow:0 6px 18px rgba(58,52,44,.16);margin-bottom:16px;display:grid;grid-template-columns:minmax(190px,220px) 1fr 1fr;gap:20px;align-items:start">
      <div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:700">Bugün</div>
        <div class="fr" style="font-size:26px;line-height:1.1;font-weight:600;color:#f3ecdf;margin-top:3px">${tp.d} ${S.MONTHS[tp.m]}</div>
        <div style="font-size:12.5px;font-weight:600;color:#bcae97">${S.WD_FULL[S.weekday(tKey)]}</div>
        <button onclick="DV.open('${tKey}')" style="margin-top:10px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:9px;padding:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Bugüne kayıt ekle</button>
      </div>
      <div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#bcae97;font-weight:700;margin-bottom:8px">Bugünün kayıtları</div>
        <div style="display:flex;flex-direction:column;gap:6px">${todayEvHtml}</div>
      </div>
      <div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#bcae97;font-weight:700;margin-bottom:8px">Yaklaşan</div>
        <div style="display:flex;flex-direction:column;gap:6px">${upHtml}</div>
      </div>
    </div>`;

    /* ---- aylar ---- */
    const Y = V.year;
    const monthsHtml = S.MONTHS.map((name, m) => {
      const lead = (new Date(Y, m, 1).getDay() + 6) % 7;
      const dim = new Date(Y, m + 1, 0).getDate();
      const total = Math.ceil((lead + dim) / 7) * 7;
      const isCur = (Y === tp.y && m === tp.m);
      let monthCount = 0, cells = '';
      for (let i = 0; i < total; i++) {
        const n = i - lead + 1;
        if (n < 1 || n > dim) { cells += '<div style="height:38px"></div>'; continue; }
        const k = S.dkey(Y, m, n);
        const evs = byDate[k] || [];
        const wd = (lead + n - 1) % 7, weekend = wd >= 5;
        const isToday = k === tKey, isTarget = k === cd, isPast = k < tKey;
        if (evs.length) monthCount++;
        const seen = {}, colors = [];
        evs.forEach(e => { const col = (cm[e.cat] || {}).color || '#8a7f6f'; if (!seen[col]) { seen[col] = 1; colors.push(col); } });

        let bandL = false, bandR = false;
        for (let j = 0; j < evs.length; j++) {
          const g = evs[j].gid && gdays[evs[j].gid];
          if (!g) continue;
          if (wd > 0 && g[S.shiftKey(k, -1)]) bandL = true;
          if (wd < 6 && g[S.shiftKey(k, 1)]) bandR = true;
        }

        let bg = weekend ? '#f1e8d7' : 'transparent', bc = 'transparent',
          numColor = weekend ? '#b09a78' : '#5a5142', dots = [], dotShadow = '';
        const isPicked = pickedSet[k];

        if (isPast) {
          bg = '#4a4136'; bc = '#423a30'; numColor = '#b7a98f';
          dots = colors.slice(0, 4); dotShadow = 'box-shadow:0 0 0 1px rgba(74,65,54,.9);';
        } else if (evs.length) {
          bg = S.rgba(colors[0], TILE_ALPHA);
          bc = S.rgba(colors[0], .88);
          numColor = '#3a342c';
          dots = colors.slice(1, 4);
        }

        let radius = '8px', extra = '';
        if (bandL || bandR) {
          radius = bandL && bandR ? '0' : (bandL ? '0 8px 8px 0' : '8px 0 0 8px');
          extra += (bandL ? 'margin-left:-4px;border-left:none;' : '') + (bandR ? 'margin-right:-4px;border-right:none;' : '');
        }
        let bw = '1px';
        if (isToday) { bc = '#b5552e'; bw = '1.5px'; if (!evs.length && !isPast) { bg = '#fbeede'; numColor = '#b5552e'; } }
        if (isTarget) { bc = '#e3a23f'; bw = '1.5px'; }
        if (isPicked) { bc = '#3a342c'; bw = '2px'; if (!evs.length && !isPast) bg = '#efe4cd'; }

        const dotsHtml = dots.map(c => '<span style="width:5px;height:5px;border-radius:50%;background:' + c + ';display:inline-block;' + dotShadow + '"></span>').join('');
        const title = evs.map(e => (e.time ? e.time + ' ' : '') + e.text + ' (' + (cm[e.cat] || {}).name + ')').join(' · ');
        const fw = (isToday || (evs.length && !isPast)) ? 700 : 500;
        const ff = (evs.length && !isPast) ? "'Fraunces',Georgia,serif" : "'Karla',sans-serif";
        const dc = evs.length ? ` data-c="${evs[0].cat}"` : '';
        cells += `<div class="d-cell"${dc} onclick="DV.cell('${k}')" title="${S.esc(title)}" style="height:38px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:${radius};cursor:pointer;background:${bg};border:${bw} solid ${bc};${extra}">
          <span style="font-size:12.5px;line-height:1;font-weight:${fw};color:${numColor};font-family:${ff}">${n}</span>
          <div style="display:flex;gap:2px;justify-content:center;height:5px;margin-top:1px">${dotsHtml}</div></div>`;
      }
      const wdHead = S.WD_MINI.map(w => '<div style="text-align:center;font-size:10px;font-weight:700;color:#bdae93">' + w + '</div>').join('');
      return `<div style="background:var(--card);border-radius:16px;padding:14px 14px 16px;box-shadow:${isCur ? '0 0 0 1.5px #b5552e,0 4px 14px rgba(181,85,46,.12)' : '0 1px 3px rgba(60,52,44,.08)'}">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
          <span class="fr" style="font-size:20px;font-weight:600">${name}</span>
          <span style="font-size:11px;color:#b3a488;font-weight:600">${monthCount ? monthCount + ' kayıt' : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">${wdHead}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div></div>`;
    }).join('');

    /* ---- kategori şeridi ---- */
    const usage = S.catUsage();
    const shown = usage.filter(c => c.n || V.filter === c.id);
    const legend = `<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:14px">
      ${shown.map(c => `<button class="d-leg ${V.filter === c.id ? 'on' : ''}" onclick="DV.filter('${c.id}')">
        <span style="width:10px;height:10px;border-radius:50%;background:${c.color};display:inline-block"></span>${S.esc(c.name)}
        <span style="opacity:.55;font-weight:600">${c.n}</span></button>`).join('')}
      <button class="d-leg" onclick="DV.catEditToggle()" style="color:#a8987c">+ kategoriler</button>
    </div>`;

    /* ---- arama ---- */
    const results = V.q.trim().length >= 2 ? S.search(V.q, 30) : [];
    const resHtml = V.q.trim().length >= 2 ? `<div class="d-res">
      ${results.length ? results.map(ev => {
      const p = S.parseKey(ev.date), c = cm[ev.cat] || { color: '#8a7f6f', name: '' };
      return `<button onclick="DV.goto('${ev.date}')">
          <span style="width:8px;height:8px;border-radius:50%;background:${c.color};flex:none"></span>
          <span style="flex:1;min-width:0;font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.esc(ev.text)}
            <span style="color:#a8987c;font-weight:600">· ${S.esc(c.name)}</span></span>
          <span style="font-size:12px;color:#a8987c;font-weight:600;white-space:nowrap">${p.d} ${S.MONTHS_SHORT[p.m]} ${p.y}${ev.time ? ' · ' + ev.time : ''}</span></button>`;
    }).join('') : '<div style="padding:12px;text-align:center;color:#bdae93;font-size:13px">Eşleşen kayıt yok.</div>'}
    </div>` : '';

    /* ---- aralık / çoklu gün çubuğu ---- */
    let rangeBar = '';
    if (V.multi) {
      const M = V.multi;
      const first = picked[0], last = picked[picked.length - 1];
      let sum;
      if (!picked.length) sum = '<span>Başlangıç ve bitiş tarihi seçin — günler kendiliğinden işaretlenir.</span>';
      else {
        const a = S.parseKey(first), b2 = S.parseKey(last);
        const range = picked.length === 1 ? `${a.d} ${S.MONTHS_SHORT[a.m]}`
          : (a.m === b2.m ? `${a.d}–${b2.d} ${S.MONTHS_SHORT[b2.m]}` : `${a.d} ${S.MONTHS_SHORT[a.m]} – ${b2.d} ${S.MONTHS_SHORT[b2.m]}`);
        sum = `<b class="fr" style="font-size:19px">${picked.length} gün</b> <span>· ${range}</span>`;
      }
      rangeBar = `<div class="d-range">
        <div class="rt">Aralık / çoklu gün ekle</div>
        <div class="r1">
          <input id="mText" class="d-in" style="flex:1;min-width:220px;background:#fff" value="${S.escAttr(M.text)}" placeholder="Açıklama — örn. Almanca kursu">
          <select id="mCat" class="d-in" style="background:#fff" onchange="DV.mset('cat',this.value)">
            ${S.data.cats.map(c => `<option value="${c.id}"${c.id === M.cat ? ' selected' : ''}>${S.esc(c.name)}</option>`).join('')}
          </select>
          <input id="mTime" class="d-in" type="time" style="background:#fff" value="${M.time}" title="saat (isteğe bağlı)">
        </div>
        <div class="r2">
          <span class="lbl">Başlangıç</span>
          <input id="mFrom" class="d-in" type="date" style="background:#fff" value="${M.from || ''}" onchange="DV.mset('from',this.value)">
          <span class="lbl">Bitiş</span>
          <input id="mTo" class="d-in" type="date" style="background:#fff" value="${M.to || ''}" onchange="DV.mset('to',this.value)">
          <span class="lbl" style="margin-left:6px">Günler</span>
          <div class="d-wd">${S.WD_MINI.map((w, i) => `<button class="${M.wd[i] ? 'on' : ''}" onclick="DV.mwd(${i})" title="${S.WD_FULL[i]}">${w}</button>`).join('')}</div>
        </div>
        <div class="r3">
          <div class="d-sum">${sum}</div>
          <span style="font-size:12px;color:#b3a488">takvimden tıklayarak tek tek ekleyip çıkarabilirsin</span>
          <button class="d-btn" onclick="DV.mclear()">Temizle</button>
          <button class="d-btn" onclick="DV.multi()">Vazgeç</button>
          <button onclick="DV.msave()" style="background:${picked.length ? 'var(--acc)' : '#d9ccb5'};color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Kaydet</button>
        </div></div>`;
    }

    /* ---- gün paneli ---- */
    let drawer = '';
    if (V.selected) {
      const k = V.selected, p = S.parseKey(k);
      const list = S.eventsOn(k);
      const evHtml = list.length ? list.map(ev => {
        const c = cm[ev.cat] || { color: '#8a7f6f', name: '' };
        const gn = ev.gid ? S.groupCount(ev.gid) : 0;
        return `<div style="display:flex;gap:11px;background:#f3ecdd;border-radius:12px;padding:12px 13px">
          <span style="width:4px;border-radius:4px;background:${c.color};flex:none"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:${c.color}">${S.esc(c.name)}${ev.time ? ' · ' + ev.time : ''}</div>
            <div style="font-size:14.5px;font-weight:600;white-space:pre-line;line-height:1.4;margin-top:2px">${S.esc(ev.text)}</div>
            ${ev.note ? `<div style="font-size:13px;color:#6b5f4d;margin-top:5px;white-space:pre-line;line-height:1.45">${S.esc(ev.note)}</div>` : ''}</div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <button onclick="DV.del('${ev.id}')" title="Bu günü sil" style="background:none;border:none;color:#bba88a;font-size:17px;cursor:pointer;line-height:1">×</button>
            ${gn > 1 ? `<button onclick="DV.delGroup('${ev.gid}')" title="Tüm günlerini sil" style="background:none;border:none;color:#c08a6f;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit">seri (${gn})</button>` : ''}
          </div></div>`;
      }).join('') : '<div style="text-align:center;color:#bdae93;font-size:14px;padding:18px 0 26px">Bu gün için kayıt yok.</div>';

      const catChips = S.catUsage().map(c => `<button class="d-chip ${V.draft.cat === c.id ? 'on' : ''}" onclick="DV.draft('cat','${c.id}')">
        <span style="width:9px;height:9px;border-radius:50%;background:${c.color};display:inline-block"></span>${S.esc(c.name)}</button>`).join('');

      drawer = `<div class="d-scrim" onclick="DV.close()" style="z-index:40"></div>
      <div class="d-drawer" style="z-index:41">
        <div style="padding:22px 24px 18px;border-bottom:1px solid #ece1cd">
          <div style="display:flex;align-items:flex-start;justify-content:space-between">
            <div><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b3a488;font-weight:700">${S.WD_FULL[S.weekday(k)]}${k === tKey ? ' · bugün' : ''}</div>
              <div class="fr" style="font-size:30px;font-weight:600;line-height:1.05;margin-top:2px">${p.d} ${S.MONTHS[p.m]} ${p.y}</div></div>
            <button onclick="DV.close()" style="background:#efe7d6;border:none;width:34px;height:34px;border-radius:50%;font-size:18px;color:#6b5f4d;cursor:pointer">×</button></div>
          <button onclick="DV.target()" style="margin-top:12px;background:none;border:1px dashed #cdbb9c;border-radius:9px;padding:6px 11px;font-size:12.5px;font-weight:600;color:#9a7d4f;cursor:pointer;font-family:inherit">★ Bu günü geri sayım hedefi yap</button></div>
        <div style="flex:1;overflow-y:auto;padding:18px 24px">
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">${evHtml}</div>
          <div style="border-top:1px solid #ece1cd;padding-top:18px">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#b3a488;font-weight:700;margin-bottom:11px">Yeni kayıt</div>
            <textarea id="dText" oninput="DV.draftText(this.value)" placeholder="Ne yapacaksın?" rows="2"
              style="width:100%;border:1px solid #ddd0b8;border-radius:11px;padding:11px 12px;font-size:14.5px;font-family:inherit;background:#fff;resize:vertical;outline:none">${S.esc(V.draft.text)}</textarea>
            <textarea id="dNote" oninput="DV.draftNote(this.value)" placeholder="Not (isteğe bağlı) — uçuş no, adres, kişi..." rows="2"
              style="width:100%;margin-top:8px;border:1px solid #ddd0b8;border-radius:11px;padding:10px 12px;font-size:13.5px;font-family:inherit;background:#fff;resize:vertical;outline:none;color:#5a5142">${S.esc(V.draft.note)}</textarea>
            <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
              <input id="dTime" type="time" value="${V.draft.time}" onchange="DV.draft('time',this.value)"
                style="border:1px solid #ddd0b8;border-radius:10px;padding:8px 10px;font-size:14px;font-family:inherit;background:#fff">
              <span style="font-size:12.5px;color:#b3a488">saat (isteğe bağlı)</span>
            </div>
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#b3a488;font-weight:700;margin:16px 0 9px">Kategori</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px">${catChips}</div>
            <button onclick="DV.add()" style="margin-top:16px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">Ekle</button></div></div></div>`;
    }

    /* ---- kategori filtre paneli ---- */
    let filterPanel = '';
    if (V.filter && !V.selected) {
      const fc = cm[V.filter] || { name: '', color: '#8a7f6f' };
      const list = S.eventsInCat(V.filter);
      const grouped = S.collapse(list);
      const rows = grouped.length ? grouped.map((it, i) => {
        const ev = it.ev, p = S.parseKey(it.first);
        return `<div onclick="DV.goto('${ev.date}')" style="display:flex;align-items:flex-start;gap:11px;padding:12px 13px;background:#f3ecdd;border-radius:12px;cursor:pointer;border-left:4px solid ${fc.color};opacity:${it.last < tKey ? .55 : 1}">
          <span class="fr" style="font-size:16px;font-weight:600;color:${fc.color};min-width:24px">${i + 1}.</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:14.5px;font-weight:600;white-space:pre-line;line-height:1.35">${S.esc(ev.text)}</div>
            <div style="font-size:12.5px;color:#a8987c;font-weight:600;margin-top:2px">${S.spanLabel(it)}${it.contiguous && it.count > 1 ? ' · ' + it.count + ' gün' : ''} · ${p.y}${ev.time ? ' · ' + ev.time : ''}</div>
            ${ev.note ? `<div style="font-size:12.5px;color:#8a7f6f;margin-top:3px">${S.esc(ev.note)}</div>` : ''}</div></div>`;
      }).join('') : '<div style="text-align:center;color:#bdae93;padding:24px 0">Bu kategoride kayıt yok.</div>';
      filterPanel = `<div class="d-scrim" onclick="DV.filter(null)" style="z-index:38"></div>
      <div class="d-drawer" style="z-index:39">
        <div style="padding:22px 24px 18px;border-bottom:1px solid #ece1cd;display:flex;align-items:flex-start;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px"><span style="width:16px;height:16px;border-radius:50%;background:${fc.color};flex:none"></span>
            <div><div class="fr" style="font-size:26px;font-weight:600;line-height:1.05">${S.esc(fc.name)}</div>
              <div style="font-size:12.5px;color:#a8987c;font-weight:600;margin-top:2px">${list.length} kayıt · tüm yıllar</div></div></div>
          <button onclick="DV.filter(null)" style="background:#efe7d6;border:none;width:34px;height:34px;border-radius:50%;font-size:18px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="flex:1;overflow-y:auto;padding:18px 24px"><div style="display:flex;flex-direction:column;gap:9px">${rows}</div></div></div>`;
    }

    /* ---- kategori yöneticisi ---- */
    let catModal = '';
    if (V.catEdit) {
      const rows = S.data.cats.map(c => {
        const sw = S.PALETTE.map(p => `<button onclick="DV.catColor('${c.id}','${p.color}')" title="${p.name}"
          style="width:18px;height:18px;border-radius:50%;background:${p.color};border:${c.color.toLowerCase() === p.color.toLowerCase() ? '2.5px solid #3a342c' : '2.5px solid transparent'};cursor:pointer;padding:0"></button>`).join('');
        const n = S.data.events.filter(e => e.cat === c.id).length;
        return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px;border:1px solid #ece1cd;border-radius:12px">
          <input value="${S.escAttr(c.name)}" onchange="DV.catName('${c.id}',this.value)" class="d-in" style="flex:1;min-width:150px;background:#fff;padding:7px 10px">
          <div style="display:flex;gap:5px;flex-wrap:wrap">${sw}</div>
          <span style="font-size:11.5px;color:#b3a488;min-width:52px;text-align:right">${n} kayıt</span>
          <button onclick="DV.catDel('${c.id}')" style="background:none;border:none;color:#c08a6f;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit">Sil</button></div>`;
      }).join('');
      catModal = `<div class="d-scrim" onclick="DV.catEditToggle()" style="z-index:50"></div>
      <div class="d-modal" style="z-index:51;width:620px;max-width:94vw">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span class="fr" style="font-size:24px;font-weight:600">Kategoriler</span>
          <button onclick="DV.catEditToggle()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="font-size:13px;color:#a8987c;margin-bottom:16px;line-height:1.5">Kategori adı ve rengi burada değişir; telefonda da aynısı görünür. Sildiğin kategorinin kayıtları Genel'e taşınır.</div>
        <div style="display:flex;flex-direction:column;gap:9px">${rows}</div>
        <button onclick="DV.catAdd()" class="d-btn" style="margin-top:14px;width:100%;padding:12px">+ Yeni kategori</button>
      </div>`;
    }

    /* ---- yıl seçici ---- */
    let yearModal = '';
    if (V.yearPick) {
      const cur = new Date().getFullYear();
      const list = []; for (let i = -2; i <= 3; i++) list.push(cur + i);
      yearModal = `<div class="d-scrim" onclick="DV.yearPick()" style="z-index:50"></div>
      <div class="d-modal" style="z-index:51;width:380px;max-width:92vw">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span class="fr" style="font-size:24px;font-weight:600">Yıl seç</span>
          <button onclick="DV.yearPick()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div class="d-yr">${list.map(y => `<button onclick="DV.year(${y})" class="${y === Y ? 'on' : ''} ${y === cur ? 'now' : ''}">${y}</button>`).join('')}</div>
        <div style="margin-top:12px;font-size:12px;color:#b3a488;text-align:center">Altın çerçeveli olan içinde bulunduğun yıl.</div></div>`;
    }

    /* ---- araçlar ---- */
    let toolsModal = '';
    if (V.tools) {
      const st0 = S.status;
      toolsModal = `<div class="d-scrim" onclick="DV.toolsToggle()" style="z-index:50"></div>
      <div class="d-modal" style="z-index:51;width:420px;max-width:92vw">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <span class="fr" style="font-size:24px;font-weight:600">Araçlar</span>
          <button onclick="DV.toolsToggle()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="display:flex;flex-direction:column;gap:9px">
          <button class="d-btn" style="padding:12px;text-align:left" onclick="Store.sync()">Şimdi eşitle <span style="color:#a8987c;font-weight:600">· ${S.esc(st0.text)}</span></button>
          <button class="d-btn" style="padding:12px;text-align:left" onclick="DV.catEditToggle()">Kategorileri düzenle</button>
          <button class="d-btn" style="padding:12px;text-align:left" onclick="DV.settings()">Senkron ayarları (token / Gist)</button>
          <button class="d-btn" style="padding:12px;text-align:left" onclick="DV.ics()">Takvime aktar — ${Y} (.ics)</button>
          <button class="d-btn" style="padding:12px;text-align:left" onclick="DV.icsAll()">Takvime aktar — tüm kayıtlar (.ics)</button>
          <button class="d-btn" style="padding:12px;text-align:left" onclick="Store.exportJSON()">Yedek indir (.json)</button>
          <label class="d-btn" style="padding:12px;text-align:left;display:block">Yedek yükle (.json)<input type="file" accept="application/json" onchange="DV.import(this)" style="display:none"></label>
        </div>
        <div style="margin-top:14px;font-size:12px;color:#b3a488;line-height:1.5">.ics dosyasını iPhone'da açıp Takvim'e ekleyebilirsin. Sonradan değişiklik yaparsan dosyayı tekrar aktar — kayıtlar kopyalanmaz, üzerine yazılır.</div>
      </div>`;
    }

    /* ---- senkron ---- */
    let setPanel = '';
    if (V.setOpen) {
      const c = S.cfg(), st1 = S.status;
      setPanel = `<div class="d-scrim" onclick="DV.settings()" style="z-index:52"></div>
      <div class="d-modal" style="z-index:53;width:480px;max-width:92vw">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span class="fr" style="font-size:24px;font-weight:600">Senkronizasyon</span>
          <button onclick="DV.settings()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="font-size:13px;color:#a8987c;margin-bottom:16px;line-height:1.55">Veriler gizli bir GitHub Gist'inde tutulur. Aynı token ve Gist ID'yi telefonda da girin.</div>
        <label style="display:block;font-size:12.5px;font-weight:700;color:#8a7355;margin-bottom:6px">GitHub token (yalnızca <b>gist</b> yetkisi)</label>
        <input id="cfgTok" type="password" value="${S.escAttr(c.token)}" placeholder="ghp_..." class="d-in" style="width:100%;background:#fff">
        <label style="display:block;font-size:12.5px;font-weight:700;color:#8a7355;margin:14px 0 6px">Gist ID</label>
        <input id="cfgGist" value="${S.escAttr(c.gist)}" placeholder="boş bırakırsanız ilk eşitlemede oluşturulur" class="d-in" style="width:100%;background:#fff">
        <button onclick="DV.saveCfg()" style="margin-top:14px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">Kaydet ve eşitle</button>
        <div style="margin-top:10px;font-size:13px;color:#8a7355;text-align:center">${S.esc(st1.text)}${c.last ? ' · son: ' + new Date(c.last).toLocaleString('tr-TR') : ''}</div>
        ${c.gist ? `<div style="margin-top:14px;background:#f3ecdd;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#6b5f4d;word-break:break-all">Telefona girilecek Gist ID:<br><b>${S.esc(c.gist)}</b></div>` : ''}
      </div>`;
    }

    const toastHtml = V.toast ? `<div class="d-toast"><span>${S.esc(V.toast.msg)}</span>${V.toast.undo ? '<button onclick="DV.undo()">Geri al</button>' : ''}</div>` : '';

    document.getElementById('app').innerHTML = `
    <div class="d-app"><div class="d-wrap">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:16px">
        <div><div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--mut);font-weight:700">Kişisel Ajanda</div>
          <button onclick="DV.yearPick()" class="fr" style="display:flex;align-items:center;gap:8px;background:none;border:none;padding:0;margin-top:2px;font-size:40px;line-height:1;font-weight:600;color:var(--ink);cursor:pointer;font-family:'Fraunces',Georgia,serif">
            ${Y}<span style="font-size:15px;color:#c2b198">▾</span></button></div>
        <div style="background:#3a342c;color:#f3ecdf;border-radius:14px;padding:11px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 5px 14px rgba(58,52,44,.16)">
          <div style="text-align:center;min-width:56px">
            <div class="fr" style="font-size:32px;line-height:.95;font-weight:600;color:var(--gold)">${cdDays}</div>
            <div style="font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#bcae97;margin-top:2px">${cdUnit}</div></div>
          <div style="border-left:1px solid rgba(243,236,223,.2);padding-left:13px">
            <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#bcae97">Hedef</div>
            <div class="fr" style="font-size:15px;font-weight:500;margin-top:1px">${cdLabel}</div>
            <input type="date" value="${cd}" onchange="DV.countdown(this.value)" style="margin-top:5px;background:rgba(243,236,223,.08);border:1px solid rgba(243,236,223,.2);color:#f3ecdf;border-radius:8px;padding:3px 6px;font-size:12px;font-family:inherit;color-scheme:dark"></div></div></div>

      ${todayCard}

      <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:12px">
        <input id="dQuick" class="d-in" style="flex:1;min-width:260px" placeholder="Hızlı ekle — “28 eyl 19:00 Özge yemek” yazıp Enter"
          onkeydown="if(event.key==='Enter'){DV.quick(this.value)}">
        <div style="position:relative;min-width:210px">
          <input id="dSearch" class="d-in" style="width:100%" placeholder="Ara…" value="${S.escAttr(V.q)}" oninput="DV.search(this.value)">
          ${resHtml}
        </div>
        <button class="d-btn" onclick="DV.multi()" style="${V.multi ? 'background:var(--acc);border-color:var(--acc);color:#fff' : ''}">+ Çoklu gün / aralık</button>
        <button class="d-btn" onclick="DV.toolsToggle()" style="display:inline-flex;align-items:center;gap:7px">
          <span id="dDot" style="width:8px;height:8px;border-radius:50%;background:#a8987c"></span>Araçlar</button>
      </div>

      ${legend}
      ${rangeBar}
      <div class="yc-grid">${monthsHtml}</div>
      <div style="text-align:center;margin-top:22px;font-size:12.5px;color:var(--mut)">Bir güne tıklayıp kayıt ekleyin · kategoriye tıklayınca sadece o kategori listelenir</div>
    </div></div>${drawer}${filterPanel}${catModal}${yearModal}${toolsModal}${setPanel}${toastHtml}`;

    applyDim();
    paintStatus();
    if (V.qFocus) {
      const el = document.getElementById('dSearch');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      V.qFocus = false;
    }
  }

  /* seçili kategori dışındakileri soluklaştır */
  function applyDim() {
    let el = document.getElementById('dDimStyle');
    if (!el) { el = document.createElement('style'); el.id = 'dDimStyle'; document.head.appendChild(el); }
    el.textContent = V.filter ? `.d-app .d-cell[data-c]:not([data-c="${V.filter}"]){opacity:.14}` : '';
  }
  /* durum noktası — tam yeniden çizim yapmadan */
  function paintStatus() {
    const st = S.status;
    const dot = { ok: '#6C9E6E', sync: '#D9B44A', err: '#C25A4E', idle: '#a8987c' }[st.kind] || '#a8987c';
    const el = document.getElementById('dDot');
    if (el) { el.style.background = dot; el.parentElement.title = st.text; }
  }

  function grabRange() {
    const g = id => document.getElementById(id);
    if (g('mText')) V.multi.text = g('mText').value;
    if (g('mTime')) V.multi.time = g('mTime').value;
    if (g('mFrom')) V.multi.from = g('mFrom').value;
    if (g('mTo')) V.multi.to = g('mTo').value;
  }

  const DV = {
    year(y) { V.year = y; V.yearPick = false; render(); },
    yearPick() { V.yearPick = !V.yearPick; render(); },
    toolsToggle() { V.tools = !V.tools; render(); },
    filter(id) { V.filter = (id && V.filter !== id) ? id : null; render(); },
    cell(k) { if (V.multi) DV.pick(k); else DV.open(k); },
    goto(date) { V.year = Number(date.slice(0, 4)); V.q = ''; V.filter = null; DV.open(date); },
    search(q) { V.q = q; V.qFocus = true; clearTimeout(DV._t); DV._t = setTimeout(render, 160); },
    quick(val) {
      const r = parseQuick(val);
      if (!r) { toast('Anlaşılmadı — “28 eyl 19:00 başlık” gibi yazın'); return; }
      S.addEvent({ date: r.date, time: r.time, text: r.text, cat: V.draft.cat || 'genel' });
      V.year = Number(r.date.slice(0, 4));
      const p = S.parseKey(r.date);
      render();
      const el = document.getElementById('dQuick'); if (el) { el.value = ''; el.focus(); }
      toast('Eklendi · ' + p.d + ' ' + S.MONTHS_SHORT[p.m] + (r.time ? ' ' + r.time : ''));
    },

    /* aralık */
    multi() {
      V.multi = V.multi ? null : { text: '', cat: V.draft.cat || 'genel', time: '', from: '', to: '', wd: [1, 1, 1, 1, 1, 1, 1], extra: [], removed: [] };
      V.selected = null; V.filter = null; render();
    },
    mset(k, v) { grabRange(); V.multi[k] = v; skipGrab = true; render(); },
    mwd(i) { grabRange(); V.multi.wd[i] = V.multi.wd[i] ? 0 : 1; skipGrab = true; render(); },
    pick(k) {
      grabRange();
      const M = V.multi, cur = finalDates();
      if (cur.indexOf(k) >= 0) {
        M.extra = M.extra.filter(d => d !== k);
        if (M.removed.indexOf(k) < 0) M.removed.push(k);
      } else {
        M.removed = M.removed.filter(d => d !== k);
        if (M.extra.indexOf(k) < 0) M.extra.push(k);
      }
      skipGrab = true; render();
    },
    mclear() { grabRange(); V.multi.from = ''; V.multi.to = ''; V.multi.extra = []; V.multi.removed = []; skipGrab = true; render(); },
    msave() {
      grabRange();
      const M = V.multi, dates = finalDates();
      if (!dates.length) { toast('Önce başlangıç ve bitiş tarihi seçin'); return; }
      S.addEvents(dates, { text: (M.text || '').trim() || 'Yeni kayıt', cat: M.cat, time: M.time });
      V.year = Number(dates[0].slice(0, 4));
      V.multi = null; render();
      toast(dates.length + ' güne eklendi');
    },

    /* gün paneli */
    open(k) { V.selected = k; V.draft = { text: '', cat: V.draft.cat || 'genel', time: '', note: '' }; render(); },
    close() { V.selected = null; render(); },
    countdown(v) { S.setCountdown(v); },
    target() { if (V.selected) S.setCountdown(V.selected); },
    draftText(v) { V.draft.text = v; },
    draftNote(v) { V.draft.note = v; },
    draft(k, v) {
      const t = document.getElementById('dText'); if (t) V.draft.text = t.value;
      const nt = document.getElementById('dNote'); if (nt) V.draft.note = nt.value;
      V.draft[k] = v; render();
    },
    add() {
      const t = document.getElementById('dText'); if (t) V.draft.text = t.value;
      const nt = document.getElementById('dNote'); if (nt) V.draft.note = nt.value;
      S.addEvent({
        date: V.selected, time: V.draft.time, note: (V.draft.note || '').trim(),
        text: (V.draft.text || '').trim() || 'Yeni kayıt', cat: V.draft.cat
      });
      V.draft.text = ''; V.draft.note = ''; render();
    },
    del(id) { S.deleteEvent(id); render(); toast('Kayıt silindi', true); },
    delGroup(gid) { const n = S.groupCount(gid); S.deleteGroup(gid); render(); toast(n + ' gün silindi', true); },
    undo() { const n = S.undo(); V.toast = null; render(); if (n) toast(n + ' kayıt geri alındı'); },

    /* kategoriler */
    catEditToggle() { V.catEdit = !V.catEdit; V.tools = false; render(); },
    catName(id, v) { S.updateCat(id, { name: (v || '').trim() || 'Kategori' }); render(); },
    catColor(id, hex) { S.updateCat(id, { color: hex }); render(); },
    catAdd() { const c = S.addCat('Yeni kategori', S.COLOR.gri); render(); toast('Kategori eklendi — adını değiştirin'); },
    catDel(id) {
      const c = S.cat(id), n = S.data.events.filter(e => e.cat === id).length;
      if (!confirm('“' + c.name + '” kategorisi silinsin mi?' + (n ? '\n' + n + ' kayıt Genel kategorisine taşınacak.' : ''))) return;
      S.deleteCat(id); render(); toast('Kategori silindi');
    },

    /* araçlar */
    ics() {
      const list = S.data.events.filter(e => e.date.slice(0, 4) === String(V.year));
      if (!list.length) { toast('Bu yılda kayıt yok'); return; }
      S.downloadICS(list, 'ajanda-' + V.year);
      V.tools = false; render(); toast(list.length + ' kayıt .ics olarak indirildi');
    },
    icsAll() {
      if (!S.data.events.length) { toast('Kayıt yok'); return; }
      S.downloadICS(null, 'ajanda-tum');
      V.tools = false; render(); toast(S.data.events.length + ' kayıt .ics olarak indirildi');
    },
    settings() { V.setOpen = !V.setOpen; render(); },
    saveCfg() {
      S.setCfg({ token: document.getElementById('cfgTok').value.trim(), gist: document.getElementById('cfgGist').value.trim() });
      S.sync().then(() => render());
    },
    import(input) {
      const f = input.files && input.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { const n = S.importJSON(r.result); V.tools = false; render(); toast(n + ' kayıt yüklendi'); }
        catch (e) { toast('Yedek okunamadı'); }
      };
      r.readAsText(f); input.value = '';
    }
  };

  function mount() {
    if (!document.getElementById('desktop-css')) {
      const s = document.createElement('style'); s.id = 'desktop-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!V) init();
    document.getElementById('app').className = '';
    window.DV = DV;
    S.on('status', () => { if (document.body.dataset.ui === 'desktop') paintStatus(); });
    render();
  }

  return { mount: mount, render: () => { if (V) render(); } };
})();
