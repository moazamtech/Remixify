"use client";

import * as React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume1,
  Volume2,
  VolumeX,
  Maximize2,
  Mic2,
  ListMusic,
  MonitorSpeaker,
  Heart,
  Music2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/audio-processor";
import { cn } from "@/lib/utils";

interface PlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  trackName?: string;
  presetName?: string;
}

export function PlayerBar({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  trackName = "No Track Selected",
  presetName = "Ready to remix",
}: PlayerBarProps) {
  return (
    <div className="h-24 bg-black border-t border-zinc-800/50 px-4 flex items-center justify-between gap-4">
      {/* Track Info */}
      <div className="flex items-center gap-4 min-w-[180px] w-[30%]">
        <div className="w-14 h-14 rounded-md bg-zinc-800 flex items-center justify-center overflow-hidden shadow-lg group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
          <Music2 className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-medium hover:underline cursor-pointer truncate">
            {trackName}
          </span>
          <span className="text-zinc-500 text-xs hover:underline cursor-pointer truncate">
            {presetName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white ml-2 hidden sm:flex"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center gap-2 max-w-[40%] w-full">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hidden sm:flex"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => onSeek(0)}
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </Button>
          <Button
            className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 transition-transform p-0 flex items-center justify-center"
            onClick={onTogglePlay}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => onSeek(duration)}
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hidden sm:flex"
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-zinc-500 min-w-[32px] text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative group h-4 flex items-center">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={([v]) => onSeek(v)}
              className="z-10"
            />
          </div>
          <span className="text-[10px] text-zinc-500 min-w-[32px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex items-center justify-end gap-3 min-w-[180px] w-[30%]">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hidden md:flex"
        >
          <Mic2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hidden md:flex"
        >
          <ListMusic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hidden lg:flex"
        >
          <MonitorSpeaker className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 w-32 group">
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex-1">
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onVolumeChange(v)}
              className="group-hover:opacity-100 opacity-80 transition-opacity"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
