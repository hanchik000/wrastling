import { t, tr, fmtDate, fmtMoney } from '../i18n.js';
import { esc, icon, sheet, toast } from '../ui.js';
import { regionName, styleName, EXPERIENCE, TESTS } from '../data.js';
import { getUser, getResults, getOrders, logout, ageOf } from '../store.js';
import { resultStatusLabel } from './scout.js';

export default function profile({ user, go }) {
  if (!user) return { redirect: '/login?next=/profile' };
  if (!user.profile) return { redirect: '/login?next=/profile' };
  const p = user.profile;
  const isCoach = user.role === 'coach';
  const age = ageOf(p.birthdate);
  const initials = (p.name || '?').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  let tab = 'results';

  const html = `
  <section class="container">
    <div class="profile-head">
      <div class="avatar">${esc(initials)}</div>
      <div>
        <p class="eyebrow">${esc(t(isCoach ? 'role.coach' : 'role.athlete'))}${!isCoach && age != null ? ' · ' + esc(t('profile.group', { g: p.ageGroup })) : ''}</p>
        <h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(p.name)}</h1>
        <p class="muted mt-2">+993 ${esc(user.phone)}</p>
      </div>
      <div class="row row-wrap">
        ${isCoach ? `<a class="btn btn-primary" href="#/coach">${icon.coach}${esc(t('coach.open'))}</a>` : `<a class="btn btn-primary" href="#/scout">${esc(t('profile.go_test'))} ${icon.arrow}</a><a class="btn btn-ghost" href="#/training">${icon.diary}${esc(t('nav.training'))}</a><a class="btn btn-gold" href="#/assistant">${icon.chat}Dost</a>`}
      </div>
    </div>
    ${isCoach
      ? `<div class="notice mb-6">${icon.info}<div>${esc(t('coach.license_pending', { l: p.license }))}</div></div>`
      : `<div class="kv panel mb-6">
          <div><span>${esc(t('profile.age'))}</span><b class="num">${age ?? '—'}</b></div>
          <div><span>${esc(t('profile.style'))}</span><b>${esc(tr(styleName(p.style)))}</b></div>
          <div><span>${esc(t('profile.weight'))}</span><b class="num">${p.weight} ${esc(t('unit.kg'))}</b></div>
          <div><span>${esc(t('profile.region'))}</span><b>${esc(tr(regionName(p.region)))}</b></div>
          <div><span>${esc(t('profile.experience'))}</span><b>${esc(tr(EXPERIENCE.find((e) => e.id === p.experience)?.name))}</b></div>
          <div><span>${esc(t('profile.club'))}</span><b>${esc(p.club || '—')}</b></div>
          <div><span>${esc(t('profile.verification'))}</span><b>${esc(t('profile.not_verified'))}</b></div>
          <div><span>${esc(t('profile.consent'))}</span><b>${esc(age != null && age < 18 ? (user.consent ? t('profile.consent_ok') : t('profile.consent_missing')) : t('profile.consent_adult'))}</b></div>
        </div>`}
    <div class="tabs" role="tablist">
      ${['results', 'invites', 'orders', 'settings'].map((x) => `<button role="tab" data-tab="${x}" aria-selected="${x === tab}">${esc(t('profile.tab_' + x))}</button>`).join('')}
    </div>
    <div id="ptab" class="section-tight" style="padding-bottom:var(--s-16)"></div>
  </section>`;

  function body(root) {
    const host = root.querySelector('#ptab');
    if (tab === 'results') {
      const rs = getResults();
      host.innerHTML = rs.length ? `<div class="list">${rs.map((r) => {
        const x = TESTS.find((q) => q.id === r.testId);
        return `<a class="list-row" href="#/scout/result/${r.id}">
          <span class="grow"><b>${esc(tr(x?.name))}</b><span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(r.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span></span>
          ${r.analysis?.metrics?.reps != null ? `<b class="num display" style="font-size:1.5rem">${r.analysis.metrics.reps}</b>` : ''}
          ${resultStatusLabel(r)}
        </a>`;
      }).join('')}</div>` : `<div class="empty">${icon.chart}<h3>${esc(t('profile.no_results'))}</h3><p>${esc(t('profile.no_results_hint'))}</p><a class="btn btn-primary mt-2" href="#/scout">${esc(t('profile.go_test'))}</a></div>`;
    } else if (tab === 'invites') {
      const invited = getResults().filter((r) => r.coach?.recommendation === 'invite');
      host.innerHTML = invited.length ? `<div class="stack">${invited.map((r) => `
        <div class="panel" style="border-color:rgba(39,182,99,.45)">
          <div class="row between"><span class="badge badge-gold">${esc(t('review.rec_invite'))}</span>${'<span class="badge badge-demo">' + esc(t('common.demo')) + '</span>'}</div>
          <h3 class="mt-3">${esc(t('profile.invite_title'))}</h3>
          <p class="muted mt-2">${esc(t('profile.invite_body'))}</p>
        </div>`).join('')}</div>`
        : `<div class="empty">${icon.mail}<h3>${esc(t('profile.no_invites'))}</h3><p>${esc(t('profile.no_invites_hint'))}</p></div>`;
    } else if (tab === 'orders') {
      const os = getOrders();
      host.innerHTML = os.length ? `<div class="list">${os.map((o) => `
        <div class="list-row">
          <span class="grow"><b>№ ${esc(o.number)}</b><span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(o.createdAt, { day: 'numeric', month: 'short' }))} · ${o.lines.reduce((s, l) => s + l.qty, 0)} ${esc(t('shop.items'))}</span></span>
          <b class="num">${esc(fmtMoney(o.total))}</b>
          <span class="badge badge-demo">${esc(t('order.status_demo'))}</span>
        </div>`).join('')}</div>`
        : `<div class="empty">${icon.bag}<h3>${esc(t('profile.no_orders'))}</h3><a class="btn btn-ghost mt-2" href="#/shop">${esc(t('nav.shop'))}</a></div>`;
    } else {
      host.innerHTML = `
        <div class="stack" style="max-width:520px">
          <div class="panel"><h3 style="font-size:1rem">${esc(t('profile.privacy_t'))}</h3><p class="muted mt-2" style="font-size:var(--fs-small)">${esc(t('profile.privacy'))}</p></div>
          <button class="btn btn-ghost btn-block" data-logout>${icon.logout}${esc(t('profile.logout'))}</button>
          <button class="btn btn-quiet btn-block" data-wipe style="color:var(--c-live)">${esc(t('profile.wipe'))}</button>
        </div>`;
      host.querySelector('[data-logout]').addEventListener('click', () => { logout(); go('/'); });
      host.querySelector('[data-wipe]').addEventListener('click', () => {
        sheet(`<h3>${esc(t('profile.wipe_t'))}</h3><p class="muted">${esc(t('profile.wipe_d'))}</p>
          <div class="stack mt-6"><button class="btn btn-danger btn-block" data-yes>${esc(t('profile.wipe_yes'))}</button><button class="btn btn-ghost btn-block" data-close>${esc(t('common.cancel'))}</button></div>`,
        (panel, close) => panel.querySelector('[data-yes]').addEventListener('click', async () => {
          Object.keys(localStorage).filter((k) => k.startsWith('wt.') && k !== 'wt.lang').forEach((k) => localStorage.removeItem(k));
          try { indexedDB.deleteDatabase('wt-videos'); } catch {}
          close(); toast(t('profile.wiped')); go('/');
        }));
      });
    }
  }

  return {
    html,
    title: p.name,
    mount(root) {
      body(root);
      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
        tab = b.dataset.tab;
        root.querySelectorAll('[data-tab]').forEach((z) => z.setAttribute('aria-selected', z === b));
        body(root);
      }));
    },
  };
}
