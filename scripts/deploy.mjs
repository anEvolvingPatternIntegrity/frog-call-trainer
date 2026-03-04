#!/usr/bin/env node
/**
 * scripts/deploy.mjs — Build and deploy to S3 + CloudFront.
 *
 * Reads .aws-deploy.json (created by scripts/setup-aws.mjs).
 *
 * Cache strategy:
 *   dist/assets/**   → max-age=31536000, immutable  (Vite content-hashed filenames)
 *   dist/audio/**    → max-age=604800               (1 week — rarely changes)
 *   dist/spectrograms/** → max-age=604800
 *   dist/photos/**   → max-age=604800
 *   dist/index.html  → no-cache, no-store           (always fresh)
 *   everything else  → max-age=3600                 (1 hour)
 *
 * Usage:
 *   node scripts/deploy.mjs
 *   npm run deploy
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const configPath = join(root, '.aws-deploy.json');
const PROFILE = 'personal';

// ─── Load config ─────────────────────────────────────────────────────────────

if (!existsSync(configPath)) {
  console.error('\nERROR: .aws-deploy.json not found. Run node scripts/setup-aws.mjs first.\n');
  process.exit(1);
}

const { bucket, distributionId, distributionDomain } =
  JSON.parse(readFileSync(configPath, 'utf-8'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd) {
  const normalized = cmd.replace(/\s+/g, ' ').trim();
  process.stdout.write(`\n  $ ${normalized}\n`);
  execSync(normalized, { stdio: 'inherit', cwd: root });
}

function s3(args) {
  run(`aws s3 ${args} --profile ${PROFILE}`);
}

// ─── Deploy ──────────────────────────────────────────────────────────────────

console.log('\n🐸 Frog Call Trainer — Deploy');
console.log(`   Bucket:       s3://${bucket}`);
console.log(`   Distribution: ${distributionId}`);
console.log(`   URL:          https://${distributionDomain}\n`);

// 1. Build
console.log('── 1. Build ──────────────────────────────────────────────────────');
run('npm run build');

// 2. Hashed assets — cache forever (filenames change when content changes)
console.log('\n── 2. Assets (immutable) ─────────────────────────────────────────');
s3(`sync dist/assets/ s3://${bucket}/assets/
    --cache-control "max-age=31536000,immutable"
    --delete`);

// 3. Large binary assets — cache 1 week
console.log('\n── 3. Audio / Spectrograms / Photos (1-week cache) ───────────────');
for (const dir of ['audio', 'spectrograms', 'photos']) {
  s3(`sync dist/${dir}/ s3://${bucket}/${dir}/
      --cache-control "max-age=604800"
      --delete`);
}

// 4. Remaining files (e.g. public root files, favicon, etc.) — 1 hour cache
console.log('\n── 4. Other files (1-hour cache) ─────────────────────────────────');
s3(`sync dist/ s3://${bucket}/
    --exclude "assets/*"
    --exclude "audio/*"
    --exclude "spectrograms/*"
    --exclude "photos/*"
    --exclude "index.html"
    --cache-control "max-age=3600"
    --delete`);

// 5. index.html — never cache (ensures users always get the latest shell)
console.log('\n── 5. index.html (no-cache) ──────────────────────────────────────');
s3(`cp dist/index.html s3://${bucket}/index.html
    --cache-control "no-cache,no-store,must-revalidate"
    --content-type "text/html"`);

// 6. Invalidate CloudFront so stale cached files are evicted
console.log('\n── 6. CloudFront invalidation ────────────────────────────────────');
run(
  `aws cloudfront create-invalidation
    --distribution-id ${distributionId}
    --paths "/*"
    --profile ${PROFILE}`
);

console.log(`\n✅ Deployed! https://${distributionDomain}\n`);
