/**
 * «Скопировать неделю» and «Скопировать в другой клуб» (0047).
 *
 * The week is the one the selected day is in — the coach opens a day of the week she wants to copy
 * and presses one button. Before anything is written the sheet asks the server what would happen
 * (`dryRun`) and says it in counts: how many tasks, onto how many days, which days are skipped
 * because they already have tasks. The button then does exactly that, because it is the same call.
 *
 * Replacing tasks is off by default and asks again when on: it deletes the tasks already on those
 * days. Days where somebody has already sent proof are never replaced — the server refuses, and
 * the preview says how many.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Switch } from '@/components/ui/Switch';
import { formatDate, formatNumber } from '@/i18n/index';
import { copyTasks } from '@/lib/api/marathonAdmin';
import type { CopyTasksResult, MarathonRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import {
  clubErrorKey,
  copyTargetWeeks,
  crossClubRange,
  weekCopyRange,
  weekOfDay,
  weekRange,
} from './clubTools';
import { dateOfDay } from './dates';

type Mode = 'week' | 'club';

export interface CopyTasksSheetProps {
  open: boolean;
  onClose: () => void;
  marathon: MarathonRow;
  /** The day being looked at; its week is what gets copied. */
  day: number;
  /** The other live club (solo ↔ duo), when this round is a live club and the other exists. */
  otherClub: MarathonRow | null;
  /** After a real copy. The screen reloads the plan and says what happened. */
  onCopied: (result: CopyTasksResult, toOther: boolean) => void;
}

export function CopyTasksSheet({
  open,
  onClose,
  marathon,
  day,
  otherClub,
  onCopied,
}: CopyTasksSheetProps) {
  const { t, locale } = useT();
  const fromWeek = weekOfDay(Math.max(day, 1));
  const weeks = useMemo(() => copyTargetWeeks(fromWeek, marathon.days), [fromWeek, marathon.days]);

  const [mode, setMode] = useState<Mode>('week');
  const [toWeek, setToWeek] = useState(String(fromWeek + 1));
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<CopyTasksResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Every open starts from «next week, don't replace» — the safe, common case.
  useEffect(() => {
    if (!open) return;
    setMode('week');
    setToWeek(String(fromWeek + 1));
    setOverwrite(false);
  }, [open, fromWeek]);

  const range = useMemo(() => {
    if (mode === 'club') {
      const src = weekRange(fromWeek, marathon.days);
      if (!otherClub || !src) return null;
      const r = crossClubRange(marathon, otherClub, src.fromDay, src.dayCount);
      return r ? { ...r, toMarathon: otherClub } : null;
    }
    const r = weekCopyRange(fromWeek, Number(toWeek), marathon.days);
    return r ? { ...r, toMarathon: marathon } : null;
  }, [mode, fromWeek, toWeek, marathon, otherClub]);

  // The preview: the same call with `dryRun`, re-asked whenever the question changes.
  useEffect(() => {
    if (!open || !range) {
      setPreview(null);
      return;
    }
    let alive = true;
    setPreview(null);
    setPreviewError(null);
    copyTasks({
      fromMarathonId: marathon.id,
      fromDay: range.fromDay,
      dayCount: range.dayCount,
      toMarathonId: range.toMarathon.id,
      toDay: range.toDay,
      overwrite,
      dryRun: true,
    })
      .then((r) => alive && setPreview(r))
      .catch((e: unknown) => alive && setPreviewError(t(clubErrorKey(e))));
    return () => {
      alive = false;
    };
  }, [open, range, overwrite, marathon.id, t]);

  const weekLabel = (w: number, m: MarathonRow) => {
    const r = weekRange(w, m.days);
    if (!r) return t('app.clubCopyWeekN', { n: formatNumber(locale, w) });
    return t('app.clubCopyWeekDates', {
      n: formatNumber(locale, w),
      from: formatDate(locale, dateOfDay(m.startsOn, r.fromDay)),
      to: formatDate(locale, dateOfDay(m.startsOn, r.fromDay + r.dayCount - 1)),
    });
  };

  const run = async () => {
    if (!range) return;
    setBusy(true);
    try {
      const result = await copyTasks({
        fromMarathonId: marathon.id,
        fromDay: range.fromDay,
        dayCount: range.dayCount,
        toMarathonId: range.toMarathon.id,
        toDay: range.toDay,
        overwrite,
      });
      setConfirm(false);
      onCopied(result, range.toMarathon.id !== marathon.id);
      onClose();
    } catch (e) {
      setConfirm(false);
      setPreviewError(t(clubErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const nothing = preview !== null && preview.tasksCopied === 0;

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={t('app.clubCopyTitle')}
        footer={
          <Button
            size="lg"
            variant="action"
            fullWidth
            loading={busy}
            disabled={!range || !preview || nothing}
            onClick={() =>
              overwrite && (preview?.tasksReplaced ?? 0) > 0 ? setConfirm(true) : void run()
            }
          >
            {preview && !nothing
              ? t('app.clubCopyRun', { n: formatNumber(locale, preview.tasksCopied) })
              : t('app.clubCopyRunIdle')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-[15px]">
            {t('app.clubCopyFrom', { week: weekLabel(fromWeek, marathon) })}
          </p>

          {otherClub ? (
            <SegmentedControl<Mode>
              label={t('app.clubCopyTitle')}
              fullWidth
              value={mode}
              onChange={setMode}
              options={[
                { value: 'week', label: t('app.clubCopyModeWeek') },
                {
                  value: 'club',
                  label: t(
                    otherClub.teamSize > 1 ? 'app.clubCopyModeToDuo' : 'app.clubCopyModeToSolo',
                  ),
                },
              ]}
            />
          ) : null}

          {mode === 'week' ? (
            weeks.length > 0 ? (
              <Select
                label={t('app.clubCopyTo')}
                value={toWeek}
                onChange={setToWeek}
                options={weeks.map((w) => ({ value: String(w), label: weekLabel(w, marathon) }))}
              />
            ) : (
              <p className="text-[15px] text-muted-2">{t('app.clubCopyNoWeeks')}</p>
            )
          ) : otherClub ? (
            <p className="text-[15px] text-muted">
              {range
                ? t('app.clubCopyToClub', {
                    title: otherClub.title,
                    from: formatDate(locale, dateOfDay(otherClub.startsOn, range.toDay)),
                    to: formatDate(
                      locale,
                      dateOfDay(otherClub.startsOn, range.toDay + range.dayCount - 1),
                    ),
                  })
                : t('app.clubCopyNoDates')}
            </p>
          ) : null}

          <label className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px]">{t('app.clubCopyOverwrite')}</span>
              <span className="text-[13px] text-muted-2">{t('app.clubCopyOverwriteHint')}</span>
            </span>
            <Switch
              checked={overwrite}
              onChange={setOverwrite}
              label={t('app.clubCopyOverwrite')}
            />
          </label>

          {/* The preview — counts from the server, the same call the button makes. */}
          <div
            className="flex flex-col gap-1 border-t border-border pt-4 text-[15px]"
            aria-live="polite"
          >
            {previewError ? (
              <p className="text-danger">{previewError}</p>
            ) : !range ? null : preview === null ? (
              <p className="text-muted-2">{t('app.clubCopyCounting')}</p>
            ) : nothing && preview.daysSkipped + preview.daysLocked === 0 ? (
              <p className="text-muted-2">{t('app.clubCopyEmpty')}</p>
            ) : (
              <>
                {preview.tasksCopied > 0 ? (
                  <p>
                    {t('app.clubCopyWill', {
                      tasks: formatNumber(locale, preview.tasksCopied),
                      days: formatNumber(locale, preview.daysCopied),
                    })}
                  </p>
                ) : null}
                {preview.tasksReplaced > 0 ? (
                  <p className="text-warning">
                    {t('app.clubCopyWillReplace', {
                      n: formatNumber(locale, preview.tasksReplaced),
                    })}
                  </p>
                ) : null}
                {preview.daysSkipped > 0 ? (
                  <p className="text-muted">
                    {t('app.clubCopySkipped', { n: formatNumber(locale, preview.daysSkipped) })}
                  </p>
                ) : null}
                {preview.daysLocked > 0 ? (
                  <p className="text-muted">
                    {t('app.clubCopyLocked', { n: formatNumber(locale, preview.daysLocked) })}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </Sheet>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('app.clubCopyConfirmTitle')}
        description={t('app.clubCopyConfirmBody', {
          n: formatNumber(locale, preview?.tasksReplaced ?? 0),
        })}
        confirmLabel={t('app.clubCopyConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void run()}
      />
    </>
  );
}
