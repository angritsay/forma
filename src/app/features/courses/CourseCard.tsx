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
 *   - a white pill button at the bottom right, dark sentence-case text, with a dark circle at its
 *     right end holding a white arrow — inside the pill, not beside it. It was the course's colour
 *     until the third palette: the neon is now the one main button of a screen (the hero's), and a
 *     course tinted neon or orange would have put a second one beside it.
 *
 * **The hero is the same photograph with a plate of glass on it** (design/CHANGELOG.md §17 —
 * owner: «для курсов — картинки и стекло»). The first card of the deck, the course you are
 * walking, was the screen's blue field for one iteration (§14's hero card); it is a picture again,
 * taller, with a pane of dense glass pinned to its bottom (`heroPlate.ts`) that holds the same
 * four facts in the field's vocabulary: the % as a light-blue pill (progress is the interface
 * accent), or the tilted neon promise on a course not started; the name at display weight with
 * its key word light blue under the swoosh (`KeyTitle`); the progress rule; and **the screen's one
 * neon button** with the arrow's dark circle inside it. Nothing on this screen is the blue field
 * any more.
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
 * global.css for the numbers this scrim was tuned to. The hero's type sits on its plate, and the
 * plate is what is measured there (`.glass-card-on-art`, `contrast-usage.test.ts`).
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
   * Одна строка над названием — там, где у начатого курса стоит процент.
   *
   * Существует ради «Первая тренировка бесплатно»: обещание должно стоять на карточке, а не
   * открываться после нажатия, иначе оно не работает вовсе. Набрана мелким капсом, как все
   * надстрочные строки продукта, и не показывается вместе с процентом — у курса либо прогресс,
   * либо приглашение, но не оба сразу.
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
        /* 24px of inset all round, which is the app's gutter and, measured off the mockup, the
           card's own. `pointer-events-none` so the whole picture stays one open target and only
           the button takes a press back. */
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
                  className="h-full bg-accent"
                  style={{ width: `${share}%` }}
                  role="progressbar"
                  aria-label={title}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={share}
                />
              </div>
              {/* The figure, set the prototype's way — the number larger than the word — and in
                  the light blue, because it is progress and progress is the interface accent (the
                  semantic colour map, global.css header): the course's own colour is identity and
                  does not colour type on a photograph. `.tabular` so a percentage does not jitter
                  as it climbs; the display face at 800 through `.font-display` with the weight
                  raised, because `.display` brings a tracking and a line height that a one-line
                  figure of digits does not want. */}
              <p className="font-display tabular mt-4 text-[42px] leading-none font-extrabold tracking-[-0.02em] text-accent">
                {share}%
              </p>
            </>
          )}

          {share === undefined && eyebrow ? (
            <span className="eyebrow text-paper/85">{eyebrow}</span>
          ) : null}

          {/* The name sits under the figure where there is one, and at the top of the card where
              there is not — a locked course has no figure to stand under, and an unnamed picture
              is a card about nothing. */}
          <p
            className={clsx(
              'text-[15px] leading-tight font-semibold text-paper',
              share === undefined && !eyebrow ? null : 'mt-2',
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
 * §17), holding the same four facts as the square card in the vocabulary the blue field had:
 *
 *   - the percentage as a light-blue pill: it is progress, and progress is the interface accent
 *     (the semantic colour map, global.css header) — the course's orange is identity and would
 *     read as «effort» on a number that only counts. A course not started has no figure; its tag
 *     is the neon promise instead («Первая тренировка бесплатно»), tilted like a sticker, because
 *     that is the attention the neon exists for;
 *   - the name in white at display weight, its last word the light-blue key word with the swoosh;
 *   - the progress as a rule on the plate — the accent over 18% white, the square card's own rule;
 *   - **the screen's one neon button**, with the arrow's dark circle inside it, beside the rule.
 *
 * The rule and the button share a row so the plate stays under half the card and the photograph
 * keeps its top half: stacked, the plate would have taken 57% of a 347×400 card. The material is
 * `.glass-card-on-art` (`heroPlate.ts`): the ground's tint at the level-3 alphas, the density a
 * white sky behind it needs. `pointer-events-none` on the plate and `-auto` on the button, as on
 * the square card: the picture and the plate open the course, the button starts it.
 */
function HeroPlate({ title, share, eyebrow, ctaLabel, onCta, ctaHref }: HeroPlateProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col p-3">
      <div className={clsx(heroPlateClasses(), 'flex flex-col rounded-tile p-5 text-paper')}>
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

        <h2 className="font-display mt-3 line-clamp-2 text-[26px] leading-[1.2] font-extrabold tracking-[-0.02em] text-balance">
          <KeyTitle text={title} />
        </h2>

        <div className="mt-4 flex items-center justify-end gap-4">
          {share !== undefined ? (
            <div className="h-[2px] min-w-0 flex-1 bg-paper/18">
              <div
                className="h-full bg-accent"
                style={{ width: `${share}%` }}
                role="progressbar"
                aria-label={title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
              />
            </div>
          ) : null}
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
