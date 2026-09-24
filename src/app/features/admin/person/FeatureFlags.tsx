/**
 * «Функции» on the person page: every known feature flag (`src/lib/flags.ts`) as a switch, for
 * this one address (0049).
 *
 * The flags are read with `admin_feature_flags` and written with `admin_set_feature_flag`, one at
 * a time; a switch is disabled while its own write is in flight. A failed write leaves the switch
 * where it was and says so in a toast. When the page is the admin's own, the app's flags are read
 * again after the write, so what the switch just did is visible on the tab it changes without a
 * restart.
 *
 * An address nobody has signed in with has no account to hang a flag on, so the switches wait for
 * that and say why.
 */
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { adminFlagsFor, adminSetFlag } from '@/lib/api/flags';
import { FLAG_LABEL, FLAGS, type Flag } from '@/lib/flags';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { useFlags } from '@/app/store/flags';
import { useSession } from '@/app/store/session';

export interface FeatureFlagsProps {
  email: string;
  /** Whether the address has an account (`admin_person().profile` is not null). */
  signedIn: boolean;
}

export function FeatureFlags({ email, signedIn }: FeatureFlagsProps) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const me = useSession((s) => s.profile?.email || s.user?.email || '');
  const [on, setOn] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<Flag | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  useEffect(() => {
    setOn(new Set());
    setLoaded(false);
    setLoadError(null);
    if (!signedIn) return;
    let alive = true;
    adminFlagsFor(email)
      .then((flags) => {
        if (!alive) return;
        setOn(new Set(flags));
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(e);
      });
    return () => {
      alive = false;
    };
  }, [email, signedIn]);

  if (!signedIn) {
    return <p className="text-[14px] text-muted-2">{t('app.personFeaturesNoUser')}</p>;
  }

  const toggle = async (flag: Flag, next: boolean) => {
    setBusy(flag);
    try {
      const state = await adminSetFlag(flag, email, next);
      setOn((prev) => {
        const copy = new Set(prev);
        if (state) copy.add(flag);
        else copy.delete(flag);
        return copy;
      });
      toast.show({
        kind: 'success',
        title: t(state ? 'app.personFeatureOn' : 'app.personFeatureOff', {
          name: t(FLAG_LABEL[flag]),
        }),
      });
      if (me && me.trim().toLowerCase() === email.trim().toLowerCase()) {
        await useFlags.getState().load();
      }
    } catch (e) {
      toast.show({
        kind: 'error',
        title: t('app.adminActionError'),
        description: adminErrorTitle(tr, e, 'common.errorGeneric'),
      });
    } finally {
      setBusy(null);
    }
  };

  if (loadError) {
    return (
      <p role="alert" className="text-[13px] text-danger">
        {t('app.personLoadError')} · {adminErrorTitle(tr, loadError, 'common.errorGeneric')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {FLAGS.map((flag) => (
        <li
          key={flag}
          className="flex items-center gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
        >
          <span className="min-w-0 flex-1 text-[15px] leading-tight text-text">
            {t(FLAG_LABEL[flag])}
          </span>
          <Switch
            checked={on.has(flag)}
            label={t(FLAG_LABEL[flag])}
            disabled={!loaded || busy !== null}
            onChange={(next) => void toggle(flag, next)}
          />
        </li>
      ))}
    </ul>
  );
}
