#!/usr/bin/env node
/**
 * Turn a Telegram channel export into web-ready exercise clips plus a manifest.
 *
 *   node scripts/media/prepare-videos.mjs <export-dir> [--out media/clips] [--width 720]
 *
 * The export is what "Export chat history (with videos, HTML)" produces: `messages.html`,
 * `video_files/`, `thumbs/`. Two things make it awkward, and this script handles both:
 *
 *  - **The same clip is posted many times.** Telegram numbers each *message*, so one exercise
 *    filmed once appears as 96_IMG_9823.MP4, 104_IMG_9823.MP4, 121_IMG_9823.MP4 and so on. We key
 *    on the camera's own filename (IMG_9823) and keep one copy.
 *  - **iPhone .MOV.** Often HEVC, which Chrome and Firefox will not play. Everything is
 *    re-encoded to H.264/AAC in an MP4 with the moov atom at the front so it starts streaming
 *    before it has finished downloading.
 *
 * The clips carry no captions, so this script cannot say which exercise each one shows. It emits
 * `manifest.json` with an empty `exerciseId` per clip and a contact sheet per clip under
 * `frames/`; filling that in is a human (or model) watching them. See docs/VIDEO.md.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let ffmpeg;
try {
  ffmpeg = require('ffmpeg-static');
} catch {
  console.error('ffmpeg-static is missing. Run `npm install` in the repository first.');
  process.exit(1);
}

const args = process.argv.slice(2);
const exportDir = args.find((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const outDir = flag('out', 'media/clips');
const width = Number(flag('width', '720'));
const crf = Number(flag('crf', '28'));

/**
 * Find the Telegram export without anyone having to type its name. Telegram names the folder
 * after the channel, so this one is `ChatExport_‼️НОВИЧКИ‼️` — emoji and all, which is miserable
 * to type and worse to paste correctly. Look in the usual places instead.
 */
function findExport() {
  const roots = [
    process.cwd(),
    homedir(),
    join(homedir(), 'Downloads'),
    join(homedir(), 'Desktop'),
  ];
  for (const root of roots) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory() || !e.name.startsWith('ChatExport')) continue;
      const dir = join(root, e.name);
      if (existsSync(join(dir, 'video_files'))) return dir;
    }
  }
  return undefined;
}

const resolved = exportDir ?? findExport();
if (!resolved || !existsSync(join(resolved, 'video_files'))) {
  console.error('Could not find the Telegram export.');
  console.error('');
  console.error('  Run this from inside the repository, and either pass the folder:');
  console.error(
    '    node scripts/media/prepare-videos.mjs ~/Downloads/ChatExport_… --out media/clips',
  );
  console.error('');
  console.error('  ...or just let it look in ~, ~/Downloads and ~/Desktop:');
  console.error('    node scripts/media/prepare-videos.mjs');
  console.error('');
  if (exportDir) console.error(`  (no video_files/ inside "${exportDir}")`);
  process.exit(1);
}
if (!exportDir) console.log(`found export: ${resolved}\n`);

/** Camera filename without Telegram's per-message prefix: 104_IMG_9823.MP4 → IMG_9823. */
const sourceKey = (file) => basename(file, extname(file)).replace(/^\d+_/, '');

/** Message order, so clips keep the sequence the coach posted them in. */
const messageNo = (file) => Number(/^(\d+)_/.exec(basename(file))?.[1] ?? 0);

const videoDir = join(resolved, 'video_files');
const seen = new Map();
for (const file of readdirSync(videoDir).sort((a, b) => messageNo(a) - messageNo(b))) {
  if (!/\.(mov|mp4)$/i.test(file)) continue;
  const key = sourceKey(file);
  // Keep the earliest posting of each clip: that is where it was introduced.
  if (!seen.has(key)) seen.set(key, { key, file, messages: [] });
  seen.get(key).messages.push(messageNo(file));
}

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'frames'), { recursive: true });

const manifest = [];
let done = 0;
for (const clip of seen.values()) {
  const src = join(videoDir, clip.file);
  const out = join(outDir, `${clip.key}.mp4`);
  if (!existsSync(out)) {
    execFileSync(ffmpeg, [
      '-v',
      'error',
      '-i',
      src,
      '-vf',
      `scale='min(${width},iw)':-2`,
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      String(crf),
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-movflags',
      '+faststart',
      out,
      '-y',
    ]);
  }
  // Four evenly spread frames: the first is him introducing the movement, the rest show it.
  const sheet = join(outDir, 'frames', `${clip.key}.jpg`);
  if (!existsSync(sheet)) {
    execFileSync(ffmpeg, [
      '-v',
      'error',
      '-i',
      out,
      '-vf',
      "select='eq(n\\,0)+eq(n\\,90)+eq(n\\,200)+eq(n\\,320)',scale=260:-1,tile=4x1",
      '-frames:v',
      '1',
      '-vsync',
      '0',
      sheet,
      '-y',
    ]);
  }
  manifest.push({
    key: clip.key,
    file: `${clip.key}.mp4`,
    bytes: statSync(out).size,
    postedAs: clip.messages,
    /** Fill this in by watching frames/<key>.jpg — see docs/VIDEO.md. */
    exerciseId: '',
  });
  console.log(
    `${String(++done).padStart(3)}/${seen.size}  ${clip.key}  ${(statSync(out).size / 1e6).toFixed(1)} MB`,
  );
}

// Never clobber identifications already made.
const manifestPath = join(outDir, 'manifest.json');
if (existsSync(manifestPath)) {
  const prev = new Map(JSON.parse(readFileSync(manifestPath, 'utf8')).map((c) => [c.key, c]));
  for (const c of manifest)
    if (prev.get(c.key)?.exerciseId) c.exerciseId = prev.get(c.key).exerciseId;
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const total = manifest.reduce((n, c) => n + c.bytes, 0);
console.log(
  `\n${manifest.length} unique clips → ${outDir}  (${(total / 1e6).toFixed(0)} MB total)`,
);
console.log(`identified: ${manifest.filter((c) => c.exerciseId).length}/${manifest.length}`);
