// Заставка при запуске: тёмная арена, прожектор, два борца — объёмные силуэты с контровым светом
// и разметкой суставов, как в системах захвата движения. Захват, бросок через себя с замедлением,
// табло «5 баллов», затем собирается эмблема. Один раз за сеанс, пропуск касанием.
import { t } from './i18n.js';

// ---------- Позы (борец смотрит вправо, стопы на y = 0) ----------
const POSE = {
  stance: { head: [14, -142], sh: [6, -120], hip: [-8, -70], elN: [30, -98], wrN: [46, -112], elF: [22, -92], wrF: [40, -104], knN: [10, -36], anN: [4, 0], knF: [-26, -38], anF: [-34, 0] },
  bounce: { head: [16, -136], sh: [8, -115], hip: [-8, -66], elN: [32, -94], wrN: [48, -106], elF: [24, -88], wrF: [42, -98], knN: [13, -33], anN: [4, 0], knF: [-24, -35], anF: [-34, 0] },
  lunge: { head: [42, -104], sh: [28, -96], hip: [-6, -58], elN: [54, -80], wrN: [72, -86], elF: [46, -72], wrF: [64, -76], knN: [28, -26], anN: [32, 0], knF: [-30, -22], anF: [-50, 0] },
  clinch: { head: [26, -126], sh: [16, -110], hip: [-6, -64], elN: [42, -112], wrN: [58, -122], elF: [38, -94], wrF: [58, -88], knN: [8, -34], anN: [6, 0], knF: [-26, -34], anF: [-38, 0] },
  lift: { head: [10, -128], sh: [4, -110], hip: [-14, -58], elN: [30, -104], wrN: [46, -96], elF: [26, -90], wrF: [44, -80], knN: [12, -30], anN: [12, 0], knF: [-34, -28], anF: [-40, 0] },
  arch: { head: [-34, -112], sh: [-22, -108], hip: [-4, -66], elN: [-6, -126], wrN: [8, -132], elF: [-10, -116], wrF: [6, -118], knN: [14, -32], anN: [18, 0], knF: [-22, -32], anF: [-30, 0] },
};
const KEYS = Object.keys(POSE.stance);
const TRACK_A = [[0, 'stance', -260], [0.55, 'bounce', -120], [0.8, 'stance', -100], [1.1, 'lunge', -48], [1.35, 'clinch', -30], [1.85, 'clinch', -26], [2.15, 'lift', -24], [2.55, 'arch', -24], [3.2, 'arch', -24]];
const TRACK_B = [[0, 'stance', 260, 0], [0.55, 'bounce', 120, 0], [0.8, 'stance', 100, 0], [1.1, 'stance', 64, 0], [1.35, 'clinch', 30, 0], [1.85, 'clinch', 28, 0], [2.15, 'clinch', 22, -0.35], [2.6, 'clinch', 10, -3.05], [3.2, 'clinch', 10, -3.05]];

const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (A, B, k) => Object.fromEntries(KEYS.map((n) => [n, [lerp(A[n][0], B[n][0], k), lerp(A[n][1], B[n][1], k)]]));
function at(track, tt) {
  let i = 0;
  while (i < track.length - 2 && tt > track[i + 1][0]) i++;
  const a = track[i], b = track[i + 1];
  const k = ease(clamp((tt - a[0]) / (b[0] - a[0] || 1)));
  return { pose: mix(POSE[a[1]], POSE[b[1]], k), x: lerp(a[2], b[2], k), rot: lerp(a[3] || 0, b[3] || 0, k) };
}
// Реальное время → время анимации: бросок идёт в замедлении
function animTime(r) {
  if (r < 2) return r * 1.1;
  if (r < 2.85) return 2.2 + (r - 2) * 0.5;
  return 2.625 + (r - 2.85);
}
const angle = (a, b, c) => {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  return Math.round((Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1), -1, 1)) * 180) / Math.PI);
};

// ---------- Анатомия: сегменты переменной толщины с «мышцей» ----------
// [от, до, толщина в начале, в конце, выпуклость (+ вперёд / − назад)]
const SEG_FAR = [['hip', 'knF', 21, 13, -3], ['knF', 'anF', 12.5, 7.5, 3], ['sh', 'elF', 13, 9.5, 2.5], ['elF', 'wrF', 9.5, 6.5, 1.5]];
const SEG_NEAR = [['hip', 'knN', 22, 14, -3.5], ['knN', 'anN', 13, 8, 3.2], ['sh', 'elN', 14, 10, 3], ['elN', 'wrN', 10, 7, 1.8]];

function capsule(A, B, wa, wb, bulge) {
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const pts = [];
  const N = 7;
  for (let i = 0; i <= N; i++) { // одна сторона с мышцей
    const k = i / N, w = lerp(wa, wb, k) / 2 + Math.sin(Math.PI * k) * Math.max(0, bulge);
    pts.push([A[0] + dx * k + nx * w, A[1] + dy * k + ny * w]);
  }
  const a1 = Math.atan2(ny, nx);
  for (let i = 1; i < 6; i++) { const q = a1 - (Math.PI * i) / 6; pts.push([B[0] + Math.cos(q) * wb / 2, B[1] + Math.sin(q) * wb / 2]); }
  for (let i = N; i >= 0; i--) { // другая сторона
    const k = i / N, w = lerp(wa, wb, k) / 2 + Math.sin(Math.PI * k) * Math.max(0, -bulge);
    pts.push([A[0] + dx * k - nx * w, A[1] + dy * k - ny * w]);
  }
  for (let i = 1; i < 6; i++) { const q = a1 + Math.PI - (Math.PI * i) / 6; pts.push([A[0] + Math.cos(q) * wa / 2, A[1] + Math.sin(q) * wa / 2]); }
  return pts;
}
const circle = (C, r) => Array.from({ length: 14 }, (_, i) => [C[0] + Math.cos((i / 14) * Math.PI * 2) * r, C[1] + Math.sin((i / 14) * Math.PI * 2) * r]);
const ellipseAt = (C, rx, ry, ang) => Array.from({ length: 16 }, (_, i) => { const q = (i / 16) * Math.PI * 2; const x = Math.cos(q) * rx, y = Math.sin(q) * ry; return [C[0] + x * Math.cos(ang) - y * Math.sin(ang), C[1] + x * Math.sin(ang) + y * Math.cos(ang)]; });

function bodyShapes(P) {
  const neckTop = [lerp(P.sh[0], P.head[0], 0.55), lerp(P.sh[1], P.head[1], 0.55)];
  const dir = Math.atan2(P.head[1] - P.sh[1], P.head[0] - P.sh[0]) + Math.PI / 2;
  const foot = (an, kn) => { const f = [an[0] + 13, an[1] + 1]; return capsule([an[0] - 3, an[1] - 2], f, 8, 5, 0); };
  const far = [...SEG_FAR.map(([a, b, wa, wb, bu]) => capsule(P[a], P[b], wa, wb, bu)), foot(P.anF, P.knF), circle(P.wrF, 4.2)];
  const torso = [capsule(P.sh, P.hip, 33, 25, 5), circle(P.hip, 12.5), circle(P.sh, 9.5), capsule(P.sh, neckTop, 11, 10, 0), ellipseAt(P.head, 9.5, 11.5, dir)];
  const near = [...SEG_NEAR.map(([a, b, wa, wb, bu]) => capsule(P[a], P[b], wa, wb, bu)), foot(P.anN, P.knN), circle(P.wrN, 4.5), circle(P.sh, 8.5)];
  return { far, torso, near };
}

export function playIntro() {
  let skip = false;
  try { skip = !!sessionStorage.getItem('wt.introSeen') || !!localStorage.getItem('wt.intro'); sessionStorage.setItem('wt.introSeen', '1'); } catch {}
  if (skip) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RING = 'M16.4 4h15.2L44 16.4v15.2L31.6 44H16.4L4 31.6V16.4z';
  const W = 'M9.6 15.6h5.8l4.8 13.6 3.8-10.4 3.8 10.4 4.8-13.6h5.8l-8.4 20.2h-4L24 31l-2 4.8h-4z';

  const el = document.createElement('div');
  el.className = 'intro' + (reduce ? ' calm logo-go' : '');
  el.setAttribute('role', 'presentation');
  el.innerHTML = `
    <canvas></canvas>
    <div class="in-score" aria-hidden="true"><b>5</b><span>${esc(t('intro.score'))}</span></div>
    <div class="in-logo">
      <svg class="in-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs><clipPath id="in-r"><rect x="24" y="0" width="24" height="48"/></clipPath><clipPath id="in-l"><rect x="0" y="0" width="24" height="48"/></clipPath></defs>
        <path class="m-bg" d="M15.6 1.5h16.8l14.1 14.1v16.8L32.4 46.5H15.6L1.5 32.4V15.6z" fill="#0d1210"/>
        <path class="m-ring" d="${RING}" stroke="#27b663" stroke-width="1.3" pathLength="100"/>
        <g class="m-a"><path d="${W}" fill="#f4f2ee" clip-path="url(#in-l)"/></g>
        <g class="m-b"><path d="${W}" fill="#27b663" clip-path="url(#in-r)"/></g>
        <path class="m-d" d="M24 8.4l2.8 2.8L24 14l-2.8-2.8z" fill="#27b663"/>
      </svg>
      <div class="in-word"><b>WRESTLING TALENT</b><i class="in-rule"></i><small>${esc(t('intro.tag'))}</small></div>
    </div>
    <div class="in-grain"></div>
    <button class="intro-skip" type="button" aria-label="Skip">${esc(t('intro.skip'))} ›</button>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('intro-on');

  let done = false, raf = 0;
  const finish = () => {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    el.classList.add('out');
    document.documentElement.classList.remove('intro-on');
    setTimeout(() => el.remove(), 800);
  };
  el.addEventListener('click', finish);
  addEventListener('keydown', function k() { removeEventListener('keydown', k); finish(); });
  if (reduce) { setTimeout(finish, 1600); return; }

  const cv = el.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const size = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener('resize', size);

  const motes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.05, r: Math.random() * 1.4 + 0.3 }));
  const sparks = [], waves = [];
  let shakeUntil = 0, shakeAmp = 0, hit1 = false, hit2 = false, flash = 0, scored = false, logo = false;
  const t0 = performance.now();

  function impact(x, y, p, now) {
    waves.push({ x, y, t: now, p });
    shakeUntil = now + 140 + p * 160; shakeAmp = 3 + p * 7;
    for (let i = 0; i < 20 + p * 40; i++) {
      const a = Math.PI + Math.random() * Math.PI, v = (1.5 + Math.random() * 5) * (0.5 + p * 0.7);
      sparks.push({ x, y, vx: Math.cos(a) * v * 1.6, vy: Math.sin(a) * v * 0.7, life: 1, dust: p > 0.6 && Math.random() < 0.6 });
    }
    navigator.vibrate?.(p > 0.6 ? 70 : 25);
  }

  // Силуэт: контровой свет (смещённый слой с свечением), затем тело, затем разметка суставов
  function drawWrestler(P, ox, oy, s, flip, rot, pivot, rim, alphaMarks, glow = 1) {
    const tr = ([x, y]) => {
      let px = (flip ? -x : x) * s + ox, py = y * s + oy;
      if (rot) { const dx = px - pivot[0], dy = py - pivot[1], c = Math.cos(rot), sn = Math.sin(rot); px = pivot[0] + dx * c - dy * sn; py = pivot[1] + dx * sn + dy * c; }
      return [px, py];
    };
    const sh = bodyShapes(P);
    const fill = (poly) => { ctx.beginPath(); poly.forEach((p, i) => { const q = tr(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); };
    const all = [...sh.far, ...sh.torso, ...sh.near];
    // 1. контур света
    ctx.save();
    ctx.shadowColor = rim; ctx.shadowBlur = 9 * s * glow;
    ctx.fillStyle = rim; ctx.globalAlpha *= 0.9;
    ctx.translate(-1.2 * s * (flip ? -1 : 1), -1.8 * s);
    all.forEach(fill);
    ctx.restore();
    // 2. тело
    const top = tr([0, -150]), bot = tr([0, 0]);
    const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, '#20252a'); g.addColorStop(0.5, '#0f1214'); g.addColorStop(1, '#050606');
    ctx.fillStyle = '#07090a'; sh.far.forEach(fill);
    ctx.fillStyle = g; sh.torso.forEach(fill); sh.near.forEach(fill);
    // 3. разметка суставов
    if (alphaMarks > 0) {
      const J = Object.fromEntries(KEYS.map((k) => [k, tr(P[k])]));
      ctx.save();
      ctx.globalAlpha = alphaMarks * 0.55;
      ctx.strokeStyle = rim; ctx.lineWidth = 1;
      [['head', 'sh'], ['sh', 'hip'], ['sh', 'elN'], ['elN', 'wrN'], ['hip', 'knN'], ['knN', 'anN'], ['hip', 'knF'], ['knF', 'anF']].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...J[a]); ctx.lineTo(...J[b]); ctx.stroke(); });
      ctx.globalAlpha = alphaMarks;
      ['sh', 'elN', 'wrN', 'hip', 'knN', 'anN', 'knF'].forEach((k) => {
        const [x, y] = J[k], r = 3.2;
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
        ctx.fillStyle = '#050606'; ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 1.2; ctx.stroke();
      });
      ctx.restore();
      return J;
    }
    return Object.fromEntries(KEYS.map((k) => [k, tr(P[k])]));
  }

  function label(x, y, title, value, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(39,182,99,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y - 16); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#27b663'; ctx.fill();
    ctx.fillStyle = 'rgba(4,7,5,.82)'; ctx.fillRect(x + 16, y - 36, 64, 38);
    ctx.fillStyle = '#27b663'; ctx.fillRect(x + 16, y - 36, 2, 38);
    ctx.font = '600 9px Inter, sans-serif'; ctx.fillStyle = 'rgba(244,242,238,.65)';
    try { ctx.letterSpacing = '1.5px'; } catch {}
    ctx.fillText(title.toUpperCase(), x + 24, y - 23);
    ctx.font = '600 15px Oswald, sans-serif'; ctx.fillStyle = '#27b663';
    ctx.fillText(value, x + 24, y - 5);
    ctx.restore();
  }

  function frame(now) {
    const real = (now - t0) / 1000;
    const tt = animTime(real);
    const Wd = innerWidth, H = innerHeight;
    const s = Math.min(Wd / 300, H / 470);
    const gy = H * 0.68, cx = Wd / 2;
    ctx.save();
    ctx.clearRect(0, 0, Wd, H);
    if (now < shakeUntil) ctx.translate((Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp);
    const fade = clamp((3.55 - real) / 0.4);
    const on = clamp(real / 0.6);

    // прожектор сверху
    ctx.globalAlpha = on * fade;
    const cone = ctx.createLinearGradient(0, 0, 0, gy + 40 * s);
    cone.addColorStop(0, 'rgba(220,240,228,0)'); cone.addColorStop(0.4, 'rgba(200,235,215,.022)'); cone.addColorStop(0.85, 'rgba(160,230,190,.04)'); cone.addColorStop(1, 'rgba(160,230,190,0)');
    ctx.fillStyle = cone;
    for (const k of [1, 0.85, 0.7, 0.55]) { // несколько слоёв — мягкие края луча
      ctx.beginPath(); ctx.moveTo(cx - 34 * s * k, 0); ctx.lineTo(cx + 34 * s * k, 0); ctx.lineTo(cx + 250 * s * k, gy + 40 * s); ctx.lineTo(cx - 250 * s * k, gy + 40 * s); ctx.closePath(); ctx.fill();
    }
    for (const m of motes) { // пылинки в луче
      m.y -= m.v / 60; if (m.y < 0) m.y = 1;
      const yy = m.y * gy, half = 40 * s + (190 * s * yy) / gy;
      ctx.fillStyle = 'rgba(220,240,230,.35)'; ctx.fillRect(cx + (m.x - 0.5) * 2 * half, yy, m.r, m.r);
    }
    // ковёр
    const mat = ctx.createRadialGradient(cx, gy, 10, cx, gy, 300 * s);
    mat.addColorStop(0, 'rgba(39,182,99,.22)'); mat.addColorStop(1, 'rgba(39,182,99,0)');
    ctx.fillStyle = mat; ctx.beginPath(); ctx.ellipse(cx, gy, 320 * s, 44 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(39,182,99,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, gy, 230 * s * on, 32 * s * on, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(39,182,99,.22)';
    ctx.beginPath(); ctx.ellipse(cx, gy, 60 * s * on, 8.5 * s * on, 0, 0, Math.PI * 2); ctx.stroke();

    const A = at(TRACK_A, tt), B = at(TRACK_B, tt);
    const pivot = [cx - 48 * s, gy - 62 * s];
    const marks = clamp((tt - 0.3) / 0.4) * clamp((3.0 - tt) / 0.3);
    // тени на ковре
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath(); ctx.ellipse(cx + A.x * s, gy + 2, 40 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + B.x * s, gy + 2, 40 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    // след броска
    if (tt > 2.2 && tt < 2.62) {
      for (let k = 3; k >= 1; k--) {
        const Bt = at(TRACK_B, tt - k * 0.03);
        ctx.globalAlpha = 0.1 * (4 - k) * fade;
        drawWrestler(Bt.pose, cx + Bt.x * s, gy, s, true, Bt.rot, pivot, '#1f7a47', 0, 0);
      }
    }
    ctx.globalAlpha = fade;
    const JB = drawWrestler(B.pose, cx + B.x * s, gy, s, true, B.rot, pivot, '#3cc77a', marks);
    const JA = drawWrestler(A.pose, cx + A.x * s, gy, s, false, 0, pivot, '#dfe3df', marks);

    // живые показания — как в системе анализа движения
    const fadeIn = (a, b) => clamp((tt - a) / 0.15) * clamp((b - tt) / 0.15);
    label(JA.knN[0] + 6, JA.knN[1], t('intro.l_knee'), angle(A.pose.hip, A.pose.knN, A.pose.anN) + '°', fadeIn(0.85, 1.4) * fade);
    label(JA.sh[0] + 8, JA.sh[1] - 30 * s, t('intro.l_grip'), '2 / 2', fadeIn(1.4, 2.1) * fade);
    label(JB.hip[0] + 10, JB.hip[1], t('intro.l_rot'), Math.round(Math.abs(B.rot) * 180 / Math.PI) + '°', fadeIn(2.2, 2.62) * fade);

    if (!hit1 && tt >= 1.3) { hit1 = true; impact(cx, gy - 118 * s, 0.35, now); }
    if (!hit2 && tt >= 2.6) { hit2 = true; impact(JB.sh[0], gy - 6 * s, 1, now); flash = 1; }
    if (!scored && tt >= 2.62) { scored = true; el.classList.add('scored'); }

    ctx.globalAlpha = 1;
    for (const w of waves) {
      const k = (now - w.t) / 700; if (k > 1) continue;
      ctx.strokeStyle = `rgba(39,182,99,${(1 - k) * 0.8})`; ctx.lineWidth = (1 - k) * 4 + 1;
      ctx.beginPath(); ctx.ellipse(w.x, w.y, (40 + 260 * w.p) * s * ease(k), (10 + 40 * w.p) * s * ease(k), 0, 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of sparks) {
      if (p.life <= 0) continue;
      p.x += p.vx; p.y += p.vy; p.vy += p.dust ? 0.03 : 0.2; p.vx *= 0.97; p.life -= p.dust ? 0.012 : 0.03;
      ctx.globalAlpha = Math.max(0, p.life) * (p.dust ? 0.12 : 0.9);
      ctx.fillStyle = p.dust ? '#b8c4bd' : '#2fd174';
      if (p.dust) { ctx.beginPath(); ctx.arc(p.x, p.y, 3 + (1 - p.life) * 14, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(244,242,238,${flash * 0.14})`; ctx.fillRect(0, 0, Wd, H); flash -= 0.05; }

    if (!logo && real >= 3.4) { logo = true; el.classList.add('logo-go'); }
    if (real >= 5.5) return finish();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
