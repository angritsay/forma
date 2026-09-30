/**
 * «Поделиться»: the story picture and the places it can go.
 *
 * The owner: «кнопка "Поделиться" сразу подкидывала: Инстаграм, Телеграм и так далее… и мы делаем
 * картинку с результатами тренировки, в нашем весёлом разном брендинге». So the sheet opens on the
 * picture itself (one of six designs, `story/templates.ts`, chosen by the seed so reopening
 * shows the same one) with «Другой вариант» under it, and a grid of targets — each only where it
 * can work (`targets.ts`).
 *
 * **The sheet does not know what it is sharing.** It was written for a finished workout and built
 * the picture's facts itself; the club's day and its week recap share through the same sheet now
 * (`ClubShare`), so the facts arrive already built (`story/data.ts`: `workoutStoryData`,
 * `clubStoryData`) with the line that goes with them and a seed for the design. Nothing else
 * changed: the six templates, the targets, the upload and the caption cap are the same for both.
 *
 * The PNG is drawn once per design and kept for the life of the sheet; an upload (needed for
 * Telegram, which fetches the picture from a public URL) is likewise done once per design.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/app/hooks/useT';
import { isConfigured } from '@/lib/api/client';
import { isDemo } from '@/lib/api/mode';
import { uploadStory, type StoryUpload } from '@/lib/api/storage';
import {
  canDownloadFile,
  canShareToStory,
  downloadFile,
  haptic,
  isTelegram,
  openExternal,
  shareToStory,
} from '@/lib/telegram/webapp';
import { BRAND } from '@content/site/brand';
import { appLink } from './appLink';
import type { StoryData } from './story/layout';
import { renderStory } from './story/render';
import { nextTemplate, pickTemplate, type StoryTemplateId } from './story/templates';
import {
  instagramRoute,
  needsPicture,
  saveRoute,
  shareTargets,
  storyCaption,
  storyFileName,
  telegramChatShareUrl,
  type ShareEnv,
  type ShareTarget,
} from './targets';

export interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** The picture's facts, already built (`story/data.ts`). */
  data: StoryData;
  /** The line that travels with the picture: the chat message, the story's caption. */
  text: string;
  /**
   * A link to go with the line — the member's referral link (`useReferralLink`) from both the
   * club and the workout summary. The chat target sends it as the message's URL (unless the
   * picture itself can be linked), the story's widget carries it as its link, and the system
   * share and the clipboard get it appended to `text`. Without it the widget and the chat fall
   * back to the plain app link and the other two get the text alone.
   */
  link?: string;
  /** Picks the design and names the file: a session id, a task id — anything stable. */
  seed: string;
}

interface Rendered {
  blob: Blob;
  url: string;
}

const INSTAGRAM = 'https://www.instagram.com/';

function canShareFile(file: File): boolean {
  try {
    return typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] }) === true;
  } catch {
    return false;
  }
}

/** A plain download through a temporary link (outside Telegram). */
function anchorDownload(url: string, name: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function isAbort(e: unknown): boolean {
  return e instanceof Error && e.name === 'AbortError';
}

/**
 * The picture's place in the sheet: the story, the skeleton while it is drawn, or — when drawing
 * failed — what happened and a way to try again. It used to stay a skeleton for good after a
 * failure, with every button under it dead.
 */
export function SharePreview({
  url,
  failed,
  onRetry,
}: {
  url: string | null;
  failed: boolean;
  onRetry: () => void;
}) {
  const { t } = useT();
  if (url) {
    return (
      <img src={url} alt={t('app.sharePreviewAlt')} className="block h-full w-full object-cover" />
    );
  }
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
        <p role="alert" className="text-[13px] leading-snug text-muted">
          {t('app.shareRenderFailedBody')}
        </p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  return (
    <div role="status" aria-label={t('app.shareRendering')} className="h-full w-full">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export function ShareSheet({ open, onClose, data, text, link, seed }: ShareSheetProps) {
  const { t } = useT();
  const toast = useToast();
  const [template, setTemplate] = useState<StoryTemplateId>(() => pickTemplate(seed));
  const [rendered, setRendered] = useState<Rendered | null>(null);
  const [renderError, setRenderError] = useState(false);
  /** Bumped by «Повторить» under a failed picture, to draw it again. */
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState<ShareTarget | null>(null);
  const cache = useRef(new Map<StoryTemplateId, Rendered>());
  const uploads = useRef(new Map<StoryTemplateId, Promise<StoryUpload>>());
  const withLink = link ? `${text} ${link}` : text;

  // Read through a ref so a new toast API or locale does not start a second drawing mid-way.
  const renderFailed = useRef(() => {});
  renderFailed.current = () => toast.show({ kind: 'error', title: t('app.shareRenderFailed') });

  /*
   * The facts changed under the sheet (a proof struck out, the board moved): forget every
   * picture drawn of the old ones. Declared before the drawing effect below on purpose — effects
   * run in order, and the drawing effect must find the cache empty rather than hit a stale
   * picture whose URL this one is about to revoke.
   */
  useEffect(() => {
    const entries = cache.current;
    for (const e of entries.values()) URL.revokeObjectURL(e.url);
    entries.clear();
    uploads.current.clear();
  }, [data]);

  // Draw the current design once; every later visit to it reads the cache.
  useEffect(() => {
    if (!open) return;
    const hit = cache.current.get(template);
    if (hit) {
      setRendered(hit);
      return;
    }
    let alive = true;
    setRendered(null);
    setRenderError(false);
    renderStory(data, template)
      .then((blob) => {
        const entry = { blob, url: URL.createObjectURL(blob) };
        cache.current.set(template, entry);
        if (alive) setRendered(entry);
      })
      .catch(() => {
        if (!alive) return;
        setRenderError(true);
        renderFailed.current();
      });
    return () => {
      alive = false;
    };
  }, [open, template, data, attempt]);

  // The object URLs die with the sheet's owner.
  useEffect(() => {
    const entries = cache.current;
    return () => {
      for (const e of entries.values()) URL.revokeObjectURL(e.url);
      entries.clear();
    };
  }, []);

  const fileName = storyFileName(seed, template);
  const file = useMemo(
    () => (rendered ? new File([rendered.blob], fileName, { type: 'image/png' }) : null),
    [rendered, fileName],
  );
  const env: ShareEnv = {
    fileShare: file ? canShareFile(file) : false,
    telegram: isTelegram(),
    storyApi: canShareToStory(),
    downloadApi: canDownloadFile(),
    publicUploads: isConfigured() && !isDemo(),
  };
  const targets = shareTargets(env);

  const upload = useCallback(
    (blob: Blob): Promise<StoryUpload> => {
      let pending = uploads.current.get(template);
      if (!pending) {
        pending = uploadStory(blob, fileName);
        uploads.current.set(template, pending);
        // A failed upload is not remembered: the next tap tries again.
        pending.catch(() => uploads.current.delete(template));
      }
      return pending;
    },
    [template, fileName],
  );

  const failed = () => {
    haptic('error');
    toast.show({ kind: 'error', title: t('app.shareFailed') });
  };

  async function telegramSave(blob: Blob): Promise<boolean> {
    const { url } = await upload(blob);
    return downloadFile(url, fileName);
  }

  async function run(target: ShareTarget): Promise<void> {
    // The chat and the system share go without a picture; the rest cannot.
    if (needsPicture(target) && (!rendered || !file)) return;
    setBusy(target);
    try {
      switch (target) {
        case 'instagram': {
          if (!rendered || !file) return;
          const route = instagramRoute(env);
          if (route === 'share') {
            await navigator.share({ files: [file] });
            haptic('success');
          } else if (route === 'telegramDownload') {
            if (await telegramSave(rendered.blob)) {
              haptic('success');
              toast.show({ kind: 'success', title: t('app.shareInstagramSaved') });
              openExternal(INSTAGRAM);
            }
          } else if (route === 'download') {
            anchorDownload(rendered.url, fileName);
            toast.show({ kind: 'success', title: t('app.shareInstagramSaved') });
          }
          return;
        }
        case 'telegramStory': {
          if (!rendered) return;
          const { url, public: isPublic } = await upload(rendered.blob);
          const ok =
            isPublic &&
            shareToStory(url, {
              text: storyCaption(text),
              widget_link: { url: link ?? appLink(), name: BRAND.name },
            });
          if (ok) haptic('success');
          else failed();
          return;
        }
        case 'telegramChat': {
          // The picture itself when it can be put somewhere public; the caller's link (the
          // club's referral link) stays in the message either way (`telegramChatShareUrl`).
          const picture =
            env.publicUploads && rendered
              ? await upload(rendered.blob)
                  .then((u) => (u.public ? u.url : null))
                  .catch(() => null)
              : null;
          const shareUrl = telegramChatShareUrl(text, link, picture, appLink());
          if (!openExternal(shareUrl)) window.open(shareUrl, '_blank', 'noopener');
          return;
        }
        case 'save': {
          if (!rendered) return;
          if (saveRoute(env) === 'telegramDownload') {
            if (await telegramSave(rendered.blob)) {
              haptic('success');
              toast.show({ kind: 'success', title: t('app.shareSaved') });
            }
          } else {
            anchorDownload(rendered.url, fileName);
          }
          return;
        }
        case 'more': {
          if (typeof navigator.share === 'function') {
            const withFile =
              file && env.fileShare && navigator.canShare?.({ text: withLink, files: [file] });
            await navigator.share(
              withFile && file ? { text: withLink, files: [file] } : { text: withLink },
            );
            haptic('success');
            return;
          }
          await navigator.clipboard.writeText(withLink);
          toast.show({ kind: 'success', title: t('app.summaryShareCopied') });
          return;
        }
      }
    } catch (e) {
      if (!isAbort(e)) failed();
    } finally {
      setBusy(null);
    }
  }

  const LABEL: Record<ShareTarget, string> = {
    instagram: t('app.shareInstagram'),
    telegramStory: t('app.shareTelegramStory'),
    telegramChat: t('app.shareTelegramChat'),
    save: t('app.shareSave'),
    more: t('app.shareMore'),
  };
  const gallery = instagramRoute(env) !== 'share';

  return (
    <Sheet open={open} onClose={onClose} title={t('app.shareSheetTitle')}>
      <div className="flex flex-col items-center gap-3">
        <div className="aspect-[9/16] w-[min(52vw,220px)] overflow-hidden rounded-card bg-surface-2">
          <SharePreview
            url={rendered?.url ?? null}
            failed={renderError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={(!rendered && !renderError) || busy !== null}
          onClick={() => setTemplate((id) => nextTemplate(id))}
        >
          {t('app.shareAnother')}
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {targets.map((target, i) => (
          <Button
            key={target}
            variant={i === 0 ? 'primary' : 'secondary'}
            size="lg"
            fullWidth
            className={target === 'more' && targets.length % 2 === 1 ? 'col-span-2' : undefined}
            loading={busy === target}
            disabled={(needsPicture(target) && !rendered) || (busy !== null && busy !== target)}
            onClick={() => void run(target)}
          >
            {LABEL[target]}
          </Button>
        ))}
      </div>
      {gallery && targets.includes('instagram') ? (
        <p className="mt-3 text-[13px] leading-snug text-muted">{t('app.shareInstagramHint')}</p>
      ) : null}
    </Sheet>
  );
}
