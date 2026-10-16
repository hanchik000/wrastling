// Общие помощники интерфейса: экранирование, иконки, тосты, нижние панели, появление при прокрутке.
import { t } from './i18n.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const P = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icon = {
  home: P('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  media: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>'),
  scout: P('<circle cx="12" cy="5" r="2"/><path d="M12 7v6m0 0-4 7m4-7 4 7M6 10l6-1 6 1"/>'),
  bag: P('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  arrow: P('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
  back: P('<path d="M19 12H5m6 6-6-6 6-6"/>'),
  check: P('<path d="m5 12 5 5 9-10"/>'),
  x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-9.5v.5"/>'),
  alert: P('<path d="M12 3 2 20h20z"/><path d="M12 10v4m0 3v.5"/>'),
  lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  camera: P('<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/>'),
  upload: P('<path d="M12 16V4m-5 5 5-5 5 5M4 20h16"/>'),
  cart: P('<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>'),
  heart: P('<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2.5A4.5 4.5 0 0 1 21 11c-2 4.5-9 9-9 9z"/>'),
  heartFill: P('<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2.5A4.5 4.5 0 0 1 21 11c-2 4.5-9 9-9 9z" fill="currentColor"/>'),
  chart: P('<path d="M4 20V10m6 10V4m6 16v-7m4 7H3"/>'),
  diary: P('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M11 12h2l1.5-3 2 6 1.5-3"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  trash: P('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  flame: P('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-7z"/>'),
  shield: P('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  play: P('<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>'),
  pause: P('<path d="M7 4h3v16H7zm7 0h3v16h-3z" fill="currentColor" stroke="none"/>'),
  replay: P('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>'),
  coach: P('<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>'),
  phone: P('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  sound: P('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: P('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6m0-6-5 6"/>'),
  live: P('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/><circle cx="9.5" cy="12" r="2.2" fill="currentColor" stroke="none"/>'),
  sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  body: P('<circle cx="12" cy="4" r="2"/><path d="M12 6v8m-5-6h10M9 22l3-8 3 8"/>'),
  ruler: P('<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2m1-5 2 2m1-5 2 2"/>'),
  trophy: P('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4a3 3 0 0 0 4 4m8-4h4a3 3 0 0 1-4 4M12 13v4m-4 4h8m-6-4h4"/>'),
  filter: P('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>'),
  truck: P('<path d="M3 6h11v10H3zm11 4h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  logout: P('<path d="M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
};

// Знак гёль — восьмиугольник с ромбом. Используется как логотип и маркер суставов.
export function golMark(cls = '') {
  return `<svg class="${cls}" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M14 3h12l11 11v12L26 37H14L3 26V14z" stroke="#27b663" stroke-width="1.6"/>
    <path d="M20 9l11 11-11 11L9 20z" stroke="#f4f2ee" stroke-width="1.6"/>
    <circle cx="20" cy="20" r="2.6" fill="#27b663"/>
  </svg>`;
}

export function golPath(x, y, r) {
  const a = r * 0.414;
  return `M${x - a} ${y - r}h${2 * a}l${r - a} ${r - a}v${2 * a}l${-(r - a)} ${r - a}h${-2 * a}l${-(r - a)} ${-(r - a)}v${-2 * a}z`;
}

// ---------- Тосты ----------
export function toast(msg, type = 'ok') {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = (type === 'error' ? icon.alert : icon.check) + `<span>${esc(msg)}</span>`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- Нижняя панель / диалог ----------
export function sheet(html, mount) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const panel = document.createElement('div');
  panel.className = 'sheet';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = `<div class="grab"></div>${html}`;
  document.body.append(scrim, panel);
  const prevFocus = document.activeElement;
  requestAnimationFrame(() => { scrim.classList.add('open'); panel.classList.add('open'); });
  const close = () => {
    scrim.classList.remove('open');
    panel.classList.remove('open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { scrim.remove(); panel.remove(); prevFocus?.focus?.(); }, 300);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  scrim.addEventListener('click', close);
  panel.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  const first = panel.querySelector('button, a, input, select, textarea');
  setTimeout(() => first?.focus(), 50);
  mount?.(panel, close);
  return close;
}

// ---------- Появление разделов при прокрутке ----------
let io;
export function observeReveals(root) {
  const els = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  io?.disconnect();
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}

// Плавный счётчик для табло
export function countUp(el, to, { digits = 0, ms = 600 } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !Number.isFinite(to)) { el.textContent = Number.isFinite(to) ? to.toFixed(digits) : '—'; return; }
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = (to * e).toFixed(digits);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function demoBadge() { return `<span class="badge badge-demo">${esc(t('common.demo'))}</span>`; }

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Фото-слоты ----------
// <div data-photo="hero-1"> ищет assets/photos/hero-1.jpg. Нашлось — показываем фото, нет — остаётся графика.
const photoCache = new Map();
function probe(key) {
  if (!photoCache.has(key)) {
    photoCache.set(key, new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.src);
      img.onerror = () => resolve(null);
      img.src = `assets/photos/${key}.jpg`;
    }));
  }
  return photoCache.get(key);
}
export function hydratePhotos(root) {
  root.querySelectorAll('[data-photo]').forEach(async (el) => {
    const src = await probe(el.dataset.photo);
    if (!src) return;
    el.style.backgroundImage = `url("${src}")`;
    el.classList.add('has-photo');
  });
}
export function photoSlot(key, art = '', cls = '', shade = true) {
  // key = null — фото запрещено (например, дети в публичном рейтинге), всегда графика
  return `<div class="photo ${cls}" ${key ? `data-photo="${esc(key)}"` : ''}><div class="art">${art}</div>${shade ? '<div class="shade"></div>' : ''}</div>`;
}
