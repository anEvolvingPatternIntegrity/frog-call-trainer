# Audio Acquisition Guide

Place audio files in `public/audio/roanoke-valley/`.

## USGS ARMI (free, no attribution required)

Download from: https://www.umesc.usgs.gov/terrestrial/amphibians/armi/frog_calls/

| Filename to save as                     | ARMI source file            |
|-----------------------------------------|-----------------------------|
| `american-bullfrog-1.mp3`               | `bullfrog.mp3`              |
| `green-frog-1.mp3`                      | `green_frog.mp3`            |
| `wood-frog-1.mp3`                       | `woodfrog.mp3`              |
| `gray-treefrog-1.mp3`                   | `eastern_gray_treefrog.mp3` |
| `copes-gray-treefrog-1.mp3`             | `copes_gray_treefrog.mp3`   |
| `spring-peeper-1.mp3`                   | `spring_peeper.mp3`         |
| `american-toad-1.mp3`                   | `american_toad.mp3`         |
| `northern-cricket-frog-1.mp3`           | `cricket_frog.mp3`          |

## iNaturalist (CC-BY — attribution required)

Search for recordings at https://www.inaturalist.org/observations with `sounds=true`.
Update the `attribution` field in each species data file to match the actual recording.

| Filename to save as                     | Species                     |
|-----------------------------------------|-----------------------------|
| `pickerel-frog-1.m4a`                   | Pickerel Frog               |
| `upland-chorus-frog-1.mp3`              | Upland Chorus Frog          |
| `mountain-chorus-frog-1.mp3`            | Mountain Chorus Frog        |
| `fowlers-toad-1.mp3`                    | Fowler's Toad               |
| `eastern-narrowmouth-toad-1.mp3`        | Eastern Narrowmouth Toad    |

### iNaturalist API query example

```
GET https://api.inaturalist.org/v1/observations?taxon_id=24264&sounds=true&sound_license=cc0,cc-by&place_id=46
```

Replace `taxon_id` with the relevant taxon ID and record the `attribution` field for each chosen sound.

## Photos

Photos are referenced by URL from Wikimedia Commons in the species data files.
Update URLs in `src/data/species/*.ts` if any links break.
