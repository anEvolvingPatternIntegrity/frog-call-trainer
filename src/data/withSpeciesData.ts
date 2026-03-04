import type { Species } from '../types';
import audioManifest from './audio.json';
import photoManifestRaw from './photos.json';

type AudioManifest = typeof audioManifest;
type PhotoEntry = { file: string; attribution: string; license: string };
type PhotoManifest = Record<string, { selected: number; photos: PhotoEntry[] }>;
const photoManifest = photoManifestRaw as PhotoManifest;

export function withAudio(species: Species): Species {
  const audio = audioManifest[species.id as keyof AudioManifest];
  return audio ? { ...species, audio } : species;
}

export function withPhoto(species: Species): Species {
  const entry = photoManifest[species.id as keyof PhotoManifest];
  if (!entry?.photos?.length) return species;
  const photo = entry.photos[entry.selected ?? 0];
  if (!photo) return species;
  return {
    ...species,
    photos: [
      { url: `/photos/${photo.file}`, attribution: photo.attribution, license: photo.license },
      ...species.photos,
    ],
  };
}
