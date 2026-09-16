import { useEffect, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
      /*
       * The name is the control: tap it to change it. «Изменить имя» used to be a second line of
       * capitals under the name, and on a screen the owner wanted down to «минимум текста» a
       * control that names itself twice — once as the name, once as the instruction — is the
       * first thing to go. The pencil is the one mark small enough to say "this can be edited"
       * without saying it in words.
       */
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={t('app.profileEditName')}
        className="group flex max-w-full items-baseline gap-2 text-left transition-opacity duration-150 ease-(--ease-out) hover:opacity-80"
      >
        {/*
          The name carries the brand's device on its own: the first name at 800, whatever follows
          at 200. A one-word name is simply the heavy half. Unbounded in capitals is wide, so a
          long name is allowed to hyphenate rather than shrink.
        */}
        <span className="display min-w-0 text-[32px] leading-[1.04] text-balance">
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
        </span>
        <Icon name="edit" size={14} className="shrink-0 self-center text-muted-2" />
      </button>
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
  /** «с августа · 24 тренировки» — the one line under the name; omitted when nothing is known. */
  line?: string;
  busy: 'avatar' | 'name' | null;
  onNewAvatar: () => void;
  onSaveName: (name: string) => Promise<boolean>;
}

/**
 * The top of the profile, on paper: the avatar, the name, one line.
 *
 * That is the whole identity, and it is what the owner's prototype (`design/ui_kits/app-v2`,
 * «Профиль») shows — a round avatar beside the name, and under it when you started and how much
 * you have done. The email, the «В форме с …» kicker, «Изменить имя» and «Новый аватар» were four
 * more lines saying things the objects already say: the avatar is the "new avatar" control and
 * says so to a screen reader, the name is the "edit name" control, and the email lives on the
 * sign-out row, which is the one place the account's address is the point.
 */
export function ProfileHeader({
  seed,
  name,
  email,
  line,
  busy,
  onNewAvatar,
  onSaveName,
}: ProfileHeaderProps) {
  const { t } = useT();
  return (
    <section className="flex items-center gap-5">
      <button
        type="button"
        disabled={busy === 'avatar'}
        onClick={onNewAvatar}
        aria-label={t('app.profileNewAvatar')}
        title={t('app.profileNewAvatar')}
        className="shrink-0 rounded-pill transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.96] disabled:opacity-40"
      >
        <Avatar seed={seed} name={name || email} size={80} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <NameEditor name={name} busy={busy === 'name'} onSave={onSaveName} />
        {line ? <p className="truncate text-[14px] text-muted">{line}</p> : null}
      </div>
    </section>
  );
}
