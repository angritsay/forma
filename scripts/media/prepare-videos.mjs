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
import { basename, dirname, extname, join } from 'node:path';
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
/** Flags that consume the next argument — their values must not be mistaken for the export dir. */
const VALUED = new Set(['--out', '--width', '--crf', '--manifest']);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const exportDir = args.find((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.has(args[i - 1])));
const outDir = flag('out', 'media/clips');
/** Rebuild contact sheets without re-encoding: the mp4s are done, the sampling changed. */
const framesOnly = args.includes('--frames-only');
const width = Number(flag('width', '720'));
const crf = Number(flag('crf', '28'));
/**
 * Where the identifications live. Deliberately *not* inside `--out`: the clips directory is
 * gitignored — 180 MB of paid content that never belongs in a public repository — so a manifest
 * written there is invisible to everyone else and starts from zero on a fresh clone. That is
 * exactly what happened: a run reported `identified: 0/145` while four identifications sat in
 * `media/manifest.json` all along. This path is version controlled and merged into, not replaced.
 */
const manifestPath = flag('manifest', 'media/manifest.json');

/**
 * Find the Telegram export without anyone having to type its name. Telegram names the folder
 * after the channel, so this one is `ChatExport_‼️НОВИЧКИ‼️` — emoji and all, which is miserable
 * to type and worse to paste correctly.
 *
 * The signature we look for is a directory containing `video_files/`, not the name: the folder
 * gets moved and nested (the first attempt missed it because it sat one level down inside another
 * folder), and a renamed export is still an export. Bounded to three levels and skipping the
 * places that make a home directory slow to walk, so this stays a search rather than a crawl.
 */
function findExports(maxDepth = 3) {
  const skip = new Set([
    'node_modules',
    '.git',
    'Library',
    'Applications',
    '.Trash',
    '.cache',
    '.npm',
    'dist',
  ]);
  const roots = [
    process.cwd(),
    join(process.cwd(), '..'),
    homedir(),
    join(homedir(), 'Downloads'),
    join(homedir(), 'Desktop'),
    join(homedir(), 'Documents'),
  ];
  const found = [];
  const visited = new Set();

  const walk = (dir, depth) => {
    if (depth > maxDepth || visited.has(dir)) return;
    visited.add(dir);
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    if (entries.some((e) => e.isDirectory() && e.name === 'video_files')) {
      found.push(dir);
      return; // an export contains no nested exports
    }
    for (const e of entries) {
      if (!e.isDirectory() || skip.has(e.name) || e.name.startsWith('.')) continue;
      walk(join(dir, e.name), depth + 1);
    }
  };

  for (const root of roots) walk(root, 0);
  // A folder actually named ChatExport* is the safer bet when there is more than one.
  return found.sort(
    (a, b) =>
      Number(basename(b).startsWith('ChatExport')) - Number(basename(a).startsWith('ChatExport')),
  );
}

const candidates = exportDir ? [] : findExports();
const resolved = exportDir ?? candidates[0];
if (!resolved || !existsSync(join(resolved, 'video_files'))) {
  console.error('Could not find the Telegram export.');
  console.error('');
  if (exportDir) {
    console.error(`  "${exportDir}" has no video_files/ directory inside it.`);
  } else {
    console.error('  Looked for a folder containing video_files/ here and three levels below:');
    console.error(`    ${process.cwd()}`);
    console.error(`    ${homedir()} , ~/Downloads, ~/Desktop, ~/Documents`);
  }
  console.error('');
  console.error('  Point at it directly instead. On macOS, drag the folder from Finder into');
  console.error('  Terminal and it pastes the path for you — no need to type the emoji:');
  console.error('    npm run media:prepare -- "/path/to/ChatExport_…"');
  console.error('');
  console.error('  To find it yourself:');
  console.error('    find ~ -maxdepth 5 -type d -name video_files 2>/dev/null');
  process.exit(1);
}
if (!exportDir) {
  console.log(`found export: ${resolved}`);
  for (const other of candidates.slice(1)) console.log(`  (also found, ignored: ${other})`);
  console.log('');
}

/**
 * Contact sheet grid. Four frames proved too few to tell a press from a thruster, but a single
 * long row is self-defeating: anything viewed gets scaled to fit a fixed width, so twelve frames
 * in one row are each *smaller* than eight. Six by two keeps the sheet under that ceiling, so
 * every tile stays full size and there are twelve of them.
 */
const COLS = 6;
const ROWS = 2;
const TILES = COLS * ROWS;
/**
 * Fraction of the clip to skip before sampling. Every clip opens with Sergey facing the camera
 * explaining the movement — he performs it several seconds in. Sampling the full duration spent a
 * quarter of the frames on a man standing still talking, which is why a dumbbell clean, snatch and
 * push press all reduced to the same three usable frames. Starting at 30% roughly doubles the
 * frames that actually show the movement, at no cost in file size.
 */
const SKIP_INTRO = 0.3;

/**
 * Clip length in seconds, parsed from ffmpeg's own banner — ffmpeg-static ships no ffprobe.
 * Returns 0 when it cannot be read, and the caller falls back to one frame per second.
 */
function durationOf(file) {
  try {
    execFileSync(ffmpeg, ['-i', file], { stdio: 'pipe' });
    return 0;
  } catch (err) {
    const text = String(err.stderr ?? '');
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  }
}

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
      /*
       * No audio track at all.
       *
       * These are demonstrations, and the app plays them the way it plays the drawn figure: a
       * short loop behind the timer. The coach films himself talking through each movement, which
       * is worth watching once and wrong to have start up on its own in the middle of a set.
       * Muting in the player was the old answer, but a muted <video> still carries the track,
       * still fetches it, and still leaves an unmute button implying there is something to hear.
       * Dropping it here is the honest version, and takes a tenth off every file.
       */
      '-an',
      '-movflags',
      '+faststart',
      out,
      '-y',
    ]);
  }
  const sheet = join(outDir, 'frames', `${clip.key}.jpg`);
  if (framesOnly || !existsSync(sheet)) {
    // Sample by *time*, not by frame number. Fixed indices (0, 90, 200, 320) assumed a long clip
    // at a known frame rate: on a 11-second clip the last index lands past the end and the strip
    // comes out short. Frames spread evenly also matters because four were not enough — the clip
    // that reads as a shoulder press is a thruster, and the squat only shows up in between.
    //
    // Seeking past the intro is what makes the rest of them legible: -ss before -i so ffmpeg skips
    // rather than decodes-and-discards, and the remaining span is what TILES divides into.
    const seconds = durationOf(out);
    const start = seconds > 0 ? seconds * SKIP_INTRO : 0;
    const span = seconds - start;
    const fps = span > 0 ? TILES / span : 1;
    execFileSync(ffmpeg, [
      '-v',
      'error',
      ...(start > 0 ? ['-ss', start.toFixed(2)] : []),
      '-i',
      out,
      '-vf',
      `fps=${fps.toFixed(4)},scale=200:-1,tile=${COLS}x${ROWS}`,
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

// Never clobber identifications already made. The note travels with the id: it records what was
// actually seen in the frames, which is the only reason to trust the id over a second guess.
if (existsSync(manifestPath)) {
  const prev = new Map(JSON.parse(readFileSync(manifestPath, 'utf8')).map((c) => [c.key, c]));
  for (const c of manifest) {
    const was = prev.get(c.key);
    if (!was?.exerciseId) continue;
    c.exerciseId = was.exerciseId;
    if (was.note) c.note = was.note;
  }
  // An identification whose clip is no longer in the export would be dropped without a word, and
  // it is the one thing here that cost real time to produce. Say so; do not delete it quietly.
  const keys = new Set(manifest.map((c) => c.key));
  for (const c of prev.values()) {
    if (!c.exerciseId || keys.has(c.key)) continue;
    console.error(`  kept: "${c.key}" (${c.exerciseId}) is identified but not in this export`);
    manifest.push(c);
  }
}
mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

// Entries carried over from a previous export have no file here, so they count towards neither.
const total = manifest.reduce((n, c) => n + (c.bytes ?? 0), 0);
console.log(`\n${seen.size} unique clips → ${outDir}  (${(total / 1e6).toFixed(0)} MB total)`);
console.log(
  `identified: ${manifest.filter((c) => c.exerciseId).length}/${manifest.length}  (${manifestPath})`,
);
