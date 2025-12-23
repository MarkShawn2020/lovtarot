# Changelog

## 0.6.0

### Minor Changes

- 历史记录显示发起人头像与昵称

## 0.5.0

### Minor Changes

- feat(tts): 支持按段落流式 TTS + 音频缓存

  - StreamingTTS 支持按段落分割请求，边生成边播放
  - 添加 onAudioReady 回调，所有音频就绪后合并上传缓存
  - 修复 playTTS 缺少缓存回调的问题

## 0.4.0

### Minor Changes

- - feat(profile): 完善个人中心功能
  - feat(mobile): 重构移动端布局和底部导航
  - feat(dev): 添加 mock 模式加速开发调试

## 0.3.0

### Features

- **Reading**: Add confirmation ritual UI before AI reading starts (logged-in users)
- **UI**: Crystal ball animation with "开启解读" button for ceremonial experience
- **UI**: Mobile layout padding adjustment for better visibility

### Refactoring

- Refactored audio button and BGM service

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
