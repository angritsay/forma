import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface PageTitleProps {
  title: ReactNode;
  /** Small kicker above the title. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  /**
   * Set the title as the screen's one big line — Unbounded 800 (`.display`) — instead of the
   * heading weight (`.font-display`, 600). One per screen: it is the line the eye lands on, and a
   * second one competes with it. Pair it with `.t-thin` inside the title for the brand's
   * heavy-into-light device: «Присед <span class="t-thin">без боли</span>».
   */
  display?: boolean;
  className?: string;
}

/*
 * The display steps of the type scale (global.css): 18 / 20 / 24px. Unbounded in capitals is wide
 * and dense — a Russian heading in caps at 28px fills a 390px screen on its own, and the screen
 * around it then has nowhere to breathe. Shorten the headline rather than grow the type back.
 */
const SIZE = { md: 'text-2xl', lg: 'text-3xl', xl: 'text-4xl' } as const;

/** Heading for the top of a screen: optional kicker, the title in the display face, optional subtitle. */
export function PageTitle({
  title,
  eyebrow,
  subtitle,
  size = 'lg',
  align = 'left',
  as: Tag = 'h1',
  display = false,
  className,
}: PageTitleProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <Tag className={clsx(display ? 'display' : 'font-display', 'text-balance', SIZE[size])}>
        {title}
      </Tag>
      {subtitle ? (
        <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
