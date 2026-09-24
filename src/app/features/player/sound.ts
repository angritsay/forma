/**
 * Звуки приложения: обратный отсчёт, переход к следующему упражнению, конец тренировки, награда.
 *
 * ## Почему они синтезируются, а не лежат файлами
 *
 * Ни одного мегабайта на восемь коротких сигналов. Мини-апп открывается внутри телеграма, часто с
 * телефона на слабой связи, и звук, который не успел загрузиться, — это звук, которого нет ровно в
 * тот момент, ради которого он существует. WebAudio собирает их из двух осцилляторов за
 * микросекунды и работает офлайн.
 *
 * ## Из чего сделан тон
 *
 * Чистая синусоида звучит как микроволновка. Каждая нота здесь — это синус плюс тихая октава
 * сверху (`OVERTONE`), быстрая атака и экспоненциальный спад: получается короткий тёплый удар,
 * похожий на деревянный колокольчик, а не на будильник.
 *
 * ## Громкость — часть смысла
 *
 * Тик отсчёта звучит десятки раз за тренировку, поздравление — один. Поэтому у каждой ноты своя
 * громкость, и самый частый звук — самый тихий. Звук, который надоел, выключают целиком, и тогда
 * пропадает и тот единственный, ради которого всё затевалось.
 *
 * Выключатель лежит в localStorage под `forma.sound` и вынесен в аккаунт (ProfileSheet).
 * AudioContext создаётся лениво, внутри жеста (`unlockAudio`), — иначе браузер его не пустит.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SOUND_STORAGE_KEY = 'forma.sound';

/**
 * Что именно объявляется. Порядок — от самого частого к самому редкому.
 *
 * * `tick` / `tickLast` — обратный отсчёт. Последняя секунда выше остальных: три одинаковых писка
 *   говорят «идёт время», а поднимающийся ряд — «сейчас», и это разные сообщения.
 * * `next` — переход к следующему упражнению, чем бы он ни был вызван: вышло время, нажали
 *   «Готово», пропустили шаг. **Один переход — один звук**, поэтому шаги, которые сами
 *   переключаются, на нуле молчат (см. `useCountdownCues`).
 * * `go` — начало отсчёта в тесте.
 * * `round` — круг засчитан.
 * * `end` — время вышло там, где после этого никуда не переходят: AMRAP и потолок «на время».
 * * `finish` — тренировка закончена.
 * * `award` — открылось достижение.
 * * `horn` — конец замера в тесте.
 */
export type Cue =
  'tick' | 'tickLast' | 'next' | 'go' | 'round' | 'end' | 'finish' | 'award' | 'horn';

interface SoundState {
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      muted: false,
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    {
      name: SOUND_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ muted: s.muted }),
    },
  ),
);

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let unavailable = false;

/**
 * The one AudioContext of the app, created on first use — or null where there is none (SSR, a
 * browser without WebAudio, a construction that threw).
 *
 * Exported for `voice.ts`: the spoken names go through the same context as the cues, so the
 * gesture that unlocked one has unlocked the other. Everything else should still say `playCue`.
 */
export function getAudioContext(): AudioContext | null {
  if (context) return context;
  if (unavailable || typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) {
    unavailable = true;
    return null;
  }
  try {
    context = new Ctor();
  } catch {
    unavailable = true;
    return null;
  }
  return context;
}

function resume(c: AudioContext): void {
  if (c.state === 'suspended') void c.resume().catch(() => undefined);
}

/** The mute switch, read synchronously — for code that runs outside React (`voice.ts`). */
export function isSoundMuted(): boolean {
  return useSoundStore.getState().muted;
}

/** Create / resume the audio context. Call from a pointer or key handler. */
export function unlockAudio(): void {
  if (isSoundMuted()) return;
  const c = getAudioContext();
  if (c) resume(c);
}

export interface Note {
  hz: number;
  ms: number;
  /**
   * Пиковая громкость, 0…1. По умолчанию `DEFAULT_GAIN`. Тише — для того, что звучит часто.
   */
  gain?: number;
  /**
   * Сдвиг от начала сигнала, мс. Без него нота встаёт сразу за предыдущей — это годится для
   * раздельных щелчков, но не для арпеджио, где ноты должны наезжать друг на друга и звенеть.
   */
  at?: number;
}

const DEFAULT_GAIN = 0.22;

/** Тихая октава сверху: из-за неё тон читается как удар по дереву, а не как писк. */
const OVERTONE = 0.18;

/**
 * Ноты в герцах — чтобы читалось, что именно играет.
 *
 * Всё в пентатонике от до: любые две ноты отсюда звучат вместе, так что наложившиеся сигналы
 * (конец тренировки и следом награда) не дают диссонанса.
 */
const C5 = 523;
const E5 = 659;
const G5 = 784;
const A5 = 880;
const C6 = 1047;
const D6 = 1175;
const E6 = 1319;
const G6 = 1568;

export const CUES: Record<Cue, readonly Note[]> = {
  /*
   * Самый частый звук в продукте, поэтому самый тихий. Последняя секунда выше и чуть громче —
   * поднимающийся ряд слышно как приближение, три одинаковых писка слышно как фон.
   */
  tick: [{ hz: E5, ms: 70, gain: 0.13 }],
  tickLast: [{ hz: A5, ms: 90, gain: 0.19 }],

  /*
   * Переход к следующему упражнению. Играет десятки раз за тренировку — и это весь бюджет его
   * громкости: короче и тише, чем `end`, с которым они родственники, но не близнецы.
   *
   * Две ноты, а не одна: одиночный тон на слух не отличается от тика отсчёта, который только что
   * отзвучал, а переход — это другое сообщение. Восходящая пара читается как «дальше».
   */
  next: [
    { hz: G5, ms: 60, gain: 0.16 },
    { hz: C6, ms: 110, gain: 0.17, at: 58 },
  ],

  go: [{ hz: A5, ms: 120 }],
  round: [
    { hz: G5, ms: 80 },
    { hz: 988, ms: 120 },
  ],
  end: [
    { hz: A5, ms: 120 },
    { hz: D6, ms: 240 },
  ],

  /*
   * Тренировка закончена — единственный сигнал, которому позволено занимать полсекунды.
   *
   * Арпеджио до-ми-соль-до с наложением: каждая нота начинается раньше, чем затихла предыдущая,
   * поэтому получается аккорд, который разворачивается, а не четыре отдельных щелчка. Звучит один
   * раз за тренировку, ради этого раза всё и делалось.
   */
  finish: [
    { hz: C5, ms: 150, gain: 0.2, at: 0 },
    { hz: E5, ms: 150, gain: 0.2, at: 95 },
    { hz: G5, ms: 170, gain: 0.21, at: 190 },
    { hz: C6, ms: 420, gain: 0.23, at: 285 },
  ],

  /*
   * Награда. Короткая искра вверх поверх тихой опоры снизу — опора звучит всё время, пока
   * взлетают три верхние ноты, поэтому это один жест, а не три тика.
   *
   * Короче, чем конец тренировки, и намеренно: достижений за сессию может открыться несколько,
   * но звучит только сам факт — приложение поздравляет один раз, а не столько раз, сколько
   * значков.
   */
  award: [
    { hz: G5, ms: 300, gain: 0.09, at: 0 },
    { hz: C6, ms: 90, gain: 0.18, at: 0 },
    { hz: E6, ms: 90, gain: 0.18, at: 60 },
    { hz: G6, ms: 220, gain: 0.2, at: 120 },
  ],

  /*
   * The end of a measured effort, and the one cue that is allowed to be loud.
   *
   * `end` marks the end of a step inside a workout, where a bright two-note figure is right: the
   * next thing starts in a moment. The assessment's window closes on a number the athlete has to
   * remember, and it closes with their eyes on the floor — so this one is a single long low tone,
   * the gym's own sound, rather than a chime that could be mistaken for the 3-2-1 ticks leading
   * into it.
   */
  horn: [{ hz: 392, ms: 900, gain: 0.26 }],
};

/**
 * Какой тик играть на этой секунде обратного отсчёта, и играть ли вообще.
 *
 * Отдельной функцией, потому что это правило, а не реализация: «последние три секунды, и
 * последняя из них — другим звуком». Проверяется тестом; хук только вызывает.
 */
export function countdownCue(remainingSec: number): Cue | null {
  if (remainingSec === 1) return 'tickLast';
  if (remainingSec === 2 || remainingSec === 3) return 'tick';
  return null;
}

/** Длительность сигнала целиком, мс — от начала первой ноты до конца последней. */
export function cueDurationMs(cue: Cue): number {
  let end = 0;
  let cursor = 0;
  for (const note of CUES[cue]) {
    const start = note.at ?? cursor;
    end = Math.max(end, start + note.ms);
    cursor = start + note.ms + 40;
  }
  return end;
}

/** Play a cue unless muted or audio is unavailable. Never throws. */
export function playCue(cue: Cue): void {
  if (isSoundMuted()) return;
  const c = getAudioContext();
  if (!c) return;
  resume(c);
  try {
    const origin = c.currentTime + 0.01;
    // Без `at` нота встаёт за предыдущей с зазором в 40 мс — так звучали все сигналы до появления
    // арпеджио, и для двух коротких щелчков это по-прежнему верно.
    let cursor = 0;
    for (const note of CUES[cue]) {
      const start = note.at ?? cursor;
      cursor = start + note.ms + 40;
      const at = origin + start / 1000;
      const dur = note.ms / 1000;
      const peak = note.gain ?? DEFAULT_GAIN;
      for (const [hz, level] of [
        [note.hz, peak],
        [note.hz * 2, peak * OVERTONE],
      ] as const) {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(level, at + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        osc.connect(gain).connect(c.destination);
        osc.start(at);
        osc.stop(at + dur + 0.02);
      }
    }
  } catch {
    /* A closed context or an odd browser: silence is fine. */
  }
}

export interface Sound {
  muted: boolean;
  toggle: () => void;
  beep: (cue: Cue) => void;
  unlock: () => void;
}

export function useSound(): Sound {
  const muted = useSoundStore((s) => s.muted);
  const toggleMuted = useSoundStore((s) => s.toggleMuted);
  return {
    muted,
    toggle: () => {
      toggleMuted();
      unlockAudio();
    },
    beep: playCue,
    unlock: unlockAudio,
  };
}
