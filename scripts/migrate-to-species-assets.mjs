#!/usr/bin/env node
/**
 * One-time migration: region-scoped → species-scoped assets.
 *
 * What it does:
 *   1. Reads src/data/audio/{roanoke-valley,tidewater-virginia,coastal-nc}.json
 *      Deduplicates audio files by SHA-256 hash of file content.
 *      Copies unique files to public/audio/{species-id}/ numbered from 1.
 *      Writes src/data/audio.json (global manifest).
 *
 *   2. Reads src/data/photos/roanoke-valley.json (only populated manifest).
 *      Moves photo files from public/photos/roanoke-valley/ to public/photos/{species-id}/.
 *      Writes src/data/photos.json (global manifest).
 *
 *   3. Moves spectrograms from public/spectrograms/{region-id}/ to
 *      public/spectrograms/{species-id}/ matching audio filenames.
 *
 *   4. Removes old region-scoped directories and manifest files.
 *
 * Run once: node scripts/migrate-to-species-assets.mjs
 * Add --dry-run to preview without making changes.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const log = (...args) => console.log(...args);
const logDry = (...args) => dryRun && console.log('[DRY RUN]', ...args);

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureDir(dir) {
  if (!dryRun) fs.mkdirSync(dir, { recursive: true });
}

// ─── Audio migration ──────────────────────────────────────────────────────────

function migrateAudio() {
  log('\n── Audio migration ──────────────────────────────────────────────────────────');

  const REGION_IDS = ['roanoke-valley', 'tidewater-virginia', 'coastal-nc'];

  // Collect all audio entries per species across all regions
  const bySpecies = {};
  for (const regionId of REGION_IDS) {
    const manifestPath = path.join(ROOT, 'src', 'data', 'audio', `${regionId}.json`);
    if (!fs.existsSync(manifestPath)) { log(`  skip: ${manifestPath} not found`); continue; }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    for (const [speciesId, entries] of Object.entries(manifest)) {
      if (!bySpecies[speciesId]) bySpecies[speciesId] = [];
      for (const entry of entries) {
        bySpecies[speciesId].push({ ...entry, regionId });
      }
    }
  }

  const globalManifest = {};

  for (const [speciesId, entries] of Object.entries(bySpecies)) {
    log(`\n  ${speciesId} (${entries.length} entries across regions)`);
    const seen = new Map(); // hash → new filename
    const speciesAudioDir = path.join(ROOT, 'public', 'audio', speciesId);
    let counter = 1;
    const newEntries = [];

    for (const entry of entries) {
      const srcPath = path.join(ROOT, 'public', 'audio', entry.file);
      if (!fs.existsSync(srcPath)) {
        log(`    skip (file missing): ${entry.file}`);
        continue;
      }

      const hash = sha256(srcPath);
      if (seen.has(hash)) {
        log(`    dedup: ${entry.file} → already have ${seen.get(hash)}`);
        continue;
      }

      const ext = path.extname(entry.file);
      const newFilename = `${speciesId}-${counter}${ext}`;
      const newRelFile = `${speciesId}/${newFilename}`;
      const destPath = path.join(speciesAudioDir, newFilename);

      seen.set(hash, newRelFile);
      counter++;

      if (dryRun) {
        logDry(`    copy ${entry.file} → ${newRelFile}`);
      } else {
        ensureDir(speciesAudioDir);
        fs.copyFileSync(srcPath, destPath);
        log(`    ${entry.file} → ${newRelFile}`);
      }

      newEntries.push({ file: newRelFile, attribution: entry.attribution });

      // Also migrate spectrogram
      const oldStemName = path.basename(entry.file, ext);
      const newStemName = path.basename(newFilename, ext);
      const oldSpectro = path.join(ROOT, 'public', 'spectrograms', entry.regionId, `${oldStemName}.png`);
      const newSpectroDir = path.join(ROOT, 'public', 'spectrograms', speciesId);
      const newSpectro = path.join(newSpectroDir, `${newStemName}.png`);

      if (fs.existsSync(oldSpectro)) {
        if (dryRun) {
          logDry(`    spectro ${entry.regionId}/${oldStemName}.png → ${speciesId}/${newStemName}.png`);
        } else {
          ensureDir(newSpectroDir);
          fs.copyFileSync(oldSpectro, newSpectro);
        }
      }
    }

    globalManifest[speciesId] = newEntries;
    log(`  → ${newEntries.length} unique files for ${speciesId}`);
  }

  const outPath = path.join(ROOT, 'src', 'data', 'audio.json');
  if (dryRun) {
    logDry(`write ${outPath}`);
  } else {
    fs.writeFileSync(outPath, JSON.stringify(globalManifest, null, 2) + '\n');
    log(`\n  Wrote ${outPath}`);
  }

  return globalManifest;
}

// ─── Photo migration ──────────────────────────────────────────────────────────

function migratePhotos() {
  log('\n── Photo migration ──────────────────────────────────────────────────────────');

  const srcManifestPath = path.join(ROOT, 'src', 'data', 'photos', 'roanoke-valley.json');
  if (!fs.existsSync(srcManifestPath)) {
    log('  roanoke-valley photos manifest not found, skipping');
    return;
  }

  const srcManifest = JSON.parse(fs.readFileSync(srcManifestPath, 'utf-8'));
  const globalManifest = {};

  for (const [speciesId, entry] of Object.entries(srcManifest)) {
    log(`\n  ${speciesId} (${entry.photos.length} photos)`);
    const speciesPhotoDir = path.join(ROOT, 'public', 'photos', speciesId);
    const newPhotos = [];

    for (const photo of entry.photos) {
      const srcPath = path.join(ROOT, 'public', 'photos', photo.file);
      if (!fs.existsSync(srcPath)) {
        log(`    skip (file missing): ${photo.file}`);
        continue;
      }

      // photo.file is like "roanoke-valley/american-bullfrog-wiki-4.jpg"
      const filename = path.basename(photo.file);
      const newRelFile = `${speciesId}/${filename}`;
      const destPath = path.join(speciesPhotoDir, filename);

      if (dryRun) {
        logDry(`    move ${photo.file} → ${newRelFile}`);
      } else {
        ensureDir(speciesPhotoDir);
        fs.copyFileSync(srcPath, destPath);
        log(`    ${photo.file} → ${newRelFile}`);
      }

      newPhotos.push({ file: newRelFile, attribution: photo.attribution, license: photo.license });
    }

    globalManifest[speciesId] = { selected: entry.selected ?? 0, photos: newPhotos };
  }

  const outPath = path.join(ROOT, 'src', 'data', 'photos.json');
  if (dryRun) {
    logDry(`write ${outPath}`);
  } else {
    fs.writeFileSync(outPath, JSON.stringify(globalManifest, null, 2) + '\n');
    log(`\n  Wrote ${outPath}`);
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

function cleanup() {
  log('\n── Cleanup ──────────────────────────────────────────────────────────────────');

  const REGION_IDS = ['roanoke-valley', 'tidewater-virginia', 'coastal-nc'];

  // Old manifest files
  for (const regionId of REGION_IDS) {
    for (const type of ['audio', 'photos']) {
      const p = path.join(ROOT, 'src', 'data', type, `${regionId}.json`);
      if (fs.existsSync(p)) {
        if (dryRun) { logDry(`remove ${p}`); }
        else { fs.unlinkSync(p); log(`  removed ${p}`); }
      }
    }
  }

  // Remove old src/data/audio and src/data/photos dirs if empty
  for (const type of ['audio', 'photos']) {
    const dir = path.join(ROOT, 'src', 'data', type);
    if (fs.existsSync(dir)) {
      const remaining = fs.readdirSync(dir);
      if (remaining.length === 0) {
        if (dryRun) { logDry(`rmdir ${dir}`); }
        else { fs.rmdirSync(dir); log(`  removed ${dir}`); }
      } else {
        log(`  kept ${dir} (still has: ${remaining.join(', ')})`);
      }
    }
  }

  // Old public asset dirs
  for (const regionId of REGION_IDS) {
    for (const type of ['audio', 'spectrograms', 'photos']) {
      const dir = path.join(ROOT, 'public', type, regionId);
      if (fs.existsSync(dir)) {
        if (dryRun) { logDry(`rm -rf ${dir}`); }
        else { fs.rmSync(dir, { recursive: true }); log(`  removed ${dir}`); }
      }
    }
  }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

log(`\nMigrating assets to species-scoped directories${dryRun ? ' [DRY RUN]' : ''}...`);
migrateAudio();
migratePhotos();
cleanup();
log('\nDone.');
