import * as React from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadInputProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  accept?: string;
  placeholder?: string;
}

export function FileUploadInput({ value, onChange, accept, placeholder }: FileUploadInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        value && "p-4 border-solid bg-accent hover:bg-accent"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{value.name}</p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 bg-secondary rounded-full text-muted-foreground mb-2">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">Click to upload or drag & drop</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            {placeholder || 'Upload a file'}
          </p>
        </div>
      )}
    </div>
  );
}
