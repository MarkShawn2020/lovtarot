import { useState, useEffect, useCallback } from 'react'
import { playBGM, pauseBGM, stopBGM, isBGMPlaying, setVolume, getVolume, initBGM, tryAutoPlay } from '../../services/bgm'
import { AudioButton, AudioControlGroup, PlayIcon, PauseIcon, StopIcon } from './AudioButton'

export function BGMControl() {
  const [playing, setPlaying] = useState(false)
  const [vol, setVol] = useState(0.15)

  useEffect(() => {
    initBGM()
    setPlaying(isBGMPlaying())
    setVol(getVolume())

    const handleInteraction = () => {
      tryAutoPlay().then(() => setPlaying(isBGMPlaying()))
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }

    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  const handleToggle = useCallback(() => {
    if (playing) {
      pauseBGM()
      setPlaying(false)
    } else {
      playBGM().then(() => setPlaying(isBGMPlaying()))
    }
  }, [playing])

  const handleStop = useCallback(() => {
    stopBGM()
    setPlaying(false)
  }, [])

  const handleVolumeChange = useCallback((v: number) => {
    setVol(v)
    setVolume(v)
  }, [])

  return (
    <AudioControlGroup volume={vol} onVolumeChange={handleVolumeChange}>
      <div className="flex items-center gap-1">
        <AudioButton
          variant="secondary"
          icon={playing ? <PauseIcon /> : <PlayIcon />}
          label="BGM"
          title={playing ? '暂停音乐' : '播放音乐'}
          onClick={handleToggle}
        />
        {playing && (
          <AudioButton
            variant="secondary"
            icon={<StopIcon />}
            iconOnly
            title="停止音乐"
            onClick={handleStop}
          />
        )}
      </div>
    </AudioControlGroup>
  )
}
