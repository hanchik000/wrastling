// Анализ движения на устройстве.
// Модель позы — MediaPipe Pose Landmarker (открытая, Google). Загружается в браузер при первом анализе.
// Видео в демо-версии не покидает телефон. На этапе 3 этот модуль заменяется вызовом серверного сервиса
// с тем же форматом результата.
const VER = '0.10.14';
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// Сохраняем 13 точек из 33: нос, плечи, локти, кисти, таз, колени, голеностопы
export const KEEP = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
export const BONES = [[1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12]];
const L = { sh: 1, el: 3, wr: 5, hip: 7, kn: 9, an: 11 };
const R = { sh: 2, el: 4, wr: 6, hip: 8, kn: 10, an: 12 };

const withTimeout = (p, ms, code) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(code)), ms))]);

let landmarker = null;
export async function loadLandmarker() {
  if (landmarker) return landmarker;
  const vision = await withTimeout(import(/* @vite-ignore */ `${CDN}/vision_bundle.mjs`), 45000, 'model_timeout');
  const fileset = await withTimeout(vision.FilesetResolver.forVisionTasks(`${CDN}/wasm`), 45000, 'model_timeout');
  const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1 });
  try {
    landmarker = await withTimeout(vision.PoseLandmarker.createFromOptions(fileset, opts('GPU')), 60000, 'model_timeout');
  } catch {
    landmarker = await withTimeout(vision.PoseLandmarker.createFromOptions(fileset, opts('CPU')), 60000, 'model_timeout');
  }
  return landmarker;
}

// ---------- Видео ----------
function once(target, ev) { return new Promise((res) => target.addEventListener(ev, res, { once: true })); }

export async function prepareVideo(blob) {
  const v = document.createElement('video');
  v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.src = URL.createObjectURL(blob);
  await withTimeout(once(v, 'loadedmetadata'), 15000, 'video_unreadable');
  // У webm из MediaRecorder длительность часто Infinity — узнаём её перемоткой в конец
  if (!Number.isFinite(v.duration)) {
    v.currentTime = 1e7;
    await withTimeout(once(v, 'durationchange'), 8000, 'video_unreadable').catch(() => {});
    v.currentTime = 0;
    await once(v, 'seeked').catch(() => {});
  }
  if (v.readyState < 2) await withTimeout(once(v, 'loadeddata'), 15000, 'video_unreadable');
  return v;
}

async function seek(v, t) {
  if (Math.abs(v.currentTime - t) < 0.001) return;
  const p = once(v, 'seeked');
  v.currentTime = t;
  await withTimeout(p, 5000, 'seek_failed');
}

const sampler = document.createElement('canvas');
sampler.width = 32; sampler.height = 32;
export function brightnessOf(source) {
  const ctx = sampler.getContext('2d', { willReadFrequently: true });
  try {
    ctx.drawImage(source, 0, 0, 32, 32);
    const d = ctx.getImageData(0, 0, 32, 32).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return s / (d.length / 4);
  } catch { return null; }
}

// ---------- Геометрия ----------
function ang(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const m = Math.hypot(...v1) * Math.hypot(...v2) || 1;
  return (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / m))) * 180) / Math.PI;
}
const median = (arr) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
function smooth(arr, k = 2) {
  return arr.map((_, i) => {
    const w = arr.slice(Math.max(0, i - k), i + k + 1).filter((x) => x != null);
    return w.length ? mean(w) : null;
  });
}

// Повторения по углу с гистерезисом: засчитывается только полное движение вниз и обратно
function countReps(series, times, low, high) {
  let state = null, reps = 0, curMin = Infinity, startT = null;
  const mins = [], durs = [];
  series.forEach((a, i) => {
    if (a == null) return;
    if (state === null) state = a > high ? 'up' : 'down';
    if (state === 'up' && a < low) { state = 'down'; curMin = a; startT = times[i]; }
    else if (state === 'down') {
      curMin = Math.min(curMin, a);
      if (a > high && curMin < low) { reps++; mins.push(curMin); if (startT != null) durs.push(times[i] - startT); state = 'up'; curMin = Infinity; }
      else if (a > high) state = 'up';
    }
  });
  return { reps, mins, durs };
}
function consistency(durs) {
  if (durs.length < 3) return null;
  const m = mean(durs);
  const sd = Math.sqrt(mean(durs.map((d) => (d - m) ** 2)));
  return Math.max(0, Math.min(100, 100 * (1 - sd / m)));
}

function pickSide(frames) {
  let l = 0, r = 0;
  for (const f of frames) {
    if (!f.p) continue;
    for (const k of Object.values(L)) l += f.p[k][2];
    for (const k of Object.values(R)) r += f.p[k][2];
  }
  return l >= r ? L : R;
}

// ---------- Метрики по тестам ----------
export function computeMetrics(testId, frames, duration) {
  const S = pickSide(frames);
  const P = (f, k) => f.p && f.p[S[k]][2] > 0.4 ? f.p[S[k]] : null;
  const times = frames.map((f) => f.t);
  const issues = [];
  const m = {};

  if (testId === 'squat') {
    const knee = smooth(frames.map((f) => { const h = P(f, 'hip'), k = P(f, 'kn'), a = P(f, 'an'); return h && k && a ? ang(h, k, a) : null; }));
    const r = countReps(knee, times, 115, 150);
    m.reps = r.reps;
    m.depth = median(r.mins);
    m.tempo = duration ? (r.reps / duration) * 60 : null;
    m.consistency = consistency(r.durs);
    if (m.depth != null && m.depth > 105) issues.push('squat_depth');
  } else if (testId === 'pushup') {
    const elbow = smooth(frames.map((f) => { const s = P(f, 'sh'), e = P(f, 'el'), w = P(f, 'wr'); return s && e && w ? ang(s, e, w) : null; }));
    const r = countReps(elbow, times, 105, 145);
    m.reps = r.reps;
    m.depth = median(r.mins);
    m.tempo = duration ? (r.reps / duration) * 60 : null;
    m.consistency = consistency(r.durs);
    const line = frames.map((f) => { const s = P(f, 'sh'), h = P(f, 'hip'), a = P(f, 'an'); return s && h && a ? 180 - ang(s, h, a) : null; }).filter((x) => x != null);
    m.bodyLine = median(line);
    if (m.depth != null && m.depth > 100) issues.push('pushup_depth');
    if (m.bodyLine != null && m.bodyLine > 20) issues.push('pushup_line');
  } else if (testId === 'burpee') {
    // Стоя: корпус почти вертикален. Планка: корпус почти горизонтален.
    let state = null, reps = 0;
    const repT = [];
    frames.forEach((f) => {
      const s = P(f, 'sh'), h = P(f, 'hip');
      if (!s || !h) return;
      const tilt = (Math.atan2(Math.abs(s[0] - h[0]), Math.abs(h[1] - s[1])) * 180) / Math.PI;
      if (tilt < 30) { if (state === 'plank') { reps++; repT.push(f.t); } state = 'stand'; }
      else if (tilt > 62) state = state === 'stand' || state === 'plank' ? 'plank' : state;
    });
    m.reps = reps;
    m.tempo = duration ? (reps / duration) * 60 : null;
    if (repT.length >= 4) {
      const half = duration / 2;
      const a = repT.filter((x) => x <= half).length, b = repT.length - a;
      m.fatigue = a ? Math.max(0, ((a - b) / a) * 100) : null;
    }
  } else if (testId === 'reach') {
    const flex = frames.map((f) => { const s = P(f, 'sh'), h = P(f, 'hip'), k = P(f, 'kn'); return s && h && k ? ang(s, h, k) : null; }).filter((x) => x != null);
    m.hipAngle = flex.length ? Math.min(...smooth(flex).filter((x) => x != null)) : null;
  } else if (testId === 'bridge') {
    let hold = 0, best = 0;
    frames.forEach((f, i) => {
      const s = P(f, 'sh'), h = P(f, 'hip');
      const ok = s && h && h[1] < s[1] - 0.04;
      const dt = i ? f.t - frames[i - 1].t : 0;
      if (ok) { hold += dt; best = Math.max(best, hold); } else hold = 0;
    });
    m.hold = best;
  } else if (testId === 'jump') {
    const ank = frames.map((f) => { const a = P(f, 'an'); return a ? a[1] : null; });
    const base = median(ank.slice(0, Math.max(3, Math.floor(ank.length / 5))).filter((x) => x != null));
    let air = 0;
    if (base != null) ank.forEach((y, i) => { if (y != null && y < base - 0.04 && i) air += frames[i].t - frames[i - 1].t; });
    m.airtime = air || null;
  }
  return { metrics: m, issues, side: S === L ? 'left' : 'right' };
}

// ---------- Главная функция ----------
export async function analyzeVideo(blob, testId, onStep) {
  const v = await prepareVideo(blob);
  const duration = v.duration;
  const out = { durationSec: duration, quality: {}, analysis: { status: 'pending' }, frames: [] };

  // Яркость по 5 кадрам
  const br = [];
  for (let i = 1; i <= 5; i++) { await seek(v, (duration * i) / 6).catch(() => {}); const b = brightnessOf(v); if (b != null) br.push(b); }
  out.quality.brightness = br.length ? mean(br) : null;
  out.quality.width = v.videoWidth; out.quality.height = v.videoHeight;

  onStep?.('model', 0);
  let lm;
  try {
    lm = await loadLandmarker();
  } catch (e) {
    out.analysis = { status: 'unavailable', error: e.message || 'model_failed' };
    URL.revokeObjectURL(v.src);
    return out;
  }

  const N = Math.min(300, Math.max(20, Math.floor(duration * 10)));
  const step = duration / N;
  let withPose = 0, inFrame = 0;
  for (let i = 0; i < N; i++) {
    const t = i * step;
    try { await seek(v, t); } catch { continue; }
    let res;
    try { res = lm.detectForVideo(v, i * 100 + 1); } catch { res = null; }
    const pts = res?.landmarks?.[0];
    const f = { t: +t.toFixed(3), p: null };
    if (pts) {
      f.p = KEEP.map((k) => [+pts[k].x.toFixed(4), +pts[k].y.toFixed(4), +(pts[k].visibility ?? 0).toFixed(2)]);
      withPose++;
      const core = [1, 2, 7, 8, 9, 10, 11, 12].map((k) => f.p[k]);
      const visible = core.filter((p) => p[2] > 0.5 && p[0] > 0.01 && p[0] < 0.99 && p[1] > 0.01 && p[1] < 0.99).length;
      if (visible >= 5) inFrame++;
    }
    out.frames.push(f);
    if (i % 5 === 0) onStep?.('track', i / N);
  }
  onStep?.('track', 1);
  URL.revokeObjectURL(v.src);

  out.quality.detected = withPose / N;
  out.quality.inFrame = withPose ? inFrame / withPose : 0;
  const q = out.quality.detected * 0.5 + out.quality.inFrame * 0.5;
  out.quality.confidence = q >= 0.85 ? 'high' : q >= 0.6 ? 'medium' : 'low';

  onStep?.('metrics', 0);
  const { metrics, issues, side } = computeMetrics(testId, out.frames.filter((f) => f.p), duration);
  out.analysis = { status: out.quality.confidence === 'low' ? 'low_quality' : 'ok', metrics, issues, side, model: 'mediapipe-pose-lite@' + VER };
  return out;
}

// ---------- Отрисовка разметки поверх видео ----------
export function drawFrame(ctx, frame, video, { trail = [] } = {}) {
  const c = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  const cw = c.clientWidth, ch = c.clientHeight;
  if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  if (!frame?.p || !video.videoWidth) return;
  const s = Math.min(cw / video.videoWidth, ch / video.videoHeight);
  const w = video.videoWidth * s, h = video.videoHeight * s;
  const ox = (cw - w) / 2, oy = (ch - h) / 2;
  const X = (p) => ox + p[0] * w, Y = (p) => oy + p[1] * h;

  if (trail.length > 1) {
    ctx.strokeStyle = 'rgba(200,164,90,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
    ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(X(p), Y(p)) : ctx.moveTo(X(p), Y(p)))); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    const A = frame.p[a], B = frame.p[b];
    if (A[2] < 0.4 || B[2] < 0.4) continue;
    ctx.strokeStyle = 'rgba(11,11,12,.55)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(X(A), Y(A)); ctx.lineTo(X(B), Y(B)); ctx.stroke();
    ctx.strokeStyle = '#f4f2ee'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(X(A), Y(A)); ctx.lineTo(X(B), Y(B)); ctx.stroke();
  }
  frame.p.forEach((p, i) => {
    if (p[2] < 0.4) return;
    const key = [7, 8, 9, 10].includes(i);
    const r = key ? 6 : 4.5, a = r * 0.414, x = X(p), y = Y(p);
    ctx.beginPath();
    ctx.moveTo(x - a, y - r); ctx.lineTo(x + a, y - r); ctx.lineTo(x + r, y - a); ctx.lineTo(x + r, y + a);
    ctx.lineTo(x + a, y + r); ctx.lineTo(x - a, y + r); ctx.lineTo(x - r, y + a); ctx.lineTo(x - r, y - a); ctx.closePath();
    ctx.fillStyle = key ? '#c8a45a' : '#0b0b0c'; ctx.fill();
    ctx.strokeStyle = key ? '#c8a45a' : '#f4f2ee'; ctx.lineWidth = 1.4; ctx.stroke();
  });
}

export function frameAt(frames, t) {
  if (!frames?.length) return null;
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (frames[mid].t < t) lo = mid + 1; else hi = mid; }
  return frames[lo];
}
