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

/**
 * A credential, named, so a figure below can point at the one it restates.
 *
 * Identity is the link: `CoachFigure.of` holds the very same object, so the booking screen can
 * lift a credential into a figure and drop it from the list without matching strings or indexes.
 */
const ED: L10n = {
  ru: 'Волгоградский государственный социально-педагогический университет, физическая культура — учитель физической культуры (2016)',
  en: 'Volgograd State Socio-Pedagogical University, physical education — physical education teacher (2016)',
};
const SINCE_2015: L10n = { ru: 'Тренерская работа с 2015 года', en: 'Coaching since 2015' };
const HOURS: L10n = {
  ru: 'Более 10 000 часов персональных занятий',
  en: 'More than 10,000 hours of personal training sessions',
};

/*
 * Three credentials used to stand here and no longer do — a first adult rank in orienteering
 * (2014), a second in track and field (2016), and «В спорте с 2010 года».
 *
 * They went on the owner's instruction, and the instruction is right about who is reading. They are
 * true and they are on his profile; they are also *his* sporting results, and this list exists to
 * answer «почему я должен слушать этого человека про свою тренировку». A youth rank in a sport
 * nobody buying a home-CrossFit course competes in does not answer that — it answers a different
 * question, one the reader did not ask. What is left is the three facts that do: what he was
 * taught, how long he has coached, and how much of it he has actually done.
 */

/** A credential that is a number, set as the number. `of` is the credential it restates. */
export interface CoachFigure {
  /** The figure itself, already formatted — it is read, not computed against. */
  value: string;
  /** The kicker under it. Short: it sits in an `.eyebrow`. */
  label: L10n;
  /** The credential this is the same fact as, by object identity. */
  of: L10n;
}

/** Which service a link points at — it picks the mark drawn beside the address. */
export type CoachLinkKind = 'profi' | 'instagram' | 'telegram';

export interface CoachLink {
  kind: CoachLinkKind;
  label: string;
  url: string;
}

/**
 * His Telegram username, without the «@». Empty until the owner supplies it — the owner asked
 * for a Telegram link («надо бы тг ещё дать») and the account could not be looked up from here, so
 * nothing is guessed: while this is empty the link is simply not drawn, on the tab, on the site and
 * in the JSON-LD `sameAs` alike. Filling it in is the whole change.
 */
export const COACH_TELEGRAM = '';

export const COACH = {
  name: { ru: 'Сергей Титов', en: 'Sergey Titov' } satisfies L10n,
  role: {
    ru: 'Тренер по общей физической подготовке и кроссфиту',
    en: 'Strength, conditioning and CrossFit coach',
  } satisfies L10n,
  /**
   * How he is introduced inside the product, as against on profi.ru.
   *
   * The one line here that is not from the profile, and deliberately: it is the owner's own
   * framing — «тренировка с основателем и тренером формы» — and it is the half that makes an hour
   * with him different from an hour with any coach. It lives here so the booking tab and the
   * club's prize say it the same way rather than each inventing a phrasing.
   */
  formaRole: {
    ru: 'Основатель и тренер Forma',
    en: 'Founder and coach of Forma',
  } satisfies L10n,
  /**
   * The same framing as two short stickers, for the booking tab's hero. As one pill the line was
   * cut to «Founder and coach of …» on a phone; the owner: «сделай это двумя разными пилюлями».
   */
  formaRoles: [
    { ru: 'Основатель Forma', en: 'Founder of Forma' },
    { ru: 'Тренер', en: 'Coach' },
  ] as readonly L10n[],
  bio: {
    ru: 'Тренирует с 2015 года: лёгкая атлетика, спортивное ориентирование, кроссфит. Ведёт общую и специальную физическую подготовку — сила и выносливость, мышцы кора, осанка, работа с опорно-двигательным аппаратом, коррекция веса. Домашние программы Forma собраны из той же логики нагрузки, что и его персональные занятия.',
    en: 'Coaching since 2015, with a background in track and field, orienteering and CrossFit. Works on general and sport-specific conditioning — strength and endurance, core, posture, the musculoskeletal system and body composition. The Forma home programs are built on the same load logic as his personal sessions.',
  } satisfies L10n,
  /** Facts from the profile. Each one is checkable — no rounded-up years, no invented titles. */
  credentials: [ED, SINCE_2015, HOURS] as readonly L10n[],
  /**
   * The two credentials that are numbers, set as numbers.
   *
   * Nothing new is claimed: each figure is the credential in `of`, with its number pulled out and
   * the rest of the sentence left as the label. «Более 10 000» becomes «10 000+» and that is the
   * whole transformation. A surface that shows the figures (the booking tab) drops the credentials
   * they came from out of its list, so the same fact is never on screen twice.
   *
   * The years figure used to be the bare year, «2015 · тренирует с», and the owner replaced it:
   * «Вместо тренирует с написать 10+ лет работы персональным тренером». She is reading it the way
   * a buyer does — a year is a date to subtract from, a span is the answer you wanted — and the
   * span is also the thing being sold, which is not the calendar but the practice behind it.
   *
   * **It is a floor, and that is why it is written rather than computed.** 2026 − 2015 is eleven,
   * so «10+» is true today and stays true every year after: a floor claim can only become more
   * conservative with time, never false. Computing it from `new Date()` would make a static build's
   * output depend on the day it was built, for a number that moves once a year. Round it up to
   * «15+» when that reads better; nothing checks it, and nothing can, because 2015 is the fact and
   * this is its poster.
   */
  figures: [
    {
      value: '10 000+',
      label: { ru: 'персональных часов', en: 'one-to-one hours' },
      of: HOURS,
    },
    {
      value: '10+',
      label: { ru: 'лет персональным тренером', en: 'years as a personal trainer' },
      of: SINCE_2015,
    },
  ] as readonly CoachFigure[],
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
  /*
   * Where he can be found, in his own words rather than ours.
   *
   * Both entries are labelled with the address itself — `profi.ru`, `@titovtrener` — and not with
   * the platform's name. The handle says whose account it is, which «Instagram» does not, and it
   * is the string he would give someone who asked.
   *
   * These are the only outbound links about him on the site, and `sameAs` in the Person JSON-LD is
   * built from exactly this array, so anything added here is also a claim to a search engine that
   * the account is his. The owner supplied the handle directly; it could not be verified from here
   * because Instagram is unreachable from this environment, and a similarly-named trainer found by
   * search would not have been proof of anything.
   */
  links: [
    { kind: 'profi', label: 'profi.ru', url: 'https://profi.ru/profile/TitovSA5/' },
    { kind: 'instagram', label: '@titovtrener', url: 'https://www.instagram.com/titovtrener/' },
    ...(COACH_TELEGRAM
      ? [
          {
            kind: 'telegram' as const,
            label: `@${COACH_TELEGRAM}`,
            url: `https://t.me/${COACH_TELEGRAM}`,
          },
        ]
      : []),
  ] as CoachLink[],
} as const;
