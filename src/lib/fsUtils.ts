import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/** Write via temp file + fsync + rename so a crash can never leave a torn file. */
export async function writeFileAtomic(filePath: string, data: Buffer | string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.tmp-${process.pid}-${randomBytes(6).toString('hex')}`);
  const handle = await fs.open(tmp, 'w');
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(tmp, filePath);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}
