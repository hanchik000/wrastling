// Напоминания: вода, еда и вопрос «что ты ел?» по личному плану.
// Пока сайт открыт (или висит фоновой вкладкой) — баннер на странице и системное уведомление.
// Рассылка при закрытом браузере требует сервера push-уведомлений (рабочая версия).
import { t, getLang } from './i18n.js';
import { esc, icon, toast } from './ui.js';
import { getUser, getTrainings, getPains, coachDirective, addWater, load, save } from './store.js';
import { plan as makePlan, pick, foodById, FOOD_EMOJI } from './assistant.js';
import { PLAN_SLOTS, mealsOn, slotById } from './nutrition.js';
import { openMealLog } from './meal-log.js';
import { dostFace } from './dost-ui.js';
import { iso } from './training-lib.js';

const DEF = { on: true, sys: false, water: true, meal: true, ask: true, done: {}, snooze: {} };
export const getSettings = () => ({ ...DEF, ...load('remind', {}) });
export const saveSettings = (s) => save('remind', s);
const toH = (s) => { const [h, m] = s.split('–')[0].split(':').map(Number); return h + m / 60; };
const hhmm = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

// Расписание на сегодня
export function schedule() {
  const u = getUser();
  if (!u?.profile?.health?.height || u.role !== 'athlete') return [];
  const lang = getLang(), L = (o) => pick(o, lang);
  const P = makePlan(u.profile, getTrainings(), getPains(), new Date(), coachDirective('me'));
  const st = getSettings();
  const out = [];
  if (st.water) P.waterPlan.forEach((w) => out.push({ key: 'w:' + w.at, kind: 'water', h: toH(w.at), at: w.at.split('–')[0], ml: Math.min(w.ml, 600), title: t('rem.water_t', { ml: Math.min(w.ml, 600) }), body: L(w.note) }));
  P.meals.forEach((m, i) => {
    const slot = PLAN_SLOTS[i];
    if (st.meal) out.push({ key: 'm:' + slot, kind: 'meal', slot, h: toH(m.at), at: m.at, title: t('rem.meal_t', { m: L(m.name).split('(')[0].trim() }), body: m.what.map((id) => (FOOD_EMOJI[id] || '') + ' ' + L(foodById(id).name).split(/[:(,]/)[0]).join(' · ') });
    if (st.ask) out.push({ key: 'a:' + slot, kind: 'ask', slot, h: toH(m.at) + 0.67, at: hhmm(toH(m.at) + 0.67), title: t('rem.ask_t', { m: L(slotById(slot).name).toLowerCase() }), body: t('rem.ask_b') });
  });
  return out.sort((a, b) => a.h - b.h);
}

function isDone(st, r) {
  const today = iso(new Date());
  if ((st.done[today] || []).includes(r.key)) return true;
  if (r.kind === 'ask' && mealsOn(today).some((m) => m.slot === r.slot)) return true;
  return false;
}
function markDone(key) {
  const st = getSettings(), today = iso(new Date());
  st.done = { [today]: [...(st.done[today] || []), key] }; // храним только сегодняшний день
  saveSettings(st);
}
function snooze(key, min = 15) { const st = getSettings(); st.snooze[key] = Date.now() + min * 60000; saveSettings(st); }

// Что показать сейчас: первое просроченное (не старше 2 часов), не выполненное и не отложенное
export function due() {
  const st = getSettings();
  if (!st.on) return null;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  return schedule().find((r) => r.h <= nowH && nowH - r.h < 2 && !isDone(st, r) && !((st.snooze[r.key] || 0) > Date.now())) || null;
}

let shown = null;
function banner(r) {
  document.querySelector('.remind')?.remove();
  const el = document.createElement('div');
  el.className = 'remind ' + r.kind;
  el.setAttribute('role', 'alert');
  const main = r.kind === 'water' ? t('rem.drank', { ml: r.ml }) : r.kind === 'meal' ? t('rem.ate') : t('rem.log');
  el.innerHTML = `${dostFace('happy', 'sm')}<div class="rm-t"><b>${esc(r.title)}</b><span>${esc(r.body)}</span></div>
    <div class="rm-a"><button class="btn btn-gold btn-sm" data-yes>${esc(main)}</button><button class="btn btn-quiet btn-sm" data-later>${esc(t('rem.later'))}</button></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const hide = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); shown = null; };
  el.querySelector('[data-yes]').addEventListener('click', () => {
    markDone(r.key); hide();
    if (r.kind === 'water') { addWater(iso(new Date()), r.ml); toast(t('rem.water_ok', { ml: r.ml })); window.dispatchEvent(new Event('wt-refresh')); }
    else openMealLog({ slot: r.slot, onSaved: () => { markDone('a:' + r.slot); window.dispatchEvent(new Event('wt-refresh')); } });
  });
  el.querySelector('[data-later]').addEventListener('click', () => { snooze(r.key); hide(); });
  shown = r.key;
}

async function systemNotify(r) {
  const st = getSettings();
  if (!st.sys || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body: r.body, tag: r.key, icon: 'assets/img/icon.svg', badge: 'assets/img/icon.svg', data: { url: location.pathname + '#/me?rem=' + encodeURIComponent(r.key) } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(r.title, opts); else new Notification(r.title, opts);
  } catch {}
}

const notified = new Set();
export function tick(force) {
  if (document.documentElement.classList.contains('intro-on')) return;
  if (/^#\/(training\/live|scout\/record|login)/.test(location.hash)) return;
  const r = force || due();
  if (!r || shown === r.key) return;
  banner(r);
  if (!notified.has(r.key) && (document.hidden || force)) { notified.add(r.key); systemNotify(r); }
}

export function startReminders() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.type === 'open') location.href = e.data.url; });
  setTimeout(() => tick(), 4000);
  setInterval(() => tick(), 30000);
  // Фоновая вкладка: системное уведомление в срок
  setInterval(() => { if (document.hidden) { const r = due(); if (r && !notified.has(r.key)) { notified.add(r.key); systemNotify(r); } } }, 60000);
}

// Окно настроек напоминаний
export function remindSettingsHtml() {
  const st = getSettings();
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const list = schedule();
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  return `<h3>${esc(t('rem.title'))}</h3>
    <p class="muted mt-2" style="font-size:var(--fs-small)">${esc(t('rem.lead'))}</p>
    <div class="stack mt-4" style="gap:8px">
      ${['on', 'water', 'meal', 'ask'].map((k) => `<label class="flag okf"><input type="checkbox" data-rs="${k}" ${st[k] ? 'checked' : ''}><span>${esc(t('rem.opt_' + k))}</span></label>`).join('')}
      ${perm === 'unsupported' ? `<p class="muted" style="font-size:var(--fs-small)">${esc(t('rem.sys_unsupported'))}</p>`
        : perm === 'granted' ? `<label class="flag okf"><input type="checkbox" data-rs="sys" ${st.sys ? 'checked' : ''}><span>${esc(t('rem.opt_sys'))}</span></label>`
        : `<button class="btn btn-ghost btn-block" data-perm>${esc(t(perm === 'denied' ? 'rem.perm_denied' : 'rem.perm'))}</button>`}
    </div>
    <p class="eyebrow mt-6">${esc(t('rem.today'))}</p>
    <ol class="rlist mt-2">${list.map((r) => `<li class="${r.h < nowH ? 'past' : ''}"><b class="num">${esc(r.at)}</b><span>${esc(r.title)}</span></li>`).join('')}</ol>
    <div class="stack mt-6"><button class="btn btn-gold btn-block" data-test>${esc(t('rem.test'))}</button><button class="btn btn-quiet btn-block" data-close>${esc(t('common.close'))}</button></div>
    <p class="muted mt-3" style="font-size:var(--fs-micro)">${esc(t('rem.note'))}</p>`;
}
export function bindRemindSettings(panel, close, rerender) {
  panel.querySelectorAll('[data-rs]').forEach((c) => c.addEventListener('change', () => { const st = getSettings(); st[c.dataset.rs] = c.checked; saveSettings(st); }));
  panel.querySelector('[data-perm]')?.addEventListener('click', async () => {
    try { const p = await Notification.requestPermission(); if (p === 'granted') { const st = getSettings(); st.sys = true; saveSettings(st); } } catch {}
    rerender();
  });
  panel.querySelector('[data-test]').addEventListener('click', () => {
    close();
    const list = schedule();
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const r = list.find((x) => x.h >= nowH && x.kind === 'water') || list.find((x) => x.kind === 'ask') || list[0];
    if (r) { const st = getSettings(); delete st.snooze[r.key]; saveSettings(st); shown = null; setTimeout(() => tick(r), 400); }
  });
}
