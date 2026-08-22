"use strict";
/* ===========================================================
   mobile.js — telefon görünümü
   Tasarım: kullanıcının "Ajanda · P&L" prototipinden birebir
   (yıl ↔ ay ↔ hafta zoom, aynı tipografi, renk ve bileşenler).
   Veri: store.js (bilgisayarla ortak).
   =========================================================== */
var MobileView = (function () {
  const S = Store;
  const MONTHS = S.MONTHS, SHORT = S.MONTHS_SHORT, DOW = S.WD_SHORT;
  const INK = '#1b1a18', GREEN = '#2f7a5b', RUST = '#b4622f';

  /* ---------------- stil ---------------- */
  const CSS = `
body[data-ui="mobile"]{margin:0;background:#eceae5;display:flex;align-items:center;justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI","Helvetica Neue",sans-serif;
  color:#1b1a18;-webkit-font-smoothing:antialiased;overscroll-behavior:none}
body[data-ui="mobile"] #app{
  --ink:#1b1a18; --paper:#f6f5f2; --card:#fff; --green:#2f7a5b; --rust:#b4622f;
  --m1:rgba(27,26,24,.06); --m2:rgba(27,26,24,.08); --m3:rgba(27,26,24,.3);
  --m4:rgba(27,26,24,.42); --m5:rgba(27,26,24,.45); --m6:rgba(27,26,24,.6);
  --safeT:env(safe-area-inset-top,0px); --safeB:env(safe-area-inset-bottom,0px);
  position:relative;width:100%;max-width:440px;height:100vh;height:100dvh;
  background:var(--paper);display:flex;flex-direction:column;overflow:hidden}
@media(min-width:520px) and (min-height:800px){
  body[data-ui="mobile"] #app{height:calc(100vh - 40px);max-height:900px;border-radius:34px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
}
.mob *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.mob button{font:inherit;color:inherit;border:0;background:none;padding:0;cursor:pointer}
.mob input,.mob select,.mob textarea{font-family:inherit}
.mob .tnum{font-variant-numeric:tabular-nums}

.mob .hdr{padding:calc(20px + var(--safeT)) 20px 8px;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex:none}
.mob .kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--m4);font-weight:600;display:flex;align-items:center;gap:6px}
.mob .kicker i{width:6px;height:6px;border-radius:999px;display:block}
.mob .title{font-size:30px;font-weight:700;letter-spacing:-.02em;margin-top:3px;line-height:1.05;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;max-width:100%}
.mob .title.sm{font-size:23px}
.mob .title .chev{font-size:15px;font-weight:700;color:var(--m3);transform:translateY(1px)}
.mob button.title:active{opacity:.55}
.mob .hbtns{display:flex;gap:8px;align-items:center;flex:none}
.mob .pill{padding:0 14px;height:38px;display:flex;align-items:center;border-radius:999px;background:var(--m1);font-size:13px;font-weight:600;color:var(--m6);white-space:nowrap}
.mob .pill:active{background:var(--m2)}
.mob .fab{width:38px;height:38px;border-radius:999px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(47,122,91,.32);transition:transform .12s}
.mob .fab:active{transform:scale(.9)}
.mob .fab svg{width:19px;height:19px}
.mob .nav{display:flex;align-items:center;background:var(--m1);border-radius:999px;padding:3px;gap:1px}
.mob .nav button{width:32px;height:32px;border-radius:999px;color:var(--m6);display:flex;align-items:center;justify-content:center;transition:background .12s}
.mob .nav button:active{background:rgba(27,26,24,.1)}
.mob .nav svg{width:15px;height:15px}

.mob .scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px calc(84px + var(--safeB))}
@keyframes mzin{from{transform:scale(.945);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes mzout{from{transform:scale(1.06);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes msheetup{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes mfadein{from{opacity:0}to{opacity:1}}
.mob .zin{animation:mzin .34s cubic-bezier(.2,.8,.2,1)}
.mob .zout{animation:mzout .36s cubic-bezier(.2,.8,.2,1)}
@media(prefers-reduced-motion:reduce){.mob .zin,.mob .zout{animation:none}}

.mob .year{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 12px;min-height:100%;align-content:space-between}
.mob .ymo{cursor:pointer}
.mob .ymo-h{display:flex;align-items:baseline;gap:5px;margin-bottom:5px}
.mob .ymo-n{font-size:13px;font-weight:700;letter-spacing:-.01em}
.mob .ymo-c{font-size:9px;font-weight:600;color:var(--m3)}
.mob .ycells{display:grid;grid-template-columns:repeat(7,1fr);gap:1.5px}
.mob .ycell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:8.5px;border-radius:999px}

.mob .dows{display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:6px}
.mob .dows div{text-align:center;font-size:10px;font-weight:600;color:rgba(27,26,24,.35)}
.mob .mrows{display:flex;flex-direction:column;gap:2px}
.mob .mrow{display:grid;grid-template-columns:repeat(7,1fr);border-radius:14px;padding:4px 2px;cursor:pointer}
.mob .mcell{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0}
.mob .mnum{width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:14px}
.mob .mdots{height:4px;display:flex;gap:2px}
.mob .mdot{width:4px;height:4px;border-radius:999px}

.mob .wrap{display:flex;flex-direction:column;gap:14px;min-height:100%}
.mob .wday{flex:1 0 auto;display:flex;gap:14px}
.mob .wleft{width:46px;flex:none;text-align:center;padding-top:2px}
.mob .wdow{font-size:10px;font-weight:600;color:rgba(27,26,24,.38);text-transform:uppercase;letter-spacing:.06em}
.mob .wnum{margin:3px auto 0;width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700}
.mob .wright{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding-bottom:12px;border-bottom:1px solid rgba(27,26,24,.07)}
.mob .ev{display:flex;align-items:center;gap:10px;padding:11px 13px;background:var(--card);border-radius:14px;text-align:left;width:100%}
.mob .ev:active{background:#f0efec}
.mob .ev-c{width:7px;height:7px;border-radius:999px;flex:none}
.mob .ev-t{font-size:11.5px;font-weight:700;color:var(--m6);width:38px;flex:none}
.mob .ev-n{flex:1;min-width:0;font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mob .ev-a{font-size:12.5px;font-weight:600}
.mob .addline{font-size:12.5px;color:rgba(27,26,24,.32);padding:8px 2px;text-align:left}

.mob .sechd{margin-top:22px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.mob .sechd .t{font-size:13px;font-weight:700;letter-spacing:-.01em}
.mob .sechd .a{font-size:12px;font-weight:600;color:var(--green)}
.mob .prev{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.mob .pcard{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.05);text-align:left;width:100%}
.mob .pbar{width:3px;height:26px;border-radius:2px;flex:none}
.mob .pttl{font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mob .pwhen{font-size:11.5px;color:var(--m5);margin-top:1px}
.mob .empty{padding:26px 4px;text-align:center;font-size:13px;color:var(--m5);line-height:1.5}

.mob .hero{background:var(--ink);color:var(--paper);border-radius:24px;padding:20px 20px 18px}
.mob .hero-l{font-size:11.5px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(246,245,242,.5)}
.mob .hero-big{font-size:32px;font-weight:700;letter-spacing:-.03em;margin-top:6px}
.mob .hero-g{display:flex;gap:10px;margin-top:18px}
.mob .hero-g>div{flex:1;background:rgba(246,245,242,.08);border-radius:14px;padding:11px 13px}
.mob .hero-g .k{font-size:11px;color:rgba(246,245,242,.5);font-weight:600}
.mob .hero-g .v{font-size:16px;font-weight:700;margin-top:2px}
.mob .list{margin-top:10px;background:var(--card);border-radius:20px;box-shadow:0 1px 2px rgba(0,0,0,.05);overflow:hidden}
.mob .li{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid rgba(27,26,24,.06);width:100%;text-align:left}
.mob .li:last-child{border-bottom:0}
.mob .li:active{background:#faf9f7}
.mob .li-d{width:30px;height:30px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
.mob .li-n{font-size:14px;font-weight:600;letter-spacing:-.01em}
.mob .li-s{font-size:11.5px;color:var(--m5);margin-top:1px}
.mob .li-a{font-size:14px;font-weight:600}
.mob .ghost{margin-top:16px;padding:15px;border-radius:18px;background:var(--m1);text-align:center;font-size:14px;font-weight:600;color:var(--m6);width:100%;display:block}
.mob .ghost:active{background:var(--m2)}

.mob .tabs{position:absolute;left:0;right:0;bottom:0;padding:8px 16px calc(14px + var(--safeB));background:rgba(246,245,242,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(27,26,24,.07);display:flex;gap:8px;z-index:30}
.mob .tab{flex:1;padding:11px;border-radius:16px;text-align:center;font-size:12.5px;font-weight:700;color:var(--m5)}
.mob .tab.on{background:var(--ink);color:var(--paper)}

.mob .hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(84px + var(--safeB));padding:7px 14px;border-radius:999px;background:rgba(27,26,24,.78);color:var(--paper);font-size:11px;font-weight:600;transition:opacity .4s;pointer-events:none;white-space:nowrap;z-index:20;opacity:0}
.mob .toast{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(84px + var(--safeB));padding:9px 16px;border-radius:999px;background:var(--ink);color:var(--paper);font-size:12.5px;font-weight:600;z-index:60;white-space:nowrap;animation:mfadein .2s;pointer-events:none}

.mob .scrim{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(27,26,24,.28);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.mob .sheet{background:var(--paper);border-radius:28px 28px 0 0;padding:10px 20px calc(28px + var(--safeB));animation:msheetup .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 -8px 30px rgba(0,0,0,.14);max-height:92%;overflow-y:auto}
.mob .grab{width:38px;height:5px;border-radius:999px;background:rgba(27,26,24,.18);margin:0 auto 14px}
.mob .sh-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.mob .sh-t{font-size:17px;font-weight:700;letter-spacing:-.02em}
.mob .sh-x{font-size:13px;font-weight:600;color:var(--m5)}
.mob .field{margin-top:14px;background:var(--card);border-radius:18px;padding:2px 16px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .field .div{height:1px;background:var(--m2)}
.mob .inp{width:100%;border:0;background:transparent;padding:14px 0;font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--ink);outline:none}
.mob .frow{display:flex;align-items:center;gap:10px;padding:11px 0}
.mob .flab{font-size:14px;font-weight:600;color:var(--m5);flex:1;min-width:0}
.mob .mini{width:86px;text-align:center;border:0;border-radius:10px;background:var(--m1);padding:9px 4px;font-size:15px;font-weight:600;color:var(--ink);outline:none}
.mob .lab{margin-top:18px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--m4)}
.mob .seg{margin-top:10px;display:flex;gap:6px;background:var(--m1);padding:4px;border-radius:14px}
.mob .seg button{flex:1;padding:9px;border-radius:11px;font-size:12.5px;font-weight:700;color:var(--m5)}
.mob .seg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.mob .pal{margin-top:10px;display:grid;grid-template-columns:repeat(6,1fr);gap:12px 10px}
.mob .pal button{display:flex;flex-direction:column;align-items:center;gap:6px}
.mob .pal .sw{width:100%;aspect-ratio:1;border-radius:999px}
.mob .pal .nm{font-size:9.5px;font-weight:600;white-space:nowrap;color:var(--m5)}
.mob .pal button.on .nm{color:var(--ink)}
.mob .pick{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mob .pick button{padding:14px 4px;border-radius:14px;background:var(--card);font-size:14px;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .pick button.on{background:var(--ink);color:var(--paper)}
.mob .pick button.now{box-shadow:inset 0 0 0 1.5px var(--green)}
.mob .yhead{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:14px}
.mob .yhead .y{font-size:20px;font-weight:700;min-width:74px;text-align:center}
.mob .yhead button{width:34px;height:34px;border-radius:999px;background:var(--m1);display:flex;align-items:center;justify-content:center;color:var(--m6)}
.mob .yhead svg{width:15px;height:15px}
.mob .save{margin-top:22px;padding:16px;border-radius:18px;text-align:center;font-size:15px;font-weight:700;color:var(--ink);width:100%}
.mob .del{margin-top:9px;padding:13px;border-radius:16px;text-align:center;font-size:13px;font-weight:600;color:var(--rust);width:100%;background:rgba(180,98,47,.09)}
.mob .note{margin-top:9px;text-align:center;font-size:11.5px;color:var(--m4);font-weight:500;line-height:1.45}
`;

  const SVG = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
  };

  /* ---------------- tarih yardımcıları ---------------- */
  const pad = S.pad;
  const iso = (y, m, d) => S.dkey(y, m, d);
  const parseISO = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const dkey = dt => iso(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const dowMon = dt => (dt.getDay() + 6) % 7;
  const firstDow = (y, m) => dowMon(new Date(y, m, 1));
  const addDays = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = dt => addDays(dt, -dowMon(dt));
  const sameDay = (a, b) => dkey(a) === dkey(b);
  const TODAY = new Date();
  const esc = S.esc;
  const fmt = S.money;

  /* ---------------- veri köprüsü ---------------- */
  function dayEvents(y, m, d) {
    return S.eventsOn(iso(y, m, d)).map(e => Object.assign({}, e, { color: S.cat(e.cat).color }));
  }
  function monthCount(y, m) {
    const p = y + '-' + pad(m + 1);
    return S.data.events.filter(e => e.date.slice(0, 7) === p).length;
  }
  function yearCount(y) { return S.data.events.filter(e => e.date.slice(0, 4) === String(y)).length; }
  function firstColor(y, m, d) { const e = dayEvents(y, m, d); return e.length ? e[0].color : null; }
  const amountColor = e => (!e.amt || e.amtType === 'none') ? GREEN : (e.amtType === 'inc' ? GREEN : RUST);
  const amountLabel = e => (!e.amt || e.amtType === 'none') ? '' : (e.amtType === 'inc' ? '+' : '') + fmt(e.amt);

  /* ---------------- görünüm durumu ---------------- */
  let V = null;
  function loadUI() {
    let ui = { tab: 'ajanda', level: 'ay' };
    try { const raw = localStorage.getItem('ajanda_ui_mob'); if (raw) ui = Object.assign(ui, JSON.parse(raw)); } catch (e) { }
    return ui;
  }
  function saveUI() { try { localStorage.setItem('ajanda_ui_mob', JSON.stringify({ tab: V.tab, level: V.level })); } catch (e) { } }

  function initState() {
    const ui = loadUI();
    V = {
      tab: ui.tab, level: ui.level,
      y: TODAY.getFullYear(), m: TODAY.getMonth(), week: startOfWeek(TODAY),
      pnlY: TODAY.getFullYear(), pnlM: TODAY.getMonth(), anim: 'zin'
    };
  }

  /* ---------------- kabuk ---------------- */
  const $ = id => document.getElementById(id);
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; }

  function buildShell() {
    const app = $('app');
    app.className = 'mob';
    app.innerHTML = `
      <div class="hdr">
        <div style="min-width:0">
          <div class="kicker" id="mKicker"></div>
          <button class="title" id="mTitle"></button>
        </div>
        <div class="hbtns">
          <div class="nav" id="mNav"></div>
          <button class="pill" id="mZoom"></button>
          <button class="fab" id="mAdd" aria-label="Yeni kayıt">${SVG.plus}</button>
        </div>
      </div>
      <div class="scroll" id="mScroll"></div>
      <div class="hint" id="mHint"></div>
      <div class="tabs">
        <button class="tab" id="mTabA">Ajanda</button>
        <button class="tab" id="mTabP">P&amp;L</button>
      </div>
      <div id="mSheetHost"></div>
      <div id="mToastHost"></div>`;
    $('mTabA').onclick = () => { V.tab = 'ajanda'; render(); };
    $('mTabP').onclick = () => { V.tab = 'pnl'; render(); };
    $('mKicker').onclick = openSettings;
    bindGestures();
  }

  function setTitle(text, onTap) {
    const el = $('mTitle');
    el.innerHTML = esc(text) + (onTap ? '<span class="chev">▾</span>' : '');
    el.onclick = onTap || null;
    el.style.cursor = onTap ? 'pointer' : 'default';
  }
  function navPair(fn) {
    $('mNav').innerHTML = `<button aria-label="Önceki">${SVG.left}</button><button aria-label="Sonraki">${SVG.right}</button>`;
    const b = $('mNav').querySelectorAll('button');
    b[0].onclick = () => fn(-1); b[1].onclick = () => fn(1);
    $('mNav').style.display = 'flex';
  }
  function setKicker(text) {
    const st = S.status;
    const dot = st.kind === 'err' ? RUST : (st.kind === 'sync' ? 'rgba(27,26,24,.3)' : '');
    $('mKicker').innerHTML = (dot ? `<i style="background:${dot}"></i>` : '') + esc(text);
  }

  /* ---------------- render ---------------- */
  function render() {
    if (!V) initState();
    if (!$('mScroll')) buildShell();
    saveUI();
    const isA = V.tab === 'ajanda';
    $('mTabA').className = 'tab' + (isA ? ' on' : '');
    $('mTabP').className = 'tab' + (isA ? '' : ' on');
    isA ? renderAjanda() : renderPnl();
  }

  function renderAjanda() {
    const zl = { yil: 'Bugün', ay: 'Yıl', hafta: 'Ay' }[V.level];
    $('mZoom').textContent = zl;
    $('mZoom').style.display = '';
    $('mZoom').onclick = () => {
      if (V.level === 'hafta') { V.m = V.week.getMonth(); V.y = V.week.getFullYear(); go('ay', 'zout'); }
      else if (V.level === 'ay') go('yil', 'zout');
      else { V.y = TODAY.getFullYear(); V.m = TODAY.getMonth(); V.week = startOfWeek(TODAY); go('hafta', 'zin'); }
    };
    $('mAdd').onclick = () => openSheet(null, defaultDate());

    const wEnd = addDays(V.week, 6);
    const sameM = V.week.getMonth() === wEnd.getMonth();
    const weekLabel = sameM
      ? `${V.week.getDate()} – ${wEnd.getDate()} ${MONTHS[V.week.getMonth()]}`
      : `${V.week.getDate()} ${SHORT[V.week.getMonth()]} – ${wEnd.getDate()} ${SHORT[wEnd.getMonth()]}`;

    if (V.level === 'yil') setTitle(String(V.y), openYearPick);
    else if (V.level === 'ay') setTitle(MONTHS[V.m], () => openMonthPick('ajanda'));
    else setTitle(weekLabel, null);
    $('mTitle').classList.toggle('sm', V.level === 'hafta');
    setKicker({
      yil: `Yıl · ${yearCount(V.y)} kayıt`,
      ay: `${V.y} · ${monthCount(V.y, V.m)} kayıt`,
      hafta: `${V.week.getFullYear()} · ${weekNo(V.week)}. hafta`
    }[V.level]);

    navPair(step);
    const sc = $('mScroll');
    sc.innerHTML = '';
    if (V.level === 'yil') sc.appendChild(viewYear());
    else if (V.level === 'ay') sc.appendChild(viewMonth());
    else sc.appendChild(viewWeek());
    sc.scrollTop = 0;
    showHint(V.level === 'yil' ? 'Aya dokun · aşağı kaydır → ay' : 'Yukarı kaydır → uzaklaş');
  }

  function weekNo(dt) {
    const t = new Date(dt.getFullYear(), 0, 1);
    return Math.floor((startOfWeek(dt) - startOfWeek(t)) / 604800000) + 1;
  }
  function step(n) {
    if (V.tab === 'pnl') { const d = new Date(V.pnlY, V.pnlM + n, 1); V.pnlY = d.getFullYear(); V.pnlM = d.getMonth(); render(); return; }
    if (V.level === 'yil') V.y += n;
    else if (V.level === 'ay') { const d = new Date(V.y, V.m + n, 1); V.y = d.getFullYear(); V.m = d.getMonth(); }
    else V.week = addDays(V.week, 7 * n);
    V.anim = 'zin'; render();
  }
  function go(level, anim) { V.level = level; V.anim = anim || 'zin'; render(); }
  function defaultDate() {
    if (V.tab === 'pnl') return (V.pnlY === TODAY.getFullYear() && V.pnlM === TODAY.getMonth()) ? dkey(TODAY) : iso(V.pnlY, V.pnlM, 1);
    if (V.level === 'hafta') return dkey(V.week <= TODAY && TODAY <= addDays(V.week, 6) ? TODAY : V.week);
    if (V.level === 'ay') return (V.y === TODAY.getFullYear() && V.m === TODAY.getMonth()) ? dkey(TODAY) : iso(V.y, V.m, 1);
    return dkey(TODAY);
  }

  /* ---------------- yıl ---------------- */
  function viewYear() {
    const wrap = document.createElement('div');
    wrap.className = 'year ' + V.anim;
    for (let m = 0; m < 12; m++) {
      const isCur = V.y === TODAY.getFullYear() && m === TODAY.getMonth();
      const el = document.createElement('div'); el.className = 'ymo';
      let cells = '';
      for (let i = 0; i < firstDow(V.y, m); i++) cells += '<div class="ycell"></div>';
      for (let d = 1; d <= daysIn(V.y, m); d++) {
        const today = isCur && d === TODAY.getDate();
        const c = firstColor(V.y, m, d);
        const color = c ? '#fff' : (today ? '#f6f5f2' : 'rgba(27,26,24,.42)');
        const bg = c ? c : (today ? INK : 'transparent');
        const w = (c || today) ? 700 : 400;
        const ring = (today && c) ? 'box-shadow:inset 0 0 0 1.5px ' + INK + ';' : '';
        cells += `<div class="ycell" style="color:${color};background:${bg};font-weight:${w};${ring}">${d}</div>`;
      }
      el.innerHTML = `<div class="ymo-h">
          <div class="ymo-n" style="color:${isCur ? GREEN : INK}">${MONTHS[m]}</div>
          <div class="ymo-c">${monthCount(V.y, m) || ''}</div>
        </div><div class="ycells">${cells}</div>`;
      el.onclick = () => { V.m = m; go('ay', 'zin'); };
      wrap.appendChild(el);
    }
    return wrap;
  }

  /* ---------------- ay ---------------- */
  function viewMonth() {
    const frag = document.createDocumentFragment();
    const box = document.createElement('div'); box.className = V.anim;
    box.innerHTML = `<div class="dows">${DOW.map(d => `<div>${d}</div>`).join('')}</div><div class="mrows"></div>`;
    const rows = box.querySelector('.mrows');
    const isCur = V.y === TODAY.getFullYear() && V.m === TODAY.getMonth();
    let cells = [];
    for (let i = 0; i < firstDow(V.y, V.m); i++) cells.push(null);
    for (let d = 1; d <= daysIn(V.y, V.m); d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    for (let r = 0; r < cells.length / 7; r++) {
      const slice = cells.slice(r * 7, r * 7 + 7);
      const hasToday = isCur && slice.indexOf(TODAY.getDate()) >= 0;
      const row = document.createElement('div');
      row.className = 'mrow';
      row.style.background = hasToday ? 'rgba(47,122,91,.08)' : 'transparent';
      row.innerHTML = slice.map(d => {
        if (!d) return '<div class="mcell"></div>';
        const today = isCur && d === TODAY.getDate();
        const evs = dayEvents(V.y, V.m, d);
        const c = evs.length ? evs[0].color : null;
        const color = c ? '#fff' : (today ? '#f6f5f2' : 'rgba(27,26,24,.85)');
        const bg = c ? c : (today ? GREEN : 'transparent');
        const w = (c || today) ? 700 : 500;
        const ring = (today && c) ? `box-shadow:inset 0 0 0 2px ${GREEN};` : '';
        const dots = evs.slice(1, 4).map(e => `<div class="mdot" style="background:${e.color}"></div>`).join('');
        return `<div class="mcell">
          <div class="mnum" style="color:${color};background:${bg};font-weight:${w};${ring}">${d}</div>
          <div class="mdots">${dots}</div></div>`;
      }).join('');
      const firstDay = slice.filter(x => x)[0];
      row.onclick = () => { V.week = startOfWeek(new Date(V.y, V.m, firstDay)); go('hafta', 'zin'); };
      rows.appendChild(row);
    }
    frag.appendChild(box);

    const up = upcoming(8);
    const hd = h(`<div class="sechd"><div class="t">Yaklaşan</div><button class="a">Haftayı aç</button></div>`);
    hd.querySelector('.a').onclick = () => { V.week = startOfWeek(TODAY); go('hafta', 'zin'); };
    frag.appendChild(hd);
    const list = document.createElement('div'); list.className = 'prev';
    if (!up.length) {
      list.innerHTML = '<div class="empty">Önümüzdeki 30 günde kayıt yok.<br>Sağ üstteki + ile ekle.</div>';
    } else {
      up.forEach(e => {
        const dt = parseISO(e.date);
        const when = (sameDay(dt, TODAY) ? 'Bugün' : sameDay(dt, addDays(TODAY, 1)) ? 'Yarın' : `${dt.getDate()} ${SHORT[dt.getMonth()]} ${DOW[dowMon(dt)]}`) + (e.time ? ' · ' + e.time : '');
        const b = document.createElement('button'); b.className = 'pcard';
        b.innerHTML = `<div class="pbar" style="background:${e.color}"></div>
          <div style="flex:1;min-width:0"><div class="pttl">${esc(e.text)}</div><div class="pwhen">${when}</div></div>
          <div class="tnum" style="font-size:13px;font-weight:600;color:${amountColor(e)}">${amountLabel(e)}</div>`;
        b.onclick = () => openSheet(e, e.date);
        list.appendChild(b);
      });
    }
    frag.appendChild(list);
    return frag;
  }
  function upcoming(limit) {
    const out = [];
    for (let i = 0; i < 31 && out.length < limit; i++) {
      const dt = addDays(TODAY, i);
      dayEvents(dt.getFullYear(), dt.getMonth(), dt.getDate()).forEach(e => out.push(e));
    }
    return out.slice(0, limit);
  }

  /* ---------------- hafta ---------------- */
  function viewWeek() {
    const wrap = document.createElement('div');
    wrap.className = 'wrap ' + V.anim;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(V.week, i);
      const evs = dayEvents(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const today = sameDay(dt, TODAY);
      const day = document.createElement('div'); day.className = 'wday';
      day.innerHTML = `<div class="wleft">
          <div class="wdow">${DOW[i]}</div>
          <div class="wnum" style="color:${today ? '#f6f5f2' : INK};background:${today ? GREEN : 'transparent'}">${dt.getDate()}</div>
        </div><div class="wright"></div>`;
      const right = day.querySelector('.wright');
      evs.forEach(e => {
        const b = document.createElement('button'); b.className = 'ev';
        b.innerHTML = `<div class="ev-c" style="background:${e.color}"></div>
          <div class="ev-t tnum">${esc(e.time || '—')}</div>
          <div class="ev-n">${esc(e.text)}</div>
          <div class="ev-a tnum" style="color:${amountColor(e)}">${amountLabel(e)}</div>`;
        b.onclick = () => openSheet(e, e.date);
        right.appendChild(b);
      });
      const add = document.createElement('button'); add.className = 'addline';
      add.textContent = '+ ekle';
      add.onclick = () => openSheet(null, dkey(dt));
      right.appendChild(add);
      wrap.appendChild(day);
    }
    return wrap;
  }

  /* ---------------- P&L ---------------- */
  function renderPnl() {
    const y = V.pnlY, m = V.pnlM;
    const inMonth = e => e.date.slice(0, 7) === y + '-' + pad(m + 1);
    const t = S.totals(inMonth);
    const yt = S.totals(e => e.date.slice(0, 4) === String(y));
    const list = S.data.events.filter(e => (e.amtType === 'inc' || e.amtType === 'exp') && inMonth(e))
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

    setTitle(MONTHS[m], () => openMonthPick('pnl'));
    $('mTitle').classList.remove('sm');
    setKicker(`${y} · ${list.length} hareket`);
    $('mZoom').style.display = 'none';
    navPair(step);
    $('mAdd').onclick = () => openSheet(null, defaultDate(), 'exp');

    const sc = $('mScroll');
    sc.innerHTML = '';
    const box = document.createElement('div'); box.className = 'zin';
    box.innerHTML = `
      <div class="hero">
        <div class="hero-l">${MONTHS[m]} · net</div>
        <div class="hero-big tnum">${fmt(t.net)}</div>
        <div class="hero-g">
          <div><div class="k">Gelir</div><div class="v tnum">${fmt(t.inc)}</div></div>
          <div><div class="k">Gider</div><div class="v tnum">${fmt(t.exp)}</div></div>
        </div>
      </div>
      <div class="sechd"><div class="t">Hareketler</div><div class="a">${y} net · ${fmt(yt.net)}</div></div>`;
    sc.appendChild(box);

    if (!list.length) {
      sc.appendChild(h('<div class="empty">Bu ayda tutarlı kayıt yok.<br>Kayıt eklerken “Tutar” alanından Gider ya da Gelir seç.</div>'));
    } else {
      const ul = document.createElement('div'); ul.className = 'list';
      list.forEach(e => {
        const c = S.cat(e.cat).color;
        const dt = parseISO(e.date);
        const b = document.createElement('button'); b.className = 'li';
        b.innerHTML = `<div class="li-d" style="background:${c}">${dt.getDate()}</div>
          <div style="flex:1;min-width:0"><div class="li-n">${esc(e.text)}</div>
          <div class="li-s">${SHORT[dt.getMonth()]} · ${esc(e.time || '—')}</div></div>
          <div class="li-a tnum" style="color:${amountColor(e)}">${amountLabel(e)}</div>`;
        b.onclick = () => openSheet(Object.assign({}, e, { color: c }), e.date);
        ul.appendChild(b);
      });
      sc.appendChild(ul);
    }
    const g = document.createElement('button'); g.className = 'ghost';
    g.textContent = 'Ayarlar ve eşitleme';
    g.onclick = openSettings;
    sc.appendChild(g);
    sc.scrollTop = 0;
    hideHint();
  }

  /* ---------------- sheet altyapısı ---------------- */
  let sheetOpen = false;
  function closeSheet() { $('mSheetHost').innerHTML = ''; sheetOpen = false; }
  function sheet(inner) {
    sheetOpen = true;
    const host = $('mSheetHost');
    host.innerHTML = '';
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const sp = document.createElement('div'); sp.style.flex = '1'; sp.onclick = closeSheet;
    const s = document.createElement('div'); s.className = 'sheet';
    s.appendChild(inner);
    scrim.appendChild(sp); scrim.appendChild(s);
    host.appendChild(scrim);
    return s;
  }
  let toastT = null;
  function toast(msg) {
    const host = $('mToastHost');
    host.innerHTML = `<div class="toast">${esc(msg)}</div>`;
    clearTimeout(toastT);
    toastT = setTimeout(() => host.innerHTML = '', 1900);
  }
  let hintT = null, hintSeen = +(localStorage.getItem('ajanda_hint') || 0);
  function showHint(txt) {
    if (hintSeen > 3) { hideHint(); return; }
    const el = $('mHint'); el.textContent = txt; el.style.opacity = '1';
    clearTimeout(hintT);
    hintT = setTimeout(() => { el.style.opacity = '0'; }, 3800);
  }
  function hideHint() { const el = $('mHint'); if (el) el.style.opacity = '0'; clearTimeout(hintT); }
  function bumpHint() { hintSeen++; try { localStorage.setItem('ajanda_hint', hintSeen); } catch (e) { } hideHint(); }

  /* ---------------- kayıt sheet'i ---------------- */
  function openSheet(ev, date, forceKind) {
    const editing = !!ev;
    let dr = {
      title: ev ? ev.text : '',
      date: ev ? ev.date : date,
      time: ev ? (ev.time || '10:00') : '10:00',
      amount: ev && ev.amt ? String(ev.amt) : '',
      kind: ev ? (ev.amtType || 'none') : (forceKind || 'none'),
      cat: ev ? ev.cat : 'mavi'
    };
    const box = document.createElement('div');
    const draw = () => {
      const color = S.cat(dr.cat).color;
      box.innerHTML = `
      <div class="grab"></div>
      <div class="sh-h"><div class="sh-t">${editing ? 'Kaydı düzenle' : 'Yeni kayıt'}</div><button class="sh-x">Vazgeç</button></div>
      <div class="field">
        <input class="inp" id="fTitle" placeholder="Ne yapacaksın?" value="${S.escAttr(dr.title)}">
        <div class="div"></div>
        <div class="frow">
          <input type="date" class="flab" id="fDate" value="${dr.date}" style="border:0;background:transparent;outline:none;font-weight:600">
          <input class="mini tnum" id="fTime" type="time" value="${dr.time}">
        </div>
      </div>
      <div class="lab">Tutar</div>
      <div class="seg" id="fKind">
        <button data-k="none" class="${dr.kind === 'none' ? 'on' : ''}">Yok</button>
        <button data-k="exp" class="${dr.kind === 'exp' ? 'on' : ''}">Gider</button>
        <button data-k="inc" class="${dr.kind === 'inc' ? 'on' : ''}">Gelir</button>
      </div>
      <div class="field" style="${dr.kind === 'none' ? 'display:none' : ''}">
        <div class="frow">
          <input class="inp" id="fAmount" inputmode="decimal" placeholder="0" value="${S.escAttr(dr.amount)}" style="flex:1;font-size:20px">
          <span style="font-size:16px;font-weight:700;color:var(--m5)">€</span>
        </div>
      </div>
      <div class="lab">Renk</div>
      <div class="pal" id="fPal">${S.data.cats.map(c => `<button data-c="${c.id}" class="${c.id === dr.cat ? 'on' : ''}">
          <div class="sw" style="background:${c.color};box-shadow:${c.id === dr.cat ? '0 0 0 2.5px ' + INK : 'inset 0 0 0 1px rgba(27,26,24,.08)'}"></div>
          <div class="nm">${esc(c.name)}</div></button>`).join('')}</div>
      <button class="save" id="fSave" style="background:${color}">Kaydet</button>
      ${editing ? '<button class="del" id="fDel">Kaydı sil</button>' : ''}
      <div class="note">Yıl görünümünde o gün bu renkle işaretlenir</div>`;

      box.querySelector('.sh-x').onclick = closeSheet;
      const grab = () => {
        dr.title = box.querySelector('#fTitle').value;
        dr.date = box.querySelector('#fDate').value || dr.date;
        dr.time = box.querySelector('#fTime').value || '10:00';
        const a = box.querySelector('#fAmount');
        if (a) dr.amount = a.value;
      };
      box.querySelector('#fKind').querySelectorAll('button').forEach(b => b.onclick = () => { grab(); dr.kind = b.dataset.k; draw(); });
      box.querySelector('#fPal').querySelectorAll('button').forEach(b => b.onclick = () => { grab(); dr.cat = b.dataset.c; draw(); });
      box.querySelector('#fSave').onclick = () => { grab(); commit(); };
      const del = box.querySelector('#fDel');
      if (del) del.onclick = () => { S.deleteEvent(ev.id); closeSheet(); render(); toast('Kayıt silindi'); };
    };
    const commit = () => {
      if (!dr.title.trim()) dr.title = S.cat(dr.cat).name;
      const payload = {
        date: dr.date, time: dr.time, text: dr.title.trim(), cat: dr.cat,
        amtType: dr.kind, amt: dr.kind === 'none' ? 0 : parseAmount(dr.amount)
      };
      if (editing) S.updateEvent(ev.id, payload); else S.addEvent(payload);
      closeSheet();
      const dt = parseISO(dr.date);
      if (V.tab === 'ajanda') {
        V.y = dt.getFullYear();
        if (V.level === 'hafta') V.week = startOfWeek(dt); else V.m = dt.getMonth();
      } else { V.pnlY = dt.getFullYear(); V.pnlM = dt.getMonth(); }
      render(); toast(editing ? 'Güncellendi' : 'Eklendi');
    };
    draw();
    sheet(box);
    setTimeout(() => { const t = box.querySelector('#fTitle'); if (t && !editing) t.focus(); }, 280);
  }
  function parseAmount(s) {
    if (!s) return 0;
    const n = parseFloat(String(s).replace(/\s|€/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : Math.abs(n);
  }

  /* ---------------- yıl / ay seçici ---------------- */
  function openYearPick() {
    const box = document.createElement('div');
    const cur = TODAY.getFullYear();
    const years = []; for (let i = -3; i <= 6; i++) years.push(cur + i);
    box.innerHTML = `<div class="grab"></div>
      <div class="sh-h"><div class="sh-t">Yıl seç</div><button class="sh-x">Vazgeç</button></div>
      <div class="pick">${years.map(y => `<button data-y="${y}" class="${y === V.y ? 'on' : ''} ${y === cur ? 'now' : ''}">${y}</button>`).join('')}</div>
      <div class="note">Yeşil çerçeveli olan içinde bulunduğun yıl.</div>`;
    box.querySelector('.sh-x').onclick = closeSheet;
    box.querySelectorAll('.pick button').forEach(b => b.onclick = () => {
      V.y = +b.dataset.y; closeSheet(); V.anim = 'zin'; render();
    });
    sheet(box);
  }
  function openMonthPick(which) {
    const box = document.createElement('div');
    let year = which === 'pnl' ? V.pnlY : V.y;
    const draw = () => {
      const selM = which === 'pnl' ? V.pnlM : V.m;
      const selY = which === 'pnl' ? V.pnlY : V.y;
      box.innerHTML = `<div class="grab"></div>
        <div class="sh-h"><div class="sh-t">Ay seç</div><button class="sh-x">Vazgeç</button></div>
        <div class="yhead">
          <button id="yPrev">${SVG.left}</button>
          <div class="y tnum">${year}</div>
          <button id="yNext">${SVG.right}</button>
        </div>
        <div class="pick">${MONTHS.map((n, i) => {
        const on = (i === selM && year === selY);
        const now = (i === TODAY.getMonth() && year === TODAY.getFullYear());
        return `<button data-m="${i}" class="${on ? 'on' : ''} ${now ? 'now' : ''}">${SHORT[i]}</button>`;
      }).join('')}</div>
        <div class="note">Yeşil çerçeveli olan içinde bulunduğun ay.</div>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      box.querySelector('#yPrev').onclick = () => { year--; draw(); };
      box.querySelector('#yNext').onclick = () => { year++; draw(); };
      box.querySelectorAll('.pick button').forEach(b => b.onclick = () => {
        const m = +b.dataset.m;
        if (which === 'pnl') { V.pnlY = year; V.pnlM = m; }
        else { V.y = year; V.m = m; V.level = 'ay'; V.anim = 'zin'; }
        closeSheet(); render();
      });
    };
    draw(); sheet(box);
  }

  /* ---------------- ayarlar ---------------- */
  function openSettings() {
    const box = document.createElement('div');
    const draw = () => {
      const c = S.cfg(), st = S.status;
      box.innerHTML = `<div class="grab"></div>
        <div class="sh-h"><div class="sh-t">Ayarlar</div><button class="sh-x">Vazgeç</button></div>
        <div class="lab">Eşitleme</div>
        <div class="field">
          <input class="inp" id="sTok" type="password" autocomplete="off" placeholder="GitHub token (gist yetkisi)" value="${S.escAttr(c.token)}">
          <div class="div"></div>
          <input class="inp" id="sGist" autocomplete="off" placeholder="Gist ID" value="${S.escAttr(c.gist)}">
        </div>
        <button class="save" id="sSave" style="background:${GREEN};color:#fff">Kaydet ve eşitle</button>
        <div class="note">${esc(st.text)}${c.last ? ' · son: ' + new Date(c.last).toLocaleString('tr-TR') : ''}</div>
        <div class="lab">Yedek</div>
        <button class="ghost" id="sExp">Yedeği indir</button>
        <label class="ghost" style="cursor:pointer">Yedek yükle<input type="file" accept="application/json" id="sImp" style="display:none"></label>
        <div class="note">Kayıtlar telefonda saklanır; GitHub üzerinden bilgisayarla eşitlenir.</div>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      box.querySelector('#sSave').onclick = () => {
        S.setCfg({ token: box.querySelector('#sTok').value.trim(), gist: box.querySelector('#sGist').value.trim() });
        S.sync().then(ok => { toast(ok ? 'Eşitlendi' : S.status.text); draw(); });
      };
      box.querySelector('#sExp').onclick = () => S.exportJSON();
      box.querySelector('#sImp').onchange = function () {
        const f = this.files && this.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { const n = S.importJSON(r.result); closeSheet(); render(); toast(n + ' kayıt yüklendi'); }
          catch (e) { toast('Yedek okunamadı'); }
        };
        r.readAsText(f); this.value = '';
      };
    };
    draw(); sheet(box);
  }

  /* ---------------- jestler ---------------- */
  let lock = 0, gesturesBound = false;
  function canZoom() { return V.tab === 'ajanda' && !sheetOpen; }
  function zoomOut() {
    if (V.level === 'hafta') { V.m = V.week.getMonth(); V.y = V.week.getFullYear(); go('ay', 'zout'); }
    else if (V.level === 'ay') go('yil', 'zout');
  }
  function zoomIn() {
    if (V.level === 'yil') { V.m = (V.y === TODAY.getFullYear()) ? TODAY.getMonth() : 0; go('ay', 'zin'); }
    else if (V.level === 'ay') {
      const inThis = V.y === TODAY.getFullYear() && V.m === TODAY.getMonth();
      V.week = startOfWeek(inThis ? TODAY : new Date(V.y, V.m, 1)); go('hafta', 'zin');
    }
  }
  function bindGestures() {
    if (gesturesBound) return;
    gesturesBound = true;
    const sc = $('mScroll');
    sc.addEventListener('wheel', e => {
      if (!canZoom()) return;
      const now = Date.now(); if (now - lock < 650) return;
      if (e.deltaY < -18 && sc.scrollTop <= 2) { lock = now; bumpHint(); zoomOut(); }
      else if (e.deltaY > 18 && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 3) { lock = now; bumpHint(); zoomIn(); }
    }, { passive: true });

    let tY = 0, tActive = false, sx = 0, sy = 0, sw = false;
    sc.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      tY = e.touches[0].clientY; tActive = true;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; sw = true;
    }, { passive: true });
    sc.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dyH = e.changedTouches[0].clientY - sy;
      if (sw && !sheetOpen && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dyH) * 1.8) {
        sw = false; tActive = false; step(dx < 0 ? 1 : -1); return;
      }
      sw = false;
      if (!tActive || !canZoom()) return; tActive = false;
      const now = Date.now(); if (now - lock < 650) return;
      const dy = e.changedTouches[0].clientY - tY;
      const atTop = sc.scrollTop <= 2;
      const atBot = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 3;
      if (dy > 90 && atTop) { lock = now; bumpHint(); zoomOut(); }
      else if (dy < -90 && atBot) { lock = now; bumpHint(); zoomIn(); }
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (document.body.dataset.ui !== 'mobile') return;
      if (sheetOpen) { if (e.key === 'Escape') closeSheet(); return; }
      if (e.target.matches && e.target.matches('input,select,textarea')) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowUp') zoomOut();
      else if (e.key === 'ArrowDown') zoomIn();
      else if (e.key === 'n' || e.key === 'N') $('mAdd').click();
    });
  }

  /* ---------------- montaj ---------------- */
  function mount() {
    if (!document.getElementById('mobile-css')) {
      const s = document.createElement('style'); s.id = 'mobile-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!V) initState();
    buildShell();
    render();
  }

  return {
    mount: mount,
    render: () => { if (V && document.getElementById('mScroll')) render(); }
  };
})();
