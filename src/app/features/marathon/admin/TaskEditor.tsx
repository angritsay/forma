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
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { Textarea } from '@/components/ui/Textarea';
import type {
  MarathonMemberRow,
  MarathonRule,
  MarathonTaskPatch,
  MarathonTaskRow,
  MarathonTaskTarget,
  MarathonTeamRow,
  ProofKind,
  ProofVisibility,
} from '@/lib/api/types';
import { PUBLIC_BUCKET } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';
import { LangTabs, useEditingLocale } from '@/app/features/admin/LangTabs';
import { MediaField } from '@/app/features/admin/media/MediaField';
import { dateOfDay, repeatUntilDay } from './dates';

/**
 * Ceiling on the task picture.
 *
 * It is one photograph off a phone, shown in a 16:9 band on a card — not a video and not a print
 * asset. `MediaField`'s own default is 200MB, which is sized for the private `videos` bucket and
 * would let a 40MB raw frame into a public bucket every member downloads on the tab's first paint.
 */
const MAX_TASK_IMAGE_BYTES = 8 * 1024 * 1024;

export interface TaskDraft {
  title: string;
  /** Английская половина. Пустая — не переведено; приложение покажет русскую. */
  titleEn: string;
  body: string;
  bodyEn: string;
  /** `storage:images/…` for the picture the club's card opens with, or '' for none. */
  mediaUrl: string;
  proofKind: ProofKind;
  unit: string;
  targetNum: string;
  rule: MarathonRule;
  points: string;
  cap: string;
  proofVisibility: ProofVisibility;
  dueTime: string;
  lateCounts: boolean;
}

export function emptyDraft(solo = false): TaskDraft {
  return {
    title: '',
    titleEn: '',
    body: '',
    bodyEn: '',
    mediaUrl: '',
    proofKind: 'done',
    unit: '',
    targetNum: '',
    /*
     * The pair rule is the default in a pair marathon because it is the one that format is built
     * on. With everyone playing for themselves there is nobody to wait for, so the honest default
     * is "you did it, you scored".
     */
    rule: solo ? 'per_member' : 'all_members',
    points: '10',
    cap: '',
    proofVisibility: 'team',
    dueTime: '',
    lateCounts: false,
  };
}

export function draftFrom(task: MarathonTaskRow): TaskDraft {
  return {
    title: task.title,
    titleEn: task.titleEn ?? '',
    body: task.body ?? '',
    bodyEn: task.bodyEn ?? '',
    mediaUrl: task.mediaUrl ?? '',
    proofKind: task.proofKind,
    unit: task.unit ?? '',
    targetNum: task.targetNum === null ? '' : String(task.targetNum),
    rule: task.rule,
    points: String(task.points),
    cap: task.cap === null ? '' : String(task.cap),
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
    // Пустая половина — это «не переведено», а не пустой заголовок: null, и приложение подставит
    // русское. Пустая строка прошла бы дальше как написанный текст.
    titleEn: draft.titleEn.trim() || null,
    body: draft.body.trim() || null,
    bodyEn: draft.bodyEn.trim() || null,
    mediaUrl: draft.mediaUrl.trim() || null,
    proofKind: draft.proofKind,
    unit: draft.proofKind === 'number' ? draft.unit.trim() || null : null,
    targetNum: draft.proofKind === 'number' ? number(draft.targetNum) : null,
    rule: draft.rule,
    points: draft.rule === 'none' ? 0 : Number(draft.points || 0),
    cap: draft.rule === 'capped' ? Number(draft.cap || 0) : null,
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
  /** The date this task is on, in words — the calendar picked it, so the sheet only confirms it. */
  dayLabel: string;
  /** Day 1 of the round: «повторять до» is picked as a date and stored as a day. */
  startsOn: string;
  dayIndex: number;
  /** Last day of the marathon, so "repeat until" cannot run off the end. */
  lastDay: number;
  teams: readonly MarathonTeamRow[];
  members: readonly MarathonMemberRow[];
  /** Everyone for themselves: no teams to send to and no rule that waits for a partner. */
  solo: boolean;
  /** Who it currently goes to; an empty list is everyone. */
  initialTargets: readonly MarathonTaskTarget[];
  onClose: () => void;
  onSave: (
    patch: MarathonTaskPatch,
    targets: readonly MarathonTaskTarget[],
    repeatUntil: number | null,
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TaskEditor({
  open,
  task,
  dayLabel,
  startsOn,
  dayIndex,
  lastDay,
  teams,
  members,
  solo,
  initialTargets,
  onClose,
  onSave,
  onDelete,
}: TaskEditorProps) {
  const { t } = useT();
  // Новое задание пишется по-русски: русское название обязательно, а переводить ещё нечего.
  const editing = useEditingLocale(!task);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const [targets, setTargets] = useState<readonly MarathonTaskTarget[]>([]);
  /** An ISO date from the date input; turned into a day only when saving. */
  const [repeatUntil, setRepeatUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /*
   * Where this task's picture is uploaded to.
   *
   * An existing task owns a stable path under its own id, so re-uploading replaces the file
   * instead of leaving the old one orphaned in the bucket. A task that does not exist yet has no
   * id to use, so it gets a fresh key **each time the sheet opens** — generating it once per mount
   * would make the second new task overwrite the first one's image, since the sheet stays mounted
   * between openings.
   */
  const [uploadKey, setUploadKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!open) return;
    setDraft(task ? draftFrom(task) : emptyDraft(solo));
    setTargets(initialTargets);
    setRepeatUntil('');
    setConfirmDelete(false);
    setUploadKey(crypto.randomUUID());
  }, [open, task, initialTargets, solo]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const error = draftError(draft);

  const save = async () => {
    if (error) return;
    setBusy(true);
    try {
      await onSave(
        draftToPatch(draft),
        targets,
        repeatUntilDay(startsOn, lastDay, dayIndex, repeatUntil),
      );
      onClose();
    } catch {
      /* The screen has already said what went wrong; the sheet stays open with the draft. */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={dayLabel}
      footer={
        /*
         * `flex-1` on «Сохранить», not `fullWidth`. `w-full` asks for the whole row and flexbox
         * then takes the shortfall out of the button beside it, so «Удалить» was drawn as «Уд…» —
         * the same class of bug as `Badge`'s missing `shrink-0`, and the labels growing 13 → 15px
         * with sentence case is what pushed it over. The primary now grows into whatever is left
         * and the ghost keeps its word.
         */
        <div className="flex gap-3">
          <Button
            size="lg"
            variant="action"
            className="flex-1"
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
              className="shrink-0"
              onClick={() => setConfirmDelete(true)}
            >
              {t('app.mAdminDelete')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {/* «Пишем на» — до всего остального: на него смотрят раньше, чем начинают печатать. */}
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{t('app.adminEditingLanguage')}</span>
          <LangTabs locked={!task} />
        </div>
        {/*
         * First in the form because it is first on the card. The owner's order for the club's
         * screen is picture, title, text, button, board, and a form that asked for them in a
         * different order would be a second thing to hold in your head at 7am.
         */}
        <MediaField
          label={t('app.mAdminTaskImage')}
          hint={t('app.mAdminTaskImageHint')}
          value={draft.mediaUrl || null}
          onChange={(ref) => set('mediaUrl', ref ?? '')}
          bucket={PUBLIC_BUCKET}
          pathBase={`marathon/tasks/${task?.id ?? uploadKey}`}
          accept="image/*"
          maxBytes={MAX_TASK_IMAGE_BYTES}
        />
        {/*
         * Название и текст — на языке, выбранном в «Пишем на» наверху экрана. Русская половина
         * обязательна (её проверяет `draftError`), английская нет: задание можно выпустить и
         * перевести потом, а до тех пор английский участник прочтёт русское.
         */}
        <Input
          label={t('app.mAdminTaskTitle')}
          placeholder={editing === 'en' ? draft.title : draft.titleEn}
          value={editing === 'en' ? draft.titleEn : draft.title}
          error={error === 'title' && draft.title !== '' ? ' ' : undefined}
          onChange={(e) => set(editing === 'en' ? 'titleEn' : 'title', e.target.value)}
        />
        <Textarea
          label={t('app.mAdminTaskBody')}
          rows={3}
          placeholder={editing === 'en' ? draft.body : draft.bodyEn}
          value={editing === 'en' ? draft.bodyEn : draft.body}
          onChange={(e) => set(editing === 'en' ? 'bodyEn' : 'body', e.target.value)}
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

        {/*
         * Over an entry of one, «только если сделают все», «за каждого» and a ceiling are the same
         * arithmetic three times, so a solo marathon is offered the only two answers that differ:
         * it scores, or it is an announcement. Offering the other two would be offering a choice
         * whose options cannot be told apart afterwards.
         */}
        <Select<MarathonRule>
          label={t('app.mAdminRule')}
          value={solo && draft.rule !== 'none' ? 'per_member' : draft.rule}
          onChange={(v) => set('rule', v)}
          options={
            solo
              ? [
                  { value: 'per_member', label: t('app.mAdminRuleSoloScores') },
                  { value: 'none', label: t('app.mAdminRuleNone') },
                ]
              : [
                  { value: 'all_members', label: t('app.mAdminRuleAll') },
                  { value: 'per_member', label: t('app.mAdminRulePer') },
                  { value: 'capped', label: t('app.mAdminRuleCapped') },
                  { value: 'none', label: t('app.mAdminRuleNone') },
                ]
          }
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
            {!solo && draft.rule === 'capped' ? (
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

        <Recipients
          teams={solo ? [] : teams}
          members={members}
          solo={solo}
          value={targets}
          onChange={setTargets}
        />
        {/*
         * With no teams there is no "the team sees it" to choose: both settings mean the author and
         * the coach, so the question is not asked. The stored value stays whatever it was.
         */}
        {solo ? null : (
          <Select<ProofVisibility>
            label={t('app.mAdminVisibility')}
            value={draft.proofVisibility}
            onChange={(v) => set('proofVisibility', v)}
            options={[
              { value: 'team', label: t('app.mAdminVisibilityTeam') },
              { value: 'coach', label: t('app.mAdminVisibilityCoach') },
            ]}
          />
        )}

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
            hint={t('app.mAdminRepeatUntilHint')}
            type="date"
            min={dateOfDay(startsOn, dayIndex + 1)}
            max={dateOfDay(startsOn, lastDay)}
            value={repeatUntil}
            onChange={(e) => setRepeatUntil(e.target.value)}
          />
        ) : null}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('app.mAdminDeleteTask')}
        description={t('app.mAdminDeleteTaskBody')}
        confirmLabel={t('app.mAdminDelete')}
        cancelLabel={t('common.cancel')}
        danger
        loading={deleting}
        onConfirm={() => {
          if (!onDelete) return;
          setDeleting(true);
          void onDelete()
            .then(() => {
              setConfirmDelete(false);
              onClose();
            })
            .catch(() => undefined)
            .finally(() => setDeleting(false));
        }}
      />
    </Sheet>
  );
}

interface RecipientsProps {
  teams: readonly MarathonTeamRow[];
  members: readonly MarathonMemberRow[];
  /** Everyone for themselves: the list is people, and nobody is covered by anybody. */
  solo: boolean;
  value: readonly MarathonTaskTarget[];
  onChange: (next: readonly MarathonTaskTarget[]) => void;
}

/**
 * Who this one gets sent to: everybody, or the pairs and people you tick.
 *
 * This is the part the coach asked for in as many words — «кому мы это отправляем: двум или
 * одному». It replaced a three-way category (all / teams / solo), which could say "to the pairs"
 * but never "to *that* pair", and that is the distinction the format runs on: one morning Ваня и
 * Витя get the deck task and Оля gets something else entirely.
 *
 * Teams come first because a pair is the usual unit; ticking a team sends it to both of them and
 * scores it over both. Ticking one person sends it to them alone — and «только если сделают все»
 * then means that one person, which is the sentence that makes the rule work at any size.
 */
function Recipients({ teams, members, solo, value, onChange }: RecipientsProps) {
  const { t } = useT();
  const everyone = value.length === 0;
  const hasTeam = (id: string) => value.some((g) => g.teamId === id);
  const hasMember = (id: string) => value.some((g) => g.memberId === id);

  const toggleTeam = (id: string) =>
    onChange(
      hasTeam(id)
        ? value.filter((g) => g.teamId !== id)
        : [...value, { teamId: id, memberId: null }],
    );
  const toggleMember = (id: string) =>
    onChange(
      hasMember(id)
        ? value.filter((g) => g.memberId !== id)
        : [...value, { teamId: null, memberId: id }],
    );

  /** Members already covered by a ticked team — shown as such rather than tickable twice. */
  const coveredByTeam = (member: MarathonMemberRow) =>
    !solo && member.teamId !== null && hasTeam(member.teamId);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-1.5 text-[13px] font-semibold text-muted">
        {t('app.mAdminSendTo')}
      </legend>

      <label className="flex items-center gap-3 border-t border-border py-2.5 text-[15px]">
        <input
          type="checkbox"
          checked={everyone}
          onChange={() => onChange([])}
          className="size-5 accent-primary"
        />
        {t('app.mAdminSendAll')}
      </label>

      {teams.map((team) => (
        <label
          key={team.id}
          className="flex items-center gap-3 border-t border-border py-2.5 text-[15px]"
        >
          <input
            type="checkbox"
            checked={hasTeam(team.id)}
            onChange={() => toggleTeam(team.id)}
            className="size-5 accent-primary"
          />
          <span className="min-w-0 flex-1 truncate">{team.name}</span>
          {/* 10px → 12px, with the weekday strip in `DayPlan`: 10 was the floor for a tracked
              capital, and these two are the last labels in the club still set for them. */}
          <span className="control-label shrink-0 text-[12px] text-muted-2">
            {t('app.mAdminTeam')}
          </span>
        </label>
      ))}

      {members
        .filter((m) => m.status === 'active')
        .map((member) => {
          const covered = coveredByTeam(member);
          return (
            <label
              key={member.id}
              className="flex items-center gap-3 border-t border-border py-2.5 text-[15px]"
            >
              <input
                type="checkbox"
                checked={hasMember(member.id) || covered}
                disabled={covered}
                onChange={() => toggleMember(member.id)}
                className="size-5 accent-primary disabled:opacity-40"
              />
              <span className="min-w-0 flex-1 truncate">
                {member.displayName?.trim() || member.email}
              </span>
              {covered ? (
                <span className="control-label shrink-0 text-[12px] text-muted-2">
                  {t('app.mAdminSendViaTeam')}
                </span>
              ) : null}
            </label>
          );
        })}
    </fieldset>
  );
}
