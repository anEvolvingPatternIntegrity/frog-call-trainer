# Frog Call Trainer — Developer Guide

## Asset Structure

Assets are species-scoped (not region-scoped):

```
public/
  audio/{species-id}/           e.g. public/audio/american-bullfrog/
  spectrograms/{species-id}/    e.g. public/spectrograms/american-bullfrog/
  photos/{species-id}/          e.g. public/photos/american-bullfrog/

src/data/
  audio.json                    global manifest: species-id → AudioCredit[]
  photos.json                   global manifest: species-id → {selected, photos[]}
  withSpeciesData.ts            shared withAudio / withPhoto helpers
```

Regions are pure species lists — they import `withAudio` and `withPhoto` from `src/data/withSpeciesData.ts`.

---

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
  audio: [],          // populated by global audio manifest; leave empty
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

- `audio: []` is fine — `withAudio()` in `withSpeciesData.ts` fills it from `src/data/audio.json`.
- Wikimedia Commons photo URLs are fallbacks; the fetch-photos scripts produce locally-hosted versions.

### 4. Create the region file

`src/data/regions/{region-id}.ts`:

```ts
import type { Region } from '../../types';
import { springPeeper } from '../species/spring-peeper';
// ... all species imports
import { withAudio, withPhoto } from '../withSpeciesData';

export const myRegion: Region = {
  id: '{region-id}',
  name: 'Display Name, ST',
  species: [
    springPeeper,
    // ...
  ].map(withAudio).map(withPhoto),
};
```

No per-region manifest imports needed — `withAudio` and `withPhoto` read from the global `src/data/audio.json` and `src/data/photos.json`.

### 5. Add any new species to `scripts/audio-config.json`

The config is a flat species map (no region nesting). If all species for the new region already exist in the config, nothing to add. For new species:

```json
{
  "species": {
    "my-new-species": {
      "taxonIds": [12345],
      "scientificName": "Genus species",
      "wikiCategories": ["Genus species"]
    }
  }
}
```

### 6. Register in `src/data/index.ts`

```ts
import { myRegion } from './regions/my-region';
export const REGIONS = [roanokeValley, tidewaterVirginia, myRegion];
```

### 7. Build check

```bash
npm run build
```

Fix any TypeScript errors before continuing.

### 8. Fetch audio for new species only

```bash
node scripts/fetch-audio.mjs --species=my-new-species
```

Omitting `--species` fetches for all species in the config. The script is safe to re-run; it only downloads files not already in the manifest.

### 9. Generate spectrograms

```bash
node scripts/gen-spectrograms.mjs
```

Processes all `public/audio/{species-id}/` dirs. Skips files where a PNG already exists, so re-running is safe.

### 10. Fetch photos for new species only

```bash
node scripts/fetch-photos-wiki.mjs --species=my-new-species
node scripts/fetch-photos.mjs --species=my-new-species
```

Omitting `--species` fetches for all species. Safe to re-run.

### 11. Review in admin panel

Start the dev server (`npm run dev`) and visit `/admin`. For each species, listen to samples, reorder so the clearest call is sample #1 (used in test mode), and delete obvious duplicates or poor-quality recordings.

---

## Known Gotchas

- **`.mpga` files** are MPEG audio and are valid but the extension isn't always recognized. It is listed in `gen-spectrograms.mjs` `AUDIO_EXTENSIONS`. If a new extension appears that has no spectrogram, add it there.
- **Taxon IDs** for `Dryophytes` species are in the `1668xxx` range, not `24xxx`. The `24xxx` range is mostly used by older taxonomy. Always verify before use.
- **Gray Treefrog Complex** uses two taxon IDs (both Cope's and Eastern Gray) to cast a wide net on iNaturalist.
