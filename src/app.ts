import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import type { Config } from './config.js';
import { buildApiRouter } from './routes/api.js';

export function buildApp(config: Config): Express {
  const app = express();
  app.disable('x-powered-by');

  // Unauthenticated liveness probe for the container healthcheck; the authed
  // /api/health is the one that verifies the sync token.
  app.get('/healthz', (_req, res) => {
    res.type('text/plain').send('ok');
  });

  app.use('/api', buildApiRouter(config));

  // P5 mounts the MCP server here: app.use('/mcp/:secret', buildMcpRouter(config))

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { type?: string; status?: number };
    if (e.type === 'entity.too.large') {
      res.status(413).json({ error: 'payload_too_large' });
      return;
    }
    if (e.type === 'entity.parse.failed' || e.status === 400) {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }
    // No request URL in logs — /mcp/{secret} will carry a secret in its path.
    console.error('internal error:', err instanceof Error ? err.stack : err);
    res.status(500).json({ error: 'internal' });
  });

  return app;
}
