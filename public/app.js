// ============================================================
//  app.js — Aroma Cafe | يقرأ البيانات من API (MongoDB)
// ============================================================

const API_URL = 'https://aroma-cafe-production.up.railway.app/api/menu';

// ---- XSS Protection ----
function esc(str) {
  if (str === null || str === undefined) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ---- تحميل البيانات من الـ API ----
async function loadMenu() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('تعذّر تحميل البيانات من الخادم');
    const data = await response.json();
    buildPage(data);
  } catch (error) {
    console.warn('⚠️ الخادم غير متاح، جاري تحميل menu.json كبديل...', error);
    try {
      const fallback = await fetch('menu.json');
      if (!fallback.ok) throw new Error('menu.json غير موجود');
      const data = await fallback.json();
      buildPage(data);
    } catch {
      showError();
    }
  }
}

// ---- بناء الصفحة كاملةً ----
function buildPage(data) {
  const { cafe, categories, items } = data;
  // استخدم categoriesArr (array مرتبة) إذا موجودة، وإلا ارجع للـ object
  const catsArr = data.categoriesArr
    ? data.categoriesArr
    : Object.keys(categories).map(k => ({ key: k, ...categories[k] }));

  document.querySelector('.hero-title').textContent = cafe.name;

  buildTabs(catsArr);

  catsArr.forEach(cat => {
    const catItems = items
      .filter(item => item.category === cat.key)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    buildSection(cat.key, cat, catItems);
  });

  if (catsArr.length > 0) activateTab(catsArr[0].key);
}

// ---- بناء أزرار التابات ----
function buildTabs(catsArr) {
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = '';

  catsArr.forEach((cat, index) => {
    const btn = document.createElement('button');
    btn.className   = 'tab-btn' + (index === 0 ? ' active' : '');
    btn.dataset.tab = cat.key;
    btn.textContent = ` ${cat.label}${cat.icon}`;
    btn.addEventListener('click', () => activateTab(cat.key));
    tabsEl.appendChild(btn);
  });
}

// ---- بناء قسم كامل ----
function buildSection(catKey, cat, items) {
  const wrapper = document.getElementById('sections');

  const section = document.createElement('div');
  section.id        = catKey;
  section.className = 'tab-content';

  // Use textContent for user data, not innerHTML
  const header = document.createElement('div');
  header.className = 'section-header';

  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = `${cat.label} ${cat.icon}`;

  const subtitle = document.createElement('p');
  subtitle.className = 'section-subtitle';
  subtitle.textContent = cat.subtitle;

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

  items.forEach((item, index) => {
    grid.appendChild(buildCard(item, index));
  });
}

// ---- بناء كرت منتج واحد — XSS safe ----
function buildCard(item, index) {
  const card = document.createElement('div');
  card.className = 'menu-card';
  card.style.animationDelay = `${index * 0.06}s`;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'card-image-wrap';

  const img = document.createElement('img');
  img.className = 'card-image';
  img.loading   = 'lazy';
  // Validate image URL — only allow http/https
  const safeImgSrc = /^https?:\/\//i.test(item.image || '') ? item.image : 'images/placeholder.jpg';
  img.src = safeImgSrc;
  img.alt = item.name;
  img.onerror = function() { this.src = 'images/placeholder.jpg'; this.onerror = null; };

  imageWrap.appendChild(img);

  const body = document.createElement('div');
  body.className = 'card-body';

  const top = document.createElement('div');
  top.className = 'card-top';

  const name = document.createElement('span');
  name.className   = 'card-name';
  name.textContent = item.name;

  const price = document.createElement('span');
  price.className   = 'card-price';
  price.textContent = `${item.price} د.ع`;

  const desc = document.createElement('p');
  desc.className   = 'card-desc';
  desc.textContent = item.description;

  top.appendChild(name);
  top.appendChild(price);
  body.appendChild(top);
  body.appendChild(desc);
  card.appendChild(imageWrap);
  card.appendChild(body);

  return card;
}

// ---- تبديل التاب النشط ----
function activateTab(tabKey) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabKey);
  });
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === tabKey);
  });
}

// ---- رسالة خطأ ----
function showError() {
  const sections = document.getElementById('sections');
  sections.textContent = ''; // clear safely
  const msg = document.createElement('div');
  msg.style.cssText = 'text-align:center;padding:60px 20px;color:#b06ac8;font-size:1.1rem;';
  msg.textContent = '⚠️ تعذّر تحميل القائمة، تأكد من تشغيل الخادم.';
  sections.appendChild(msg);
}

document.addEventListener('DOMContentLoaded', loadMenu);