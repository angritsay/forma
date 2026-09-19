/**
 * Who is actually selling. Owner-editable; everything here is blank until Anastasia fills it in.
 *
 * ## Why this file exists
 *
 * `BRAND.organization` is `'Forma'` — a brand, not a seller. A brand cannot take money: the person
 * buying a course is entering a contract with a named party, and Russian consumer law says which
 * party has to be named and where.
 *
 * * **ЗоЗПП ст. 9 ч. 1** — the seller states its name, address and, for an ИП, its state
 *   registration details and the body that registered it.
 * * **ЗоЗПП ст. 26.1 ч. 2** and **п. 8 Правил продажи товаров дистанционным способом**
 *   (ПП РФ № 2463 от 31.12.2020) — the same, before the contract is concluded, for a sale made
 *   over the internet.
 * * **152-ФЗ ст. 18.1 ч. 2 п. 2** — the published personal-data policy has to name the operator,
 *   and an operator is a legal person or an individual, never a wordmark.
 *
 * ## What a missing field does
 *
 * Nothing breaks: `hasLegalEntity()` is false and the offer, the privacy policy and the footer all
 * fall back to the brand name, exactly as they did before this file existed. That is deliberate —
 * a half-filled requisites block would be worse than none, and the build must not fail on a
 * weekend because a line is empty. `npm run legal:check` prints what is still missing.
 *
 * ## What goes in each field
 *
 * Copy them from the registration itself, not from memory — a wrong ИНН on a public offer is worse
 * than an absent one. `taxStatus` decides the wording: an ИП names ОГРНИП, a самозанятый names
 * only the ИНН, because НПД has no registration number to give.
 */

export type TaxStatus = 'ip' | 'self_employed' | 'company';

export const LEGAL_ENTITY = {
  /**
   * 'ip' — индивидуальный предприниматель; 'self_employed' — самозанятый (НПД, no ОГРНИП);
   * 'company' — ООО. Decides which of the fields below the pages print.
   */
  taxStatus: 'ip' as TaxStatus,
  /** Exactly as registered: «Индивидуальный предприниматель Иванова Анастасия Сергеевна». */
  name: '',
  /** Short form for a line of running text: «ИП Иванова А. С.». Falls back to `name`. */
  shortName: '',
  /** 12 digits for an individual / ИП, 10 for a company. Digits only, no spaces. */
  inn: '',
  /** ОГРНИП (15 digits) or ОГРН (13). Leave empty for самозанятый — НПД has none. */
  ogrn: '',
  /**
   * The address for correspondence, as it should appear on the offer. For an ИП working from home
   * this may be a city and a post-office box rather than a flat — an address a letter reaches is
   * what the law is after, and publishing a home address on a public page is a choice, not a duty.
   */
  address: '',
  /** Optional: phone, if there is a business one. A personal mobile does not belong on a website. */
  phone: '',
} as const;

/** True once there is enough to print a requisites block that means something. */
export function hasLegalEntity(): boolean {
  return Boolean(LEGAL_ENTITY.name.trim() && LEGAL_ENTITY.inn.trim());
}

/** The name to use in a sentence: the short form if given, else the full one, else nothing. */
export function entityName(): string {
  return LEGAL_ENTITY.shortName.trim() || LEGAL_ENTITY.name.trim();
}

/**
 * The requisites as label/value pairs, in the order they should be read, skipping what is empty.
 * Labels are bilingual because the offer is published in both languages — though a Russian ИП's
 * details are what they are, and the English page names them in Russian terms for that reason.
 */
export function entityLines(): { label: { ru: string; en: string }; value: string }[] {
  const out: { label: { ru: string; en: string }; value: string }[] = [];
  const push = (ru: string, en: string, value: string) => {
    if (value.trim()) out.push({ label: { ru, en }, value: value.trim() });
  };
  push('Продавец', 'Seller', LEGAL_ENTITY.name);
  push('ИНН', 'INN (tax number)', LEGAL_ENTITY.inn);
  push(
    LEGAL_ENTITY.taxStatus === 'company' ? 'ОГРН' : 'ОГРНИП',
    LEGAL_ENTITY.taxStatus === 'company' ? 'OGRN' : 'OGRNIP',
    LEGAL_ENTITY.ogrn,
  );
  push('Адрес', 'Address', LEGAL_ENTITY.address);
  push('Телефон', 'Phone', LEGAL_ENTITY.phone);
  return out;
}

/** Field names still missing, for `npm run legal:check`. Empty means the block is publishable. */
export function missingEntityFields(): string[] {
  const missing: string[] = [];
  if (!LEGAL_ENTITY.name.trim()) missing.push('name');
  if (!LEGAL_ENTITY.inn.trim()) missing.push('inn');
  // A самозанятый has no ОГРНИП to give, so its absence is not a gap.
  if (LEGAL_ENTITY.taxStatus !== 'self_employed' && !LEGAL_ENTITY.ogrn.trim()) {
    missing.push('ogrn');
  }
  if (!LEGAL_ENTITY.address.trim()) missing.push('address');
  return missing;
}
