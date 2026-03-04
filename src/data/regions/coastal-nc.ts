import type { Region, Species } from '../../types';
import { springPeeper } from '../species/spring-peeper';
import { uplandChorusFrog } from '../species/upland-chorus-frog';
import { southernChorusFrog } from '../species/southern-chorus-frog';
import { littleGrassFrog } from '../species/little-grass-frog';
import { fowlersToad } from '../species/fowlers-toad';
import { easternSpadefoot } from '../species/eastern-spadefoot';
import { easternCricketFrog } from '../species/eastern-cricket-frog';
import { grayTreefrogComplex } from '../species/gray-treefrog-complex';
import { greenTreefrog } from '../species/green-treefrog';
import { barkingTreefrog } from '../species/barking-treefrog';
import { squirrelTreefrog } from '../species/squirrel-treefrog';
import { greenFrog } from '../species/green-frog';
import { americanBullfrog } from '../species/american-bullfrog';
import { coastalPlainsLeopardFrog } from '../species/coastal-plains-leopard-frog';
import { easternNarrowmouthToad } from '../species/eastern-narrowmouth-toad';
import audioManifest from '../audio/coastal-nc.json';
import photoManifestRaw from '../photos/coastal-nc.json';

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
      ...species.photos,
    ],
  };
}

export const coastalNC: Region = {
  id: 'coastal-nc',
  name: 'Coastal NC',
  species: [
    springPeeper,
    uplandChorusFrog,
    southernChorusFrog,
    littleGrassFrog,
    fowlersToad,
    easternSpadefoot,
    easternCricketFrog,
    grayTreefrogComplex,
    greenTreefrog,
    barkingTreefrog,
    squirrelTreefrog,
    greenFrog,
    americanBullfrog,
    coastalPlainsLeopardFrog,
    easternNarrowmouthToad,
  ].map(withAudio).map(withPhoto),
};
