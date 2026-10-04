/**
 * Every clip of a shoot (or of all shoots) as a grid: status, exercise, span, whether it carries a
 * grade or a crop — and a checkbox on each, for doing one thing to many.
 *
 * With a selection the footer offers what can be done to it: paste the copied settings, send to
 * the worker, retry the failed ones. Tapping a tile (not its checkbox) opens the editor.
 *
 * The worker runs every ten minutes, so while something is queued the list re-reads itself once a
 * minute while the screen is visible — a clip goes from «в очереди» to «готово» without her having
 * to pull anything.
 */
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { isNetworkError } from '@/lib/api/errors';
import {
  listMediaClips,
  listMediaSources,
  pasteMediaSettings,
  type MediaClip,
  type MediaSource,
} from '@/lib/api/mediaStudio';
import { exerciseStillUrl } from '@/lib/api/storage';
import { formatDate } from '@/i18n/index';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { useT } from '@/app/hooks/useT';
import { pastePayload, type PasteChoice } from './clipboard';
import { useStudioClipboard } from './clipboardStore';
import { ClipStatusChip } from './ClipStatus';
import { PasteSheet } from './PasteSheet';
import {
  CLIP_FILTERS,
  filterClips,
  filterCounts,
  pasteIds,
  pruneSelection,
  retryIds,
  toggleAll,
  toggleId,
  type ClipFilter,
} from './selection';
import { studioErrorTitle, workerErrorText } from './studioErrors';
import { clipDuration, formatClock, formatSpan } from './time';
import { useQueueActions } from './useQueueActions';

const ALL = 'all';
const POLL_MS = 60_000;

type Status = 'loading' | 'ready' | 'error' | 'offline';

export interface ClipGridProps {
  onOpen: (clipId: string) => void;
  /** Reports whether a reload is running, for the header's refresh control. */
  reloadSignal: number;
}

export function ClipGrid({ onOpen, reloadSignal }: ClipGridProps) {
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const clipboard = useStudioClipboard((s) => s.clipboard);
  const clearClipboard = useStudioClipboard((s) => s.clear);

  const [sources, setSources] = useState<MediaSource[]>([]);
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [sourceId, setSourceId] = useState<string>(ALL);
  const [filter, setFilter] = useState<ClipFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pasting, setPasting] = useState(false);
  const [pasteBusy, setPasteBusy] = useState(false);

  const load = useCallback((quiet = false) => {
    if (!quiet) setStatus('loading');
    Promise.all([listMediaSources(), listMediaClips(null)])
      .then(([s, c]) => {
        setSources(s);
        setClips(c);
        setSelected((sel) => pruneSelection(sel, c));
        setStatus('ready');
      })
      .catch((e: unknown) => {
        // A quiet re-read that fails keeps what is on screen.
        if (!quiet) setStatus(isNetworkError(e) ? 'offline' : 'error');
      });
  }, []);

  useEffect(() => {
    load(reloadSignal > 0);
  }, [load, reloadSignal]);

  const reload = useCallback(() => load(true), [load]);
  const actions = useQueueActions(clips, reload);

  const anyWaiting = clips.some((c) => c.status === 'queued' || c.status === 'rendering');
  useEffect(() => {
    if (!anyWaiting) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [anyWaiting, load]);

  const ofSource = useMemo(
    () => (sourceId === ALL ? clips : clips.filter((c) => c.sourceId === sourceId)),
    [clips, sourceId],
  );
  const counts = useMemo(() => filterCounts(ofSource), [ofSource]);
  const shown = useMemo(() => filterClips(ofSource, filter), [ofSource, filter]);
  const sourceTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sources) {
      m.set(s.id, s.title || s.fileName || formatDate(locale, s.createdAt));
    }
    return m;
  }, [sources, locale]);

  const selectedIds = [...selected];
  const canRetry = retryIds(clips, selectedIds).length;
  const pasteTargets = pasteIds(clips, selectedIds);

  const doPaste = async (choice: PasteChoice) => {
    if (!clipboard) return;
    const payload = pastePayload(clipboard, choice);
    if (!payload) return;
    setPasteBusy(true);
    try {
      const n = await pasteMediaSettings(pasteTargets, payload);
      setPasting(false);
      toast.show(
        n > 0
          ? { kind: 'success', title: t('app.studioPasted', { n }) }
          : { kind: 'info', title: t('app.studioPastedNone') },
      );
      load(true);
    } catch (e) {
      toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioPasteError') });
    } finally {
      setPasteBusy(false);
    }
  };

  const filterLabels: Record<ClipFilter, string> = {
    all: t('app.studioFilterAll'),
    todo: t('app.studioFilterTodo'),
    queued: t('app.studioFilterQueued'),
    done: t('app.studioFilterDone'),
    failed: t('app.studioFilterFailed'),
  };

  if (status === 'loading') return <LoadingBlock />;
  if (status === 'error' || status === 'offline') {
    return (
      <div role="alert">
        <EmptyState
          title={status === 'offline' ? t('app.studioLoadOffline') : t('app.studioLoadError')}
          description={status === 'offline' ? t('app.studioLoadOfflineBody') : undefined}
          action={
            <Button variant="secondary" onClick={() => load()}>
              {t('common.retry')}
            </Button>
          }
        />
      </div>
    );
  }
  if (clips.length === 0) {
    return <EmptyState title={t('app.studioEmptyTitle')} description={t('app.studioEmptyBody')} />;
  }

  const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id));

  return (
    <div className="flex flex-col gap-4 py-4">
      {clipboard ? (
        <div className="flex flex-wrap items-center gap-2 rounded-control border border-border p-3 text-[13px]">
          <span className="min-w-0 flex-1 text-muted">
            {clipboard.fromLabel
              ? t('app.studioClipboardFrom', { name: clipboard.fromLabel })
              : t('app.studioClipboardHas')}
          </span>
          <Button size="sm" variant="ghost" onClick={clearClipboard}>
            {t('app.studioClipboardClear')}
          </Button>
        </div>
      ) : (
        <p className="text-[13px] text-muted">{t('app.studioGridHint')}</p>
      )}

      {sources.length > 1 ? (
        <Select
          label={t('app.studioSource')}
          value={sourceId}
          onChange={setSourceId}
          options={[
            { value: ALL, label: t('app.studioSourceAll') },
            ...sources.map((s) => ({ value: s.id, label: sourceTitle.get(s.id) ?? s.id })),
          ]}
        />
      ) : null}

      <Tabs<ClipFilter>
        variant="pills"
        label={t('app.studioFilter')}
        value={filter}
        onChange={setFilter}
        tabs={CLIP_FILTERS.map((f) => ({ id: f, label: filterLabels[f], count: counts[f] }))}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted">
          {selected.size > 0
            ? t('app.studioSelected', { n: selected.size })
            : t('app.studioTapToEdit')}
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={shown.length === 0}
          onClick={() => setSelected((s) => toggleAll(s, shown))}
        >
          {allShownSelected ? t('app.studioSelectNone') : t('app.studioSelectAll')}
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState title={t('app.studioFilterEmpty')} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((c) => (
            <ClipTile
              key={c.id}
              clip={c}
              selected={selected.has(c.id)}
              copiedFrom={clipboard?.fromClipId === c.id}
              sourceTitle={
                sourceId === ALL && sources.length > 1 ? sourceTitle.get(c.sourceId) : undefined
              }
              onToggle={() => setSelected((s) => toggleId(s, c.id))}
              onOpen={() => onOpen(c.id)}
            />
          ))}
        </ul>
      )}

      {selected.size > 0 ? (
        // Sticky at the end of the list, the way `Screen` holds its footer: opaque, above the nav.
        <div className="sticky bottom-[calc(var(--nav-inset,0px)+var(--safe-bottom))] z-20 -mx-6 border-t border-border bg-bg px-6 py-3 md:-mx-10 md:px-10">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!clipboard || pasteTargets.length === 0}
              onClick={() => setPasting(true)}
            >
              {t('app.studioPaste')}
            </Button>
            <Button size="sm" loading={actions.busy} onClick={() => actions.queue(selectedIds)}>
              {t('app.studioQueueN', { n: selected.size })}
            </Button>
            {canRetry > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                loading={actions.busy}
                onClick={() => actions.retry(selectedIds)}
              >
                {t('app.studioRetryN', { n: canRetry })}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              {t('app.studioSelectClear')}
            </Button>
          </div>
        </div>
      ) : null}

      <PasteSheet
        open={pasting}
        onClose={() => setPasting(false)}
        clipboard={clipboard}
        count={pasteTargets.length}
        skipped={selected.size - pasteTargets.length}
        busy={pasteBusy}
        onPaste={(choice) => void doPaste(choice)}
      />
      {actions.dialog}
    </div>
  );
}

interface ClipTileProps {
  clip: MediaClip;
  selected: boolean;
  copiedFrom: boolean;
  sourceTitle?: string;
  onToggle: () => void;
  onOpen: () => void;
}

function ClipTile({ clip, selected, copiedFrom, sourceTitle, onToggle, onOpen }: ClipTileProps) {
  const { t } = useT();
  const [stillFailed, setStillFailed] = useState(false);
  const base =
    clip.exerciseId && clip.status === 'done' ? exerciseStillUrl(clip.exerciseId) : undefined;
  // The still is replaced in place on every render: the render time keeps a stale copy out.
  const still = base
    ? `${base}?v=${encodeURIComponent(clip.renderedAt ?? clip.updatedAt)}`
    : undefined;
  const worker = clip.status === 'failed' ? workerErrorText(clip.error) : null;
  const name = clip.exerciseName ?? clip.exerciseId ?? t('app.studioUnlabelled');

  return (
    <li
      className={clsx(
        'relative flex flex-col overflow-hidden rounded-card border',
        selected ? 'border-accent' : 'border-border',
      )}
    >
      <button type="button" onClick={onOpen} className="flex flex-col text-left">
        <span className="relative block aspect-video w-full bg-surface-2">
          {still && !stillFailed ? (
            <img
              src={still}
              alt=""
              loading="lazy"
              onError={() => setStillFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : null}
          <span className="numeral tabular absolute right-1.5 bottom-1.5 rounded-control bg-ink/70 px-1.5 text-[12px] text-white">
            {formatClock(clipDuration(clip), false)}
          </span>
        </span>
        <span className="flex flex-col gap-1 p-2.5">
          <span
            className={clsx('truncate text-[14px]', clip.exerciseId ? 'text-text' : 'text-warning')}
          >
            {name}
          </span>
          <span className="numeral tabular truncate text-[12px] text-muted-2">
            {sourceTitle ? `${sourceTitle} · ` : ''}
            {formatSpan(clip)}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <ClipStatusChip status={clip.status} />
            {clip.grade ? (
              <span className="text-[12px] text-muted">{t('app.studioMarkColour')}</span>
            ) : null}
            {clip.crop ? (
              <span className="text-[12px] text-muted">{t('app.studioMarkCrop')}</span>
            ) : null}
            {copiedFrom ? (
              <span className="text-[12px] text-accent">{t('app.studioMarkCopied')}</span>
            ) : null}
          </span>
          {worker ? (
            <span className="line-clamp-2 text-[12px] text-danger">
              {t(worker.key)}
              {worker.detail ? ` ${worker.detail}` : ''}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={t('app.studioSelectClip', { name })}
        onClick={onToggle}
        className="absolute top-0 left-0 flex h-11 w-11 items-center justify-center"
      >
        <span
          className={clsx(
            'flex h-6 w-6 items-center justify-center rounded-[6px] border-2 text-[14px] leading-none',
            selected
              ? 'border-accent bg-accent text-ink'
              : 'border-white bg-ink/40 text-transparent',
          )}
        >
          ✓
        </span>
      </button>
    </li>
  );
}
