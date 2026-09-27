/**
 * `clubMemory` as a hook: the signed-in email from the session store, the memory read once per
 * account, and an `update` that writes through and refreshes the copy in the tree.
 *
 * The email is the namespace, so a sign-out and sign-in as somebody else on the same phone hands
 * that person their own seals and baselines. When the account changes mid-render the memory is
 * re-read on the spot rather than in an effect, so the first frame of the new account never
 * shows the old one's state.
 */
import { useCallback, useState } from 'react';
import { useSession } from '@/app/store/session';
import { readClubMemory, updateClubMemory, type ClubMemory } from './clubMemory';

export interface ClubMemoryHandle {
  memory: ClubMemory;
  update: (fn: (m: ClubMemory) => ClubMemory) => ClubMemory;
  email: string;
}

export function useClubMemory(): ClubMemoryHandle {
  const email = useSession((s) => s.user?.email || s.profile?.email || '');
  const [state, setState] = useState(() => ({ email, memory: readClubMemory(email) }));
  const memory = state.email === email ? state.memory : readClubMemory(email);
  const update = useCallback(
    (fn: (m: ClubMemory) => ClubMemory) => {
      const next = updateClubMemory(email, fn);
      setState({ email, memory: next });
      return next;
    },
    [email],
  );
  return { memory, update, email };
}
