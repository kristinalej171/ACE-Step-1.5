import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import type { GenerationSchema } from '@/schemas/generation.schema';
import { FileUploadInput } from '@/components/forms/FileUploadInput';

export function BasicSection() {
  const { control, watch } = useFormContext<GenerationSchema>();
  const taskType = watch('task_type');

  const needsSrcAudio = ['cover', 'repaint', 'lego', 'extract', 'complete'].includes(taskType);
  const needsRefAudio = ['cover'].includes(taskType);
  const isRepaint = taskType === 'repaint';
  const isLego = taskType === 'lego';

  return (
    <div className="space-y-4">
      {/* ─── Task Specific Audio Inputs ─── */}
      {needsSrcAudio && (
        <FormField
          control={control}
          name="src_audio"
          label="Source Audio"
          description="Исходный трек для обработки (обязательно)."
        >
          {({ value, onChange }) => (
            <FileUploadInput
              value={value}
              onChange={onChange}
              accept="audio/*"
              placeholder="Drop source audio here or click to browse..."
            />
          )}
        </FormField>
      )}

      {needsRefAudio && (
        <FormField
          control={control}
          name="reference_audio"
          label="Reference Audio"
          description="Референсный трек для копирования стиля (опционально)."
        >
          {({ value, onChange }) => (
            <FileUploadInput
              value={value}
              onChange={onChange}
              accept="audio/*"
              placeholder="Drop reference audio here or click to browse..."
            />
          )}
        </FormField>
      )}

      {/* ─── Repaint Specific Range ─── */}
      {isRepaint && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="repainting_start"
            label="Repaint Start (sec)"
            description="С какой секунды начать перегенерацию."
          >
            {({ value, onChange }) => (
              <Input
                type="number"
                value={value ?? 0}
                onChange={(e) => onChange(Number(e.target.value))}
                min={0}
                step={0.1}
              />
            )}
          </FormField>
          <FormField
            control={control}
            name="repainting_end"
            label="Repaint End (sec)"
            description="До какой секунды перегенерировать (опционально)."
          >
            {({ value, onChange }) => (
              <Input
                type="number"
                value={value ?? ''}
                // ИСПРАВЛЕНО: Теперь если пусто, то отправляется undefined, чтобы не ломать Zod схему
                onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                min={0}
                step={0.1}
              />
            )}
          </FormField>
        </div>
      )}

      {/* ─── Lego Specific Track Name ─── */}
      {isLego && (
        <FormField
          control={control}
          name="track_name"
          label="Track Name (Lego)"
          description="Имя добавляемого трека/инструмента."
        >
          {({ value, onChange }) => (
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. Lead Guitar"
            />
          )}
        </FormField>
      )}

      {/* ─── Standard Inputs ─── */}
      <FormField
        control={control}
        name="caption"
        label="Caption"
        description="Описание стиля, жанра, инструментов, настроения."
      >
        {({ value, onChange }) => (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Upbeat electronic track with driving bass..."
            rows={3}
          />
        )}
      </FormField>

      <FormField
        control={control}
        name="lyrics"
        label="Lyrics"
        description="Используйте теги [Verse], [Chorus], [Bridge] для структуры."
      >
        {({ value, onChange }) => (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="[Verse 1]\n...\n[Chorus]\n..."
            rows={6}
            className="font-mono text-xs"
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="vocal_language"
          label="Vocal language"
          description="Язык вокала. 'Auto' — автоопределение."
        >
          {({ value, onChange }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <div className="flex items-end">
          <FormField control={control} name="instrumental" label="Instrumental">
            {({ value, onChange }) => (
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={value}
                  onCheckedChange={onChange}
                  aria-label="Instrumental"
                />
                <span className="text-sm text-muted-foreground">
                  {value ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </FormField>
        </div>
      </div>
    </div>
  );
}