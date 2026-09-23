/** Landing copy. Owned by the landing area; keep keys in sync with ru/landing.ts. */
export const landing = {
  // Navigation / footer
  navCourses: 'Courses',
  navExercises: 'Exercises',
  navGuides: 'Guides',
  navAbout: 'About',
  navSubscribe: 'Club',
  navApp: 'Open app',
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

  // Home: SEO
  homeTitle: 'Forma — home CrossFit that adapts to you',
  homeDescription:
    'Home CrossFit with coach Sergey Titov: the no-equipment Start course, a club with one small task a day, and the coach on hand in Telegram.',

  // Home: hero
  heroTitle: 'Home CrossFit that adapts to you',
  // One line under the headline; the facts it used to carry are the pills below it.
  heroSubtitle: 'Courses for home training, with or without equipment — the load adapts to you.',
  // The home page’s main button: not “look” but “do”.
  heroCtaFree: 'Train for free',
  heroCtaCourses: 'Choose a course',
  heroCtaApp: 'Open app',
  heroTileTop: 'Adaptive load',
  chipCourses: '{n} {word}',
  chipLifetime: 'Lifetime access',
  chipAdaptive: 'Adapts to you',
  chipHome: 'At home, with or without equipment',
  chipVideo: 'Video for every exercise',

  // Home: how it works
  howEyebrow: 'How it works',
  howTitle: 'Three steps to your first workout',
  howStep1Title: 'Pick a course',
  howStep1Text: 'The coach’s week-by-week program, with a test at the start and the end.',
  howStep2Title: 'Enter your email',
  howStep2Text: 'No passwords: your email on the course page, and the course is yours for good.',
  howStep3Title: 'Log in with a code and train',
  howStep3Text: 'Enter the code from the email and go: the path, the timer, technique cues.',

  // Home: courses
  resultsEyebrow: 'Results',
  resultsTitle: 'Before and after',
  // Deliberately does not claim these came from the courses on this page. They are Sergey's
  // one-to-one clients; saying otherwise would be a claim we cannot substantiate.
  resultsIntro:
    'People Sergey has coached. Every photograph is published with that person’s permission.',
  resultsBefore: 'Before',
  resultsAfter: 'After',
  coursesEyebrow: 'Courses',
  coursesTitle: 'Pick your program',
  coursesIntro:
    'A week-by-week program with a test, rest days and a deload. Buy once, keep forever.',
  coursesAll: 'All courses',
  cardView: 'View course',
  /* The ticket's kicker: what kind of thing this is («Course · Beginner»), as in the app. */
  cardKicker: 'Course',

  // Home: adaptive load demo
  adaptEyebrow: 'Adaptive load',
  adaptTitle: 'Every workout comes in three versions. The app tells you which one is yours',
  adaptIntro:
    'Before you start, choose Easier, As usual or Harder. Afterwards, one effort rating, and the next workout adjusts.',
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
  /* The engine's constants as pills, not as three sentences — see the Russian file. */
  adaptRuleEasier: 'Easier · volume ×{x}',
  adaptRuleHarder: 'Harder · volume ×{x}',
  adaptRulePoints: 'Points ×{easier} / ×{harder}',
  // The two streak pills went with the streak itself: the course schedules rest days.
  adaptRuleDeload: 'Deload · volume ×{x}',

  // Home: path & motivation
  pathEyebrow: 'Path & motivation',
  pathTitle: 'Every week feels like a level in a game',
  pathIntro: 'Twenty workouts and the tests come in order — you always see where you are.',
  // «Streak» and «7,000 steps on rest days» stood here. Neither is in the app any more.
  pathCountTitle: 'Workout count',
  pathCountText: 'Every workout counts. A week off resets nothing — the number only goes up.',
  pathBoardTitle: 'Leaderboard',
  pathBoardText: 'Points from your workouts go into one leaderboard: this week and all time.',
  pathYou: 'you',
  pathWeekdays: 'M,T,W,T,F,S,S',
  pathNodeDone: 'Done',
  pathNodeCurrent: 'Up next',
  pathNodeOpen: 'Open',
  pathNodeLocked: 'Locked',

  // Home: inside a workout
  insideEyebrow: 'Inside a workout',
  insideTitle: 'Explain, show, time it',
  insideIntro: 'The player walks you through every exercise: what, how, how much — then rest.',
  insideStep1Title: 'Explain',
  insideStep1Text: 'Technique cues and common mistakes before every exercise.',
  insideStep2Title: 'Animate',
  insideStep2Text: 'The figure shows the movement at tempo; where there is a video, it is here.',
  insideStep3Title: 'Timer or reps',
  insideStep3Text: 'Seconds count down on their own; you tick off reps with Done.',
  insideStep4Title: 'Rest',
  insideStep4Text: 'A countdown to the next exercise — skip it if you are ready.',
  insideTimerLabel: 'Timer',
  insideRepsLabel: 'Reps',
  insideRestLabel: 'Rest',

  // Home: coach
  coachEyebrow: 'Coach',
  coachCredentials: 'Credentials',
  coachMore: 'More about the coach',
  coachBook: 'Book a one-to-one',
  coachBookHint: 'Half an hour or an hour online · from {price} · in the app',

  // Home: FAQ + CTA
  faqEyebrow: 'FAQ',
  faqTitle: 'Frequently asked questions',
  ctaTitle: 'Start with the first workout',
  ctaText: 'Pick a course, enter your email and train at home at your own pace.',
  ctaPrimary: 'Choose a course',
  ctaSecondary: 'Open app',

  // Courses hub
  coursesHubTitle: 'Home CrossFit courses — with or without equipment',
  coursesHubDescription:
    'Forma. Start: twenty no-equipment home CrossFit workouts, a load that adapts to you, the coach’s video for every move. Plus the club and the coach in Telegram.',
  coursesHubH1: 'Courses',
  coursesHubIntro: 'A week-by-week program with a test at the start and the end. Lifetime access.',
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
  courseEquipmentNone: 'No equipment — a mat is enough',
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
    'Results come from weeks in a row, not one hard session. That is why the app counts workouts rather than unbroken days, and the courses have deload weeks.',
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
} as const;
