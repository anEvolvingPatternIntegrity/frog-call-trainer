import { useEffect, useRef, useState } from 'react';

interface Props {
  imageSrc: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function SpectrogramDisplay({ imageSrc, audioRef }: Props) {
  const [failed, setFailed] = useState(false);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function tick() {
      const audio = audioRef.current;
      const cursor = cursorRef.current;
      if (cursor && audio && audio.duration > 0) {
        cursor.style.left = `${(audio.currentTime / audio.duration) * 100}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef]);

  if (failed) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={imageSrc}
        alt=""
        aria-hidden
        onError={() => setFailed(true)}
        className="w-full h-full object-fill"
        draggable={false}
      />
      {/* Glowing cursor bar */}
      <div
        ref={cursorRef}
        className="absolute top-0 bottom-0 w-px bg-white/90 pointer-events-none"
        style={{ left: '0%', boxShadow: '0 0 4px rgba(255,255,255,0.7)' }}
      />
    </div>
  );
}
