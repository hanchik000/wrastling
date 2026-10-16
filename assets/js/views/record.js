// Запись теста → просмотр → анализ на устройстве → сохранение.
import { t, tr, fmtNum } from '../i18n.js';
import { esc, icon, toast } from '../ui.js';
import { testById } from '../data.js';
import { analyzeVideo, brightnessOf } from '../pose.js';
import { addResult, putVideo, uid, ageOf } from '../store.js';

let pendingFile = null;
export function setPendingFile(f) { pendingFile = f; }

const MIMES = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
const pickMime = () => (window.MediaRecorder ? MIMES.find((m) => MediaRecorder.isTypeSupported?.(m)) || '' : '');

export default function record({ params, query, user, go }) {
  const x = testById(params.id);
  if (!x) return { redirect: '/scout' };
  if (!user) return { redirect: '/login?next=/scout/test/' + x.id };

  let root, stream = null, rec = null, chunks = [], timerId = 0, lightId = 0, facing = 'environment';
  let blob = null, previewUrl = null, cancelled = false;

  const html = `<div id="rec-host"></div>`;

  // ---------- Камера ----------
  function cameraHtml() {
    return `
    <div class="recorder" role="dialog" aria-label="${esc(t('rec.aria'))}">
      <div class="top">
        <button class="icon-btn" data-close aria-label="${esc(t('common.close'))}" style="border-color:rgba(255,255,255,.25)">${icon.x}</button>
        <b style="font-size:.95rem">${esc(tr(x.name))}</b>
        <span class="timer" data-timer>00:${String(x.seconds).padStart(2, '0')}</span>
      </div>
      <div class="cam">
        <video data-preview playsinline muted autoplay></video>
        <div class="frame-guide" aria-hidden="true">
          <svg viewBox="0 0 100 160" preserveAspectRatio="xMidYMid meet" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".5">
            <path d="M14 14h10M14 14v10M86 14H76M86 14v10M14 146h10M14 146v-10M86 146H76M86 146v-10" stroke="#27b663" stroke-width=".9"/>
            <g stroke-dasharray="1.5 2" opacity=".6"><circle cx="50" cy="38" r="6"/><path d="M50 44v34M38 54h24M50 78l-8 40M50 78l8 40"/></g>
          </svg>
        </div>
        <div class="countdown" data-count hidden></div>
      </div>
      <div class="bottom">
        <div class="tips">
          <span class="tip" data-light>${icon.sun.replace('<svg', '<svg width="14" height="14"')}<span>${esc(t('rec.checking_light'))}</span></span>
          <span class="tip">${icon.body.replace('<svg', '<svg width="14" height="14"')}<span>${esc(t('rec.whole_body'))}</span></span>
        </div>
        <div class="controls">
          <button class="icon-btn" data-flip aria-label="${esc(t('rec.flip'))}" style="border-color:rgba(255,255,255,.25)">${icon.replay}</button>
          <button class="rec-btn" data-rec aria-label="${esc(t('rec.start'))}"><i></i></button>
          <span></span>
        </div>
        <p class="center" style="font-size:.78rem;color:#aaa" data-hint>${esc(t('rec.hint', { n: x.seconds }))}</p>
      </div>
    </div>`;
  }

  function errorHtml(kind) {
    return `
    <section class="container section narrow">
      <a class="btn btn-quiet" href="#/scout/test/${x.id}">${icon.back}${esc(t('common.back'))}</a>
      <div class="notice error mt-6">${icon.alert}<div><b>${esc(t('rec.err_' + kind + '_t'))}</b><br>${esc(t('rec.err_' + kind))}</div></div>
      <div class="stack mt-6">
        <button class="btn btn-primary btn-block" data-retry>${icon.camera}${esc(t('rec.retry'))}</button>
        <label class="btn btn-ghost btn-block" style="cursor:pointer">${icon.upload}${esc(t('test.from_gallery'))}<input type="file" accept="video/*" capture="environment" class="sr-only" data-file></label>
      </div>
    </section>`;
  }

  async function startCamera() {
    stopStream();
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return showError('support');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });
    } catch (e) {
      return showError(e?.name === 'NotAllowedError' ? 'denied' : 'camera');
    }
    if (cancelled) return stopStream();
    root.querySelector('#rec-host').innerHTML = cameraHtml();
    const v = root.querySelector('[data-preview]');
    v.srcObject = stream;
    v.style.transform = facing === 'user' ? 'scaleX(-1)' : '';
    root.querySelector('[data-close]').addEventListener('click', () => go('/scout/test/' + x.id));
    root.querySelector('[data-flip]').addEventListener('click', () => { facing = facing === 'user' ? 'environment' : 'user'; startCamera(); });
    root.querySelector('[data-rec]').addEventListener('click', toggleRec);
    // проверка освещения
    clearInterval(lightId);
    lightId = setInterval(() => {
      const b = brightnessOf(v);
      const tip = root.querySelector('[data-light]');
      if (!tip || b == null) return;
      const ok = b > 55 && b < 225;
      tip.className = 'tip ' + (ok ? 'ok' : 'bad');
      tip.querySelector('span').textContent = t(ok ? 'rec.light_ok' : b <= 55 ? 'rec.light_dark' : 'rec.light_bright');
    }, 700);
  }

  function showError(kind) {
    stopStream();
    root.querySelector('#rec-host').innerHTML = errorHtml(kind);
    root.querySelector('[data-retry]').addEventListener('click', startCamera);
    root.querySelector('[data-file]').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) review(f); });
  }

  function stopStream() {
    clearInterval(lightId);
    stream?.getTracks().forEach((tr) => tr.stop());
    stream = null;
  }

  async function toggleRec() {
    const btn = root.querySelector('[data-rec]');
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    btn.disabled = true;
    root.querySelector('[data-flip]').disabled = true;
    const cd = root.querySelector('[data-count]');
    cd.hidden = false;
    for (const n of [3, 2, 1]) {
      if (cancelled) return;
      cd.textContent = n;
      navigator.vibrate?.(30);
      await new Promise((r) => setTimeout(r, 1000));
    }
    cd.hidden = true;
    const mime = pickMime();
    chunks = [];
    try {
      rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 2_500_000 });
    } catch {
      rec = new MediaRecorder(stream);
    }
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    rec.onstop = () => {
      clearInterval(timerId);
      const type = rec.mimeType || mime || 'video/webm';
      const b = new Blob(chunks, { type });
      stopStream();
      if (!cancelled) review(b);
    };
    rec.start(1000);
    btn.disabled = false;
    btn.classList.add('on');
    btn.setAttribute('aria-label', t('rec.stop'));
    root.querySelector('[data-hint]').textContent = t('rec.recording');
    const t0 = Date.now();
    const timer = root.querySelector('[data-timer]');
    timerId = setInterval(() => {
      const left = Math.max(0, x.seconds - Math.floor((Date.now() - t0) / 1000));
      timer.textContent = '00:' + String(left).padStart(2, '0');
      if (left === 0 && rec.state === 'recording') rec.stop();
    }, 250);
  }

  // ---------- Просмотр записи ----------
  function review(b) {
    blob = b;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(b);
    const mb = b.size / 1024 / 1024;
    root.querySelector('#rec-host').innerHTML = `
    <section class="container section-tight narrow">
      <div class="stepper" aria-hidden="true"><i class="on"></i><i class="on"></i><i></i><i></i></div>
      <p class="eyebrow mt-6">${esc(t('rec.step2'))}</p>
      <h1 class="display mt-2" style="font-size:var(--fs-h2)">${esc(t('rec.review_title'))}</h1>
      <div class="analysis-stage mt-6"><video src="${previewUrl}" controls playsinline data-review></video></div>
      <div class="row row-wrap mt-4" style="font-size:var(--fs-small)">
        <span class="badge" data-dur>— ${esc(t('unit.sec'))}</span>
        <span class="badge num">${fmtNum(mb, 1)} MB</span>
        ${mb > 60 ? `<span class="badge" style="color:var(--c-live)">${esc(t('rec.too_big'))}</span>` : ''}
      </div>
      <div class="notice info mt-6">${icon.info}<div>${esc(t('rec.device_only'))}</div></div>
      <div class="stack mt-6">
        <button class="btn btn-primary btn-block" data-send ${mb > 80 ? 'disabled' : ''}>${esc(t('rec.analyze'))} ${icon.arrow}</button>
        <button class="btn btn-ghost btn-block" data-again>${icon.replay}${esc(t('rec.again'))}</button>
      </div>
    </section>`;
    const v = root.querySelector('[data-review]');
    // У webm из MediaRecorder длительность бывает Infinity — уточняем перемоткой в конец
    const showDur = () => {
      if (Number.isFinite(v.duration)) root.querySelector('[data-dur]').textContent = `${fmtNum(v.duration, 1)} ${t('unit.sec')}`;
    };
    v.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(v.duration)) return showDur();
      const fix = () => { v.removeEventListener('durationchange', fix); showDur(); v.currentTime = 0; };
      v.addEventListener('durationchange', fix);
      v.currentTime = 1e7;
    });
    root.querySelector('[data-again]').addEventListener('click', () => { pendingFile = null; startCamera(); });
    root.querySelector('[data-send]').addEventListener('click', analyze);
    window.scrollTo(0, 0);
  }

  // ---------- Анализ ----------
  async function analyze() {
    const steps = ['check', 'model', 'track', 'metrics', 'save'];
    root.querySelector('#rec-host').innerHTML = `
    <section class="container section-tight narrow">
      <div class="stepper" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div>
      <p class="eyebrow mt-6">${esc(t('rec.step3'))}</p>
      <h1 class="display mt-2" style="font-size:var(--fs-h2)">${esc(t('rec.analyzing'))}</h1>
      <div class="analysis-stage mt-6"><video src="${previewUrl}" muted loop playsinline autoplay></video><div class="scan"></div></div>
      <div class="progress mt-6"><i data-bar style="width:2%"></i></div>
      <div class="mt-6" aria-live="polite">
        ${steps.map((s) => `<div class="status-line" data-step="${s}"><span class="dot"></span><div><b>${esc(t('rec.s_' + s))}</b><span>${esc(t('rec.s_' + s + '_d'))}</span></div></div>`).join('')}
      </div>
      <p class="muted mt-6" style="font-size:var(--fs-small)">${esc(t('rec.keep_open'))}</p>
    </section>`;
    const bar = root.querySelector('[data-bar]');
    const mark = (s, state) => {
      const elx = root.querySelector(`[data-step="${s}"]`);
      if (!elx) return;
      elx.className = 'status-line ' + state;
      elx.querySelector('.dot').innerHTML = state === 'done' ? icon.check : '';
    };
    const weights = { check: 5, model: 25, track: 60, metrics: 5, save: 5 };
    let doneW = 0;
    let curStep = 'check';
    mark('check', 'now');
    const onStep = (s, k) => {
      if (s !== curStep) {
        mark(curStep, 'done');
        doneW += weights[curStep];
        curStep = s;
        mark(s, 'now');
      }
      bar.style.width = Math.min(99, doneW + weights[s] * k) + '%';
    };

    let out;
    try {
      out = await analyzeVideo(blob, x.id, onStep);
    } catch (e) {
      console.error(e);
      if (cancelled) return;
      root.querySelector('#rec-host').innerHTML = errorHtml('video');
      root.querySelector('[data-retry]').addEventListener('click', startCamera);
      root.querySelector('[data-file]').addEventListener('change', (ev) => { const f = ev.target.files?.[0]; if (f) review(f); });
      return;
    }
    if (cancelled) return;
    ['check', 'model', 'track', 'metrics'].forEach((s) => mark(s, 'done'));
    mark('save', 'now');

    const id = uid('r');
    const p = user.profile || {};
    try {
      await putVideo(id, blob);
      await putVideo(id + ':frames', out.frames);
    } catch {
      toast(t('rec.save_video_failed'), 'error');
    }
    addResult({
      id,
      testId: x.id,
      createdAt: new Date().toISOString(),
      durationSec: out.durationSec,
      sizeMB: +(blob.size / 1024 / 1024).toFixed(1),
      quality: out.quality,
      analysis: out.analysis,
      coach: { status: 'pending' },
      athlete: { name: p.name, age: ageOf(p.birthdate), ageGroup: p.ageGroup, region: p.region, style: p.style, weight: p.weight, gender: p.gender },
    });
    mark('save', 'done');
    bar.style.width = '100%';
    setTimeout(() => go('/scout/result/' + id), 400);
  }

  return {
    html,
    title: tr(x.name),
    focus: false,
    mount(r) {
      root = r;
      if (query.src === 'file' && pendingFile) { const f = pendingFile; pendingFile = null; review(f); }
      else startCamera();
    },
    unmount() {
      cancelled = true;
      clearInterval(timerId);
      try { if (rec && rec.state === 'recording') rec.stop(); } catch {}
      stopStream();
      // previewUrl не отзываем сразу: видео может ещё играть во время перехода
      setTimeout(() => previewUrl && URL.revokeObjectURL(previewUrl), 2000);
    },
  };
}
