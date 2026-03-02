import { useLocation, useNavigate } from 'react-router-dom';
import type { QuizSession } from '../types';
import { PrintableResults } from '../components/PrintableResults';

interface LocationState {
  session?: QuizSession;
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const session = state?.session;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600">No results to display.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const score = session.answers.filter((a) => a.correct).length;
  const total = session.questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Screen-only nav bar */}
      <header className="no-print bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={() => navigate('/')}
          className="text-green-200 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          ← Home
        </button>
        <span className="text-sm font-semibold">
          Score: {score}/{total} ({pct}%)
        </span>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <PrintableResults
          testerName={session.testerName}
          hostName={session.hostName}
          answers={session.answers}
          allSpecies={session.region.species}
          date={today}
        />
      </main>

      {/* Print / action buttons (screen only) */}
      <div className="no-print sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex gap-3 justify-end shadow-md">
        <button
          onClick={() => navigate('/')}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Home
        </button>
        <button
          onClick={() => window.print()}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
        >
          Print Results
        </button>
      </div>
    </div>
  );
}
