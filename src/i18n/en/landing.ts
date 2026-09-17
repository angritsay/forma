/** Landing copy. Owned by the landing area; keep keys in sync with ru/landing.ts. */
export const landing = {
  // Navigation / footer
  navCourses: 'Courses',
  navExercises: 'Exercises',
  navGuides: 'Guides',
  navAbout: 'About',
  navSubscribe: 'Subscription',
  navApp: 'Open app',
  navHome: 'Home',
  navContact: 'Contact',
  navMenu: 'Menu',
  skipToContent: 'Skip to content',
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
    'Five home CrossFit courses, with or without equipment. Lifetime access, a load that adapts to your level, video for every exercise.',

  // Home: hero
  heroTitle: 'Home CrossFit that adapts to you',
  // One line under the headline; the facts it used to carry are the pills below it.
  heroSubtitle: 'Courses for home training, with or without equipment — the load adapts to you.',
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
  adaptRuleEasier: 'Easier · volume ×0.85',
  adaptRuleHarder: 'Harder · volume ×1.15',
  adaptRulePoints: 'Points ×0.8 / ×1.25',
  adaptRuleStreak7: '7-day streak · +10 %',
  adaptRuleStreak30: '30-day streak · +20 %',
  adaptRuleDeload: 'Deload · volume ×0.65',

  // Home: path & motivation
  pathEyebrow: 'Path & motivation',
  pathTitle: 'Every week feels like a level in a game',
  pathIntro: 'Workouts, tests and rest days come in order — you always see where you are.',
  pathStreakTitle: 'Streak',
  pathStreakText: 'A day counts when you finish a workout or hit your steps goal.',
  pathStreakBonus: '+10 % from day 7',
  pathStepsTitle: '7,000 steps on rest days',
  pathStepsText: 'Log your steps, earn points and keep the streak.',
  pathStepsGoal: 'goal',
  pathBoardTitle: 'Leaderboard',
  pathBoardText: 'Points from workouts and steps go into one leaderboard: this week and all time.',
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
    'Five home CrossFit courses: bodyweight, dumbbells, kettlebell and pull-up bar. Lifetime access, adaptive load, video for every exercise.',
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
  courseSampleTitle: 'Sample workout',
  courseSampleIntro:
    'The first workout of the course, as in the app, before it is scaled to your level.',
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
    'Leave your email — the coach confirms access and the course appears in the app.',
  courseLifetimeNote: 'One payment, access forever',
  courseOrSubscribe: 'Or every course by subscription — from {price} a month',
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
    'Payment is handled on {host}, where the course is listed as “Доступ к обучающим материалам” — that is this course. Use the same email you entered here: that is how the coach opens your access, and another address will not be matched to the order.',
  orderPayAnyway: 'Go to payment anyway',
  orderSuccessTitle: 'Order received',
  orderSuccessText:
    'The coach will confirm access to {course} for {email}. Then open the app and sign in with this email.',
  orderSuccessApp: 'Open the app',
  orderErrorEmail: 'Check the email — the address does not look right.',
  orderErrorConsent: 'Please agree to the privacy policy.',
  orderErrorNetwork: 'No connection. Check your internet and try again.',
  orderErrorGeneric: 'We could not send the order. Try again or write to us: {email}.',
  orderNotConfigured:
    'Ordering is not connected yet. Write to us and we will open access manually:',
  orderTryAgain: 'Try again',

  // Subscribe page
  subscribeTitle: 'All courses. One subscription.',
  subscribeDescription:
    'Every Forma course in one subscription: five home CrossFit programs, load that adapts to you, new courses included. Monthly or annual.',
  subscribeEyebrow: 'Subscription',
  subscribeLead:
    'One course is a start. A subscription is every program, with the next one ready when this one ends.',
  subscribeIncludes: 'What you get',
  subscribePlanLabel: 'Plan',
  subscribePerMonth: '/ month',
  subscribePerYear: '/ year',
  subscribeBestValue: 'Best value',
  subscribeOrderTitle: 'Subscribe',
  subscribeOrderIntro:
    'Leave your email and pay on the next page — the courses open in the app under this email.',
  subscribeNote: 'Renews automatically · cancel any time · access stays until the paid period ends',
  subscribeSuccessText:
    'We have recorded a {course} subscription for {email}. Once the payment lands, open the app and sign in with this email.',
  subscribeCourseHint: 'Prefer one course for good?',
  subscribeCourseLink: 'See the courses',
  subscribeVsTitle: 'Course or subscription?',
  subscribeVsCourse:
    'One course, paid once, yours forever. Right when you know what you want and where you will stop.',
  subscribeVsPlan:
    'Every course, paid monthly or yearly, while you train. Right when the goal is to keep going.',
  subscribeFaq1Q: 'Can I cancel?',
  subscribeFaq1A:
    'Yes, any time, from the payment service or by writing to us. The courses stay open until the end of the period you paid for.',
  subscribeFaq2Q: 'What happens when it ends?',
  subscribeFaq2A:
    'The courses close, your progress and stats stay. Subscribe again and you continue where you stopped.',
  subscribeFaq3Q: 'I already bought a course. Does it count?',
  subscribeFaq3A:
    'A bought course is yours forever, subscription or not. The subscription adds the other four on top.',
  planMonthlyName: 'Monthly',
  planAnnualName: 'Annual',

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
    'Results come from weeks in a row, not one hard session. That is why the courses have streaks, rest days with steps and deload weeks.',
  aboutScienceTitle: 'The science, briefly',
  aboutScienceText:
    'The programs draw on ACSM and WHO physical-activity guidelines, progressive overload, RPE-based autoregulation and the evidence behind 7,000 daily steps.',
  aboutScienceLink: 'Read the guides',
  // The three figures under the coach's name; they restate credentials in content/site/coach.ts.
  aboutFigureSince: 'coaching since',
  aboutFigureHours: 'hours coached',
  aboutFigureSport: 'in sport since',

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
    'Course missing? The coach confirms access manually; mention the email you ordered with.',
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
