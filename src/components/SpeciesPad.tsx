import { useState } from 'react';
import type { Species } from '../types';
import { SpectrogramDisplay } from './SpectrogramDisplay';

interface Props {
  species: Species;
  isActive: boolean;
  isPlaying: boolean;
  sampleIndex: number;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  spectrogramSrc?: string;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export function SpeciesPad({ species, isActive, isPlaying, sampleIndex, onToggle, onPrev, onNext, spectrogramSrc, audioRef }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const photo = species.photos[0];
  const totalSamples = species.audio.length;
  const showPulse = isActive && isPlaying;
  const multiSample = totalSamples > 1;

  return (
    <div className="flex flex-col">

      {/* Names — fixed height keeps image badges aligned across grid rows */}
      <div className="pointer-events-none px-0.5 h-9 flex flex-col justify-end pb-1">
        <p className="font-bold text-xs text-gray-900 leading-tight truncate">
          {species.commonName}
        </p>
        <p className="text-[10px] italic text-gray-500 leading-tight mt-0.5 truncate">
          {species.scientificName}
        </p>
      </div>

      {/* Image card — full bleed */}
      <div className={`relative overflow-hidden rounded-2xl w-full h-36 sm:h-40 ${
        showPulse ? 'ring-4 ring-green-400 ring-offset-2' : ''
      }`}>

        {/* Background */}
        {isActive && spectrogramSrc && audioRef ? (
          <SpectrogramDisplay imageSrc={spectrogramSrc} audioRef={audioRef} />
        ) : photo && !imgFailed ? (
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

        {/* Overlay */}
        <div className={`absolute inset-0 transition-colors duration-200 ${
          showPulse ? 'bg-green-900/50' : 'bg-black/40'
        }`} />

        {/* Play/stop — fills full card */}
        <button
          onClick={onToggle}
          aria-label={`${showPulse ? 'Stop' : 'Play'} ${species.commonName}`}
          aria-pressed={showPulse}
          className="absolute inset-0 w-full h-full focus:outline-none focus:ring-4 focus:ring-green-300 rounded-2xl hover:bg-white/5 transition-colors"
        />

        {/* Playing wave indicator */}
        {showPulse && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 pointer-events-none" aria-hidden>
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

        {/* Carousel chevrons — overlaid, centered vertically */}
        {multiSample && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              aria-label="Previous sample"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              aria-label="Next sample"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Sample counter — below the card */}
      <div className="h-5 flex items-center justify-center mt-1">
        {multiSample && (
          <span className="text-xs text-gray-400 tabular-nums select-none">
            {sampleIndex + 1} / {totalSamples}
          </span>
        )}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
