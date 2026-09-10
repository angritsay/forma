import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { photoSrc, type Photo } from '@/lib/media/photos';

export interface PhotoBlockProps {
  photo: Photo;
  /** Describes the picture for screen readers. Pass "" for purely decorative frames. */
  alt: string;
  /** Box shape. The brand crops portrait for phone blocks and landscape for headers. */
  ratio?: 'portrait' | 'landscape' | 'square';
  /** Overlay content — kicker, title, actions. Laid out against the bottom of the frame. */
  children?: ReactNode;
  /** Kicker set vertically down the left edge, outside the photograph. */
  edgeLabel?: ReactNode;
  /** Corner stamp (day counter, duration) in the top right. */
  stamp?: ReactNode;
  /** Load eagerly — set on the one photo above the fold, never on the rest. */
  priority?: boolean;
  className?: string;
}

const RATIO: Record<NonNullable<PhotoBlockProps['ratio']>, string> = {
  portrait: 'aspect-[4/5]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
};

/**
 * A photograph the brand's way: monochrome, grained, with a protection gradient under whatever
 * text sits on it.
 *
 * The frame is square-cornered on purpose. A photograph is the one thing in the system that runs
 * to the edge of its column — rounding it turns it back into a card, which is what the previous
 * design did and why the app read as a feed of tiles.
 */
export function PhotoBlock({
  photo,
  alt,
  ratio = 'portrait',
  children,
  edgeLabel,
  stamp,
  priority = false,
  className,
}: PhotoBlockProps) {
  return (
    <div className={clsx('relative', className)}>
      <div className={clsx('relative overflow-hidden', RATIO[ratio])}>
        <img
          src={photoSrc(photo)}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="photo-mono absolute inset-0 size-full object-cover"
        />
        <div className="photo-grain" aria-hidden="true" />
        {children ? (
          <>
            <div className="photo-scrim" aria-hidden="true" />
            <div className="absolute inset-x-5 bottom-5">{children}</div>
          </>
        ) : null}
        {stamp ? (
          <span className="absolute right-3 top-3 bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold text-white">
            {stamp}
          </span>
        ) : null}
      </div>
      {edgeLabel ? (
        <span
          className="eyebrow kicker-vertical absolute -left-4 top-1 hidden sm:block"
          aria-hidden="true"
        >
          {edgeLabel}
        </span>
      ) : null}
    </div>
  );
}
