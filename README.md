<div align="center">
  <img src="./public/og.png" alt="Remixify Banner" width="100%">
  
  # 🎵 Remixify
  
  ### Transform Your Music with Professional Studio Effects
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Web Audio API](https://img.shields.io/badge/Web_Audio-API-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
  
   • [Report Bug](https://github.com/moazamtech/Remixify/issues) • [Request Feature](https://github.com/moazamtech/Remixify/issues)
  
</div>

---

## 🌟 Overview

**Remixify** is a powerful, browser-based audio studio that lets you transform your favorite tracks with professional-grade effects. Built with Next.js and the Web Audio API, it delivers a premium Spotify-inspired experience with real-time audio processing—no server required!

### ✨ Key Features

- 🎚️ **Slowed + Reverb** - Create atmospheric, dreamy lo-fi vibes
- ⚡ **Nightcore Mode** - Speed up tracks for high-energy remixes
- 🔊 **Bass Booster** - Add powerful sub-bass (±20dB range)
- 🎼 **Pitch Control** - Shift pitch ±12 semitones with lock option
- 🌊 **Advanced Reverb** - Customizable decay and mix controls
- 📊 **Real-time Waveform** - Visual feedback with interactive scrubbing
- 🎹 **Multi-Track Support** - Upload and manage multiple songs
- ⌨️ **Keyboard Controls** - Spacebar to play/pause
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 💾 **Export Options** - Download as WAV or MP3

---

## 🎨 UI Design

Remixify features a **premium Spotify-inspired dark theme** with:
- Glassmorphism effects
- Smooth animations and transitions
- Progressive blur on scroll
- Live audio visualizations
- Intuitive drag-and-drop interface

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern browser with Web Audio API support

### Installation

```bash
# Clone the repository
git clone https://github.com/moazamtech/Remixify.git

# Navigate to project directory
cd Remixify

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

---

## 📁 Project Structure

```
Remixify/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── audio-converter.tsx  # Main audio processing component
│   ├── download-modal.tsx   # Export modal
│   ├── processing-modal.tsx # Upload progress modal
│   ├── layout/
│   │   ├── sidebar.tsx      # Track library sidebar
│   │   └── player-bar.tsx   # Bottom playback controls
│   ├── elevenlabs/
│   │   ├── waveform.tsx     # Audio waveform visualizer
│   │   └── matrix.tsx       # VU meter visualization
│   └── ui/                  # Shadcn UI components
├── lib/
│   ├── audio-processor.ts   # Web Audio API processing logic
│   └── utils.ts             # Utility functions
├── public/
│   ├── og.png              # Open Graph image
│   └── logo.jpg            # App logo
└── README.md
```

---

## 🎛️ How It Works

### Audio Processing Pipeline

1. **Upload** - Files are decoded using Web Audio API
2. **Processing** - Effects are applied in real-time:
   ```
   Source → Bass Filter → Dry/Wet Gain → Reverb → Master Gain → Output
   ```
3. **Playback** - Processed audio plays with visual feedback
4. **Export** - Offline rendering creates downloadable files

### Effect Chain

```typescript
// Bass Booster (Low-shelf filter at 200Hz)
bassFilter.type = "lowshelf";
bassFilter.gain.value = settings.bassGain; // -10 to +20 dB

// Reverb (Convolver with custom impulse response)
reverb.buffer = generateImpulseResponse(decay, duration);

// Tempo & Pitch (Playback rate manipulation)
source.playbackRate.value = tempo * Math.pow(2, pitch / 12);
```

---

## 🎹 Usage Guide

### Basic Workflow

1. **Upload Audio** - Click the upload zone or drag & drop files
2. **Select Preset** - Choose "Slowed + Reverb" or "Nightcore"
3. **Fine-tune** - Adjust tempo, pitch, reverb, and bass
4. **Play** - Click play or press Spacebar
5. **Export** - Download your remix as WAV or MP3

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `↑` | Increase volume |
| `↓` | Decrease volume |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Audio**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🎯 Features in Detail

### 🎚️ Slowed + Reverb
Perfect for creating lo-fi, chill vibes:
- Tempo: 0.85x (customizable 0.5x - 2.0x)
- Pitch: -2 semitones
- Reverb: 40% mix, 3s decay
- Bass: +5dB boost

### ⚡ Nightcore
High-energy, fast-paced remixes:
- Tempo: 1.25x
- Pitch: +4 semitones
- Reverb: 10% mix, 1s decay
- Bass: +2dB boost

### 🔊 Bass Booster
Professional low-end enhancement:
- Frequency: 200Hz (low-shelf)
- Range: -10dB to +20dB
- Real-time adjustment
- Visual dB indicator

---

## 📱 Responsive Design

Remixify is fully responsive across all devices:

- **Desktop** (1024px+): Full sidebar, 3-column grid layout
- **Tablet** (768px - 1023px): Collapsible sidebar, 2-column grid
- **Mobile** (< 768px): Slide-in sidebar, single column, touch-optimized

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by Spotify's premium dark UI
- Built with the amazing [Shadcn UI](https://ui.shadcn.com/) component library
- Audio processing powered by the Web Audio API
- Special thanks to the Next.js and React communities

---

## 📧 Contact

**Moazam Butt** - [@moazamtech](https://github.com/moazamtech)

Project Link: [https://github.com/moazamtech/Remixify](https://github.com/moazamtech/Remixify)

---

<div align="center">
  
  ### ⭐ Star this repo if you found it helpful!
  
  Made with ❤️ by [moazamtech](https://github.com/moazamtech)
  
</div>
