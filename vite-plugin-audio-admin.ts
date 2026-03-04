import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only Vite plugin for the /admin page.
 *
 * POST /api/admin/remove-audio  { speciesId, file }
 *   → deletes public/audio/{file}, removes entry from src/data/audio.json
 *
 * POST /api/admin/reorder-audio { speciesId, file, direction }
 *   → reorders entry in src/data/audio.json
 *
 * POST /api/admin/select-photo  { speciesId, index }
 *   → updates "selected" index in src/data/photos.json
 *
 * POST /api/admin/remove-photo  { speciesId, file }
 *   → deletes public/photos/{file}, removes entry from src/data/photos.json,
 *     adjusts selected index if needed
 *
 * Vite HMR picks up all JSON changes automatically.
 */
export function audioAdminPlugin(): Plugin {
  function readBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
      req.on('error', reject);
    });
  }

  function ok(res: ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }

  function fail(res: ServerResponse, err: unknown) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }

  const AUDIO_MANIFEST = path.join(process.cwd(), 'src', 'data', 'audio.json');
  const PHOTO_MANIFEST = path.join(process.cwd(), 'src', 'data', 'photos.json');

  return {
    name: 'audio-admin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') { next(); return; }

        try {
          const body = await readBody(req);
          const url = req.url ?? '';

          if (url === '/remove-audio') {
            const { speciesId, file } = body as { speciesId: string; file: string };
            const audioPath = path.join(process.cwd(), 'public', 'audio', file);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

            const manifest = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, 'utf-8')) as Record<string, Array<{ file: string }>>;
            if (manifest[speciesId]) manifest[speciesId] = manifest[speciesId].filter(a => a.file !== file);
            fs.writeFileSync(AUDIO_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else if (url === '/select-photo') {
            const { speciesId, index } = body as { speciesId: string; index: number };
            const manifest = JSON.parse(fs.readFileSync(PHOTO_MANIFEST, 'utf-8')) as Record<string, { selected: number; photos: unknown[] }>;
            if (manifest[speciesId]) manifest[speciesId].selected = index;
            fs.writeFileSync(PHOTO_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else if (url === '/reorder-audio') {
            const { speciesId, file, direction } = body as { speciesId: string; file: string; direction: 'up' | 'down' };
            const manifest = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, 'utf-8')) as Record<string, Array<{ file: string }>>;
            const arr = manifest[speciesId];
            if (arr) {
              const idx = arr.findIndex((a) => a.file === file);
              const newIdx = direction === 'up' ? idx - 1 : idx + 1;
              if (idx !== -1 && newIdx >= 0 && newIdx < arr.length) {
                [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
              }
            }
            fs.writeFileSync(AUDIO_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else if (url === '/remove-photo') {
            const { speciesId, file } = body as { speciesId: string; file: string };
            const photoPath = path.join(process.cwd(), 'public', 'photos', file);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

            const manifest = JSON.parse(fs.readFileSync(PHOTO_MANIFEST, 'utf-8')) as Record<string, { selected: number; photos: Array<{ file: string }> }>;
            const entry = manifest[speciesId];
            if (entry) {
              const idx = entry.photos.findIndex(p => p.file === file);
              if (idx !== -1) {
                entry.photos.splice(idx, 1);
                if (entry.selected >= entry.photos.length) entry.selected = Math.max(0, entry.photos.length - 1);
              }
            }
            fs.writeFileSync(PHOTO_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else {
            next();
          }
        } catch (err) {
          fail(res, err);
        }
      });
    },
  };
}
