import type { VramProfile } from '@/types/generation.types';

export interface VramConfig {
  label: string;
  dit_model: string;
  lm_model: string;
  backend: 'vllm' | 'pt' | 'mlx';
  offload_to_cpu: boolean;
  offload_dit_to_cpu: boolean;
  quantization: 'int8' | 'int4' | null;
  max_batch_size: number;
  max_duration: number;
  recommended_inference_steps: number;
  recommended_guidance_scale: number;
}

export const VRAM_PROFILES: Record<VramProfile, VramConfig> = {
  '22gb': {
    label: '22GB VRAM (RTX 3090/4090)',
    dit_model: 'acestep-v15-xl-base',
    lm_model: 'acestep-5Hz-lm-4B',
    backend: 'vllm',
    offload_to_cpu: true,
    offload_dit_to_cpu: false,
    quantization: null,
    max_batch_size: 2,
    max_duration: 240,
    recommended_inference_steps: 50,
    recommended_guidance_scale: 15.0,
  },
  '40gb': {
    label: '40GB VRAM (A100/A6000)',
    dit_model: 'acestep-v15-xl-sft',
    lm_model: 'acestep-5Hz-lm-4B',
    backend: 'vllm',
    offload_to_cpu: false,
    offload_dit_to_cpu: false,
    quantization: null,
    max_batch_size: 4,
    max_duration: 600,
    recommended_inference_steps: 50,
    recommended_guidance_scale: 15.0,
  },
} as const;

export function applyVramProfileToParams(
  profile: VramProfile,
  currentParams: Record<string, unknown>,
): Record<string, unknown> {
  const config = VRAM_PROFILES[profile];
  return {
    ...currentParams,
    inference_steps: config.recommended_inference_steps,
    guidance_scale: config.recommended_guidance_scale,
    batch_size: Math.min(
      (currentParams.batch_size as number) ?? 1,
      config.max_batch_size,
    ),
    // ИСПРАВЛЕНО: сохраняем undefined (auto) если duration не задан
    duration: typeof currentParams.duration === 'number'
      ? Math.min(currentParams.duration, config.max_duration)
      : undefined,
  };
}