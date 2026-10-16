import { t, tr, fmtNum } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { testById, regionName, styleName } from '../data.js';
import { getResult, getVideo, updateResult } from '../store.js';
import { drawFrame, frameAt } from '../pose.js';
import { statDefs, COACH_EXTRA, REP_TESTS } from './result.js';

export default function review({ params, user, go }) {
  if (!user?.profile) return { redirect: '/login?next=/coach' };
  const r = getResult(params.id);
  if (!r) return { redirect: '/coach' };
  const x = testById(r.testId);
  const a = r.analysis || {};
  const c = r.coach || {};
  const defs = statDefs(r.testId);

  const html = `
  <section class="container section-tight" style="padding-bottom:var(--s-16)">
    <a class="btn btn-quiet" href="#/coach">${icon.back}${esc(t('coach.title'))}</a>
    <div class="row row-wrap between mt-4">
      <div>
        <p class="eyebrow">${esc(t('review.eyebrow'))}</p>
        <h1 class="display mt-2" style="font-size:var(--fs-h2)">${esc(r.athlete?.name || '—')} · ${esc(tr(x?.name))}</h1>
        <p class="muted mt-2">${r.athlete?.age ?? '—'} ${esc(t('unit.years'))} · ${esc(tr(styleName(r.athlete?.style)))} · ${r.athlete?.weight ?? '—'} ${esc(t('unit.kg'))} · ${esc(tr(regionName(r.athlete?.region)))}</p>
      </div>
    </div>
    <div class="result-grid mt-8">
      <div>
        <div class="analysis-stage"><video playsinline controls data-video></video><canvas data-overlay></canvas></div>
        <div class="panel mt-6">
          <h2 class="eyebrow mb-4">${esc(t('review.why'))}</h2>
          <table class="nutri">
            ${defs.map((d) => `<tr><td>${esc(t(d.k))} <span class="badge badge-${d.src}" style="margin-left:6px">${esc(t('label.' + d.src))}</span></td><td>${a.metrics?.[d.key] != null ? fmtNum(a.metrics[d.key], d.digits) + ' ' + esc(d.unit.startsWith('unit.') ? t(d.unit) : d.unit) : '—'}</td></tr>`).join('')}
            <tr><td>${esc(t('q.in_frame'))}</td><td>${r.quality?.inFrame != null ? Math.round(r.quality.inFrame * 100) + '%' : '—'}</td></tr>
            <tr><td>${esc(t('q.detected'))}</td><td>${r.quality?.detected != null ? Math.round(r.quality.detected * 100) + '%' : '—'}</td></tr>
            <tr><td>${esc(t('review.side'))}</td><td>${esc(a.side ? t('review.side_' + a.side) : '—')}</td></tr>
            <tr><td>${esc(t('review.model'))}</td><td>${esc(a.model || t('review.no_model'))}</td></tr>
          </table>
          ${(a.issues || []).length ? `<p class="mt-4" style="font-size:var(--fs-small)"><b>${esc(t('result.improve'))}:</b> ${a.issues.map((k) => esc(t('issue.' + k))).join('; ')}</p>` : ''}
        </div>
      </div>
      <form class="panel stack" data-form novalidate>
        <h2 class="eyebrow">${esc(t('review.form'))}</h2>
        ${a.metrics?.reps != null || REP_TESTS.includes(r.testId) ? `
        <div class="field"><label for="reps">${esc(t('review.reps_confirm'))}</label><input id="reps" class="input num" inputmode="numeric" value="${esc(c.repsConfirmed ?? a.metrics?.reps ?? '')}"><span class="hint">${esc(t('review.reps_hint'))}</span></div>` : ''}
        ${COACH_EXTRA[r.testId] ? `<div class="field"><label for="extra">${esc(t(COACH_EXTRA[r.testId].k))}${COACH_EXTRA[r.testId].unit ? ', ' + esc(t(COACH_EXTRA[r.testId].unit)) : ''}</label><input id="extra" class="input num" inputmode="decimal" placeholder="${COACH_EXTRA[r.testId].ph}" value="${esc(c.extra ?? '')}"></div>` : ''}
        <div class="field">
          <label for="score">${esc(t('review.technique'))}: <b data-score-out class="num">${c.score ?? 7}</b> / 10</label>
          <input id="score" type="range" min="1" max="10" step="1" value="${c.score ?? 7}" style="accent-color:#27b663;width:100%">
        </div>
        <div class="field"><label for="cmt">${esc(t('review.comment'))}</label><textarea id="cmt" class="input" placeholder="${esc(t('review.comment_ph'))}">${esc(c.comment || '')}</textarea></div>
        <fieldset class="stack" style="border:0;padding:0;margin:0">
          <legend class="label" style="font-size:var(--fs-small);font-weight:600;margin-bottom:8px">${esc(t('review.recommendation'))}</legend>
          ${['none', 'watch', 'invite'].map((k) => `<label class="radio-card"><input type="radio" name="rec" value="${k}" ${(c.recommendation || 'none') === k ? 'checked' : ''}><span>${esc(t('review.rec_' + k))}</span></label>`).join('')}
        </fieldset>
        <div class="notice info">${icon.shield}<div>${esc(t('review.note'))}</div></div>
        <button class="btn btn-primary btn-block" type="submit">${esc(t('review.save'))}</button>
      </form>
    </div>
  </section>`;

  let url, raf = 0;
  return {
    html,
    title: t('review.eyebrow'),
    async mount(root) {
      const out = root.querySelector('[data-score-out]');
      root.querySelector('#score').addEventListener('input', (e) => (out.textContent = e.target.value));
      root.querySelector('[data-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const reps = root.querySelector('#reps')?.value;
        updateResult(r.id, {
          coach: {
            status: 'reviewed',
            at: new Date().toISOString(),
            by: user.profile.name,
            score: +root.querySelector('#score').value,
            repsConfirmed: reps === '' || reps == null ? null : +reps,
            extra: root.querySelector('#extra')?.value.replace(',', '.') || null,
            comment: root.querySelector('#cmt').value.trim(),
            recommendation: root.querySelector('input[name=rec]:checked').value,
          },
        });
        toast(t('review.saved'));
        go('/coach');
      });

      const video = root.querySelector('[data-video]');
      const ctx = root.querySelector('[data-overlay]').getContext('2d');
      const blob = await getVideo(r.id);
      const frames = await getVideo(r.id + ':frames');
      if (!blob) return;
      url = URL.createObjectURL(blob);
      video.src = url;
      const tick = () => { drawFrame(ctx, frameAt(frames, video.currentTime), video); if (!video.paused) raf = requestAnimationFrame(tick); };
      video.addEventListener('play', tick);
      video.addEventListener('seeked', tick);
      video.addEventListener('loadeddata', tick);
    },
    unmount() { cancelAnimationFrame(raf); if (url) URL.revokeObjectURL(url); },
  };
}
