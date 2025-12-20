import { useState, useEffect, useCallback } from 'react'
import { playBGM, pauseBGM, isBGMPlaying, setVolume, getVolume, initBGM, tryAutoPlay } from '../services/bgm'
import { hasTTS, toggleTTS, isTTSSpeaking, subscribeTTS } from '../services/tts-control'

export function MusicControl() {
  const [playing, setPlaying] = useState(false)
  const [vol, setVol] = useState(0.15)
  const [showVolume, setShowVolume] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState(false)

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

  // 订阅 TTS 状态
  useEffect(() => {
    const updateTTS = () => {
      setTtsAvailable(hasTTS())
      setSpeaking(isTTSSpeaking())
    }
    updateTTS()
    const unsubscribe = subscribeTTS(updateTTS)
    // 定期检查 TTS 可用性
    const interval = setInterval(updateTTS, 500)
    return () => {
      unsubscribe()
      clearInterval(interval)
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
      className="fixed left-4 bottom-4 z-50 flex items-center gap-3"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* 语音播报控制 */}
      {ttsAvailable && (
        <button
          onClick={toggleTTS}
          className="h-8 px-3 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30
                     flex items-center gap-1.5 transition-all"
          title={speaking ? '停止播报' : '播放播报'}
        >
          {speaking ? (
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          )}
          <span className="text-xs text-primary font-medium">播报</span>
        </button>
      )}

      {/* BGM 控制 */}
      <button
        onClick={handleToggle}
        className="h-8 px-3 rounded-full bg-secondary/80 hover:bg-secondary border border-border
                   flex items-center gap-1.5 transition-all shadow-sm"
        title={playing ? '暂停音乐' : '播放音乐'}
      >
        {playing ? (
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
        <span className="text-xs text-muted-foreground">BGM</span>
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
