// Кабинет ученика глазами тренера: состояние сегодня (по данным Champ AI), нагрузка, прогресс,
// тренировки с камерой, дневник боли и заметки тренера.
import { t, tr, fmtNum, fmtDate, getLang } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { styleName, regionName } from '../data.js';
import { getStudent } from '../students.js';
import { weekly, heatmap, series, METRICS, load as sLoad } from '../training-lib.js';
import { barsChart, lineChart, heatGrid, bindTips, setsLine, moodFace } from './training.js';
import { trainingText, pick, areaById, PAIN_KINDS, RED_FLAGS, exName } from '../assistant.js';
import { load, save, addCoachMsg, getCoachMsgs } from '../store.js';
import { readinessGol } from '../dost-ui.js';
import { weekInsights, dayStats } from '../nutrition.js';
import { iso } from '../training-lib.js';

export default function coachAthlete({ params, user }) {
  if (!user?.profile) return { redirect: '/login?next=/coach' };
  const s = getStudent(params.id);
  if (!s) return { redirect: '/coach' };
  const lang = getLang();
  const a = s.athlete, P = s.plan, sm = s.sm;
  let metric = 'pullups';
  const lvCls = { normal: 'ok', light: 'warn', rest: 'info', doctor: 'bad', stop: 'bad' }[P.level];
  const cams = s.trainings.filter((x) => x.camera).slice(0, 6);
  const notes = load('coachnotes', {});

  const html = `
  <section class="container section-tight" style="padding-bottom:var(--s-16)">
    <a class="btn btn-quiet" href="#/coach">${icon.back}${esc(t('coach.eyebrow'))}</a>
    <div class="ca-head mt-4">
      <div class="avatar">${esc((a.name || '?')[0])}</div>
      <div class="grow">
        <p class="eyebrow">${esc(t('coach.student_card'))}${s.demo ? ` · <span class="badge badge-demo">${esc(t('common.demo'))}</span>` : s.me ? ` · <span class="badge badge-gold">${esc(t('coach.this_device'))}</span>` : ''}</p>
        <h1 class="display mt-2" style="font-size:var(--fs-h2)">${esc(a.name)}</h1>
        <p class="muted mt-1">${P.age != null ? P.age + ' ' + esc(t('unit.years')) + ' · ' : ''}${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))}${a.region ? ' · ' + esc(tr(regionName(a.region))) : ''}</p>
      </div>
      ${readinessGol(s.ready.score, s.ready.zone, t('me.readiness'), t('me.zone_' + s.ready.zone))}
    </div>
    <div class="row row-wrap mt-4" style="gap:8px">
      <button class="btn btn-gold btn-sm" data-act="light">${esc(t('coach.a_light'))}</button>
      <button class="btn btn-danger btn-sm" data-act="doctor">${esc(t('coach.a_doctor'))}</button>
      <button class="btn btn-ghost btn-sm" data-act="msg">${icon.chat}${esc(t('coach.a_msg'))}</button>
      ${s.demo ? `<a class="btn btn-quiet btn-sm" href="#/athlete/${s.id}">${icon.trophy}${esc(t('ath.open'))}</a>` : ''}
    </div>
    <div data-msgs></div>

    <div class="grid-2 mt-6" style="align-items:start">
      <article class="panel dost-train ${lvCls}">
        <p class="eyebrow">${esc(t('coach.today_by_dost'))}</p>
        <div class="dost-pre mt-3">${esc(trainingText(P, lang))}</div>
      </article>
      <article class="panel">
        <p class="eyebrow">${esc(t('coach.pains'))}</p>
        ${s.pains.length ? `<div class="list mt-3">${s.pains.slice(0, 5).map((p) => `
          <div class="list-row ${p.resolved ? 'muted' : ''}"><span class="pdot" style="background:${p.level >= 7 ? '#e23b3b' : p.level >= 4 ? '#e8a21d' : '#27b663'}"></span>
            <span class="grow"><b>${esc(pick(areaById(p.area).name, lang))} — ${p.level}/10</b>
            <span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(p.date, { day: 'numeric', month: 'long' }))} · ${esc(pick(PAIN_KINDS.find((k) => k.id === p.kind)?.name, lang))}${(p.flags || []).length ? ' · ⚠️ ' + p.flags.map((f) => esc(pick(RED_FLAGS.find((x) => x.id === f).name, lang))).join(', ') : ''}${p.note ? ' · «' + esc(p.note) + '»' : ''}</span></span>
            ${p.resolved ? `<span class="badge">${esc(t('dost.pain_gone'))}</span>` : ''}</div>`).join('')}</div>` : `<p class="muted mt-3">${esc(t('coach.no_pains'))}</p>`}
      </article>
    </div>

    <div class="ttiles mt-6">
      <div class="ttile"><span class="k">${esc(t('train.k_sessions'))}</span><b class="num">${sm.sessions}</b><span class="s">${esc(t('train.last7'))}</span></div>
      <div class="ttile"><span class="k">${esc(t('train.k_minutes'))}</span><b class="num">${sm.minutes}</b><span class="s">${esc(t('train.last7'))}</span></div>
      <div class="ttile accent"><span class="k">${esc(t('train.k_load'))}</span><b class="num">${sm.load}</b><span class="s">${sm.acwr != null ? 'ACWR ' + fmtNum(sm.acwr, 2) : esc(t('train.last7'))}</span></div>
      <div class="ttile"><span class="k">${esc(t('train.k_rpe'))}</span><b class="num">${sm.rpe != null ? fmtNum(sm.rpe, 1) : '—'}<small>/10</small></b><span class="s">${esc(t('train.rpe_hint'))}</span></div>
      <div class="ttile"><span class="k">${esc(t('train.k_mood'))}</span><b>${sm.mood != null ? moodFace(sm.mood) : '—'}</b><span class="s">${sm.mood != null ? fmtNum(sm.mood, 1) + ' / 5' : ''}</span></div>
    </div>

    <div class="grid-2 mt-6" style="align-items:start">
      <div class="panel"><h2 class="eyebrow mb-3">${esc(t('train.chart_load'))}</h2><div data-bars></div></div>
      <div class="panel"><h2 class="eyebrow mb-3">${esc(t('train.calendar'))}</h2>${heatGrid(heatmap(s.trainings, 12))}</div>
    </div>

    <div class="panel mt-6">
      <div class="row row-wrap between mb-4"><h2 class="eyebrow">${esc(t('train.progress'))}</h2>
        <div class="chips">${METRICS.map((m) => `<button class="chip" data-metric="${m.id}" aria-pressed="${m.id === metric}">${esc(t('train.m_' + m.id))}</button>`).join('')}</div></div>
      <div data-line></div>
    </div>

    <h2 class="eyebrow mt-10 mb-4">${esc(t('coach.camera_sessions'))}</h2>
    ${cams.length ? `<div class="list">${cams.map((x) => `
      <div class="list-row"><span class="ticon">${icon.live}</span>
        <span class="grow"><b>${esc(fmtDate(x.date, { weekday: 'short', day: 'numeric', month: 'long' }))}</b>
        <span class="tsets" style="margin-top:2px">${esc(setsLine(x.sets || []))}</span></span>
        <b class="num tload">${sLoad(x)}</b></div>`).join('')}</div>` : `<p class="muted">${esc(t('coach.no_camera'))}</p>`}

    <div class="grid-2 mt-10" style="align-items:start">
      <div class="panel">
        <p class="eyebrow">${esc(t('coach.nutrition'))}</p>
        <div class="kv mt-3" style="grid-template-columns:repeat(2,1fr)">
          <div><span>${esc(t('dost.water_t'))}</span><b class="num">${fmtNum(P.water / 1000, 1)} ${esc(t('coach.l'))}</b></div>
          <div><span>${esc(t('dost.kcal'))}</span><b class="num">${P.kcal ?? '—'}</b></div>
          <div><span>${esc(t('dost.protein'))}</span><b class="num">${P.protein} ${esc(t('dost.g'))}</b></div>
          <div><span>${esc(t('dost.carbs'))}</span><b class="num">${P.carbs ?? '—'} ${esc(t('dost.g'))}</b></div>
        </div>
        ${P.avoid.length ? `<p class="mt-4" style="font-size:var(--fs-small)"><b>${esc(t('dost.skip'))}</b> ${esc(P.avoid.map((x) => exName(x, lang)).join(', '))}</p>` : ''}
        ${s.me ? (() => { const w = weekInsights(P, s.profile); const d = dayStats(iso(new Date()), P); return `<p class="eyebrow mt-6">${esc(t('food.today'))}: ${d.kcal} ${esc(t('dost.kcal').split(' ')[0])}, ${esc(t('dost.protein').toLowerCase())} ${d.protein} ${esc(t('dost.g'))}</p>${w.notes.length ? `<ul class="verdicts mt-2">${w.notes.map((n) => `<li class="${n.tone}">${esc(pick(n.text, lang))}</li>`).join('')}</ul>` : ''}`; })() : ''}
      </div>
      <form class="panel" data-note>
        <label class="eyebrow" for="cnote">${esc(t('coach.note'))}</label>
        <textarea id="cnote" class="input mt-3" rows="4" placeholder="${esc(t('coach.note_ph'))}">${esc(notes[s.id] || '')}</textarea>
        <button class="btn btn-gold mt-3" type="submit">${esc(t('dost.data_save'))}</button>
      </form>
    </div>
  </section>`;

  return {
    html,
    title: a.name,
    mount(root) {
      const nm = (a.name || '').split(' ')[0];
      const drawMsgs = () => {
        const ms = getCoachMsgs(s.id);
        root.querySelector('[data-msgs]').innerHTML = ms.length ? `<div class="msg-hist mt-4"><p class="eyebrow">${esc(t('coach.history'))}</p>${ms.slice(0, 4).map((m) => `<div class="mh"><span class="badge ${m.kind === 'doctor' ? 'badge-red' : m.kind === 'light' ? 'badge-warn' : ''}">${esc(t('coach.st_' + m.kind))}</span><span>${esc(m.text)}</span><small>${esc(fmtDate(m.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}${m.read ? ' · ✓ ' + esc(t('coach.read')) : ''}</small></div>`).join('')}</div>` : '';
      };
      drawMsgs();
      root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const kind = b.dataset.act;
        if (kind === 'msg') {
          const text = prompt(t('coach.write_to', { n: a.name }), t('coach.t_how', { n: nm }));
          if (!text) return;
          addCoachMsg({ to: s.id, kind: 'msg', text });
        } else {
          addCoachMsg({ to: s.id, kind, text: t(kind === 'doctor' ? 'coach.t_doctor' : 'coach.t_light', { n: nm }) });
        }
        toast(t(kind === 'doctor' ? 'coach.done_doctor' : kind === 'light' ? 'coach.done_light' : 'coach.sent', { n: nm }));
        drawMsgs();
      }));
      const chartW = (host) => Math.round(Math.max(300, Math.min(640, (host.clientWidth || 640) - 10)));
      const bars = root.querySelector('[data-bars]');
      bars.innerHTML = barsChart(weekly(s.trainings, 8), chartW(bars));
      const line = root.querySelector('[data-line]');
      const drawLine = () => { line.innerHTML = lineChart(series(s.trainings, metric), metric, Math.round(Math.max(300, Math.min(1200, line.clientWidth - 10)))); bindTips(root); };
      drawLine();
      root.querySelectorAll('[data-metric]').forEach((b) => b.addEventListener('click', () => {
        metric = b.dataset.metric;
        root.querySelectorAll('[data-metric]').forEach((z) => z.setAttribute('aria-pressed', z === b));
        drawLine();
      }));
      root.querySelector('[data-note]').addEventListener('submit', (e) => {
        e.preventDefault();
        const n = load('coachnotes', {}); n[s.id] = root.querySelector('#cnote').value.trim(); save('coachnotes', n);
        toast(t('coach.note_saved'));
      });
    },
    unmount() { document.querySelector('.ttip')?.classList.remove('on'); },
  };
}
