export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

export const STORAGE_KEYS = {
  GENERATION_STORE: 'ace-step:generation-store',
  HISTORY: 'ace-step:history',
  PRESETS: 'ace-step:presets',
  VRAM_PROFILE: 'ace-step:vram-profile',
  THEME: 'ace-step:theme',
} as const;

export const MAX_HISTORY_ITEMS = 50;

export const DEFAULT_BATCH_SIZE = 1;
export const MAX_BATCH_SIZE = 8;

/** Поддерживаемые языки (ISO 639-1) */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'unknown', label: 'Auto / Unknown' },
] as const;

export const AUDIO_FORMATS = [
  { value: 'flac', label: 'FLAC (lossless)' },
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV (16-bit)' },
  { value: 'wav32', label: 'WAV (32-bit float)' },
  { value: 'opus', label: 'Opus' },
  { value: 'aac', label: 'AAC' },
] as const;

export const MP3_BITRATES = [
  { value: '128k', label: '128 kbps' },
  { value: '192k', label: '192 kbps' },
  { value: '256k', label: '256 kbps' },
  { value: '320k', label: '320 kbps' },
] as const;

export const MP3_SAMPLE_RATES = [
  { value: 44100, label: '44.1 kHz' },
  { value: 48000, label: '48 kHz' },
] as const;