import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Region } from '../types';
import { REGIONS } from '../data';

type HomeMode = 'practice' | 'training' | 'test';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(REGIONS[0]?.id ?? '');
  const [mode, setMode] = useState<HomeMode>('practice');

  function handleStart() {
    if (mode === 'practice') {
      navigate(`/practice?region=${selectedRegionId}`);
    } else if (mode === 'training') {
      navigate(`/quiz?region=${selectedRegionId}`);
    } else {
      navigate(`/quiz?region=${selectedRegionId}&mode=test`);
    }
  }

  const selectedRegion: Region | undefined = REGIONS.find((r) => r.id === selectedRegionId);

  const startLabel = mode === 'practice' ? 'Open Soundboard' : mode === 'training' ? 'Start Training' : 'Start Test';

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

          {/* Mode selector */}
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Mode</p>
            <div className="grid grid-cols-3 gap-2">
              <ModeButton
                active={mode === 'practice'}
                onClick={() => setMode('practice')}
                title="Practice"
                description="Tap pads to hear each species"
              />
              <ModeButton
                active={mode === 'training'}
                onClick={() => setMode('training')}
                title="Training"
                description="Feedback after each answer"
              />
              <ModeButton
                active={mode === 'test'}
                onClick={() => setMode('test')}
                title="Test"
                description="No feedback until the end"
              />
            </div>
          </div>

          {/* Contextual hint */}
          {selectedRegion && (
            <p className="text-xs text-gray-400">
              {mode === 'practice'
                ? `Browse all ${selectedRegion.species.length} species — tap a pad to play its call.`
                : `You'll be quizzed on all ${selectedRegion.species.length} species, one at a time.`}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={!selectedRegionId}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-base transition-colors focus:outline-none focus:ring-4 focus:ring-green-400 disabled:opacity-50"
          >
            {startLabel}
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        Audio recordings from USGS ARMI and iNaturalist contributors. Photos from Wikimedia Commons.
      </footer>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-green-400
        ${active
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-green-300'
        }
      `}
    >
      <div className={`text-sm font-semibold ${active ? 'text-green-800' : 'text-gray-700'}`}>{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
    </button>
  );
}
