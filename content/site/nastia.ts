/**
 * Анастасия — владелица и сооснователь Forma — на вкладке «Тренер». Показывается только тем, у кого
 * включён флаг `coach_nastia` (0049); пока — только ей.
 *
 * ## Как это устроено теперь (design/CHANGELOG.md §23)
 *
 * Вкладка — переключатель по людям. Наверху две карточки-шапки одной анатомии: стикеры, имя,
 * фотография, формат и срок записи. Владелица: «В карточке — "йога", "питание", "сооснователь
 * Forma", моё имя и моё фото, а ниже — моя информация. Ты положил мою информацию *в* карточку, а
 * обновлять её нужно *под* карточкой». Поэтому здесь два сорта полей:
 *
 * - для карточки: `roles` (три стикера), `name`, `photo`;
 * - для блока под ней, когда её карточка в кадре: `facts` (крупные цифры, как у Сергея), `bio`
 *   (на месте его регалий), `links`, `outcomes` (три пункта «что я могу дать», как его три) и
 *   `scheduleUrl` — её страница записи. Цены и оплата общие («Prices should be the same, the payment links should be the
 *   same»), они в `content/site/booking.ts`; запись у каждого своя («the booking links should be
 *   different»).
 *
 * Всё здесь — её собственные слова из задания владелицы, по-русски и по-английски. Ничего не
 * дописано и не угадано: если какого-то факта здесь нет, его нет и на экране.
 *
 * ## Ссылки
 *
 * Владелица: «ссылки на мой линк и инст на русском и на англ, должно зависеть от выбранного языка
 * приложения». Поэтому `links` — два списка, по языку приложения.
 *
 * Все три адреса владелица прислала сама (параметры отслеживания из ссылок убраны):
 * LinkedIn `in/gritsay-design` — в обоих языках; Instagram `@where.is.nastia` — англоязычный
 * аккаунт её тревел-бренда, поэтому он в английском списке, а `@what.is.nastia` — в русском.
 * Если языки у аккаунтов наоборот, это две строчки ниже.
 */
import type { L10n } from '@/content/schema';
import type { BookingOutcome } from './booking';

export type NastiaLinkKind = 'instagram' | 'linkedin';

export interface NastiaLink {
  kind: NastiaLinkKind;
  /** What the chip says — the handle or the site's name. */
  label: string;
  url: string;
}

export interface NastiaFact {
  /** The figure as set, «10+», «20+». */
  figure: string;
  caption: L10n;
}

const INSTAGRAM_EN: NastiaLink = {
  kind: 'instagram',
  label: '@where.is.nastia',
  url: 'https://www.instagram.com/where.is.nastia/',
};

const INSTAGRAM_RU: NastiaLink = {
  kind: 'instagram',
  label: '@what.is.nastia',
  url: 'https://www.instagram.com/what.is.nastia/',
};

const LINKEDIN: NastiaLink = {
  kind: 'linkedin',
  label: 'in/gritsay-design',
  url: 'https://www.linkedin.com/in/gritsay-design/',
};

export const NASTIA = {
  /** The stickers on her header card, like Sergey's `formaRoles` — the owner's three. */
  roles: [
    { ru: 'Йога', en: 'Yoga' },
    { ru: 'Питание', en: 'Nutrition' },
    { ru: 'Сооснователь Forma', en: 'Co-founder of Forma' },
  ] satisfies L10n[],
  /**
   * One word, set heavy — no surname. A second word, if one is ever added, is set thin after it,
   * the way «Сергей Титов» is (`splitName`).
   */
  name: { ru: 'Анастасия', en: 'Anastasia' } satisfies L10n,
  /**
   * Her portrait, sent by the owner: cropped to the 4:5 frame Sergey's card uses, the camera's
   * date stamp cut out and the file's metadata stripped, 512x640 for a 112px frame at 2x+.
   * Shown monochrome with grain like his (`.photo-mono`, `.photo-grain`).
   */
  photo: '/coach/nastia.jpg' as string,
  /**
   * Her own slot page — where somebody who paid picks a time with *her*. The owner supplies it;
   * nothing is invented here. Empty → the step after payment says to message and she sets the
   * time, exactly as Sergey's hour does without a slot page (`scheduleUrlFor`).
   */
  scheduleUrl: '' as string,
  facts: [
    { figure: '10+', caption: { ru: 'лет в дизайне', en: 'years in design' } },
    {
      figure: '20+',
      caption: { ru: 'стран за четыре года в дороге', en: 'countries in four years on the road' },
    },
  ] satisfies NastiaFact[],
  bio: {
    ru: 'Сертифицированный фитнес-тренер и нутрициолог. Больше десяти лет в дизайне, четыре года живу в дороге. Веду йогу и консультирую по питанию — силовые тренировки у Сергея.',
    en: "Certified fitness trainer and nutritionist. Over ten years in design, four years living on the road. I teach yoga and consult on nutrition — strength training is Sergey's.",
  } satisfies L10n,
  /**
   * What an hour with her gives — three, like Sergey's `BOOKING.outcomes`, in the same shape: a line
   * you could say out loud and two sentences that make it concrete. The owner: «вкладку про меня
   * структурируй так же, как у Серёжи, — что я могу дать людям, конкретно три пункта, и убери
   * теги». Built from what she said about herself: yoga at most, never strength; a nutrition
   * consultation; and the conversations people like having with her — life, travel, sport, food,
   * IT and AI (the topics that were tags are the third point now).
   */
  outcomes: [
    {
      title: { ru: 'Йога под твоё тело', en: 'Yoga that fits your body' },
      body: {
        ru: 'Подберу практику под твой режим: на гибкость, на восстановление после силовых или чтобы просто выдохнуть. Занятие онлайн, по видео — вижу, как ты делаешь, и поправляю по ходу.',
        en: 'I will build a practice around your routine: for mobility, for recovering from strength days, or simply to breathe out. Online, over video — I see how you move and adjust as we go.',
      },
    },
    {
      title: { ru: 'Питание без диет', en: 'Eating without a diet' },
      body: {
        ru: 'Разберём, как ты ешь сейчас, и соберём понятный план: что поменять, чтобы хватало сил на тренировки. Без запретов и подсчёта каждой калории.',
        en: 'We look at how you eat now and put together a plan you can follow: what to change so you have the energy to train. No bans and no counting every calorie.',
      },
    },
    {
      title: { ru: 'Разговор о том, что важно', en: 'A conversation about what matters' },
      body: {
        ru: 'Жизнь, путешествия, спорт, IT и ИИ — со мной об этом любят говорить. Больше десяти лет в дизайне и четыре года в дороге: могу поделиться тем, что работает.',
        en: 'Life, travel, sport, tech and AI — people like talking to me about all of it. Over ten years in design and four years on the road: I can share what works.',
      },
    },
  ] satisfies BookingOutcome[],
  /** Per app language — see the header for which Instagram goes where. */
  links: {
    ru: [INSTAGRAM_RU, LINKEDIN],
    en: [INSTAGRAM_EN, LINKEDIN],
  } satisfies Record<'ru' | 'en', NastiaLink[]>,
};
