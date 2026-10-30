"use strict";
/* ===========================================================
   watch.js — İzlenecekler listesi
   Ajandadan ayrı bir sayfa: film, dizi, stand-up… ne zaman izleneceği
   önemli değil, sadece "aklımda kalsın" listesi. Ajandanın üstünde
   açılır, kendi renkleri vardır; veriler ajandayla birlikte eşitlenir.
   Telefon (mobile.js) ve bilgisayar (desktop.js) aynı sayfayı açar.
   =========================================================== */
var WatchView = (function () {
  const S = Store;

  /* platformlar — düğme olarak seçilir */
  const PLATS = [
    { id: 'youtube', name: 'YouTube', color: '#f6b3b8', ink: '#5a1f26' },
    { id: 'netflix', name: 'Netflix', color: '#e79a9a', ink: '#4f1616' },
    { id: 'appletv', name: 'Apple TV', color: '#d9d9e0', ink: '#2c2c33' },
    { id: 'prime', name: 'Prime Video', color: '#a9d2f2', ink: '#14375a' },
    { id: 'disney', name: 'Disney+', color: '#bcc3f5', ink: '#20286b' },
    { id: 'web', name: 'İnternet', color: '#ade3c4', ink: '#174a2e' }
  ];

  /* renk temaları — hepsi pastel; THEME seçilir (önizlemede ?wtema= ile denenir) */
  const THEMES = {
    lavanta: { name: 'Lavanta', bg: '#f4f0fa', bg2: '#e9e1f6', card: '#ffffff', item: '#ffffff', line: '#e2d9f0', ink: '#2e2840', mut: '#6f6786', dim: '#a59cbb',
      acc: '#c3b1ea', accInk: '#2e2149', ok: '#b49de6', del: '#eeb4bf', btn: '#d9ccf3', btnInk: '#3b2d5c', dark: false },
    seftali: { name: 'Şeftali', bg: '#fdf3ec', bg2: '#fbe4d6', card: '#ffffff', item: '#fffaf6', line: '#f2ddcf', ink: '#3b2a22', mut: '#7c665b', dim: '#b9a295',
      acc: '#f6c1a4', accInk: '#4a2615', ok: '#f0a988', del: '#efb0ad', btn: '#f9d4bf', btnInk: '#5a321e', dark: false },
    nane: { name: 'Nane', bg: '#eef7f2', bg2: '#dcefe5', card: '#ffffff', item: '#fbfefc', line: '#d3e8dc', ink: '#21352b', mut: '#5d7568', dim: '#98b0a3',
      acc: '#a9dcc3', accInk: '#173d2b', ok: '#8dd0b0', del: '#efb3b3', btn: '#c5e8d6', btnInk: '#1f4a35', dark: false },
    gokyuzu: { name: 'Gökyüzü', bg: '#eef4fb', bg2: '#dce8f6', card: '#ffffff', item: '#fbfdff', line: '#d6e2f0', ink: '#223042', mut: '#5f7086', dim: '#9badc3',
      acc: '#b0cdee', accInk: '#173252', ok: '#93bbe6', del: '#efb3bb', btn: '#cadcf3', btnInk: '#22406a', dark: false },
    gul: { name: 'Gül kurusu', bg: '#f9eff0', bg2: '#f2dfe2', card: '#ffffff', item: '#fffbfb', line: '#ecd6da', ink: '#3a262b', mut: '#7b6268', dim: '#b89ea4',
      acc: '#e7b8c1', accInk: '#4b1f2a', ok: '#dca2ae', del: '#e9a9a9', btn: '#f0cdd4', btnInk: '#5a2c38', dark: false },
    gece: { name: 'Gece pastel', bg: '#2b2a3d', bg2: '#37344f', card: 'rgba(255,255,255,.06)', item: '#34324a', line: 'rgba(255,255,255,.09)', ink: '#f1eef8', mut: '#b7b2cc', dim: '#8a85a3',
      acc: '#c9b8ee', accInk: '#2b2140', ok: '#c9b8ee', del: '#e7a6b3', btn: '#cdbdf0', btnInk: '#2e2347', dark: true }
  };
  let THEME = 'lavanta';
  try { const q = new URLSearchParams(location.search).get('wtema'); if (q && THEMES[q]) THEME = q; } catch (e) { }
  const T = () => THEMES[THEME];
  function themeVars(t) {
    return `--wl-bg:${t.bg};--wl-bg2:${t.bg2};--wl-card:${t.card};--wl-item:${t.item};--wl-line:${t.line};--wl-ink:${t.ink};--wl-mut:${t.mut};--wl-dim:${t.dim};` +
      `--wl-acc:${t.acc};--wl-acc-ink:${t.accInk};--wl-ok:${t.ok};--wl-del:${t.del};--wl-shadow:${t.dark ? 'rgba(0,0,0,.35)' : 'rgba(60,40,90,.10)'}`;
  }
  /* ajandadaki açma düğmesi de temanın renginde */
  function paintEntry() {
    let el = document.getElementById('watch-btn-css');
    if (!el) { el = document.createElement('style'); el.id = 'watch-btn-css'; document.head.appendChild(el); }
    const t = T();
    el.textContent = `body .mob .wbtn,body .d-watch{background:${t.btn};color:${t.btnInk};box-shadow:0 2px 8px rgba(60,40,90,.12)}
body .mob .wbtn .pl,body .mob .wbtn b,body .d-watch span,body .d-watch b{background:${t.btnInk};color:${t.btn}}`;
  }
  paintEntry();
  const PMAP = {}; PLATS.forEach(p => PMAP[p.id] = p);
  const plat = id => PMAP[id] || { id: '', name: 'Platform yok', color: '#dcd8e3', ink: '#3a3448' };

  const CSS = `
.wl{position:fixed;inset:0;z-index:90;display:flex;justify-content:center;
  background:rgba(30,24,44,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}
.wl *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
/* sıfırlama :where ile — bileşen kurallarını ezmesin */
:where(.wl) button{font:inherit;color:inherit;border:0;background:none;padding:0;cursor:pointer}
.wl input{font-family:inherit}
@keyframes wlUp{from{transform:translateY(36px);opacity:0}to{transform:none;opacity:1}}
.wl-page{position:relative;width:100%;max-width:440px;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;
  color:var(--wl-ink);background:linear-gradient(180deg,var(--wl-bg2) 0%,var(--wl-bg) 40%);
  padding:calc(14px + env(safe-area-inset-top,0px)) 18px calc(40px + env(safe-area-inset-bottom,0px))}
.wl-page.in{animation:wlUp .32s cubic-bezier(.2,.8,.2,1)}
@media(min-width:700px){.wl-page{height:calc(100% - 48px);margin-top:24px;border-radius:28px;box-shadow:0 30px 80px rgba(20,14,34,.3)}}
@media(prefers-reduced-motion:reduce){.wl-page.in{animation:none}}

.wl-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.wl-back{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:700;color:var(--wl-mut);padding:6px 2px}
.wl-back svg{width:16px;height:16px}
.wl-cnt{font-size:12px;font-weight:700;color:var(--wl-mut);background:var(--wl-card);border:1px solid var(--wl-line);border-radius:999px;padding:5px 11px}
.wl-h1{margin:14px 0 2px;font-size:34px;line-height:1.05;font-weight:800;letter-spacing:-.03em}
.wl-sub{font-size:13.5px;color:var(--wl-mut);margin:0 0 16px}

.wl-form{background:var(--wl-card);border:1px solid var(--wl-line);border-radius:22px;padding:6px 14px 14px;box-shadow:0 6px 20px var(--wl-shadow)}
.wl-in{width:100%;border:0;background:transparent;color:var(--wl-ink);outline:none;padding:13px 0;font-size:18px;font-weight:700;letter-spacing:-.01em}
.wl-in::placeholder{color:var(--wl-dim)}
.wl-in.note{font-size:14.5px;font-weight:500;padding:11px 0;border-top:1px solid var(--wl-line)}
.wl-lab{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--wl-dim);margin:10px 0 8px}
.wl-plats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.wl-plat{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border-radius:14px;padding:8px 6px;
  font-size:13.5px;font-weight:700;background:var(--wl-item);border:1.5px solid var(--wl-line);color:var(--wl-ink);transition:transform .12s,background .15s}
.wl-plat i{width:9px;height:9px;border-radius:50%;flex:none}
.wl-plat:active{transform:scale(.96)}
.wl-plat.on{border-color:transparent}
.wl-save{margin-top:14px;width:100%;padding:15px;border-radius:16px;background:var(--wl-acc);color:var(--wl-acc-ink);font-size:15.5px;font-weight:800;letter-spacing:-.01em}
.wl-save:active{transform:scale(.985)}
.wl-row2{display:flex;gap:8px;margin-top:8px}
.wl-row2 button{flex:1;padding:12px;border-radius:14px;font-size:13.5px;font-weight:700;background:var(--wl-line);color:var(--wl-mut)}
.wl-row2 .del{color:var(--wl-ink);background:var(--wl-del)}

.wl-filt{display:flex;gap:7px;overflow-x:auto;margin:22px -18px 0;padding:0 18px 4px;scrollbar-width:none}
.wl-filt::-webkit-scrollbar{display:none}
.wl-chip{flex:none;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:700;
  background:var(--wl-card);border:1px solid var(--wl-line);color:var(--wl-mut)}
.wl-chip i{width:8px;height:8px;border-radius:50%}
.wl-chip b{font-weight:800;opacity:.6}
.wl-chip.on{background:var(--wl-ink);color:var(--wl-bg);border-color:transparent}

.wl-list{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.wl-sw{position:relative;border-radius:18px;overflow:hidden}
.wl-sw-bg{position:absolute;inset:0;display:flex;justify-content:space-between;background:var(--wl-del);opacity:0}
.wl-sw.moving .wl-sw-bg,.wl-sw.open .wl-sw-bg{opacity:1}
.wl-sw-bg button{width:84px;color:var(--wl-ink);font-size:12.5px;font-weight:800}
.wl-item{position:relative;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:18px;
  background:var(--wl-item);border:1px solid var(--wl-line);box-shadow:0 2px 8px var(--wl-shadow);touch-action:pan-y;transition:transform .22s cubic-bezier(.2,.8,.2,1)}
.wl-sw.moving .wl-item{transition:none}
.wl-tag{flex:none;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;letter-spacing:-.02em}
.wl-body{flex:1;min-width:0;text-align:left}
.wl-t{font-size:15.5px;font-weight:700;letter-spacing:-.01em;line-height:1.25;overflow-wrap:anywhere}
.wl-n{font-size:12.5px;color:var(--wl-mut);margin-top:2px;overflow-wrap:anywhere}
.wl-p{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;margin-top:4px;color:var(--wl-mut)}
.wl-p i{width:7px;height:7px;border-radius:50%}
.wl-ok{flex:none;width:30px;height:30px;border-radius:50%;border:2px solid var(--wl-dim);display:flex;align-items:center;justify-content:center;color:var(--wl-acc-ink)}
.wl-ok svg{width:15px;height:15px;opacity:0}
.wl-item.done .wl-ok{background:var(--wl-ok);border-color:transparent}
.wl-item.done .wl-ok svg{opacity:1}
.wl-item.done .wl-t{text-decoration:line-through;text-decoration-color:var(--wl-dim);color:var(--wl-mut)}
.wl-item.done .wl-tag{opacity:.45}
.wl-empty{text-align:center;color:var(--wl-mut);font-size:14px;line-height:1.5;padding:26px 10px;border:1.5px dashed var(--wl-line);border-radius:18px}
.wl-sec{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:22px;padding:4px 2px;font-size:13px;font-weight:800;color:var(--wl-mut)}
.wl-sec svg{width:15px;height:15px;transition:transform .2s}
.wl-sec.open svg{transform:rotate(90deg)}
.wl-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(26px + env(safe-area-inset-bottom,0px));z-index:95;
  display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:999px;background:#2e2840;color:#f6f2fb;font-size:13px;font-weight:700;
  box-shadow:0 12px 30px rgba(20,14,34,.25);white-space:nowrap}
.wl-toast button{background:#f6f2fb;color:#2e2840;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800}
.wl button:focus-visible,.wl input:focus-visible{outline:2px solid var(--wl-acc);outline-offset:2px}
`;

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
  };
  /* platform rozetinde kısa ad */
  const ABBR = { youtube: 'YT', netflix: 'N', appletv: 'tv', prime: 'PV', disney: 'D+', web: 'www' };

  let root = null, isOpen = false, pushed = false, lastPop = 0;
  const st = { edit: null, plat: '', filter: '', showDone: false };

  function esc(s) { return S.esc(s); }
  function items() { return (S.data.watch || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)); }

  /* ---------------- açma / kapama ---------------- */
  function open() {
    if (isOpen) return;
    if (!document.getElementById('watch-css')) {
      const s = document.createElement('style'); s.id = 'watch-css'; s.textContent = CSS; document.head.appendChild(s);
    }
    isOpen = true;
    st.edit = null; st.plat = ''; st.showDone = false;
    root = document.createElement('div'); root.className = 'wl';
    root.setAttribute('style', themeVars(T()));
    root.innerHTML = '<div class="wl-page in" id="wlPage"></div>';
    root.addEventListener('click', e => { if (e.target === root) close(); });
    document.body.appendChild(root);
    try { history.pushState({ ajanda: 'izle' }, ''); pushed = true; } catch (e) { pushed = false; }
    draw();
  }
  function close() {
    if (!isOpen) return;
    if (pushed) { pushed = false; history.back(); return; }   /* popstate kapatır */
    teardown();
  }
  function teardown() {
    isOpen = false;
    if (root) root.remove();
    root = null;
    const t = document.getElementById('wlToast'); if (t) t.remove();
  }
  window.addEventListener('popstate', () => {
    if (!isOpen) return;
    pushed = false; lastPop = Date.now();
    teardown();
  });
  document.addEventListener('keydown', e => { if (isOpen && e.key === 'Escape') close(); });
  /* eşitlemeyle gelen değişiklikleri göster (yazarken listeyi tazele, formu bozma) */
  S.on('change', () => { if (isOpen) drawList(); });

  /* ---------------- çizim ---------------- */
  function draw() {
    const page = root.querySelector('#wlPage');
    const ed = st.edit ? (S.data.watch || []).filter(w => w.id === st.edit)[0] : null;
    if (st.edit && !ed) st.edit = null;
    page.innerHTML = `
      <div class="wl-top">
        <button class="wl-back" id="wlClose">${ICON.back}Ajanda</button>
        <span class="wl-cnt" id="wlCnt"></span>
      </div>
      <h1 class="wl-h1">İzlenecekler</h1>
      <p class="wl-sub">Ne zaman olduğu önemli değil — aklında kalsın.</p>
      <div class="wl-form">
        <input class="wl-in" id="wlTitle" placeholder="Ne izleyeceksin?" autocomplete="off" enterkeyhint="next" value="${ed ? S.escAttr(ed.title) : ''}">
        <input class="wl-in note" id="wlNote" placeholder="Not — kim önerdi, hangi sezon…" autocomplete="off" enterkeyhint="done" value="${ed ? S.escAttr(ed.note) : ''}">
        <div class="wl-lab">Nereden izleyeceksin?</div>
        <div class="wl-plats" id="wlPlats">${PLATS.map(p => platBtn(p)).join('')}</div>
        <button class="wl-save" id="wlSave">${ed ? 'Güncelle' : 'Listeye ekle'}</button>
        ${ed ? '<div class="wl-row2"><button id="wlCancel">Vazgeç</button><button class="del" id="wlDel">Sil</button></div>' : ''}
      </div>
      <div class="wl-filt" id="wlFilt"></div>
      <div class="wl-list" id="wlList"></div>
      <div id="wlDoneBox"></div>`;
    page.querySelector('#wlClose').onclick = close;
    page.querySelectorAll('.wl-plat').forEach(b => b.onclick = () => {
      st.plat = st.plat === b.dataset.p ? '' : b.dataset.p;
      page.querySelectorAll('.wl-plat').forEach(x => paintPlat(x, x.dataset.p === st.plat));
    });
    page.querySelector('#wlSave').onclick = save;
    page.querySelector('#wlTitle').onkeydown = e => { if (e.key === 'Enter') page.querySelector('#wlNote').focus(); };
    page.querySelector('#wlNote').onkeydown = e => { if (e.key === 'Enter') save(); };
    const c = page.querySelector('#wlCancel'); if (c) c.onclick = () => { st.edit = null; st.plat = ''; draw(); };
    const d = page.querySelector('#wlDel'); if (d) d.onclick = () => remove(st.edit);
    drawList();
  }
  function platBtn(p) {
    return `<button class="wl-plat" data-p="${p.id}" style="${platStyle(p, p.id === st.plat)}"><i style="background:${p.color}"></i>${esc(p.name)}</button>`;
  }
  function platStyle(p, on) {
    return on ? `background:${p.color};color:${p.ink};box-shadow:0 4px 12px ${S.rgba(p.color, .55)}` : '';
  }
  function paintPlat(btn, on) {
    const p = PMAP[btn.dataset.p];
    btn.classList.toggle('on', on);
    btn.setAttribute('style', platStyle(p, on));
    btn.querySelector('i').style.background = on ? p.ink : p.color;
  }

  function drawList() {
    if (!root) return;
    const page = root.querySelector('#wlPage'); if (!page) return;
    const all = items(), todo = all.filter(w => !w.done), done = all.filter(w => w.done);
    page.querySelector('#wlCnt').textContent = todo.length + ' izlenecek' + (done.length ? ' · ' + done.length + ' izlendi' : '');

    /* platform süzgeci: yalnızca listede olan platformlar */
    const cnt = {}; todo.forEach(w => cnt[w.plat || ''] = (cnt[w.plat || ''] || 0) + 1);
    const shown = PLATS.filter(p => cnt[p.id]);
    if (st.filter && !cnt[st.filter]) st.filter = '';
    const filt = page.querySelector('#wlFilt');
    filt.innerHTML = todo.length && shown.length ? `<button class="wl-chip${st.filter ? '' : ' on'}" data-f="">Tümü <b>${todo.length}</b></button>` +
      shown.map(p => `<button class="wl-chip${st.filter === p.id ? ' on' : ''}" data-f="${p.id}"><i style="background:${p.color}"></i>${esc(p.name)} <b>${cnt[p.id]}</b></button>`).join('') : '';
    filt.querySelectorAll('.wl-chip').forEach(b => b.onclick = () => { st.filter = b.dataset.f; drawList(); });

    const list = page.querySelector('#wlList');
    list.innerHTML = '';
    const vis = st.filter ? todo.filter(w => w.plat === st.filter) : todo;
    if (!vis.length) list.innerHTML = `<div class="wl-empty">${all.length ? 'Burada izlenecek bir şey kalmadı.' : 'Listen boş.<br>Yukarıya bir film, dizi ya da stand-up yaz, platformunu seç, ekle.'}</div>`;
    vis.forEach(w => list.appendChild(card(w)));

    const box = page.querySelector('#wlDoneBox');
    box.innerHTML = '';
    if (done.length) {
      const h = document.createElement('button'); h.className = 'wl-sec' + (st.showDone ? ' open' : '');
      h.innerHTML = `<span>İzlediklerim · ${done.length}</span>${ICON.chev}`;
      h.onclick = () => { st.showDone = !st.showDone; drawList(); };
      box.appendChild(h);
      if (st.showDone) {
        const l = document.createElement('div'); l.className = 'wl-list';
        done.forEach(w => l.appendChild(card(w)));
        box.appendChild(l);
      }
    }
  }

  function card(w) {
    const p = plat(w.plat);
    const el = document.createElement('div');
    el.className = 'wl-item' + (w.done ? ' done' : '');
    el.innerHTML = `<div class="wl-tag" style="background:${p.color};color:${p.ink}">${ABBR[w.plat] || '•'}</div>
      <button class="wl-body"><div class="wl-t">${esc(w.title)}</div>${w.note ? `<div class="wl-n">${esc(w.note)}</div>` : ''}
        <div class="wl-p">${w.plat ? `<i style="background:${p.color}"></i>` : ''}${esc(p.name)}</div></button>
      <button class="wl-ok" aria-label="${w.done ? 'İzlenmedi yap' : 'İzledim'}">${ICON.check}</button>`;
    el.querySelector('.wl-ok').onclick = e => {
      e.stopPropagation();
      S.updateWatch(w.id, { done: !w.done });
      toast(w.done ? 'Listeye geri alındı' : 'İzlendi ✓');
    };
    el.querySelector('.wl-body').onclick = () => {
      st.edit = w.id; st.plat = w.plat || ''; draw();
      root.querySelector('#wlPage').scrollTop = 0;
    };
    return swipeable(el, w);
  }

  /* kartı yana çekince altından Sil (ajandadaki gibi) */
  let openSw = null;
  function swipeable(fg, w) {
    const wrap = document.createElement('div'); wrap.className = 'wl-sw';
    const bg = document.createElement('div'); bg.className = 'wl-sw-bg';
    bg.innerHTML = '<button>Sil</button><button>Sil</button>';
    wrap.appendChild(bg); wrap.appendChild(fg);
    let x0 = 0, y0 = 0, base = 0, cur = 0, mode = '', wdt = 0;
    const set = x => { cur = x; fg.style.transform = x ? `translateX(${x}px)` : ''; };
    const api = { close: () => { wrap.classList.remove('open'); set(0); } };
    bg.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); remove(w.id); });
    fg.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      if (openSw && openSw !== api) { openSw.close(); openSw = null; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; base = cur; mode = ''; wdt = wrap.offsetWidth;
    }, { passive: true });
    fg.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - x0, dy = e.touches[0].clientY - y0;
      if (!mode) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { mode = 'h'; wrap.classList.add('moving'); }
        else if (Math.abs(dy) > 8) mode = 'v';
      }
      if (mode === 'h') set(base + dx);
    }, { passive: true });
    const end = () => {
      if (mode !== 'h') { mode = ''; return; }
      mode = ''; wrap.classList.remove('moving');
      if (Math.abs(cur) > wdt * 0.5) { set(cur > 0 ? wdt : -wdt); setTimeout(() => remove(w.id), 160); return; }
      if (Math.abs(cur) > 50) { set(cur > 0 ? 84 : -84); wrap.classList.add('open'); openSw = api; } else api.close();
    };
    fg.addEventListener('touchend', end, { passive: true });
    fg.addEventListener('touchcancel', end, { passive: true });
    fg.addEventListener('click', e => { if (cur) { e.stopPropagation(); e.preventDefault(); api.close(); } }, true);
    return wrap;
  }

  /* ---------------- işlemler ---------------- */
  function save() {
    const page = root.querySelector('#wlPage');
    const title = page.querySelector('#wlTitle').value.trim();
    const note = page.querySelector('#wlNote').value.trim();
    if (!title) { page.querySelector('#wlTitle').focus(); toast('Önce ne izleyeceğini yaz'); return; }
    if (st.edit) { S.updateWatch(st.edit, { title: title, note: note, plat: st.plat }); toast('Güncellendi'); }
    else { S.addWatch({ title: title, note: note, plat: st.plat }); toast('Listeye eklendi'); }
    st.edit = null; st.plat = ''; st.filter = '';
    draw();
  }
  function remove(id) {
    const it = S.deleteWatch(id);
    if (st.edit === id) { st.edit = null; st.plat = ''; }
    draw();
    toast('Silindi', () => { S.restoreWatch(it); drawList(); });
  }

  let toastT = null;
  function toast(msg, undo) {
    let t = document.getElementById('wlToast');
    if (!t) { t = document.createElement('div'); t.id = 'wlToast'; t.className = 'wl-toast'; document.body.appendChild(t); }
    t.className = 'wl-toast';
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>Geri al</button>' : ''}`;
    if (undo) t.querySelector('button').onclick = () => { undo(); t.remove(); };
    clearTimeout(toastT);
    toastT = setTimeout(() => { if (t.parentNode) t.remove(); }, undo ? 6000 : 1800);
  }

  return {
    open: open, close: close,
    isOpen: () => isOpen,
    /* telefonun geri tuşu bu sayfayı kapattıysa ajanda ayrıca geri gitmesin */
    poppedRecently: () => Date.now() - lastPop < 250,
    count: () => (S.data.watch || []).filter(w => !w.done).length,
    PLATS: PLATS
  };
})();
