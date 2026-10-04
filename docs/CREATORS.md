# Creators on Forma

The terms Forma offers fitness creators, the unlisted pitch page that states them, and the
outreach message Nastia sends with it. Edit the terms here first, then the page copy
(`src/i18n/{ru,en}/landing.ts`, keys `creators*`), so the two never disagree.

## The page

- `/creators/` and `/en/creators/` — `src/pages/[...lang]/creators.astro`.
- **Unlisted.** Not in `STATIC_PAGES` (`src/lib/seo/pages.ts`), so not in `sitemap.xml` or
  `llms.txt`; not in the nav or the footer; `noindex, nofollow` on the page; `Disallow` for both
  paths in `robots.txt`. `scripts/seo/lib.mjs` lists the two files in `UNLISTED_PAGES`: the audit
  requires noindex there and fails if either ever lands in the sitemap.
- **The reply goes to Nastia:** `CREATOR_CONTACT` in `content/site/links.ts`
  (`https://t.me/aggritsay`). «Попробовать Forma» opens the app.
- **Figures are read, not typed:** the course name and price from the course file, the club's
  prices from `content/site/plans.ts`, the session lengths, prices and the 20-minute hold from
  `content/site/booking.ts` and `src/lib/coach/slots.ts`. Change a price there and the page follows.
- No user counts, no reviews, no testimonials (`docs/SPEC.md`).

## Terms

Decided (stated publicly on the page):

| Product                | Creator | Forma |
| ---------------------- | ------- | ----- |
| Course (one-off sale)  | 80%     | 20%   |
| Club (year or 30 days) | 80%     | 20%   |
| One-to-one sessions    | 90%     | 10%   |

- Shares are counted on the amount **after the payment processor's fee**.
- Forma's share covers: the app and the site, taking payments, the bot and its reminders, member
  support, video hosting, the tools, customisation for the creator and production help (cutting,
  labelling and grading clips in Studio).
- Customisation: course structure, the creator's own exercises and clips, screen layout, timings,
  formats (EMOM, AMRAP, rounds, intervals), club tasks, the creator's session calendar.
- How we start: message Nastia → call → the creator films (Studio cuts it) → we build, the
  creator approves → launch, sales, payouts.

Not decided — the page says each is agreed and set in the contract, and promises nothing:

- payout schedule;
- exclusivity;
- content ownership and rights;
- who sets the prices (the page shows Forma's current prices as examples);
- taxes and the legal form of the partnership.

## Outreach message

Nastia sends it personally, with both links. Keep it short; edit freely.

### RU

> Привет! Меня зовут Настя, я сооснователь Forma — приложения для тренировок дома с курсами,
> клубом и занятиями с тренером. Я сертифицированный фитнес-тренер и нутрициолог, больше десяти
> лет в дизайне, а Forma делаю вместе с тренером Сергеем Титовым.
>
> Ищу авторов, чей метод хочется упаковать в приложение: твой курс, твой клуб, твои занятия один
> на один. Мы собираем и настраиваем всё под тебя — от структуры курса до вёрстки и таймингов,
> помогаем с монтажом, берём на себя оплату, бота и поддержку. Тебе — 80% с курса и клуба и 90% с
> занятий, после комиссии платёжки.
>
> Попробуй сам(а): forma-app.co/app/
> Как это устроено для авторов: forma-app.co/creators/
>
> Если откликается — ответь мне здесь, созвонимся.

### EN

> Hi! I'm Nastia, co-founder of Forma — a home-workout app with courses, a club and sessions with a
> coach. I'm a certified fitness trainer and nutritionist with over ten years in design, and I
> build Forma together with coach Sergey Titov.
>
> I'm looking for creators whose method deserves its own app: your course, your club, your
> one-to-one sessions. We build and customise everything around you — from the course structure
> to the layout and timings — help with the editing, and take care of payments, the bot and
> support. You keep 80% of course and club sales and 90% of sessions, after payment fees.
>
> Try it yourself: forma-app.co/app/
> How it works for creators: forma-app.co/en/creators/
>
> If this resonates, just reply here and let's have a call.
