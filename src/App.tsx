import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { PracticePage } from './pages/PracticePage';

// Dynamic import so AdminPage is excluded from the production bundle entirely.
// Vite replaces import.meta.env.DEV with false at build time, which lets the
// dead-code eliminator drop the lazy() call and the AdminPage module.
const AdminPage = import.meta.env.DEV
  ? lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))
  : null;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/results" element={<ResultsPage />} />
        {AdminPage && (
          <Route
            path="/admin"
            element={<Suspense fallback={null}><AdminPage /></Suspense>}
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
