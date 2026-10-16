// Ученики тренера: у каждого свой дневник, боли и план помощника Champ AI.
// В демо — 8 учеников с данными-примером, плюс спортсмен этого устройства (его настоящие записи).
import { DEMO_ATHLETES } from './data.js';
import { demoTrainings, summary } from './training-lib.js';
import { plan as dostPlan } from './assistant.js';
import { getUser, getTrainings, getPains, coachDirective } from './store.js';
import { readiness } from './assistant.js';

const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
// Настройки демо: сила, скачок нагрузки, боли
const SETUP = {
  d1: { seed: 11, level: 1.2, height: 160 },
  d2: { seed: 23, level: 1.05, height: 158, spike: true },
  d3: { seed: 31, level: 1.1, height: 170, pains: [{ area: 'knee', side: 'l', level: 5, kind: 'dull', flags: [], note: 'После проходов в ноги', ago: 2 }] },
  d4: { seed: 47, level: 1, height: 157, pains: [{ area: 'shoulder', side: 'r', level: 7, kind: 'sharp', flags: ['swelling'], note: 'Упала на плечо в схватке', ago: 1 }] },
  d5: { seed: 53, level: 0.95, height: 152 },
  d7: { seed: 61, level: 0.9, height: 163, pains: [{ area: 'back', level: 3, kind: 'tight', flags: [], note: '', ago: 4 }] },
  d8: { seed: 71, level: 0.85, height: 142 },
  d12: { seed: 83, level: 0.8, height: 160 },
};

const cache = {};
function demoStudent(a) {
  if (cache[a.id]) return cache[a.id];
  const c = SETUP[a.id];
  const profile = {
    name: a.name, birthdate: `${new Date().getFullYear() - a.age}-03-15`, gender: a.style === 'women' ? 'f' : 'm',
    weight: a.weight, style: a.style, region: a.region, health: { height: c.height, goal: 'maintain', sessions: 5, trainHour: 17 },
  };
  const trainings = demoTrainings(new Date(), c.seed, { level: c.level, camera: true, weight: a.weight, spike: c.spike });
  const pains = (c.pains || []).map((p, i) => ({ id: a.id + 'p' + i, date: daysAgo(p.ago), ...p }));
  return (cache[a.id] = { id: a.id, demo: true, athlete: a, profile, trainings, pains });
}

export function getStudents() {
  const list = DEMO_ATHLETES.filter((a) => SETUP[a.id]).map(demoStudent);
  const u = getUser();
  if (u?.role === 'athlete' && u.profile) {
    list.unshift({ id: 'me', me: true, athlete: { id: 'me', name: u.profile.name, age: null, region: u.profile.region, style: u.profile.style, weight: u.profile.weight }, profile: u.profile, trainings: getTrainings(), pains: getPains() });
  }
  return list.map((s) => {
    const directive = coachDirective(s.id);
    const plan = dostPlan(s.profile, s.trainings, s.pains, new Date(), directive);
    return { ...s, directive, sm: summary(s.trainings), plan, ready: readiness(plan, s.trainings) };
  });
}
export const getStudent = (id) => getStudents().find((s) => s.id === id) || null;

// Насколько ученику нужно внимание тренера: 3 — срочно, 0 — всё хорошо
export function attention(s) {
  if (s.directive) return s.plan.act.some((p) => p.level >= 7 || (p.flags || []).length) && s.directive.kind !== 'doctor' ? 3 : 0.5; // тренер уже отреагировал
  if (['stop', 'doctor'].includes(s.plan.level)) return 3;
  if (s.plan.level === 'light' || (s.sm.acwr != null && s.sm.acwr > 1.5)) return 2;
  if (s.plan.act.length) return 1;
  return 0;
}
