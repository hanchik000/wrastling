// Дневник питания: запись приёмов пищи, оценка калорий и белка, разбор каждого приёма и выводы за день и неделю.
// Цифры — приблизительные, на обычную порцию; достаточно, чтобы видеть картину и давать советы.
import { FOODS, foodById, pick } from './assistant.js';
import { load, save } from './store.js';
import { iso, addDays } from './training-lib.js';

const T3 = (tk, ru, en) => ({ tk, ru, en });
// [ккал, белок г] на обычную порцию
export const PORTION = {
  chicken: [250, 30], beef: [280, 28], fish: [220, 25], eggs: [150, 12], gatyk: [120, 6], suzme: [180, 18], milk: [130, 7], mash: [250, 15],
  buckwheat: [220, 8], rice: [260, 5], oats: [250, 8], bread: [250, 8], pasta: [320, 11], potato: [200, 4], veg: [60, 2], melon: [80, 1], fruit: [90, 1],
  dried: [150, 2], nuts: [180, 5], honey: [60, 0], chorba: [250, 12], tea: [5, 0], manty: [480, 20], palaw: [650, 20], dograma: [550, 25], fried: [400, 10],
  sweets: [350, 4], sausage: [300, 11], fastfood: [600, 25], soda: [200, 0], energy: [220, 0], chips: [300, 4], burners: [0, 0],
};
export const SIZES = { s: 0.6, m: 1, l: 1.5 };
export const SLOTS = [
  { id: 'breakfast', name: T3('Ertirlik', 'Завтрак', 'Breakfast'), emoji: '🌅' },
  { id: 'lunch', name: T3('Günortan', 'Обед', 'Lunch'), emoji: '☀️' },
  { id: 'pre', name: T3('Türgenleşikden öň', 'Перед тренировкой', 'Before training'), emoji: '⚡' },
  { id: 'post', name: T3('Türgenleşikden soň', 'После тренировки', 'After training'), emoji: '💪' },
  { id: 'dinner', name: T3('Agşamlyk', 'Ужин', 'Dinner'), emoji: '🌙' },
  { id: 'snack', name: T3('Arakesme', 'Перекус', 'Snack'), emoji: '🍎' },
];
export const slotById = (id) => SLOTS.find((s) => s.id === id);
// Порядок слотов совпадает с порядком приёмов пищи в плане помощника
export const PLAN_SLOTS = ['breakfast', 'lunch', 'pre', 'post', 'dinner'];

export const getMeals = () => load('meals', []);
export function addMeal(m) { const l = getMeals(); l.unshift(m); save('meals', l.slice(0, 400)); }
export const mealsOn = (date) => getMeals().filter((m) => m.date === date);

// Найти продукты в свободном тексте: «съел плов и выпил колу»
export function parseFoods(text) {
  const s = ' ' + text.toLowerCase().replace(/ё/g, 'е').replace(/[.,!?;:()«»"]/g, ' ') + ' ';
  return FOODS.filter((f) => f.syn.some((w) => s.includes(w))).map((f) => f.id);
}

export function mealTotals(m) {
  const k = SIZES[m.size || 'm'];
  return m.items.reduce((a, id) => { const p = PORTION[id] || [0, 0]; return { kcal: a.kcal + p[0] * k, protein: a.protein + p[1] * k }; }, { kcal: 0, protein: 0 });
}

// Быстрый разбор одного приёма пищи: что хорошо, что исправить
export function judgeMeal(m, P, profile) {
  const out = [];
  const foods = m.items.map(foodById).filter(Boolean);
  const allergies = profile.health?.allergies || [];
  const bad = foods.filter((f) => (f.all || []).some((a) => allergies.includes(a)));
  if (bad.length) out.push({ tone: 'bad', text: T3(`${bad.map((f) => pick(f.name, 'tk')).join(', ')} — saňa bolmaýar (allergiýa).`, `${bad.map((f) => pick(f.name, 'ru')).join(', ')} — тебе нельзя (аллергия).`, `${bad.map((f) => pick(f.name, 'en')).join(', ')} — not for you (allergy).`) });
  const avoid = foods.filter((f) => f.status === 'avoid');
  avoid.forEach((f) => out.push({ tone: 'bad', text: f.why }));
  const t = mealTotals(m);
  const hasProtein = foods.some((f) => ['protein', 'dairy'].includes(f.g) || f.id === 'chorba' || f.id === 'dograma');
  const heavy = foods.filter((f) => ['palaw', 'fried', 'fastfood', 'dograma', 'manty'].includes(f.id));
  if (m.slot === 'pre' && heavy.length) out.push({ tone: 'warn', text: T3('Türgenleşikden öň agyr nahar — garyn agyrlaşar. Indiki gezek banan ýa-da çörek bal bilen.', 'Тяжёлая еда перед тренировкой — будет тяжело. В следующий раз лучше банан или хлеб с мёдом.', 'Heavy food before training will sit badly. Next time try a banana or bread with honey.') });
  if (['post', 'lunch', 'dinner'].includes(m.slot) && !hasProtein) out.push({ tone: 'warn', text: T3('Belok ýok — towuk, ýumurtga, süzme ýa-da mäş goş.', 'Не хватает белка — добавь курицу, яйца, творог или маш.', 'No protein — add chicken, eggs, cottage cheese or mung beans.') });
  if (m.slot === 'breakfast' && t.kcal < 250) out.push({ tone: 'warn', text: T3('Ertirlik az — güýç ýetmez. Süle bulamaç ýa-da ýumurtga goş.', 'Маловато для завтрака — сил не хватит. Добавь кашу или яйца.', 'A small breakfast — add oatmeal or eggs.') });
  const limits = foods.filter((f) => f.status === 'limit' && !(m.slot === 'pre' && heavy.includes(f)));
  limits.forEach((f) => out.push({ tone: 'warn', text: f.why }));
  if (!out.length) out.push({ tone: 'good', text: T3('Gowy nahar! Dowam et 👍', 'Хороший приём пищи! Так держать 👍', 'Good meal! Keep it up 👍') });
  if (hasProtein && !out.some((x) => x.tone === 'bad') && out[0].tone !== 'good') out.unshift({ tone: 'good', text: T3('Belok bar ✅', 'Белок есть ✅', 'Protein ✅') });
  return { ...t, notes: out };
}

// Итоги дня
export function dayStats(date, P) {
  const ms = mealsOn(date);
  const t = ms.reduce((a, m) => { const x = mealTotals(m); return { kcal: a.kcal + x.kcal, protein: a.protein + x.protein }; }, { kcal: 0, protein: 0 });
  const items = ms.flatMap((m) => m.items);
  return { meals: ms, kcal: Math.round(t.kcal), protein: Math.round(t.protein), items, slots: new Set(ms.filter((m) => !m.skipped).map((m) => m.slot)), skipped: ms.filter((m) => m.skipped).map((m) => m.slot), kcalPct: P.kcal ? t.kcal / P.kcal : null, proteinPct: t.protein / P.protein };
}

// Выводы за неделю: повторяющиеся привычки
export function weekInsights(P, profile, today = new Date()) {
  const days = Array.from({ length: 7 }, (_, i) => iso(addDays(today, -i)));
  const logged = days.filter((d) => mealsOn(d).length);
  const out = [];
  if (logged.length < 2) return { logged: logged.length, notes: out };
  const noBreakfast = logged.filter((d) => !mealsOn(d).some((m) => m.slot === 'breakfast' && !m.skipped)).length;
  if (noBreakfast >= 2) out.push({ tone: 'warn', text: T3(`${logged.length} günden ${noBreakfast}-sinde ertirlik ýok — güýç irden gelýär.`, `Без завтрака: ${noBreakfast} из ${logged.length} дн. — а энергия на тренировку берётся с утра.`, `No breakfast on ${noBreakfast} of ${logged.length} days — energy for training starts in the morning.`) });
  const count = (ids) => logged.reduce((a, d) => a + mealsOn(d).flatMap((m) => m.items).filter((x) => ids.includes(x)).length, 0);
  const sweets = count(['sweets', 'soda', 'chips']);
  if (sweets >= 4) out.push({ tone: 'warn', text: T3(`Hepdede ${sweets} gezek süýji/gazly/çips — 2 gezege çenli azalt.`, `Сладкое, газировка или чипсы за неделю: ${sweets}× — сократи до 2.`, `${sweets} times sweets, soda or crisps this week — cut to 2.`) });
  const fried = count(['fried', 'fastfood', 'palaw', 'manty']);
  if (fried >= 4) out.push({ tone: 'warn', text: T3(`Ýagly nahar ${fried} gezek — hepdede 2 gezek ýeterlik.`, `Жирная еда за неделю: ${fried}× — достаточно двух.`, `Fatty food ${fried} times — twice a week is enough.`) });
  if (count(['energy']) > 0) out.push({ tone: 'bad', text: T3('Energetik içildi — muny aýyr.', 'Были энергетики — их нужно убрать.', 'Energy drinks logged — drop them.') });
  const lowProt = logged.filter((d) => dayStats(d, P).proteinPct < 0.7).length;
  if (lowProt >= 2) out.push({ tone: 'warn', text: T3(`${lowProt} gün belok az boldy (gerek: ${P.protein} g).`, `Дней с недостатком белка: ${lowProt} (нужно ${P.protein} г в день).`, `Protein was low on ${lowProt} days (target ${P.protein} g).`) });
  const good = logged.filter((d) => { const s = dayStats(d, P); return s.proteinPct >= 0.9 && s.slots.size >= 3; }).length;
  if (good >= 3) out.push({ tone: 'good', text: T3(`${good} gün doly we deňagramly iýmit — berekella!`, `Дней с полноценным питанием: ${good} — отлично!`, `${good} days of balanced eating — great!`) });
  return { logged: logged.length, notes: out };
}

// Демо: неделя записей питания, чтобы показать выводы
export function demoMeals(today = new Date()) {
  const plan = [
    ['breakfast', ['oats', 'eggs', 'tea']], ['lunch', ['chorba', 'bread', 'veg']], ['pre', ['fruit']], ['post', ['chicken', 'rice']], ['dinner', ['palaw', 'tea']],
  ];
  const out = [];
  for (let i = 1; i <= 6; i++) {
    const date = iso(addDays(today, -i));
    plan.forEach(([slot, items], k) => {
      if (slot === 'breakfast' && i % 3 === 0) return out.push({ id: `dm${i}${k}`, date, slot, items: [], skipped: true, demo: true });
      let it = items;
      if (slot === 'dinner' && i % 2) it = ['beef', 'buckwheat', 'veg'];
      if (slot === 'pre' && i === 2) it = ['sweets', 'soda'];
      if (slot === 'lunch' && i === 4) it = ['fastfood', 'soda'];
      out.push({ id: `dm${i}${k}`, date, slot, items: it, size: 'm', demo: true, at: `${date}T12:00:00` });
    });
  }
  return out;
}
