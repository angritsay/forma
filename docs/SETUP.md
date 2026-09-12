# Forma — setup runbook

Everything the owner has to provision by hand, in the order it should be done. The code
integrates with the real services described here; nothing is mocked. Expect about an hour for a
first full setup.

Legend: **Dashboard** = the Supabase web console for your project; **repo** = this repository.

Want to see the product before provisioning anything? Build the site, open `/app/` and press
**Открыть демо / Open the demo** — every screen works on browser-local data. See §10.

---

## 0. Fill-in checklist

Values only the owner knows. The site builds without them, but the placeholders below are
visible to customers until replaced.

| What                             | Where                                            | Notes                                                                      |
| -------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Contact email, Telegram, socials | `content/site/brand.ts`                          | `contactEmail`, `telegram`, `instagram`, `youtube`, `twitter`              |
| Coach name, bio, credentials     | `content/site/coach.ts`                          | Leave `credentials` empty rather than inventing any                        |
| Support links                    | `content/site/links.ts`                          | `supportTelegram`, `supportEmail` (used when a course has no `paymentUrl`) |
| Prices                           | `content/courses/<course>.ts` → `price`          | `{ rub, usd }` per course                                                  |
| Payment links                    | `content/courses/<course>.ts` → `paymentUrl`     | `{ ru, en }`, optional; see §7                                             |
| Intro / exercise videos          | `content/courses/*.ts`, `content/exercises/*.ts` | `storage:videos/…` refs; see §5                                            |
| Supabase URL + anon key          | `.env` (local) and GitHub repo variables         | §6                                                                         |
| Site URL + base path             | `.env` and GitHub repo variables                 | §6                                                                         |
| Coach admin email                | `public.admins` table                            | §4                                                                         |
| Email sender (SMTP)              | Dashboard → Project Settings → Authentication    | §3                                                                         |
| Analytics / verification ids     | `.env` / repo variables (`PUBLIC_*`)             | Optional; rendered only when set                                           |
| IndexNow key                     | GitHub repo secret `INDEXNOW_KEY`                | Optional; see docs/SEO.md                                                  |

---

## 1. Create the Supabase project

1. Sign in at supabase.com → **New project**. Pick the region closest to your customers
   (Frankfurt for RU/EU audiences works well), a strong database password (store it in a password
   manager; you rarely need it) and the free tier — it is enough to start.
2. Wait for provisioning (1–2 min).
3. **Project Settings → API** (or **API Keys**): copy
   - **Project URL** → `PUBLIC_SUPABASE_URL` (looks like `https://abcdefghijkl.supabase.co`)
   - **anon / public key** → `PUBLIC_SUPABASE_ANON_KEY` (the long `eyJ…` JWT, or a
     `sb_publishable_…` key on newer projects — both work with the pinned supabase-js).
   - Never copy the **service_role** / `sb_secret_…` key anywhere near the repo. The frontend is
     static and public; only the anon key is allowed in it.

---

## 2. Run the migrations

The schema lives in `supabase/migrations/` and is idempotent: re-running a file is safe.

### Option A — two steps, no tooling (start here)

`supabase/setup-all.sql` is every migration below concatenated in order by `npm run db:bundle`, so
there is one thing to paste instead of ten, and no way to run them out of order.

1. Open [`supabase/setup-all.sql`](../supabase/setup-all.sql). **Edit the admin block near the
   top** — those addresses are the people who can open the admin panel. A line left as
   `CHANGE-ME-…` is ignored, so filling in one and leaving the other alone is fine; fill in
   neither and the script stops on its first statement, having changed nothing. That is
   deliberate: an admins table holding only an address nobody can sign in with locks you out of
   your own admin panel, and it is a slow thing to discover afterwards.

   Anyone already in the table stays — the insert ignores addresses that are there already, so
   listing one twice is harmless. To see who is already an admin:
   `select email from public.admins order by email;`

2. Dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**. It ends with
   "Success. No rows returned".
3. Optional, and the reason the five existing courses become editable: the files in
   [`supabase/course-import/`](../supabase/course-import/), one per course. Paste and run them
   **in order** — a course's days reference its course row. Skip them and the course builder
   still works, it is just empty.

   They are `0009_course_import.sql` cut one course per file by `node scripts/db/split-import.mjs`,
   because the whole thing is 660 KB — too big for a browser text area, and importing a file is
   more ceremony than pasting five. Running the single migration instead (or letting the CLI apply
   it) loads exactly the same rows; `scripts/db/verify-bundle.sh` checks that the two agree.

Both steps are safe to re-run, and re-running is how an existing project is upgraded.

### Option B — file by file

Dashboard → **SQL Editor** → **New query**, paste each file in this order and click **Run**:

1. `supabase/migrations/0001_init.sql` — extensions, tables, triggers, RLS policies, grants
2. `supabase/migrations/0002_functions.sql` — `create_order`, `my_entitlements`,
   admin RPCs, `get_leaderboard`, `get_my_totals`
3. `supabase/migrations/0003_storage.sql` — private `videos` bucket and its policies
4. `supabase/migrations/0004_content_seed.sql` — **required**: the course and workout
   catalogue the backend enforces (see §2.1)
5. `supabase/migrations/0005_subscriptions.sql` — subscription plans, intents and activation
6. `supabase/migrations/0006_custom_workouts.sql` — the `exercises` library, the coach-built
   `custom_workouts` and the `assigned_workouts` that grant them to an email
7. `supabase/migrations/0007_exercise_seed.sql` — generated: the exercise library, from
   `content/exercises` (see §2.1)
8. `supabase/migrations/0008_course_builder.sql` — `admin_courses` and `admin_course_days`,
   the public `images` bucket, and `admin_publish_course()` (see §2.2)
9. `supabase/migrations/0009_course_import.sql` — generated: the five courses written as files,
   as rows the admin panel can edit (see §2.3). Optional, and safe to skip.
10. `supabase/migrations/0010_public_course_pages.sql` — lets the static site read a published
    course so it can have a landing page (see §2.4)
11. `supabase/migrations/0011_marathon.sql` — the marathon format: daily tasks, proof, teams,
    the private `proofs` bucket and the weekly board (see §2.5)
12. `supabase/seed.sql` — nothing runs by default; open it, uncomment the `insert into
public.admins` line with the coach's email (see §4)

Each run must end with "Success. No rows returned". If a statement fails, fix the cause and
re-run the whole file — the `create … if not exists` / `drop policy if exists` guards make that
safe. Re-running the whole set in order is also how you upgrade an existing project: new
bounds are added as `not valid` constraints, so they apply to every new write without ever
failing on rows written earlier.

### Option C — Supabase CLI

```bash
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase login
supabase init              # once; creates supabase/config.toml (commit it or ignore it)
supabase link --project-ref <project-ref>   # the id from the Project URL
supabase db push           # applies supabase/migrations/*.sql in filename order
```

`seed.sql` is intentionally not applied by `db push`; run it in the SQL editor.
`0004_content_seed.sql` **is** applied by `db push` (it is a normal migration).

### 2.1 The generated catalogue (`0004_content_seed.sql`)

The backend has to know which courses exist and how many points each workout may be worth —
otherwise a modified client could order a course that does not exist or claim any number of
points. Those two tables (`public.courses`, `public.workouts`) are generated from
`content/courses/*.ts`:

```bash
node scripts/content/gen-seed.mjs           # rewrites supabase/migrations/0004_content_seed.sql
node scripts/content/gen-seed.mjs --check   # CI-style check that the file matches the content
```

**Re-run it and re-apply the migration whenever you add or rename a course or a workout, or
change a workout's `basePoints`.** Until you do: a new course id is rejected by the order form
(`invalid_course`), and a new workout id still records sessions but caps their points at the
lowest value the content model allows.

### 2.2 Courses built in the admin panel (`0008_course_builder.sql`)

A course does not have to be a file. `admin_courses` + `admin_course_days` hold courses the coach
composes in the admin panel: the days in order, each one pointing at a `custom_workouts` row from
the workout library, so a workout is built once and reused across days and courses.

Two things to know:

- **Publishing is what makes a course real.** A draft is visible only to admins.
  `admin_publish_course(id)` validates it (at least four days, every training day carrying a
  workout with at least one section) and then writes the rows the rest of the schema keys off:
  `public.courses` (the id allowlist) and `public.workouts` (the points ceilings). Those two tables
  have no write policy for anyone — this security-definer function is the only way in besides a
  migration, which is why §2.1 still applies to the courses that live in content files.
- **`slug_id` is frozen once published.** It is the id written into every purchase, session and
  storage path, so renaming it would orphan that history. The table refuses the update.

`admin_unpublish_course(id)` takes a course off the catalogue but leaves both generated rows in
place, so people who already bought it keep their entitlement and their scoring.

### 2.3 The compiled courses, as editable rows (`0009_course_import.sql`)

The five courses live in `content/courses/*.ts`. To be able to open one in the admin panel and
change a set count or the order of two days, they also have to exist as `admin_courses` +
`admin_course_days` + `custom_workouts` rows:

```bash
node scripts/content/gen-course-import.mjs           # rewrites 0009_course_import.sql
node scripts/content/gen-course-import.mjs --check   # CI-style check that it matches the content
```

Three things worth knowing:

- **They arrive as drafts, and change nothing.** The app prefers compiled content on an id
  collision (`setCatalogueOverlay` in `src/content/catalogue.ts`), so even after publishing one from
  the admin panel the file keeps winning while it exists. Delete the course file to hand a course
  over to the database for good.
- **The conversion is lossless, and that is tested.** `src/lib/courses/draft.test.ts` takes every
  workout of every course into the builder's structure and back, and requires the result to equal
  what went in, block for block. That matters because 59 of the 147 blocks are EMOMs, AMRAPs,
  for-time pieces and Tabatas whose timing has nowhere to live in a plain circuit.
- **Workout ids get a course prefix.** Workout ids are unique _inside_ a course; `short_id` is
  unique globally, and eighteen workouts share a name across courses. So `w_s01_emom` of the start
  course becomes `start_w_s01_emom`. Progress is keyed on the node id, which is unchanged.

### 2.4 A published course's page on the website (`0010_public_course_pages.sql`)

Publishing a course makes it real in the app immediately. The website is different: the course
pages are static HTML, generated once at build time, so a database course has to be _read during
the build_.

- **What becomes public.** 0010 lets an anonymous reader — including a build with no session —
  see a published course's marketing fields and its days: name, description, who it is for, the
  outcomes, price, FAQ, and the week-by-week shape of the programme. That is what the course page
  already shows for the compiled courses.
- **What does not.** `custom_workouts` is untouched: the exercises, reps and timings stay readable
  only by an admin, by someone the workout was assigned to, or by someone who owns the course. A
  database course's page therefore has no sample-workout section — that part of the page is for
  the courses whose sample was chosen by hand in a content file.
- **When the page appears.** On the next build. `.github/workflows/deploy.yml` runs nightly at
  03:00 UTC for exactly this, and **Actions → Deploy site → Run workflow** does it now. The publish
  tab in the admin panel says so too.

The build needs `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` as repository variables (§6) —
without them it quietly builds the compiled courses only and says so in the log.

### 2.5 Marathons (`0011_marathon.sql`)

A course is a programme you walk at your own pace; a marathon is a game played on a calendar. Every
day the coach sets tasks in the admin, members send proof, and a weekly leaderboard decides who
wins. It shares nothing with the course builder, so it is its own set of tables.

- **Points are never stored.** `marathon_scores(marathon, week)` derives the board from submissions
  and adjustments on every call, so voiding a proof, re-pairing a team or fixing a task's points
  corrects the history instead of leaving a stale balance behind.
- **Proof is trusted on arrival, not approved.** A submission counts the moment it is written; the
  coach voids it afterwards with a reason. Approve-then-count would need someone to clear a queue
  every evening or the board is simply wrong.
- **Members are keyed on email**, like purchases, so the coach can add someone from his Telegram
  group before they have ever opened the app. Nothing in the app reads that table — members get
  names through `marathon_roster()`.
- **A day opens at a time.** Row-level security hides any task whose `day_index` is past today, so
  the plan cannot be read ahead of the morning it arrives.
- **`proofs` is a private bucket** (photo and video proof): the athlete who sent it and the coach,
  nobody else — not even a teammate, who sees only that the proof exists.

### Verifying the migrations locally

`supabase/tests/` runs the whole schema against a plain Postgres 16 — no Supabase needed. See the
header of `supabase/tests/00_shim.sql` for the exact commands; the short version is: create a
throwaway database, apply `00_shim.sql` and then every file in `supabase/migrations/` in order,
then run `10_smoke.sql`, `20_subscriptions.sql`, `30_course_builder.sql` and `40_marathon.sql`.
Each ends with a "PASSED" line. The test files are **not** idempotent — they insert fixtures — so
rebuild the database for each run.

### What the migrations create

| Object                                                              | Purpose                                                                       |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `profiles`                                                          | One row per auth user (trigger `on_auth_user_created`); own row read/write    |
| `current_email()`                                                   | The caller's **verified** email (auth.users, confirmed + not banned)          |
| `admins` + `is_admin()`                                             | Coach emails; gate for admin RPCs and video uploads                           |
| `purchases`                                                         | `email ↔ course_id`, status `pending / active / refunded` (admin-only read)   |
| `courses`, `workouts`                                               | Generated catalogue (§2.1): the id allowlist and the points ceilings          |
| `create_order()` + `order_throttle`                                 | Anonymous RPC used by the landing order form (validates, throttles, upserts)  |
| `my_entitlements`                                                   | View: active courses of the signed-in user (`course_id`, `activated_at`)      |
| `has_entitlement(course_id)`                                        | Does the caller own this course? (sessions, video access; admins own all)     |
| `admin_set_purchase_status()`, `admin_add_purchase()`               | Admin RPCs behind the `/app/#/admin` screen                                   |
| `user_course_state`, `workout_sessions`, `daily_logs`, `benchmarks` | Training data, own rows only                                                  |
| `workout_sessions_guard` trigger                                    | Server timestamps, date window, per-workout points ceiling, 4 sessions/day    |
| `steps_points()` + trigger                                          | Recomputes step points server-side so the leaderboard cannot be gamed         |
| `get_leaderboard()`                                                 | Top 100 + own row; never returns emails                                       |
| `get_my_totals()`                                                   | Points / workouts / minutes for the home screen                               |
| `exercises`                                                         | The exercise library in the database; seeded from content, extendable by hand |
| `custom_workouts`, `assigned_workouts`                              | Coach-built workouts and the emails they are granted to                       |
| `admin_courses`, `admin_course_days`                                | Courses composed in the admin panel (§2.2); days point at `custom_workouts`   |
| `admin_publish_course()`, `admin_unpublish_course()`                | The only non-migration writers of `courses` / `workouts` (§2.2)               |
| `images` bucket                                                     | Public: course covers, day pictures, exercise stills (`videos` stays private) |
| Storage bucket `videos` (private)                                   | Read requires an active purchase of the course in the path, or `shared/`      |
| `marathons`, `marathon_teams`, `marathon_members`                   | A marathon run, its pairs, and who plays (by email, like purchases) (§2.5)    |
| `marathon_tasks`, `marathon_submissions`, `marathon_adjustments`    | The daily plan, the proof sent against it, and the coach's manual ±points     |
| `marathon_scores()`, `marathon_my_points()`                         | The weekly board and one athlete's days; points are derived, never stored     |
| `my_marathons()`, `marathon_roster()`                               | What the app opens the format with; the roster returns names, never emails    |
| Storage bucket `proofs` (private)                                   | Photo and video proof: its author and the coach only, never a teammate        |

---

## 3. Auth settings (email one-time code)

The app signs in with a **6-digit code** sent by email — no passwords, no magic links.

### 3.1 Provider

Dashboard → **Authentication → Providers → Email**:

- **Enable Email provider**: on.
- **Confirm email**: off. The OTP itself proves ownership of the address; with double opt-in on,
  new users would receive a confirmation link instead of a code. If your dashboard version keeps
  it on, it still works as long as the _Confirm signup_ template also contains `{{ .Token }}`
  (step 3.2).
- **Secure email change**: on (default).
- **Email OTP length**: 6 (default). The app's code field is six digits.
- **Email OTP expiration**: `600` seconds (10 minutes). The email copy promises 10 minutes; keep
  them in sync if you change one.

**These settings are part of the security model.** Admin rights, course access and video access
are keyed to an email address, and the database resolves that address with
`public.current_email()`: it reads `auth.users` for the id inside the token and answers only for
a user whose `email_confirmed_at` is set and who is neither deleted nor banned. The `email`
claim inside the JWT is never trusted, so a token that merely _says_ it belongs to the coach
gets nothing. Two rules keep that true:

- **Email OTP is the only provider.** Do not enable a social / SAML / phone provider, password
  sign-in or anonymous sign-ins unless you have to — a provider that hands out an address the
  user has not proven is a way to become the coach. If you ever add one, turn **Confirm email**
  on at the same time.
- **Nobody signs in as the coach's address but the coach.** Rotating the admin address means
  editing `public.admins` (§4), not editing anything in Auth.

#### How long a sign-in lasts

Signing in should last months, not one launch. Two things decide it, and only one of them is in
this dashboard:

- **Dashboard → Authentication → Sessions.** Leave _Time-box user sessions_ and _Inactivity
  timeout_ **unset** (the default). Set either one and everybody is asked for an emailed code
  again that often — which is the whole experience this section exists to avoid. The access token
  expiring hourly is normal and invisible: the app refreshes it in the background.
- **Where the session is stored.** Supabase keeps it in `localStorage`, and a Telegram Mini App
  webview is not a browser tab — the client clears that storage whenever it likes, which on iOS is
  close enough to every launch. So inside Telegram the app mirrors the session into Telegram's own
  per-user **CloudStorage**, which survives the webview being cleared, the app being killed and a
  reinstall (`src/lib/auth/sessionStorage.ts`). Nothing to configure; it needs Telegram 6.9+ and
  falls back to `localStorage` on the open web and in older clients.

### 3.2 Email template — this step is mandatory, and SMTP now comes first

**Supabase no longer lets a project edit its email templates until custom SMTP is configured.**
The dashboard shows "Set up custom SMTP to edit templates" and the body is read-only. Observed on
a free project in September 2026; the runbook previously assumed the templates were editable from
the start and treated SMTP as a pre-launch task. It is not — it is a prerequisite for signing in
at all, so **do §3.5 before this step**.

Why it blocks everything: the stock template sends a _link_, and the app asks for a six-digit
code. Left as shipped, a new user receives an email with nothing they can type into the sign-in
screen.

Supabase sends the one-time code through the **Magic Link** template (and the **Confirm signup**
template for brand-new users when confirmations are enabled). Out of the box those templates
contain a link, not a code, so the user would never see the code.

Dashboard → **Authentication → Email Templates**:

1. Open **Magic Link**.
2. Subject: `Код для входа в Forma`
   (do not put `{{ .Token }}` in the subject — it ends up in notification previews and logs).
3. Replace the body with the contents of `supabase/templates/otp.html`: a dark, table-based
   Russian email with the code in large type and a 10-minute note.
   The template uses `{{ .Token }}`, `{{ .Email }}` and `{{ .SiteURL }}`.
4. Repeat for **Confirm signup** with the same subject and body.
5. There is no separate plain-text field in the dashboard; `supabase/templates/otp.txt` is the
   fallback to use if you send through a provider that asks for a text part.
6. Send yourself a code from the app's sign-in screen and check that the email shows six digits.

### 3.3 URL configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: the production origin — `https://forma-app.co`. It only feeds `{{ .SiteURL }}` in
  the email footer; the app does not use redirects. Keep it in step with the `SITE_URL`
  repository variable, or the sign-in email points at the previous address.
- **Redirect URLs**: nothing to add. The OTP flow never redirects.

### 3.4 Rate limits

Dashboard → **Authentication → Rate Limits**:

- The built-in email sender allows only a handful of emails per hour and is meant for
  development. **Set up custom SMTP before launch** (3.5); with custom SMTP raise "emails per
  hour" to something like 100–300.
- Keep "OTP requests per 5 minutes" and "token verifications" at their defaults; the app enforces
  a 60-second resend timer on top.

### 3.5 Custom SMTP — required before 3.2, not just before launch

Dashboard → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP.

**Without a domain of your own**, use a mailbox you already have. Gmail: turn on 2FA, create an
app password at myaccount.google.com/apppasswords, then `smtp.gmail.com:465` with that password
and your address as both username and sender. Roughly 500 emails a day, which is ample to launch
on, and it costs nothing. Swapping to a provider later is a five-minute settings change.

**With a domain** (worth having anyway — it also moves the site off github.io):

| Provider                | Good for                                  | Notes                                                                 |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Resend                  | Simplest setup, EU region                 | Verify your domain (SPF + DKIM) in Resend, then use `smtp.resend.com` |
| Postmark                | Best transactional inboxing               | Use the "Transactional" message stream                                |
| Yandex 360 for Business | RU audience, mail.ru / yandex.ru inboxing | Use an app password, `smtp.yandex.ru:465`                             |
| Mail.ru for business    | RU audience                               | `smtp.mail.ru:465`, app password                                      |

Set **Sender email** to an address on your own domain (e.g. `hello@forma-app.co`) and
**Sender name** to `Forma`. Add SPF, DKIM and DMARC records at your DNS provider; without them
Gmail and Mail.ru will junk the codes.

---

## 4. Make the coach an admin

Admin access is granted by email, not by a role in the auth system.

Dashboard → **SQL Editor**:

```sql
insert into public.admins (email) values ('coach@example.com')
on conflict (email) do nothing;
```

Use the exact address the coach will sign in with (case does not matter). From then on, after
signing in to the app, the **Profile** screen shows an **Admin** link, and `/app/#/admin` lists
purchases with activate / refund / add actions. To remove an admin, `delete from public.admins
where email = '…'`.

---

## 5. Videos (Storage)

Videos are optional — every exercise has an animated figure. When you add videos:

### 5.1 Bucket

`0003_storage.sql` already created the private bucket **videos**. Optionally, in Dashboard →
**Storage → videos → Configuration**, set a file size limit (e.g. 200 MB) and allowed MIME types
(`video/mp4`, `video/webm`).

### 5.2 Naming convention

```
videos/<course_id>/<exercise_id>.<lang>.mp4     course-specific, needs an active purchase
videos/shared/<exercise_id>.<lang>.mp4          available to every signed-in user
```

Examples: `videos/start/air_squat.ru.mp4`, `videos/shared/air_squat.en.mp4`.

The first path segment is the gate: a signed-in user can read `start/…` only if
`purchases` has an active row for their email and `course_id = 'start'`. Admins can read and
upload everything. Anonymous users can read nothing.

### 5.3 Upload

Dashboard → **Storage → videos** → create the folder → **Upload**. (Uploads through the app are
also allowed for admins, but there is no UI for it yet.)

### 5.4 Reference from content

In the exercise or course file:

```ts
video: { ru: 'storage:videos/start/air_squat.ru.mp4', en: 'storage:videos/shared/air_squat.en.mp4' }
introVideo: { ru: 'storage:videos/start/intro.ru.mp4' }
```

At runtime `resolveMediaUrl()` (`src/lib/api/storage.ts`) turns `storage:<bucket>/<path>` into
a signed URL valid for one hour. Plain `https://…` URLs (YouTube, a CDN) pass through unchanged.

---

## 6. Environment variables

All variables are read at build time. `PUBLIC_*` values are embedded in the static bundle.

| Variable                                                                                               | Local `.env` | GitHub Pages      | Value                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------ | ----------------- | ------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                                                                                  | yes          | repo **variable** | Project URL from §1                                           |
| `PUBLIC_SUPABASE_ANON_KEY`                                                                             | yes          | repo **variable** | anon / publishable key from §1                                |
| `SITE_URL`                                                                                             | yes          | repo **variable** | `https://forma-app.co` (or `https://<user>.github.io/<repo>`) |
| `BASE_PATH`                                                                                            | yes          | repo **variable** | `/<repo>/` for a project page, `/` for a custom domain        |
| `INDEXNOW_KEY`                                                                                         | optional     | repo **secret**   | 8–128 hex/alphanumeric chars; see docs/SEO.md                 |
| `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`, `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION` | optional     | repo variables    | Rendered only when set                                        |

Local: `cp .env.example .env` and fill in the values (`.env` is git-ignored).

GitHub: repository → **Settings → Secrets and variables → Actions** → **Variables** tab for the
`PUBLIC_*`, `SITE_URL`, `BASE_PATH` values and **Secrets** tab for `INDEXNOW_KEY`. Then
**Settings → Pages → Source: GitHub Actions**. The deploy workflow reads these names verbatim.

When the backend variables are missing, the app renders a localized "backend not configured"
screen instead of crashing (`isConfigured()` in `src/lib/api/client.ts`).

---

## 7. Payments and manual activation

There is no payment processor in the code; Forma records the intent and the coach confirms
payment. This keeps the site static and works with any provider (YooKassa, Prodamus, Stripe
Payment Links, Tinkoff, a bank transfer…).

### 7.1 Per-course payment link

In `content/courses/<course>.ts`:

```ts
price: { rub: 2990, usd: 29 },
paymentUrl: { ru: 'https://…/pay/start-ru', en: 'https://…/pay/start-en' },
```

The link must be an absolute **`https://`** URL: the content schema rejects anything else at
build time, and the order form refuses to navigate to it at runtime (the customer's email is
appended to the URL, so it must not leak over plain HTTP or point at a `javascript:` target).

The landing order form:

1. Validates the email, calls `create_order(email, course_id, locale, source)` → a `pending`
   purchase (idempotent per email + course; an already `active` course stays active).
2. If `paymentUrl` for the current locale exists, redirects there; otherwise shows the support
   contact from `content/site/links.ts` with instructions to pay and wait for activation.

Configure your payment page to ask for the **same email** the customer typed; that is the key
that links the payment to the order.

### 7.2 Activating

When money arrives:

1. Sign in to the app with the coach's admin email → **Profile → Admin** (`/app/#/admin`).
2. Search the email or filter **Pending**, then press **Activate**. This calls
   `admin_set_purchase_status(id, 'active')` and stamps `activated_at`.
3. The customer signs in with the same email (or refreshes the app): the course becomes
   available immediately through the `my_entitlements` view.

**Refund**: same screen → **Refund**; access is revoked at once.
**Gift / bank transfer without an order**: **Add purchase** → email + course (+ note) →
`admin_add_purchase()` creates an active row.

### 7.3 One-to-one sessions with the coach

`content/site/booking.ts` describes the bookable hour (length, price, what it covers). It is
offered on Home, in Profile and on the coach card of the landing, and it is the only product that
asks for the coach's time — everything else runs without him.

```ts
paymentUrl: { ru: 'https://…/pay/session-ru', en: 'https://…/pay/session-en' },
scheduleUrl: 'https://calendar.app.google/…', // where the client picks a slot after paying
```

Same rule as courses: `https://` only, the signed-in email is appended as `?email=`. Until
`paymentUrl` is set the screen shows **Message the coach** (Telegram from `links.ts`, else mail)
instead of a payment button, so the offer is live from day one. A Google Calendar appointment
schedule is free and enough for `scheduleUrl`; set `enabled: false` to hide the offer everywhere.

### 7.4 Subscription: two plans, one webhook

`content/site/plans.ts` holds the two plans (monthly 1 990 ₽ / annual 9 990 ₽ by default) and
their payment links, one per locale, pointing at the seller's Prodamus subscription products:

```ts
paymentUrl: { ru: 'https://<shop>.payform.ru/?subscription=<id>', en: '…' },
```

The `/subscribe/` page records the intent (`create_subscription_order`) and hands the visitor to
that link with `?email=`. Access opens when the payment is confirmed — either by the coach in
**Profile → Admin → Subscriptions** (activate / extend / cancel; "Add subscription" grants a
period by hand) or automatically by the webhook below. A subscription lists every course through
`my_entitlements` while it is live; cancelling stops renewals and keeps the paid period.

**Webhook (`supabase/functions/prodamus-webhook`)** — activates and extends subscriptions from
Prodamus notifications, so nobody has to press anything:

1. `supabase functions deploy prodamus-webhook --no-verify-jwt`
2. `supabase secrets set WEBHOOK_TOKEN=<long random string> PRODAMUS_SECRET=<secret key from the
Prodamus form settings>` — the token guards the URL, the secret verifies the `Sign` header.
   Without `PRODAMUS_SECRET` the function still works on the token alone and logs a warning.
3. In Prodamus, set the notification URL to
   `https://<project-ref>.functions.supabase.co/prodamus-webhook?token=<WEBHOOK_TOKEN>`.
4. Make one real payment and read the function logs: `ok: monthly for …` means the signature
   matched and `apply_subscription_payment()` ran. A `signature mismatch` line means the
   preparation Prodamus uses differs from `verify.ts` — nothing was activated; compare the
   posted fields with the code and adjust once, or run on the token alone meanwhile.

The plan is recognised by the amount (`PLAN_MONTHLY_RUB` / `PLAN_ANNUAL_RUB` secrets override the
defaults), so keep the Prodamus prices equal to `plans.ts`. Any other amount — a course, a
session with the coach — is acknowledged and left to the manual flow. Notifications are
idempotent per order id: a retry never extends twice.

### 7.5 Automating course purchases later

---

## 7.6 Telegram Mini App

The app runs inside Telegram as a Mini App with no separate build: the same `/app/` page detects
Telegram and adapts. All that is needed on Telegram's side is a bot whose menu button opens it.

**Create the bot** (in Telegram, with @BotFather):

1. `/newbot` → a name, then a username ending in `bot` (ours: `@forma_training_bot`).
2. `/mybots` → the bot → **Bot Settings → Menu Button → Configure menu button**. BotFather asks
   two questions, answer them as two separate messages: the URL
   (`https://<user>.github.io/<repo>/app/`), then the button text.
3. Optional but worth it: `/setuserpic`, `/setdescription`, `/setabouttext`.

Setting the menu button again overwrites it; there is nothing to undo.

**A direct link** is worth more than the menu button: it is what goes in an Instagram bio, in the
Telegram channel and in any post. `/newapp` → the bot → title, short description, a 640×360
image (`npm run telegram:icon` renders one from the brand), `/empty` for the demo GIF, then the
same URL and a short name. The result is `t.me/<bot>/<short name>`, which opens the app in one tap.

A bot with no program behind it does not answer `/start` — that silence is expected, and the menu
button and the direct link work regardless. Replying to `/start` with a greeting and a launch
button needs a webhook (an Edge Function holding the bot token); not built yet.

**What the app does inside Telegram** (`src/lib/telegram/webapp.ts`, no-ops everywhere else):

- Telegram's SDK is loaded **only** when Telegram opened the page — a plain web visitor makes no
  request to telegram.org. The inline bootstrap in `src/pages/app/index.astro` must stay in the
  head and run before the React island: Telegram passes its launch data in the URL hash, which
  HashRouter rewrites on mount, so the app holds its first render until the SDK has read it.
- Full height, Forma's own header and background colour, and vertical swipes disabled — a downward
  swipe during a workout would otherwise close the app mid-set.
- Telegram's back button follows the route (hidden on the four tabs, where its gesture should close
  the app), a confirmation before closing during a workout, and a haptic when one is finished.
- Safe areas come from Telegram rather than the webview: the SDK's insets are published as
  `--tg-safe-*` and every screen reads `--safe-*` (see `src/styles/global.css`).
- Links that leave the app — the site, a payment page — are opened **outside** Telegram, and
  `t.me` links inside it. A payment page inside a Mini App webview cannot reach the customer's
  bank app or saved cards.

**Selling inside Telegram.** Telegram's rules push digital goods sold _inside_ a Mini App towards
Telegram Stars, particularly on iOS. Forma therefore sells on the website: the app's buttons open
the course or subscription page in the person's own browser. Check the current rules before
selling in-app.

**Signing in.** Email one-time codes work inside Telegram, but the person has to leave for their
mail app and come back. One-tap sign-in from Telegram's own identity needs an Edge Function that
verifies `initData` server-side and mints a Supabase session; not built yet, and worth doing only
once Telegram proves to be a real channel.

---

## 8. Security notes

- **The anon key is public by design.** It only identifies the project; every table has Row
  Level Security and the policies in `0001_init.sql` decide what a request may do. The
  `service_role` key must never appear in the repo, in `.env.example`, in CI logs or in the
  browser.
- **What anonymous requests can do**: call `create_order()` — nothing else. They cannot read
  `purchases`, profiles or videos. That one RPC is guarded four ways: the course id must exist
  in `public.courses`, an email may have at most 10 pending orders (serialized by an advisory
  lock, so it cannot be raced), one IP may place 30 orders per hour (`public.order_throttle`;
  requests without a forwarded IP share a 200/hour bucket), and an **active** purchase is never
  modified — knowing a customer's address does not let anyone change their order.
- **What signed-in users can do**: read/write their own rows, see the courses they own through
  `my_entitlements`, read the leaderboard (no emails in it), sign video URLs for courses they
  own. They cannot read `public.purchases` itself, so the coach's `note` and `source` stay
  internal.
- **Identity is the verified email**, resolved by `current_email()` from `auth.users`, never
  from the JWT claim — see §3.1 for the settings that keep that guarantee.
- **Only the listed RPCs are callable.** `0001_init.sql` turns off Supabase's default
  "every new function is executable by anon and authenticated" grant, and each function is then
  granted to exactly the roles it needs. If you add your own function in schema `public`, it is
  not reachable from the API until you `grant execute on function … to authenticated;`.
- **Admins** are just emails in `public.admins`; `is_admin()` is evaluated on the server for
  every admin RPC and storage policy, so a modified client cannot escalate.
- **Points integrity**: step points are recomputed by a trigger. Workout points are computed by
  the client but clamped by `workout_sessions_guard` to that workout's own ceiling
  (`base_points` from §2.1 × difficulty × repeat × the maximum streak bonus), and hard-capped at
  375 by a CHECK. The same trigger stamps `started_at` / `completed_at` from the server clock,
  refuses a `local_date` more than a day from the server date, and allows at most 4 completed
  sessions per day; sessions can only be logged for a course the athlete owns.
- **Step logs** can only be written for the last 7 days and up to tomorrow, so the weekly board
  cannot be backfilled.
- **Upgrading an old project**: the bounds are added as `not valid` constraints, so applying the
  migrations never fails on rows written earlier — but those rows are also never re-checked.
  After cleaning any legacy data you can promote a constraint with
  `alter table public.<table> validate constraint <name>;` (list them with
  `select conrelid::regclass, conname from pg_constraint where not convalidated;`).
- **Rotating keys**: Dashboard → Project Settings → API (or API Keys) → _Generate new anon key_ /
  create a new publishable key → update `.env` and the GitHub repo variable → redeploy. Old
  static builds stop working until redeployed, which is the point.
- **Deleting a user**: Dashboard → Authentication → Users → delete. All rows cascade
  (`on delete cascade` from `auth.users`). Purchases are keyed by email and stay, so a returning
  customer keeps their access.

---

## 9. Troubleshooting

**The code email never arrives**

- Check spam. Then Dashboard → **Authentication → Logs** (or **Logs → Auth**) for the send
  attempt and any SMTP error.
- Built-in sender: you have most likely hit the hourly limit (§3.4). Set up custom SMTP.
- Custom SMTP: verify SPF/DKIM at your DNS; try a different recipient domain.
- Rate limited: the app shows "too many requests, wait a minute"; that is Supabase's per-email
  throttle, not a bug.

**The email arrives but contains a link instead of a code**

The template still has the default body. Redo §3.2 for **Magic Link** _and_ **Confirm signup**.

**"Token has expired or is invalid" (`otp_expired`)**

The user typed an old code, or the OTP expiry (§3.1) is shorter than the delivery delay. Ask
them to press _Resend_; consider raising the expiry to 900 s if your SMTP is slow.

**App shows "backend not configured"**

`PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are missing or the URL does not start with
`https://`. Locally: check `.env` and restart the build. On GitHub Pages: check the repo
**Variables** (not Secrets) and re-run the deploy workflow.

**"Invalid API key" / 401 on every request**

Wrong project URL for that key (two projects mixed up), or the key was rotated. Copy both again
from the same project.

**"Database error saving new user" on sign-in**

The `on_auth_user_created` trigger failed — usually `0001_init.sql` was not applied completely.
Re-run it; then Dashboard → Authentication → Users → delete the half-created user and try
again.

**CORS errors in the browser console**

Supabase's REST, Auth and Storage endpoints accept any origin with the anon key; no CORS
configuration exists or is needed. A "CORS" message next to a failed request usually means the
request itself failed (wrong URL, network, ad blocker) — open the request in the Network tab.

**GitHub Pages: page loads but assets / app 404**

`BASE_PATH` must equal `/<repository-name>/` (with both slashes) and `SITE_URL` must be
`https://<user>.github.io/<repository-name>` — no trailing slash. For a custom domain set
`BASE_PATH=/` and `SITE_URL=https://your-domain`. Every link in the code goes through
`withBase()`; if a link is missing the prefix, that is a bug in the page, not in the config.

**Video does not play / "Object not found"**

The path in content must match the object key exactly (case-sensitive), the first folder must
be a course id the user has an active purchase for (or `shared`), and the user must be signed
in. Test as an admin first: admins can read everything in the bucket.

**The order form says the course is unknown (`invalid_course`)**

`0004_content_seed.sql` was not applied, or the course id changed in content and the file was
not regenerated. Run `node scripts/content/gen-seed.mjs` and apply the migration again (§2.1).

**The order form says there are too many orders (`too_many_orders`)**

The per-IP throttle (30 per hour) fired — usually a test loop or a whole office behind one
address. It clears by itself; to clear it now, `delete from public.order_throttle where bucket
= '<ip>';`.

**A workout will not save**

`42501` means the athlete has no active purchase for that course (activate it in §7.2, or the
purchase was refunded). `invalid_local_date` means the device clock is more than a day away
from real time. `too_many_sessions_today` is the 4-completed-sessions-per-day cap.

**Points look lower than the app showed**

`workout_sessions_guard` clamped them to that workout's ceiling. If the workout is newer than
the applied catalogue it is capped hard — regenerate the seed (§2.1).

**Leaderboard is empty**

Only sessions with `completed_at` set and step logs count, and the weekly board resets on Monday
00:00 UTC. Also `get_leaderboard` requires a signed-in user.

**Admin link does not show**

The signed-in email is not in `public.admins`, or differs from the one inserted (check for a
typo; case is ignored). Sign out and back in after inserting. If it still does not show, the
account itself is not usable as an identity — check
`select email, email_confirmed_at, banned_until, deleted_at from auth.users where email = '…';`
(§3.1): `is_admin()` only answers for a confirmed, live, unbanned user.

---

## 10. Demo mode (try the app before provisioning anything)

Demo mode replaces the Supabase backend with a **browser-local** one: the same API surface, the
same row shapes, the same errors, backed by `localStorage` instead of the network. Every screen
and every flow works — sign-in, onboarding, the player, stats, the leaderboard, the admin
screen — so the product can be walked through end to end before a project exists.

It is a testing sandbox, never a fallback. A persistent strip at the bottom of the app says so on
every screen, and nothing it stores ever leaves the browser or reaches the marketing site.

### 10.1 Turning it on

Two ways, and only two:

- **The button.** With `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` unset, `/app/` shows the
  "backend is not configured" screen. It now also offers **Открыть демо / Open the demo**, which
  sets a flag in `localStorage` (`forma.demo`) and boots the app. Only that visitor, only that
  browser.
- **The build flag.** `PUBLIC_DEMO_MODE=true` at build time forces demo mode for everyone who
  opens that build:

  ```bash
  SITE_URL=https://example.com BASE_PATH=/ PUBLIC_DEMO_MODE=true npm run build
  ```

  Use it for a throwaway preview deploy — never for the real site.

**When Supabase is configured and `PUBLIC_DEMO_MODE` is not `true`, demo mode is inert.** The
visitor flag is not even read, and the demo implementation is a lazily-imported chunk that is
never fetched, so a production build behaves exactly as it did before this feature existed.

### 10.2 Signing in

There is no email. Type any syntactically valid address, press "Send code", and the code appears
on screen in a marked demo hint (`Демо: код 123456` / `Demo: code is 123456`). A wrong code is
rejected exactly like a real one, so the error state stays testable. Signing out and back in with
the same address restores that account; a different address starts a fresh one.

### 10.3 What a new demo account gets

Invented data, generated in `src/lib/api/demo/store.ts` and never shown anywhere else:

| Seeded               | Value                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Entitlements         | `start` and `engine` active; `dumbbells`, `kettlebell`, `athlete` locked                             |
| Training profile     | none — the onboarding wizard is part of the walkthrough                                              |
| Workout history      | empty — the first workout really is the first                                                        |
| Steps (`daily_logs`) | the previous 14 days, mixing days above and below the 7 000 goal (streak, charts, calendar)          |
| Benchmarks           | empty; the self-tests and test nodes fill them                                                       |
| Leaderboard          | 12 invented athletes with plausible points, plus your own row computed from your real local sessions |
| Purchases            | four `@example.com` orders (pending / active / refunded) so the admin flows have something to act on |
| Admin                | the demo account is always the coach, so `/admin` is reachable                                       |

The landing order form also works: in demo mode it records the order locally and shows the
success state (no payment redirect), and the order then appears in the admin list where you can
activate it and watch the course unlock.

Two things are deliberately missing: private-bucket videos (a `storage:` reference resolves to
nothing and the player falls back to the built-in animations), and any kind of email.

### 10.4 Resetting and leaving

Profile → **Демо-режим / Demo mode**:

- **Сбросить демо-данные / Reset demo data** — deletes every `forma.demo.*` key and reloads, so
  the next sign-in seeds a fresh account.
- **Выйти из демо / Leave demo mode** — clears the flag and returns to the setup screen. Only
  offered when demo mode came from the button; a `PUBLIC_DEMO_MODE=true` build cannot be left
  from the UI.

Clearing site data in the browser has the same effect as a reset.

### 10.5 Before going to production

- `PUBLIC_DEMO_MODE` must be unset (or anything other than `true`) in the deploy workflow and in
  every repository variable.
- Configure `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (§6). With those set, the flag
  absent, demo mode cannot switch itself on.
- A visitor who tried the demo earlier keeps a stale `forma.demo` key in their browser; it is
  ignored once the backend is configured.
