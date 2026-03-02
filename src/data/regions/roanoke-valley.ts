import type { Region, Species } from '../../types';
import { woodFrog } from '../species/wood-frog';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { americanToad } from '../species/american-toad';
import { fowlersToad } from '../species/fowlers-toad';
import { pickerelFrog } from '../species/pickerel-frog';
import { easternSpadefoot } from '../species/eastern-spadefoot';
import { easternCricketFrog } from '../species/eastern-cricket-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { greenFrog } from '../species/green-frog';
import { americanBullfrog } from '../species/american-bullfrog';
import { coastalPlainsLeopardFrog } from '../species/coastal-plains-leopard-frog';
import audioManifest from '../audio/roanoke-valley.json';
import photoManifestRaw from '../photos/roanoke-valley.json';

type AudioManifest = typeof audioManifest;
type PhotoEntry = { file: string; attribution: string; license: string };
type PhotoManifest = Record<string, { selected: number; photos: PhotoEntry[] }>;
const photoManifest = photoManifestRaw as PhotoManifest;

function withAudio(species: Species): Species {
  const audio = audioManifest[species.id as keyof AudioManifest];
  return audio ? { ...species, audio } : species;
}

function withPhoto(species: Species): Species {
  const entry = photoManifest[species.id as keyof PhotoManifest];
  if (!entry?.photos?.length) return species;
  const photo = entry.photos[entry.selected ?? 0];
  if (!photo) return species;
  return {
    ...species,
    photos: [
      { url: `/photos/${photo.file}`, attribution: photo.attribution, license: photo.license },
      ...species.photos, // keep originals as fallback
    ],
  };
}

export const roanokeValley: Region = {
  id: 'roanoke-valley',
  name: 'Roanoke Valley, VA',
  species: [
    woodFrog,
    springPeeper,
    uplandChorusFrog,
    americanToad,
    fowlersToad,
    pickerelFrog,
    easternSpadefoot,
    easternCricketFrog,
    grayTreefrogComplex,
    greenFrog,
    americanBullfrog,
    coastalPlainsLeopardFrog,
  ].map(withAudio).map(withPhoto),
};
