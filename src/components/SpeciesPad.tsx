import { useState } from 'react';
import type { Species } from '../types';

interface Props {
  species: Species;
  isActive: boolean;
  isPlaying: boolean;
  onToggle: () => void;
}

export function SpeciesPad({ species, isActive, isPlaying, onToggle }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const photo = species.photos[0];

  const showPulse = isActive && isPlaying;

  return (
    <button
      onClick={onToggle}
      aria-label={`${isActive && isPlaying ? 'Stop' : 'Play'} ${species.commonName}`}
      aria-pressed={isActive && isPlaying}
      className={`
        relative overflow-hidden rounded-2xl w-full h-36 sm:h-40
        focus:outline-none focus:ring-4 focus:ring-green-300
        transition-transform duration-100 active:scale-95
        ${showPulse ? 'ring-4 ring-green-400 ring-offset-2' : ''}
      `}
    >
      {/* Background image */}
      {photo && !imgFailed ? (
        <img
          src={photo.url}
          alt=""
          aria-hidden
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-600" />
      )}

      {/* Dark overlay — lightens slightly when playing */}
      <div
        className={`absolute inset-0 transition-colors duration-200 ${
          showPulse
            ? 'bg-green-900/50'
            : 'bg-black/55 hover:bg-black/45'
        }`}
      />

      {/* Playing wave indicator */}
      {showPulse && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="block w-0.5 bg-green-300 rounded-full animate-bounce"
              style={{
                height: `${8 + (i % 2) * 6}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      )}

      {/* Text */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 text-left">
        <span className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow">
          {species.commonName}
        </span>
        <span className="text-white/70 text-xs italic leading-tight mt-0.5 drop-shadow">
          {species.scientificName}
        </span>
      </div>
    </button>
  );
}
