/**
 * Что из теста уже сдано, движение за движением.
 *
 * Владелец: «мы показываем: планка ту ду, отжимания: 10 (если пользователь уже отметил
 * выполнение), выполнить заново нельзя после сохранения результата».
 *
 * ## Почему это отдельный модуль, а не пара строк на экране
 *
 * Пять движений сохраняются **в два разных места**, и это не случайность: приседания, отжимания и
 * планка кормят индекс формы и потому живут в `trainingProfile.tests`; пресс и выпады индекс не
 * читает, и они уходят в `benchmarks` — туда же, куда попадёт любой следующий замер того же
 * движения. Экрану всё равно, откуда что: ему нужна одна строчка на движение. Сводить два
 * источника в одну таблицу — это работа, и ей место здесь, с тестами, а не в разметке.
 *
 * ## «Ту ду» — это отсутствие числа, а не ноль
 *
 * Ноль — законный результат: столько отжиманий и бывает, и записать его надо. Поэтому «не сдано»
 * различается по `undefined`, и ни одна проверка здесь не смотрит на правдивость числа.
 */
import type { BenchmarkSeries } from '@/lib/api/types';
import type { UserTrainingProfile } from '@/lib/training/types';
import { ASSESSMENT_MOVES, type AssessmentMove } from '@content/site/assessment';

export interface RecordedMove {
  move: AssessmentMove;
  /** Сданное значение, или `undefined` — ещё не сдавали. */
  value: number | undefined;
  /** Отжимания с колен считаются по другой таблице, и в строке это видно. */
  onKnees: boolean;
}

/**
 * Пять строк для экрана: движение и то, что по нему записано.
 *
 * Порядок — из `ASSESSMENT_MOVES`, то есть тот же, в котором тест и проходят: строка «03» в
 * списке и третий вопрос в прогоне должны быть одним движением.
 */
export function recordedMoves(
  profile: UserTrainingProfile | null | undefined,
  benchmarks: readonly BenchmarkSeries[],
): RecordedMove[] {
  const tests = profile?.tests;
  const latest = new Map(benchmarks.map((b) => [b.key, b.latest.value]));

  return ASSESSMENT_MOVES.map((move) => {
    const value = move.maps
      ? testValue(tests, move.maps)
      : move.benchmarkKey
        ? latest.get(move.benchmarkKey)
        : undefined;
    return {
      move,
      value,
      onKnees: move.maps === 'pushups' && tests?.pushupsOnKnees === true,
    };
  });
}

/** Значение из профиля по имени поля, которое назвал `content/site/assessment.ts`. */
function testValue(
  tests: UserTrainingProfile['tests'] | undefined,
  maps: NonNullable<AssessmentMove['maps']>,
): number | undefined {
  if (!tests) return undefined;
  switch (maps) {
    case 'pushups':
      return tests.pushups;
    case 'squats60s':
      return tests.squats60s;
    case 'plankSec':
      return tests.plankSec;
  }
}

/**
 * Сдан ли тест целиком.
 *
 * Все пять, а не «хоть что-то»: индекс формы считается по набору, и половина набора — это не
 * результат, который можно показать и запретить переделывать. Пока пройдено не всё, тест
 * предлагается пройти.
 */
export function assessmentDone(rows: readonly RecordedMove[]): boolean {
  return rows.length > 0 && rows.every((r) => r.value !== undefined);
}
