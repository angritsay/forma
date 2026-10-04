/**
 * «Студия», the landing: every filmed video that was cut here, and every clip with where it is on
 * its way — a draft waiting for a name or a colour, in the render queue, done, or failed with the
 * worker's reason. A new video starts in the cutter; each video opens at the step it is at
 * (`flow.ts` `currentStep`: names, colour or preview).
 *
 * The phone sees one column; from `lg` the sources sit beside the clips.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Tabs } from '@/components/ui/Tabs';
import { formatDate } from '@/i18n/index';
import { isNetworkError } from '@/lib/api/errors';
import {
  listMediaClips,
  listMediaSources,
  type MediaClip,
  type MediaSource,
} from '@/lib/api/mediaStudio';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { useT } from '@/app/hooks/useT';
import {
  clipsOfSource,
  countByFilter,
  matchesFilter,
  needsLabel,
  sourceDrafts,
  STATUS_LABEL,
  STATUS_TONE,
  type StudioFilter,
} from './clipStatus';
import { currentStep, STUDIO_CUT_PATH, studioStepPath, type StudioStep } from './flow';
import { formatTimecode, segmentSeconds } from './timeline';

const STEP_ACTION = {
  cut: 'app.studioOpenCut',
  name: 'app.studioOpenName',
  color: 'app.studioOpenColor',
  preview: 'app.studioOpenPreview',
} as const satisfies Record<StudioStep, string>;

type Status = 'loading' | 'ready' | 'error' | 'offline';

const FILTERS: readonly StudioFilter[] = ['all', 'draft', 'queued', 'done', 'failed'];
const FILTER_LABEL = {
  all: 'app.studioFilterAll',
  draft: 'app.studioFilterDraft',
  queued: 'app.studioFilterQueued',
  done: 'app.studioFilterDone',
  failed: 'app.studioFilterFailed',
} as const;

export function StudioOverview() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [filter, setFilter] = useState<StudioFilter>('all');
  const [sourceId, setSourceId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStatus('loading');
    Promise.all([listMediaSources(), listMediaClips(null)])
      .then(([s, c]) => {
        setSources(s);
        setClips(c);
        setStatus('ready');
      })
      .catch((e: unknown) => setStatus(isNetworkError(e) ? 'offline' : 'error'));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ofSource = useMemo(
    () => (sourceId ? clips.filter((c) => c.sourceId === sourceId) : clips),
    [clips, sourceId],
  );
  const counts = useMemo(() => countByFilter(ofSource), [ofSource]);
  const shown = useMemo(
    () =>
      ofSource
        .filter((c) => matchesFilter(c, filter))
        .sort((a, b) =>
          a.sourceId === b.sourceId ? a.startS - b.startS : b.createdAt.localeCompare(a.createdAt),
        ),
    [ofSource, filter],
  );
  const sourceTitle = useMemo(
    () => new Map(sources.map((s) => [s.id, s.title || t('app.studioSourceUntitled')])),
    [sources, t],
  );

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button
        icon={<Glyph size={16}>+</Glyph>}
        onClick={() => navigate(STUDIO_CUT_PATH)}
        className="flex-1 sm:flex-none"
      >
        {t('app.studioCutAction')}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 py-4">
      <p className="text-[15px] text-muted">{t('app.studioLead')}</p>
      {actions}

      {status === 'loading' ? (
        <LoadingBlock />
      ) : status !== 'ready' ? (
        <EmptyState
          title={t(status === 'offline' ? 'common.errorOffline' : 'app.studioLoadError')}
          action={
            <Button variant="secondary" onClick={refresh}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : sources.length === 0 ? (
        <EmptyState title={t('app.studioEmptyTitle')} description={t('app.studioEmptyBody')} />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex flex-col lg:w-80 lg:shrink-0" aria-labelledby="studio-sources">
            <h2 id="studio-sources" className="eyebrow pb-2 text-muted-2">
              {t('app.studioSourcesTitle')}
            </h2>
            <ul className="flex flex-col">
              {sources.map((s) => {
                const active = s.id === sourceId;
                const drafts = sourceDrafts(s);
                const step = currentStep(clipsOfSource(clips, s.id));
                return (
                  <li key={s.id} className="flex flex-col gap-1 border-t border-border pb-3">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSourceId(active ? null : s.id)}
                      className={
                        'flex w-full flex-col gap-1 py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 ' +
                        (active ? 'bg-surface-2' : '')
                      }
                    >
                      <span className="truncate px-1 text-[15px] font-medium">
                        {s.title || t('app.studioSourceUntitled')}
                      </span>
                      <span className="tabular px-1 text-[13px] text-muted-2">
                        {formatDate(locale, s.createdAt)}
                        {s.durationS ? ` · ${formatTimecode(s.durationS)}` : ''}
                        {' · '}
                        {t('app.studioSourceCounts', { clips: s.clips, done: s.done })}
                      </span>
                      {s.queued > 0 || s.failed > 0 || drafts > 0 ? (
                        <span className="flex flex-wrap gap-1.5 px-1 pt-1">
                          {drafts > 0 ? (
                            <Chip size="sm">
                              {t('app.studioFilterDraft')}: {drafts}
                            </Chip>
                          ) : null}
                          {s.queued > 0 ? (
                            <Chip size="sm" tone="accent">
                              {t('app.studioSourceQueued', { n: s.queued })}
                            </Chip>
                          ) : null}
                          {s.failed > 0 ? (
                            <Chip size="sm" tone="danger">
                              {t('app.studioSourceFailed', { n: s.failed })}
                            </Chip>
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                    <span className="px-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(studioStepPath(s.id, step))}
                      >
                        {t(STEP_ACTION[step])}
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex min-w-0 flex-1 flex-col gap-3" aria-labelledby="studio-clips">
            <h2 id="studio-clips" className="eyebrow text-muted-2">
              {sourceId ? sourceTitle.get(sourceId) : t('app.studioClipsTitle')}
            </h2>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Tabs<StudioFilter>
                variant="pills"
                label={t('app.studioClipsTitle')}
                value={filter}
                onChange={setFilter}
                tabs={FILTERS.map((f) => ({
                  id: f,
                  label: t(FILTER_LABEL[f]),
                  count: counts[f],
                }))}
              />
            </div>
            {shown.length === 0 ? (
              <p className="py-6 text-[15px] text-muted">{t('app.studioNoClipsFilter')}</p>
            ) : (
              <ul className="flex flex-col">
                {shown.map((c) => (
                  <ClipRow
                    key={c.id}
                    clip={c}
                    source={sourceId ? null : (sourceTitle.get(c.sourceId) ?? null)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ClipRow({ clip, source }: { clip: MediaClip; source: string | null }) {
  const { t } = useT();
  return (
    <li className="flex items-start gap-3 border-t border-border py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-medium">
          {clip.exerciseName ?? clip.exerciseId ?? t('app.studioNoLabel')}
        </span>
        <span className="tabular truncate text-[13px] text-muted-2">
          {source ? `${source} · ` : ''}
          {t('app.studioClipSpan', {
            start: formatTimecode(clip.startS),
            end: formatTimecode(clip.endS),
            len: segmentSeconds(clip),
          })}
        </span>
        {needsLabel(clip) ? (
          <span className="text-[13px] text-muted">{t('app.studioNeedsLabel')}</span>
        ) : null}
        {clip.status === 'failed' ? (
          <span className="text-[13px] text-danger">
            {t('app.studioWorkerFailed', { error: clip.error ?? '—' })}{' '}
            <span className="text-muted">{t('app.studioWorkerFailedHint')}</span>
          </span>
        ) : null}
      </div>
      <Chip size="sm" tone={STATUS_TONE[clip.status]} className="shrink-0">
        {t(STATUS_LABEL[clip.status])}
      </Chip>
    </li>
  );
}
