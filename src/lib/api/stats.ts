/**
 * Aggregates for the home screen (RPC `get_my_totals`, security invoker).
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap } from './internal';
import { totalsFromDb, type DbTotals } from './mappers';
import { isDemo } from './mode';
import type { MyTotals } from './types';

/** All-time points (workouts + steps), completed workouts and minutes for the current user. */
export async function getMyTotals(): Promise<MyTotals> {
  if (isDemo()) return (await demo()).getMyTotals();
  return guard(async () => {
    await requireUser();
    const row = unwrap<DbTotals>(await supabase().rpc('get_my_totals').single());
    return totalsFromDb(row);
  });
}
