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
    /* yalnızca ui parametresini sil; telefon bağlantısı (gist, k) adreste kalsın */
    const u = new URL(location.href); u.searchParams.delete('ui');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
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

  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(mount, 200); });

  /* yeni sürüm kontrolü: telefon sayfanın eski kopyasını açtıysa (ana ekran uygulaması,
     GitHub Pages önbelleği) sunucudaki version.json'a bakılır; sürüm farklıysa sayfa
     önbelleği atlayan bir adresle yeniden yüklenir. version.json her güncellemede
     store.js içindeki VERSION ile birlikte artırılmalı. */
  function checkUpdate() {
    if (!/^https?:$/.test(location.protocol)) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;   /* yazarken yenileme */
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j || !j.v || String(j.v) === String(Store.VERSION)) return;
        const key = 'ajanda_guncelle_' + j.v;
        try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) { }
        const u = new URL(location.href); u.searchParams.set('_s', j.v);
        location.replace(u.toString());
      })
      .catch(() => { });
  }
  /* güncellemeden sonra adresteki işareti temizle (gist/k gibi diğerleri kalır) */
  if (new URLSearchParams(location.search).has('_s')) {
    const u = new URL(location.href); u.searchParams.delete('_s');
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }

  mount();
  Store.startAuto();
  setTimeout(checkUpdate, 800);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
})();
