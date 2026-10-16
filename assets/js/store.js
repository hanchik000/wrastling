// Локальное хранилище демо-версии.
// В этапе 1 эти функции заменяются вызовами API — интерфейс остаётся тем же.
const NS = 'wt.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(key) { listeners.forEach((fn) => fn(key)); }

// ---------- Пользователь ----------
export function getUser() { return load('user', null); }
export function setUser(user) { save('user', user); emit('user'); }
export function logout() { localStorage.removeItem(NS + 'user'); emit('user'); }

export function ageOf(birthdate) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

export function ageGroup(age) {
  if (age == null) return null;
  if (age <= 10) return '7-10';
  if (age <= 13) return '11-13';
  if (age <= 15) return '14-15';
  if (age <= 17) return '16-17';
  return '18-22';
}

// ---------- Результаты тестов ----------
export function getResults() { return load('results', []); }
export function getResult(id) { return getResults().find((r) => r.id === id) || null; }
export function addResult(r) {
  const list = getResults();
  list.unshift(r);
  // храним последние 20, чтобы не переполнить хранилище
  save('results', list.slice(0, 20));
  emit('results');
}
export function updateResult(id, patch) {
  const list = getResults().map((r) => (r.id === id ? { ...r, ...patch } : r));
  save('results', list);
  emit('results');
}

// ---------- Корзина, заказы, доступы ----------
export function getCart() { return load('cart', []); }
export function setCart(c) { save('cart', c); emit('cart'); }
export function cartCount() { return getCart().reduce((s, l) => s + l.qty, 0); }
export function addToCart(line) {
  const cart = getCart();
  const same = cart.find((l) => l.id === line.id && l.size === line.size && l.color === line.color);
  if (same) same.qty += line.qty; else cart.push(line);
  setCart(cart);
}
// ---------- Дневник тренировок ----------
export function getTrainings() { return load('trainings', []); }
export function saveTrainings(list) { save('trainings', list); emit('trainings'); }
export function addTraining(tr) { const l = getTrainings(); l.push(tr); l.sort((a, b) => (a.date < b.date ? 1 : -1)); saveTrainings(l); }
export function deleteTraining(id) { saveTrainings(getTrainings().filter((x) => x.id !== id)); }

export function getOrders() { return load('orders', []); }
export function addOrder(o) { const l = getOrders(); l.unshift(o); save('orders', l); emit('orders'); }

export function getFavs() { return load('favs', []); }
export function toggleFav(id) {
  const f = getFavs();
  const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.push(id);
  save('favs', f); emit('favs');
  return i < 0;
}

export function getAccess() { return load('access', []); }
export function grantAccess(eventId) { const a = getAccess(); if (!a.includes(eventId)) a.push(eventId); save('access', a); emit('access'); }

export function uid(prefix = 'id') {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Видео в IndexedDB (только на этом устройстве) ----------
const DB = 'wt-videos';
function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('no-idb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('videos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function putVideo(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('videos', 'readwrite');
    tx.objectStore('videos').put(blob, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
export async function getVideo(id) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('videos', 'readonly');
      const req = tx.objectStore('videos').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ---------- Помощник Dost: боли, вода, чат, ключ ИИ ----------
export function getPains() { return load('pains', []); }
export function savePains(list) { save('pains', list); emit('pains'); }
export function addPain(p) { savePains([p, ...getPains()].slice(0, 60)); }
export function getWater(date) { return load('water', {})[date] || 0; }
export function addWater(date, ml) { const w = load('water', {}); w[date] = Math.max(0, (w[date] || 0) + ml); save('water', w); emit('water'); return w[date]; }
export function getChat() { return load('chat', []); }
export function saveChat(list) { save('chat', list.slice(-80)); }
export function getAiKey() { return load('aikey', ''); }
export function setAiKey(k) { save('aikey', k || ''); }

// ---------- Сообщения и указания тренера ученику ----------
// kind: msg — сообщение, light — облегчить тренировку, doctor — к врачу, ok — проверено
export function getCoachMsgs(to) { const l = load('coachmsgs', []); return to ? l.filter((m) => m.to === to) : l; }
export function addCoachMsg(m) { save('coachmsgs', [{ id: uid('m'), at: new Date().toISOString(), ...m }, ...load('coachmsgs', [])].slice(0, 200)); emit('coachmsgs'); }
export function markCoachMsgsRead(to) { save('coachmsgs', load('coachmsgs', []).map((m) => (m.to === to ? { ...m, read: true } : m))); }
// Действующее указание тренера (за последние 2 дня)
export function coachDirective(to) {
  return getCoachMsgs(to).find((m) => ['light', 'doctor'].includes(m.kind) && Date.now() - new Date(m.at) < 2 * 864e5) || null;
}
