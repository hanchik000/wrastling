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
