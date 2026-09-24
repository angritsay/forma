/**
 * Upload one file and keep the `storage:<bucket>/<path>` reference it produced.
 *
 * Used wherever the admin panel attaches media: a course cover, a day's picture, an exercise's
 * video, still, spoken name or explanation. The caller owns the path (so re-uploading replaces
 * rather than accumulates) and receives the reference to store; this component owns the file
 * input, the progress and the preview.
 */
import { clsx } from 'clsx';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatBytes } from '@/i18n/index';
import { deleteMedia, uploadMedia } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export type MediaKind = 'image' | 'video' | 'audio';

export interface MediaFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** The stored reference, or null when nothing is attached yet. */
  value: string | null;
  onChange: (ref: string | null) => void;
  /** Which bucket to upload into: `images` (public), `videos` or `audio` (private). */
  bucket: string;
  /**
   * The object path, *without* an extension — this component appends the uploaded file's own.
   * Keep it stable for a given field so a re-upload overwrites instead of orphaning the old file.
   */
  pathBase: string;
  accept: string;
  /** Bytes. A video that will not upload is better refused here than after a two-minute wait. */
  maxBytes?: number;
  /** What the preview draws. Inferred from `accept` when omitted. */
  kind?: MediaKind;
}

const DEFAULT_MAX_BYTES = 200 * 1024 * 1024;

/** `pose.final.MP4` → `mp4`; falls back to the MIME subtype, then to `bin`. */
function extensionOf(file: File): string {
  const fromName = /\.([a-z0-9]{1,8})$/i.exec(file.name)?.[1];
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/')[1];
  return fromType ? fromType.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin' : 'bin';
}

/** `video/*` → video, `audio/mp4,audio/mpeg` → audio, anything else → image. */
export function kindOfAccept(accept: string): MediaKind {
  if (/^\s*video\//i.test(accept)) return 'video';
  if (/^\s*audio\//i.test(accept)) return 'audio';
  return 'image';
}

/**
 * Is this reference the object this field itself uploaded?
 *
 * A field owns `<bucket>/<pathBase>.<ext>` and nothing else. A reference that was typed in, or
 * that points at a clip a script uploaded under another name, is somebody else's file: removing
 * it from the field must not remove it from the bucket.
 */
export function ownsObject(value: string, bucket: string, pathBase: string): boolean {
  const prefix = `storage:${bucket}/${pathBase}.`;
  if (!value.startsWith(prefix)) return false;
  // Only an extension may follow: `lotus.` must not claim `lotus.ru.m4a`, a sibling field's file.
  return /^[a-z0-9]{1,8}$/i.test(value.slice(prefix.length));
}

export function MediaField({
  label,
  hint,
  value,
  onChange,
  bucket,
  pathBase,
  accept,
  maxBytes = DEFAULT_MAX_BYTES,
  kind = kindOfAccept(accept),
}: MediaFieldProps) {
  const { t } = useT();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  /** The size of the file that was just uploaded — what the coach checks after a re-encode. */
  const [uploadedBytes, setUploadedBytes] = useState<{ ref: string; bytes: number } | null>(null);
  /*
   * Public images resolve at once; a private clip or recording needs a signed URL, which the hook
   * fetches when it has to. Either way the preview is what was actually uploaded, which is the
   * check the coach is making.
   */
  const preview = useMediaUrl(value ?? undefined);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input either way, so picking the same file twice still fires a change.
    e.target.value = '';
    if (!file) return;
    if (file.size > maxBytes) {
      toast.show({
        kind: 'error',
        title: t('app.mediaTooLarge', { mb: Math.round(maxBytes / 1024 / 1024) }),
      });
      return;
    }
    setBusy(true);
    try {
      const ref = await uploadMedia(bucket, `${pathBase}.${extensionOf(file)}`, file);
      setUploadedBytes({ ref, bytes: file.size });
      onChange(ref);
      toast.show({ kind: 'success', title: t('app.mediaUploaded') });
    } catch {
      toast.show({ kind: 'error', title: t('app.mediaUploadError') });
    } finally {
      setBusy(false);
    }
  };

  /*
   * Clearing the field clears the reference first, whatever happens to the file: the reference is
   * what the product reads. The object is removed only when it is this field's own (see
   * `ownsObject`), and best effort — the demo backend refuses every delete, and a file that stays
   * behind is an orphan in the library, not a broken exercise.
   */
  const remove = async () => {
    const current = value;
    onChange(null);
    if (!current || !ownsObject(current, bucket, pathBase)) return;
    setBusy(true);
    try {
      await deleteMedia(current);
    } catch {
      toast.show({ kind: 'error', title: t('app.mediaDeleteError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        {hint ? <p className="text-[13px] text-muted-2">{hint}</p> : null}
      </div>
      {/*
       * The field is a ruled strip, not a box: a hairline above and below, the square thumbnail
       * on the left where a row's numeral would be, the reference and the two actions beside it.
       * The thumbnail is shown as uploaded — the product will draw it monochrome, but here the
       * coach is checking that the right file went up. A clip and a recording get the browser's
       * own controls: a play button is the whole check.
       */}
      <div className="flex items-start gap-3 border-y border-border py-3">
        {preview ? <Preview kind={kind} url={preview} /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {value ? (
            <span className="truncate font-mono text-xs text-muted" title={value}>
              {value}
            </span>
          ) : (
            <span className="text-[13px] text-muted-2">{t('app.mediaNone')}</span>
          )}
          {value && uploadedBytes?.ref === value ? (
            <span className="tabular text-[13px] text-muted-2">
              {formatBytes(uploadedBytes.bytes)}
            </span>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => input.current?.click()}
            >
              {value ? t('app.mediaReplace') : t('app.mediaUpload')}
            </Button>
            {value ? (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void remove()}>
                {t('app.mediaRemove')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => void pick(e)}
        // The file input is the control; the buttons above are its label.
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

/**
 * The uploaded file, drawn the way its kind is looked at: a thumbnail in the field by default,
 * or at whatever size `className` says (the library's preview sheet gives it the full width).
 */
export function Preview({
  kind,
  url,
  className,
}: {
  kind: MediaKind;
  url: string;
  className?: string;
}) {
  if (kind === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className={clsx('shrink-0 border border-border bg-bg', className ?? 'w-40 max-w-[45%]')}
      />
    );
  }
  if (kind === 'audio') {
    return (
      <audio
        src={url}
        controls
        preload="metadata"
        className={clsx('shrink-0', className ?? 'w-40 max-w-[45%]')}
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={clsx('shrink-0 border border-border object-cover', className ?? 'size-20')}
    />
  );
}
