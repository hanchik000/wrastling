// Главная в формате спортивного портала: баннер-слайдер, разделы, календарь, рейтинг,
// баннер отбора, новости, магазин, партнёры.
import { t, tr, fmtDate, fmtMoney } from '../i18n.js';
import { esc, icon, demoBadge, photoSlot, sheet, reduceMotion, hydratePhotos } from '../ui.js';
import { DEMO_ATHLETES, EVENTS, NEWS, PRODUCTS, TESTS, regionName, styleName } from '../data.js';
import { newsArt, productArt, wrestlersArt } from '../art.js';
import { rankTable } from './rankings.js';

const SLIDE_MS = 7000;

function slides() {
  const live = EVENTS.find((e) => e.status === 'live');
  return [
    {
      key: 'scout', photo: 'hero-1', art: wrestlersArt('shot', { uid: 'h1' }),
      tag: `<span class="tag-gold">Talent Scout</span>`,
      title: t('home.s1_title'), sub: t('home.s1_sub'),
      ctas: `<a class="btn btn-gold" href="#/scout">${esc(t('home.cta_test'))} ${icon.arrow}</a><a class="btn btn-ghost" href="#/scout">${esc(t('home.how_cta'))}</a>`,
      tab: t('home.s1_tab'),
    },
    {
      key: 'asia', photo: 'hero-2', art: wrestlersArt('clinch', { uid: 'ha' }), credit: 'Sportal',
      tag: `<span class="tag-gold">${esc(t('home.asia_tag'))}</span>`,
      title: t('home.asia_title'), sub: t('home.asia_sub'),
      ctas: `<a class="btn btn-primary" href="#/media?tab=events">${esc(t('home.all_events'))} ${icon.arrow}</a>`,
      tab: t('home.asia_tab'),
    },
    {
      key: 'alp', photo: 'hero-3', art: wrestlersArt('single', { uid: 'hp' }), credit: 'United World Wrestling',
      tag: `<span class="tag-dark">United World Wrestling</span>`,
      title: t('home.alp_title'), sub: t('home.alp_sub'),
      ctas: `<a class="btn btn-gold" href="#/rankings">${esc(t('home.open_rank'))} ${icon.arrow}</a>`,
      tab: t('home.alp_tab'),
    },
    {
      key: 'live', photo: 'hero-live', credit: 'United World Wrestling', art: wrestlersArt('clinch', { uid: 'h2', tone: 'red' }),
      tag: `<span class="tag-red">● LIVE</span> <span class="tag-dark">${esc(t('common.demo'))}</span>`,
      title: esc(tr(live.title)), sub: `${tr(live.venue)} · ${t('home.today')} 15:00 · ${tr(styleName(live.style))}`,
      ctas: `<a class="btn btn-red" href="#/live/${live.id}">${icon.play}${esc(t('home.watch_live'))}</a><a class="btn btn-ghost" href="#/media?tab=events">${esc(t('home.calendar'))}</a>`,
      tab: t('home.s2_tab'),
    },
    {
      key: 'shop', photo: 'hero-4', art: `<div style="width:62%;height:70%;margin:auto;color:#3a3b42">${productArt.shoe}</div>`,
      tag: `<span class="tag-dark">${esc(t('nav.shop'))}</span>`,
      title: t('home.s4_title'), sub: t('home.s4_sub'),
      ctas: `<a class="btn btn-primary" href="#/shop">${esc(t('home.to_shop'))} ${icon.arrow}</a>`,
      tab: t('home.s4_tab'),
    },
  ];
}

function fixtureCard(ev) {
  const d = new Date(ev.date);
  const live = ev.status === 'live';
  const badge = live ? `<span class="badge badge-live">LIVE</span>` : ev.status === 'replay' ? `<span class="badge">${esc(t('media.recording'))}</span>` : `<span class="badge">${esc(t('media.upcoming'))}</span>`;
  return `<a class="fixture ${live ? 'live' : ''}" href="#/live/${ev.id}">
    <div class="d"><b class="num">${d.getDate()}</b><span>${esc(fmtDate(d, { month: 'short' }).replace('.', ''))}</span></div>
    <div class="i">
      <div class="row between">${badge}<span class="meta">${esc(tr(styleName(ev.style)))}</span></div>
      <h3>${esc(tr(ev.title))}</h3>
      <div class="meta">${esc(tr(ev.venue))} · ${esc(fmtDate(d, { hour: '2-digit', minute: '2-digit' }))}</div>
      <div class="foot"><span>${ev.price > 0 ? ev.price + ' TMT' : esc(t('media.free'))}</span><span class="gold">${esc(t(live ? 'home.watch' : ev.status === 'replay' ? 'home.replay' : 'home.details'))} →</span></div>
    </div>
  </a>`;
}

export default function home() {
  const S = slides();
  const kids = DEMO_ATHLETES.filter((a) => a.age < 18).sort((a, b) => b.score - a.score);
  const adults = DEMO_ATHLETES.filter((a) => a.age >= 18).sort((a, b) => b.score - a.score);
  const leader = adults[0]; // фото детей в публичных разделах не показываем
  const live = EVENTS.find((e) => e.status === 'live');
  const gear = PRODUCTS.filter((p) => p.store === 'gear' && !p.merchSoon).slice(0, 4);
  const minPrice = Math.min(...PRODUCTS.filter((p) => p.price > 0).map((p) => p.price));
  const [n1, n2, n3] = NEWS;

  const html = `
  <div class="live-strip"><div class="container">
    <a href="#/live/${live.id}"><b>LIVE</b><span class="txt">${esc(tr(live.title))} · ${esc(tr(live.venue))} · 15:00</span><span style="white-space:nowrap">${esc(t('home.watch'))} →</span></a>
  </div></div>

  <section class="slider" id="slider" aria-roledescription="carousel" aria-label="${esc(t('home.slider_aria'))}" style="--slide-ms:${SLIDE_MS}ms">
    ${S.map((s, i) => `
      <div class="slide ${i === 0 ? 'on' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${S.length}" ${i ? 'aria-hidden="true"' : ''}>
        ${photoSlot(s.photo, s.art)}
        <span class="big-num num" aria-hidden="true">0${i + 1}</span>
        ${s.credit ? `<span class="credit">${esc(t('home.photo'))}: ${esc(s.credit)}</span>` : ''}
        <div class="container content">
          <div class="row row-wrap" style="gap:8px">${s.tag}</div>
          ${i === 0 ? `<h1>${s.title}</h1>` : `<h2 class="h1">${s.title}</h2>`}
          <p class="sub">${esc(s.sub)}</p>
          <div class="ctas">${s.ctas}</div>
        </div>
      </div>`).join('')}
    <div class="slider-promos">
      <a class="promo red" href="#/live/${live.id}"><span>● LIVE · ${esc(t('home.today'))}</span><b>${esc(tr(live.title))}</b></a>
      <a class="promo" href="#/scout"><span class="gold">Talent Scout</span><b>${esc(t('home.promo_scout'))}</b></a>
    </div>
    <div class="slide-tabs"><div class="container" role="tablist" style="grid-template-columns:repeat(${S.length},1fr)">
      ${S.map((s, i) => `<button role="tab" data-slide="${i}" aria-selected="${i === 0}"><i></i><b class="num">0${i + 1}</b><span>${esc(s.tab)}</span></button>`).join('')}
    </div></div>
  </section>

  <nav class="pillars" aria-label="${esc(t('home.sections'))}">
    <a class="pillar" href="#/rankings"><span class="ic">${icon.trophy}</span><b>${esc(t('nav.rankings'))}</b><span>${DEMO_ATHLETES.length} ${esc(t('home.p_athletes'))}</span></a>
    <a class="pillar" href="#/media?tab=events"><span class="ic">${icon.clock}</span><b>${esc(t('nav.events'))}</b><span>${EVENTS.length} ${esc(t('home.p_events'))}</span></a>
    <a class="pillar" href="#/scout"><span class="ic">${icon.scout}</span><b>${esc(t('home.p_scout'))}</b><span>${TESTS.length} ${esc(t('home.p_tests'))}</span></a>
    <a class="pillar" href="#/shop"><span class="ic">${icon.bag}</span><b>${esc(t('nav.shop'))}</b><span>${PRODUCTS.length} ${esc(t('home.p_products'))}</span></a>
  </nav>

  <section class="section">
    <div class="container">
      <div class="sec-title reveal"><h2><small>${esc(t('home.cal_eyebrow'))}</small>${esc(t('home.calendar'))}</h2><a class="link-more" href="#/media?tab=events">${esc(t('home.all_events'))} ${icon.arrow}</a></div>
      <div class="fixtures reveal">${EVENTS.slice().sort((a, b) => (a.status === 'live' ? -1 : b.status === 'live' ? 1 : new Date(a.date) - new Date(b.date))).map(fixtureCard).join('')}</div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="sec-title reveal"><h2><small>${esc(t('rank.eyebrow'))}</small>${esc(t('rank.title'))}</h2><div class="row">${demoBadge()}<a class="link-more" href="#/rankings">${esc(t('home.all_rankings'))} ${icon.arrow}</a></div></div>
      <div class="rank-wrap reveal">
        <a class="leader" href="#/rankings">
          ${photoSlot(leader.photo, wrestlersArt('single', { uid: 'leader' }), 'pos-top')}
          <div class="info">
            <span class="tag-gold">${esc(t('home.leader'))} · ${esc(t('rank.adults'))}</span>
            <div class="row" style="align-items:flex-end;gap:16px;margin-top:14px"><span class="no num">01</span><div><h3>${esc(leader.name)}</h3><span class="muted">${esc(tr(regionName(leader.region)))} · ${esc(tr(styleName(leader.style)))} · ${leader.weight} ${esc(t('unit.kg'))}</span></div></div>
            ${leader.real ? `<p class="mt-3" style="color:var(--c-gold);font-weight:600;font-size:var(--fs-small)">${esc(tr(leader.titles))}</p>` : ''}
            <div class="stats4">
              <div><b class="num">${leader.score.toFixed(1)}</b><span>${esc(t('rank.points'))}</span></div>
              ${leader.real
                ? `<div><b class="num">${leader.worldScore}</b><span>${esc(t('rank.world_u20'))}</span></div><div><b class="num">${leader.weight}</b><span>${esc(t('unit.kg'))}</span></div>`
                : `<div><b class="num">${leader.wins}</b><span>${esc(t('rank.wins'))}</span></div><div><b class="num">${leader.bouts}</b><span>${esc(t('rank.bouts'))}</span></div>`}
              <div><b class="num">${leader.medals}</b><span>${esc(t('rank.medals'))}</span></div>
            </div>
          </div>
        </a>
        <div>
          <div class="segmented mb-4" role="tablist">
            <button role="tab" data-rg="kids" aria-selected="true">${esc(t('rank.kids'))}</button>
            <button role="tab" data-rg="adults" aria-selected="false">${esc(t('rank.adults'))}</button>
          </div>
          <div id="home-rank">${rankTable(kids.slice(0, 7))}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="banner-red">
    <div class="container">
      <div class="reveal">
        <span class="tag-dark">Talent Scout · ${esc(t('scout.free'))}</span>
        <h2 class="mt-4">${t('home.banner_title')}</h2>
        <ul>
          <li>${icon.phone}<span>${esc(t('home.banner_1'))}</span></li>
          <li>${icon.scout}<span>${esc(t('home.banner_2'))}</span></li>
          <li>${icon.coach}<span>${esc(t('home.banner_3'))}</span></li>
        </ul>
        <div class="row row-wrap mt-8"><a class="btn btn-white" href="#/scout">${esc(t('home.cta_test'))} ${icon.arrow}</a><span style="opacity:.85;font-size:var(--fs-small)">${esc(t('home.banner_note'))}</span></div>
      </div>
      <div class="phone-mock reveal" aria-hidden="true">
        <div class="screen">
          <div class="bar"><span>${esc(t('metric.reps'))}</span><span style="color:#2fbf71">● ${esc(t('home.mi_tracking'))}</span></div>
          <div class="vid">${wrestlersArt('shot', { uid: 'phone' })}</div>
          <div class="res">
            <div><b class="num">18</b><span>${esc(t('metric.reps'))}</span></div>
            <div><b class="num">92°</b><span>${esc(t('home.mi_knee'))}</span></div>
            <div><b class="num">36</b><span>${esc(t('unit.per_min'))}</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="sec-title reveal"><h2><small>${esc(t('home.news_eyebrow'))}</small>${esc(t('home.news_title'))}</h2><a class="link-more" href="#/media?tab=news">${esc(t('home.all_news'))} ${icon.arrow}</a></div>
      <div class="news-grid reveal">
        ${[n1, n2, n3].map((n, i) => `
          <a class="ncard ${i === 0 ? 'big' : ''}" href="#/news/${n.id}">
            ${photoSlot('news-' + n.id, wrestlersArt(['clinch', 'shot', 'single'][i], { uid: 'news' + i, skeleton: i === 0, tone: i === 1 ? 'red' : 'gold' }), i === 0 ? 'pos-left' : '')}
            <div class="in">
              <div class="row" style="gap:8px"><span class="${i === 0 ? 'tag-red' : 'tag-dark'}">${esc(tr(n.tag))}</span>${n.demo ? `<span class="tag-dark">${esc(t('common.demo'))}</span>` : `<span class="tag-gold">${esc(t('news.real'))}</span>`}</div>
              <h3>${esc(tr(n.title))}</h3>
              <span class="date">${esc(fmtDate(n.date, { day: 'numeric', month: 'long' }))}</span>
            </div>
          </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="store-banner reveal">
        <div class="left">
          <div><span class="eyebrow" style="color:#0b0b0c">${esc(t('nav.shop'))}</span><h2 class="mt-3">${esc(t('home.store_title'))}</h2></div>
          <div class="from num"><small>${esc(t('home.price_from'))}</small>${esc(fmtMoney(minPrice))}</div>
          <div class="row row-wrap"><a class="btn" style="background:#0b0b0c;color:#f4f2ee" href="#/shop">${esc(t('shop.gear'))} ${icon.arrow}</a><a class="btn" style="border:1px solid #0b0b0c;color:#0b0b0c" href="#/shop/nutrition">${esc(t('shop.nutrition'))} 18+</a></div>
        </div>
        <div class="right">${gear.map((p) => `
          <a class="item" href="#/product/${p.id}"><div class="ph">${productArt[p.art]}</div><b>${esc(tr(p.name))}</b><span class="num">${esc(fmtMoney(p.price))}</span></a>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section-tight" style="padding-bottom:var(--s-16)">
    <div class="container">
      <div class="sec-title reveal"><h2><small>${esc(t('home.partners_eyebrow'))}</small>${esc(t('home.partners'))}</h2></div>
      <div class="partners reveal">
        ${[1, 2, 3, 4, 5].map(() => `<div><span class="slot" style="display:grid;place-items:center;width:calc(100% - 28px)">${esc(t('home.partner_slot'))}</span></div>`).join('')}
        <button class="become" data-partner>${esc(t('home.become_partner'))} →</button>
      </div>
    </div>
  </section>`;

  let timer = 0, idx = 0, paused = false;
  return {
    html,
    title: t('nav.home'),
    mount(root) {
      const slider = root.querySelector('#slider');
      const slideEls = [...slider.querySelectorAll('.slide')];
      const tabs = [...slider.querySelectorAll('[data-slide]')];
      const show = (i) => {
        idx = (i + slideEls.length) % slideEls.length;
        slideEls.forEach((s, k) => { s.classList.toggle('on', k === idx); s.toggleAttribute('aria-hidden', k !== idx); });
        tabs.forEach((b, k) => {
          b.setAttribute('aria-selected', k === idx);
          // перезапуск полоски прогресса
          const bar = b.querySelector('i'); bar.replaceWith(bar.cloneNode());
        });
        schedule();
      };
      const schedule = () => {
        clearTimeout(timer);
        if (reduceMotion() || paused) return;
        timer = setTimeout(() => show(idx + 1), SLIDE_MS);
      };
      tabs.forEach((b, k) => b.addEventListener('click', () => show(k)));
      const pause = (v) => { paused = v; slider.classList.toggle('paused', v); if (v) clearTimeout(timer); else schedule(); };
      slider.addEventListener('mouseenter', () => pause(true));
      slider.addEventListener('mouseleave', () => pause(false));
      slider.addEventListener('focusin', () => pause(true));
      slider.addEventListener('focusout', () => pause(false));
      // свайп на телефоне
      let x0 = null;
      slider.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        x0 = null;
      });
      schedule();

      root.querySelectorAll('[data-rg]').forEach((b) => b.addEventListener('click', () => {
        root.querySelectorAll('[data-rg]').forEach((z) => z.setAttribute('aria-selected', z === b));
        root.querySelector('#home-rank').innerHTML = rankTable((b.dataset.rg === 'kids' ? kids : adults).slice(0, 7));
        hydratePhotos(root);
      }));

      root.querySelector('[data-partner]').addEventListener('click', () => sheet(`
        <h3>${esc(t('home.become_partner'))}</h3>
        <p class="muted">${esc(t('home.partner_text'))}</p>
        <ul class="stack mt-6" style="list-style:none">${t('home.partner_list').map((x) => `<li class="row" style="align-items:flex-start">${icon.check.replace('<svg', '<svg width="18" height="18" style="color:var(--c-gold);flex:none;margin-top:3px"')}<span>${esc(x)}</span></li>`).join('')}</ul>
        <p class="muted mt-6" style="font-size:var(--fs-small)">${esc(t('home.partner_contact'))}</p>
        <button class="btn btn-primary btn-block mt-6" data-close>${esc(t('common.ok'))}</button>`));
    },
    unmount() { clearTimeout(timer); },
  };
}
