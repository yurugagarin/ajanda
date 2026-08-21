"use strict";
/* ===========================================================
   boot.js — hangi görünümün açılacağına karar verir
   Telefon / dar ekran  -> mobile.js
   Bilgisayar           -> desktop.js
   Zorlamak için: ?ui=mobile veya ?ui=desktop (bir kez yazınca kalır)
   =========================================================== */
(function () {
  const q = new URLSearchParams(location.search).get('ui');
  if (q === 'mobile' || q === 'desktop' || q === 'auto') {
    try { localStorage.setItem('ajanda_ui', q); } catch (e) { }
    history.replaceState(null, '', location.pathname);
  }
  let pref = 'auto';
  try { pref = localStorage.getItem('ajanda_ui') || 'auto'; } catch (e) { }

  const isPhone = () =>
    window.matchMedia('(max-width: 820px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1100);

  function pick() {
    if (pref === 'mobile') return 'mobile';
    if (pref === 'desktop') return 'desktop';
    return isPhone() ? 'mobile' : 'desktop';
  }

  let current = null;

  function mount() {
    const want = pick();
    if (want === current) return;
    current = want;
    document.body.dataset.ui = want;
    if (want === 'mobile') MobileView.mount(); else DesktopView.mount();
  }

  function rerender() {
    // kullanıcı bir alana yazarken ekranı yeniden çizip odağı kaçırma
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'file') return;
    if (current === 'mobile') MobileView.render(); else if (current === 'desktop') DesktopView.render();
  }

  Store.on('change', rerender);
  Store.on('status', rerender);

  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(mount, 200); });

  mount();
  Store.startAuto();
})();
