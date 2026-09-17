/**
 * The club as somebody outside it sees it: what the week is, what the week is for, who has played
 * it, and what it costs to join.
 *
 * It replaces an empty state. «Клуб собирается без тебя» with an icon and a sentence was a door
 * with a sign on it: a person who tapped the tab was told they were not welcome and given nothing
 * to do about it. The owner drew the screen this stands in for — «Результаты участников» and
 * «Вступить за N ₽ / мес» — and the two halves of it are both here, under the same head the member
 * sees, so the tab is one place in two states rather than two screens.
 *
 * **«Результаты участников» renders from data and is absent while there is none.** There is no
 * placeholder quote and no invented figure: `content/site/club.ts` is empty and says at length why.
 * When the section is empty it returns null — not a heading over a gap — so the screen reads as
 * finished rather than as broken, which is the whole reason it is built this way round.
 *
 * The price is the subscription's, read from `PLANS`, and the button goes to `/subscribe/` rather
 * than to a payment link: a static public site cannot carry an amount in a URL (docs/SETUP.md
 * §7.1). See `clubPlan.ts` for the part of that decision the owner has still to make.
 */
import { Pill } from '@/components/ui/Pill';
import { useT } from '@/app/hooks/useT';
import { PrizePill } from '@/app/features/marathon/PrizePill';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { clubJoinHref, clubPriceLabel } from '@/app/features/marathon/clubPlan';
import { publishableClubResults } from '@content/site/club';

export interface ClubPitchProps {
  /**
   * The club is behind the subscription for this person. False when they already pay (or are on
   * the course's trial week) and are simply not in a running round — then there is nothing to
   * sell, and the screen says who does the adding instead of quoting them a price they have paid.
   */
  locked: boolean;
}

/** What the week is, in three lines. Each one is a property of the format, not a promise. */
function WhatItIs() {
  const { t } = useT();
  const rows = [
    [t('app.marathonPitchTaskTitle'), t('app.marathonPitchTaskBody')],
    [t('app.marathonPitchPartnerTitle'), t('app.marathonPitchPartnerBody')],
    [t('app.marathonPitchBoardTitle'), t('app.marathonPitchBoardBody')],
  ];
  return (
    <ul className="flex flex-col">
      {rows.map(([title, body]) => (
        <li key={title} className="border-t border-border py-4">
          <h3 className="font-display text-[17px] leading-[1.2]">{title}</h3>
          <p className="mt-1 text-[14px] leading-snug text-muted">{body}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The people who have played a round, in their own words.
 *
 * Nothing at all while there are none — no heading, no empty frame, no reserved space. An empty
 * section here would be a hole in the middle of a page that is asking for money.
 */
function Results() {
  const { t, l } = useT();
  const results = publishableClubResults();
  if (results.length === 0) return null;
  return (
    <section>
      <h2 className="eyebrow">{t('app.marathonPitchResults')}</h2>
      <ul className="mt-2 flex flex-col">
        {results.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 border-t border-border py-4">
            <p className="text-[15px] leading-snug text-balance">«{l(r.quote)}»</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted-2">{l(r.name)}</span>
              {r.fact ? <Pill tone="course">{l(r.fact)}</Pill> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClubPitch({ locked }: ClubPitchProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-8 pt-6 pb-4">
      {/* The prize, as the one filled pill on the screen — the same object the member's board
          carries above the standings, so the two states of the tab agree about what is at stake. */}
      <div className="flex">
        <PrizePill>{t('app.marathonPrizeDefault')}</PrizePill>
      </div>

      <WhatItIs />
      <Results />

      {!locked ? (
        <p className="max-w-[36ch] text-[14px] leading-snug text-muted">
          {t('app.marathonPitchNoRound')}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The join button, for the screen's sticky footer. Null when the person already pays, and null
 * when there is no plan to take a price from — a button that cannot name its price is worse than
 * no button, because the number then has to be invented somewhere else.
 */
export function ClubJoin({ locked }: ClubPitchProps) {
  const { t, locale } = useT();
  const price = clubPriceLabel(locale);
  if (!locked || !price) return null;
  return (
    <div className="flex flex-col gap-2">
      <LinkButton href={clubJoinHref(locale)} size="lg" fullWidth>
        {t('app.marathonJoinCta', { price })}
      </LinkButton>
      <p className="text-center text-[12px] text-muted-2">{t('app.marathonJoinNote')}</p>
    </div>
  );
}
