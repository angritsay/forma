/**
 * «Цвет», the studio's third step: the clips of the video on the left, each with a checkbox, and
 * the colour editor of the active one on the right (`GradeEditor`). On a phone the list comes
 * first and the editor under it.
 *
 * The bulk move the owner asked for: grade one clip, «Скопировать настройки», tick the others,
 * «Вставить в выбранные (N)». The paste carries colour only — the grade and the auto-enhance
 * switch (`clipboard.ts`); framing is per clip, on «Превью».
 */
import { clsx } from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { pasteMediaSettings, type MediaClip } from '@/lib/api/mediaStudio';
import { useT } from '@/app/hooks/useT';
import { pastePayload } from './clipboard';
import { useStudioClipboard } from './clipboardStore';
import { ClipStatusChip } from './grade/ClipStatus';
import { GradeEditor } from './grade/GradeEditor';
import { pasteIds, toggleAll, toggleId } from './grade/selection';
import { studioErrorTitle } from './grade/studioErrors';
import { formatSpan } from './grade/time';

export interface ColorStepProps {
  clips: readonly MediaClip[];
  /** The clip in the editor (the address's `?clip=`), or null for the first. */
  activeId: string | null;
  onActive: (clipId: string) => void;
  onSaved: (clip: MediaClip) => void;
  /** Re-read the clips after a paste. */
  onReload: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onNext: () => void;
}

export function ColorStep({
  clips,
  activeId,
  onActive,
  onSaved,
  onReload,
  onDirtyChange,
  onNext,
}: ColorStepProps) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const clipboard = useStudioClipboard((s) => s.clipboard);
  const clearClipboard = useStudioClipboard((s) => s.clear);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pasting, setPasting] = useState(false);
  const [dirty, setDirty] = useState(false);
  // A tap on another clip while this one has unsaved colour: asked first.
  const [leaveFor, setLeaveFor] = useState<string | null>(null);

  const active = clips.find((c) => c.id === activeId) ?? clips[0] ?? null;
  const index = active ? clips.indexOf(active) : -1;
  const prevId = index > 0 ? clips[index - 1]!.id : null;
  const nextId = index >= 0 && index < clips.length - 1 ? clips[index + 1]!.id : null;

  const targets = useMemo(() => pasteIds(clips, selected), [clips, selected]);
  const allSelected = clips.length > 0 && clips.every((c) => selected.has(c.id));

  const markDirty = useCallback(
    (d: boolean) => {
      setDirty(d);
      onDirtyChange(d);
    },
    [onDirtyChange],
  );

  const open = (id: string) => {
    if (id === active?.id) return;
    if (dirty) setLeaveFor(id);
    else onActive(id);
  };

  const paste = async () => {
    if (!clipboard || targets.length === 0) return;
    setPasting(true);
    try {
      const n = await pasteMediaSettings(targets, pastePayload(clipboard));
      toast.show(
        n > 0
          ? { kind: 'success', title: t('app.studioPasted', { n }) }
          : { kind: 'info', title: t('app.studioPastedNone') },
      );
      onReload();
    } catch (e) {
      toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioPasteError') });
    } finally {
      setPasting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)] lg:items-start lg:gap-8">
      <section className="flex flex-col gap-3 lg:sticky lg:top-20" aria-labelledby="color-clips">
        <div className="flex items-center justify-between gap-2">
          <h2 id="color-clips" className="eyebrow text-muted-2">
            {t('app.studioClipsTitle')} · {clips.length}
          </h2>
          <Button size="sm" variant="ghost" onClick={() => setSelected((s) => toggleAll(s, clips))}>
            {allSelected ? t('app.studioSelectNone') : t('app.studioSelectAll')}
          </Button>
        </div>

        <ul className="flex flex-col">
          {clips.map((c, i) => (
            <ColorRow
              key={c.id}
              clip={c}
              index={i}
              active={c.id === active?.id}
              selected={selected.has(c.id)}
              copiedFrom={clipboard?.fromClipId === c.id}
              onOpen={() => open(c.id)}
              onToggle={() => setSelected((s) => toggleId(s, c.id))}
            />
          ))}
        </ul>

        <div className="flex flex-col gap-2 rounded-control border border-border p-3 text-[13px]">
          <span className="text-muted">
            {clipboard
              ? clipboard.fromLabel
                ? t('app.studioClipboardFrom', { name: clipboard.fromLabel })
                : t('app.studioClipboardHas')
              : t('app.studioColorClipboardEmpty')}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={pasting}
              disabled={!clipboard || targets.length === 0}
              onClick={() => void paste()}
            >
              {t('app.studioPasteToSelected', { n: targets.length })}
            </Button>
            {clipboard ? (
              <Button size="sm" variant="ghost" onClick={clearClipboard}>
                {t('app.studioClipboardClear')}
              </Button>
            ) : null}
          </div>
          {selected.size > targets.length ? (
            <span className="text-muted">
              {t('app.studioPasteSkipped', { n: selected.size - targets.length })}
            </span>
          ) : null}
        </div>

        <Button variant="secondary" fullWidth onClick={onNext}>
          {t('app.studioColorNext')}
        </Button>
      </section>

      {active ? (
        <GradeEditor
          key={active.id}
          clip={active}
          prevId={prevId}
          nextId={nextId}
          onGo={(id) => {
            markDirty(false);
            onActive(id);
          }}
          onSaved={onSaved}
          onDirtyChange={markDirty}
        />
      ) : null}

      <Modal
        open={leaveFor !== null}
        onClose={() => setLeaveFor(null)}
        title={t('app.builderLeaveTitle')}
        description={t('app.studioLeaveBody')}
        confirmLabel={t('app.builderLeaveConfirm')}
        cancelLabel={t('app.builderLeaveStay')}
        danger
        onConfirm={() => {
          const id = leaveFor;
          setLeaveFor(null);
          markDirty(false);
          if (id) onActive(id);
        }}
      />
    </div>
  );
}

function ColorRow({
  clip,
  index,
  active,
  selected,
  copiedFrom,
  onOpen,
  onToggle,
}: {
  clip: MediaClip;
  index: number;
  active: boolean;
  selected: boolean;
  copiedFrom: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { t } = useT();
  const name = clip.exerciseName ?? clip.exerciseId ?? t('app.studioUnlabelled');
  return (
    <li
      className={clsx('flex items-center gap-1 border-t border-border', active && 'bg-surface-2')}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={t('app.studioSelectClip', { name })}
        onClick={onToggle}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span
          className={clsx(
            'flex h-5 w-5 items-center justify-center rounded-[5px] border-2 text-[12px] leading-none',
            selected ? 'border-accent bg-accent text-ink' : 'border-border-strong text-transparent',
          )}
        >
          ✓
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? 'true' : undefined}
        className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5 pr-1 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="numeral tabular text-[12px] text-muted-2">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="truncate text-[14px] font-medium">{name}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <span className="numeral tabular">{formatSpan(clip)}</span>
          {clip.grade ? <span>{t('app.studioMarkColour')}</span> : null}
          {!clip.autoEnhance ? <span>{t('app.studioMarkAutoOff')}</span> : null}
          {copiedFrom ? <span className="text-accent">{t('app.studioMarkCopied')}</span> : null}
        </span>
      </button>
      <span className="shrink-0 pr-2">
        <ClipStatusChip status={clip.status} />
      </span>
    </li>
  );
}
