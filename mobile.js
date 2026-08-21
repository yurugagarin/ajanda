"use strict";
/* ===========================================================
   mobile.js — telefon görünümü (ekrana eklenen sürüm)
   Tasarım: gönderilen ekran görüntüleri esas alınmıştır.
   =========================================================== */
var MobileView = (function () {
  const S = Store;

  const CSS = `
  .m-app{--bg:#f2f1ed;--card:#fff;--ink:#16181a;--mut:#8b8b90;--line:#e4e2db;--green:#2f6b4f;--band:#e7ebe4;
    background:var(--bg);color:var(--ink);min-height:100vh;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;padding:14px 16px 108px;max-width:560px;margin:0 auto}
  .m-app *{box-sizing:border-box}
  .m-eyebrow{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#a9a8a2;font-weight:600}
  .m-eyebrow button{all:unset;cursor:pointer;letter-spacing:inherit}
  .m-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:2px 0 16px}
  .m-title{font-size:30px;font-weight:700;letter-spacing:-.6px;line-height:1.1;display:flex;align-items:center;gap:5px;background:none;border:0;padding:0;color:inherit;font-family:inherit}
  .m-title small{font-size:13px;color:var(--mut);font-weight:500}
  .m-title.now{color:var(--green)}
  .m-ctrls{display:flex;align-items:center;gap:8px}
  .m-pill{display:flex;align-items:center;background:#e8e6e0;border-radius:999px;overflow:hidden}
  .m-pill button{all:unset;cursor:pointer;padding:8px 12px;font-size:15px;color:#4a4a4c;line-height:1}
  .m-btn{all:unset;cursor:pointer;background:#e8e6e0;border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600;color:#4a4a4c}
  .m-add{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;background:var(--green);color:#fff;font-size:22px;font-weight:300;display:flex;align-items:center;justify-content:center;line-height:1}
  .m-wd{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:6px}
  .m-wd span{text-align:center;font-size:11.5px;color:#a9a8a2;font-weight:500}
  .m-week{display:grid;grid-template-columns:repeat(7,1fr);border-radius:12px}
  .m-week.now{background:var(--band)}
  .m-cell{all:unset;cursor:pointer;height:46px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
  .m-num{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}
  .m-num.ev{color:#fff;font-weight:600}
  .m-num.today{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px #16181a}
  .m-week.now .m-num.today{box-shadow:0 0 0 2px var(--band),0 0 0 3.5px #16181a}
  .m-dot{width:4px;height:4px;border-radius:50%}
  .m-sec{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 10px}
  .m-sec h3{font-size:15px;font-weight:700;margin:0}
  .m-sec button{all:unset;cursor:pointer;font-size:13.5px;color:var(--green);font-weight:600}
  .m-list{display:flex;flex-direction:column;gap:8px}
  .m-row{display:flex;align-items:stretch;gap:11px;background:var(--card);border-radius:12px;padding:12px 13px;cursor:pointer}
  .m-bar{width:3px;border-radius:3px;flex:none}
  .m-row h4{margin:0;font-size:15px;font-weight:600;line-height:1.25;word-break:break-word;white-space:pre-line}
  .m-row p{margin:3px 0 0;font-size:12.5px;color:var(--mut)}
  .m-amt{font-size:14px;font-weight:600;align-self:center;white-space:nowrap}
  .m-empty{background:var(--card);border-radius:12px;padding:22px;text-align:center;color:var(--mut);font-size:13.5px}
  .m-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 12px}
  .m-mini h4{margin:0 0 7px;font-size:15px;font-weight:700}
  .m-mini h4.now{color:var(--green)}
  .m-mini h4 span{font-size:11px;color:var(--mut);font-weight:500;margin-left:3px}
  .m-mgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}
  .m-md{height:15px;display:flex;align-items:center;justify-content:center;font-size:9.5px;color:#a9a8a2;font-variant-numeric:tabular-nums}
  .m-md i{width:13px;height:13px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;color:#fff;font-size:8.5px;font-weight:600}
  .m-md i.ring{box-shadow:0 0 0 1px var(--bg),0 0 0 2px #16181a}
  .m-nav{position:fixed;left:0;right:0;bottom:0;background:rgba(242,241,237,.94);backdrop-filter:blur(12px);border-top:1px solid var(--line);
    padding:8px 16px calc(8px + env(safe-area-inset-bottom));display:flex;gap:10px;justify-content:center;z-index:20}
  .m-nav button{all:unset;cursor:pointer;flex:1;max-width:220px;text-align:center;padding:12px;border-radius:999px;font-size:14.5px;font-weight:600;color:var(--mut)}
  .m-nav button.on{background:var(--ink);color:#fff}
  .m-back{position:fixed;inset:0;background:rgba(20,20,20,.32);z-index:30;animation:mfade .18s ease}
  .m-sheet{position:fixed;left:0;right:0;bottom:0;z-index:31;background:#f6f5f1;border-radius:22px 22px 0 0;
    padding:10px 18px calc(18px + env(safe-area-inset-bottom));max-height:92vh;overflow-y:auto;animation:mup .24s cubic-bezier(.2,.8,.2,1);
    max-width:560px;margin:0 auto;box-shadow:0 -8px 40px rgba(0,0,0,.18)}
  .m-grip{width:38px;height:4px;border-radius:4px;background:#d3d1c9;margin:0 auto 14px}
  .m-shead{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
  .m-shead h3{margin:0;font-size:18px;font-weight:700}
  .m-shead button{all:unset;cursor:pointer;font-size:14.5px;color:var(--mut)}
  .m-field{background:var(--card);border-radius:14px;padding:4px 14px}
  .m-field input,.m-field textarea{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:var(--ink);padding:14px 0;resize:none}
  .m-field input::placeholder,.m-field textarea::placeholder{color:#b6b5ae}
  .m-frow{display:flex;align-items:center;justify-content:flex-end;gap:10px;border-top:1px solid var(--line);padding:9px 0}
  .m-frow .dt{flex:1;font-size:14.5px;color:var(--mut)}
  .m-chip{background:#eceae4;border-radius:9px;padding:8px 12px;font-size:14.5px;font-weight:600;color:var(--ink);border:0;font-family:inherit}
  .m-lbl{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:#a9a8a2;font-weight:600;margin:18px 0 8px}
  .m-seg{display:flex;background:#eceae4;border-radius:11px;padding:3px}
  .m-seg button{all:unset;cursor:pointer;flex:1;text-align:center;padding:9px;border-radius:9px;font-size:14.5px;font-weight:600;color:var(--mut)}
  .m-seg button.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
  .m-colors{display:grid;grid-template-columns:repeat(6,1fr);gap:12px 6px}
  .m-col{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px}
  .m-col i{width:44px;height:44px;border-radius:50%;display:block}
  .m-col.on i{box-shadow:0 0 0 2px #f6f5f1,0 0 0 4px #16181a}
  .m-col span{font-size:10.5px;color:var(--mut);text-align:center;line-height:1.15}
  .m-save{all:unset;cursor:pointer;display:block;text-align:center;width:100%;margin-top:20px;padding:16px;border-radius:14px;color:#fff;font-size:16.5px;font-weight:700}
  .m-note{text-align:center;font-size:11.5px;color:#b0afa8;margin-top:10px}
  .m-mgridsel{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}
  .m-mgridsel button{all:unset;cursor:pointer;text-align:center;padding:14px;border-radius:12px;background:#fff;font-size:15px;font-weight:600}
  .m-mgridsel button.on{background:var(--ink);color:#fff}
  .m-mgridsel button.cur{box-shadow:inset 0 0 0 2px var(--green);color:var(--green)}
  .m-mgridsel button.on.cur{color:#fff;box-shadow:inset 0 0 0 2px var(--green)}
  .m-yr{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:4px}
  .m-yr b{font-size:19px}
  .m-yr button{all:unset;cursor:pointer;width:32px;height:32px;border-radius:50%;background:#eceae4;display:flex;align-items:center;justify-content:center;font-size:15px;color:#4a4a4c}
  .m-stat{display:flex;gap:8px}
  .m-stat div{flex:1;background:var(--card);border-radius:12px;padding:13px}
  .m-stat span{display:block;font-size:11px;color:var(--mut);font-weight:600;margin-bottom:4px}
  .m-stat b{font-size:16px;font-weight:700;letter-spacing:-.3px}
  .m-set label{display:block;font-size:12.5px;color:var(--mut);font-weight:600;margin:14px 0 6px}
  .m-set input{width:100%;border:1px solid var(--line);border-radius:11px;padding:12px;font:inherit;font-size:15px;background:#fff;outline:0}
  .m-act{all:unset;cursor:pointer;display:block;text-align:center;width:100%;margin-top:12px;padding:14px;border-radius:12px;background:var(--ink);color:#fff;font-size:15px;font-weight:600}
  .m-act.ghost{background:#eceae4;color:var(--ink)}
  .m-act.danger{background:#f6e3e1;color:#a53a2c}
  .m-status{font-size:12.5px;color:var(--mut);margin-top:10px;text-align:center}
  @keyframes mup{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes mfade{from{opacity:0}to{opacity:1}}
  @media (prefers-reduced-motion:reduce){.m-sheet,.m-back{animation:none}}
  `;

  const today = () => S.todayKey();
  let M = null;

  function init() {
    const t = S.parseKey(today());
    M = { tab: 'ajanda', view: 'month', y: t.y, m: t.m, sheet: null, dayKey: null, draft: null, weekOpen: false, plYear: false, pickY: t.y };
  }

  /* ---------- yardımcılar ---------- */
  function monthEvents(y, m) {
    const p = S.pad(m + 1);
    return S.data.events.filter(e => e.date.slice(0, 7) === y + '-' + p);
  }
  function yearEvents(y) { return S.data.events.filter(e => e.date.slice(0, 4) === String(y)); }
  function timeLabel(e) { return e.time ? e.time : 'Tüm gün'; }
  function dateLabel(k) {
    const p = S.parseKey(k);
    if (k === today()) return 'Bugün';
    return p.d + ' ' + S.MONTHS_SHORT[p.m] + ' ' + S.WD_SHORT[S.weekday(k)];
  }

  /* ---------- ay ızgarası ---------- */
  function monthGrid(y, m) {
    const first = (new Date(y, m, 1).getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const total = Math.ceil((first + dim) / 7) * 7;
    const byDate = S.eventsByDate();
    const tk = today();
    let html = '<div class="m-wd">' + S.WD_MINI.map((w, i) => '<span>' + S.WD_SHORT[i] + '</span>').join('') + '</div>';
    for (let w = 0; w < total / 7; w++) {
      let cells = '', isNow = false;
      for (let i = 0; i < 7; i++) {
        const n = w * 7 + i - first + 1;
        if (n < 1 || n > dim) { cells += '<span class="m-cell"></span>'; continue; }
        const k = S.dkey(y, m, n);
        if (k === tk) isNow = true;
        const evs = byDate[k] || [];
        const col = evs.length ? S.cat(evs[0].cat).color : '';
        const cls = 'm-num' + (evs.length ? ' ev' : '') + (k === tk ? ' today' : '');
        const style = evs.length ? ' style="background:' + col + '"' : '';
        const dot = evs.length > 1 ? '<span class="m-dot" style="background:' + S.cat(evs[1].cat).color + '"></span>' : '<span class="m-dot"></span>';
        cells += '<button class="m-cell" onclick="MB.day(\'' + k + '\')"><span class="' + cls + '"' + style + '>' + n + '</span>' + dot + '</button>';
      }
      html += '<div class="m-week' + (isNow ? ' now' : '') + '">' + cells + '</div>';
    }
    return html;
  }

  /* ---------- ekranlar ---------- */
  function screenMonth() {
    const evs = monthEvents(M.y, M.m);
    const tk = today();
    let list, secTitle, secBtn;
    if (M.weekOpen) {
      const wd = S.weekday(tk);
      const start = S.shiftKey(tk, -wd), end = S.shiftKey(start, 6);
      list = S.data.events.filter(e => e.date >= start && e.date <= end);
      secTitle = 'Bu hafta'; secBtn = 'Yaklaşanı gör';
    } else {
      list = S.data.events.filter(e => e.date >= tk).slice(0, 200);
      secTitle = 'Yaklaşan'; secBtn = 'Haftayı aç';
    }
    list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : S.byTime(a, b));
    if (!M.weekOpen) list = list.slice(0, 5);

    return `
    <div class="m-eyebrow"><button onclick="MB.sheet('set')">${M.y} · ${evs.length} KAYIT</button></div>
    <div class="m-head">
      <button class="m-title" onclick="MB.sheet('month')">${S.MONTHS[M.m]} <small>▾</small></button>
      <div class="m-ctrls">
        <div class="m-pill"><button onclick="MB.step(-1)">‹</button><button onclick="MB.step(1)">›</button></div>
        <button class="m-btn" onclick="MB.setView('year')">Yıl</button>
        <button class="m-add" onclick="MB.newRec()">+</button>
      </div>
    </div>
    ${monthGrid(M.y, M.m)}
    <div class="m-sec"><h3>${secTitle}</h3><button onclick="MB.toggleWeek()">${secBtn}</button></div>
    <div class="m-list">${list.length ? list.map(rowHtml).join('') : '<div class="m-empty">Kayıt yok. Sağ üstteki + ile ekleyin.</div>'}</div>`;
  }

  function rowHtml(e) {
    const c = S.cat(e.cat);
    const amt = (e.amtType === 'inc' || e.amtType === 'exp')
      ? '<div class="m-amt" style="color:' + (e.amtType === 'inc' ? '#2f6b4f' : '#a53a2c') + '">' + (e.amtType === 'inc' ? '+' : '−') + S.money(e.amt) + '</div>' : '';
    return `<div class="m-row" onclick="MB.day('${e.date}')">
      <span class="m-bar" style="background:${c.color}"></span>
      <div style="flex:1;min-width:0"><h4>${S.esc(e.text || c.name)}</h4>
      <p>${dateLabel(e.date)} · ${timeLabel(e)}</p></div>${amt}</div>`;
  }

  function screenYear() {
    const tp = S.parseKey(today());
    const evs = yearEvents(M.y);
    const byDate = S.eventsByDate();
    const mini = S.MONTHS.map((name, m) => {
      const first = (new Date(M.y, m, 1).getDay() + 6) % 7;
      const dim = new Date(M.y, m + 1, 0).getDate();
      let cells = '';
      for (let i = 0; i < first; i++) cells += '<span class="m-md"></span>';
      let cnt = 0;
      for (let n = 1; n <= dim; n++) {
        const k = S.dkey(M.y, m, n);
        const list = byDate[k] || [];
        if (list.length) cnt++;
        const isT = k === today();
        cells += '<span class="m-md">' + (list.length
          ? '<i class="' + (isT ? 'ring' : '') + '" style="background:' + S.cat(list[0].cat).color + '">' + n + '</i>'
          : (isT ? '<i class="ring" style="background:#16181a">' + n + '</i>' : n)) + '</span>';
      }
      const isNow = (M.y === tp.y && m === tp.m);
      return `<div><h4 class="${isNow ? 'now' : ''}" >${name}${cnt ? '<span>' + cnt + '</span>' : ''}</h4>
        <div class="m-mgrid" onclick="MB.openMonth(${m})">${cells}</div></div>`;
    }).join('');

    return `
    <div class="m-eyebrow"><button onclick="MB.sheet('set')">YIL · ${evs.length} KAYIT</button></div>
    <div class="m-head">
      <button class="m-title" onclick="MB.sheet('month')">${M.y} <small>▾</small></button>
      <div class="m-ctrls">
        <div class="m-pill"><button onclick="MB.stepYear(-1)">‹</button><button onclick="MB.stepYear(1)">›</button></div>
        <button class="m-btn" onclick="MB.goToday()">Bugün</button>
        <button class="m-add" onclick="MB.newRec()">+</button>
      </div>
    </div>
    <div class="m-mini">${mini}</div>`;
  }

  function screenPL() {
    const inRange = e => M.plYear ? e.date.slice(0, 4) === String(M.y) : e.date.slice(0, 7) === M.y + '-' + S.pad(M.m + 1);
    const t = S.totals(inRange);
    const list = S.data.events.filter(e => (e.amtType === 'inc' || e.amtType === 'exp') && inRange(e))
      .sort((a, b) => a.date < b.date ? 1 : -1);
    return `
    <div class="m-eyebrow">${M.plYear ? 'YIL' : S.MONTHS[M.m].toUpperCase()} · ${list.length} HAREKET</div>
    <div class="m-head">
      <button class="m-title" onclick="MB.sheet('month')">${M.plYear ? M.y : S.MONTHS[M.m]} <small>▾</small></button>
      <div class="m-ctrls">
        <div class="m-pill"><button onclick="MB.step(-1)">‹</button><button onclick="MB.step(1)">›</button></div>
        <button class="m-btn" onclick="MB.togglePlYear()" style="${M.plYear ? 'background:#16181a;color:#fff' : ''}">Yıl</button>
        <button class="m-add" onclick="MB.newRec()">+</button>
      </div>
    </div>
    <div class="m-stat">
      <div><span>GELİR</span><b style="color:#2f6b4f">${S.money(t.inc)}</b></div>
      <div><span>GİDER</span><b style="color:#a53a2c">${S.money(t.exp)}</b></div>
      <div><span>NET</span><b style="color:${t.net >= 0 ? '#2f6b4f' : '#a53a2c'}">${S.money(t.net)}</b></div>
    </div>
    <div class="m-sec"><h3>Hareketler</h3></div>
    <div class="m-list">${list.length ? list.map(rowHtml).join('') : '<div class="m-empty">Bu dönemde tutarlı kayıt yok.<br>Kayıt eklerken “Tutar” alanından Gider ya da Gelir seçin.</div>'}</div>`;
  }

  /* ---------- sayfalar (bottom sheet) ---------- */
  function sheetMonth() {
    const tp = S.parseKey(today());
    return sheetWrap('Ay seç', `
      <div class="m-yr"><button onclick="MB.pickYear(-1)">‹</button><b>${M.pickY}</b><button onclick="MB.pickYear(1)">›</button></div>
      <div class="m-mgridsel">${S.MONTHS_SHORT.map((mn, i) => {
      const on = (M.pickY === M.y && i === M.m && M.view === 'month');
      const cur = (M.pickY === tp.y && i === tp.m);
      return `<button class="${on ? 'on' : ''} ${cur ? 'cur' : ''}" onclick="MB.chooseMonth(${i})">${mn}</button>`;
    }).join('')}</div>
      <div class="m-note">Yeşil çerçeveli olan içinde bulunduğun ay.</div>`);
  }

  function sheetDay() {
    const k = M.dayKey, p = S.parseKey(k);
    const list = S.eventsOn(k);
    const rows = list.length ? list.map(e => {
      const c = S.cat(e.cat);
      const amt = (e.amtType === 'inc' || e.amtType === 'exp')
        ? '<div class="m-amt" style="color:' + (e.amtType === 'inc' ? '#2f6b4f' : '#a53a2c') + '">' + (e.amtType === 'inc' ? '+' : '−') + S.money(e.amt) + '</div>' : '';
      return `<div class="m-row" onclick="MB.edit('${e.id}')">
        <span class="m-bar" style="background:${c.color}"></span>
        <div style="flex:1;min-width:0"><h4>${S.esc(e.text || c.name)}</h4><p>${timeLabel(e)} · ${S.esc(c.name)}</p></div>${amt}</div>`;
    }).join('') : '<div class="m-empty">Bu güne kayıt yok.</div>';
    return sheetWrap(p.d + ' ' + S.MONTHS[p.m], `
      <div class="m-note" style="margin:-8px 0 12px;text-align:left">${S.WD_FULL[S.weekday(k)]}${k === today() ? ' · bugün' : ''}</div>
      <div class="m-list">${rows}</div>
      <button class="m-act" onclick="MB.newRec('${k}')">+ Bu güne kayıt ekle</button>`);
  }

  function sheetRecord() {
    const d = M.draft;
    const cats = S.data.cats;
    const sel = S.cat(d.cat);
    const p = S.parseKey(d.date);
    const amtRow = d.amtType === 'none' ? '' : `
      <div class="m-field" style="margin-top:10px">
        <input id="mAmt" type="number" inputmode="decimal" step="0.01" placeholder="Tutar (€)" value="${d.amt || ''}">
      </div>`;
    return sheetWrap(d.id ? 'Kaydı düzenle' : 'Yeni kayıt', `
      <div class="m-field">
        <textarea id="mTitle" rows="1" placeholder="Ne yapacaksın?" oninput="MB.grow(this)">${S.esc(d.text)}</textarea>
        <div class="m-frow">
          <span class="dt">${p.d}. ${S.MONTHS_SHORT[p.m]} ${p.y}</span>
          <input class="m-chip" id="mDate" type="date" value="${d.date}" onchange="MB.field('date',this.value)">
          <input class="m-chip" id="mTime" type="time" value="${d.time || ''}" onchange="MB.field('time',this.value)">
        </div>
      </div>
      <div class="m-lbl">Tutar</div>
      <div class="m-seg">
        <button class="${d.amtType === 'none' ? 'on' : ''}" onclick="MB.field('amtType','none')">Yok</button>
        <button class="${d.amtType === 'exp' ? 'on' : ''}" onclick="MB.field('amtType','exp')">Gider</button>
        <button class="${d.amtType === 'inc' ? 'on' : ''}" onclick="MB.field('amtType','inc')">Gelir</button>
      </div>
      ${amtRow}
      <div class="m-lbl">Renk</div>
      <div class="m-colors">${cats.map(c => `
        <button class="m-col ${c.id === d.cat ? 'on' : ''}" onclick="MB.field('cat','${c.id}')">
          <i style="background:${c.color}"></i><span>${S.esc(c.name)}</span></button>`).join('')}</div>
      <button class="m-save" style="background:${sel.color}" onclick="MB.saveRec()">Kaydet</button>
      ${d.id ? '<button class="m-act danger" onclick="MB.delRec()">Kaydı sil</button>' : ''}
      <div class="m-note">Yıl görünümünde o gün bu renkle işaretlenir.</div>`);
  }

  function sheetSettings() {
    const c = S.cfg();
    const st = S.status;
    return sheetWrap('Ayarlar', `
      <div class="m-set">
        <div style="font-size:13.5px;color:#8b8b90;line-height:1.5">Kayıtlar telefonda saklanır; GitHub üzerinden bilgisayarla eşitlenir.</div>
        <label>GitHub token (yalnızca <b>gist</b> yetkisi)</label>
        <input id="mTok" type="password" autocomplete="off" placeholder="ghp_..." value="${S.escAttr(c.token)}">
        <label>Gist ID</label>
        <input id="mGist" autocomplete="off" placeholder="Bilgisayarda oluşan kimliği yapıştırın" value="${S.escAttr(c.gist)}">
        <button class="m-act" onclick="MB.saveCfg()">Kaydet ve eşitle</button>
        <button class="m-act ghost" onclick="Store.sync()">Şimdi eşitle</button>
        <div class="m-status">${S.esc(st.text)}${c.last ? ' · son: ' + new Date(c.last).toLocaleString('tr-TR') : ''}</div>
        <label style="margin-top:22px">Yedek</label>
        <button class="m-act ghost" onclick="Store.exportJSON()">Yedeği indir</button>
        <label class="m-act ghost" style="display:block">Yedek yükle<input type="file" accept="application/json" onchange="MB.importFile(this)" style="display:none"></label>
      </div>`);
  }

  function sheetWrap(title, body) {
    return `<div class="m-back" onclick="MB.close()"></div>
      <div class="m-sheet"><div class="m-grip"></div>
        <div class="m-shead"><h3>${S.esc(title)}</h3><button onclick="MB.close()">Vazgeç</button></div>
        ${body}</div>`;
  }

  /* ---------- render ---------- */
  function render() {
    let screen;
    if (M.tab === 'pl') screen = screenPL();
    else screen = M.view === 'year' ? screenYear() : screenMonth();

    let sheet = '';
    if (M.sheet === 'month') sheet = sheetMonth();
    else if (M.sheet === 'day') sheet = sheetDay();
    else if (M.sheet === 'rec') sheet = sheetRecord();
    else if (M.sheet === 'set') sheet = sheetSettings();

    document.getElementById('app').innerHTML =
      '<div class="m-app">' + screen + '</div>' +
      '<div class="m-nav">' +
      '<button class="' + (M.tab === 'ajanda' ? 'on' : '') + '" onclick="MB.tab(\'ajanda\')">Ajanda</button>' +
      '<button class="' + (M.tab === 'pl' ? 'on' : '') + '" onclick="MB.tab(\'pl\')">P&amp;L</button>' +
      '</div>' + sheet;

    const ta = document.getElementById('mTitle');
    if (ta) { grow(ta); if (M.focusTitle) { M.focusTitle = false; ta.focus(); } }
  }

  function grow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px'; }

  function syncDraft() {
    if (!M.draft) return;
    const t = document.getElementById('mTitle'); if (t) M.draft.text = t.value;
    const d = document.getElementById('mDate'); if (d && d.value) M.draft.date = d.value;
    const h = document.getElementById('mTime'); if (h) M.draft.time = h.value;
    const a = document.getElementById('mAmt'); if (a) M.draft.amt = Number(a.value) || 0;
  }

  /* ---------- eylemler ---------- */
  const MB = {
    tab(t) { M.tab = t; M.sheet = null; render(); },
    setView(v) { M.view = v; render(); },
    step(n) {
      let m = M.m + n, y = M.y;
      if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
      M.m = m; M.y = y; M.pickY = y; render();
    },
    stepYear(n) { M.y += n; M.pickY = M.y; render(); },
    goToday() { const t = S.parseKey(today()); M.y = t.y; M.m = t.m; M.pickY = t.y; M.view = 'month'; render(); },
    openMonth(m) { M.m = m; M.view = 'month'; render(); },
    toggleWeek() { M.weekOpen = !M.weekOpen; render(); },
    togglePlYear() { M.plYear = !M.plYear; render(); },
    sheet(s) { M.pickY = M.y; M.sheet = s; render(); },
    close() { M.sheet = null; M.draft = null; render(); },
    pickYear(n) { M.pickY += n; render(); },
    chooseMonth(i) { M.m = i; M.y = M.pickY; M.view = 'month'; M.sheet = null; render(); },
    day(k) { M.dayKey = k; M.sheet = 'day'; render(); },
    newRec(k) {
      M.draft = { id: null, date: k || M.dayKey || today(), time: '10:00', text: '', cat: 'mavi', amtType: 'none', amt: 0 };
      M.sheet = 'rec'; M.focusTitle = true; render();
    },
    edit(id) {
      const e = S.data.events.filter(x => x.id === id)[0]; if (!e) return;
      M.draft = Object.assign({}, e); M.sheet = 'rec'; render();
    },
    field(k, v) { syncDraft(); M.draft[k] = v; render(); },
    grow(el) { grow(el); },
    saveRec() {
      syncDraft();
      const d = M.draft;
      const payload = { date: d.date, time: d.time, text: (d.text || '').trim(), cat: d.cat, amtType: d.amtType, amt: d.amtType === 'none' ? 0 : (Number(d.amt) || 0) };
      if (!payload.text) payload.text = S.cat(d.cat).name;
      if (d.id) S.updateEvent(d.id, payload); else S.addEvent(payload);
      const p = S.parseKey(payload.date); M.y = p.y; M.m = p.m;
      M.sheet = null; M.draft = null; render();
    },
    delRec() {
      if (!M.draft || !M.draft.id) return;
      if (!confirm('Bu kayıt silinsin mi?')) return;
      S.deleteEvent(M.draft.id); M.sheet = null; M.draft = null; render();
    },
    saveCfg() {
      const t = document.getElementById('mTok').value.trim();
      const g = document.getElementById('mGist').value.trim();
      S.setCfg({ token: t, gist: g });
      S.sync();
    },
    importFile(input) {
      const f = input.files && input.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { const n = S.importJSON(r.result); alert(n + ' kayıt yüklendi.'); render(); }
        catch (e) { alert('Yedek okunamadı: ' + e.message); }
      };
      r.readAsText(f); input.value = '';
    }
  };

  function mount() {
    if (!document.getElementById('mobile-css')) {
      const s = document.createElement('style'); s.id = 'mobile-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!M) init();
    window.MB = MB;
    render();
  }

  return { mount: mount, render: () => { if (M) render(); } };
})();
