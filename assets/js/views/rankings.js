import { initFx } from '../fx.js';
import { t, tr, fmtNum, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge, photoSlot, hydratePhotos, sheet } from '../ui.js';
import { DEMO_ATHLETES, REGIONS, STYLES, regionName, styleName, ratingOf } from '../data.js';
import { LEVELS, PLACE_PTS, PARTICIPATION, BONUS, levelById } from '../rating.js';
import { wrestlersArt } from '../art.js';

const initials = (n) => n.split(' ').map((s) => s[0]).join('').slice(0, 2);

export function changeCell(d) {
  if (d > 0) return `<span class="delta up">▲ ${d}</span>`;
  if (d < 0) return `<span class="delta down">▼ ${Math.abs(d)}</span>`;
  return `<span class="muted">—</span>`;
}

// Таблица рейтинга — используется и на главной, и на странице рейтинга
export function rankTable(list, { full = false } = {}) {
  if (!list.length) return `<div class="empty"><h3>${esc(t('rank.empty'))}</h3><p>${esc(t('rank.empty_hint'))}</p></div>`;
  return `<div style="overflow-x:auto"><table class="rtable">
    <thead><tr>
      <th>#</th><th>${esc(t('coach.athlete'))}</th>
      <th class="hide-sm">${esc(t('profile.style'))}</th>
      <th class="hide-sm">${esc(t('rank.weight'))}</th>
      ${full ? `<th class="hide-sm">${esc(t('rank.wins'))}</th>` : ''}
      <th style="text-align:right">${esc(t('rank.points'))}</th><th></th>
    </tr></thead>
    <tbody>${list.map((a, i) => `
      <tr class="flash" style="animation-delay:${i * 25}ms" data-ath="${a.id}" tabindex="0" aria-label="${esc(t('rank.breakdown') + ': ' + a.name)}">
        <td class="pos num">${i + 1}</td>
        <td><div class="nm"><span class="ava" ${a.age >= 18 || a.photoSample ? `data-photo="${esc(a.photo)}"` : ''}>${esc(initials(a.name))}</span><span><b>${esc(a.name)}${a.real ? ` <span class="badge badge-gold" style="padding:2px 6px;font-size:.58rem">${esc(t('rank.real'))}</span>` : ''}</b><small>${esc(tr(regionName(a.region)))} · ${a.age} ${esc(t('unit.years'))}</small></span></div></td>
        <td class="hide-sm muted" style="font-size:var(--fs-small)">${esc(tr(styleName(a.style)))}</td>
        <td class="hide-sm num">${a.weight} ${esc(t('unit.kg'))}</td>
        ${full ? `<td class="hide-sm num">${a.wins != null ? a.wins + ' / ' + a.bouts : (a.worldScore ? esc(t('rank.world_u20')) : '—')}</td>` : ''}
        <td class="pts num"><span class="pts-link">${a.score.toFixed(1)}</span></td>
        <td class="chg num">${changeCell(a.delta)}</td>
      </tr>`).join('')}</tbody></table></div>`;
}

// ---------- Расшифровка очков ----------
const placeLabel = (p) => (p ? t('rank.place_n', { n: p }) : t('rank.particip'));

export function openBreakdown(id) {
  const a = DEMO_ATHLETES.find((x) => x.id === id);
  if (!a) return;
  const { total, rows } = ratingOf(a);
  const k = (v) => fmtNum(v, Number.isInteger(v) ? 0 : 1);
  sheet(`
    <button class="sr-only" data-close>${esc(t('common.close'))}</button>
    <div class="row between" style="align-items:flex-start;gap:12px">
      <div><p class="eyebrow">${esc(t('rank.breakdown'))}</p><h3 class="mt-2" style="margin-bottom:2px">${esc(a.name)}</h3>
        <span class="muted" style="font-size:var(--fs-small)">${esc(tr(regionName(a.region)))} · ${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))}</span></div>
      <div class="rb-total"><b class="num">${k(total)}</b><span>${esc(t('rank.points'))}</span></div>
    </div>
    <p class="rb-formula mt-4">${esc(t('rank.formula'))}</p>
    <div class="rb-list mt-4">${rows.map((r) => `
      <div class="rres ${r.fresh ? '' : 'out'}">
        <div class="rres-h">
          <b>${esc(tr(r.name))}</b>
          <span>${esc(fmtDate(r.date, r.monthOnly ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' }))} · ${esc(tr(levelById(r.level).name))}${r.real ? ` · <a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(t('rank.source'))} ↗</a>` : ''}</span>
          <div class="rres-c">
            <i class="${r.place && r.place <= 3 ? 'medal m' + r.place : ''}">${esc(placeLabel(r.place))} = ${r.pts}</i>
            <i>× ${r.k}</i>
            ${r.bonus ? `<i class="plus">+${r.bonus} ${esc(t('rank.early_short'))}</i>` : ''}
            ${r.fresh === 0.5 ? `<i class="half">× ½ ${esc(t('rank.older6'))}</i>` : ''}
            ${r.fresh === 0 ? `<i class="half">${esc(t('rank.older12'))}</i>` : ''}
          </div>
        </div>
        <b class="rres-t num">${r.fresh ? k(r.total) : '—'}</b>
      </div>`).join('')}
    </div>
    <div class="rb-sum"><span>${esc(t('rank.total'))}</span><b class="num">${k(total)}</b></div>
    <p class="muted mt-4" style="font-size:var(--fs-small)">${esc(t(a.real ? 'rank.real_only' : 'rank.demo_results'))}</p>
    <button class="btn btn-ghost btn-block mt-4" data-close>${esc(t('common.close'))}</button>`);
}

// Клик или Enter по строке/пьедесталу открывает расшифровку
// Один общий обработчик на документ — страницы могут вызывать сколько угодно раз
let ratingBound = false;
export function bindRating() {
  if (ratingBound) return;
  ratingBound = true;
  const open = (e) => { const el = e.target.closest?.('[data-ath]'); if (el && !e.target.closest('a')) openBreakdown(el.dataset.ath); };
  document.addEventListener('click', open);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches?.('[data-ath]')) open(e); });
}

export function ratingRules() {
  return `<div class="panel rb-rules mt-8">
    <h2 class="eyebrow">${esc(t('rank.how_t'))}</h2>
    <p class="mt-3">${esc(t('rank.how_lead'))}</p>
    <p class="rb-formula mt-3">${esc(t('rank.formula'))}</p>
    <div class="rb-grid mt-6">
      <div><h3>${esc(t('rank.place_t'))}</h3><ul>${Object.entries(PLACE_PTS).map(([p, v]) => `<li><span>${esc(placeLabel(+p))}</span><b class="num">${v}</b></li>`).join('')}<li><span>${esc(t('rank.particip'))}</span><b class="num">${PARTICIPATION}</b></li></ul></div>
      <div><h3>${esc(t('rank.level_t'))}</h3><ul>${LEVELS.map((l) => `<li><span>${esc(tr(l.name))}</span><b class="num">× ${l.k}</b></li>`).join('')}</ul></div>
      <div><h3>${esc(t('rank.fresh_t'))}</h3><ul><li><span>${esc(t('rank.fresh_full'))}</span><b class="num">× 1</b></li><li><span>${esc(t('rank.fresh_half'))}</span><b class="num">× ½</b></li><li><span>${esc(t('rank.fresh_out'))}</span><b class="num">0</b></li></ul>
        <h3 class="mt-4">${esc(t('rank.bonus_t'))}</h3><ul><li><span>${esc(t('rank.bonus'))}</span><b class="num">+${BONUS}</b></li></ul></div>
    </div>
    <p class="muted mt-6" style="font-size:var(--fs-small)">${esc(t('rank.example'))}</p>
  </div>`;
}

function podium(list) {
  const top = list.slice(0, 3);
  if (top.length < 3) return '';
  const order = [top[1], top[0], top[2]];
  const cls = ['p2', 'p1', 'p3'];
  const place = [2, 1, 3];
  return `<div class="podium">${order.map((a, i) => `
    <div class="pod ${cls[i]}" data-ath="${a.id}" tabindex="0" role="button" aria-label="${esc(t('rank.breakdown') + ': ' + a.name)}">
      <span class="place num">${place[i]}</span>
      ${photoSlot(a.age >= 18 || a.photoSample ? a.photo : null, wrestlersArt('single', { uid: 'pod' + a.id, skeleton: i === 1 }))}
      <div class="base"><b>${esc(a.name)}</b>${a.photoSample ? `<span style="font-size:.6rem;letter-spacing:.08em;text-transform:uppercase">${esc(t('rank.sample_photo'))}</span>` : ''}<span>${esc(tr(regionName(a.region)))} · ${a.weight} ${esc(t('unit.kg'))}</span><span class="s num">${a.score.toFixed(1)}</span></div>
    </div>`).join('')}</div>`;
}

export default function rankings({ query }) {
  let group = query.g === 'adults' ? 'adults' : 'kids';
  let style = 'all', region = 'all', sex = 'all';

  const html = `
  <section class="rank-hero gol-bg">
    <span class="medallion" aria-hidden="true" style="color:var(--c-gold);--o:.08;opacity:.08;width:min(900px,140vw);aspect-ratio:1.4;left:50%;margin-left:max(-450px,-70vw);top:120px"></span>
    <div class="container">
      <div class="row row-wrap between">
        <div class="sec-title" style="margin-bottom:0"><h2 data-split><small>${esc(t('rank.eyebrow'))}</small>${esc(t('rank.title'))}</h2></div>
        ${demoBadge()}
      </div>
      <div class="row row-wrap mt-6">
        <div class="segmented" role="tablist">
          <button role="tab" data-group="kids" aria-selected="${group === 'kids'}">${esc(t('rank.kids'))}</button>
          <button role="tab" data-group="adults" aria-selected="${group === 'adults'}">${esc(t('rank.adults'))}</button>
        </div>
      </div>
      <div id="podium"></div>
    </div>
  </section>
  <div class="band-wrap" aria-hidden="true"><div class="carpet-band thin"></div></div>
  <section class="container section-tight" style="padding-bottom:var(--s-16)">
    <div class="chips mb-4">
      <button class="chip" data-style="all" aria-pressed="true">${esc(t('rank.all_styles'))}</button>
      ${STYLES.map((s) => `<button class="chip" data-style="${s.id}" aria-pressed="false">${esc(tr(s.name))}</button>`).join('')}
    </div>
    <div class="row row-wrap mb-6">
      <select id="rk-region" class="input" style="max-width:260px" aria-label="${esc(t('profile.region'))}">
        <option value="all">${esc(t('rank.all_regions'))}</option>
        ${REGIONS.map((r) => `<option value="${r.id}">${esc(tr(r.name))}</option>`).join('')}
      </select>
    </div>
    <p class="muted mb-4" style="font-size:var(--fs-small)"><span id="rk-note"></span> ${esc(t('rank.tap_hint'))}</p>
    <div id="rk-table"></div>
    ${ratingRules()}
    <div class="notice info mt-6">${icon.info}<div>${esc(t('rank.index_note'))}</div></div>
  </section>`;

  function render(root) {
    const list = DEMO_ATHLETES
      .filter((a) => (group === 'kids' ? a.age < 18 : a.age >= 18))
      .filter((a) => style === 'all' || a.style === style)
      .filter((a) => region === 'all' || a.region === region)
      .sort((a, b) => b.score - a.score);
    root.querySelector('#podium').innerHTML = (group === 'kids' ? `
      <div class="kids-banner mt-6">
        ${photoSlot('hero-1', wrestlersArt('clinch', { uid: 'kidsb' }), 'fill')}
        <div class="in"><span class="tag-gold">${esc(t('rank.future_tag'))}</span><h3 data-split>${t('rank.future_title')}</h3><p>${esc(t('rank.future_note'))}</p></div>
      </div>` : '') + podium(list);
    root.querySelector('#rk-table').innerHTML = rankTable(list, { full: true });
    root.querySelector('#rk-note').textContent = t(group === 'kids' ? 'rank.kids_note' : 'rank.adults_note');
    hydratePhotos(root);
    initFx(root.querySelector('#podium'));
  }

  return {
    html,
    title: t('nav.rankings'),
    mount(root) {
      render(root);
      bindRating(root);
      root.querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => {
        group = b.dataset.group;
        root.querySelectorAll('[data-group]').forEach((z) => z.setAttribute('aria-selected', z === b));
        render(root);
      }));
      root.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => {
        style = b.dataset.style;
        root.querySelectorAll('[data-style]').forEach((z) => z.setAttribute('aria-pressed', z === b));
        render(root);
      }));
      root.querySelector('#rk-region').addEventListener('change', (e) => { region = e.target.value; render(root); });
    },
  };
}
