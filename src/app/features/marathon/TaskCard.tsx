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
 *
 * ## The envelope (the owner's «желание зайти и узнать новое задание»)
 *
 * On the first look of the day the card is sealed: a warm-gradient rim, «Задание дня готово», a
 * light-blue pill reading «+?» where the points will be, and a tap anywhere opens it — the open
 * card lands on the spring (`pop-in`) with the title's gradient key word and the real number.
 * Whether it is sealed is the screen's call (`isSealed` in taskSeal.ts, remembered per task in
 * `clubMemory`); this card only draws the two states. A done task is never sealed, and neither
 * is a day for somebody who asked for less motion.
 *
 * Two more things came back onto the card with the duo club, both as slots the screen fills:
 * `partner` (`ClubPartnerLine`, where the other half of the pair has got to today) and `share`
 * (`ClubShare`, after the proof is in). Both are handed in rather than built here because both
 * need what the screen has and the card does not — the partner's name, the streak, the place.
 *
 * `onSend` and `onSendMedia` receive the element that was pressed, so the screen can start the
 * celebration (`ClubCelebrate`) from where the finger was.
 */
import { clsx } from 'clsx';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { formatNumber, plural } from '@/i18n/index';
import { isRejected, needsCoachLook } from '@/lib/marathon/review';
import type { MarathonTodayTask, ProofInput } from '@/lib/api/types';
import { splitKeyWord } from '@/lib/ui/keyWord';
import { useT } from '@/app/hooks/useT';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

export interface TaskCardProps {
  item: MarathonTodayTask;
  /** The day has closed; proof can still be sent, but the card says it will not score. */
  closed: boolean;
  onSend: (
    proof: Omit<ProofInput, 'taskId' | 'memberId'>,
    anchor?: HTMLElement | null,
  ) => Promise<void>;
  /**
   * Uploads the file to the private `proofs` bucket and sends its path.
   *
   * `keep` is whatever the proof already carries. `sendProof` upserts the whole row, so attaching
   * a photo to a task that was delivered with a number would otherwise null the number out — the
   * attachment has to re-send the answer it is being attached to.
   */
  onSendMedia: (
    file: File,
    keep: Omit<ProofInput, 'taskId' | 'memberId'>,
    anchor?: HTMLElement | null,
  ) => Promise<void>;
  /** The envelope is still closed (`isSealed`). A tap calls `onOpen`. */
  sealed?: boolean;
  onOpen?: () => void;
  /** The partner's day (`ClubPartnerLine`), in the duo club. */
  partner?: ReactNode;
  /** «Поделиться» (`ClubShare`), drawn once the proof is in. */
  share?: ReactNode;
}

export function TaskCard({
  item,
  closed,
  onSend,
  onSendMedia,
  sealed = false,
  onOpen,
  partner,
  share,
}: TaskCardProps) {
  const { t, locale } = useT();
  const { task, mine } = item;
  const [text, setText] = useState(mine?.valueText ?? '');
  const [value, setValue] = useState(mine?.valueNum === null ? '' : String(mine?.valueNum ?? ''));
  const [busy, setBusy] = useState(false);
  /* Opened by a tap this visit: the card lands (`pop-in`). A card that loads open does not. */
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const done = Boolean(mine && !mine.voidedAt);
  /* The coach rejected this attempt: it is not scoring, and the task is open again. */
  const rejected = Boolean(mine && isRejected(mine));
  /* Sent again since, and he has not been back to it. */
  const waiting = Boolean(mine && needsCoachLook(mine));

  const send = async (proof: Omit<ProofInput, 'taskId' | 'memberId'>, anchor?: HTMLElement) => {
    setBusy(true);
    try {
      await onSend(proof, anchor ?? cardRef.current);
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
      await onSendMedia(
        file,
        {
          ...(mine?.valueText != null ? { valueText: mine.valueText } : {}),
          ...(mine?.valueNum != null ? { valueNum: mine.valueNum } : {}),
        },
        cardRef.current,
      );
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

  if (sealed) {
    return (
      <SealedTask
        onOpen={() => {
          setRevealed(true);
          onOpen?.();
        }}
      />
    );
  }

  return (
    <article
      ref={cardRef}
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
        revealed && 'pop-in',
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
          {/*
           * Название на языке читателя, если тренер его перевёл, и русское, если нет. Подстановка,
           * а не пустая строка: по названию не на том языке ещё можно понять, что делать, а по
           * пустому — нет. То же правило, что у курсов (`l10n()` в src/lib/courses/draft.ts).
           */}
          {/* The title's last word is the club's key word, in the warm gradient: 24px is large
              type, which is what the gradient on the club may be (global.css, `.club-aurora`). */}
          <h3 className="display text-[24px] leading-[1.2] text-balance">
            <GradientKey text={(locale === 'en' && task.titleEn) || task.title} />
          </h3>
          {(locale === 'en' && task.bodyEn) || task.body ? (
            <p className="mt-2 text-[14px] leading-snug text-muted">
              {(locale === 'en' && task.bodyEn) || task.body}
            </p>
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
           * What is still on the table, as a light-blue tag — the one number on the card that is a
           * decision. It was the neon, which asks for one everywhere else; the club has no neon
           * (design/CHANGELOG.md §17), and the light blue is the gradient's own first stop.
           */
          <Pill tone="sky" tilt="right">
            {points}
          </Pill>
        ) : null}
      </div>

      {partner}

      {rejected && mine?.voidReason ? <CoachNote reason={mine.voidReason} /> : null}

      {waiting ? <p className="text-[13px] text-muted-2">{t('app.marathonProofResent')}</p> : null}

      <ProofControl
        item={item}
        busy={busy}
        closed={closed}
        redo={rejected}
        text={text}
        value={value}
        onText={setText}
        onValue={setValue}
        onSend={send}
        onSendMedia={sendMedia}
      />

      {/* Pride is the last step of the loop, so the button for it appears only once there is
          something to be proud of. A ghost, under the attach row, with the same left edge. */}
      {done && share ? <div className="-ml-4.5 self-start">{share}</div> : null}
    </article>
  );
}

/**
 * The closed envelope. A single button, the whole card, so a tap anywhere opens it — the
 * gesture is «what is it today?», not «find the control».
 *
 * The rim is the warm gradient at 1px (`bg-warm p-px`), the club's colour and the same idea as
 * the winner card's crossroads rim, one notch quieter: this is a promise, not a prize. Inside it
 * the ordinary glass card, so the gradient is a line and never a fill under type
 * (design/CHANGELOG.md §17). The «+?» pill is `sky`, exactly where the points pill sits on the
 * open card, so the number lands in the place the question was.
 */
function SealedTask({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t('app.clubSealedTitle')} — ${t('app.clubSealedHint')}`}
      className="w-full rounded-tile bg-warm p-px text-left"
    >
      <span className="glass-card flex flex-col gap-4 rounded-[calc(var(--r-tile)-1px)] border-0 p-5">
        <span className="flex items-start gap-4">
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="eyebrow">{t('app.clubSealedKicker')}</span>
            <span className="display text-[24px] leading-[1.2] text-balance">
              <GradientKey text={t('app.clubSealedTitle')} />
            </span>
          </span>
          <Pill tone="sky" tilt="right">
            {t('app.clubSealedPoints')}
          </Pill>
        </span>
        <span className="text-[13px] text-muted">{t('app.clubSealedHint')}</span>
      </span>
    </button>
  );
}

/**
 * What the coach said about this proof — his words, in his voice, not an error state.
 *
 * It used to be one red line: «Не засчитано: не то видео, я всё вижу», set in `--danger` under the
 * task and followed by nothing, because a rejected proof also hid the control. That read as a
 * malfunction of the app rather than a message from a person, and it was a dead end: the athlete
 * had been told they were wrong and given no way to be right.
 *
 * So it is a card with him at the top of it and a way out underneath: the rejection is one round
 * of a conversation — «дальше пользователь может выполнить это задание заново, и флоу будет
 * аналогичен» — and the control below this block is open for exactly that.
 *
 * Deliberately not `--danger`. Nothing has gone wrong; the coach watched the clip and wants
 * another one, and the only red on this screen should be reserved for the app's own failures.
 */
function CoachNote({ reason }: { reason: string }) {
  const { t } = useT();
  return (
    <Card level={2} padding="sm" className="flex flex-col gap-2">
      <span className="eyebrow">{t('app.marathonProofCoachNote')}</span>
      {/* His comment is the loudest thing in the block: it is the only part worth reading twice. */}
      <p className="text-[15px] leading-snug text-text">{reason}</p>
      <span className="text-[13px] text-muted-2">{t('app.marathonProofRejectedHint')}</span>
    </Card>
  );
}

interface ProofControlProps {
  item: MarathonTodayTask;
  busy: boolean;
  closed: boolean;
  /** The coach rejected what was sent, so every control here is a second go at the task. */
  redo: boolean;
  text: string;
  value: string;
  onText: (v: string) => void;
  onValue: (v: string) => void;
  onSend: (proof: Omit<ProofInput, 'taskId' | 'memberId'>, anchor?: HTMLElement) => Promise<void>;
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
 *
 * **A rejected proof keeps its control, and every label on it says «заново».** This returned
 * `null` for a voided proof, which left the athlete holding «Не засчитано» and nothing to press.
 * The coach's rejection is about one attempt, so the way back is the same control that sent the
 * first one — the server decides what a second send means (0027_proof_review.sql).
 */
function ProofControl({
  item,
  busy,
  closed,
  redo,
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

  /* The day is over and this was not sent: the control stays, with the one honest line beside it. */
  const late =
    closed && !done ? (
      <span className="text-[13px] text-muted-2">{t('app.marathonDeadlinePassed')}</span>
    ) : null;

  /* The attachment, on every kind. `attach` is null only for `media`, which renders it as the
     primary control below instead of repeating it. */
  const attach =
    task.proofKind === 'media' ? null : (
      <AttachProof
        busy={busy}
        hasMedia={Boolean(mine?.mediaPath)}
        redo={redo}
        onPick={onSendMedia}
      />
    );

  if (task.proofKind === 'done') {
    return (
      <div className="flex flex-col gap-2">
        {done ? null : (
          <div className="flex items-center gap-3">
            {/* The club's main button is the warm gradient, not the neon (§17). */}
            <Button
              variant="gradient"
              size="md"
              loading={busy}
              onClick={(e) => void onSend({}, e.currentTarget)}
              iconRight={<Glyph size={14}>✓</Glyph>}
            >
              {t(redo ? 'app.marathonProofRedo' : 'app.marathonProofDone')}
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
          void onSend({ valueNum: n }, e.currentTarget);
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
            variant="gradient"
            size="md"
            loading={busy}
            disabled={value.trim() === ''}
            iconRight={<Glyph size={14}>✓</Glyph>}
          >
            {t(redo ? 'app.marathonProofRedo' : 'common.done')}
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
          void onSend({ valueText: text.trim() }, e.currentTarget);
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
            variant="gradient"
            size="md"
            loading={busy}
            disabled={!text.trim()}
            iconRight={<Glyph size={14}>✓</Glyph>}
          >
            {t(redo ? 'app.marathonProofRedo' : 'common.done')}
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
        <AttachProof
          busy={busy}
          hasMedia={Boolean(mine?.mediaPath)}
          redo={redo}
          onPick={onSendMedia}
          primary
        />
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
  redo,
  onPick,
  primary = false,
}: {
  busy: boolean;
  hasMedia: boolean;
  /** The coach rejected what is attached, so «Заменить» is the wrong word for it. */
  redo: boolean;
  onPick: (file: File) => void;
  /** The attachment is the whole proof (a `media` task), not an optional extra. */
  primary?: boolean;
}) {
  const { t } = useT();
  const ref = useRef<HTMLInputElement>(null);
  const label = redo
    ? t('app.marathonProofRedoMedia')
    : primary
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
          variant={hasMedia && !redo ? 'secondary' : 'gradient'}
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

/** A heading with its last word in the club's warm gradient (`splitKeyWord`). */
function GradientKey({ text }: { text: string }) {
  const [lead, key] = splitKeyWord(text);
  return (
    <>
      {lead}
      <span className="text-gradient box-decoration-clone">{key}</span>
    </>
  );
}
