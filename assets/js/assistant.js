// «Champ AI» — личный помощник спортсмена. Работает на устройстве, без интернета:
// считает воду и питание по анкете, советует по тренировке с учётом дневника и болей, отвечает в чате
// на туркменском, русском и английском. Это не врач: при тревожных признаках всегда отправляет к врачу.
import { summary, load as sLoad, parse, iso, addDays } from './training-lib.js';

const T3 = (tk, ru, en) => ({ tk, ru, en });
export const pick = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.ru);

// ---------- Справочники ----------
export const ALLERGENS = [
  { id: 'milk', name: T3('Süýt / laktoza', 'Молоко / лактоза', 'Milk / lactose') },
  { id: 'gluten', name: T3('Glýuten (bugdaý)', 'Глютен (пшеница)', 'Gluten (wheat)') },
  { id: 'nuts', name: T3('Hozlar', 'Орехи', 'Nuts') },
  { id: 'egg', name: T3('Ýumurtga', 'Яйца', 'Eggs') },
  { id: 'fish', name: T3('Balyk', 'Рыба', 'Fish') },
  { id: 'honey', name: T3('Bal', 'Мёд', 'Honey') },
];

// status: eat — основа рациона, limit — изредка и не перед тренировкой, avoid — не надо
export const FOODS = [
  { id: 'chicken', status: 'eat', g: 'protein', name: T3('Towuk eti', 'Курица', 'Chicken'), syn: ['куриц', 'курин', 'towuk', 'chicken'] },
  { id: 'beef', status: 'eat', g: 'protein', name: T3('Sygyr eti (ýagsyz)', 'Говядина (нежирная)', 'Lean beef'), syn: ['говяд', 'мясо', 'шашлык', 'котлет', 'sygyr', 'et ', 'kebap', 'kebab', 'beef', 'meat'] },
  { id: 'fish', status: 'eat', g: 'protein', all: ['fish'], name: T3('Balyk', 'Рыба', 'Fish'), syn: ['рыб', 'balyk', 'fish'] },
  { id: 'eggs', status: 'eat', g: 'protein', all: ['egg'], name: T3('Ýumurtga', 'Яйца', 'Eggs'), syn: ['яйц', 'яичниц', 'омлет', 'ýumurtga', 'yumurtga', 'egg'] },
  { id: 'gatyk', status: 'eat', g: 'dairy', all: ['milk'], name: T3('Gatyk', 'Катык / кефир', 'Gatyk / kefir'), syn: ['катык', 'кефир', 'йогурт', 'gatyk', 'kefir', 'yogurt'] },
  { id: 'suzme', status: 'eat', g: 'dairy', all: ['milk'], name: T3('Süzme / tworog', 'Сузьма / творог', 'Suzma / cottage cheese'), syn: ['творог', 'сузьм', 'сыр', 'süzme', 'suzme', 'tworog', 'peýnir', 'cottage', 'cheese'] },
  { id: 'milk', status: 'eat', g: 'dairy', all: ['milk'], name: T3('Süýt', 'Молоко', 'Milk'), syn: ['молок', 'süýt', 'suyt', 'milk'] },
  { id: 'mash', status: 'eat', g: 'protein', name: T3('Mäş, merjimek', 'Маш, чечевица', 'Mung beans, lentils'), syn: ['маш', 'чечевиц', 'фасол', 'mäş', 'mash', 'merjimek', 'noýba', 'lentil', 'beans'] },
  { id: 'buckwheat', status: 'eat', g: 'carb', name: T3('Grečka', 'Гречка', 'Buckwheat'), syn: ['гречк', 'grečka', 'grechka', 'buckwheat'] },
  { id: 'rice', status: 'eat', g: 'carb', name: T3('Tüwi', 'Рис', 'Rice'), syn: ['рис', 'tüwi', 'tuwi', 'rice'] },
  { id: 'oats', status: 'eat', g: 'carb', name: T3('Süle bulamaç', 'Овсянка', 'Oatmeal'), syn: ['овсян', 'каша', 'süle', 'bulamaç', 'oat', 'porridge'] },
  { id: 'bread', status: 'eat', g: 'carb', all: ['gluten'], name: T3('Çörek (doly däneli)', 'Хлеб (цельнозерновой)', 'Wholegrain bread'), syn: ['хлеб', 'лепёш', 'лепеш', 'çörek', 'corek', 'bread'] },
  { id: 'pasta', status: 'eat', g: 'carb', all: ['gluten'], name: T3('Unaş, makaron', 'Макароны', 'Pasta'), syn: ['макарон', 'лапш', 'лагман', 'makaron', 'unaş', 'lagman', 'pasta', 'noodle'] },
  { id: 'potato', status: 'eat', g: 'carb', name: T3('Kartoşka (gaýnadylan)', 'Картофель (варёный)', 'Boiled potatoes'), syn: ['картош', 'картоф', 'kartoşka', 'kartoshka', 'potato'] },
  { id: 'veg', status: 'eat', g: 'veg', name: T3('Gök önümler: hyýar, pomidor, käşir', 'Овощи: огурцы, помидоры, морковь', 'Vegetables'), syn: ['овощ', 'салат', 'огур', 'помид', 'морков', 'gök önüm', 'hyýar', 'pomidor', 'käşir', 'salat', 'vegetable', 'salad'] },
  { id: 'melon', status: 'eat', g: 'fruit', name: T3('Gawun, garpyz', 'Дыня, арбуз', 'Melon, watermelon'), syn: ['дын', 'арбуз', 'gawun', 'garpyz', 'melon'] },
  { id: 'fruit', status: 'eat', g: 'fruit', name: T3('Miweler: alma, nar, üzüm, banan', 'Фрукты: яблоки, гранат, виноград, бананы', 'Fruit: apples, pomegranate, grapes, bananas'), syn: ['фрукт', 'яблок', 'гранат', 'виноград', 'банан', 'miwe', 'alma', 'nar', 'üzüm', 'banan', 'fruit', 'apple', 'banana', 'grape'] },
  { id: 'dried', status: 'eat', g: 'fruit', name: T3('Kişmiş, ürük', 'Изюм, курага', 'Raisins, dried apricots'), syn: ['изюм', 'кураг', 'сухофрукт', 'kişmiş', 'ürük', 'raisin', 'dried'] },
  { id: 'nuts', status: 'eat', g: 'fat', all: ['nuts'], name: T3('Hoz, badam (bir owuç)', 'Орехи, миндаль (горсть)', 'Nuts (a handful)'), syn: ['орех', 'миндал', 'фисташ', 'hoz', 'badam', 'pisse', 'nut', 'almond'] },
  { id: 'honey', status: 'eat', g: 'carb', all: ['honey'], name: T3('Bal (az-azdan)', 'Мёд (понемногу)', 'Honey (a little)'), syn: ['мёд', 'мед ', 'bal ', 'honey'] },
  { id: 'chorba', status: 'eat', g: 'meal', name: T3('Çorba (gaty ýagly däl)', 'Суп, чорба (не жирный)', 'Soup (not fatty)'), syn: ['суп', 'чорб', 'бульон', 'çorba', 'chorba', 'soup'] },
  { id: 'tea', status: 'eat', g: 'drink', name: T3('Çaý (şekersiz)', 'Чай (без сахара)', 'Tea (no sugar)'), syn: ['чай', 'чаю', 'çaý', 'cay', 'tea'] },
  { id: 'manty', status: 'limit', g: 'meal', all: ['gluten'], name: T3('Manty, börek', 'Манты, бёрек', 'Manty dumplings'), syn: ['манты', 'мант', 'пельмен', 'манту', 'бёрек', 'börek', 'manty', 'dumpling'], why: T3('Ýagly et — türgenleşikden öň däl, hepdede 1–2 gezek.', 'Жирное мясо в тесте — не перед тренировкой, 1–2 раза в неделю.', 'Fatty meat in dough — not before training, 1–2 times a week.') },
  { id: 'palaw', status: 'limit', g: 'meal', name: T3('Palaw', 'Плов', 'Plov'), syn: ['плов', 'palaw', 'plow', 'plov', 'pilaf'], why: T3('Gaty ýagly: türgenleşikden we ýaryşdan öň däl, hepdede 1–2 gezek, az ýagly bişirseň gowy.', 'Очень жирный: не перед тренировкой и турниром, 1–2 раза в неделю, лучше с меньшим количеством масла.', 'Very fatty: not before training or competition, 1–2 times a week, ideally with less oil.') },
  { id: 'dograma', status: 'limit', g: 'meal', all: ['gluten'], name: T3('Dograma', 'Дограма', 'Dograma'), syn: ['дограм', 'dograma'], why: T3('Agyr nahar — türgenleşikden azyndan 3 sagat öň ýa-da soň iý.', 'Тяжёлое блюдо — ешь минимум за 3 часа до тренировки или после неё.', 'Heavy dish — eat at least 3 hours before training or after it.') },
  { id: 'fried', status: 'limit', g: 'fat', name: T3('Gowrulan: gutap, somsa, pişme, kartoşka fri', 'Жареное: гутап, сомса, пишме, картошка фри', 'Fried food: gutap, somsa, pishme, fries'), syn: ['жарен', 'гутап', 'сомс', 'самс', 'пишме', 'фри', 'чебурек', 'gutap', 'somsa', 'pişme', 'gowrulan', 'fried', 'fries'], why: T3('Agyr we ýagly, garyn agyrlygy berýär. Hepdede bir gezekden köp däl.', 'Тяжело и жирно, даёт тяжесть. Не чаще раза в неделю.', 'Heavy and fatty. No more than once a week.') },
  { id: 'sweets', status: 'limit', g: 'sweet', all: ['gluten'], name: T3('Süýjüler, tort, şokolad', 'Сладости, торты, шоколад', 'Sweets, cakes, chocolate'), syn: ['сладк', 'торт', 'конфет', 'шоколад', 'пирож', 'мороже', 'печень', 'süýji', 'tort', 'şokolad', 'doňdurma', 'sweet', 'cake', 'chocolate', 'candy', 'ice cream'], why: T3('Az mukdarda we türgenleşikden soň bolýar, ýöne her gün däl.', 'Немного и после тренировки — можно, но не каждый день.', 'A little after training is fine, but not every day.') },
  { id: 'sausage', status: 'limit', g: 'protein', name: T3('Kolbasa, sosiska', 'Колбаса, сосиски', 'Sausage'), syn: ['колбас', 'сосиск', 'kolbasa', 'sosiska', 'sausage'], why: T3('Duz we ýag köp. Adaty eti saýla.', 'Много соли и жира. Лучше обычное мясо.', 'Lots of salt and fat. Choose plain meat.') },
  { id: 'fastfood', status: 'limit', g: 'fast', all: ['gluten'], name: T3('Burger, şawerma, pizza', 'Бургер, шаурма, пицца', 'Burgers, shawarma, pizza'), syn: ['бургер', 'шаурм', 'шаверм', 'пицц', 'хот-дог', 'фастфуд', 'burger', 'şawerma', 'pizza', 'fast food', 'shawarma'], why: T3('Seýrek bolsa bolýar, ýöne ýaryşdan öňki hepdede däl.', 'Изредка можно, но не в неделю перед турниром.', 'Occasionally, but not in the week before a tournament.') },
  { id: 'soda', status: 'avoid', g: 'drink', name: T3('Süýji gazly suw', 'Сладкая газировка', 'Sugary soda'), syn: ['газиров', 'кола', 'колу', 'колы', 'кока', 'спрайт', 'пепси', 'фанта', 'лимонад', 'gazly', 'kola', 'soda', 'coke', 'pepsi'], why: T3('Diňe şeker we gaz — suwuň deregine gelmeýär.', 'Только сахар и газ — воду не заменяет.', 'Just sugar and gas — not a substitute for water.') },
  { id: 'energy', status: 'avoid', g: 'drink', name: T3('Energetikler', 'Энергетики', 'Energy drinks'), syn: ['энергетик', 'ред бул', 'redbull', 'red bull', 'adrenalin', 'energetik', 'energy drink'], why: T3('Ýüregi gysýar we ukyny bozýar. Ýetginjeklere düýbünden bolmaýar.', 'Нагружают сердце и сбивают сон. Подросткам — совсем нельзя.', 'Strain the heart and ruin sleep. Not at all for teenagers.') },
  { id: 'chips', status: 'avoid', g: 'fast', name: T3('Çipsy, kirieşki', 'Чипсы, сухарики', 'Crisps'), syn: ['чипс', 'сухарик', 'çips', 'chips', 'crisps'], why: T3('Duz we ýag, peýdasy ýok.', 'Соль и жир, пользы нет.', 'Salt and fat, no benefit.') },
  { id: 'burners', status: 'avoid', g: 'pill', name: T3('Ýag ýakyjylar, suw çykaryjy dermanlar', 'Жиросжигатели, мочегонные', 'Fat burners, diuretics'), syn: ['жиросжиг', 'мочегон', 'диурет', 'таблетк', 'ýag ýakyjy', 'derman', 'burner', 'diuretic', 'pill'], why: T3('Agram düşürmek üçin howply — ýürege we böwreklere zyýan. Diňe lukmanyň bellemegi bilen.', 'Опасно для сгонки — бьёт по сердцу и почкам. Только по назначению врача.', 'Dangerous for cutting weight — harms the heart and kidneys. Only if a doctor prescribes.') },
];
export const foodById = (id) => FOODS.find((f) => f.id === id);

export const AREAS = [
  { id: 'head', name: T3('Kelle', 'Голова', 'Head'), kw: ['голов', 'сотряс', 'kelle', 'baş', 'head', 'concuss'] },
  { id: 'neck', name: T3('Boýun', 'Шея', 'Neck'), kw: ['шея', 'шеи', 'шею', 'шейн', 'boýun', 'boyun', 'neck'] },
  { id: 'shoulder', name: T3('Egin', 'Плечо', 'Shoulder'), kw: ['плеч', 'egin', 'shoulder'] },
  { id: 'elbow', name: T3('Tirsek', 'Локоть', 'Elbow'), kw: ['локот', 'локт', 'tirsek', 'elbow'] },
  { id: 'wrist', name: T3('Bilek, el', 'Запястье, кисть', 'Wrist, hand'), kw: ['запяст', 'кист', 'палец', 'пальц', 'bilek', 'barmak', 'wrist', 'hand', 'finger'] },
  { id: 'chest', name: T3('Döş, gapyrga', 'Грудь, рёбра', 'Chest, ribs'), kw: ['груд', 'рёбр', 'ребр', 'döş', 'gapyrga', 'chest', 'rib'] },
  { id: 'back', name: T3('Bil, arka', 'Спина, поясница', 'Back, lower back'), kw: ['спин', 'поясниц', 'bil ', 'bilim', 'arka', 'back'] },
  { id: 'hip', name: T3('But, çanak', 'Бедро, таз, пах', 'Hip, groin'), kw: ['бедр', 'таз', 'пах', 'but', 'çanak', 'hip', 'groin', 'thigh'] },
  { id: 'knee', name: T3('Dyz', 'Колено', 'Knee'), kw: ['колен', 'dyz', 'knee'] },
  { id: 'ankle', name: T3('Topuk, aýak', 'Голеностоп, стопа', 'Ankle, foot'), kw: ['голеност', 'лодыж', 'стоп', 'пятк', 'topuk', 'aýak', 'ayak', 'ankle', 'foot'] },
];
export const areaById = (id) => AREAS.find((a) => a.id === id);

const EX = {
  bridge: T3('göreş köprüsi', 'борцовский мост', 'wrestler’s bridge'),
  bridge_walk: T3('köprüde aýlanmak', 'забегания на мосту', 'bridge walk-arounds'),
  throws: T3('zyňdyrmalar', 'броски', 'throws'),
  sparring: T3('doly güýçli tutluşyklar', 'схватки в полную силу', 'full-power sparring'),
  pullups: T3('dartynmak', 'подтягивания', 'pull-ups'),
  pushups: T3('itilmek', 'отжимания', 'push-ups'),
  squats: T3('oturyp-turmak', 'приседания', 'squats'),
  shots: T3('aýaga geçişler', 'проходы в ноги', 'shots'),
  sprawls: T3('sprawl', 'спраулы', 'sprawls'),
  running: T3('ylgaw, çelnok', 'бег, челнок', 'running, shuttle'),
};
const AREA_RULES = {
  head: { avoid: Object.keys(EX), alt: T3('Lukman rugsat berýänçä türgenleşik ýok. Dynç al, ekrana az seret.', 'До разрешения врача — никаких тренировок. Покой, меньше экранов.', 'No training until a doctor clears you. Rest, less screen time.') },
  neck: { avoid: ['bridge', 'bridge_walk', 'throws', 'sparring'], alt: T3('Aýaklar we garyn üçin maşklar, ýeňil ylgaw.', 'Ноги и пресс, лёгкий бег.', 'Legs and core work, easy running.') },
  shoulder: { avoid: ['pullups', 'pushups', 'throws', 'sparring'], alt: T3('Aýaklar: oturyp-turmak, ylgaw; garyn maşklary.', 'Ноги: приседания, бег; упражнения на пресс.', 'Legs: squats, running; core exercises.') },
  elbow: { avoid: ['pullups', 'pushups', 'throws'], alt: T3('Aýaklar, ylgaw, durşda hereket.', 'Ноги, бег, передвижения в стойке.', 'Legs, running, stance movement.') },
  wrist: { avoid: ['pushups', 'pullups', 'throws'], alt: T3('Aýaklar, ylgaw, garyn.', 'Ноги, бег, пресс.', 'Legs, running, core.') },
  chest: { avoid: ['pushups', 'throws', 'sparring'], alt: T3('Ýeňil ylgaw, aýaklar, süýndürmek.', 'Лёгкий бег, ноги, растяжка.', 'Easy running, legs, stretching.') },
  back: { avoid: ['bridge', 'bridge_walk', 'throws', 'squats', 'sparring'], alt: T3('Ýeňil ýöremek, süýndürmek, egin we el üçin ýeňil maşklar.', 'Ходьба, растяжка, лёгкая работа на руки.', 'Walking, stretching, light arm work.') },
  hip: { avoid: ['shots', 'sprawls', 'squats', 'running'], alt: T3('El we garyn maşklary, tehnika ýerinde.', 'Руки и пресс, техника на месте.', 'Arms and core, technique on the spot.') },
  knee: { avoid: ['squats', 'shots', 'sprawls', 'running'], alt: T3('El we arka maşklary, oturyp edilýän maşklar.', 'Руки, спина, упражнения сидя и лёжа.', 'Arms, back, seated and lying exercises.') },
  ankle: { avoid: ['running', 'shots', 'sprawls'], alt: T3('El maşklary, garyn, oturyp edilýän tehnika.', 'Руки, пресс, техника в партере.', 'Arm work, core, ground technique.') },
};
export const RED_FLAGS = [
  { id: 'swelling', name: T3('Çiş ýa-da gögerme', 'Отёк или синяк', 'Swelling or bruising') },
  { id: 'numb', name: T3('Ysgynsyzlyk, gyjyndy, el-aýak ysmaýar', 'Онемение, покалывание', 'Numbness, tingling') },
  { id: 'impact', name: T3('Urgy ýa-da ýykylandan soň', 'После удара или падения', 'After a hit or a fall') },
  { id: 'rest', name: T3('Dynçlykda we gijesine agyrýar', 'Болит в покое и ночью', 'Hurts at rest and at night') },
  { id: 'cant', name: T3('Basyp bolmaýar, hereket edip bolmaýar', 'Не могу наступить или двигать', 'Can’t put weight on it or move it') },
  { id: 'headhit', name: T3('Kellä urgy, baş aýlanýar, ýürek bulanýar', 'Удар головой, кружится голова, тошнит', 'Head hit, dizziness, nausea') },
];
export const PAIN_KINDS = [
  { id: 'sharp', name: T3('Ýiti', 'Острая', 'Sharp') },
  { id: 'dull', name: T3('Gaty däl, dowamly', 'Ноющая', 'Dull, aching') },
  { id: 'burn', name: T3('Ýakýan', 'Жгучая', 'Burning') },
  { id: 'tight', name: T3('Gysýan, berk', 'Тянет, скованность', 'Tight, stiff') },
];

// ---------- Расчёты ----------
const r50 = (v) => Math.round(v / 50) * 50;
const hhmm = (h) => `${String(Math.floor(((h % 24) + 24) % 24)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export function ageFrom(bd) {
  if (!bd) return null;
  const b = new Date(bd), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

export function activePains(pains, today = new Date()) {
  return pains.filter((p) => !p.resolved && (today - new Date(p.date)) / 864e5 <= 10);
}

export function plan(profile, trainings = [], pains = [], today = new Date(), directive = null) {
  const h = profile.health || {};
  const age = ageFrom(profile.birthdate);
  const minor = age != null && age < 18;
  const w = +profile.weight || 60;
  const height = +h.height || null;
  const male = profile.gender !== 'f';
  const sessions = +h.sessions || 5;
  const trainHour = h.trainHour ?? 17;
  const sm = summary(trainings, today);
  const recent = trainings.filter((s) => parse(s.date) >= addDays(today, -14));
  const avgMin = recent.length ? recent.reduce((a, s) => a + s.minutes, 0) / recent.length : 90;
  const todayTrained = trainings.some((s) => s.date === iso(today));

  // Энергия: Миффлин — Сан Жеор × активность. Подросткам +10% на рост, без дефицита.
  let kcal = null;
  if (height && age) {
    const bmr = 10 * w + 6.25 * height - 5 * age + (male ? 5 : -161);
    const act = sessions >= 6 ? 1.85 : sessions >= 4 ? 1.7 : 1.55;
    kcal = bmr * act * (minor ? 1.1 : 1);
  }
  const alerts = [];
  const goal = h.goal || 'maintain';
  const target = +h.targetClass || null;
  const gap = target ? w - target : 0;
  if (goal === 'make_weight' && target && gap > 0) {
    if (minor) {
      alerts.push({ level: 'warn', text: T3(
        `Sen entek ösýärsiň — agram peseltmek bolmaýar. Häzirki agramyňda (${w} kg) çykyş et we muny tälimçi bilen ara al.`,
        `Ты ещё растёшь — сгонять вес нельзя. Выступай в весе, который у тебя есть (${w} кг), и обсуди это с тренером.`,
        `You are still growing — no weight cutting. Compete at your current weight (${w} kg) and talk it over with your coach.`) });
    } else {
      const pct = (gap / w) * 100;
      const weeks = Math.ceil(gap / (w * 0.0075));
      if (kcal) kcal -= Math.min(400, kcal * 0.12);
      alerts.push({ level: pct > 5 ? 'warn' : 'info', text: T3(
        `${target} kg-a çenli ${gap.toFixed(1)} kg galdy. Howpsuz depgin — hepdede 0,5–1% (takmynan ${weeks} hepde). Saunasyz, suwsuz galmazdan we dermansyz.`,
        `До ${target} кг осталось ${gap.toFixed(1)} кг. Безопасный темп — 0,5–1% в неделю (примерно ${weeks} нед.). Без сауны, без отказа от воды и без таблеток.`,
        `${gap.toFixed(1)} kg to go to ${target} kg. Safe pace is 0.5–1% a week (about ${weeks} weeks). No sauna, no water restriction, no pills.`) });
      if (pct > 5) alerts.push({ level: 'warn', text: T3('Tapawut 5%-den köp — has ýokary agram derejesinde çykyş etmegi tälimçi bilen pikirlen.', 'Разница больше 5% — подумай с тренером о выступлении в весе выше.', 'The gap is over 5% — consider the next weight class up with your coach.') });
    }
  }
  if (goal === 'gain' && kcal) kcal += 300;
  const protein = Math.round(w * (minor ? 1.5 : 1.8));
  const fat = kcal ? Math.round((kcal * 0.27) / 9) : null;
  const carbs = kcal ? Math.round((kcal - protein * 4 - fat * 9) / 4) : null;

  // Вода: 35 мл/кг + 500 мл на каждый час тренировки
  const trainL = (avgMin / 60) * 500;
  const water = r50(w * 35 + trainL);
  const wake = h.wake ?? 7, sleep = h.sleep ?? 22.5;
  const waterPlan = [
    { at: hhmm(wake), ml: 350, note: T3('Oýananyňdan soň — bir bulgur suw', 'Сразу после сна — стакан воды', 'Right after waking — a glass of water') },
    { at: hhmm(wake + 3), ml: 300, note: T3('Ertirlik bilen nahar arasynda', 'Между завтраком и обедом', 'Between breakfast and lunch') },
    { at: hhmm(trainHour - 2), ml: 500, note: T3('Türgenleşikden 2 sagat öň', 'За 2 часа до тренировки', '2 hours before training') },
    { at: hhmm(trainHour - 0.25), ml: 200, note: T3('Başlamazdan 15 minut öň', 'За 15 минут до начала', '15 minutes before') },
    { at: `${hhmm(trainHour)}–${hhmm(trainHour + avgMin / 60)}`, ml: r50((avgMin / 20) * 180), note: T3('Türgenleşikde — her 15–20 minutda 3–4 owurt', 'На тренировке — каждые 15–20 минут по 3–4 глотка', 'During training — 3–4 sips every 15–20 minutes') },
    { at: hhmm(trainHour + avgMin / 60 + 0.25), ml: 600, note: T3('Türgenleşikden soň — ýitirilen suwy dikelt', 'После тренировки — восполни потерю', 'After training — replace what you lost') },
  ];
  const planned = waterPlan.reduce((a, x) => a + x.ml, 0);
  waterPlan.push({ at: hhmm(sleep - 2), ml: Math.max(200, r50(water - planned)), note: T3('Agşam — ýatmazdan 1–2 sagat öň gutar', 'Вечером — закончи за 1–2 часа до сна', 'Evening — finish 1–2 hours before bed') });
  const waterDont = [
    T3('Türgenleşigiň öň ýanynda birden köp içme — garyn agyrlaşar.', 'Не пей много сразу перед тренировкой — будет тяжело в животе.', 'Don’t drink a lot right before training — it sits heavy.'),
    T3('Ýatmazdan öň köp içme — ukyň bozular.', 'Не пей много перед сном — будешь просыпаться.', 'Don’t drink a lot before bed — you’ll wake up.'),
    T3('Suwy gazly süýji suw we energetik bilen çalşyrma.', 'Не заменяй воду газировкой и энергетиками.', 'Don’t replace water with soda or energy drinks.'),
    T3('Agram üçin suwdan ýüz öwürme — bu howply.', 'Не отказывайся от воды ради веса — это опасно.', 'Never cut water to make weight — it’s dangerous.'),
  ];

  // Питание по времени тренировки
  const meals = [
    { at: hhmm(wake + 0.5), name: T3('Ertirlik', 'Завтрак', 'Breakfast'), what: ['oats', 'eggs', 'gatyk', 'fruit'] },
    { at: hhmm(Math.min(13, trainHour - 3.5)), name: T3('Günortan nahary', 'Обед', 'Lunch'), what: ['chorba', 'rice', 'chicken', 'veg'] },
    { at: hhmm(trainHour - 1.5), name: T3('Türgenleşikden öň', 'Перед тренировкой', 'Before training'), what: ['bread', 'honey', 'fruit'], note: T3('Ýeňil, ýagsyz', 'Лёгкое, без жира', 'Light, low fat') },
    { at: hhmm(trainHour + avgMin / 60 + 0.5), name: T3('Türgenleşikden soň (1 sagadyň içinde)', 'После тренировки (в течение часа)', 'After training (within an hour)'), what: ['suzme', 'fruit', 'dried'], note: T3('Belok + uglewod', 'Белок + углеводы', 'Protein + carbs') },
    { at: hhmm(Math.max(trainHour + avgMin / 60 + 2, sleep - 3)), name: T3('Agşamlyk', 'Ужин', 'Dinner'), what: ['beef', 'buckwheat', 'veg'], note: T3('Ýatmazdan 2–3 sagat öň', 'За 2–3 часа до сна', '2–3 hours before bed') },
  ];
  const allergies = new Set(h.allergies || []);
  const ok = (f) => !(f.all || []).some((a) => allergies.has(a));
  const swap = { eggs: 'mash', gatyk: 'dried', suzme: 'chicken', milk: 'fruit', bread: 'potato', pasta: 'rice', honey: 'dried', nuts: 'dried', fish: 'chicken', oats: 'buckwheat' };
  meals.forEach((m) => { m.what = [...new Set(m.what.map((id) => (ok(foodById(id)) ? id : swap[id] || 'veg')))]; });
  const foods = {
    eat: FOODS.filter((f) => f.status === 'eat' && ok(f)),
    limit: FOODS.filter((f) => f.status === 'limit' && ok(f)),
    avoid: [...FOODS.filter((f) => f.status === 'avoid'), ...FOODS.filter((f) => f.status !== 'avoid' && !ok(f))],
  };

  // Тренировка сегодня
  const act = activePains(pains, today);
  const avoid = new Set();
  const reasons = [];
  let level = 'normal';
  for (const p of act) {
    const rule = AREA_RULES[p.area];
    const red = (p.flags || []).length > 0 || p.level >= 7;
    if (p.area === 'head' || (p.flags || []).includes('headhit')) level = 'stop';
    else if (red && level !== 'stop') level = 'doctor';
    else if (p.level >= 4 && level === 'normal') level = 'light';
    rule?.avoid.forEach((x) => avoid.add(x));
    reasons.push({ area: p.area, level: p.level, red });
  }
  if (sm.acwr != null && sm.acwr > 1.5 && level === 'normal') { level = 'light'; reasons.push({ load: sm.acwr }); }
  const last2 = [...trainings].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 2);
  if (last2.length === 2 && last2.every((s) => s.rpe >= 9) && level === 'normal') { level = 'light'; reasons.push({ hard: true }); }
  if (last2[0]?.mood && last2[0].mood <= 2 && level === 'normal') { level = 'light'; reasons.push({ mood: last2[0].mood }); }
  if (sm.sessions >= 7 && level === 'normal') { level = 'rest'; reasons.push({ streak: sm.sessions }); }
  // Указание тренера сильнее расчёта
  if (directive?.kind === 'doctor' && !['stop'].includes(level)) { level = 'doctor'; reasons.push({ coach: 'doctor' }); }
  if (directive?.kind === 'light' && level === 'normal') { level = 'light'; reasons.push({ coach: 'light' }); }

  return { age, minor, w, height, kcal: kcal && Math.round(kcal / 10) * 10, protein, fat, carbs, water, waterPlan, waterDont, meals, foods, alerts, level, avoid: [...avoid], reasons, act, sm, todayTrained, trainHour, avgMin: Math.round(avgMin), needsData: !height };
}

export const exName = (id, lang) => pick(EX[id], lang);
export const areaAlt = (id, lang) => pick(AREA_RULES[id]?.alt, lang);

// ---------- Язык сообщения ----------
export function detectLang(text, fallback = 'ru') {
  const s = text.toLowerCase();
  if (/[äňöşüýž]/.test(s) || /\b(salam|näme|name|nähili|nahili|bolýar|bolyar|bolarmy|bolýarmy|men|maňa|mana|meniň|nädip|haçan|hacan|agyrýar|agyryar|iýmek|iymek|içmek|suw|türgenleş|turgenles|gowy|ýok|yok|sag bol|näçe)\b/.test(s)) return 'tk';
  if (/[а-яё]/.test(s)) return 'ru';
  if (/[a-z]/.test(s) && /\b(what|how|can|i|my|eat|drink|water|pain|hurt|train|sleep|hello|hi)\b/.test(s)) return 'en';
  return fallback;
}

const has = (s, words) => words.some((w) => s.includes(w));
const INT = {
  greet: ['привет', 'здравств', 'салам', 'salam', 'hello', 'hi ', 'hey', 'дост', 'dost'],
  thanks: ['спасиб', 'благодар', 'sag bol', 'sagbol', 'minnetdar', 'thank'],
  pain: ['болит', 'боль ', 'боли ', 'болью', 'болел', 'болят', 'болезн', 'травм', 'ушиб', 'растян', 'потян', 'хруст', 'agyrý', 'agyry', 'agyrd', 'agyryar', 'şikes', 'sikes', 'pain', 'hurt', 'injur', 'sore'],
  water: ['вод', 'пить', 'попить', 'жажд', 'обезвож', 'suw', 'içmek', 'icmek', 'içsem', 'içip', 'water', 'drink', 'thirst', 'hydrat'],
  can: ['можно', 'нельзя', 'стоит ли', 'вредно', 'полезно', 'bolýarmy', 'bolyarmy', 'bolarmy', 'iýip bol', 'zyýan', 'peýdaly', 'can i', 'is it ok', 'should i eat', 'healthy'],
  food: ['есть', 'съесть', 'кушать', 'еда', 'еду', 'питан', 'завтрак', 'обед', 'ужин', 'перекус', 'рацион', 'калори', 'белок', 'iýmek', 'iymek', 'nahar', 'iýmit', 'ertirlik', 'agşamlyk', 'kaloriý', 'belok', 'eat', 'food', 'meal', 'diet', 'breakfast', 'dinner', 'lunch', 'protein', 'calor'],
  weight: ['вес', 'сгон', 'сброс', 'похуд', 'категори', 'весовк', 'agram', 'peselt', 'horla', 'kategoriý', 'weight', 'cut', 'lose'],
  train: ['трениров', 'заниматьс', 'упражн', 'нагрузк', 'что делать', 'türgenleş', 'turgenles', 'maşk', 'mashk', 'ýükleme', 'train', 'workout', 'exercise', 'what should i do'],
  sleep: ['сон', 'спать', 'выспа', 'бессон', 'ukı', 'uky', 'ýatmak', 'ýatyp', 'sleep', 'tired at night'],
  comp: ['соревн', 'турнир', 'бой', 'взвеш', 'ýaryş', 'yarys', 'bäsleş', 'çekiş', 'competition', 'tournament', 'weigh-in', 'match'],
  tired: ['устал', 'нет сил', 'вял', 'настроен', 'не хочу', 'ýadadym', 'yadadym', 'halsyz', 'güýjüm ýok', 'tired', 'exhausted', 'no energy', 'motivat'],
};

// Ответ встроенного помощника. Возвращает { lang, text, actions }
export function reply(text, ctx) {
  const lang = detectLang(text, ctx.lang);
  const L = (o) => pick(o, lang);
  const s = ' ' + text.toLowerCase().replace(/ё/g, 'е').replace(/[.,!?;:()«»"“”]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const P = ctx.plan;
  const name = (ctx.profile.name || '').split(' ')[0];
  const out = [];
  const actions = [];
  const area = AREAS.find((a) => has(s, a.kw));
  const food = FOODS.find((f) => has(s, f.syn));
  let kind = 'fallback';
  const num = (s.match(/\b(10|[0-9])\s*(\/\s*10|из 10|-?den 10|ball|балл)?\b/) || [])[1];

  if (has(s, INT.pain) && !(food && has(s, INT.can)) || (area && !food)) {
    kind = 'pain';
    const a = area || null;
    const lvl = num != null ? +num : null;
    const red = has(s, ['отек', 'отёк', 'опух', 'синяк', 'онем', 'покалыв', 'не могу настав', 'не могу двиг', 'щелкн', 'щёлкн', 'хрустн', 'ночью', 'в покое', 'удар', 'упал', 'тошн', 'кружит', 'çiş', 'gögerme', 'ysmaýar', 'gije', 'ýykyl', 'urgy', 'ýürek bulan', 'baş aýlan', 'swell', 'bruis', 'numb', 'tingl', 'can’t', "can't", 'at night', 'fell', 'dizzy', 'nause']);
    if (a?.id === 'head' || has(s, ['сотряс', 'удар голов', 'тошн', 'кружит', 'baş aýlan', 'ýürek bulan', 'concuss', 'dizzy'])) {
      out.push(L(T3('⚠️ Kellä urgy we baş aýlanma — bu çynlakaý. Türgenleşigi bes et we şu gün lukmana ýüz tut. Lukman rugsat berýänçä tutluşyk ýok.',
        '⚠️ Удар по голове, головокружение или тошнота — это серьёзно. Прекрати тренировку и сегодня же покажись врачу. Без разрешения врача — никаких схваток.',
        '⚠️ A head hit with dizziness or nausea is serious. Stop training and see a doctor today. No sparring until a doctor clears you.')));
    } else if (red || (lvl != null && lvl >= 7)) {
      out.push(L(T3(`⚠️ ${a ? pick(a.name, 'tk') + ': ' : ''}çiş, ysgynsyzlyk ýa-da güýçli agyry bar bolsa — türgenleşigi bes et, buz goý (15 minut, mata arkaly) we lukmana görün. Tälimçä hökman aýt.`,
        `⚠️ ${a ? pick(a.name, 'ru') + ': ' : ''}если есть отёк, онемение или сильная боль — останови тренировку, приложи холод (15 минут через ткань) и покажись врачу. Обязательно скажи тренеру.`,
        `⚠️ ${a ? pick(a.name, 'en') + ': ' : ''}with swelling, numbness or strong pain — stop training, ice it (15 minutes through a cloth) and see a doctor. Tell your coach.`)));
    } else if (a) {
      const rule = AREA_RULES[a.id];
      out.push(L(T3(`${pick(a.name, 'tk')} agyrýan bolsa, häzirlikçe şulary etme: ${rule.avoid.map((x) => exName(x, 'tk')).join(', ')}.`,
        `Если болит ${pick(a.name, 'ru').toLowerCase()}, пока не делай: ${rule.avoid.map((x) => exName(x, 'ru')).join(', ')}.`,
        `With ${pick(a.name, 'en').toLowerCase()} pain, skip for now: ${rule.avoid.map((x) => exName(x, 'en')).join(', ')}.`)));
      out.push(L(T3('Deregine: ', 'Вместо этого: ', 'Instead: ')) + areaAlt(a.id, lang));
      out.push(L(T3('Agyry 3 günden köp dowam etse ýa-da güýçlense — lukmana görün.', 'Если боль держится больше 3 дней или усиливается — к врачу.', 'If it lasts more than 3 days or gets worse — see a doctor.')));
    } else {
      out.push(L(T3('Haýsy ýeriň agyrýar? Aýt ýa-da agyry gündeligine belle — men türgenleşigi şoňa görä üýtgederin.', 'Что именно болит? Напиши или отметь на карте боли — я подстрою тренировки.', 'Where does it hurt? Tell me or mark it on the pain map — I’ll adjust your training.')));
    }
    actions.push({ id: 'pain', area: a?.id, level: lvl });
    out.push(L(T3('Men lukman däl — çynlakaý ýagdaýda hemişe lukmana ýüz tut.', 'Я не врач — в серьёзных случаях всегда обращайся к врачу.', 'I’m not a doctor — for anything serious, always see one.')));
  } else if (food && (has(s, INT.can) || has(s, INT.food) || s.trim().split(/\s+/).length <= 3)) {
    kind = 'food_check';
    const allergic = (food.all || []).filter((x) => (ctx.profile.health?.allergies || []).includes(x));
    if (allergic.length) {
      out.push(L(T3(`${pick(food.name, 'tk')} — saňa bolmaýar: anketada ${allergic.map((x) => pick(ALLERGENS.find((q) => q.id === x).name, 'tk')).join(', ')} görkezilen.`,
        `${pick(food.name, 'ru')} — тебе нельзя: в анкете указано «${allergic.map((x) => pick(ALLERGENS.find((q) => q.id === x).name, 'ru')).join(', ')}».`,
        `${pick(food.name, 'en')} — not for you: your profile lists ${allergic.map((x) => pick(ALLERGENS.find((q) => q.id === x).name, 'en')).join(', ')}.`)));
    } else if (food.status === 'eat') {
      out.push(L(T3(`✅ ${pick(food.name, 'tk')} — bolýar, gowy saýlaw.`, `✅ ${pick(food.name, 'ru')} — можно, хороший выбор.`, `✅ ${pick(food.name, 'en')} — yes, a good choice.`)));
      if (food.id === 'eggs' || food.g === 'protein') out.push(L(T3(`Belok gerek: günde ${P.protein} g töweregi.`, `Белка тебе нужно около ${P.protein} г в день.`, `You need about ${P.protein} g of protein a day.`)));
    } else if (food.status === 'limit') {
      out.push(L(T3(`🟡 ${pick(food.name, 'tk')} — seýrek we az.`, `🟡 ${pick(food.name, 'ru')} — изредка и немного.`, `🟡 ${pick(food.name, 'en')} — occasionally and in small amounts.`)) + ' ' + L(food.why));
    } else {
      out.push(L(T3(`⛔ ${pick(food.name, 'tk')} — gerek däl.`, `⛔ ${pick(food.name, 'ru')} — не надо.`, `⛔ ${pick(food.name, 'en')} — skip it.`)) + ' ' + L(food.why));
      if (food.id === 'energy' && P.minor) out.push(L(T3('Sen 18 ýaşa ýetmedik — energetik düýbünden bolmaýar.', 'Тебе нет 18 — энергетики нельзя совсем.', 'You are under 18 — no energy drinks at all.')));
    }
  } else if (has(s, INT.water)) {
    kind = 'water';
    out.push(L(T3(`Saňa günde takmynan ${(P.water / 1000).toFixed(1)} litr suw gerek (agramyňa we türgenleşige görä).`, `Тебе нужно около ${(P.water / 1000).toFixed(1)} л воды в день — по весу и тренировкам.`, `You need about ${(P.water / 1000).toFixed(1)} L of water a day, based on your weight and training.`)));
    out.push(P.waterPlan.slice(0, 6).map((x) => `• ${x.at} — ${x.ml} ${L(T3('ml', 'мл', 'ml'))}: ${L(x.note)}`).join('\n'));
    out.push(L(T3('Içme: ', 'Когда не пить много: ', 'When not to: ')) + P.waterDont.slice(0, 2).map(L).join(' '));
    out.push(L(T3('Peşewiň açyk sary bolsa — suw ýeterlik.', 'Если моча светло-жёлтая — воды хватает.', 'Pale yellow urine means you’re drinking enough.')));
    actions.push({ id: 'today' });
  } else if (has(s, INT.weight)) {
    kind = 'weight';
    if (P.alerts.length) out.push(...P.alerts.map((a) => L(a.text)));
    else out.push(L(T3(`Häzirki agramyň ${P.w} kg. Agram peseltmek gerek bolsa, «Meniň maglumatlarym» bölüminde maksat kategoriýany görkez — men howpsuz meýilnama düzerin.`,
      `Твой вес сейчас ${P.w} кг. Если нужно попасть в категорию — укажи её в «Мои данные», я составлю безопасный план.`,
      `You weigh ${P.w} kg now. If you need to make a class, set it in “My data” and I’ll plan it safely.`)));
    out.push(L(T3('Hiç haçan: sauna bilen suwsuzlandyrmak, suwdan ýüz öwürmek, suw çykaryjy we ýag ýakyjy dermanlar. Bu ýürege we böwreklere howply.',
      'Никогда: сгонка сауной, отказ от воды, мочегонные и жиросжигатели. Это опасно для сердца и почек.',
      'Never: sauna dehydration, cutting water, diuretics or fat burners. They are dangerous for the heart and kidneys.')));
  } else if (has(s, INT.food)) {
    kind = 'food';
    if (P.kcal) out.push(L(T3(`Seniň günlük zerurlygyň: ~${P.kcal} kkal, belok ${P.protein} g, uglewod ${P.carbs} g, ýag ${P.fat} g.`, `Твоя норма в день: ~${P.kcal} ккал, белок ${P.protein} г, углеводы ${P.carbs} г, жиры ${P.fat} г.`, `Your daily needs: ~${P.kcal} kcal, protein ${P.protein} g, carbs ${P.carbs} g, fat ${P.fat} g.`)));
    out.push(P.meals.map((m) => `• ${m.at} ${L(m.name)}: ${m.what.map((id) => L(foodById(id).name)).join(', ')}`).join('\n'));
    out.push(L(T3('Az iý: palaw, gowrulan we süýji. Iýme: energetik, gazly suw, çipsy.', 'Меньше: плов, жареное, сладкое. Не надо: энергетики, газировка, чипсы.', 'Less: plov, fried food, sweets. Skip: energy drinks, soda, crisps.')));
    if (P.minor) out.push(L(T3('Sen ösýärsiň — nahardan ýüz öwürme we diýeta oturma.', 'Ты растёшь — не пропускай еду и не садись на диеты.', 'You’re growing — don’t skip meals or diet.')));
    actions.push({ id: 'today' });
  } else if (has(s, INT.comp)) {
    kind = 'comp';
    out.push(L(T3('Ýaryşdan öňki gün: adaty nahar, köp suw, palaw we gowrulan ýok, 8–9 sagat uky. Ýaryş güni: çekişden soň ýeňil nahar (banan, çörek bal bilen), tutluşyklaryň arasynda az-azdan suw.',
      'Накануне: обычная еда, достаточно воды, без плова и жареного, сон 8–9 часов. В день турнира: после взвешивания лёгкая еда (банан, хлеб с мёдом), между схватками — вода маленькими глотками.',
      'Day before: normal meals, plenty of water, no plov or fried food, 8–9 hours of sleep. On the day: a light meal after weigh-in (banana, bread with honey), small sips of water between bouts.')));
  } else if (has(s, INT.sleep)) {
    kind = 'sleep';
    out.push(L(T3(`Uky — iň gowy dikelme. ${P.minor ? '9–10' : '8–9'} sagat. Ýatmazdan 1 sagat öň telefony goý, agşam köp suw içme we agyr nahar iýme.`,
      `Сон — лучшее восстановление: ${P.minor ? '9–10' : '8–9'} часов. За час до сна убери телефон, вечером не пей много и не ешь тяжёлое.`,
      `Sleep is the best recovery: ${P.minor ? '9–10' : '8–9'} hours. Put the phone away an hour before bed, don’t drink a lot or eat heavy food late.`)));
  } else if (has(s, INT.tired)) {
    kind = 'tired';
    out.push(L(T3('Ýadawlyk — bedeniň dynç almak isleýändigi. Şu gün ýeňil türgenleşik ýa-da dynç, 9 sagat uky, köpräk suw we adaty nahar. 3 günden köp dowam etse — tälimçä aýt.',
      'Усталость — сигнал, что телу нужен отдых. Сегодня лёгкая тренировка или выходной, сон 9 часов, больше воды и нормальная еда. Если так больше 3 дней — скажи тренеру.',
      'Tiredness means your body wants rest. Light session or a day off, 9 hours of sleep, more water and proper meals. If it lasts more than 3 days, tell your coach.')));
    out.push(L(T3(`${name}, çempionlar hem ýadaýar — esasy zat yzygiderlilik. Sen başarýarsyň! 💪`, `${name}, чемпионы тоже устают — главное постоянство. Ты справишься! 💪`, `${name}, champions get tired too — consistency is what counts. You’ve got this! 💪`)));
  } else if (has(s, INT.train)) {
    kind = 'train';
    out.push(trainingText(P, lang));
    actions.push({ id: 'today' });
  } else if (has(s, INT.thanks)) {
    kind = 'thanks';
    out.push(L(T3('Hemişe taýyn! Başga sorag bar bolsa ýaz. 🤝', 'Всегда пожалуйста! Пиши, если что-то ещё. 🤝', 'Any time! Write if anything else comes up. 🤝')));
  } else if (has(s, INT.greet)) {
    kind = 'greet';
    out.push(L(T3(`Salam, ${name}! Men Champ AI — seniň sport kömekçiň. Suw, nahar, türgenleşik ýa-da agyry barada sora.`, `Привет, ${name}! Я Champ AI — твой спортивный помощник. Спрашивай про воду, еду, тренировки или боль.`, `Hi ${name}! I’m Champ AI, your sports buddy. Ask me about water, food, training or pain.`)));
  } else {
    out.push(L(T3('Men muny düşünmedim. Men kömek edip bilýän zatlar: suw, nahar we «muny iýip bolýarmy», türgenleşik, agyry, agram, uky, ýaryşa taýýarlyk.',
      'Я не совсем понял. Я помогаю с: водой, едой и «можно ли это есть», тренировками, болью, весом, сном и подготовкой к турниру.',
      'I didn’t quite get that. I can help with water, food and “can I eat this”, training, pain, weight, sleep and competition prep.')));
  }
  return { lang, text: out.join('\n\n'), actions, kind, food: food?.id, area: area?.id };
}

export function trainingText(P, lang) {
  const L = (o) => pick(o, lang);
  const head = {
    normal: T3('✅ Şu gün adaty türgenleşik bolýar.', '✅ Сегодня можно тренироваться в обычном режиме.', '✅ Normal training is fine today.'),
    light: T3('🟡 Şu gün ýeňil türgenleşik: tehnika, süýndürmek, doly güýçli tutluşyk ýok.', '🟡 Сегодня лёгкая тренировка: техника, растяжка, без схваток в полную силу.', '🟡 Light session today: technique, stretching, no full-power sparring.'),
    rest: T3('🔵 Şu gün dynç güni — 7 günde dynçsyz türgenleşdiň.', '🔵 Сегодня день отдыха — ты тренировался 7 дней подряд.', '🔵 Rest day today — you trained 7 days in a row.'),
    doctor: T3('⚠️ Türgenleşmezden öň lukmana görün — gündelikde howply alamatlar bar.', '⚠️ Перед тренировкой покажись врачу — в дневнике боли есть тревожные признаки.', '⚠️ See a doctor before training — your pain log shows warning signs.'),
    stop: T3('⛔ Lukman rugsat berýänçä türgenleşik ýok (kellä urgy).', '⛔ До разрешения врача — никаких тренировок (удар головой).', '⛔ No training until a doctor clears you (head injury).'),
  }[P.level];
  const lines = [L(head)];
  P.reasons.forEach((r) => {
    if (r.area) lines.push('• ' + L(T3(`${pick(areaById(r.area).name, 'tk')}: agyry ${r.level}/10`, `${pick(areaById(r.area).name, 'ru')}: боль ${r.level}/10`, `${pick(areaById(r.area).name, 'en')}: pain ${r.level}/10`)));
    if (r.load) lines.push('• ' + L(T3(`Ýükleme birden ýokarlandy (${r.load.toFixed(1)} esse)`, `Нагрузка резко выросла (в ${r.load.toFixed(1)} раза)`, `Load jumped (${r.load.toFixed(1)}×)`)));
    if (r.hard) lines.push('• ' + L(T3('Soňky iki türgenleşik gaty agyr boldy', 'Две последние тренировки были на пределе', 'Your last two sessions were maximal')));
    if (r.mood) lines.push('• ' + L(T3('Soňky gezek özüňi erbet duýduň', 'В прошлый раз самочувствие было плохим', 'You felt bad after the last session')));
    if (r.coach) lines.push('• ' + L(r.coach === 'doctor' ? T3('Tälimçi: lukmana görün', 'Тренер: покажись врачу', 'Coach: see a doctor') : T3('Tälimçi: şu gün ýeňil türgenleş', 'Тренер: сегодня облегчённая тренировка', 'Coach: go light today')));
  });
  if (P.avoid.length) lines.push(L(T3('Etme: ', 'Не делай: ', 'Skip: ')) + P.avoid.map((x) => exName(x, lang)).join(', '));
  if (P.act.length) lines.push(L(T3('Deregine: ', 'Вместо этого: ', 'Instead: ')) + [...new Set(P.act.map((p) => areaAlt(p.area, lang)))].join(' '));
  return lines.join('\n');
}

// ---------- Готовность к тренировке (0–100) ----------
// Складывается из болей, скачка нагрузки, самочувствия и количества тренировок подряд.
export function readiness(P, trainings = []) {
  let r = 100;
  const why = [];
  for (const p of P.act) {
    if (p.area === 'head' || (p.flags || []).includes('headhit')) { r = Math.min(r, 5); why.push({ k: 'pain', area: p.area, level: p.level }); continue; }
    const d = (p.flags || []).length ? 40 : p.level * 6;
    r -= d; why.push({ k: 'pain', area: p.area, level: p.level });
  }
  const ac = P.sm.acwr;
  if (ac != null && ac > 1.5) { r -= 20; why.push({ k: 'load', v: ac }); } else if (ac != null && ac > 1.3) { r -= 10; why.push({ k: 'load', v: ac }); }
  const last = [...trainings].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (last?.mood) { const m = { 5: 0, 4: -3, 3: -10, 2: -20, 1: -30 }[last.mood] || 0; if (m) { r += m; why.push({ k: 'mood', v: last.mood }); } }
  if (P.sm.rpe != null && P.sm.rpe > 8) { r -= 10; why.push({ k: 'rpe', v: P.sm.rpe }); }
  if (P.sm.sessions >= 7) { r -= 15; why.push({ k: 'streak', v: P.sm.sessions }); }
  if (P.level === 'doctor') r = Math.min(r, 35);
  if (P.level === 'stop') r = Math.min(r, 10);
  r = Math.max(5, Math.min(100, Math.round(r)));
  return { score: r, zone: r >= 75 ? 'go' : r >= 50 ? 'care' : 'rest', why };
}

export const FOOD_EMOJI = {
  chicken: '🍗', beef: '🥩', fish: '🐟', eggs: '🥚', gatyk: '🥛', suzme: '🧀', milk: '🥛', mash: '🫘', buckwheat: '🌾', rice: '🍚', oats: '🥣',
  bread: '🍞', pasta: '🍝', potato: '🥔', veg: '🥗', melon: '🍈', fruit: '🍎', dried: '🍇', nuts: '🥜', honey: '🍯', chorba: '🍲',
  tea: '🍵', manty: '🥟', palaw: '🍛', dograma: '🥘', fried: '🥟', sweets: '🍰', sausage: '🌭', fastfood: '🍔', soda: '🥤', energy: '⚡', chips: '🍟', burners: '💊',
};
