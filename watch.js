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

  /* platformlar — düğme olarak seçilir; logo: markanın kendi işareti (YouTube, Netflix, Apple TV:
     Simple Icons, CC0). Prime Video ve Disney+ açık ikon setlerinde yok: marka renklerinde yazı işareti. */
  const LOGO = {
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/><path fill="#fff" d="M9.545 15.568V8.432L15.818 12z"/></svg>',
    netflix: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#e50914" d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z"/></svg>',
    appletv: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20.57 17.735h-1.815l-3.34-9.203h1.633l2.02 5.987c.075.231.273.9.586 2.012l.297-.997.33-1.006 2.094-6.004H24zm-5.344-.066a5.76 5.76 0 0 1-1.55.207c-1.23 0-1.84-.693-1.84-2.087V9.646h-1.063V8.532h1.121V7.081l1.476-.602v2.062h1.707v1.113H13.38v5.805c0 .446.074.75.214.932.14.182.396.264.75.264.207 0 .495-.041.883-.115zm-7.29-5.343c.017 1.764 1.55 2.358 1.567 2.366-.017.042-.248.842-.808 1.658-.487.71-.99 1.418-1.79 1.435-.783.016-1.03-.462-1.93-.462-.89 0-1.17.445-1.913.478-.758.025-1.344-.775-1.838-1.484-.998-1.451-1.765-4.098-.734-5.88.51-.89 1.426-1.451 2.416-1.46.75-.016 1.468.512 1.93.512.461 0 1.327-.627 2.234-.536.38.016 1.452.157 2.136 1.154-.058.033-1.278.743-1.27 2.219M6.468 7.988c.404-.495.685-1.18.61-1.864-.585.025-1.294.388-1.723.883-.38.437-.71 1.138-.619 1.806.652.05 1.328-.338 1.732-.825Z"/></svg>',
    prime: '<span class="lg-prime"><b>prime</b>video</span>',
    disney: '<span class="lg-disney">Disney<i>+</i></span>',
    web: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3C9.4 5.6 8.2 8.6 8.2 12s1.2 6.4 3.8 9"/></svg>'
  };
  /* tile: logonun durduğu küçük kutunun rengi (markanın kendi zemini) */
  const PLATS = [
    { id: 'youtube', name: 'YouTube', color: '#ff2d55', ink: '#fff', tile: '#ffffff' },
    { id: 'netflix', name: 'Netflix', color: '#e50914', ink: '#fff', tile: '#000000' },
    { id: 'appletv', name: 'Apple TV', color: '#f2f2f7', ink: '#111', tile: '#000000' },
    { id: 'prime', name: 'Prime Video', color: '#1aa3ff', ink: '#fff', tile: '#00a8e1' },
    { id: 'disney', name: 'Disney+', color: '#3d5afe', ink: '#fff', tile: '#0b1b5c' },
    { id: 'web', name: 'İnternet', color: '#22c55e', ink: '#062b14', tile: '#16a34a' }
  ];

  /* renk temaları — hepsi ilk tasarımla aynı canlılıkta, farklı renklerde.
     THEME seçilir (önizlemede ?wtema= ile denenir) */
  const THEMES = {
    mor: { name: 'Mor gece', bg: '#120f24', bg2: '#241345', g1: '#4a1d6e', g2: '#3a1240', item: '#211a3b', grad: ['#ff4d8d', '#ff7a59', '#ffb238'], gradInk: '#1a0c22', del: '#e5345f' },
    okyanus: { name: 'Okyanus', bg: '#06141c', bg2: '#0b2a3a', g1: '#0f5566', g2: '#0e3049', item: '#10283a', grad: ['#22d3ee', '#38bdf8', '#a3e635'], gradInk: '#04202a', del: '#ef4466' },
    bordo: { name: 'Bordo', bg: '#16070d', bg2: '#35101e', g1: '#6e1633', g2: '#451327', item: '#2c1019', grad: ['#ff5e62', '#ff8a5b', '#ffc65c'], gradInk: '#2a0a10', del: '#ff3b5c' },
    zumrut: { name: 'Zümrüt', bg: '#05130e', bg2: '#0d2b21', g1: '#145c43', g2: '#0f3a2c', item: '#0f271e', grad: ['#34d399', '#a3e635', '#facc15'], gradInk: '#06210f', del: '#f0446a' },
    elektrik: { name: 'Elektrik', bg: '#0a0e25', bg2: '#161e58', g1: '#2d2f99', g2: '#24185a', item: '#171c45', grad: ['#818cf8', '#c084fc', '#f472b6'], gradInk: '#170b2e', del: '#f43f6b' },
    sinema: { name: 'Sinema', bg: '#0e0d0d', bg2: '#1f1b19', g1: '#43301a', g2: '#331616', item: '#1d1a19', grad: ['#f43f5e', '#fb923c', '#fbbf24'], gradInk: '#220a08', del: '#f43f5e' }
  };
  let THEME = 'sinema';   /* seçilen tema */
  try { const q = new URLSearchParams(location.search).get('wtema'); if (q && THEMES[q]) THEME = q; } catch (e) { }
  const T = () => THEMES[THEME];
  const gradOf = t => `linear-gradient(120deg,${t.grad[0]} 0%,${t.grad[1]} 55%,${t.grad[2]} 100%)`;
  function themeVars(t) {
    return `--wl-bg:${t.bg};--wl-bg2:${t.bg2};--wl-g1:${t.g1};--wl-g2:${t.g2};--wl-item:${t.item};--wl-grad:${gradOf(t)};` +
      `--wl-grad-ink:${t.gradInk};--wl-glow:${S.rgba(t.grad[0], .35)};--wl-del:${t.del};--wl-acc:${t.grad[2]}`;
  }
  /* ajandadaki açma düğmesi de temanın renginde */
  function paintEntry() {
    let el = document.getElementById('watch-btn-css');
    if (!el) { el = document.createElement('style'); el.id = 'watch-btn-css'; document.head.appendChild(el); }
    const t = T();
    el.textContent = `body .mob .wbtn,body .d-watch{background:${gradOf(t)};color:${t.gradInk};box-shadow:0 2px 10px ${S.rgba(t.grad[0], .35)}}
body .mob .wbtn .pl,body .mob .wbtn b,body .d-watch span,body .d-watch b{background:${S.rgba(t.bg2, .9)};color:#fff}`;
  }
  paintEntry();
  const PMAP = {}; PLATS.forEach(p => PMAP[p.id] = p);
  const plat = id => PMAP[id] || { id: '', name: 'Platform yok', color: 'rgba(255,255,255,.25)', ink: '#fff', tile: '' };

  const CSS = `
.wl{--wl-card:rgba(255,255,255,.07);--wl-line:rgba(255,255,255,.1);--wl-ink:#fbf7ff;--wl-mut:rgba(251,247,255,.6);--wl-dim:rgba(251,247,255,.38);
  position:fixed;inset:0;z-index:90;display:flex;justify-content:center;
  background:rgba(8,6,18,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  font-family:-apple-system,BlinkMacSystemFont,system-ui,"Segoe UI","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}
.wl *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
/* sıfırlama :where ile — bileşen kurallarını ezmesin */
:where(.wl) button{font:inherit;color:inherit;border:0;background:none;padding:0;cursor:pointer}
.wl input{font-family:inherit}
@keyframes wlUp{from{transform:translateY(36px);opacity:0}to{transform:none;opacity:1}}
.wl-page{position:relative;width:100%;max-width:440px;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;
  color:var(--wl-ink);background:radial-gradient(120% 60% at 100% 0%,var(--wl-g1) 0%,transparent 60%),
  radial-gradient(90% 50% at 0% 100%,var(--wl-g2) 0%,transparent 70%),linear-gradient(180deg,var(--wl-bg2),var(--wl-bg) 45%);
  padding:calc(14px + env(safe-area-inset-top,0px)) 18px calc(40px + env(safe-area-inset-bottom,0px))}
.wl-page.in{animation:wlUp .32s cubic-bezier(.2,.8,.2,1)}
@media(min-width:700px){.wl-page{height:calc(100% - 48px);margin-top:24px;border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.45)}}
@media(prefers-reduced-motion:reduce){.wl-page.in{animation:none}}

.wl-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.wl-back{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:700;color:var(--wl-mut);padding:6px 2px}
.wl-back svg{width:16px;height:16px}
.wl-cnt{font-size:12px;font-weight:700;color:var(--wl-mut);background:var(--wl-card);border:1px solid var(--wl-line);border-radius:999px;padding:5px 11px}
.wl-h1{margin:14px 0 2px;font-size:34px;line-height:1.05;font-weight:800;letter-spacing:-.03em}
.wl-sub{font-size:13.5px;color:var(--wl-mut);margin:0 0 16px}

.wl-form{background:var(--wl-card);border:1px solid var(--wl-line);border-radius:22px;padding:6px 14px 14px}
.wl-in{width:100%;border:0;background:transparent;color:var(--wl-ink);outline:none;padding:13px 0;font-size:18px;font-weight:700;letter-spacing:-.01em}
.wl-in::placeholder{color:var(--wl-dim)}
.wl-in.note{font-size:14.5px;font-weight:500;padding:11px 0;border-top:1px solid var(--wl-line)}
.wl-lab{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--wl-dim);margin:10px 0 8px}
.wl-plats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.wl-plat{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border-radius:14px;padding:8px 6px;
  font-size:13.5px;font-weight:700;background:rgba(255,255,255,.06);border:1.5px solid var(--wl-line);color:var(--wl-ink);transition:transform .12s,background .15s}
.wl-plat:active{transform:scale(.96)}
.wl-plat.on{border-color:transparent}
.wl-save{margin-top:14px;width:100%;padding:15px;border-radius:16px;background:var(--wl-grad);color:var(--wl-grad-ink);font-size:15.5px;font-weight:800;letter-spacing:-.01em;
  box-shadow:0 10px 26px var(--wl-glow)}
.wl-save:active{transform:scale(.985)}
.wl-row2{display:flex;gap:8px;margin-top:8px}
.wl-row2 button{flex:1;padding:12px;border-radius:14px;font-size:13.5px;font-weight:700;background:rgba(255,255,255,.08);color:var(--wl-mut)}
.wl-row2 .del{color:#fff;background:var(--wl-del)}

.wl-filt{display:flex;gap:7px;overflow-x:auto;margin:22px -18px 0;padding:0 18px 4px;scrollbar-width:none}
.wl-filt::-webkit-scrollbar{display:none}
.wl-chip{flex:none;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;font-size:13px;font-weight:700;
  background:var(--wl-card);border:1px solid var(--wl-line);color:var(--wl-mut)}
.wl-chip i{width:8px;height:8px;border-radius:50%}
.wl-chip b{font-weight:800;opacity:.6}
.wl-chip.on{background:var(--wl-ink);color:var(--wl-bg);border-color:transparent}
.wl-chip .lg{width:18px;height:18px;border-radius:5px}

.wl-list{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.wl-sw{position:relative;border-radius:18px;overflow:hidden}
.wl-sw-bg{position:absolute;inset:0;display:flex;justify-content:space-between;background:var(--wl-del);opacity:0}
.wl-sw.moving .wl-sw-bg,.wl-sw.open .wl-sw-bg{opacity:1}
.wl-sw-bg button{width:84px;color:#fff;font-size:12.5px;font-weight:800}
.wl-item{position:relative;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:18px;
  background:var(--wl-item);border:1px solid var(--wl-line);touch-action:pan-y;transition:transform .22s cubic-bezier(.2,.8,.2,1)}
.wl-sw.moving .wl-item{transition:none}
.wl-tag{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;letter-spacing:-.02em;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.wl-tag svg{width:26px;height:26px}
.wl-tag .lg-prime{font-size:8.5px}.wl-tag .lg-prime b{font-size:12.5px}
.wl-tag .lg-disney{font-size:11.5px}
.lg{flex:none;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border-radius:6px}
.lg svg{width:70%;height:70%}
.lg-prime{display:flex;flex-direction:column;align-items:center;line-height:.95;color:#fff;font-size:7px;font-weight:600;letter-spacing:.01em}
.lg-prime b{font-size:10px;font-weight:800;letter-spacing:-.02em}
.lg-disney{color:#fff;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-weight:700;font-size:9.5px;letter-spacing:-.03em;white-space:nowrap}
.lg-disney i{font-style:normal;color:#5ad1ff;font-family:-apple-system,system-ui,sans-serif;font-weight:800}
.wl-plat .lg{width:22px;height:22px}
.wl-plat .lg .lg-prime{font-size:4.5px}.wl-plat .lg .lg-prime b{font-size:6.5px}
.wl-plat .lg .lg-disney{font-size:6px}
.wl-chip .lg .lg-prime{font-size:4px}.wl-chip .lg .lg-prime b{font-size:5.5px}
.wl-chip .lg .lg-disney{font-size:5px}
.wl-body{flex:1;min-width:0;text-align:left}
.wl-t{font-size:15.5px;font-weight:700;letter-spacing:-.01em;line-height:1.25;overflow-wrap:anywhere}
.wl-n{font-size:12.5px;color:var(--wl-mut);margin-top:2px;overflow-wrap:anywhere}
.wl-p{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;margin-top:4px;color:var(--wl-mut)}
.wl-p i{width:7px;height:7px;border-radius:50%}
.wl-ok{flex:none;width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;color:var(--wl-grad-ink)}
.wl-ok svg{width:15px;height:15px;opacity:0}
.wl-item.done .wl-ok{background:var(--wl-grad);border-color:transparent}
.wl-item.done .wl-ok svg{opacity:1}
.wl-item.done .wl-t{text-decoration:line-through;text-decoration-color:var(--wl-dim);color:var(--wl-mut)}
.wl-item.done .wl-tag{opacity:.45}
.wl-empty{text-align:center;color:var(--wl-mut);font-size:14px;line-height:1.5;padding:26px 10px;border:1.5px dashed var(--wl-line);border-radius:18px}
.wl-sec{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:22px;padding:4px 2px;font-size:13px;font-weight:800;color:var(--wl-mut)}
.wl-sec svg{width:15px;height:15px;transition:transform .2s}
.wl-sec.open svg{transform:rotate(90deg)}
.wl-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(26px + env(safe-area-inset-bottom,0px));z-index:95;
  display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:999px;background:#fbf7ff;color:#120f24;font-size:13px;font-weight:700;
  box-shadow:0 12px 30px rgba(0,0,0,.35);white-space:nowrap}
.wl-toast button{background:#120f24;color:#fbf7ff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800}
.wl button:focus-visible,.wl input:focus-visible{outline:2px solid var(--wl-acc);outline-offset:2px}
`;

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'
  };
  /* logonun kendi zeminli küçük kutusu */
  const logo = p => `<span class="lg" style="background:${p.tile || 'rgba(255,255,255,.18)'}">${LOGO[p.id] || ''}</span>`;

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
    return `<button class="wl-plat" data-p="${p.id}" style="${platStyle(p, p.id === st.plat)}">${logo(p)}${esc(p.name)}</button>`;
  }
  function platStyle(p, on) {
    return on ? `background:${p.color};color:${p.ink};box-shadow:0 4px 12px ${S.rgba(p.color, .55)}` : '';
  }
  function paintPlat(btn, on) {
    const p = PMAP[btn.dataset.p];
    btn.classList.toggle('on', on);
    btn.setAttribute('style', platStyle(p, on));
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
      shown.map(p => `<button class="wl-chip${st.filter === p.id ? ' on' : ''}" data-f="${p.id}">${logo(p)}${esc(p.name)} <b>${cnt[p.id]}</b></button>`).join('') : '';
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
    el.innerHTML = `<div class="wl-tag" style="background:${w.plat ? p.tile : 'rgba(255,255,255,.1)'}">${LOGO[w.plat] || '<span style="font-size:18px;opacity:.6">▶</span>'}</div>
      <button class="wl-body"><div class="wl-t">${esc(w.title)}</div>${w.note ? `<div class="wl-n">${esc(w.note)}</div>` : ''}
        <div class="wl-p">${esc(p.name)}</div></button>
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
