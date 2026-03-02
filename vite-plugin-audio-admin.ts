import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only Vite plugin for the /admin page.
 *
 * POST /api/admin/remove-audio  { regionId, speciesId, file }
 *   → deletes public/audio/{file}, removes entry from audio JSON
 *
 * POST /api/admin/select-photo  { regionId, speciesId, index }
 *   → updates "selected" index in photo JSON
 *
 * POST /api/admin/remove-photo  { regionId, speciesId, file }
 *   → deletes public/photos/{file}, removes entry from photo JSON,
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
            const { regionId, speciesId, file } = body as { regionId: string; speciesId: string; file: string };
            const audioPath = path.join(process.cwd(), 'public', 'audio', file);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

            const manifestPath = path.join(process.cwd(), 'src', 'data', 'audio', `${regionId}.json`);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, Array<{ file: string }>>;
            if (manifest[speciesId]) manifest[speciesId] = manifest[speciesId].filter(a => a.file !== file);
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else if (url === '/select-photo') {
            const { regionId, speciesId, index } = body as { regionId: string; speciesId: string; index: number };
            const manifestPath = path.join(process.cwd(), 'src', 'data', 'photos', `${regionId}.json`);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, { selected: number; photos: unknown[] }>;
            if (manifest[speciesId]) manifest[speciesId].selected = index;
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
            ok(res);

          } else if (url === '/remove-photo') {
            const { regionId, speciesId, file } = body as { regionId: string; speciesId: string; file: string };
            const photoPath = path.join(process.cwd(), 'public', 'photos', file);
            if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

            const manifestPath = path.join(process.cwd(), 'src', 'data', 'photos', `${regionId}.json`);
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, { selected: number; photos: Array<{ file: string }> }>;
            const entry = manifest[speciesId];
            if (entry) {
              const idx = entry.photos.findIndex(p => p.file === file);
              if (idx !== -1) {
                entry.photos.splice(idx, 1);
                if (entry.selected >= entry.photos.length) entry.selected = Math.max(0, entry.photos.length - 1);
              }
            }
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
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
