import { useGenerationStore } from '@/stores/generation.store';
import { useTaskResult, useToast } from '@/api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw } from 'lucide-react';
import type { GenerationResult } from '@/types/generation.types';

export function ResultsPanel() {
  const currentTask = useGenerationStore((s) => s.currentTask);
  const history = useGenerationStore((s) => s.history);
  const setParams = useGenerationStore((s) => s.setParams);
  const { push: pushToast } = useToast();

  // ИСПРАВЛЕНО: Показываем историю только если нет currentTask И если форма сброшена явно (хотя сейчас пусть показывает последний если currentTask сброшен)
  // На самом деле лучше показывать null если currentTask = null, но для UX оставим показ последнего из истории
  const taskId = currentTask?.task_id ?? history[0]?.task_id ?? null;
  const taskResult = useTaskResult(taskId);

  // Берём результат из кэша (useTaskResult) или фолбек на сохранённый в store
  const result: GenerationResult | null =
    taskResult.data ??
    (currentTask?.task_id === taskId ? currentTask?.result : undefined) ??
    history.find((t) => t.task_id === taskId)?.result ??
    null;

  if (!taskId) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
          No results to display
        </CardContent>
      </Card>
    );
  }

  // Если задача выполняется, отображаем заглушку (прогресс уже показывается в GenerateForm)
  const isRunning =
    currentTask?.task_id === taskId &&
    (currentTask.status === 'running' || currentTask.status === 'queued');

  if (isRunning) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary/50" />
          <p>Generation in progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (result?.status === 'failed') {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-destructive">
          <p className="font-semibold">Generation failed</p>
          <p className="text-sm mt-2">{result.status_message ?? 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result || result.audio_urls.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
          Waiting for results...
        </CardContent>
      </Card>
    );
  }

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUseAsReference = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        pushToast({
          variant: 'destructive',
          title: 'Download failed',
          description: `Server returned ${response.status} ${response.statusText}`,
        });
        return;
      }
      const blob = await response.blob();
      const ext = result.params?.audio_format || 'mp3';
      const file = new File([blob], `reference_${taskId.slice(0, 8)}.${ext}`, { type: blob.type });

      setParams({
        task_type: 'cover',
        reference_audio: file,
      });
    } catch (err) {
      pushToast({
        variant: 'destructive',
        title: 'Download failed',
        description: err instanceof Error
          ? `Cannot download audio: ${err.message}`
          : 'Cannot download audio. Check CORS settings on the backend.',
      });
    }
  };

  const handleUseAsSource = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        pushToast({
          variant: 'destructive',
          title: 'Download failed',
          description: `Server returned ${response.status} ${response.statusText}`,
        });
        return;
      }
      const blob = await response.blob();
      const ext = result.params?.audio_format || 'mp3';
      const file = new File([blob], `source_${taskId.slice(0, 8)}.${ext}`, { type: blob.type });

      setParams({
        task_type: 'repaint',
        src_audio: file,
      });
    } catch (err) {
      pushToast({
        variant: 'destructive',
        title: 'Download failed',
        description: err instanceof Error
          ? `Cannot download audio: ${err.message}`
          : 'Cannot download audio. Check CORS settings on the backend.',
      });
    }
  };


  const ext = result.params?.audio_format || 'mp3';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Results</CardTitle>
          <div className="flex gap-2">
            {result.metadata?.bpm && <Badge variant="secondary">{result.metadata.bpm} BPM</Badge>}
            {result.metadata?.keyscale && <Badge variant="secondary">{result.metadata.keyscale}</Badge>}
            {result.metadata?.duration && <Badge variant="secondary">{result.metadata.duration}s</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
        <div className="space-y-6">
          {result.audio_urls.map((url, i) => (
            <div key={`${taskId}-${i}`} className="space-y-3 p-4 border rounded-xl bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-muted-foreground">
                  Variation {i + 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleUseAsSource(url)}
                  >
                    Use as Source (Repaint)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleUseAsReference(url)}
                  >
                    Use as Ref (Cover)
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(url, `ace-step-${result.task_id}-${i + 1}.${ext}`)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <AudioPlayer src={url} title={`Result ${i + 1}`} />
            </div>
          ))}
        </div>

        {result.metadata && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {result.metadata.prompt && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Prompt
                </h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg leading-relaxed">
                  {result.metadata.prompt}
                </p>
              </div>
            )}
            {result.metadata.lyrics && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Lyrics
                </h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-mono">
                  {result.metadata.lyrics}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}