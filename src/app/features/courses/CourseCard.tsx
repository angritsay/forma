/**
 * One course on «Курсы»: the photograph, how far through it you are as one big figure over its
 * bar, and one button.
 *
 * Four things, and that is the whole card — it is what the owner drew. The ticket it replaces
 * (`CourseTicket`) carried nine: a cover, a stub, a dashed tear, a kicker, the name, three pills of
 * facts, a line of state and the button. Every one of them was defensible on its own and together
 * they made a screen you read instead of a screen you scan, which is the opposite of what a
 * progress screen is for. «Курсы это прогресс по всем курсам которые есть»: the figure is the
 * content, the rest is what the figure is about.
 *
 * **The figure is set the prototype's way** (`design/ui_kits/app-v2`, the `.n-big`/`.display`
 * device): the number larger than the word, so «68%» is read across the room and the course's name
 * sits under it at the size a name needs. A percentage on a course card is the share completed and
 * the word «пройдено» beside it only says what the number already said.
 *
 * A course the athlete does **not** own has no figure — nought per cent is not a fact about
 * somebody who has not started, it is a fact about somebody who is failing — so it shows the
 * cover held back, the name, and «Подробнее», which leaves for the course's own page on the site.
 * It used to say «Прийти» or «Курс закрыт»: the designer's note was that neither means anything,
 * and she is right — one is an invitation to nowhere and the other is a sign on a locked door.
 * The button is only ever offered when there is a page behind it (`LIVE_COURSES`); the screen
 * decides that, because the boundary belongs to the content and not to a card.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { publicMediaUrl } from '@/lib/api/storage';
import type { Photo } from '@/lib/media/photos';
import { isPlaceholder, photoSrc } from '@/lib/media/photos';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';

export interface CourseCardProps {
  /**
   * The course's own cover art (`Course['cover']`). It beats `photo`: a picture drawn for this
   * course is never worse than a library photograph standing in for it.
   */
  cover?: string;
  /** Cover photograph; a stock placeholder counts as none and the programme colour takes over. */
  photo?: Photo;
  title: string;
  /** Completed share, 0..100. Left out on a course that has not been started or is not owned. */
  pct?: number;
  /** Beside the figure, small: «3/28». */
  progressMeta?: ReactNode;
  /** One line of state where there is one — the day waiting, why the course is not open yet. */
  subtitle?: ReactNode;
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
  /** Not owned: the cover is held back so the courses being walked lead. */
  dimmed?: boolean;
  /** `--course-tile` and its ink, from courseTileVars(). */
  style?: React.CSSProperties;
}

export function CourseCard({
  cover,
  photo,
  title,
  pct,
  progressMeta,
  subtitle,
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
  /*
   * Three states, in order of preference: the course's own cover, a library photograph, the
   * programme colour. `publicMediaUrl` takes all three reference shapes and hands back the last
   * two unchanged, so an https URL or a path under `public/` needs no special case here.
   */
  const coverSrc = cover ? publicMediaUrl(cover) : undefined;
  const art = !coverSrc && photo && !isPlaceholder(photo);
  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface"
      style={style}
    >
      {/*
       * The picture opens the course and the button starts it — two targets, so the card is not
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

      {/* 16:9. The card below it is three short lines now rather than nine, so the cover can be a
          band again: at 4:3 a phone showed one course and the top of the next one's picture, which
          is the mistake the full-height cover made before it, one size down. */}
      <div
        className={clsx(
          'pointer-events-none relative aspect-video w-full overflow-hidden',
          coverSrc || art ? 'bg-ink' : 'hero-art',
        )}
      >
        {coverSrc ? (
          /* Artwork drawn for this course, and the one picture here not treated as a photograph:
             no `.photo-mono`, no grain. Desaturating it would strip the programme colour out of
             the one place the brandbook wants it. */
          <img
            src={coverSrc}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={clsx('size-full object-cover', dimmed && 'opacity-40')}
          />
        ) : art ? (
          <>
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
            <div className="photo-grain" aria-hidden="true" />
          </>
        ) : (
          <div className="photo-grain" aria-hidden="true" />
        )}
        {!coverSrc && !art && dimmed ? (
          <div className="absolute inset-0 bg-ink/45" aria-hidden="true" />
        ) : null}
      </div>

      <div className="pointer-events-none relative z-10 flex flex-col px-5 pt-4 pb-5">
        {share === undefined ? null : (
          <div className="pb-4">
            <div className="flex items-baseline gap-2">
              {/* The number at display size and the per-cent sign a third of it: one figure, set
                  the way the prototype sets a figure that is the point of the screen. */}
              <span className="numeral tabular text-6xl leading-[0.85] text-text">
                {share}
                <span className="text-2xl">%</span>
              </span>
              {progressMeta ? (
                <span className="numeral tabular text-sm text-muted-2">· {progressMeta}</span>
              ) : null}
            </div>
            {/* Not <ProgressBar>: its fill is the programme colour, which is what this card's
                cover is already painted in, and the two would read as one bar cut in half. The
                track is the card's own hairline; the fill is the programme colour. */}
            <div className="mt-3 h-0.5 w-full bg-border-strong">
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
         * With a cover, the name is on the picture and printing it again underneath is the same
         * word twice — the owner's note on the first cover that arrived: «нужно название с
         * карточки убрать, потому что оно будет на картинке». It is hidden, not deleted: the cover
         * is decorative (`alt=""`), so the visible title is the only thing naming this card to a
         * screen reader.
         */}
        {coverSrc ? (
          <span className="sr-only">{title}</span>
        ) : (
          <DisplayTitle as="h2" text={title} className="text-2xl" />
        )}
        {subtitle ? <p className="mt-2 text-[13px] text-muted-2">{subtitle}</p> : null}

        {ctaHref ? (
          /* No arrow: it does not go forward into the work, it leaves for the web. */
          <LinkButton href={ctaHref} fullWidth size="lg" className="pointer-events-auto mt-4">
            {ctaLabel}
          </LinkButton>
        ) : (
          <Button
            fullWidth
            size="lg"
            className="pointer-events-auto mt-4"
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
