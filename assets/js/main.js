// Каркас приложения: шапка, нижнее меню, маршрутизация по #адресам.
import { t, LANGS, getLang, setLang, onLang } from './i18n.js';
import { icon, golMark, esc, observeReveals, hydratePhotos } from './ui.js';
import { cartCount, onChange, getUser } from './store.js';
import { initFx, initGlobalFx, routeSweep } from './fx.js';

import home from './views/home.js';
import scout from './views/scout.js';
import testView from './views/test.js';
import record from './views/record.js';
import result from './views/result.js';
import login from './views/login.js';
import profile from './views/profile.js';
import coach from './views/coach.js';
import review from './views/review.js';
import media from './views/media.js';
import live from './views/live.js';
import news from './views/news.js';
import shop from './views/shop.js';
import product from './views/product.js';
import cart from './views/cart.js';
import checkout from './views/checkout.js';
import about from './views/about.js';
import rankings from './views/rankings.js';
import notFound from './views/notfound.js';

const ROUTES = [
  ['/', home, 'home'],
  ['/scout', scout, 'scout'],
  ['/scout/test/:id', testView, 'scout'],
  ['/scout/record/:id', record, 'scout'],
  ['/scout/result/:id', result, 'scout'],
  ['/login', login, 'profile'],
  ['/profile', profile, 'profile'],
  ['/coach', coach, 'profile'],
  ['/coach/review/:id', review, 'profile'],
  ['/rankings', rankings, 'rankings'],
  ['/media', media, 'media'],
  ['/live/:id', live, 'media'],
  ['/news/:id', news, 'media'],
  ['/shop', shop, 'shop'],
  ['/shop/:store', shop, 'shop'],
  ['/product/:id', product, 'shop'],
  ['/cart', cart, 'shop'],
  ['/checkout', checkout, 'shop'],
  ['/about', about, 'home'],
];

function match(path) {
  for (const [pattern, view, nav] of ROUTES) {
    const pp = pattern.split('/').filter(Boolean);
    const ap = path.split('/').filter(Boolean);
    if (pp.length !== ap.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
      else if (pp[i] !== ap[i]) { ok = false; break; }
    }
    if (ok) return { view, params, nav };
  }
  return { view: notFound, params: {}, nav: '' };
}

export function go(path) { location.hash = '#' + path; }
window.__go = go;

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

// ---------- Шапка и меню ----------
const NAV = [
  { id: 'home', href: '/', icon: icon.home, key: 'nav.home' },
  { id: 'rankings', href: '/rankings', icon: icon.trophy, key: 'nav.rankings' },
  { id: 'scout', href: '/scout', icon: icon.scout, key: 'nav.scout' },
  { id: 'media', href: '/media', icon: icon.media, key: 'nav.events' },
  { id: 'shop', href: '/shop', icon: icon.bag, key: 'nav.shop' },
];

function shell() {
  document.body.innerHTML = `
    <a class="skip" href="#main-content">${esc(t('a11y.skip'))}</a>
    <header class="topbar">
      <div class="container">
        <a class="brand" href="#/" aria-label="${esc(t('brand.name'))}">
          ${golMark()}
          <span class="brand-word">Wrestling Talent<small>AI · ${esc(t('brand.country'))}</small></span>
        </a>
        <nav class="topnav" aria-label="${esc(t('a11y.main_nav'))}">
          ${NAV.map((n) => `<a href="#${n.href}" data-nav="${n.id}">${esc(t(n.key))}</a>`).join('')}
        </nav>
        <div class="top-actions">
          <a class="demo-pill" href="#/about">${esc(t('common.demo_version'))}</a>
          <div class="lang" role="group" aria-label="${esc(t('a11y.language'))}">
            ${LANGS.map((l) => `<button type="button" data-lang="${l.code}" aria-pressed="${l.code === getLang()}">${l.label}</button>`).join('')}
          </div>
          <a class="icon-btn" href="#/cart" aria-label="${esc(t('nav.cart'))}">${icon.cart}<span class="dot" data-cart hidden></span></a>
          <a class="icon-btn" href="#/profile" data-nav="profile" aria-label="${esc(t('nav.profile'))}">${icon.user}</a>
        </div>
      </div>
    </header>
    <main id="main-content" tabindex="-1"></main>
    <footer class="footer-big">
      <div class="carpet-band thin muted" aria-hidden="true"></div>
      <div class="container">
        <div class="cols">
          <div>
            <a class="brand" href="#/">${golMark()}<span class="brand-word">Wrestling Talent<small>AI · ${esc(t('brand.country'))}</small></span></a>
            <p class="mt-4" style="max-width:32ch">${esc(t('footer.about_text'))}</p>
            <p class="mt-4"><a href="https://www.instagram.com/turkmenistanwrestling" target="_blank" rel="noopener">Instagram ↗</a></p>
          </div>
          <div><h4>${esc(t('footer.c_platform'))}</h4><ul>
            <li><a href="#/scout">Talent Scout</a></li><li><a href="#/rankings">${esc(t('nav.rankings'))}</a></li><li><a href="#/coach">${esc(t('coach.open'))}</a></li></ul></div>
          <div><h4>${esc(t('footer.c_events'))}</h4><ul>
            <li><a href="#/media?tab=events">${esc(t('media.events'))}</a></li><li><a href="#/media?tab=news">${esc(t('media.news'))}</a></li><li><a href="#/live/e1">LIVE</a></li></ul></div>
          <div><h4>${esc(t('nav.shop'))}</h4><ul>
            <li><a href="#/shop">${esc(t('shop.gear'))}</a></li><li><a href="#/shop/nutrition">${esc(t('shop.nutrition'))}</a></li><li><a href="#/cart">${esc(t('nav.cart'))}</a></li></ul></div>
          <div><h4>${esc(t('footer.c_info'))}</h4><ul>
            <li><a href="#/about">${esc(t('footer.about'))}</a></li><li><a href="#/profile">${esc(t('nav.profile'))}</a></li></ul></div>
        </div>
        <div class="bottom"><span>© 2026 Wrestling Talent AI</span><span>${esc(t('footer.note'))}</span></div>
      </div>
    </footer>
    <nav class="bottomnav" aria-label="${esc(t('a11y.main_nav'))}">
      ${NAV.map((n) => n.id === 'scout'
        ? `<a href="#${n.href}" data-nav="${n.id}" class="scout"><span class="ring">${n.icon}</span>${esc(t(n.key))}</a>`
        : `<a href="#${n.href}" data-nav="${n.id}">${n.icon}<span>${esc(t(n.key))}</span></a>`).join('')}
    </nav>`;

  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  updateCart();
  initGlobalFx();
}

function updateCart() {
  const dot = document.querySelector('[data-cart]');
  if (!dot) return;
  const n = cartCount();
  dot.hidden = n === 0;
  dot.textContent = n;
}

function setActiveNav(id) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

// ---------- Рендер экрана ----------
let current = null;
let renderId = 0;

async function render() {
  const myId = ++renderId;
  if (current) routeSweep();
  const { path, query } = parseHash();
  const { view, params, nav } = match(path);
  try { current?.unmount?.(); } catch {}
  current = null;

  let out;
  try {
    out = await view({ params, query, user: getUser(), go });
  } catch (e) {
    console.error(e);
    out = { html: `<div class="container section"><div class="notice error">${icon.alert}<div>${esc(t('common.error_generic'))}</div></div></div>` };
  }
  if (myId !== renderId) return;
  if (out?.redirect) { location.replace('#' + out.redirect); return; }

  const main = document.getElementById('main-content');
  main.className = (out.theme === 'light' ? 'theme-light ' : '') + 'view-enter';
  document.body.classList.toggle('theme-light-page', out.theme === 'light');
  main.innerHTML = out.html;
  document.title = (out.title ? out.title + ' · ' : '') + 'Wrestling Talent AI';
  setActiveNav(nav);
  if (!out.keepScroll) window.scrollTo(0, 0);
  current = out;
  try { out.mount?.(main); } catch (e) { console.error(e); }
  observeReveals(main);
  hydratePhotos(main);
  initFx(main);
  setTimeout(() => main.classList.remove('view-enter'), 450);
  if (out.focus !== false && document.activeElement === document.body) main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', render);
onLang(() => { shell(); render(); });
onChange((key) => { if (key === 'cart') updateCart(); });

shell();
render();
