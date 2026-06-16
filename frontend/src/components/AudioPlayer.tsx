import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  src: string;
  title?: string;
  onEnded?: () => void;
}

export function AudioPlayer({ src, title, onEnded }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Сбрасываем стейт при смене трека до инициализации нового
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsReady(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(var(--muted-foreground) / 0.3)',
      progressColor: 'hsl(var(--primary))',
      cursorColor: 'hsl(var(--primary))',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      ws.setVolume(volume);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    // WaveSurfer.js events don't strictly type "seek", interaction is part of audioprocess/timeupdate mostly
    ws.on('timeupdate', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      onEnded?.();
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    ws.load(src);

    return () => {
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    if (wsRef.current && isReady) {
      wsRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted, isReady]);

  const togglePlayPause = () => {
    if (!wsRef.current || !isReady) return;
    wsRef.current.playPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {title && <h3 className="font-medium text-sm">{title}</h3>}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full"
          onClick={togglePlayPause}
          disabled={!isReady}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div ref={containerRef} className="w-full relative opacity-90 hover:opacity-100 transition-opacity" />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={([v]) => {
              if (v !== undefined) {
                setIsMuted(v === 0);
                setVolume(v);
              }
            }}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}