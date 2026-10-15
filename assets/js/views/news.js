import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge, photoSlot } from '../ui.js';
import { NEWS } from '../data.js';
import { newsArt } from '../art.js';

export default function news({ params }) {
  const n = NEWS.find((x) => x.id === params.id);
  if (!n) return { redirect: '/media?tab=news' };
  return {
    title: tr(n.title),
    theme: 'light',
    html: `
    <article class="container section narrow">
      <a class="btn btn-quiet" href="#/media?tab=news">${icon.back}${esc(t('common.back'))}</a>
      <div class="row row-wrap mt-6"><span class="eyebrow">${esc(tr(n.tag))} · ${esc(fmtDate(n.date, { day: 'numeric', month: 'long', year: 'numeric' }))}</span>${n.demo ? demoBadge() : `<span class="badge badge-gold">${esc(t('news.real'))}</span>`}</div>
      <h1 class="display mt-3" style="font-size:var(--fs-h1);text-transform:none;line-height:1.05">${esc(tr(n.title))}</h1>
      <div class="mt-8" style="aspect-ratio:16/9;border-radius:var(--r-lg);overflow:hidden;position:relative">${photoSlot('news-' + n.id, `<div style="width:40%;color:var(--c-gray)">${newsArt[n.art]}</div>`, 'fill', false)}</div>
      ${n.credit ? `<p class="muted mt-2" style="font-size:var(--fs-micro)">${esc(t('home.photo'))}: ${esc(n.credit)}</p>` : ''}
      <p class="mt-8" style="font-size:1.15rem;line-height:1.6">${esc(tr(n.body))}</p>
      ${n.demo ? `<p class="muted mt-6">${esc(t('news.demo_note'))}</p>` : ''}
      ${n.source ? `<p class="mt-6"><a href="${esc(n.source)}" target="_blank" rel="noopener">${esc(t('news.source'))}: United World Wrestling ↗</a></p>` : ''}
    </article>`,
  };
}
