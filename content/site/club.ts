/**
 * «Клуб маленьких шагов» — the public facts of the club, and the results of the people in it.
 *
 * ## Why this file is empty
 *
 * The club's selling screen (the tab as somebody outside the club sees it) has a «Результаты
 * участников» section. It renders from `publishableClubResults()` and it renders **nothing** while
 * that list is empty, which is the state it ships in.
 *
 * That is deliberate. `docs/SPEC.md` forbids invented reviews, testimonials, statistics and
 * before/after claims, and the rule has already been enforced twice on this project. A placeholder
 * testimonial — even an obviously fake one, even one marked TODO — is a sentence that gets
 * forgotten and shipped, and a fabricated result on a page that takes money is the one mistake
 * this product cannot recover from. So there is no placeholder here, and the screen is built to
 * look finished without one.
 *
 * The club's own participants are a different set of people from the ones in
 * `content/site/results.ts`: those are Sergey's personal-training clients, photographed before and
 * after, published with their permission. Their photographs are real, but they are results of
 * one-to-one coaching, not of this club — printing them under «Результаты участников» beside
 * «Вступить за N ₽ / мес» would say the club produced them, which nothing supports. When a club
 * member finishes a round and agrees to be quoted, they go below, and the section appears by
 * itself.
 *
 * ## Adding one
 *
 * Same discipline as `results.ts`:
 *  - ask the person, in writing, for permission to publish this specific text (and photo) on a
 *    public commercial page;
 *  - set `consent` to the date they agreed. Without it the entry does not render, so nothing can
 *    reach the screen by accident;
 *  - quote them. Do not write the sentence for them and do not tidy it into marketing;
 *  - `fact` is optional and must be checkable from the club's own data — «7 дней из 7», «второе
 *    место на неделе». Never a body claim, never a number nobody counted.
 */
import type { L10n } from '@/content/schema';

export interface ClubResult {
  /** Stable id, used as the React key. */
  id: string;
  /** Who this is, as they agreed to be named — a first name is fine. */
  name: L10n;
  /** Their own sentence about the round, in their own words. */
  quote: L10n;
  /** One checkable fact from the club's data, shown as a pill. Optional. */
  fact?: L10n;
  /** ISO date the person agreed to this being published. Required to render. */
  consent?: string;
}

/**
 * Real people who have played a round of the club. Empty until there are some — see the note
 * above before adding anything at all.
 */
export const CLUB_RESULTS: readonly ClubResult[] = [];

/** The entries that may actually be shown: a quote, a name and consent on record. */
export function publishableClubResults(): readonly ClubResult[] {
  return CLUB_RESULTS.filter(
    (r) => Boolean(r.consent) && Boolean(r.quote.ru) && Boolean(r.name.ru),
  );
}
