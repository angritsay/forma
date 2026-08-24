export interface Config {
  /** Bearer token for /api/* (env SYNC_TOKEN, required, ≥16 chars). */
  syncToken: string;
  /** Root of all persisted state (env DATA_DIR, default /data). */
  dataDir: string;
  port: number;
  host: string;
  manifestMaxBytes: number;
  mediaMaxBytes: number;
  // P5 will add: mcpSecret (env MCP_SECRET) for the /mcp/{secret} mount.
}

export class ConfigError extends Error {}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ConfigError(`${name} must be a positive integer, got "${raw}"`);
  }
  return n;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const syncToken = env.SYNC_TOKEN ?? '';
  if (syncToken.length < 16) {
    throw new ConfigError('SYNC_TOKEN must be set and at least 16 characters (generate: openssl rand -hex 32)');
  }
  return {
    syncToken,
    dataDir: env.DATA_DIR || '/data',
    port: intEnv(env, 'PORT', 8080),
    host: env.HOST || '0.0.0.0',
    manifestMaxBytes: intEnv(env, 'MANIFEST_MAX_MB', 20) * 1024 * 1024,
    mediaMaxBytes: intEnv(env, 'MEDIA_MAX_MB', 10) * 1024 * 1024,
  };
}
