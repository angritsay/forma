/**
 * The owner's own card on the «Тренер» tab — the second card of the hero strip, beside Sergey's
 * blue field, shown only to people with the `coach_nastia` flag (0049). For now that is her.
 *
 * ## Why light blue
 *
 * The coach tab's fields are the blue hero (Sergey) and bleu ciel (the offer's tag). Hers is the
 * brand's light blue, `--accent` #afe9fd — her colour, the owner's «светло-голубой — это брендовый
 * цвет наш» — and the only field of that colour on the tab: with two people in one strip, the
 * colour is what tells them apart before a word is read (design/CHANGELOG.md §21).
 *
 * Light blue is a light field, so everything on it is ink (`text-on-accent`, #111111, 14.3:1) and
 * at full strength: never white (1.3:1), never ink at reduced opacity. The two stickers are the
 * dark-glass `ink` pill, white on ink, which stays ≥ 7 over this field
 * (`src/lib/ui/contrast-usage.test.ts`).
 *
 * ## The layout
 *
 * Sergey's card, mirrored as far as it goes: stickers (picture on the right) → name → facts →
 * short text → topics → links. Her portrait sits in the same 4:5 frame, 112px wide, monochrome
 * with grain like his; a monogram on a faint ink plate stands in if the photograph is removed.
 *
 * Every word is in `content/site/nastia.ts`, bilingual, picked by the app's language — the links
 * too, which are per language by the owner's instruction.
 */
import { clsx } from 'clsx';
import { useId } from 'react';
import { BrandMark } from '@/components/ui/BrandMark';
import { Pill } from '@/components/ui/Pill';
import { l, type Locale } from '@/i18n/index';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { withBase } from '@/lib/util/paths';
import { NASTIA } from '@content/site/nastia';

export interface NastiaCardProps {
  locale: Locale;
  className?: string;
}

export function NastiaCard({ locale, className }: NastiaCardProps) {
  const nameId = useId();
  const links = NASTIA.links[locale] ?? NASTIA.links.ru;

  return (
    <article
      aria-labelledby={nameId}
      className={clsx(
        'relative flex flex-col gap-5 overflow-hidden rounded-card bg-accent p-5 text-on-accent',
        className,
      )}
    >
      {/*
        The stickers beside the picture's frame, and the name under both at full width: «Анастасия»
        is nine letters of the display face at 800 and does not fit beside a 112px frame the way
        «Сергей» does, and a name broken mid-word is worse than a name one row lower.
      */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-5">
          {/* Two stickers leaning opposite ways, like Sergey's. */}
          <div className="flex min-w-0 flex-1 flex-wrap content-start items-center gap-2">
            {NASTIA.roles.map((role, i) => (
              <Pill
                key={role.en}
                tone="ink"
                tilt={i === 0 ? 'right' : 'left'}
                className={i === 0 ? 'origin-left' : 'origin-center'}
              >
                {l(role, locale)}
              </Pill>
            ))}
          </div>
          {/* The same 4:5 frame as Sergey's, the same monochrome and grain; the monogram stays
              as the fallback if the photograph is ever removed. */}
          {NASTIA.photo ? (
            <div className="relative w-28 shrink-0 overflow-hidden rounded-inner bg-ink/10">
              <img
                src={withBase(NASTIA.photo)}
                alt={l(NASTIA.name, locale)}
                width={256}
                height={320}
                loading="lazy"
                decoding="async"
                className="photo-mono block aspect-[4/5] w-full object-cover"
              />
              <div className="photo-grain" aria-hidden="true" />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="flex aspect-[4/5] w-28 shrink-0 items-center justify-center rounded-inner bg-ink/10"
            >
              <span className="display text-[56px] leading-none text-on-accent">
                {l(NASTIA.initial, locale)}
              </span>
            </div>
          )}
        </div>
        <h2
          id={nameId}
          className="display text-[clamp(30px,9vw,44px)] leading-[1.2] text-on-accent"
        >
          {l(NASTIA.name, locale)}
        </h2>
      </div>

      {/* Two figures, small and inside the card — hers, not the tab's. */}
      <dl className="grid grid-cols-2 gap-4">
        {NASTIA.facts.map((f) => (
          // The caption is the term and comes first in the markup; the figure is set above it.
          <div key={f.figure} className="flex min-w-0 flex-col-reverse justify-end gap-1">
            <dt className="text-[13px] leading-snug text-on-accent">{l(f.caption, locale)}</dt>
            <dd className="numeral tabular text-[26px] leading-none text-on-accent">{f.figure}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[15px] leading-relaxed text-on-accent">{l(NASTIA.bio, locale)}</p>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-on-accent">{l(NASTIA.topicsLead, locale)}</p>
        <ul className="flex flex-wrap gap-2">
          {NASTIA.topics.map((topic) => (
            <li
              key={topic.en}
              className="inline-flex h-8 items-center rounded-pill border border-ink px-3 text-[13px] text-on-accent"
            >
              {l(topic, locale)}
            </li>
          ))}
        </ul>
      </div>

      {/*
       * Her links, for the app's language. Outlined chips like Sergey's, with the ink border the
       * light field needs; `externalLinkProps` so Telegram opens them outside the Mini App.
       */}
      {links.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {links.map((x) => (
            <li key={x.url}>
              <a
                {...externalLinkProps(x.url)}
                rel="noopener noreferrer"
                className="control-label inline-flex h-10 items-center gap-2 rounded-control border border-ink px-4 text-[13px] text-on-accent transition-colors duration-150 active:bg-ink/10"
              >
                <BrandMark kind={x.kind} size={16} className="shrink-0" />
                {x.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
