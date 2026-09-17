/**
 * The club as somebody outside it sees it — built to the owner's mockup, which is the measure.
 *
 * She sent a 375×812 render and said «Сделай под него», so this is that picture: a small muted
 * label, a row of three tight monochrome crops running nearly the full width, the club's name
 * composited over the bottom of them in the brand's 200/800/200 device, one orange pill with the
 * price on it, and two paragraphs with a single phrase in orange. Nothing else. The version this
 * replaces was written from a description of the same drawing and had a prize pill, three
 * explanatory rows and a sticky footer — the same facts, arranged as a brochure.
 *
 * Three departures from the rest of the app, and they are the point of the redesign rather than
 * mistakes to correct back: the type is **mixed case**, not the tracked capitals of `.eyebrow` and
 * `.control-label`; the **colour is on the type and on the one button**, not on a field; and the
 * **photograph is the surface** — there is no panel under it for the words to sit on.
 *
 * ## The photographs and the label over them
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
import { clsx } from 'clsx';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { isDemo } from '@/lib/api/mode';
import { withBase } from '@/lib/util/paths';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { clubChargeLabel, clubJoinHref, clubMonthlyLabel } from '@/app/features/marathon/clubPlan';
import { clubPrizeMidSentence } from '@/app/features/marathon/prize';
import { clubPitchPhotos } from '@content/site/club';

export interface ClubPitchProps {
  /**
   * The club is behind the subscription for this person. False when they already pay (or are on
   * the course's trial week) and are simply not in a running round — then there is nothing to
   * sell, and the screen says who does the adding instead of quoting them a price they have paid.
   */
  locked: boolean;
}

/**
 * The hero: the label, the three crops, and the club's name lying across the bottom of them.
 *
 * The cells are pulled two units wider than the text column on either side (`-mx-2`), which is the
 * mockup's own relationship between the media and the words — the picture runs wide, the sentences
 * are inset. The name's last line is allowed to drop a few pixels past the bottom edge of the
 * photographs, as it does in the drawing; nothing here clips it.
 */
function Hero() {
  const { t, l } = useT();
  const { photos, source } = clubPitchPhotos();
  const members = source === 'members';
  const label = members ? t('app.clubPhotosMembers') : t('app.clubPhotosClients');
  const rowLabel = members ? t('app.clubPhotosMembersRow') : t('app.clubPhotosClientsRow');

  return (
    <section className="flex flex-col gap-4">
      {/* Sentence case, not a tracked kicker: no uppercase label appears anywhere in the mockup. */}
      {photos.length > 0 ? <p className="eyebrow-sentence px-3">{label}</p> : null}

      <div className="relative -mx-2">
        {photos.length > 0 ? (
          <>
            {/*
             * The frames are unlabelled and the row carries one true sentence about what they are.
             * Their source describes the before/after pair, left to right, and a single panel is
             * not the pair — reusing that text here would describe a picture that is not on the
             * screen to the one reader who cannot check. A `CLUB_PHOTOS` entry brings its own alt.
             */}
            <ul aria-label={rowLabel} className="flex aspect-[343/348] gap-1.5">
              {photos.map((photo) => (
                <li
                  key={photo.id}
                  className="relative min-w-0 flex-1 overflow-hidden rounded-tile bg-surface-2"
                >
                  <img
                    src={withBase(photo.src)}
                    alt={photo.alt ? l(photo.alt) : ''}
                    loading="eager"
                    decoding="async"
                    className="photo-mono size-full object-cover"
                    style={{ objectPosition: photo.focus ?? '50% 50%' }}
                  />
                  <div className="photo-grain" aria-hidden="true" />
                </li>
              ))}
            </ul>
            {/*
             * One gradient across the whole row rather than one per cell, so the name lies on a
             * single darkening rather than on three that stop at the gaps.
             *
             * It is steeper than the shared `.photo-scrim`, and the stops are measured off the
             * rendered pixels rather than chosen by eye. Under `.photo-scrim` the brightest pixel
             * of the photograph behind «маленьких» left the orange at 2.65:1 and «Клуб» at 3.41:1,
             * under the 4.5:1 this product holds its type to. With these stops the worst pixel in
             * each line's band measures 5.57 : 1 for the orange and 7.35 / 9.01 : 1 for the two
             * white lines, and the top two thirds of the row stay photograph.
             *
             * Re-measure if the row's height, the type size or the photographs change: screenshot
             * the page with the `h1` hidden and read the band each line occupies.
             */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-tile"
              style={{
                background:
                  'linear-gradient(180deg, rgba(10,10,10,0) 30%, rgba(10,10,10,0.22) 48%, rgba(10,10,10,0.58) 62%, rgba(10,10,10,0.80) 80%, rgba(10,10,10,0.88) 100%)',
              }}
            />
          </>
        ) : null}

        {/*
         * «Клуб» 200 · «маленьких» 800 in the club's colour · «шагов» 200. `.display` is uppercase
         * by default and the mockup is not, hence `normal-case`.
         */}
        <h1
          className={clsx(
            'display normal-case text-[clamp(32px,10.2vw,44px)] leading-[1.12]',
            photos.length > 0
              ? 'absolute inset-x-0 bottom-[-6px] pl-5'
              : 'px-3 pt-2 pb-1 text-balance',
          )}
        >
          <span className="t-thin block">{t('app.clubNameLead')}</span>
          <span className="block text-course">{t('app.clubNameAccent')}</span>
          <span className="t-thin block">{t('app.clubNameTail')}</span>
        </h1>
      </div>
    </section>
  );
}

/** The two paragraphs, verbatim, with the one phrase the mockup sets in orange. */
function Lead() {
  const tr = useT();
  const { t } = tr;
  return (
    <div className="flex flex-col gap-4 px-3 text-[15px] leading-[1.32]">
      <p>
        {t('app.clubLeadPre')}
        <span className="text-course">{t('app.clubLeadAccent')}</span>
        {t('app.clubLeadPost')}
      </p>
      {/*
       * The prize is the same string the member's board and the full board print
       * (`app.marathonPrizeDefault`), lowered into the sentence rather than written out again —
       * three copies of one promise is three promises the moment one of them is edited.
       */}
      <p>{t('app.clubLeadWeek', { prize: clubPrizeMidSentence(tr) })}</p>
    </div>
  );
}

export function ClubPitch({ locked }: ClubPitchProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-7 pb-2">
      <Hero />
      {locked ? (
        <ClubJoin />
      ) : (
        <p className="max-w-[36ch] px-3 text-[14px] leading-snug text-muted">
          {t('app.marathonPitchNoRound')}
        </p>
      )}
      <Lead />
    </div>
  );
}

/**
 * The join pill, and under it the one line that says what is actually charged.
 *
 * Null when there is no plan to take a price from: a button that cannot name its price is worse
 * than no button, because the number then has to be invented somewhere else.
 *
 * It is a link rather than a `Button` because it leaves the app — `externalLinkProps` hands the
 * address to Telegram so the payment page opens in the person's own browser instead of replacing
 * the Mini App. The fill is the club's colour and the label is sentence case, both as drawn.
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
      <a
        {...externalLinkProps(clubJoinHref(locale, email, isDemo()))}
        className="flex h-13 select-none items-center justify-center rounded-tile bg-course px-6 text-center text-[15px] font-semibold text-on-course transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-90 active:scale-[0.99]"
      >
        {t('app.marathonJoinCta', { price })}
      </a>
      <p className="px-5 text-[13px] leading-snug text-muted-2">
        {t('app.clubChargeNote', { price: charge })}
      </p>
    </div>
  );
}
