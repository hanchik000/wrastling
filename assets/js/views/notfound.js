import { t } from '../i18n.js';
import { esc } from '../ui.js';

export default function notFound() {
  return {
    title: '404',
    html: `<section class="container section"><div class="empty">
      <span class="display" style="font-size:5rem;color:var(--c-gold)">404</span>
      <h3>${esc(t('common.not_found'))}</h3>
      <a class="btn btn-primary mt-4" href="#/">${esc(t('nav.home'))}</a>
    </div></section>`,
  };
}
