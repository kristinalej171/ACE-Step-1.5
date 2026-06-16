import * as React from 'react';
import {
  type FieldValues,
  useController,
  type UseControllerProps,
} from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps<T extends FieldValues>
  extends UseControllerProps<T> {
  label: string;
  description?: string;
  error?: string;
  children: (props: {
    value: any;
    onChange: (value: any) => void;
    onBlur: () => void;
    error?: string;
  }) => React.ReactNode;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  description,
  error: externalError,
  children,
}: FormFieldProps<T>) {
  const { field, fieldState } = useController({ name, control, rules });
  const error = externalError ?? fieldState.error?.message;

  const labelId = `field-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={labelId} className="flex items-center gap-1.5">
        {label}
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="start" sideOffset={6}>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>
      {children({
        value: field.value,
        onChange: field.onChange,
        onBlur: field.onBlur,
        error,
      })}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SliderFieldProps<T extends FieldValues> extends UseControllerProps<T> {
  label: string;
  description?: string;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
}

export function SliderField<T extends FieldValues>({
  name,
  control,
  rules,
  label,
  description,
  min,
  max,
  step = 1,
  formatValue = (v) => String(v),
}: SliderFieldProps<T>) {
  const { field } = useController({ name, control, rules });
  const value = Number(field.value) || 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          {label}
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="start" sideOffset={6}>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Label>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => field.onChange(parseFloat(e.target.value))}
        className={cn(
          'w-full h-2 rounded-lg appearance-none cursor-pointer',
          'bg-secondary accent-primary',
        )}
      />
    </div>
  );
}