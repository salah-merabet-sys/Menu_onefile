/* ============================================================
   MAISON ÉLITE — PUBLIC MENU  |  assets/js/menu.js
   Always fetches menu.json fresh — no stale cache.
============================================================ */

const Menu = (() => {

  let data      = { branding: {}, categories: [], items: [] };
  let activeCat = 'all';
  let searchQ   = '';

  /* ── Boot ── */
  async function init() {
    /* Apply cached theme immediately to avoid flash */
    const cachedTheme = localStorage.getItem('me_theme') || 'gold';
    const cachedDark  = localStorage.getItem('me_dark') === 'true';
    applyTheme(cachedTheme, cachedDark);
    await loadFresh();
    applyBranding();
    buildCatNav();
    renderMenu();
    bindEvents();
  }

  /* ── Always fetch the latest JSON from the server, bypass every cache layer ── */
  async function loadFresh() {
    showLoading(true);
    try {
      const bust = `?v=${Date.now()}`;
      const res  = await fetch(`data/menu.json${bust}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma':        'no-cache',
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json      = await res.json();
      data.branding   = json.branding   || {};
      data.categories = json.categories || [];
      data.items      = json.items      || [];
    } catch (err) {
      console.error('menu.json load failed:', err);
      toast('Could not load menu — please refresh.', 'error');
    } finally {
      showLoading(false);
    }
  }

  /* ── Apply branding to all live DOM elements ── */
  function applyBranding() {
    const b = data.branding;

    const name    = b.restaurantName || 'Maison Élite';
    const sub     = b.restaurantSub  || 'Fine Dining';
    const heroT   = b.heroTitle      || 'Experience <em>True</em><br/>Gastronomy';
    const heroS   = b.heroSub        || 'Crafted with passion — served with elegance';
    const logoSrc = b.logoImage      || '';

    /* Apply theme before rendering so colours are correct immediately */
    const theme  = b.theme    || 'gold';
    const isDark = b.darkMode != null
      ? b.darkMode
      : (localStorage.getItem('me_dark') === 'true');
    applyTheme(theme, isDark);

    document.title = `${name} – Menu`;

    const brandName = document.querySelector('.brand-name');
    const brandSub  = document.querySelector('.brand-sub');
    if (brandName) brandName.textContent = name;
    if (brandSub)  brandSub.textContent  = sub;

    const brandMark = document.querySelector('.brand-mark');
    if (brandMark) {
      if (logoSrc) {
        brandMark.innerHTML = `<img src="${logoSrc}" alt="${name} logo" class="brand-logo-img"/>`;
      } else {
        brandMark.innerHTML = `<i class="fa-solid fa-utensils"></i>`;
      }
    }

    const heroTitle = document.querySelector('.hero-title');
    const heroSubEl = document.querySelector('.hero-sub');
    if (heroTitle) heroTitle.innerHTML = heroT;
    if (heroSubEl) heroSubEl.textContent = heroS;

    const footerEl = document.querySelector('.site-footer');
    if (footerEl) {
      footerEl.innerHTML =
        `<strong>${name}</strong> &nbsp;·&nbsp; ${sub} Experience &nbsp;·&nbsp; <span id="yr"></span>`;
      const yr = document.getElementById('yr');
      if (yr) yr.textContent = new Date().getFullYear();
    }
  }

  /* ── Theme + dark mode ── */
  function applyTheme(theme, dark) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme || 'gold');
    html.setAttribute('data-mode',  dark  ? 'dark' : 'light');
    const icon = document.getElementById('dark-icon');
    if (icon) icon.className = dark ? 'fa-solid fa-sun dark-icon' : 'fa-solid fa-moon dark-icon';
    localStorage.setItem('me_dark',  dark);
    localStorage.setItem('me_theme', theme);
  }
  function toggleDark() {
    const dark = document.documentElement.getAttribute('data-mode') !== 'dark';
    const theme = document.documentElement.getAttribute('data-theme') || 'gold';
    applyTheme(theme, dark);
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
            <span class="card-price">${Number(item.price).toLocaleString('fr-DZ')} DA</span>
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
