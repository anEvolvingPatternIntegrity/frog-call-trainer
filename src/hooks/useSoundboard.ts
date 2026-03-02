import { useEffect, useRef, useState } from 'react';
import type { AudioCredit } from '../types';

export function useSoundboard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    audioRef.current = audio;
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
    };
  }, []);

  function toggle(speciesId: string, audioFiles: AudioCredit[]) {
    const audio = audioRef.current;
    if (!audio) return;

    // Tapping the currently-playing pad stops it
    if (speciesId === activeId && isPlaying) {
      audio.pause();
      return;
    }

    // Pick a random sample from the available files
    const file = audioFiles[Math.floor(Math.random() * audioFiles.length)]!;
    audio.pause();
    audio.src = `/audio/${file.file}`;
    audio.currentTime = 0;
    setActiveId(speciesId);
    audio.play().catch(() => {});
  }

  return { activeId, isPlaying, toggle };
}
