import { useEffect } from 'react';
import type { AudioCredit } from '../types';
import { useAudio } from '../hooks/useAudio';

interface Props {
  audioFile: AudioCredit;
  showAnotherSample?: boolean;
  onAnotherSample?: () => void;
  hasMultipleSamples?: boolean;
}

export function AudioPlayer({ audioFile, showAnotherSample, onAnotherSample, hasMultipleSamples }: Props) {
  const { toggle, isPlaying, isLoaded } = useAudio(audioFile.file);

  // Auto-play when audio file changes
  useEffect(() => {
    // intentionally not auto-playing; user controls playback
  }, [audioFile.file]);

  return (
    <div className="flex flex-col items-center gap-3">
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
