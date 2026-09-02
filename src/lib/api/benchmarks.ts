/**
 * Personal records from test / benchmark nodes (table `benchmarks`).
 */
import { supabase } from './client';
import { AppError } from './errors';
import { guard, requireUser, unwrap } from './internal';
import { benchmarkFromDb, groupBenchmarks, type DbBenchmark } from './mappers';
import type { BenchmarkRow, BenchmarkSeries } from './types';

const TABLE = 'benchmarks';
const KEY_RE = /^[a-z0-9_]{2,60}$/;

/** Append a record for a benchmark key (e.g. 'pushups_max', 'plank_sec'). */
export async function recordBenchmark(
  key: string,
  value: number,
  unit: string,
): Promise<BenchmarkRow> {
  return guard(async () => {
    if (!KEY_RE.test(key)) throw new AppError('validation', 'invalid_key');
    if (!Number.isFinite(value)) throw new AppError('validation', 'invalid_value');
    if (!unit.trim()) throw new AppError('validation', 'invalid_unit');
    const me = await requireUser();
    const row = unwrap<DbBenchmark>(
      await supabase()
        .from(TABLE)
        .insert({ user_id: me.id, key, value, unit: unit.trim() })
        .select('*')
        .single(),
    );
    return benchmarkFromDb(row);
  });
}

/** Every benchmark key with its latest record and history (most recent first). */
export async function listBenchmarks(): Promise<BenchmarkSeries[]> {
  return guard(async () => {
    const me = await requireUser();
    const rows = unwrap<DbBenchmark[]>(
      await supabase()
        .from(TABLE)
        .select('*')
        .eq('user_id', me.id)
        .order('recorded_at', { ascending: false })
        .limit(1000),
    );
    return groupBenchmarks(rows.map(benchmarkFromDb));
  });
}
