/**
 * Astro content collections.
 * guides: SEO articles in content/guides/{ru,en}/<slug>.md
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { GUIDE_CLUSTERS } from '@/lib/seo/clusters';

export { GUIDE_CLUSTERS };

const faq = z.array(z.object({ q: z.string().min(1), a: z.string().min(1) }));

/**
 * `YYYY-MM-DD` as a string. YAML turns an unquoted `2026-09-02` into a Date, so both forms are
 * accepted and normalized to the string (the audit, sitemap and JSON-LD all expect the string).
 */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v.trim()))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'));

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/guides' }),
  schema: z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(60).max(170),
    h1: z.string().min(5).max(90),
    targetKeyword: z.string().min(2),
    secondaryKeywords: z.array(z.string()).default([]),
    cluster: z.enum(GUIDE_CLUSTERS),
    /** Pairs RU and EN versions of the same article for hreflang. */
    translationKey: z.string().min(2),
    publishedAt: isoDate,
    updatedAt: isoDate,
    faq: faq.default([]),
    relatedExercises: z.array(z.string()).default([]),
    relatedCourses: z.array(z.string()).default([]),
    relatedGuides: z.array(z.string()).default([]),
    cta: z.object({ courseId: z.string().optional(), label: z.string().optional() }).default({}),
    priority: z.number().min(0).max(1).default(0.7),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
