import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import type { PrescribedWorkout } from '@/lib/training/types';
import { ItemList } from '../ItemList';
import {
  blockMeta,
  blockSection,
  blockTitle,
  blockTypeLabel,
  findBlock,
  formatLabel,
  mainPart,
  sectionLabel,
  type BlockIntroStep as Step,
} from '../model';

export interface BlockIntroStepProps {
  step: Step;
  prescribed: PrescribedWorkout;
  onNext: () => void;
}

/** Block title, structure and its exercises; "Go" starts the block. */
export function BlockIntroStep({ step, prescribed, onNext }: BlockIntroStepProps) {
  const { t, l, locale } = useT();
  const block = findBlock(prescribed, step.blockId);
  const section = blockSection(step.type);
  const part = section === 'main' ? mainPart(prescribed, step.blockId) : null;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <span className="eyebrow">
          {sectionLabel(t, section)}
          {part ? ` · ${t('app.playerSectionPart', { n: part.n, total: part.total })}` : ''}
        </span>
        <DisplayTitle
          as="h2"
          text={block ? blockTitle(t, locale, block) : blockTypeLabel(t, step.type)}
          className="text-5xl"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" size="md">
            {formatLabel(t, step.format)}
          </Badge>
          {block ? <span className="text-sm text-muted">{blockMeta(t, locale, block)}</span> : null}
          {prescribed.deload && block?.scaled ? (
            <Badge tone="warning" size="md">
              {t('training.deloadBadge')}
            </Badge>
          ) : null}
        </div>
        {step.description ? <p className="text-[15px] text-muted">{l(step.description)}</p> : null}
      </div>
      {block ? <ItemList items={block.items} className="border-t border-border-strong" /> : null}
      <Button size="lg" fullWidth onClick={onNext} data-autofocus>
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
