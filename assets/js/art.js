// Линейные иллюстрации-заглушки вместо фото. Помечаются «фото скоро» и заменяются настоящими снимками.
const S = (body, vb = '0 0 120 120') =>
  `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const G = '#c8a45a';

export const productArt = {
  shoe: S(`<path d="M18 74c0-14 6-30 10-36l14 2c2 8 10 14 22 18l26 8c8 3 12 8 12 14v6H18z"/><path d="M18 86h84"/><path d="M42 48l6 8m2-12 6 8m2-10 6 8" stroke="${G}"/><path d="M18 80h84" stroke-dasharray="3 5"/>`),
  singlet: S(`<path d="M42 18c2 12 8 18 18 18s16-6 18-18l8 2-2 30c-2 10-2 30 4 52H32c6-22 6-42 4-52l-2-30z"/><path d="M36 64h48" stroke="${G}"/><path d="M60 64v38"/>`),
  headgear: S(`<path d="M30 58c0-20 14-34 30-34s30 14 30 34"/><ellipse cx="30" cy="66" rx="10" ry="14"/><ellipse cx="90" cy="66" rx="10" ry="14"/><path d="M34 80l14 14h24l14-14" /><path d="M44 30l32 0M40 42h40" stroke="${G}"/>`),
  kneepad: S(`<path d="M40 22h40c4 20 4 56 0 76H40c-4-20-4-56 0-76z"/><ellipse cx="60" cy="58" rx="14" ry="16" stroke="${G}"/><path d="M40 34h40M40 86h40"/>`),
  hoodie: S(`<path d="M44 22c4 10 28 10 32 0l18 8 8 30-12 4v40H30V64l-12-4 8-30z"/><path d="M48 24c2 14 22 14 24 0"/><path d="M46 74h28v14H46z" stroke="${G}"/><path d="M56 38v14m8-14v14"/>`),
  bag: S(`<rect x="18" y="44" width="84" height="46" rx="10"/><path d="M42 44c0-14 36-14 36 0"/><path d="M18 64h84" stroke="${G}"/><path d="M80 64v26"/>`),
  bottle: S(`<path d="M50 14h20v10l6 8v74a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6V32l6-8z"/><path d="M44 54h32" stroke="${G}"/><path d="M44 80h32"/>`),
  tee: S(`<path d="M40 22l-22 12 8 18 10-4v52h48V48l10 4 8-18-22-12c-4 8-28 8-32 0z"/><path d="M50 58l10-10 10 10-10 10z" stroke="${G}"/>`),
  tub: S(`<path d="M30 30h60l-4 76H34z"/><rect x="26" y="20" width="68" height="12" rx="3"/><path d="M42 56h36M42 70h24" stroke="${G}"/>`),
  sachet: S(`<path d="M34 18h52l-4 84H38z"/><path d="M34 26h52M38 94h44" stroke-dasharray="3 4"/><path d="M50 50l10 14 10-14" stroke="${G}"/>`),
  bar: S(`<path d="M14 46l84-18 8 36-84 18z"/><path d="M14 46l8 36M98 28l8 36"/><path d="M34 54l50-10" stroke="${G}"/>`),
};

export const newsArt = {
  mat: S(`<circle cx="60" cy="60" r="44"/><circle cx="60" cy="60" r="18" stroke="${G}"/><path d="M60 16v88M16 60h88" stroke-dasharray="2 5"/>`),
  trophy: S(`<path d="M40 22h40v22a20 20 0 0 1-40 0z"/><path d="M40 30H26a14 14 0 0 0 16 18M80 30h14a14 14 0 0 1-16 18"/><path d="M60 64v18M44 98h32M48 82h24v16H48z" stroke="${G}"/>`),
  phone: S(`<rect x="38" y="14" width="44" height="92" rx="8"/><circle cx="60" cy="44" r="6" stroke="${G}"/><path d="M60 50v18l-8 14m8-14 8 14M50 58h20" stroke="${G}"/>`),
  arena: S(`<path d="M10 90c20-30 80-30 100 0"/><path d="M24 90c14-18 58-18 72 0"/><ellipse cx="60" cy="90" rx="22" ry="6" stroke="${G}"/>`),
};

export const testArt = {
  squat: S(`<circle cx="70" cy="30" r="8"/><path d="M66 38l-8 24-20 10 18 6-4 22M58 62l26-6M84 56h12" /><path d="M30 102h70" stroke="${G}"/>`),
  pushup: S(`<circle cx="94" cy="54" r="7"/><path d="M88 60 30 74l-12 8M78 63v28M30 92h76" /><path d="M14 98h96" stroke="${G}"/>`),
  burpee: S(`<circle cx="60" cy="18" r="8"/><path d="M60 26v34l-10 24M60 60l10 24M44 34l16-6 16 6" /><path d="M40 104h40" stroke="${G}"/><path d="M50 10l10-8 10 8" stroke="${G}"/>`),
  jump: S(`<circle cx="58" cy="28" r="7"/><path d="M52 34l-10 26 22 8-6 20M42 60l-16 4M64 40l18-6" /><path d="M14 100h92" stroke="${G}"/><path d="M30 92l40-30 30 30" stroke="${G}" stroke-dasharray="3 5"/>`),
  reach: S(`<circle cx="74" cy="56" r="7"/><path d="M68 62 36 86h56l8-6M66 66l26 12" /><path d="M20 92h84" stroke="${G}"/>`),
  bridge: S(`<circle cx="28" cy="88" r="7"/><path d="M34 82c14-30 40-34 52-16l8 26M34 82l-10 10M86 66l-6 26" /><path d="M14 98h92" stroke="${G}"/>`),
};

export function artBox(svg, extra = '') {
  return `<div class="ph-art" ${extra}>${svg}</div>`;
}

// ---------- Силуэты борцов: запасная графика вместо фото ----------
const golD = (x, y, r) => { const a = r * 0.414; return `M${x - a} ${y - r}h${2 * a}l${r - a} ${r - a}v${2 * a}l${a - r} ${r - a}h${-2 * a}l${a - r} ${a - r}v${-2 * a}z`; };
const LIMBS = [['neck', 'head'], ['shF', 'elF'], ['elF', 'wrF'], ['shB', 'elB'], ['elB', 'wrB'], ['hipF', 'knF'], ['knF', 'anF'], ['hipB', 'knB'], ['knB', 'anB']];
const SKEL = [['neck', 'shF'], ['neck', 'shB'], ['shF', 'hipF'], ['shB', 'hipB'], ['hipF', 'hipB'], ...LIMBS.slice(1)];

function figure(P, uid, { width = 30, skeleton = true, rim = true } = {}) {
  const line = (a, b, w, stroke, extra = '') => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
  const torso = `M${P.shF[0]} ${P.shF[1]}L${P.shB[0]} ${P.shB[1]}L${P.hipB[0]} ${P.hipB[1]}L${P.hipF[0]} ${P.hipF[1]}Z`;
  // Толщина по сегментам: бёдра шире, предплечья и голени уже
  const K = { 'neck-head': 0.62, 'shF-elF': 0.82, 'elF-wrF': 0.64, 'shB-elB': 0.82, 'elB-wrB': 0.64, 'hipF-knF': 1.08, 'knF-anF': 0.72, 'hipB-knB': 1.08, 'knB-anB': 0.72 };
  const body = (fill, w) => `<path d="${torso}" fill="${fill}" stroke="${fill}" stroke-width="${w * 0.9}" stroke-linejoin="round"/>${LIMBS.map(([a, b]) => line(a, b, w * (K[a + '-' + b] || 1), fill)).join('')}<circle cx="${P.head[0]}" cy="${P.head[1]}" r="${w * 0.66}" fill="${fill}"/>`;
  let out = '';
  if (rim) out += `<g transform="translate(-3 -3)" opacity=".75">${body(`url(#rim-${uid})`, width + 2)}</g>`;
  out += `<g>${body(`url(#body-${uid})`, width)}</g>`;
  if (skeleton) {
    out += `<g opacity=".9">${SKEL.map(([a, b]) => line(a, b, 1.6, 'rgba(244,242,238,.85)')).join('')}</g>`;
    out += Object.entries(P).map(([k, [x, y]]) => {
      const key = ['hipF', 'knF', 'shF', 'elF'].includes(k);
      return `<path d="${golD(x, y, key ? 6 : 4)}" fill="${key ? '#c8a45a' : '#0b0b0c'}" stroke="${key ? '#c8a45a' : '#f4f2ee'}" stroke-width="1.3"/>`;
    }).join('');
  }
  return out;
}
function defs(uid, tone = 'gold') {
  const rimColor = tone === 'red' ? '#e23b3b' : '#c8a45a';
  return `<defs>
    <linearGradient id="body-${uid}" x1="0" y1="60" x2="0" y2="490" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a3b42"/><stop offset=".55" stop-color="#1f2024"/><stop offset="1" stop-color="#0f1012"/></linearGradient>
    <linearGradient id="rim-${uid}" x1="80" y1="60" x2="420" y2="480" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${rimColor}" stop-opacity=".9"/><stop offset=".6" stop-color="${rimColor}" stop-opacity=".15"/><stop offset="1" stop-color="${rimColor}" stop-opacity="0"/></linearGradient>
    <radialGradient id="glow-${uid}" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${rimColor}" stop-opacity=".22"/><stop offset="1" stop-color="${rimColor}" stop-opacity="0"/></radialGradient>
  </defs>`;
}
const mirror = (P, cx) => Object.fromEntries(Object.entries(P).map(([k, [x, y]]) => [k, [2 * cx - x, y]]));

const CLINCH_A = {
  head: [262, 150], neck: [255, 182], shF: [286, 200], shB: [232, 192], elF: [322, 238], wrF: [338, 196], elB: [274, 256], wrB: [318, 284],
  hipF: [224, 322], hipB: [204, 316], knF: [262, 392], anF: [246, 474], knB: [168, 398], anB: [126, 474],
};
const STANCE_FRONT = {
  head: [200, 92], neck: [200, 128], shF: [252, 150], shB: [148, 150], elF: [290, 218], wrF: [262, 276], elB: [110, 218], wrB: [138, 276],
  hipF: [232, 296], hipB: [168, 296], knF: [266, 384], anF: [278, 472], knB: [134, 384], anB: [122, 472],
};
const SHOT = {
  head: [330, 236], neck: [306, 256], shF: [318, 270], shB: [292, 262], elF: [358, 300], wrF: [394, 298], elB: [334, 312], wrB: [372, 320],
  hipF: [212, 318], hipB: [198, 312], knF: [282, 388], anF: [292, 474], knB: [222, 470], anB: [128, 466],
};

// Пара в захвате (баннеры), одиночная стойка (карточки спортсменов), проход в ноги (промо)
export function wrestlersArt(kind = 'clinch', { tone = 'gold', uid = kind, skeleton = true } = {}) {
  if (kind === 'single') {
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${defs(uid, tone)}
      <ellipse cx="200" cy="300" rx="190" ry="220" fill="url(#glow-${uid})"/>
      <path d="${golD(200, 260, 170)}" fill="none" stroke="rgba(200,164,90,.12)"/>
      ${figure(STANCE_FRONT, uid, { width: 34, skeleton })}</svg>`;
  }
  if (kind === 'shot') {
    return `<svg viewBox="0 0 500 500" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${defs(uid, tone)}
      <ellipse cx="260" cy="320" rx="240" ry="200" fill="url(#glow-${uid})"/>
      <path d="M90 470 Q 220 250 420 300" fill="none" stroke="rgba(200,164,90,.55)" stroke-width="1.6" stroke-dasharray="4 7"/>
      ${figure(SHOT, uid, { width: 30, skeleton })}</svg>`;
  }
  const B = mirror(CLINCH_A, 300);
  return `<svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${defs(uid, tone)}${defs(uid + 'b', tone)}
    <ellipse cx="300" cy="300" rx="280" ry="220" fill="url(#glow-${uid})"/>
    <path d="${golD(300, 280, 200)}" fill="none" stroke="rgba(200,164,90,.1)"/>
    <ellipse cx="300" cy="480" rx="220" ry="14" fill="rgba(0,0,0,.45)"/>
    ${figure(B, uid + 'b', { width: 32, skeleton: false })}
    ${figure(CLINCH_A, uid, { width: 32, skeleton })}</svg>`;
}
