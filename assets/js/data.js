// Справочники и ДЕМО-данные.
// Всё, что помечено demo: true, — примеры для показа. В интерфейсе они всегда помечены «Демо».

export const REGIONS = [
  { id: 'asgabat', name: { tk: 'Aşgabat', ru: 'Ашхабад', en: 'Ashgabat' } },
  { id: 'ahal', name: { tk: 'Ahal', ru: 'Ахал', en: 'Ahal' } },
  { id: 'balkan', name: { tk: 'Balkan', ru: 'Балкан', en: 'Balkan' } },
  { id: 'dasoguz', name: { tk: 'Daşoguz', ru: 'Дашогуз', en: 'Dashoguz' } },
  { id: 'lebap', name: { tk: 'Lebap', ru: 'Лебап', en: 'Lebap' } },
  { id: 'mary', name: { tk: 'Mary', ru: 'Мары', en: 'Mary' } },
];

export const STYLES = [
  { id: 'greco', name: { tk: 'Grek-rim göreşi', ru: 'Греко-римская', en: 'Greco-Roman' } },
  { id: 'free', name: { tk: 'Erkin göreş', ru: 'Вольная', en: 'Freestyle' } },
  { id: 'women', name: { tk: 'Aýallar göreşi', ru: 'Женская', en: "Women's" } },
  { id: 'goresh', name: { tk: 'Türkmen göreşi', ru: 'Гореш', en: 'Goresh' } },
];

export const AGE_GROUPS = ['7-10', '11-13', '14-15', '16-17', '18-22'];

export const EXPERIENCE = [
  { id: 'none', name: { tk: 'Tejribe ýok', ru: 'Нет опыта', en: 'No experience' } },
  { id: 'lt1', name: { tk: '1 ýyla çenli', ru: 'До 1 года', en: 'Under 1 year' } },
  { id: '1-3', name: { tk: '1–3 ýyl', ru: '1–3 года', en: '1–3 years' } },
  { id: '3+', name: { tk: '3 ýyldan köp', ru: 'Больше 3 лет', en: 'Over 3 years' } },
];

// Набор тестов — борцовская специфика. Черновик: утверждают тренеры федерации.
// kind: что можно честно измерить по видео с телефона. space: сколько метров нужно.
export const TESTS = [
  {
    id: 'sprawl', minAge: 7, maxAge: 22, seconds: 30, kind: 'reps', space: 3,
    name: { tk: '30 sekuntda sprawl (aýaklary taşlamak)', ru: 'Спраул за 30 секунд', en: '30-second sprawls' },
    short: { tk: 'Geçişden goranmak, bagryň tizligi', ru: 'Защита от прохода, скорость таза', en: 'Shot defence, hip speed' },
    rules: {
      tk: ['Telefony 3 metr uzaklykda gapdaldan goýuň', 'Göreş durşundan aýaklary yza taşlaň — bagyr düşege degsin', 'Döşi ýokary saklaň, kelläni galdyryň', 'Derrew durşa gaýdyp geliň — bu bir gaýtalama'],
      ru: ['Поставьте телефон сбоку в 3 метрах', 'Из борцовской стойки резко отбросьте ноги назад — бёдра касаются ковра', 'Грудь и голова подняты', 'Сразу вернитесь в стойку — это одно повторение'],
      en: ['Place the phone 3 metres away, side view', 'From your wrestling stance, kick your legs back — hips touch the mat', 'Keep your chest and head up', 'Return to stance at once — that is one rep'],
    },
  },
  {
    id: 'shot', minAge: 7, maxAge: 22, seconds: 30, kind: 'reps', space: 3,
    name: { tk: '30 sekuntda aýaga geçiş', ru: 'Проходы в ноги за 30 секунд', en: '30-second shots' },
    short: { tk: 'Hüjümiň derejesi we tizligi', ru: 'Уровень и скорость атаки', en: 'Attack level and speed' },
    rules: {
      tk: ['Telefony 3 metr uzaklykda gapdaldan goýuň', 'Durşdan derejäni peseldip, öňe ädim ätiň — dyz düşege degsin', 'Gollar öňe, arka göni, kelle ýokary', 'Durşa gaýdyp geliň, aýaklary çalşyryň'],
      ru: ['Поставьте телефон сбоку в 3 метрах', 'Из стойки опустите уровень и сделайте шаг вперёд — колено касается ковра', 'Руки вперёд, спина прямая, голова поднята', 'Вернитесь в стойку, чередуйте ноги'],
      en: ['Place the phone 3 metres away, side view', 'From stance, change level and step in — knee touches the mat', 'Arms forward, back straight, head up', 'Return to stance, alternate legs'],
    },
  },
  {
    id: 'bridge_up', minAge: 11, maxAge: 22, seconds: 15, kind: 'hold', space: 2,
    name: { tk: 'Durşdan köpri durmak', ru: 'Вставание на мост из стойки', en: 'Back bend into a bridge' },
    short: { tk: 'Arkanyň çeýeligi', ru: 'Гибкость спины', en: 'Back flexibility' },
    note: { tk: 'Ilkinji gezek — tälimçi bilen', ru: 'Впервые — со страховкой тренера', en: 'First time — with a coach spotting' },
    rules: {
      tk: ['Diňe ýumşak düşekde', 'Düşege arkaňyz bilen duruň, gollary ýokary galdyryň', 'Yza egilip, gollara daýanyp köpri duruň', '3 sekunt saklaň we ýuwaşlyk bilen turuň'],
      ru: ['Только на мягком ковре', 'Встаньте спиной к ковру, руки вверх', 'Прогнитесь назад и встаньте на мост с опорой на руки', 'Удержите 3 секунды и плавно выйдите'],
      en: ['Only on a soft mat', 'Stand with your back to the mat, arms up', 'Arch back into a bridge, landing on your hands', 'Hold for 3 seconds and come up smoothly'],
    },
  },
  {
    id: 'bridge_walk', minAge: 14, maxAge: 22, seconds: 30, kind: 'hold', space: 2, coachOnly: true,
    name: { tk: 'Köpride aýlanmak', ru: 'Забегания на мосту', en: 'Bridge walk-arounds' },
    short: { tk: 'Boýun we arka — diňe tälimçi bilen', ru: 'Шея и спина — только с тренером', en: 'Neck and back — coach only' },
    rules: {
      tk: ['Diňe tälimçiniň gözegçiliginde', 'Kellä daýanyp göreş köprüsinde duruň', 'Aýaklar bilen kelläniň töwereginde aýlanyň', 'Boýunda agyry bolsa — derrew bes ediň'],
      ru: ['Только под контролем тренера', 'Встаньте на борцовский мост с опорой на голову', 'Переступайте ногами по кругу вокруг головы', 'При боли в шее — сразу прекратите'],
      en: ['Only under a coach’s supervision', 'Get into a wrestler’s bridge on your head', 'Walk your feet in a circle around your head', 'Stop at once if your neck hurts'],
    },
  },
  {
    id: 'pullup', minAge: 7, maxAge: 22, seconds: 60, kind: 'reps', space: 2,
    name: { tk: 'Turnikde dartynmak', ru: 'Подтягивания на турнике', en: 'Pull-ups' },
    short: { tk: 'Tutuş we arka güýji', ru: 'Сила хвата и спины', en: 'Grip and back strength' },
    note: { tk: '7–10 ýaş — pes turnikde ýatyp', ru: '7–10 лет — из виса лёжа на низкой перекладине', en: 'Ages 7–10 — inverted rows on a low bar' },
    rules: {
      tk: ['Telefony gapdaldan goýuň — turnik we bütin beden kadrda bolsun', 'Ýokardan tutuň, egin giňliginde', 'Eňek turnikden ýokary galsyn', 'Aşakda gollary doly göneldiň, yrgyldamaň'],
      ru: ['Поставьте телефон сбоку — турник и всё тело в кадре', 'Хват сверху на ширине плеч', 'Подбородок выше перекладины', 'Внизу полностью выпрямляйте руки, без раскачки'],
      en: ['Place the phone at the side — bar and whole body in frame', 'Overhand grip, shoulder width', 'Chin above the bar', 'Fully straighten your arms at the bottom, no swinging'],
    },
  },
  {
    id: 'shuttle', minAge: 7, maxAge: 22, seconds: 20, kind: 'time', space: 10,
    name: { tk: '3×10 m ylgamak', ru: 'Челночный бег 3×10 м', en: '3×10 m shuttle run' },
    short: { tk: 'Tizlik we çeýelik', ru: 'Скорость и ловкость', en: 'Speed and agility' },
    rules: {
      tk: ['10 metri iki çyzyk bilen belläň', 'Telefony ortada gapdaldan goýuň — iki çyzyk hem kadrda bolsun', 'Ýazgyny başlangyçdan öň başlaň', '3 bölegi ylgaň, her gezek çyzyga el degiriň'],
      ru: ['Разметьте 10 метров двумя линиями', 'Поставьте телефон сбоку посередине — обе линии в кадре', 'Включите запись до старта', 'Пробегите 3 отрезка, каждый раз касаясь линии рукой'],
      en: ['Mark 10 metres with two lines', 'Place the phone at the side, in the middle — both lines in frame', 'Start recording before you start', 'Run 3 lengths, touching the line with your hand each time'],
    },
  },
];

export const testById = (id) => TESTS.find((x) => x.id === id);

import { rate, demoResults } from './rating.js';

// ---------- ДЕМО: спортсмены для рейтинга ----------
const A = (id, name, age, region, style, weight, score, delta) => {
  // Демо-статистика выводится из индекса, чтобы цифры были согласованы между собой
  const n = parseInt(id.slice(1), 10);
  const bouts = 10 + ((n * 7) % 14) + Math.round((score - 78) / 2);
  const wins = Math.min(bouts, Math.round(bouts * (0.55 + (score - 78) / 40)));
  const tournaments = 3 + ((n * 5) % 6);
  const medals = Math.max(0, Math.round((score - 80) / 3));
  return { id, name, age, region, style, weight, score, delta, bouts, wins, tournaments, medals, photo: 'athlete-' + id, demo: true };
};
export const DEMO_ATHLETES = [
  A('d1', 'Merdan A.', 15, 'mary', 'greco', 55, 91.4, 2),
  A('d2', 'Döwlet K.', 14, 'lebap', 'greco', 51, 89.7, -1),
  A('d3', 'Serdar H.', 16, 'ahal', 'free', 60, 88.9, 3),
  A('d4', 'Aýgül S.', 15, 'asgabat', 'women', 49, 88.1, 0),
  A('d5', 'Maksat B.', 13, 'dasoguz', 'goresh', 44, 86.6, 1),
  A('d6', 'Rahman Ö.', 12, 'balkan', 'free', 38, 85.2, -2),
  A('d7', 'Bahar N.', 16, 'mary', 'women', 53, 84.9, 4),
  A('d8', 'Kerim T.', 11, 'ahal', 'greco', 35, 83.3, 0),
  A('d9', 'Atamyrat G.', 17, 'lebap', 'goresh', 66, 82.8, 1),
  A('d10', 'Aýna M.', 10, 'asgabat', 'women', 30, 81.0, 2),
  A('d11', 'Ylýas R.', 9, 'balkan', 'free', 28, 79.5, -1),
  A('d12', 'Begenç D.', 14, 'dasoguz', 'greco', 48, 78.4, 0),
  A('d21', 'Alp Arslan Begenjov', 20, 'asgabat', 'free', 86, 95.0, 0),
  A('d22', 'Ýusup K.', 20, 'ahal', 'free', 74, 92.0, 0),
  A('d23', 'Gülşat B.', 19, 'lebap', 'women', 62, 90.6, 2),
  A('d24', 'Arslan Ç.', 22, 'balkan', 'goresh', 86, 89.9, -1),
  A('d25', 'Myrat Ý.', 18, 'asgabat', 'greco', 67, 88.3, 3),
  A('d26', 'Täçgül H.', 20, 'dasoguz', 'women', 57, 86.7, 0),
  A('d27', 'Şatlyk O.', 21, 'mary', 'free', 86, 85.5, -2),
  A('d28', 'Batyr P.', 19, 'lebap', 'goresh', 97, 84.1, 1),
];
// Реальный спортсмен: только подтверждённые факты (United World Wrestling, 2024).
// Индекс рейтинга — демо, как у всех; победы/схватки не выдумываем.
// Демо-презентация: у лидера детского рейтинга — фото для примера (подпись на карточке)
Object.assign(DEMO_ATHLETES.find((a) => a.id === 'd1'), { photo: 'athlete-kid', photoSample: true });
Object.assign(DEMO_ATHLETES.find((a) => a.id === 'd21'), {
  real: true, photo: 'athlete-alp', bouts: null, wins: null, medals: 5, worldScore: '46:0',
  titles: { tk: 'U23 Aziýa çempiony 2026 · Aziýa çempionatynyň bürünç medaly 2026 · U20 dünýä çempiony 2024', ru: 'Чемпион Азии U23 2026 · бронза чемпионата Азии 2026 · чемпион мира U20 2024', en: 'U23 Asian champion 2026 · Asian Championships bronze 2026 · U20 world champion 2024' },
  source: 'https://uww.org/article/begenjov-wins-turkmenistans-historic-world-title-freestyle',
});

// Очки рейтинга считаются из результатов турниров (rating.js). Исходное число в A() — только «сила»
// для генерации демо-результатов: чем она выше, тем лучше места.
Object.assign(DEMO_ATHLETES.find((a) => a.id === 'd21'), {
  realResults: [
    { name: { tk: 'U23 Aziýa çempionaty, Danang', ru: 'Чемпионат Азии U23, Дананг', en: 'U23 Asian Championships, Da Nang' }, level: 'major', date: '2026-05-27', monthOnly: true, place: 1, early: 2, real: true, source: 'https://turkmenistan.gov.tm/en/post/106765/alp-arslan-begenjov-wins-gold-first-time-u23-asian-freestyle-wrestling-championships' },
    { name: { tk: 'Aziýa çempionaty, Bişkek', ru: 'Чемпионат Азии, Бишкек', en: 'Asian Championships, Bishkek' }, level: 'major', date: '2026-04-12', monthOnly: true, place: 3, early: 1, real: true, source: 'https://uww.org/article/iran-caps-asian-championships-three-golds-team-title' },
    { name: { tk: 'Türkmenistanyň çempionaty, Türkmenbaşy', ru: 'Чемпионат Туркменистана, Туркменбашы', en: 'Turkmenistan championship, Turkmenbashy' }, level: 'national', date: '2025-01-09', monthOnly: true, place: 1, early: 0, real: true, source: 'https://aoc.gov.tm/en/single-news/609' },
    { name: { tk: 'U20 dünýä çempionaty, Pontewedra', ru: 'Чемпионат мира U20, Понтеведра', en: 'U20 World Championships, Pontevedra' }, level: 'major', date: '2024-09-07', monthOnly: true, place: 1, early: 0, real: true, source: 'https://uww.org/article/begenjov-wins-turkmenistans-historic-world-title-freestyle' },
  ],
});
export function ratingOf(a, today = new Date()) {
  // У реального спортсмена — только подтверждённые результаты, ничего не придумываем
  const results = a.realResults || demoResults(a.id, Math.max(0, Math.min(1, (a.strength - 78) / 20)), today);
  return rate(results, today);
}
for (const a of DEMO_ATHLETES) {
  a.strength = a.score;
  const r = ratingOf(a);
  a.score = r.total;
  if (!a.real) a.medals = r.rows.filter((x) => x.fresh && x.place && x.place <= 3).length;
}

// ---------- ДЕМО: новости ----------
export const NEWS = [
  {
    // Реальная новость — источник United World Wrestling
    id: 'n4', demo: false, date: '2024-09-07', source: 'https://uww.org/article/begenjov-wins-turkmenistans-historic-world-title-freestyle', credit: 'wrestling_mojtaba_madadi',
    tag: { tk: 'Ýygyndy', ru: 'Сборная', en: 'National team' },
    title: { tk: 'Alp Arslan Begenjow — U20 dünýä çempiony', ru: 'Alp Arslan Begenjov — чемпион мира U20', en: 'Alp Arslan Begenjov — U20 world champion' },
    body: {
      tk: 'Pontewedra, Ispaniýa, 2024-nji ýylyň 7-nji sentýabry. Erkin göreş, 79 kg. Finalda Begenjow ABŞ-nyň türgeni Ryder-i 5:0 hasabynda ýeňdi. Bu Türkmenistanyň erkin göreş boýunça taryhda ilkinji dünýä çempionlygy. Ýaryşyň dowamynda ol garşydaşlaryna bir utuk hem bermedi — 46:0.',
      ru: 'Понтеведра, Испания, 7 сентября 2024 года. Вольная борьба, 79 кг. В финале Begenjov победил Ryder (США) со счётом 5:0. Это первый в истории Туркменистана титул чемпиона мира по вольной борьбе. За весь турнир он не отдал соперникам ни одного очка — 46:0.',
      en: 'Pontevedra, Spain, 7 September 2024. Freestyle, 79 kg. Begenjov beat Ryder (USA) 5-0 in the final — Turkmenistan’s first-ever world title in freestyle. He did not concede a single point all tournament, outscoring opponents 46-0.',
    },
    art: 'trophy',
  },
  {
    id: 'n1', demo: true, date: '2026-10-14', tag: { tk: 'Platforma', ru: 'Платформа', en: 'Platform' },
    title: { tk: 'Talent Scout: ýurduň islendik ýerinden synag tabşyryp bolar', ru: 'Talent Scout: пройти отбор можно из любой точки страны', en: 'Talent Scout: try out from anywhere in the country' },
    body: { tk: 'Telefona düşürilen wideo boýunça başlangyç synag. Netijäni tälimçi tassyklaýar.', ru: 'Первичный отбор по видео с телефона. Итог всегда подтверждает тренер.', en: 'An initial screening from a phone video. A coach always confirms the result.' },
    art: 'mat',
  },
  {
    id: 'n2', demo: true, date: '2026-10-10', tag: { tk: 'Ýaryşlar', ru: 'Турниры', en: 'Events' },
    title: { tk: 'Ýaşlar arasynda açyk ýaryşyň tertibi', ru: 'Расписание открытого турнира среди юношей', en: 'Youth open tournament schedule' },
    body: { tk: 'Agram derejeleri we çykyşlaryň wagty.', ru: 'Весовые категории и время выходов на ковёр.', en: 'Weight classes and bout times.' },
    art: 'trophy',
  },
  {
    id: 'n3', demo: true, date: '2026-10-06', tag: { tk: 'Türgenleşik', ru: 'Тренировки', en: 'Training' },
    title: { tk: 'Synag üçin wideo nädip düşürmeli: 5 düzgün', ru: 'Как снять видео для теста: 5 правил', en: 'How to film your test: 5 rules' },
    body: { tk: 'Yşyk, aralyk, telefonyň ýeri we egin-eşik.', ru: 'Свет, расстояние, место телефона и одежда.', en: 'Light, distance, phone placement and clothing.' },
    art: 'phone',
  },
];

// ---------- ДЕМО: события и трансляции ----------
export const EVENTS = [
  {
    id: 'e1', demo: true, status: 'live', price: 15, style: 'greco', date: '2026-10-15T15:00:00+05:00',
    venue: { tk: 'Aşgabat', ru: 'Ашхабад', en: 'Ashgabat' },
    title: { tk: 'Ýaşlar arasynda açyk ýaryş', ru: 'Открытый турнир среди юношей', en: 'Youth open tournament' },
    matches: [
      { time: '15:00', w: '51', a: 'Döwlet K.', ar: 'lebap', b: 'Begenç D.', br: 'dasoguz' },
      { time: '15:20', w: '55', a: 'Merdan A.', ar: 'mary', b: 'Kerim T.', br: 'ahal' },
      { time: '15:40', w: '60', a: 'Serdar H.', ar: 'ahal', b: 'Rahman Ö.', br: 'balkan' },
    ],
  },
  {
    id: 'e2', demo: true, status: 'upcoming', price: 20, style: 'free', date: '2026-11-08T12:00:00+05:00',
    venue: { tk: 'Mary', ru: 'Мары', en: 'Mary' },
    title: { tk: 'Erkin göreş boýunça sebit ýaryşy', ru: 'Региональный турнир по вольной борьбе', en: 'Regional freestyle tournament' },
    matches: [],
  },
  {
    id: 'e3', demo: true, status: 'replay', price: 0, style: 'goresh', date: '2026-09-27T11:00:00+05:00',
    venue: { tk: 'Daşoguz', ru: 'Дашогуз', en: 'Dashoguz' },
    title: { tk: 'Göreş: finallar', ru: 'Гореш: финалы', en: 'Goresh: finals' },
    matches: [],
  },
  {
    id: 'e4', demo: true, status: 'upcoming', price: 0, style: 'women', date: '2026-11-22T11:00:00+05:00',
    venue: { tk: 'Türkmenabat', ru: 'Туркменабат', en: 'Turkmenabat' },
    title: { tk: 'Gyzlaryň arasynda kubok', ru: 'Кубок среди девушек', en: "Girls' cup" },
    matches: [],
  },
  {
    id: 'e5', demo: true, status: 'upcoming', price: 25, style: 'greco', date: '2026-12-13T12:00:00+05:00',
    venue: { tk: 'Aşgabat', ru: 'Ашхабад', en: 'Ashgabat' },
    title: { tk: 'Ýurt çempionaty: ýaşlar', ru: 'Чемпионат страны среди молодёжи', en: 'National youth championship' },
    matches: [],
  },
];

// ---------- ДЕМО: товары ----------
const prod = (o) => ({ demo: true, stock: 10, colors: [], sizes: [], ...o });
export const PRODUCTS = [
  prod({ id: 'p1', store: 'gear', cat: 'shoes', art: 'shoe', price: 650, colors: ['#121315', '#27b663'],
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], soldOut: ['36', '45'],
    name: { tk: 'Göreş aýakgaby Pro', ru: 'Борцовки Pro', en: 'Wrestling shoes Pro' },
    desc: { tk: 'Ýeňil, ýapyşýan ady, topugy berkidýär.', ru: 'Лёгкие, цепкая подошва, фиксация голеностопа.', en: 'Light, grippy sole, ankle support.' } }),
  prod({ id: 'p2', store: 'gear', cat: 'singlet', art: 'singlet', price: 380, colors: ['#b3262b', '#1d3f8f'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    name: { tk: 'Ýaryş trikosy', ru: 'Соревновательное трико', en: 'Competition singlet' },
    desc: { tk: 'Gyzyl we gök — ýaryşlar üçin.', ru: 'Красное и синее — для соревнований.', en: 'Red and blue — for competition.' } }),
  prod({ id: 'p3', store: 'gear', cat: 'headgear', art: 'headgear', price: 290, colors: ['#121315'], sizes: ['S', 'M', 'L'], stock: 3,
    name: { tk: 'Gulak goragçy', ru: 'Защита ушей', en: 'Headgear' },
    desc: { tk: 'Gulaklary goraýar, sazlanýan guşaklar.', ru: 'Защищает уши, регулируемые ремни.', en: 'Protects ears, adjustable straps.' } }),
  prod({ id: 'p4', store: 'gear', cat: 'protection', art: 'kneepad', price: 160, colors: ['#121315'], sizes: ['S', 'M', 'L'],
    name: { tk: 'Dyz goragçylary', ru: 'Наколенники', en: 'Knee pads' },
    desc: { tk: 'Ýumşak, düşekde türgenleşik üçin.', ru: 'Мягкие, для тренировок на ковре.', en: 'Soft, for mat training.' } }),
  prod({ id: 'p5', store: 'gear', cat: 'apparel', art: 'hoodie', price: 420, colors: ['#121315', '#ebe8e2'], sizes: ['S', 'M', 'L', 'XL'],
    name: { tk: 'Türgenleşik hudisi', ru: 'Тренировочное худи', en: 'Training hoodie' },
    desc: { tk: 'Ýyly, ýeňil, göreş üçin.', ru: 'Тёплое и лёгкое, для разминки.', en: 'Warm and light, for warm-ups.' } }),
  prod({ id: 'p6', store: 'gear', cat: 'bags', art: 'bag', price: 340, colors: ['#121315'], sizes: [],
    name: { tk: 'Sport sumkasy 40 l', ru: 'Спортивная сумка 40 л', en: 'Gym bag 40 L' },
    desc: { tk: 'Aýakgap üçin aýratyn bölüm.', ru: 'Отдельный отсек для обуви.', en: 'Separate shoe compartment.' } }),
  prod({ id: 'p7', store: 'gear', cat: 'accessories', art: 'bottle', price: 70, colors: ['#121315', '#27b663'], sizes: [],
    name: { tk: 'Suw çüýşesi 750 ml', ru: 'Бутылка для воды 750 мл', en: 'Water bottle 750 ml' },
    desc: { tk: 'Metal, sowuklygy saklaýar.', ru: 'Металлическая, держит холод.', en: 'Metal, keeps drinks cold.' } }),
  prod({ id: 'p8', store: 'gear', cat: 'merch', art: 'tee', price: 0, stock: 0, merchSoon: true, colors: [], sizes: [],
    name: { tk: 'Federasiýanyň resmi harytlary', ru: 'Официальный мерч федерации', en: 'Official federation merch' },
    desc: { tk: 'Ýakyn wagtda satuwa çykar.', ru: 'Скоро в продаже.', en: 'Coming soon.' } }),

  prod({ id: 'n1', store: 'nutrition', cat: 'protein', art: 'tub', price: 520, sizes: [], stock: 6,
    cert: 'pending', allergens: { tk: 'Süýt', ru: 'Молоко', en: 'Milk' },
    name: { tk: 'Syworotka beloky, 900 g', ru: 'Сывороточный протеин, 900 г', en: 'Whey protein, 900 g' },
    desc: { tk: 'Türgenleşikden soň iýmit goşundysy.', ru: 'Пищевой продукт для питания после тренировки.', en: 'A food product for post-training nutrition.' },
    serving: { tk: '30 g — 250 ml suw ýa-da süýt bilen', ru: '30 г на 250 мл воды или молока', en: '30 g in 250 ml water or milk' },
    ingredients: { tk: 'Syworotka beloky konsentraty, kakao, tebigy aromatizator', ru: 'Концентрат сывороточного белка, какао, натуральный ароматизатор', en: 'Whey protein concentrate, cocoa, natural flavouring' },
    facts: [['energy', '118 kcal'], ['protein', '22 g'], ['carbs', '3 g'], ['fat', '2 g']] }),
  prod({ id: 'n2', store: 'nutrition', cat: 'electrolyte', art: 'sachet', price: 95, sizes: [],
    cert: 'pending', allergens: { tk: 'Ýok', ru: 'Нет', en: 'None' },
    name: { tk: 'Elektrolitler, 10 paket', ru: 'Электролиты, 10 саше', en: 'Electrolytes, 10 sachets' },
    desc: { tk: 'Suwda eredip içmeli.', ru: 'Растворить в воде.', en: 'Dissolve in water.' },
    serving: { tk: '1 paket — 500 ml suw', ru: '1 саше на 500 мл воды', en: '1 sachet in 500 ml water' },
    ingredients: { tk: 'Natriý sitraty, kaliý hloridi, magniý, glýukoza', ru: 'Цитрат натрия, хлорид калия, магний, глюкоза', en: 'Sodium citrate, potassium chloride, magnesium, glucose' },
    facts: [['energy', '24 kcal'], ['sodium', '450 mg'], ['potassium', '200 mg'], ['carbs', '6 g']] }),
  prod({ id: 'n3', store: 'nutrition', cat: 'bars', art: 'bar', price: 22, sizes: [],
    cert: 'ok', allergens: { tk: 'Hoz, süýt', ru: 'Орехи, молоко', en: 'Nuts, milk' },
    name: { tk: 'Belok batonçigi 50 g', ru: 'Протеиновый батончик 50 г', en: 'Protein bar 50 g' },
    desc: { tk: 'Türgenleşigiň öň ýanynda ýa-da soň.', ru: 'Перекус до или после тренировки.', en: 'A snack before or after training.' },
    serving: { tk: '1 batonçik', ru: '1 батончик', en: '1 bar' },
    ingredients: { tk: 'Süýt beloky, hoz, hurma, kakao', ru: 'Молочный белок, орехи, финики, какао', en: 'Milk protein, nuts, dates, cocoa' },
    facts: [['energy', '196 kcal'], ['protein', '15 g'], ['carbs', '18 g'], ['fat', '7 g']] }),
];
export const productById = (id) => PRODUCTS.find((p) => p.id === id);

export const GEAR_CATS = ['all', 'shoes', 'singlet', 'headgear', 'protection', 'apparel', 'bags', 'accessories', 'merch'];
export const NUTRI_CATS = ['all', 'protein', 'electrolyte', 'bars'];

export const regionName = (id) => REGIONS.find((r) => r.id === id)?.name;
export const styleName = (id) => STYLES.find((s) => s.id === id)?.name;

// ---------- Фото ----------
// Кладите снимки в assets/photos/ с этими именами (jpg). Если файла нет — показывается фирменная графика.
export const PHOTO = (key) => `assets/photos/${key}.jpg`;
export const photoStyle = (key) => `--img:url('${PHOTO(key)}')`;
