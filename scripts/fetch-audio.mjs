#!/usr/bin/env node
/**
 * Bulk-download frog call recordings from iNaturalist and update the audio manifest.
 *
 * Usage:
 *   node scripts/fetch-audio.mjs [--species=id1,id2] [--max N] [--dry-run]
 *
 * Defaults:
 *   --species : all species in audio-config.json
 *   --max     : 5  (max new downloads per species)
 *   --dry-run : false
 *
 * Accepted licenses: cc0, cc-by, cc-by-nc
 * Files are saved to: public/audio/{species-id}/
 * Manifest updated at: src/data/audio.json
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- CLI args ---
const args = process.argv.slice(2);
const speciesArg = args.find(a => a.startsWith('--species='))?.split('=')[1];
const maxNew = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '5');
const dryRun = args.includes('--dry-run');

const LICENSES = ['cc0', 'cc-by', 'cc-by-nc'];
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'audio.json');
const CONFIG_PATH = path.join(__dirname, 'audio-config.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const allSpecies = config.species;
if (!allSpecies) {
  console.error('audio-config.json missing top-level "species" key');
  process.exit(1);
}

const speciesFilter = speciesArg ? new Set(speciesArg.split(',')) : null;
const targetSpecies = speciesFilter
  ? Object.fromEntries(Object.entries(allSpecies).filter(([id]) => speciesFilter.has(id)))
  : allSpecies;

if (speciesFilter) {
  for (const id of speciesFilter) {
    if (!allSpecies[id]) console.warn(`  WARNING: unknown species id: ${id}`);
  }
}

const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  : {};

// --- Helpers ---
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

function extFrom(url) {
  const base = url.split('?')[0];
  return path.extname(base) || '.mp3';
}

function nextFilename(speciesId, ext) {
  const audioDir = path.join(ROOT, 'public', 'audio', speciesId);
  const existing = fs.existsSync(audioDir)
    ? fs.readdirSync(audioDir).filter(f => f.startsWith(`${speciesId}-`))
    : [];
  const nums = existing.map(f => parseInt(f.match(/-(\d+)\./)?.[1] ?? '0')).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${speciesId}-${next}${ext}`;
}

// --- Main ---
async function fetchForSpecies(speciesId, taxonIds) {
  const audioDir = path.join(ROOT, 'public', 'audio', speciesId);
  const existing = new Set((manifest[speciesId] ?? []).map(a => a.file));
  let downloaded = 0;

  for (const taxonId of taxonIds) {
    if (downloaded >= maxNew) break;
    console.log(`  [${speciesId}] querying taxon ${taxonId}...`);

    let page = 1;
    while (downloaded < maxNew) {
      const url = `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&sounds=true&per_page=20&page=${page}&order_by=votes&quality_grade=research`;
      const data = await getJson(url);
      if (!data.results?.length) break;

      for (const obs of data.results) {
        if (downloaded >= maxNew) break;
        for (const sound of (obs.sounds ?? [])) {
          if (downloaded >= maxNew) break;
          const lic = sound.license_code ?? '';
          if (!LICENSES.includes(lic)) continue;

          const fileUrl = sound.file_url;
          if (!fileUrl) continue;

          const ext = extFrom(fileUrl);
          const filename = nextFilename(speciesId, ext);
          const relFile = `${speciesId}/${filename}`;
          const absPath = path.join(ROOT, 'public', 'audio', relFile);

          if (existing.has(relFile)) continue;

          const attribution = sound.attribution ?? `iNaturalist observation #${obs.id}`;

          if (dryRun) {
            console.log(`  [DRY RUN] would download: ${relFile}`);
            console.log(`            attribution: ${attribution}`);
          } else {
            process.stdout.write(`  downloading ${relFile} ... `);
            try {
              const buf = await get(fileUrl);
              if (buf.length < 10000) {
                console.log(`skipped (${buf.length} bytes — too small)`);
                continue;
              }
              fs.mkdirSync(path.dirname(absPath), { recursive: true });
              fs.writeFileSync(absPath, buf);
              console.log(`${buf.length} bytes`);

              if (!manifest[speciesId]) manifest[speciesId] = [];
              manifest[speciesId].push({ file: relFile, attribution });
              existing.add(relFile);
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

  if (downloaded === 0) console.log(`  [${speciesId}] no new recordings found`);
  return downloaded;
}

async function main() {
  const speciesList = Object.keys(targetSpecies);
  console.log(`\nFetching audio for ${speciesList.length} species`);
  console.log(`Max new per species: ${maxNew}${dryRun ? '  [DRY RUN]' : ''}\n`);

  let total = 0;
  for (const [speciesId, cfg] of Object.entries(targetSpecies)) {
    total += await fetchForSpecies(speciesId, cfg.taxonIds);
  }

  if (!dryRun && total > 0) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\nManifest updated: ${MANIFEST_PATH}`);
  }

  console.log(`\nDone. ${total} new recording(s) downloaded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
