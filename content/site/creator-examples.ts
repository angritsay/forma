/**
 * The two made-up creator brands the `/creators/` pitch dresses the product in: a CrossFit coach
 * and a yoga teacher. Both are fictional — names, domains and handles belong to nobody — and the
 * page labels each «пример».
 *
 * What they show is the white-label promise: the same bot, site and app, under someone else's
 * name, colours and type, on their own domain, with no Forma anywhere. What each lists as tuned is
 * limited to what the product does today — the workout builder (exercises, reps or seconds, rounds,
 * rest), the creator's own clips, club tasks with photo or video proof and the weekly board, and
 * the session calendar. Nothing here promises a feature the app does not have.
 */
import type { L10n } from '@/content/schema';

export interface CreatorExample {
  id: 'crossfit' | 'yoga';
  /** The discipline, as the tab-like label above the card. */
  kind: L10n;
  /** The fictional brand. Same in both languages. */
  brand: string;
  domain: string;
  bot: string;
  /** Colours and type the mocks are painted with. */
  theme: {
    ground: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    accentInk: string;
    font: string;
    upper: boolean;
  };
  /** The site's hero line. */
  siteLine: L10n;
  siteCta: L10n;
  /** Today's workout in the app. */
  workout: {
    title: L10n;
    meta: L10n;
    moves: L10n[];
  };
  /** One reminder from the bot, in the creator's voice. */
  botLine: L10n;
  /** What we tune for this creator. */
  tuned: L10n[];
}

export const CREATOR_EXAMPLES: readonly CreatorExample[] = [
  {
    id: 'crossfit',
    kind: { ru: 'Кроссфит', en: 'CrossFit' },
    brand: 'IRON HOUR',
    domain: 'ironhour.ru',
    bot: '@ironhour_bot',
    theme: {
      ground: '#121212',
      surface: '#1f1f1f',
      ink: '#f5f2ec',
      muted: '#9a958c',
      accent: '#ff5a1f',
      accentInk: '#121212',
      font: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', 'Oswald', sans-serif",
      upper: true,
    },
    siteLine: { ru: 'Час, после которого не стыдно', en: 'The hour you are proud of' },
    siteCta: { ru: 'Начать курс', en: 'Start the course' },
    workout: {
      title: { ru: '5 раундов на время', en: '5 rounds for time' },
      meta: { ru: '40 с работы · 20 с отдыха', en: '40 s work · 20 s rest' },
      moves: [
        { ru: 'Берпи · 10', en: 'Burpees · 10' },
        { ru: 'Махи гирей · 15', en: 'Kettlebell swings · 15' },
        { ru: 'Планка · 40 с', en: 'Plank · 40 s' },
      ],
    },
    botLine: {
      ru: 'Сегодня 5 раундов. Фото после — и ты в таблице недели 🔥',
      en: 'Five rounds today. Post a photo after and you are on this week’s board 🔥',
    },
    tuned: [
      { ru: 'Раунды, работа и отдых — до секунды', en: 'Rounds, work and rest, to the second' },
      { ru: 'Повторы или секунды на каждое движение', en: 'Reps or seconds for every movement' },
      { ru: 'Твои клипы с твоей техникой', en: 'Your clips, your technique' },
      {
        ru: 'Задание дня в клубе: фото или видео и таблица недели',
        en: 'A club task a day: photo or video proof and a weekly board',
      },
      { ru: 'Занятия 1:1 на 30 и 60 минут', en: 'One-to-one sessions, 30 and 60 minutes' },
    ],
  },
  {
    id: 'yoga',
    kind: { ru: 'Йога', en: 'Yoga' },
    brand: 'Тихая практика',
    domain: 'tihaya-praktika.ru',
    bot: '@tihaya_praktika_bot',
    theme: {
      ground: '#f3eee6',
      surface: '#fbf8f3',
      ink: '#2f3a2f',
      muted: '#7d8576',
      accent: '#7c9a7e',
      accentInk: '#fbf8f3',
      font: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif",
      upper: false,
    },
    siteLine: {
      ru: 'Двадцать минут, чтобы вернуться к себе',
      en: 'Twenty minutes to come back to yourself',
    },
    siteCta: { ru: 'Первая практика', en: 'First practice' },
    workout: {
      title: { ru: 'Утренний поток', en: 'Morning flow' },
      meta: { ru: '20 минут · без инвентаря', en: '20 minutes · no equipment' },
      moves: [
        { ru: 'Собака мордой вниз · 60 с', en: 'Downward dog · 60 s' },
        { ru: 'Воин II · 45 с на сторону', en: 'Warrior II · 45 s a side' },
        { ru: 'Шавасана · 3 мин', en: 'Savasana · 3 min' },
      ],
    },
    botLine: {
      ru: 'Доброе утро. Коврик, 20 минут — и день начнётся мягче.',
      en: 'Good morning. A mat, twenty minutes, and the day starts softer.',
    },
    tuned: [
      { ru: 'Удержания в секундах, асаны по порядку', en: 'Holds in seconds, poses in order' },
      { ru: 'Долгий отдых между блоками', en: 'Long rests between blocks' },
      { ru: 'Твои клипы, твой голос', en: 'Your clips, your voice' },
      {
        ru: 'Мягкое задание дня: «10 минут практики»',
        en: 'A gentle daily task: “ten minutes of practice”',
      },
      {
        ru: 'Утренние и вечерние занятия в календаре',
        en: 'Morning and evening sessions on your calendar',
      },
    ],
  },
];
