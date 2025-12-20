import { useState, useEffect, useCallback } from 'react'
import { playBGM, pauseBGM, isBGMPlaying, setVolume, getVolume, initBGM, tryAutoPlay } from '../services/bgm'

export function MusicControl() {
  const [playing, setPlaying] = useState(false)
  const [vol, setVol] = useState(0.15)
  const [showVolume, setShowVolume] = useState(false)

  useEffect(() => {
    initBGM()
    setPlaying(isBGMPlaying())
    setVol(getVolume())

    // 首次用户交互后尝试自动播放
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

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVol(v)
    setVolume(v)
  }, [])

  return (
    <div
      className="fixed left-4 bottom-4 z-50 flex items-center gap-2"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <button
        onClick={handleToggle}
        className="w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary border border-border
                   flex items-center justify-center transition-all shadow-sm hover:shadow"
        title={playing ? '暂停音乐' : '播放音乐'}
      >
        {playing ? (
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5v-9l7 4.5-7 4.5z"/>
          </svg>
        )}
      </button>

      {showVolume && (
        <div className="bg-secondary/90 px-3 py-2 rounded-full border border-border shadow">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={handleVolume}
            className="w-20 h-1 accent-primary cursor-pointer"
          />
        </div>
      )}
    </div>
  )
}
