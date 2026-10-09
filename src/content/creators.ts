/**
 * Creators with a public page (`/c/<slug>/`, docs/PLATFORM.md phase 2 step 2), fetched at **build
 * time** — the same arrangement as `published.ts` for the courses, and for the same reason: the
 * site is static HTML, so a creator who lives in the database has to be read while it is built.
 *
 * What this reads is `public_creators()` (0068) with the anon key: open creators other than Forma
 * itself who have at least one published course, and of each only the slug, the name, the line
 * about them, the link to their audience and the ids of their published courses. Never the owner's
 * address, the tier, the fee or a balance — the function does not return them, so there is nothing
 * here to forget to strip.
 *
 * Like `published.ts` it never runs in a browser (`import.meta.env.SSR`) and never fails a build:
 * no Supabase configured, no network, a bad answer — each builds the site with no creator pages
 * and leaves a note on the console.
 *
 * A creator's courses are matched against `SITE_COURSES`, the courses that have a page. A course
 * id the site cannot link (a compiled course taken off sale that shares the id, a course that did
 * not convert) is dropped, and a creator left with none gets no page: a page whose list is empty
 * is the thin page the sitemap rule is there to keep out.
 */
import type { Course } from './schema';
import { SITE_COURSES } from './published';

/** A creator as the site prints them. */
export interface SiteCreator {
  slug: string;
  name: string;
  about: string | null;
  audienceUrl: string | null;
  /** Their courses that have a page on the site, in the creator's order. */
  courses: Course[];
}

/** One row of `public_creators()`. */
export interface PublicCreatorRow {
  slug: string;
  name: string;
  about: string | null;
  audience_url: string | null;
  courses: string[] | null;
}

/** The same check as `creators.slug` (0064): what is safe to use as a path segment. */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Rows → pages. Pure, so the rules are tested without a network: a malformed slug is skipped
 * (the database's own check makes it impossible, but this is a path on disk), an audience link that
 * is not https is dropped, and only courses with a site page are kept.
 */
export function siteCreatorsFrom(
  rows: readonly PublicCreatorRow[],
  courses: readonly Course[],
): SiteCreator[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: SiteCreator[] = [];
  for (const r of rows) {
    if (!SLUG_RE.test(r.slug) || seen.has(r.slug)) continue;
    const list = (r.courses ?? []).flatMap((id) => {
      const c = byId.get(id);
      return c ? [c] : [];
    });
    if (list.length === 0) continue;
    seen.add(r.slug);
    out.push({
      slug: r.slug,
      name: r.name.trim(),
      about: r.about?.trim() || null,
      audienceUrl: r.audience_url && /^https:\/\//.test(r.audience_url) ? r.audience_url : null,
      courses: list,
    });
  }
  return out;
}

async function load(): Promise<PublicCreatorRow[]> {
  const base = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!import.meta.env.SSR || !base || !key) return [];
  const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/public_creators`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  // A project the migration has not reached yet answers 404: no creator pages, not a failed build.
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for rpc/public_creators`);
  const rows = (await res.json()) as unknown;
  return Array.isArray(rows) ? (rows as PublicCreatorRow[]) : [];
}

/** Every creator with a page, or none when the backend is not configured or anything failed. */
export const SITE_CREATORS: readonly SiteCreator[] = siteCreatorsFrom(
  await load().catch((e: unknown) => {
    console.warn(
      `[creator-pages] could not load them, building without creator pages: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
    return [];
  }),
  SITE_COURSES,
);

/** The creator's page, without base or locale: `/c/<slug>/`. */
export function creatorSitePath(slug: string): string {
  return `/c/${slug}/`;
}
