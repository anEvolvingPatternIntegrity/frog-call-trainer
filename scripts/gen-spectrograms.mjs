#!/usr/bin/env node
/**
 * gen-spectrograms.mjs — Generate spectrogram PNGs for frog call audio files.
 *
 * Usage:
 *   node scripts/gen-spectrograms.mjs --audition
 *     → Generates 4 method variants from american-bullfrog-1.mp3 into
 *       public/spectrograms/audition/ for visual comparison.
 *
 *   node scripts/gen-spectrograms.mjs [region-id] [--method=NAME]
 *     → Generates spectrograms for all audio files in public/audio/{region-id}/.
 *       Default region: roanoke-valley. Default method: ffmpeg-viridis.
 *       Skips files where the PNG already exists.
 *
 * Methods: sox | ffmpeg-intensity | ffmpeg-viridis | ffmpeg-fire
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac']);

// ─── Method runners ──────────────────────────────────────────────────────────

function runSox(inputPath, outputPath) {
  // -x width, -y height, -z dynamic range (dB), dark background by default
  execSync(
    `sox "${inputPath}" -n spectrogram -x 800 -y 200 -z 80 -o "${outputPath}"`,
    { stdio: 'inherit' }
  );
}

function runFfmpeg(inputPath, outputPath, color = 'intensity') {
  // showspectrumpic: log scale, gain=5 for visibility, legend=0 removes axes/labels/colorbar
  execSync(
    // aresample=16000 caps Nyquist at 8 kHz, removing blank high-frequency space
    `ffmpeg -y -i "${inputPath}" -lavfi "aresample=16000,showspectrumpic=s=800x200:color=${color}:scale=log:gain=5:legend=0" "${outputPath}"`,
    { stdio: 'pipe' }
  );
}

const METHODS = {
  sox: (input, output) => runSox(input, output),
  'ffmpeg-intensity': (input, output) => runFfmpeg(input, output, 'intensity'),
  'ffmpeg-viridis': (input, output) => runFfmpeg(input, output, 'viridis'),
  'ffmpeg-fire': (input, output) => runFfmpeg(input, output, 'fire'),
};

// ─── Audition mode ───────────────────────────────────────────────────────────

function runAudition() {
  const samplePath = join(projectRoot, 'public/audio/roanoke-valley/american-bullfrog-1.mp3');
  if (!existsSync(samplePath)) {
    console.error(`ERROR: Sample file not found: ${samplePath}`);
    process.exit(1);
  }

  const outDir = join(projectRoot, 'public/spectrograms/audition');
  mkdirSync(outDir, { recursive: true });

  const variants = [
    { name: 'audition-sox.png', method: 'sox' },
    { name: 'audition-ffmpeg-intensity.png', method: 'ffmpeg-intensity' },
    { name: 'audition-ffmpeg-viridis.png', method: 'ffmpeg-viridis' },
    { name: 'audition-ffmpeg-fire.png', method: 'ffmpeg-fire' },
  ];

  console.log('Generating audition variants from american-bullfrog-1.mp3...\n');

  for (const { name, method } of variants) {
    const outputPath = join(outDir, name);
    console.log(`  [${method}] → ${outputPath}`);
    try {
      METHODS[method](samplePath, outputPath);
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
    }
  }

  console.log(`\nAudition complete. Open public/spectrograms/audition/ to compare.`);
}

// ─── Full generation mode ────────────────────────────────────────────────────

function runGeneration(regionId, methodName) {
  const audioDir = join(projectRoot, `public/audio/${regionId}`);
  if (!existsSync(audioDir)) {
    console.error(`ERROR: Audio directory not found: ${audioDir}`);
    process.exit(1);
  }

  const runner = METHODS[methodName];
  if (!runner) {
    console.error(`ERROR: Unknown method "${methodName}". Choose from: ${Object.keys(METHODS).join(', ')}`);
    process.exit(1);
  }

  const outDir = join(projectRoot, `public/spectrograms/${regionId}`);
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(audioDir).filter((f) => AUDIO_EXTENSIONS.has(extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log(`No audio files found in ${audioDir}`);
    return;
  }

  console.log(`Generating spectrograms for ${files.length} files in ${regionId} using method=${methodName}\n`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const stem = basename(file, extname(file));
    const outputPath = join(outDir, `${stem}.png`);

    if (existsSync(outputPath)) {
      console.log(`  [skip] ${file}`);
      skipped++;
      continue;
    }

    const inputPath = join(audioDir, file);
    console.log(`  [gen]  ${file} → ${stem}.png`);
    try {
      runner(inputPath, outputPath);
      console.log(`  ✓`);
      generated++;
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--audition')) {
  runAudition();
} else {
  const regionId = args.find((a) => !a.startsWith('--')) ?? 'roanoke-valley';
  const methodArg = args.find((a) => a.startsWith('--method='));
  const methodName = methodArg ? methodArg.split('=')[1] : 'ffmpeg-intensity';
  runGeneration(regionId, methodName);
}
