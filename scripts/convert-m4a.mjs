#!/usr/bin/env node
/**
 * Convert all .m4a audio files to .mp3, update src/data/audio.json,
 * and delete the originals.
 *
 * Spectrograms are unaffected — PNG filenames are derived from the audio
 * stem (e.g. american-bullfrog-1), which doesn't change.
 *
 * Usage:
 *   node scripts/convert-m4a.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'audio.json');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

// Collect all .m4a files
const m4aFiles = [];
for (const speciesDir of fs.readdirSync(AUDIO_DIR)) {
  const dir = path.join(AUDIO_DIR, speciesDir);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    if (file.toLowerCase().endsWith('.m4a')) {
      m4aFiles.push(path.join(dir, file));
    }
  }
}

if (m4aFiles.length === 0) {
  console.log('No .m4a files found. Nothing to do.');
  process.exit(0);
}

console.log(`\nConverting ${m4aFiles.length} .m4a files to .mp3${dryRun ? ' [DRY RUN]' : ''}...\n`);

let converted = 0;
let failed = 0;

for (const src of m4aFiles) {
  const dest = src.replace(/\.m4a$/i, '.mp3');
  const rel = path.relative(ROOT, src);
  const relDest = path.relative(ROOT, dest);

  if (dryRun) {
    console.log(`  [dry] ${rel} → ${relDest}`);
    converted++;
    continue;
  }

  process.stdout.write(`  ${rel} → ${relDest} ... `);
  try {
    execSync(
      `ffmpeg -y -i "${src}" -codec:a libmp3lame -q:a 2 "${dest}"`,
      { stdio: 'pipe' }
    );
    fs.unlinkSync(src);
    console.log('ok');
    converted++;
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    failed++;
  }
}

// Update manifest: replace .m4a with .mp3 in all file paths
if (!dryRun) {
  for (const [speciesId, entries] of Object.entries(manifest)) {
    manifest[speciesId] = entries.map(entry => ({
      ...entry,
      file: entry.file.replace(/\.m4a$/i, '.mp3'),
    }));
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nManifest updated: ${MANIFEST_PATH}`);
}

console.log(`\nDone. Converted: ${converted}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
