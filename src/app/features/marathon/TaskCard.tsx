/**
 * One task of the day: what to do, what it is worth, the proof control, and — the part that makes
 * this format different from a checklist — where the person you are scored with has got to.
 *
 * The order on the card is the order of the athlete's attention: the task, then whether it is done,
 * then the partner. Points and the rule sit on one quiet line at the top, because knowing a task is
 * worth 12 and only counts if both deliver changes whether you nudge your partner — but it is not
 * what you came to read.
 */
import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatNumber } from '@/i18n/index';
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
   * The rule, said in words rather than as a name. «Только если сделают оба» is the sentence that
   * makes someone message their partner; `all_members` is a column value.
   */
  const ruleLabel = (() => {
    if (task.rule === 'none') return t('app.marathonRuleNone');
    if (task.rule === 'capped') {
      return t('app.marathonRuleCapped', { n: formatNumber(locale, task.cap ?? 0) });
    }
    if (task.rule === 'all_members' && entrySize > 1) return t('app.marathonRuleAllMembers');
    return t('app.marathonRulePerMember');
  })();

  return (
    <article
      className={clsx(
        'flex flex-col gap-3 border-t border-border py-5',
        // A finished task steps back rather than disappearing: the day should still read as a day.
        done && 'opacity-60',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="control-label text-[10px] text-muted-2">{ruleLabel}</span>
        {task.rule !== 'none' ? (
          <span className="numeral tabular shrink-0 text-[13px] text-muted">
            {t('app.marathonPointsN', { n: formatNumber(locale, task.points) })}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl leading-[1.12] text-balance">{task.title}</h3>
        {task.body ? <p className="text-[15px] leading-[1.5] text-muted">{task.body}</p> : null}
        {task.targetNum !== null && task.unit ? (
          <p className="numeral text-[13px] text-muted-2">
            {t('app.marathonProofTarget', {
              n: formatNumber(locale, task.targetNum),
              unit: task.unit,
            })}
          </p>
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

/** The control is whatever the task asks for: a button, a sentence, a number, a photo. */
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
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const { task, mine } = item;
  const done = Boolean(mine && !mine.voidedAt);
  const locked = Boolean(mine?.voidedAt);

  if (locked) return null;

  if (task.proofKind === 'done') {
    return (
      <div className="flex items-center gap-3">
        <Button
          size="md"
          variant={done ? 'secondary' : 'primary'}
          loading={busy}
          disabled={done}
          onClick={() => void onSend({})}
        >
          {done ? t('app.marathonProofSent') : t('app.marathonProofDone')}
        </Button>
        {closed && !done ? (
          <span className="text-[13px] text-muted-2">{t('app.marathonDeadlinePassed')}</span>
        ) : null}
      </div>
    );
  }

  if (task.proofKind === 'number') {
    return (
      <form
        className="flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(value);
          if (!Number.isFinite(n) || n < 0) return;
          void onSend({ valueNum: n });
        }}
      >
        <Input
          label={t('app.marathonProofNumberLabel')}
          inputMode="numeric"
          value={value}
          trailing={task.unit ? <span className="text-[13px] text-muted">{task.unit}</span> : null}
          onChange={(e) => onValue(e.target.value)}
          wrapperClassName="flex-1"
        />
        <Button type="submit" size="md" loading={busy} disabled={value.trim() === ''}>
          {t('app.marathonProofSend')}
        </Button>
      </form>
    );
  }

  if (task.proofKind === 'text') {
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          void onSend({ valueText: text.trim() });
        }}
      >
        <Input
          label={t('app.marathonProofTextLabel')}
          value={text}
          onChange={(e) => onText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" size="md" loading={busy} disabled={!text.trim()}>
            {t('app.marathonProofSend')}
          </Button>
          {done ? (
            <span className="text-[13px] text-muted-2">{t('app.marathonProofSent')}</span>
          ) : null}
        </div>
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
        {done ? (
          <span className="text-[13px] text-muted-2">{t('app.marathonProofPhotoSent')}</span>
        ) : null}
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

  if (done && teammatesDone.length >= others) {
    return <Badge tone="success">{t('app.marathonPartnerBoth')}</Badge>;
  }
  if (!done && teammatesDone.length >= others) {
    // The one that should sting a little: they delivered, the team is on you.
    return <Badge tone="warning">{t('app.marathonTeamWaitingYou')}</Badge>;
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
