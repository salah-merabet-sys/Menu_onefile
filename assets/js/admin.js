/* ============================================
   MAISON ELITE — ADMIN JS
   assets/js/admin.js
============================================ */

const Admin = (() => {

  /* ---------- state ---------- */
  let items      = [];
  let categories = [];
  let editId     = null;
  let confirmCb  = null;

  /* ---------- SHA-256 ---------- */
  async function sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- dark mode ---------- */
  function applyDark(on) {
    document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
    document.querySelectorAll('.dark-icon').forEach(i =>
      i.className = `fa-solid ${on ? 'fa-sun' : 'fa-moon'} dark-icon`);
    localStorage.setItem('me_dark', on);
  }
  function toggleDark() {
    applyDark(document.documentElement.getAttribute('data-theme') !== 'dark');
  }

  /* ---------- boot ---------- */
  async function init() {
    applyDark(localStorage.getItem('me_dark') === 'true');
    await ensureCreds();
    await loadData();

    /* Route: show login or dashboard */
    if (localStorage.getItem('me_session') === '1') {
      showDashboard();
    } else {
      showLogin();
    }
  }

  async function ensureCreds() {
    if (!localStorage.getItem('me_creds')) {
      const hash = await sha256('admin123');
      localStorage.setItem('me_creds', JSON.stringify({ user: 'admin', hash }));
    }
  }

  async function loadData() {
    /* Use localStorage if available (already seeded by menu.js or prior admin session) */
    const storedItems = localStorage.getItem('me_items');
    const storedCats  = localStorage.getItem('me_cats');

    if (storedItems && storedCats) {
      items      = JSON.parse(storedItems);
      categories = JSON.parse(storedCats);
      return;
    }

    /* Fetch from JSON */
    try {
      const res  = await fetch('data/menu.json');
      const json = await res.json();
      categories = json.categories;
      items      = json.items;
      save();
    } catch (e) {
      console.error('Could not load menu.json:', e);
      items = []; categories = [];
    }
  }

  function save() {
    localStorage.setItem('me_items', JSON.stringify(items));
    localStorage.setItem('me_cats',  JSON.stringify(categories));
  }

  /* ---------- views ---------- */
  function showLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
  }
  function showDashboard() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    populateCatSelects();
    renderOverview();
    renderItems();
  }

  /* ---------- auth ---------- */
  async function login() {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    if (!u || !p) { showErr('Please enter username and password.'); return; }

    const creds = JSON.parse(localStorage.getItem('me_creds'));
    const hash  = await sha256(p);

    if (u === creds.user && hash === creds.hash) {
      localStorage.setItem('me_session', '1');
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
      showDashboard();
      toast('Welcome back!', 'success');
    } else {
      showErr('Invalid username or password.');
    }
  }

  function showErr(msg) {
    const el = document.getElementById('login-error');
    el.querySelector('span').textContent = msg;
    el.classList.remove('hidden');
  }

  function logout() {
    localStorage.removeItem('me_session');
    showLogin();
    toast('Logged out', 'info');
  }

  /* ---------- password ---------- */
  async function changePassword() {
    const op = document.getElementById('old-pass').value;
    const np = document.getElementById('new-pass').value;
    const cp = document.getElementById('confirm-pass').value;
    const errEl = document.getElementById('pass-error');
    errEl.classList.add('hidden');

    const show = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };

    if (!op || !np || !cp) { show('All fields are required.'); return; }
    if (np.length < 6)     { show('New password must be at least 6 characters.'); return; }
    if (np !== cp)          { show('Passwords do not match.'); return; }

    const creds   = JSON.parse(localStorage.getItem('me_creds'));
    const oldHash = await sha256(op);
    if (oldHash !== creds.hash) { show('Current password is incorrect.'); return; }

    creds.hash = await sha256(np);
    localStorage.setItem('me_creds', JSON.stringify(creds));
    ['old-pass','new-pass','confirm-pass'].forEach(id => document.getElementById(id).value = '');
    toast('Password updated successfully', 'success');
  }

  function togglePass(inputId, btn) {
    const el   = document.getElementById(inputId);
    const show = el.type === 'password';
    el.type    = show ? 'text' : 'password';
    btn.querySelector('i').className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }

  /* ---------- sidebar nav ---------- */
  function navTo(section, el) {
    document.querySelectorAll('.sb-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + section).classList.add('active');
    document.getElementById('topbar-title').textContent = el.textContent.trim();
    closeSidebar();
  }
  function openSidebar() {
    document.getElementById('admin-sidebar').classList.add('open');
    document.getElementById('sb-overlay').classList.add('show');
  }
  function closeSidebar() {
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('sb-overlay')?.classList.remove('show');
  }

  /* ---------- overview ---------- */
  function renderOverview() {
    const inStock = items.filter(i => i.available).length;
    const outStock = items.filter(i => !i.available).length;
    const popular  = items.filter(i => i.popular).length;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon si-gold"><i class="fa-solid fa-bowl-food"></i></div>
        <div><div class="stat-val">${items.length}</div><div class="stat-label">Total Items</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-green"><i class="fa-solid fa-circle-check"></i></div>
        <div><div class="stat-val">${inStock}</div><div class="stat-label">In Stock</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-red"><i class="fa-solid fa-ban"></i></div>
        <div><div class="stat-val">${outStock}</div><div class="stat-label">Out of Stock</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon si-purple"><i class="fa-solid fa-star"></i></div>
        <div><div class="stat-val">${popular}</div><div class="stat-label">Popular</div></div>
      </div>`;

    const recent = [...items].slice(-6).reverse();
    document.getElementById('overview-recent').innerHTML =
      `<div class="admin-items-list">${recent.map(rowHTML).join('')}</div>`;
  }

  /* ---------- items list ---------- */
  function populateCatSelects() {
    const opts = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const filterSel = document.getElementById('admin-cat-filter');
    if (filterSel) filterSel.innerHTML = `<option value="">All Categories</option>${opts}`;
    const formSel = document.getElementById('f-cat');
    if (formSel) formSel.innerHTML = opts;
  }

  function renderItems() {
    const q   = (document.getElementById('admin-search')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('admin-cat-filter')?.value || '';
    let list  = items;
    if (q)   list = list.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    if (cat) list = list.filter(i => i.category === cat);

    const container = document.getElementById('admin-items-list');
    if (!container) return;
    if (!list.length) {
      container.innerHTML = `<div class="empty-list"><i class="fa-solid fa-inbox"></i><p>No items found</p></div>`;
      return;
    }
    container.innerHTML = list.map(rowHTML).join('');
  }

  function rowHTML(item) {
    const catName = categories.find(c => c.id === item.category)?.name || item.category;
    const tagMap  = { Popular: 'tag-popular', New: 'tag-new', Special: 'tag-special' };
    const tagHTML = item.tag ? `<span class="tag-pill ${tagMap[item.tag] || ''}">${item.tag}</span>` : '';
    return `
      <div class="admin-item-row">
        <img
          class="admin-item-img"
          src="${item.image}"
          alt="${item.name}"
          onerror="this.src='https://placehold.co/56x56/e5d9c7/8c6e38?text=?'"
        />
        <div class="admin-item-info">
          <div class="admin-item-name">${item.name}</div>
          <div class="admin-item-meta">
            <span class="admin-item-price">${Number(item.price).toFixed(2)}</span>
            <span>${catName}</span>
            ${tagHTML}
            <span class="stock-badge ${item.available ? 'stock-in' : 'stock-out'}">
              ${item.available ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        <div class="admin-item-actions">
          <label class="toggle-sw" title="Toggle availability">
            <input type="checkbox" ${item.available ? 'checked' : ''}
              onchange="Admin.toggleAvail(${item.id}, this.checked)"/>
            <span class="toggle-slider"></span>
          </label>
          <button class="action-btn" onclick="Admin.openModal(${item.id})" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn del" onclick="Admin.deleteItem(${item.id})" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }

  /* ---------- toggle availability ---------- */
  function toggleAvail(id, val) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.available = val;
    save();
    renderOverview();
    toast(`"${item.name}" marked as ${val ? 'in stock' : 'out of stock'}`, val ? 'success' : 'info');
  }

  /* ---------- modal ---------- */
  function openModal(id) {
    editId = id || null;
    document.getElementById('modal-title').textContent = id ? 'Edit Menu Item' : 'Add Menu Item';
    populateCatSelects();
    const preview = document.getElementById('img-preview');

    if (id) {
      const item = items.find(i => i.id === id);
      document.getElementById('f-name').value      = item.name;
      document.getElementById('f-price').value     = item.price;
      document.getElementById('f-desc').value      = item.description;
      document.getElementById('f-cat').value       = item.category;
      document.getElementById('f-tag').value       = item.tag || '';
      document.getElementById('f-img').value       = item.image || '';
      document.getElementById('f-available').checked = item.available;
      document.getElementById('f-popular').checked   = item.popular;
      if (item.image) { preview.src = item.image; preview.classList.add('show'); }
      else { preview.classList.remove('show'); }
    } else {
      ['f-name','f-price','f-desc','f-img'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('f-cat').value         = categories[0]?.id || '';
      document.getElementById('f-tag').value         = '';
      document.getElementById('f-available').checked = true;
      document.getElementById('f-popular').checked   = false;
      preview.classList.remove('show');
    }
    document.getElementById('item-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    editId = null;
  }

  function previewImg() {
    const url     = document.getElementById('f-img').value.trim();
    const preview = document.getElementById('img-preview');
    if (url) { preview.src = url; preview.classList.add('show'); }
    else { preview.classList.remove('show'); }
  }

  function saveItem() {
    const name  = document.getElementById('f-name').value.trim();
    const price = parseFloat(document.getElementById('f-price').value);
    const cat   = document.getElementById('f-cat').value;

    if (!name)              { toast('Item name is required', 'error'); return; }
    if (!price || price < 0){ toast('Valid price required', 'error'); return; }
    if (!cat)               { toast('Select a category', 'error'); return; }

    const imgVal = document.getElementById('f-img').value.trim();
    const payload = {
      name,
      price,
      category:    cat,
      description: document.getElementById('f-desc').value.trim(),
      image:       imgVal || `assets/images/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      tag:         document.getElementById('f-tag').value,
      available:   document.getElementById('f-available').checked,
      popular:     document.getElementById('f-popular').checked,
    };

    if (editId) {
      const idx = items.findIndex(i => i.id === editId);
      items[idx] = { ...items[idx], ...payload };
      toast(`"${name}" updated`, 'success');
    } else {
      payload.id = Date.now();
      items.push(payload);
      toast(`"${name}" added to menu`, 'success');
    }
    save();
    closeModal();
    renderOverview();
    renderItems();
  }

  /* ---------- delete ---------- */
  function deleteItem(id) {
    const item = items.find(i => i.id === id);
    document.querySelector('.confirm-box p').textContent =
      `"${item?.name || 'This item'}" will be permanently removed from the menu.`;
    document.getElementById('confirm-overlay').classList.remove('hidden');
    confirmCb = () => {
      items = items.filter(i => i.id !== id);
      save();
      renderOverview();
      renderItems();
      toast(`"${item?.name}" deleted`, 'info');
    };
  }

  function closeConfirm() {
    document.getElementById('confirm-overlay').classList.add('hidden');
    confirmCb = null;
  }

  function execConfirm() {
    if (confirmCb) confirmCb();
    closeConfirm();
  }

  /* ---------- toast ---------- */
  function toast(msg, type = 'info') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3500);
  }

  return {
    init, toggleDark, login, logout, changePassword, togglePass,
    navTo, openSidebar, closeSidebar,
    openModal, closeModal, previewImg, saveItem,
    toggleAvail, deleteItem, closeConfirm, execConfirm,
    renderItems,
  };

})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
