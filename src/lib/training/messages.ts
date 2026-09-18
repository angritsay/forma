/**
 * Every localized text the engine returns: adaptation reasons, the safety note, recommendation
 * reasons, prescription notes, level titles and achievement copy. RU addresses the athlete as «ты»
 * and avoids gendered past-tense verbs so the same line works for everyone.
 */
import type { L10n } from '@/content/schema';

export const ADAPT_REASON = {
  up5: {
    ru: 'Прошлая тренировка далась легко — добавляю 5% объёма.',
    en: 'Last session felt easy — adding 5% volume.',
  },
  up2: {
    ru: 'Нагрузка была в самый раз — добавляю 2%.',
    en: 'The load was just right — adding 2%.',
  },
  down5: {
    ru: 'Было тяжело — снижаю объём на 5%, чтобы тело успело восстановиться.',
    en: 'That was tough — trimming volume by 5% so you can recover.',
  },
  keep: {
    ru: 'Оставляю нагрузку без изменений — продолжаем в том же темпе.',
    en: 'Keeping the load as it is — carry on at this pace.',
  },
  pain: {
    ru: 'Была боль — снижаю нагрузку на 10%.',
    en: 'You reported pain — reducing the load by 10%.',
  },
  atMax: {
    ru: 'Ты на максимуме шкалы: объём дальше не растёт, пора на курс посложнее.',
    en: 'You are at the top of the scale: volume stops growing here, time for a harder course.',
  },
  atMin: {
    ru: 'Ты на минимуме шкалы: ниже объём не опускаю. Отдохни и возвращайся, когда будут силы.',
    en: 'You are at the bottom of the scale: volume will not go lower. Rest and come back when ready.',
  },
} as const satisfies Record<string, L10n>;

export const SAFETY_NOTE: L10n = {
  ru: 'Боль — не норма. Если она повторяется или усиливается, сделай паузу и покажись врачу или физиотерапевту. Не тренируйся через боль.',
  en: 'Pain is not normal. If it repeats or gets worse, pause training and see a doctor or physiotherapist. Never train through pain.',
};

export const RECOMMEND_REASON = {
  firstSession: {
    ru: 'Первая тренировка курса — начинаем как обычно.',
    en: 'First session of the course — start as usual.',
  },
  ready: {
    ru: 'Последние две тренировки прошли легко, а отдых был больше двух суток — можно прибавить.',
    en: 'Your last two sessions felt easy and you have rested over 48 hours — you can push.',
  },
  highRpe: {
    ru: 'Прошлая тренировка была на пределе — сегодня полегче.',
    en: 'Last session was near your limit — take it easier today.',
  },
  lowCompletion: {
    ru: 'В прошлый раз план выполнен меньше чем на 80% — снижаем объём.',
    en: 'You completed under 80% of the last plan — let us lower the volume.',
  },
  tooSoon: {
    ru: 'С прошлой тренировки прошло меньше суток — дай телу восстановиться.',
    en: 'Less than 24 hours since your last session — give your body time to recover.',
  },
  pain: {
    ru: 'В прошлый раз была боль — сегодня бережный режим.',
    en: 'You reported pain last time — go gentle today.',
  },
  pregnancy: {
    ru: 'Во время беременности держим нагрузку умеренной.',
    en: 'During pregnancy we keep the intensity moderate.',
  },
  normal: {
    ru: 'Нагрузка в самый раз — работаем как обычно.',
    en: 'The load is about right — train as usual.',
  },
} as const satisfies Record<string, L10n>;

export const PRESCRIBE_NOTE = {
  equipmentNeeded: {
    ru: 'Нужен инвентарь: замены без него нет. Используй, что есть под рукой, или пропусти.',
    en: 'Equipment needed: there is no equipment-free substitute. Use what you have or skip it.',
  },
  limitationCaution: {
    ru: 'Упражнение может нагружать проблемную зону. Двигайся аккуратно, при дискомфорте пропусти.',
    en: 'This move may load your sensitive area. Move carefully and skip it if it hurts.',
  },
} as const satisfies Record<string, L10n>;

/** Level titles, index 0 = level 1. */
export const LEVEL_TITLES: readonly L10n[] = [
  { ru: 'Новичок', en: 'Rookie' },
  { ru: 'Стажёр', en: 'Trainee' },
  { ru: 'Атлет', en: 'Athlete' },
  { ru: 'Боец', en: 'Competitor' },
  { ru: 'Ветеран', en: 'Veteran' },
  { ru: 'Мастер', en: 'Master' },
  { ru: 'Элита', en: 'Elite' },
  { ru: 'Чемпион', en: 'Champion' },
  { ru: 'Титан', en: 'Titan' },
  { ru: 'Легенда', en: 'Legend' },
];

/*
 * The rules, and the catalogue prints them as they are written here.
 *
 * They used to be twelve imperatives in a column — «Заверши первую тренировку», «Заверши 5
 * тренировок», «Заверши 25 тренировок» — which reads as a list of orders from an app to a person
 * who has not asked for any. The rule is the same; it is stated rather than commanded, and the
 * number is the thing the eye should land on.
 */
export const ACHIEVEMENT_COPY = {
  first_workout: {
    title: { ru: 'Первый шаг', en: 'First step' },
    description: { ru: 'Одна тренировка — и он твой.', en: 'One workout and it is yours.' },
  },
  workouts_5: {
    title: { ru: 'В ритме', en: 'In the groove' },
    description: { ru: 'Пять тренировок позади.', en: 'Five workouts done.' },
  },
  workouts_25: {
    title: { ru: 'Постоянство', en: 'Consistency' },
    description: { ru: 'Двадцать пять тренировок.', en: 'Twenty-five workouts.' },
  },
  workouts_100: {
    title: { ru: 'Сотня', en: 'Century' },
    description: { ru: 'Сто тренировок. Без комментариев.', en: 'A hundred workouts. No notes.' },
  },
  // These three used to ask for 3, 7 and 30 days in a row. See `levels.ts` for why they no longer
  // do: a course with two rest days a week cannot be followed and hold a seven-day streak.
  workouts_10: {
    title: { ru: 'Разгон', en: 'Warm start' },
    description: { ru: 'Десять тренировок.', en: 'Ten workouts.' },
  },
  week_three: {
    title: { ru: 'Хорошая неделя', en: 'A good week' },
    description: { ru: 'Три тренировки за одну неделю.', en: 'Three workouts in one week.' },
  },
  weeks_8: {
    title: { ru: 'Два месяца в деле', en: 'Two months in' },
    description: {
      ru: 'Восемь недель с тренировками. Подряд — не обязательно.',
      en: 'Eight weeks with a workout in them. They need not run together.',
    },
  },
  first_benchmark: {
    title: { ru: 'Точка отсчёта', en: 'Baseline' },
    description: { ru: 'Первый тест пройден.', en: 'The first benchmark is behind you.' },
  },
  course_completed: {
    title: { ru: 'Финишер', en: 'Finisher' },
    description: { ru: 'Курс пройден до конца.', en: 'A course finished end to end.' },
  },
  points_1000: {
    title: { ru: 'Тысячник', en: 'Thousand' },
    description: { ru: 'Тысяча очков.', en: 'A thousand points.' },
  },
  points_10000: {
    title: { ru: 'Десять тысяч', en: 'Ten thousand' },
    description: { ru: 'Десять тысяч очков.', en: 'Ten thousand points.' },
  },
  minutes_600: {
    title: { ru: 'Десять часов', en: 'Ten hours' },
    description: {
      ru: 'Шестьсот минут тренировок — это десять часов.',
      en: 'Six hundred minutes of training — ten hours of it.',
    },
  },
} as const satisfies Record<string, { title: L10n; description: L10n }>;

export type AchievementId = keyof typeof ACHIEVEMENT_COPY;
