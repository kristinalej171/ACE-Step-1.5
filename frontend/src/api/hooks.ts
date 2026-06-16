import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkHealth,
  createGenerationTask,
  listModels,
  queryTaskResults,
} from './generation.api';
import type { GenerationParams, GenerationResult } from '@/types/generation.types';
import { useGenerationStore } from '@/stores/generation.store';
import { useCallback, useRef } from 'react';

const QUERY_KEYS = {
  health: ['health'] as const,
  models: ['models'] as const,
  taskResult: (id: string) => ['task-result', id] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.health,
    queryFn: checkHealth,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useModels() {
  return useQuery({
    queryKey: QUERY_KEYS.models,
    queryFn: listModels,
    staleTime: 60_000,
  });
}

export function useTaskResult(taskId: string | null) {
  const setCurrentTask = useGenerationStore((s) => s.setCurrentTask);
  const currentTask = useGenerationStore((s) => s.currentTask);
  const pushToHistory = useGenerationStore((s) => s.pushToHistory);

  // Храним флаг, чтобы pushToHistory вызывать только один раз при завершении
  const completedRef = useRef(false);

  return useQuery({
    queryKey: taskId ? QUERY_KEYS.taskResult(taskId) : ['task-result', 'none'],
    queryFn: async () => {
      const results = await queryTaskResults([taskId!]);
      return results.find((r) => r.task_id === taskId) ?? null;
    },
    enabled: !!taskId,
    refetchInterval: (q) => {
      const data = q.state.data as GenerationResult | null;
      if (!data) return 2_000;
      if (data.status === 'succeeded' || data.status === 'failed') return false;
      return 2_000;
    },
    select: (data: GenerationResult | null) => {
      // Синхронизируем store при каждом успешном poll
      if (!data || !currentTask) return data;

      const isTerminal = data.status === 'succeeded' || data.status === 'failed';

      // Обновляем currentTask прогрессом и стадией
      if (!isTerminal) {
        setCurrentTask({
          ...currentTask,
          status: data.status,
          progress: (data.progress ?? 0) * 100,
          stage: data.stage ?? currentTask.stage,
        });
      }

      // При завершении — один раз обновляем history
      if (isTerminal && !completedRef.current) {
        completedRef.current = true;
        const finishedTask = {
          ...currentTask,
          status: data.status,
          progress: 100,
          stage: data.status === 'succeeded' ? 'done' : 'failed',
          result: data,
        };
        setCurrentTask(finishedTask);
        pushToHistory(finishedTask);
      }

      return data;
    },
  });
}

// ─── Toast system ────────────────────────────────────────────────────────────

interface ToastPayload {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToastListener = (payload: ToastPayload) => void;

const listeners: ToastListener[] = [];

export function useToast() {
  const push = useCallback((payload: ToastPayload) => {
    listeners.forEach((l) => l(payload));
  }, []);

  const subscribe = useCallback((listener: ToastListener) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  return { push, subscribe };
}

// ─── Mutation: создание задачи ───────────────────────────────────────────────

export function useCreateGenerationTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: GenerationParams) => createGenerationTask(params),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['task-result', result.task_id] });
    },
  });
}