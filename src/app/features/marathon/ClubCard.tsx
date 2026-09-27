/**
 * The task of the day as a playing card: two faces and a real turn between them.
 *
 * Owner, on the shipped screen (#230): «Визуально мусорно и не структурировано и много текстов,
 * нет элемента игры». Her choices for the replacement: a card game; the title and two clamped
 * lines of task text; one control. So the task is dealt face down every morning and turned by
 * a tap — the same seal `taskSeal.ts` decides and `clubMemory` remembers, drawn as a card
 * instead of an envelope.
 *
 * **The back** (sealed): «Задание дня» as the eyebrow, the points as one big numeral in the
 * warm gradient («+12» — 64px, large type, which is what the gradient on the club may be), and
 * «Открыть». The whole back is one button: the gesture is «what is it today?», not «find the
 * control».
 *
 * **The face:** the eyebrow row — «Задание дня · до 22:00» left (the hour from the task's own
 * `due_time`, left out when it has none), the points as a `sky` pill right — then the title in
 * the display face with its last word in the gradient, the coach's text clamped to two lines
 * with «ещё» (a sheet: the whole text, his picture, the attach link), and **one control**:
 * «Готово ✓» on the gradient for `done`, a number field + «Готово» for `number`, a text field +
 * «Готово» for `text`, «Фото или видео» for `media`. Beside the control a camera icon attaches a
 * photo or a clip to any kind — the owner's «при клике на кнопку выполнить задание должна быть
 * возможность прикрепить видео или фото доказательства» — and stays after the proof is sent,
 * because the tap on «Готово» and the evidence for it are two different moments.
 *
 * **Done:** the type steps back (`opacity-80`), a ✓ lands in a white circle where the pill was
 * (`pop-in`), the control gives way to «Поделиться» (`ClubShare`, handed in by the screen) and,
 * when the coach rejected the proof, to his note (`CoachNote`) over the control that sends it
 * again. A finished task does not disappear: the day should still read as a day.
 *
 * **The pair** (`duo`, duo mode only): `DuoRow` — two small avatars with today's marks, the
 * rule as numbers, «Напомнить», «···» — sits on the face between the title block and the
 * control, under a hairline. The owner asked for the duo block inside the task card rather
 * than as a tile under it: the pair's rule is a fact about *this* task. The back does not show
 * it (the back is «+15» and «Открыть» and nothing else).
 *
 * **Rest day** (`item` null): the face reads «Отдых» and «Новое — утром», and still carries the
 * duo row — people look at their partner on rest days too. No back — there is nothing to open.
 *
 * **The turn has no third dimension.** It was a `rotateY` in a `perspective` scene, two glass
 * faces stacked with `backface-visibility: hidden` — and on the owner's iPhone the card rendered
 * as an empty glass rectangle: no eyebrow, no «+15», no control. WebKit flattens a `preserve-3d`
 * scene when a descendant establishes its own compositing context, and each face is
 * `backdrop-filter` glass; flattened, `backface-visibility` means nothing, and Safari stopped
 * painting either face (the trap `FlipCard.tsx` documents; the delayed-`visibility` belt on top
 * did not save it). So the card renders **exactly one face at a time** — `open ? face : back` —
 * and the turn is a squeeze on the X axis: the back plays `.club-turn-out` (`scaleX(1→0)`,
 * 150ms), on `animationend` (or a timeout of the same length, should the event not come) the
 * state switches, and the face mounts with `.club-turn-in` (`scaleX(0→1)`, 250ms on the
 * spring). Under reduced motion the keyframes are off and the switch is immediate; the screen
 * never seals the card there anyway (taskSeal.ts).
 *
 * `onSend` and `onSendMedia` receive the element that was pressed, so the screen can start the
 * celebration (`ClubCelebrate`) from where the finger was.
 */
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Pill } from '@/components/ui/Pill';
import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import { isRejected, needsCoachLook } from '@/lib/marathon/review';
import type { MarathonTodayTask, ProofInput } from '@/lib/api/types';
import { splitKeyWord } from '@/lib/ui/keyWord';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { useT } from '@/app/hooks/useT';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';

type Proof = Omit<ProofInput, 'taskId' | 'memberId'>;

export interface ClubCardProps {
  /** Today's task; null on a rest day. */
  item: MarathonTodayTask | null;
  /** The round has closed; proof can still be sent, but the card says it will not score. */
  closed?: boolean;
  /** The card is still face down (`isSealed`). A tap turns it and calls `onOpen`. */
  sealed?: boolean;
  onOpen?: () => void;
  onSend?: (proof: Proof, anchor?: HTMLElement | null) => Promise<void>;
  /**
   * Uploads the file to the private `proofs` bucket and sends its path.
   *
   * `keep` is whatever the proof already carries. `sendProof` upserts the whole row, so attaching
   * a photo to a task that was delivered with a number would otherwise null the number out — the
   * attachment has to re-send the answer it is being attached to.
   */
  onSendMedia?: (file: File, keep: Proof, anchor?: HTMLElement | null) => Promise<void>;
  /** «Поделиться» (`ClubShare`), drawn once the proof is in. */
  share?: ReactNode;
  /** The pair's row (`DuoRow`), on the face only — under the title block, over the control. */
  duo?: ReactNode;
}

/** How long the back takes to narrow to a line (`.club-turn-out`, global.css). */
const TURN_OUT_MS = 150;

/** «22:00:00» → «22:00». Anything that is not HH:MM(:SS) is left out rather than mangled. */
export function shortTime(due: string | null | undefined): string | null {
  if (!due) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(due.trim());
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : null;
}

/*
 * The card's proportion: ~4:5 on a phone, so it is an object and not a strip; from `md` it sits
 * beside the podium and takes its own height with a floor. Whichever face is rendered wears the
 * frame, so the card keeps its size across the turn.
 */
const FRAME = 'aspect-[4/5] md:aspect-auto md:min-h-[440px]';
/* The 1px warm rim and the glass inside it — the club's material (design/CHANGELOG.md §17). */
const RIM = 'bg-warm p-px rounded-card';
const GLASS = 'glass-card rounded-[calc(var(--r-card)-1px)] border-0';

/** The pair's row under its hairline, or nothing. */
function DuoSlot({ duo }: { duo: ReactNode }) {
  if (!duo) return null;
  return <div className="border-t border-border pt-3">{duo}</div>;
}

export function ClubCard({
  item,
  closed = false,
  sealed = false,
  onOpen,
  onSend,
  onSendMedia,
  share,
  duo,
}: ClubCardProps) {
  const { t, locale } = useT();
  const task = item?.task ?? null;
  const mine = item?.mine ?? null;
  const [text, setText] = useState(mine?.valueText ?? '');
  const [value, setValue] = useState(mine?.valueNum === null ? '' : String(mine?.valueNum ?? ''));
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  /* Face up. Starts as the seal says; once turned it never turns back this visit. */
  const [open, setOpen] = useState(!sealed);
  /* The back is narrowing (`.club-turn-out`); the face is not mounted yet. */
  const [turning, setTurning] = useState(false);
  /* The face was reached by a turn, so it mounts with `.club-turn-in` — not when it loads open. */
  const [turned, setTurned] = useState(false);
  const faceRef = useRef<HTMLElement>(null);
  const media = useMediaUrl(task?.mediaUrl ?? undefined);

  /* The seal lifted from outside (proof sent, the memory updated) — but not while the back is
     mid-turn: `onOpen` marks the task opened on the tap, which unseals it on the same tick, and
     the face has to wait for the back to finish narrowing. */
  useEffect(() => {
    if (!sealed && !turning) setOpen(true);
  }, [sealed, turning]);

  /* The second step of the turn: the back is gone, the face comes. Idempotent. */
  const reveal = useCallback(() => {
    setTurning(false);
    setTurned(true);
    setOpen(true);
  }, []);

  const turn = () => {
    if (open || turning) return;
    onOpen?.();
    if (prefersReducedMotion()) {
      setOpen(true);
      return;
    }
    setTurning(true);
  };

  /* Should `animationend` never fire (an animation cancelled, a tab in the background), the
     timeout switches faces at the moment the animation would have ended. */
  useEffect(() => {
    if (!turning) return;
    const id = window.setTimeout(reveal, TURN_OUT_MS);
    return () => window.clearTimeout(id);
  }, [turning, reveal]);

  if (!task || !item) {
    return (
      <div className={clsx(RIM, FRAME, 'flex')}>
        <div className={clsx(GLASS, 'flex flex-1 flex-col gap-3 p-5')}>
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <span className="display text-[28px] leading-none">{t('app.clubRestTitle')}</span>
            <span className="text-[13px] text-muted">{t('app.clubRestBody')}</span>
          </div>
          <DuoSlot duo={duo} />
        </div>
      </div>
    );
  }

  const done = Boolean(mine && !mine.voidedAt);
  /* The coach rejected this attempt: it is not scoring, and the task is open again. */
  const rejected = Boolean(mine && isRejected(mine));
  /* Sent again since, and he has not been back to it. */
  const waiting = Boolean(mine && needsCoachLook(mine));
  const scores = task.rule !== 'none';
  const points = `+${formatNumber(locale, task.points)}`;
  const due = shortTime(task.dueTime);
  const title = (locale === 'en' && task.titleEn) || task.title;
  const body = (locale === 'en' && task.bodyEn) || task.body || '';

  const send = async (proof: Proof, anchor?: HTMLElement) => {
    if (!onSend) return;
    setBusy(true);
    try {
      await onSend(proof, anchor ?? faceRef.current);
    } finally {
      setBusy(false);
    }
  };

  /*
   * Attaching re-sends whatever the proof already says, because the upsert writes the whole row:
   * a photo added to «Прогулка полчаса · 34 мин» must not turn the 34 into null.
   */
  const sendMedia = async (file: File) => {
    if (!onSendMedia) return;
    setBusy(true);
    try {
      await onSendMedia(
        file,
        {
          ...(mine?.valueText != null ? { valueText: mine.valueText } : {}),
          ...(mine?.valueNum != null ? { valueNum: mine.valueNum } : {}),
        },
        faceRef.current,
      );
    } finally {
      setBusy(false);
    }
  };

  const attach = (mode: 'icon' | 'primary' | 'link') => (
    <AttachProof
      mode={mode}
      busy={busy}
      hasMedia={Boolean(mine?.mediaPath)}
      redo={rejected}
      onPick={sendMedia}
    />
  );

  return (
    <>
      {!open ? (
        /* The back: one button, the whole card. */
        <button
          type="button"
          onClick={turn}
          onAnimationEnd={(e) => {
            if (e.animationName === 'club-turn-out') reveal();
          }}
          aria-label={`${t('app.clubCardEyebrow')} — ${t('app.clubCardOpen')}`}
          className={clsx(RIM, FRAME, 'flex w-full text-left', turning && 'club-turn-out')}
        >
          <span
            className={clsx(GLASS, 'flex flex-1 flex-col items-center justify-center gap-4 p-5')}
          >
            <span className="eyebrow">{t('app.clubCardEyebrow')}</span>
            {scores ? (
              <span className="numeral text-gradient text-[64px] leading-none">{points}</span>
            ) : (
              <span className="display text-gradient text-[40px] leading-none">
                {t('app.clubStorySticker')}
              </span>
            )}
            <span className="control-label mt-2 flex items-center gap-2 text-[14px] text-muted">
              {t('app.clubCardOpen')}
              <Glyph size={12}>→</Glyph>
            </span>
          </span>
        </button>
      ) : (
        /* The face. */
        <article
          ref={faceRef}
          className={clsx(RIM, FRAME, 'flex', turned && 'club-turn-in')}
          aria-busy={busy}
        >
          <div
            className={clsx(
              GLASS,
              'relative flex flex-1 flex-col gap-3 overflow-y-auto p-5',
              done && 'md:min-h-0',
            )}
          >
            {done ? (
              /*
               * The check, landing where the points pill was. Keyed on nothing: the card is
               * rendered done from the moment the proof is in, so the circle mounts exactly once —
               * when the day loads finished, or when the proof arrives — and pops both times.
               */
              <span
                className="pop-in absolute top-4 right-4 flex size-14 items-center justify-center rounded-pill bg-paper text-ink"
                role="img"
                aria-label={t('app.marathonProofSent')}
              >
                <Glyph size={22}>✓</Glyph>
              </span>
            ) : null}

            <div className={clsx('flex flex-col gap-3', done && 'opacity-80')}>
              <div className="flex min-h-8 items-center justify-between gap-3">
                <span className="eyebrow min-w-0 truncate">
                  {t('app.clubCardEyebrow')}
                  {due ? ` · ${t('app.clubDueAt', { time: due })}` : null}
                </span>
                {scores && !done ? <Pill tone="sky">{points}</Pill> : null}
              </div>

              {/* 24–28px: large type, which is what the gradient on the club may be. */}
              <h3 className="display text-[26px] leading-[1.15] text-balance">
                <GradientKey text={title} />
              </h3>

              {body ? (
                <p className="line-clamp-2 text-[14px] leading-snug text-muted">{body}</p>
              ) : null}
              {body || media ? (
                <button
                  type="button"
                  onClick={() => setMore(true)}
                  aria-haspopup="dialog"
                  className="tap-target-y flex items-center gap-1 self-start text-[13px] text-accent"
                >
                  {t('app.clubCardMore')}
                  <Glyph size={11}>→</Glyph>
                </button>
              ) : null}
            </div>

            {rejected && mine?.voidReason ? <CoachNote reason={mine.voidReason} /> : null}
            {waiting ? (
              <p className="text-[13px] text-muted-2">{t('app.marathonProofResent')}</p>
            ) : null}

            {/* The pair, under its hairline: this task's rule is a fact about the two of us. */}
            <DuoSlot duo={duo} />

            {/* The one control, at the foot of the card. */}
            <div className="mt-auto flex flex-col gap-2 pt-2">
              {closed && !done ? (
                <span className="text-[13px] text-muted-2">{t('app.marathonDeadlinePassed')}</span>
              ) : null}
              {done ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="-ml-4.5">{share}</div>
                  {task.proofKind === 'media' ? null : attach('icon')}
                </div>
              ) : task.proofKind === 'done' ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="gradient"
                    size="lg"
                    fullWidth
                    loading={busy}
                    onClick={(e) => void send({}, e.currentTarget)}
                    iconRight={<Glyph size={14}>✓</Glyph>}
                  >
                    {t(rejected ? 'app.marathonProofRedo' : 'common.done')}
                  </Button>
                  {attach('icon')}
                </div>
              ) : task.proofKind === 'number' ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(value);
                    if (!Number.isFinite(n) || n < 0) return;
                    void send({ valueNum: n }, e.currentTarget);
                  }}
                >
                  {/*
                   * The target is the field's placeholder — it is what the number is measured
                   * against — and the unit is the field's trailing word: «10 000 | шагов».
                   */}
                  <Input
                    aria-label={t('app.marathonProofNumberLabel')}
                    placeholder={
                      task.targetNum !== null ? formatNumber(locale, task.targetNum) : ''
                    }
                    inputMode="numeric"
                    value={value}
                    trailing={
                      task.unit ? <span className="text-[13px] text-muted">{task.unit}</span> : null
                    }
                    onChange={(e) => setValue(e.target.value)}
                    wrapperClassName="min-w-0 flex-1"
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    loading={busy}
                    disabled={value.trim() === ''}
                  >
                    {t(rejected ? 'app.marathonProofRedo' : 'common.done')}
                  </Button>
                  {attach('icon')}
                </form>
              ) : task.proofKind === 'text' ? (
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!text.trim()) return;
                    void send({ valueText: text.trim() }, e.currentTarget);
                  }}
                >
                  <Input
                    aria-label={t('app.marathonProofTextLabel')}
                    placeholder={t('app.marathonProofTextLabel')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    wrapperClassName="min-w-0 flex-1"
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    loading={busy}
                    disabled={!text.trim()}
                  >
                    {t(rejected ? 'app.marathonProofRedo' : 'common.done')}
                  </Button>
                  {attach('icon')}
                </form>
              ) : (
                /* media — the attachment is the proof, so it is the one control. */
                attach('primary')
              )}
            </div>
          </div>
        </article>
      )}

      {/* «ещё»: the whole of the coach's text, his picture, and the attach link. */}
      <Sheet open={more} onClose={() => setMore(false)} title={title}>
        <div className="flex flex-col gap-4">
          {media ? (
            /* `alt=""`: the task is named in the sheet's title; a description of a photograph of
               a plank before the words is noise. */
            <img
              src={media}
              alt=""
              className="aspect-[16/9] w-full rounded-tile bg-surface-2 object-cover"
            />
          ) : null}
          {body ? <p className="text-[15px] leading-relaxed text-text">{body}</p> : null}
          <div className="flex flex-col gap-1">
            {attach('link')}
            <span className="text-[13px] text-muted-2">{t('app.marathonProofCoachOnly')}</span>
          </div>
        </div>
      </Sheet>
    </>
  );
}

/**
 * What the coach said about this proof — his words, in his voice, not an error state.
 *
 * A card with him at the top of it and a way out underneath: the rejection is one round of a
 * conversation — «дальше пользователь может выполнить это задание заново, и флоу будет
 * аналогичен» — and the control below this block is open for exactly that. Deliberately not
 * `--danger`: nothing has gone wrong; the coach watched the clip and wants another one.
 */
function CoachNote({ reason }: { reason: string }) {
  const { t } = useT();
  return (
    <Card level={2} padding="sm" className="flex flex-col gap-1.5">
      <span className="eyebrow">{t('app.marathonProofCoachNote')}</span>
      <p className="text-[15px] leading-snug text-text">{reason}</p>
      <span className="text-[13px] text-muted-2">{t('app.marathonProofRejectedHint')}</span>
    </Card>
  );
}

/**
 * Pick a photo or a clip — as the one control of a `media` task (`primary`), as the camera
 * beside any other control (`icon`), or as the link in the «ещё» sheet (`link`).
 *
 * A browser cannot re-encode video, so a clip is uploaded as picked and refused above a size the
 * screen states (`MAX_VIDEO_BYTES`); a photograph is shrunk first. `capture` is deliberately
 * **not** set: half of these proofs are a shot taken twenty minutes ago, and a picker that refuses
 * the camera roll loses them.
 */
function AttachProof({
  mode,
  busy,
  hasMedia,
  redo,
  onPick,
}: {
  mode: 'icon' | 'primary' | 'link';
  busy: boolean;
  hasMedia: boolean;
  /** The coach rejected what is attached, so «Заменить» is the wrong word for it. */
  redo: boolean;
  onPick: (file: File) => void;
}) {
  const { t } = useT();
  const ref = useRef<HTMLInputElement>(null);
  const label = redo
    ? t('app.marathonProofRedoMedia')
    : mode === 'primary'
      ? hasMedia
        ? t('app.marathonProofPhotoAgain')
        : t('app.clubCardPhoto')
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
      {mode === 'primary' ? (
        <Button
          size="lg"
          fullWidth
          variant={hasMedia && !redo ? 'secondary' : 'gradient'}
          loading={busy}
          onClick={() => ref.current?.click()}
        >
          {label}
        </Button>
      ) : mode === 'icon' ? (
        <IconButton
          label={label}
          icon="camera"
          variant="surface"
          size="md"
          className="h-12 w-12 shrink-0"
          disabled={busy}
          onClick={() => ref.current?.click()}
        />
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 self-start text-[14px] text-text underline underline-offset-4 disabled:opacity-60"
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
