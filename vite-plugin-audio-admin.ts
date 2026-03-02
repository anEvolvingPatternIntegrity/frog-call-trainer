import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dev-only Vite plugin that serves a DELETE endpoint for the /admin prune page.
 * POST /api/admin/remove-audio  { regionId, speciesId, file }
 *   → deletes public/audio/{file}
 *   → removes entry from src/data/audio/{regionId}.json
 *   → Vite HMR picks up the JSON change automatically
 */
export function audioAdminPlugin(): Plugin {
  return {
    name: 'audio-admin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin/remove-audio', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk; });
        req.on('end', () => {
          try {
            const { regionId, speciesId, file } = JSON.parse(body) as {
              regionId: string;
              speciesId: string;
              file: string;
            };

            // Delete audio file
            const audioPath = path.join(process.cwd(), 'public', 'audio', file);
            if (fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }

            // Update manifest
            const manifestPath = path.join(
              process.cwd(), 'src', 'data', 'audio', `${regionId}.json`
            );
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<
              string,
              Array<{ file: string; attribution: string }>
            >;
            if (manifest[speciesId]) {
              manifest[speciesId] = manifest[speciesId].filter(a => a.file !== file);
            }
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });
    },
  };
}
