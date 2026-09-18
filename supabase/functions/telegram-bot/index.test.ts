import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COPY,
  keyboard,
  replyFor,
  sendMessageBody,
  sendPhotoBody,
  type BotCopy,
} from './index';

const privateMessage = (text: string) => ({
  message: { chat: { id: 42, type: 'private' }, text },
});

const COPY: BotCopy = {
  greeting: 'Hi',
  buttonText: 'Train',
  siteButtonText: 'Read',
  photoUrl: 'https://example.test/card.png',
};

const APP = 'https://forma-app.co/app/';
const SITE = 'https://forma-app.co/courses/start/';

describe('replyFor', () => {
  it('answers /start', () => {
    expect(replyFor(privateMessage('/start'))).toEqual({
      chatId: 42,
      text: DEFAULT_COPY.greeting,
      buttonText: DEFAULT_COPY.buttonText,
      siteButtonText: DEFAULT_COPY.siteButtonText,
      photoUrl: DEFAULT_COPY.photoUrl,
    });
  });

  it('answers a deep link the same way', () => {
    expect(replyFor(privateMessage('/start marathon'))?.chatId).toBe(42);
  });

  it('answers anything else a person types, because they want the same thing', () => {
    expect(replyFor(privateMessage('привет'))?.chatId).toBe(42);
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
      text: COPY.greeting,
      buttonText: COPY.buttonText,
      siteButtonText: COPY.siteButtonText,
      photoUrl: COPY.photoUrl,
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
   */
  it('names all three things the product sells', () => {
    // «один на один» was in this list until the owner rewrote the greeting; the third section is
    // called «Тренер» now, which is also what the tab is called.
    for (const thing of ['Курсы', 'Клуб маленьких шагов', 'Тренер']) {
      expect(DEFAULT_COPY.greeting).toContain(thing);
    }
  });

  /**
   * What Telegram counts is the text people see: the tags become entities and take no room. The
   * raw string is the wrong measure now that there are tags in it — it over-counts, which would
   * pass today and mislead whoever next tries to work out how much room is left.
   */
  const visible = () => DEFAULT_COPY.greeting.replace(/<\/?(b|i|u|s|code|pre|blockquote)>/g, '');

  it('fits in a caption, which is a quarter of a message', () => {
    // 1024 against a message's 4096. Going over does not truncate: `sendPhoto` fails outright and
    // the bot falls back to text, so the photograph disappears and the message still looks fine.
    expect(visible().length).toBeLessThanOrEqual(1024);
    // Close enough to the ceiling that this test is the reason to check before adding a line.
    expect(visible().length).toBeGreaterThan(800);
  });

  it('closes every tag it opens', () => {
    const opened = [...DEFAULT_COPY.greeting.matchAll(/<(\w+)>/g)].map((m) => m[1]);
    const closed = [...DEFAULT_COPY.greeting.matchAll(/<\/(\w+)>/g)].map((m) => m[1]);
    // An unclosed tag is a rejected parse, and a rejected parse is a greeting nobody receives.
    expect(opened.sort()).toEqual(closed.sort());
  });

  it('uses only the tags Telegram understands', () => {
    // Telegram's HTML is a short list, and an unknown tag is a rejected message rather than a tag
    // rendered literally. `<br>`, `<p>` and `<span>` are the usual ones to reach for; none is on it.
    const allowed = new Set(['b', 'i', 'u', 's', 'a', 'code', 'pre', 'blockquote']);
    for (const [, tag] of DEFAULT_COPY.greeting.matchAll(/<\/?(\w+)[^>]*>/g)) {
      expect(allowed.has(tag!), `unexpected tag <${tag}>`).toBe(true);
    }
  });

  it('carries no Markdown, because nothing sets parse_mode', () => {
    expect(DEFAULT_COPY.greeting).not.toMatch(/[*_`[\]]/);
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
    const noLabel = replyFor(privateMessage('/start'), { ...COPY, siteButtonText: '' })!;
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
