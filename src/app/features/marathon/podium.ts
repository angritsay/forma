/**
 * The week's top three as a podium (`ClubPodium.tsx`): 2 · 1 · 3 columns and, when the member is
 * not among them, their own line under it.
 *
 * Owner, on the shipped board preview: «Визуально мусорно… много текстов». The table under the
 * task was rows of text, and on an unscored week a sentence («Пока никто не набрал баллов»). A
 * podium is the same three rows drawn as heights, which is what the eye reads a ranking as
 * before it reads a name.
 *
 * Pure. The places come from `weekStandings` (`standings.ts`), which already shares a place
 * between equal points and leaves an unscored entry without one; this only lays the three out
 * in podium order and collects what the member's own line says: the place, the points, the move
 * since last visit (`boardDelta`) and who is in reach (`boardGap`).
 */
import type { BoardGap, RankedRow, Standings } from './standings';

export interface PodiumColumn {
  /** 1, 2 or 3 — the podium step, not the shared place (`rank` carries that). */
  step: 1 | 2 | 3;
  row: RankedRow['row'];
  rank: number;
}

export interface PodiumMe {
  /** Null for an entry on nothing — no place, so the line draws a dash. */
  rank: number | null;
  points: number;
  /** Places gained since the last visit; null when there is nothing to compare. */
  delta: number | null;
  gap: BoardGap;
}

export interface Podium {
  /** Drawn left to right: second, first, third. Null where the week has no such row yet. */
  columns: [PodiumColumn | null, PodiumColumn | null, PodiumColumn | null];
  /** The member's own line, only when they are not one of the three columns. */
  me: PodiumMe | null;
}

export interface PodiumExtras {
  delta?: number | null;
  gap?: BoardGap;
}

export function podiumOf(standings: Standings, extras: PodiumExtras = {}): Podium {
  const column = (i: number, step: 1 | 2 | 3): PodiumColumn | null => {
    const r = standings.top[i];
    return r && r.rank !== null ? { step, row: r.row, rank: r.rank } : null;
  };
  const me: PodiumMe | null = standings.mine
    ? {
        rank: standings.mine.rank,
        points: standings.mine.row.points,
        delta: extras.delta ?? null,
        gap: extras.gap ?? null,
      }
    : null;
  return { columns: [column(1, 2), column(0, 1), column(2, 3)], me };
}

/** Words that must not be left dangling before an ellipsis. */
const DANGLING = new Set([
  ...['и', 'с', 'а', 'в', 'к', 'о', 'у', 'на', 'за', 'по', 'от', 'до', 'из', 'для'],
  ...['and', 'with', 'for', 'of', 'to', 'in', 'a', 'an', 'the'],
]);

/**
 * The prize as the podium's caption: «Час с тренером и создателем Forma» is a sentence, and the
 * caption («Приз недели — …») holds a label. Cut at « — » when the coach wrote a dash, then at a
 * word boundary inside `max` characters with an ellipsis, never leaving a conjunction hanging at
 * the end.
 */
export function shortPrize(prize: string, max = 24): string {
  const text = prize.trim();
  if (text.length <= max) return text;
  const dash = text.split(' — ')[0]!.trim();
  if (dash.length <= max) return dash;
  const words = dash.split(/\s+/);
  const kept: string[] = [];
  for (const w of words) {
    const next = [...kept, w].join(' ');
    if (next.length + 1 > max) break;
    kept.push(w);
  }
  while (kept.length > 1 && DANGLING.has(kept[kept.length - 1]!.toLowerCase())) kept.pop();
  if (kept.length === 0) return `${dash.slice(0, max - 1)}…`;
  return `${kept.join(' ')}…`;
}
