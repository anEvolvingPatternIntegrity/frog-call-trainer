#!/usr/bin/env node
/**
 * Download species photos from Wikimedia Commons and update the photo manifest.
 *
 * Usage:
 *   node scripts/fetch-photos-wiki.mjs [--species=id1,id2] [--max N] [--dry-run]
 *
 * Defaults:
 *   --species : all species in audio-config.json
 *   --max     : 5  (max new downloads per species, across all wikiCategories)
 *
 * Accepted licenses: CC0, CC BY, CC BY-SA (and versioned variants), Public Domain
 * Photos saved to: public/photos/{species-id}/
 * Manifest updated at: src/data/photos.json
 *
 * Files are named: {species-id}-wiki-{n}.{ext}
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const speciesArg = args.find(a => !a.startsWith('--') ? false : a.startsWith('--species='));
const speciesArgVal = args.find(a => a.startsWith('--species='))?.split('=')[1];
const maxNew = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '5');
const dryRun = args.includes('--dry-run');

const WIKI_API = 'https://commons.wikimedia.org/w/api.php';
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'photos.json');
const CONFIG_PATH = path.join(__dirname, 'audio-config.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const allSpecies = config.species;
if (!allSpecies) { console.error('audio-config.json missing "species" key'); process.exit(1); }

const speciesFilter = speciesArgVal ? new Set(speciesArgVal.split(',')) : null;
const targetSpecies = speciesFilter
  ? Object.fromEntries(Object.entries(allSpecies).filter(([id]) => speciesFilter.has(id)))
  : allSpecies;

const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  : {};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'frog-call-trainer/1.0 (educational; contact via github)' } }, res => {
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function licenseOk(lic) {
  if (!lic) return false;
  const l = lic.toLowerCase();
  return (
    l.includes('cc0') ||
    l.includes('public domain') ||
    l === 'pd' ||
    l.startsWith('cc by ') ||
    l.startsWith('cc-by ') ||
    l === 'cc by' ||
    l === 'cc-by' ||
    l.startsWith('cc by-sa') ||
    l.startsWith('cc-by-sa')
  );
}

function normalizeExt(url) {
  const base = url.split('?')[0];
  const ext = path.extname(base).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  return '.jpg';
}

function nextWikiFilename(speciesId, ext) {
  const photoDir = path.join(ROOT, 'public', 'photos', speciesId);
  const existing = fs.existsSync(photoDir)
    ? fs.readdirSync(photoDir).filter(f => f.startsWith(`${speciesId}-wiki-`))
    : [];
  const nums = existing
    .map(f => parseInt(f.match(/-wiki-(\d+)\./)?.[1] ?? '0'))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${speciesId}-wiki-${next}${ext}`;
}

async function fetchCategoryPage(category, continueToken) {
  let url = `${WIKI_API}?action=query&generator=categorymembers&gcmtitle=Category:${encodeURIComponent(category)}&gcmtype=file&gcmnamespace=6&gcmlimit=20&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=800&format=json`;
  if (continueToken) url += `&gcmcontinue=${encodeURIComponent(continueToken)}`;
  return getJson(url);
}

async function fetchForSpecies(speciesId, cfg) {
  const categories = cfg.wikiCategories ?? [];
  if (!categories.length) {
    console.log(`  [${speciesId}] no wikiCategories configured, skipping`);
    return 0;
  }

  const photoDir = path.join(ROOT, 'public', 'photos', speciesId);
  const entry = manifest[speciesId] ?? { selected: 0, photos: [] };
  const existingFiles = new Set(entry.photos.map(p => p.file));
  let downloaded = 0;
  const maxAttempts = maxNew * 6;
  let attempts = 0;

  for (const category of categories) {
    if (downloaded >= maxNew || attempts >= maxAttempts) break;
    console.log(`  [${speciesId}] querying Commons category: ${category}`);

    let continueToken = null;
    let pageCount = 0;

    while (downloaded < maxNew && attempts < maxAttempts && pageCount < 5) {
      const data = await fetchCategoryPage(category, continueToken);
      const pages = Object.values(data.query?.pages ?? {});
      if (!pages.length) break;

      for (const page of pages) {
        if (downloaded >= maxNew || attempts >= maxAttempts) break;
        const info = page.imageinfo?.[0];
        if (!info) continue;

        const pageTitle = (page.title ?? '').toLowerCase();
        const titleExt = path.extname(pageTitle);
        if (!['.jpg', '.jpeg', '.png'].includes(titleExt)) continue;

        const meta = info.extmetadata ?? {};
        const lic = meta.LicenseShortName?.value ?? meta.License?.value ?? '';
        if (!licenseOk(lic)) continue;

        const imgUrl = info.url;
        if (!imgUrl) continue;
        const ext = normalizeExt(imgUrl);
        const filename = nextWikiFilename(speciesId, ext);
        const relFile = `${speciesId}/${filename}`;
        if (existingFiles.has(relFile)) continue;

        const artist = stripHtml(meta.Artist?.value ?? meta.Credit?.value ?? 'Wikimedia Commons');
        const attribution = artist ? `${artist} / Wikimedia Commons, ${lic}` : `Wikimedia Commons, ${lic}`;

        if (dryRun) {
          console.log(`  [DRY RUN] would download: ${relFile}`);
          console.log(`            ${attribution}`);
          downloaded++;
        } else {
          process.stdout.write(`  downloading ${relFile} ... `);
          attempts++;
          try {
            await sleep(1500);
            const buf = await get(imgUrl);
            if (buf.length < 5000) {
              console.log(`skipped (${buf.length} bytes — rate-limited or too small)`);
              continue;
            }
            if (buf.length > 8_000_000) {
              console.log(`skipped (${buf.length} bytes — too large, likely a high-res scan)`);
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

      continueToken = data.continue?.gcmcontinue ?? null;
      if (!continueToken) break;
      pageCount++;
    }
  }

  manifest[speciesId] = entry;
  if (downloaded === 0) console.log(`  [${speciesId}] no new photos found`);
  return downloaded;
}

async function main() {
  const speciesList = Object.keys(targetSpecies);
  console.log(`\nFetching Wikimedia Commons photos for ${speciesList.length} species`);
  console.log(`Max new per species: ${maxNew}${dryRun ? '  [DRY RUN]' : ''}\n`);

  let total = 0;
  for (const [speciesId, cfg] of Object.entries(targetSpecies)) {
    total += await fetchForSpecies(speciesId, cfg);
  }

  if (!dryRun && total > 0) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\nManifest updated: ${MANIFEST_PATH}`);
  }

  console.log(`\nDone. ${total} new photo(s) downloaded.`);
}

main().catch(err => { console.error(err); process.exit(1); });
