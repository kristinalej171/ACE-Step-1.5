import { useGenerationStore } from '@/stores/generation.store';
import { useTaskResult } from '@/api/hooks';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function ProgressTracker() {
  const currentTask = useGenerationStore((s) => s.currentTask);
  const taskId = currentTask?.task_id ?? null;
  const taskResult = useTaskResult(taskId);
  const data = taskResult.data;

  const status = data?.status ?? currentTask?.status ?? 'running';
  const isTerminal = status === 'succeeded' || status === 'failed';

  // ИСПРАВЛЕНО: progress из бэкенда — значение 0.0–1.0, умножаем на 100
  const rawProgress = data?.progress ?? (currentTask?.progress != null ? currentTask.progress / 100 : 0);
  const progressPct = Math.min(100, Math.max(0, Math.round(rawProgress * 100)));

  const stage =
    data?.stage ??
    currentTask?.stage ??
    '';

  const stageLabel = (() => {
    if (isTerminal) return status === 'succeeded' ? 'Готово!' : 'Ошибка';
    if (!stage || stage === 'queued') return 'В очереди...';
    return stage;
  })();

  const Icon = isTerminal
    ? status === 'succeeded'
      ? CheckCircle2
      : XCircle
    : Loader2;

  const iconColor = isTerminal
    ? status === 'succeeded'
      ? 'text-green-500'
      : 'text-destructive'
    : 'text-primary';

  return (
    <div className="space-y-2 rounded-lg border p-4 bg-muted/20">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${iconColor} ${!isTerminal ? 'animate-spin' : ''}`}
          />
          <span className="font-medium">{stageLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {currentTask?.queue_position != null && !isTerminal && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              #{currentTask.queue_position} in queue
            </span>
          )}
          <span className="font-mono tabular-nums text-xs text-muted-foreground">
            {progressPct}%
          </span>
        </div>
      </div>
      <Progress
        value={progressPct}
        className="h-2"
      />
      {taskId && (
        <p className="text-xs text-muted-foreground font-mono">
          Task: {taskId.slice(0, 16)}…
        </p>
      )}
    </div>
  );
}