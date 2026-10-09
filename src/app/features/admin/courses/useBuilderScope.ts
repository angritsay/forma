/**
 * The builder's scope for the screen it is mounted as: `admin` from `/admin/courses…`, `creator`
 * from `/creator/courses…` (0065).
 *
 * `undefined` while the answer is not known, `null` when this person has no business here (not an
 * admin; not an open or paused creator), the scope otherwise. A creator's row is read once per
 * mount; the server checks it again on every write anyway.
 */
import { useEffect, useState } from 'react';
import { getMyCreator } from '@/lib/api/creators';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { ADMIN_SCOPE, creatorScope, type BuilderScope } from './builderScope';

export type BuilderMode = 'admin' | 'creator';

export function useBuilderScope(mode: BuilderMode): BuilderScope | null | undefined {
  const admin = useIsAdmin();
  const [creator, setCreator] = useState<BuilderScope | null | undefined>(undefined);

  useEffect(() => {
    if (mode !== 'creator') return;
    let alive = true;
    getMyCreator()
      .then((me) => alive && setCreator(creatorScope(me)))
      .catch(() => alive && setCreator(null));
    return () => {
      alive = false;
    };
  }, [mode]);

  if (mode === 'creator') return creator;
  if (admin === null) return undefined;
  return admin ? ADMIN_SCOPE : null;
}
