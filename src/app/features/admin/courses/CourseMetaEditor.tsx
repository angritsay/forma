/**
 * Everything about a course except its days: what it is called, who it is for, what it costs, what
 * it looks like.
 *
 * There is no Save button: every change is handed straight to the parent, which writes it to the
 * database on a short debounce. A course is written over many sittings and across two devices, and
 * an editor that can lose an afternoon's work to a closed tab is not one anybody will trust with a
 * whole course.
 *
 * Numeric fields are the one exception — they commit on blur. Held as strings while being typed so
 * that clearing one to retype it does not snap the value to zero and save that.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EQUIPMENT } from '@/content/schema';
import { PRIVATE_BUCKET, PUBLIC_BUCKET } from '@/lib/api/storage';
import type { AdminCoursePatch, AdminCourseRow } from '@/lib/api/types';
import type { CourseDraftContent } from '@/lib/courses/draft';
import { courseTileVars } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { ChipToggles, FieldLabel, TextList } from '@/app/features/admin/forms/TextList';
import { MediaField } from '@/app/features/admin/media/MediaField';

/*
 * The five tiles a course may take, from src/styles/global.css: the three programme colours —
 * beginners, yoga, marathon — and the two neutral surfaces for a course that belongs to no
 * programme. The tile is the one colour on the screen while the course is open, so this row is
 * the only place in the admin where colour is chosen at all.
 */
const TILES = ['#f2f52d', '#a8c8ff', '#f08a3c', '#1f1f24', '#2a2a30'] as const;

/** The same shape `CourseSchema` accepts for `tile` (src/content/schema.ts) — six hex digits. */
const HEX_RE = /^#[0-9a-f]{6}$/i;

export interface CourseMetaEditorProps {
  course: AdminCourseRow;
  onPatch: (patch: AdminCoursePatch) => void;
}

/** A single-line Russian field of the content blob. */
function useContentField(course: AdminCourseRow, onPatch: (p: AdminCoursePatch) => void) {
  return (key: 'name' | 'tagline' | 'description', value: string) => {
    const content: CourseDraftContent = {
      ...course.content,
      [key]: { ...(course.content[key] ?? {}), ru: value },
    };
    onPatch({ content });
  };
}

export function CourseMetaEditor({ course, onPatch }: CourseMetaEditorProps) {
  const { t } = useT();
  const setText = useContentField(course, onPatch);
  const c = course.content;

  // Numbers are held as strings while being typed, so clearing a field does not snap it to 0.
  const [weeks, setWeeks] = useState(String(course.weeks));
  const [perWeek, setPerWeek] = useState(String(course.sessionsPerWeek));
  const [minutes, setMinutes] = useState(String(course.avgSessionMin));
  const [rub, setRub] = useState(String(course.priceRub));
  const [usd, setUsd] = useState(String(course.priceUsd));

  /*
   * The tile hex is typed as well as picked. Held as a string while being edited and committed on
   * blur only when it is a colour, so a half-typed "#f2f" is never written; a swatch tap commits
   * at once and the field follows it.
   */
  const [tileText, setTileText] = useState(course.tile);
  useEffect(() => setTileText(course.tile), [course.tile]);
  const commitTile = () => {
    const next = tileText.trim().toLowerCase();
    if (HEX_RE.test(next)) {
      if (next !== course.tile.toLowerCase()) onPatch({ tile: next });
    } else {
      setTileText(course.tile);
    }
  };
  const tileInvalid = tileText.trim() !== '' && !HEX_RE.test(tileText.trim());

  const setList = (key: 'longDescription' | 'forWhom' | 'outcomes', values: string[]) =>
    onPatch({ content: { ...c, [key]: values.map((v) => ({ ru: v })) } });

  const faq = c.faq ?? [];
  const setFaq = (next: typeof faq) => onPatch({ content: { ...c, faq: next } });

  return (
    <div className="flex flex-col gap-6 py-4">
      <Input
        label={t('app.courseName')}
        value={c.name?.ru ?? ''}
        onChange={(e) => setText('name', e.target.value)}
      />
      <Input
        label={t('app.courseTagline')}
        hint={t('app.courseTaglineHint')}
        value={c.tagline?.ru ?? ''}
        onChange={(e) => setText('tagline', e.target.value)}
      />
      <Textarea
        label={t('app.courseDescription')}
        hint={t('app.courseDescriptionHint')}
        rows={3}
        value={c.description?.ru ?? ''}
        onChange={(e) => setText('description', e.target.value)}
      />

      <TextList
        label={t('app.courseLongDescription')}
        hint={t('app.courseLongDescriptionHint')}
        values={(c.longDescription ?? []).map((v) => v.ru ?? '')}
        onChange={(v) => setList('longDescription', v)}
        placeholder={t('app.courseParagraph')}
      />
      <TextList
        label={t('app.courseForWhom')}
        hint={t('app.courseForWhomHint')}
        values={(c.forWhom ?? []).map((v) => v.ru ?? '')}
        onChange={(v) => setList('forWhom', v)}
        placeholder={t('app.courseForWhomPlaceholder')}
      />
      <TextList
        label={t('app.courseOutcomes')}
        hint={t('app.courseOutcomesHint')}
        values={(c.outcomes ?? []).map((v) => v.ru ?? '')}
        onChange={(v) => setList('outcomes', v)}
        placeholder={t('app.courseOutcomesPlaceholder')}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Select
          label={t('app.courseLevel')}
          value={String(course.level)}
          onChange={(v) => onPatch({ level: Number(v) })}
          options={[
            { value: '1', label: t('app.exLevel1') },
            { value: '2', label: t('app.exLevel2') },
            { value: '3', label: t('app.exLevel3') },
          ]}
        />
        <Input
          label={t('app.courseWeeks')}
          type="number"
          inputMode="numeric"
          min={1}
          max={16}
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
          onBlur={() => onPatch({ weeks: Math.max(1, Math.min(16, Number(weeks) || 4)) })}
        />
        <Input
          label={t('app.coursePerWeek')}
          type="number"
          inputMode="numeric"
          min={1}
          max={7}
          value={perWeek}
          onChange={(e) => setPerWeek(e.target.value)}
          onBlur={() =>
            onPatch({ sessionsPerWeek: Math.max(1, Math.min(7, Number(perWeek) || 3)) })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Input
          label={t('app.courseMinutes')}
          type="number"
          inputMode="numeric"
          min={5}
          max={120}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onBlur={() =>
            onPatch({ avgSessionMin: Math.max(5, Math.min(120, Number(minutes) || 30)) })
          }
        />
        <Input
          label={t('app.coursePriceRub')}
          type="number"
          inputMode="decimal"
          min={0}
          value={rub}
          onChange={(e) => setRub(e.target.value)}
          onBlur={() => onPatch({ priceRub: Math.max(0, Number(rub) || 0) })}
        />
        <Input
          label={t('app.coursePriceUsd')}
          type="number"
          inputMode="decimal"
          min={0}
          value={usd}
          onChange={(e) => setUsd(e.target.value)}
          onBlur={() => onPatch({ priceUsd: Math.max(0, Number(usd) || 0) })}
        />
      </div>

      <ChipToggles
        label={t('app.courseEquipment')}
        options={EQUIPMENT}
        selected={course.equipment}
        onChange={(equipment) => onPatch({ equipment: equipment.length ? equipment : ['none'] })}
      />

      <div className="flex flex-col gap-3">
        <FieldLabel label={t('app.courseTile')} hint={t('app.courseTileHint')} />
        {/*
         * The preview is the cover as the app will draw it: `.hero-art` painted with the chosen
         * hex through courseTileVars(), which also picks the ink — black on a programme colour,
         * light on a neutral surface — so the coach sees the name in the colour it will actually
         * be read in, not just a swatch.
         */}
        <div
          className="hero-art flex min-h-24 items-end p-4"
          style={courseTileVars(course.tile)}
          aria-hidden="true"
        >
          <span className="font-display truncate text-xl">
            {c.name?.ru?.trim() || course.slugId}
          </span>
        </div>
        <div
          className="flex flex-wrap items-center gap-3"
          role="group"
          aria-label={t('app.courseTile')}
        >
          {TILES.map((tile) => {
            const on = course.tile.toLowerCase() === tile;
            return (
              <button
                key={tile}
                type="button"
                aria-label={tile}
                aria-pressed={on}
                onClick={() => onPatch({ tile })}
                style={courseTileVars(tile)}
                className={
                  // A swatch is a square of course art; the chosen one is outlined in the interface
                  // white and carries a tick in the tile's own ink.
                  on
                    ? 'hero-art flex size-11 items-center justify-center outline-2 outline-offset-2 outline-primary'
                    : 'hero-art size-11 border border-border-strong transition-opacity duration-150 ease-(--ease-out) hover:opacity-85'
                }
              >
                {on ? <Glyph size={14}>✓</Glyph> : null}
              </button>
            );
          })}
          <Input
            wrapperClassName="w-36"
            className="font-mono"
            aria-label={t('app.courseTile')}
            placeholder="#1f1f24"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={7}
            value={tileText}
            error={tileInvalid ? t('app.courseTileInvalid') : undefined}
            onChange={(e) => setTileText(e.target.value)}
            onBlur={commitTile}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTile();
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MediaField
          label={t('app.courseCover')}
          hint={t('app.courseCoverHint')}
          value={c.coverImage ?? null}
          onChange={(coverImage) => onPatch({ content: { ...c, coverImage } })}
          bucket={PUBLIC_BUCKET}
          pathBase={`courses/${course.slugId}/cover`}
          accept="image/*"
          maxBytes={8 * 1024 * 1024}
        />
        <MediaField
          label={t('app.courseIntroVideo')}
          hint={t('app.courseIntroVideoHint')}
          value={c.introVideo?.ru ?? null}
          onChange={(ref) =>
            onPatch({ content: { ...c, introVideo: ref ? { ru: ref } : undefined } })
          }
          bucket={PRIVATE_BUCKET}
          pathBase={`${course.slugId}/intro.ru`}
          accept="video/*"
        />
      </div>

      <Input
        label={t('app.coursePaymentUrl')}
        hint={t('app.coursePaymentUrlHint')}
        type="url"
        inputMode="url"
        placeholder="https://…"
        value={c.paymentUrl?.ru ?? ''}
        onChange={(e) =>
          onPatch({
            content: { ...c, paymentUrl: e.target.value ? { ru: e.target.value } : undefined },
          })
        }
      />

      <div className="flex flex-col gap-3">
        <FieldLabel label={t('app.courseFaq')} hint={t('app.courseFaqHint')} />
        {/* Each question is a numbered, ruled group — 01, 02 — rather than a bordered card. */}
        {faq.map((item, i) => (
          <div key={`faq_${i}`} className="flex gap-3 border-t border-border pt-4">
            <span className="numeral tabular w-6 shrink-0 pt-3.5 text-[13px] text-muted-2">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Input
                aria-label={t('app.courseFaqQ')}
                placeholder={t('app.courseFaqQ')}
                value={item.q?.ru ?? ''}
                onChange={(e) =>
                  setFaq(faq.map((f, j) => (j === i ? { ...f, q: { ru: e.target.value } } : f)))
                }
              />
              <Textarea
                rows={2}
                aria-label={t('app.courseFaqA')}
                placeholder={t('app.courseFaqA')}
                value={item.a?.ru ?? ''}
                onChange={(e) =>
                  setFaq(faq.map((f, j) => (j === i ? { ...f, a: { ru: e.target.value } } : f)))
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                icon={<Glyph size={14}>×</Glyph>}
                onClick={() => setFaq(faq.filter((_, j) => j !== i))}
              >
                {t('app.exRemoveLine')}
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          icon={<Glyph size={14}>+</Glyph>}
          onClick={() => setFaq([...faq, { q: {}, a: {} }])}
        >
          {t('app.courseFaqAdd')}
        </Button>
      </div>
    </div>
  );
}
