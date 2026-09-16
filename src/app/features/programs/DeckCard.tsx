/**
 * Today's card on Home: a cover filling whatever height the screen has left, with everything the
 * card is about standing in its bottom third.
 *
 * It is the only card of its kind left. The «Программы» tab used to draw its whole deck with this
 * component and now draws tickets instead (`CourseTicket`), which is why the type here could come
 * down a step: this is no longer one of five covers competing for attention, it is the one object
 * on a screen that does not scroll, and at 36px the title was taking room the club row needed.
 *
 * **What stands on the picture is the owner's prototype's** (`design/ui_kits/app-v2`, «Сегодня»):
 * the kicker, the workout's name as the one display line, two pills — how long and how much —
 * and «Начать →». Four things, and one of them is the button. The line naming the course went,
 * because with one course owned it named the only thing it could be; the screen puts it back as a
 * fifth line only when there is genuinely a second course this could have been (see Home). The
 * share of the course and its rule are gone too: how far in you are is the ticket's fact and the
 * path's, and Home answers a different question — what am I doing today.
 *
 * The cover is a photograph when there is a real one to show, and the programme colour when there
 * is not. That is not a placeholder: the brandbook's first rule is that the colour paints the
 * cover, and a flat orange marathon card next to a photographed course card is the product's own
 * language. It also means a card is never a black rectangle waiting on someone else's CDN — the
 * only photographs this product has vendored are the coach's own.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import type { Photo } from '@/lib/media/photos';
import { isPlaceholder, photoSrc } from '@/lib/media/photos';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';

export interface DeckCardProps {
  /**
   * The cover photograph. A photo still pointing at a stock CDN (`isPlaceholder`) is treated as
   * no photograph at all, and the card falls back to its programme colour.
   */
  photo?: Photo;
  /** Kicker over the headline: what kind of thing this is and where you are in it. */
  eyebrow: ReactNode;
  title: string;
  /**
   * One line under the name, only when the name alone is ambiguous — which course this day
   * belongs to, when more than one is owned. Left out otherwise: it said what the athlete already
   * knew.
   */
  lead?: ReactNode;
  /** The session's facts — «18 мин», «110 повторов» — as pills between the name and the button. */
  pills?: readonly string[];
  ctaLabel: ReactNode;
  /** In-app action. Ignored when `ctaHref` is set. */
  onCta?: () => void;
  /**
   * A card whose action leaves the app — the sales page of a course not yet owned. It has to be
   * an anchor handed to Telegram rather than a button: inside the Mini App a scripted navigation
   * either does nothing or replaces the app with a website the customer cannot get back from.
   */
  ctaHref?: string;
  /** Tapping the picture itself — the course path, the marathon. Ignored when `ctaHref` is set. */
  onOpen?: () => void;
  openLabel?: string;
  /** Eager-load the first card's photograph; the rest wait. */
  priority?: boolean;
  /** A card for something not owned: the picture is held back so the owned ones lead. */
  dimmed?: boolean;
  /** `--course-tile` and its ink, from courseTileVars(). */
  style?: React.CSSProperties;
}

export function DeckCard({
  photo,
  eyebrow,
  title,
  lead,
  pills,
  ctaLabel,
  onCta,
  ctaHref,
  onOpen,
  openLabel,
  priority = false,
  dimmed = false,
  style,
}: DeckCardProps) {
  const art = photo && !isPlaceholder(photo);
  return (
    <article
      className={clsx(
        /*
         * `flex-1`, not `h-full`. Home gives this card whatever height the column has left, and
         * that height comes from `flex-1` on a `min-h-dvh` ancestor — not a definite height, so a
         * percentage resolved against nothing and the card collapsed to its own content with the
         * photograph filling only the top half of the space it had been given.
         */
        'relative flex min-h-0 w-full flex-1 flex-col justify-end overflow-hidden',
        art ? 'bg-ink text-paper' : 'hero-art',
      )}
      style={style}
    >
      {art ? (
        <>
          <img
            src={photoSrc(photo)}
            alt=""
            width={photo.width}
            height={photo.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={clsx(
              'photo-mono absolute inset-0 size-full object-cover',
              dimmed && 'opacity-40',
            )}
          />
          {/*
           * «Убери затемнение на курсе» — and this is as far as it goes without the photograph
           * paying for it.
           *
           * What went: the 0.6 veil across the top and the 0.5 across the middle. Those were the
           * ones that dimmed the picture people actually look at, and nothing has needed them
           * since the deck lost the wordmark and the controls that used to sit up there. The top
           * third of the photograph is now untouched, and the picture reads all the way down
           * instead of going black behind the button.
           *
           * What stayed, and why: a ramp into the card's own ink under the words. On a 390×844
           * phone Home leaves this card 290px and its four things — kicker, name, two pills,
           * button — need about 210 of them, so the words and the picture share the same space.
           * Taking the ramp out as well was built and measured: the photograph collapses to an
           * 80px strip across the coach's waist, which loses the picture in order to save it.
           * The ramp starts where the kicker starts — a third of the way down — and reaches the
           * ink only at the very foot, so what it covers is the part of the frame the type is
           * standing on, not the frame.
           *
           * The stops are measured, not guessed. Sampling the composited pixels behind the type on
           * a 390px phone: the kicker's ground went 157 → 120 and the name's 149 → 128, so white on
           * them goes 2.71 → 4.42 and 2.99 → 3.94. The words came out *more* legible than the veil
           * that was there to make them legible — because the old ramp put its weight at the top of
           * the frame, where nothing was reading, instead of under the line that was.
           */}
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_14%,rgba(15,15,17,0.42)_38%,rgba(15,15,17,0.74)_70%,rgba(15,15,17,0.95))]"
            aria-hidden="true"
          />
          <div className="photo-grain" aria-hidden="true" />
        </>
      ) : (
        <>
          {/* Grain goes over a colour cover too: a flat colour wants the texture as much. */}
          <div className="photo-grain" aria-hidden="true" />
          {/* A colour cover has no image to fade, so what is not owned is veiled instead. */}
          {dimmed ? <div className="absolute inset-0 bg-ink/45" aria-hidden="true" /> : null}
        </>
      )}

      {/*
       * The picture opens the thing; the button starts it. They are two targets, so the whole card
       * is not one giant button with a button inside it — which is invalid, and which on a phone
       * means every near-miss of the button opens something else.
       */}
      {ctaHref ? (
        <a
          {...externalLinkProps(ctaHref)}
          aria-label={openLabel ?? title}
          className="absolute inset-0 z-0"
        />
      ) : onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={openLabel ?? title}
          className="absolute inset-0 z-0"
        />
      ) : null}

      <div className="pointer-events-none relative z-10 flex flex-col px-6 pb-6 md:px-10">
        {/*
         * Everything in this block takes `currentColor`, never a literal: on a photograph the
         * article is paper on ink, and on a colour cover it is the tile's own ink — black on
         * yellow. A `text-paper/70` here would be white on yellow.
         */}
        <span className="eyebrow block truncate text-current opacity-70">{eyebrow}</span>
        <DisplayTitle text={title} className="mt-2 text-3xl lg:text-4xl" />
        {lead ? <p className="mt-2 max-w-[34ch] text-[14px] leading-snug">{lead}</p> : null}

        {pills && pills.length > 0 ? (
          /*
           * The facts as pills, in the card's own ink. `Pill`'s tones are drawn for the dark
           * ground — a muted hairline and muted words — and neither survives a photograph or a
           * yellow tile; so this is the same shape (`components/ui/Pill.tsx`: 28px, tracked
           * capitals, fully rounded) with its colour taken from `currentColor` like everything
           * else on the cover. Not `Chip`: nothing here is pressed.
           */
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={title}>
            {pills.map((p) => (
              <li
                key={p}
                className="control-label inline-flex h-7 max-w-full min-w-0 items-center rounded-pill border border-current/40 px-3 text-[10px] text-current"
              >
                {/* Like `Pill`: it gives way and ellipsises rather than pushing the card's own
                    gutter out, on the day a workout's count runs to five figures. */}
                <span className="truncate">{p}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {ctaHref ? (
          /* No arrow on this one: it does not go forward into the work, it leaves for the web. */
          <LinkButton href={ctaHref} fullWidth size="lg" className="pointer-events-auto mt-5">
            {ctaLabel}
          </LinkButton>
        ) : (
          <Button
            fullWidth
            size="lg"
            className="pointer-events-auto mt-5"
            onClick={onCta}
            iconRight={<Glyph size={14}>→</Glyph>}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
