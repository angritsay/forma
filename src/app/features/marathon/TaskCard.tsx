/**
 * The task of the day: its name, what it is worth, and the one control that delivers it.
 *
 * Three pieces of type, which is the owner's prototype (`design/ui_kits/app-v2`, «Челлендж») and
 * the order of the athlete's attention: the name in the display face, a pill saying what it is
 * worth, a control with «Готово» on it. The card once opened with a line of rule, then the title,
 * the body, a target line, a labelled field, a button and a badge — seven pieces for one task.
 *
 * Two of those went with «Никакого напарника в клубе быть не должно. Каждый сам за себя»:
 *
 *   • **`PartnerLine`**, the sentence saying where the other half of the pair had got to
 *     («Ждём Марину», «Команда ждёт тебя»). There is no pair to wait for.
 *   • **the rule line** — «Только если сделают оба» and «На команду не больше N». Both are team
 *     sentences, and in a club of one-person entries neither can be true. `all_members` and
 *     `capped` still exist in the schema for a marathon that does run in teams; what they do not
 *     have any more is a line on this card.
 *
 * The body is still drawn when the coach writes one, and the club's own week writes none — the
 * name of the task is the task («Не надо доп текст писать»).
 *
 * A delivered task does not disappear and does not turn grey: it gets a check in a white circle,
 * landing on the spring, and steps back a little. Finishing something should look like something.
 */
import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { formatNumber, plural } from '@/i18n/index';
import type { MarathonTodayTask, ProofInput } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export interface TaskCardProps {
  item: MarathonTodayTask;
  /** The day has closed; proof can still be sent, but the card says it will not score. */
  closed: boolean;
  onSend: (proof: Omit<ProofInput, 'taskId' | 'memberId'>) => Promise<void>;
  /**
   * Uploads the file to the private `proofs` bucket and sends its path.
   *
   * `keep` is whatever the proof already carries. `sendProof` upserts the whole row, so attaching
   * a photo to a task that was delivered with a number would otherwise null the number out — the
   * attachment has to re-send the answer it is being attached to.
   */
  onSendMedia: (file: File, keep: Omit<ProofInput, 'taskId' | 'memberId'>) => Promise<void>;
}

export function TaskCard({ item, closed, onSend, onSendMedia }: TaskCardProps) {
  const { t, locale } = useT();
  const { task, mine } = item;
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

  /*
   * Attaching re-sends whatever the proof already says, because the upsert writes the whole row:
   * a photo added to «Прогулка полчаса · 34 мин» must not turn the 34 into null.
   */
  const sendMedia = async (file: File) => {
    setBusy(true);
    try {
      await onSendMedia(file, {
        ...(mine?.valueText != null ? { valueText: mine.valueText } : {}),
        ...(mine?.valueNum != null ? { valueNum: mine.valueNum } : {}),
      });
    } finally {
      setBusy(false);
    }
  };

  const media = useMediaUrl(task.mediaUrl ?? undefined);

  const points = plural(locale, task.points, {
    one: t('app.marathonPointsOne', { n: formatNumber(locale, task.points) }),
    few: t('app.marathonPointsFew', { n: formatNumber(locale, task.points) }),
    many: t('app.marathonPointsMany', { n: formatNumber(locale, task.points) }),
  });

  return (
    <article
      className={clsx(
        /*
         * The rule separates one task from the next, so the first card has none — and that only
         * became visible when the head came off the screen. With «День 10 из 14» above it the line
         * sat under a header and read as a divider; with nothing above it, it was the first pixel
         * on the page, separating the task from the top of the phone.
         */
        'flex flex-col gap-4 border-t border-border py-5 first:border-t-0 first:pt-0',
        // A finished task steps back rather than disappearing: the day should still read as a day.
        done && 'opacity-70',
      )}
    >
      {/*
       * The coach's picture for this task, above everything else on the card.
       *
       * The owner's order for the screen, read off her mockups: «сверху у нас должна быть какая-то
       * картинка, которую мы подгружаем из админки к каждому заданию. Дальше: заголовок к заданию,
       * сам текст задания, кнопка… снизу лидерборд.» It belongs to the task and not to the screen,
       * so it lives on the card — which is also what keeps it right on a day the coach writes two
       * tasks instead of one.
       *
       * `aspect-[16/9]` rather than the file's own shape, so the box is reserved before the bytes
       * arrive and the title and the button do not jump down the screen when the image lands. The
       * cost is that a portrait photo is cropped to a landscape band, and the admin field says so.
       *
       * `alt=""` on purpose: the task is named in the heading directly underneath, and a screen
       * reader describing a photograph of a plank before reading «Шестьдесят секунд в планке» is
       * noise rather than information.
       */}
      {media ? (
        <img
          src={media}
          alt=""
          className="aspect-[16/9] w-full rounded-card bg-surface-2 object-cover"
        />
      ) : null}

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* 1.08 → 1.2: the old number was drawn for capitals, and a task title is arbitrary text
              that can wrap. See the type-scale comment in global.css for the measurement. */}
          <h3 className="display text-[24px] leading-[1.2] text-balance">{task.title}</h3>
          {task.body ? (
            <p className="mt-2 text-[14px] leading-snug text-muted">{task.body}</p>
          ) : null}
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
 * The control is whatever the task asks for — a button, a sentence, a number — **and, on every one
 * of them, somewhere to attach a photo or a clip.**
 *
 * That attachment used to exist only on a task the coach had typed as `media`, which made the
 * club's own honesty system depend on him having guessed in advance which day someone might lie
 * about. The owner's instruction is the other way round: «при клике на кнопку выполнить задание
 * должна быть возможность прикрепить видео или фото доказательства». So the attach row is on
 * every kind, it is optional on all of them, and it stays after the proof is sent — the tap on
 * «Сделал» and the evidence for it are two different moments, and somebody filming a set will
 * finish the set first.
 *
 * Only `media` keeps it as the primary control: there the attachment *is* the proof, and a task
 * that scores nothing without a photo should not offer a button that pretends otherwise.
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
  const { task, mine } = item;
  const done = Boolean(mine && !mine.voidedAt);
  const locked = Boolean(mine?.voidedAt);

  if (locked) return null;

  /* The day is over and this was not sent: the control stays, with the one honest line beside it. */
  const late =
    closed && !done ? (
      <span className="text-[13px] text-muted-2">{t('app.marathonDeadlinePassed')}</span>
    ) : null;

  /* The attachment, on every kind. `attach` is null only for `media`, which renders it as the
     primary control below instead of repeating it. */
  const attach =
    task.proofKind === 'media' ? null : (
      <AttachProof busy={busy} hasMedia={Boolean(mine?.mediaPath)} onPick={onSendMedia} />
    );

  if (task.proofKind === 'done') {
    return (
      <div className="flex flex-col gap-2">
        {done ? null : (
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
        )}
        {attach}
      </div>
    );
  }

  if (task.proofKind === 'number') {
    if (done) return attach;
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
        {attach}
      </form>
    );
  }

  if (task.proofKind === 'text') {
    if (done) return attach;
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
        {attach}
      </form>
    );
  }

  /*
   * media — the attachment is the proof, so it is the primary control and there is no «Сделал»
   * beside it. The photo is private to the coach, and the card says so rather than leaving it to
   * be discovered after the fact.
   */
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <AttachProof busy={busy} hasMedia={Boolean(mine?.mediaPath)} onPick={onSendMedia} primary />
        {late}
      </div>
      <span className="text-[13px] text-muted-2">{t('app.marathonProofCoachOnly')}</span>
    </div>
  );
}

/**
 * Pick a photo or a clip.
 *
 * **Video is back, and the three reasons it was removed are the three things fixed around it.**
 * It came out because nothing shrank a clip, the demo backend base64'd whatever it was handed into
 * `localStorage`, and the coach's feed never played it back — it printed «Фото отправлено» and
 * stopped. The feed plays it now (`ProofMedia`), the demo store refuses to inline a clip, and the
 * size cap below is the answer to the first: a browser cannot re-encode video, so the only honest
 * control is a limit stated before the upload and enforced after the pick.
 *
 * `capture` is deliberately **not** set. It would send the phone straight to the camera, and half
 * of these proofs are a shot taken twenty minutes ago — a picker that refuses the camera roll is a
 * picker that loses them.
 */
function AttachProof({
  busy,
  hasMedia,
  onPick,
  primary = false,
}: {
  busy: boolean;
  hasMedia: boolean;
  onPick: (file: File) => void;
  /** The attachment is the whole proof (a `media` task), not an optional extra. */
  primary?: boolean;
}) {
  const { t } = useT();
  const ref = useRef<HTMLInputElement>(null);
  const label = primary
    ? hasMedia
      ? t('app.marathonProofPhotoAgain')
      : t('app.marathonProofPhoto')
    : hasMedia
      ? t('app.marathonProofAttachAgain')
      : t('app.marathonProofAttach');

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear the input so picking the same file twice still fires a change.
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
      {primary ? (
        <Button
          size="md"
          variant={hasMedia ? 'secondary' : 'primary'}
          loading={busy}
          onClick={() => ref.current?.click()}
        >
          {label}
        </Button>
      ) : (
        /* Optional, so it is a ghost link under the control rather than a second button competing
           with the one that actually delivers the task. */
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 self-start text-[13px] text-muted underline underline-offset-4 disabled:opacity-60"
        >
          <Glyph size={12} className="text-muted-2">
            +
          </Glyph>
          {label}
        </button>
      )}
    </>
  );
}
