/* ============================================================
   MAISON ÉLITE — ADMIN  |  assets/js/admin.js (Patched)
============================================================ */

const Admin = (() => {

  /* ── State ── */
  let items      = [];
  let categories = [];
  let editId     = null;
  let confirmCb  = null;
  let uploadedImages = {};

  /* ── SHA-256 ── */
  async function sha256(msg) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Dark mode ── */
  function applyDark(on) {
    document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
    document.querySelectorAll('.dark-icon').forEach(i =>
      i.className = `fa-solid ${on ? 'fa-sun' : 'fa-moon'} dark-icon`);
    localStorage.setItem('me_dark', on);
  }
  function toggleDark() {
    applyDark(document.documentElement.getAttribute('data-theme') !== 'dark');
  }

  /* ── Boot ── */
  async function init() {
    applyDark(localStorage.getItem('me_dark') === 'true');
    await ensureCreds();
    await loadData();
    if (localStorage.getItem('me_session') === '1') showDashboard();
    else showLogin();
  }

  async function ensureCreds() {
    if (!localStorage.getItem('me_creds')) {
      const hash = await sha256('admin123');
      localStorage.setItem('me_creds', JSON.stringify({ user: 'admin', hash }));
    }
  }

  /* FIX 1: LOAD DATA OVERHAUL
     Always attempt to fetch from server first to prevent overwriting new changes 
     made from other devices. Fall back to localStorage only if offline.
  */
  async function loadData() {
    try {
      // Always try to fetch fresh truth from GitHub first
      const bust = `?v=${Date.now()}`;
      const res  = await fetch(`data/menu.json${bust}`, { cache: 'no-store' });
      
      if (!res.ok) throw new Error('Network error or file missing');
      
      const json = await res.json();
      categories = json.categories || [];
      items      = json.items      || [];
      
      // Load current session's uploaded images that haven't been exported yet
      const si2 = localStorage.getItem('me_uploaded_images');
      if (si2) uploadedImages = JSON.parse(si2);
      
      persist(); // Sync local storage with the fresh truth
      console.log('Successfully synced with live menu.json');
    } catch (e) {
      console.warn('Could not fetch live menu.json, falling back to local storage', e);
      // Fallback to local storage if offline or running locally
      const si = localStorage.getItem('me_items');
      const sc = localStorage.getItem('me_cats');
      const si2= localStorage.getItem('me_uploaded_images');

      if (si && sc) {
        items      = JSON.parse(si);
        categories = JSON.parse(sc);
        if (si2) uploadedImages = JSON.parse(si2);
      } else {
        items = []; categories = [];
      }
    }
  }

  function persist() {
    localStorage.setItem('me_items', JSON.stringify(items));
    localStorage.setItem('me_cats',  JSON.stringify(categories));
<<<<<<< HEAD
<<<<<<< HEAD
=======
    /* Write unified cache key that menu.js reads */
    try {
      localStorage.setItem('me_menu', JSON.stringify({
        version:    null,   /* no version until exported — menu.js will re-fetch on next load */
        categories,
        items
      }));
    } catch(e) { /* storage full — non-fatal */ }
=======
>>>>>>> parent of 37f70e5 (page loading protocole update)
    /* Store uploaded images separately (can get large) */
>>>>>>> parent of ea48ddb (Revert "page loading protocole update")
    try {
      localStorage.setItem('me_uploaded_images', JSON.stringify(uploadedImages));
    } catch(e) {
      console.warn('localStorage full — images not cached between sessions.');
    }
  }

  /* ── Views ── */
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

  /* ── Auth ── */
  async function login() {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    if (!u || !p) { showLoginErr('Please enter username and password.'); return; }

    const creds = JSON.parse(localStorage.getItem('me_creds'));
    const hash  = await sha256(p);
    if (u === creds.user && hash === creds.hash) {
      localStorage.setItem('me_session', '1');
      document.getElementById('login-user').value = '';
      document.getElementById('login-pass').value = '';
      showDashboard();
      toast('Welcome back!', 'success');
    } else {
      showLoginErr('Invalid username or password.');
    }
  }
  function showLoginErr(msg) {
    const el = document.getElementById('login-error');
    el.querySelector('span').textContent = msg;
    el.classList.remove('hidden');
  }
  function logout() {
    localStorage.removeItem('me_session');
    showLogin();
    toast('Logged out', 'info');
  }

  /* ── Password ── */
  async function changePassword() {
    const op = document.getElementById('old-pass').value;
    const np = document.getElementById('new-pass').value;
    const cp = document.getElementById('confirm-pass').value;
    const errEl = document.getElementById('pass-error');
    errEl.classList.add('hidden');

    const show = msg => { errEl.textContent = msg; errEl.classList.remove('hidden'); };
    if (!op||!np||!cp)  { show('All fields are required.'); return; }
    if (np.length < 6)  { show('New password must be at least 6 characters.'); return; }
    if (np !== cp)      { show('Passwords do not match.'); return; }

    const creds   = JSON.parse(localStorage.getItem('me_creds'));
    const oldHash = await sha256(op);
    if (oldHash !== creds.hash) { show('Current password is incorrect.'); return; }

    creds.hash = await sha256(np);
    localStorage.setItem('me_creds', JSON.stringify(creds));
    ['old-pass','new-pass','confirm-pass'].forEach(id => document.getElementById(id).value = '');
    toast('Password updated', 'success');
  }

  function togglePass(inputId, btn) {
    const el  = document.getElementById(inputId);
    const vis = el.type === 'password';
    el.type   = vis ? 'text' : 'password';
    btn.querySelector('i').className = vis ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }

  /* ── Sidebar ── */
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

  /* ── Overview ── */
  function renderOverview() {
    const inStock  = items.filter(i => i.available).length;
    const outStock = items.filter(i => !i.available).length;
    const popular  = items.filter(i => i.popular).length;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card"><div class="stat-icon si-gold"><i class="fa-solid fa-bowl-food"></i></div>
        <div><div class="stat-val">${items.length}</div><div class="stat-label">Total Items</div></div></div>
      <div class="stat-card"><div class="stat-icon si-green"><i class="fa-solid fa-circle-check"></i></div>
        <div><div class="stat-val">${inStock}</div><div class="stat-label">In Stock</div></div></div>
      <div class="stat-card"><div class="stat-icon si-red"><i class="fa-solid fa-ban"></i></div>
        <div><div class="stat-val">${outStock}</div><div class="stat-label">Out of Stock</div></div></div>
      <div class="stat-card"><div class="stat-icon si-purple"><i class="fa-solid fa-star"></i></div>
        <div><div class="stat-val">${popular}</div><div class="stat-label">Popular</div></div></div>`;

    const recent = [...items].slice(-6).reverse();
    document.getElementById('overview-recent').innerHTML =
      `<div class="admin-items-list">${recent.map(rowHTML).join('')}</div>`;
  }

  /* ── Items list ── */
  function populateCatSelects() {
    const opts = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const filt = document.getElementById('admin-cat-filter');
    if (filt) filt.innerHTML = `<option value="">All Categories</option>${opts}`;
    const fCat = document.getElementById('f-cat');
    if (fCat) fCat.innerHTML = opts;
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
    const tagMap  = { Popular:'tag-popular', New:'tag-new', Special:'tag-special' };
    const tagHTML = item.tag ? `<span class="tag-pill ${tagMap[item.tag]||''}">${item.tag}</span>` : '';

    const filename = item.image ? item.image.split('/').pop() : '';
    const dispImg  = uploadedImages[filename] || item.image || '';

    return `
      <div class="admin-item-row">
        <img class="admin-item-img" src="${dispImg}"
             alt="${item.name}"
             onerror="this.src='https://placehold.co/56x56/e5d9c7/8c6e38?text=?'"/>
        <div class="admin-item-info">
          <div class="admin-item-name">${item.name}</div>
          <div class="admin-item-meta">
            <span class="admin-item-price">$${Number(item.price).toFixed(2)}</span>
            <span>${catName}</span>
            ${tagHTML}
            <span class="stock-badge ${item.available?'stock-in':'stock-out'}">
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

  function toggleAvail(id, val) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.available = val;
    persist();
    renderOverview();
    toast(`"${item.name}" marked ${val ? 'in stock' : 'out of stock'}`, val ? 'success' : 'info');
  }

  /* ── Modal ── */
  let currentFileDataURL = null; 
  let currentFileName    = null;

  function openModal(id) {
    editId = id || null;
    currentFileDataURL = null;
    currentFileName    = null;

    document.getElementById('modal-title').textContent = id ? 'Edit Menu Item' : 'Add Menu Item';
    populateCatSelects();
    resetImageUI();

    if (id) {
      const item     = items.find(i => i.id === id);
      const filename = item.image ? item.image.split('/').pop() : '';
      const dataURL  = uploadedImages[filename] || null;

      document.getElementById('f-name').value        = item.name;
      document.getElementById('f-price').value       = item.price;
      document.getElementById('f-desc').value        = item.description;
      document.getElementById('f-cat').value         = item.category;
      document.getElementById('f-tag').value         = item.tag || '';
      document.getElementById('f-available').checked = item.available;
      document.getElementById('f-popular').checked   = item.popular;

      if (dataURL || item.image) {
        setPreviewImage(dataURL || item.image, filename);
      }
    } else {
      ['f-name','f-price','f-desc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('f-cat').value         = categories[0]?.id || '';
      document.getElementById('f-tag').value         = '';
      document.getElementById('f-available').checked = true;
      document.getElementById('f-popular').checked   = false;
    }
    document.getElementById('item-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    editId = null;
    currentFileDataURL = null;
    currentFileName    = null;
  }

  function resetImageUI() {
    const preview = document.getElementById('img-preview-box');
    const area    = document.getElementById('img-upload-area');
    if (preview) preview.classList.remove('show');
    if (area)    area.style.display = '';
    const fi = document.getElementById('f-img-file');
    if (fi) fi.value = '';
  }

  function setPreviewImage(src, filename) {
    const box    = document.getElementById('img-preview-box');
    const img    = document.getElementById('img-preview');
    const area   = document.getElementById('img-upload-area');
    img.src      = src;
    box.classList.add('show');
    if (area) area.style.display = 'none';
    if (filename) currentFileName = filename;
  }

  /* FIX 2: CACHE BUSTING IMAGES
     Prepend a timestamp to the safeName to ensure that even if the 
     user uploads a photo with the same name, it generates a new URL.
  */
  function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast('Image must be under 5 MB.', 'error'); return; }

    const ext      = file.name.split('.').pop().toLowerCase();
    const cleanName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Add timestamp to break browser cache on update
    currentFileName = `${Date.now()}-${cleanName}.${ext}`;

    const reader = new FileReader();
    reader.onload = e => {
      currentFileDataURL = e.target.result;
      setPreviewImage(currentFileDataURL, currentFileName);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    currentFileDataURL = null;
    currentFileName    = null;
    resetImageUI();
  }

  function setupDragDrop() {
    const area = document.getElementById('img-upload-area');
    if (!area) return;
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
      e.preventDefault(); area.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        const fi = document.getElementById('f-img-file');
        if (fi) { fi.files = dt.files; handleFileSelect(fi); }
      }
    });
  }

  function saveItem() {
    const name  = document.getElementById('f-name').value.trim();
    const price = parseFloat(document.getElementById('f-price').value);
    const cat   = document.getElementById('f-cat').value;

    if (!name)             { toast('Item name is required.', 'error'); return; }
    if (!price || price<0) { toast('Valid price required.', 'error'); return; }
    if (!cat)              { toast('Select a category.', 'error'); return; }

    let imagePath = '';
    if (editId) {
      const existing = items.find(i => i.id === editId);
      imagePath = existing.image || '';
    }

    if (currentFileName && currentFileDataURL) {
      imagePath = `assets/images/${currentFileName}`;
      uploadedImages[currentFileName] = currentFileDataURL;
    } else if (!imagePath) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      imagePath  = `assets/images/${slug}.jpg`;
    }

    const payload = {
      name,
      price,
      category:    cat,
      description: document.getElementById('f-desc').value.trim(),
      image:       imagePath,
      tag:         document.getElementById('f-tag').value,
      available:   document.getElementById('f-available').checked,
      popular:     document.getElementById('f-popular').checked,
    };

    if (editId) {
      const idx  = items.findIndex(i => i.id === editId);
      items[idx] = { ...items[idx], ...payload };
      toast(`"${name}" updated`, 'success');
    } else {
      payload.id = Date.now();
      items.push(payload);
      toast(`"${name}" added`, 'success');
    }

    persist();
    closeModal();
    renderOverview();
    renderItems();
  }

  function deleteItem(id) {
    const item = items.find(i => i.id === id);
    document.querySelector('.confirm-box p').textContent =
      `"${item?.name || 'This item'}" will be permanently removed from the menu.`;
    document.getElementById('confirm-overlay').classList.remove('hidden');
    confirmCb = () => {
      const filename = item?.image?.split('/').pop();
      if (filename && !items.some((i, idx) => i.id !== id && i.image?.includes(filename))) {
        delete uploadedImages[filename];
      }
      items = items.filter(i => i.id !== id);
      persist();
      renderOverview();
      renderItems();
      toast(`"${item?.name}" deleted`, 'info');
    };
  }
  function closeConfirm() {
    document.getElementById('confirm-overlay').classList.add('hidden');
    confirmCb = null;
  }
  function execConfirm() { if (confirmCb) confirmCb(); closeConfirm(); }

  async function exportZip() {
    if (typeof JSZip === 'undefined') {
      toast('JSZip not loaded — check your internet connection.', 'error');
      return;
    }

    const progress    = document.getElementById('export-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressLbl = document.getElementById('progress-label');

    progress.classList.add('show');
    progressBar.style.width = '0%';
    progressLbl.textContent  = 'Building ZIP…';

    const zip = new JSZip();

    progressBar.style.width = '15%';
    const exportData = {
      categories,
      items: items.map(i => ({
        id:          i.id,
        name:        i.name,
        category:    i.category,
        price:       i.price,
        description: i.description,
        image:       i.image,
        tag:         i.tag || '',
        available:   i.available,
        popular:     i.popular,
      }))
    };
    zip.file('data/menu.json', JSON.stringify(exportData, null, 2));

    progressBar.style.width = '30%';
    progressLbl.textContent  = 'Packing images…';

    const imageEntries = Object.entries(uploadedImages);
    for (let i = 0; i < imageEntries.length; i++) {
      const [filename, dataURL] = imageEntries[i];
      const base64 = dataURL.split(',')[1];
      zip.file(`assets/images/${filename}`, base64, { base64: true });
      progressBar.style.width = `${30 + Math.round((i / imageEntries.length) * 40)}%`;
    }

    progressBar.style.width = '75%';
    progressLbl.textContent  = 'Finalizing…';

    zip.file('DEPLOY_README.txt', [
      'MAISON ÉLITE — DEPLOYMENT PACKAGE (PATCHED)',
      '============================================',
      '',
      'HOW TO DEPLOY:',
      '  1. Extract this ZIP',
      '  2. Copy data/menu.json   → your repo /data/menu.json',
      '  3. Copy assets/images/* → your repo /assets/images/',
      '  4. Commit & push to GitHub',
      '',
      `Exported: ${new Date().toLocaleString()}`,
    ].join('\n'));

    progressBar.style.width = '90%';

    progressLbl.textContent = 'Generating download…';
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    progressBar.style.width = '100%';
    progressLbl.textContent = 'Done! Downloading…';

    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `maison-elite-deploy-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);

    toast('ZIP exported — push to GitHub!', 'success');

    setTimeout(() => {
      progress.classList.remove('show');
      progressBar.style.width = '0%';
    }, 3000);
  }

  function toast(msg, type = 'info') {
    const icons = { success:'fa-circle-check', error:'fa-circle-exclamation', info:'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3800);
  }

  return {
    init, toggleDark, login, logout, changePassword, togglePass,
    navTo, openSidebar, closeSidebar,
    openModal, closeModal, saveItem, removeImage, handleFileSelect,
    toggleAvail, deleteItem, closeConfirm, execConfirm,
    renderItems, exportZip, setupDragDrop,
  };

})();

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
  Admin.setupDragDrop();
});