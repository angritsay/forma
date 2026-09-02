#!/usr/bin/env node
/**
 * Validates /content against the zod schemas and cross-reference rules.
 * Usage: npm run content:validate
 * Exit code 1 on any issue.
 */
import { spawnSync } from 'node:child_process';

// Delegates to the TypeScript registry through vitest so that path aliases resolve identically.
const res = spawnSync('npx', ['vitest', 'run', 'src/content/registry.test.ts', '--reporter=dot'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
