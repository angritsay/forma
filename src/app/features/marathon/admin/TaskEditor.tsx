/**
 * Writing one task, in a sheet.
 *
 * The form is ordered the way the coach thinks in the morning: what to do, what to send back, what
 * it is worth. Everything after that — who it is for, who sees the proof, the deadline — has a
 * sensible answer already and is only there for the day he wants a different one.
 *
 * Two fields appear conditionally rather than sitting greyed out: a unit only exists for a number,
 * a ceiling only for the capped rule. The table enforces both, so a form that let him type a
 * ceiling on a per-person task would be offering an error.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Textarea';
import type {
  MarathonAudience,
  MarathonRule,
  MarathonTaskPatch,
  MarathonTaskRow,
  ProofKind,
  ProofVisibility,
} from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface TaskDraft {
  title: string;
  body: string;
  proofKind: ProofKind;
  unit: string;
  targetNum: string;
  rule: MarathonRule;
  points: string;
  cap: string;
  audience: MarathonAudience;
  proofVisibility: ProofVisibility;
  dueTime: string;
  lateCounts: boolean;
}

export function emptyDraft(): TaskDraft {
  return {
    title: '',
    body: '',
    proofKind: 'done',
    unit: '',
    targetNum: '',
    // The pair rule is the marathon's default because it is the one the format is built on.
    rule: 'all_members',
    points: '10',
    cap: '',
    audience: 'all',
    proofVisibility: 'team',
    dueTime: '',
    lateCounts: false,
  };
}

export function draftFrom(task: MarathonTaskRow): TaskDraft {
  return {
    title: task.title,
    body: task.body ?? '',
    proofKind: task.proofKind,
    unit: task.unit ?? '',
    targetNum: task.targetNum === null ? '' : String(task.targetNum),
    rule: task.rule,
    points: String(task.points),
    cap: task.cap === null ? '' : String(task.cap),
    audience: task.audience,
    proofVisibility: task.proofVisibility,
    // Postgres hands back HH:MM:SS; a time input wants HH:MM.
    dueTime: task.dueTime ? task.dueTime.slice(0, 5) : '',
    lateCounts: task.lateCounts,
  };
}

/** The draft as the patch the API takes; the empty string means "no value", never 0. */
export function draftToPatch(draft: TaskDraft): MarathonTaskPatch {
  const number = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    title: draft.title.trim(),
    body: draft.body.trim() || null,
    proofKind: draft.proofKind,
    unit: draft.proofKind === 'number' ? draft.unit.trim() || null : null,
    targetNum: draft.proofKind === 'number' ? number(draft.targetNum) : null,
    rule: draft.rule,
    points: draft.rule === 'none' ? 0 : Number(draft.points || 0),
    cap: draft.rule === 'capped' ? Number(draft.cap || 0) : null,
    audience: draft.audience,
    proofVisibility: draft.proofVisibility,
    dueTime: draft.dueTime ? `${draft.dueTime}:00` : null,
    lateCounts: draft.lateCounts,
  };
}

/** What the form will not let through, in the table's own terms. */
export function draftError(draft: TaskDraft): 'title' | 'unit' | 'cap' | null {
  if (!draft.title.trim()) return 'title';
  if (draft.proofKind === 'number' && !draft.unit.trim()) return 'unit';
  if (draft.rule === 'capped' && draft.cap.trim() === '') return 'cap';
  return null;
}

export interface TaskEditorProps {
  open: boolean;
  /** The task being edited, or null for a new one. */
  task: MarathonTaskRow | null;
  dayIndex: number;
  /** Last day of the marathon, so "repeat until" cannot run off the end. */
  lastDay: number;
  onClose: () => void;
  onSave: (patch: MarathonTaskPatch, repeatUntil: number | null) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TaskEditor({
  open,
  task,
  dayIndex,
  lastDay,
  onClose,
  onSave,
  onDelete,
}: TaskEditorProps) {
  const { t } = useT();
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const [repeatUntil, setRepeatUntil] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(task ? draftFrom(task) : emptyDraft());
    setRepeatUntil('');
  }, [open, task]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const error = draftError(draft);

  const save = async () => {
    if (error) return;
    setBusy(true);
    try {
      const until = repeatUntil ? Math.min(Number(repeatUntil), lastDay) : null;
      await onSave(draftToPatch(draft), until && until > dayIndex ? until : null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={task ? t('app.mAdminTaskEdit') : t('app.mAdminTaskNew')}
      footer={
        <div className="flex gap-3">
          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={Boolean(error)}
            onClick={() => void save()}
          >
            {t('app.mAdminSave')}
          </Button>
          {task && onDelete ? (
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                void onDelete().then(onClose);
              }}
            >
              {t('app.mAdminDelete')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Input
          label={t('app.mAdminTaskTitle')}
          value={draft.title}
          error={error === 'title' && draft.title !== '' ? ' ' : undefined}
          onChange={(e) => set('title', e.target.value)}
        />
        <Textarea
          label={t('app.mAdminTaskBody')}
          rows={3}
          value={draft.body}
          onChange={(e) => set('body', e.target.value)}
        />

        <Select<ProofKind>
          label={t('app.mAdminTaskProof')}
          value={draft.proofKind}
          onChange={(v) => set('proofKind', v)}
          options={[
            { value: 'done', label: t('app.mAdminProofDone') },
            { value: 'text', label: t('app.mAdminProofText') },
            { value: 'number', label: t('app.mAdminProofNumber') },
            { value: 'media', label: t('app.mAdminProofMedia') },
          ]}
        />
        {draft.proofKind === 'number' ? (
          <div className="flex gap-3">
            <Input
              label={t('app.mAdminUnit')}
              value={draft.unit}
              error={error === 'unit' ? ' ' : undefined}
              onChange={(e) => set('unit', e.target.value)}
              wrapperClassName="flex-1"
            />
            <Input
              label={t('app.mAdminTarget')}
              inputMode="numeric"
              value={draft.targetNum}
              onChange={(e) => set('targetNum', e.target.value)}
              wrapperClassName="flex-1"
            />
          </div>
        ) : null}

        <Select<MarathonRule>
          label={t('app.mAdminRule')}
          value={draft.rule}
          onChange={(v) => set('rule', v)}
          options={[
            { value: 'all_members', label: t('app.mAdminRuleAll') },
            { value: 'per_member', label: t('app.mAdminRulePer') },
            { value: 'capped', label: t('app.mAdminRuleCapped') },
            { value: 'none', label: t('app.mAdminRuleNone') },
          ]}
        />
        {draft.rule !== 'none' ? (
          <div className="flex gap-3">
            <Input
              label={t('app.mAdminPoints')}
              inputMode="numeric"
              value={draft.points}
              onChange={(e) => set('points', e.target.value)}
              wrapperClassName="flex-1"
            />
            {draft.rule === 'capped' ? (
              <Input
                label={t('app.mAdminCap')}
                inputMode="numeric"
                value={draft.cap}
                error={error === 'cap' ? ' ' : undefined}
                onChange={(e) => set('cap', e.target.value)}
                wrapperClassName="flex-1"
              />
            ) : null}
          </div>
        ) : null}

        <Select<MarathonAudience>
          label={t('app.mAdminAudience')}
          value={draft.audience}
          onChange={(v) => set('audience', v)}
          options={[
            { value: 'all', label: t('app.mAdminAudienceAll') },
            { value: 'teams', label: t('app.mAdminAudienceTeams') },
            { value: 'solo', label: t('app.mAdminAudienceSolo') },
          ]}
        />
        <Select<ProofVisibility>
          label={t('app.mAdminVisibility')}
          value={draft.proofVisibility}
          onChange={(v) => set('proofVisibility', v)}
          options={[
            { value: 'team', label: t('app.mAdminVisibilityTeam') },
            { value: 'coach', label: t('app.mAdminVisibilityCoach') },
          ]}
        />

        <Input
          label={t('app.mAdminDueTime')}
          type="time"
          hint={t('app.mAdminDueDefault')}
          value={draft.dueTime}
          onChange={(e) => set('dueTime', e.target.value)}
        />
        <label className="flex items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={draft.lateCounts}
            onChange={(e) => set('lateCounts', e.target.checked)}
            className="size-5 accent-primary"
          />
          {t('app.mAdminLateCounts')}
        </label>

        {/*
         * Repeating is a bulk create, not a rule with an end date: every day gets its own row, so
         * the morning he wants to change one of them, he can.
         */}
        {!task && dayIndex < lastDay ? (
          <Input
            label={t('app.mAdminRepeatUntil')}
            inputMode="numeric"
            placeholder={String(lastDay)}
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
          />
        ) : null}
      </div>
    </Sheet>
  );
}
