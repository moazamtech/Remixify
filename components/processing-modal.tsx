"use client";

import * as React from "react";
import { Loader2, Music2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ProcessingModalProps {
  open: boolean;
  progress: number;
  stage: "analyzing" | "processing" | "applying" | "finalizing";
}

const stageMessages = {
  analyzing: "Analyzing audio file...",
  processing: "Applying effects...",
  applying: "Mixing reverb...",
  finalizing: "Finalizing output...",
};

export function ProcessingModal({ open, progress, stage }: ProcessingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md bg-zinc-900 border-zinc-800"
      >
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-purple-500" />
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <DialogTitle className="text-xl text-white">
            Processing Audio
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {stageMessages[stage]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Progress value={progress} className="h-2 bg-zinc-800" />
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Progress</span>
            <span className="text-purple-400 font-medium">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Please wait, this may take a moment...</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
