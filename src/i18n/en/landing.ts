/** Landing copy. Owned by the landing area; keep keys in sync with ru/landing.ts. */
export const landing = {
  // Navigation / footer
  navCourses: 'Courses',
  navExercises: 'Exercises',
  navGuides: 'Guides',
  navSubscribe: 'Club',
  navHome: 'Home',
  navContact: 'Contact',
  navMenu: 'Menu',
  skipToContent: 'Skip to content',
  navLanguage: 'Language',
  // Caption for the age mark in the footer: "18+" on its own is a number and says nothing to a
  // screen reader.
  footerAgeLabel: 'For adults',
  footerPrivacy: 'Privacy policy',
  footerTerms: 'Terms of service',
  footerRefund: 'Refund policy',
  footerContact: 'Contact',
  footerProduct: 'Product',
  footerLegal: 'Legal',
  footerReach: 'Get in touch',
  // Shell v2 (PR 2): short nav items, sign-in, Telegram, the line under the mark in the footer.
  navCourse: 'Course',
  navCoach: 'Coach',
  navTogether: 'Together',
  navSignIn: 'Sign in',
  openTelegram: 'Open in Telegram',
  footerTagline: 'Home CrossFit in small steps.',

  // Plural words
  courseWordOne: 'course',
  courseWordFew: 'courses',
  courseWordMany: 'courses',
  weekWordOne: 'week',
  weekWordFew: 'weeks',
  weekWordMany: 'weeks',
  workoutWordOne: 'workout',
  workoutWordFew: 'workouts',
  workoutWordMany: 'workouts',
  // A block's own count, on the pill that names its format: «1 round», «3 rounds».
  roundWordOne: 'round',
  roundWordFew: 'rounds',
  roundWordMany: 'rounds',
  setWordOne: 'set',
  setWordFew: 'sets',
  setWordMany: 'sets',
  sessionsPerWeek: '{n} {word} a week',
  avgSession: '~{n} min',
  priceFree: 'Free',

  // Home: SEO. The title already names Forma, so no suffix is added.
  homeTitle: 'Forma — home CrossFit: your first workout is free',
  homeDescription:
    'Home CrossFit in small steps: short workouts with no jumping, and the load adapts to you. The first one is free, no card needed.',

  // Home: hero. The key word is «today»; the thin part is «Your first workout —».
  heroEyebrow: 'In small steps',
  heroTitle: 'Home CrossFit. Your first workout — today',
  heroThin: 'Your first workout —',
  heroSubtitle:
    'Small steps: 13–20 minutes with the warm-up, just a chair and a mat. Sergey shows every movement on video, and the load adapts after each workout. The first one is free, no card.',
  heroChipFree: 'The first one is free',
  heroChipTime: '13–20 minutes',
  heroChipNoKit: 'No equipment',
  heroChipVideo: 'The coach’s video for every move',
  heroChipNoJumps: 'No jumping',
  heroSignIn: 'Already training? Sign in',
  heroCtaApp: 'Open app',
  chipCourses: '{n} {word}',

  // Home, 01: workout 1.
  firstEyebrow: 'Workout 1',
  firstTitle: 'Here it is — workout 1',
  // {work} is the engine's minutes of work («3 min»), never typed by hand.
  firstIntro:
    'On a timer: a new movement every minute, {work} of work in all. Before and after, a warm-up and a cool-down — about {total} minutes with them.',
  firstQuote:
    'Your first workout should not wipe you out — it should make you want to come back for the second.',
  firstCourseTag: 'First workout free',
  firstCoursePrice: '{price} for life · a week of the club as a gift',
  firstCourseLine:
    'Workout 1 opens the {course} course: 20 workouts, 4 blocks of 5, at your own pace.',
  firstCourseMore: 'Course programme',
  firstCta: 'Do workout 1',

  // Home, 02: together from Monday. No «join as a pair, get an hour» promise.
  togetherEyebrow: 'Together from Monday',
  togetherTitle: 'Bring someone along — start on Monday',
  togetherIntro:
    'Starting alone is easy to put off; with someone else, you would rather not let them down. Take the link right here, no sign-up.',
  togetherLinkLabel: 'A link to send',
  togetherLinkHint: 'Your friend opens this same page — and sees the same three steps.',
  togetherPersonal:
    'A personal link is made in the app: if someone pays for the club through it, you both get +30 days of the club.',
  togetherPersonalCta: 'Make the link personal',
  togetherNoDiscount: 'No discount — just days, and a partner.',
  togetherStep1Title: 'Send the link',
  togetherStep1Text:
    'Copy it here and send it to a friend — on Telegram, WhatsApp or wherever suits.',
  togetherStep2Title: 'Monday — workout 1',
  togetherStep2Text: 'Each of you at home. Free, about {total} minutes.',
  togetherStep3Title: 'Then — together in the club',
  togetherStep3Text:
    'If you like: the club by subscription, one board for the two of you, and the pair on top on Sunday gets an hour with the coach each.',

  // Home, 03: the load follows you (DifficultyDemo).
  adaptEyebrow: 'How the load adapts',
  adaptTitle: 'The load follows you',
  adaptIntro:
    'Before a workout you choose: easier, as usual or harder — the app suggests one. Afterwards, one rating, and the next shifts by a few percent. No max-effort grinding.',
  adaptWorkoutLabel: 'Workout from the {course} course: {workout}',
  adaptRecommended: 'Recommended',
  adaptPlanTitle: 'Your plan',
  // «72 points» under the minutes of a difficulty row; the engine's real figure for this workout.
  adaptPointsOne: '{n} point',
  adaptPointsFew: '{n} points',
  adaptPointsMany: '{n} points',
  adaptRpeTitle: 'After the workout, one rating',
  adaptRpeIntro: 'How hard was it on a 1–10 scale? Your answer sets the next load.',
  adaptRpeEasy: 'Easy · RPE 5',
  adaptRpeOk: 'Just right · RPE 7',
  adaptRpeHard: 'Too hard · RPE 9',
  adaptRpePain: 'Something hurt',
  adaptNextTime: 'Next time',
  adaptScaleNow: 'Load scale: {scale}',
  adaptHowTitle: 'The rules behind it',
  /* The engine's constants as pills — see the Russian file. */
  adaptRuleEasy: 'Easy → {x}',
  adaptRuleModerate: 'Just right → {x}',
  adaptRuleHard: 'Too hard → {x}',
  adaptRulePain: 'Something hurt → {x}',
  adaptRuleEasier: 'Easier · volume ×{x}',
  adaptRuleHarder: 'Harder · volume ×{x}',
  adaptRow1Title: 'The start — five questions',
  adaptRow1Text: 'No max-effort tests. A check after the second workout, {n} minutes.',
  adaptRow2Title: 'Sore spots are spared',
  adaptRow2Text: 'Knees, back, shoulders, wrists: the movements change, not only the reps.',
  adaptRow3Title: 'A missed day breaks nothing',
  adaptRow3Text: 'The course counts workouts, not days in a row.',
  adaptCta: 'Try it on workout 1',

  pathNodeLocked: 'Locked',
  cardView: 'View course',
  /* The ticket's kicker: what kind of thing this is («Course · Beginner»), as in the app. */
  cardKicker: 'Course',

  // Home, 04: the Small Steps club. Title, lead and features are the app's keys (`app.club*`).
  clubEyebrow: 'The club — to keep going',
  clubSoloTitle: 'Solo or as a pair',
  clubDuoPrize: 'In a duo the prize is an hour with the coach for each of the pair.',
  clubBotTitle: 'Messages on Telegram',
  clubBot:
    'If you connect Telegram, the bot sends the task in the morning, reminds you in the evening if your streak is at risk, and sums up the week on Sunday evening. Messages can be switched off.',
  clubFirstFree: 'Workout 1 first — it is free',
  clubInvite: 'Bring someone along — +30 days',

  // Home, 05: coach.
  coachEyebrow: 'Coach',
  coachTitle: 'Sergey Titov — half an hour or an hour online',
  coachCredentials: 'Credentials',
  coachMore: 'More about the coach',
  coachBook: 'Book a one-to-one',
  coachBookHint: 'Half an hour or an hour online · from {price} · in the app',

  // Home: before and after (caption: `app.clubPhotosClientsRow`).
  // Deliberately does not claim these came from the courses on this page. They are Sergey's
  // one-to-one clients; saying otherwise would be a claim we cannot substantiate.
  resultsEyebrow: 'Sergey’s clients',
  resultsTitle: 'Before and after — from one-to-one sessions',
  resultsBefore: 'Before',
  resultsAfter: 'After',

  // Home, 06: prices.
  pricesEyebrow: 'Prices',
  pricesTitle: 'Starting is free',

  // Home, 07: FAQ + the closing call.
  faqEyebrow: 'FAQ',
  faqTitle: 'Frequently asked questions',
  homeCtaTitle: 'Workout 1 is waiting',
  homeCtaText: 'About {total} minutes, a chair and a mat. Free, no card.',
  homeCtaNote:
    'The app runs in the browser, nothing to download — add it to your home screen and it opens with one tap.',
  // The closing call on other pages (about, courses).
  ctaTitle: 'Start with the first workout',
  ctaText: 'Pick a course, enter your email and train at home at your own pace.',
  ctaPrimary: 'Choose a course',
  ctaSecondary: 'Open app',

  // Courses hub
  coursesHubTitle: 'Home CrossFit courses — with or without equipment',
  coursesHubDescription:
    'Forma. Start: twenty no-equipment home CrossFit workouts, a load that adapts to you, the coach’s video for every move. Plus the club and the coach in Telegram.',
  coursesHubH1: 'Courses',
  coursesHubIntro: 'Twenty workouts in order, at your own pace. Lifetime access.',
  filterEquipment: 'Equipment',
  filterLevel: 'Level',
  filterAll: 'All',
  filterReset: 'Reset filters',
  filterNoResults: 'No courses match these filters.',
  filterResultsLabel: 'Courses',

  // Course page
  courseTitleSuffix: 'home course',
  courseCtaOrder: 'Get access',
  courseAboutTitle: 'About the course',
  courseForWhomTitle: 'Who it is for',
  courseOutcomesTitle: 'What you will get',
  courseEquipmentTitle: 'Equipment',
  courseEquipmentNone: 'No equipment — you need a sturdy chair and a mat',
  courseProgramTitle: 'Program',
  courseProgramIntro: 'Week by week. Tap a week to see its days.',
  courseWeek: 'Week {n}',
  courseDay: 'Day {n}',
  courseDeload: 'Deload',
  // This block was a shop window. Now it is an invitation: the same workout, except it can be
  // done rather than only read.
  courseSampleTitle: 'The first workout is free',
  courseSampleIntro:
    'Here it is in full — as in the app, before it is scaled to your level. You can do it right now, no card and no payment.',
  courseSampleCta: 'Do it in the app',
  courseFreeFirst: 'First workout free',
  courseAdaptTitle: 'How the app adapts',
  courseAdaptText:
    'Before a workout you choose Easier, As usual or Harder. Afterwards you rate the effort from 1 to 10 and the next load shifts.',
  // The three numbers of that paragraph, as pills.
  courseAdaptEasy: '+5 % when easy',
  courseAdaptHard: '−5 % when too hard',
  courseAdaptDeload: 'Deload built in',
  /* «About the course» shows one paragraph; the rest of the coach's text opens under this. */
  courseMoreAbout: 'More about the course',
  // «2 rest days» on a week's row of the program.
  restDayOne: 'rest day',
  restDayFew: 'rest days',
  restDayMany: 'rest days',
  courseFaqTitle: 'Course FAQ',
  courseGuidesTitle: 'Related guides',
  courseExercisesTitle: 'Exercises in this course',
  courseOrderTitle: 'Get access to the course',
  courseOrderIntro:
    'Leave your email and pay — access opens automatically and the course appears in the app under this email.',
  courseLifetimeNote: 'One payment, access forever',
  courseOrSubscribe: 'Or the club with the course — {price} a month, paid yearly',
  nodeWorkout: 'Workout',
  // It said «7,000 steps» while the app counted steps (see the Russian file).
  nodeRest: 'Walk',
  nodeTest: 'Test',
  nodeBenchmark: 'Benchmark',
  nodeMilestone: 'Milestone',
  blockRounds: '{n} {word}',
  blockSets: '{n} {word}',
  blockMinutes: '{n} min',
  blockTabata: '{work}s on / {rest}s off × {n}',
  breadcrumbHome: 'Home',
  breadcrumbCourses: 'Courses',

  // Order form
  orderEmailLabel: 'Email',
  orderEmailPlaceholder: 'you@example.com',
  orderConsent: 'I agree to the {privacy}',
  orderConsentPrivacy: 'privacy policy',
  orderSubmit: 'Get access',
  orderSubmitting: 'Sending…',
  orderRedirecting: 'Taking you to payment…',
  /* See the note on the Russian string — the quoted product wording is the processor's own. */
  orderPaymentNote:
    'Payment is handled on {host}. Use the same email you entered here: access opens automatically as soon as the payment lands, and another address will not be matched to the order.',
  orderPayAnyway: 'Go to payment anyway',
  orderSuccessTitle: 'Order received',
  orderSuccessText:
    'We have recorded {course} for {email}. Access opens automatically once the payment lands — sign in to the app with this email.',
  orderSuccessApp: 'Open the app',
  orderErrorEmail: 'Check the email — the address does not look right.',
  orderErrorConsent: 'Please agree to the privacy policy.',
  orderErrorNetwork: 'No connection. Check your internet and try again.',
  orderErrorGeneric: 'We could not send the order. Try again or write to us: {email}.',
  orderNotConfigured:
    'Ordering is not connected yet. Write to us and we will open access manually:',
  orderTryAgain: 'Try again',

  // Subscribe page
  subscribeTitle: 'The Small Steps Club and a home course',
  subscribeDescription:
    'The Small Steps Club: one small task a day, a weekly board with a prize, a streak and a partner. The Start course is included. Monthly or yearly.',
  subscribeEyebrow: 'The club',
  subscribeLead:
    'Big plans do not survive a working week. The club is one small task a day, a weekly board and a partner — and the Start course is already inside.',
  subscribeIncludes: 'What you get',
  subscribePlanLabel: 'Plan',
  subscribePerMonth: '/ month',
  subscribePerYear: '/ year',
  subscribeBestValue: 'Best value',
  subscribeOrderTitle: 'Join the club',
  subscribeOrderIntro:
    'Leave your email and pay on the next page — the club and the course open in the app under this email on their own.',
  // This line sits under the pay button and promised auto-renewal, which does not exist — see
  // `content/site/plans.ts`. The plan card said the opposite two rows above it.
  subscribeNote: 'One payment · access for the whole paid period · renew whenever you want',
  subscribeSuccessText:
    'We have recorded {course} for {email}. Once the payment lands, access opens automatically — sign in to the app with this email.',
  subscribeCourseHint: 'Just the course, for good?',
  subscribeCourseLink: 'See the course',
  subscribeVsTitle: 'Course or club?',
  subscribeVsCourse:
    'One course, paid once, yours forever — with the first week of the club as a gift. Right when you want a training programme.',
  subscribeVsPlan:
    'The club and the course, paid monthly or yearly: a task every day, the board, a streak and a partner. Right when the goal is to keep going.',
  subscribeFaq1Q: 'What is the task of the day?',
  // There is nothing to cancel: nothing is ever charged unless you pay for a period.
  subscribeFaq1A:
    'One small thing: ten minutes on foot, twenty squats, a glass of water before coffee. Done it — mark it in the app and earn points on the weekly board. The week’s leader gets a prize.',
  subscribeFaq2Q: 'What happens when the paid period ends?',
  subscribeFaq2A:
    'The club and the course close, your progress and stats stay. There is no auto-renewal: money only moves when you pay. Renew and you continue where you stopped.',
  subscribeFaq3Q: 'I already bought the course. Why the club?',
  // It said «the other four». There are six courses and one is published: a number here promises
  // programmes that are not on the site yet.
  subscribeFaq3A:
    'A bought course is yours forever, and the first week of the club comes with it. The subscription keeps you in the club after that: a task every day, the weekly board, a streak and a partner.',

  // About
  aboutTitle: 'About the coach',
  aboutDescription:
    'Who runs the Forma courses, how adaptive load works, and why safety and consistency beat records.',
  aboutPhilosophyTitle: 'Principles',
  aboutPhilosophy1Title: 'Load that fits you',
  aboutPhilosophy1Text:
    'No two people are the same, so no two workouts should be. Tests set your starting level; from there the load follows your effort ratings.',
  aboutPhilosophy2Title: 'Safety',
  aboutPhilosophy2Text:
    'Technique before volume. Every exercise comes with cues and common mistakes, and every one has an easier version. Pain is a signal to reduce load, not to push through.',
  aboutPhilosophy3Title: 'Consistency',
  aboutPhilosophy3Text:
    'Results come from weeks in a row, not one hard session. That is why the app counts workouts rather than unbroken days, and a missed day resets nothing.',
  aboutScienceTitle: 'The science, briefly',
  aboutScienceText:
    'The programs draw on ACSM and WHO physical-activity guidelines, progressive overload and RPE-based autoregulation.',
  aboutScienceLink: 'Read the guides',
  /*
   * The figures under the coach's name used to have their words here — `aboutFigureSince`,
   * `aboutFigureHours`, `aboutFigureSport`. They are `COACH.figures[].label` now: the page was
   * keeping a second copy of a list content already holds, and the copy drifted the moment a
   * credential was struck from the record.
   */

  // Contact
  contactTitle: 'Contact',
  contactDescription:
    'How to reach Forma: email and Telegram. We answer in the order received — about course access, app login and refunds.',
  contactIntro:
    'Write to us if the code did not arrive, a course did not open or you have a question about the program.',
  contactEmail: 'Email',
  contactTelegram: 'Telegram',
  contactOrder: 'We answer in the order received.',
  contactBeforeTitle: 'Before you write',
  contactBefore1: 'No code? Check the spam folder and request a new one after a minute.',
  contactBefore2:
    'Course missing after paying? Check that you signed in with the email you paid with. If it matches, write to us from that address.',
  contactBefore3: 'For refunds, see the refund policy.',

  // Legal
  legalUpdated: 'Last updated: {date}',
  legalContents: 'Contents',
  privacyTitle: 'Privacy policy',
  privacyDescription:
    'What data Forma collects (email, name, training data), why, where it is stored and how to change or delete it.',
  termsTitle: 'Terms of service',
  termsDescription:
    'Terms for buying a Forma digital training program: access, lifetime use, health disclaimer, restrictions and liability.',
  refundTitle: 'Refund policy',
  refundDescription:
    'How to get a refund for a Forma course: {days} days after activation if fewer than {n} workouts are completed.',

  // 404
  notFoundTitle: 'Page not found',
  notFoundText: 'This page does not exist or has moved.',
  notFoundHome: 'Go home',
  notFoundApp: 'Open app',

  // Home v2 (PR 2): building blocks — start form, sticky bar, club, coach, prices.
  startEmailLabel: 'Email',
  startEmailPlaceholder: 'Your email — optional',
  startCta: 'Start free',
  startHint: 'We email you a code — no password, no card',
  startEmailInvalid: 'Check the address — or leave the field empty',
  shareCta: 'Bring someone along',
  shareTitle: 'Forma — home CrossFit',
  shareText:
    'Shall we train together? Forma is home CrossFit in small steps. The first workout is free.',
  copyLink: 'Copy the link',
  copyLinkDone: 'Link copied',
  stickyRegion: 'Quick start',
  clubPriceMonth: '{price} / mo',
  clubPriceYear: '{price} a year',
  clubJoinYear: 'Join — {price} a year',
  clubChargeShort: '{price} a year, one payment',
  clubOr30: 'Or 30 days of access — {price}',
  clubNoAutoRenew: 'No auto-renewal',
  ticketsMinutes: '{n} minutes',
  ticketsHalfCta: 'Choose half an hour',
  ticketsHourCta: 'Choose an hour',
  ticketsPickTime: 'Pay, then pick a time',
  ticketsWrite: 'Pay, then write — the coach sets the time',
  ticketsNote: 'No refunds — a session can be moved if you write at least 24 hours ahead.',
  ladderLabel: 'Prices',
  ladderFreeTitle: 'Workout 1',
  ladderFreePrice: '{price} — no card, repeat it as often as you like',
  ladderCourseTitle: 'The {course} course, yours for good',
  ladderCourseNote: 'a week of the club as a gift',
  ladderCourseCta: 'Buy the course',
  ladderClubTitle: 'The club and the course',
  ladderClubBadge: 'Best value',
  ladderCoachTitle: 'The coach, one to one',
  ladderCoachPrice: 'Half an hour — {half} · an hour — {hour}',
  ladderCoachCta: 'Book the coach',
  ladderFootnote:
    'No auto-renewal: a paid period simply ends. The course and the club can be refunded within {days} days if fewer than {n} workouts are done.',
  phonesLabel: 'Workout 1 in the app',
  phonesPath: 'The course path',
  phonesToday: 'today',
  phonesPlayer: 'Player',
  phonesMinute: 'Minute {n} of {total}',
  phonesAfter: 'After the workout',
  qrLabel: 'Open it on your phone — point the camera',
} as const;
