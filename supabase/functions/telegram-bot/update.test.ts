import { describe, expect, it } from 'vitest';
import { DEFAULT_COPY, replyFor, sendMessageBody } from './update';

const privateMessage = (text: string) => ({
  message: { chat: { id: 42, type: 'private' }, text },
});

describe('replyFor', () => {
  it('answers /start', () => {
    expect(replyFor(privateMessage('/start'))).toEqual({
      chatId: 42,
      text: DEFAULT_COPY.greeting,
      buttonText: DEFAULT_COPY.buttonText,
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
    const copy = { greeting: 'Hi', buttonText: 'Open' };
    expect(replyFor(privateMessage('/start'), copy)).toEqual({
      chatId: 42,
      text: 'Hi',
      buttonText: 'Open',
    });
  });
});

describe('sendMessageBody', () => {
  it('puts the app behind one inline web_app button', () => {
    const body = sendMessageBody(
      { chatId: 7, text: 'Hi', buttonText: 'Open' },
      'https://forma-app.co/app/',
    );
    expect(body).toEqual({
      chat_id: 7,
      text: 'Hi',
      reply_markup: {
        inline_keyboard: [[{ text: 'Open', web_app: { url: 'https://forma-app.co/app/' } }]],
      },
    });
  });
});
