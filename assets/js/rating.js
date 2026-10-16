// Рейтинг: очки = сумма за турниры за последние 12 месяцев.
// За турнир: (баллы за место × уровень турнира + досрочные победы) × свежесть.
// Все коэффициенты в одном месте — федерация может поменять их без переделки кода.

export const PLACE_PTS = { 1: 10, 2: 8, 3: 6, 5: 4, 7: 2 };
export const PARTICIPATION = 1;
export const placePts = (place) => PLACE_PTS[place] ?? PARTICIPATION;

export const LEVELS = [
  { id: 'city', k: 1, name: { tk: 'Etrap / şäher', ru: 'Этрап / город', en: 'District / city' } },
  { id: 'welayat', k: 2, name: { tk: 'Welaýat', ru: 'Велаят', en: 'Province' } },
  { id: 'national', k: 4, name: { tk: 'Türkmenistanyň çempionaty', ru: 'Чемпионат Туркменистана', en: 'National championship' } },
  { id: 'intl', k: 6, name: { tk: 'Halkara ýaryş', ru: 'Международный турнир', en: 'International event' } },
  { id: 'major', k: 10, name: { tk: 'Aziýa / dünýä çempionaty', ru: 'Чемпионат Азии / мира', en: 'Asian / World championships' } },
];
export const levelById = (id) => LEVELS.find((l) => l.id === id);

export const BONUS = 1; // за каждую досрочную победу (туше, явное преимущество)
export const FRESH_DAYS = 183; // старше полугода — половина очков
export const WINDOW_DAYS = 365; // старше года — не входит

const DAY = 864e5;
const daysAgo = (date, today) => Math.floor((today - new Date(date + 'T12:00:00')) / DAY);

export function scoreResult(r, today = new Date()) {
  const age = daysAgo(r.date, today);
  const lvl = levelById(r.level);
  const base = placePts(r.place) * lvl.k;
  const bonus = (r.early || 0) * BONUS;
  const fresh = age < 0 || age > WINDOW_DAYS ? 0 : age > FRESH_DAYS ? 0.5 : 1; // будущие (на дату расчёта) не считаются
  return { ...r, age, k: lvl.k, pts: placePts(r.place), base, bonus, fresh, total: (base + bonus) * fresh };
}

export function rate(results, today = new Date()) {
  const rows = results.map((r) => scoreResult(r, today)).filter((r) => r.age >= 0).sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = rows.reduce((a, r) => a + r.total, 0);
  return { total: Math.round(total * 10) / 10, rows };
}

// ---------- Демо-турниры сезона (даты — относительно сегодняшнего дня) ----------
const T = (id, level, ago, name) => ({ id, level, ago, name });
export const DEMO_TOURNAMENTS = [
  T('city1', 'city', 330, { tk: 'Şäher birinjiligi', ru: 'Первенство города', en: 'City championship' }),
  T('wel1', 'welayat', 300, { tk: 'Welaýat birinjiligi', ru: 'Первенство велаята', en: 'Provincial championship' }),
  T('nat1', 'national', 265, { tk: 'Türkmenistanyň çempionaty', ru: 'Чемпионат Туркменистана', en: 'Turkmenistan championship' }),
  T('intl1', 'intl', 200, { tk: 'Halkara ýaryş, Daşkent', ru: 'Международный турнир, Ташкент', en: 'International tournament, Tashkent' }),
  T('wel2', 'welayat', 150, { tk: 'Welaýat kubogy', ru: 'Кубок велаята', en: 'Provincial cup' }),
  T('nat2', 'national', 110, { tk: 'Türkmenistanyň kubogy', ru: 'Кубок Туркменистана', en: 'Turkmenistan cup' }),
  T('major1', 'major', 75, { tk: 'Aziýa çempionaty (ýaşlar)', ru: 'Чемпионат Азии (юниоры)', en: 'Asian championships (juniors)' }),
  T('intl2', 'intl', 45, { tk: 'Halkara ýaryş, Almaty', ru: 'Международный турнир, Алматы', en: 'International tournament, Almaty' }),
  T('city2', 'city', 20, { tk: 'Şäher kubogy', ru: 'Кубок города', en: 'City cup' }),
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Результаты спортсмена: чем выше «сила» (0–1), тем чаще высокие места и выше уровень турниров
export function demoResults(seedId, strength, today = new Date()) {
  let seed = [...seedId].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 233280;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const out = [];
  for (const tm of DEMO_TOURNAMENTS) {
    const reach = { city: 0.55, welayat: 0.75, national: 0.85, intl: 0.6, major: 0.25 }[tm.level];
    if (rnd() > reach * (0.5 + strength * 0.7)) continue; // не все едут на все турниры
    if ((tm.level === 'major' && strength < 0.7) || (tm.level === 'intl' && strength < 0.35)) continue;
    const hard = { city: 0.1, welayat: 0.25, national: 0.45, intl: 0.6, major: 0.8 }[tm.level];
    const q = strength - hard + (rnd() - 0.5) * 0.3;
    const place = q > 0.45 ? 1 : q > 0.3 ? 2 : q > 0.15 ? 3 : q > 0 ? 5 : q > -0.15 ? 7 : 0;
    const early = place && place <= 3 ? Math.floor(rnd() * (place === 1 ? 3 : 2)) : 0;
    const d = new Date(today); d.setDate(d.getDate() - tm.ago - Math.floor(rnd() * 3));
    out.push({ tournament: tm.id, name: tm.name, level: tm.level, date: iso(d), place, early, demo: true });
  }
  return out;
}
