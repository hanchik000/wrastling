import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
import { DEMO_ATHLETES, EVENTS, NEWS, REGIONS, STYLES, regionName, styleName } from '../data.js';
import { newsArt } from '../art.js';

export function boardRows(list) {
  if (!list.length) return `<div class="empty"><h3>${esc(t('rank.empty'))}</h3><p>${esc(t('rank.empty_hint'))}</p></div>`;
  return list.map((a, i) => `
    <div class="board-row" data-id="${a.id}">
      <span class="pos num">${i + 1}</span>
      <span class="who"><b>${esc(a.name)}</b><span>${esc(tr(regionName(a.region)))} · ${esc(tr(styleName(a.style)))} · ${a.weight} ${esc(t('unit.kg'))} · ${a.age} ${esc(t('unit.years'))}</span></span>
      <span><span class="score num">${a.score.toFixed(1)}</span><span class="delta num ${a.delta > 0 ? 'up' : a.delta < 0 ? 'down' : ''}" style="display:block">${a.delta > 0 ? '▲ ' + a.delta : a.delta < 0 ? '▼ ' + Math.abs(a.delta) : '—'}</span></span>
    </div>`).join('');
}

export function eventStatusBadge(ev) {
  if (ev.status === 'live') return `<span class="badge badge-live">LIVE</span>`;
  if (ev.status === 'replay') return `<span class="badge badge-rec">${esc(t('media.recording'))}</span>`;
  return `<span class="badge">${esc(t('media.upcoming'))}</span>`;
}

export function priceLabel(ev) {
  return ev.price > 0 ? `${ev.price} TMT` : t('media.free');
}

const TABS = ['events', 'news'];

export default function media({ query }) {
  if (query.tab === 'rankings') return { redirect: '/rankings' };
  let tab = TABS.includes(query.tab) ? query.tab : 'events';
  let group = 'kids';
  let style = 'all';
  let region = 'all';

  const html = `
  <section class="container scout-hero">
    <p class="eyebrow">${esc(t('nav.media'))}</p>
    <h1 class="display mt-2">${esc(t('media.title'))}</h1>
    <div class="tabs mt-6" role="tablist">
      ${TABS.map((x) => `<button role="tab" data-tab="${x}" aria-selected="${x === tab}">${esc(t('media.' + x))}</button>`).join('')}
    </div>
  </section>
  <section class="container" style="padding-bottom:var(--s-16)"><div id="tab-body"></div></section>`;

  function renderBody(root) {
    const body = root.querySelector('#tab-body');
    if (tab === 'news') {
      body.innerHTML = `
        <div class="grid-3">${NEWS.map((n) => `
          <a class="news-card" href="#/news/${n.id}">
            <div class="ph" style="color:var(--text)"><div class="photo" data-photo="news-${n.id}" style="position:absolute;inset:0"><div class="art" style="align-items:center"><div style="width:50%">${newsArt[n.art] || ''}</div></div></div><span class="ph-tag badge" style="background:var(--surface)">${esc(tr(n.tag))}</span>${n.demo ? `<span class="badge badge-demo" style="position:absolute;right:10px;top:10px">${esc(t('common.demo'))}</span>` : ''}</div>
            <span class="eyebrow">${esc(fmtDate(n.date))}</span>
            <h3>${esc(tr(n.title))}</h3>
            <p class="muted" style="font-size:var(--fs-small)">${esc(tr(n.body))}</p>
          </a>`).join('')}</div>`;
    } else if (tab === 'events') {
      body.innerHTML = `
        <div class="row between mb-6"><p class="muted">${esc(t('media.events_note'))}</p>${demoBadge()}</div>
        <div class="grid-3">${EVENTS.map((ev) => `
          <a class="event-card" href="#/live/${ev.id}">
            <div class="row between">${eventStatusBadge(ev)}<span class="muted" style="font-size:var(--fs-small)">${esc(tr(styleName(ev.style)))}</span></div>
            <span class="date num">${esc(fmtDate(ev.date, { day: 'numeric', month: 'short' }))}</span>
            <h3 style="font-size:1.1rem">${esc(tr(ev.title))}</h3>
            <div class="row between"><span class="muted">${esc(tr(ev.venue))}</span><b>${esc(priceLabel(ev))}</b></div>
          </a>`).join('')}</div>`;
    } else {
      const list = DEMO_ATHLETES
        .filter((a) => (group === 'kids' ? a.age < 18 : a.age >= 18))
        .filter((a) => style === 'all' || a.style === style)
        .filter((a) => region === 'all' || a.region === region)
        .sort((a, b) => b.score - a.score);
      body.innerHTML = `
        <div class="row row-wrap between mb-6">
          <div class="segmented" role="tablist">
            <button role="tab" data-group="kids" aria-selected="${group === 'kids'}">${esc(t('rank.kids'))}</button>
            <button role="tab" data-group="adults" aria-selected="${group === 'adults'}">${esc(t('rank.adults'))}</button>
          </div>
          ${demoBadge()}
        </div>
        <div class="chips mb-4" aria-label="${esc(t('rank.style'))}">
          <button class="chip" data-style="all" aria-pressed="${style === 'all'}">${esc(t('common.all'))}</button>
          ${STYLES.map((s) => `<button class="chip" data-style="${s.id}" aria-pressed="${style === s.id}">${esc(tr(s.name))}</button>`).join('')}
        </div>
        <div class="row mb-6" style="max-width:320px">
          <label class="sr-only" for="rk-region">${esc(t('profile.region'))}</label>
          <select id="rk-region" class="input">
            <option value="all">${esc(t('rank.all_regions'))}</option>
            ${REGIONS.map((r) => `<option value="${r.id}" ${region === r.id ? 'selected' : ''}>${esc(tr(r.name))}</option>`).join('')}
          </select>
        </div>
        <p class="muted mb-4" style="font-size:var(--fs-small)">${esc(t(group === 'kids' ? 'rank.kids_note' : 'rank.adults_note'))}</p>
        <div class="board">${boardRows(list)}</div>
        <p class="muted mt-6" style="font-size:var(--fs-small)">${esc(t('rank.index_note'))}</p>`;
      body.querySelectorAll('.board-row').forEach((r, i) => { r.style.animationDelay = i * 30 + 'ms'; r.classList.add('flash'); });
      body.querySelectorAll('[data-group]').forEach((b) => b.addEventListener('click', () => { group = b.dataset.group; renderBody(root); }));
      body.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => { style = b.dataset.style; renderBody(root); }));
      body.querySelector('#rk-region').addEventListener('change', (e) => { region = e.target.value; renderBody(root); });
    }
  }

  return {
    html,
    title: t('nav.media'),
    mount(root) {
      renderBody(root);
      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
        tab = b.dataset.tab;
        root.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
        history.replaceState(null, '', '#/media?tab=' + tab);
        renderBody(root);
      }));
    },
  };
}
