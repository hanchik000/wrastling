import { t, tr } from '../i18n.js';
import { esc, icon, demoBadge, photoSlot, hydratePhotos } from '../ui.js';
import { DEMO_ATHLETES, REGIONS, STYLES, regionName, styleName } from '../data.js';
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
      <tr class="flash" style="animation-delay:${i * 25}ms">
        <td class="pos num">${i + 1}</td>
        <td><div class="nm"><span class="ava" ${a.age >= 18 || a.photoSample ? `data-photo="${esc(a.photo)}"` : ''}>${esc(initials(a.name))}</span><span><b>${esc(a.name)}${a.real ? ` <span class="badge badge-gold" style="padding:2px 6px;font-size:.58rem">${esc(t('rank.real'))}</span>` : ''}</b><small>${esc(tr(regionName(a.region)))} · ${a.age} ${esc(t('unit.years'))}</small></span></div></td>
        <td class="hide-sm muted" style="font-size:var(--fs-small)">${esc(tr(styleName(a.style)))}</td>
        <td class="hide-sm num">${a.weight} ${esc(t('unit.kg'))}</td>
        ${full ? `<td class="hide-sm num">${a.wins != null ? a.wins + ' / ' + a.bouts : (a.worldScore ? esc(t('rank.world_u20')) : '—')}</td>` : ''}
        <td class="pts num">${a.score.toFixed(1)}</td>
        <td class="chg num">${changeCell(a.delta)}</td>
      </tr>`).join('')}</tbody></table></div>`;
}

function podium(list) {
  const top = list.slice(0, 3);
  if (top.length < 3) return '';
  const order = [top[1], top[0], top[2]];
  const cls = ['p2', 'p1', 'p3'];
  const place = [2, 1, 3];
  return `<div class="podium">${order.map((a, i) => `
    <div class="pod ${cls[i]}">
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
    <div class="container">
      <div class="row row-wrap between">
        <div class="sec-title" style="margin-bottom:0"><h2><small>${esc(t('rank.eyebrow'))}</small>${esc(t('rank.title'))}</h2></div>
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
    <p class="muted mb-4" id="rk-note" style="font-size:var(--fs-small)"></p>
    <div id="rk-table"></div>
    <div class="notice info mt-8">${icon.info}<div>${esc(t('rank.index_note'))}</div></div>
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
        <div class="in"><span class="tag-gold">${esc(t('rank.future_tag'))}</span><h3>${t('rank.future_title')}</h3><p>${esc(t('rank.future_note'))}</p></div>
      </div>` : '') + podium(list);
    root.querySelector('#rk-table').innerHTML = rankTable(list, { full: true });
    root.querySelector('#rk-note').textContent = t(group === 'kids' ? 'rank.kids_note' : 'rank.adults_note');
    hydratePhotos(root);
  }

  return {
    html,
    title: t('nav.rankings'),
    mount(root) {
      render(root);
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
