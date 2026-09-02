/**
 * Exercise library, file B: bodyweight core, conditioning (locomotion / jumps) and mobility
 * (warm-up and cool-down). Ids, animation ids, units, equipment and levels are referenced by
 * courses and animations — keep them stable. Copy is shown in the workout player and on the
 * public /exercises/<slug>/ pages.
 */
import type { ExerciseInput } from '@/content/schema';

export const EXERCISES_B: ExerciseInput[] = [
  {
    id: 'plank',
    slug: { ru: 'planka', en: 'plank' },
    name: { ru: 'Планка', en: 'Plank' },
    shortName: { ru: 'Планка', en: 'Plank' },
    description: {
      ru: 'Планка — базовое статическое упражнение на мышцы кора: ты удерживаешь тело в прямой линии на предплечьях и носках, а пресс, ягодицы и спина не дают пояснице провиснуть. Именно это умение «держать корпус» нужно в приседаниях, отжиманиях и любом движении с гантелями. В тесте мы засекаем максимальное время удержания — простой и честный показатель выносливости кора.',
      en: 'The plank is the foundational static core exercise: you hold your body in a straight line on your forearms and toes while the abs, glutes and back stop the lower back from sagging. That ability to brace the trunk is exactly what squats, push-ups and every dumbbell movement rely on. In the test we time your maximum hold — a simple, honest measure of core endurance.',
    },
    howTo: [
      {
        ru: 'Встань на предплечья и носки: локти строго под плечами, предплечья параллельны, кулаки или ладони на полу.',
        en: 'Set up on your forearms and toes: elbows directly under your shoulders, forearms parallel, fists or palms on the floor.',
      },
      {
        ru: 'Выстрой тело в одну линию от затылка до пяток — таз не задран и не провисает, взгляд в пол чуть впереди кистей.',
        en: 'Line your body up from the back of the head to the heels — hips neither piked up nor sagging, eyes on the floor just ahead of your hands.',
      },
      {
        ru: 'Напряги пресс, как перед ударом в живот, сожми ягодицы и подтяни колени вверх — тело становится жёстким.',
        en: 'Brace your abs as if about to take a punch, squeeze your glutes and pull your kneecaps up so the whole body turns rigid.',
      },
      {
        ru: 'Держи положение заданное время, дыши ровно и неглубоко; если таз начал опускаться — подход закончен.',
        en: 'Hold for the prescribed time with steady, shallow breaths; the moment your hips start to drop, the set is over.',
      },
    ],
    cues: [
      { ru: 'Локти под плечами', en: 'Elbows under shoulders' },
      { ru: 'Таз подкручен, ягодицы сжаты', en: 'Tuck the hips, squeeze the glutes' },
      { ru: 'Тело — одна линия', en: 'One straight line' },
      { ru: 'Дыши', en: 'Keep breathing' },
    ],
    mistakes: [
      { ru: 'Таз провисает, поясница прогибается', en: 'Hips sag and the lower back arches' },
      {
        ru: 'Таз задран вверх — нагрузка уходит с пресса',
        en: 'Hips piked up so the abs stop working',
      },
      { ru: 'Голова свисает или запрокинута', en: 'Head hanging down or craned up' },
    ],
    breathing: {
      ru: 'Ровное неглубокое дыхание животом, без задержек.',
      en: 'Steady shallow belly breathing; never hold your breath.',
    },
    muscles: ['core', 'shoulders', 'glutes'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 3.0,
    loadable: false,
    scaling: { harder: 'side_plank' },
    animation: 'plank',
    tags: ['core', 'benchmark'],
    isTest: true,
  },
  {
    id: 'side_plank',
    slug: { ru: 'bokovaya-planka', en: 'side-plank' },
    name: { ru: 'Боковая планка', en: 'Side plank' },
    shortName: { ru: 'Боковая планка', en: 'Side plank' },
    description: {
      ru: 'Боковая планка нагружает косые мышцы живота и боковую стабильность корпуса — то, что обычная планка почти не трогает. Она укрепляет мышцы, которые не дают тазу и пояснице «уезжать» в сторону при выпадах, беге и переносе веса в одной руке. Делается на каждую сторону — время в задании указано на одну сторону.',
      en: 'The side plank targets the obliques and the lateral stability of the trunk — the part the regular plank barely touches. It strengthens the muscles that stop your pelvis and lower back from drifting sideways in lunges, running and one-arm carries. It is done on each side; the time in the workout is per side.',
    },
    howTo: [
      {
        ru: 'Ляг на бок, поставь локоть строго под плечо, предплечье перпендикулярно телу. Ноги прямые, стопы одна на другой или верхняя чуть впереди.',
        en: 'Lie on your side and place your elbow directly under your shoulder, forearm perpendicular to your body. Legs straight, feet stacked or the top foot slightly in front.',
      },
      {
        ru: 'Оторви таз от пола и вытяни тело в одну линию от макушки до стоп; опора — предплечье и внешний край нижней стопы.',
        en: 'Lift your hips off the floor and stretch your body into one line from head to feet; you are supported on the forearm and the outer edge of the bottom foot.',
      },
      {
        ru: 'Верхнюю руку положи на бедро или подними вверх. Нижнее плечо не проваливается — активно отталкивайся от пола предплечьем.',
        en: 'Rest the top hand on your hip or reach it to the ceiling. Keep the bottom shoulder from sinking by actively pushing the floor away with the forearm.',
      },
      {
        ru: 'Держи заданное время, затем плавно опусти таз и повтори на другую сторону.',
        en: 'Hold for the prescribed time, then lower your hips under control and repeat on the other side.',
      },
    ],
    cues: [
      { ru: 'Таз вверх и вперёд', en: 'Hips up and forward' },
      { ru: 'Отталкивай пол плечом', en: 'Push the floor away' },
      { ru: 'Не заваливайся назад', en: 'Do not roll back' },
    ],
    mistakes: [
      { ru: 'Таз опускается к полу', en: 'Hips dropping toward the floor' },
      { ru: 'Корпус разворачивается вперёд или назад', en: 'Trunk rotating forward or back' },
      { ru: 'Нижнее плечо «проваливается» к уху', en: 'Bottom shoulder collapsing toward the ear' },
    ],
    breathing: {
      ru: 'Дыши ровно, выдох — в момент, когда особенно тяжело держать.',
      en: 'Breathe evenly; exhale through the hardest moments of the hold.',
    },
    muscles: ['obliques', 'core', 'shoulders', 'glutes'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 2,
    unit: 'seconds',
    met: 3.0,
    loadable: false,
    scaling: { easier: 'plank' },
    animation: 'side_plank',
    tags: ['core', 'unilateral'],
  },
  {
    id: 'hollow_hold',
    slug: { ru: 'lodochka', en: 'hollow-hold' },
    name: { ru: 'Лодочка (hollow hold)', en: 'Hollow hold' },
    shortName: { ru: 'Лодочка', en: 'Hollow hold' },
    description: {
      ru: 'Лодочка — гимнастическое удержание, в котором поясница прижата к полу, а руки и ноги вытянуты и висят над полом. Это лучший способ научиться держать пресс «замком» и не прогибать спину; такое положение тела нужно в отжиманиях, подтягиваниях и любом движении над головой. Нагрузка регулируется просто: чем ближе руки и ноги к полу, тем тяжелее.',
      en: 'The hollow hold is a gymnastics position: lower back pressed into the floor, arms and legs extended and hovering above it. It is the best way to learn to lock the abs and stop the spine from arching — the exact body position you need in push-ups, pull-ups and anything overhead. Difficulty is easy to dial: the closer your arms and legs are to the floor, the harder it gets.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, ноги вместе, руки вдоль тела. Прижми поясницу к полу — между спиной и полом не должна проходить ладонь.',
        en: 'Lie on your back, legs together, arms by your sides. Press your lower back into the floor so a hand could not slide underneath.',
      },
      {
        ru: 'Приподними плечи и лопатки от пола, подбородок чуть к груди, руки вытяни вдоль тела или за голову.',
        en: 'Lift your shoulders and shoulder blades off the floor, chin slightly tucked, arms extended by your sides or overhead.',
      },
      {
        ru: 'Подними прямые ноги на 20–30 см от пола, носки натянуты. Тело — форма пологой лодки, поясница по-прежнему прижата.',
        en: 'Raise your straight legs 20–30 cm off the floor, toes pointed. Your body forms a shallow boat shape with the lower back still glued down.',
      },
      {
        ru: 'Держи заданное время. Если поясница отрывается — подними ноги выше или согни колени, но не прогибайся.',
        en: 'Hold for the prescribed time. If the lower back lifts, raise your legs higher or bend your knees — never let the back arch.',
      },
    ],
    cues: [
      { ru: 'Поясница в пол', en: 'Lower back into the floor' },
      { ru: 'Рёбра вниз', en: 'Ribs down' },
      { ru: 'Носки натянуты', en: 'Point the toes' },
    ],
    mistakes: [
      {
        ru: 'Поясница отрывается от пола — прогиб',
        en: 'Lower back lifts off the floor into an arch',
      },
      { ru: 'Подбородок задран, шея напряжена', en: 'Chin jutting up and the neck straining' },
      {
        ru: 'Ноги слишком низко для твоего уровня',
        en: 'Legs held too low for your current strength',
      },
    ],
    breathing: {
      ru: 'Короткие ровные вдохи и выдохи, не задерживай дыхание.',
      en: 'Short, even breaths in and out; do not hold your breath.',
    },
    muscles: ['core', 'hip_flexors', 'quads'],
    pattern: 'core_flexion',
    equipment: ['none'],
    level: 2,
    unit: 'seconds',
    met: 3.5,
    loadable: false,
    scaling: { easier: 'dead_bug', harder: 'v_up' },
    animation: 'hollow_hold',
    tags: ['core'],
  },
  {
    id: 'superman',
    slug: { ru: 'supermen', en: 'superman' },
    name: { ru: 'Супермен', en: 'Superman' },
    shortName: { ru: 'Супермен', en: 'Superman' },
    description: {
      ru: 'Супермен — подъём рук и ног лёжа на животе. Он укрепляет разгибатели спины, ягодицы и заднюю поверхность плеч — мышцы, которые держат осанку и защищают поясницу в тягах и наклонах. Мы ставим его в разминку и в блоки на кор как противовес планкам и скручиваниям: спина должна быть такой же сильной, как пресс.',
      en: 'The superman is a prone lift of the arms and legs. It strengthens the spinal erectors, glutes and rear shoulders — the muscles that hold your posture and protect the lower back in deadlifts and hinges. We put it in warm-ups and core blocks as the counterweight to planks and crunches: the back should be as strong as the abs.',
    },
    howTo: [
      {
        ru: 'Ляг на живот, руки вытяни вперёд, ноги прямые, лоб смотрит в пол.',
        en: 'Lie face down with your arms extended overhead, legs straight, forehead toward the floor.',
      },
      {
        ru: 'Одновременно подними руки, грудь и ноги от пола, напрягая ягодицы и мышцы спины. Шея — продолжение позвоночника, не задирай голову.',
        en: 'Lift your arms, chest and legs off the floor at the same time, squeezing your glutes and back muscles. Keep your neck in line with your spine — do not crane your head up.',
      },
      {
        ru: 'Задержись в верхней точке на 1–2 секунды, тянись руками вперёд, а ногами назад — в длину, а не в высоту.',
        en: 'Pause at the top for 1–2 seconds, reaching long with the arms forward and the legs back — think length, not height.',
      },
      {
        ru: 'Плавно опустись на пол и повтори.',
        en: 'Lower back to the floor under control and repeat.',
      },
    ],
    cues: [
      { ru: 'Тянись в длину', en: 'Reach long' },
      { ru: 'Ягодицы сжаты', en: 'Squeeze the glutes' },
      { ru: 'Взгляд в пол', en: 'Eyes on the floor' },
    ],
    mistakes: [
      { ru: 'Голова запрокинута, шея перегружена', en: 'Head thrown back, straining the neck' },
      { ru: 'Рывок вместо плавного подъёма', en: 'Jerking up instead of lifting smoothly' },
      { ru: 'Колени сгибаются', en: 'Knees bending' },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох при опускании.',
      en: 'Exhale as you lift, inhale as you lower.',
    },
    muscles: ['back', 'glutes', 'hamstrings', 'shoulders'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 3.5,
    loadable: false,
    scaling: {},
    animation: 'superman',
    tags: ['core', 'warmup'],
  },
  {
    id: 'sit_up',
    slug: { ru: 'sitap', en: 'sit-up' },
    name: { ru: 'Ситап', en: 'Sit-up' },
    shortName: { ru: 'Ситап', en: 'Sit-up' },
    description: {
      ru: 'Ситап — классическое динамическое упражнение на пресс: из положения лёжа ты поднимаешься в сед и возвращаешься назад. В отличие от короткого скручивания здесь работают и прямая мышца живота, и сгибатели бедра в полной амплитуде, поэтому ситапы — стандарт в кроссфит-комплексах. Делай их плавно и без рывков — так спина остаётся в безопасности, а пресс получает всю нагрузку.',
      en: 'The sit-up is the classic dynamic abs exercise: from lying on your back you rise to a seated position and return. Unlike a short crunch it works the rectus abdominis and the hip flexors through a full range, which is why sit-ups are a staple of CrossFit workouts. Do them smoothly and without jerking so the spine stays safe and the abs get all the work.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, колени согнуты, стопы на полу на ширине таза, руки скрещены на груди или вытянуты вперёд.',
        en: 'Lie on your back with knees bent, feet flat and hip-width apart, arms crossed on your chest or reaching forward.',
      },
      {
        ru: 'Подбородок чуть к груди, напряги пресс и начни отрывать от пола голову, плечи и лопатки, скручиваясь позвонок за позвонком.',
        en: 'Tuck your chin slightly, brace your abs and start peeling your head, shoulders and shoulder blades off the floor, curling up one vertebra at a time.',
      },
      {
        ru: 'Поднимись до положения сидя, грудь тянется к коленям, стопы остаются на полу.',
        en: 'Rise all the way to sitting, chest toward your knees, feet staying on the floor.',
      },
      {
        ru: 'Плавно опустись назад по той же траектории, пока лопатки не коснутся пола, и начни следующее повторение.',
        en: 'Lower back down along the same path until your shoulder blades touch the floor, then begin the next rep.',
      },
    ],
    cues: [
      { ru: 'Скручивайся, а не поднимайся палкой', en: "Curl up, don't rise like a board" },
      { ru: 'Подбородок к груди', en: 'Chin tucked' },
      { ru: 'Стопы на полу', en: 'Feet stay down' },
    ],
    mistakes: [
      {
        ru: 'Рывок руками и шеей вместо работы пресса',
        en: 'Yanking with the arms and neck instead of using the abs',
      },
      { ru: 'Падение назад без контроля', en: 'Dropping back down without control' },
      {
        ru: 'Стопы отрываются, ноги дёргают вверх',
        en: 'Feet lifting off and the legs kicking up',
      },
    ],
    breathing: {
      ru: 'Выдох на подъёме, вдох при опускании.',
      en: 'Exhale as you rise, inhale on the way down.',
    },
    muscles: ['core', 'hip_flexors'],
    pattern: 'core_flexion',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 3.8,
    loadable: false,
    scaling: { harder: 'v_up' },
    animation: 'sit_up',
    tags: ['core'],
  },
  {
    id: 'v_up',
    slug: { ru: 'skladka', en: 'v-up' },
    name: { ru: 'Складка', en: 'V-up' },
    shortName: { ru: 'Складка', en: 'V-up' },
    description: {
      ru: 'Складка — продвинутый вариант ситапа: ты одновременно поднимаешь прямые ноги и корпус, складываясь в букву V, и касаешься руками стоп. Это одно из самых сильных упражнений на пресс без оборудования: работает весь корпус, сгибатели бедра и координация. Требует хорошей «лодочки» и умения держать поясницу — если это пока не про тебя, делай ситапы.',
      en: 'The V-up is the advanced sit-up: you lift your straight legs and your trunk at the same time, folding into a V and touching your feet. It is one of the strongest equipment-free abs exercises, working the whole trunk, the hip flexors and your coordination. It needs a solid hollow hold and control of the lower back — if you are not there yet, stick with sit-ups.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, руки вытяни за голову, ноги прямые и вместе, поясница прижата к полу.',
        en: 'Lie on your back, arms extended overhead, legs straight and together, lower back pressed into the floor.',
      },
      {
        ru: 'Одним движением подними прямые ноги и корпус навстречу друг другу, руки тянутся к стопам.',
        en: 'In one motion lift your straight legs and your trunk toward each other, hands reaching for your feet.',
      },
      {
        ru: 'В верхней точке тело образует букву V, опора — только на таз; коснись голеней или стоп.',
        en: 'At the top your body forms a V balanced on your hips; touch your shins or feet.',
      },
      {
        ru: 'Плавно и одновременно опусти руки и ноги, не бросая их на пол, и сразу иди в следующее повторение.',
        en: 'Lower arms and legs together under control, without dropping them, and move straight into the next rep.',
      },
    ],
    cues: [
      { ru: 'Ноги и корпус вместе', en: 'Legs and trunk together' },
      { ru: 'Ноги прямые', en: 'Legs straight' },
      { ru: 'Опускайся, а не падай', en: "Lower, don't drop" },
    ],
    mistakes: [
      {
        ru: 'Согнутые колени вместо прямых ног',
        en: 'Bending the knees instead of keeping the legs straight',
      },
      {
        ru: 'Рывок поясницей и прогиб внизу',
        en: 'Jerking from the lower back and arching at the bottom',
      },
      {
        ru: 'Пятки бьются о пол при опускании',
        en: 'Heels slamming into the floor on the way down',
      },
    ],
    breathing: {
      ru: 'Резкий выдох на подъёме, вдох при опускании.',
      en: 'Sharp exhale as you fold up, inhale as you lower.',
    },
    muscles: ['core', 'hip_flexors', 'quads'],
    pattern: 'core_flexion',
    equipment: ['none'],
    level: 3,
    unit: 'reps',
    secondsPerRep: 2.5,
    met: 6.0,
    loadable: false,
    scaling: { easier: 'sit_up' },
    animation: 'v_up',
    tags: ['core', 'explosive'],
  },
  {
    id: 'leg_raise',
    slug: { ru: 'podem-nog-lezha', en: 'lying-leg-raise' },
    name: { ru: 'Подъём ног лёжа', en: 'Lying leg raise' },
    shortName: { ru: 'Подъём ног', en: 'Leg raise' },
    description: {
      ru: 'Подъём ног лёжа тренирует нижнюю часть пресса и сгибатели бедра, а главное — умение держать поясницу прижатой, когда ноги тянут её в прогиб. Это подводящее упражнение к подъёмам коленей и ног в висе. Всё решает контроль на опускании: чем медленнее ноги идут вниз, тем больше пользы.',
      en: 'The lying leg raise trains the lower abs and hip flexors, and above all the skill of keeping your lower back pressed down while your legs try to pull it into an arch. It leads directly into hanging knee and leg raises. Control on the way down is everything: the slower the legs descend, the more you get from each rep.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, ноги прямые, руки вдоль тела ладонями вниз или под ягодицами. Прижми поясницу к полу.',
        en: 'Lie on your back, legs straight, arms by your sides with palms down or tucked under your glutes. Press your lower back into the floor.',
      },
      {
        ru: 'Напряги пресс и подними прямые ноги до вертикали или пока таз не начнёт отрываться от пола.',
        en: 'Brace your abs and raise your straight legs to vertical, or until your pelvis is about to lift off the floor.',
      },
      {
        ru: 'Медленно опусти ноги вниз, продолжая прижимать поясницу; остановись за 5–10 см до пола.',
        en: 'Lower your legs slowly, keeping the lower back pressed down; stop 5–10 cm above the floor.',
      },
      {
        ru: 'Не касаясь пола, начни следующее повторение. Если поясница отрывается — согни колени.',
        en: 'Without touching down, start the next rep. If the lower back lifts, bend your knees.',
      },
    ],
    cues: [
      { ru: 'Поясница прижата', en: 'Lower back stays down' },
      { ru: 'Опускай медленно', en: 'Lower slowly' },
      { ru: 'Ноги не касаются пола', en: 'Feet never touch down' },
    ],
    mistakes: [
      {
        ru: 'Прогиб в пояснице при опускании ног',
        en: 'Lower back arching as the legs come down',
      },
      { ru: 'Раскачивание и рывок вверх', en: 'Swinging and jerking the legs up' },
      {
        ru: 'Ноги падают на пол между повторениями',
        en: 'Legs dropping to the floor between reps',
      },
    ],
    breathing: {
      ru: 'Выдох при подъёме ног, вдох при опускании.',
      en: 'Exhale as the legs rise, inhale as they lower.',
    },
    muscles: ['core', 'hip_flexors'],
    pattern: 'core_flexion',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 3.8,
    loadable: false,
    scaling: { easier: 'dead_bug', harder: 'hanging_knee_raise' },
    animation: 'leg_raise',
    tags: ['core'],
  },
  {
    id: 'dead_bug',
    slug: { ru: 'mertvyy-zhuk', en: 'dead-bug' },
    name: { ru: 'Мёртвый жук', en: 'Dead bug' },
    shortName: { ru: 'Мёртвый жук', en: 'Dead bug' },
    description: {
      ru: 'Мёртвый жук — самое безопасное упражнение на кор из всех, что мы используем: ты лежишь на спине и поочерёдно опускаешь противоположные руку и ногу, не отпуская поясницу от пола. Оно учит стабилизировать корпус, пока конечности двигаются, — это и есть работа пресса в реальной жизни и в спорте. Подходит при чувствительной спине и служит облегчённой заменой почти всем упражнениям на пресс. Повторения считаем суммарно на обе стороны.',
      en: 'The dead bug is the safest core exercise we use: lying on your back, you lower the opposite arm and leg while keeping your lower back on the floor. It teaches you to stabilise the trunk while the limbs move — which is what the abs actually do in real life and in sport. It suits a sensitive back and serves as the easy substitute for almost every other abs exercise. Reps are counted as the total for both sides.',
    },
    howTo: [
      {
        ru: 'Ляг на спину, подними руки вертикально вверх, ноги согни под прямым углом — колени над тазом, голени параллельны полу.',
        en: 'Lie on your back, arms pointing straight up, hips and knees bent to 90 degrees — knees over hips, shins parallel to the floor.',
      },
      {
        ru: 'Прижми поясницу к полу и напряги пресс: рёбра опущены, между спиной и полом нет зазора.',
        en: 'Press your lower back into the floor and brace: ribs down, no gap between the spine and the floor.',
      },
      {
        ru: 'Медленно опусти правую руку за голову и одновременно выпрями левую ногу вперёд, пока пятка почти не коснётся пола.',
        en: 'Slowly lower your right arm overhead while extending your left leg forward until the heel is just above the floor.',
      },
      {
        ru: 'Вернись в исходное положение и повтори другой рукой и ногой — это следующее повторение.',
        en: 'Return to the start and repeat with the other arm and leg — that is the next rep.',
      },
    ],
    cues: [
      { ru: 'Поясница в пол', en: 'Lower back into the floor' },
      { ru: 'Медленно и под контролем', en: 'Slow and controlled' },
      { ru: 'Противоположные рука и нога', en: 'Opposite arm and leg' },
    ],
    mistakes: [
      {
        ru: 'Поясница отрывается, когда нога уходит вниз',
        en: 'Lower back lifting as the leg extends',
      },
      { ru: 'Слишком быстрые, размашистые движения', en: 'Moving too fast and too loose' },
      { ru: 'Задержка дыхания', en: 'Holding your breath' },
    ],
    breathing: {
      ru: 'Выдох, пока рука и нога уходят от тела; вдох на возврате.',
      en: 'Exhale as the arm and leg move away, inhale as they return.',
    },
    muscles: ['core', 'hip_flexors'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 3.0,
    loadable: false,
    scaling: { harder: 'leg_raise' },
    animation: 'dead_bug',
    tags: ['core', 'warmup'],
  },
  {
    id: 'bird_dog',
    slug: { ru: 'berd-dog', en: 'bird-dog' },
    name: { ru: 'Бёрд-дог', en: 'Bird dog' },
    shortName: { ru: 'Бёрд-дог', en: 'Bird dog' },
    description: {
      ru: 'Бёрд-дог — вытягивание противоположных руки и ноги из положения на четвереньках. Упражнение тренирует глубокие мышцы спины, ягодицы и равновесие, при этом почти не нагружает позвоночник — поэтому его назначают даже при болях в пояснице. Мы используем его в разминке, чтобы «включить» кор перед тягами и приседаниями. Повторения считаем суммарно на обе стороны.',
      en: 'The bird dog extends the opposite arm and leg from an all-fours position. It trains the deep back muscles, glutes and balance with almost no load on the spine — which is why it is prescribed even for people with lower-back pain. We use it in warm-ups to switch the core on before hinges and squats. Reps are counted as the total for both sides.',
    },
    howTo: [
      {
        ru: 'Встань на четвереньки: ладони под плечами, колени под тазом, спина ровная, взгляд в пол.',
        en: 'Get on all fours: hands under shoulders, knees under hips, back flat, eyes on the floor.',
      },
      {
        ru: 'Напряги пресс и одновременно вытяни правую руку вперёд, а левую ногу назад до уровня корпуса.',
        en: 'Brace your abs and at the same time reach your right arm forward and your left leg back until both are level with your trunk.',
      },
      {
        ru: 'Задержись на 1–2 секунды: таз и плечи не разворачиваются, поясница не прогибается, тянись в длину.',
        en: 'Hold for 1–2 seconds: hips and shoulders stay square, lower back does not arch, reach long in both directions.',
      },
      {
        ru: 'Плавно верни руку и ногу на пол и повтори другой стороной.',
        en: 'Bring the hand and knee back to the floor under control and repeat on the other side.',
      },
    ],
    cues: [
      { ru: 'Таз не разворачивай', en: 'Keep the hips square' },
      { ru: 'Тянись пяткой назад', en: 'Reach the heel back' },
      { ru: 'Спина ровная, как стол', en: 'Back flat like a table' },
    ],
    mistakes: [
      {
        ru: 'Нога поднимается выше корпуса, поясница прогибается',
        en: 'Leg lifting above the trunk so the lower back arches',
      },
      {
        ru: 'Таз заваливается в сторону опорной ноги',
        en: 'Hips tipping toward the supporting leg',
      },
      { ru: 'Голова задирается вверх', en: 'Head lifting up' },
    ],
    breathing: {
      ru: 'Выдох на вытяжении, вдох на возврате.',
      en: 'Exhale as you reach out, inhale as you return.',
    },
    muscles: ['back', 'glutes', 'core', 'shoulders'],
    pattern: 'core_anti_extension',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 3.0,
    met: 3.0,
    loadable: false,
    scaling: {},
    animation: 'bird_dog',
    tags: ['core', 'warmup', 'unilateral'],
  },
  {
    id: 'russian_twist',
    slug: { ru: 'russkiy-tvist', en: 'russian-twist' },
    name: { ru: 'Русский твист', en: 'Russian twist' },
    shortName: { ru: 'Русский твист', en: 'Russian twist' },
    description: {
      ru: 'Русский твист — повороты корпуса из положения сидя с приподнятыми ногами. Это упражнение на косые мышцы живота и вращательную силу — то, чего не дают планки и ситапы. В программе оно закрывает паттерн «ротация» без оборудования; при желании держи в руках гантель или бутылку с водой. Одно касание пола = одно повторение.',
      en: 'The Russian twist is a seated trunk rotation with the feet lifted. It targets the obliques and rotational strength — the thing planks and sit-ups do not give you. In the program it covers the rotation pattern without equipment; add a dumbbell or a water bottle for more. One touch of the floor equals one rep.',
    },
    howTo: [
      {
        ru: 'Сядь на пол, согни колени, отклони прямой корпус назад примерно на 45°, чтобы пресс включился. Стопы приподняты или, для облегчения, стоят на полу.',
        en: 'Sit on the floor with knees bent and lean your straight trunk back about 45 degrees so the abs engage. Feet lifted, or on the floor to make it easier.',
      },
      {
        ru: 'Сложи руки перед грудью (или возьми отягощение) и поверни корпус вправо, коснувшись руками пола у бедра.',
        en: 'Hold your hands together in front of your chest (or a weight) and rotate your trunk to the right, touching the floor beside your hip.',
      },
      {
        ru: 'Вращай именно грудную клетку и плечи, а не просто маши руками; колени смотрят вперёд.',
        en: 'Rotate from the ribcage and shoulders — do not just swing the arms; knees keep pointing forward.',
      },
      {
        ru: 'Вернись через центр и повернись влево — это следующее повторение. Спина прямая всё время.',
        en: 'Come back through the centre and rotate to the left — that is the next rep. Keep the back straight throughout.',
      },
    ],
    cues: [
      { ru: 'Крути плечи, а не руки', en: 'Rotate the shoulders, not the arms' },
      { ru: 'Спина прямая', en: 'Back straight' },
      { ru: 'Колени смотрят вперёд', en: 'Knees stay forward' },
    ],
    mistakes: [
      { ru: 'Спина округлена, корпус «висит»', en: 'Rounded back, trunk slumping' },
      {
        ru: 'Только руки перелетают с боку на бок, корпус не вращается',
        en: 'Only the arms fly side to side while the trunk stays still',
      },
      { ru: 'Слишком быстрый темп с рывками', en: 'Rushing the reps with jerky movements' },
    ],
    breathing: {
      ru: 'Выдох на каждом повороте.',
      en: 'Exhale on each twist.',
    },
    muscles: ['obliques', 'core', 'hip_flexors'],
    pattern: 'core_rotation',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 1.5,
    met: 4.0,
    loadable: false,
    scaling: { easier: 'dead_bug' },
    animation: 'russian_twist',
    tags: ['core'],
  },
  {
    id: 'flutter_kick',
    slug: { ru: 'nozhnitsy', en: 'flutter-kicks' },
    name: { ru: 'Ножницы', en: 'Flutter kicks' },
    shortName: { ru: 'Ножницы', en: 'Flutter kicks' },
    description: {
      ru: 'Ножницы — попеременные махи прямыми ногами лёжа на спине. Пока ноги «плывут», пресс и сгибатели бедра работают на выносливость, а поясница учится оставаться прижатой к полу. Это отличный способ добить кор в конце комплекса или подержать пульс между силовыми блоками.',
      en: "Flutter kicks are alternating small kicks with straight legs while lying on your back. While the legs 'swim', the abs and hip flexors work for endurance and the lower back learns to stay pressed into the floor. A great finisher for the core at the end of a workout, or a way to keep the heart rate up between strength blocks.",
    },
    howTo: [
      {
        ru: 'Ляг на спину, руки вдоль тела ладонями вниз или под ягодицами, поясница прижата к полу.',
        en: 'Lie on your back, arms by your sides with palms down or under your glutes, lower back pressed into the floor.',
      },
      {
        ru: 'Подними прямые ноги на 15–30 см над полом, носки натянуты. Голову и плечи можно слегка приподнять.',
        en: 'Raise your straight legs 15–30 cm off the floor, toes pointed. You may lift your head and shoulders slightly.',
      },
      {
        ru: 'Выполняй короткие быстрые махи: одна нога вверх, другая вниз, амплитуда 20–30 см, ноги не касаются пола.',
        en: 'Kick in short, quick strokes: one leg up as the other goes down, 20–30 cm of range, feet never touching the floor.',
      },
      {
        ru: 'Продолжай заданное время, затем плавно опусти ноги на пол.',
        en: 'Continue for the prescribed time, then lower your legs to the floor under control.',
      },
    ],
    cues: [
      { ru: 'Поясница прижата', en: 'Lower back down' },
      { ru: 'Махи короткие и быстрые', en: 'Short, quick kicks' },
      { ru: 'Ноги прямые', en: 'Legs straight' },
    ],
    mistakes: [
      { ru: 'Поясница отрывается от пола', en: 'Lower back coming off the floor' },
      { ru: 'Ноги слишком высоко — пресс отдыхает', en: 'Legs too high so the abs stop working' },
      { ru: 'Колени сгибаются', en: 'Knees bending' },
    ],
    breathing: {
      ru: 'Ровно и часто, не задерживай дыхание.',
      en: 'Breathe steadily and often; never hold your breath.',
    },
    muscles: ['core', 'hip_flexors', 'quads'],
    pattern: 'core_flexion',
    equipment: ['none'],
    level: 2,
    unit: 'seconds',
    met: 4.0,
    loadable: false,
    scaling: { easier: 'dead_bug' },
    animation: 'flutter_kick',
    tags: ['core', 'cardio'],
  },
  {
    id: 'mountain_climber',
    slug: { ru: 'skalolaz', en: 'mountain-climbers' },
    name: { ru: 'Скалолаз', en: 'Mountain climbers' },
    shortName: { ru: 'Скалолаз', en: 'Mountain climbers' },
    description: {
      ru: 'Скалолаз — быстрый бег коленями к груди в упоре лёжа. Он одновременно нагружает кор, плечи и сердечно-сосудистую систему, поэтому это одно из главных кардио-упражнений без оборудования. Плечи стоят над кистями, а таз не подпрыгивает — тогда работает пресс, а не поясница. Одно подтягивание колена = одно повторение (считаем суммарно на обе ноги).',
      en: 'Mountain climbers are a fast run driving the knees toward the chest from a push-up position. They load the core, shoulders and cardiovascular system all at once, which makes them one of the key equipment-free conditioning moves. Keep your shoulders over your hands and your hips still so the abs, not the lower back, do the work. One knee drive equals one rep (count both legs together).',
    },
    howTo: [
      {
        ru: 'Встань в упор лёжа: ладони под плечами, тело в одну линию от головы до пяток, пресс напряжён.',
        en: 'Start in a push-up position: hands under shoulders, body in one line from head to heels, abs braced.',
      },
      {
        ru: 'Подтяни правое колено к груди, не отрывая ладони и не поднимая таз.',
        en: 'Drive your right knee toward your chest without lifting your hands or raising your hips.',
      },
      {
        ru: 'Быстро верни правую ногу назад и одновременно подтяни левое колено — движение похоже на бег.',
        en: 'Snap the right leg back while driving the left knee in — the movement feels like running.',
      },
      {
        ru: 'Продолжай попеременно в быстром темпе, держа плечи над кистями и таз на уровне плеч.',
        en: 'Keep alternating at a quick pace, shoulders over hands and hips level with the shoulders.',
      },
    ],
    cues: [
      { ru: 'Плечи над кистями', en: 'Shoulders over hands' },
      { ru: 'Таз не задирай', en: 'Hips stay down' },
      { ru: 'Колено к груди', en: 'Knee to chest' },
    ],
    mistakes: [
      { ru: 'Таз задран вверх, тело складывается', en: 'Hips piked up so the body folds' },
      { ru: 'Плечи уезжают назад за кисти', en: 'Shoulders drifting back behind the hands' },
      {
        ru: 'Колено не доходит до груди — короткая амплитуда',
        en: 'Knee stopping short of the chest',
      },
    ],
    breathing: {
      ru: 'Ритмично, выдох на каждые два шага.',
      en: 'Rhythmic breathing, exhale every two knee drives.',
    },
    muscles: ['core', 'hip_flexors', 'shoulders', 'cardio'],
    pattern: 'locomotion',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 1.0,
    met: 8.0,
    loadable: false,
    scaling: { easier: 'high_knees' },
    animation: 'mountain_climber',
    tags: ['cardio', 'core'],
  },
  {
    id: 'bear_crawl',
    slug: { ru: 'medvezhya-pohodka', en: 'bear-crawl' },
    name: { ru: 'Медвежья походка', en: 'Bear crawl' },
    shortName: { ru: 'Медвежья походка', en: 'Bear crawl' },
    description: {
      ru: 'Медвежья походка — передвижение на четырёх точках с коленями, поднятыми на пару сантиметров над полом. Упражнение включает всё тело: плечи и руки держат вес, кор не даёт тазу качаться, ноги перебирают под нагрузкой. Это и координация, и сила, и кардио сразу; дома делай шаги вперёд-назад в пределах коврика.',
      en: 'The bear crawl is locomotion on hands and feet with the knees hovering a couple of centimetres above the floor. It works the whole body: shoulders and arms carry the weight, the core stops the hips from swaying, and the legs step under load. Coordination, strength and cardio in one move — at home, crawl forward and back within the length of a mat.',
    },
    howTo: [
      {
        ru: 'Встань на четвереньки: ладони под плечами, колени под тазом. Оторви колени от пола на 2–5 см, спина ровная.',
        en: 'Get on all fours with hands under shoulders and knees under hips. Lift the knees 2–5 cm off the floor, back flat.',
      },
      {
        ru: 'Шагни вперёд правой рукой и левой ногой одновременно, делая небольшой шаг.',
        en: 'Step forward with the right hand and the left foot at the same time, keeping the step small.',
      },
      {
        ru: 'Затем — левой рукой и правой ногой. Таз остаётся на уровне плеч, не раскачивается из стороны в сторону.',
        en: 'Then the left hand and the right foot. Hips stay level with the shoulders and do not sway side to side.',
      },
      {
        ru: 'Двигайся вперёд заданное время (или назад, если нет места), сохраняя колени низко и спину ровной.',
        en: 'Keep moving forward for the prescribed time (or backward when short on space), knees low and back flat.',
      },
    ],
    cues: [
      { ru: 'Колени низко', en: 'Knees low' },
      { ru: 'Шаги маленькие', en: 'Small steps' },
      { ru: 'Спина ровная, таз не качается', en: 'Flat back, quiet hips' },
    ],
    mistakes: [
      { ru: 'Таз задран вверх, колени высоко', en: 'Hips high in the air and knees too high' },
      { ru: 'Таз мотается из стороны в сторону', en: 'Hips swinging side to side' },
      {
        ru: 'Одноимённые рука и нога шагают вместе',
        en: 'Same-side hand and foot moving together',
      },
    ],
    breathing: {
      ru: 'Ровное дыхание, не задерживай воздух под нагрузкой.',
      en: 'Breathe evenly; do not hold your breath under load.',
    },
    muscles: ['shoulders', 'core', 'quads', 'triceps', 'full_body'],
    pattern: 'locomotion',
    equipment: ['none'],
    level: 2,
    unit: 'seconds',
    met: 7.0,
    loadable: false,
    scaling: { easier: 'plank' },
    animation: 'bear_crawl',
    tags: ['cardio', 'core', 'upper'],
  },
  {
    id: 'high_knees',
    slug: { ru: 'beg-s-vysokim-podnimaniem-kolen', en: 'high-knees' },
    name: { ru: 'Бег с высоким подниманием колен', en: 'High knees' },
    shortName: { ru: 'Высокие колени', en: 'High knees' },
    description: {
      ru: 'Бег на месте с высоким подниманием колен — быстрое кардио без оборудования, которое за секунды поднимает пульс и разогревает сгибатели бедра, икры и стопы. Мы ставим его в разминку перед прыжками и в кардио-интервалы как замену скакалке и скалолазу. Держи корпус вертикально и приземляйся мягко на переднюю часть стопы.',
      en: 'Running in place with high knees is fast equipment-free cardio that spikes your heart rate within seconds and warms up the hip flexors, calves and feet. We use it in warm-ups before jumping and in cardio intervals as a substitute for the jump rope and mountain climbers. Keep your trunk upright and land softly on the balls of your feet.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы на ширине таза, руки согнуты в локтях, как при беге.',
        en: 'Stand tall with feet hip-width apart, arms bent as if running.',
      },
      {
        ru: 'Начни бег на месте, поднимая колени до уровня таза или выше; работай руками в противоход ногам.',
        en: 'Start running in place, driving each knee up to hip height or higher, arms pumping opposite to the legs.',
      },
      {
        ru: 'Приземляйся на переднюю часть стопы, корпус прямой, пресс напряжён — не наклоняйся вперёд.',
        en: 'Land on the balls of your feet with your trunk upright and abs braced — do not lean forward.',
      },
      {
        ru: 'Держи быстрый темп заданное время.',
        en: 'Keep a fast pace for the prescribed time.',
      },
    ],
    cues: [
      { ru: 'Колени до пояса', en: 'Knees to hip height' },
      { ru: 'Приземляйся на носки', en: 'Land on the balls of the feet' },
      { ru: 'Корпус прямой', en: 'Stay tall' },
    ],
    mistakes: [
      { ru: 'Наклон корпуса вперёд', en: 'Leaning the trunk forward' },
      {
        ru: 'Колени поднимаются низко — это просто бег на месте',
        en: 'Knees staying low so it turns into a plain jog',
      },
      { ru: 'Приземление на всю стопу с ударом', en: 'Landing flat-footed with a thud' },
    ],
    breathing: {
      ru: 'Дыши ритмично, в такт шагам.',
      en: 'Breathe rhythmically in time with the steps.',
    },
    muscles: ['hip_flexors', 'quads', 'calves', 'cardio'],
    pattern: 'locomotion',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 8.0,
    loadable: false,
    scaling: { easier: 'jog_in_place', harder: 'mountain_climber' },
    animation: 'high_knees',
    tags: ['cardio', 'warmup', 'lower'],
  },
  {
    id: 'jumping_jack',
    slug: { ru: 'dzhamping-dzhek', en: 'jumping-jacks' },
    name: { ru: 'Джампинг-джек', en: 'Jumping jacks' },
    shortName: { ru: 'Джампинг-джек', en: 'Jumping jacks' },
    description: {
      ru: 'Джампинг-джек — прыжки с разведением ног и подъёмом рук над головой. Самое доступное кардио-упражнение: разогревает всё тело, включает плечи и икры и не требует места. Мы используем его в начале каждой разминки и как лёгкую замену скакалке, когда её нет под рукой. Один прыжок с разведением и возвратом = одно повторение.',
      en: 'Jumping jacks are jumps that spread the feet while the arms swing overhead. The most accessible cardio move there is: it warms up the whole body, wakes up the shoulders and calves and needs almost no space. We use it to open every warm-up and as the easy substitute for the jump rope when you do not have one. One jump out and back equals one rep.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы вместе, руки вдоль тела.',
        en: 'Stand tall with feet together and arms by your sides.',
      },
      {
        ru: 'В прыжке разведи ноги чуть шире плеч и одновременно подними прямые руки через стороны над головой.',
        en: 'Jump the feet out just wider than the shoulders while raising your straight arms out to the sides and overhead.',
      },
      {
        ru: 'Сразу следующим прыжком верни стопы вместе и опусти руки вдоль тела.',
        en: 'With the next jump bring the feet back together and lower the arms to your sides.',
      },
      {
        ru: 'Приземляйся мягко на переднюю часть стопы и держи ровный ритм.',
        en: 'Land softly on the balls of your feet and keep an even rhythm.',
      },
    ],
    cues: [
      { ru: 'Мягкое приземление', en: 'Land softly' },
      { ru: 'Руки до хлопка над головой', en: 'Arms all the way up' },
      { ru: 'Держи ритм', en: 'Keep the rhythm' },
    ],
    mistakes: [
      { ru: 'Руки не доходят до верха', en: 'Arms stopping short of overhead' },
      {
        ru: 'Приземление на всю стопу с прямыми коленями',
        en: 'Landing flat-footed on straight knees',
      },
      { ru: 'Корпус наклоняется вперёд', en: 'Trunk leaning forward' },
    ],
    breathing: {
      ru: 'Дыши в ритме прыжков, не задерживай дыхание.',
      en: 'Breathe in rhythm with the jumps; never hold your breath.',
    },
    muscles: ['calves', 'shoulders', 'quads', 'cardio'],
    pattern: 'jump',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 1.0,
    met: 7.0,
    loadable: false,
    scaling: { easier: 'jog_in_place', harder: 'skater' },
    animation: 'jumping_jack',
    tags: ['cardio', 'warmup'],
  },
  {
    id: 'skater',
    slug: { ru: 'konkobezhets', en: 'skater-jumps' },
    name: { ru: 'Конькобежец', en: 'Skater jumps' },
    shortName: { ru: 'Конькобежец', en: 'Skaters' },
    description: {
      ru: 'Конькобежец — боковые прыжки с ноги на ногу, как у скоростного конькобежца. Упражнение развивает взрывную силу ног, стабильность колена и голеностопа и мышцы, которые работают во фронтальной плоскости, — их обычные приседания и выпады почти не трогают. Это отличная кардио-нагрузка без ударов на позвоночник. Каждый прыжок = одно повторение (считаем суммарно на обе стороны).',
      en: 'Skater jumps are sideways leaps from one leg to the other, like a speed skater. They build explosive leg power, knee and ankle stability and the muscles that work in the frontal plane — the ones squats and lunges barely touch. Great cardio with no impact on the spine. Each leap equals one rep (count both sides together).',
    },
    howTo: [
      {
        ru: 'Встань на правую ногу, слегка согни её, левую отведи назад и в сторону, корпус чуть наклонён вперёд.',
        en: 'Stand on your right leg with the knee slightly bent, left leg trailing behind and to the side, trunk leaning slightly forward.',
      },
      {
        ru: 'Оттолкнись правой ногой и прыгни влево, приземлившись на левую ногу; правая уходит назад за опорную.',
        en: 'Push off the right leg and leap to the left, landing on the left foot; the right leg swings behind the supporting leg.',
      },
      {
        ru: 'Приземляйся мягко, колено над стопой, руки работают в противоход — как при беге на коньках.',
        en: 'Land softly with the knee over the foot, arms swinging opposite as if skating.',
      },
      {
        ru: 'Сразу оттолкнись и прыгни обратно вправо — это следующее повторение.',
        en: 'Push off immediately and leap back to the right — that is the next rep.',
      },
    ],
    cues: [
      { ru: 'Колено над стопой', en: 'Knee over foot' },
      { ru: 'Приземляйся тихо', en: 'Land quietly' },
      { ru: 'Прыгай в сторону, а не вверх', en: 'Jump sideways, not up' },
    ],
    mistakes: [
      { ru: 'Колено уходит внутрь при приземлении', en: 'Knee collapsing inward on landing' },
      { ru: 'Приземление на прямую ногу', en: 'Landing on a straight leg' },
      {
        ru: 'Слишком короткие прыжки без отталкивания',
        en: 'Tiny hops with no real push-off',
      },
    ],
    breathing: {
      ru: 'Выдох на каждом отталкивании.',
      en: 'Exhale on each push-off.',
    },
    muscles: ['glutes', 'quads', 'calves', 'hamstrings', 'cardio'],
    pattern: 'jump',
    equipment: ['none'],
    level: 2,
    unit: 'reps',
    secondsPerRep: 1.2,
    met: 8.0,
    loadable: false,
    scaling: { easier: 'lateral_lunge' },
    animation: 'skater',
    tags: ['cardio', 'explosive', 'lower', 'unilateral'],
  },
  {
    id: 'jog_in_place',
    slug: { ru: 'beg-na-meste', en: 'jog-in-place' },
    name: { ru: 'Бег на месте', en: 'Jog in place' },
    shortName: { ru: 'Бег на месте', en: 'Jog in place' },
    description: {
      ru: 'Бег на месте — самый простой способ поднять температуру тела и пульс перед тренировкой. Он мягко готовит суставы ног, икры и стопы к прыжкам и приседаниям и подходит любому уровню. Это базовый вариант для тех, кому пока тяжело бегать с высоким подниманием колен или делать джампинг-джек.',
      en: 'Jogging in place is the simplest way to raise your body temperature and heart rate before a workout. It gently prepares the leg joints, calves and feet for jumps and squats and suits every level. It is the base option for anyone not yet ready for high knees or jumping jacks.',
    },
    howTo: [
      {
        ru: 'Встань прямо, стопы на ширине таза, руки согнуты в локтях.',
        en: 'Stand tall, feet hip-width apart, elbows bent.',
      },
      {
        ru: 'Начни лёгкий бег на месте: отрывай стопы от пола по очереди, приземляясь на переднюю часть стопы.',
        en: 'Start a light jog in place, lifting one foot at a time and landing on the ball of the foot.',
      },
      {
        ru: 'Работай руками, как при беге, держи корпус прямым и плечи расслабленными.',
        en: 'Swing your arms as in running, trunk upright and shoulders relaxed.',
      },
      {
        ru: 'Постепенно ускоряй темп в течение заданного времени, чтобы к концу дыхание стало заметно чаще.',
        en: 'Gradually pick up the pace over the prescribed time so your breathing is noticeably faster by the end.',
      },
    ],
    cues: [
      { ru: 'Мягко на носки', en: 'Light on the feet' },
      { ru: 'Плечи расслаблены', en: 'Relaxed shoulders' },
      { ru: 'Постепенно ускоряйся', en: 'Build the pace' },
    ],
    mistakes: [
      { ru: 'Топанье всей стопой', en: 'Stomping flat-footed' },
      { ru: 'Наклон корпуса вперёд', en: 'Leaning forward' },
    ],
    breathing: {
      ru: 'Спокойное дыхание носом, переходи на рот при ускорении.',
      en: 'Calm nasal breathing, switching to the mouth as you speed up.',
    },
    muscles: ['calves', 'quads', 'hip_flexors', 'cardio'],
    pattern: 'locomotion',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 6.0,
    loadable: false,
    scaling: { harder: 'high_knees' },
    animation: 'jog_in_place',
    tags: ['cardio', 'warmup'],
  },
  {
    id: 'arm_circles',
    slug: { ru: 'krugi-rukami', en: 'arm-circles' },
    name: { ru: 'Круги руками', en: 'Arm circles' },
    shortName: { ru: 'Круги руками', en: 'Arm circles' },
    description: {
      ru: 'Круги руками — динамическая разминка плечевых суставов. Они прогоняют кровь через ротаторную манжету и разогревают плечи, грудь и верх спины перед отжиманиями, жимами и любыми движениями над головой. Делай их до, а не вместо силовой работы — это подготовка, а не нагрузка. Половину времени крути вперёд, половину — назад.',
      en: 'Arm circles are a dynamic warm-up for the shoulder joints. They push blood through the rotator cuff and warm up the shoulders, chest and upper back before push-ups, presses and anything overhead. Do them before strength work, not instead of it — this is preparation, not loading. Circle forward for half the time and backward for the other half.',
    },
    howTo: [
      {
        ru: 'Встань прямо, разведи прямые руки в стороны на уровне плеч, ладони вниз.',
        en: 'Stand tall with your straight arms out to the sides at shoulder height, palms down.',
      },
      {
        ru: 'Начни рисовать маленькие круги вперёд — диаметром с яблоко, — постепенно увеличивая их до больших.',
        en: 'Start drawing small circles forward — about the size of an apple — and gradually make them bigger.',
      },
      {
        ru: 'Через половину времени смени направление и крути назад, так же от малых кругов к большим.',
        en: 'Halfway through, reverse direction and circle backward, again from small to large.',
      },
      {
        ru: 'Плечи опущены, лопатки не поднимаются к ушам, корпус неподвижен.',
        en: 'Keep your shoulders down away from your ears and your trunk still throughout.',
      },
    ],
    cues: [
      { ru: 'Плечи вниз от ушей', en: 'Shoulders away from the ears' },
      { ru: 'От малых кругов к большим', en: 'Small circles first' },
      { ru: 'Руки прямые', en: 'Arms straight' },
    ],
    mistakes: [
      { ru: 'Плечи задраны к ушам', en: 'Shoulders shrugged up to the ears' },
      { ru: 'Руки опускаются ниже уровня плеч', en: 'Arms drifting below shoulder height' },
    ],
    breathing: {
      ru: 'Спокойное, ровное дыхание.',
      en: 'Calm, even breathing.',
    },
    muscles: ['shoulders', 'back'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 2.5,
    loadable: false,
    scaling: {},
    animation: 'arm_circles',
    tags: ['warmup', 'mobility', 'upper'],
  },
  {
    id: 'leg_swing',
    slug: { ru: 'mahi-nogami', en: 'leg-swings' },
    name: { ru: 'Махи ногами', en: 'Leg swings' },
    shortName: { ru: 'Махи ногами', en: 'Leg swings' },
    description: {
      ru: 'Махи ногами — динамическая растяжка тазобедренного сустава перед приседаниями, выпадами и бегом. Нога свободно качается вперёд-назад, постепенно увеличивая амплитуду, а задняя поверхность бедра и сгибатели бедра разогреваются без статики. Делай на каждую ногу; в задании повторения указаны на одну сторону.',
      en: 'Leg swings are a dynamic hip stretch before squats, lunges and running. The leg swings freely forward and back with a gradually growing range, warming up the hamstrings and hip flexors without static holds. Do them on each leg; the reps in the workout are per side.',
    },
    howTo: [
      {
        ru: 'Встань боком к стене или стулу, обопрись рукой, вес на левой ноге, правая свободна.',
        en: 'Stand side-on to a wall or chair and rest a hand on it; weight on the left leg, right leg free.',
      },
      {
        ru: 'Качни прямую правую ногу вперёд до комфортной высоты, затем назад, не прогибая поясницу.',
        en: 'Swing the straight right leg forward to a comfortable height, then back, without arching the lower back.',
      },
      {
        ru: 'Продолжай маятником, с каждым махом чуть увеличивая амплитуду; корпус остаётся вертикальным, опорная нога чуть согнута.',
        en: 'Keep swinging like a pendulum, adding a little range each time; trunk stays upright and the supporting knee is soft.',
      },
      {
        ru: 'Сделай заданное число махов и повтори на другую ногу.',
        en: 'Complete the prescribed number of swings and repeat on the other leg.',
      },
    ],
    cues: [
      { ru: 'Корпус неподвижен', en: 'Trunk stays still' },
      { ru: 'Амплитуда растёт постепенно', en: 'Build the range gradually' },
      { ru: 'Нога расслаблена', en: 'Let the leg swing loose' },
    ],
    mistakes: [
      { ru: 'Прогиб в пояснице на махе назад', en: 'Arching the lower back on the backswing' },
      {
        ru: 'Рывок на максимальную амплитуду с первого маха',
        en: 'Forcing a full-range swing from the first rep',
      },
    ],
    breathing: {
      ru: 'Дыши свободно в такт махам.',
      en: 'Breathe freely in time with the swings.',
    },
    muscles: ['hip_flexors', 'hamstrings', 'glutes'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 1.5,
    met: 2.8,
    loadable: false,
    scaling: {},
    animation: 'leg_swing',
    tags: ['warmup', 'mobility', 'lower', 'unilateral'],
  },
  {
    id: 'cat_cow',
    slug: { ru: 'koshka-korova', en: 'cat-cow' },
    name: { ru: 'Кошка-корова', en: 'Cat-cow' },
    shortName: { ru: 'Кошка-корова', en: 'Cat-cow' },
    description: {
      ru: 'Кошка-корова — мягкое чередование прогиба и округления спины на четвереньках. Упражнение «оживляет» позвоночник: разгоняет кровь в мышцах вдоль спины, учит чувствовать нейтральное положение поясницы и снимает скованность после сидячего дня. Мы ставим его в начало разминки и в заминку. Одно повторение = кошка + корова.',
      en: "Cat-cow is a gentle alternation between arching and rounding the spine on all fours. It wakes up the spine: it gets blood into the muscles along the back, teaches you to feel a neutral lower back and eases stiffness after a day of sitting. We put it at the start of warm-ups and into cool-downs. One rep equals one 'cat' plus one 'cow'.",
    },
    howTo: [
      {
        ru: 'Встань на четвереньки на коврике: ладони под плечами, колени под тазом, спина ровная.',
        en: 'Get on all fours on the mat: hands under shoulders, knees under hips, back flat.',
      },
      {
        ru: 'На вдохе прогни спину: опусти живот к полу, раскрой грудь и подними взгляд — это «корова».',
        en: "Inhale and arch: let your belly drop toward the floor, open your chest and look up — that is the 'cow'.",
      },
      {
        ru: 'На выдохе округли спину к потолку: подкрути таз, опусти голову, отталкивайся ладонями от пола — это «кошка».',
        en: "Exhale and round your back toward the ceiling: tuck the pelvis, drop the head, push the floor away with your hands — that is the 'cat'.",
      },
      {
        ru: 'Плавно чередуй положения в ритме дыхания, двигаясь всем позвоночником от таза до шеи.',
        en: 'Flow between the two positions with your breath, moving the whole spine from pelvis to neck.',
      },
    ],
    cues: [
      { ru: 'Двигайся в ритме дыхания', en: 'Move with the breath' },
      { ru: 'Всем позвоночником', en: 'Move the whole spine' },
      { ru: 'Отталкивай пол ладонями', en: 'Push the floor away' },
    ],
    mistakes: [
      {
        ru: 'Движение только в шее и пояснице, грудной отдел не участвует',
        en: 'Moving only the neck and lower back while the mid-back stays stiff',
      },
      { ru: 'Слишком быстрый темп', en: 'Rushing through the reps' },
    ],
    breathing: {
      ru: 'Вдох в прогибе (корова), выдох в округлении (кошка).',
      en: 'Inhale into the arch (cow), exhale into the round (cat).',
    },
    muscles: ['back', 'core'],
    pattern: 'mobility',
    equipment: ['mat'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 4.0,
    met: 2.3,
    loadable: false,
    scaling: {},
    animation: 'cat_cow',
    tags: ['warmup', 'cooldown', 'mobility'],
  },
  {
    id: 'hip_flexor_stretch',
    slug: { ru: 'rastyazhka-sgibateley-bedra', en: 'hip-flexor-stretch' },
    name: { ru: 'Растяжка сгибателей бедра', en: 'Hip flexor stretch' },
    shortName: { ru: 'Сгибатели бедра', en: 'Hip flexor stretch' },
    description: {
      ru: 'Растяжка сгибателей бедра в выпаде на колене раскрывает переднюю поверхность бедра и подвздошно-поясничную мышцу — они укорачиваются от сидения и от бега, скалолаза и подъёмов ног. Свободные сгибатели бедра — это ровная поясница в приседе и полное разгибание таза в тягах и прыжках. Делай в заминке на каждую сторону; время в задании указано на одну сторону.',
      en: 'The kneeling hip flexor stretch opens the front of the hip and the iliopsoas — muscles that shorten from sitting and from running, mountain climbers and leg raises. Free hip flexors mean a neutral lower back in the squat and full hip extension in hinges and jumps. Do it in the cool-down on each side; the time in the workout is per side.',
    },
    howTo: [
      {
        ru: 'Встань на правое колено, левую стопу поставь впереди так, чтобы левое колено было над пяткой. Под колено можно подложить коврик или полотенце.',
        en: 'Kneel on your right knee with your left foot in front so the left knee is over the heel. Put a mat or a folded towel under the knee if you like.',
      },
      {
        ru: 'Сожми правую ягодицу и подкрути таз (копчик вниз) — растяжение должно появиться в передней части правого бедра.',
        en: 'Squeeze your right glute and tuck the pelvis (tailbone down) — you should feel the stretch at the front of the right hip.',
      },
      {
        ru: 'Мягко подай таз вперёд, не прогибая поясницу; корпус вертикальный, при желании подними правую руку вверх.',
        en: 'Gently shift your hips forward without arching the lower back; keep the trunk upright and, if you like, reach the right arm overhead.',
      },
      {
        ru: 'Держи заданное время, спокойно дыша, затем поменяй сторону.',
        en: 'Hold for the prescribed time, breathing calmly, then switch sides.',
      },
    ],
    cues: [
      { ru: 'Таз подкручен', en: 'Tuck the pelvis' },
      { ru: 'Ягодица сжата', en: 'Squeeze the back glute' },
      { ru: 'Корпус вертикально', en: 'Stay upright' },
    ],
    mistakes: [
      {
        ru: 'Прогиб в пояснице вместо растяжения бедра',
        en: 'Arching the lower back instead of stretching the hip',
      },
      { ru: 'Переднее колено уходит далеко за носок', en: 'Front knee pushed far past the toes' },
    ],
    breathing: {
      ru: 'Медленный вдох, длинный выдох — с каждым выдохом чуть глубже.',
      en: 'Slow inhale, long exhale — sink a little deeper with each exhale.',
    },
    muscles: ['hip_flexors', 'quads'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 2.3,
    loadable: false,
    scaling: {},
    animation: 'hip_flexor_stretch',
    tags: ['cooldown', 'mobility', 'lower', 'unilateral'],
  },
  {
    id: 'hamstring_stretch',
    slug: { ru: 'rastyazhka-zadney-poverhnosti-bedra', en: 'hamstring-stretch' },
    name: { ru: 'Растяжка задней поверхности бедра', en: 'Hamstring stretch' },
    shortName: { ru: 'Задняя поверхность', en: 'Hamstring stretch' },
    description: {
      ru: 'Растяжка задней поверхности бедра расслабляет мышцы, которые тянут таз назад и не дают наклониться с прямой спиной. Она нужна после тяг, махов и бега, а ещё помогает глубже и правильнее приседать. Делай её в заминке на каждую ногу; время в задании указано на одну сторону.',
      en: 'The hamstring stretch releases the muscles that pull the pelvis back and stop you from hinging with a flat back. You need it after deadlifts, swings and running, and it helps you squat deeper and cleaner. Do it in the cool-down on each leg; the time in the workout is per side.',
    },
    howTo: [
      {
        ru: 'Встань прямо и поставь правую пятку вперёд на пол (или на низкую опору), носок на себя, нога прямая.',
        en: 'Stand tall and place your right heel forward on the floor (or a low step), toes pulled up, leg straight.',
      },
      {
        ru: 'Слегка согни левую опорную ногу и наклоняйся вперёд от тазобедренного сустава, отводя таз назад, — спина прямая.',
        en: 'Soften the left supporting knee and hinge forward from the hips, pushing the hips back — spine straight.',
      },
      {
        ru: 'Наклоняйся, пока не почувствуешь растяжение по задней поверхности правого бедра; руки на бедре, не тянись к носку ценой круглой спины.',
        en: 'Fold until you feel the stretch along the back of the right thigh; hands on the thigh — do not chase the toes at the cost of a rounded back.',
      },
      {
        ru: 'Держи заданное время, затем поменяй ногу.',
        en: 'Hold for the prescribed time, then switch legs.',
      },
    ],
    cues: [
      { ru: 'Наклон от таза, спина прямая', en: 'Hinge at the hips, back flat' },
      { ru: 'Носок на себя', en: 'Toes pulled up' },
      { ru: 'Не рви — дыши', en: 'Ease in, keep breathing' },
    ],
    mistakes: [
      {
        ru: 'Круглая спина — растягивается поясница, а не бедро',
        en: 'Rounded back so the lower back stretches instead of the hamstring',
      },
      { ru: 'Пружинистые покачивания', en: 'Bouncing in and out of the stretch' },
    ],
    breathing: {
      ru: 'Долгий выдох, с каждым выдохом наклон чуть глубже.',
      en: 'Long exhales, folding a little deeper on each one.',
    },
    muscles: ['hamstrings', 'calves', 'glutes'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 2.3,
    loadable: false,
    scaling: {},
    animation: 'hamstring_stretch',
    tags: ['cooldown', 'mobility', 'lower', 'unilateral'],
  },
  {
    id: 'child_pose',
    slug: { ru: 'poza-rebenka', en: 'childs-pose' },
    name: { ru: 'Поза ребёнка', en: "Child's pose" },
    shortName: { ru: 'Поза ребёнка', en: "Child's pose" },
    description: {
      ru: 'Поза ребёнка — положение отдыха из йоги, которым мы заканчиваем тренировку: таз опускается на пятки, лоб — на коврик, руки вытянуты вперёд. Она мягко растягивает спину, широчайшие и плечи, опускает пульс и переключает тебя из режима нагрузки в режим восстановления. Здесь главное — дыхание, а не глубина.',
      en: "Child's pose is the resting position from yoga that closes our workouts: hips settle toward the heels, forehead on the mat, arms reaching forward. It gently stretches the back, lats and shoulders, brings the heart rate down and switches you from work mode into recovery. The point here is breathing, not depth.",
    },
    howTo: [
      {
        ru: 'Встань на колени на коврике, колени чуть шире таза, большие пальцы стоп вместе.',
        en: 'Kneel on the mat with your knees slightly wider than your hips and your big toes touching.',
      },
      {
        ru: 'Сядь тазом на пятки и наклони корпус вперёд между бёдрами, вытягивая руки вперёд по полу.',
        en: 'Sit your hips back onto your heels and fold your trunk forward between your thighs, walking the hands forward along the floor.',
      },
      {
        ru: 'Опусти лоб на коврик, расслабь шею и плечи, позволь спине округлиться.',
        en: 'Rest your forehead on the mat, relax the neck and shoulders and let the back round.',
      },
      {
        ru: 'Дыши медленно и глубоко животом заданное время, с каждым выдохом отпуская напряжение.',
        en: 'Breathe slowly and deeply into your belly for the prescribed time, letting go of tension with every exhale.',
      },
    ],
    cues: [
      { ru: 'Таз к пяткам', en: 'Hips to heels' },
      { ru: 'Плечи расслаблены', en: 'Let the shoulders go' },
      { ru: 'Дыши животом', en: 'Breathe into the belly' },
    ],
    mistakes: [
      { ru: 'Плечи напряжённо подняты к ушам', en: 'Shoulders tensed up toward the ears' },
      { ru: 'Поверхностное дыхание грудью', en: 'Shallow chest breathing' },
    ],
    breathing: {
      ru: 'Медленный вдох носом на 4 счёта, выдох на 6.',
      en: 'Slow nasal inhale for 4 counts, exhale for 6.',
    },
    muscles: ['back', 'lats', 'shoulders'],
    pattern: 'mobility',
    equipment: ['mat'],
    level: 1,
    unit: 'seconds',
    met: 2.3,
    loadable: false,
    scaling: {},
    animation: 'child_pose',
    tags: ['cooldown', 'mobility'],
  },
  {
    id: 'worlds_greatest_stretch',
    slug: { ru: 'vypad-s-rotatsiey', en: 'worlds-greatest-stretch' },
    name: { ru: 'Выпад с ротацией', en: "World's greatest stretch" },
    shortName: { ru: 'Выпад с ротацией', en: 'Greatest stretch' },
    description: {
      ru: 'Выпад с ротацией — «лучшая растяжка в мире», как её называют в кроссфите: одно движение раскрывает тазобедренные суставы, грудной отдел, заднюю поверхность бедра и плечи. Это идеальная разминка перед приседаниями, тягами и любой тренировкой на всё тело. Делай на каждую сторону; повторения в задании указаны на одну сторону.',
      en: "The world's greatest stretch earns its name: one movement opens the hips, thoracic spine, hamstrings and shoulders together. It is the ideal warm-up before squats, hinges and any full-body session. Do it on each side; the reps in the workout are per side.",
    },
    howTo: [
      {
        ru: 'Из положения стоя шагни правой ногой в глубокий выпад, ладони поставь на пол по обе стороны от правой стопы, левая нога прямая сзади.',
        en: 'From standing, step your right foot into a deep lunge and place both hands on the floor either side of the right foot, left leg straight behind you.',
      },
      {
        ru: 'Опусти правый локоть к внутренней стороне правой стопы, задержись на секунду — тянется пах и сгибатель левого бедра.',
        en: 'Drop your right elbow toward the inside of the right foot and pause for a second — you will feel the groin and the left hip flexor stretch.',
      },
      {
        ru: 'Поставь правую ладонь на пол, разверни грудь вправо и вытяни правую руку к потолку, взгляд за ладонью.',
        en: 'Place the right hand back on the floor, rotate your chest to the right and reach the right arm to the ceiling, eyes following the hand.',
      },
      {
        ru: 'Верни руку на пол, отведи таз назад и выпрями правую ногу, подтянув носок на себя, — растяжение задней поверхности бедра.',
        en: 'Bring the hand down, shift your hips back and straighten the right leg with the toes pulled up to stretch the hamstring.',
      },
      {
        ru: 'Вернись в выпад, встань и повтори на другую сторону — это следующее повторение.',
        en: 'Return to the lunge, stand up and repeat on the other side — that is the next rep.',
      },
    ],
    cues: [
      { ru: 'Задняя нога прямая', en: 'Back leg straight' },
      { ru: 'Раскрывай грудь к потолку', en: 'Open the chest to the ceiling' },
      { ru: 'Медленно, без рывков', en: 'Slow, no bouncing' },
    ],
    mistakes: [
      { ru: 'Переднее колено заваливается внутрь', en: 'Front knee collapsing inward' },
      {
        ru: 'Ротация только рукой, грудь не разворачивается',
        en: 'Rotating only the arm while the chest stays still',
      },
      {
        ru: 'Спешка — каждое положение заслуживает секундной паузы',
        en: 'Rushing through — every position deserves a one-second pause',
      },
    ],
    breathing: {
      ru: 'Выдох в каждом новом положении: локоть вниз, ротация, наклон.',
      en: 'Exhale into each position: elbow down, rotation, hamstring fold.',
    },
    muscles: ['hip_flexors', 'hamstrings', 'glutes', 'back', 'shoulders'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'reps',
    secondsPerRep: 8.0,
    met: 3.0,
    loadable: false,
    scaling: {},
    animation: 'worlds_greatest_stretch',
    tags: ['warmup', 'mobility', 'unilateral'],
  },
  {
    id: 'squat_hold',
    slug: { ru: 'uderzhanie-v-prisede', en: 'bottom-squat-hold' },
    name: { ru: 'Удержание в приседе', en: 'Bottom squat hold' },
    shortName: { ru: 'Глубокий присед', en: 'Squat hold' },
    description: {
      ru: 'Удержание в глубоком приседе — статика в нижней точке приседания. Пока ты сидишь, раскрываются голеностопы и тазобедренные суставы, а тело запоминает правильное положение: пятки на полу, колени наружу, спина прямая. Мы ставим его в разминку перед приседаниями и выпадами, а ещё это отличный тест твоей подвижности.',
      en: 'The bottom squat hold is a static hold at the very bottom of a squat. While you sit, the ankles and hips open up and your body learns the right position: heels down, knees out, back flat. We use it in warm-ups before squats and lunges, and it doubles as a quick check of your mobility.',
    },
    howTo: [
      {
        ru: 'Стопы на ширине плеч, носки слегка наружу. Присядь как можно глубже, сохраняя пятки на полу.',
        en: 'Feet shoulder-width apart, toes slightly out. Squat as deep as you can while keeping your heels on the floor.',
      },
      {
        ru: 'Сложи ладони перед грудью и локтями мягко разведи колени наружу, чтобы они шли по направлению носков.',
        en: 'Bring your palms together in front of your chest and gently press your knees outward with your elbows so they track over the toes.',
      },
      {
        ru: 'Подними грудь, тянись макушкой вверх, поясница нейтральная — не округляй её.',
        en: 'Lift your chest, reach the crown of your head up and keep the lower back neutral — do not let it round.',
      },
      {
        ru: 'Держи положение заданное время, спокойно дыша; при желании слегка покачивайся из стороны в сторону, чтобы раскрыть тазобедренные суставы.',
        en: 'Hold for the prescribed time, breathing calmly; rock gently side to side if you like to open the hips.',
      },
    ],
    cues: [
      { ru: 'Пятки на полу', en: 'Heels down' },
      { ru: 'Колени наружу локтями', en: 'Elbows push the knees out' },
      { ru: 'Грудь вверх', en: 'Chest up' },
    ],
    mistakes: [
      { ru: 'Пятки отрываются от пола', en: 'Heels lifting off the floor' },
      {
        ru: 'Поясница округлена, таз подкручен',
        en: 'Lower back rounding and the pelvis tucking under',
      },
      { ru: 'Колени сваливаются внутрь', en: 'Knees caving inward' },
    ],
    breathing: {
      ru: 'Медленно и глубоко, на выдохе опускайся чуть ниже.',
      en: 'Slow and deep, sinking a touch lower on each exhale.',
    },
    muscles: ['glutes', 'quads', 'hip_flexors', 'calves'],
    pattern: 'mobility',
    equipment: ['none'],
    level: 1,
    unit: 'seconds',
    met: 2.8,
    loadable: false,
    scaling: {},
    animation: 'squat_hold',
    tags: ['warmup', 'mobility', 'lower'],
  },
];
