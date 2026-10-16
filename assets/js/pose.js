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
// MediaPipe требует растущие метки времени для всех вызовов одной модели (и анализ видео, и живой режим)
let lastTs = 0;
export const nextTs = () => (lastTs = Math.max(lastTs + 1, Math.round(performance.now())));
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

  const tiltOf = (f) => { const sh = P(f, 'sh'), h = P(f, 'hip'); return sh && h ? (Math.atan2(Math.abs(sh[0] - h[0]), Math.abs(h[1] - sh[1])) * 180) / Math.PI : null; };
  const hipGap = (f) => { const h = P(f, 'hip'), a = P(f, 'an'); return h && a ? a[1] - h[1] : null; }; // высота таза над стопой
  const fatigueOf = (repT) => {
    if (repT.length < 4 || !duration) return null;
    const a = repT.filter((x) => x <= duration / 2).length, b = repT.length - a;
    return a ? Math.max(0, ((a - b) / a) * 100) : null;
  };

  if (testId === 'sprawl') {
    // Стойка: корпус ближе к вертикали. Спраул: корпус почти горизонтален, таз у ковра.
    let state = null, reps = 0, minGap = Infinity;
    const repT = [], gaps = [];
    frames.forEach((f) => {
      const tilt = tiltOf(f); if (tilt == null) return;
      const g = hipGap(f);
      if (tilt < 40) {
        if (state === 'down') { reps++; repT.push(f.t); if (Number.isFinite(minGap)) gaps.push(minGap); }
        state = 'up'; minGap = Infinity;
      } else if (tilt > 52 && state === 'up') state = 'down';
      if (state === 'down' && g != null) minGap = Math.min(minGap, g);
    });
    m.reps = reps;
    m.tempo = duration ? (reps / duration) * 60 : null;
    m.fatigue = fatigueOf(repT);
    if (gaps.length && median(gaps) > 0.1) issues.push('sprawl_hips');
  } else if (testId === 'shot') {
    // Смена уровня: высота таза падает относительно стойки и возвращается
    const h = smooth(frames.map(hipGap));
    const vals = h.filter((x) => x != null).sort((a, b) => a - b);
    const base = vals.length ? vals[Math.floor(vals.length * 0.85)] : null;
    if (base && base > 0.05) {
      let state = 'up', reps = 0, curMin = Infinity, startT = null;
      const mins = [], durs = [];
      h.forEach((v, i) => {
        if (v == null) return;
        const r = v / base;
        if (state === 'up' && r < 0.7) { state = 'down'; curMin = r; startT = times[i]; }
        else if (state === 'down') {
          curMin = Math.min(curMin, r);
          if (r > 0.85) { reps++; mins.push(curMin); durs.push(times[i] - startT); state = 'up'; }
        }
      });
      m.reps = reps;
      m.level = mins.length ? median(mins) * 100 : null;
      m.tempo = duration ? (reps / duration) * 60 : null;
      m.consistency = consistency(durs);
      if (m.level != null && m.level > 60) issues.push('shot_level');
    } else m.reps = 0;
  } else if (testId === 'pullup') {
    // Повторение засчитывается, когда подбородок выше кистей после полного виса
    let armed = false, inTop = false, reps = 0, partial = 0, pulls = 0, bent = false, reached = false;
    const repT = [];
    frames.forEach((f) => {
      if (!f.p) return;
      const nose = f.p[0][2] > 0.4 ? f.p[0] : null;
      const sh = P(f, 'sh'), el = P(f, 'el'), wr = P(f, 'wr');
      if (!sh || !el || !wr) return;
      const elbow = ang(sh, el, wr);
      if (elbow > 150) { armed = true; if (bent && !reached) pulls++; bent = false; reached = false; }
      if (elbow < 90) bent = true;
      const top = nose ? nose[1] < wr[1] : false;
      if (top && !inTop) { if (armed) { reps++; repT.push(f.t); } else partial++; armed = false; reached = true; }
      inTop = top;
    });
    m.reps = reps;
    m.tempo = duration ? (reps / duration) * 60 : null;
    m.fatigue = fatigueOf(repT);
    if (partial >= 2) issues.push('pullup_range');
    if (pulls >= 2) issues.push('pullup_chin');
  } else if (testId === 'bridge_up' || testId === 'bridge_walk') {
    // Мост: таз выше плеч. Для вставания — ещё и руки ниже плеч (опора на руки).
    let hold = 0, best = 0, total = 0;
    frames.forEach((f, i) => {
      const sh = P(f, 'sh'), h = P(f, 'hip'), wr = P(f, 'wr');
      let ok = sh && h && h[1] < sh[1] - 0.04;
      if (ok && testId === 'bridge_up') ok = wr ? wr[1] > sh[1] : false;
      const dt = i ? f.t - frames[i - 1].t : 0;
      if (ok) { hold += dt; total += dt; best = Math.max(best, hold); } else hold = 0;
    });
    m.hold = testId === 'bridge_walk' ? total : best;
    if (testId === 'bridge_up') {
      if (best < 0.5) issues.push('bridge_none');
      else if (best < 3) issues.push('bridge_short');
    }
  } else if (testId === 'shuttle') {
    // Время от начала до конца движения и количество разворотов
    const xs = smooth(frames.map((f) => { const h = P(f, 'hip'); return h ? h[0] : null; }), 2);
    const v = xs.map((x, i) => (i && x != null && xs[i - 1] != null ? (x - xs[i - 1]) / (times[i] - times[i - 1] || 1) : null));
    const moving = v.map((d) => d != null && Math.abs(d) > 0.12);
    let start = null, end = null;
    moving.forEach((mv, i) => { if (mv) { if (start == null) start = times[i]; end = times[i]; } });
    let turns = 0, lastSign = 0, lastTurnT = -1;
    v.forEach((d, i) => {
      if (d == null || Math.abs(d) < 0.12) return;
      const sg = Math.sign(d);
      if (lastSign && sg !== lastSign && times[i] - lastTurnT > 0.4) { turns++; lastTurnT = times[i]; }
      lastSign = sg;
    });
    m.runTime = start != null && end > start ? end - start : null;
    m.turns = turns;
    if (turns < 2) issues.push('shuttle_turns');
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
    try { res = lm.detectForVideo(v, nextTs()); } catch { res = null; }
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
export function drawFrame(ctx, frame, video, { trail = [], fit = 'contain', hot = null, body = false, prop = null } = {}) {
  const c = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  const cw = c.clientWidth, ch = c.clientHeight;
  if (c.width !== Math.round(cw * dpr)) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  if (!frame?.p || !video.videoWidth) return;
  const s = (fit === 'cover' ? Math.max : Math.min)(cw / video.videoWidth, ch / video.videoHeight);
  const w = video.videoWidth * s, h = video.videoHeight * s;
  const ox = (cw - w) / 2, oy = (ch - h) / 2;
  const X = (p) => ox + p[0] * w, Y = (p) => oy + p[1] * h;

  if (trail.length > 1) {
    ctx.strokeStyle = 'rgba(39,182,99,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
    ctx.beginPath(); trail.forEach((p, i) => (i ? ctx.lineTo(X(p), Y(p)) : ctx.moveTo(X(p), Y(p)))); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.lineCap = 'round';
  // Демо: опора (ковёр или перекладина) и объёмный силуэт под скелетом
  if (prop) {
    ctx.strokeStyle = 'rgba(39,182,99,.85)'; ctx.lineWidth = prop.w || 3;
    ctx.beginPath(); ctx.moveTo(ox + prop.x0 * w, oy + prop.y * h); ctx.lineTo(ox + prop.x1 * w, oy + prop.y * h); ctx.stroke();
  }
  if (body) {
    const u = Math.min(w, h) * 0.05;
    const grad = ctx.createLinearGradient(0, oy, 0, oy + h);
    grad.addColorStop(0, 'rgba(66,68,76,.95)'); grad.addColorStop(1, 'rgba(24,26,28,.95)');
    ctx.strokeStyle = grad; ctx.fillStyle = grad; ctx.lineJoin = 'round';
    const line = (A, B, k) => { ctx.lineWidth = u * k; ctx.beginPath(); ctx.moveTo(X(A), Y(A)); ctx.lineTo(X(B), Y(B)); ctx.stroke(); };
    const P = frame.p;
    ctx.lineWidth = u * 1.1;
    ctx.beginPath(); [1, 2, 8, 7].forEach((k, i) => (i ? ctx.lineTo(X(P[k]), Y(P[k])) : ctx.moveTo(X(P[k]), Y(P[k])))); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (const s0 of [1, 0]) { // сначала дальняя сторона, потом ближняя
      const o = s0;
      line(P[1 + o], P[3 + o], 0.8); line(P[3 + o], P[5 + o], 0.62); line(P[7 + o], P[9 + o], 1.05); line(P[9 + o], P[11 + o], 0.75);
    }
    ctx.beginPath(); ctx.arc(X(P[0]), Y(P[0]), u * 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(39,182,99,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
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
    const key = (hot || [7, 8, 9, 10]).includes(i);
    const r = key ? 6 : 4.5, a = r * 0.414, x = X(p), y = Y(p);
    ctx.beginPath();
    ctx.moveTo(x - a, y - r); ctx.lineTo(x + a, y - r); ctx.lineTo(x + r, y - a); ctx.lineTo(x + r, y + a);
    ctx.lineTo(x + a, y + r); ctx.lineTo(x - a, y + r); ctx.lineTo(x - r, y + a); ctx.lineTo(x - r, y - a); ctx.closePath();
    ctx.fillStyle = key ? '#27b663' : '#0b0b0c'; ctx.fill();
    ctx.strokeStyle = key ? '#27b663' : '#f4f2ee'; ctx.lineWidth = 1.4; ctx.stroke();
  });
}

export function frameAt(frames, t) {
  if (!frames?.length) return null;
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (frames[mid].t < t) lo = mid + 1; else hi = mid; }
  return frames[lo];
}
