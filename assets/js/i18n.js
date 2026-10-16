import ru from './locales/ru.js';
import tk from './locales/tk.js';
import en from './locales/en.js';
import { load, save } from './store.js';

const DICTS = { tk, ru, en };
export const LANGS = [
  { code: 'tk', label: 'TK', locale: 'tk-TM' },
  { code: 'ru', label: 'RU', locale: 'ru-RU' },
  { code: 'en', label: 'EN', locale: 'en-GB' },
];

function detect() {
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('en')) return 'en';
  return 'tk';
}

let current = load('lang', null) || detect();
if (!DICTS[current]) current = 'ru';

const subs = new Set();
export function onLang(fn) { subs.add(fn); return () => subs.delete(fn); }
export function getLang() { return current; }
export function setLang(code) {
  if (!DICTS[code] || code === current) return;
  current = code;
  save('lang', code);
  document.documentElement.lang = code;
  subs.forEach((fn) => fn(code));
}
export function locale() { return LANGS.find((l) => l.code === current).locale; }

function lookup(dict, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
}

// t('scout.title', { n: 3 }) — текст из словаря текущего языка.
// Нет перевода → русский → сам ключ (так пропуски сразу видны).
export function t(key, vars) {
  let s = lookup(DICTS[current], key);
  if (s === undefined) s = lookup(DICTS.ru, key);
  if (s === undefined) return key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return s;
}

// Значение, переведённое в самих данных: { tk, ru, en } или строка
export function tr(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[current] ?? v.ru ?? Object.values(v)[0];
}

export function fmtNum(n, digits = 0) {
  try { return new Intl.NumberFormat(locale(), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n); }
  catch { return Number(n).toFixed(digits); }
}
export function fmtMoney(n) { return `${fmtNum(n)} TMT`; }
// Браузеры не знают туркменских месяцев — форматируем сами
const TK_MONTHS = ['ýanwar', 'fewral', 'mart', 'aprel', 'maý', 'iýun', 'iýul', 'awgust', 'sentýabr', 'oktýabr', 'noýabr', 'dekabr'];
function fmtTk(date, opts) {
  const parts = [];
  if (opts.day) parts.push(String(date.getDate()));
  if (opts.month) parts.push(opts.month === 'short' ? TK_MONTHS[date.getMonth()].slice(0, 3) : TK_MONTHS[date.getMonth()]);
  if (opts.year) parts.push(String(date.getFullYear()));
  let s = parts.join(' ');
  if (opts.hour) s += (s ? ', ' : '') + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  return s;
}

// Названия месяцев для списков выбора (именительный падеж)
export function monthNames() {
  if (current === 'tk') return ['Ýanwar', 'Fewral', 'Mart', 'Aprel', 'Maý', 'Iýun', 'Iýul', 'Awgust', 'Sentýabr', 'Oktýabr', 'Noýabr', 'Dekabr'];
  if (current === 'ru') return ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}

export function fmtDate(d, opts = { day: 'numeric', month: 'long' }) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  if (current === 'tk') return fmtTk(date, opts);
  try { return new Intl.DateTimeFormat(locale(), opts).format(date); }
  catch { return date.toLocaleDateString(); }
}

document.documentElement.lang = current;
