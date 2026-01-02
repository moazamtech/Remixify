"use client";

import * as React from "react";
import { Download, FileAudio, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (format: "wav" | "mp3") => void;
  fileName: string;
  effectType: string;
}

export function DownloadModal({
  open,
  onOpenChange,
  onDownload,
  fileName,
  effectType,
}: DownloadModalProps) {
  const [selectedFormat, setSelectedFormat] = React.useState<"wav" | "mp3">("wav");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-white/5 shadow-2xl overflow-hidden p-0 gap-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent pointer-events-none" />

        <DialogHeader className="p-6 pb-2 relative">
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            Export Studio Item
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2">
            Select your preferred quality and format for this session.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 relative">
          {/* File Info */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center">
                <FileAudio className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {fileName}_{effectType.toLowerCase().replace(/\s+/g, "_")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">High Fidelity</span>
                  <span className="text-[10px] text-zinc-500 tracking-wider uppercase">{effectType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Audio Format</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedFormat("wav")}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group/btn",
                  selectedFormat === "wav"
                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5"
                    : "border-white/5 bg-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-base font-black transition-colors", selectedFormat === "wav" ? "text-white" : "text-zinc-400 group-hover/btn:text-zinc-300")}>WAV</span>
                  {selectedFormat === "wav" && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center scale-110 shadow-lg shadow-purple-500/50">
                      <Check className="w-3 h-3 text-white stroke-[4]" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-500 group-hover/btn:text-zinc-400 transition-colors">
                  Lossless Master quality
                </p>
                <div className={cn("absolute bottom-0 left-0 h-1 transition-all duration-300 bg-purple-500", selectedFormat === "wav" ? "w-full" : "w-0")} />
              </button>

              <button
                onClick={() => setSelectedFormat("mp3")}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group/btn",
                  selectedFormat === "mp3"
                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5"
                    : "border-white/5 bg-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-base font-black transition-colors", selectedFormat === "mp3" ? "text-white" : "text-zinc-400 group-hover/btn:text-zinc-300")}>MP3</span>
                  {selectedFormat === "mp3" && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center scale-110 shadow-lg shadow-purple-500/50">
                      <Check className="w-3 h-3 text-white stroke-[4]" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-zinc-500 group-hover/btn:text-zinc-400 transition-colors">
                  Standard web-ready
                </p>
                <div className={cn("absolute bottom-0 left-0 h-1 transition-all duration-300 bg-purple-500", selectedFormat === "mp3" ? "w-full" : "w-0")} />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center sm:justify-between w-full">
          <p className="text-[10px] items-center gap-1.5 hidden sm:flex text-zinc-500 uppercase tracking-widest font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Studio Ready
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-zinc-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onDownload(selectedFormat)}
              className="flex-1 sm:flex-none bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-xl shadow-xl shadow-white/5"
            >
              Start Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
