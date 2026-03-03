import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { REGIONS } from '../data';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(REGIONS[0]?.id ?? '');

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
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        Audio recordings from USGS ARMI and iNaturalist contributors. Photos from Wikimedia Commons.
      </footer>
    </div>
  );
}

function ModeCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-green-400 hover:bg-green-50 transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </button>
  );
}
