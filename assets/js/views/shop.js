import { initFx } from '../fx.js';
import { t, tr, fmtMoney } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
import { PRODUCTS, GEAR_CATS, NUTRI_CATS } from '../data.js';
import { productArt } from '../art.js';
import { ageOf, getFavs } from '../store.js';

export function nutritionBlocked(user) {
  const age = ageOf(user?.profile?.birthdate);
  if (user?.role === 'athlete' && age != null && age < 18) return 'minor';
  try { if (sessionStorage.getItem('wt.adult') === '1') return null; } catch {}
  if (user?.role === 'athlete' && age >= 18) return null;
  return 'confirm';
}

export function productCard(p) {
  const fav = getFavs().includes(p.id);
  const out = p.stock === 0;
  return `<a class="product" href="#/product/${p.id}">
    <div class="ph" style="color:var(--text)">${productArt[p.art]}
      ${p.merchSoon ? `<span class="badge">${esc(t('shop.soon'))}</span>` : out ? `<span class="badge">${esc(t('shop.out'))}</span>` : p.stock <= 3 ? `<span class="badge badge-gold">${esc(t('shop.few'))}</span>` : ''}
      ${fav ? `<span style="position:absolute;right:10px;top:10px;width:20px;color:var(--c-live)">${icon.heartFill}</span>` : ''}
    </div>
    <h3>${esc(tr(p.name))}</h3>
    <span class="meta">${esc(t('shop.cat_' + p.cat))}</span>
    <span class="p num">${p.merchSoon ? '—' : esc(fmtMoney(p.price))}</span>
  </a>`;
}

export default function shop({ params, user }) {
  const store = params.store === 'nutrition' ? 'nutrition' : 'gear';
  const cats = store === 'gear' ? GEAR_CATS : NUTRI_CATS;
  let cat = 'all';
  let q = '';
  let sort = 'pop';

  const gate = store === 'nutrition' ? nutritionBlocked(user) : null;

  const html = `
  <section class="container shop-hero">
    <span class="medallion" aria-hidden="true" style="color:#8a6a26;--o:.1;opacity:.1;width:300px;aspect-ratio:1.4;right:var(--gutter);top:24px"></span>
    <p class="eyebrow">${esc(t('nav.shop'))}</p>
    <h1 class="display mt-2">${esc(t(store === 'gear' ? 'shop.gear_title' : 'shop.nutri_title'))}</h1>
    <div class="store-switch mt-6">
      <a href="#/shop" aria-current="${store === 'gear'}"><b>${esc(t('shop.gear'))}</b><span class="muted" style="font-size:var(--fs-small)">${esc(t('shop.gear_sub'))}</span></a>
      <a href="#/shop/nutrition" aria-current="${store === 'nutrition'}"><b>${esc(t('shop.nutrition'))}</b><span class="muted" style="font-size:var(--fs-small)">${esc(t('shop.nutri_sub'))}</span></a>
    </div>
  </section>
  <section class="container" style="padding-bottom:var(--s-16)" id="shop-body"></section>`;

  function render(root) {
    const host = root.querySelector('#shop-body');
    if (gate === 'minor') {
      host.innerHTML = `<div class="age-gate"><span class="big">18+</span><h2>${esc(t('shop.minor_t'))}</h2><p class="muted max-prose">${esc(t('shop.minor'))}</p><a class="btn btn-primary" href="#/shop">${esc(t('shop.gear'))}</a></div>`;
      return;
    }
    if (gate === 'confirm' && sessionStorage.getItem('wt.adult') !== '1') {
      host.innerHTML = `<div class="age-gate"><span class="big">18+</span><h2>${esc(t('shop.adult_t'))}</h2><p class="muted max-prose">${esc(t('shop.adult'))}</p>
        <div class="row row-wrap" style="justify-content:center"><button class="btn btn-primary" data-adult>${esc(t('shop.adult_yes'))}</button><a class="btn btn-ghost" href="#/shop">${esc(t('shop.adult_no'))}</a></div></div>`;
      host.querySelector('[data-adult]').addEventListener('click', () => { try { sessionStorage.setItem('wt.adult', '1'); } catch {} render(root); });
      return;
    }
    let list = PRODUCTS.filter((p) => p.store === store)
      .filter((p) => cat === 'all' || p.cat === cat)
      .filter((p) => !q || tr(p.name).toLowerCase().includes(q.toLowerCase()));
    if (sort === 'asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'desc') list = [...list].sort((a, b) => b.price - a.price);
    host.innerHTML = `
      <div class="row row-wrap between mb-4">
        <div class="chips">${cats.map((c) => `<button class="chip" data-cat="${c}" aria-pressed="${c === cat}">${esc(t(c === 'all' ? 'common.all' : 'shop.cat_' + c))}</button>`).join('')}</div>
      </div>
      <div class="row row-wrap mb-8 shop-tools">
        <input class="input" type="search" placeholder="${esc(t('shop.search'))}" value="${esc(q)}" data-q aria-label="${esc(t('shop.search'))}">
        <select class="input" data-sort aria-label="${esc(t('shop.sort'))}">
          <option value="pop" ${sort === 'pop' ? 'selected' : ''}>${esc(t('shop.sort_pop'))}</option>
          <option value="asc" ${sort === 'asc' ? 'selected' : ''}>${esc(t('shop.sort_asc'))}</option>
          <option value="desc" ${sort === 'desc' ? 'selected' : ''}>${esc(t('shop.sort_desc'))}</option>
        </select>
        <span class="grow"></span>${demoBadge()}
      </div>
      ${store === 'nutrition' ? `<div class="notice info mb-8">${icon.shield}<div>${esc(t('shop.nutri_note'))}</div></div>` : ''}
      ${list.length ? `<div class="products" data-stagger>${list.map(productCard).join('')}</div>` : `<div class="empty">${icon.filter}<h3>${esc(t('shop.empty'))}</h3></div>`}
      <div class="grid-3 mt-12">
        <div class="row" style="align-items:flex-start">${icon.truck.replace('<svg', '<svg width="22" height="22" style="flex:none"')}<span><b>${esc(t('shop.f_delivery'))}</b><br><span class="muted" style="font-size:var(--fs-small)">${esc(t('shop.f_delivery_d'))}</span></span></div>
        <div class="row" style="align-items:flex-start">${icon.check.replace('<svg', '<svg width="22" height="22" style="flex:none"')}<span><b>${esc(t('shop.f_pay'))}</b><br><span class="muted" style="font-size:var(--fs-small)">${esc(t('shop.f_pay_d'))}</span></span></div>
        <div class="row" style="align-items:flex-start">${icon.replay.replace('<svg', '<svg width="22" height="22" style="flex:none"')}<span><b>${esc(t('shop.f_return'))}</b><br><span class="muted" style="font-size:var(--fs-small)">${esc(t('shop.f_return_d'))}</span></span></div>
      </div>`;
    host.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { cat = b.dataset.cat; render(root); }));
    const qi = host.querySelector('[data-q]');
    qi.addEventListener('input', () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { render(root); const n = root.querySelector('[data-q]'); n.focus(); n.setSelectionRange(q.length, q.length); }, 250); });
    host.querySelector('[data-sort]').addEventListener('change', (e) => { sort = e.target.value; render(root); });
    initFx(host);
  }

  return { html, theme: 'light', title: t('nav.shop'), mount: render };
}
