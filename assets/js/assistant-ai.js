// Настоящий ИИ для свободного разговора (Claude). Подключается ключом в настройках помощника;
// ключ хранится только на этом устройстве. Без ключа или без связи отвечает встроенный помощник.
// В рабочей версии запрос идёт через сервер федерации, а ключ на телефон не попадает.
import { pick, FOODS, exName, areaById } from './assistant.js';

const MODEL = 'claude-sonnet-5-5';

function systemPrompt(ctx) {
  const P = ctx.plan, p = ctx.profile, h = p.health || {};
  const facts = {
    name: p.name, age: P.age, minor: P.minor, sex: p.gender === 'f' ? 'female' : 'male', weight_kg: P.w, height_cm: P.height,
    style: p.style, goal: h.goal, target_weight_class: h.targetClass || null, sessions_per_week: h.sessions, training_hour: P.trainHour,
    allergies: h.allergies || [], health_notes: h.notes || '',
    daily_targets: { kcal: P.kcal, protein_g: P.protein, carbs_g: P.carbs, fat_g: P.fat, water_ml: P.water },
    today_training_level: P.level, avoid_exercises: P.avoid.map((x) => exName(x, 'en')),
    active_pains: P.act.map((x) => ({ area: pick(areaById(x.area)?.name, 'en'), level: x.level, kind: x.kind, red_flags: x.flags, note: x.note })),
    last7days: { sessions: P.sm.sessions, minutes: P.sm.minutes, load: P.sm.load, avg_rpe: P.sm.rpe, acwr: P.sm.acwr },
    foods_to_limit: FOODS.filter((f) => f.status !== 'eat').map((f) => pick(f.name, 'en')),
  };
  return `You are "Dost" (Turkmen for "friend"), a warm, encouraging personal sports assistant inside the Wrestling Talent platform of Turkmenistan. You talk to one wrestler.

Language: always answer in the language of the athlete's last message — Turkmen (Latin alphabet) or Russian, English if they write English. Use simple words a teenager understands. Keep answers short: 2–6 sentences or a short list.

You help with: daily water and when to drink, what to eat and not eat (use local Turkmen food: palaw, çorba, dograma, gatyk, süzme, mäş, çörek, gawun, nar), training today, recovery, sleep, competition prep, motivation, and pain or discomfort.

Rules you never break:
- You are not a doctor. With red flags (swelling, numbness, can't bear weight, pain at rest or at night, pain 7/10 or more, after a fall or hit) tell them to stop training, tell the coach and see a doctor. Any head hit with dizziness, nausea or headache: no training until a doctor clears them.
- Never suggest medicines, doses, supplements, fat burners, diuretics or injections. Under 18: no energy drinks, no supplements.
- Weight: never advise dehydration, sauna cutting, skipping water or skipping meals. Under 18: no weight cutting at all — compete at natural weight. Adults: at most 0.5–1% body weight per week, agreed with the coach.
- Respect their allergies and the exercises to avoid listed below.
- If they seem very distressed, unsafe or mention self-harm, respond with care and urge them to talk to a trusted adult, parent or coach right away.

Athlete data (computed by the platform today):
${JSON.stringify(facts)}`;
}

export async function askClaude(key, history, ctx) {
  const msgs = history.slice(-12).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, system: systemPrompt(ctx), messages: msgs }),
    });
    if (!res.ok) throw new Error('http_' + res.status);
    const data = await res.json();
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    if (!text) throw new Error('empty');
    return text;
  } finally {
    clearTimeout(timer);
  }
}
