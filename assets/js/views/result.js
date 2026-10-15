import { t, tr, fmtNum, fmtDate } from '../i18n.js';
import { esc, icon, countUp, toast } from '../ui.js';
import { testById, regionName, styleName } from '../data.js';
import { getResult, getResults, getVideo, putVideo, updateResult } from '../store.js';
import { drawFrame, frameAt, analyzeVideo } from '../pose.js';

// Карточки показателей: что измерено, единицы, источник
export function statDefs(testId) {
  const D = {
    reps: { k: 'metric.reps', unit: '', digits: 0, src: 'measured' },
    tempo: { k: 'metric.tempo', unit: 'unit.per_min', digits: 0, src: 'measured' },
    depth: { k: testId === 'pushup' ? 'metric.elbow' : 'metric.knee', unit: '°', digits: 0, src: 'measured' },
    consistency: { k: 'metric.consistency', unit: '%', digits: 0, src: 'measured' },
    bodyLine: { k: 'metric.body_line', unit: '°', digits: 0, src: 'measured' },
    fatigue: { k: 'metric.fatigue', unit: '%', digits: 0, src: 'measured' },
    hipAngle: { k: 'metric.hip_angle', unit: '°', digits: 0, src: 'measured' },
    hold: { k: 'metric.hold', unit: 'unit.sec', digits: 1, src: 'measured' },
    airtime: { k: 'metric.airtime', unit: 'unit.sec', digits: 2, src: 'model' },
  };
  const order = {
    squat: ['reps', 'tempo', 'depth', 'consistency'],
    pushup: ['reps', 'tempo', 'depth', 'bodyLine'],
    burpee: ['reps', 'tempo', 'fatigue'],
    reach: ['hipAngle'],
    bridge: ['hold'],
    jump: ['airtime'],
  }[testId] || [];
  return order.map((key) => ({ key, ...D[key] }));
}

function lineChart(points) {
  const W = 320, H = 120, pad = 24;
  const max = Math.max(...points.map((p) => p.v), 1);
  const X = (i) => pad + (i * (W - pad * 2)) / Math.max(1, points.length - 1);
  const Y = (v) => H - pad - (v / max) * (H - pad * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(p.v)}`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('result.progress'))}">
    <line x1="${pad}" x2="${W - pad}" y1="${H - pad}" y2="${H - pad}" stroke="var(--line-strong)"/>
    <path d="${d}" fill="none" stroke="#c8a45a" stroke-width="2"/>
    ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.v)}" r="${i === points.length - 1 ? 5 : 3.5}" fill="${i === points.length - 1 ? '#c8a45a' : 'var(--bg)'}" stroke="#c8a45a" stroke-width="1.5"/>
      <text x="${X(i)}" y="${Y(p.v) - 10}" text-anchor="middle">${p.v}</text>
      <text x="${X(i)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>`).join('')}
  </svg>`;
}

export function coachTimeline(r) {
  const ok = r.analysis?.status === 'ok';
  const reviewed = r.coach?.status === 'reviewed';
  const rows = [
    ['done', 'tl.recorded', fmtDate(r.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })],
    [ok ? 'done' : 'now', ok ? 'tl.measured' : 'tl.not_measured', ok ? t('tl.measured_d') : t('tl.not_measured_d')],
    [reviewed ? 'done' : 'now', reviewed ? 'tl.coach_done' : 'tl.coach_wait', reviewed ? fmtDate(r.coach.at, { day: 'numeric', month: 'short' }) : t('tl.coach_wait_d')],
    ['', 'tl.federation', t('tl.federation_d')],
  ];
  return rows.map(([s, k, d]) => `<div class="status-line ${s}"><span class="dot">${s === 'done' ? icon.check : ''}</span><div><b>${esc(t(k))}</b><span>${esc(d)}</span></div></div>`).join('');
}

export default function result({ params, go }) {
  const r = getResult(params.id);
  if (!r) return { html: `<section class="container section"><div class="empty"><h3>${esc(t('result.not_found'))}</h3><a class="btn btn-primary" href="#/scout">Talent Scout</a></div></section>` };
  const x = testById(r.testId);
  const a = r.analysis || {};
  const q = r.quality || {};
  const defs = statDefs(r.testId);

  const history = getResults().filter((z) => z.testId === r.testId && z.analysis?.metrics?.reps != null).reverse();
  const chartPts = history.map((z, i) => ({ v: z.analysis.metrics.reps, label: '#' + (i + 1) }));

  const statusNotice = a.status === 'unavailable'
    ? `<div class="notice mt-6">${icon.info}<div><b>${esc(t('result.unavail_t'))}</b><br>${esc(t('result.unavail'))}<div class="mt-3"><button class="btn btn-primary btn-sm" data-rerun>${esc(t('result.rerun'))}</button></div></div></div>`
    : a.status === 'low_quality'
      ? `<div class="notice error mt-6">${icon.alert}<div><b>${esc(t('result.lowq_t'))}</b><br>${esc(t('result.lowq'))}</div></div>`
      : '';

  const confLabel = { high: t('q.high'), medium: t('q.medium'), low: t('q.low') }[q.confidence] || '—';
  const brightOk = q.brightness == null ? null : q.brightness > 55 && q.brightness < 225;

  const html = `
  <section class="container section-tight">
    <a class="btn btn-quiet" href="#/scout">${icon.back}Talent Scout</a>
    <div class="stepper mt-4" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>
    <div class="row row-wrap between mt-6">
      <div>
        <p class="eyebrow">${esc(t('result.eyebrow'))} · ${esc(fmtDate(r.createdAt, { day: 'numeric', month: 'long' }))}</p>
        <h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(tr(x?.name))}</h1>
      </div>
      <a class="btn btn-ghost btn-sm" href="#/scout/test/${r.testId}">${icon.replay}${esc(t('result.again'))}</a>
    </div>
    ${statusNotice}

    <div class="result-grid mt-8">
      <div>
        <div class="analysis-stage" id="stage">
          <video playsinline controls data-video></video>
          <canvas data-overlay></canvas>
        </div>
        <div class="row between mt-3">
          <label class="check" style="align-items:center"><input type="checkbox" data-ov checked> ${esc(t('result.overlay'))}</label>
          <span class="muted" style="font-size:var(--fs-micro)">${esc(a.model ? t('result.model_used', { m: a.model }) : '')}</span>
        </div>
        <p class="muted mt-2" style="font-size:var(--fs-small)" data-novideo hidden>${esc(t('result.no_video'))}</p>
      </div>

      <div class="stack">
        ${defs.length && a.status !== 'unavailable' ? `
        <div class="stats">
          ${defs.map((d, i) => {
            const v = a.metrics?.[d.key];
            return `<div class="stat ${defs.length === 1 || (defs.length === 3 && i === 0) ? 'wide' : ''}">
              <span class="k">${esc(t(d.k))}</span>
              <span class="v num"><span data-count="${v ?? ''}" data-digits="${d.digits}">${v == null ? '—' : '0'}</span>${v != null && d.unit ? `<small>${esc(d.unit.startsWith('unit.') ? t(d.unit) : d.unit)}</small>` : ''}</span>
              <span class="badge badge-${d.src}" style="justify-self:start">${esc(t('label.' + d.src))}</span>
            </div>`;
          }).join('')}
          ${r.testId === 'jump' ? `<div class="stat wide"><span class="k">${esc(t('metric.distance'))}</span><span class="v" style="font-size:1.4rem">${r.coach?.distance ? esc(r.coach.distance) + ' <small>' + esc(t('unit.cm')) + '</small>' : esc(t('result.coach_measures'))}</span><span class="badge badge-coach" style="justify-self:start">${esc(t('label.coach'))}</span></div>` : ''}
        </div>` : ''}

        ${(a.issues || []).length ? `
        <div class="panel">
          <h2 class="eyebrow mb-4">${esc(t('result.improve'))}</h2>
          <ul class="stack" style="list-style:none">${a.issues.map((k) => `<li class="row" style="align-items:flex-start">${icon.arrow.replace('<svg', '<svg width="18" height="18" style="color:var(--c-gold);flex:none;margin-top:3px"')}<span>${esc(t('issue.' + k))}</span></li>`).join('')}</ul>
        </div>` : ''}

        <div class="panel">
          <div class="row between mb-4"><h2 class="eyebrow">${esc(t('result.quality'))}</h2><span class="badge ${q.confidence === 'high' ? 'badge-measured' : q.confidence === 'low' ? '' : 'badge-gold'}">${esc(confLabel)}</span></div>
          <div class="stack">
            ${q.inFrame != null ? `<div class="meter"><div class="top"><span>${esc(t('q.in_frame'))}</span><b class="num">${Math.round(q.inFrame * 100)}%</b></div><div class="progress ok"><i style="width:${q.inFrame * 100}%"></i></div></div>` : ''}
            ${q.detected != null ? `<div class="meter"><div class="top"><span>${esc(t('q.detected'))}</span><b class="num">${Math.round(q.detected * 100)}%</b></div><div class="progress ok"><i style="width:${q.detected * 100}%"></i></div></div>` : ''}
            <div class="row between" style="font-size:var(--fs-small)"><span>${esc(t('q.light'))}</span><b>${brightOk == null ? '—' : esc(t(brightOk ? 'q.light_ok' : 'q.light_bad'))}</b></div>
            <div class="row between" style="font-size:var(--fs-small)"><span>${esc(t('q.duration'))}</span><b class="num">${r.durationSec ? fmtNum(r.durationSec, 1) + ' ' + esc(t('unit.sec')) : '—'}</b></div>
          </div>
        </div>

        <div class="panel">
          <h2 class="eyebrow mb-3">${esc(t('result.compare'))}</h2>
          <p class="muted" style="font-size:var(--fs-small)">${esc(t('result.compare_empty', { g: r.athlete?.ageGroup || '—', s: tr(styleName(r.athlete?.style)) || '—' }))}</p>
        </div>

        ${chartPts.length >= 2 ? `<div class="panel"><h2 class="eyebrow mb-3">${esc(t('result.progress'))}</h2>${lineChart(chartPts.slice(-8))}</div>` : ''}

        ${r.coach?.status === 'reviewed' ? `
        <div class="panel" style="border-color:rgba(200,164,90,.4)">
          <div class="row between mb-3"><h2 class="eyebrow">${esc(t('result.coach_title'))}</h2><span class="badge badge-coach">${esc(t('label.coach'))}</span></div>
          <div class="row" style="align-items:baseline"><b class="display num" style="font-size:2.6rem">${r.coach.score}</b><span class="muted">/ 10 · ${esc(t('review.technique'))}</span></div>
          ${r.coach.repsConfirmed != null ? `<p class="mt-2 muted">${esc(t('review.reps_confirm'))}: <b class="num" style="color:var(--text)">${r.coach.repsConfirmed}</b></p>` : ''}
          ${r.coach.comment ? `<p class="mt-3">${esc(r.coach.comment)}</p>` : ''}
          ${r.coach.recommendation && r.coach.recommendation !== 'none' ? `<p class="mt-3"><span class="badge badge-gold">${esc(t('review.rec_' + r.coach.recommendation))}</span></p>` : ''}
        </div>` : ''}

        <div class="panel">
          <h2 class="eyebrow mb-4">${esc(t('result.status'))}</h2>
          ${coachTimeline(r)}
        </div>
        <p class="muted" style="font-size:var(--fs-micro)">${esc(t('result.disclaimer'))}</p>
      </div>
    </div>
  </section>`;

  let raf = 0, url = null, frames = null, video, canvas, ctx, show = true;
  const tick = () => {
    if (!video) return;
    const f = show ? frameAt(frames, video.currentTime) : null;
    const idx = frames ? frames.indexOf(f) : -1;
    const trail = idx > 0 ? frames.slice(Math.max(0, idx - 20), idx + 1).filter((z) => z.p).map((z) => [(z.p[7][0] + z.p[8][0]) / 2, (z.p[7][1] + z.p[8][1]) / 2]) : [];
    drawFrame(ctx, f, video, { trail });
    if (!video.paused && !video.ended) raf = requestAnimationFrame(tick);
  };

  return {
    html,
    title: tr(x?.name),
    async mount(root) {
      root.querySelectorAll('[data-count]').forEach((el) => {
        const v = parseFloat(el.dataset.count);
        if (Number.isFinite(v)) countUp(el, v, { digits: +el.dataset.digits });
      });
      video = root.querySelector('[data-video]');
      canvas = root.querySelector('[data-overlay]');
      ctx = canvas.getContext('2d');
      root.querySelector('[data-ov]').addEventListener('change', (e) => { show = e.target.checked; tick(); });

      const blob = await getVideo(r.id);
      frames = await getVideo(r.id + ':frames');
      if (!blob) {
        root.querySelector('#stage').hidden = true;
        root.querySelector('[data-novideo]').hidden = false;
      } else {
        url = URL.createObjectURL(blob);
        video.src = url;
        video.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
        video.addEventListener('seeked', tick);
        video.addEventListener('loadeddata', tick);
        window.addEventListener('resize', tick);
      }

      root.querySelector('[data-rerun]')?.addEventListener('click', async (e) => {
        if (!blob) return;
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span>${esc(t('rec.analyzing'))}`;
        try {
          const out = await analyzeVideo(blob, r.testId);
          await putVideo(r.id + ':frames', out.frames);
          updateResult(r.id, { quality: out.quality, analysis: out.analysis });
          if (out.analysis.status === 'unavailable') toast(t('result.unavail_t'), 'error');
          location.reload();
        } catch {
          toast(t('common.error_generic'), 'error');
          btn.disabled = false;
          btn.textContent = t('result.rerun');
        }
      });
    },
    unmount() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', tick);
      if (url) URL.revokeObjectURL(url);
    },
  };
}
