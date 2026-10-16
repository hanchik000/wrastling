import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
import { TESTS, DEMO_ATHLETES, REGIONS, STYLES, AGE_GROUPS, regionName, styleName, testById } from '../data.js';
import { getResults, ageGroup } from '../store.js';
import { getStudents, attention } from '../students.js';
import { readinessGol } from '../dost-ui.js';
import { addCoachMsg, getCoachMsgs } from '../store.js';
import { sheet, toast } from '../ui.js';
import { areaById, pick, exName } from '../assistant.js';
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

  // Причины внимания — человеческим языком
  function reasons(s, lang) {
    const out = [];
    for (const p of s.plan.act) {
      const nm = pick(areaById(p.area).name, lang);
      if (p.area === 'head' || (p.flags || []).includes('headhit')) out.push(t('coach.r_head'));
      else if (p.level >= 7 || (p.flags || []).length) out.push(t('coach.r_pain_red', { a: nm, l: p.level }));
      else out.push(t('coach.r_pain', { a: nm, l: p.level }));
    }
    if (s.sm.acwr != null && s.sm.acwr > 1.5) out.push(t('coach.r_load', { r: s.sm.acwr.toFixed(1) }));
    if (s.plan.reasons.some((r) => r.mood)) out.push(t('coach.r_mood'));
    if (s.plan.reasons.some((r) => r.streak)) out.push(t('coach.r_streak'));
    if (s.plan.reasons.some((r) => r.hard)) out.push(t('coach.r_hard'));
    return out;
  }

  function act(root, s, kind) {
    const nm = (s.athlete.name || '').split(' ')[0];
    if (kind === 'msg') {
      const tpl = ['coach.t_good', 'coach.t_how', 'coach.t_rest'].map((k) => t(k, { n: nm }));
      sheet(`<h3>${esc(t('coach.write_to', { n: s.athlete.name }))}</h3>
        <div class="chips mt-3" style="flex-wrap:wrap">${tpl.map((x) => `<button class="chip" data-tpl="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <textarea class="input mt-4" rows="4" data-text placeholder="${esc(t('coach.write_ph'))}"></textarea>
        <div class="stack mt-4"><button class="btn btn-gold btn-block" data-send>${esc(t('coach.send'))}</button><button class="btn btn-quiet btn-block" data-close>${esc(t('common.cancel'))}</button></div>`,
      (panel, close) => {
        const ta = panel.querySelector('[data-text]');
        panel.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => { ta.value = b.dataset.tpl; ta.focus(); }));
        panel.querySelector('[data-send]').addEventListener('click', () => {
          const text = ta.value.trim(); if (!text) { ta.focus(); return; }
          addCoachMsg({ to: s.id, kind: 'msg', text }); close(); toast(t('coach.sent', { n: nm })); renderStudents(root);
        });
      });
      return;
    }
    const lang = getLang();
    const avoid = s.plan.avoid.length ? ' ' + t('coach.t_avoid', { x: s.plan.avoid.slice(0, 4).map((x) => exName(x, lang)).join(', ') }) : '';
    addCoachMsg({ to: s.id, kind, text: t(kind === 'doctor' ? 'coach.t_doctor' : 'coach.t_light', { n: nm }) + (kind === 'light' ? avoid : '') });
    toast(t(kind === 'doctor' ? 'coach.done_doctor' : 'coach.done_light', { n: nm }));
    renderStudents(root);
  }

  function renderStudents(root) {
    const lang = getLang();
    const list = getStudents().map((s) => ({ ...s, att: attention(s) }));
    const need = list.filter((s) => s.att >= 1).sort((a, b) => b.att - a.att);
    const handled = list.filter((s) => s.directive);
    const host = root.querySelector('#slist');
    root.querySelector('#skpis').innerHTML = `
      <div class="team-sum">
        <p class="team-big">${need.length ? esc(t('coach.need_today', { n: need.length })) : esc(t('coach.all_good_today'))}</p>
        <p class="muted">${esc(t('coach.team_line', { n: list.length, h: handled.length }))}</p>
      </div>`;
    const zoneOrder = { rest: 0, care: 1, go: 2 };
    host.innerHTML = `
      ${need.length ? `<div class="attn">${need.map((s) => {
        const rs = reasons(s, lang);
        const red = s.att >= 3;
        return `<article class="attn-card ${red ? 'red' : 'amber'}">
          <a class="attn-who" href="#/coach/athlete/${s.id}">${readinessGol(s.ready.score, s.ready.zone, '', '')}<span><b>${esc(s.athlete.name)}</b>${s.me ? ` <span class="badge badge-gold">${esc(t('coach.this_device'))}</span>` : ''}<small>${s.athlete.age ? s.athlete.age + ' ' + esc(t('unit.years')) + ', ' : ''}${esc(tr(styleName(s.athlete.style)))}, ${s.athlete.weight} ${esc(t('unit.kg'))}</small></span></a>
          <ul class="attn-why">${rs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
          <div class="attn-act">
            ${red ? `<button class="btn btn-danger btn-sm" data-act="doctor" data-id="${s.id}">${esc(t('coach.a_doctor'))}</button>` : ''}
            <button class="btn ${red ? 'btn-ghost' : 'btn-gold'} btn-sm" data-act="light" data-id="${s.id}">${esc(t('coach.a_light'))}</button>
            <button class="btn btn-ghost btn-sm" data-act="msg" data-id="${s.id}">${icon.chat}${esc(t('coach.a_msg'))}</button>
          </div>
        </article>`;
      }).join('')}</div>` : ''}
      <h2 class="eyebrow mt-10 mb-4">${esc(t('coach.team'))}</h2>
      <div class="team">${[...list].sort((a, b) => zoneOrder[a.ready.zone] - zoneOrder[b.ready.zone] || a.ready.score - b.ready.score).map((s) => `
        <a class="tm ${s.ready.zone}" href="#/coach/athlete/${s.id}">
          ${readinessGol(s.ready.score, s.ready.zone, '', '')}
          <b>${esc((s.athlete.name || '').split(' ')[0])}</b>
          <small>${s.directive ? '✓ ' + esc(t('coach.st_' + s.directive.kind)) : esc(t('coach.lv_' + s.plan.level))}</small>
        </a>`).join('')}</div>
      <p class="muted mt-4" style="font-size:var(--fs-micro)">${esc(t('coach.ready_note'))}</p>`;
    host.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(root, list.find((x) => x.id === b.dataset.id), b.dataset.act)));
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
