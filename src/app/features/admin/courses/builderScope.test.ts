import { describe, expect, it } from 'vitest';
import type { MyCreator } from '@/lib/api/types';
import {
  ADMIN_SCOPE,
  canEditCourse,
  coursesBase,
  creatorLock,
  creatorScope,
  mediaPrefix,
  type BuilderScope,
} from './builderScope';

const me = (status: MyCreator['status']): MyCreator => ({
  id: 'c1',
  slug: 'ann',
  name: 'Ann',
  tier: 'start',
  status,
  about: null,
  audienceUrl: null,
  followers: null,
  feePct: 0,
  createdAt: '2026-10-01T00:00:00Z',
  approvedAt: '2026-10-01T00:00:00Z',
  courses: 0,
  buyers: 0,
});

const draft = {
  status: 'draft' as const,
  publishedAt: null,
  reviewRequestedAt: null,
  creatorId: 'c1',
};
const open: BuilderScope = { kind: 'creator', creatorId: 'c1', open: true };

describe('builder scope', () => {
  it('admits open and paused creators only', () => {
    expect(creatorScope(null)).toBeNull();
    expect(creatorScope(me('applied'))).toBeNull();
    expect(creatorScope(me('declined'))).toBeNull();
    expect(creatorScope(me('active'))).toEqual(open);
    expect(creatorScope(me('paused'))).toEqual({ kind: 'creator', creatorId: 'c1', open: false });
  });

  it('keeps a creator under their own storage prefix and route', () => {
    expect(mediaPrefix(open)).toBe('creators/c1/');
    expect(mediaPrefix(ADMIN_SCOPE)).toBe('');
    expect(coursesBase(open)).toBe('/creator/courses');
    expect(coursesBase(ADMIN_SCOPE)).toBe('/admin/courses');
  });

  it('lets a creator edit only an open, never-published draft of theirs', () => {
    expect(canEditCourse(open, draft)).toBe(true);
    expect(canEditCourse(open, { ...draft, creatorId: 'c2' })).toBe(false);
    expect(canEditCourse(open, { ...draft, reviewRequestedAt: '2026-10-09T00:00:00Z' })).toBe(
      false,
    );
    expect(canEditCourse(open, { ...draft, publishedAt: '2026-10-09T00:00:00Z' })).toBe(false);
    expect(canEditCourse(open, { ...draft, status: 'published' })).toBe(false);
    expect(canEditCourse({ ...open, open: false }, draft)).toBe(false);
    expect(canEditCourse(ADMIN_SCOPE, { ...draft, status: 'published' })).toBe(true);
  });

  it('says why a creator course is locked', () => {
    expect(creatorLock(open, draft)).toBeNull();
    expect(creatorLock(open, { ...draft, reviewRequestedAt: 'x' })).toBe('review');
    expect(creatorLock(open, { ...draft, publishedAt: 'x' })).toBe('published');
    expect(creatorLock({ ...open, open: false }, draft)).toBe('paused');
    expect(creatorLock(ADMIN_SCOPE, { ...draft, status: 'published' })).toBeNull();
  });
});
