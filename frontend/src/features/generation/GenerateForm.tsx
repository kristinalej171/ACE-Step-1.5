import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenerationStore, DEFAULT_PARAMS } from '@/stores/generation.store';
import { useCreateGenerationTask, useToast } from '@/api/hooks';
import { generationSchema, type GenerationSchema } from '@/schemas/generation.schema';
import { BasicSection } from './BasicSection';
import { AdvancedSection } from './AdvancedSection';
import { ProgressTracker } from './ProgressTracker';
import { Play, RotateCcw } from 'lucide-react';
import type { GenerationTask } from '@/types/generation.types';
import { useEffect, useRef } from 'react';

export function GenerateForm() {
  const params = useGenerationStore((s) => s.params);
  const setParams = useGenerationStore((s) => s.setParams);
  const setCurrentTask = useGenerationStore((s) => s.setCurrentTask);
  const pushToHistory = useGenerationStore((s) => s.pushToHistory);
  const currentTask = useGenerationStore((s) => s.currentTask);
  const { push: pushToast } = useToast();

  const createTask = useCreateGenerationTask();

  const methods = useForm<GenerationSchema>({
    resolver: zodResolver(generationSchema),
    defaultValues: {
      ...DEFAULT_PARAMS,
      mp3_sample_rate: DEFAULT_PARAMS.mp3_sample_rate,
    },
  });

  // ИСПРАВЛЕНО: используем ref для methods чтобы избежать бесконечного цикла.
  // reset вызываем только когда изменился params (при загрузке пресета / смене task_type).
  const methodsRef = useRef(methods);
  methodsRef.current = methods;

  useEffect(() => {
    methodsRef.current.reset({ ...params }, { keepDirtyValues: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onSubmit = methods.handleSubmit(async (data) => {
    // Создаём задачу-заглушку до получения реального task_id
    const placeholderTask: GenerationTask = {
      task_id: '',
      status: 'queued',
      params: data,
      progress: 0,
      stage: 'queued',
      created_at: Date.now(),
    };
    setCurrentTask(placeholderTask);

    try {
      const result = await createTask.mutateAsync(data);

      const fullTask: GenerationTask = {
        ...placeholderTask,
        task_id: result.task_id,
        queue_position: result.queue_position,
      };
      setCurrentTask(fullTask);
      pushToHistory(fullTask);

      pushToast({
        title: 'Задача создана',
        description: result.queue_position > 1
          ? `Task ${result.task_id.slice(0, 8)}… (#${result.queue_position} in queue)`
          : `Task ${result.task_id.slice(0, 8)}… запускается`,
      });
    } catch (err) {
      pushToast({
        variant: 'destructive',
        title: 'Ошибка отправки',
        description: err instanceof Error ? err.message : String(err),
      });
      setCurrentTask(null);
    }
  });

  const handleReset = () => {
    methods.reset(DEFAULT_PARAMS);
    setParams(DEFAULT_PARAMS);
  };

  const isRunning = currentTask !== null &&
    currentTask.status !== 'succeeded' &&
    currentTask.status !== 'failed';

  const errorCount = Object.keys(methods.formState.errors).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormProvider {...methods}>
          <form onSubmit={onSubmit} className="space-y-6">
            <BasicSection />
            <AdvancedSection />

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={createTask.isPending}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {createTask.isPending ? 'Отправка...' : 'Generate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={createTask.isPending}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>

              {errorCount > 0 && (
                <p className="text-xs text-destructive">
                  {errorCount} validation error{errorCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </form>
        </FormProvider>

        {/* ProgressTracker только для активных задач */}
        {isRunning && <ProgressTracker />}
      </CardContent>
    </Card>
  );
}