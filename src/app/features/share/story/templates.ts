/**
 * The six story designs, as data (design/CHANGELOG.md §24).
 *
 * The owner asked for «весёлый разный брендинг, чтобы каждый раз был интерес, какая сторис будет».
 * So a finished workout gets one of six pictures, picked by the session id: reopening the same
 * workout shows the same one (a story someone already posted does not change under them), and
 * «Другой вариант» walks to the next.
 *
 * Every colour here comes from the semantic map (`COLOUR`, `GRAD_WARM_STOPS`), and every pair of
 * type on a fill is listed in `pairs` so `contrast.test.ts` can hold each at ≥ 4.5 — the same rule
 * the screens live by. The gradient templates list every stop that sits under type: the full
 * crossroads gradient ends in electric blue (2.16 with ink), which is why that template carries its
 * figures and the wordmark on a graphite plate and keeps ink only where the gradient is still warm.
 *
 * Pure: no DOM, so the choice and the pairs are tested in node.
 */
import { COLOUR, GRAD_WARM_STOPS } from '@/lib/ui/semantic';

export const STORY_TEMPLATES = [
  'field',
  'neon',
  'warm',
  'crossroads',
  'effort',
  'graphite',
] as const;

export type StoryTemplateId = (typeof STORY_TEMPLATES)[number];

export type StoryBackground =
  | { kind: 'solid'; colour: string }
  /** A CSS-style linear gradient: `angle` in degrees, 0 pointing up, 90 to the right. */
  | { kind: 'gradient'; angle: number; stops: readonly (readonly [number, string])[] };

export interface StoryTemplate {
  id: StoryTemplateId;
  background: StoryBackground;
  /** Fractal grain over the background (graphite only). */
  grain: boolean;
  /** Every text colour paired with the fill it is drawn on. */
  pairs: readonly (readonly [text: string, fill: string])[];
}

const WHITE = '#ffffff';

/*
 * `--grad-warm` is 100deg #afe9fd 0%, #ffe6d0 45%, #ff5a00 100%; `--grad-crossroads` is 115deg
 * with the stops at 0 / 32 / 62 / 100%. The crossroads angle is turned towards the vertical here
 * (160deg): on a 9:16 canvas the CSS angle would put the electric blue down the whole right edge,
 * under the workout's name; turned, the top half stays light blue and beige for ink and the blue
 * gathers at the foot, behind the graphite plate.
 */
const WARM_STOPS: readonly (readonly [number, string])[] = [
  [0, GRAD_WARM_STOPS[0]],
  [0.45, GRAD_WARM_STOPS[1]],
  [1, GRAD_WARM_STOPS[2]],
];
const CROSSROADS_STOPS: readonly (readonly [number, string])[] = [
  [0, COLOUR.accent],
  [0.32, COLOUR.beige],
  [0.62, COLOUR.effort],
  [1, COLOUR.field],
];

export const TEMPLATES: Readonly<Record<StoryTemplateId, StoryTemplate>> = {
  /* Electric blue, white type, «Готово!» as the light-blue key word under a neon swoosh. */
  field: {
    id: 'field',
    background: { kind: 'solid', colour: COLOUR.field },
    grain: false,
    pairs: [
      [WHITE, COLOUR.field],
      [COLOUR.accent, COLOUR.field],
    ],
  },
  /* Neon, ink, one figure the size of the picture. */
  neon: {
    id: 'neon',
    background: { kind: 'solid', colour: COLOUR.action },
    grain: false,
    pairs: [[COLOUR.ink, COLOUR.action]],
  },
  /* The club's warm gradient under ink; the figures as a ruled list. */
  warm: {
    id: 'warm',
    background: { kind: 'gradient', angle: 100, stops: WARM_STOPS },
    grain: false,
    pairs: WARM_STOPS.map(([, c]) => [COLOUR.ink, c] as const),
  },
  /* The full crossroads gradient; the figures and the mark on a graphite plate. */
  crossroads: {
    id: 'crossroads',
    background: { kind: 'gradient', angle: 160, stops: CROSSROADS_STOPS },
    grain: false,
    pairs: [
      [COLOUR.ink, COLOUR.accent],
      [COLOUR.ink, COLOUR.beige],
      [COLOUR.ink, COLOUR.effort],
      [WHITE, COLOUR.ground],
      [COLOUR.accent, COLOUR.ground],
    ],
  },
  /* Effort orange under ink; the figures as tilted stickers. */
  effort: {
    id: 'effort',
    background: { kind: 'solid', colour: COLOUR.effort },
    grain: false,
    pairs: [
      [COLOUR.ink, COLOUR.effort],
      [WHITE, COLOUR.ink],
      [COLOUR.ink, WHITE],
      [COLOUR.ink, COLOUR.action],
    ],
  },
  /* Graphite with grain, light-blue figures, a tilted neon sticker. */
  graphite: {
    id: 'graphite',
    background: { kind: 'solid', colour: COLOUR.ground },
    grain: true,
    pairs: [
      [WHITE, COLOUR.ground],
      [COLOUR.accent, COLOUR.ground],
      [COLOUR.ink, COLOUR.action],
    ],
  },
};

/** FNV-1a over the string: a stable, well-spread number from a session id. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The template for a session: the same seed always gives the same one. */
export function pickTemplate(seed: string | undefined): StoryTemplateId {
  const n = seed ? hashSeed(seed) : 0;
  return STORY_TEMPLATES[n % STORY_TEMPLATES.length] ?? 'field';
}

/** «Другой вариант»: the next template, wrapping round after the sixth. */
export function nextTemplate(id: StoryTemplateId): StoryTemplateId {
  const i = STORY_TEMPLATES.indexOf(id);
  return STORY_TEMPLATES[(i + 1) % STORY_TEMPLATES.length] ?? 'field';
}
