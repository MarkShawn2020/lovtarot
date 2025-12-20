# CLAUDE.md

你完成任务后不要 pnpm build，因为我在pnpm dev，你直接 tsc check 即可。

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

## Design System

This project uses **Lovstudio Warm Academic Style (暖学术风格)**

Reference complete design guide: file:///Users/mark/@lovstudio/design/design-guide.md

### Quick Rules
1. **禁止硬编码颜色**：必须使用 semantic 类名（如 `bg-primary`、`text-muted-foreground`）
2. **字体配对**：标题用 `font-serif`，正文用默认 `font-sans`
3. **圆角风格**：使用 `rounded-lg`、`rounded-xl`、`rounded-2xl`
4. **主色调**：陶土色（按钮/高亮）+ 暖米色背景 + 炭灰文字
5. **组件优先**：优先使用 shadcn/ui 组件

### Color Palette
- **Primary**: #CC785C (陶土色 Terracotta)
- **Background**: #F9F9F7 (暖米色 Warm Beige)
- **Foreground**: #181818 (炭灰色 Charcoal)
- **Border**: #D5D3CB

### Common Patterns
- 主按钮: `bg-primary text-primary-foreground hover:bg-primary/90`
- 卡片: `bg-card border border-border rounded-xl`
- 标题: `font-serif text-foreground`

## Key Patterns

- **AI Service**: Uses OpenAI SDK with ZenMux gateway (`services/ai.ts:4-8`)
- **TTS Service**: WebSocket binary protocol for Doubao (`services/tts.ts`)
- **Theming**: Tailwind v4 with semantic colors defined in `@theme` block (`index.css:4-35`)
- **Design Style**: Warm academic (暖学术风格) - terracotta primary, warm beige backgrounds

## Environment Variables

Copy `.env.example` to `.env`:
- `VITE_ZENMUX_API_KEY` - Required for AI readings
- `VITE_DOUBAO_TTS_*` - Optional TTS config
