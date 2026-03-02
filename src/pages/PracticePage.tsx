import { useNavigate, useSearchParams } from 'react-router-dom';
import { REGIONS } from '../data';
import { useSoundboard } from '../hooks/useSoundboard';
import { SpeciesPad } from '../components/SpeciesPad';

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const regionId = searchParams.get('region') ?? REGIONS[0]?.id ?? '';
  const region = REGIONS.find((r) => r.id === regionId) ?? REGIONS[0]!;

  const { activeId, isPlaying, toggle } = useSoundboard();

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
          <p className="text-sm text-gray-500 mt-0.5">Tap any pad to hear its call. Tap again to stop.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {region.species.map((species) => (
            <SpeciesPad
              key={species.id}
              species={species}
              isActive={activeId === species.id}
              isPlaying={activeId === species.id && isPlaying}
              onToggle={() => toggle(species.id, species.audio)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
