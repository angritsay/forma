/**
 * Coach profile. Shown on /about, in course pages and in JSON-LD (Person).
 *
 * Everything here comes from the coach's own profi.ru profile (profi.ru/profile/TitovSA5).
 * Keep it that way: this page sells his courses under his name, so a claim that cannot be
 * traced back to something he published should not appear.
 *
 * Deliberately NOT reproduced here: the list of conditions he works with in personal training
 * (protrusions, hernias, diastasis). That is his one-to-one practice with a coach watching every
 * rep. The courses in this app are unsupervised home programs, and putting the two next to each
 * other would read as "these programs are suitable for a herniated disc" — a health claim the
 * product cannot support. If it belongs anywhere it is /about, explicitly framed as his personal
 * training rather than as a property of the courses.
 */
import type { L10n } from '@/content/schema';

export const COACH = {
  name: { ru: 'Сергей Титов', en: 'Sergey Titov' } satisfies L10n,
  role: {
    ru: 'Тренер по общей физической подготовке и кроссфиту',
    en: 'Strength, conditioning and CrossFit coach',
  } satisfies L10n,
  bio: {
    ru: 'Тренирует с 2015 года: лёгкая атлетика, спортивное ориентирование, кроссфит. Ведёт общую и специальную физическую подготовку — сила и выносливость, мышцы кора, осанка, работа с опорно-двигательным аппаратом, коррекция веса. Домашние программы Forma собраны из той же логики нагрузки, что и его персональные занятия.',
    en: 'Coaching since 2015, with a background in track and field, orienteering and CrossFit. Works on general and sport-specific conditioning — strength and endurance, core, posture, the musculoskeletal system and body composition. The Forma home programs are built on the same load logic as his personal sessions.',
  } satisfies L10n,
  /** Facts from the profile. Each one is checkable — no rounded-up years, no invented titles. */
  credentials: [
    {
      ru: 'Волгоградский государственный социально-педагогический университет, физическая культура — учитель физической культуры (2016)',
      en: 'Volgograd State Socio-Pedagogical University, physical education — physical education teacher (2016)',
    },
    { ru: 'Тренерская работа с 2015 года', en: 'Coaching since 2015' },
    {
      ru: 'Более 10 000 часов персональных занятий',
      en: 'More than 10,000 hours of personal training sessions',
    },
    {
      ru: 'Первый взрослый разряд по спортивному ориентированию (2014)',
      en: 'First adult rank in orienteering (2014)',
    },
    {
      ru: 'Второй взрослый разряд по лёгкой атлетике (2016)',
      en: 'Second adult rank in track and field (2016)',
    },
    { ru: 'В спорте с 2010 года', en: 'In sport since 2010' },
  ] as L10n[],
  /**
   * Photo path under /public (optional; the card falls back to a monogram tile without it).
   * This is his own profi.ru portrait, cropped square by salience so the crop keeps his headroom.
   * The source is only 240x320, so it is sharp at 1x in the 200 px slot and soft on a retina
   * screen — worth replacing with a larger original when one is to hand.
   */
  photo: '/coach/sergey.jpg',
  /**
   * Large photograph for the home hero, under /public. Empty falls back to the animated figure.
   *
   * This is the whole frame of the owner's photograph, resized to 1200x1600 and not cropped —
   * the brand's hero is a full-bleed shot with the person small in it, and cropping in on him
   * would throw away the sky and the horizon that make the composition. It ships in colour: the
   * hero applies `.photo-mono`, `.photo-grain` and `.photo-scrim` in CSS, so the monochrome
   * treatment lives in one place and this file can be swapped without re-editing it.
   *
   * Worth replacing when there is a better frame: he is looking at a phone here, and his eyes are
   * behind sunglasses, so this reads as atmosphere rather than as a portrait. A photograph of him
   * coaching — 4:5, at least 1200x1600, room around him — would say more. The small square
   * portrait above (`photo`) is the one that carries his face, and it is 240x240: a larger
   * version of *that* is the more valuable of the two to find.
   */
  heroPhoto: '/coach/sergey-hero.jpg' as string,
  links: [{ label: 'profi.ru', url: 'https://profi.ru/profile/TitovSA5/' }] as {
    label: string;
    url: string;
  }[],
} as const;
