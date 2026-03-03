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

  // Caller selects which specific sample to play — no random picking here.
  function toggle(speciesId: string, audioFile: AudioCredit) {
    const audio = audioRef.current;
    if (!audio) return;

    if (speciesId === activeId && isPlaying) {
      audio.pause();
      return;
    }

    audio.pause();
    audio.src = `/audio/${audioFile.file}`;
    audio.currentTime = 0;
    setActiveId(speciesId);
    audio.play().catch(() => {});
  }

  // Always switches to the given file and plays (used by carousel arrows).
  function play(speciesId: string, audioFile: AudioCredit) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = `/audio/${audioFile.file}`;
    audio.currentTime = 0;
    setActiveId(speciesId);
    audio.play().catch(() => {});
  }

  return { activeId, isPlaying, toggle, play };
}
