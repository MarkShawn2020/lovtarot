# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Taluo (塔罗) - A tarot card reading web app with AI-powered interpretations and TTS voice playback.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4

## Commands

```bash
pnpm dev      # Start dev server (user runs this locally)
pnpm build    # TypeScript check + production build
pnpm lint     # ESLint
```

## Architecture

```
src/
├── App.tsx              # Main app with 3 states: input → drawing → reading
├── data/tarot.ts        # 78-card tarot deck (22 Major + 56 Minor Arcana)
├── services/
│   ├── ai.ts            # ZenMux API (OpenAI-compatible) for streaming AI readings
│   └── tts.ts           # Doubao TTS via WebSocket binary protocol (fallback: browser TTS)
└── components/
    ├── QuestionInput.tsx
    ├── CardDisplay.tsx   # Shows 3 cards (past/present/future)
    └── ReadingResult.tsx # Streams AI interpretation + TTS playback
```

## Key Patterns

- **AI Service**: Uses OpenAI SDK with ZenMux gateway (`services/ai.ts:4-8`)
- **TTS Service**: WebSocket binary protocol for Doubao, auto-fallback to browser SpeechSynthesis (`services/tts.ts`)
- **Theming**: Tailwind v4 with semantic colors defined in `@theme` block (`index.css:4-35`)
- **Design Style**: Warm academic (暖学术风格) - terracotta primary, warm beige backgrounds

## Environment Variables

Copy `.env.example` to `.env`:
- `VITE_ZENMUX_API_KEY` - Required for AI readings
- `VITE_DOUBAO_TTS_*` - Optional TTS config
