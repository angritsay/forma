#!/usr/bin/env node
/**
 * Turn a folder of clips named in Russian into web-ready mp4s, posters and a manifest.
 *
 *   node scripts/media/prepare-named.mjs ~/Downloads/Упражнения [--out media/clips] [--width 720]
 *
 * The sibling `prepare-videos.mjs` exists for the Telegram export, where the files are called
 * `104_IMG_9823.MOV` and a human has to watch each one to say what it shows. This one is for the
 * folder the owner shoots deliberately: every file is already named after the movement
 * («Ягодичный мост.mov»), so the identification is in the filename and `media/names.json` is the
 * one place that says which exercise id each name means.
 *
 * What it does per clip, all of it idempotent — an existing output is left alone:
 *
 *  - re-encodes to H.264/AAC-less mp4 at `--width`, `+faststart` so it plays before it has
 *    finished downloading. iPhone `.MOV` is usually HEVC, which Chrome and Firefox will not play.
 *  - **drops the audio track entirely.** These are demonstrations the app loops behind a timer;
 *    the coach talks through each movement, which is worth watching once and wrong to start up on
 *    its own mid-set. A muted `<video>` still carries and fetches the track.
 *  - cuts one still 45% in — past the intro, into the movement — as `posters/<id>.jpg`. That is
 *    what the app draws wherever the clip is not playing (`exerciseStillUrl`).
 *  - writes `<out>/manifest.json` in the shape `upload-videos.mjs` reads.
 *
 * Then, with the service role key for the length of one command:
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *     node scripts/media/upload-videos.mjs --dir media/clips --manifest media/clips/manifest.json
 *
 * A name with no id in `media/names.json` is reported and skipped, not guessed: an unnamed clip
 * uploaded against the wrong exercise is worse than no clip at all.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
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
const VALUED = new Set(['--out', '--width', '--crf', '--names']);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const srcDir = args.find((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.has(args[i - 1])));
const outDir = flag('out', 'media/clips');
const namesPath = flag('names', 'media/names.json');
const width = Number(flag('width', '720'));
const crf = Number(flag('crf', '28'));

if (!srcDir || !existsSync(srcDir)) {
  console.error(
    'usage: node scripts/media/prepare-named.mjs <folder of clips> [--out media/clips]',
  );
  process.exit(1);
}
if (!existsSync(namesPath)) {
  console.error(`no name map at ${namesPath}`);
  process.exit(1);
}

/**
 * Filename → exercise id, compared loosely.
 *
 * The names are typed by hand on a phone, so they arrive with a trailing space, «ё» written as
 * «е», and a capital where the map has none. Matching on a normalised key rather than the literal
 * string is what keeps a re-shoot named «Ягодичный мост .mov» from being reported as unknown.
 *
 * NFC FIRST, AND THAT IS THE WHOLE TRICK. macOS hands filenames over decomposed: «й» arrives as
 * «и» plus a combining breve, «ё» as «е» plus a diaeresis. The class below keeps only а-я, so the
 * combining mark became a space and «головой» keyed as «головои » — which matches nothing. Every
 * one of the thirteen clips this skipped on the owner's Mac had a «й» in its name, and none of the
 * ones it matched did.
 */
const key = (s) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

/** @type {{file: string, exerciseId: string, note?: string}[]} */
const names = JSON.parse(readFileSync(namesPath, 'utf8'));
const idByName = new Map(names.map((n) => [key(n.file), n.exerciseId]));
const noteByName = new Map(names.map((n) => [key(n.file), n.note ?? '']));

/**
 * The id for a filename, allowing for a parenthetical.
 *
 * A movement with two names gets filmed as «Червячок (гусеница).mov» — the second name written in
 * so whoever opens the folder knows it is the same thing. The whole string matches nothing, so
 * after the exact key we try what is outside the brackets and then what is inside: either half
 * alone is a name the map knows.
 */
function idFor(name) {
  const exact = idByName.get(key(name));
  if (exact) return exact;
  const inside = /\(([^)]*)\)/.exec(name)?.[1];
  const outside = name.replace(/\([^)]*\)/g, ' ');
  for (const part of [outside, inside]) {
    const id = part ? idByName.get(key(part)) : undefined;
    if (id) return id;
  }
  return undefined;
}

const clips = readdirSync(srcDir)
  .filter((f) => /\.(mov|mp4|m4v)$/i.test(f))
  .sort();

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'posters'), { recursive: true });

/** Clip length in seconds from ffmpeg's own banner — ffmpeg-static ships no ffprobe. */
function durationOf(file) {
  try {
    execFileSync(ffmpeg, ['-i', file], { stdio: 'pipe' });
    return 0;
  } catch (err) {
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(String(err.stderr ?? ''));
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  }
}

/** Far enough in to be the movement rather than the coach walking into frame. */
const POSTER_AT = 0.45;
const POSTER_WIDTH = 640;

const manifest = [];
const unknown = [];
/** Which filename already claimed each id, so a second one is reported rather than overwriting. */
const takenBy = new Map();
let encoded = 0;

for (const file of clips) {
  const name = basename(file, extname(file));
  const id = idFor(name);
  if (!id) {
    unknown.push({ name, note: noteByName.get(key(name)) });
    continue;
  }
  /*
   * One movement can have two names — «Червячок» is what the coach says and «Гусеница» is what
   * the library called it — so the map points both at one id. Only the first file wins; the
   * second would otherwise silently overwrite the first's mp4 and still be a duplicate entry
   * that upload-videos.mjs refuses.
   */
  const taken = takenBy.get(id);
  if (taken) {
    console.log(`  skipped  ${name} — ${taken} is already the clip for ${id}`);
    continue;
  }
  takenBy.set(id, name);

  const src = join(srcDir, file);
  const out = join(outDir, `${id}.mp4`);
  if (!existsSync(out)) {
    process.stdout.write(`  ${id} … `);
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
      '-an',
      '-movflags',
      '+faststart',
      out,
      '-y',
    ]);
    encoded++;
    console.log('ok');
  }

  const poster = join(outDir, 'posters', `${id}.jpg`);
  if (!existsSync(poster)) {
    const seconds = durationOf(out);
    const at = seconds > 0 ? seconds * POSTER_AT : 0;
    execFileSync(ffmpeg, [
      '-v',
      'error',
      ...(at > 0 ? ['-ss', at.toFixed(2)] : []),
      '-i',
      out,
      '-vf',
      `scale='min(${POSTER_WIDTH},iw)':-2`,
      '-frames:v',
      '1',
      '-q:v',
      '4',
      poster,
      '-y',
    ]);
  }

  manifest.push({ key: id, file: `${id}.mp4`, exerciseId: id, source: name });
}

writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\n${manifest.length} clips ready (${encoded} newly encoded) in ${outDir}`);
if (unknown.length) {
  console.log(`\n${unknown.length} clips have no exercise id in ${namesPath} and were skipped:`);
  for (const u of unknown) console.log(`  ${u.name}${u.note ? ` — ${u.note}` : ''}`);
  console.log('\nFill in `exerciseId` for the ones that should go up, then run this again.');
}
console.log(
  `\nNext: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \\\n` +
    `  node scripts/media/upload-videos.mjs --dir ${outDir} --manifest ${join(outDir, 'manifest.json')}`,
);
