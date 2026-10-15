import { t, tr, fmtMoney } from '../i18n.js';
import { esc, icon, toast, demoBadge } from '../ui.js';
import { productById, PRODUCTS } from '../data.js';
import { productArt } from '../art.js';
import { addToCart, getFavs, toggleFav } from '../store.js';
import { nutritionBlocked, productCard } from './shop.js';

export default function product({ params, user }) {
  const p = productById(params.id);
  if (!p) return { redirect: '/shop' };
  if (p.store === 'nutrition' && nutritionBlocked(user)) return { redirect: '/shop/nutrition' };

  let size = null;
  let color = p.colors[0] || null;
  let qty = 1;
  const needSize = p.sizes.length > 0;
  const out = p.stock === 0;
  const isNutri = p.store === 'nutrition';
  const related = PRODUCTS.filter((z) => z.store === p.store && z.id !== p.id && !z.merchSoon).slice(0, 4);

  const html = `
  <section class="container">
    <a class="btn btn-quiet mt-4" href="#/shop${isNutri ? '/nutrition' : ''}">${icon.back}${esc(t(isNutri ? 'shop.nutrition' : 'shop.gear'))}</a>
    <div class="pdp">
      <div class="ph" style="color:var(--text)">${productArt[p.art]}<span class="badge" style="position:absolute;left:14px;top:14px;background:var(--surface)">${esc(t('shop.photo_soon'))}</span></div>
      <div class="stack">
        <div class="row row-wrap"><span class="eyebrow">${esc(t('shop.cat_' + p.cat))}</span>${demoBadge()}</div>
        <h1 class="display" style="font-size:var(--fs-h2);text-transform:none;line-height:1.1">${esc(tr(p.name))}</h1>
        <p class="price num" style="font-size:2rem">${p.merchSoon ? esc(t('shop.soon')) : esc(fmtMoney(p.price))}</p>
        <p class="muted">${esc(tr(p.desc))}</p>

        ${p.colors.length > 1 ? `<div class="field"><span class="label">${esc(t('shop.color'))}</span><div class="swatches">${p.colors.map((c) => `<button type="button" data-color="${c}" style="background:${c}" aria-pressed="${c === color}" aria-label="${c}"></button>`).join('')}</div></div>` : ''}
        ${needSize ? `<div class="field" id="f-size"><span class="label">${esc(t('shop.size'))}</span><div class="size-grid">${p.sizes.map((s) => `<button type="button" data-size="${s}" aria-pressed="false" ${p.soldOut?.includes(s) ? 'disabled' : ''}>${s}</button>`).join('')}</div><span class="error">${esc(t('shop.size_err'))}</span></div>` : ''}

        <div class="row" style="font-size:var(--fs-small)">${out ? `<span class="badge">${esc(t('shop.out'))}</span>` : p.stock <= 3 ? `<span class="badge badge-gold">${esc(t('shop.few_n', { n: p.stock }))}</span>` : `<span class="badge badge-measured">${esc(t('shop.in_stock'))}</span>`}</div>

        <div class="row mt-2">
          <div class="qty" ${out || p.merchSoon ? 'hidden' : ''}><button type="button" data-q="-1" aria-label="−">−</button><span class="num" data-qv>1</span><button type="button" data-q="1" aria-label="+">+</button></div>
          <button class="btn btn-primary grow" data-add ${out || p.merchSoon ? 'disabled' : ''}>${icon.cart}${esc(t('shop.add'))}</button>
          <button class="icon-btn" data-fav aria-pressed="${getFavs().includes(p.id)}" aria-label="${esc(t('shop.fav'))}" style="border-color:var(--line-strong);color:var(--text)">${getFavs().includes(p.id) ? icon.heartFill : icon.heart}</button>
        </div>

        ${isNutri ? `
        <div class="panel mt-4">
          <h2 class="eyebrow mb-3">${esc(t('shop.facts'))}</h2>
          <table class="nutri">${p.facts.map(([k, v]) => `<tr><td>${esc(t('fact.' + k))}</td><td>${esc(v)}</td></tr>`).join('')}</table>
          <p class="mt-4" style="font-size:var(--fs-small)"><b>${esc(t('shop.serving'))}:</b> ${esc(tr(p.serving))}</p>
          <p class="mt-2" style="font-size:var(--fs-small)"><b>${esc(t('shop.ingredients'))}:</b> ${esc(tr(p.ingredients))}</p>
          <p class="mt-2" style="font-size:var(--fs-small)"><b>${esc(t('shop.allergens'))}:</b> ${esc(tr(p.allergens))}</p>
          <p class="mt-2" style="font-size:var(--fs-small)"><b>${esc(t('shop.seller'))}:</b> ${esc(t('shop.seller_fed'))}</p>
        </div>
        <div class="notice ${p.cert === 'ok' ? 'ok' : ''}">${icon.shield}<div>${esc(t(p.cert === 'ok' ? 'shop.cert_ok' : 'shop.cert_pending'))}</div></div>
        <p class="muted" style="font-size:var(--fs-micro)">${esc(t('shop.no_claims'))}</p>` : `
        <div class="list mt-4">
          <div class="list-row" style="font-size:var(--fs-small)">${icon.truck.replace('<svg', '<svg width="20" height="20"')}<span>${esc(t('shop.f_delivery_d'))}</span></div>
          <div class="list-row" style="font-size:var(--fs-small)">${icon.replay.replace('<svg', '<svg width="20" height="20"')}<span>${esc(t('shop.f_return_d'))}</span></div>
          <div class="list-row" style="font-size:var(--fs-small)">${icon.shield.replace('<svg', '<svg width="20" height="20"')}<span>${esc(t('shop.seller'))}: ${esc(t('shop.seller_fed'))}</span></div>
        </div>`}
      </div>
    </div>
    ${related.length ? `<h2 class="eyebrow mb-6">${esc(t('shop.related'))}</h2><div class="products" style="padding-bottom:var(--s-16)">${related.map(productCard).join('')}</div>` : ''}
  </section>`;

  return {
    html,
    theme: 'light',
    title: tr(p.name),
    mount(root) {
      root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
        size = b.dataset.size;
        root.querySelectorAll('[data-size]').forEach((z) => z.setAttribute('aria-pressed', z === b));
        root.querySelector('#f-size').classList.remove('invalid');
      }));
      root.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
        color = b.dataset.color;
        root.querySelectorAll('[data-color]').forEach((z) => z.setAttribute('aria-pressed', z === b));
      }));
      root.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
        qty = Math.max(1, Math.min(p.stock || 1, qty + +b.dataset.q));
        root.querySelector('[data-qv]').textContent = qty;
      }));
      root.querySelector('[data-add]').addEventListener('click', () => {
        if (needSize && !size) { root.querySelector('#f-size').classList.add('invalid'); toast(t('shop.size_err'), 'error'); return; }
        addToCart({ id: p.id, size, color, qty, price: p.price });
        toast(t('shop.added'));
      });
      root.querySelector('[data-fav]').addEventListener('click', (e) => {
        const on = toggleFav(p.id);
        e.currentTarget.innerHTML = on ? icon.heartFill : icon.heart;
        e.currentTarget.setAttribute('aria-pressed', on);
      });
    },
  };
}
