// Публичная страница спортсмена: фото, титулы, очки рейтинга, график очков за год, результаты турниров.
import { t, tr, fmtNum, fmtDate } from '../i18n.js';
import { esc, icon, photoSlot, demoBadge } from '../ui.js';
import { DEMO_ATHLETES, regionName, styleName, ratingOf } from '../data.js';
import { levelById } from '../rating.js';
import { wrestlersArt } from '../art.js';
import { lineChart, bindTips } from './training.js';
import { openBreakdown } from './rankings.js';
import { iso } from '../training-lib.js';

const STUDENT_IDS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd7', 'd8', 'd12'];

export default function athlete({ params, user }) {
  const a = DEMO_ATHLETES.find((x) => x.id === params.id);
  if (!a) return { redirect: '/rankings' };
  const adult = a.age >= 18;
  const group = DEMO_ATHLETES.filter((x) => (x.age >= 18) === adult).sort((x, y) => y.score - x.score);
  const place = group.indexOf(a) + 1;
  const { total, rows } = ratingOf(a);
  // Очки рейтинга на начало каждого месяца за последний год
  const pts = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    if (i === 0) d.setTime(Date.now());
    pts.push({ date: iso(d), v: ratingOf(a, d).total });
  }
  const showPhoto = adult || a.photoSample;
  const counted = rows.filter((r) => r.fresh);
  const golds = counted.filter((r) => r.place === 1).length;

  const html = `
  <section class="ath-hero">
    <div class="ath-photo">${photoSlot(showPhoto ? a.photo : null, wrestlersArt('single', { uid: 'ath' + a.id }), 'fill pos-top')}</div>
    <div class="container ath-in">
      <a class="btn btn-quiet" href="#/rankings?g=${adult ? 'adults' : 'kids'}">${icon.back}${esc(t('nav.rankings'))}</a>
      <div class="row row-wrap mt-6" style="gap:8px">${a.real ? `<span class="badge badge-gold">${esc(t('rank.real'))}</span>` : demoBadge()}${a.photoSample ? `<span class="badge">${esc(t('rank.sample_photo'))}</span>` : ''}</div>
      <h1 class="display mt-3" data-split>${esc(a.name)}</h1>
      <p class="ath-meta mt-3">${esc(tr(regionName(a.region)))} · ${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))} · ${a.age} ${esc(t('unit.years'))}</p>
      ${a.titles ? `<p class="ath-titles mt-4">${esc(tr(a.titles))}</p>` : ''}
      <div class="ath-stats mt-8">
        <div><b class="num">${fmtNum(total, 1)}</b><span>${esc(t('rank.points'))}</span></div>
        <div><b class="num">#${place}</b><span>${esc(t(adult ? 'rank.adults' : 'rank.kids'))}</span></div>
        <div><b class="num">${a.medals ?? 0}</b><span>${esc(t('rank.medals'))}</span></div>
        <div><b class="num">${golds}</b><span>${esc(t('ath.golds'))}</span></div>
      </div>
    </div>
  </section>
  <section class="container section-tight" style="padding-bottom:var(--s-16)">
    <div class="panel">
      <div class="row row-wrap between mb-3"><h2 class="eyebrow">${esc(t('ath.chart'))}</h2><button class="btn btn-quiet btn-sm" data-bd>${esc(t('rank.breakdown'))} →</button></div>
      <div data-line></div>
      <p class="muted mt-2" style="font-size:var(--fs-micro)">${esc(t('ath.chart_note'))}</p>
    </div>
    <h2 class="eyebrow mt-10 mb-4">${esc(t('ath.results'))}</h2>
    <div class="rb-list">${rows.map((r) => `
      <div class="rres ${r.fresh ? '' : 'out'}">
        <div class="rres-h"><b>${esc(tr(r.name))}</b>
          <span>${esc(fmtDate(r.date, r.monthOnly ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' }))} · ${esc(tr(levelById(r.level).name))}${r.real ? ` · <a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(t('rank.source'))} ↗</a>` : ''}</span>
          <div class="rres-c"><i class="${r.place && r.place <= 3 ? 'medal m' + r.place : ''}">${r.place ? esc(t('rank.place_n', { n: r.place })) : esc(t('rank.particip'))}</i>${r.early ? `<i class="plus">+${r.early} ${esc(t('rank.early_short'))}</i>` : ''}${r.fresh === 0 ? `<i class="half">${esc(t('rank.older12'))}</i>` : ''}</div>
        </div>
        <b class="rres-t num">${r.fresh ? fmtNum(r.total, Number.isInteger(r.total) ? 0 : 1) : '—'}</b>
      </div>`).join('')}</div>
    <p class="muted mt-4" style="font-size:var(--fs-small)">${esc(t(a.real ? 'rank.real_only' : 'rank.demo_results'))}</p>
    ${STUDENT_IDS.includes(a.id) && user ? `<a class="btn btn-ghost mt-6" href="#/coach/athlete/${a.id}">${icon.coach}${esc(t('ath.coach_view'))}</a>` : ''}
    ${!adult ? `<p class="muted mt-6" style="font-size:var(--fs-micro)">${esc(t('rank.kids_note'))}</p>` : ''}
  </section>`;

  return {
    html,
    title: a.name,
    mount(root) {
      const host = root.querySelector('[data-line]');
      host.innerHTML = lineChart(pts, 'points', Math.round(Math.max(300, Math.min(1200, host.clientWidth - 10))));
      bindTips(root);
      root.querySelector('[data-bd]').addEventListener('click', () => openBreakdown(a.id));
    },
    unmount() { document.querySelector('.ttip')?.classList.remove('on'); },
  };
}
