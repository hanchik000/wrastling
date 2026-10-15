import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
import { mountMotionIntelligence } from '../motion.js';
import { DEMO_ATHLETES, EVENTS, NEWS, regionName, styleName } from '../data.js';
import { newsArt, productArt } from '../art.js';
import { boardRows } from './media.js';

export default function home() {
  const ev = EVENTS[0];
  const kids = DEMO_ATHLETES.filter((a) => a.age < 18).sort((a, b) => b.score - a.score).slice(0, 5);

  const html = `
  <section class="hero gol-bg">
    <div class="container hero-grid">
      <div>
        <p class="eyebrow">${esc(t('home.eyebrow'))}</p>
        <h1 class="display mt-4">${t('home.title')}</h1>
        <p class="lead">${esc(t('home.lead'))}</p>
        <div class="cta">
          <a class="btn btn-primary" href="#/scout">${esc(t('home.cta_test'))} ${icon.arrow}</a>
          <a class="btn btn-ghost" href="#/media">${esc(t('home.cta_events'))}</a>
        </div>
        <div class="hero-facts">
          <div><b class="num">4</b><span>${esc(t('home.fact_styles'))}</span></div>
          <div><b class="num">7–22</b><span>${esc(t('home.fact_ages'))}</span></div>
          <div><b>0 TMT</b><span>${esc(t('home.fact_free'))}</span></div>
        </div>
      </div>

      <div class="mi-stage" id="mi-stage">
        <div class="mi-hud">
          <span>Motion Intelligence</span>
          <span class="rec"><i></i>${esc(t('home.mi_tracking'))}</span>
        </div>
        <div class="mi-metrics" aria-live="off">
          <div class="mi-metric"><span>${esc(t('home.mi_knee'))}</span><b class="num"><span data-mi="knee">0</span><small>°</small></b></div>
          <div class="mi-metric"><span>${esc(t('home.mi_hip'))}</span><b class="num"><span data-mi="hipH">0</span><small>%</small></b></div>
          <div class="mi-metric"><span>${esc(t('home.mi_torso'))}</span><b class="num"><span data-mi="torso">0</span><small>°</small></b></div>
        </div>
        <div class="mi-timeline"><i></i></div>
        <div class="mi-foot">
          <span class="badge badge-demo">${esc(t('home.mi_example'))}</span>
          <button class="btn btn-ghost btn-sm" type="button" data-replay>${icon.replay}${esc(t('home.mi_replay'))}</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <div><p class="eyebrow">Talent Scout</p><h2 class="display mt-2">${esc(t('home.how_title'))}</h2></div>
        <a class="btn btn-ghost btn-sm" href="#/scout">${esc(t('home.how_cta'))} ${icon.arrow}</a>
      </div>
      <div class="steps3 reveal">
        ${[1, 2, 3].map((n) => `<div><span class="n num">0${n}</span><h3>${esc(t(`home.how_${n}_t`))}</h3><p class="muted">${esc(t(`home.how_${n}_d`))}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section-tight">
    <div class="container">
      <div class="section-head reveal"><div><p class="eyebrow">${esc(t('home.trust_eyebrow'))}</p><h2 class="display mt-2">${esc(t('home.trust_title'))}</h2></div></div>
      <div class="honesty reveal">
        <div><span class="badge badge-measured">${esc(t('label.measured'))}</span><p>${esc(t('home.trust_measured'))}</p></div>
        <div><span class="badge badge-model">${esc(t('label.model'))}</span><p>${esc(t('home.trust_model'))}</p></div>
        <div><span class="badge badge-coach">${esc(t('label.coach'))}</span><p>${esc(t('home.trust_coach'))}</p></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <a class="event-hero reveal" href="#/live/${ev.id}" style="text-decoration:none">
        <div class="art">${newsArt.arena}</div>
        <div class="inner">
          <div class="row row-wrap"><span class="badge badge-live">LIVE</span>${demoBadge()}<span class="muted">${esc(tr(ev.venue))} · ${esc(tr(styleName(ev.style)))}</span></div>
          <h3>${esc(tr(ev.title))}</h3>
          <div class="row row-wrap"><span class="btn btn-primary btn-sm">${esc(t('home.watch'))} ${icon.arrow}</span><span class="muted">${esc(t('media.price_from', { p: ev.price }))}</span></div>
        </div>
      </a>
    </div>
  </section>

  <section class="section-tight">
    <div class="container grid-2">
      <div class="reveal">
        <div class="section-head" style="margin-bottom:var(--s-4)">
          <div><p class="eyebrow">${esc(t('media.rankings'))}</p><h2 class="display mt-2">${esc(t('rank.kids'))}</h2></div>
          ${demoBadge()}
        </div>
        <div class="board">${boardRows(kids)}</div>
        <a class="btn btn-ghost btn-sm mt-6" href="#/media?tab=rankings">${esc(t('home.all_rankings'))} ${icon.arrow}</a>
      </div>
      <div class="reveal">
        <div class="section-head" style="margin-bottom:var(--s-4)"><div><p class="eyebrow">${esc(t('media.news'))}</p><h2 class="display mt-2">${esc(t('home.news_title'))}</h2></div></div>
        <div class="list">
          ${NEWS.map((n) => `<a class="list-row" href="#/news/${n.id}">
            <div class="avatar sm" style="color:var(--text)">${newsArt[n.art]}</div>
            <div class="grow"><span class="eyebrow">${esc(tr(n.tag))} · ${esc(fmtDate(n.date))}</span><b style="display:block;margin-top:2px">${esc(tr(n.title))}</b></div>
            ${icon.arrow.replace('<svg', '<svg width="18" height="18"')}
          </a>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head reveal"><div><p class="eyebrow">${esc(t('nav.shop'))}</p><h2 class="display mt-2">${esc(t('home.shop_title'))}</h2></div></div>
      <div class="grid-2 reveal">
        <a class="panel-flat" href="#/shop" style="text-decoration:none;display:grid;gap:12px;min-height:240px;align-content:space-between">
          <div style="width:120px;color:var(--text)">${productArt.shoe}</div>
          <div><b class="display" style="font-size:1.8rem">${esc(t('shop.gear'))}</b><p class="muted mt-1">${esc(t('home.shop_gear'))}</p></div>
        </a>
        <a class="panel-flat" href="#/shop/nutrition" style="text-decoration:none;display:grid;gap:12px;min-height:240px;align-content:space-between">
          <div style="width:120px;color:var(--text)">${productArt.tub}</div>
          <div><b class="display" style="font-size:1.8rem">${esc(t('shop.nutrition'))}</b><p class="muted mt-1">${esc(t('home.shop_nutri'))}</p></div>
        </a>
      </div>
    </div>
  </section>

  <section class="section gol-bg" style="border-top:1px solid var(--line)">
    <div class="container center reveal" style="display:grid;justify-items:center;gap:var(--s-5)">
      <h2 class="display" style="font-size:var(--fs-h1);max-width:16ch">${esc(t('home.final_title'))}</h2>
      <p class="muted max-prose">${esc(t('home.final_lead'))}</p>
      <a class="btn btn-gold" href="#/scout">${esc(t('home.cta_test'))} ${icon.arrow}</a>
    </div>
  </section>`;

  let mi;
  return {
    html,
    title: t('nav.home'),
    mount(root) {
      const stage = root.querySelector('#mi-stage');
      mi = mountMotionIntelligence(stage);
      root.querySelector('[data-replay]').addEventListener('click', () => mi.replay());
    },
    unmount() { mi?.stop(); },
  };
}
