"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function Waveform({
  audioBuffer,
  currentTime,
  duration,
  onSeek,
  className,
}: WaveformProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = React.useState<number[]>([]);

  // Generate waveform data from audio buffer
  React.useEffect(() => {
    if (!audioBuffer) {
      setWaveformData([]);
      return;
    }

    const channelData = audioBuffer.getChannelData(0);
    const samples = 150; // Number of bars
    const blockSize = Math.floor(channelData.length / samples);
    const dataPoints: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      dataPoints.push(sum / blockSize);
    }

    // Normalize
    const max = Math.max(...dataPoints);
    const normalized = dataPoints.map((d) => d / max);
    setWaveformData(normalized);
  }, [audioBuffer]);

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current || duration === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const seekTime = percent * duration;
    onSeek(seekTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioBuffer || waveformData.length === 0) {
    // Placeholder waveform
    return (
      <div
        className={cn(
          "relative h-16 flex items-center justify-center gap-[2px]",
          className
        )}
      >
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-muted-foreground/20"
            style={{
              height: `${20 + Math.random() * 60}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "relative h-16 flex items-center justify-center gap-[2px] cursor-pointer group",
        className
      )}
    >
      {waveformData.map((value, i) => {
        const barPercent = (i / waveformData.length) * 100;
        const isPlayed = barPercent < progressPercent;
        return (
          <div
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-colors",
              isPlayed
                ? "bg-purple-500"
                : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
            )}
            style={{
              height: `${Math.max(15, value * 100)}%`,
            }}
          />
        );
      })}
    </div>
  );
}
