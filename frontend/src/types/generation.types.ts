/** Все допустимые типы задач генерации */
export type TaskType =
  | 'text2music'
  | 'cover'
  | 'repaint'
  | 'lego'
  | 'extract'
  | 'complete';

export const TASK_TYPES: TaskType[] = [
  'text2music', 'cover', 'repaint', 'lego', 'extract', 'complete',
];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  text2music: 'Text → Music',
  cover: 'Cover / Remix',
  repaint: 'Repaint',
  lego: 'Lego (add track)',
  extract: 'Extract stems',
  complete: 'Complete',
};

export const TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
  text2music: 'Генерация музыки по текстовому описанию.',
  cover: 'Смена стиля существующей композиции с сохранением мелодии.',
  repaint: 'Перегенерация заданного временного отрезка в существующем треке.',
  lego: 'Добавление нового трека (инструмента) поверх существующего.',
  extract: 'Извлечение отдельного трека из микса (вокал, барабаны и т.д.).',
  complete: 'Автодополнение недостающих партий на основе существующих.',
};

/** Задачи, которые требуют загрузки исходного аудио */
export const TASKS_REQUIRING_SRC_AUDIO: TaskType[] = [
  'cover', 'repaint', 'lego', 'extract', 'complete',
];

export type AudioFormat = 'flac' | 'mp3' | 'wav' | 'wav32' | 'opus' | 'aac';
export type Mp3Bitrate = '128k' | '192k' | '256k' | '320k';
export type Mp3SampleRate = 44100 | 48000;
export type SamplerMode = 'euler' | 'heun';
export type InferMethod = 'ode' | 'sde';
export type DcwMode = 'low' | 'high' | 'double' | 'pix';
export type DcwWavelet = 'haar' | 'db2' | 'db4' | 'sym4' | 'sym8' | 'coif2';
export type RepaintMode = 'conservative' | 'balanced' | 'aggressive';

/** Полный контракт параметров генерации (соответствует GenerateMusicRequest в Python) */
export interface GenerationParams {
  // Task & instruction
  task_type: TaskType;
  instruction?: string;
  caption: string;           // → отправляется как 'prompt' на бэкенд
  global_caption?: string;
  lyrics: string;
  instrumental: boolean;
  vocal_language: string;

  // Music metadata
  bpm?: number;
  keyscale?: string;         // → key_scale на бэкенде
  timesignature?: string;    // → time_signature на бэкенде
  duration?: number;

  // DiT parameters
  inference_steps: number;
  guidance_scale: number;
  seed: number;
  use_random_seed: boolean;
  use_adg: boolean;
  cfg_interval_start: number;
  cfg_interval_end: number;
  shift: number;
  infer_method: InferMethod;
  sampler_mode: SamplerMode; // UI-only, бэкенд не читает — сохраняется для UX
  velocity_norm_threshold: number;
  velocity_ema_factor: number;

  // DCW
  dcw_enabled: boolean;
  dcw_mode: DcwMode;
  dcw_scaler: number;
  dcw_high_scaler: number;
  dcw_wavelet: DcwWavelet;

  // Custom timesteps
  timesteps?: number[];

  // Repaint / cover
  repainting_start: number;
  repainting_end?: number;
  repaint_latent_crossfade_frames: number;
  repaint_wav_crossfade_sec: number;
  repaint_mode: RepaintMode;
  repaint_strength: number;
  audio_cover_strength: number;
  cover_noise_strength: number;

  // Retake
  retake_seed?: number;
  retake_variance: number;

  // Flow edit (morph)
  flow_edit_morph: boolean;
  flow_edit_source_caption?: string;
  flow_edit_source_lyrics?: string;
  flow_edit_n_min: number;
  flow_edit_n_max: number;
  flow_edit_n_avg: number;

  // LM parameters
  thinking: boolean;
  lm_temperature: number;
  lm_cfg_scale: number;
  lm_top_k?: number;
  lm_top_p?: number;
  lm_negative_prompt: string;
  use_cot_metas: boolean;
  use_cot_caption: boolean;
  use_cot_lyrics: boolean;
  use_cot_language: boolean;
  use_constrained_decoding: boolean; // → constrained_decoding на бэкенде

  // Output
  audio_format: AudioFormat;
  mp3_bitrate: Mp3Bitrate;
  mp3_sample_rate: Mp3SampleRate;

  // Batch
  batch_size: number;

  // Audio inputs
  reference_audio?: File;
  src_audio?: File;
  audio_codes: string;       // → audio_code_string на бэкенде

  // Chunk mask mode
  chunk_mask_mode: 'explicit' | 'auto';

  // Track selection
  track_name?: string;
  track_classes?: string[];
}

export interface GenerationTask {
  task_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  params: GenerationParams;
  progress: number;
  stage: string;
  created_at: number;
  queue_position?: number;
  result?: GenerationResult;
}

/** Результат генерации, адаптированный из legacy backend-формата */
export interface GenerationResult {
  task_id: string;
  /** URL вида /v1/audio?path=... для воспроизведения */
  audio_urls: string[];
  raw_audio_paths: string[];
  first_audio_path?: string;
  /** params не возвращается бэкендом в query_result — пустой объект */
  params: GenerationParams;
  metadata?: GenerationMetadata;
  time_costs?: TimeCosts;
  seed_value?: string;
  status_message?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  /** Прогресс 0.0–1.0 (только при running) */
  progress?: number;
  /** Текстовое описание текущей стадии */
  stage?: string;
}

export interface GenerationMetadata {
  bpm?: number | string;
  keyscale?: string;
  timesignature?: string;
  duration?: number;
  genres?: string;
  prompt?: string;
  lyrics?: string;
  language?: string;
  progress?: number;
  stage?: string;
  caption?: string;
}

export interface TimeCosts {
  lm_phase1_time?: number;
  lm_phase2_time?: number;
  dit_total_time_cost?: number;
  dit_vae_decode_time_cost?: number;
  pipeline_total_time?: number;
}

export type VramProfile = '22gb' | '40gb';

export interface Preset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  params: Partial<GenerationParams>;
  created_at: number;
}

export interface TaskProgress {
  progress: number;
  stage: string;
  elapsed_seconds?: number;
}