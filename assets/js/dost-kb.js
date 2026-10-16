// База знаний Champ AI: темы с примерами вопросов на туркменском, русском и английском.
// Поиск нечёткий: нормализация букв, обрезка окончаний, допуск одной опечатки в слове, вес редких слов.
// Ответы персональные — берут вес, возраст, план и боли из анкеты.
import { pick, reply as baseReply, detectLang, trainingText, foodById } from './assistant.js';

const T3 = (tk, ru, en) => ({ tk, ru, en });

// ---------- Нормализация и сравнение ----------
const FOLD = { ä: 'a', ň: 'n', ö: 'o', ş: 's', ü: 'u', ý: 'y', ž: 'z', ç: 'c', ё: 'е', й: 'и' };
const STOP = new Set(['и', 'в', 'во', 'на', 'а', 'я', 'мне', 'меня', 'ли', 'ну', 'же', 'бы', 'то', 'это', 'у', 'с', 'со', 'к', 'по', 'за', 'для', 'мой', 'моя', 'мои', 'ты', 'вы', 'он', 'она', 'не', 'нет', 'да', 'или', 'как', 'что', 'когда', 'сколько', 'надо', 'нужно', 'можно', 'очень', 'просто', 'вот', 'так', 'ещё', 'еще',
  'men', 'sen', 'we', 'bilen', 'ucin', 'name', 'nadip', 'nahili', 'haсan', 'bu', 'su', 'hem', 'bar', 'yok', 'gerek', 'bolya', 'mi', 'my', 'mu',
  'the', 'a', 'an', 'i', 'my', 'is', 'to', 'and', 'or', 'do', 'what', 'how', 'when', 'should', 'can', 'me', 'it', 'of', 'in', 'for', 'about']);
export function norm(s) { return s.toLowerCase().replace(/[äňöşüýžçёй]/g, (c) => FOLD[c]).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim(); }
const stem = (w) => (w.length > 5 ? w.slice(0, 5) : w);
export const toks = (s) => norm(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
function lev1(a, b) { // расстояние Левенштейна ≤ 1?
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++e > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return e + (a.length - i) + (b.length - j) <= 1;
}

// ---------- Темы ----------
const W = (P) => P.w;
export const KB = [
  { id: 'warmup', q: ['как правильно разминаться', 'разминка перед тренировкой', 'сколько разминаться', 'gyzdyrma nähili etmeli', 'türgenleşikden öň gyzdyrma', 'how to warm up'],
    a: (P) => T3('Gyzdyrma 10–15 minut: 3–4 minut ýeňil ylgaw, soňra bogunlary aýlamak (boýun, egin, bil, dyz, topuk), soňra dinamiki maşklar — aýaklary silkmek, ýeňil oturyp-turmak, durşda hereket. Boýny ýuwaşlyk bilen gyzdyr — göreşde iň köp ýük şoňa düşýär.',
      'Разминка 10–15 минут: 3–4 минуты лёгкого бега, потом вращения в суставах (шея, плечи, поясница, колени, голеностопы), потом динамика — махи ногами, лёгкие приседания, передвижения в стойке. Шею разминай особенно аккуратно — в борьбе на неё самая большая нагрузка.',
      'Warm up 10–15 minutes: 3–4 minutes of easy jogging, joint circles (neck, shoulders, back, knees, ankles), then dynamic moves — leg swings, light squats, stance movement. Warm up the neck gently — it takes the most load in wrestling.') },
  { id: 'stretch', q: ['растяжка после тренировки', 'как тянуться', 'нужна ли растяжка', 'süýndürmek gerekmi', 'türgenleşikden soň süýndürmek', 'stretching after training'],
    a: () => T3('Türgenleşikden soň 10 minut süýndürmek: but, aýak arkasy, bil, egin. Her maşk 20–30 sekunt, agyrýança däl — diňe ýakymly dartylma. Gyzmadyk myşsany süýndürme.', 'После тренировки 10 минут растяжки: бёдра, задняя поверхность ног, спина, плечи. Каждое упражнение 20–30 секунд, без боли — только приятное натяжение. Холодные мышцы не растягивай.', 'After training, 10 minutes of stretching: hips, hamstrings, back, shoulders. Hold each 20–30 seconds, no pain — just a pleasant pull. Don’t stretch cold muscles.') },
  { id: 'soreness', q: ['болят мышцы после тренировки', 'крепатура', 'мышцы забиты', 'все тело болит после тренировки', 'myşsalarym agyrýar', 'türgenleşikden soň bedenim agyrýar', 'sore muscles after training'],
    a: () => T3('Türgenleşikden 1–2 gün soň myşsalaryň agyrmagy kadaly ýagdaý. Ýeňil hereket et (ýöremek, ýeňil ylgaw), köpräk suw iç, 8–9 sagat ukla, belokly iý. Bogun agyrsa ýa-da 4 günden köp dowam etse — bu başga zat, tälimçä aýt.', 'Если мышцы болят 1–2 дня после тренировки — это нормально (крепатура). Помогает лёгкое движение (ходьба, лёгкий бег), вода, сон 8–9 часов и белок. Если болит сустав или держится больше 4 дней — это уже не крепатура, скажи тренеру.', 'Muscle soreness for 1–2 days after training is normal. Light movement, water, 8–9 hours of sleep and protein help. If a joint hurts or it lasts more than 4 days, that’s different — tell your coach.') },
  { id: 'cramp', q: ['судорога', 'свело ногу', 'сводит мышцы', 'tutgaý tutdy', 'aýagymy tutgaý tutdy', 'cramp'],
    a: () => T3('Tutgaý bolanda myşsany ýuwaşlyk bilen süýndür we owkala. Köplenç suw we duz ýetmezçiliginden bolýar — türgenleşikden öň we wagtynda suw iç, gawun, banan, kartoşka iý. Ýygy-ýygydan gaýtalansa — lukmana.', 'При судороге медленно растяни мышцу и помассируй. Чаще всего это от нехватки воды и солей — пей до и во время тренировки, ешь бананы, дыню, картофель. Если повторяется часто — к врачу.', 'For a cramp, slowly stretch the muscle and massage it. It’s often from too little water and salts — drink before and during training, eat bananas, melon, potatoes. If it keeps happening, see a doctor.') },
  { id: 'heat', q: ['жара тренировка', 'жарко как пить', 'тренировка в жару', 'ýssy howada näçe suw', 'ýssyda türgenleşik', 'training in the heat'],
    a: (P) => T3(`Yssyda suw zerurlygy 1,5 esse artýar: saňa şu gün ${(P.water * 1.3 / 1000).toFixed(1)} litre çenli. Türgenleşikde her 15 minutda 150–200 ml iç, kölegede dynç al. Baş aýlansa, ýürek bulansa — derrew sowuk ýere geç we tälimçä aýt.`, `В жару потребность в воде растёт: сегодня тебе до ${(P.water * 1.3 / 1000).toFixed(1)} л. На тренировке пей по 150–200 мл каждые 15 минут, отдыхай в тени. Если кружится голова или тошнит — сразу в прохладу и скажи тренеру.`, `In the heat you need more water: up to ${(P.water * 1.3 / 1000).toFixed(1)} L today. Drink 150–200 ml every 15 minutes in training and rest in the shade. If you feel dizzy or sick, get somewhere cool and tell your coach.`) },
  { id: 'eat_before', q: ['что есть перед тренировкой', 'за сколько до тренировки есть', 'можно ли есть перед тренировкой', 'türgenleşikden öň näme iýmeli', 'what to eat before training'],
    a: (P) => T3(`Türgenleşikden 2–3 sagat öň adaty nahar (tüwi ýa-da grečka + towuk), 1–1,5 sagat öň ýeňil zat: banan, çörek bal bilen, alma. Ýagly we gowrulan zat ýok — palaw türgenleşikden öň bolmaýar. Seniň türgenleşigiň ${P.trainHour}:00-da.`, `За 2–3 часа до тренировки — нормальная еда (рис или гречка + курица), за 1–1,5 часа — лёгкий перекус: банан, хлеб с мёдом, яблоко. Ничего жирного и жареного — плов перед тренировкой нельзя. Твоя тренировка в ${P.trainHour}:00.`, `2–3 hours before training, a proper meal (rice or buckwheat + chicken); 1–1.5 hours before, a light snack: banana, bread with honey, an apple. Nothing fatty or fried. Your training is at ${P.trainHour}:00.`) },
  { id: 'eat_after', q: ['что есть после тренировки', 'после тренировки еда', 'türgenleşikden soň näme iýmeli', 'what to eat after training'],
    a: (P) => T3(`Türgenleşikden soň 1 sagadyň içinde belok + uglewod: süzme miwe bilen, towuk tüwi bilen, ýumurtga çörek bilen. Belok günde ${P.protein} g töweregi gerek.`, `В течение часа после тренировки — белок + углеводы: творог с фруктами, курица с рисом, яйца с хлебом. Белка тебе нужно около ${P.protein} г в день.`, `Within an hour after training: protein + carbs — cottage cheese with fruit, chicken with rice, eggs with bread. You need about ${P.protein} g of protein a day.`) },
  { id: 'breakfast', q: ['что съесть на завтрак', 'завтрак спортсмена', 'ertirlik näme iýmeli', 'what to eat for breakfast'],
    a: () => T3('Ertirlik üçin: süle bulamaç miwe we bal bilen, 2–3 ýumurtga, gatyk. Ertirligi taşlama — güýç şondan gelýär.', 'На завтрак: овсянка с фруктами и мёдом, 2–3 яйца, катык. Завтрак не пропускай — это энергия на весь день.', 'For breakfast: oatmeal with fruit and honey, 2–3 eggs, gatyk. Don’t skip breakfast — it’s your energy for the day.') },
  { id: 'snack', q: ['чем перекусить', 'перекус', 'хочу есть между едой', 'arakesmede näme iýmeli', 'arada näme iýip bilerin', 'healthy snack'],
    a: () => T3('Peýdaly arakesme: banan, alma, bir owuç hoz ýa-da kişmiş, gatyk, çörek bal bilen. Çipsy we süýji gazly suw ýok.', 'Полезный перекус: банан, яблоко, горсть орехов или изюма, катык, хлеб с мёдом. Без чипсов и газировки.', 'Good snacks: banana, apple, a handful of nuts or raisins, gatyk, bread with honey. No crisps or soda.') },
  { id: 'protein', q: ['сколько белка нужно', 'где взять белок', 'протеин', 'нужен ли протеин', 'belok näçe gerek', 'protein içmeli mi', 'how much protein'],
    a: (P) => T3(`Saňa günde ${P.protein} g belok gerek. Iň gowy çeşmeler: towuk, sygyr eti, balyk, ýumurtga, süzme, gatyk, mäş. ${P.minor ? 'Protein poroşogy 18 ýaşa çenli gerek däl — adaty iýmit ýeterlik.' : 'Protein poroşogy diňe adaty iýmit ýetmese, tälimçi bilen maslahatlaşyp.'}`, `Тебе нужно ${P.protein} г белка в день. Лучшие источники: курица, говядина, рыба, яйца, творог, катык, маш. ${P.minor ? 'Протеиновые порошки до 18 лет не нужны — обычной еды достаточно.' : 'Протеин — только если не хватает обычной еды, и после разговора с тренером.'}`, `You need ${P.protein} g of protein a day. Best sources: chicken, beef, fish, eggs, cottage cheese, gatyk, mung beans. ${P.minor ? 'No protein powders under 18 — normal food is enough.' : 'Powder only if food isn’t enough, after talking to your coach.'}`) },
  { id: 'supplements', q: ['витамины пить', 'добавки', 'креатин', 'спортпит можно', 'witamin içmeli mi', 'kreatin bolýarmy', 'supplements vitamins creatine'],
    a: (P) => T3(`${P.minor ? '18 ýaşa çenli goşundylar (kreatin, ýag ýakyjylar, energetikler) gerek däl.' : 'Goşundylar diňe lukman ýa-da tälimçi bilen.'} Witaminleri lukman barlagdan soň belleýär. Iň gowy «witamin» — dürli iýmit, gök önümler we miweler.`, `${P.minor ? 'До 18 лет добавки (креатин, жиросжигатели, энергетики) не нужны.' : 'Добавки — только с врачом или тренером.'} Витамины назначает врач после анализов. Лучший «витамин» — разнообразная еда, овощи и фрукты.`, `${P.minor ? 'No supplements under 18 (creatine, fat burners, energy drinks).' : 'Supplements only with a doctor or coach.'} A doctor prescribes vitamins after tests. The best “vitamin” is varied food, vegetables and fruit.`) },
  { id: 'weighin', q: ['взвешивание завтра', 'как пройти взвешивание', 'перед взвешиванием', 'после взвешивания что есть', 'agram çekişine nähili taýýarlanmaly', 'çekişden soň näme iýmeli', 'weigh in tomorrow'],
    a: (P) => T3(`Çekişden öňki gün: adaty, ýeňil nahar, duzy azalt, suwy taşlama. ${P.minor ? 'Agram peseltmek üçin aç galma we suwsuz galma — bu howply.' : 'Agramy iň köp 1–2% çenli düzetmek bolar, sauna we dermansyz.'} Çekişden soň: suw, banan, çörek bal bilen, soňra adaty nahar.`, `Накануне взвешивания: обычная лёгкая еда, меньше соли, воду не ограничивай. ${P.minor ? 'Не голодай и не отказывайся от воды ради веса — это опасно.' : 'Подогнать вес можно максимум на 1–2%, без сауны и таблеток.'} После взвешивания: вода, банан, хлеб с мёдом, потом нормальная еда.`, `The day before weigh-in: normal light meals, less salt, don’t restrict water. ${P.minor ? 'Don’t starve or cut water for weight — it’s dangerous.' : 'Adjust weight by 1–2% at most, no sauna or pills.'} After weigh-in: water, banana, bread with honey, then a normal meal.`) },
  { id: 'nerves', q: ['волнуюсь перед турниром', 'страшно выходить на схватку', 'нервы перед боем', 'как не бояться', 'ýaryşdan öň gorkýaryn', 'tolgunýaryn', 'nervous before competition'],
    a: (P) => T3(`Tolgunmak kadaly — bu bedeniň taýýarlanýandygy. Kömek edýär: çuň dem al (4 sekunt dem al, 4 sekunt sakla, 6 sekunt goýber), gyzdyrmany adaty ýaly et, diňe birinji hereketiňi göz öňüne getir. Sen türgenleşdiň — indi diňe görkez. 💪`, `Волнение — это нормально, так тело готовится. Помогает: глубокое дыхание (вдох 4 секунды, пауза 4, выдох 6), обычная разминка, думай только о первом действии в схватке. Ты готовился — теперь просто покажи. 💪`, `Nerves are normal — your body is getting ready. Try deep breathing (in for 4, hold 4, out for 6), your usual warm-up, and focus only on your first move. You’ve trained — now just show it. 💪`) },
  { id: 'lost', q: ['проиграл', 'проиграл вчера', 'проиграл схватку', 'проиграл турнир', 'не получилось на соревнованиях', 'утешиться после поражения', 'tutluşykda ýeňildim', 'utuldym', 'lost my match'],
    a: (P) => T3(`Ýeňliş — çempionlaryň hemmesiniň ýolunda bar. Şu gün dynç al, ertir tälimçiň bilen wideony gör: 1 gowy zat we 1 düzetmeli zat tap. Çempion bolýanlar — düşege gaýdyp gelýänler.`, `Поражения есть на пути каждого чемпиона. Сегодня отдохни, завтра разбери с тренером: найди одну вещь, которая получилась, и одну, которую исправить. Чемпионами становятся те, кто возвращается на ковёр.`, `Every champion has lost. Rest today, then review with your coach: find one thing that worked and one to fix. Champions are the ones who come back to the mat.`) },
  { id: 'motivation', q: ['нет мотивации', 'не хочу тренироваться', 'лень', 'надоело', 'isleg ýok', 'türgenleşesim gelenok', 'no motivation'],
    a: (P) => T3(`Her gün isleg bolmaýar — esasy zat endik. Kiçijik maksat goý: «şu gün diňe gyzdyrma we tehnika». Gündeligiňe seret — ${P.sm.sessions} türgenleşik soňky 7 günde. Ýadawlyk köp bolsa — dynç güni al.`, `Мотивации не бывает каждый день — держит привычка. Поставь маленькую цель: «сегодня только разминка и техника». Ты уже провёл ${P.sm.sessions} тренировок за 7 дней — это результат. Если усталость копится — возьми день отдыха.`, `Motivation isn’t there every day — habit carries you. Set a small goal: “today just warm-up and technique”. You’ve done ${P.sm.sessions} sessions in 7 days. If fatigue builds up, take a rest day.`) },
  { id: 'school', q: ['учеба и тренировки', 'не успеваю учиться', 'школа и спорт', 'mekdep we türgenleşik', 'okuw we sport', 'school and training'],
    a: () => T3('Gün tertibi kömek edýär: sapakdan soň 30 minut dynç we nahar, soňra türgenleşik, agşam öý işi we 22:30-a çenli uky. Ýaryş öňünden mugallymlara öňünden aýt.', 'Помогает режим: после уроков 30 минут отдыха и еда, потом тренировка, вечером домашка и сон до 22:30. Перед турниром заранее предупреди учителей.', 'A routine helps: 30 minutes of rest and food after school, then training, homework in the evening and bed by 22:30. Warn teachers ahead of tournaments.') },
  { id: 'pullups', q: ['как больше подтягиваться', 'увеличить подтягивания', 'dartynmagy nädip köpeltmeli', 'köp dartynmak', 'more pull ups'],
    a: () => T3('Hepdede 2–3 gezek: 4–5 tapgyr iň köp mukdaryň 70%-i bilen, tapgyrlaryň arasynda 2 minut dynç. Ýuwaş aşak düşmek (3–4 sekunt) we asylyp durmak hem kömek edýär. Kamera bilen türgenleşikde tapgyrlaryňy yzarla.', '2–3 раза в неделю: 4–5 подходов по 70% от максимума, отдых 2 минуты. Помогают медленные опускания (3–4 секунды) и виси на турнике. Записывай подходы в тренировке с камерой — увидишь прогресс.', '2–3 times a week: 4–5 sets at 70% of your max, 2 minutes rest. Slow lowering (3–4 seconds) and dead hangs help too. Track sets with the camera workout to see progress.') },
  { id: 'strength', q: ['как стать сильнее', 'как набрать силу', 'упражнения на силу', 'güýçli bolmak üçin näme etmeli', 'güýji artdyrmak', 'how to get stronger'],
    a: (P) => T3(`Güýç üçin hepdede 2–3 gezek: dartynmak, itilmek, oturyp-turmak, köpri — 3–4 tapgyr. ${P.minor ? 'Öz agramyň bilen işle, ştanga diňe tälimçi bilen.' : 'Ştanga bilen — tälimçiniň meýilnamasy boýunça.'} Belok (${P.protein} g günde) we uky bolmasa güýç ösmeýär.`, `Для силы 2–3 раза в неделю: подтягивания, отжимания, приседания, мост — по 3–4 подхода. ${P.minor ? 'Работай с весом тела, штанга — только с тренером.' : 'Со штангой — по плану тренера.'} Без белка (${P.protein} г в день) и сна сила не растёт.`, `For strength, 2–3 times a week: pull-ups, push-ups, squats, bridges — 3–4 sets each. ${P.minor ? 'Use bodyweight; barbell only with a coach.' : 'Barbell work per your coach’s plan.'} Without protein (${P.protein} g a day) and sleep, strength won’t grow.`) },
  { id: 'neck', q: ['как укрепить шею', 'шея для борьбы', 'мост тренировать', 'boýny nädip güýçlendirmeli', 'köpri türgenleşik', 'neck strength bridge'],
    a: (P) => T3(`Boýny diňe tälimçiň gözegçiliginde güýçlendir: ýeňil izometrik maşklar (el bilen garşylyk), soňra köpri. Boýun agyrýan bolsa — köpri düýbünden bolmaýar.${P.act.some((x) => x.area === 'neck') ? ' Seniň gündeligiňde häzir boýun agyrysy bar — köpri etme.' : ''}`, `Шею укрепляй только под контролем тренера: лёгкая статика (сопротивление руками), потом мост. Если шея болит — мост нельзя совсем.${P.act.some((x) => x.area === 'neck') ? ' У тебя сейчас в дневнике боль в шее — мост не делай.' : ''}`, `Strengthen the neck only under your coach’s eye: light isometrics (hand resistance), then bridges. If the neck hurts, no bridges at all.${P.act.some((x) => x.area === 'neck') ? ' Your log shows neck pain right now — skip bridges.' : ''}`) },
  { id: 'cardio', q: ['как улучшить выносливость', 'задыхаюсь в схватке', 'не хватает дыхалки', 'çydamlylygy nädip artdyrmaly', 'demim ýetenok', 'improve endurance'],
    a: () => T3('Çydamlylyk üçin hepdede 2 gezek: 20–30 minut deň ylgaw we bir gezek interwal (30 sekunt çalt, 60 sekunt ýuwaş, 8–10 gezek). Göreş tapgyrlary hem «interwal» — türgenleşikde 2×3 minut tutluşyk.', 'Для выносливости 2 раза в неделю: 20–30 минут ровного бега и один раз интервалы (30 секунд быстро, 60 медленно, 8–10 раз). Схватки 2×3 минуты — тоже интервальная работа.', 'For endurance, twice a week: 20–30 minutes of steady running, plus one interval session (30 seconds fast, 60 slow, 8–10 times). 2×3-minute bouts are interval work too.') },
  { id: 'kids_weights', q: ['можно ли ребенку штангу', 'с какого возраста качаться', 'тяжести детям', 'çagalara agyr göterip bolýarmy', 'kids lifting weights'],
    a: (P) => T3(`${P.minor ? 'Ösýän bedene' : 'Ýetginjeklere'} öz agramy bilen maşklar iň gowusy: dartynmak, itilmek, oturyp-turmak, köpri. Ştanga — diňe tälimçiniň gözegçiliginde, ýeňil agram we dogry tehnika bilen.`, `${P.minor ? 'Растущему организму' : 'Подросткам'} лучше всего упражнения с весом тела: подтягивания, отжимания, приседания, мост. Штанга — только под контролем тренера, лёгкий вес и правильная техника.`, `${P.minor ? 'For a growing body' : 'For teens'}, bodyweight is best: pull-ups, push-ups, squats, bridges. Barbell only with a coach, light weight and good technique.`) },
  { id: 'sick', q: ['простудился', 'температура можно тренироваться', 'болею', 'насморк тренировка', 'syrkawladym', 'gyzzyrma bar türgenleşip bolýarmy', 'sowuklama', 'i have a cold fever'],
    a: () => T3('Gyzzyrma bar bolsa — türgenleşik ýok, dynç al we lukmana görün. Ýeňil sowuklamada (diňe burun, gyzzyrmasyz) ýeňil hereket bolýar, tutluşyk ýok — dostlaryňa ýokuşdyrma.', 'С температурой — никаких тренировок, отдых и врач. При лёгком насморке без температуры можно лёгкое движение, но без схваток — не заражай партнёров.', 'With a fever — no training, rest and see a doctor. With a mild cold and no fever, light movement is fine, but no sparring — don’t infect partners.') },
  { id: 'skin', q: ['сыпь', 'сыпь на руке', 'сыпь на коже', 'лишай', 'грибок', 'пятно на коже после ковра', 'derimde tegmil peýda boldy', 'skin rash ringworm'],
    a: () => T3('Göreşçilerde deri ýokançlyklary köp bolýar. Täze tegmil, gyjyndy ýa-da gyzarma bolsa — düşege çykma we lukmana görün. Türgenleşikden soň derrew suwa düş, formany her gezek ýuw.', 'У борцов кожные инфекции встречаются часто. Если появилось новое пятно, зуд или покраснение — не выходи на ковёр и покажись врачу. После тренировки сразу в душ, форму стирай каждый раз.', 'Skin infections are common in wrestling. A new patch, itch or redness — stay off the mat and see a doctor. Shower right after training and wash your kit every time.') },
  { id: 'ear', q: ['ухо опухло', 'болит ухо после схватки', 'gulagym çişdi', 'swollen ear'],
    a: () => T3('Gulak çişse — derrew sowuk goý we şu gün lukmana görün: wagtynda bejerilmese «döwülen gulak» bolup galýar. Indiki gezek gulak goragçysyny geý.', 'Если опухло ухо — сразу холод и сегодня же к врачу: без лечения оно может «сломаться» навсегда. Дальше тренируйся в наушниках-защите.', 'If your ear swells, ice it and see a doctor today — untreated, it can deform permanently. Wear ear guards from now on.') },
  { id: 'rest_day', q: ['что делать в день отдыха', 'выходной от тренировок', 'dynç güni näme etmeli', 'rest day'],
    a: () => T3('Dynç güni: ýöremek, ýeňil süýndürmek, adaty nahar, köp suw we gowy uky. Agyr maşk ýok — myşsalar dynç günlerinde ösýär.', 'В день отдыха: прогулка, лёгкая растяжка, нормальная еда, вода и хороший сон. Без тяжёлой нагрузки — мышцы растут как раз во время отдыха.', 'On a rest day: walk, light stretching, normal food, water and good sleep. No heavy work — muscles grow while you rest.') },
  { id: 'how_many', q: ['сколько раз в неделю тренироваться', 'тренироваться каждый день', 'hepdede näçe gezek türgenleşmeli', 'how many times a week'],
    a: (P) => T3(`${P.minor ? 'Ýetginjeklere hepdede 4–6 türgenleşik we azyndan 1 doly dynç güni.' : 'Hepdede 5–6 türgenleşik we 1 doly dynç güni.'} Soňky 7 günde sende ${P.sm.sessions} türgenleşik boldy.`, `${P.minor ? 'Подросткам — 4–6 тренировок в неделю и минимум 1 полный выходной.' : '5–6 тренировок в неделю и 1 полный выходной.'} У тебя за последние 7 дней — ${P.sm.sessions}.`, `${P.minor ? 'Teens: 4–6 sessions a week and at least one full rest day.' : '5–6 sessions a week and one full rest day.'} You’ve done ${P.sm.sessions} in the last 7 days.`) },
  { id: 'growth', q: ['как вырасти выше', 'влияет ли борьба на рост', 'boýum öserm', 'grow taller'],
    a: () => T3('Göreş boýa zyýan bermeýär. Boýa iň köp täsir edýän zatlar: uky (9–10 sagat), doly iýmit (belok, süýt önümleri, gök önümler) we hereket. Agram peseltmek üçin aç galmak ösüşe zyýan berýär.', 'Борьба рост не останавливает. На рост больше всего влияют сон (9–10 часов), полноценная еда (белок, молочное, овощи) и движение. А вот голодание ради веса росту вредит.', 'Wrestling doesn’t stunt growth. Sleep (9–10 hours), full meals (protein, dairy, vegetables) and activity matter most. Starving to make weight does harm growth.') },
  { id: 'weigh_when', q: ['когда взвешиваться', 'как правильно взвешиваться дома', 'agramy haçan ölçemeli', 'when to weigh myself'],
    a: (P) => T3(`Ertir oýananyňdan soň, hajathanadan soň, naharlanmazdan öň — hepdede 2–3 gezek. Gündelige ýaz, Champ AI üýtgeşmäni yzarlar. Häzir sen ${W(P)} kg.`, `Утром после сна и туалета, до еды — 2–3 раза в неделю. Записывай в дневник, Champ AI будет следить за изменениями. Сейчас у тебя ${W(P)} кг.`, `In the morning after the toilet, before eating — 2–3 times a week. Log it in the diary and Champ AI tracks changes. You’re ${W(P)} kg now.`) },
  { id: 'injury_prevent', q: ['как не травмироваться', 'профилактика травм', 'şikesden nädip goranmaly', 'avoid injuries'],
    a: () => T3('Şikesiň öňüni almak: hemişe gyzdyrma, boýun we bil myşsalaryny güýçlendir, ýadaw wagtyň doly güýçli tutluşyk etme, agyry bolsa — tälimçä aýt we Champ AI-a belle. Uky we suw hem şikes howpuny azaldýar.', 'Чтобы не травмироваться: всегда разминайся, укрепляй шею и мышцы спины, не делай схватки в полную силу уставшим, при боли — говори тренеру и отмечай в Champ AI. Сон и вода тоже снижают риск травм.', 'To avoid injuries: always warm up, strengthen your neck and back, no full-power sparring when exhausted, report pain to your coach and log it in Champ AI. Sleep and water lower the risk too.') },
  { id: 'today_plan', q: ['план на сегодня', 'что мне делать сегодня', 'мой день', 'şu günki meýilnama', 'today plan'],
    a: null /* ответ строит основной помощник */ },
];

// Предрасчёт: токены и вес редких слов
const DOCS = KB.map((e) => ({ e, phrases: e.q.map(toks) }));
const DF = {};
DOCS.forEach((d) => new Set(d.phrases.flat()).forEach((w) => { DF[w] = (DF[w] || 0) + 1; }));
const idf = (w) => Math.log(1 + KB.length / (DF[w] || 0.5));

function phraseScore(q, p) {
  if (!q.length || !p.length) return 0;
  let s = 0, hits = 0;
  for (const w of q) {
    let best = 0;
    for (const x of p) { if (x === w) { best = 1; break; } if (lev1(x, w)) best = Math.max(best, 0.75); else if (w.length >= 4 && (x.startsWith(w) || w.startsWith(x))) best = Math.max(best, 0.6); }
    s += best * idf(w);
    if (best > 0) hits++;
  }
  // одно совпавшее слово из нескольких — слишком слабое основание
  if (q.length >= 2 && hits < 2) s *= 0.6;
  const norm_ = Math.sqrt(q.reduce((a, w) => a + idf(w), 0) * p.reduce((a, w) => a + idf(w), 0)) || 1;
  return s / norm_;
}

export function kbMatch(text) {
  const q = toks(text);
  const scored = DOCS.map((d) => ({ e: d.e, s: Math.max(...d.phrases.map((p) => phraseScore(q, p))) })).sort((a, b) => b.s - a.s);
  return { best: scored[0], alts: scored.slice(0, 3).filter((x) => x.s > 0.12) };
}

// Подпись темы для подсказок: русская фраза — первая кириллическая, туркменская — первая латинская, английская — последняя
export const kbTitle = (e, lang) => {
  const latin = e.q.filter((x) => !/[а-я]/.test(x));
  const byLang = { tk: latin.length > 1 ? latin[0] : null, ru: e.q.find((x) => /[а-я]/.test(x)), en: latin.at(-1) };
  const s = byLang[lang] || e.q[0];
  return s.charAt(0).toUpperCase() + s.slice(1) + '?';
};
export const kbAnswer = (e, P, lang) => (e.a ? pick(e.a(P), lang) : null);

// ---------- Умный ответ: безопасность → база тем → общие темы → подсказки ----------

const WHY = /(почему|зачем|n[aä]me [uü]çin|nam[eä] ucin|n[eä]den|why)/i;
const MORE = /^(а |a |и |we |hem )?(ещ[её]|подробн|больше|anyk|has giňişle|more)/i;

export function smartReply(text, ctx, memory = {}) {
  const lang = detectLang(text, ctx.lang);
  const P = ctx.plan;
  // «Почему?» — объясняем предыдущий ответ про еду
  if (WHY.test(text) && text.trim().split(/\s+/).length <= 4 && memory.food) {
    const f = foodById(memory.food);
    if (f?.why) return { lang, text: pick(f.why, lang), actions: [], memory };
  }
  const r = baseReply(text, ctx);
  const m = kbMatch(text);
  const mem = { ...memory, food: r.food || memory.food, area: r.area || memory.area };
  // Безопасность и «можно ли это есть» — всегда приоритет
  // «Мышцы болят после тренировки», «свело ногу», «ухо опухло» — это темы базы, а не травма с картой
  const soft = ['soreness', 'cramp', 'ear', 'skin', 'sick'];
  if (r.kind === 'pain' && !r.area && m.best.s >= 0.42 && soft.includes(m.best.e.id)) return { lang, text: kbAnswer(m.best.e, P, lang), actions: [], kind: 'kb:' + m.best.e.id, memory: { ...mem, kb: m.best.e.id } };
  if (r.kind === 'pain' || r.kind === 'food_check') return { ...r, memory: { ...mem, kb: null } };
  if (m.best.s >= 0.42) {
    const e = m.best.e;
    const t = e.id === 'today_plan' ? todayBrief(ctx, lang) : kbAnswer(e, P, lang);
    return { lang, text: t, actions: e.id === 'today_plan' ? [{ id: 'today' }] : [], kind: 'kb:' + e.id, memory: { ...mem, kb: e.id } };
  }
  if (r.kind !== 'fallback') return { ...r, memory: { ...mem, kb: null } };
  // Короткое уточнение «а ещё?» — продолжаем прошлую тему
  if (MORE.test(text) && memory.kb) {
    const e = KB.find((x) => x.id === memory.kb);
    if (e?.a) return { lang, text: kbAnswer(e, P, lang), actions: [], kind: 'kb:' + e.id, memory };
  }
  // Не уверены — предлагаем похожие вопросы
  const alts = m.alts.filter((x) => x.e.a);
  if (alts.length) {
    const head = pick(T3('Takmynan şuny soramakçy bolduňmy?', 'Возможно, ты хотел спросить:', 'Did you mean:'), lang);
    return { lang, text: head, actions: alts.map((x) => ({ id: 'ask', text: kbTitle(x.e, lang) })), kind: 'suggest', memory: mem };
  }
  return { ...r, memory: mem };
}

// Короткая сводка дня: тренировка, вода, ближайшая еда
export function todayBrief(ctx, lang) {
  const P = ctx.plan;
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const toH = (s) => { const [h, mm] = s.split('–')[0].split(':').map(Number); return h + mm / 60; };
  const meal = P.meals.find((x) => toH(x.at) >= nowH) || P.meals[0];
  const L = (o) => pick(o, lang);
  return [
    trainingText(P, lang).split('\n')[0],
    L(T3(`💧 Suw: günde ${(P.water / 1000).toFixed(1)} l.`, `💧 Вода: ${(P.water / 1000).toFixed(1)} л за день.`, `💧 Water: ${(P.water / 1000).toFixed(1)} L today.`)),
    `🍽 ${meal.at} — ${L(meal.name)}: ${meal.what.map((id) => L(foodById(id).name)).join(', ')}`,
  ].join('\n');
}
