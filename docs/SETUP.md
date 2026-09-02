# Forma — setup runbook

Everything the owner has to provision by hand, in the order it should be done. The code
integrates with the real services described here; nothing is mocked. Expect about an hour for a
first full setup.

Legend: **Dashboard** = the Supabase web console for your project; **repo** = this repository.

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

### Option A — SQL editor (no tooling)

Dashboard → **SQL Editor** → **New query**, paste each file in this order and click **Run**:

1. `supabase/migrations/0001_init.sql` — extensions, tables, triggers, RLS policies, grants
2. `supabase/migrations/0002_functions.sql` — `create_order`, `my_entitlements`,
   admin RPCs, `get_leaderboard`, `get_my_totals`
3. `supabase/migrations/0003_storage.sql` — private `videos` bucket and its policies
4. `supabase/seed.sql` — nothing runs by default; open it, uncomment the `insert into
public.admins` line with the coach's email (see §4)

Each run must end with "Success. No rows returned". If a statement fails, fix the cause and
re-run the whole file — the `create … if not exists` / `drop policy if exists` guards make that
safe.

### Option B — Supabase CLI

```bash
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase login
supabase init              # once; creates supabase/config.toml (commit it or ignore it)
supabase link --project-ref <project-ref>   # the id from the Project URL
supabase db push           # applies supabase/migrations/*.sql in filename order
```

`seed.sql` is intentionally not applied by `db push`; run it in the SQL editor.

### What the migrations create

| Object                                                              | Purpose                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `profiles`                                                          | One row per auth user (trigger `on_auth_user_created`); own row read/write |
| `admins` + `is_admin()`                                             | Coach emails; gate for admin RPCs and video uploads                        |
| `purchases`                                                         | `email ↔ course_id`, status `pending / active / refunded`                  |
| `create_order()`                                                    | Anonymous RPC used by the landing order form (validates, upserts pending)  |
| `my_entitlements`                                                   | View: active courses of the signed-in email                                |
| `admin_set_purchase_status()`, `admin_add_purchase()`               | Admin RPCs behind the `/app/#/admin` screen                                |
| `user_course_state`, `workout_sessions`, `daily_logs`, `benchmarks` | Training data, own rows only                                               |
| `steps_points()` + trigger                                          | Recomputes step points server-side so the leaderboard cannot be gamed      |
| `get_leaderboard()`                                                 | Top 100 + own row; never returns emails                                    |
| `get_my_totals()`                                                   | Points / workouts / minutes for the home screen                            |
| Storage bucket `videos` (private)                                   | Read requires an active purchase of the course in the path, or `shared/`   |

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

### 3.2 Email template — this step is mandatory

Supabase sends the one-time code through the **Magic Link** template (and the **Confirm signup**
template for brand-new users when confirmations are enabled). Out of the box those templates
contain a link, not a code, so the user would never see the code.

Dashboard → **Authentication → Email Templates**:

1. Open **Magic Link**.
2. Subject: `Код для входа в Forma · Your Forma sign-in code`
   (do not put `{{ .Token }}` in the subject — it ends up in notification previews and logs).
3. Replace the body with the contents of `supabase/templates/otp.html`. It is a bilingual
   (RU first, EN below) dark, table-based email with the code in large type and a 10-minute note.
   The template uses `{{ .Token }}`, `{{ .Email }}` and `{{ .SiteURL }}`.
4. Repeat for **Confirm signup** with the same subject and body.
5. There is no separate plain-text field in the dashboard; `supabase/templates/otp.txt` is the
   fallback to use if you send through a provider that asks for a text part.
6. Send yourself a code from the app's sign-in screen and check that the email shows six digits.

### 3.3 URL configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production origin, e.g. `https://<user>.github.io/<repo>` or
  `https://forma.example.com`. It only feeds `{{ .SiteURL }}` in the email footer — the app does
  not use redirects.
- **Redirect URLs**: nothing to add. The OTP flow never redirects.

### 3.4 Rate limits

Dashboard → **Authentication → Rate Limits**:

- The built-in email sender allows only a handful of emails per hour and is meant for
  development. **Set up custom SMTP before launch** (3.5); with custom SMTP raise "emails per
  hour" to something like 100–300.
- Keep "OTP requests per 5 minutes" and "token verifications" at their defaults; the app enforces
  a 60-second resend timer on top.

### 3.5 Custom SMTP (deliverability)

Dashboard → **Project Settings → Authentication → SMTP Settings** → enable custom SMTP.

Recommended providers (all have a free tier that covers a small course business):

| Provider                | Good for                                  | Notes                                                                 |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Resend                  | Simplest setup, EU region                 | Verify your domain (SPF + DKIM) in Resend, then use `smtp.resend.com` |
| Postmark                | Best transactional inboxing               | Use the "Transactional" message stream                                |
| Yandex 360 for Business | RU audience, mail.ru / yandex.ru inboxing | Use an app password, `smtp.yandex.ru:465`                             |
| Mail.ru for business    | RU audience                               | `smtp.mail.ru:465`, app password                                      |

Set **Sender email** to an address on your own domain (e.g. `hello@forma.example.com`) and
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

| Variable                                                                                               | Local `.env` | GitHub Pages      | Value                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------ | ----------------- | ---------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                                                                                  | yes          | repo **variable** | Project URL from §1                                              |
| `PUBLIC_SUPABASE_ANON_KEY`                                                                             | yes          | repo **variable** | anon / publishable key from §1                                   |
| `SITE_URL`                                                                                             | yes          | repo **variable** | `https://<user>.github.io/<repo>` or `https://forma.example.com` |
| `BASE_PATH`                                                                                            | yes          | repo **variable** | `/<repo>/` for a project page, `/` for a custom domain           |
| `INDEXNOW_KEY`                                                                                         | optional     | repo **secret**   | 8–128 hex/alphanumeric chars; see docs/SEO.md                    |
| `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`, `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION` | optional     | repo variables    | Rendered only when set                                           |

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

### 7.3 Automating later

If you adopt a provider with webhooks, add a Supabase Edge Function that verifies the webhook
signature and runs `update public.purchases set status='active', activated_at=now() where
email=… and course_id=…` with the service role key. Nothing in the frontend has to change.

---

## 8. Security notes

- **The anon key is public by design.** It only identifies the project; every table has Row
  Level Security and the policies in `0001_init.sql` decide what a request may do. The
  `service_role` key must never appear in the repo, in `.env.example`, in CI logs or in the
  browser.
- **What anonymous requests can do**: call `create_order()` (rate-guarded: max 10 pending orders
  per email) — nothing else. They cannot read `purchases`, profiles or videos.
- **What signed-in users can do**: read/write their own rows, read their own purchases, read the
  leaderboard (no emails in it), sign video URLs for courses they own.
- **Admins** are just emails in `public.admins`; `is_admin()` is evaluated on the server for
  every admin RPC and storage policy, so a modified client cannot escalate.
- **Points integrity**: step points are recomputed by a trigger; workout points are client
  computed but capped by a CHECK (`0..500`). If you ever see abuse, move `estimatePoints()` into
  an RPC.
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

**Leaderboard is empty**

Only sessions with `completed_at` set and step logs count, and the weekly board resets on Monday
00:00 UTC. Also `get_leaderboard` requires a signed-in user.

**Admin link does not show**

The signed-in email is not in `public.admins`, or differs from the one inserted (check for a
typo; case is ignored). Sign out and back in after inserting.
