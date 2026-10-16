// Заставка при запуске: два борца выходят, сходятся в захвате, бросок через себя, удар —
// и фигуры сменяются логотипом. Один раз за сеанс, пропуск касанием. Около 4 секунд.
import { logoMark } from './ui.js';

// Позы борца, смотрящего вправо. Ноги стоят на линии y = 0, единицы — условные.
const POSE = {
  stance: { head: [14, -142], sh: [6, -120], hip: [-8, -70], elN: [30, -98], wrN: [46, -112], elF: [22, -92], wrF: [40, -104], knN: [10, -36], anN: [4, 0], knF: [-26, -38], anF: [-34, 0] },
  bounce: { head: [16, -136], sh: [8, -115], hip: [-8, -66], elN: [32, -94], wrN: [48, -106], elF: [24, -88], wrF: [42, -98], knN: [13, -33], anN: [4, 0], knF: [-24, -35], anF: [-34, 0] },
  lunge: { head: [42, -104], sh: [28, -96], hip: [-6, -58], elN: [54, -80], wrN: [72, -86], elF: [46, -72], wrF: [64, -76], knN: [28, -26], anN: [32, 0], knF: [-30, -22], anF: [-50, 0] },
  clinch: { head: [26, -126], sh: [16, -110], hip: [-6, -64], elN: [42, -112], wrN: [58, -122], elF: [38, -94], wrF: [58, -88], knN: [8, -34], anN: [6, 0], knF: [-26, -34], anF: [-38, 0] },
  lift: { head: [10, -128], sh: [4, -110], hip: [-14, -58], elN: [30, -104], wrN: [46, -96], elF: [26, -90], wrF: [44, -80], knN: [12, -30], anN: [12, 0], knF: [-34, -28], anF: [-40, 0] },
  arch: { head: [-34, -112], sh: [-22, -108], hip: [-4, -66], elN: [-6, -126], wrN: [8, -132], elF: [-10, -116], wrF: [6, -118], knN: [14, -32], anN: [18, 0], knF: [-22, -32], anF: [-30, 0] },
};
const KEYS = Object.keys(POSE.stance);

const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp = (v) => Math.max(0, Math.min(1, v));
const mix = (A, B, k) => Object.fromEntries(KEYS.map((n) => [n, [lerp(A[n][0], B[n][0], k), lerp(A[n][1], B[n][1], k)]]));

// Ключевые кадры: время (с), поза, положение x, поворот вокруг точки броска
const TRACK_A = [[0, 'stance', -260], [0.55, 'bounce', -120], [0.8, 'stance', -100], [1.1, 'lunge', -48], [1.35, 'clinch', -30], [1.85, 'clinch', -26], [2.15, 'lift', -24], [2.55, 'arch', -24], [3.2, 'arch', -24]];
const TRACK_B = [[0, 'stance', 260, 0], [0.55, 'bounce', 120, 0], [0.8, 'stance', 100, 0], [1.1, 'stance', 64, 0], [1.35, 'clinch', 30, 0], [1.85, 'clinch', 28, 0], [2.15, 'clinch', 22, -0.35], [2.6, 'clinch', 10, -3.05], [3.2, 'clinch', 10, -3.05]];

function at(track, t) {
  let i = 0;
  while (i < track.length - 2 && t > track[i + 1][0]) i++;
  const a = track[i], b = track[i + 1];
  const k = ease(clamp((t - a[0]) / (b[0] - a[0] || 1)));
  return { pose: mix(POSE[a[1]], POSE[b[1]], k), x: lerp(a[2], b[2], k), rot: lerp(a[3] || 0, b[3] || 0, k) };
}

export function playIntro() {
  let skip = false;
  try { skip = !!sessionStorage.getItem('wt.introSeen') || !!localStorage.getItem('wt.intro'); sessionStorage.setItem('wt.introSeen', '1'); } catch {}
  if (skip) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = document.createElement('div');
  el.className = 'intro' + (reduce ? ' calm' : '');
  el.setAttribute('role', 'presentation');
  el.innerHTML = `
    <canvas></canvas>
    <div class="intro-logo">${logoMark('big')}<div class="intro-word"><b>${[...'WRESTLING TALENT'].map((c, i) => `<i style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</i>`).join('')}</b><small>AI · TÜRKMENISTAN</small></div></div>
    <div class="intro-band" aria-hidden="true"><div class="carpet-band"></div></div>
    <button class="intro-skip" type="button" aria-label="Skip">›</button>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('intro-on');

  let done = false, raf = 0;
  const finish = () => {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    el.classList.add('out');
    document.documentElement.classList.remove('intro-on');
    setTimeout(() => el.remove(), 700);
  };
  el.addEventListener('click', finish);
  addEventListener('keydown', function k() { removeEventListener('keydown', k); finish(); });

  if (reduce) { el.classList.add('show-logo'); setTimeout(finish, 1400); return; }

  const cv = el.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const sparks = [];
  const bursts = [];
  let shakeUntil = 0, shakeAmp = 0, hit1 = false, hit2 = false, flash = 0;
  const t0 = performance.now();

  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  size(); addEventListener('resize', size);

  function impact(x, y, power, now) {
    bursts.push({ x, y, t: now, power });
    shakeUntil = now + 160 + power * 120; shakeAmp = 4 + power * 6;
    for (let i = 0; i < 26 + power * 26; i++) {
      const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 6) * (0.6 + power * 0.6);
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c: Math.random() < 0.6 ? '#27b663' : '#f4f2ee' });
    }
    navigator.vibrate?.(power > 0.6 ? 60 : 25);
  }

  function drawFigure(P, ox, oy, s, flip, rot, pivot, light) {
    const tr = ([x, y]) => {
      let px = (flip ? -x : x) * s + ox, py = y * s + oy;
      if (rot) { const dx = px - pivot[0], dy = py - pivot[1]; const c = Math.cos(rot), sn = Math.sin(rot); px = pivot[0] + dx * c - dy * sn; py = pivot[1] + dx * sn + dy * c; }
      return [px, py];
    };
    const Q = Object.fromEntries(KEYS.map((k) => [k, tr(P[k])]));
    const line = (a, b, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(...Q[a]); ctx.lineTo(...Q[b]); ctx.stroke(); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const far = light ? '#9fa3aa' : '#147a40';
    const near = light ? '#f4f2ee' : '#27b663';
    // дальние конечности темнее — так видна глубина
    line('sh', 'elF', 12, far); line('elF', 'wrF', 10, far); line('hip', 'knF', 17, far); line('knF', 'anF', 12, far);
    line('sh', 'hip', 26, near);
    line('hip', 'knN', 17, near); line('knN', 'anN', 12, near);
    line('sh', 'elN', 12, near); line('elN', 'wrN', 10, near);
    ctx.fillStyle = near; ctx.beginPath(); ctx.arc(...Q.head, 13 * s, 0, Math.PI * 2); ctx.fill();
    return Q;
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    const W = innerWidth, H = innerHeight;
    const s = Math.min(W / 300, H / 470);
    const gy = H * 0.66;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (now < shakeUntil) ctx.translate((Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp);

    // ковёр: эллипс и круг схватки
    const fade = clamp((3.35 - t) / 0.35);
    ctx.globalAlpha = 0.9 * fade;
    const g = ctx.createRadialGradient(W / 2, gy, 10, W / 2, gy, 320 * s);
    g.addColorStop(0, 'rgba(39,182,99,.28)'); g.addColorStop(1, 'rgba(39,182,99,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(W / 2, gy, 330 * s, 46 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(39,182,99,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(W / 2, gy, 210 * s * clamp(t / 0.6), 30 * s * clamp(t / 0.6), 0, 0, Math.PI * 2); ctx.stroke();

    const A = at(TRACK_A, t), B = at(TRACK_B, t);
    const pivot = [W / 2 - 48 * s, gy - 62 * s]; // бросок через себя: приземление за спиной
    // след броска
    if (t > 2.15 && t < 2.75) {
      for (let k = 1; k <= 4; k++) {
        const Bt = at(TRACK_B, t - k * 0.035);
        ctx.globalAlpha = 0.12 * (5 - k) * fade;
        drawFigure(Bt.pose, W / 2 + Bt.x * s, gy, s, true, Bt.rot, pivot, false);
      }
    }
    ctx.globalAlpha = fade;
    const qB = drawFigure(B.pose, W / 2 + B.x * s, gy, s, true, B.rot, pivot, false);
    drawFigure(A.pose, W / 2 + A.x * s, gy, s, false, 0, pivot, true);

    if (!hit1 && t >= 1.3) { hit1 = true; impact(W / 2, gy - 118 * s, 0.4, now); }
    if (!hit2 && t >= 2.6) { hit2 = true; impact(qB.sh[0], gy - 8 * s, 1, now); flash = 1; }

    // волны удара
    ctx.globalAlpha = 1;
    for (const b of bursts) {
      const k = (now - b.t) / 650;
      if (k > 1) continue;
      ctx.strokeStyle = `rgba(39,182,99,${1 - k})`; ctx.lineWidth = (1 - k) * 6 + 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, (30 + 220 * b.power) * s * ease(k), 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(244,242,238,${(1 - k) * 0.6})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, (18 + 140 * b.power) * s * ease(k), 0, Math.PI * 2); ctx.stroke();
    }
    for (const p of sparks) {
      if (p.life <= 0) continue;
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= 0.022;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.restore();
    if (flash > 0) { ctx.fillStyle = `rgba(244,242,238,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); flash -= 0.06; }

    if (t >= 3.0 && !el.classList.contains('show-logo')) el.classList.add('show-logo');
    if (t >= 4.6) return finish();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}
