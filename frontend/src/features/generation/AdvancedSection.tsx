import { useFormContext } from 'react-hook-form';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { FormField, SliderField } from '@/components/forms/FormField';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AUDIO_FORMATS, MP3_BITRATES, MP3_SAMPLE_RATES,
} from '@/lib/constants';
import type { GenerationSchema } from '@/schemas/generation.schema';

export function AdvancedSection() {
  const { watch } = useFormContext<GenerationSchema>();
  const audioFormat = watch('audio_format');

  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="metadata">
        <AccordionTrigger>Metadata</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <MetadataFields />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="dit">
        <AccordionTrigger>DiT Parameters</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <DitFields />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="dcw">
        <AccordionTrigger>DCW (Dynamic Condition Weighting)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <DcwFields />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="flow-edit">
        <AccordionTrigger>Flow Edit (Morph) & Retake</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <FlowEditRetakeFields />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="lm">
        <AccordionTrigger>LM (Language Model)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <LmFields />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="output">
        <AccordionTrigger>Output</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <OutputFields audioFormat={audioFormat} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MetadataFields() {
  const { control } = useFormContext<GenerationSchema>();
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={control}
        name="bpm"
        label="BPM"
        description="Beats per minute (30–300)"
      >
        {({ value, onChange }) => (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) =>
              onChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
            min={30}
            max={300}
          />
        )}
      </FormField>

      <FormField
        control={control}
        name="keyscale"
        label="Key / Scale"
        description="Например: C Major, Am, F# minor"
      >
        {({ value, onChange }) => (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </FormField>

      <FormField
        control={control}
        name="timesignature"
        label="Time signature"
        description="Например: 4, 3, 6"
      >
        {({ value, onChange }) => (
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </FormField>

      <FormField
        control={control}
        name="duration"
        label="Duration (sec)"
        description="10–600 секунд"
      >
        {({ value, onChange }) => (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) =>
              onChange(e.target.value === '' ? undefined : Number(e.target.value))
            }
            min={10}
            max={600}
          />
        )}
      </FormField>
    </div>
  );
}

function DitFields() {
  const { control } = useFormContext<GenerationSchema>();
  return (
    <div className="space-y-4">
      <SliderField
        control={control}
        name="inference_steps"
        label="Inference steps"
        description="Больше шагов = лучше качество, но медленнее."
        min={1}
        max={200}
        step={1}
      />
      <SliderField
        control={control}
        name="guidance_scale"
        label="Guidance scale (CFG)"
        description="Сила следования промпту (1–15)."
        min={1}
        max={15}
        step={0.5}
      />
      <SliderField
        control={control}
        name="shift"
        label="Shift"
        description="Timestep shift (1–5)."
        min={1}
        max={5}
        step={0.1}
        formatValue={(v) => v.toFixed(1)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField control={control} name="infer_method" label="Infer method">
          {({ value, onChange }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ode">ODE (Euler)</SelectItem>
                <SelectItem value="sde">SDE (stochastic)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={control} name="sampler_mode" label="Sampler">
          {({ value, onChange }) => (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="euler">Euler</SelectItem>
                <SelectItem value="heun">Heun</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>
      </div>

      <SliderField
        control={control}
        name="cfg_interval_start"
        label="CFG interval start"
        min={0} max={1} step={0.05}
        formatValue={(v) => v.toFixed(2)}
      />
      <SliderField
        control={control}
        name="cfg_interval_end"
        label="CFG interval end"
        min={0} max={1} step={0.05}
        formatValue={(v) => v.toFixed(2)}
      />

      <FormField control={control} name="use_adg" label="Use ADG">
        {({ value, onChange }) => (
          <div className="flex items-center gap-2">
            <Switch checked={value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
          </div>
        )}
      </FormField>
    </div>
  );
}

function DcwFields() {
  const { control, watch } = useFormContext<GenerationSchema>();
  const dcwEnabled = watch('dcw_enabled');

  return (
    <div className="space-y-4">
      <FormField control={control} name="dcw_enabled" label="Enable DCW">
        {({ value, onChange }) => (
          <div className="flex items-center gap-2">
            <Switch checked={value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
          </div>
        )}
      </FormField>

      {dcwEnabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={control} name="dcw_mode" label="DCW Mode">
              {({ value, onChange }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField control={control} name="dcw_wavelet" label="DCW Wavelet">
              {({ value, onChange }) => (
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haar">Haar</SelectItem>
                    <SelectItem value="db2">db2</SelectItem>
                    <SelectItem value="db4">db4</SelectItem>
                    <SelectItem value="sym4">sym4</SelectItem>
                    <SelectItem value="sym8">sym8</SelectItem>
                    <SelectItem value="coif2">coif2</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <SliderField
            control={control}
            name="dcw_scaler"
            label="DCW Scaler"
            min={0} max={1} step={0.01}
            formatValue={(v) => v.toFixed(2)}
          />
          <SliderField
            control={control}
            name="dcw_high_scaler"
            label="DCW High Scaler"
            min={0} max={1} step={0.01}
            formatValue={(v) => v.toFixed(2)}
          />
        </>
      )}
    </div>
  );
}

function FlowEditRetakeFields() {
  const { control, watch } = useFormContext<GenerationSchema>();
  const flowEditMorph = watch('flow_edit_morph');

  return (
    <div className="space-y-4">
      {/* ─── Retake ─── */}
      <div className="border-b pb-4 mb-4">
        <h4 className="text-sm font-medium mb-3">Retake</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="retake_seed"
            label="Retake Seed (optional)"
          >
            {({ value, onChange }) => (
              <Input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              />
            )}
          </FormField>
          <SliderField
            control={control}
            name="retake_variance"
            label="Retake Variance"
            min={0} max={1} step={0.05}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      </div>

      {/* ─── Flow Edit ─── */}
      <h4 className="text-sm font-medium mb-3">Flow Edit</h4>
      <FormField control={control} name="flow_edit_morph" label="Enable Morph">
        {({ value, onChange }) => (
          <div className="flex items-center gap-2">
            <Switch checked={value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
          </div>
        )}
      </FormField>

      {flowEditMorph && (
        <>
          <FormField
            control={control}
            name="flow_edit_source_caption"
            label="Source Caption"
          >
            {({ value, onChange }) => (
              <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
            )}
          </FormField>
          <FormField
            control={control}
            name="flow_edit_source_lyrics"
            label="Source Lyrics"
          >
            {({ value, onChange }) => (
              <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
            )}
          </FormField>
          <SliderField
            control={control}
            name="flow_edit_n_min"
            label="Flow Edit N Min"
            min={0} max={1} step={0.05}
            formatValue={(v) => v.toFixed(2)}
          />
          <SliderField
            control={control}
            name="flow_edit_n_max"
            label="Flow Edit N Max"
            min={0} max={1} step={0.05}
            formatValue={(v) => v.toFixed(2)}
          />
          <SliderField
            control={control}
            name="flow_edit_n_avg"
            label="Flow Edit N Avg"
            min={0} max={5} step={0.1}
            formatValue={(v) => v.toFixed(1)}
          />
        </>
      )}
    </div>
  );
}


function LmFields() {
  const { control, watch } = useFormContext<GenerationSchema>();
  const thinking = watch('thinking');

  return (
    <div className="space-y-4">
      <FormField control={control} name="thinking" label="Thinking (LM)">
        {({ value, onChange }) => (
          <div className="flex items-center gap-2">
            <Switch checked={value} onCheckedChange={onChange} />
            <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
          </div>
        )}
      </FormField>

      {thinking && (
        <>
          <SliderField
            control={control}
            name="lm_temperature"
            label="LM temperature"
            min={0} max={2} step={0.05}
            formatValue={(v) => v.toFixed(2)}
          />
          <SliderField
            control={control}
            name="lm_cfg_scale"
            label="LM CFG scale"
            min={1} max={3} step={0.1}
            formatValue={(v) => v.toFixed(1)}
          />
          <FormField control={control} name="lm_negative_prompt" label="Negative prompt">
            {({ value, onChange }) => (
              <Input value={value} onChange={(e) => onChange(e.target.value)} />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField control={control} name="use_cot_metas" label="CoT Metas">
              {({ value, onChange }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </FormField>
            <FormField control={control} name="use_cot_caption" label="CoT Caption">
              {({ value, onChange }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </FormField>
            <FormField control={control} name="use_cot_lyrics" label="CoT Lyrics">
              {({ value, onChange }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </FormField>
            <FormField control={control} name="use_cot_language" label="CoT Language">
              {({ value, onChange }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </FormField>
            <FormField control={control} name="use_constrained_decoding" label="Constrained Decode">
              {({ value, onChange }) => (
                <div className="flex items-center gap-2">
                  <Switch checked={value} onCheckedChange={onChange} />
                  <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
                </div>
              )}
            </FormField>
          </div>
        </>
      )}
    </div>
  );
}

function OutputFields({ audioFormat }: { audioFormat: string }) {
  const { control } = useFormContext<GenerationSchema>();
  return (
    <div className="space-y-4">
      <FormField control={control} name="audio_format" label="Audio format">
        {({ value, onChange }) => (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUDIO_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      {audioFormat === 'mp3' && (
        <div className="grid grid-cols-2 gap-4">
          <FormField control={control} name="mp3_bitrate" label="MP3 bitrate">
            {({ value, onChange }) => (
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MP3_BITRATES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField control={control} name="mp3_sample_rate" label="Sample rate">
            {({ value, onChange }) => (
              <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MP3_SAMPLE_RATES.map((s) => (
                    <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
      )}
    </div>
  );
}