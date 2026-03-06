import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REGIONS } from '../data';
import { useOfflineCache } from '../hooks/useOfflineCache';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(REGIONS[0]?.id ?? '');
  const selectedRegion = REGIONS.find(r => r.id === selectedRegionId) ?? REGIONS[0]!;
  const { status, progress, download } = useOfflineCache(selectedRegion);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col">
      <header className="bg-green-800 text-white px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">🐸 Frog Call Trainer</h1>
        <p className="text-green-200 text-sm mt-0.5">Auditory identification quizzes for field naturalists</p>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-6">
          {/* Region selector */}
          <div>
            <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              id="region-select"
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.species.length} species)
                </option>
              ))}
            </select>
          </div>

          {/* Mode cards — click to go directly */}
          <div className="grid grid-cols-3 gap-2">
            <ModeCard
              title="Practice"
              description="Tap pads to hear each species"
              onClick={() => navigate(`/practice?region=${selectedRegionId}`)}
            />
            <ModeCard
              title="Training"
              description="Feedback after each answer"
              onClick={() => navigate(`/quiz?region=${selectedRegionId}`)}
            />
            <ModeCard
              title="Test"
              description="No feedback until the end"
              onClick={() => navigate(`/quiz?region=${selectedRegionId}&mode=test`)}
            />
          </div>

          {/* Offline cache */}
          {status !== 'unavailable' && (
            <OfflineDownload status={status} progress={progress} onDownload={download} />
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        Audio recordings from USGS ARMI and iNaturalist contributors. Photos from Wikimedia Commons.
      </footer>
    </div>
  );
}

function OfflineDownload({
  status,
  progress,
  onDownload,
}: {
  status: 'idle' | 'downloading' | 'done' | 'error' | 'unavailable';
  progress: { done: number; total: number };
  onDownload: () => void;
}) {
  if (status === 'done') {
    return (
      <p className="text-xs text-center text-green-600">
        ✓ Region cached for offline use
      </p>
    );
  }

  if (status === 'downloading') {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Caching for offline use…</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onDownload}
      className="w-full text-sm text-green-700 border border-green-300 rounded-lg py-2 hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      ↓ Download region for offline use
    </button>
  );
}

function ModeCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 flex flex-col items-start"
    >
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </button>
  );
}
