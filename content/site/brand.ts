/**
 * Brand configuration. Edit freely — everything here is owner-facing.
 * Values marked "fill in" are listed in docs/SETUP.md.
 */
import type { L10n } from '@/content/schema';

export const BRAND = {
  name: 'Forma',
  /** Short legal/organization name used in JSON-LD and footers. */
  organization: 'Forma',
  tagline: {
    ru: 'Кроссфит дома. Под тебя.',
    en: 'Home CrossFit that adapts to you.',
  } satisfies L10n,
  /** Twitter/X handle without @, or empty. */
  twitter: '',
  /** Public contact email shown on the site (fill in). */
  contactEmail: 'hello@example.com',
  /** Telegram channel/community URL (fill in). */
  telegram: '',
  /** Instagram / YouTube URLs (optional). */
  instagram: '',
  youtube: '',
  /** Default OG image path relative to site root. */
  ogImage: '/og/default.png',
  /** Country of business for schema.org (ISO 3166-1 alpha-2). */
  country: 'RU',
} as const;
