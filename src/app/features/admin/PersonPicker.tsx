/**
 * Кого именно — по имени, а не по памяти на адреса.
 *
 * Владелец: «Не я, ни Сережа, обычно не знаем почты клиентов. Мы обычно знаем их имена и хочется
 * не писать его буквально, потому что мы можем создать ошибку, а выбрать из списка имеющихся. То
 * есть мы начинаем писать, например, "Настя", и он показывает, что у нас есть три насти, и из них
 * Сережа может выбрать. То есть показывать имя и там снизу почту.»
 *
 * Это ровно тот же довод, которым заводилась `admin_people()` в 0013: «одна буква мимо — и выдача
 * уходит на несуществующий аккаунт, молча». Список там появился, а три поля, где адрес всё ещё
 * набирается руками, остались — выдать тренировку, добавить покупку, добавить подписку. Этот
 * компонент закрывает все три.
 *
 * ## Это комбобокс, а не выбор из списка, и это принципиально
 *
 * Выдать курс человеку, которого ещё нет в базе, — настоящий сценарий, и 0013 это прямо
 * оговаривает: «a pre-sale grant to somebody who has not signed up yet is a real thing the coach
 * does», поэтому `admin_add_purchase` принимает любой синтаксически верный адрес. Запереть поле в
 * «только из списка» значило бы отобрать эту возможность ради удобства поиска. Поэтому: печатать
 * можно что угодно, а подсказки — помощь, а не рамка.
 *
 * Ищет и по имени, и по почте — «искать и по имени, и по почте». Обе половины делает один и тот же
 * `p_search` в `admin_people()`, так что второго правила поиска здесь не появляется.
 *
 * Имени может не быть — человек вошёл и не дошёл до онбординга. Тогда в строке стоит прочерк:
 * «можешь на данный момент поставить прочерк, но в дальнейшем у нас не должно быть такой ситуации,
 * что пользователь без имени». Прочерк, а не подстановка почты вместо имени: одна и та же строка
 * дважды в одной карточке читается как ошибка вёрстки.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { listPeople } from '@/lib/api/admin';
import type { PersonRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface PersonPickerProps {
  /** Адрес в поле. Родитель владеет им — сюда приходит то, что он хранит. */
  value: string;
  onChange: (email: string) => void;
  label?: string;
  placeholder?: string;
  /** Сообщение под полем; своё у каждого экрана. */
  error?: string | undefined;
  /** Подсказка под полем, когда ошибки нет. */
  hint?: string | undefined;
  className?: string;
  autoFocus?: boolean;
  /** Поле потеряло фокус. Выбор из подсказок фокус не уводит, так что сюда он не приходит. */
  onBlur?: () => void;
}

/** Сколько подсказок показывать. Больше — это уже список, а не подсказка. */
const MAX_SUGGESTIONS = 6;

/**
 * С какой длины искать.
 *
 * С первого символа «н» совпадут все Насти, Никиты и все адреса на `n`, и это список, из которого
 * ничего не выбирают. С двух — уже человек.
 */
const MIN_QUERY = 2;

export function PersonPicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  hint,
  className,
  autoFocus,
  onBlur,
}: PersonPickerProps) {
  const { t } = useT();
  const listId = useId();
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /* Что именно уже искали: чтобы подсказки не висели над текстом, которому они не отвечают. */
  const [queried, setQueried] = useState('');
  const box = useRef<HTMLDivElement>(null);

  const term = value.trim();

  /*
   * Поиск с задержкой. 220 мс — это про набор, а не про сеть: человек, печатающий «Настя», за
   * пять символов сделал бы пять запросов, и четыре из них вернулись бы уже ненужными.
   */
  useEffect(() => {
    if (term.length < MIN_QUERY) {
      setRows([]);
      setQueried('');
      return;
    }
    let alive = true;
    setLoading(true);
    const id = window.setTimeout(() => {
      listPeople(term, MAX_SUGGESTIONS)
        .then((r) => {
          if (!alive) return;
          setRows(r);
          setQueried(term);
        })
        .catch(() => {
          // Поиск — помощь, а не условие. Отказ сети оставляет поле работать руками.
          if (alive) setRows([]);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [term]);

  /* Клик мимо закрывает подсказки. Внутри — не закрывает, иначе выбор не успевает случиться. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  /*
   * Подсказка, которая точно равна тому, что уже набрано, — это не подсказка. Она появляется
   * ровно в тот момент, когда выбор уже сделан, и предлагает сделать его ещё раз.
   */
  const suggestions =
    queried === term ? rows.filter((r) => r.email.toLowerCase() !== term.toLowerCase()) : [];
  const show = open && term.length >= MIN_QUERY && (suggestions.length > 0 || loading);

  return (
    <div ref={box} className={clsx('relative flex flex-col', className)}>
      <Input
        type="email"
        inputMode="email"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        {...(label ? { label } : {})}
        {...(placeholder ? { placeholder, 'aria-label': placeholder } : {})}
        {...(error ? { error } : {})}
        {...(hint && !error ? { hint } : {})}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && show) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        trailing={loading ? <Spinner size={14} /> : undefined}
      />

      {show ? (
        <ul
          id={listId}
          role="listbox"
          /*
           * Absolute, so the sheet below it does not grow and jump as the list fills and empties.
           * `z-30` clears the sheet's own content; it is inside the sheet, so nothing above it
           * needs to be cleared.
           */
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-control border border-border-strong bg-surface-2 py-1 shadow-soft"
        >
          {suggestions.map((p) => (
            <li key={p.email}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                /* `onPointerDown`, not `onClick`: the input's blur would otherwise close the list
                   before the click ever lands on it. */
                onPointerDown={(e) => {
                  e.preventDefault();
                  onChange(p.email);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-3"
              >
                <span className="w-full truncate text-[15px] leading-tight text-text">
                  {p.displayName?.trim() || '—'}
                </span>
                <span className="w-full truncate text-[13px] leading-tight text-muted-2">
                  {p.email}
                </span>
              </button>
            </li>
          ))}
          {suggestions.length === 0 && loading ? (
            <li className="px-4 py-2 text-[13px] text-muted-2">{t('common.loading')}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
