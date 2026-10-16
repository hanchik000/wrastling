// Живое отслеживание тренировки камерой: счётчики повторений по кадрам в реальном времени.
// На вход — кадр { t, p }, где p — 13 точек [x, y, видимость] в порядке KEEP из pose.js.
// Каждый счётчик — конечный автомат с гистерезисом: повтор засчитывается только за полное движение.

export const LIVE_EX = [
  { id: 'squat', kind: 'reps', metric: 'squats', type: 'strength' },
  { id: 'pushup', kind: 'reps', metric: 'pushups', type: 'strength' },
  { id: 'pullup', kind: 'reps', metric: 'pullups', type: 'strength' },
  { id: 'sprawl', kind: 'reps', metric: 'sprawls', type: 'mat' },
  { id: 'shot', kind: 'reps', metric: null, type: 'mat' },
  { id: 'bridge', kind: 'hold', metric: null, type: 'mat' },
];
export const liveEx = (id) => LIVE_EX.find((x) => x.id === id) || LIVE_EX[0];

const L = { nose: 0, sh: 1, el: 3, wr: 5, hip: 7, kn: 9, an: 11 };
const R = { nose: 0, sh: 2, el: 4, wr: 6, hip: 8, kn: 10, an: 12 };
const VIS = 0.45;

function ang(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const m = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / m))) * 180) / Math.PI;
}
const tiltOf = (sh, hip) => (Math.atan2(Math.abs(sh[0] - hip[0]), Math.abs(hip[1] - sh[1])) * 180) / Math.PI;

// Сторона, которая лучше видна камере (по сумме видимости нужных суставов)
function side(p, keys) {
  let l = 0, r = 0;
  for (const k of keys) { l += p[L[k]][2]; r += p[R[k]][2]; }
  return l >= r ? L : R;
}
function pts(p, keys) {
  const S = side(p, keys);
  const out = {};
  for (const k of keys) { const q = p[S[k]]; if (q[2] < VIS) return null; out[k] = q; }
  return out;
}

// Человек в кадре: видны плечи, таз и хотя бы одно колено
export function inFrame(p) {
  if (!p) return false;
  const core = [1, 2, 7, 8, 9, 10].filter((i) => p[i][2] > 0.5 && p[i][0] > 0.01 && p[i][0] < 0.99 && p[i][1] > 0.01 && p[i][1] < 0.99);
  return core.length >= 3;
}

// Повторы по одной величине: «вниз» ниже low, «вверх» выше high. Неполное движение = подсказка.
function repMachine({ low, high, partial, invert = false }) {
  let state = null, ext = null;
  return (v) => {
    if (v == null) return null;
    const x = invert ? -v : v, lo = invert ? -low : low, hi = invert ? -high : high, pa = partial == null ? null : invert ? -partial : partial;
    if (state === null) state = x > hi ? 'up' : 'down';
    if (state === 'up') {
      if (x < lo) { state = 'down'; ext = x; }
      else if (pa != null && x < pa) ext = ext == null ? x : Math.min(ext, x);
      else if (ext != null && x > hi) { ext = null; return { cue: 'deeper' }; }
      return null;
    }
    if (x > hi) { state = 'up'; ext = null; return { rep: true }; }
    return null;
  };
}

const ema = (a = 0.5) => { let s = null; return (v) => (v == null ? s : (s = s == null ? v : s + a * (v - s))); };

export function createCounter(exId) {
  const st = { reps: 0, hold: 0, best: 0, phase: 0, cue: null, lastRepT: null, repTimes: [] };
  let lastT = null;
  const smooth = ema(0.55);
  let step;

  if (exId === 'squat') {
    // Угол в колене: стоя ~170°, присед глубже 100°
    const m = repMachine({ low: 100, high: 155, partial: 135 });
    step = (p) => { const q = pts(p, ['hip', 'kn', 'an']); const a = smooth(q ? ang(q.hip, q.kn, q.an) : null); st.phase = a == null ? 0 : clamp01((165 - a) / 70); return m(q ? a : null); };
  } else if (exId === 'pushup') {
    // Угол в локте при горизонтальном корпусе
    const m = repMachine({ low: 95, high: 150, partial: 125 });
    step = (p) => {
      const q = pts(p, ['sh', 'el', 'wr', 'hip']);
      if (!q || tiltOf(q.sh, q.hip) < 45) { smooth(null); return null; }
      const a = smooth(ang(q.sh, q.el, q.wr)); st.phase = clamp01((160 - a) / 70); return m(a);
    };
  } else if (exId === 'pullup') {
    // Засчитывается, когда нос выше кистей после полного виса (локоть > 150°)
    let armed = false, inTop = false, bent = false, reached = false;
    step = (p) => {
      const q = pts(p, ['sh', 'el', 'wr']);
      if (!q) return null;
      const nose = p[0][2] > VIS ? p[0] : null;
      const elbow = smooth(ang(q.sh, q.el, q.wr));
      st.phase = clamp01((165 - elbow) / 100);
      let ev = null;
      if (elbow > 150) { if (bent && !reached) ev = { cue: 'chin' }; armed = true; bent = false; reached = false; }
      if (elbow < 100) bent = true;
      const top = nose ? nose[1] < q.wr[1] : false;
      if (top && !inTop) { if (armed) ev = { rep: true }; else ev = { cue: 'hang' }; armed = false; reached = true; }
      inTop = top;
      return ev;
    };
  } else if (exId === 'sprawl') {
    // Наклон корпуса: стойка < 40°, спраул > 52° (корпус почти горизонтален)
    const m = repMachine({ low: -52, high: -40 });
    step = (p) => { const q = pts(p, ['sh', 'hip']); const a = smooth(q ? tiltOf(q.sh, q.hip) : null); st.phase = a == null ? 0 : clamp01((a - 25) / 45); return m(a == null ? null : -a); };
  } else if (exId === 'shot') {
    // Смена уровня: высота таза над стопой относительно стойки (база — 85-й перцентиль за 4 с)
    const m = repMachine({ low: 0.7, high: 0.85 });
    const hist = [];
    step = (p, t) => {
      const q = pts(p, ['hip', 'an']);
      const g = smooth(q ? q.an[1] - q.hip[1] : null);
      if (g == null) return null;
      hist.push([t, g]); while (hist.length && t - hist[0][0] > 4) hist.shift();
      const s = hist.map((h) => h[1]).sort((a, b) => a - b);
      const base = s[Math.floor(s.length * 0.85)];
      if (!base || base < 0.08 || hist.length < 8) return null;
      const r = g / base; st.phase = clamp01((1 - r) / 0.45);
      return m(r);
    };
  } else if (exId === 'bridge') {
    // Мост: таз выше плеч. Считаем время удержания, лучшее — результат подхода.
    step = (p, t) => {
      const q = pts(p, ['sh', 'hip']);
      const ok = q && q.hip[1] < q.sh[1] - 0.04;
      const dt = lastT == null ? 0 : Math.min(0.5, t - lastT);
      st.phase = q ? clamp01((q.sh[1] - q.hip[1] + 0.05) / 0.25) : 0;
      if (ok) { st.hold += dt; st.best = Math.max(st.best, st.hold); } else if (st.hold > 0) { const h = st.hold; st.hold = 0; if (h < 2) return { cue: 'hold' }; }
      return null;
    };
  }

  return {
    state: st,
    push(frame) {
      st.cue = null;
      if (!frame?.p) { lastT = frame?.t ?? lastT; return st; }
      const ev = step(frame.p, frame.t);
      lastT = frame.t;
      if (ev?.rep) { st.reps++; st.lastRepT = frame.t; st.repTimes.push(frame.t); st.event = 'rep'; } else st.event = null;
      if (ev?.cue) st.cue = ev.cue;
      return st;
    },
  };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Итог подхода: повторы, длительность, темп
export function setResult(exId, st, sec) {
  const ex = liveEx(exId);
  if (ex.kind === 'hold') return { ex: exId, hold: +st.best.toFixed(1), sec: Math.round(sec) };
  return { ex: exId, reps: st.reps, sec: Math.round(sec), tempo: sec > 0 ? +((st.reps / sec) * 60).toFixed(1) : null };
}

// ---------- Синтетические движения: демо-режим и проверка счётчиков ----------
// Ключевые позы (вид сбоку, лицом вправо), нормированные координаты кадра 3:4
const POSES = {
  squat: [
    { head: [0.5, 0.2], sh: [0.5, 0.3], el: [0.58, 0.32], wr: [0.66, 0.32], hip: [0.5, 0.53], kn: [0.52, 0.7], an: [0.5, 0.88] },
    { head: [0.55, 0.4], sh: [0.5, 0.49], el: [0.6, 0.5], wr: [0.68, 0.5], hip: [0.4, 0.7], kn: [0.57, 0.69], an: [0.5, 0.88] },
  ],
  pushup: [
    { head: [0.84, 0.58], sh: [0.75, 0.62], el: [0.76, 0.71], wr: [0.76, 0.8], hip: [0.5, 0.71], kn: [0.34, 0.76], an: [0.18, 0.8] },
    { head: [0.85, 0.71], sh: [0.75, 0.74], el: [0.67, 0.72], wr: [0.76, 0.8], hip: [0.5, 0.77], kn: [0.34, 0.79], an: [0.18, 0.81] },
  ],
  pullup: [ // вид спереди: правая сторона зеркальна левой
    { front: true, head: [0.5, 0.25], sh: [0.42, 0.3], el: [0.36, 0.21], wr: [0.33, 0.12], hip: [0.45, 0.56], kn: [0.46, 0.72], an: [0.46, 0.88] },
    { front: true, head: [0.5, 0.09], sh: [0.42, 0.2], el: [0.3, 0.22], wr: [0.33, 0.12], hip: [0.45, 0.46], kn: [0.46, 0.62], an: [0.46, 0.78] },
  ],
  sprawl: [
    { head: [0.56, 0.25], sh: [0.53, 0.33], el: [0.6, 0.42], wr: [0.65, 0.48], hip: [0.48, 0.55], kn: [0.52, 0.71], an: [0.48, 0.88] },
    { head: [0.68, 0.64], sh: [0.6, 0.69], el: [0.66, 0.77], wr: [0.68, 0.86], hip: [0.4, 0.8], kn: [0.25, 0.84], an: [0.1, 0.88] },
  ],
  shot: [
    { head: [0.47, 0.22], sh: [0.46, 0.31], el: [0.54, 0.4], wr: [0.6, 0.44], hip: [0.45, 0.52], kn: [0.49, 0.7], an: [0.45, 0.88] },
    { head: [0.74, 0.55], sh: [0.66, 0.6], el: [0.74, 0.66], wr: [0.8, 0.66], hip: [0.5, 0.71], kn: [0.6, 0.86], an: [0.36, 0.88] },
  ],
  bridge: [
    { head: [0.2, 0.86], sh: [0.3, 0.85], el: [0.36, 0.8], wr: [0.42, 0.86], hip: [0.5, 0.85], kn: [0.65, 0.75], an: [0.76, 0.88] },
    { head: [0.25, 0.86], sh: [0.3, 0.79], el: [0.27, 0.72], wr: [0.23, 0.86], hip: [0.5, 0.58], kn: [0.68, 0.66], an: [0.76, 0.88] },
  ],
};
const PERIOD = { squat: 2.4, pushup: 2, pullup: 2.8, sprawl: 1.9, shot: 2.2, bridge: 9 };
const ORDER = ['nose', 'sh', 'sh', 'el', 'el', 'wr', 'wr', 'hip', 'hip', 'kn', 'kn', 'an', 'an'];

// k: 0 — исходная поза, 1 — крайняя. Мост: подъём, удержание, опускание.
function phaseOf(exId, t) {
  const P = PERIOD[exId];
  const u = (t % P) / P;
  if (exId === 'bridge') return u < 0.12 ? ease(u / 0.12) : u < 0.82 ? 1 : u < 0.94 ? 1 - ease((u - 0.82) / 0.12) : 0;
  // Лёгкая «усталость»: каждый пятый повтор неполный — видно подсказку
  const n = Math.floor(t / P);
  const depth = n % 5 === 4 ? 0.4 : 1;
  return depth * (1 - Math.cos(2 * Math.PI * u)) / 2;
}
const ease = (x) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, x)))) / 2;

export function synthFrame(exId, t) {
  const [A, B] = POSES[exId] || POSES.squat;
  const k = phaseOf(exId, t);
  const at = (name) => [A[name][0] + (B[name][0] - A[name][0]) * k, A[name][1] + (B[name][1] - A[name][1]) * k];
  const p = ORDER.map((name, i) => {
    const q = at(name === 'nose' ? 'head' : name);
    const far = i > 0 && i % 2 === 0; // правая сторона дальше от камеры
    const j = Math.sin(t * 7.3 + i * 1.7) * 0.002;
    if (A.front) return [+((far ? 1 - q[0] : q[0]) + j).toFixed(4), +(q[1] + j).toFixed(4), 0.92];
    return [+(q[0] - (far ? 0.012 : 0) + j).toFixed(4), +(q[1] - (far ? 0.006 : 0) + j).toFixed(4), far ? 0.7 : 0.95];
  });
  return { t, p };
}
