/**
 * The marks of the three services a coach's link can point at — profi.ru, Instagram, Telegram —
 * drawn beside the address in the link's own colour.
 *
 * The owner: «добавь иконки лого в профи и в инсту». They are monochrome and take `currentColor`,
 * like every other mark in the product (`Icon`): a row of three brand colours on the coach's tab
 * would be three logos shouting over the one button that takes money. The shape is what makes each
 * one recognisable — Instagram's rounded camera, Telegram's paper plane — and profi.ru, whose own
 * mark is a wordmark, is its initial in a rounded square so the three sit at the same weight.
 *
 * Decorative: the address beside it is the link's name.
 */
import type { SVGProps } from 'react';
import type { CoachLinkKind } from '@content/site/coach';

export interface BrandMarkProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  kind: CoachLinkKind;
  size?: number;
}

export function BrandMark({ kind, size = 16, ...rest }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {kind === 'instagram' ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
        </>
      ) : kind === 'telegram' ? (
        <path
          d="M20.6 4.2 2.9 11.1c-.9.4-.9 1.6.1 1.9l4.4 1.4 1.7 5.3c.2.7 1.1.9 1.6.4l2.5-2.4 4.6 3.4c.6.4 1.4.1 1.6-.6l3.1-14.6c.2-.9-.7-1.6-1.5-1.3Zm-3.3 4.2-7.6 6.9-.3 3-1.3-4.1 8.8-5.6c.3-.2.6.1.4.3Z"
          fill="currentColor"
        />
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M9 17V7h3.6a3.2 3.2 0 0 1 0 6.4H9"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
