/**
 * Client before/after results shown on the landing.
 *
 * Empty by default, and the section does not render at all while it is empty — an invented
 * transformation would be a fabricated claim about a real person's body and a real coach's work.
 *
 * Before publishing a pair:
 *  - get the client's written permission for the specific photos, on a public commercial page;
 *  - set `consent` to the date that permission was given (the section skips pairs without it);
 *  - keep `weeks` honest and say what the program was — a result over 24 weeks presented as 8
 *    is the kind of claim consumer-protection law treats as misleading advertising.
 *
 * Photos live under /public/results/ and are referenced from the site root, e.g.
 * '/results/anna-before.jpg'. Portrait crops at the same framing and distance compare best.
 */
import type { L10n } from '@/content/schema';

export interface ResultPair {
  /** Stable id, used as the React/Astro key and in the anchor. */
  id: string;
  /** Path under /public — both photos should share framing, distance and lighting. */
  before: string;
  after: string;
  /** Alternative text for each photo, per locale. Describe the person, not just "before". */
  beforeAlt: L10n;
  afterAlt: L10n;
  /** Who this is, as they agreed to be named — a first name or an initial is fine. */
  name?: L10n;
  /** How long the change took. Never round this down. */
  weeks: number;
  /** Which course they followed, by course id, so the claim is attributable. */
  courseId?: string;
  /** One honest sentence in the client's or coach's words. */
  quote?: L10n;
  /** ISO date the client agreed to these photos being published. Required to render. */
  consent?: string;
}

export const RESULTS: readonly ResultPair[] = [];

/** Pairs that may actually be published: both photos present and consent on record. */
export function publishableResults(): readonly ResultPair[] {
  return RESULTS.filter((r) => r.before && r.after && r.consent);
}
