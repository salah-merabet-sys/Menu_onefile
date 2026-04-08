/* ============================================================
<<<<<<< HEAD
   MAISON ÉLITE — PUBLIC MENU  |  assets/js/menu.js (Patched)
=======
   MAISON ÉLITE — PUBLIC MENU  |  assets/js/menu.js

   Loading strategy:
   1. Read localStorage immediately — render at once, no spinner.
   2. If no cache exists — show spinner, wait for fetch.
   3. Fetch menu.json with cache: "no-store" (no timestamp needed).
   4. Compare version field — only re-render if version changed.
   5. On fetch failure — keep whatever is already rendered.
   6. Minimal hardcoded fallback if both cache and fetch fail.
>>>>>>> parent of ea48ddb (Revert "page loading protocole update")
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
<<<<<<< HEAD
    buildCatNav();
    renderMenu();
    bindEvents();
  }

  /* ── Load data ── */
  async function loadData() {
    const loadingEl = document.getElementById('menu-loading');
    if (loadingEl) loadingEl.style.display = 'flex';

    /* On file:// there is no server — fallback to local storage */
    if (window.location.protocol === 'file:') {
      const saved = localStorage.getItem('me_items');
      const cats  = localStorage.getItem('me_cats');
      if (saved && cats) {
        data.items = JSON.parse(saved);
        data.categories = JSON.parse(cats);
      }
      if (loadingEl) loadingEl.style.display = 'none';
      return;
    }

    try {
      /* PATCH: Forced Cache Busting
         We add a timestamp to the URL to ensure GitHub Pages 
         doesn't serve a cached version of the menu.json.
      */
      const bust = `?v=${Date.now()}`;
      const res  = await fetch(`data/menu.json${bust}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });

      if (!res.ok) throw new Error('Menu fetch failed');
      data = await res.json();
    } catch (e) {
      console.error('Menu load error:', e);
      // Fallback if GitHub is down or file is missing
      const saved = localStorage.getItem('me_items');
      if (saved) data.items = JSON.parse(saved);
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      const content = document.getElementById('menu-content');
      if (content) content.style.visibility = 'visible';
=======
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
>>>>>>> parent of ea48ddb (Revert "page loading protocole update")
    }
  }

  /* ── UI Building ── */
  function buildCatNav() {
    const nav = document.getElementById('cat-nav');
    if (!nav) return;

    const allBtn = document.createElement('button');
    allBtn.className = 'cat-btn active';
    allBtn.innerHTML = `<i class="fa-solid fa-border-all"></i><span>All</span>`;
    allBtn.onclick = () => filterCat('all', allBtn);
    nav.appendChild(allBtn);

    data.categories.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'cat-btn';
      btn.innerHTML = `<i class="fa-solid ${c.icon}"></i><span>${c.name}</span>`;
      btn.onclick = () => filterCat(c.id, btn);
      nav.appendChild(btn);
    });
  }

  function filterCat(id, btn) {
    activeCat = id;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderMenu();
    
    // Smooth scroll back to top of menu
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderMenu() {
    const container = document.getElementById('menu-content');
    if (!container) return;
    container.innerHTML = '';

    data.categories.forEach(cat => {
      if (activeCat !== 'all' && activeCat !== cat.id) return;

      const catItems = data.items.filter(i => {
        const matchesCat = i.category === cat.id;
        const matchesSearch = i.name.toLowerCase().includes(searchQ) || 
                             i.description.toLowerCase().includes(searchQ);
        return matchesCat && matchesSearch;
      });

      if (catItems.length > 0) {
        const section = document.createElement('section');
        section.className = 'menu-section fade-in';
        section.innerHTML = `
          <div class="section-header">
            <h2 class="section-title">${cat.name}</h2>
            <p class="section-desc">${cat.description}</p>
          </div>
          <div class="menu-grid">
            ${catItems.map(item => itemHTML(item)).join('')}
          </div>
        `;
        container.appendChild(section);
      }
    });

    // Handle No Results
    const noRes = document.getElementById('no-results');
    if (noRes) {
      const hasAny = container.children.length > 0;
      noRes.classList.toggle('hidden', hasAny);
      if (!hasAny) document.getElementById('search-term').textContent = searchQ;
    }
  }

  function itemHTML(item) {
    const tagClass = item.tag ? `tag-${item.tag.toLowerCase()}` : '';
    const tagHTML = item.tag ? `<span class="item-tag ${tagClass}">${item.tag}</span>` : '';
    const outOfStock = !item.available ? 'out-of-stock' : '';
    
    // Add unique versioning to image URL if it exists
    const imgSrc = item.image ? `${item.image}?v=${item.id}` : '';

    return `
      <article class="menu-card ${outOfStock}">
        <div class="card-img-wrapper">
          <img src="${imgSrc}" alt="${item.name}" loading="lazy" 
               onerror="this.parentElement.classList.add('fallback-active')">
          ${tagHTML}
          ${!item.available ? '<div class="stock-overlay">Out of Stock</div>' : ''}
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

  /* ── Theme & Events ── */
  function applyDark(on) {
    document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
    localStorage.setItem('me_dark', on);
  }

  function bindEvents() {
    const searchEl = document.getElementById('menu-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        searchQ = e.target.value.toLowerCase().trim();
        renderMenu();
      });
    }
    
    // Site header scroll effect
    window.addEventListener('scroll', () => {
      const h = document.getElementById('site-header');
      if (h) h.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Menu.init);