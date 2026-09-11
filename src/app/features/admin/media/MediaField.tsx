/**
 * Upload one file and keep the `storage:<bucket>/<path>` reference it produced.
 *
 * Used wherever the admin panel attaches media: a course cover, a day's picture, an exercise's
 * video or still. The caller owns the path (so re-uploading replaces rather than accumulates) and
 * receives the reference to store; this component owns the file input, the progress and the
 * preview.
 */
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { PUBLIC_BUCKET, publicMediaUrl, uploadMedia } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';

export interface MediaFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** The stored reference, or null when nothing is attached yet. */
  value: string | null;
  onChange: (ref: string | null) => void;
  /** Which bucket to upload into: `images` (public) or `videos` (private). */
  bucket: string;
  /**
   * The object path, *without* an extension — this component appends the uploaded file's own.
   * Keep it stable for a given field so a re-upload overwrites instead of orphaning the old file.
   */
  pathBase: string;
  accept: string;
  /** Bytes. A video that will not upload is better refused here than after a two-minute wait. */
  maxBytes?: number;
}

const DEFAULT_MAX_BYTES = 200 * 1024 * 1024;

/** `pose.final.MP4` → `mp4`; falls back to the MIME subtype, then to `bin`. */
function extensionOf(file: File): string {
  const fromName = /\.([a-z0-9]{1,8})$/i.exec(file.name)?.[1];
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/')[1];
  return fromType ? fromType.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin' : 'bin';
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
}: MediaFieldProps) {
  const { t } = useT();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
      onChange(await uploadMedia(bucket, `${pathBase}.${extensionOf(file)}`, file));
      toast.show({ kind: 'success', title: t('app.mediaUploaded') });
    } catch {
      toast.show({ kind: 'error', title: t('app.mediaUploadError') });
    } finally {
      setBusy(false);
    }
  };

  /*
   * The preview is only ever drawn for the public bucket. A video lives in the private one and
   * would need a signed URL to show; the reference itself is the useful thing to see there, and
   * the coach checks the video by playing the workout.
   */
  const preview = value && bucket === PUBLIC_BUCKET ? publicMediaUrl(value) : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">{label}</span>
      <div className="flex items-start gap-3">
        {preview ? (
          <img
            src={preview}
            alt=""
            className="size-20 shrink-0 rounded-inner border border-border object-cover"
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {value ? (
            <span className="truncate font-mono text-xs text-muted" title={value}>
              {value}
            </span>
          ) : (
            <span className="text-sm text-muted-2">{t('app.mediaNone')}</span>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              icon={busy ? <Spinner size={16} /> : <Icon name="plus" size={16} />}
              onClick={() => input.current?.click()}
            >
              {value ? t('app.mediaReplace') : t('app.mediaUpload')}
            </Button>
            {value ? (
              <Button
                variant="ghost"
                disabled={busy}
                icon={<Icon name="close" size={16} />}
                onClick={() => onChange(null)}
              >
                {t('app.mediaRemove')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
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
