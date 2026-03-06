import { useEffect, useRef, useState } from 'react';
import type { AudioCredit } from '../types';
import { useAudio } from '../hooks/useAudio';
import { SpectrogramDisplay } from './SpectrogramDisplay';

interface Props {
  audioFile: AudioCredit;
  showAnotherSample?: boolean;
  onAnotherSample?: () => void;
  hasMultipleSamples?: boolean;
  spectrogramSrc?: string;
  stopPlayback?: boolean;
}

export function AudioPlayer({ audioFile, showAnotherSample, onAnotherSample, hasMultipleSamples, spectrogramSrc, stopPlayback }: Props) {
  const { toggle, play, pause, isPlaying, isLoaded, audioRef } = useAudio(audioFile.file);
  const [showSpectrogram, setShowSpectrogram] = useState(!!spectrogramSrc);
  const autoPlayRef = useRef(false);
  const isFirstRender = useRef(true);

  // Auto-play on question/sample change (but not on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    autoPlayRef.current = true;
  }, [audioFile.file]);

  // Auto-play when a new sample loads
  useEffect(() => {
    if (isLoaded && autoPlayRef.current) {
      autoPlayRef.current = false;
      play();
    }
  }, [isLoaded, play]);

  // Stop playback when an answer is submitted
  useEffect(() => {
    if (stopPlayback) pause();
  }, [stopPlayback, pause]);

  function handleAnotherSample() {
    if (isPlaying) pause();
    onAnotherSample?.();
  }

  // Auto-play when audio file changes
  useEffect(() => {
    // intentionally not auto-playing; user controls playback
  }, [audioFile.file]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Spectrogram strip */}
      {spectrogramSrc && showSpectrogram && (
        <div className="w-full space-y-1">
          <div className="relative w-full h-24 rounded-lg overflow-hidden bg-black">
            <SpectrogramDisplay imageSrc={spectrogramSrc} audioRef={audioRef} />
          </div>
          <button
            onClick={() => setShowSpectrogram(false)}
            className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-right pr-1 focus:outline-none"
          >
            Hide spectrogram
          </button>
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

        {/* Show spectrogram button — only when hidden */}
        {spectrogramSrc && !showSpectrogram && (
          <button
            onClick={() => setShowSpectrogram(true)}
            aria-label="Show spectrogram"
            title="Show spectrogram"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <WaveformIcon />
          </button>
        )}
      </div>

      {showAnotherSample && hasMultipleSamples && onAnotherSample && (
        <button
          onClick={handleAnotherSample}
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
