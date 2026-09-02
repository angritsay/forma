import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/app/hooks/useT';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <EmptyState
        icon="warning"
        title={t('app.errorTitle')}
        description={t('app.errorBody')}
        action={
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={() => window.location.reload()}>
              {t('app.errorReload')}
            </Button>
            <Button variant="ghost" onClick={onRetry}>
              {t('app.errorTryAgain')}
            </Button>
          </div>
        }
      />
    </div>
  );
}

/** Catches render errors anywhere below and shows a localized fallback instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[forma] render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorFallback onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
