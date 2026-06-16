import { api } from './client';
import type { GenerationParams, GenerationResult, GenerationMetadata } from '@/types/generation.types';

// ─── Backend legacy response shapes ────────────────────────────────────────────

/** Обёртка, которую возвращает _wrap_response() на бэкенде */
interface WrappedResponse<T> {
  data: T;
  code: number;
  error: string | null;
  timestamp?: number;
  extra?: null;
}

/** Ответ /release_task */
interface ReleaseTaskData {
  task_id: string;
  status: string;
  queue_position: number;
}

/**
 * Один элемент result_data внутри JSON-строки для succeeded-задачи.
 * Приходит как строка поля `result`, которую нужно парсить отдельно.
 */
interface BackendResultItem {
  file: string;           // URL /v1/audio?path=... для аудио
  wave: string;
  status: number;         // 0=running, 1=succeeded, 2=failed
  create_time: number;
  env?: string;
  prompt?: string;        // caption из metas
  lyrics?: string;
  metas?: {
    bpm?: number | string | null;
    duration?: number | null;
    genres?: string | null;
    keyscale?: string | null;
    timesignature?: string | null;
  };
  progress?: number;      // 0.0–1.0, только для running
  stage?: string;
  error?: string | null;
}

/** Элемент data_list из /query_result */
interface BackendQueryResultItem {
  task_id: string;
  result: string;          // JSON-строка с массивом BackendResultItem[]
  status: number;          // 0=running, 1=succeeded, 2=failed
  progress_text?: string;
}

// ─── Status mapping ─────────────────────────────────────────────────────────────

function mapStatusInt(n: number): GenerationResult['status'] {
  if (n === 1) return 'succeeded';
  if (n === 2) return 'failed';
  return 'running';
}

// ─── Adapter: backend → frontend GenerationResult ──────────────────────────────

function adaptBackendResult(item: BackendQueryResultItem): GenerationResult {
  let parsed: BackendResultItem[] = [];
  try {
    const raw = JSON.parse(item.result);
    parsed = Array.isArray(raw) ? raw : [];
  } catch {
    parsed = [];
  }

  const first = parsed[0] ?? null;
  const status = mapStatusInt(item.status);

  // Audio URLs: поле `file` уже является /v1/audio?path=... URL
  const audio_urls = parsed
    .map((r) => r.file)
    .filter(Boolean);

  // Metadata из первого элемента
  const metas = first?.metas ?? {};
  const metadata: GenerationMetadata = {
    bpm: metas.bpm ?? undefined,
    keyscale: metas.keyscale ?? undefined,
    timesignature: metas.timesignature ?? undefined,
    duration: typeof metas.duration === 'number' ? metas.duration : undefined,
    genres: metas.genres ?? undefined,
    prompt: first?.prompt ?? undefined,
    lyrics: first?.lyrics ?? undefined,
    // progress и stage из running-состояния
    progress: first?.progress ?? undefined,
    stage: first?.stage ?? undefined,
  };

  return {
    task_id: item.task_id,
    status,
    audio_urls,
    raw_audio_paths: [],          // не используем серверные пути напрямую
    first_audio_path: audio_urls[0] ?? undefined,
    params: {} as GenerationParams, // бэкенд не возвращает params в query_result
    metadata,
    // progress для ProgressTracker (из running-поля first item или 0)
    progress: first?.progress,
    stage: first?.stage,
    status_message: first?.error ?? undefined,
  } as GenerationResult & { progress?: number; stage?: string };
}

// ─── Public API functions ───────────────────────────────────────────────────────

/** POST /release_task — создаёт задачу генерации */
export async function createGenerationTask(
  params: GenerationParams,
): Promise<{ task_id: string; queue_position: number }> {
  const form = new FormData();

  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      form.append(key, value, value.name);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      form.append(key, String(value));
    } else if (Array.isArray(value)) {
      // массив строк (track_classes, timesteps)
      form.append(key, JSON.stringify(value));
    } else if (typeof value === 'string') {
      form.append(key, value);
    }
  };

  // ── Task & instruction ─────────────────────────────────────────────────────
  append('task_type', params.task_type);
  if (params.instruction) append('instruction', params.instruction);

  // ИСПРАВЛЕНО: caption → prompt (бэкенд читает 'prompt')
  append('prompt', params.caption);
  if (params.global_caption) append('global_caption', params.global_caption);
  append('lyrics', params.lyrics);
  append('instrumental', params.instrumental);
  append('vocal_language', params.vocal_language);

  // ── Music metadata ─────────────────────────────────────────────────────────
  if (params.bpm !== undefined && params.bpm !== 0) append('bpm', params.bpm);
  // ИСПРАВЛЕНО: keyscale → key_scale, timesignature → time_signature
  if (params.keyscale) append('key_scale', params.keyscale);
  if (params.timesignature) append('time_signature', params.timesignature);
  if (params.duration !== undefined) append('audio_duration', params.duration);

  // ── DiT parameters ─────────────────────────────────────────────────────────
  append('inference_steps', params.inference_steps);
  append('guidance_scale', params.guidance_scale);
  if (params.use_random_seed) {
    append('use_random_seed', true);
  } else {
    append('use_random_seed', false);
    append('seed', params.seed);
  }
  append('use_adg', params.use_adg);
  append('cfg_interval_start', params.cfg_interval_start);
  append('cfg_interval_end', params.cfg_interval_end);
  append('shift', params.shift);
  append('infer_method', params.infer_method);
  // sampler_mode не поддерживается бэкендом — не отправляем

  // velocity_norm_threshold / velocity_ema_factor — только если бэкенд поддержит
  // (поля есть в UI, но не в GenerateMusicRequest — отправляем для совместимости)
  append('velocity_norm_threshold', params.velocity_norm_threshold);
  append('velocity_ema_factor', params.velocity_ema_factor);

  // ── DCW ────────────────────────────────────────────────────────────────────
  // Поля DCW отправляются — бэкенд прокинет их дальше через RequestParser
  append('dcw_enabled', params.dcw_enabled);
  append('dcw_mode', params.dcw_mode);
  append('dcw_scaler', params.dcw_scaler);
  append('dcw_high_scaler', params.dcw_high_scaler);
  append('dcw_wavelet', params.dcw_wavelet);

  // ── Custom timesteps ────────────────────────────────────────────────────────
  if (params.timesteps?.length) {
    // Бэкенд ожидает строку через запятую
    append('timesteps', params.timesteps.join(','));
  }

  // ── Repaint / cover ─────────────────────────────────────────────────────────
  append('repainting_start', params.repainting_start);
  if (params.repainting_end !== undefined) append('repainting_end', params.repainting_end);
  append('repaint_latent_crossfade_frames', params.repaint_latent_crossfade_frames);
  append('repaint_wav_crossfade_sec', params.repaint_wav_crossfade_sec);
  append('repaint_mode', params.repaint_mode);
  append('repaint_strength', params.repaint_strength);
  append('audio_cover_strength', params.audio_cover_strength);
  append('cover_noise_strength', params.cover_noise_strength);

  // ── Retake ──────────────────────────────────────────────────────────────────
  if (params.retake_seed !== undefined) append('retake_seed', params.retake_seed);
  append('retake_variance', params.retake_variance);

  // ── Flow edit ───────────────────────────────────────────────────────────────
  append('flow_edit_morph', params.flow_edit_morph);
  if (params.flow_edit_source_caption) append('flow_edit_source_caption', params.flow_edit_source_caption);
  if (params.flow_edit_source_lyrics) append('flow_edit_source_lyrics', params.flow_edit_source_lyrics);
  append('flow_edit_n_min', params.flow_edit_n_min);
  append('flow_edit_n_max', params.flow_edit_n_max);
  append('flow_edit_n_avg', params.flow_edit_n_avg);

  // ── LM parameters ───────────────────────────────────────────────────────────
  append('thinking', params.thinking);
  append('lm_temperature', params.lm_temperature);
  append('lm_cfg_scale', params.lm_cfg_scale);
  if (params.lm_top_k !== undefined && params.lm_top_k > 0) append('lm_top_k', params.lm_top_k);
  if (params.lm_top_p !== undefined) append('lm_top_p', params.lm_top_p);
  append('lm_negative_prompt', params.lm_negative_prompt);
  append('use_cot_metas', params.use_cot_metas);
  append('use_cot_caption', params.use_cot_caption);
  append('use_cot_lyrics', params.use_cot_lyrics);
  append('use_cot_language', params.use_cot_language);
  // ИСПРАВЛЕНО: use_constrained_decoding → constrained_decoding
  append('constrained_decoding', params.use_constrained_decoding);

  // ── Output format ────────────────────────────────────────────────────────────
  append('audio_format', params.audio_format);
  if (params.audio_format === 'mp3') {
    // mp3_bitrate / mp3_sample_rate: бэкенд не читает напрямую, но отправляем для расширяемости
    append('mp3_bitrate', params.mp3_bitrate);
    append('mp3_sample_rate', params.mp3_sample_rate);
  }

  // ── Batch ────────────────────────────────────────────────────────────────────
  append('batch_size', params.batch_size);

  // ── Audio inputs ─────────────────────────────────────────────────────────────
  // reference_audio → поле 'reference_audio' (парсер читает ref_audio | reference_audio)
  if (params.reference_audio) append('reference_audio', params.reference_audio);
  // src_audio → поле 'src_audio' (парсер читает ctx_audio | src_audio)
  if (params.src_audio) append('src_audio', params.src_audio);
  // ИСПРАВЛЕНО: audio_codes → audio_code_string
  if (params.audio_codes) append('audio_code_string', params.audio_codes);

  // ── Chunk mask / track ────────────────────────────────────────────────────────
  append('chunk_mask_mode', params.chunk_mask_mode);
  if (params.track_name) append('track_name', params.track_name);
  if (params.track_classes?.length) {
    // Бэкенд принимает как строку или список
    params.track_classes.forEach((cls) => form.append('track_classes', cls));
  }

  const response = await api.postForm<WrappedResponse<ReleaseTaskData>>('/release_task', form);
  return {
    task_id: response.data.task_id,
    queue_position: response.data.queue_position ?? 0,
  };
}

/** POST /query_result — опрос статуса задач.
 *  Бэкенд возвращает legacy-формат: result — JSON-строка, status — int.
 *  Адаптируем к фронтенд-типу GenerationResult.
 */
export async function queryTaskResults(taskIds: string[]): Promise<GenerationResult[]> {
  const response = await api.post<WrappedResponse<BackendQueryResultItem[]>>(
    '/query_result',
    { task_id_list: taskIds },
  );

  const items = response.data ?? [];
  return items.map(adaptBackendResult);
}

/** GET /health — проверка работоспособности бэкенда */
export async function checkHealth(): Promise<{ status: string }> {
  const response = await api.get<WrappedResponse<{ status: string }>>('/health');
  return response.data;
}

/** GET /v1/models — список доступных моделей */
export async function listModels(): Promise<{
  models: { name: string; is_default: boolean }[];
}> {
  const response = await api.get<WrappedResponse<unknown>>('/v1/models');
  return response.data as { models: { name: string; is_default: boolean }[] };
}