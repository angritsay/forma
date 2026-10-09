# Creators on Forma

The terms Forma offers fitness creators, the unlisted pitch page that states them, and the
outreach message Nastia sends with it. Edit the terms here first, then the page copy
(`src/i18n/{ru,en}/landing.ts`, keys `creators*`), so the two never disagree.

## The page

- `/creators/` and `/en/creators/` — `src/pages/[...lang]/creators.astro`.
- **Unlisted.** Not in `STATIC_PAGES` (`src/lib/seo/pages.ts`), so not in `sitemap.xml` or
  `llms.txt`; not in the nav or the footer; `noindex, nofollow` on the page. Deliberately **not**
  `Disallow`ed in `robots.txt`: a crawler that may not fetch the page never sees its noindex and can
  still index the bare URL from a shared link, and robots.txt is public — it would advertise the
  path. `scripts/seo/lib.mjs` lists the two files in `UNLISTED_PAGES`: the audit
  requires noindex there and fails if either ever lands in the sitemap.
- **The reply goes to Nastia:** `CREATOR_CONTACT` in `content/site/links.ts`
  (`https://t.me/aggritsay`). «Попробовать Forma» opens the app.
- **Figures are read, not typed:** the course name and price from the course file, the club's
  prices from `content/site/plans.ts`, the session lengths, prices and the 20-minute hold from
  `content/site/booking.ts` and `src/lib/coach/slots.ts`. Change a price there and the page follows.
- No user counts, no reviews, no testimonials (`docs/SPEC.md`).

## Terms

Decided (stated publicly on the page). Two tiers since 8 Oct 2026 — the owner chose «Both, in two
tiers» for where creators live and «Free 20% → Pro» for what they pay. The numbers live in
`content/site/creatorTerms.ts`; the page, its calculator and the FAQ read them from there.

|                       | Start (soon)                    | Pro (open now)                        |
| --------------------- | ------------------------------- | ------------------------------------- |
| Monthly fee           | none                            | 4 990 ₽ / $59                         |
| Course and club       | creator 80% / Forma 20%         | creator 90% / Forma 10%               |
| One-to-one sessions   | creator 90% / Forma 10%         | creator 95% / Forma 5%                |
| Where it lives        | the creator's page inside Forma | the creator's own domain, bot and app |
| Who builds it         | the creator, self-serve         | together with Forma's team            |
| Where the money lands | Forma's till; paid out monthly  | the creator's own Prodamus / lava.top |

Pro pays for itself once course and club sales pass 4 990 ₽ / 10% = **49 900 ₽ a month**
(`proBreakEven`); below that, Start leaves the creator more. Start is marked «скоро» on the page
until creator accounts exist (docs/PLATFORM.md) — flip `open` in `creatorTerms.ts` the day they do.

- **What a Pro creator gets, all under their own name:** their own Telegram bot, a promo site on
  their own domain, and the web app on phone and computer (opens from a link, installs to the home
  screen). App Store and Google Play publishing is extra and discussed individually.
- **White-label (Pro).** No Forma branding anywhere the creator's people look: domain, bot, app and the
  payment receipt carry the creator's name.
- On Pro, payments land in the **creator's own Prodamus** (roubles) and **lava.top** (cards from any
  country, priced in dollars) accounts; Forma sets them up. The processor keeps its fee first;
  shares are counted on what is left, and Forma's share is settled per the contract. On Start,
  Forma's own till takes the payment and pays the creator's share out monthly — which needs an
  agency agreement, so that only Forma's share is Forma's income (an accountant confirms this
  before Start opens).
- For a Russian audience we also connect international card payments through lava.top.
- Forma's share covers: the app and the site, setting up Prodamus and lava.top, the bot and its reminders, member
  support, video hosting, the tools, customisation for the creator and production help (cutting,
  labelling and grading clips in Studio).
- Customisation: name, logo, colours and typefaces; course structure; the creator's own exercises
  and clips; rounds, reps or seconds, work and rest to the second; club tasks; the creator's
  session calendar. The page shows it on two fictional brands, a CrossFit coach and a yoga teacher
  (`content/site/creator-examples.ts`) — keep their «tuned» lists to what the builder does today.
- How we start: message Nastia → call → the creator films (Studio cuts it) → we build, the
  creator approves → launch, sales.

Not decided — the page says each is agreed and set in the contract, and promises nothing:

- how and when Forma's share is settled;
- exclusivity;
- content ownership and rights;
- who sets the prices (the page shows Forma's current prices as examples);
- taxes and the legal form of the partnership.

## Outreach message

Nastia sends it personally, with both links. Keep it short; edit freely.

### RU

> Привет! Я Настя, сооснователь Forma — приложения для домашних тренировок. Сертифицированный
> фитнес-тренер и нутрициолог, больше десяти лет в дизайне; Forma делаю вместе с тренером Сергеем
> Титовым.
>
> Пишу, потому что мне нравится, как ты тренируешь, и хочу упаковать твой метод в приложение: твой
> курс, твой клуб, твои занятия один на один. Всё собираем и настраиваем под тебя, помогаем с
> монтажом. На тарифе Pro у тебя будет свой бот, сайт на твоём домене и приложение для телефона и
> компьютера — под твоим именем, Forma нигде не видно. Оплата — на твой Prodamus и lava.top (в том
> числе международными картами), бота и поддержку берём на себя. Тебе — 90% с курса и клуба и 95% с
> занятий, после комиссии Prodamus / lava.top, и 4 990 ₽ в месяц за тариф. Скоро будет и Старт без
> абонентской платы: 80% и 90%, страница внутри Forma.
>
> Первая тренировка — бесплатно: forma-app.co/app/
> Как это устроено для авторов: forma-app.co/creators/
>
> Если откликается — ответь здесь, созвонимся.

### EN

> Hi! I'm Nastia, co-founder of Forma, a home-workout app. I'm a certified fitness trainer and
> nutritionist with over ten years in design, and I build Forma with coach Sergey Titov.
>
> I'm writing because I like the way you train, and I'd love to put your method in an app: your
> course, your club, your one-to-one sessions. We build and tune it all around you and help with
> the editing. On Pro you get your own bot, a site on your domain and an app for phone and computer,
> all under your name with no Forma in sight. Payments go to your own Prodamus and lava.top (cards
> from any country); we run the bot and support. You keep 90% of course and club sales and 95% of
> sessions, after the Prodamus / lava.top fee, for $59 a month. Start, with no monthly fee, is
> coming: 80% and 90%, with your page inside Forma.
>
> Workout 1 is free: forma-app.co/app/
> How it works for creators: forma-app.co/en/creators/
>
> If this resonates, reply here and let's have a call.
