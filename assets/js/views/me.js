// «Мой кабинет» — всё о спортсмене на одном экране: готовность, совет Champ AI, указания тренера,
// вода, ближайшая еда, тренировка сегодня, неделя, прогресс, боли, тесты.
import { t, getLang, fmtDate, fmtNum } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { getUser, getTrainings, getPains, getWater, addWater, getResults, getCoachMsgs, coachDirective, markCoachMsgsRead } from '../store.js';
import { plan as makePlan, readiness, pick, foodById, FOOD_EMOJI, areaById } from '../assistant.js';
import { todayBrief } from '../dost-kb.js';
import { dostFace, readinessGol, waterGlass, exTile, sparkline } from '../dost-ui.js';
import { iso, addDays, series, load as sLoad } from '../training-lib.js';
import { styleName, regionName } from '../data.js';
import { tr } from '../i18n.js';

const SPOTS = { head: [60, 20], neck: [60, 44], shoulder: [35, 58], chest: [60, 74], elbow: [27, 98], back: [60, 112], wrist: [22, 128], hip: [49, 138], knee: [49, 190], ankle: [49, 238] };
const FIG = '<g class="bm-fig"><circle cx="60" cy="20" r="13"/><rect x="54" y="32" width="12" height="12" rx="4"/><path d="M34 50h52q6 0 6 8l-2 54q0 8-8 10l-4 18H42l-4-18q-8-2-8-10l-2-54q0-8 6-8z"/><path d="M33 54 22 100l-2 30 6 2 6-30 8-36z"/><path d="M87 54l11 46 2 30-6 2-6-30-8-36z"/><path d="M42 136h17l-2 50-2 52h-9l-2-52z"/><path d="M61 136h17l-2 50-2 52h-9l-2-52z"/></g>';

export default function me({ user, go }) {
  if (!user?.profile) return { redirect: '/login?next=/me' };
  if (user.role === 'coach') return { redirect: '/coach' };
  if (!user.profile.health?.height) return { redirect: '/assistant?tab=data' };
  let root;

  function build() {
    const lang = getLang();
    const L = (o) => pick(o, lang);
    const u = getUser(), p = u.profile;
    const trainings = getTrainings(), pains = getPains();
    const directive = coachDirective('me');
    const P = makePlan(p, trainings, pains, new Date(), directive);
    const R = readiness(P, trainings);
    const msgs = getCoachMsgs('me');
    const unread = msgs.filter((m) => !m.read);
    const today = iso(new Date());
    const drunk = getWater(today);
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    const toH = (s) => { const [h, m] = s.split('–')[0].split(':').map(Number); return h + m / 60; };
    const nextW = P.waterPlan.find((x) => toH(x.at) >= nowH);
    const meal = P.meals.find((x) => toH(x.at) >= nowH) || P.meals[0];
    const mood = R.zone === 'go' ? 'happy' : R.zone === 'care' ? 'calm' : 'worried';
    const first = (p.name || '').split(' ')[0];
    const brief = todayBrief({ lang, profile: p, plan: P }, lang).split('\n')[0].replace(/^[^\p{L}]+/u, '');
    // Неделя: нагрузка по дням
    const dn = t('train.days_short');
    const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(new Date(), i - 6); const k = iso(d); return { d, n: dn[(d.getDay() + 6) % 7], v: trainings.filter((s) => s.date === k).reduce((a, s) => a + sLoad(s), 0) }; });
    const maxD = Math.max(1, ...days.map((x) => x.v));
    const streak = (() => { let n = 0; for (let i = 6; i >= 0 && days[i].v > 0; i--) n++; return n; })();
    const prog = ['pullups', 'squats', 'weight'].map((m) => ({ m, s: series(trainings, m) })).filter((x) => x.s.length >= 2);
    const tests = getResults();
    const zoneTxt = t('me.zone_' + R.zone);

    return `
    <section class="container me-head">
      <div class="me-id">
        <div class="avatar">${esc((first || '?')[0])}</div>
        <div><h1 class="display">${esc(p.name)}</h1>
          <p class="muted">${esc(tr(styleName(p.style)))}, ${p.weight} ${esc(t('unit.kg'))}${p.region ? ', ' + esc(tr(regionName(p.region))) : ''}</p></div>
      </div>
      <a class="btn btn-quiet btn-sm" href="#/profile">${icon.user}${esc(t('me.settings'))}</a>
    </section>

    <section class="container">
      ${unread.length || directive ? `<div class="coach-msg">${icon.coach}<div><b>${esc(t('me.from_coach'))}</b>${(unread[0] || directive) ? `<p>${esc((unread[0] || directive).text)}</p>` : ''}<small>${esc(fmtDate((unread[0] || directive).at, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}</small></div>${unread.length ? `<button class="btn btn-ghost btn-sm" data-read>${esc(t('me.got_it'))}</button>` : ''}</div>` : ''}

      <div class="me-hero">
        ${readinessGol(R.score, R.zone, t('me.readiness'), zoneTxt)}
        <div class="dost-say">
          ${dostFace(mood, 'big')}
          <div class="say">
            <p class="say-hi">${esc(t('me.hi', { n: first }))}</p>
            <p class="say-main">${esc(brief)}</p>
            ${P.avoid.length ? `<div class="extiles">${P.avoid.slice(0, 4).map((x) => exTile(x, lang)).join('')}</div>` : ''}
            <div class="row row-wrap mt-4">
              <a class="btn btn-gold btn-sm" href="#/assistant?tab=chat">${icon.chat}${esc(t('me.ask_dost'))}</a>
              <a class="btn btn-ghost btn-sm" href="#/assistant?tab=pain">${esc(t('me.log_pain'))}</a>
            </div>
          </div>
        </div>
      </div>

      <div class="me-grid">
        <article class="mcard m-water">
          <h2>${esc(t('dost.water_t'))}</h2>
          <div class="water-box">
            <button class="glass-btn" data-water="250" aria-label="+250 ${esc(t('dost.ml'))}">${waterGlass(drunk, P.water)}<span class="plus">+250</span></button>
            <div><b class="num big">${fmtNum(drunk / 1000, 1)}<small> / ${fmtNum(P.water / 1000, 1)} ${esc(t('coach.l'))}</small></b>
              ${nextW ? `<p class="muted">${esc(t('me.next_drink', { t: nextW.at.split('–')[0], ml: nextW.ml }))}</p>` : `<p class="muted">${esc(t('me.water_done'))}</p>`}
              <button class="btn btn-quiet btn-sm" data-water="-250">−250</button></div>
          </div>
        </article>

        <article class="mcard m-meal">
          <h2>${esc(t('me.next_meal'))}</h2>
          <p class="meal-t"><b class="num">${esc(meal.at)}</b> ${esc(L(meal.name))}</p>
          <div class="meal-foods">${meal.what.map((id) => `<span><i>${FOOD_EMOJI[id] || '🍽'}</i>${esc(L(foodById(id).name).split(/[:(,]/)[0])}</span>`).join('')}</div>
          ${P.kcal ? `<p class="muted mt-3" style="font-size:var(--fs-small)">${esc(t('me.day_need', { k: P.kcal, p: P.protein }))}</p>` : ''}
          <a class="mlink" href="#/assistant?tab=chat&q=food">${esc(t('me.whole_menu'))}</a>
        </article>

        <article class="mcard m-week">
          <h2>${esc(t('me.week'))}</h2>
          <div class="wbars">${days.map((x, i) => `<div class="${i === 6 ? 'today' : ''}"><i style="height:${x.v ? Math.max(8, (x.v / maxD) * 100) : 3}%"></i><span>${esc(x.n)}</span></div>`).join('')}</div>
          <p class="muted" style="font-size:var(--fs-small)">${esc(t('me.week_sum', { n: P.sm.sessions, m: P.sm.minutes }))}${streak > 1 ? ' · ' + esc(t('me.streak', { n: streak })) : ''}</p>
          <div class="row row-wrap mt-3"><a class="btn btn-gold btn-sm" href="#/training/live">${icon.live}${esc(t('cam.open'))}</a><a class="btn btn-ghost btn-sm" href="#/training/new">${icon.plus}${esc(t('train.add'))}</a><a class="mlink" href="#/training">${esc(t('me.diary'))}</a></div>
        </article>

        <article class="mcard m-progress">
          <h2>${esc(t('me.progress'))}</h2>
          ${prog.length ? prog.map((x) => { const a = x.s[0].v, b = x.s.at(-1).v, d = b - a; const good = x.m === 'weight' ? null : d >= 0; return `
            <div class="prow"><span>${esc(t('train.m_' + x.m))}</span>${sparkline(x.s.slice(-10).map((q) => q.v))}<b class="num">${fmtNum(b, x.m === 'weight' ? 1 : 0)}</b><i class="${good == null ? '' : good ? 'up' : 'down'}">${d > 0 ? '+' : ''}${fmtNum(d, x.m === 'weight' ? 1 : 0)}</i></div>`; }).join('')
            : `<p class="muted">${esc(t('me.no_progress'))}</p>`}
        </article>

        <article class="mcard m-pain">
          <h2>${esc(t('me.body'))}</h2>
          <div class="pain-box">
            <svg class="bodymap mini" viewBox="0 0 120 256" aria-hidden="true">${FIG}${P.act.map((x) => { const s = SPOTS[x.area]; return s ? `<circle class="pulse-dot" cx="${x.side === 'r' ? 120 - s[0] : s[0]}" cy="${s[1]}" r="9" style="fill:${x.level >= 7 || (x.flags || []).length ? '#e23b3b' : x.level >= 4 ? '#e8a21d' : '#27b663'}"/>` : ''; }).join('')}</svg>
            <div>${P.act.length ? P.act.map((x) => `<p><b>${esc(L(areaById(x.area).name))}</b> ${x.level}/10</p>`).join('') : `<p>${esc(t('me.no_pain'))}</p>`}
              <a class="btn btn-ghost btn-sm mt-3" href="#/assistant?tab=pain">${esc(t('me.log_pain'))}</a></div>
          </div>
        </article>

        <article class="mcard m-tests">
          <h2>Talent Scout</h2>
          ${tests.length ? `<p><b class="num big">${tests.length}</b> ${esc(t('me.tests_done'))}</p><p class="muted" style="font-size:var(--fs-small)">${esc(t('me.last_test', { d: fmtDate(tests[0].createdAt, { day: 'numeric', month: 'long' }) }))}</p><a class="mlink" href="#/profile">${esc(t('me.see_results'))}</a>`
            : `<p class="muted">${esc(t('me.no_tests'))}</p><a class="btn btn-ghost btn-sm mt-3" href="#/scout">${esc(t('profile.go_test'))}</a>`}
        </article>
      </div>
      <p class="muted center mt-8" style="font-size:var(--fs-micro);padding-bottom:var(--s-16)">${esc(t('dost.not_doctor'))}</p>
    </section>`;
  }

  function render() {
    root.innerHTML = build();
    root.querySelectorAll('[data-water]').forEach((b) => b.addEventListener('click', () => {
      const v = +b.dataset.water;
      addWater(iso(new Date()), v);
      render();
      if (v > 0) { root.querySelector('.glass-btn')?.classList.add('gulp'); }
    }));
    root.querySelector('[data-read]')?.addEventListener('click', () => { markCoachMsgsRead('me'); render(); toast(t('me.got_it_toast')); });
  }

  return {
    html: '<div id="me-root"></div>',
    title: t('me.title'),
    mount(r) { root = r.querySelector('#me-root'); render(); },
  };
}
