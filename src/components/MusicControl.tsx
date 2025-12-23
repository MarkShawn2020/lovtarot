import { TTSControl, BGMControl } from './audio'

export function MusicControl() {
  return (
    // 移动端隐藏，音频控制在底部 tab bar 中
    <div className="hidden sm:flex fixed left-4 bottom-4 z-50 flex-col items-start gap-2">
      <TTSControl />
      <BGMControl />
    </div>
  )
}
