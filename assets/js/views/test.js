import { t, tr } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { testById } from '../data.js';
import { mountExerciseLoop } from '../motion.js';
import { setPendingFile } from './record.js';

export default function testView({ params, user, go }) {
  const x = testById(params.id);
  if (!x) return { redirect: '/scout' };
  if (!user) return { redirect: '/login?next=/scout/test/' + x.id };

  const html = `
  <section class="container section-tight">
    <a class="btn btn-quiet" href="#/scout">${icon.back}${esc(t('common.back'))}</a>
    <div class="stepper mt-4" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i></div>
    <p class="eyebrow mt-6">${esc(t('test.step1'))}</p>
    <h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(tr(x.name))}</h1>
    <p class="muted mt-3">${esc(tr(x.short))}${x.note ? ' · ' + esc(tr(x.note)) : ''}</p>
    ${x.coachOnly ? `<div class="notice error mt-6">${icon.alert}<div>${esc(t('test.coach_only'))}</div></div>` : ''}

    <div class="howto mt-8">
      <div>
        <div class="demo-loop" id="loop"></div>
        <div class="row between mt-3">
          <span class="badge">${esc(t('test.sample'))}</span>
          <button class="btn btn-quiet btn-sm" type="button" data-toggle>${icon.pause}<span>${esc(t('test.pause'))}</span></button>
        </div>
      </div>
      <div>
        <h2 class="eyebrow mb-4">${esc(t('test.how'))}</h2>
        <ol class="rules">${tr(x.rules).map((r) => `<li><span>${esc(r)}</span></li>`).join('')}</ol>
        <div class="grid-3 mt-8" style="grid-template-columns:repeat(3,1fr)">
          <div class="panel-flat" style="padding:var(--s-4)"><span class="eyebrow">${esc(t('test.time'))}</span><b class="display num" style="display:block;font-size:1.8rem;margin-top:4px">${x.seconds}<small class="muted" style="font-size:.9rem"> ${esc(t('unit.sec'))}</small></b></div>
          <div class="panel-flat" style="padding:var(--s-4)"><span class="eyebrow">${esc(t('test.space'))}</span><b class="display num" style="display:block;font-size:1.8rem;margin-top:4px">${x.space || 2}<small class="muted" style="font-size:.9rem"> ${esc(t('unit.m'))}</small></b></div>
          <div class="panel-flat" style="padding:var(--s-4)"><span class="eyebrow">${esc(t('test.view'))}</span><b class="display" style="display:block;font-size:1.3rem;margin-top:8px">${esc(t('test.side'))}</b></div>
        </div>
        <div class="stack mt-8">
          <a class="btn btn-primary btn-block" href="#/scout/record/${x.id}">${icon.camera}${esc(t('test.record'))}</a>
          <label class="btn btn-ghost btn-block" style="cursor:pointer">${icon.upload}${esc(t('test.from_gallery'))}
            <input type="file" accept="video/*" class="sr-only" data-file>
          </label>
          <p class="muted center" style="font-size:var(--fs-micro)">${esc(t('test.file_limits'))}</p>
        </div>
      </div>
    </div>
  </section>`;

  let loop;
  return {
    html,
    title: tr(x.name),
    mount(root) {
      loop = mountExerciseLoop(root.querySelector('#loop'), x.id);
      const btn = root.querySelector('[data-toggle]');
      const sync = () => { btn.innerHTML = (loop.playing ? icon.pause : icon.play) + `<span>${esc(t(loop.playing ? 'test.pause' : 'test.play'))}</span>`; };
      sync();
      btn.addEventListener('click', () => { loop.playing ? loop.pause() : loop.play(); sync(); });
      root.querySelector('[data-file]').addEventListener('change', (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith('video/')) { toast(t('test.err_type'), 'error'); return; }
        if (f.size > 80 * 1024 * 1024) { toast(t('test.err_size'), 'error'); return; }
        setPendingFile(f);
        go('/scout/record/' + x.id + '?src=file');
      });
    },
    unmount() { loop?.stop(); },
  };
}
