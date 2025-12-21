# Changelog

## 0.2.0

### Features

- **UI/UX**: Crystal ball charging animation during AI thinking phase
- **UI/UX**: Typewriter text effect synchronized with audio playback
- **TTS**: Audio caching with Supabase Storage and local blob fallback
- **TTS**: Streaming TTS with pause/resume controls
- **TTS**: Replay functionality for completed readings
- **Reading**: Improved state management with interrupt support
- **Storage**: Session data migrated from localStorage to Supabase

### Fixes

- TTS pause/stop buttons now work during first auto-play
- Audio URL properly syncs after regeneration
- Fixed local development TTS configuration
- Supabase Storage RLS policies for TTS audio bucket

### Refactoring

- Replaced console with consola for structured logging

## 0.1.0

Initial release with core tarot reading functionality.
