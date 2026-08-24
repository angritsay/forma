import fs from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from './app.js';
import { ConfigError, loadConfig, type Config } from './config.js';
import { ensureDir } from './lib/fsUtils.js';

/** Fail at boot — not at first sync — if the data volume isn't writable. */
async function ensureDataDirs(config: Config): Promise<void> {
  await ensureDir(path.join(config.dataDir, 'media'));
  const probe = path.join(config.dataDir, '.write-probe');
  await fs.writeFile(probe, 'ok');
  await fs.rm(probe);
}

async function main(): Promise<void> {
  let config: Config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`config error: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  try {
    await ensureDataDirs(config);
  } catch (err) {
    console.error(`data dir ${config.dataDir} is not writable: ${(err as Error).message}`);
    process.exit(1);
  }

  const app = buildApp(config);
  const server = app.listen(config.port, config.host, () => {
    console.log(`rolls-server listening on ${config.host}:${config.port}, data in ${config.dataDir}`);
  });

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      console.log(`${signal} received, shutting down`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
