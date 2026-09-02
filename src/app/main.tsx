/**
 * App entry. Placeholder during scaffolding — the app area replaces this with the real router,
 * stores and screens (see docs/SPEC.md §10).
 */
import { HashRouter, Route, Routes } from 'react-router';
import { detectLocale, t } from '@/i18n/index';

function Placeholder() {
  const locale = detectLocale();
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-5xl">{t(locale, 'common.brand')}</h1>
      <p className="text-muted">{t(locale, 'common.loading')}</p>
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </HashRouter>
  );
}
