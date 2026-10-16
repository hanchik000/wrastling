// Окно «Что ты ел?»: продукты в один тап, размер порции, свободный текст. После сохранения — разбор Champ AI.
import { t, getLang } from './i18n.js';
import { esc, sheet } from './ui.js';
import { getUser, getTrainings, getPains, coachDirective, uid } from './store.js';
import { FOODS, FOOD_EMOJI, pick, plan as makePlan } from './assistant.js';
import { SLOTS, PLAN_SLOTS, addMeal, parseFoods, judgeMeal, slotById } from './nutrition.js';
import { iso } from './training-lib.js';

const FIRST = {
  breakfast: ['oats', 'eggs', 'gatyk', 'bread', 'tea', 'fruit', 'suzme', 'honey'],
  lunch: ['chorba', 'rice', 'chicken', 'beef', 'veg', 'bread', 'palaw', 'dograma'],
  pre: ['fruit', 'bread', 'honey', 'dried', 'nuts', 'gatyk'],
  post: ['chicken', 'rice', 'suzme', 'eggs', 'fruit', 'buckwheat', 'gatyk'],
  dinner: ['beef', 'buckwheat', 'veg', 'fish', 'potato', 'chicken', 'palaw', 'manty'],
  snack: ['fruit', 'nuts', 'dried', 'gatyk', 'sweets', 'chips', 'soda'],
};

// Какой приём пищи сейчас: ближайший прошедший по плану
export function currentSlot(P) {
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const toH = (s) => { const [h, m] = s.split(':').map(Number); return h + m / 60; };
  let idx = 0;
  P.meals.forEach((m, i) => { if (toH(m.at) <= nowH + 0.25) idx = i; });
  return PLAN_SLOTS[idx] || 'snack';
}

export function openMealLog({ slot, onSaved } = {}) {
  const u = getUser();
  if (!u?.profile) return;
  const lang = getLang();
  const L = (o) => pick(o, lang);
  const P = makePlan(u.profile, getTrainings(), getPains(), new Date(), coachDirective('me'));
  let cur = slot || currentSlot(P);
  let size = 'm';
  const picked = new Set();
  const list = () => {
    const first = FIRST[cur] || [];
    return [...first.map((id) => FOODS.find((f) => f.id === id)), ...FOODS.filter((f) => !first.includes(f.id) && f.id !== 'burners')].filter(Boolean);
  };

  sheet(`<div data-ml></div>`, (panel, close) => {
    const host = panel.querySelector('[data-ml]');
    const draw = () => {
      host.innerHTML = `
        <h3>${esc(t('food.what_ate'))}</h3>
        <div class="chips mt-3" style="flex-wrap:wrap">${SLOTS.map((s) => `<button class="chip" data-slot="${s.id}" aria-pressed="${s.id === cur}">${s.emoji} ${esc(L(s.name))}</button>`).join('')}</div>
        <input class="input mt-4" data-free placeholder="${esc(t('food.free_ph'))}" autocomplete="off">
        <div class="ftiles mt-3">${list().map((f) => `<button class="ftile ${f.status} ${picked.has(f.id) ? 'on' : ''}" data-f="${f.id}" aria-pressed="${picked.has(f.id)}"><i>${FOOD_EMOJI[f.id] || '🍽'}</i><span>${esc(L(f.name).split(/[:(]/)[0].trim())}</span></button>`).join('')}</div>
        <div class="field mt-4"><span class="label">${esc(t('food.portion'))}</span><div class="chips">${['s', 'm', 'l'].map((k) => `<button class="chip" data-size="${k}" aria-pressed="${k === size}">${esc(t('food.size_' + k))}</button>`).join('')}</div></div>
        <div class="stack mt-6">
          <button class="btn btn-gold btn-block" data-save>${esc(t('food.save'))}</button>
          <button class="btn btn-quiet btn-block" data-skip>${esc(t('food.skipped'))}</button>
        </div>`;
      host.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.slot; draw(); }));
      host.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => { size = b.dataset.size; host.querySelectorAll('[data-size]').forEach((z) => z.setAttribute('aria-pressed', z === b)); }));
      host.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.f; picked.has(id) ? picked.delete(id) : picked.add(id);
        b.classList.toggle('on', picked.has(id)); b.setAttribute('aria-pressed', picked.has(id));
      }));
      const free = host.querySelector('[data-free]');
      free.addEventListener('input', () => {
        parseFoods(free.value).forEach((id) => picked.add(id));
        host.querySelectorAll('[data-f]').forEach((b) => { b.classList.toggle('on', picked.has(b.dataset.f)); b.setAttribute('aria-pressed', picked.has(b.dataset.f)); });
      });
      host.querySelector('[data-save]').addEventListener('click', () => {
        if (!picked.size) { free.focus(); free.placeholder = t('food.pick_one'); return; }
        save({ items: [...picked], size, text: free.value.trim() });
      });
      host.querySelector('[data-skip]').addEventListener('click', () => save({ items: [], skipped: true }));
    };
    const save = (extra) => {
      const m = { id: uid('ml'), date: iso(new Date()), slot: cur, at: new Date().toISOString(), size: 'm', ...extra };
      addMeal(m);
      const j = m.skipped ? null : judgeMeal(m, P, u.profile);
      host.innerHTML = `
        <p class="eyebrow">Champ AI</p>
        <h3 class="mt-2">${slotById(cur).emoji} ${esc(L(slotById(cur).name))}</h3>
        ${j ? `<div class="meal-sum mt-4"><div><b class="num">${Math.round(j.kcal)}</b><span>${esc(t('dost.kcal').split(' ')[0])}</span></div><div><b class="num">${Math.round(j.protein)}</b><span>${esc(t('dost.protein'))}, ${esc(t('dost.g'))}</span></div></div>
          <ul class="verdicts mt-4">${j.notes.map((n) => `<li class="${n.tone}">${esc(L(n.text))}</li>`).join('')}</ul>`
          : `<p class="mt-4">${esc(t(cur === 'breakfast' ? 'food.skip_breakfast' : 'food.skip_note'))}</p>`}
        <button class="btn btn-gold btn-block mt-6" data-close>${esc(t('food.ok'))}</button>`;
      host.querySelector('[data-close]').addEventListener('click', close);
      onSaved?.(m, j);
    };
    draw();
  });
}
