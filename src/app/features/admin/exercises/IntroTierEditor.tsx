/**
 * One explanation of an exercise — the full one or the brief one — as the admin writes it.
 *
 * Text in the language the admin is typing (the other half in the placeholder, the way every
 * bilingual field in the panel works), a clip that is the same for both languages, and a
 * recording per language. Any of the three can be empty; an explanation with all three empty is
 * no explanation, and {@link cleanIntro} turns it into null so the player never opens a step for
 * nothing.
 */
import type { ReactNode } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import type { ExerciseIntro, Locale } from '@/content/schema';
import { AUDIO_BUCKET, PRIVATE_BUCKET } from '@/lib/api/storage';
import { otherHalf, pick, put } from '@/app/features/admin/adminLocale';
import { useT } from '@/app/hooks/useT';
import { MediaField } from '@/app/features/admin/media/MediaField';

export type IntroTier = 'full' | 'brief';

/** The bytes a recording of a couple of sentences is allowed: the `.m4a` guide is under 1 MB. */
export const INTRO_AUDIO_MAX_BYTES = 5 * 1024 * 1024;

/** A working copy of an intro: every part present, so the fields have something to bind to. */
export interface IntroDraft {
  text: Partial<Record<Locale, string>>;
  video: string | null;
  audio: Partial<Record<Locale, string>>;
}

export const emptyIntro = (): IntroDraft => ({ text: {}, video: null, audio: {} });

export function introToDraft(intro: ExerciseIntro | null | undefined): IntroDraft {
  return {
    text: { ...(intro?.text ?? {}) },
    video: intro?.video ?? null,
    audio: { ...(intro?.audio ?? {}) },
  };
}

/** Trim both halves of a pair and drop the empty ones; undefined when nothing is left. */
function cleanPair(
  pair: Partial<Record<Locale, string>>,
): { ru?: string; en?: string } | undefined {
  const out = {
    ...(pair.ru?.trim() ? { ru: pair.ru.trim() } : {}),
    ...(pair.en?.trim() ? { en: pair.en.trim() } : {}),
  };
  return out.ru || out.en ? out : undefined;
}

/** What is saved: the intro with its empty parts dropped, or null when every part is empty. */
export function cleanIntro(draft: IntroDraft): ExerciseIntro | null {
  const text = cleanPair(draft.text);
  const audio = cleanPair(draft.audio);
  const video = draft.video?.trim() || undefined;
  if (!text && !audio && !video) return null;
  return {
    ...(text ? { text } : {}),
    ...(video ? { video } : {}),
    ...(audio ? { audio } : {}),
  };
}

export interface IntroTierEditorProps {
  tier: IntroTier;
  title: ReactNode;
  /** The exercise id, which names the files: `<id>.intro-<tier>…`. */
  exerciseId: string;
  editing: Locale;
  value: IntroDraft;
  onChange: (next: IntroDraft) => void;
}

export function IntroTierEditor({
  tier,
  title,
  exerciseId,
  editing,
  value,
  onChange,
}: IntroTierEditorProps) {
  const { t } = useT();
  const base = `shared/${exerciseId || 'exercise'}.intro-${tier}`;

  return (
    <div className="flex flex-col gap-4">
      <span className="eyebrow">{title}</span>
      <Textarea
        label={t('app.exIntroText')}
        hint={t('app.exIntroTextHint')}
        rows={3}
        placeholder={otherHalf(value.text, editing)}
        value={pick(value.text, editing)}
        onChange={(e) => onChange({ ...value, text: put(value.text, editing, e.target.value) })}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* One clip for both languages: what is shown does not speak. */}
        <MediaField
          label={t('app.exIntroVideo')}
          hint={t('app.exIntroVideoHint')}
          value={value.video}
          onChange={(video) => onChange({ ...value, video })}
          bucket={PRIVATE_BUCKET}
          pathBase={base}
          accept="video/*"
        />
        {/* The recording is in a language, so there is one per language, like the text. */}
        <MediaField
          label={t('app.exIntroAudio', { lang: editing.toUpperCase() })}
          hint={t('app.exIntroAudioHint')}
          value={value.audio[editing] ?? null}
          onChange={(ref) => onChange({ ...value, audio: put(value.audio, editing, ref ?? '') })}
          bucket={AUDIO_BUCKET}
          pathBase={`${base}.${editing}`}
          accept="audio/*"
          maxBytes={INTRO_AUDIO_MAX_BYTES}
        />
      </div>
    </div>
  );
}
