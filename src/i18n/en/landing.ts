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
  heroChipVideo: 'A video for every move',
  heroChipNoJumps: 'No jumping',
  heroCtaApp: 'Open app',
  chipCourses: '{n} {word}',

  // Home, 01: workout 1.
  firstEyebrow: 'Workout 1',
  firstTitle: 'Here it is — workout 1',
  // {work} is the engine's working minutes («9 min», the rest minutes between rounds left out),
  // {total} the whole workout with the warm-up; never typed by hand.
  firstIntro:
    'On a timer: a new movement every minute, {work} of work in all. Before and after, a warm-up and a cool-down — about {total} minutes with them.',
  firstCta: 'Do workout 1',

  // Home, 02: together from Monday. No «join as a pair, get an hour» promise.
  togetherEyebrow: 'Together from Monday',
  togetherTitle: 'Bring someone along — start on Monday',
  togetherLinkLabel: 'A link to send',
  togetherPersonalCta: 'Make the link personal',
  togetherNoDiscount: 'No discount — just days, and a partner.',

  // Home, 03: the load follows you (LoadDiagram).
  adaptEyebrow: 'How the load adapts',
  adaptTitle: 'The load follows you',

  pathNodeLocked: 'Locked',
  cardView: 'View course',
  /* The ticket's kicker: what kind of thing this is («Course · Beginner»), as in the app. */
  cardKicker: 'Course',

  // Home, 04: the Small Steps club. Title, lead and features are the app's keys (`app.club*`).
  clubEyebrow: 'The club — to keep going',

  // Home, 05: coach.
  coachEyebrow: 'Coach',
  coachTitle: 'Train with Sergey online',
  coachCredentials: 'Credentials',
  coachMore: 'More about the coach',
  coachBook: 'Book a one-to-one',
  coachBookHint: 'Half an hour or an hour online · from {price} · in the app',

  // Home: before and after (caption: `app.clubPhotosClientsRow`).
  // Deliberately does not claim these came from the courses on this page. They are Sergey's
  // one-to-one clients; saying otherwise would be a claim we cannot substantiate.
  resultsEyebrow: 'Sergey’s clients',
  resultsTitle: 'Before and after — from one-to-one sessions',

  // Home, 06: prices.
  pricesEyebrow: 'Prices',
  pricesTitle: 'Starting is free',

  // Home, 07: FAQ + the closing call.
  faqEyebrow: 'FAQ',
  faqTitle: 'Frequently asked questions',
  homeCtaTitle: 'Workout 1 is waiting',
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
  copyLink: 'Copy the link',
  copyLinkDone: 'Link copied',
  copyLinkFailed: "Couldn't copy — the link is in the message above",
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
  ladderLabel: 'Prices',
  ladderFreeTitle: 'Workout 1',
  ladderCourseNote: 'a week of the club as a gift',
  ladderCourseCta: 'Buy the course',
  ladderClubTitle: 'The club and the course',
  ladderClubBadge: 'Best value',
  ladderCoachCta: 'Book the coach',
  phonesPath: 'The course path',
  phonesToday: 'today',
  qrLabel: 'Open it on your phone — point the camera',
  // The invite to start together (src/lib/share/invite.ts). {date} is «5 October», built by Intl.
  inviteWhen: 'on Monday, {date}',
  inviteWhenTomorrow: 'tomorrow, Monday {date}',
  inviteWhenToday: 'today',
  inviteShareText:
    "Shall we start training together {when}? It's Forma — home CrossFit in small steps from coach Sergey Titov: short workouts, no jumping, the load adapts to you. The first one is free: {url}",
  inviteShareRef: 'Pay for the club through this link and we both get +30 days.',
  inviteCalendarTitle: 'Forma — workout 1',
  inviteCalendarDetails: 'Workout 1, together. Open it here: {url}',
  inviteWhenSoon: 'on the coming Monday',
  inviteSoonLabel: 'the coming Monday',
  // The «Bring someone along» card (ShareInvite.tsx). No neon: «Send» is the warm gradient.
  inviteChip: 'Start — {date}',
  inviteNameLabel: 'How to sign it',
  inviteNamePlaceholder: 'Your name — optional',
  inviteNameHint: 'Letters only, up to 16 — otherwise unsigned',
  invitePreviewLabel: 'What the message will say',
  inviteSend: 'Send',
  inviteCalendar: 'Add to calendar',
  inviteCopyShort: 'Link',
  inviteCopiedShort: 'Copied',
  inviteCalendarShort: 'Calendar',
  inviteCalendarGoogle: 'Google Calendar',
  inviteCalendarFile: 'File for Apple and Outlook (.ics)',
  inviteRefOff:
    '+30 days of the club for both of you — if the link is personal and the club is paid for through it.',
  inviteRefOn: 'The link is personal: if the club is paid for through it, you both get +30 days.',
  // The friend's page, /together/. The name from the link is set with textContent only.
  togetherEyebrowFrom: '{name} invites you',
  togetherEyebrowPlain: 'An invitation',
  togetherH1: 'Training together from Monday',
  togetherLead: '{date} — workout 1. Free, about {total} minutes.',
  togetherLeadSoon: 'The coming Monday',
  togetherStart: 'Start with workout 1',
  togetherReply: "Reply: I'm in",
  togetherReplyText: "I'm in — we start on Monday!",
  togetherReplyDone: 'Copied — paste it into the chat',
  togetherReplyFailed: "Couldn't copy — just write «I'm in» yourself",
  togetherOwnLink: 'This is your own link — send it on',
  togetherInApp: 'Open this in your browser so the invitation is not lost',
  togetherWeekEyebrow: 'The first week',
  togetherWeekTitle: 'How the first week goes',
  togetherClubEyebrow: 'Two of you in the club',
  togetherClubTitle: 'One board for two',
  togetherClubRef: '+30 days of the club for you both — if you pay for the club through this link.',
  togetherMoreTitle: 'Invite someone else',
  togetherFaq1Q: 'How do we get +30 days?',
  togetherFaq1A:
    'Open the personal link of the friend who invited you and join the club through the app — you both get +30 days. There is no reward if you have been in the club before or only buy the course. It is not a discount: the price stays the same, the days are added.',
  togetherFaq2Q: 'What is the prize for a pair?',
  togetherFaq2A:
    'Every Sunday the pair on top of the club board gets an hour with the coach each. The coach announces the winner and settles any ties.',
  togetherFaq3Q: 'How do we end up as one pair?',
  togetherFaq3A:
    'If the club is paid for through a personal link, you become a pair on your own — as long as neither of you has a pair yet. Otherwise one of you taps «Invite a friend» in the duo. And with no pair, on Monday the club finds you a partner.',
  // /subscribe/: a note for people who came with an invitation (revealed by the script).
  subscribeRefNote:
    'Came with an invitation? Join through the app — that way you both get +30 days.',
  subscribeRefCta: 'Join through the app',
  // Visual-first homepage: one line per section, tile labels of four words at most.
  heroLead: '14–21 minutes, a chair and a mat. The first one is free, no card.',
  heroChipAdapt: 'Load that fits you',
  filmedEyebrow: 'On video',
  filmedTitle: 'Every movement on video',
  filmedMore: 'All exercises',
  adaptBarToday: 'Today',
  adaptBarNext: 'Next one',
  adaptEasyTag: 'It was easy',
  adaptDelta: '+{n}%',
  adaptMore: 'How it works',
  clubTileTask: 'A task a day',
  clubTileStreak: 'Your streak',
  clubTilePrize: 'A weekly prize',
  clubTileDuo: 'Solo or as a pair',
  coachRules: 'Online · move it 24 h ahead · no refunds',
  coachFiguresLabel: 'Sergey Titov in numbers',
  ladderCourseShort: 'The course, for good',
  ladderFootnoteShort: 'No auto-renewal. Refund within {days} days if under {n} workouts are done.',
} as const;
