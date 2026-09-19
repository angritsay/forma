/**
 * `npm run legal:check` — what is still missing before the site can legally take money.
 *
 * It is a report, not a gate. A missing ИНН must not fail CI on a Tuesday: the site has to keep
 * deploying while the registration is being sorted out, and a red build teaches people to ignore
 * red builds. So this prints, exits 0, and is meant to be run by a person who is deciding whether
 * to switch payments on.
 *
 * What it cannot check is the part that matters most — whether the notification to Роскомнадзор has
 * been filed and where the data physically sits. Those live in docs/COMPLIANCE.md because no script
 * can look at them.
 */
import { LEGAL_ENTITY, missingEntityFields } from '../content/site/legalEntity.ts';
import { PLANS } from '../content/site/plans.ts';
import { PRICING } from '../content/site/pricing.ts';
import { LINKS } from '../content/site/links.ts';
import { BRAND } from '../content/site/brand.ts';

const FIELD_HELP = {
  name: 'Полное имя продавца, как в регистрации: «Индивидуальный предприниматель Фамилия Имя Отчество»',
  inn: 'ИНН — 12 цифр для ИП и самозанятого, 10 для ООО',
  ogrn: 'ОГРНИП (15 цифр). Самозанятому не нужен — поставь taxStatus: "self_employed"',
  address: 'Адрес для переписки, который указываем в оферте',
};

let problems = 0;
const say = (mark, text) => console.log(`${mark} ${text}`);

console.log('\n— Реквизиты продавца (content/site/legalEntity.ts) —\n');
const missing = missingEntityFields();
if (missing.length === 0) {
  say('✓', `Заполнены: ${LEGAL_ENTITY.name}, ИНН ${LEGAL_ENTITY.inn}`);
} else {
  for (const field of missing) {
    problems += 1;
    say('✗', `${field} — ${FIELD_HELP[field] ?? 'не заполнено'}`);
  }
}

console.log('\n— Платные ссылки —\n');
// The order matters: selling without published requisites is the combination that is actually a
// problem. Requisites with no payment link yet is just a site that is not selling.
const paid = PLANS.filter((p) => p.paymentUrl);
if (paid.length > 0 && missing.length > 0) {
  problems += 1;
  say(
    '✗',
    `${paid.length} тариф(а) с работающей оплатой, но реквизиты продавца не опубликованы — ЗоЗПП ст. 9 и п. 8 Правил дистанционной продажи`,
  );
} else if (paid.length > 0) {
  say('✓', `${paid.length} тариф(а) с оплатой, реквизиты на месте`);
} else {
  say('·', 'Оплата ещё не подключена — требование о реквизитах пока не сработало');
}

console.log('\n— Контакты и даты —\n');
const support = LINKS.supportEmail || BRAND.contactEmail;
if (support) say('✓', `Адрес для запросов субъектов данных: ${support}`);
else {
  problems += 1;
  say('✗', 'Нет адреса поддержки — некуда писать про удаление данных и отзыв согласия');
}

// The version stamped into every consent row. If it drifts behind the text, the log names a
// document nobody can read any more.
say('·', `Версия юридических текстов (она же версия согласий): ${PRICING.legalUpdatedAt}`);
say('·', `Регион хранения данных, как он назван в политике: ${PRICING.dataRegion}`);

console.log(
  `\n${problems === 0 ? 'Всё, что проверяется автоматически, — на месте.' : `Осталось: ${problems}.`}`,
);
console.log('Остальное — в docs/COMPLIANCE.md (уведомление РКН, локализация, DNS).\n');
