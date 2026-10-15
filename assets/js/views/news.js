import { t, tr, fmtDate } from '../i18n.js';
import { esc, icon, demoBadge } from '../ui.js';
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
      <div class="row row-wrap mt-6"><span class="eyebrow">${esc(tr(n.tag))} · ${esc(fmtDate(n.date, { day: 'numeric', month: 'long', year: 'numeric' }))}</span>${demoBadge()}</div>
      <h1 class="display mt-3" style="font-size:var(--fs-h1);text-transform:none;line-height:1.05">${esc(tr(n.title))}</h1>
      <div class="panel-flat mt-8" style="aspect-ratio:16/9;display:grid;place-items:center;color:var(--text)"><div style="width:40%">${newsArt[n.art]}</div></div>
      <p class="mt-8" style="font-size:1.15rem;line-height:1.6">${esc(tr(n.body))}</p>
      <p class="muted mt-6">${esc(t('news.demo_note'))}</p>
    </article>`,
  };
}
