# Maison Élite – QR Restaurant Menu

A multi-file, static restaurant menu web app deployable to GitHub Pages.

---

## Project Structure

```
/
├── index.html               ← Public menu (QR code points here)
├── admin.html               ← Admin login + dashboard
├── data/
│   └── menu.json            ← All categories & menu items (edit this!)
├── assets/
│   ├── css/
│   │   ├── style.css        ← Public menu styles
│   │   └── admin.css        ← Admin panel styles (imports style.css)
│   ├── js/
│   │   ├── menu.js          ← Public menu logic
│   │   └── admin.js         ← Admin logic (auth, CRUD, etc.)
│   └── images/              ← ⬅ Place ALL your food images here
│       ├── burrata-tomato.jpg
│       ├── foie-gras.jpg
│       ├── truffle-arancini.jpg
│       ├── seared-scallops.jpg
│       ├── lobster-bisque.jpg
│       ├── salmon-gravlax.jpg
│       ├── lobster-thermidor.jpg
│       ├── duck-confit.jpg
│       ├── bouillabaisse.jpg
│       ├── truffle-tagliolini.jpg
│       ├── mushroom-risotto.jpg
│       ├── lobster-ravioli.jpg
│       ├── wagyu-fillet.jpg
│       ├── cote-de-boeuf.jpg
│       ├── lamb-cutlets.jpg
│       ├── red-wine.jpg
│       ├── kir-royale.jpg
│       ├── elderflower-spritz.jpg
│       ├── whisky-flight.jpg
│       ├── creme-brulee.jpg
│       ├── chocolate-souffle.jpg
│       ├── tarte-tatin.jpg
│       └── mango-panna-cotta.jpg
└── README.md
```

---

## Image Naming Guide

Each menu item in `data/menu.json` has an `"image"` field like:

```json
"image": "assets/images/burrata-tomato.jpg"
```

Simply name your photo files to match exactly:

| Item                        | File name                    |
|-----------------------------|------------------------------|
| Burrata & Heirloom Tomato   | `burrata-tomato.jpg`         |
| Foie Gras Torchon           | `foie-gras.jpg`              |
| Truffle Arancini            | `truffle-arancini.jpg`       |
| Seared Scallops             | `seared-scallops.jpg`        |
| Lobster Bisque              | `lobster-bisque.jpg`         |
| Atlantic Salmon Gravlax     | `salmon-gravlax.jpg`         |
| Lobster Thermidor           | `lobster-thermidor.jpg`      |
| Duck Confit                 | `duck-confit.jpg`            |
| Bouillabaisse               | `bouillabaisse.jpg`          |
| Black Truffle Tagliolini    | `truffle-tagliolini.jpg`     |
| Wild Mushroom Risotto       | `mushroom-risotto.jpg`       |
| Lobster Ravioli             | `lobster-ravioli.jpg`        |
| Wagyu Beef Fillet           | `wagyu-fillet.jpg`           |
| Côte de Boeuf               | `cote-de-boeuf.jpg`          |
| Char-Grilled Lamb Cutlets   | `lamb-cutlets.jpg`           |
| Château Pétrus 2015         | `red-wine.jpg`               |
| Kir Royale                  | `kir-royale.jpg`             |
| Elderflower Spritz          | `elderflower-spritz.jpg`     |
| Single Malt Whisky Flight   | `whisky-flight.jpg`          |
| Crème Brûlée                | `creme-brulee.jpg`           |
| Chocolate Soufflé           | `chocolate-souffle.jpg`      |
| Tarte Tatin                 | `tarte-tatin.jpg`            |
| Mango Panna Cotta           | `mango-panna-cotta.jpg`      |

If an image file is missing, the card shows a "No image" placeholder automatically — no errors.

---

## Deploying to GitHub Pages

1. Push this entire folder to a GitHub repo
2. Go to **Settings → Pages → Source → main branch / root**
3. Your menu is live at `https://yourusername.github.io/yourrepo/`
4. Generate a QR code pointing to that URL

> ⚠️ GitHub Pages requires a web server to load `menu.json` via `fetch()`.  
> Loading `index.html` directly from the filesystem (file://) will fail to load the JSON.  
> Use a local server for development: `npx serve .` or VS Code Live Server.

---

## Admin Access

- URL: `yoursite.com/admin.html`
- Default username: `admin`
- Default password: `admin123`
- Change your password immediately after first login via **Settings → Change Password**

---

## Editing the Menu

**Option A – Edit `data/menu.json` directly**  
Add, remove or modify items and categories. Push to GitHub. Changes reflect after reload.  
If users have visited before, clear localStorage or use `localStorage.clear()` in the browser console once to re-seed from the JSON.

**Option B – Use the Admin panel**  
Login → Menu Items → Add / Edit / Delete. Changes are saved to `localStorage` and persist immediately without touching the JSON file.

---

## Adding a New Category

In `data/menu.json`, add to the `"categories"` array:

```json
{ "id": "brunch", "name": "Brunch", "icon": "fa-egg", "description": "Weekend brunch specials" }
```

Then add items with `"category": "brunch"`. Use any [Font Awesome](https://fontawesome.com/icons) icon name for `icon`.
