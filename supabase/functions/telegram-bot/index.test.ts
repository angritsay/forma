import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COPY,
  isCommand,
  keyboard,
  localeOf,
  parseSupportStatus,
  replyFor,
  routeUpdate,
  sendMessageBody,
  sendPhotoBody,
  siteUrlFor,
  SUPPORT_COPY,
  SUPPORT_MAX,
  supportReplyText,
  supportRpcArgs,
  type BotCopy,
  type Locale,
  type TelegramUpdate,
} from './index';

/** A message from somebody whose Telegram is in Russian, unless told otherwise. */
const privateMessage = (text: string, language_code = 'ru') => ({
  message: {
    message_id: 7,
    chat: { id: 42, type: 'private' },
    from: { id: 4242, first_name: 'Аня', last_name: 'К', username: 'anya_k', language_code },
    text,
  },
});

const ONE: BotCopy = {
  greeting: 'Hi',
  buttonText: 'Train',
  siteButtonText: 'Read',
  photoUrl: 'https://example.test/card.png',
};
/** The same stub in both languages, for the cases that are not about language at all. */
const COPY: Record<Locale, BotCopy> = { ru: ONE, en: ONE };

const APP = 'https://forma-app.co/app/';
const SITE = 'https://forma-app.co/courses/start/';

describe('replyFor', () => {
  it('answers /start', () => {
    expect(replyFor(privateMessage('/start'))).toEqual({
      chatId: 42,
      locale: 'ru',
      text: DEFAULT_COPY.ru.greeting,
      buttonText: DEFAULT_COPY.ru.buttonText,
      siteButtonText: DEFAULT_COPY.ru.siteButtonText,
      photoUrl: DEFAULT_COPY.ru.photoUrl,
    });
  });

  it('answers a deep link the same way', () => {
    expect(replyFor(privateMessage('/start marathon'))?.chatId).toBe(42);
  });

  it('answers any other command with the same greeting', () => {
    expect(replyFor(privateMessage('/help'))?.chatId).toBe(42);
  });

  /* An ordinary message is a question for the coach now, not a cue for the promo. */
  it('does not greet an ordinary message', () => {
    expect(replyFor(privateMessage('привет'))).toBeNull();
  });

  it('greets somebody whose Telegram is in English in English', () => {
    const r = replyFor(privateMessage('/start', 'en-GB'))!;
    expect(r.locale).toBe('en');
    expect(r.text).toBe(DEFAULT_COPY.en.greeting);
    expect(r.buttonText).toBe(DEFAULT_COPY.en.buttonText);
  });

  it('stays out of groups, where a web_app button would not launch anyway', () => {
    expect(replyFor({ message: { chat: { id: 42, type: 'group' }, text: '/start' } })).toBeNull();
  });

  it('ignores an update with nothing to answer', () => {
    expect(replyFor({})).toBeNull();
    expect(replyFor({ message: { chat: { id: 42, type: 'private' } } })).toBeNull();
    expect(replyFor(privateMessage('   '))).toBeNull();
  });

  it('takes the copy it is given', () => {
    expect(replyFor(privateMessage('/start'), COPY)).toEqual({
      chatId: 42,
      locale: 'ru',
      text: ONE.greeting,
      buttonText: ONE.buttonText,
      siteButtonText: ONE.siteButtonText,
      photoUrl: ONE.photoUrl,
    });
  });
});

describe('the greeting itself', () => {
  /*
   * The greeting used to end on «Что открыть?» and this test pinned that. The question went when
   * the greeting stopped describing one course and started naming all three things the product
   * sells, which is what the app's own three tabs are. What is worth pinning now is the naming:
   * a greeting that omits one of them sends somebody into an app with a tab they were not told
   * about, and the club is the one most likely to be forgotten, because it is the newest.
   *
   * Everything below runs against **both** languages. The English half is the same promise made
   * to a different reader, and a rule that only the Russian half obeys is a rule the English half
   * will break the first time either is edited.
   */
  const LOCALES: Locale[] = ['ru', 'en'];

  const SECTIONS: Record<Locale, string[]> = {
    // «один на один» was in this list until the owner rewrote the greeting; the third section is
    // called «Тренер» now, which is also what the tab is called.
    ru: ['Курсы', 'Клуб маленьких шагов', 'Тренер'],
    en: ['Courses', 'Club of small steps', 'Coach'],
  };

  it.each(LOCALES)('names all three things the product sells (%s)', (locale) => {
    for (const thing of SECTIONS[locale]) {
      expect(DEFAULT_COPY[locale].greeting).toContain(thing);
    }
  });

  /**
   * What Telegram counts is the text people see: the tags become entities and take no room. The
   * raw string is the wrong measure now that there are tags in it — it over-counts, which would
   * pass today and mislead whoever next tries to work out how much room is left.
   */
  const visible = (locale: Locale) =>
    DEFAULT_COPY[locale].greeting.replace(/<\/?(b|i|u|s|code|pre|blockquote)>/g, '');

  it.each(LOCALES)('fits in a caption, which is a quarter of a message (%s)', (locale) => {
    // 1024 against a message's 4096. Going over does not truncate: `sendPhoto` fails outright and
    // the bot falls back to text, so the photograph disappears and the message still looks fine.
    expect(visible(locale).length).toBeLessThanOrEqual(1024);
    // Close enough to the ceiling that this test is the reason to check before adding a line.
    expect(visible(locale).length).toBeGreaterThan(800);
  });

  it.each(LOCALES)('closes every tag it opens (%s)', (locale) => {
    const g = DEFAULT_COPY[locale].greeting;
    const opened = [...g.matchAll(/<(\w+)>/g)].map((m) => m[1]);
    const closed = [...g.matchAll(/<\/(\w+)>/g)].map((m) => m[1]);
    // An unclosed tag is a rejected parse, and a rejected parse is a greeting nobody receives.
    expect(opened.sort()).toEqual(closed.sort());
  });

  it.each(LOCALES)('uses only the tags Telegram understands (%s)', (locale) => {
    // Telegram's HTML is a short list, and an unknown tag is a rejected message rather than a tag
    // rendered literally. `<br>`, `<p>` and `<span>` are the usual ones to reach for; none is on it.
    const allowed = new Set(['b', 'i', 'u', 's', 'a', 'code', 'pre', 'blockquote']);
    for (const [, tag] of DEFAULT_COPY[locale].greeting.matchAll(/<\/?(\w+)[^>]*>/g)) {
      expect(allowed.has(tag!), `unexpected tag <${tag}>`).toBe(true);
    }
  });

  it.each(LOCALES)('carries no Markdown, because nothing sets parse_mode (%s)', (locale) => {
    expect(DEFAULT_COPY[locale].greeting).not.toMatch(/[*_`[\]]/);
  });

  /* The whole point of the English half: no Cyrillic left in it anywhere. */
  it('leaves no Russian in the English greeting', () => {
    expect(DEFAULT_COPY.en.greeting).not.toMatch(/[А-Яа-яЁё]/);
    expect(DEFAULT_COPY.en.buttonText).not.toMatch(/[А-Яа-яЁё]/);
    expect(DEFAULT_COPY.en.siteButtonText).not.toMatch(/[А-Яа-яЁё]/);
  });
});

describe('which language the greeting is in', () => {
  /*
   * Russian is the default: Forma sells in roubles and the coach speaks Russian, and most people
   * whose phone is set to Ukrainian or Kazakh read Russian. Greeting them in English would be the
   * more confident mistake.
   */
  it('greets the post-Soviet languages in Russian', () => {
    for (const code of ['ru', 'RU', 'uk', 'be', 'kk', 'hy', 'ka', 'ru-RU']) {
      expect(localeOf(privateMessage('/start', code))).toBe('ru');
    }
  });

  it('greets everyone else in English', () => {
    for (const code of ['en', 'en-US', 'de', 'es', 'tr', 'fr-CA']) {
      expect(localeOf(privateMessage('/start', code))).toBe('en');
    }
  });

  /* Telegram often omits it, and a missing signal is not a signal to switch languages. */
  it('falls back to Russian when Telegram says nothing', () => {
    expect(localeOf({ message: { chat: { id: 1, type: 'private' }, text: '/start' } })).toBe('ru');
    expect(localeOf(privateMessage('/start', ''))).toBe('ru');
  });

  /*
   * An English greeting followed by a button onto a Russian page would be worse than not
   * translating the greeting at all.
   */
  it('sends an English reader to the English site', () => {
    expect(siteUrlFor('en', 'https://forma-app.co/')).toBe('https://forma-app.co/en/');
    expect(siteUrlFor('ru', 'https://forma-app.co/')).toBe('https://forma-app.co/');
  });

  it('leaves a site URL it does not recognise exactly as given', () => {
    // Guessing at somebody else's URL structure is how a working link becomes a 404.
    expect(siteUrlFor('en', 'https://example.test/landing/')).toBe('https://example.test/landing/');
    expect(siteUrlFor('en', '')).toBe('');
  });
});

describe('keyboard', () => {
  it('puts the app and the site on their own rows, in that order', () => {
    const reply = replyFor(privateMessage('/start'), COPY)!;
    expect(keyboard(reply, APP, SITE)).toEqual({
      inline_keyboard: [[{ text: 'Train', web_app: { url: APP } }], [{ text: 'Read', url: SITE }]],
    });
  });

  it('drops the site row rather than showing an empty button', () => {
    const blank: BotCopy = { ...ONE, siteButtonText: '' };
    const noLabel = replyFor(privateMessage('/start'), { ru: blank, en: blank })!;
    expect(keyboard(noLabel, APP, SITE).inline_keyboard).toHaveLength(1);
    const noUrl = replyFor(privateMessage('/start'), COPY)!;
    expect(keyboard(noUrl, APP, '').inline_keyboard).toHaveLength(1);
  });
});

describe('payloads', () => {
  it('sends the picture with the greeting as its caption', () => {
    const reply = replyFor(privateMessage('/start'), COPY)!;
    expect(sendPhotoBody(reply, APP, SITE)).toEqual({
      chat_id: 42,
      photo: 'https://example.test/card.png',
      caption: 'Hi',
      parse_mode: 'HTML',
      reply_markup: keyboard(reply, APP, SITE),
    });
  });

  it('sends the same words and the same buttons without the picture', () => {
    const reply = replyFor(privateMessage('/start'), COPY)!;
    const photo = sendPhotoBody(reply, APP, SITE);
    const text = sendMessageBody(reply, APP, SITE);
    expect(text).toEqual({
      chat_id: 42,
      text: 'Hi',
      parse_mode: 'HTML',
      reply_markup: keyboard(reply, APP, SITE),
    });
    // The fallback must lose the picture and nothing else.
    expect(text.reply_markup).toEqual(photo.reply_markup);
    expect(text.text).toEqual(photo.caption);
  });
});

describe('isCommand', () => {
  it('knows a command the way Telegram marks one', () => {
    expect(isCommand('/start')).toBe(true);
    expect(isCommand('/start marathon')).toBe(true);
    expect(isCommand('/help@forma_bot')).toBe(true);
    expect(isCommand('  /start')).toBe(true);
  });

  it('does not take a slash in a sentence for a command', () => {
    expect(isCommand('привет')).toBe(false);
    expect(isCommand('3/4 подхода')).toBe(false);
    expect(isCommand('/ ну и что')).toBe(false);
    expect(isCommand('//')).toBe(false);
  });
});

describe('routeUpdate', () => {
  it('greets a command', () => {
    expect(routeUpdate(privateMessage('/start'))?.kind).toBe('greeting');
  });

  it('passes an ordinary message on, with who sent it', () => {
    expect(routeUpdate(privateMessage('Колено болит — можно заниматься?'))).toEqual({
      kind: 'support',
      request: {
        chatId: 42,
        locale: 'ru',
        telegramId: 4242,
        messageId: 7,
        name: 'Аня К',
        username: 'anya_k',
        text: 'Колено болит — можно заниматься?',
        attachment: '',
      },
    });
  });

  it('keeps the language of the sender for the reply', () => {
    const route = routeUpdate(privateMessage('hello', 'en-US'));
    expect(route?.kind === 'support' && route.request.locale).toBe('en');
  });

  /* Посчитано в символах, а не в UTF-16: эмодзи не режется пополам. */
  it('cuts a long message on a whole character', () => {
    const route = routeUpdate(privateMessage('💪'.repeat(SUPPORT_MAX + 50)));
    expect(route?.kind).toBe('support');
    if (route?.kind !== 'support') return;
    expect(Array.from(route.request.text)).toHaveLength(SUPPORT_MAX);
    expect(route.request.text.endsWith('💪')).toBe(true);
  });

  it('passes a caption on and says what it was under', () => {
    const update: TelegramUpdate = {
      message: {
        message_id: 8,
        chat: { id: 42, type: 'private' },
        from: { id: 4242, first_name: 'Аня' },
        photo: [{}],
        caption: 'вот так правильно?',
      },
    };
    const route = routeUpdate(update);
    expect(route?.kind === 'support' && route.request).toMatchObject({
      text: 'вот так правильно?',
      attachment: 'photo',
      username: '',
      name: 'Аня',
    });
  });

  it('answers a photo, a voice note or a sticker with no words with a note', () => {
    for (const media of ['photo', 'voice', 'sticker', 'video_note'] as const) {
      const update: TelegramUpdate = {
        message: { chat: { id: 42, type: 'private' }, from: { id: 4242 }, [media]: {} },
      };
      expect(routeUpdate(update), media).toEqual({ kind: 'media', chatId: 42, locale: 'ru' });
    }
  });

  it('leaves groups, bots and nameless senders alone', () => {
    const group = privateMessage('привет');
    group.message.chat.type = 'supergroup';
    expect(routeUpdate(group)).toBeNull();

    const bot: TelegramUpdate = {
      message: { chat: { id: 42, type: 'private' }, from: { id: 1, is_bot: true }, text: 'hi' },
    };
    expect(routeUpdate(bot)).toBeNull();

    const nobody: TelegramUpdate = { message: { chat: { id: 42, type: 'private' }, text: 'hi' } };
    expect(routeUpdate(nobody)).toBeNull();
  });

  it('drops a username that is not one', () => {
    const odd = privateMessage('вопрос');
    odd.message.from.username = 'not a name';
    const route = routeUpdate(odd);
    expect(route?.kind === 'support' && route.request.username).toBe('');
  });
});

describe('the support path', () => {
  it('names the arguments the way support_from_telegram takes them', () => {
    const route = routeUpdate(privateMessage('вопрос'));
    if (route?.kind !== 'support') throw new Error('expected support');
    expect(supportRpcArgs(route.request)).toEqual({
      p_telegram_id: 4242,
      p_message_id: 7,
      p_name: 'Аня К',
      p_username: 'anya_k',
      p_locale: 'ru',
      p_text: 'вопрос',
      p_attachment: null,
    });
  });

  it('reads only the answers the database can give', () => {
    expect(parseSupportStatus('queued')).toBe('queued');
    expect(parseSupportStatus('muted')).toBe('muted');
    expect(parseSupportStatus('something')).toBe('failed');
    expect(parseSupportStatus(null)).toBe('failed');
    expect(parseSupportStatus({ code: 'PGRST202' })).toBe('failed');
  });

  it('answers briefly, in the sender’s language', () => {
    expect(supportReplyText('queued', 'ru', true)).toBe(SUPPORT_COPY.ru.queued);
    expect(supportReplyText('queued', 'en', true)).toBe(SUPPORT_COPY.en.queued);
    expect(SUPPORT_COPY.ru.queued).toContain('Передали тренеру');
    expect(SUPPORT_COPY.en.queued).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('asks for a way back from somebody with no username', () => {
    expect(supportReplyText('queued', 'ru', false)).toBe(SUPPORT_COPY.ru.queuedNoUsername);
  });

  /* Защита от спама не должна сама стать спамом: «подожди» — один раз, дальше тишина. */
  it('says wait once, then stays quiet', () => {
    expect(supportReplyText('limited', 'ru', true)).toBe(SUPPORT_COPY.ru.limited);
    expect(supportReplyText('muted', 'ru', true)).toBeNull();
    expect(supportReplyText('duplicate', 'ru', true)).toBeNull();
  });

  it('owns up when the message did not go through', () => {
    expect(supportReplyText('failed', 'en', true)).toBe(SUPPORT_COPY.en.failed);
  });

  it('keeps every reply short and plain', () => {
    for (const locale of ['ru', 'en'] as const) {
      for (const text of Object.values(SUPPORT_COPY[locale])) {
        expect(text.length).toBeLessThan(300);
        // Sent without parse_mode: nothing here may look like markup.
        expect(text).not.toMatch(/[<>*_`]/);
      }
    }
  });
});

describe('the swipe in the greeting', () => {
  /* The player moves to the next exercise on a swipe up; the greeting used to say down. */
  it('says up, in both languages', () => {
    expect(DEFAULT_COPY.ru.greeting).toContain('свайп вверх');
    expect(DEFAULT_COPY.ru.greeting).not.toContain('свайп вниз');
    expect(DEFAULT_COPY.en.greeting).toContain('swipe up');
    expect(DEFAULT_COPY.en.greeting).not.toContain('swipe down');
  });
});
