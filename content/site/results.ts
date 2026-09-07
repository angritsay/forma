/**
 * Client before/after results shown on the landing.
 *
 * These are real people. Every pair here is one of Sergey's clients, photographed by them at home
 * and published with permission — the owner confirmed on 2026-09-07 that permission is held for
 * all ten. `consent` records that confirmation date; the underlying agreements sit with the coach.
 * The section renders nothing without it, so a pair can never reach the page by accident.
 *
 * The page shows the photographs and nothing else. No "12 weeks", no course name: the owner asked
 * for neither, and that is the safer choice anyway — a duration or a programme named next to a
 * transformation is a performance claim, and a claim has to be substantiated. `weeks` and
 * `courseId` stay in the type as internal record-keeping so the provenance of a photo is known
 * even though it is not printed.
 *
 * Before adding a pair:
 *  - get the client's written permission for the specific photos, on a public commercial page;
 *  - set `consent` to the date that permission was given;
 *  - write `compositeAlt` describing what actually changed, left to right. Someone using a screen
 *    reader is here for the same reason as everyone else, and "before and after" tells them
 *    nothing.
 *
 * Photos live under /public/results/ and are referenced from the site root, e.g.
 * '/results/result-01.jpg'. Two shapes are supported, because real coaching photos come both ways:
 *   - `composite`: one image with the panels already joined side by side (what the coach's
 *     archive actually holds — two panels, sometimes three for a longer progression);
 *   - `before` + `after`: two separate files, which the page joins itself.
 * Either form needs `consent`. Portrait crops at the same framing and distance compare best.
 */
import type { L10n } from '@/content/schema';

export interface ResultPair {
  /** Stable id, used as the React/Astro key and in the anchor. */
  id: string;
  /** One image with the panels already joined. Takes precedence over before/after. */
  composite?: string;
  /** Alternative text for the joined image, per locale. Say what changed, left to right. */
  compositeAlt?: L10n;
  /** Two separate files — both should share framing, distance and lighting. */
  before?: string;
  after?: string;
  /** Alternative text for each photo, per locale. Describe the person, not just "before". */
  beforeAlt?: L10n;
  afterAlt?: L10n;
  /** Who this is, as they agreed to be named — a first name or an initial is fine. */
  name?: L10n;
  /** How long the change took. Recorded, never displayed. Never round this down. */
  weeks?: number;
  /** Which course they followed, by course id. Recorded, never displayed. */
  courseId?: string;
  /** One honest sentence in the client's or coach's words. */
  quote?: L10n;
  /** ISO date the client agreed to these photos being published. Required to render. */
  consent?: string;
}

const CONSENT = '2026-09-07';

export const RESULTS: readonly ResultPair[] = [
  {
    id: 'r01',
    composite: '/results/result-01.jpg',
    compositeAlt: {
      ru: 'Женщина со спины, до и после: заметно меньше объёма в талии, спине и бёдрах, появился рельеф спины.',
      en: 'A woman photographed from behind, before and after: markedly less around the waist, back and hips, with visible definition in the back.',
    },
    consent: CONSENT,
  },
  {
    id: 'r02',
    composite: '/results/result-02.jpg',
    compositeAlt: {
      ru: 'Женщина со спины в спортивном белье, до и после: ушёл объём с талии, рук и бёдер.',
      en: 'A woman from behind in sports underwear, before and after: less around the waist, arms and thighs.',
    },
    consent: CONSENT,
  },
  {
    id: 'r03',
    composite: '/results/result-03.jpg',
    compositeAlt: {
      ru: 'Женщина со спины, до и после: значительно меньше объёма в бёдрах и талии, ноги стали стройнее.',
      en: 'A woman from behind, before and after: much less volume through the hips and waist, legs visibly leaner.',
    },
    consent: CONSENT,
  },
  {
    id: 'r04',
    composite: '/results/result-04.jpg',
    compositeAlt: {
      ru: 'Мужчина со спины, до и после: ушёл жир с поясницы, шире стали плечи, заметнее мышцы спины.',
      en: 'A man from behind, before and after: fat gone from the lower back, broader shoulders and clearer muscle across the back.',
    },
    consent: CONSENT,
  },
  {
    id: 'r05',
    composite: '/results/result-05.jpg',
    compositeAlt: {
      ru: 'Молодой мужчина со спины, до и после: выросли мышцы спины и плеч, осанка стала ровнее.',
      en: 'A young man from behind, before and after: back and shoulder muscle built, posture straighter.',
    },
    consent: CONSENT,
  },
  {
    id: 'r06',
    composite: '/results/result-06.jpg',
    compositeAlt: {
      ru: 'Мужчина со спины с поднятыми руками, до и после: рельефнее спина и руки, меньше жира на талии.',
      en: 'A man from behind with his arms raised, before and after: more definition in the back and arms, less fat at the waist.',
    },
    consent: CONSENT,
  },
  {
    id: 'r07',
    composite: '/results/result-07.jpg',
    compositeAlt: {
      ru: 'Женщина со спины, до и после: уменьшился объём талии и ног, спина стала подтянутее.',
      en: 'A woman from behind, before and after: a smaller waist and legs, and a more toned back.',
    },
    consent: CONSENT,
  },
  {
    id: 'r08',
    composite: '/results/result-08.jpg',
    compositeAlt: {
      ru: 'Женщина в профиль, до и после: живот стал плоским, осанка выпрямилась.',
      en: 'A woman in profile, before and after: a flatter stomach and straighter posture.',
    },
    consent: CONSENT,
  },
  {
    id: 'r09',
    composite: '/results/result-09.jpg',
    compositeAlt: {
      ru: 'Женщина в профиль, три этапа подряд: постепенно уходит объём с живота и бёдер.',
      en: 'A woman in profile across three stages: stomach and hips reducing step by step.',
    },
    consent: CONSENT,
  },
  {
    id: 'r10',
    composite: '/results/result-10.jpg',
    compositeAlt: {
      ru: 'Женщина со спины, до и после: подтянулись ягодицы и ноги, спина стала рельефнее.',
      en: 'A woman from behind, before and after: firmer glutes and legs, more definition in the back.',
    },
    consent: CONSENT,
  },
];

/** Pairs that may actually be published: usable imagery plus consent on record. */
export function publishableResults(): readonly ResultPair[] {
  return RESULTS.filter((r) => Boolean(r.consent) && (r.composite || (r.before && r.after)));
}
