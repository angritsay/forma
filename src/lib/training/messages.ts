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
  heavySteps: {
    ru: 'Вчера было больше 15 000 шагов — ноги уже поработали.',
    en: 'You walked over 15,000 steps yesterday — your legs already did their share.',
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

export const ACHIEVEMENT_COPY = {
  first_workout: {
    title: { ru: 'Первый шаг', en: 'First step' },
    description: { ru: 'Заверши первую тренировку.', en: 'Finish your first workout.' },
  },
  workouts_5: {
    title: { ru: 'В ритме', en: 'In the groove' },
    description: { ru: 'Заверши 5 тренировок.', en: 'Finish 5 workouts.' },
  },
  workouts_25: {
    title: { ru: 'Постоянство', en: 'Consistency' },
    description: { ru: 'Заверши 25 тренировок.', en: 'Finish 25 workouts.' },
  },
  workouts_100: {
    title: { ru: 'Сотня', en: 'Century' },
    description: { ru: 'Заверши 100 тренировок.', en: 'Finish 100 workouts.' },
  },
  streak_3: {
    title: { ru: 'Разгон', en: 'Warm start' },
    description: { ru: 'Держи серию 3 дня подряд.', en: 'Keep a 3-day streak.' },
  },
  streak_7: {
    title: { ru: 'Неделя без пропусков', en: 'Seven straight' },
    description: { ru: 'Держи серию 7 дней подряд.', en: 'Keep a 7-day streak.' },
  },
  streak_30: {
    title: { ru: 'Месяц дисциплины', en: 'Thirty strong' },
    description: { ru: 'Держи серию 30 дней подряд.', en: 'Keep a 30-day streak.' },
  },
  steps_10_days: {
    title: { ru: 'Ходок', en: 'Walker' },
    description: {
      ru: 'Выполни цель по шагам в 10 разных дней.',
      en: 'Hit your steps goal on 10 different days.',
    },
  },
  first_benchmark: {
    title: { ru: 'Точка отсчёта', en: 'Baseline' },
    description: { ru: 'Пройди первый тест.', en: 'Complete your first benchmark test.' },
  },
  course_completed: {
    title: { ru: 'Финишер', en: 'Finisher' },
    description: { ru: 'Пройди курс до конца.', en: 'Complete a course from start to finish.' },
  },
  points_1000: {
    title: { ru: 'Тысячник', en: 'Thousand' },
    description: { ru: 'Набери 1 000 очков.', en: 'Earn 1,000 points.' },
  },
  points_10000: {
    title: { ru: 'Десять тысяч', en: 'Ten thousand' },
    description: { ru: 'Набери 10 000 очков.', en: 'Earn 10,000 points.' },
  },
  minutes_600: {
    title: { ru: 'Десять часов', en: 'Ten hours' },
    description: {
      ru: 'Проведи в тренировках 600 минут.',
      en: 'Spend 600 minutes training.',
    },
  },
} as const satisfies Record<string, { title: L10n; description: L10n }>;

export type AchievementId = keyof typeof ACHIEVEMENT_COPY;
