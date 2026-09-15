/**
 * One programme, as a ticket.
 *
 * This replaced a full-height cover on the «Программы» tab, at the owner's request: «она сейчас
 * занимает весь экран, а хотелось бы, чтобы это выглядело как билетик в курс». The cover is still
 * right on Home, where one card answers «что у меня сегодня» and has the screen to itself — that is
 * why `DeckCard` stays and this is a second component rather than a flag on the first. A tab that
 * lists everything you could be in is a different question, and a list of full-screen covers
 * answers it badly: you cannot see that there is more than one.
 *
 * A ticket is a bounded object, so it takes what a bounded object takes here — `--r-card`, the page
 * gutter, and the rule from `PhotoBlock` that a picture inside something rounded is rounded with
 * it. The full-bleed cover was deliberately square-cornered because it belonged to the photographs
 * that run past the gutter; it has left that category.
 *
 * The parts are in the order a ticket has them:
 *
 *   - the **cover**, a band rather than a wall: the photograph, or the programme's colour where
 *     there is no photograph of its own — the brandbook's first rule, and what paints the marathon
 *     orange and «Форма с нуля» yellow;
 *   - the **stub**, carrying how far along you are. It is at the top because that is what was
 *     asked for, and the ticket metaphor agrees: the stub is the part with your seat number on it;
 *   - the **tear**, a dashed rule, which is the one line that makes the object read as a ticket
 *     rather than as another card;
 *   - the **identity** — what kind of thing it is, its name, one line of what it gives you;
 *   - the **action**.
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

export interface CourseTicketProps {
  /** Cover photograph; a stock placeholder counts as none and the colour takes over. */
  photo?: Photo;
  /** Kicker: what kind of thing this is and where you are in it. */
  eyebrow: ReactNode;
  title: string;
  /** What this thing is, in one line. */
  lead?: ReactNode;
  /** One quiet line under it — today's task, why it is locked. */
  subtitle?: ReactNode;
  /** Completed share, 0..100. Omitted on a ticket with nothing to complete. */
  pct?: number;
  progressLabel?: ReactNode;
  /** Set opposite the figure: «12/20». */
  progressMeta?: ReactNode;
  ctaLabel: ReactNode;
  onCta?: () => void;
  /**
   * A ticket whose action leaves the app — the sales page of a course not yet owned. It has to be
   * an anchor handed to Telegram: inside the Mini App a scripted navigation either does nothing or
   * replaces the app with a website the customer cannot get back from.
   */
  ctaHref?: string;
  onOpen?: () => void;
  openLabel?: string;
  priority?: boolean;
  /** Not owned: the cover is held back so the owned ones lead. */
  dimmed?: boolean;
  /** `--course-tile` and its ink, from courseTileVars(). */
  style?: React.CSSProperties;
}

export function CourseTicket({
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
}: CourseTicketProps) {
  const share = pct === undefined ? undefined : Math.max(0, Math.min(100, Math.round(pct)));
  const art = photo && !isPlaceholder(photo);
  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface"
      style={style}
    >
      {/*
       * The picture opens the thing and the button starts it — two targets, so the ticket is not
       * one giant button with a button inside it. That is invalid HTML, and on a phone it means
       * every near-miss of the button opens something else.
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

      {/* The cover: a band, not a wall. 2:1 is wide enough to read as a picture and short enough
          that the ticket's own words are the larger half of it — at 16:10 the picture won, and the
          object read as a card with a caption rather than as a ticket. */}
      <div
        className={clsx(
          'pointer-events-none relative aspect-2/1 w-full overflow-hidden',
          art ? 'bg-ink' : 'hero-art',
        )}
      >
        {art ? (
          <img
            src={photoSrc(photo)}
            alt=""
            width={photo.width}
            height={photo.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={clsx('photo-mono size-full object-cover', dimmed && 'opacity-40')}
          />
        ) : null}
        <div className="photo-grain" aria-hidden="true" />
        {!art && dimmed ? <div className="absolute inset-0 bg-ink/45" aria-hidden="true" /> : null}
      </div>

      <div className="pointer-events-none relative z-10 flex flex-col px-5 pt-4 pb-5">
        {/* The stub: where you are, above everything else — asked for, and where a stub belongs. */}
        {share === undefined ? null : (
          <div className="pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-baseline gap-2">
                <span className="numeral tabular text-2xl leading-none text-text">{share}%</span>
                {progressLabel ? (
                  <span className="eyebrow text-muted-2">{progressLabel}</span>
                ) : null}
              </span>
              {progressMeta ? (
                <span className="numeral tabular text-xs text-muted-2">{progressMeta}</span>
              ) : null}
            </div>
            {/* Not <ProgressBar>: its fill is the programme colour, which is exactly what this
                ticket's cover is already painted in, and the two read as one bar cut in half. The
                track is the ticket's own hairline and the fill is the programme colour. */}
            <div className="mt-2 h-0.5 w-full bg-border-strong">
              <div
                className="h-full bg-course"
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

        {/*
         * The tear. One dashed rule is the whole difference between a card and a ticket, and it is
         * drawn as a border rather than as a row of glyphs so it stays a hairline at any width.
         */}
        {share === undefined ? null : (
          <div className="mb-4 border-t border-dashed border-border-strong" aria-hidden="true" />
        )}

        <span className="eyebrow block truncate text-muted-2">{eyebrow}</span>
        <DisplayTitle text={title} className="mt-2 text-2xl" />
        {lead ? <p className="mt-2 text-[14px] leading-snug text-muted">{lead}</p> : null}
        {subtitle ? <p className="mt-1.5 text-[13px] text-muted-2">{subtitle}</p> : null}

        {ctaHref ? (
          /* No arrow: it does not go forward into the work, it leaves for the web. */
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
