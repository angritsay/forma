#!/usr/bin/env node
/**
 * Seals a private page for committing: `node scripts/private/seal.mjs <page.html> [out]`.
 *
 * Writes the encrypted file (default `private/pitch.enc`) and prints the key, which goes into the
 * GitHub secret PRIVATE_PAGE_KEY and nowhere else — never into a file in this repository. Every run
 * makes a new key, so re-sealing a changed page means updating that secret too. See lib.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { seal } from './lib.mjs';

const [input, out = 'private/pitch.enc'] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/private/seal.mjs <page.html> [out.enc]');
  process.exit(1);
}

const { sealed, key } = seal(readFileSync(input, 'utf8'));
writeFileSync(out, sealed);
console.error(`[seal] wrote ${out}; the key below is PRIVATE_PAGE_KEY`);
console.log(key);
