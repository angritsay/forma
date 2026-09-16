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
 * **Its words are the prototype's** (`design/ui_kits/app-v2`, «Программы»): the object stayed a
 * ticket — that is the owner's later decision — but what is printed on it is now figures. The
 * prototype's cover carries a kicker, the name, and three pills («4 недели», «18 мин», «11%
 * пройдено»); the tagline paragraph that stood here — «Четыре недели по программе тренера для
 * новичков: коротко, по кругу, без оборудования.» — said the same three facts in twenty words,
 * and the word «пройдено» beside the percentage said what the percentage already was.
 *
 * The parts are in the order a ticket has them:
 *
 *   - the **cover**, a band rather than a wall: the photograph, or the programme's colour where
 *     there is no photograph of its own — the brandbook's first rule, and what paints the marathon
 *     orange and «Форма с нуля» yellow;
 *   - the **stub**, carrying how far along you are as one figure: «11% · 3/28» over its rule. It
 *     is at the top because that is what was asked for, and the ticket metaphor agrees: the stub
 *     is the part with your seat number on it;
 *   - the **tear**, a dashed rule, which is the one line that makes the object read as a ticket
 *     rather than as another card;
 *   - the **identity** — what kind of thing it is, its name, and the facts as pills;
 *   - the **action**.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { publicMediaUrl } from '@/lib/api/storage';
import type { Photo } from '@/lib/media/photos';
import { isPlaceholder, photoSrc } from '@/lib/media/photos';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';

export interface CourseTicketProps {
  /**
   * The course's own cover art, as a media reference (`Course['cover']`). It beats `photo`: a
   * picture drawn for this course is never worse than a library photograph standing in for it.
   *
   * It also takes the title with it — see the cover band below.
   */
  cover?: string;
  /** Cover photograph; a stock placeholder counts as none and the colour takes over. */
  photo?: Photo;
  /** Kicker: what kind of thing this is and where you are in it. */
  eyebrow: ReactNode;
  title: string;
  /** The programme's facts — «4 недели», «18 мин», «без оборудования» — as pills under the name. */
  pills?: readonly string[];
  /**
   * One quiet line of *state*, where there is state worth a line: why the challenge is locked,
   * how long the trial has left, how many of today's tasks are still open. Never a description.
   */
  subtitle?: ReactNode;
  /** Completed share, 0..100. Omitted on a ticket with nothing to complete. */
  pct?: number;
  /** Set beside the figure: «3/28». */
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
  cover,
  photo,
  eyebrow,
  title,
  pills,
  subtitle,
  pct,
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

      {/*
       * The cover: 4:3.
       *
       * It was 2:1, chosen so «the ticket's own words are the larger half of it — at 16:10 the
       * picture won». The owner has asked for the opposite and given a number: a course card was
       * filling about 40% of a phone and should fill about 60%. On a 390px screen the ticket is
       * 342px wide, so 2:1 gave the cover 171px and a locked ticket — no progress stub, no tear —
       * came to 47% of the 761px the tab bar leaves. 4:3 gives the cover 257px and the same ticket
       * about 60%.
       *
       * The old rule is not wrong, it was answering a different question: this cover is about to
       * carry the course's name as artwork rather than as type (see `cover` in CourseSchema), and
       * a picture that has to hold a name needs the room. Where there is no cover the same box is
       * the programme colour, which reads as a bigger colour field rather than as a bigger photo.
       */}
      <div
        className={clsx(
          'pointer-events-none relative aspect-4/3 w-full overflow-hidden',
          coverSrc || art ? 'bg-ink' : 'hero-art',
        )}
      >
        {coverSrc ? (
          /*
           * The course's own cover, and the one picture here that is not treated as a photograph:
           * no `.photo-mono`, no grain. Those two turn a colour snapshot into the product's
           * monochrome; artwork drawn for this course already is what it is, and desaturating it
           * would strip the programme colour out of the one place the brandbook wants it.
           */
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
        {/*
         * The stub: where you are, as one figure — «11% · 3/28» — over its rule. The word
         * «пройдено» that used to follow the percentage is gone: a percentage on a course ticket
         * is the share done, and saying so is the label repeating the object.
         */}
        {share === undefined ? null : (
          <div className="pb-4">
            <div className="flex items-baseline gap-2">
              <span className="numeral tabular text-2xl leading-none text-text">{share}%</span>
              {progressMeta ? (
                <span className="numeral tabular text-sm text-muted-2">· {progressMeta}</span>
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
        {/*
         * With a cover, the name is on the picture and printing it again underneath is the same
         * word twice — the owner's note on the first cover that arrived: «нужно название с
         * карточки убрать, потому что оно будет на картинке».
         *
         * It is hidden, not deleted. The cover is decorative (`alt=""`), so the visible title was
         * the only thing naming this ticket to a screen reader, and dropping it outright would
         * leave a card announced as «Курс · Неделя 1 · День 1» and a button. `sr-only` keeps the
         * name in the accessibility tree and out of the layout.
         */}
        {coverSrc ? (
          <span className="sr-only">{title}</span>
        ) : (
          <DisplayTitle text={title} className="mt-2 text-2xl" />
        )}
        {pills && pills.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={title}>
            {pills.map((p) => (
              <li key={p} className="flex min-w-0">
                <Pill>{p}</Pill>
              </li>
            ))}
          </ul>
        ) : null}
        {subtitle ? <p className="mt-3 text-[13px] text-muted-2">{subtitle}</p> : null}

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
