// Визуальные элементы помощника и кабинета: лицо Champ AI, кольцо готовности, стакан воды,
// иконки упражнений, мини-графики. Всё — SVG, без картинок.
import { testArt } from './art.js';
import { exName } from './assistant.js';

const OCT = (cx, cy, r) => { const a = r * 0.414; return `M${cx - a} ${cy - r}h${2 * a}l${r - a} ${r - a}v${2 * a}l${a - r} ${r - a}h${-2 * a}l${a - r} ${a - r}v${-2 * a}z`; };

// Образ Champ AI: стеклянная восьмиконечная звезда, внутри — яркая зелёная живая сфера.
// mood влияет только на ритм (всегда зелёный); cls: sm/mid/big/huge, think — думает
let orbN = 0;
export function dostFace(mood = 'happy', cls = '') {
  const id = 'ob' + (++orbN);
  return `<span class="orb ${mood} ${cls}" aria-hidden="true">
    <i class="o-glow"></i>
    <svg class="o-glass" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".34"/><stop offset=".45" stop-color="#bfffd9" stop-opacity=".08"/><stop offset="1" stop-color="#2fd174" stop-opacity=".22"/></linearGradient>
        <linearGradient id="${id}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#9dffc6" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity=".7"/></linearGradient>
        <clipPath id="${id}c"><path d="M50.00 2.00L64.06 16.06L83.94 16.06L83.94 35.94L98.00 50.00L83.94 64.06L83.94 83.94L64.06 83.94L50.00 98.00L35.94 83.94L16.06 83.94L16.06 64.06L2.00 50.00L16.06 35.94L16.06 16.06L35.94 16.06Z"/></clipPath>
      </defs>
      <path d="M50.00 2.00L64.06 16.06L83.94 16.06L83.94 35.94L98.00 50.00L83.94 64.06L83.94 83.94L64.06 83.94L50.00 98.00L35.94 83.94L16.06 83.94L16.06 64.06L2.00 50.00L16.06 35.94L16.06 16.06L35.94 16.06Z" fill="url(#${id}g)"/>
      <g clip-path="url(#${id}c)"><rect class="o-sheen" x="-60" y="-10" width="34" height="140" fill="#ffffff" opacity=".22" transform="rotate(25 50 50)"/></g>
      <path d="M50.00 5.50L63.03 18.53L81.47 18.53L81.47 36.97L94.50 50.00L81.47 63.03L81.47 81.47L63.03 81.47L50.00 94.50L36.97 81.47L18.53 81.47L18.53 63.03L5.50 50.00L18.53 36.97L18.53 18.53L36.97 18.53Z" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width=".8"/>
      <path d="M50.00 9.00L62.01 21.01L78.99 21.01L78.99 37.99L91.00 50.00L78.99 62.01L78.99 78.99L62.01 78.99L50.00 91.00L37.99 78.99L21.01 78.99L21.01 62.01L9.00 50.00L21.01 37.99L21.01 21.01L37.99 21.01Z" fill="none" stroke="#7dffb4" stroke-opacity=".25" stroke-width=".6"/>
      <path d="M50.00 2.00L64.06 16.06L83.94 16.06L83.94 35.94L98.00 50.00L83.94 64.06L83.94 83.94L64.06 83.94L50.00 98.00L35.94 83.94L16.06 83.94L16.06 64.06L2.00 50.00L16.06 35.94L16.06 16.06L35.94 16.06Z" fill="none" stroke="url(#${id}e)" stroke-width="1.6" stroke-linejoin="round"/>
    </svg>
    <i class="o-core"></i><i class="o-swirl"></i><i class="o-swirl s2"></i><i class="o-shine"></i>
  </span>`;
}

// Кольцо готовности в форме гёля
export function readinessGol(score, zone, label, sub) {
  const col = { go: '#27b663', care: '#e8a21d', rest: '#e23b3b' }[zone];
  return `<div class="rgol ${zone}" role="img" aria-label="${label}: ${score}">
    <svg viewBox="0 0 120 120">
      <path d="${OCT(60, 60, 54)}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="9" stroke-linejoin="round"/>
      <path class="val" d="${OCT(60, 60, 54)}" fill="none" stroke="${col}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" pathLength="100" style="--v:${score}"/>
      <path d="${OCT(60, 60, 40)}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
    </svg>
    <div class="rgol-in"><b class="num">${score}</b><span>${label}</span>${sub ? `<em style="color:${col}">${sub}</em>` : ''}</div>
  </div>`;
}

// Стакан воды: уровень = выпито / норма
export function waterGlass(ml, target) {
  const k = Math.max(0, Math.min(1, ml / target));
  const top = 18 + (1 - k) * 92;
  return `<svg class="wglass" viewBox="0 0 90 124" aria-hidden="true">
    <defs><clipPath id="wgc"><path d="M12 12h66l-8 104q-1 6-7 6H27q-6 0-7-6z"/></clipPath></defs>
    <g clip-path="url(#wgc)">
      <rect x="0" y="0" width="90" height="124" fill="rgba(58,167,224,.06)"/>
      <path class="wave" d="M-90 ${top} q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V130 H-90z" fill="#3aa7e0" opacity=".85"/>
      <path class="wave w2" d="M-90 ${top + 3} q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V130 H-90z" fill="#2a86bb" opacity=".7"/>
    </g>
    <path d="M12 12h66l-8 104q-1 6-7 6H27q-6 0-7-6z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 24l5 84" stroke="rgba(255,255,255,.25)" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

// Иконки упражнений
const S = (b) => `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const EX_ART = {
  bridge: testArt.bridge_up, bridge_walk: testArt.bridge_walk, shots: testArt.shot, sprawls: testArt.sprawl, pullups: testArt.pullup, running: testArt.shuttle,
  squats: S('<circle cx="64" cy="26" r="7"/><path d="M60 33 50 62l24 4-4 30M50 62l-14 4M58 42l26 6"/><path d="M10 98h100"/>'),
  pushups: S('<circle cx="96" cy="58" r="7"/><path d="M88 62 22 78M80 64l2 24M22 78l-8 4"/><path d="M10 92h100"/>'),
  throws: S('<circle cx="40" cy="30" r="7"/><path d="M44 36 58 64l-6 30M58 64l14 30M48 46l26-6"/><circle cx="88" cy="40" r="6"/><path d="M84 46 70 30M86 46l10 26M74 34l20-14"/><path d="M10 98h100"/>'),
  sparring: S('<circle cx="38" cy="28" r="7"/><circle cx="82" cy="28" r="7"/><path d="M40 35 50 64l-8 30M50 64l10 30M80 35 70 64l8 30M70 64l-10 30M44 46l30 8M76 46l-30 8"/><path d="M10 98h100"/>'),
};
export function exTile(id, lang, banned = true) {
  return `<span class="extile ${banned ? 'no' : 'ok'}" title="${exName(id, lang)}"><span class="pic">${EX_ART[id] || ''}</span><span class="nm">${exName(id, lang)}</span></span>`;
}

// Мини-график
export function sparkline(vals, w = 120, h = 36) {
  if (vals.length < 2) return '';
  const lo = Math.min(...vals), hi = Math.max(...vals), r = hi - lo || 1;
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * (w - 6) + 3, h - 4 - ((v - lo) / r) * (h - 8)]);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('')}"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="3"/></svg>`;
}
