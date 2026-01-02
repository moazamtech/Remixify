// Audio processing utilities for slowed+reverb and nightcore effects

export interface AudioEffectSettings {
  tempo: number; // 0.5 to 2.0 (1.0 = normal speed)
  pitch: number; // -12 to 12 semitones
  reverbMix: number; // 0 to 1 (dry to wet)
  reverbDecay: number; // 0.1 to 10 seconds
  bassGain: number; // -10 to 20 dB
}

export const PRESET_SLOWED_REVERB: AudioEffectSettings = {
  tempo: 0.85,
  pitch: -2,
  reverbMix: 0.4,
  reverbDecay: 3,
  bassGain: 5,
};

export const PRESET_NIGHTCORE: AudioEffectSettings = {
  tempo: 1.25,
  pitch: 4,
  reverbMix: 0.1,
  reverbDecay: 1,
  bassGain: 2,
};

export const PRESET_DEFAULT: AudioEffectSettings = {
  tempo: 1.0,
  pitch: 0,
  reverbMix: 0,
  reverbDecay: 2,
  bassGain: 0,
};

// Generate impulse response for reverb effect
export function generateImpulseResponse(
  audioContext: AudioContext,
  duration: number = 2,
  decay: number = 2
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Exponential decay with random noise
      channelData[i] =
        (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return impulse;
}

// Create reverb node with configurable parameters
export function createReverbNode(
  audioContext: AudioContext,
  decay: number = 2
): ConvolverNode {
  const convolver = audioContext.createConvolver();
  convolver.buffer = generateImpulseResponse(audioContext, decay, decay);
  return convolver;
}

// Apply pitch shift using playback rate (simple method)
// Note: This also changes speed. For independent pitch/tempo, use SoundTouchJS
export function applySimplePitchShift(
  source: AudioBufferSourceNode,
  semitones: number
): void {
  // Each semitone is a factor of 2^(1/12)
  const pitchRatio = Math.pow(2, semitones / 12);
  source.playbackRate.value = pitchRatio;
}

// Decode audio file to AudioBuffer
export async function decodeAudioFile(
  audioContext: AudioContext,
  file: File
): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Render processed audio to a new buffer (offline processing)
export async function renderProcessedAudio(
  originalBuffer: AudioBuffer,
  settings: AudioEffectSettings
): Promise<AudioBuffer> {
  // Calculate the new duration based on tempo
  const newDuration = originalBuffer.duration / settings.tempo;
  const newLength = Math.ceil(newDuration * originalBuffer.sampleRate);

  // Create offline context for rendering
  const offlineContext = new OfflineAudioContext(
    originalBuffer.numberOfChannels,
    newLength + originalBuffer.sampleRate * settings.reverbDecay, // Extra time for reverb tail
    originalBuffer.sampleRate
  );

  // Create source
  const source = offlineContext.createBufferSource();
  source.buffer = originalBuffer;

  // Apply tempo and pitch together (simple method using playbackRate)
  // For true independent control, we'd need SoundTouchJS with more complex setup
  const combinedRate = settings.tempo * Math.pow(2, settings.pitch / 12);
  source.playbackRate.value = combinedRate;

  // Create gain nodes for dry/wet mix
  const dryGain = offlineContext.createGain();
  const wetGain = offlineContext.createGain();
  dryGain.gain.value = 1 - settings.reverbMix;
  wetGain.gain.value = settings.reverbMix;

  // Create bass boost (lowshelf filter)
  const bassFilter = offlineContext.createBiquadFilter();
  bassFilter.type = "lowshelf";
  bassFilter.frequency.value = 200;
  bassFilter.gain.value = settings.bassGain;

  // Create reverb
  const reverb = offlineContext.createConvolver();
  reverb.buffer = generateImpulseResponse(
    offlineContext as unknown as AudioContext,
    settings.reverbDecay,
    settings.reverbDecay
  );

  // Connect nodes
  source.connect(bassFilter);
  bassFilter.connect(dryGain);
  bassFilter.connect(reverb);
  reverb.connect(wetGain);
  dryGain.connect(offlineContext.destination);
  wetGain.connect(offlineContext.destination);

  // Start and render
  source.start(0);
  return await offlineContext.startRendering();
}

// Convert AudioBuffer to WAV blob
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleave channels and write audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Format time in MM:SS format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
