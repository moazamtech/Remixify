"use client";

import * as React from "react";
import {
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  Play,
  Music2,
  Settings,
  Download,
  Plus,
  Trash2,
  Clock,
  Waves,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/layout/sidebar";
import { PlayerBar } from "@/components/layout/player-bar";
import { AudioScrubber } from "@/components/elevenlabs/waveform";
import { Matrix } from "@/components/elevenlabs/matrix";
import { ProcessingModal } from "@/components/processing-modal";
import { DownloadModal } from "@/components/download-modal";
import {
  AudioEffectSettings,
  PRESET_SLOWED_REVERB,
  PRESET_NIGHTCORE,
  decodeAudioFile,
  renderProcessedAudio,
  audioBufferToWav,
  formatTime,
  generateImpulseResponse,
} from "@/lib/audio-processor";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

type PresetType = "slowed" | "nightcore";
type ViewType = "landing" | "studio";

interface Track {
  id: string;
  file: File;
  buffer: AudioBuffer;
  name: string;
}

export function AudioConverter() {
  // App state
  const [view, setView] = React.useState<ViewType>("landing");

  // Audio state
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = React.useState<string | null>(
    null,
  );

  const currentTrack = React.useMemo(
    () => tracks.find((t) => t.id === currentTrackId) || null,
    [tracks, currentTrackId],
  );

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.8);

  // Effect state
  const [preset, setPreset] = React.useState<PresetType>("slowed");
  const [settings, setSettings] =
    React.useState<AudioEffectSettings>(PRESET_SLOWED_REVERB);
  const [pitchLock, setPitchLock] = React.useState(true);

  // Modal/Processing state
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingProgress, setProcessingProgress] = React.useState(0);
  const [processingStage, setProcessingStage] = React.useState<
    "analyzing" | "processing" | "applying" | "finalizing"
  >("analyzing");
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

  // Refs
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const pauseTimeRef = React.useRef<number>(0);
  const animationFrameRef = React.useRef<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getAudioContext = React.useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  // Handle file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStage("analyzing");

    // Stop current playback if uploading
    stopPlayback();

    const newTracks: Track[] = [];
    const totalFiles = uploadedFiles.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = uploadedFiles[i];
        setProcessingStage("analyzing");
        // Show partial progress based on which file we are on
        setProcessingProgress((i / totalFiles) * 100);

        const context = getAudioContext();
        const buffer = await decodeAudioFile(context, file);

        newTracks.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          buffer,
          name: file.name,
        });
      }

      setTracks((prev) => [...prev, ...newTracks]);
      if (newTracks.length > 0) {
        // Select the first of the newly uploaded tracks
        const firstTrack = newTracks[0];
        setCurrentTrackId(firstTrack.id);
        setDuration(firstTrack.buffer.duration);
        setCurrentTime(0);
        pauseTimeRef.current = 0;
        console.log("✅ Track uploaded and selected:", firstTrack.name);
      }
      setView("studio");
      setProcessingProgress(100);
      setProcessingStage("finalizing");
    } catch (error) {
      console.error("Error decoding audio:", error);
      alert("Failed to decode one or more audio files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateProgress = async (
    start: number,
    end: number,
    stage: "analyzing" | "processing" | "applying" | "finalizing",
  ) => {
    setProcessingStage(stage);
    const steps = 10;
    const increment = (end - start) / steps;
    for (let i = 0; i <= steps; i++) {
      setProcessingProgress(start + increment * i);
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  // Preset handling
  const handlePresetChange = (newPreset: PresetType) => {
    setPreset(newPreset);
    if (newPreset === "slowed") {
      setSettings(PRESET_SLOWED_REVERB);
    } else {
      setSettings(PRESET_NIGHTCORE);
    }
  };

  // Settings update
  const updateSetting = (key: keyof AudioEffectSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Playback controls
  const stopPlayback = React.useCallback(() => {
    console.log("⏹️ stopPlayback called");
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  }, []);

  const playAudio = React.useCallback(() => {
    console.log("🎵 playAudio called", {
      hasTrack: !!currentTrack,
      trackName: currentTrack?.name,
    });
    if (!currentTrack) {
      console.warn("❌ No current track to play");
      return;
    }

    const context = getAudioContext();
    if (context.state === "suspended") {
      context.resume();
    }

    const source = context.createBufferSource();
    source.buffer = currentTrack.buffer;

    const combinedRate = pitchLock
      ? settings.tempo
      : settings.tempo * Math.pow(2, settings.pitch / 12);
    source.playbackRate.value = combinedRate;

    const masterGain = context.createGain();
    masterGain.gain.value = volume;

    const dryGain = context.createGain();
    const wetGain = context.createGain();
    dryGain.gain.value = 1 - settings.reverbMix;
    wetGain.gain.value = settings.reverbMix;

    // Bass Booster Node
    const bassFilter = context.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = settings.bassGain;

    const reverb = context.createConvolver();
    reverb.buffer = generateImpulseResponse(
      context,
      settings.reverbDecay,
      settings.reverbDecay,
    );

    source.connect(bassFilter);
    bassFilter.connect(dryGain);
    bassFilter.connect(reverb);
    reverb.connect(wetGain);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(context.destination);

    sourceRef.current = source;
    gainNodeRef.current = masterGain;

    const offset = pauseTimeRef.current;
    startTimeRef.current = context.currentTime - offset / combinedRate;

    source.start(0, offset);
    console.log("✅ Audio source started", { offset, combinedRate });
    setIsPlaying(true);

    const updateTime = () => {
      if (!sourceRef.current) return;
      const elapsed =
        (context.currentTime - startTimeRef.current) * combinedRate;
      setCurrentTime(Math.min(elapsed, currentTrack.buffer.duration));

      if (elapsed < currentTrack.buffer.duration) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      } else {
        stopPlayback();
        pauseTimeRef.current = 0;
        setCurrentTime(0);
      }
    };
    animationFrameRef.current = requestAnimationFrame(updateTime);

    source.onended = () => {
      // Only reset if this is the active source
      if (sourceRef.current === source) {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
      }
    };
  }, [
    currentTrack,
    settings,
    volume,
    pitchLock,
    getAudioContext,
    stopPlayback,
  ]);

  const togglePlayback = React.useCallback(() => {
    console.log("🔄 togglePlayback called", { isPlaying, currentTime });
    if (isPlaying) {
      pauseTimeRef.current = currentTime;
      stopPlayback();
    } else {
      playAudio();
    }
  }, [isPlaying, currentTime, stopPlayback, playAudio]);

  const handleSeek = (time: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) stopPlayback();

    pauseTimeRef.current = time;
    setCurrentTime(time);

    if (wasPlaying) {
      // Small delay to ensure state is settled
      setTimeout(() => playAudio(), 10);
    }
  };

  const handleTrackSelect = (id: string) => {
    const track = tracks.find((t) => t.id === id);
    if (!track) return;

    stopPlayback();
    setCurrentTrackId(id);
    setDuration(track.buffer.duration);
    setCurrentTime(0);
    pauseTimeRef.current = 0;
    setView("studio");
    setShowMobileSidebar(false);
  };

  // Download
  const handleDownload = async (format: "wav" | "mp3") => {
    if (!currentTrack) return;
    setShowDownloadModal(false);
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStage("analyzing");

    try {
      await simulateProgress(0, 20, "analyzing");
      await simulateProgress(20, 60, "processing");

      const processed = await renderProcessedAudio(
        currentTrack.buffer,
        settings,
      );
      await simulateProgress(60, 90, "applying");

      const wavBlob = audioBufferToWav(processed);
      // For MP3, we would ideally encode here. For now, we provide the HQ WAV
      // but honor the user's extension choice if they prefer it for certain players.
      const blob =
        format === "wav"
          ? wavBlob
          : new Blob([wavBlob], { type: "audio/mpeg" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const originalName =
        currentTrack.name.replace(/\.[^/.]+$/, "") || "audio";
      const suffix = preset === "slowed" ? "_slowed_reverb" : "_nightcore";
      a.download = `${originalName}${suffix}.${format}`;

      await simulateProgress(90, 100, "finalizing");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear and reset
  const handleClear = () => {
    stopPlayback();
    setTracks([]);
    setCurrentTrackId(null);
    setCurrentTime(0);
    setDuration(0);
    setView("landing");
    pauseTimeRef.current = 0;
  };

  // Update volume in real-time without restarting playback
  React.useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Restart playback when settings change
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    // Skip on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    console.log("⚙️ Settings effect triggered", { isPlaying, settings });
    if (isPlaying) {
      const savedTime = currentTime;
      stopPlayback();
      pauseTimeRef.current = savedTime;
      const timer = setTimeout(() => playAudio(), 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.tempo,
    settings.pitch,
    settings.reverbMix,
    settings.reverbDecay,
    settings.bassGain,
    pitchLock,
  ]);

  // Spacebar control for play/pause
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (
        e.code === "Space" &&
        e.target instanceof HTMLElement &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [togglePlayback]);

  // Scroll visibility for progressive blur
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = Math.min(target.scrollTop / 200, 1);
    setScrollProgress(progress);
  };

  // Waveform data generation from actual audio buffer
  const waveformData = React.useMemo(() => {
    if (!currentTrack?.buffer) {
      return Array.from({ length: 120 }, () => 0.1 + Math.random() * 0.8);
    }

    const buffer = currentTrack.buffer;
    const channelData = buffer.getChannelData(0);
    const samples = 150; // Number of bars in waveform
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      const average = sum / blockSize;
      // Normalize to 0.1-1.0 range for visual appeal
      waveform.push(Math.min(1, Math.max(0.1, average * 3)));
    }

    return waveform;
  }, [currentTrack]);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar
        onUploadClick={() => fileInputRef.current?.click()}
        tracks={tracks.map((t) => ({ id: t.id, name: t.name }))}
        currentTrackId={currentTrackId || undefined}
        onTrackSelect={handleTrackSelect}
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out",
          showMobileSidebar
            ? "translate-x-0 flex"
            : "-translate-x-full md:flex",
        )}
      />

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-950">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-purple-900/40 via-purple-900/10 to-transparent pointer-events-none" />

        {/* Top Navigation with Progressive Blur */}
        <header
          className="h-16 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0 transition-all duration-300"
          style={{
            backgroundColor: `rgba(9, 9, 11, ${scrollProgress * 0.8})`,
            backdropFilter: `blur(${scrollProgress * 12}px)`,
            borderBottom: `1px solid rgba(255, 255, 255, ${scrollProgress * 0.05})`,
          }}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 rounded-full text-white md:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Music2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 rounded-full hover:bg-black/60 text-white hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 rounded-full hover:bg-black/60 text-white hidden md:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            {view === "studio" && (
              <div className="ml-0 md:ml-4 flex items-center bg-zinc-900/80 rounded-full px-4 py-1.5 border border-white/5 shadow-xl backdrop-blur-md">
                <Search className="w-4 h-4 text-zinc-400 mr-2" />
                <span className="text-xs md:text-sm text-zinc-400 truncate max-w-[120px] md:max-w-none">
                  Search tracks...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              className="text-white font-bold hover:scale-105 transition-transform text-xs md:text-sm"
            >
              Premium
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/40 rounded-full text-zinc-400"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-zinc-800">
              <Link href="https://github.com/moazamtech">
                <Image
                  src="/logo.jpg"
                  width={100}
                  height={100}
                  alt="Logo"
                  className="rounded-full"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div
          className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 z-10 scrollbar-hide"
          onScroll={handleScroll}
        >
          {view === "landing" ? (
            <div className="h-full flex flex-col pt-8">
              <div className="flex flex-col gap-2 mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    New Remaster Engine v2.0
                  </span>
                </div>
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-2">
                  Create Magic <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white">
                    With Your Music
                  </span>
                </h1>
                <p className="text-zinc-400 text-base md:text-xl max-w-2xl leading-relaxed">
                  The ultimate audio studio for Slowed + Reverb, Nightcore, and
                  Bass Boosted remixes. Upload your favorite tracks and
                  transform them with premium studio tools.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                <FeatureCard
                  title="Slowed + Reverb"
                  desc="Atmospheric, dreamy, and emotional. Perfect for lo-fi vibes."
                  icon={Clock}
                  color="purple"
                  active
                />
                <FeatureCard
                  title="Nightcore"
                  desc="High energy, fast-paced, and energetic. Get the party started."
                  icon={Zap}
                  color="pink"
                />
                <FeatureCard
                  title="Bass Booster"
                  desc="Heavy sub-bass, kick reinforcement, and low-end warmth."
                  icon={Waves}
                  color="blue"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full h-[200px] md:h-[300px] rounded-3xl border-2 border-dashed border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-600/20 transform group-hover:scale-110 transition-transform mb-6">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Ready to start?
                </h2>
                <p className="text-zinc-500 text-sm md:text-base px-4 text-center">
                  Drop audio files here or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="pt-8 flex flex-col gap-6 md:gap-8">
              {/* Studio Header */}
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-6 border-b border-zinc-800/50">
                <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl shadow-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-6 md:p-8 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Music2 className="w-16 h-16 md:w-24 md:h-24 text-white drop-shadow-2xl" />
                </div>
                <div className="flex flex-col gap-2 text-center md:text-left min-w-0 flex-1">
                  <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-400">
                    Current Session
                  </span>
                  <h1 className="text-3xl md:text-6xl font-black tracking-tighter truncate w-full">
                    {currentTrack?.name || "Untitled Track"}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-purple-500 overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100"
                          alt="Avatar"
                        />
                      </div>
                      <span className="text-xs md:text-sm font-bold">
                        Remixify Creator
                      </span>
                    </div>
                    <span className="text-zinc-500">•</span>
                    <span className="text-xs md:text-sm text-zinc-400">
                      {preset === "slowed" ? "Slowed + Reverb" : "Nightcore"}
                    </span>
                    <span className="text-zinc-500 hidden md:inline">•</span>
                    <span className="text-xs md:text-sm text-zinc-400 hidden md:inline">
                      {formatTime(duration)} duration
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 md:gap-6">
                  <Button
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-500 hover:bg-purple-600 hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Plus className="w-6 h-6 rotate-45" />
                    ) : (
                      <Play className="w-5 h-5 md:w-6 md:h-6 ml-1 fill-white" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white"
                    onClick={handleClear}
                  >
                    <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white"
                    onClick={() => setShowDownloadModal(true)}
                  >
                    <Download className="w-5 h-5 md:w-6 md:h-6" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/40 p-1 rounded-xl border border-white/5 w-full md:w-auto">
                  <Button
                    variant={preset === "slowed" ? "secondary" : "ghost"}
                    className={cn(
                      "flex-1 md:flex-none rounded-lg font-bold px-4 md:px-6 text-xs md:text-sm",
                      preset === "slowed" &&
                        "bg-white text-black hover:bg-white",
                    )}
                    onClick={() => handlePresetChange("slowed")}
                  >
                    Slowed
                  </Button>
                  <Button
                    variant={preset === "nightcore" ? "secondary" : "ghost"}
                    className={cn(
                      "flex-1 md:flex-none rounded-lg font-bold px-4 md:px-6 text-xs md:text-sm",
                      preset === "nightcore" &&
                        "bg-white text-black hover:bg-white",
                    )}
                    onClick={() => handlePresetChange("nightcore")}
                  >
                    Nightcore
                  </Button>
                </div>
              </div>

              {/* Main Studio Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                  {/* Waveform Visualization */}
                  <div className="bg-zinc-900/30 p-4 md:p-8 rounded-3xl border border-white/5 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                        <Waves className="w-5 h-5 text-purple-500" />
                        Studio Waveform
                      </h3>
                      <div className="flex items-center gap-4 text-[10px] md:text-sm font-mono text-zinc-500">
                        <span className="text-white">
                          {formatTime(currentTime)}
                        </span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-6">
                      <AudioScrubber
                        data={waveformData}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        height={120}
                        barWidth={3}
                        barGap={2}
                        barRadius={2}
                        activeColor="#a855f7"
                        inactiveColor="#3f3f46"
                        showHandle={true}
                      />

                      {/* Integrated Quick Bass Slider */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-purple-400">
                            <Zap className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Bass Booster
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded">
                            {settings.bassGain.toFixed(1)}dB
                          </span>
                        </div>
                        <Slider
                          value={[settings.bassGain]}
                          min={-10}
                          max={20}
                          step={0.5}
                          onValueChange={([v]) => updateSetting("bassGain", v)}
                          className="py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop Controls (Extra space) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/30 p-6 rounded-3xl border border-white/5">
                      <h4 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
                        Advanced Reverb
                      </h4>
                      <div className="space-y-8">
                        <ControlSlider
                          label="Decay Time"
                          value={settings.reverbDecay}
                          min={0.5}
                          max={8}
                          step={0.1}
                          unit="s"
                          onChange={(v) => updateSetting("reverbDecay", v)}
                        />
                        <ControlSlider
                          label="Mix Amount"
                          value={settings.reverbMix}
                          min={0}
                          max={1}
                          step={0.01}
                          percentage
                          onChange={(v) => updateSetting("reverbMix", v)}
                        />
                      </div>
                    </div>
                    <div className="bg-zinc-900/30 p-6 rounded-3xl border border-white/5">
                      <h4 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">
                        Tone & Pitch
                      </h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-bold">
                              Lock Pitch
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Maintain key while slowing
                            </span>
                          </div>
                          <Switch
                            checked={pitchLock}
                            onCheckedChange={setPitchLock}
                          />
                        </div>
                        <ControlSlider
                          label="Pitch Shift"
                          value={settings.pitch}
                          min={-12}
                          max={12}
                          step={1}
                          unit="st"
                          disabled={pitchLock}
                          onChange={(v) => updateSetting("pitch", v)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                  <div className="bg-zinc-900/30 p-6 rounded-3xl border border-white/5 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <h4 className="text-xs md:text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 relative z-10">
                      Master Speed
                    </h4>
                    <div className="flex flex-col gap-4 relative z-10">
                      <div className="flex items-center justify-center p-8 rounded-full border-4 border-purple-500/20 bg-black/40 relative">
                        <span className="text-4xl md:text-5xl font-black">
                          {settings.tempo.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[settings.tempo]}
                        min={0.5}
                        max={2}
                        step={0.01}
                        onValueChange={([v]) => updateSetting("tempo", v)}
                        className="mt-6"
                      />
                      <p className="text-center text-[10px] text-zinc-500 mt-2">
                        Adjust playback speed while preserving or shifting
                        pitch.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-full flex items-center justify-center gap-2 group transition-all shadow-xl shadow-white/5"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    EXPORT REMIX
                  </button>

                  <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 rounded-3xl border border-white/10">
                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-widest">
                      Studio Tip
                    </h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-wider">
                      Batch upload multiple files and switch between them in the
                      sidebar to keep your flow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <PlayerBar
          isPlaying={isPlaying}
          onTogglePlay={togglePlayback}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={setVolume}
          trackName={currentTrack?.name || "Ready to remix..."}
          presetName={preset === "slowed" ? "Slowed + Reverb" : "Nightcore"}
        />

        {/* Modals */}
        <ProcessingModal
          open={isProcessing}
          progress={processingProgress}
          stage={processingStage}
        />
        <DownloadModal
          open={showDownloadModal}
          onOpenChange={setShowDownloadModal}
          onDownload={handleDownload}
          fileName={currentTrack?.name.replace(/\.[^/.]+$/, "") || "audio"}
          effectType={preset === "slowed" ? "Slowed+Reverb" : "Nightcore"}
        />
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon: Icon,
  color,
  active = false,
}: {
  title: string;
  desc: string;
  icon: any;
  color: "purple" | "pink" | "blue";
  active?: boolean;
}) {
  const colors = {
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    blue: "bg-blue-500",
  };

  return (
    <div
      className={cn(
        "p-6 rounded-3xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group",
        active && "border-white/10 bg-zinc-900/60",
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
          colors[color],
        )}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
        {title}
      </h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  percentage,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  percentage?: boolean;
  disabled?: boolean;
  onChange: (val: number) => void;
}) {
  return (
    <div
      className={cn(
        "space-y-4",
        disabled && "opacity-40 grayscale pointer-events-none",
      )}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold text-zinc-400">{label}</Label>
        <span className="text-sm font-mono text-white">
          {percentage
            ? Math.round(value * 100) + "%"
            : value.toFixed(1) + (unit || "")}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
