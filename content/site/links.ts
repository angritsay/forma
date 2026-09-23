/** External links used across the site. */
export const LINKS = {
  /** Where "Get access" sends users when a course has no paymentUrl: the coach's contact. */
  supportTelegram: '',
  supportEmail: 'hello@forma-app.co',
  /**
   * The Mini App's direct link, `https://t.me/<bot>/<short name>` (@BotFather → /newapp; see
   * docs/SETUP.md). When set, invite links are built on it with `?startapp=` so they open inside
   * Telegram; empty keeps them as plain web links to /app/.
   */
  telegramMiniApp: '',
} as const;
