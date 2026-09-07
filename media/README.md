# media/

`manifest.json` is the record of **which clip shows which exercise** — the expensive part of the
job, since the Telegram export carries no captions and each clip has to be watched. It is version
controlled so that work is never repeated.

The clips themselves are not. They are ~180 MB of paid content and belong in the private Supabase
`videos` bucket, not in a public git repository. `prepare-videos.mjs` writes them to `clips/` and
`.gitignore` keeps them out.

That split is the reason the manifest sits _beside_ `clips/` rather than inside it. All three
scripts default to `media/manifest.json`; nothing that matters is written into the ignored folder.

Run these from the repository root, after `npm install`:

```bash
npm run media:prepare                     # find the export, transcode, dedupe, write contact sheets
npm run media:prepare -- --frames-only    # rebuild only the contact sheets
# identify: watch media/clips/frames/<key>.jpg, set exerciseId in media/manifest.json
npm run media:apply                       # write video: refs onto the matched exercises
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run media:upload
```

`postedAs` lists every Telegram message the clip appeared in, so a clip can always be traced back
to the workout it was posted with. `note` records what was actually seen in the frames — it is what
makes an id checkable later, and re-running `media:prepare` carries it across untouched.
