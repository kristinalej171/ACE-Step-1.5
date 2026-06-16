import type { GenerationParams } from '@/types/generation.types';

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  params: Partial<GenerationParams>;
  tags: string[];
}

export const PRESETS: PresetConfig[] = [
  {
    id: 'quick-test',
    name: 'Quick Test',
    description: 'Быстрая итерация: 30 сек, 8 шагов, минимальный CFG',
    tags: ['fast', 'test', 'low-vram'],
    params: {
      duration: 30,
      inference_steps: 8,
      guidance_scale: 7.0,
      shift: 1.0,
      use_adg: false,
      dcw_enabled: false,
      audio_format: 'mp3',
      mp3_bitrate: '128k',
      batch_size: 1,
    },
  },
  {
    id: 'balanced',
    name: 'Balanced Quality',
    description: 'Оптимальный баланс: 120 сек, 30 шагов, стандартный CFG',
    tags: ['balanced', 'default'],
    params: {
      duration: 120,
      inference_steps: 30,
      guidance_scale: 12.0,
      shift: 3.0,
      use_adg: true,
      dcw_enabled: true,
      dcw_mode: 'double',
      audio_format: 'flac',
      batch_size: 1,
    },
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Максимальное качество: 240 сек, 50 шагов, полный набор оптимизаций',
    tags: ['quality', 'production'],
    params: {
      duration: 240,
      inference_steps: 50,
      guidance_scale: 15.0,
      shift: 3.0,
      use_adg: true,
      dcw_enabled: true,
      dcw_mode: 'double',
      dcw_scaler: 0.05,
      dcw_high_scaler: 0.02,
      dcw_wavelet: 'haar',
      audio_format: 'flac',
      batch_size: 1,
      use_cot_metas: true,
      use_cot_caption: true,
      use_cot_language: true,
    },
  },
  {
    id: 'cover-remix',
    name: 'Cover / Remix',
    description: 'Пресет для задачи Cover: высокая сила покрытия, шумоподавление',
    tags: ['cover', 'remix'],
    params: {
      task_type: 'cover',
      audio_cover_strength: 1.0,
      cover_noise_strength: 0.2,
      inference_steps: 40,
      guidance_scale: 13.0,
      repaint_mode: 'balanced',
      repaint_strength: 0.7,
    },
  },
  {
    id: 'repaint-edit',
    name: 'Repaint Edit',
    description: 'Пресет для частичной перегенерации: консервативный режим',
    tags: ['repaint', 'edit'],
    params: {
      task_type: 'repaint',
      repaint_mode: 'conservative',
      repaint_strength: 0.4,
      repaint_latent_crossfade_frames: 15,
      repaint_wav_crossfade_sec: 0.1,
      inference_steps: 35,
      guidance_scale: 14.0,
    },
  },
];

export function getPresetById(id: string): PresetConfig | undefined {
  return PRESETS.find((p) => p.id === id);
}