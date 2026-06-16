import { useGenerationStore } from '@/stores/generation.store';
import { PRESETS, getPresetById } from '@/config/presets';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { useToast } from '@/api/hooks';
import { Save, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function PresetSelector() {
  const { presets, savePreset, deletePreset, params, setParams } =
    useGenerationStore();
  const { push: pushToast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  const handleLoadPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = getPresetById(presetId) ?? presets.find((p) => p.id === presetId);
    if (!preset) return;
    setParams(preset.params);
    pushToast({
      title: 'Preset loaded',
      description: `Applied "${preset.name}"`,
    });
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      pushToast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a preset name',
      });
      return;
    }
    savePreset(newPresetName.trim(), newPresetDesc.trim());
    setSaveDialogOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
    pushToast({
      title: 'Preset saved',
      description: `"${newPresetName}" saved to localStorage`,
    });
  };

  const handleDeletePreset = (presetId: string) => {
    deletePreset(presetId);
    pushToast({
      title: 'Preset deleted',
      description: 'Preset removed from localStorage',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedPreset} onValueChange={handleLoadPreset}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Load preset..." />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex items-center gap-2">
                <span>{preset.name}</span>
                <div className="flex gap-1">
                  {preset.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                    >
                      <Tag className="h-2.5 w-2.5 mr-0.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </SelectItem>
          ))}
          {presets.length > 0 && (
            <>
              {PRESETS.length > 0 && <SelectItem value="divider" disabled>──────────</SelectItem>}
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{preset.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save as preset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save current settings as preset</DialogTitle>
            <DialogDescription>
              Your preset will be saved to browser localStorage.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preset-name">Preset name *</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="My custom preset"
                maxLength={50}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preset-desc">Description (optional)</Label>
              <Textarea
                id="preset-desc"
                value={newPresetDesc}
                onChange={(e) => setNewPresetDesc(e.target.value)}
                placeholder="Brief description of this preset..."
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-medium mb-1">Current settings preview:</p>
              <ul className="space-y-0.5 text-muted-foreground">
                <li>• Steps: {params.inference_steps}</li>
                <li>• CFG: {params.guidance_scale}</li>
                <li>• Duration: {params.duration ?? 'auto'}s</li>
                <li>• Format: {params.audio_format}</li>
                {params.dcw_enabled && <li>• DCW: {params.dcw_mode}</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}