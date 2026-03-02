import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AudioCredit, Species } from '../types';
import { REGIONS } from '../data';
import { useSoundboard } from '../hooks/useSoundboard';

interface RemoveState {
  speciesId: string;
  file: string;
}

export function AdminPage() {
  const navigate = useNavigate();
  const { activeId, isPlaying, toggle } = useSoundboard();
  const [removing, setRemoving] = useState<RemoveState | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Use first region; extend if multi-region support needed
  const region = REGIONS[0]!;

  async function handleRemove(species: Species, audio: AudioCredit) {
    setRemoving({ speciesId: species.id, file: audio.file });
    setError(null);
    try {
      const res = await fetch('/api/admin/remove-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionId: region.id, speciesId: species.id, file: audio.file }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRemoved(prev => new Set([...prev, audio.file]));
    } catch (err) {
      setError(String(err));
    } finally {
      setRemoving(null);
    }
  }

  const totalSamples = region.species.reduce((n, s) => n + s.audio.length, 0);
  const removedCount = removed.size;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={() => navigate('/')}
          className="text-gray-300 hover:text-white text-sm underline focus:outline-none"
        >
          ← Home
        </button>
        <div className="text-center">
          <span className="font-semibold">Audio Admin</span>
          <span className="text-gray-400 text-xs ml-2">(dev only)</span>
        </div>
        <span className="text-sm text-gray-400">
          {totalSamples - removedCount} samples
        </span>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 text-sm mx-4 mt-3 rounded">
          {error}
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-6">
        <p className="text-sm text-gray-500">
          Play each sample and remove any that are silent, noisy, or misidentified.
          Changes are written immediately — reload the app to see the updated list.
        </p>

        {region.species.map(species => {
          const visibleAudio = species.audio.filter(a => !removed.has(a.file));
          return (
            <div key={species.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-baseline gap-2">
                <span className="font-semibold text-gray-800">{species.commonName}</span>
                <span className="text-xs italic text-gray-400">{species.scientificName}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {visibleAudio.length} sample{visibleAudio.length !== 1 ? 's' : ''}
                </span>
              </div>

              {visibleAudio.length === 0 ? (
                <p className="px-4 py-3 text-sm text-red-500 italic">No samples remaining</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {visibleAudio.map(audio => {
                    const isThisPlaying = activeId === `${species.id}::${audio.file}` && isPlaying;
                    const isRemoving = removing?.file === audio.file;
                    return (
                      <li key={audio.file} className="flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => toggle(`${species.id}::${audio.file}`, [audio])}
                          aria-label={isThisPlaying ? 'Stop' : 'Play'}
                          className={`
                            flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
                            ${isThisPlaying
                              ? 'bg-green-500 text-white focus:ring-green-400'
                              : 'bg-gray-100 hover:bg-green-100 text-gray-600 focus:ring-gray-300'
                            }
                          `}
                        >
                          {isThisPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-600 truncate">
                            {audio.file.split('/').pop()}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {audio.attribution}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemove(species, audio)}
                          disabled={isRemoving}
                          className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                        >
                          {isRemoving ? '…' : 'Remove'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
