import { z } from 'zod';
import {
  AUDIO_FORMATS,
  MP3_BITRATES,
  SUPPORTED_LANGUAGES,
} from '@/lib/constants';

const audioFormatValues = AUDIO_FORMATS.map((x) => x.value) as [
  'flac', 'mp3', 'wav', 'wav32', 'opus', 'aac',
];
const mp3BitrateValues = MP3_BITRATES.map((x) => x.value) as ['128k', '192k', '256k', '320k'];
const languageCodes = SUPPORTED_LANGUAGES.map((x) => x.code) as [string, ...string[]];

export const generationSchema = z.object({
  task_type: z.enum(['text2music', 'cover', 'repaint', 'lego', 'extract', 'complete']),
  instruction: z.string().optional(),
  caption: z.string().min(1, 'Caption is required for text2music'),
  global_caption: z.string().optional(),
  lyrics: z.string(),
  instrumental: z.boolean(),
  vocal_language: z.enum(languageCodes).or(z.string()),

  bpm: z
    .number()
    .int()
    .min(30, 'BPM должен быть >= 30')
    .max(300, 'BPM должен быть <= 300')
    .optional()
    .or(z.literal(0).transform(() => undefined)),
  keyscale: z.string(),
  timesignature: z.string(),
  duration: z
    .number()
    .min(10, 'Минимальная длительность 10 секунд')
    .max(600, 'Максимальная длительность 600 секунд')
    .optional()
    .or(z.literal(-1).transform(() => undefined))
    .or(z.literal(0).transform(() => undefined)),

  inference_steps: z.number().int().min(1).max(200),
  guidance_scale: z.number().min(1.0).max(15.0),
  seed: z.number().int(),
  use_random_seed: z.boolean(),
  use_adg: z.boolean(),
  cfg_interval_start: z.number().min(0).max(1),
  cfg_interval_end: z.number().min(0).max(1),
  shift: z.number().min(1.0).max(5.0),
  infer_method: z.enum(['ode', 'sde']),
  sampler_mode: z.enum(['euler', 'heun']),
  velocity_norm_threshold: z.number().min(0).max(10),
  velocity_ema_factor: z.number().min(0).max(1),

  dcw_enabled: z.boolean(),
  dcw_mode: z.enum(['low', 'high', 'double', 'pix']),
  dcw_scaler: z.number().min(0).max(0.1),
  dcw_high_scaler: z.number().min(0).max(0.1),
  dcw_wavelet: z.enum(['haar', 'db2', 'db4', 'sym4', 'sym8', 'coif2']),

  timesteps: z.array(z.number()).optional(),

  repainting_start: z.number().min(0).default(0),
  repainting_end: z.number().optional(),
  repaint_latent_crossfade_frames: z.number().int().min(0).max(100),
  repaint_wav_crossfade_sec: z.number().min(0).max(1),
  repaint_mode: z.enum(['conservative', 'balanced', 'aggressive']),
  repaint_strength: z.number().min(0).max(1),
  audio_cover_strength: z.number().min(0).max(1),
  cover_noise_strength: z.number().min(0).max(1),

  retake_seed: z.number().int().optional(),
  retake_variance: z.number().min(0).max(1),

  flow_edit_morph: z.boolean(),
  flow_edit_source_caption: z.string().optional(),
  flow_edit_source_lyrics: z.string().optional(),
  flow_edit_n_min: z.number().min(0).max(1),
  flow_edit_n_max: z.number().min(0).max(1),
  flow_edit_n_avg: z.number().int().min(1),

  thinking: z.boolean(),
  lm_temperature: z.number().min(0).max(2),
  lm_cfg_scale: z.number().min(1).max(3),
  lm_top_k: z.number().int().min(0).optional(),
  lm_top_p: z.number().min(0).max(1).optional(),
  lm_negative_prompt: z.string(),
  use_cot_metas: z.boolean(),
  use_cot_caption: z.boolean(),
  use_cot_lyrics: z.boolean(),
  use_cot_language: z.boolean(),
  use_constrained_decoding: z.boolean(),

  audio_format: z.enum(audioFormatValues),
  mp3_bitrate: z.enum(mp3BitrateValues),
  mp3_sample_rate: z.preprocess((v) => Number(v), z.number().int().refine((v) => v === 44100 || v === 48000)),

  batch_size: z.number().int().min(1).max(8),

  reference_audio: z.any().optional(),
  src_audio: z.any().optional(),
  audio_codes: z.string(),

  chunk_mask_mode: z.enum(['explicit', 'auto']),
  track_name: z.string().optional(),
  track_classes: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  const needsSource = ['cover', 'repaint', 'lego', 'extract', 'complete'].includes(data.task_type);
  if (needsSource) {
    const hasSrc = !!data.src_audio;
    const hasCodes = !!data.audio_codes;
    if (!hasSrc && !hasCodes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Для задачи "${data.task_type}" нужен source-аудио или audio_codes`,
        path: ['src_audio'],
      });
    }
  }
  if (data.task_type === 'repaint') {
    if (data.repainting_end == null || data.repainting_end <= data.repainting_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Repaint end должен быть больше repainting_start',
        path: ['repainting_end'],
      });
    }
  }
  if (data.cfg_interval_end < data.cfg_interval_start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'cfg_interval_end должен быть >= cfg_interval_start',
      path: ['cfg_interval_end'],
    });
  }
  if (data.flow_edit_n_max < data.flow_edit_n_min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'flow_edit_n_max должен быть >= flow_edit_n_min',
      path: ['flow_edit_n_max'],
    });
  }
});

export type GenerationSchema = z.infer<typeof generationSchema>;