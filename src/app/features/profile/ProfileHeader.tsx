import { useEffect, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useT } from '@/app/hooks/useT';
import { isValidName, NAME_MAX } from '@/app/screens/onboarding/draft';
import { splitName } from './model';

interface NameEditorProps {
  name: string;
  busy: boolean;
  onSave: (name: string) => Promise<boolean>;
}

/** Display name with an inline edit form (Enter saves, Esc cancels). */
function NameEditor({ name, busy, onSave }: NameEditorProps) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name);

  useEffect(() => {
    if (!editing) setText(name);
  }, [name, editing]);

  const trimmed = text.trim();
  const canSave = isValidName(trimmed) && trimmed !== name;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSave) return;
    if (await onSave(trimmed)) setEditing(false);
  };

  if (!editing) {
    const { heavy, thin } = splitName(name);
    return (
      <div className="flex min-w-0 flex-col items-start gap-1">
        {/*
          The name is the screen's one big line, and it carries the brand's device on its own: the
          first name at 800, whatever follows at 200. A one-word name is simply the heavy half.
          Unbounded in capitals is wide, so a long name is allowed to hyphenate rather than shrink.
        */}
        <p className="display text-6xl text-balance">
          {name ? (
            <>
              {heavy}
              {thin ? (
                <>
                  {' '}
                  <span className="t-thin">{thin}</span>
                </>
              ) : null}
            </>
          ) : (
            <span className="t-thin">{t('app.profileNoName')}</span>
          )}
        </p>
        {/* A word, not a pencil: the control says what it does and needs no picture for it. */}
        <Button variant="ghost" size="sm" className="-ml-4.5" onClick={() => setEditing(true)}>
          {t('app.profileEditName')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
      <Input
        label={t('app.profileNameLabel')}
        value={text}
        maxLength={NAME_MAX}
        autoFocus
        autoComplete="name"
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false);
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" loading={busy} disabled={!canSave}>
          {t('common.save')}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

export interface ProfileHeaderProps {
  seed: string;
  name: string;
  email: string;
  /** «В форме с июля 2026» — the kicker under the name; omitted when the date is unknown. */
  since?: string;
  busy: 'avatar' | 'name' | null;
  onNewAvatar: () => void;
  onSaveName: (name: string) => Promise<boolean>;
}

/**
 * The top of the profile, on paper: the name as the display line with its kicker and the
 * read-only email under it, and the avatar off to the right. There is no card — the white ground
 * is the card — and no icon: the avatar itself is the "new avatar" control, captioned so.
 */
export function ProfileHeader({
  seed,
  name,
  email,
  since,
  busy,
  onNewAvatar,
  onSaveName,
}: ProfileHeaderProps) {
  const { t } = useT();
  return (
    <section className="flex items-start justify-between gap-5">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <NameEditor name={name} busy={busy === 'name'} onSave={onSaveName} />
        <div className="flex flex-col gap-1.5">
          {since ? <span className="eyebrow">{since}</span> : null}
          <span className="truncate text-[13px] text-muted" aria-label={t('app.profileEmail')}>
            {email}
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={busy === 'avatar'}
        onClick={onNewAvatar}
        className="flex shrink-0 flex-col items-end gap-2 text-right transition-opacity duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.98] disabled:opacity-40"
      >
        <Avatar seed={seed} name={name || email} size={56} />
        <span className="eyebrow text-[10px]">{t('app.profileNewAvatar')}</span>
      </button>
    </section>
  );
}
