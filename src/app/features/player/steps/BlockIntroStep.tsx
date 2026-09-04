import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { PrescribedWorkout } from '@/lib/training/types';
import { ItemList } from '../ItemList';
import {
  blockMeta,
  blockTitle,
  blockTypeLabel,
  findBlock,
  formatLabel,
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
  const total = prescribed.blocks.length;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">
          {t('app.playerBlockOf', { n: step.blockIndex + 1, total })} ·{' '}
          {blockTypeLabel(t, step.type)}
        </span>
        <h2 className="font-display text-4xl">
          {block ? blockTitle(t, locale, block) : blockTypeLabel(t, step.type)}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent" size="md">
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
      {block ? <ItemList items={block.items} /> : null}
      <Button size="lg" fullWidth onClick={onNext} data-autofocus>
        {t('app.playerGo')}
      </Button>
    </div>
  );
}
