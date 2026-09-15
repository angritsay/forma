/**
 * Today's card on Home: a cover filling whatever height the screen has left, with everything the
 * card is about standing in its bottom third.
 *
 * It is the only card of its kind left. The «Программы» tab used to draw its whole deck with this
 * component and now draws tickets instead (`CourseTicket`), which is why the type here could come
 * down a step: this is no longer one of five covers competing for attention, it is the one object
 * on a screen that does not scroll, and at 36px the title was taking room the challenge row needed.
 *
 * The shape is the one every training app opens on — a picture, a name, how far in you are, and
 * one button — and the reason it is worth copying is that it answers "what am I doing today" in a
 * single glance and one tap. What is not copied is how it is drawn: no rounded corners, no
 * gradient button, no progress ring. A ring is a circle and this brand has no circles; the share
 * is a numeral over a 2px rule, which is how progress is written everywhere else in the product.
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
   * What this thing *is*, in one line — a course is a programme by weeks, the challenge is a task a day.
   *
   * It exists because of the first thing anybody said about the home screen: «заходишь, и ничего
   * непонятно». The card can say where you are in something only once you already know what that
   * something is, so the explanation comes first and the state after it.
   */
  lead?: ReactNode;
  /** One quiet line under that — today's session, today's task. */
  subtitle?: ReactNode;
  /** Completed share, 0..100. Omitted on a card with nothing to complete. */
  pct?: number;
  /** The word under the figure, e.g. "пройдено". */
  progressLabel?: ReactNode;
  /** Set opposite the figure: "12/20", "день 5 из 30". */
  progressMeta?: ReactNode;
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
  subtitle,
  pct,
  progressLabel,
  progressMeta,
  ctaLabel,
  onCta,
  ctaHref,
  onOpen,
  openLabel,
  priority = false,
  dimmed = false,
  style,
}: DeckCardProps) {
  const share = pct === undefined ? undefined : Math.max(0, Math.min(100, Math.round(pct)));
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
           * One gradient does both jobs: dark at the top so the wordmark and the controls laid
           * over the deck keep their contrast, near-black at the bottom so the headline, the
           * figure and the button read as one block rather than as text floating on a picture.
           */}
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,17,0.6),transparent_28%,rgba(15,15,17,0.5)_58%,rgba(15,15,17,0.97))]"
            aria-hidden="true"
          />
        </>
      ) : null}
      {/* Grain goes over either cover: a flat colour wants the texture as much as a photo does. */}
      <div className="photo-grain" aria-hidden="true" />
      {/* A colour cover has no image to fade, so what is not owned is veiled instead. */}
      {!art && dimmed ? <div className="absolute inset-0 bg-ink/45" aria-hidden="true" /> : null}

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
        {subtitle ? <p className="mt-1.5 text-[13px] text-current opacity-70">{subtitle}</p> : null}

        {share === undefined ? null : (
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-baseline gap-2">
                <span className="numeral tabular text-3xl leading-none">{share}%</span>
                {progressLabel ? (
                  <span className="eyebrow text-current opacity-70">{progressLabel}</span>
                ) : null}
              </span>
              {progressMeta ? (
                <span className="numeral tabular text-xs text-current opacity-70">
                  {progressMeta}
                </span>
              ) : null}
            </div>
            {/*
             * The rule is drawn here rather than with <ProgressBar> because neither of the
             * control's colours survives this card: its track (--surface-3, a near-black) vanishes
             * on a photograph, and its fill is the programme colour, which is the very thing a
             * colour cover is already painted in. So the track is the card's own ink at low alpha,
             * and the fill is the programme colour on a photograph and the ink on a colour cover.
             */}
            <div className="mt-2.5 h-0.5 w-full bg-current/25">
              <div
                className={clsx('h-full', art ? 'bg-course' : 'bg-current')}
                style={{ width: `${share}%` }}
                role="progressbar"
                aria-label={title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
              />
            </div>
          </div>
        )}

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
