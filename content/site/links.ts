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
  /**
   * The bot itself, `https://t.me/<bot>`: its `/start` answers with a `web_app` button into the app.
   * The site offers «Открыть в Telegram» (header menu, footer, hero) only while this is set.
   */
  telegramBot: 'https://t.me/forma_training_bot',
} as const;

/**
 * Where a fitness creator answers the pitch on `/creators/`: Nastia's own Telegram. The page is
 * unlisted and she sends it personally (docs/CREATORS.md), so the reply goes to her, not to support.
 */
export const CREATOR_CONTACT = 'https://t.me/aggritsay';
