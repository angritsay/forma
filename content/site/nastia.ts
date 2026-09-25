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
 *   (на месте его регалий), `topicsLead` + `topics`, `links`, и `scheduleUrl` — её страница
 *   записи. Цены и оплата общие («Prices should be the same, the payment links should be the
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

export type NastiaLinkKind = 'instagram' | 'linkedin';

export interface NastiaLink {
  kind: NastiaLinkKind;
  /** What the chip says — the handle or the site's name. */
  label: string;
  url: string;
}

export interface NastiaFact {
  /** The figure as set, «11», «20+». */
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
    { figure: '11', caption: { ru: 'лет в продуктовом дизайне', en: 'years in product design' } },
    {
      figure: '20+',
      caption: { ru: 'стран за четыре года в дороге', en: 'countries in four years on the road' },
    },
  ] satisfies NastiaFact[],
  bio: {
    ru: 'Сертифицированный фитнес-тренер и нутрициолог. Одиннадцать лет проектирую продукты, четыре года живу в дороге. Веду йогу и консультирую по питанию — силовые тренировки у Сергея.',
    en: "Certified fitness trainer and nutritionist. Eleven years designing products, four years living on the road. I teach yoga and consult on nutrition — strength training is Sergey's.",
  } satisfies L10n,
  topicsLead: { ru: 'Со мной говорят о', en: 'People talk to me about' } satisfies L10n,
  topics: [
    { ru: 'жизни', en: 'life' },
    { ru: 'путешествиях', en: 'travel' },
    { ru: 'спорте', en: 'sport' },
    { ru: 'питании', en: 'nutrition' },
    { ru: 'IT и ИИ', en: 'tech and AI' },
  ] satisfies L10n[],
  /** Per app language — see the header for which Instagram goes where. */
  links: {
    ru: [INSTAGRAM_RU, LINKEDIN],
    en: [INSTAGRAM_EN, LINKEDIN],
  } satisfies Record<'ru' | 'en', NastiaLink[]>,
};
