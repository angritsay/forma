/**
 * Анастасия — владелица и сооснователь Forma — на вкладке «Тренер», во второй карточке рядом с
 * Сергеем. Показывается только тем, у кого включён флаг `coach_nastia` (0049); пока — только ей.
 *
 * Всё здесь — её собственные слова из задания владелицы, по-русски и по-английски. Ничего не
 * дописано и не угадано: если какого-то факта здесь нет, его нет и на экране.
 *
 * ## Ссылки
 *
 * Владелица: «ссылки на мой линк и инст на русском и на англ, должно зависеть от выбранного языка
 * приложения». Поэтому `links` — два списка, по языку приложения. Сейчас в обоих один и тот же
 * Instagram — другого адреса не давали.
 *
 * **LinkedIn и отдельный английский (или русский) Instagram владелица пришлёт сама.** Тип и
 * отрисовка их уже поддерживают (`kind: 'linkedin'`, знак в `BrandMark`); адреса не
 * придумывались — строчка добавляется сюда, когда адрес будет.
 *
 * Фотографии пока нет: на её месте монограмма «А» / «A».
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

const INSTAGRAM: NastiaLink = {
  kind: 'instagram',
  label: '@where.is.nastia',
  url: 'https://www.instagram.com/where.is.nastia/',
};

export const NASTIA = {
  /** Two stickers, like Sergey's `formaRoles`. */
  roles: [
    { ru: 'Сооснователь Forma', en: 'Co-founder of Forma' },
    { ru: 'Йога и питание', en: 'Yoga and nutrition' },
  ] satisfies L10n[],
  /** One word, set heavy — no surname. */
  name: { ru: 'Анастасия', en: 'Anastasia' } satisfies L10n,
  /** The monogram that stands where a photograph would. */
  initial: { ru: 'А', en: 'A' } satisfies L10n,
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
  /** Per app language. Only Instagram so far — see the header. */
  links: {
    ru: [INSTAGRAM],
    en: [INSTAGRAM],
  } satisfies Record<'ru' | 'en', NastiaLink[]>,
};
