#!/usr/bin/env node
/**
 * Bulk-download frog species photos from iNaturalist and update the photo manifest.
 *
 * Usage:
 *   node scripts/fetch-photos.mjs [--species=id1,id2] [--max N] [--dry-run]
 *
 * Defaults:
 *   --species : all species in audio-config.json
 *   --max     : 5  (max new downloads per species)
 *
 * Accepted licenses: cc0, cc-by, cc-by-nc
 * Photos saved to: public/photos/{species-id}/
 * Manifest updated at: src/data/photos.json
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const speciesArg = args.find(a => a.startsWith('--species='))?.split('=')[1];
const maxNew = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '5');
const dryRun = args.includes('--dry-run');

const LICENSES = ['cc0', 'cc-by', 'cc-by-nc'];
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'photos.json');
const CONFIG_PATH = path.join(__dirname, 'audio-config.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const allSpecies = config.species;
if (!allSpecies) { console.error('audio-config.json missing "species" key'); process.exit(1); }

const speciesFilter = speciesArg ? new Set(speciesArg.split(',')) : null;
const targetSpecies = speciesFilter
  ? Object.fromEntries(Object.entries(allSpecies).filter(([id]) => speciesFilter.has(id)))
  : allSpecies;

const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  : {};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'frog-call-trainer/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function getJson(url) {
  return get(url).then(buf => JSON.parse(buf.toString()));
}

function mediumUrl(squareUrl) {
  return squareUrl.replace('/square.', '/medium.');
}

function nextFilename(speciesId, ext) {
  const photoDir = path.join(ROOT, 'public', 'photos', speciesId);
  const existing = fs.existsSync(photoDir)
    ? fs.readdirSync(photoDir).filter(f => f.startsWith(`${speciesId}-photo-`))
    : [];
  const nums = existing
    .map(f => parseInt(f.match(/-photo-(\d+)\./)?.[1] ?? '0'))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${speciesId}-photo-${next}${ext}`;
}

async function fetchForSpecies(speciesId, taxonIds) {
  const photoDir = path.join(ROOT, 'public', 'photos', speciesId);
  const entry = manifest[speciesId] ?? { selected: 0, photos: [] };
  const existingFiles = new Set(entry.photos.map(p => p.file));
  let downloaded = 0;

  for (const taxonId of taxonIds) {
    if (downloaded >= maxNew) break;
    console.log(`  [${speciesId}] querying taxon ${taxonId} for photos...`);

    let page = 1;
    while (downloaded < maxNew) {
      const url = `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&photos=true&photo_license=cc0,cc-by,cc-by-nc&quality_grade=research&per_page=20&page=${page}&order_by=votes`;
      const data = await getJson(url);
      if (!data.results?.length) break;

      for (const obs of data.results) {
        if (downloaded >= maxNew) break;
        for (const photo of (obs.photos ?? [])) {
          if (downloaded >= maxNew) break;
          const lic = photo.license_code ?? '';
          if (!LICENSES.includes(lic)) continue;

          const squareUrl = photo.url ?? '';
          if (!squareUrl) continue;
          const imgUrl = mediumUrl(squareUrl);
          const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
          const filename = nextFilename(speciesId, ext);
          const relFile = `${speciesId}/${filename}`;

          if (existingFiles.has(relFile)) continue;

          const attribution = photo.attribution ?? obs.user?.login ?? 'iNaturalist contributor';

          if (dryRun) {
            console.log(`  [DRY RUN] would download: ${relFile}`);
            console.log(`            ${attribution}`);
          } else {
            process.stdout.write(`  downloading ${relFile} ... `);
            try {
              const buf = await get(imgUrl);
              if (buf.length < 5000) {
                console.log(`skipped (${buf.length} bytes — too small)`);
                continue;
              }
              fs.mkdirSync(photoDir, { recursive: true });
              fs.writeFileSync(path.join(ROOT, 'public', 'photos', relFile), buf);
              console.log(`${buf.length} bytes`);

              entry.photos.push({ file: relFile, attribution, license: lic });
              existingFiles.add(relFile);
              downloaded++;
            } catch (err) {
              console.log(`failed: ${err.message}`);
            }
          }
        }
      }
      if (data.results.length < 20) break;
      page++;
    }
  }

  manifest[speciesId] = entry;
  if (downloaded === 0) console.log(`  [${speciesId}] no new photos found`);
  return downloaded;
}

async function main() {
  const speciesList = Object.keys(targetSpecies);
  console.log(`\nFetching iNaturalist photos for ${speciesList.length} species`);
  console.log(`Max new per species: ${maxNew}${dryRun ? '  [DRY RUN]' : ''}\n`);

  let total = 0;
  for (const [speciesId, cfg] of Object.entries(targetSpecies)) {
    total += await fetchForSpecies(speciesId, cfg.taxonIds);
  }

  if (!dryRun && total > 0) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\nManifest updated: ${MANIFEST_PATH}`);
  }

  console.log(`\nDone. ${total} new photo(s) downloaded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
