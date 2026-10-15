// Оформление заказа. Оплата — при получении (наличными или картой курьеру).
// Курьерская служба ещё не подключена: заказ сохраняется на устройстве и помечается как демо.
import { t, tr, fmtMoney } from '../i18n.js';
import { esc, icon, sheet } from '../ui.js';
import { REGIONS, productById } from '../data.js';
import { getCart, setCart, addOrder, getUser } from '../store.js';
import { totals } from './cart.js';

export default function checkout({ go }) {
  const cart = getCart();
  if (!cart.length) return { redirect: '/cart' };
  const user = getUser();
  const { sub, delivery, total } = totals(cart);

  const html = `<section class="container section-tight" style="padding-bottom:var(--s-16)">
    <a class="btn btn-quiet" href="#/cart">${icon.back}${esc(t('cart.title'))}</a>
    <h1 class="display mt-4" style="font-size:var(--fs-h1)">${esc(t('checkout.title'))}</h1>
    <div class="grid-2 mt-8" style="align-items:start">
      <form class="stack" data-form novalidate>
        <h2 class="eyebrow">${esc(t('checkout.contact'))}</h2>
        <div class="field" id="f-n"><label for="n">${esc(t('profile.name'))}</label><input id="n" class="input" autocomplete="name" value="${esc(user?.profile?.name || '')}"><span class="error">${esc(t('form.required'))}</span></div>
        <div class="field" id="f-p"><label for="p">${esc(t('auth.phone'))}</label><div class="input-prefix"><span>+993</span><input id="p" class="input" inputmode="tel" value="${esc(user?.phone || '')}"></div><span class="error">${esc(t('auth.phone_err'))}</span></div>
        <h2 class="eyebrow mt-6">${esc(t('checkout.address'))}</h2>
        <div class="field"><label for="r">${esc(t('profile.region'))}</label><select id="r" class="input">${REGIONS.map((x) => `<option value="${x.id}" ${user?.profile?.region === x.id ? 'selected' : ''}>${esc(tr(x.name))}</option>`).join('')}</select></div>
        <div class="field" id="f-a"><label for="a">${esc(t('checkout.street'))}</label><input id="a" class="input" autocomplete="street-address"><span class="error">${esc(t('form.required'))}</span></div>
        <div class="field"><label for="c">${esc(t('checkout.comment'))} <span class="muted">(${esc(t('form.optional'))})</span></label><textarea id="c" class="input"></textarea></div>
        <h2 class="eyebrow mt-6">${esc(t('checkout.payment'))}</h2>
        <label class="radio-card"><input type="radio" name="pay" value="cash" checked><span><b>${esc(t('checkout.cash'))}</b><br><span class="muted" style="font-size:var(--fs-small)">${esc(t('checkout.on_delivery'))}</span></span></label>
        <label class="radio-card"><input type="radio" name="pay" value="card"><span><b>${esc(t('checkout.card'))}</b><br><span class="muted" style="font-size:var(--fs-small)">${esc(t('checkout.on_delivery'))}</span></span></label>
        <div class="notice">${icon.info}<div>${esc(t('checkout.demo_note'))}</div></div>
        <button class="btn btn-primary btn-block" type="submit">${esc(t('checkout.place', { s: fmtMoney(total) }))}</button>
      </form>
      <div class="panel summary">
        ${cart.map((l) => `<div class="line" style="font-size:var(--fs-small)"><span>${esc(tr(productById(l.id).name))}${l.size ? ' · ' + esc(l.size) : ''} × ${l.qty}</span><span class="num">${esc(fmtMoney(l.price * l.qty))}</span></div>`).join('')}
        <div class="line" style="border-top:1px solid var(--line);padding-top:10px"><span>${esc(t('cart.delivery'))}</span><span class="num">${delivery ? esc(fmtMoney(delivery)) : esc(t('cart.free'))}</span></div>
        <div class="line total"><span>${esc(t('cart.total'))}</span><span class="num">${esc(fmtMoney(total))}</span></div>
      </div>
    </div>
  </section>`;

  return {
    html,
    theme: 'light',
    title: t('checkout.title'),
    mount(root) {
      root.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = root.querySelector('#n').value.trim();
        const phone = root.querySelector('#p').value.replace(/\D/g, '');
        const addr = root.querySelector('#a').value.trim();
        let ok = true;
        const mark = (id, bad) => { root.querySelector(id).classList.toggle('invalid', bad); if (bad) ok = false; };
        mark('#f-n', name.length < 2);
        mark('#f-p', !/^6\d{7}$/.test(phone));
        mark('#f-a', addr.length < 5);
        if (!ok) { root.querySelector('.invalid input')?.focus(); return; }
        const number = 'D-' + Date.now().toString().slice(-6);
        addOrder({
          number, createdAt: new Date().toISOString(), lines: cart, sub, delivery, total,
          name, phone, region: root.querySelector('#r').value, address: addr,
          comment: root.querySelector('#c').value.trim(),
          payment: root.querySelector('input[name=pay]:checked').value,
          status: 'demo',
        });
        setCart([]);
        sheet(`<div class="center" style="display:grid;justify-items:center;gap:12px">
            <div style="width:56px;height:56px;border-radius:50%;background:var(--c-signal);color:#000;display:grid;place-items:center">${icon.check}</div>
            <h3>${esc(t('checkout.done_t', { n: number }))}</h3>
            <p class="muted">${esc(t('checkout.done'))}</p>
            <button class="btn btn-primary btn-block mt-4" data-close>${esc(t('common.ok'))}</button>
          </div>`, (panel) => panel.querySelector('[data-close]').addEventListener('click', () => go(user?.profile ? '/profile' : '/shop')));
      });
    },
  };
}
