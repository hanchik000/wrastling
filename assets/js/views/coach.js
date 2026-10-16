import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
import { TESTS, DEMO_ATHLETES, REGIONS, STYLES, AGE_GROUPS, regionName, styleName, testById } from '../data.js';
import { getResults, ageGroup } from '../store.js';
import { getStudents, attention } from '../students.js';
import { areaById, pick } from '../assistant.js';
import { getLang } from '../i18n.js';

// Демо-записи очереди без видео — чтобы показать, как выглядит загруженная очередь
const DEMO_QUEUE = [
  { id: 'dq1', demo: true, testId: 'sprawl', createdAt: '2026-10-15T09:12:00+05:00', athlete: { name: 'Kerim T.', age: 11, region: 'ahal', style: 'greco' }, reps: 21, conf: 'high' },
  { id: 'dq2', demo: true, testId: 'shot', createdAt: '2026-10-14T18:40:00+05:00', athlete: { name: 'Aýna M.', age: 10, region: 'asgabat', style: 'women' }, reps: 14, conf: 'medium' },
  { id: 'dq3', demo: true, testId: 'pullup', createdAt: '2026-10-14T16:05:00+05:00', athlete: { name: 'Begenç D.', age: 14, region: 'dasoguz', style: 'greco' }, reps: 11, conf: 'high' },
];

export default function coach({ user, query }) {
  if (!user?.profile) return { redirect: '/login?next=/coach' };
  const isCoach = user.role === 'coach';
  let fTest = 'all', fStatus = 'pending', fGroup = 'all', fRegion = 'all', fStyle = 'all';
  let pane = query.tab === 'videos' ? 'videos' : 'students';

  const html = `
  <section class="container section-tight">
    <div class="row row-wrap between">
      <div><p class="eyebrow">Wrestling Talent</p><h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(t('coach.eyebrow'))}</h1></div>
      ${demoBadge()}
    </div>
    ${!isCoach ? `<div class="notice mt-6">${icon.info}<div>${esc(t('coach.viewer_note'))}</div></div>` : ''}
    <div class="tabs mt-6" role="tablist">
      <button role="tab" data-pane-btn="students" aria-selected="${pane === 'students'}">${esc(t('coach.tab_students'))}</button>
      <button role="tab" data-pane-btn="videos" aria-selected="${pane === 'videos'}">${esc(t('coach.tab_videos'))}</button>
    </div>
  </section>
  <section class="container section-tight" style="padding-bottom:var(--s-16)" data-pane="students" ${pane === 'students' ? '' : 'hidden'}>
    <div class="kpis" id="skpis"></div>
    <div class="row row-wrap between mt-8 mb-4"><h2 class="eyebrow">${esc(t('coach.students'))}</h2><span class="muted" style="font-size:var(--fs-small)">${esc(t('coach.students_hint'))}</span></div>
    <div class="slist" id="slist"></div>
  </section>
  <section class="container" style="padding-bottom:var(--s-16)" data-pane="videos" ${pane === 'videos' ? '' : 'hidden'}>
    <div class="kpis mb-8" id="kpis"></div>
    <div class="ws-layout">
      <div>
        <div class="row between mb-4"><h2 class="eyebrow">${esc(t('coach.queue'))}</h2></div>
        <div class="chips mb-4">
          ${['pending', 'reviewed', 'all'].map((s) => `<button class="chip" data-status="${s}" aria-pressed="${s === fStatus}">${esc(t('coach.st_' + s))}</button>`).join('')}
        </div>
        <div class="row row-wrap mb-4">
          <select class="input" data-ftest style="max-width:240px" aria-label="${esc(t('coach.test'))}">
            <option value="all">${esc(t('coach.all_tests'))}</option>
            ${TESTS.map((x) => `<option value="${x.id}">${esc(tr(x.name))}</option>`).join('')}
          </select>
        </div>
        <div class="table-wrap"><table class="data"><thead><tr>
          <th>${esc(t('coach.athlete'))}</th><th>${esc(t('coach.test'))}</th><th>${esc(t('metric.reps'))}</th><th>${esc(t('result.quality'))}</th><th>${esc(t('coach.when'))}</th><th></th>
        </tr></thead><tbody id="queue"></tbody></table></div>
      </div>
      <div>
        <h2 class="eyebrow mb-4">${esc(t('coach.base'))}</h2>
        <div class="form-grid two mb-4">
          <select class="input" data-fgroup aria-label="${esc(t('coach.age_group'))}"><option value="all">${esc(t('coach.all_ages'))}</option>${AGE_GROUPS.map((g) => `<option>${g}</option>`).join('')}</select>
          <select class="input" data-fregion aria-label="${esc(t('profile.region'))}"><option value="all">${esc(t('rank.all_regions'))}</option>${REGIONS.map((r) => `<option value="${r.id}">${esc(tr(r.name))}</option>`).join('')}</select>
        </div>
        <div class="chips mb-4"><button class="chip" data-fstyle="all" aria-pressed="true">${esc(t('common.all'))}</button>${STYLES.map((s) => `<button class="chip" data-fstyle="${s.id}" aria-pressed="false">${esc(tr(s.name))}</button>`).join('')}</div>
        <div class="list" id="base"></div>
      </div>
    </div>
  </section>`;

  function rows() {
    const real = getResults().map((r) => ({ ...r, reps: r.analysis?.metrics?.reps, conf: r.quality?.confidence }));
    return [...real, ...DEMO_QUEUE]
      .filter((r) => fTest === 'all' || r.testId === fTest)
      .filter((r) => fStatus === 'all' || (fStatus === 'pending' ? r.coach?.status !== 'reviewed' : r.coach?.status === 'reviewed'));
  }

  function renderStudents(root) {
    const lang = getLang();
    const list = getStudents().map((s) => ({ ...s, att: attention(s) })).sort((a, b) => (a.me ? -1 : b.me ? 1 : b.att - a.att));
    const cam = list.reduce((n, s) => n + s.trainings.filter((x) => x.camera && (Date.now() - new Date(x.date)) / 864e5 <= 7).length, 0);
    root.querySelector('#skpis').innerHTML = [
      ['coach.k_students', list.length], ['coach.k_attention', list.filter((s) => s.att >= 2).length],
      ['coach.k_pains', list.reduce((n, s) => n + s.plan.act.length, 0)], ['coach.k_camera', cam],
    ].map(([k, v], i) => `<div class="panel-flat ${i === 1 && v ? 'kpi-alert' : ''}"><span class="eyebrow">${esc(t(k))}</span><b class="display num" style="display:block;font-size:2.6rem;margin-top:6px">${v}</b></div>`).join('');
    const stat = { normal: 'ok', light: 'warn', rest: 'info', doctor: 'bad', stop: 'bad' };
    root.querySelector('#slist').innerHTML = list.map((s) => {
      const a = s.athlete, sm = s.sm, P = s.plan;
      const delta = sm.loadPrev ? Math.round(((sm.load - sm.loadPrev) / sm.loadPrev) * 100) : null;
      const camN = s.trainings.filter((x) => x.camera).length;
      return `<a class="scard att${s.att}" href="#/coach/athlete/${s.id}">
        <div class="scard-h"><span class="avatar sm">${esc((a.name || '?')[0])}</span>
          <span class="grow"><b>${esc(a.name)}</b>${s.me ? ` <span class="badge badge-gold">${esc(t('coach.this_device'))}</span>` : s.demo ? ` <span class="badge badge-demo">${esc(t('common.demo'))}</span>` : ''}
          <small>${a.age ? a.age + ' ' + esc(t('unit.years')) + ' · ' : ''}${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))}</small></span>
          <span class="sstat ${stat[P.level]}">${esc(t('coach.lv_' + P.level))}</span></div>
        <div class="scard-m">
          <div><span>${esc(t('train.k_sessions'))}</span><b class="num">${sm.sessions}</b></div>
          <div><span>${esc(t('train.k_load'))}</span><b class="num">${sm.load}</b>${delta != null ? `<i class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'}${Math.abs(delta)}%</i>` : ''}</div>
          <div><span>RPE</span><b class="num">${sm.rpe != null ? sm.rpe.toFixed(1) : '—'}</b></div>
          <div><span>${esc(t('coach.camera'))}</span><b class="num">${camN}</b></div>
        </div>
        <div class="scard-f">
          ${P.act.map((p) => `<span class="badge ${p.level >= 7 || (p.flags || []).length ? 'badge-red' : 'badge-warn'}">⚠ ${esc(pick(areaById(p.area).name, lang))} ${p.level}/10</span>`).join('')}
          ${sm.acwr != null && sm.acwr > 1.5 ? `<span class="badge badge-warn">${esc(t('coach.spike', { r: sm.acwr.toFixed(1) }))}</span>` : ''}
          ${!P.act.length && !(sm.acwr > 1.5) ? `<span class="muted" style="font-size:var(--fs-micro)">${esc(t('coach.all_ok'))}</span>` : ''}
        </div>
      </a>`;
    }).join('');
  }

  function render(root) {
    const all = [...getResults(), ...DEMO_QUEUE];
    const pending = all.filter((r) => r.coach?.status !== 'reviewed').length;
    const reviewed = all.filter((r) => r.coach?.status === 'reviewed').length;
    const invited = all.filter((r) => r.coach?.recommendation === 'invite').length;
    root.querySelector('#kpis').innerHTML = [
      ['coach.k_pending', pending], ['coach.k_reviewed', reviewed], ['coach.k_invited', invited],
    ].map(([k, v]) => `<div class="panel-flat"><span class="eyebrow">${esc(t(k))}</span><b class="display num" style="display:block;font-size:2.6rem;margin-top:6px">${v}</b></div>`).join('');

    const list = rows();
    root.querySelector('#queue').innerHTML = list.length ? list.map((r) => `
      <tr class="clickable" data-open="${r.demo ? '' : r.id}" tabindex="0">
        <td><b>${esc(r.athlete?.name || '—')}</b><div class="muted" style="font-size:var(--fs-micro)">${r.athlete?.age ?? '—'} ${esc(t('unit.years'))} · ${esc(tr(regionName(r.athlete?.region)))}</div></td>
        <td>${esc(tr(testById(r.testId)?.name))}</td>
        <td class="num"><b>${r.reps ?? '—'}</b></td>
        <td><span class="badge ${r.conf === 'high' ? 'badge-measured' : 'badge-gold'}">${esc(t('q.' + (r.conf || 'none')))}</span></td>
        <td class="muted">${esc(fmtDate(r.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</td>
        <td>${r.demo ? `<span class="badge badge-demo">${esc(t('common.demo'))}</span>` : r.coach?.status === 'reviewed' ? `<span class="badge badge-coach">${esc(t('status.reviewed'))}</span>` : `<span class="btn btn-primary btn-sm">${esc(t('coach.review'))}</span>`}</td>
      </tr>`).join('')
      : `<tr><td colspan="6"><div class="empty">${icon.check}<h3>${esc(t('coach.queue_empty'))}</h3></div></td></tr>`;
    root.querySelectorAll('[data-open]').forEach((tr_) => {
      const open = () => { if (tr_.dataset.open) location.hash = '#/coach/review/' + tr_.dataset.open; };
      tr_.addEventListener('click', open);
      tr_.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });

    const base = DEMO_ATHLETES
      .filter((a) => fGroup === 'all' || ageGroup(a.age) === fGroup)
      .filter((a) => fRegion === 'all' || a.region === fRegion)
      .filter((a) => fStyle === 'all' || a.style === fStyle)
      .sort((a, b) => b.score - a.score);
    root.querySelector('#base').innerHTML = base.length ? base.map((a) => `
      <div class="list-row">
        <div class="avatar sm">${esc(a.name[0])}</div>
        <span class="grow"><b>${esc(a.name)}</b><span class="muted" style="display:block;font-size:var(--fs-small)">${a.age} ${esc(t('unit.years'))} · ${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))} · ${esc(tr(regionName(a.region)))}</span></span>
        <b class="num">${a.score.toFixed(1)}</b>
      </div>`).join('') : `<div class="empty"><h3>${esc(t('rank.empty'))}</h3></div>`;
  }

  return {
    html,
    title: t('coach.eyebrow'),
    mount(root) {
      render(root);
      renderStudents(root);
      root.querySelectorAll('[data-pane-btn]').forEach((b) => b.addEventListener('click', () => {
        pane = b.dataset.paneBtn;
        root.querySelectorAll('[data-pane-btn]').forEach((z) => z.setAttribute('aria-selected', z === b));
        root.querySelectorAll('[data-pane]').forEach((z) => { z.hidden = z.dataset.pane !== pane; });
      }));
      root.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', () => {
        fStatus = b.dataset.status;
        root.querySelectorAll('[data-status]').forEach((z) => z.setAttribute('aria-pressed', z === b));
        render(root);
      }));
      root.querySelector('[data-ftest]').addEventListener('change', (e) => { fTest = e.target.value; render(root); });
      root.querySelector('[data-fgroup]').addEventListener('change', (e) => { fGroup = e.target.value; render(root); });
      root.querySelector('[data-fregion]').addEventListener('change', (e) => { fRegion = e.target.value; render(root); });
      root.querySelectorAll('[data-fstyle]').forEach((b) => b.addEventListener('click', () => {
        fStyle = b.dataset.fstyle;
        root.querySelectorAll('[data-fstyle]').forEach((z) => z.setAttribute('aria-pressed', z === b));
        render(root);
      }));
    },
  };
}
