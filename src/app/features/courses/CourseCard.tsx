/**
 * One course on «Курсы»: the photograph, a pill, the name, and one button.
 *
 * **The photograph is the card.** That is the owner's mockup and it is the third reduction of this
 * object. It was a ticket with nine parts (`CourseTicket`); then a 16:9 cover band over a panel of
 * text with a full-width button under it; now there is no panel at all — three pieces laid on the
 * picture. The panel was the last piece of furniture left: it cost a third of the card's height
 * to say three short things, and a card that is a picture with its figure on it is read at a
 * glance, which is the whole job of a progress screen.
 *
 * The anatomy, top to bottom, the same on both shapes of the card (design/CHANGELOG.md §18 — the
 * screen's one card grammar, tag → title → bottom row):
 *
 *   - the **pill**: the share completed, light blue, because progress is the interface accent
 *     (the semantic colour map, global.css header); or, on a course not started, the tilted neon
 *     promise («Первая тренировка бесплатно»); or nothing, on a course with neither;
 *   - the **name** under it, 22px in the display face at 800, at most two lines — the one title
 *     size every card on this screen has, so the coach's field and the course photograph read as
 *     one deck;
 *   - a **pill button** at the bottom right, sentence-case text, with a dark circle at its right
 *     end holding a white arrow — inside the pill, not beside it. White on a square card; the neon
 *     on the hero, which is the one main button of the screen. It was the course's colour until
 *     the third palette: a course tinted neon or orange would have put a second neon button
 *     beside the hero's.
 *
 * The mockup also drew a hairline progress rule across the top of the card and the share as a
 * 42px figure under it, in the course's colour. Both went with §18: the %-pill says the same
 * number, and the rule and the figure were the loudest type on a screen the owner found had
 * «слишком много типографики и элементов». What is left is three pieces per card and four type
 * sizes on the screen (26 / 22 / 15 / 13; `courses-type-scale.test.ts`).
 *
 * **The hero is the same photograph with a plate of glass on it** (design/CHANGELOG.md §17 —
 * owner: «для курсов — картинки и стекло»). The first card of the deck, the course you are
 * walking, was the screen's blue field for one iteration (§14's hero card); it is a picture again,
 * taller, with a pane of dense glass pinned to its bottom (`heroPlate.ts`) that holds the same
 * three pieces in the field's vocabulary: the pill; the name at display weight with its key word
 * light blue under the swoosh (`KeyTitle`); and **the screen's one neon button** with the arrow's
 * dark circle inside it. Nothing on this screen is the blue field any more.
 *
 * **Colour carries the programme, on the tag rather than on fills or type.** The card used to be
 * painted in `--course-tile`: a yellow cover band, a yellow progress fill. Here the photograph
 * stays a photograph and the name is white. That is what lets two courses sit on one screen and
 * be told apart without either of them shouting.
 *
 * Which still means the type has to survive the picture under it. A white name on a photograph
 * whose top third is a white sky fails WCAG just as a cyan one did, so the art carries
 * `.photo-scrim-top` — a gradient sized to the block of type, heavy where the pill and the name
 * sit and gone by the middle of the card. The ratios are measured on the composited pixels, not
 * estimated; see the class in global.css for the numbers this scrim was tuned to. The hero's type
 * sits on its plate, and the plate is what is measured there (`.glass-card-on-art`,
 * `contrast-usage.test.ts`).
 *
 * **A photograph, never lettered artwork.** `Course['cover']` is not read here any more. The one
 * cover the catalogue has, `/covers/start.jpg`, carries «ФОРМА // С НУЛЯ» in baked-in yellow
 * lettering, and a lettered cover under a cyan course name is two titles fighting for the same
 * card. The cover still leads the course's page on the site, where it is the only title there is.
 *
 * A course the athlete does **not** own has no % pill — nought per cent is not a fact about
 * somebody who has not started, it is a fact about somebody who is failing — so it shows the
 * picture held back, the name, and «Подробнее», which leaves for the course's own page. The button
 * is only ever offered when there is a page behind it (`LIVE_COURSES`); the screen decides that,
 * because the boundary belongs to the content and not to a card.
 */
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { KeyTitle } from '@/components/ui/HeroField';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import type { Photo } from '@/lib/media/photos';
import { isPlaceholder, photoSrc } from '@/lib/media/photos';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { courseCardFrame, heroPlateClasses } from './heroPlate';

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
  /**
   * The promise on a course not started — the tag above the name, where a started course has its
   * % pill.
   *
   * It exists for «Первая тренировка бесплатно»: the promise has to stand on the card, not open
   * after a tap, or it does not work at all. It is a pill on both shapes of the card — the tilted
   * neon sticker, the attention the neon exists for — and it is never shown together with the
   * percentage: a course has either progress or an invitation, not both at once. It was a line of
   * small capitals on the square card until §18 gave both shapes the same tag slot.
   */
  eyebrow?: ReactNode;
  /** `--course-tile`, its ink and `--course-accent`, from courseTileVars(). */
  style?: React.CSSProperties;
  /**
   * The screen's hero: the course you are walking, drawn as the taller photograph with the glass
   * plate and the screen's one neon button on it. See {@link HeroPlate}. One card per screen, the
   * first of the deck.
   */
  hero?: boolean;
}

export function CourseCard({
  photo,
  title,
  pct,
  eyebrow,
  ctaLabel,
  onCta,
  ctaHref,
  onOpen,
  openLabel,
  priority = false,
  dimmed = false,
  style,
  hero = false,
}: CourseCardProps) {
  const share = pct === undefined ? undefined : Math.max(0, Math.min(100, Math.round(pct)));
  const art = photo && !isPlaceholder(photo);
  const frame = courseCardFrame(hero);
  return (
    <article
      /*
       * Very nearly square — the mockup's card is 347×345 on a 375 column — so two of them fill a
       * phone with the second one's top edge showing, which is the deck saying there is more below
       * without a pager under it. The hero is taller (347×400) for its plate; `heroPlate.ts`.
       * `isolate` so the stacking here is the card's own: the open target sits under the type and
       * over the picture.
       *
       * `.glass-card`: a plate over the ground (global.css), so a course with no photograph yet is
       * the same material as every other card, and one with a photograph gets the hairline the
       * plates share. The photograph covers the fill edge to edge, so nothing else changes there.
       */
      className={clsx('glass-card relative isolate overflow-hidden', frame.article)}
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
          makes the accent type legal on a picture that has a white sky in it. On the hero it
          darkens from the bottom instead, under the plate, so the sky stays a sky. */}
      <div className={clsx(frame.scrim, 'absolute inset-0')} aria-hidden="true" />

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

      {hero ? (
        <HeroPlate
          title={title}
          share={share}
          eyebrow={eyebrow}
          ctaLabel={ctaLabel}
          onCta={onCta}
          ctaHref={ctaHref}
        />
      ) : (
        /* 16px of inset all round — the hero's plate has the same, so the pill and the name stand
           on one vertical across the deck. `pointer-events-none` so the whole picture stays one
           open target and only the button takes a press back. */
        <div className="pointer-events-none relative z-10 flex h-full flex-col p-4">
          {/*
           * The tag: the share as the light-blue pill (`.tabular` so a percentage does not jitter
           * as it climbs), or the tilted neon promise on a course not started, or nothing. The
           * same slot, in the same two tones, as the hero's plate.
           */}
          {share !== undefined ? (
            <Pill tone="sky" className="tabular">
              {share}%
            </Pill>
          ) : eyebrow ? (
            <Pill tone="neon" tilt="left" className="origin-left">
              {eyebrow}
            </Pill>
          ) : null}

          {/* The name, at the screen's one title size, under the pill where there is one and at
              the top of the card where there is not — an unnamed picture is a card about
              nothing. White, not the course's colour: the tag carries the programme now. */}
          <p
            className={clsx(
              'font-display line-clamp-2 text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance text-paper',
              share === undefined && !eyebrow ? null : 'mt-3',
            )}
          >
            {title}
          </p>

          <div className="mt-auto flex justify-end">
            <Cta ctaLabel={ctaLabel} onCta={onCta} ctaHref={ctaHref} tone="paper" />
          </div>
        </div>
      )}
    </article>
  );
}

interface HeroPlateProps {
  title: string;
  share?: number;
  eyebrow?: ReactNode;
  ctaLabel: ReactNode;
  onCta?: () => void;
  ctaHref?: string;
}

/**
 * The hero's plate: a pane of glass pinned to the bottom of the photograph (design/CHANGELOG.md
 * §17), holding the same three pieces as the square card in the vocabulary the blue field had:
 *
 *   - the percentage as a light-blue pill: it is progress, and progress is the interface accent
 *     (the semantic colour map, global.css header) — the course's orange is identity and would
 *     read as «effort» on a number that only counts. A course not started has no figure; its tag
 *     is the neon promise instead («Первая тренировка бесплатно»), tilted like a sticker, because
 *     that is the attention the neon exists for;
 *   - the name in white at display weight, its last word the light-blue key word with the swoosh
 *     — at the screen's one title size, 22px, the same as the square card and the coach's field;
 *   - **the screen's one neon button**, with the arrow's dark circle inside it, on its own row.
 *
 * The plate carried a progress rule beside the button until §18; the pill says the same number,
 * and without the rule the button's row is the bottom row every card on the screen ends in. The
 * material is `.glass-card-on-art` (`heroPlate.ts`): the ground's tint at the level-3 alphas, the
 * density a white sky behind it needs. `pointer-events-none` on the plate and `-auto` on the
 * button, as on the square card: the picture and the plate open the course, the button starts it.
 */
function HeroPlate({ title, share, eyebrow, ctaLabel, onCta, ctaHref }: HeroPlateProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col p-3">
      <div className={clsx(heroPlateClasses(), 'flex flex-col rounded-tile p-4 text-paper')}>
        <div className="flex min-h-8 items-start">
          {share !== undefined ? (
            <Pill tone="sky" className="tabular">
              {share}%
            </Pill>
          ) : eyebrow ? (
            <Pill tone="neon" tilt="left" className="origin-left">
              {eyebrow}
            </Pill>
          ) : null}
        </div>

        {/* `pb-[0.35em]`: the key word's swoosh hangs 0.28em under the baseline, and `line-clamp`
            clips to the padding box — without the room the swoosh was cut off. */}
        <h2 className="font-display mt-3 line-clamp-2 pb-[0.35em] text-[22px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance">
          <KeyTitle text={title} />
        </h2>

        <div className="mt-2 flex justify-end">
          <Cta ctaLabel={ctaLabel} onCta={onCta} ctaHref={ctaHref} tone="neon" />
        </div>
      </div>
    </div>
  );
}

interface CtaProps {
  ctaLabel: ReactNode;
  onCta?: () => void;
  ctaHref?: string;
  /** `paper` on a square card — one of several; `neon` on the hero — the screen's one button. */
  tone: 'paper' | 'neon';
}

const CTA_TONE: Record<CtaProps['tone'], string> = {
  paper: 'bg-paper text-ink',
  neon: 'bg-action text-on-action',
};

/**
 * The card's button: a pill, because it lies on a photograph (`Button`'s shape rule), with the
 * arrow's circle *inside* it at its right end — the mockup's one piece of ornament, and the thing
 * that makes the button read as «onward» rather than as a label. Dark on either fill, so the
 * arrow is white in it. A link out to the web has no arrow: it does not go forward into the
 * work, it leaves.
 */
function Cta({ ctaLabel, onCta, ctaHref, tone }: CtaProps) {
  if (ctaHref) {
    return (
      <a
        {...externalLinkProps(ctaHref)}
        className={clsx(
          'pointer-events-auto inline-flex shrink-0 items-center rounded-pill px-6 py-3 text-[15px] leading-none font-medium transition-opacity duration-150 ease-(--ease-out) hover:opacity-90',
          CTA_TONE[tone],
        )}
      >
        {ctaLabel}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onCta}
      className={clsx(
        'pointer-events-auto inline-flex shrink-0 items-center gap-3 rounded-pill py-1 pr-1 pl-6 text-[15px] leading-none font-medium transition-transform duration-120 ease-(--ease-out) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
        CTA_TONE[tone],
      )}
    >
      {ctaLabel}
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-ink text-paper"
      >
        <Glyph size={13}>→</Glyph>
      </span>
    </button>
  );
}
