"use strict";
/* ===========================================================
   desktop.js — bilgisayar (web) görünümü
   Mevcut ajanda tasarımının yeni veri modeline uyarlanmış hâli.
   Renkler mobil paletten gelir (Store.PALETTE).
   =========================================================== */
var DesktopView = (function () {
  const S = Store;

  const CSS = `
  .d-app{--paper:#ece4d6;--card:#fbf8f2;--ink:#3a342c;--mut:#a8987c;--line:#e4dac8;--acc:#b5552e;--gold:#e3a23f}
  .d-app *{box-sizing:border-box}
  .d-app{font-family:'Karla',system-ui,sans-serif;color:var(--ink);min-height:100vh;
    background:radial-gradient(140% 100% at 50% 0%,#f1eadd 0%,#ece4d6 55%,#e4dac8 100%);padding:28px 32px 48px}
  .fr{font-family:'Fraunces',Georgia,serif}
  .d-wrap{max-width:1340px;margin:0 auto}
  .hb{transition:transform .12s ease;position:relative}
  .hb:hover{transform:translateY(-2px)}
  .hb .rm{opacity:0;transition:opacity .12s}
  .hb:hover .rm{opacity:1}
  @keyframes drawerIn{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes popIn{from{transform:scale(.9);opacity:.4}to{transform:scale(1);opacity:1}}
  .d-app button:focus-visible,.d-app input:focus-visible,.d-app textarea:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
  .yc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .today-split{display:grid;grid-template-columns:minmax(240px,340px) 1fr;gap:26px;align-items:start}
  .habit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:12px}
  @media (max-width:1180px){.yc-grid{grid-template-columns:repeat(2,1fr)}.today-split{grid-template-columns:1fr}}
  @media (prefers-reduced-motion:reduce){.d-app *{animation:none!important;transition:none!important}}
  `;

  let V = null;
  function init() {
    V = {
      year: new Date().getFullYear(), selected: null, filter: null,
      draft: { text: '', cat: 'mavi', time: '', amtType: 'none', amt: '' },
      catEdit: false, habitEdit: false, setOpen: false, focusHabit: false
    };
  }

  const years = () => {
    const s = {}; S.data.events.forEach(e => s[e.date.slice(0, 4)] = 1);
    s[new Date().getFullYear()] = 1;
    const arr = Object.keys(s).map(Number).sort();
    if (arr.indexOf(new Date().getFullYear() + 1) < 0) arr.push(new Date().getFullYear() + 1);
    return arr;
  };

  function amtHtml(e, dark) {
    if (e.amtType !== 'inc' && e.amtType !== 'exp') return '';
    const col = e.amtType === 'inc' ? '#2f6b4f' : '#a53a2c';
    return '<span style="font-size:12.5px;font-weight:700;color:' + (dark ? (e.amtType === 'inc' ? '#8aae4a' : '#e08b7d') : col) + '">' +
      (e.amtType === 'inc' ? '+' : '−') + S.money(e.amt) + '</span>';
  }

  /* ---------- aktivite kartları ---------- */
  function habitTiles(k, list) {
    if (!list.length) return '<div style="grid-column:1/-1;border:1px dashed rgba(243,236,223,.28);border-radius:12px;padding:14px;text-align:center;color:#bcae97;font-size:13px">Takip edilen aktivite yok.</div>';
    return list.map(h => {
      const on = S.doneOn(k).indexOf(h.id) >= 0;
      const st = S.habitStreak(h.id);
      const week = lastN(k, 7).map(d => {
        const hit = S.doneOn(d).indexOf(h.id) >= 0;
        return '<span title="' + d + '" style="width:7px;height:7px;border-radius:2px;background:' + (hit ? h.color : 'rgba(120,105,85,.22)') + ';display:inline-block"></span>';
      }).join('');
      return `<div class="hb" role="button" tabindex="0" aria-pressed="${on}" onclick="DV.toggleHabit('${k}','${h.id}')"
        style="text-align:left;cursor:pointer;border-radius:14px;padding:10px 12px;border:1.5px solid ${on ? h.color : '#e0d4bd'};background:${on ? S.rgba(h.color, .16) : '#fff'};display:flex;flex-direction:column;gap:6px">
        <button class="rm" onclick="event.stopPropagation();DV.untrack('${h.id}')" title="Takipten çıkar"
          style="position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:50%;background:#3a342c;color:#f3ecdf;border:1.5px solid #ece4d6;font-size:12px;line-height:1;cursor:pointer;padding:0">×</button>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:17px;line-height:1">${h.icon || '•'}</span>
          <span style="flex:1;min-width:0;font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${S.esc(h.name)}</span>
          <span style="width:18px;height:18px;border-radius:50%;flex:none;border:1.5px solid ${on ? h.color : '#d6c8ae'};background:${on ? h.color : 'transparent'};color:#fff;font-size:11px;line-height:15px;text-align:center;${on ? 'animation:popIn .18s ease' : ''}">${on ? '✓' : ''}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="display:flex;gap:3px">${week}</div>
          <span style="font-size:11px;font-weight:700;color:${st > 0 ? h.color : '#bdae93'}">${st > 0 ? '🔥 ' + st : '—'}</span>
        </div></div>`;
    }).join('');
  }
  function lastN(k, n) { const out = []; for (let i = n - 1; i >= 0; i--) out.push(S.shiftKey(k, -i)); return out; }
  function usedIn(k, n) { const s = {}; lastN(k, n).forEach(d => S.doneOn(d).forEach(id => s[id] = 1)); return s; }
  function overviewHabits(k) { const r = usedIn(k, 7); return S.data.habits.filter(h => !h.hidden && (h.pinned || r[h.id])); }
  function dayHabits(k) {
    const done = S.doneOn(k), r = usedIn(k, 21);
    return S.data.habits.filter(h => !h.hidden && (done.indexOf(h.id) >= 0 || h.pinned || r[h.id]))
      .sort((a, b) => (done.indexOf(b.id) >= 0) - (done.indexOf(a.id) >= 0));
  }
  function dayHabitChips(k) {
    const list = dayHabits(k);
    const chips = list.map(h => {
      const on = S.doneOn(k).indexOf(h.id) >= 0;
      return `<button onclick="DV.toggleHabit('${k}','${h.id}')" style="display:inline-flex;align-items:center;gap:6px;border:${on ? '1.5px solid ' + h.color : '1px solid #ddd0b8'};background:${on ? S.rgba(h.color, .16) : '#fff'};border-radius:20px;padding:7px 12px;font-size:13.5px;font-weight:600;color:#3a342c;cursor:pointer">
        <span style="font-size:14px;line-height:1">${h.icon || '•'}</span>${S.esc(h.name)}
        <span style="width:15px;height:15px;border-radius:50%;border:1.5px solid ${on ? h.color : '#d6c8ae'};background:${on ? h.color : 'transparent'};color:#fff;font-size:10px;line-height:12px;text-align:center">${on ? '✓' : ''}</span></button>`;
    }).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:7px">${chips || '<div style="font-size:13px;color:#bdae93">Henüz aktivite yok.</div>'}</div>
      <div style="display:flex;gap:8px;margin-top:11px">
        <input id="habitInput" placeholder="Bu güne aktivite ekle — örn. Sinema" onkeydown="if(event.key==='Enter')DV.addHabit('${k}',this.value)"
          style="flex:1;min-width:0;border:1px solid #ddd0b8;border-radius:11px;padding:9px 12px;font-size:14px;background:#fff;outline:none">
        <button onclick="DV.addHabit('${k}',document.getElementById('habitInput').value)"
          style="background:#efe7d6;border:1px solid #d9ccb5;border-radius:11px;padding:9px 15px;font-size:14px;font-weight:700;color:#8a7355;cursor:pointer">Ekle</button></div>`;
  }

  /* ---------- render ---------- */
  function render() {
    const cm = S.catMap(), hm = S.habitMap(), byDate = S.eventsByDate();
    const tKey = S.todayKey(), tp = S.parseKey(tKey);
    const cd = S.data.countdown.v;

    let cdDays = '—', cdUnit = 'gün', cdLabel = 'seçilmedi';
    if (cd) {
      const p = S.parseKey(cd), target = new Date(p.y, p.m, p.d), n = new Date(); n.setHours(0, 0, 0, 0);
      const diff = Math.round((target - n) / 86400000);
      cdLabel = p.d + ' ' + S.MONTHS[p.m] + ' ' + p.y;
      if (diff > 0) { cdDays = diff; cdUnit = 'gün kaldı'; }
      else if (diff === 0) { cdDays = '🎉'; cdUnit = 'BUGÜN'; }
      else { cdDays = Math.abs(diff); cdUnit = 'gün geçti'; }
    }

    const counts = {}; S.data.events.forEach(e => counts[e.cat] = (counts[e.cat] || 0) + 1);
    const chips = S.data.cats.filter(c => counts[c.id]).map(c => {
      const a = V.filter === c.id;
      return `<button onclick="DV.filter('${c.id}')" style="display:inline-flex;align-items:center;gap:5px;border:${a ? '1.5px solid ' + c.color : '1px solid #ddd0b8'};background:${a ? '#fff' : '#fbf8f2'};border-radius:20px;padding:5px 11px 5px 9px;font-size:12.5px;font-weight:600;color:#5a5142;cursor:pointer">
        <span style="width:9px;height:9px;border-radius:50%;background:${c.color}"></span>${S.esc(c.name)}<span style="opacity:.55">${counts[c.id]}</span></button>`;
    }).join('');

    /* bugün kartı */
    const todayEvents = byDate[tKey] || [];
    const todayEvHtml = todayEvents.length ? todayEvents.map(ev => {
      const c = cm[ev.cat] || { name: '—', color: '#8a7f6f' };
      return `<div style="display:flex;gap:10px;background:rgba(243,236,223,.07);border-radius:11px;padding:10px 12px">
        <span style="width:3px;border-radius:3px;background:${c.color};flex:none"></span>
        <div style="flex:1;min-width:0">
          <div style="font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:${c.color}">${S.esc(c.name)}${ev.time ? ' · ' + ev.time : ''}</div>
          <div style="font-size:14px;color:#f3ecdf;white-space:pre-line;line-height:1.4;margin-top:2px">${S.esc(ev.text)}</div></div>
        ${amtHtml(ev, true)}</div>`;
    }).join('') : '<div style="border:1px dashed rgba(243,236,223,.28);border-radius:11px;padding:16px;text-align:center;color:#bcae97;font-size:13.5px">Bugüne ait kayıt yok.</div>';

    const ov = overviewHabits(tKey);
    const doneCount = S.doneOn(tKey).filter(id => hm[id] && !hm[id].hidden).length;
    const pct = ov.length ? Math.round(Math.min(doneCount, ov.length) / ov.length * 100) : 0;

    const todayCard = `
    <div style="background:#3a342c;border-radius:22px;padding:22px 24px;box-shadow:0 10px 30px rgba(58,52,44,.2);margin-bottom:22px">
      <div class="today-split">
        <div>
          <div style="font-size:11.5px;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);font-weight:700">Bugün</div>
          <div style="display:flex;align-items:baseline;gap:10px;margin-top:4px">
            <div class="fr" style="font-size:44px;line-height:1;font-weight:600;color:#f3ecdf">${tp.d} ${S.MONTHS[tp.m]}</div>
            <div style="font-size:14px;font-weight:700;color:#bcae97">${S.WD_FULL[S.weekday(tKey)]}</div></div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">${todayEvHtml}</div>
          <button onclick="DV.open('${tKey}')" style="margin-top:12px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:11px;padding:11px;font-size:14.5px;font-weight:700;cursor:pointer">Bugünü aç</button>
        </div>
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div style="font-size:11.5px;letter-spacing:2.5px;text-transform:uppercase;color:#bcae97;font-weight:700">Son 7 gün</div>
            <div style="display:flex;align-items:center;gap:10px">
              <span class="fr" style="font-size:15px;color:#f3ecdf">bugün ${doneCount}/${ov.length}</span>
              <button onclick="DV.habitEdit()" style="background:rgba(243,236,223,.1);border:1px solid rgba(243,236,223,.22);color:#e6dcc9;border-radius:9px;padding:5px 11px;font-size:12.5px;font-weight:600;cursor:pointer">Aktiviteleri düzenle</button></div></div>
          <div style="height:6px;border-radius:6px;background:rgba(243,236,223,.14);margin:10px 0 14px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:6px;transition:width .25s"></div></div>
          <div class="habit-grid">${habitTiles(tKey, ov)}</div>
        </div>
      </div></div>`;

    /* aylar */
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
        const matches = !V.filter || evs.some(e => e.cat === V.filter);
        const dimmed = V.filter && evs.length && !matches;
        const seen = {}, colors = [];
        evs.forEach(e => { const col = (cm[e.cat] || {}).color || '#8a7f6f'; if (!seen[col]) { seen[col] = 1; colors.push(col); } });
        let bg = weekend ? '#f1e8d7' : 'transparent', border = '1px solid transparent',
          numColor = weekend ? '#b09a78' : '#5a5142', dots = colors.slice(0, 4), shadow = '';
        if (evs.length) {
          bg = S.rgba(colors[0], .6);
          border = '1px solid ' + S.rgba(colors[0], .9);
          numColor = '#3a342c'; dots = colors.slice(1, 4);
        }
        if (isToday) { border = '1.5px solid var(--acc)'; if (!evs.length) bg = '#fbeede'; numColor = '#b5552e'; }
        if (isTarget) border = '1.5px solid var(--gold)';
        if (isPast) { bg = '#4a4136'; border = isTarget ? '1.5px solid var(--gold)' : '1px solid #423a30'; numColor = '#b7a98f'; dots = colors.slice(0, 4); shadow = 'box-shadow:0 0 0 1px rgba(74,65,54,.9);'; }
        const dotsHtml = dots.map(c => '<span style="width:5px;height:5px;border-radius:50%;background:' + c + ';display:inline-block;' + shadow + '"></span>').join('');
        const hDone = S.doneOn(k).filter(id => hm[id]);
        const hBar = hDone.length ? '<div style="display:flex;gap:1.5px;margin-top:2px">' + hDone.slice(0, 6).map(id => '<span style="width:4px;height:2.5px;border-radius:2px;background:' + hm[id].color + ';display:inline-block"></span>').join('') + '</div>' : '';
        const title = [evs.map(e => (e.time ? e.time + ' ' : '') + e.text).join(' · '), hDone.map(id => hm[id].name).join(', ')].filter(Boolean).join(' — ');
        cells += `<div onclick="DV.open('${k}')" title="${S.esc(title)}" style="height:38px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;cursor:pointer;background:${bg};border:${border};opacity:${dimmed ? .32 : 1}">
          <span style="font-size:12.5px;line-height:1;font-weight:${(isToday || evs.length) ? 700 : 500};color:${numColor};font-family:${evs.length ? "'Fraunces',Georgia,serif" : "'Karla',sans-serif"}">${n}</span>
          <div style="display:flex;gap:2px;justify-content:center;height:5px;margin-top:1px">${dotsHtml}</div>${hBar}</div>`;
      }
      const wdHead = S.WD_MINI.map(w => '<div style="text-align:center;font-size:10px;font-weight:700;color:#bdae93">' + w + '</div>').join('');
      return `<div style="background:var(--card);border-radius:16px;padding:14px 14px 16px;box-shadow:${isCur ? '0 0 0 1.5px #b5552e,0 4px 14px rgba(181,85,46,.12)' : '0 1px 3px rgba(60,52,44,.08)'}">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">
          <span class="fr" style="font-size:20px;font-weight:600">${name}</span>
          <span style="font-size:11px;color:#b3a488;font-weight:600">${monthCount ? monthCount + ' kayıt' : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">${wdHead}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">${cells}</div></div>`;
    }).join('');

    /* P&L şeridi */
    const t = S.totals(e => e.date.slice(0, 4) === String(Y));
    const plStrip = `<div style="display:flex;gap:12px;margin-bottom:18px">
      ${[['Gelir', t.inc, '#2f6b4f'], ['Gider', t.exp, '#a53a2c'], ['Net', t.net, t.net >= 0 ? '#2f6b4f' : '#a53a2c']].map(x =>
      `<div style="flex:1;background:var(--card);border-radius:14px;padding:12px 16px;box-shadow:0 1px 3px rgba(60,52,44,.08)">
          <div style="font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#b3a488;font-weight:700">${x[0]} · ${Y}</div>
          <div class="fr" style="font-size:22px;font-weight:600;color:${x[2]};margin-top:2px">${S.money(x[1])}</div></div>`).join('')}</div>`;

    /* gün paneli */
    let drawer = '';
    if (V.selected) {
      const k = V.selected, p = S.parseKey(k);
      const list = S.eventsOn(k);
      const evHtml = list.length ? list.map(ev => {
        const c = cm[ev.cat] || { name: '—', color: '#8a7f6f' };
        return `<div style="display:flex;gap:11px;background:#f3ecdd;border-radius:12px;padding:12px 13px">
          <span style="width:4px;border-radius:4px;background:${c.color};flex:none"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${c.color}">${S.esc(c.name)}${ev.time ? ' · ' + ev.time : ''}</div>
            <div style="font-size:14.5px;white-space:pre-line;line-height:1.4;margin-top:3px">${S.esc(ev.text)}</div>
            ${amtHtml(ev) ? '<div style="margin-top:4px">' + amtHtml(ev) + '</div>' : ''}</div>
          <button onclick="DV.del('${ev.id}')" title="Sil" style="background:none;border:none;color:#bba88a;font-size:17px;cursor:pointer;align-self:flex-start">×</button></div>`;
      }).join('') : '<div style="text-align:center;color:#bdae93;font-size:14px;padding:18px 0 26px">Bu gün için kayıt yok.</div>';

      const draftChips = S.data.cats.map(c => `<button onclick="DV.draft('cat','${c.id}')" title="${S.escAttr(c.name)}"
        style="width:22px;height:22px;border-radius:50%;background:${c.color};border:${V.draft.cat === c.id ? '2px solid #3a342c' : '2px solid transparent'};cursor:pointer;padding:0"></button>`).join('');

      drawer = `<div onclick="DV.close()" style="position:fixed;inset:0;background:rgba(40,35,28,.34);z-index:40"></div>
      <div style="position:fixed;top:0;right:0;height:100vh;width:420px;max-width:94vw;background:var(--card);z-index:41;box-shadow:-12px 0 40px rgba(40,35,28,.22);display:flex;flex-direction:column;animation:drawerIn .22s ease">
        <div style="padding:22px 24px 18px;border-bottom:1px solid #ece1cd">
          <div style="display:flex;align-items:flex-start;justify-content:space-between">
            <div><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b3a488;font-weight:700">${S.WD_FULL[S.weekday(k)]}${k === tKey ? ' · bugün' : ''}</div>
              <div class="fr" style="font-size:30px;font-weight:600;line-height:1.05;margin-top:2px">${p.d} ${S.MONTHS[p.m]}</div></div>
            <button onclick="DV.close()" style="background:#efe7d6;border:none;width:34px;height:34px;border-radius:50%;font-size:18px;color:#6b5f4d;cursor:pointer">×</button></div>
          <button onclick="DV.target()" style="margin-top:12px;background:none;border:1px dashed #cdbb9c;border-radius:9px;padding:6px 11px;font-size:12.5px;font-weight:600;color:#9a7d4f;cursor:pointer">★ Bu günü geri sayım hedefi yap</button></div>
        <div style="flex:1;overflow-y:auto;padding:18px 24px">
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">${evHtml}</div>

          <div style="border-top:1px solid #ece1cd;padding-top:18px">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#b3a488;font-weight:700;margin-bottom:10px">Aktiviteler</div>
            ${dayHabitChips(k)}</div>

          <div style="border-top:1px solid #ece1cd;padding-top:18px;margin-top:20px">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#b3a488;font-weight:700;margin-bottom:9px">Yeni kayıt</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:11px">${draftChips}</div>
            <textarea id="dText" oninput="DV.draftText(this.value)" placeholder="Ne yapacaksın?" rows="3"
              style="width:100%;border:1px solid #ddd0b8;border-radius:11px;padding:11px 12px;font-size:14.5px;font-family:inherit;background:#fff;resize:vertical;outline:none">${S.esc(V.draft.text)}</textarea>
            <div style="display:flex;gap:8px;margin-top:9px">
              <input id="dTime" type="time" value="${V.draft.time}" onchange="DV.draft('time',this.value)"
                style="border:1px solid #ddd0b8;border-radius:10px;padding:8px 10px;font-size:14px;font-family:inherit;background:#fff">
              <select onchange="DV.draft('amtType',this.value)" style="border:1px solid #ddd0b8;border-radius:10px;padding:8px 10px;font-size:14px;font-family:inherit;background:#fff">
                <option value="none"${V.draft.amtType === 'none' ? ' selected' : ''}>Tutar yok</option>
                <option value="exp"${V.draft.amtType === 'exp' ? ' selected' : ''}>Gider</option>
                <option value="inc"${V.draft.amtType === 'inc' ? ' selected' : ''}>Gelir</option>
              </select>
              ${V.draft.amtType === 'none' ? '' : `<input id="dAmt" type="number" step="0.01" placeholder="€" value="${V.draft.amt}" oninput="DV.draftAmt(this.value)"
                style="flex:1;min-width:0;border:1px solid #ddd0b8;border-radius:10px;padding:8px 10px;font-size:14px;font-family:inherit;background:#fff">`}
            </div>
            <button onclick="DV.add()" style="margin-top:11px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer">Ekle</button></div></div></div>`;
    }

    /* kategori listesi paneli */
    let catPanel = '';
    if (V.filter && !V.selected) {
      const fc = cm[V.filter] || { name: '', color: '#8a7f6f' };
      const list = S.data.events.filter(e => e.cat === V.filter).sort((a, b) => a.date < b.date ? -1 : 1);
      const rows = list.length ? list.map((ev, i) => {
        const p = S.parseKey(ev.date);
        return `<div onclick="DV.open('${ev.date}')" style="display:flex;align-items:flex-start;gap:11px;padding:12px 13px;background:#f3ecdd;border-radius:12px;cursor:pointer;border-left:4px solid ${fc.color};opacity:${ev.date < tKey ? .5 : 1}">
          <span class="fr" style="font-size:17px;font-weight:600;color:${fc.color};min-width:26px">${i + 1}.</span>
          <div style="flex:1;min-width:0"><div style="display:flex;align-items:baseline;gap:7px">
            <span class="fr" style="font-size:15px;font-weight:600">${p.d} ${S.MONTHS_SHORT[p.m]} ${p.y}</span>
            <span style="font-size:12px;color:#a8987c;font-weight:600">${S.WD_SHORT[S.weekday(ev.date)]}${ev.time ? ' · ' + ev.time : ''}</span></div>
            <div style="font-size:14px;color:#5a5142;white-space:pre-line;line-height:1.4;margin-top:2px">${S.esc(ev.text)}</div></div></div>`;
      }).join('') : '<div style="text-align:center;color:#bdae93;padding:24px 0">Bu renkte kayıt yok.</div>';
      catPanel = `<div onclick="DV.filter(null)" style="position:fixed;inset:0;background:rgba(40,35,28,.34);z-index:38"></div>
      <div style="position:fixed;top:0;right:0;height:100vh;width:420px;max-width:94vw;background:var(--card);z-index:39;box-shadow:-12px 0 40px rgba(40,35,28,.22);display:flex;flex-direction:column;animation:drawerIn .22s ease">
        <div style="padding:22px 24px 18px;border-bottom:1px solid #ece1cd;display:flex;align-items:flex-start;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px"><span style="width:16px;height:16px;border-radius:50%;background:${fc.color}"></span>
            <div><div class="fr" style="font-size:26px;font-weight:600;line-height:1.05">${S.esc(fc.name)}</div>
              <div style="font-size:12.5px;color:#a8987c;font-weight:600;margin-top:2px">${list.length} kayıt</div></div></div>
          <button onclick="DV.filter(null)" style="background:#efe7d6;border:none;width:34px;height:34px;border-radius:50%;font-size:18px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="flex:1;overflow-y:auto;padding:18px 24px"><div style="display:flex;flex-direction:column;gap:9px">${rows}</div></div></div>`;
    }

    /* kategori (renk) düzenleyici */
    let editor = '';
    if (V.catEdit) {
      const rows = S.data.cats.map(c => `<div style="display:flex;align-items:center;gap:10px">
        <span style="width:20px;height:20px;border-radius:50%;background:${c.color};flex:none"></span>
        <input value="${S.escAttr(c.name)}" onchange="DV.rename('${c.id}',this.value)" style="flex:1;min-width:0;border:1px solid #ddd0b8;border-radius:9px;padding:7px 10px;font-size:14px;font-family:inherit;background:#fff;outline:none">
        <span style="font-size:11.5px;color:#b3a488">${(S.data.events.filter(e => e.cat === c.id).length) || 0}</span></div>`).join('');
      editor = `<div onclick="DV.catEdit()" style="position:fixed;inset:0;background:rgba(40,35,28,.34);z-index:50"></div>
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:440px;max-width:92vw;max-height:84vh;overflow-y:auto;background:var(--card);border-radius:18px;z-index:51;box-shadow:0 24px 60px rgba(40,35,28,.3);padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span class="fr" style="font-size:24px;font-weight:600">Renkler</span>
          <button onclick="DV.catEdit()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="font-size:13px;color:#a8987c;margin-bottom:14px">Her renge kendi adını verebilirsin; telefonda da aynı adlar görünür.</div>
        <div style="display:flex;flex-direction:column;gap:10px">${rows}</div></div>`;
    }

    /* aktivite düzenleyici */
    let habitEditor = '';
    if (V.habitEdit) {
      const mk = h => {
        const icons = S.ICONS.map(ic => `<button onclick="DV.updHabit('${h.id}',{icon:'${ic}'})" style="width:26px;height:26px;border-radius:8px;background:${h.icon === ic ? S.rgba(h.color, .2) : 'transparent'};border:${h.icon === ic ? '1.5px solid ' + h.color : '1px solid #e6dbc6'};cursor:pointer;font-size:14px;padding:0">${ic}</button>`).join('');
        const sw = S.PALETTE.map(p => `<button onclick="DV.updHabit('${h.id}',{color:'${p.color}'})" style="width:16px;height:16px;border-radius:50%;background:${p.color};border:${h.color === p.color ? '2px solid #3a342c' : '2px solid transparent'};cursor:pointer;padding:0"></button>`).join('');
        return `<div style="border:1px solid #ece1cd;border-radius:13px;padding:12px;display:flex;flex-direction:column;gap:9px">
          <div style="display:flex;align-items:center;gap:9px">
            <span style="font-size:18px">${h.icon || '•'}</span>
            <input value="${S.escAttr(h.name)}" onchange="DV.updHabit('${h.id}',{name:this.value})" style="flex:1;min-width:0;border:1px solid #ddd0b8;border-radius:9px;padding:7px 10px;font-size:14px;font-family:inherit;background:#fff;outline:none">
            <button onclick="DV.delHabit('${h.id}')" style="background:none;border:none;color:#c08a6f;font-size:13px;font-weight:600;cursor:pointer">Sil</button></div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${icons}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <div style="display:flex;flex-wrap:wrap;gap:5px">${sw}</div>
            <button onclick="DV.updHabit('${h.id}',{pinned:${!h.pinned},hidden:false})" style="background:${h.pinned ? '#3a342c' : '#efe7d6'};color:${h.pinned ? '#f3ecdf' : '#8a7355'};border:1px solid ${h.pinned ? '#3a342c' : '#d9ccb5'};border-radius:9px;padding:6px 11px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap">${h.pinned ? '★ Hep göster' : '☆ Hep göster'}</button></div></div>`;
      };
      const active = S.data.habits.filter(h => !h.hidden).map(mk).join('') || '<div style="font-size:13.5px;color:#bdae93">Aktif aktivite yok.</div>';
      const hidden = S.data.habits.filter(h => h.hidden);
      const hiddenHtml = hidden.length ? `<div style="margin-top:20px;border-top:1px solid #ece1cd;padding-top:16px">
        <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#b3a488;font-weight:700;margin-bottom:9px">Takip dışı</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px">${hidden.map(h => `<button onclick="DV.updHabit('${h.id}',{hidden:false})" style="display:inline-flex;align-items:center;gap:6px;border:1px dashed #ddd0b8;background:#fff;border-radius:20px;padding:6px 12px;font-size:13px;font-weight:600;color:#8a7355;cursor:pointer">${h.icon || '•'} ${S.esc(h.name)} <span style="color:var(--acc)">↺</span></button>`).join('')}</div></div>` : '';
      habitEditor = `<div onclick="DV.habitEdit()" style="position:fixed;inset:0;background:rgba(40,35,28,.34);z-index:50"></div>
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:470px;max-width:92vw;max-height:84vh;overflow-y:auto;background:var(--card);border-radius:18px;z-index:51;box-shadow:0 24px 60px rgba(40,35,28,.3);padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <span class="fr" style="font-size:24px;font-weight:600">Aktiviteler</span>
          <button onclick="DV.habitEdit()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="display:flex;flex-direction:column;gap:11px">${active}</div>${hiddenHtml}</div>`;
    }

    /* ayarlar / senkron */
    let setPanel = '';
    if (V.setOpen) {
      const c = S.cfg(), st = S.status;
      setPanel = `<div onclick="DV.settings()" style="position:fixed;inset:0;background:rgba(40,35,28,.34);z-index:50"></div>
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:480px;max-width:92vw;max-height:84vh;overflow-y:auto;background:var(--card);border-radius:18px;z-index:51;box-shadow:0 24px 60px rgba(40,35,28,.3);padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span class="fr" style="font-size:24px;font-weight:600">Senkronizasyon</span>
          <button onclick="DV.settings()" style="background:#efe7d6;border:none;width:32px;height:32px;border-radius:50%;font-size:17px;color:#6b5f4d;cursor:pointer">×</button></div>
        <div style="font-size:13px;color:#a8987c;margin-bottom:16px;line-height:1.55">Veriler gizli bir GitHub Gist'inde tutulur. Aynı token ve Gist ID'yi telefonda da girin; iki cihaz otomatik eşitlenir.</div>
        <label style="display:block;font-size:12.5px;font-weight:700;color:#8a7355;margin-bottom:6px">GitHub token (yalnızca <b>gist</b> yetkisi)</label>
        <input id="cfgTok" type="password" value="${S.escAttr(c.token)}" placeholder="ghp_..." style="width:100%;border:1px solid #ddd0b8;border-radius:10px;padding:10px;font-size:14px;font-family:inherit;background:#fff;outline:none">
        <label style="display:block;font-size:12.5px;font-weight:700;color:#8a7355;margin:14px 0 6px">Gist ID</label>
        <input id="cfgGist" value="${S.escAttr(c.gist)}" placeholder="boş bırakırsanız ilk eşitlemede oluşturulur" style="width:100%;border:1px solid #ddd0b8;border-radius:10px;padding:10px;font-size:14px;font-family:inherit;background:#fff;outline:none">
        <button onclick="DV.saveCfg()" style="margin-top:14px;width:100%;background:var(--acc);color:#fff;border:none;border-radius:11px;padding:12px;font-size:15px;font-weight:700;cursor:pointer">Kaydet ve eşitle</button>
        <div style="margin-top:10px;font-size:13px;color:#8a7355;text-align:center">${S.esc(st.text)}${c.last ? ' · son: ' + new Date(c.last).toLocaleString('tr-TR') : ''}</div>
        ${c.gist ? `<div style="margin-top:14px;background:#f3ecdd;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#6b5f4d;word-break:break-all">Telefona girilecek Gist ID:<br><b>${S.esc(c.gist)}</b></div>` : ''}
      </div>`;
    }

    const st = S.status;
    const dot = { ok: '#4aa060', sync: '#d99b28', err: '#c0392f', idle: '#a8987c' }[st.kind] || '#a8987c';

    document.getElementById('app').innerHTML = `
    <div class="d-app"><div class="d-wrap">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:20px">
        <div><div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--mut);font-weight:700">Kişisel Ajanda</div>
          <div style="display:flex;align-items:center;gap:14px;margin-top:4px">
            <div class="fr" style="font-size:46px;line-height:1;font-weight:600">${Y}</div>
            <div style="display:flex;gap:4px;background:var(--card);border:1px solid #d9ccb5;border-radius:12px;padding:4px">
              ${years().map(y => `<button onclick="DV.year(${y})" style="border:none;border-radius:9px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;background:${y === Y ? 'var(--acc)' : 'transparent'};color:${y === Y ? '#fff' : '#8a7355'}">${y}</button>`).join('')}
            </div></div></div>
        <div style="background:#3a342c;color:#f3ecdf;border-radius:16px;padding:14px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 6px 18px rgba(58,52,44,.18)">
          <div style="text-align:center;min-width:64px">
            <div class="fr" style="font-size:40px;line-height:.95;font-weight:600;color:var(--gold)">${cdDays}</div>
            <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#bcae97;margin-top:2px">${cdUnit}</div></div>
          <div style="border-left:1px solid rgba(243,236,223,.2);padding-left:14px">
            <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#bcae97">Hedef</div>
            <div class="fr" style="font-size:16px;font-weight:500;margin-top:2px">${cdLabel}</div>
            <input type="date" value="${cd}" onchange="DV.countdown(this.value)" style="margin-top:6px;background:rgba(243,236,223,.08);border:1px solid rgba(243,236,223,.2);color:#f3ecdf;border-radius:8px;padding:3px 6px;font-size:12px;font-family:inherit;color-scheme:dark"></div></div></div>

      ${todayCard}
      ${plStrip}

      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${chips}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="Store.sync()" title="Şimdi eşitle" style="display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">
            <span style="width:8px;height:8px;border-radius:50%;background:${dot}"></span>${S.esc(st.text)}</button>
          <button onclick="DV.settings()" style="background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">Senkron ayarları</button>
          <button onclick="DV.catEdit()" style="background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">Renkler</button>
          <button onclick="DV.habitEdit()" style="background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">Aktiviteler</button>
          <button onclick="Store.exportJSON()" style="background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">Yedek indir</button>
          <label style="background:var(--card);border:1px solid #d9ccb5;border-radius:9px;padding:7px 13px;font-size:13px;font-weight:600;color:#6b5f4d;cursor:pointer">Yedek yükle<input type="file" accept="application/json" onchange="DV.import(this)" style="display:none"></label>
        </div></div>

      <div class="yc-grid">${monthsHtml}</div>
      <div style="text-align:center;margin-top:22px;font-size:12.5px;color:var(--mut)">Bir güne tıklayıp kayıt ekleyin · değişiklikler otomatik kaydedilir ve telefonla eşitlenir</div>
    </div></div>${drawer}${catPanel}${editor}${habitEditor}${setPanel}`;

    if (V.focusHabit) { V.focusHabit = false; const el = document.getElementById('habitInput'); if (el) { el.value = ''; el.focus(); } }
  }

  const DV = {
    year(y) { V.year = y; render(); },
    open(k) { V.selected = k; V.draft = { text: '', cat: V.draft.cat || 'mavi', time: '', amtType: 'none', amt: '' }; render(); },
    close() { V.selected = null; render(); },
    filter(id) { V.filter = (id && V.filter !== id) ? id : null; render(); },
    countdown(v) { S.setCountdown(v); },
    target() { if (V.selected) S.setCountdown(V.selected); },
    draftText(v) { V.draft.text = v; },
    draftAmt(v) { V.draft.amt = v; },
    draft(k, v) {
      const t = document.getElementById('dText'); if (t) V.draft.text = t.value;
      V.draft[k] = v; render();
    },
    add() {
      const t = document.getElementById('dText'); if (t) V.draft.text = t.value;
      const a = document.getElementById('dAmt'); if (a) V.draft.amt = a.value;
      const c = S.cat(V.draft.cat);
      S.addEvent({
        date: V.selected, time: V.draft.time, text: (V.draft.text || '').trim() || c.name,
        cat: V.draft.cat, amtType: V.draft.amtType, amt: V.draft.amtType === 'none' ? 0 : (Number(V.draft.amt) || 0)
      });
      V.draft.text = ''; V.draft.amt = ''; render();
    },
    del(id) { S.deleteEvent(id); },
    rename(id, name) { S.updateCat(id, { name: name }); },
    catEdit() { V.catEdit = !V.catEdit; render(); },
    habitEdit() { V.habitEdit = !V.habitEdit; render(); },
    settings() { V.setOpen = !V.setOpen; render(); },
    toggleHabit(k, id) { S.toggleHabit(k, id); },
    addHabit(k, name) { const h = S.addHabit(name); if (h) { S.toggleHabit(k, h.id); V.focusHabit = true; render(); } },
    untrack(id) { S.updateHabit(id, { hidden: true, pinned: false }); },
    updHabit(id, patch) { S.updateHabit(id, patch); },
    delHabit(id) { if (confirm('Aktivite ve tüm işaretleri silinsin mi?')) S.deleteHabit(id); },
    saveCfg() {
      S.setCfg({ token: document.getElementById('cfgTok').value.trim(), gist: document.getElementById('cfgGist').value.trim() });
      S.sync().then(() => render());
    },
    import(input) {
      const f = input.files && input.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const n = S.importJSON(r.result); alert(n + ' kayıt yüklendi.'); render(); } catch (e) { alert('Yedek okunamadı: ' + e.message); } };
      r.readAsText(f); input.value = '';
    }
  };

  function mount() {
    if (!document.getElementById('desktop-css')) {
      const s = document.createElement('style'); s.id = 'desktop-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!V) init();
    window.DV = DV;
    render();
  }

  return { mount: mount, render: () => { if (V) render(); } };
})();
