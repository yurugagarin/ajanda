"use strict";
/* ===========================================================
   mobile.js — telefon görünümü
   Tasarım: kullanıcının "Ajanda" prototipi (yıl ↔ ay ↔ hafta).
   Veri: store.js (bilgisayarla ortak).
   =========================================================== */
var MobileView = (function () {
  const S = Store;
  const MONTHS = S.MONTHS, SHORT = S.MONTHS_SHORT, DOW = S.WD_SHORT;
  const INK = '#1b1a18', GREEN = '#2f7a5b';

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
.mob .title.sm{font-size:20px;letter-spacing:-.025em}
.mob .title{text-overflow:ellipsis}
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
.mob .addline{font-size:12.5px;color:rgba(27,26,24,.32);padding:8px 2px;text-align:left}

.mob .sechd{margin-top:22px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.mob .sechd .t{font-size:13px;font-weight:700;letter-spacing:-.01em}
.mob .sechd .a{font-size:12px;font-weight:600;color:var(--green)}
.mob .prev{margin-top:10px;display:flex;flex-direction:column;gap:8px}
.mob .pcard{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.05);text-align:left;width:100%}
.mob .pbar{width:3px;height:26px;border-radius:2px;flex:none}
.mob .pttl{font-size:14px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mob .pwhen{font-size:11.5px;color:var(--m5);margin-top:1px}
.mob .legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
.mob .lg{display:inline-flex;align-items:center;gap:6px;background:var(--card);border-radius:20px;padding:6px 11px 6px 9px;font-size:12px;font-weight:600;color:var(--m6);box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .lg.on{background:var(--ink);color:var(--paper)}
.mob .lg i{width:9px;height:9px;border-radius:999px;display:block}
.mob .lg b{font-weight:700;opacity:.55}
.mob .dim{opacity:.16}
.mob .srow{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-radius:14px;width:100%;text-align:left;margin-bottom:8px}
.mob .toast.act{pointer-events:auto;display:flex;align-items:center;gap:12px}
.mob .toast.act button{all:unset;cursor:pointer;background:rgba(246,245,242,.16);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700}
.mob .empty{padding:26px 4px;text-align:center;font-size:13px;color:var(--m5);line-height:1.5}
.mob .ghost{margin-top:10px;padding:15px;border-radius:18px;background:var(--m1);text-align:center;font-size:14px;font-weight:600;color:var(--m6);width:100%;display:block}
.mob .ghost:active{background:var(--m2)}

.mob .tabs{position:absolute;left:0;right:0;bottom:0;padding:8px 16px calc(14px + var(--safeB));background:rgba(246,245,242,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(27,26,24,.07);display:flex;gap:8px;z-index:30}
.mob .tab{flex:1;padding:11px;border-radius:16px;text-align:center;font-size:12.5px;font-weight:700;color:var(--m5)}
.mob .tab.on{background:var(--ink);color:var(--paper)}

.mob .toast{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(84px + var(--safeB));padding:9px 16px;border-radius:999px;background:var(--ink);color:var(--paper);font-size:12.5px;font-weight:600;z-index:60;white-space:nowrap;animation:mfadein .2s;pointer-events:none}

.mob .scrim{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(27,26,24,.28);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);transition:background .2s}
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
.mob .cats{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}
.mob .cats button{display:inline-flex;align-items:center;gap:7px;background:var(--card);border-radius:999px;padding:10px 14px;font-size:14px;font-weight:600;color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .cats button i{width:10px;height:10px;border-radius:999px;display:block}
.mob .cats button.on{background:var(--ink);color:var(--paper)}
.mob .flt{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:22px}
.mob .flt .t{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700}
.mob .flt .t i{width:11px;height:11px;border-radius:999px;display:block}
.mob .flt button{all:unset;cursor:pointer;font-size:13px;font-weight:600;color:var(--green)}
.mob .pal{margin-top:12px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px 6px;justify-items:center}
.mob .pal button{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;min-width:0}
.mob .pal .sw{width:42px;height:42px;border-radius:999px;flex:none}
.mob .pal .nm{font-size:8.8px;letter-spacing:-.1px;font-weight:600;color:var(--m5);width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mob .pal button.on .nm{color:var(--ink)}
.mob .pick{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mob .pick button{padding:14px 4px;border-radius:14px;background:var(--card);font-size:14px;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .pick button.on{background:var(--ink);color:var(--paper)}
.mob .pick button.now{box-shadow:inset 0 0 0 1.5px var(--green)}
.mob .yhead{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:14px}
.mob .yhead .y{font-size:20px;font-weight:700;min-width:74px;text-align:center}
.mob .yhead button{width:34px;height:34px;border-radius:999px;background:var(--m1);display:flex;align-items:center;justify-content:center;color:var(--m6)}
.mob .yhead svg{width:15px;height:15px}
.mob .save{margin-top:22px;padding:16px;border-radius:18px;text-align:center;font-size:15px;font-weight:700;color:#fff;width:100%}
.mob .del{margin-top:9px;padding:13px;border-radius:16px;text-align:center;font-size:13px;font-weight:600;color:var(--rust);width:100%;background:rgba(180,98,47,.09)}
.mob .chk{width:24px;height:24px;border-radius:999px;flex:none;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(27,26,24,.2);color:#fff;transition:background .15s}
.mob .chk svg{width:13px;height:13px;opacity:0}
.mob .chk.on{background:var(--green);box-shadow:none}
.mob .chk.on svg{opacity:1}
.mob .chk.miss{box-shadow:inset 0 0 0 2px rgba(180,98,47,.65)}
.mob .is-done .pttl,.mob .is-done .ev-n{text-decoration:line-through;text-decoration-color:rgba(27,26,24,.35);color:var(--m5)}
.mob .is-done .pbar,.mob .is-done .ev-c{opacity:.45}
.mob .pbody{flex:1;min-width:0;text-align:left;display:flex;align-items:center;gap:12px}
.mob .agh{display:flex;align-items:baseline;gap:8px;margin-top:22px;padding:0 2px}
.mob .agh .t{font-size:14px;font-weight:800;letter-spacing:-.01em}
.mob .agh .d{font-size:12px;font-weight:600;color:var(--m4)}
.mob .agh .n{margin-left:auto;font-size:11.5px;font-weight:700;color:var(--m4)}
.mob .agh .a{margin-left:auto;font-size:12px;font-weight:600;color:var(--green)}
.mob .agh.miss .t{color:var(--rust)}
.mob .tbox{margin-top:18px;background:rgba(47,122,91,.09);border-radius:22px;padding:12px 10px 10px;box-shadow:inset 0 0 0 1.5px rgba(47,122,91,.22)}
.mob .tbox .agh{margin-top:0;padding:0 6px 2px}
.mob .tbox .agh .t{color:var(--green)}
.mob .tbox .prev{margin-top:8px}
.mob .tbox .empty{padding:14px 4px}
.mob .wtag{margin-top:5px;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--green)}
.mob .wday.past .wleft,.mob .wday.past .ev>button:not(.chk){opacity:.55}
.mob .wday.past .ev{background:rgba(255,255,255,.55)}
.mob .wday.today .wright{background:rgba(47,122,91,.08);border-radius:16px;padding:8px;border-bottom:0;margin-bottom:6px}
.mob .mtick{font-size:8px;line-height:4px;font-weight:900;color:var(--green)}
.mob .tgl{margin-top:12px;display:flex;align-items:center;gap:12px;background:var(--card);border-radius:16px;padding:12px 14px;width:100%;font-size:15px;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mob .note{margin-top:9px;text-align:center;font-size:11.5px;color:var(--m4);font-weight:500;line-height:1.45}
`;

  const SVG = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
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
  const TKEY = S.todayKey();
  const esc = S.esc;

  /* ---------------- veri köprüsü ---------------- */
  function dayEvents(y, m, d) {
    return S.eventsOn(iso(y, m, d)).map(e => Object.assign({}, e, { color: S.cat(e.cat).color }));
  }
  function monthCount(y, m) {
    const p = y + '-' + pad(m + 1);
    return S.data.events.filter(e => e.date.slice(0, 7) === p).length;
  }
  function yearCount(y) { return S.data.events.filter(e => e.date.slice(0, 4) === String(y)).length; }

  /* ---------------- görünüm durumu ---------------- */
  let V = null;
  function loadLevel() {
    try { const l = localStorage.getItem('ajanda_level_mob'); if (l === 'yil' || l === 'ay' || l === 'hafta') return l; } catch (e) { }
    return 'ay';
  }
  function saveLevel() { try { localStorage.setItem('ajanda_level_mob', V.level); } catch (e) { } }

  function initState() {
    V = {
      level: loadLevel(),
      y: TODAY.getFullYear(), m: TODAY.getMonth(), week: startOfWeek(TODAY),
      anim: 'zin', hl: null, hlPast: false
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
        <div style="flex:1;min-width:0">
          <div class="kicker" id="mKicker"></div>
          <button class="title" id="mTitle"></button>
        </div>
        <div class="hbtns">
          <div class="nav" id="mNav"></div>
          <button class="pill" id="mToday">Bugün</button>
          <button class="fab" id="mAdd" aria-label="Yeni kayıt">${SVG.plus}</button>
        </div>
      </div>
      <div class="scroll" id="mScroll"></div>
      <div class="tabs">
        <button class="tab" id="mTabY">Yıl</button>
        <button class="tab" id="mTabM">Ay</button>
      </div>
      <div id="mSheetHost"></div>
      <div id="mToastHost"></div>`;
    $('mTabY').onclick = () => { if (V.level !== 'yil') go('yil', 'zout'); };
    $('mTabM').onclick = () => {
      if (V.level === 'hafta') { V.m = V.week.getMonth(); V.y = V.week.getFullYear(); go('ay', 'zout'); }
      else if (V.level === 'yil') go('ay', 'zin');
    };
    $('mToday').onclick = () => {
      V.y = TODAY.getFullYear(); V.m = TODAY.getMonth(); V.week = startOfWeek(TODAY);
      V.anim = 'zin'; render();
    };
    $('mAdd').onclick = () => openSheet(null, defaultDate());
    $('mKicker').onclick = openSearch;
    bindGestures();
  }

  function setTitle(text, onTap) {
    const el = $('mTitle');
    el.innerHTML = esc(text) + (onTap ? '<span class="chev">▾</span>' : '');
    el.onclick = onTap || null;
    el.style.cursor = onTap ? 'pointer' : 'default';
    el.style.fontSize = '';
  }
  /* uzun başlık (ör. "28 Eyl – 4 Eki") dar ekranda sığana kadar küçülür */
  function fitTitle() {
    const el = $('mTitle'); if (!el) return;
    el.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && fs > 13) { fs -= 1; el.style.fontSize = fs + 'px'; }
  }
  function navPair(fn) {
    $('mNav').innerHTML = `<button aria-label="Önceki">${SVG.left}</button><button aria-label="Sonraki">${SVG.right}</button>`;
    const b = $('mNav').querySelectorAll('button');
    b[0].onclick = () => fn(-1); b[1].onclick = () => fn(1);
  }
  function setKicker(text) {
    const st = S.status;
    const dot = st.kind === 'err' ? '#b4622f' : (st.kind === 'sync' ? 'rgba(27,26,24,.3)' : '');
    $('mKicker').innerHTML = (dot ? `<i style="background:${dot}"></i>` : '') + esc(text);
  }

  /* ---------------- render ---------------- */
  function render() {
    if (!V) initState();
    if (!$('mScroll')) buildShell();
    saveLevel();

    $('mTabY').className = 'tab' + (V.level === 'yil' ? ' on' : '');
    $('mTabM').className = 'tab' + (V.level !== 'yil' ? ' on' : '');

    const wEnd = addDays(V.week, 6);
    const sameM = V.week.getMonth() === wEnd.getMonth();
    /* kısa ay adı: başlık dar ekranda kesilmesin */
    const weekLabel = sameM
      ? `${V.week.getDate()}–${wEnd.getDate()} ${SHORT[V.week.getMonth()]}`
      : `${V.week.getDate()} ${SHORT[V.week.getMonth()]} – ${wEnd.getDate()} ${SHORT[wEnd.getMonth()]}`;

    if (V.level === 'yil') setTitle(String(V.y), openYearPick);
    else if (V.level === 'ay') setTitle(MONTHS[V.m], openMonthPick);
    else setTitle(weekLabel, null);
    $('mTitle').classList.toggle('sm', V.level === 'hafta');
    fitTitle(); requestAnimationFrame(fitTitle);
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
  }

  function weekNo(dt) {
    const t = new Date(dt.getFullYear(), 0, 1);
    return Math.floor((startOfWeek(dt) - startOfWeek(t)) / 604800000) + 1;
  }
  function step(n) {
    if (V.level === 'yil') V.y += n;
    else if (V.level === 'ay') { const d = new Date(V.y, V.m + n, 1); V.y = d.getFullYear(); V.m = d.getMonth(); }
    else V.week = addDays(V.week, 7 * n);
    V.anim = 'zin'; render();
  }
  function go(level, anim) { V.level = level; V.anim = anim || 'zin'; render(); }
  function defaultDate() {
    if (V.level === 'hafta') return dkey(V.week <= TODAY && TODAY <= addDays(V.week, 6) ? TODAY : V.week);
    if (V.level === 'ay') return (V.y === TODAY.getFullYear() && V.m === TODAY.getMonth()) ? dkey(TODAY) : iso(V.y, V.m, 1);
    return dkey(TODAY);
  }

  /* ---------------- yıl ---------------- */
  function viewYear() {
    const wrap = document.createElement('div');
    wrap.className = 'year ' + V.anim;
    const todayD = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    for (let m = 0; m < 12; m++) {
      const isCur = V.y === TODAY.getFullYear() && m === TODAY.getMonth();
      const monthPast = V.y < TODAY.getFullYear() || (V.y === TODAY.getFullYear() && m < TODAY.getMonth());
      const el = document.createElement('div'); el.className = 'ymo';
      let cells = '';
      for (let i = 0; i < firstDow(V.y, m); i++) cells += '<div class="ycell"></div>';
      for (let d = 1; d <= daysIn(V.y, m); d++) {
        const k = iso(V.y, m, d);
        const today = k === TKEY;
        const evs = dayEvents(V.y, m, d);
        let bg = 'transparent', color = 'rgba(27,26,24,.42)', w = 400, ring = '';
        if (evs.length) { bg = evs[0].color; color = '#fff'; w = 700; }
        if (k < TKEY) {   /* geçmiş: soluk, ama kayıtlı günler renginden belli */
          color = 'rgba(27,26,24,.2)';
          if (evs.length) { bg = S.rgba(evs[0].color, .26); color = evs[0].color; w = 600; }
        }
        if (today) {
          color = '#fff'; w = 700;
          bg = evs.length ? evs[0].color : INK;
          if (evs.length) ring = 'box-shadow:inset 0 0 0 1.5px ' + INK + ';';
        }
        const dim = (V.hl && evs.length && evs[0].cat !== V.hl) ? ' dim' : '';
        cells += `<div class="ycell${dim}" style="color:${color};background:${bg};font-weight:${w};${ring}">${d}</div>`;
      }
      el.innerHTML = `<div class="ymo-h">
          <div class="ymo-n" style="color:${isCur ? GREEN : (monthPast ? 'rgba(27,26,24,.34)' : INK)}">${MONTHS[m]}</div>
          <div class="ymo-c">${monthCount(V.y, m) || ''}</div>
        </div><div class="ycells">${cells}</div>`;
      el.onclick = () => { V.m = m; go('ay', 'zin'); };
      wrap.appendChild(el);
    }
    const frag = document.createDocumentFragment();
    frag.appendChild(wrap);
    const lg = legendEl(); if (lg) frag.appendChild(lg);
    return frag;
  }

  /* seçili kategorinin tüm kayıtları */
  function catListEl() {
    const c = S.cat(V.hl);
    const past = !!V.hlPast;
    const raw = S.eventsInCat(V.hl, past ? 'past' : 'future');
    const items = past ? S.collapse(raw).reverse() : S.collapse(raw);
    const pastCount = S.eventsInCat(V.hl, 'past').length;
    const box = document.createElement('div');
    const hd = document.createElement('div'); hd.className = 'flt';
    hd.innerHTML = `<div class="t"><i style="background:${c.color}"></i>${esc(c.name)} <span style="color:var(--m5);font-weight:600">${items.length}</span></div>`;
    const x = document.createElement('button'); x.textContent = 'Kapat';
    x.onclick = () => { V.hl = null; render(); };
    hd.appendChild(x);
    box.appendChild(hd);
    const tabs = document.createElement('div');
    tabs.className = 'cats';
    tabs.style.marginTop = '10px';
    tabs.innerHTML = `<button class="${past ? '' : 'on'}" data-p="0">Yaklaşan</button>
      <button class="${past ? 'on' : ''}" data-p="1">Geçmiş${pastCount ? ' ' + pastCount : ''}</button>`;
    tabs.querySelectorAll('button').forEach(b => b.onclick = () => { V.hlPast = b.dataset.p === '1'; render(); });
    box.appendChild(tabs);
    const list = document.createElement('div'); list.className = 'prev';
    if (!items.length) list.innerHTML = `<div class="empty">${past ? 'Geçmişte kayıt yok.' : 'Yaklaşan kayıt yok.'}</div>`;
    items.forEach(it => {
      const e = it.ev, p = S.parseKey(it.first);
      const b = agendaCard(Object.assign({}, e, { color: c.color }),
        `${S.spanLabel(it)}${it.contiguous && it.count > 1 ? ' · ' + it.count + ' gün' : ''} · ${p.y}${e.time ? ' · ' + e.time : ''}`);
      if (it.last < TKEY) b.style.opacity = '.6';
      list.appendChild(b);
    });
    box.appendChild(list);
    return box;
  }

  /* kategori şeridi — dokununca sadece o kategori */
  function legendEl() {
    const use = S.catUsage().filter(c => c.n);
    if (!use.length) return null;
    const box = document.createElement('div');
    box.className = 'legend';
    use.forEach(c => {
      const b = document.createElement('button');
      b.className = 'lg' + (V.hl === c.id ? ' on' : '');
      b.innerHTML = `<i style="background:${c.color}"></i>${esc(c.name)} <b>${S.eventsInCat(c.id, 'future').length}</b>`;
      b.onclick = e => { e.stopPropagation(); V.hl = V.hl === c.id ? null : c.id; V.hlPast = false; render(); };
      box.appendChild(b);
    });
    return box;
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
      row.style.background = 'transparent';
      row.innerHTML = slice.map(d => {
        if (!d) return '<div class="mcell"></div>';
        const k = iso(V.y, V.m, d);
        const today = k === TKEY;
        const evs = dayEvents(V.y, V.m, d);
        let bg = 'transparent', color = 'rgba(27,26,24,.85)', w = 500, ring = '';
        let dotCols = evs.slice(1, 4).map(e => e.color);
        if (evs.length) { bg = evs[0].color; color = '#fff'; w = 700; }
        const past = k < TKEY;
        if (past) {   /* geçmiş: soluk, ama kayıtlı günler renginden belli */
          color = 'rgba(27,26,24,.24)'; w = 500;
          if (evs.length) { bg = S.rgba(evs[0].color, .24); color = evs[0].color; w = 700; }
        }
        const allDone = past && evs.length && evs.every(e => e.done);
        if (today) {
          color = '#fff'; w = 700;
          bg = evs.length ? evs[0].color : GREEN;
          if (evs.length) ring = `box-shadow:inset 0 0 0 2px ${GREEN};`;
        }
        const dimc = (V.hl && evs.length && evs[0].cat !== V.hl) ? ' dim' : '';
        const dots = allDone ? '<div class="mtick">✓</div>'
          : dotCols.map(c => `<div class="mdot" style="background:${c}${past ? ';opacity:.45' : ''}"></div>`).join('');
        return `<div class="mcell${dimc}">
          <div class="mnum" style="color:${color};background:${bg};font-weight:${w};${ring}">${d}</div>
          <div class="mdots">${dots}</div></div>`;
      }).join('');
      const firstDay = slice.filter(x => x)[0];
      row.onclick = () => { V.week = startOfWeek(new Date(V.y, V.m, firstDay)); go('hafta', 'zin'); };
      rows.appendChild(row);
    }
    frag.appendChild(box);

    if (V.hl) { frag.appendChild(catListEl()); const lg0 = legendEl(); if (lg0) frag.appendChild(lg0); return frag; }

    frag.appendChild(agendaEl());
    const lg = legendEl(); if (lg) frag.appendChild(lg);
    return frag;
  }
  /* ---------------- ajanda: bugün / kalanlar / yarın / bu hafta / sonra ---------------- */
  function checkBtn(e) {
    const b = document.createElement('button');
    const miss = !e.done && e.date < TKEY;
    b.className = 'chk' + (e.done ? ' on' : '') + (miss ? ' miss' : '');
    b.setAttribute('aria-label', e.done ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle');
    b.innerHTML = SVG.check;
    b.onclick = ev => {
      ev.stopPropagation();
      S.toggleDone(e.id);
      toast(e.done ? 'Yapılmadı olarak işaretlendi' : 'Yapıldı ✓');
    };
    return b;
  }
  function agendaCard(e, when) {
    const card = document.createElement('div');
    card.className = 'pcard' + (e.done ? ' is-done' : '');
    card.appendChild(checkBtn(e));
    const body = document.createElement('button'); body.className = 'pbody';
    body.innerHTML = `<div class="pbar" style="background:${e.color}"></div>
      <div style="flex:1;min-width:0"><div class="pttl">${esc(e.text)}</div>${when ? `<div class="pwhen">${when}</div>` : ''}</div>`;
    body.onclick = () => openSheet(e, e.date);
    card.appendChild(body);
    return card;
  }
  function agendaEl() {
    const frag = document.createDocumentFragment();
    const withColor = e => Object.assign({}, e, { color: S.cat(e.cat).color });
    const tomorrow = dkey(addDays(TODAY, 1));
    const weekEnd = dkey(addDays(startOfWeek(TODAY), 6));
    const dayLabel = k => { const dt = parseISO(k); return `${dt.getDate()} ${SHORT[dt.getMonth()]} ${DOW[dowMon(dt)]}`; };
    const fullLabel = dt => `${DOW[dowMon(dt)]} · ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
    const head = (cls, t, d, right) => {
      const el = document.createElement('div'); el.className = 'agh' + (cls ? ' ' + cls : '');
      el.innerHTML = `<div class="t">${t}</div>${d ? `<div class="d">${d}</div>` : ''}`;
      if (right) el.appendChild(right);
      return el;
    };
    const list = items => { const l = document.createElement('div'); l.className = 'prev'; items.forEach(x => l.appendChild(x)); return l; };

    /* bugün */
    const todayEvs = S.eventsOn(TKEY).map(withColor);
    const box = document.createElement('div'); box.className = 'tbox';
    const nDone = todayEvs.filter(e => e.done).length;
    const cnt = document.createElement('div'); cnt.className = 'n';
    cnt.textContent = todayEvs.length ? `${nDone}/${todayEvs.length} yapıldı` : '';
    box.appendChild(head('', 'Bugün', fullLabel(TODAY), cnt));
    if (todayEvs.length) box.appendChild(list(todayEvs.map(e => agendaCard(e, e.time || 'gün boyu'))));
    else {
      const em = document.createElement('button'); em.className = 'empty'; em.style.width = '100%';
      em.innerHTML = 'Bugün için kayıt yok · <b style="color:var(--green)">+ ekle</b>';
      em.onclick = () => openSheet(null, TKEY);
      box.appendChild(em);
    }
    frag.appendChild(box);

    /* geçen günlerden kalan, yapılmamış */
    const miss = S.collapse(S.overdue(7)).map(it => withColor(it.ev));
    if (miss.length) {
      frag.appendChild(head('miss', 'Yapılmadı', 'son 7 gün'));
      frag.appendChild(list(miss.map(e => agendaCard(e, dayLabel(e.date) + (e.time ? ' · ' + e.time : '')))));
    }

    /* yarın */
    const tmr = S.eventsOn(tomorrow).map(withColor);
    const wk = document.createElement('button'); wk.className = 'a'; wk.textContent = 'Haftayı aç';
    wk.onclick = () => { V.week = startOfWeek(TODAY); go('hafta', 'zin'); };
    frag.appendChild(head('', 'Yarın', fullLabel(addDays(TODAY, 1)), wk));
    if (tmr.length) frag.appendChild(list(tmr.map(e => agendaCard(e, e.time || 'gün boyu'))));
    else { const em = document.createElement('div'); em.className = 'empty'; em.style.padding = '12px 4px'; em.textContent = 'Yarın boş.'; frag.appendChild(em); }

    /* bu hafta (yarından sonra, pazara kadar) ve sonrası */
    const future = S.data.events.filter(e => e.date > tomorrow)
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : S.byTime(a, b));
    const thisWeek = S.collapse(future.filter(e => e.date <= weekEnd));
    const later = S.collapse(future.filter(e => e.date > weekEnd)).slice(0, 6);
    const whenOf = it => (it.count > 1 ? S.spanLabel(it) : dayLabel(it.ev.date)) + (it.ev.time ? ' · ' + it.ev.time : '');
    if (thisWeek.length) {
      frag.appendChild(head('', 'Bu hafta'));
      frag.appendChild(list(thisWeek.map(it => agendaCard(withColor(it.ev), whenOf(it)))));
    }
    if (later.length) {
      frag.appendChild(head('', 'Sonra'));
      frag.appendChild(list(later.map(it => agendaCard(withColor(it.ev), whenOf(it)))));
    }
    return frag;
  }

  /* ---------------- hafta ---------------- */
  function viewWeek() {
    const wrap = document.createElement('div');
    wrap.className = 'wrap ' + V.anim;
    for (let i = 0; i < 7; i++) {
      const dt = addDays(V.week, i);
      const k = dkey(dt);
      const evs = dayEvents(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const today = k === TKEY, past = k < TKEY;
      const tag = today ? 'Bugün' : k === dkey(addDays(TODAY, 1)) ? 'Yarın' : '';
      const day = document.createElement('div'); day.className = 'wday' + (today ? ' today' : past ? ' past' : '');
      day.innerHTML = `<div class="wleft">
          <div class="wdow">${DOW[i]}</div>
          <div class="wnum" style="color:${today ? '#f6f5f2' : INK};background:${today ? GREEN : 'transparent'}">${dt.getDate()}</div>
          ${tag ? `<div class="wtag">${tag}</div>` : ''}
        </div><div class="wright"></div>`;
      const right = day.querySelector('.wright');
      evs.forEach(e => {
        const row = document.createElement('div'); row.className = 'ev' + (e.done ? ' is-done' : '');
        row.style.padding = '8px 13px 8px 9px';
        row.appendChild(checkBtn(e));
        const b = document.createElement('button');
        b.style.cssText = 'flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-align:left;padding:3px 0';
        b.innerHTML = `<div class="ev-c" style="background:${e.color}"></div>
          <div class="ev-t tnum">${esc(e.time || '—')}</div>
          <div class="ev-n">${esc(e.text)}${e.note ? ' <span style="opacity:.4;font-weight:500">· ' + esc(e.note) + '</span>' : ''}</div>`;
        b.onclick = () => openSheet(e, e.date);
        row.appendChild(b);
        right.appendChild(row);
      });
      const add = document.createElement('button'); add.className = 'addline';
      add.textContent = '+ ekle';
      add.onclick = () => openSheet(null, k);
      right.appendChild(add);
      wrap.appendChild(day);
    }
    return wrap;
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
    enableDrag(s, scrim);
    return s;
  }

  /* aşağı sürükleyince kapansın */
  function enableDrag(s, scrim) {
    let y0 = 0, cur = 0, on = false;
    const start = e => {
      if (s.scrollTop > 0) return;
      const t = e.touches ? e.touches[0] : e;
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      y0 = t.clientY; cur = 0; on = true; s.style.transition = 'none';
    };
    const move = e => {
      if (!on) return;
      const t = e.touches ? e.touches[0] : e;
      const d = t.clientY - y0;
      if (d <= 0) { cur = 0; s.style.transform = ''; scrim.style.background = ''; return; }
      cur = d;
      s.style.transform = 'translateY(' + d + 'px)';
      scrim.style.background = 'rgba(27,26,24,' + Math.max(.06, .28 - d / 1400) + ')';
    };
    const end = () => {
      if (!on) return; on = false;
      s.style.transition = 'transform .24s cubic-bezier(.2,.8,.2,1)';
      if (cur > 100) { s.style.transform = 'translateY(100%)'; scrim.style.background = 'rgba(27,26,24,0)'; setTimeout(closeSheet, 190); }
      else { s.style.transform = ''; scrim.style.background = ''; }
    };
    s.addEventListener('touchstart', start, { passive: true });
    s.addEventListener('touchmove', move, { passive: true });
    s.addEventListener('touchend', end, { passive: true });
    s.addEventListener('touchcancel', end, { passive: true });
    s.addEventListener('mousedown', e => {
      start(e);
      const mm = ev => move(ev);
      const mu = () => { end(); document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
      document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
    });
  }

  let toastT = null;
  function toast(msg, undo) {
    const host = $('mToastHost');
    host.innerHTML = `<div class="toast${undo ? ' act' : ''}"><span>${esc(msg)}</span>${undo ? '<button id="mUndo">Geri al</button>' : ''}</div>`;
    if (undo) $('mUndo').onclick = () => {
      const n = S.undo(); host.innerHTML = ''; render();
      if (n) toast(n + ' kayıt geri geldi');
    };
    clearTimeout(toastT);
    toastT = setTimeout(() => host.innerHTML = '', undo ? 6000 : 1900);
  }
  /* ---------------- kayıt sheet'i ---------------- */
  function openSheet(ev, date) {
    const editing = !!ev;
    const cats = S.catUsage();
    let dr = {
      title: ev ? ev.text : '',
      note: ev ? (ev.note || '') : '',
      date: ev ? ev.date : date,
      time: ev ? (ev.time || '10:00') : '10:00',
      cat: ev ? ev.cat : 'genel',
      done: ev ? !!ev.done : false
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
        <input class="inp" id="fNote" placeholder="Not (isteğe bağlı)" value="${S.escAttr(dr.note)}" style="font-size:15px;font-weight:500;color:var(--m6);padding:12px 0">
        <div class="div"></div>
        <div class="frow">
          <input type="date" class="flab" id="fDate" value="${dr.date}" style="border:0;background:transparent;outline:none;font-weight:600">
          <input class="mini tnum" id="fTime" type="time" value="${dr.time}">
        </div>
      </div>
      ${editing ? `<button class="tgl" id="fDone"><span class="chk${dr.done ? ' on' : ''}">${SVG.check}</span>${dr.done ? 'Yapıldı' : 'Yapılmadı — işaretlemek için dokun'}</button>` : ''}
      <div class="lab">Kategori</div>
      <div class="cats" id="fCats">${cats.map(c => `<button data-c="${c.id}" class="${c.id === dr.cat ? 'on' : ''}">
          <i style="background:${c.color}"></i>${esc(c.name)}</button>`).join('')}</div>
      <button class="save" id="fSave" style="background:${color}">Kaydet</button>
      ${editing ? '<button class="del" id="fDel">Bu günü sil</button>' : ''}
      ${editing && ev.gid && S.groupCount(ev.gid) > 1 ? `<button class="del" id="fDelG">Serinin tümünü sil (${S.groupCount(ev.gid)} gün)</button>` : ''}
      <div class="note">Yıl görünümünde o gün bu kategorinin rengiyle işaretlenir</div>`;

      box.querySelector('.sh-x').onclick = closeSheet;
      const grab = () => {
        dr.title = box.querySelector('#fTitle').value;
        dr.note = box.querySelector('#fNote').value;
        dr.date = box.querySelector('#fDate').value || dr.date;
        dr.time = box.querySelector('#fTime').value || '';
      };
      box.querySelector('#fCats').querySelectorAll('button').forEach(b => {
        b.onclick = () => { grab(); dr.cat = b.dataset.c; draw(); };
      });
      box.querySelector('#fSave').onclick = () => { grab(); commit(); };
      const dn = box.querySelector('#fDone');
      if (dn) dn.onclick = () => { grab(); dr.done = !dr.done; draw(); };
      const del = box.querySelector('#fDel');
      if (del) del.onclick = () => { S.deleteEvent(ev.id); closeSheet(); render(); toast('Kayıt silindi', true); };
      const delG = box.querySelector('#fDelG');
      if (delG) delG.onclick = () => {
        const n = S.deleteGroup(ev.gid); closeSheet(); render(); toast(n + ' gün silindi', true);
      };
    };
    const commit = () => {
      if (!dr.title.trim()) dr.title = 'Yeni kayıt';
      const payload = { date: dr.date, time: dr.time, text: dr.title.trim(), note: (dr.note || '').trim(), cat: dr.cat, done: !!dr.done };
      if (editing) S.updateEvent(ev.id, payload); else S.addEvent(payload);
      closeSheet();
      const dt = parseISO(dr.date);
      V.y = dt.getFullYear();
      if (V.level === 'hafta') V.week = startOfWeek(dt); else V.m = dt.getMonth();
      render(); toast(editing ? 'Güncellendi' : 'Eklendi');
    };
    draw();
    sheet(box);
    setTimeout(() => { const t = box.querySelector('#fTitle'); if (t && !editing) t.focus(); }, 280);
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
  function openMonthPick() {
    const box = document.createElement('div');
    let year = V.y;
    const draw = () => {
      box.innerHTML = `<div class="grab"></div>
        <div class="sh-h"><div class="sh-t">Ay seç</div><button class="sh-x">Vazgeç</button></div>
        <div class="yhead">
          <button id="yPrev">${SVG.left}</button>
          <div class="y tnum">${year}</div>
          <button id="yNext">${SVG.right}</button>
        </div>
        <div class="pick">${MONTHS.map((n, i) => {
        const on = (i === V.m && year === V.y);
        const now = (i === TODAY.getMonth() && year === TODAY.getFullYear());
        return `<button data-m="${i}" class="${on ? 'on' : ''} ${now ? 'now' : ''}">${SHORT[i]}</button>`;
      }).join('')}</div>
        <div class="note">Yeşil çerçeveli olan içinde bulunduğun ay.</div>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      box.querySelector('#yPrev').onclick = () => { year--; draw(); };
      box.querySelector('#yNext').onclick = () => { year++; draw(); };
      box.querySelectorAll('.pick button').forEach(b => b.onclick = () => {
        V.y = year; V.m = +b.dataset.m; V.level = 'ay'; V.anim = 'zin';
        closeSheet(); render();
      });
    };
    draw(); sheet(box);
  }

  /* ---------------- arama ---------------- */
  function openSearch() {
    const box = document.createElement('div');
    let q = '';
    const draw = keepFocus => {
      const res = S.search(q, 40);
      box.innerHTML = `<div class="grab"></div>
        <div class="sh-h"><div class="sh-t">Ara</div><button class="sh-x">Vazgeç</button></div>
        <div class="field"><input class="inp" id="qIn" placeholder="Kayıtlarda ara…" value="${S.escAttr(q)}" autocomplete="off"></div>
        <div style="margin-top:14px">${q.trim().length < 2
        ? '<div class="empty">En az iki harf yazın. Tüm yıllarda aranır.</div>'
        : (res.length ? res.map(e => {
          const p = S.parseKey(e.date), c = S.cat(e.cat);
          return `<button class="srow" data-d="${e.date}">
              <span style="width:9px;height:9px;border-radius:999px;background:${c.color};flex:none"></span>
              <span style="flex:1;min-width:0"><span style="display:block;font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(e.text)}</span>
              <span style="display:block;font-size:12px;color:var(--m5);margin-top:1px">${p.d} ${SHORT[p.m]} ${p.y}${e.time ? ' · ' + e.time : ''}</span></span></button>`;
        }).join('') : '<div class="empty">Eşleşen kayıt yok.</div>')}</div>
        <div class="lab">Diğer</div>
        <button class="ghost" id="qIcs">Takvime aktar (.ics)</button>
        <button class="ghost" id="qSet">Ayarlar ve eşitleme</button>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      const inp = box.querySelector('#qIn');
      inp.oninput = () => { q = inp.value; clearTimeout(draw._t); draw._t = setTimeout(() => draw(true), 180); };
      box.querySelectorAll('.srow').forEach(b => b.onclick = () => {
        const d = b.dataset.d, p = S.parseKey(d);
        V.y = p.y; V.m = p.m; V.week = startOfWeek(parseISO(d));
        if (V.level === 'yil') V.level = 'ay';
        closeSheet(); render();
      });
      box.querySelector('#qIcs').onclick = () => {
        if (!S.data.events.length) { toast('Kayıt yok'); return; }
        S.downloadICS(null, 'ajanda'); closeSheet(); toast('.ics indirildi — Takvim\'e ekleyin');
      };
      box.querySelector('#qSet').onclick = () => { closeSheet(); openSettings(); };
      if (keepFocus) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    };
    draw(); sheet(box);
    setTimeout(() => { const i = box.querySelector('#qIn'); if (i) i.focus(); }, 300);
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
        <button class="save" id="sSave" style="background:${GREEN}">Kaydet ve eşitle</button>
        <div class="note">${esc(st.text)}${c.last ? ' · son: ' + new Date(c.last).toLocaleString('tr-TR') : ''}</div>
        <div class="lab">Kategoriler</div>
        <button class="ghost" id="sCats">Kategorileri düzenle</button>
        <div class="lab">Yedek</div>
        <button class="ghost" id="sIcs">Takvime aktar (.ics)</button>
        <button class="ghost" id="sExp">Yedeği indir</button>
        <label class="ghost" style="cursor:pointer">Yedek yükle<input type="file" accept="application/json" id="sImp" style="display:none"></label>
        <div class="note">Kayıtlar telefonda saklanır; GitHub üzerinden bilgisayarla eşitlenir.</div>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      box.querySelector('#sSave').onclick = () => {
        S.setCfg({ token: box.querySelector('#sTok').value.trim(), gist: box.querySelector('#sGist').value.trim() });
        S.sync().then(ok => { toast(ok ? 'Eşitlendi' : S.status.text); draw(); });
      };
      box.querySelector('#sCats').onclick = () => { closeSheet(); openCats(); };
      box.querySelector('#sIcs').onclick = () => { S.downloadICS(null, 'ajanda'); toast('.ics indirildi'); };
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

  /* ---------------- kategori düzenleyici ---------------- */
  function openCats() {
    const box = document.createElement('div');
    const draw = () => {
      box.innerHTML = `<div class="grab"></div>
        <div class="sh-h"><div class="sh-t">Kategoriler</div><button class="sh-x">Bitti</button></div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
          ${S.data.cats.map(c => `<div class="field" style="margin:0;padding:10px 14px" data-id="${c.id}">
            <div style="display:flex;align-items:center;gap:10px">
              <input class="cName" value="${S.escAttr(c.name)}" style="flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;font-weight:600;color:var(--ink)">
              <button class="cDel" style="color:var(--rust);font-size:12.5px;font-weight:700">Sil</button>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:9px">
              ${S.PALETTE.map(p => `<button class="cCol" data-h="${p.color}" style="width:26px;height:26px;border-radius:999px;background:${p.color};box-shadow:${c.color.toLowerCase() === p.color.toLowerCase() ? '0 0 0 2.5px ' + INK : 'inset 0 0 0 1px rgba(27,26,24,.1)'}"></button>`).join('')}
            </div></div>`).join('')}
        </div>
        <button class="ghost" id="cAdd" style="margin-top:14px">+ Yeni kategori</button>
        <div class="note">Sildiğin kategorinin kayıtları Genel'e taşınır. Değişiklikler bilgisayarla eşitlenir.</div>`;
      box.querySelector('.sh-x').onclick = closeSheet;
      box.querySelectorAll('[data-id]').forEach(row => {
        const id = row.dataset.id;
        row.querySelector('.cName').onchange = function () { S.updateCat(id, { name: this.value.trim() || 'Kategori' }); };
        row.querySelector('.cDel').onclick = () => {
          const n = S.eventsInCat(id, 'all').length;
          if (!confirm('“' + S.cat(id).name + '” silinsin mi?' + (n ? '\n' + n + ' kayıt Genel\'e taşınacak.' : ''))) return;
          S.deleteCat(id); draw(); render();
        };
        row.querySelectorAll('.cCol').forEach(b => b.onclick = () => { S.updateCat(id, { color: b.dataset.h }); draw(); render(); });
      });
      box.querySelector('#cAdd').onclick = () => { S.addCat('Yeni kategori', S.COLOR.gri); draw(); render(); };
    };
    draw(); sheet(box);
  }

  /* ---------------- jestler ---------------- */
  let gesturesBound = false;
  function bindGestures() {
    if (gesturesBound) return;
    gesturesBound = true;
    const sc = $('mScroll');

    /* yalnızca yatay kaydırma: önceki / sonraki dönem */
    let sx = 0, sy = 0, sw = false;
    sc.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; sw = true;
    }, { passive: true });
    sc.addEventListener('touchend', e => {
      if (!sw || sheetOpen) { sw = false; return; }
      sw = false;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    window.addEventListener('resize', () => { if (document.body.dataset.ui === 'mobile') fitTitle(); });

    document.addEventListener('keydown', e => {
      if (document.body.dataset.ui !== 'mobile') return;
      if (sheetOpen) { if (e.key === 'Escape') closeSheet(); return; }
      if (e.target.matches && e.target.matches('input,select,textarea')) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'n' || e.key === 'N') $('mAdd').click();
    });
  }

  /* ---------------- montaj ---------------- */
  function paintStatus() {
    const el = $('mKicker'); if (!el) return;
    const st = S.status;
    const i = el.querySelector('i');
    const col = st.kind === 'err' ? '#C25A4E' : (st.kind === 'sync' ? 'rgba(27,26,24,.3)' : '');
    if (col && !i) { render(); return; }
    if (!col && i) i.remove();
    if (col && i) i.style.background = col;
  }

  function mount() {
    if (!document.getElementById('mobile-css')) {
      const s = document.createElement('style'); s.id = 'mobile-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    if (!V) initState();
    buildShell();
    S.on('status', () => { if (document.body.dataset.ui === 'mobile') paintStatus(); });
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
  }

  return {
    mount: mount,
    render: () => { if (V && document.getElementById('mScroll')) render(); }
  };
})();
