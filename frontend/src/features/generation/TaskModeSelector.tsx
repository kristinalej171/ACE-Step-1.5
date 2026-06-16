import { useGenerationStore } from '@/stores/generation.store';
import { TASK_TYPES, TASK_TYPE_LABELS, TASK_TYPE_DESCRIPTIONS } from '@/types/generation.types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Music, Repeat, Paintbrush, Layers, Scissors, Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TASK_ICONS: Record<string, LucideIcon> = {
  text2music: Music,
  cover: Repeat,
  repaint: Paintbrush,
  lego: Layers,
  extract: Scissors,
  complete: Wand2,
};

export function TaskModeSelector() {
  const taskType = useGenerationStore((s) => s.params.task_type);
  const setParam = useGenerationStore((s) => s.setParam);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">Task mode</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {TASK_TYPES.map((type) => {
          const Icon = TASK_ICONS[type];
          const active = taskType === type;
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  className={cn(
                    'h-auto flex-col gap-1.5 py-3 text-xs',
                    active && 'shadow-sm',
                  )}
                  onClick={() => setParam('task_type', type)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{TASK_TYPE_LABELS[type]}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="max-w-xs">{TASK_TYPE_DESCRIPTIONS[type]}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}