/**
 * A person's header card on the «Тренер» tab — Sergey's and, behind the `coach_nastia` flag
 * (0049), Anastasia's. One anatomy for both (design/CHANGELOG.md §23): stickers, name, photograph,
 * and the two facts about the session. Nothing else goes in a card any more.
 *
 * The owner, on the first version of her card, which carried her facts, text and links inside it:
 * «You put my information *in* the card, but you should update my information *below* the card.»
 * So a card is a header only, and `BookScreen` shows whatever is below for the card in view.
 *
 * ## Two tones
 *
 * - `field` — Sergey: the electric-blue `HeroField`, white type, white glass stickers, the second
 *   word of the name as the light-blue key word over the neon swoosh, ghost pills for the facts.
 * - `sky` — Anastasia: the brand's light blue `--accent` (#afe9fd), her colour (§21). A light
 *   field, so everything on it is ink at full strength (`text-on-accent`, 14.3:1): the stickers are
 *   the dark-glass `ink` pill with white words, the facts are `ink-line` outlines. Never white
 *   (1.3:1). A thin second word, if her name ever has one, is ink too — the light-blue key word
 *   would vanish on a light-blue field.
 *
 * ## Two layouts
 *
 * - `beside` — today's single card, flag off: stickers over the name in a column beside the
 *   photograph. It is what the tab was, element for element.
 * - `stacked` — a card in the two-card strip, 86% of the column wide: the stickers beside the
 *   photograph and the name under both at full width. «Анастасия» is nine letters of the display
 *   face at 800 and does not fit beside a 112px frame on a phone card, and a name broken mid-word
 *   is worse than a name one row lower. Both cards use it, so both have the same compact shape —
 *   which also fixes the strip drawing his card as a tall empty field beside a taller one of hers.
 *   The frame steps down to 80px here so the sticker column has room for the longest sticker
 *   («Co-founder of Forma»): nothing is truncated and nothing lands on the photograph.
 *
 * The photograph is the same frame in both: 112px, 4:5, monochrome with grain (`.photo-mono`,
 * `.photo-grain`); an `Avatar` stands in if the path is ever emptied.
 */
import { clsx } from 'clsx';
import { useId, type HTMLAttributes } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { HeroField, KeyWord } from '@/components/ui/HeroField';
import { Doodle } from '@/components/ui/Doodle';
import { Pill } from '@/components/ui/Pill';
import { l, type Locale } from '@/i18n/index';
import type { L10n } from '@/content/schema';
import { withBase } from '@/lib/util/paths';

export type CoachHeroTone = 'field' | 'sky';
export type CoachHeroLayout = 'beside' | 'stacked';

export interface CoachHeroCardProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  tone: CoachHeroTone;
  layout?: CoachHeroLayout;
  /** `section` for the single card that is the tab's hero, `article` for a card in the strip. */
  as?: 'section' | 'article';
  locale: Locale;
  /** The tilted stickers — roles, in order. */
  stickers: readonly L10n[];
  /** The name's first word, set at 800. */
  heavy: string;
  /** The rest of the name, set thin; empty for a one-word name. */
  thin?: string;
  /** Path under /public; empty falls back to an `Avatar`. */
  photo?: string;
  /** The full name: the photograph's alt text and the fallback avatar's seed. */
  name: string;
  /**
   * The drawn mark on the name. `swoosh` (default) underlines the thin second word, as on Sergey's
   * card; `heart` hangs a hand-drawn heart off the heavy word instead — the owner's «вместо
   * подчёркивания сделай в таком же стиле сердечко» for her card. Electric blue, his card's colour.
   */
  mark?: 'swoosh' | 'heart';
  /**
   * The facts about the session, as outlined pills under the name. The «Тренер» tab no longer
   * passes any: the owner moved them out of the cards into a heading above the strip, where they
   * are said once for both people instead of twice.
   */
  facts?: readonly string[];
}

const TONE: Record<
  CoachHeroTone,
  { card: string; sticker: 'white' | 'ink'; fact: 'ghost' | 'ink-line'; frame: string }
> = {
  field: { card: '', sticker: 'white', fact: 'ghost', frame: 'bg-surface' },
  sky: {
    card: 'relative overflow-hidden rounded-card bg-accent p-5 text-on-accent',
    sticker: 'ink',
    fact: 'ink-line',
    frame: 'bg-ink/10',
  },
};

export function CoachHeroCard({
  tone,
  layout = 'beside',
  as = 'section',
  locale,
  stickers,
  heavy,
  thin,
  photo,
  name,
  facts = [],
  mark = 'swoosh',
  className,
  ...rest
}: CoachHeroCardProps) {
  const nameId = useId();
  const look = TONE[tone];
  const stacked = layout === 'stacked';

  /* Two or three stickers leaning opposite ways, like stuck on by hand. As one long pill the role
     was cut off («Founder and coach of …»), which is why they are several short ones. */
  const stickerList = stickers.map((role, i) => (
    <Pill
      key={role.en}
      tone={look.sticker}
      tilt={i % 2 === 0 ? 'right' : 'left'}
      className={i === 0 ? 'origin-left' : 'origin-center'}
    >
      {l(role, locale)}
    </Pill>
  ));

  /* 1.02 → 1.2. The lockup can be two lines — «Сергей» over «Титов» — and 1.02 was drawn for
     capitals, which have no descenders; «р» drops 0.182em below the baseline and the «Т» under it
     rises to cap height. global.css carries the measurement. */
  const heading = (
    <h2
      id={nameId}
      className={clsx(
        'display text-[clamp(30px,9vw,44px)] leading-[1.2] text-balance',
        tone === 'sky' && 'text-on-accent',
      )}
    >
      {mark === 'heart' ? (
        /* The heart takes no layout — the heading is as tall and as wide as without it — and sits
           off the word's top-right corner, tilted, like a doodle added after the name was set. */
        <span className="relative inline-block">
          {heavy}
          <Doodle
            kind="heart"
            strokeWidth={3}
            className="pointer-events-none absolute -top-[0.12em] -right-[0.62em] size-[0.55em] rotate-12 text-field"
          />
        </span>
      ) : (
        heavy
      )}
      {thin ? (
        <>
          {' '}
          {tone === 'field' ? (
            <KeyWord className="t-thin" swooshTone="action">
              {thin}
            </KeyWord>
          ) : (
            <span className="t-thin">{thin}</span>
          )}
        </>
      ) : null}
    </h2>
  );

  /*
   * The website's frame, not an avatar: 4:5, monochrome, grain over it. The grain is a sibling
   * element rather than an `::after` on the frame for the reason global.css gives — it has to sit
   * between the image and anything laid on top of it.
   */
  const frame = photo ? (
    <div
      className={clsx(
        'relative shrink-0 overflow-hidden rounded-inner',
        /* In the two-card strip the card is ~86% of the phone, so the frame steps down to 80px:
           that leaves the sticker column ~184px, room for «Co-founder of Forma» without the
           sticker spilling onto the photograph or being cut. */
        stacked ? 'w-20' : 'w-28',
        look.frame,
      )}
    >
      <img
        src={withBase(photo)}
        alt={name}
        width={256}
        height={320}
        className="photo-mono block aspect-[4/5] w-full object-cover"
      />
      <div className="photo-grain" aria-hidden="true" />
    </div>
  ) : (
    <Avatar seed={name} name={name} size={stacked ? 80 : 112} />
  );

  /* Facts about the session, so outlined: the one filled thing on the tab is its neon button. */
  const factRow =
    facts.length === 0 ? null : (
      <div className="flex flex-wrap gap-2">
        {facts.map((f) => (
          <Pill key={f} tone={look.fact}>
            {f}
          </Pill>
        ))}
      </div>
    );

  const body = stacked ? (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">{stickerList}</div>
          {frame}
        </div>
        {heading}
      </div>
      {factRow}
    </>
  ) : (
    <>
      <div className="flex items-end gap-5">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-2">{stickerList}</div>
          {heading}
        </div>
        {frame}
      </div>
      {factRow}
    </>
  );

  if (tone === 'field') {
    return (
      <HeroField
        as={as}
        aria-labelledby={nameId}
        className={clsx('flex flex-col gap-5', className)}
        {...rest}
      >
        {body}
      </HeroField>
    );
  }
  const Tag = as;
  return (
    <Tag
      aria-labelledby={nameId}
      className={clsx(look.card, 'flex flex-col gap-5', className)}
      {...rest}
    >
      {body}
    </Tag>
  );
}
