import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';
import type {
  GenerationParams,
  GenerationTask,
  Preset,
  VramProfile,
} from '@/types/generation.types';

export const DEFAULT_PARAMS: GenerationParams = {
  task_type: 'text2music',
  caption: '',
  global_caption: '',
  lyrics: '',
  instrumental: false,
  vocal_language: 'en',
  bpm: undefined,
  keyscale: '',
  timesignature: '',
  duration: undefined,
  inference_steps: 50,
  guidance_scale: 15.0,
  seed: -1,
  use_random_seed: true,
  use_adg: false,
  cfg_interval_start: 0.0,
  cfg_interval_end: 1.0,
  shift: 3.0,
  infer_method: 'ode',
  sampler_mode: 'euler',
  velocity_norm_threshold: 0,
  velocity_ema_factor: 0,
  dcw_enabled: true,
  dcw_mode: 'double',
  dcw_scaler: 0.05,
  dcw_high_scaler: 0.02,
  dcw_wavelet: 'haar',
  timesteps: undefined,
  repainting_start: 0,
  repainting_end: undefined,
  repaint_latent_crossfade_frames: 10,
  repaint_wav_crossfade_sec: 0.05,
  repaint_mode: 'balanced',
  repaint_strength: 0.5,
  audio_cover_strength: 1.0,
  cover_noise_strength: 0.2,
  retake_variance: 0,
  flow_edit_morph: false,
  flow_edit_source_caption: '',
  flow_edit_source_lyrics: '',
  flow_edit_n_min: 0.0,
  flow_edit_n_max: 1.0,
  flow_edit_n_avg: 1,
  thinking: true,
  lm_temperature: 0.85,
  lm_cfg_scale: 2.5,   // ИСПРАВЛЕНО: было 2.0, бэкенд по умолчанию 2.5
  lm_top_k: 0,
  lm_top_p: 0.9,
  lm_negative_prompt: 'NO USER INPUT',
  use_cot_metas: true,
  use_cot_caption: true,
  use_cot_lyrics: false,
  use_cot_language: true,
  use_constrained_decoding: true,
  audio_format: 'mp3',  // ИСПРАВЛЕНО: было 'flac', бэкенд по умолчанию 'mp3'
  mp3_bitrate: '256k',
  mp3_sample_rate: 48000,
  batch_size: 1,
  audio_codes: '',
  chunk_mask_mode: 'auto',
};

interface GenerationStore {
  params: GenerationParams;
  setParam: <K extends keyof GenerationParams>(
    key: K,
    value: GenerationParams[K],
  ) => void;
  setParams: (patch: Partial<GenerationParams>) => void;
  resetParams: () => void;

  currentTask: GenerationTask | null;
  setCurrentTask: (task: GenerationTask | null) => void;

  history: GenerationTask[];
  pushToHistory: (task: GenerationTask) => void;
  clearHistory: () => void;
  removeFromHistory: (taskId: string) => void;
  updateHistoryTask: (task: GenerationTask) => void;

  presets: Preset[];
  savePreset: (name: string, description: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;

  vramProfile: VramProfile;
  setVramProfile: (profile: VramProfile) => void;
}

export const useGenerationStore = create<GenerationStore>()(
  persist(
    (set, get) => ({
      params: { ...DEFAULT_PARAMS },
      setParam: (key, value) =>
        set((state) => ({ params: { ...state.params, [key]: value } })),
      setParams: (patch) =>
        set((state) => ({ params: { ...state.params, ...patch } })),
      resetParams: () => set({ params: { ...DEFAULT_PARAMS } }),

      currentTask: null,
      setCurrentTask: (task) => set({ currentTask: task }),

      history: [],
      pushToHistory: (task) =>
        set((state) => {
          // Если задача уже есть — обновляем, иначе добавляем в начало
          const existing = state.history.findIndex((t) => t.task_id === task.task_id);
          if (existing >= 0) {
            const updated = [...state.history];
            updated[existing] = task;
            return { history: updated };
          }
          return { history: [task, ...state.history].slice(0, 50) };
        }),
      clearHistory: () => set({ history: [] }),
      removeFromHistory: (taskId) =>
        set((state) => ({
          history: state.history.filter((t) => t.task_id !== taskId),
        })),
      updateHistoryTask: (task) =>
        set((state) => ({
          history: state.history.map((t) =>
            t.task_id === task.task_id ? task : t,
          ),
        })),

      presets: [],
      savePreset: (name, description) => {
        const preset: Preset = {
          id: `preset-${Date.now()}`,
          name,
          description,
          tags: [],
          params: { ...get().params },
          created_at: Date.now(),
        };
        set((state) => ({ presets: [...state.presets, preset] }));
      },
      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (preset) set((state) => ({ params: { ...state.params, ...preset.params } }));
      },
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),

      vramProfile: '22gb',
      setVramProfile: (vramProfile) => set({ vramProfile }),
    }),
    {
      name: STORAGE_KEYS.GENERATION_STORE,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        params: {
          ...state.params,
          // File objects не сериализуются в localStorage
          reference_audio: undefined,
          src_audio: undefined,
        },
        history: state.history,
        presets: state.presets,
        vramProfile: state.vramProfile,
      }),
    },
  ),
);