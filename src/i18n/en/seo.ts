/** SEO-related copy: hubs, programmatic exercise/guide pages, feeds. Keep keys in sync with ru/seo.ts. */
export const seo = {
  home: 'Home',
  courses: 'Courses',
  exercises: 'Exercises',
  guides: 'Guides',
  breadcrumbsLabel: 'Breadcrumbs',
  faqTitle: 'FAQ',
  chooseCourse: 'Choose a course',

  // Static page names (sitemap registry, llms.txt)
  coursesHubTitle: 'Home CrossFit courses',
  coursesHubDescription:
    'Five home CrossFit-style courses with and without equipment. Pick one, sign in with your email and the app adapts every workout to you.',
  aboutPage: 'About the coach',
  contactPage: 'Contact',
  privacyPage: 'Privacy policy',
  termsPage: 'Terms of service',
  refundPage: 'Refund policy',
  sitemapPage: 'Sitemap (XML)',
  rssPage: 'Guides feed (RSS)',

  // Exercises hub
  exercisesHubTitle: 'Home CrossFit exercises: technique library',
  exercisesHubDescription:
    'Home CrossFit exercises with animations, step-by-step technique, common mistakes and easier or harder versions. Pick movements for your gear and level.',
  exercisesHubH1: 'Home CrossFit exercises',
  exercisesHubIntro:
    'These are the home CrossFit exercises used in the Forma courses: bodyweight movements and work with dumbbells, a kettlebell, bands, a jump rope and a pull-up bar. Every entry has an animation, step-by-step technique, coaching cues, common mistakes and an easier or harder version, so you can build a session for your level.',
  exercisesHubEmpty: 'The library is being filled — exercises will appear here soon.',
  exercisesHubPatternsNav: 'Movement patterns',
  exerciseWordOne: 'exercise',
  exerciseWordFew: 'exercises',
  exerciseWordMany: 'exercises',

  // Exercise page
  exerciseTitleFull: '{name}: how to do it, mistakes, scaling',
  exerciseTitleMedium: '{name}: technique and mistakes',
  exerciseTitleShort: '{name}: technique',
  exerciseDescriptionCta:
    'Animation, step-by-step technique, cues and scaling options in the Forma library.',
  exerciseFacts: 'Quick facts',
  factMuscles: 'Muscles',
  factPattern: 'Movement pattern',
  factEquipment: 'Equipment',
  factLevel: 'Level',
  factUnit: 'Measured in',
  factTempo: 'Tempo',
  tempoPerRep: '~{n} s per rep',
  exerciseTestBadge: 'Test exercise',
  exerciseHowTo: 'How to do it',
  exerciseCues: 'Coaching cues',
  exerciseMistakes: 'Common mistakes',
  exerciseBreathing: 'Breathing',
  exerciseScaling: 'Easier and harder versions',
  exerciseEasier: 'Easier',
  exerciseHarder: 'Harder',
  exerciseUsedIn: 'Used in courses',
  exerciseRelated: 'Related exercises',
  exerciseVideo: 'Video',
  exerciseVideoUnsupported: 'Your browser cannot play this video.',
  exerciseCtaTitle: 'Train it inside a program',
  exerciseCtaText:
    '{name} is part of the {course} course: the app scales reps, rest and load to your level after every session.',
  exerciseCtaTextGeneric:
    'Pick a course: the app scales reps, rest and load to your level after every session.',
  exerciseCtaButton: 'See the course',
  faqMistakesQ: 'What are the most common mistakes in {name}?',
  faqMistakesA: 'The most common ones: {list} Watch for them from the first rep.',
  faqCuesQ: 'What should I focus on during {name}?',
  faqCuesA: 'Keep these cues in mind: {list}',
  faqBreathingQ: 'How should I breathe during {name}?',
  faqEquipmentQ: 'What equipment do I need for {name}?',
  faqEquipmentA: 'You need: {list}.',
  faqEquipmentNone: 'No equipment — just enough floor space.',
  faqScalingQ: 'How do I make {name} easier or harder?',
  faqScalingEasier: 'Easier: {name}.',
  faqScalingHarder: 'Harder: {name}.',

  // Guides hub and clusters
  guidesHubTitle: 'Home CrossFit guides: training, technique, recovery',
  guidesHubDescription:
    'Coach-written guides on home CrossFit: where to start, AMRAP and EMOM formats, dumbbell and kettlebell workouts, recovery and motivation. Pick a topic and read.',
  guidesHubH1: 'Home CrossFit guides',
  guidesHubIntro:
    'These are the Forma coach’s guides to CrossFit-style training at home: where to start, how AMRAP and EMOM formats work, how to train with dumbbells and a kettlebell, how to recover and how to keep going. The articles follow widely accepted guidance (ACSM, WHO) and link to exercises from our library.',
  guidesHubEmpty: 'The first articles are being written — check back soon.',
  guidesAll: 'All guides',
  guideWordOne: 'guide',
  guideWordFew: 'guides',
  guideWordMany: 'guides',
  clusterHubTitle: '{cluster}: home CrossFit guides',
  clusterHubIntro: '{count} in this topic. Newest first.',
  cluster_beginners_title: 'For beginners',
  cluster_beginners_description:
    'Where to start home CrossFit: first workouts, technique of the basic movements, how to pick the load and get through the first weeks. Guides by the Forma coach.',
  cluster_no_equipment_title: 'No equipment',
  cluster_no_equipment_description:
    'Bodyweight training at home: routines without any gear, burpees and push-ups, short 20-minute sessions you can actually do in a small flat.',
  cluster_dumbbells_title: 'Dumbbells',
  cluster_dumbbells_description:
    'Dumbbell training at home: how to choose the weight, full-body basics, set and rep schemes, and how to progress without a barbell.',
  cluster_kettlebell_title: 'Kettlebell',
  cluster_kettlebell_description:
    'Kettlebell training at home: swings, cleans, presses and the Turkish get-up. Beginner-safe technique, progression and complete one-kettlebell workouts.',
  cluster_formats_title: 'Workout formats',
  cluster_formats_description:
    'What AMRAP, EMOM, For time and Tabata mean: how each format works, how to score it, how to pace it and how to adapt it to training at home.',
  cluster_fat_loss_title: 'Fat loss',
  cluster_fat_loss_description:
    'Home CrossFit for fat loss: how workouts, daily steps and nutrition fit together, which formats burn more and why consistency beats intensity.',
  cluster_programming_title: 'Programming',
  cluster_programming_description:
    'How to plan home training: how many sessions a week, choosing the load with RPE, when to take a deload week and how to avoid overtraining.',
  cluster_recovery_title: 'Recovery',
  cluster_recovery_description:
    'Recovery between workouts: rest days, sleep, 7,000 daily steps, signs of fatigue and what to do so that your progress does not stall.',
  cluster_mobility_title: 'Mobility and warm-up',
  cluster_mobility_description:
    'Warm-up and mobility for home workouts: how to prepare the joints in 5–7 minutes, what to stretch afterwards and how to protect the back, knees and shoulders.',
  cluster_motivation_title: 'Motivation',
  cluster_motivation_description:
    'How to stay consistent with home workouts: habits, streaks, small goals and honest expectations. What actually keeps you training for months.',
  cluster_equipment_title: 'Equipment',
  cluster_equipment_description:
    'Home CrossFit equipment: what you really need, what to buy first, how to choose dumbbells, a kettlebell, a pull-up bar and a jump rope — and what to skip.',

  // Guide page
  readingTime: '{n} min read',
  published: 'Published',
  updated: 'Updated',
  byAuthor: 'By {name}',
  tocTitle: 'In this article',
  relatedExercises: 'Exercises from this article',
  relatedCourses: 'Courses on this topic',
  relatedGuides: 'Read next',
  guideCtaTitle: 'Turn it into a program',
  guideCtaText:
    'The {course} course puts these principles into a schedule: the app adapts every workout to your level.',
  guideCtaTextGeneric: 'Pick a course — the app adapts every workout to your level.',
  guideCtaButton: 'Open the course',
  weeksShort: '{n} wk',
  perWeek: '{n}×/week',

  // Content vocab
  pattern_squat: 'Squat',
  pattern_hinge: 'Hinge',
  pattern_lunge: 'Lunge',
  pattern_push_horizontal: 'Horizontal push',
  pattern_push_vertical: 'Vertical push',
  pattern_pull_horizontal: 'Horizontal pull',
  pattern_pull_vertical: 'Vertical pull',
  pattern_core_anti_extension: 'Core: anti-extension',
  pattern_core_rotation: 'Core: rotation',
  pattern_core_flexion: 'Core: flexion',
  pattern_carry: 'Carry',
  pattern_locomotion: 'Locomotion',
  pattern_jump: 'Jumps',
  pattern_olympic: 'Olympic lifts',
  pattern_full_body: 'Full body',
  pattern_mobility: 'Mobility',
  muscle_quads: 'Quads',
  muscle_glutes: 'Glutes',
  muscle_hamstrings: 'Hamstrings',
  muscle_calves: 'Calves',
  muscle_chest: 'Chest',
  muscle_shoulders: 'Shoulders',
  muscle_triceps: 'Triceps',
  muscle_biceps: 'Biceps',
  muscle_back: 'Back',
  muscle_lats: 'Lats',
  muscle_core: 'Core',
  muscle_obliques: 'Obliques',
  muscle_hip_flexors: 'Hip flexors',
  muscle_full_body: 'Full body',
  muscle_cardio: 'Cardio',
  unit_reps: 'reps',
  unit_seconds: 'seconds',
  unit_meters: 'meters',
  unit_calories: 'calories',

  // llms.txt / RSS / OG
  llmsIntro:
    'Forma is a coach-made set of home CrossFit-style courses: five programs with and without equipment. The web app adapts reps, rest and load to your level after every session; access is lifetime after purchase. The site and the app are available in Russian and English.',
  llmsCourses: 'Courses',
  llmsGuides: 'Guides',
  llmsExercises: 'Exercise library',
  llmsAbout: 'About',
  llmsOptional: 'Optional',
  llmsExercisesLine: 'Every exercise used in the courses, with technique, mistakes and scaling.',
  rssTitle: 'Forma — home CrossFit guides',
  rssDescription:
    'New coach-written guides on home CrossFit: technique, formats, programming, recovery and motivation.',
  ogExercise: 'Exercise',
  ogCourse: 'Course',
  ogGuide: 'Guide',
} as const;
