/**
 * Client before/after results shown on the landing.
 *
 * Empty by default, and the section does not render at all while it is empty — an invented
 * transformation would be a fabricated claim about a real person's body and a real coach's work.
 *
 * Before publishing a pair:
 *  - get the client's written permission for the specific photos, on a public commercial page;
 *  - set `consent` to the date that permission was given (the section skips pairs without it).
 *
 * The page shows the photographs and nothing else. No "12 weeks", no course name: the owner asked
 * for neither, and that is the safer choice anyway — a duration or a programme named next to a
 * transformation is a performance claim, and a claim has to be substantiated. `weeks` and
 * `courseId` stay in the type as internal record-keeping so the provenance of a photo is known
 * even though it is not printed.
 *
 * Photos live under /public/results/ and are referenced from the site root, e.g.
 * '/results/anna.jpg'. Two shapes are supported, because real coaching photos come both ways:
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

export const RESULTS: readonly ResultPair[] = [];

/** Pairs that may actually be published: usable imagery plus consent on record. */
export function publishableResults(): readonly ResultPair[] {
  return RESULTS.filter((r) => Boolean(r.consent) && (r.composite || (r.before && r.after)));
}
