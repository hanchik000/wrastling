// Анимации интерфейса. Каждая что-то показывает: появление контента, рост цифр, глубину сцены.
// При «Уменьшить движение» в системе всё показывается сразу, без анимаций.
import { reduceMotion } from './ui.js';

// ---------- Заголовки: слова выезжают из-под маски ----------
function splitWords(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 3) {
        const parts = ch.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('i');
          inner.textContent = p;
          inner.style.setProperty('--d', `${i++ * 70}ms`);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && ch.tagName !== 'BR' && ch.tagName !== 'SMALL') {
        walk(ch);
      }
    });
  };
  walk(el);
  el.classList.add('split');
}

// ---------- Счётчики: число растёт от нуля ----------
function countTo(el) {
  const to = parseFloat(el.dataset.to);
  const digits = +(el.dataset.digits || 0);
  if (!Number.isFinite(to)) return;
  const ms = 1100, t0 = performance.now();
  const fmt = (v) => v.toFixed(digits);
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = fmt(to * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = fmt(0);
  requestAnimationFrame(step);
}

// ---------- Общий наблюдатель за появлением ----------
let io = null;
function observer() {
  if (io) return io;
  io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      if (el.dataset.to !== undefined) countTo(el);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
  return io;
}

// ---------- Наклон карточки за курсором ----------
function bindTilt(el) {
  if (el.dataset.tiltBound) return;
  el.dataset.tiltBound = '1';
  const max = +(el.dataset.tilt || 6);
  let raf = 0;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--ry', `${x * max}deg`);
      el.style.setProperty('--rx', `${-y * max}deg`);
      el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
  });
  el.addEventListener('pointerleave', () => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
}

// ---------- Параллакс при прокрутке ----------
let parallaxEls = [];
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const vh = innerHeight;
    // полоса прогресса прокрутки
    const bar = document.querySelector('.scroll-progress i');
    if (bar) {
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    }
    parallaxEls = parallaxEls.filter((el) => el.isConnected);
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const k = +(el.dataset.parallax || 0.15);
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * k).toFixed(1)}px, 0)`;
    });
  });
}

export function initFx(root) {
  const reduce = reduceMotion();
  // разбиение заголовков — всегда (для доступности текст тот же), анимация — только без reduce
  root.querySelectorAll('[data-split]').forEach(splitWords);
  if (reduce || !('IntersectionObserver' in window)) {
    root.querySelectorAll('[data-split], [data-stagger], [data-to], .rise-in').forEach((el) => el.classList.add('in'));
    return;
  }
  root.querySelectorAll('[data-stagger]').forEach((el) => {
    [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  const o = observer();
  root.querySelectorAll('[data-split]:not(.slide [data-split]), [data-stagger], [data-to], .rise-in').forEach((el) => o.observe(el));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) root.querySelectorAll('[data-tilt]').forEach(bindTilt);
  parallaxEls = [...root.querySelectorAll('[data-parallax]')];
  onScroll();
}

// Вызывается один раз: полоса прогресса и линия перехода между страницами
export function initGlobalFx() {
  if (!document.querySelector('.scroll-progress')) {
    const p = document.createElement('div');
    p.className = 'scroll-progress';
    p.innerHTML = '<i></i>';
    document.body.appendChild(p);
  }
  if (window.__fxBound) return;
  window.__fxBound = true;
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
}

export function routeSweep() {
  if (reduceMotion()) return;
  let s = document.querySelector('.route-sweep');
  if (!s) { s = document.createElement('div'); s.className = 'route-sweep'; document.body.appendChild(s); }
  s.classList.remove('go');
  void s.offsetWidth;
  s.classList.add('go');
}
