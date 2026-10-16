// Вход по номеру телефона и SMS-коду + анкета спортсмена + согласие родителя для детей до 18 лет.
// SMS-шлюз (Altyn Asyr) подключается на этапе 1; в демо код показывается на экране.
import { t, tr, LANGS, getLang, setLang, monthNames } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { REGIONS, STYLES, EXPERIENCE } from '../data.js';
import { getUser, setUser, ageOf, ageGroup } from '../store.js';

const DEMO_CODE = '1234';

// Дата рождения тремя списками: работает одинаково на всех телефонах,
// не нужно листать календарь от текущего года назад.
function dobSelects(value) {
  const [vy, vm, vd] = (value || '').split('-').map(Number);
  const now = new Date().getFullYear();
  const years = []; for (let y = now - 7; y >= now - 22; y--) years.push(y);
  const opt = (v, label, sel) => `<option value="${v}" ${sel ? 'selected' : ''}>${esc(String(label))}</option>`;
  return `<div class="dob" role="group" aria-labelledby="bd-label">
    <select id="bd-d" class="input" aria-label="${esc(t('auth.day'))}">${opt('', t('auth.day'), !vd)}${Array.from({ length: 31 }, (_, i) => opt(i + 1, i + 1, vd === i + 1)).join('')}</select>
    <select id="bd-m" class="input" aria-label="${esc(t('auth.month'))}">${opt('', t('auth.month'), !vm)}${monthNames().map((n, i) => opt(i + 1, n, vm === i + 1)).join('')}</select>
    <select id="bd-y" class="input" aria-label="${esc(t('auth.year'))}">${opt('', t('auth.year'), !vy)}${years.map((y) => opt(y, y, vy === y)).join('')}</select>
  </div>`;
}
function readDob(host) {
  const d = +host.querySelector('#bd-d').value, m = +host.querySelector('#bd-m').value, y = +host.querySelector('#bd-y').value;
  if (!d || !m || !y) return '';
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return ''; // например, 31 февраля
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function login({ query, go }) {
  const next = query.next || '/profile';
  const existing = getUser();
  let step = existing && !existing.profile ? 'profile' : 'phone';
  let phone = existing?.phone || '';
  let draft = { role: 'athlete', gender: 'm' };

  const html = `<section class="container section narrow" id="auth"></section>`;

  function codeInputs(name) {
    return `<div class="code-inputs" data-code="${name}">${[0, 1, 2, 3].map((i) => `<input inputmode="numeric" maxlength="1" aria-label="${esc(t('auth.digit', { n: i + 1 }))}" autocomplete="one-time-code">`).join('')}</div>`;
  }
  function bindCode(root, name, onFull) {
    const ins = [...root.querySelectorAll(`[data-code="${name}"] input`)];
    ins.forEach((inp, i) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '').slice(-1);
        if (inp.value && ins[i + 1]) ins[i + 1].focus();
        const v = ins.map((z) => z.value).join('');
        if (v.length === 4) onFull(v);
      });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
      inp.addEventListener('paste', (e) => {
        const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
        if (txt.length === 4) { e.preventDefault(); txt.split('').forEach((c, k) => (ins[k].value = c)); onFull(txt); }
      });
    });
    setTimeout(() => ins[0]?.focus(), 50);
    return () => ins.forEach((z) => (z.value = ''));
  }

  function render(root) {
    const host = root.querySelector('#auth');
    const stepper = (n) => `<div class="stepper" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;

    if (step === 'phone') {
      host.innerHTML = `
        ${stepper(1)}
        <h1 class="display mt-6" style="font-size:var(--fs-h2)">${esc(t('auth.title'))}</h1>
        <p class="muted mt-3">${esc(t('auth.lead'))}</p>
        <div class="field mt-6">
          <span class="label">${esc(t('auth.language'))}</span>
          <div class="segmented" role="group">${LANGS.map((l) => `<button type="button" data-l="${l.code}" aria-selected="${l.code === getLang()}">${l.label}</button>`).join('')}</div>
        </div>
        <form class="stack mt-6" novalidate data-form>
          <div class="field" id="f-phone">
            <label for="phone">${esc(t('auth.phone'))}</label>
            <div class="input-prefix"><span>+993</span><input id="phone" class="input" inputmode="tel" autocomplete="tel-national" placeholder="6X XX XX XX" value="${esc(phone)}"></div>
            <span class="error">${esc(t('auth.phone_err'))}</span>
          </div>
          <button class="btn btn-primary btn-block" type="submit">${esc(t('auth.get_code'))}</button>
        </form>`;
      host.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.l)));
      host.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = host.querySelector('#phone').value.replace(/\D/g, '');
        const ok = /^6\d{7}$/.test(v);
        host.querySelector('#f-phone').classList.toggle('invalid', !ok);
        if (!ok) return;
        phone = v;
        step = 'code';
        render(root);
      });
    } else if (step === 'code') {
      host.innerHTML = `
        ${stepper(1)}
        <button class="btn btn-quiet mt-4" data-back>${icon.back}${esc(t('common.back'))}</button>
        <h1 class="display mt-4" style="font-size:var(--fs-h2)">${esc(t('auth.code_title'))}</h1>
        <p class="muted mt-3">${esc(t('auth.code_sent', { p: '+993 ' + phone }))}</p>
        <div class="mt-6">${codeInputs('sms')}</div>
        <div class="notice mt-6">${icon.info}<div>${esc(t('auth.demo_code', { c: DEMO_CODE }))}</div></div>`;
      host.querySelector('[data-back]').addEventListener('click', () => { step = 'phone'; render(root); });
      const clear = bindCode(host, 'sms', (v) => {
        if (v !== DEMO_CODE) { toast(t('auth.code_wrong'), 'error'); clear(); host.querySelector('input').focus(); return; }
        const prev = getUser();
        if (prev && prev.phone === phone && prev.profile) { go(next); return; }
        setUser({ phone, createdAt: new Date().toISOString() });
        step = 'profile';
        render(root);
      });
    } else if (step === 'profile') {
      host.innerHTML = `
        ${stepper(2)}
        <h1 class="display mt-6" style="font-size:var(--fs-h2)">${esc(t('auth.profile_title'))}</h1>
        <p class="muted mt-3">${esc(t('auth.profile_lead'))}</p>
        <form class="form-grid mt-6" novalidate data-form>
          <div class="field"><span class="label">${esc(t('auth.role'))}</span>
            <div class="segmented" role="group">
              <button type="button" data-role="athlete" aria-selected="${draft.role === 'athlete'}">${esc(t('role.athlete'))}</button>
              <button type="button" data-role="coach" aria-selected="${draft.role === 'coach'}">${esc(t('role.coach'))}</button>
            </div>
          </div>
          <div class="field" id="f-name"><label for="name">${esc(t('profile.name'))}</label><input id="name" class="input" autocomplete="name" value="${esc(draft.name || '')}"><span class="error">${esc(t('form.required'))}</span></div>
          ${draft.role === 'coach' ? `
            <div class="field" id="f-lic"><label for="lic">${esc(t('auth.license'))}</label><input id="lic" class="input" value="${esc(draft.license || '')}"><span class="hint">${esc(t('auth.license_hint'))}</span><span class="error">${esc(t('form.required'))}</span></div>
            <div class="field"><label for="region">${esc(t('profile.region'))}</label><select id="region" class="input">${REGIONS.map((r) => `<option value="${r.id}">${esc(tr(r.name))}</option>`).join('')}</select></div>`
          : `
          <div class="form-grid two">
            <div class="field" id="f-bd"><span class="label" id="bd-label">${esc(t('profile.birthdate'))}</span>${dobSelects(draft.birthdate)}<span class="error">${esc(t('auth.age_err'))}</span></div>
            <div class="field"><span class="label">${esc(t('profile.gender'))}</span>
              <div class="segmented" role="group"><button type="button" data-g="m" aria-selected="${draft.gender === 'm'}">${esc(t('profile.male'))}</button><button type="button" data-g="f" aria-selected="${draft.gender === 'f'}">${esc(t('profile.female'))}</button></div>
            </div>
          </div>
          <div class="form-grid two">
            <div class="field"><label for="region">${esc(t('profile.region'))}</label><select id="region" class="input">${REGIONS.map((r) => `<option value="${r.id}" ${draft.region === r.id ? 'selected' : ''}>${esc(tr(r.name))}</option>`).join('')}</select></div>
            <div class="field"><label for="style">${esc(t('profile.style'))}</label><select id="style" class="input">${STYLES.map((s) => `<option value="${s.id}" ${draft.style === s.id ? 'selected' : ''}>${esc(tr(s.name))}</option>`).join('')}</select></div>
          </div>
          <div class="form-grid two">
            <div class="field" id="f-w"><label for="w">${esc(t('profile.weight'))}</label><input id="w" class="input" inputmode="decimal" placeholder="45" value="${esc(draft.weight || '')}"><span class="error">${esc(t('auth.weight_err'))}</span></div>
            <div class="field"><label for="exp">${esc(t('profile.experience'))}</label><select id="exp" class="input">${EXPERIENCE.map((e) => `<option value="${e.id}">${esc(tr(e.name))}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label for="club">${esc(t('profile.club'))} <span class="muted">(${esc(t('form.optional'))})</span></label><input id="club" class="input" value="${esc(draft.club || '')}"></div>`}
          <button class="btn btn-primary btn-block mt-2" type="submit">${esc(t('common.continue'))}</button>
        </form>`;
      const read = () => {
        draft.name = host.querySelector('#name').value.trim();
        draft.region = host.querySelector('#region').value;
        if (draft.role === 'coach') { draft.license = host.querySelector('#lic').value.trim(); return; }
        draft.birthdate = readDob(host);
        draft.style = host.querySelector('#style').value;
        draft.weight = host.querySelector('#w').value.replace(',', '.');
        draft.experience = host.querySelector('#exp').value;
        draft.club = host.querySelector('#club').value.trim();
      };
      host.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => { read(); draft.role = b.dataset.role; render(root); }));
      host.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { draft.gender = b.dataset.g; host.querySelectorAll('[data-g]').forEach((z) => z.setAttribute('aria-selected', z === b)); }));
      host.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        read();
        let ok = true;
        const mark = (id, bad) => { host.querySelector(id)?.classList.toggle('invalid', bad); if (bad) ok = false; };
        mark('#f-name', draft.name.length < 2);
        if (draft.role === 'coach') {
          mark('#f-lic', draft.license.length < 3);
        } else {
          const age = ageOf(draft.birthdate);
          mark('#f-bd', age == null || age < 7 || age > 22);
          const w = parseFloat(draft.weight);
          mark('#f-w', !(w >= 15 && w <= 160));
        }
        if (!ok) { host.querySelector('.invalid input, .invalid select')?.focus(); return; }
        const age = ageOf(draft.birthdate);
        if (draft.role === 'athlete' && age < 18) { step = 'consent'; render(root); return; }
        finish();
      });
    } else if (step === 'consent') {
      host.innerHTML = `
        ${stepper(3)}
        <h1 class="display mt-6" style="font-size:var(--fs-h2)">${esc(t('consent.title'))}</h1>
        <p class="muted mt-3">${esc(t('consent.lead'))}</p>
        <ul class="stack mt-6" style="list-style:none">
          ${['c1', 'c2', 'c3', 'c4'].map((k) => `<li class="row" style="align-items:flex-start">${icon.shield.replace('<svg', '<svg width="18" height="18" style="color:var(--c-gold);flex:none;margin-top:3px"')}<span>${esc(t('consent.' + k))}</span></li>`).join('')}
        </ul>
        <form class="stack mt-6" novalidate data-form>
          <div class="field" id="f-pp"><label for="pp">${esc(t('consent.parent_phone'))}</label><div class="input-prefix"><span>+993</span><input id="pp" class="input" inputmode="tel" placeholder="6X XX XX XX"></div><span class="error">${esc(t('consent.pp_err'))}</span></div>
          <button class="btn btn-ghost btn-block" type="submit">${esc(t('consent.send'))}</button>
        </form>
        <div data-code-wrap hidden class="mt-6">
          <p class="mb-4">${esc(t('consent.enter'))}</p>
          ${codeInputs('parent')}
          <div class="notice mt-4">${icon.info}<div>${esc(t('auth.demo_code', { c: DEMO_CODE }))}</div></div>
        </div>`;
      host.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const v = host.querySelector('#pp').value.replace(/\D/g, '');
        const bad = !/^6\d{7}$/.test(v) || v === phone;
        host.querySelector('#f-pp').classList.toggle('invalid', bad);
        if (bad) return;
        draft.parentPhone = v;
        host.querySelector('[data-code-wrap]').hidden = false;
        const clear = bindCode(host, 'parent', (code) => {
          if (code !== DEMO_CODE) { toast(t('auth.code_wrong'), 'error'); clear(); return; }
          draft.consent = { by: v, at: new Date().toISOString() };
          finish();
        });
      });
    }
  }

  function finish() {
    const u = getUser() || { phone };
    const age = ageOf(draft.birthdate);
    u.role = draft.role;
    u.profile = {
      name: draft.name, region: draft.region,
      ...(draft.role === 'coach'
        ? { license: draft.license, licenseStatus: 'pending' }
        : { birthdate: draft.birthdate, gender: draft.gender, style: draft.style, weight: parseFloat(draft.weight), experience: draft.experience, club: draft.club, ageGroup: ageGroup(age) }),
    };
    if (draft.consent) u.consent = { ...draft.consent, parentPhone: draft.parentPhone };
    setUser(u);
    toast(t('auth.welcome', { n: draft.name.split(' ')[0] }));
    go(draft.role === 'coach' && next === '/profile' ? '/coach' : next);
  }

  return { html, title: t('auth.title'), mount: render };
}
