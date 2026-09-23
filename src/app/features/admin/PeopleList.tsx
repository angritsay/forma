import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { formatDate, formatNumber } from '@/i18n/index';
import type { PersonRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { personPath } from './person/path';
import { rowIndex } from './PurchaseList';

export interface PeopleListProps {
  rows: readonly PersonRow[];
  /** Grant a course to this person. */
  onGrantCourse: (row: PersonRow) => void;
  /** Grant a subscription to this person. Absent when plans are switched off. */
  onGrantSubscription?: (row: PersonRow) => void;
}

/**
 * Everybody who has signed in, as ruled rows: the address first, what they already hold beside it,
 * and one button per thing that can be given.
 *
 * It exists to replace typing. «Чтобы я могла не писать а пролистать все почты и выбрать кому
 * накинуть курс или подписку» — the grant forms take any well-formed address on purpose, so a
 * mistyped one lands on an account that does not exist and says nothing about it. Picking from a
 * list cannot make that mistake.
 *
 * The address leads in the display face for the same reason it does in the purchases ledger: it is
 * what is being scanned for. What they already hold is a badge rather than a line of prose, so a
 * column of fifty people answers "who has nothing yet" at a glance — which is the actual question
 * being asked of this screen.
 */
export function PeopleList({ rows, onGrantCourse, onGrantSubscription }: PeopleListProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  return (
    <ul className="flex flex-col">
      {rows.map((row, i) => (
        <li key={row.email}>
          <div className="flex gap-4 border-t border-border py-4">
            <span className="numeral tabular w-7 shrink-0 pt-0.5 text-[13px] text-muted-2">
              {rowIndex(i)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                {/* The address and the name open the person's page (0046): everything they hold
                    and have done, with the same grants one tap further. */}
                <button
                  type="button"
                  aria-label={t('app.personOpen', { name: row.displayName?.trim() || row.email })}
                  onClick={() => void navigate(personPath(row.email))}
                  className="flex min-w-0 flex-col gap-0.5 text-left transition-opacity duration-150 ease-(--ease-out) hover:opacity-80 active:opacity-60"
                >
                  {/*
                   * The address wraps instead of truncating, unlike the purchases ledger's copy of
                   * this row. There the email labels a purchase you already know about; here it is
                   * the thing being read and chosen, and «nastia@example….» is not something you
                   * can pick from. `break-all` because an address has no spaces to break at.
                   */}
                  <span className="font-display text-[15px] leading-[1.24] break-all">
                    {row.email}
                  </span>
                  {row.displayName ? (
                    <span className="truncate text-sm text-muted">{row.displayName}</span>
                  ) : null}
                  <span className="text-xs text-muted-2">
                    {t('app.adminCreated', { date: formatDate(locale, row.createdAt, 'long') })}
                    {/* Whether they got through the wizard: somebody who signed in and stopped is
                        a different person to help than somebody training. */}
                    {row.onboardedAt ? '' : ` · ${t('app.adminPersonNotOnboarded')}`}
                  </span>
                </button>
                {/* What they hold, in the order of what it costs to give: nothing at all is the
                    plain case and says so in words, because an empty space would read as loading. */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {row.subscribed ? (
                    <Badge tone="inverse">{t('app.adminPersonSubscribed')}</Badge>
                  ) : null}
                  {row.courses > 0 ? (
                    <Badge tone="neutral">
                      {t('app.adminPersonCourses', { n: formatNumber(locale, row.courses) })}
                    </Badge>
                  ) : null}
                  {!row.subscribed && row.courses === 0 ? (
                    <span className="text-xs text-muted-2">{t('app.adminPersonNothing')}</span>
                  ) : null}
                </div>
              </div>
              {/* Two short labels rather than two sentences: «Дать курс» and «Дать подписку» were
                  both clipped side by side on a 390px row, and a clipped button is a button you
                  have to guess at. The «+» carries the verb. */}
              <div className="flex gap-2 lg:shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Glyph size={14}>+</Glyph>}
                  onClick={() => onGrantCourse(row)}
                >
                  {t('app.adminPersonGiveCourse')}
                </Button>
                {onGrantSubscription ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Glyph size={14}>+</Glyph>}
                    onClick={() => onGrantSubscription(row)}
                  >
                    {t('app.adminPersonGiveSub')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
