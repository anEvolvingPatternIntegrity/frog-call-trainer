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
    <div className="flex flex-col gap-1.5">

      {/* Names — above the image badge */}
      <div className="pointer-events-none px-0.5">
        <p className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
          {species.commonName}
        </p>
        <p className="text-xs italic text-gray-500 leading-tight mt-0.5">
          {species.scientificName}
        </p>
      </div>

      {/* Card */}
      <div className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-200 ${
        showPulse ? 'border-green-400 ring-2 ring-green-400 ring-offset-1' : 'border-gray-200'
      }`}>

      {/* Image row: chevron | image | chevron */}
      <div className="flex items-center gap-1 px-1.5">
        {multiSample ? (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous sample"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <ChevronLeft />
          </button>
        ) : (
          <div className="flex-shrink-0 w-6" />
        )}

        {/* Image area */}
        <div className="relative flex-1 h-24 sm:h-28 rounded-xl overflow-hidden">
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
            showPulse ? 'bg-green-900/40' : 'bg-black/30'
          }`} />

          {/* Play/stop button — fills image area */}
          <button
            onClick={onToggle}
            aria-label={`${showPulse ? 'Stop' : 'Play'} ${species.commonName}`}
            aria-pressed={showPulse}
            className="absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-green-300 rounded-xl hover:bg-white/5 transition-colors"
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
        </div>

        {multiSample ? (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next sample"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <ChevronRight />
          </button>
        ) : (
          <div className="flex-shrink-0 w-6" />
        )}
      </div>

      {/* Sample counter — below image */}
      <div className="h-6 flex items-center justify-center">
        {multiSample && (
          <span className="text-xs text-gray-400 tabular-nums select-none">
            {sampleIndex + 1} / {totalSamples}
          </span>
        )}
      </div>

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
