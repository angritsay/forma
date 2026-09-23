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

| What                               | Where                                            | Notes                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contact email, Telegram, socials   | `content/site/brand.ts`                          | `contactEmail`, `telegram`, `instagram`, `youtube`, `twitter`                                                                                                                                                                                                                              |
| Coach name, bio, credentials       | `content/site/coach.ts`                          | Leave `credentials` empty rather than inventing any                                                                                                                                                                                                                                        |
| Support links                      | `content/site/links.ts`                          | `supportTelegram`, `supportEmail` (used when a course has no `paymentUrl`)                                                                                                                                                                                                                 |
| Prices                             | `content/courses/<course>.ts` → `price`          | `{ rub, usd }` per course                                                                                                                                                                                                                                                                  |
| Payment links                      | `content/courses/<course>.ts` → `paymentUrl`     | `{ ru, en }`, optional; see §7                                                                                                                                                                                                                                                             |
| Paying from outside Russia         | `content/site/payments.ts` + `deploy-lava`       | **Outstanding.** A lava.top product link and id per course and per plan, then the secrets and the button. Until it is done, a non-Russian "buy" button leads to the support address. §7.9                                                                                                  |
| Intro / exercise videos            | `content/courses/*.ts`, `content/exercises/*.ts` | `storage:videos/…` refs; see §5                                                                                                                                                                                                                                                            |
| Sign-in montage                    | Storage: bucket `images`, path `site/auth.mp4`   | The reference in `content/site/media.ts` already points here. Until the file is uploaded to that exact path the sign-in screen shows the poster still — which is a working screen, not a broken one. §5                                                                                    |
| Sign-in email templates            | **Actions → Supabase apply → `email-templates`** | One button: it PATCHes the Management API with `supabase/templates/otp.html` into **both** Magic Link and Confirm signup, subject included. This row used to say the dashboard was the only way and that only the owner could do it; both stopped being true when the task was added. §3.2 |
| SPF, DKIM and DMARC for the domain | DNS host for `forma-app.co`                      | **Outstanding.** Without them the codes are filtered. §3.5.1 has the records                                                                                                                                                                                                               |
| Supabase URL + anon key            | `.env` (local) and GitHub repo variables         | §6                                                                                                                                                                                                                                                                                         |
| Site URL + base path               | `.env` and GitHub repo variables                 | §6                                                                                                                                                                                                                                                                                         |
| Coach admin email                  | `public.admins` table                            | §4                                                                                                                                                                                                                                                                                         |
| The bot's answer to `/start`       | **Actions → Supabase apply → `deploy-bot`**      | One button. It deploys the function, sets its secrets and calls `setWebhook`, then reads the hook back and prints what Telegram believes. Needs the repository secret `TELEGRAM_BOT_TOKEN`. §7.6                                                                                           |
| Payments reaching the app          | **Actions → Supabase apply → `deploy-payments`** | **Outstanding.** Two secrets in Supabase (`WEBHOOK_TOKEN`, `PRODAMUS_SECRET`), then this button, then the notification URL in Prodamus. Until all three are done the function refuses every notification and no payment activates anything. §7.4                                           |
| Email sender (SMTP)                | Dashboard → Project Settings → Authentication    | §3                                                                                                                                                                                                                                                                                         |
| Analytics / verification ids       | `.env` / repo variables (`PUBLIC_*`)             | Optional; rendered only when set                                                                                                                                                                                                                                                           |
| IndexNow key                       | GitHub repo secret `INDEXNOW_KEY`                | Optional; see docs/SEO.md                                                                                                                                                                                                                                                                  |

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

`supabase/setup-all.sql` is every migration in `supabase/migrations/` except `0009_course_import.sql`,
concatenated in filename order by `npm run db:bundle`, so there is one thing to paste instead of
forty, and no way to run them out of order. The list is read from the directory, so a new migration
is in the bundle as soon as the bundle is regenerated; `scripts/db/bundle.test.mjs` fails when the
committed bundle is missing one.

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
   more ceremony than pasting five. Running the single migration instead loads exactly the same
   rows; `scripts/db/verify-bundle.sh` checks that the two agree.

   The import runs after the bundle, so the workouts it brings in miss one backfill the bundle
   made earlier: `0036` signs every existing workout as Sergey's. Run `setup-all.sql` once more
   after the import (it is safe to re-run) and they get the signature too.

Both steps are safe to re-run, and re-running is how an existing project is upgraded.

### Option B — file by file

Dashboard → **SQL Editor** → **New query**, paste each file of `supabase/migrations/` **in filename
order** and click **Run** — the same order the bundle uses and the same set, plus `0009`. From a
phone, Actions → Supabase apply → `migration` runs one file by name (§7.8).

What to know along the way:

- `0004_content_seed.sql` is **required**: the course and workout catalogue the backend enforces
  (§2.1). `0007_exercise_seed.sql` is generated the same way, from `content/exercises`.
- `0009_course_import.sql` is generated and **optional**: every course written as a file, as rows
  the admin panel can edit (§2.3). Safe to skip.
- `0012_step_proofs.sql` is **superseded by 0015**; run it anyway so the chain applies in order on
  a fresh project.
- `0015_drop_steps.sql` **removes steps from the product** (§2.6). ⚠️ It drops `daily_logs` and
  everything in it, and that cannot be undone.
- There is no `0021`, and there are **two `0027`s**: `0027_proof_review.sql`, then
  `0027_telegram_outbox.sql` (byte order of the names; neither depends on the other).
- `0030_reload_schema.sql` changes nothing; it tells PostgREST to re-read the schema, which is the
  cure for `PGRST205`.
- Finally `supabase/seed.sql` — nothing runs by default; open it, uncomment the `insert into
public.admins` line with the coach's email (see §4).

Each run must end with "Success. No rows returned". If a statement fails, fix the cause and
re-run the whole file — the `create … if not exists` / `drop policy if exists` guards make that
safe. Re-running the whole set in order is also how you upgrade an existing project: new
bounds are added as `not valid` constraints, so they apply to every new write without ever
failing on rows written earlier.

### Option C — Supabase CLI: not supported

`supabase db push` records each migration under its numeric prefix, and two files here share one
(`0027_proof_review.sql` and `0027_telegram_outbox.sql`). The CLI refuses the pair, or records one
and skips the other, depending on version — either way the schema it leaves is not the one the
tests check. Renaming either file now would make every project that already applied it think it
has a new migration to run. Use Option A or B; the CLI is still what deploys the edge functions
(§7.8 does that from GitHub, with a pinned CLI version).

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

The courses live in `content/courses/*.ts`. To be able to open one in the admin panel and
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

- **Two ways to play, one setting.** `team_size` on the marathon decides it: `2` is Sergey's
  format, where a pair shares every task and «только если сделают все» means both of them; `1` is
  everyone for themselves. Solo is not "pairs left empty" — `marathon_is_solo()` is read by the
  scoring, the task targeting and the proof-sharing rule, so switching a running marathon to solo
  un-pairs everybody at once, a task addressed to a team then reaches nobody, and the table refuses
  to put anyone in a team at all. The admin asks which it is when the marathon is created, and the
  screens change with it: no team column, no rule that waits for a partner.
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

### 2.6 Steps are gone (`0015_drop_steps.sql`)

There was a «Шаги» screen, and `0012_step_proofs.sql` let a day carry a screenshot of the phone's
step counter beside the number. Both are removed.

**Why.** The owner's rule: «Он либо стекается либо его нет вообще. Потому что пользователь не будет
заниматься трекингом одних и тех же шагов в разных приложениях.» And it cannot sync — Forma is a
Telegram Mini App, which is a WebView:

- **Apple Health** is read through HealthKit, a native iOS framework. There is no browser API. The
  only route is a native app.
- **Google Fit's REST API** stopped accepting new developer registrations on 1 May 2024 and shuts
  down at the end of 2026. It cannot even be applied for.
- **Health Connect**, its replacement, reads on-device data from a native Android app.
- **The Google Health API** (the former Fitbit Web API) is a cloud API for Fitbit and Pixel Watch
  accounts. It is not the phone's Health app, and a person without one of those devices has nothing
  in it.

So the figure could only ever be typed in by hand, which is what the screen did, and which is the
arrangement the rule rejects.

**What 0015 does.** Rewrites `get_leaderboard()` and `get_my_totals()` to count workout points only;
drops the four `proofs: steps own …` storage policies and `owns_step_proof_path()`; drops
`daily_logs`, `daily_logs_set_points()` and `steps_points()`; drops `admin_course_days.steps_goal`.
The `proofs` bucket itself stays — the club's own proof lives in it under `marathon/…`.

⚠️ **It destroys data.** Every logged day goes with the table. On a project that has not launched
that is test data; take a backup first if it is not. Objects already uploaded under
`steps/<user_id>/…` are not deleted (SQL cannot remove Storage objects) — after this they are simply
unreachable and can be cleared from the Storage screen.

### Verifying the migrations locally

`supabase/tests/` runs the whole schema against a plain Postgres 16 — no Supabase needed. See the
header of `supabase/tests/00_shim.sql` for the exact commands; the short version is: create a
throwaway database, apply `00_shim.sql` and then every file in `supabase/migrations/` in order,
then run `10_smoke.sql`, `20_subscriptions.sql`, `30_course_builder.sql`, `40_marathon.sql`,
`60_coach_bookings.sql` and `61_google_calendar_bookings.sql`. (`50_step_proofs.sql` is gone with
the step feature — §2.6.)
Each ends with a "PASSED" line. The test files are **not** idempotent — they insert fixtures — so
rebuild the database for each run.

### What the migrations create

| Object                                                           | Purpose                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `profiles`                                                       | One row per auth user (trigger `on_auth_user_created`); own row read/write    |
| `current_email()`                                                | The caller's **verified** email (auth.users, confirmed + not banned)          |
| `admins` + `is_admin()`                                          | Coach emails; gate for admin RPCs and video uploads                           |
| `purchases`                                                      | `email ↔ course_id`, status `pending / active / refunded` (admin-only read)   |
| `courses`, `workouts`                                            | Generated catalogue (§2.1): the id allowlist and the points ceilings          |
| `create_order()` + `order_throttle`                              | Anonymous RPC used by the landing order form (validates, throttles, upserts)  |
| `my_entitlements`                                                | View: active courses of the signed-in user (`course_id`, `activated_at`)      |
| `has_entitlement(course_id)`                                     | Does the caller own this course? (sessions, video access; admins own all)     |
| `admin_set_purchase_status()`, `admin_add_purchase()`            | Admin RPCs behind the `/app/#/admin` screen                                   |
| `user_course_state`, `workout_sessions`, `benchmarks`            | Training data, own rows only                                                  |
| `workout_sessions_guard` trigger                                 | Server timestamps, date window, per-workout points ceiling, 4 sessions/day    |
| `get_leaderboard()`                                              | Top 100 + own row; never returns emails                                       |
| `get_my_totals()`                                                | Points / workouts / minutes for the home screen                               |
| `exercises`                                                      | The exercise library in the database; seeded from content, extendable by hand |
| `custom_workouts`, `assigned_workouts`                           | Coach-built workouts and the emails they are granted to                       |
| `admin_courses`, `admin_course_days`                             | Courses composed in the admin panel (§2.2); days point at `custom_workouts`   |
| `admin_publish_course()`, `admin_unpublish_course()`             | The only non-migration writers of `courses` / `workouts` (§2.2)               |
| `images` bucket                                                  | Public: course covers, day pictures, exercise stills (`videos` stays private) |
| Storage bucket `videos` (private)                                | Read requires an active purchase of the course in the path, or `shared/`      |
| `marathons`, `marathon_teams`, `marathon_members`                | A marathon run, its pairs (none when `team_size = 1`), and who plays (§2.5)   |
| `marathon_tasks`, `marathon_submissions`, `marathon_adjustments` | The daily plan, the proof sent against it, and the coach's manual ±points     |
| `marathon_scores()`, `marathon_my_points()`                      | The weekly board and one athlete's days; points are derived, never stored     |
| `my_marathons()`, `marathon_roster()`                            | What the app opens the format with; the roster returns names, never emails    |
| Storage bucket `proofs` (private)                                | Photo and video proof: its author and the coach only, never a teammate        |

---

## 3. Auth settings (email one-time code)

The app signs in with a **6-digit code** sent by email — no passwords, no magic links.

> ### Do §3.5 (custom SMTP) first. Nothing else in this section works without it.
>
> Without custom SMTP, **Supabase refuses to deliver to any address that is not a member of the
> project's organization**, and caps the built-in sender at **2 messages per hour** with no
> delivery guarantee at all. It is documented as non-production, best-effort only.
>
> That failure is silent and it is the worst kind. The API answers 200, `signInWithOtp` resolves,
> the app moves the athlete to the code field — and the message was never sent. The owner tests
> with their own address, which _is_ on the team, sees the code arrive, and concludes sign-in
> works. Every other person in the world sees a code field and an empty inbox.
>
> So the order is 3.5 → 3.2 → 3.1 → 3.3 → 3.4, and the acceptance test is **a code delivered to
> an address that has never been near this Supabase project** — not to yours.
>
> Sources: [Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
> [Changes to the default email provider](https://github.com/orgs/supabase/discussions/29370).

### 3.1 Provider

Dashboard → **Authentication → Providers → Email**:

- **Enable Email provider**: on.
- **Confirm email**: off. The OTP itself proves ownership of the address; with double opt-in on,
  new users would receive a confirmation link instead of a code. If your dashboard version keeps
  it on, it still works as long as the _Confirm signup_ template also contains `{{ .Token }}`
  (step 3.2). The app is built to survive that setting now: Supabase hands a brand-new address a
  _signup_ token rather than an email OTP, and `verifyCode` (src/lib/api/auth.ts) retries a refused
  code as one before calling it wrong — so the failure this used to cause, a letter with six correct
  digits that the sign-in screen rejects, no longer happens. Off is still the setting to prefer: the
  retry is a safety net, not a licence to skip this line.
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
2. Subject: `Код для входа в Forma · Forma sign-in code`
   (do not put `{{ .Token }}` in the subject — it ends up in notification previews and logs).
3. Replace the body with the contents of `supabase/templates/otp.html`: a dark, table-based email
   with the code in large type and a 10-minute note.
   The template uses `{{ .Token }}`, `{{ .Email }}` and `{{ .SiteURL }}`.
   **It says everything twice — Russian first, English under it in a quieter colour.** Supabase
   keeps one template per email type and has nobody to ask which language this reader uses: at the
   moment a code is sent there is no account yet. Per-language emails need the **Send Email Hook**
   and an email provider of our own; until that exists, one bilingual letter is how an English
   reader gets in at all. The code itself is six digits and needs no translation.
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

- The built-in email sender allows **2 messages per hour**, only to organization members, and is
  meant for development. Custom SMTP (3.5) is not a launch task, it is a prerequisite; with it
  configured, raise "emails per hour" to something like 100–300. Supabase starts a newly
  configured sender at 30 per hour to protect its reputation, so raise it deliberately.
- Keep "OTP requests per 5 minutes" and "token verifications" at their defaults; the app enforces
  a 60-second resend timer on top.

### 3.5 Custom SMTP — do this first, before anything else in §3

Dashboard → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP.

**Without a domain of your own**, use a mailbox you already have. Gmail: turn on 2FA, create an
app password at myaccount.google.com/apppasswords, then `smtp.gmail.com:465` with that password
and your address as both username and sender. Roughly 500 emails a day, which is ample to launch
on, and it costs nothing. Swapping to a provider later is a five-minute settings change.

**Already on Google Workspace?** Then this is the shortest path there is, and it is a proper
domain sender rather than a stopgap. Google sets the MX records and hands you the SPF line when the
domain is added to the account, so the work is three things it does _not_ do for you:

1. **DKIM is off until you switch it on**, and this is the one people miss for years. Admin console →
   Apps → Google Workspace → Gmail → **Authenticate email** → pick the domain → generate the record
   → publish the TXT → come back and press **Start authentication**. Publishing the record without
   pressing the button leaves DKIM off; `mail.ru` and `yandex.ru` are the two that notice.
2. **SPF must stay a single record.** Google's is `v=spf1 include:_spf.google.com ~all`. If the
   domain already has an SPF record, merge `include:_spf.google.com` into it — two SPF records do
   not mean "one of them wins", they fail the check outright.
3. **DMARC**, as everywhere: `_dmarc.<domain>` TXT, `v=DMARC1; p=none; rua=mailto:<address>`.

Then `smtp.gmail.com:465` with an app password (2-Step Verification has to be on for app passwords
to exist at all, and a Workspace admin can disable them org-wide under Security → Access and data
control — you are your own admin). The **username is the account the app password belongs to**, and
the **sender may be an alias** of it — an alias costs no seat, but it has to be confirmed under
Gmail → Settings → Accounts → "Send mail as", or Google rewrites the From header to the
authenticated address and the code arrives from the wrong person. Workspace allows on the order of
2,000 messages a day; check the figure for your own plan.

The foreign-address restriction described below does not apply to Google.

**With a domain** (worth having anyway — it also moves the site off github.io):

| Provider                | Good for                                  | Notes                                                                 |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Resend                  | Simplest setup, EU region                 | Verify your domain (SPF + DKIM) in Resend, then use `smtp.resend.com` |
| Postmark                | Best transactional inboxing               | Use the "Transactional" message stream                                |
| Yandex 360 for Business | RU audience, mail.ru / yandex.ru inboxing | Use an app password, `smtp.yandex.ru:465`                             |
| Mail.ru for business    | RU audience                               | `smtp.mail.ru:465`, app password                                      |

Set **Sender email** to an address on your own domain (e.g. `hello@forma-app.co`) and
**Sender name** to `Forma`. Add SPF, DKIM and DMARC records at your DNS provider; without them
Gmail and Mail.ru will junk the codes. The DKIM and SPF records come from whichever provider you
picked; **DMARC is usually not offered and has to be added by hand** — `_dmarc.<domain>` as a TXT
record holding `v=DMARC1; p=none; rua=mailto:<your address>`. `p=none` only watches and blocks
nothing; tighten it once mail is flowing.

**A trap specific to the two Russian providers above.** Yandex and Mail.ru restrict SMTP
authentication from foreign addresses, and Supabase sends from its own infrastructure abroad — a
project in Frankfurt, as §1 recommends. The symptom is an authentication refusal in
Dashboard → Logs → Auth even though the same credentials work from a mail client at home, or
delivery that quietly collapses. The two are chosen here for inboxing at `mail.ru` and `yandex.ru`,
which is worth trying for a Russian audience, but try it before believing it.

If it refuses: keep the domain and the DNS records, which are provider-independent, and point the
SMTP settings at Resend or Postmark instead. Only host, username and password change — five minutes,
and none of the DNS work is wasted. They reach Russian inboxes less reliably than a domestic sender
does, which is the trade, and still incomparably better than a mailer that refuses to send at all.

#### 3.5.1 DNS for `forma-app.co` — the three records, in order

This is the part nobody has done yet, and it is the part that decides whether a sign-in code lands
in the inbox. Do it once, in this order, at whichever DNS host the domain's nameservers point at
(`dig NS forma-app.co +short` says which). Nothing below is reversible-by-accident: every step is a
TXT record you can delete again.

**Step 0 — pick the sender first.** Two of the three records are generated by the company that
sends the mail, so choosing the provider is step zero, not a later optimisation. The
recommendation above still stands: **Google Workspace holds the mailbox, Resend or Postmark sends
the codes**. Everything below is written for "the codes are sent by `<provider>` and the From
address is `hello@forma-app.co`".

**Step 1 — SPF. One record, and only ever one.**

| Field | Value                                  |
| ----- | -------------------------------------- |
| Name  | `@` (some panels want `forma-app.co.`) |
| Type  | `TXT`                                  |
| Value | `v=spf1 include:<SENDER> ~all`         |
| TTL   | whatever the panel defaults to         |

`<SENDER>` is the one **gap that the provider decides**. What to expect:

| Sender                  | `include:` to use | Where the authoritative value is printed          |
| ----------------------- | ----------------- | ------------------------------------------------- |
| Google Workspace        | `_spf.google.com` | Admin console → Apps → Gmail → Authenticate email |
| Postmark                | `spf.mtasv.net`   | Postmark → Sender Signatures → the domain → DNS   |
| Resend                  | `amazonses.com`   | Resend → Domains → the domain (it prints the set) |
| Yandex 360 for Business | `_spf.yandex.net` | Yandex 360 admin → Domains → DNS records          |
| Mail.ru for business    | `_spf.mail.ru`    | Mail.ru admin → Domain → DNS                      |

**The dashboard wins over this table.** These are what each provider publishes today; they change
them, and the panel prints the current one beside a Verify button. Copy from there and use this
column only to recognise a value that looks wrong.

Two traps, both of which silently fail rather than error:

- **Two `v=spf1` records at the same name do not mean "one of them passes".** They are a permanent
  error and every checker treats the domain as unauthenticated. If the domain already has an SPF
  record — Google Workspace adds one when the domain is set up — merge the new `include:` into the
  existing record instead of adding a second: `v=spf1 include:_spf.google.com include:spf.mtasv.net ~all`.
- **Postmark and Resend send from their own bounce domain**, so their SPF work lands on a
  subdomain (`pm-bounces.forma-app.co`, `send.forma-app.co`) as a CNAME rather than on the root TXT.
  Publish exactly the records their panel lists, including those CNAMEs — SPF checks the envelope
  sender, which is that subdomain, not the address a person sees.

**Step 2 — DKIM. The record cannot be written here, and this is the one that actually matters.**

DKIM is a public key, and the private half lives with the sender, so the exact name and value are
generated per domain and **have to be copied out of the provider's panel**. This is a deliberate
gap, not an omission. Where the button is:

| Sender           | Where                                                                                                            | Selector you will see            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Google Workspace | Admin console → Apps → Google Workspace → Gmail → **Authenticate email** → pick the domain → Generate new record | `google._domainkey`              |
| Postmark         | Sender Signatures → the domain → **DKIM**                                                                        | a dated selector, `…._domainkey` |
| Resend           | Domains → the domain → the record list                                                                           | `resend._domainkey`              |
| Yandex 360       | Admin → Domains → **DKIM**                                                                                       | `mail._domainkey`                |

Two things decide whether this works, and both are settings rather than records:

- **Generating the record is not switching DKIM on.** Google in particular publishes the key and
  then waits for you to press **Start authentication**; until you do, nothing is signed. This is
  the single most-missed step in the whole section.
- **The signature has to be aligned.** The letter's From is `hello@forma-app.co`, so the DKIM
  signature must carry `d=forma-app.co`. If the provider signs with its own domain — which is what
  it does until you verify the domain with it — DMARC fails on alignment even though SPF and DKIM
  both "pass". Verifying the domain inside the provider is what flips it.

**Step 3 — DMARC. This one is exact and derivable, so here it is in full.**

| Field | Value                                                                    |
| ----- | ------------------------------------------------------------------------ |
| Name  | `_dmarc` (i.e. `_dmarc.forma-app.co`)                                    |
| Type  | `TXT`                                                                    |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc@forma-app.co; adkim=r; aspf=r; fo=1` |

`dmarc@forma-app.co` has to be a real mailbox or an alias that lands in one, or the reports go
nowhere. An alias onto the Workspace mailbox is enough and costs no seat.

`p=none` watches and blocks nothing, which is the right setting on day one — a stricter policy
published before DKIM is aligned junks your own mail. The sequence after that, and there is no
rush: two weeks on `p=none` reading the reports → `p=quarantine` once every report shows both SPF
and DKIM aligned → `p=reject` only if you ever need it. **Do not skip ahead.**

**Step 4 — check it, from outside.**

```bash
dig +short TXT forma-app.co            # exactly ONE line starting v=spf1
dig +short TXT _dmarc.forma-app.co     # the DMARC line above
dig +short TXT google._domainkey.forma-app.co   # or whichever selector your sender uses
```

Then send a code to a Gmail address that has never been near this project, open the message,
**Show original**, and read the three lines at the top: SPF, DKIM and DMARC must all say `PASS`,
and the DKIM line must say `d=forma-app.co`. A `PASS` with the provider's domain in `d=` is step 2
unfinished. Propagation is minutes to a few hours; a failure five minutes after publishing means
nothing yet.

**Step 5 — register with the postmasters** (the table in the next section). Each wants one more
TXT record beside the DKIM one, and they are how you find out about a deliverability problem
before a customer does.

#### Keeping the code out of spam

Authentication (SPF, DKIM, DMARC — 3.5.1) is the entry ticket, not the whole answer, and DKIM is
the one that decides it: without it `mail.ru` and `yandex.ru` junk a code more or less by default.
What follows assumes those three are in place.

**The template has been audited against the usual filter triggers and it passes. Do not
"improve" it.** What was checked in `supabase/templates/otp.html`, so that a future edit knows what
it would be undoing:

| Trigger                             | Status in the template                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Images, logos, tracking pixels      | **None.** No `<img>` at all; the wordmark is type.                                                                                                                |
| Number of links                     | **One**, in the footer.                                                                                                                                           |
| Visible link text vs. its `href`    | **Identical** — both are `{{ .SiteURL }}`. A mismatch is the strongest template-level spam signal there is.                                                       |
| A bare link with no words around it | No: the link sits under "Письмо отправлено на …" and is the last thing in the letter.                                                                             |
| Image-only content                  | No: every word is live text.                                                                                                                                      |
| `List-Unsubscribe`                  | **Absent, and it must stay absent.** It belongs on marketing mail. On a sign-in code it invites somebody to unsubscribe from their own logins.                    |
| The code in the subject line        | No — 3.2 says to keep `{{ .Token }}` out of the subject, and it is out.                                                                                           |
| Plain-text alternative              | **Missing, and not fixable from here** — the dashboard has no field for a text part (3.2). `supabase/templates/otp.txt` is kept for a provider that asks for one. |

Two settings at the sending provider can undo all of that, and both are on by default in some
plans:

- **Open tracking** inserts a 1×1 tracking pixel — an image, in a letter that has none.
- **Click tracking** rewrites the one link to point at the provider's own domain, which breaks the
  match between what the link says and where it goes.

Turn both **off** for the stream that carries the codes (Postmark: use the **Transactional**
message stream and leave tracking unticked; Resend: the domain's tracking toggles).

One thing in the template is a deliberate trade rather than a clean win, and it is the owner's
call: the hidden preheader carries the code (`Код для входа: {{ .Token }}`) so the six digits are
readable from the inbox list without opening the letter. That is convenient, and it is the same
exposure — a lock-screen notification — that 3.2 gives as the reason for keeping the code out of
the subject. Replace it with a line that does not contain `{{ .Token }}` if that trade is not
wanted.

**Register the domain with the postmasters.** This is the instrument almost nobody sets up, and for
a Russian audience it is the one that matters:

| Where                   | What it shows                                                             |
| ----------------------- | ------------------------------------------------------------------------- |
| `postmaster.mail.ru`    | your domain's spam rate and delivery at Mail.ru, Inbox.ru, List.ru, Bk.ru |
| `postmaster.yandex.ru`  | the same for Yandex mail                                                  |
| `postmaster.google.com` | the same for Gmail, plus your domain reputation as Google rates it        |

All three are free and take minutes: each asks for one TXT record you add beside the DKIM one. Until
they exist you learn about a deliverability problem from a customer who did not get in, which is the
most expensive way to learn it.

**Know, rather than hope: a transactional sender logs every message.** This is the real argument for
Resend or Postmark, and it has nothing to do with the foreign-address trap above. Sending through
Google Workspace SMTP gives **no per-message visibility at all**: when somebody writes "the code
never came", there is nothing to look at — no delivery status, no bounce, no complaint, not even
proof the message left. A transactional provider gives every message a verdict (delivered, bounced,
marked as spam) and keeps it searchable by address.

That points at a split rather than a choice, because the two senders do different jobs:

- **Google Workspace** holds the mailbox. `hello@forma-app.co` is published on the site as the
  support address and is named in the legal pages, so it has to receive mail regardless.
- **Resend or Postmark** sends the codes: built for transactional mail, free tier enough to launch
  on (check the current figure), and it answers "where is my code" in one search.

Swapping later is three fields in Supabase — but a sending domain builds reputation from its first
message, so doing it once is cheaper than doing it twice.

**How to know it worked.** Send a code to an address that has never been near this project — a
friend's, a throwaway — from a device that is not yours. A code arriving at the owner's own
address proves nothing, because that address is on the team and would have received it even with
no SMTP configured at all. Then check Dashboard → **Logs → Auth** for the send: a refusal appears
there, and it is the only place the app can never show you, because Supabase answers the app with
a 200 either way.

#### When the code does not arrive

The sign-in screen already tells the two halves apart, and it is worth reading the exact words:

| On screen                                                  | What it means                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| «Не получилось отправить письмо с кодом»                   | Supabase took the request and its **mailer refused**. Custom SMTP is either not set up at all — the built-in sender is development-only and will not deliver to most addresses — or its host, port, app password or sender address is wrong, or the sending domain is unverified. Nothing to do with the template, spam filters or DNS. |
| «Слишком много запросов»                                   | The per-hour limit. Raise it under Authentication → Rate Limits (3.4).                                                                                                                                                                                                                                                                  |
| Nothing at all, and no letter                              | The letter left and was filtered. That is SPF / DKIM / DMARC.                                                                                                                                                                                                                                                                           |
| A letter arrives carrying a **link** instead of six digits | The template was never pasted (3.2), or only into _Magic Link_ and not _Confirm signup_.                                                                                                                                                                                                                                                |

**Supabase's own words about a refused send are in Dashboard → Logs → Auth.** That is the fastest
way to tell "no SMTP configured" from "wrong app password", and it costs nothing to look.

To reproduce it from outside the app, run the **Check backend** workflow
(`.github/workflows/probe-backend.yml`) from the Actions tab. It reads the project's auth settings,
and with **send** ticked it asks Supabase for a real code and prints the failure verbatim. The
address comes from a repository **secret** named `PROBE_EMAIL`, never from a form field: this
repository is public, and a workflow input would publish that address in the run log forever.

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

**The price lives on the payment page, never in this link.** Nothing in this repository sends an
amount: the app appends the email and nothing else, so whatever the page asks for is whatever the
processor is configured to ask for. That is deliberate — the site is static and public, so a price
carried in the URL is a price the payer can edit before paying, and `…&price=3500` becomes
`…&price=1` in about two seconds.

So the link must point at a product with a **fixed amount set on the processor's side**. On
Prodamus that is a payment link created from a product/tariff with its price locked, not the shop's
open form: the open form shows an editable «сумма» field and lets the customer pay 1 ₽. If the page
you get shows a sum the customer can type into, the link is the wrong one — fix it in the processor,
not here. The same rule covers `content/site/booking.ts`, where the coach's hour is priced (§7.3).

### 7.2 Activating

Since migration 0019 this is **automatic**: the Prodamus webhook calls `apply_course_payment()`,
which finds the buyer's single `pending` purchase and switches it to `active`. The manual flow below
is the fallback, and it is still needed for a payment that arrived without an order (a bank
transfer, a gift) or for an address with several pending orders — in both cases the webhook logs the
payment and changes nothing.

Two secrets have to be set in Supabase for any of it to run: `WEBHOOK_TOKEN` and `PRODAMUS_SECRET`.
Without them the function refuses every delivery, and course activation silently stays manual.
Check with Actions → Supabase apply → `secrets-check`.

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

Same rule as courses in every respect, including the important one: `https://` only, the signed-in
email is appended as `?email=`, and **the amount is set on the processor, never here**. The app's
button says «Оплатить 3 500 ₽» because `price` in this file is what the product costs; if the page
it opens asks for a sum the customer can type, the link is pointing at an open form rather than at
a product with a locked price, and the two will disagree until the link is fixed on the processor
(see §7.1).

`scheduleUrl` is the second half of the flow and the screen already has the button for it —
**Выбрать время**, shown under the payment button only when this is set. Leave it empty and the
client pays and then waits for the coach to write; a free Google Calendar appointment schedule is
enough to close that gap.

Until `paymentUrl` is set the screen shows **Message the coach** (Telegram from `links.ts`, else
mail) instead of a payment button, so the offer is live from day one. Set `enabled: false` to hide
the offer everywhere.

### 7.4 Subscription: two plans, one webhook

`content/site/plans.ts` holds the two plans (monthly 1 990 ₽ / annual 7 990 ₽ by default) and
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

1. **Set the two secrets.** Supabase → Project Settings → Edge Functions → Secrets:
   `WEBHOOK_TOKEN` = a long random string you invent (`openssl rand -hex 16`), `PRODAMUS_SECRET` =
   the secret key from the Prodamus account. The token guards the URL; the secret verifies the
   `Sign` header. **Both are required** — the function fails closed and refuses every delivery
   while either is missing (503 without the secret, 403 without the token), because a query-string
   token alone is enough for a stranger to post `status=success` and grant themselves a year.
   They can also be repository secrets of the same names, and step 2 carries them over.
2. **Deploy it.** Actions → Supabase apply → task `deploy-payments`. It deploys the function with
   `--no-verify-jwt` (Prodamus carries no Supabase token, so the platform must not check for one),
   carries over the two secrets if GitHub has them, reads the secret names back, and then POSTs to
   the live address expecting 403 — which proves the function itself answered. The equivalent from
   a terminal is `supabase functions deploy prodamus-webhook --no-verify-jwt`.
3. In Prodamus → «Настройки» → «Уведомления», set the notification URL to
   `https://<project-ref>.functions.supabase.co/prodamus-webhook?token=<WEBHOOK_TOKEN>`.
4. Make one real payment and read Supabase → Edge Functions → `prodamus-webhook` → Logs:
   `ok: monthly for …` means the signature matched and `apply_subscription_payment()` ran.
   `signature mismatch` means the preparation Prodamus uses differs from `verify.ts` — nothing was
   activated; compare the posted fields with the code. `bad token` means the URL in Prodamus and
   `WEBHOOK_TOKEN` disagree. `not configured` means `PRODAMUS_SECRET` is unset.

The plan is recognised by the amount (`PLAN_MONTHLY_RUB` / `PLAN_ANNUAL_RUB` secrets override the
defaults), so keep the Prodamus prices equal to `plans.ts`. Notifications are idempotent per order
id: a retry never extends twice.

A session with the coach is recognised the same way, by amount. Two optional secrets set the
amounts: `SESSION_HALF_RUB` (half an hour) and `SESSION_HOUR_RUB` (an hour). Unset, the function
falls back to **2 500** and **3 500 ₽** — the prices in `content/site/booking.ts`. Change a session
price there and in Prodamus, and set the matching secret too, or the payment arrives and is not
recognised as a session. `deploy-payments` reports how many of the two are set (names only, never
the values).

A course is recognised by amount too, but only to tell it from everything else: the course itself
still comes from the single pending order of that address. The course prices default to **2 990,
3 990 and 4 990 ₽** (the prices in `content/courses/*.ts`; a test keeps the two in step), and the
optional secret `COURSE_PRICES_RUB` (`2990,3990,4990`) overrides them. **An amount that is no plan,
no session and no course price opens nothing** (since `0043`): it is recorded as an unclaimed
payment and the owner's channel gets «Платёж не привязан». It used to open whatever course the
address had a pending order for, for any amount.

A paid session is recorded with `applied = true`: there is nothing to attach it to, so it is never
counted as unclaimed.

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

**Renaming a bot that already exists, and why this one is not renamed.** The display name — what
people read at the top of the chat — changes freely: @BotFather → `/mybots` → the bot → **Edit Bot
→ Edit Name**. Nothing else moves: the token, the webhook, the Mini App and every link keep
working, because none of them is built from the name.

The **username** is the expensive one. The Mini App link `t.me/<bot>/<short name>` is the only way
into the app from inside Telegram and is built from the username: change it and every old link — in
messages the bot already sent, in a bio, in a post — stops opening anything. The freed username is
immediately available to anybody else, and a stranger's bot standing at the address customers used
to pay through is worse than an awkward name.

**And one bot cannot hold two usernames.** Two addresses mean two bots with two tokens, which the
backend is not built for and should not be: `link-telegram` verifies the Mini App launch string
against the token of _the bot that opened it_, so a person arriving through a second bot would be
refused — and `telegram-notify` writes from one token, so a bot can only message people who
started that same bot. Two entrances buy two silent failures. The bot therefore stays
`@forma_training_bot`, which is the one people already have.

Nothing in this repository is built from the username in any case: `BRAND.telegram` is empty,
`MINI_APP_URL` points at the website rather than at `t.me`, and the handle appears only in prose
and in one test fixture.

**A direct link** is worth more than the menu button: it is what goes in an Instagram bio, in the
Telegram channel and in any post. `/newapp` → the bot → title, short description, a 640×360
image (`npm run telegram:icon` renders one from the brand), `/empty` for the demo GIF, then the
same URL and a short name. The result is `t.me/<bot>/<short name>`, which opens the app in one tap.

**Answering `/start`.** A bot with no program behind it is silent when someone opens the chat and
taps **Start**, which is the one moment the menu button and the direct link do not cover — the
person is looking at an empty chat. `supabase/functions/telegram-bot` closes that and nothing else:
every private message gets the same greeting with an inline button that launches the app.

1. **The token.** @BotFather → `/mybots` → the bot → **API Token**. It never goes in this
   repository, which is public — it is a Supabase secret and nothing else. If it is ever pasted
   somewhere it should not be, `/revoke` in BotFather issues a new one.
   Put it in **GitHub** as a repository secret — Settings → Secrets and variables → Actions → New
   repository secret, name `TELEGRAM_BOT_TOKEN` — and the rest of this section is one button.

2. **Press the button.** Actions → **Supabase apply** → Run workflow → task **`deploy-bot`**.

   It deploys the function with Verify JWT off (Telegram carries no JWT), sets the runtime secrets
   from the GitHub ones, calls `setWebhook`, and then reads the webhook back and prints Telegram's
   own answer — the URL it will deliver to, how many updates are queued, and the last delivery
   error if there is one. Nothing in the log contains the token.

   Add `TELEGRAM_WEBHOOK_SECRET` (any value, e.g. `openssl rand -hex 32`) as a second repository
   secret before running it. Without it the hook still works, but it is unauthenticated: anyone who
   guesses the URL can post updates to it, and the run says so.

   Steps 3 and 4 below are what that button does, kept for when it has to be done by hand — the
   dashboard editor deploys a single pasted file, which is why this function is one file on purpose
   (a second file that is easy to forget fails the build with «Module not found»).

3. **The secrets.** Dashboard → **Edge Functions** → **Secrets**, or the CLI:

   ```sh
   supabase secrets set \
     TELEGRAM_BOT_TOKEN=123456:AA… \
     TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 24) \
     MINI_APP_URL=https://forma-app.co/app/
   ```

   Everything the greeting is made of can be overridden without touching the code; leave any of
   them unset to use what is baked into `index.ts`.

   | Secret                      | Default                               | What it is                     |
   | --------------------------- | ------------------------------------- | ------------------------------ |
   | `TELEGRAM_GREETING`         | three lines ending «Что открыть?»     | The caption under the picture  |
   | `TELEGRAM_PHOTO_URL`        | `https://forma-app.co/og/default.png` | The picture itself             |
   | `TELEGRAM_BUTTON_TEXT`      | «Тренироваться»                       | The button that opens the app  |
   | `TELEGRAM_SITE_BUTTON_TEXT` | «Что за курс»                         | The button that opens the site |
   | `TELEGRAM_SITE_URL`         | `https://forma-app.co/courses/start/` | Where that button goes         |

   **The picture is fetched by Telegram's own servers, not by this function**, so it has to be a
   public URL that answers with an image. The default is the OG card the deploy generates, which
   means it exists as soon as the site has deployed once. Set `TELEGRAM_SITE_BUTTON_TEXT=` (empty)
   to drop the second button and leave one.

   A photo Telegram refuses — moved, slow, never generated — is not a silent failure: the function
   logs it and sends the same words and the same buttons as a plain message. So a broken picture
   costs the picture and nothing else. Tap **Start** after changing any of this: a greeting that
   arrives without the image is the log line to go and read.

4. **Point Telegram at it** — what `deploy-bot` does for you, and how to do it by hand: open this
   URL in a browser, once.

   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<project>.functions.supabase.co/telegram-bot&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

   `{"ok":true,"result":true}` means it is live. `…/getWebhookInfo` shows what Telegram thinks the
   webhook is, including the last delivery error, and `…/deleteWebhook` takes it off again.

   **This is the step that makes the Start button do something.** Pressing Start sends `/start` to
   Telegram; Telegram delivers it to the URL this call names, and to nothing otherwise. A bot whose
   webhook was never set is not a broken button — it is a message with nowhere to go.

The secret is what guards the door: Telegram echoes it back in `X-Telegram-Bot-Api-Secret-Token` on
every delivery, so a request without it is not Telegram and gets a 403. Without the secret set the
function still runs and says so in its log, but the URL is then the only thing protecting it.

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
mints a Supabase session from a verified `initData`; not built yet, and worth doing only once
Telegram proves to be a real channel. The verification half of it now exists — see below.

### Who this person is in Telegram

The bot cannot write to anybody until the app knows their Telegram account: it learns a chat id
only from people who messaged it first, and the app knows an email. `link-telegram`
(`supabase/functions/link-telegram/`) is the bridge, and `0026_telegram_link.sql` is where the
answer is kept — one `profiles.telegram_id`.

**The client never sends its own id.** It is right there in `Telegram.WebApp.initDataUnsafe`, and
`unsafe` is not decoration: anybody can edit it in a debugger. Sending it would let any signed-in
person claim somebody else's account and take over their notifications, payment messages included.
So the app forwards the whole **signed** launch string, and the function checks the signature with
the bot token — which only exists as a Supabase secret, never in this public repository.

The column is not client-writable, and that is load-bearing: the column-level grant in
`0001_init.sql` names the writable fields one by one, so a new column is out by default.
`supabase/tests/83_telegram_link.sql` asserts it, because a property that holds by omission is one
a future migration breaks silently.

1. Apply `0026_telegram_link.sql` — Actions → Supabase apply → `migration`.
2. Actions → Supabase apply → **`deploy-link`**. It refuses to deploy if `TELEGRAM_BOT_TOKEN` is
   not already a Supabase secret (`deploy-bot` is what sets it), because without the token the
   function can verify nothing and answers 503 to everyone.
3. Open the app inside Telegram once, then run **`telegram-check`**. It prints how many people the
   bot can reach — counts and one date, never an address or an id.

People who never open the app from Telegram simply have no row here, and nothing is sent to them.
That is the owner's decision and it is fine: «Это нормально».

**If `telegram-check` keeps printing zero, read the Invocations tab, not the Logs tab.** This
failed for weeks at 0 of 17 with an empty log, because the log only holds what the handler chose
to write and the handler was never reached. The app is on `forma-app.co` and the function on
`supabase.co`, so the browser sends a `OPTIONS` preflight first; the handler answered `405` to
everything that was not `POST`, the preflight was refused, and the browser then never sent the
`POST` at all. Invocations showed `OPTIONS → 405` and nothing else. `cors.ts` answers the
preflight now, and `cors.test.ts` pins the status code so it cannot come back. The general lesson
is worth more than the fix: **a function that is never called leaves the same empty log as a
function that has nothing to say.**

### What the bot writes, and when

`telegram_outbox` (`0027_telegram_outbox.sql`) is a queue. The database records the **occasion**;
`telegram-notify` turns it into a message and sends it. Four occasions so far: a course paid, a
subscription paid, a workout assigned, and the winner of a club week (`0029_winner_message.sql`).

The winner's message is the one that would otherwise not arrive at all. A payment is visible the
moment they open the app; a win is not — the strip on the club tab is seen only by whoever looked
that day, and the prize has to be claimed by writing to the coach. So that message congratulates,
names the prize in his words, and says what to do next.

Changing the winner writes a message to the new one and never un-sends to the old. Telegram cannot
take a message back, and «извини, не ты» from a robot is something the coach should say himself.

Nothing sends from inside a transaction, and that is deliberate. The bot token is a Supabase secret
and cannot live in the database; a slow Telegram would hold open — or roll back — the transaction
that just activated a course, so somebody would have paid and got no access because a messenger was
busy; and a purchase lives on an address, so the recipient may not exist yet. A row simply waits
until the person signs in and opens the app from Telegram.

The occasions are recorded by **triggers**, not by editing the three security-definer functions that
grant access. There are several routes to "access opened" — the Prodamus webhook, a manual grant in
the admin panel, the SQL editor — and adding a call to each is a promise to forget one.

1. Apply `0027_telegram_outbox.sql`.
2. Generate a gate secret — `openssl rand -hex 32` — and add it as the repository secret
   **`NOTIFY_TOKEN`**.
3. Actions → Supabase apply → **`deploy-notify`**. It copies that secret into the project and
   deploys the function.

From then on `.github/workflows/telegram-notify.yml` wakes it every ten minutes. A run prints three
counters and nothing else — never an address, never a message. **`outbox-check`** is the fuller
view: `waiting_for_telegram` climbing means everything works and those people simply have no
Telegram; `pending` climbing with `waiting` at zero means the schedule or the function is broken.
It prints the owner's-channel queue (§7.11) the same way, counts only.

Each run takes only rows whose recipient already has Telegram attached (`telegram_outbox_due`,
`0043`) and expires the stale ones in one statement first. Before that, fifty rows for people
without Telegram — most of the queue, since a purchase arrives before the link — filled the whole
batch and held back a message to somebody who could receive it until they expired.

There is no unsubscribe button, by the owner's decision: «Не нужно добавлять кнопку "Отписаться" в
каждом сообщении. Это не нарушает закон о рекламе 152 ФЗ.» Every message here is about something
the person bought or was given, which is service, not advertising.

---

## 7.7 The booked session, on the Тренер screen (Google Calendar)

`coach_bookings` (`0014_coach_bookings.sql`) is the app's copy of the sessions people booked with
the coach: when it starts, how long until it starts, and where to join. It is filled by ingestion
running with the service role — **a signed-in person can never write a booking, not even their
own** — and read through `my_coach_bookings`, which shows each person only their own.

It is filled by `supabase/functions/google-calendar-sync/`, which needs nothing but a Google
account. (A Calendly webhook used to sit next to it; it needed Calendly **Standard**, was never
switched on, and has been removed.) Every new booking also reaches the owner's channel as
«Выбрали время» (§7.11) — the `coach_bookings_notify_admin` trigger of 0040 fires on the sync's
inserts like on any other.

### What Google gives and what it does not

- **An appointment schedule is free** on a personal Google account. The catch is that a free
  account gets **exactly one booking page**; automated reminders to the person who booked,
  collecting payment, verified bookings and putting the schedule on a secondary calendar are paid
  Workspace features. One page is enough here — one page can offer more than one duration — but it
  does mean **bookings land on the coach's own primary calendar**, next to the rest of his life.
  That is what `GOOGLE_BOOKING_TITLE` below is for.
- **Google cannot call us when somebody books.** There are no webhooks on an appointment schedule,
  and Google's push channels need a verified HTTPS domain and renewal every few days. So the sync
  **polls**, every `POLL_INTERVAL_MINUTES` (10, in `sync.ts`, driven by `calendar-sync.yml`). The
  cost of that is staleness: a session cancelled just after a poll **can still be shown for up to
  ten minutes**, and a new booking has the same delay before it appears.
- **Google has no cancel or reschedule link in its API.** The booker's own links are in the
  invitation mail Google sends them, and nowhere else. So a booking has no «Отменить» button in
  the app.

### The coach does this, once

1. **Make the booking page.** Google Calendar → **Создать** → **Расписание встреч**. Give it a
   title that says what it is and that nothing else on his calendar will ever be called — for
   example `Персональная тренировка`. Set the length, the hours he is free, and turn on
   **Google Meet** as the location so every booking gets a join link.
2. **Copy the link** (open the schedule on the grid → **Копировать ссылку**) and send it to the
   owner. It goes into `scheduleUrl` in `content/site/booking.ts` (§7.3).
3. **Share the calendar with the robot.** Once the owner sends him an address ending in
   `.iam.gserviceaccount.com`: Google Calendar → settings of **his own** calendar → **Доступ для
   отдельных пользователей и групп** → **Добавить пользователей** → paste that address →
   permission **«Просмотр всех сведений о мероприятии»** → **Отправить**. It is the only
   permission the sync needs; it cannot change or delete anything.

   The robot now reads that whole calendar, so if there is anything on it he would rather the sync
   never looked at, the answer is a title filter (`GOOGLE_BOOKING_TITLE`, step 5 below), not a different permission.

### The owner does this, once

4. **Make the robot.** [console.cloud.google.com](https://console.cloud.google.com) → create a
   project → **APIs & Services → Library** → **Google Calendar API** → **Enable**. Then
   **IAM & Admin → Service Accounts → Create service account** → any name → **Done**. Open it →
   **Keys → Add key → Create new key → JSON**. A file downloads. It holds the private key, it is
   the only copy, and it must never be mailed, pasted into a chat, or committed — this repository
   is public.

   Send the coach the service account's address (`…@….iam.gserviceaccount.com`) so he can do
   step 3. That address is not a secret.

5. **Put five secrets into GitHub.** Repository → **Settings → Secrets and variables → Actions →
   New repository secret**, once per name. Type each value in yourself; nobody else needs to see
   them, and none of them is ever printed in a run log.

   | Secret name            | Required | What to paste                                                                                                                 |
   | ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
   | `GOOGLE_SA_JSON`       | yes      | The **whole** JSON key file from step 4, from the first `{` to the last `}`. Open it in any text editor, select all, copy.    |
   | `GOOGLE_CALENDAR_ID`   | yes      | The calendar to read — the coach's own Gmail address (the one whose calendar he shared in step 3).                            |
   | `GOOGLE_SYNC_TOKEN`    | yes      | Any long random string: `openssl rand -hex 32`, or 40+ letters and digits typed at random. It is the lock on the function.    |
   | `GOOGLE_BOOKING_TITLE` | strongly | The appointment schedule's title from step 1, exactly, e.g. `Персональная тренировка`. Only events with it count as bookings. |
   | `GOOGLE_COACH_EMAILS`  | no       | Other addresses that are the coach, comma-separated, so they are never mistaken for a client.                                 |

   **Set `GOOGLE_BOOKING_TITLE`.** Without it, any event on that calendar with exactly one outside
   guest is read as a booking, and the coach's lunch with a friend becomes a session in somebody's
   app — and a message in the «Онлайн-тренировки» topic.

   Instead of `GOOGLE_SA_JSON` the two halves can be given separately as `GOOGLE_SA_CLIENT_EMAIL`
   and `GOOGLE_SA_PRIVATE_KEY` (`client_email` and `private_key` out of the file). The whole file is
   easier to paste from a phone, and the job takes it apart itself.

   The key file is the only copy of the robot's password. Once it is in the secret, delete the
   downloaded file. If it is ever pasted somewhere it should not be, delete that key in the Cloud
   console (service account → **Keys**), create a new one and replace the secret: the old one stops
   working immediately.

6. **Run Actions → Supabase apply → `deploy-calendar`.** It deploys `google-calendar-sync` with JWT
   verification off (a schedule has no signed-in person; the token is the lock), copies the
   secrets that are set in GitHub into Supabase — an empty one never overwrites a value typed in
   the dashboard — lists which names the project has, and then runs **one real sync** so the
   answer is on the run page right away:

   | What the run says                         | What it means                                                                                 |
   | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
   | `Первый опрос прошёл: scanned=… booked=…` | It works. `booked` is how many bookings it found in the next 60 days.                         |
   | `502 — Google не пустил`                  | Wrong key file, or the calendar is not shared with the robot yet (step 3), or wrong calendar. |
   | `503 — функции не хватает секретов`       | A warning above names the missing secret.                                                     |
   | `booked=0 ignored=12`                     | Nothing matched: the schedule's title and `GOOGLE_BOOKING_TITLE` disagree.                    |

   The first sync also sends one «Выбрали время» message per future booking it finds into the
   owner's channel — the channel has never heard of them. After that, only new ones.

7. **Nothing else to schedule.** `.github/workflows/calendar-sync.yml` wakes the function every ten
   minutes (pg_cron is not enabled in this project; this is the same arrangement as
   `telegram-notify.yml`). Each run prints one line of counters and nothing else — never an
   address, never an event title. Until `GOOGLE_SYNC_TOKEN` exists the schedule only leaves a note
   and exits green, so a red cross in Actions always means something real: `403` — the token in
   GitHub and in Supabase differ (run `deploy-calendar` again); `502` — Google stopped letting the
   robot in, usually because the calendar was un-shared.

8. **Book a test slot** from the coach's link with an address you can sign in with, wait up to ten
   minutes (or run **Actions → Sync the coach's Google Calendar → Run workflow**), and open the
   Тренер tab signed in with that address: the session is at the top, with its join link. The
   owner's channel gets «Выбрали время» in «Онлайн-тренировки» at the same time. Nothing in the
   logs says who booked, by design; to find one booking, look it up by its `external_id`
   (`gcal:<event id>`).

9. **From the phone: Админка → Записи** (0045) lists the sessions — upcoming, past, cancelled — in
   Moscow time, and «Синхронизировать сейчас» runs the same function at once. The button sends the
   admin's own sign-in instead of `GOOGLE_SYNC_TOKEN`; the function lets it in only when PostgREST,
   asked with that token, says `is_admin()` (`google-calendar-sync/door.ts`), and waits half a
   minute between two such runs. When the Google secrets are missing the screen says so and names
   them (the function's `503`); when the function is not deployed at all, it says to run
   `deploy-calendar`. Needs `deploy-calendar` once after 0045 for the new door.

### If the coach ever cancels by deleting the event

Both ways are handled. A cancelled event comes back from Google with `status: 'cancelled'` and is
marked cancelled here. An event that has been deleted long enough to disappear from the calendar
entirely is caught by the second rule: after a poll that read the whole window successfully,
anything the app still holds as active inside that window and did not see is cancelled too. The
row is never deleted — the person needs to see that the session is gone, and the coach needs the
history.

---

## 7.8 Applying things from GitHub instead of the dashboard

`.github/workflows/supabase-apply.yml` does the dashboard chores from a phone. **Actions → Supabase
apply → Run workflow**, pick a task:

| Task                                   | What it does                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `migration`                            | Runs one file from `supabase/migrations/`. The second input is its bare filename.           |
| `club-seed`                            | Runs `supabase/seed-club-week.sql` — the club's test week and its invented cohort (§9.1).   |
| `club-join`                            | Puts the real testers in that week, reading their addresses from a secret.                  |
| `email-templates`                      | Puts `supabase/templates/otp.html` into **both** Magic Link and Confirm signup (§3.2).      |
| `deploy-bot`                           | Deploys the `telegram-bot` function and sets its secrets (§7.6).                            |
| `deploy-link`                          | Deploys `link-telegram`, which attaches a Telegram account to a profile (§7.6).             |
| `deploy-notify`                        | Deploys `telegram-notify`, copies `NOTIFY_TOKEN` and the owner's-channel secrets (§7.11).   |
| `deploy-payments`                      | Deploys `prodamus-webhook`, checks its two secrets and probes the live address (§7.4).      |
| `deploy-lava`                          | Deploys `lava-webhook`, copies its three secrets, fails if any is missing, probes (§7.9).   |
| `deploy-calendar`                      | Deploys `google-calendar-sync`, copies its secrets and runs the first sync (§7.7).          |
| `secrets-check`                        | Read-only: which function secrets Supabase has, which are missing, which override the repo. |
| `webhook-info`                         | Read-only: what Telegram itself believes about the bot's webhook, and why delivery failed.  |
| `payments-check`                       | Read-only: how many payment notifications have arrived and whether the last one applied.    |
| `telegram-check`                       | Read-only: how many people have a Telegram account attached, so the bot can reach them.     |
| `outbox-check`                         | Read-only: both queues (bot and owner's channel), by status. Counts only, no addresses.     |
| `translation-check`                    | Read-only: how much of what the coach typed still has no English half. Counts only (§7.10). |
| `reset-athlete`                        | Resets one person to "just signed in"; the address comes from the `RESET_EMAIL` secret.     |
| `migration` → `0030_reload_schema.sql` | Not a schema change: tells PostgREST to re-read the schema. Run it on `PGRST205`.           |

One secret makes it work: **`SUPABASE_ACCESS_TOKEN`** (Settings → Secrets and variables → Actions),
a personal access token from <https://supabase.com/dashboard/account/tokens>. The project ref is
derived from the `PUBLIC_SUPABASE_URL` variable, which is already set.

Two rules this file is built around, and they are the reason it is safe to have in a public
repository:

- **No input carries content.** The task is a choice and the migration is a filename checked against
  `supabase/migrations/`. A `workflow_dispatch` input is printed on the run page forever, so an input
  that could carry SQL is an input that could carry an email address or a key.
- **No response body is printed.** A query result can contain real rows.

Two tasks take a value, and both take it from a secret. `club-join` reads `CLUB_TESTER_EMAILS`,
falling back to `PROBE_EMAIL`. `reset-athlete` reads **`RESET_EMAIL`** — the address of the one
person to reset (the coach, usually, to walk through onboarding again). It wipes that person's
onboarding answers, fitness index, self-test results, finished workouts and course state; it
leaves payments, subscriptions, club membership with its points and proofs, bookings, consents and
admin rights alone. Secrets are masked in the log, so the statement is built in the runner and
never appears anywhere. Set `RESET_EMAIL` right before the run and change it for the next person;
an address in a workflow input would stay on the public run page forever.

**Secrets that override the repository.** The bot reads its copy as `secret ?? code`, so a set
secret beats whatever `supabase/functions/telegram-bot/index.ts` says, and a new text deployed from
the repository never reaches Telegram. Each has an English twin with an `_EN` suffix, read for
readers whose Telegram is not in Russian: `TELEGRAM_GREETING` / `TELEGRAM_GREETING_EN`,
`TELEGRAM_BUTTON_TEXT` / `TELEGRAM_BUTTON_TEXT_EN`, `TELEGRAM_SITE_BUTTON_TEXT` /
`TELEGRAM_SITE_BUTTON_TEXT_EN`; plus `TELEGRAM_PHOTO_URL`, `TELEGRAM_SITE_URL` and `MINI_APP_URL`,
which are shared. `secrets-check` warns about every one it finds. To go back to the repository's
text, delete the secret in Supabase → Project Settings → Edge Functions → Secrets.

`secrets-check` also lists every secret the functions read — the required ones as warnings when
missing (`NOTIFY_TOKEN`, `LAVA_WEBHOOK_SECRET`, `LAVA_PRODUCTS`, `GOOGLE_*` included), the optional
ones (`TELEGRAM_ADMIN_*`, the price overrides, `GOOGLE_BOOKING_TITLE`, `GOOGLE_COACH_EMAILS`) as a
plain line.

**The Supabase CLI version is pinned** in the workflow (`SUPABASE_CLI_VERSION` at the top of
`supabase-apply.yml`). It used to download `releases/latest`, so two deploys a day apart could run
different programs. To upgrade, change that one line and watch the next run.

What it cannot do: DNS (SPF/DKIM/DMARC live at the registrar), anything on Prodamus, and uploading
video, which is not in this repository.

## 7.9 Paying from outside Russia: lava.top

The till is Prodamus: Russian, in roubles, and it only takes Russian cards. The site and the app
have been bilingual since the English release, so an English reader used to reach a "buy" button,
press it, and land on a page they could neither read nor pay.

The first answer was a page of instructions — a PayPal transfer, the sign-up email in the note,
access opened by hand. It would have worked, and it cost five minutes of the owner's time per
payment plus an email in a note as the only thread between money and person. She replaced it:
«давай подключим лава топ вместо всех приколов с пейпалом и инструкциями».

**lava.top is a second till, not a replacement.** Prodamus keeps the rouble buyers, because it
issues the receipts Russian retail requires. Moving those over too is a decision with accounting
inside it, not a config change.

### What connecting it takes

1. **Register at [lava.top](https://lava.top/) as a seller** and pass whatever verification they
   ask for. Nothing below works until the account can actually take money.
2. **Create one product per thing you sell** — each course, the subscription, and **each length of
   a session with the coach**. The subscription is a recurring product with a period (monthly / 3
   / 6 / 12), which is what makes renewals arrive on their own; the two sessions are ordinary
   one-off products.

   The sessions were the gap the owner named — «в лава топ не добавлены продажи на 30 минут и на
   60 минут Сергея» — and until they exist, an English reader on the coach's tab is offered a
   message to him instead of a button. Their prices are in `content/site/booking.ts` and must
   match it: **\$29 for the half-hour, \$39 for the hour**.

3. From each product take **two values**: its public link, and its id.
4. **Put them in `content/site/payments.ts`** under our own key — `course:<course id>`,
   `plan:<plan id>` or `session:<half|hour>`. All of them are public by nature; they belong in the
   repository and nothing else does.
5. **In the cabinet, add the webhook** (Web-Widget → Webhooks → **Add Webhook**), pick **Basic**
   as the authentication and invent a login and a password there. Put the pair into GitHub
   Actions secrets as **`LAVA_WEBHOOK_SECRET`**, written exactly `login:password` — one line, one
   colon, no spaces around it. It never goes into the repository, into chat, or into a workflow
   input; the button below moves it into Supabase.

   **It is a login and a password, not a signing secret, and that distinction was paid for.** This
   was built first around an HMAC signature of the request body, taken from lava.top's public
   Python SDK, which has a `verify_webhook_signature()`. The cabinet says otherwise: a webhook
   authenticates with Basic or with your service's API key, and no signature is sent at all. The
   function would have refused every real notification, and looked like "payments don't arrive".
   **A third party's SDK is not a specification** — it shows what its author found useful, not
   what the service does.

   The password may hold any characters: the function decodes the header as UTF-8 rather than as
   raw bytes, so a Cyrillic or accented password matches like any other. It did not at first —
   `atob` returns bytes, and the test caught it before the deploy did.

6. Add the secret **`LAVA_PRODUCTS`** as well: a JSON map from the lava product id to our key. It
   lives as a secret rather than in code so renaming a product in the cabinet does not wait for
   the site to be rebuilt.

   ```json
   {
     "<course product id>": "course:start",
     "<tier id>": { "19": "plan:monthly", "79": "plan:annual" },
     "<half-hour product id>": "session:half",
     "<hour product id>": "session:hour"
   }
   ```

   A `session:` key means **money arrived and nothing is unlocked**: a session is the coach's
   time, not access, and the slot is agreed with a person. The function records the payment and
   stops there. That branch exists so a session can never be mistaken for a course — everything
   that is not a subscription otherwise goes to `apply_course_payment()`, which opens the single
   pending course order of that email, and somebody who had ordered a course and then bought an
   hour would have got the course for free.

   **The subscription needs the price form, and that is not decoration.** In lava.top a
   subscription is a _tier_, and a tier is one product holding several periods — the monthly price
   is mandatory, the yearly one is a toggle beside it. So the month and the year arrive under the
   same `product.id`, and the notification carries no period at all: its body is `eventType`,
   `product {id, title}`, `contractId`, `buyer`, `amount`, `currency`, `status`, `timestamp` and
   nothing else (checked against their SDK's `PurchaseWebhookLog`; the documentation itself is
   unreachable from the build environment). The amount is the only thing that tells them apart —
   the same bind `prodamus-webhook` is in, for the same reason.

   Leave **3 months and 6 months switched off** in the tier. The app knows two plans, `monthly`
   and `annual` (`SubscriptionPlan` in `src/lib/api/types.ts`); a payment for a period it has no
   name for would be recorded and left unclaimed, which is honest but useless.

   A price the map does not list is never guessed at: the payment is logged as unclaimed and waits
   to be attached by hand. Opening a year for somebody who paid for a month is the one outcome
   worth avoiding at any cost.

   A price may carry a currency — `"19 USD"` — and then matches only in that currency; a bare
   `"19"` matches in any, which is how the map was written before. The currency of every payment
   is stored beside its amount (`payments.currency`, since `0043`), so «19» in the ledger and in the
   owner's channel is never read as roubles.

   **Only the three prefixes mean anything.** `course:<id>` opens that course (the id must exist
   in the database), `plan:monthly` / `plan:annual` the subscription, `session:<…>` records a paid
   session. Anything else — a product missing from the map, a typo in a key, an unknown price or
   currency — opens nothing: the payment is recorded unclaimed and «Платёж не привязан» arrives in
   the owner's channel. Before `0043` everything that was not a plan or a session went on to open
   the pending course order of that address.

7. **Actions → Supabase apply → `deploy-lava`.** It deploys the function, moves the secrets over,
   prints which are missing, and prints the address to paste back.
8. **Paste that address into the cabinet** as the webhook URL:
   `https://<project>.functions.supabase.co/lava-webhook?token=<WEBHOOK_TOKEN>`.
9. **Buy something for the smallest amount you can, with a real card**, and check that the access
   opened by itself. This is the step that matters — see the warning below.

### Which till a purchase came through

Every purchase and every subscription carries a `source`, and since migration `0038` it is the
truth: `prodamus` or `lava`. The admin panel already prints it beside each row in Purchases and
Subscriptions, so "how was this bought" is answerable without opening the database.

It was not answerable before. Both `apply_course_payment()` and `apply_subscription_payment()` had
`'prodamus'` written into them as a constant, whichever webhook called them — so a lava.top
purchase was recorded as a Prodamus one. The till is now the last argument of both, defaulting to
`prodamus` so an old call keeps its old meaning, and each webhook names its own. The payment ledger
gained a `provider` column for the same reason, and `claim_payment()` passes it through rather than
falling back to the default.

Rows written before `0038` keep whatever they had: `source` says `prodamus` on lava purchases made
earlier, and `payments.provider` is null. Nothing is rewritten — the figure is only trustworthy
going forward, which is worth knowing before reading an old row as evidence.

### The contract was reconstructed, so the first payment is the test

lava.top's own documentation is unreachable from the environment this was written in, so the
webhook's contract — the `signature` header, HMAC-SHA256 over the raw body, the event names —
comes from their public SDK. It is very probably right, and it is not confirmed.

The failure mode is safe by construction: a signature that does not match is a 403 and nothing is
written. So if the contract is wrong, it looks like "payments do not arrive", never like "access
opened for somebody who did not pay". If that first live payment does not open anything, the
function's logs say whether the signature matched, and fixing it is a change in one file.

### What the webhook does

Two doors guard it, the same pair as Prodamus: the token in the URL and the HMAC signature. Either
failing is a 403 with nothing written.

Then `product.id` says what was bought — which Prodamus cannot do, because its short links drop
the query parameters, and there the course has to be inferred from the single pending order. Here
the course is the one named in the key, not the pending order: an order for one course and a
payment for another no longer open the first.
Renewals (`subscription.recurring.payment.success`) extend the subscription on their own. A refusal
or a cancellation opens nothing: a cancelled subscription means "do not renew", and the paid period
still has to run out.

`contractId` is the idempotency key, so a notification delivered twice opens access once.

A payment whose product is not in the map is recorded rather than lost, exactly as with Prodamus,
and waits for the owner. A paid session is recorded as applied — there is nothing to attach.

«Оплатил(а) с другой почты?» (`claim_payment`) no longer burns a course payment when there is no
pending order to open: the answer is `no_order` (the app shows the same «nothing to open yet,
write to us»), the payment stays claimable for when the order exists, and the owner's channel gets
«Пришли за платежом, а заказа нет».

### While it is not configured

A "buy" button on a non-Russian page leads where every unconfigured payment link in this product
leads: to the support address. It does not fall back to the rouble till — that would restore the
exact wall the second till exists to remove.

---

## 7.11 The owner's channel: everything in Telegram instead of the admin panel

Owner: «я не хочу заходить в админку, я хочу получать уведомления сразу в телеге».

Until now a payment arrived, opened access, wrote a row — and told nobody. You could **learn** of a
purchase by opening the admin panel; you could not **notice** one. The channel turns every money
event and every booking into a message in a private group, split into topics.

### Five topics, not six

`Регистрации · Курсы · Клуб · Онлайн-тренировки · Обращения`.

The club is one topic and not two, which was the owner's decision after the question. The club
subscription is **single across both modes** — 0033 records it in her own words: «Подписка единая
на оба клуба, поэтому все пользователи могут участвовать как в соло-режиме, так и дуо». So a solo
purchase and a duo purchase do not exist as separate things: there is one transaction and two
circles, and two topics for money would have disagreed with reality on the first payment. Pairing
is an event rather than a purchase, and lives in the same topic.

### Setting it up

1. **Create a group** in Telegram and switch on **Topics** in its settings. A group, not a channel:
   channels have no topics.
2. **Add the service bot and make it an administrator** with the **Manage topics** right. Without
   it the setup job is refused, and it says so. Use a **second bot**, not the one customers talk
   to — owner: «а мы можем второго бота как раз использовать под админку?». The customer bot has
   no business in an internal group, and a revoked or reissued token then takes down one circuit,
   not both. Every objection to a second bot was about it as a customer _entrance_ (the Mini App
   signature, messaging buyers); a sender into one closed group touches neither. Put its token in
   **`TELEGRAM_ADMIN_BOT_TOKEN`**. Optional: without it the main bot writes, and then it is the
   main bot that must be in the group.
3. **Find the group id**: write anything in the group and open
   `https://api.telegram.org/bot<service bot token>/getUpdates` — the reply carries
   `"chat":{"id":-100…}`. A group with topics always starts with `-100`. It must be the token of
   the bot that is _in_ the group; no other bot sees it.
4. Put it in the **`TELEGRAM_ADMIN_CHAT`** repository secret.
5. Run **Actions → "Set up the owner's Telegram channel"**. It creates the five topics, writes one
   line into each so the whole path is proven right away, and prints the JSON to paste into
   **`TELEGRAM_ADMIN_TOPICS`**.
6. Run **Supabase apply → `deploy-notify`**, which carries all three secrets into the project.

Both secrets are optional by construction: without them the sender simply does not touch the second
queue and messages to customers go on as before. The channel going quiet can never stop a purchase
notification reaching the person who paid.

**Running the setup job twice creates the topics twice** — Telegram has no "create if absent". If
one topic is deleted, make it by hand and correct one number in the secret.

### What arrives, and what deliberately does not

| Topic             | Messages                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| Регистрации       | a new account, with its language                                                  |
| Курсы             | course paid, refund, **a payment that opened nothing**, a claim with no order     |
| Клуб              | paid, renewed, cancelled, a duo pair formed, a proof sent again after a rejection |
| Онлайн-тренировки | session paid, time chosen, moved, cancelled                                       |
| Обращения         | what people write to the bot, and the app's «Написать тренеру» (§7.12)            |

The most valuable of these is **«Платёж не привязан»**: money arrived and access did not open,
because there was no order, or several, or the address at the till was a different one. It has
always been visible in the ledger to whoever scrolled it; now it arrives, because that is the case
where somebody paid and is sitting without their course.

**Delivery is retried, not abandoned.** A message the channel refuses stays in the queue and is
tried again on the next run — on 429 and 5xx, but also on 400 and 403, which here mean "the topic
was deleted" or "the bot was removed" and are fixed by hand. It becomes `failed` only after twelve
attempts in a row (two hours). A 400 about the markup or a link (`can't parse entities`, `invalid
URL` — usually a `tg://user?id=` link the person's privacy settings forbid) is retried at once
without links. `outbox-check` shows how many are pending, retrying and failed.

**Proofs are the one thing that cannot move wholesale.** Every club member sends one every day; a
message per proof would turn the channel into a feed that gets muted within a day — and the
purchases would be muted along with it. So only the proof that is **waiting on a person** is sent:
one resubmitted after the coach rejected it. A daily one-line digest of how many are queued is the
right next step and is deliberately not built yet.

**Обращения** is filled by the bot and by the app — see §7.12.

### Why a second queue rather than a column on the first

`telegram_outbox` (0027) already queues messages to customers, and the temptation to add a column
is real. Three differences, each sufficient: the recipient here is a known chat rather than a
person who has to be found by email and may never be found; there is no expiry, because a purchase
from three days ago still needs to be seen, while «the coach assigned a workout» delivered a week
late is bewilderment; and there is one language rather than the reader's own. What they do share is
the sender — `telegram-notify` drains both queues in one run, because the schedule, the token and
the door really are the same.

Every trigger that fills the queue swallows its own errors. A notification is a mirror, and a
cracked mirror does not oblige the room to disappear: a row in `admin_outbox` must never cost a
purchase, and on signup it would be worse than that — `handle_new_user()` runs inside the
transaction that creates the account, so an exception there is a person who could not register
because a notification failed to write.

---

## 7.12 «Обращения»: questions from people, in the owner's channel

Two ways in, one topic.

- **The bot.** Anything a person writes to the main bot in private that is not a command is passed
  on. Before, every such message got the full promo greeting back — the wrong answer to «а можно
  заниматься с больным коленом?». Now the person gets one line in their language — «Передали
  тренеру — он ответит тебе здесь, в Телеграме» — and the message appears in «Обращения» with
  their name, @username, language and whether they have an app account. `/start` (and any other
  command) still gets the greeting. A photo with a caption is passed on as its caption, marked
  «Вложение: фото — открой чат»; a photo, voice note or sticker with no words gets a polite «only
  text is passed on».
- **The app.** «Написать тренеру» on the Тренер tab (it used to open mail or a Telegram link) and
  «Вопрос или просьба» in Профиль → Данные и согласия open a small sheet with a text field. The
  message goes through `support_message` (0042) with the person's name, address and language taken
  from their profile — never from what the app sends — and the place they wrote from.

**Limits.** Five messages an hour per person, a thousand characters each. Past the limit the bot
says «please wait» once and then stays silent, so a flood cannot turn the bot into a flood of
replies; the app shows the same as an error under the field. A message Telegram delivers twice
(it retries when the function is slow) is recognised and passed on once.

**How the coach replies.** Since 0045, from the admin: **Админка → Обращения** lists every message
with its text (tabs Новые / Отвеченные / Все). «Ответить» writes the reply, and the **main bot**
delivers it to the person's chat with it, signed «Ответ тренера:» / «Coach’s reply:» in their
language and quoting the question when it was asked in the bot. It goes through the bot's queue
(`telegram_outbox`, addressed by chat id — `chat_id`, 0045), so it arrives within ten minutes, and
the card then says «Доставлен», or «Не дошёл» when the person has blocked the bot. Somebody who wrote
from the app without a linked Telegram gets the reply when they next open the app from Telegram (up
to a week); the card offers «Написать на почту» for them. At most 60 replies an hour in all.

The topic message still ends with a link for answering from a personal account:

- `Ответить: @username` — opens the chat with that person. Works always; «Открыть чат» on the card
  is the same link.
- `Ответить: открыть чат в телеграме` (`tg://user?id=…`) — for somebody with no @username. Telegram
  opens it only if the person's privacy settings allow being found this way; the reply through the
  bot reaches them regardless.
- `Ответить на почту: …` — from the app, when no Telegram is linked to the account.

The numeric Telegram id is inside that message, which goes only to the private group. It never
appears in a GitHub Actions log: the bot's own logs say `support queued` / `limited` and nothing
about who.

**Turning it on**, in this order:

1. Actions → Supabase apply → `migration` with **`0042_support.sql`**.
2. Actions → Supabase apply → **`deploy-bot`** — the bot needs the new code to pass messages on.
   It uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase gives every function; no
   new secret.
3. Actions → Supabase apply → **`deploy-notify`** — the sender needs the new code to format the
   «Обращение» message. Until then the rows wait in the queue and none is lost.
4. For the inbox and replies: `migration` with **`0045_support_inbox.sql`**, then **`deploy-notify`**
   (it formats and addresses the reply — deploy it before the first reply, or an older sender marks
   the reply `skipped` as an unknown kind) and **`deploy-bot`** (the bot's «ответ придёт сюда»).

If the bot is deployed before the migration, a message gets «Не получилось передать сообщение
тренеру» back — honest, and nothing is lost that the person cannot resend.

---

## 7.10 What is still only in Russian

Everything written ahead of time is bilingual and the build says so: the interface dictionaries are
parity-checked by the compiler, the courses in `content/` carry `{ru, en}`, and there are as many
English guides as Russian ones. The site proves it — a scan of all 65 English pages finds Russian
only in the names of three Russian statutes, which are citations and stay.

What can fall behind is what gets **typed in the admin**: a day's title, a club task, an exercise's
breathing cue, the prize. Every one of those has a second field beside it (the «Пишем на» switch),
and none of them is required — the coach is a coach, not a translator, and an unfinished translation
must never stop him publishing a day.

So the English half is allowed to be empty, and when it is, the reader sees the Russian. That is
better than a blank, and it is invisible — which is why the count exists:

**Actions → Supabase apply → `translation-check`.** It prints one line per group («Клуб: задание
дня: без английского 3 из 26») and nothing else. No text, no addresses: the run page of a public
repository is visible to everyone, forever.

Two things it deliberately does not do. It never copies Russian into the English column — a Russian
string sitting in `en` is indistinguishable from a translation, and after that nobody can ever tell
what is still untranslated. And it counts a string of spaces as untranslated, the same rule
`pick_l10n()` uses (`0035`), so the count and the product cannot disagree about what a translation
is.

One thing genuinely cannot be pre-translated: the comment the coach writes when he sends a proof
back. It is a message to one person, written in the moment. The right fix there is for him to see
which language that person reads, not for us to translate him.

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
  375 by a CHECK. The streak bonus is gone from the app, so that ceiling is now 20% looser than
  anything the client can legitimately send — which is the safe direction for a clamp to be wrong
  in, and not worth a migration to tighten. The same trigger stamps `started_at` / `completed_at` from the server clock,
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

## 9.1 A test week for the club («Клуб маленьких шагов»)

`supabase/seed-club-week.sql` writes one seven-day club — **one task a day**, no teams, and seven
invented members — so the club's tab can be looked at without typing a week into the admin panel
first. Run it with **Actions → Supabase apply → task = `club-seed`** (§7.8), or paste it into the
SQL editor (Supabase → SQL Editor → New query).

It owns exactly one row — the marathon whose slug is `klub_test` — and rewrites that row, its tasks
and its test cohort every time it runs. Any other marathon is untouched, including a real one
running at the same time. Editing a line in the file and re-running is the intended way to change
the plan.

**Today is day 3.** `starts_on` is `current_date - 2`, so the week already has a past — which is the
point, because the club's screen is half task and half standings and a table of zeroes tells you
nothing about the second half. Change the offset at the top to land on a different day.

**Everyone races alone.** `team_size` is `1`, which is «каждый сам за себя»: no teams, no pairs, and
no task that waits on somebody else. Every rule is `per_member`, because in a club of one-person
entries it is the only rule that means anything. The seed also deletes any team left over from the
paired version of this week — a solo marathon may not have them, and a member still pointing at one
would keep the board drawing pairs.

**One task a day, with a title and nothing else.** No `body` on any row: the name of the task is the
task. Points run 8 to 15 — a harder day is worth more, which is what keeps the board from being
seven-way ties.

### The invented cohort, and why it is not a fabricated result

Section 3 of the file inserts seven people who do not exist, at `@example.test` addresses (`.test`
is reserved by RFC 6761 and can never be delivered to), and the proof they have "already sent". They
exist so the board has rows. They live only inside `klub_test`, a round called «Тестовая неделя»
that only its own members can read, and they never appear on a public surface — which is what keeps
this test data rather than the invented results `docs/SPEC.md` §3 forbids.

Who did which day is **written out** in the file rather than hashed. The hash that used to pick it
was shorter and produced four-way ties at the top of a one-task-a-day week, which is a board that
answers nothing.

Two honest consequences, both written into the file:

- Every task in this week has `late_counts = true`. Without it, proof sent after the day's deadline
  scores zero — correct for a real club, a trap in one being demonstrated at eleven at night, where
  the card gives no hint that the tap was too late. (That missing hint is a real gap in the app, not
  something this seed fixes.)
- `media` proof is not invented. A photograph cannot be faked into the bucket, so day 5's «Фото
  тарелки» scores nothing for anybody — the one day of the week where the board does not move.

### Putting the real people in

Real addresses are **not** in the file and will not be: the repository is public, and an email
committed to it is published forever. Run **Actions → Supabase apply → task = `club-join`** instead.
It reads the address from the `CLUB_TESTER_EMAILS` repository secret — falling back to `PROBE_EMAIL`,
so there is usually no new secret to create — builds the statement inside the runner, and prints
neither the statement nor the response. Several addresses may be given, separated by commas.

Everyone it adds gets no team, because the club has none: each of them is their own row on the
board. Addresses are lower-cased before they are de-duplicated — `marathon_members.email` is
`citext`, so «Owner@…» and «owner@…» are one row, and letting both through makes Postgres refuse
the whole statement.

A member can be added before they have ever signed in; the club finds them by the address they sign
in with, exactly as a course purchase does.

Deleting the whole thing, tasks, people and proof included:

```sql
delete from public.marathons where slug = 'klub_test';
```

Verified against a throwaway Postgres 16 with every migration applied: the script runs clean (7
tasks, 7 invented members, 0 teams, 13 proofs for the three days elapsed), and the week-1 board
reads 36 / 26 / 26 / 24 / 22 / 12 / 10 by name, with the real member last on 0 until she sends
today's one task.

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

| Seeded           | Value                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Entitlements     | `start` and `engine` active; `dumbbells`, `kettlebell`, `athlete` locked                             |
| Training profile | none — the onboarding wizard is part of the walkthrough                                              |
| Workout history  | empty — the first workout really is the first                                                        |
| Benchmarks       | empty; the self-tests and test nodes fill them                                                       |
| Leaderboard      | 12 invented athletes with plausible points, plus your own row computed from your real local sessions |
| Purchases        | four `@example.com` orders (pending / active / refunded) so the admin flows have something to act on |
| Admin            | the demo account is always the coach, so `/admin` is reachable                                       |

The landing order form also works: in demo mode it records the order locally and shows the
success state (no payment redirect), and the order then appears in the admin list where you can
activate it and watch the course unlock.

Two things are deliberately missing: private-bucket videos (a `storage:` reference resolves to
nothing and the player shows the movement's still instead), and any kind of email.

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
