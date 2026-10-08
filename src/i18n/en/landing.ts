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

  // Home, 01: workout 1.
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

  // Home: before and after (caption: `app.clubPhotosClientsRow`).
  // Deliberately does not claim these came from the courses on this page. They are Sergey's
  // one-to-one clients; saying otherwise would be a claim we cannot substantiate.
  resultsTitle: 'Before and after — from one-to-one sessions',

  // Home, 06: prices.
  pricesTitle: 'Starting is free',

  // Home, 07: FAQ + the closing call.
  faqTitle: 'Frequently asked questions',
  homeCtaTitle: 'Workout 1 is waiting',
  // The closing call on other pages (about, courses).
  ctaTitle: 'Start with the first workout',
  ctaText: 'Workout 1 is free, no card needed. Then go at your own pace.',

  // Courses hub
  coursesHubTitle: 'Home CrossFit course with no equipment',
  coursesHubDescription:
    'Forma. Start: twenty no-equipment home CrossFit workouts, a load that adapts to you, the coach’s video for every move. Plus the club and the coach in Telegram.',
  coursesHubH1: 'A course to start with',
  coursesHubIntro: 'Twenty workouts in order, no jumping and no equipment. The first one is free.',
  coursesHubListLabel: 'Courses',

  // Course page
  courseTitleSuffix: 'home course',
  courseCtaOrder: 'Get access',
  courseAboutTitle: 'About the course',
  courseForWhomTitle: 'Who it is for',
  courseOutcomesTitle: 'What you will get',
  courseEquipmentTitle: 'Equipment',
  courseProgramTitle: 'Program',
  courseProgramIntro: 'Twenty workouts in order. The weeks are a guide, not a calendar.',
  courseWeek: 'Week {n}',
  courseDeload: 'Deload',
  // This block was a shop window. Now it is an invitation: the same workout, except it can be
  // done rather than only read.
  courseSampleTitle: 'The first workout is free',
  courseSampleIntro: 'Here it is in full. Do it now — no card, no payment.',
  courseSampleCta: 'Do it in the app',
  courseFreeFirst: 'First workout free',
  courseAdaptTitle: 'How the app adapts',
  courseAdaptText:
    'Before a workout you choose Easier, As usual or Harder. Afterwards you rate the effort from 1 to 10 and the next load shifts.',
  // The engine's four steps (`ADAPTATION`), one tile each; the figure is computed, not typed.
  courseAdaptStepEasy: 'Easy, all done',
  courseAdaptStepOk: 'Just right',
  courseAdaptStepHard: 'At the limit',
  courseAdaptStepPain: 'Something hurt',
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
  courseLifetimeNote: 'One payment, no time limit',
  courseOrSubscribe: 'Or the club with the course — {year} a year, one payment',
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
  orderEmailTypo: 'A typo in the domain? Tap to change it to {suggestion}',
  orderErrorEmail: 'Check the email — the address does not look right.',
  orderErrorConsent: 'Please agree to the privacy policy.',
  orderErrorNetwork: 'No connection. Check your internet and try again.',
  orderErrorGeneric: 'We could not send the order. Try again or write to us: {email}.',
  orderNotConfigured:
    'Ordering is not connected yet. Write to us and we will open access manually:',
  orderTryAgain: 'Try again',

  // Subscribe page
  subscribeTitle: 'Small Steps Club — a task a day and a coach',
  subscribeDescription:
    'The Small Steps Club: one small task a day, a streak, a weekly board and a prize — an hour with the coach. The Start course is inside. No auto-renewal.',
  subscribePlanLabel: 'Plan',
  subscribePerMonth: '/ month',
  subscribePerYear: '/ year',
  subscribeBestValue: 'Best value',
  subscribeOrderTitle: 'Join the club',
  subscribeOrderIntro:
    'Leave your email and pay on the next page — the club and the course open in the app under this email on their own.',
  // The club's own payment line: the shared one (`orderPaymentNote`) is written for a course.
  subscribePaymentNote:
    'Payment is handled on {host}. Use the same email you entered here: the club opens automatically as soon as the payment lands, and another address will not be matched to the order.',
  // This line sits under the pay button and promised auto-renewal, which does not exist — see
  // `content/site/plans.ts`. The plan card said the opposite two rows above it.
  subscribeNote: 'One payment · access for the whole paid period · renew whenever you want',
  subscribeSuccessText:
    'We have recorded {course} for {email}. Once the payment lands, access opens automatically — sign in to the app with this email.',
  subscribeVsTitle: 'Course or club?',
  subscribeFaq1Q: 'What is the task of the day?',
  // There is nothing to cancel: nothing is ever charged unless you pay for a period.
  subscribeFaq1A:
    'One small thing: ten minutes on foot, twenty squats, a glass of water before coffee. Done it — mark it in the app and earn points on the weekly board. The week’s leader gets a prize.',
  subscribeFaq2Q: 'What happens when the paid period ends?',
  subscribeFaq2A:
    'The club and the course close; your progress and stats stay. Renew and you carry on where you stopped.',
  subscribeFaq3Q: 'I already bought the course. Why the club?',
  // It said «the other four». There are six courses and one is published: a number here promises
  // programmes that are not on the site yet.
  subscribeFaq3A:
    'A bought course is yours with no time limit, and the first week of the club comes with it. The subscription keeps you in the club after that: a task every day, the weekly board, a streak and a partner.',

  // About
  aboutTitle: 'Sergey Titov — Forma coach, online sessions',
  aboutDescription:
    'Sergey Titov, founder and coach of Forma: 10,000+ hours one-to-one. Online: half an hour for technique; an hour adds load and a plan. Booking is in the app.',
  aboutPhilosophyTitle: 'How the workouts work',
  aboutPhilosophy1Title: 'Load that fits you',
  aboutPhilosophy1Text:
    'You start from five questions, with no max-effort tests; a check-in comes after the second workout.',
  aboutPhilosophy2Title: 'Safety',
  aboutPhilosophy2Text:
    'Technique before volume. Every movement has cues and an easier version; pain is a signal to lower the load.',
  aboutPhilosophy3Title: 'Consistency',
  aboutPhilosophy3Text:
    'The course counts workouts, not days in a row: a skipped one breaks nothing. The streak lives only in the club, for the small tasks.',
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
  contactBot: 'Forma bot',
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
    'Terms for buying a Forma training program: access with no time limit while the App exists, health disclaimer, restrictions and liability.',
  refundTitle: 'Refund policy',
  refundDescription:
    'How to get a refund for a Forma course: {days} days after activation if fewer than {n} workouts are completed.',

  // 404
  notFoundTitle: 'Page not found',
  notFoundText: 'This page does not exist or has moved.',
  notFoundHome: 'Go home',

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
  // Under the tickets (SessionTickets): the booking order and the money rule on one line.
  coachRules: 'Online · time first, then payment · move it 24 h ahead · no refunds',
  coachFiguresLabel: 'Sergey Titov in numbers',
  ladderCourseShort: 'The course, for good',
  ladderFootnoteShort: 'No auto-renewal. Refund within {days} days if under {n} workouts are done.',
  // The club (/subscribe/) and the coach (/about/), PR 4: two short lines at most, the rest in the FAQ.
  subscribeStartFirst: 'Workout 1 first — it’s free',
  subscribeDayTitle: 'One small thing a day',
  subscribeStreakTitle: 'Days in a row, and a prize',
  subscribeStreakLine: 'The app marks each milestone — once.',
  subscribePrizeDuo: 'In a duo, each of the pair gets one.',
  subscribeDuoTitle: 'Harder to skip as two',
  subscribeBotTitle: 'The bot keeps you on it',
  subscribeBotMorningWhen: 'Morning',
  subscribeBotMorning: 'The day’s task',
  subscribeBotEveningWhen: 'Evening',
  subscribeBotEvening: 'If your streak is at risk',
  subscribeBotSundayWhen: 'Sunday evening',
  subscribeBotSunday: 'The week’s results',
  subscribeBotMute: 'Telegram connects after you sign in. Messages can be switched off.',
  subscribePlansTitle: 'A year, or 30 days',
  subscribePickYear: 'Choose the year',
  subscribePick30: 'Choose 30 days',
  subscribeOrderEyebrow: 'Payment',
  subscribeVsLine: 'The course is a programme you keep. The club keeps you going.',
  subscribeFaq4Q: 'Who gets the prize?',
  subscribeFaq4A:
    'Whoever is top of the board on Sunday: an hour one to one with Sergey, online. In a duo, an hour for each of the pair. The coach announces the winner and settles any tie.',
  subscribeFaq5Q: 'Will I be charged again automatically?',
  subscribeFaq5A:
    'No. It is one payment — for a year or for 30 days — and that is all. Renew by hand whenever you like.',
  subscribeFaq6Q: 'How do the +30 days and the pair work?',
  subscribeFaq6A:
    'Send a friend your personal link. If they pay for the club through it, you both get +30 days, and you become a pair if neither of you has one yet. No bonus if your friend has been in the club before. It is not a discount: the price is the same, the days are added.',
  aboutOutcomesTitle: 'What a session gives you',
  aboutSessionsTitle: 'Half an hour or an hour',
  aboutHowTitle: 'How to book',
  // The owner's order (29 Sep): the time first, then the payment — the slot is held HOLD_MINUTES.
  aboutHowPick: 'Pick a time, then pay',
  aboutRule:
    'The slot is held for {n} minutes while you pay. No refunds — you can move a session yourself in the app at least 24 hours ahead',
  aboutDailyTitle: 'Every day in Forma',
  aboutDailyFilmed: 'Filmed every movement',
  aboutDailyReports: 'Reads every report',
  aboutDailyBot: 'Answers in the bot',
  aboutDailyWinner: 'Names the week’s winner',
  aboutBioMore: 'More about Sergey',
  // Courses, the course page, guides, exercises, contact (PR 4, stage 2).
  cardStartCta: 'Workout 1 — free',
  cardBuyCta: 'Buy — {price}',
  cardGift: 'A week of the club as a gift',
  clubBandEyebrow: 'The club, with the course',
  clubBandMore: 'What is in the club',
  courseBuyCta: 'Get access · {price}',
  courseInviteLine: 'It is easier not to quit as two — start on Monday.',
  courseSamplePlan: 'The full plan',
  startWorkout1Cta: 'Do workout 1 for free',
  inWorkout1: 'This movement is in workout 1',
  hubCtaText: 'About {total} minutes — free, no card needed.',

  // Unlisted pitch for fitness creators, /creators/ (docs/CREATORS.md). Nastia sends it herself.
  // Every figure on it is read from content (prices, booking, plans); terms not yet decided say
  // "set in the contract" and promise nothing.
  creatorsEyebrow: 'For fitness creators',
  creatorsH1: 'Your method, in an app',
  creatorsLead:
    'Your own bot, site and app, under your name. No subscription fee: we earn only when you do.',
  creatorsPillCourse: 'Course',
  creatorsPillClub: 'Club',
  creatorsPillSessions: '1:1 sessions',
  creatorsWrite: 'Message me',
  creatorsTry: 'Try Forma',
  creatorsNastiaHello: 'Hi, I’m Nastia!',
  creatorsNastiaLine: 'I’ll show you Forma from the inside — and we’ll build your course together.',
  creatorsStatCourse: 'to you from course and club',
  creatorsStatSessions: 'to you from 1:1 sessions',
  creatorsStatWays: 'Forma logos your people see',
  creatorsGetTitle: 'What you end up with',
  creatorsGet1Title: 'Your own Telegram bot',
  creatorsGet1Line: 'Your name and avatar.',
  creatorsGet2Title: 'A promo site',
  creatorsGet2Line: 'On your domain, with checkout.',
  creatorsGet3Title: 'The app, on phone and computer',
  creatorsGet3Line: 'From a link. No store needed.',
  creatorsGet4Title: 'App Store and Google Play',
  creatorsGet4Line: 'If you want them.',
  creatorsGet4Tag: 'extra fee · discussed separately',
  creatorsGetMockBrand: 'Your brand',
  creatorsGetMockDomain: 'your-domain.com',
  creatorsGetMockBotLine: 'Workout 2 is waiting for you today',
  creatorsGetMockSiteLine: 'Course, club and sessions',
  creatorsGetMockBuy: 'Buy',
  creatorsWhiteLabel: 'All under your name. Your people never see Forma.',
  creatorsWhite1: 'your domain',
  creatorsWhite2: 'your logo and colours',
  creatorsWhite3: 'your typefaces',
  creatorsWhite4: 'your bot',
  creatorsWhite5: 'your Prodamus / lava.top',
  creatorsWaysTitle: 'Three ways to earn',
  creatorsCourseTitle: 'Course',
  creatorsCourseLine: 'A path of workouts with a player. The load adapts to each person.',
  creatorsCoursePrice: '{price}',
  creatorsCoursePriceNote: 'one payment · e.g. “{name}”',
  creatorsClubTitle: 'Club',
  creatorsClubLine: 'One small step a day — and a reason to come back.',
  creatorsClubHow: 'How it works',
  creatorsClubStep1Title: 'Task',
  creatorsClubStep1Line: 'from you, for every day',
  creatorsClubStep2Title: 'Proof',
  creatorsClubStep2Line: 'photo, video or “done”',
  creatorsClubStep3Title: 'Points',
  creatorsClubStep3Line: 'a streak and a weekly board',
  creatorsClubStep4Title: 'Prize',
  creatorsClubStep4Line: 'say, an hour with you',
  creatorsClubPrice: '{year} / year',
  creatorsClubPriceNote: '≈ {month} a month · or {month30} for 30 days, no auto-renewal',
  creatorsSessionsTitle: '1:1 sessions',
  creatorsSessionsLine:
    'People pick a time in your calendar right in the app. The slot is held {n} minutes until payment; moves up to {h} hours before.',
  creatorsMoneyTitle: 'Money, out loud',
  creatorsMoneyCourse: 'course and club: you / Forma',
  creatorsMoneySessions: '1:1 sessions: you / Forma',
  creatorsCalcTitle: 'Count your month',
  creatorsCalcCourse: 'Course sales',
  creatorsCalcClub: 'Club members',
  creatorsCalcSessions: 'Hours of 1:1',
  creatorsCalcFee: 'Payment processor fee',
  creatorsCalcEach: 'at {price}',
  creatorsCalcResult: 'Yours a month',
  creatorsCalcNote:
    'The fee comes off first, then Forma’s 20% (10% on sessions); the rest is yours. Club at the 30-day price.',
  creatorsMoneyIntl:
    'Sell beyond your country: lava.top takes cards from anywhere, priced in dollars; Prodamus covers Russian cards.',
  creatorsCompareTitle: 'Not another platform — a team',
  creatorsCompareColA: 'GetCourse and the like',
  creatorsCompareColB: 'Forma',
  creatorsCompare1A: 'A monthly fee',
  creatorsCompare1B: '$0 — a share of sales only',
  creatorsCompare2A: 'You set it up',
  creatorsCompare2B: 'We build it',
  creatorsCompare3A: 'A web cabinet',
  creatorsCompare3B: 'An app with a player',
  creatorsCompare4A: 'Newsletters',
  creatorsCompare4B: 'A club and a bot',
  creatorsCompare5A: 'You edit the video',
  creatorsCompare5B: 'We cut it in Studio',
  creatorsMoneyCoversTitle: 'What Forma’s share covers',
  creatorsCoversLine: 'You bring the method. Everything else is on us.',
  creatorsCoversSessions: '10% on 1:1 sessions',
  creatorsCover1: 'The app and site',
  creatorsCover2: 'Setting up your Prodamus and lava.top',
  creatorsCover3: 'The bot and reminders',
  creatorsCover4: 'Tech support for your users',
  creatorsCover5: 'Video hosting',
  creatorsCover6: 'The tools',
  creatorsCover7: 'Customisation for you',
  creatorsCover8: 'Production help',
  creatorsToolsTitle: 'No editing, no page building, no manual mailings',
  creatorsStudioTag: 'Studio',
  creatorsStudioTitle: 'Film in one take — get clips in your library',
  creatorsStudioLine:
    'We cut it into exercises, label and crop them. We grade the colour on one clip — and paste it onto the rest.',
  creatorsTool1Title: 'Course builder',
  creatorsTool1Line: 'Days, the path, publishing.',
  creatorsTool2Title: 'Workout builder',
  creatorsTool2Line: 'Exercises, reps or seconds, rounds, rest.',
  creatorsTool3Title: 'Exercise library',
  creatorsTool3Line: 'Every movement, on video.',
  creatorsTool4Title: 'Club',
  creatorsTool4Line: 'Tasks, proof review, pairs, the weekly winner.',
  creatorsTool5Title: 'Booking calendar',
  creatorsTool5Line: 'Your slots, bookings and moves.',
  creatorsTool6Title: 'Telegram bot',
  creatorsTool6Line: 'Reminders, confirmations, replies to members.',
  creatorsTool7Title: 'Analytics',
  creatorsTool7Line: 'A funnel by cohort.',
  creatorsToolsHint: 'Tap a tool to see its screen',
  creatorsToolsSketch: 'Screen sketch',
  creatorsMockAdmin: 'Admin',
  creatorsMockPublish: 'Publish',
  creatorsMockLive: 'live',
  creatorsMockDay: 'Wk {w} · day {d}',
  creatorsMockRounds: 'Rounds',
  creatorsMockAddMove: '+ Movement',
  creatorsMockSearch: 'Find a movement',
  creatorsMockTask: 'Today’s task',
  creatorsMockTaskText: '100 squats over the day',
  creatorsMockMember1: 'Anya',
  creatorsMockMember2: 'Mark',
  creatorsMockMember3: 'Lena',
  creatorsMockMember4: 'Kate',
  creatorsMockProof: 'proof · photo',
  creatorsMockAccept: 'Accept',
  creatorsMockReturn: 'Send back',
  creatorsMockPairs: 'Pairs this week',
  creatorsMockWinner: 'Winner of the week',
  creatorsMockFree: 'free',
  creatorsMockBooked: 'booked',
  creatorsMockHeld: 'held {n} min',
  creatorsMockMoved: 'moved',
  creatorsMockDays: 'Mon,Tue,Wed,Thu,Fri',
  creatorsMockBot: 'your_bot',
  creatorsMockBot1: 'Tomorrow at 10:00: an hour with the coach. Confirm?',
  creatorsMockBot2: 'Yes, I’ll be there!',
  creatorsMockBot3: 'Today’s club task is waiting.',
  creatorsMockBotReply: 'Reply as yourself',
  creatorsMockFunnel: 'Funnel',
  creatorsMockWeeks: 'By week',
  creatorsCustomTitle: 'Built around you — two examples',
  creatorsCustomIntro:
    'One product, two different businesses. Your name, colours, type, movements and timings to the second.',
  creatorsExampleTag: 'example',
  creatorsExampleTuned: 'What we tuned',
  creatorsStepsTitle: 'How we start',
  creatorsStep1: 'Message me',
  creatorsStep2: 'We have a call',
  creatorsStep3: 'You film, Studio cuts',
  creatorsStep4: 'We build, you approve',
  creatorsStep5: 'Launch, sales, payouts',
  creatorsStep1Line: 'On Telegram: I’ll reply and show you around.',
  creatorsTelegram: 'Message me on Telegram',
  creatorsFaq1Q: 'How is my share counted?',
  creatorsFaq1A:
    '80% of course and club sales, 90% of one-to-one sessions. Counted on the amount after the Prodamus or lava.top fee.',
  creatorsFaq2Q: 'How does Forma get its share?',
  creatorsFaq2A:
    'The money lands in your account. How and when we settle is set in the contract before launch.',
  creatorsFaq3Q: 'Who sets the prices?',
  creatorsFaq3A:
    'We agree on them together and set them in the contract. Prices on this page are Forma’s current ones, as examples.',
  creatorsFaq4Q: 'Who owns the content, and is it exclusive?',
  creatorsFaq4A: 'Content ownership and exclusivity are agreed and set in the contract.',
  creatorsFaq5Q: 'What about taxes and paperwork?',
  creatorsFaq5A: 'The legal form and taxes are agreed and set in the contract.',
  creatorsFaq6Q: 'I can’t edit video',
  creatorsFaq6A: 'You don’t need to. You film — we cut, label and grade the clips in Studio.',
  creatorsFaq7Q: 'What languages is the app in?',
  creatorsFaq7A: 'Russian and English — each person picks their own.',
  creatorsFaq8Q: 'Will my people see Forma?',
  creatorsFaq8A:
    'No. The domain, the bot, the app and the payment receipt are all under your name.',
  creatorsFaq9Q: 'What about the App Store and Google Play?',
  creatorsFaq9A:
    'Possible, for an extra fee — discussed separately. Without the stores the app opens from a link and installs on phone and computer.',
  creatorsFaq10Q: 'Everything I have is on GetCourse — what about it?',
  creatorsFaq10A:
    'Leave it. Launch something new on Forma — a club, say — and look at the numbers. Moving over is discussed separately.',
  creatorsFinalTitle: 'Let’s build your course',
  creatorsFinalText: 'Message me on Telegram — that’s where it starts.',
} as const;
