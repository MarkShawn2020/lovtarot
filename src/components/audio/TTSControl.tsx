import { useState, useEffect, useCallback } from 'react'
import { hasTTS, playTTS, pauseTTS, resumeTTS, stopTTS, getTTSState, subscribeTTS, setTTSVolume, getTTSVolume, type TTSState } from '../../services/tts-control'
import { AudioButton, AudioControlGroup, PauseIcon, StopIcon, SpeakerIcon } from './AudioButton'

export function TTSControl() {
  const [ttsState, setTtsState] = useState<TTSState>('idle')
  const [available, setAvailable] = useState(false)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const updateTTS = (state: TTSState) => {
      setAvailable(hasTTS())
      setTtsState(state)
    }
    setAvailable(hasTTS())
    setTtsState(getTTSState())
    setVolume(getTTSVolume())
    const unsubscribe = subscribeTTS(updateTTS)
    const interval = setInterval(() => setAvailable(hasTTS()), 500)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleAction = useCallback(() => {
    switch (ttsState) {
      case 'idle':
        playTTS()
        break
      case 'playing':
        pauseTTS()
        break
      case 'paused':
        resumeTTS()
        break
    }
  }, [ttsState])

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v)
    setTTSVolume(v)
  }, [])

  if (!available) return null

  const icon = ttsState === 'playing' ? <PauseIcon /> : <SpeakerIcon />
  const label = ttsState === 'idle' ? '播报' : ttsState === 'playing' ? '暂停' : '继续'
  const title = ttsState === 'idle' ? '开始播报' : ttsState === 'playing' ? '暂停播报' : '继续播报'

  return (
    <AudioControlGroup volume={volume} onVolumeChange={handleVolumeChange}>
      <div className="flex items-center gap-1">
        <AudioButton
          variant="primary"
          icon={icon}
          label={label}
          title={title}
          onClick={handleAction}
        />
        {ttsState === 'playing' && (
          <AudioButton
            variant="primary"
            icon={<StopIcon />}
            iconOnly
            title="停止播报"
            onClick={stopTTS}
          />
        )}
      </div>
    </AudioControlGroup>
  )
}
