import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, sheet, toast, demoBadge } from '../ui.js';
import { EVENTS, regionName, styleName } from '../data.js';
import { getAccess, grantAccess } from '../store.js';
import { newsArt } from '../art.js';
import { eventStatusBadge, priceLabel } from './media.js';

export default function live({ params }) {
  const ev = EVENTS.find((e) => e.id === params.id);
  if (!ev) return { redirect: '/media' };

  const hasAccess = () => ev.price === 0 || getAccess().includes(ev.id);

  function playerHtml() {
    if (!hasAccess()) {
      return `<div class="player">
        <div class="bg" style="color:var(--c-gray)">${newsArt.arena}</div>
        <div class="tl">${eventStatusBadge(ev)}</div>
        <div class="lock">
          ${icon.lock}
          <b style="font-size:1.1rem">${esc(t('live.locked'))}</b>
          <span class="muted">${esc(t('live.locked_hint', { p: ev.price }))}</span>
          <button class="btn btn-primary" data-buy>${esc(t('live.buy', { p: ev.price }))}</button>
        </div>
      </div>`;
    }
    const msg = ev.status === 'upcoming'
      ? t('live.starts', { d: fmtDate(ev.date, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) })
      : t('live.no_stream');
    return `<div class="player">
      <div class="bg" style="color:var(--c-gray)">${newsArt.arena}</div>
      <div class="tl">${eventStatusBadge(ev)}<span class="badge badge-free">${esc(t('live.access_ok'))}</span></div>
      <div class="lock">${icon.play.replace('<svg', '<svg style="color:var(--c-offwhite)"')}<b>${esc(msg)}</b><span class="muted" style="max-width:40ch">${esc(t('live.stream_note'))}</span></div>
    </div>`;
  }

  const html = `
  <section class="container section-tight">
    <a class="btn btn-quiet" href="#/media?tab=events">${icon.back}${esc(t('common.back'))}</a>
    <div class="row row-wrap mt-4">${eventStatusBadge(ev)}${demoBadge()}<span class="muted">${esc(tr(ev.venue))} · ${esc(tr(styleName(ev.style)))}</span></div>
    <h1 class="display mt-3" style="font-size:var(--fs-h1)">${esc(tr(ev.title))}</h1>
    <div class="grid-2 mt-8" style="align-items:start">
      <div id="player">${playerHtml()}</div>
      <div class="stack">
        <div class="panel">
          <div class="row between"><span class="eyebrow">${esc(t('live.access'))}</span><span class="price num">${esc(priceLabel(ev))}</span></div>
          <p class="muted mt-3" style="font-size:var(--fs-small)">${esc(t(ev.status === 'replay' ? 'live.replay_note' : 'live.ppv_note'))}</p>
        </div>
        <div>
          <h2 class="eyebrow mb-4" style="margin-top:var(--s-6)">${esc(t('live.schedule'))}</h2>
          ${ev.matches.length ? `<div class="schedule">${ev.matches.map((m) => `
            <div class="item">
              <span class="t num">${m.time}</span>
              <div class="match-vs">
                <div class="side"><b>${esc(m.a)}</b><span>${esc(tr(regionName(m.ar)))}</span></div>
                <span class="x">VS</span>
                <div class="side r"><b>${esc(m.b)}</b><span>${esc(tr(regionName(m.br)))}</span></div>
              </div>
              <span class="badge">${m.w} ${esc(t('unit.kg'))}</span>
            </div>`).join('')}</div>`
          : `<div class="empty" style="padding:var(--s-8) 0"><h3>${esc(t('live.no_schedule'))}</h3></div>`}
        </div>
      </div>
    </div>
  </section>`;

  return {
    html,
    title: tr(ev.title),
    mount(root) {
      const bind = () => {
        root.querySelector('[data-buy]')?.addEventListener('click', () => {
          sheet(`
            <h3>${esc(t('live.buy_title'))}</h3>
            <p class="muted">${esc(tr(ev.title))}</p>
            <div class="summary mt-6">
              <div class="line"><span>${esc(t('live.ticket'))}</span><b class="num">${ev.price} TMT</b></div>
            </div>
            <div class="notice mt-6">${icon.info}<div>${esc(t('live.pay_not_connected'))}</div></div>
            <div class="stack mt-6">
              <button class="btn btn-primary btn-block" data-demo-access>${esc(t('live.demo_access'))}</button>
              <button class="btn btn-ghost btn-block" data-close>${esc(t('common.cancel'))}</button>
            </div>`, (panel, close) => {
            panel.querySelector('[data-demo-access]').addEventListener('click', () => {
              grantAccess(ev.id);
              close();
              root.querySelector('#player').innerHTML = playerHtml();
              toast(t('live.access_granted'));
            });
          });
        });
      };
      bind();
    },
  };
}
