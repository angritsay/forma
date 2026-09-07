# media/

`manifest.json` is the record of **which clip shows which exercise** — the expensive part of the
job, since the Telegram export carries no captions and each clip has to be watched. It is version
controlled so that work is never repeated.

The clips themselves are not. They are ~250 MB of paid content and belong in the private Supabase
`videos` bucket, not in a public git repository. `prepare-videos.mjs` writes them here and
`.gitignore` keeps them out.

Run these from the repository root, after `npm install`:

```bash
npm run media:prepare        # find the export, transcode, dedupe, write contact sheets
# identify: watch media/clips/frames/<key>.jpg, set exerciseId in the manifest
npm run media:apply          # write video: refs onto the matched exercises
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run media:upload
```

`postedAs` lists every Telegram message the clip appeared in, so a clip can always be traced back
to the workout it was posted with.
