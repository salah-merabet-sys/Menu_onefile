# Maison Élite — QR Restaurant Menu

Static restaurant menu for GitHub Pages. Admin edits in the browser,
exports a ZIP, pushes to GitHub — public menu shows changes instantly.

---

## File Structure

```
/
├── index.html               ← Public menu (point QR code here)
├── admin.html               ← Admin panel
├── data/
│   └── menu.json            ← Menu data — exported by admin, committed to repo
├── assets/
│   ├── css/
│   │   ├── style.css        ← Public menu styles
│   │   └── admin.css        ← Admin styles
│   ├── js/
│   │   ├── menu.js          ← Public menu logic (always fetches fresh JSON)
│   │   └── admin.js         ← Admin logic (CRUD, image upload, ZIP export)
│   └── images/              ← Food photos (committed to repo after export)
└── README.md
```

---

## How to Update the Menu

1. Open `admin.html` on your live site (e.g. `yoursite.github.io/admin.html`)
2. Login (`admin` / `admin123` — change this!)
3. Add, edit, or delete items. Upload images using the drag-and-drop picker.
4. Go to **Export & Deploy** → click **Export ZIP**
5. Extract the ZIP. Copy:
   - `data/menu.json` → your repo's `/data/menu.json`
   - `assets/images/*` → your repo's `/assets/images/`
6. Commit & push to GitHub
7. GitHub Pages deploys in ~30 seconds — customers see changes immediately

---

## Why changes appear instantly

`menu.js` fetches `data/menu.json` with:
- `cache: 'no-store'` — browser never reads from disk cache
- `?v=<timestamp>` query param — busts CDN/proxy caches

So every page load fetches the freshest file from GitHub's servers.

---

## Image Naming (if adding manually)

Each item in `menu.json` has an `"image"` field: `"assets/images/filename.jpg"`

Name your file to match, drop it in `/assets/images/`, commit, and done.

| Item                     | Filename                  |
|--------------------------|---------------------------|
| Burrata & Heirloom Tomato| `burrata-tomato.jpg`      |
| Foie Gras Torchon        | `foie-gras.jpg`           |
| Truffle Arancini         | `truffle-arancini.jpg`    |
| Seared Scallops          | `seared-scallops.jpg`     |
| Lobster Bisque           | `lobster-bisque.jpg`      |
| Atlantic Salmon Gravlax  | `salmon-gravlax.jpg`      |
| Lobster Thermidor        | `lobster-thermidor.jpg`   |
| Duck Confit              | `duck-confit.jpg`         |
| Bouillabaisse            | `bouillabaisse.jpg`       |
| Black Truffle Tagliolini | `truffle-tagliolini.jpg`  |
| Wild Mushroom Risotto    | `mushroom-risotto.jpg`    |
| Lobster Ravioli          | `lobster-ravioli.jpg`     |
| Wagyu Beef Fillet        | `wagyu-fillet.jpg`        |
| Côte de Boeuf            | `cote-de-boeuf.jpg`       |
| Char-Grilled Lamb Cutlets| `lamb-cutlets.jpg`        |
| Château Pétrus 2015      | `red-wine.jpg`            |
| Kir Royale               | `kir-royale.jpg`          |
| Elderflower Spritz       | `elderflower-spritz.jpg`  |
| Single Malt Whisky Flight| `whisky-flight.jpg`       |
| Crème Brûlée             | `creme-brulee.jpg`        |
| Chocolate Soufflé        | `chocolate-souffle.jpg`   |
| Tarte Tatin              | `tarte-tatin.jpg`         |
| Mango Panna Cotta        | `mango-panna-cotta.jpg`   |

---

## Local Development

GitHub Pages requires a real server for `fetch('data/menu.json')` to work.

```bash
# Option A — Node
npx serve .

# Option B — Python
python3 -m http.server 8080

# Option C — VS Code Live Server extension
```

Then open `http://localhost:8080`.
