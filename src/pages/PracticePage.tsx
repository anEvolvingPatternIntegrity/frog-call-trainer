import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { REGIONS } from '../data';
import { useSoundboard } from '../hooks/useSoundboard';
import { SpeciesPad } from '../components/SpeciesPad';
import { AttributionFooter } from '../components/AttributionFooter';
import type { PhotoAttr } from '../components/AttributionFooter';

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const regionId = searchParams.get('region') ?? REGIONS[0]?.id ?? '';
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]!;

  const { activeId, isPlaying, toggle, play } = useSoundboard();

  // Per-species sample index (all start at 0)
  const [sampleIndices, setSampleIndices] = useState<Record<string, number>>(() =>
    Object.fromEntries(region.species.map((s) => [s.id, 0]))
  );

  function setSampleIndex(speciesId: string, index: number) {
    setSampleIndices((prev) => ({ ...prev, [speciesId]: index }));
  }

  function handlePrev(speciesId: string, total: number) {
    const newIdx = (sampleIndices[speciesId]! - 1 + total) % total;
    setSampleIndex(speciesId, newIdx);
    if (activeId === speciesId) {
      const species = region.species.find((s) => s.id === speciesId)!;
      play(speciesId, species.audio[newIdx]!);
    }
  }

  function handleNext(speciesId: string, total: number) {
    const newIdx = (sampleIndices[speciesId]! + 1) % total;
    setSampleIndex(speciesId, newIdx);
    if (activeId === speciesId) {
      const species = region.species.find((s) => s.id === speciesId)!;
      play(speciesId, species.audio[newIdx]!);
    }
  }

  const photoAttrs: PhotoAttr[] = region.species
    .filter((s) => s.photos[0])
    .map((s) => ({ speciesName: s.commonName, credit: s.photos[0]! }));

  const activeSpecies = region.species.find((s) => s.id === activeId);
  const activeAudio = activeSpecies
    ? (activeSpecies.audio[sampleIndices[activeSpecies.id] ?? 0] ?? activeSpecies.audio[0])
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col">
      <header className="bg-green-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={() => navigate('/')}
          className="text-green-200 hover:text-white text-sm underline focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          ← Home
        </button>
        <span className="text-sm font-semibold">{region.name}</span>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Species Soundboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tap a pad to play. Use ‹ › to browse samples.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {region.species.map((species) => {
            const idx = sampleIndices[species.id] ?? 0;
            const audioFile = species.audio[idx] ?? species.audio[0]!;
            return (
              <SpeciesPad
                key={species.id}
                species={species}
                isActive={activeId === species.id}
                isPlaying={activeId === species.id && isPlaying}
                sampleIndex={idx}
                onToggle={() => toggle(species.id, audioFile)}
                onPrev={() => handlePrev(species.id, species.audio.length)}
                onNext={() => handleNext(species.id, species.audio.length)}
              />
            );
          })}
        </div>
      </main>

      <AttributionFooter photos={photoAttrs} audio={activeAudio} />
    </div>
  );
}
