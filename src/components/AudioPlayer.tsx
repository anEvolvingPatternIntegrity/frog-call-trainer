import { useEffect, useState } from 'react';
import type { AudioCredit } from '../types';
import { useAudio } from '../hooks/useAudio';
import { SpectrogramDisplay } from './SpectrogramDisplay';

interface Props {
  audioFile: AudioCredit;
  showAnotherSample?: boolean;
  onAnotherSample?: () => void;
  hasMultipleSamples?: boolean;
  spectrogramSrc?: string;
}

export function AudioPlayer({ audioFile, showAnotherSample, onAnotherSample, hasMultipleSamples, spectrogramSrc }: Props) {
  const { toggle, isPlaying, isLoaded, audioRef } = useAudio(audioFile.file);
  const [showSpectrogram, setShowSpectrogram] = useState(false);

  // Auto-play when audio file changes
  useEffect(() => {
    // intentionally not auto-playing; user controls playback
  }, [audioFile.file]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Spectrogram strip */}
      {spectrogramSrc && showSpectrogram && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-black">
          <SpectrogramDisplay imageSrc={spectrogramSrc} audioRef={audioRef} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={!isLoaded}
          aria-label={isPlaying ? 'Pause frog call' : 'Play frog call'}
          className={`
            flex items-center justify-center gap-2 px-6 py-4 rounded-full text-lg font-semibold
            transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-green-400
            min-w-[160px] min-h-[56px]
            ${isPlaying
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
            }
            ${!isLoaded ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
          `}
        >
          {isPlaying ? (
            <>
              <PauseIcon />
              <span>Pause</span>
            </>
          ) : (
            <>
              <PlayIcon />
              <span>{isLoaded ? 'Play Call' : 'Loading…'}</span>
            </>
          )}
        </button>

        {/* Spectrogram toggle button */}
        {spectrogramSrc && (
          <button
            onClick={() => setShowSpectrogram((v) => !v)}
            aria-label={showSpectrogram ? 'Hide spectrogram' : 'Show spectrogram'}
            title={showSpectrogram ? 'Hide spectrogram' : 'Show spectrogram'}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold
              transition-colors focus:outline-none focus:ring-2 focus:ring-green-400
              ${showSpectrogram
                ? 'bg-green-200 text-green-800 hover:bg-green-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            <WaveformIcon />
          </button>
        )}
      </div>

      {showAnotherSample && hasMultipleSamples && onAnotherSample && (
        <button
          onClick={onAnotherSample}
          className="text-sm text-green-700 underline hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 rounded"
        >
          Hear another sample
        </button>
      )}

      {audioFile.attribution && (
        <p className="text-xs text-gray-400 text-center max-w-xs">
          Audio: {audioFile.attribution}
        </p>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2" strokeLinecap="round" />
    </svg>
  );
}
