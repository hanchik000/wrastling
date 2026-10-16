import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon } from '../ui.js';
import { TESTS } from '../data.js';
import { testArt } from '../art.js';
import { ageOf, getResults } from '../store.js';

export function resultStatusLabel(r) {
  if (!r) return '';
  if (r.coach?.status === 'reviewed') return `<span class="badge badge-coach">${esc(t('status.reviewed'))}</span>`;
  if (r.analysis?.status === 'ok') return `<span class="badge badge-measured">${esc(t('status.measured'))}</span>`;
  if (r.analysis?.status === 'low_quality') return `<span class="badge" style="color:var(--c-live)">${esc(t('status.reshoot'))}</span>`;
  return `<span class="badge">${esc(t('status.waiting_coach'))}</span>`;
}

export default function scout({ user }) {
  const age = ageOf(user?.profile?.birthdate);
  const results = getResults();
  const last = (id) => results.find((r) => r.testId === id);

  const items = TESTS.map((x) => {
    const tooYoung = age != null && age < x.minAge;
    const r = last(x.id);
    const state = tooYoung
      ? `<span class="muted state">${esc(t('scout.from_age', { n: x.minAge }))}</span>`
      : r ? resultStatusLabel(r) : `<span class="muted state">${x.seconds} ${esc(t('unit.sec'))}</span>`;
    return `<a class="test-item ${tooYoung ? 'locked' : ''}" href="${tooYoung ? '#/scout' : '#/scout/test/' + x.id}" ${tooYoung ? 'aria-disabled="true"' : ''}>
      <span class="ico" style="color:var(--text)">${testArt[x.id]}</span>
      <span><h3>${esc(tr(x.name))}</h3><p>${esc(tr(x.short))}${x.note ? ' · ' + esc(tr(x.note)) : ''}</p></span>
      ${state}
    </a>`;
  }).join('');

  const done = TESTS.filter((x) => last(x.id)?.analysis?.status === 'ok').length;
  const available = TESTS.filter((x) => !(age != null && age < x.minAge)).length;

  const html = `
  <section class="container scout-hero">
    <span class="medallion" aria-hidden="true" style="color:var(--c-gold);--o:.09;opacity:.09;width:300px;aspect-ratio:1.4;right:var(--gutter);top:24px"></span>
    <p class="eyebrow">Talent Scout</p>
    <h1 class="display mt-2" data-split>${esc(t('scout.title'))}</h1>
    <p class="muted mt-4 max-prose">${esc(t('scout.lead'))}</p>
    <div class="row row-wrap mt-6">
      <span class="badge badge-free">${esc(t('scout.free'))}</span>
      <span class="badge">${esc(t('scout.no_equipment'))}</span>
      <span class="badge badge-coach">${esc(t('scout.coach_decides'))}</span>
    </div>
  </section>

  <section class="container" style="padding-bottom:var(--s-16)">
    ${!user ? `
      <div class="panel" style="display:grid;gap:var(--s-4)">
        <h2 style="font-size:1.25rem">${esc(t('scout.start_title'))}</h2>
        <p class="muted">${esc(t('scout.start_lead'))}</p>
        <a class="btn btn-primary" href="#/login?next=/scout">${esc(t('scout.start_cta'))} ${icon.arrow}</a>
        <p class="muted" style="font-size:var(--fs-small)">${esc(t('scout.preview_note'))}</p>
      </div>
      <h2 class="eyebrow mt-10 mb-4">${esc(t('scout.tests_preview'))}</h2>`
    : `
      <div class="row between mb-4">
        <h2 class="eyebrow">${esc(t('scout.your_tests', { group: user.profile?.ageGroup || '' }))}</h2>
        <span class="muted num" style="font-size:var(--fs-small)">${done} / ${available}</span>
      </div>
      <div class="progress ok mb-6"><i style="width:${available ? (done / available) * 100 : 0}%"></i></div>`}
    <div class="test-list" data-stagger>${items}</div>

    ${results.length ? `
      <h2 class="eyebrow mt-12 mb-4">${esc(t('scout.history'))}</h2>
      <div class="list">${results.slice(0, 6).map((r) => {
        const x = TESTS.find((q) => q.id === r.testId);
        return `<a class="list-row" href="#/scout/result/${r.id}">
          <span class="grow"><b>${esc(tr(x?.name))}</b><span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(r.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span></span>
          ${r.analysis?.metrics?.reps != null ? `<b class="num display" style="font-size:1.5rem">${r.analysis.metrics.reps}</b>` : ''}
          ${resultStatusLabel(r)}
        </a>`;
      }).join('')}</div>` : ''}

    <div class="notice info mt-10">${icon.shield}<div>${esc(t('scout.privacy'))}</div></div>
  </section>`;

  return { html, title: 'Talent Scout' };
}
