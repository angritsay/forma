/**
 * One task of the day: its name, what it is worth, the one control that delivers it, and — the
 * part that makes this format different from a checklist — where the person you are scored with
 * has got to.
 *
 * The card used to open with a line of rule («Только если сделают оба»), then the title as a
 * heading, the body, a target line, a labelled field, a button and a badge — seven pieces of type
 * for one task. The owner's prototype (`design/ui_kits/app-v2`, «Челлендж») does it with three:
 * the task's name in the display face, a pill saying what it is worth, and a field with «Готово»
 * beside it. That is the order of the athlete's attention, and it is what this draws. The rule is
 * still here for the one case where it changes what you do — a pair task that scores only when
 * both deliver — and the target has moved into the field it is the target for.
 *
 * A delivered task does not disappear and does not turn grey: it gets a check in a white circle,
 * landing on the spring, and steps back a little. Finishing something should look like something.
 */
import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { formatNumber, plural } from '@/i18n/index';
import type { MarathonTodayTask, ProofInput } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface TaskCardProps {
  item: MarathonTodayTask;
  /** Names of the people I am scored with, by member id — for «Марек сделал». */
  teammateNames: Map<string, string>;
  /** The day has closed; proof can still be sent, but the card says it will not score. */
  closed: boolean;
  onSend: (proof: Omit<ProofInput, 'taskId' | 'memberId'>) => Promise<void>;
  /** Uploads the file to the private `proofs` bucket and sends its path. */
  onSendMedia: (file: File) => Promise<void>;
}

export function TaskCard({ item, teammateNames, closed, onSend, onSendMedia }: TaskCardProps) {
  const { t, locale } = useT();
  const { task, mine, teammatesDone, entrySize } = item;
  const [text, setText] = useState(mine?.valueText ?? '');
  const [value, setValue] = useState(mine?.valueNum === null ? '' : String(mine?.valueNum ?? ''));
  const [busy, setBusy] = useState(false);

  const done = Boolean(mine && !mine.voidedAt);
  const voided = Boolean(mine?.voidedAt);

  const send = async (proof: Omit<ProofInput, 'taskId' | 'memberId'>) => {
    setBusy(true);
    try {
      await onSend(proof);
    } finally {
      setBusy(false);
    }
  };

  const sendMedia = async (file: File) => {
    setBusy(true);
    try {
      await onSendMedia(file);
    } finally {
      setBusy(false);
    }
  };

  /*
   * The rule, only where it changes what you do. «Только если сделают оба» is the sentence that
   * makes someone message their partner; a cap is a ceiling worth knowing. «Каждому за себя» is
   * the default and says nothing, and «Без баллов» is already said by the missing pill.
   */
  const rule =
    task.rule === 'all_members' && entrySize > 1 && !done
      ? t('app.marathonRuleAllMembers')
      : task.rule === 'capped'
        ? t('app.marathonRuleCapped', { n: formatNumber(locale, task.cap ?? 0) })
        : null;

  const points = plural(locale, task.points, {
    one: t('app.marathonPointsOne', { n: formatNumber(locale, task.points) }),
    few: t('app.marathonPointsFew', { n: formatNumber(locale, task.points) }),
    many: t('app.marathonPointsMany', { n: formatNumber(locale, task.points) }),
  });

  return (
    <article
      className={clsx(
        'flex flex-col gap-4 border-t border-border py-5',
        // A finished task steps back rather than disappearing: the day should still read as a day.
        done && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* 1.08 → 1.2: the old number was drawn for capitals, and a task title is arbitrary text
              that can wrap. See the type-scale comment in global.css for the measurement. */}
          <h3 className="display text-[24px] leading-[1.2] text-balance">{task.title}</h3>
          {task.body ? (
            <p className="mt-2 text-[14px] leading-snug text-muted">{task.body}</p>
          ) : null}
          {/* Plain `.eyebrow`: it is 13px sentence case now, and the `text-[10px]` that used to hold
              it under the tracked capitals would leave this rule the one unreadable line on the
              card. */}
          {rule ? <p className="eyebrow mt-2">{rule}</p> : null}
        </div>
        {done ? (
          /*
           * The check, landing. Keyed on nothing: the card is rendered done from the moment the
           * proof is in, so the circle mounts exactly once — when the day loads finished, or when
           * the proof arrives — and pops both times.
           */
          <span
            className="pop-in flex size-10 shrink-0 items-center justify-center rounded-pill bg-paper text-ink"
            role="img"
            aria-label={t('app.marathonProofSent')}
          >
            <Glyph size={16}>✓</Glyph>
          </span>
        ) : task.rule !== 'none' ? (
          /*
           * What is still on the table, in the club's colour — the brandbook's «цвет красит
           * номера» spent on the one number that is a decision.
           */
          <Pill tone="course">{points}</Pill>
        ) : null}
      </div>

      {voided && mine?.voidReason ? (
        <p className="text-[13px] text-danger">
          {t('app.marathonProofVoided', { reason: mine.voidReason })}
        </p>
      ) : null}

      {task.rule !== 'none' || task.proofKind !== 'done' ? (
        <ProofControl
          item={item}
          busy={busy}
          closed={closed}
          text={text}
          value={value}
          onText={setText}
          onValue={setValue}
          onSend={send}
          onSendMedia={sendMedia}
        />
      ) : null}

      <PartnerLine
        done={done}
        entrySize={entrySize}
        teammatesDone={teammatesDone}
        teammateNames={teammateNames}
        rule={task.rule}
      />
    </article>
  );
}

interface ProofControlProps {
  item: MarathonTodayTask;
  busy: boolean;
  closed: boolean;
  text: string;
  value: string;
  onText: (v: string) => void;
  onValue: (v: string) => void;
  onSend: (proof: Omit<ProofInput, 'taskId' | 'memberId'>) => Promise<void>;
  onSendMedia: (file: File) => Promise<void>;
}

/**
 * The control is whatever the task asks for: a button, a sentence, a number, a photo — and once
 * the proof is in, nothing, because the check on the card is the state. The one exception is a
 * photo, which can be replaced: the coach may not have seen the first one yet.
 */
function ProofControl({
  item,
  busy,
  closed,
  text,
  value,
  onText,
  onValue,
  onSend,
  onSendMedia,
}: ProofControlProps) {
  const { t, locale } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const { task, mine } = item;
  const done = Boolean(mine && !mine.voidedAt);
  const locked = Boolean(mine?.voidedAt);

  if (locked) return null;

  /* The day is over and this was not sent: the control stays, with the one honest line beside it. */
  const late =
    closed && !done ? (
      <span className="text-[13px] text-muted-2">{t('app.marathonDeadlinePassed')}</span>
    ) : null;

  if (task.proofKind === 'done') {
    if (done) return null;
    return (
      <div className="flex items-center gap-3">
        <Button
          size="md"
          loading={busy}
          onClick={() => void onSend({})}
          iconRight={<Glyph size={14}>✓</Glyph>}
        >
          {t('app.marathonProofDone')}
        </Button>
        {late}
      </div>
    );
  }

  if (task.proofKind === 'number') {
    if (done) return null;
    /*
     * The target is the field's placeholder — it is what the number is measured against — and the
     * unit is the field's trailing word, so the placeholder is the bare figure: «10 000 | шагов»,
     * not «Цель: 10 000 шагов | шагов».
     */
    const placeholder = task.targetNum !== null ? formatNumber(locale, task.targetNum) : '';
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(value);
          if (!Number.isFinite(n) || n < 0) return;
          void onSend({ valueNum: n });
        }}
      >
        <div className="flex items-center gap-2">
          <Input
            aria-label={t('app.marathonProofNumberLabel')}
            placeholder={placeholder}
            inputMode="numeric"
            value={value}
            trailing={
              task.unit ? <span className="text-[13px] text-muted">{task.unit}</span> : null
            }
            onChange={(e) => onValue(e.target.value)}
            wrapperClassName="min-w-0 flex-1"
          />
          <Button
            type="submit"
            size="md"
            loading={busy}
            disabled={value.trim() === ''}
            iconRight={<Glyph size={14}>✓</Glyph>}
          >
            {t('common.done')}
          </Button>
        </div>
        {late}
      </form>
    );
  }

  if (task.proofKind === 'text') {
    if (done) return null;
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          void onSend({ valueText: text.trim() });
        }}
      >
        <div className="flex items-center gap-2">
          <Input
            aria-label={t('app.marathonProofTextLabel')}
            placeholder={t('app.marathonProofTextLabel')}
            value={text}
            onChange={(e) => onText(e.target.value)}
            wrapperClassName="min-w-0 flex-1"
          />
          <Button
            type="submit"
            size="md"
            loading={busy}
            disabled={!text.trim()}
            iconRight={<Glyph size={14}>✓</Glyph>}
          >
            {t('common.done')}
          </Button>
        </div>
        {late}
      </form>
    );
  }

  // media — the photo is private to the coach, and the card says so rather than leaving it to be
  // discovered after the fact.
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear the input so picking the same file twice still fires a change.
          e.target.value = '';
          if (file) void onSendMedia(file);
        }}
      />
      <div className="flex items-center gap-3">
        <Button
          size="md"
          variant={done ? 'secondary' : 'primary'}
          loading={busy}
          onClick={() => fileRef.current?.click()}
        >
          {done ? t('app.marathonProofPhotoAgain') : t('app.marathonProofPhoto')}
        </Button>
        {late}
      </div>
      <span className="text-[13px] text-muted-2">{t('app.marathonProofCoachOnly')}</span>
    </div>
  );
}

interface PartnerLineProps {
  done: boolean;
  entrySize: number;
  teammatesDone: readonly string[];
  teammateNames: Map<string, string>;
  rule: MarathonTodayTask['task']['rule'];
}

/**
 * Where the pair stands, in one sentence.
 *
 * Only for a task the pair actually shares — on a `per_member` task your partner's state changes
 * nothing for you, and saying it anyway would be noise pretending to be pressure.
 */
function PartnerLine({ done, entrySize, teammatesDone, teammateNames, rule }: PartnerLineProps) {
  const { t } = useT();
  if (entrySize < 2 || rule === 'none' || rule === 'per_member') return null;

  const others = entrySize - 1;
  const firstName = [...teammateNames.values()][0] ?? '';

  /*
   * `self-start` on the stamp, and it is the same bug `Badge`'s own `shrink-0` note describes from
   * the other side. The card is a `flex flex-col`, so its cross axis is the width and a child with
   * no alignment is stretched to it: «Команда ждёт тебя» is 152px of words and was drawn in a
   * 327px outlined box running the full width of a 375px screen, which reads as a banner rather
   * than a stamp. A badge hugs its word wherever it is put.
   */
  if (done && teammatesDone.length >= others) {
    return (
      <Badge tone="success" className="self-start">
        {t('app.marathonPartnerBoth')}
      </Badge>
    );
  }
  if (!done && teammatesDone.length >= others) {
    // The one that should sting a little: they delivered, the team is on you.
    return (
      <Badge tone="warning" className="self-start">
        {t('app.marathonTeamWaitingYou')}
      </Badge>
    );
  }
  if (done) {
    const waitingFor =
      [...teammateNames.entries()].find(([id]) => !teammatesDone.includes(id))?.[1] ?? firstName;
    return (
      <span className="text-[13px] text-muted">
        {t('app.marathonPartnerWaiting', { name: waitingFor })}
      </span>
    );
  }
  return null;
}
