import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useT } from '@/app/hooks/useT';
import { NAME_MAX } from '@/app/screens/onboarding/draft';

export interface NameSheetProps {
  open: boolean;
  /** Current display name; the field opens on it. */
  name: string;
  busy: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

/**
 * Changing the name — the one piece of the profile a person types about themselves.
 *
 * It exists because of two things that have to agree and did not. The privacy policy has always
 * said «Исправить имя, аватар и данные профиля — прямо в приложении», and 152-ФЗ ст. 14 gives the
 * subject the right to have their data corrected; the app asked for a name once, during onboarding,
 * and then had nowhere to change it. A policy that describes a control the product does not have is
 * worse than no policy: it is a promise nobody can keep, made on a page people read precisely
 * because they are deciding whether to trust us.
 *
 * The other reason is plainer. This name is the one other members of the club see on the board, so
 * it is the name a person is most likely to want to change — the one typed in a hurry at sign-up,
 * before they knew anyone would read it.
 *
 * Same shape as the equipment sheet: one question, one field, one save. The 60-character cap is the
 * database's own (`profiles_display_name_len`), imported from the onboarding step so the two fields
 * that write this column cannot drift apart. Empty is refused rather than saved as null — a board
 * row with no name on it is a worse outcome than keeping the old one.
 */
export function NameSheet({ open, name, busy, onClose, onSave }: NameSheetProps) {
  const { t } = useT();
  const [value, setValue] = useState('');
  const wasOpen = useRef(false);

  // Seed on opening only, as in EquipmentSheet: a profile refresh mid-edit must not wipe the field.
  useEffect(() => {
    if (open && !wasOpen.current) setValue(name);
    wasOpen.current = open;
  }, [open, name]);

  const trimmed = value.trim();
  const submit = () => {
    if (trimmed) onSave(trimmed);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('app.profileNameTitle')}
      footer={
        <Button size="lg" fullWidth loading={busy} disabled={!trimmed} onClick={submit}>
          {t('common.save')}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-4 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          name="displayName"
          autoComplete="given-name"
          autoFocus
          maxLength={NAME_MAX}
          aria-label={t('app.profileNameTitle')}
          placeholder={t('app.onbNamePlaceholder')}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, NAME_MAX))}
          enterKeyHint="done"
        />
        <p className="text-[13px] text-muted">{t('app.profileNameNote')}</p>
      </form>
    </Sheet>
  );
}
