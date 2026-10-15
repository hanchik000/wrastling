import { t } from '../i18n.js';
import { esc, icon } from '../ui.js';

export default function about() {
  const items = ['works', 'demo', 'next'];
  return {
    title: t('about.title'),
    html: `
    <section class="container section narrow">
      <p class="eyebrow">${esc(t('common.demo_version'))}</p>
      <h1 class="display mt-2" style="font-size:var(--fs-h1)">${esc(t('about.title'))}</h1>
      <p class="muted mt-4">${esc(t('about.lead'))}</p>
      ${items.map((k) => `
        <h2 class="mt-10" style="font-size:1.2rem">${esc(t(`about.${k}_t`))}</h2>
        <ul class="stack mt-4" style="list-style:none">${t(`about.${k}_list`).map((li) => `<li class="row" style="align-items:flex-start">${k === 'works' ? icon.check.replace('<svg', '<svg width="18" height="18" style="color:var(--c-signal);flex:none;margin-top:3px"') : k === 'demo' ? icon.info.replace('<svg', '<svg width="18" height="18" style="color:var(--c-gold);flex:none;margin-top:3px"') : icon.arrow.replace('<svg', '<svg width="18" height="18" style="color:var(--text-2);flex:none;margin-top:3px"')}<span>${esc(li)}</span></li>`).join('')}</ul>`).join('')}
    </section>`,
  };
}
