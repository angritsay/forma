/**
 * Which share targets the sheet offers, and the small strings they are built from.
 *
 * A target is shown only when it can actually work on this device — a button that does nothing
 * is worse than no button:
 *
 *   - **Instagram Stories** — Instagram has no web API for Stories. The way in is the system share
 *     sheet with the picture as a file (`navigator.share({ files })` → Instagram → Stories). Where a
 *     webview cannot share files (some Telegram clients), the picture is saved to the phone with
 *     Telegram's `downloadFile` and Instagram is opened; outside Telegram it is downloaded.
 *   - **Telegram Stories** — native (`shareToStory`, Bot API 7.8), but it needs a public URL, so
 *     not in the demo, where there is no bucket to upload to.
 *   - **Telegram chat** — `t.me/share/url`, which works everywhere Telegram is installed.
 *   - **Save image** — `downloadFile` in Telegram (8.0), a plain download outside it.
 *   - **More…** — the system share with the text and the file, else the clipboard.
 *
 * Pure: the environment is passed in, so the rules are tested in node.
 */
import { hashSeed, type StoryTemplateId } from './story/templates';

export type ShareTarget = 'instagram' | 'telegramStory' | 'telegramChat' | 'save' | 'more';

export interface ShareEnv {
  /** `navigator.canShare({ files: [png] })`. */
  fileShare: boolean;
  /** Running inside Telegram. */
  telegram: boolean;
  /** The client can open the story editor (Bot API 7.8). */
  storyApi: boolean;
  /** The client can save a file (Bot API 8.0). */
  downloadApi: boolean;
  /** Uploads land at a public URL (false in the demo and without a backend). */
  publicUploads: boolean;
}

/** How the Instagram button gets the picture there, or null when it cannot. */
export function instagramRoute(env: ShareEnv): 'share' | 'telegramDownload' | 'download' | null {
  if (env.fileShare) return 'share';
  if (env.telegram) return env.downloadApi && env.publicUploads ? 'telegramDownload' : null;
  return 'download';
}

/** How «Сохранить картинку» saves, or null when it cannot. */
export function saveRoute(env: ShareEnv): 'telegramDownload' | 'download' | null {
  if (env.telegram) return env.downloadApi && env.publicUploads ? 'telegramDownload' : null;
  return 'download';
}

export function shareTargets(env: ShareEnv): ShareTarget[] {
  const out: ShareTarget[] = [];
  if (instagramRoute(env)) out.push('instagram');
  if (env.telegram && env.storyApi && env.publicUploads) out.push('telegramStory');
  out.push('telegramChat');
  if (saveRoute(env)) out.push('save');
  out.push('more');
  return out;
}

/** Telegram's own share picker for a link and a line of text. */
export function telegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/** A story's caption is capped at 200 characters for accounts without Premium. */
export function storyCaption(text: string, max = 200): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** `<sessionId>-<template>.png`, safe as a storage path; the seed is hashed when it is not an id. */
export function storyFileName(seed: string, template: StoryTemplateId): string {
  const id = /^[A-Za-z0-9_-]{1,64}$/.test(seed) ? seed : hashSeed(seed).toString(36);
  return `${id}-${template}.png`;
}
