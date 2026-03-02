import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AudioCredit, Species } from '../types';
import { REGIONS } from '../data';
import { useSoundboard } from '../hooks/useSoundboard';
import photoManifestRaw from '../data/photos/roanoke-valley.json';

type PhotoEntry = { file: string; attribution: string; license: string };
type PhotoManifest = Record<string, { selected: number; photos: PhotoEntry[] }>;
const photoManifest: PhotoManifest = photoManifestRaw as PhotoManifest;

export function AdminPage() {
  const navigate = useNavigate();
  const { activeId, isPlaying, toggle } = useSoundboard();
  const [audioRemoved, setAudioRemoved] = useState<Set<string>>(new Set());
  const [photoRemoved, setPhotoRemoved] = useState<Set<string>>(new Set());
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, number>>(
    () => Object.fromEntries(Object.entries(photoManifest).map(([k, v]) => [k, v.selected]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; attribution: string } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setLightbox(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const region = REGIONS[0]!;

  async function post(endpoint: string, body: object) {
    const res = await fetch(`/api/admin/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function handleRemoveAudio(species: Species, audio: AudioCredit) {
    const key = `audio:${audio.file}`;
    setBusy(key); setError(null);
    try {
      await post('remove-audio', { regionId: region.id, speciesId: species.id, file: audio.file });
      setAudioRemoved(prev => new Set([...prev, audio.file]));
    } catch (err) { setError(String(err)); }
    finally { setBusy(null); }
  }

  async function handleSelectPhoto(species: Species, index: number) {
    const key = `photo-select:${species.id}`;
    setBusy(key); setError(null);
    try {
      await post('select-photo', { regionId: region.id, speciesId: species.id, index });
      setSelectedPhotos(prev => ({ ...prev, [species.id]: index }));
    } catch (err) { setError(String(err)); }
    finally { setBusy(null); }
  }

  async function handleRemovePhoto(species: Species, photo: PhotoEntry) {
    const key = `photo-rm:${photo.file}`;
    setBusy(key); setError(null);
    try {
      await post('remove-photo', { regionId: region.id, speciesId: species.id, file: photo.file });
      setPhotoRemoved(prev => new Set([...prev, photo.file]));
      // If we removed the selected photo, reset selection to 0
      const remaining = (photoManifest[species.id]?.photos ?? []).filter(p => !photoRemoved.has(p.file) && p.file !== photo.file);
      const sel = selectedPhotos[species.id] ?? 0;
      if (sel >= remaining.length) setSelectedPhotos(prev => ({ ...prev, [species.id]: Math.max(0, remaining.length - 1) }));
    } catch (err) { setError(String(err)); }
    finally { setBusy(null); }
  }

  const totalAudio = region.species.reduce((n, s) => n + s.audio.filter(a => !audioRemoved.has(a.file)).length, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <button onClick={() => navigate('/')} className="text-gray-300 hover:text-white text-sm underline focus:outline-none">
          ← Home
        </button>
        <div className="text-center">
          <span className="font-semibold">Audio + Photo Admin</span>
          <span className="text-gray-400 text-xs ml-2">(dev only)</span>
        </div>
        <span className="text-sm text-gray-400">{totalAudio} samples</span>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 text-sm mx-4 mt-3 rounded">{error}</div>
      )}

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-8">
        <p className="text-sm text-gray-500">
          Play each audio sample and remove bad ones. Select the best photo for each species' practice pad.
          Run <code className="bg-gray-100 px-1 rounded">node scripts/fetch-photos.mjs</code> to download photos.
        </p>

        {region.species.map(species => {
          const visibleAudio = species.audio.filter(a => !audioRemoved.has(a.file));
          const photoEntry = photoManifest[species.id];
          const visiblePhotos = (photoEntry?.photos ?? []).filter(p => !photoRemoved.has(p.file));
          const selectedIdx = selectedPhotos[species.id] ?? 0;

          return (
            <div key={species.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Species header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-baseline gap-2">
                <span className="font-semibold text-gray-800">{species.commonName}</span>
                <span className="text-xs italic text-gray-400">{species.scientificName}</span>
              </div>

              {/* ── Audio section ── */}
              <div className="px-4 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Audio — {visibleAudio.length} sample{visibleAudio.length !== 1 ? 's' : ''}
                </p>
                {visibleAudio.length === 0
                  ? <p className="text-sm text-red-500 italic mb-3">No samples remaining</p>
                  : (
                    <ul className="divide-y divide-gray-100 mb-3">
                      {visibleAudio.map(audio => {
                        const padId = `${species.id}::${audio.file}`;
                        const thisPlaying = activeId === padId && isPlaying;
                        const isBusy = busy === `audio:${audio.file}`;
                        return (
                          <li key={audio.file} className="flex items-center gap-3 py-2">
                            <button
                              onClick={() => toggle(padId, audio)}
                              aria-label={thisPlaying ? 'Stop' : 'Play'}
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 ${
                                thisPlaying ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-green-100 text-gray-600'
                              }`}
                            >
                              {thisPlaying ? <PauseIcon /> : <PlayIcon />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono text-gray-600 truncate">{audio.file.split('/').pop()}</p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{audio.attribution}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveAudio(species, audio)}
                              disabled={isBusy}
                              className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors focus:outline-none disabled:opacity-50"
                            >
                              {isBusy ? '…' : 'Remove'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )
                }
              </div>

              {/* ── Photo section ── */}
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Photos — {visiblePhotos.length} candidate{visiblePhotos.length !== 1 ? 's' : ''}
                </p>

                {visiblePhotos.length === 0 ? (
                  <p className="text-sm text-gray-400 italic mb-3">
                    No photos yet.{' '}
                    Run <code className="bg-gray-100 px-1 rounded">node scripts/fetch-photos-wiki.mjs</code> or{' '}
                    <code className="bg-gray-100 px-1 rounded">node scripts/fetch-photos.mjs</code>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 mb-3">
                    {visiblePhotos.map((photo, i) => {
                      const isSelected = i === selectedIdx;
                      const isBusySelect = busy === `photo-select:${species.id}`;
                      const isBusyRemove = busy === `photo-rm:${photo.file}`;
                      const isWiki = photo.file.includes('-wiki-');
                      return (
                        <li key={photo.file} className={`flex items-center gap-3 py-2 ${isSelected ? 'bg-green-50 -mx-1 px-1 rounded' : ''}`}>
                          <button
                            onClick={() => setLightbox({ src: `/photos/${photo.file}`, attribution: photo.attribution })}
                            className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                            title="Click to enlarge"
                          >
                            <img
                              src={`/photos/${photo.file}`}
                              alt={species.commonName}
                              className="w-16 h-12 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                              onError={e => { (e.target as HTMLImageElement).src = ''; }}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-gray-600 truncate">
                              {photo.file.split('/').pop()}
                              {isWiki && <span className="ml-1 text-blue-400 not-italic font-sans">[wiki]</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{photo.attribution}</p>
                            <p className="text-xs text-gray-300">{photo.license}</p>
                          </div>
                          <button
                            onClick={() => handleSelectPhoto(species, i)}
                            disabled={isBusySelect}
                            className={`flex-shrink-0 text-xs px-2 py-1 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 ${
                              isSelected
                                ? 'bg-green-500 text-white border-green-500'
                                : 'text-green-600 border-green-300 hover:bg-green-50'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </button>
                          <button
                            onClick={() => handleRemovePhoto(species, photo)}
                            disabled={isBusyRemove}
                            className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2 py-1 rounded transition-colors focus:outline-none disabled:opacity-50"
                          >
                            {isBusyRemove ? '…' : 'Remove'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.src}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl"
            />
            <p className="text-white/70 text-xs mt-2 text-center">{lightbox.attribution}</p>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-800 rounded-full text-lg font-bold flex items-center justify-center shadow-lg hover:bg-gray-100 focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
}
function PauseIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
}
