import { useEffect, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { useT } from '@/app/hooks/useT';
import { isValidName, NAME_MAX } from '@/app/screens/onboarding/draft';

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
    return (
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate text-xl font-semibold">{name || t('app.profileNoName')}</span>
        <IconButton
          label={t('app.profileEditName')}
          icon="edit"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-2">
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
  busy: 'avatar' | 'name' | null;
  onNewAvatar: () => void;
  onSaveName: (name: string) => Promise<boolean>;
}

/** Avatar with a "new avatar" control, the editable name and the read-only email. */
export function ProfileHeader({
  seed,
  name,
  email,
  busy,
  onNewAvatar,
  onSaveName,
}: ProfileHeaderProps) {
  const { t } = useT();
  return (
    <Card className="flex items-start gap-4">
      <div className="relative shrink-0">
        <Avatar seed={seed} name={name || email} size={72} />
        <IconButton
          label={t('app.profileNewAvatar')}
          icon="refresh"
          size="sm"
          variant="surface"
          disabled={busy === 'avatar'}
          onClick={onNewAvatar}
          className="absolute -bottom-1 -right-1 shadow-card"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <NameEditor name={name} busy={busy === 'name'} onSave={onSaveName} />
        <span className="truncate text-sm text-muted" aria-label={t('app.profileEmail')}>
          {email}
        </span>
      </div>
    </Card>
  );
}
