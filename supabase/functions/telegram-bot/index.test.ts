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
  it('ends on the question the buttons answer', () => {
    expect(DEFAULT_COPY.greeting.trimEnd().endsWith('Что открыть?')).toBe(true);
  });

  it('fits in a caption, which is shorter than a message', () => {
    expect(DEFAULT_COPY.greeting.length).toBeLessThanOrEqual(1024);
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
      reply_markup: keyboard(reply, APP, SITE),
    });
  });

  it('sends the same words and the same buttons without the picture', () => {
    const reply = replyFor(privateMessage('/start'), COPY)!;
    const photo = sendPhotoBody(reply, APP, SITE);
    const text = sendMessageBody(reply, APP, SITE);
    expect(text).toEqual({ chat_id: 42, text: 'Hi', reply_markup: keyboard(reply, APP, SITE) });
    // The fallback must lose the picture and nothing else.
    expect(text.reply_markup).toEqual(photo.reply_markup);
    expect(text.text).toEqual(photo.caption);
  });
});
