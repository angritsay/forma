/**
 * «Back», with somewhere to land when there is nothing to go back to.
 *
 * A screen opened straight from a link — a bot message, a bookmark, a reload of the tab — is the
 * first entry of the app's history, and `navigate(-1)` from there either does nothing or leaves
 * the app. React Router marks that first entry with the key `'default'`; any entry the app pushed
 * itself has a key of its own.
 */
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** Exported for the test: whether this entry was reached by navigating inside the app. */
export function hasInAppHistory(locationKey: string | undefined): boolean {
  return !!locationKey && locationKey !== 'default';
}

export function useBackOr(fallback = '/'): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return useCallback(() => {
    if (hasInAppHistory(key)) void navigate(-1);
    else void navigate(fallback, { replace: true });
  }, [key, navigate, fallback]);
}
