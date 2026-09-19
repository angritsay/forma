/**
 * The one error every deploy produces, and what to do about it.
 *
 * The app is code-split: every screen is a `lazy()` import of a file whose name carries a content
 * hash, and the list of those names lives in the `index.html` the browser loaded. Ship a new
 * build and the old names stop existing. A tab that was open across the deploy — and inside
 * Telegram a Mini App is *always* open across the deploy, because the webview is kept alive
 * between sessions — then asks for a chunk that 404s the moment somebody taps a screen they had
 * not visited yet. React turns that into a render error, the boundary catches it, and the owner
 * photographs «Importing a module script failed», which is true and useless.
 *
 * It is not a bug in the code that failed; the code is fine and so is the new build. The fix is to
 * fetch the page again — so that is what happens, once, by itself.
 *
 * **Once, and only with somewhere to record it.** A reload loop on a genuinely broken deploy would
 * be far worse than the error: the screen would flash forever and nothing would ever be readable,
 * least of all the message saying why. `sessionStorage` carries the mark, so a second failure in
 * the same session falls through to the fallback and its details. The mark is never cleared: a
 * session that reloaded and then worked does not need the budget again, and one that did not work
 * must not spend it twice. Where storage cannot be reached at all, nothing reloads — an unbounded
 * loop is the one outcome worse than the error itself, and the button is still there.
 */
const MARK = 'forma.staleChunkReload';

/**
 * Every wording the browsers use for «that module would not load».
 *
 * Safari says «Importing a module script failed», Chrome «Failed to fetch dynamically imported
 * module», Firefox «error loading dynamically imported module». The MIME-type and `Unexpected
 * token '<'` lines are the same fault seen one step later: the server answered the request for a
 * missing `.js` with an HTML page — a 404 document, or on a SPA host the index itself — and the
 * browser tried to parse that as a script.
 */
const PATTERNS: readonly RegExp[] = [
  /importing a module script failed/i,
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /is not a valid javascript mime type/i,
  /unexpected token '<'/i,
];

export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return PATTERNS.some((p) => p.test(message));
}

interface ReloadDeps {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  reload: () => void;
}

function defaultDeps(): ReloadDeps {
  return {
    storage: (() => {
      try {
        return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
      } catch {
        return null;
      }
    })(),
    reload: () => {
      /*
       * A cache-busting parameter rather than `location.reload()`.
       *
       * The stale thing is the HTML, and a plain reload is allowed to serve it from the cache that
       * handed it over in the first place — which would fetch the same document, ask for the same
       * dead chunk and fail the same way. A URL the cache has never seen cannot be answered from
       * it. `replace` rather than `assign`, so the broken page does not become a history entry the
       * back gesture returns to.
       */
      const url = new URL(window.location.href);
      url.searchParams.set('r', String(Date.now()));
      window.location.replace(url.toString());
    },
  };
}

/**
 * Reload the page if this error is a stale chunk and the session has not already spent its one
 * reload. Answers whether a reload was started, so the caller can keep the fallback off screen
 * while the page goes.
 */
export function reloadOnceForStaleChunk(error: unknown, deps: ReloadDeps = defaultDeps()): boolean {
  if (!isStaleChunkError(error)) return false;
  try {
    if (!deps.storage || deps.storage.getItem(MARK)) return false;
    deps.storage.setItem(MARK, '1');
  } catch {
    // Cannot record that the budget was spent, so it is not spent: see the note above.
    return false;
  }
  deps.reload();
  return true;
}
