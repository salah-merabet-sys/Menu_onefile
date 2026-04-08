/* ============================================================
   MAISON ÉLITE — PUBLIC MENU  |  assets/js/menu.js

   Loading strategy:
   1. Read localStorage immediately — render at once, no spinner.
   2. If no cache exists — show spinner, wait for fetch.
   3. Fetch menu.json with cache: "no-store" (no timestamp needed).
   4. Compare version field — only re-render if version changed.
   5. On fetch failure — keep whatever is already rendered.
   6. Minimal hardcoded fallback if both cache and fetch fail.
============================================================ */

const Menu = (() => {

  let data        = { categories: [], items: [] };
  let activeCat   = 'all';
  let searchQ     = '';
  let liveVersion = null; /* version string currently rendered */

  /* ── Minimal fallback shown when everything else fails ── */
  const FALLBACK = {
    version: 'fallback',
    categories: [
      { id: 'mains', name: 'Main Courses', icon: 'fa-fire-flame-curved', description: 'Our kitchen favorites' }
    ],
    items: [
      { id: 0, name: 'Menu Unavailable', category: 'mains', price: 0,
        description: 'Please check back shortly or ask a member of staff.',
        image: '', tag: '', available: true, popular: false }
    ]
  };

  /* ── Boot ── */
  async function init() {
    applyDark(localStorage.getItem('me_dark') === 'true');
    await loadData();
    bindEvents();
  }

  /* ── Core load logic ── */
  async function loadData() {
    const cached = readCache();

    if (cached) {
      /* Cache exists → render immediately, no spinner */
      applyData(cached);
      liveVersion = cached.version || null;
      buildCatNav();
      renderMenu();
      /* Then fetch silently in the background to check for updates */
      fetchAndUpdate();
    } else {
      /* No cache → show spinner, block until fetch resolves */
      showLoading(true);
      try {
        const fresh = await fetchJSON();
        applyData(fresh);
        liveVersion = fresh.version || null;
        persistCache(fresh);
        buildCatNav();
        renderMenu();
      } catch (err) {
        console.warn('Fetch failed, using fallback:', err);
        applyData(FALLBACK);
        buildCatNav();
        renderMenu();
      } finally {
        showLoading(false);
      }
    }
  }

  /* Silent background fetch — only re-renders if version changed */
  async function fetchAndUpdate() {
    if (window.location.protocol === 'file:') return;
    try {
      const fresh = await fetchJSON();
      const newVersion = fresh.version || null;
      if (newVersion === liveVersion) return; /* nothing changed */
      applyData(fresh);
      liveVersion = newVersion;
      persistCache(fresh);
      buildCatNav();
      renderMenu();
    } catch (err) {
      /* Already showing cached data — silently ignore */
      console.warn('Background fetch failed, keeping cached menu:', err);
    }
  }

  /* Raw fetch — no timestamp, cache: no-store is sufficient */
  async function fetchJSON() {
    const res = await fetch('data/menu.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* Apply a data object to the live state */
  function applyData(source) {
    data.categories = source.categories || [];
    data.items      = source.items      || [];
  }

  /* localStorage helpers */
  function readCache() {
    try {
      const raw = localStorage.getItem('me_menu');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function persistCache(json) {
    try {
      localStorage.setItem('me_menu', JSON.stringify({
        version:    json.version    || null,
        categories: json.categories || [],
        items:      json.items      || []
      }));
      /* Keep legacy keys so admin.js still works */
      localStorage.setItem('me_cats',  JSON.stringify(json.categories || []));
      localStorage.setItem('me_items', JSON.stringify(json.items      || []));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  }

  /* ── Dark mode ── */
  function applyDark(on) {
    document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
    const icon = document.getElementById('dark-icon');
    if (icon) icon.className = on ? 'fa-solid fa-sun dark-icon' : 'fa-solid fa-moon dark-icon';
    localStorage.setItem('me_dark', on);
  }
  function toggleDark() {
    applyDark(document.documentElement.getAttribute('data-theme') !== 'dark');
  }

  /* ── Loading state ── */
  function showLoading(on) {
    let el = document.getElementById('menu-loading');
    if (!el) return;
    el.classList.toggle('hidden', !on);
    const content = document.getElementById('menu-content');
    if (content) content.style.visibility = on ? 'hidden' : 'visible';
  }

  /* ── Category nav ── */
  function buildCatNav() {
    const nav = document.getElementById('cat-nav');
    if (!nav) return;
    nav.innerHTML = '';
    nav.appendChild(makePill('all', 'fa-border-all', 'All', true));
    data.categories.forEach(cat =>
      nav.appendChild(makePill(cat.id, cat.icon, cat.name, false)));
  }

  function makePill(id, icon, label, active) {
    const btn = document.createElement('button');
    btn.className   = 'cat-pill' + (active ? ' active' : '');
    btn.dataset.cat = id;
    btn.innerHTML   = `<i class="fa-solid ${icon}"></i> ${label}`;
    btn.addEventListener('click', () => filterCat(id));
    return btn;
  }

  function filterCat(cat) {
    activeCat = cat;
    document.querySelectorAll('.cat-pill').forEach(p =>
      p.classList.toggle('active', p.dataset.cat === cat));
    renderMenu();
    if (cat !== 'all') {
      const sec = document.getElementById('sec-' + cat);
      if (sec) setTimeout(() => sec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ── Render ── */
  function renderMenu() {
    const content   = document.getElementById('menu-content');
    const noResults = document.getElementById('no-results');
    if (!content) return;

    content.querySelectorAll('.cat-section').forEach(s => s.remove());
    noResults.classList.add('hidden');

    const cats = activeCat === 'all'
      ? data.categories
      : data.categories.filter(c => c.id === activeCat);

    let total = 0;

    cats.forEach(cat => {
      let items = data.items.filter(i => i.category === cat.id);
      if (searchQ) items = items.filter(i =>
        i.name.toLowerCase().includes(searchQ) ||
        i.description.toLowerCase().includes(searchQ));
      if (!items.length) return;
      total += items.length;

      const sec = document.createElement('section');
      sec.className = 'cat-section';
      sec.id        = 'sec-' + cat.id;
      sec.innerHTML = `
        <div class="cat-header">
          <div class="cat-header-left">
            <div class="cat-icon-badge"><i class="fa-solid ${cat.icon}"></i></div>
            <div>
              <h2 class="cat-title">${cat.name}</h2>
              <p class="cat-desc">${cat.description || ''}</p>
            </div>
          </div>
          <span class="cat-item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="items-grid">${items.map(cardHTML).join('')}</div>`;
      content.appendChild(sec);
    });

    if (total === 0) {
      noResults.classList.remove('hidden');
      document.getElementById('search-term').textContent = searchQ || activeCat;
    }
  }

  function cardHTML(item) {
    const badgeMap  = { Popular: 'badge-popular', New: 'badge-new', Special: 'badge-special' };
    const badgeHTML = item.tag
      ? `<span class="card-badge ${badgeMap[item.tag] || ''}">${item.tag}</span>` : '';
    const oosHTML = !item.available
      ? `<div class="oos-overlay"><span class="oos-label"><i class="fa-solid fa-ban"></i> Out of Stock</span></div>` : '';

    return `
      <article class="menu-card${!item.available ? ' unavailable' : ''}">
        <div class="card-img-wrap" id="cw-${item.id}">
          <img src="${item.image}" alt="${item.name}" loading="lazy"
               onerror="Menu.imgFallback(${item.id})"/>
          <div class="img-fallback">
            <i class="fa-solid fa-image"></i>
            <span>No image</span>
          </div>
          ${badgeHTML}${oosHTML}
        </div>
        <div class="card-body">
          <h3 class="card-name">${item.name}</h3>
          <p class="card-desc">${item.description}</p>
          <div class="card-footer">
            <span class="card-price">$${Number(item.price).toFixed(2)}</span>
          </div>
        </div>
      </article>`;
  }

  function imgFallback(id) {
    const wrap = document.getElementById('cw-' + id);
    if (wrap) wrap.classList.add('fallback-active');
  }

  /* ── Events ── */
  function bindEvents() {
    const searchEl = document.getElementById('menu-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        searchQ = e.target.value.toLowerCase().trim();
        renderMenu();
      });
    }
    window.addEventListener('scroll', () => {
      const h = document.getElementById('site-header');
      if (h) h.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ── Toast ── */
  function toast(msg, type = 'info') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3500);
  }

  return { init, toggleDark, imgFallback };

})();

document.addEventListener('DOMContentLoaded', () => Menu.init());
