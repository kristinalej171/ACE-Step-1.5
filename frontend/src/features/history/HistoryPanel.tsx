import { useGenerationStore } from '@/stores/generation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Play, Trash2 } from 'lucide-react';
import type { GenerationTask } from '@/types/generation.types';
import { TASK_TYPE_LABELS } from '@/types/generation.types';
import { formatDistanceToNow } from 'date-fns';

export function HistoryPanel() {
  const history = useGenerationStore((s) => s.history);
  const currentTask = useGenerationStore((s) => s.currentTask);
  const setCurrentTask = useGenerationStore((s) => s.setCurrentTask);
  const clearHistory = useGenerationStore((s) => s.clearHistory);
  const removeFromHistory = useGenerationStore((s) => s.removeFromHistory);

  if (history.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
          No generation history
        </CardContent>
      </Card>
    );
  }

  const handleLoadTask = (task: GenerationTask) => {
    setCurrentTask(task);
  };

  const getStatusColor = (status: GenerationTask['status']) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      case 'running':
      case 'queued':
        return 'bg-primary/10 text-primary hover:bg-primary/20';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle>History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-muted-foreground hover:text-destructive h-8 px-2"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {history.map((task) => {
            // ИСПРАВЛЕНО: Теперь isActive реактивен, т.к. использует currentTask из хука
            const isActive = task.task_id === currentTask?.task_id;

            return (
              <div
                key={task.task_id}
                className={`group relative p-3 rounded-lg border text-left transition-colors ${
                  isActive
                    ? 'bg-accent/50 border-primary/50'
                    : 'bg-card hover:bg-accent/30 cursor-pointer'
                }`}
                onClick={() => handleLoadTask(task)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] uppercase font-mono ${getStatusColor(
                      task.status,
                    )}`}
                  >
                    {task.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(task.created_at, { addSuffix: true })}
                  </span>
                </div>

                <div className="space-y-1 pr-8">
                  <p className="text-sm font-medium line-clamp-2 leading-snug">
                    {task.params.caption || 'No prompt'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {TASK_TYPE_LABELS[task.params.task_type]} •{' '}
                    {task.task_id.slice(0, 8)}…
                  </p>
                </div>

                <div className="absolute right-2 bottom-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadTask(task);
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(task.task_id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}