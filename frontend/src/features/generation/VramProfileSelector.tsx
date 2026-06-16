import { useGenerationStore } from '@/stores/generation.store';
import { VRAM_PROFILES, applyVramProfileToParams } from '@/config/vram-profiles';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertCircle, Cpu, Gauge, MemoryStick } from 'lucide-react';

export function VramProfileSelector() {
  const vramProfile = useGenerationStore((s) => s.vramProfile);
  const setVramProfile = useGenerationStore((s) => s.setVramProfile);
  const setParams = useGenerationStore((s) => s.setParams);
  const params = useGenerationStore((s) => s.params);

  const handleProfileChange = (profile: '22gb' | '40gb') => {
    if (profile === vramProfile) return;
    const updated = applyVramProfileToParams(profile, params as unknown as Record<string, unknown>);
    setParams(updated);
    setVramProfile(profile);
  };

  const config = VRAM_PROFILES[vramProfile];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">VRAM Profile</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" align="end" className="max-w-xs">
            <p>
              Выбирайте профиль в зависимости от доступной видеопамяти.
              Настройки будут автоматически оптимизированы.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['22gb', '40gb'] as const).map((profile) => {
          const cfg = VRAM_PROFILES[profile];
          const active = profile === vramProfile;
          return (
            <Button
              key={profile}
              variant={active ? 'default' : 'outline'}
              className={cn(
                'h-auto flex-col items-start gap-1.5 py-3 text-left',
                active && 'ring-2 ring-primary ring-offset-2',
              )}
              onClick={() => handleProfileChange(profile)}
            >
              <div className="flex items-center gap-1.5 w-full">
                <MemoryStick className="h-4 w-4" />
                <span className="font-medium">{profile.toUpperCase()}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {cfg.label}
              </span>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {cfg.recommended_inference_steps} steps
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  max {cfg.max_duration}s
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
        <p className="font-medium">Active profile: {config.label}</p>
        <ul className="text-muted-foreground space-y-0.5">
          <li>• Model: {config.dit_model}</li>
          <li>• Backend: {config.backend.toUpperCase()}</li>
          {config.offload_to_cpu && <li>• CPU offload: enabled</li>}
          {config.quantization && <li>• Quantization: {config.quantization}</li>}
          <li>• Max batch: {config.max_batch_size}</li>
        </ul>
      </div>
    </div>
  );
}