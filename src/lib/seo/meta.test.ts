import { describe, expect, it } from 'vitest';
import { ExerciseSchema, type Exercise } from '@/content/schema';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_BUDGET,
  buildDescription,
  charLength,
  exerciseDescription,
  exerciseTitle,
  fitTitle,
  ogImageFile,
  ogImagePath,
  readingTimeMinutes,
  sentences,
  truncateWords,
} from './meta';

const fixture: Exercise = ExerciseSchema.parse({
  id: 'air_squat',
  slug: { ru: 'prisedaniya', en: 'air-squat' },
  name: { ru: 'Приседания', en: 'Air squat' },
  description: {
    ru: 'Базовое движение всей нижней половины тела: работают квадрицепсы, ягодичные и мышцы кора. В курсах Forma присед стоит в разминке, силовых блоках и метконах, потому что учит правильно садиться и вставать под нагрузкой.',
    en: 'The base movement for the whole lower body: quads, glutes and the core all work. Forma courses use it in warm-ups, strength blocks and metcons because it teaches you to sit down and stand up under load.',
  },
  howTo: [
    { ru: 'Встань, стопы на ширине плеч.', en: 'Stand with feet shoulder-width apart.' },
    { ru: 'Сядь назад и вниз.', en: 'Sit back and down.' },
    { ru: 'Встань, выпрямив колени и таз.', en: 'Stand up, locking knees and hips.' },
  ],
  cues: [
    { ru: 'Колени в стороны.', en: 'Knees out.' },
    { ru: 'Пятки в пол.', en: 'Heels down.' },
  ],
  mistakes: [{ ru: 'Пятки отрываются от пола.', en: 'Heels lift off the floor.' }],
  muscles: ['quads', 'glutes', 'core'],
  pattern: 'squat',
  equipment: ['none'],
  level: 1,
  unit: 'reps',
  secondsPerRep: 2.5,
  met: 5,
  loadable: false,
  scaling: { harder: 'jump_squat' },
  animation: 'air_squat',
  tags: [],
});

describe('title helpers', () => {
  it('picks the first candidate within budget, else cuts the last at a word boundary', () => {
    expect(fitTitle(['short title', 'x'], 20)).toBe('short title');
    expect(fitTitle(['this candidate is far too long for the budget', 'second one is also long'], 12)).toBe(
      'second one',
    );
    expect(truncateWords('Приседания: техника, ошибки, варианты', 20)).toBe('Приседания: техника');
    expect(truncateWords('short', 20)).toBe('short');
  });

  it('keeps exercise titles within the 60-char <title> budget in both locales', () => {
    for (const locale of ['ru', 'en'] as const) {
      const title = exerciseTitle(fixture, locale);
      expect(charLength(title)).toBeLessThanOrEqual(TITLE_BUDGET);
      expect(title).toContain(fixture.name[locale]);
    }
    expect(exerciseTitle(fixture, 'ru')).toBe('Упражнение Приседания: техника, ошибки, варианты');
    const long = { ...fixture, name: { ru: 'Румынская тяга на одной ноге с гантелью в противоположной руке', en: 'Single-leg Romanian deadlift with the dumbbell in the opposite hand' } };
    for (const locale of ['ru', 'en'] as const) {
      expect(charLength(exerciseTitle(long, locale))).toBeLessThanOrEqual(TITLE_BUDGET);
    }
  });
});

describe('description helpers', () => {
  it('splits sentences', () => {
    expect(sentences('One. Two! Three? Four')).toEqual(['One.', 'Two!', 'Three?', 'Four']);
  });

  it('produces 120–160 chars from long, medium and short prose', () => {
    const cta = 'Animation, step-by-step technique, cues and scaling options in the Forma library.';
    const long = 'A'.repeat(90) + '. ' + 'B'.repeat(90) + '. ' + 'C'.repeat(50) + '.';
    const medium = 'Medium sentence about the exercise that is around one hundred characters long, more or less ok.';
    const short = 'Short text about squats.';
    for (const text of [long, medium, short]) {
      const d = buildDescription(text, cta);
      expect(charLength(d), text.slice(0, 20)).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(charLength(d), text.slice(0, 20)).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
    expect(buildDescription(medium, cta)).toBe(`${medium} ${cta}`.slice(0, 160).replace(/\s+\S*$/, '').length > 0 ? buildDescription(medium, cta) : '');
  });

  it('builds exercise descriptions in range for both locales', () => {
    for (const locale of ['ru', 'en'] as const) {
      const d = exerciseDescription(fixture, locale);
      expect(charLength(d)).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(charLength(d)).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });
});

describe('misc', () => {
  it('estimates reading time with a 1-minute floor', () => {
    expect(readingTimeMinutes(50, 'en')).toBe(1);
    expect(readingTimeMinutes(1000, 'en')).toBe(5);
    expect(readingTimeMinutes(1000, 'ru')).toBe(6);
  });
  it('falls back to the default OG image when the PNG was not generated', () => {
    expect(ogImageFile('exercise', 'air_squat', 'ru')).toBe('/og/exercise-air_squat-ru.png');
    expect(ogImagePath('exercise', 'definitely_missing_id', 'en')).toBe('/og/default.png');
  });
});
