import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COPY,
  keyboard,
  localeOf,
  replyFor,
  sendMessageBody,
  sendPhotoBody,
  siteUrlFor,
  type BotCopy,
  type Locale,
} from './index';

/** A message from somebody whose Telegram is in Russian, unless told otherwise. */
const privateMessage = (text: string, language_code = 'ru') => ({
  message: { chat: { id: 42, type: 'private' }, from: { language_code }, text },
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

  it('answers anything else a person types, because they want the same thing', () => {
    expect(replyFor(privateMessage('привет'))?.chatId).toBe(42);
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
