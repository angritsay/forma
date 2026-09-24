/**
 * Everything in the buckets, folder by folder: what is there, how big it is, who plays it.
 *
 * The exercise editor uploads one file into one field, and that is the right way to attach a
 * clip to a pose. What it cannot answer is the question the owner asks after a month of
 * uploads — «what is in there, and what can go» — because a file whose exercise was deleted, or
 * one uploaded twice under two names, belongs to no field any more. So this screen reads the
 * bucket itself, marks each file with the exercises that reference it, and lets an unreferenced
 * one be removed. A referenced one cannot be: the exercise would go silent mid-workout.
 *
 * Three tabs are the three buckets. The folder list for the private ones is `shared/` and every
 * course the catalogue knows, because the first path segment is what gates a file (0003, 0048);
 * for images it is the one folder the exercise editor writes.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { formatBytes, formatDate } from '@/i18n/index';
import { listExerciseCatalog } from '@/lib/api/exercises';
import {
  AUDIO_BUCKET,
  deleteMedia,
  listMedia,
  PRIVATE_BUCKET,
  PUBLIC_BUCKET,
  uploadMedia,
} from '@/lib/api/storage';
import type { ExerciseCatalogRow, MediaObject } from '@/lib/api/types';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { useCatalogue } from '@/app/store/catalogue';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';
import { kindOfAccept, Preview, type MediaKind } from './MediaField';
import { refsByExercise, safeFileName } from './mediaUsage';

export type MediaTab = 'videos' | 'audio' | 'images';

const TAB_BUCKET: Record<MediaTab, string> = {
  videos: PRIVATE_BUCKET,
  audio: AUDIO_BUCKET,
  images: PUBLIC_BUCKET,
};
const TAB_ACCEPT: Record<MediaTab, string> = {
  videos: 'video/*',
  audio: 'audio/*',
  images: 'image/*',
};
/** The one folder the exercise editor writes stills into (`exercises/<id>.jpg`). */
const IMAGES_FOLDER = 'exercises';
const SHARED_FOLDER = 'shared';

type Status = 'loading' | 'ready' | 'error';

export function MediaLibrary() {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const courses = useCatalogue((s) => s.courses);

  const [tab, setTab] = useState<MediaTab>('videos');
  const [folder, setFolder] = useState(SHARED_FOLDER);
  const [files, setFiles] = useState<MediaObject[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [rows, setRows] = useState<ExerciseCatalogRow[]>([]);
  const [preview, setPreview] = useState<MediaObject | null>(null);
  const [deleting, setDeleting] = useState<MediaObject | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const bucket = TAB_BUCKET[tab];
  const kind: MediaKind = kindOfAccept(TAB_ACCEPT[tab]);

  /*
   * `shared` first, then the courses in catalogue order — compiled and published alike, which is
   * what `useCatalogue` already holds, so no second request. Images have one folder.
   */
  const folders = useMemo(
    () =>
      tab === 'images'
        ? [IMAGES_FOLDER]
        : [SHARED_FOLDER, ...courses.map((c) => c.id).filter((id) => id !== SHARED_FOLDER)],
    [tab, courses],
  );
  // Switching tabs resets the folder to the first one the new tab has.
  const activeFolder = folders.includes(folder) ? folder : folders[0]!;

  const usage = useMemo(() => refsByExercise(rows), [rows]);

  const refresh = useCallback(() => {
    setStatus('loading');
    listMedia(bucket, activeFolder)
      .then((list) => {
        setFiles(list);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [bucket, activeFolder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The catalogue is read once: it is the same rows whichever bucket is open.
  useEffect(() => {
    listExerciseCatalog()
      .then(setRows)
      .catch(() => toast.show({ kind: 'error', title: t('app.exLoadError') }));
  }, [toast, t]);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      await uploadMedia(bucket, `${activeFolder}/${safeFileName(file.name)}`, file);
      toast.show({ kind: 'success', title: t('app.mediaUploaded') });
      refresh();
    } catch (e2) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e2, 'app.mediaUploadError') });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    const file = deleting;
    setDeleting(null);
    if (!file) return;
    setBusy(true);
    try {
      await deleteMedia(file.ref);
      setFiles((prev) => prev.filter((f) => f.ref !== file.ref));
      toast.show({ kind: 'success', title: t('app.mediaLibDeleted') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.mediaDeleteError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 py-4">
        <Tabs<MediaTab>
          variant="fill"
          label={t('app.mediaLibTitle')}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'videos', label: t('app.mediaLibTabVideos') },
            { id: 'audio', label: t('app.mediaLibTabAudio') },
            { id: 'images', label: t('app.mediaLibTabImages') },
          ]}
        />
        <div className="flex items-end gap-3">
          <Select
            wrapperClassName="min-w-0 flex-1"
            label={t('app.mediaLibFolder')}
            value={activeFolder}
            onChange={setFolder}
            options={folders.map((f) => ({
              value: f,
              label: f === SHARED_FOLDER ? t('app.exVideoFolderShared') : f,
            }))}
          />
          <Button
            variant="secondary"
            loading={busy}
            icon={<Glyph size={16}>+</Glyph>}
            onClick={() => input.current?.click()}
          >
            {t('app.mediaLibUpload')}
          </Button>
        </div>
      </div>

      {status === 'loading' ? (
        <LoadingBlock />
      ) : status === 'error' ? (
        <EmptyState
          title={t('app.mediaLibLoadError')}
          action={
            <Button variant="secondary" onClick={refresh}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : files.length === 0 ? (
        <EmptyState title={t('app.mediaLibEmptyTitle')} description={t('app.mediaLibEmptyBody')} />
      ) : (
        <ul className="flex flex-col">
          {files.map((f, i) => {
            const usedBy = usage.get(f.ref) ?? [];
            return (
              <li
                key={f.ref}
                className="flex items-start gap-3 border-t border-border py-3 lg:gap-4"
              >
                <span className="numeral tabular w-6 shrink-0 pt-0.5 text-[13px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => setPreview(f)}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                >
                  <span className="truncate font-mono text-[13px] text-text" title={f.ref}>
                    {f.name}
                  </span>
                  <span className="tabular text-[13px] text-muted-2">
                    {f.sizeBytes !== null ? formatBytes(f.sizeBytes) : '—'}
                    {f.updatedAt ? ` · ${formatDate(locale, f.updatedAt)}` : ''}
                  </span>
                  {usedBy.length > 0 ? (
                    <span className="flex flex-wrap gap-1.5 pt-1">
                      {usedBy.map((id) => (
                        <Chip key={id} size="sm">
                          {id}
                        </Chip>
                      ))}
                    </span>
                  ) : (
                    <span className="text-[13px] text-muted-2">{t('app.mediaLibUnused')}</span>
                  )}
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy || usedBy.length > 0}
                  title={usedBy.length > 0 ? t('app.mediaLibDeleteBlocked') : undefined}
                  onClick={() => setDeleting(f)}
                >
                  {t('app.builderDeleteBtn')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept={TAB_ACCEPT[tab]}
        hidden
        onChange={(e) => void pick(e)}
        aria-hidden="true"
        tabIndex={-1}
      />

      <PreviewSheet file={preview} kind={kind} onClose={() => setPreview(null)} />

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('app.mediaLibDeleteTitle')}
        description={t('app.mediaLibDeleteBody', { name: deleting?.name ?? '' })}
        confirmLabel={t('app.builderDeleteBtn')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

/** The file itself, at a size worth looking at, with the reference to copy underneath. */
function PreviewSheet({
  file,
  kind,
  onClose,
}: {
  file: MediaObject | null;
  kind: MediaKind;
  onClose: () => void;
}) {
  const { t } = useT();
  const url = useMediaUrl(file?.ref);
  return (
    <Sheet open={file !== null} onClose={onClose} title={file?.name}>
      <div className="flex flex-col gap-3">
        {url ? (
          <Preview kind={kind} url={url} className="w-full" />
        ) : (
          <p className="text-[15px] text-muted">{t('app.mediaLibNoPreview')}</p>
        )}
        {file ? (
          <div className="border border-border bg-surface-2 px-4 py-3 font-mono text-[13px] break-all select-all">
            {file.ref}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
