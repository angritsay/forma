/**
 * One course on «Курсы»: the photograph, how far through it you are, and one button.
 *
 * **The photograph is the card.** That is the owner's mockup and it is the third reduction of this
 * object. It was a ticket with nine parts (`CourseTicket`); then a 16:9 cover band over a panel of
 * text with a full-width button under it; now there is no panel at all — a rule, a figure, a name
 * and a pill button, all laid on the picture. The panel was the last piece of furniture left: it
 * cost a third of the card's height to say three short things, and a card that is a picture with
 * its figure on it is read at a glance, which is the whole job of a progress screen.
 *
 * The anatomy, top to bottom, exactly as the mockup draws it:
 *
 *   - a hairline progress rule across the top, inset from both edges: the course's colour up to
 *     the percentage, near-black for the remainder;
 *   - the percentage under it, very large, in the course's colour;
 *   - the course's name under that, small and regular, in the same colour;
 *   - a pill button in the course's colour at the bottom right, dark sentence-case text, with a
 *     dark circle at its right end holding a white arrow — inside the pill, not beside it.
 *
 * **Colour carries the programme, on type rather than on fills.** The card used to be painted in
 * `--course-tile`: a yellow cover band, a yellow progress fill. Here the tile colours the *type*
 * and the photograph stays a photograph. That is what lets two courses sit on one screen and be
 * told apart without either of them shouting.
 *
 * Which also means the type has to survive the picture under it. A cyan name on a hazy grey
 * photograph is the exact combination that fails WCAG, so the art carries `.photo-scrim-top` —
 * a gradient sized to the block of type, heavy where the figure is and gone by the middle of the
 * card. The ratios are measured on the composited pixels, not estimated; see the class in
 * global.css for the numbers this scrim was tuned to.
 *
 * **A photograph, never lettered artwork.** `Course['cover']` is not read here any more. The one
 * cover the catalogue has, `/covers/start.jpg`, carries «ФОРМА // С НУЛЯ» in baked-in yellow
 * lettering, and a lettered cover under a cyan course name is two titles fighting for the same
 * card. The cover still leads the course's page on the site, where it is the only title there is.
 *
 * A course the athlete does **not** own has no figure and no rule — nought per cent is not a fact
 * about somebody who has not started, it is a fact about somebody who is failing — so it shows the
 * picture held back, the name, and «Подробнее», which leaves for the course's own page. The button
 * is only ever offered when there is a page behind it (`LIVE_COURSES`); the screen decides that,
 * because the boundary belongs to the content and not to a card.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import type { Photo } from '@/lib/media/photos';
import { isPlaceholder, photoSrc } from '@/lib/media/photos';
import { externalLinkProps } from '@/app/hooks/useExternalLink';

export interface CourseCardProps {
  /**
   * The card's picture. A stock placeholder counts as none — those are still un-vendored CDN URLs
   * — and the card falls back to a plain dark ground, which the accent type reads on just as well.
   */
  photo?: Photo;
  title: string;
  /** Completed share, 0..100. Left out on a course that has not been started or is not owned. */
  pct?: number;
  ctaLabel: ReactNode;
  onCta?: () => void;
  /**
   * A card whose button leaves the app — the page of a course not yet owned. It has to be an
   * anchor handed to Telegram: inside the Mini App a scripted navigation either does nothing or
   * replaces the app with a website the customer cannot get back from.
   */
  ctaHref?: string;
  onOpen?: () => void;
  openLabel?: string;
  priority?: boolean;
  /** Not owned: the picture is held back so the courses being walked lead. */
  dimmed?: boolean;
  /** `--course-tile`, its ink and `--course-accent`, from courseAccentVars(). */
  style?: React.CSSProperties;
}

export function CourseCard({
  photo,
  title,
  pct,
  ctaLabel,
  onCta,
  ctaHref,
  onOpen,
  openLabel,
  priority = false,
  dimmed = false,
  style,
}: CourseCardProps) {
  const share = pct === undefined ? undefined : Math.max(0, Math.min(100, Math.round(pct)));
  const art = photo && !isPlaceholder(photo);
  return (
    <article
      /*
       * Very nearly square — the mockup's card is 347×345 on a 375 column — so two of them fill a
       * phone with the second one's top edge showing, which is the deck saying there is more below
       * without a pager under it. `isolate` so the stacking here is the card's own: the open
       * target sits under the type and over the picture.
       */
      className="relative isolate aspect-[347/345] overflow-hidden rounded-tile bg-surface"
      style={style}
    >
      {/*
       * The picture opens the course and the button starts it — two targets, so the card is not
       * one giant button with a button inside it. That is invalid HTML, and on a phone it means
       * every near-miss of the button opens something else.
       */}
      {art ? (
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
      ) : null}
      <div className="photo-grain absolute inset-0" aria-hidden="true" />
      {/* The contrast guarantee. It is over the grain and under everything else, and it is what
          makes the accent type legal on a picture that has a white sky in it. */}
      <div className="photo-scrim-top absolute inset-0" aria-hidden="true" />

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

      {/* 24px of inset all round, which is the app's gutter and, measured off the mockup, the
          card's own. `pointer-events-none` so the whole picture stays one open target and only
          the button takes a press back. */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col p-6">
        {share === undefined ? null : (
          <>
            {/*
             * The rule, at the very top of the card rather than under the figure: it is the thing
             * the eye lands on, and the figure is what it means.
             *
             * The mockup draws the unfilled remainder near-black, which works there because its
             * photograph is a light haze. Ours is not: the scrim that makes the accent type legal
             * is heaviest exactly where this rule sits, so a black track disappears into it — and
             * on a course with no photograph yet it disappears completely, leaving a progress bar
             * with no bar. 18% white is the same quiet second colour on both grounds.
             */}
            <div className="h-[2px] w-full bg-paper/18">
              <div
                className="h-full bg-course-accent"
                style={{ width: `${share}%` }}
                role="progressbar"
                aria-label={title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
              />
            </div>
            {/* The figure, set the prototype's way — the number larger than the word — and in the
                course's colour, which is the whole of the mockup's colour system. `.tabular` so a
                percentage does not jitter as it climbs; the display face at 800, because
                `.display` would also uppercase it and there is nothing here to uppercase. */}
            <p className="font-display tabular mt-4 text-[42px] leading-none font-extrabold tracking-[-0.02em] text-course-accent">
              {share}%
            </p>
          </>
        )}

        {/* The name sits under the figure where there is one, and at the top of the card where
            there is not — a locked course has no figure to stand under, and an unnamed picture is
            a card about nothing. */}
        <p
          className={clsx(
            'text-[15px] leading-tight text-course-accent',
            share === undefined ? null : 'mt-2',
          )}
        >
          {title}
        </p>

        <div className="mt-auto flex justify-end">
          {ctaHref ? (
            /* No arrow: it does not go forward into the work, it leaves for the web. */
            <a
              {...externalLinkProps(ctaHref)}
              className="pointer-events-auto inline-flex items-center rounded-pill bg-course-accent px-6 py-3 text-[15px] leading-none font-medium text-ink transition-opacity duration-150 ease-(--ease-out) hover:opacity-90"
            >
              {ctaLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onCta}
              className="pointer-events-auto inline-flex items-center gap-3 rounded-pill bg-course-accent py-1 pr-1 pl-6 text-[15px] leading-none font-medium text-ink transition-transform duration-120 ease-(--ease-out) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {ctaLabel}
              {/* The arrow's circle sits *inside* the pill, at its right end — the mockup's one
                  piece of ornament, and the thing that makes the button read as "onward" rather
                  than as a label. Dark on the course colour, so the arrow is white in it. */}
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-ink text-paper"
              >
                <Glyph size={13}>→</Glyph>
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
