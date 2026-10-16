// Дневник тренировок спортсмена: сводка недели, нагрузка, календарь, прогресс показателей.
import { t, fmtNum, fmtDate } from '../i18n.js';
import { esc, icon, toast, sheet } from '../ui.js';
import { getTrainings, saveTrainings, deleteTraining, getResults } from '../store.js';
import { TYPES, METRICS, typeIcon, weekly, summary, heatmap, series, demoTrainings, load, parse } from '../training-lib.js';

// ---------- Графики (одна серия, тонкие метки, подсказка при наведении) ----------
function barsChart(weeks, W = 640) {
  const H = 220, L = 40, R = 8, T = 16, B = 28;
  const max = Math.max(1, ...weeks.map((w) => w.load));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const bw = (W - L - R) / weeks.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const ticks = []; for (let v = 0; v <= top; v += step) ticks.push(v);
  return `<svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('train.chart_load'))}">
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmtNum(v)}</text>`).join('')}
    ${weeks.map((w, i) => {
      const x = L + i * bw + bw * 0.22, wd = bw * 0.56, h = H - B - y(w.load);
      const last = i === weeks.length - 1;
      const r = Math.min(4, h);
      const path = h > 0 ? `M${x} ${H - B}V${y(w.load) + r}q0 ${-r} ${r} ${-r}h${wd - 2 * r}q${r} 0 ${r} ${r}V${H - B}z` : '';
      return `<g class="hit" data-tip="${esc(`${fmtDate(w.from, { day: 'numeric', month: 'short' })} — ${t('train.load')}: ${fmtNum(w.load)} · ${w.sessions} ${t('train.sessions_short')} · ${w.minutes} ${t('unit.min')}`)}">
        <rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent"/>
        ${path ? `<path d="${path}" class="${last ? 'bar now' : 'bar'}"/>` : ''}
        ${bw >= 64 || (weeks.length - 1 - i) % 2 === 0 ? `<text x="${x + wd / 2}" y="${H - 8}" text-anchor="middle">${esc(fmtDate(w.from, { day: 'numeric', month: 'short' }))}</text>` : ''}
      </g>`;
    }).join('')}
    <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="axis"/>
  </svg>`;
}

function niceStep(max) {
  const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || raw;
}

function lineChart(pts, metric, W = 640) {
  if (pts.length < 2) return `<div class="empty" style="padding:var(--s-8) 0"><p>${esc(t('train.need_two'))}</p></div>`;
  const H = 220, L = 44, R = 16, T = 18, B = 28;
  const vals = pts.map((p) => p.v);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.2; lo -= pad; hi += pad;
  const t0 = parse(pts[0].date).getTime(), t1 = parse(pts.at(-1).date).getTime();
  const x = (d) => L + (W - L - R) * ((parse(d).getTime() - t0) / (t1 - t0 || 1));
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.v).toFixed(1)}`).join('');
  const m = METRICS.find((q) => q.id === metric);
  const unit = m.unit ? ' ' + t(m.unit) : '';
  return `<svg class="tchart line" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('train.m_' + metric))}" data-line>
    ${ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmtNum(v, m.digits)}</text>`).join('')}
    <line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="axis"/>
    <text x="${L}" y="${H - 8}">${esc(fmtDate(pts[0].date, { day: 'numeric', month: 'short' }))}</text>
    <text x="${W - R}" y="${H - 8}" text-anchor="end">${esc(fmtDate(pts.at(-1).date, { day: 'numeric', month: 'short' }))}</text>
    <path d="${d}" class="ln"/>
    <line class="cross" y1="${T}" y2="${H - B}" x1="-10" x2="-10"/>
    ${pts.map((p, i) => `<circle class="${i === pts.length - 1 ? 'dot last' : 'dot'}" cx="${x(p.date)}" cy="${y(p.v)}" r="${i === pts.length - 1 ? 5 : 3.5}" data-x="${x(p.date)}" data-tip="${esc(`${fmtDate(p.date, { day: 'numeric', month: 'long' })}: ${fmtNum(p.v, m.digits)}${unit}`)}"/>`).join('')}
    <text x="${x(pts.at(-1).date) - 8}" y="${y(pts.at(-1).v) - 12}" text-anchor="end" class="lbl">${fmtNum(pts.at(-1).v, m.digits)}${esc(unit)}</text>
  </svg>`;
}

function heatGrid(cells) {
  const max = Math.max(1, ...cells.map((c) => c.value));
  const level = (v) => (v <= 0 ? 0 : v < max * 0.25 ? 1 : v < max * 0.5 ? 2 : v < max * 0.75 ? 3 : 4);
  const weeks = Math.max(...cells.map((c) => c.w)) + 1;
  const days = t('train.days_short');
  return `<div class="heat" style="--weeks:${weeks}">
    <div class="heat-days">${days.map((d, i) => `<span>${i % 2 === 0 ? esc(d) : ''}</span>`).join('')}</div>
    <div class="heat-grid">${cells.map((c) => `<i class="l${c.future ? 'f' : level(c.value)}" style="grid-column:${c.w + 1};grid-row:${c.d + 1}" data-tip="${esc(`${fmtDate(c.date, { day: 'numeric', month: 'long' })}: ${c.value ? t('train.load') + ' ' + fmtNum(c.value) : t('train.rest_day')}`)}"></i>`).join('')}</div>
    <div class="heat-legend"><span>${esc(t('train.less'))}</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>${esc(t('train.more'))}</span></div>
  </div>`;
}

function typeBars(list) {
  const recent = list.filter((s) => parse(s.date) >= new Date(Date.now() - 28 * 864e5));
  const total = recent.reduce((a, s) => a + s.minutes, 0) || 1;
  const rows = TYPES.map((ty) => ({ ty, m: recent.filter((s) => s.type === ty.id).reduce((a, s) => a + s.minutes, 0) }))
    .filter((r) => r.m > 0).sort((a, b) => b.m - a.m);
  if (!rows.length) return '';
  return `<div class="tbars">${rows.map((r) => `
    <div class="tbar" data-tip="${esc(`${t('train.type_' + r.ty.id)}: ${r.m} ${t('unit.min')}`)}">
      <span class="nm">${typeIcon(r.ty.id)}${esc(t('train.type_' + r.ty.id))}</span>
      <span class="track"><i style="width:${(r.m / total) * 100}%"></i></span>
      <b class="num">${Math.round((r.m / total) * 100)}%</b>
    </div>`).join('')}</div>`;
}

const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
const moodFace = (v) => ['', '😣', '😕', '😐', '🙂', '😄'][Math.round(v)] || '—';

export default function training({ user, go }) {
  if (!user?.profile) return { redirect: '/login?next=/training' };
  let metric = 'pullups', showAll = false;
  // Ширина графика по реальному месту — чтобы подписи не мельчали на телефоне
  const chartW = (host, half) => { const cw = host.clientWidth || 640; const w = (half && innerWidth >= 820 ? (cw - 24) / 2 : cw) - 50; return Math.round(Math.max(300, Math.min(640, w))); };

  const html = `
  <section class="container scout-hero">
    <span class="medallion" aria-hidden="true" style="color:var(--c-gold);--o:.09;opacity:.09;width:300px;aspect-ratio:1.4;right:var(--gutter);top:24px"></span>
    <p class="eyebrow">${esc(t('train.eyebrow'))}</p>
    <h1 class="display mt-2" data-split>${esc(t('train.title'))}</h1>
    <p class="muted mt-4 max-prose">${esc(t('train.lead'))}</p>
    <div class="row row-wrap mt-6">
      <a class="btn btn-gold" href="#/training/new">${icon.plus}${esc(t('train.add'))}</a>
      <span id="demo-ctl"></span>
    </div>
  </section>
  <section class="container" style="padding-bottom:var(--s-16)" id="diary"></section>`;

  function render(root) {
    const list = getTrainings();
    const host = root.querySelector('#diary');
    const hasDemo = list.some((s) => s.demo);
    root.querySelector('#demo-ctl').innerHTML = hasDemo
      ? `<button class="btn btn-ghost" data-clear>${esc(t('train.clear_demo'))}</button>`
      : !list.length ? `<button class="btn btn-ghost" data-demo>${esc(t('train.fill_demo'))}</button>` : '';

    if (!list.length) {
      host.innerHTML = `<div class="empty panel">${icon.diary}<h3>${esc(t('train.empty'))}</h3><p class="max-prose">${esc(t('train.empty_hint'))}</p></div>`;
      bindTop(root); return;
    }
    const sm = summary(list);
    const loadChange = pct(sm.load, sm.loadPrev);
    const weeks = weekly(list, 8);
    const pts = series(list, metric);
    // Результаты тестов Talent Scout тоже показываем рядом
    const tests = getResults().filter((r) => r.analysis?.metrics?.reps != null).length;

    host.innerHTML = `
      ${hasDemo ? `<div class="notice mb-6">${icon.info}<div>${esc(t('train.demo_note'))}</div></div>` : ''}
      ${sm.acwr != null && sm.acwr > 1.5 ? `<div class="notice error mb-4">${icon.alert}<div><b>${esc(t('train.spike_t'))}</b><br>${esc(t('train.spike', { r: fmtNum(sm.acwr, 1) }))}</div></div>` : ''}
      ${sm.weightDrop != null && sm.weightDrop > 3 ? `<div class="notice error mb-4">${icon.alert}<div><b>${esc(t('train.weight_t'))}</b><br>${esc(t('train.weight_drop', { p: fmtNum(sm.weightDrop, 1) }))}</div></div>` : ''}

      <div class="ttiles" data-stagger>
        <div class="ttile"><span class="k">${esc(t('train.k_sessions'))}</span><b class="num" data-to="${sm.sessions}">${sm.sessions}</b><span class="s">${esc(t('train.last7'))}</span></div>
        <div class="ttile"><span class="k">${esc(t('train.k_minutes'))}</span><b class="num" data-to="${sm.minutes}">${sm.minutes}</b><span class="s">${esc(t('train.last7'))}</span></div>
        <div class="ttile accent"><span class="k">${esc(t('train.k_load'))}</span><b class="num" data-to="${sm.load}">${sm.load}</b><span class="s">${loadChange == null ? esc(t('train.last7')) : `<span class="delta ${loadChange >= 0 ? 'up' : 'down'}">${loadChange >= 0 ? '▲' : '▼'} ${Math.abs(loadChange)}%</span> ${esc(t('train.vs_prev'))}`}</span></div>
        <div class="ttile"><span class="k">${esc(t('train.k_rpe'))}</span><b class="num">${sm.rpe != null ? fmtNum(sm.rpe, 1) : '—'}<small>/10</small></b><span class="s">${esc(t('train.rpe_hint'))}</span></div>
        <div class="ttile"><span class="k">${esc(t('train.k_mood'))}</span><b>${sm.mood != null ? moodFace(sm.mood) : '—'}</b><span class="s">${sm.mood != null ? fmtNum(sm.mood, 1) + ' / 5' : ''}</span></div>
      </div>

      <div class="grid-2 mt-8" style="align-items:start">
        <div class="panel">
          <div class="row between mb-3"><h2 class="eyebrow">${esc(t('train.chart_load'))}</h2><span class="muted" style="font-size:var(--fs-micro)">${esc(t('train.load_formula'))}</span></div>
          ${barsChart(weeks, chartW(host, true))}
        </div>
        <div class="panel">
          <h2 class="eyebrow mb-3">${esc(t('train.calendar'))}</h2>
          ${heatGrid(heatmap(list, 12))}
          <h2 class="eyebrow mt-6 mb-3">${esc(t('train.by_type'))}</h2>
          ${typeBars(list)}
        </div>
      </div>

      <div class="panel mt-6">
        <div class="row row-wrap between mb-4"><h2 class="eyebrow">${esc(t('train.progress'))}</h2>
          <div class="chips">${METRICS.map((m) => `<button class="chip" data-metric="${m.id}" aria-pressed="${m.id === metric}">${esc(t('train.m_' + m.id))}</button>`).join('')}</div>
        </div>
        <div id="line-host">${lineChart(pts, metric, chartW(host, false))}</div>
        ${tests ? `<p class="muted mt-3" style="font-size:var(--fs-small)">${esc(t('train.tests_link', { n: tests }))} <a href="#/profile">${esc(t('nav.profile'))} →</a></p>` : ''}
      </div>

      <h2 class="eyebrow mt-10 mb-4">${esc(t('train.history'))}</h2>
      <div class="list">${list.slice(0, showAll ? 60 : 6).map((s) => `
        <div class="list-row tsess">
          <span class="ticon">${typeIcon(s.type)}</span>
          <span class="grow"><b>${esc(t('train.type_' + s.type))}</b>${s.demo ? ` <span class="badge badge-demo" style="padding:2px 6px;font-size:.58rem">${esc(t('common.demo'))}</span>` : ''}
            <span class="muted" style="display:block;font-size:var(--fs-small)">${esc(fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'long' }))} · ${s.minutes} ${esc(t('unit.min'))} · RPE ${s.rpe}${s.mood ? ' · ' + moodFace(s.mood) : ''}</span>
            ${[s.weight != null ? `${t('train.m_weight')}: ${s.weight} ${t('unit.kg')}` : '', s.pullups != null ? `${t('train.m_pullups')}: ${s.pullups}` : '', s.sprawls != null ? `${t('train.m_sprawls')}: ${s.sprawls}` : '', s.shuttle != null ? `${t('train.m_shuttle')}: ${s.shuttle} ${t('unit.sec')}` : '', s.pulse != null ? `${t('train.m_pulse')}: ${s.pulse}` : ''].filter(Boolean).map((x) => `<span class="badge" style="margin:4px 4px 0 0">${esc(x)}</span>`).join('')}
            ${s.notes ? `<span style="display:block;font-size:var(--fs-small);margin-top:4px">${esc(s.notes)}</span>` : ''}
          </span>
          <b class="num tload" title="${esc(t('train.load'))}">${load(s)}</b>
          <button class="icon-btn" data-del="${s.id}" aria-label="${esc(t('train.delete'))}" style="border-color:transparent;color:var(--text-2)">${icon.trash}</button>
        </div>`).join('')}</div>
      ${list.length > 6 ? `<button class="btn btn-ghost btn-block mt-4" data-more>${esc(showAll ? t('train.show_less') : t('train.show_more', { n: list.length - 6 }))}</button>` : ''}`;

    bindTop(root);
    host.querySelector('[data-more]')?.addEventListener('click', () => { showAll = !showAll; render(root); });
    host.querySelectorAll('[data-metric]').forEach((b) => b.addEventListener('click', () => {
      metric = b.dataset.metric;
      host.querySelectorAll('[data-metric]').forEach((z) => z.setAttribute('aria-pressed', z === b));
      host.querySelector('#line-host').innerHTML = lineChart(series(getTrainings(), metric), metric, chartW(host, false));
      bindTips(host);
    }));
    host.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      sheet(`<h3>${esc(t('train.delete_t'))}</h3><div class="stack mt-6"><button class="btn btn-danger btn-block" data-yes>${esc(t('train.delete'))}</button><button class="btn btn-ghost btn-block" data-close>${esc(t('common.cancel'))}</button></div>`,
        (panel, close) => panel.querySelector('[data-yes]').addEventListener('click', () => { deleteTraining(b.dataset.del); close(); render(root); toast(t('train.deleted')); }));
    }));
    bindTips(host);
    import('../fx.js').then(({ initFx }) => initFx(host));
  }

  function bindTop(root) {
    root.querySelector('[data-demo]')?.addEventListener('click', () => { saveTrainings(demoTrainings()); render(root); toast(t('train.demo_added')); });
    root.querySelector('[data-clear]')?.addEventListener('click', () => { saveTrainings(getTrainings().filter((s) => !s.demo)); render(root); });
  }

  // Подсказка при наведении/касании
  function bindTips(host) {
    let tip = document.querySelector('.ttip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'ttip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    const show = (el, e) => {
      tip.textContent = el.dataset.tip;
      tip.classList.add('on');
      const r = el.getBoundingClientRect();
      const x = e?.clientX ?? r.left + r.width / 2, y = (e?.clientY ?? r.top) - 12;
      tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, x - tip.offsetWidth / 2)) + 'px';
      tip.style.top = Math.max(8, y - tip.offsetHeight) + 'px';
      const svg = el.closest('[data-line]');
      if (svg && el.dataset.x) { const c = svg.querySelector('.cross'); c.setAttribute('x1', el.dataset.x); c.setAttribute('x2', el.dataset.x); }
    };
    const hide = () => tip.classList.remove('on');
    host.querySelectorAll('[data-tip]').forEach((el) => {
      el.addEventListener('pointerenter', (e) => show(el, e));
      el.addEventListener('pointermove', (e) => show(el, e));
      el.addEventListener('pointerleave', hide);
      el.addEventListener('click', (e) => show(el, e));
    });
    // Для линии: ближайшая точка по X на всей ширине
    host.querySelectorAll('[data-line]').forEach((svg) => {
      const dots = [...svg.querySelectorAll('.dot')];
      svg.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect();
        const vx = ((e.clientX - r.left) / r.width) * svg.viewBox.baseVal.width;
        const near = dots.reduce((a, d) => (Math.abs(+d.dataset.x - vx) < Math.abs(+a.dataset.x - vx) ? d : a), dots[0]);
        if (near) show(near, e);
      });
      svg.addEventListener('pointerleave', () => { hide(); const c = svg.querySelector('.cross'); c.setAttribute('x1', -10); c.setAttribute('x2', -10); });
    });
  }

  return { html, title: t('train.title'), mount: render, unmount() { document.querySelector('.ttip')?.classList.remove('on'); } };
}
