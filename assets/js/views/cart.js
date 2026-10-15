import { t, tr, fmtMoney } from '../i18n.js';
import { esc, icon } from '../ui.js';
import { productById } from '../data.js';
import { productArt } from '../art.js';
import { getCart, setCart } from '../store.js';

export const DELIVERY_FEE = 20;
export const FREE_FROM = 500;

export function totals(cart) {
  const sub = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = sub === 0 || sub >= FREE_FROM ? 0 : DELIVERY_FEE;
  return { sub, delivery, total: sub + delivery };
}

export default function cart() {
  const html = `<section class="container section-tight" style="padding-bottom:var(--s-16)">
    <p class="eyebrow">${esc(t('nav.shop'))}</p>
    <h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(t('cart.title'))}</h1>
    <div id="cart-body" class="mt-8"></div>
  </section>`;

  function render(root) {
    const c = getCart();
    const host = root.querySelector('#cart-body');
    if (!c.length) {
      host.innerHTML = `<div class="empty">${icon.cart}<h3>${esc(t('cart.empty'))}</h3><a class="btn btn-primary mt-2" href="#/shop">${esc(t('cart.go_shop'))}</a></div>`;
      return;
    }
    const { sub, delivery, total } = totals(c);
    host.innerHTML = `<div class="grid-2" style="align-items:start">
      <div>${c.map((l, i) => {
        const p = productById(l.id);
        return `<div class="cart-line">
          <div class="ph" style="color:var(--text)">${productArt[p.art]}</div>
          <div><b>${esc(tr(p.name))}</b><div class="muted" style="font-size:var(--fs-small)">${l.size ? esc(t('shop.size')) + ': ' + esc(l.size) : ''}${l.color ? ` <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${l.color};vertical-align:middle;margin-left:6px;border:1px solid var(--line-strong)"></span>` : ''}</div>
            <div class="row mt-2"><div class="qty"><button data-i="${i}" data-d="-1" aria-label="−">−</button><span class="num">${l.qty}</span><button data-i="${i}" data-d="1" aria-label="+">+</button></div><button class="btn btn-quiet btn-sm" data-rm="${i}">${esc(t('cart.remove'))}</button></div>
          </div>
          <b class="num">${esc(fmtMoney(l.price * l.qty))}</b>
        </div>`;
      }).join('')}</div>
      <div class="panel summary">
        <div class="line"><span>${esc(t('cart.subtotal'))}</span><b class="num">${esc(fmtMoney(sub))}</b></div>
        <div class="line"><span>${esc(t('cart.delivery'))}</span><b class="num">${delivery ? esc(fmtMoney(delivery)) : esc(t('cart.free'))}</b></div>
        ${delivery ? `<p class="muted" style="font-size:var(--fs-micro)">${esc(t('cart.free_from', { n: FREE_FROM }))}</p>` : ''}
        <div class="line total"><span>${esc(t('cart.total'))}</span><span class="num">${esc(fmtMoney(total))}</span></div>
        <a class="btn btn-primary btn-block mt-2" href="#/checkout">${esc(t('cart.checkout'))} ${icon.arrow}</a>
      </div>
    </div>`;
    host.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
      const cc = getCart(); const l = cc[+b.dataset.i];
      const max = productById(l.id).stock || 1;
      l.qty = Math.max(1, Math.min(max, l.qty + +b.dataset.d));
      setCart(cc); render(root);
    }));
    host.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
      const cc = getCart(); cc.splice(+b.dataset.rm, 1); setCart(cc); render(root);
    }));
  }

  return { html, theme: 'light', title: t('cart.title'), mount: render };
}
