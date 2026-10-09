/**
 * «Также в Forma» on «Курсы» (0068): other creators' courses, a few quiet rows under the deck.
 *
 * Modest by design: the screen is the member's own progress, and this is a footnote to it, not a
 * second catalogue. A heading, one line, and per creator their name over solid list rows (course
 * name and tagline); a row opens the course's path, where workout 1 is free like on any course
 * (0019, 0022). Nothing renders while it loads, when it fails, or when there is nothing to show —
 * an empty or broken footnote is worse than none.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ListRow } from '@/components/ui/ListRow';
import { courseTitle } from '@/content/catalogue';
import type { Course } from '@/content/schema';
import { listCatalogueCreators } from '@/lib/api/creators';
import type { PublicCreator } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { alsoOnForma } from './alsoOnForma';

interface Props {
  /** The catalogue's courses (compiled plus published). */
  courses: readonly Course[];
  /** Ids already on the screen as cards. */
  onScreen: ReadonlySet<string>;
}

export function AlsoOnForma({ courses, onScreen }: Props) {
  const { t, l } = useT();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<PublicCreator[]>([]);

  useEffect(() => {
    let alive = true;
    listCatalogueCreators()
      .then((rows) => {
        if (alive) setCreators(rows);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(
    () => alsoOnForma(creators, courses, onScreen),
    [creators, courses, onScreen],
  );
  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 pt-4" aria-labelledby="also-on-forma">
      <div className="flex flex-col gap-1">
        <h2 id="also-on-forma" className="font-display text-xl">
          {t('app.alsoTitle')}
        </h2>
        <p className="text-[13px] leading-snug text-muted">{t('app.alsoNote')}</p>
      </div>
      {groups.map((g) => (
        <div key={g.slug} className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-muted">{g.name}</span>
          {/* Rows carry their own hairline; inside an <li> each is a first child, so the
              hairline goes on the item instead. */}
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {g.courses.map((c) => (
              <li key={c.id} className="border-t border-border first:border-t-0">
                <ListRow
                  title={l(courseTitle(c))}
                  subtitle={l(c.tagline)}
                  onClick={() => navigate(`/courses/${c.id}`)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
