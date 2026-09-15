# Content authoring guide

All product content lives in `/content` as typed TypeScript (exercises, courses, site config) and
Markdown (guides). Everything is validated: `npm run test` runs the zod schemas and the
cross-reference checks in `src/content/registry.ts`; `npm run seo:audit` checks the guides.

## Languages

Every user-facing string is an `L10n` object: `{ ru: '…', en: '…' }`. Both are required. Slugs are
also per locale (`slug: { ru: 'prisedaniya', en: 'air-squat' }`) and must be latin kebab-case.
The app and the landing pick the string for the active language; videos follow the same rule
(`video: { ru: '…', en: '…' }`).

## Exercises (`content/exercises/*.ts`)

One object per exercise (`ExerciseInput` from `src/content/schema.ts`). Key fields:

- `id` — stable snake_case; referenced by courses, clips, SEO pages and user data. Never rename.
- `unit` — `reps` (needs `secondsPerRep`), `seconds`, `meters`, `calories`.
- `met` — metabolic equivalent for calorie estimates (Compendium of Physical Activities).
- `scaling.easier` / `scaling.harder` — ids used by the adaptive engine for substitutions
  (beginners, limitations, missing equipment).
- `video` — optional per-language URL. Public URLs (YouTube, Kinescope, CDN) are shown on the public
  exercise pages and in the app. Private files in Supabase Storage use `storage:videos/<course>/<file>`
  and are resolved to signed URLs in the app only (see `docs/SETUP.md`).

## Courses (`content/courses/<id>.ts`)

A course is a list of unique `workouts` plus an ordered list of `nodes` (the Duolingo-style path).

- Nodes reference workouts by id; `kind` is `workout`, `rest` (steps goal), `test` (baseline/retest),
  `benchmark` (classic timed workout) or `milestone`.
- Nodes must be ordered by `week`/`day`; the first and last node are tests.
- Blocks use formats `sets`, `circuit`, `amrap`, `emom`, `fortime`, `tabata`, `interval`.
  Warm-up/cool-down blocks are `scalable: false` so the engine does not shrink them.
- Author numbers for a level-2 athlete at scale 1.0 (level-1 courses: for a beginner). The engine
  multiplies volume by the user's scale (0.5–1.5) and the chosen difficulty.
- `price`, `paymentUrl` and `tile` are owner-editable. `tile` is the course's flat art colour;
  use one of `--tile-1…5` from `src/styles/global.css`. `--tile-1…3` are programme colours and
  belong to a programme, not a course; a course outside one takes a neutral surface, `--tile-4`
  or `--tile-5`, and several courses may share one.

Adding a course: create the file, add it to `content/courses/index.ts`, run `npm run test`.

Reviewing a course with the coach: `npm run content:review -- --course start` renders the path
day by day into `review/<course>.html` (gitignored) — every workout with its blocks, the authored
and beginner-scaled numbers, the engine's duration at each difficulty, and which movements have
the coach's video. The `start` course is his own beginner programme (`docs/COACH_SOURCE.md`);
each workout's source message is listed there and on the review page.

## Guides (`content/guides/{ru,en}/<slug>.md`)

SEO articles with frontmatter validated by `src/content.config.ts`. Only Russian is published
(`LOCALES` in `src/content/schema.ts`); English entries stay in the collection unrendered. Pair RU
and EN versions with the
same `translationKey`. Link to content with `exercise:<id>`, `course:<id>`, `guide:<translationKey>`
hrefs — they are rewritten to localized URLs at build time. Scaffold a new article with
`npm run seo:new-guide -- --lang ru --slug my-slug --key my-key --cluster beginners --keyword "…"`.
See `docs/SEO.md` for the full conveyor.

## Site config (`content/site/*.ts`)

`brand.ts` (name, contacts, socials, OG image), `coach.ts` (profile shown on /about and in JSON-LD),
`links.ts` (support links), `faq.ts` (landing FAQ), `pricing.ts` (currency display, refund window),
`booking.ts` (the coach's bookable hour), `plans.ts` (the subscription), `media.ts` (the montage
behind the sign-in screen) and `assessment.ts` (the five movements the onboarding measures).
Fill these in before launch (`docs/SETUP.md` has the checklist).

## Pictures of a movement

There is one, and it is the coach on video. An exercise's clip lives in the private `videos` bucket
and a still cut from that same clip in the public `images` bucket, both named after the exercise id
(`docs/VIDEO.md`). The app plays the clip in the player and draws the still everywhere else; where
neither exists there is a flat tile with the movement's name beside it, and nothing is drawn to
stand in for footage that has not been shot. An exercise with no clip is an exercise to film, not
one to illustrate.
