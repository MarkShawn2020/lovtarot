<p align="center">
  <img src="docs/images/cover.png" alt="Lovtarot Cover" width="100%">
</p>

<h1 align="center">
  <img src="assets/logo.svg" width="32" height="32" alt="Logo" align="top">
  Lovtarot 塔罗
</h1>

<p align="center">
  <strong>AI 驱动的塔罗牌占卜，支持语音朗读</strong><br>
  <sub>Web App</sub>
</p>

---

## Features

- **78-Card Tarot Deck** — Complete deck with 22 Major Arcana and 56 Minor Arcana
- **Three-Card Spread** — Past, Present, Future reading layout
- **AI Interpretation** — Streaming AI-powered readings via ZenMux API
- **Voice Narration** — Doubao TTS with intelligent sentence segmentation
- **Reading History** — Save and revisit past readings
- **Immersive Experience** — Starry background with ambient BGM

## Screenshots

<!-- TODO: Add screenshots -->

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
pnpm dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_ZENMUX_API_KEY` | Required for AI readings |
| `VITE_DOUBAO_TTS_*` | Optional TTS configuration |

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI
- **AI**: OpenAI SDK (via ZenMux gateway)
- **TTS**: Doubao WebSocket binary protocol

## License

MIT
