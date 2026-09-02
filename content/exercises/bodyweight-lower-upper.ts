/**
 * Exercise library, file A: bodyweight lower-body, pushing, plyometrics and full-body warm-ups.
 * Ids, animation ids, units, equipment and levels are referenced by courses and animations —
 * keep them stable. Copy is shown in the workout player and on public /exercises/<slug>/ pages.
 */
import type { ExerciseInput } from '@/content/schema';

export const EXERCISES_A: ExerciseInput[] = [
  {
    id: 'air_squat',
    slug: { ru: 'prisedaniya', en: 'air-squat' },
    name: { ru: 'Приседания', en: 'Air squat' },
    shortName: { ru: 'Приседания', en: 'Air squat' },
    description: {
      ru: 'Базовое движение всей программы: приседания без веса учат правильно сгибать колени и тазобедренные суставы, держать спину и работать всей ногой. Они нагружают квадрицепсы и ягодицы, разогревают суставы и лежат в основе прыжков, выпадов и приседаний с гантелями. В тесте мы считаем приседания за 60 секунд — это простой показатель выносливости ног.',
      en: 'The foundation of the whole program: the bodyweight squat teaches you to bend at the hips and knees together, keep your spine neutral and drive with the whole leg. It loads the quads and glutes, warms up the joints and underpins every jump, lunge and loaded squat you will meet later. In the test we count squats in 60 seconds as a simple measure of leg endurance.',
    },
    howTo: [
      {
        ru: 'Встань, стопы на ширине плеч, носки слегка развёрнуты наружу, руки вдоль тела или перед собой.',
        en: 'Stand with your feet shoulder-width apart, toes turned slightly out, arms by your sides or held in front of you.',
      },
      {
        ru: 'Отведи таз назад и сгибай колени, опускаясь вниз, как будто садишься на низкий стул. Спина прямая, взгляд вперёд.',
        en: 'Push your hips back and bend your knees, lowering yourself as if sitting onto a low chair. Keep your back flat and your eyes forward.',
      },
      {
        ru: 'Опустись до положения, где бёдра параллельны полу или чуть ниже, — пятки остаются на полу, колени идут по направлению носков.',
        en: 'Descend until your thighs are parallel to the floor or slightly below, heels down, knees tracking over your toes.',
      },
      {
        ru: 'Оттолкнись всей стопой и поднимись вверх, в верхней точке полностью выпрями колени и сожми ягодицы.',
        en: 'Drive through the whole foot to stand back up, fully extending your knees and squeezing your glutes at the top.',
      },
    ],
    cues: [
      { ru: 'Колени в стороны', en: 'Knees out' },
      { ru: 'Вес на пятках', en: 'Weight in the heels' },
      { ru: 'Грудь вперёд', en: 'Chest up' },
      { ru: 'Полное разгибание наверху', en: 'Stand all the way up' },
    ],
    mistakes: [
      { ru: 'Пятки отрываются от пола', en: 'Heels lift off the floor' },
      { ru: 'Колени сваливаются внутрь', en: 'Knees cave inward' },
      { ru: 'Спина округляется в нижней точке', en: 'Lower back rounds at the bottom' },
    ],
    breathing: {
      ru: 'Вдох на пути вниз, выдох с усилием на подъёме.',
      en: 'Inhale on the way down, exhale as you drive up.',
    },
    muscles: ['quads', 'glutes', 'hamstrings', 'core'],
    pattern: 'squat',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 5.0,
    loadable: false,
    scaling: { harder: 'jump_squat' },
    animation: 'air_squat',
    tags: ['lower', 'benchmark'],
    isTest: true,
  },
  {
    id: 'jump_squat',
    slug: { ru: 'prisedaniya-s-vyprygivaniem', en: 'jump-squat' },
    name: { ru: 'Приседания с выпрыгиванием', en: 'Jump squat' },
    shortName: { ru: 'Присед с прыжком', en: 'Jump squat' },
    description: {
      ru: 'Приседание с выпрыгиванием добавляет к обычному приседу взрывной прыжок: ты учишься быстро выдавать силу ногами и мягко приземляться. Это главный «бесплатный» способ прокачать мощность и пульс без оборудования, поэтому мы ставим его в метконы и интервалы. Ключ к безопасности — тихое приземление на всю стопу с согнутыми коленями.',
      en: 'The jump squat adds an explosive jump to the regular squat: you learn to produce force fast with your legs and to land softly. It is the best equipment-free way to build lower-body power and push your heart rate, which is why it shows up in metcons and intervals. The key to keeping it safe is a quiet landing on the whole foot with bent knees.',
    },
    howTo: [
      {
        ru: 'Стопы на ширине плеч, носки чуть наружу, руки перед собой.',
        en: 'Feet shoulder-width apart, toes slightly out, arms in front of you.',
      },
      {
        ru: 'Опустись в присед до параллели бёдер с полом, отводя таз назад и держа спину прямой.',
        en: 'Lower into a squat until your thighs are parallel to the floor, hips back, back flat.',
      },
      {
        ru: 'Мощно оттолкнись всей стопой и выпрыгни вверх, полностью выпрямляя ноги, руки уходят назад или вверх.',
        en: 'Drive hard through the whole foot and jump straight up, fully extending your legs; swing your arms back or overhead.',
      },
      {
        ru: 'Приземлись мягко на носки с переходом на всю стопу, сразу согни колени и уйди в следующий присед.',
        en: 'Land softly on the balls of your feet rolling to the whole foot, bend your knees immediately and sink into the next squat.',
      },
    ],
    cues: [
      { ru: 'Приземляйся тихо', en: 'Land quietly' },
      { ru: 'Колени мягкие', en: 'Soft knees' },
      { ru: 'Выпрыгивай в полный рост', en: 'Jump to full extension' },
    ],
    mistakes: [
      { ru: 'Приземление на прямые ноги', en: 'Landing with straight legs' },
      { ru: 'Колени уходят внутрь при приземлении', en: 'Knees collapse inward on landing' },
      { ru: 'Слишком мелкий присед перед прыжком', en: 'Squat too shallow before the jump' },
    ],
    breathing: {
      ru: 'Вдох в приседе, резкий выдох на прыжке.',
      en: 'Inhale in the squat, sharp exhale as you jump.',
    },
    muscles: ['quads', 'glutes', 'calves', 'hamstrings', 'cardio'],
    pattern: 'jump',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 2.0,
    met: 8.0,
    loadable: false,
    scaling: { easier: 'air_squat', harder: 'tuck_jump' },
    animation: 'jump_squat',
    tags: ['lower', 'explosive', 'cardio'],
  },
  {
    id: 'wall_sit',
    slug: { ru: 'stulchik-u-steny', en: 'wall-sit' },
    name: { ru: 'Стульчик у стены', en: 'Wall sit' },
    shortName: { ru: 'Стульчик', en: 'Wall sit' },
    description: {
      ru: 'Стульчик — статическое удержание приседа спиной к стене. Пока ты сидишь, квадрицепсы и ягодицы работают без движения в суставах, поэтому упражнение подходит даже тем, кому больно приседать. Оно тренирует терпение и силовую выносливость ног, а ещё учит держать колени под прямым углом — как в нижней точке приседа.',
      en: 'The wall sit is a static squat hold with your back against a wall. Your quads and glutes work without any joint movement, which makes it a good option even when regular squats bother your knees. It builds strength endurance in the legs, tests your patience and teaches you the 90-degree knee position you want at the bottom of a squat.',
    },
    howTo: [
      {
        ru: 'Прислонись спиной к стене, стопы на ширине плеч, вынеси их вперёд примерно на полшага.',
        en: 'Stand with your back against a wall, feet shoulder-width apart and about half a step in front of you.',
      },
      {
        ru: 'Скользи спиной вниз по стене, пока бёдра не станут параллельны полу, а колени не согнутся под прямым углом.',
        en: 'Slide down the wall until your thighs are parallel to the floor and your knees are bent at 90 degrees.',
      },
      {
        ru: 'Прижми поясницу и лопатки к стене, руки держи вдоль стены или на бёдрах — не опирайся на колени.',
        en: 'Press your lower back and shoulder blades into the wall; keep your hands on the wall or your thighs, never on your knees.',
      },
      {
        ru: 'Держи положение заданное время, дыши ровно, затем оттолкнись стопами и поднимись.',
        en: 'Hold for the prescribed time, breathing steadily, then push through your feet to stand up.',
      },
    ],
    cues: [
      { ru: 'Колени над пятками', en: 'Knees over heels' },
      { ru: 'Поясница в стену', en: 'Lower back into the wall' },
      { ru: 'Дыши ровно', en: 'Keep breathing' },
    ],
    mistakes: [
      {
        ru: 'Бёдра выше параллели — угол в колене больше 90°',
        en: 'Hips above parallel so the knee angle opens past 90 degrees',
      },
      { ru: 'Руки давят на колени', en: 'Hands pushing on the knees' },
      {
        ru: 'Стопы стоят слишком близко к стене, колени уходят за носки',
        en: 'Feet too close to the wall, knees drifting past the toes',
      },
    ],
    breathing: {
      ru: 'Ровное дыхание животом — не задерживай воздух.',
      en: 'Steady belly breathing; do not hold your breath.',
    },
    muscles: ['quads', 'glutes', 'core'],
    pattern: 'squat',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 3.0,
    loadable: false,
    scaling: {},
    animation: 'wall_sit',
    tags: ['lower'],
  },
  {
    id: 'glute_bridge',
    slug: { ru: 'yagodichnyy-mostik', en: 'glute-bridge' },
    name: { ru: 'Ягодичный мостик', en: 'Glute bridge' },
    shortName: { ru: 'Мостик', en: 'Glute bridge' },
    description: {
      ru: 'Ягодичный мостик учит включать ягодицы и заднюю поверхность бедра без нагрузки на колени и поясницу. Это первое движение в паттерне «тазовое разгибание», из которого потом вырастают румынская тяга и махи гирей. Мы используем его в разминке и в силовых блоках для новичков — и как облегчённую замену для сложных тяг.',
      en: 'The glute bridge teaches you to switch on your glutes and hamstrings without loading the knees or lower back. It is the entry point to the hip-hinge pattern that later grows into Romanian deadlifts and kettlebell swings. We use it in warm-ups and beginner strength blocks, and as the easy substitute for harder hinge movements.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, согни колени, стопы на полу на ширине таза, пятки примерно в 20–30 см от ягодиц. Руки вдоль тела.',
        en: 'Lie on your back with knees bent, feet flat on the floor hip-width apart, heels about 20–30 cm from your glutes, arms by your sides.',
      },
      {
        ru: 'Упрись пятками в пол, сожми ягодицы и поднимай таз, пока корпус и бёдра не образуют прямую линию от плеч до колен.',
        en: 'Push through your heels, squeeze your glutes and lift your hips until your body forms a straight line from shoulders to knees.',
      },
      {
        ru: 'Задержись на секунду в верхней точке, не прогибая поясницу, — работают ягодицы, а не спина.',
        en: 'Pause for a second at the top without arching your lower back; the glutes do the work, not the spine.',
      },
      {
        ru: 'Плавно опусти таз, слегка коснись пола и начинай следующее повторение.',
        en: 'Lower your hips under control, lightly touch the floor and start the next rep.',
      },
    ],
    cues: [
      { ru: 'Дави пятками в пол', en: 'Drive through the heels' },
      { ru: 'Сожми ягодицы наверху', en: 'Squeeze the glutes at the top' },
      { ru: 'Рёбра вниз', en: 'Ribs down' },
    ],
    mistakes: [
      {
        ru: 'Прогиб в пояснице вместо подъёма тазом',
        en: 'Arching the lower back instead of lifting with the hips',
      },
      {
        ru: 'Стопы слишком далеко — работает задняя поверхность бедра, а не ягодицы',
        en: 'Feet too far away so the hamstrings take over from the glutes',
      },
      {
        ru: 'Слишком быстрое опускание без контроля',
        en: 'Dropping the hips instead of lowering under control',
      },
    ],
    breathing: {
      ru: 'Выдох на подъёме таза, вдох на опускании.',
      en: 'Exhale as you lift, inhale as you lower.',
    },
    muscles: ['glutes', 'hamstrings', 'core'],
    pattern: 'hinge',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 3.8,
    loadable: false,
    scaling: { harder: 'single_leg_glute_bridge' },
    animation: 'glute_bridge',
    tags: ['lower', 'warmup'],
  },
  {
    id: 'single_leg_glute_bridge',
    slug: { ru: 'yagodichnyy-mostik-na-odnoy-noge', en: 'single-leg-glute-bridge' },
    name: { ru: 'Ягодичный мостик на одной ноге', en: 'Single-leg glute bridge' },
    shortName: { ru: 'Мостик на одной', en: 'Single-leg bridge' },
    description: {
      ru: 'Мостик на одной ноге удваивает нагрузку на рабочую ягодицу и заставляет корпус удерживать таз ровно. Так ты находишь и подтягиваешь слабую сторону — асимметрия ног обычно проявляется именно здесь. Упражнение готовит к румынской тяге на одной ноге и к бегу, где каждая нога работает по очереди.',
      en: 'The single-leg bridge doubles the load on the working glute and forces your core to keep the pelvis level. It is where you find and fix the weaker side, since leg asymmetries show up here first. It also prepares you for the single-leg Romanian deadlift and for running, where each leg works on its own.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, согни колени, стопы на полу. Выпрями одну ногу вперёд или подтяни колено к груди.',
        en: 'Lie on your back with knees bent and feet flat. Extend one leg straight or pull that knee toward your chest.',
      },
      {
        ru: 'Упрись пяткой рабочей ноги в пол и подними таз, пока бедро и корпус не составят прямую линию.',
        en: 'Drive through the heel of the working leg and lift your hips until thigh and torso form a straight line.',
      },
      {
        ru: 'Держи таз горизонтально — обе тазовые кости на одной высоте, не заваливайся на сторону.',
        en: 'Keep your pelvis level, both hip bones at the same height, without tipping to one side.',
      },
      {
        ru: 'Опустись под контролем, не касаясь пола, и повтори. Сделай все повторения на одну ногу, затем поменяй сторону.',
        en: 'Lower under control without resting on the floor and repeat. Finish all reps on one leg, then switch sides.',
      },
    ],
    cues: [
      { ru: 'Таз ровно', en: 'Hips level' },
      { ru: 'Пятка в пол', en: 'Heel into the floor' },
      { ru: 'Свободная нога не помогает', en: 'Free leg stays quiet' },
    ],
    mistakes: [
      { ru: 'Таз перекашивается в сторону свободной ноги', en: 'Pelvis tilts toward the free leg' },
      { ru: 'Подъём за счёт прогиба в пояснице', en: 'Lifting with a lower-back arch' },
      { ru: 'Опорная пятка отрывается от пола', en: 'Working heel comes off the floor' },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох на опускании.',
      en: 'Exhale on the way up, inhale on the way down.',
    },
    muscles: ['glutes', 'hamstrings', 'core'],
    pattern: 'hinge',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 3.8,
    loadable: false,
    scaling: { easier: 'glute_bridge' },
    animation: 'single_leg_glute_bridge',
    tags: ['lower', 'unilateral'],
  },
  {
    id: 'reverse_lunge',
    slug: { ru: 'obratnye-vypady', en: 'reverse-lunge' },
    name: { ru: 'Обратные выпады', en: 'Reverse lunge' },
    shortName: { ru: 'Обратные выпады', en: 'Reverse lunge' },
    description: {
      ru: 'Обратный выпад — самый безопасный вариант выпада: шаг назад, а не вперёд, снимает лишнюю нагрузку с колена передней ноги и легче контролируется. Он прорабатывает квадрицепсы и ягодицы каждой ноги отдельно, тренирует баланс и подвижность бёдер. Повторения считаем суммарно на обе ноги, чередуя стороны.',
      en: 'The reverse lunge is the safest lunge variation: stepping back instead of forward keeps the front knee stable and is easier to control. It works the quads and glutes of each leg independently while training balance and hip mobility. Reps are counted as the total for both legs, alternating sides.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы на ширине таза, руки на поясе или перед собой.',
        en: 'Stand tall, feet hip-width apart, hands on your hips or in front of you.',
      },
      {
        ru: 'Сделай длинный шаг назад одной ногой и опусти её колено к полу, сгибая обе ноги до прямых углов.',
        en: 'Take a long step back with one leg and lower that knee toward the floor, bending both knees to roughly 90 degrees.',
      },
      {
        ru: 'Переднее колено остаётся над стопой, корпус вертикальный, вес на пятке передней ноги.',
        en: 'Keep the front knee over the foot, torso upright and your weight on the front heel.',
      },
      {
        ru: 'Оттолкнись передней ногой, вернись в исходное положение и повтори другой ногой.',
        en: 'Push through the front foot to return to standing, then repeat with the other leg.',
      },
    ],
    cues: [
      { ru: 'Длинный шаг назад', en: 'Long step back' },
      { ru: 'Корпус вертикально', en: 'Torso upright' },
      { ru: 'Толкайся передней пяткой', en: 'Push through the front heel' },
    ],
    mistakes: [
      {
        ru: 'Короткий шаг — переднее колено уходит далеко за носок',
        en: 'Step too short so the front knee drifts far past the toes',
      },
      { ru: 'Наклон корпуса вперёд', en: 'Leaning the torso forward' },
      { ru: 'Заднее колено ударяется об пол', en: 'Slamming the back knee into the floor' },
    ],
    breathing: {
      ru: 'Вдох на шаге назад, выдох при возвращении.',
      en: 'Inhale as you step back, exhale as you return.',
    },
    muscles: ['quads', 'glutes', 'hamstrings', 'core'],
    pattern: 'lunge',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 5.0,
    loadable: false,
    scaling: { harder: 'jumping_lunge' },
    animation: 'reverse_lunge',
    tags: ['lower', 'unilateral'],
  },
  {
    id: 'jumping_lunge',
    slug: { ru: 'vypady-s-pryzhkom', en: 'jumping-lunge' },
    name: { ru: 'Выпады с прыжком', en: 'Jumping lunge' },
    shortName: { ru: 'Выпады с прыжком', en: 'Jumping lunge' },
    description: {
      ru: 'Выпады с прыжком — плиометрическая версия выпада: в прыжке ты меняешь ноги и приземляешься сразу в следующий выпад. Это мощная нагрузка на ноги и сердце, которая развивает скорость, координацию и устойчивость колена. Ставим их только после того, как обычные выпады выполняются чисто и без боли.',
      en: 'Jumping lunges are the plyometric version of the lunge: you switch legs in the air and land straight into the next lunge. They hammer the legs and the heart while building speed, coordination and knee stability. We program them only once regular lunges are clean and pain-free.',
    },
    howTo: [
      {
        ru: 'Встань в положение выпада: одна нога впереди, колени согнуты под прямым углом, корпус вертикален.',
        en: 'Start in a lunge: one foot forward, both knees bent to 90 degrees, torso upright.',
      },
      {
        ru: 'Мощно оттолкнись обеими ногами и выпрыгни вверх, помогая руками.',
        en: 'Push hard through both feet and jump straight up, driving with your arms.',
      },
      {
        ru: 'В воздухе поменяй ноги местами и приземлись в выпад на другую сторону, мягко сгибая колени.',
        en: 'Switch legs in the air and land in a lunge on the other side, bending your knees softly.',
      },
      {
        ru: 'Сразу переходи в следующий прыжок. Каждое приземление считается за одно повторение.',
        en: 'Go straight into the next jump. Every landing counts as one rep.',
      },
    ],
    cues: [
      { ru: 'Меняй ноги в воздухе', en: 'Switch in the air' },
      { ru: 'Мягкое приземление', en: 'Land soft' },
      { ru: 'Корпус прямо', en: 'Chest tall' },
    ],
    mistakes: [
      { ru: 'Приземление на прямую переднюю ногу', en: 'Landing on a straight front leg' },
      {
        ru: 'Стопы встают на одну линию — теряется равновесие',
        en: 'Feet landing in one line so you lose balance',
      },
      { ru: 'Корпус заваливается вперёд', en: 'Torso collapsing forward' },
    ],
    breathing: {
      ru: 'Выдох на каждом прыжке, вдох при приземлении.',
      en: 'Exhale on every jump, inhale as you land.',
    },
    muscles: ['quads', 'glutes', 'calves', 'hamstrings', 'cardio'],
    pattern: 'jump',
    equipment: ['none'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 1.5,
    met: 8.0,
    loadable: false,
    scaling: { easier: 'reverse_lunge' },
    animation: 'jumping_lunge',
    tags: ['lower', 'explosive', 'cardio', 'unilateral'],
  },
  {
    id: 'lateral_lunge',
    slug: { ru: 'bokovye-vypady', en: 'lateral-lunge' },
    name: { ru: 'Боковые выпады', en: 'Lateral lunge' },
    shortName: { ru: 'Боковые выпады', en: 'Lateral lunge' },
    description: {
      ru: 'Боковой выпад — шаг в сторону с приседанием на одну ногу. Он нагружает ягодицы и внутреннюю поверхность бедра, которые в обычных приседаниях почти не работают, и растягивает приводящие мышцы. Это движение в боковой плоскости готовит колени и тазобедренные суставы к прыжкам «конькобежец» и защищает от травм при резкой смене направления.',
      en: 'The lateral lunge is a sideways step into a single-leg squat. It loads the glutes and inner thighs that ordinary squats barely touch, and stretches the adductors at the same time. Working in the frontal plane prepares your hips and knees for skater jumps and protects you when changing direction quickly.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы вместе или на ширине таза, носки смотрят вперёд.',
        en: 'Stand tall with your feet together or hip-width apart, toes pointing forward.',
      },
      {
        ru: 'Сделай широкий шаг в сторону, отведи таз назад и садись на ту ногу, которой шагнул. Вторая нога остаётся прямой, стопа полностью на полу.',
        en: 'Take a wide step to the side, push your hips back and sit onto the stepping leg. The other leg stays straight with the foot flat.',
      },
      {
        ru: 'Опустись, пока бедро рабочей ноги не приблизится к параллели с полом, колено смотрит на носок, спина прямая.',
        en: 'Lower until the working thigh is close to parallel, knee tracking over the toes, back flat.',
      },
      {
        ru: 'Оттолкнись рабочей ногой и вернись в исходное положение. Чередуй стороны или делай все повторения на одну ногу.',
        en: 'Push through the working leg to return to the start. Alternate sides or complete all reps on one leg.',
      },
    ],
    cues: [
      { ru: 'Таз назад, как в приседе', en: 'Hips back like a squat' },
      { ru: 'Обе стопы на полу', en: 'Both feet flat' },
      { ru: 'Колено на носок', en: 'Knee over toes' },
    ],
    mistakes: [
      { ru: 'Колено рабочей ноги заваливается внутрь', en: 'Working knee caves inward' },
      {
        ru: 'Носок прямой ноги отрывается или разворачивается вверх',
        en: 'Toes of the straight leg lift or turn up',
      },
      {
        ru: 'Корпус наклоняется вперёд с круглой спиной',
        en: 'Torso folds forward with a rounded back',
      },
    ],
    breathing: {
      ru: 'Вдох на шаге в сторону, выдох на возврате.',
      en: 'Inhale as you step out, exhale as you push back.',
    },
    muscles: ['glutes', 'quads', 'hamstrings', 'core'],
    pattern: 'lunge',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 4.5,
    loadable: false,
    scaling: { easier: 'reverse_lunge' },
    animation: 'lateral_lunge',
    tags: ['lower', 'unilateral', 'mobility'],
  },
  {
    id: 'step_up',
    slug: { ru: 'zashagivaniya-na-vozvyshenie', en: 'step-up' },
    name: { ru: 'Зашагивания на возвышение', en: 'Step-up' },
    shortName: { ru: 'Зашагивания', en: 'Step-up' },
    description: {
      ru: 'Зашагивание — подъём на устойчивый стул, ступеньку или бокс одной ногой. Это простое и очень «честное» упражнение: рабочая нога поднимает всё тело сама, без помощи толчка снизу, поэтому ягодицы и квадрицепсы получают хорошую нагрузку при минимальном стрессе для суставов. Высота опоры регулирует сложность — начни с высоты, при которой колено согнуто не больше чем под прямым углом.',
      en: 'The step-up is a single-leg climb onto a sturdy chair, stair or box. It is a simple, honest exercise: the working leg lifts your entire body without a push from the floor, so glutes and quads get solid work with minimal joint stress. The height of the platform sets the difficulty; start with one where your knee bends no more than 90 degrees.',
    },
    howTo: [
      {
        ru: 'Встань лицом к устойчивой опоре, поставь на неё всю стопу одной ноги, колено над пяткой.',
        en: 'Face a stable platform and place your whole foot on it, knee over the heel.',
      },
      {
        ru: 'Надави стопой на опору и поднимись вверх, полностью выпрямляя рабочую ногу. Нижняя нога не отталкивается от пола.',
        en: 'Press down through that foot and stand up, fully extending the working leg. Do not push off the floor with the bottom leg.',
      },
      {
        ru: 'В верхней точке встань ровно на обе ноги или подними колено свободной ноги к груди.',
        en: 'At the top stand tall on both feet or drive the free knee up toward your chest.',
      },
      {
        ru: 'Медленно опусти свободную ногу назад на пол, контролируя движение рабочей ногой. Сделай все повторения на одну сторону, затем поменяй.',
        en: 'Lower the free leg back to the floor slowly, controlling the descent with the working leg. Finish all reps on one side, then switch.',
      },
    ],
    cues: [
      { ru: 'Вся стопа на опоре', en: 'Whole foot on the platform' },
      { ru: 'Не отталкивайся нижней ногой', en: 'No push from the bottom leg' },
      { ru: 'Опускайся медленно', en: 'Lower slowly' },
    ],
    mistakes: [
      { ru: 'Толчок носком нижней ноги', en: 'Pushing off with the toes of the bottom leg' },
      { ru: 'Колено рабочей ноги уходит внутрь', en: 'Working knee collapsing inward' },
      {
        ru: 'Наклон корпуса вперёд, чтобы помочь себе',
        en: 'Leaning forward to cheat the rep',
      },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох на спуске.',
      en: 'Exhale as you step up, inhale as you step down.',
    },
    muscles: ['quads', 'glutes', 'hamstrings', 'calves'],
    pattern: 'lunge',
    equipment: ['chair', 'box'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 5.5,
    loadable: false,
    scaling: {},
    animation: 'step_up',
    tags: ['lower', 'unilateral'],
  },
  {
    id: 'single_leg_rdl',
    slug: { ru: 'rumynskaya-tyaga-na-odnoy-noge', en: 'single-leg-romanian-deadlift' },
    name: { ru: 'Румынская тяга на одной ноге', en: 'Single-leg Romanian deadlift' },
    shortName: { ru: 'Тяга на одной ноге', en: 'Single-leg RDL' },
    description: {
      ru: 'Румынская тяга на одной ноге — наклон вперёд с опорой на одну ногу, при котором свободная нога уходит назад противовесом. Это лучшее упражнение без оборудования для задней поверхности бедра и ягодиц, а заодно тренировка баланса, стоп и мышц-стабилизаторов таза. Освоив его, ты легко перейдёшь к тягам с гантелями.',
      en: 'The single-leg Romanian deadlift is a forward hinge on one leg, with the free leg swinging back as a counterweight. It is the best equipment-free exercise for the hamstrings and glutes, and it trains balance, foot strength and the hip stabilizers at the same time. Master it and loaded dumbbell hinges will come easily.',
    },
    howTo: [
      {
        ru: 'Встань на одну ногу, колено чуть согнуто, вторая нога рядом на носке. Руки перед собой.',
        en: 'Stand on one leg with a soft knee, the other foot resting lightly on its toes beside it. Arms in front of you.',
      },
      {
        ru: 'Наклоняйся вперёд, отводя таз назад, а свободную ногу — назад и вверх. Спина остаётся прямой, плечи и таз в одной плоскости.',
        en: 'Hinge forward by pushing your hips back while the free leg extends back and up. Keep your back flat and your hips and shoulders square to the floor.',
      },
      {
        ru: 'Опускайся, пока корпус не станет почти параллелен полу или пока не почувствуешь натяжение задней поверхности бедра.',
        en: 'Lower until your torso is close to parallel with the floor or you feel a strong stretch in the hamstring.',
      },
      {
        ru: 'Сожми ягодицу опорной ноги и вернись в вертикальное положение. Сделай все повторения на одну ногу, затем поменяй сторону.',
        en: 'Squeeze the glute of the standing leg to return upright. Finish all reps on one leg, then switch sides.',
      },
    ],
    cues: [
      { ru: 'Таз назад, а не вниз', en: 'Hips back, not down' },
      { ru: 'Спина и нога — одна линия', en: 'Back and leg in one line' },
      { ru: 'Таз не раскрывай', en: 'Keep the hips square' },
    ],
    mistakes: [
      { ru: 'Спина округляется в наклоне', en: 'Rounding the back in the hinge' },
      {
        ru: 'Таз разворачивается вслед за свободной ногой',
        en: 'Hip opens up to follow the free leg',
      },
      {
        ru: 'Слишком сильно сгибается опорное колено — получается присед',
        en: 'Standing knee bends too much so it turns into a squat',
      },
    ],
    breathing: {
      ru: 'Вдох на наклоне, выдох на подъёме.',
      en: 'Inhale as you hinge, exhale as you stand.',
    },
    muscles: ['hamstrings', 'glutes', 'core', 'back'],
    pattern: 'hinge',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 3.5,
    met: 3.8,
    loadable: false,
    scaling: { easier: 'glute_bridge' },
    animation: 'single_leg_rdl',
    tags: ['lower', 'unilateral'],
  },
  {
    id: 'push_up',
    slug: { ru: 'otzhimaniya', en: 'push-up' },
    name: { ru: 'Отжимания', en: 'Push-up' },
    shortName: { ru: 'Отжимания', en: 'Push-up' },
    description: {
      ru: 'Отжимания — главный жим в домашнем тренинге: они развивают грудные мышцы, трицепсы и переднюю часть плеч, а ещё держат всё тело в напряжённой планке. Именно поэтому мы используем максимальное число отжиманий как тест силы верха тела — оно входит в расчёт твоего фитнес-индекса. Если чистых отжиманий пока мало, начни с колен или от опоры — прогресс здесь очень заметен.',
      en: 'The push-up is the core pressing movement of home training: it builds the chest, triceps and front of the shoulders while your whole body holds a rigid plank. That is why the maximum number of push-ups is our upper-body strength test and feeds into your fitness index. If strict reps are few for now, start from the knees or an incline; progress here comes fast.',
    },
    howTo: [
      {
        ru: 'Прими упор лёжа: ладони под плечами или чуть шире, пальцы вперёд, ноги вместе, тело — прямая линия от макушки до пяток.',
        en: 'Set up in a high plank: hands under your shoulders or slightly wider, fingers forward, feet together, body in a straight line from head to heels.',
      },
      {
        ru: 'Сгибай локти под углом примерно 45° к корпусу и опускай грудь к полу, сохраняя прямую линию тела.',
        en: 'Bend your elbows at roughly 45 degrees to your torso and lower your chest toward the floor, keeping the body line rigid.',
      },
      {
        ru: 'Коснись грудью пола или остановись в паре сантиметров от него, локти не расходятся в стороны.',
        en: 'Touch your chest to the floor or stop a few centimetres above it without letting your elbows flare.',
      },
      {
        ru: 'Оттолкнись ладонями и выжми себя вверх до полного выпрямления рук.',
        en: 'Press through your palms and push back up until your arms are fully straight.',
      },
    ],
    cues: [
      { ru: 'Тело — одна линия', en: 'Body in one line' },
      { ru: 'Локти под 45°', en: 'Elbows at 45 degrees' },
      { ru: 'Напряги пресс и ягодицы', en: 'Brace abs and glutes' },
      { ru: 'Полностью выпрямляй руки', en: 'Lock out at the top' },
    ],
    mistakes: [
      { ru: 'Провисает поясница', en: 'Hips sag toward the floor' },
      { ru: 'Таз поднимается вверх «домиком»', en: 'Hips pike up into a tent' },
      {
        ru: 'Неполная амплитуда — грудь не доходит до пола',
        en: 'Half reps: chest never reaches the floor',
      },
    ],
    breathing: {
      ru: 'Вдох на опускании, выдох на жиме вверх.',
      en: 'Inhale on the way down, exhale as you press up.',
    },
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    pattern: 'push_horizontal',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 4.5,
    loadable: false,
    scaling: { easier: 'knee_push_up', harder: 'diamond_push_up' },
    animation: 'push_up',
    tags: ['upper', 'push', 'benchmark'],
    isTest: true,
  },
  {
    id: 'knee_push_up',
    slug: { ru: 'otzhimaniya-s-kolen', en: 'knee-push-up' },
    name: { ru: 'Отжимания с колен', en: 'Knee push-up' },
    shortName: { ru: 'Отжимания с колен', en: 'Knee push-up' },
    description: {
      ru: 'Отжимания с колен убирают из движения вес ног, поэтому груди и трицепсам достаётся примерно на треть меньше нагрузки, чем в классических. Техника при этом та же — прямая линия от коленей до макушки, полная амплитуда, локти под углом. Это официальный вариант нашего теста на отжимания и первая ступень к отжиманиям с носков.',
      en: 'Knee push-ups remove the weight of your legs from the movement, cutting the load on the chest and triceps by roughly a third compared with the full version. The technique is identical: straight line from knees to head, full range, elbows tucked. It is the official option in our push-up test and the first step toward push-ups from the toes.',
    },
    howTo: [
      {
        ru: 'Встань на колени, поставь ладони под плечи, отведи стопы назад или скрести голени. Тело — прямая линия от коленей до головы.',
        en: 'Kneel and place your hands under your shoulders, feet back or ankles crossed. Body in a straight line from knees to head.',
      },
      {
        ru: 'Сгибай локти под углом около 45° к корпусу и опускай грудь к полу, не прогибаясь в пояснице.',
        en: 'Bend your elbows at about 45 degrees to your torso and lower your chest toward the floor without arching your lower back.',
      },
      {
        ru: 'Коснись грудью пола или остановись в паре сантиметров от него.',
        en: 'Touch your chest to the floor or stop a few centimetres above it.',
      },
      {
        ru: 'Выжми себя вверх до полного выпрямления рук, не поднимая таз.',
        en: 'Press back up to fully straight arms, keeping your hips down.',
      },
    ],
    cues: [
      { ru: 'Таз вперёд, не садись назад', en: "Hips forward, don't sit back" },
      { ru: 'Грудь к полу', en: 'Chest to the floor' },
      { ru: 'Локти назад, не в стороны', en: 'Elbows back, not out' },
    ],
    mistakes: [
      {
        ru: 'Таз уходит назад к пяткам — получается наклон, а не жим',
        en: 'Hips drift back toward the heels so it becomes a bow, not a press',
      },
      { ru: 'Прогиб в пояснице', en: 'Lower back sagging' },
      { ru: 'Короткая амплитуда', en: 'Short range of motion' },
    ],
    breathing: {
      ru: 'Вдох на опускании, выдох на жиме вверх.',
      en: 'Inhale on the way down, exhale as you press up.',
    },
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    pattern: 'push_horizontal',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 3.8,
    loadable: false,
    scaling: { easier: 'incline_push_up', harder: 'push_up' },
    animation: 'knee_push_up',
    tags: ['upper', 'push', 'benchmark'],
    isTest: true,
  },
  {
    id: 'incline_push_up',
    slug: { ru: 'otzhimaniya-ot-opory', en: 'incline-push-up' },
    name: { ru: 'Отжимания от опоры', en: 'Incline push-up' },
    shortName: { ru: 'Отжимания от опоры', en: 'Incline push-up' },
    description: {
      ru: 'Отжимания от опоры — от стула, стола или подоконника — самый мягкий вход в жимовые движения: чем выше опора, тем меньше веса приходится на руки. В отличие от отжиманий с колен, здесь ты держишь честную планку всем телом, поэтому корпус учится работать сразу. Постепенно опускай опору ниже — и ты естественно придёшь к отжиманиям от пола.',
      en: 'Incline push-ups against a chair, table or windowsill are the gentlest entry into pressing: the higher the surface, the less of your body weight your arms carry. Unlike knee push-ups you hold a true full-body plank, so your trunk learns to work from day one. Lower the surface over time and you will arrive at floor push-ups naturally.',
    },
    howTo: [
      {
        ru: 'Поставь ладони на край устойчивой опоры чуть шире плеч, отойди ногами назад, пока тело не вытянется в прямую линию.',
        en: 'Place your hands on the edge of a stable surface slightly wider than your shoulders and walk your feet back until your body is a straight line.',
      },
      {
        ru: 'Напряги пресс и ягодицы, сгибай локти под углом около 45° и опускай грудь к краю опоры.',
        en: 'Brace your abs and glutes, bend your elbows at about 45 degrees and lower your chest toward the edge.',
      },
      {
        ru: 'Коснись грудью опоры или остановись в паре сантиметров от неё.',
        en: 'Touch the surface with your chest or stop a few centimetres from it.',
      },
      {
        ru: 'Оттолкнись и выжми себя до полного выпрямления рук, не теряя линию тела.',
        en: 'Push away to fully straight arms without losing the body line.',
      },
    ],
    cues: [
      { ru: 'Тело — прямая доска', en: 'Body like a plank' },
      { ru: 'Опора не должна ездить', en: 'Surface must not slide' },
      { ru: 'Грудь к краю', en: 'Chest to the edge' },
    ],
    mistakes: [
      { ru: 'Таз провисает или поднимается', en: 'Hips sag or pike' },
      { ru: 'Слишком короткая амплитуда', en: 'Range of motion too short' },
      { ru: 'Опора неустойчива и отъезжает', en: 'Surface slides away' },
    ],
    breathing: {
      ru: 'Вдох на опускании, выдох на жиме вверх.',
      en: 'Inhale on the way down, exhale as you press up.',
    },
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    pattern: 'push_horizontal',
    equipment: ['chair'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 3.5,
    loadable: false,
    scaling: { harder: 'knee_push_up' },
    animation: 'incline_push_up',
    tags: ['upper', 'push'],
  },
  {
    id: 'diamond_push_up',
    slug: { ru: 'uzkie-otzhimaniya', en: 'diamond-push-up' },
    name: { ru: 'Узкие отжимания', en: 'Diamond push-up' },
    shortName: { ru: 'Узкие отжимания', en: 'Diamond push-up' },
    description: {
      ru: 'Узкие отжимания — вариант с ладонями под грудью, где большие и указательные пальцы образуют «ромб». Узкая постановка переносит нагрузку с груди на трицепсы и делает каждое повторение заметно тяжелее. Это следующая ступень после классических отжиманий и хорошая подготовка к жимам с гантелями и отжиманиям на брусьях.',
      en: 'The diamond push-up places your hands under your chest with thumbs and index fingers forming a diamond. The narrow grip shifts the load from the chest onto the triceps and makes every rep noticeably harder. It is the next step after regular push-ups and good preparation for dumbbell presses and dips.',
    },
    howTo: [
      {
        ru: 'Прими упор лёжа, поставь ладони вместе под грудью так, чтобы большие и указательные пальцы соприкасались.',
        en: 'Set up in a high plank with your hands together under your chest, thumbs and index fingers touching.',
      },
      {
        ru: 'Прижми локти к корпусу и опускай грудь к кистям, сохраняя прямую линию тела.',
        en: 'Keep your elbows tight to your ribs and lower your chest toward your hands, body in a straight line.',
      },
      {
        ru: 'Коснись грудью ладоней или остановись в паре сантиметров.',
        en: 'Touch your chest to your hands or stop a few centimetres above.',
      },
      {
        ru: 'Выжми себя вверх до полного выпрямления рук, локти по-прежнему смотрят назад.',
        en: 'Press back up to straight arms with the elbows still pointing back.',
      },
    ],
    cues: [
      { ru: 'Локти вдоль корпуса', en: 'Elbows along the body' },
      { ru: 'Грудь на кисти', en: 'Chest to the hands' },
      { ru: 'Корпус жёсткий', en: 'Stay rigid' },
    ],
    mistakes: [
      { ru: 'Локти разъезжаются в стороны', en: 'Elbows flare out' },
      { ru: 'Таз провисает при усталости', en: 'Hips sag as you tire' },
      { ru: 'Голова тянется к полу вместо груди', en: 'Head dips instead of the chest' },
    ],
    breathing: {
      ru: 'Вдох на опускании, выдох на жиме вверх.',
      en: 'Inhale on the way down, exhale as you press up.',
    },
    muscles: ['triceps', 'chest', 'shoulders', 'core'],
    pattern: 'push_horizontal',
    equipment: ['none'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 4.5,
    loadable: false,
    scaling: { easier: 'push_up' },
    animation: 'diamond_push_up',
    tags: ['upper', 'push'],
  },
  {
    id: 'pike_push_up',
    slug: { ru: 'otzhimaniya-ugolkom', en: 'pike-push-up' },
    name: { ru: 'Отжимания уголком', en: 'Pike push-up' },
    shortName: { ru: 'Отжимания уголком', en: 'Pike push-up' },
    description: {
      ru: 'Отжимания уголком — это жим вверх без оборудования: ты поднимаешь таз, ставишь тело «домиком» и отжимаешься так, что нагрузка ложится на плечи и трицепсы. Это домашняя замена жиму стоя и первая ступень к отжиманиям в стойке на руках. Чем ближе стопы к ладоням и выше таз, тем больше нагрузка на плечи.',
      en: 'The pike push-up is an overhead press with no equipment: you lift your hips high into an inverted V and press so that the load lands on your shoulders and triceps. It is the home substitute for a standing press and the first step toward handstand push-ups. The closer your feet are to your hands and the higher your hips, the more your shoulders work.',
    },
    howTo: [
      {
        ru: 'Из упора лёжа подойди стопами к рукам и подними таз вверх — тело образует перевёрнутую букву V, руки и спина на одной линии.',
        en: 'From a high plank walk your feet toward your hands and lift your hips high so your body forms an inverted V, arms and back in one line.',
      },
      {
        ru: 'Сгибай локти и опускай макушку к полу чуть впереди ладоней. Локти идут назад-в стороны, а не разъезжаются широко.',
        en: 'Bend your elbows and lower the top of your head toward the floor just in front of your hands, elbows angled back rather than flaring wide.',
      },
      {
        ru: 'Коснись головой пола или остановись в паре сантиметров.',
        en: 'Touch your head to the floor or stop a few centimetres above it.',
      },
      {
        ru: 'Выжми себя вверх до полного выпрямления рук, сохраняя высокий таз.',
        en: 'Press back up to straight arms, keeping your hips high.',
      },
    ],
    cues: [
      { ru: 'Таз к потолку', en: 'Hips to the ceiling' },
      { ru: 'Голова впереди ладоней', en: 'Head lands in front of the hands' },
      { ru: 'Спина и руки — одна линия', en: 'Arms and back in one line' },
    ],
    mistakes: [
      {
        ru: 'Таз опускается — получаются обычные отжимания',
        en: 'Hips drop so it turns into a regular push-up',
      },
      { ru: 'Спина округляется', en: 'Back rounds' },
      { ru: 'Локти расходятся в стороны', en: 'Elbows flare wide' },
    ],
    breathing: {
      ru: 'Вдох на опускании, выдох на жиме.',
      en: 'Inhale as you lower, exhale as you press.',
    },
    muscles: ['shoulders', 'triceps', 'chest', 'core'],
    pattern: 'push_vertical',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 4.5,
    loadable: false,
    scaling: { easier: 'push_up' },
    animation: 'pike_push_up',
    tags: ['upper', 'push'],
  },
  {
    id: 'chair_dip',
    slug: { ru: 'obratnye-otzhimaniya-ot-stula', en: 'bench-dip' },
    name: { ru: 'Обратные отжимания от стула', en: 'Bench dip' },
    shortName: { ru: 'Обратные отжимания', en: 'Bench dip' },
    description: {
      ru: 'Обратные отжимания от стула нагружают трицепсы и заднюю часть плеч — мышцы, которые в обычных отжиманиях работают вторыми номерами. Ты опираешься руками на край стула сзади и сгибаешь локти, опуская таз к полу. Чем дальше выпрямлены ноги, тем тяжелее; согнутые колени делают упражнение доступным для любого уровня.',
      en: 'Bench dips target the triceps and the rear of the shoulders, muscles that play a supporting role in regular push-ups. You support yourself on the edge of a chair behind you and bend your elbows to lower your hips toward the floor. Straight legs make it harder; bent knees make it accessible at any level.',
    },
    howTo: [
      {
        ru: 'Сядь на край устойчивого стула, возьмись руками за край рядом с бёдрами пальцами вперёд, вынеси таз вперёд за край.',
        en: 'Sit on the edge of a sturdy chair, grip the edge beside your hips with fingers forward, and slide your hips forward off the seat.',
      },
      {
        ru: 'Ноги согни под прямым углом (легче) или выпрями с опорой на пятки (тяжелее). Плечи опущены, грудь раскрыта.',
        en: 'Bend your knees to 90 degrees (easier) or extend your legs onto your heels (harder). Shoulders down, chest open.',
      },
      {
        ru: 'Сгибай локти строго назад и опускай таз, пока плечо не станет параллельно полу, — не ниже, чтобы не перегружать плечевые суставы.',
        en: 'Bend your elbows straight back and lower your hips until your upper arms are parallel to the floor, no deeper, to protect the shoulders.',
      },
      {
        ru: 'Выжми себя вверх до полного выпрямления рук, не пожимая плечами.',
        en: 'Press back up to straight arms without shrugging.',
      },
    ],
    cues: [
      { ru: 'Локти назад, не в стороны', en: 'Elbows back, not out' },
      { ru: 'Плечи вниз', en: 'Shoulders down' },
      { ru: 'Таз близко к стулу', en: 'Hips close to the chair' },
    ],
    mistakes: [
      {
        ru: 'Опускание слишком глубоко — плечи заваливаются вперёд',
        en: 'Dropping too deep so the shoulders roll forward',
      },
      { ru: 'Плечи поднимаются к ушам', en: 'Shrugging the shoulders toward the ears' },
      { ru: 'Таз уезжает далеко от стула', en: 'Hips drifting far from the chair' },
    ],
    breathing: {
      ru: 'Вдох при опускании, выдох при жиме.',
      en: 'Inhale as you lower, exhale as you push up.',
    },
    muscles: ['triceps', 'shoulders', 'chest'],
    pattern: 'push_vertical',
    equipment: ['chair'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 4.0,
    loadable: false,
    scaling: { easier: 'incline_push_up' },
    animation: 'chair_dip',
    tags: ['upper', 'push'],
  },
  {
    id: 'plank_shoulder_tap',
    slug: { ru: 'kasaniya-plech-v-planke', en: 'plank-shoulder-taps' },
    name: { ru: 'Касания плеч в планке', en: 'Plank shoulder taps' },
    shortName: { ru: 'Касания плеч', en: 'Shoulder taps' },
    description: {
      ru: 'Касания плеч в планке — это планка на прямых руках, в которой ты по очереди отрываешь ладони от пола и касаешься противоположного плеча. Каждый раз, когда одна рука уходит, корпус должен удержать таз от раскачивания — так тренируется анти-ротационная сила пресса и стабильность плеч. Считаем каждое касание за одно повторение.',
      en: 'Plank shoulder taps are a high plank in which you lift one hand at a time to touch the opposite shoulder. Every time a hand leaves the floor your core has to stop the hips from swinging, which trains anti-rotation strength and shoulder stability. Each tap counts as one rep.',
    },
    howTo: [
      {
        ru: 'Встань в упор лёжа: ладони под плечами, стопы на ширине плеч или шире, тело — прямая линия.',
        en: 'Set up in a high plank: hands under shoulders, feet shoulder-width or wider, body in a straight line.',
      },
      {
        ru: 'Перенеси вес на одну руку, оторви другую ладонь и коснись ею противоположного плеча.',
        en: 'Shift your weight onto one hand, lift the other and touch the opposite shoulder.',
      },
      {
        ru: 'Верни ладонь на пол и повтори другой рукой. Таз и плечи остаются неподвижными, как будто на спине стоит стакан воды.',
        en: 'Return the hand to the floor and repeat with the other arm. Hips and shoulders stay still, as if a glass of water were balanced on your back.',
      },
      {
        ru: 'Чередуй руки в спокойном темпе до конца подхода.',
        en: 'Alternate arms at a steady pace until the set is done.',
      },
    ],
    cues: [
      { ru: 'Таз не качается', en: "Hips don't rock" },
      { ru: 'Стопы шире — устойчивее', en: 'Wider feet, more stability' },
      { ru: 'Дави в пол опорной рукой', en: 'Push the floor away with the supporting hand' },
    ],
    mistakes: [
      { ru: 'Таз поворачивается вслед за рукой', en: 'Hips rotate with the moving hand' },
      { ru: 'Поясница провисает', en: 'Lower back sags' },
      {
        ru: 'Слишком быстрый темп — касания превращаются в хлопки',
        en: 'Rushing so taps become slaps',
      },
    ],
    breathing: {
      ru: 'Дыши ровно, выдох на каждом касании.',
      en: 'Breathe steadily, exhale on each tap.',
    },
    muscles: ['core', 'obliques', 'shoulders'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 1.5,
    met: 4.0,
    loadable: false,
    scaling: { easier: 'plank' },
    animation: 'plank_shoulder_tap',
    tags: ['core', 'upper'],
  },
  {
    id: 'up_down_plank',
    slug: { ru: 'planka-vverh-vniz', en: 'up-down-plank' },
    name: { ru: 'Планка вверх-вниз', en: 'Up-down plank' },
    shortName: { ru: 'Планка вверх-вниз', en: 'Up-down plank' },
    description: {
      ru: 'Планка вверх-вниз — переход из планки на локтях в планку на прямых руках и обратно, по одной руке за раз. Это одновременно упражнение на пресс, плечи и трицепсы и неплохой разгон пульса, поэтому оно часто стоит в круговых блоках. Главное правило — таз и плечи не крутятся, пока руки меняют положение. Одно повторение — подъём и опускание.',
      en: 'The up-down plank moves you from a forearm plank to a high plank and back, one arm at a time. It works the abs, shoulders and triceps and raises the heart rate, which is why it turns up in circuits. The one rule is that hips and shoulders stay square while the arms change position. One rep is going up and coming back down.',
    },
    howTo: [
      {
        ru: 'Встань в планку на предплечьях: локти под плечами, тело — прямая линия, стопы на ширине плеч.',
        en: 'Start in a forearm plank: elbows under shoulders, body in a straight line, feet shoulder-width apart.',
      },
      {
        ru: 'Поставь правую ладонь на место правого локтя и выжми себя, затем добавь левую руку — ты в упоре лёжа на прямых руках.',
        en: 'Place your right palm where your right elbow was and press up, then add the left hand; you are now in a high plank.',
      },
      {
        ru: 'Вернись вниз в том же порядке: правое предплечье, затем левое.',
        en: 'Return down in the same order: right forearm, then left.',
      },
      {
        ru: 'На следующем повторении начинай с левой руки. Таз держи неподвижным.',
        en: 'Lead with the left arm on the next rep. Keep your hips still throughout.',
      },
    ],
    cues: [
      { ru: 'Меняй ведущую руку', en: 'Alternate the leading arm' },
      { ru: 'Таз ровно', en: 'Hips square' },
      { ru: 'Стопы шире для баланса', en: 'Wider feet for balance' },
    ],
    mistakes: [
      { ru: 'Таз раскачивается из стороны в сторону', en: 'Hips swing side to side' },
      { ru: 'Поясница провисает в упоре на руках', en: 'Lower back sags in the high plank' },
      { ru: 'Ладони ставятся слишком далеко вперёд', en: 'Hands placed too far forward' },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох на опускании.',
      en: 'Exhale as you press up, inhale as you lower.',
    },
    muscles: ['core', 'shoulders', 'triceps', 'chest'],
    pattern: 'push_horizontal',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 4.0,
    met: 5.5,
    loadable: false,
    scaling: { easier: 'plank' },
    animation: 'up_down_plank',
    tags: ['core', 'upper', 'cardio'],
  },
  {
    id: 'burpee',
    slug: { ru: 'berpi', en: 'burpee' },
    name: { ru: 'Бёрпи', en: 'Burpee' },
    shortName: { ru: 'Бёрпи', en: 'Burpee' },
    description: {
      ru: 'Бёрпи — визитная карточка кроссфита: упор лёжа, отжимание, прыжок к ногам и выпрыгивание с хлопком над головой. Оно грузит всё тело сразу и разгоняет пульс быстрее любого другого упражнения без оборудования, поэтому стоит в наших метконах и в тесте на выносливость (бёрпи за 60 секунд). Держи ровный темп — лучше 12 чистых бёрпи, чем 20 корявых.',
      en: "The burpee is CrossFit's signature move: drop to a plank, push-up, jump the feet in, then jump up and clap overhead. It loads the entire body at once and spikes the heart rate faster than any other equipment-free exercise, which is why it lives in our metcons and in the endurance test (burpees in 60 seconds). Keep an even pace; 12 clean burpees beat 20 sloppy ones.",
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы на ширине плеч. Присядь и поставь ладони на пол перед стопами.',
        en: 'Stand tall, feet shoulder-width apart. Squat down and place your hands on the floor in front of your feet.',
      },
      {
        ru: 'Прыжком или шагом уйди ногами назад в упор лёжа, тело — прямая линия.',
        en: 'Jump or step your feet back into a high plank with your body in a straight line.',
      },
      {
        ru: 'Сделай отжимание: грудь касается пола, затем выжми себя вверх.',
        en: 'Do a push-up: chest touches the floor, then press back up.',
      },
      {
        ru: 'Прыжком верни стопы к ладоням, встань и выпрыгни вверх, хлопнув в ладоши над головой.',
        en: 'Jump your feet back toward your hands, stand and jump up, clapping your hands overhead.',
      },
      {
        ru: 'Приземлись мягко и сразу начинай следующее повторение.',
        en: 'Land softly and flow straight into the next rep.',
      },
    ],
    cues: [
      { ru: 'Ровный темп', en: 'Steady rhythm' },
      { ru: 'Грудь до пола', en: 'Chest to the floor' },
      { ru: 'Хлопок над головой', en: 'Clap overhead' },
      { ru: 'Приземляйся мягко', en: 'Land soft' },
    ],
    mistakes: [
      {
        ru: 'Спина округляется при постановке рук',
        en: 'Rounding the back when placing the hands',
      },
      {
        ru: 'Отжимание «змейкой» — таз поднимается раньше груди',
        en: 'Worming the push-up with hips rising before the chest',
      },
      { ru: 'Прыжок без полного выпрямления', en: 'Jumping without full extension' },
    ],
    breathing: {
      ru: 'Выдох на отжимании и на прыжке, вдох в промежутках — дыши без задержек.',
      en: 'Exhale on the push-up and on the jump, inhale in between; never hold your breath.',
    },
    muscles: ['full_body', 'cardio', 'chest', 'quads', 'core'],
    pattern: 'full_body',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 5.0,
    met: 9.0,
    loadable: false,
    scaling: { easier: 'half_burpee' },
    animation: 'burpee',
    tags: ['cardio', 'explosive', 'benchmark'],
    isTest: true,
  },
  {
    id: 'half_burpee',
    slug: { ru: 'poluberpi', en: 'half-burpee' },
    name: { ru: 'Полубёрпи', en: 'Half burpee' },
    shortName: { ru: 'Полубёрпи', en: 'Half burpee' },
    description: {
      ru: 'Полубёрпи — облегчённый вариант бёрпи без отжимания и без прыжка вверх: ты шагаешь или прыгаешь в упор лёжа и возвращаешься в положение стоя. Пульс всё равно растёт, а колени, запястья и плечи получают гораздо меньше нагрузки. Это отличный вход в бёрпи для новичков и разумная замена, когда нужно сохранить темп в длинном меткон-блоке.',
      en: 'The half burpee is a simplified burpee with no push-up and no jump: you step or hop back into a plank and return to standing. The heart rate still climbs while knees, wrists and shoulders take far less strain. It is the ideal entry point to burpees for beginners and a sensible substitute when you need to keep moving in a long metcon.',
    },
    howTo: [
      {
        ru: 'Встань прямо, присядь и поставь ладони на пол перед стопами.',
        en: 'Stand tall, squat down and place your hands on the floor in front of your feet.',
      },
      {
        ru: 'Шагни или прыгни ногами назад в упор лёжа, тело — прямая линия, таз не провисает.',
        en: 'Step or hop your feet back into a high plank, body straight, hips not sagging.',
      },
      {
        ru: 'Шагом или прыжком верни стопы к ладоням.',
        en: 'Step or hop your feet back toward your hands.',
      },
      {
        ru: 'Встань в полный рост, выпрямляя колени и бёдра, — это одно повторение.',
        en: 'Stand all the way up, extending knees and hips fully; that is one rep.',
      },
    ],
    cues: [
      { ru: 'Шагай, если прыгать тяжело', en: 'Step if hopping is too much' },
      { ru: 'Тело прямое в упоре', en: 'Straight body in the plank' },
      { ru: 'Полное разгибание наверху', en: 'Stand fully tall' },
    ],
    mistakes: [
      { ru: 'Таз провисает в упоре лёжа', en: 'Hips sag in the plank' },
      { ru: 'Неполное выпрямление наверху', en: 'Not standing fully upright' },
      { ru: 'Ладони ставятся слишком далеко от стоп', en: 'Hands placed too far from the feet' },
    ],
    breathing: {
      ru: 'Выдох, когда встаёшь; вдох, уходя в упор.',
      en: 'Exhale as you stand up, inhale as you go down.',
    },
    muscles: ['full_body', 'cardio', 'quads', 'core'],
    pattern: 'full_body',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 4.0,
    met: 7.0,
    loadable: false,
    scaling: { harder: 'burpee' },
    animation: 'half_burpee',
    tags: ['cardio'],
  },
  {
    id: 'broad_jump',
    slug: { ru: 'pryzhok-v-dlinu-s-mesta', en: 'broad-jump' },
    name: { ru: 'Прыжок в длину с места', en: 'Broad jump' },
    shortName: { ru: 'Прыжок в длину', en: 'Broad jump' },
    description: {
      ru: 'Прыжок в длину с места — базовое упражнение на взрывную силу ног: замах руками, мощное разгибание бёдер и полёт вперёд с мягким приземлением в присед. Он учит выдавать максимум силы за короткое время и правильно гасить удар, что переносится на любой прыжок, бег и подъём тяжестей. Прыгай на максимум, но каждое приземление должно быть устойчивым — без шага и подскока.',
      en: 'The standing broad jump is the basic test of lower-body power: an arm swing, a violent hip extension and a flight forward into a soft squat landing. It teaches you to produce maximal force in a split second and to absorb impact correctly, skills that transfer to every jump, sprint and lift. Jump for distance, but every landing must be stable, with no extra step or hop.',
    },
    howTo: [
      {
        ru: 'Встань, стопы на ширине плеч, руки подняты вперёд.',
        en: 'Stand with your feet shoulder-width apart, arms raised in front of you.',
      },
      {
        ru: 'Быстро отведи руки назад, отводя таз назад и сгибая колени, как перед прыжком.',
        en: 'Swing your arms back quickly while pushing your hips back and bending your knees, loading the jump.',
      },
      {
        ru: 'Мощно махни руками вперёд-вверх и оттолкнись обеими ногами, выпрямляя бёдра, колени и голеностопы.',
        en: 'Drive your arms forward and up and push off with both legs, extending hips, knees and ankles fully.',
      },
      {
        ru: 'Приземлись на обе стопы в присед, колени согнуты и смотрят на носки, зафиксируй положение на секунду, затем вернись назад шагом.',
        en: 'Land on both feet in a squat, knees bent and tracking over toes, stick it for a second, then walk back.',
      },
    ],
    cues: [
      { ru: 'Замах руками', en: 'Big arm swing' },
      { ru: 'Разгибайся полностью', en: 'Extend all the way' },
      { ru: 'Приземляйся в присед', en: 'Land in a squat' },
    ],
    mistakes: [
      { ru: 'Приземление на прямые ноги', en: 'Landing on straight legs' },
      { ru: 'Колени сходятся внутрь при приземлении', en: 'Knees knocking together on landing' },
      { ru: 'Прыжок без замаха руками — теряется мощность', en: 'No arm swing so power is lost' },
    ],
    breathing: {
      ru: 'Вдох на замахе, резкий выдох на прыжке.',
      en: 'Inhale on the wind-up, sharp exhale as you jump.',
    },
    muscles: ['glutes', 'quads', 'hamstrings', 'calves'],
    pattern: 'jump',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 4.0,
    met: 7.5,
    loadable: false,
    scaling: { easier: 'air_squat' },
    animation: 'broad_jump',
    tags: ['lower', 'explosive'],
  },
  {
    id: 'tuck_jump',
    slug: { ru: 'pryzhok-s-podtyagivaniem-koleney', en: 'tuck-jump' },
    name: { ru: 'Прыжок с подтягиванием коленей', en: 'Tuck jump' },
    shortName: { ru: 'Колени к груди', en: 'Tuck jump' },
    description: {
      ru: 'Прыжок с подтягиванием коленей — вертикальный прыжок, в котором ты подтягиваешь колени к груди в верхней точке. Это самое интенсивное плиометрическое упражнение без оборудования: ноги, пресс и сердце работают на пределе. Ставим его коротко и только к концу интервального блока, когда техника мягкого приземления уже надёжна.',
      en: 'The tuck jump is a vertical jump in which you pull your knees up to your chest at the top. It is the most intense plyometric exercise you can do without equipment: legs, abs and heart all work near their limit. We program it in short doses and only once your soft-landing technique is reliable.',
    },
    howTo: [
      {
        ru: 'Встань, стопы на ширине таза, руки перед собой на уровне груди.',
        en: 'Stand with feet hip-width apart, hands in front of your chest.',
      },
      {
        ru: 'Коротко подсядь и мощно выпрыгни вверх.',
        en: 'Dip briefly and jump straight up as high as you can.',
      },
      {
        ru: 'В верхней точке подтяни колени к груди, спина прямая, ладони встречают колени.',
        en: 'At the top pull your knees up toward your chest, back straight, hands meeting the knees.',
      },
      {
        ru: 'Выпрями ноги перед приземлением, приземлись мягко на всю стопу с согнутыми коленями и сразу выпрыгивай снова.',
        en: 'Straighten your legs before landing, land softly on the whole foot with bent knees and immediately jump again.',
      },
    ],
    cues: [
      { ru: 'Колени к груди, а не грудь к коленям', en: 'Knees up, not chest down' },
      { ru: 'Тихое приземление', en: 'Silent landing' },
      { ru: 'Прыгай ритмично', en: 'Keep a rhythm' },
    ],
    mistakes: [
      {
        ru: 'Корпус складывается вперёд вместо подъёма коленей',
        en: 'Torso folding forward instead of lifting the knees',
      },
      { ru: 'Жёсткое приземление на прямые ноги', en: 'Stiff landing on straight legs' },
      {
        ru: 'Пауза и «перезагрузка» перед каждым прыжком',
        en: 'Pausing to reset before every jump',
      },
    ],
    breathing: {
      ru: 'Резкий выдох на прыжке, вдох при приземлении.',
      en: 'Sharp exhale on the jump, inhale on landing.',
    },
    muscles: ['quads', 'glutes', 'calves', 'hip_flexors', 'core', 'cardio'],
    pattern: 'jump',
    equipment: ['none'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 1.5,
    met: 8.5,
    loadable: false,
    scaling: { easier: 'jump_squat' },
    animation: 'tuck_jump',
    tags: ['lower', 'explosive', 'cardio'],
  },
  {
    id: 'squat_to_stand',
    slug: { ru: 'prised-razgibanie', en: 'squat-to-stand' },
    name: { ru: 'Присед-разгибание', en: 'Squat to stand' },
    shortName: { ru: 'Присед-разгибание', en: 'Squat to stand' },
    description: {
      ru: 'Присед-разгибание — разминочное упражнение, которое за одно движение раскрывает тазобедренные суставы, голеностопы и заднюю поверхность бедра. Ты наклоняешься, берёшься за носки, «садишься» в глубокий присед с прямой спиной и затем разгибаешь ноги, не отпуская стопы. Несколько повторений перед тренировкой — и приседания получаются глубже и увереннее.',
      en: 'The squat to stand is a warm-up drill that opens the hips, ankles and hamstrings in one motion. You fold forward, grab your toes, pull yourself into a deep squat with a tall chest, then straighten your legs while holding on to your feet. A few reps before training and your squats get deeper and more confident.',
    },
    howTo: [
      {
        ru: 'Встань, стопы чуть шире плеч, носки слегка наружу.',
        en: 'Stand with your feet slightly wider than shoulder-width, toes turned out a little.',
      },
      {
        ru: 'Наклонись вперёд с прямыми или чуть согнутыми ногами и возьмись руками за носки.',
        en: 'Fold forward with straight or slightly bent legs and grab your toes.',
      },
      {
        ru: 'Не отпуская стопы, опусти таз в глубокий присед, раскрой грудь, локтями раздвинь колени наружу.',
        en: 'Holding your feet, drop your hips into a deep squat, lift your chest and use your elbows to push the knees out.',
      },
      {
        ru: 'Держа носки, поднимай таз вверх и выпрямляй ноги, растягивая заднюю поверхность бедра. Повтори.',
        en: 'Still holding your toes, lift your hips and straighten your legs to stretch the hamstrings. Repeat.',
      },
    ],
    cues: [
      { ru: 'Грудь вверх в приседе', en: 'Chest up in the squat' },
      { ru: 'Локти раздвигают колени', en: 'Elbows push knees out' },
      { ru: 'Пятки на полу', en: 'Heels stay down' },
    ],
    mistakes: [
      { ru: 'Спина остаётся круглой в нижней точке', en: 'Back stays rounded at the bottom' },
      { ru: 'Пятки отрываются от пола', en: 'Heels lift off the floor' },
      { ru: 'Движение делается рывками', en: 'Rushing through the positions' },
    ],
    breathing: {
      ru: 'Вдох, опускаясь в присед, длинный выдох при разгибании ног.',
      en: 'Inhale as you sink into the squat, long exhale as you straighten the legs.',
    },
    muscles: ['hamstrings', 'glutes', 'quads', 'back'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 5.0,
    met: 3.0,
    loadable: false,
    scaling: {},
    animation: 'squat_to_stand',
    tags: ['warmup', 'mobility', 'lower'],
  },
  {
    id: 'inchworm',
    slug: { ru: 'gusenitsa', en: 'inchworm' },
    name: { ru: 'Гусеница', en: 'Inchworm' },
    shortName: { ru: 'Гусеница', en: 'Inchworm' },
    description: {
      ru: 'Гусеница — разминочное движение на всё тело: наклон, «шаги» ладонями вперёд до планки и обратные шаги стопами к рукам. Оно разогревает плечи, пресс и заднюю поверхность бедра и готовит запястья к отжиманиям и бёрпи. Отличный первый пункт разминки перед любой тренировкой без оборудования.',
      en: 'The inchworm is a whole-body warm-up: fold forward, walk your hands out to a plank and walk your feet back to your hands. It warms the shoulders, core and hamstrings and gets your wrists ready for push-ups and burpees. A great opener for any equipment-free session.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы на ширине таза. Наклонись и поставь ладони на пол перед стопами, колени можно чуть согнуть.',
        en: 'Stand tall, feet hip-width apart. Fold forward and place your hands on the floor in front of your feet, knees slightly bent if needed.',
      },
      {
        ru: 'Мелкими шагами иди ладонями вперёд, пока не окажешься в упоре лёжа с прямым телом.',
        en: 'Walk your hands forward in small steps until you reach a high plank with a straight body.',
      },
      {
        ru: 'Задержись в планке на секунду, напрягая пресс, затем мелкими шагами иди стопами к ладоням, держа ноги как можно прямее.',
        en: 'Hold the plank for a second with your abs braced, then walk your feet toward your hands in small steps, keeping your legs as straight as you can.',
      },
      {
        ru: 'Выпрямись в положение стоя — это одно повторение.',
        en: 'Stand all the way up; that is one rep.',
      },
    ],
    cues: [
      { ru: 'Короткие шаги руками', en: 'Small hand steps' },
      { ru: 'В планке — прямая линия', en: 'Straight line in the plank' },
      { ru: 'Ноги прямые на обратном пути', en: 'Straight legs walking back' },
    ],
    mistakes: [
      { ru: 'Поясница провисает в планке', en: 'Lower back sagging in the plank' },
      { ru: 'Слишком большие шаги — теряется контроль', en: 'Steps too big so control is lost' },
      {
        ru: 'Стопы уходят далеко назад вместо ладоней вперёд',
        en: 'Walking the feet back instead of the hands forward',
      },
    ],
    breathing: {
      ru: 'Дыши ровно, выдох на подходе к планке.',
      en: 'Breathe steadily, exhale as you reach the plank.',
    },
    muscles: ['core', 'shoulders', 'hamstrings', 'full_body'],
    pattern: 'full_body',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 6.0,
    met: 3.8,
    loadable: false,
    scaling: {},
    animation: 'inchworm',
    tags: ['warmup', 'mobility'],
  },
];
