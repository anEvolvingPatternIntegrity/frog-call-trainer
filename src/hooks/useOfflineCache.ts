import { useState, useEffect } from 'react';
import type { Region } from '../types';

type CacheStatus = 'unavailable' | 'idle' | 'downloading' | 'done' | 'error';

export function useOfflineCache(region: Region) {
  const [swReady, setSwReady] = useState(false);
  const [status, setStatus] = useState<CacheStatus>('unavailable');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    function check() {
      setSwReady(!!navigator.serviceWorker.controller);
    }

    check();
    navigator.serviceWorker.addEventListener('controllerchange', check);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', check);
  }, []);

  useEffect(() => {
    if (swReady && status === 'unavailable') setStatus('idle');
  }, [swReady, status]);

  // Reset when region changes
  useEffect(() => {
    if (swReady) setStatus('idle');
  }, [region.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function download() {
    const assets: string[] = [];
    for (const species of region.species) {
      for (const audio of species.audio) {
        assets.push(`/audio/${audio.file}`);
        assets.push(`/spectrograms/${audio.file.replace(/\.[^.]+$/, '.png')}`);
      }
      if (species.photos[0]?.url.startsWith('/photos/')) {
        assets.push(species.photos[0].url);
      }
    }

    setStatus('downloading');
    setProgress({ done: 0, total: assets.length });

    let done = 0;
    for (const url of assets) {
      try {
        await fetch(url);
      } catch {
        // non-fatal: missing file, continue
      }
      done++;
      setProgress({ done, total: assets.length });
    }

    setStatus('done');
  }

  return { status, progress, download };
}
