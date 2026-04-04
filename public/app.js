// ============================================================
//  app.js — Aroma Cafe
// ============================================================

const API_URL = 'https://aroma-cafe-production.up.railway.app/api/menu';
const FAV_KEY = 'aroma_favorites';

// ---- XSS Protection ----
function esc(str) {
  if (str === null || str === undefined) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ============================================================
//  FAVORITES — localStorage
// ============================================================
function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch { return []; }
}

function saveFavs(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFav(id) {
  return getFavs().some(f => f.id === String(id));
}

function toggleFav(item) {
  let favs = getFavs();
  const sid = String(item.id);
  if (favs.some(f => f.id === sid)) {
    favs = favs.filter(f => f.id !== sid);
  } else {
    favs.push({
      id:          sid,
      name:        item.name,
      price:       item.price,
      description: item.description,
      image:       item.image,
      category:    item.category,
    });
  }
  saveFavs(favs);
  return favs.some(f => f.id === sid); // true = now fav
}

// ============================================================
//  CURRENT MODAL ITEM
// ============================================================
let _modalItem = null;

// ============================================================
//  LOAD MENU
// ============================================================
async function loadMenu() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('تعذّر تحميل البيانات من الخادم');
    buildPage(await response.json());
  } catch (error) {
    console.warn('⚠️ الخادم غير متاح، جاري تحميل menu.json كبديل...', error);
    try {
      const fallback = await fetch('menu.json');
      if (!fallback.ok) throw new Error('menu.json غير موجود');
      buildPage(await fallback.json());
    } catch { showError(); }
  }
}

// ============================================================
//  BUILD PAGE
// ============================================================
function buildPage(data) {
  const { cafe, categories, items } = data;

  const catsArr = data.categoriesArr
    ? data.categoriesArr
    : Object.keys(categories).map(k => ({ key: k, ...categories[k] }));

  document.querySelector('.hero-title').textContent = cafe.name;

  buildTabs(catsArr, items);

  catsArr.forEach(cat => {
    const catItems = items
      .filter(i => i.category === cat.key)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    buildSection(cat.key, cat, catItems);
  });

  // Favorites section (always last)
  buildFavoritesSection();

  if (catsArr.length > 0) activateTab(catsArr[0].key);
}

// ============================================================
//  TABS — with Favorites tab
// ============================================================
function buildTabs(catsArr, items) {
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = '';

  catsArr.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className   = 'tab-btn' + (index === 0 ? ' active' : '');
    btn.dataset.tab = cat.key;
    btn.textContent = ` ${cat.label}${cat.icon || ''}`;
    btn.addEventListener('click', () => activateTab(cat.key));
    tabsEl.appendChild(btn);
  });

  // Favorites tab
  const favBtn = document.createElement('button');
  favBtn.className   = 'tab-btn tab-btn-fav';
  favBtn.dataset.tab = '__favorites__';
  favBtn.innerHTML   = '★ المفضلة';
  favBtn.addEventListener('click', () => {
    activateTab('__favorites__');
    renderFavoritesSection();
  });
  tabsEl.appendChild(favBtn);
}

// ============================================================
//  SECTION BUILD
// ============================================================
function buildSection(catKey, cat, items) {
  const wrapper = document.getElementById('sections');
  const section = document.createElement('div');
  section.id        = catKey;
  section.className = 'tab-content';

  const header   = document.createElement('div');
  header.className = 'section-header';
  const title    = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = `${cat.label} ${cat.icon || ''}`;
  const subtitle = document.createElement('p');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = cat.subtitle || '';
  const gridIcon = document.createElement('div');
  gridIcon.className = 'grid-icon';
  const grid = document.createElement('div');
  grid.className = 'menu-grid';
  grid.id = `grid-${catKey}`;

  header.appendChild(title);
  header.appendChild(subtitle);
  section.appendChild(header);
  section.appendChild(gridIcon);
  section.appendChild(grid);
  wrapper.appendChild(section);

  items.forEach((item, index) => grid.appendChild(buildCard(item, index)));
}

// ============================================================
//  FAVORITES SECTION
// ============================================================
function buildFavoritesSection() {
  const wrapper = document.getElementById('sections');
  const section = document.createElement('div');
  section.id        = '__favorites__';
  section.className = 'tab-content';
  section.innerHTML = ''; // populated on demand
  wrapper.appendChild(section);
}

function renderFavoritesSection() {
  const section = document.getElementById('__favorites__');
  section.innerHTML = '';

  const header   = document.createElement('div');
  header.className = 'section-header';
  const title    = document.createElement('h2');
  title.className   = 'section-title';
  title.textContent = '★ المفضلة';
  const subtitle = document.createElement('p');
  subtitle.className   = 'section-subtitle';
  subtitle.textContent = 'العناصر التي أضفتها للمفضلة';
  header.appendChild(title);
  header.appendChild(subtitle);
  section.appendChild(header);

  const favs = getFavs();
  if (!favs.length) {
    const empty = document.createElement('div');
    empty.className = 'fav-empty';
    empty.innerHTML = '<span>☆</span><p>لا توجد عناصر مفضلة بعد</p><small>اضغط على النجمة في أي عنصر لإضافته هنا</small>';
    section.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'menu-grid';
  favs.forEach((item, index) => grid.appendChild(buildCard(item, index)));
  section.appendChild(grid);
}

// ============================================================
//  CARD BUILD — with star button + click to modal
// ============================================================
function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'menu-card';
  card.style.animationDelay = `${index * 0.06}s`;

  // ---- Image wrap ----
  const imageWrap = document.createElement('div');
  imageWrap.className = 'card-image-wrap';

  const img = document.createElement('img');
  img.className = 'card-image';
  img.loading   = 'lazy';
  const safeImgSrc = /^https?:\/\//i.test(item.image || '') ? item.image : 'images/placeholder.jpg';
  img.src = safeImgSrc;
  img.alt = item.name;
  img.onerror = function () { this.src = 'images/placeholder.jpg'; this.onerror = null; };
  imageWrap.appendChild(img);

  // ---- Star button (top-right inside image wrap) ----
  const starBtn = document.createElement('button');
  starBtn.className  = 'card-star-btn';
  starBtn.title      = 'أضف للمفضلة';
  starBtn.setAttribute('aria-label', 'أضف للمفضلة');
  const favNow = isFav(item.id);
  starBtn.classList.toggle('active', favNow);
  starBtn.textContent = favNow ? '★' : '☆';

  starBtn.addEventListener('click', e => {
    e.stopPropagation();
    const nowFav = toggleFav(item);
    starBtn.textContent = nowFav ? '★' : '☆';
    starBtn.classList.toggle('active', nowFav);
    // If we're in favorites tab, re-render
    if (document.getElementById('__favorites__')?.classList.contains('active')) {
      renderFavoritesSection();
    }
    // Update modal star if same item
    if (_modalItem && String(_modalItem.id) === String(item.id)) {
      updateModalStar(nowFav);
    }
  });

  imageWrap.appendChild(starBtn);

  // ---- Body ----
  const body  = document.createElement('div');
  body.className = 'card-body';
  const top   = document.createElement('div');
  top.className = 'card-top';
  const name  = document.createElement('span');
  name.className   = 'card-name';
  name.textContent = item.name;
  const price = document.createElement('span');
  price.className   = 'card-price';
  price.textContent = `${item.price} د.ع`;
  const desc  = document.createElement('p');
  desc.className   = 'card-desc';
  desc.textContent = item.description;

  top.appendChild(name);
  top.appendChild(price);
  body.appendChild(top);
  body.appendChild(desc);

  card.appendChild(imageWrap);
  card.appendChild(body);

  // ---- Click → open modal ----
  card.addEventListener('click', () => openItemModal(item));

  return card;
}

// ============================================================
//  ITEM MODAL
// ============================================================
function openItemModal(item) {
  _modalItem = item;

  const overlay = document.getElementById('itemModalOverlay');
  const modalImg   = document.getElementById('modalImg');
  const modalName  = document.getElementById('modalName');
  const modalPrice = document.getElementById('modalPrice');
  const modalDesc  = document.getElementById('modalDesc');

  const safeImg = /^https?:\/\//i.test(item.image || '') ? item.image : 'images/placeholder.jpg';
  modalImg.src         = safeImg;
  modalImg.alt         = item.name;
  modalImg.onerror     = function () { this.src = 'images/placeholder.jpg'; this.onerror = null; };
  modalName.textContent  = item.name;
  modalPrice.textContent = `${item.price} د.ع`;
  modalDesc.textContent  = item.description || '';

  updateModalStar(isFav(item.id));

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateModalStar(isFaved) {
  const btn  = document.getElementById('modalFavBtn');
  const icon = document.getElementById('modalFavIcon');
  icon.textContent = isFaved ? '★' : '☆';
  btn.classList.toggle('active', isFaved);
}

function toggleFavFromModal() {
  if (!_modalItem) return;
  const nowFav = toggleFav(_modalItem);
  updateModalStar(nowFav);
  // Sync star on the card in the grid
  syncCardStar(_modalItem.id, nowFav);
  if (document.getElementById('__favorites__')?.classList.contains('active')) {
    renderFavoritesSection();
  }
}

function syncCardStar(itemId, isFaved) {
  // Find all star buttons with this item's id and sync them
  document.querySelectorAll('.card-star-btn').forEach(btn => {
    const card = btn.closest('.menu-card');
    if (!card) return;
    // We stored the item on the card via data attribute at build time
    if (card.dataset.itemId === String(itemId)) {
      btn.textContent = isFaved ? '★' : '☆';
      btn.classList.toggle('active', isFaved);
    }
  });
}

function closeItemModal(event) {
  // Only close if clicking the overlay background
  if (event && event.target !== document.getElementById('itemModalOverlay')) return;
  _closeModal();
}

function closeItemModalDirect() {
  _closeModal();
}

function _closeModal() {
  document.getElementById('itemModalOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _modalItem = null;
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') _closeModal();
});

// ============================================================
//  TAB ACTIVATION
// ============================================================
function activateTab(tabKey) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === tabKey);
  });
  if (tabKey === '__favorites__') renderFavoritesSection();
}

// ============================================================
//  ERROR
// ============================================================
function showError() {
  const sections = document.getElementById('sections');
  sections.textContent = '';
  const msg = document.createElement('div');
  msg.style.cssText = 'text-align:center;padding:60px 20px;color:#b06ac8;font-size:1.1rem;';
  msg.textContent = '⚠️ تعذّر تحميل القائمة، تأكد من تشغيل الخادم.';
  sections.appendChild(msg);
}

document.addEventListener('DOMContentLoaded', loadMenu);