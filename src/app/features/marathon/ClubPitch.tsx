/**
 * The club when there is no round to show.
 *
 * ## The order, since the redesign
 *
 * The owner, on the mockup version: «Он абсолютно не продаёт клуб маленьких шагов». It described
 * the club — photographs, a name, a price, two paragraphs — and showed none of it. So the screen
 * now opens on the name and the owner's one sentence, then a day of the club playing itself
 * (`ClubDemoChat`: the task arriving, your «done», the points, the prize), then the four things
 * you get as drawn rows, then the photographs as proof, and only then the price. Her choices, in
 * order: chat and paywall rather than slides; the photographs kept, lower down; and, seeing it,
 * the name over the chat and the chat a third shorter.
 *
 * ## Built to the owner's mockup, which was the measure until then
 *
 * **Two people arrive here and only one of them was drawn.** Somebody outside the club gets the
 * screen the owner sent: the hero, the join pill, her two paragraphs. Somebody who already pays —
 * which is everybody who has ever bought the annual plan, because the club is inside it — gets the
 * same screen with `ClubMember` in the pill's place. See that component for why it is not a pill.
 *
 * She sent a 375×812 render and said «Сделай под него», so this is that picture: a small muted
 * label, monochrome photographs running nearly the full width, the club's name in the brand's
 * 200/800/200 device, one orange pill with the price on it, and two paragraphs with a single
 * phrase in orange. Nothing else. The version this replaces was written from a description of the
 * same drawing and had a prize pill, three explanatory rows and a sticky footer — the same facts,
 * arranged as a brochure.
 *
 * Two things have moved since that render, both on her word and both explained at `Photos` and `Name` below:
 * the three fixed crops are now ten square frames you swipe, and the name sits under them rather
 * than composited over them.
 *
 * Three departures from the rest of the app when this screen was written, and they are the point
 * of the redesign rather than mistakes to correct back: the type is **mixed case**; the **colour
 * is on the type and on the one button**, not on a field; and the **photograph is the surface** —
 * there is no panel under it for the words to sit on. The first of the three is no longer a
 * departure: `.eyebrow` and `.control-label` dropped their capitals product-wide, so this screen
 * stopped opting out and simply uses them.
 *
 * ## The photographs and the label above them
 *
 * The row renders from `clubPitchPhotos()` and the label is chosen by what came back. The mockup
 * says «Результаты участников» over photographs that belong to `content/site/results.ts` —
 * Sergey's one-to-one clients, consented on 2026-09-07, **not** club members. That label over
 * those photographs, beside a price, claims the club produced them, which nothing supports and
 * `docs/SPEC.md` forbids outright. So the layout is exactly as drawn and the sentence is true:
 * «Результаты учеников Сергея» while the row is falling back to his clients, «Результаты
 * участников» by itself the day a club member is photographed and agrees to it.
 *
 * There is no placeholder name, quote, percentage or duration anywhere on this screen, and there
 * will not be one: the rule against invented reviews and statistics applies hardest on the screen
 * that asks for money, and a placeholder is a sentence that gets forgotten and shipped.
 *
 * ## The price
 *
 * «Вступить за 666 ₽ / мес» is the owner's own button and `clubPlan.ts` is where the number comes
 * from: the annual plan's price divided by twelve, never typed here. Under the pill, in the same
 * register, the screen says what is actually charged — one payment for a year — because a button
 * quoting a month for an annual charge is a chargeback waiting to be filed.
 */
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { Doodle } from '@/components/ui/Doodle';
import type { DoodleKind } from '@/content/schema';
import { isDemo } from '@/lib/api/mode';
import { withBase } from '@/lib/util/paths';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { clubChargeLabel, clubJoinHref, clubMonthlyLabel } from '@/app/features/marathon/clubPlan';
import { ClubDemoChat } from '@/app/features/marathon/ClubDemoChat';
import { clubPitchPhotos } from '@content/site/club';

export interface ClubPitchProps {
  /**
   * The club is behind the subscription for this person. False when they already pay (or are on
   * the course's trial week) and are simply not in a running round — then there is nothing to
   * sell, and the screen stands them in the club instead of quoting them a price they have paid.
   */
  locked: boolean;
}

/**
 * The photographs: the label, and a strip of square frames you swipe. They stood at the top as the
 * hero; since the redesign they are the proof under the features, before the price.
 *
 * ## Why it is a carousel now
 *
 * The owner: «Сейчас они статичные, а нужно, чтобы это были квадратные изображения, которые можно
 * скролить. То есть это каруселька должна быть, которая состоит из 10 фотографий.» The triptych
 * showed three people through a 32%-wide slice of each file; the strip shows ten people whole. The
 * crop arithmetic that made the slice land on a body rather than on the seam went with it —
 * `content/site/club.ts` says what was removed and why.
 *
 * It bleeds to both screen edges and is padded back in, so the first frame lines up with the words
 * and the last one runs off the right — which is the whole affordance: a strip that stops short of
 * the edge looks finished, and nobody swipes a finished thing. `.deck-scroller` hides the bar a
 * desktop browser would otherwise draw across the bottom of a photograph.
 *
 * ## Why the name came out of the photographs
 *
 * It used to be composited over the bottom of the row on a measured gradient — «the worst pixel in
 * each line's band measures 5.57 : 1 for the orange» — and that measurement was taken against three
 * known photographs. Ten photographs that slide underneath cannot be measured: any frame can end up
 * behind «маленьких», and the honest choices are a scrim heavy enough to survive the brightest one,
 * which would grey out a third of every picture, or the name on the page's own ground. The name is
 * on the ground. It is still the 200/800/200 lockup the mockup draws, and it still opens the page.
 */
function Photos() {
  const { t, l } = useT();
  const { photos, source } = clubPitchPhotos();
  const members = source === 'members';
  const label = members ? t('app.clubPhotosMembers') : t('app.clubPhotosClients');
  const rowLabel = members ? t('app.clubPhotosMembersRow') : t('app.clubPhotosClientsRow');

  return (
    <section className="flex flex-col gap-4">
      {/* Plain `.eyebrow`: the kicker is sentence case product-wide now, so the opt-out this line
          used to carry (`.eyebrow-sentence`) has nothing left to opt out of. */}
      {photos.length > 0 ? <p className="eyebrow px-3">{label}</p> : null}

      {photos.length > 0 ? (
        /*
         * `-mx-6 px-4` rather than the old `-mx-2`: the scroller itself has to reach the screen
         * edge or the frames stop at a margin instead of running under it, and the padding puts
         * the first frame back where the triptych began. `scroll-px-4` makes snapping land it
         * there too, instead of flush against the viewport.
         */
        <ul
          aria-label={rowLabel}
          className="deck-scroller -mx-6 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 px-4 md:-mx-10 md:scroll-px-8 md:px-8"
        >
          {photos.map((photo, i) => (
            <li
              key={photo.id}
              className="relative w-[66%] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-tile bg-surface-2"
            >
              <img
                src={withBase(photo.src)}
                alt={photo.alt ? l(photo.alt) : ''}
                /* The first two are on screen at rest; the other eight are a swipe away and must
                   not compete with them for the connection. */
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="photo-mono block aspect-square w-full object-cover"
                style={{ objectPosition: photo.focus ?? '50% 50%' }}
              />
              <div className="photo-grain" aria-hidden="true" />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * The club's name and the owner's one sentence under it.
 *
 * «Клуб» 200 · «маленьких» 800 in the club's warm gradient · «шагов» 200 — the lockup from her
 * mockup, kept whole. `leading-[1.12]` is deliberate: none of the three words has a descender, so
 * the lockup can sit tighter than `.display`'s 1.2. The sentence is hers verbatim, with the one
 * phrase she set in orange; the second paragraph (points, the board, the prize) is gone, because
 * the chat above and the rows below now say it.
 */
function Name() {
  const { t } = useT();
  return (
    <section className="flex flex-col gap-4 px-3">
      <h1 className="display text-[clamp(32px,10.2vw,44px)] leading-[1.12] text-balance">
        <span className="t-thin block">{t('app.clubNameLead')}</span>
        {/* The club's key word in its warm gradient — large type only (global.css, `.club-aurora`). */}
        <span className="block">
          <span className="text-gradient box-decoration-clone">{t('app.clubNameAccent')}</span>
        </span>
        <span className="t-thin block">{t('app.clubNameTail')}</span>
      </h1>
      <p className="text-[15px] leading-[1.32]">
        {t('app.clubLeadPre')}
        <span className="text-accent">{t('app.clubLeadAccent')}</span>
        {t('app.clubLeadPost')}
      </p>
    </section>
  );
}

/**
 * What you get, as four rows — the Coach tab's drawn-glyph rows, in the club's colours: a glyph
 * in the streak's orange on the surface tile, no gradient (the gradient is the one button) and
 * no neon (`club-no-neon.test.ts`). Each row is a mechanic the code actually has: the daily task,
 * the proof the coach reviews, the streak and the points, the weekly prize.
 */
const FEATURES: readonly {
  doodle: DoodleKind;
  title: 'clubFeature1Title' | 'clubFeature2Title' | 'clubFeature3Title' | 'clubFeature4Title';
  body: 'clubFeature1Body' | 'clubFeature2Body' | 'clubFeature3Body' | 'clubFeature4Body';
}[] = [
  { doodle: 'steps', title: 'clubFeature1Title', body: 'clubFeature1Body' },
  { doodle: 'camera', title: 'clubFeature2Title', body: 'clubFeature2Body' },
  { doodle: 'flame', title: 'clubFeature3Title', body: 'clubFeature3Body' },
  { doodle: 'trophy', title: 'clubFeature4Title', body: 'clubFeature4Body' },
];

function Features() {
  const { t } = useT();
  return (
    <ul className="flex flex-col px-1">
      {FEATURES.map((f) => (
        <li
          key={f.doodle}
          className="flex items-start gap-4 border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0"
        >
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-tile bg-surface-2 text-orange"
          >
            <Doodle kind={f.doodle} className="size-7" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-display text-[17px] leading-snug">{t(`app.${f.title}`)}</p>
            <p className="text-[14px] leading-relaxed text-muted">{t(`app.${f.body}`)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ClubPitch({ locked }: ClubPitchProps) {
  return (
    <div className="flex flex-col gap-8 pb-2">
      <Name />
      <ClubDemoChat />
      <Features />
      <Photos />
      {locked ? <ClubJoin /> : <ClubMember />}
    </div>
  );
}

/**
 * The same screen for somebody who already pays, and it is the common case rather than the edge.
 *
 * The club is bundled into the annual plan (`content/site/plans.ts`), so **every existing customer
 * who opens this tab lands here** and the selling screen is the one almost nobody sees. What stood
 * in this slot was four lines of grey body copy where the button is — the selling screen with its
 * point removed, which is how a product tells a paying customer it was not built for them.
 *
 * So the slot keeps the pill's footprint and stops being a pill: same `-mx-2`, same `h-13`, same
 * second line underneath. It is outlined in the club's colour instead of filled with it, and that
 * difference is the whole message — a filled bar is something you press, and there is nothing here
 * to press. No button could put anyone in a round.
 *
 * Nothing on it is invented. There is no start date, no countdown and no number of participants,
 * because the app holds none of the three: outside a round there is exactly one true thing to say
 * about this person's standing, and the line under it says where the tasks will appear.
 */
export function ClubMember() {
  const { t } = useT();
  return (
    <div className="-mx-2 flex flex-col gap-2.5">
      <p className="flex h-13 items-center justify-center rounded-tile border border-accent/55 px-6 text-center text-[15px] font-semibold text-accent">
        {t('app.clubMemberTitle')}
      </p>
      <p className="px-5 text-[13px] leading-snug text-muted-2">{t('app.clubMemberNote')}</p>
    </div>
  );
}

/**
 * The join pill, and under it the one line that says what is actually charged.
 *
 * Null when there is no plan to take a price from: a button that cannot name its price is worse
 * than no button, because the number then has to be invented somewhere else.
 *
 * It is a link rather than a `Button` because it leaves the app — `LinkButton` hands the address to
 * Telegram so the payment page opens in the person's own browser instead of replacing the Mini App.
 * It is the screen's one main action, and in the club the main action is the **warm gradient**
 * (`gradient`, design/CHANGELOG.md §17): the club's material is its gradient, and the neon is the
 * rest of the app's. Only the warm half — light blue → beige → orange — under ink, because the
 * crossroads gradient's electric-blue end cannot carry a label; §14's «the gradient is never a
 * button» was about that end, and stands for it.
 */
export function ClubJoin() {
  const { t, locale } = useT();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const price = clubMonthlyLabel(locale);
  const charge = clubChargeLabel(locale);
  if (!price || !charge) return null;
  const email = profile?.email || user?.email || '';
  return (
    <div className="-mx-2 flex flex-col gap-2.5">
      <LinkButton
        href={clubJoinHref(locale, email, isDemo())}
        variant="gradient"
        size="lg"
        fullWidth
      >
        {t('app.marathonJoinCta', { price })}
      </LinkButton>
      <p className="px-5 text-[13px] leading-snug text-muted-2">
        {t('app.clubChargeNote', { price: charge })}
      </p>
    </div>
  );
}
