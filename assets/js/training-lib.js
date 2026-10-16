// Дневник тренировок: справочники, расчёты нагрузки и демо-данные.
// Нагрузка сессии = минуты × интенсивность (RPE 1–10) — стандартный метод sRPE.
import { uid } from './store.js';

export const TYPES = [
  { id: 'mat', icon: 'M4 18h16M6 18c1-6 4-9 6-9s5 3 6 9M12 9V5' },
  { id: 'sparring', icon: 'M7 6a2 2 0 1 0 0 .1M17 6a2 2 0 1 0 0 .1M7 9v5l-2 5M17 9v5l2 5M7 11h10' },
  { id: 'strength', icon: 'M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12' },
  { id: 'cardio', icon: 'M3 12h4l2-5 4 10 2-5h6' },
  { id: 'stretch', icon: 'M12 4a2 2 0 1 0 0 .1M12 7v6l-5 6M12 13l5 6M5 9l7 2 7-2' },
  { id: 'recovery', icon: 'M12 21s-7-4.5-9-9a4.5 4.5 0 0 1 9-2.5A4.5 4.5 0 0 1 21 12c-2 4.5-9 9-9 9z' },
];
export const typeIcon = (id) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${(TYPES.find((x) => x.id === id) || TYPES[0]).icon}"/></svg>`;

// Показатели, которые спортсмен может записывать (по желанию)
export const METRICS = [
  { id: 'weight', unit: 'unit.kg', digits: 1, better: 0 },
  { id: 'pullups', unit: '', digits: 0, better: 1 },
  { id: 'pushups', unit: '', digits: 0, better: 1 },
  { id: 'squats', unit: '', digits: 0, better: 1 },
  { id: 'sprawls', unit: '', digits: 0, better: 1 },
  { id: 'shuttle', unit: 'unit.sec', digits: 1, better: -1 },
  { id: 'pulse', unit: 'unit.bpm', digits: 0, better: -1 },
];

// ---------- Даты (локальные, без сдвига часового пояса) ----------
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const monday = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
export const load = (s) => (s.minutes || 0) * (s.rpe || 0);

// Недельные суммы за последние n недель (старые → новые)
export function weekly(list, n = 8, today = new Date()) {
  const start = monday(today);
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const from = addDays(start, -7 * i), to = addDays(from, 7);
    const items = list.filter((s) => { const d = parse(s.date); return d >= from && d < to; });
    weeks.push({ from, sessions: items.length, minutes: items.reduce((a, s) => a + s.minutes, 0), load: items.reduce((a, s) => a + load(s), 0) });
  }
  return weeks;
}

// Сводка за последние 7 дней и сравнение с предыдущими 7
export function summary(list, today = new Date()) {
  const t0 = addDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), 1);
  const span = (a, b) => list.filter((s) => { const d = parse(s.date); return d >= addDays(t0, a) && d < addDays(t0, b); });
  const cur = span(-7, 0), prev = span(-14, -7), last28 = span(-28, 0);
  const sum = (xs, f) => xs.reduce((a, s) => a + f(s), 0);
  const avg = (xs, f) => { const v = xs.map(f).filter((x) => x != null && !Number.isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const acute = sum(cur, load), chronic = sum(last28, load) / 4;
  const wNow = avg(cur, (s) => s.weight), wPrev = avg(prev, (s) => s.weight);
  return {
    sessions: cur.length,
    minutes: sum(cur, (s) => s.minutes),
    load: acute,
    loadPrev: sum(prev, load),
    rpe: avg(cur, (s) => s.rpe),
    mood: avg(cur, (s) => s.mood),
    // Соотношение острой и хронической нагрузки — растёт при резком скачке
    acwr: chronic > 0 && list.some((s) => parse(s.date) < addDays(t0, -21)) ? acute / chronic : null,
    weightDrop: wNow != null && wPrev ? ((wPrev - wNow) / wPrev) * 100 : null,
  };
}

// Сетка календаря: последние n недель × 7 дней, значение = нагрузка дня
export function heatmap(list, n = 12, today = new Date()) {
  const start = addDays(monday(today), -7 * (n - 1));
  const byDay = {};
  list.forEach((s) => { byDay[s.date] = (byDay[s.date] || 0) + load(s); });
  const cells = [];
  for (let w = 0; w < n; w++) for (let d = 0; d < 7; d++) {
    const date = addDays(start, w * 7 + d);
    cells.push({ w, d, date: iso(date), value: byDay[iso(date)] || 0, future: date > today });
  }
  return cells;
}

// Ряд значений показателя по датам (по одному на дату — последнее)
export function series(list, metric) {
  const map = {};
  list.forEach((s) => { if (s[metric] != null && s[metric] !== '') map[s.date] = +s[metric]; });
  return Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date, v }));
}

// ---------- Демо: 8 недель тренировок с постепенным прогрессом ----------
export function demoTrainings(today = new Date(), seed0 = 7, opts = {}) {
  let seed = seed0;
  const lv = opts.level ?? 1; // сила ученика: масштаб показателей
  const w0 = opts.weight ?? 66;
  const spike = opts.spike; // последняя неделя с резким скачком нагрузки
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const out = [];
  const plan = [[0, 'mat'], [1, 'strength'], [2, 'sparring'], [3, 'cardio'], [4, 'mat'], [5, 'stretch']];
  const weeks = 8;
  const start = addDays(monday(today), -7 * (weeks - 1));
  for (let w = 0; w < weeks; w++) {
    const deload = w === 4; // разгрузочная неделя
    plan.forEach(([dow, type], k) => {
      if (deload && k % 2) return;
      if (rnd() < 0.12) return; // пропуск
      const date = addDays(start, w * 7 + dow);
      if (date > today) return;
      const prog = w / (weeks - 1);
      const base = { mat: 90, sparring: 75, strength: 60, cardio: 40, stretch: 30, recovery: 30 }[type];
      const s = {
        id: uid('t'), demo: true, date: iso(date), type,
        minutes: Math.round((base * (deload ? 0.7 : 1) + (rnd() - 0.5) * 15) / 5) * 5,
        rpe: Math.max(3, Math.min(9, Math.round(({ mat: 6, sparring: 8, strength: 7, cardio: 6, stretch: 3, recovery: 2 }[type]) + (rnd() - 0.5) * 2 - (deload ? 1 : 0)))),
        mood: Math.max(2, Math.min(5, Math.round(3.6 + rnd() * 1.4 - (type === 'sparring' ? 0.5 : 0)))),
      };
      if (k === 0) { s.weight = +(w0 + 0.4 - prog * 0.6 + (rnd() - 0.5) * 0.4).toFixed(1); s.pulse = Math.round(64 - prog * 6 + (rnd() - 0.5) * 2); }
      if (type === 'strength') s.pullups = Math.round((8 + prog * 5 + (rnd() - 0.5) * 1.2) * lv);
      if (spike && w === weeks - 1) { s.minutes = Math.round(s.minutes * 1.5 / 5) * 5; s.rpe = Math.min(10, s.rpe + 2); }
      // тренировки с камерой: силовые за последние 3 недели
      if (opts.camera && type === 'strength' && w >= weeks - 3) {
        const pu = s.pullups, sq = Math.round((22 + prog * 8) * lv), ps = Math.round((20 + prog * 6) * lv);
        s.camera = true;
        s.sets = [{ ex: 'pullup', reps: pu, sec: 32 }, { ex: 'pullup', reps: Math.max(1, pu - 2), sec: 30 }, { ex: 'squat', reps: sq, sec: 45 }, { ex: 'pushup', reps: ps, sec: 40 }, { ex: 'bridge', hold: +(8 + prog * 6 * lv).toFixed(1), sec: 15 }];
        s.squats = sq; s.pushups = ps;
      }
      if (type === 'mat' && k === 4) s.sprawls = Math.round(14 + prog * 5 + (rnd() - 0.5) * 1.5);
      if (type === 'cardio') s.shuttle = +(9.5 - prog * 0.7 + (rnd() - 0.5) * 0.15).toFixed(1);
      out.push(s);
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
