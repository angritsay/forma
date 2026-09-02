# SEO conveyor — runbook

How Forma's public pages are produced, how a keyword becomes a page, and what to check before and
after every deploy. The pipeline mirrors the moba-trainer one: structured documents → templated
pages → JSON-LD → sitemap/robots/llms → internal links → hubs → IndexNow.

Quick commands:

| Command                             | What it does                                                             |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `npm run seo:audit`                 | Static content audit (+ built-site checks when `dist/` exists). Exit 1 on errors. Flags: `-- --dist <dir>`, `--base </forma/>` (or `BASE_PATH`), `--no-dist`, `--json`. |
| `npm run seo:new-guide -- …`        | Scaffold a guide with the right frontmatter and section skeleton (`draft: true`). |
| `npm run seo:og`                    | Render OG images into `public/og/` (run **before** `astro build`). Flags: `-- --only exercise,guide`, `--limit N`, `--quiet`. |
| `npm run seo:indexnow`              | Submit sitemap URLs to IndexNow after deploy (needs `INDEXNOW_KEY`).     |
| `npx vitest run scripts/seo src/lib/seo` | Unit tests for the parser, rules, link resolver and page registry. |

A local end-to-end check (no dev server needed):

```sh
npm run seo:og
SITE_URL=https://example.com BASE_PATH=/forma/ npx astro build --outDir /tmp/build-seo
node scripts/seo/audit.mjs --dist /tmp/build-seo --base /forma/
```

## 1. How pages are generated

Every public page is rendered from data, through one of four families:

| Family | Route | Source | Template | JSON-LD |
| --- | --- | --- | --- | --- |
| Home / hubs / legal | `/`, `/courses/`, `/about/`, … | landing area | `src/pages/[...lang]/*.astro` | `WebSite`, `Organization`, `ItemList`, `FAQPage` |
| Courses | `/courses/<slug>/` | `content/courses/*.ts` (registry) | landing area | `Course` (`courseJsonLd`), `BreadcrumbList`, `FAQPage` |
| Exercises | `/exercises/`, `/exercises/<slug>/` | `content/exercises/*.ts` (registry) | `src/pages/[...lang]/exercises/{index,[slug]}.astro` | hub: `CollectionPage`+`ItemList`, `BreadcrumbList`; page: `HowTo`, `BreadcrumbList`, `VideoObject` (public video only), `FAQPage` |
| Guides | `/guides/`, `/guides/<cluster>/`, `/guides/<slug>/` | `content/guides/{ru,en}/*.md` (content collection) | `src/pages/[...lang]/guides/{index,[slug]}.astro` → `GuideClusterHub.astro` / `GuideArticle.astro` | hubs: `CollectionPage`+`ItemList`; article: `Article`, `BreadcrumbList`, `FAQPage` |

Building blocks (all under `src/lib/seo/` and `src/components/seo/`):

- `pages.ts` / `routes.ts` — **page registry** (`allPages()`): one record per URL and locale with
  `title`, `description`, `changefreq`, `priority`, `lastmod`, hreflang `alternates`, `kind`.
  `/app/` is never listed. Feeds the sitemap and `llms.txt`.
- `meta.ts` — title/description generators. Titles fit a **60-char** budget including the
  `" — Forma"` suffix (`exerciseTitle` cascades through three templates, then cuts at a word
  boundary). `buildDescription()` targets **120–160** chars from real prose only: whole
  sentences first; when short it tries, in order, sentences + the CTA line, the prose cut at the
  budget with an ellipsis, cut prose + CTA — and never pads with invented text (a very short
  exercise description simply yields a shorter meta description, which the audit warns about
  below 80 chars). `ogImagePath()` returns the generated PNG or `/og/default.png` when it does
  not exist.
- `jsonld.ts` — schema.org builders (`organizationJsonLd`, `websiteJsonLd`, `personJsonLd`,
  `breadcrumbJsonLd`, `faqJsonLd`, `itemListJsonLd`, `collectionPageJsonLd`, `howToJsonLd`,
  `videoObjectJsonLd`, `articleJsonLd`, `courseJsonLd`). `JsonLd.astro` merges them into one
  `@graph`. Placeholder emails (`@example.com`) and empty config fields are never emitted.
- `exercises.ts` — grouping by movement pattern, related exercises (same pattern → shared muscles →
  same equipment), scaling links, generated FAQ (mistakes, cues, then breathing / scaling /
  equipment — the coach's own text re-phrased as Q&A), public video detection (`storage:` refs
  are app-only and never rendered publicly).
- `guides.ts` — locale/slug from the entry id (`ru/<slug>`), cluster ↔ hub slug
  (`no_equipment` → `/guides/no-equipment/`), translation pairing by `translationKey`, related
  articles (explicit keys, then same cluster). Cluster hubs are generated **only for clusters that
  have at least one published guide in that locale** (no thin, empty hubs).
- `rehype-content-links.ts` — markdown link resolver registered in `astro.config.mjs`:
  `[текст](exercise:air_squat)`, `[…](course:start)`, `[…](guide:<translationKey>)` become
  localized, base-prefixed URLs (locale from the file path). Unknown targets are unwrapped to plain
  text and logged (`[content-links] …`); the audit reports them as errors.
- Components: `SeoHead.astro` (title, description, canonical, hreflang ru/en/x-default, OG/Twitter,
  robots, verification metas, JSON-LD), `Analytics.astro` (Yandex Metrika + GA4 only when the ids
  are set), `Breadcrumbs.astro`, `FaqAccordion.astro`, `GuideBody.astro` (prose styles from tokens),
  `RelatedLinks.astro`, `GuideCard.astro`, `CourseLinkCard.astro`, `exercises/ExerciseCard.astro`.

Internal linking rules baked into the templates: every exercise page links to the courses that use
it, ≥ 3 related exercises and its easier/harder variants; every guide links to its cluster hub,
related exercises/courses/guides and a CTA course; hubs link to every child page.

## 2. Keyword → page workflow

1. **Research.** Pick a cluster from `content/seo/keywords.json` (clusters match `GUIDE_CLUSTERS`).
   Check the head term and long-tails in **Yandex Wordstat** (RU, "по фразе" + region) and
   **Google Keyword Planner** / Search Console queries (EN). Confirm the intent by looking at the
   top-10 results: informational → guide, commercial → equipment/comparison guide, transactional →
   course page. **One page = one intent** — do not fold two intents into one article.
2. **Record it.** Add rows to `keywords.json` (`locale`, `keyword`, `type` head/long_tail, `intent`,
   `targetPage` = the slug you will create or `planned`, `priority`). Do not store volumes — they
   go stale; note them in the PR description instead.
3. **Scaffold both locales.**
   ```sh
   npm run seo:new-guide -- --lang ru --slug kak-delat-berpi --key how-to-burpee --cluster no_equipment --keyword "как делать бёрпи"
   npm run seo:new-guide -- --lang en --slug how-to-do-a-burpee --key how-to-burpee --cluster no_equipment --keyword "how to do a burpee"
   ```
   The same `--key` (translationKey) pairs the two files for hreflang.
4. **Write** per the checklist in §3. Each language version is an original article, not a
   translation (same structure and facts; local examples).
5. **Publish.** Set `draft: false`, run `npm run seo:audit`, fix every error and as many warnings as
   are reasonable, open the PR. CI runs the audit again after the build (with sitemap and page tag
   checks).
6. After deploy: IndexNow runs from the workflow; check Search Console / Webmaster after a few days
   (§5–6).

## 3. On-page checklist (guides)

The audit enforces the hard limits and warns on the soft ones. The content-collection schema
(`src/content.config.ts`) is stricter than the audit for a few fields and fails the **build**:
title 10–70, description 60–170, h1 5–90 chars, valid cluster, `YYYY-MM-DD` dates — so run the
audit before pushing.

- **title** ≤ 60 chars (schema allows 70; the audit errors above 70) — the keyword in it, brand
  suffix is added automatically.
- **description** 120–160 chars (hard 60–170), contains the keyword, ends with a soft CTA.
- **h1** contains the keyword; the body must not contain another H1.
- **Keyword in the first 100 words**, in at least one **H2**, and 3–6 `secondaryKeywords` used
  naturally.
- **Structure:** hook → what the reader gets → 4–7 H2 sections (H3 where useful) → sample workout
  with real library exercises (format, reps, rest, how the app scales it) → common mistakes →
  how to progress → short conclusion with the CTA sentence.
- **≥ 900 words** in the body (hard minimum 800).
- **Internal links:** ≥ 3 content links (`exercise:` / `guide:` / `course:`) and ≥ 1 course link
  (or `cta.courseId`). Every referenced id must exist **at audit time** — an exercise that the
  library has not shipped yet or a guide that is still planned is an error, not a placeholder;
  add the link when the target exists. Fill `relatedExercises`, `relatedCourses`,
  `relatedGuides` (translationKeys). At build time an unresolved body link is rendered as plain
  text and unknown related ids are dropped, so a stale reference never 404s — but it also never
  links.
- **FAQ:** 3–5 items, answers 1–3 sentences, self-contained (they become `FAQPage` JSON-LD).
- **Images:** every image has a meaningful `alt`.
- **Translation pair:** the same `translationKey` exists in the other locale (warning until it does).
- **Voice and honesty:** coach's voice, RU «ты» without exclamation marks, EN second person; cite
  guidelines by name (ACSM, WHO 150–300 min/week, the ~7 000-steps studies) without inventing
  numbers; no medical claims, no testimonials, no invented statistics, no prices.
- **Slug:** kebab-case, unique per locale, never equal to a cluster hub slug.

## 4. Technical SEO in the repo

| Concern | Where | Notes |
| --- | --- | --- |
| Canonical + hreflang | `SeoHead.astro`, `lib/seo/urls.ts` | `ru` (no prefix), `en` (`/en/`), `x-default` → ru. Pages that exist in one locale only emit only themselves. |
| Sitemap | `src/pages/sitemap.xml.ts` | `allPages()` with `xhtml:link` alternates, `lastmod` (guide `updatedAt`, build date otherwise), `changefreq`, `priority`. |
| robots.txt | `src/pages/robots.txt.ts` | `Allow: /`, `Disallow: <base>/app/`, `Sitemap:`, `Host:`. Only effective at the origin root — on a GitHub Pages *project* site (base path) crawlers do not read it; use a custom domain or accept it. |
| llms.txt | `src/pages/llms.txt.ts` | Generated: brand, intro, courses, guides, exercise library, about, legal — EN and RU sections. |
| RSS | `src/pages/rss.xml.ts` | Guides feed, RU items first. |
| IndexNow key file | `src/pages/[key].txt.ts` | Emitted only when `INDEXNOW_KEY` is set at build time. |
| OG images | `scripts/seo/og.mjs` → `public/og/*.png` | 1200×630, dark card with the athlete figure on the course gradient: `default.png`, `hub-<home\|courses\|exercises\|guides>-<locale>.png`, `course-<id>-<locale>.png`, `exercise-<id>-<locale>.png`, `guide-<translationKey>-<locale>.png`. `public/og/` is git-ignored; the deploy workflow runs `npm run seo:og` before `npm run build`. Fonts (Manrope, Playfair Display Italic) are bundled under the OFL in `scripts/seo/fonts/` and passed to resvg with `loadSystemFonts: false`; if the folder is emptied the script warns and falls back to system fonts. Content and i18n are imported straight from the TypeScript sources (Node ≥ 22.13 type stripping via `scripts/seo/ts-loader.mjs`); the figure comes from `src/components/anim/render.ts`, and an exercise whose pose set has not shipped yet renders the standing pose (the `[anim] unknown animation` lines in the log). |
| Analytics / verification | `Analytics.astro`, `SeoHead.astro` | `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`, `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION` — rendered only when set. |
| `/app/` | `src/pages/app/index.astro` | `noindex, nofollow`, excluded from the sitemap and disallowed in robots. |

Validate structured data after a build or deploy:

- Google **Rich Results Test** (https://search.google.com/test/rich-results) — paste a URL or the
  HTML of `dist/.../index.html`. Expect `HowTo`/`FAQPage`/`BreadcrumbList` on exercise pages,
  `Article`/`FAQPage` on guides, `Course` on course pages.
- Yandex **Валидатор микроразметки** (https://webmaster.yandex.ru/tools/microtest/).
- `VideoObject` needs `uploadDate` for Google video rich results; the content schema has no
  upload date yet — add it before relying on video snippets.

What the built-site part of the audit checks on every `dist/**/index.html` (except `/app/` and
`404`): exactly one `<title>` (≤ 60 soft / 70 hard) unique across the site, one `<h1>`, a meta
description (80–160 soft), `lang` on `<html>`, exactly one canonical that points at the page's
own file, hreflang alternates including `x-default` whose targets all exist, the page's own
`hreflang` equal to its canonical, no `noindex`, and presence in `sitemap.xml`; plus, for the
sitemap itself: every URL inside the base path, unique, and backed by a file. `robots.txt`,
`llms.txt` and `rss.xml` must exist.

## 5. After deploy

1. **IndexNow** (Yandex, Bing): `deploy.yml` runs `npm run seo:indexnow` when the `INDEXNOW_KEY`
   secret exists (the same value must be set at build time so `/<key>.txt` is emitted). Manual:
   ```sh
   INDEXNOW_KEY=… SITE_URL=https://… node scripts/seo/indexnow.mjs --changed-since 2026-09-01
   ```
   Generate a key once: any 8–128 alphanumeric string (e.g. `openssl rand -hex 16`).
2. **Google Search Console:** add the property (Domain property for a custom domain, URL-prefix
   `https://<user>.github.io/<repo>/` for project pages). Verify with the HTML tag: put the
   `content` value in `PUBLIC_GOOGLE_VERIFICATION`, redeploy. Submit `sitemap.xml`.
3. **Yandex Webmaster:** add the site, verify with the meta tag (`PUBLIC_YANDEX_VERIFICATION`),
   submit the sitemap under «Индексирование → Файлы Sitemap», set the region if the audience is
   local. «Оригинальные тексты» and Turbo pages are not needed. Check «Диагностика» for
   duplicate-title warnings after the first crawl.
4. **Yandex Metrika goals** (if `PUBLIC_YANDEX_METRIKA_ID` is set): create goals for the order form
   submit (`order_submit`), app opens from the landing (`open_app`) and course page views; the
   landing sends them with `ym(id, 'reachGoal', name)` where wired.

## 6. Monitoring and iteration

- **Search Console → Performance:** filter by page family (`/guides/`, `/exercises/`,
  `/courses/`). Rows with many impressions and CTR < 2 %: rewrite title/description (keep the
  keyword, add the promise). Queries with position 5–15 for a page: strengthen the section that
  answers them, add an FAQ item, link to the page from two related pages.
- **Search Console → Pages / Yandex «Страницы в поиске»:** every sitemap URL should be indexed;
  "Duplicate, Google chose different canonical" usually means a hreflang/canonical mismatch —
  rerun the audit on `dist/`.
- **Rich results report** for `HowTo`, `FAQ`, `Breadcrumb` errors after template changes.
- **Yandex Webmaster → Диагностика/Качество** for slow pages and thin content.
- Monthly: refresh `keywords.json` targets, update `updatedAt` when an article is materially
  changed (this updates `lastmod` and `dateModified`), resubmit via IndexNow.
- Each guide iteration = one PR: text change → audit → deploy → note the date in the PR.

## 7. Programmatic expansion ideas

The templates already support families driven by data; each new family must keep **one page =
one intent** and enough unique content to be useful (≥ 300 words of non-boilerplate copy, real
exercises, real numbers from the engine — never filler):

- **Equipment × goal** (`/workouts/dumbbells/fat-loss/`): generated sample workouts from the
  engine's `prescribeWorkout` for a level-2 profile, with duration and points; links to the
  matching course.
- **Duration** (`/workouts/20-minutes/`): all workouts under N minutes across courses.
- **Muscle / pattern pages** (`/exercises/pattern/hinge/`): the current anchors as their own hubs
  once each group has ≥ 6 exercises and an intro worth reading.
- **Benchmarks** (`/benchmarks/burpees-60s/`): what the test measures, reference ranges from
  `docs/TRAINING_SCIENCE.md`, how the app uses the result.
- **Comparison guides** (dumbbells vs kettlebell for home) for commercial intent.

Before adding a family: add it to the page registry (`pages.ts`) so it enters the sitemap and the
audit, give it an OG job in `og.mjs`, and extend `keywords.json` with the intents it serves.
