import { useGenerationStore } from '@/stores/generation.store';
import { useHealth, useModels } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Activity, Server, Wifi, WifiOff } from 'lucide-react';

export function Header() {
  const vramProfile = useGenerationStore((s) => s.vramProfile);
  const setVramProfile = useGenerationStore((s) => s.setVramProfile);
  const currentTask = useGenerationStore((s) => s.currentTask);
  const health = useHealth();
  const models = useModels();

  const isOnline = health.isSuccess && health.data?.status === 'ok';
  const modelsCount = models.data?.models?.length ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-sm font-semibold">ACE-Step 1.5</h1>
            <p className="text-xs text-muted-foreground">Music Generation Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentTask && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1">
                  <Activity className="h-3.5 w-3.5 animate-pulse-slow text-primary" />
                  <span className="text-xs text-primary">{currentTask.status}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Task: {currentTask.task_id}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-md border px-2 py-1">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{modelsCount} models</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Available models on backend</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isOnline ? 'Backend online' : 'Backend offline'}
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">VRAM:</span>
            <div className="flex rounded-md border">
              <Button
                variant={vramProfile === '22gb' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVramProfile('22gb')}
                className={cn('h-7 rounded-r-none px-2 text-xs')}
              >
                22GB
              </Button>
              <Button
                variant={vramProfile === '40gb' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVramProfile('40gb')}
                className={cn('h-7 rounded-l-none px-2 text-xs')}
              >
                40GB
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}