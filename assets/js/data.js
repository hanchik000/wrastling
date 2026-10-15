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

// Набор тестов — черновик, утверждают тренеры федерации.
// kind: что можно честно измерить по видео с телефона.
export const TESTS = [
  {
    id: 'squat', minAge: 7, maxAge: 22, seconds: 30, kind: 'reps', side: true,
    name: { tk: '30 sekuntda çökmek', ru: 'Приседания за 30 секунд', en: '30-second squats' },
    short: { tk: 'Aýak güýji we çeýeligi', ru: 'Сила и выносливость ног', en: 'Leg strength and endurance' },
    rules: {
      tk: ['Telefony bil derejesinde gapdaldan goýuň', 'Bütin bedeniňiz kadrda bolsun', 'Budlar pola parallel bolýança çöküň', 'Dabanlary polda saklaň'],
      ru: ['Поставьте телефон сбоку на уровне пояса', 'Всё тело должно быть в кадре', 'Опускайтесь до параллели бёдер с полом', 'Пятки не отрывайте от пола'],
      en: ['Place the phone at waist height, side view', 'Keep your whole body in frame', 'Lower until thighs are parallel to the floor', 'Keep heels on the floor'],
    },
  },
  {
    id: 'pushup', minAge: 7, maxAge: 22, seconds: 30, kind: 'reps', side: true,
    name: { tk: '30 sekuntda ýere basyp galmak', ru: 'Отжимания за 30 секунд', en: '30-second push-ups' },
    short: { tk: 'Gol we egin güýji', ru: 'Сила рук и плечевого пояса', en: 'Arm and shoulder strength' },
    note: { tk: '7–10 ýaş — dyzlardan', ru: '7–10 лет — с колен', en: 'Ages 7–10 — from knees' },
    rules: {
      tk: ['Telefony pola gapdaldan goýuň', 'Bedeniňizi göni saklaň', 'Döşüňizi pola ýakynlaşdyryň', 'Gollary doly göneldiň'],
      ru: ['Поставьте телефон на пол сбоку', 'Держите корпус ровно', 'Опускайте грудь близко к полу', 'Полностью выпрямляйте руки'],
      en: ['Place the phone on the floor, side view', 'Keep your body straight', 'Bring your chest close to the floor', 'Fully straighten your arms'],
    },
  },
  {
    id: 'burpee', minAge: 11, maxAge: 22, seconds: 30, kind: 'reps', side: true,
    name: { tk: '30 sekuntda berpi', ru: 'Бёрпи за 30 секунд', en: '30-second burpees' },
    short: { tk: 'Çydamlylyk we tizlik', ru: 'Выносливость и скорость', en: 'Endurance and speed' },
    rules: {
      tk: ['Telefony 3 metr uzaklykda goýuň', 'Planka we bökmek kadrda görünsin', 'Her gezek doly turuň'],
      ru: ['Поставьте телефон в 3 метрах', 'Планка и прыжок должны быть в кадре', 'Каждый раз выпрямляйтесь полностью'],
      en: ['Place the phone 3 metres away', 'Plank and jump must be in frame', 'Stand up fully every time'],
    },
  },
  {
    id: 'jump', minAge: 7, maxAge: 22, seconds: 10, kind: 'coach', side: true,
    name: { tk: 'Ýerinden uzynlyga bökmek', ru: 'Прыжок в длину с места', en: 'Standing long jump' },
    short: { tk: 'Partlaýjy güýç', ru: 'Взрывная сила', en: 'Explosive power' },
    rules: {
      tk: ['Kadrda A4 kagyzyny goýuň — ölçeg üçin', 'Gapdaldan düşüriň', 'Iki aýak bilen bökiň we gonuň'],
      ru: ['Положите в кадр лист А4 — для масштаба', 'Снимайте сбоку', 'Отталкивайтесь и приземляйтесь на обе ноги'],
      en: ['Put an A4 sheet in frame for scale', 'Film from the side', 'Take off and land on both feet'],
    },
  },
  {
    id: 'reach', minAge: 7, maxAge: 22, seconds: 15, kind: 'angle', side: true,
    name: { tk: 'Oturyp öňe egilmek', ru: 'Наклон вперёд сидя', en: 'Sit-and-reach' },
    short: { tk: 'Çeýelik', ru: 'Гибкость', en: 'Flexibility' },
    rules: {
      tk: ['Aýaklary göni oturyň', 'Ýuwaşlyk bilen öňe uzanyň', '2 sekunt saklaň'],
      ru: ['Сядьте, ноги прямые', 'Плавно тянитесь вперёд', 'Задержитесь на 2 секунды'],
      en: ['Sit with straight legs', 'Reach forward smoothly', 'Hold for 2 seconds'],
    },
  },
  {
    id: 'bridge', minAge: 14, maxAge: 22, seconds: 20, kind: 'hold', side: true, coachOnly: true,
    name: { tk: 'Göreş köprüsi', ru: 'Борцовский мост', en: "Wrestler's bridge" },
    short: { tk: 'Diňe tälimçiniň ýanynda', ru: 'Только в присутствии тренера', en: 'Only with a coach present' },
    rules: {
      tk: ['Diňe tälimçiniň gözegçiliginde ýerine ýetiriň', 'Ýumşak düşekde', 'Agyry bolsa — derrew bes ediň'],
      ru: ['Выполняйте только под контролем тренера', 'Только на мягком ковре', 'При боли — сразу прекратите'],
      en: ['Perform only under a coach’s supervision', 'Only on a soft mat', 'Stop immediately if it hurts'],
    },
  },
];

export const testById = (id) => TESTS.find((x) => x.id === id);

// ---------- ДЕМО: спортсмены для рейтинга ----------
const A = (id, name, age, region, style, weight, score, delta) => ({ id, name, age, region, style, weight, score, delta, demo: true });
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
  A('d21', 'Nurmuhammet A.', 21, 'mary', 'greco', 77, 93.2, 1),
  A('d22', 'Ýusup K.', 20, 'ahal', 'free', 74, 92.0, 0),
  A('d23', 'Gülşat B.', 19, 'lebap', 'women', 62, 90.6, 2),
  A('d24', 'Arslan Ç.', 22, 'balkan', 'goresh', 86, 89.9, -1),
  A('d25', 'Myrat Ý.', 18, 'asgabat', 'greco', 67, 88.3, 3),
  A('d26', 'Täçgül H.', 20, 'dasoguz', 'women', 57, 86.7, 0),
  A('d27', 'Şatlyk O.', 21, 'mary', 'free', 86, 85.5, -2),
  A('d28', 'Batyr P.', 19, 'lebap', 'goresh', 97, 84.1, 1),
];

// ---------- ДЕМО: новости ----------
export const NEWS = [
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
];

// ---------- ДЕМО: товары ----------
const prod = (o) => ({ demo: true, stock: 10, colors: [], sizes: [], ...o });
export const PRODUCTS = [
  prod({ id: 'p1', store: 'gear', cat: 'shoes', art: 'shoe', price: 650, colors: ['#121315', '#c8a45a'],
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
  prod({ id: 'p7', store: 'gear', cat: 'accessories', art: 'bottle', price: 70, colors: ['#121315', '#c8a45a'], sizes: [],
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
