import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { LanguageToggle } from '@/app/components/LanguageToggle';
import { useT } from '@/app/hooks/useT';

const ENV_VARS = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY'] as const;

export interface NotConfiguredScreenProps {
  /** Turns demo mode on and boots the app on the browser-local backend. */
  onOpenDemo: () => void;
}

/** Shown when the Supabase env is missing (docs/SPEC.md §8): explains what to set, RU/EN. */
export default function NotConfiguredScreen({ onOpenDemo }: NotConfiguredScreenProps) {
  const { t } = useT();
  return (
    <Screen
      header={<div className="flex h-14 items-center justify-end px-4">{<LanguageToggle />}</div>}
    >
      <div className="flex flex-col gap-6 py-6">
        <PageTitle
          eyebrow={t('common.brand')}
          title={t('app.errorNotConfiguredTitle')}
          subtitle={t('app.errorNotConfiguredBody')}
        />
        <Card level={2}>
          <ul className="flex flex-col gap-2 font-mono text-sm">
            {ENV_VARS.map((name) => (
              <li key={name} className="rounded-inner bg-bg px-3 py-2">
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </Card>
        <p className="text-sm text-muted">
          {t('app.errorNotConfiguredHint')} <code className="text-text">docs/SETUP.md</code>
        </p>

        <Card level={2} className="flex flex-col gap-3">
          <div>
            <p className="font-display text-xl">{t('app.demoOpenLead')}</p>
            <p className="mt-1 text-sm text-muted">{t('app.demoOpenBody')}</p>
          </div>
          <Button size="lg" fullWidth onClick={onOpenDemo}>
            {t('app.demoOpen')}
          </Button>
        </Card>
      </div>
    </Screen>
  );
}
