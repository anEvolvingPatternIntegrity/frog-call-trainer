import type { Species } from '../types';

interface Props {
  species: Species;
}

export function SpeciesReveal({ species }: Props) {
  const photo = species.photos[0];

  return (
    <div className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
      {photo && (
        <div className="relative">
          <img
            src={photo.url}
            alt={species.commonName}
            className="w-full h-48 object-cover object-center"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
            {photo.attribution}
          </p>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800">{species.commonName}</h3>
        <p className="text-sm italic text-gray-500 mb-2">{species.scientificName}</p>
        {species.funFact && (
          <p className="text-sm text-gray-600 bg-green-50 rounded-lg px-3 py-2 border-l-4 border-green-400">
            {species.funFact}
          </p>
        )}
      </div>
    </div>
  );
}
