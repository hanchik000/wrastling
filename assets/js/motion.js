// Motion Intelligence — фирменная анимация разметки движения.
// Всё рисуется лёгким SVG без библиотек, чтобы работать на недорогих Android.
import { golPath, reduceMotion } from './ui.js';
import { t } from './i18n.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function mix(p1, p2, k) {
  const out = {};
  for (const key in p1) out[key] = [lerp(p1[key][0], p2[key][0], k), lerp(p1[key][1], p2[key][1], k)];
  return out;
}
export function angle(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]];
  const v2 = [c[0] - b[0], c[1] - b[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const m = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return (Math.acos(clamp(dot / m, -1, 1)) * 180) / Math.PI;
}

// ---------- Позы борца (вид сбоку, viewBox 400×500) ----------
const STANCE = {
  head: [232, 108], neck: [216, 138], shF: [226, 150], shB: [206, 146], elF: [266, 192], elB: [246, 198],
  wrF: [300, 212], wrB: [282, 222], hipF: [166, 248], hipB: [156, 243], knF: [214, 320], knB: [140, 330],
  anF: [206, 410], anB: [112, 410],
};
const LEVEL = {
  head: [252, 160], neck: [233, 188], shF: [241, 200], shB: [223, 195], elF: [281, 238], elB: [263, 243],
  wrF: [316, 248], wrB: [299, 258], hipF: [160, 288], hipB: [150, 283], knF: [226, 346], knB: [131, 356],
  anF: [216, 410], anB: [96, 410],
};
const SHOT = {
  head: [302, 196], neck: [282, 220], shF: [290, 232], shB: [272, 226], elF: [327, 264], elB: [307, 270],
  wrF: [357, 262], wrB: [340, 276], hipF: [202, 300], hipB: [192, 295], knF: [257, 350], knB: [207, 408],
  anF: [262, 410], anB: [132, 404],
};
const BONES = [
  ['neck', 'head'], ['neck', 'shF'], ['neck', 'shB'], ['shF', 'elF'], ['elF', 'wrF'], ['shB', 'elB'], ['elB', 'wrB'],
  ['shF', 'hipF'], ['shB', 'hipB'], ['hipF', 'hipB'], ['hipF', 'knF'], ['knF', 'anF'], ['hipB', 'knB'], ['knB', 'anB'],
];
const KEY_JOINTS = ['hipF', 'knF', 'shF', 'wrF'];

export function mountMotionIntelligence(stage, { onDone } = {}) {
  const svg = el('svg', { class: 'mi', viewBox: matchMedia('(max-width: 640px)').matches ? '36 -34 400 500' : '36 10 400 500', role: 'img', 'aria-label': t('home.mi_aria') });
  const defs = el('defs');
  defs.innerHTML = `<radialGradient id="mi-glow" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#27b663" stop-opacity=".16"/><stop offset="1" stop-color="#27b663" stop-opacity="0"/></radialGradient>`;
  svg.appendChild(defs);

  // Сетка гёль и пол
  const grid = el('g', { opacity: 0.5 });
  for (let x = 40; x < 400; x += 80) grid.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: 500, stroke: 'rgba(244,242,238,.04)' }));
  for (let y = 60; y < 500; y += 80) grid.appendChild(el('line', { x1: 0, y1: y, x2: 400, y2: y, stroke: 'rgba(244,242,238,.04)' }));
  grid.appendChild(el('path', { d: golPath(200, 260, 150), stroke: 'rgba(39,182,99,.08)', fill: 'url(#mi-glow)' }));
  grid.appendChild(el('path', { d: 'M200 120 340 260 200 400 60 260z', stroke: 'rgba(244,242,238,.05)', fill: 'none' }));
  svg.appendChild(grid);
  svg.appendChild(el('line', { x1: 30, y1: 414, x2: 370, y2: 414, stroke: 'rgba(244,242,238,.22)', 'stroke-width': 1 }));

  // Силуэт атлета
  const sil = el('g', { opacity: 0, stroke: '#2b2c31', 'stroke-width': 30, 'stroke-linecap': 'round', fill: 'none' });
  const silBones = BONES.map(() => sil.appendChild(el('line')));
  const silHead = el('circle', { r: 21, fill: '#2b2c31', stroke: 'none' });
  sil.appendChild(silHead);
  svg.appendChild(sil);

  // Траектории
  const trailHip = el('path', { fill: 'none', stroke: 'rgba(39,182,99,.75)', 'stroke-width': 1.6, 'stroke-dasharray': '3 5' });
  const trailWr = el('path', { fill: 'none', stroke: 'rgba(244,242,238,.55)', 'stroke-width': 1.4, 'stroke-dasharray': '2 5' });
  svg.append(trailHip, trailWr);

  // Скелет
  const bones = el('g', { stroke: '#f4f2ee', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const boneEls = BONES.map(() => {
    const l = el('line', { 'stroke-dasharray': 200, 'stroke-dashoffset': 200 });
    bones.appendChild(l);
    return l;
  });
  svg.appendChild(bones);

  // Суставы — маленькие гёли
  const joints = el('g');
  const jointEls = Object.keys(STANCE).map((name) => {
    const key = KEY_JOINTS.includes(name);
    const p = el('path', { fill: key ? '#27b663' : '#0b0b0c', stroke: key ? '#27b663' : '#f4f2ee', 'stroke-width': 1.4, opacity: 0 });
    p.dataset.name = name;
    joints.appendChild(p);
    return p;
  });
  svg.appendChild(joints);

  // Дуга угла колена
  const arc = el('path', { fill: 'none', stroke: '#27b663', 'stroke-width': 1.6, opacity: 0 });
  const arcLabel = el('text', { fill: '#27b663', 'font-size': 12, 'font-family': 'Inter, sans-serif', 'font-weight': 600, opacity: 0 });
  svg.append(arc, arcLabel);

  stage.prepend(svg);

  const metrics = stage.querySelectorAll('.mi-metric');
  const vals = stage.querySelectorAll('[data-mi]');
  const bar = stage.querySelector('.mi-timeline i');
  const standHip = (STANCE.hipF[1] + STANCE.hipB[1]) / 2;
  const floorY = 410;

  const hipPts = [];
  const wrPts = [];

  function draw(pose, { jointsK = 1, bonesK = 1, silK = 1 } = {}) {
    BONES.forEach(([a, b], i) => {
      const A = pose[a], B = pose[b];
      silBones[i].setAttribute('x1', A[0]); silBones[i].setAttribute('y1', A[1]);
      silBones[i].setAttribute('x2', B[0]); silBones[i].setAttribute('y2', B[1]);
      boneEls[i].setAttribute('x1', A[0]); boneEls[i].setAttribute('y1', A[1]);
      boneEls[i].setAttribute('x2', B[0]); boneEls[i].setAttribute('y2', B[1]);
      const kb = clamp(bonesK * BONES.length - i);
      boneEls[i].setAttribute('stroke-dashoffset', 200 * (1 - kb));
    });
    silHead.setAttribute('cx', pose.head[0]); silHead.setAttribute('cy', pose.head[1]);
    sil.setAttribute('opacity', silK);
    jointEls.forEach((p, i) => {
      const [x, y] = pose[p.dataset.name];
      const kj = clamp(jointsK * jointEls.length - i);
      const r = (p.dataset.name === 'head' ? 6 : KEY_JOINTS.includes(p.dataset.name) ? 5.5 : 4) * (0.4 + 0.6 * kj);
      p.setAttribute('d', golPath(x, y, r));
      p.setAttribute('opacity', kj);
    });
  }

  function measure(pose) {
    const knee = angle(pose.hipF, pose.knF, pose.anF);
    const hipY = (pose.hipF[1] + pose.hipB[1]) / 2;
    const hipH = ((floorY - hipY) / (floorY - standHip)) * 100;
    const torso = (Math.atan2(pose.shF[0] - pose.hipF[0], pose.hipF[1] - pose.shF[1]) * 180) / Math.PI;
    return { knee, hipH, torso };
  }

  function showMetrics(pose, k) {
    const m = measure(pose);
    vals.forEach((v) => {
      const key = v.dataset.mi;
      v.textContent = Math.round(m[key]);
    });
    // дуга на колене
    const r = 22;
    const a1 = Math.atan2(pose.hipF[1] - pose.knF[1], pose.hipF[0] - pose.knF[0]);
    const a2 = Math.atan2(pose.anF[1] - pose.knF[1], pose.anF[0] - pose.knF[0]);
    const p1 = [pose.knF[0] + r * Math.cos(a1), pose.knF[1] + r * Math.sin(a1)];
    const p2 = [pose.knF[0] + r * Math.cos(a2), pose.knF[1] + r * Math.sin(a2)];
    arc.setAttribute('d', `M${p1[0]} ${p1[1]}A${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}`);
    arc.setAttribute('opacity', k);
    arcLabel.setAttribute('x', pose.knF[0] + 28);
    arcLabel.setAttribute('y', pose.knF[1] + 4);
    arcLabel.textContent = Math.round(m.knee) + '°';
    arcLabel.setAttribute('opacity', k);
  }

  const segs = [
    { from: STANCE, to: LEVEL, dur: 1000 },
    { from: LEVEL, to: SHOT, dur: 1100 },
    { from: SHOT, to: LEVEL, dur: 900 },
    { from: LEVEL, to: STANCE, dur: 900 },
  ];
  const T_MOVE = 1700;
  const T_TOTAL = T_MOVE + segs.reduce((s, x) => s + x.dur, 0);

  function poseAt(ms) {
    if (ms < T_MOVE) return STANCE;
    let tt = ms - T_MOVE;
    for (const s of segs) {
      if (tt <= s.dur) return mix(s.from, s.to, ease(tt / s.dur));
      tt -= s.dur;
    }
    return STANCE;
  }

  let raf = 0;
  let start = 0;
  let stopped = false;

  function frame(now) {
    if (stopped) return;
    if (!start) start = now;
    const ms = now - start;
    const pose = poseAt(ms);
    draw(pose, {
      silK: clamp(ms / 600),
      jointsK: clamp((ms - 400) / 700),
      bonesK: clamp((ms - 900) / 800),
    });
    if (ms > T_MOVE) {
      hipPts.push([(pose.hipF[0] + pose.hipB[0]) / 2, (pose.hipF[1] + pose.hipB[1]) / 2]);
      wrPts.push(pose.wrF);
      trailHip.setAttribute('d', 'M' + hipPts.map((p) => p.join(' ')).join('L'));
      trailWr.setAttribute('d', 'M' + wrPts.map((p) => p.join(' ')).join('L'));
    }
    const mk = clamp((ms - 1900) / 400);
    showMetrics(pose, mk);
    metrics.forEach((m, i) => { if (ms > 2000 + i * 450) m.classList.add('in'); });
    if (bar) bar.style.transform = `scaleX(${clamp(ms / T_TOTAL)})`;
    if (ms < T_TOTAL + 200) raf = requestAnimationFrame(frame);
    else onDone?.();
  }

  function play() {
    cancelAnimationFrame(raf);
    hipPts.length = 0; wrPts.length = 0;
    trailHip.setAttribute('d', ''); trailWr.setAttribute('d', '');
    metrics.forEach((m) => m.classList.remove('in'));
    start = 0; stopped = false;
    if (reduceMotion()) {
      draw(LEVEL);
      showMetrics(LEVEL, 1);
      metrics.forEach((m) => m.classList.add('in'));
      if (bar) bar.style.transform = 'scaleX(1)';
      onDone?.();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  // Старт, когда сцена видна
  let io;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(stage);
  } else play();

  return { replay: play, stop() { stopped = true; cancelAnimationFrame(raf); io?.disconnect(); } };
}

// ---------- Видео-образцы упражнений (схема, вид сбоку, viewBox 300×300) ----------
const STANCE_W = { head: [170, 92], sh: [158, 118], el: [190, 150], wr: [214, 140], hip: [118, 170], kn: [160, 208], an: [146, 256], toe: [166, 258] };
const shift = (P, dx, dy = 0) => Object.fromEntries(Object.entries(P).map(([k, [x, y]]) => [k, [x + dx, y + dy]]));
const flip = (P) => Object.fromEntries(Object.entries(P).map(([k, [x, y]]) => [k, [-x, y]]));
const RUN1 = { head: [12, 66], sh: [6, 96], el: [24, 118], wr: [38, 104], hip: [-2, 162], kn: [26, 198], an: [10, 252], toe: [26, 256] };
const RUN2 = { head: [12, 66], sh: [6, 96], el: [-12, 118], wr: [-4, 140], hip: [-2, 162], kn: [-18, 204], an: [-34, 244], toe: [-24, 252] };
const TOUCH = { head: [30, 170], sh: [14, 182], el: [26, 220], wr: [34, 256], hip: [-24, 190], kn: [8, 220], an: [-8, 256], toe: [8, 258] };

const EX = {
  // Спраул: стойка → ноги назад, бёдра на ковре, грудь поднята
  sprawl: [
    STANCE_W,
    { head: [222, 186], sh: [206, 204], el: [214, 232], wr: [222, 256], hip: [130, 246], kn: [90, 252], an: [48, 254], toe: [38, 258] },
  ],
  // Проход в ноги: смена уровня, колено к ковру, руки вперёд
  shot: [
    STANCE_W,
    { head: [228, 150], sh: [210, 168], el: [242, 182], wr: [266, 184], hip: [150, 204], kn: [174, 254], an: [128, 256], toe: [116, 258] },
  ],
  // Вставание на мост: стойка, руки вверх → прогиб → мост → держим → выход
  bridge_up: [
    { head: [150, 44], sh: [150, 74], el: [154, 44], wr: [156, 16], hip: [150, 142], kn: [152, 198], an: [150, 252], toe: [168, 256] },
    { head: [118, 74], sh: [128, 96], el: [104, 80], wr: [86, 70], hip: [160, 150], kn: [172, 202], an: [158, 252], toe: [176, 256] },
    { head: [96, 236], sh: [112, 214], el: [94, 236], wr: [82, 256], hip: [176, 160], kn: [212, 200], an: [214, 254], toe: [232, 256] },
    { head: [96, 236], sh: [112, 212], el: [94, 236], wr: [82, 256], hip: [176, 154], kn: [212, 196], an: [214, 254], toe: [232, 256] },
    { head: [118, 74], sh: [128, 96], el: [104, 80], wr: [86, 70], hip: [160, 150], kn: [172, 202], an: [158, 252], toe: [176, 256] },
  ],
  // Забегания на мосту: опора на голову, ноги переступают
  bridge_walk: [
    { head: [74, 250], sh: [94, 228], el: [118, 212], wr: [104, 200], hip: [168, 170], kn: [206, 206], an: [216, 254], toe: [234, 256] },
    { head: [74, 250], sh: [94, 228], el: [118, 212], wr: [104, 200], hip: [162, 176], kn: [190, 216], an: [190, 256], toe: [208, 258] },
    { head: [74, 250], sh: [94, 228], el: [118, 212], wr: [104, 200], hip: [168, 168], kn: [214, 200], an: [236, 252], toe: [254, 256] },
  ],
  // Подтягивания: вис → подбородок над перекладиной
  pullup: [
    { head: [152, 84], sh: [150, 102], el: [150, 66], wr: [150, 30], hip: [150, 172], kn: [156, 216], an: [150, 252], toe: [164, 256] },
    { head: [154, 18], sh: [150, 62], el: [170, 62], wr: [150, 30], hip: [148, 134], kn: [154, 180], an: [148, 220], toe: [162, 224] },
  ],
  // Челночный бег: бег → касание линии → разворот
  shuttle: [
    shift(RUN1, 70), shift(RUN2, 130), shift(RUN1, 190), shift(TOUCH, 236),
    shift(flip(RUN1), 190), shift(flip(RUN2), 130), shift(flip(RUN1), 70), shift(flip(TOUCH), 64),
  ],
};
const EX_SEG = { sprawl: 700, shot: 750, bridge_up: 900, bridge_walk: 650, pullup: 750, shuttle: 420 };
const EX_BONES = [['head', 'sh'], ['sh', 'el'], ['el', 'wr'], ['sh', 'hip'], ['hip', 'kn'], ['kn', 'an'], ['an', 'toe']];

export function mountExerciseLoop(host, testId) {
  const frames = EX[testId] || EX.sprawl;
  const svg = el('svg', { viewBox: '0 0 300 300', role: 'img', 'aria-label': t('scout.demo_aria') });
  svg.appendChild(el('path', { d: golPath(150, 150, 120), stroke: 'rgba(39,182,99,.1)', fill: 'none' }));
  svg.appendChild(el('line', { x1: 20, y1: 260, x2: 280, y2: 260, stroke: 'rgba(244,242,238,.25)' }));
  if (testId === 'pullup') svg.appendChild(el('line', { x1: 96, y1: 28, x2: 204, y2: 28, stroke: '#f4f2ee', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  if (testId === 'shuttle') {
    for (const x of [40, 260]) svg.appendChild(el('line', { x1: x, y1: 236, x2: x, y2: 262, stroke: '#27b663', 'stroke-width': 3 }));
  }
  const sil = el('g', { stroke: '#2b2c31', 'stroke-width': 22, 'stroke-linecap': 'round' });
  const g = el('g', { stroke: '#f4f2ee', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const sLines = EX_BONES.map(() => sil.appendChild(el('line')));
  const lines = EX_BONES.map(() => g.appendChild(el('line')));
  const headSil = el('circle', { r: 15, fill: '#2b2c31' });
  const dots = Object.keys(frames[0]).map((n) => {
    const p = el('path', { fill: ['hip', 'kn', 'el'].includes(n) ? '#27b663' : '#0b0b0c', stroke: ['hip', 'kn', 'el'].includes(n) ? '#27b663' : '#f4f2ee', 'stroke-width': 1.3 });
    p.dataset.n = n;
    return p;
  });
  svg.append(sil, headSil, g, ...dots);
  host.innerHTML = '';
  host.appendChild(svg);

  const render = (pose) => {
    EX_BONES.forEach(([a, b], i) => {
      for (const ln of [lines[i], sLines[i]]) {
        ln.setAttribute('x1', pose[a][0]); ln.setAttribute('y1', pose[a][1]);
        ln.setAttribute('x2', pose[b][0]); ln.setAttribute('y2', pose[b][1]);
      }
    });
    headSil.setAttribute('cx', pose.head[0]); headSil.setAttribute('cy', pose.head[1]);
    dots.forEach((d) => { const [x, y] = pose[d.dataset.n]; d.setAttribute('d', golPath(x, y, d.dataset.n === 'head' ? 5 : 4)); });
  };

  const seq = frames.length === 2 ? [0, 1] : frames.map((_, i) => i);
  const SEG = EX_SEG[testId] || 800;
  let raf = 0, t0 = 0, paused = false, pausedAt = 0;
  const loop = (now) => {
    if (!t0) t0 = now;
    const total = seq.length * SEG;
    const ms = (now - t0) % total;
    const i = Math.floor(ms / SEG);
    const k = ease((ms % SEG) / SEG);
    const a = frames[seq[i]];
    const b = frames[seq[(i + 1) % seq.length]];
    render(mix(a, b, k));
    raf = requestAnimationFrame(loop);
  };
  render(frames[frames.length > 2 ? 1 : 1]);
  const api = {
    playing: false,
    play() { if (reduceMotion()) return; paused = false; t0 = t0 ? performance.now() - pausedAt : 0; raf = requestAnimationFrame(loop); api.playing = true; },
    pause() { paused = true; pausedAt = performance.now() - t0; cancelAnimationFrame(raf); api.playing = false; },
    stop() { cancelAnimationFrame(raf); api.playing = false; },
  };
  if (!reduceMotion()) api.play();
  return api;
}
