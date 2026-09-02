/**
 * Exercise library, file C: light home equipment — pull-up bar, resistance bands, jump rope,
 * dumbbells and kettlebell. Ids, animation ids, units, equipment and levels are referenced by
 * courses and animations — keep them stable. Copy is shown in the workout player and on the
 * public /exercises/<slug>/ pages.
 */
import type { ExerciseInput } from '@/content/schema';

export const EXERCISES_C: ExerciseInput[] = [
  {
    id: 'pull_up',
    slug: { ru: 'podtyagivaniya', en: 'pull-up' },
    name: { ru: 'Подтягивания', en: 'Pull-up' },
    shortName: { ru: 'Подтягивания', en: 'Pull-up' },
    description: {
      ru: 'Подтягивания — главная вертикальная тяга в домашнем тренинге и лучший тест силы спины и хвата. Они строят широчайшие, бицепсы и мышцы между лопатками, которые в отжиманиях и жимах не работают, и уравновешивают всю жимовую нагрузку программы. Мы считаем строгие подтягивания: без раскачки, из полного виса до подбородка над перекладиной. Если чистых повторений пока нет — начни с негативных подтягиваний и виса.',
      en: 'The pull-up is the main vertical pull in home training and the best test of back and grip strength. It builds the lats, biceps and the muscles between the shoulder blades that push-ups and presses never touch, balancing all the pressing in the program. We count strict pull-ups: no kipping, from a full hang to chin over the bar. If you have no clean reps yet, start with negatives and dead hangs.',
    },
    howTo: [
      {
        ru: 'Возьмись за перекладину хватом сверху чуть шире плеч и повисни на прямых руках, ноги вместе или слегка скрещены.',
        en: 'Grip the bar overhand slightly wider than your shoulders and hang with straight arms, legs together or lightly crossed.',
      },
      {
        ru: 'Опусти плечи от ушей и сведи лопатки — движение начинается со спины, а не с локтей.',
        en: 'Pull your shoulders down away from your ears and set the shoulder blades — the movement starts from the back, not the elbows.',
      },
      {
        ru: 'Тяни локти вниз и назад, поднимая грудь к перекладине, пока подбородок не окажется над ней.',
        en: 'Drive your elbows down and back, bringing your chest toward the bar until your chin clears it.',
      },
      {
        ru: 'Плавно опустись до полного выпрямления рук — только после этого начинается следующее повторение.',
        en: 'Lower under control to fully straight arms — only then does the next rep begin.',
      },
    ],
    cues: [
      { ru: 'Локти вниз и назад', en: 'Elbows down and back' },
      { ru: 'Грудь к перекладине', en: 'Chest to the bar' },
      { ru: 'Пресс напряжён, ноги не качаются', en: 'Brace the abs, legs still' },
      { ru: 'Внизу — полный вис', en: 'Full hang at the bottom' },
    ],
    mistakes: [
      { ru: 'Раскачка и рывок ногами', en: 'Kipping and kicking with the legs' },
      {
        ru: 'Неполная амплитуда — руки не выпрямляются внизу',
        en: 'Half reps: arms never straighten at the bottom',
      },
      { ru: 'Подбородок тянется вверх, плечи уходят к ушам', en: 'Chin reaching up while the shoulders shrug' },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох при опускании.',
      en: 'Exhale as you pull up, inhale as you lower.',
    },
    muscles: ['lats', 'biceps', 'back', 'core'],
    pattern: 'pull_vertical',
    equipment: ['pullup_bar'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 8.0,
    loadable: false,
    scaling: { easier: 'negative_pull_up' },
    animation: 'pull_up',
    tags: ['upper', 'pull', 'benchmark'],
  },
  {
    id: 'negative_pull_up',
    slug: { ru: 'negativnye-podtyagivaniya', en: 'negative-pull-up' },
    name: { ru: 'Негативные подтягивания', en: 'Negative pull-up' },
    shortName: { ru: 'Негативные', en: 'Negatives' },
    description: {
      ru: 'Негативные подтягивания — это только опускание: ты запрыгиваешь или залезаешь в верхнюю точку и медленно опускаешься в вис. Мышцы сильнее на удлинении, чем на сокращении, поэтому даже без единого подтягивания ты можешь нагрузить спину и бицепсы в полной амплитуде. Это самый короткий путь к первому чистому подтягиванию. Опускайся не быстрее трёх секунд — иначе пользы почти нет.',
      en: 'Negative pull-ups are the lowering half only: you jump or climb to the top position and lower yourself slowly into a hang. Muscles are stronger while lengthening than while shortening, so even with zero pull-ups you can load your back and biceps through the full range. It is the shortest road to your first strict pull-up. Take at least three seconds to lower — faster than that and there is little benefit.',
    },
    howTo: [
      {
        ru: 'Встань под перекладиной на стул или подпрыгни и займи верхнее положение: подбородок над перекладиной, хват сверху чуть шире плеч.',
        en: 'Use a chair or a jump to get into the top position: chin over the bar, overhand grip slightly wider than your shoulders.',
      },
      {
        ru: 'Сведи лопатки, напряги пресс и убери ноги с опоры — держи вес на руках.',
        en: 'Set your shoulder blades, brace your abs and take your feet off the support so your arms carry the weight.',
      },
      {
        ru: 'Медленно опускайся 3–5 секунд, сопротивляясь всей спиной, пока руки полностью не выпрямятся.',
        en: 'Lower yourself over 3–5 seconds, resisting with the whole back, until your arms are fully straight.',
      },
      {
        ru: 'Отпусти перекладину или встань на опору, снова поднимись наверх и повтори.',
        en: 'Step off or drop down, get back to the top and repeat.',
      },
    ],
    cues: [
      { ru: 'Считай до трёх на опускании', en: 'Count to three on the way down' },
      { ru: 'Лопатки вместе', en: 'Shoulder blades together' },
      { ru: 'Тормози до самого низа', en: 'Brake all the way to the bottom' },
    ],
    mistakes: [
      { ru: 'Падение вниз без контроля', en: 'Dropping instead of lowering' },
      {
        ru: 'Отпускание в середине пути, до полного виса',
        en: 'Letting go halfway before reaching a full hang',
      },
      { ru: 'Плечи задраны к ушам', en: 'Shoulders shrugged up to the ears' },
    ],
    breathing: {
      ru: 'Вдох наверху, длинный выдох, пока опускаешься.',
      en: 'Inhale at the top, long exhale as you lower.',
    },
    muscles: ['lats', 'biceps', 'back', 'core'],
    pattern: 'pull_vertical',
    equipment: ['pullup_bar'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 5.0,
    met: 6.0,
    loadable: false,
    scaling: { easier: 'dead_hang', harder: 'pull_up' },
    animation: 'negative_pull_up',
    tags: ['upper', 'pull'],
  },
  {
    id: 'dead_hang',
    slug: { ru: 'vis-na-perekladine', en: 'dead-hang' },
    name: { ru: 'Вис на перекладине', en: 'Dead hang' },
    shortName: { ru: 'Вис', en: 'Dead hang' },
    description: {
      ru: 'Вис на перекладине — простое удержание собственного веса на прямых руках. Он тренирует хват и предплечья, растягивает широчайшие и плечи и разгружает позвоночник после приседаний и тяг. Для новичка это первая ступень к подтягиваниям: пока хват не держит хотя бы 30 секунд, тянуться наверх рано. Ещё вис — отличная заминка для плеч в конце тренировки.',
      en: 'The dead hang is simply holding your body weight on straight arms. It trains grip and forearms, stretches the lats and shoulders and decompresses the spine after squats and deadlifts. For a beginner it is the first step toward pull-ups: until your grip holds for at least 30 seconds, pulling up can wait. It also makes a great shoulder cool-down at the end of a session.',
    },
    howTo: [
      {
        ru: 'Возьмись за перекладину хватом сверху на ширине плеч, большие пальцы обхватывают перекладину.',
        en: 'Grip the bar overhand at shoulder width, thumbs wrapped around the bar.',
      },
      {
        ru: 'Повисни на прямых руках, ноги вместе, стопы не касаются пола.',
        en: 'Hang with straight arms, legs together, feet off the floor.',
      },
      {
        ru: 'Слегка опусти плечи от ушей и напряги пресс, чтобы тело не раскачивалось.',
        en: 'Draw your shoulders slightly down from your ears and brace your abs so the body does not swing.',
      },
      {
        ru: 'Держи заданное время, дыши спокойно, затем плавно встань на пол.',
        en: 'Hold for the prescribed time, breathing calmly, then step down under control.',
      },
    ],
    cues: [
      { ru: 'Сожми перекладину', en: 'Squeeze the bar' },
      { ru: 'Тело спокойно, без качания', en: 'Body quiet, no swinging' },
      { ru: 'Дыши ровно', en: 'Keep breathing' },
    ],
    mistakes: [
      { ru: 'Хват без большого пальца', en: 'Thumbless grip' },
      { ru: 'Раскачивание и дёрганье ногами', en: 'Swinging and kicking the legs' },
      { ru: 'Задержка дыхания', en: 'Holding your breath' },
    ],
    breathing: {
      ru: 'Спокойное ровное дыхание животом.',
      en: 'Calm, even belly breathing.',
    },
    muscles: ['lats', 'back', 'shoulders', 'core'],
    pattern: 'pull_vertical',
    equipment: ['pullup_bar'],
    level: 1,
    unit: 'seconds',
    met: 3.0,
    loadable: false,
    scaling: { harder: 'negative_pull_up' },
    animation: 'dead_hang',
    tags: ['upper', 'pull', 'cooldown'],
  },
  {
    id: 'hanging_knee_raise',
    slug: { ru: 'podem-koleney-v-vise', en: 'hanging-knee-raise' },
    name: { ru: 'Подъём коленей в висе', en: 'Hanging knee raise' },
    shortName: { ru: 'Колени в висе', en: 'Knee raise' },
    description: {
      ru: 'Подъём коленей в висе — упражнение на пресс, которое заодно тренирует хват и стабильность плеч. Вися на перекладине, ты подтягиваешь колени к груди, скручивая таз вверх, а не просто размахивая ногами. Это следующий шаг после подъёмов ног лёжа и подводка к подъёмам прямых ног, «носки к перекладине» и другим гимнастическим элементам.',
      en: 'The hanging knee raise is an abs exercise that also trains your grip and shoulder stability. Hanging from the bar, you pull your knees toward your chest by curling the pelvis up rather than swinging the legs. It is the step after lying leg raises and the lead-in to straight-leg raises, toes-to-bar and other gymnastics skills.',
    },
    howTo: [
      {
        ru: 'Повисни на перекладине хватом сверху, руки прямые, плечи слегка опущены, ноги вместе.',
        en: 'Hang from the bar with an overhand grip, arms straight, shoulders slightly drawn down, legs together.',
      },
      {
        ru: 'Напряги пресс и подтяни колени к груди, подкручивая таз вверх — поясница округляется, а не прогибается.',
        en: 'Brace your abs and draw your knees toward your chest, curling the pelvis up — the lower back rounds rather than arches.',
      },
      {
        ru: 'Задержись на секунду наверху: колени выше уровня таза.',
        en: 'Pause for a second at the top with your knees above hip height.',
      },
      {
        ru: 'Медленно опусти ноги в исходный вис без раскачки и повтори.',
        en: 'Lower your legs slowly back to the hang without swinging and repeat.',
      },
    ],
    cues: [
      { ru: 'Таз подкручивай вверх', en: 'Curl the pelvis up' },
      { ru: 'Опускай медленно', en: 'Lower slowly' },
      { ru: 'Без раскачки', en: 'No swing' },
    ],
    mistakes: [
      { ru: 'Раскачивание для помощи ногам', en: 'Using a swing to help the legs up' },
      {
        ru: 'Колени поднимаются только за счёт сгибателей бедра, таз не скручивается',
        en: 'Lifting from the hip flexors only, with no pelvic curl',
      },
      { ru: 'Ноги падают вниз рывком', en: 'Legs dropping with a jerk' },
    ],
    breathing: {
      ru: 'Выдох на подъёме коленей, вдох при опускании.',
      en: 'Exhale as the knees come up, inhale as they lower.',
    },
    muscles: ['core', 'hip_flexors', 'lats', 'obliques'],
    pattern: 'core_flexion',
    equipment: ['pullup_bar'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 5.0,
    loadable: false,
    scaling: { easier: 'leg_raise' },
    animation: 'hanging_knee_raise',
    tags: ['core', 'upper'],
  },
  {
    id: 'band_row',
    slug: { ru: 'tyaga-rezinki-k-poyasu', en: 'band-row' },
    name: { ru: 'Тяга резинки к поясу', en: 'Band row' },
    shortName: { ru: 'Тяга резинки', en: 'Band row' },
    description: {
      ru: 'Тяга резинки к поясу — горизонтальная тяга для середины спины, задних дельт и бицепсов. Резинка даёт нагрузку, которая растёт к концу движения, поэтому именно в точке сведения лопаток спина работает сильнее всего. Мы используем её, чтобы уравновесить отжимания, и как замену тягам с гантелями, когда их нет. Закрепи резинку за устойчивую опору на уровне груди или зацепи за стопы сидя на полу.',
      en: 'The band row is a horizontal pull for the mid-back, rear shoulders and biceps. A band resists harder toward the end of the movement, so the back works hardest exactly where the shoulder blades squeeze together. We use it to balance push-ups and as a substitute for dumbbell rows when you have no weights. Anchor the band to something solid at chest height, or loop it around your feet while seated on the floor.',
    },
    howTo: [
      {
        ru: 'Закрепи резинку на уровне груди, встань лицом к опоре и отойди, пока резинка не натянется при вытянутых руках. Стопы на ширине таза, колени мягкие.',
        en: 'Anchor the band at chest height, face the anchor and step back until the band is taut with your arms extended. Feet hip-width apart, knees soft.',
      },
      {
        ru: 'Опусти плечи и тяни рукоятки к поясу, ведя локти вдоль корпуса назад.',
        en: 'Set your shoulders down and pull the handles toward your waist, driving the elbows back along your sides.',
      },
      {
        ru: 'В конечной точке сведи лопатки и задержись на секунду, корпус неподвижен.',
        en: 'At the end squeeze your shoulder blades together and hold for a second, torso still.',
      },
      {
        ru: 'Медленно верни руки вперёд, контролируя натяжение, и повтори.',
        en: 'Return your arms forward slowly, controlling the band tension, and repeat.',
      },
    ],
    cues: [
      { ru: 'Локти к поясу', en: 'Elbows to the waist' },
      { ru: 'Сведи лопатки', en: 'Squeeze the shoulder blades' },
      { ru: 'Корпус не качается', en: 'Torso stays still' },
    ],
    mistakes: [
      { ru: 'Плечи поднимаются к ушам', en: 'Shoulders shrugging toward the ears' },
      {
        ru: 'Корпус отклоняется назад, чтобы помочь рукам',
        en: 'Leaning back to help the arms',
      },
      { ru: 'Резинка бросается вперёд без контроля', en: 'Letting the band snap forward' },
    ],
    breathing: {
      ru: 'Выдох на тяге, вдох при возврате.',
      en: 'Exhale as you pull, inhale as you return.',
    },
    muscles: ['back', 'lats', 'biceps', 'shoulders'],
    pattern: 'pull_horizontal',
    equipment: ['bands'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.0,
    met: 3.8,
    loadable: false,
    scaling: {},
    animation: 'band_row',
    tags: ['upper', 'pull'],
  },
  {
    id: 'band_pull_apart',
    slug: { ru: 'razvedenie-rezinki', en: 'band-pull-apart' },
    name: { ru: 'Разведение резинки', en: 'Band pull-apart' },
    shortName: { ru: 'Разведение', en: 'Pull-apart' },
    description: {
      ru: 'Разведение резинки — растягивание ленты перед собой прямыми руками. Упражнение будит задние дельты, ромбовидные и ротаторную манжету — мелкие мышцы, которые держат плечи в правильном положении и защищают их в отжиманиях и жимах над головой. Мы ставим его в разминку перед любой работой на верх тела и как «антидот» от сидения за компьютером.',
      en: 'The band pull-apart stretches a band across your chest with straight arms. It wakes up the rear delts, rhomboids and rotator cuff — the small muscles that hold your shoulders in position and protect them in push-ups and overhead presses. We put it in every upper-body warm-up and prescribe it as the antidote to a day at the desk.',
    },
    howTo: [
      {
        ru: 'Встань прямо, возьми резинку двумя руками хватом сверху на ширине плеч и вытяни руки перед собой на уровне груди.',
        en: 'Stand tall, hold the band overhand with hands shoulder-width apart and extend your arms in front of you at chest height.',
      },
      {
        ru: 'Разводи прямые руки в стороны, растягивая резинку, пока она не коснётся груди, — лопатки сходятся вместе.',
        en: 'Pull your straight arms apart, stretching the band until it touches your chest, shoulder blades squeezing together.',
      },
      {
        ru: 'Задержись на секунду, плечи опущены, рёбра не выпячиваются.',
        en: 'Hold for a second with your shoulders down and ribs tucked.',
      },
      {
        ru: 'Плавно верни руки вперёд, не давая резинке провиснуть, и повтори.',
        en: 'Return your arms forward under control without letting the band go slack, and repeat.',
      },
    ],
    cues: [
      { ru: 'Руки прямые', en: 'Arms straight' },
      { ru: 'Лопатки вместе', en: 'Shoulder blades together' },
      { ru: 'Плечи вниз', en: 'Shoulders down' },
    ],
    mistakes: [
      { ru: 'Локти сгибаются — работает бицепс, а не спина', en: 'Elbows bending so the biceps take over' },
      { ru: 'Плечи задираются к ушам', en: 'Shoulders creeping up to the ears' },
      { ru: 'Прогиб в пояснице и выпяченные рёбра', en: 'Arching the lower back and flaring the ribs' },
    ],
    breathing: {
      ru: 'Выдох на разведении, вдох на возврате.',
      en: 'Exhale as you pull apart, inhale as you return.',
    },
    muscles: ['shoulders', 'back'],
    pattern: 'pull_horizontal',
    equipment: ['bands'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.0,
    met: 3.0,
    loadable: false,
    scaling: {},
    animation: 'band_pull_apart',
    tags: ['upper', 'pull', 'warmup', 'mobility'],
  },
  {
    id: 'single_under',
    slug: { ru: 'pryzhki-na-skakalke', en: 'single-unders' },
    name: { ru: 'Прыжки на скакалке', en: 'Single-unders' },
    shortName: { ru: 'Скакалка', en: 'Single-unders' },
    description: {
      ru: 'Прыжки на скакалке — один оборот троса на один прыжок. Это самое эффективное домашнее кардио: за минуту скакалка сжигает больше, чем бег в среднем темпе, и заодно тренирует икры, стопы, координацию и ритм. Мы используем её в разминке и как «дыхательный» элемент в метконах. Прыгай низко, приземляйся мягко, крути скакалку кистями, а не всей рукой.',
      en: 'Single-unders are one rope turn per jump. They are the most efficient home cardio there is: minute for minute the rope burns more than a moderate run while training the calves, feet, coordination and rhythm. We use them in warm-ups and as the breathing element in metcons. Jump low, land softly and turn the rope with your wrists, not your whole arms.',
    },
    howTo: [
      {
        ru: 'Подбери длину: встань на середину скакалки — рукоятки должны доходить до подмышек. Возьми рукоятки, локти прижаты к бокам, скакалка за пятками.',
        en: 'Check the length: standing on the middle of the rope, the handles should reach your armpits. Hold the handles with elbows tucked to your sides, rope resting behind your heels.',
      },
      {
        ru: 'Крути скакалку небольшими круговыми движениями кистей и перепрыгивай её обеими ногами на 3–5 см от пола.',
        en: 'Turn the rope with small circles of the wrists and hop over it with both feet, 3–5 cm off the floor.',
      },
      {
        ru: 'Приземляйся на переднюю часть стопы с мягкими коленями, корпус прямой, взгляд вперёд.',
        en: 'Land on the balls of your feet with soft knees, torso upright, eyes forward.',
      },
      {
        ru: 'Держи ровный ритм: один оборот — один прыжок, без лишних подскоков между оборотами.',
        en: 'Keep an even rhythm: one turn, one jump, with no extra bounce between turns.',
      },
    ],
    cues: [
      { ru: 'Крути кистями', en: 'Turn with the wrists' },
      { ru: 'Прыгай низко', en: 'Jump low' },
      { ru: 'Локти у корпуса', en: 'Elbows in' },
      { ru: 'Мягко на носки', en: 'Soft on the balls of the feet' },
    ],
    mistakes: [
      { ru: 'Слишком высокие прыжки с поджиманием ног', en: 'Jumping too high and tucking the legs' },
      { ru: 'Крутишь всей рукой от плеча', en: 'Turning the rope from the shoulders' },
      { ru: 'Приземление на всю стопу или на пятки', en: 'Landing flat-footed or on the heels' },
    ],
    breathing: {
      ru: 'Ровное дыхание в такт прыжкам — не задерживай воздух.',
      en: 'Steady breathing in time with the jumps; never hold your breath.',
    },
    muscles: ['calves', 'quads', 'shoulders', 'cardio'],
    pattern: 'jump',
    equipment: ['jump_rope'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 0.6,
    met: 11.0,
    loadable: false,
    scaling: { easier: 'jumping_jack', harder: 'double_under' },
    animation: 'single_under',
    tags: ['cardio', 'warmup'],
  },
  {
    id: 'double_under',
    slug: { ru: 'dvoynye-pryzhki-na-skakalke', en: 'double-unders' },
    name: { ru: 'Двойные прыжки на скакалке', en: 'Double-unders' },
    shortName: { ru: 'Двойные', en: 'Double-unders' },
    description: {
      ru: 'Двойные прыжки — два оборота скакалки за один прыжок. Это классический навык кроссфита: он требует быстрых кистей, чуть более высокого прыжка и, главное, спокойствия — как только ты начинаешь дёргаться, скакалка бьёт по ногам. Двойные разгоняют пульс сильнее любого другого упражнения без веса и учат тело работать расслабленно на высокой скорости. Осваивай их, когда одинарные идут без сбоев минуту подряд.',
      en: 'Double-unders are two rope turns per jump. A classic CrossFit skill: they need fast wrists, a slightly higher jump and, above all, calm — the moment you tense up the rope whips your legs. Doubles push your heart rate higher than any other unloaded movement and teach your body to stay relaxed at speed. Learn them once you can do single-unders for a minute without a miss.',
    },
    howTo: [
      {
        ru: 'Начни с нескольких одинарных прыжков в ровном ритме, локти у корпуса, кисти крутят скакалку.',
        en: 'Start with a few single-unders at an even rhythm, elbows in, wrists turning the rope.',
      },
      {
        ru: 'Прыгни чуть выше обычного и в воздухе резко ускорь кисти, чтобы скакалка прошла под ногами дважды.',
        en: 'Jump a little higher than usual and snap your wrists faster in the air so the rope passes under you twice.',
      },
      {
        ru: 'Тело остаётся вертикальным и вытянутым, ноги вместе и прямые, — не поджимай колени и не складывайся.',
        en: 'Keep your body tall and straight, legs together and extended — do not tuck the knees or pike at the hips.',
      },
      {
        ru: 'Приземлись мягко на носки и продолжай: либо каждый прыжок двойной, либо чередуй с одинарными, пока учишься.',
        en: 'Land softly on the balls of your feet and keep going: every jump a double, or alternate with singles while you are learning.',
      },
    ],
    cues: [
      { ru: 'Быстрые кисти, а не высокий прыжок', en: 'Fast wrists, not a high jump' },
      { ru: 'Тело вытянуто в струну', en: 'Body tall and straight' },
      { ru: 'Расслабь плечи', en: 'Relax the shoulders' },
    ],
    mistakes: [
      { ru: 'Поджимание коленей и «лягушка» в воздухе', en: 'Tucking the knees into a frog jump' },
      { ru: 'Руки уходят в стороны, скакалка становится короткой', en: 'Arms drifting wide so the rope gets too short' },
      { ru: 'Каждый прыжок «на пределе» — нет ритма', en: 'Every jump at max effort with no rhythm' },
    ],
    breathing: {
      ru: 'Дыши ритмично и не задерживай дыхание на высокой скорости.',
      en: 'Breathe rhythmically and never hold your breath at speed.',
    },
    muscles: ['calves', 'quads', 'shoulders', 'core', 'cardio'],
    pattern: 'jump',
    equipment: ['jump_rope'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 0.8,
    met: 12.0,
    loadable: false,
    scaling: { easier: 'single_under' },
    animation: 'double_under',
    tags: ['cardio', 'explosive', 'benchmark'],
  },
];
