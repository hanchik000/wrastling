// Экран личного помощника Champ AI: план на сегодня, чат, дневник боли, анкета.
import { t, getLang as curLang, fmtDate } from '../i18n.js';
import { esc, icon, toast, sheet } from '../ui.js';
import { getUser, setUser, getTrainings, getPains, addPain, savePains, getWater, addWater, getChat, saveChat, getAiKey, setAiKey, uid } from '../store.js';
import { plan as makePlan, reply, trainingText, pick, ALLERGENS, AREAS, areaById, PAIN_KINDS, RED_FLAGS, foodById, exName, areaAlt } from '../assistant.js';
import { askClaude } from '../assistant-ai.js';
import { smartReply, KB, kbTitle } from '../dost-kb.js';
import { openMealLog, currentSlot } from '../meal-log.js';
import { dostFace } from '../dost-ui.js';
import { load as sload, save as ssave, coachDirective } from '../store.js';
import { iso } from '../training-lib.js';

const L = (o) => pick(o, curLang());
const dostAvatar = `<span class="dost-ava" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M15.6 1.5h16.8l14.1 14.1v16.8L32.4 46.5H15.6L1.5 32.4V15.6z" fill="#0d1210"/><path d="M16.4 4h15.2L44 16.4v15.2L31.6 44H16.4L4 31.6V16.4z" fill="none" stroke="#27b663" stroke-width="2"/><circle cx="18" cy="21" r="2.6" fill="#f4f2ee"/><circle cx="30" cy="21" r="2.6" fill="#f4f2ee"/><path d="M16 29q8 7 16 0" fill="none" stroke="#27b663" stroke-width="2.4" stroke-linecap="round"/></svg></span>`;

// Точки на карте тела (вид спереди): [зона, сторона, x, y]
const SPOTS = [['head', null, 60, 20], ['neck', null, 60, 44], ['shoulder', 'l', 35, 58], ['shoulder', 'r', 85, 58], ['chest', null, 60, 74], ['elbow', 'l', 27, 98], ['elbow', 'r', 93, 98], ['back', null, 60, 112], ['wrist', 'l', 22, 128], ['wrist', 'r', 98, 128], ['hip', 'l', 49, 138], ['hip', 'r', 71, 138], ['knee', 'l', 49, 190], ['knee', 'r', 71, 190], ['ankle', 'l', 49, 238], ['ankle', 'r', 71, 238]];
const FIGURE = `<g class="bm-fig"><circle cx="60" cy="20" r="13"/><rect x="54" y="32" width="12" height="12" rx="4"/><path d="M34 50h52q6 0 6 8l-2 54q0 8-8 10l-4 18H42l-4-18q-8-2-8-10l-2-54q0-8 6-8z"/><path d="M33 54 22 100l-2 30 6 2 6-30 8-36z"/><path d="M87 54l11 46 2 30-6 2-6-30-8-36z"/><path d="M42 136h17l-2 50-2 52h-9l-2-52z"/><path d="M61 136h17l-2 50-2 52h-9l-2-52z"/></g>`;

export default function assistant({ user, query, go }) {
  if (!user?.profile) return { redirect: '/login?next=/assistant' };
  if (query.tab === 'today' && user.profile.health?.height) return { redirect: '/me' };
  let tab = ['chat', 'pain', 'data'].includes(query.tab) ? query.tab : (user.profile.health?.height ? 'chat' : 'data');
  const autoQ = query.q === 'food' ? t('dost.q_food') : query.q === 'diet' ? t('food.q_diet') : null;
  let painDraft = { area: query.area || null, side: null, level: query.level ? +query.level : 4, kind: 'dull', flags: [], note: '' };
  let root, busy = false;

  const ctx = () => {
    const u = getUser();
    return { lang: curLang(), profile: u.profile, plan: makePlan(u.profile, getTrainings(), getPains(), new Date(), coachDirective('me')) };
  };

  const html = `
  <section class="container dost-head">
    <div class="row" style="gap:14px;align-items:center">
      ${dostFace('happy', 'mid')}
      <div><h1 class="display" style="font-size:var(--fs-h3, 1.6rem)">Champ AI</h1><p class="muted" style="font-size:var(--fs-small)">${esc(t('dost.status'))}</p></div>
      <a class="btn btn-quiet btn-sm" href="#/me" style="margin-left:auto">${esc(t('me.title'))}</a>
    </div>
    <div class="tabs mt-4" role="tablist">${['chat', 'pain', 'data'].map((x) => `<button role="tab" data-tab="${x}" aria-selected="${x === tab}">${esc(t('dost.tab_' + x))}</button>`).join('')}</div>
  </section>
  <section class="container" style="padding-bottom:var(--s-16)" id="dost"></section>`;

  function setTab(x) {
    tab = x;
    root.querySelectorAll('[data-tab]').forEach((z) => z.setAttribute('aria-selected', z.dataset.tab === x));
    render();
  }

  function render() {
    const host = root.querySelector('#dost');
    if (tab === 'data') return renderData(host);
    if (!getUser().profile.health?.height) { tab = 'data'; return setTab('data'); }
    if (tab === 'chat') renderChat(host);
    else renderPain(host);
    import('../fx.js').then(({ initFx }) => initFx(host));
  }

  // ---------- Сегодня ----------
  function renderToday(host) {
    const c = ctx(), P = c.plan;
    const today = iso(new Date());
    const drunk = getWater(today);
    const pct = Math.min(1, drunk / P.water);
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const toH = (s) => { const [h, m] = s.split('–')[0].split(':').map(Number); return h + m / 60; };
    const nextIdx = P.waterPlan.findIndex((x) => toH(x.at) >= nowH);
    const levelCls = { normal: 'ok', light: 'warn', rest: 'info', doctor: 'bad', stop: 'bad' }[P.level];
    const R = 54, C = 2 * Math.PI * R;
    host.innerHTML = `
      ${P.alerts.map((a) => `<div class="notice ${a.level === 'warn' ? 'error' : ''} mb-4">${icon.alert}<div>${esc(L(a.text))}</div></div>`).join('')}
      <div class="dost-grid">
        <article class="panel dost-train ${levelCls}">
          <p class="eyebrow">${esc(t('dost.train_t'))}</p>
          <div class="dost-pre mt-3">${esc(trainingText(P, curLang()))}</div>
          <div class="row row-wrap mt-4"><a class="btn btn-ghost btn-sm" href="#/training/live">${icon.live}${esc(t('cam.open'))}</a><button class="btn btn-quiet btn-sm" data-ask="train">${esc(t('dost.ask'))} →</button></div>
        </article>
        <article class="panel dost-water">
          <div class="row between"><p class="eyebrow">${esc(t('dost.water_t'))}</p><span class="muted" style="font-size:var(--fs-micro)">${esc(t('dost.water_rule'))}</span></div>
          <div class="water-row mt-4">
            <svg class="water-ring" viewBox="0 0 128 128" aria-label="${esc(t('dost.water_t'))}">
              <circle cx="64" cy="64" r="${R}" class="trk"/>
              <circle cx="64" cy="64" r="${R}" class="val" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - pct)}"/>
              <text x="64" y="62" text-anchor="middle" class="big">${(drunk / 1000).toFixed(1)}</text>
              <text x="64" y="82" text-anchor="middle" class="sm">${esc(t('dost.of', { n: (P.water / 1000).toFixed(1) }))}</text>
            </svg>
            <div class="stack" style="gap:8px">
              <button class="btn btn-gold btn-sm" data-water="250">+ 250 ${esc(t('dost.ml'))}</button>
              <button class="btn btn-ghost btn-sm" data-water="500">+ 500 ${esc(t('dost.ml'))}</button>
              <button class="btn btn-quiet btn-sm" data-water="-250">− 250</button>
            </div>
          </div>
          <ol class="wsched mt-4">${P.waterPlan.map((x, i) => `<li class="${i === nextIdx ? 'next' : i < nextIdx || nextIdx === -1 ? 'past' : ''}"><b class="num">${esc(x.at)}</b><span>${esc(L(x.note))}</span><i class="num">${x.ml} ${esc(t('dost.ml'))}</i></li>`).join('')}</ol>
          <details class="mt-3"><summary>${esc(t('dost.water_dont'))}</summary><ul class="dost-ul mt-2">${P.waterDont.map((x) => `<li>${esc(L(x))}</li>`).join('')}</ul></details>
        </article>
      </div>
      <article class="panel mt-6">
        <div class="row row-wrap between"><p class="eyebrow">${esc(t('dost.food_t'))}</p>${P.minor ? `<span class="badge">${esc(t('dost.growing'))}</span>` : ''}</div>
        ${P.kcal ? `<div class="macro mt-4">
          <div><b class="num">${P.kcal}</b><span>${esc(t('dost.kcal'))}</span></div>
          <div><b class="num">${P.protein}</b><span>${esc(t('dost.protein'))}, ${esc(t('dost.g'))}</span></div>
          <div><b class="num">${P.carbs}</b><span>${esc(t('dost.carbs'))}, ${esc(t('dost.g'))}</span></div>
          <div><b class="num">${P.fat}</b><span>${esc(t('dost.fat'))}, ${esc(t('dost.g'))}</span></div>
        </div>` : ''}
        <ol class="meals mt-6">${P.meals.map((m) => `<li><b class="num">${esc(m.at)}</b><div><strong>${esc(L(m.name))}</strong>${m.note ? ` <span class="muted">· ${esc(L(m.note))}</span>` : ''}<span>${m.what.map((id) => esc(L(foodById(id).name))).join(' · ')}</span></div></li>`).join('')}</ol>
        <div class="foodcols mt-6">
          ${['eat', 'limit', 'avoid'].map((k) => `<div class="fc ${k}"><h3>${esc(t('dost.f_' + k))}</h3><div class="fchips">${P.foods[k].map((f) => `<button class="fchip" data-food="${f.id}">${esc(L(f.name))}</button>`).join('')}</div></div>`).join('')}
        </div>
        <p class="muted mt-4" style="font-size:var(--fs-micro)">${esc(t('dost.not_doctor'))}</p>
      </article>`;
    host.querySelectorAll('[data-water]').forEach((b) => b.addEventListener('click', () => { addWater(today, +b.dataset.water); renderToday(host); }));
    host.querySelector('[data-ask]').addEventListener('click', () => { setTab('chat'); send(t('dost.q_train')); });
    host.querySelectorAll('[data-food]').forEach((b) => b.addEventListener('click', () => {
      const f = foodById(b.dataset.food);
      const r = reply(L(f.name) + ' ' + t('dost.can_word'), { ...ctx(), lang: curLang() });
      sheet(`<p class="eyebrow">${esc(t('dost.title'))}</p><h3 class="mt-2">${esc(L(f.name))}</h3><div class="dost-pre mt-3">${esc(r.text)}</div><button class="btn btn-ghost btn-block mt-6" data-close>${esc(t('common.close'))}</button>`);
    }));
  }

  // ---------- Чат ----------
  function renderChat(host) {
    const key = getAiKey();
    const msgs = getChat();
    const lang = curLang();
    const sugg = [t('food.q_ate'), t('food.q_diet'), ...['q_water', 'q_food', 'q_palaw', 'q_knee'].map((k) => t('dost.' + k))].concat(['warmup', 'nerves', 'soreness', 'weighin'].map((id) => kbTitle(KB.find((x) => x.id === id), lang)));
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const micLang = { ru: 'ru-RU', en: 'en-US' }[lang];
    host.innerHTML = `
      <div class="chat panel">
        <div class="chat-top"><span class="badge ${key ? 'badge-gold' : ''}">${esc(t(key ? 'dost.mode_ai' : 'dost.mode_smart'))}</span><button class="btn btn-quiet btn-sm" data-ai>${esc(t('dost.ai_settings'))}</button></div>
        <div class="chat-log" data-log aria-live="polite">
          ${msgs.length ? '' : `<div class="chat-empty">${dostFace('happy', 'big')}<p>${esc(t('dost.hello', { n: (getUser().profile.name || '').split(' ')[0] }))}</p></div>`}
          ${msgs.map(bubble).join('')}
        </div>
        <div class="chat-quick">${sugg.map((q) => `<button class="chip" data-say="${esc(q)}">${esc(q)}</button>`).join('')}</div>
        <form class="chat-in" data-form>
          <input class="input" name="m" autocomplete="off" placeholder="${esc(t('dost.placeholder'))}" aria-label="${esc(t('dost.placeholder'))}">
          ${SR && micLang ? `<button class="btn btn-ghost mic" type="button" data-mic aria-label="${esc(t('dost.mic'))}">${icon.mic}</button>` : ''}
          <button class="btn btn-gold" type="submit" aria-label="${esc(t('dost.send'))}">${icon.arrow}</button>
        </form>
      </div>
      <p class="muted mt-3" style="font-size:var(--fs-micro)">${esc(t('dost.langs'))} ${esc(t('dost.not_doctor'))}</p>`;
    const log = host.querySelector('[data-log]');
    log.scrollTop = log.scrollHeight;
    host.querySelector('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); const v = e.target.m.value.trim(); if (v) { e.target.m.value = ''; send(v); } });
    host.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => send(b.dataset.say)));
    host.querySelector('[data-ai]').addEventListener('click', aiSettings);
    const mic = host.querySelector('[data-mic]');
    if (mic) mic.addEventListener('click', () => {
      try {
        const rec = new SR(); rec.lang = micLang; rec.interimResults = false;
        mic.classList.add('on');
        rec.onresult = (e) => { const v = e.results[0][0].transcript; if (v) send(v); };
        rec.onend = () => mic.classList.remove('on');
        rec.onerror = () => { mic.classList.remove('on'); toast(t('dost.mic_err'), 'error'); };
        rec.start();
      } catch { toast(t('dost.mic_err'), 'error'); }
    });
    bindActions(host);
  }

  function bubble(m) {
    const acts = (m.actions || []).map((a) => a.id === 'pain'
      ? `<button class="btn btn-ghost btn-sm" data-act="pain" data-area="${a.area || ''}" data-level="${a.level ?? ''}">${esc(t('dost.act_pain'))}</button>`
      : a.id === 'today' ? `<a class="btn btn-quiet btn-sm" href="#/me">${esc(t('dost.act_today'))}</a>`
      : a.id === 'ask' ? `<button class="chip" data-say="${esc(a.text)}">${esc(a.text)}</button>`
      : a.id === 'meallog' ? `<button class="btn btn-gold btn-sm" data-act="meallog">${icon.plus}${esc(t('food.log'))}</button>` : '').join('');
    return `<div class="msg ${m.role === 'user' ? 'me' : 'bot'}">${m.role === 'user' ? '' : dostFace(m.mood || 'happy', 'sm')}<div><div class="bub">${esc(m.text)}</div>${m.via === 'ai' ? `<small class="via">Claude AI</small>` : ''}${acts ? `<div class="row row-wrap mt-2">${acts}</div>` : ''}</div></div>`;
  }

  function bindActions(host) {
    host.querySelectorAll('.msg [data-say]').forEach((b) => b.addEventListener('click', () => send(b.dataset.say)));
    host.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.act === 'meallog') return openMealLog({ onSaved: (m, j) => { const all = getChat(); all.push({ role: 'bot', text: t('food.chat_logged'), at: Date.now() }); saveChat(all); renderChat(root.querySelector('#dost')); } });
      painDraft = { ...painDraft, area: b.dataset.area || null, level: b.dataset.level ? +b.dataset.level : painDraft.level };
      setTab('pain');
    }));
  }

  async function send(text) {
    if (busy) return;
    if (tab !== 'chat') { tab = 'chat'; root.querySelectorAll('[data-tab]').forEach((z) => z.setAttribute('aria-selected', z.dataset.tab === 'chat')); }
    const msgs = getChat();
    msgs.push({ role: 'user', text, at: Date.now() });
    saveChat(msgs);
    renderChat(root.querySelector('#dost'));
    const log = root.querySelector('[data-log]');
    log.insertAdjacentHTML('beforeend', `<div class="msg bot typing">${dostFace('happy', 'sm')}<div class="bub"><i></i><i></i><i></i></div></div>`);
    log.scrollTop = log.scrollHeight;
    busy = true;
    const c = ctx();
    const mem = sload('dostmem', {});
    const local = smartReply(text, { ...c, slot: currentSlot(c.plan) }, mem);
    ssave('dostmem', local.memory || mem);
    const mood = local.kind === 'pain' && /⚠️/.test(local.text) ? 'worried' : local.kind === 'suggest' || local.kind === 'fallback' ? 'calm' : 'happy';
    let answer = { role: 'bot', text: local.text, actions: local.actions, mood, at: Date.now() };
    const key = getAiKey();
    if (key) {
      try { answer = { ...answer, text: await askClaude(key, getChat(), c), via: 'ai' }; }
      catch (e) { console.warn(e); answer.text = t('dost.ai_failed') + '\n\n' + local.text; }
    } else await new Promise((r) => setTimeout(r, 450));
    busy = false;
    const all = getChat(); all.push(answer); saveChat(all);
    if (tab === 'chat') renderChat(root.querySelector('#dost'));
  }

  function aiSettings() {
    sheet(`<h3>${esc(t('dost.ai_t'))}</h3><p class="muted mt-2" style="font-size:var(--fs-small)">${esc(t('dost.ai_d'))}</p>
      <div class="field mt-4"><label for="aik">${esc(t('dost.ai_key'))}</label><input id="aik" class="input" type="password" autocomplete="off" placeholder="sk-ant-…" value="${esc(getAiKey())}"></div>
      <div class="stack mt-6"><button class="btn btn-gold btn-block" data-save>${esc(t('dost.ai_save'))}</button>${getAiKey() ? `<button class="btn btn-ghost btn-block" data-off>${esc(t('dost.ai_off'))}</button>` : ''}<button class="btn btn-quiet btn-block" data-close>${esc(t('common.cancel'))}</button></div>`,
    (panel, close) => {
      panel.querySelector('[data-save]').addEventListener('click', () => { setAiKey(panel.querySelector('#aik').value.trim()); close(); render(); toast(t('dost.ai_saved')); });
      panel.querySelector('[data-off]')?.addEventListener('click', () => { setAiKey(''); close(); render(); });
    });
  }

  // ---------- Боль ----------
  function renderPain(host) {
    const pains = getPains();
    const active = pains.filter((p) => !p.resolved);
    const d = painDraft;
    const lvlCol = (v) => (v >= 7 ? '#e23b3b' : v >= 4 ? '#e8a21d' : '#27b663');
    host.innerHTML = `
      <div class="pain-grid">
        <div class="panel">
          <p class="eyebrow">${esc(t('dost.pain_where'))}</p>
          <svg class="bodymap mt-3" viewBox="0 0 120 256" role="group" aria-label="${esc(t('dost.pain_where'))}">
            ${FIGURE}
            ${active.map((p) => { const s = SPOTS.find((x) => x[0] === p.area && (x[1] === p.side || !x[1] || !p.side)); return s ? `<circle class="bm-old" cx="${s[2]}" cy="${s[3]}" r="11" style="fill:${lvlCol(p.level)}"/>` : ''; }).join('')}
            ${SPOTS.map(([a, side, x, y]) => `<g class="bm-spot ${d.area === a && (d.side === side || !side) ? 'on' : ''}" data-spot="${a}" data-side="${side || ''}" tabindex="0" role="button" aria-label="${esc(L(areaById(a).name))}${side ? ' ' + (side === 'l' ? t('dost.left') : t('dost.right')) : ''}"><circle cx="${x}" cy="${y}" r="8"/></g>`).join('')}
          </svg>
          <div class="chips mt-3">${AREAS.map((a) => `<button class="chip" data-area="${a.id}" aria-pressed="${d.area === a.id}">${esc(L(a.name))}</button>`).join('')}</div>
        </div>
        <form class="panel stack" data-pform novalidate>
          <div class="field"><label for="plv">${esc(t('dost.pain_level'))}: <b class="num" data-lv style="color:${lvlCol(d.level)}">${d.level}</b>/10</label><input id="plv" class="range" type="range" min="1" max="10" value="${d.level}"></div>
          <div class="field"><span class="label">${esc(t('dost.pain_kind'))}</span><div class="chips">${PAIN_KINDS.map((k) => `<button type="button" class="chip" data-kind="${k.id}" aria-pressed="${d.kind === k.id}">${esc(L(k.name))}</button>`).join('')}</div></div>
          <div class="field"><span class="label">${esc(t('dost.pain_flags'))}</span><div class="flags">${RED_FLAGS.map((f) => `<label class="flag"><input type="checkbox" data-flag="${f.id}" ${d.flags.includes(f.id) ? 'checked' : ''}><span>${esc(L(f.name))}</span></label>`).join('')}</div></div>
          <div class="field"><label for="pnote">${esc(t('dost.pain_note'))}</label><textarea id="pnote" class="input" placeholder="${esc(t('dost.pain_note_ph'))}">${esc(d.note)}</textarea></div>
          <button class="btn btn-gold btn-block" type="submit">${esc(t('dost.pain_save'))}</button>
        </form>
      </div>
      <h2 class="eyebrow mt-10 mb-4">${esc(t('dost.pain_history'))}</h2>
      ${pains.length ? `<div class="list">${pains.map((p) => `
        <div class="list-row ${p.resolved ? 'muted' : ''}">
          <span class="pdot" style="background:${lvlCol(p.level)}"></span>
          <span class="grow"><b>${esc(L(areaById(p.area).name))}${p.side ? ' · ' + esc(p.side === 'l' ? t('dost.left') : t('dost.right')) : ''} — ${p.level}/10</b>
            <span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(p.date, { day: 'numeric', month: 'long' }))} · ${esc(L(PAIN_KINDS.find((k) => k.id === p.kind)?.name))}${(p.flags || []).length ? ' · ⚠️ ' + p.flags.map((f) => esc(L(RED_FLAGS.find((x) => x.id === f).name))).join(', ') : ''}${p.note ? ' · ' + esc(p.note) : ''}</span></span>
          ${p.resolved ? `<span class="badge">${esc(t('dost.pain_gone'))}</span>` : `<button class="btn btn-ghost btn-sm" data-resolve="${p.id}">${esc(t('dost.pain_resolve'))}</button>`}
        </div>`).join('')}</div>` : `<div class="empty"><h3>${esc(t('dost.pain_none'))}</h3><p>${esc(t('dost.pain_none_hint'))}</p></div>`}`;

    const pick_ = (a, side) => { painDraft.area = a; painDraft.side = side || null; renderPain(host); };
    host.querySelectorAll('[data-spot]').forEach((g) => {
      g.addEventListener('click', () => pick_(g.dataset.spot, g.dataset.side));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick_(g.dataset.spot, g.dataset.side); } });
    });
    host.querySelectorAll('[data-area]').forEach((b) => b.addEventListener('click', () => pick_(b.dataset.area, null)));
    const lv = host.querySelector('#plv');
    lv.addEventListener('input', () => { painDraft.level = +lv.value; const o = host.querySelector('[data-lv]'); o.textContent = lv.value; o.style.color = lvlCol(+lv.value); });
    host.querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { painDraft.kind = b.dataset.kind; host.querySelectorAll('[data-kind]').forEach((z) => z.setAttribute('aria-pressed', z === b)); }));
    host.querySelectorAll('[data-flag]').forEach((c) => c.addEventListener('change', () => { painDraft.flags = [...host.querySelectorAll('[data-flag]:checked')].map((x) => x.dataset.flag); }));
    host.querySelector('#pnote').addEventListener('input', (e) => { painDraft.note = e.target.value; });
    host.querySelector('[data-pform]').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!painDraft.area) { toast(t('dost.pain_pick'), 'error'); return; }
      const p = { id: uid('p'), date: new Date().toISOString(), area: painDraft.area, side: painDraft.side, level: painDraft.level, kind: painDraft.kind, flags: painDraft.flags, note: painDraft.note.trim() };
      addPain(p);
      painDraft = { area: null, side: null, level: 4, kind: 'dull', flags: [], note: '' };
      renderPain(host);
      showPainAdvice(p);
    });
    host.querySelectorAll('[data-resolve]').forEach((b) => b.addEventListener('click', () => {
      savePains(getPains().map((p) => (p.id === b.dataset.resolve ? { ...p, resolved: true } : p)));
      renderPain(host); toast(t('dost.pain_resolved'));
    }));
  }

  function showPainAdvice(p) {
    const lang = curLang();
    const head = p.area === 'head' || p.flags.includes('headhit') ? 'stop' : p.flags.length || p.level >= 7 ? 'doctor' : p.level >= 4 ? 'light' : 'ok';
    const rule = makePlan(getUser().profile, [], [p]).avoid;
    sheet(`<p class="eyebrow">${esc(t('dost.title'))}</p>
      <h3 class="mt-2">${esc(L(areaById(p.area).name))} — ${p.level}/10</h3>
      <div class="notice ${head === 'ok' || head === 'light' ? '' : 'error'} mt-4">${icon[head === 'ok' ? 'check' : 'alert']}<div>${esc(t('dost.pa_' + head))}</div></div>
      ${rule.length && head !== 'stop' ? `<p class="mt-4"><b>${esc(t('dost.skip'))}</b> ${esc(rule.map((x) => exName(x, lang)).join(', '))}</p><p class="mt-2"><b>${esc(t('dost.instead'))}</b> ${esc(areaAlt(p.area, lang))}</p>` : ''}
      <p class="muted mt-4" style="font-size:var(--fs-small)">${esc(t('dost.coach_sees'))}</p>
      <button class="btn btn-ghost btn-block mt-6" data-close>${esc(t('common.close'))}</button>`);
  }

  // ---------- Мои данные ----------
  function renderData(host) {
    const u = getUser(), p = u.profile, h = p.health || {};
    const first = !h.height;
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const opt = (v, cur) => `<option value="${v}" ${+cur === v ? 'selected' : ''}>${String(Math.floor(v)).padStart(2, '0')}:${v % 1 ? '30' : '00'}</option>`;
    host.innerHTML = `
      ${first ? `<div class="notice mb-6">${icon.info}<div>${esc(t('dost.data_first'))}</div></div>` : ''}
      <form class="panel stack" data-dform novalidate style="max-width:720px">
        <div class="form-grid two">
          <div class="field"><label for="dh">${esc(t('dost.height'))}, ${esc(t('unit.cm'))}</label><input id="dh" class="input num" inputmode="numeric" value="${esc(h.height || '')}" placeholder="170"></div>
          <div class="field"><label for="dw">${esc(t('profile.weight'))}, ${esc(t('unit.kg'))}</label><input id="dw" class="input num" inputmode="decimal" value="${esc(p.weight || '')}" placeholder="60"></div>
        </div>
        <div class="field"><span class="label">${esc(t('dost.goal'))}</span><div class="chips">${['maintain', 'gain', 'make_weight'].map((g) => `<button type="button" class="chip" data-goal="${g}" aria-pressed="${(h.goal || 'maintain') === g}">${esc(t('dost.goal_' + g))}</button>`).join('')}</div></div>
        <div class="field" data-tc ${h.goal === 'make_weight' ? '' : 'hidden'}><label for="dt">${esc(t('dost.target'))}, ${esc(t('unit.kg'))}</label><input id="dt" class="input num" inputmode="decimal" value="${esc(h.targetClass || '')}" placeholder="55" style="max-width:160px"></div>
        <div class="field"><span class="label">${esc(t('dost.sessions'))}</span><div class="chips">${[3, 4, 5, 6, 7].map((n) => `<button type="button" class="chip" data-ses="${n}" aria-pressed="${(h.sessions || 5) === n}">${n}</button>`).join('')}</div></div>
        <div class="form-grid three">
          <div class="field"><label for="dth">${esc(t('dost.train_hour'))}</label><select id="dth" class="input">${hours.map((x) => opt(x, h.trainHour ?? 17)).join('')}</select></div>
          <div class="field"><label for="dwk">${esc(t('dost.wake'))}</label><select id="dwk" class="input">${[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((x) => opt(x, h.wake ?? 7)).join('')}</select></div>
          <div class="field"><label for="dsl">${esc(t('dost.sleep'))}</label><select id="dsl" class="input">${[20.5, 21, 21.5, 22, 22.5, 23, 23.5].map((x) => opt(x, h.sleep ?? 22.5)).join('')}</select></div>
        </div>
        <div class="field"><span class="label">${esc(t('dost.allergies'))}</span><div class="chips">${ALLERGENS.map((a) => `<button type="button" class="chip" data-all="${a.id}" aria-pressed="${(h.allergies || []).includes(a.id)}">${esc(L(a.name))}</button>`).join('')}</div><span class="hint">${esc(t('dost.allergies_hint'))}</span></div>
        <div class="field"><label for="dn">${esc(t('dost.notes'))}</label><textarea id="dn" class="input" placeholder="${esc(t('dost.notes_ph'))}">${esc(h.notes || '')}</textarea></div>
        <button class="btn btn-gold btn-block" type="submit">${esc(t(first ? 'dost.data_start' : 'dost.data_save'))}</button>
        <p class="muted" style="font-size:var(--fs-micro)">${esc(t('dost.data_private'))}</p>
      </form>`;
    let goal = h.goal || 'maintain', ses = h.sessions || 5;
    const allg = new Set(h.allergies || []);
    host.querySelectorAll('[data-goal]').forEach((b) => b.addEventListener('click', () => { goal = b.dataset.goal; host.querySelectorAll('[data-goal]').forEach((z) => z.setAttribute('aria-pressed', z === b)); host.querySelector('[data-tc]').hidden = goal !== 'make_weight'; }));
    host.querySelectorAll('[data-ses]').forEach((b) => b.addEventListener('click', () => { ses = +b.dataset.ses; host.querySelectorAll('[data-ses]').forEach((z) => z.setAttribute('aria-pressed', z === b)); }));
    host.querySelectorAll('[data-all]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.all; allg.has(id) ? allg.delete(id) : allg.add(id); b.setAttribute('aria-pressed', allg.has(id)); }));
    host.querySelector('[data-dform]').addEventListener('submit', (e) => {
      e.preventDefault();
      const num = (id) => parseFloat(host.querySelector(id).value.replace(',', '.'));
      const height = num('#dh'), weight = num('#dw'), target = num('#dt');
      if (!(height >= 100 && height <= 230)) { toast(t('dost.err_height'), 'error'); host.querySelector('#dh').focus(); return; }
      if (!(weight >= 20 && weight <= 160)) { toast(t('dost.err_weight'), 'error'); host.querySelector('#dw').focus(); return; }
      const u2 = getUser();
      u2.profile.weight = weight;
      u2.profile.health = { height, goal, targetClass: goal === 'make_weight' && target > 0 ? target : null, sessions: ses, trainHour: +host.querySelector('#dth').value, wake: +host.querySelector('#dwk').value, sleep: +host.querySelector('#dsl').value, allergies: [...allg], notes: host.querySelector('#dn').value.trim() };
      setUser(u2);
      toast(t('dost.data_saved'));
      go('/me');
    });
  }

  return {
    html,
    title: t('dost.title'),
    mount(r) {
      root = r;
      root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
      render();
      if (autoQ && tab === 'chat') send(autoQ);
    },
  };
}
