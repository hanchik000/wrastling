// Запись тренировки: тип, длительность, интенсивность, самочувствие, показатели.
import { t } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { addTraining, uid } from '../store.js';
import { TYPES, METRICS, typeIcon, iso } from '../training-lib.js';

const MOODS = ['😣', '😕', '😐', '🙂', '😄'];
const DURATIONS = [30, 45, 60, 90, 120];

export default function trainingNew({ user, go }) {
  if (!user?.profile) return { redirect: '/login?next=/training/new' };
  const today = iso(new Date());
  let type = 'mat', minutes = 60, mood = 4;

  const html = `
  <section class="container section-tight narrow" style="padding-bottom:var(--s-16)">
    <a class="btn btn-quiet" href="#/training">${icon.back}${esc(t('train.title'))}</a>
    <h1 class="display mt-4" style="font-size:var(--fs-h2)">${esc(t('train.add'))}</h1>
    <form class="stack mt-6" data-form novalidate>
      <div class="field"><label for="date">${esc(t('train.date'))}</label><input id="date" type="date" class="input" value="${today}" max="${today}"></div>

      <div class="field"><span class="label">${esc(t('train.type'))}</span>
        <div class="ttypes" role="radiogroup">${TYPES.map((ty) => `<button type="button" role="radio" data-type="${ty.id}" aria-checked="${ty.id === type}">${typeIcon(ty.id)}<span>${esc(t('train.type_' + ty.id))}</span></button>`).join('')}</div>
      </div>

      <div class="field"><span class="label">${esc(t('train.duration'))}</span>
        <div class="chips">${DURATIONS.map((d) => `<button type="button" class="chip" data-min="${d}" aria-pressed="${d === minutes}">${d} ${esc(t('unit.min'))}</button>`).join('')}</div>
        <input id="minutes" class="input num mt-2" inputmode="numeric" value="${minutes}" aria-label="${esc(t('train.duration'))}" style="max-width:160px">
      </div>

      <div class="field">
        <label for="rpe">${esc(t('train.rpe'))}: <b class="num" data-rpe-out>6</b>/10 · <span data-rpe-word class="muted"></span></label>
        <input id="rpe" type="range" min="1" max="10" value="6" class="range">
        <span class="hint">${esc(t('train.rpe_help'))}</span>
      </div>

      <div class="field"><span class="label">${esc(t('train.mood'))}</span>
        <div class="moods" role="radiogroup">${MOODS.map((m, i) => `<button type="button" role="radio" data-mood="${i + 1}" aria-checked="${i + 1 === mood}" aria-label="${i + 1}/5">${m}</button>`).join('')}</div>
      </div>

      <details class="panel-flat" style="padding:var(--s-4)">
        <summary style="cursor:pointer;font-weight:600">${esc(t('train.metrics'))} <span class="muted" style="font-weight:400">(${esc(t('form.optional'))})</span></summary>
        <div class="form-grid two mt-4">${METRICS.map((m) => `
          <div class="field"><label for="m-${m.id}">${esc(t('train.m_' + m.id))}${m.unit ? ', ' + esc(t(m.unit)) : ''}</label><input id="m-${m.id}" class="input num" inputmode="decimal" placeholder="${esc(t('train.ph_' + m.id))}"></div>`).join('')}
        </div>
      </details>

      <div class="field"><label for="notes">${esc(t('train.notes'))}</label><textarea id="notes" class="input" placeholder="${esc(t('train.notes_ph'))}"></textarea></div>
      <button class="btn btn-gold btn-block" type="submit">${esc(t('train.save'))}</button>
    </form>
  </section>`;

  return {
    html,
    title: t('train.add'),
    mount(root) {
      const minInput = root.querySelector('#minutes');
      root.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
        type = b.dataset.type;
        root.querySelectorAll('[data-type]').forEach((z) => z.setAttribute('aria-checked', z === b));
      }));
      root.querySelectorAll('[data-min]').forEach((b) => b.addEventListener('click', () => {
        minutes = +b.dataset.min; minInput.value = minutes;
        root.querySelectorAll('[data-min]').forEach((z) => z.setAttribute('aria-pressed', z === b));
      }));
      minInput.addEventListener('input', () => root.querySelectorAll('[data-min]').forEach((z) => z.setAttribute('aria-pressed', +z.dataset.min === +minInput.value)));
      const rpe = root.querySelector('#rpe');
      const syncRpe = () => {
        root.querySelector('[data-rpe-out]').textContent = rpe.value;
        root.querySelector('[data-rpe-word]').textContent = t('train.rpe_' + (rpe.value <= 3 ? 'easy' : rpe.value <= 6 ? 'mid' : rpe.value <= 8 ? 'hard' : 'max'));
      };
      rpe.addEventListener('input', syncRpe); syncRpe();
      root.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => {
        mood = +b.dataset.mood;
        root.querySelectorAll('[data-mood]').forEach((z) => z.setAttribute('aria-checked', z === b));
      }));
      root.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const mins = parseInt(minInput.value, 10);
        if (!(mins >= 5 && mins <= 300)) { toast(t('train.err_minutes'), 'error'); minInput.focus(); return; }
        const rec = { id: uid('t'), date: root.querySelector('#date').value || iso(new Date()), type, minutes: mins, rpe: +rpe.value, mood, notes: root.querySelector('#notes').value.trim() };
        for (const m of METRICS) {
          const v = root.querySelector('#m-' + m.id).value.replace(',', '.').trim();
          if (v !== '' && !Number.isNaN(+v)) rec[m.id] = +v;
        }
        addTraining(rec);
        toast(t('train.saved'));
        go('/training');
      });
    },
  };
}
