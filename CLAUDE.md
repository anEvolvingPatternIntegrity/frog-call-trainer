# Frog Call Trainer — Developer Guide

## Adding a New Region

### 1. Define the species list

Decide which species are present in the region. For each one note whether a species data file already exists in `src/data/species/`.

Existing species files:

| ID | Common Name |
|---|---|
| `american-bullfrog` | American Bullfrog |
| `american-toad` | American Toad |
| `barking-treefrog` | Barking Treefrog |
| `coastal-plains-leopard-frog` | Coastal Plains Leopard Frog |
| `eastern-cricket-frog` | Eastern Cricket Frog |
| `eastern-narrowmouth-toad` | Eastern Narrowmouth Toad |
| `eastern-spadefoot` | Eastern Spadefoot |
| `fowlers-toad` | Fowler's Toad |
| `gray-treefrog-complex` | Gray Treefrog Complex |
| `green-frog` | Green Frog |
| `green-treefrog` | Green Treefrog |
| `pickerel-frog` | Pickerel Frog |
| `spring-peeper` | Spring Peeper |
| `squirrel-treefrog` | Squirrel Treefrog |
| `southern-chorus-frog` | Southern Chorus Frog |
| `little-grass-frog` | Little Grass Frog |
| `upland-chorus-frog` | Upland Chorus Frog |
| `wood-frog` | Wood Frog |

### 2. Verify iNaturalist taxon IDs **before** writing config

Wrong taxon IDs silently return zero results. Always verify first:

```bash
# Look up by scientific name
curl -s "https://api.inaturalist.org/v1/taxa/autocomplete?q=Dryophytes+squirellus&per_page=3" \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); d.results.slice(0,3).forEach(r=>console.log(r.id, r.name))"

# Confirm audio exists with an open license (cc0, cc-by, or cc-by-nc)
curl -s "https://api.inaturalist.org/v1/observations?taxon_id=TAXON_ID&sounds=true&per_page=10&order_by=votes&quality_grade=research" \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')); d.results.flatMap(o=>o.sounds??[]).forEach(s=>console.log(s.license_code))"
```

Known taxon IDs (verified):

| Species | Taxon ID |
|---|---|
| Pseudacris crucifer (Spring Peeper) | 24268 |
| Pseudacris feriarum (Upland Chorus Frog) | 24263 |
| Pseudacris nigrita (Southern Chorus Frog) | 24261 |
| Pseudacris ocularis (Little Grass Frog) | 24262 |
| Anaxyrus americanus (American Toad) | 64968 |
| Anaxyrus fowleri (Fowler's Toad) | 64977 |
| Scaphiopus holbrookii (Eastern Spadefoot) | 26695 |
| Acris crepitans (Eastern Cricket Frog) | 24233 |
| Dryophytes chrysoscelis/versicolor (Gray Treefrog Complex) | 1668922, 1668923 |
| Dryophytes cinereus (Green Treefrog) | 1668858 |
| Dryophytes gratiosus (Barking Treefrog) | 1668962 |
| Dryophytes squirellus (Squirrel Treefrog) | 1668859 |
| Lithobates clamitans (Green Frog) | 65982 |
| Lithobates catesbeianus (American Bullfrog) | 65979 |
| Lithobates sphenocephalus (Coastal Plains Leopard Frog) | 60341 |
| Lithobates palustris (Pickerel Frog) | 66002 |
| Lithobates sylvaticus (Wood Frog) | 66012 |
| Gastrophryne carolinensis (Eastern Narrowmouth Toad) | 25078 |

### 3. Create species data files for any new species

`src/data/species/{species-id}.ts` — copy an existing one as a template:

```ts
import type { Species } from '../../types';

export const squirrelTreefrog: Species = {
  id: 'squirrel-treefrog',
  commonName: 'Squirrel Treefrog',
  scientificName: 'Dryophytes squirellus',
  audio: [],          // populated by audio manifest; leave empty
  photos: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/...',
      attribution: '© Author / Wikimedia Commons',
      license: 'CC-BY-SA',
    },
  ],
  funFact: '...',
};
```

- `audio: []` is fine — the region manifest overrides it via `withAudio()`.
- Wikimedia Commons photo URLs are fallbacks; the fetch-photos scripts will produce locally-hosted versions.

### 4. Create the region file

`src/data/regions/{region-id}.ts`:

```ts
import type { Region, Species } from '../../types';
import { springPeeper } from '../species/spring-peeper';
// ... all species imports
import audioManifest from '../audio/{region-id}.json';
import photoManifestRaw from '../photos/{region-id}.json';

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

export const myRegion: Region = {
  id: '{region-id}',
  name: 'Display Name, ST',
  species: [
    springPeeper,
    // ...
  ].map(withAudio).map(withPhoto),
};
```

### 5. Create empty manifests

```bash
echo '{}' > src/data/audio/{region-id}.json
echo '{}' > src/data/photos/{region-id}.json
```

### 6. Add to `scripts/audio-config.json`

Add a new entry under `"regions"`. Use the verified taxon IDs from step 2:

```json
"my-region": {
  "species": {
    "spring-peeper": {
      "taxonIds": [24268],
      "scientificName": "Pseudacris crucifer",
      "wikiCategories": ["Pseudacris crucifer"]
    }
  }
}
```

### 7. Register in `src/data/index.ts`

```ts
import { myRegion } from './regions/my-region';
export const REGIONS = [roanokeValley, tidewaterVirginia, myRegion];
```

### 8. Build check

```bash
npm run build
```

Fix any TypeScript errors before continuing.

### 9. Fetch audio — **run only once per region**

```bash
node scripts/fetch-audio.mjs {region-id}
```

**Critical:** Running this a second time for a region will download duplicates for every species already in the manifest (different filenames, same audio). If you need to fix taxon IDs and re-fetch, first delete the downloaded audio files and clear the manifest back to `{}`.

### 10. Generate spectrograms

```bash
node scripts/gen-spectrograms.mjs {region-id}
```

The script skips files where a PNG already exists, so re-running is safe.

### 11. Review in admin panel

Start the dev server (`npm run dev`) and visit `/admin`. For each species, listen to samples, reorder so the clearest call is sample #1 (used in test mode), and delete obvious duplicates or poor-quality recordings.

---

## Known Gotchas

- **`.mpga` files** are MPEG audio and are valid but the extension isn't always recognized. It is listed in `gen-spectrograms.mjs` `AUDIO_EXTENSIONS`. If a new extension appears that has no spectrogram, add it there.
- **Taxon IDs** for `Dryophytes` species are in the `1668xxx` range, not `24xxx`. The `24xxx` range is mostly used by older taxonomy. Always verify before use.
- **Gray Treefrog Complex** uses two taxon IDs (both Cope's and Eastern Gray) to cast a wide net on iNaturalist.
