import { TTSControl, BGMControl } from './audio'

export function MusicControl() {
  return (
    <div className="fixed left-4 bottom-4 z-50 flex flex-col items-start gap-2">
      <TTSControl />
      <BGMControl />
    </div>
  )
}
