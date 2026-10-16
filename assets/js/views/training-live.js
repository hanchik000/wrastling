// Тренировка с камерой: модель видит суставы в реальном времени, считает повторы и время,
// подсказывает при неполном движении. Видео не записывается — обрабатываются только точки суставов.
import { t, fmtNum } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { addTraining, uid } from '../store.js';
import { loadLandmarker, drawFrame, KEEP, nextTs } from '../pose.js';
import { LIVE_EX, liveEx, createCounter, setResult, inFrame, synthFrame } from '../live.js';
import { TYPES, typeIcon, iso } from '../training-lib.js';
import { testArt } from '../art.js';

const MOODS = ['😣', '😕', '😐', '🙂', '😄'];
const S = (b) => `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${b}</svg>`;
const ART = {
  squat: S('<circle cx="64" cy="26" r="7"/><path d="M60 33 50 62l24 4 -4 30M50 62l-14 4M58 42l26 6" /><path d="M10 98h100" stroke="#27b663"/><path d="M92 40v34m-5-5 5 5 5-5" stroke="#27b663"/>'),
  pushup: S('<circle cx="96" cy="58" r="7"/><path d="M88 62 22 78M80 64l2 24M22 78l-8 4" /><path d="M10 92h100" stroke="#27b663"/><path d="M60 30v22m-5-5 5 5 5-5" stroke="#27b663"/>'),
  pullup: testArt.pullup, sprawl: testArt.sprawl, shot: testArt.shot, bridge: testArt.bridge_up,
};
// Суставы, которые важны для упражнения, — подсвечиваются зелёным
const HOT = { squat: [7, 8, 9, 10], pushup: [1, 2, 3, 4], pullup: [3, 4, 0], sprawl: [1, 2, 7, 8], shot: [7, 8, 11, 12], bridge: [1, 2, 7, 8] };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function trainingLive({ query, user, go }) {
  if (!user?.profile) return { redirect: '/login?next=/training/live' };

  let root, exId = LIVE_EX.some((x) => x.id === query.ex) ? query.ex : 'squat';
  let mode = 'camera', facing = 'user', stream = null, lm = null, raf = 0, tick = 0, wake = null, actx = null, sound = true;
  let session = 0, counter = null, setStart = 0, t0 = 0, restFrom = null, sets = [], lastCue = 0, cancelled = false, lastFrame = 0, lost = 0;

  // ---------- 1. Выбор упражнения ----------
  function setupHtml() {
    return `
    <section class="container section-tight narrow" style="padding-bottom:var(--s-16)">
      <a class="btn btn-quiet" href="#/training">${icon.back}${esc(t('train.title'))}</a>
      <p class="eyebrow mt-6">${esc(t('cam.eyebrow'))}</p>
      <h1 class="display mt-2" style="font-size:var(--fs-h2)" data-split>${esc(t('cam.title'))}</h1>
      <p class="muted mt-3 max-prose">${esc(t('cam.lead'))}</p>
      <h2 class="eyebrow mt-8 mb-3">${esc(t('cam.choose'))}</h2>
      <div class="lex" role="radiogroup" data-stagger>${LIVE_EX.map((x) => `
        <button type="button" role="radio" data-ex="${x.id}" aria-checked="${x.id === exId}">
          <span class="art">${ART[x.id]}</span><b>${esc(t('cam.ex_' + x.id))}</b><small>${esc(t(x.kind === 'hold' ? 'cam.d_hold' : 'cam.d_reps'))}</small>
        </button>`).join('')}</div>
      <h2 class="eyebrow mt-8 mb-3">${esc(t('cam.how'))}</h2>
      <ol class="rules">${['tip1', 'tip2', 'tip3'].map((k) => `<li><span>${esc(t('cam.' + k))}</span></li>`).join('')}</ol>
      <div class="stack mt-8">
        <button class="btn btn-gold btn-block" data-go>${icon.live}${esc(t('cam.start'))}</button>
        <button class="btn btn-ghost btn-block" data-demo>${icon.play}${esc(t('cam.demo'))}</button>
      </div>
    </section>`;
  }

  function showSetup() {
    stop();
    root.querySelector('#live-host').innerHTML = setupHtml();
    root.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => {
      exId = b.dataset.ex;
      root.querySelectorAll('[data-ex]').forEach((z) => z.setAttribute('aria-checked', z === b));
    }));
    root.querySelector('[data-go]').addEventListener('click', () => { unlockAudio(); start('camera'); });
    root.querySelector('[data-demo]').addEventListener('click', () => { unlockAudio(); start('demo'); });
    window.scrollTo(0, 0);
    import('../fx.js').then(({ initFx }) => initFx(root));
  }

  // ---------- 2. Живой экран ----------
  function liveHtml() {
    return `
    <div class="recorder live ${mode === 'demo' ? 'is-demo' : ''}" role="dialog" aria-label="${esc(t('cam.title'))}">
      <div class="top">
        <button class="icon-btn" data-close aria-label="${esc(t('common.close'))}" style="border-color:rgba(255,255,255,.25)">${icon.x}</button>
        <span class="live-pill" data-status><i></i><span>${esc(t(mode === 'demo' ? 'cam.tracking' : 'cam.loading'))}</span></span>
        <span class="timer" data-clock>00:00</span>
      </div>
      <div class="cam">
        ${mode === 'camera' ? '<video data-video playsinline muted autoplay></video>' : '<div class="live-mat" aria-hidden="true"></div>'}
        <canvas data-canvas></canvas>
        ${mode === 'demo' ? `<span class="badge badge-demo live-demo">${esc(t('cam.demo_badge'))}</span>` : ''}
        <div class="live-count" aria-live="polite"><b class="num" data-reps>0</b><span data-unit>${esc(t(liveEx(exId).kind === 'hold' ? 'cam.hold' : 'cam.reps'))}</span></div>
        <div class="live-meter" aria-hidden="true"><i data-meter></i></div>
        <div class="live-cue" data-cue hidden></div>
        <div class="live-load" data-load ${mode === 'demo' ? 'hidden' : ''}><span class="spin"></span><b>${esc(t('cam.loading'))}</b><small>${esc(t('cam.loading_hint'))}</small></div>
      </div>
      <div class="bottom">
        <div class="live-ex" role="tablist">${LIVE_EX.map((x) => `<button role="tab" data-switch="${x.id}" aria-selected="${x.id === exId}">${esc(t('cam.ex_' + x.id))}</button>`).join('')}</div>
        <div class="live-sets" data-sets>${esc(t('cam.sets_none'))}</div>
        <div class="controls">
          <button class="icon-btn" data-flip aria-label="${esc(t('rec.flip'))}" style="border-color:rgba(255,255,255,.25)" ${mode === 'demo' ? 'disabled' : ''}>${icon.replay}</button>
          <button class="btn btn-gold live-set" data-set>${icon.check}${esc(t('cam.set_done'))}</button>
          <button class="icon-btn" data-sound aria-label="${esc(t('cam.sound_on'))}" aria-pressed="true" style="border-color:rgba(255,255,255,.25);justify-self:end">${icon.sound}</button>
        </div>
        <button class="btn btn-ghost btn-block live-finish" data-finish>${esc(t('cam.finish'))}</button>
      </div>
    </div>`;
  }

  async function start(m) {
    stop();
    const my = session;
    mode = m; sets = []; restFrom = null;
    root.querySelector('#live-host').innerHTML = liveHtml();
    bindLive();
    newSet();
    t0 = performance.now();
    tick = setInterval(clockTick, 250);
    navigator.wakeLock?.request('screen').then((w) => { wake = w; }).catch(() => {});
    if (mode === 'demo') { loop(); return; }
    await openCamera();
    if (cancelled || my !== session || !stream) return;
    try {
      lm = await loadLandmarker();
    } catch (e) {
      console.error(e);
      return my === session && showError('model');
    }
    if (cancelled || my !== session) return;
    root.querySelector('[data-load]').hidden = true;
    t0 = performance.now(); setStart = 0;
    loop();
  }

  async function openCamera() {
    stopStream();
    if (!navigator.mediaDevices?.getUserMedia) return showError('cam');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    } catch (e) {
      console.error(e);
      return showError('cam');
    }
    if (cancelled) return stopStream();
    const v = root.querySelector('[data-video]');
    v.srcObject = stream;
    const mirror = facing === 'user' ? 'scaleX(-1)' : '';
    v.style.transform = mirror;
    root.querySelector('[data-canvas]').style.transform = mirror;
    await v.play().catch(() => {});
  }

  function bindLive() {
    root.querySelector('[data-close]').addEventListener('click', () => (sets.length || counterHas() ? finish() : showSetup()));
    root.querySelector('[data-finish]').addEventListener('click', finish);
    root.querySelector('[data-set]').addEventListener('click', () => { if (closeSet()) { restFrom = performance.now(); newSet(); } else toast(t('cam.sets_none')); });
    root.querySelector('[data-flip]').addEventListener('click', async () => { facing = facing === 'user' ? 'environment' : 'user'; await openCamera(); });
    root.querySelector('[data-sound]').addEventListener('click', (e) => {
      sound = !sound;
      const b = e.currentTarget;
      b.innerHTML = sound ? icon.sound : icon.mute;
      b.setAttribute('aria-pressed', sound);
      b.setAttribute('aria-label', t(sound ? 'cam.sound_on' : 'cam.sound_off'));
    });
    root.querySelectorAll('[data-switch]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.switch === exId) return;
      if (closeSet()) restFrom = performance.now();
      exId = b.dataset.switch;
      root.querySelectorAll('[data-switch]').forEach((z) => z.setAttribute('aria-selected', z === b));
      root.querySelector('[data-unit]').textContent = t(liveEx(exId).kind === 'hold' ? 'cam.hold' : 'cam.reps');
      newSet();
      b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }));
  }

  const now = () => (performance.now() - t0) / 1000;
  const counterHas = () => counter && (counter.state.reps > 0 || counter.state.best >= 1);

  function newSet() {
    counter = createCounter(exId);
    setStart = now();
    const r = root.querySelector('[data-reps]');
    if (r) r.textContent = liveEx(exId).kind === 'hold' ? '0.0' : '0';
  }

  // Подход сохраняется, только если в нём что-то было
  function closeSet() {
    if (!counterHas()) return false;
    const end = counter.state.lastRepT != null && liveEx(exId).kind === 'reps' ? Math.max(counter.state.lastRepT, setStart + 1) : now();
    sets.push(setResult(exId, counter.state, end - setStart));
    renderSets();
    navigator.vibrate?.([30, 60, 30]);
    return true;
  }

  function renderSets() {
    const el = root.querySelector('[data-sets]');
    if (!el) return;
    el.innerHTML = sets.length
      ? sets.slice(-4).map((s, i) => `<span><small>${esc(t('cam.set_n', { n: sets.length - Math.min(4, sets.length) + i + 1 }))}</small> ${esc(t('cam.ex_' + s.ex))} <b class="num">${s.hold != null ? fmtNum(s.hold, 1) + ' ' + t('unit.sec') : s.reps}</b></span>`).join('')
      : esc(t('cam.sets_none'));
  }

  function clockTick() {
    const c = root.querySelector('[data-clock]');
    if (c) c.textContent = mmss(now());
  }

  // ---------- Цикл: кадр → суставы → счётчик → отрисовка ----------
  function loop() {
    if (cancelled) return;
    raf = requestAnimationFrame(loop);
    const ms = performance.now();
    if (ms - lastFrame < 60) return; // ~16 кадров в секунду хватает и бережёт батарею
    lastFrame = ms;
    let frame, src;
    if (mode === 'demo') {
      // После «Подход готов» демо-спортсмен 3 секунды отдыхает
      if (restFrom != null && ms - restFrom < 3000) setStart = now();
      frame = synthFrame(exId, now() - setStart);
      frame.t = now();
      src = { videoWidth: 600, videoHeight: 800 };
    } else {
      const v = root.querySelector('[data-video]');
      if (!v || v.readyState < 2 || !lm) return;
      let res = null;
      try { res = lm.detectForVideo(v, nextTs()); } catch (e) { console.warn(e); }
      const p = res?.landmarks?.[0];
      frame = { t: now(), p: p ? KEEP.map((k) => [p[k].x, p[k].y, p[k].visibility ?? 0]) : null };
      src = v;
    }
    const ok = inFrame(frame.p);
    lost = ok ? 0 : lost + 1;
    const st = counter.push(ok ? frame : { t: frame.t, p: null });
    const cv = root.querySelector('[data-canvas]');
    const demo = mode === 'demo';
    const prop = !demo ? null : exId === 'pullup' ? { y: 0.115, x0: 0.2, x1: 0.8, w: 5 } : { y: 0.9, x0: 0, x1: 1 };
    if (cv) drawFrame(cv.getContext('2d'), ok ? frame : null, src, { fit: demo ? 'contain' : 'cover', hot: HOT[exId], body: demo, prop });
    updateHud(st, ok);
  }

  function updateHud(st, ok) {
    const ex = liveEx(exId);
    const reps = root.querySelector('[data-reps]');
    if (!reps) return;
    if (ex.kind === 'hold') reps.textContent = fmtNum(st.best, 1);
    else if (+reps.textContent !== st.reps) {
      reps.textContent = st.reps;
      reps.classList.remove('pop'); void reps.offsetWidth; reps.classList.add('pop');
    }
    root.querySelector('[data-meter]').style.transform = `scaleY(${ok ? Math.max(0.04, st.phase) : 0})`;
    if (st.event === 'rep' || (ex.kind === 'hold' && st.hold > 0)) restFrom = null;
    if (st.event === 'rep') { beep(880, 0.07); navigator.vibrate?.(35); }
    if (st.cue && performance.now() - lastCue > 2500) {
      lastCue = performance.now();
      const c = root.querySelector('[data-cue]');
      c.textContent = t('cam.cue_' + st.cue);
      c.hidden = false; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
      beep(330, 0.12);
      clearTimeout(c._h); c._h = setTimeout(() => { c.hidden = true; }, 2200);
    }
    const pill = root.querySelector('[data-status]');
    const state = !ok && lost > 8 ? 'lost' : restFrom != null ? 'rest' : 'ok';
    pill.className = 'live-pill ' + state;
    pill.querySelector('span').textContent = state === 'lost' ? t('cam.no_person') : state === 'rest' ? t('cam.rest', { t: mmss((performance.now() - restFrom) / 1000) }) : t('cam.tracking');
  }

  function unlockAudio() {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume?.(); } catch { actx = null; }
  }
  function beep(freq, dur) {
    if (!sound || !actx) return;
    try {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur + 0.02);
    } catch {}
  }

  function showError(kind) {
    stop();
    root.querySelector('#live-host').innerHTML = `
    <section class="container section narrow">
      <button class="btn btn-quiet" data-back>${icon.back}${esc(t('common.back'))}</button>
      <div class="notice error mt-6">${icon.alert}<div><b>${esc(t('cam.err_' + kind + '_t'))}</b><br>${esc(t('cam.err_' + kind))}</div></div>
      <div class="stack mt-6">
        <button class="btn btn-primary btn-block" data-retry>${icon.live}${esc(t('cam.retry'))}</button>
        <button class="btn btn-ghost btn-block" data-demo>${icon.play}${esc(t('cam.demo'))}</button>
        <a class="btn btn-quiet btn-block" href="#/training/new">${icon.plus}${esc(t('cam.manual'))}</a>
      </div>
    </section>`;
    window.scrollTo(0, 0);
    root.querySelector('[data-back]').addEventListener('click', showSetup);
    root.querySelector('[data-retry]').addEventListener('click', () => start('camera'));
    root.querySelector('[data-demo]').addEventListener('click', () => start('demo'));
  }

  // ---------- 3. Итог и сохранение в дневник ----------
  function finish() {
    closeSet();
    const total = now();
    const usedDemo = mode === 'demo';
    stop();
    if (!sets.length) { toast(t('cam.empty_finish')); showSetup(); return; }
    const reps = sets.reduce((a, s) => a + (s.reps || 0), 0);
    const bestHold = Math.max(0, ...sets.map((s) => s.hold || 0));
    const best = {};
    for (const x of LIVE_EX) {
      if (!x.metric) continue;
      const xs = sets.filter((s) => s.ex === x.id && (x.id !== 'sprawl' || (s.sec >= 20 && s.sec <= 45)));
      if (xs.length) best[x.metric] = Math.max(...xs.map((s) => s.reps));
    }
    // Вид тренировки — по тому, чего было больше
    const byType = {};
    sets.forEach((s) => { const ty = liveEx(s.ex).type; byType[ty] = (byType[ty] || 0) + s.sec; });
    let type = Object.entries(byType).sort((a, b) => b[1] - a[1])[0][0];
    let mood = 4;

    root.querySelector('#live-host').innerHTML = `
    <section class="container section-tight narrow" style="padding-bottom:var(--s-16)">
      <p class="eyebrow">${esc(t('cam.eyebrow'))}${usedDemo ? ` <span class="badge badge-demo" style="margin-left:6px">${esc(t('common.demo'))}</span>` : ''}</p>
      <h1 class="display mt-2" style="font-size:var(--fs-h2)" data-split>${esc(t('cam.done_t'))}</h1>
      <div class="ttiles cam-tiles mt-6" data-stagger style="--n:${2 + (reps ? 1 : 0) + (bestHold ? 1 : 0)}">
        <div class="ttile"><span class="k">${esc(t('cam.k_time'))}</span><b class="num">${mmss(total)}</b></div>
        <div class="ttile"><span class="k">${esc(t('cam.k_sets'))}</span><b class="num" data-to="${sets.length}">${sets.length}</b></div>
        ${reps ? `<div class="ttile accent"><span class="k">${esc(t('cam.k_reps'))}</span><b class="num" data-to="${reps}">${reps}</b></div>` : ''}
        ${bestHold ? `<div class="ttile"><span class="k">${esc(t('cam.k_hold'))}</span><b class="num">${fmtNum(bestHold, 1)}<small> ${esc(t('unit.sec'))}</small></b></div>` : ''}
      </div>
      <div class="table-wrap mt-6"><table class="table cam-table">
        <thead><tr><th>#</th><th>${esc(t('cam.col_ex'))}</th><th class="num">${esc(t('cam.col_res'))}</th><th class="num">${esc(t('cam.col_time'))}</th><th class="num">${esc(t('cam.col_tempo'))}</th></tr></thead>
        <tbody>${sets.map((s, i) => `<tr><td class="num muted">${i + 1}</td><td>${esc(t('cam.ex_' + s.ex))}</td><td class="num"><b>${s.hold != null ? fmtNum(s.hold, 1) + ' ' + esc(t('unit.sec')) : s.reps}</b></td><td class="num">${s.sec} ${esc(t('unit.sec'))}</td><td class="num muted">${s.tempo != null ? fmtNum(s.tempo, 0) + ' ' + esc(t('cam.per_min')) : '—'}</td></tr>`).join('')}</tbody>
      </table></div>
      ${Object.keys(best).length ? `<div class="notice mt-4">${icon.chart}<div>${esc(t('cam.to_progress'))} ${Object.entries(best).map(([k, v]) => `<b>${esc(t('train.m_' + k))}: ${v}</b>`).join(', ')}</div></div>` : ''}
      <form class="stack mt-8" data-form novalidate>
        <div class="field"><span class="label">${esc(t('train.type'))}</span>
          <div class="ttypes" role="radiogroup">${TYPES.map((ty) => `<button type="button" role="radio" data-type="${ty.id}" aria-checked="${ty.id === type}">${typeIcon(ty.id)}<span>${esc(t('train.type_' + ty.id))}</span></button>`).join('')}</div>
        </div>
        <div class="field">
          <label for="rpe">${esc(t('train.rpe'))}: <b class="num" data-rpe-out>6</b>/10 · <span data-rpe-word class="muted"></span></label>
          <input id="rpe" type="range" min="1" max="10" value="6" class="range">
        </div>
        <div class="field"><span class="label">${esc(t('train.mood'))}</span>
          <div class="moods" role="radiogroup">${MOODS.map((m, i) => `<button type="button" role="radio" data-mood="${i + 1}" aria-checked="${i + 1 === mood}" aria-label="${i + 1}/5">${m}</button>`).join('')}</div>
        </div>
        <div class="field"><label for="notes">${esc(t('train.notes'))}</label><textarea id="notes" class="input" placeholder="${esc(t('train.notes_ph'))}"></textarea></div>
        <button class="btn btn-gold btn-block" type="submit">${esc(t('cam.save'))}</button>
        <button class="btn btn-quiet btn-block" type="button" data-discard>${esc(t('cam.discard'))}</button>
      </form>
    </section>`;
    const host = root.querySelector('#live-host');
    host.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => { type = b.dataset.type; host.querySelectorAll('[data-type]').forEach((z) => z.setAttribute('aria-checked', z === b)); }));
    host.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => { mood = +b.dataset.mood; host.querySelectorAll('[data-mood]').forEach((z) => z.setAttribute('aria-checked', z === b)); }));
    const rpe = host.querySelector('#rpe');
    const syncRpe = () => {
      host.querySelector('[data-rpe-out]').textContent = rpe.value;
      host.querySelector('[data-rpe-word]').textContent = t('train.rpe_' + (rpe.value <= 3 ? 'easy' : rpe.value <= 6 ? 'mid' : rpe.value <= 8 ? 'hard' : 'max'));
    };
    rpe.addEventListener('input', syncRpe); syncRpe();
    host.querySelector('[data-discard]').addEventListener('click', () => go('/training'));
    host.querySelector('[data-form]').addEventListener('submit', (e) => {
      e.preventDefault();
      addTraining({
        id: uid('t'), date: iso(new Date()), type, minutes: Math.max(1, Math.round(total / 60)), rpe: +rpe.value, mood,
        notes: host.querySelector('#notes').value.trim(), camera: true, sets, ...best, ...(usedDemo ? { demo: true } : {}),
      });
      toast(t('cam.saved'));
      go('/training');
    });
    window.scrollTo(0, 0);
    import('../fx.js').then(({ initFx }) => initFx(host));
  }

  function stopStream() { stream?.getTracks().forEach((x) => x.stop()); stream = null; }
  function stop() {
    session++;
    cancelAnimationFrame(raf); clearInterval(tick);
    stopStream();
    try { wake?.release(); } catch {}
    wake = null;
  }

  return {
    html: '<div id="live-host"></div>',
    title: t('cam.title'),
    focus: false,
    mount(r) { root = r; showSetup(); },
    unmount() { cancelled = true; stop(); try { actx?.close(); } catch {} },
  };
}
