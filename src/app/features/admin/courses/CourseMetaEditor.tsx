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
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EQUIPMENT } from '@/content/schema';
import { PRIVATE_BUCKET, PUBLIC_BUCKET } from '@/lib/api/storage';
import type { AdminCoursePatch, AdminCourseRow } from '@/lib/api/types';
import type { CourseDraftContent } from '@/lib/courses/draft';
import { useT } from '@/app/hooks/useT';
import { ChipToggles, TextList } from '@/app/features/admin/forms/TextList';
import { MediaField } from '@/app/features/admin/media/MediaField';

/** The five course tiles from src/styles/global.css. A course identifies itself by weight, not hue. */
const TILES = ['#1A2634', '#20293C', '#16202B', '#232F42', '#1C2532'] as const;

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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">{t('app.courseTile')}</span>
        <div className="flex flex-wrap gap-3">
          {TILES.map((tile) => (
            <button
              key={tile}
              type="button"
              aria-label={tile}
              aria-pressed={course.tile.toLowerCase() === tile.toLowerCase()}
              onClick={() => onPatch({ tile })}
              className={
                course.tile.toLowerCase() === tile.toLowerCase()
                  ? 'size-12 rounded-tile ring-2 ring-accent ring-offset-2 ring-offset-bg'
                  : 'size-12 rounded-tile border border-border'
              }
              style={{ background: tile }}
            />
          ))}
        </div>
        <p className="text-sm text-muted">{t('app.courseTileHint')}</p>
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
        <span className="text-sm font-medium text-muted">{t('app.courseFaq')}</span>
        {faq.map((item, i) => (
          <div
            key={`faq_${i}`}
            className="flex flex-col gap-2 rounded-inner border border-border p-3"
          >
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
            <button
              type="button"
              className="self-start text-sm text-muted underline underline-offset-4 hover:text-text"
              onClick={() => setFaq(faq.filter((_, j) => j !== i))}
            >
              {t('app.exRemoveLine')}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="self-start text-sm text-accent underline underline-offset-4"
          onClick={() => setFaq([...faq, { q: {}, a: {} }])}
        >
          {t('app.courseFaqAdd')}
        </button>
        <p className="text-sm text-muted">{t('app.courseFaqHint')}</p>
      </div>
    </div>
  );
}
