#!/usr/bin/env node
/**
 * The «Студия» render worker: turns queued studio clips (0060 `media_clips`) into the exercise's
 * clip, still and site loop.
 *
 *   node scripts/media/render-clips.mjs              claim and render the queue (needs the env below)
 *   node scripts/media/render-clips.mjs --peek       print how many clips are waiting, nothing else
 *   node scripts/media/render-clips.mjs --local <input.mp4> <params.json> [--out <dir>]
 *                                                    render one piece on this machine, no Supabase
 *
 * Worker mode reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment
 * (.github/workflows/media-render.yml fetches the key and masks it). It prints counters only —
 * never a key, a URL with a token, a path or a row — because the Actions log is public.
 *
 * For each clip it claims (`media_render_claim`, a lease, `for update skip locked`):
 *
 *  1. downloads the uploaded piece from the private `raw` bucket;
 *  2. encodes it in one ffmpeg pass: an exact trim (`-ss raw_offset_s` before the input, which
 *     decodes from the keyframe and drops frames up to the exact time, then `-t end_s − start_s`),
 *     the crop, the grade as a 3D LUT (`lut3d`, the `.cube` written by `gradeToLut` — the function
 *     the admin's preview samples), `scale='min(1080,iw)':-2`, and the x264 settings of
 *     prepare-videos.mjs (slow, crf 28, yuv420p, no audio, faststart);
 *  3. cuts the still at 45% (as prepare-videos.mjs) and the 4-second loop (as the site-loops task);
 *  4. uploads videos/shared/<id>.ru.mp4 (and .en.mp4 when the exercise has no English clip — the
 *     clips are silent, so it is the same file), images/exercises/<id>.jpg, images/loops/<id>.mp4,
 *     all with upsert;
 *  5. `media_render_done` points the exercise at the clip; on an error `media_render_failed` with
 *     a short reason, which requeues it until the third attempt.
 *
 * ffmpeg: $FFMPEG if set, else ffmpeg-static when installed (a laptop), else `ffmpeg` on PATH (CI,
 * which installs it with apt and skips `npm ci`: this script needs nothing from node_modules).
 *
 * `--local` takes a params file shaped like a claimed row — `{ raw_offset_s, start_s, end_s, crop,
 * grade, grade_version }` — writes clip.mp4, still.jpg, loop.mp4 and grade.cube to `--out` (a new
 * temp dir by default) and prints their paths as JSON. scripts/media/render-clips.test.mjs runs
 * it on a synthetic video and checks the graded frames against the JS math.
 */
import { execFile } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire, register } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

// --- settings that must match the rest of the pipeline -----------------------------------------

/** Clip width ceiling; the plan's 1080 rather than prepare-videos' 720: these are filmed for it. */
export const CLIP_WIDTH = 1080;
/** x264 exactly as scripts/media/prepare-videos.mjs. */
export const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p'];
/** The still: prepare-videos.mjs POSTER_AT / POSTER_WIDTH, -q:v 4. */
export const STILL_AT = 0.45;
export const STILL_WIDTH = 640;
/** The loop: the site-loops task in supabase-apply.yml (from 1.0 s, 4 s, 480 px, veryfast/30). */
export const LOOP_FROM = 1.0;
export const LOOP_SECONDS = 4;
export const LOOP_X264 = [
  '-c:v',
  'libx264',
  '-preset',
  'veryfast',
  '-crf',
  '30',
  '-pix_fmt',
  'yuv420p',
];
/**
 * BT.709 throughout. The LUT runs in RGB; without these the conversion back to YUV would use
 * swscale's BT.601 default on an HD picture and shift every colour the grade was judged by, and
 * an untagged file leaves the browser to guess.
 */
const COLOUR_TAGS = [
  '-colorspace',
  'bt709',
  '-color_primaries',
  'bt709',
  '-color_trc',
  'bt709',
  '-color_range',
  'tv',
];

/** Clips per run and the time after which a run stops claiming (the workflow stops at 25 min). */
const MAX_CLIPS_PER_RUN = 20;
const RUN_BUDGET_MS = 18 * 60 * 1000;
/**
 * No ffmpeg call outlives this point of the run. The job is killed at 25 minutes; a clip stopped
 * here is reported as failed (requeued while attempts remain) instead of dying with the runner and
 * waiting out its lease.
 */
const HARD_STOP_MS = 23 * 60 * 1000;
/** One storage download or upload. */
const TRANSFER_TIMEOUT_MS = 8 * 60 * 1000;
/** Mirrors `media_render_max_attempts()` (0060), for the counters only. */
const MAX_ATTEMPTS = 3;
/** The lease asked for: longer than a run, so a live run is never overtaken. */
const LEASE_SECONDS = 1800;

// --- pure helpers (tested) -----------------------------------------------------------------------

const EXERCISE_ID_RE = /^[a-z0-9_]{2,60}$/;
const RAW_PATH_RE = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]{2,5}$/;

/** A path inside a filtergraph option: `\`, `'` and `:` are what the parser would read. */
export function filterPath(p) {
  return `'${String(p).replace(/\\/g, '/').replace(/'/g, "'\\''").replace(/:/g, '\\:')}'`;
}

/** Seconds as ffmpeg takes them, to the millisecond. */
export const secs = (n) => Math.max(0, Number(n)).toFixed(3);

/** The clip's length, from its marks. */
export const clipSeconds = (job) => Number(job.end_s) - Number(job.start_s);

/**
 * The video filter chain: crop, then the grade, then size and colour for the encoder.
 * `cropFilter` is ffmpegCrop(crop) or null; `cubePath` null for an identity grade.
 */
export function clipFilters({ cropFilter, cubePath }) {
  const chain = [];
  if (cropFilter) chain.push(cropFilter);
  if (cubePath) chain.push(`lut3d=file=${filterPath(cubePath)}:interp=trilinear`);
  chain.push(`scale=w='min(${CLIP_WIDTH},iw)':h=-2:out_color_matrix=bt709:out_range=tv`);
  chain.push('format=yuv420p');
  return chain.join(',');
}

export function clipArgs({ input, output, offset, seconds, filters }) {
  return [
    '-nostdin',
    '-v',
    'error',
    '-y',
    '-ss',
    secs(offset),
    '-i',
    input,
    '-t',
    secs(seconds),
    '-map',
    '0:v:0',
    '-vf',
    filters,
    ...X264,
    ...COLOUR_TAGS,
    '-an',
    '-movflags',
    '+faststart',
    output,
  ];
}

export function stillArgs({ input, output, seconds }) {
  const at = seconds * STILL_AT;
  return [
    '-nostdin',
    '-v',
    'error',
    '-y',
    ...(at > 0 ? ['-ss', at.toFixed(2)] : []),
    '-i',
    input,
    '-vf',
    `scale='min(${STILL_WIDTH},iw)':-2`,
    '-frames:v',
    '1',
    '-q:v',
    '4',
    output,
  ];
}

/** From 1.0 s like the site loops; a clip too short for that ends its loop at its own end. */
export function loopArgs({ input, output, seconds }) {
  const from =
    seconds >= LOOP_FROM + LOOP_SECONDS ? LOOP_FROM : Math.max(0, seconds - LOOP_SECONDS);
  return [
    '-nostdin',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    from.toFixed(1),
    '-i',
    input,
    '-t',
    String(LOOP_SECONDS),
    '-an',
    '-vf',
    'scale=480:-2',
    ...LOOP_X264,
    '-movflags',
    '+faststart',
    output,
  ];
}

/** The storage objects a rendered clip becomes. */
export function uploadPlan(exerciseId, withEn) {
  if (!EXERCISE_ID_RE.test(exerciseId)) throw new Error('bad_exercise_id');
  return [
    {
      kind: 'clip',
      bucket: 'videos',
      path: `shared/${exerciseId}.ru.mp4`,
      type: 'video/mp4',
      cache: 31536000,
    },
    ...(withEn
      ? [
          {
            kind: 'clip',
            bucket: 'videos',
            path: `shared/${exerciseId}.en.mp4`,
            type: 'video/mp4',
            cache: 31536000,
          },
        ]
      : []),
    {
      kind: 'still',
      bucket: 'images',
      path: `exercises/${exerciseId}.jpg`,
      type: 'image/jpeg',
      cache: 86400,
    },
    {
      kind: 'loop',
      bucket: 'images',
      path: `loops/${exerciseId}.mp4`,
      type: 'video/mp4',
      cache: 86400,
    },
  ];
}

/** A short, path-free reason for the admin, from whatever went wrong. */
export function shortError(err) {
  const raw = String(
    err?.code && String(err.code).match(/^[a-z_]+$/) ? err.code : (err?.message ?? err),
  );
  const line =
    raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .pop() ?? 'render_failed';
  return line.replace(/\/[^\s'":]+/g, '…').slice(0, 200);
}

class JobError extends Error {
  /** `final`: retrying cannot help (missing piece, unknown grade). */
  constructor(code, final = false) {
    super(code);
    this.code = code;
    this.final = final;
  }
}

// --- ffmpeg ------------------------------------------------------------------------------------

export function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    const p = createRequire(import.meta.url)('ffmpeg-static');
    if (p && existsSync(p)) return p;
  } catch {
    /* not installed: CI uses the system one */
  }
  return 'ffmpeg';
}

function run(bin, args, deadline) {
  const timeout = deadline ? Math.max(1000, deadline - Date.now()) : 0;
  return new Promise((ok, fail) => {
    execFile(bin, args, { maxBuffer: 64 * 1024 * 1024, timeout }, (err, _stdout, stderr) => {
      if (err && err.killed) {
        fail(new JobError('ffmpeg_timeout'));
      } else if (err) {
        const e = new Error(
          `ffmpeg: ${String(stderr || err.message)
            .trim()
            .split('\n')
            .pop()}`,
        );
        fail(e);
      } else ok();
    });
  });
}

/** The grade and crop modules, through the scripts' TypeScript loader. */
export async function loadMediaModules() {
  process.removeAllListeners('warning');
  process.on('warning', (w) => {
    if (w.name !== 'ExperimentalWarning') console.warn(w);
  });
  register('../seo/ts-loader.mjs', import.meta.url);
  const grade = await import('@/lib/media/grade');
  const crop = await import('@/lib/media/crop');
  return { grade, crop };
}

/**
 * Render one piece into `dir`: clip.mp4, still.jpg, loop.mp4 (and grade.cube when graded).
 * `job` is a claimed row; `mods` is what {@link loadMediaModules} answers (or the same functions
 * imported another way, as the test does).
 */
export async function renderPiece({ ffmpeg, input, job, dir, mods, deadline }) {
  const { grade: G, crop: C } = mods;
  const version = Number(job.grade_version ?? 1);
  if (version > G.GRADE_VERSION) throw new JobError('grade_version', true);
  const seconds = clipSeconds(job);
  if (!(seconds > 0)) throw new JobError('invalid_span', true);

  const params = job.grade ? G.clampGrade(job.grade) : null;
  let cubePath = null;
  if (params && !G.isIdentityGrade(params)) {
    cubePath = join(dir, 'grade.cube');
    writeFileSync(cubePath, G.lutToCube(G.gradeToLut(params)));
  }
  const crop = C.clampCrop(job.crop);
  const filters = clipFilters({ cropFilter: crop ? C.ffmpegCrop(crop) : null, cubePath });

  const clip = join(dir, 'clip.mp4');
  const still = join(dir, 'still.jpg');
  const loop = join(dir, 'loop.mp4');
  await run(
    ffmpeg,
    clipArgs({ input, output: clip, offset: Number(job.raw_offset_s ?? 0), seconds, filters }),
    deadline,
  );
  await run(ffmpeg, stillArgs({ input: clip, output: still, seconds }), deadline);
  await run(ffmpeg, loopArgs({ input: clip, output: loop, seconds }), deadline);
  return { clip, still, loop, cube: cubePath };
}

// --- Supabase ----------------------------------------------------------------------------------

function api(base, key) {
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  return {
    async rpc(name, body) {
      const res = await fetch(`${base}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) {
        const e = new Error(`rpc_${res.status}`);
        e.status = res.status;
        throw e;
      }
      return res.json();
    },
    async download(bucket, path, file) {
      const url = `${base}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
      // A stalled transfer must not hold the run until the job is killed.
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(TRANSFER_TIMEOUT_MS) });
      // Storage answers 400 with a «not found» body as well as 404 for a missing object. Any other
      // 400 (a bad token, say) is not the piece's fault and must not fail it for good.
      if (res.status === 404) throw new JobError('raw_missing', true);
      if (res.status === 400) {
        const body = await res.text().catch(() => '');
        if (/not.?found/i.test(body)) throw new JobError('raw_missing', true);
        throw new JobError('raw_download_400');
      }
      if (!res.ok || !res.body) throw new JobError(`raw_download_${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
    },
    async upload(bucket, path, file, type, cache) {
      const url = `${base}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': type,
          'x-upsert': 'true',
          'cache-control': `max-age=${cache}`,
        },
        body: readFileSync(file),
        signal: AbortSignal.timeout(TRANSFER_TIMEOUT_MS),
      });
      if (!res.ok) throw new JobError(`upload_${bucket}_${res.status}`);
    },
  };
}

async function worker({ peek }) {
  const base = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!base || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
  }
  const db = api(base, key);

  let pending;
  try {
    pending = Number(await db.rpc('media_render_pending'));
  } catch (e) {
    if (e.status === 404) {
      // The function is not there: 0060 has not been applied yet. Not a failure of this run.
      console.log(peek ? '0' : 'studio: 0060 is not applied yet, nothing to render');
      return;
    }
    throw e;
  }
  if (peek) {
    console.log(String(pending));
    return;
  }

  const ffmpeg = findFfmpeg();
  const mods = await loadMediaModules();
  const started = Date.now();
  const counts = { rendered: 0, requeued: 0, failed: 0, lost: 0 };

  for (let n = 0; n < MAX_CLIPS_PER_RUN && Date.now() - started < RUN_BUDGET_MS; n++) {
    const [job] = await db.rpc('media_render_claim', {
      p_limit: 1,
      p_lease_seconds: LEASE_SECONDS,
    });
    if (!job) break;
    const dir = mkdtempSync(join(tmpdir(), 'media-render-'));
    try {
      if (!EXERCISE_ID_RE.test(job.exercise_id ?? '')) throw new JobError('bad_exercise_id', true);
      if (!RAW_PATH_RE.test(job.raw_path ?? '')) throw new JobError('bad_raw_path', true);
      const input = join(dir, `raw.${job.raw_path.split('.').pop()}`);
      await db.download('raw', job.raw_path, input);
      const out = await renderPiece({
        ffmpeg,
        input,
        job,
        dir,
        mods,
        deadline: started + HARD_STOP_MS,
      });
      const withEn = !job.has_video_en;
      for (const u of uploadPlan(job.exercise_id, withEn)) {
        await db.upload(u.bucket, u.path, out[u.kind], u.type, u.cache);
      }
      const ok = await db.rpc('media_render_done', {
        p_id: job.id,
        p_attempt: job.attempt,
        p_with_en: withEn,
      });
      if (ok === true) counts.rendered++;
      else counts.lost++;
    } catch (err) {
      const final = err instanceof JobError && err.final;
      try {
        const ok = await db.rpc('media_render_failed', {
          p_id: job.id,
          p_attempt: job.attempt,
          p_error: shortError(err),
          p_final: final,
        });
        if (ok !== true) counts.lost++;
        else if (final || job.attempt >= MAX_ATTEMPTS) counts.failed++;
        else counts.requeued++;
      } catch {
        // The lease will run out and the next run takes it again.
        counts.lost++;
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const left = Math.max(0, Number(await db.rpc('media_render_pending')) || 0);
  console.log(
    `studio: rendered ${counts.rendered}, requeued ${counts.requeued}, failed ${counts.failed}, ` +
      `lost ${counts.lost}, still waiting ${left}`,
  );
  if (counts.failed > 0) process.exitCode = 1;
}

async function local(args) {
  const outIdx = args.indexOf('--out');
  const out =
    outIdx >= 0 ? resolve(args[outIdx + 1]) : mkdtempSync(join(tmpdir(), 'media-render-local-'));
  const [input, paramsFile] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
  if (!input || !paramsFile || !existsSync(input) || !existsSync(paramsFile)) {
    console.error('usage: render-clips.mjs --local <input video> <params.json> [--out <dir>]');
    process.exit(1);
  }
  const job = JSON.parse(readFileSync(paramsFile, 'utf8'));
  const mods = await loadMediaModules();
  const files = await renderPiece({
    ffmpeg: findFfmpeg(),
    input: resolve(input),
    job,
    dir: out,
    mods,
  });
  console.log(JSON.stringify(files, null, 2));
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const go =
    args[0] === '--local' ? local(args.slice(1)) : worker({ peek: args.includes('--peek') });
  go.catch((err) => {
    // A message, never a stack with a URL in it.
    console.error(`studio: ${shortError(err)}`);
    process.exit(1);
  });
}
