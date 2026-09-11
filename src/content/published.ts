/**
 * Courses published from the admin panel, fetched at **build time** so they get a landing page.
 *
 * The site is static HTML generated once. A course that lives in the database therefore has to be
 * read while the site is being built, not when it is visited — so this module makes one HTTP call
 * during the build and hands back `Course` objects in exactly the shape the pages already take.
 *
 * Three things this is careful about:
 *
 *   - **It never runs in a browser.** `import.meta.env.SSR` guards the fetch, and only `.astro`
 *     files import it. The app's own runtime path is `src/app/store/catalogue.ts`, which loads the
 *     same courses through the authenticated client.
 *   - **It never fails a build.** No Supabase configured, no network, a bad response, a course that
 *     does not validate — all of them return the courses found so far and leave a note on the
 *     console. A landing page is worth less than a deploy.
 *   - **It only sees what an anonymous visitor sees.** The anon key and RLS (0010) are the whole
 *     access story: published courses and their days, never the workouts.
 *
 * Because the fetch happens at build time, a course published in the admin panel gets its page on
 * the next deploy — which `publishAdminCourse()` asks for (see docs/SETUP.md §2.4).
 */
import { COURSES, LIVE_COURSES } from './registry';
import type { Course } from './schema';
import { draftToCourse, parseCourseContent, parseDayContent } from '@/lib/courses/draft';

interface DbCourse {
  id: string;
  slug_id: string;
  sort_order: number;
  level: number;
  weeks: number;
  sessions_per_week: number;
  avg_session_min: number;
  equipment: string[] | null;
  tile: string;
  price_rub: number | string;
  price_usd: number | string;
  content: unknown;
}

interface DbDay {
  course_id: string;
  node_id: string;
  week: number;
  day: number;
  kind: string;
  content: unknown;
  deload: boolean;
  steps_goal: number | null;
  sort_order: number;
}

const num = (v: number | string): number => (typeof v === 'number' ? v : Number(v) || 0);

async function get<T>(base: string, key: string, path: string): Promise<T> {
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return (await res.json()) as T;
}

async function load(): Promise<Course[]> {
  const base = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!import.meta.env.SSR || !base || !key) return [];

  const courses = await get<DbCourse[]>(
    base,
    key,
    'admin_courses?status=eq.published&order=sort_order.asc',
  );
  if (courses.length === 0) return [];

  const ids = courses.map((c) => `"${c.id}"`).join(',');
  const days = await get<DbDay[]>(
    base,
    key,
    `admin_course_days?course_id=in.(${ids})&order=sort_order.asc`,
  );

  const out: Course[] = [];
  for (const row of courses) {
    /*
     * No workouts: `custom_workouts` is not readable without an entitlement, and that is the point
     * (0010). `draftToCourse` will report the course as incomplete for it; the page renders the
     * programme's shape from the days and simply omits the sample-workout section, which it
     * already guards for.
     */
    const { course } = draftToCourse(
      {
        slugId: row.slug_id,
        sortOrder: row.sort_order,
        level: row.level,
        weeks: row.weeks,
        sessionsPerWeek: row.sessions_per_week,
        avgSessionMin: row.avg_session_min,
        equipment: row.equipment ?? [],
        tile: row.tile,
        priceRub: num(row.price_rub),
        priceUsd: num(row.price_usd),
        content: parseCourseContent(row.content),
      },
      days
        .filter((d) => d.course_id === row.id)
        .map((d) => ({
          nodeId: d.node_id,
          week: d.week,
          day: d.day,
          kind: d.kind as Course['nodes'][number]['kind'],
          workoutShortId: null,
          deload: d.deload,
          stepsGoal: d.steps_goal,
          sortOrder: d.sort_order,
          content: parseDayContent(d.content),
        })),
      [],
    );
    out.push(course);
  }
  return out;
}

/**
 * The published courses, or an empty list when there are none, the project is not configured, or
 * anything at all went wrong.
 */
export const PUBLISHED_COURSES: readonly Course[] = await load().catch((e: unknown) => {
  console.warn(
    `[published-courses] could not load them, building with the compiled courses only: ${
      e instanceof Error ? e.message : String(e)
    }`,
  );
  return [];
});

/**
 * Every course the **site** should have a page for: the compiled ones that are on sale, plus the
 * ones published from the admin panel.
 *
 * Compiled wins an id collision, exactly as `src/content/catalogue.ts` decides it for the app. That
 * matters during the migration of the five existing courses: both copies exist for a while, and the
 * reviewed file is the one that should be on sale.
 *
 * The compiled half is `LIVE_COURSES`, not `COURSES` — a course whose `published` flag is false has
 * no page, no sitemap entry and no card anywhere. The id collision is still tested against *all*
 * compiled courses, so taking one off sale does not quietly hand its slug to a database row of the
 * same id.
 */
export const SITE_COURSES: readonly Course[] = (() => {
  const compiled = new Set(COURSES.map((c) => c.id));
  return [...LIVE_COURSES, ...PUBLISHED_COURSES.filter((c) => !compiled.has(c.id))].sort(
    (a, b) => a.order - b.order,
  );
})();
