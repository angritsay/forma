import { describe, expect, it } from 'vitest';
import { kindOfAccept, ownsObject } from './MediaField';

describe('kindOfAccept', () => {
  it('reads the kind off the accept attribute', () => {
    expect(kindOfAccept('image/*')).toBe('image');
    expect(kindOfAccept('video/*')).toBe('video');
    expect(kindOfAccept('audio/*')).toBe('audio');
    expect(kindOfAccept('audio/mp4,audio/mpeg')).toBe('audio');
    expect(kindOfAccept('')).toBe('image');
  });
});

describe('ownsObject', () => {
  it('claims only the object this field would have uploaded', () => {
    expect(ownsObject('storage:audio/shared/lotus.ru.m4a', 'audio', 'shared/lotus.ru')).toBe(true);
    expect(ownsObject('storage:audio/shared/lotus.ru.m4a', 'audio', 'shared/lotus')).toBe(false);
    expect(ownsObject('storage:videos/shared/lotus.ru.mp4', 'audio', 'shared/lotus.ru')).toBe(
      false,
    );
    expect(ownsObject('https://cdn.example.com/lotus.m4a', 'audio', 'shared/lotus.ru')).toBe(false);
  });
});
