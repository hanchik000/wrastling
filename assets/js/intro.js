// Заставка при запуске в стиле больших турниров: зелёная линия раскрывает кадр схватки,
// по фото проходит свет, затем кадр гаснет и собирается эмблема: две половины «W»
// сходятся, как борцы в захвате. Один раз за сеанс, пропуск касанием. Около 4,5 секунды.
import { t } from './i18n.js';

const W = 'M9.6 15.6h5.8l4.8 13.6 3.8-10.4 3.8 10.4 4.8-13.6h5.8l-8.4 20.2h-4L24 31l-2 4.8h-4z';
const RING = 'M16.4 4h15.2L44 16.4v15.2L31.6 44H16.4L4 31.6V16.4z';

export function playIntro() {
  let skip = false;
  try { skip = !!sessionStorage.getItem('wt.introSeen') || !!localStorage.getItem('wt.intro'); sessionStorage.setItem('wt.introSeen', '1'); } catch {}
  if (skip) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const word = 'WRESTLING TALENT';

  const el = document.createElement('div');
  el.className = 'intro' + (reduce ? ' calm' : '');
  el.setAttribute('role', 'presentation');
  el.innerHTML = `
    <div class="in-photo"><img src="assets/photos/hero-live.jpg" alt=""></div>
    <div class="in-shade"></div>
    <div class="in-sweep"></div>
    <div class="in-bars"><i></i><i></i></div>
    <div class="in-line"></div>
    <div class="in-cap"><span>${esc(t('intro.kicker'))}</span><b>${esc(t('intro.tag'))}</b></div>
    <div class="in-logo">
      <svg class="in-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs><clipPath id="in-r"><rect x="24" y="0" width="24" height="48"/></clipPath><clipPath id="in-l"><rect x="0" y="0" width="24" height="48"/></clipPath></defs>
        <path class="m-bg" d="M15.6 1.5h16.8l14.1 14.1v16.8L32.4 46.5H15.6L1.5 32.4V15.6z" fill="#0d1210"/>
        <path class="m-ring" d="${RING}" stroke="#27b663" stroke-width="1.3" pathLength="100"/>
        <g class="m-a"><path d="${W}" fill="#f4f2ee" clip-path="url(#in-l)"/></g>
        <g class="m-b"><path d="${W}" fill="#27b663" clip-path="url(#in-r)"/></g>
        <path class="m-d" d="M24 8.4l2.8 2.8L24 14l-2.8-2.8z" fill="#27b663"/>
      </svg>
      <div class="in-word"><b>${word}</b><i class="in-rule"></i><small>AI · ${esc(t('brand.country'))}</small></div>
    </div>
    <div class="in-grain"></div>
    <button class="intro-skip" type="button" aria-label="Skip">${esc(t('intro.skip'))} ›</button>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('intro-on');

  let done = false;
  const finish = () => {
    if (done) return; done = true;
    el.classList.add('out');
    document.documentElement.classList.remove('intro-on');
    setTimeout(() => el.remove(), 800);
  };
  el.addEventListener('click', finish);
  addEventListener('keydown', function k() { removeEventListener('keydown', k); finish(); });
  // Удар в момент, когда половины эмблемы смыкаются
  setTimeout(() => !done && navigator.vibrate?.(30), 2750);
  setTimeout(finish, reduce ? 1600 : 4600);
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
