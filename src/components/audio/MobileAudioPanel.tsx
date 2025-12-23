import { useState, useEffect, useCallback } from 'react'
import { hasTTS, playTTS, pauseTTS, resumeTTS, stopTTS, getTTSState, subscribeTTS, setTTSVolume, getTTSVolume, type TTSState } from '../../services/tts-control'
import { playBGM, pauseBGM, stopBGM, isBGMPlaying, setVolume as setBGMVolume, getVolume as getBGMVolume, initBGM, tryAutoPlay } from '../../services/bgm'
import { PlayIcon, PauseIcon, StopIcon, SpeakerIcon } from './AudioButton'

interface MobileAudioPanelProps {
  open: boolean
  onClose: () => void
}

export function MobileAudioPanel({ open, onClose }: MobileAudioPanelProps) {
  // TTS state
  const [ttsState, setTtsState] = useState<TTSState>('idle')
  const [ttsAvailable, setTtsAvailable] = useState(false)
  const [ttsVolume, setTtsVolumeState] = useState(1)

  // BGM state
  const [bgmPlaying, setBgmPlaying] = useState(false)
  const [bgmVolume, setBgmVolumeState] = useState(0.3)

  useEffect(() => {
    // TTS init
    const updateTTS = (state: TTSState) => {
      setTtsAvailable(hasTTS())
      setTtsState(state)
    }
    setTtsAvailable(hasTTS())
    setTtsState(getTTSState())
    setTtsVolumeState(getTTSVolume())
    const unsubscribe = subscribeTTS(updateTTS)
    const interval = setInterval(() => setTtsAvailable(hasTTS()), 500)

    // BGM init
    initBGM()
    setBgmPlaying(isBGMPlaying())
    setBgmVolumeState(getBGMVolume())

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  // TTS handlers
  const handleTTSAction = useCallback(() => {
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

  const handleTTSVolumeChange = useCallback((v: number) => {
    setTtsVolumeState(v)
    setTTSVolume(v)
  }, [])

  // BGM handlers
  const handleBGMToggle = useCallback(() => {
    if (bgmPlaying) {
      pauseBGM()
      setBgmPlaying(false)
    } else {
      playBGM().then(() => setBgmPlaying(isBGMPlaying()))
    }
  }, [bgmPlaying])

  const handleBGMStop = useCallback(() => {
    stopBGM()
    setBgmPlaying(false)
  }, [])

  const handleBGMVolumeChange = useCallback((v: number) => {
    setBgmVolumeState(v)
    setBGMVolume(v)
  }, [])

  // Auto-play BGM on first interaction
  useEffect(() => {
    if (open) {
      tryAutoPlay().then(() => setBgmPlaying(isBGMPlaying()))
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border p-4 animate-in slide-in-from-bottom-4 duration-200">
        <div className="max-w-md mx-auto space-y-4">
          {/* BGM Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBGMToggle}
              className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
              title={bgmPlaying ? '暂停音乐' : '播放音乐'}
            >
              {bgmPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            {bgmPlaying && (
              <button
                onClick={handleBGMStop}
                className="w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
                title="停止音乐"
              >
                <StopIcon />
              </button>
            )}
            <span className="text-sm text-muted-foreground w-12">BGM</span>
            <div className="flex-1 flex items-center gap-2">
              <SpeakerIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => handleBGMVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* TTS Control - only show when available */}
          {ttsAvailable && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleTTSAction}
                className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary active:scale-95 transition-all"
                title={ttsState === 'idle' ? '开始播报' : ttsState === 'playing' ? '暂停播报' : '继续播报'}
              >
                {ttsState === 'playing' ? <PauseIcon /> : <SpeakerIcon />}
              </button>
              {ttsState === 'playing' && (
                <button
                  onClick={stopTTS}
                  className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary active:scale-95 transition-all"
                  title="停止播报"
                >
                  <StopIcon />
                </button>
              )}
              <span className="text-sm text-muted-foreground w-12">播报</span>
              <div className="flex-1 flex items-center gap-2">
                <SpeakerIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ttsVolume}
                  onChange={(e) => handleTTSVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 accent-primary cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// 音频图标 - 用于 tab bar
export const MusicIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)
